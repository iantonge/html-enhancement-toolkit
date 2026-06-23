import { computed, effect } from '@preact/signals-core';
import {
  ASSIGNMENT_SOURCE_TYPE,
  FUNC_SOURCE_TYPE,
  SIGNAL_SOURCE_TYPE,
} from './constants.js';
import { handleError } from './error-handler.js';
import {
  assertExpressionSignalsExist,
  getBindingInputValue,
  inferInputEvent,
} from './expressions.js';
import { getBindingCause } from './logging.js';

function initializeBindings(ctx, bindings, methods) {
  const runtimeBindings = getRuntimeBindings(bindings);

  for (const binding of runtimeBindings) {
    if (binding.sourceType === SIGNAL_SOURCE_TYPE) {
      configureSignalBinding(ctx, binding);
    } else if (binding.sourceType === FUNC_SOURCE_TYPE) {
      configureEventBinding(methods, binding, ctx.onCleanup);
    } else if (binding.sourceType === ASSIGNMENT_SOURCE_TYPE) {
      configureAssignmentBinding(ctx, binding);
    }
  }
}

function getRuntimeBindings(bindings) {
  const coordinatedBindings = new Map();
  const coordinatedAttrBindings = new Set();
  const coordinatedBoolBindings = new Set();

  for (const binding of bindings) {
    if (binding.sourceType !== SIGNAL_SOURCE_TYPE || binding.dirName !== 'het-attrs') {
      continue;
    }

    const boolBinding = bindings.find((candidate) => (
      candidate.sourceType === SIGNAL_SOURCE_TYPE &&
      candidate.dirName === 'het-bool-attrs' &&
      candidate.el === binding.el &&
      candidate.key === binding.key
    ));

    if (!boolBinding) continue;

    const coordinatedBinding = {
      dirName: 'het-attrs+het-bool-attrs',
      sourceType: SIGNAL_SOURCE_TYPE,
      attrBinding: binding,
      boolBinding,
    };

    coordinatedBindings.set(binding, coordinatedBinding);
    coordinatedAttrBindings.add(binding);
    coordinatedBoolBindings.add(boolBinding);
  }

  return bindings.flatMap((binding) => {
    if (coordinatedAttrBindings.has(binding)) {
      return [coordinatedBindings.get(binding)];
    }
    if (coordinatedBoolBindings.has(binding)) {
      return [];
    }
    return [binding];
  });
}

function configureEventBinding(methods, binding, onCleanup) {
  const handler = methods?.[binding.source];
  if (typeof handler !== 'function') {
    throw new Error(
      'HET Error: Missing component method',
      { cause: getBindingCause(binding, { methodName: binding.source }) },
    );
  }
  configureEventListener(
    binding,
    handler.bind(methods),
    onCleanup,
  );
}

function configureAssignmentBinding(ctx, binding) {
  if (!(binding.source in ctx.signals)) {
    throw new Error(
      'HET Error: Bound signal does not exist',
      { cause: getBindingCause(binding, { signalName: binding.source }) },
    );
  }
  const signalRef = ctx.signals[binding.source];
  assertExpressionSignalsExist(binding, ctx.signals);

  const listener = (event) => {
    try {
      signalRef.value = getBindingInputValue(ctx, binding, event);
    } catch (error) {
      handleError(error);
    }
  };

  configureEventListener(binding, listener, ctx.onCleanup);
}

function configureEventListener(binding, action, onCleanup) {
  const modifiers = binding.eventModifiers || {};
  const listenerState = {
    debounceTimer: undefined,
    lastThrottleTime: 0,
  };

  const runAction = (event) => {
    if (modifiers.debounce) {
      clearTimeout(listenerState.debounceTimer);
      listenerState.debounceTimer = setTimeout(() => action(event), modifiers.debounce);
      return;
    }

    if (modifiers.throttle) {
      const now = Date.now();
      if (now - listenerState.lastThrottleTime < modifiers.throttle) return;
      listenerState.lastThrottleTime = now;
    }

    action(event);
  };

  const listener = (event) => {
    if (!eventMatchesKeyModifier(event, modifiers.key)) return;

    if (modifiers.prevent) event.preventDefault();
    if (modifiers.stop) event.stopPropagation();

    runAction(event);
  };

  const listenerOptions = {
    capture: modifiers.capture,
    once: modifiers.once,
  };

  binding.el.addEventListener(binding.key, listener, listenerOptions);
  onCleanup(() => {
    clearTimeout(listenerState.debounceTimer);
    binding.el.removeEventListener(binding.key, listener, listenerOptions);
  });
}

