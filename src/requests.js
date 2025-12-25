const NAV_DEBOUNCE_TIME = 200;
const recentClicks = new Set();
const parser = new DOMParser();
let trustedTypesPolicy;
const inFlightRequests = new Map();

let historyStateReplaced = false;
let requestCount = 0;

let onError = (error) => {
  throw error;
};
let replaceContent = (elToReplace, replacementEl) => {
  const importedNode = document.importNode(replacementEl, true);
  elToReplace.replaceWith(importedNode);
  return importedNode;
};
let busyClass = "het-busy";
let nonceHeader = "X-HET-Nonce";
let nonce;
let headContentSelectors = [
  "title",
  "meta[name]",
  "meta[property]",
  'link[rel="canonical"]',
  'link[rel="alternate"]',
  'script[type="application/ld+json"]',
];

const submitPipeline = async (e) => {
  try {
    const ctx = getSubmitContext(e);
    if (!ctx) return;
    const requestCoordination = getRequestCoordination(ctx.target.el);
    if (requestCoordination.abortThis) return;
    requestCoordination.toAbort.forEach((c) => c.abort());
    const requestId = getRequestId();
    try {
      updateForm(ctx.form, requestId, disableElement);
      startUiFeedback(ctx.target.el, requestId);
      inFlightRequests.set(ctx.target.el, ctx.abortController);
      const response = await fetchContent(
        ctx.request,
        ctx.target,
        ctx.select,
        ctx.also,
      );
      const loadedContent = await loadContent(
        response.finalTarget.el,
        response.content,
        response.select,
        response.also,
      );
      if (loadedContent && response.finalTarget.type === "het-nav-pane") {
        updateHead(response.newHead);
        updateHistory(
          response.finalUrl,
          response.finalTarget,
          response.select,
          response.also,
        );
      }
    } catch (error) {
      if (error.name !== "AbortError") {
        throw error;
      }
    } finally {
      inFlightRequests.delete(ctx.target.el);
      endUiFeedback(ctx.target.el, requestId);
      updateForm(ctx.form, requestId, enableElement);
    }
  } catch (error) {
    onError(error);
  }
};

const clickPipeline = async (e) => {
  try {
    const ctx = getClickContext(e);
    if (!ctx) return;
    const requestCoordination = getRequestCoordination(ctx.target.el);
    if (requestCoordination.abortThis) return;
    requestCoordination.toAbort.forEach((c) => c.abort());
    const requestId = getRequestId();
    try {
      startUiFeedback(ctx.target.el, requestId);
      inFlightRequests.set(ctx.target.el, ctx.abortController);
      const response = await fetchContent(
        ctx.request,
        ctx.target,
        ctx.select,
        ctx.also,
      );
      const loadedContent = await loadContent(
        ctx.target.el,
        response.content,
        response.select,
        response.also,
      );
      if (loadedContent && ctx.target.type === "het-nav-pane") {
        updateHead(response.newHead);
        updateHistory(
          response.finalUrl,
          ctx.target,
          response.select,
          response.also,
        );
      }
    } catch (error) {
      if (error.name !== "AbortError") {
        throw error;
      }
    } finally {
      inFlightRequests.delete(ctx.target.el);
      endUiFeedback(ctx.target.el, requestId);
    }
  } catch (error) {
    onError(error);
  }
};

const popstatePipeline = async (e) => {
  try {
    const ctx = getPopStateContext(e);
    if (!ctx) return;
    const requestId = getRequestId();
    try {
      startUiFeedback(ctx.target.el, requestId);
      inFlightRequests.set(ctx.target.el, ctx.abortController);
      const response = await fetchContent(
        ctx.request,
        ctx.target,
        ctx.select,
        ctx.also,
      );
      const loadedContent = await loadContent(
        ctx.target.el,
        response.content,
        response.select,
        response.also,
      );
      if (loadedContent) updateHead(response.newHead);
    } catch (error) {
      if (error.name !== "AbortError") {
        throw error;
      }
    } finally {
      inFlightRequests.delete(ctx.target.el);
      endUiFeedback(ctx.target.el, requestId);
    }
  } catch (error) {
    onError(error);
  }
};

