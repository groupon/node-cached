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
