import assert from 'assertive';

import Cache from '../lib/cache';

describe('Cache', () => {
  it('always has a backend', () => {
    const cache = new Cache({});
    assert.truthy(cache.backend);
  });

  it('has a "noop" backend by default', () => {
    const cache = new Cache({});
    assert.equal('noop', cache.backend.type);
  });
});