const getSubmitContext = (e) => {
  const targetName =
    e.submitter?.getAttribute("het-target") ||
    e.target.getAttribute("het-target");
  if (!targetName) return;
  e.preventDefault();
  const select = getSelectIds(
    e.submitter?.getAttribute("het-select") ||
      e.target.getAttribute("het-select"),
  );
  const also = getAlsoIds(
    e.submitter?.getAttribute("het-also") ||
      e.target.getAttribute("het-also"),
  );
  const target = getTarget(targetName);
  const method = (
    e.submitter?.getAttribute("formmethod") ||
    e.target.getAttribute("method") ||
    "GET"
  ).toUpperCase();
  const action =
    e.submitter?.getAttribute("formaction") ||
    e.target.getAttribute("action") ||
    window.location.href;
  const formData = new FormData(e.target, e.submitter);
  const abortController = new AbortController();
  const request =
    method === "GET"
      ? buildGetRequest(action, formData, abortController)
      : new Request(action, {
          method,
          body: formData,
          signal: abortController.signal,
        });
  return { request, target, form: e.target, abortController, select, also };
};

const buildGetRequest = (action, formData, abortController) => {
  const url = new URL(action, window.location.origin);
  const params = new URLSearchParams(formData);
  if (params.size) url.search = "?" + params.toString();
  return new Request(url.href, { signal: abortController.signal });
};

const getClickContext = (e) => {
  if (e.button === 1 || e.ctrlKey || e.metaKey || e.shiftKey) return; // Modifiers to open a link in a new tab
  const link = e.target.closest("a[het-target]");
  if (!link) return;
  e.preventDefault();
  const hasRecentClick = recentClicks.has(link);
  if (hasRecentClick) return;
  recentClicks.add(link);
  setTimeout(() => recentClicks.delete(link), NAV_DEBOUNCE_TIME);
  if (new URL(link.href).origin !== window.location.origin)
    throw new Error("HET error: Cannot progressively enhance external links");
  if (link.hasAttribute("target"))
    throw new Error(
      "HET error: Cannot progressively enhance links with target attribute",
    );
  const select = getSelectIds(link.getAttribute("het-select"));
  const also = getAlsoIds(link.getAttribute("het-also"));
  const target = getTarget(link.getAttribute("het-target"));
  const abortController = new AbortController();
  const request = new Request(link.href, { signal: abortController.signal });
  return { request, target, abortController, select, also };
};

const getRequestId = () => {
  requestCount++;
  return requestCount;
};

const getRequestCoordination = (el) => {
  const toAbort = [];
  for (const [otherTarget, controller] of inFlightRequests.entries()) {
    if (controller.signal.aborted) continue;
    if (el === otherTarget || el.contains(otherTarget)) {
      toAbort.push(controller);
    } else if (otherTarget.contains(el)) {
      return { abortThis: true }; // Parent request is in flight, skip this one
    }
  }
  return { toAbort };
};

const updateForm = (form, requestId, func) => {
  updateInteractiveElements(form, requestId, func);
  if (form.id)
    document
      .querySelectorAll(`[form="${form.id}"]`)
      .forEach((el) => func(el, requestId));
};

const updateInteractiveElements = (container, requestId, func) => {
  container
    .querySelectorAll("input, button, select, textarea")
    .forEach((el) => func(el, requestId));
};

const disableElement = (el, requestId) => {
  if (!el.disabled || el.hasAttribute("data-het-disabled")) {
    el.disabled = true;
    el.setAttribute("data-het-disabled", requestId);
    el.setAttribute("aria-disabled", "true");
  }
};

const enableElement = (el, requestId) => {
  if (parseInt(el.dataset.hetDisabled) === requestId) {
    el.disabled = false;
    el.removeAttribute("data-het-disabled");
    el.removeAttribute("aria-disabled");
  }
};

const startUiFeedback = (el, requestId) => {
  updateInteractiveElements(el, requestId, disableElement);
  el.setAttribute("data-het-busy", requestId);
  el.classList.add(busyClass);
  el.setAttribute("aria-busy", "true");
};

