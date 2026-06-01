# Error Reference

HET-created errors use the `HET Error:` prefix.
Most runtime errors are delivered to `init({ onError })`; `registerComponent()` validation errors are thrown directly.

Each section below covers one exact error message with:

- what it means
- a minimal example that triggers it
- how to fix the example

`error.cause` varies by error family. Each error below documents the structured fields that current HET code attaches for that exact failure.

## Registration

### `HET Error: Component name is required`

`registerComponent()` was called without a component name.

```js
HET.registerComponent('', () => ({}));
```

Fix the code by passing the component name that your HTML uses in `het-component`.

```js
HET.registerComponent('counter', () => ({}));
```

This error does not include a structured `cause`.

## Binding Syntax

### `HET Error: Binding declaration must contain exactly one "="`

A binding such as `het-props`, `het-attrs`, `het-class`, or `het-bool-attrs` used too many or too few `=` characters.

```html
<div het-component>
  <span het-props="textContent=count=extra"></span>
</div>
```

Fix the declaration so it has exactly one target and one source.

```html
<span het-props="textContent=count"></span>
```

Cause fields:

| `cause` property | Meaning |
| --- | --- |
| `componentName` | Value of the owning `het-component` attribute, if present. |
| `componentElement` | Component root element that was mounting. |
| `bindingAttribute` | Binding attribute being parsed. |
| `bindingDeclaration` | Raw binding declaration that failed. |
| `bindingElement` | Element containing the binding declaration. |
| `bindingErrorReason` | Exact parser reason used to build this error message. |

### `HET Error: Binding declaration requires a target and source`

A binding declaration used `=` but left the target or source empty.

```html
<div het-component>
  <span het-props="=count"></span>
</div>
```

Fix the declaration by filling in both sides.

```html
<span het-props="textContent=count"></span>
```

Cause fields:

| `cause` property | Meaning |
| --- | --- |
| `componentName` | Value of the owning `het-component` attribute, if present. |
| `componentElement` | Component root element that was mounting. |
| `bindingAttribute` | Binding attribute being parsed. |
| `bindingDeclaration` | Raw binding declaration that failed. |
| `bindingElement` | Element containing the binding declaration. |
| `bindingErrorReason` | Exact parser reason used to build this error message. |

### `HET Error: Signal name is required`

A signal binding resolved to an empty source name.

```html
<div het-component>
  <span het-text=""></span>
</div>
```

Fix the binding by naming the signal to read.

```html
<span het-text="count"></span>
```

Cause fields:

| `cause` property | Meaning |
| --- | --- |
| `componentName` | Value of the owning `het-component` attribute, if present. |
| `componentElement` | Component root element that was mounting. |
| `bindingAttribute` | Binding attribute being parsed. |
| `bindingDeclaration` | Raw binding declaration that failed. |
| `bindingElement` | Element containing the binding declaration. |
| `bindingErrorReason` | Exact parser reason used to build this error message. |

### `HET Error: Signal source cannot contain ":"`

HET only allows `:` inside known read-source prefixes such as `prop:`, `attr:`, `class:`, `bool-attr:`, or `literal:`. A plain signal source like `count:sync` is invalid.

```html
<div het-component>
  <span het-props="textContent=count:sync"></span>
</div>
```

Fix the binding by using a plain signal name, or move the colon into a supported read source.

```html
<span het-props="textContent=count"></span>
```

Cause fields:

| `cause` property | Meaning |
| --- | --- |
| `componentName` | Value of the owning `het-component` attribute, if present. |
| `componentElement` | Component root element that was mounting. |
| `bindingAttribute` | Binding attribute being parsed. |
| `bindingDeclaration` | Raw binding declaration that failed. |
| `bindingElement` | Element containing the binding declaration. |
| `bindingErrorReason` | Exact parser reason used to build this error message. |

### `HET Error: Type hint is incomplete`

A binding started a type hint with `[` but did not finish it correctly.

```html
<div het-component>
  <span het-props:seed="textContent=count[int">7</span>
</div>
```

Fix the binding by closing the type hint.

```html
<span het-props:seed="textContent=count[int]">7</span>
```

Cause fields:

| `cause` property | Meaning |
| --- | --- |
| `componentName` | Value of the owning `het-component` attribute, if present. |
| `componentElement` | Component root element that was mounting. |
| `bindingAttribute` | Binding attribute being parsed. |
| `bindingDeclaration` | Raw binding declaration that failed. |
| `bindingElement` | Element containing the binding declaration. |
| `bindingErrorReason` | Exact parser reason used to build this error message. |

### `HET Error: het-text binding must be a signal name`

`het-text` does not accept `target=source` syntax. It only accepts a signal name.

```html
<div het-component>
  <span het-text="textContent=count"></span>
</div>
```

Fix the binding by using only the signal name, or switch to `het-props`.

```html
<span het-text="count"></span>
```

Cause fields:

| `cause` property | Meaning |
| --- | --- |
| `componentName` | Value of the owning `het-component` attribute, if present. |
| `componentElement` | Component root element that was mounting. |
| `bindingAttribute` | Binding attribute being parsed. |
| `bindingDeclaration` | Raw binding declaration that failed. |
| `bindingElement` | Element containing the binding declaration. |
| `bindingErrorReason` | Exact parser reason used to build this error message. |

### `HET Error: het-text binding requires a signal name`

`het-text` was present but empty.

```html
<div het-component>
  <span het-text=""></span>
</div>
```

Fix the binding by naming the signal to render.

```html
<span het-text="count"></span>
```

Cause fields:

| `cause` property | Meaning |
| --- | --- |
| `componentName` | Value of the owning `het-component` attribute, if present. |
| `componentElement` | Component root element that was mounting. |
| `bindingAttribute` | Binding attribute being parsed. |
| `bindingDeclaration` | Raw binding declaration that failed. |
| `bindingElement` | Element containing the binding declaration. |
| `bindingErrorReason` | Exact parser reason used to build this error message. |

### `HET Error: het-model binding must be a signal name`

`het-model` only accepts a signal name. It does not accept `=` syntax or explicit property sources.

```html
<div het-component>
  <input het-model="value=name">
</div>
```

Fix the binding by giving `het-model` just the signal name.

```html
<input het-model="name">
```

Cause fields:

