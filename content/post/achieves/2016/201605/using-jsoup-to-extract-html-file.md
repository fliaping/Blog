+++
author = "Payne Xu"
categories = ["Developer"]
date = 2016-05-22T11:09:25Z
description = ""
draft = false
slug = "using-jsoup-to-extract-html-file"
tags = ["搜索引擎", "jsoup"]
title = "利用jsoup提取网页中有用信息"

+++



Java 程序在解析 HTML 文档时，最常用的是 htmlparser 这个开源项目。但现在你有更好的选择，那就是Jsoup。

jsoup 是一款 Java 的 HTML 解析器，可直接解析某个 URL 地址、HTML 文本内容。它提供了一套非常省力的 API，可通过 DOM，CSS 以及类似于 jQuery 的操作方法来取出和操作数据。

<!--more-->

jsoup 的主要功能如下：
1. 从一个 URL，文件或字符串中解析 HTML；
2. 使用 DOM 或 CSS 选择器来查找、取出数据；
3. 可操作 HTML 元素、属性、文本；
jsoup 是基于 MIT 协议发布的，可放心使用于商业项目。

jsoup 的主要类层次结构如下图所示：
![](https://fliaping-blog.oss-rg-china-mainland.aliyuncs.com/storage/blog/14639714791303.jpg)

# Jsoup的基本用法

* [jsoup官网](https://jsoup.org/)

## 文件加载示例
jsoup 可以从包括字符串、URL 地址以及本地文件来加载 HTML 文档，并生成 Document 对象实例。

示例代码：

```java
// 直接从字符串中输入 HTML 文档
 String html = "<html><head><title> 开源中国社区 </title></head>"
  + "<body><p> 这里是 jsoup 项目的相关文章 </p></body></html>"; 
 Document doc = Jsoup.parse(html); 

 // 从 URL 直接加载 HTML 文档
 Document doc = Jsoup.connect("http://www.oschina.net/").get(); 
 String title = doc.title(); 

 Document doc = Jsoup.connect("http://www.oschina.net/") 
  .data("query", "Java")   // 请求参数
  .userAgent("I ’ m jsoup") // 设置 User-Agent 
  .cookie("auth", "token") // 设置 cookie 
  .timeout(3000)           // 设置连接超时时间
  .post();                 // 使用 POST 方法访问 URL 

 // 从文件中加载 HTML 文档
 File input = new File("D:/test.html"); 
 Document doc = Jsoup.parse(input,"UTF-8","http://www.oschina.net/");
```
请大家注意最后一种 HTML 文档输入方式中的 parse 的第三个参数，为什么需要在这里指定一个网址呢（虽然可以不指定，如第一种方法）？因为 HTML 文档中会有很多例如链接、图片以及所引用的外部脚本、css 文件等，而第三个名为 baseURL 的参数的意思就是当 HTML 文档使用相对路径方式引用外部文件时，jsoup 会自动为这些 URL 加上一个前缀，也就是这个 baseURL。
例如 <a href=/project> 开源软件 </a> 会被转换成 <a href=http://www.oschina.net/project> 开源软件 </a>。
## 解析文件示例
jsoup解析文件时除了提供传统的DOM方式的元素解析，最重要的是还提供了选择器来进行DOM元素的定位，其选择器语法和jQuery的是一样的，这对于做过web开发的来说简直是福音，几乎不需要任何成本就可以用java愉快地解析html了呢。

传统的DOM方式示例代码：

```java
File input = new File("D:/test.html"); 
 Document doc = Jsoup.parse(input, "UTF-8", "http://www.oschina.net/"); 

 Element content = doc.getElementById("content"); 
 Elements links = content.getElementsByTag("a"); 
 for (Element link : links) { 
  String linkHref = link.attr("href"); 
  String linkText = link.text(); 
 }
```
你可能会觉得 jsoup 的方法似曾相识，没错，像 getElementById 和 getElementsByTag 方法跟 JavaScript 的方法名称是一样的，功能也完全一致。你可以根据节点名称或者是 HTML 元素的 id 来获取对应的元素或者元素列表。

选择器示例代码：

```java
File input = new File("D:\test.html"); 
 Document doc = Jsoup.parse(input,"UTF-8","http://www.oschina.net/"); 

 Elements links = doc.select("a[href]"); // 具有 href 属性的链接
 Elements pngs = doc.select("img[src$=.png]");// 所有引用 png 图片的元素


 Element masthead = doc.select("div.masthead").first(); 
 // 找出定义了 class=masthead 的元素

 Elements resultLinks = doc.select("h3.r > a"); // direct a after h3
```
可以看到，它的选择器和jQuery确实是一样的，另外它的选择器还支持表达式功能，我们将在最后一节介绍这个超强的选择器。


## 修改数据示例
在解析文档的同时，我们可能会需要对文档中的某些元素进行修改，例如我们可以为文档中的所有图片增加可点击链接、修改链接地址或者是修改文本等。

示例代码：

```java
 doc.select("div.comments a").attr("rel", "nofollow"); 
 // 为所有链接增加 rel=nofollow 属性
 doc.select("div.comments a").addClass("mylinkclass"); 
 // 为所有链接增加 class=mylinkclass 属性
 doc.select("img").removeAttr("onclick"); // 删除所有图片的 onclick 属性
 doc.select("input[type=text]").val(""); // 清空所有文本输入框中的文本
```
首先利用 jsoup 的选择器找出元素，然后就可以通过以上的方法来进行修改，除了无法修改标签名外（可以删除后再插入新的元素），包括元素的属性和文本都可以修改。
修改完直接调用 `Element(s)` 的 `html()` 方法就可以获取修改完的 HTML 文档。
## HTML代码过滤
有时候有的页面中会有一些恶意脚本，可能会破坏整个页面的结构，更严重的是获取一些机要信息，例如 XSS 跨站点攻击之类的。jsoup对这方面支持非常好。

示例代码：

```java
String unsafe = "<p><a href='http://www.oschina.net/' onclick='stealCookies()'>开源中国社区</a></p>"; 
String safe = Jsoup.clean(unsafe,Whitelist.basic()); 
 // 输出 : 
 // <p><a href="http://www.oschina.net/" rel="nofollow"> 开源中国社区 </a></p>
```
jsoup 使用一个 Whitelist 类用来对 HTML 文档进行过滤，该类提供几个常用方法：

|    方法名    |       简介          |
|