# html-enhancement-toolkit

HET (HTML Enhancement Toolkit) is a lightweight, HTML-first enhancement library that brings reactivity and progressive navigation to traditional server-rendered pages without adopting a single-page application (SPA) architecture.

## Getting started

### Using HET in your app

HET is designed to work in a no-build workflow, but it also supports module imports. Start by choosing which build you want to serve:

- IIFE build (no-build): use `dist/het.iife.js` or the minified `dist/het.iife.min.js` (with optional sourcemap).
- ESM build (bundlers): use `dist/het.js` and import `init` in your app.

#### IIFE build

1. Copy `dist/het.iife.js` or `dist/het.iife.min.js` (with optional source maps) and serve it.
2. Load the script and initialize HET from your own application code.

```html
<script src="/path/to/het.iife.js"></script>
```

The IIFE build then exposes `window.HET` for use by other scripts on the page. To get started just call the `init()` function.

```js
window.HET.init();
```

#### ESM build

Simply import HET in your js and call the `init()` function.

```js
import { init } from 'het';

init();
```

## Config

The `init` function accepts an optional config object which can be used to customize the behavioiur of HET. It accepts the following options:

### `onError(error)`

Handle internal errors with your own logging/reporting. Signature: `(error: Error | DOMException | unknown) => void`. Default behavior is to rethrow; return value is ignored.

```js
window.HET.init({
  onError: (error) => {
    console.error("HET caught error", error);
    // Forward to your telemetry here
  },
});
```

### `busyClass`

Override the CSS class HET applies to a busy target pane while a request is in flight. Default: `"het-busy"`.

```js
window.HET.init({
  busyClass: 'is-loading',
});
```

### `headContentSelectors`

Controls which `<head>` elements HET synchronizes from responses during `het-nav` navigations. Default:

```js
[
  'title',
  'meta[name]',
  'meta[property]',
  'link[rel="canonical"]',
  'link[rel="alternate"]',
  'script[type="application/ld+json"]',
]
```

Example limiting updates to `<title>` only:

```js
window.HET.init({
  headContentSelectors: ['title'],
});
```

### `nonce`

Adds a nonce value to enhanced fetch requests using the configured nonce header name. This is mainly useful for nonce-protected inline `<style>` blocks in swapped HTML. Inline `<script>` tags in swapped content are inert and are not executed automatically.

```js
window.HET.init({
  nonce: 'server-generated-nonce',
});
```

### `nonceHeader`

Overrides the request header name used for `nonce`. Default: `"X-HET-Nonce"`.

```js
window.HET.init({
  nonce: 'server-generated-nonce',
  nonceHeader: 'X-CSP-Nonce',
});
```

### `trustedTypesPolicy`

Optional Trusted Types policy object used to transform response HTML before parsing. If provided, HET calls `trustedTypesPolicy.createHTML(responseHtml)`.

DOMPurify is a suitable sanitizer for this. If you use head updates, configure it to keep the document structure and allow head elements/attributes.

```js
import DOMPurify from 'dompurify';

const trustedTypesPolicy = trustedTypes.createPolicy('het', {
  createHTML: (html) =>
    DOMPurify.sanitize(html, {
      RETURN_TRUSTED_TYPE: false,
      WHOLE_DOCUMENT: true,
      ADD_TAGS: ['html', 'head', 'body', 'meta', 'title', 'link', 'style', 'script'],
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
        'het-pane',
        'het-nav',
        'het-target',
        'het-select',
        'het-also',
        'name',
        'content',
        'property',
        'rel',
        'href',
        'type',
        'charset',
        'http-equiv',
        'nonce',
        'autofocus',
      ],
    }),
});

window.HET.init({
  trustedTypesPolicy,
});
```

Security guidance: keep the DOMPurify allowlist as narrow as possible. Only enable
`WHOLE_DOCUMENT` and head-related tags/attributes if you rely on head updates,
and avoid allowing `<script>` unless you also keep swapped scripts inert via CSP
(recommended). If you want stricter control, consider separate policies for head
and body swaps.

Note: Firefox does not yet support Trusted Types natively. A polyfill is available
from:

```text
https://github.com/w3c/trusted-types
```

### `replaceContent`

Optional function to customize how HET swaps a matched element with its replacement.
This is called for the target pane, `het-select` replacements, and `het-also`
replacements.

We recommend using a DOM morphing library (such as Idiomorph) for smoother updates.

```js
window.HET.init({
  replaceContent: (currentEl, replacementEl) => {
    Idiomorph.morph(currentEl, replacementEl);
    return currentEl;
  },
});
```

## Components

Register components before calling `init()`, then attach them with `het-component`.

```html
<div het-component="counter"></div>
```

