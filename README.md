#oc2lua

A lightweight html page,convert objective-c code to lua.
Just focus on objective-c instead of lua's crazy grammar.
Thanks to [sherlock](https://github.com/sherlock917/node-online) for the css template.

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

* Can not convert NSString yet, and I think you'd better add string by hand after converting. Because some complex string may interference the regular expressions to convert.

* Can not convert BOOL yet, but commint soon.:)

``` c
for(type name = value1; name < value2; type++) {
	
}
for(type name = value1; name < value2; type--) {
	
}
for(type *value in array) {
	
}
```

* Not support If yet, but comming soon.:)