# Error Reference

HET-created errors use the `HET Error:` prefix.
Most runtime errors are delivered to `init({ onError })`; `registerComponent()` validation errors are thrown directly.

Each section below covers one exact error message with:

- what it means
- a minimal example that triggers it
- how to fix the example

`error.cause` varies by error family. The component-side errors below document the structured fields that current HET code attaches.

## Binding Syntax

### `HET Error: Signal name is required`

A declaration that expects a signal name provided an empty or invalid identifier.

```html
<div het-component="counter">
  <input het-model="">
</div>
```

Fix the declaration by naming the signal.

```html
<input het-model="count">
```

### `HET Error: het-text binding requires an expression`

`het-text` was present but empty.

```html
<div het-component="counter">
  <span het-text=""></span>
</div>
```

Fix the binding by supplying an expression.

```html
<span het-text="count === 1 ? 'item' : 'items'"></span>
```

### `HET Error: het-model binding must be a signal name`

`het-model` only accepts a signal name. It does not accept `=` syntax or expressions.

```html
<div het-component="counter">
  <input het-model="value=name">
</div>
```

Fix the binding by giving `het-model` just the signal name.

```html
<input het-model="name">
```

### `HET Error: het-model binding requires a signal name`

`het-model` was present but empty.

```html
<div het-component="counter">
  <input het-model="">
</div>
```

Fix the binding by naming the signal that should stay in sync with the control.

```html
<input het-model="name">
```

### `HET Error: Event binding must contain exactly one "->"`

A `het-on` declaration was missing `->` or used it more than once.

```html
<div het-component="counter">
  <button het-on="click=>save"></button>
</div>
```

Fix the binding by using exactly one event/action separator.

```html
<button het-on="click->save"></button>
```

### `HET Error: Event binding requires an event and action`

A `het-on` declaration used `->` but left the event name or action empty.

```html
<div het-component="counter">
  <button het-on="click->"></button>
</div>
```

Fix the binding by naming both sides.

```html
<button het-on="click->save"></button>
```

### `HET Error: Event assignment requires a signal name and source`

An assignment-style `het-on` declaration used `=` but left the signal name or expression empty.

```html
<div het-component="counter">
  <input het-on="input->count=">
</div>
```

Fix the binding by filling in both sides.

```html
<input het-on="input->count=$target.value">
```

### `HET Error: Read binding must contain exactly one "="`

A `het-seed` or `het-sync` declaration did not contain exactly one top-level `=` between the signal name and expression.

```html
<div het-component="counter">
  <span het-seed="count"></span>
</div>
```

Fix the declaration so it has one signal target and one expression.

```html
<span het-seed="count=$text"></span>
```

### `HET Error: Read binding requires a signal name and source`

A `het-seed` or `het-sync` declaration used `=` but left the signal name or expression empty.

```html
<div het-component="counter">
  <span het-seed="count="></span>
</div>
```

Fix the declaration by filling in both sides.

```html
<span het-seed="count=$text"></span>
```

### `HET Error: Invalid expression`

The expression parser or validator rejected the declaration. This includes malformed syntax, unsupported calls, general computed access, invalid identifiers, or forbidden member access.

```html
<div het-component="counter">
  <button het-on="click->count=window.alert(1)"></button>
</div>
```

Fix the declaration by using HET's limited subset of JavaScript expressions only.

```html
<button het-on="click->count=$int($target.value)"></button>
```

### `HET Error: Empty binding declaration`

A multi-binding attribute used top-level semicolons but left one declaration empty.
An optional trailing semicolon by itself is allowed.

```html
<div het-component="counter">
  <button het-on="click->save; ; keydown.enter->save"></button>
</div>
```

Fix the declaration by removing the empty segment.

```html
<button het-on="click->save; keydown.enter->save"></button>
```

This error attaches the normal structured binding `cause`.

### `HET Error: Output binding expression cannot use contextual values`

An output binding such as `het-text` used contextual snapshot values like `$target`, `$event`, or `$props`.

```html
<div het-component="counter">
  <p het-text="$target.value"></p>
</div>
```

Fix the binding by reading from the DOM in `het-seed`, `het-sync`, or an event-time `het-on` assignment first.

```html
<input het-seed="message=$props.value">
<p het-text="message"></p>
```

### `HET Error: Invalid event modifier`

An event modifier name or modifier combination was not supported.

```html
<div het-component="counter">
  <button het-on="click.debounce->save"></button>
</div>
```

Fix the binding by using supported modifiers only.

```html
<button het-on="click.debounce(300)->save"></button>
```

Cause fields for component binding errors in this section:

| `cause` property | Meaning |
| --- | --- |
| `componentName` | Value of the owning `het-component` attribute. |
| `componentElement` | Component root element that was mounting. |
| `bindingAttribute` | Binding attribute being parsed. |
| `bindingDeclaration` | Raw binding declaration that failed. |
| `bindingElement` | Element containing the binding declaration. |
| `bindingErrorReason` | Exact parser reason used to build this error message, when present. |
| `eventModifier` | Invalid or conflicting event modifier, when relevant. |

## Methods and Signals

### `HET Error: Missing component method`

`het-on="event->method"` referenced a method that the component did not return from `setup`.

```html
<div het-component="counter">
  <button het-on="click->increment"></button>
</div>

<script>
  HET.registerComponent('counter');
</script>
```

Fix the binding by returning the method, or by changing the binding to the method name that actually exists.

### `HET Error: Bound signal does not exist`

A binding referenced a signal that was never created, imported, or acquired.

```html
<div het-component="counter">
  <p het-text="count"></p>
</div>
```

Fix the component by creating, importing, or acquiring the signal before the binding needs it.

### `HET Error: Duplicate signal initialization`

Two acquisition bindings tried to create the same local signal.

```html
<div het-component="counter">
  <span het-seed="count=$int($text)">1</span>
  <span het-seed="count=$int($text)">2</span>
</div>
```

Fix the component by choosing one acquisition source for the signal.

### `HET Error: Signal override after initialization`

`setup` tried to assign the same signal name twice.

```js
HET.registerComponent('counter', ({ signals }) => {
  signals.count = HET.signals.signal(1);
  signals.count = HET.signals.signal(2);
});
```

Fix the component by initializing each owned signal only once.

### `HET Error: Signal initialized with a non-signal value`

`setup` assigned a plain value to `signals.<name>` instead of a Preact signal object.

```js
HET.registerComponent('counter', ({ signals }) => {
  signals.count = 1;
});
```

Fix the component by assigning a real signal.

```js
signals.count = HET.signals.signal(1);
```

## Imports and Exports

### `HET Error: Invalid import declaration`

`het-imports` used a malformed declaration.

```html
<div het-component="child" het-imports="child=query=extra"></div>
```

Fix the declaration by using either `localName` or `localName=sourceName`.

### `HET Error: Imported signal has no exporting ancestor`

`het-imports` requested a signal that no ancestor component currently exports.

Fix the component tree by exporting the signal from an ancestor or by removing the import.

### `HET Error: Exporting ancestor component is not mounted`

An import resolved to an ancestor component element, but that exporting component was not mounted when the child tried to import from it.

Fix the mount order or export configuration so the ancestor component is mounted normally.

### `HET Error: Exporting ancestor does not provide imported signal`

An ancestor exported the requested name, but the signal itself was not available on the exporting component.

Fix the exporting component by creating or acquiring the exported signal.

### `HET Error: Imported signal conflicts with local initialization`

A component tried to import a signal name and also initialize that same local name with `het-seed` or `het-sync`.

Fix the component by choosing either imported ownership or local acquisition, not both.

