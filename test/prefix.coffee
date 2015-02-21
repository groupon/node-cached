'use strict'
assert = require 'assertive'
Promise = require 'bluebird'

cached = require '..'

waterfall = (fns) ->
  next = (prev, fn) -> prev.then fn
  fns.reduce next, Promise.resolve()

describe 'cache prefix', ->
  it 'adds a prefix to named caches', ->
    cacheA = cached 'a', backend: { type: 'memory' }
    cacheB = cached 'b'
    # simulate "writing to the same store"
    cacheB.backend = cacheA.backend

    aValue = 'a-value'
    bValue = 'b-value'

    waterfall [
      -> cacheA.set 'key', aValue
      -> cacheB.set 'key', bValue
      -> cacheA.get 'key'
      (v) -> assert.equal aValue, v
      -> cacheB.get 'key'
      (v) -> assert.equal bValue, v
    ]
