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


cached = require '..'

cache = cached 'my-cache', backend: 'memory'

values =
  key1: 'Value 1'
  key2: 'Value 2'
  key3: 'Value 3'

cache.set 'key1', values.key1, ->
  console.log 'key1: Set callback style'

cache.set('key2', values.key2, { expire: 1 })
.then ->
  console.log 'key2: Set promise style, expires after 1 second'

cache.set('key3', values.key3, freshFor: 2)
.then ->
  console.log 'key3: Fresh for 2 seconds'

[ 100, 3000 ].map (timeout) ->
  tryGetFromCache = ->
    console.log "Trying to get values after #{timeout} msecs"
    [ 'key1', 'key2', 'key3' ].map (key) ->
      cache.get key, (err, data) ->
        console.log "get (callback):\t#{key}: #{data}"

      cache.get(key).then (data) ->
        console.log "get (promise):\t#{key}: #{data}"

      cache.getOrElse(key, "New value for #{key}").then (data) ->
        console.log "getOrElse:\t#{key}: #{data}"

  setTimeout(tryGetFromCache, timeout)
