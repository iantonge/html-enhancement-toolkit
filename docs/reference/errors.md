# Error Reference

HET-created errors use the `HET Error:` prefix.
Most runtime errors are delivered to `init({ onError })`; `registerComponent()` validation errors are thrown directly.

Each section below covers one exact error message with:

- what it means
- a minimal example that triggers it
- how to fix the example

`error.cause` varies by error family. The sections below document the structured fields that current HET code attaches.

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

### `HET Error: Component is not registered`

A named `het-component` root was found during mounting, but no component had been registered with that name.

```html
<div het-component="counter"></div>
```

```js
HET.registerComponent('countre', () => ({}));
```

Fix the component by registering the matching name before `init()` runs.

```html
<div het-component="counter"></div>
```

```js
HET.registerComponent('counter', () => ({}));
```

If no setup function is needed, remove the attribute value to make the root anonymous.

```html
<div het-component></div>
```

Cause fields:

| `cause` property | Meaning |
| --- | --- |
| `componentName` | Value of the `het-component` attribute. |
| `componentElement` | Component root element that could not mount. |

### `HET Error: Component ref is not defined`

A component setup function tried to read a property from `refs` that does not match any `het-ref` in that component scope. This usually means the JavaScript ref name is misspelled or the expected element is missing from the component HTML.

```html
<div het-component="profileForm">
  <input het-ref="emailInput" type="email">
</div>
```

```js
HET.registerComponent('profileForm', ({ refs }) => {
  refs.emaliInput.focus();
});
```

Fix the code by using the same ref name in HTML and JavaScript.

```js
HET.registerComponent('profileForm', ({ refs }) => {
  refs.emailInput.focus();
});
```

If the ref is optional, check whether the key exists before reading it.

```js
HET.registerComponent('profileForm', ({ refs }) => {
  if ('emailInput' in refs) {
    refs.emailInput.focus();
  }
});
```

Cause fields:

| `cause` property | Meaning |
| --- | --- |
| `componentName` | Value of the `het-component` attribute. |
| `componentElement` | Component root element whose setup function accessed the missing ref. |
| `refName` | Missing ref property that was accessed. |
| `availableRefs` | Ref names collected for the component scope. |

## Binding Syntax

### `HET Error: Binding declaration must contain exactly one "="`

A binding such as `het-props`, `het-attrs`, `het-bool-attrs`, or `het-class` did not contain exactly one top-level `=` between its target and expression.

```html
<div het-component>
  <span het-props="textContent"></span>
</div>
```

Fix the declaration so it has one target and one expression.

```html
<span het-props="textContent=count"></span>
```

### `HET Error: Binding declaration requires a target and source`

A binding used `=` but left the target or expression empty.

```html
<div het-component>
  <span het-props="textContent="></span>
</div>
```

Fix the declaration by filling in both sides.

```html
<span het-props="textContent=count"></span>
```

### `HET Error: Signal name is required`

A declaration that expects a signal name provided an empty or invalid identifier.

```html
<div het-component>
  <input het-model="$target.value">
</div>
```

Fix the declaration by naming a local, imported, or acquired signal.

```html
<input het-model="count">
```

### `HET Error: het-text binding requires an expression`

`het-text` was present but empty.

```html
<div het-component>
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
<div het-component>
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
<div het-component>
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
<div het-component>
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
<div het-component>
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
<div het-component>
  <input het-on="input->count=">
</div>
```

Fix the binding by filling in both sides.

```html
<input het-on="input->count=$target.value">
```

### `HET Error: Event modifier cannot be empty`

An event modifier list included an empty segment, usually from two adjacent dots.

```html
<div het-component>
  <button het-on="click..prevent->save"></button>
</div>
```

Fix the binding by removing the extra dot or naming a supported modifier.

```html
<button het-on="click.prevent->save"></button>
```

### `HET Error: Event name is required`

An event binding used only modifiers and did not name the event to listen for.

```html
<div het-component>
  <button het-on=".prevent->save"></button>
</div>
```

Fix the binding by putting the DOM event name before any modifiers.

```html
<button het-on="click.prevent->save"></button>
```

### `HET Error: Read binding must contain exactly one "="`

A `het-seed` or `het-sync` declaration did not contain exactly one top-level `=` between the signal name and expression.

```html
<div het-component>
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
<div het-component>
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
<div het-component>
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
<div het-component>
  <div het-class="active=isActive; ; disabled=isDisabled"></div>
</div>
```

Fix the declaration by removing the empty segment.

```html
<div het-class="active=isActive; disabled=isDisabled"></div>
```

### `HET Error: Output binding expression cannot use contextual values`

An output binding such as `het-text`, `het-props`, `het-attrs`, `het-bool-attrs`, or `het-class` used contextual snapshot values like `$target`, `$event`, or `$attrs`. `$key` is allowed only inside components cloned by `het-for`.

```html
<div het-component>
  <p het-text="$target.value"></p>
</div>
```

Fix the binding by reading from the DOM in `het-seed`, `het-sync`, or an event-time `het-on` assignment first.

```html
<input het-seed="message=$props.value">
<p het-text="message"></p>
```

### `HET Error: $key is only available inside het-for`

An output binding used `$key` outside a component cloned by `het-for`.

```html
<section het-component>
  <p het-text="$key"></p>
</section>
```

Fix the binding by using `$key` only inside a keyed `het-for` clone, or by using an ordinary signal.

```html
<template het-for="items:id">
  <article het-component="item" het-attrs="id=$key + '-section'"></article>
</template>
```

### `HET Error: Invalid event modifier`

An event modifier name or modifier combination was not supported. For example, timing modifiers require a positive integer duration.

```html
<div het-component>
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
| `componentName` | Value of the owning `het-component` attribute, if present. |
| `componentElement` | Component root element that was mounting. |
| `bindingAttribute` | Binding attribute being parsed. |
| `bindingDeclaration` | Raw binding declaration that failed. |
| `bindingElement` | Element containing the binding declaration. |
| `bindingErrorReason` | Exact parser reason used to build this error message, when present. |
| `eventModifier` | Invalid or conflicting event modifier, when relevant. |

## Methods, Signals, and Lifecycle

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

```js
HET.registerComponent('counter', ({ signals }) => ({
  increment() {
    signals.count.value += 1;
  },
}));
```

### `HET Error: Bound signal does not exist`

A binding referenced a signal that was never created, imported, or acquired.

```html
<div het-component>
  <p het-text="count"></p>
</div>
```

Fix the component by creating, importing, or acquiring the signal before the binding needs it.

```html
<div het-component>
  <p het-seed="count=$int($text)" het-text="count">0</p>
