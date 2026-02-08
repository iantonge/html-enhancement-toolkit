import {
  destroy as destroyComponents,
  init as initComponents,
  registerComponent,
} from './components.js';
import { init as initRequests, destroy as destroyRequests } from './requests.js';

function init(config) {
  initComponents(config);
  initRequests(config);
}

function destroy() {
  destroyComponents();
  destroyRequests();
}

export { init, destroy, registerComponent };
