'use strict';

const sleep = (ms) => new Promise((r) => void setTimeout(r, ms));

const retry = (task, options = {}) => {
  if (!task) throw new Error('task is required');
  return async (...args) => {
    const {
      recovery = () => Promise.resolve(),
      count = 1,
      delay = 0,
      onError = () => {},
    } = options;
    const errors = [];
    let retries = 0;
    while (retries++ < count) {
      if (delay > 0) await sleep(delay);
      try {
        return await task(...args);
      } catch (error) {
        errors.push(error);
        onError(error);
      }
      try {
        await recovery(...args);
      } catch (error) {
        errors.push(error);
        throw new AggregateError(errors);
      }
    }
    throw new AggregateError(errors);
  };
};

module.exports = retry;
