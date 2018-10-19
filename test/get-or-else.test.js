'use strict';

const assert = require('assertive');
const Bluebird = require('bluebird');

const Cache = require('../lib/cache');
const withBackends = require('./_backends');

function assertRejects(promise) {
  return promise.then(() => {
    throw new Error('Did not fail as expected');
  }, error => error);
}

describe('Cache::getOrElse', () => {
  describe('backed.get failing', () => {
    let cache;
    before(() => {
      cache = new Cache({ backend: 'memory', name: 'awesome-name' });
      cache.getWrapped = () =>
        Bluebird.reject(new Error('backend get troubles'));
    });

    function generateCats() {
      return 'fresh cats';
    }

    it('falls back on the value refresher', async () => {
      const value = await cache.getOrElse('bad_get', generateCats, {
        freshFor: 5,
      });
      assert.equal('fresh cats', value);
    });
  });

  describe('backend.set failing', () => {
    let cache;
    before(() => {
      cache = new Cache({ backend: 'memory', name: 'awesome-name' });
      cache.set = () => Bluebird.reject(new Error('backend set troubles'));
    });

    function generateBunnies() {
      return 'generated bunnies';
    }

    it('falls back on the generated value', async () => {
      const value = await cache.getOrElse('bad_set', generateBunnies, {
        freshFor: 5,
      });
      assert.equal('generated bunnies', value);
    });
  });

  withBackends(cache => {
    it('replaces values lazily', async () => {
      let generatorCalled = 0;
      // generate a value in a certain time
      function valueGenerator(v, ms) {
        return () => {
          ++generatorCalled;
          return Bluebird.resolve(v).delay(ms);
        };
      }

      const originalValue = 'original-value';

      // 1. Set the value with a freshFor of 1 second
      await cache.set('key1', originalValue, { freshFor: 1 });
      // 2. Wait more than 1 second (the value is now stale)
      await Bluebird.delay(1200);
      // 3. Make sure we can still retrieve the original value.
      //    It's stale - but not expired/gone.
      assert.equal(originalValue, await cache.get('key1'));

      // 4. The value is stale, so it should be calling the value generator.
      //    But it should *return* the original value asap.
      assert.equal(
        originalValue,
        await cache.getOrElse('key1', valueGenerator('G1', 100), {
          freshFor: 5,
        })
      );

      // Let the generator be generating...
      await Bluebird.delay(50);

      // 5. Generating 'G1' in the last step takes 100ms but we only waited 50ms yet.
      //    This means we still expect to see the original value.
      //    'G2' should never be generated since there's already a pending value.
      assert.equal(
        originalValue,
        await cache.getOrElse('key1', valueGenerator('G2', 5000), {
          freshFor: 5,
        })
      );

      // Let the generator be generating...
      await Bluebird.delay(100);

      // 6. Now G1 is done generating (we waited a total of 150ms), so we shouldn't
      //    see the original value anymore but the new, improved 'G1'.
      assert.equal(
        'G1',
        await cache.getOrElse('key1', valueGenerator('G3', 5000), {
          freshFor: 5,
        })
      );

      // 7. Making sure that the value generator was only called once during this test.
      //    We just generated 'G1', the other times we either had a pending value
      //    or the value was still fresh (last/'G3' call).
      assert.equal(1, generatorCalled);
    });

    it('throws errors', async () => {
      function errorGenerator() {
        throw new Error('Big Error');
      }

      const error = await assertRejects(
        cache.getOrElse('bad_keys', errorGenerator, { freshFor: 1 })
      );
      assert.equal('Big Error', error.message);
    });

    describe('refresh of expired value failing', () => {
      const key = 'refresh-key';
      const value = 'refresh-value';

      before('set value that is stale after a second', () =>
        cache.set(key, value, { freshFor: 1, expire: 3 })
      );

      before('wait >1 seconds', () => Bluebird.delay(1100));

      function generator() {
        return Bluebird.reject(new Error('Oops'));
      }

      it('returns the original value if generating a new value fails', async () => {
        assert.equal(value, await cache.getOrElse(key, generator));
      });

      describe('after two more second', () => {
        before('wait >2 seconds', () => Bluebird.delay(2100));

        it('fails to return a value if generating fails again', async () => {
          const error = await assertRejects(cache.getOrElse(key, generator));
          assert.equal('Oops', error.message);
        });
      });
    });
  });
});
