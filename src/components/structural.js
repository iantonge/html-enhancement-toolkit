import { effect } from '@preact/signals-core';
import {
  FOR_ATTR,
  PREACT_SIGNAL_BRAND,
} from './constants.js';
import { handleError } from './error-handler.js';
import { getBindingCause } from './logging.js';

let structuralUnmountDelay = 0;
let structuralUnmountClass = 'het-unmounting';

function initializeStructuralBindings(ctx, structuralBindings, mountApi) {
  for (const binding of structuralBindings) {
    if (binding.dirName === FOR_ATTR) {
      initializeForBinding(ctx, binding, mountApi);
      continue;
    }

    initializeIfBinding(ctx, binding, mountApi);
  }
}

function initializeForBinding(ctx, binding, mountApi) {
  if (!(binding.source in ctx.signals)) {
    throw new Error(
      'HET Error: Bound signal does not exist',
      { cause: getBindingCause(binding, { signalName: binding.source }) },
    );
  }
  const signalRef = ctx.signals[binding.source];

  const block = createStructuralBlock(binding);
  const dispose = effect(() => {
    try {
      reconcileForBlock(ctx, binding, block, signalRef.value, mountApi);
    } catch (error) {
      handleError(error);
    }
  });

  ctx.onCleanup(() => {
    dispose();
    destroyStructuralBlock(block, mountApi);
  });
}

function initializeIfBinding(ctx, binding, mountApi) {
  if (!(binding.source in ctx.signals)) {
    throw new Error(
      'HET Error: Bound signal does not exist',
      { cause: getBindingCause(binding, { signalName: binding.source }) },
    );
  }
  const signalRef = ctx.signals[binding.source];

  const block = createStructuralBlock(binding);
  const dispose = effect(() => {
    try {
      reconcileIfBlock(ctx, binding, block, signalRef.value, mountApi);
    } catch (error) {
      handleError(error);
    }
  });

  ctx.onCleanup(() => {
    dispose();
    destroyStructuralBlock(block, mountApi);
  });
}

function createStructuralBlock(binding) {
  return {
    binding,
    clones: [],
    activeCount: 0,
    activeClonesByKey: new Map(),
    activeKeys: [],
    nextCloneId: 1,
  };
}

function reconcileForBlock(ctx, binding, block, value, mountApi) {
  if (!Array.isArray(value)) {
    throw new Error(
      'HET Error: het-for source must be an array',
      { cause: getBindingCause(binding, { signalName: binding.source }) },
    );
  }

  const nextItems = value.map((item) => getKeyedForItem(item, binding));
  const nextKeys = nextItems.map((item) => item.key);
  validateUniqueKeys(nextKeys, binding);

  const nextKeySet = new Set(nextKeys);
  for (const key of block.activeKeys) {
    if (!nextKeySet.has(key)) {
      const clone = block.activeClonesByKey.get(key);
      block.activeClonesByKey.delete(key);
      scheduleStructuralCloneUnmount(block, clone, mountApi);
    }
  }

  const orderedActiveClones = [];
  for (const item of nextItems) {
    let clone = block.activeClonesByKey.get(item.key);

    if (clone) {
      retargetForwardedSignals(clone, item.signals, binding);
    } else {
      clone = createStructuralClone(
        ctx,
        binding,
        item.signals,
        block.clones.at(-1)?.rootEl,
        mountApi,
        { key: item.key },
      );
      clone.key = item.key;
      clone.internalId = block.nextCloneId;
      block.nextCloneId += 1;
      block.clones.push(clone);
      block.activeClonesByKey.set(item.key, clone);
    }

    orderedActiveClones.push(clone);
  }

  orderForClones(binding, block, orderedActiveClones);
  block.activeKeys = nextKeys;
  block.activeCount = nextKeys.length;
}

function reconcileIfBlock(ctx, binding, block, value, mountApi) {
  if (!value) {
    if (block.clones[0]) {
      scheduleStructuralCloneUnmount(block, block.clones[0], mountApi);
    }
    block.activeCount = 0;
    return;
  }

  const itemSignals = getForwardedSignalsForValue(value, binding);
  if (block.clones[0]) {
    cancelStructuralCloneUnmount(block.clones[0]);
    retargetForwardedSignals(block.clones[0], itemSignals, binding);
    block.activeCount = 1;
    return;
  }

  block.clones.push(createStructuralClone(ctx, binding, itemSignals, undefined, mountApi));
  block.activeCount = 1;
}

