import { effect, signal } from '@preact/signals-core';

const SIGNAL_SOURCE_TYPE = 0;
const FUNC_SOURCE_TYPE = 1;
const ASSIGNMENT_SOURCE_TYPE = 2;
const READ_SOURCE_TYPE = 3;
const PREACT_SIGNAL_BRAND = Symbol.for('preact-signals');
const TYPE_HINTS = ['int', 'bool', 'float'];
const EXPORTS_ATTR = 'het-exports';
const IMPORTS_ATTR = 'het-imports';
const IMPORTED_SIGNAL_WRAPPER = Symbol('hetImportedSignalWrapper');
const KEYBOARD_EVENT_NAMES = ['keydown', 'keyup', 'keypress'];
const ACQUISITION_STRATEGIES = ['seed', 'sync'];
const exportsAttrCache = new WeakMap();
const EMPTY_EXPORTS_SET = new Set();

const DIRECTIVES = [
  {
    name: 'het-on',
    sourceType: FUNC_SOURCE_TYPE,
    allowMultiple: true,
  },
  {
    name: 'het-toggle',
    sourceType: ASSIGNMENT_SOURCE_TYPE,
    allowMultiple: true,
  },
  {
    name: 'het-seed',
    sourceType: READ_SOURCE_TYPE,
    allowMultiple: true,
    acquisitionStrategy: 'seed',
  },
  {
    name: 'het-sync',
    sourceType: READ_SOURCE_TYPE,
    allowMultiple: true,
    acquisitionStrategy: 'sync',
  },
  {
    name: 'het-text',
    keyRequired: false,
    sourceType: SIGNAL_SOURCE_TYPE,
    allowMultiple: false,
    allowTypeHint: true,
    allowSync: true,
    allowNegation: true,
    read: (el) => {
      return el.textContent;
    },
    write: (el, key, value) => {
      el[key] = value;
    },
    defaultKey: 'textContent',
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

const DIRECTIVE_BY_NAME = Object.fromEntries(
  DIRECTIVES.map((directive) => [directive.name, directive]),
);
const DIRECTIVE_ATTR_NAMES = DIRECTIVES.flatMap((directive) => {
  if (!directive.read || !directive.write || directive.name === 'het-model') {
    return [directive.name];
  }
  return [
    directive.name,
    `${directive.name}:seed`,
    `${directive.name}:sync`,
  ];
});
const DIRECTIVES_SELECTOR = DIRECTIVE_ATTR_NAMES
  .map((name) => `[${escapeAttributeSelectorName(name)}]`)
  .join(', ');

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
    const component = getMountableComponent(el);
    if (!component) continue;

    try {
      if (mountComponent(el, component.setup)) {
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
            existingBindingAttribute: existingBinding.attrName ?? existingBinding.dirName,
            existingBindingDeclaration: existingBinding.exp,
            existingBindingElement: existingBinding.el,
          }),
        },
      );
    }
    rawSignals[binding.source] = signal(readValue(binding, rawSignals));
    signalMeta[binding.source] = 'local';
    signalInitBindings[binding.source] = binding;
  }
  const methods = (setup && setup(ctx)) || {};

  for (const binding of bindings) {
    if (binding.sourceType === SIGNAL_SOURCE_TYPE) {
      configureSignalBinding(ctx, binding);
    } else if (binding.sourceType === FUNC_SOURCE_TYPE) {
      configureEventBinding(methods, binding, onCleanup);
    } else if (binding.sourceType === ASSIGNMENT_SOURCE_TYPE) {
      configureAssignmentBinding(ctx, binding);
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
  return withOptionalComponentName(
    {
      componentElement,
    },
    componentElement.getAttribute('het-component'),
  );
}

function withOptionalComponentName(cause, componentName, property = 'componentName') {
  if (componentName) {
    cause[property] = componentName;
  }
  return cause;
}

function getMountableComponent(el) {
  const name = el.getAttribute('het-component');
  if (name === '') {
    return { };
  }
  if (!components.has(name)) {
    return undefined;
  }
  return {
    setup: components.get(name),
  };
}

function getBindingCause(binding, extra = {}) {
  return withOptionalComponentName(
    {
      componentElement: binding.componentElement,
      bindingAttribute: binding.attrName ?? binding.dirName,
      bindingDeclaration: binding.exp,
      bindingElement: binding.el,
      ...extra,
    },
    binding.componentName,
  );
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

    const invalidImportLoggingContext = {
      ...componentLoggingContext,
      bindingAttribute: IMPORTS_ATTR,
      bindingDeclaration: declaration,
    };
    throw new Error(
      'HET Error: Invalid import declaration',
      { cause: invalidImportLoggingContext },
    );
  });
}

