'use strict';

const assert = require('assert');

const Cache = require('../lib/cache');
const { delay } = require('./_helper');

async function deferredBy(value, ms) {
  await delay(ms);

  return value;
}

describe('Cache timeouts', () => {
  const cache = new Cache({
    backend: {
      get() {
        return deferredBy({ d: 'get result' }, 150);
      },
      set() {
        return deferredBy('set result', 150);
      },
    },
    name: 'awesome-name',
    debug: true,
  });

  describe('with a timeout <150ms', () => {
    before(() => (cache.defaults.timeout = 50));

    it('get fails fast', async () => {
      await Promise.race([
        cache.get('my-key'),
        deferredBy('too slow', 100), // this should not be used
      ]).catch(err => {
        assert.ok(err instanceof Error);
        assert.strictEqual(err.name, 'TimeoutError');
      });
    });

    it('set fails fast', async () => {
      await Promise.race([
        cache.set('my-key', 'my-value'),
        deferredBy('too slow', 100), // this should not be used
      ]).catch(err => {
        assert.ok(err instanceof Error);
        assert.strictEqual(err.name, 'TimeoutError');
      });
    });

    it('getOrElse fails fast', async () => {
      const value = await Promise.race([
        cache.getOrElse('my-key', 'my-value'),
        // We need to add a bit of time here because we'll run into the
        // timeout twice - once when trying to read and once while writing.
        deferredBy('too slow', 150), // this should not be used
      ]);

      assert.strictEqual(value, 'my-value');
    });
  });

  describe('with a timeout >150ms', () => {
    before(() => (cache.defaults.timeout = 250));

    it('receives the value', async () => {
      const value = await Promise.race([
        cache.get('my-key'),
        deferredBy('too slow', 200), // this should not be used
      ]);

      assert.strictEqual(value, 'get result');
    });

    it('sets the value', async () => {
      await Promise.race([
        cache.set('my-key', 'my-value'),
        deferredBy('too slow', 200), // this should not be used
      ]);

      assert.strictEqual(await cache.get('my-key'), 'get result');
    });

    it('getOrElse can retrieve a value', async () => {
      const value = await Promise.race([
        cache.getOrElse('my-key', 'my-value'),
        deferredBy('too slow', 200), // this should not be used
      ]);

      assert.strictEqual(value, 'get result');
    });
  });
});
