# **HTML Enhancement Toolkit**

## **Introduction**

`het` is a lightweight, HTML-first enhancement library that brings **reactivity** and **progressive navigation** to traditional server-rendered pages without adopting a single-page application (SPA) architecture. If you are familiar with other tools/libraries/frameworks in this area, a very rough, high level, approximation of `het` might be: enhanced htmx boost + a mixture of Alpine.js & Stimulus + signals.

The core distinguishing features compared to similar tools/libraries are:

- Designed for use on sites with a strict CSP (`unsafe-eval` is not required)
- Complete solution that handles both network requests and on page interactivity (although these are separate modules that can be used independantly)

There are two key modules: `components` and `requests`. Each can be used independantly, however if you are using both it is best to use the `toolkit` which includes `components` and `requests` with some additional glue to make them play nicely with each other.

The `components` module takes a dependency on `@preact/signals-core`, and we strongly recommend using `idiomorph`, or a similar alternative, with the `requests` module.

## **Getting Started**

`het` is designed to work without a build step and with strict Content Security Policies. To get started without a js build pipeline you will need to define an import map so that modules can be resolved and then import the `init` function from the `het` module and call it.

You can download `het` from [TODO: Link to be determined]

### Import map setup

> ℹ️ **What is an import map?** An import map is a small JSON object that tells the browser where to find module specifiers like `het` or `@preact/signals-core` when using `<script type="module">`. It lets you map a bare specifier to a concrete URL (typically a self-hosted file). For `@preact/signals-core`, you can either serve `signals-core.module.js` from your own origin (recommended) or, if you prefer a CDN, use a pinned URL such as `https://cdn.jsdelivr.net/npm/@preact/signals-core@1.12.1/dist/signals-core.module.js`.

```html
<head>
  ...
  <script type="importmap" nonce="{{cspNonce}}">
    {
      "imports": {
        "@preact/signals-core": "/path/to/signals-core.module.js",
        "het": "/path/to/het-toolkit.js"
      }
    }
  </script>
</head>
```

### Initialization

```html
<body>
  ...
  <script type="module" nonce="{{cspNonce}}">
    import { init } from 'het';
    init();
  </script>
</body>
```

After initialization, all `het-*` attributes in the document become active.

Alternatively, you can of course build all of your javascript using your toolchain of choice.

#### Initialization options

`init` accepts an optional config object shared by both **components** and **requests**. Each option can be supplied independently as shown below.

#### `onError(error)`

Handle internal errors with your own logging/reporting. Signature: `(error: Error | DOMException | unknown) => void`. Default behavior is to rethrow; return value is ignored.

```js
import { init } from "het";

init({
  onError: (error) => {
    console.error("HET caught error", error);
    // Forward to your telemetry here
  },
});
```

#### `replaceContent(elToReplace, replacementEl)` (requests)

Customize how DOM replacements happen. Signature: `(elToReplace: Element, replacementEl: Element) => Element`. The function must return the element that ends up in the DOM; by default `elToReplace.replaceWith(replacementEl)` is used. Supplying a morphing library like Idiomorph usually yields smoother updates.

```js
import { init } from "het";
import { Idiomorph } from "idiomorph";

init({
  replaceContent: (elToReplace, replacementEl) => {
    Idiomorph.morph(elToReplace, replacementEl);
    return elToReplace;
  },
});
```

#### `busyClass` (requests)

CSS class applied to a target pane while its request is in flight. Defaults to `het-busy`.

```js
import { init } from "het";

init({
  busyClass: "my-busy-class",
});
```

#### `nonce` and `nonceHeader` (requests)

Send a CSP nonce with every fetch request. Provide the nonce string via `nonce`; it is not mutated after initialization. The header name defaults to `X-HET-Nonce` and can be overridden with `nonceHeader`. If the header is already set on the `Request`, `het` leaves it untouched.

```js
import { init } from "het";

init({
  nonce: window.cspNonce,
  nonceHeader: "X-CSP-Nonce", // optional override
});
```

#### `headContentSelectors` (requests)

Selectors for `<head>` elements cloned from responses when a navigation pane loads. Defaults include title/meta/link/script. Override to sync additional head content or narrow what is copied.