function getBindings(boundEls, componentLoggingContext) {
  const bindings = [];
  for (const el of boundEls) {
    for (const attrName of el.getAttributeNames()) {
      const parsedAttr = getParsedDirectiveAttributeName(attrName);
      if (!parsedAttr) continue;
      bindings.push(...getParsedBindingDeclarations(
        parsedAttr.directive,
        parsedAttr.attrName,
        parsedAttr.acquisitionStrategy,
        el,
        componentLoggingContext,
      ));
    }
  }
  return bindings;
}

function getParsedDirectiveAttributeName(attrName) {
  if (DIRECTIVE_BY_NAME[attrName]) {
    return {
      directive: DIRECTIVE_BY_NAME[attrName],
      attrName,
    };
  }

  const separatorIndex = attrName.lastIndexOf(':');
  if (separatorIndex === -1) return undefined;

  const baseName = attrName.slice(0, separatorIndex);
  const acquisitionStrategy = attrName.slice(separatorIndex + 1);
  const directive = DIRECTIVE_BY_NAME[baseName];
  if (
    !directive ||
    !directive.read ||
    !directive.write ||
    !ACQUISITION_STRATEGIES.includes(acquisitionStrategy)
  ) {
    return undefined;
  }

  if (acquisitionStrategy === 'sync' && directive.allowSync === false) {
    return undefined;
  }

  return {
    directive,
    attrName,
    acquisitionStrategy,
  };
}

function getParsedBindingDeclarations(
  directive,
  attrName,
  acquisitionStrategy,
  el,
  componentLoggingContext,
) {
  const rawAttr = el.getAttribute(attrName) || '';
  const declarations = directive.allowMultiple
    ? rawAttr.split(/\s+/).filter(Boolean)
    : [rawAttr];

  if (directive.name === 'het-on') {
    return declarations.map((declaration) =>
      getParsedEventDeclaration(attrName, el, declaration, componentLoggingContext),
    );
  }

  if (directive.name === 'het-toggle') {
    return declarations.map((declaration) =>
      getParsedToggleDeclaration(attrName, el, declaration, componentLoggingContext),
    );
  }

  if (directive.name === 'het-seed' || directive.name === 'het-sync') {
    return declarations.map((declaration) =>
      getParsedReadDeclaration(directive, attrName, el, declaration, componentLoggingContext),
    );
  }

  return declarations.map((declaration) => {
    return getParsedSignalBinding(
      directive,
      attrName,
      acquisitionStrategy,
      el,
      declaration,
      componentLoggingContext,
    );
  });
}

