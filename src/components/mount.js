import { signal } from '@preact/signals-core';
import { PREACT_SIGNAL_BRAND, STRUCTURAL_ATTRS } from './constants.js';
import {
  DIRECTIVE_ATTR_NAMES,
  DIRECTIVES_SELECTOR,
  STRUCTURAL_TEMPLATES_SELECTOR,
} from './directives.js';
import { scopedQuerySelectorAll, isComponentRoot } from './dom-scope.js';
import { handleError } from './error-handler.js';
import {
  getBindingInputValue,
  getModelGroupSeedValue,
  isModelGroupBinding,
} from './expressions.js';
import { createHetError, getComponentCause, getBindingCause } from './logging.js';
import { getMountableComponent } from './registry.js';
import { getBindings, getStructuralBindings } from './bindings/parse.js';
import {
  getImportDeclarations,
  initializeForwardedSignals,
  resolveImports,
} from './imports.js';
import { measureMountBucket, recordMountCount } from './metrics.js';
import {
  afterInitialRuntimeWriteBatchFlush,
  beginInitialRuntimeWriteBatch,
  cancelInitialRuntimeWriteBatch,
  flushInitialRuntimeWriteBatch,
  initializeBindings,
} from './runtime.js';
import { initializeStructuralBindings } from './structural.js';

const DIRECTIVE_ATTR_NAME_SET = new Set(DIRECTIVE_ATTR_NAMES);
const STRUCTURAL_ATTR_SET = new Set(STRUCTURAL_ATTRS);

function mountComponents(root) {
  const batchOwner = beginInitialRuntimeWriteBatch();
  const mountedComponents = [];

  try {
    const roots = measureMountBucket('discoverRoots', () => getComponentRoots(root));

    for (const el of roots) {
      mountComponentTree(el, mountedComponents);
    }

    if (batchOwner === true) {
      measureMountBucket('flushInitialRuntimeWrites', () => flushInitialRuntimeWriteBatch());
      measureMountBucket('removeMountPending', () => removeMountPendingAttributes(mountedComponents));
    } else if (batchOwner === false) {
      afterInitialRuntimeWriteBatchFlush(() => {
        measureMountBucket('removeMountPending', () => removeMountPendingAttributes(mountedComponents));
      });
      flushInitialRuntimeWriteBatch();
    } else {
      measureMountBucket('removeMountPending', () => removeMountPendingAttributes(mountedComponents));
    }
  } catch (error) {
    if (batchOwner === true) cancelInitialRuntimeWriteBatch();
    throw error;
  }
}

function mountComponentTree(rootEl, mountedComponents) {
  const scopedDom = measureMountBucket(
    'collectScopedDom',
    () => collectScopedComponentDom(rootEl),
  );

  try {
    const component = measureMountBucket(
      'componentLookup',
      () => getMountableComponent(rootEl),
    );
    if (!component) {
      throw new Error(
        'HET Error: Component is not registered',
        { cause: getComponentCause(rootEl) },
      );
    }

    if (mountComponent(rootEl, component.setup, { scopedDom })) {
      mountedComponents.push(rootEl);
      recordMountCount('mountedComponents');
    }
  } catch (error) {
    recordMountCount('failedComponents');
    handleError(error);
  }

  for (const childEl of scopedDom.childComponents) {
    mountComponentTree(childEl, mountedComponents);
  }
}

