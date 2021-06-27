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

const util = require('util');

const Cache = require('./cache');

/** @type {Map<string, Cache>} */
const namedCaches = new Map();

/**
 *
 * @param {string} [name]
 * @param {{freshFor?: number, expire?: number, timeout?: number}} [options]
 * @returns {Cache}
 */
function cached(name = 'default', options = {}) {
  if (typeof name !== 'string') {
    throw new TypeError('Cache name must be a string');
  }

  if (!namedCaches.has(name)) {
    const cache = cached.createCache({ name, ...options });
    namedCaches.set(name, cache);

    return cache;
  }

  return namedCaches.get(name);
}

/**
 * @param {{name: string, freshFor?: number, expire?: number, timeout:number}} [options]
 * @returns {Cache}
 */
cached.createCache = function createCache(options = {}) {
  return new Cache(options);
};

cached.dropNamedCaches = function dropNamedCaches() {
  namedCaches.clear();
  return cached;
};

/**
 * @param {string} name
 */
cached.dropNamedCache = function dropNamedCache(name) {
  namedCaches.delete(name);
  return cached;
};

/**
 * @returns {string[]}
 */
cached.knownCaches = function knownCaches() {
  return [...namedCaches.keys()];
};

/**
 * @param {function} fn
 * @returns {function}
 */
cached.deferred = function deferred(fn) {
  return util.promisify(fn);
};

module.exports = cached;
