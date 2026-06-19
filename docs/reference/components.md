# Component Reference

## Contents

- [Component roots and mounting](#component-roots-and-mounting)
- [Signals](#signals)
- [Limited JavaScript expressions](#limited-javascript-expressions)
- [Output bindings](#output-bindings)
- [Input and event bindings](#input-and-event-bindings)
- [Signal sharing](#signal-sharing)
- [Component lifecycle notes](#component-lifecycle-notes)
- [Component attribute support](#component-attribute-support)

## Component roots and mounting

### `het-component`

Use `het-component` to mark a component root.
Set a value to mount a registered component by name, or leave the attribute empty to mount an anonymous component root when component JavaScript is unnecessary.

```html
<div het-component="counter">
  <output het-seed="count=$int($text)" het-text="count">0</output>
  <button type="button" het-on="click->count = count + 1">+</button>
</div>
```

```html
<div het-component>
  <input value="Ready" het-model="message">
  <output het-text="message"></output>
</div>
```

Register named components before calling `init()`. Anonymous roots are useful when HTML bindings, imports, exports, and sync use the normal component lifecycle without a registered setup function.

## Signals

Component bindings expect Preact signal objects.
Signals can come from three places:

- Local signals initialized in `setup`, such as `signals.count = HET.signals.signal(0)`.
- Acquired signals created from DOM values with `het-seed` or `het-sync` before `setup` runs.
- Imported signals declared with `het-imports`.

Initialize only the local signals your component owns. Do not initialize signals that are acquired from the DOM or imported from an ancestor.

In the IIFE build, HET exposes these Preact Signals helpers on `HET.signals`:

- `HET.signals.signal(initialValue)`
- `HET.signals.computed(fn)`
- `HET.signals.effect(fn)`
- `HET.signals.batch(fn)`
- `HET.signals.untracked(fn)`

Example:

```js
HET.registerComponent('counter', ({ signals }) => {
  signals.count = HET.signals.signal(0);
  signals.doubleCount = HET.signals.computed(() => signals.count.value * 2);
});
```

The ESM build does not re-export signal helpers. Import them from `@preact/signals-core` instead.

## Limited JavaScript expressions

HET bindings support a limited subset of JavaScript for pure, side-effect-free expressions. This subset is intentionally narrow: HET interprets these bindings without creating an alternate arbitrary-code-execution surface under a strict CSP.

Expressions are used by:

- output bindings such as `het-text`
- assignment-style `het-on`
- `het-seed`
- `het-sync`

Supported syntax:

- signal identifiers such as `count`
- dot member access such as `$target.value`
- primitive literals: strings, numbers, booleans, `null`
- unary `-`
- binary `+`, `-`, `*`, `/`, `%`
- comparisons: `===`, `!==`, `<`, `<=`, `>`, `>=`
- logical `&&`, `||`
- ternary `condition ? a : b`
- parentheses
- allowlisted calls: `$int(value)`, `$float(value)`, `$bool(value)`

### Contextual values

HET provides these contextual snapshot values:

- `$event`
- `$target`
- `$currentTarget`
- `$text`
- `$props`

These values are snapshots by design. They are not reactive state.

Context semantics:

- `$text` reads `element.textContent`
- `$props.foo` reads `element.foo`

### Contextual functions

HET exposes three built-in conversion functions:

- `$int(value)` reads a value as an integer
- `$float(value)` reads a value as a floating-point number
- `$bool(value)` treats only `true` and `"true"` as `true`

Examples:

```html
<input het-on="input->quantity=$int($target.value)">
<output het-seed="count=$int($text)" het-text="count">0</output>
<input het-seed="price=$float($props.value)" value="3.50">
```

### Multi-binding syntax

Bindings that support multiple declarations use top-level semicolons:

```html
<button het-on="click->increment; keydown.enter->increment"></button>
```

Whitespace alone does not separate declarations.
An optional trailing semicolon is allowed.

## Output bindings

Output bindings evaluate signal-only expressions and write the result to the DOM. Output expressions must not use contextual values such as `$target` or `$props`.

### `het-text`

Use `het-text` to bind an expression to an element's `textContent`.

```html
<p het-text="count === 1 ? 'item' : 'items'"></p>
```

## Input and event bindings

### `het-model`

Use `het-model` for two-way signal binding on standard form controls.
HET infers `value` for most controls and `checked` for checkbox/radio inputs.
It listens for `input` on `value` bindings and `change` on `checked` bindings.
The signal is always seeded from the control before `setup` runs.

```html
<input het-model="name" value="Ada">
<input het-model:int="age" value="37">
<input type="checkbox" het-model:bool="isEnabled">
```

Typed variants apply coercion when reading from the control into the signal:

- `het-model:int`
- `het-model:float`
- `het-model:bool`

For explicit non-model patterns, combine `het-text`, `het-on`, and `het-seed` / `het-sync`.

### `het-on`

Use `het-on` to bind DOM events to methods returned from `setup`, or to assign signal values when an event fires.

Method form:

```html
<button het-on="click->increment">+</button>
```

Assignment form:

```html
<input het-on="input->count=$int($target.value)">
```

Multiple handlers use top-level semicolons:

```html
<button het-on="click->increment; keydown.enter->increment"></button>
```

Supported event modifiers:

- `prevent`
- `stop`
- `once`
- `capture`
- `debounce(ms)`
- `throttle(ms)`
- `esc`
- `enter`
- `space`

Handlers are methods returned from `setup`. Define them with method syntax by default. HET invokes them with the returned methods object as `this`.

### `het-seed`

Use `het-seed` to create local signals from DOM snapshots before `setup` runs.

```html
<output het-seed="count=$int($text)" het-text="count">7</output>
<p het-text="count"></p>
```

Multiple acquisitions use semicolons:

```html
<input value="ready" het-seed="status=$props.value">
```

A signal may have only one acquisition source.

### `het-sync`

Use `het-sync` when another system may update the DOM after mount and you need HET to re-read that snapshot into signals.

```html
<input value="Draft" het-sync="status=$props.value">
<p het-text="status"></p>
```

HET evaluates `het-sync` during initial mount and again whenever a `het:sync` event bubbles through the component subtree.

```js
const container = document.querySelector('#profile-editor');
container.dispatchEvent(new CustomEvent('het:sync', { bubbles: true }));
```

DOM-updating integrations must dispatch `het:sync` themselves.

## Signal sharing

### `het-exports`

Use `het-exports` on a component root to expose named signals to descendant components.
The value is a whitespace-separated signal name list.

```html
<section het-component="searchPage" het-exports="query">
  ...
</section>
```

### `het-imports`

Use `het-imports` on a descendant component root to import the nearest matching exported signal.
The value is a whitespace-separated declaration list.

- `localName` imports a signal under the same name
- `localName=sourceName` imports it under an alias

```html
<aside het-component="searchSidebar" het-imports="sidebarQuery=query"></aside>
```

If multiple ancestors export the same signal name, HET resolves to the nearest exporting ancestor. On `het:sync`, imports are resolved again so moved components continue to use the nearest current exporter.

## Component lifecycle notes

- HET mounts component roots in depth order so parents mount before descendants.
- HET unmounts removed components automatically.
- `destroy()` unmounts all mounted components and removes HET-managed listeners.
- Component bindings are discovered once, when the component mounts. Dispatching `het:sync` re-runs existing sync bindings; it does not register new or changed `het-*` attributes.

## Component attribute support

| Attribute | Purpose | Multiple declarations | Notes |
| --- | --- | --- | --- |
| `het-text` | Write expression to `textContent` | No | Output expression only. |
| `het-model` | Two-way control binding | No | Always seeded from the control. |
| `het-model:int` | Two-way control binding with integer coercion | No | Reads with `$int` semantics. |
| `het-model:float` | Two-way control binding with float coercion | No | Reads with `$float` semantics. |
| `het-model:bool` | Two-way control binding with boolean coercion | No | Reads with `$bool` semantics. |
| `het-on` | Event handlers and event-time assignments | Yes | Semicolon-separated declarations. |
| `het-seed` | Create signals from DOM snapshots before setup | Yes | Semicolon-separated declarations. |
| `het-sync` | Re-read DOM snapshots on mount and `het:sync` | Yes | Semicolon-separated declarations. |
| `het-exports` | Export signals to descendants | Yes | Whitespace-separated signal names. |
| `het-imports` | Import nearest exported signals | Yes | Whitespace-separated declarations. |