</div>
```

### `HET Error: Duplicate signal initialization`

Two acquisition bindings tried to create the same local signal.

```html
<div het-component>
  <span het-seed="count=$int($text)">1</span>
  <span het-seed="count=$int($text)">2</span>
</div>
```

Fix the component by choosing one acquisition source for the signal.

```html
<div het-component>
  <span het-seed="count=$int($text)">1</span>
  <span het-text="count"></span>
</div>
```

### `HET Error: Signal override after initialization`

`setup` tried to assign the same signal name twice.

```js
HET.registerComponent('counter', ({ signals }) => {
  signals.count = HET.signals.signal(1);
  signals.count = HET.signals.signal(2);
});
```

Fix the component by initializing each owned signal only once. Mutate `.value` when the signal's value should change.

```js
HET.registerComponent('counter', ({ signals }) => {
  signals.count = HET.signals.signal(1);
  signals.count.value = 2;
});
```

### `HET Error: Component signal is not defined`

A component setup function or returned method tried to read a property from `signals` that has not been initialized, acquired, imported, or forwarded. This usually means the JavaScript signal name is misspelled or the expected signal declaration is missing.

```js
HET.registerComponent('counter', ({ signals }) => {
  signals.count = HET.signals.signal(1);
  signals.cuont.value += 1;
});
```

Fix the code by using the same signal name everywhere.

```js
HET.registerComponent('counter', ({ signals }) => {
  signals.count = HET.signals.signal(1);
  signals.count.value += 1;
});
```

If the signal is optional, check whether the key exists before reading it.

```js
HET.registerComponent('counter', ({ signals }) => {
  if ('count' in signals) {
    signals.count.value += 1;
  }
});
```

Cause fields:

| `cause` property | Meaning |
| --- | --- |
| `componentName` | Value of the `het-component` attribute. |
| `componentElement` | Component root element whose setup function or method accessed the missing signal. |
| `signalName` | Missing signal property that was accessed. |
| `availableSignals` | Signal names initialized, acquired, imported, or forwarded for the component. |

### `HET Error: Signal initialized with a non-signal value`

`setup` assigned a plain value to `signals.<name>` instead of a Preact signal object.

```js
HET.registerComponent('counter', ({ signals }) => {
  signals.count = 1;
});
```

Fix the component by assigning a real signal.

```js
HET.registerComponent('counter', ({ signals }) => {
  signals.count = HET.signals.signal(1);
});
```

### `HET Error: Cleanup callback must be a function`

`onCleanup()` was called with a non-function value.

```js
HET.registerComponent('clock', ({ onCleanup }) => {
  const timer = setInterval(tick, 1000);
  onCleanup(timer);
});
```

Fix the component by passing a callback that performs the cleanup work.

```js
HET.registerComponent('clock', ({ onCleanup }) => {
  const timer = setInterval(tick, 1000);
  onCleanup(() => clearInterval(timer));
});
```

### `HET Error: onError must be a function`

`init()` received an `onError` option that was present but was not a function.

```js
HET.init({ onError: 'log-errors' });
```

Fix the configuration by passing a function, or omit `onError` to use HET's default logging.

```js
HET.init({
  onError(error) {
    console.error(error, error.cause);
  },
});
```

Cause fields for method, signal, and lifecycle errors:

| `cause` property | Meaning |
| --- | --- |
| `componentName` | Value of the owning `het-component` attribute, if present. |
| `componentElement` | Component root element that was mounting or running. |
| `bindingAttribute` | Binding attribute that referenced the missing method or signal, when relevant. |
| `bindingDeclaration` | Raw binding declaration that referenced the missing method or signal, when relevant. |
| `bindingElement` | Element containing the binding declaration, when relevant. |
| `signalName` | Signal name involved in the failure, when relevant. |
| `existingBindingAttribute` | Earlier acquisition attribute for duplicate initialization errors. |
| `existingBindingDeclaration` | Earlier acquisition declaration for duplicate initialization errors. |
| `existingBindingElement` | Earlier acquisition element for duplicate initialization errors. |

`HET Error: onError must be a function` does not include a structured `cause`.

## Imports and Exports

### `HET Error: Invalid import declaration`

`het-imports` used a malformed declaration. Each declaration must be either `localName` or `localName=sourceName`.

```html
<div het-component het-imports="child=query=extra"></div>
```

Fix the declaration by using one local name and, optionally, one source name.

```html
<div het-component het-imports="child=query"></div>
```

### `HET Error: Imported signal has no exporting ancestor`

`het-imports` requested a signal that no ancestor component currently exports.

```html
<div het-component="child" het-imports="count">
  <output het-text="count"></output>
</div>
```

Fix the component tree by exporting the signal from an ancestor, or by removing the import.

```html
<div het-component="parent" het-exports="count">
  <div het-component="child" het-imports="count">
    <output het-text="count"></output>
  </div>
</div>
```

### `HET Error: Exporting ancestor component is not mounted`

An import resolved to an ancestor component element, but that exporting component was not mounted when the child tried to import from it. This commonly happens when the ancestor has a named `het-component` that was not registered, while the child was registered.

```html
<div het-component="parent" het-exports="count">
  <div het-component="child" het-imports="count"></div>
</div>

<script>
  HET.registerComponent('child');
</script>
```

Fix the component tree by registering and mounting the exporting ancestor normally.

```js
HET.registerComponent('parent', ({ signals }) => {
  signals.count = HET.signals.signal(0);
});
HET.registerComponent('child');
```

### `HET Error: Exporting ancestor does not provide imported signal`

An ancestor exported the requested name, but the signal itself was not available on the exporting component.

```html
<div het-component="parent" het-exports="count">
  <div het-component="child" het-imports="count"></div>
</div>

<script>
  HET.registerComponent('parent');
  HET.registerComponent('child');
</script>
```

Fix the exporting component by creating or acquiring the exported signal.

```js
HET.registerComponent('parent', ({ signals }) => {
  signals.count = HET.signals.signal(0);
});
HET.registerComponent('child');
```

### `HET Error: Imported signal conflicts with local initialization`

A component tried to import a signal name and also initialize that same local name with `het-seed`, `het-sync`, `het-model`, or forwarded structural signals.

```html
<div het-component="parent" het-exports="count">
  <div het-component="child" het-imports="count">
    <output het-seed="count=$int($text)" het-text="count">0</output>
  </div>
</div>
```

Fix the component by choosing either imported ownership or local acquisition, not both.

```html
<div het-component="parent" het-exports="count">
  <div het-component="child" het-imports="count">
    <output het-text="count"></output>
  </div>
