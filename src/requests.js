const parser = new DOMParser();
let onError = (error) => {
  throw error;
};

const clickPipeline = async (event) => {
  try {
    const ctx = getClickContext(event);
    if (!ctx) return;
    await fetchAndSwap(ctx.request, ctx.targetName, ctx.targetEl);
  } catch (error) {
    onError(error);
  }
};

const fetchAndSwap = async (request, targetName, targetEl) => {
  const response = await fetch(request);
  const responseHtml = await response.text();
  const parsedDocument = parser.parseFromString(responseHtml, 'text/html');
  const candidates = parsedDocument.querySelectorAll(
    `[het-pane="${targetName}"]`,
  );
  if (candidates.length === 0)
    throw new Error(
      `HET error: No pane named ${targetName} found in server response`,
    );
  if (candidates.length > 1)
    throw new Error(
      `HET error: Multiple panes named ${targetName} found in server response`,
    );
  const importedNode = document.importNode(candidates[0], true);
  targetEl.replaceWith(importedNode);
};

const getClickContext = (event) => {
  if (
    event.button !== 0 ||
    event.ctrlKey ||
    event.metaKey ||
    event.shiftKey
  ) {
    return;
  }
  const link = event.target.closest('a[het-target]');
  if (!link) return;
  event.preventDefault();
  if (new URL(link.href).origin !== window.location.origin)
    throw new Error('HET error: Cannot progressively enhance external links');
  if (link.hasAttribute('target'))
    throw new Error(
      'HET error: Cannot progressively enhance links with target attribute',
    );
  const targetName = link.getAttribute('het-target');
  const targetEl = getTarget(targetName);
  const request = new Request(link.href);
  return { request, targetName, targetEl };
};

const getTarget = (targetName) => {
  const candidates = document.querySelectorAll(`[het-pane="${targetName}"]`);
  if (candidates.length === 0)
    throw new Error(`HET error: No pane named ${targetName} found in current document`);
  if (candidates.length > 1)
    throw new Error(
      `HET error: Multiple panes named ${targetName} found in current document`,
    );
  return candidates[0];
};

export function init(config) {
  onError = config?.onError ?? onError;
  document.addEventListener('click', clickPipeline);
}

export function destroy() {
  document.removeEventListener('click', clickPipeline);
}
