'use strict';

const recoverify = (options = {}) => {
  const {
    task = null,
    recovery = null,
    handleRecovery = false,
    count = 3,
    message = 'Too many tries',
  } = options;

  const errors = [];
  let tryCount = 0;

  return async (...args) => {
    while (tryCount++ < count) {
      try {
        const res = await task(...args);
        return res;
      } catch (err) {
        errors.push(err);
        if (recovery) {
          try {
            await recovery(...args);
          } catch (err) {
            if (!handleRecovery) throw err;
            errors.push(err);
          }
        }
      }
    }
    const finallyError = new Error(message);
    throw new AggregateError([...errors, finallyError]);
  };
};

module.exports = recoverify;