function getKeyedForItem(value, binding) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(
      `HET Error: ${binding.dirName} item must be an object`,
      { cause: getBindingCause(binding, { signalName: binding.source }) },
    );
  }

  if (!Object.prototype.hasOwnProperty.call(value, binding.key)) {
    throw new Error(
      'HET Error: het-for key is missing',
      { cause: getBindingCause(binding, { signalName: binding.key }) },
    );
  }

  const itemKey = value[binding.key];
  if (typeof itemKey !== 'string' && typeof itemKey !== 'number') {
    throw new Error(
      'HET Error: het-for key must be a string or number',
      { cause: getBindingCause(binding, { signalName: binding.key }) },
    );
  }

  return {
    key: itemKey,
    signals: getForwardedSignalsForValue(value, binding),
  };
}

function validateUniqueKeys(keys, binding) {
  const seen = new Set();
  for (const key of keys) {
    if (seen.has(key)) {
      throw new Error(
        'HET Error: het-for keys must be unique',
        { cause: getBindingCause(binding, { signalName: binding.key }) },
      );
    }
    seen.add(key);
  }
}

function getForwardedSignalsForValue(value, binding) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(
      `HET Error: ${binding.dirName} item must be an object`,
      { cause: getBindingCause(binding, { signalName: binding.source }) },
    );
  }

  const entries = Object.entries(value);
  const signalsByName = Object.create(null);

  for (const [key, candidate] of entries) {
    if (key === binding.key) {
      continue;
    }

    if (candidate?.brand !== PREACT_SIGNAL_BRAND) {
      throw new Error(
        'HET Error: Structural item property must be a signal',
        { cause: getBindingCause(binding, { signalName: key }) },
      );
    }
    signalsByName[key] = candidate;
  }

  return signalsByName;
}

function createStructuralClone(
  ctx,
  binding,
  importedSignals,
  previousRootEl,
  mountApi,
  structuralContext,
) {
  const fragment = binding.el.content.cloneNode(true);
  const rootEl = getClonedTemplateRoot(fragment);
  const anchor = previousRootEl ? previousRootEl.nextSibling : binding.el.nextSibling;

  binding.el.parentNode.insertBefore(fragment, anchor);

  const component = mountApi.getMountableComponent(rootEl);
  if (!component) {
    throw new Error(
      'HET Error: Structural template root component is not registered',
      {
        cause: getBindingCause(binding, {
          structuralRootElement: rootEl,
          structuralRootComponentName: rootEl.getAttribute('het-component'),
        }),
      },
    );
  }

  mountApi.mountComponent(rootEl, component.setup, { importedSignals, structuralContext });
  mountApi.mountComponents(rootEl);
  mountApi.removeMountPendingAttributes([rootEl]);

  return {
    rootEl,
    forwardedNames: Object.keys(importedSignals),
    pendingUnmountHandle: undefined,
    isPendingUnmount: false,
    previousInert: undefined,
  };
}

function orderForClones(binding, block, orderedActiveClones) {
  const remainingActiveClones = orderedActiveClones.slice();
  const desiredClones = [];
  const placedClones = new Set();

  const placeActiveClonesThrough = (targetClone) => {
    while (remainingActiveClones.length) {
      const clone = remainingActiveClones.shift();
      if (placedClones.has(clone)) continue;

      desiredClones.push(clone);
      placedClones.add(clone);
      if (clone === targetClone) return;
    }
  };

  for (const clone of block.clones) {
    if (clone.isPendingUnmount) {
      desiredClones.push(clone);
      placedClones.add(clone);
      continue;
    }

    if (remainingActiveClones.includes(clone)) {
      placeActiveClonesThrough(clone);
    }
  }

  placeActiveClonesThrough();

  for (const clone of block.clones) {
    if (!placedClones.has(clone)) {
      desiredClones.push(clone);
      placedClones.add(clone);
    }
  }

  for (let index = 0; index < desiredClones.length; index += 1) {
    const clone = desiredClones[index];
    const previousRootEl = desiredClones[index - 1]?.rootEl;
    const anchor = previousRootEl ? previousRootEl.nextSibling : binding.el.nextSibling;
    if (clone.rootEl === anchor || clone.rootEl.nextSibling === anchor) {
      continue;
    }
    binding.el.parentNode.insertBefore(clone.rootEl, anchor);
  }

  block.clones = desiredClones;
}

