const NAV_DEBOUNCE_TIME = 500;
const recentClicks = new Set();
const parser = new DOMParser();
const inFlightRequests = new Map();
let historyStateReplaced = false;
let currentHistoryUrl = window.location.href;
let onError = (error) => {
  console.error(error, error.cause);
};
let replaceContent = (elToReplace, replacementEl) => {
  const importedNode = document.importNode(replacementEl, true);
  elToReplace.replaceWith(importedNode);
  return importedNode;
};
let busyClass = 'het-busy';
let nonceHeader = 'X-HET-Nonce';
let nonce;
let trustedTypesPolicy;
let headContentSelectors = [
  'title',
  'meta[name]',
  'meta[property]',
  'link[rel="canonical"]',
  'link[rel="alternate"]',
  'script[type="application/ld+json"]',
];
let requestCount = 0;

const clickPipeline = async (event) => {
  let ctx;
  const requestId = getRequestId();
  try {
    ctx = getClickContext(event);
    if (!ctx) return;
    const requestCoordination = getRequestCoordination(ctx.target.el);
    if (requestCoordination.abortThis) return;
    requestCoordination.toAbort.forEach((controller) => controller.abort());
    startUiFeedback(ctx.target.el, requestId);
    inFlightRequests.set(ctx.target.el, ctx.abortController);
    try {
      const response = await fetchAndSwap(
        ctx.request,
        ctx.target,
        ctx.select,
        ctx.also,
        ctx.loggingContext,
        ctx.initiator,
      );
      if (!response) return;
      if (response.finalTarget.isNav) {
        updateHead(response.newHead);
      }
      updateHistory(response.finalTarget, response.url, ctx.select, ctx.also);
    } catch (error) {
      if (error.name !== 'AbortError') throw error;
    }
  } catch (error) {
    onError(error);
  } finally {
    if (ctx?.target?.el) {
      inFlightRequests.delete(ctx.target.el);
      endUiFeedback(ctx.target.el, requestId);
    }
  }
};

const submitPipeline = async (event) => {
  try {
    const ctx = getSubmitContext(event);
    if (!ctx) return;
    const requestCoordination = getRequestCoordination(ctx.target.el);
    if (requestCoordination.abortThis) return;
    requestCoordination.toAbort.forEach((controller) => controller.abort());
    const requestId = getRequestId();
    startUiFeedback(ctx.target.el, requestId);
    if (!ctx.isBackgroundSubmission) {
      updateForm(ctx.form, requestId, disableElement);
    }
    inFlightRequests.set(ctx.target.el, ctx.abortController);
    try {
      const response = await fetchAndSwap(
        ctx.request,
        ctx.target,
        ctx.select,
        ctx.also,
        ctx.loggingContext,
        ctx.initiator,
      );
      if (!response) return;
      if (response.finalTarget.isNav) {
        updateHead(response.newHead);
      }
      updateHistory(response.finalTarget, response.url, ctx.select, ctx.also);
    } catch (error) {
      if (error.name !== 'AbortError') throw error;
    } finally {
      inFlightRequests.delete(ctx.target.el);
      if (!ctx.isBackgroundSubmission) {
        updateForm(ctx.form, requestId, enableElement);
      }
      endUiFeedback(ctx.target.el, requestId);
    }
  } catch (error) {
    onError(error);
  }
};

const popstatePipeline = async (event) => {
  let ctx;
  const requestId = getRequestId();
  try {
    ctx = getPopStateContext(event);
    if (!ctx) return;
    startUiFeedback(ctx.target.el, requestId);
    inFlightRequests.set(ctx.target.el, ctx.abortController);
    try {
      const response = await fetchAndSwap(
        ctx.request,
        ctx.target,
        ctx.select,
        ctx.also,
        ctx.loggingContext,
        ctx.initiator,
      );
      if (!response) return;
      if (response.finalTarget.isNav) {
        updateHead(response.newHead);
      }
    } catch (error) {
      if (error.name !== 'AbortError') throw error;
    }
  } catch (error) {
    onError(error);
  } finally {
    if (ctx?.target?.el) {
      inFlightRequests.delete(ctx.target.el);
      endUiFeedback(ctx.target.el, requestId);
    }
  }
};

