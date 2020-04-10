'use strict';

const assert = require('assert');

const cached = require('..');

describe('cached', () => {
  beforeEach(() => cached.dropNamedCaches());

  it('is a function', () => assert.strictEqual(typeof cached, 'function'));

  it('starts out with no known caches', () =>
    assert.deepStrictEqual(cached.knownCaches(), []));

  it('can create different named caches', () => {
    assert.notStrictEqual(cached('foo'), cached('bar'));
    assert.notStrictEqual(cached('foo'), cached());

    assert.deepStrictEqual(
      cached.knownCaches().sort(),
      ['bar', 'foo', 'default'].sort()
    );
  });

  it('the default cache is named "default"', () =>
    assert.strictEqual(cached(), cached('default')));

  it("throws when cache name isn't a string", () =>
    assert.throws(() => cached(true)));

  it("doesn't throw when cache name is a string", () =>
    assert.doesNotThrow(() => cached('default')));

  it('returns the same named cache for subsequent calls', () =>
    assert.strictEqual(cached('foo'), cached('foo')));

  it('dropNamedCache() removes specific cache', () => {
    cached('bar');
    cached('foo');
    cached('ponyfoo');

    cached.dropNamedCache('foo');

    assert.deepStrictEqual(cached.knownCaches(), ['bar', 'ponyfoo']);
  });

  it('dropNamedCaches() removes all caches', () => {
    cached('bar');

    cached.dropNamedCaches();

    assert.deepStrictEqual(cached.knownCaches(), []);
  });

  it('deferred() promisifies the passed function', () => {
    const fn = cb => {
      return cb();
    };
    const deferred = cached.deferred(fn);

    assert.strictEqual(typeof deferred, 'function');
    assert.ok(deferred() instanceof Promise);
  });

  it('knownCaches() returns all named caches', () => {
    cached('bar');

    assert.deepStrictEqual(cached.knownCaches(), ['bar']);
  });
});
