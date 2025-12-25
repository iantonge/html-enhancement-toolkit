import { signal, effect } from "@preact/signals-core";

const SIGNAL_SOURCE_TYPE = 0;
const FUNC_SOURCE_TYPE = 1;
const TYPE_HINTS = ["int", "bool", "float"];

const DIRECTIVES = [
  {
    name: "het-on",
    keyRequired: true,
    sourceType: FUNC_SOURCE_TYPE,
    allowTypeHint: false,
    allowMultiple: true,
    allowSync: false,
  },
  {
    name: "het-attrs",
    keyRequired: true,
    sourceType: SIGNAL_SOURCE_TYPE,
    allowTypeHint: true,
    allowMultiple: true,
    allowSync: true,
    read: (el, key) => el.getAttribute(key),
    write: (el, key, value) => el.setAttribute(key, String(value)),
  },
  {
    name: "het-bool-attrs",
    keyRequired: true,
    sourceType: SIGNAL_SOURCE_TYPE,
    allowTypeHint: false,
    allowMultiple: true,
    allowSync: true,
    read: (el, key) => el.hasAttribute(key),
    write: (el, key, value) =>
      value ? el.setAttribute(key, "") : el.removeAttribute(key),
  },
  {
    name: "het-props",
    keyRequired: true,
    sourceType: SIGNAL_SOURCE_TYPE,
    allowTypeHint: true,
    allowMultiple: true,
    allowSync: true,
    read: (el, key) => el[key],
    write: (el, key, value) => (el[key] = value),
  },
  {
    name: "het-model",
    keyRequired: false,
    sourceType: SIGNAL_SOURCE_TYPE,
    allowTypeHint: true,
    allowMultiple: false,
    allowSync: false,
    read: (el, key) => el[key],
    write: (el, key, value) => (el[key] = value),
  },
  {
    name: "het-class",
    keyRequired: true,
    sourceType: SIGNAL_SOURCE_TYPE,
    allowTypeHint: false,
    allowMultiple: true,
    allowSync: true,
    read: (el, key) => el.classList.contains(key),
    write: (el, key, value) =>
      value ? el.classList.add(key) : el.classList.remove(key),
  },
];

const DIRECTIVES_SELECTOR = DIRECTIVES.map((d) => `[${d.name}]`).join(", ");

const components = new Map();
const pendingRemovals = new Set();
const pendingAdditions = new Set();

let observer;
let syncListener;
let onError = (error) => {
  throw error;
};

export function registerComponent(name, definition) {
  components.set(name, definition || {});
}

export function init(config) {
  onError = config?.onError ?? onError;
  try {
    mountComponents(document);
    initializeObserver();
    initializeSyncEvents();
  } catch (error) {
    onError(error);
  }
}

export function destroy() {
  for (const component of document.querySelectorAll("[het-component]")) {
    try {
      destroyComponent(component);
    } catch (error) {
      onError(error);
    }
  }

  if (syncListener) {
    document.removeEventListener("het:sync", syncListener);
    syncListener = undefined;
  }
}

export function destroyComponent(el) {
  el.__het_instance?.cleanup();
  delete el.__het_instance;
}

function sync(root = document) {
  const scope = root ?? document;
  const componentsToSync = [];

  if (isComponentRoot(scope)) componentsToSync.push(scope);
  if (typeof scope.querySelectorAll === "function") {
    componentsToSync.push(...scope.querySelectorAll("[het-component]"));
  }

  for (const el of componentsToSync) syncComponent(el);
}

function isComponentRoot(node) {
  return (
    node?.nodeType === Node.ELEMENT_NODE &&
    node.hasAttribute("het-component")
  );
}

function initializeObserver() {
  if (observer) return;

  observer = new MutationObserver((records) => {
    for (const rec of records) {
      try {
        if (rec.type === "childList") {
          for (const node of rec.removedNodes) {
            if (node.nodeType !== Node.ELEMENT_NODE) continue;
            if (node.hasAttribute("het-component")) pendingRemovals.add(node);
            node
              .querySelectorAll("[het-component]")
              .forEach((child) => pendingRemovals.add(child));
          }
          for (const node of rec.addedNodes) {
            if (node.nodeType !== Node.ELEMENT_NODE) continue;
            if (node.hasAttribute("het-component")) pendingAdditions.add(node);
            node
              .querySelectorAll("[het-component]")
              .forEach((child) => pendingAdditions.add(child));
          }
        } else if (
          rec.type === "attributes" &&
          rec.attributeName === "het-component"
        ) {
          const el = rec.target;
          if (el.isConnected && !el.hasAttribute("het-component"))
            pendingRemovals.add(el);
          if (el.isConnected && el.hasAttribute("het-component"))
            pendingAdditions.add(el);
        }
      } catch (error) {
        onError(error);
      }
    }

    queueMicrotask(() => {
      for (const el of pendingAdditions) {
        try {
          if (!el.isConnected) continue;
          if (!el.hasAttribute("het-component")) continue;
          const def = components.get(el.getAttribute("het-component"));
          if (def) mountComponent(el, def);
        } catch (error) {
          onError(error);
        }
      }
      pendingAdditions.clear();

      for (const el of pendingRemovals) {
        try {
          const stillComponent =
            el.isConnected && el.hasAttribute("het-component");
          if (stillComponent) continue; // moved/re-added this tick
          if (el.__het_instance) destroyComponent(el);
        } catch (error) {
          onError(error);
        }
      }
      pendingRemovals.clear();
    });
  });

  observer.observe(document, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ["het-component"],
  });
}

