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
Memcached = require 'memcached'
{promisify} = require 'bluebird'

class MemcachedBackend
  description = "Uses anything supporting the memcache protocol"

  constructor: (options) ->
    @type = 'memcached'

    if options.client?
      @client = options.client
    else
      hosts = options.hosts ? '127.0.0.1:11211'
      @client = new Memcached hosts, options

    @_clientGet = promisify @client.get, @client
    @_clientSet = promisify @client.set, @client
    @_clientDel = promisify @client.del, @client

  get: (key) ->
    @_clientGet(key).then (answer) ->
      if answer == false then null
      else answer

  set: (key, value, options) ->
    @_clientSet(key, value, options.expire).then -> value

  unset: (key) ->
    @_clientDel(key).then -> undefined

  end: ->
    @client.end()

module.exports = MemcachedBackend
