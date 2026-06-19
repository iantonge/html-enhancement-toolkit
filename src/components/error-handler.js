let onError = (error) => {
  console.error(error, error.cause);
};

function setOnError(nextOnError) {
  if (nextOnError === undefined) return;
  if (typeof nextOnError !== 'function') {
    throw new Error('HET Error: onError must be a function');
  }
  onError = nextOnError;
}

function handleError(error) {
  onError(error);
}

export {
  handleError,
  setOnError,
};
