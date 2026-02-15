window.hetInitConfig = window.hetInitConfig || {};
window.hetErrors = window.hetErrors || [];
const trustedTypesPolicy = trustedTypes.createPolicy('het', {
  createHTML: (html) => DOMPurify.sanitize(html, {
    RETURN_TRUSTED_TYPE: false,
    WHOLE_DOCUMENT: true,
    ADD_TAGS: ['html', 'head', 'body', 'meta', 'title', 'link', 'style', 'script'],
    ADD_ATTR: [
      'het-component',
      'het-ref',
      'het-on',
      'het-props',
      'het-attrs',
      'het-bool-attrs',
      'het-class',
      'het-model',
      'het-exports',
      'het-imports',
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

window.hetInitConfig.trustedTypesPolicy = trustedTypesPolicy;
window.hetInitConfig.onError = (err) => {
  window.hetErrors.push(err.message);
  console.error(err);
};
window.HET.init(window.hetInitConfig);