</div>
```

Cause fields for import and export errors:

| `cause` property | Meaning |
| --- | --- |
| `componentName` | Value of the importing `het-component` attribute, if present. |
| `componentElement` | Importing component root element. |
| `bindingAttribute` | Usually `het-imports`, or the conflicting local acquisition attribute. |
| `bindingDeclaration` | Raw import or conflicting local acquisition declaration. |
| `bindingElement` | Element containing the conflicting local acquisition declaration, when relevant. |
| `importLocalSignalName` | Local signal name requested by `het-imports`. |
| `importSourceSignalName` | Ancestor signal name requested by `het-imports`. |
| `exportingComponentName` | Value of the exporting ancestor's `het-component` attribute, if present. |
| `exportingComponentElement` | Ancestor component element that matched `het-exports`. |
| `signalName` | Signal name involved in a local/import conflict. |

## Structural Templates

### `HET Error: Structural template requires exactly one directive`

A `<template>` used neither `het-if` nor `het-for`, or used both at once.

```html
<div het-component>
  <template het-if="selected" het-for="items">
    <article het-component="item"></article>
  </template>
</div>
```

Fix the template by using exactly one structural directive.

```html
<template het-if="selected">
  <article het-component="item"></article>
</template>
```

### `HET Error: Structural template must contain exactly one root element`

A structural template contained extra roots or unsupported free text content.

```html
<div het-component>
  <template het-if="selected">
    <article het-component="item"></article>
    <footer het-component="item-footer"></footer>
  </template>
</div>
```

Fix the template by keeping exactly one element root inside the template.

```html
<template het-if="selected">
  <article het-component="item"></article>
</template>
```

### `HET Error: Structural template root must be a component`

The single root element inside a structural template did not have `het-component`.

```html
<div het-component>
  <template het-if="selected">
    <article></article>
  </template>
</div>
```

Fix the template by making the cloned root a component root.

```html
<template het-if="selected">
  <article het-component="item"></article>
</template>
```

### `HET Error: Structural template root component is not registered`

The structural template root named a component that was not registered.

```html
<div het-component="list">
  <template het-for="items:id">
    <li het-component="list-item"></li>
  </template>
</div>

<script>
  HET.registerComponent('list', ({ signals }) => {
    signals.items = HET.signals.signal([{ id: 'one', label: HET.signals.signal('One') }]);
  });
</script>
```

Fix the template by registering the cloned component, or make it anonymous if no setup function is needed.

```js
HET.registerComponent('list-item');
```

### `HET Error: het-for source must be an array`

`het-for` resolved to a non-array value.

```js
HET.registerComponent('list', ({ signals }) => {
  signals.items = HET.signals.signal({ id: 'one', label: HET.signals.signal('One') });
});
```

Fix the source signal so its value is always an array.

```js
HET.registerComponent('list', ({ signals }) => {
  signals.items = HET.signals.signal([
    { id: 'one', label: HET.signals.signal('One') },
  ]);
});
```

### `HET Error: het-for requires a key`

`het-for` did not include both the array signal name and key property.

```html
<template het-for="items">
  <article het-component="item"></article>
</template>
```

Fix the declaration by using `signalName:keyProperty`.

```html
<template het-for="items:id">
  <article het-component="item"></article>
</template>
```

### `HET Error: het-for key is missing`

One `het-for` item did not contain the configured key property.

```js
signals.items = HET.signals.signal([
  { label: HET.signals.signal('One') },
]);
```

Fix each item by adding the static key property.

```js
signals.items = HET.signals.signal([
  { id: 'one', label: HET.signals.signal('One') },
]);
```

### `HET Error: het-for key must be a string or number`

One `het-for` item used an unsupported key value.

```js
signals.items = HET.signals.signal([
  { id: { value: 'one' }, label: HET.signals.signal('One') },
]);
```

Fix the item by using a stable string or number key.

```js
signals.items = HET.signals.signal([
  { id: 'one', label: HET.signals.signal('One') },
]);
```

### `HET Error: het-for keys must be unique`

Two items in the same `het-for` array used the same key.

```js
signals.items = HET.signals.signal([
  { id: 'one', label: HET.signals.signal('One') },
  { id: 'one', label: HET.signals.signal('Duplicate') },
]);
```

Fix the data so keys are unique among siblings.

### `HET Error: het-for item must be an object`

One `het-for` item was not an object.

```js
HET.registerComponent('list', ({ signals }) => {
  signals.items = HET.signals.signal(['One']);
});
```

Fix each array item so it is an object whose properties are signals to forward into the cloned component.

```js
HET.registerComponent('list', ({ signals }) => {
  signals.items = HET.signals.signal([
    { id: 'one', label: HET.signals.signal('One') },
  ]);
});
```

### `HET Error: het-if item must be an object`

`het-if` received a truthy non-object value where forwarded signal objects are required.

```js
HET.registerComponent('details', ({ signals }) => {
  signals.selected = HET.signals.signal(true);
});
```

Fix the source so a truthy value is an object whose properties are signals. Use a falsy value to render nothing.

```js
HET.registerComponent('details', ({ signals }) => {
  signals.selected = HET.signals.signal({
    label: HET.signals.signal('Selected'),
  });
});
```

### `HET Error: Structural item property must be a signal`

A forwarded structural item property was not a Preact signal.

```js
HET.registerComponent('list', ({ signals }) => {
  signals.items = HET.signals.signal([{ label: 'One' }]);
});
```

Fix every forwarded property by wrapping it in a signal.

```js
HET.registerComponent('list', ({ signals }) => {
  signals.items = HET.signals.signal([
    { label: HET.signals.signal('One') },
  ]);
});
```

### `HET Error: Structural clone signal shape changed`

An existing structural clone received a forwarded signal object with a different property shape from the original clone.

```js
HET.registerComponent('list', ({ signals }) => {
  signals.items = HET.signals.signal([
    { label: HET.signals.signal('One') },
  ]);

  return {
    changeShape() {
      signals.items.value = [
        {
          label: HET.signals.signal('Two'),
          extra: HET.signals.signal('Extra'),
        },
      ];
    },
  };
});
```

Fix the structural source by keeping the same forwarded property names for each reused position.

```js
HET.registerComponent('list', ({ signals }) => {
  signals.items = HET.signals.signal([
    {
      label: HET.signals.signal('One'),
      extra: HET.signals.signal(''),
    },
  ]);

  return {
    changeShape() {
      signals.items.value = [
        {
          label: HET.signals.signal('Two'),
          extra: HET.signals.signal('Extra'),
        },
      ];
    },
  };
});
```

Cause fields for structural-template errors:

| `cause` property | Meaning |
| --- | --- |
| `componentName` | Value of the component containing the structural template, if present. |
| `componentElement` | Component root element containing the structural template. |
| `bindingAttribute` | `het-if` or `het-for`, when parsing got far enough to identify it. |
| `bindingDeclaration` | Raw structural directive value, when available. |
| `bindingElement` | `<template>` element containing the structural directive. |
| `signalName` | Source or forwarded signal name involved in the failure, when relevant. |
| `structuralRootElement` | Root element cloned from the template, when relevant. |
| `structuralRootComponentName` | Value of the cloned root's `het-component` attribute, when relevant. |

## Requests

The request-related errors below are delivered to `init({ onError })`. They describe why an enhanced link, form, history navigation, target pane swap, `het-select`, or `het-also` replacement could not proceed.

### Request eligibility

#### `HET Error: Cross-origin links cannot be progressively enhanced`

A link with `het-target` pointed to a different origin. HET only enhances same-origin links.

```html
<a href="https://example.com/account" het-target="main">Account</a>
<main het-pane="main"></main>
```

Fix the link by using a same-origin URL, or remove `het-target` so the browser performs normal navigation.

```html
<a href="/account" het-target="main">Account</a>
<main het-pane="main"></main>
```

Cause fields:

| `cause` property | Meaning |
| --- | --- |
| `linkElement` | Enhanced link that started the request. |
| `linkUrl` | Link `href` resolved by the browser. |
| `linkTargetName` | Raw `het-target` value from the link. |
| `resolvedTargetName` | Target pane name HET would have used if the link were eligible. |

#### `HET Error: Links with a target attribute cannot be progressively enhanced`

A link with `het-target` also had a `target` attribute. HET does not enhance links that ask the browser to navigate a named browsing context or a new tab/window.

```html
<a href="/account" target="_blank" het-target="main">Account</a>
<main het-pane="main"></main>
```

Fix the link by choosing either browser-managed `target` behavior or HET enhancement.

```html
<a href="/account" het-target="main">Account</a>
<main het-pane="main"></main>
```

Cause fields:

| `cause` property | Meaning |
| --- | --- |
| `linkElement` | Enhanced link that started the request. |
| `linkUrl` | Link `href` resolved by the browser. |
| `linkTargetName` | Raw `het-target` value from the link. |
| `resolvedTargetName` | Target pane name HET would have used if the link were eligible. |

#### `HET Error: Cross-origin form submissions cannot be progressively enhanced`

A form or submitter with `het-target` resolved to a cross-origin action URL. HET only enhances same-origin form submissions.

```html
<form action="https://example.com/search" method="get" het-target="main">
  <input name="q">
