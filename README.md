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

## Contents

- [Quick start](#quick-start)
- [Core concepts](#core-concepts)
- [Components](#components)
- [Request enhancement](#request-enhancement)
- [Component lifecycle notes](#component-lifecycle-notes)
- [API reference](#api-reference)
- [Development](#development)

## Quick start

### Using HET in your app

HET is designed to work in a no-build workflow, but it also ships an ESM bundle. The repository builds browser-ready files into `dist/`; serve or copy one of those files into your application. Until package distribution is formalized, this README assumes direct use of those built files.

- IIFE build (no-build): use `dist/het.iife.js` or the minified `dist/het.iife.min.js` (with optional sourcemap).
- ESM build: use `dist/het.js` and import from the file path you serve.

#### IIFE build

1. Copy `dist/het.iife.js` or `dist/het.iife.min.js` (with optional source maps) and serve it.
2. Load the script and initialize HET from your own application code.

```html
<script src="/path/to/het.iife.js"></script>
```

The IIFE build exposes `window.HET` for use by other scripts on the page. To get started, call `init()`.

```js
window.HET.init();
```

Available APIs are `window.HET.init`, `window.HET.destroy`, `window.HET.registerComponent`, and `window.HET.signals`.

#### ESM build

Import the ESM bundle from wherever you serve it, then call `init()`.

```js
import { init, destroy, registerComponent } from '/path/to/het.js';

init();
```

The ESM build exports `init`, `destroy`, and `registerComponent`.

### First enhanced page

HET enhances normal links and forms. A link with `het-target` fetches its URL and replaces the matching `het-pane` from the response.

Start with a normal server-rendered page. Without JavaScript, the link still performs a full navigation.

```html
<main het-pane="main" het-nav>
  <h1>Dashboard</h1>
  <a href="/reports" het-target="main">Reports</a>
</main>
```

When HET is running, clicking the link fetches `/reports` and looks for the same pane in the response:

```html
<main het-pane="main" het-nav>
  <h1>Reports</h1>
  <a href="/dashboard" het-target="main">Dashboard</a>
</main>
```

HET replaces the current `main` pane with the response pane. Because the pane has `het-nav`, HET also pushes the response URL into browser history and updates configured head content such as `<title>`.

## Core concepts

HET is built around a few small primitives:

- `het-pane` marks a server-rendered region that can be replaced from an HTML response.
- `het-target` opts a link, form, or submit button into enhanced requests and names the pane to update.
- `het-nav` marks a pane whose enhanced requests should also update browser history and configured head content.
- `het-component` mounts a small reactive component on existing HTML instead of taking over the whole page.
- Signals hold component state. They can be created in `setup`, acquired from the DOM with `:seed` or `:sync`, or imported from an ancestor component.
- `:seed` reads an initial value from the DOM once; `:sync` also reads again when a `het:sync` event is dispatched.
- In full toolkit usage, request-driven content loads dispatch `het:sync` so components can reconcile server-updated DOM back into signals.

## Components

Register components before calling `init()`, then attach them with `het-component`. A component starts from existing HTML and wires small behavior onto it:

```html
<div het-component="counter">
  <button type="button" het-on="click=increment">+</button>
  <output het-props="textContent=count"></output>
</div>
```

```js
window.HET.registerComponent('counter', {
  setup: ({ signals }) => {
    signals.count = window.HET.signals.signal(0);

    return {
      increment: () => {
        signals.count.value += 1;
      },
    };
  },
});

window.HET.init();
```

Call `window.HET.destroy()` to run cleanup for mounted components and remove request listeners.

`refs` includes elements marked with `het-ref` on the component root and its descendants,
but excludes elements inside nested `[het-component]` subtrees.

### Signals

Component bindings expect Preact signal objects. See the [Preact Signals documentation](https://github.com/preactjs/signals) for details on creating and using signals.

Signals can come from three places:

- Local signals you initialize in `setup`, such as `signals.count = window.HET.signals.signal(0)`.
- Acquired signals created from DOM values with `:seed` or `:sync` before `setup` runs.
- Imported signals declared with `het-imports`.

Initialize only the local signals your component owns. Do not initialize signals that are acquired from the DOM or imported from an ancestor.

In the IIFE build, use the helpers exposed on `window.HET.signals`, such as `window.HET.signals.signal(0)`.

The ESM build does not re-export signal helpers. If you use components with the ESM build, import signal helpers from `@preact/signals-core`:

```js
import { signal } from '@preact/signals-core';
import { registerComponent } from '/path/to/het.js';

registerComponent('counter', {
  setup: ({ signals }) => {
    signals.count = signal(0);
  },
});
```

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

### `het-cloak`

Use `het-cloak` to hide a component root until a component mount batch completes,
then HET removes the attribute automatically. This avoids uncloaking parents before
their nested components have mounted, which helps prevent brief visual mismatch.
Preserve layout by using `visibility: hidden`.

```html
<style>
  [het-cloak] { visibility: hidden; }
</style>

<div het-component="filterPanel" het-cloak>
  ...
</div>
```

### Binding syntax

Binding attributes connect an element property, attribute, class, model value, or event to a signal or component method using `target=source` declarations.
For example, `het-props="textContent=count"` writes the `count` signal to the element's `textContent` property.
Some binding attributes support multiple declarations in the same attribute, separated by whitespace.
Some signal bindings can add an acquisition clause, such as `:seed` or `:sync`, to initialize a signal from the DOM.
Some acquisition clauses can also add a type hint, such as `:seed[int]`.
Each directive has its own support limits; see [Acquisition Strategies (`:seed`, `:sync`)](#acquisition-strategies-seed-sync) for the full reference.

General forms:

```text
target=source
target=source:seed
target=source:sync[bool]
```

### Component attribute support

| Attribute | Role | Value shape | Multiple declarations | Notes |
| --- | --- | --- | --- | --- |
| [`het-component`](#components) | Component root | Component name | No | Mounts the registered component with that name. |
| [`het-ref`](#het-ref) | DOM ref | Ref name | No | Exposed on `setup({ refs })` for the owning component scope. |
| [`het-cloak`](#het-cloak) | Mount cloak | Boolean attribute | No | Removed after the component mount batch completes. |
| [`het-props`](#het-props) | Property binding | `property=signal` | Yes | Supports acquisition clauses. |
| [`het-attrs`](#het-attrs) | Attribute binding | `attribute=signal` | Yes | Supports acquisition clauses. |
| [`het-bool-attrs`](#het-bool-attrs) | Boolean attribute binding | `attribute=signal` | Yes | Supports acquisition clauses, but not type hints. |
| [`het-class`](#het-class) | Class toggle binding | `class=signal` | Yes | Supports acquisition clauses, but not type hints. |
| [`het-model`](#het-model) | Two-way form binding | `signal` or `property=signal` | No | Supports `:seed`, but not `:sync`. |
| [`het-on`](#het-on) | Event binding | `event=method` | Yes | Does not support acquisition clauses or type hints. |
| [`het-exports`](#het-exports-and-het-imports) | Signal export list | `signal` | Yes | Whitespace-separated exported signal names. |
| [`het-imports`](#het-exports-and-het-imports) | Signal import list | `signal` or `local=source` | Yes | Imports from the nearest exporting ancestor. |

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
    signals.count = window.HET.signals.signal(0);
    return {
      increment: () => {
        signals.count.value += 1;
      },
    };
  },
});
```

Support:

| Feature | Support |
| --- | --- |
| Multiple declarations | Yes, whitespace-separated |
| [Acquisition](#acquisition-strategies-seed-sync) | `:seed`, `:sync` |
| [Type hints](#type-hints) | `[int]`, `[float]`, `[bool]` |

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
    signals.status = window.HET.signals.signal('idle');
    return {
      toggle: () => {
        signals.status.value = signals.status.value === 'idle' ? 'busy' : 'idle';
      },
    };
  },
});
```

Support:

| Feature | Support |
| --- | --- |
| Multiple declarations | Yes, whitespace-separated |
| [Acquisition](#acquisition-strategies-seed-sync) | `:seed`, `:sync` |
| [Type hints](#type-hints) | `[int]`, `[float]`, `[bool]` |

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
    signals.isDisabled = window.HET.signals.signal(false);
    return {
      toggle: () => {
        signals.isDisabled.value = !signals.isDisabled.value;
      },
    };
  },
});
```

Support:

| Feature | Support |
| --- | --- |
| Multiple declarations | Yes, whitespace-separated |
| [Acquisition](#acquisition-strategies-seed-sync) | `:seed`, `:sync` |
| [Type hints](#type-hints) | No |

### `het-class`

Use `het-class` to toggle classes from signal values.
If the signal value is truthy, the class is added. If the signal value is falsy, the class is removed.

```html
<div het-component="alertBox">
  <button type="button" het-on="click=toggle">Toggle active</button>
  <div het-class="active=isActive"></div>
</div>
```

```js
window.HET.registerComponent('alertBox', {
  setup: ({ signals }) => {
    signals.isActive = window.HET.signals.signal(false);
    return {
      toggle: () => {
        signals.isActive.value = !signals.isActive.value;
      },
    };
  },
});
```

Support:

| Feature | Support |
| --- | --- |
| Multiple declarations | Yes, whitespace-separated |
| [Acquisition](#acquisition-strategies-seed-sync) | `:seed`, `:sync` |
| [Type hints](#type-hints) | No |

### `het-model`

Use `het-model` for two-way signal binding on form controls.
When no key is provided, HET infers `value` for most inputs and `checked` for checkbox/radio inputs.
You can also specify the property name explicitly with `property=signal`.
The DOM event cannot be specified; HET infers `change` for `checked` bindings and `input` for all other properties.

```html
<div het-component="profileForm">
  <input het-model="name">
  <input het-model="value=email">
  <input type="checkbox" het-model="isSubscribed">
  <p het-props="textContent=name"></p>
  <p het-props="textContent=email"></p>
</div>
```

```js
window.HET.registerComponent('profileForm', {
  setup: ({ signals }) => {
    signals.name = window.HET.signals.signal('Ada');
    signals.email = window.HET.signals.signal('ada@example.com');
    signals.isSubscribed = window.HET.signals.signal(false);
    return {};
  },
});
```

Support:

| Feature | Support |
| --- | --- |
| Multiple declarations | No, one declaration per attribute |
| [Acquisition](#acquisition-strategies-seed-sync) | `:seed` only (`:sync` is invalid) |
| [Type hints](#type-hints) | `[int]`, `[float]`, `[bool]` |

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

For example, `het-on="click=increment focus=handleFocus"` binds two events.

Support:

| Feature | Support |
| --- | --- |
| Multiple declarations | Yes, whitespace-separated |
| [Acquisition](#acquisition-strategies-seed-sync) | No (`:seed`/`:sync` are invalid) |
| [Type hints](#type-hints) | No |

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

Support:

| Feature | Support |
| --- | --- |
| Multiple declarations | Yes, whitespace-separated |
| [Acquisition](#acquisition-strategies-seed-sync) | No |
| [Type hints](#type-hints) | No |

### Acquisition Strategies (`:seed`, `:sync`)

This section is the full reference for acquisition clauses and type hints.
Signal bindings can initialize from existing DOM values using acquisition clauses for some directives (see the acquisition support matrix below):

- `:seed` initializes the signal once from the bound element.
- `:sync` initializes once and updates the signal again when a `het:sync` event is dispatched.

An acquired signal is created before `setup` runs. A signal may be referenced by multiple bindings, but it may have only one DOM acquisition source. That acquisition binding becomes the source of truth for the signal's initial value (`:seed`) or synchronized value (`:sync`).

Do not initialize an acquired signal manually in `setup`, import a signal with the same local name, or declare a second acquisition binding for the same signal.

```html
<!-- Valid: one acquisition source, multiple output bindings -->
<input het-props="value=count:seed[int]" value="7">
<span het-props="textContent=count"></span>
<output het-attrs="data-count=count"></output>
```

```html
<!-- Invalid: two acquisition sources for the same signal -->
<input het-props="value=count:seed[int]" value="7">
<span het-props="textContent=count:seed[int]">7</span>
```

Sync trigger behavior:
- In full toolkit usage (`requests` + `components`), HET dispatches `het:sync` after request content loads. This covers the target pane and any content updated through `het-also`.
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

#### Type hints

Type hints can be applied to acquisition values for some directives (see the acquisition support matrix below):

- `[int]` uses `parseInt(value, 10)`
- `[float]` uses `parseFloat(value)`
- `[bool]` treats `true` and `"true"` as `true`; other values are `false`

```html
<p het-props="textContent=count:seed[int]">7</p>
<p het-props="textContent=price:seed[float]">3.5</p>
<p het-props="textContent=enabled:seed[bool]">true</p>
```

Acquisition support matrix:

| Directive | `:seed` | `:sync` | Type hints |
| --- | --- | --- | --- |
| `het-props` | Yes | Yes | Yes (`[int]`, `[float]`, `[bool]`) |
| `het-attrs` | Yes | Yes | Yes (`[int]`, `[float]`, `[bool]`) |
| `het-bool-attrs` | Yes | Yes | No |
| `het-class` | Yes | Yes | No |
| `het-model` | Yes | No | Yes (`[int]`, `[float]`, `[bool]`) |

`het-component`, `het-ref`, `het-cloak`, `het-on`, `het-exports`, and `het-imports` do not use acquisition syntax.

## Request enhancement

HET progressively enhances both links and forms by replacing a named target pane from server-rendered HTML responses.

### Request attribute support

| Attribute | Valid elements | Value shape | Multiple values | Notes |
| --- | --- | --- | --- | --- |
| `het-pane` | Replaceable pane element | Pane name | No | Current document and response must each contain exactly one matching pane. |
| `het-nav` | `het-pane` element | Boolean attribute | No | Enables browser history and configured `<head>` synchronization for that pane. |
| `het-target` | Same-origin links, forms, submit buttons | Pane name | No | Submitter value overrides the form value. |
| `het-select` | Links, forms, submit buttons | Element id list | Yes | Replaces matching descendants inside the target pane. Submitter value overrides the form value. |
| `het-also` | Links, forms, submit buttons | Element id list | Yes | Replaces matching elements outside the target pane. Submitter value overrides the form value. |
| `het-background` | Forms, submit buttons | Boolean attribute | No | Skips form disabling for that submission; the target pane is still marked busy. |

### Links

Add `het-target="<pane-name>"` to a same-origin link to fetch the link URL and replace the matching pane from the response.

```html
<main het-pane="main">
  <a href="/next" het-target="main">Next page</a>
</main>
```

- Do not put `het-target` on links to another origin; HET treats that as an error.
- Do not put `het-target` on links with a `target` attribute; HET treats that as an error.
- Modifier clicks (Ctrl, Cmd, Shift, or middle click) are not enhanced.
- Clicks on nested elements inside a link still resolve to the nearest ancestor `<a het-target="...">`.

### Forms

Add `het-target="<pane-name>"` to a same-origin form to submit it with `fetch` and replace the matching pane from the response.

```html
<form method="get" action="/search" het-target="main">
  <input name="q">
  <button type="submit">Search</button>
</form>
```

- HET respects native form defaults and submitter overrides: `formaction`, `formmethod`, `formenctype`, default `method`/`action`, and submitter name/value pairs.
- HET submits `GET` forms as query strings and supports `application/x-www-form-urlencoded`, `multipart/form-data`, and `text/plain` request bodies for non-GET forms.
- `het-target` on the clicked submit button overrides `het-target` on the form.
- `het-select` and `het-also` on the clicked submit button override the form attributes.
- Do not put `het-target` on cross-origin form submissions; HET treats that as an error.
- If `het-background` is present on the form or submitter, HET does not disable the form while the request is in flight. The target pane is still marked busy.

### Panes

Use `het-pane="<name>"` to mark replaceable content. The current document and the response HTML must each contain exactly one pane with the resolved target name.

```html
<main het-pane="main">
  ...
</main>
```

If the pane is missing or duplicated in either place, HET throws an error.

### Partial updates with `het-select`

Use `het-select` to replace only specific ids inside the target pane. The value is a whitespace-separated list of ids.

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

- Without `het-select`, HET replaces the entire target pane element with the matching pane from the response.
- If `het-select` is present, it must list at least one id.
- `het-select` throws if any listed id is missing in the current target or in the response target.

### Additional replacements with `het-also`

Use `het-also` to replace elements outside the target pane from the same response. The value is a whitespace-separated list of ids.

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

If `het-also` is present, it must list at least one id.

### Navigation panes (`het-nav`)

Add `het-nav` to a pane when replacements should also update browser history.

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

When HET performs the first navigation in a session, it calls `replaceState` for the initial page and then `pushState` for the loaded response URL. On `popstate`, HET cancels in-flight requests, re-fetches the URL from history state, and re-applies the saved pane/select/also settings.

For `het-nav` navigations, HET also synchronizes configured `<head>` elements from the response (including `<title>` by default), so browser history navigation restores both pane content and page metadata.

### Server contract

Enhanced requests include an `X-HET-Target` header containing the resolved target pane name.

HET reads the response body as text and parses it as HTML. It does not currently validate response status or `Content-Type` before parsing.

Responses must be HTML containing exactly one matching target pane. Servers may also return override headers:

| Header | Effect |
| --- | --- |
| `X-HET-Target-Override` | Replace a different pane than originally targeted. The override pane must exist in the current document and response. |
| `X-HET-Select-Override` | Override `het-select` ids. Use a whitespace-separated list of ids; an empty value clears selection and performs a full pane replacement. |
| `X-HET-Also-Override` | Override `het-also` ids. Use a whitespace-separated list of ids; an empty value clears additional replacements. |

When using `X-HET-Target-Override`, it is usually safer to also clear selection (`X-HET-Select-Override: ""`) unless the selected ids are guaranteed to exist in the overridden target pane.

### UI feedback while requests are in flight

When an enhanced request starts, HET marks the target pane as busy and disables interactive controls inside that pane:

- Sets `data-het-busy="<requestId>"` on the target pane.
- Sets `aria-busy="true"` on the target pane.
- Adds a busy CSS class (default: `het-busy`, configurable via `busyClass`).
- Disables `input`, `button`, `select`, and `textarea` elements inside the target pane.

When the request finishes (or is aborted), HET removes the busy markers and only re-enables controls that HET disabled for that specific request.

Form-specific addition:
- HET also disables/enables controls associated to the form via the `form` attribute.
- This form-disable behavior is skipped when the active submitter or form has `het-background`.

After swapping content, HET honors the first `[autofocus]` in newly inserted content (target replacements first, then `het-also` replacements) and removes the attribute so it does not trigger again.

### Request coordination

HET coordinates in-flight requests by target pane so overlapping updates do not race and leave the UI in an inconsistent state.

- If a pane request is in flight, a new request to the same pane cancels the earlier one.
- If a child pane request is in flight, a new request to an ancestor pane cancels the child request.
- If a parent pane request is in flight, new requests targeting panes inside it are ignored.

### Lifecycle events

HET dispatches lifecycle events around fetch and content loading. These events are not awaited.

Fetch events bubble from the initiator: the `a[het-target]` or `form[het-target]` for enhanced interactions, and `document` for browser history (`popstate`) re-fetches. Content-load events bubble from the target pane or inserted pane.

| Event | Cancelable | Detail | Notes |
| --- | --- | --- | --- |
| `het:beforeFetch` | Yes | `request`, `initiator`, `target` | Listeners may replace `detail.request` before HET calls `fetch`. |
| `het:afterFetch` | No | `response`, `initiator`, `target` | Listeners may replace `detail.response` before HET reads the response body. |
| `het:beforeLoadContent` | Yes | `newContent` | Listeners may replace `detail.newContent` before HET swaps content. |
| `het:afterLoadContent` | No | `alsoElements` | Dispatched after target/select/also replacements and autofocus handling. |

## Component lifecycle notes

- Components mount when `init()` runs, and new component roots inserted later auto-mount only if their component definition has already been registered.
- Registering a component after `init()` does not retroactively mount existing matching elements; it applies to future insertions.
- Component bindings are discovered once, when a component mounts. Adding or changing `het-*` bindings inside an already-mounted component does not register new bindings, even if you later dispatch `het:sync`.
- Removing a mounted component runs cleanup callbacks registered with `onCleanup`.
- `het-cloak` is removed after a component mount batch completes. If a component cannot mount, HET leaves `het-cloak` in place.

## API reference

### `init(config)`

Initialize HET. This mounts registered components, starts component mutation observation, installs request enhancement listeners, and connects request-driven content loads to component synchronization.

`config` is optional, and every config property is optional. Omitted properties use the defaults described below. `init` does not return a value.

### Config options

#### `onError(error)`

Handle internal errors with your own logging/reporting. Signature: `(error: Error | DOMException | unknown) => void`. Default: rethrow. Return value is ignored.

```js
window.HET.init({
  onError: (error) => {
    console.error("HET caught error", error);
    // Forward to your telemetry here
  },
});
```

#### `busyClass`

Override the CSS class HET applies to a busy target pane while a request is in flight. Default: `"het-busy"`.

```js
window.HET.init({
  busyClass: 'is-loading',
});
```

#### `headContentSelectors`

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

#### `nonce`

Adds a nonce value to enhanced fetch requests using the configured nonce header name. Default: unset.

This is mainly useful for nonce-protected inline `<style>` blocks in swapped HTML. HET parses response HTML with browser APIs and does not execute scripts from swapped content.

```js
window.HET.init({
  nonce: 'server-generated-nonce',
});
```

#### `nonceHeader`

Overrides the request header name used for `nonce`. Default: `"X-HET-Nonce"`.

```js
window.HET.init({
  nonce: 'server-generated-nonce',
  nonceHeader: 'X-CSP-Nonce',
});
```

#### `trustedTypesPolicy`

[Trusted Types](https://developer.mozilla.org/en-US/docs/Web/API/Trusted_Types_API) policy object used to transform response HTML before parsing. Default: unset. If provided, HET calls `trustedTypesPolicy.createHTML(responseHtml)`.

[DOMPurify](https://github.com/cure53/DOMPurify) is a suitable sanitizer for this. If you use head updates, configure it to keep the document structure and allow head elements/attributes.

```js
import DOMPurify from 'dompurify';

const trustedTypesPolicy = trustedTypes.createPolicy('het', {
  createHTML: (html) =>
    DOMPurify.sanitize(html, {
      RETURN_TRUSTED_TYPE: false,
      WHOLE_DOCUMENT: true,
      ADD_TAGS: ['html', 'head', 'body', 'meta', 'title', 'link', 'style'],
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
        'het-background',
        'het-cloak',
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

Note: Trusted Types is broadly available in current browsers as of February 2026, but may not be supported in older browsers. A polyfill is available from <https://github.com/w3c/trusted-types>

#### `replaceContent`

Function to customize how HET swaps a matched element with its replacement.
Default: replace the matched element with an imported clone of the response element.
This is called for the target pane, `het-select` replacements, and `het-also` replacements.
Return the element that remains in the document after the replacement. HET uses this returned element for autofocus handling and post-load lifecycle/sync behavior.

We recommend using a DOM morphing library (such as [Idiomorph](https://github.com/bigskysoftware/idiomorph)) for smoother updates.

```js
window.HET.init({
  replaceContent: (currentEl, replacementEl) => {
    Idiomorph.morph(currentEl, replacementEl);
    return currentEl;
  },
});
```

### `destroy()`

Destroy mounted components, run their cleanup callbacks, abort in-flight enhanced requests, and remove HET's document/window event listeners.

`destroy` accepts no parameters and does not return a value.

### `registerComponent(name, definition)`

Register a component definition for elements whose `het-component` value matches `name`.

Parameters:

- `name`: the string used by `het-component`.
- `definition`: an optional object. If it includes `setup`, HET calls `setup(context)` when a matching component mounts.

`setup(context)` receives:

- `el`: the component root element.
- `refs`: elements in this component scope marked with `het-ref`.
- `signals`: the component signal registry.
- `onCleanup(fn)`: register cleanup work to run when the component is destroyed.

`setup` may return an object of methods for `het-on` bindings. `registerComponent` does not return a value.

## Development

Project layout:

- `src/` source modules (built into `dist/`).
- `dist/` build output from `npm run build`.
- `test-app/` Express + Handlebars demo server used for manual exploration and tests.
- `tests/` Playwright specs that exercise the test app.
- `build.js` build script that bundles the toolkit.

Install dependencies, then install Playwright browsers:

```bash
npm install
npx playwright install
```

Common scripts:

| Command | Description |
| --- | --- |
| `npm run build` | Build `dist/het.js`, `dist/het.iife.js`, and `dist/het.iife.min.js`. |
| `npm run test-app` | Build HET and start the Express test app. |
| `npm run samples-app` | Build HET and start the sample app. |
| `npm run test` | Run the Playwright test suite. The Playwright config starts the test app automatically. |
