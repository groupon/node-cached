'use strict';

/* eslint-env mocha */

const Cache = require('../lib/cache');

module.exports = function withBackends(backends, createTestCases) {
  backends.forEach(backendType => {
    describe(`with backend "${backendType}"`, () => {
      let backendOptions;
      switch (backendType) {
        case 'memcached':
          backendOptions = {
            hosts: `${process.env.MEMCACHED__HOST || '127.0.0.1'}:11211`,
          };
          break;
        case 'redis':
          backendOptions = {
            host: '127.0.0.1',
            port: '6379',
          };
          break;

        default:
          backendOptions = {};
      }

      const cache = new Cache({
        backend: { ...backendOptions, type: backendType },
        name: 'awesome-name',
        debug: true,
      });

      afterEach(() => cache.flush());

      // eslint-disable-next-line no-underscore-dangle
      after(() => cache._end());

      createTestCases(cache);
    });
  });
};
