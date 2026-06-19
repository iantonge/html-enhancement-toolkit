import { handleError } from './error-handler.js';
import {
  destroyComponent,
  mountComponents,
} from './mount.js';

function init() {
  try {
    mountComponents(document);
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
}

export {
  destroy,
  init,
};