function getParsedSignalBinding(
  directive,
  attrName,
  acquisitionStrategy,
  el,
  declaration,
  componentLoggingContext,
) {
  const bindingLoggingContext = {
    ...componentLoggingContext,
    bindingAttribute: attrName,
    bindingDeclaration: declaration,
    bindingElement: el,
  };
  const parts = declaration.split('=');
  let key;
  let sourceExpression;

  if (directive.name === 'het-text') {
    if (parts.length !== 1) {
      throwInvalidBindingExpression(
        bindingLoggingContext,
        'het-text binding must be a signal name',
      );
    }
    if (!parts[0]) {
      throwInvalidBindingExpression(
        bindingLoggingContext,
        'het-text binding requires a signal name',
      );
    }
    key = directive.defaultKey;
    sourceExpression = parts[0];
  } else if (directive.name === 'het-model') {
    if (parts.length !== 1) {
      throwInvalidBindingExpression(
        bindingLoggingContext,
        'het-model binding must be a signal name',
      );
    }
    if (!parts[0]) {
      throwInvalidBindingExpression(
        bindingLoggingContext,
        'het-model binding requires a signal name',
      );
    }
    key = inferModelKey(el);
    sourceExpression = parts[0];
    acquisitionStrategy = 'seed';
  } else if (directive.keyRequired) {
    if (parts.length !== 2) {
      throwInvalidBindingExpression(
        bindingLoggingContext,
        'Binding declaration must contain exactly one "="',
      );
    }
    if (parts.some((part) => part.length === 0)) {
      throwInvalidBindingExpression(
        bindingLoggingContext,
        'Binding declaration requires a target and source',
      );
    }
    [key, sourceExpression] = parts;
  } else {
    throwInvalidBindingExpression(
      bindingLoggingContext,
      'Unsupported binding directive',
    );
  }

  const parsedSource = getParsedSignalExpression(
    directive,
    sourceExpression,
    Boolean(acquisitionStrategy) || directive.name === 'het-model',
    bindingLoggingContext,
  );

  if (parsedSource.typeHint && !directive.allowTypeHint) {
    const unsupportedTypeHintLoggingContext = {
      ...bindingLoggingContext,
    };
    throw new Error(
      'HET Error: Directive does not support type hints',
      { cause: unsupportedTypeHintLoggingContext },
    );
  }

  if (acquisitionStrategy && parsedSource.negated) {
    const negatedAcquisitionLoggingContext = {
      ...bindingLoggingContext,
    };
    throw new Error(
      'HET Error: Negation cannot be used with acquisition',
      { cause: negatedAcquisitionLoggingContext },
    );
  }

  return {
      dirName: directive.name,
      attrName,
      el,
      componentElement: componentLoggingContext.componentElement,
      componentName: componentLoggingContext.componentName,
      key,
      source: parsedSource.source,
      negated: parsedSource.negated,
      sourceType: directive.sourceType,
      read: directive.read,
      write: directive.write,
      typeHint: parsedSource.typeHint,
      acquisitionStrategy,
      exp: declaration,
    };
}

function getParsedEventDeclaration(
  attrName,
  el,
  declaration,
  componentLoggingContext,
) {
  const bindingLoggingContext = {
    ...componentLoggingContext,
    bindingAttribute: attrName,
    bindingDeclaration: declaration,
    bindingElement: el,
  };
  const parts = declaration.split('->');

  if (parts.length !== 2) {
    throwInvalidBindingExpression(
      bindingLoggingContext,
      'Event binding must contain exactly one "->"',
    );
  }
  if (parts.some((part) => part.length === 0)) {
    throwInvalidBindingExpression(
      bindingLoggingContext,
      'Event binding requires an event and action',
    );
  }

  const [eventExpression, actionExpression] = parts;
  const parsedEvent = getParsedEventExpression(
    eventExpression,
    bindingLoggingContext,
  );
  const assignmentParts = actionExpression.split('=');

  if (assignmentParts.length === 1) {
    if (actionExpression.startsWith('!')) {
      const unsupportedNegationLoggingContext = {
        ...bindingLoggingContext,
      };
      throw new Error(
        'HET Error: Unsupported negation',
        { cause: unsupportedNegationLoggingContext },
      );
    }
    return {
      dirName: 'het-on',
      attrName,
      el,
      componentElement: componentLoggingContext.componentElement,
      componentName: componentLoggingContext.componentName,
      key: parsedEvent.name,
      eventModifiers: parsedEvent.modifiers,
      source: actionExpression,
      sourceType: FUNC_SOURCE_TYPE,
      exp: declaration,
    };
  }

  if (
    assignmentParts.length !== 2
  ) {
    throwInvalidBindingExpression(
      bindingLoggingContext,
      'Event assignment must contain exactly one "="',
    );
  }

  if (assignmentParts.some((part) => part.length === 0)) {
    throwInvalidBindingExpression(
      bindingLoggingContext,
      'Event assignment requires a signal name and source',
    );
  }

  const [source, assignmentSourceExpression] = assignmentParts;

  return {
    dirName: 'het-on',
    attrName,
    el,
    componentElement: componentLoggingContext.componentElement,
    componentName: componentLoggingContext.componentName,
    key: parsedEvent.name,
    eventModifiers: parsedEvent.modifiers,
    source,
    sourceType: ASSIGNMENT_SOURCE_TYPE,
    assignmentSource: getParsedReadSource(
      assignmentSourceExpression,
      { allowDefaultProp: false },
      bindingLoggingContext,
    ),
    exp: declaration,
  };
}