```js
import { init } from "het";

init({
  headContentSelectors: [
    "title",
    "meta[name]",
    "meta[property]",
    'link[rel="canonical"]',
  ],
});
```

#### `trustedTypesPolicy` (requests)

Optional `TrustedTypePolicy` used to wrap response HTML before parsing when Trusted Types CSP is enforced. Omit it when Trusted Types are not in use; behavior falls back to parsing the raw string.

Notes:
- Load the Trusted Types polyfill as a classic script (not via import map). Use `data-csp` if you want the polyfill to enforce TT in browsers without native support; your server CSP headers cover modern browsers.
- `trustedTypes` is exposed on the global object (native and polyfill), so access it via `globalThis.trustedTypes`.

```html
<!-- Load polyfill for older browsers -->
<script
  src="/js/trusted-types/trustedtypes.build.js"
  nonce="{{cspNonce}}"
  data-csp="trusted-types het; require-trusted-types-for 'script'">
</script>

<script type="module" nonce="{{cspNonce}}">
  import { init } from "het";
  import DOMPurify from "dompurify";

  const policy = globalThis.trustedTypes.createPolicy("het", {
    // Return a string; the policy wraps it in TrustedHTML
    createHTML: (html) => DOMPurify.sanitize(html, { RETURN_TRUSTED_TYPE: false }),
  });

  init({
    trustedTypesPolicy: policy,
  });
</script>
```

## **Requests and Navigation**

The **requests** module progressively enhances links and forms, updating page fragments without full reloads while keeping the server as the source of truth. This is largely inspired by htmx's boost feature, with some slight tweaks and additional features.

### How it works

Use a named pane as the container to be replaced and point links/forms at it with `het-target`. This keeps rendering server-driven while avoiding full page reloads.

Example: navigation pane with a link and a form

```html
<!-- The pane that will be morphed -->
<main id="main" het-nav-pane="main"></main>

<!-- A link or form that targets the pane -->
<a href="/page/2" het-target="main">Next Page</a>
<form action="/search" het-target="main">
  <input name="q" />
  <button type="submit">Search</button>
</form>
```

When a link or form with `het-target` is activated, `het`:

1. Prevents the default navigation and creates a `fetch` request (GET for links or `method`/`formmethod` for forms). Only same-origin links without a `target` attribute are enhanced.
2. Finds exactly one matching pane in the current document: `[het-pane="{paneName}"]` (content-only) or `[het-nav-pane="{paneName}"]` (navigation + history). The names must match and be unique.
3. Expects the server response to include the same pane. `het` parses the HTML, finds the matching pane, and optionally narrows what to replace via `het-select`/`het-also` overrides.
4. Swaps the existing DOM with the returned content (and can morph if you pair `requests` with a morphing library such as **Idiomorph**, which we recommend). Focus/autofocus and UI disabling are handled for the target while the request is in flight.
5. If the target is a `het-nav-pane`, calls `pushState` with `{paneName, url, select, also}` so back/forward re-fetches and re-morphs that pane.

### Request attributes

#### `het-pane`

Marks a content pane that can be replaced without touching history. The value is the pane name and must be unique across panes.

```html
<section id="profile" het-pane="profile"></section>
```

#### `het-nav-pane`

Marks a navigation pane that replaces content and pushes history entries. The value is the pane name and must be unique across panes.

```html
<main id="main" het-nav-pane="main"></main>
```

#### `het-target`

Placed on links/forms (or form submit buttons) to choose which pane the request will replace. The value must match an existing `het-pane` or `het-nav-pane` in the current document. Only same-origin links without a `target` attribute are enhanced.

```html
<a href="/page/2" het-target="main">Next</a>
<form action="/search" method="POST" het-target="main">
  <input name="q" />
  <button type="submit" het-target="main" het-select="results">Search</button>
</form>
```

#### `het-select`

Optional. Limits replacements to specific IDs **inside** the target pane, so other parts of the pane stay untouched. Every listed ID must exist in both the current pane and the server response; replacements are scoped to those elements.

```html
<main id="main" het-nav-pane="main">
  <div id="results">...</div>
  <div id="sidebar">...</div>
</main>

<a href="/page/2" het-target="main" het-select="results">Next page</a>
```

#### `het-also`

Optional. Performs additional replacements for IDs **outside** the target pane. Each ID must exist in both the current document and the server response, and must not live inside the target in either document.

