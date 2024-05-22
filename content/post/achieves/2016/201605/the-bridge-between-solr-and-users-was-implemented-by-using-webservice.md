+++
author = "Payne Xu"
categories = ["Developer"]
date = 2016-05-23T02:11:25Z
description = ""
draft = false
slug = "the-bridge-between-solr-and-users-was-implemented-by-using-webservice"
tags = ["搜索引擎"]
title = "搜索服务API"

+++



这篇文章主要是关于solr和普通用户之间的桥梁`SearchService`,简单了解下整过工作流程.

![](/storage/blog/14639907128551.jpg)

<!--more-->


# 为何要在Solr和用户之间加一层？
因为solr提供了url方式（[REST风格](https://zh.wikipedia.org/wiki/REST)）的API来进行增删改查，因此如果不加安全策略，别人在查询的同时可以修改你的数据，这是绝对不允许的。但是把solr的服务端口开放然后加安全策略的方式是不科学的，这个安全策略难以配置，并且漏洞很多，所以我们通过建立一个独立的web服务器来提供对外服务，solr服务器只对内网开放，这样就比较安全并容易控制。

在这里，我不直接提供传统意义上的web服务，而是采用`WebService`的模式，参照[REST风格](https://zh.wikipedia.org/wiki/REST)风格提供API服务。优点是可以应对各种不同平台。

这样做的另一个好处是能轻松应对SolrCloud的扩展和并发量的剧增，如果后期并发增加，可以扩展`SearchService`到多台web服务器，然后通过nginx做反向代理和负载均衡，将客户端的请求分散到不同的web服务器上。

![](/storage/blog/14639816173721.png)


# 用Servlet提供服务

* 代码请参考 [SearchService-Github](https://github.com/paynexu/trip-search/tree/dev/SearchService).
* 开发IDE为 [IntelliJ IDEA 15](https://www.jetbrains.com/idea/)，用gradle管理，使用Jetty插件。
* 项目依赖：

```
dependencies {   
  testCompile group: 'junit', name: 'junit', version: '4.11' 
  testCompile 'org.slf4j:slf4j-simple:1.7.20'
  providedCompile 'javax.servlet:javax.servlet-api:3.0.1'  
  compile 'org.apache.solr:solr-solrj:5.5.0'  
  compile 'com.google.code.gson:gson:2.6.2' 
  compile 'com.squareup.okhttp:okhttp:2.7.5'
  }
```

## 定义API参数

|参数|意义（取值范围）|默认值|
|