```js
window.HET.registerComponent('counter', {
  setup: ({ el, refs, signals, onCleanup }) => {
    el.textContent = 'Mounted';
    // refs are collected from [het-ref] within this component scope
    console.log(refs);
    signals.count = window.HET.signal(0);
    onCleanup(() => {
      // cleanup work
    });
  },
});

window.HET.init();
```

Call `window.HET.destroy()` to run cleanup for mounted components and remove request listeners.

`refs` includes elements marked with `het-ref` on the component root and its descendants,
but excludes elements inside nested `[het-component]` subtrees.
Initialize signals explicitly (for example `signals.count = window.HET.signal(0)` in the IIFE build).

### `het-ref`

Use `het-ref` to expose DOM element references in `setup({ refs })`.

```html
<div het-component="profileForm">
  <input het-ref="emailInput" type="email">
</div>
```

```js
window.HET.registerComponent('profileForm', {
  setup: ({ refs }) => {
    refs.emailInput?.focus();
  },
});
```

### `het-on`

Use `het-on` to bind DOM events to methods returned from `setup`.

```html
<div het-component="counter">
  <button type="button" het-on="click=increment">+</button>
</div>
```

```js
window.HET.registerComponent('counter', {
  setup: () => ({
    increment: () => {
      // handle click
    },
  }),
});
```

`het-on` supports multiple declarations separated by whitespace, e.g.
`het-on="click=increment focus=handleFocus"`.

Acquisition support: not supported (`:seed`/`:sync` are invalid on `het-on`).
Type hints: not supported.

### `het-props`

Use `het-props` to bind signal values to element properties.
Use this for DOM properties (for example `textContent`, `value`, `checked`).

```html
<div het-component="counter">
  <button type="button" het-on="click=increment">+</button>
  <p het-props="textContent=count"></p>
</div>
```

```js
window.HET.registerComponent('counter', {
  setup: ({ signals }) => {
    signals.count = window.HET.signal(0);
    return {
      increment: () => {
        signals.count.value += 1;
      },
    };
  },
});
```

Acquisition support: `:seed`, `:sync`.
Type hints: `[int]`, `[float]`, `[bool]`.

### `het-attrs`

Use `het-attrs` to bind signal values to element attributes.
Use for attributes whose meaning comes from their value. For boolean presence/absence attributes such as `disabled`, `required` or `hidden`, use `het-bool-attrs` instead.

```html
<div het-component="statusCard">
  <button type="button" het-on="click=toggle">Toggle status</button>
  <p het-attrs="data-status=status"></p>
</div>
```

```js
window.HET.registerComponent('statusCard', {
  setup: ({ signals }) => {
    signals.status = window.HET.signal('idle');
    return {
      toggle: () => {
        signals.status.value = signals.status.value === 'idle' ? 'busy' : 'idle';
      },
    };
  },
});
```

Acquisition support: `:seed`, `:sync`.
Type hints: `[int]`, `[float]`, `[bool]`.

### `het-bool-attrs`

Use `het-bool-attrs` to toggle boolean attributes based on signal truthiness.
Use for attributes whose meaning comes from presence/absence like `disabled`, `required` or `hidden`. If an attribute merely stores a boolean-like value (e.g. `aria-expanded="true"`), bind it with `het-attrs` instead. If the signal value is truthy, the attribute is added. If the signal value is falsy, the attribute is removed.

```html
<div het-component="lockInput">
  <button type="button" het-on="click=toggle">Toggle disabled</button>
  <input het-bool-attrs="disabled=isDisabled">
</div>
```

```js
window.HET.registerComponent('lockInput', {
  setup: ({ signals }) => {
    signals.isDisabled = window.HET.signal(false);
    return {
      toggle: () => {
        signals.isDisabled.value = !signals.isDisabled.value;
      },
    };
  },
});
```

Acquisition support: `:seed`, `:sync`.
Type hints: not supported.

### `het-class`

Use `het-class` to toggle classes from signal values.

```html
<div het-component="alertBox">
  <button type="button" het-on="click=toggle">Toggle active</button>
  <div het-class="active=isActive"></div>
</div>
```

```js
window.HET.registerComponent('alertBox', {
  setup: ({ signals }) => {
    signals.isActive = window.HET.signal(false);
    return {
      toggle: () => {
        signals.isActive.value = !signals.isActive.value;
      },
    };
  },
});
```

Acquisition support: `:seed`, `:sync`.
Type hints: not supported.

### `het-model`

Use `het-model` for two-way signal binding on form controls.
When no key is provided, HET infers `value` for most inputs and `checked` for checkbox/radio inputs.
It also infers the DOM event: `input` for `value` bindings and `change` for `checked` bindings.

