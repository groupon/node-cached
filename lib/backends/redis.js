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

const { promisify } = require('util');
const redis = require('redis');

/**
 * @param {import('redis').ClientOpts} options
 * @returns {RedisClient}
 */
function createClient(options) {
  if (options.client instanceof redis.RedisClient) {
    return options.client;
  }
  options = {
    host: '127.0.0.1',
    port: '6379',
    ...options,
  };
  return redis.createClient(options);
}

/* Uses anything supporting the memcached protocol */
class RedisBackend {
  /**
   * @param {import('redis').ClientOpts} options
   */
  constructor(options) {
    this.type = 'redis';
    this.client = createClient(options);
    this._get = promisify(this.client.get.bind(this.client));
    this._set = promisify(this.client.set.bind(this.client));
    this._del = promisify(this.client.del.bind(this.client));
    this._flush = promisify(this.client.flushall.bind(this.client));
  }

  /**
   * Closes all active memcached connections.
   */
  end() {
    this.client.end(true);
  }

  /**
   * Get the value for the given key.
   *
   * @param {string} key
   * @returns {Promise<any>}
   */
  async get(key) {
    const res = await this._get(key);
    return JSON.parse(res);
  }

  /**
   * Flushes the memcached server
   *
   * @returns {Promise<void>}
   */
  async flush() {
    await this._flush();
  }

  /**
   * Stores a new value in Redis.
   *
   * @param {string} key
   * @param {{b: number, d: any}|string} value
   * @param {{expire: number}} options
   * @returns {Promise<void>}
   */
  async set(key, value, options) {
    let args = [];
    if (options.expire) {
      args = ['EX', options.expire];
    }
    if (typeof value !== 'string') {
      value = JSON.stringify(value);
    }

    await this._set(key, value, ...args);
  }

  /**
   * @param {string} key
   * @returns {Promise<void>}
   */
  async unset(key) {
    await this._del(key);
  }
}

module.exports = RedisBackend;
