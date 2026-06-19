import { setOnError, handleError } from './error-handler.js';
import { getMountableComponent } from './registry.js';
import {
  destroyComponent,
  mountComponent,
  mountComponents,
} from './mount.js';
import { configureStructuralTeardown } from './structural.js';
import { initializeSyncEvents, destroySyncEvents } from './sync.js';

const pendingAdditions = new Set();
let observer;

function init(config) {
  setOnError(config?.onError);
  configureStructuralTeardown(config);
  try {
    mountComponents(document);
    initializeObserver();
    initializeSyncEvents();
  } catch (error) {
    handleError(error);
  }
}

function destroy() {
  for (const component of document.querySelectorAll('[het-component]')) {
    try {
      destroyComponent(component);
    } catch (error) {
      handleError(error);
    }
  }

  destroySyncEvents();

  if (observer) {
    observer.disconnect();
    observer = undefined;
    pendingAdditions.clear();
  }
}

function initializeObserver() {
  if (observer) return;

  observer = new MutationObserver((records) => {
    for (const record of records) {
      try {
        if (record.type === 'childList') {
          for (const node of record.addedNodes) {
            if (node.nodeType !== Node.ELEMENT_NODE) continue;
            if (node.hasAttribute('het-component')) pendingAdditions.add(node);
            node
              .querySelectorAll('[het-component]')
              .forEach((child) => pendingAdditions.add(child));
          }
        }
      } catch (error) {
        handleError(error);
      }
    }

    queueMicrotask(() => {
      const additions = Array.from(pendingAdditions);
      for (const el of additions) {
        try {
          if (!el.isConnected) continue;
          if (!el.hasAttribute('het-component')) continue;
          const component = getMountableComponent(el);
          if (component) mountComponent(el, component.setup);
        } catch (error) {
          handleError(error);
        }
      }
      pendingAdditions.clear();
    });
  });

  observer.observe(document, {
    childList: true,
    subtree: true,
  });
}

export {
  destroy,
  init,
};
