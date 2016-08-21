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

var _ = require('lodash');

var Backend = require('./backend');
var getOrElse = require('./get-or-else');
var util = require('./util');

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

Cache.prototype._set = function _set(key, val, options) {
  var self = this;
  function writeToBackend(resolvedValue) {
    return self.backend.set(key, {
      b: util.expiresAt(options.freshFor),
      d: resolvedValue,
    }, options);
  }

  return this._applyTimeout(util.toPromise(val).then(writeToBackend));
};

Cache.prototype.set = function set(rawKey, val, _opts, _cb) {
  var args = util.optionalOpts(_opts, _cb);
  var key = this.applyPrefix(rawKey);
  var optsWithDefaults = this.prepareOptions(args.opts);

  return this._set(key, val, optsWithDefaults).nodeify(args.cb);
};

Cache.prototype._applyTimeout = function _applyTimeout(value) {
  var timeoutMs = this.defaults.timeout;
  if (timeoutMs > 0) {
    return value.timeout(timeoutMs);
  }
  return value;
};

Cache.prototype._getWrapped = function _getWrapped(key) {
  return this._applyTimeout(this.backend.get(key));
};
// For backwards compatibility, eventually we should deprecate this.
// It *should* be a private API.
Cache.prototype.getWrapped = Cache.prototype._getWrapped;

Cache.prototype.get = function get(rawKey, cb) {
  var key = this.applyPrefix(rawKey);

  return this._getWrapped(key).then(util.extractValue).nodeify(cb);
};

Cache.prototype.getOrElse = function _getOrElse(rawKey, val, _opts, _cb) {
  var key = this.applyPrefix(rawKey);
  var args = util.optionalOpts(_opts, _cb);
  var optsWithDefaults = this.prepareOptions(args.opts);

  return getOrElse(this, key, val, optsWithDefaults).nodeify(args.cb);
};

Cache.prototype.unset = function unset(rawKey, cb) {
  var key = this.applyPrefix(rawKey);

  return this._unset(key).nodeify(cb);
};

Cache.prototype._unset = function _unset(key) {
  return this._applyTimeout(this.backend.unset(key));
};

module.exports = Cache;