function eventMatchesKeyModifier(event, keyModifier) {
  if (!keyModifier) return true;

  if (keyModifier === 'esc') {
    return event.key === 'Escape' || event.key === 'Esc';
  }
  if (keyModifier === 'enter') {
    return event.key === 'Enter';
  }
  if (keyModifier === 'space') {
    return event.key === ' ' || event.key === 'Spacebar';
  }

  return true;
}

function configureSignalBinding(ctx, binding) {
  if (binding.dirName === 'het-attrs+het-bool-attrs') {
    configureCoordinatedAttributeBinding(ctx, binding);
    return;
  }

  if (binding.dirName === 'het-bool-attrs') {
    configureBoolAttributeBinding(ctx, binding);
    return;
  }

  if (binding.expression) {
    assertExpressionSignalsExist(binding, ctx.signals);
    assertContextualBindingAllowed(ctx, binding);
  }

  if (!binding.expression && !(binding.source in ctx.signals)) {
    throw new Error(
      'HET Error: Bound signal does not exist',
      { cause: getBindingCause(binding, { signalName: binding.source }) },
    );
  }

  const boundSignal = binding.expression
    ? computed(() => binding.expression && getBindingInputValue(ctx, binding))
    : ctx.signals[binding.source];

  const dispose = effect(() => {
    try {
      binding.write(
        binding.el,
        binding.key,
        boundSignal.value,
        binding,
      );
    } catch (error) {
      handleError(error);
    }
  });
  ctx.onCleanup(dispose);

  if (binding.dirName === 'het-model') {
    const updateFromEl = () => {
      try {
        const nextValue = getBindingInputValue(ctx, binding);
        if (boundSignal.value !== nextValue) {
          boundSignal.value = nextValue;
        }
      } catch (error) {
        handleError(error);
      }
    };

    const eventName = inferInputEvent(binding.key);
    binding.el.addEventListener(eventName, updateFromEl);
    ctx.onCleanup(() => binding.el.removeEventListener(eventName, updateFromEl));
  }
}

function assertContextualBindingAllowed(ctx, binding) {
  if (!binding.expression?.hasContextuals) return;

  if (
    binding.expression.contextualNames.size === 1 &&
    binding.expression.contextualNames.has('$key') &&
    ctx.structuralContext &&
    'key' in ctx.structuralContext
  ) {
    return;
  }

  throw new Error(
    'HET Error: $key is only available inside het-for',
    { cause: getBindingCause(binding) },
  );
}

function configureBoolAttributeBinding(ctx, binding) {
  const initialValue = binding.el.getAttribute(binding.key);
  let storedValue = initialValue ?? '';

  configureSignalBindingEffect(ctx, binding, (value) => {
    if (value) {
      binding.el.setAttribute(binding.key, storedValue);
      return;
    }

    if (binding.el.hasAttribute(binding.key)) {
      storedValue = binding.el.getAttribute(binding.key) ?? '';
    }
    binding.el.removeAttribute(binding.key);
  });
}

function configureCoordinatedAttributeBinding(ctx, binding) {
  const { attrBinding, boolBinding } = binding;

  assertSignalBinding(ctx, attrBinding);
  assertSignalBinding(ctx, boolBinding);

  const attrSignal = getBoundSignal(ctx, attrBinding);
  const boolSignal = getBoundSignal(ctx, boolBinding);

  const dispose = effect(() => {
    try {
      const attrValue = attrSignal.value;
      const boolValue = boolSignal.value;

      if (boolValue) {
        attrBinding.el.setAttribute(attrBinding.key, String(attrValue));
      } else {
        attrBinding.el.removeAttribute(attrBinding.key);
      }
    } catch (error) {
      handleError(error);
    }
  });
  ctx.onCleanup(dispose);
}

function configureSignalBindingEffect(ctx, binding, write) {
  assertSignalBinding(ctx, binding);

  const boundSignal = getBoundSignal(ctx, binding);

  const dispose = effect(() => {
    try {
      write(boundSignal.value);
    } catch (error) {
      handleError(error);
    }
  });
  ctx.onCleanup(dispose);
}

function assertSignalBinding(ctx, binding) {
  if (binding.expression) {
    assertExpressionSignalsExist(binding, ctx.signals);
  }

  if (!binding.expression && !(binding.source in ctx.signals)) {
    throw new Error(
      'HET Error: Bound signal does not exist',
      { cause: getBindingCause(binding, { signalName: binding.source }) },
    );
  }
}

function getBoundSignal(ctx, binding) {
  return binding.expression
    ? computed(() => binding.expression && getBindingInputValue(ctx, binding))
    : ctx.signals[binding.source];
}

export {
  initializeBindings,
};
