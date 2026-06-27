import {
  ACQUISITION_STRATEGIES,
  ASSIGNMENT_SOURCE_TYPE,
  CONTEXTUAL_IDENTIFIERS,
  FUNC_SOURCE_TYPE,
  IF_ATTR,
  INTRINSIC_IDENTIFIERS,
  KEYBOARD_EVENT_NAMES,
  MODEL_TYPES,
  READ_SOURCE_TYPE,
  SIGNAL_SOURCE_TYPE,
  STRUCTURAL_ATTRS,
} from '../constants.js';
import { DIRECTIVE_BY_NAME } from '../directives.js';
import { getExpressionMetadata, inferModelKey } from '../expressions.js';
import { throwInvalidBindingExpression } from '../logging.js';
import { recordMountCount } from '../metrics.js';

const directiveAttributeCache = new Map();
const bindingDescriptorCache = new Map();
const splitDeclarationCache = new Map();

function getBindings(boundEls, componentLoggingContext) {
  const bindings = [];
  for (const el of boundEls) {
    const elementBindings = [];
    for (const attrName of el.getAttributeNames()) {
      const parsedAttr = getParsedDirectiveAttributeName(attrName);
      if (!parsedAttr) continue;
      elementBindings.push(...getParsedBindingDeclarations(
        parsedAttr.directive,
        parsedAttr.attrName,
        parsedAttr.acquisitionStrategy,
        el,
        componentLoggingContext,
        parsedAttr.modelType,
      ));
    }
    bindings.push(...coordinateElementBindings(elementBindings));
  }
  return bindings;
}

function coordinateElementBindings(bindings) {
  const attrBindingKeys = new Set();
  const boolBindingsByKey = new Map();

  for (const binding of bindings) {
    if (
      binding.sourceType === SIGNAL_SOURCE_TYPE &&
      binding.dirName === 'het-attrs'
    ) {
      attrBindingKeys.add(binding.key);
    }

    if (
      binding.sourceType === SIGNAL_SOURCE_TYPE &&
      binding.dirName === 'het-bool-attrs'
    ) {
      if (!boolBindingsByKey.has(binding.key)) {
        boolBindingsByKey.set(binding.key, binding);
      }
    }
  }

  if (!boolBindingsByKey.size) return bindings;

  return bindings.flatMap((binding) => {
    if (
      binding.sourceType === SIGNAL_SOURCE_TYPE &&
      binding.dirName === 'het-attrs'
    ) {
      const boolBinding = boolBindingsByKey.get(binding.key);
      if (!boolBinding) return [binding];

      return [{
        dirName: 'het-attrs+het-bool-attrs',
        sourceType: SIGNAL_SOURCE_TYPE,
        attrBinding: binding,
        boolBinding,
      }];
    }

    if (
      binding.sourceType === SIGNAL_SOURCE_TYPE &&
      binding.dirName === 'het-bool-attrs' &&
      attrBindingKeys.has(binding.key)
    ) {
      return [];
    }

    return [binding];
  });
}

function getStructuralBindings(templateEls, componentLoggingContext) {
  return templateEls.map((el) => getStructuralBinding(el, componentLoggingContext));
}

function getParsedDirectiveAttributeName(attrName) {
  if (directiveAttributeCache.has(attrName)) {
    recordMountCount('directiveAttrCacheHits');
    return directiveAttributeCache.get(attrName);
  }

  recordMountCount('directiveAttrCacheMisses');
  const parsedAttr = getParsedDirectiveAttributeNameUncached(attrName);
  directiveAttributeCache.set(attrName, parsedAttr);
  return parsedAttr;
}

function getParsedDirectiveAttributeNameUncached(attrName) {
  if (DIRECTIVE_BY_NAME[attrName]) {
    return {
      directive: DIRECTIVE_BY_NAME[attrName],
      attrName,
    };
  }

  const separatorIndex = attrName.lastIndexOf(':');
  if (separatorIndex === -1) return undefined;

  const baseName = attrName.slice(0, separatorIndex);
  const suffix = attrName.slice(separatorIndex + 1);
  const directive = DIRECTIVE_BY_NAME[baseName];

  if (baseName === 'het-model' && MODEL_TYPES.includes(suffix)) {
    return {
      directive,
      attrName,
      modelType: suffix,
    };
  }

  if (!directive || !ACQUISITION_STRATEGIES.includes(suffix)) {
    return undefined;
  }

  return {
    directive,
    attrName,
    acquisitionStrategy: suffix,
  };
}

