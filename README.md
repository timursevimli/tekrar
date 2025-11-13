# Tekrar

[![ci Status](https://github.com/timursevimli/tekrar/workflows/Testing%20CI/badge.svg)](https://github.com/timursevimli/tekrar/actions?query=workflow%3A%22Testing+CI%22+branch%3Amaster)
[![snyk](https://snyk.io/test/github/timursevimli/tekrar/badge.svg)](https://snyk.io/test/github/timursevimli/tekrar)
[![npm downloads/month](https://img.shields.io/npm/dm/tekrar.svg)](https://www.npmjs.com/package/tekrar)
[![npm downloads](https://img.shields.io/npm/dt/tekrar.svg)](https://www.npmjs.com/package/tekrar)
[![license](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/timursevimli/tekrar/blob/master/LICENSE)

An abstraction for handling retry strategies, including exponential backoff and custom configurations, for operations that fail.

> **Note:** "Tekrar" means "repeat" or "retry" in Turkish, reflecting the module's purpose.

## Features

- Simple and lightweight retry mechanism
- Support for both synchronous and asynchronous functions
- Configurable retry count and delay
- Custom error handling and recovery functions
- TypeScript support

## Installation

```bash
npm install tekrar
```

## Usage

### Basic Usage

```javascript
const tekrar = require('tekrar');

// Wrap a function that might fail
const fetchData = tekrar(
  async () => {
    const response = await fetch('https://api.example.com/data');
    if (!response.ok) throw new Error('API request failed');
    return response.json();
  },
  { count: 3, delay: 1000 },
);

// Use the wrapped function
try {
  const data = await fetchData();
  console.log('Data:', data);
} catch (error) {
  console.error('All retries failed:', error);
}
```

### With Recovery Function

```javascript
const tekrar = require('tekrar');

const sendEmail = tekrar(
  async (recipient, content) => {
    // Email sending logic that might fail
    return emailService.send(recipient, content);
  },
  {
    count: 3,
    delay: 2000,
    recovery: async (recipient, content) => {
      // Log the failure or perform alternative action
      console.log(`Failed to send email to ${recipient}, retrying...`);
      // You could also modify the content or recipient before the next retry
    },
    onError: (error) => {
      // Log each error
      console.error('Email sending error:', error.message);
    },
  },
);

// Use the wrapped function
try {
  await sendEmail('user@example.com', 'Hello, world!');
  console.log('Email sent successfully');
} catch (error) {
  console.error('Failed to send email after multiple attempts');
}
```

## API

### tekrar(task, options)

Creates a wrapped function that will retry the given task according to the specified options.

#### Parameters

- `task` (Function): The function to retry. Can be synchronous or asynchronous.
- `options` (Object, optional): Configuration options for retry behavior.
  - `count` (Number, default: 1): Maximum number of retry attempts.
  - `delay` (Number, default: 0): Delay in milliseconds between retry attempts.
  - `recovery` (Function, default: () => Promise.resolve()): Function called after each failed attempt, before the next retry. Receives the same arguments as the task.
  - `onError` (Function, default: () => {}): Function called with each error that occurs. Useful for logging or monitoring.

#### Returns

A wrapped function that accepts the same arguments as the original task and returns a Promise.

#### Errors

If all retry attempts fail, the function throws an `AggregateError` containing all errors that occurred during the retry attempts.

## Examples

### Retry with Exponential Backoff

```javascript
const tekrar = require('tekrar');

// Helper function to implement exponential backoff
const withExponentialBackoff = (fn, maxRetries = 5) => {
  let retries = 0;

  const execute = tekrar(fn, {
    count: maxRetries,
    delay: 0, // We'll handle the delay in the recovery function
    recovery: async (...args) => {
      const delay = Math.pow(2, retries) * 100; // Exponential backoff
      console.log(`Retrying in ${delay}ms...`);
      await new Promise((resolve) => setTimeout(resolve, delay));
      retries++;
    },
  });

  return execute;
};

// Usage
const fetchWithRetry = withExponentialBackoff(async (url) => {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
  return response.json();
});

// Use the function
fetchWithRetry('https://api.example.com/data')
  .then((data) => console.log('Success:', data))
  .catch((error) => console.error('All retries failed:', error));
```

## License

MIT

## Author

Timur Sevimli <svmlitimur@gmail.com>
