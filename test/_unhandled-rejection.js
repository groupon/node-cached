'use strict';

/* eslint no-console:0 */
/* eslint-env mocha */

const unhandledRejections = [];
process.on('unhandledRejection', reason => {
  console.error('Possibly unhandled rejection:', reason.stack);
  unhandledRejections.push(reason);
});

after('Check for unhandled rejections', () => {
  if (unhandledRejections.length) {
    console.error('Found %d unhandled rejections', unhandledRejections.length);
    throw unhandledRejections[0];
  }
});
