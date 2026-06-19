# Requests Tutorial

The goal of this tutorial is to take you on a tour of the requests module, building from simple examples to more advanced usage. We will use the standalone script build throughout, so you can follow along without a build pipeline. If you are using the ESM bundle instead, the same component concepts apply, but the import syntax is different.

## 1. Initialize HET on a normal page

HET enhances existing HTML. Start by loading the script and calling `init()`.

```html
<main het-pane="main">
  <h1>Dashboard</h1>
  <a href="/reports" het-target="main">Reports</a>
</main>

<script src="het.iife.js"></script>
<script>
  HET.init();
</script>
```

Without JavaScript, the link still performs a full page load. With HET running, `het-target` opts the link into progressive enhancement.

Relevant reference:

- [Core attributes](reference/requests.md#core-attributes)
- [`init(config)`](reference/api.md#initconfig)

## 2. Replace a pane from an enhanced link

`het-pane` marks a replaceable region. `het-target` names the pane that a link should update.

```html
<main het-pane="main">
  <h1>Dashboard</h1>
  <a href="/reports" het-target="main">Reports</a>
</main>
```

When the link is clicked, HET fetches `/reports`, finds `het-pane="main"` in the response, and replaces the current pane with the matching pane from that response.

Link enhancement is intentionally narrow:

- the link must be same-origin
- the link must not use the native `target` attribute
- modifier clicks still use normal browser navigation

Relevant reference:

- [Links](reference/requests.md#links)
- [Target pane errors](reference/errors.md#target-panes)

## 3. Enhance forms with the same target model

Forms use the same pane-targeting rule.

```html
<main het-pane="main">
  <form method="get" action="/search" het-target="main">
    <label>
      Search
      <input name="q">
    </label>
    <button type="submit">Search</button>
  </form>
</main>
```

HET respects normal form behavior:

- native `method` and `action` defaults
- submitter overrides such as `formaction` and `formmethod`
- submitter name/value pairs
- `GET` query strings and standard non-`GET` form encodings

You can also override the form's target from the clicked submit button:

```html
<form method="post" action="/draft" het-target="content">
  <button type="submit">Save draft</button>
  <button type="submit" formaction="/publish" het-target="flash">Publish</button>
</form>
```

Relevant reference:

- [Forms](reference/requests.md#forms)

## 4. Push history with `het-nav`

Add `het-nav` to a pane when successful replacements should behave like navigation.

```html
<main het-pane="main" het-nav>
  <h1>Dashboard</h1>
  <a href="/reports" het-target="main">Reports</a>
</main>
```

For `het-nav` panes, HET updates browser history and synchronizes selected `<head>` content from the response, including `<title>` by default.

Use `het-nav` for page-like content areas. Leave it off for background updates that should not change the current URL or page metadata.

Relevant reference:

- [Navigation panes (`het-nav`)](reference/requests.md#navigation-panes-het-nav)
- [Server contract](reference/requests.md#server-contract)

## 5. Replace only selected descendants with `het-select`

By default, HET replaces the entire target pane. Use `het-select` when the response contains a full pane but only some descendants inside that pane should be replaced.

```html
<main het-pane="main">
  <p id="summary">Old summary</p>
  <p id="detail">Old detail</p>

  <a href="/reports/summary" het-target="main" het-select="summary">
    Refresh summary
  </a>
</main>
```

The response still needs to contain the matching target pane. HET then replaces only the listed ids inside that pane.

The value is a whitespace-separated id list. On submit buttons, `het-select=""` explicitly clears a form-level `het-select`.

Relevant reference:

- [Partial updates with `het-select`](reference/requests.md#partial-updates-with-het-select)
- [`het-select` errors](reference/errors.md#het-select)

## 6. Replace related content outside the target with `het-also`

Use `het-also` when one response should update the target pane and one or more elements elsewhere on the page.

```html
<main het-pane="main">
  <p id="main-content">Main</p>
  <a href="/reports" het-target="main" het-also="sidebar flash">
    Refresh page regions
  </a>
</main>

<aside id="sidebar">Sidebar</aside>
<p id="flash">Saved</p>
```

Each listed id must exist both in the current document and in the response. `het-also` only applies to elements outside the target pane.

On submit buttons, `het-also=""` clears a form-level `het-also`.

Relevant reference:

- [Additional replacements with `het-also`](reference/requests.md#additional-replacements-with-het-also)
- [`het-also` errors](reference/errors.md#het-also)

## 7. Control in-flight form disabling with `het-background`

While a request is in flight, HET marks the target pane busy and disables interactive controls in that pane. For forms, HET also disables the submitting form's controls by default.

Use `het-background` to keep a form interactive during submission while still marking the target pane busy.

```html
<main het-pane="results">
  <form method="get" action="/search" het-target="results" het-background>
    <input name="q">
    <button type="submit">Search</button>
  </form>
</main>
```

This is useful for low-risk background updates such as previews or live filters.

Relevant reference:

- [Core attributes](reference/requests.md#core-attributes)
- [UI feedback while requests are in flight](reference/requests.md#ui-feedback-while-requests-are-in-flight)

## 8. Style busy panes and rely on built-in autofocus

During an enhanced request, HET:

- sets `aria-busy="true"` on the target pane
- adds a busy CSS class
- disables interactive controls inside the target pane
- removes those markers when the request ends or is aborted

```js
HET.init({
  busyClass: 'is-loading',
});
```

After content is swapped in, HET focuses the first `[autofocus]` in the inserted content and removes that attribute so it does not trigger again.

Relevant reference:

- [UI feedback while requests are in flight](reference/requests.md#ui-feedback-while-requests-are-in-flight)
- [`busyClass`](reference/api.md#busyclass)

## 9. Let HET coordinate overlapping requests

HET prevents overlapping updates from leaving a pane in an inconsistent state.

- a newer request to the same pane aborts the older request
- a new request to an ancestor pane aborts in-flight child-pane requests
- a new request to a child pane is ignored while an ancestor-pane request is in flight

This coordination is automatic. The main thing to remember is that HET treats pane relationships as the unit of request ownership.

Relevant reference:

- [Request coordination](reference/requests.md#request-coordination)

## 10. Listen to lifecycle events

HET dispatches events around fetch and content loading.

```js
document.addEventListener('het:beforeFetch', (event) => {
  const { request } = event.detail;
  event.detail.request = new Request(request, {
    headers: {
      ...Object.fromEntries(request.headers),
      'X-Trace-Id': crypto.randomUUID(),
    },
  });
});

document.addEventListener('het:afterLoadContent', (event) => {
  console.log('Updated pane:', event.target);
});
```

Use these hooks when you need to:

- customize the outgoing `Request`
- inspect or replace the `Response`
- intercept content before it is inserted
- react after target, `het-select`, and `het-also` replacements finish

Relevant reference:

- [Lifecycle events](reference/requests.md#lifecycle-events)

## 11. Understand the server contract and override headers

Enhanced requests send an `X-HET-Target` header with the resolved target pane name.

Servers must return HTML containing exactly one matching target pane, even on error responses. Servers may also override client targeting decisions with response headers:

- `X-HET-Target-Override`
- `X-HET-Select-Override`
- `X-HET-Also-Override`

Use these only when the server genuinely needs to redirect the replacement behavior. In most cases, keeping the target rules in HTML is simpler and easier to reason about.

Relevant reference:

- [Server contract](reference/requests.md#server-contract)
- [Request eligibility errors](reference/errors.md#request-eligibility)

## 12. Customize request behavior with `init()` options

Most request behavior works well with defaults, but a few options matter for production integration:

- `headContentSelectors`: controls which `<head>` elements sync during `het-nav`
- `replaceContent`: swaps DOM with your own replacement strategy, such as morphing instead of replace
- `nonce` and `nonceHeader`: add a nonce header to enhanced requests
- `trustedTypesPolicy`: transform response HTML before parsing
- `onError`: centralize request and runtime error handling

```js
HET.init({
  headContentSelectors: ['title', 'meta[name=description]'],
  nonce: window.__CSP_NONCE__,
  onError(error) {
    console.error(error);
  },
});
```

`replaceContent` applies to full pane swaps, `het-select`, and `het-also` replacements, so use it when you need one consistent replacement strategy everywhere.

Relevant reference:

- [Config options](reference/api.md#config-options)

## 13. Know how request updates relate to component sync

If your page also uses HET components, request-driven content updates automatically dispatch the sync lifecycle that acquired component signals use.

That behavior is built in, but the concept is broader than the requests module itself: component sync is useful any time some external code mutates the DOM outside normal signal bindings.

The full component-side explanation, including manual `het:sync` dispatch for non-request DOM updates, is covered in the [components tutorial](tutorial-components.md#10-sync-snapshot-state-after-external-dom-changes).

## 14. Where to go next

You now have the normal request-enhancement path:

1. mark a replaceable pane with `het-pane`
2. opt links and forms into enhancement with `het-target`
3. add `het-nav` when swaps should behave like navigation
4. use `het-select` and `het-also` when one response should update smaller or additional regions
5. rely on built-in busy state, coordination, and lifecycle hooks for polish and control

Next:

- [Components tutorial](tutorial-components.md)
- [Request reference](reference/requests.md)
- [API reference](reference/api.md)
- [Error reference](reference/errors.md)
