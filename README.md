# html-enhancement-toolkit

HET (HTML Enhancement Toolkit) is a lightweight, HTML-first enhancement library for server-rendered applications that need progressive navigation and small reactive components without adopting a single-page application (SPA) architecture.

HET is a good fit when you want:

- **Progressive enhancement for server-rendered apps:** HET enhances regular links, forms, and HTML responses instead of moving rendering and routing into a client-side SPA.
- **Navigation and components together:** HET pairs pane-based request enhancement with small signal-driven components for interactive server-rendered pages.
- **Opinionated defaults over configuration sprawl:** Navigation, request coordination, UI feedback, and sync behavior are designed to reduce repeated per-link and per-form configuration.
- **Strict-CSP-conscious interactivity:** Component behavior is wired through normal JavaScript functions and signal bindings, without requiring `unsafe-eval` or similar CSP compromises.
- **Safer content-loading defaults:** HET uses browser-native HTML parsing and DOM replacement, supports Trusted Types policies and nonce headers, and avoids evaluating swapped scripts or component expressions.
- **Explicit, readable wiring:** Refs, event handlers, bindings, imports, and exports are declared with predictable `het-*` attributes and ordinary JavaScript.

HET is probably not the right fit when you need:

- **Browser-owned application state:** Most state lives in the browser and changes independently of the server.
- **Rich client-side application behavior:** You need client-side routing, offline-first workflows, or complex browser-owned UI state.
- **Large client-rendered DOM regions:** Components need to generate or rewrite large portions of DOM instead of tweaking existing HTML.
- **Maximum per-request configurability:** You need fine-grained per-link or per-form control over every request behavior.
- **Unstable server-rendered targets:** Your server cannot return HTML with stable target panes.

## Documentation

- [Reference index](docs/README.md): component, request, API, and error reference docs.
- [Component reference](docs/reference/components.md): component roots, signals, bindings, imports/exports, structural templates, and lifecycle notes.
- [Request reference](docs/reference/requests.md)
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

### First enhanced page

HET enhances normal links and forms. A link with `het-target` fetches its URL and replaces the matching `het-pane` from the response.

```html
<main het-pane="main" het-nav>
  <h1>Dashboard</h1>
  <a href="/reports" het-target="main">Reports</a>
</main>
```

When HET is running, clicking the link fetches `/reports`, finds `het-pane="main"` in the response, swaps the pane, and updates browser history because the pane also has `het-nav`.

### First component

Register a component before calling `init()`, then attach it to existing HTML with `het-component`.

```html
<div het-component="counter">
  <button type="button" het-on="click->increment">+</button>
  <output het-text="count"></output>
</div>
```

```js
HET.registerComponent('counter', ({ signals }) => {
  signals.count = HET.signals.signal(0);

  return {
    increment() {
      signals.count.value += 1;
    },
  };
});

HET.init();
```

## Core concepts

HET is built around a few small primitives:

- `het-pane` marks a server-rendered region that can be replaced from an HTML response.
- `het-target` opts a link, form, or submit button into enhanced requests and names the pane to update.
- `het-nav` marks a pane whose enhanced requests should also update browser history and configured head content.
- `het-component` mounts a small reactive component on existing HTML instead of taking over the whole page.
- Signals hold component state. They can be created in `setup`, acquired from the DOM with `het-seed` or `het-sync`, or imported from an ancestor component.
- Component bindings use a limited subset of JavaScript expressions. HET parses and interprets those expressions itself instead of executing arbitrary JavaScript.
- `het-seed` reads an initial value from the DOM once; `het-sync` also reads again when a `het:sync` event is dispatched.

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
