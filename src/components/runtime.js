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
import {
  recordMountCount,
  recordRuntimeDomWrite,
  recordRuntimeDomWriteAttempt,
  recordRuntimeDomWriteCoalesced,
  recordRuntimeDomWriteFlushed,
  recordRuntimeDomWriteQueued,
  recordRuntimeDomWriteSkip,
} from './metrics.js';

let initialWriteBatch;
let initialWriteBatchEnabled = false;
let groupedSignalEffectsEnabled = false;

function configureInitialRuntimeWriteBatch(config) {
  initialWriteBatchEnabled = config?.batchInitialWrites === true;
}

function configureGroupedSignalEffects(config) {
  groupedSignalEffectsEnabled = config?.groupSignalEffects === true;
}

function beginInitialRuntimeWriteBatch() {
  if (!initialWriteBatchEnabled) return undefined;

  if (initialWriteBatch) {
    initialWriteBatch.depth += 1;
    return false;
  }

  initialWriteBatch = {
    depth: 1,
    jobs: [],
    jobIndexesByElement: new WeakMap(),
    afterFlush: [],
  };
  return true;
}

function flushInitialRuntimeWriteBatch() {
  if (!initialWriteBatch) return;

  initialWriteBatch.depth -= 1;
  if (initialWriteBatch.depth > 0) return;

  const batch = initialWriteBatch;
  initialWriteBatch = undefined;

  for (const job of batch.jobs) {
    if (!job) continue;
    try {
      recordRuntimeDomWriteFlushed();
      job.write();
    } catch (error) {
      handleError(error);
    }
  }

  for (const callback of batch.afterFlush) {
    callback();
  }
}

function cancelInitialRuntimeWriteBatch() {
  initialWriteBatch = undefined;
}

function afterInitialRuntimeWriteBatchFlush(callback) {
  if (!initialWriteBatch) {
    callback();
    return;
  }

  initialWriteBatch.afterFlush.push(callback);
}

function initializeBindings(ctx, bindings, methods) {
  recordMountCount('runtimeBindingCount', bindings.length);
  if (!groupedSignalEffectsEnabled) {
    initializeBindingsWithoutGrouping(ctx, bindings, methods);
    return;
  }

  const signalBindingGroups = getSignalBindingGroups(bindings);

  for (const binding of bindings) {
    if (signalBindingGroups.configuredBindings.has(binding)) continue;

    if (signalBindingGroups.groupedBindings.has(binding)) {
      configureGroupedSignalBindings(ctx, signalBindingGroups.groupedBindings.get(binding));
    } else if (binding.sourceType === SIGNAL_SOURCE_TYPE) {
      configureSignalBinding(ctx, binding);
    } else if (binding.sourceType === FUNC_SOURCE_TYPE) {
      configureEventBinding(methods, binding, ctx.onCleanup);
    } else if (binding.sourceType === ASSIGNMENT_SOURCE_TYPE) {
      configureAssignmentBinding(ctx, binding);
    }
  }
}

function initializeBindingsWithoutGrouping(ctx, bindings, methods) {
  for (const binding of bindings) {
    if (binding.sourceType === SIGNAL_SOURCE_TYPE) {
      configureSignalBinding(ctx, binding);
    } else if (binding.sourceType === FUNC_SOURCE_TYPE) {
      configureEventBinding(methods, binding, ctx.onCleanup);
    } else if (binding.sourceType === ASSIGNMENT_SOURCE_TYPE) {
      configureAssignmentBinding(ctx, binding);
    }
  }
}

function getSignalBindingGroups(bindings) {
  const firstGroupByDependencyKey = new Map();
  const candidateGroups = [];
  const groupedBindings = new Map();
  const configuredBindings = new Set();

  for (const binding of bindings) {
    if (!isPotentialGroupedSignalBinding(binding)) continue;

    const dependencyNames = getSignalBindingDependencyNames(binding);
    const dependencyKey = getSignalBindingDependencyKey(binding);
    let group = firstGroupByDependencyKey.get(dependencyKey);
    if (!group) {
      group = {
        dependencyNames,
        bindings: [],
      };
      firstGroupByDependencyKey.set(dependencyKey, group);
    } else if (group.bindings.length === 1) {
      candidateGroups.push(group);
    }
    group.bindings.push(binding);
  }

  if (!candidateGroups.length) {
    recordMountCount('runtimeSignalEffectGroupCount', 0);
    recordMountCount('runtimeGroupedSignalBindingCount', 0);
    return { groupedBindings, configuredBindings };
  }

  const writeCounts = getBindingWriteCounts(bindings);

  for (const group of candidateGroups) {
    const safeBindings = group.bindings.filter((binding) =>
      writeCounts.get(getSignalBindingWriteIdentity(binding)) === 1,
    );
    if (safeBindings.length < 2) continue;

    const safeGroup = {
      dependencyNames: group.dependencyNames,
      bindings: safeBindings,
    };
    groupedBindings.set(safeBindings[0], safeGroup);
    for (let i = 1; i < safeBindings.length; i += 1) {
      configuredBindings.add(safeBindings[i]);
    }
  }

  recordMountCount('runtimeSignalEffectGroupCount', groupedBindings.size);
  recordMountCount('runtimeGroupedSignalBindingCount', configuredBindings.size + groupedBindings.size);
  return { groupedBindings, configuredBindings };
}

