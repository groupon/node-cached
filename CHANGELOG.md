### v6.1.0 (2021-06-29)
<a id="v6.1.0"></a>
#### 🚀 New Features

* [#62](https://github.com/groupon/node-cached/pull/62) feat: add redis backend ([@aaarichter](https://github.com/aaarichter))


### v6.0.0 (2021-06-27)
<a id="v6.0.0"></a>
#### 💥 Breaking Changes

[#48](https://github.com/groupon/node-cached/pull/48) refactor: rewrite, use memcached-elasticache & drop Node 8 ([@aaarichter](https://github.com/aaarichter))

- Dropped Node 8.x. Use Node 10.13 or higher.
- Uses `memcached-elasticache` with AWS support instead of `memcached`. See https://github.com/jkehres/memcached-elasticache#readme
- API functions no longer support callbacks.
- API functions use native Promises instead of `Bluebird`.
- `cached()` needs to be called with a string argument as name. If the `name` argument is undefined, it will fallback to `"default"`.

- `Cache.setBackend()` no longer returns the created backend.
- `Cache.getWrapped()` is removed.
- Cache backend APIs need to be promise based.
- Cache private function have been renamed.
- The following function are now private:
  - `Cache.applyPrefix`
  - `Cache.end`
  - `Cache.prepareOptions`
  - `Cache.setBackend`

- `cache.set()`, `cache.get()`, `cache.getOrElse()`, `cache.unset()` no longer support the callback argument. Use them as promise.
- `cache.set()` no longer returns a value.
- `cache.set(key, value)` accepts functions and promises as value.

- Any client passed with the memcached backend options has to be an instance of `Memcached`.
- Backend setters no longer return a value.
- backend `addType()` does not return backend class anymore.

#### 📦️ Code Refactoring

* [#48](https://github.com/groupon/node-cached/pull/48) refactor: rewrite, use memcached-elasticache & drop Node 8 ([@aaarichter](https://github.com/aaarichter))

#### 🏡 Internal

* [#59](https://github.com/groupon/node-cached/pull/59) ci(actions): adding GitHub actions ([@aaarichter](https://github.com/aaarichter))


### 5.0.2

* misc updates - **[@dbushong](https://github.com/dbushong)** [#46](https://github.com/groupon/node-cached/pull/46)
  - [`25732ff`](https://github.com/groupon/node-cached/commit/25732ffaf461edddb9c03db28bb3c6b4f8d91342) **chore:** run updater
  - [`eb5db4e`](https://github.com/groupon/node-cached/commit/eb5db4e64de5e6472de68c9e18cd9b3d05e066d3) **chore:** lint fixes
  - [`e301ea9`](https://github.com/groupon/node-cached/commit/e301ea90eb56b2ce143fc394eea869538f3a3716) **chore:** npm audit fix


### 5.0.1

* chore: Remove yarn check that breaks people - **[@jkrems](https://github.com/jkrems)** [#42](https://github.com/groupon/node-cached/pull/42)
  - [`147a7f3`](https://github.com/groupon/node-cached/commit/147a7f3e1a5dd1a3690e134facf077b3b3329edf) **chore:** Remove yarn check that breaks people


### 5.0.0

#### Breaking Changes

drops support for Node 6, which is a current LTS release.

*See: [`f4ba4c9`](https://github.com/groupon/node-cached/commit/f4ba4c988b5d5db0cf07edfe9f0013d5fada075f)*

#### Commits

* feat: drop node4 support - **[@aaarichter](https://github.com/aaarichter)** [#39](https://github.com/groupon/node-cached/pull/39)
  - [`29b26fa`](https://github.com/groupon/node-cached/commit/29b26fa240033cd7b5409407ea42b375a29c4c33) **feat:** drop node4 support
  - [`23dcc6a`](https://github.com/groupon/node-cached/commit/23dcc6aa409f82be5485f3041948a9cdd1c1755e) **chore:** feedback addressed
* Drop Node 6 support, and Babel as a result - **[@markowsiak](https://github.com/markowsiak)** [#40](https://github.com/groupon/node-cached/pull/40)
  - [`2339fd1`](https://github.com/groupon/node-cached/commit/2339fd1d2064e6bab3f21fce0ca68af3916be129) **chore:** npm audit, drop babel
  - [`f4ba4c9`](https://github.com/groupon/node-cached/commit/f4ba4c988b5d5db0cf07edfe9f0013d5fada075f) **chore:** drop support for node 6, keep async/await in test
  - [`fe943d8`](https://github.com/groupon/node-cached/commit/fe943d8b7b34c7d4439e674cacc675699e3ba98e) **chore:** use npm 6 in travis


### 4.3.2

* Apply latest nlm generator - **[@markowsiak](https://github.com/markowsiak)** [#38](https://github.com/groupon/node-cached/pull/38)
  - [`35b216e`](https://github.com/groupon/node-cached/commit/35b216e3d11b94502d968d40fcf7f34e7a5b507e) **chore:** Apply latest nlm generator


### 4.3.1

* docs: Clarify that timeout applies to unset - **[@Zanadar](https://github.com/Zanadar)** [#36](https://github.com/groupon/node-cached/pull/36)
  - [`89209ce`](https://github.com/groupon/node-cached/commit/89209cefca9ad39ea1b2a789dd49e23d65eee960) **docs:** Clarify that timeout applies to unset
* docs: Fix typo in contributing.md - **[@Zanadar](https://github.com/Zanadar)** [#35](https://github.com/groupon/node-cached/pull/35)
  - [`a3e5efa`](https://github.com/groupon/node-cached/commit/a3e5efaeec84e115de7fea035d5f69efc08cae3e) **docs:** fix typo in contributing.md


### 4.3.0

* feat: expose `cache.unset` - **[@fdegiuli](https://github.com/fdegiuli)** [#31](https://github.com/groupon/node-cached/pull/31)
  - [`4e296af`](https://github.com/groupon/node-cached/commit/4e296afed9ce305ed27f94fb9d0e011a01d0bd87) **feat:** expose `cache.unset`


### 4.2.3

* docs: Update memory backend docs - **[@fdegiuli](https://github.com/fdegiuli)** [#29](https://github.com/groupon/node-cached/pull/29)
  - [`3cebdb3`](https://github.com/groupon/node-cached/commit/3cebdb3cdb0dc997803d81d6c8c615e308261b0b) **docs:** Update memory backend docs
  - [`dabce45`](https://github.com/groupon/node-cached/commit/dabce45603667e7112a87bf5592eaab73aac3b0e) **docs:** Fix formatting


### 4.2.2

* Update documentation for `cached` and backends - **[@fdegiuli](https://github.com/fdegiuli)** [#27](https://github.com/groupon/node-cached/pull/27)
  - [`b137f56`](https://github.com/groupon/node-cached/commit/b137f56b77f1278ca6ab3680b6a0d1187941f788) **docs:** Add memory, noop backends to docs
  - [`e4bd666`](https://github.com/groupon/node-cached/commit/e4bd6667d8f9fa2f4017876badee9e28e9d0bd49) **docs:** Deprecate unnamed caches


### 4.2.1

* Apply latest nlm generator - **[@i-tier-bot](https://github.com/i-tier-bot)** [#24](https://github.com/groupon/node-cached/pull/24)
  - [`ee2b354`](https://github.com/groupon/node-cached/commit/ee2b354f83c2ee0fa4cc865e49bb4c6c4434c001) **chore:** Apply latest nlm generator


### 4.2.0

* True timeouts for cache calls - **[@jkrems](https://github.com/jkrems)** [#22](https://github.com/groupon/node-cached/pull/22)
  - [`0d9e48f`](https://github.com/groupon/node-cached/commit/0d9e48fc07b82723a481499084a9bf14f3bc1b0d) **feat:** True timeouts for cache calls


### 4.1.1

* Switch to nlm - **[@jkrems](https://github.com/jkrems)** [#21](https://github.com/groupon/node-cached/pull/21)
  - [`bdac8c6`](https://github.com/groupon/node-cached/commit/bdac8c6f1f68e6296abf513c941736c88771149a) **chore:** Switch to nlm


4.0.2
-----
* Fix unhandled rejections w/ lazy fetching - @jkrems
  https://github.com/groupon/node-cached/pull/16

4.0.1
-----
* Fixing memcached.set slowness - @chkhoo #15

4.0.0
-----
* Recompiled using cs 1.9.1 - @jkrems #11
* Bringing this package into the future, io.js support - @jkrems #10

v3.0.1
------
* exchange cs (for csr) and lodash (for underscore) - @Kofia5 #8

v3.0.0
------
Upgrading to this version changes the key hashing.
This means that it can potentially invalidate your cache entirely.

* Update memcached package to 2.0.0 - @khoomeister #7

v2.0.3
------
* Pin the memcached version pre-memory leak - @jkrems #6

v2.0.2
------
* Fix bug where backend errors while caching made getOrElse fail - @Kofia5 #4

v2.0.1
------
* Fix bug where backend errors were forwarded in getOrElse - @Kofia5 #3

v2.0.0
------
* Initial public release
