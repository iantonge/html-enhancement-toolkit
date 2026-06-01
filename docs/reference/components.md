# Component Reference

## Contents

- [Component roots and mounting](#component-roots-and-mounting)
- [Signals](#signals)
- [Binding categories](#binding-categories)
- [Binding syntax](#binding-syntax)
- [Read sources](#read-sources)
- [Type hints](#type-hints)
- [Acquisition Strategies (`:seed`, `:sync`)](#acquisition-strategies-seed-sync)
- [Output bindings](#output-bindings)
- [Input and event bindings](#input-and-event-bindings)
- [Signal sharing](#signal-sharing)
- [Structural templates](#structural-templates)
- [Cleanup](#cleanup)
- [Component lifecycle notes](#component-lifecycle-notes)
- [Component attribute support](#component-attribute-support)

## Component roots and mounting

### `het-component`

Use `het-component` to mark a component root.
Set a value to mount a registered component by name, or leave the attribute empty to mount an anonymous component root if component JavaScript is not required.

```html
<div het-component="counter">
  <button type="button" het-on="click->increment">+</button>
  <output het-props="textContent=count"></output>
</div>
```

```html
<div het-component>
  <span het-text:seed="message">Ready</span>
  <output het-props="textContent=message"></output>
</div>
```

Register named components before calling `init()`. Anonymous component roots are useful when acquired signals, bindings, imports, exports, sync, and cleanup should use the normal component lifecycle without a registered setup function.

### `het-ref`

Use `het-ref` to expose DOM element references in `setup({ refs })`.
The `refs` object includes elements marked with `het-ref` on the component root and its descendants, but excludes elements inside nested `[het-component]` subtrees.

```html
<div het-component="profileForm">
  <input het-ref="emailInput" type="email">
</div>
```

```js
HET.registerComponent('profileForm', ({ refs }) => {
  refs.emailInput?.focus();
});
```

### `het-cloak`

Use `het-cloak` to hide a component root until a component mount batch completes, then HET removes the attribute automatically. This avoids uncloaking parents before their nested components have mounted, which helps prevent brief visual mismatch.

HET does not provide styles for cloaked elements, so bring your own CSS:

```html
<style>
  [het-cloak] { visibility: hidden; }
</style>
```

To preserve layout while a component is cloaked, prefer `visibility: hidden` over `display: none`.

## Signals

Component bindings expect Preact signal objects. See the [Preact Signals documentation](https://github.com/preactjs/signals) for details on creating and using signals.

Signals can come from three places:

- Local signals initialized in `setup`, such as `signals.count = HET.signals.signal(0)`.
- Acquired signals created from DOM values with `:seed` or `:sync` before `setup` runs.
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

The ESM build does not re-export signal helpers. If you use components with the ESM build, import the helpers you need from `@preact/signals-core`:

```js
import { signal, computed } from '@preact/signals-core';
import { registerComponent } from '/path/to/het.js';

registerComponent('counter', ({ signals }) => {
  signals.count = signal(0);
  signals.doubleCount = computed(() => signals.count.value * 2);
});
```

## Binding categories

Component bindings fall into a few groups:

- Output bindings write signal state into the DOM: `het-text`, `het-props`, `het-attrs`, `het-bool-attrs`, `het-class`.
- Input and event bindings read from the DOM or react to user input: `het-model`, `het-on`, `het-toggle`.
- Signal sharing bindings move signals across component boundaries: `het-exports`, `het-imports`.

## Binding syntax

Binding attributes connect an element property, attribute, class, model value, or event to a signal or component method.
For example, `het-props="textContent=count"` writes the `count` signal to the element's `textContent` property.

Some binding attributes support multiple declarations in the same attribute, separated by whitespace.
For example, `het-props="textContent=count title=label"` binds two properties from two signals.

Some signal bindings support negation with `!`, which applies JavaScript boolean negation before writing to the DOM.
For example, `het-attrs="aria-expanded=!isCollapsed"` writes `"false"` when `isCollapsed` is truthy.

Plain output bindings only write signal values to the DOM.
Use `:seed` and `:sync` attribute variants, or explicit `het-seed` / `het-sync` attributes, to initialize a signal from the DOM.

General forms:

```text
target=source
target=!source
het-directive:seed="target=source[type]"
het-directive:sync="target=source[type]"
het-seed="signal=source[type]"
het-sync="signal=source[type]"
event->method
event.modifier->method
event.modifier(arg)->method
event->signal=source[type]
```

Negation and acquisition cannot be combined in the same declaration.

## Read sources

Read sources control where a binding reads its value from.
They are used in explicit `het-seed` and `het-sync` declarations, and in `het-on` assignment declarations.

General forms:

```text
value
prop:value
attr:data-status
bool-attr:hidden
class:active
literal:ready
```

### Unprefixed sources

The meaning of an unprefixed source depends on the binding:

| Binding | Unprefixed source |
| --- | --- |
| `het-seed` | Element property name |
| `het-sync` | Element property name |
| `het-on` assignment | Component signal name |

For `het-seed` and `het-sync`, these declarations both read the input element's `value` property:

```html
<input het-seed="query=value">
<input het-seed="query=prop:value">
```

For a `het-on` assignment, an unprefixed source refers to another signal. This copies the current value of `otherStatus` into `status`:

```html
<button het-on="click->status=otherStatus">Copy status</button>
```

Use an explicit source prefix when you want the declaration to be unambiguous or need a source other than the binding's default.

Acquisition variants such as `het-props:seed="value=query"` follow a different shape: the directive target (`value`) identifies what HET reads from the element, while `query` names the signal that receives it.

### `prop:name`

Reads a DOM property from the element. Use the `prop:` prefix explicitly in any binding, including `het-on` assignments:

```html
<input het-seed="query=prop:value">
<input type="checkbox" het-seed="isOpen=prop:checked">
<input het-on="input->query=prop:value">
```

### `attr:name`

Reads a DOM attribute value with `getAttribute(name)`.

```html
<div het-seed="status=attr:data-status" data-status="ready"></div>
```

### `bool-attr:name`

Reads whether a boolean attribute is present.

```html
<section het-seed="isHidden=bool-attr:hidden" hidden></section>
```

### `class:name`

Reads whether the element currently has the named CSS class.

```html
<div het-seed="isActive=class:active" class="active"></div>
```

### `literal:value`

Uses the provided literal string instead of reading from the DOM.

```html
<button het-on="click->status=literal:busy">Mark busy</button>
<div het-seed="status=literal:ready"></div>
```

Colons are allowed inside names after a known source prefix, such as `attr:xlink:href` or `class:md:hover:block`.

## Type hints

Type hints can be applied to value-bearing DOM reads and to `het-on` assignment sources:

- `[int]` uses `parseInt(value, 10)`
- `[float]` uses `parseFloat(value)`
- `[bool]` treats `true` and `"true"` as `true`; other values are `false`

```html
<p het-props:seed="textContent=count[int]">7</p>
<p het-props:seed="textContent=price[float]">3.5</p>
<p het-props:seed="textContent=enabled[bool]">true</p>
<input het-on="input->count=prop:value[int]">
```

## Acquisition Strategies (`:seed`, `:sync`)

Signal bindings can initialize from existing DOM values using acquisition variants or explicit read attributes:

- `het-*:seed` writes signal to DOM and seeds from the same DOM target once.
- `het-*:sync` writes signal to DOM, seeds initially, and updates again when a `het:sync` event is dispatched.
- `het-seed="signal=source"` reads once before setup.
- `het-sync="signal=source"` reads before setup and again on `het:sync`.

An acquired signal is created before `setup` runs. A signal may be referenced by multiple bindings, but it may have only one DOM acquisition source.

Do not initialize an acquired signal manually in `setup`, import a signal with the same local name, or declare a second acquisition binding for the same signal.

```html
<input het-props:seed="value=count[int]" value="7">
<span het-props="textContent=count"></span>
<output het-attrs="data-count=count"></output>
```

```html
<input het-props:seed="value=count[int]" value="7">
<span het-text:seed="count">7</span>
```

Sync trigger behavior:

- HET dispatches `het:sync` after request content loads. This covers the target pane and any content updated through `het-also`.
- If DOM changes happen outside HET request enhancement, no automatic sync event is dispatched.
- You can manually dispatch `het:sync` on the smallest container that owns the component(s).

```js
const container = document.querySelector('#profile-editor');
container.dispatchEvent(new CustomEvent('het:sync', { bubbles: true }));
```

Acquisition support matrix:

| Directive | `:seed` | `:sync` | Type hints | Negation |
| --- | --- | --- | --- | --- |
| `het-props` | Yes | Yes | Yes | Yes |
| `het-attrs` | Yes | Yes | Yes | Yes |
| `het-bool-attrs` | Yes | Yes | No | Yes |
| `het-class` | Yes | Yes | No | Yes |
| `het-text` | Yes | Yes | Yes | Yes |
| `het-model` | Always | No | Yes | No |

`het-component`, `het-ref`, `het-cloak`, `het-on`, `het-toggle`, `het-exports`, and `het-imports` do not use acquisition variants.

## Output bindings

### `het-text`

Use `het-text` to bind a signal to an element's `textContent`.
It is sugar for `het-props="textContent=signal"`.

```html
<p het-text="message"></p>
```

Support:

| Feature | Support |
| --- | --- |
| Multiple declarations | No |
| Negation | Yes |
| Acquisition | `het-text:seed`, `het-text:sync` |
| Type hints | Yes, for acquisition variants |

### `het-props`

Use `het-props` to bind signal values to element properties.
Use this for DOM properties such as `textContent`, `value`, and `checked`.

```html
<div het-component="counter">
  <button type="button" het-on="click->increment">+</button>
  <p het-props="textContent=count"></p>
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
```

Support:

| Feature | Support |
| --- | --- |
| Multiple declarations | Yes |
| Negation | Yes |
| Acquisition | `:seed`, `:sync` attribute variants |
| Type hints | Yes, for acquisition variants |

### `het-attrs`

Use `het-attrs` to bind signal values to DOM attributes.
Use this for attributes whose meaning comes from their value. For boolean presence or absence attributes such as `disabled`, `required`, or `hidden`, use `het-bool-attrs` instead.

```html
<div het-component="statusCard">
  <button type="button" het-on="click->toggle">Toggle status</button>
  <p het-attrs="data-status=status"></p>
</div>
```

```js
HET.registerComponent('statusCard', ({ signals }) => {
  signals.status = HET.signals.signal('idle');
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
| Acquisition | `:seed`, `:sync` attribute variants |
| Type hints | Yes, for acquisition variants |

### `het-bool-attrs`

Use `het-bool-attrs` to bind signals to boolean attribute presence.
Use this for attributes whose meaning comes from presence or absence like `disabled`, `required`, or `hidden`. If an attribute merely stores a boolean-like value such as `aria-expanded="true"`, bind it with `het-attrs` instead. If the signal value is truthy, the attribute is added. If the signal value is falsy, the attribute is removed.

```html
<div het-component="lockInput">
  <button type="button" het-on="click->toggle">Toggle disabled</button>
  <input het-bool-attrs="disabled=isDisabled">
</div>
```

```js
HET.registerComponent('lockInput', ({ signals }) => {
  signals.isDisabled = HET.signals.signal(false);
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
| Acquisition | `:seed`, `:sync` attribute variants |
| Type hints | No |

### `het-class`

Use `het-class` to add or remove classes based on signal truthiness.
If the signal value is truthy, the class is added. If the signal value is falsy, the class is removed.

```html
<div het-component="alertBox">
  <button type="button" het-on="click->toggle">Toggle active</button>
  <div het-class="active=isActive"></div>
</div>
```

```js
HET.registerComponent('alertBox', ({ signals }) => {
  signals.isActive = HET.signals.signal(false);
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
| Acquisition | `:seed`, `:sync` attribute variants |
| Type hints | No |

## Input and event bindings

### `het-model`

Use `het-model` for two-way signal binding on form controls.
HET infers `value` for most inputs and `checked` for checkbox/radio inputs.
The DOM event cannot be specified; HET infers `change` for `checked` bindings and `input` for all other properties.
The signal is always seeded from the element's current property value before setup runs.
For explicit properties or events, combine `het-props` with `het-seed` and `het-on` assignment.

```html
<div het-component="profileForm">
  <input het-model="name" value="Ada">
  <input het-model="email" value="ada@example.com">
  <input het-model="age[int]" value="37">
  <input type="checkbox" het-model="isSubscribed">
  <p het-props="textContent=name"></p>
  <p het-props="textContent=email"></p>
</div>
```

```js
HET.registerComponent('profileForm');
```

Applied to a text-like form control, this:

```html
<input het-model="name">
```

is equivalent to:

```html
<input het-props="value=name" het-on="input->name=prop:value" het-seed="name=prop:value">
```

Support:

| Feature | Support |
| --- | --- |
| Multiple declarations | No, one declaration per attribute |
| Negation | No |
| Acquisition | Always seeded |
| Type hints | Yes |

### `het-on`

Use `het-on` to bind DOM events to methods returned from `setup`, or to assign signal values when an event fires.
Method declarations use `event->method`.
Assignment declarations use `event->signal=source`.
Add event modifiers to the event side with dot syntax.

```html
<div het-component="counter">
  <button type="button" het-on="click->increment">+</button>
  <button type="button" het-on="click.prevent->increment">+</button>
  <input het-props:seed="value=count[int]" het-on="input.debounce(300)->count=prop:value[int]" value="0">
</div>
```

Handlers are methods returned from `setup`. Define handlers with method syntax by default. HET invokes them with the returned methods object as `this`.

```js
HET.registerComponent('counter', () => ({
  increment() {
    // handle click
  },
}));
```

Method syntax keeps sibling method calls available if a handler needs them later.

```js
HET.registerComponent('searchBox', () => ({
  updateQuery: () => {
    // Invalid: `this` is not bound in an arrow function.
    this.logChange();
  },
  logChange() {
    // handle change
  },
}));
```

```js
HET.registerComponent('searchBox', () => ({
  updateQuery() {
    // Valid: method syntax binds `this` to the returned methods object.
    this.logChange();
  },
  logChange() {
    // handle change
  },
}));
```

Unprefixed assignment sources in `het-on` are signals. When you need a DOM or literal read source, use the shared read-source syntax documented above, including optional type hints.

Assignment sources:

```text
signal
!signal
prop:property
attr:attribute
bool-attr:hidden
class:active
literal:value
literal:value[int]
prop:property[float]
```

Use `literal:` when assigning a literal value.

Event modifiers:

```text
prevent
stop
once
capture
debounce(ms)
throttle(ms)
esc
enter
space
```

Timing modifiers require a positive integer duration in parentheses.
Square brackets remain reserved for value type hints, such as `prop:value[int]`.
Keyboard modifiers are supported on `keydown`, `keyup`, and `keypress` events.
`debounce(ms)` runs once after events stop for the duration; `throttle(ms)` runs immediately, then ignores events until the duration has elapsed.

Support:

| Feature | Support |
| --- | --- |
| Multiple declarations | Yes |
| Negation | Assignment sources only |
| Acquisition | No (`:seed`/`:sync` are invalid) |
| Type hints | Assignment sources only |
| Event modifiers | `prevent`, `stop`, `once`, `capture`, `debounce(ms)`, `throttle(ms)`, `esc`, `enter`, `space` |

### `het-toggle`

Use `het-toggle` to toggle a signal when an event fires.

```html
<button type="button" het-toggle="click.once->isOpen">Toggle</button>
```

This is equivalent to:

```html
<button type="button" het-on="click.once->isOpen=!isOpen">Toggle</button>
```

## Signal sharing

### `het-exports` and `het-imports`

Use `het-exports` on an ancestor component to expose signal names, and `het-imports` on a descendant component to reuse those same signal objects.

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
On `het:sync`, imported bindings are re-resolved against the current ancestor chain so nearest-export semantics remain correct after DOM updates. In very deep trees or pages with many imports, this can add measurable sync overhead.
For those cases, consider managing shared signals explicitly outside component ancestry, such as a module-level store, and wiring them in `setup` directly instead of relying on `het-imports`.

Support:

| Feature | Support |
| --- | --- |
| Multiple declarations | Yes |
| Negation | No |
| Acquisition | No |
| Type hints | No |

## Structural templates

Use `<template het-for="items">` or `<template het-if="selectedItem">` when a component needs to create a small number of child component instances from existing signals instead of manually creating DOM nodes in `setup`.

These directives are intentionally narrow:

- They are only supported on `<template>`.
- The template content must contain exactly one root element with `het-component`.
- `het-for` expects a signal whose value is an array.
- `het-if` expects a signal whose value is falsy or an object.
- Forwarded item properties must already be signals; HET does not convert plain values into signals.

This is meant for small, bounded DOM regions such as notifications, tabs, or menus. It is not intended as a general client-side rendering system for large lists.

### `het-for`

Use `het-for` on `<template>` to create one child component instance per item in a signal-backed array. Each item must already expose signal-valued properties that can be forwarded into the cloned component root.

```html
<section het-component="notificationList">
  <button type="button" het-on="click->addNotification">Add notification</button>

  <ul>
    <template het-for="notifications">
      <li het-component>
        <span het-text="message"></span>
      </li>
    </template>
  </ul>
</section>
```

```js
const createNotification = (message) => ({
  message: HET.signals.signal(message),
});

HET.registerComponent('notificationList', ({ signals }) => {
  signals.notifications = HET.signals.signal([
    createNotification('Account created'),
  ]);

  return {
    addNotification() {
      const number = signals.notifications.value.length + 1;
      signals.notifications.value = [
        ...signals.notifications.value,
        createNotification(`Notification ${number}`),
      ];
    },
  };
});
```

Support:

| Feature | Support |
| --- | --- |
| Multiple declarations | No |
| Negation | No |
| Acquisition | No |
| Type hints | No |

### `het-if`

Use `het-if` on `<template>` to conditionally create a child component instance from a signal-backed object. The child receives forwarded signal-valued properties from the object when the signal is truthy.

Prefer `het-if` when the conditional region should mount and unmount as a real component subtree. When the source becomes truthy, HET clones the template and runs the child component's `setup`. When the source becomes falsy, HET removes that subtree and runs its cleanup callbacks.

Prefer a normal visibility binding such as `het-bool-attrs="hidden=isHidden"` or `het-class="hidden=isHidden"` when the DOM should stay mounted. Hiding an existing subtree preserves its component instance, current DOM state, and any local signals instead of re-running `setup` later.

In practice, use `het-if` when showing the region should create fresh component state, attach refs and bindings only while present, or guarantee cleanup on removal. Use `hidden` or class toggles when the user should return to the same mounted instance.

```html
<section het-component="activeNotice">
  <button type="button" het-on="click->showNotice">Show notice</button>
  <button type="button" het-on="click->hideNotice">Hide notice</button>

  <template het-if="notice">
    <article het-component>
      <strong het-text="label"></strong>
    </article>
  </template>
</section>
```

```js
const createNotice = (label) => ({
  label: HET.signals.signal(label),
});

HET.registerComponent('activeNotice', ({ signals }) => {
  signals.notice = HET.signals.signal(null);

  return {
    showNotice() {
      signals.notice.value = createNotice('Saved');
    },
    hideNotice() {
      signals.notice.value = null;
    },
  };
});
```

Support:

| Feature | Support |
| --- | --- |
| Multiple declarations | No |
| Negation | No |
| Acquisition | No |
| Type hints | No |

## Cleanup

Use `onCleanup(fn)` inside `setup({ onCleanup })` to register teardown work for resources your component creates for itself. This is generally going to be any event listeners, timers, observers, third-party widgets etc created in the setup function that need to be cleaned up when the component is removed. You can call `onCleanup` as many times as you need to, and all functions passed into `onCleanup` will be run when the component os torn down.

```html
<div het-component="manualButtonCleanup">
  <button type="button" het-ref="toggleButton">Toggle status</button>
  <p het-text="message"></p>
  <p het-text="secondsVisible"></p>
</div>
```

```js
HET.registerComponent('manualButtonCleanup', ({ refs, signals, onCleanup }) => {
  signals.message = HET.signals.signal('Idle');
  signals.secondsVisible = HET.signals.signal(0);

  const handleClick = () => {
    signals.message.value = signals.message.value === 'Idle' ? 'Clicked' : 'Idle';
  };
  const intervalId = window.setInterval(() => {
    signals.secondsVisible.value += 1;
  }, 1000);

  refs.toggleButton.addEventListener('click', handleClick);
  onCleanup(() => {
    refs.toggleButton.removeEventListener('click', handleClick);
  });
  onCleanup(() => {
    window.clearInterval(intervalId);
  });
});
```

## Component lifecycle notes

- Components mount when `init()` runs, and new component roots inserted later auto-mount only if their setup function has already been registered.
- Registering a component after `init()` does not retroactively mount existing matching elements; it applies to future insertions.
- Component bindings are discovered once, when a component mounts. Adding or changing `het-*` bindings inside an already-mounted component does not register new bindings, even if you later dispatch `het:sync`.
- Removing a mounted component runs cleanup callbacks registered with `onCleanup`.
- `het-cloak` is removed after a component mount batch completes. If a component cannot mount, HET leaves `het-cloak` in place.

## Component attribute support

| Attribute | Role | Value shape | Multiple declarations | Acquisition | Type hints | Negation | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `het-component` | Component root | Optional component name | No | No | No | No | Mounts the registered component with that name, or mounts anonymously when empty. |
| `het-ref` | DOM ref | Ref name | No | No | No | No | Exposed on `setup({ refs })` for the owning component scope. |
| `het-cloak` | Mount cloak | Boolean attribute | No | No | No | No | Removed after the component mount batch completes. |
| `het-for` | Structural list template | `signal` | No | No | No | No | `<template>` only. Requires a single `het-component` root. |
| `het-if` | Structural conditional template | `signal` | No | No | No | No | `<template>` only. Requires a single `het-component` root. |
| `het-text` | Text binding | `signal` | No | `het-text:seed`, `het-text:sync` | Yes | Yes | Sugar for `textContent`. |
| `het-props` | Property binding | `property=signal` | Yes | `het-props:seed`, `het-props:sync` | Yes | Yes | - |
| `het-attrs` | Attribute binding | `attribute=signal` | Yes | `het-attrs:seed`, `het-attrs:sync` | Yes | Yes | - |
| `het-bool-attrs` | Boolean attribute binding | `attribute=signal` | Yes | `het-bool-attrs:seed`, `het-bool-attrs:sync` | No | Yes | - |
| `het-class` | Class toggle binding | `class=signal` | Yes | `het-class:seed`, `het-class:sync` | No | Yes | - |
| `het-seed` | Explicit DOM read | `signal=source` | Yes | Seed once | Value sources only | Read sources only | Reads before setup. |
| `het-sync` | Explicit DOM read | `signal=source` | Yes | Seed and resync | Value sources only | Read sources only | Reads before setup and on `het:sync`. |
| `het-model` | Two-way form binding | `signal` or `signal[type]` | No | Always seeded | Yes | No | `:sync` is invalid. |
| `het-on` | Event binding | `event.modifier->method` or `event.modifier->signal=source` | Yes | No | Assignment read sources only | Assignment read sources only | Binds methods or assigns signals. |
| `het-toggle` | Event toggle binding | `event.modifier->signal` | Yes | No | No | Yes | Toggles a signal by assigning `!signal`. |
| `het-exports` | Signal export list | `signal` | Yes | No | No | No | Whitespace-separated exported signal names. |
| `het-imports` | Signal import list | `signal` or `local=source` | Yes | No | No | No | Imports from the nearest exporting ancestor. |
