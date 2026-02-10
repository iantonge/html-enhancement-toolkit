window.hetErrors = window.hetErrors || [];
const trustedTypesPolicy = trustedTypes.createPolicy('het', {
  createHTML: (html) => DOMPurify.sanitize(html, {
    RETURN_TRUSTED_TYPE: false,
    WHOLE_DOCUMENT: true,
    ADD_TAGS: ['html', 'head', 'body', 'meta', 'title', 'link', 'style', 'script'],
    ADD_ATTR: [
      'het-pane',
      'het-nav-pane',
      'het-target',
      'het-select',
      'het-also',
      'name',
      'content',
      'property',
      'rel',
      'href',
      'type',
      'charset',
      'http-equiv',
      'nonce',
      'autofocus',
    ],
  }),
});

window.HET.init({
  ...(window.hetInitConfig || {}),
  trustedTypesPolicy: trustedTypesPolicy,
  onError: (err) => {
    window.hetErrors.push(err.message);
    console.error(err);
  }
});
