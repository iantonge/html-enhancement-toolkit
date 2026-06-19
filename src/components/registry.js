const components = new Map();

function registerComponent(name, setup) {
  components.set(name, setup);
}

function getMountableComponent(el) {
  const name = el.getAttribute('het-component');
  if (!components.has(name)) {
    return undefined;
  }
  return {
    setup: components.get(name),
  };
}

export {
  getMountableComponent,
  registerComponent,
};
