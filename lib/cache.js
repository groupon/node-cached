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

/* eslint-disable no-underscore-dangle */

'use strict';

const backends = require('./backend');

const util = require('./util');

/**
 * @typedef {Object} backendOpts
 * @property {string} [type]
 * @property {function} [client]
 * @property {string} [hosts]
 */

/**
 * @typedef {Object} cacheOpts
 * @property {string} [name]
 * @property {string|backendOpts} backend
 * @property {{freshFor?: number, expire?: number, timeout?: number}} [defaults]
 */

class Cache {
  /**
   *
   * @param {cacheOpts} options
   */
  constructor(options) {
    this.defaults = {
      freshFor: 0,
      expire: 0,
      timeout: 0,
    };
    this.name = options.name || 'default';
    this.prefix = `${this.name}:`;
    /**
     * @type {Map<string, Promise<any>|any>}
     */
    this.staleOrPending = new Map(); // Keep - internal cache for pending requests

    backends.register();

    this._set = this._set.bind(this);
    this._get = this._get.bind(this);
    this._unset = this._unset.bind(this);
    this._getOrElse = this._getOrElse.bind(this);

    this.setDefaults(options.defaults);

    this.backend = this._setBackend(options.backend);
  }

  /**
   * Get the value for the given key
   *
   * @param {string} rawKey
   * @returns {Promise<any>|any}
   */
  get(rawKey) {
    const key = this._applyPrefix(rawKey);

    return this._get(key).then(util.extractValue);
  }

  /**
   * Get or recalculate the value for the given key
   *
   * @param {string} rawKey
   * @param {any} valueOrFn
   * @param {Record<string, any>} [opts]
   * @returns {Promise<any>|any}
   */
  getOrElse(rawKey, valueOrFn, opts = {}) {
    const key = this._applyPrefix(rawKey);

    return this._getOrElse(key, valueOrFn, this._prepareOptions(opts));
  }

  /**
   * Flush backend
   *
   * @returns {Promise<void>}
   */
  async flush() {
    if (this.backend.flush) {
      await this.backend.flush();
    }
  }

  /**
   * Set key/value pair
   *
   * @param {string} rawKey
   * @param {any} valueOrFunction
   * @param {Object} [opts]
   * @returns {Promise<void>|null}
   */
  async set(rawKey, valueOrFunction, opts = {}) {
    const key = this._applyPrefix(rawKey);

    const value = await util.getValue(valueOrFunction);

    await this._set(key, value, this._prepareOptions(opts));
  }

  /**
   * @param {Record<string, any>} defaultsOpts
   */
  setDefaults(defaultsOpts) {
    this.defaults = this._prepareOptions(defaultsOpts);
  }

  /**
   * Remove the key from backend.
   *
   * @param {string} rawKey
   * @returns {Promise<void>|undefined}
   */
  unset(rawKey) {
    const key = this._applyPrefix(rawKey);

    return this._unset(key);
  }

  /**
   * @param {string} key
   * @returns {string}
   * @private
   */
  _applyPrefix(key) {
    return [this.prefix, key].join('');
  }

  /**
   *
   * @param {Promise<any>} promise
   * @returns {Promise<any>}
   * @private
   */
  _applyTimeout(promise) {
    const timeout = this.defaults.timeout;
    if (timeout > 0) {
      return util.promiseTimeout(promise, timeout);
    }
    return promise;
  }

  /**
   * @param {string} key
   * @returns {Promise<{b:number, d:any}>}
   * @private
   */
  _get(key) {
    return this._applyTimeout(this.backend.get(key));
  }

  /**
   *
   * @param {string} key
   * @param {any|function} valueOrFn
   * @param {{freshFor: number} & Record<string, any>} opts
   * @returns {Promise<{b: number, d: any}>}
   */
  async _getOrElse(key, valueOrFn, opts) {
    const cache = this;

    /**
     *
     * @param {any} [passThroughData]
     * @returns {any}
     */
    function resetStaleOrPending(passThroughData) {
      cache.staleOrPending.delete(key);
      return passThroughData;
    }

    /**
     *
     * @param {any} generatedValue
     * @returns {Promise<any>}
     */
    async function writeValue(generatedValue) {
      await cache._set(key, generatedValue, opts).catch(() => {});

      return generatedValue === undefined ? null : generatedValue;
    }

    /**
     * @returns {Promise<any>|{b: number, d: *, wasEverReturned?: boolean}}
     */
    function refreshValue() {
      /** @type {Promise<any>|{b:number, d: any, wasEverReturned?: boolean}} */
      let refreshed;

      /**
       * @param {Error} err
       * @returns {Promise<never>|null}
       */
      function handleWriteError(err) {
        resetStaleOrPending();
        // @ts-ignore
        if (refreshed.wasEverReturned) {
          return Promise.reject(err);
        }
        return null;
      }

      refreshed = util
        .getValue(valueOrFn)
        .then(writeValue)
        .then(resetStaleOrPending, handleWriteError);

      return refreshed;
    }

    const wrappedValue = await this._get(key).catch(() => null);

    return this._verifyFreshness(key, wrappedValue, refreshValue);
  }

  _end() {
    if (this.backend && this.backend.end) {
      return this.backend.end();
    }
    return null;
  }

  /**
   * @param {Record<string, any>} options
   * @returns {{freshFor: number, expire: number} & Record<string, any>}
   * @private
   */
  _prepareOptions(options) {
    return { ...this.defaults, ...options };
  }

  /**
   * @param {string} key
   * @param {any} val
   * @param {{freshFor: number} & Record<string, any>} options
   * @returns {Promise<void>}
   * @private
   */
  _set(key, val, options) {
    const value = {
      b: util.expiresAt(options.freshFor),
      d: val,
    };

    return this._applyTimeout(this.backend.set(key, value, options));
  }

  /**
   * @param {backendOpts} [backendOpts]
   * @private
   */
  _setBackend(backendOpts = {}) {
    if (typeof backendOpts === 'string')
      backendOpts = {
        type: backendOpts,
      };

    this._end();

    if (util.isBackend(backendOpts)) {
      return backendOpts;
    }

    return backends.create(backendOpts);
  }

  /**
   * @param {string} key
   * @returns {Promise<void>}
   * @private
   */
  _unset(key) {
    return this._applyTimeout(this.backend.unset(key));
  }

  _verifyFreshness(key, wrappedValue, refreshValue) {
    const hit = !!wrappedValue;
    let loadingNewValue = this.staleOrPending.has(key);

    if (
      !loadingNewValue &&
      (!hit || util.isExpired(wrappedValue && wrappedValue.b))
    ) {
      this.staleOrPending.set(key, refreshValue());
      loadingNewValue = true;
    }

    const dataFromCache = util.extractValue(wrappedValue);
    if (dataFromCache === null && loadingNewValue) {
      const value = this.staleOrPending.get(key);
      value.wasEverReturned = true;
      return value;
    }

    return dataFromCache;
  }
}

module.exports = Cache;