function initializeSyncEvents() {
  if (syncListener) return;
  syncListener = (event) => {
    try {
      const root = event?.detail?.root ?? event.target ?? document;
      sync(root);
    } catch (error) {
      onError(error);
    }
  };
  document.addEventListener("het:sync", syncListener);
}

function mountComponents(root) {
  components.forEach((definition, name) => {
    for (const el of root.querySelectorAll(`[het-component="${name}"]`)) {
      try {
        mountComponent(el, definition);
      } catch (error) {
        onError(error);
      }
    }
  });
}

function mountComponent(rootEl, def) {
  if (rootEl.__het_instance) return; // already mounted

  const refs = Object.fromEntries(
    scopedQuerySelectorAll(rootEl, "[het-ref]").map((refEl) => [
      refEl.getAttribute("het-ref"),
      refEl,
    ]),
  );
  const rawSignals = {};
  const signals = createSignalsProxy(rawSignals, rootEl);
  const cleanups = [];
  const onCleanup = (fn) => cleanups.push(fn);
  const ctx = { el: rootEl, refs, signals, onCleanup };

  const boundEls = scopedQuerySelectorAll(rootEl, DIRECTIVES_SELECTOR);
  const bindings = getBindings(boundEls);
  const syncBindings = bindings.filter((b) => b.acquisitionStrategy === "sync");
  const bindingsToInit = bindings.filter((b) => b.acquisitionStrategy);

  for (const binding of bindingsToInit) {
    if (rawSignals[binding.source]) {
      throw new Error(
        `HET Error: Attempting to seed initial value for signal ${binding.source} but it already exists`,
      );
    }
    const value = readValue(binding);
    signals[binding.source] = signal(value);
  }

  ctx.methods = (def.setup && def.setup(ctx)) || {};

  for (const binding of bindings) {
    if (binding.sourceType === SIGNAL_SOURCE_TYPE)
      configureSignalBinding(ctx, binding);
    else configureEventBinding(ctx, binding);
  }

  rootEl.__het_instance = {
    cleanup: () => cleanups.forEach((fn) => fn()),
    signals,
    syncBindings,
  };
}

function scopedQuerySelectorAll(root, selector) {
  const descendants = Array.from(root.querySelectorAll(selector)).filter(
    (el) => el.closest("[het-component]") === root,
  );

  return root.matches(selector) ? [root, ...descendants] : descendants;
}

function getBindings(boundEls) {
  const out = [];
  for (const el of boundEls) {
    for (const dir of DIRECTIVES) {
      if (el.hasAttribute(dir.name))
        out.push(...getParsedBindingDeclarations(dir, el));
    }
  }
  return out;
}

function getParsedBindingDeclarations(dir, el) {
  const out = [];

  const rawAttr = el.getAttribute(dir.name) || "";
  const declarations = dir.allowMultiple
    ? rawAttr.split(/\s+/).filter(Boolean)
    : [rawAttr];

  for (const declaration of declarations) {
    const decParts = declaration.split(":");
    if(decParts.length > 2) {
      throw new Error(
        `HET Error: Invalid declaration '${declaration}'`,
      );
    }

    const [assignment, acquisition] = decParts;

    if (acquisition && !dir.read) {
      throw new Error(
        `HET Error: Acquisition clause not supported in binding declaration '${declaration}'`,
      );
    }

    const parsedAcquisition = acquisition
      ? getParsedAcquisition(dir, declaration, acquisition, el)
      : { isValid: true };

    if (!parsedAcquisition.isValid) {
      continue;
    }

    const parsedAssignment = getParsedAssignment(dir, declaration, assignment, el);

    if (!parsedAssignment.isValid) {
      continue;
    }

    out.push({
      dirName: dir.name,
      el,
      key: parsedAssignment.key,
      source: parsedAssignment.source,
      typeHint: parsedAcquisition.typeHint,
      acquisitionStrategy: parsedAcquisition.strategy,
      read: dir.read,
      write: dir.write,
      sourceType: dir.sourceType,
      exp: declaration,
    });
  }
  return out;
}

