# Components Tutorial

This tutorial starts with a component written as ordinary DOM code inside `setup`, then introduces HET features one layer at a time as the component grows. The goal is not just to show the shortest syntax, but to make it clear what each feature is replacing and why you might want it.

Examples use the standalone build so you can follow along without a build pipeline. If you are using the ESM bundle instead, the same component concepts apply, but the import syntax is different.

## 1. Load HET on the page

Start by including the standalone script and calling `HET.init()`.

```html
<script src="het.iife.js"></script>
<script>
  HET.init();
</script>
```

The equivalent ESM JavaScript is:

```js
import { init } from './het.js';

init();
```

`HET.init()` scans the page for HET panes and components, then mounts anything it recognizes.

Named components must be registered before `HET.init()` runs. If HET initializes before a component is registered, it cannot mount an existing root for that component.

Relevant reference:

- [`init(config)`](reference/api.md#initconfig)

## 2. Register a component

This is the smallest useful HET component: a root element in HTML and a setup function in JavaScript. When HET mounts the component, it calls `setup` once and gives it access to any refs inside that root.

```html
<section het-component="logger">
  <button type="button" het-ref="logButton">Log</button>
</section>

<script src="het.iife.js"></script>
<script>
  HET.registerComponent('logger', ({ refs }) => {
    function handleClick() {
      console.log('Clicked');
    }

    refs.logButton.addEventListener('click', handleClick);
  });

  HET.init();
</script>
```

The equivalent ESM JavaScript is:

```js
import { init, registerComponent } from './het.js';

registerComponent('logger', ({ refs }) => {
  function handleClick() {
    console.log('Clicked');
  }

  refs.logButton.addEventListener('click', handleClick);
});

init();
```

There are three important pieces here:

- `het-component="logger"` marks the component root
- `registerComponent('logger', setup)` connects that name to setup code
- `het-ref="logButton"` exposes the button on `refs.logButton`

`het-ref="logButton"` puts the button on `refs.logButton`, so the setup function can attach a listener without querying the document. Refs are scoped to their component, which means a component only sees the elements inside its own root, not the whole page.

Apart from that scoping, the click listener and the `console.log()` call are just ordinary DOM code. This is the starting point for the rest of the tutorial: first do the work manually, then let HET remove the repetitive parts.

Relevant reference:

- [`registerComponent(name, setup)`](reference/api.md#registercomponentname-setup)
- [Component roots and mounting](reference/components.md#component-roots-and-mounting)
- [`het-ref`](reference/components.md#het-ref)

## 3. Clean up event listeners with `onCleanup`

This listener is attached during mount, so it should also be removed during unmount. `onCleanup()` registers a function HET will call when the component is destroyed.

```html
<section het-component="logger">
  <button type="button" het-ref="logButton">Log</button>
</section>

<script>
  HET.registerComponent('logger', ({ refs, onCleanup }) => {
    function handleClick() {
      console.log('Clicked');
    }

    refs.logButton.addEventListener('click', handleClick);

    onCleanup(() => {
      refs.logButton.removeEventListener('click', handleClick);
    });
  });
</script>
```

In a real application, components may be added and removed as the page changes. If setup creates event listeners, timers, subscriptions, or other resources, cleanup is where you tear them down again.

For this small example, the cleanup only removes the click listener. The pattern matters more than the size of the example: whenever setup creates something manually, cleanup should usually undo it manually.

`onCleanup()` is per component instance. If your application needs to shut HET down entirely, call `HET.destroy()`. That destroys mounted components, runs their cleanup callbacks, aborts in-flight enhanced requests, and removes HET-managed document and window listeners. This is mostly useful in tests, hot reload flows, or pages that mount and unmount HET manually.

Relevant reference:

- [Cleanup](reference/components.md#cleanup)
- [`destroy()`](reference/api.md#destroy)

## 4. Write to the DOM manually with `het-ref`

Refs are not only for inputs and buttons. Any element with `het-ref` becomes available in `setup`, which means you can use the same pattern to update output elements directly.

```html
<section het-component="statusButton">
  <button type="button" het-ref="button">Update status</button>
  <p het-ref="status">Waiting</p>
</section>

<script>
  HET.registerComponent('statusButton', ({ refs, onCleanup }) => {
    function handleClick() {
      refs.status.textContent = 'Clicked';
    }

    refs.button.addEventListener('click', handleClick);

    onCleanup(() => {
      refs.button.removeEventListener('click', handleClick);
    });
  });
</script>
```

The click handler decides when the text changes and what value it writes. HET is still only providing component boundaries, scoped refs, and lifecycle hooks. The state change and DOM update are both manual.

That is often a useful way to begin: if you can write the behavior in plain DOM code first, it becomes easier to see exactly which parts HET should later automate.

Relevant reference:

- [`het-ref`](reference/components.md#het-ref)

## 5. Store local state in `setup`

Once a component needs to remember something between clicks, the simplest place to put that value is a local variable inside `setup`. A render function reads that variable and pushes the current value into the DOM.

```html
<section het-component="counter">
  <button type="button" het-ref="button">+</button>
  <p het-ref="countText">0</p>
</section>

<script>
  HET.registerComponent('counter', ({ refs, onCleanup }) => {
    let count = 0;

    function render() {
      refs.countText.textContent = count;
    }

    function handleClick() {
      count += 1;
      render();
    }

    refs.button.addEventListener('click', handleClick);

    onCleanup(() => {
      refs.button.removeEventListener('click', handleClick);
    });
  });
</script>
```

This works, but the component now has several moving parts:

- local state
- a render function
- a listener
- cleanup

That combination is common in handwritten DOM code. The rest of the tutorial will remove those manual pieces one by one so the component becomes more declarative without skipping over what it is replacing.

## 6. Use signals for component state

Signals are HET's state primitive. Here, a local `count` signal holds the same value the local `count` variable held before, and an effect keeps the DOM in sync automatically whenever that signal changes.

```html
<section het-component="counter">
  <button type="button" het-ref="button">+</button>
  <p het-ref="countText">0</p>
</section>

<script>
  HET.registerComponent('counter', ({ refs, onCleanup }) => {
    const count = HET.signals.signal(0);

    const dispose = HET.signals.effect(() => {
      refs.countText.textContent = count.value;
    });

    function handleClick() {
      count.value += 1;
    }

    refs.button.addEventListener('click', handleClick);

    onCleanup(dispose);

    onCleanup(() => {
      refs.button.removeEventListener('click', handleClick);
    });
  });
</script>
```

The equivalent ESM JavaScript is:

```js
import { registerComponent } from './het.js';
import { effect, signal } from '@preact/signals-core';

registerComponent('counter', ({ refs, onCleanup }) => {
  const count = signal(0);

  const dispose = effect(() => {
    refs.countText.textContent = count.value;
  });

  function handleClick() {
    count.value += 1;
  }

  refs.button.addEventListener('click', handleClick);

  onCleanup(dispose);

  onCleanup(() => {
    refs.button.removeEventListener('click', handleClick);
  });
});
```

Signal values live on `.value`: reading `count.value` gets the current value, and assigning to it updates the signal. The effect reads `count.value`, so HET's signals system re-runs that effect each time the count changes and updates the paragraph automatically. The DOM update is now reactive instead of being driven by an explicit `render()` call.

The IIFE build exposes the common Preact Signals helpers on `HET.signals`: `signal`, `computed`, `effect`, `batch`, and `untracked`. This tutorial only needs `signal` and `effect`; use the other helpers the same way you would in Preact Signals code. See the [official Preact Signals documentation](https://preactjs.com/guide/v10/signals/) for details.

Relevant reference:

- [Signals](reference/components.md#signals)
- [Signal helpers](reference/api.md#signal-helpers)

## 7. Use `het-on` instead of `addEventListener`

Now that the state lives in a signal, we can remove the listener setup. `het-on` moves the event wiring into HTML.

```html
<section het-component="counter">
  <button type="button" het-on="click->increment">+</button>
  <p het-ref="countText">0</p>
</section>

<script>
  HET.registerComponent('counter', ({ refs, onCleanup }) => {
    const count = HET.signals.signal(0);

    const dispose = HET.signals.effect(() => {
      refs.countText.textContent = count.value;
    });

    onCleanup(dispose);

    return {
      increment() {
        count.value += 1;
      },
    };
  });
</script>
```

The button no longer needs `addEventListener()` or `onCleanup()`. `het-on="click->increment"` tells HET to listen for the button's `click` event and call the `increment()` method returned from setup. Any method that is called from a binding **must** be included in the object returned from the setup function.

Use method syntax for returned handlers:

```js
increment() {
  ...
}
```

HET calls returned methods with the methods object as `this`, so method syntax also allows one handler to call another with `this.otherMethod()`. This example does not need that yet, but it becomes useful as components grow.

Relevant reference:

- [`het-on`](reference/components.md#het-on)

## 8. Assign to signals directly in `het-on`

If an event handler only needs to set the value of a signal, `het-on` can perform the signal assignment itself.

```html
<section het-component="counter">
  <button type="button" het-on="click->count=count + 1">+</button>
  <p het-ref="countText">0</p>
</section>

<script>
  HET.registerComponent('counter', ({ refs, signals, onCleanup }) => {
    signals.count = HET.signals.signal(0);

    const dispose = HET.signals.effect(() => {
      refs.countText.textContent = signals.count.value;
    });

    onCleanup(dispose);
  });
</script>
```

`count=count + 1` is evaluated when the click happens, so there is no separate `increment()` function anymore. Setup is now only creating the signal and reflecting that signal into the DOM. In order to reference a signal by name in a binding, the signal **must** be assigned to the `signals` object that is passed into the setup function.

This also introduces the newer expression syntax. In assignment-style `het-on`, the right-hand side can be a limited JavaScript expression built from component signals and supported contextual values. Here the expression is just arithmetic, but the same syntax also supports comparisons, ternaries, logical operators, and simple unary operators. Note that we cannot use `count += 1` or `count++` here; the restricted subset of JavaScript excludes assignment operators like `+=` and `++`.

That expression support is what lets you keep small interactions in HTML without immediately dropping back to a custom method.

Relevant reference:

- [`het-on`](reference/components.md#het-on)
- [Limited JavaScript expressions](reference/components.md#limited-javascript-expressions)

## 9. Create signals from HTML with `het-seed`

Instead of creating a signal with an initial value using `signals.count = HET.signals.signal(0)`, we can declare a signal with an initial value using `het-seed`.

```html
<section het-component="counter" het-seed="count=0">
  <button type="button" het-on="click->count=count + 1">+</button>
  <p het-ref="countText">0</p>
</section>

<script>
  HET.registerComponent('counter', ({ refs, signals, onCleanup }) => {
    const dispose = HET.signals.effect(() => {
      refs.countText.textContent = signals.count.value;
    });

    onCleanup(dispose);
  });
</script>
```

`het-seed` handles that initialization step. By the time `setup` runs, `signals.count` already exists with its initial value of `0`, so we can reference it directly in the effect.

Seeding lets HTML provide the initial state for a component, which is especially helpful when you are enhancing server-rendered markup rather than generating everything on the client.

Relevant reference:

- [`het-seed`](reference/components.md#het-seed)

## 10. Bind `textContent` with `het-props`

`het-props` takes the value from a signal expression and writes it to a DOM property. Here it replaces the manual effect and the `textContent` assignment.

```html
<section het-component="counter" het-seed="count=0">
  <button type="button" het-on="click->count=count + 1">+</button>
  <p het-props="textContent=count"></p>
</section>

<script>
  HET.registerComponent('counter');
</script>
```

All three parts of the counter now live in HTML:

1. `het-seed` creates the signal
2. `het-on` updates it
3. `het-props` writes it to the DOM

This is the basic component data flow in declarative form:

1. a DOM event updates a signal
2. the output binding reacts to that signal
3. HET writes the new value into the element property

Note that there is no work to do in the setup function now, so we can omit it entirely.

Attributes and classes can also be bound using the same `target=expression` pattern:

- `het-props` writes DOM properties such as `textContent`, `value`, and `checked`
- `het-attrs` writes value-bearing attributes such as `aria-expanded`
- `het-bool-attrs` toggles boolean attribute presence, such as `disabled`
- `het-class` toggles classes based on expression truthiness

Relevant reference:

- [`het-props`](reference/components.md#het-props)
- [Output bindings](reference/components.md#output-bindings)

## 11. Use `het-text` for text output

`het-text` does the same job as `het-props="textContent=..."`, but it is specialized for text output and reads more directly.

```html
<section het-component="counter" het-seed="count=0">
  <button type="button" het-on="click->count=count + 1">+</button>
  <p het-text="count"></p>
</section>

<script>
  HET.registerComponent('counter');
</script>
```

`het-text="count"` is just sugar for `het-props="textContent=count"`.

Relevant reference:

- [`het-text`](reference/components.md#het-text)

## 12. Use an anonymous component when setup is unnecessary

Once the event update, signal creation, and output binding all live in HTML, a named component is no longer required. HET can still mount the root, but there is no JavaScript setup function left to register.

```html
<section het-component het-seed="count=0">
  <button type="button" het-on="click->count=count + 1">+</button>
  <p het-text="count"></p>
</section>

<script src="het.iife.js"></script>
<script>
  HET.init();
</script>
```

This is the same fully declarative counter as the previous step, just without any registered setup function. Anonymous components are a good fit when the entire behavior can be described with declarative bindings.

If you still want a component name for legibility, you can keep one, but it is no longer required for HET to do its work.

Relevant reference:

- [Component roots and mounting](reference/components.md#component-roots-and-mounting)

## 13. Format output with expressions

So far the output has been a raw signal value. Output bindings can also do light formatting, as long as the expression stays within HET's limited expression syntax.

```html
<section het-component het-seed="count=0">
  <button type="button" het-on="click->count=count + 1">+</button>
  <p het-text="count === 1 ? '1 click' : count + ' clicks'"></p>
</section>
```

This is where the expression syntax becomes especially useful. Instead of creating a method or a separate derived signal just to format display text, the binding can express the simple rule directly: singular text for `1`, plural text otherwise.

Output bindings can use signal-based expressions such as:

- arithmetic
- comparisons
- `&&` and `||`
- ternaries
- unary `!` and `-`

The expression language is intentionally limited. It is meant for small, local transformations that are easy to read in markup. If the logic stops feeling obvious in one line, that is a sign to move it back into setup code.

Relevant reference:

- [Limited JavaScript expressions](reference/components.md#limited-javascript-expressions)
- [Output bindings](reference/components.md#output-bindings)

## 14. Binding form controls

The same pattern works for form controls. Here the input already has an initial value in the HTML, `het-seed` reads that value into a signal during mount, `het-props` pushes later signal state back into the control, and `het-on` reads user input back out of the event target.

```html
<section het-component>
  <label>
    Message
    <input
      type="text"
      value="Nothing yet"
      het-seed="message=$props.value"
      het-props="value=message"
      het-on="input->message=$target.value">
  </label>

  <button type="button" het-on="click->message=''">Reset</button>
  <p het-text="message"></p>
</section>
```

`het-seed="message=$props.value"` handles the initial state by reading the input's current `value` property during mount and creating the `message` signal from it. `$props` provides access to a snapshot of all of the element's properties, and can be used in expressions belonging to `het-seed`, `het-sync` or assignment-style `het-on` attributes. In addition to `$props`, those expressions can also reference the following contextual snapshots:
- `$attrs` provides access to attribute values. Kebab case attributes such as `aria-label` can be accessed by converting the attribute name to camel case, e.g. `$attrs.ariaLabel` or `$attrs["ariaLabel"]`. Use string literal bracket access for attribute names that cannot be written with dot access, e.g. `$attrs["foo:bar"]`.
- `$boolAttrs` provides true/false values reflecting on the presence/absence of an attribute. If the attribute exists on the element it returns `true`, if not it returns `false`. It uses the same attribute name mapping as `$attrs`.
- `$classes` provides true/false values reflecting on the presence/absence of a class. Use `$classes["some-class"]` for class names that cannot be written with dot access.
- `$text` is sugar for `$props.textContent`.

Output bindings such as `het-text`, `het-props`, `het-attrs`, `het-bool-attrs`, and `het-class` use signal expressions and cannot read contextual values directly.

`het-on="input->message=$target.value"` assigns the value of the input event target element's `value` property to the `message` signal when the event is dispatched. `$target` is another contextual value available in assignment-style `het-on` attribute expressions. Other event based contextual values are:
- `$event` provides access to the full event object.
- `$currentTarget` is sugar for `$event.currentTarget`.

Relevant reference:

- [`het-props`](reference/components.md#het-props)
- [`het-on`](reference/components.md#het-on)
- [Contextual values](reference/components.md#contextual-values)

## 15. Use `het-model` for standard form controls

`het-model` packages the explicit form-control pattern into one attribute for standard form controls. It stands in for the `het-seed`, `het-props`, and `het-on` bindings from the previous step.

```html
<section het-component>
  <label>
    Message
    <input type="text" value="Nothing yet" het-model="message">
  </label>

  <button type="button" het-on="click->message=''">Reset</button>
  <p het-text="message"></p>
</section>
```

Typed variants move coercion into the declaration:

```html
<input het-model:int="quantity" value="7">
<input het-model:float="price" value="3.5">
<input type="checkbox" het-model:bool="isEnabled">
```

HET infers:

- `value` plus `input` events for most controls
- `checked` plus `change` events for checkbox and radio inputs

Use `het-model` when the control matches HET's standard form conventions. Use separate `het-seed`, `het-props`, and `het-on` bindings when you need something more explicit or unusual.

Relevant reference:

- [`het-model`](reference/components.md#het-model)

## 16. Parse DOM values with conversion helpers

DOM values are usually strings. When a seeded or event-assigned signal should hold a number or boolean instead, use HET's conversion helpers inside the expression.

```html
<output het-component het-seed="count=$int($text)" het-text="count">0</output>
```

```html
<section het-component
  data-price="3.5"
  data-enabled="true"
  het-seed="price=$float($attrs.dataPrice); enabled=$bool($attrs.dataEnabled)">
  <label>
    Quantity
    <input
      type="number"
      value="7"
      het-seed="quantity=$int($props.value)"
      het-on="input->quantity=$int($target.value)">
  </label>

  <p het-text="quantity * price"></p>
  <p het-text="enabled ? 'Enabled' : 'Disabled'"></p>
</section>
```

The conversion helpers are:

- `$int(value)` parses an integer
- `$float(value)` parses a floating-point number
- `$bool(value)` treats only `true` and `"true"` as true

These helpers work anywhere expressions are supported. They are especially useful in `het-seed`, `het-sync`, and assignment-style `het-on`, where contextual snapshots such as `$text`, `$props`, `$attrs`, and `$target` often start as strings.

`het-sync` is the related feature to use when DOM snapshots can change after mount. `het-seed` reads once during mount; `het-sync` reads during mount and again whenever a `het:sync` event bubbles through the component subtree. This is useful whenever anything outside the component, such as the HET requests module, updates the DOM and those changes need to be reflected in component state.

Relevant reference:

- [`het-seed`](reference/components.md#het-seed)
- [`het-sync`](reference/components.md#het-sync)
- [Contextual functions](reference/components.md#contextual-functions)

## 17. Use `het-on` modifiers

Some event handlers need event options or small event-policy rules in addition to the handler itself. `het-on` supports modifiers for those cases.

```html
<section het-component="searchBox">
  <form het-on="submit.prevent->submit">
    <label>
      Search
      <input
        type="search"
        het-seed="query=$props.value"
        het-on="input.debounce(300)->query=$target.value">
    </label>

    <p het-text="query"></p>
    <button type="submit">Search</button>
  </form>
</section>

<script>
  HET.registerComponent('searchBox', ({ signals }) => {
    return {
      submit() {
        console.log(`Searching for ${signals.query.value}`);
      },
    };
  });
</script>
```

`submit.prevent->submit` calls `preventDefault()` before the `submit()` method runs. `input.debounce(300)->query=$target.value` waits until input has settled for 300 milliseconds before assigning the latest value to `query`.

Other supported modifiers are:

- `stop`: call `stopPropagation()` before running the handler
- `once`: remove the listener after the first matching event
- `capture`: listen during the capture phase instead of the bubble phase
- `throttle(ms)`: run at most once during each interval
- `esc`: only run for the Escape key
- `enter`: only run for the Enter key
- `space`: only run for the Space key

Keyboard modifiers are usually paired with keyboard events, for example `keydown.enter->submit`.

Relevant reference:

- [`het-on`](reference/components.md#het-on)

## 18. Share state with `het-exports` and `het-imports`

Signals are local to one component by default. When a descendant component needs to use state owned by an ancestor, the ancestor can export selected signals and the descendant can import them.

```html
<section het-component="searchPage" het-exports="query">
  <input type="search" value="Ada" het-model="query">

  <aside het-component="searchSummary" het-imports="summaryQuery=query">
    <p>Current search: <span het-text="summaryQuery"></span></p>
  </aside>
</section>

<script>
  HET.registerComponent('searchPage');
  HET.registerComponent('searchSummary');
</script>
```

`het-exports="query"` exposes the parent's `query` signal to descendants. `het-imports="summaryQuery=query"` imports that signal into the child component using the local name `summaryQuery`.

If the local name and exported name are the same, the import can be shorter:

```html
<aside het-component="searchSummary" het-imports="query">
  <p het-text="query"></p>
</aside>
```

When multiple ancestors export the same signal name, HET imports from the nearest matching ancestor.

Relevant reference:

- [`het-exports`](reference/components.md#het-exports)
- [`het-imports`](reference/components.md#het-imports)

## 19. Conditionally mount DOM with `het-if`

Visibility bindings keep DOM mounted. Structural templates create and destroy component instances. Use `het-if` when the component should only exist while a signal is truthy.

```html
<section het-component="detailsToggle">
  <button type="button" het-on="click->toggleDetails">
    Toggle details
  </button>

  <template het-if="details">
    <article het-component="detailsPanel">
      <p het-text="message"></p>
    </article>
  </template>
</section>

<script>
  HET.registerComponent('detailsToggle', ({ signals }) => {
    signals.details = HET.signals.signal(null);

    return {
      toggleDetails() {
        signals.details.value = signals.details.value
          ? null
          : { message: HET.signals.signal('More details') };
      },
    };
  });

  HET.registerComponent('detailsPanel');
</script>
```

`het-if="details"` mounts the template root when `details.value` is truthy and removes it when `details.value` is falsy. The `toggleDetails()` method assigns either `null` or an object of signals. When the value is an object, that object's signal properties are forwarded into the cloned component root, so `detailsPanel` can use `message`.

Structural templates have stricter rules than ordinary markup:

- put `het-if` on a `<template>`
- include exactly one root element inside the template
- make that root element a component

Use ordinary visibility bindings such as `het-bool-attrs="hidden=isHidden"` when the DOM should stay mounted.

Relevant reference:

- [`het-if`](reference/components.md#het-if)
- [Structural templates](reference/components.md#structural-templates)

## 20. Render repeated component instances with `het-for`

`het-for` uses the same structural-template rules as `het-if`, but the source signal must hold an array. Each array item must be an object whose properties are signals.

```html
<section het-component="todoList">
  <ul>
    <template het-for="items">
      <li het-component="todoItem">
        <span het-text="label"></span>
      </li>
    </template>
  </ul>
</section>

<script>
  function todo(label) {
    return {
      label: HET.signals.signal(label),
    };
  }

  HET.registerComponent('todoList', ({ signals }) => {
    signals.items = HET.signals.signal([
      todo('Write HTML'),
      todo('Enhance behavior'),
    ]);
  });

  HET.registerComponent('todoItem');
</script>
```

Each item object is forwarded into its cloned component root, so every `todoItem` receives its own `label` signal.

The source signal is still just a signal. To add an item, assign a new array:

```js
signals.items.value = [
  ...signals.items.value,
  todo('Ship it'),
];
```

Relevant reference:

- [`het-for`](reference/components.md#het-for)
- [Structural templates](reference/components.md#structural-templates)

## 21. Delay structural teardown

Structural clones are normally destroyed as soon as `het-if` or `het-for` removes them. If you need time for a CSS exit animation, put `het-unmount-delay` on the root element inside the template.

```html
<template het-if="notification">
  <article
    het-component="notificationCard"
    het-unmount-delay="200"
    class="notification">
    <p het-text="message"></p>
  </article>
</template>
```

When `notification` becomes falsy, HET keeps the cloned `notificationCard` mounted for 200 milliseconds before destroying it.

The same behavior can be configured globally:

```js
HET.init({
  structuralUnmountDelay: 200,
  structuralUnmountClass: 'is-exiting',
});
```

`het-unmount-delay` only applies to structural clones created by `het-if` and `het-for`. It is exit-only: it does not add enter hooks or affect ordinary component teardown.

Relevant reference:

- [`het-unmount-delay`](reference/components.md#het-unmount-delay)
- [`structuralUnmountDelay`](reference/api.md#structuralunmountdelay)
- [`structuralUnmountClass`](reference/api.md#structuralunmountclass)

## 22. Avoid initial flicker with `het-mount-pending`

Declarative bindings run when a component mounts. If the pre-mounted HTML would briefly show the wrong state, add `het-mount-pending` to hide the component until the mount batch finishes.

```html
<style>
  [het-mount-pending] {
    visibility: hidden;
  }
</style>

<section het-component het-mount-pending het-seed="count=0">
  <button type="button" het-on="click->count=count + 1">+</button>
  <p het-text="count"></p>
</section>
```

HET removes `het-mount-pending` automatically after mounting. HET does not provide CSS for this marker, so the page needs to define any hiding rule. Prefer `visibility: hidden` over `display: none` when hidden content should preserve layout.

Relevant reference:

- [`het-mount-pending`](reference/components.md#het-mount-pending)