function getParsedToggleDeclaration(
  attrName,
  el,
  declaration,
  componentLoggingContext,
) {
  const bindingLoggingContext = {
    ...componentLoggingContext,
    bindingAttribute: attrName,
    bindingDeclaration: declaration,
    bindingElement: el,
  };
  const parts = declaration.split('->');

  if (parts.length !== 2) {
    throwInvalidBindingExpression(
      bindingLoggingContext,
      'Toggle binding must contain exactly one "->"',
    );
  }
  if (parts.some((part) => part.length === 0)) {
    throwInvalidBindingExpression(
      bindingLoggingContext,
      'Toggle binding requires an event and signal name',
    );
  }

  const [eventExpression, source] = parts;
  const parsedEvent = getParsedEventExpression(
    eventExpression,
    bindingLoggingContext,
  );

  return {
    dirName: 'het-toggle',
    attrName,
    el,
    componentElement: componentLoggingContext.componentElement,
    componentName: componentLoggingContext.componentName,
    key: parsedEvent.name,
    eventModifiers: parsedEvent.modifiers,
    source,
    sourceType: ASSIGNMENT_SOURCE_TYPE,
    assignmentSource: {
      kind: 'signal',
      source,
      negated: true,
    },
    exp: declaration,
  };
}

function getParsedReadDeclaration(
  directive,
  attrName,
  el,
  declaration,
  componentLoggingContext,
) {
  const bindingLoggingContext = {
    ...componentLoggingContext,
    bindingAttribute: attrName,
    bindingDeclaration: declaration,
    bindingElement: el,
  };
  const parts = declaration.split('=');

  if (parts.length !== 2) {
    throwInvalidBindingExpression(
      bindingLoggingContext,
      'Read binding must contain exactly one "="',
    );
  }
  if (parts.some((part) => part.length === 0)) {
    throwInvalidBindingExpression(
      bindingLoggingContext,
      'Read binding requires a signal name and source',
    );
  }

  const [signalName, sourceExpression] = parts;
  if (signalName.startsWith('!') || signalName.includes('[') || signalName.includes(']')) {
    throwInvalidBindingExpression(
      bindingLoggingContext,
      'Read binding target must be a signal name',
    );
  }

  return {
    dirName: directive.name,
    attrName,
    el,
    componentElement: componentLoggingContext.componentElement,
    componentName: componentLoggingContext.componentName,
    source: signalName,
    sourceType: READ_SOURCE_TYPE,
    readSource: getParsedReadSource(
      sourceExpression,
      { allowDefaultProp: true },
      bindingLoggingContext,
    ),
    acquisitionStrategy: directive.acquisitionStrategy,
    exp: declaration,
  };
}