</form>
<main het-pane="main"></main>
```

Fix the form by posting to a same-origin endpoint, or remove `het-target` for a normal browser submission.

```html
<form action="/search" method="get" het-target="main">
  <input name="q">
</form>
<main het-pane="main"></main>
```

Cause fields:

| `cause` property | Meaning |
| --- | --- |
| `formElement` | Enhanced form that started the request. |
| `submitterElement` | Submit button that submitted the form, when present. |
| `formTargetName` | Raw `het-target` value from the form, when present. |
| `submitterTargetName` | Raw `het-target` value from the submitter override, when present. |
| `resolvedTargetName` | Final target pane name from the form or submitter. |
| `formAction` | Raw form `action` value, or the current page URL fallback. |
| `submitterAction` | Raw submitter `formaction` override, when present. |
| `resolvedActionUrl` | Absolute form submission URL. |
| `formMethod` | Raw or default form method. |
| `submitterMethod` | Submitter `formmethod` override, when present. |
| `resolvedMethod` | Final request method. |
| `formEnctype` | Raw or default form encoding type. |
| `submitterEnctype` | Submitter `formenctype` override, when present. |
| `resolvedEnctype` | Final request encoding type. |

### Target panes

#### `HET Error: Target pane not found on the page`

The requested target pane name did not match exactly one `[het-pane]` in the current document.

```html
<a href="/account" het-target="main">Account</a>
<main het-pane="content"></main>
```

Fix the page by matching the initiator's `het-target` to the pane name.

```html
<a href="/account" het-target="main">Account</a>
<main het-pane="main"></main>
```

Cause fields:

| `cause` property | Meaning |
| --- | --- |
| `targetLookupName` | Pane name HET attempted to find on the current page. |
| `linkElement` | Enhanced link that started the request, for link requests. |
| `linkUrl` | Link `href` resolved by the browser, for link requests. |
| `linkTargetName` | Raw `het-target` value from the link, for link requests. |
| `formElement` | Enhanced form that started the request, for form requests. |
| `submitterElement` | Submit button that submitted the form, for form requests when present. |
| `formTargetName` | Raw `het-target` value from the form, for form requests when present. |
| `submitterTargetName` | Raw `het-target` value from the submitter, for form requests when present. |
| `resolvedTargetName` | Target pane name before a response target override, for link, form, and response-override requests. |
| `formAction` | Raw form `action` value, for form requests. |
| `submitterAction` | Raw submitter `formaction` override, for form requests when present. |
| `resolvedActionUrl` | Absolute form submission URL, for form requests. |
| `formMethod` | Raw or default form method, for form requests. |
| `submitterMethod` | Submitter `formmethod` override, for form requests when present. |
| `resolvedMethod` | Final request method, for form requests. |
| `formEnctype` | Raw or default form encoding type, for form requests. |
| `submitterEnctype` | Submitter `formenctype` override, for form requests when present. |
| `resolvedEnctype` | Final request encoding type, for form requests. |
| `navigationFromUrl` | Previous URL, for history re-fetches. |
| `navigationToUrl` | New URL, for history re-fetches. |
| `navigationTargetName` | Target pane name from history state, for history re-fetches. |
| `requestUrl` | Final fetch URL after `het:beforeFetch`, for response target overrides. |
| `requestMethod` | Final fetch method after `het:beforeFetch`, for response target overrides. |
| `targetPaneElement` | Original current target pane, for response target overrides. |
| `responseTargetHeader` | `X-HET-Target-Override` value, for response target overrides. |

#### `HET Error: Multiple target panes found on the page`

The current document contained more than one pane with the requested `het-pane` value.

```html
<a href="/account" het-target="main">Account</a>
<main het-pane="main"></main>
<aside het-pane="main"></aside>
```

Fix the page so each enhanced target name is unique.

```html
<a href="/account" het-target="main">Account</a>
<main het-pane="main"></main>
<aside het-pane="sidebar"></aside>
```

Cause fields:

| `cause` property | Meaning |
| --- | --- |
| `targetLookupName` | Pane name HET attempted to find on the current page. |
| `targetPaneElements` | Duplicate current page pane elements that matched `targetLookupName`. |
| `linkElement` | Enhanced link that started the request, for link requests. |
| `linkUrl` | Link `href` resolved by the browser, for link requests. |
| `linkTargetName` | Raw `het-target` value from the link, for link requests. |
| `formElement` | Enhanced form that started the request, for form requests. |
| `submitterElement` | Submit button that submitted the form, for form requests when present. |
| `formTargetName` | Raw `het-target` value from the form, for form requests when present. |
| `submitterTargetName` | Raw `het-target` value from the submitter, for form requests when present. |
| `resolvedTargetName` | Target pane name before a response target override, for link, form, and response-override requests. |
| `formAction` | Raw form `action` value, for form requests. |
| `submitterAction` | Raw submitter `formaction` override, for form requests when present. |
| `resolvedActionUrl` | Absolute form submission URL, for form requests. |
| `formMethod` | Raw or default form method, for form requests. |
| `submitterMethod` | Submitter `formmethod` override, for form requests when present. |
| `resolvedMethod` | Final request method, for form requests. |
| `formEnctype` | Raw or default form encoding type, for form requests. |
| `submitterEnctype` | Submitter `formenctype` override, for form requests when present. |
| `resolvedEnctype` | Final request encoding type, for form requests. |
| `navigationFromUrl` | Previous URL, for history re-fetches. |
| `navigationToUrl` | New URL, for history re-fetches. |
| `navigationTargetName` | Target pane name from history state, for history re-fetches. |
| `requestUrl` | Final fetch URL after `het:beforeFetch`, for response target overrides. |
| `requestMethod` | Final fetch method after `het:beforeFetch`, for response target overrides. |
| `targetPaneElement` | Original current target pane, for response target overrides. |
| `responseTargetHeader` | `X-HET-Target-Override` value, for response target overrides. |

#### `HET Error: Target pane not found in server response`

The enhanced request completed, but the response HTML did not contain the target pane that HET needed to swap in.

```html
<!-- Current page -->
<a href="/account" het-target="main">Account</a>
<main het-pane="main"></main>

