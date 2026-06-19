import { effect } from '@preact/signals-core';
import {
  FOR_ATTR,
  PREACT_SIGNAL_BRAND,
} from './constants.js';
import { handleError } from './error-handler.js';
import { getBindingCause } from './logging.js';

let structuralUnmountDelay = 0;
const structuralUnmountClass = 'het-unmounting';

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
  const signalRef = ctx.signals[binding.source];
  if (!signalRef) {
    throw new Error(
      'HET Error: Bound signal does not exist',
      { cause: getBindingCause(binding, { signalName: binding.source }) },
    );
  }

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
  const signalRef = ctx.signals[binding.source];
  if (!signalRef) {
    throw new Error(
      'HET Error: Bound signal does not exist',
      { cause: getBindingCause(binding, { signalName: binding.source }) },
    );
  }

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
  };
}

function reconcileForBlock(ctx, binding, block, value, mountApi) {
  if (!Array.isArray(value)) {
    throw new Error(
      'HET Error: het-for source must be an array',
      { cause: getBindingCause(binding, { signalName: binding.source }) },
    );
  }

  const nextLength = value.length;
  for (let index = 0; index < nextLength; index += 1) {
    const itemSignals = getForwardedSignalsForValue(value[index], binding);
    const existingClone = block.clones[index];

    if (existingClone) {
      cancelStructuralCloneUnmount(existingClone);
      retargetForwardedSignals(existingClone, itemSignals, binding);
      continue;
    }

    block.clones.push(
      createStructuralClone(ctx, binding, itemSignals, block.clones.at(-1)?.rootEl, mountApi),
    );
  }

  for (let index = block.activeCount - 1; index >= nextLength; index -= 1) {
    scheduleStructuralCloneUnmount(block, block.clones[index], mountApi);
  }

  block.activeCount = nextLength;
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

function createStructuralClone(ctx, binding, importedSignals, previousRootEl, mountApi) {
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

  mountApi.mountComponent(rootEl, component.setup, { importedSignals });
  mountApi.mountComponents(rootEl);
  mountApi.removeMountPendingAttributes([rootEl]);

  return {
    rootEl,
    forwardedNames: Object.keys(importedSignals),
    pendingUnmountHandle: undefined,
    isPendingUnmount: false,
  };
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
}

function configureStructuralTeardown(config) {
  structuralUnmountDelay = config?.structuralUnmountDelay ?? structuralUnmountDelay;
}

function scheduleStructuralCloneUnmount(block, clone, mountApi) {
  if (!clone || clone.isPendingUnmount) return;

  const delay = getStructuralUnmountDelay();
  if (delay <= 0) {
    finalizeStructuralCloneUnmount(block, clone, mountApi);
    return;
  }

  clone.isPendingUnmount = true;
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
    clone.isPendingUnmount = false;
  }
}

function getStructuralUnmountDelay() {
  return structuralUnmountDelay;
}

export {
  configureStructuralTeardown,
  initializeStructuralBindings,
};
