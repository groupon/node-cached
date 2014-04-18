
expect = require 'expect.js'
bond = require 'bondjs'

Q = require 'q'
{defaults} = require 'underscore'
Cache = require '../lib/cache'
cached = require '../lib/cached'

cache = null
values =
  key1: 'Value 1'
  key2: 'Value 2'
  key3: 'Value 3'

backendOptions =
  hosts: if process.env.MEMCACHED__HOST then "#{process.env.MEMCACHED__HOST}:11211" else '127.0.0.1:11211'

wait = (ms) ->
  deferred = Q.defer()
  setTimeout deferred.resolve, ms
  deferred.promise

describe 'Cache', ->
  it 'always has a backend', ->
    cache = new Cache {}
    expect(cache.backend).not.to.be undefined

  it 'has a "noop" backend by default', ->
    cache = new Cache {}
    expect(cache.backend.type).to.equal 'noop'

  describe 'Cache#set', ->
    beforeEach ->
      cache = new Cache backend: 'memory'

    it 'supports callback style', (done) ->
      cache.set 'key1', values.key1, done

    it 'supports promise style', (done) ->
      cache.set('key2', values.key2, { expire: 1 }).nodeify done

  [ 'memory', 'memcached' ].map (backendType) ->
    describe "with backend \"#{backendType}\"", ->

      beforeEach ->
        cache = new Cache backend: defaults({ type: backendType }, backendOptions), name: 'awesome-name', debug: true
      afterEach ->
        cache.end()

      describe 'Cache#get', ->
        it 'gets a previously set key', (done) ->
          [
            ->
              cache.set 'key1', values.key1
            -> cache.get 'key1'
            (val) ->
              expect(val).to.be values.key1
          ].reduce(Q.when, Q()).nodeify done

        it 'is aware of expires', (done) ->
          [
            -> Q.all [
              cache.set 'key1', values.key1, expire: 1
              cache.set 'key2', values.key2, expire: 0
              cache.set 'key3', values.key3, expire: 4
            ]
            -> wait 2000
            -> Q.all [
              cache.get 'key1'
              cache.get 'key2'
              cache.get 'key3'
            ]
            ([ val1, val2, val3 ]) ->
              expect(val1).to.be null # less than 2 seconds lifetime
              expect(val2).to.equal values.key2 # eternal lifetime
              expect(val3).to.equal values.key3 # more than 2 seconds lifetime
          ].reduce(Q.when, Q()).nodeify done

      describe 'Cache#getOrElse', ->
        it 'replaces values lazily', (done) ->
          generatorCalled = 0
          # generate a value in a certain time
          valueGenerator = (v, ms) -> ->
            ++generatorCalled
            Q.delay(ms).then -> v

          originalValue = values.key1
          generatedValue = 'G1'

          valueA = 'NOT_SET' # initial set
          valueB = 'NOT_SET' # getOrElse #1 (should be original value)
          valueC = 'NOT_SET' # getOrElse #2 (should be original value)
          valueD = 'NOT_SET' # getOrElse #3 (should be generated value)

          chainIsOver = false

          # abstract:
          # * First we set a value that is fresh for one second.
          # * We then wait 1sec+ to be sure that the value is stale
          # * When we #get the value now, it should be returned though it's stale
          # * Then we call #getOrElse with an "expensive" value generator
          # * #getOrElse should immediately return with the stale value while starting
          #   to generate the new value in the background
          # * While generation is running, a second call to #getOrElse should
          #   - not start another value generator
          #   - return immediately with the stale value
          # * After generating the value is done we call #getOrElse a 3rd time. We should
          #   be getting the generated value and not be starting another generator
          [
            -> cache.set 'key1', originalValue, freshFor: 1
            -> wait 1200
            -> cache.get('key1')
            (v) -> expect(v).to.be originalValue

            -> cache.getOrElse 'key1', valueGenerator(generatedValue, 100), freshFor: 5
            (v) ->
              expect(v).to.be originalValue
            -> wait 50 # while generating
            -> cache.getOrElse 'key1', valueGenerator('G2', 5000), freshFor: 5
            (v) ->
              expect(v).to.be originalValue
            -> wait 100
            -> cache.getOrElse 'key1', valueGenerator('G3', 5000), freshFor: 5
            (v) ->
              expect(v).to.be generatedValue
              expect(generatorCalled).to.be 1
          ].reduce(Q.when, Q()).nodeify done

        it 'throws errors', (done) ->
          errorGenerator = cached.deferred (cb) ->
            cb new Error 'Big Error'

          theCallback = (err, data) ->
            expect(err)
            expect(err.message).to.be 'Big Error'
            expect(data).to.be undefined
            done()

          cache.getOrElse 'bad_keys', errorGenerator, freshFor: 1, theCallback

        it 'handles thrown get errors by falling back on the value refresher', (done) ->
          valueGenerator = cached.deferred (cb) ->
            cb null, 'fresh cats'

          theCallback = (err, data) ->
            expect(err).to.be null
            expect(data).to.be 'fresh cats'
            done()

          bond(cache, 'getWrapped').return Q.reject new Error('backend get troubles')

          cache.getOrElse 'bad_get', valueGenerator, freshFor: 5, theCallback

        it 'handles thrown set errors by falling back on the generated value', (done) ->
          valueGenerator = cached.deferred (cb) ->
            cb null, 'generated bunnies'

          theCallback = (err, data) ->
            expect(err).to.be null
            expect(data).to.be 'generated bunnies'
            done()

          bond(cache, 'set').return Q.reject new Error('backend set troubles')

          cache.getOrElse 'bad_set', valueGenerator, freshFor: 5, theCallback