<!-- /account response -->
<main het-pane="content">Account</main>
```

Fix the server response by returning a pane with the requested name.

```html
<main het-pane="main">Account</main>
```

Cause fields:

| `cause` property | Meaning |
| --- | --- |
| `requestUrl` | Final fetch URL after `het:beforeFetch`. |
| `requestMethod` | Final fetch method after `het:beforeFetch`. |
| `resolvedTargetName` | Target pane name before any response target override. |
| `targetPaneElement` | Current target pane element before the response swap. |
| `responseTargetHeader` | `X-HET-Target-Override` value, when present. |
| `effectiveTargetPaneName` | Final target pane name after a response target override, when the override changed the target. |
| `effectiveTargetPaneElement` | Final current target pane after a response target override, when the override changed the target. |
| `linkElement` | Enhanced link that started the request, for link requests. |
| `linkUrl` | Link `href` resolved by the browser, for link requests. |
| `linkTargetName` | Raw `het-target` value from the link, for link requests. |
| `formElement` | Enhanced form that started the request, for form requests. |
| `submitterElement` | Submit button that submitted the form, for form requests when present. |
| `formTargetName` | Raw `het-target` value from the form, for form requests when present. |
| `submitterTargetName` | Raw `het-target` value from the submitter, for form requests when present. |
| `formAction` | Raw form `action` value, for form requests. |
| `submitterAction` | Raw submitter `formaction` override, for form requests when present. |
| `resolvedActionUrl` | Absolute form submission URL, for form requests. |
| `formMethod` | Raw or default form method, for form requests. |
| `submitterMethod` | Submitter `formmethod` override, for form requests when present. |
| `resolvedMethod` | Final request method, for form requests. |
| `formEnctype` | Raw or default form encoding type, for form requests. |
| `submitterEnctype` | Submitter `formenctype` override, for form requests when present. |
| `resolvedEnctype` | Final request encoding type, for form requests. |
| `navigationFromUrl` | Previous URL, for history re-fetches. |
| `navigationToUrl` | New URL, for history re-fetches. |
| `navigationTargetName` | Target pane name from history state, for history re-fetches. |

#### `HET Error: Multiple target panes found in server response`

The response HTML contained more than one pane with the requested `het-pane` value, so HET could not choose which one to load.

```html
<!-- /account response -->
<main het-pane="main">Account</main>
<aside het-pane="main">Related</aside>
```

Fix the response so the target pane name appears exactly once.

```html
<main het-pane="main">Account</main>
<aside het-pane="related">Related</aside>
```

Cause fields:

| `cause` property | Meaning |
| --- | --- |
| `requestUrl` | Final fetch URL after `het:beforeFetch`. |
| `requestMethod` | Final fetch method after `het:beforeFetch`. |
| `resolvedTargetName` | Target pane name before any response target override. |
| `targetPaneElement` | Current target pane element before the response swap. |
| `responseTargetPaneCount` | Number of matching target panes in the response. |
| `responseTargetHeader` | `X-HET-Target-Override` value, when present. |
| `effectiveTargetPaneName` | Final target pane name after a response target override, when the override changed the target. |
| `effectiveTargetPaneElement` | Final current target pane after a response target override, when the override changed the target. |
| `linkElement` | Enhanced link that started the request, for link requests. |
| `linkUrl` | Link `href` resolved by the browser, for link requests. |
| `linkTargetName` | Raw `het-target` value from the link, for link requests. |
| `formElement` | Enhanced form that started the request, for form requests. |
| `submitterElement` | Submit button that submitted the form, for form requests when present. |
| `formTargetName` | Raw `het-target` value from the form, for form requests when present. |
| `submitterTargetName` | Raw `het-target` value from the submitter, for form requests when present. |
| `formAction` | Raw form `action` value, for form requests. |
| `submitterAction` | Raw submitter `formaction` override, for form requests when present. |
| `resolvedActionUrl` | Absolute form submission URL, for form requests. |
| `formMethod` | Raw or default form method, for form requests. |
| `submitterMethod` | Submitter `formmethod` override, for form requests when present. |
| `resolvedMethod` | Final request method, for form requests. |
| `formEnctype` | Raw or default form encoding type, for form requests. |
| `submitterEnctype` | Submitter `formenctype` override, for form requests when present. |
| `resolvedEnctype` | Final request encoding type, for form requests. |
| `navigationFromUrl` | Previous URL, for history re-fetches. |
| `navigationToUrl` | New URL, for history re-fetches. |
| `navigationTargetName` | Target pane name from history state, for history re-fetches. |

### `het-select`

#### `HET Error: Select directive must list at least one id`

`het-select` was present but empty after trimming whitespace.

```html
<a href="/account" het-target="main" het-select=" ">Account</a>
<main het-pane="main"></main>
```

Fix the directive by listing one or more descendant IDs from the target pane.

```html
<a href="/account" het-target="main" het-select="summary details">Account</a>
<main het-pane="main">
  <section id="summary"></section>
  <section id="details"></section>
