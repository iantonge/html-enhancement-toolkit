# Error Reference

HET-created errors use the `HET Error:` prefix.
Runtime errors are logged with their structured `cause`.

## `HET Error: Signal initialized with a non-signal value`

`setup` assigned a plain value to `signals.<name>` instead of a Preact signal object.

```js
HET.registerComponent('counter', ({ signals }) => {
  signals.count = 1;
});
```

Fix the component by assigning a real signal.

```js
signals.count = HET.signals.signal(1);
```
