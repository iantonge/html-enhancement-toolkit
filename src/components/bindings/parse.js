import {
  ACQUISITION_STRATEGIES,
  CONTEXTUAL_IDENTIFIERS,
  INTRINSIC_IDENTIFIERS,
  READ_SOURCE_TYPE,
  SIGNAL_SOURCE_TYPE,
} from '../constants.js';
import { DIRECTIVE_BY_NAME } from '../directives.js';
import { getExpressionMetadata } from '../expressions.js';
import { throwInvalidBindingExpression } from '../logging.js';

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
  const suffix = attrName.slice(separatorIndex + 1);
  const directive = DIRECTIVE_BY_NAME[baseName];

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
) {
  const rawAttr = el.getAttribute(attrName) || '';
  const bindingLoggingContext = {
    ...componentLoggingContext,
    bindingAttribute: attrName,
    bindingDeclaration: rawAttr,
    bindingElement: el,
  };
  const declarations = directive.allowMultiple
    ? getSplitBindingDeclarations(rawAttr, bindingLoggingContext)
    : [rawAttr];

  if (directive.name === 'het-seed') {
    return declarations.map((declaration) =>
      getParsedReadDeclaration(directive, attrName, el, declaration, componentLoggingContext),
    );
  }

  return declarations.map((declaration) => getParsedSignalBinding(
    directive,
    attrName,
    acquisitionStrategy,
    el,
    declaration,
    componentLoggingContext,
  ));
}

function getSplitBindingDeclarations(rawAttr, bindingLoggingContext) {
  try {
    return splitTopLevel(rawAttr, ';');
  } catch (error) {
    if (error.message === 'HET Error: Empty binding declaration') {
      throwInvalidBindingExpression(bindingLoggingContext, 'Empty binding declaration');
    }
    throw error;
  }
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
  } else {
    throwInvalidBindingExpression(
      bindingLoggingContext,
      'Unsupported binding directive',
    );
  }

  if (
    directive.sourceType === SIGNAL_SOURCE_TYPE &&
    expressionMetadata.hasContextuals
  ) {
    throw new Error(
      'HET Error: Output binding expression cannot use contextual values',
      { cause: bindingLoggingContext },
    );
  }

  return {
    dirName: directive.name,
    attrName,
    el,
    componentElement: componentLoggingContext.componentElement,
    componentName: componentLoggingContext.componentName,
    key,
    source,
    sourceType: directive.sourceType,
    write: directive.write,
    acquisitionStrategy,
    exp: declaration,
    expression: expressionMetadata,
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
    el,
    componentElement: componentLoggingContext.componentElement,
    componentName: componentLoggingContext.componentName,
    source: getValidatedSignalIdentifier(signalName, bindingLoggingContext),
    sourceType: READ_SOURCE_TYPE,
    expression: getExpressionMetadata(sourceExpression, bindingLoggingContext),
    acquisitionStrategy: directive.acquisitionStrategy,
    exp: declaration,
  };
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
};