| `cause` property | Meaning |
| --- | --- |
| `componentName` | Value of the owning `het-component` attribute, if present. |
| `componentElement` | Component root element that was mounting. |
| `bindingAttribute` | Binding attribute being parsed. |
| `bindingDeclaration` | Raw binding declaration that failed. |
| `bindingElement` | Element containing the binding declaration. |
| `bindingErrorReason` | Exact parser reason used to build this error message. |

### `HET Error: het-model binding requires a signal name`

`het-model` was present but empty.

```html
<div het-component>
  <input het-model="">
</div>
```

Fix the binding by naming the signal that should stay in sync with the control.

```html
<input het-model="name">
```

Cause fields:

| `cause` property | Meaning |
| --- | --- |
| `componentName` | Value of the owning `het-component` attribute, if present. |
| `componentElement` | Component root element that was mounting. |
| `bindingAttribute` | Binding attribute being parsed. |
| `bindingDeclaration` | Raw binding declaration that failed. |
| `bindingElement` | Element containing the binding declaration. |
| `bindingErrorReason` | Exact parser reason used to build this error message. |

### `HET Error: Event binding must contain exactly one "->"`

A `het-on` event binding was missing `->` or used it more than once.

```html
<div het-component="counter">
  <button het-on="click=>increment"></button>
</div>
```

Fix the binding so it has exactly one event side and one action side.

```html
<button het-on="click->increment"></button>
```

Cause fields:

| `cause` property | Meaning |
| --- | --- |
| `componentName` | Value of the owning `het-component` attribute, if present. |
| `componentElement` | Component root element that was mounting. |
| `bindingAttribute` | Binding attribute being parsed. |
| `bindingDeclaration` | Raw binding declaration that failed. |
| `bindingElement` | Element containing the binding declaration. |
| `bindingErrorReason` | Exact parser reason used to build this error message. |

### `HET Error: Event binding requires an event and action`

A `het-on` declaration used `->` but left the event name or action empty.

```html
<div het-component="counter">
  <button het-on="click->"></button>
</div>
```

Fix the binding by providing both parts.

```html
<button het-on="click->increment"></button>
```

Cause fields:

| `cause` property | Meaning |
| --- | --- |
| `componentName` | Value of the owning `het-component` attribute, if present. |
| `componentElement` | Component root element that was mounting. |
| `bindingAttribute` | Binding attribute being parsed. |
| `bindingDeclaration` | Raw binding declaration that failed. |
| `bindingElement` | Element containing the binding declaration. |
| `bindingErrorReason` | Exact parser reason used to build this error message. |

### `HET Error: Event assignment must contain exactly one "="`

A `het-on` assignment action used too many or too few `=` characters.

```html
<div het-component>
  <input het-on="input->count=prop:value=int">
</div>
```

Fix the action so it assigns exactly one source to exactly one signal.

```html
<input het-on="input->count=prop:value[int]">
```

Cause fields:

| `cause` property | Meaning |
| --- | --- |
| `componentName` | Value of the owning `het-component` attribute, if present. |
| `componentElement` | Component root element that was mounting. |
| `bindingAttribute` | Binding attribute being parsed. |
| `bindingDeclaration` | Raw binding declaration that failed. |
| `bindingElement` | Element containing the binding declaration. |
| `bindingErrorReason` | Exact parser reason used to build this error message. |

### `HET Error: Event assignment requires a signal name and source`

A `het-on` assignment left the signal name or the source empty.

```html
<div het-component>
  <input het-on="input->count=">
</div>
```

Fix the action by providing both the destination signal and the source expression.

```html
<input het-on="input->count=prop:value">
```

Cause fields:

| `cause` property | Meaning |
| --- | --- |
| `componentName` | Value of the owning `het-component` attribute, if present. |
| `componentElement` | Component root element that was mounting. |
| `bindingAttribute` | Binding attribute being parsed. |
| `bindingDeclaration` | Raw binding declaration that failed. |
| `bindingElement` | Element containing the binding declaration. |
| `bindingErrorReason` | Exact parser reason used to build this error message. |

### `HET Error: Event modifier cannot be empty`

A `het-on` event expression used two dots in a row or ended with a dot.

```html
<div het-component="counter">
  <button het-on="click..prevent->increment"></button>
</div>
```

Fix the modifier list so each dot-separated segment is a real modifier.

```html
<button het-on="click.prevent->increment"></button>
```

Cause fields:

| `cause` property | Meaning |
| --- | --- |
| `componentName` | Value of the owning `het-component` attribute, if present. |
| `componentElement` | Component root element that was mounting. |
| `bindingAttribute` | Binding attribute being parsed. |
| `bindingDeclaration` | Raw binding declaration that failed. |
| `bindingElement` | Element containing the binding declaration. |
| `bindingErrorReason` | Exact parser reason used to build this error message. |

### `HET Error: Event name is required`

The event side of a `het-on` declaration contained only modifiers and no event name.

```html
<div het-component="counter">
  <button het-on=".prevent->increment"></button>
</div>
```

Fix the declaration by naming the DOM event before any modifiers.

```html
<button het-on="click.prevent->increment"></button>
```

Cause fields:

| `cause` property | Meaning |
| --- | --- |
| `componentName` | Value of the owning `het-component` attribute, if present. |
| `componentElement` | Component root element that was mounting. |
| `bindingAttribute` | Binding attribute being parsed. |
| `bindingDeclaration` | Raw binding declaration that failed. |
| `bindingElement` | Element containing the binding declaration. |
| `bindingErrorReason` | Exact parser reason used to build this error message. |

### `HET Error: Toggle binding must contain exactly one "->"`

A `het-toggle` declaration was missing `->` or used it more than once.

```html
<div het-component>
  <button het-toggle="click=>open"></button>
</div>
```

Fix the binding so it has one event side and one signal side.

```html
<button het-toggle="click->open"></button>
```

Cause fields:

| `cause` property | Meaning |
| --- | --- |
| `componentName` | Value of the owning `het-component` attribute, if present. |
| `componentElement` | Component root element that was mounting. |
| `bindingAttribute` | Binding attribute being parsed. |
| `bindingDeclaration` | Raw binding declaration that failed. |
| `bindingElement` | Element containing the binding declaration. |
| `bindingErrorReason` | Exact parser reason used to build this error message. |

### `HET Error: Toggle binding requires an event and signal name`

A `het-toggle` declaration used `->` but left the event name or signal name empty.

```html
<div het-component>
  <button het-toggle="click->"></button>
</div>
```

