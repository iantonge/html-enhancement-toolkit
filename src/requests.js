const parser = new DOMParser();
let onError = (error) => {
  throw error;
};
let requestCount = 0;

const clickPipeline = async (event) => {
  try {
    const ctx = getClickContext(event);
    if (!ctx) return;
    await fetchAndSwap(ctx.request, ctx.targetName, ctx.targetEl);
  } catch (error) {
    onError(error);
  }
};

const submitPipeline = async (event) => {
  try {
    const ctx = getSubmitContext(event);
    if (!ctx) return;
    const requestId = getRequestId();
    updateForm(ctx.form, requestId, disableElement);
    try {
      await fetchAndSwap(ctx.request, ctx.targetName, ctx.targetEl);
    } finally {
      updateForm(ctx.form, requestId, enableElement);
    }
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

const getRequestId = () => {
  requestCount += 1;
  return requestCount;
};

const getSubmitContext = (event) => {
  const targetName =
    event.submitter?.getAttribute("het-target") ||
    event.target.getAttribute("het-target");
  if (!targetName) return;
  event.preventDefault();
  const method = (
    event.submitter?.getAttribute('formmethod') ||
    event.target.getAttribute('method') ||
    'GET'
  ).toUpperCase();
  const action =
    event.submitter?.getAttribute('formaction') ||
    event.target.getAttribute('action') ||
    window.location.href;
  const enctype = (
    event.submitter?.getAttribute('formenctype') ||
    event.target.getAttribute('enctype') ||
    'application/x-www-form-urlencoded'
  ).toLowerCase();
  if (new URL(action, window.location.origin).origin !== window.location.origin)
    throw new Error(
      'HET error: Cannot progressively enhance cross-origin form submissions',
    );
  const formData = new FormData(event.target, event.submitter);
  const request =
    method === 'GET'
      ? buildGetRequest(action, formData)
      : buildPostRequest(action, method, formData, enctype);
  const targetEl = getTarget(targetName);
  return { request, targetName, targetEl, form: event.target };
};

const buildGetRequest = (action, formData) => {
  const url = new URL(action, window.location.origin);
  const params = new URLSearchParams(formData);
  if (params.size) url.search = `?${params.toString()}`;
  return new Request(url.href, { method: 'GET' });
};

const buildPostRequest = (action, method, formData, enctype) => {
  if (enctype === 'multipart/form-data') {
    return new Request(action, {
      method,
      body: formData,
    });
  }
  if (enctype === 'text/plain') {
    const textBody = Array.from(formData.entries())
      .map(([key, value]) => `${key}=${value}`)
      .join('\r\n');
    return new Request(action, {
      method,
      headers: {
        'Content-Type': 'text/plain;charset=UTF-8',
      },
      body: textBody,
    });
  }
  const params = new URLSearchParams(formData);
  return new Request(action, {
    method,
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
    },
    body: params,
  });
};

const updateForm = (form, requestId, func) => {
  updateInteractiveElements(form, requestId, func);
  if (form.id) {
    document
      .querySelectorAll(`[form="${form.id}"]`)
      .forEach((el) => func(el, requestId));
  }
};

const updateInteractiveElements = (container, requestId, func) => {
  container
    .querySelectorAll('input, button, select, textarea')
    .forEach((el) => func(el, requestId));
};

const disableElement = (el, requestId) => {
  if (el.disabled) return;
  el.disabled = true;
  el.setAttribute('data-het-disabled', requestId);
};

const enableElement = (el, requestId) => {
  if (el.dataset.hetDisabled !== String(requestId)) return;
  el.disabled = false;
  el.removeAttribute('data-het-disabled');
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
  document.addEventListener('submit', submitPipeline);
}

export function destroy() {
  document.removeEventListener('click', clickPipeline);
  document.removeEventListener('submit', submitPipeline);
}
