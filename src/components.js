import { effect } from '@preact/signals-core';

const SIGNAL_SOURCE_TYPE = 0;
const FUNC_SOURCE_TYPE = 1;
const PREACT_SIGNAL_BRAND = Symbol.for('preact-signals');

const DIRECTIVES = [
  {
    name: 'het-on',
    keyRequired: true,
    sourceType: FUNC_SOURCE_TYPE,
    allowMultiple: true,
  },
  {
    name: 'het-props',
    keyRequired: true,
    sourceType: SIGNAL_SOURCE_TYPE,
    allowMultiple: true,
    write: (el, key, value) => {
      el[key] = value;
    },
  },
  {
    name: 'het-attrs',
    keyRequired: true,
    sourceType: SIGNAL_SOURCE_TYPE,
    allowMultiple: true,
    write: (el, key, value) => {
      el.setAttribute(key, String(value));
    },
  },
  {
    name: 'het-bool-attrs',
    keyRequired: true,
    sourceType: SIGNAL_SOURCE_TYPE,
    allowMultiple: true,
    write: (el, key, value) => {
      if (value) {
        el.setAttribute(key, '');
      } else {
        el.removeAttribute(key);
      }
    },
  },
  {
    name: 'het-class',
    keyRequired: true,
    sourceType: SIGNAL_SOURCE_TYPE,
    allowMultiple: true,
    write: (el, key, value) => {
      if (value) {
        el.classList.add(key);
      } else {
        el.classList.remove(key);
      }
    },
  },
];

const DIRECTIVES_SELECTOR = DIRECTIVES.map((directive) => `[${directive.name}]`).join(', ');

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

  const rawSignals = {};
  const signals = createSignalsProxy(rawSignals);
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
  const ctx = { el: rootEl, refs, signals, onCleanup };
  const methods = (def.setup && def.setup(ctx)) || {};
  const boundEls = scopedQuerySelectorAll(rootEl, DIRECTIVES_SELECTOR);
  const bindings = getBindings(boundEls);

  for (const binding of bindings) {
    if (binding.sourceType === SIGNAL_SOURCE_TYPE) {
      configureSignalBinding(ctx, binding);
    } else {
      configureEventBinding(methods, binding, onCleanup);
    }
  }

  rootEl.__het_instance = {
    methods,
    signals,
    cleanup: () => {
      cleanups.forEach((fn) => fn());
    },
  };
}

function getBindings(boundEls) {
  const bindings = [];
  for (const el of boundEls) {
    for (const directive of DIRECTIVES) {
      if (!el.hasAttribute(directive.name)) continue;
      bindings.push(...getParsedBindingDeclarations(directive, el));
    }
  }
  return bindings;
}

function getParsedBindingDeclarations(directive, el) {
  const rawAttr = el.getAttribute(directive.name) || '';
  const declarations = directive.allowMultiple
    ? rawAttr.split(/\s+/).filter(Boolean)
    : [rawAttr];

  return declarations.map((declaration) => {
    const parts = declaration.split('=');
    if (
      directive.keyRequired &&
      (parts.length !== 2 || parts.some((part) => part.length === 0))
    ) {
      throw new Error(`HET Error: Invalid expression '${declaration}'`);
    }
    const [key, source] = parts;
    return {
      el,
      key,
      source,
      sourceType: directive.sourceType,
      write: directive.write,
      exp: declaration,
    };
  });
}

function configureEventBinding(methods, binding, onCleanup) {
  const handler = methods?.[binding.source];
  if (typeof handler !== 'function') {
    throw new Error(`HET Error: Missing method "${binding.source}"`);
  }
  const listener = handler.bind(methods);
  binding.el.addEventListener(binding.key, listener);
  onCleanup(() => binding.el.removeEventListener(binding.key, listener));
}

function configureSignalBinding(ctx, binding) {
  const signalRef = ctx.signals[binding.source];
  if (!signalRef) {
    throw new Error(
      `HET Error: Attempting to bind signal ${binding.source} but it does not exist`,
    );
  }
  const dispose = effect(() => {
    try {
      const currentSignal = ctx.signals[binding.source];
      if (!currentSignal) {
        throw new Error(
          `HET Error: Attempting to bind signal ${binding.source} but it does not exist`,
        );
      }
      binding.write(binding.el, binding.key, currentSignal.value);
    } catch (error) {
      onError(error);
    }
  });
  ctx.onCleanup(dispose);
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

function createSignalsProxy(target) {
  return new Proxy(target, {
    set(obj, prop, value) {
      if (
        typeof prop === 'string' &&
        Object.prototype.hasOwnProperty.call(obj, prop)
      ) {
        throw new Error(
          `HET error: Attempting to override signal '${prop}' after initialization`,
        );
      }
      if (value?.brand !== PREACT_SIGNAL_BRAND) {
        throw new Error(
          `HET Error: Signal '${String(prop)}' must be initialized with signal(...)`,
        );
      }
      obj[prop] = value;
      return true;
    },
  });
}