Fix the binding by providing both parts.

```html
<button het-toggle="click->open"></button>
```

Cause fields:

| `cause` property | Meaning |
| --- | --- |
| `componentName` | Value of the owning `het-component` attribute, if present. |
| `componentElement` | Component root element that was mounting. |
| `bindingAttribute` | Binding attribute being parsed. |
| `bindingDeclaration` | Raw binding declaration that failed. |
| `bindingElement` | Element containing the binding declaration. |
| `bindingErrorReason` | Exact parser reason used to build this error message. |

### `HET Error: Read binding must contain exactly one "="`

An explicit `het-seed` or `het-sync` declaration used too many or too few `=` characters.

```html
<div het-component>
  <span het-seed="count=prop:value=extra"></span>
</div>
```

Fix the binding so it maps one signal name to one read source.

```html
<span het-seed="count=prop:value"></span>
```

Cause fields:

| `cause` property | Meaning |
| --- | --- |
| `componentName` | Value of the owning `het-component` attribute, if present. |
| `componentElement` | Component root element that was mounting. |
| `bindingAttribute` | Binding attribute being parsed. |
| `bindingDeclaration` | Raw binding declaration that failed. |
| `bindingElement` | Element containing the binding declaration. |
| `bindingErrorReason` | Exact parser reason used to build this error message. |

### `HET Error: Read binding requires a signal name and source`

An explicit `het-seed` or `het-sync` declaration left the signal name or source empty.

```html
<div het-component>
  <span het-seed="count="></span>
</div>
```

Fix the binding by providing both the signal name and the read source.

```html
<span het-seed="count=prop:textContent"></span>
```

Cause fields:

| `cause` property | Meaning |
| --- | --- |
| `componentName` | Value of the owning `het-component` attribute, if present. |
| `componentElement` | Component root element that was mounting. |
| `bindingAttribute` | Binding attribute being parsed. |
| `bindingDeclaration` | Raw binding declaration that failed. |
| `bindingElement` | Element containing the binding declaration. |
| `bindingErrorReason` | Exact parser reason used to build this error message. |

### `HET Error: Read binding target must be a signal name`

The left-hand side of `het-seed` or `het-sync` was not a plain signal name.

```html
<div het-component>
  <span het-seed="count[int]=prop:textContent"></span>
</div>
```

Fix the binding by moving type hints to the read source, not the signal name.

```html
<span het-seed="count=prop:textContent[int]"></span>
```

Cause fields:

| `cause` property | Meaning |
| --- | --- |
| `componentName` | Value of the owning `het-component` attribute, if present. |
| `componentElement` | Component root element that was mounting. |
| `bindingAttribute` | Binding attribute being parsed. |
| `bindingDeclaration` | Raw binding declaration that failed. |
| `bindingElement` | Element containing the binding declaration. |
| `bindingErrorReason` | Exact parser reason used to build this error message. |

### `HET Error: Read source cannot be empty`

A read-source expression was present but empty after parsing.

```html
<div het-component>
  <span het-seed="count=!"></span>
</div>
```

Fix the binding by pointing at a real read source.

```html
<span het-seed="count=prop:textContent"></span>
```

Cause fields:

| `cause` property | Meaning |
| --- | --- |
| `componentName` | Value of the owning `het-component` attribute, if present. |
| `componentElement` | Component root element that was mounting. |
| `bindingAttribute` | Binding attribute being parsed. |
| `bindingDeclaration` | Raw binding declaration that failed. |
| `bindingElement` | Element containing the binding declaration. |
| `bindingErrorReason` | Exact parser reason used to build this error message. |

### `HET Error: Read source name is required`

A prefixed read source such as `prop:` or `attr:` was missing the name after the prefix.

```html
<div het-component>
  <span het-seed="count=prop:"></span>
</div>
```

Fix the binding by naming the property, attribute, class, or boolean attribute to read.

```html
<span het-seed="count=prop:textContent"></span>
```

Cause fields:

| `cause` property | Meaning |
| --- | --- |
| `componentName` | Value of the owning `het-component` attribute, if present. |
| `componentElement` | Component root element that was mounting. |
| `bindingAttribute` | Binding attribute being parsed. |
| `bindingDeclaration` | Raw binding declaration that failed. |
| `bindingElement` | Element containing the binding declaration. |
| `bindingErrorReason` | Exact parser reason used to build this error message. |

## Negation, Type Hints, and Acquisition

### `HET Error: Unsupported negation`

The binding used `!` on a directive that does not support negation, such as `het-model` or method-style `het-on`.

```html
<div het-component="counter">
  <button het-on="click->!increment"></button>
</div>
```

Fix the code by removing negation or by binding to a directive that supports it.

```html
<button het-on="click->increment"></button>
```

Cause fields:

| `cause` property | Meaning |
| --- | --- |
| `componentName` | Value of the owning `het-component` attribute, if present. |
| `componentElement` | Component root element that was mounting. |
| `bindingAttribute` | Binding attribute being parsed. |
| `bindingDeclaration` | Raw binding declaration that failed. |
| `bindingElement` | Element containing the binding declaration. |

### `HET Error: Negation requires a signal name`

The binding started with `!` but did not name a signal after it.

```html
<div het-component>
  <span het-props="hidden=!"></span>
</div>
```

Fix the binding by naming the signal to negate.

```html
<span het-props="hidden=!isVisible"></span>
```

Cause fields:

| `cause` property | Meaning |
| --- | --- |
| `componentName` | Value of the owning `het-component` attribute, if present. |
| `componentElement` | Component root element that was mounting. |
| `bindingAttribute` | Binding attribute being parsed. |
| `bindingDeclaration` | Raw binding declaration that failed. |
| `bindingElement` | Element containing the binding declaration. |

### `HET Error: Negation cannot be used with acquisition`

Acquisition bindings such as `:seed`, `:sync`, `het-seed`, and `het-sync` cannot also negate the source.

```html
<div het-component>
  <span het-props:seed="hidden=!isOpen"></span>
</div>
```

Fix the binding by removing negation from the acquisition declaration. If you need the inverse, compute it in JavaScript or with a second signal.

```html
<span het-props:seed="hidden=isHidden"></span>
```

Cause fields:

| `cause` property | Meaning |
| --- | --- |
| `componentName` | Value of the owning `het-component` attribute, if present. |
| `componentElement` | Component root element that was mounting. |
| `bindingAttribute` | Binding attribute being parsed. |
| `bindingDeclaration` | Raw binding declaration that failed. |
| `bindingElement` | Element containing the binding declaration. |

