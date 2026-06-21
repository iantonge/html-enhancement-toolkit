# Components Tutorial

This tutorial will walk you through building HET components starting from the basics and working up to more advanced features. HET is backend framework agnostic, and you are free to use whatever server-side technology you like for this tutorial; even a plain HTML file will be fine.

The code samples will be using the standalone IIFE build, which is the simplest way to get started. If you want to use the ESM bundle instead you'll need to either set up a build pipeline or configure an import map. The component code will be almost identical regardless of which version you use, but where there are differences they'll be called out.

## 1. Load HET on the page

The first thing to do is reference the HET javascript file on your page, and then initialize it with `HET.init()`.

```html
<script src="het.iife.js"></script>
<script>HET.init();</script>
```

For the ESM build, the equivalent javascript is:

```js
import { init } from './het.js';

init();
```

For components, `HET.init()` scans the page and mounts anything it recognizes. It also initializes HET's request enhancement behavior. Various configuration options can be passed into `HET.init()`, but we'll be sticking with the defaults for this tutorial.

Reference documentation:

- [`init(config)`](reference/api.md#initconfig)

## 2. Register a component

We'll start with something simple. This component is just a button you can click to open an alert dialog.

```html
<section het-component="alerter">
  <button type="button" het-ref="alertButton">Alert</button>
</section>

<script src="het.iife.js"></script>
<script>
  HET.registerComponent('alerter', ({ refs }) => {
    function handleClick() {
      alert('Clicked');
    }

    refs.alertButton.addEventListener('click', handleClick);
  });
</script>
<script>HET.init();</script>
```

The equivalent ESM javascript is:

```js
import { init, registerComponent } from './het.js';

registerComponent('alerter', ({ refs }) => {
  function handleClick() {
    alert('Clicked');
  }

  refs.alertButton.addEventListener('click', handleClick);
});

init();
```

The first thing to draw your attention to is `het-component="alerter"` and `registerComponent('alerter', ...)`. When you add `het-component` to an element you are telling HET that element is the root of a component. In this example, we are also telling HET that the name of this component is "alerter", so HET will look for a component that has been registered with that name. Components are registered with the `registerComponent` function. The first argument is the component name, which must match the name in the `het-component` attribute, and the second argument is the component's setup function which we'll look at shortly.

Try changing the names in `het-component` and `registerComponent` so that they do not match anymore and reload the page. Using your browser dev tools, check the javascript console and you should find the error message "HET Error: Component is not registered". The default error handler also logs `error.cause`, a context object with a reference to the root component element and the unregistered component name. Almost all HET component errors include similar contextual data to help diagnose the root cause of the error. As you progress through the tutorial, try to break the samples in different ways to familiarize yourself with the kinds of errors you receive.

The setup function runs once when each component instance mounts. It is where you perform any setup logic that your component requires. The setup function is passed a context object as an argument which has various properties that can be useful when building a component, in this case we're using destructuring to pull out the `refs` property from the context object since that's the only property we need right now. We'll get into the details of the `refs` property next, while the other context properties will be covered later in the tutorial.

By adding `het-ref="alertButton"` to the button element, we're telling HET that we want a reference to this element to be made available in our component setup function. As you may have guessed, this is provided on the `refs` property of the context object passed into the setup function. We can then use normal imperative javascript code to wire up an event listener with `refs.alertButton.addEventListener('click', handleClick);`. Refs are scoped only to their component, meaning a component cannot access refs belonging to any parent, child or sibling components.

Reference documentation:

- [`registerComponent(name, setup)`](reference/api.md#registercomponentname-setup)
- [Component roots and mounting](reference/components.md#component-roots-and-mounting)
- [`het-ref`](reference/components.md#het-ref)
- [`errors`](reference/errors.md)

## 3. Cleaning up resources

In a real application, components may be added and removed as the page is updated. If event listeners, timeouts, third party javascript widgets, or any other resources are created in `setup()` then they need to be disposed of properly when the component unmounts. The `onCleanup()` function on the context object passed into `setup()` is for registering callback functions that are called when the component is unmounted.

```html
<section het-component="alerter">
  <button type="button" het-ref="alertButton">Alert</button>
</section>

<script src="het.iife.js"></script>
<script>
  HET.registerComponent('alerter', ({ refs, onCleanup }) => {
    function handleClick() {
      alert('Clicked');
    }

    refs.alertButton.addEventListener('click', handleClick);

    onCleanup(() => {
      refs.alertButton.removeEventListener('click', handleClick);
    });
  });
</script>
<script>HET.init();</script>
```

For this example we only need to register one callback function to remove the event listener. You can call `onCleanup()` multiple times and register as many callbacks as you need to. All registered callbacks will be run when the component is unmounted.

Callbacks registered with `onCleanup()` only run when a specific instance of a component is unmounted. If you need to shut HET down entirely, call `HET.destroy()`. That destroys all mounted components, runs their cleanup callbacks, and disposes of all internal HET resources.

Try adding a `console.log('destroying component');` or `alert('destroying component');` to the cleanup callback, and trigger it in the following ways:
1. Open your browser's dev tools and manually run `HET.destroy()`. If you are using the ESM build, you could try manually wiring up a button outside of a HET component to call `destroy()`.
2. Open your browser's dev tools and manually run `document.querySelector('[het-component=alerter]').remove()` or otherwise remove the element from the page.

In both cases you should see your message logged to the console or your alert fire. If you ran `HET.destroy()` you can also try clicking on the button now and confirming that the alert is no longer popping up.

Reference documentation:

- [Cleanup](reference/components.md#cleanup)
- [`destroy()`](reference/api.md#destroy)

## 4. Write to the DOM

We're already using refs to attach an event listener, but of course you can also write any imperative javascript to work with the DOM.

```html
<section het-component="statusButton">
  <button type="button" het-ref="button">Update status</button>
  <p het-ref="status">Waiting</p>
</section>

<script src="het.iife.js"></script>
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
<script>HET.init();</script>
```

This example adds another ref and writes to the element's `textContent` property. We're not really seeing anything new here, just extending what we've already seen.

Reference documentation:

- [`het-ref`](reference/components.md#het-ref)

## 5. Adding local state

Most components will require some kind of internal state. The simplest way to achieve that is to add a local variable inside `setup`. The click handler updates that variable and writes the current value into the DOM.

```html
<section het-component="counter">
  <button type="button" het-ref="button">+</button>
  <p het-ref="countText">0</p>
</section>

<script src="het.iife.js"></script>
<script>
  HET.registerComponent('counter', ({ refs, onCleanup }) => {
    let count = 0;

    function handleClick() {
      count += 1;
      refs.countText.textContent = count;
    }

    refs.button.addEventListener('click', handleClick);

    onCleanup(() => {
      refs.button.removeEventListener('click', handleClick);
    });
  });
</script>
<script>HET.init();</script>
```

This works fine in a simple component like this, but keeping track of when state is mutated and ensuring the UI is up to date can get tricky. In the next section we'll explore a better way to manage mutable state.

## 6. Using signals for component state

HET uses Preact Signals for storing mutable component state. Signals allow us to describe what should happen when state is mutated so we don't need to manage it manually ourselves. There is a link to the official Preact Signals documentation at the bottom of this section.

```html
<section het-component="counter">
  <button type="button" het-ref="button">+</button>
  <p het-ref="countText">0</p>
</section>

<script src="het.iife.js"></script>
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
<script>HET.init();</script>
```

The equivalent ESM javascript is:

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

We create a new signal with `HET.signals.signal(0)`. The `0` is the initial value of the signal. In this case it's a number, but it could be any javascript value, such as a string or an object. Once the signal is created we write to it, and read from it, using `.value` instead of using `count` directly. This is why we can now say `const count = ...` rather than `let count = ...`.

We can also set up a callback that runs once immediately, then re-runs any time the value of `count` changes using `HET.signals.effect()`. In this case we're saying that any time the `count` signal changes, we want to write the new value of the signal into `refs.countText.textContent`. Note that we do not need to explicitly call this effect in the `handleClick` function, all we need to do is update the value of the signal, and the effect callback runs automatically. It's also important to note that `HET.signals.effect()` returns a dispose function which needs to be registered as part of the component cleanup with `onCleanup()`.

There's much more to signals than just `signal()` and `effect()`. The IIFE build exposes the signals API through `HET.signals` which includes: `signal`, `computed`, `effect`, `batch`, and `untracked`. See the [official Preact Signals documentation](https://github.com/preactjs/signals) for more details.

Reference documentation:

- [Signals](reference/components.md#signals)
- [Signal helpers](reference/api.md#signal-helpers)

## 7. Use `het-on` instead of `addEventListener`

Another improvement we can make is to remove the manual event wiring. The imperative approach works, but it's boilerplate heavy and adds noise to the setup function. Instead, we can use the `het-on` attribute to declare the event wiring.

```html
<section het-component="counter">
  <button type="button" het-on="click->increment">+</button>
  <p het-ref="countText">0</p>
</section>

<script src="het.iife.js"></script>
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
<script>HET.init();</script>
```

`het-on="click->increment"` tells HET to listen for the button's `click` event and call the `increment()` method returned from setup.

IMPORTANT: Any method referenced by name from a binding **must** be included in the object returned from the setup function.

The event listener is automatically wired up when the component is mounted, and automatically removed when the component is unmounted. This means we can remove the manual call to `addEventListener()` and associated cleanup callback, and the button no longer needs a `het-ref` attribute.

Prefer method syntax for returned handlers, especially when one handler needs to call another handler with `this`:

```js
increment() {
  ...
}
```

HET calls returned methods with the methods object as `this`, so method syntax also allows one handler to call another with `this.otherMethod()`. This example does not need that yet, but it becomes useful as components grow.

Reference documentation:

- [`het-on`](reference/components.md#het-on)

## 8. Assign to signals directly in `het-on`

The next improvement we can make is to remove the `inrement` method entirely. As an alternative to calling a method, `het-on` can assign a signal value directly from the result of an expression. In this case we're just incrementing a number, so the expression is quite simple and can be inlined.

```html
<section het-component="counter">
  <button type="button" het-on="click->count=count + 1">+</button>
  <p het-ref="countText">0</p>
</section>

<script src="het.iife.js"></script>
<script>
  HET.registerComponent('counter', ({ refs, signals, onCleanup }) => {
    signals.count = HET.signals.signal(0);

    const dispose = HET.signals.effect(() => {
      refs.countText.textContent = signals.count.value;
    });

    onCleanup(dispose);
  });
</script>
<script>HET.init();</script>
```

It's important to understand the format here is not `het-on="expression"`. The format is `het-on="signal=expression"`. This format is referred to as assignment-style in this tutorial. Expressions are not arbitrary javascript, they are an intentionally restricted subset of javascript and assignment is not allowed. This is why we cannot use `het-on="count++"` or `het-on="count += 1"`. Expressions are limited to pure, single line code snippets. You can use arithmetic operators, comparison operators, logical operators, and ternaries. Code blocks, arbitrary function calls, or any other operations are not supported.

Signals are referenced by name only in expressions. `.value` is not used when reading from signal values, nor is it used in the `signal=` portion of the binding.

As you might expect, `count + 1` is evaluated when the click happens. There is no longer a need for a separate `increment()` function, which further reduces boilerplate and noise in the setup function.

IMPORTANT: In order to reference a signal by name in a binding, the signal **must** be assigned to the `signals` object that is passed into the setup function.

Reference documentation:

- [`het-on`](reference/components.md#het-on)
- [Limited javascript expressions](reference/components.md#limited-javascript-expressions)

## 9. Create signals from HTML with `het-seed`

Instead of creating the `count` signal with an initial value using `signals.count = HET.signals.signal(0)`, we can declare the signal with an initial value using `het-seed`.

```html
<section het-component="counter" het-seed="count=0">
  <button type="button" het-on="click->count=count + 1">+</button>
  <p het-ref="countText">0</p>
</section>

<script src="het.iife.js"></script>
<script>
  HET.registerComponent('counter', ({ refs, signals, onCleanup }) => {
    const dispose = HET.signals.effect(() => {
      refs.countText.textContent = signals.count.value;
    });

    onCleanup(dispose);
  });
</script>
<script>HET.init();</script>
```

`het-seed` initializes the signal and assings it to the `signals` object before `setup()` is called. The initial value for the signal is the result of the expression on the RHS, in this case the literal number `0`. By the time `setup()` runs, `signals.count` already exists with its initial value of `0`, so we can reference it directly in the effect.

Reference documentation:

- [`het-seed`](reference/components.md#het-seed)

## 10. Bind `textContent` with `het-props`

The last thing is the `setup()` function is the effect we are creating and assocaited call to `onCleanup()`. We can remove those too by using the `het-props` attribute.

```html
<section het-component="counter" het-seed="count=0">
  <button type="button" het-on="click->count=count + 1">+</button>
  <p het-props="textContent=count"></p>
</section>

<script src="het.iife.js"></script>
<script>
  HET.registerComponent('counter');
</script>
<script>HET.init();</script>
```

`het-props` creates an effect that takes the result of an expression and writes it to the specified DOM property. When signals referenced in the expression are mutated, the expression runs again just like it does in the manual version. The dispose function is also automatically called when the component in unmounted, just like the manual version. The sample code here is functionally identical to previous example, but now without any work required in the `setup()` function.

Since there is no work to do in the setup function now, we can omit it entirely.

Attributes and classes can also be bound using the same `target=expression` pattern:

- `het-props` writes DOM properties such as `textContent`, `value`, and `checked`
- `het-attrs` writes value-bearing attributes such as `aria-expanded`
- `het-bool-attrs` toggles boolean attribute presence, such as `disabled`
- `het-class` toggles classes based on expression truthiness

Reference documentation:

- [`het-props`](reference/components.md#het-props)
- [Output bindings](reference/components.md#output-bindings)

## 11. Use `het-text` for text output

For setting the text content of an element, even `het-props="textContent=..."` can feel like unnecessary boilerplate. Specifically for text, `het-text` exists for settinge setting text content.

```html
<section het-component="counter" het-seed="count=0">
  <button type="button" het-on="click->count=count + 1">+</button>
  <p het-text="count"></p>
</section>

<script src="het.iife.js"></script>
<script>
  HET.registerComponent('counter');
</script>
<script>HET.init();</script>
```

`het-text="count"` is just sugar for `het-props="textContent=count"`.

Reference documentation:

- [`het-text`](reference/components.md#het-text)

## 12. Use an anonymous component when setup is unnecessary

As we have seen, a named component can be registered without a setup function if one is not required. Anonymous components allow a component to be mounted without anything to be registered at all. 

```html
<section het-component het-seed="count=0">
  <button type="button" het-on="click->count=count + 1">+</button>
  <p het-text="count"></p>
</section>

<script src="het.iife.js"></script>
<script>HET.init();</script>
```

To make a component anonymous, simply omit value of the `het-component` attribute.

If you still want a component name for legibility you can keep one, but it is entirely optional.

Reference documentation:

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

Reference documentation:

- [Limited javascript expressions](reference/components.md#limited-javascript-expressions)
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

Reference documentation:

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
- boolean `checked` values plus `change` events for single checkboxes
- arrays of checked input values for checkbox groups that share the same `het-model`
- selected input values for radio groups that share the same `het-model`

Use `het-model` when the control matches HET's standard form conventions. Use separate `het-seed`, `het-props`, and `het-on` bindings when you need something more explicit or unusual.

Reference documentation:

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

Reference documentation:

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

Reference documentation:

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

Reference documentation:

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

Reference documentation:

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

Reference documentation:

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

Reference documentation:

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

Reference documentation:

- [`het-mount-pending`](reference/components.md#het-mount-pending)
