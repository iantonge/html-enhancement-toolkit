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

## Link enhancement

HET can progressively enhance links by replacing the contents of a target **pane** with HTML fetched from the linked page. A pane is any element marked with `het-pane="<name>"`. Links opt into enhancement by pointing at a pane with `het-target="<name>"`.

```html
<main het-pane="main">
  <a href="/next" het-target="main">Next page</a>
</main>
```

### Partial updates with het-select

If you only want to replace specific elements inside the target pane, add `het-select` with a space-separated list of ids. HET will replace those ids inside the target pane and leave the rest untouched.

```html
<main het-pane="main">
  <p id="summary">Old summary</p>
  <p id="detail">Old detail</p>
  <a href="/next" het-target="main" het-select="summary">Update summary</a>
</main>
```

`het-select` throws if any listed id is missing in the current target or in the server response.

### Additional replacements with het-also

Use `het-also` to replace elements outside the target pane as part of the same response. Provide a space-separated list of ids that exist outside the target in both the current document and the server response.

```html
<main het-pane="main">
  <p id="main-content">Main</p>
  <a href="/next" het-target="main" het-also="sidebar">Update main + sidebar</a>
</main>
<aside id="sidebar">Sidebar</aside>
```

`het-also` throws if any listed id is missing in the current document or server response, or if an id refers to an element inside the target.

### Pane requirements

- The current document must contain exactly one pane with the target name.
- The response HTML must also contain exactly one pane with the same name.
- If the pane is missing or duplicated in either place, HET throws an error.

### Navigation panes (history)

Use `het-nav-pane` when you want HET to update browser history for a pane. It behaves like `het-pane`, but the response URL is pushed to history when the pane is replaced.

```html
<main het-nav-pane="main">
  <a href="/next" het-target="main">Next page</a>
</main>
```

When HET performs the first navigation in a session it replaces the initial history state so back/forward can restore the original pane. On `popstate`, HET cancels any in-flight requests, re-fetches the URL stored in the history state, and replaces the recorded pane (including any `het-select`/`het-also` rules saved in that state).

### When HET will not intercept

- Links to another origin are not enhanced.
- Links with a `target` attribute are not enhanced.
- Modifier clicks (Ctrl, Cmd, Shift, or middle click) are not enhanced.

### Things to keep in mind

- HET replaces the pane element itself with the server response pane.
- If you click inside nested elements (spans, icons), HET still finds the
  nearest ancestor `<a>` with `het-target`.
- If a pane request is in flight, a new request to the same pane cancels the earlier one.
- If a parent pane request is in flight, requests targeting panes inside it are ignored.
- After swapping content, HET honors the first `[autofocus]` in the newly inserted content (target replacements first, then `het-also` replacements) and removes the attribute so it doesn’t trigger again.

## Form enhancement

Forms can be progressively enhanced using the same pane targeting. Put `het-target` on the form or on an individual submit button.

```html
<form method="get" action="/search" het-target="main">
  <input name="q" />
  <button type="submit">Search</button>
</form>
```

### het-select on forms

You can apply `het-select` to a form or submit button to replace only specific ids inside the target pane. The same validation rules apply as links.

### het-also on forms

You can also apply `het-also` to replace elements outside the target pane when a form submission is enhanced.

### Form rules and behavior

- HET respects default browser form behavior, including:
  - `formaction` and `formmethod` on the clicked submit button, falling back to the form attributes.
  - `formenctype` on the clicked submit button, falling back to the form `enctype`, with the same defaults as a native form submission.
  - Submitter name/value pairs are included in the request.
  - Missing `method` defaults to `GET`, missing `action` defaults to the current URL.
- `het-target` on the submit button overrides the form's `het-target`.
- While a request is in flight, HET disables the form controls (including controls associated via the `form` attribute) to prevent double submission.
- If a pane request is in flight, a new request to the same pane cancels the earlier one.
- If a parent pane request is in flight, requests targeting panes inside it are ignored.
- Only same-origin form submissions are enhanced.
- The response must include exactly one matching pane (same rules as links).

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
