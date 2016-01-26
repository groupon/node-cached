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

var Bluebird = require('bluebird');
var _ = require('lodash');

var util = require('./util');

function getOrElse(cache, key, val, opts) {
  function resetStaleOrPending(passThroughData) {
    delete cache.staleOrPending[key];
    return passThroughData;
  }

  function writeValue(generatedValue) {
    function fallbackToLoadedValue() {
      return generatedValue === undefined ? null : generatedValue;
    }

    return cache._set(key, generatedValue, opts)
      .then(util.extractValue)
      .catch(fallbackToLoadedValue);
  }

  function refreshValue() {
    var refreshed;

    function handleWriteError(err) {
      resetStaleOrPending();
      if (refreshed.wasEverReturned) {
        return Bluebird.reject(err);
      }
      return null;
    }

    refreshed = util.toPromise(val)
      .then(writeValue)
      .then(resetStaleOrPending, handleWriteError);

    return refreshed;
  }

  function verifyFreshness(wrappedValue) {
    var hit = !!wrappedValue;
    var expired = util.isExpired(wrappedValue && wrappedValue.b);
    var loadingNewValue = cache.staleOrPending[key] !== undefined;

    if ((!hit || expired) && !loadingNewValue) {
      cache.staleOrPending[key] = refreshValue();
      loadingNewValue = true;
    }

    var dataFromCache = util.extractValue(wrappedValue);
    if ((dataFromCache === null) && loadingNewValue) {
      cache.staleOrPending[key].wasEverReturned = true;
      return cache.staleOrPending[key];
    }

    return dataFromCache;
  }

  return cache._getWrapped(key)
    .catch(_.constant(null))
    .then(verifyFreshness);
}
module.exports = getOrElse;
