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

const util = require('../util');

/* Stores everything just in memory */
class MemoryBackend {
  constructor() {
    /** @type {Map<string, any>} */
    this.cache = new Map();
    this.type = 'memory';
  }

  /**
   * @param {string} key
   * @param {any} value
   * @param {{expire: number}} options
   * @returns {Promise<void>}
   */
  async set(key, value, options) {
    this.cache.set(key, {
      d: value,
      e: util.expiresAt(options.expire),
    });
  }

  /**
   * @param {string} key
   * @returns {Promise<any>}
   */
  async get(key) {
    let wrappedValue = this.cache.get(key);
    const isExpired = util.isExpired(wrappedValue && wrappedValue.e);

    if (isExpired) {
      wrappedValue = null;
      this.cache.delete(key);
    }

    return wrappedValue ? wrappedValue.d : null;
  }

  /**
   * Clear memory cache
   *
   * @returns {Promise<void>}
   */
  async flush() {
    this.cache.clear();
  }

  /**
   * @param {string} key
   * @returns {Promise<void>}
   */
  async unset(key) {
    this.cache.delete(key);
  }
}

module.exports = MemoryBackend;