const fetchAndSwap = async (
  request,
  target,
  select,
  also,
  loggingContext,
  initiator,
) => {
  if (nonce) {
    request.headers.set(nonceHeader, nonce);
  }
  request.headers.set('X-HET-Target', target.name);
  const beforeFetchEvent = new CustomEvent('het:beforeFetch', {
    detail: { request, initiator, target: target.el },
    cancelable: true,
    bubbles: true,
  });
  initiator.dispatchEvent(beforeFetchEvent);
  if (beforeFetchEvent.defaultPrevented) return;
  const finalRequest = beforeFetchEvent.detail.request;
  const requestContext = {
    ...loggingContext,
    requestUrl: finalRequest.url,
    requestMethod: finalRequest.method,
    resolvedTargetName: target.name,
    targetPaneElement: target.el,
  };
  const response = await fetch(finalRequest);
  const afterFetchEvent = new CustomEvent('het:afterFetch', {
    detail: { response, initiator, target: target.el },
    bubbles: true,
  });
  initiator.dispatchEvent(afterFetchEvent);
  const finalResponse = afterFetchEvent.detail.response;
  const targetOverride = finalResponse.headers.get('X-HET-Target-Override');
  const finalTarget = targetOverride
    ? getTarget(targetOverride, {
        ...requestContext,
        responseTargetHeader: targetOverride,
      })
    : target;
  const finalTargetChanged = finalTarget.el !== target.el;
  const swapContext = {
    ...requestContext,
    ...(targetOverride ? { responseTargetHeader: targetOverride } : {}),
    ...(finalTargetChanged
      ? {
          effectiveTargetPaneName: finalTarget.name,
          effectiveTargetPaneElement: finalTarget.el,
        }
      : {}),
  };
  const selectHeaderProvided = finalResponse.headers.has('X-HET-Select-Override');
  const selectOverride = finalResponse.headers.get('X-HET-Select-Override');
  const alsoHeaderProvided = finalResponse.headers.has('X-HET-Also-Override');
  const alsoOverride = finalResponse.headers.get('X-HET-Also-Override');
  const finalSelect =
    selectHeaderProvided && (selectOverride ?? '').trim() === ''
      ? undefined
      : selectHeaderProvided
        ? getSelectIds(selectOverride, {
            ...swapContext,
            requestDirectiveAttribute: 'X-HET-Select-Override',
          })
        : select;
  const finalAlso =
    alsoHeaderProvided && (alsoOverride ?? '').trim() === ''
      ? undefined
      : alsoHeaderProvided
        ? getAlsoIds(alsoOverride, {
            ...swapContext,
            requestDirectiveAttribute: 'X-HET-Also-Override',
          })
        : also;
  const responseHtml = await finalResponse.text();
  const htmlForParse = trustedTypesPolicy?.createHTML(responseHtml) ?? responseHtml;
  const parsedDocument = parser.parseFromString(htmlForParse, 'text/html');
  const candidates = parsedDocument.querySelectorAll(`[het-pane="${finalTarget.name}"]`);
  if (candidates.length === 0)
    throw new Error(
      'HET Error: Target pane not found in server response',
      { cause: { ...swapContext } },
    );
  if (candidates.length > 1)
    throw new Error(
      'HET Error: Multiple target panes found in server response',
      { cause: { ...swapContext, responseTargetPaneCount: candidates.length } },
    );
  const responseTarget = candidates[0];
  const contentContext = { ...swapContext };
  const beforeLoadContentEvent = new CustomEvent('het:beforeLoadContent', {
    detail: { newContent: responseTarget },
    cancelable: true,
    bubbles: true,
  });
  finalTarget.el.dispatchEvent(beforeLoadContentEvent);
  if (beforeLoadContentEvent.defaultPrevented) return;
  const newContent = beforeLoadContentEvent.detail.newContent;
  const responseDoc = parsedDocument;
  const insertedElements = [];
  let alsoElements = [];
  let loadedContent;
  const alsoContext = {
    ...contentContext,
    requestDirectiveAttribute: also ? 'het-also' : '',
    ...(alsoHeaderProvided ? { responseAlsoHeader: alsoOverride } : {}),
  };
  if (!finalSelect || finalSelect.length === 0) {
    if (finalAlso && finalAlso.length) {
      alsoElements = applyAlsoReplacements(
        finalAlso,
        finalTarget.el,
        newContent,
        responseDoc,
        alsoContext,
      );
      insertedElements.push(...alsoElements);
    }
    loadedContent = replaceContent(finalTarget.el, newContent);
    insertedElements.push(loadedContent);
    focusFirstAutofocus(insertedElements);
    const afterLoadContentEvent = new CustomEvent('het:afterLoadContent', {
      detail: { alsoElements },
      bubbles: true,
    });
    loadedContent.dispatchEvent(afterLoadContentEvent);
    return { url: finalResponse.url, newHead: parsedDocument.head, finalTarget };
  }
  const selectContext = {
    ...contentContext,
    requestDirectiveAttribute: select ? 'het-select' : '',
    ...(selectHeaderProvided ? { responseSelectHeader: selectOverride } : {}),
  };
  validateSelectedIds(
    finalSelect,
    finalTarget.el,
    newContent,
    selectContext,
  );
  for (const id of finalSelect) {
    const currentEl = getDescendantById(finalTarget.el, id);
    const replacement = getDescendantById(newContent, id);
    insertedElements.push(replaceContent(currentEl, replacement));
  }
  if (finalAlso && finalAlso.length) {
    alsoElements = applyAlsoReplacements(
      finalAlso,
      finalTarget.el,
      newContent,
      responseDoc,
      alsoContext,
    );
    insertedElements.push(...alsoElements);
  }
  focusFirstAutofocus(insertedElements);
  loadedContent = finalTarget.el;
  const afterLoadContentEvent = new CustomEvent('het:afterLoadContent', {
    detail: { alsoElements },
    bubbles: true,
  });
  loadedContent.dispatchEvent(afterLoadContentEvent);
  return { url: finalResponse.url, newHead: parsedDocument.head, finalTarget };
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
  const select = getSelectIds(link.getAttribute('het-select'), {
    ...loggingContext,
    requestDirectiveAttribute: 'het-select',
  });
  const also = getAlsoIds(link.getAttribute('het-also'), {
    ...loggingContext,
    requestDirectiveAttribute: 'het-also',
  });
  const target = getTarget(targetName, loggingContext);
  loggingContext.targetPaneElement = target.el;
  const abortController = new AbortController();
  const request = new Request(link.href, { signal: abortController.signal });
  return {
    request,
    target,
    abortController,
    select,
    also,
    initiator: link,
    loggingContext,
  };
};

