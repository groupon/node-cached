'use strict';

const { defaults } = require('lodash');

const Cache = require('../lib/cache');

const backendOptions = {
  hosts: `${process.env.MEMCACHED__HOST || '127.0.0.1'}:11211`,
};

module.exports = function withBackends(createTestCases) {
  ['memory', 'memcached'].forEach(backendType => {
    describe(`with backend "${backendType}"`, () => {
      const cache = new Cache({
        backend: defaults({ type: backendType }, backendOptions),
        name: 'awesome-name',
        debug: true,
      });
      after(() => cache.end());

      createTestCases(cache);
    });
  });
};