function mountComponent(rootEl, setup, options = {}) {
  if (rootEl.__het_instance) return false;

  const scopedDom = options.scopedDom;
  const {
    rawSignals,
    signalMeta,
    signalInitBindings,
    componentLoggingContext,
    signals,
    importDeclarations,
    cleanups,
    ctx,
  } = measureMountBucket('refsAndContext', () => {
    const rawSignals = {};
    const signalMeta = Object.create(null);
    const signalInitBindings = Object.create(null);
    const componentLoggingContext = getComponentCause(rootEl);
    const signals = createSignalsProxy(rawSignals, componentLoggingContext);
    const importDeclarations = getImportDeclarations(rootEl, componentLoggingContext);
    const rawRefs = Object.fromEntries(
      (scopedDom?.refEls ?? scopedQuerySelectorAll(rootEl, '[het-ref]')).map((refEl) => [
        refEl.getAttribute('het-ref'),
        refEl,
      ]),
    );
    const refs = createRefsProxy(rawRefs, componentLoggingContext);
    const cleanups = [];
    const onCleanup = (fn) => {
      if (typeof fn !== 'function') {
        throw new Error(
          'HET Error: Cleanup callback must be a function',
          { cause: componentLoggingContext },
        );
      }
      cleanups.push(fn);
    };
    const ctx = {
      el: rootEl,
      key: options.structuralContext?.key,
      refs,
      signals,
      onCleanup,
      structuralContext: options.structuralContext,
    };

    return {
      rawSignals,
      signalMeta,
      signalInitBindings,
      componentLoggingContext,
      signals,
      importDeclarations,
      cleanups,
      ctx,
    };
  });
  const boundEls = scopedDom?.boundEls ?? scopedQuerySelectorAll(rootEl, DIRECTIVES_SELECTOR);
  const structuralTemplateEls = scopedDom?.structuralTemplateEls ??
    scopedQuerySelectorAll(rootEl, STRUCTURAL_TEMPLATES_SELECTOR);
  const { bindings, structuralBindings } = measureMountBucket('parseBindings', () => ({
    bindings: getBindings(boundEls, componentLoggingContext),
    structuralBindings: getStructuralBindings(structuralTemplateEls, componentLoggingContext),
  }));
  recordMountCount('bindingCount', bindings.length);
  recordMountCount('structuralBindingCount', structuralBindings.length);
  const syncBindings = bindings.filter((binding) => binding.acquisitionStrategy === 'sync');
  const bindingsToInit = bindings.filter((binding) => binding.acquisitionStrategy);

  measureMountBucket('initializeSignals', () => {
    initializeForwardedSignals(
      options.importedSignals,
      rawSignals,
      signalMeta,
      componentLoggingContext,
    );

    resolveImports(
      rootEl,
      importDeclarations,
      rawSignals,
      signalMeta,
      componentLoggingContext,
    );

    const initBindingGroups = getInitBindingGroups(bindingsToInit);
    for (const [source, sourceBindings] of initBindingGroups) {
      const binding = sourceBindings[0];
      if (signalMeta[source] === 'imported' || signalMeta[source] === 'forwarded') {
        throw new Error(
          'HET Error: Imported signal conflicts with local initialization',
          { cause: getBindingCause(binding, { signalName: source }) },
        );
      }
      if (rawSignals[source]) {
        const existingBinding = signalInitBindings[source];
        throw new Error(
          'HET Error: Duplicate signal initialization',
          {
            cause: getBindingCause(binding, {
              signalName: source,
              existingBindingAttribute: existingBinding.attrName ?? existingBinding.dirName,
              existingBindingDeclaration: existingBinding.exp,
              existingBindingElement: existingBinding.el,
            }),
          },
        );
      }
      rawSignals[source] = signal(getSeedValue(rawSignals, sourceBindings));
      signalMeta[source] = 'local';
      signalInitBindings[source] = binding;
    }
  });
  const methods = measureMountBucket('setup', () => {
    recordMountCount('setupCallCount');
    return (setup && setup(ctx)) || {};
  });

  measureMountBucket('initializeRuntimeBindings', () => initializeBindings(ctx, bindings, methods));

  measureMountBucket('createInstance', () => {
    rootEl.__het_instance = {
      rootEl,
      methods,
      signals,
      rawSignals,
      signalMeta,
      importDeclarations,
      bindings,
      syncBindings,
      structuralBindings,
      structuralContext: options.structuralContext,
      cleanup: () => {
        cleanups.forEach((fn) => fn());
      },
    };
  });

  measureMountBucket('initializeStructuralBindings', () => {
    initializeStructuralBindings(ctx, structuralBindings, {
      destroyComponent,
      getMountableComponent,
      mountComponent,
      mountComponents,
      removeMountPendingAttributes,
    });
  });

  return true;
}

function removeMountPendingAttributes(components) {
  for (const el of components) {
    el.removeAttribute('het-mount-pending');
  }
}

function getComponentRoots(root) {
  if (isComponentRoot(root)) return [root];

  const roots = [];
  walkElementChildren(root, (el) => {
    if (!isComponentRoot(el)) return true;
    roots.push(el);
    return false;
  });
  return roots;
}

function collectScopedComponentDom(rootEl) {
  const scopedDom = {
    boundEls: [],
    structuralTemplateEls: [],
    refEls: [],
    childComponents: [],
  };

  collectScopedElement(rootEl, scopedDom, true);
  walkElementChildren(rootEl, (el) => collectScopedElement(el, scopedDom));
  recordMountCount('scopedElementsVisited', scopedDom.elementsVisited);
  recordMountCount('directiveElementCount', scopedDom.boundEls.length);
  return scopedDom;
}

