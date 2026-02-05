window.hetErrors = [];
window.HET.init({
  ...(window.hetInitConfig || {}),
  onError: (err) => {
    window.hetErrors.push(err.message);
    console.error(err);
  }
});
