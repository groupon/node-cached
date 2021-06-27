/*
 * Copyright (c) 2014, Groupon, Inc.
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions
 * are met:
 *
 * Redistributions of source code must retain the above copyright notice,
 * this list of conditions and the following disclaimer.
 *
 * Redistributions in binary form must reproduce the above copyright
 * notice, this list of conditions and the following disclaimer in the
 * documentation and/or other materials provided with the distribution.
 *
 * Neither the name of GROUPON nor the names of its contributors may be
 * used to endorse or promote products derived from this software without
 * specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS
 * IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED
 * TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A
 * PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
 * HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
 * SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED
 * TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
 * PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF
 * LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
 * NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 * SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

'use strict';

const Memcached = require('./backends/memcached');
const Memory = require('./backends/memory');
const Redis = require('./backends/redis');

/**
 * @typedef {Object} BackendImpl
 * @property {string} type
 * @property {function} get
 * @property {function} set
 * @property {function} unset
 * @property {function} [end]
 */

const backends = new Map();

/**
 * @param {BackendImpl?} options
 * @returns {BackendImpl}
 */
function create(options = {}) {
  const type = options.type || 'memory';
  const Backend = backends.get(type);
  if (!Backend) {
    throw new Error(`${type} is not a supported cache backend type`);
  }
  return new Backend(options);
}

/**
 * @param {string} type
 * @param {Class} Backend
 */
function addType(type, Backend) {
  backends.set(type, Backend);
}

function register() {
  addType('memory', Memory);
  addType('memcached', Memcached);
  addType('redis', Redis);
}

module.exports = {
  addType,
  create,
  register,
};