### `HET Error: Directive does not support type hints`

The directive supports the underlying binding, but not a type hint in that position.

```html
<div het-component>
  <div het-class="active=isActive[bool]"></div>
</div>
```

Fix the binding by removing the type hint, or switch to a directive that reads typed DOM values.

```html
<div het-class="active=isActive"></div>
```

Cause fields:

| `cause` property | Meaning |
| --- | --- |
| `componentName` | Value of the owning `het-component` attribute, if present. |
| `componentElement` | Component root element that was mounting. |
| `bindingAttribute` | Binding attribute being parsed. |
| `bindingDeclaration` | Raw binding declaration that failed. |
| `bindingElement` | Element containing the binding declaration. |

### `HET Error: Type hints are only supported for DOM reads`

A plain signal source used a type hint, but type hints only apply when HET reads from the DOM or a literal source.

```html
<div het-component>
  <span het-props="textContent=count[int]"></span>
</div>
```

Fix the binding by removing the type hint from plain signal reads.

```html
<span het-props="textContent=count"></span>
```

Cause fields:

| `cause` property | Meaning |
| --- | --- |
| `componentName` | Value of the owning `het-component` attribute, if present. |
| `componentElement` | Component root element that was mounting. |
| `bindingAttribute` | Binding attribute being parsed. |
| `bindingDeclaration` | Raw binding declaration that failed. |
| `bindingElement` | Element containing the binding declaration. |

### `HET Error: Type hint is not recognised. Expected type hints are "int", "bool" or "float"`

The binding used an unsupported type hint.

```html
<div het-component>
  <span het-props:seed="textContent=count[number]">7</span>
</div>
```

Fix the binding by using one of the supported hints.

```html
<span het-props:seed="textContent=count[int]">7</span>
```

Cause fields:

| `cause` property | Meaning |
| --- | --- |
| `componentName` | Value of the owning `het-component` attribute, if present. |
| `componentElement` | Component root element that was mounting. |
| `bindingAttribute` | Binding attribute being parsed. |
| `bindingDeclaration` | Raw binding declaration that failed. |
| `bindingElement` | Element containing the binding declaration. |
| `bindingTypeHint` | Unsupported type hint parsed from the binding declaration. |

### `HET Error: Invalid event modifier`

A `het-on` modifier was malformed, duplicated in an invalid way, or used on the wrong kind of event.

```html
<div het-component="search">
  <input het-on="input.debounce(foo)->updateQuery">
</div>
```

Fix the modifier so it uses a supported form such as `prevent`, `stop`, `once`, `capture`, `esc`, `enter`, `space`, `debounce(300)`, or `throttle(300)`.

```html
<input het-on="input.debounce(300)->updateQuery">
```

Cause fields:

| `cause` property | Meaning |
| --- | --- |
| `componentName` | Value of the owning `het-component` attribute, if present. |
| `componentElement` | Component root element that was mounting. |
| `bindingAttribute` | Binding attribute being parsed. |
| `bindingDeclaration` | Raw binding declaration that failed. |
| `bindingElement` | Element containing the binding declaration. |
| `eventModifier` | Specific modifier expression that failed validation. |

## Methods and Signals

### `HET Error: Missing component method`

A `het-on` binding referenced a method that the component did not return from `setup`.

```html
<div het-component="counter">
  <button het-on="click->increment"></button>
</div>

<script>
  HET.registerComponent('counter', () => ({}));
</script>
```

Fix the component by returning the referenced method, or change the binding to a method that exists.

```js
HET.registerComponent('counter', ({ signals }) => {
  signals.count = HET.signals.signal(0);
  return {
    increment() {
      signals.count.value += 1;
    },
  };
});
```

Cause fields:

| `cause` property | Meaning |
| --- | --- |
| `componentName` | Value of the owning `het-component` attribute, if present. |
| `componentElement` | Component root element that was mounting. |
| `bindingAttribute` | Binding attribute that referenced the method. |
| `bindingDeclaration` | Raw event binding declaration. |
| `bindingElement` | Element containing the event binding. |
| `methodName` | Missing method name. |

### `HET Error: Bound signal does not exist`

A binding referenced a signal that the component never initialized, imported, seeded, or synced.

```html
<div het-component>
  <span het-text="count"></span>
</div>
```

Fix the component by creating or importing the signal before any binding tries to use it.

```html
<div het-component="counter">
  <span het-text="count"></span>
</div>

<script>
  HET.registerComponent('counter', ({ signals }) => {
    signals.count = HET.signals.signal(0);
  });
</script>
```

Cause fields:

| `cause` property | Meaning |
| --- | --- |
| `componentName` | Value of the owning `het-component` attribute, if present. |
| `componentElement` | Component root element that was mounting. |
| `bindingAttribute` | Binding attribute that referenced the signal. |
| `bindingDeclaration` | Raw binding declaration. |
| `bindingElement` | Element containing the failing binding. |
| `signalName` | Signal name that could not be resolved. |

### `HET Error: Duplicate signal initialization`

Two acquisition bindings tried to initialize the same signal from different DOM reads.

```html
<div het-component>
  <span het-props:seed="textContent=count[int]">1</span>
  <span het-text:seed="count">2</span>
</div>
```

Fix the component so a signal has only one acquisition source.

```html
<div het-component>
  <span het-props:seed="textContent=count[int]">1</span>
</div>
```

Cause fields:

| `cause` property | Meaning |
| --- | --- |
| `componentName` | Value of the owning `het-component` attribute, if present. |
| `componentElement` | Component root element that was mounting. |
| `bindingAttribute` | Binding attribute that tried to initialize the signal again. |
| `bindingDeclaration` | Raw duplicate initialization declaration. |
| `bindingElement` | Element containing the duplicate declaration. |
| `signalName` | Signal name initialized more than once. |
| `existingBindingAttribute` | Earlier binding attribute that already initialized the signal. |
| `existingBindingDeclaration` | Earlier declaration that initialized the signal. |
| `existingBindingElement` | Element containing the earlier declaration. |

### `HET Error: Signal override after initialization`

Component code reassigned a signal slot after HET had already initialized it.

