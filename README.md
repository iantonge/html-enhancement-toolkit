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

The `init` function accepts an optional config object which can be used to customize the behavioiur of HET. It accepts the followin options:

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

Controls which `<head>` elements HET synchronizes from responses during `het-nav-pane` navigations. Default:

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

### Navigation panes (`het-nav-pane`)

Use `het-nav-pane` when pane replacement should also update browser history.

```html
<main het-nav-pane="main">
  <a href="/next" het-target="main">Next page</a>
</main>

<main het-nav-pane="main">
  <form method="get" action="/search" het-target="main">
    <input name="q" />
    <button type="submit">Search</button>
  </form>
</main>
```

When HET performs the first navigation in a session, it replaces the initial history state. On `popstate`, HET cancels in-flight requests, re-fetches the URL from history state, and re-applies the saved pane/select/also settings.

For `het-nav-pane` navigations, HET also synchronizes key `<head>` elements from the response (including `<title>`), so browser history navigation restores both pane content and page metadata.

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
