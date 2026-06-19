function withOptionalComponentName(cause, componentName, property = 'componentName') {
  if (componentName) {
    cause[property] = componentName;
  }
  return cause;
}

function getComponentCause(componentElement) {
  return withOptionalComponentName(
    {
      componentElement,
    },
    componentElement.getAttribute('het-component'),
  );
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
