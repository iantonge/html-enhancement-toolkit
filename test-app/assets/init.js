window.hetInitConfig = window.hetInitConfig || {};
window.hetErrors = window.hetErrors || [];

window.hetInitConfig.onError = (err) => {
  window.hetErrors.push(err);
  console.error(err, err.cause);
};
window.HET.init(window.hetInitConfig);