</main>
```

Cause fields:

| `cause` property | Meaning |
| --- | --- |
| `requestDirectiveAttribute` | `het-select`. |
| `requestDirectiveDeclaration` | Raw empty directive value. |
| `linkElement` | Enhanced link that started the request, for link requests. |
| `linkUrl` | Link `href` resolved by the browser, for link requests. |
| `linkTargetName` | Raw `het-target` value from the link, for link requests. |
| `formElement` | Enhanced form that started the request, for form requests. |
| `submitterElement` | Submit button that submitted the form, for form requests when present. |
| `formTargetName` | Raw `het-target` value from the form, for form requests when present. |
| `submitterTargetName` | Raw `het-target` value from the submitter, for form requests when present. |
| `resolvedTargetName` | Target pane name from the link, form, or submitter. |
| `formAction` | Raw form `action` value, for form requests. |
| `submitterAction` | Raw submitter `formaction` override, for form requests when present. |
| `resolvedActionUrl` | Absolute form submission URL, for form requests. |
| `formMethod` | Raw or default form method, for form requests. |
| `submitterMethod` | Submitter `formmethod` override, for form requests when present. |
| `resolvedMethod` | Final request method, for form requests. |
| `formEnctype` | Raw or default form encoding type, for form requests. |
| `submitterEnctype` | Submitter `formenctype` override, for form requests when present. |
| `resolvedEnctype` | Final request encoding type, for form requests. |

#### `HET Error: Selected element not found in the target pane on the page`

`het-select` named an ID that does not exist inside the current target pane.

```html
<a href="/account" het-target="main" het-select="summary">Account</a>
<main het-pane="main">
  <section id="details"></section>
</main>
```

Fix the current page by selecting an ID that exists in the target pane, or add the missing element.

```html
<main het-pane="main">
  <section id="summary"></section>
  <section id="details"></section>
</main>
```

Cause fields:

| `cause` property | Meaning |
| --- | --- |
| `requestDirectiveAttribute` | `het-select` for request attributes, or `X-HET-Select-Override` for response header overrides. |
| `selectId` | Selected ID that was not found in the current target pane. |
| `targetPaneElement` | Current target pane element. |
| `requestUrl` | Final fetch URL after `het:beforeFetch`. |
| `requestMethod` | Final fetch method after `het:beforeFetch`. |
| `resolvedTargetName` | Target pane name before any response target override. |
| `responseSelectHeader` | `X-HET-Select-Override` value, for response header overrides. |
| `responseTargetHeader` | `X-HET-Target-Override` value, when present. |
| `effectiveTargetPaneName` | Final target pane name after a response target override, when present. |
| `effectiveTargetPaneElement` | Final current target pane after a response target override, when present. |
| `linkElement` | Enhanced link that started the request, for link requests. |
| `linkUrl` | Link `href` resolved by the browser, for link requests. |
| `linkTargetName` | Raw `het-target` value from the link, for link requests. |
| `formElement` | Enhanced form that started the request, for form requests. |
| `submitterElement` | Submit button that submitted the form, for form requests when present. |
| `formTargetName` | Raw `het-target` value from the form, for form requests when present. |
| `submitterTargetName` | Raw `het-target` value from the submitter, for form requests when present. |
| `formAction` | Raw form `action` value, for form requests. |
| `submitterAction` | Raw submitter `formaction` override, for form requests when present. |
| `resolvedActionUrl` | Absolute form submission URL, for form requests. |
| `formMethod` | Raw or default form method, for form requests. |
| `submitterMethod` | Submitter `formmethod` override, for form requests when present. |
| `resolvedMethod` | Final request method, for form requests. |
| `formEnctype` | Raw or default form encoding type, for form requests. |
| `submitterEnctype` | Submitter `formenctype` override, for form requests when present. |
| `resolvedEnctype` | Final request encoding type, for form requests. |
| `navigationFromUrl` | Previous URL, for history re-fetches. |
| `navigationToUrl` | New URL, for history re-fetches. |
| `navigationTargetName` | Target pane name from history state, for history re-fetches. |

#### `HET Error: Selected element not found in the target pane in the server response`

`het-select` named an ID that exists in the current target pane but not in the response target pane.

```html
<!-- Current page -->
<a href="/account" het-target="main" het-select="summary">Account</a>
<main het-pane="main">
  <section id="summary"></section>
</main>

<!-- /account response -->
<main het-pane="main">
  <section id="details"></section>
</main>
```

Fix the response by including every selected ID inside the response target pane.

```html
<main het-pane="main">
  <section id="summary">Updated summary</section>
  <section id="details"></section>
