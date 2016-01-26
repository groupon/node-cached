import assert from 'assertive';

import cached from '..';

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

    assert.equal(aValue, await cacheA.get('key'));
    assert.equal(bValue, await cacheB.get('key'));
  });
});
