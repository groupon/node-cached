import assert from 'assertive';

import cached from '..';

describe('cached', () => {
  beforeEach(() => cached.dropNamedCaches());

  it('is a function', () =>
    assert.hasType(Function, cached));

  it('starts out with no known caches', () =>
    assert.deepEqual([], cached.knownCaches()));

  it('can create different named caches', () => {
    assert.notEqual(cached('bar'), cached('foo'));
    assert.notEqual(cached(), cached('foo'));
    assert.deepEqual([ 'bar', 'foo', 'default' ], cached.knownCaches());
  });

  it('the default cache is named "default"', () =>
    assert.equal(cached('default'), cached()));

  it('returns the same named cache for subsequent calls', () =>
    assert.equal(cached('foo'), cached('foo')));
});
