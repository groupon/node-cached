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