function getParsedEventExpression(eventExpression, bindingLoggingContext) {
  const parts = eventExpression.split('.');
  const parsedModifiers = [];

  if (parts.some((part) => part.length === 0)) {
    throwInvalidBindingExpression(
      bindingLoggingContext,
      'Event modifier cannot be empty',
    );
  }

  while (parts.length > 1) {
    const parsedModifier = getParsedEventModifier(
      parts.at(-1),
      bindingLoggingContext,
    );
    if (!parsedModifier) break;
    parsedModifiers.unshift(parsedModifier);
    parts.pop();
  }

  const eventName = parts.join('.');
  if (!eventName) {
    throwInvalidBindingExpression(
      bindingLoggingContext,
      'Event name is required',
    );
  }

  return {
    name: eventName,
    modifiers: getValidatedEventModifiers(
      eventName,
      parsedModifiers,
      bindingLoggingContext,
    ),
  };
}

function getParsedEventModifier(modifierExpression, bindingLoggingContext) {
  if (
    modifierExpression === 'prevent' ||
    modifierExpression === 'stop' ||
    modifierExpression === 'once' ||
    modifierExpression === 'capture' ||
    modifierExpression === 'esc' ||
    modifierExpression === 'enter' ||
    modifierExpression === 'space'
  ) {
    return { name: modifierExpression };
  }

  if (
    modifierExpression.startsWith('debounce') ||
    modifierExpression.startsWith('throttle')
  ) {
    return getParsedTimingModifier(modifierExpression, bindingLoggingContext);
  }

  return undefined;
}

function getParsedTimingModifier(modifierExpression, bindingLoggingContext) {
  const match = /^(debounce|throttle)\((\d+)\)$/.exec(modifierExpression);
  if (!match) {
    const invalidModifierLoggingContext = {
      ...bindingLoggingContext,
      eventModifier: modifierExpression,
    };
    throw new Error(
      'HET Error: Invalid event modifier',
      { cause: invalidModifierLoggingContext },
    );
  }

  const delay = parseInt(match[2], 10);
  if (delay <= 0) {
    const invalidModifierLoggingContext = {
      ...bindingLoggingContext,
      eventModifier: modifierExpression,
    };
    throw new Error(
      'HET Error: Invalid event modifier',
      { cause: invalidModifierLoggingContext },
    );
  }

  return {
    name: match[1],
    delay,
  };
}

function getValidatedEventModifiers(
  eventName,
  parsedModifiers,
  bindingLoggingContext,
) {
  const modifiers = {
    prevent: false,
    stop: false,
    once: false,
    capture: false,
    debounce: undefined,
    throttle: undefined,
    key: undefined,
  };

  for (const modifier of parsedModifiers) {
    if (modifier.name === 'prevent') modifiers.prevent = true;
    if (modifier.name === 'stop') modifiers.stop = true;
    if (modifier.name === 'once') modifiers.once = true;
    if (modifier.name === 'capture') modifiers.capture = true;

    if (modifier.name === 'debounce' || modifier.name === 'throttle') {
      if (modifiers.debounce || modifiers.throttle) {
        const duplicateTimingLoggingContext = {
          ...bindingLoggingContext,
          eventModifier: modifier.name,
        };
        throw new Error(
          'HET Error: Invalid event modifier',
          { cause: duplicateTimingLoggingContext },
        );
      }
      modifiers[modifier.name] = modifier.delay;
    }

    if (
      modifier.name === 'esc' ||
      modifier.name === 'enter' ||
      modifier.name === 'space'
    ) {
      if (modifiers.key) {
        const duplicateKeyLoggingContext = {
          ...bindingLoggingContext,
          eventModifier: modifier.name,
        };
        throw new Error(
          'HET Error: Invalid event modifier',
          { cause: duplicateKeyLoggingContext },
        );
      }
      modifiers.key = modifier.name;
    }
  }

  if (modifiers.key && !KEYBOARD_EVENT_NAMES.includes(eventName)) {
    const invalidKeyLoggingContext = {
      ...bindingLoggingContext,
      eventModifier: modifiers.key,
    };
    throw new Error(
      'HET Error: Invalid event modifier',
      { cause: invalidKeyLoggingContext },
    );
  }

  return modifiers;
}

