'use strict';

const sleep = (ms) => new Promise((r) => void setTimeout(r, ms));

const tekrar = (task, options = {}) => {
  if (!task) throw new Error('task is required');
  return async (...args) => {
    const {
      recovery = () => Promise.resolve(),
      count = 1,
      delay = 0,
      onError = () => {},
      timeout = 0,
    } = options;
    let retries = 0;
    const exec = async () => {
      const errors = [];
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
          onError(error);
          break;
        }
      }
      throw new AggregateError(errors);
    };
    if (timeout === 0) return await exec();
    if (delay >= timeout) throw new Error('delay should be less than timeout');
    return await Promise.race([
      exec(),
      sleep(timeout).then(() => {
        throw new Error('Timeout Error');
      }),
    ]);
  };
};

module.exports = tekrar;
