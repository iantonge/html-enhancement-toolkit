import {
  destroy as destroyComponents,
  init as initComponents,
  registerComponent,
} from './components.js';
import { signal } from '@preact/signals-core';
import { init as initRequests, destroy as destroyRequests } from './requests.js';

let afterLoadContentListener;

function init(config) {
  initComponents(config);
  initRequests(config);
  initializeSyncBridge();
}

function destroy() {
  if (afterLoadContentListener) {
    document.removeEventListener('het:afterLoadContent', afterLoadContentListener);
    afterLoadContentListener = undefined;
  }
  destroyComponents();
  destroyRequests();
}

function initializeSyncBridge() {
  if (afterLoadContentListener) return;

  afterLoadContentListener = (afterLoadContentEvent) => {
    const syncEvent = new CustomEvent('het:sync', {
      bubbles: true,
    });
    afterLoadContentEvent.target.dispatchEvent(syncEvent);
  };

  document.addEventListener('het:afterLoadContent', afterLoadContentListener);
}

export { init, destroy, registerComponent, signal };
