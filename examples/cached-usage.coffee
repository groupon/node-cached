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
