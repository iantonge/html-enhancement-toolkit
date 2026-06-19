import {
  destroy as destroyComponents,
  init as initComponents,
  registerComponent,
} from './components.js';

function init(config) {
  initComponents(config);
}

function destroy() {
  destroyComponents();
}

export {
  init,
  destroy,
  registerComponent,
};
