+++
author = "Payne Xu"
categories = ["http"]
date = 2017-07-04T13:45:25Z
description = ""
draft = false
slug = "the-http-status-code-304"
tags = ["http"]
title = "【翻译】http status code 304"

+++




![http-status-code-304](https://o364p1r5a.qnssl.com/blog/http-status-code-304.png)
在研究http2的是时候，无意中发现http code为304，对此不解，故搜之，发现该文，顺便翻译一下。奈何英文水平有限，词不达意，望阅者见谅。以小见大，感叹技术文章翻译之艰难，大多译文不精确也是可以理解，故还是多看英文原文吧。

原文：[304 NOT MODIFIED](https://httpstatuses.com/304)，本文在原文基础上增加了示例说明。


<!--more  -->

# 304 NOT MODIFIED
一个带条件的GET或HEAD请求已经被（服务器）接受，反之条件与事实不符，会返回[200 OK](https://httpstatuses.com/200)作为结果。

换句话说，不需要服务器传输目标资源，因为请求表明，产生该请求条件的客户端已经有了可用的目标资源；因此服务器重定向客户端，让它使用缓存在本地的资源，当然这个缓存来自于上一次[200 OK](https://httpstatuses.com/200)的返回。

服务器返回304时，header字段中的：Cache-Control, Content-Location, Date, ETag, Expires 和 Vary的值必须和该请求在[200 OK](https://httpstatuses.com/200)情况下一样。（译者注：列出字段不必完全包含在返回头中）

由于304回应的目标是当接受者已经有一个或者多个缓存的资源的时候尽可能传输最少的数据，因此一个发送者不
应该创建除了前面列出的字段外的其他header元数据，除非这些元数据是为了指示缓存的更新（例如 当response中没有ETag字段，那么Last-Modified字段可能有用）。

接收到304回应的缓存要求被定义在[Section 4.3.4 of RFC7234](http://tools.ietf.org/html/rfc7234#section-4.3.4). 如果一个条件请求源自一个出站客户端，像有自己缓存的用户代理发送一个带条件的GET到共享代理，那么这个代理应该转发304回应给这个客户端。

一个304回应不能包含消息体，应该在header行之后的第一个空行时结束


Source: [RFC7232 Section 4.1](http://tools.ietf.org/html/rfc7232#section-4.1)

# 304 CODE REFERENCES

* Rails HTTP Status Symbol `:not_modified`

* Go HTTP Status Constant `http.StatusNotModified`

* Symfony HTTP Status Constant `Response::HTTP_NOT_MODIFIED`

* Python2 HTTP Status Constant `httplib.NOT_MODIFIED`

* Python3+ HTTP Status Constant `http.client.NOT_MODIFIED`

* Python3.5+ HTTP Status Constant `http.HTTPStatus.NOT_MODIFIED`

# 示例
文章开头的图片中可以看到在一个网页加载的一系列请求中，有很多304回应，这些资源其实都没有从服务器传输过来，用的是浏览器本地的缓存。

再来看下面的图，这是本地304回应的完整请求。可以先看请求头的两个字段`If-Modified-Since`和`If-None-Match`，前者是上次`200 OK`返回中的`Last-Modified`字段的值，后者是`etag`的值。`If-Modified-Since`字段的意思根据名字就可以看出，是一个条件，即资源是不是在这时间之后被修改过，如果没有，返回304，有的话按照正常的200返回。

![http-status-code-304-request-and-response](https://o364p1r5a.qnssl.com/blog/http-status-code-304-request-and-response.png)

通过这种方法可以减少返回体的传输时间，但是还是有网络请求，那么有一个完全的缓存，不会发送请求，直接命中本地缓存，这里需要用到`Cache-Control`字段，例如`max-age=2592000`表示缓存将在30天后失效。还有其他的取值：

* `public`  所有内容都将被缓存(客户端和代理服务器都可缓存)
* `private`  内容只缓存到私有缓存中(仅客户端可以缓存，代理服务器不可缓存)
* `no-cache`  必须先与服务器确认返回的响应是否被更改，然后才能使用该响应来满足后续对同一个网址的请求。因此，如果存在合适的验证令牌 (ETag)，no-cache 会发起往返通信来验证缓存的响应，如果资源未被更改，可以避免下载。
* `no-store`  所有内容都不会被缓存到缓存或 Internet 临时文件中
* `must-revalidation/proxy-revalidation`  如果缓存的内容失效，请求必须发送到服务器/代理以进行重新验证
* `max-age=xxx (xxx is numeric)`  缓存的内容将在 xxx 秒后失效, 这个选项只在HTTP 1.1可用, 并如果和Last-Modified一起使用时, 优先级较高
