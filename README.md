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
  - [Component errors](#component-errors)
- [Request enhancement](#request-enhancement)
  - [Request errors](#request-errors)
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
- Request-driven content loads dispatch `het:sync` so components can reconcile server-updated DOM back into signals.

## Components

Register named components before calling `init()`, then attach them with `het-component`. A component starts from existing HTML and wires small behavior onto it:

```html
<div het-component="counter">
  <button type="button" het-on="click->increment">+</button>
  <output het-props="textContent=count"></output>
</div>
```

```js
window.HET.registerComponent('counter', ({ signals }) => {
  signals.count = window.HET.signals.signal(0);

  return {
    increment() {
      signals.count.value += 1;
    },
  };
});

window.HET.init();
```

For setup-free components, use `het-component` without a value. This mounts the component root so acquired signals, bindings, imports, exports, sync, and cleanup use the normal component lifecycle without a registered setup function:

```html
<div het-component>
  <span het-props="textContent=message:seed">Ready</span>
  <output het-props="textContent=message"></output>
</div>
```

Call `window.HET.destroy()` to run cleanup for mounted components and remove request listeners.

### Signals

Component bindings expect Preact signal objects. See the [Preact Signals documentation](https://github.com/preactjs/signals) for details on creating and using signals.

Signals can come from three places:

- Local signals you initialize in `setup`, such as `signals.count = window.HET.signals.signal(0)`.
- Acquired signals created from DOM values with `:seed` or `:sync` before `setup` runs. See [Acquisition Strategies (`:seed`, `:sync`)](#acquisition-strategies-seed-sync) for details.
- Imported signals declared with `het-imports`. See [`het-exports` and `het-imports`](#het-exports-and-het-imports) for details.

Initialize only the local signals your component owns. Do not initialize signals that are acquired from the DOM or imported from an ancestor.

In the IIFE build, use the helpers exposed on `window.HET.signals`, such as `window.HET.signals.signal(0)`.

The ESM build does not re-export signal helpers. If you use components with the ESM build, import signal helpers from `@preact/signals-core`:

```js
import { signal } from '@preact/signals-core';
import { registerComponent } from '/path/to/het.js';

registerComponent('counter', ({ signals }) => {
  signals.count = signal(0);
});
```

### `het-ref`

Use `het-ref` to expose DOM element references in `setup({ refs })`.
The `refs` object includes elements marked with `het-ref` on the component root and its descendants, but excludes elements inside nested `[het-component]` subtrees.

```html
<div het-component="profileForm">
  <input het-ref="emailInput" type="email">
</div>
```

```js
window.HET.registerComponent('profileForm', ({ refs }) => {
  refs.emailInput?.focus();
});
```

### `het-cloak`

Use `het-cloak` to hide a component root until a component mount batch completes,
then HET removes the attribute automatically. This avoids uncloaking parents before
their nested components have mounted, which helps prevent brief visual mismatch.
HET does not provide styles for cloaked elements, so bring your own CSS. To preserve layout while a component is cloaked, use something like:

```html
<style>
  [het-cloak] { visibility: hidden; }
</style>

<div het-component="filterPanel" het-cloak>
  ...
</div>
```

### Binding syntax

Binding attributes connect an element property, attribute, class, model value, or event to a signal or component method.
For example, `het-props="textContent=count"` writes the `count` signal to the element's `textContent` property.
Some binding attributes support multiple declarations in the same attribute, separated by whitespace.
For example, `het-props="textContent=count title=label"` binds two properties from two signals.
Some signal bindings support negation with `!`, which applies JavaScript boolean negation before writing to the DOM.
For example, `het-attrs="aria-expanded=!isCollapsed"` writes `"false"` when `isCollapsed` is truthy.
Some signal bindings can add an acquisition clause, such as `:seed` or `:sync`, to initialize a signal from the DOM.
Some acquisition clauses can also add a type hint, such as `:seed[int]`.
Each directive has its own support limits; see [Acquisition Strategies (`:seed`, `:sync`)](#acquisition-strategies-seed-sync) for the full reference.

General forms:

```text
target=source
target=!source
target=source:seed
target=source:sync[bool]
event->method
event->signal=#property[int]
event->signal=$otherSignal
event->signal=literal
```

Negation and acquisition cannot be combined in the same declaration.

### Component attribute support

| Attribute | Role | Value shape | Multiple declarations | Acquisition | Type hints | Negation | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| [`het-component`](#components) | Component root | Optional component name | No | No | No | No | Mounts the registered component with that name, or mounts anonymously when empty. |
| [`het-ref`](#het-ref) | DOM ref | Ref name | No | No | No | No | Exposed on `setup({ refs })` for the owning component scope. |
| [`het-cloak`](#het-cloak) | Mount cloak | Boolean attribute | No | No | No | No | Removed after the component mount batch completes. |
| [`het-props`](#het-props) | Property binding | `property=signal` | Yes | `:seed`, `:sync` | Yes | Yes | - |
| [`het-attrs`](#het-attrs) | Attribute binding | `attribute=signal` | Yes | `:seed`, `:sync` | Yes | Yes | - |
| [`het-bool-attrs`](#het-bool-attrs) | Boolean attribute binding | `attribute=signal` | Yes | `:seed`, `:sync` | No | Yes | - |
| [`het-class`](#het-class) | Class toggle binding | `class=signal` | Yes | `:seed`, `:sync` | No | Yes | - |
| [`het-model`](#het-model) | Two-way form binding | `signal` or `signal:seed` | No | `:seed` only | No | No | `:sync` is invalid. |
| [`het-on`](#het-on) | Event binding | `event->method` or `event->signal=source` | Yes | No | Assignment sources only | Assignment sources only | Binds methods or assigns signals. |
| [`het-toggle`](#het-toggle) | Event toggle binding | `event->signal` | Yes | No | No | Yes | Toggles a signal by assigning `!$signal`. |
| [`het-exports`](#het-exports-and-het-imports) | Signal export list | `signal` | Yes | No | No | No | Whitespace-separated exported signal names. |
| [`het-imports`](#het-exports-and-het-imports) | Signal import list | `signal` or `local=source` | Yes | No | No | No | Imports from the nearest exporting ancestor. |

### `het-props`

Use `het-props` to bind signal values to element properties.
Use this for DOM properties (for example `textContent`, `value`, `checked`).

```html
<div het-component="counter">
  <button type="button" het-on="click->increment">+</button>
  <p het-props="textContent=count"></p>
</div>
```

```js
window.HET.registerComponent('counter', ({ signals }) => {
  signals.count = window.HET.signals.signal(0);
  return {
    increment() {
      signals.count.value += 1;
    },
  };
});
```

Support:

| Feature | Support |
| --- | --- |
| Multiple declarations | Yes |
| Negation | Yes |
| [Acquisition](#acquisition-strategies-seed-sync) | `:seed`, `:sync` |
| [Type hints](#type-hints) | Yes |

### `het-attrs`

Use `het-attrs` to bind signal values to element attributes.
Use for attributes whose meaning comes from their value. For boolean presence/absence attributes such as `disabled`, `required` or `hidden`, use `het-bool-attrs` instead.

```html
<div het-component="statusCard">
  <button type="button" het-on="click->toggle">Toggle status</button>
  <p het-attrs="data-status=status"></p>
</div>
```

```js
window.HET.registerComponent('statusCard', ({ signals }) => {
  signals.status = window.HET.signals.signal('idle');
  return {
    toggle() {
      signals.status.value = signals.status.value === 'idle' ? 'busy' : 'idle';
    },
  };
});
```

Support:

| Feature | Support |
| --- | --- |
| Multiple declarations | Yes |
| Negation | Yes |
| [Acquisition](#acquisition-strategies-seed-sync) | `:seed`, `:sync` |
| [Type hints](#type-hints) | Yes |

### `het-bool-attrs`

Use `het-bool-attrs` to toggle boolean attributes based on signal truthiness.
Use for attributes whose meaning comes from presence/absence like `disabled`, `required` or `hidden`. If an attribute merely stores a boolean-like value (e.g. `aria-expanded="true"`), bind it with `het-attrs` instead. If the signal value is truthy, the attribute is added. If the signal value is falsy, the attribute is removed.

```html
<div het-component="lockInput">
  <button type="button" het-on="click->toggle">Toggle disabled</button>
  <input het-bool-attrs="disabled=isDisabled">
</div>
```

```js
window.HET.registerComponent('lockInput', ({ signals }) => {
  signals.isDisabled = window.HET.signals.signal(false);
  return {
    toggle() {
      signals.isDisabled.value = !signals.isDisabled.value;
    },
  };
});
```

Support:

| Feature | Support |
| --- | --- |
| Multiple declarations | Yes |
| Negation | Yes |
| [Acquisition](#acquisition-strategies-seed-sync) | `:seed`, `:sync` |
| [Type hints](#type-hints) | No |

### `het-class`

Use `het-class` to toggle classes from signal values.
If the signal value is truthy, the class is added. If the signal value is falsy, the class is removed.

```html
<div het-component="alertBox">
  <button type="button" het-on="click->toggle">Toggle active</button>
  <div het-class="active=isActive"></div>
</div>
```

```js
window.HET.registerComponent('alertBox', ({ signals }) => {
  signals.isActive = window.HET.signals.signal(false);
  return {
    toggle() {
      signals.isActive.value = !signals.isActive.value;
    },
  };
});
```

Support:

| Feature | Support |
| --- | --- |
| Multiple declarations | Yes |
| Negation | Yes |
| [Acquisition](#acquisition-strategies-seed-sync) | `:seed`, `:sync` |
| [Type hints](#type-hints) | No |

### `het-model`

Use `het-model` for two-way signal binding on form controls.
HET infers `value` for most inputs and `checked` for checkbox/radio inputs.
The DOM event cannot be specified; HET infers `change` for `checked` bindings and `input` for all other properties.
Use `signal:seed` to initialize the signal from the element's current property value.
For explicit properties, events, or typed values, combine `het-props` with `het-on` assignment.

```html
<div het-component="profileForm">
  <input het-model="name">
  <input het-model="email:seed" value="ada@example.com">
  <input type="checkbox" het-model="isSubscribed">
  <p het-props="textContent=name"></p>
  <p het-props="textContent=email"></p>
</div>
```

```js
window.HET.registerComponent('profileForm', ({ signals }) => {
  signals.name = window.HET.signals.signal('Ada');
  signals.isSubscribed = window.HET.signals.signal(false);
});
```

Support:

| Feature | Support |
| --- | --- |
| Multiple declarations | No, one declaration per attribute |
| Negation | No |
| [Acquisition](#acquisition-strategies-seed-sync) | `:seed` only (`:sync` is invalid) |
| [Type hints](#type-hints) | No |

### `het-on`

Use `het-on` to bind DOM events to methods returned from `setup`, or to assign signal values when an event fires.
Method declarations use `event->method`.
Assignment declarations use `event->signal=source`.

```html
<div het-component="counter">
  <button type="button" het-on="click->increment">+</button>
  <input het-props="value=count:seed[int]" het-on="input->count=#value[int]" value="0">
</div>
```

```js
window.HET.registerComponent('counter', () => ({
  increment() {
    // handle click
  },
}));
```

Handlers are methods returned from `setup`. Define handlers with method syntax by default. HET invokes them with the returned methods object as `this`, so method syntax keeps sibling method calls available if a handler needs them later.

```js
window.HET.registerComponent('searchBox', () => ({
  updateQuery: () => {
    // Invalid: The `this` keyword is not bound in an arrow function,
    // so calling `this.logChange()` will not work.
    this.logChange();
  },
  logChange() {
    // handle change
  },
}));
```

```js
window.HET.registerComponent('searchBox', () => ({
  updateQuery() {
    // Valid: The `this` keyword is bound when using the method syntax,
    // so calling `this.logChange()` will do what you expect.
    this.logChange();
  },
  logChange() {
    // handle change
  },
}));
```

Assignment sources:

```text
$signal
#property
@attribute
literal
literal[int]
#property[float]
!$signal
```

Unprefixed assignment sources are literals. Use `$` when assigning from another signal.

Support:

| Feature | Support |
| --- | --- |
| Multiple declarations | Yes |
| Negation | Assignment sources only |
| [Acquisition](#acquisition-strategies-seed-sync) | No (`:seed`/`:sync` are invalid) |
| [Type hints](#type-hints) | Assignment sources only |

### `het-toggle`

Use `het-toggle` to toggle a signal when an event fires.

```html
<button type="button" het-toggle="click->isOpen">Toggle</button>
```

This is equivalent to:

```html
<button type="button" het-on="click->isOpen=!$isOpen">Toggle</button>
```

### `het-exports` and `het-imports`

Use `het-exports` on a parent component to declare which signals can be imported by descendants.
Use `het-imports` on a child component to import from the nearest mounted ancestor component that exports the signal name.

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

If multiple ancestors export the same signal name, HET resolves to the nearest exporting ancestor. On `het:sync`, imports are resolved again so moved components continue to use the nearest current exporter.

Performance note:
On `het:sync`, imported bindings are re-resolved against the current ancestor chain so nearest-export semantics remain correct after DOM updates. In very deep trees or pages with many imports, this can add measurable sync overhead. For those cases, consider managing shared signals explicitly outside component ancestry (for example, a module-level store) and wiring them in `setup` directly instead of relying on `het-imports`.

Support:

| Feature | Support |
| --- | --- |
| Multiple declarations | Yes |
| Negation | No |
| [Acquisition](#acquisition-strategies-seed-sync) | No |
| [Type hints](#type-hints) | No |

### Acquisition Strategies (`:seed`, `:sync`)

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
- HET dispatches `het:sync` after request content loads. This covers the target pane and any content updated through `het-also`.
- If DOM changes happen outside HET request enhancement, no automatic sync event is dispatched.
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

Type hints can be applied to acquisition values for some directives and to `het-on` assignment sources:

- `[int]` uses `parseInt(value, 10)`
- `[float]` uses `parseFloat(value)`
- `[bool]` treats `true` and `"true"` as `true`; other values are `false`

```html
<p het-props="textContent=count:seed[int]">7</p>
<p het-props="textContent=price:seed[float]">3.5</p>
<p het-props="textContent=enabled:seed[bool]">true</p>
<input het-on="input->count=#value[int]">
```

Acquisition support matrix:

| Directive | `:seed` | `:sync` | Type hints | Negation |
| --- | --- | --- | --- | --- |
| `het-props` | Yes | Yes | Yes | Yes |
| `het-attrs` | Yes | Yes | Yes | Yes |
| `het-bool-attrs` | Yes | Yes | No | Yes |
| `het-class` | Yes | Yes | No | Yes |
| `het-model` | Yes | No | No | No |

`het-component`, `het-ref`, `het-cloak`, `het-on`, `het-toggle`, `het-exports`, and `het-imports` do not use acquisition syntax.

### Component errors

Component errors are delivered to `init({ onError })`, except `registerComponent()` errors, which are thrown directly from the API call. HET-created errors use the `HET Error:` prefix and may include structured data on `error.cause`.

#### `HET Error: Component name is required`

Thrown when `registerComponent()` is called without a component name.

```js
window.HET.registerComponent('', () => ({}));
```

This error does not include a structured `cause`.

#### `HET Error: Invalid binding expression`

Thrown when a binding declaration does not match the directive's value shape. This includes missing separators and empty names around `=`, `:`, or `->`.

```html
<div het-component="counter">
  <p het-props="textContent="></p>
</div>
```

| `cause` property | Meaning |
| --- | --- |
| `componentName` | Value of the owning `het-component` attribute, if present. |
| `componentElement` | Component root element that was mounting. |
| `bindingAttribute` | Binding attribute being parsed. |
| `bindingDeclaration` | Raw binding declaration that failed. |
| `bindingElement` | Element containing the binding declaration. |

#### `HET Error: Unsupported negation`

Thrown when `!` is used with a directive that does not support negation, such as `het-on`.

```html
<div het-component="counter">
  <button type="button" het-on="click->!increment">+</button>
</div>
```

| `cause` property | Meaning |
| --- | --- |
| `componentName` | Value of the owning `het-component` attribute, if present. |
| `componentElement` | Component root element that was mounting. |
| `bindingAttribute` | Binding attribute being parsed. |
| `bindingDeclaration` | Raw binding declaration that failed. |
| `bindingElement` | Element containing the binding declaration. |

#### `HET Error: Negation requires a signal name`

Thrown when a negated binding uses `!` without a following signal name.

```html
<div het-component="panel">
  <section het-class="is-hidden=!"></section>
</div>
```

| `cause` property | Meaning |
| --- | --- |
| `componentName` | Value of the owning `het-component` attribute, if present. |
| `componentElement` | Component root element that was mounting. |
| `bindingAttribute` | Binding attribute being parsed. |
| `bindingDeclaration` | Raw binding declaration that failed. |
| `bindingElement` | Element containing the binding declaration. |

#### `HET Error: Binding declaration has too many ":" characters`

Thrown when a binding contains more than one acquisition separator.

```html
<div het-component="counter">
  <output het-props="textContent=count:seed:int"></output>
</div>
```

| `cause` property | Meaning |
| --- | --- |
| `componentName` | Value of the owning `het-component` attribute, if present. |
| `componentElement` | Component root element that was mounting. |
| `bindingAttribute` | Binding attribute being parsed. |
| `bindingDeclaration` | Raw binding declaration that failed. |
| `bindingElement` | Element containing the binding declaration. |

#### `HET Error: Negation cannot be used with acquisition`

Thrown when one declaration combines `!` with `:seed` or `:sync`.

```html
<div het-component="panel">
  <section het-class="is-hidden=!collapsed:seed"></section>
</div>
```

| `cause` property | Meaning |
| --- | --- |
| `componentName` | Value of the owning `het-component` attribute, if present. |
| `componentElement` | Component root element that was mounting. |
| `bindingAttribute` | Binding attribute being parsed. |
| `bindingDeclaration` | Raw binding declaration that failed. |
| `bindingElement` | Element containing the binding declaration. |

#### `HET Error: Binding declaration has an incomplete acquisition clause`

Thrown when the signal name or acquisition strategy is missing around `:`.

```html
<div het-component="counter">
  <output het-props="textContent=count:"></output>
</div>
```

| `cause` property | Meaning |
| --- | --- |
| `componentName` | Value of the owning `het-component` attribute, if present. |
| `componentElement` | Component root element that was mounting. |
| `bindingAttribute` | Binding attribute being parsed. |
| `bindingDeclaration` | Raw binding declaration that failed. |
| `bindingElement` | Element containing the binding declaration. |

#### `HET Error: Directive does not support acquisition clauses`

Thrown when `:seed` or `:sync` is used with a directive that cannot read from the DOM, such as `het-on`.

```html
<div het-component="counter">
  <button type="button" het-on="click->increment:seed">+</button>
</div>
```

| `cause` property | Meaning |
| --- | --- |
| `componentName` | Value of the owning `het-component` attribute, if present. |
| `componentElement` | Component root element that was mounting. |
| `bindingAttribute` | Binding attribute being parsed. |
| `bindingDeclaration` | Raw binding declaration that failed. |
| `bindingElement` | Element containing the binding declaration. |

#### `HET Error: Directive does not support type hints`

Thrown when a type hint is used with a directive that does not support type hints.

```html
<div het-component="panel">
  <section het-class="active=isActive:seed[bool]"></section>
</div>
```

| `cause` property | Meaning |
| --- | --- |
| `componentName` | Value of the owning `het-component` attribute, if present. |
| `componentElement` | Component root element that was mounting. |
| `bindingAttribute` | Binding attribute being parsed. |
| `bindingDeclaration` | Raw binding declaration that failed. |
| `bindingElement` | Element containing the binding declaration. |

#### `HET Error: Type hint is not recognised. Expected type hints are "int", "bool" or "float"`

Thrown when an acquisition clause uses an unsupported type hint.

```html
<div het-component="counter">
  <output het-props="textContent=count:seed[number]">1</output>
</div>
```

| `cause` property | Meaning |
| --- | --- |
| `componentName` | Value of the owning `het-component` attribute, if present. |
| `componentElement` | Component root element that was mounting. |
| `bindingAttribute` | Binding attribute being parsed. |
| `bindingDeclaration` | Raw binding declaration that failed. |
| `bindingElement` | Element containing the binding declaration. |
| `bindingTypeHint` | Unsupported type hint that was parsed from the declaration. |

#### `HET Error: Acquisition strategy is not recognised. Expected acquisition strategies are "seed" or "sync"`

Thrown when an acquisition clause uses an unsupported strategy.

```html
<div het-component="counter">
  <output het-props="textContent=count:load">1</output>
</div>
```

| `cause` property | Meaning |
| --- | --- |
| `componentName` | Value of the owning `het-component` attribute, if present. |
| `componentElement` | Component root element that was mounting. |
| `bindingAttribute` | Binding attribute being parsed. |
| `bindingDeclaration` | Raw binding declaration that failed. |
| `bindingElement` | Element containing the binding declaration. |
| `bindingAcquisitionStrategy` | Unsupported strategy parsed from the declaration. |

#### `HET Error: Directive does not support sync acquisition`

Thrown when `:sync` is used with a directive that only supports `:seed`, such as `het-model`.

```html
<div het-component="profileForm">
  <input het-model="name:sync" value="Ada">
</div>
```

| `cause` property | Meaning |
| --- | --- |
| `componentName` | Value of the owning `het-component` attribute, if present. |
| `componentElement` | Component root element that was mounting. |
| `bindingAttribute` | Binding attribute being parsed. |
| `bindingDeclaration` | Raw binding declaration that failed. |
| `bindingElement` | Element containing the binding declaration. |

#### `HET Error: Invalid import declaration`

Thrown when a `het-imports` item is neither `signal` nor `local=source`.

```html
<div het-component="child" het-imports="local="></div>
```

| `cause` property | Meaning |
| --- | --- |
| `componentName` | Value of the owning `het-component` attribute, if present. |
| `componentElement` | Component root element that was mounting. |
| `bindingAttribute` | Always `het-imports`. |
| `bindingDeclaration` | Raw import declaration that failed. |

#### `HET Error: Imported signal has no exporting ancestor`

Thrown when `het-imports` asks for a signal that no ancestor component exports.

```html
<div het-component="child" het-imports="count"></div>
```

| `cause` property | Meaning |
| --- | --- |
| `componentName` | Value of the importing component's `het-component` attribute, if present. |
| `componentElement` | Importing component root element. |
| `bindingAttribute` | Always `het-imports`. |
| `importLocalSignalName` | Local signal name requested by the importing component. |
| `importSourceSignalName` | Exported signal name HET looked for on ancestors. |

#### `HET Error: Exporting ancestor component is not mounted`

Thrown when an ancestor declares the requested export but does not have a mounted component instance.

```html
<div het-component="parent" het-exports="count">
  <div het-component="child" het-imports="count"></div>
</div>
```

```js
window.HET.registerComponent('child', () => ({}));
window.HET.init();
```

| `cause` property | Meaning |
| --- | --- |
| `componentName` | Value of the importing component's `het-component` attribute, if present. |
| `componentElement` | Importing component root element. |
| `bindingAttribute` | Always `het-imports`. |
| `exportingComponentElement` | Ancestor element that declared the export. |
| `exportingComponentName` | Value of the ancestor's `het-component` attribute, if present. |
| `importLocalSignalName` | Local signal name requested by the importing component. |
| `importSourceSignalName` | Exported signal name HET looked for on the ancestor. |

#### `HET Error: Exporting ancestor does not provide imported signal`

Thrown when the nearest exporting ancestor is mounted but its setup did not initialize the exported signal.

```html
<div het-component="parent" het-exports="count">
  <div het-component="child" het-imports="count"></div>
</div>
```

```js
window.HET.registerComponent('parent', () => ({}));
window.HET.registerComponent('child', () => ({}));
window.HET.init();
```

| `cause` property | Meaning |
| --- | --- |
| `componentName` | Value of the importing component's `het-component` attribute, if present. |
| `componentElement` | Importing component root element. |
| `bindingAttribute` | Always `het-imports`. |
| `exportingComponentElement` | Ancestor element that declared the export. |
| `exportingComponentName` | Value of the ancestor's `het-component` attribute, if present. |
| `importLocalSignalName` | Local signal name requested by the importing component. |
| `importSourceSignalName` | Exported signal name HET looked for on the ancestor. |

#### `HET Error: Imported signal conflicts with local initialization`

Thrown when a component imports a signal and also tries to initialize the same signal from the DOM with `:seed` or `:sync`.

```html
<div het-component="parent" het-exports="count">
  <div het-component="child" het-imports="count">
    <output het-props="textContent=count:seed">1</output>
  </div>
</div>
```

| `cause` property | Meaning |
| --- | --- |
| `componentName` | Value of the owning `het-component` attribute, if present. |
| `componentElement` | Component root element that was mounting. |
| `bindingAttribute` | Binding attribute that tried to initialize the imported signal. |
| `bindingDeclaration` | Raw binding declaration that tried to initialize the signal. |
| `bindingElement` | Element containing that binding declaration. |
| `signalName` | Signal name with conflicting import and initialization. |

#### `HET Error: Duplicate signal initialization`

Thrown when more than one `:seed` or `:sync` binding tries to initialize the same local signal.

```html
<div het-component="counter">
  <input het-props="value=count:seed[int]" value="1">
  <output het-props="textContent=count:seed[int]">1</output>
</div>
```

| `cause` property | Meaning |
| --- | --- |
| `componentName` | Value of the owning `het-component` attribute, if present. |
| `componentElement` | Component root element that was mounting. |
| `bindingAttribute` | Binding attribute that tried to initialize the signal again. |
| `bindingDeclaration` | Raw duplicate initialization declaration. |
| `bindingElement` | Element containing the duplicate declaration. |
| `signalName` | Signal name initialized more than once. |
| `existingBindingAttribute` | Binding attribute that already initialized the signal. |
| `existingBindingDeclaration` | Earlier declaration that initialized the signal. |
| `existingBindingElement` | Element containing the earlier declaration. |

#### `HET Error: Signal override after initialization`

Thrown when `setup()` assigns a signal name that already exists because it was acquired or imported.

```html
<div het-component="counter">
  <output het-props="textContent=count:seed[int]">1</output>
</div>
```

```js
window.HET.registerComponent('counter', ({ signals }) => {
  signals.count = window.HET.signals.signal(0);
});
```

| `cause` property | Meaning |
| --- | --- |
| `componentName` | Value of the owning `het-component` attribute, if present. |
| `componentElement` | Component root element that was mounting. |
| `signalName` | Signal name that `setup()` tried to replace. |

#### `HET Error: Signal initialized with a non-signal value`

Thrown when `setup()` assigns a value that is not a Preact signal object.

```js
window.HET.registerComponent('counter', ({ signals }) => {
  signals.count = 0;
});
```

| `cause` property | Meaning |
| --- | --- |
| `componentName` | Value of the owning `het-component` attribute, if present. |
| `componentElement` | Component root element that was mounting. |
| `signalName` | Signal name that received a non-signal value. |

#### `HET Error: Missing component method`

Thrown when `het-on` references a method that was not returned from `setup()`.

```html
<div het-component="counter">
  <button type="button" het-on="click->increment">+</button>
</div>
```

```js
window.HET.registerComponent('counter', () => ({}));
```

| `cause` property | Meaning |
| --- | --- |
| `componentName` | Value of the owning `het-component` attribute, if present. |
| `componentElement` | Component root element that was mounting. |
| `bindingAttribute` | Binding attribute that referenced the method. |
| `bindingDeclaration` | Raw event binding declaration. |
| `bindingElement` | Element containing the event binding. |
| `methodName` | Missing method name. |

#### `HET Error: Bound signal does not exist`

Thrown when a signal binding references a signal that was not acquired, imported, or initialized in `setup()`.

```html
<div het-component="counter">
  <output het-props="textContent=count"></output>
</div>
```

```js
window.HET.registerComponent('counter', () => ({}));
```

| `cause` property | Meaning |
| --- | --- |
| `componentName` | Value of the owning `het-component` attribute, if present. |
| `componentElement` | Component root element that was mounting. |
| `bindingAttribute` | Binding attribute that referenced the signal. |
| `bindingDeclaration` | Raw signal binding declaration. |
| `bindingElement` | Element containing the signal binding. |
| `signalName` | Missing signal name. |

## Request enhancement

HET progressively enhances both links and forms by replacing a named target pane from server-rendered HTML responses.

### Request attribute support

| Attribute | Valid elements | Value shape | Multiple values | Notes |
| --- | --- | --- | --- | --- |
| `het-pane` | Replaceable pane element | Pane name | No | Current document and response must each contain exactly one matching pane. |
| `het-nav` | `het-pane` element | Boolean attribute | No | Enables browser history and configured `<head>` synchronization for that pane. |
| `het-target` | Same-origin links, forms, submit buttons | Pane name | No | On forms, a submitter with `het-target` overrides the form value. |
| `het-select` | Links, forms, submit buttons | Element id list | Yes | Replaces matching descendants inside the target pane. On forms, a submitter with `het-select` overrides the form's `het-select` value; an empty submitter value clears the form value. |
| `het-also` | Links, forms, submit buttons | Element id list | Yes | Replaces matching elements outside the target pane. On forms, a submitter with `het-also` overrides the form's `het-also` value; an empty submitter value clears the form value. |
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
- `het-select` and `het-also` on the clicked submit button override the form attributes. Use empty submitter attributes (`het-select=""`, `het-also=""`) to clear form-level partial or additional replacements for that submission.
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
- On submit buttons, `het-select=""` clears a form-level `het-select` override and performs a full pane replacement.
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

On submit buttons, `het-also=""` clears a form-level `het-also` override and skips additional replacements for that submission.

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

Responses must be HTML containing exactly one matching target pane, regardless of HTTP status code. Servers may also return override headers:

| Header | Effect |
| --- | --- |
| `X-HET-Target-Override` | Replace a different pane than originally targeted. The override pane must exist in the current document and response. |
| `X-HET-Select-Override` | Override `het-select` ids. Use a whitespace-separated list of ids; an empty value clears selection and performs a full pane replacement. |
| `X-HET-Also-Override` | Override `het-also` ids. Use a whitespace-separated list of ids; an empty value clears additional replacements. |

When using `X-HET-Target-Override`, it is usually safer to also clear selection (`X-HET-Select-Override: ""`) unless the selected ids are guaranteed to exist in the overridden target pane.

### UI feedback while requests are in flight

When an enhanced request starts, HET marks the target pane as busy and disables interactive controls inside that pane:

- Sets `aria-busy="true"` on the target pane.
- Adds a busy CSS class (default: `het-busy`, configurable via `busyClass`).
- Disables `input`, `button`, `select`, and `textarea` elements inside the target pane.
- If the request is initiated by a form submission, disables controls for that form unless the form or submitter has `het-background`.

When the request finishes (or is aborted), HET removes the busy markers and only re-enables controls that HET disabled for that specific request.

After swapping content, HET honors the first `[autofocus]` in newly inserted content (target replacements first, then `het-also` replacements) and removes the attribute so it does not trigger again.

### Request coordination

HET coordinates in-flight requests by target pane so overlapping updates do not race and leave the UI in an inconsistent state.

- If a pane request is in flight, a new request to the same pane cancels the earlier one.
- If a child pane request is in flight, a new request to an ancestor pane cancels the child request.
- If a parent pane request is in flight, new requests targeting panes inside it are ignored.

### Lifecycle events

HET dispatches lifecycle events around fetch and content loading.

Fetch events bubble from the initiator: the `a[het-target]` or `form[het-target]` for enhanced interactions, and `document` for browser history (`popstate`) re-fetches. Content-load events bubble from the target pane or inserted pane.

| Event | Cancelable | Detail | Notes |
| --- | --- | --- | --- |
| `het:beforeFetch` | Yes | `request`, `initiator`, `target` | Listeners may replace `detail.request` before HET calls `fetch`. |
| `het:afterFetch` | No | `response`, `initiator`, `target` | Listeners may replace `detail.response` before HET reads the response body. |
| `het:beforeLoadContent` | Yes | `newContent` | Listeners may replace `detail.newContent` before HET swaps content. |
| `het:afterLoadContent` | No | `alsoElements` | Dispatched after target/select/also replacements and autofocus handling. |

### Request errors

Request errors are delivered to `init({ onError })`. HET-created errors use the `HET Error:` prefix and include structured request data on `error.cause`. The `Applies when` column shows which interaction type (link navigation, form submission, or browser forward/back navigation) or response feature adds each field. Form submission causes keep source-specific values such as `formAction` and `submitterAction` separate from resolved values such as `resolvedActionUrl`.

#### `HET Error: Cross-origin links cannot be progressively enhanced`

Thrown when an enhanced link points to a different origin.

```html
<main het-pane="main">
  <a href="https://example.com/page" het-target="main">External page</a>
</main>
```

| `cause` property | Applies when | Meaning |
| --- | --- | --- |
| `linkElement` | Always | Link element that initiated the request. |
| `linkUrl` | Always | Fully resolved link URL. |
| `linkTargetName` | Always | Pane name from the link `het-target`. |
| `resolvedTargetName` | Always | Final pane name selected from the link. |

#### `HET Error: Links with a target attribute cannot be progressively enhanced`

Thrown when an enhanced link also has a native `target` attribute.

```html
<main het-pane="main">
  <a href="/next" target="_blank" het-target="main">Next page</a>
</main>
```

| `cause` property | Applies when | Meaning |
| --- | --- | --- |
| `linkElement` | Always | Link element that initiated the request. |
| `linkUrl` | Always | Fully resolved link URL. |
| `linkTargetName` | Always | Pane name from the link `het-target`. |
| `resolvedTargetName` | Always | Final pane name selected from the link. |

#### `HET Error: Cross-origin form submissions cannot be progressively enhanced`

Thrown when an enhanced form or submitter resolves to a different origin.

```html
<form action="https://example.com/search" het-target="main">
  <button type="submit">Search</button>
</form>
```

| `cause` property | Applies when | Meaning |
| --- | --- | --- |
| `formElement` | Always | Form element that initiated the request. |
| `submitterElement` | Always | Form control used for the submission, if available. |
| `formTargetName` | Always | Pane name from the form `het-target`, if present. |
| `submitterTargetName` | Submitter has `het-target` | Pane name from the submitter `het-target`. |
| `resolvedTargetName` | Always | Final pane name after submitter target overrides. |
| `formAction` | Always | Form `action` value, or the current URL when omitted. |
| `submitterAction` | Submitter has `formaction` | Submitter `formaction` value. |
| `formMethod` | Always | Form `method` value, or `GET` when omitted. |
| `submitterMethod` | Submitter has `formmethod` | Submitter `formmethod` value. |
| `formEnctype` | Always | Form `enctype` value, or the default URL-encoded enctype when omitted. |
| `submitterEnctype` | Submitter has `formenctype` | Submitter `formenctype` value. |
| `resolvedMethod` | Always | Final HTTP method after submitter overrides and defaults. |
| `resolvedActionUrl` | Always | Final action URL after submitter overrides and defaults. |
| `resolvedEnctype` | Always | Final enctype after submitter overrides and defaults. |

#### `HET Error: Target pane not found on the page`

Thrown when the current document does not contain a pane for the resolved target name.

```html
<a href="/next" het-target="main">Next page</a>
```

| `cause` property | Applies when | Meaning |
| --- | --- | --- |
| `linkElement` | Link navigation | Link element that initiated the request. |
| `formElement` | Form submission | Form element that initiated the request. |
| `linkUrl` | Link navigation | Link URL. |
| `linkTargetName` | Link navigation | Pane name from the link `het-target`. |
| `submitterElement` | Form submission | Form control used for the submission, if available. |
| `formTargetName` | Form submission | Pane name from the form `het-target`, if present. |
| `submitterTargetName` | Submitter has `het-target` | Pane name from the submitter `het-target`. |
| `resolvedMethod` | Form submission | Resolved form method. |
| `resolvedActionUrl` | Form submission | Resolved form action. |
| `navigationFromUrl` | Browser navigation | Previous history URL. |
| `navigationToUrl` | Browser navigation | New history URL. |
| `navigationTargetName` | Browser navigation | Pane name from the history state. |
| `targetLookupName` | Target lookup errors | Pane name used for the current document lookup. |
| `resolvedTargetName` | Always | Final pane name HET looked for in the current document. |

#### `HET Error: Multiple target panes found on the page`

Thrown when the current document contains more than one pane for the resolved target name.

```html
<main het-pane="main"></main>
<section het-pane="main"></section>
<a href="/next" het-target="main">Next page</a>
```

| `cause` property | Applies when | Meaning |
| --- | --- | --- |
| `linkElement` | Link navigation | Link element that initiated the request. |
| `formElement` | Form submission | Form element that initiated the request. |
| `linkUrl` | Link navigation | Link URL. |
| `linkTargetName` | Link navigation | Pane name from the link `het-target`. |
| `submitterElement` | Form submission | Form control used for the submission, if available. |
| `formTargetName` | Form submission | Pane name from the form `het-target`, if present. |
| `submitterTargetName` | Submitter has `het-target` | Pane name from the submitter `het-target`. |
| `resolvedMethod` | Form submission | Resolved form method. |
| `resolvedActionUrl` | Form submission | Resolved form action. |
| `navigationFromUrl` | Browser navigation | Previous history URL. |
| `navigationToUrl` | Browser navigation | New history URL. |
| `navigationTargetName` | Browser navigation | Pane name from the history state. |
| `targetLookupName` | Target lookup errors | Pane name used for the current document lookup. |
| `resolvedTargetName` | Always | Final pane name HET looked for in the current document. |
| `targetPaneElements` | Always | Array of matching pane elements found on the page. |

#### `HET Error: Target pane not found in server response`

Thrown when the response HTML does not contain the resolved target pane.

```html
<!-- Current page -->
<main het-pane="main">
  <a href="/next" het-target="main">Next page</a>
</main>

<!-- Response from /next -->
<section>No main pane</section>
```

| `cause` property | Applies when | Meaning |
| --- | --- | --- |
| `linkElement` | Link navigation | Link element that initiated the request. |
| `formElement` | Form submission | Form element that initiated the request. |
| `linkUrl` | Link navigation | Link URL. |
| `linkTargetName` | Link navigation | Pane name from the link `het-target`. |
| `submitterElement` | Form submission | Form control used for the submission, if available. |
| `formTargetName` | Form submission | Pane name from the form `het-target`, if present. |
| `submitterTargetName` | Submitter has `het-target` | Pane name from the submitter `het-target`. |
| `resolvedMethod` | Form submission | Resolved form method. |
| `resolvedActionUrl` | Form submission | Resolved form action. |
| `navigationFromUrl` | Browser navigation | Previous history URL. |
| `navigationToUrl` | Browser navigation | New history URL. |
| `requestUrl` | Always | Final URL passed to `fetch`, after `het:beforeFetch`. |
| `requestMethod` | Always | Final request method passed to `fetch`. |
| `resolvedTargetName` | Always | Final pane name selected before response target overrides. |
| `targetPaneElement` | Always | Original target pane element on the page. |
| `responseTargetHeader` | Response included `X-HET-Target-Override` | Value of `X-HET-Target-Override`. |
| `effectiveTargetPaneName` | Target changed by `X-HET-Target-Override` | Pane name HET expected in the response. |
| `effectiveTargetPaneElement` | Target changed by `X-HET-Target-Override` | Current-page pane element selected by the target override. |

#### `HET Error: Multiple target panes found in server response`

Thrown when the response HTML contains more than one pane for the resolved target name.

```html
<!-- Response from /next -->
<main het-pane="main"></main>
<section het-pane="main"></section>
```

| `cause` property | Applies when | Meaning |
| --- | --- | --- |
| `linkElement` | Link navigation | Link element that initiated the request. |
| `formElement` | Form submission | Form element that initiated the request. |
| `linkUrl` | Link navigation | Link URL. |
| `linkTargetName` | Link navigation | Pane name from the link `het-target`. |
| `submitterElement` | Form submission | Form control used for the submission, if available. |
| `formTargetName` | Form submission | Pane name from the form `het-target`, if present. |
| `submitterTargetName` | Submitter has `het-target` | Pane name from the submitter `het-target`. |
| `resolvedMethod` | Form submission | Resolved form method. |
| `resolvedActionUrl` | Form submission | Resolved form action. |
| `navigationFromUrl` | Browser navigation | Previous history URL. |
| `navigationToUrl` | Browser navigation | New history URL. |
| `requestUrl` | Always | Final URL passed to `fetch`, after `het:beforeFetch`. |
| `requestMethod` | Always | Final request method passed to `fetch`. |
| `resolvedTargetName` | Always | Final pane name selected before response target overrides. |
| `targetPaneElement` | Always | Original target pane element on the page. |
| `responseTargetHeader` | Response included `X-HET-Target-Override` | Value of `X-HET-Target-Override`. |
| `effectiveTargetPaneName` | Target changed by `X-HET-Target-Override` | Pane name HET expected in the response. |
| `effectiveTargetPaneElement` | Target changed by `X-HET-Target-Override` | Current-page pane element selected by the target override. |
| `responseTargetPaneCount` | Always | Number of matching panes found in the response. |

#### `HET Error: Select directive must list at least one id`

Thrown when `het-select` is present but contains only whitespace.

```html
<main het-pane="main">
  <a href="/next" het-target="main" het-select=" ">Next page</a>
</main>
```

| `cause` property | Applies when | Meaning |
| --- | --- | --- |
| `linkElement` | Link navigation | Link element that initiated the request. |
| `formElement` | Form submission | Form element that initiated the request. |
| `linkUrl` | Link navigation | Link URL. |
| `linkTargetName` | Link navigation | Pane name from the link `het-target`. |
| `submitterElement` | Form submission | Form control used for the submission, if available. |
| `resolvedTargetName` | Always | Final pane name selected from the initiator. |
| `requestDirectiveAttribute` | Always | `het-select`. |
| `requestDirectiveDeclaration` | Always | Raw whitespace-only value. |

#### `HET Error: Selected element not found in the target pane on the page`

Thrown when a selected id is missing inside the current target pane.

```html
<main het-pane="main">
  <p id="summary">Summary</p>
  <a href="/next" het-target="main" het-select="details">Next page</a>
</main>
```

| `cause` property | Applies when | Meaning |
| --- | --- | --- |
| `linkElement` | Link navigation | Link element that initiated the request. |
| `formElement` | Form submission | Form element that initiated the request. |
| `linkUrl` | Link navigation | Link URL. |
| `linkTargetName` | Link navigation | Pane name from the link `het-target`. |
| `submitterElement` | Form submission | Form control used for the submission, if available. |
| `formTargetName` | Form submission | Pane name from the form `het-target`, if present. |
| `submitterTargetName` | Submitter has `het-target` | Pane name from the submitter `het-target`. |
| `resolvedMethod` | Form submission | Resolved form method. |
| `resolvedActionUrl` | Form submission | Resolved form action. |
| `navigationFromUrl` | Browser navigation | Previous history URL. |
| `navigationToUrl` | Browser navigation | New history URL. |
| `requestUrl` | Always | Final URL passed to `fetch`, after `het:beforeFetch`. |
| `requestMethod` | Always | Final request method passed to `fetch`. |
| `resolvedTargetName` | Always | Final pane name selected before response target overrides. |
| `targetPaneElement` | Always | Current target pane element searched for the selected id. |
| `responseTargetHeader` | Response included `X-HET-Target-Override` | Value of `X-HET-Target-Override`. |
| `effectiveTargetPaneName` | Target changed by `X-HET-Target-Override` | Pane name selected by the target override. |
| `effectiveTargetPaneElement` | Target changed by `X-HET-Target-Override` | Current-page pane element selected by the target override. |
| `requestDirectiveAttribute` | Always | `het-select`, or an empty string when no `het-select` attribute supplied the selected ids. |
| `responseSelectHeader` | Response included `X-HET-Select-Override` | Value of `X-HET-Select-Override`. |
| `selectId` | Always | Missing id from the select list. |

#### `HET Error: Selected element not found in the target pane in the server response`

Thrown when a selected id exists in the current target pane but is missing from the response target pane.

```html
<!-- Current page -->
<main het-pane="main">
  <p id="summary">Old summary</p>
  <a href="/next" het-target="main" het-select="summary">Next page</a>
</main>

<!-- Response from /next -->
<main het-pane="main">
  <p>No summary id</p>
</main>
```

| `cause` property | Applies when | Meaning |
| --- | --- | --- |
| `linkElement` | Link navigation | Link element that initiated the request. |
| `formElement` | Form submission | Form element that initiated the request. |
| `linkUrl` | Link navigation | Link URL. |
| `linkTargetName` | Link navigation | Pane name from the link `het-target`. |
| `submitterElement` | Form submission | Form control used for the submission, if available. |
| `formTargetName` | Form submission | Pane name from the form `het-target`, if present. |
| `submitterTargetName` | Submitter has `het-target` | Pane name from the submitter `het-target`. |
| `resolvedMethod` | Form submission | Resolved form method. |
| `resolvedActionUrl` | Form submission | Resolved form action. |
| `navigationFromUrl` | Browser navigation | Previous history URL. |
| `navigationToUrl` | Browser navigation | New history URL. |
| `requestUrl` | Always | Final URL passed to `fetch`, after `het:beforeFetch`. |
| `requestMethod` | Always | Final request method passed to `fetch`. |
| `resolvedTargetName` | Always | Final pane name selected before response target overrides. |
| `targetPaneElement` | Always | Current target pane element. |
| `responseTargetHeader` | Response included `X-HET-Target-Override` | Value of `X-HET-Target-Override`. |
| `effectiveTargetPaneName` | Target changed by `X-HET-Target-Override` | Pane name selected by the target override. |
| `effectiveTargetPaneElement` | Target changed by `X-HET-Target-Override` | Current-page pane element selected by the target override. |
| `requestDirectiveAttribute` | Always | `het-select`, or an empty string when no `het-select` attribute supplied the selected ids. |
| `responseSelectHeader` | Response included `X-HET-Select-Override` | Value of `X-HET-Select-Override`. |
| `selectId` | Always | Missing id from the select list. |
| `currentElement` | Always | Current-page element found for `selectId`. |

#### `HET Error: Also directive must list at least one id`

Thrown when `het-also` is present but contains only whitespace. A whitespace-only `X-HET-Also-Override` response header clears additional replacements instead of throwing this error.

```html
<main het-pane="main">
  <a href="/next" het-target="main" het-also=" ">Next page</a>
</main>
```

| `cause` property | Applies when | Meaning |
| --- | --- | --- |
| `linkElement` | Link navigation | Link element that initiated the request. |
| `formElement` | Form submission | Form element that initiated the request. |
| `linkUrl` | Link navigation | Link URL. |
| `linkTargetName` | Link navigation | Pane name from the link `het-target`. |
| `submitterElement` | Form submission | Form control used for the submission, if available. |
| `resolvedTargetName` | Always | Final pane name selected from the initiator. |
| `requestDirectiveAttribute` | Always | `het-also`. |
| `requestDirectiveDeclaration` | Always | Raw whitespace-only value. |

#### `HET Error: het-also element not found on the page`

Thrown when a `het-also` id is missing from the current document.

```html
<main het-pane="main">
  <a href="/next" het-target="main" het-also="sidebar">Next page</a>
</main>
```

| `cause` property | Applies when | Meaning |
| --- | --- | --- |
| `linkElement` | Link navigation | Link element that initiated the request. |
| `formElement` | Form submission | Form element that initiated the request. |
| `linkUrl` | Link navigation | Link URL. |
| `linkTargetName` | Link navigation | Pane name from the link `het-target`. |
| `submitterElement` | Form submission | Form control used for the submission, if available. |
| `formTargetName` | Form submission | Pane name from the form `het-target`, if present. |
| `submitterTargetName` | Submitter has `het-target` | Pane name from the submitter `het-target`. |
| `resolvedMethod` | Form submission | Resolved form method. |
| `resolvedActionUrl` | Form submission | Resolved form action. |
| `navigationFromUrl` | Browser navigation | Previous history URL. |
| `navigationToUrl` | Browser navigation | New history URL. |
| `requestUrl` | Always | Final URL passed to `fetch`, after `het:beforeFetch`. |
| `requestMethod` | Always | Final request method passed to `fetch`. |
| `resolvedTargetName` | Always | Final pane name selected before response target overrides. |
| `targetPaneElement` | Always | Current target pane element. |
| `responseTargetHeader` | Response included `X-HET-Target-Override` | Value of `X-HET-Target-Override`. |
| `effectiveTargetPaneName` | Target changed by `X-HET-Target-Override` | Pane name selected by the target override. |
| `effectiveTargetPaneElement` | Target changed by `X-HET-Target-Override` | Current-page pane element selected by the target override. |
| `requestDirectiveAttribute` | Always | `het-also`, or an empty string when no `het-also` attribute supplied the additional replacement ids. |
| `responseAlsoHeader` | Response included `X-HET-Also-Override` | Value of `X-HET-Also-Override`. |
| `alsoId` | Always | Missing id from the also list. |

#### `HET Error: het-also element found inside the target pane on the page`

Thrown when a `het-also` id resolves to an element inside the target pane in the current document.

```html
<main het-pane="main">
  <p id="summary">Summary</p>
  <a href="/next" het-target="main" het-also="summary">Next page</a>
</main>
```

| `cause` property | Applies when | Meaning |
| --- | --- | --- |
| `linkElement` | Link navigation | Link element that initiated the request. |
| `formElement` | Form submission | Form element that initiated the request. |
| `linkUrl` | Link navigation | Link URL. |
| `linkTargetName` | Link navigation | Pane name from the link `het-target`. |
| `submitterElement` | Form submission | Form control used for the submission, if available. |
| `formTargetName` | Form submission | Pane name from the form `het-target`, if present. |
| `submitterTargetName` | Submitter has `het-target` | Pane name from the submitter `het-target`. |
| `resolvedMethod` | Form submission | Resolved form method. |
| `resolvedActionUrl` | Form submission | Resolved form action. |
| `navigationFromUrl` | Browser navigation | Previous history URL. |
| `navigationToUrl` | Browser navigation | New history URL. |
| `requestUrl` | Always | Final URL passed to `fetch`, after `het:beforeFetch`. |
| `requestMethod` | Always | Final request method passed to `fetch`. |
| `resolvedTargetName` | Always | Final pane name selected before response target overrides. |
| `targetPaneElement` | Always | Current target pane element. |
| `responseTargetHeader` | Response included `X-HET-Target-Override` | Value of `X-HET-Target-Override`. |
| `effectiveTargetPaneName` | Target changed by `X-HET-Target-Override` | Pane name selected by the target override. |
| `effectiveTargetPaneElement` | Target changed by `X-HET-Target-Override` | Current-page pane element selected by the target override. |
| `requestDirectiveAttribute` | Always | `het-also`, or an empty string when no `het-also` attribute supplied the additional replacement ids. |
| `responseAlsoHeader` | Response included `X-HET-Also-Override` | Value of `X-HET-Also-Override`. |
| `alsoId` | Always | Id from the also list. |
| `currentElement` | Always | Current-page element found for `alsoId`. |

#### `HET Error: het-also element not found in the server response`

Thrown when a `het-also` id exists in the current document but is missing from the response document.

```html
<!-- Current page -->
<main het-pane="main">
  <a href="/next" het-target="main" het-also="sidebar">Next page</a>
</main>
<aside id="sidebar">Old sidebar</aside>

<!-- Response from /next -->
<main het-pane="main">Updated main</main>
```

| `cause` property | Applies when | Meaning |
| --- | --- | --- |
| `linkElement` | Link navigation | Link element that initiated the request. |
| `formElement` | Form submission | Form element that initiated the request. |
| `linkUrl` | Link navigation | Link URL. |
| `linkTargetName` | Link navigation | Pane name from the link `het-target`. |
| `submitterElement` | Form submission | Form control used for the submission, if available. |
| `formTargetName` | Form submission | Pane name from the form `het-target`, if present. |
| `submitterTargetName` | Submitter has `het-target` | Pane name from the submitter `het-target`. |
| `resolvedMethod` | Form submission | Resolved form method. |
| `resolvedActionUrl` | Form submission | Resolved form action. |
| `navigationFromUrl` | Browser navigation | Previous history URL. |
| `navigationToUrl` | Browser navigation | New history URL. |
| `requestUrl` | Always | Final URL passed to `fetch`, after `het:beforeFetch`. |
| `requestMethod` | Always | Final request method passed to `fetch`. |
| `resolvedTargetName` | Always | Final pane name selected before response target overrides. |
| `targetPaneElement` | Always | Current target pane element. |
| `responseTargetHeader` | Response included `X-HET-Target-Override` | Value of `X-HET-Target-Override`. |
| `effectiveTargetPaneName` | Target changed by `X-HET-Target-Override` | Pane name selected by the target override. |
| `effectiveTargetPaneElement` | Target changed by `X-HET-Target-Override` | Current-page pane element selected by the target override. |
| `requestDirectiveAttribute` | Always | `het-also`, or an empty string when no `het-also` attribute supplied the additional replacement ids. |
| `responseAlsoHeader` | Response included `X-HET-Also-Override` | Value of `X-HET-Also-Override`. |
| `alsoId` | Always | Id from the also list. |
| `currentElement` | Always | Current-page element found for `alsoId`. |

#### `HET Error: het-also element found inside the target pane in the server response`

Thrown when a `het-also` id resolves to an element inside the response target pane.

```html
<!-- Current page -->
<main het-pane="main">
  <a href="/next" het-target="main" het-also="sidebar">Next page</a>
</main>
<aside id="sidebar">Old sidebar</aside>

<!-- Response from /next -->
<main het-pane="main">
  <aside id="sidebar">Sidebar inside target</aside>
</main>
```

| `cause` property | Applies when | Meaning |
| --- | --- | --- |
| `linkElement` | Link navigation | Link element that initiated the request. |
| `formElement` | Form submission | Form element that initiated the request. |
| `linkUrl` | Link navigation | Link URL. |
| `linkTargetName` | Link navigation | Pane name from the link `het-target`. |
| `submitterElement` | Form submission | Form control used for the submission, if available. |
| `formTargetName` | Form submission | Pane name from the form `het-target`, if present. |
| `submitterTargetName` | Submitter has `het-target` | Pane name from the submitter `het-target`. |
| `resolvedMethod` | Form submission | Resolved form method. |
| `resolvedActionUrl` | Form submission | Resolved form action. |
| `navigationFromUrl` | Browser navigation | Previous history URL. |
| `navigationToUrl` | Browser navigation | New history URL. |
| `requestUrl` | Always | Final URL passed to `fetch`, after `het:beforeFetch`. |
| `requestMethod` | Always | Final request method passed to `fetch`. |
| `resolvedTargetName` | Always | Final pane name selected before response target overrides. |
| `targetPaneElement` | Always | Current target pane element. |
| `responseTargetHeader` | Response included `X-HET-Target-Override` | Value of `X-HET-Target-Override`. |
| `effectiveTargetPaneName` | Target changed by `X-HET-Target-Override` | Pane name selected by the target override. |
| `effectiveTargetPaneElement` | Target changed by `X-HET-Target-Override` | Current-page pane element selected by the target override. |
| `requestDirectiveAttribute` | Always | `het-also`, or an empty string when no `het-also` attribute supplied the additional replacement ids. |
| `responseAlsoHeader` | Response included `X-HET-Also-Override` | Value of `X-HET-Also-Override`. |
| `alsoId` | Always | Id from the also list. |
| `currentElement` | Always | Current-page element found for `alsoId`. |

## Component lifecycle notes

- Components mount when `init()` runs, and new component roots inserted later auto-mount only if their setup function has already been registered.
- Registering a component after `init()` does not retroactively mount existing matching elements; it applies to future insertions.
- Component bindings are discovered once, when a component mounts. Adding or changing `het-*` bindings inside an already-mounted component does not register new bindings, even if you later dispatch `het:sync`.
- Removing a mounted component runs cleanup callbacks registered with `onCleanup`.
- `het-cloak` is removed after a component mount batch completes. If a component cannot mount, HET leaves `het-cloak` in place.

## API reference

This section collects the JavaScript entry points and initialization options for lookup after the core HTML attributes are familiar.

### `init(config)`

Initialize HET. This mounts registered components, starts component mutation observation, installs request enhancement listeners, and connects request-driven content loads to component synchronization.

`config` is optional, and every config property is optional. Omitted properties use the defaults described below. `init` does not return a value.

### Config options

#### `onError(error)`

Handle internal errors with your own logging/reporting. Signature: `(error: Error | DOMException | unknown) => void`. Default: log and continue. Return value is ignored.

HET-created errors use the message prefix `HET Error:` and may include structured diagnostic data on `error.cause`, such as the component, directive declaration, initiating link or form, submitter, and target pane elements. See [Component errors](#component-errors) and [Request errors](#request-errors) for the full list.

```js
window.HET.init({
  onError: (error) => {
    console.error(error, error.cause);
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

### `registerComponent(name, setup)`

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
| `npm run test` | Run the Playwright test suite. The Playwright config starts the test app automatically. |
