const parser = new DOMParser();
let onError = (error) => {
  console.error(error, error.cause);
};
const replaceContent = (elToReplace, replacementEl) => {
  const importedNode = document.importNode(replacementEl, true);
  elToReplace.replaceWith(importedNode);
  return importedNode;
};

const clickPipeline = async (event) => {
  let ctx;
  try {
    ctx = getClickContext(event);
    if (!ctx) return;
    await fetchAndSwap(
      ctx.request,
      ctx.target,
      ctx.loggingContext,
      ctx.initiator,
    );
  } catch (error) {
    onError(error);
  }
};

const fetchAndSwap = async (
  request,
  target,
  loggingContext,
  initiator,
) => {
  const requestLoggingContext = {
    ...loggingContext,
    requestUrl: request.url,
    requestMethod: request.method,
    resolvedTargetName: target.name,
    targetPaneElement: target.el,
  };
  const finalResponse = await fetch(request);
  const swapLoggingContext = { ...requestLoggingContext };
  const responseHtml = await finalResponse.text();
  const parsedDocument = parser.parseFromString(responseHtml, 'text/html');
  const candidates = parsedDocument.querySelectorAll(`[het-pane="${target.name}"]`);
  if (candidates.length === 0)
    throw new Error(
      'HET Error: Target pane not found in server response',
      { cause: { ...swapLoggingContext } },
    );
  if (candidates.length > 1) {
    const multipleTargetLoggingContext = {
      ...swapLoggingContext,
      responseTargetPaneCount: candidates.length,
    };
    throw new Error(
      'HET Error: Multiple target panes found in server response',
      { cause: multipleTargetLoggingContext },
    );
  }
  const newContent = candidates[0];
  replaceContent(target.el, newContent);
  return;
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
  if (link.hasAttribute('target')) return;
  if (new URL(link.href).origin !== window.location.origin) return;
  event.preventDefault();
  const targetName = link.getAttribute('het-target');
  const loggingContext = {
    linkElement: link,
    linkUrl: link.href,
    linkTargetName: targetName,
    resolvedTargetName: targetName,
  };
  const target = getTarget(targetName, loggingContext);
  loggingContext.targetPaneElement = target.el;
  const request = new Request(link.href);
  return {
    request,
    target,
    initiator: link,
    loggingContext,
  };
};

const getTarget = (targetName, loggingContext) => {
  const candidates = document.querySelectorAll(`[het-pane="${targetName}"]`);
  if (candidates.length === 0) {
    const missingTargetLoggingContext = {
      ...loggingContext,
      targetLookupName: targetName,
    };
    throw new Error(
      'HET Error: Target pane not found on the page',
      { cause: missingTargetLoggingContext },
    );
  }
  if (candidates.length > 1) {
    const multipleTargetLoggingContext = {
      ...loggingContext,
      targetLookupName: targetName,
      targetPaneElements: [...candidates],
    };
    throw new Error(
      'HET Error: Multiple target panes found on the page',
      { cause: multipleTargetLoggingContext },
    );
  }
  const el = candidates[0];
  return { el, name: targetName };
};

export function init(config) {
  onError = config?.onError ?? onError;
  document.addEventListener('click', clickPipeline);
}

export function destroy() {
  document.removeEventListener('click', clickPipeline);
}
