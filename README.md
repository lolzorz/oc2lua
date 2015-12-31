# oc2lua

A lightweight objective-c-to-lua converter written in javascript. It focuses only on objective-c instead of lua's crazy grammar.

How to use
----------

It's easy to use.

1. `clone` or `download` this project
2. run `oc2lua-beta.html` in your browser
3. copy your objective-c code to the left textbox
4. press `convert`
5. the converted lua code will appear on the right textbox.

Update
----------

#### Dec 31, 2015

* Support `NSString` now.

* Support `BOOL` now.

* `.` grammar bug fixed.

* `for loop` bug fixed.

Block?
----------

Of course, but in order to be compatible without [alibaba's wax framework](http://github.com/alibaba/wax), a little modification is required.

But
----------
It's not perfect yet.

* C-style functions are not recommended

* You can only use `for` for loops like these:

``` c
for(type name = value1; name < value2; type++) {
	
}
for(type name = value1; name < value2; type--) {
	
}
for(type *value in array) {
	
}
```

* `if` is also not supported yet, but comming soon too. :)

Special Thanks
----------
Thank [sherlock](https://github.com/sherlock917/node-online) for his front-end styles.