```html
<a href="/cart/add" het-target="main" het-also="cart-count promo-banner">
  Add to cart
</a>
```

### Headers

- Request header: `X-HET-Target` is sent automatically with the pane name from `het-target`.
- Response headers (optional):
  - `X-HET-Target-Override`: change which pane is replaced; the response must include that pane and it must exist in the current document.
  - `X-HET-Select-Override`: whitespace-separated IDs to replace inside the pane. An empty value clears any `het-select` so the whole pane is replaced.
  - `X-HET-Also-Override`: whitespace-separated IDs to replace outside the pane. An empty value clears any `het-also`.

### Head updates

When a navigation pane (`het-nav-pane`) finishes loading, `het` updates the document `<head>` by removing existing tags that match `headContentSelectors` and cloning the counterparts from the response. By default this covers `title`, `meta[name]`, `meta[property]`, `link[rel="canonical"]`, `link[rel="alternate"]`, and `script[type="application/ld+json"]`. Customize the selectors via `init({ headContentSelectors: [...] })`.

### Request coordination

Requests are sequenced to avoid overlapping updates on the same area of the page.

- If a parent pane has a request in flight, any new request targeting a descendant is ignored (the parent’s result will cover it).
- If a request is issued for the same pane or an ancestor while that pane/ancestor is already in flight, the older in-flight request is aborted and the new one proceeds.
- Back/forward navigation cancels all in-flight requests (any pane) before re-fetching the pane recorded in history and applying its update.

### UI and focus handling

While a request is in flight:

- The triggering form or link is disabled
- Interactive descendants of the targeted pane are disabled (including form-associated controls)
- The target pane gets `data-het-busy`, `aria-busy`, and the configurable `busyClass` (default: `het-busy`) for styling busy state
- Standard browser focus behavior is preserved; after content is loaded, the first `[autofocus]` in the new pane (if any) is focused and its `autofocus` attribute is removed to avoid repeat focusing on later loads

### Request lifecycle and events

For clicks and submits, `het` prevents the default navigation, issues a `fetch` with `X-HET-Target`, and emits lifecycle events around the network and DOM steps:

- `het:beforeFetch` (cancellable): dispatched on the target pane before `fetch`. Handlers can modify the `request` or `preventDefault()` to skip.
- `het:afterFetch`: dispatched on the target pane after `fetch` completes; carries the `response`.
- `het:beforeLoadContent` (cancellable): dispatched on the target pane with the parsed pane from the response; `preventDefault()` stops the swap.
- Content swap/morph happens (optionally via a morphing library if you provide one).
- `het:afterLoadContent`: dispatched on the new pane after swap/morph. In toolkit usage, this is also when `het:sync` is fired for components.

Popstate replays the same flow: cancel all in-flight requests, fetch the recorded pane, then load and fire the same events.

### Server response requirements

- Include exactly one matching pane: `[het-pane="{paneName}"]` or `[het-nav-pane="{paneName}"]`, matching the requested/overridden target name.
- If `het-select`/`X-HET-Select-Override` is used, every listed ID must exist inside that pane in the response.
- If `het-also`/`X-HET-Also-Override` is used, every listed ID must exist in the response and must not be inside the pane.
- Optional head sync: tags matching `headContentSelectors` (default title/meta/link/script) are cloned into the current document head.
- Same-origin only; responses for cross-origin links are not enhanced.

## **Components**

Components provide lightweight reactive behavior using `@preact/signals-core`.

### Definition

Register a component with `registerComponent(name, definition)`. The definition object can include a `setup` function that is invoked once when a component root with `het-component="{name}"` mounts.

`setup(ctx)` receives:

- `el`: the component root element.
- `refs`: map of `het-ref` names to elements scoped under the component.
- `signals`: proxy object containing signals created from bindings marked with `:seed`/`:sync` and any signals you create in `setup` (you must not overwrite existing entries).
- `onCleanup(fn)`: register teardown callbacks run when the component unmounts or is destroyed.

Return an object of methods (typically event handlers) that can be referenced by `het-on` bindings within the component. The returned object becomes the listener context (`this`) used by `het-on`.

Handlers returned from `setup` can call each other via `this`. Use non-arrow functions so `this` points to the returned methods object:

