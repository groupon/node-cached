import { defaults } from 'lodash';

import Cache from '../lib/cache';

const backendOptions = {
  hosts: `${process.env.MEMCACHED__HOST || '127.0.0.1'}:11211`,
};

export default function withBackends(createTestCases) {
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
}
