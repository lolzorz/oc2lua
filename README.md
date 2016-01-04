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

#### Jan 4, 2016

* Method convert bug fixed.

* Support convert method define:
``` objective-c
- (void)viewDidLoad {
}
```

#### Jan 3, 2016

* Add convert error alert.

#### Jan 2, 2016

* Support `C` function now.

#### Dec 31, 2015

* Support `NSString` now.

* Support `BOOL` now.

* Support `if` now.

* `.` grammar bug fixed.

* `for loop` bug fixed.

Block?
----------

Of course, but in order to be compatible without [alibaba's wax framework](http://github.com/alibaba/wax), a little modification is required.

But
----------
It's not perfect yet.

* Quick operation of `NSDictionary` and `NSArray` are not supported:

``` objective-c
NSMutableArray *arr;
NSMutableDictionary *dic;

//these operation are not supported:
id obj1 = arr[1];
id obj2 = dic[@"objkey1"];
dic[@"objkey2"] = obj1;
```

* You can only use `for` for loops like these:

``` objective-c
for(type name = value1; name < value2; type++) {
	
}
for(type name = value1; name < value2; type--) {
	
}
for(type *value in array) {
	
}
```

Special Thanks
----------
Thank [sherlock](https://github.com/sherlock917/node-online) for his front-end styles.