function getParsedBindingDeclarations(
  directive,
  attrName,
  acquisitionStrategy,
  el,
  componentLoggingContext,
  modelType,
) {
  const rawAttr = el.getAttribute(attrName) || '';
  const cacheKey = `${attrName}\n${rawAttr}`;
  const cached = bindingDescriptorCache.get(cacheKey);
  if (cached) {
    recordMountCount('bindingParseCacheHits');
    return cached.map((descriptor) =>
      hydrateBindingDescriptor(descriptor, el, componentLoggingContext),
    );
  }

  recordMountCount('bindingParseCacheMisses');
  const bindingLoggingContext = {
    ...componentLoggingContext,
    bindingAttribute: attrName,
    bindingDeclaration: rawAttr,
    bindingElement: el,
  };
  const declarations = directive.allowMultiple
    ? getSplitBindingDeclarations(rawAttr, bindingLoggingContext)
    : [rawAttr];

  if (directive.name === 'het-on') {
    return cacheBindingDescriptors(cacheKey, declarations.map((declaration) =>
      getParsedEventDeclarationDescriptor(attrName, declaration, componentLoggingContext, el),
    ), el, componentLoggingContext);
  }

  if (directive.name === 'het-seed' || directive.name === 'het-sync') {
    return cacheBindingDescriptors(cacheKey, declarations.map((declaration) =>
      getParsedReadDeclarationDescriptor(directive, attrName, declaration, componentLoggingContext, el),
    ), el, componentLoggingContext);
  }

  return cacheBindingDescriptors(cacheKey, declarations.map((declaration) => getParsedSignalBindingDescriptor(
    directive,
    attrName,
    acquisitionStrategy,
    declaration,
    componentLoggingContext,
    el,
    modelType,
  )), el, componentLoggingContext);
}

function cacheBindingDescriptors(cacheKey, descriptors, el, componentLoggingContext) {
  bindingDescriptorCache.set(cacheKey, descriptors);
  return descriptors.map((descriptor) =>
    hydrateBindingDescriptor(descriptor, el, componentLoggingContext),
  );
}

function hydrateBindingDescriptor(descriptor, el, componentLoggingContext) {
  const binding = {
    ...descriptor,
    el,
    componentElement: componentLoggingContext.componentElement,
    componentName: componentLoggingContext.componentName,
  };

  if (descriptor.inferModelKey) {
    binding.key = inferModelKey(el);
    delete binding.inferModelKey;
  }

  return binding;
}

function getStructuralBinding(el, componentLoggingContext) {
  const componentRoot = getTemplateComponentRoot(el, componentLoggingContext);
  const presentAttrs = STRUCTURAL_ATTRS.filter((attrName) => el.hasAttribute(attrName));

  if (presentAttrs.length !== 1) {
    throw new Error(
      'HET Error: Structural template requires exactly one directive',
      {
        cause: {
          ...componentLoggingContext,
          bindingElement: el,
        },
      },
    );
  }

  const attrName = presentAttrs[0];
  const declaration = el.getAttribute(attrName) || '';
  const bindingLoggingContext = {
    ...componentLoggingContext,
    bindingAttribute: attrName,
    bindingDeclaration: declaration,
    bindingElement: el,
  };
  return {
    dirName: attrName,
    attrName,
    el,
    componentElement: componentLoggingContext.componentElement,
    componentName: componentLoggingContext.componentName,
    componentRoot,
    source: getValidatedSignalIdentifier(declaration, bindingLoggingContext),
    exp: declaration,
  };
}

function getTemplateComponentRoot(templateEl, componentLoggingContext) {
  const fragment = templateEl.content;
  const elementChildren = Array.from(fragment.childNodes).filter(
    (node) => node.nodeType === Node.ELEMENT_NODE,
  );
  const invalidContent = Array.from(fragment.childNodes).some((node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      return node.textContent.trim().length > 0;
    }
    return (
      node.nodeType !== Node.ELEMENT_NODE &&
      node.nodeType !== Node.COMMENT_NODE
    );
  });

  if (invalidContent || elementChildren.length !== 1) {
    throw new Error(
      'HET Error: Structural template must contain exactly one root element',
      {
        cause: {
          ...componentLoggingContext,
          bindingElement: templateEl,
        },
      },
    );
  }

  const [componentRoot] = elementChildren;
  if (!componentRoot.hasAttribute('het-component')) {
    throw new Error(
      'HET Error: Structural template root must be a component',
      {
        cause: {
          ...componentLoggingContext,
          bindingElement: templateEl,
          structuralRootElement: componentRoot,
        },
      },
    );
  }

  return componentRoot;
}

function getSplitBindingDeclarations(rawAttr, bindingLoggingContext) {
  const cached = splitDeclarationCache.get(rawAttr);
  if (cached) return cached;

  try {
    const declarations = splitTopLevel(rawAttr, ';');
    splitDeclarationCache.set(rawAttr, declarations);
    return declarations;
  } catch (error) {
    if (error.message === 'HET Error: Empty binding declaration') {
      throwInvalidBindingExpression(bindingLoggingContext, 'Empty binding declaration');
    }
    throw error;
  }
}

