import { effect, signal } from '@preact/signals-core';

const SIGNAL_SOURCE_TYPE = 0;
const FUNC_SOURCE_TYPE = 1;
const PREACT_SIGNAL_BRAND = Symbol.for('preact-signals');
const TYPE_HINTS = ['int', 'bool', 'float'];
const EXPORTS_ATTR = 'het-exports';
const IMPORTS_ATTR = 'het-imports';
const IMPORTED_SIGNAL_WRAPPER = Symbol('hetImportedSignalWrapper');
const exportsAttrCache = new WeakMap();
const EMPTY_EXPORTS_SET = new Set();

const DIRECTIVES = [
  {
    name: 'het-on',
    keyRequired: true,
    sourceType: FUNC_SOURCE_TYPE,
    allowMultiple: true,
    allowTypeHint: false,
    allowSync: false,
  },
  {
    name: 'het-props',
    keyRequired: true,
    sourceType: SIGNAL_SOURCE_TYPE,
    allowMultiple: true,
    allowTypeHint: true,
    allowSync: true,
    read: (el, key) => {
      return el[key];
    },
    write: (el, key, value) => {
      el[key] = value;
    },
  },
  {
    name: 'het-attrs',
    keyRequired: true,
    sourceType: SIGNAL_SOURCE_TYPE,
    allowMultiple: true,
    allowTypeHint: true,
    allowSync: true,
    read: (el, key) => {
      return el.getAttribute(key);
    },
    write: (el, key, value) => {
      el.setAttribute(key, String(value));
    },
  },
  {
    name: 'het-bool-attrs',
    keyRequired: true,
    sourceType: SIGNAL_SOURCE_TYPE,
    allowMultiple: true,
    allowTypeHint: false,
    allowSync: true,
    read: (el, key) => {
      return el.hasAttribute(key);
    },
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
    allowTypeHint: false,
    allowSync: true,
    read: (el, key) => {
      return el.classList.contains(key);
    },
    write: (el, key, value) => {
      if (value) {
        el.classList.add(key);
      } else {
        el.classList.remove(key);
      }
    },
  },
  {
    name: 'het-model',
    keyRequired: false,
    sourceType: SIGNAL_SOURCE_TYPE,
    allowMultiple: false,
    allowTypeHint: true,
    allowSync: false,
    read: (el, key) => {
      return el[key];
    },
    write: (el, key, value) => {
      el[key] = value;
    },
  },
];

const DIRECTIVES_SELECTOR = DIRECTIVES.map((directive) => `[${directive.name}]`).join(', ');

const components = new Map();
const pendingRemovals = new Set();
const pendingAdditions = new Set();
let observer;
let syncListener;

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
    initializeObserver();
    initializeSyncEvents();
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

  if (syncListener) {
    document.removeEventListener('het:sync', syncListener);
    syncListener = undefined;
  }

  if (observer) {
    observer.disconnect();
    observer = undefined;
    pendingAdditions.clear();
    pendingRemovals.clear();
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
  const signalMeta = Object.create(null);
  const signals = createSignalsProxy(rawSignals);
  const importDeclarations = getImportDeclarations(rootEl);
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
  const boundEls = scopedQuerySelectorAll(rootEl, DIRECTIVES_SELECTOR);
  const bindings = getBindings(boundEls);
  const syncBindings = bindings.filter((binding) => binding.acquisitionStrategy === 'sync');
  const bindingsToInit = bindings.filter((binding) => binding.acquisitionStrategy);

  resolveImports(rootEl, importDeclarations, rawSignals, signalMeta);

  for (const binding of bindingsToInit) {
    if (signalMeta[binding.source] === 'imported') {
      throw new Error(
        `HET Error: Signal name conflict for '${binding.source}' (import vs local)`,
      );
    }
    if (rawSignals[binding.source]) {
      throw new Error(
        `HET Error: Attempting to seed initial value for signal ${binding.source} but it already exists`,
      );
    }
    rawSignals[binding.source] = signal(readValue(binding));
    signalMeta[binding.source] = 'local';
  }
  const methods = (def.setup && def.setup(ctx)) || {};

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
    rawSignals,
    signalMeta,
    importDeclarations,
    syncBindings,
    cleanup: () => {
      cleanups.forEach((fn) => fn());
    },
  };
}

