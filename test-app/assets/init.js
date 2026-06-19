window.hetErrors = window.hetErrors || [];

const originalConsoleError = console.error;
console.error = (...args) => {
  const [err] = args;
  window.hetErrors.push(err);
  originalConsoleError(...args);
};
window.HET.init();
