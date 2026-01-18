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

### Developing HET

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
