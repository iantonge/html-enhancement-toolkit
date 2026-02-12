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

  const refs = Object.fromEntries(
    scopedQuerySelectorAll(rootEl, '[het-ref]').map((refEl) => [
      refEl.getAttribute('het-ref'),
      refEl,
    ]),
  );
  const cleanups = [];
  const onCleanup = (fn) => {
    if (typeof fn === 'function') {
      cleanups.push(fn);
    }
  };
  const ctx = { el: rootEl, refs, onCleanup };
  const methods = (def.setup && def.setup(ctx)) || {};
  configureEventBindings(rootEl, methods, onCleanup);

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

function scopedQuerySelectorAll(root, selector) {
  const descendants = Array.from(root.querySelectorAll(selector)).filter(
    (el) => el.closest('[het-component]') === root,
  );

  return root.matches(selector) ? [root, ...descendants] : descendants;
}

function configureEventBindings(rootEl, methods, onCleanup) {
  const boundEls = scopedQuerySelectorAll(rootEl, '[het-on]');
  for (const el of boundEls) {
    const declarations = parseHetOnDeclarations(el);
    for (const { eventName, methodName, exp } of declarations) {
      const handler = methods?.[methodName];
      if (typeof handler !== 'function') {
        throw new Error(`HET Error: Missing method "${methodName}"`);
      }
      const listener = handler.bind(methods);
      el.addEventListener(eventName, listener);
      onCleanup(() => el.removeEventListener(eventName, listener));
    }
  }
}

function parseHetOnDeclarations(el) {
  const raw = el.getAttribute('het-on') || '';
  const declarations = raw.split(/\s+/).filter(Boolean);
  return declarations.map((declaration) => {
    const parts = declaration.split('=');
    if (
      parts.length !== 2 ||
      parts[0].length === 0 ||
      parts[1].length === 0
    ) {
      throw new Error(`HET Error: Invalid expression '${declaration}'`);
    }
    const [eventName, methodName] = parts;
    return { eventName, methodName, exp: declaration };
  });
}