const getRequestId = () => {
  requestCount += 1;
  return requestCount;
};

const getSubmitContext = (event) => {
  const formTargetName = event.target.getAttribute('het-target');
  const submitterTargetName = event.submitter?.hasAttribute('het-target')
    ? event.submitter.getAttribute('het-target')
    : undefined;
  const targetName = submitterTargetName || formTargetName;
  if (!targetName) return;
  event.preventDefault();
  const form = event.target;
  const submitter = event.submitter;
  const formMethod = (form.getAttribute('method') || 'GET').toUpperCase();
  const submitterMethod = submitter?.hasAttribute('formmethod')
    ? submitter.getAttribute('formmethod').toUpperCase()
    : undefined;
  const resolvedMethod = submitterMethod || formMethod;
  const formAction = form.getAttribute('action') || window.location.href;
  const submitterAction = submitter?.hasAttribute('formaction')
    ? submitter.getAttribute('formaction')
    : undefined;
  const resolvedAction = submitterAction || formAction;
  const formEnctype =
    form.getAttribute('enctype') || 'application/x-www-form-urlencoded';
  const submitterEnctype = submitter?.hasAttribute('formenctype')
    ? submitter.getAttribute('formenctype')
    : undefined;
  const resolvedEnctype = (submitterEnctype || formEnctype).toLowerCase();
  const loggingContext = {
    formElement: form,
    ...(submitter ? { submitterElement: submitter } : {}),
    ...(formTargetName ? { formTargetName } : {}),
    ...(submitterTargetName ? { submitterTargetName } : {}),
    resolvedTargetName: targetName,
    formAction,
    ...(submitterAction ? { submitterAction } : {}),
    formMethod,
    ...(submitterMethod ? { submitterMethod } : {}),
    formEnctype,
    ...(submitterEnctype ? { submitterEnctype } : {}),
    resolvedActionUrl: new URL(resolvedAction, window.location.href).href,
    resolvedMethod,
    resolvedEnctype,
  };
  const select = getSelectIds(
    submitter?.getAttribute('het-select') ||
      form.getAttribute('het-select'),
    {
      ...loggingContext,
      requestDirectiveAttribute: 'het-select',
    },
  );
  const also = getAlsoIds(
    submitter?.getAttribute('het-also') ||
      form.getAttribute('het-also'),
    {
      ...loggingContext,
      requestDirectiveAttribute: 'het-also',
    },
  );
  const isBackgroundSubmission =
    submitter?.hasAttribute('het-background') ||
    form.hasAttribute('het-background');
  const resolvedActionUrl = new URL(resolvedAction, window.location.href);
  if (resolvedActionUrl.origin !== window.location.origin)
    throw new Error(
      'HET Error: Cross-origin form submissions cannot be progressively enhanced',
      { cause: { ...loggingContext } },
    );
  const formData = new FormData(form, submitter);
  const abortController = new AbortController();
  const request =
    resolvedMethod === 'GET'
      ? buildGetRequest(resolvedActionUrl, formData, abortController)
      : buildPostRequest(
          resolvedActionUrl,
          resolvedMethod,
          formData,
          resolvedEnctype,
          abortController,
        );
  const target = getTarget(targetName, loggingContext);
  loggingContext.targetPaneElement = target.el;
  return {
    request,
    target,
    form,
    abortController,
    select,
    also,
    isBackgroundSubmission,
    initiator: form,
    submitter,
    loggingContext,
  };
};

