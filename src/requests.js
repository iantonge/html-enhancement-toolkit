const parser = new DOMParser();
const inFlightRequests = new Map();
let onError = (error) => {
  console.error(error, error.cause);
};
let replaceContent = (elToReplace, replacementEl) => {
  const importedNode = document.importNode(replacementEl, true);
  elToReplace.replaceWith(importedNode);
  return importedNode;
};
let trustedTypesPolicy;

const clickPipeline = async (event) => {
  let ctx;
  try {
    ctx = getClickContext(event);
    if (!ctx) return;
    const requestCoordination = getRequestCoordination(ctx.target.el);
    if (requestCoordination.abortThis) return;
    requestCoordination.toAbort.forEach((controller) => controller.abort());
    inFlightRequests.set(ctx.target.el, ctx.abortController);
    try {
      await fetchAndSwap(
        ctx.request,
        ctx.target,
        ctx.select,
        ctx.also,
        ctx.loggingContext,
        ctx.initiator,
      );
    } catch (error) {
      if (error.name !== 'AbortError') throw error;
    }
  } catch (error) {
    onError(error);
  } finally {
    if (ctx?.target?.el) {
      inFlightRequests.delete(ctx.target.el);
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
    inFlightRequests.set(ctx.target.el, ctx.abortController);
    try {
      await fetchAndSwap(
        ctx.request,
        ctx.target,
        ctx.select,
        ctx.also,
        ctx.loggingContext,
        ctx.initiator,
      );
    } catch (error) {
      if (error.name !== 'AbortError') throw error;
    } finally {
      inFlightRequests.delete(ctx.target.el);
    }
  } catch (error) {
    onError(error);
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
  request.headers.set('X-HET-Target', target.name);
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
  const htmlForParse = trustedTypesPolicy?.createHTML(responseHtml) ?? responseHtml;
  const parsedDocument = parser.parseFromString(htmlForParse, 'text/html');
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
  const responseTarget = candidates[0];
  const newContent = responseTarget;
  const responseDoc = parsedDocument;
  const insertedElements = [];
  let alsoElements = [];
  let loadedContent;
  const alsoLoggingContext = {
    ...swapLoggingContext,
    requestDirectiveAttribute: also ? 'het-also' : '',
  };
  if (!select || select.length === 0) {
    if (also && also.length) {
      alsoElements = applyAlsoReplacements(
        also,
        target.el,
        newContent,
        responseDoc,
        alsoLoggingContext,
      );
      insertedElements.push(...alsoElements);
    }
    loadedContent = replaceContent(target.el, newContent);
    insertedElements.push(loadedContent);
    const afterLoadContentEvent = new CustomEvent('het:afterLoadContent', {
      detail: { alsoElements },
      bubbles: true,
    });
    loadedContent.dispatchEvent(afterLoadContentEvent);
    return;
  }
  const selectLoggingContext = {
    ...swapLoggingContext,
    requestDirectiveAttribute: select ? 'het-select' : '',
  };
  validateSelectedIds(
    select,
    target.el,
    newContent,
    selectLoggingContext,
  );
  for (const id of select) {
    const currentEl = getDescendantById(target.el, id);
    const replacement = getDescendantById(newContent, id);
    insertedElements.push(replaceContent(currentEl, replacement));
  }
  if (also && also.length) {
    alsoElements = applyAlsoReplacements(
      also,
      target.el,
      newContent,
      responseDoc,
      alsoLoggingContext,
    );
    insertedElements.push(...alsoElements);
  }
  loadedContent = target.el;
  const afterLoadContentEvent = new CustomEvent('het:afterLoadContent', {
    detail: { alsoElements },
    bubbles: true,
  });
  loadedContent.dispatchEvent(afterLoadContentEvent);
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
  const selectLoggingContext = {
    ...loggingContext,
    requestDirectiveAttribute: 'het-select',
  };
  const select = getSelectIds(link.getAttribute('het-select'), selectLoggingContext);
  const alsoLoggingContext = {
    ...loggingContext,
    requestDirectiveAttribute: 'het-also',
  };
  const also = getAlsoIds(link.getAttribute('het-also'), alsoLoggingContext);
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

const getEffectiveDirectiveValue = (form, submitter, attributeName) => {
  if (submitter?.hasAttribute(attributeName)) {
    const value = submitter.getAttribute(attributeName);
    return value === '' ? undefined : value;
  }
  return form.getAttribute(attributeName);
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
    resolvedTargetName: targetName,
    formAction,
    formMethod,
    formEnctype,
    resolvedActionUrl: new URL(resolvedAction, window.location.href).href,
    resolvedMethod,
    resolvedEnctype,
  };
  if (submitter) {
    loggingContext.submitterElement = submitter;
  }
  if (formTargetName) {
    loggingContext.formTargetName = formTargetName;
  }
  if (submitterTargetName) {
    loggingContext.submitterTargetName = submitterTargetName;
  }
  if (submitterAction) {
    loggingContext.submitterAction = submitterAction;
  }
  if (submitterMethod) {
    loggingContext.submitterMethod = submitterMethod;
  }
  if (submitterEnctype) {
    loggingContext.submitterEnctype = submitterEnctype;
  }
  const selectLoggingContext = {
    ...loggingContext,
    requestDirectiveAttribute: 'het-select',
  };
  const select = getSelectIds(
    getEffectiveDirectiveValue(form, submitter, 'het-select'),
    selectLoggingContext,
  );
  const alsoLoggingContext = {
    ...loggingContext,
    requestDirectiveAttribute: 'het-also',
  };
  const also = getAlsoIds(
    getEffectiveDirectiveValue(form, submitter, 'het-also'),
    alsoLoggingContext,
  );
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
  if (ids.length === 0) {
    const emptyDirectiveLoggingContext = {
      ...loggingContext,
      requestDirectiveDeclaration: raw,
    };
    throw new Error(
      'HET Error: Select directive must list at least one id',
      { cause: emptyDirectiveLoggingContext },
    );
  }
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
    if (!currentEl) {
      const missingCurrentLoggingContext = {
        ...loggingContext,
        selectId: id,
        targetPaneElement: currentContent,
      };
      throw new Error(
        'HET Error: Selected element not found in the target pane on the page',
        { cause: missingCurrentLoggingContext },
      );
    }
    const newEl = getDescendantById(newContent, id);
    if (!newEl) {
      const missingResponseLoggingContext = {
        ...loggingContext,
        selectId: id,
        targetPaneElement: currentContent,
        currentElement: currentEl,
      };
      throw new Error(
        'HET Error: Selected element not found in the target pane in the server response',
        { cause: missingResponseLoggingContext },
      );
    }
  });
};

