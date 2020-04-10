'use strict';

/* eslint-env mocha */

const Cache = require('../lib/cache');

const backendOptions = {
  hosts: `${process.env.MEMCACHED__HOST || '127.0.0.1'}:11211`,
};

module.exports = function withBackends(backends, createTestCases) {
  backends.forEach(backendType => {
    describe(`with backend "${backendType}"`, () => {
      const cache = new Cache({
        backend: { ...backendOptions, type: backendType },
        name: 'awesome-name',
        debug: true,
      });

      // eslint-disable-next-line no-underscore-dangle
      after(() => cache._end());

      createTestCases(cache);
    });
  });
};