function getParsedSignalExpression(
  directive,
  sourceExpression,
  allowTypeHint,
  bindingLoggingContext,
) {
  let negated = false;
  let expression = sourceExpression;

  if (expression.startsWith('!')) {
    negated = true;
    expression = expression.slice(1);
  }

  if (negated && !directive.allowNegation) {
    const unsupportedNegationLoggingContext = {
      ...bindingLoggingContext,
    };
    throw new Error(
      'HET Error: Unsupported negation',
      { cause: unsupportedNegationLoggingContext },
    );
  }

  if (!expression) {
    if (negated) {
      const missingNegatedSignalLoggingContext = {
        ...bindingLoggingContext,
      };
      throw new Error(
        'HET Error: Negation requires a signal name',
        { cause: missingNegatedSignalLoggingContext },
      );
    }
    throwInvalidBindingExpression(
      bindingLoggingContext,
      'Signal name is required',
    );
  }

  return {
    ...getValidatedSignalSource(expression, allowTypeHint, bindingLoggingContext),
    negated,
  };
}

function getValidatedSignalSource(expression, allowTypeHint, bindingLoggingContext) {
  const { value, typeHint } = getValueAndTypeHint(expression, bindingLoggingContext);

  if (value.includes(':')) {
    throwInvalidBindingExpression(
      bindingLoggingContext,
      'Signal source cannot contain ":"',
    );
  }

  if (typeHint && !allowTypeHint) {
    const unsupportedTypeHintLoggingContext = {
      ...bindingLoggingContext,
    };
    throw new Error(
      'HET Error: Type hints are only supported for DOM reads',
      { cause: unsupportedTypeHintLoggingContext },
    );
  }

  return {
    source: value,
    typeHint,
  };
}

function getParsedReadSource(
  sourceExpression,
  options,
  bindingLoggingContext,
) {
  let negated = false;
  let expression = sourceExpression;

  if (expression.startsWith('!')) {
    negated = true;
    expression = expression.slice(1);
  }

  if (!expression) {
    throwInvalidBindingExpression(
      bindingLoggingContext,
      'Read source cannot be empty',
    );
  }

  const { value, typeHint } = getValueAndTypeHint(expression, bindingLoggingContext);
  const prefixedSource = getKnownReadSource(value);
  const source = prefixedSource ?? (
    options.allowDefaultProp && !value.includes(':')
      ? { kind: 'property', source: value }
      : { kind: 'signal', source: value }
  );

  if (!source.source) {
    throwInvalidBindingExpression(
      bindingLoggingContext,
      'Read source name is required',
    );
  }

  if (typeHint && source.kind !== 'property' && source.kind !== 'attribute' && source.kind !== 'literal') {
    const unsupportedReadTypeHintLoggingContext = {
      ...bindingLoggingContext,
    };
    throw new Error(
      'HET Error: Directive does not support type hints',
      { cause: unsupportedReadTypeHintLoggingContext },
    );
  }

  return {
    ...source,
    typeHint,
    negated,
  };
}

function getKnownReadSource(value) {
  if (value.startsWith('prop:')) {
    return { kind: 'property', source: value.slice('prop:'.length) };
  }
  if (value.startsWith('attr:')) {
    return { kind: 'attribute', source: value.slice('attr:'.length) };
  }
  if (value.startsWith('bool-attr:')) {
    return { kind: 'booleanAttribute', source: value.slice('bool-attr:'.length) };
  }
  if (value.startsWith('class:')) {
    return { kind: 'class', source: value.slice('class:'.length) };
  }
  if (value.startsWith('literal:')) {
    return { kind: 'literal', source: value.slice('literal:'.length) };
  }
  return undefined;
}

