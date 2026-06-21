import { signal } from '@preact/signals-core';
import {
  EMPTY_EXPORTS_SET,
  EXPORTS_ATTR,
  IMPORTS_ATTR,
  PREACT_SIGNAL_BRAND,
} from './constants.js';
import { getComponentCause, withOptionalComponentName } from './logging.js';

const exportsAttrCache = new WeakMap();

function getImportDeclarations(el, componentLoggingContext) {
  const rawAttr = el.getAttribute(IMPORTS_ATTR) || '';
  const declarations = rawAttr.split(/\s+/).filter(Boolean);

  return declarations.map((declaration) => {
    const parts = declaration.split('=');
    if (parts.length === 1 && parts[0]) {
      return { local: parts[0], source: parts[0] };
    }
    if (parts.length === 2 && parts[0] && parts[1]) {
      return { local: parts[0], source: parts[1] };
    }

    const invalidImportLoggingContext = {
      ...componentLoggingContext,
      bindingAttribute: IMPORTS_ATTR,
      bindingDeclaration: declaration,
    };
    throw new Error(
      'HET Error: Invalid import declaration',
      { cause: invalidImportLoggingContext },
    );
  });
}

function getDeclaredExports(el) {
  const rawAttr = el.getAttribute(EXPORTS_ATTR) || '';

  const cached = exportsAttrCache.get(el);
  if (cached?.rawAttr === rawAttr) return cached.exportsSet;

  const declarations = rawAttr.split(/\s+/).filter(Boolean);
  const exportsSet = declarations.length ? new Set(declarations) : EMPTY_EXPORTS_SET;

  exportsAttrCache.set(el, { rawAttr, exportsSet });
  return exportsSet;
}

function initializeForwardedSignals(
  importedSignals,
  rawSignals,
  signalMeta,
  componentLoggingContext,
) {
  if (!importedSignals) return;

  for (const [local, targetSignal] of Object.entries(importedSignals)) {
    if (targetSignal?.brand !== PREACT_SIGNAL_BRAND) {
      const invalidForwardedSignalLoggingContext = {
        ...componentLoggingContext,
        signalName: local,
      };
      throw new Error(
        'HET Error: Structural item property must be a signal',
        { cause: invalidForwardedSignalLoggingContext },
      );
    }

    rawSignals[local] = createImportedSignalWrapper(targetSignal);
    signalMeta[local] = 'forwarded';
  }
}

function syncImportedSignals(rootEl, instance) {
  if (!instance.importDeclarations?.length) return;

  resolveImports(
    rootEl,
    instance.importDeclarations,
    instance.rawSignals,
    instance.signalMeta,
    getComponentCause(rootEl),
  );
}

function resolveImports(
  rootEl,
  importDeclarations,
  rawSignals,
  signalMeta,
  componentLoggingContext,
) {
  if (!importDeclarations.length) return false;

  let updated = false;

  for (const { local, source } of importDeclarations) {
    const parentEl = findNearestExportingAncestor(rootEl, source);
    if (!parentEl) {
      const missingExportingAncestorLoggingContext = {
        ...componentLoggingContext,
        bindingAttribute: IMPORTS_ATTR,
        importLocalSignalName: local,
        importSourceSignalName: source,
      };
      throw new Error(
        'HET Error: Imported signal has no exporting ancestor',
        { cause: missingExportingAncestorLoggingContext },
      );
    }

    const parentInstance = parentEl.__het_instance;
    if (!parentInstance) {
      const unmountedExportingAncestorLoggingContext = withOptionalComponentName(
        {
          ...componentLoggingContext,
          bindingAttribute: IMPORTS_ATTR,
          exportingComponentElement: parentEl,
          importLocalSignalName: local,
          importSourceSignalName: source,
        },
        parentEl.getAttribute('het-component'),
        'exportingComponentName',
      );
      throw new Error(
        'HET Error: Exporting ancestor component is not mounted',
        { cause: unmountedExportingAncestorLoggingContext },
      );
    }

    if (!parentInstance.signals || !(source in parentInstance.signals)) {
      const missingExportedSignalLoggingContext = withOptionalComponentName(
        {
          ...componentLoggingContext,
          bindingAttribute: IMPORTS_ATTR,
          exportingComponentElement: parentEl,
          importLocalSignalName: local,
          importSourceSignalName: source,
        },
        parentEl.getAttribute('het-component'),
        'exportingComponentName',
      );
      throw new Error(
        'HET Error: Exporting ancestor does not provide imported signal',
        { cause: missingExportedSignalLoggingContext },
      );
    }
    const parentSignal = parentInstance.signals[source];

    if (signalMeta[local] !== 'imported') {
      rawSignals[local] = createImportedSignalWrapper(parentSignal);
      signalMeta[local] = 'imported';
      updated = true;
      continue;
    }

    const wrapper = rawSignals[local];
    if (wrapper.getTarget() !== parentSignal) {
      wrapper.setTarget(parentSignal);
      updated = true;
    }
  }

  return updated;
}

function createImportedSignalWrapper(initialTarget) {
  const current = signal(initialTarget);

  return {
    get value() {
      return current.value.value;
    },
    set value(nextValue) {
      current.value.value = nextValue;
    },
    getTarget() {
      return current.value;
    },
    setTarget(nextTarget) {
      current.value = nextTarget;
    },
  };
}

function findNearestExportingAncestor(rootEl, signalName) {
  let current = rootEl.parentElement;
  while (current) {
    if (current.hasAttribute('het-component')) {
      const exportsSet = getDeclaredExports(current);
      if (exportsSet.has(signalName)) return current;
    }
    current = current.parentElement;
  }
  return null;
}

export {
  getImportDeclarations,
  initializeForwardedSignals,
  resolveImports,
  syncImportedSignals,
};
