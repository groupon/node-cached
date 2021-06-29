[![nlm-github](https://img.shields.io/badge/github-groupon%2Fnode--cached%2Fissues-F4D03F?logo=github&logoColor=white)](https://github.com/groupon/node-cached/issues)
![nlm-node](https://img.shields.io/badge/node-%3E%3D10.13.0-blue?logo=node.js&logoColor=white)
![nlm-version](https://img.shields.io/badge/version-6.1.0-blue?logo=version&logoColor=white)
[![Publish to NPM](https://github.com/groupon/node-cached/actions/workflows/npm-publish.yml/badge.svg?event=push)](https://github.com/groupon/node-cached/actions/workflows/npm-publish.yml)
# cached

A simple caching library, inspired by the [Play cache API](http://www.playframework.com/documentation/2.2.x/ScalaCache) 
and biased towards [showing stale data instead of dog piling](http://highscalability.com/strategy-break-memcache-dog-pile).
The interface only exposes very limited functionality, there's no multi-get or deletion of cached data.
The library is designed to support different caching backends, though right now only memcached is implemented.

It supports both promise- and callback-based usage.

## Install

`npm install --save cached`

## Usage

More detailed API docs are in the next section.

### Getting and setting

```js
const cached = require('cached');

const kittens = cached('kittens');

async function cacheKittens() {

  // Set a key using a plain value
  await kittens.set('my.key', 'Hello World');
  
  // Set a key using a lazily created promise
  await kittens.set('my.key', () => {
    return cache.get('other.key');
  });
  
  // Set a key using a callback-style function
  await kittens.set('my.key', cached.deferred(done => {
    done(null, 'Hello World');
  }));
  
  const data = await kittens.getOrElse('my.key', () => {
    // This will store "Hello World" for key "my.key" if
    // "my.key" was not found
    return 'Hello World';
  });
  
  // Handle it the promise way
  let res;
  try {
    res = await kittens.get('my.key')
  } catch (e) {
    /* ... */
  }
}
```

## Supported backends

### Memory

Stores all the data in an in-memory object. This backend is set as default.

*__Caveat:__ `get()` will return a reference to the stored value. Mutating the returned value will affect the
value in the cache.*

### Memcached

A thin wrapper around [memcached-elasticache](https://github.com/jkehres/memcached-elasticache).
You can either provide a readily configured client, or a combination of hosts and additional options.
Without any additional options it will default to a local memcached on `11211`.

#### Custom client instance

```js
const Memcached = require('memcached-elasticache');

cached('myStuff', { backend: {
  type: 'memcached',
  client: new Memcached('192.168.0.102:11212', { poolSize: 15 }),
}});
```

#### Let `cached` create the instance

This will create the same cache as above.

```js
cached('myStuff', { backend: {
  type: 'memcached',
  hosts: '192.168.0.102:11212',
  poolSize: 15,
}});
```

#### Example

```js
cached('myStuff', { backend: {
  type: 'memory',
}});
```

## API

### cached(name: string, options) -> Cache

Creates a new named cache or returns a previously initialized cache.

* **name:** (required) A meaningful name for what is in the cache. This will also be used as a key-prefix. If the 
  name is `"cars"`, all keys will be prefixed with `"cars:"`
* **options:** (optional)
  * **backend:** An object that has at least a `type` property. If no backend is configured, the cache will run in 
    "noop"-mode, not caching anything. All other properties are forwarded to the backend, see 
    [using different backends](#supported-backends) for which backend types exist and what options they support.
  * **defaults:** Defaults to apply for all cache operations. See `Cache.setDefaults`

### cached.createCache(options) -> Cache

This allows you to circumvent the global named caches. The options are the same as above, just `name` is also part 
of the `options` object when using this function.

### cached.dropNamedCache(name: string) -> cached

Drop the given named cache.

### cached.dropNamedCaches() -> cached

Drop all named caches.

### cached.deferred(fn) -> () -> Promise

Convert a node-style function that takes a callback as its first parameter into a parameterless function that 
generates a promise. In other words: this is what you'd want to wrap your node-style functions in when using them 
as value arguments to `set` or `getOrElse`.

**Example:**
```js
const http = require('http');

const cache = cached('myStuff');
const f = cached.deferred(cb => {
  const req = http.get(myUrl, res => {
    cb(null, res.statusCode);
  });
  req.once('error', cb);
});

// f can now be called and the return value will be a promise
f().then(function(statusCode) { console.log(statusCode); });

// More importantly it can be passed into cache.set
await cache.set('someKey', f);
```

### Cache.setDefaults(defaults) -> Cache.defaults

Extends the current defaults with the provided defaults.
The two important ones are `freshFor` and `expire`:

* `expire` is the time in seconds after which a value should be deleted from the cache 
  (or whatever expiring natively means for the backend). Usually you'd want this to be `0` (never expire).
* `freshFor` is the time in seconds after which a value should be replaced. Replacing the value is done in 
  the background and while the new value is generated (e.g. data is fetched from some service) the stale 
  value is returned. Think of `freshFor` as a smarter `expire`.
* `timeout` is the maximum time in milliseconds to wait for cache operations to complete.
  Configuring a timeout ensures that all `get`, `set`, and `unset` operations fail fast.
  Otherwise, there will be situations where one of the cache hosts goes down and reads hang for minutes while 
  the memcached client retries to establish a connection.
  It's **highly** recommended to set a timeout.
  If `timeout` is left `undefined`, no timeout will be set, and the operations will only fail once the 
  underlying client, e.g. [`memcached`](https://github.com/3rd-Eden/memcached), gave up.
  
### Cache.get(key) -> Promise\<value\>

Cache retrieve operation. `key` has to be a string.
Cache misses are generally treated the same as retrieving `null`, errors should only be caused by transport 
errors and connection problems.
If you want to cache `null`/`undefined` (e.g. 404 responses), you may want to wrap it or choose a different 
value, like `false`, to represent this condition.

**Example:**
```js
await cache.get('foo');
```

### Cache.getOrElse(key, value, opts) -> Promise\<value\>

This is the function you'd want to use most of the time.
It takes the same arguments as `set` but it will check the cache first.
If a value is already cached, it will return it directly (respond as fast as possible).
If the value is marked as stale (generated `n` seconds ago with `n > freshFor`), it will replace the value 
in the cache. When multiple `getOrElse` calls concurrently encounter the same stale value, it will only replace 
the value once. This is done on a per-instance level, so if you create many cache instances reading and writing 
the same keys, you are asking for trouble. If you don't, the worst case is every process in your system fetching 
the value at once. Which should be a smaller number than the number of concurrent requests in most cases.

**Examples:**
```js
// with a value
const res = await cache.getOrElse('foo', 'bar');

// with a function returning a value
const res = await cache.getOrElse('foo', () => { return 'bar' });

// with a function returning a promise
const res = await cache.getOrElse('foo', () => { return Promise.resolve('bar') });

// with a promise function
const res = await cache.getOrElse('foo', async () => { return 'bar' });
```

### Cache.set(key, value, opts) -> Promise\<void\>

Cache store operation. `key` has to be a string, for possible `opts` see `Cache.setDefaults`.
The value can be any of the following:

a) Anything that can be converted to JSON<br>
b) A Promise of (a)<br>
c) A function returning (a) or (b)<br>

**Examples:**
```js
// with a value
await cache.set('foo', 'bar');

// with a function returning a value
await cache.set('foo', () => { return 'bar' });

// with a function returning a promise
await cache.set('foo', () => { return Promise.resolve('bar') });

// with a promise function
await cache.set('foo', async () => { return 'bar' });
```

### Cache.flush() -> Promise\<void\>

Flushes backend.

**Example:**
```js
await cache.flush()
```

### Cache.unset(key) -> Promise\<void\>

Cache delete operation.
`key` has to be a string.

**Example:**
```js
await cache.unset('foo');
```
