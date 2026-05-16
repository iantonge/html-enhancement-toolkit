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
    allowNegation: true,
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
    allowNegation: true,
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
    allowNegation: true,
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
    allowNegation: true,
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
  console.error(error, error.cause);
};

export function registerComponent(name, setup) {
  if (!name) {
    throw new Error('HET Error: Component name is required');
  }
  components.set(name, setup);
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
  const mountedComponents = [];

  if (isComponentRoot(root)) componentsToMount.push(root);
  if (typeof root.querySelectorAll === 'function') {
    componentsToMount.push(...root.querySelectorAll('[het-component]'));
  }

  componentsToMount.sort((a, b) => getNodeDepth(a) - getNodeDepth(b));

  for (const el of componentsToMount) {
    const name = el.getAttribute('het-component');
    if (!components.has(name)) continue;
    const setup = components.get(name);

    try {
      if (mountComponent(el, setup)) {
        mountedComponents.push(el);
      }
    } catch (error) {
      onError(error);
    }
  }

  removeCloakAttributes(mountedComponents);
}

function mountComponent(rootEl, setup) {
  if (rootEl.__het_instance) return false;

  const rawSignals = {};
  const signalMeta = Object.create(null);
  const signalInitBindings = Object.create(null);
  const componentLoggingContext = getComponentCause(rootEl);
  const signals = createSignalsProxy(rawSignals, componentLoggingContext);
  const importDeclarations = getImportDeclarations(rootEl, componentLoggingContext);
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
  const bindings = getBindings(boundEls, componentLoggingContext);
  const syncBindings = bindings.filter((binding) => binding.acquisitionStrategy === 'sync');
  const bindingsToInit = bindings.filter((binding) => binding.acquisitionStrategy);

  resolveImports(
    rootEl,
    importDeclarations,
    rawSignals,
    signalMeta,
    componentLoggingContext,
  );

  for (const binding of bindingsToInit) {
    if (signalMeta[binding.source] === 'imported') {
      throw new Error(
        'HET Error: Imported signal conflicts with local initialization',
        { cause: getBindingCause(binding, { signalName: binding.source }) },
      );
    }
    if (rawSignals[binding.source]) {
      const existingBinding = signalInitBindings[binding.source];
      throw new Error(
        'HET Error: Duplicate signal initialization',
        {
          cause: getBindingCause(binding, {
            signalName: binding.source,
            existingBindingAttribute: existingBinding.dirName,
            existingBindingDeclaration: existingBinding.exp,
            existingBindingElement: existingBinding.el,
          }),
        },
      );
    }
    rawSignals[binding.source] = signal(readValue(binding));
    signalMeta[binding.source] = 'local';
    signalInitBindings[binding.source] = binding;
  }
  const methods = (setup && setup(ctx)) || {};

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
    bindings,
    syncBindings,
    cleanup: () => {
      cleanups.forEach((fn) => fn());
    },
  };

  return true;
}

function removeCloakAttributes(components) {
  for (const el of components) {
    el.removeAttribute('het-cloak');
  }
}

function getComponentCause(componentElement) {
  return {
    componentName: componentElement.getAttribute('het-component'),
    componentElement,
  };
}

function getBindingCause(binding, extra = {}) {
  return {
    componentName: binding.componentName,
    componentElement: binding.componentElement,
    bindingAttribute: binding.dirName,
    bindingDeclaration: binding.exp,
    bindingElement: binding.el,
    ...extra,
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

function getImportDeclarations(el, componentLoggingContext) {
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
      'HET Error: Invalid import declaration',
      {
        cause: {
          ...componentLoggingContext,
          bindingAttribute: IMPORTS_ATTR,
          bindingDeclaration: declaration,
        },
      },
    );
  });
}

function getBindings(boundEls, componentLoggingContext) {
  const bindings = [];
  for (const el of boundEls) {
    for (const directive of DIRECTIVES) {
      if (!el.hasAttribute(directive.name)) continue;
      bindings.push(...getParsedBindingDeclarations(
        directive,
        el,
        componentLoggingContext,
      ));
    }
  }
  return bindings;
}