```html
<div het-component="profile">
  <span het-text:seed="name">Alpha</span>
</div>

<script>
  HET.registerComponent('profile', ({ signals }) => {
    signals.name = HET.signals.signal('Bravo');
  });
</script>
```

Fix the component by not reinitializing acquired, imported, or already-owned signals.

```js
HET.registerComponent('profile', ({ signals }) => {
  return {
    reset() {
      signals.name.value = 'Bravo';
    },
  };
});
```

Cause fields:

| `cause` property | Meaning |
| --- | --- |
| `componentName` | Value of the owning `het-component` attribute, if present. |
| `componentElement` | Component root element that was mounting. |
| `signalName` | Signal name that `setup()` tried to replace. |

### `HET Error: Signal initialized with a non-signal value`

Component code assigned a plain value where HET expected a signal object.

```html
<div het-component="counter">
  <span het-text="count"></span>
</div>

<script>
  HET.registerComponent('counter', ({ signals }) => {
    signals.count = 0;
  });
</script>
```

Fix the component by assigning a real signal.

```js
HET.registerComponent('counter', ({ signals }) => {
  signals.count = HET.signals.signal(0);
});
```

Cause fields:

| `cause` property | Meaning |
| --- | --- |
| `componentName` | Value of the owning `het-component` attribute, if present. |
| `componentElement` | Component root element that was mounting. |
| `signalName` | Signal name that received a non-signal value. |

## Imports and Exports

### `HET Error: Invalid import declaration`

`het-imports` contained an invalid token. Valid forms are `name` or `local=source`.

```html
<div het-component="child" het-imports="count="></div>
```

Fix the declaration by using one of the supported forms.

```html
<div het-component="child" het-imports="count"></div>
```

Cause fields:

| `cause` property | Meaning |
| --- | --- |
| `componentName` | Value of the importing component's `het-component` attribute, if present. |
| `componentElement` | Importing component root element. |
| `bindingAttribute` | Always `het-imports`. |
| `bindingDeclaration` | Raw import declaration that failed. |

### `HET Error: Imported signal has no exporting ancestor`

The component asked for an imported signal, but none of its ancestor components exported that signal.

```html
<div het-component="child" het-imports="count">
  <span het-text="count"></span>
</div>
```

Fix the component tree by placing the child under an ancestor with `het-exports`.

```html
<div het-component="parent" het-exports="count">
  <div het-component="child" het-imports="count">
    <span het-text="count"></span>
  </div>
</div>
```

Cause fields:

| `cause` property | Meaning |
| --- | --- |
| `componentName` | Value of the importing component's `het-component` attribute, if present. |
| `componentElement` | Importing component root element. |
| `bindingAttribute` | Always `het-imports`. |
| `importLocalSignalName` | Local signal name requested by the importing component. |
| `importSourceSignalName` | Exported signal name HET looked for on ancestors. |

### `HET Error: Exporting ancestor component is not mounted`

An ancestor exported the signal name, but that ancestor component never mounted successfully.

```html
<div het-component="missing-parent" het-exports="count">
  <div het-component="child" het-imports="count"></div>
</div>
```

Fix the component tree by registering the exporting component before `init()`.

```js
HET.registerComponent('missing-parent', ({ signals }) => {
  signals.count = HET.signals.signal(0);
});
```

Cause fields:

| `cause` property | Meaning |
| --- | --- |
| `componentName` | Value of the importing component's `het-component` attribute, if present. |
| `componentElement` | Importing component root element. |
| `bindingAttribute` | Always `het-imports`. |
| `exportingComponentElement` | Ancestor element that declared the export. |
| `exportingComponentName` | Value of the ancestor's `het-component` attribute, if present. |
| `importLocalSignalName` | Local signal name requested by the importing component. |
| `importSourceSignalName` | Exported signal name HET looked for on the ancestor. |

### `HET Error: Exporting ancestor does not provide imported signal`

An ancestor claimed to export a signal name, but its component instance never created that signal.

```html
<div het-component="parent" het-exports="count">
  <div het-component="child" het-imports="count"></div>
</div>

<script>
  HET.registerComponent('parent', () => ({}));
</script>
```

Fix the exporting component by initializing every signal named in `het-exports`, or remove the export.

```js
HET.registerComponent('parent', ({ signals }) => {
  signals.count = HET.signals.signal(0);
});
```

Cause fields:

| `cause` property | Meaning |
| --- | --- |
| `componentName` | Value of the importing component's `het-component` attribute, if present. |
| `componentElement` | Importing component root element. |
| `bindingAttribute` | Always `het-imports`. |
| `exportingComponentElement` | Ancestor element that declared the export. |
| `exportingComponentName` | Value of the ancestor's `het-component` attribute, if present. |
| `importLocalSignalName` | Local signal name requested by the importing component. |
| `importSourceSignalName` | Exported signal name HET looked for on the ancestor. |

### `HET Error: Imported signal conflicts with local initialization`

The component tried to initialize a signal locally even though the same local name was already imported or forwarded.

```html
<div het-component="child" het-imports="count">
  <span het-text="count"></span>
</div>

<script>
  HET.registerComponent('child', ({ signals }) => {
    signals.count = HET.signals.signal(0);
  });
</script>
```

Fix the component by choosing one owner for the signal. Imported or forwarded signals should not be reinitialized locally.

```js
HET.registerComponent('child', () => ({}));
```

Cause fields:

| `cause` property | Meaning |
| --- | --- |
| `componentName` | Value of the owning `het-component` attribute, if present. |
| `componentElement` | Component root element that was mounting. |
| `bindingAttribute` | Binding attribute that tried to initialize the imported or forwarded signal. |
| `bindingDeclaration` | Raw binding declaration that tried to initialize the signal. |
| `bindingElement` | Element containing that binding declaration. |
| `signalName` | Signal name with conflicting imported or forwarded ownership. |

## Structural Templates

### `HET Error: Structural template requires exactly one directive`

A structural `<template>` used both `het-for` and `het-if`, or neither.

```html
<template het-for="items" het-if="selected">
  <div het-component="item"></div>
</template>
```

Fix the template by using exactly one structural directive per template.

```html
<template het-for="items">
  <div het-component="item"></div>
</template>
```

Cause fields:

| `cause` property | Meaning |
| --- | --- |
| `componentName` | Value of the owning `het-component` attribute, if present. |
| `componentElement` | Component root element that owns the template. |
| `bindingElement` | `<template>` element that failed structural validation. |

### `HET Error: Structural template must contain exactly one root element`

