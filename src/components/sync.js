import { SIGNAL_SOURCE_TYPE } from './constants.js';
import { handleError } from './error-handler.js';
import { evaluateBindingExpression, getBindingInputValue } from './expressions.js';
import { syncImportedSignals } from './imports.js';
import { isComponentRoot } from './dom-scope.js';

let syncListener;

function initializeSyncEvents() {
  if (syncListener) return;

  syncListener = (event) => {
    try {
      const root = event?.detail?.root ?? event.target ?? document;
      syncComponents(root);
    } catch (error) {
      handleError(error);
    }
  };

  document.addEventListener('het:sync', syncListener);
}

function destroySyncEvents() {
  if (syncListener) {
    document.removeEventListener('het:sync', syncListener);
    syncListener = undefined;
  }
}

function syncComponents(root) {
  const componentsToSync = [];

  if (isComponentRoot(root)) componentsToSync.push(root);
  if (typeof root.querySelectorAll === 'function') {
    componentsToSync.push(...root.querySelectorAll('[het-component]'));
  }

  for (const rootEl of componentsToSync) {
    syncComponent(rootEl);
  }
}

function syncComponent(rootEl) {
  try {
    if (!rootEl?.isConnected) return;

    const instance = rootEl.__het_instance;
    if (!instance) return;

    syncImportedSignals(rootEl, instance);

    for (const binding of instance.syncBindings) {
      const currentSignal = instance.signals[binding.source];
      const nextValue = getBindingInputValue({ signals: instance.rawSignals }, binding);
      currentSignal.value = nextValue;
    }

    for (const binding of instance.bindings) {
      if (binding.sourceType !== SIGNAL_SOURCE_TYPE) continue;

      let nextValue;
      if (binding.dirName === 'het-model') {
        nextValue = instance.signals[binding.source]?.value;
      } else if (binding.expression) {
        nextValue = evaluateBindingExpression(binding, { signals: instance.signals });
      } else {
        nextValue = instance.signals[binding.source]?.value;
      }

      binding.write(binding.el, binding.key, nextValue);
    }

    rootEl.removeAttribute('het-mount-pending');
  } catch (error) {
    handleError(error);
  }
}

export {
  destroySyncEvents,
  initializeSyncEvents,
};