const buildGetRequest = (actionUrl, formData, abortController) => {
  const url = new URL(actionUrl.href);
  const params = new URLSearchParams(formData);
  url.search = params.size ? `?${params.toString()}` : '';
  return new Request(url.href, { method: 'GET', signal: abortController.signal });
};

const buildPostRequest = (
  actionUrl,
  method,
  formData,
  enctype,
  abortController,
) => {
  if (enctype === 'multipart/form-data') {
    return new Request(actionUrl.href, {
      method,
      body: formData,
      signal: abortController.signal,
    });
  }
  if (enctype === 'text/plain') {
    const textBody = Array.from(formData.entries())
      .map(([key, value]) => `${key}=${value}`)
      .join('\r\n');
    return new Request(actionUrl.href, {
      method,
      headers: {
        'Content-Type': 'text/plain;charset=UTF-8',
      },
      body: textBody,
      signal: abortController.signal,
    });
  }
  const params = new URLSearchParams(formData);
  return new Request(actionUrl.href, {
    method,
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
    },
    body: params,
    signal: abortController.signal,
  });
};

const getSelectIds = (raw, loggingContext) => {
  if (!raw) return;
  const ids = raw.split(/\s+/).filter(Boolean);
  if (ids.length === 0)
    throw new Error(
      'HET Error: Select directive must list at least one id',
      { cause: { ...loggingContext, requestDirectiveDeclaration: raw } },
    );
  return ids;
};

const getDescendantById = (root, id) => {
  const escapedId = CSS?.escape
    ? CSS.escape(id)
    : id.replace(/"/g, '\\"').replace(/'/g, "\\'");
  const selector = `[id="${escapedId}"]`;
  return root.querySelector(selector);
};

const validateSelectedIds = (ids, currentContent, newContent, loggingContext) => {
  ids.forEach((id) => {
    const currentEl = getDescendantById(currentContent, id);
    if (!currentEl)
      throw new Error(
        'HET Error: Selected element not found in the target pane on the page',
        {
          cause: {
            ...loggingContext,
            selectId: id,
            targetPaneElement: currentContent,
          },
        },
      );
    const newEl = getDescendantById(newContent, id);
    if (!newEl)
      throw new Error(
        'HET Error: Selected element not found in the target pane in the server response',
        {
          cause: {
            ...loggingContext,
            selectId: id,
            targetPaneElement: currentContent,
            currentElement: currentEl,
          },
        },
      );
  });
};

const getAlsoIds = (raw, loggingContext) => {
  if (!raw) return;
  const ids = raw.split(/\s+/).filter(Boolean);
  if (ids.length === 0)
    throw new Error(
      'HET Error: Also directive must list at least one id',
      { cause: { ...loggingContext, requestDirectiveDeclaration: raw } },
    );
  return ids;
};

