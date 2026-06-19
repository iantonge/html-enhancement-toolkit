import {
  destroy as destroyComponents,
  init as initComponents,
  registerComponent,
} from './components.js';
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
    dispatchSyncEvent(afterLoadContentEvent.target);
  };

  document.addEventListener('het:afterLoadContent', afterLoadContentListener);
}

function dispatchSyncEvent(root) {
  if (!(root instanceof Element)) return;
  root.dispatchEvent(new CustomEvent('het:sync', {
    bubbles: true,
  }));
}

export {
  init,
  destroy,
  registerComponent,
};
