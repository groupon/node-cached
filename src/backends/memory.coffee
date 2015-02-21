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
Promise = require 'bluebird'

class MemoryBackend
  description = "Stores everything just in memory"

  constructor: ->
    @cache = Object.create null
    @type = 'memory'

  get: (key) ->
    if @isExpired(@cache[key]?.e)
      delete @cache[key] # make sure it does not exist

    Promise.resolve(@cache[key]?.d ? null)

  expiresAt: (seconds) ->
    if seconds is 0 then 0
    else (new Date()).getTime() + (parseInt(seconds) * 1000)

  isExpired: (expires) ->
    return false unless expires?
    return false if expires is 0
    # "now is greater than expires"
    return (new Date()).getTime() > (new Date(expires)).getTime()

  set: (key, value, options) ->
    @cache[key] =
      d: value
      e: @expiresAt(options.expire)

    Promise.resolve value

  unset: (key) ->
    delete @cache[key]
    Promise.resolve()

module.exports = MemoryBackend