const endUiFeedback = (el, requestId) => {
  if (parseInt(el.dataset.hetBusy) === requestId) {
    el.removeAttribute("aria-busy");
    el.classList.remove(busyClass);
    el.removeAttribute("data-het-busy");
    updateInteractiveElements(el, requestId, enableElement);
  }
};

const fetchContent = async (request, target, select, also) => {
  if (nonce && !request.headers.has(nonceHeader)) {
    request.headers.set(nonceHeader, nonce);
  }
  request.headers.append("X-HET-Target", target.name);
  const beforeEvent = new CustomEvent("het:beforeFetch", {
    detail: { request },
    cancelable: true,
    bubbles: true,
  });
  target.el.dispatchEvent(beforeEvent);
  if (beforeEvent.defaultPrevented) return;
  const response = await fetch(beforeEvent.detail.request);
  const afterEvent = new CustomEvent("het:afterFetch", {
    bubbles: true,
    detail: { response },
  });
  target.el.dispatchEvent(afterEvent);
  const headers = afterEvent.detail.response.headers;
  const targetOverride = headers.get("X-HET-Target-Override");
  const selectHeaderProvided = headers.has("X-HET-Select-Override");
  const selectOverride = headers.get("X-HET-Select-Override");
  const alsoHeaderProvided = headers.has("X-HET-Also-Override");
  const alsoOverride = headers.get("X-HET-Also-Override");
  const finalSelect =
    selectHeaderProvided && (selectOverride ?? "").trim() === ""
      ? undefined
      : selectHeaderProvided
        ? getSelectIds(selectOverride)
        : select;
  const finalAlso =
    alsoHeaderProvided && (alsoOverride ?? "").trim() === ""
      ? undefined
      : alsoHeaderProvided
        ? getAlsoIds(alsoOverride)
        : also;
  const finalTarget = targetOverride ? getTarget(targetOverride) : target;
  const responseHTML = await afterEvent.detail.response.text();
  const htmlForParse =
    trustedTypesPolicy?.createHTML?.(responseHTML) ?? responseHTML;
  const parsedDocument = parser.parseFromString(htmlForParse, "text/html");
  const candidates = parsedDocument.querySelectorAll(
    `[${finalTarget.type}="${finalTarget.name}"]`,
  );
  if (candidates.length === 0)
    throw new Error(
      `HET error: No ${finalTarget.type} named ${finalTarget.name} found in server response`,
    );
  if (candidates.length > 1)
    throw new Error(
      `HET error: Multiple ${finalTarget.type}s named ${finalTarget.name} found in server response`,
    );
  return {
    content: candidates[0],
    finalUrl: afterEvent.detail.response.url,
    newHead: parsedDocument.head,
    finalTarget,
    select: finalSelect,
    also: finalAlso,
  };
};

const getTarget = (targetName) => {
  const candidates = document.querySelectorAll(
    `[het-pane="${targetName}"],[het-nav-pane="${targetName}"]`,
  );
  if (candidates.length === 0)
    throw new Error(
      `HET error: No pane named ${targetName} found in current document`,
    );
  if (candidates.length > 1)
    throw new Error(
      `HET error: Multiple panes named ${targetName} found in current document`,
    );
  const el = candidates[0];
  const type = el.hasAttribute("het-pane") ? "het-pane" : "het-nav-pane";
  return { el, name: targetName, type };
};

const getSelectIds = (raw) => {
  if (!raw) return;
  const ids = raw.split(/\s+/).filter(Boolean);
  if (ids.length === 0)
    throw new Error("HET error: het-select must list at least one id");
  return ids;
};

const getAlsoIds = (raw) => {
  if (!raw) return;
  const ids = raw.split(/\s+/).filter(Boolean);
  if (ids.length === 0)
    throw new Error("HET error: het-also must list at least one id");
  return ids;
};