const applyAlsoReplacements = (
  ids,
  targetEl,
  responseTarget,
  responseDoc,
  loggingContext,
) => {
  const replacements = [];
  ids.forEach((id) => {
    const currentEl = getDescendantById(document, id);
    if (!currentEl)
      throw new Error(
        'HET Error: het-also element not found on the page',
        {
          cause: {
            ...loggingContext,
            alsoId: id,
            targetPaneElement: targetEl,
          },
        },
      );
    if (targetEl.contains(currentEl))
      throw new Error(
        'HET Error: het-also element found inside the target pane on the page',
        {
          cause: {
            ...loggingContext,
            alsoId: id,
            targetPaneElement: targetEl,
            currentElement: currentEl,
          },
        },
      );
    const replacement = getDescendantById(responseDoc, id);
    if (!replacement)
      throw new Error(
        'HET Error: het-also element not found in the server response',
        {
          cause: {
            ...loggingContext,
            alsoId: id,
            targetPaneElement: targetEl,
            currentElement: currentEl,
          },
        },
      );
    if (responseTarget.contains(replacement)) {
      throw new Error(
        'HET Error: het-also element found inside the target pane in the server response',
        {
          cause: {
            ...loggingContext,
            alsoId: id,
            targetPaneElement: targetEl,
            currentElement: currentEl,
          },
        },
      );
    }
    replacements.push(replaceContent(currentEl, replacement));
  });
  return replacements;
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

const startUiFeedback = (targetEl, requestId) => {
  updateInteractiveElements(targetEl, requestId, disableElement);
  targetEl.setAttribute('data-het-busy', requestId);
  targetEl.setAttribute('aria-busy', 'true');
  targetEl.classList.add(busyClass);
};

const endUiFeedback = (targetEl, requestId) => {
  if (targetEl.dataset.hetBusy !== String(requestId)) return;
  updateInteractiveElements(targetEl, requestId, enableElement);
  targetEl.removeAttribute('data-het-busy');
  targetEl.removeAttribute('aria-busy');
  targetEl.classList.remove(busyClass);
};

const focusFirstAutofocus = (elements) => {
  for (const element of elements) {
    if (!element) continue;
    const autofocusEl =
      element.matches?.('[autofocus]') ? element : element.querySelector?.('[autofocus]');
    if (!autofocusEl) continue;
    autofocusEl.focus();
    autofocusEl.removeAttribute('autofocus');
    break;
  }
};

const updateHistory = (target, responseUrl, select, also) => {
  if (!target.isNav || !responseUrl) return;
  const state = {
    paneName: target.name,
    url: responseUrl,
    select,
    also,
  };
  if (!historyStateReplaced) {
    history.replaceState(
      { ...state, url: window.location.href },
      '',
      window.location.href,
    );
    historyStateReplaced = true;
  }
  history.pushState(state, '', responseUrl);
  currentHistoryUrl = window.location.href;
};

const updateHead = (newHead) => {
  if (!newHead) return;
  headContentSelectors.forEach((selector) => {
    document.head.querySelectorAll(selector).forEach((el) => el.remove());
    newHead.querySelectorAll(selector).forEach((el) => {
      document.head.appendChild(el.cloneNode(true));
    });
  });
};

const getPopStateContext = (event) => {
  const toUrl = window.location.href;
  if (!event.state) {
    currentHistoryUrl = toUrl;
    return;
  }
  inFlightRequests.forEach((controller) => controller.abort());
  inFlightRequests.clear();
  const { paneName, url, select, also } = event.state;
  const loggingContext = {
    navigationFromUrl: currentHistoryUrl,
    navigationToUrl: toUrl,
    navigationTargetName: paneName,
    resolvedTargetName: paneName,
  };
  currentHistoryUrl = toUrl;
  const target = getTarget(paneName, loggingContext);
  loggingContext.targetPaneElement = target.el;
  const abortController = new AbortController();
  const request = new Request(url, { signal: abortController.signal });
  return {
    request,
    target,
    abortController,
    select,
    also,
    initiator: document,
    loggingContext,
  };
};

const getTarget = (targetName, loggingContext) => {
  const candidates = document.querySelectorAll(`[het-pane="${targetName}"]`);
  if (candidates.length === 0)
    throw new Error(
      'HET Error: Target pane not found on the page',
      { cause: { ...loggingContext, targetLookupName: targetName } },
    );
  if (candidates.length > 1)
    throw new Error(
      'HET Error: Multiple target panes found on the page',
      {
        cause: {
          ...loggingContext,
          targetLookupName: targetName,
          targetPaneElements: [...candidates],
        },
      },
    );
  const el = candidates[0];
  const isNav = el.hasAttribute('het-nav');
  return { el, name: targetName, isNav };
};

export function init(config) {
  onError = config?.onError ?? onError;
  replaceContent = config?.replaceContent ?? replaceContent;
  busyClass = config?.busyClass ?? busyClass;
  nonceHeader = config?.nonceHeader ?? nonceHeader;
  nonce = config?.nonce ?? nonce;
  trustedTypesPolicy = config?.trustedTypesPolicy ?? trustedTypesPolicy;
  headContentSelectors = config?.headContentSelectors ?? headContentSelectors;
  document.addEventListener('click', clickPipeline);
  document.addEventListener('submit', submitPipeline);
  window.addEventListener('popstate', popstatePipeline);
}

export function destroy() {
  inFlightRequests.forEach((controller) => controller.abort());
  inFlightRequests.clear();
  document.removeEventListener('click', clickPipeline);
  document.removeEventListener('submit', submitPipeline);
  window.removeEventListener('popstate', popstatePipeline);
}