The template content had more than one root element, or contained non-whitespace text outside the single root.

```html
<template het-for="items">
  <div het-component="item"></div>
  <div het-component="item"></div>
</template>
```

Fix the template so it renders exactly one root element.

```html
<template het-for="items">
  <div het-component="item"></div>
</template>
```

Cause fields:

| `cause` property | Meaning |
| --- | --- |
| `componentName` | Value of the owning `het-component` attribute, if present. |
| `componentElement` | Component root element that owns the template. |
| `bindingElement` | `<template>` element that failed structural validation. |

### `HET Error: Structural template root must be a component`

The single root element inside a structural template did not have `het-component`.

```html
<template het-for="items">
  <div>
    <span>Not a component root</span>
  </div>
</template>
```

Fix the template by making the root a component.

```html
<template het-for="items">
  <div het-component="item"></div>
</template>
```

Cause fields:

| `cause` property | Meaning |
| --- | --- |
| `componentName` | Value of the owning `het-component` attribute, if present. |
| `componentElement` | Component root element that owns the template. |
| `bindingElement` | `<template>` element that failed structural validation. |
| `structuralRootElement` | Single root element found inside the template before HET rejected it. |

### `HET Error: Structural template root component is not registered`

The template root named a component that HET does not know how to mount.

```html
<template het-for="items">
  <div het-component="todo-item"></div>
</template>
```

Fix the code by registering the template root component before `init()`.

```js
HET.registerComponent('todo-item', () => ({}));
```

Cause fields:

| `cause` property | Meaning |
| --- | --- |
| `componentName` | Value of the owning `het-component` attribute, if present. |
| `componentElement` | Component root element that owns the template. |
| `bindingAttribute` | Structural directive being evaluated, such as `het-for` or `het-if`. |
| `bindingDeclaration` | Raw structural binding declaration. |
| `bindingElement` | `<template>` element that produced the clone. |
| `structuralRootElement` | Cloned root element HET tried to mount. |
| `structuralRootComponentName` | `het-component` name on that cloned root, if present. |

### `HET Error: het-for source must be an array`

`het-for` expects a signal whose value is an array.

```html
<section het-component="list">
  <template het-for="items">
    <div het-component="list-item"></div>
  </template>
</section>

<script>
  HET.registerComponent('list', ({ signals }) => {
    signals.items = HET.signals.signal({ label: 'Alpha' });
  });
</script>
```

Fix the code by storing an array in the source signal.

```js
signals.items = HET.signals.signal([]);
```

Cause fields:

| `cause` property | Meaning |
| --- | --- |
| `componentName` | Value of the owning `het-component` attribute, if present. |
| `componentElement` | Component root element that owns the structural binding. |
| `bindingAttribute` | Structural directive being evaluated. |
| `bindingDeclaration` | Raw structural binding declaration. |
| `bindingElement` | `<template>` element that produced the failure. |
| `signalName` | Source signal name that evaluated to a non-array value. |

### `HET Error: het-for item must be an object`

Each `het-for` array item must be an object whose properties are forwarded signals.

```html
<section het-component="list">
  <template het-for="items">
    <div het-component="list-item"></div>
  </template>
</section>

<script>
  HET.registerComponent('list', ({ signals }) => {
    signals.items = HET.signals.signal(['Alpha']);
  });
</script>
```

Fix the code by storing objects in the array.

```js
signals.items = HET.signals.signal([
  { label: HET.signals.signal('Alpha') },
]);
```

Cause fields:

| `cause` property | Meaning |
| --- | --- |
| `componentName` | Value of the owning `het-component` attribute, if present. |
| `componentElement` | Component root element that owns the structural binding. |
| `bindingAttribute` | Structural directive being evaluated. |
| `bindingDeclaration` | Raw structural binding declaration. |
| `bindingElement` | `<template>` element that produced the failure. |
| `signalName` | Source signal name whose item value was not an object. |

### `HET Error: het-if item must be an object`

When a `het-if` source is truthy, its value must be an object whose properties are forwarded signals.

```html
<section het-component="detail">
  <template het-if="selected">
    <article het-component="detail-card"></article>
  </template>
</section>

<script>
  HET.registerComponent('detail', ({ signals }) => {
    signals.selected = HET.signals.signal(true);
  });
</script>
```

Fix the code by storing either a falsy value or an object of signals.

```js
signals.selected = HET.signals.signal({
  label: HET.signals.signal('Primary'),
});
```

Cause fields:

| `cause` property | Meaning |
| --- | --- |
| `componentName` | Value of the owning `het-component` attribute, if present. |
| `componentElement` | Component root element that owns the structural binding. |
| `bindingAttribute` | Structural directive being evaluated. |
| `bindingDeclaration` | Raw structural binding declaration. |
| `bindingElement` | `<template>` element that produced the failure. |
| `signalName` | Source signal name whose truthy value was not an object. |

### `HET Error: Structural item property must be a signal`

Forwarded properties inside a structural item must already be signal objects.

```html
<section het-component="list">
  <template het-for="items">
    <div het-component="list-item">
      <span het-text="label"></span>
    </div>
  </template>
</section>

<script>
  HET.registerComponent('list', ({ signals }) => {
    signals.items = HET.signals.signal([{ label: 'plain-text' }]);
  });
</script>
```

Fix the code by wrapping each forwarded property in a signal before placing it in the item object.

```js
signals.items = HET.signals.signal([
  { label: HET.signals.signal('plain-text') },
]);
```

Cause fields:

| `cause` property | Meaning |
| --- | --- |
| `componentName` | Value of the owning `het-component` attribute, if present. |
| `componentElement` | Component root element involved in the structural mount. |
| `signalName` | Forwarded property name that was not a signal. |
| `bindingAttribute` | Structural directive being evaluated, when the failure came from a structural binding. |
| `bindingDeclaration` | Raw structural binding declaration, when the failure came from a structural binding. |
| `bindingElement` | `<template>` element that produced the failure, when available. |

### `HET Error: Structural clone signal shape changed`

An existing structural clone was reused, but the forwarded signal keys changed between renders.

```html
<section het-component="list">
  <template het-for="items">
    <div het-component="list-item">
      <span het-text="label"></span>
    </div>
  </template>
</section>

<script>
  HET.registerComponent('list', ({ signals }) => {
    signals.items = HET.signals.signal([
      { label: HET.signals.signal('Alpha') },
    ]);

    return {
      swapShape() {
        signals.items.value = [
          { title: HET.signals.signal('Bravo') },
        ];
      },
    };
  });
</script>
```

