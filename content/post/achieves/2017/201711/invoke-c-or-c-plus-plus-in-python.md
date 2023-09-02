+++
author = "Payne Xu"
date = 2017-11-03T23:26:00Z
categories = ["Developer"]
tags = ["python"]
draft = false
slug = "invoke-c-or-c-plus-plus-in-python"
title = "Python 调用C/C++"

+++

Python3 中提供了 ctypes 模块，它支持与 C 兼容的数据类型，可以用来加载 C/C++ 动态库。

## C代码

test.h

```c
extern int add(int, int);
```
test.c

<!--more-->

```c
#include "test.h"
int add(int arg1, int arg2)
{
    return arg1 + arg2;
}
```
## C++代码

test.h

```c++
class Foo
{
    public:
        int add(int arg1, int arg2)
        {
            return arg1 + arg2;
        }
};
extern "C" int add_wrapper(int, int);
```
test.cpp

```c++
#include "test.h"
int add_wrapper(int arg1, int arg2)
{
    Foo obj;
    return obj.add(arg1, arg2);
}
```
## 生成动态库

```bash
# c语言： gcc -c -fPIC -o test.o test.c
gcc -c -fPIC -o test.o test.cpp
gcc -shared -o libtest.so test.o
```

## python中调用

```python
from ctypes import cdll
lib = cdll.LoadLibrary("./libtest.so")
print(lib.add_wrapper(2, 3))
```