</main>
```

Cause fields:

| `cause` property | Meaning |
| --- | --- |
| `requestDirectiveAttribute` | `het-select` for request attributes, or `X-HET-Select-Override` for response header overrides. |
| `selectId` | Selected ID that was not found in the response target pane. |
| `targetPaneElement` | Current target pane element. |
| `currentElement` | Current page element that matched `selectId`. |
| `requestUrl` | Final fetch URL after `het:beforeFetch`. |
| `requestMethod` | Final fetch method after `het:beforeFetch`. |
| `resolvedTargetName` | Target pane name before any response target override. |
| `responseSelectHeader` | `X-HET-Select-Override` value, for response header overrides. |
| `responseTargetHeader` | `X-HET-Target-Override` value, when present. |
| `effectiveTargetPaneName` | Final target pane name after a response target override, when present. |
| `effectiveTargetPaneElement` | Final current target pane after a response target override, when present. |
| `linkElement` | Enhanced link that started the request, for link requests. |
| `linkUrl` | Link `href` resolved by the browser, for link requests. |
| `linkTargetName` | Raw `het-target` value from the link, for link requests. |
| `formElement` | Enhanced form that started the request, for form requests. |
| `submitterElement` | Submit button that submitted the form, for form requests when present. |
| `formTargetName` | Raw `het-target` value from the form, for form requests when present. |
| `submitterTargetName` | Raw `het-target` value from the submitter, for form requests when present. |
| `formAction` | Raw form `action` value, for form requests. |
| `submitterAction` | Raw submitter `formaction` override, for form requests when present. |
| `resolvedActionUrl` | Absolute form submission URL, for form requests. |
| `formMethod` | Raw or default form method, for form requests. |
| `submitterMethod` | Submitter `formmethod` override, for form requests when present. |
| `resolvedMethod` | Final request method, for form requests. |
| `formEnctype` | Raw or default form encoding type, for form requests. |
| `submitterEnctype` | Submitter `formenctype` override, for form requests when present. |
| `resolvedEnctype` | Final request encoding type, for form requests. |
| `navigationFromUrl` | Previous URL, for history re-fetches. |
| `navigationToUrl` | New URL, for history re-fetches. |
| `navigationTargetName` | Target pane name from history state, for history re-fetches. |

### `het-also`

#### `HET Error: Also directive must list at least one id`

`het-also` was present but empty after trimming whitespace.

```html
<a href="/account" het-target="main" het-also=" ">Account</a>
<main het-pane="main"></main>
```

Fix the directive by listing one or more IDs outside the target pane that should also be replaced.

```html
<a href="/account" het-target="main" het-also="flash">Account</a>
<div id="flash"></div>
<main het-pane="main"></main>
```

Cause fields:

| `cause` property | Meaning |
| --- | --- |
| `requestDirectiveAttribute` | `het-also`. |
| `requestDirectiveDeclaration` | Raw empty directive value. |
| `linkElement` | Enhanced link that started the request, for link requests. |
| `linkUrl` | Link `href` resolved by the browser, for link requests. |
| `linkTargetName` | Raw `het-target` value from the link, for link requests. |
| `formElement` | Enhanced form that started the request, for form requests. |
| `submitterElement` | Submit button that submitted the form, for form requests when present. |
| `formTargetName` | Raw `het-target` value from the form, for form requests when present. |
| `submitterTargetName` | Raw `het-target` value from the submitter, for form requests when present. |
| `resolvedTargetName` | Target pane name from the link, form, or submitter. |
| `formAction` | Raw form `action` value, for form requests. |
| `submitterAction` | Raw submitter `formaction` override, for form requests when present. |
| `resolvedActionUrl` | Absolute form submission URL, for form requests. |
| `formMethod` | Raw or default form method, for form requests. |
| `submitterMethod` | Submitter `formmethod` override, for form requests when present. |
| `resolvedMethod` | Final request method, for form requests. |
| `formEnctype` | Raw or default form encoding type, for form requests. |
| `submitterEnctype` | Submitter `formenctype` override, for form requests when present. |
| `resolvedEnctype` | Final request encoding type, for form requests. |

#### `HET Error: het-also element not found on the page`

`het-also` named an ID that does not exist in the current document.

```html
<a href="/account" het-target="main" het-also="flash">Account</a>
<main het-pane="main"></main>
```

Fix the current page by adding the element outside the target pane, or remove the ID from `het-also`.

```html
<a href="/account" het-target="main" het-also="flash">Account</a>
<div id="flash"></div>
<main het-pane="main"></main>
```

Cause fields:

| `cause` property | Meaning |
| --- | --- |
| `requestDirectiveAttribute` | `het-also` for request attributes, or `X-HET-Also-Override` for response header overrides. |
| `alsoId` | Additional replacement ID that was not found on the current page. |
| `targetPaneElement` | Current target pane element. |
| `requestUrl` | Final fetch URL after `het:beforeFetch`. |
| `requestMethod` | Final fetch method after `het:beforeFetch`. |
| `resolvedTargetName` | Target pane name before any response target override. |
| `responseAlsoHeader` | `X-HET-Also-Override` value, for response header overrides. |
| `responseTargetHeader` | `X-HET-Target-Override` value, when present. |
| `effectiveTargetPaneName` | Final target pane name after a response target override, when present. |
| `effectiveTargetPaneElement` | Final current target pane after a response target override, when present. |
| `linkElement` | Enhanced link that started the request, for link requests. |
| `linkUrl` | Link `href` resolved by the browser, for link requests. |
| `linkTargetName` | Raw `het-target` value from the link, for link requests. |
| `formElement` | Enhanced form that started the request, for form requests. |
| `submitterElement` | Submit button that submitted the form, for form requests when present. |
| `formTargetName` | Raw `het-target` value from the form, for form requests when present. |
| `submitterTargetName` | Raw `het-target` value from the submitter, for form requests when present. |
| `formAction` | Raw form `action` value, for form requests. |
| `submitterAction` | Raw submitter `formaction` override, for form requests when present. |
| `resolvedActionUrl` | Absolute form submission URL, for form requests. |
| `formMethod` | Raw or default form method, for form requests. |
| `submitterMethod` | Submitter `formmethod` override, for form requests when present. |
| `resolvedMethod` | Final request method, for form requests. |
| `formEnctype` | Raw or default form encoding type, for form requests. |
| `submitterEnctype` | Submitter `formenctype` override, for form requests when present. |
| `resolvedEnctype` | Final request encoding type, for form requests. |
| `navigationFromUrl` | Previous URL, for history re-fetches. |
| `navigationToUrl` | New URL, for history re-fetches. |
| `navigationTargetName` | Target pane name from history state, for history re-fetches. |

#### `HET Error: het-also element found inside the target pane on the page`

`het-also` named an element that already lives inside the target pane. HET replaces the target pane as one unit, so `het-also` is only for extra elements outside that pane.

```html
<a href="/account" het-target="main" het-also="flash">Account</a>
<main het-pane="main">
  <div id="flash"></div>