function getParsedBindingDeclarations(directive, el, componentLoggingContext) {
  const rawAttr = el.getAttribute(directive.name) || '';
  const declarations = directive.allowMultiple
    ? rawAttr.split(/\s+/).filter(Boolean)
    : [rawAttr];

  return declarations.map((declaration) => {
    const bindingLoggingContext = {
      ...componentLoggingContext,
      bindingAttribute: directive.name,
      bindingDeclaration: declaration,
      bindingElement: el,
    };
    const parts = declaration.split('=');
    let key;
    let sourceWithAcquisition;

    if (directive.keyRequired) {
      if (parts.length !== 2 || parts.some((part) => part.length === 0)) {
        throw new Error(
          'HET Error: Invalid binding expression',
          { cause: { ...bindingLoggingContext } },
        );
      }
      [key, sourceWithAcquisition] = parts;
    } else if (parts.length === 1 && parts[0].length > 0) {
      key = inferModelKey(el);
      [sourceWithAcquisition] = parts;
    } else if (parts.length === 2 && parts.every((part) => part.length > 0)) {
      [key, sourceWithAcquisition] = parts;
    } else {
      throw new Error(
        'HET Error: Invalid binding expression',
        { cause: { ...bindingLoggingContext } },
      );
    }
    const { negated, sourceWithAcquisition: parsedSourceWithAcquisition } =
      getNegationAndSource(
        directive,
        sourceWithAcquisition,
        bindingLoggingContext,
      );
    const { source, parsedAcquisition } = getSourceAndAcquisition(
      directive,
      parsedSourceWithAcquisition,
      negated,
      bindingLoggingContext,
    );

    const parsedBinding = {
      dirName: directive.name,
      el,
      componentElement: componentLoggingContext.componentElement,
      componentName: componentLoggingContext.componentName,
      key,
      source,
      negated,
      sourceType: directive.sourceType,
      read: directive.read,
      write: directive.write,
      typeHint: parsedAcquisition.typeHint,
      acquisitionStrategy: parsedAcquisition.strategy,
      exp: declaration,
    };
    return parsedBinding;
  });
}

function getNegationAndSource(
  directive,
  sourceWithAcquisition,
  bindingLoggingContext,
) {
  if (!sourceWithAcquisition.startsWith('!')) {
    return { negated: false, sourceWithAcquisition };
  }

  if (!directive.allowNegation) {
    throw new Error(
      'HET Error: Unsupported negation',
      { cause: { ...bindingLoggingContext } },
    );
  }

  const parsedSource = sourceWithAcquisition.slice(1);
  if (!parsedSource) {
    throw new Error(
      'HET Error: Negation requires a signal name',
      { cause: { ...bindingLoggingContext } },
    );
  }

  return { negated: true, sourceWithAcquisition: parsedSource };
}

function getSourceAndAcquisition(
  directive,
  sourceWithAcquisition,
  negated,
  bindingLoggingContext,
) {
  const separatorCount = (sourceWithAcquisition.match(/:/g) || []).length;
  if (separatorCount === 0) {
    return {
      source: sourceWithAcquisition,
      parsedAcquisition: {},
    };
  }

  if (separatorCount > 1) {
    throw new Error(
      'HET Error: Binding declaration has too many ":" characters',
      { cause: { ...bindingLoggingContext } },
    );
  }

  if (negated) {
    throw new Error(
      'HET Error: Negation cannot be used with acquisition',
      { cause: { ...bindingLoggingContext } },
    );
  }

  const [source, acquisitionClause] = sourceWithAcquisition.split(':');
  if (!source || !acquisitionClause) {
    throw new Error(
      'HET Error: Binding declaration has an incomplete acquisition clause',
      { cause: { ...bindingLoggingContext } },
    );
  }

  if (!directive.read) {
    throw new Error(
      'HET Error: Directive does not support acquisition clauses',
      { cause: { ...bindingLoggingContext } },
    );
  }

  return {
    source,
    parsedAcquisition: getParsedAcquisition(
      directive,
      acquisitionClause,
      bindingLoggingContext,
    ),
  };
}

function getParsedAcquisition(
  directive,
  acquisitionClause,
  bindingLoggingContext,
) {
  const typeHintStart = acquisitionClause.indexOf('[');
  if (typeHintStart === -1) {
    return {
      strategy: getValidatedAcquisitionStrategy(
        directive,
        acquisitionClause,
        bindingLoggingContext,
      ),
    };
  }

  if (!directive.allowTypeHint) {
    throw new Error(
      'HET Error: Directive does not support type hints',
      { cause: { ...bindingLoggingContext } },
    );
  }

  const typeHint = acquisitionClause.slice(typeHintStart + 1, -1);
  if (!TYPE_HINTS.includes(typeHint)) {
    throw new Error(
      'HET Error: Type hint is not recognised. Expected type hints are "int", "bool" or "float"',
      {
        cause: {
          ...bindingLoggingContext,
          bindingTypeHint: typeHint,
        },
      },
    );
  }

  const strategy = acquisitionClause.slice(0, typeHintStart);
  return {
    strategy: getValidatedAcquisitionStrategy(
      directive,
      strategy,
      bindingLoggingContext,
    ),
    typeHint,
  };
}

function getValidatedAcquisitionStrategy(
  directive,
  strategy,
  bindingLoggingContext,
) {
  if (strategy !== 'seed' && strategy !== 'sync') {
    throw new Error(
      'HET Error: Acquisition strategy is not recognised. Expected acquisition strategies are "seed" or "sync"',
      {
        cause: {
          ...bindingLoggingContext,
          bindingAcquisitionStrategy: strategy,
        },
      },
    );
  }

  if (strategy === 'sync' && directive.allowSync === false) {
    throw new Error(
      'HET Error: Directive does not support sync acquisition',
      { cause: { ...bindingLoggingContext } },
    );
  }

  return strategy;
}

