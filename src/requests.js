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

const submitPipeline = async (event) => {
  try {
    const ctx = getSubmitContext(event);
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
  event.preventDefault();
  const targetName = link.getAttribute('het-target');
  const loggingContext = {
    linkElement: link,
    linkUrl: link.href,
    linkTargetName: targetName,
    resolvedTargetName: targetName,
  };
  if (new URL(link.href).origin !== window.location.origin)
    throw new Error(
      'HET Error: Cross-origin links cannot be progressively enhanced',
      { cause: { ...loggingContext } },
    );
  if (link.hasAttribute('target'))
    throw new Error(
      'HET Error: Links with a target attribute cannot be progressively enhanced',
      { cause: { ...loggingContext } },
    );
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

const getSubmitContext = (event) => {
  const formTargetName = event.target.getAttribute('het-target');
  const targetName = formTargetName;
  if (!targetName) return;
  event.preventDefault();
  const form = event.target;
  const submitter = event.submitter;
  const formMethod = (form.getAttribute('method') || 'GET').toUpperCase();
  const resolvedMethod = formMethod;
  const formAction = form.getAttribute('action') || window.location.href;
  const resolvedAction = formAction;
  const loggingContext = {
    formElement: form,
    resolvedTargetName: targetName,
    formAction,
    formMethod,
    resolvedActionUrl: new URL(resolvedAction, window.location.href).href,
    resolvedMethod,
  };
  if (submitter) {
    loggingContext.submitterElement = submitter;
  }
  if (formTargetName) {
    loggingContext.formTargetName = formTargetName;
  }
  const resolvedActionUrl = new URL(resolvedAction, window.location.href);
  if (resolvedActionUrl.origin !== window.location.origin)
    throw new Error(
      'HET Error: Cross-origin form submissions cannot be progressively enhanced',
      { cause: { ...loggingContext } },
    );
  const formData = new FormData(form, submitter);
  const request =
    resolvedMethod === 'GET'
      ? buildGetRequest(resolvedActionUrl, formData)
      : buildPostRequest(
          resolvedActionUrl,
          resolvedMethod,
          formData,
        );
  const target = getTarget(targetName, loggingContext);
  loggingContext.targetPaneElement = target.el;
  return {
    request,
    target,
    form,
    initiator: form,
    submitter,
    loggingContext,
  };
};

const buildGetRequest = (actionUrl, formData) => {
  const url = new URL(actionUrl.href);
  const params = new URLSearchParams(formData);
  url.search = params.size ? `?${params.toString()}` : '';
  return new Request(url.href, { method: 'GET' });
};

const buildPostRequest = (actionUrl, method, formData) => {
  const params = new URLSearchParams(formData);
  return new Request(actionUrl.href, {
    method,
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
    },
    body: params,
  });
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
  document.addEventListener('submit', submitPipeline);
}

export function destroy() {
  document.removeEventListener('click', clickPipeline);
  document.removeEventListener('submit', submitPipeline);
}