</main>
```

Fix the page by moving the extra replacement outside the target pane, or remove it from `het-also`.

```html
<a href="/account" het-target="main" het-also="flash">Account</a>
<div id="flash"></div>
<main het-pane="main"></main>
```

Cause fields:

| `cause` property | Meaning |
| --- | --- |
| `requestDirectiveAttribute` | `het-also` for request attributes, or `X-HET-Also-Override` for response header overrides. |
| `alsoId` | Additional replacement ID that matched an element inside the current target pane. |
| `targetPaneElement` | Current target pane element. |
| `currentElement` | Current page element that matched `alsoId`. |
| `requestUrl` | Final fetch URL after `het:beforeFetch`. |
| `requestMethod` | Final fetch method after `het:beforeFetch`. |
| `resolvedTargetName` | Target pane name before any response target override. |
| `responseAlsoHeader` | `X-HET-Also-Override` value, for response header overrides. |
| `responseTargetHeader` | `X-HET-Target-Override` value, when present. |
| `effectiveTargetPaneName` | Final target pane name after a response target override, when present. |
| `effectiveTargetPaneElement` | Final current target pane after a response target override, when present. |
| `linkElement` | Enhanced link that started the request, for link requests. |
| `linkUrl` | Link `href` resolved by the browser, for link requests. |
| `linkTargetName` | Raw `het-target` value from the link, for link requests. |
| `formElement` | Enhanced form that started the request, for form requests. |
| `submitterElement` | Submit button that submitted the form, for form requests when present. |
| `formTargetName` | Raw `het-target` value from the form, for form requests when present. |
| `submitterTargetName` | Raw `het-target` value from the submitter, for form requests when present. |
| `formAction` | Raw form `action` value, for form requests. |
| `submitterAction` | Raw submitter `formaction` override, for form requests when present. |
| `resolvedActionUrl` | Absolute form submission URL, for form requests. |
| `formMethod` | Raw or default form method, for form requests. |
| `submitterMethod` | Submitter `formmethod` override, for form requests when present. |
| `resolvedMethod` | Final request method, for form requests. |
| `formEnctype` | Raw or default form encoding type, for form requests. |
| `submitterEnctype` | Submitter `formenctype` override, for form requests when present. |
| `resolvedEnctype` | Final request encoding type, for form requests. |
| `navigationFromUrl` | Previous URL, for history re-fetches. |
| `navigationToUrl` | New URL, for history re-fetches. |
| `navigationTargetName` | Target pane name from history state, for history re-fetches. |

#### `HET Error: het-also element not found in the server response`

`het-also` named an element that exists on the current page, but the response did not include a replacement with the same ID.

```html
<!-- Current page -->
<a href="/account" het-target="main" het-also="flash">Account</a>
<div id="flash"></div>
<main het-pane="main"></main>

<!-- /account response -->
<main het-pane="main">Account</main>
```

Fix the response by including the extra replacement element.

```html
<div id="flash">Saved</div>
<main het-pane="main">Account</main>
```

Cause fields:

| `cause` property | Meaning |
| --- | --- |
| `requestDirectiveAttribute` | `het-also` for request attributes, or `X-HET-Also-Override` for response header overrides. |
| `alsoId` | Additional replacement ID that was not found in the server response. |
| `targetPaneElement` | Current target pane element. |
| `currentElement` | Current page element that matched `alsoId`. |
| `requestUrl` | Final fetch URL after `het:beforeFetch`. |
| `requestMethod` | Final fetch method after `het:beforeFetch`. |
| `resolvedTargetName` | Target pane name before any response target override. |
| `responseAlsoHeader` | `X-HET-Also-Override` value, for response header overrides. |
| `responseTargetHeader` | `X-HET-Target-Override` value, when present. |
| `effectiveTargetPaneName` | Final target pane name after a response target override, when present. |
| `effectiveTargetPaneElement` | Final current target pane after a response target override, when present. |
| `linkElement` | Enhanced link that started the request, for link requests. |
| `linkUrl` | Link `href` resolved by the browser, for link requests. |
| `linkTargetName` | Raw `het-target` value from the link, for link requests. |
| `formElement` | Enhanced form that started the request, for form requests. |
| `submitterElement` | Submit button that submitted the form, for form requests when present. |
| `formTargetName` | Raw `het-target` value from the form, for form requests when present. |
| `submitterTargetName` | Raw `het-target` value from the submitter, for form requests when present. |
| `formAction` | Raw form `action` value, for form requests. |
| `submitterAction` | Raw submitter `formaction` override, for form requests when present. |
| `resolvedActionUrl` | Absolute form submission URL, for form requests. |
| `formMethod` | Raw or default form method, for form requests. |
| `submitterMethod` | Submitter `formmethod` override, for form requests when present. |
| `resolvedMethod` | Final request method, for form requests. |
| `formEnctype` | Raw or default form encoding type, for form requests. |
| `submitterEnctype` | Submitter `formenctype` override, for form requests when present. |
| `resolvedEnctype` | Final request encoding type, for form requests. |
| `navigationFromUrl` | Previous URL, for history re-fetches. |
| `navigationToUrl` | New URL, for history re-fetches. |
| `navigationTargetName` | Target pane name from history state, for history re-fetches. |

#### `HET Error: het-also element found inside the target pane in the server response`

The response included the `het-also` replacement inside the response target pane. HET expects additional replacements to be outside the target pane in both the current page and the response.

```html
<!-- /account response -->
<main het-pane="main">
  <div id="flash">Saved</div>
  Account
</main>
```

Fix the response by placing the extra replacement outside the target pane.

```html
<div id="flash">Saved</div>
<main het-pane="main">Account</main>
```

Cause fields:

| `cause` property | Meaning |
| --- | --- |
| `requestDirectiveAttribute` | `het-also` for request attributes, or `X-HET-Also-Override` for response header overrides. |
| `alsoId` | Additional replacement ID that matched an element inside the response target pane. |
| `targetPaneElement` | Current target pane element. |
| `currentElement` | Current page element that matched `alsoId`. |
| `requestUrl` | Final fetch URL after `het:beforeFetch`. |
| `requestMethod` | Final fetch method after `het:beforeFetch`. |
| `resolvedTargetName` | Target pane name before any response target override. |
| `responseAlsoHeader` | `X-HET-Also-Override` value, for response header overrides. |
| `responseTargetHeader` | `X-HET-Target-Override` value, when present. |
| `effectiveTargetPaneName` | Final target pane name after a response target override, when present. |
| `effectiveTargetPaneElement` | Final current target pane after a response target override, when present. |
| `linkElement` | Enhanced link that started the request, for link requests. |
| `linkUrl` | Link `href` resolved by the browser, for link requests. |
| `linkTargetName` | Raw `het-target` value from the link, for link requests. |
| `formElement` | Enhanced form that started the request, for form requests. |
| `submitterElement` | Submit button that submitted the form, for form requests when present. |
| `formTargetName` | Raw `het-target` value from the form, for form requests when present. |
| `submitterTargetName` | Raw `het-target` value from the submitter, for form requests when present. |
| `formAction` | Raw form `action` value, for form requests. |
| `submitterAction` | Raw submitter `formaction` override, for form requests when present. |
| `resolvedActionUrl` | Absolute form submission URL, for form requests. |
| `formMethod` | Raw or default form method, for form requests. |
| `submitterMethod` | Submitter `formmethod` override, for form requests when present. |
| `resolvedMethod` | Final request method, for form requests. |
| `formEnctype` | Raw or default form encoding type, for form requests. |
| `submitterEnctype` | Submitter `formenctype` override, for form requests when present. |
| `resolvedEnctype` | Final request encoding type, for form requests. |
| `navigationFromUrl` | Previous URL, for history re-fetches. |
| `navigationToUrl` | New URL, for history re-fetches. |
| `navigationTargetName` | Target pane name from history state, for history re-fetches. |
