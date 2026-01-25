import { init as initRequests, destroy as destroyRequests } from './requests.js';

function init(config) {
  initRequests(config);
}

function destroy() {
  destroyRequests();
}

export { init, destroy };
