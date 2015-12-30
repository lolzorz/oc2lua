#oc2lua

a lightweight html page,convert objective-c code to lua.
Just focus on objective-c instead of lua's crazy grammar.

How to use
----------

It's easy to use,just copy your objective-c code,
and press "convert",
just copy it.

Block?
----------

Of course,but maybe you should modify it,
because this is suit for [alibaba's wax framework](http://github.com/alibaba/wax).

But
----------
It isn't perfact yet.

* You'd better not to write C-function

* You'd can only use such for loop grammar

``` c
for(type name = value1; type < value2; type++) {
	
}
for(type name = value1; type < value2; type--) {
	
}
for(type *value in array) {
	
}
```

* Not support If yet, but comming soon.:)