function throwInvalidBindingExpression(bindingLoggingContext, reason = 'Invalid binding expression') {
  const invalidBindingLoggingContext = {
    ...bindingLoggingContext,
    bindingErrorReason: reason,
  };
  throw new Error(
    `HET Error: ${reason}`,
    { cause: invalidBindingLoggingContext },
  );
}

function escapeAttributeSelectorName(name) {
  return name.replace(/:/g, '\\:');
}

function getValueAndTypeHint(expression, bindingLoggingContext) {
  const typeHintStart = expression.indexOf('[');

  if (typeHintStart === -1) {
    if (expression.includes(']')) {
      throwInvalidBindingExpression(
        bindingLoggingContext,
        'Type hint is incomplete',
      );
    }
    return { value: expression };
  }

  if (!expression.endsWith(']')) {
    throwInvalidBindingExpression(
      bindingLoggingContext,
      'Type hint is incomplete',
    );
  }

  const value = expression.slice(0, typeHintStart);
  const typeHint = expression.slice(typeHintStart + 1, -1);

  if (!value || !TYPE_HINTS.includes(typeHint)) {
    const invalidTypeHintLoggingContext = {
      ...bindingLoggingContext,
      bindingTypeHint: typeHint,
    };
    throw new Error(
      'HET Error: Type hint is not recognised. Expected type hints are "int", "bool" or "float"',
      { cause: invalidTypeHintLoggingContext },
    );
  }

  return { value, typeHint };
}


function configureEventBinding(methods, binding, onCleanup) {
  const handler = methods?.[binding.source];
  if (typeof handler !== 'function') {
    throw new Error(
      'HET Error: Missing component method',
      { cause: getBindingCause(binding, { methodName: binding.source }) },
    );
  }
  configureEventListener(
    binding,
    handler.bind(methods),
    onCleanup,
  );
}

function configureAssignmentBinding(ctx, binding) {
  const signalRef = ctx.signals[binding.source];
  if (!signalRef) {
    throw new Error(
      'HET Error: Bound signal does not exist',
      { cause: getBindingCause(binding, { signalName: binding.source }) },
    );
  }

  const listener = () => {
    try {
      signalRef.value = getAssignmentValue(ctx, binding);
    } catch (error) {
      onError(error);
    }
  };

  configureEventListener(binding, listener, ctx.onCleanup);
}

function configureEventListener(binding, action, onCleanup) {
  const modifiers = binding.eventModifiers || {};
  const listenerState = {
    debounceTimer: undefined,
    lastThrottleTime: 0,
  };

  const runAction = (event) => {
    if (modifiers.debounce) {
      clearTimeout(listenerState.debounceTimer);
      listenerState.debounceTimer = setTimeout(() => action(event), modifiers.debounce);
      return;
    }

    if (modifiers.throttle) {
      const now = Date.now();
      if (now - listenerState.lastThrottleTime < modifiers.throttle) return;
      listenerState.lastThrottleTime = now;
    }

    action(event);
  };

  const listener = (event) => {
    if (!eventMatchesKeyModifier(event, modifiers.key)) return;

    if (modifiers.prevent) event.preventDefault();
    if (modifiers.stop) event.stopPropagation();

    runAction(event);
  };

  const listenerOptions = {
    capture: modifiers.capture,
    once: modifiers.once,
  };

  binding.el.addEventListener(binding.key, listener, listenerOptions);
  onCleanup(() => {
    clearTimeout(listenerState.debounceTimer);
    binding.el.removeEventListener(binding.key, listener, listenerOptions);
  });
}

