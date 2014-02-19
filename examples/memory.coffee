
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
