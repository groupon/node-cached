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

# 1. Create a named cache
#    Once created, you can retrieve the same cache-instance later by
#    just calling `cached "divisions"` without any additional arguments.
cached = require ".."
divisionsCache = cached "divisions", backend: "memcached"

# 2. Dump stuff in the cache
divisionsCache.set "chicago", { name: "Chicago" }, ->
  console.log "Stored in cache."

  # 3. Get stuff from the cache
  divisionsCache.get "chicago", (err, data) ->
    console.log "Got data:", data

    # 4. Make it smarter: getOrElse
    # This function allows you to (almost) always keep the cache populated
    # and refetch the data in the background. It uses two settings:
    #
    # * freshFor: Age in seconds after which data in the cache will be replaced
    # * expire: Age in seconds when data will be invalidated
    #
    # As long as you don't let data expire, you will always get the values
    # directly from the cache and it will be updated asynchronously from getting.
    callCounter = 0
    fetchSF = cached.deferred (cb) ->
      ++callCounter
      setTimeout (->
        # Some fetch operation
        cb null, { name: "San Francisco" }
      ), 1000

    opts = { freshFor: 2, expire: 60 }
    divisionsCache.getOrElse "san-francisco", fetchSF, opts, (err, data) ->
      console.log "Got data:", data

    divisionsCache.getOrElse "san-francisco", fetchSF, opts, (err, data) ->
      console.log "Got data:", data

      # It's smart enough to only fetch once.
      console.log "Called the fetch function #{callCounter} times."