Fix the code by keeping the forwarded property names stable for reused clones, or destroy and recreate the surrounding structure instead of changing the shape in place.

```js
signals.items.value = [
  { label: HET.signals.signal('Bravo') },
];
```

Cause fields:

| `cause` property | Meaning |
| --- | --- |
| `componentName` | Value of the owning `het-component` attribute, if present. |
| `componentElement` | Component root element that owns the structural binding. |
| `bindingAttribute` | Structural directive being evaluated. |
| `bindingDeclaration` | Raw structural binding declaration. |
| `bindingElement` | `<template>` element that produced the reused clone. |
| `signalName` | Source signal name whose forwarded property set changed shape. |

### `HET Error: Structural clone is missing forwarded signal wrapper`

HET expected an internal forwarded-signal wrapper on a reused structural clone, but it was replaced or corrupted. This should not happen in normal usage.

```html
<section het-component="list">
  <template het-for="items">
    <div id="row" het-component="list-item"></div>
  </template>
</section>

<script>
  HET.registerComponent('list', ({ signals }) => {
    signals.items = HET.signals.signal([
      { label: HET.signals.signal('Alpha') },
    ]);

    return {
      breakClone() {
        document.getElementById('row').__het_instance.rawSignals.label = null;
        signals.items.value = [
          { label: HET.signals.signal('Bravo') },
        ];
      },
    };
  });
</script>
```

Fix the code by not mutating HET internals. If you see this without tampering, treat it as a bug report candidate.

Cause fields:

| `cause` property | Meaning |
| --- | --- |
| `componentName` | Value of the owning `het-component` attribute, if present. |
| `componentElement` | Component root element that owns the structural binding. |
| `bindingAttribute` | Structural directive being evaluated. |
| `bindingDeclaration` | Raw structural binding declaration. |
| `bindingElement` | `<template>` element that produced the reused clone. |
| `signalName` | Forwarded signal name whose internal wrapper was missing. |

## Request Eligibility

### `HET Error: Cross-origin links cannot be progressively enhanced`

A link with `het-target` pointed to a different origin.

```html
<main het-pane="main">
  <a href="https://example.com" het-target="main">External</a>
</main>
```

Fix the link by using same-origin URLs for HET navigation, or remove `het-target` so the browser handles the navigation normally.

```html
<a href="https://example.com">External</a>
```

Cause fields:

| `cause` property | Applies when | Meaning |
| --- | --- | --- |
| `linkElement` | Always | Link element that initiated the request. |
| `linkUrl` | Always | Fully resolved link URL. |
| `linkTargetName` | Always | Pane name from the link `het-target`. |
| `resolvedTargetName` | Always | Final pane name selected from the link. |

### `HET Error: Links with a target attribute cannot be progressively enhanced`

A link used both `het-target` and the native `target` attribute.

```html
<main het-pane="main">
  <a href="/reports" target="_blank" het-target="main">Reports</a>
</main>
```

Fix the link by choosing one behavior: either HET replacement or native target-window navigation.

```html
<a href="/reports" het-target="main">Reports</a>
```

Cause fields:

| `cause` property | Applies when | Meaning |
| --- | --- | --- |
| `linkElement` | Always | Link element that initiated the request. |
| `linkUrl` | Always | Fully resolved link URL. |
| `linkTargetName` | Always | Pane name from the link `het-target`. |
| `resolvedTargetName` | Always | Final pane name selected from the link. |

### `HET Error: Cross-origin form submissions cannot be progressively enhanced`

A form or submitter resolved to a different-origin action URL.

```html
<main het-pane="main">
  <form action="https://example.com/submit" het-target="main">
    <button type="submit">Send</button>
  </form>
</main>
```

Fix the form by using a same-origin action for HET submissions, or remove `het-target` and let the browser submit the form normally.

```html
<form action="/submit" het-target="main">
  <button type="submit">Send</button>
</form>
```

Cause fields:

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

## Target Panes

### `HET Error: Target pane not found on the page`

The request resolved a target pane name, but the current document did not contain exactly one matching `het-pane`.

```html
<main het-pane="main">
  <a href="/reports" het-target="missing">Reports</a>
</main>
```

Fix the code by targeting a pane name that exists in the current document.

```html
<a href="/reports" het-target="main">Reports</a>
```

Cause fields:

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
| `targetLookupName` | Always | Pane name HET looked up in the current document. |
| `resolvedTargetName` | Always | Final pane name HET expected on the page. |

### `HET Error: Multiple target panes found on the page`

The current document contained more than one pane with the resolved target name.

```html
<main het-pane="main"></main>
<aside het-pane="main"></aside>
<a href="/reports" het-target="main">Reports</a>
```

Fix the page so each target pane name is unique within the current document.

```html
<main het-pane="main"></main>
<aside het-pane="sidebar"></aside>
```

Cause fields:

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
| `targetLookupName` | Always | Pane name HET looked up in the current document. |
| `resolvedTargetName` | Always | Final pane name HET expected on the page. |
| `targetPaneElements` | Always | Array of matching pane elements found on the page. |

### `HET Error: Target pane not found in server response`

The current page had the target pane, but the HTML response did not contain a matching `het-pane`.

```html
<!-- current page -->
<main het-pane="main">
  <a href="/reports" het-target="main">Reports</a>
</main>

<!-- server response -->
<main het-pane="other">Wrong pane</main>
```

Fix the server response so it includes exactly one pane with the requested name.

```html
<main het-pane="main">Reports</main>
```

Cause fields:

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

### `HET Error: Multiple target panes found in server response`

The server response included more than one pane with the resolved target name.

```html
<!-- server response -->
<main het-pane="main"></main>
<section het-pane="main"></section>
```

Fix the response so it contains only one matching pane.

```html
<main het-pane="main"></main>
```

Cause fields:

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

## `het-select`

### `HET Error: Select directive must list at least one id`

`het-select` or `X-HET-Select-Override` was present but empty or whitespace-only.

```html
<main het-pane="main">
  <a href="/reports" het-target="main" het-select="">Reports</a>
</main>
```

Fix the declaration by listing one or more element ids.

```html
<a href="/reports" het-target="main" het-select="summary">Reports</a>
```

Cause fields:

