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
  for (const binding of bindings) {
    if (binding.sourceType === SIGNAL_SOURCE_TYPE) {
      configureSignalBinding(ctx, binding);
    } else if (binding.sourceType === FUNC_SOURCE_TYPE) {
      configureEventBinding(methods, binding, ctx.addCleanup);
    } else if (binding.sourceType === ASSIGNMENT_SOURCE_TYPE) {
      configureAssignmentBinding(ctx, binding);
    }
  }
}

function configureEventBinding(methods, binding, addCleanup) {
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
    addCleanup,
  );
}

function configureAssignmentBinding(ctx, binding) {
  const signalRef = ctx.signals[binding.source];
  if (!signalRef) {
    throw new Error(
      'HET Error: Bound signal does not exist',
      { cause: getBindingCause(binding, { signalName: binding.source }) },
    );
  }
  assertExpressionSignalsExist(binding, ctx.signals);

  const listener = (event) => {
    try {
      signalRef.value = getBindingInputValue(ctx, binding, event);
    } catch (error) {
      handleError(error);
    }
  };

  configureEventListener(binding, listener, ctx.addCleanup);
}

function configureEventListener(binding, action, addCleanup) {
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
  addCleanup(() => {
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
  if (binding.expression) {
    assertExpressionSignalsExist(binding, ctx.signals);
  }

  const boundSignal = binding.expression
    ? computed(() => binding.expression && getBindingInputValue(ctx, binding))
    : ctx.signals[binding.source];

  if (!boundSignal) {
    throw new Error(
      'HET Error: Bound signal does not exist',
      { cause: getBindingCause(binding, { signalName: binding.source }) },
    );
  }

  const dispose = effect(() => {
    try {
      binding.write(
        binding.el,
        binding.key,
        boundSignal.value,
      );
    } catch (error) {
      handleError(error);
    }
  });
  ctx.addCleanup(dispose);

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
    ctx.addCleanup(() => binding.el.removeEventListener(eventName, updateFromEl));
  }
}

export {
  initializeBindings,
};