function getParsedAcquisition(dir, declaration, clause, el) {
  const openBracketIndex = clause.indexOf("[");
  if (openBracketIndex === -1) {
    return getValidatedAcquisitionStrategy(dir, declaration, clause, el);
  } else {
    if (!dir.allowTypeHint) {
      throw new Error(
        `HET Error: Type hints unsupported for ${dir.name}: '${declaration}'`,
      );
    }
    const typeHint = clause.slice(openBracketIndex + 1, -1);
    if (!TYPE_HINTS.includes(typeHint)) {
      throw new Error(
        `HET Error: Type hint '${typeHint}' not recognised in '${declaration}'`,
      );
    }
    const strategy = clause.slice(0, openBracketIndex);
    return {
      ...getValidatedAcquisitionStrategy(dir, declaration, strategy, el),
      typeHint,
    };
  }
}

function getValidatedAcquisitionStrategy(dir, declaration, strategy, el) {
  if (strategy !== "seed" && strategy !== "sync") {
    throw new Error(
      `HET Error: Acquisition strategy '${strategy}' not recognised in '${declaration}'`,
    );
  }
  if (strategy === "sync" && dir.allowSync === false) {
    throw new Error(
      `HET error: '${dir.name}' does not support :sync in '${declaration}'`,
    );
  }
  return { isValid: true, strategy };
}

function getParsedAssignment(dir, declaration, assignment, el) {
  const parts = assignment.split("=");
  if (
    dir.keyRequired &&
    (parts.length !== 2 || parts.some((p) => p.length === 0))
  ) {
    throw new Error(`HET Error: Invalid expression '${declaration}'`);
  }

  const [key, source] = parts.length === 2 ? parts : [inferKey(el), parts[0]];

  return { isValid: true, key, source };
}

function readValue(binding) {
  const rawValue = binding.read
    ? binding.read(binding.el, binding.key)
    : undefined;

  if (binding.typeHint === "int") {
    return parseInt(rawValue, 10);
  } else if (binding.typeHint === "float") {
    return parseFloat(rawValue);
  } else if (binding.typeHint === "bool") {
    return rawValue === true || rawValue === "true" || rawValue === "";
  }
  return rawValue;
}

function configureSignalBinding(ctx, binding) {
  const sig = ctx.signals[binding.source];
  if (!sig) {
    throw new Error(
      `HET Error: Attempting to bind signal ${binding.source} but it does not exist`,
    );
  }

  if (binding.write) {
    const dispose = effect(() =>
      binding.write(binding.el, binding.key, sig.value),
    );
    ctx.onCleanup(dispose);
  }

  // Special case: het-model creates a two-way binding back into the signal
  if (binding.dirName === "het-model") {
    const updateFromEl = () => {
      const value = readValue(binding);
      if (sig.value !== value) {
        sig.value = value;
      }
    };

    const ev = inferInputEvent(binding.key);
    binding.el.addEventListener(ev, updateFromEl);
    ctx.onCleanup(() => binding.el.removeEventListener(ev, updateFromEl));
  }
}

function configureEventBinding(ctx, binding) {
  const handler = ctx.methods?.[binding.source];
  if (typeof handler !== "function") {
    throw new Error(`HET Error: Missing method "${binding.source}"`);
  }
  const listener = handler.bind(ctx.methods);
  binding.el.addEventListener(binding.key, listener);
  ctx.onCleanup(() => binding.el.removeEventListener(binding.key, listener));
}

function inferKey(el) {
  if (
    el instanceof HTMLInputElement &&
    (el.type === "checkbox" || el.type === "radio")
  ) {
    return "checked";
  }
  return "value";
}

function inferInputEvent(key) {
  if (key === "checked") return "change";
  return "input";
}

function syncComponent(rootEl) {
  try {
    if (!rootEl?.isConnected) return;
    const instance = rootEl.__het_instance;
    if (!instance || !instance.syncBindings?.length) return;

    for (const binding of instance.syncBindings) {
      const sig = instance.signals[binding.source];
      if (!sig) {
        throw new Error(
          `HET Error: Attempting to sync signal ${binding.source} but it does not exist`,
        );
      }
      const value = readValue(binding);
      if (sig.value !== value) {
        sig.value = value;
      }
    }
  } catch (error) {
    onError(error);
  }
}

function createSignalsProxy(target, rootEl) {
  return new Proxy(target, {
    set(obj, prop, value) {
      if (
        typeof prop === "string" &&
        Object.prototype.hasOwnProperty.call(obj, prop)
      ) {
        throw new Error(
          `HET error: Attempting to override signal '${prop}' after initialization`,
        );
      }
      obj[prop] = value;
      return true;
    },
    get(obj, prop) {
      return obj[prop];
    },
    has(obj, prop) {
      return prop in obj;
    },
    ownKeys(obj) {
      return Reflect.ownKeys(obj);
    },
    getOwnPropertyDescriptor(obj, prop) {
      return Object.getOwnPropertyDescriptor(obj, prop);
    },
  });
}