| `cause` property | Applies when | Meaning |
| --- | --- | --- |
| `linkElement` | Link navigation | Link element that initiated the request. |
| `formElement` | Form submission | Form element that initiated the request. |
| `linkUrl` | Link navigation | Link URL. |
| `linkTargetName` | Link navigation | Pane name from the link `het-target`. |
| `submitterElement` | Form submission | Form control used for the submission, if available. |
| `resolvedTargetName` | Always | Final pane name selected from the initiator. |
| `requestDirectiveAttribute` | Always | Attribute or override header that supplied the directive value. |
| `requestDirectiveDeclaration` | Always | Raw whitespace-only directive value that triggered the error. |

### `HET Error: Selected element not found in the target pane on the page`

One of the ids named in `het-select` did not exist inside the current target pane.

```html
<main het-pane="main">
  <a href="/reports" het-target="main" het-select="summary">Reports</a>
</main>
```

Fix the page by selecting an id that already exists inside the current target pane.

```html
<main het-pane="main">
  <div id="summary"></div>
  <a href="/reports" het-target="main" het-select="summary">Reports</a>
</main>
```

Cause fields:

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
| `requestDirectiveAttribute` | Always | `het-select`, or an empty string when ids came from another source. |
| `responseSelectHeader` | Response included `X-HET-Select-Override` | Value of `X-HET-Select-Override`. |
| `selectId` | Always | Missing id from the select list. |

### `HET Error: Selected element not found in the target pane in the server response`

The selected id existed in the current pane, but not in the matching pane returned by the server.

```html
<!-- current page -->
<main het-pane="main">
  <div id="summary"></div>
  <a href="/reports" het-target="main" het-select="summary">Reports</a>
</main>

<!-- server response -->
<main het-pane="main">
  <div id="other"></div>
</main>
```

Fix the response so the selected id exists in the returned target pane.

```html
<main het-pane="main">
  <div id="summary"></div>
</main>
```

Cause fields:

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
| `requestDirectiveAttribute` | Always | `het-select`, or an empty string when ids came from another source. |
| `responseSelectHeader` | Response included `X-HET-Select-Override` | Value of `X-HET-Select-Override`. |
| `selectId` | Always | Missing id from the select list. |
| `currentElement` | Always | Current-page element found for `selectId`. |

## `het-also`

### `HET Error: Also directive must list at least one id`

`het-also` or `X-HET-Also-Override` was present but empty or whitespace-only.

```html
<main het-pane="main">
  <a href="/reports" het-target="main" het-also="">Reports</a>
</main>
```

Fix the declaration by listing one or more ids outside the target pane.

```html
<a href="/reports" het-target="main" het-also="sidebar">Reports</a>
```

Cause fields:

| `cause` property | Applies when | Meaning |
| --- | --- | --- |
| `linkElement` | Link navigation | Link element that initiated the request. |
| `formElement` | Form submission | Form element that initiated the request. |
| `linkUrl` | Link navigation | Link URL. |
| `linkTargetName` | Link navigation | Pane name from the link `het-target`. |
| `submitterElement` | Form submission | Form control used for the submission, if available. |
| `resolvedTargetName` | Always | Final pane name selected from the initiator. |
| `requestDirectiveAttribute` | Always | Attribute or override header that supplied the directive value. |
| `requestDirectiveDeclaration` | Always | Raw whitespace-only directive value that triggered the error. |

### `HET Error: het-also element not found on the page`

One of the ids named in `het-also` did not exist in the current document.

```html
<main het-pane="main">
  <a href="/reports" het-target="main" het-also="sidebar">Reports</a>
</main>
```

Fix the page by ensuring the named element exists before the request runs.

```html
<aside id="sidebar"></aside>
```

Cause fields:

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
| `requestDirectiveAttribute` | Always | `het-also`, or an empty string when ids came from another source. |
| `responseAlsoHeader` | Response included `X-HET-Also-Override` | Value of `X-HET-Also-Override`. |
| `alsoId` | Always | Missing id from the also list. |

### `HET Error: het-also element found inside the target pane on the page`

`het-also` named an element that already lives inside the target pane. HET rejects this because the target pane replacement already owns that subtree.

```html
<main het-pane="main">
  <aside id="sidebar"></aside>
  <a href="/reports" het-target="main" het-also="sidebar">Reports</a>
</main>
```

Fix the page by moving the extra replacement target outside the pane being swapped.

```html
<main het-pane="main">
  <a href="/reports" het-target="main" het-also="sidebar">Reports</a>
</main>
<aside id="sidebar"></aside>
```

Cause fields:

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
| `requestDirectiveAttribute` | Always | `het-also`, or an empty string when ids came from another source. |
| `responseAlsoHeader` | Response included `X-HET-Also-Override` | Value of `X-HET-Also-Override`. |
| `alsoId` | Always | Id from the also list. |
| `currentElement` | Always | Current-page element found for `alsoId`. |

### `HET Error: het-also element not found in the server response`

The current document contained the `het-also` element, but the server response did not contain a matching replacement element.

```html
<!-- current page -->
<aside id="sidebar"></aside>

<!-- server response -->
<main het-pane="main"></main>
```

Fix the response by returning the extra replacement element with the same id.

```html
<main het-pane="main"></main>
<aside id="sidebar"></aside>
```

Cause fields:

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
| `requestDirectiveAttribute` | Always | `het-also`, or an empty string when ids came from another source. |
| `responseAlsoHeader` | Response included `X-HET-Also-Override` | Value of `X-HET-Also-Override`. |
| `alsoId` | Always | Id from the also list. |
| `currentElement` | Always | Current-page element found for `alsoId`. |

### `HET Error: het-also element found inside the target pane in the server response`

The response contained the `het-also` id, but nested it inside the target pane instead of returning it as a separate replacement.

```html
<!-- server response -->
<main het-pane="main">
  <aside id="sidebar"></aside>
</main>
```

Fix the response by returning the `het-also` element outside the target pane.

```html
<main het-pane="main"></main>
<aside id="sidebar"></aside>
```

Cause fields:

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
| `requestDirectiveAttribute` | Always | `het-also`, or an empty string when ids came from another source. |
| `responseAlsoHeader` | Response included `X-HET-Also-Override` | Value of `X-HET-Also-Override`. |
| `alsoId` | Always | Id from the also list. |
| `currentElement` | Always | Current-page element found for `alsoId`. |
