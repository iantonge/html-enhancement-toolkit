# API Reference

This section collects the JavaScript entry points and initialization options for lookup after the core HTML attributes are familiar.

## `init(config)`

Initialize HET. This mounts registered components, starts component mutation observation, installs request enhancement listeners, and connects request-driven content loads to component synchronization.

`config` is optional, and every config property is optional. Omitted properties use the defaults described below. `init` does not return a value.

### Config options

#### `onError(error)`

Handle internal errors with your own logging or reporting. Signature: `(error: Error | DOMException | unknown) => void`. Default: log and continue. Return value is ignored.

HET-created errors use the message prefix `HET Error:` and may include structured diagnostic data on `error.cause`. See the [error reference](errors.md).

```js
HET.init({
  onError: (error) => {
    console.error(error, error.cause);
    // Forward to your telemetry here
  },
});
```

#### `trustedTypesPolicy`

[Trusted Types](https://developer.mozilla.org/en-US/docs/Web/API/Trusted_Types_API) policy object used to transform response HTML before parsing. Default: unset. If provided, HET calls `trustedTypesPolicy.createHTML(responseHtml)`.

[DOMPurify](https://github.com/cure53/DOMPurify) is a suitable sanitizer for this. Configure it to keep the document structure and allow HET elements and attributes.

```js
import DOMPurify from 'dompurify';

const trustedTypesPolicy = trustedTypes.createPolicy('het', {
  createHTML: (html) =>
    DOMPurify.sanitize(html, {
      RETURN_TRUSTED_TYPE: false,
      WHOLE_DOCUMENT: true,
      ADD_TAGS: ['html', 'head', 'body', 'style'],
      ADD_ATTR: [
        'het-component',
        'het-ref',
        'het-on',
        'het-props',
        'het-attrs',
        'het-bool-attrs',
        'het-class',
        'het-model',
        'het-exports',
        'het-imports',
        'het-for',
        'het-if',
        'het-unmount-delay',
        'het-pane',
        'het-target',
        'het-select',
        'het-also',
        'het-mount-pending',
        'name',
        'content',
        'property',
        'rel',
        'href',
        'type',
        'charset',
        'http-equiv',
        'nonce',
      ],
    }),
});

HET.init({
  trustedTypesPolicy,
});
```

Note: Trusted Types is broadly available in current browsers as of February 2026, but may not be supported in older browsers. A polyfill is available from <https://github.com/w3c/trusted-types>

#### `structuralUnmountDelay`

Delay, in milliseconds, before HET destroys structural clones that were removed by `het-if` or `het-for`. Default: `0`.

When this is greater than `0`, HET keeps the structural clone mounted for the delay duration so CSS exit animations can finish. This applies only to structural clones. It does not change ordinary component teardown, `destroy()`, mutation-observer removals, or `het-component` attribute toggles.

```js
HET.init({
  structuralUnmountDelay: 180,
});
```

#### `structuralUnmountClass`

CSS class HET adds to a structural clone root while a delayed `het-if` or `het-for` removal is pending. Default: `"het-unmounting"`.

```js
HET.init({
  structuralUnmountDelay: 180,
  structuralUnmountClass: 'is-exiting',
});
```

#### `replaceContent`

Function to customize how HET swaps a matched element with its replacement.
Default: replace the matched element with an imported clone of the response element.
This is called for the target pane, `het-select` replacements, and `het-also` replacements.
Return the element that remains in the document after the replacement. HET uses this returned element for post-load lifecycle and sync behavior.

We recommend using a DOM morphing library such as [Idiomorph](https://github.com/bigskysoftware/idiomorph) for smoother updates.

```js
HET.init({
  replaceContent: (currentEl, replacementEl) => {
    Idiomorph.morph(currentEl, replacementEl);
    return currentEl;
  },
});
```

## `destroy()`

Destroy mounted components, run their cleanup callbacks, abort in-flight enhanced requests, and remove HET's document and window event listeners.

`destroy` accepts no parameters and does not return a value.

## `registerComponent(name, setup)`

Register a component setup function for elements whose `het-component` value matches `name`.

Parameters:

- `name`: the string used by `het-component`.
- `setup`: an optional function. HET calls `setup(context)` when a matching component mounts.

`setup(context)` receives:

- `el`: the component root element.
- `refs`: elements in this component scope marked with `het-ref`.
- `signals`: the component signal registry.
- `onCleanup(fn)`: register cleanup work to run when the component is destroyed.

`setup` may return an object of methods for `het-on` bindings. `registerComponent` does not return a value.

## Signal helpers

In the IIFE build, HET exposes Preact Signals helpers on `HET.signals`:

- `signal(initialValue)`
- `computed(fn)`
- `effect(fn)`
- `batch(fn)`
- `untracked(fn)`

The ESM build does not re-export these helpers; import them from `@preact/signals-core`.
