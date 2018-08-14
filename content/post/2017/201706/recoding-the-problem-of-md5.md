+++
author = "Payne Xu"
categories = ["md5"]
date = 2017-06-28T03:48:25Z
description = ""
draft = false
slug = "recoding-the-problem-of-md5"
tags = ["md5"]
title = "md5使用问题记录"

+++



java后端用到md5来生产token，于是在网上找个了示例，跑了一下，看起来没什么问题。服务的调用方是python，一起测了一下，也没啥问题，也就没在意，直接上线了，上线之后很神奇的是大概有一少半的请求会发生前后端生产token不一致的情况，这就比较纠结了，不过加上详细日志，发现后端算出的token和python传过来的最前面少了个0。然后重新看了下java生产md5的代码：

```java
MessageDigest md = MessageDigest.getInstance("MD5");
md.update(str.getBytes());
byte[] bytes = md.digest();
//！！！这是错误的代码
return new BigInteger(1, bytes).toString(16);
```

<!--more  -->

可以看到通过MessageDigest将字符串hash得到byte数组，然后再转为String，这个String其实就是byte数组的十六进制表示。（回顾下一个byte八位，用两个十六进制字符表示）

代码中用Biginteger来进行转换，但是可以看到Biginteger的toString(int radix)实现会去掉开头的0,简单看下实现：

```java
String toString(int radix)
↓
//这个方法会将对象中的int数组mag通过递归，分成小块来处理
static void toString(BigInteger u, StringBuilder sb, int radix, int digits)
↓
String smallToString(int radix) // 这个方法是为了提高小参数的性能
↓
String toString(long i, int radix) //问题在这个函数，开头的0并不会加入
```

那么解决这个问题的也很简单，将`byte[]`转换为16进制字符串就好了

```java
public static String encodeHex(final byte[] data) {
    final char[] DIGITS_LOWER =
            {'0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'a', 'b', 'c', 'd', 'e', 'f'};
    final int l = data.length;
    final char[] out = new char[l << 1];
    // two characters form the hex value.
    for (int i = 0, j = 0; i < l; i++) {
        out[j++] = DIGITS_LOWER[(0xF0 & data[i]) >>> 4];
        out[j++] = DIGITS_LOWER[0x0F & data[i]];
    }
    return new String(out);
}
```
当然用别人封装过的方法更方便（Apache common）： `DigestUtils.md5Hex(str)`

这里还有其他的方法： [MD5 Hashing in Java](http://www.baeldung.com/java-md5)
