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

## `destroy()`

Destroy mounted components and remove HET's document and window event listeners.

`destroy` accepts no parameters and does not return a value.

## `registerComponent(name, setup)`

Register a component setup function for elements whose `het-component` value matches `name`.

Parameters:

- `name`: the string used by `het-component`.
- `setup`: an optional function. HET calls `setup(context)` when a matching component mounts.

`setup(context)` receives:

- `el`: the component root element.
- `signals`: the component signal registry.

`setup` may return an object of methods for `het-on` bindings. `registerComponent` does not return a value.

## Signal helpers

In the IIFE build, HET exposes Preact Signals helpers on `HET.signals`:

- `signal(initialValue)`
- `computed(fn)`
- `effect(fn)`
- `batch(fn)`
- `untracked(fn)`

The ESM build does not re-export these helpers; import them from `@preact/signals-core`.
