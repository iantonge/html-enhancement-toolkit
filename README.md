# html-enhancement-toolkit

HET (HTML Enhancement Toolkit) is a lightweight, HTML-first enhancement library for server-rendered applications that need small reactive components without adopting a single-page application (SPA) architecture.

HET is a good fit when you want:

- **Component islands for server-rendered apps:** HET mounts small JavaScript components on existing HTML instead of moving rendering and routing into a client-side SPA.
- **Strict-CSP-conscious setup:** Component setup is normal JavaScript and does not require `unsafe-eval` or similar CSP compromises.
- **Explicit, readable wiring:** Component roots are declared with `het-component` and initialized with ordinary JavaScript.

HET is probably not the right fit when you need:

- **Browser-owned application state:** Most state lives in the browser and changes independently of the server.
- **Rich client-side application behavior:** You need client-side routing, offline-first workflows, or complex browser-owned UI state.
- **Large client-rendered DOM regions:** Components need to generate or rewrite large portions of DOM instead of tweaking existing HTML.

## Documentation

- [Reference index](docs/README.md): component, API, and error reference docs.
- [Component reference](docs/reference/components.md): component roots, signals, and lifecycle notes.
- [API reference](docs/reference/api.md)
- [Error reference](docs/reference/errors.md)

## Quick start

### Using HET in your app

HET is designed to work in a no-build workflow, but it also ships an ESM bundle. Build this repository, then copy the generated file you want from `dist/` into your application.

- IIFE build (no-build): use `dist/het.iife.js` or `dist/het.iife.min.js`.
- ESM build (for apps with a bundler): use `dist/het.js` and import from the file path you copy into your app.

#### IIFE build

```html
<script src="/path/to/het.iife.js"></script>
<script>
  HET.init();
</script>
```

Available APIs are `HET.init`, `HET.destroy`, `HET.registerComponent`, and `HET.signals`.

#### ESM build

Your app will need to take an additional depenency on `@preact/signals-core`:

```bash
npm install @preact/signals-core
```

Then import HET from the copied file:

```js
import { init } from '/path/to/het.js';

init();
```

The ESM build exports `init`, `destroy`, and `registerComponent`.

### First component

Register a component before calling `init()`, then attach it to existing HTML with `het-component`.

```html
<div het-component="counter">
</div>
```

```js
HET.registerComponent('counter', ({ signals }) => {
  signals.count = HET.signals.signal(0);
});

HET.init();
```

## Core concepts

HET is built around a few small primitives:

- `het-component` mounts a small reactive component on existing HTML instead of taking over the whole page.
- Signals hold component state and can be created in `setup`.

## Where next

- Use the [reference index](docs/README.md) when you already know what concept you need.
- Use the [error reference](docs/reference/errors.md) for `HET Error:` diagnostics and `error.cause` fields.

## Development

Project layout:

- `src/` source modules (built into `dist/`).
- `dist/` build output from `npm run build`.

| Command | Description |
| --- | --- |
| `npm run build` | Build `dist/het.js`, `dist/het.iife.js`, and `dist/het.iife.min.js`. |
| `npm run test-app` | Build HET and start the Express test app. |
| `npm run test` | Run the Playwright test suite. The Playwright config starts the test app automatically. |