function getParsedSignalBindingDescriptor(
  directive,
  attrName,
  acquisitionStrategy,
  declaration,
  componentLoggingContext,
  el,
  modelType,
) {
  const bindingLoggingContext = {
    ...componentLoggingContext,
    bindingAttribute: attrName,
    bindingDeclaration: declaration,
    bindingElement: el,
  };
  let key;
  let expressionMetadata;
  let source;

  if (directive.name === 'het-text') {
    if (!declaration) {
      throwInvalidBindingExpression(
        bindingLoggingContext,
        'het-text binding requires an expression',
      );
    }
    key = directive.defaultKey;
    expressionMetadata = getExpressionMetadata(declaration, bindingLoggingContext);
  } else if (directive.name === 'het-model') {
    if (!declaration) {
      throwInvalidBindingExpression(
        bindingLoggingContext,
        'het-model binding requires a signal name',
      );
    }
    if (findTopLevelOperatorIndex(declaration, '=') !== -1) {
      throwInvalidBindingExpression(
        bindingLoggingContext,
        'het-model binding must be a signal name',
      );
    }
    source = getValidatedSignalIdentifier(declaration, bindingLoggingContext);
    key = inferModelKey(el);
    acquisitionStrategy = 'seed';
    expressionMetadata = undefined;
  } else if (directive.keyRequired) {
    const splitIndex = getTopLevelAssignmentIndex(declaration);
    if (splitIndex === -1) {
      throwInvalidBindingExpression(
        bindingLoggingContext,
        'Binding declaration must contain exactly one "="',
      );
    }
    key = declaration.slice(0, splitIndex).trim();
    const sourceExpression = declaration.slice(splitIndex + 1).trim();
    if (!key || !sourceExpression) {
      throwInvalidBindingExpression(
        bindingLoggingContext,
        'Binding declaration requires a target and source',
      );
    }
    expressionMetadata = getExpressionMetadata(sourceExpression, bindingLoggingContext);
  } else {
    throwInvalidBindingExpression(
      bindingLoggingContext,
      'Unsupported binding directive',
    );
  }

  if (
    directive.sourceType === SIGNAL_SOURCE_TYPE &&
    directive.name !== 'het-model' &&
    expressionMetadata.hasContextuals &&
    !isStructuralKeyOnlyExpression(expressionMetadata)
  ) {
    throw new Error(
      'HET Error: Output binding expression cannot use contextual values',
      { cause: bindingLoggingContext },
    );
  }

  const descriptor = {
    dirName: directive.name,
    attrName,
    key,
    source,
    sourceType: directive.sourceType,
    write: directive.write,
    acquisitionStrategy,
    exp: declaration,
    expression: expressionMetadata,
    modelType,
  };

  if (directive.name === 'het-model') {
    descriptor.inferModelKey = true;
  }

  return descriptor;
}

function isStructuralKeyOnlyExpression(expressionMetadata) {
  return (
    expressionMetadata.contextualNames.size === 1 &&
    expressionMetadata.contextualNames.has('$key')
  );
}

function getParsedEventDeclarationDescriptor(
  attrName,
  declaration,
  componentLoggingContext,
  el,
) {
  const bindingLoggingContext = {
    ...componentLoggingContext,
    bindingAttribute: attrName,
    bindingDeclaration: declaration,
    bindingElement: el,
  };
  const arrowIndex = findTopLevelOperatorIndex(declaration, '->');
  if (arrowIndex === -1) {
    throwInvalidBindingExpression(
      bindingLoggingContext,
      'Event binding must contain exactly one "->"',
    );
  }
  if (findTopLevelOperatorIndex(declaration.slice(arrowIndex + 2), '->') !== -1) {
    throwInvalidBindingExpression(
      bindingLoggingContext,
      'Event binding must contain exactly one "->"',
    );
  }

  const eventExpression = declaration.slice(0, arrowIndex).trim();
  const actionExpression = declaration.slice(arrowIndex + 2).trim();

  if (!eventExpression || !actionExpression) {
    throwInvalidBindingExpression(
      bindingLoggingContext,
      'Event binding requires an event and action',
    );
  }

  const parsedEvent = getParsedEventExpression(
    eventExpression,
    bindingLoggingContext,
  );
  const assignmentIndex = getTopLevelAssignmentIndex(actionExpression);

  if (assignmentIndex === -1) {
    return {
      dirName: 'het-on',
      attrName,
      key: parsedEvent.name,
      eventModifiers: parsedEvent.modifiers,
      source: actionExpression,
      sourceType: FUNC_SOURCE_TYPE,
      exp: declaration,
    };
  }

  const source = actionExpression.slice(0, assignmentIndex).trim();
  const assignmentExpression = actionExpression.slice(assignmentIndex + 1).trim();
  if (!source || !assignmentExpression) {
    throwInvalidBindingExpression(
      bindingLoggingContext,
      'Event assignment requires a signal name and source',
    );
  }

  return {
    dirName: 'het-on',
    attrName,
    key: parsedEvent.name,
    eventModifiers: parsedEvent.modifiers,
    source: getValidatedSignalIdentifier(source, bindingLoggingContext),
    sourceType: ASSIGNMENT_SOURCE_TYPE,
    expression: getExpressionMetadata(assignmentExpression, bindingLoggingContext),
    exp: declaration,
  };
}

