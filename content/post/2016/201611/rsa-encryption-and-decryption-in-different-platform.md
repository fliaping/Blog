+++
author = "Payne Xu"
categories = ["Developer"]
date = 2016-11-22T11:36:25Z
description = ""
draft = false
slug = "rsa-encryption-and-decryption-in-different-platform"
tags = ["rsa", "java", "php"]
title = "不同平台下的RSA加解密及认证"

+++



RSA是目前(2016)用途最为广泛的非对称加密方法，广泛应用于加解密以及认证，例如：ssh登录、加密通信、https等很多方面。但是不同平台对其支持时，在实现上有少许的不同，这些不同可能会阻碍我们使用，尤其是在跨平台的时候，如果不知道其中的细节，往往会失败，本文以作者用过的几个语言做一些实例。

代码：[https://github.com/fliaping/tools_code/tree/master/RSA](https://github.com/fliaping/tools_code/tree/master/RSA)

目前只有 JAVA 和 PHP 的互通，后续可能进行一些补充。

<!--more-->
# RSA基础

这里就不做扫盲工作了，基本的介绍，请自行搜索。

## RSA原理
关于RSA的原理，推荐大家看看[阮一峰大神](http://www.ruanyifeng.com/blog/)这两篇文章：
1. [RSA算法原理（一）](http://www.ruanyifeng.com/blog/2013/06/rsa_algorithm_part_one.html)
2. [RSA算法原理（二）](http://www.ruanyifeng.com/blog/2013/07/rsa_algorithm_part_two.html)
作者数学一般，看了一遍但总感觉理解的不是很透彻，有时间多看几遍。

RSA加密原理概述： 

RSA的安全性依赖于大数的分解，公钥和私钥都是两个大素数（大于100的十进制位）的函数。据猜测，从一个密钥和密文推断出明文的难度等同于分解两个大素数的积。
   
密钥的产生：    
 1.选择两个大素数 `p,q` ,计算 `n=p*q `   
 2.随机选择加密密钥 `e` ,要求 `e` 和 `(p-1)*(q-1)`互质    
 3.利用 Euclid 算法计算解密密钥 `d` , 使其满足 `e*d = 1(mod(p-1)*(q-1))` (其中 n,d 也要互质)    
 4:至此得出公钥为 `(n,e)` 私钥为 `(n,d)` 

## 加密和加签有什么区别
加密：公钥放在客户端，并使用公钥对数据进行加密，服务端拿到数据后用私钥进行解密；

加签：私钥放在客户端，并使用私钥对数据进行加签，服务端拿到数据后用公钥进行验签。

前者完全为了加密；后者主要是为了防恶意攻击，防止别人模拟我们的客户端对我们的服务器进行攻击，导致服务器瘫痪。


# 生成公私密钥
这里主要讲在终端用 openssl 如何生成，关于如何使用代码生成，请参考相关代码。

```bash
#生成模长为1024bit的私钥
openssl genrsa -out private_key.pem 1024
#生成certification require file
openssl req -new -key private_key.pem -out rsaCertReq.csr
#生成certification 并指定过期时间
openssl x509 -req -days 3650 -in rsaCertReq.csr -signkey private_key.pem -out rsaCert.crt
#生成公钥供iOS使用
openssl x509 -outform der -in rsaCert.crt -out public_key.der
#生成私钥供iOS使用 这边会让你输入密码，后期用到在生成secKeyRef的时候会用到这个密码
openssl pkcs12 -export -out private_key.p12 -inkey private_key.pem -in rsaCert.crt
#生成pem结尾的公钥供Java使用
openssl rsa -in private_key.pem -out rsa_public_key.pem -pubout
#生成pkcs8的私钥供Java使用
openssl pkcs8 -topk8 -in private_key.pem -out pkcs8_private_key.pem -nocrypt
#反转pkcs8为rsa私钥
#openssl rsa -in pkcs8_private_key.pem -out rsa_public_key.pem
# 或者  openssl pkcs8 -in pkcs8_private_key.pem -nocrypt -out rsa_public_key.pem
```

# Java使用
暂时见代码

# PHP使用
暂时见代码

# 参考文章
1. [一篇搞定RSA加密与SHA签名|与Java完全同步](http://www.jianshu.com/p/a1bad1e2be55)
2. [使用RSA在Java端私钥加密，PHP端公钥验证](http://daimin.github.io/posts/shi-yong-RSA-zai-Java-duan-si-yao-jia-mi-PHP-duan-gong-yao-yan-zheng.html)
3. [Java使用RSA加密解密签名及校验](http://blog.csdn.net/wangqiuyun/article/details/42143957)






