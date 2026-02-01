const NAV_DEBOUNCE_TIME = 500;
const recentClicks = new Set();
const parser = new DOMParser();
const inFlightRequests = new Map();
let onError = (error) => {
  throw error;
};
let requestCount = 0;

const clickPipeline = async (event) => {
  let ctx;
  try {
    ctx = getClickContext(event);
    if (!ctx) return;
    const requestCoordination = getRequestCoordination(ctx.targetEl);
    if (requestCoordination.abortThis) return;
    requestCoordination.toAbort.forEach((controller) => controller.abort());
    inFlightRequests.set(ctx.targetEl, ctx.abortController);
    try {
      await fetchAndSwap(
        ctx.request,
        ctx.targetName,
        ctx.targetEl,
        ctx.select,
        ctx.also,
      );
    } catch (error) {
      if (error.name !== 'AbortError') throw error;
    }
  } catch (error) {
    onError(error);
  } finally {
    if (ctx?.targetEl) {
      inFlightRequests.delete(ctx.targetEl);
    }
  }
};

const submitPipeline = async (event) => {
  try {
    const ctx = getSubmitContext(event);
    if (!ctx) return;
    const requestCoordination = getRequestCoordination(ctx.targetEl);
    if (requestCoordination.abortThis) return;
    requestCoordination.toAbort.forEach((controller) => controller.abort());
    const requestId = getRequestId();
    updateForm(ctx.form, requestId, disableElement);
    inFlightRequests.set(ctx.targetEl, ctx.abortController);
    try {
      await fetchAndSwap(
        ctx.request,
        ctx.targetName,
        ctx.targetEl,
        ctx.select,
        ctx.also,
      );
    } catch (error) {
      if (error.name !== 'AbortError') throw error;
    } finally {
      inFlightRequests.delete(ctx.targetEl);
      updateForm(ctx.form, requestId, enableElement);
    }
  } catch (error) {
    onError(error);
  }
};

const fetchAndSwap = async (request, targetName, targetEl, select, also) => {
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
  const responseTarget = candidates[0];
  const importedNode = document.importNode(responseTarget, true);
  const responseDoc = parsedDocument;
  if (!select || select.length === 0) {
    if (also && also.length) {
      applyAlsoReplacements(also, targetEl, responseTarget, responseDoc);
    }
    targetEl.replaceWith(importedNode);
    return;
  }
  validateSelectedIds(select, targetEl, importedNode);
  for (const id of select) {
    const currentEl = getDescendantById(targetEl, id);
    const replacement = getDescendantById(importedNode, id);
    const importedReplacement = document.importNode(replacement, true);
    currentEl.replaceWith(importedReplacement);
  }
  if (also && also.length) {
    applyAlsoReplacements(also, targetEl, responseTarget, responseDoc);
  }
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
  if (recentClicks.has(link)) return;
  recentClicks.add(link);
  setTimeout(() => recentClicks.delete(link), NAV_DEBOUNCE_TIME);
  if (new URL(link.href).origin !== window.location.origin)
    throw new Error('HET error: Cannot progressively enhance external links');
  if (link.hasAttribute('target'))
    throw new Error(
      'HET error: Cannot progressively enhance links with target attribute',
    );
  const targetName = link.getAttribute('het-target');
  const select = getSelectIds(link.getAttribute('het-select'));
  const also = getAlsoIds(link.getAttribute('het-also'));
  const targetEl = getTarget(targetName);
  const abortController = new AbortController();
  const request = new Request(link.href, { signal: abortController.signal });
  return { request, targetName, targetEl, abortController, select, also };
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
  const select = getSelectIds(
    event.submitter?.getAttribute('het-select') ||
      event.target.getAttribute('het-select'),
  );
  const also = getAlsoIds(
    event.submitter?.getAttribute('het-also') ||
      event.target.getAttribute('het-also'),
  );
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
  const abortController = new AbortController();
  const request =
    method === 'GET'
      ? buildGetRequest(action, formData, abortController)
      : buildPostRequest(action, method, formData, enctype, abortController);
  const targetEl = getTarget(targetName);
  return {
    request,
    targetName,
    targetEl,
    form: event.target,
    abortController,
    select,
    also,
  };
};

const buildGetRequest = (action, formData, abortController) => {
  const url = new URL(action, window.location.origin);
  const params = new URLSearchParams(formData);
  if (params.size) url.search = `?${params.toString()}`;
  return new Request(url.href, { method: 'GET', signal: abortController.signal });
};

const buildPostRequest = (action, method, formData, enctype, abortController) => {
  if (enctype === 'multipart/form-data') {
    return new Request(action, {
      method,
      body: formData,
      signal: abortController.signal,
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
      signal: abortController.signal,
    });
  }
  const params = new URLSearchParams(formData);
  return new Request(action, {
    method,
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
    },
    body: params,
    signal: abortController.signal,
  });
};

const getSelectIds = (raw) => {
  if (!raw) return;
  const ids = raw.split(/\s+/).filter(Boolean);
  if (ids.length === 0)
    throw new Error('HET error: het-select must list at least one id');
  return ids;
};

const getDescendantById = (root, id) => {
  const escapedId = CSS?.escape
    ? CSS.escape(id)
    : id.replace(/"/g, '\\"').replace(/'/g, "\\'");
  const selector = `[id="${escapedId}"]`;
  return root.querySelector(selector);
};

const validateSelectedIds = (ids, currentContent, newContent) => {
  ids.forEach((id) => {
    const currentEl = getDescendantById(currentContent, id);
    if (!currentEl)
      throw new Error(
        `HET error: Element with id ${id} not found in current target`,
      );
    const newEl = getDescendantById(newContent, id);
    if (!newEl)
      throw new Error(
        `HET error: Element with id ${id} not found in server response`,
      );
  });
};

const getAlsoIds = (raw) => {
  if (!raw) return;
  const ids = raw.split(/\s+/).filter(Boolean);
  if (ids.length === 0)
    throw new Error('HET error: het-also must list at least one id');
  return ids;
};

const applyAlsoReplacements = (ids, targetEl, responseTarget, responseDoc) => {
  ids.forEach((id) => {
    const currentEl = getDescendantById(document, id);
    if (!currentEl)
      throw new Error(
        `HET error: Element with id ${id} not found in current document`,
      );
    if (targetEl.contains(currentEl))
      throw new Error(
        `HET error: het-also id ${id} must refer to an element outside the target`,
      );
    const replacement = getDescendantById(responseDoc, id);
    if (!replacement)
      throw new Error(
        `HET error: Element with id ${id} not found in server response`,
      );
    if (responseTarget.contains(replacement)) {
      throw new Error(
        `HET error: het-also id ${id} must refer to an element outside the target in server response`,
      );
    }
    const importedReplacement = document.importNode(replacement, true);
    currentEl.replaceWith(importedReplacement);
  });
};

const getRequestCoordination = (targetEl) => {
  const toAbort = [];
  for (const [otherTarget, controller] of inFlightRequests.entries()) {
    if (controller.signal.aborted) continue;
    if (targetEl === otherTarget || targetEl.contains(otherTarget)) {
      toAbort.push(controller);
    } else if (otherTarget.contains(targetEl)) {
      return { abortThis: true };
    }
  }
  return { toAbort };
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
