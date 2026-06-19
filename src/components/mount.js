import { PREACT_SIGNAL_BRAND } from './constants.js';
import { isComponentRoot, getNodeDepth } from './dom-scope.js';
import { handleError } from './error-handler.js';
import { getComponentCause } from './logging.js';
import { getMountableComponent } from './registry.js';

function mountComponents(root) {
  const componentsToMount = [];

  if (isComponentRoot(root)) componentsToMount.push(root);
  if (typeof root.querySelectorAll === 'function') {
    componentsToMount.push(...root.querySelectorAll('[het-component]'));
  }

  componentsToMount.sort((a, b) => getNodeDepth(a) - getNodeDepth(b));

  for (const el of componentsToMount) {
    try {
      const component = getMountableComponent(el);
      if (!component) continue;

      mountComponent(el, component.setup);
    } catch (error) {
      handleError(error);
    }
  }
}

function mountComponent(rootEl, setup) {
  if (rootEl.__het_instance) return false;

  const rawSignals = {};
  const componentLoggingContext = getComponentCause(rootEl);
  const signals = createSignalsProxy(rawSignals, componentLoggingContext);
  const setupCtx = { el: rootEl, signals };
  if (setup) setup(setupCtx);

  rootEl.__het_instance = {
    rootEl,
    signals,
    rawSignals,
    cleanup: () => {},
  };

  return true;
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
};
