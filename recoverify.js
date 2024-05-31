'use strict';

const recoverify = (options = {}) => {
  const {
    task = null,
    recovery = null,
    handleRecovery = false,
    tryCount = 3,
  } = options;

  const errors = [];
  let count = 0;

  return async (...args) => {
    while (count++ < tryCount) {
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
    const finallyError = new Error('Too many tries');
    throw new AggregateError([...errors, finallyError]);
  };
};

module.exports = recoverify;