function getBindingWriteCounts(bindings) {
  const writeCounts = new Map();

  for (const binding of bindings) {
    if (!isPotentialGroupedSignalBinding(binding)) continue;
    const writeKey = getSignalBindingWriteIdentity(binding);
    writeCounts.set(writeKey, (writeCounts.get(writeKey) || 0) + 1);
  }

  return writeCounts;
}

function isPotentialGroupedSignalBinding(binding) {
  return (
    binding.sourceType === SIGNAL_SOURCE_TYPE &&
    binding.dirName !== 'het-model' &&
    binding.dirName !== 'het-bool-attrs' &&
    binding.dirName !== 'het-attrs+het-bool-attrs'
  );
}

function getSignalBindingWriteIdentity(binding) {
  if (!binding.__hetWriteIdentity) {
    binding.__hetWriteIdentity = `${getElementBindingId(binding.el)}:${getSignalBindingWriteCategory(binding)}:${binding.key}`;
  }
  return binding.__hetWriteIdentity;
}

const elementBindingIds = new WeakMap();
let nextElementBindingId = 1;

function getElementBindingId(el) {
  let id = elementBindingIds.get(el);
  if (!id) {
    id = nextElementBindingId;
    nextElementBindingId += 1;
    elementBindingIds.set(el, id);
  }
  return id;
}

function getSignalBindingDependencyNames(binding) {
  if (binding.expression) {
    return binding.expression.signalDependencyNames;
  }

  return [binding.source];
}