function collectScopedElement(el, scopedDom, isRoot = false) {
  scopedDom.elementsVisited = (scopedDom.elementsVisited || 0) + 1;
  if (!isRoot && isComponentRoot(el)) {
    scopedDom.childComponents.push(el);
    return false;
  }

  if (hasAnyAttribute(el, DIRECTIVE_ATTR_NAME_SET)) scopedDom.boundEls.push(el);
  if (el.tagName === 'TEMPLATE' && hasAnyAttribute(el, STRUCTURAL_ATTR_SET)) {
    scopedDom.structuralTemplateEls.push(el);
  }
  if (el.hasAttribute('het-ref')) scopedDom.refEls.push(el);

  return true;
}

function walkElementChildren(root, visit) {
  let child = root.firstElementChild;
  while (child) {
    const next = child.nextElementSibling;
    const shouldDescend = visit(child);
    if (shouldDescend) walkElementChildren(child, visit);
    child = next;
  }
}

function hasAnyAttribute(el, attrNames) {
  for (const attrName of attrNames) {
    if (el.hasAttribute(attrName)) return true;
  }
  return false;
}

function destroyComponent(el) {
  el.__het_instance?.cleanup();
  delete el.__het_instance;
}

function getInitBindingGroups(bindingsToInit) {
  const groups = new Map();
  for (const binding of bindingsToInit) {
    const sourceBindings = groups.get(binding.source) || [];
    sourceBindings.push(binding);
    groups.set(binding.source, sourceBindings);
  }
  return groups;
}

function getSeedValue(rawSignals, sourceBindings) {
  if (sourceBindings.length === 1) {
    return getBindingInputValue({ signals: rawSignals }, sourceBindings[0]);
  }

  if (
    sourceBindings.every(isModelGroupBinding) &&
    sourceBindings.every((binding) => binding.el.type === sourceBindings[0].el.type)
  ) {
    return getModelGroupSeedValue(sourceBindings);
  }

  const binding = sourceBindings[1];
  const existingBinding = sourceBindings[0];
  throw new Error(
    'HET Error: Duplicate signal initialization',
    {
      cause: getBindingCause(binding, {
        signalName: binding.source,
        existingBindingAttribute: existingBinding.attrName ?? existingBinding.dirName,
        existingBindingDeclaration: existingBinding.exp,
        existingBindingElement: existingBinding.el,
      }),
    },
  );
}

function createRefsProxy(target, componentLoggingContext) {
  return new Proxy(target, {
    get: getComponentRef,
  });

  function getComponentRef(obj, prop) {
    if (
      typeof prop === 'string' &&
      !(prop in obj)
    ) {
      throw createHetError(
        'HET Error: Component ref is not defined',
        {
          ...componentLoggingContext,
          refName: prop,
          availableRefs: Object.keys(obj),
        },
        getComponentRef,
      );
    }
    return Reflect.get(obj, prop);
  }
}

function createSignalsProxy(target, componentLoggingContext) {
  return new Proxy(target, {
    get: getComponentSignal,
    set(obj, prop, value) {
      if (
        typeof prop === 'string' &&
        Object.prototype.hasOwnProperty.call(obj, prop)
      ) {
        const signalOverrideLoggingContext = {
          ...componentLoggingContext,
          signalName: prop,
        };
        throw new Error(
          'HET Error: Signal override after initialization',
          { cause: signalOverrideLoggingContext },
        );
      }
      if (value?.brand !== PREACT_SIGNAL_BRAND) {
        const invalidSignalLoggingContext = {
          ...componentLoggingContext,
          signalName: String(prop),
        };
        throw new Error(
          'HET Error: Signal initialized with a non-signal value',
          { cause: invalidSignalLoggingContext },
        );
      }
      obj[prop] = value;
      return true;
    },
  });

  function getComponentSignal(obj, prop) {
    if (
      typeof prop === 'string' &&
      !(prop in obj)
    ) {
      throw createHetError(
        'HET Error: Component signal is not defined',
        {
          ...componentLoggingContext,
          signalName: prop,
          availableSignals: Object.keys(obj),
        },
        getComponentSignal,
      );
    }
    return Reflect.get(obj, prop);
  }
}

export {
  destroyComponent,
  mountComponent,
  mountComponents,
  removeMountPendingAttributes,
};
