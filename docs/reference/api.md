# API Reference

This section collects the JavaScript entry points and initialization options for lookup after the core HTML attributes are familiar.

## `init(config)`

Initialize HET. This mounts registered components.

`config` is optional, and every config property is optional. Omitted properties use the defaults described below. `init` does not return a value.

### Config options

#### `onError(error)`

Handle internal errors with your own logging or reporting. Signature: `(error: Error | DOMException | unknown) => void`. Default: log and continue. Return value is ignored.

HET-created errors use the message prefix `HET Error:` and may include structured diagnostic data on `error.cause`. See the [error reference](errors.md).

```js
HET.init({
  onError: (error) => {
    console.error(error, error.cause);
    // Forward to your telemetry here
  },
});
```

#### `structuralUnmountDelay`

Delay, in milliseconds, before HET destroys structural clones that were removed by `het-if` or `het-for`. Default: `0`.

When this is greater than `0`, HET keeps the structural clone mounted for the delay duration so CSS exit animations can finish. This applies only to structural clones. It does not change ordinary component teardown or `destroy()`.

```js
HET.init({
  structuralUnmountDelay: 180,
});
```

#### `structuralUnmountClass`

CSS class HET adds to a structural clone root while a delayed `het-if` or `het-for` removal is pending. Default: `"het-unmounting"`.

```js
HET.init({
  structuralUnmountDelay: 180,
  structuralUnmountClass: 'is-exiting',
});
```

## `destroy()`

Destroy mounted components, run their cleanup callbacks, and remove HET's document and window event listeners.

`destroy` accepts no parameters and does not return a value.

## `registerComponent(name, setup)`

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

## Signal helpers

In the IIFE build, HET exposes Preact Signals helpers on `HET.signals`:

- `signal(initialValue)`
- `computed(fn)`
- `effect(fn)`
- `batch(fn)`
- `untracked(fn)`

The ESM build does not re-export these helpers; import them from `@preact/signals-core`.