function getClonedTemplateRoot(fragment) {
  return Array.from(fragment.childNodes).find((node) => node.nodeType === Node.ELEMENT_NODE);
}

function retargetForwardedSignals(clone, nextSignals, binding) {
  const instance = clone.rootEl.__het_instance;

  const nextNames = Object.keys(nextSignals);
  const previousNames = clone.forwardedNames;

  if (
    previousNames.length !== nextNames.length ||
    previousNames.some((name) => !Object.prototype.hasOwnProperty.call(nextSignals, name))
  ) {
    throw new Error(
      'HET Error: Structural clone signal shape changed',
      { cause: getBindingCause(binding, { signalName: binding.source }) },
    );
  }

  for (const name of nextNames) {
    instance.rawSignals[name].setTarget(nextSignals[name]);
  }
}

function destroyStructuralClone(clone, mountApi) {
  cancelStructuralCloneUnmount(clone);
  mountApi.destroyComponent(clone.rootEl);
  clone.rootEl.remove();
}

function destroyStructuralBlock(block, mountApi) {
  while (block.clones.length) {
    destroyStructuralClone(block.clones.pop(), mountApi);
  }

  block.activeCount = 0;
  block.activeClonesByKey.clear();
  block.activeKeys = [];
}

function configureStructuralTeardown(config) {
  structuralUnmountDelay = config?.structuralUnmountDelay ?? structuralUnmountDelay;
  structuralUnmountClass = config?.structuralUnmountClass ?? structuralUnmountClass;
}

function scheduleStructuralCloneUnmount(block, clone, mountApi) {
  if (!clone || clone.isPendingUnmount) return;

  const delay = getStructuralUnmountDelay(clone.rootEl);
  if (delay <= 0) {
    finalizeStructuralCloneUnmount(block, clone, mountApi);
    return;
  }

  clone.isPendingUnmount = true;
  clone.previousInert = clone.rootEl.inert;
  clone.rootEl.inert = true;
  if (structuralUnmountClass) {
    clone.rootEl.classList.add(structuralUnmountClass);
  }
  clone.pendingUnmountHandle = setTimeout(() => {
    finalizeStructuralCloneUnmount(block, clone, mountApi);
  }, delay);
}

function finalizeStructuralCloneUnmount(block, clone, mountApi) {
  if (!clone) return;

  cancelStructuralCloneUnmount(clone);
  mountApi.destroyComponent(clone.rootEl);
  clone.rootEl.remove();

  const index = block.clones.indexOf(clone);
  if (index !== -1) {
    block.clones.splice(index, 1);
  }
}

function cancelStructuralCloneUnmount(clone) {
  if (!clone) return;

  if (clone.pendingUnmountHandle !== undefined) {
    clearTimeout(clone.pendingUnmountHandle);
    clone.pendingUnmountHandle = undefined;
  }

  if (clone.isPendingUnmount) {
    if (structuralUnmountClass) {
      clone.rootEl.classList.remove(structuralUnmountClass);
    }
    if (clone.previousInert !== undefined) {
      clone.rootEl.inert = clone.previousInert;
      clone.previousInert = undefined;
    }
    clone.isPendingUnmount = false;
  }
}

function getStructuralUnmountDelay(rootEl) {
  const override = rootEl.getAttribute('het-unmount-delay');
  if (override === null) {
    return structuralUnmountDelay;
  }

  const parsedOverride = Number(override);
  return Number.isFinite(parsedOverride) ? parsedOverride : structuralUnmountDelay;
}

export {
  configureStructuralTeardown,
  initializeStructuralBindings,
};