```js
import { registerComponent } from "het";

registerComponent("example", {
  setup({ signals }) {
    return {
      save() {
        this.log();
        signals.count.value++;
      },
      log() {
        console.log("saving", signals.count.value);
      },
    };
  },
});
```

```html
<div het-component="counter">
  <button het-on="click=increment">+</button>
  <span het-props="textContent=count:seed[int]">0</span>
</div>
```

```js
import { registerComponent } from "het";

registerComponent('counter', {
  setup({ signals }) {
    return {
      increment() {
        signals.count.value++
      }
    };
  }
});
```

## **Binding Expressions**

The following binding attributes share similar syntax (with per-attribute restrictions): `het-attrs`, `het-bool-attrs`, `het-props`, `het-class`, `het-model`, and `het-on`. Each attribute defines how the binding is interpreted and which options (e.g., multiple declarations, type hints, or `:seed`/`:sync`) are allowed.

### Grammar

```
bindingList  := binding (WS binding)*
binding      := assignment (":" acquisition)?
assignment   := key "=" source | source             ; source-only when key is inferred (e.g. het-model)
key          := property, attribute, class or event
signal       := signal or function name             ; signal for data bindings, method for het-on
acquisition  := strategy typeHint?
strategy     := "seed" | "sync"
typeHint     := "[" ("int" | "float" | "bool") "]"
```

### Type hints

| Type   | Meaning               |
| ------ | --------------------- |
| `int`  | Integer               |
| `float`| Floating-point number |
| `bool` | Boolean               |

Rules:

- Type hints only appear in the acquisition clause (`:seed[int]`, `:sync[bool]`)
- If no type hint is specified, bindings use the element’s native type for properties (e.g., booleans or numbers remain typed) and strings for attributes

### Modifiers

| Modifier | Meaning                                        |
| -------- | ---------------------------------------------- |
| `seed`   | Initialize the signal from the DOM once        |
| `sync`   | Update the signal from the DOM on sync trigger |

Rules:

- A signal may have **exactly one** seed/sync source
- Seed/sync conflicts with manual initialization

## **Binding Attributes**

### `het-props`

Bind element properties to signals.

```html
<span het-props="textContent=title:seed[int]">0</span>
```

- Supports multiple bindings separated by whitespace
- Allows `:seed` and `:sync`; type hints permitted

### `het-attrs`

Bind attribute **values**. Use for attributes whose meaning comes from their value. Attributes that are "boolean" because their presence/absence matters, e.g. `hidden`, `required`, `disabled`, should use `het-bool-attrs` instead; giving such an attribute the string `true` does not make it a boolean attribute for this binding.

```html
<div het-attrs="aria-expanded=isOpen"></div>
```

- Supports multiple bindings separated by whitespace
- Allows `:seed` and `:sync`; type hints permitted

### `het-bool-attrs`

Bind boolean attribute **presence**. Use for attributes whose meaning comes from presence/absence. If an attribute merely stores a boolean-like value (e.g. `aria-expanded="true"`), bind it with `het-attrs` instead.

```html
<section het-bool-attrs="hidden=isCollapsed"></section>
```

- Signal value is truthy: attribute added
- Signal value is falsy: attribute removed
- Supports multiple bindings separated by whitespace
- Allows `:seed` and `:sync`; type hints are not supported

### `het-class`

Toggle CSS classes based on truthiness.

```html
<div het-class="active=isActive"></div>
```

- Supports multiple bindings separated by whitespace
- Allows `:seed` and `:sync`; type hints are not supported

### `het-model`

Two-way binding between a form control property and a signal.

```html
<input het-model="value=title:seed">
```

Rules:

- The property name is optional and is inferred when absent (`checked` for inputs of type `radio` or `checkbox`, otherwise `value`)
- The input event is assumed to be `change` if the bound property name is `checked`, otherwise `input`
- Updates signal on user input
- Reactively updates DOM from signal
- `:sync` is not supported; only a single binding is allowed (no whitespace-separated list)
- Type hints are permitted

### `het-on`

Bind DOM events to component methods.

```html
<button het-on="click=onSave">Save</button>
```

- Supports multiple bindings separated by whitespace
- `:seed`/`:sync` and type hints are not supported (events only)

### `het-ref`

