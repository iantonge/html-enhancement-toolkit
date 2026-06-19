# Component Reference

## Component roots and mounting

Use `het-component` to mark a component root and mount a registered component by name.

```html
<div het-component="counter"></div>
```

Register named components before calling `init()`.

## Signals

Component setup functions receive a signal registry. Assign Preact signal objects to create component-local state.

```js
HET.registerComponent('counter', ({ signals }) => {
  signals.count = HET.signals.signal(0);
});
```

In the IIFE build, HET exposes these Preact Signals helpers on `HET.signals`:

- `HET.signals.signal(initialValue)`
- `HET.signals.computed(fn)`
- `HET.signals.effect(fn)`
- `HET.signals.batch(fn)`
- `HET.signals.untracked(fn)`

The ESM build does not re-export signal helpers. Import them from `@preact/signals-core` instead.

## Component lifecycle notes

- HET mounts component roots in depth order so parents mount before descendants.
- HET unmounts removed components automatically.
- `destroy()` unmounts all mounted components.