function getParsedReadDeclarationDescriptor(
  directive,
  attrName,
  declaration,
  componentLoggingContext,
  el,
) {
  const bindingLoggingContext = {
    ...componentLoggingContext,
    bindingAttribute: attrName,
    bindingDeclaration: declaration,
    bindingElement: el,
  };
  const assignmentIndex = getTopLevelAssignmentIndex(declaration);
  if (assignmentIndex === -1) {
    throwInvalidBindingExpression(
      bindingLoggingContext,
      'Read binding must contain exactly one "="',
    );
  }
  const signalName = declaration.slice(0, assignmentIndex).trim();
  const sourceExpression = declaration.slice(assignmentIndex + 1).trim();

  if (!signalName || !sourceExpression) {
    throwInvalidBindingExpression(
      bindingLoggingContext,
      'Read binding requires a signal name and source',
    );
  }

  return {
    dirName: directive.name,
    attrName,
    source: getValidatedSignalIdentifier(signalName, bindingLoggingContext),
    sourceType: READ_SOURCE_TYPE,
    expression: getExpressionMetadata(sourceExpression, bindingLoggingContext),
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

function splitTopLevel(value, separator) {
  const parts = [];
  let start = 0;
  let depth = 0;
  let quote;
  let sawSeparator = false;

  for (let index = 0; index < value.length; index += 1) {
    const char = value[index];

    if (quote) {
      if (char === '\\') {
        index += 1;
        continue;
      }
      if (char === quote) quote = undefined;
      continue;
    }

    if (char === '"' || char === '\'') {
      quote = char;
      continue;
    }

    if (char === '(' || char === '[' || char === '{') {
      depth += 1;
      continue;
    }

    if (char === ')' || char === ']' || char === '}') {
      depth -= 1;
      continue;
    }

    if (depth === 0 && value.startsWith(separator, index)) {
      const part = value.slice(start, index).trim();
      if (!part) {
        throw new Error('HET Error: Empty binding declaration');
      }
      parts.push(part);
      index += separator.length - 1;
      start = index + 1;
      sawSeparator = true;
    }
  }

  const finalPart = value.slice(start).trim();
  if (finalPart) {
    parts.push(finalPart);
  } else if (value.trim() && !(sawSeparator && value.slice(start).trim() === '')) {
    throw new Error('HET Error: Empty binding declaration');
  }

  return parts;
}

function getTopLevelAssignmentIndex(value) {
  let searchIndex = 0;
  while (searchIndex < value.length) {
    const index = findTopLevelOperatorIndex(value, '=', searchIndex);
    if (index === -1) return -1;
    if (value[index - 1] !== '=' && value[index + 1] !== '=') {
      return index;
    }
    searchIndex = index + 1;
  }
  return -1;
}

function findTopLevelOperatorIndex(value, operator, startIndex = 0) {
  let depth = 0;
  let quote;

  for (let index = startIndex; index < value.length; index += 1) {
    const char = value[index];

    if (quote) {
      if (char === '\\') {
        index += 1;
        continue;
      }
      if (char === quote) quote = undefined;
      continue;
    }

    if (char === '"' || char === '\'') {
      quote = char;
      continue;
    }

    if (char === '(' || char === '[' || char === '{') {
      depth += 1;
      continue;
    }

    if (char === ')' || char === ']' || char === '}') {
      depth -= 1;
      continue;
    }

    if (depth === 0 && value.startsWith(operator, index)) {
      return index;
    }
  }

  return -1;
}

function getValidatedSignalIdentifier(value, bindingLoggingContext) {
  if (!/^[A-Za-z_$][A-Za-z0-9_$]*$/.test(value)) {
    throwInvalidBindingExpression(
      bindingLoggingContext,
      'Signal name is required',
    );
  }

  if (CONTEXTUAL_IDENTIFIERS.has(value) || INTRINSIC_IDENTIFIERS.has(value)) {
    throwInvalidBindingExpression(
      bindingLoggingContext,
      'Signal name is required',
    );
  }

  return value;
}

export {
  getBindings,
  getStructuralBindings,
};