function configureEventBinding(methods, binding, onCleanup) {
  const handler = methods?.[binding.source];
  if (typeof handler !== 'function') {
    throw new Error(
      'HET Error: Missing component method',
      { cause: getBindingCause(binding, { methodName: binding.source }) },
    );
  }
  const listener = handler.bind(methods);
  binding.el.addEventListener(binding.key, listener);
  onCleanup(() => binding.el.removeEventListener(binding.key, listener));
}

function configureSignalBinding(ctx, binding) {
  const signalRef = ctx.signals[binding.source];
  if (!signalRef) {
    throw new Error(
      'HET Error: Bound signal does not exist',
      { cause: getBindingCause(binding, { signalName: binding.source }) },
    );
  }
  const dispose = effect(() => {
    try {
      binding.write(
        binding.el,
        binding.key,
        getBindingWriteValue(binding, signalRef),
      );
    } catch (error) {
      onError(error);
    }
  });
  ctx.onCleanup(dispose);

  if (binding.dirName === 'het-model') {
    const updateFromEl = () => {
      try {
        const nextValue = readValue(binding);
        if (signalRef.value !== nextValue) {
          signalRef.value = nextValue;
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
      const mountedComponents = [];

      for (const el of additions) {
        try {
          if (!el.isConnected) continue;
          if (!el.hasAttribute('het-component')) continue;
          const name = el.getAttribute('het-component');
          if (components.has(name) && mountComponent(el, components.get(name))) {
            mountedComponents.push(el);
          }
        } catch (error) {
          onError(error);
        }
      }
      removeCloakAttributes(mountedComponents);
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

    for (const binding of instance.syncBindings) {
      const currentSignal = instance.signals[binding.source];
      const nextValue = readValue(binding);
      currentSignal.value = nextValue;
    }

    reapplySignalBindings(instance);

    if (!instance.syncBindings?.length) {
      rootEl.removeAttribute('het-cloak');
      return;
    }

    rootEl.removeAttribute('het-cloak');
  } catch (error) {
    onError(error);
  }
}

function reapplySignalBindings(instance) {
  for (const binding of instance.bindings || []) {
    if (binding.sourceType !== SIGNAL_SOURCE_TYPE) continue;
    if (!binding.el?.isConnected) continue;
    const currentSignal = instance.signals[binding.source];
    if (!currentSignal) continue;
    binding.write(
      binding.el,
      binding.key,
      getBindingWriteValue(binding, currentSignal),
    );
  }
}

function getBindingWriteValue(binding, signalRef) {
  return binding.negated ? !signalRef.value : signalRef.value;
}

function syncImportedSignals(rootEl, instance) {
  if (!instance.importDeclarations?.length) return;

  resolveImports(
    rootEl,
    instance.importDeclarations,
    instance.rawSignals,
    instance.signalMeta,
    getComponentCause(rootEl),
  );
}

function resolveImports(
  rootEl,
  importDeclarations,
  rawSignals,
  signalMeta,
  componentLoggingContext,
) {
  if (!importDeclarations.length) return false;

  let updated = false;

  for (const { local, source } of importDeclarations) {
    const parentEl = findNearestExportingAncestor(rootEl, source);
    if (!parentEl) {
      throw new Error(
        'HET Error: Imported signal has no exporting ancestor',
        {
          cause: {
            ...componentLoggingContext,
            bindingAttribute: IMPORTS_ATTR,
            importLocalSignalName: local,
            importSourceSignalName: source,
          },
        },
      );
    }

    const parentInstance = parentEl.__het_instance;
    if (!parentInstance) {
      throw new Error(
        'HET Error: Exporting ancestor component is not mounted',
        {
          cause: {
            ...componentLoggingContext,
            bindingAttribute: IMPORTS_ATTR,
            exportingComponentElement: parentEl,
            exportingComponentName: parentEl.getAttribute('het-component'),
            importLocalSignalName: local,
            importSourceSignalName: source,
          },
        },
      );
    }

    const parentSignal = parentInstance.signals?.[source];
    if (!parentSignal) {
      throw new Error(
        'HET Error: Exporting ancestor does not provide imported signal',
        {
          cause: {
            ...componentLoggingContext,
            bindingAttribute: IMPORTS_ATTR,
            exportingComponentElement: parentEl,
            exportingComponentName: parentEl.getAttribute('het-component'),
            importLocalSignalName: local,
            importSourceSignalName: source,
          },
        },
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

function createSignalsProxy(target, componentLoggingContext) {
  return new Proxy(target, {
    set(obj, prop, value) {
      if (
        typeof prop === 'string' &&
        Object.prototype.hasOwnProperty.call(obj, prop)
      ) {
        throw new Error(
          'HET Error: Signal override after initialization',
          {
            cause: {
              ...componentLoggingContext,
              signalName: prop,
            },
          },
        );
      }
      if (value?.brand !== PREACT_SIGNAL_BRAND) {
        throw new Error(
          'HET Error: Signal initialized with a non-signal value',
          {
            cause: {
              ...componentLoggingContext,
              signalName: String(prop),
            },
          },
        );
      }
      obj[prop] = value;
      return true;
    },
  });
}