function eventMatchesKeyModifier(event, keyModifier) {
  if (!keyModifier) return true;

  if (keyModifier === 'esc') {
    return event.key === 'Escape' || event.key === 'Esc';
  }
  if (keyModifier === 'enter') {
    return event.key === 'Enter';
  }
  if (keyModifier === 'space') {
    return event.key === ' ' || event.key === 'Spacebar';
  }

  return true;
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
        const nextValue = readValue(binding, ctx.signals);
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
          const component = getMountableComponent(el);
          if (component && mountComponent(el, component.setup)) {
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

function readValue(binding, signals) {
  const rawValue = binding.readSource
    ? getReadSourceValue(binding, binding.readSource, signals)
    : binding.read(binding.el, binding.key);

  return parseValue(rawValue, binding.typeHint);
}

function getReadSourceValue(binding, readSource, signals) {
  let rawValue;

  if (readSource.kind === 'signal') {
    const signalRef = signals?.[readSource.source];
    if (!signalRef) {
      throw new Error(
        'HET Error: Bound signal does not exist',
        { cause: getBindingCause(binding, { signalName: readSource.source }) },
      );
    }
    rawValue = signalRef.value;
  } else if (readSource.kind === 'property') {
    rawValue = binding.el[readSource.source];
  } else if (readSource.kind === 'attribute') {
    rawValue = binding.el.getAttribute(readSource.source);
  } else if (readSource.kind === 'booleanAttribute') {
    rawValue = binding.el.hasAttribute(readSource.source);
  } else if (readSource.kind === 'class') {
    rawValue = binding.el.classList.contains(readSource.source);
  } else {
    rawValue = readSource.source;
  }

  const parsedValue = parseValue(rawValue, readSource.typeHint);
  return readSource.negated ? !parsedValue : parsedValue;
}

function getAssignmentValue(ctx, binding) {
  return getReadSourceValue(binding, binding.assignmentSource, ctx.signals);
}

function parseValue(rawValue, typeHint) {
  if (typeHint === 'int') {
    return parseInt(rawValue, 10);
  }

  if (typeHint === 'float') {
    return parseFloat(rawValue);
  }

  if (typeHint === 'bool') {
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
      const nextValue = readValue(binding, instance.rawSignals);
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
      const missingExportingAncestorLoggingContext = {
        ...componentLoggingContext,
        bindingAttribute: IMPORTS_ATTR,
        importLocalSignalName: local,
        importSourceSignalName: source,
      };
      throw new Error(
        'HET Error: Imported signal has no exporting ancestor',
        { cause: missingExportingAncestorLoggingContext },
      );
    }

    const parentInstance = parentEl.__het_instance;
    if (!parentInstance) {
      const unmountedExportingAncestorLoggingContext = withOptionalComponentName(
        {
          ...componentLoggingContext,
          bindingAttribute: IMPORTS_ATTR,
          exportingComponentElement: parentEl,
          importLocalSignalName: local,
          importSourceSignalName: source,
        },
        parentEl.getAttribute('het-component'),
        'exportingComponentName',
      );
      throw new Error(
        'HET Error: Exporting ancestor component is not mounted',
        { cause: unmountedExportingAncestorLoggingContext },
      );
    }

    const parentSignal = parentInstance.signals?.[source];
    if (!parentSignal) {
      const missingExportedSignalLoggingContext = withOptionalComponentName(
        {
          ...componentLoggingContext,
          bindingAttribute: IMPORTS_ATTR,
          exportingComponentElement: parentEl,
          importLocalSignalName: local,
          importSourceSignalName: source,
        },
        parentEl.getAttribute('het-component'),
        'exportingComponentName',
      );
      throw new Error(
        'HET Error: Exporting ancestor does not provide imported signal',
        { cause: missingExportedSignalLoggingContext },
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
        const signalOverrideLoggingContext = {
          ...componentLoggingContext,
          signalName: prop,
        };
        throw new Error(
          'HET Error: Signal override after initialization',
          { cause: signalOverrideLoggingContext },
        );
      }
      if (value?.brand !== PREACT_SIGNAL_BRAND) {
        const invalidSignalLoggingContext = {
          ...componentLoggingContext,
          signalName: String(prop),
        };
        throw new Error(
          'HET Error: Signal initialized with a non-signal value',
          { cause: invalidSignalLoggingContext },
        );
      }
      obj[prop] = value;
      return true;
    },
  });
}
