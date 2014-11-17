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

try
  # This makes sure we don't spam the CPU if we have our own Q
  Q = require '../node_modules/q'
  Q.stopUnhandledRejectionTracking()
catch
  Q = require 'q'

Cache = require './cache'

{extend} = require 'lodash'

namedCaches = {}

cached = (name="default", options={}) ->
  options = extend { name }, options
  namedCaches[name] ?= cached.createCache(options)

cached.createCache = (options={}) ->
  new Cache(options)

cached.dropNamedCaches = () ->
  namedCaches = {}
  return cached

cached.dropNamedCache = (name) ->
  delete namedCaches[name]
  return cached

cached.knownCaches = ->
  Object.keys namedCaches

cached.deferred = (fn) ->
  # a simple function that returns a promise of the execution of a
  # given nodejs callback-style function `fn`
  ->
    Q.nfcall fn

module.exports = cached
