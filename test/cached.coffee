
expect = require 'expect.js'

cached = require '..'

describe 'cached', ->
  beforeEach ->
    cached.dropNamedCaches()

  it 'is a function', ->
    expect(typeof cached).to.be 'function'

  it 'can create different named caches', ->
    expect(cached('foo')).not.to.be(cached('bar'))
    expect(cached('foo')).not.to.be(cached())
    expect(cached.knownCaches()).to.eql [ 'foo', 'bar', 'default' ]

  it 'the default cache is named "default"', ->
    expect(cached()).to.be(cached('default'))

  it 'returns the same named cache for subsequent calls', ->
    expect(cached('foo')).to.be(cached('foo'))

  it 'knows no caches', ->
    expect(cached.knownCaches()).to.eql []
