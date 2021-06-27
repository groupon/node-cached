'use strict';

const assert = require('assert');

const Memcached = require('memcached-elasticache');
const redis = require('redis');

const Cache = require('../lib/cache');

describe('Cache', () => {
  it('always has a backend', () => {
    const cache = new Cache({});

    assert.ok(cache.backend);
  });

  it('has a "memory" backend by default', () => {
    const cache = new Cache({});

    assert.strictEqual(cache.backend.type, 'memory');
  });

  it('throws for unknown backend', () => {
    assert.throws(() => new Cache({ backend: { type: 'foo' } }));
  });

  describe('for memcached backend', () => {
    it('allows memcached instance to be passed with the backend options', () => {
      const options = {
        name: 'my-memcached',
        backend: {
          type: 'memcached',
          client: new Memcached('127.0.0.1:11211', {}),
        },
      };

      const cache = new Cache(options);

      assert.ok(cache.backend.client instanceof Memcached);
    });

    it('allows redis instance to be passed with the backend options', () => {
      const options = {
        name: 'my-redis',
        backend: {
          type: 'redis',
          client: redis.createClient({
            host: '127.0.0.1',
            port: '6379',
          }),
        },
      };

      const cache = new Cache(options);

      assert.ok(cache.backend.client instanceof redis.RedisClient);
    });

    it('creates new memcached instance if passed client is not instance of Memcached', () => {
      const options = {
        name: 'my-memcached',
        backend: {
          type: 'memcached',
          client: () => {},
        },
      };

      const cache = new Cache(options);

      assert.ok(cache.backend.client instanceof Memcached);
    });
  });
});
