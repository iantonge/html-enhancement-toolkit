import {
  destroy as destroyComponents,
  init as initComponents,
  registerComponent,
} from './components.js';

function init() {
  initComponents();
}

function destroy() {
  destroyComponents();
}

export {
  init,
  destroy,
  registerComponent,
};
