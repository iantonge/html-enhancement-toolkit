# Request Reference

## Contents

- [Core attributes](#core-attributes)
- [Links](#links)
- [Forms](#forms)
- [Panes](#panes)
- [Partial updates with `het-select`](#partial-updates-with-het-select)
- [Additional replacements with `het-also`](#additional-replacements-with-het-also)
- [Server contract](#server-contract)
- [Request coordination](#request-coordination)
- [Lifecycle events](#lifecycle-events)

## Core attributes

| Attribute | Valid elements | Value shape | Multiple values | Notes |
| --- | --- | --- | --- | --- |
| `het-pane` | Replaceable pane element | Pane name | No | Current document and response must each contain exactly one matching pane. |
| `het-target` | Same-origin links, forms, submit buttons | Pane name | No | On forms, a submitter with `het-target` overrides the form value. |
| `het-select` | Links, forms, submit buttons | Element id list | Yes | Replaces matching descendants inside the target pane. On forms, a submitter with `het-select` overrides the form value; an empty submitter value clears the form value. |
| `het-also` | Links, forms, submit buttons | Element id list | Yes | Replaces matching elements outside the target pane. On forms, a submitter with `het-also` overrides the form value; an empty submitter value clears the form value. |

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

- HET respects native form defaults and submitter overrides: `formaction`, `formmethod`, `formenctype`, default `method`/`action`, and submitter name/value pairs.
- HET submits `GET` forms as query strings and supports `application/x-www-form-urlencoded`, `multipart/form-data`, and `text/plain` request bodies for non-GET forms.
- `het-target` on the clicked submit button overrides `het-target` on the form.
- `het-select` and `het-also` on the clicked submit button override the form attributes. Use empty submitter attributes (`het-select=""`, `het-also=""`) to clear form-level partial or additional replacements for that submission.
- Do not put `het-target` on cross-origin form submissions; HET treats that as an error.

## Panes

Use `het-pane="<name>"` to mark replaceable content. The current document and the response HTML must each contain exactly one pane with the resolved target name.

```html
<main het-pane="main">
  ...
</main>
```

If the pane is missing or duplicated in either place, HET throws an error.

## Partial updates with `het-select`

Use `het-select` to replace only specific ids inside the target pane. The value is a whitespace-separated list of ids.

```html
<main het-pane="main">
  <p id="summary">Old summary</p>
  <p id="detail">Old detail</p>
  <a href="/next" het-target="main" het-select="summary">Update summary</a>
</main>

<form method="get" action="/search" het-target="main" het-select="summary detail">
  <input name="q">
  <button type="submit">Search</button>
</form>
```

- Without `het-select`, HET replaces the entire target pane element with the matching pane from the response.
- If `het-select` is present, it must list at least one id.
- On submit buttons, `het-select=""` clears a form-level `het-select` override and performs a full pane replacement.
- `het-select` throws if any listed id is missing in the current target or in the response target.

## Additional replacements with `het-also`

Use `het-also` to replace elements outside the target pane from the same response. The value is a whitespace-separated list of ids.

```html
<main het-pane="main">
  <p id="main-content">Main</p>
  <a href="/next" het-target="main" het-also="sidebar">Update main + sidebar</a>
</main>
<aside id="sidebar">Sidebar</aside>

<form method="post" action="/update" het-target="main" het-also="sidebar flash">
  <button type="submit">Submit</button>
</form>
```

- `het-also` throws if any listed id is missing in the current document or server response, or if an id refers to an element inside the target pane.
- If `het-also` is present, it must list at least one id.
- On submit buttons, `het-also=""` clears a form-level `het-also` override and skips additional replacements for that submission.

## Server contract

Enhanced requests include an `X-HET-Target` header containing the resolved target pane name.

Responses must be HTML containing exactly one matching target pane, regardless of HTTP status code. Servers may also return override headers:

| Header | Effect |
| --- | --- |
| `X-HET-Target-Override` | Replace a different pane than originally targeted. The override pane must exist in the current document and response. |
| `X-HET-Select-Override` | Override `het-select` ids. Use a whitespace-separated list of ids; an empty value clears selection and performs a full pane replacement. |

When using `X-HET-Target-Override`, it is usually safer to also clear selection (`X-HET-Select-Override: ""`) unless the selected ids are guaranteed to exist in the overridden target pane.

## Request coordination

HET coordinates in-flight requests by target pane so overlapping updates do not race and leave the UI in an inconsistent state.

- If a pane request is in flight, a new request to the same pane cancels the earlier one.
- If a child pane request is in flight, a new request to an ancestor pane cancels the child request.
- If a parent pane request is in flight, new requests targeting panes inside it are ignored.

## Lifecycle events

HET dispatches lifecycle events around fetch and content loading.

Content-load events bubble from the target pane or inserted pane.

| Event | Cancelable | Detail | Notes |
| --- | --- | --- | --- |
| `het:afterLoadContent` | No | `alsoElements` | Dispatched after target/select/also replacements. |

For request diagnostics and full `error.cause` fields, see the [error reference](errors.md#request-errors).
