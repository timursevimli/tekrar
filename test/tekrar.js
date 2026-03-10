'use strict';

const assert = require('node:assert');
const test = require('node:test');
const tekrar = require('../tekrar.js');

test('should succeed on first try (async)', async () => {
  const task = async () => 'success';
  const wrappedTask = tekrar(task);

  const result = await wrappedTask();
  assert.strictEqual(result, 'success');
});

test('should fail on first try (async)', async () => {
  const task = async () => {
    throw new Error('fail');
  };
  const wrappedTask = tekrar(task);

  await assert.rejects(wrappedTask, (err) => {
    assert(err instanceof AggregateError);
    assert.strictEqual(err.errors.length, 1);
    assert.strictEqual(err.errors[0].message, 'fail');
    return true;
  });
});

test('should succeed on first try (sync)', async () => {
  const task = () => 'success';
  const wrappedTask = tekrar(task);

  const result = await wrappedTask();
  assert.strictEqual(result, 'success');
});

test('should fail on first try (sync)', async () => {
  const task = () => {
    throw new Error('fail');
  };
  const wrappedTask = tekrar(task);
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
  const wrappedTask = tekrar(task, { count: 3 });

  const result = await wrappedTask();
  assert.strictEqual(result, 'success');
});

test('should throw AggregateError after exceeding count', async () => {
  const task = async () => {
    throw new Error('fail');
  };
  const wrappedTask = tekrar(task, { count: 2 });

  await assert.rejects(wrappedTask, (err) => {
    assert(err instanceof AggregateError);
    assert.strictEqual(err.errors.length, 2); //2 fail
    assert.strictEqual(err.errors[0].message, 'fail');
    assert.strictEqual(err.errors[1].message, 'fail');
    return true;
  });
});

test('should handle recovery failure', async () => {
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
  const wrappedTask = tekrar(task, options);

  await assert.rejects(wrappedTask, (err) => {
    assert(err instanceof AggregateError);
    const { errors } = err;
    assert.strictEqual(errors.length, 2);
    assert.strictEqual(errors[0].message, 'fail');
    assert.strictEqual(errors[1].message, 'recovery fail');
    return true;
  });
});

test('should debounce', async () => {
  let failed = false;
  const delay = 100;
  let begin = Date.now() - 10;
  const task = () => {
    if (Date.now() - begin < delay) {
      failed = true;
    }
    return Promise.reject('fail');
  };
  const recovery = () => {
    begin = Date.now() - 10;
    return Promise.reject('recovery fail');
  };
  const options = {
    recovery,
    handleRecovery: true,
    count: 2,
    delay,
  };
  await tekrar(task, options)().catch(() => {});
  assert.strictEqual(failed, false);
});

test('should on error', async () => {
  const task = async () => {
    throw new Error('fail');
  };
  const options = {
    onError: (error) => {
      assert.strictEqual(error.message, 'fail');
    },
  };

  await tekrar(task, options)().catch((err) => {
    assert(err instanceof AggregateError);
    assert.strictEqual(err.errors.length, 1);
    assert.strictEqual(err.errors[0].message, 'fail');
  });
});

test('should throw when delay >= timeout', async () => {
  const task = async () => 'success';
  const check = (err) => {
    assert(err instanceof Error);
    assert.strictEqual(err.message, 'delay should be less than timeout');
    return true;
  };

  await assert.rejects(tekrar(task, { timeout: 100, delay: 100 })(), check);
  await assert.rejects(tekrar(task, { timeout: 100, delay: 200 })(), check);
});

test('should succeed when task completes within timeout', async () => {
  const task = async () => 'success';
  const wrappedTask = tekrar(task, { timeout: 500 });

  const result = await wrappedTask();
  assert.strictEqual(result, 'success');
});

test('should throw Timeout Error when task exceeds timeout', async () => {
  const task = () => new Promise((resolve) => setTimeout(resolve, 300));
  const wrappedTask = tekrar(task, { timeout: 50 });

  await assert.rejects(wrappedTask, (err) => {
    assert(err instanceof Error);
    assert.strictEqual(err.message, 'Timeout Error');
    return true;
  });
});

test('should throw Timeout Error during retries', async () => {
  const task = async () => {
    throw new Error('fail');
  };
  const recovery = () => new Promise((resolve) => setTimeout(resolve, 200));
  const wrappedTask = tekrar(task, { timeout: 50, count: 5, recovery });

  await assert.rejects(wrappedTask, (err) => {
    assert(err instanceof Error);
    assert.strictEqual(err.message, 'Timeout Error');
    return true;
  });
});

test('should pass args to task when using timeout', async () => {
  const task = async (a, b) => a + b;
  const wrappedTask = tekrar(task, { timeout: 500 });

  const result = await wrappedTask(2, 3);
  assert.strictEqual(result, 5);
});
