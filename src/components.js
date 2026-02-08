const components = new Map();

let onError = (error) => {
  throw error;
};

export function registerComponent(name, definition) {
  if (!name) {
    throw new Error('HET Error: Component name is required');
  }
  components.set(name, definition || {});
}

export function init(config) {
  onError = config?.onError ?? onError;
  try {
    mountComponents(document);
  } catch (error) {
    onError(error);
  }
}

export function destroy() {
  for (const component of document.querySelectorAll('[het-component]')) {
    try {
      destroyComponent(component);
    } catch (error) {
      onError(error);
    }
  }
}

export function destroyComponent(el) {
  el.__het_instance?.cleanup();
  delete el.__het_instance;
}

function mountComponents(root) {
  const componentsToMount = [];

  if (isComponentRoot(root)) componentsToMount.push(root);
  if (typeof root.querySelectorAll === 'function') {
    componentsToMount.push(...root.querySelectorAll('[het-component]'));
  }

  componentsToMount.sort((a, b) => getNodeDepth(a) - getNodeDepth(b));

  for (const el of componentsToMount) {
    const name = el.getAttribute('het-component');
    const definition = components.get(name);
    if (!definition) continue;

    try {
      mountComponent(el, definition);
    } catch (error) {
      onError(error);
    }
  }
}

function mountComponent(rootEl, def) {
  if (rootEl.__het_instance) return;

  const cleanups = [];
  const onCleanup = (fn) => {
    if (typeof fn === 'function') {
      cleanups.push(fn);
    }
  };
  const ctx = { el: rootEl, onCleanup };
  const methods = (def.setup && def.setup(ctx)) || {};

  rootEl.__het_instance = {
    methods,
    cleanup: () => {
      cleanups.forEach((fn) => fn());
    },
  };
}

function isComponentRoot(node) {
  return (
    node?.nodeType === Node.ELEMENT_NODE &&
    node.hasAttribute('het-component')
  );
}

function getNodeDepth(node) {
  let depth = 0;
  let current = node;
  while (current?.parentElement) {
    depth += 1;
    current = current.parentElement;
  }
  return depth;
}
