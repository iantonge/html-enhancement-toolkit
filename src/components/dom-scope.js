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

export {
  getNodeDepth,
  isComponentRoot,
  scopedQuerySelectorAll,
};
