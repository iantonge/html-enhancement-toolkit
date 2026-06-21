import { signal } from '@preact/signals-core';
import { PREACT_SIGNAL_BRAND } from './constants.js';
import { DIRECTIVES_SELECTOR, STRUCTURAL_TEMPLATES_SELECTOR } from './directives.js';
import { scopedQuerySelectorAll, isComponentRoot, getNodeDepth } from './dom-scope.js';
import { handleError } from './error-handler.js';
import { getBindingInputValue } from './expressions.js';
import { getComponentCause, getBindingCause } from './logging.js';
import { getMountableComponent } from './registry.js';
import { getBindings, getStructuralBindings } from './bindings/parse.js';
import {
  getImportDeclarations,
  initializeForwardedSignals,
  resolveImports,
} from './imports.js';
import { initializeBindings } from './runtime.js';
import { initializeStructuralBindings } from './structural.js';

function mountComponents(root) {
  const componentsToMount = [];
  const mountedComponents = [];

  if (isComponentRoot(root)) componentsToMount.push(root);
  if (typeof root.querySelectorAll === 'function') {
    componentsToMount.push(...root.querySelectorAll('[het-component]'));
  }

  componentsToMount.sort((a, b) => getNodeDepth(a) - getNodeDepth(b));

  for (const el of componentsToMount) {
    try {
      const component = getMountableComponent(el);
      if (!component) {
        throw new Error(
          'HET Error: Component is not registered',
          { cause: getComponentCause(el) },
        );
      }

      if (mountComponent(el, component.setup)) {
        mountedComponents.push(el);
      }
    } catch (error) {
      handleError(error);
    }
  }

  removeMountPendingAttributes(mountedComponents);
}

function mountComponent(rootEl, setup, options = {}) {
  if (rootEl.__het_instance) return false;

  const rawSignals = {};
  const signalMeta = Object.create(null);
  const signalInitBindings = Object.create(null);
  const componentLoggingContext = getComponentCause(rootEl);
  const signals = createSignalsProxy(rawSignals, componentLoggingContext);
  const importDeclarations = getImportDeclarations(rootEl, componentLoggingContext);
  const refs = Object.fromEntries(
    scopedQuerySelectorAll(rootEl, '[het-ref]').map((refEl) => [
      refEl.getAttribute('het-ref'),
      refEl,
    ]),
  );
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
  const ctx = { el: rootEl, refs, signals, onCleanup };
  const boundEls = scopedQuerySelectorAll(rootEl, DIRECTIVES_SELECTOR);
  const structuralTemplateEls = scopedQuerySelectorAll(rootEl, STRUCTURAL_TEMPLATES_SELECTOR);
  const bindings = getBindings(boundEls, componentLoggingContext);
  const structuralBindings = getStructuralBindings(structuralTemplateEls, componentLoggingContext);
  const syncBindings = bindings.filter((binding) => binding.acquisitionStrategy === 'sync');
  const bindingsToInit = bindings.filter((binding) => binding.acquisitionStrategy);

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

  for (const binding of bindingsToInit) {
    if (signalMeta[binding.source] === 'imported' || signalMeta[binding.source] === 'forwarded') {
      throw new Error(
        'HET Error: Imported signal conflicts with local initialization',
        { cause: getBindingCause(binding, { signalName: binding.source }) },
      );
    }
    if (rawSignals[binding.source]) {
      const existingBinding = signalInitBindings[binding.source];
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
    rawSignals[binding.source] = signal(getBindingInputValue({ signals: rawSignals }, binding));
    signalMeta[binding.source] = 'local';
    signalInitBindings[binding.source] = binding;
  }
  const methods = (setup && setup(ctx)) || {};

  initializeBindings(ctx, bindings, methods);

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
    cleanup: () => {
      cleanups.forEach((fn) => fn());
    },
  };

  initializeStructuralBindings(ctx, structuralBindings, {
    destroyComponent,
    getMountableComponent,
    mountComponent,
    mountComponents,
    removeMountPendingAttributes,
  });

  return true;
}

function removeMountPendingAttributes(components) {
  for (const el of components) {
    el.removeAttribute('het-mount-pending');
  }
}

function destroyComponent(el) {
  el.__het_instance?.cleanup();
  delete el.__het_instance;
}

function createSignalsProxy(target, componentLoggingContext) {
  return new Proxy(target, {
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
}

export {
  destroyComponent,
  mountComponent,
  mountComponents,
  removeMountPendingAttributes,
};
