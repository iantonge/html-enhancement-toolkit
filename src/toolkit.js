import {
  init as initComponents,
  destroy as destroyComponents,
  registerComponent as registerComponent,
} from "./components.js";
import {
  init as initRequests,
  destroy as destroyRequests,
} from "./requests.js";

function init(config) {
  initComponents(config);
  initRequests(config);
  document.addEventListener("het:afterLoadContent", relayAfterLoadContentEvent);
}

function destroy() {
  destroyComponents();
  destroyRequests();
  document.removeEventListener("het:afterLoadContent", relayAfterLoadContentEvent);
}

function relayAfterLoadContentEvent(afterLoadContentEvent) {
  const syncEvent = new CustomEvent("het:sync", {
    bubbles: true,
  });
  afterLoadContentEvent.target.dispatchEvent(syncEvent);
}


export { init, destroy, registerComponent };
