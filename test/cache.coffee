'use strict'
assert = require 'assertive'

Promise = require 'bluebird'
{defaults} = require 'lodash'
Cache = require '../lib/cache'
cached = require '../lib/cached'

values =
  key1: 'Value 1'
  key2: 'Value 2'
  key3: 'Value 3'

backendOptions =
  hosts:
    if process.env.MEMCACHED__HOST
      "#{process.env.MEMCACHED__HOST}:11211"
    else
      '127.0.0.1:11211'

waterfall = (fns) ->
  next = (prev, fn) -> prev.then fn
  fns.reduce next, Promise.resolve()

unexpected = (value) ->
  console.error value
  throw new Error 'Unexpected value'

unhandledRejections = []
Promise.onPossiblyUnhandledRejection (err) ->
  console.error 'Possibly unhandled rejection:', err.stack
  unhandledRejections.push err

after 'Check for unhandled rejections', ->
  if unhandledRejections.length
    console.error 'Found %d unhandled rejections', unhandledRejections.length
    throw unhandledRejections[0]

describe 'Cache', ->
  it 'always has a backend', ->
    cache = new Cache {}
    assert.notEqual undefined, cache.backend

  it 'has a "noop" backend by default', ->
    cache = new Cache {}
    assert.equal 'noop', cache.backend.type

  describe 'Cache#set', ->
    beforeEach ->
      @cache = new Cache backend: 'memory'

    it 'supports callback style', (done) ->
      @cache.set 'key1', values.key1, done

    it 'supports promise style', (done) ->
      @cache.set('key2', values.key2, { expire: 1 }).nodeify done

  [ 'memory', 'memcached' ].map (backendType) ->
    describe "with backend \"#{backendType}\"", ->
      before ->
        @cache = new Cache backend: defaults({ type: backendType }, backendOptions), name: 'awesome-name', debug: true
      after ->
        @cache.end()

      describe 'Cache#get', ->
        it 'gets a previously set key', ->
          waterfall [
            =>
              @cache.set 'key1', values.key1
            =>
              @cache.get 'key1'
            (val) ->
              assert.equal values.key1, val
          ]

        it 'is aware of expires', ->
          stored = Promise.all [
            @cache.set 'key1', values.key1, expire: 1
            @cache.set 'key2', values.key2, expire: 0
            @cache.set 'key3', values.key3, expire: 4
          ]

          retrieve = stored.delay(2000).then =>
            Promise.all [
              @cache.get 'key1'
              @cache.get 'key2'
              @cache.get 'key3'
            ]

          retrieve.spread (val1, val2, val3) ->
            # less than 2 seconds lifetime
            assert.equal null, val1
            # eternal lifetime
            assert.equal values.key2, val2
            # more than 2 seconds lifetime
            assert.equal values.key3, val3

      describe 'Cache#getOrElse', ->
        it 'replaces values lazily', ->
          generatorCalled = 0
          # generate a value in a certain time
          valueGenerator = (v, ms) -> ->
            ++generatorCalled
            Promise.resolve(v).delay(ms)

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
          waterfall [
            =>
              @cache.set 'key1', originalValue, freshFor: 1
            ->
              Promise.delay 1200
            =>
              @cache.get('key1')
            (v) ->
              assert.equal originalValue, v

            =>
              @cache.getOrElse 'key1', valueGenerator(generatedValue, 100), freshFor: 5
            (v) ->
              assert.equal originalValue, v
            ->
              Promise.delay 50 # while generating
            =>
              @cache.getOrElse 'key1', valueGenerator('G2', 5000), freshFor: 5
            (v) ->
              assert.equal originalValue, v
            ->
              Promise.delay 100
            =>
              @cache.getOrElse 'key1', valueGenerator('G3', 5000), freshFor: 5
            (v) ->
              assert.equal generatedValue, v
              assert.equal 1, generatorCalled
          ]

        it 'throws errors', (done) ->
          errorGenerator = cached.deferred (cb) ->
            cb new Error 'Big Error'

          theCallback = (err, data) ->
            assert.equal 'Big Error', err?.message
            assert.equal undefined, data
            done()

          @cache.getOrElse 'bad_keys', errorGenerator, freshFor: 1, theCallback

        describe 'refresh of expired value failing', ->
          before 'set value that is stale after a second', ->
            @cache.set 'key1', values.key1, freshFor: 1, expire: 3

          before 'wait >1 seconds', (done) -> setTimeout(done, 1100)

          it 'returns the original value if generating a new value fails', ->
            generator = -> Promise.reject new Error 'Oops'
            @cache.getOrElse 'key1', generator
              .then assert.equal.bind(null, values.key1)

          describe 'after two more second', ->
            before 'wait >2 seconds', (done) -> setTimeout(done, 2100)

            it 'fails to return a value if generating fails again', ->
              generator = -> Promise.reject new Error 'Oops'
              @cache.getOrElse 'key1', generator
                .then unexpected, (err) ->
                  assert.equal 'Oops', err.message

        describe 'backed.get failing', ->
          before ->
            @failCache = new Cache {
              backend: @cache.backend
              name: 'awesome-name'
              debug: true
            }
            @failCache.getWrapped = ->
              Promise.reject new Error('backend get troubles')

          it 'falls back on the value refresher', (done) ->
            valueGenerator = cached.deferred (cb) ->
              cb null, 'fresh cats'

            theCallback = (err, data) ->
              assert.equal null, err
              assert.equal 'fresh cats', data
              done()

            @failCache.getOrElse 'bad_get', valueGenerator, freshFor: 5, theCallback

        describe 'backend.set failing', ->
          before ->
            @failCache = new Cache {
              backend: @cache.backend
              name: 'awesome-name'
              debug: true
            }
            @failCache.set = ->
              Promise.reject new Error('backend set troubles')

          it 'falls back on the generated value', (done) ->
            valueGenerator = cached.deferred (cb) ->
              cb null, 'generated bunnies'

            theCallback = (err, data) ->
              assert.equal null, err
              assert.equal 'generated bunnies', data
              done()

            @failCache.getOrElse 'bad_set', valueGenerator, freshFor: 5, theCallback
