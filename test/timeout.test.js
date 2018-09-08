import assert from 'assertive';
import Bluebird from 'bluebird';
const identity = val => val;

import Cache from '../lib/cache';

describe('Cache timeouts', () => {
  const cache = new Cache({
    backend: {
      get() {
        return Bluebird.resolve({ d: 'get result' }).delay(150);
      },
      set() {
        return Bluebird.resolve('set result').delay(150);
      },
    },
    name: 'awesome-name',
    debug: true,
  });

  describe('with a timeout <150ms', () => {
    before(() => (cache.defaults.timeout = 50));

    it('get fails fast', async () => {
      const err = await Bluebird.race([
        cache.get('my-key').then(null, identity),
        Bluebird.delay(100, 'too slow'), // this should not be used
      ]);
      assert.expect(err instanceof Error);
      assert.equal('TimeoutError', err.name);
    });

    it('set fails fast', async () => {
      const err = await Bluebird.race([
        cache.set('my-key', 'my-value').then(null, identity),
        Bluebird.delay(100, 'too slow'), // this should not be used
      ]);
      assert.expect(err instanceof Error);
      assert.equal('TimeoutError', err.name);
    });

    it('getOrElse fails fast', async () => {
      const value = await Bluebird.race([
        cache.getOrElse('my-key', 'my-value').then(null, identity),
        // We need to add a bit of time here because we'll run into the
        // timeout twice - once when trying to read and once while writing.
        Bluebird.delay(150, 'too slow'), // this should not be used
      ]);
      assert.equal('my-value', value);
    });
  });

  describe('with a timeout >150ms', () => {
    before(() => (cache.defaults.timeout = 250));

    it('receives the value', async () => {
      const value = await Bluebird.race([
        cache.get('my-key').then(null, identity),
        Bluebird.delay(200, 'too slow'), // this should not be used
      ]);
      assert.equal('get result', value);
    });

    it('sets the value', async () => {
      const value = await Bluebird.race([
        cache.set('my-key', 'my-value').then(null, identity),
        Bluebird.delay(200, 'too slow'), // this should not be used
      ]);
      assert.equal('set result', value);
    });

    it('getOrElse can retrieve a value', async () => {
      const value = await Bluebird.race([
        cache.getOrElse('my-key', 'my-value').then(null, identity),
        Bluebird.delay(200, 'too slow'), // this should not be used
      ]);
      assert.equal('get result', value);
    });
  });
});
