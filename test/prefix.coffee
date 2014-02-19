
expect = require 'expect.js'
Q = require 'q'

cached = require '..'

describe 'cache prefix', ->
  it 'adds a prefix to named caches', (done) ->
    cacheA = cached 'a', backend: { type: 'memory' }
    cacheB = cached 'b'
    # simulate "writing to the same store"
    cacheB.backend = cacheA.backend

    aValue = 'a-value'
    bValue = 'b-value'

    [
      -> cacheA.set 'key', aValue
      -> cacheB.set 'key', bValue
      -> cacheA.get 'key'
      (v) -> expect(v).to.be(aValue)
      -> cacheB.get 'key'
      (v) -> expect(v).to.be(bValue)
    ].reduce(Q.when, Q()).nodeify done
