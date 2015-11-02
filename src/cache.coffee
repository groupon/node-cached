###
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
###

'use strict'
{extend} = require 'lodash'
Promise = require 'bluebird'

Backend = require './backend'

toPromise = (val) ->
  # If val is a function, evaluate it first, convert into promise afterwards
  if 'function' is typeof val
    Promise.resolve val()
  else Promise.resolve val

expiresAt = (seconds) ->
  if seconds is 0 then 0
  else Date.now() + parseInt(seconds, 10) * 1000

isExpired = (expires) ->
  return false if expires is 0
  Date.now() > new Date(expires).getTime()

optionalOpts = (opts, cb) ->
  if not cb? and 'function' is typeof opts
    { cb: opts, opts: null }
  else
    { cb, opts }

class Cache
  constructor: ({backend, defaults, name}) ->
    @defaults =
      freshFor: 0
      expire: 0

    @name = name or 'default'
    @prefix = "#{@name}:"

    # stale keys that are loaded right now
    @staleOrPending = {}

    @setDefaults defaults
    @setBackend backend

  applyPrefix: (key) ->
    [ @prefix, key ].join ''
    # don't refactor the above line to a concatenation
    # see https://github.com/3rd-Eden/node-memcached/pull/205 for details

  setDefaults: (defaults) ->
    @defaults = @prepareOptions defaults

  setBackend: (backendOptions) ->
    backendOptions =
      if 'string' is typeof backendOptions
        { type: backendOptions }
      else
        backendOptions ? {}

    @end()
    @backend = Backend.create backendOptions

  end: ->
    @backend.end() if @backend?.end?

  prepareOptions: (options) ->
    extend {}, @defaults, options

  set: (key, val, opts, cb) ->
    {cb,opts} = optionalOpts(opts, cb)

    key = @applyPrefix key

    opts = @prepareOptions opts

    toPromise(val)
      .then (resolvedValue) =>
        @backend.set key, {
          b: expiresAt(opts.freshFor)
          d: resolvedValue
        }, opts
      .nodeify cb

  # Every value we cache is wrapped to enable graceful expire:
  # {
  #   "d": <data, the actual data that is cached>
  #   "b": <best before, timestamp when the data is considered stale>
  # }
  # This allows us to have stale values stored in the cache and fetch a
  # replacement in the background.
  getWrapped: (key) ->
    @backend.get key

  get: (rawKey, cb) ->
    key = @applyPrefix rawKey
    @getWrapped(key)
      .then (wrappedValue) ->
        # blindly return the wrapped value, ignoring freshness
        wrappedValue?.d ? null
      .nodeify cb

  # Get from a cache or generate if not present or stale.
  # A value is stale when it was generated more than `freshFor` seconds ago
  getOrElse: (rawKey, val, opts, cb) ->
    key = @applyPrefix rawKey

    {cb,opts} = optionalOpts(opts, cb)
    opts = @prepareOptions opts

    resetStaleOrPending = (passThroughData) =>
      delete @staleOrPending[key]
      passThroughData

    writeValue = (generatedValue) =>
      @set(rawKey, generatedValue, opts)
        .then (rawValue) -> rawValue?.d ? null
        .catch ->
          # return generated value instead of error
          # tracking backend errors should be done with wrapping your backend clients
          generatedValue ? null

    refreshValue = ->
      refreshed = toPromise(val)
        .then writeValue
        .then resetStaleOrPending, (err) ->
          resetStaleOrPending() # always reset
          if refreshed.wasEverReturned
            Promise.reject err
          else
            null # just ignore

    verifyFreshness = (wrappedValue) =>
      # best before is expired, we have to reload
      hit = wrappedValue?
      expired = isExpired wrappedValue?.b
      loadingNewValue = @staleOrPending[key]?
      dataFromCache = wrappedValue?.d

      if (!hit or expired) && !loadingNewValue
        @staleOrPending[key] = refreshValue()
        loadingNewValue = true

      # Return the value even if it's stale, we want the result ASAP
      if !dataFromCache? && loadingNewValue
        @staleOrPending[key].wasEverReturned = true
        @staleOrPending[key]
      else
        dataFromCache

    handleError = (error) ->
      # we should let the refreshValue method work if getWrapped has problems
      # tracking backend errors should be done with wrapping your backend clients
      return null

    @getWrapped(key).catch(handleError).then(verifyFreshness).nodeify cb

module.exports = Cache