```html
<div het-component="profileForm">
  <input het-model="name">
  <input type="checkbox" het-model="isSubscribed">
  <p het-props="textContent=name"></p>
</div>
```

```js
window.HET.registerComponent('profileForm', {
  setup: ({ signals }) => {
    signals.name = window.HET.signal('Ada');
    signals.isSubscribed = window.HET.signal(false);
    return {};
  },
});
```

Acquisition support: `:seed` only (`:sync` is invalid for `het-model`).
Type hints: `[int]`, `[float]`, `[bool]`.

### `het-exports` and `het-imports`

Use `het-exports` on a parent component to declare which signals can be imported by descendants.
Use `het-imports` on a child component to import from the nearest ancestor component that exports the signal.

```html
<div het-component="parent" het-exports="count">
  <div het-component="child" het-imports="count">
    <p het-props="textContent=count"></p>
  </div>
</div>
```

`het-imports` supports alias syntax:

```html
<div het-component="child" het-imports="childCount=count">
  <p het-props="textContent=childCount"></p>
</div>
```

If multiple ancestors export the same signal name, HET resolves to the nearest exporting ancestor.

Performance note:
On `het:sync`, imported bindings are re-resolved against the current ancestor chain so nearest-export semantics remain correct after DOM updates. In very deep trees or pages with many imports, this can add measurable sync overhead. For those cases, consider managing shared signals explicitly outside component ancestry (for example, a module-level store) and wiring them in `setup` directly instead of relying on `het-imports`.

### Acquisition Strategies (`:seed`, `:sync`)

Signal bindings can initialize from existing DOM values using acquisition clauses for some directives (see the directive support matrix below):

- `:seed` initializes the signal once from the bound element.
- `:sync` initializes once and updates the signal again when a `het:sync` event is dispatched.

Sync trigger behavior:
- In full toolkit usage (`requests` + `components`), HET dispatches `het:sync` after request content loads.
- In components-only usage, no automatic sync event is dispatched.
- You can manually dispatch `het:sync` on the smallest container that owns the component(s).

```js
const container = document.querySelector('#profile-editor');
container.dispatchEvent(new CustomEvent('het:sync', { bubbles: true }));
```

```html
<div het-component="searchBox">
  <input het-props="value=query:sync" value="initial query">
  <p het-props="textContent=query"></p>
</div>
```

Type hints can be applied to acquisition values for some directives (see the directive support matrix below):

- `[int]` uses `parseInt(value, 10)`
- `[float]` uses `parseFloat(value)`
- `[bool]` treats `true` and `"true"` as `true`

```html
<p het-props="textContent=count:seed[int]">7</p>
<p het-props="textContent=price:seed[float]">3.5</p>
<p het-props="textContent=enabled:seed[bool]">true</p>
```

Directive support matrix:

| Directive | `:seed` | `:sync` | Type hints |
| --- | --- | --- | --- |
| `het-on` | No | No | No |
| `het-props` | Yes | Yes | Yes (`[int]`, `[float]`, `[bool]`) |
| `het-attrs` | Yes | Yes | Yes (`[int]`, `[float]`, `[bool]`) |
| `het-bool-attrs` | Yes | Yes | No |
| `het-class` | Yes | Yes | No |
| `het-model` | Yes | No | Yes (`[int]`, `[float]`, `[bool]`) |

## Request enhancement

HET progressively enhances both links and forms by replacing a named target pane from server-rendered HTML responses.

### Targeting a pane with `het-target`

Use `het-target="<name>"` on links and forms (or submit buttons) to target a pane.

```html
<main het-pane="main">
  <a href="/next" het-target="main">Next page</a>
</main>

<form method="get" action="/search" het-target="main">
  <input name="q" />
  <button type="submit">Search</button>
</form>
```

Form-specific behavior:
- `het-target` on the clicked submit button overrides `het-target` on the form.
- HET respects native form defaults and submitter overrides (`formaction`, `formmethod`, `formenctype`, default `method`/`action`, and submitter name/value pairs).
- Only same-origin form submissions are enhanced.

Link-specific behavior:
- Links to another origin are not enhanced.
- Links with a `target` attribute are not enhanced.
- Modifier clicks (Ctrl, Cmd, Shift, or middle click) are not enhanced.
- Clicks on nested elements inside a link still resolve to the nearest ancestor `<a het-target="...">`.

For both links and forms, enhanced requests include an `X-HET-Target` header containing the resolved target pane name.

Servers can respond with `X-HET-Target-Override` to replace a different pane than originally targeted. The override pane must exist in the current document and response.

Servers can respond with `X-HET-Select-Override` to override the selected ids used for partial updates. Use a space-separated list of ids; an empty value clears `het-select` and performs a full pane replacement.

