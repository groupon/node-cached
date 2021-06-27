'use strict';

const assert = require('assert');

const cached = require('..');

describe('cache prefix', () => {
  it('adds a prefix to named cached', async () => {
    const cacheA = cached('a', { backend: { type: 'memory' } });
    const cacheB = cached('b');
    // Simulate writing to the same store
    cacheB.backend = cacheA.backend;

    const aValue = 'a-value';
    const bValue = 'b-value';

    await cacheA.set('key', aValue);
    await cacheB.set('key', bValue);

    assert.strictEqual(await cacheA.get('key'), aValue);
    assert.strictEqual(await cacheB.get('key'), bValue);
  });
});
