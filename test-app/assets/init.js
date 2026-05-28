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
      'het-text',
      'het-text:seed',
      'het-text:sync',
      'het-on',
      'het-props',
      'het-props:seed',
      'het-props:sync',
      'het-attrs',
      'het-attrs:seed',
      'het-attrs:sync',
      'het-bool-attrs',
      'het-bool-attrs:seed',
      'het-bool-attrs:sync',
      'het-class',
      'het-class:seed',
      'het-class:sync',
      'het-seed',
      'het-sync',
      'het-model',
      'het-exports',
      'het-imports',
      'het-pane',
      'het-nav',
      'het-target',
      'het-select',
      'het-also',
      'het-background',
      'het-cloak',
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
  window.hetErrors.push(err);
  console.error(err, err.cause);
};
window.HET.init(window.hetInitConfig);
