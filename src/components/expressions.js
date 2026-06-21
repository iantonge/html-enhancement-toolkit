import jsep from 'jsep';
import {
  CONTEXTUAL_IDENTIFIERS,
  FORBIDDEN_MEMBER_NAMES,
  INTRINSIC_IDENTIFIERS,
} from './constants.js';
import { getBindingCause, throwInvalidBindingExpression } from './logging.js';

const expressionCache = new Map();

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

function getExpressionMetadata(expression, bindingLoggingContext) {
  const cached = expressionCache.get(expression);
  if (cached) return cached;

  let ast;
  try {
    ast = jsep(expression);
  } catch {
    throwInvalidBindingExpression(
      bindingLoggingContext,
      'Invalid expression',
    );
  }

  const metadata = {
    ast,
    signalNames: new Set(),
    hasContextuals: false,
  };
  validateExpressionAst(ast, metadata, bindingLoggingContext);
  expressionCache.set(expression, metadata);
  return metadata;
}

function validateExpressionAst(node, metadata, bindingLoggingContext) {
  if (!node) {
    throwInvalidBindingExpression(bindingLoggingContext, 'Invalid expression');
  }

  switch (node.type) {
    case 'Identifier':
      validateIdentifierNode(node, metadata, bindingLoggingContext);
      return;
    case 'Literal':
      if (
        node.value !== null &&
        typeof node.value !== 'string' &&
        typeof node.value !== 'number' &&
        typeof node.value !== 'boolean'
      ) {
        throwInvalidBindingExpression(bindingLoggingContext, 'Invalid expression');
      }
      return;
    case 'UnaryExpression':
      if (node.operator !== '!' && node.operator !== '-') {
        throwInvalidBindingExpression(bindingLoggingContext, 'Invalid expression');
      }
      validateExpressionAst(node.argument, metadata, bindingLoggingContext);
      return;
    case 'BinaryExpression':
      if (!['+', '-', '*', '/', '%', '===', '!==', '<', '<=', '>', '>='].includes(node.operator)) {
        throwInvalidBindingExpression(bindingLoggingContext, 'Invalid expression');
      }
      validateExpressionAst(node.left, metadata, bindingLoggingContext);
      validateExpressionAst(node.right, metadata, bindingLoggingContext);
      return;
    case 'LogicalExpression':
      if (!['&&', '||'].includes(node.operator)) {
        throwInvalidBindingExpression(bindingLoggingContext, 'Invalid expression');
      }
      validateExpressionAst(node.left, metadata, bindingLoggingContext);
      validateExpressionAst(node.right, metadata, bindingLoggingContext);
      return;
    case 'ConditionalExpression':
      validateExpressionAst(node.test, metadata, bindingLoggingContext);
      validateExpressionAst(node.consequent, metadata, bindingLoggingContext);
      validateExpressionAst(node.alternate, metadata, bindingLoggingContext);
      return;
    case 'MemberExpression':
      validateMemberExpression(node, metadata, bindingLoggingContext);
      return;
    case 'CallExpression':
      validateCallExpression(node, metadata, bindingLoggingContext);
      return;
    default:
      throwInvalidBindingExpression(bindingLoggingContext, 'Invalid expression');
  }
}

function validateIdentifierNode(node, metadata, bindingLoggingContext) {
  if (FORBIDDEN_MEMBER_NAMES.has(node.name)) {
    throwInvalidBindingExpression(bindingLoggingContext, 'Invalid expression');
  }

  if (CONTEXTUAL_IDENTIFIERS.has(node.name)) {
    metadata.hasContextuals = true;
    return;
  }

  if (INTRINSIC_IDENTIFIERS.has(node.name)) {
    return;
  }

  metadata.signalNames.add(node.name);
}

function validateMemberExpression(node, metadata, bindingLoggingContext) {
  if (node.computed) {
    if (
      node.object.type !== 'Identifier' ||
      !['$attrs', '$boolAttrs', '$classes'].includes(node.object.name) ||
      node.property.type !== 'Literal' ||
      typeof node.property.value !== 'string'
    ) {
      throwInvalidBindingExpression(bindingLoggingContext, 'Invalid expression');
    }
    metadata.hasContextuals = true;
    return;
  }

  if (node.property.type !== 'Identifier') {
    throwInvalidBindingExpression(bindingLoggingContext, 'Invalid expression');
  }

  if (FORBIDDEN_MEMBER_NAMES.has(node.property.name)) {
    throwInvalidBindingExpression(bindingLoggingContext, 'Invalid expression');
  }

  validateExpressionAst(node.object, metadata, bindingLoggingContext);
}

function validateCallExpression(node, metadata, bindingLoggingContext) {
  if (
    node.callee.type !== 'Identifier' ||
    !INTRINSIC_IDENTIFIERS.has(node.callee.name)
  ) {
    throwInvalidBindingExpression(bindingLoggingContext, 'Invalid expression');
  }

  node.arguments.forEach((argument) => {
    validateExpressionAst(argument, metadata, bindingLoggingContext);
  });
}

function assertExpressionSignalsExist(binding, signals) {
  if (!binding.expression) return;

  for (const signalName of binding.expression.signalNames) {
    if (!signals || !(signalName in signals)) {
      throw new Error(
        'HET Error: Bound signal does not exist',
        { cause: getBindingCause(binding, { signalName }) },
      );
    }
  }
}

function getBindingInputValue(ctx, binding, event) {
  if (binding.dirName === 'het-model') {
    return coerceValue(binding.el[binding.key], binding.modelType);
  }

  return evaluateBindingExpression(binding, ctx, event);
}

