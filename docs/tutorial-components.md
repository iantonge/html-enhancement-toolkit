# Components Tutorial

The goal of this tutorial is to take you on a tour of the components module, building from simple examples to more advanced usage. We will use the standalone script build throughout, so you can follow along without a build pipeline. If you are using the ESM bundle instead, the same component concepts apply, but the import syntax is different.

## 1. Load HET on the page

Start by including the standalone HET script and calling `HET.init()`.

```html
<script src="het.iife.js"></script>
<script>
  HET.init();
</script>
```

`HET.init()` scans the page for HET panes and components, then mounts anything it recognizes.

Named components **must** be registered before `HET.init()` runs. If HET initializes before a component is registered, it cannot mount an existing root for that component.

Relevant reference:

- [`init(config)`](reference/api.md#initconfig)

## 2. Register your first component

We'll start with a simple component with a button that updates a message on the page.

```html
<section het-component="message-status">
  <button type="button" het-ref="showButton">Show message</button>
  <p het-ref="statusOutput">Nothing yet</p>
</section>

<script src="het.iife.js"></script>
<script>
  HET.registerComponent('message-status', (context) => {
    console.log('message-status setup');

    const handleClick = () => {
      console.log('message-status click');
      context.refs.statusOutput.textContent = `This message came from HET at ${new Date(Date.now())}`;
    };

    context.refs.showButton.addEventListener('click', handleClick);

    context.onCleanup(() => {
      console.log('message-status cleanup');
      context.refs.showButton.removeEventListener('click', handleClick);
    });
  });

  HET.init();
</script>
```

There are four key pieces:

- `het-component="message-status"` marks the component root
- `het-ref="showButton"` and `het-ref="statusOutput"` expose those elements to setup code
- `registerComponent('message-status', setup)` registers setup code under the name used by the root
- `onCleanup(...)` registers teardown work for anything setup created manually

HET passes a context object to the setup function. Elements marked with `het-ref` are added to `context.refs` using the name in the attribute. Here, `het-ref="statusOutput"` makes the paragraph available as `context.refs.statusOutput`.

Refs are scoped to their component. A component's `refs` object does not include elements inside a nested component root.

In a real application components may be added and removed. When a component is removed we don't want to keep any unnecessary resources, such as the event listener in this case, hanging around. For this reason we're using the `onCleanup` function to register a callback that will run when the component is unmounted. We can trigger this manually in a couple of ways for this example:

- Open the browser dev tools and manually remove the `<section het-component="message-status">` element. HET will detect that the component has been removed from the page and unmount it.
- Open the browser dev tools and manually run `HET.destroy()` in the javascript console. This disables HET entirely on the page and unmounts all mounted components.

In both cases you should see the `message-status cleanup` message appear in the console output.

Relevant reference:

- [`registerComponent(name, setup)`](reference/api.md#registercomponentname-setup)
- [`destroy()`](reference/api.md#destroy)
- [`het-component`](reference/components.md#het-component)
- [`het-ref`](reference/components.md#het-ref)

## 3. Replace manual listeners with `het-on`

The previous example is fine, but the click listener setup is verbose. The `het-on` attribute lets HET handle all the setup and teardown plumbing for you:

```html
<section het-component="message-status">
  <button type="button" het-on="click->showMessage">Show message</button>
  <p het-ref="statusOutput">Nothing yet</p>
</section>

<script src="het.iife.js"></script>
<script>
  HET.registerComponent('message-status', (context) => {
    return {
      showMessage() {
        context.refs.statusOutput.textContent = `This message came from HET at ${new Date(Date.now())}`;
      },
    };
  });

  HET.init();
</script>
```

The notable changes are:

- `het-on="click->showMessage"` connects the button's `click` event to a component method
- The setup function returns an object containing the methods that event bindings can call.
- `showMessage()` can still use refs from the setup context
- HET handles the listener setup and teardown for this binding

Use method syntax for returned handlers:

```js
showMessage() {
  ...
}
```

HET calls returned methods with the methods object as `this`, so method syntax also allows one handler to call another with `this.otherMethod()`. This isn't strictly necessary for this component, but it's a good habit to get in to that will pay dividends in more advanced components.

Relevant reference:

- [`registerComponent(name, setup)`](reference/api.md#registercomponentname-setup)
- [`het-on`](reference/components.md#het-on)

## 4. Add state and reactive output

The previous example writes directly to the paragraph. That works, but the displayed message represents component state. HET uses [Preact Signals](https://github.com/preactjs/signals/blob/main/packages/core/README.md) for reactive state. A signal is an object that holds a value and notifies anything using it when that value changes. You can read or update a signal's current value through its `.value` property. The IIFE build used in this tutorial exposes the Preact Signals API through `HET.signals`.

Add a signal for the current status message and bind it to the paragraph:

```html
<section het-component="message-status">
  <button type="button" het-on="click->showMessage">Show message</button>
  <p het-props="textContent=statusMessage"></p>
</section>

<script src="het.iife.js"></script>
<script>
  HET.registerComponent('message-status', ({ signals }) => {
    signals.statusMessage = HET.signals.signal('Nothing yet');

    return {
      showMessage() {
        signals.statusMessage.value = `This message came from HET at ${new Date(Date.now())}`;
      },
    };
  });

  HET.init();
</script>
```

The setup context also contains a `signals` object. Signals used by the component's bindings must be added to this object. By adding `statusMessage` to `signals`, it becomes state owned by this component and can be referenced by name in the HTML binding.

This example uses modern JavaScript destructuring in the setup function parameter:

```js
({ signals }) => {
  // ...
}
```

This extracts `signals` from the context object, avoiding the more repetitive `context.signals`. The rest of this tutorial destructures the context properties that each setup function needs.

`het-props="textContent=statusMessage"` writes the signal value into the paragraph's `textContent` property. When `showMessage()` changes `signals.statusMessage.value`, HET updates the paragraph automatically.

The paragraph no longer needs `het-ref`: the output binding connects it to the signal declaratively.

This is the basic component data flow:

1. a DOM event calls a component method
2. the method updates a signal
3. an output binding writes the new signal value into the paragraph element's `textContent` property.

Relevant reference:

- [`registerComponent(name, setup)`](reference/api.md#registercomponentname-setup)
- [Signals](reference/components.md#signals)
- [Signal helpers](reference/api.md#signal-helpers)
- [Output bindings](reference/components.md#output-bindings)

## 5. Using het-text

`het-props` is useful when you need to name a DOM property explicitly. Since setting text on an element is a common task, `het-text` is provided as a convenience:

```html
<section het-component="message-status">
  <button type="button" het-on="click->showMessage">Show message</button>
  <p het-text="statusMessage"></p>
</section>
```

`het-text="statusMessage"` is just sugar for `het-props="textContent=statusMessage"`.

Relevant reference:

- [`het-text`](reference/components.md#het-text)

## 6. Let user input update a signal

When an event only needs to assign a value to a signal, `het-on` can use assignment syntax instead of calling a component method:

```html
<section het-component="message-status">
  <label>
    Message
    <input
      type="text"
      het-props="value=statusMessage"
      het-on="input->statusMessage=prop:value">
  </label>

  <p het-text="statusMessage"></p>
</section>

<script src="het.iife.js"></script>
<script>
  HET.registerComponent('message-status', ({ signals }) => {
    signals.statusMessage = HET.signals.signal('Nothing yet');
  });

  HET.init();
</script>
```

`input->statusMessage=prop:value` breaks down like this:

- `input->`: when the input element dispatches an `input` event ...
- `statusMessage=`: assign a value to the `statusMessage` signal.
- `prop:`: The value to be assigned comes from a property of the input element ...
- `value`: and the name of the property is `value`.

This is different from the `het-on` binding we saw earlier, which called a component method. The two forms allowed for a `het-on` binding are:

- method form: `eventName->methodName`
- assignment form: `eventName->signalName=source`

The assignment source can be a DOM read such as `prop:value`, or another signal owned by the component:

- DOM source: `input->statusMessage=prop:value`
- signal source: `click->statusMessage=otherMessage`

DOM read sources support several prefixes depending on what you want to read. In a `het-on` assignment, an unprefixed source is treated as the name of a signal. Other bindings use different defaults, as described in the read-sources reference.

Note also that we are not returning a methods object from the setup function now. If your component does not require any methods, you don't need to return anything.

Relevant reference:

- [`het-on`](reference/components.md#het-on)
- [Read sources](reference/components.md#read-sources)

## 7. Initialize a signal from the DOM with `het-seed`

So far, setup code has created `statusMessage` with a fixed initial value. Components often enhance server-rendered HTML that already contains the initial state. We can add a normal server rendered default value by adding `value="Nothing yet"` to the input. We can then use `het-seed` to create the signal from that property:

```html
<section het-component="message-status">
  <label>
    Message
    <input
      type="text"
      value="Nothing yet"
      het-props="value=statusMessage"
      het-on="input->statusMessage=prop:value"
      het-seed="statusMessage=prop:value">
  </label>

  <p het-text="statusMessage"></p>
</section>

<script src="het.iife.js"></script>
<script>
  HET.registerComponent('message-status', ({ signals }) => {
    console.log('seeded value for statusMessage:', signals.statusMessage.value);
  });

  HET.init();
</script>
```

`het-seed="statusMessage=prop:value"` means: before setup runs, create a component signal called `statusMessage`. The initial value for that signal should be derived from the input element's `value` property.

Because `statusMessage` is now acquired from the DOM, setup **must not** initialize it again.

An acquired signal can still be used by the other bindings:

- `het-props` writes signal changes to the input
- `het-on` writes user input to the signal
- `het-text` writes the signal to the paragraph

Relevant reference:

- [`registerComponent(name, setup)`](reference/api.md#registercomponentname-setup)
- [Read sources](reference/components.md#read-sources)
- [Acquisition strategies](reference/components.md#acquisition-strategies-seed-sync)

## 8. Combine acquisition and output with `het-props:seed`

The input currently has separate bindings to read its initial `value` and write later signal values back to the same property:

```html
<input
  value="Nothing yet"
  het-props="value=statusMessage"
  het-seed="statusMessage=prop:value">
```

The `:seed` variant of `het-props` combines those bindings:

```html
<section het-component="message-status">
  <label>
    Message
    <input
      type="text"
      value="Nothing yet"
      het-props:seed="value=statusMessage"
      het-on="input->statusMessage=prop:value">
  </label>

  <p het-text="statusMessage"></p>
</section>

<script src="het.iife.js"></script>
<script>
  HET.registerComponent('message-status', ({ signals }) => {
    console.log('seeded value for statusMessage:', signals.statusMessage.value);
  });

  HET.init();
</script>
```

In `het-props:seed="value=statusMessage"`, `value` names the element property and `statusMessage` names the signal. HET reads the property into the signal before setup, then keeps writing signal changes back to that property.

Unlike `het-seed`, this syntax does not contain a read-source expression: `het-props` identifies `value` as an element property.

Relevant reference:

- [`het-props`](reference/components.md#het-props)
- [Acquisition strategies](reference/components.md#acquisition-strategies-seed-sync)

## 9. Use `het-model` for standard form controls

It is quite common to want two way binding plus initial value seeding on form controls. This can be quite verbose to setup with `het-props:seed` and `het-on`, even more so if you are using separate `het-props` and `het-seed` attributes. For standard form controls, `het-model` simplifies this pattern:

```html
<section het-component="message-status">
  <label>
    Message
    <input type="text" value="Nothing yet" het-model="statusMessage">
  </label>

  <p het-text="statusMessage"></p>
</section>

<script src="het.iife.js"></script>
<script>
  HET.registerComponent('message-status', ({ signals }) => {
    console.log('seeded value for statusMessage:', signals.statusMessage.value);
  });

  HET.init();
</script>
```

For checkbox and radio inputs, `het-model` reads from and writes to the control's `checked` property, and listens for `change` events. For other form controls, including other inputs, textareas, and selects, it uses the `value` property and listens for `input` events.

Relevant reference:

- [`het-model`](reference/components.md#het-model)

## 10. Use an anonymous component when setup is unnecessary

The previous examples logged the acquired value to demonstrate that acquisition happens before setup. We can now remove that diagnostic code. Since this leaves us without a setup function, we do not need to register a component at all. We can leave `het-component` empty to create an anonymous component root:

```html
<section het-component>
  <label>
    Message
    <input type="text" value="Nothing yet" het-model="statusMessage">
  </label>

  <p het-text="statusMessage"></p>
</section>

<script src="het.iife.js"></script>
<script>
  HET.init();
</script>
```

If you still want the component to be named for legibility, give the root that name and register it without a setup function:

```html
<section het-component="message-status">
  ...
</section>

<script>
  HET.registerComponent('message-status');
  HET.init();
</script>
```

Relevant reference:

- [Component roots and mounting](reference/components.md#component-roots-and-mounting)

## 11. Write values to attributes with `het-attrs`

`het-props` writes signal values to DOM properties. Use `het-attrs` when you need to write a value to an HTML attribute instead.

This status card writes its `status` signal to a `data-status` attribute. For the sake of a tutorial, this sample also includes some CSS just to make it visually obvious when the attribute changes.

```html
<style>
  p {
    padding: 0.5rem;
  }

  [data-status="ready"] {
    color: darkgreen;
    background-color: lightgreen;
  }

  [data-status="busy"] {
    color: darkred;
    background-color: lightsalmon;
  }
</style>

<section het-component="status-card">
  <button type="button" het-on="click->markBusy">Mark busy</button>
  <p het-attrs="data-status=status" het-text="status"></p>
</section>

<script src="het.iife.js"></script>
<script>
  HET.registerComponent('status-card', ({ signals }) => {
    signals.status = HET.signals.signal('ready');

    return {
      markBusy() {
        signals.status.value = 'busy';
      },
    };
  });

  HET.init();
</script>
```

`het-attrs="data-status=status"` writes the current value of the `status` signal to the paragraph's `data-status` attribute. The separate `het-text` binding writes the same value to its `textContent`.

When `markBusy()` changes the signal, HET updates both bindings. The paragraph displays `busy`, its attribute becomes `data-status="busy"`, and the matching CSS changes its colors.

As with properties, attributes can also provide initial signal state. Use `het-seed="signalName=attr:attributeName"` for a separate acquisition binding, or `het-attrs:seed="attributeName=signalName"` to combine acquisition and output.

Relevant reference:

- [`het-attrs`](reference/components.md#het-attrs)

## 12. Add and remove boolean attributes with `het-bool-attrs`

Some HTML attributes derive their meaning from whether they are present, rather than from a value. Examples include `disabled`, `required`, and `hidden`. Use `het-bool-attrs` for these attributes.

This component disables its email input when `isDisabled` becomes `true`:

```html
<section het-component="account-settings">
  <button type="button" het-on="click->disableEditing">
    Disable editing
  </button>

  <label>
    Email
    <input type="email" het-bool-attrs="disabled=isDisabled">
  </label>
</section>

<script src="het.iife.js"></script>
<script>
  HET.registerComponent('account-settings', ({ signals }) => {
    signals.isDisabled = HET.signals.signal(false);

    return {
      disableEditing() {
        signals.isDisabled.value = true;
      },
    };
  });

  HET.init();
</script>
```

When `isDisabled` is `true`, HET adds the `disabled` attribute. When it is `false`, HET removes the attribute.

Use `het-attrs` for value-bearing attributes such as `data-status="busy"` or `aria-expanded="true"`. Use `het-bool-attrs` when the attribute's presence itself has meaning.

Relevant reference:

- [`het-bool-attrs`](reference/components.md#het-bool-attrs)

## 13. Add and remove classes with `het-class`

The same boolean signal can control a CSS class. Add a status message whose appearance changes when editing is disabled:

```html
<style>
  .editing-disabled {
    color: darkred;
    font-weight: bold;
  }
</style>

<section het-component="account-settings">
  <button type="button" het-on="click->disableEditing">
    Disable editing
  </button>

  <label>
    Email
    <input type="email" het-bool-attrs="disabled=isDisabled">
  </label>

  <p het-class="editing-disabled=isDisabled">
    Editing status
  </p>
</section>
```

`het-class="editing-disabled=isDisabled"` adds the `editing-disabled` class when the signal is truthy and removes it when the signal is falsy.

The component setup is unchanged from the previous section. Both `het-bool-attrs` and `het-class` react to the same `isDisabled` signal.

Relevant reference:

- [`het-class`](reference/components.md#het-class)

## 14. Negate a signal in a binding

Sometimes the signal name that best describes the component state is the opposite of the DOM state you need to bind. Rename the signal to `isEnabled`, then prefix it with `!` where the bindings require the inverse:

```html
<section het-component="account-settings">
  <button type="button" het-on="click->disableEditing">
    Disable editing
  </button>

  <label>
    Email
    <input type="email" het-bool-attrs="disabled=!isEnabled">
  </label>

  <p het-class="editing-disabled=!isEnabled">
    Editing status
  </p>
</section>

<script src="het.iife.js"></script>
<script>
  HET.registerComponent('account-settings', ({ signals }) => {
    signals.isEnabled = HET.signals.signal(true);

    return {
      disableEditing() {
        signals.isEnabled.value = false;
      },
    };
  });

  HET.init();
</script>
```

`!isEnabled` applies JavaScript boolean negation before writing the signal value. When `isEnabled` is `false`, both bindings receive `true`, so HET adds the `disabled` attribute and the `editing-disabled` class.

Relevant reference:

- [Binding syntax](reference/components.md#binding-syntax)

## 15. Toggle a boolean signal with `het-toggle`

The component method now only changes one boolean signal. Use `het-toggle` when an event should invert a signal directly:

```html
<section het-component="account-settings">
  <button type="button" het-toggle="click->isEnabled">
    Toggle editing
  </button>

  <label>
    Email
    <input type="email" het-bool-attrs="disabled=!isEnabled">
  </label>

  <p het-class="editing-disabled=!isEnabled">
    Editing status
  </p>
</section>

<script src="het.iife.js"></script>
<script>
  HET.registerComponent('account-settings', ({ signals }) => {
    signals.isEnabled = HET.signals.signal(true);
  });

  HET.init();
</script>
```

`het-toggle="click->isEnabled"` is shorthand for:

```html
<button type="button" het-on="click->isEnabled=!isEnabled">
  Toggle editing
</button>
```

The component no longer needs to return a method, but its setup function still creates the `isEnabled` signal.

Relevant reference:

- [`het-toggle`](reference/components.md#het-toggle)

## 16. Share a signal across nested components

Component boundaries isolate signals by default. Export a signal from an ancestor and import it into a descendant when both components should deliberately share the same signal object.

```html
<section het-component het-exports="query">
  <label>
    Search
    <input type="search" value="bicycles" het-model="query">
  </label>

  <aside het-component het-imports="sidebarQuery=query">
    <p>
      Sidebar results for:
      <strong het-text="sidebarQuery"></strong>
    </p>
  </aside>
</section>
```

The outer anonymous component acquires `query` through `het-model` and exports it. The nested component imports the same signal under the local name `sidebarQuery`.

Use imports and exports for genuine state sharing across nested component boundaries, not as a replacement for local component state.

Relevant reference:

- [`het-exports` and `het-imports`](reference/components.md#het-exports-and-het-imports)

## 17. Create a small dynamic list with `het-for`

`het-for` creates child component instances from an array-valued signal. This example renders a small list of notifications:

```html
<section het-component="notification-list">
  <button type="button" het-on="click->addNotification">
    Add notification
  </button>

  <ul>
    <template het-for="notifications">
      <li het-component>
        <span het-text="message"></span>
      </li>
    </template>
  </ul>
</section>

<script src="het.iife.js"></script>
<script>
  const createNotification = (message) => ({
    message: HET.signals.signal(message),
  });

  HET.registerComponent('notification-list', ({ signals }) => {
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

  HET.init();
</script>
```

Each array item exposes signal-valued properties. HET forwards those signals into the component root cloned from the template, so the child can bind `message` directly.

`het-for` is intentionally narrow:

- use it only on `<template>`
- give the template exactly one root element with `het-component`
- provide an array-valued source signal
- provide signal-valued properties on forwarded items

It is intended for small, bounded lists such as notifications, tabs, or menus, not large client-rendered application views.

HET also provides `het-if` for conditionally creating one child component from a signal-backed object. See the structural templates reference for that pattern.

Relevant reference:

- [Structural templates](reference/components.md#structural-templates)

## 18. Synchronize after external DOM updates

Use `:sync` instead of `:seed` when another system may update the DOM after the component has mounted.

```html
<section id="publication-status" het-component>
  <input
    type="hidden"
    value="Draft"
    het-props:sync="value=status">

  <p>
    Current status:
    <strong het-text="status"></strong>
  </p>
</section>
```

The initial `Draft` value creates the `status` signal. If code outside HET's normal signal bindings later changes the input, dispatch `het:sync` on the smallest container that owns the update:

```js
const container = document.querySelector('#publication-status');
const statusInput = container.querySelector('input');

statusInput.value = 'Published';
container.dispatchEvent(new CustomEvent('het:sync', { bubbles: true }));
```

The sync binding rereads the input and updates the signal, which updates the visible status.

> **Important:** HET's request module dispatches this synchronization lifecycle automatically after request-driven content updates, including `het-also` replacements. Other DOM-updating integrations must dispatch `het:sync` themselves. Sync only rereads bindings discovered when the component mounted; it does not register new or changed `het-*` attributes.

Relevant reference:

- [Acquisition strategies](reference/components.md#acquisition-strategies-seed-sync)
- [Component lifecycle notes](reference/components.md#component-lifecycle-notes)

## 19. Common next patterns

The examples above cover the normal component path. Other features are useful when a component has a specific need:

- [Event modifiers](reference/components.md#het-on) provide `prevent`, `stop`, `once`, `capture`, keyboard filters, debouncing, and throttling.
- [`het-cloak`](reference/components.md#het-cloak) keeps component markup hidden until its mount batch completes.
- [Lifecycle cleanup](reference/components.md#component-lifecycle-notes) removes timers, subscriptions, or other resources when a component root is removed.
- [Read sources](reference/components.md#read-sources) acquire values from properties, attributes, boolean attributes, classes, or literals.
- [Output bindings](reference/components.md#output-bindings) write signals to properties, attributes, boolean attributes, classes, and text.

These features do not need to be added to every component. Reach for them when the component's behavior requires them.

## 20. Where to go next

You now have the main component patterns:

1. register named components when setup code or methods are needed
2. use anonymous roots when HTML bindings provide all required behavior
3. keep local state in signals and connect it to the DOM with bindings
4. acquire state when server-rendered HTML owns the initial value
5. use sync when an external DOM update should refresh acquired state
6. share signals and create structural children only when component composition requires them

Next:

- [Component reference](reference/components.md)
- [API reference](reference/api.md)
- [Error reference](reference/errors.md)