function getSignalBindingDependencyKey(binding) {
  return binding.expression
    ? binding.expression.signalDependencyKey
    : binding.source;
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

function configureGroupedSignalBindings(ctx, group) {
  for (const binding of group.bindings) {
    assertSignalBinding(ctx, binding);
    assertContextualBindingAllowed(ctx, binding);
  }

  recordMountCount('runtimeEffectCount');
  const dispose = effect(() => {
    readDependencySignals(ctx, group.dependencyNames);

    for (const binding of group.bindings) {
      try {
        writeSignalBindingValue(binding, getSignalBindingValue(ctx, binding));
      } catch (error) {
        handleError(error);
      }
    }
  });
  ctx.onCleanup(dispose);
}

function readDependencySignals(ctx, dependencyNames) {
  for (const name of dependencyNames) {
    ctx.signals[name].value;
  }
}

function getSignalBindingValue(ctx, binding) {
  return binding.expression
    ? getBindingInputValue(ctx, binding)
    : ctx.signals[binding.source].value;
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

  recordMountCount('runtimeEffectCount');
  const dispose = effect(() => {
    try {
      writeSignalBindingValue(binding, boundSignal.value);
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
    recordRuntimeDomWriteAttempt();
    queueOrRunBindingWrite(binding, 'bool-attr', () => {
      writeBoolAttributeBindingValue(binding, value, {
        get storedValue() {
          return storedValue;
        },
        set storedValue(nextValue) {
          storedValue = nextValue;
        },
      });
    });
  });
}

function writeBoolAttributeBindingValue(binding, value, storedValueRef) {
  if (value) {
    if (
      binding.el.hasAttribute(binding.key) &&
      binding.el.getAttribute(binding.key) === storedValueRef.storedValue
    ) {
      recordRuntimeDomWriteSkip();
      return;
    }
    binding.el.setAttribute(binding.key, storedValueRef.storedValue);
    recordRuntimeDomWrite();
    return;
  }

  if (!binding.el.hasAttribute(binding.key)) {
    recordRuntimeDomWriteSkip();
    return;
  }

  storedValueRef.storedValue = binding.el.getAttribute(binding.key) ?? '';
  binding.el.removeAttribute(binding.key);
  recordRuntimeDomWrite();
}

function configureCoordinatedAttributeBinding(ctx, binding) {
  const { attrBinding, boolBinding } = binding;

  assertSignalBinding(ctx, attrBinding);
  assertSignalBinding(ctx, boolBinding);

  const attrSignal = getBoundSignal(ctx, attrBinding);
  const boolSignal = getBoundSignal(ctx, boolBinding);

  recordMountCount('runtimeEffectCount');
  const dispose = effect(() => {
    try {
      const attrValue = attrSignal.value;
      const boolValue = boolSignal.value;

      recordRuntimeDomWriteAttempt();
      queueOrRunBindingWrite(attrBinding, 'coordinated-attr', () =>
        writeCoordinatedAttributeBindingValue(attrBinding, attrValue, boolValue),
      );
    } catch (error) {
      handleError(error);
    }
  });
  ctx.onCleanup(dispose);
}

function writeCoordinatedAttributeBindingValue(attrBinding, attrValue, boolValue) {
  if (boolValue) {
    const nextValue = String(attrValue);
    if (attrBinding.el.getAttribute(attrBinding.key) === nextValue) {
      recordRuntimeDomWriteSkip();
      return;
    }
    attrBinding.el.setAttribute(attrBinding.key, nextValue);
    recordRuntimeDomWrite();
  } else {
    if (!attrBinding.el.hasAttribute(attrBinding.key)) {
      recordRuntimeDomWriteSkip();
      return;
    }
    attrBinding.el.removeAttribute(attrBinding.key);
    recordRuntimeDomWrite();
  }
}

function configureSignalBindingEffect(ctx, binding, write) {
  assertSignalBinding(ctx, binding);

  const boundSignal = getBoundSignal(ctx, binding);

  recordMountCount('runtimeEffectCount');
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

function writeSignalBindingValue(binding, value) {
  recordRuntimeDomWriteAttempt();

  queueOrRunBindingWrite(binding, getSignalBindingWriteCategory(binding), () =>
    writeSignalBindingValueNow(binding, value),
  );
}

function writeSignalBindingValueNow(binding, value) {

  if (shouldSkipSignalBindingWrite(binding, value)) {
    recordRuntimeDomWriteSkip();
    return;
  }

  binding.write(
    binding.el,
    binding.key,
    value,
    binding,
  );
  recordRuntimeDomWrite();
}

function queueOrRunBindingWrite(binding, category, write) {
  if (!initialWriteBatch) {
    write();
    return;
  }

  recordRuntimeDomWriteQueued();
  const jobKey = `${category}:${binding.key}`;
  let jobIndexes = initialWriteBatch.jobIndexesByElement.get(binding.el);
  if (!jobIndexes) {
    jobIndexes = new Map();
    initialWriteBatch.jobIndexesByElement.set(binding.el, jobIndexes);
  }

  const existingIndex = jobIndexes.get(jobKey);
  const job = { write };
  if (existingIndex !== undefined) {
    initialWriteBatch.jobs[existingIndex] = job;
    recordRuntimeDomWriteCoalesced();
    return;
  }

  jobIndexes.set(jobKey, initialWriteBatch.jobs.length);
  initialWriteBatch.jobs.push(job);
}

function getSignalBindingWriteCategory(binding) {
  if (binding.dirName === 'het-attrs') return 'attr';
  if (binding.dirName === 'het-class') return 'class';
  if (binding.dirName === 'het-model') return 'model';
  return 'prop';
}

function shouldSkipSignalBindingWrite(binding, value) {
  if (binding.dirName === 'het-attrs') {
    return binding.el.getAttribute(binding.key) === String(value);
  }

  if (binding.dirName === 'het-class') {
    return binding.el.classList.contains(binding.key) === Boolean(value);
  }

  if (binding.dirName === 'het-model') {
    return binding.el[binding.key] === getExpectedModelPropertyValue(binding, value);
  }

  return binding.el[binding.key] === value;
}

function getExpectedModelPropertyValue(binding, value) {
  if (isCheckboxModelBinding(binding) && Array.isArray(value)) {
    return value.includes(getModelOptionValue(binding));
  }

  if (isRadioModelBinding(binding)) {
    return getModelOptionValue(binding) === value;
  }

  return value;
}

function isCheckboxModelBinding(binding) {
  return (
    binding.el instanceof HTMLInputElement &&
    binding.el.type === 'checkbox'
  );
}

function isRadioModelBinding(binding) {
  return (
    binding.el instanceof HTMLInputElement &&
    binding.el.type === 'radio'
  );
}

function getModelOptionValue(binding) {
  return coerceModelValue(binding.el.value, binding.modelType);
}

function coerceModelValue(rawValue, modelType) {
  if (modelType === 'int') {
    return parseInt(rawValue, 10);
  }
  if (modelType === 'float') {
    return parseFloat(rawValue);
  }
  if (modelType === 'bool') {
    return rawValue === true || rawValue === 'true';
  }
  return rawValue;
}

export {
  afterInitialRuntimeWriteBatchFlush,
  beginInitialRuntimeWriteBatch,
  cancelInitialRuntimeWriteBatch,
  configureGroupedSignalEffects,
  configureInitialRuntimeWriteBatch,
  flushInitialRuntimeWriteBatch,
  initializeBindings,
};