const getAlsoIds = (raw, loggingContext) => {
  if (!raw) return;
  const ids = raw.split(/\s+/).filter(Boolean);
  if (ids.length === 0) {
    const emptyDirectiveLoggingContext = {
      ...loggingContext,
      requestDirectiveDeclaration: raw,
    };
    throw new Error(
      'HET Error: Also directive must list at least one id',
      { cause: emptyDirectiveLoggingContext },
    );
  }
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
    if (!currentEl) {
      const missingCurrentLoggingContext = {
        ...loggingContext,
        alsoId: id,
        targetPaneElement: targetEl,
      };
      throw new Error(
        'HET Error: het-also element not found on the page',
        { cause: missingCurrentLoggingContext },
      );
    }
    if (targetEl.contains(currentEl)) {
      const nestedCurrentLoggingContext = {
        ...loggingContext,
        alsoId: id,
        targetPaneElement: targetEl,
        currentElement: currentEl,
      };
      throw new Error(
        'HET Error: het-also element found inside the target pane on the page',
        { cause: nestedCurrentLoggingContext },
      );
    }
    const replacement = getDescendantById(responseDoc, id);
    if (!replacement) {
      const missingResponseLoggingContext = {
        ...loggingContext,
        alsoId: id,
        targetPaneElement: targetEl,
        currentElement: currentEl,
      };
      throw new Error(
        'HET Error: het-also element not found in the server response',
        { cause: missingResponseLoggingContext },
      );
    }
    if (responseTarget.contains(replacement)) {
      const nestedResponseLoggingContext = {
        ...loggingContext,
        alsoId: id,
        targetPaneElement: targetEl,
        currentElement: currentEl,
      };
      throw new Error(
        'HET Error: het-also element found inside the target pane in the server response',
        { cause: nestedResponseLoggingContext },
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
  replaceContent = config?.replaceContent ?? replaceContent;
  trustedTypesPolicy = config?.trustedTypesPolicy ?? trustedTypesPolicy;
  document.addEventListener('click', clickPipeline);
  document.addEventListener('submit', submitPipeline);
}

export function destroy() {
  inFlightRequests.forEach((controller) => controller.abort());
  inFlightRequests.clear();
  document.removeEventListener('click', clickPipeline);
  document.removeEventListener('submit', submitPipeline);
}