const loadContent = async (el, newContent, select, also) => {
  const beforeEvent = new CustomEvent("het:beforeLoadContent", {
    detail: { newContent },
    cancelable: true,
    bubbles: true,
  });
  el.dispatchEvent(beforeEvent);
  if (beforeEvent.defaultPrevented) return;
  let loadedContent;
  if (document.startViewTransition) {
    await document.startViewTransition(
      () =>
        (loadedContent = swapContent(
          el,
          beforeEvent.detail.newContent,
          select,
          also,
        )),
    ).finished;
  } else {
    loadedContent = swapContent(
      el,
      beforeEvent.detail.newContent,
      select,
      also,
    );
  }
  const autoFocusEl = loadedContent.querySelector("[autofocus]");
  if (autoFocusEl) {
    autoFocusEl.focus();
    autoFocusEl.removeAttribute("autofocus");
  }
  const afterEvent = new CustomEvent("het:afterLoadContent", {
    bubbles: true,
  });
  loadedContent.dispatchEvent(afterEvent);
  return loadedContent;
};

const updateHistory = (url, target, select, also) => {
  const state = {
    paneName: target.name,
    url,
    select,
    also,
  };
  if (!historyStateReplaced) {
    history.replaceState(
      { ...state, url: window.location.href },
      "",
      window.location.href,
    );
    historyStateReplaced = true;
  }
  history.pushState(state, "", url);
};

const updateHead = (newHead) => {
  if (newHead) {
    headContentSelectors.forEach((selector) => {
      document.head.querySelectorAll(selector).forEach((el) => el.remove());
      newHead.querySelectorAll(selector).forEach((tag) => {
        document.head.appendChild(tag.cloneNode(true));
      });
    });
  }
};

const swapContent = (el, newContent, select, also) => {
  const responseDoc = newContent.ownerDocument;
  let targetEl = el;
  if (!select || select.length === 0) {
    targetEl = replaceContent(el, newContent);
  } else {
    validateSelectedIds(select, el, newContent);
    for (const id of select) {
      const currentEl = getDescendantById(el, id);
      const replacement = getDescendantById(newContent, id);
      replaceContent(currentEl, replacement);
    }
  }
  if (also && also.length) {
    applyAlsoReplacements(also, targetEl, newContent, responseDoc);
  }
  return targetEl;
};

const getPopStateContext = (e) => {
  if (!e.state) return;

  // Cancel all in-flight requests, regardless of target
  inFlightRequests.forEach((controller) => controller.abort());
  inFlightRequests.clear();

  const { paneName, url, select, also } = e.state;
  const target = getTarget(paneName);
  const abortController = new AbortController();
  const request = new Request(url, { signal: abortController.signal });
  return { request, target, abortController, select, also };
};

const getDescendantById = (root, id) => {
  const escapedId = CSS?.escape
    ? CSS.escape(id)
    : id.replace(/"/g, '\\"').replace(/'/g, "\\'");
  const selector = `[id="${escapedId}"]`;
  return root.querySelector(selector);
};

const applyAlsoReplacements = (ids, targetEl, newContent, responseDoc) => {
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
    if (newContent.contains(replacement))
      throw new Error(
        `HET error: het-also id ${id} must refer to an element outside the target in server response`,
      );
    const importedReplacement = document.importNode(replacement, true);
    currentEl.replaceWith(importedReplacement);
  });
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

export function init(config) {
  onError = config?.onError ?? onError;
  replaceContent = config?.replaceContent ?? replaceContent;
  busyClass = config?.busyClass ?? busyClass;
  nonceHeader = config?.nonceHeader ?? nonceHeader;
  nonce = config?.nonce ?? nonce;
  headContentSelectors = config?.headContentSelectors ?? headContentSelectors;
  trustedTypesPolicy = config?.trustedTypesPolicy ?? trustedTypesPolicy;
  document.addEventListener("click", clickPipeline);
  document.addEventListener("submit", submitPipeline);
  window.addEventListener("popstate", popstatePipeline);
}

export function destroy() {
  document.removeEventListener("click", clickPipeline);
  document.removeEventListener("submit", submitPipeline);
  window.removeEventListener("popstate", popstatePipeline);
}
