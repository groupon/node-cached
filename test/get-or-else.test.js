'use strict';

const assert = require('assert');

const Cache = require('../lib/cache');
const withBackends = require('./_backends');
const { delay } = require('./_helper');

describe('Cache::getOrElse', () => {
  describe('when backed.get is failing', () => {
    let cache;
    before(() => {
      cache = new Cache({ backend: 'memory', name: 'awesome-name' });
      cache.backend.get = () =>
        Promise.reject(new Error('backend get troubles'));
    });

    function generateCats() {
      return 'fresh cats';
    }

    it('falls back on the value refresher', async () => {
      const value = await cache.getOrElse('bad_get', generateCats, {
        freshFor: 5,
      });
      assert.strictEqual(value, 'fresh cats');
    });
  });

  describe('when backend.set is failing', () => {
    let cache;
    before(() => {
      cache = new Cache({ backend: 'memory', name: 'awesome-name' });
      cache.backend.set = () =>
        Promise.reject(new Error('backend set troubles'));
    });

    function generateBunnies() {
      return 'generated bunnies';
    }

    it('falls back on the generated value', async () => {
      const value = await cache.getOrElse('bad_set', generateBunnies, {
        freshFor: 5,
      });
      assert.strictEqual(value, 'generated bunnies');
    });
  });

  describe('backends:', () => {
    withBackends(
      [
        // 'memory',
        'memcached',
      ],
      cache => {
        it('replaces values lazily', async () => {
          let generatorCalled = 0;

          // generate a value in a certain time
          function valueGenerator(v, ms) {
            return async () => {
              ++generatorCalled;
              await delay(ms);
              return v;
            };
          }

          const originalValue = 'original-value';

          // 1. Set the value with a freshFor of 1 second
          await cache.set('key1', originalValue, { freshFor: 1 });
          // 2. Wait more than 1 second (the value is now stale)
          await delay(1200);
          // 3. Make sure we can still retrieve the original value.
          //    It's stale - but not expired/gone.
          assert.strictEqual(await cache.get('key1'), originalValue);

          // 4. The value is stale, so it should be calling the value generator.
          //    But it should *return* the original value asap.
          assert.strictEqual(
            await cache.getOrElse('key1', valueGenerator('G1', 100), {
              freshFor: 5,
            }),
            originalValue
          );

          // Let the generator be generating...
          await delay(50);

          // 5. Generating 'G1' in the last step takes 100ms but we only waited 50ms yet.
          //    This means we still expect to see the original value.
          //    'G2' should never be generated since there's already a pending value.
          assert.strictEqual(
            await cache.getOrElse('key1', valueGenerator('G2', 5000), {
              freshFor: 5,
            }),
            originalValue
          );

          // Let the generator be generating...
          await delay(100);

          // 6. Now G1 is done generating (we waited a total of 150ms), so we shouldn't
          //    see the original value anymore but the new, improved 'G1'.
          assert.strictEqual(
            await cache.getOrElse('key1', valueGenerator('G3', 5000), {
              freshFor: 5,
            }),
            'G1'
          );

          // 7. Making sure that the value generator was only called once during this test.
          //    We just generated 'G1', the other times we either had a pending value
          //    or the value was still fresh (last/'G3' call).
          assert.strictEqual(generatorCalled, 1);
        });

        describe('value or function argument', () => {
          it('allows primitives', async () => {
            const testCases = [
              1,
              1.2,
              'foo',
              true,
              false,
              null,
              { foo: 'bar' },
              ['bar'],
            ];

            for (const val of testCases) {
              const key = `${val != null ? JSON.stringify(val) : val}`;

              const res = await cache.getOrElse(key, val, {
                freshFor: 1,
              });

              assert.deepStrictEqual(res, val);
            }
          });

          it('allows normal and async functions to generate values', async () => {
            const testCases = [
              function normalFn() {
                return 'foo';
              },
              async function asyncFn() {
                return 'foo';
              },
              function fnReturnsPromise() {
                return Promise.resolve('foo');
              },
            ];

            for (const fn of testCases) {
              const key = fn.name;

              const res = await cache.getOrElse(key, fn, {
                freshFor: 0,
              });

              assert.deepStrictEqual(res, 'foo', key);
            }
          });

          it('converts "undefined" values to null', async () => {
            const key = 'undefined';

            const res = await cache.getOrElse(key, undefined, {
              freshFor: 1,
            });

            assert.deepStrictEqual(res, null);
          });
        });

        describe('error handling', () => {
          it('throws errors', async () => {
            function errorGenerator() {
              throw new Error('Big Error');
            }

            await assert.rejects(
              () =>
                cache.getOrElse('bad_keys', errorGenerator, { freshFor: 1 }),
              /Big Error/
            );
          });

          describe('refresh of expired value failing', () => {
            const key = 'refresh-key';
            const value = 'refresh-value';

            before('set value that is stale after a second', () =>
              cache.set(key, value, { freshFor: 1, expire: 3 })
            );

            before('wait >1 seconds', () => delay(1100));

            function generator() {
              return Promise.reject(new Error('Oops'));
            }

            it('returns the original value if generating a new value fails', async () => {
              assert.strictEqual(await cache.getOrElse(key, generator), value);
            });

            describe('after two more seconds', () => {
              before('wait >2 seconds', () => delay(2100));

              it('fails to return a value if generating fails again', async () => {
                await assert.rejects(
                  () => cache.getOrElse(key, generator),
                  /Oops/
                );
              });
            });
          });
        });
      }
    );
  });
});