When using `X-HET-Target-Override`, it is usually safer to also clear selection (`X-HET-Select-Override: ""`) unless the selected ids are guaranteed to exist in the overridden target pane.

Servers can respond with `X-HET-Also-Override` to override `het-also` ids for out-of-target replacements. Use a space-separated list of ids; an empty value clears `het-also`.

### Partial updates with `het-select`

Use `het-select` to replace only specific ids inside the target pane.

```html
<main het-pane="main">
  <p id="summary">Old summary</p>
  <p id="detail">Old detail</p>
  <a href="/next" het-target="main" het-select="summary">Update summary</a>
</main>

<form method="get" action="/search" het-target="main" het-select="summary detail">
  <input name="q" />
  <button type="submit">Search</button>
</form>
```

`het-select` throws if any listed id is missing in the current target or in the server response.

Without `het-select`, HET replaces the entire target pane element with the matching pane from the response.

After swapping content, HET honors the first `[autofocus]` in newly inserted content (target replacements first, then `het-also` replacements) and removes the attribute so it does not trigger again.

### Additional replacements with `het-also`

Use `het-also` to replace elements outside the target pane in the same response.

```html
<main het-pane="main">
  <p id="main-content">Main</p>
  <a href="/next" het-target="main" het-also="sidebar">Update main + sidebar</a>
</main>
<aside id="sidebar">Sidebar</aside>

<form method="post" action="/update" het-target="main" het-also="sidebar flash">
  <button type="submit">Submit</button>
</form>
```

`het-also` throws if any listed id is missing in the current document or server response, or if an id refers to an element inside the target.

### Pane requirements

- The current document must contain exactly one pane with the target name.
- The response HTML must also contain exactly one pane with the same name.
- If the pane is missing or duplicated in either place, HET throws an error.

### Navigation panes (`het-nav`)

Use `het-nav` when pane replacement should also update browser history.

```html
<main het-pane="main" het-nav>
  <a href="/next" het-target="main">Next page</a>
</main>

<main het-pane="main" het-nav>
  <form method="get" action="/search" het-target="main">
    <input name="q" />
    <button type="submit">Search</button>
  </form>
</main>
```

When HET performs the first navigation in a session, it replaces the initial history state. On `popstate`, HET cancels in-flight requests, re-fetches the URL from history state, and re-applies the saved pane/select/also settings.

For `het-nav` navigations, HET also synchronizes key `<head>` elements from the response (including `<title>`), so browser history navigation restores both pane content and page metadata.

### UI feedback while requests are in flight

When an enhanced request starts, HET marks the target pane as busy and disables interactive controls inside that pane:

- Sets `data-het-busy="<requestId>"` on the target pane.
- Sets `aria-busy="true"` on the target pane.
- Adds a busy CSS class (default: `het-busy`, configurable via `busyClass`).
- Disables `input`, `button`, `select`, and `textarea` elements inside the target pane.

When the request finishes (or is aborted), HET removes the busy markers and only re-enables controls that HET disabled for that specific request.

Form-specific addition:
- HET also disables/enables controls associated to the form via the `form` attribute.

### Request coordination

HET coordinates in-flight requests by target pane so overlapping updates do not race and leave the UI in an inconsistent state.

- If a pane request is in flight, a new request to the same pane cancels the earlier one.
- If a parent pane request is in flight, requests targeting panes inside it are ignored.

### Lifecycle events

HET dispatches lifecycle events around fetch and content loading. These are notification
events (they are not awaited). Fetch events bubble from the request source: the initiating
element (`a[het-target]` or `form[het-target]`) for enhanced interactions, and `document`
for browser history (`popstate`) re-fetches. Content-load events bubble from the target pane.

- `het:beforeFetch` with `detail.request` (cancelable)
- `het:afterFetch` with `detail.response`
- `het:beforeLoadContent` with `detail.newContent` (cancelable)
- `het:afterLoadContent`

## Component lifecycle notes

- Component bindings are discovered when a component mounts. Adding/changing `het-*` bindings inside an already-mounted component does not register new bindings.
- New component roots inserted after `init()` auto-mount only if their component definition has already been registered.
- Registering a component after `init()` does not retroactively mount existing matching elements; it applies to future insertions.

## Developing HET

Project layout:
- `src/` source modules (built into `dist/`).
- `dist/` build output from `npm run build`.
- `test-app/` Express + Handlebars demo server used for manual exploration and tests.
- `tests/` Playwright specs that exercise the test app.
- `build.js` build script that bundles the toolkit.

Install dependencies and Playwright browsers:

```bash
npm install
npx playwright install
```

Build the toolkit bundle:

```bash
npm run build
```

Run the test app:

```bash
npm run test-app
```

Run the Playwright tests (this starts the test app automatically):

```bash
npm run test
```
