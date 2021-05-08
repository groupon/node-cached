'use strict';

const assert = require('assert');

const withBackends = require('./_backends');
const { delay } = require('./_helper');

describe('Cache::{get,set,unset}', () => {
  withBackends(['memory', 'memcached'], cache => {
    it('get(), set() and unset() return a promise', async () => {
      for (const fn of ['get', 'set', 'unset'])
        assert.ok(cache[fn]() instanceof Promise);
    });

    it('get/set as promise', async () => {
      const testCases = [
        'promise-value',
        function normalFn() {
          return 'promise-value';
        },
        async function asyncFn() {
          return 'promise-value';
        },
        function fnWithPromiseReturn() {
          return Promise.resolve('promise-value');
        },
      ];

      for (const value of testCases) {
        const key = value.name || value;

        await cache.unset(key);
        await cache.set(key, value, { expire: 0 });

        assert.strictEqual(await cache.get(key), 'promise-value', key);
      }
    });

    it('set/unset as promise', async () => {
      await cache.set('promise-key', 'promise-value', { expire: 1 });
      await cache.unset('promise-key');

      assert.strictEqual(await cache.get('promise-key'), null);
    });

    it('getting an unknown key returns null', async () => {
      assert.strictEqual(await cache.get('unknown'), null);
    });

    it('honors expires', async () => {
      const values = {
        key1: 'Value 1',
        key2: 'Value 2',
        key3: 'Value 3',
      };

      await Promise.all(['key1', 'key2', 'key3'].map(key => cache.unset(key)));

      await Promise.all([
        cache.set('key1', values.key1, { expire: 1 }),
        cache.set('key2', values.key2, { expire: 0 }),
        cache.set('key3', values.key3, { expire: 4 }),
      ]);

      await delay(2000);

      const [expired, eternal, hit] = await Promise.all(
        ['key1', 'key2', 'key3'].map(key => cache.get(key))
      );

      assert.strictEqual(expired, null);
      assert.strictEqual(eternal, values.key2);
      assert.strictEqual(hit, values.key3);
    });
  });
});
