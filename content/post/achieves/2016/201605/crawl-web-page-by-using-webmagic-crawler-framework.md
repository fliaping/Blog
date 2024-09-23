+++
author = "Payne Xu"
categories = ["Developer"]
date = 2016-05-26T05:44:25Z
description = ""
draft = false
slug = "crawl-web-page-by-using-webmagic-crawler-framework"
tags = ["搜索引擎", "数据抓取"]
title = "基于webmagic爬虫框架的数据抓取"

+++



有人可能会有疑问，Heritrix用的好好的，干嘛还要换别的呢？Heritrix固然很好，成熟、稳定、有管理界面、监控、多线程、开箱即用。但这真的适合我们这种垂直爬虫吗？我觉得未必，用Heritrix，你可以通过配置文件来确定接受规则和URL的发现规则，然后直接构建运行就好了。然而对于我来说，它的配置文件中的那些选项说的并不是那么清楚，相关文档也都是很简单的，想用一些复杂的规则都不知道这样对不对，至少要等到好久抓出来东西了，发现多抓了或者少抓了，你才发现配置文件写错了。并且配置文件中的项目也是老多的，这么多东西把人搞的头晕目眩。

好吧，总的来讲,如果你是爬虫老手，对Heritrix的架构了解比较清晰的，Heritrix是个很好的选择。但是对于一个新手，我觉得webmagic更加灵活高效。就拿我的体验来讲，当初用Heritrix抓了3天才抓了七千多数据（可能是我配置文件写的不好），而用webmagic一个白天就抓了一万三的数据。

<!--more-->

# webmagic介绍

认识webmagic是在知乎上有人推荐，我确定用它使因为该作者比较详细的中文文档（谁让咱英文不太好呢），这是该作者的一个业余项目，但他的代码是非常值得参考的。

官网：[WebMagic](http://webmagic.io/)

可以在我的项目中查看这一部分的代码，这个模块叫做spider。
> [trip-search - 码云](http://git.oschina.net/PayneXu/trip-search/)
> [trip-search - Github](https://github.com/paynexu/trip-search)

# 构架简单介绍
![](https://fliaping-blog.oss-rg-china-mainland.aliyuncs.com/storage/blog/14642364175906.jpg)
## 四个组件介绍
`Downloader`

Downloader负责从互联网上下载页面，以便后续处理。WebMagic默认使用了Apache HttpClient作为下载工具。

`PageProcessor`

PageProcessor负责解析页面，抽取有用信息，以及发现新的链接。WebMagic使用Jsoup作为HTML解析工具，并基于其开发了解析XPath的工具Xsoup。
在这四个组件中，PageProcessor对于每个站点每个页面都不一样，是需要使用者定制的部分。

`Scheduler`

Scheduler负责管理待抓取的URL，以及一些去重的工作。WebMagic默认提供了JDK的内存队列来管理URL，并用集合来进行去重。也支持使用Redis进行分布式管理。
除非项目有一些特殊的分布式需求，否则无需自己定制Scheduler。

`Pipeline`

Pipeline负责抽取结果的处理，包括计算、持久化到文件、数据库等。WebMagic默认提供了“输出到控制台”和“保存到文件”两种结果处理方案。
Pipeline定义了结果保存的方式，如果你要保存到指定数据库，则需要编写对应的Pipeline。对于一类需求一般只需编写一个Pipeline。

# 构建项目
怎么使用这里也不细讲，文档中说的很清楚。文章中有什么不懂的，可以参考webmagic官方文档，推荐先看完官网文档，并搞懂示例。
# 引入依赖
我这里用的是gradle来管理工程，所以只要在配置文件中引入需要的依赖，gradle会自动解决相关的一系列依赖，前提是网好:-)。

```
dependencies {
    testCompile group: 'junit', name: 'junit', version: '4.11'
    compile "us.codecraft:webmagic-core:0.5.3"
    compile "us.codecraft:webmagic-extension:0.5.3"
}
```
# 定制页面解析代码
四大组件的说明前面讲过了，对于一般的爬虫来讲，只要定制下`PageProcessor`就行了，这里也不啰嗦，别的都不讲，就说怎么抓。

## 正则表达式
对于爬虫最重要一项技能就是正则表达式，关于正则的只是非常多，一时半会也学不完，我也是现学现卖，有了基本的了解之后，后面有什么需要自己查就好了。

我抓取的是去哪儿网的景点页面，一共需要三个正则表达式。先介绍下我要抓取的站点的结构。

![](https://fliaping-blog.oss-rg-china-mainland.aliyuncs.com/storage/blog/14642378347089.jpg)
首先我找到了地区的汇总页面，这个汇总页面中有很多地区页的链接，我们要识别出来这些链接，并加入待抓取队列，然后如果抓到了地区页面，要在这个页面中找到这个地区的景点列表页；然后如果抓到了景点列表页，从这个页面我们要找到景点页的链接，并且还有景点列表页的不同页数的链接；最后才是我们需要的景点页，可以对其进行解析或者直接把页面保存下来。前面的所有链接都是帮助找到景点页的帮助页面，而景点页才是真正的目标页面。
我的种子页面是

```java
public static final String URL_SEED = "http://travel.qunar.com/place/";
```
先来看下正则基础，可以参考这篇文章 [正则表达式30分钟入门教程](http://deerchao.net/tutorials/regex/regex.htm)

表1.常用的元字符：

|代码|说明|
|