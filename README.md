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

### Pane requirements

- The current document must contain exactly one pane with the target name.
- The response HTML must also contain exactly one pane with the same name.
- If the pane is missing or duplicated in either place, HET throws an error.

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

## Form enhancement

Forms can be progressively enhanced using the same pane targeting. Put `het-target` on the form or on an individual submit button.

```html
<form method="get" action="/search" het-target="main">
  <input name="q" />
  <button type="submit">Search</button>
</form>
```

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
