import { effect } from '@preact/signals-core';
import { handleError } from './error-handler.js';
import { getBindingCause } from './logging.js';

function initializeStructuralBindings(ctx, structuralBindings, mountApi) {
  for (const binding of structuralBindings) {
    initializeForBinding(ctx, binding, mountApi);
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
      retargetForwardedSignals(existingClone, itemSignals);
      continue;
    }

    block.clones.push(
      createStructuralClone(ctx, binding, itemSignals, block.clones.at(-1)?.rootEl, mountApi),
    );
  }

  for (let index = block.activeCount - 1; index >= nextLength; index -= 1) {
    finalizeStructuralCloneUnmount(block, block.clones[index], mountApi);
  }

  block.activeCount = nextLength;
}

function getForwardedSignalsForValue(value, binding) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(
      `HET Error: ${binding.dirName} item must be an object`,
      { cause: getBindingCause(binding, { signalName: binding.source }) },
    );
  }

  return value;
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
  };
}

function getClonedTemplateRoot(fragment) {
  return Array.from(fragment.childNodes).find((node) => node.nodeType === Node.ELEMENT_NODE);
}

function retargetForwardedSignals(clone, nextSignals) {
  const instance = clone.rootEl.__het_instance;

  for (const name of clone.forwardedNames) {
    instance.rawSignals[name].setTarget(nextSignals[name]);
  }
}

function destroyStructuralClone(clone, mountApi) {
  mountApi.destroyComponent(clone.rootEl);
  clone.rootEl.remove();
}

function destroyStructuralBlock(block, mountApi) {
  while (block.clones.length) {
    destroyStructuralClone(block.clones.pop(), mountApi);
  }

  block.activeCount = 0;
}

function finalizeStructuralCloneUnmount(block, clone, mountApi) {
  if (!clone) return;

  mountApi.destroyComponent(clone.rootEl);
  clone.rootEl.remove();

  const index = block.clones.indexOf(clone);
  if (index !== -1) {
    block.clones.splice(index, 1);
  }
}

export {
  initializeStructuralBindings,
};