function getDeclaredExports(el) {
  const rawAttr = el.getAttribute(EXPORTS_ATTR) || '';

  const cached = exportsAttrCache.get(el);
  if (cached?.rawAttr === rawAttr) return cached.exportsSet;

  const declarations = rawAttr.split(/\s+/).filter(Boolean);
  const exportsSet = declarations.length ? new Set(declarations) : EMPTY_EXPORTS_SET;

  exportsAttrCache.set(el, { rawAttr, exportsSet });
  return exportsSet;
}

function getImportDeclarations(el) {
  const rawAttr = el.getAttribute(IMPORTS_ATTR) || '';
  const declarations = rawAttr.split(/\s+/).filter(Boolean);

  return declarations.map((declaration) => {
    const parts = declaration.split('=');
    if (parts.length === 1 && parts[0]) {
      return { local: parts[0], source: parts[0] };
    }
    if (parts.length === 2 && parts[0] && parts[1]) {
      return { local: parts[0], source: parts[1] };
    }

    throw new Error(
      `HET Error: Invalid ${IMPORTS_ATTR} declaration '${declaration}'`,
    );
  });
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
    const declarationParts = declaration.split(':');
    if (declarationParts.length > 2) {
      throw new Error(`HET Error: Invalid declaration '${declaration}'`);
    }
    const [assignment, acquisitionClause] = declarationParts;

    if (acquisitionClause && !directive.read) {
      throw new Error(
        `HET Error: Acquisition clause not supported in binding declaration '${declaration}'`,
      );
    }

    const parsedAcquisition = acquisitionClause
      ? getParsedAcquisition(directive, declaration, acquisitionClause)
      : {};

    const parts = assignment.split('=');
    let key;
    let source;

    if (directive.keyRequired) {
      if (parts.length !== 2 || parts.some((part) => part.length === 0)) {
        throw new Error(`HET Error: Invalid expression '${declaration}'`);
      }
      [key, source] = parts;
    } else if (parts.length === 1 && parts[0].length > 0) {
      key = inferModelKey(el);
      [source] = parts;
    } else if (parts.length === 2 && parts.every((part) => part.length > 0)) {
      [key, source] = parts;
    } else {
      throw new Error(`HET Error: Invalid expression '${declaration}'`);
    }

    return {
      dirName: directive.name,
      el,
      key,
      source,
      sourceType: directive.sourceType,
      read: directive.read,
      write: directive.write,
      typeHint: parsedAcquisition.typeHint,
      acquisitionStrategy: parsedAcquisition.strategy,
      exp: declaration,
    };
  });
}

function getParsedAcquisition(directive, declaration, acquisitionClause) {
  const typeHintStart = acquisitionClause.indexOf('[');
  if (typeHintStart === -1) {
    return getValidatedAcquisitionStrategy(directive, declaration, acquisitionClause);
  }

  if (!directive.allowTypeHint) {
    throw new Error(
      `HET Error: Type hints unsupported for ${directive.name}: '${declaration}'`,
    );
  }

  const typeHint = acquisitionClause.slice(typeHintStart + 1, -1);
  if (!TYPE_HINTS.includes(typeHint)) {
    throw new Error(`HET Error: Type hint '${typeHint}' not recognised in '${declaration}'`);
  }

  const strategy = acquisitionClause.slice(0, typeHintStart);
  return {
    ...getValidatedAcquisitionStrategy(directive, declaration, strategy),
    typeHint,
  };
}

