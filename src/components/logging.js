function withOptionalComponentName(cause, componentName, property = 'componentName') {
  if (componentName) {
    cause[property] = componentName;
  }
  return cause;
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
    bindingAttribute: binding.attrName ?? binding.dirName,
    bindingDeclaration: binding.exp,
    bindingElement: binding.el,
    ...extra,
  };
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

export {
  getBindingCause,
  getComponentCause,
  throwInvalidBindingExpression,
  withOptionalComponentName,
};