function evaluateBindingExpression(binding, ctx, event) {
  return evaluateExpression(binding.expression, {
    binding,
    signals: ctx.signals,
    event,
  });
}

function evaluateExpression(expressionMetadata, runtimeContext) {
  return evaluateExpressionNode(expressionMetadata.ast, runtimeContext);
}

function evaluateExpressionNode(node, runtimeContext) {
  switch (node.type) {
    case 'Identifier':
      return readIdentifierValue(node.name, runtimeContext);
    case 'Literal':
      return node.value;
    case 'UnaryExpression': {
      const value = evaluateExpressionNode(node.argument, runtimeContext);
      return node.operator === '!' ? !value : -value;
    }
    case 'BinaryExpression':
      return evaluateBinaryExpression(
        node.operator,
        evaluateExpressionNode(node.left, runtimeContext),
        evaluateExpressionNode(node.right, runtimeContext),
      );
    case 'LogicalExpression':
      return node.operator === '&&'
        ? evaluateExpressionNode(node.left, runtimeContext) && evaluateExpressionNode(node.right, runtimeContext)
        : evaluateExpressionNode(node.left, runtimeContext) || evaluateExpressionNode(node.right, runtimeContext);
    case 'ConditionalExpression':
      return evaluateExpressionNode(node.test, runtimeContext)
        ? evaluateExpressionNode(node.consequent, runtimeContext)
        : evaluateExpressionNode(node.alternate, runtimeContext);
    case 'MemberExpression':
      return readMemberValue(node, runtimeContext);
    case 'CallExpression':
      return evaluateCallExpression(node, runtimeContext);
    default:
      throwInvalidBindingExpression(getBindingCause(runtimeContext.binding), 'Invalid expression');
  }
}

function evaluateBinaryExpression(operator, left, right) {
  if (operator === '+') return left + right;
  if (operator === '-') return left - right;
  if (operator === '*') return left * right;
  if (operator === '/') return left / right;
  if (operator === '%') return left % right;
  if (operator === '===') return left === right;
  if (operator === '!==') return left !== right;
  if (operator === '<') return left < right;
  if (operator === '<=') return left <= right;
  if (operator === '>') return left > right;
  return left >= right;
}

function readIdentifierValue(name, runtimeContext) {
  if (INTRINSIC_IDENTIFIERS.has(name)) {
    return getIntrinsic(name);
  }

  if (CONTEXTUAL_IDENTIFIERS.has(name)) {
    return getContextualValue(name, runtimeContext);
  }

  if (!runtimeContext.signals || !(name in runtimeContext.signals)) {
    throw new Error(
      'HET Error: Bound signal does not exist',
      { cause: getBindingCause(runtimeContext.binding, { signalName: name }) },
    );
  }
  const signalRef = runtimeContext.signals[name];
  return signalRef.value;
}

function readMemberValue(node, runtimeContext) {
  const target = evaluateExpressionNode(node.object, runtimeContext);
  const propertyName = node.computed
    ? node.property.value
    : node.property.name;

  if (target && typeof target === 'object') {
    return target[propertyName];
  }

  return target?.[propertyName];
}

function evaluateCallExpression(node, runtimeContext) {
  const callee = evaluateExpressionNode(node.callee, runtimeContext);
  const args = node.arguments.map((argument) => evaluateExpressionNode(argument, runtimeContext));
  return callee(...args);
}

function getIntrinsic(name) {
  if (name === '$int') {
    return (value) => parseInt(value, 10);
  }
  if (name === '$float') {
    return (value) => parseFloat(value);
  }
  return (value) => value === true || value === 'true';
}

function coerceValue(rawValue, modelType) {
  if (modelType === 'int') {
    return parseInt(rawValue, 10);
  }
  if (modelType === 'float') {
    return parseFloat(rawValue);
  }
  if (modelType === 'bool') {
    return rawValue === true || rawValue === 'true';
  }
  return rawValue;
}

function getContextualValue(name, runtimeContext) {
  if (name === '$event') return runtimeContext.event;
  if (name === '$target') return runtimeContext.event?.target ?? runtimeContext.binding.el;
  if (name === '$currentTarget') return runtimeContext.event?.currentTarget ?? runtimeContext.binding.el;
  if (name === '$text') return runtimeContext.binding.el.textContent;
  if (name === '$props') return createPropsSnapshot(runtimeContext.binding.el);
  if (name === '$attrs') return createAttrsSnapshot(runtimeContext.binding.el);
  if (name === '$boolAttrs') return createBoolAttrsSnapshot(runtimeContext.binding.el);
  return createClassesSnapshot(runtimeContext.binding.el);
}

function createPropsSnapshot(el) {
  return new Proxy({}, {
    get(_target, property) {
      if (typeof property !== 'string') return undefined;
      return el[property];
    },
  });
}

function createAttrsSnapshot(el) {
  return new Proxy({}, {
    get(_target, property) {
      if (typeof property !== 'string') return undefined;
      return el.getAttribute(camelToKebab(property));
    },
  });
}

function createBoolAttrsSnapshot(el) {
  return new Proxy({}, {
    get(_target, property) {
      if (typeof property !== 'string') return undefined;
      return el.hasAttribute(camelToKebab(property));
    },
  });
}

function createClassesSnapshot(el) {
  return new Proxy({}, {
    get(_target, property) {
      if (typeof property !== 'string') return undefined;
      return el.classList.contains(property);
    },
  });
}

function camelToKebab(value) {
  return value.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
}

export {
  assertExpressionSignalsExist,
  evaluateBindingExpression,
  getBindingInputValue,
  getExpressionMetadata,
  inferInputEvent,
  inferModelKey,
};
