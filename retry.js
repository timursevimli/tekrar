'use strict';

const retry = (task, options = {}) => {
  if (!task) throw new Error('task is required');
  return async (...args) => {
    const {
      recovery = () => Promise.resolve(),
      count = 1,
      delay = 0,
    } = options;
    const errors = [];
    let retries = 0;
    while (retries++ < count) {
      if (delay > 0) {
        await new Promise((r) => void setTimeout(r, delay));
      }
      try {
        return await task(...args);
      } catch (error) {
        errors.push(error);
      }
      try {
        await recovery(...args);
      } catch (error) {
        errors.push(error);
      }
    }
    throw new AggregateError([...errors]);
  };
};

module.exports = retry;
