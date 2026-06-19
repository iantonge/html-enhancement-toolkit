import { setOnError, handleError } from './error-handler.js';
import {
  destroyComponent,
  mountComponents,
} from './mount.js';
import { initializeSyncEvents, destroySyncEvents } from './sync.js';

function init(config) {
  setOnError(config?.onError);
  try {
    mountComponents(document);
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
}

export {
  destroy,
  init,
};
