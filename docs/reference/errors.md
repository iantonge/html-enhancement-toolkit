# Error Reference

HET-created errors use the `HET Error:` prefix.
Runtime errors are logged with their structured `cause`.

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
  <span het-seed="=$text"></span>
</div>
```

Fix the declaration by naming the signal.

```html
<span het-seed="count=$text"></span>
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


### `HET Error: Read binding must contain exactly one "="`

A `het-seed` declaration did not contain exactly one top-level `=` between the signal name and expression.

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

A `het-seed` declaration used `=` but left the signal name or expression empty.

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
  <span het-seed="count=window.alert(1)"></span>
</div>
```

Fix the declaration by using HET's limited subset of JavaScript expressions only.

```html
<span het-seed="count=$int($text)"></span>
```

### `HET Error: Empty binding declaration`

A multi-binding attribute used top-level semicolons but left one declaration empty.
An optional trailing semicolon by itself is allowed.

```html
<div het-component="counter">
  <span het-seed="count=$text; ; status='ready'"></span>
</div>
```

Fix the declaration by removing the empty segment.

```html
<span het-seed="count=$text; status='ready'"></span>
```

This error attaches the normal structured binding `cause`.

### `HET Error: Output binding expression cannot use contextual values`

An output binding such as `het-text` used contextual snapshot values like `$target`, `$event`, or `$props`.

```html
<div het-component="counter">
  <p het-text="$target.value"></p>
</div>
```

Fix the binding by reading from the DOM in `het-seed` first.

```html
<input het-seed="message=$props.value">
<p het-text="message"></p>
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

## Methods and Signals

### `HET Error: Bound signal does not exist`

A binding referenced a signal that was never created, imported, or acquired.

```html
<div het-component="counter">
  <p het-text="count"></p>
</div>
```

Fix the component by creating, importing, or acquiring the signal before the binding needs it.

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

