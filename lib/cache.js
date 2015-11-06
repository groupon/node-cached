/*
Copyright (c) 2014, Groupon, Inc.
All rights reserved.

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions
are met:

Redistributions of source code must retain the above copyright notice,
this list of conditions and the following disclaimer.

Redistributions in binary form must reproduce the above copyright
notice, this list of conditions and the following disclaimer in the
documentation and/or other materials provided with the distribution.

Neither the name of GROUPON nor the names of its contributors may be
used to endorse or promote products derived from this software without
specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS
IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED
TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A
PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED
TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF
LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */
'use strict';

var Bluebird = require('bluebird');
var _ = require('lodash');

var Backend = require('./backend');

function toPromise(val) {
  if (typeof val === 'function') {
    return Bluebird.resolve(val());
  }
  return Bluebird.resolve(val);
}

function expiresAt(seconds) {
  if (seconds === 0) {
    return 0;
  }
  return Date.now() + parseInt(seconds, 10) * 1000;
}

function isExpired(expires) {
  if (expires === 0) {
    return false;
  }
  return Date.now() > new Date(expires).getTime();
}

function optionalOpts(opts, cb) {
  if (!cb && typeof opts === 'function') {
    return { cb: opts, opts: null };
  }
  return { cb: cb, opts: opts };
}

function extractValue(wrappedValue) {
  var value = wrappedValue && wrappedValue.d;
  // Normalize `undefined` into `null`
  return value === undefined ? null : value;
}

function defaultToNull(/* error */) {
  return null;
}

function Cache(options) {
  this.defaults = {
    freshFor: 0,
    expire: 0,
  };
  this.name = options.name || 'default';
  this.prefix = this.name + ':';
  this.staleOrPending = {};

  this.setDefaults(options.defaults);
  this.setBackend(options.backend);
}

Cache.prototype.applyPrefix = function applyPrefix(key) {
  return [this.prefix, key].join('');
};

Cache.prototype.setDefaults = function setDefaults(defaults) {
  this.defaults = this.prepareOptions(defaults);
  return this.defaults;
};

Cache.prototype.setBackend = function setBackend(backendOptions) {
  backendOptions = typeof backendOptions === 'string' ? {
    type: backendOptions,
  } : backendOptions || {};
  this.end();
  this.backend = Backend.create(backendOptions);
  return this.backend;
};

Cache.prototype.end = function end() {
  if (this.backend && this.backend.end) {
    return this.backend.end();
  }
};

Cache.prototype.prepareOptions = function prepareOptions(options) {
  return _.extend({}, this.defaults, options);
};

Cache.prototype.set = function set(rawKey, val, _opts, _cb) {
  var args = optionalOpts(_opts, _cb);
  var key = this.applyPrefix(rawKey);
  var optsWithDefaults = this.prepareOptions(args.opts);

  var self = this;
  function writeToBackend(resolvedValue) {
    return self.backend.set(key, {
      b: expiresAt(optsWithDefaults.freshFor),
      d: resolvedValue,
    }, optsWithDefaults);
  }

  return toPromise(val).then(writeToBackend).nodeify(args.cb);
};

Cache.prototype.getWrapped = function getWrapped(key) {
  return this.backend.get(key);
};

Cache.prototype.get = function get(rawKey, cb) {
  var key = this.applyPrefix(rawKey);

  return this.getWrapped(key).then(extractValue).nodeify(cb);
};

Cache.prototype.getOrElse = function getOrElse(rawKey, val, _opts, _cb) {
  var key = this.applyPrefix(rawKey);
  var args = optionalOpts(_opts, _cb);
  var optsWithDefaults = this.prepareOptions(args.opts);
  var self = this;

  function resetStaleOrPending(passThroughData) {
    delete self.staleOrPending[key];
    return passThroughData;
  }

  function writeValue(generatedValue) {
    return self.set(rawKey, generatedValue, optsWithDefaults)
      .then(extractValue)
      .catch(function fallbackToLoadedValue() {
        return generatedValue === undefined ? null : generatedValue;
      });
  }

  function refreshValue() {
    var refreshed;

    function handleWriteError(err) {
      resetStaleOrPending();
      if (refreshed.wasEverReturned) {
        return Promise.reject(err);
      }
      return null;
    }

    refreshed = toPromise(val)
      .then(writeValue)
      .then(resetStaleOrPending, handleWriteError);

    return refreshed;
  }

  function verifyFreshness(wrappedValue) {
    var hit = !!wrappedValue;
    var expired = isExpired(wrappedValue && wrappedValue.b);
    var loadingNewValue = self.staleOrPending[key] !== undefined;
    var dataFromCache = extractValue(wrappedValue);
    if ((!hit || expired) && !loadingNewValue) {
      self.staleOrPending[key] = refreshValue();
      loadingNewValue = true;
    }
    if ((dataFromCache === null) && loadingNewValue) {
      self.staleOrPending[key].wasEverReturned = true;
      return self.staleOrPending[key];
    }
    return dataFromCache;
  }

  return this.getWrapped(key)
    .catch(defaultToNull)
    .then(verifyFreshness)
    .nodeify(args.cb);
};

module.exports = Cache;
