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
      'het-on',
      'het-props',
      'het-attrs',
      'het-bool-attrs',
      'het-class',
      'het-seed',
      'het-sync',
      'het-model',
      'het-model:int',
      'het-model:float',
      'het-model:bool',
      'het-exports',
      'het-imports',
      'het-for',
      'het-if',
      'het-unmount-delay',
      'het-pane',
      'het-nav',
      'het-target',
      'het-select',
      'het-also',
      'het-background',
      'het-mount-pending',
      'name',
      'content',
      'property',
      'rel',
      'href',
      'type',
      'checked',
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
