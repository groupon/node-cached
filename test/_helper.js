'use strict';

const { promisify } = require('util');

exports.delay = promisify(setTimeout);
