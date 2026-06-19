# html-enhancement-toolkit

HET (HTML Enhancement Toolkit) is a lightweight JavaScript enhancement library for server-rendered applications.

## Documentation

- [Reference index](docs/README.md): API reference docs.
- [API reference](docs/reference/api.md)

## Quick start

### Using HET in your app

HET is designed to work in a no-build workflow, but it also ships an ESM bundle. Build this repository, then copy the generated file you want from `dist/` into your application.

- IIFE build (no-build): use `dist/het.iife.js` or `dist/het.iife.min.js`.
- ESM build (for apps with a bundler): use `dist/het.js` and import from the file path you copy into your app.

#### IIFE build

```html
<script src="/path/to/het.iife.js"></script>
<script>
  HET.init();
</script>
```

Available APIs are `HET.init` and `HET.destroy`.

#### ESM build

Import HET from the copied file:

```js
import { init } from '/path/to/het.js';

init();
```

The ESM build exports `init` and `destroy`.

## Where next

- Use the [reference index](docs/README.md) when you already know what concept you need.

## Development

Project layout:

- `src/` source modules (built into `dist/`).
- `dist/` build output from `npm run build`.

| Command | Description |
| --- | --- |
| `npm run build` | Build `dist/het.js`, `dist/het.iife.js`, and `dist/het.iife.min.js`. |
| `npm run test-app` | Build HET and start the Express test app. |
| `npm run test` | Run the Playwright test suite. The Playwright config starts the test app automatically. |