function getValidatedAcquisitionStrategy(directive, declaration, strategy) {
  if (strategy !== 'seed' && strategy !== 'sync') {
    throw new Error(
      `HET Error: Acquisition strategy '${strategy}' not recognised in '${declaration}'`,
    );
  }

  if (strategy === 'sync' && directive.allowSync === false) {
    throw new Error(
      `HET error: '${directive.name}' does not support :sync in '${declaration}'`,
    );
  }

  return { strategy };
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

  if (binding.dirName === 'het-model') {
    const updateFromEl = () => {
      try {
        const currentSignal = ctx.signals[binding.source];
        if (!currentSignal) {
          throw new Error(
            `HET Error: Attempting to bind signal ${binding.source} but it does not exist`,
          );
        }

        const nextValue = readValue(binding);
        if (currentSignal.value !== nextValue) {
          currentSignal.value = nextValue;
        }
      } catch (error) {
        onError(error);
      }
    };

    const eventName = inferInputEvent(binding.key);
    binding.el.addEventListener(eventName, updateFromEl);
    ctx.onCleanup(() => binding.el.removeEventListener(eventName, updateFromEl));
  }
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

function initializeObserver() {
  if (observer) return;

  observer = new MutationObserver((records) => {
    for (const record of records) {
      try {
        if (record.type === 'childList') {
          for (const node of record.removedNodes) {
            if (node.nodeType !== Node.ELEMENT_NODE) continue;
            if (node.hasAttribute('het-component')) pendingRemovals.add(node);
            node
              .querySelectorAll('[het-component]')
              .forEach((child) => pendingRemovals.add(child));
          }

          for (const node of record.addedNodes) {
            if (node.nodeType !== Node.ELEMENT_NODE) continue;
            if (node.hasAttribute('het-component')) pendingAdditions.add(node);
            node
              .querySelectorAll('[het-component]')
              .forEach((child) => pendingAdditions.add(child));
          }
        } else if (
          record.type === 'attributes' &&
          record.attributeName === 'het-component'
        ) {
          const el = record.target;
          if (el.isConnected && !el.hasAttribute('het-component')) {
            pendingRemovals.add(el);
          }
          if (el.isConnected && el.hasAttribute('het-component')) {
            pendingAdditions.add(el);
          }
        }
      } catch (error) {
        onError(error);
      }
    }

    queueMicrotask(() => {
      const additions = Array.from(pendingAdditions).sort(
        (a, b) => getNodeDepth(a) - getNodeDepth(b),
      );
      const removals = Array.from(pendingRemovals).sort(
        (a, b) => getNodeDepth(b) - getNodeDepth(a),
      );

      for (const el of additions) {
        try {
          if (!el.isConnected) continue;
          if (!el.hasAttribute('het-component')) continue;
          const definition = components.get(el.getAttribute('het-component'));
          if (definition) mountComponent(el, definition);
        } catch (error) {
          onError(error);
        }
      }
      pendingAdditions.clear();

      for (const el of removals) {
        try {
          const stillComponent = el.isConnected && el.hasAttribute('het-component');
          if (stillComponent) continue;
          if (el.__het_instance) destroyComponent(el);
        } catch (error) {
          onError(error);
        }
      }
      pendingRemovals.clear();
    });
  });

  observer.observe(document, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['het-component'],
  });
}

function scopedQuerySelectorAll(root, selector) {
  const descendants = Array.from(root.querySelectorAll(selector)).filter(
    (el) => el.closest('[het-component]') === root,
  );

  return root.matches(selector) ? [root, ...descendants] : descendants;
}

function inferModelKey(el) {
  if (
    el instanceof HTMLInputElement &&
    (el.type === 'checkbox' || el.type === 'radio')
  ) {
    return 'checked';
  }

  return 'value';
}

function inferInputEvent(key) {
  return key === 'checked' ? 'change' : 'input';
}

