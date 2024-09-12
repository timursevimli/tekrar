'use strict';

const assert = require('node:assert');
const test = require('node:test');
const retry = require('../retry.js');

test('should succeed on first try (async)', async () => {
  const task = async () => 'success';
  const wrappedTask = retry(task);

  const result = await wrappedTask();
  assert.strictEqual(result, 'success');
});

test('should fail on first try (async)', async () => {
  const task = async () => {
    throw new Error('fail');
  };
  const wrappedTask = retry(task);

  await assert.rejects(wrappedTask, (err) => {
    assert(err instanceof AggregateError);
    assert.strictEqual(err.errors.length, 1);
    assert.strictEqual(err.errors[0].message, 'fail');
    return true;
  });
});

test('should succeed on first try (sync)', async () => {
  const task = () => 'success';
  const wrappedTask = retry(task);

  const result = await wrappedTask();
  assert.strictEqual(result, 'success');
});

test('should fail on first try (sync)', async () => {
  const task = () => {
    throw new Error('fail');
  };
  const wrappedTask = retry(task);
  try {
    await wrappedTask();
    assert.fail('never should be here');
  } catch (err) {
    assert(err instanceof AggregateError);
    assert.strictEqual(err.errors.length, 1);
    assert.strictEqual(err.errors[0].message, 'fail');
  }
});

test('should succeed on second try after one failure', async () => {
  let attempts = 0;
  const task = async () => {
    if (attempts++ < 1) throw new Error('fail');
    return 'success';
  };
  const wrappedTask = retry(task, { count: 3 });

  const result = await wrappedTask();
  assert.strictEqual(result, 'success');
});

test('should succeed after recovery', async () => {
  let taskAttempts = 0;
  let recoveryAttempts = 0;
  const task = async () => {
    if (taskAttempts++ < 1) throw new Error('fail');
    return 'success';
  };
  const recovery = async () => {
    if (recoveryAttempts++ < 1) throw new Error('recovery fail');
  };
  const options = {
    recovery,
    count: 3,
  };
  const wrappedTask = retry(task, options);

  const result = await wrappedTask();
  assert.strictEqual(result, 'success');
});

test('should throw AggregateError after exceeding count', async () => {
  const task = async () => {
    throw new Error('fail');
  };
  const wrappedTask = retry(task, { count: 2 });

  await assert.rejects(wrappedTask, (err) => {
    assert(err instanceof AggregateError);
    assert.strictEqual(err.errors.length, 2); //2 fail
    assert.strictEqual(err.errors[0].message, 'fail');
    assert.strictEqual(err.errors[1].message, 'fail');
    return true;
  });
});

test('should handle recovery failure and throw AggregateError', async () => {
  const task = async () => {
    throw new Error('fail');
  };
  const recovery = async () => {
    throw new Error('recovery fail');
  };
  const options = {
    recovery,
    count: 2,
  };
  const wrappedTask = retry(task, options);

  await assert.rejects(wrappedTask, (err) => {
    assert(err instanceof AggregateError);
    const { errors } = err;
    assert.strictEqual(errors.length, 4); //2 fail + 2 recovery fail
    assert.strictEqual(errors[0].message, 'fail');
    assert.strictEqual(errors[1].message, 'recovery fail');
    assert.strictEqual(errors[2].message, 'fail');
    assert.strictEqual(errors[3].message, 'recovery fail');
    return true;
  });
});

test('should debounce', async () => {
  let failed = false;
  const delay = 100;
  let begin = Date.now();
  const task = () => {
    if (Date.now() - begin < delay) {
      failed = true;
    }
    return Promise.reject('fail');
  };
  const recovery = () => {
    begin = Date.now();
    return Promise.reject('recovery fail');
  };
  const options = {
    recovery,
    handleRecovery: true,
    count: 2,
    delay,
  };
  await retry(task, options)().catch(() => {});
  assert.strictEqual(failed, false);
});
