import assert from 'assertive';
import Bluebird from 'bluebird';

import withBackends from './_backends';

describe('Cache::{get,set}', () => {
  withBackends(cache => {
    it('get/set (callback style)', done => {
      cache.set('callback-key', 'callback-value', setError => {
        if (setError) return done(setError);
        cache.get('callback-key', (getError, value) => {
          if (getError) return done(getError);
          let assertError = null;
          try {
            assert.equal('callback-value', value);
          } catch (error) {
            assertError = error;
          }
          done(assertError);
        });
      });
    });

    it('get/set (promise style)', async () => {
      await cache.set('promise-key', 'promise-value', { expire: 1 });
      assert.equal('promise-value', await cache.get('promise-key'));
    });

    it('honors expires', async () => {
      const values = {
        key1: 'Value 1',
        key2: 'Value 2',
        key3: 'Value 3',
      };

      await Bluebird.all([
        cache.set('key1', values.key1, { expire: 1 }),
        cache.set('key2', values.key2, { expire: 0 }),
        cache.set('key3', values.key3, { expire: 4 }),
      ]);

      await Bluebird.delay(2000);

      const [expired, eternal, hit] =
        await Bluebird.map(['key', 'key2', 'key3'], key => cache.get(key));

      assert.equal(null, expired);
      assert.equal(values.key2, eternal);
      assert.equal(values.key3, hit);
    });
  });
});
