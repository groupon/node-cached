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

/**
 * @param {number|string} seconds
 * @returns {number}
 */
function expiresAt(seconds) {
  if (seconds === 0) {
    return 0;
  }
  return Date.now() + Number(seconds) * 1000;
}

/**
 * @param {number} expires
 * @returns {boolean}
 */
function isExpired(expires) {
  if (!expires) {
    return false;
  }
  return Date.now() > new Date(expires).getTime();
}

/**
 * @param {{b:number, d:any}} [wrappedValue]
 * @returns {*|null}
 */
function extractValue(wrappedValue) {
  const value = wrappedValue && wrappedValue.d;
  // Normalize `undefined` into `null`
  return value === undefined ? null : value;
}

/**
 * @param {function|any} valueOrFn
 * @returns {Promise<*>}
 */
async function getValue(valueOrFn) {
  return typeof valueOrFn === 'function' ? valueOrFn() : valueOrFn;
}

/**
 * @param {Promise<any>} promise
 * @param {number} ms
 * @returns {Promise<any>}
 */
function promiseTimeout(promise, ms) {
  let id;
  // Create a promise that rejects in <ms> milliseconds
  const timeout = new Promise((_, reject) => {
    id = setTimeout(() => {
      const err = new Error('operation timed out');
      err.name = 'TimeoutError';
      reject(err);
    }, ms);
  });

  // Returns a race between our timeout and the passed in promise
  return Promise.race([promise, timeout]).finally(() => clearTimeout(id));
}

/**
 * @param {Record<string, any>} backend
 * @returns {boolean}
 */
function isBackend(backend) {
  return typeof backend.get === 'function' && typeof backend.set === 'function';
}

module.exports = {
  expiresAt,
  extractValue,
  isBackend,
  isExpired,
  promiseTimeout,
  getValue,
};
