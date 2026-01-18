window.hetErrors = [];
window.HET.init({
  onError: (err) => {
    window.hetErrors.push(err.message);
    console.error(err);
  }
});
