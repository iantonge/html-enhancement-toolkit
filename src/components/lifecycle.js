import { setOnError, handleError } from './error-handler.js';
import { getNodeDepth } from './dom-scope.js';
import {
  destroyComponent,
  mountComponents,
} from './mount.js';
import {
  finishComponentMountMetrics,
  resetComponentMountMetrics,
} from './metrics.js';
import {
  configureGroupedSignalEffects,
  configureInitialRuntimeWriteBatch,
} from './runtime.js';
import { configureStructuralTeardown } from './structural.js';
import { initializeSyncEvents, destroySyncEvents } from './sync.js';

const pendingRemovals = new Set();
const pendingAdditions = new Set();
let observer;

function init(config) {
  setOnError(config?.onError);
  configureStructuralTeardown(config);
  configureInitialRuntimeWriteBatch(config);
  configureGroupedSignalEffects(config);
  resetComponentMountMetrics(config);
  try {
    mountComponents(document);
    finishComponentMountMetrics();
    initializeObserver();
    initializeSyncEvents();
  } catch (error) {
    finishComponentMountMetrics();
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
    pendingRemovals.clear();
  }
}

function initializeObserver() {
  if (observer) return;

  observer = new MutationObserver((records) => {
    for (const record of records) {
      try {
        if (record.type === 'childList') {
          for (const node of record.removedNodes) {
            if (node.nodeType !== Node.ELEMENT_NODE) continue;
            if (node.hasAttribute('het-component')) pendingRemovals.add(node);
            node
              .querySelectorAll('[het-component]')
              .forEach((child) => pendingRemovals.add(child));
          }

          for (const node of record.addedNodes) {
            if (node.nodeType !== Node.ELEMENT_NODE) continue;
            pendingAdditions.add(node);
          }
        } else if (
          record.type === 'attributes' &&
          record.attributeName === 'het-component'
        ) {
          const el = record.target;
          if (el.isConnected && !el.hasAttribute('het-component')) {
            pendingRemovals.add(el);
          }
          if (el.isConnected && el.hasAttribute('het-component')) {
            pendingAdditions.add(el);
          }
        }
      } catch (error) {
        handleError(error);
      }
    }

    queueMicrotask(() => {
      const additions = Array.from(pendingAdditions).sort(
        (a, b) => getNodeDepth(a) - getNodeDepth(b),
      );
      const removals = Array.from(pendingRemovals).sort(
        (a, b) => getNodeDepth(b) - getNodeDepth(a),
      );

      for (const el of additions) {
        try {
          if (!el.isConnected) continue;
          mountComponents(el);
        } catch (error) {
          handleError(error);
        }
      }
      pendingAdditions.clear();

      for (const el of removals) {
        try {
          const stillComponent = el.isConnected && el.hasAttribute('het-component');
          if (stillComponent) continue;
          if (el.__het_instance) destroyComponent(el);
        } catch (error) {
          handleError(error);
        }
      }
      pendingRemovals.clear();
    });
  });

  observer.observe(document, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['het-component'],
  });
}

export {
  destroy,
  init,
};
