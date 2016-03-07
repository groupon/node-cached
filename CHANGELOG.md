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
