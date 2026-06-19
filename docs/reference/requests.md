# Request Reference

## Contents

- [Core attributes](#core-attributes)
- [Links](#links)
- [Forms](#forms)
- [Panes](#panes)
- [Server contract](#server-contract)

## Core attributes

| Attribute | Valid elements | Value shape | Multiple values | Notes |
| --- | --- | --- | --- | --- |
| `het-pane` | Replaceable pane element | Pane name | No | Current document and response must each contain exactly one matching pane. |
| `het-target` | Same-origin links and forms | Pane name | No | The matching pane is replaced with the response pane. |

## Links

Add `het-target="<pane-name>"` to a same-origin link to fetch the link URL and replace the matching pane from the response.

```html
<main het-pane="main">
  <a href="/next" het-target="main">Next page</a>
</main>
```

- Do not put `het-target` on links to another origin; HET treats that as an error.
- Do not put `het-target` on links with a native `target` attribute; HET treats that as an error.
- Modifier clicks such as Ctrl, Cmd, Shift, and middle click are not enhanced.

## Forms

Add `het-target="<pane-name>"` to a same-origin form to submit it with `fetch` and replace the matching pane from the response.

```html
<form method="get" action="/search" het-target="main">
  <input name="q">
  <button type="submit">Search</button>
</form>
```

- HET respects native form control values.
- HET submits `GET` forms as query strings and submits non-GET forms as `application/x-www-form-urlencoded`.
- Do not put `het-target` on cross-origin form submissions; HET treats that as an error.

## Panes

Use `het-pane="<name>"` to mark replaceable content. The current document and the response HTML must each contain exactly one pane with the resolved target name.

```html
<main het-pane="main">
  ...
</main>
```

If the pane is missing or duplicated in either place, HET throws an error.

## Server contract

Responses must be HTML containing exactly one matching target pane, regardless of HTTP status code.

For request diagnostics and full `error.cause` fields, see the [error reference](errors.md#request-errors).
