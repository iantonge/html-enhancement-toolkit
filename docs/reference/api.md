# API Reference

This section collects the JavaScript entry points and initialization options for lookup after the core HTML attributes are familiar.

## `init()`

Initialize HET. This mounts registered components.

`init` accepts no parameters and does not return a value.

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

`registerComponent` does not return a value.

## Signal helpers

In the IIFE build, HET exposes Preact Signals helpers on `HET.signals`:

- `signal(initialValue)`
- `computed(fn)`
- `effect(fn)`
- `batch(fn)`
- `untracked(fn)`

The ESM build does not re-export these helpers; import them from `@preact/signals-core`.