function readValue(binding) {
  const rawValue = binding.read(binding.el, binding.key);

  if (binding.typeHint === 'int') {
    return parseInt(rawValue, 10);
  }

  if (binding.typeHint === 'float') {
    return parseFloat(rawValue);
  }

  if (binding.typeHint === 'bool') {
    return rawValue === true || rawValue === 'true';
  }

  return rawValue;
}

function initializeSyncEvents() {
  if (syncListener) return;

  syncListener = (event) => {
    try {
      const root = event?.detail?.root ?? event.target ?? document;
      syncComponents(root);
    } catch (error) {
      onError(error);
    }
  };

  document.addEventListener('het:sync', syncListener);
}

function syncComponents(root) {
  const componentsToSync = [];

  if (isComponentRoot(root)) componentsToSync.push(root);
  if (typeof root.querySelectorAll === 'function') {
    componentsToSync.push(...root.querySelectorAll('[het-component]'));
  }

  for (const rootEl of componentsToSync) {
    syncComponent(rootEl);
  }
}

function syncComponent(rootEl) {
  try {
    if (!rootEl?.isConnected) return;

    const instance = rootEl.__het_instance;
    if (!instance) return;

    syncImportedSignals(rootEl, instance);

    if (!instance.syncBindings?.length) return;

    for (const binding of instance.syncBindings) {
      const currentSignal = instance.signals[binding.source];
      const nextValue = readValue(binding);
      if (currentSignal.value !== nextValue) {
        currentSignal.value = nextValue;
      }
    }
  } catch (error) {
    onError(error);
  }
}

function syncImportedSignals(rootEl, instance) {
  if (!instance.importDeclarations?.length) return;

  resolveImports(
    rootEl,
    instance.importDeclarations,
    instance.rawSignals,
    instance.signalMeta,
  );
}

function resolveImports(rootEl, importDeclarations, rawSignals, signalMeta) {
  if (!importDeclarations.length) return false;

  let updated = false;

  for (const { local, source } of importDeclarations) {
    if (signalMeta[local] === 'local') {
      throw new Error(
        `HET Error: Signal name conflict for '${local}' (import vs local)`,
      );
    }

    const parentEl = findNearestExportingAncestor(rootEl, source);
    if (!parentEl) {
      throw new Error(
        `HET Error: Unable to resolve import '${source}' for '${local}' (no exporting parent found)`,
      );
    }

    const parentInstance = parentEl.__het_instance;
    if (!parentInstance) {
      throw new Error(
        `HET Error: Exported signal '${source}' is unavailable because the parent component is not mounted`,
      );
    }

    const parentSignal = parentInstance.signals?.[source];
    if (!parentSignal) {
      throw new Error(
        `HET Error: Exported signal '${source}' not found on nearest parent component`,
      );
    }

    if (signalMeta[local] !== 'imported') {
      rawSignals[local] = createImportedSignalWrapper(parentSignal);
      signalMeta[local] = 'imported';
      updated = true;
      continue;
    }

    const wrapper = rawSignals[local];
    if (!wrapper?.[IMPORTED_SIGNAL_WRAPPER]) {
      rawSignals[local] = createImportedSignalWrapper(parentSignal);
      updated = true;
      continue;
    }

    if (wrapper.getTarget() !== parentSignal) {
      wrapper.setTarget(parentSignal);
      updated = true;
    }
  }

  return updated;
}

function createImportedSignalWrapper(initialTarget) {
  const current = signal(initialTarget);

  return {
    [IMPORTED_SIGNAL_WRAPPER]: true,
    get value() {
      return current.value.value;
    },
    set value(nextValue) {
      current.value.value = nextValue;
    },
    getTarget() {
      return current.value;
    },
    setTarget(nextTarget) {
      current.value = nextTarget;
    },
  };
}

function findNearestExportingAncestor(rootEl, signalName) {
  let current = rootEl.parentElement;
  while (current) {
    if (current.hasAttribute('het-component')) {
      const exportsSet = getDeclaredExports(current);
      if (exportsSet.has(signalName)) return current;
    }
    current = current.parentElement;
  }
  return null;
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