Expose DOM references to component code.

```html
<input het-ref="emailInput">
```

## **Signal Imports and Exports**

Components can explicitly export signals to descendant components, and descendants can import them.

### `het-exports`

Declare which signal names are available to child components.

```html
<section het-component="parent" het-exports="isOpen selectedId">
  ...
</section>
```

### `het-imports`

Import signals from the nearest exporting ancestor component. Declarations are whitespace-separated.

```html
<section het-component="child" het-imports="isOpen selectedId">
  ...
</section>
```

You can also rename an import locally with `localName=exportedName`:

```html
<section het-component="child" het-imports="localOpen=isOpen">
  ...
</section>
```

### Caveats

- Imports are resolved to the *nearest* exporting ancestor and may be re-resolved if the component is moved in the DOM.
- Imported signals are represented by stable wrapper objects; do not rely on identity comparisons to detect aliasing (e.g. importing the same export under two local names does not imply `a === b`).

## **Signal Initialization Rules**

- Signals must be initialized **exactly once**
- Initialization sources:

  - `:seed` or `:sync` in markup
  - Manual initialization in component setup

## **Sync Semantics**

After initialization, `sync` bindings update only when an explicit sync is triggered.

### Sync triggers

- After a request morph completes
- Via a dispatched `het:sync` event

Sync reads from DOM and updates signals if values differ.

Manual sync is an escape hatch for cases like direct DOM edits or coordination with external widgets. In full toolkit usage (`requests` + `components`), `het:sync` is dispatched automatically after `het:afterLoadContent` fires. When using `components` alone, no automatic dispatch occurs—application code must emit `het:sync` when needed. Dispatch `het:sync` on the smallest container that owns the component(s):

```js
const container = document.querySelector("#profile-editor");
container.dispatchEvent(new CustomEvent("het:sync", { bubbles: true }));
```

### `het:afterSync`

After a `het:sync` is handled, each synced component root dispatches a `het:afterSync` `CustomEvent` on its own root element. This is useful for running logic that must happen after `:sync` bindings have been reconciled from DOM back into signals.

- Dispatched on: the component root element (`[het-component]`)
- Bubbles: no (listen on the root, or use a capturing listener on an ancestor)

```html
<section
  id="profile-editor"
  het-component="profileEditor"
  het-on="het:afterSync=afterSync"
>
  <input type="text" het-props="value=query:sync" />
</section>
```

```js
import { registerComponent } from "het";

registerComponent("profileEditor", {
  setup({ signals }) {
    return {
      afterSync() {
        // DOM -> signals sync has completed for this component
        console.log("query is now", signals.query.value);
      },
    };
  },
});
```

## **Component Lifecycle**

A component exists for exactly as long as its root element exists in the DOM.

- If the root is removed, any functions registered via `onCleanup` are run once.
- If the root remains, the component instance persists unchanged (no re-mounts).

Use `onCleanup` inside `setup` to register teardown logic for timers, event listeners, or other side-effects:

```js
import { registerComponent } from "het";

registerComponent("timer", {
  setup({ signals, onCleanup }) {
    const interval = setInterval(() => signals.tick.value++, 1000);
    onCleanup(() => clearInterval(interval));
  },
});
```

Signal reconciliation for bindings annotated with `:sync` happens only when a `het:sync` event is dispatched. `het` dispatches this automatically after request-driven content morphs when using the full toolkit. For DOM mutations outside the requests flow (or when using components alone), dispatch `het:sync` on the relevant container to reconcile from DOM back into signals.

### Binding discovery is static

Bindings are discovered once when a component mounts. If you add or change `het-*` attributes or insert new bound elements inside an already-mounted component, those bindings are ignored (even when dispatching `het:sync`, which only reads from bindings created at mount).

### Component registration and lifecycle details

- New component roots added to the DOM after `init()` are auto-mounted by the mutation observer (as long as a matching component definition is already registered). Removing a `het-component` attribute triggers teardown even if the element stays in the DOM.
- Registering a component after `init()` does not retroactively mount it on existing matching elements; only future DOM insertions are mounted.
- `destroy()` is available to clean up all mounted components and remove the global `het:sync` listener (the mutation observer remains active). `destroyComponent(el)` cleans up a single component instance without requiring DOM removal.


