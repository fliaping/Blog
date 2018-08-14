+++
author = "Payne Xu"
categories = ["搜索引擎"]
date = 2016-05-17T03:41:13Z
description = ""
draft = false
slug = "introduction-of-solr-and-how-to-install-it"
tags = ["搜索引擎"]
title = "Solr基础知识及安装"

+++



# Solr的身世
引用[Solr官网](https://lucene.apache.org/solr/)的slogan,blazing-fast一词可见一斑。
> Solr is the popular, blazing-fast, open source enterprise search platform built on Apache Lucene™.

再来看看它的[特性](https://lucene.apache.org/solr/features.html)
![](https://o364p1r5a.qnssl.com/blog/14634817034224.jpg)

<!--more-->

* Advanced Full-Text Search Capabilities（高级全文搜索能力）
* Optimized for High Volume Traffic（大数据性能优化）
* Standards Based Open Interfaces - XML, JSON and HTTP（标准的XML,JSON,HTTP接口）
* Comprehensive Administration Interfaces（综合管理界面）
* Easy Monitoring（易于监控）
* Highly Scalable and Fault Tolerant（高可扩展和容错力）
* Flexible and Adaptable with easy configuration（通过简单配置带来灵活性和适应性）
* Near Real-Time Indexing（近乎实时的索引）
* Extensible Plugin Architecture（可扩展的插件构架）


其实简单的说，Solr是一个基于[Apache Lucene](https://lucene.apache.org) 项目的开源企业级搜索平台，是用JAVA编写的、运行在Servlet容器中的一个独立的全文搜索服务器（换句话说就是个JAVA-WEB APP），并具有类似REST的HTTP/XML和JSON的API。 

主要功能包括全文检索，高亮命中，分面搜索(faceted search)，近实时索引，动态集群，数据库集成，富文本索引，空间搜索；通过提供分布式索引，复制，负载均衡查询，自动故障转移和恢复，集中配置等功能实现高可用，可伸缩和可容错。



## Solr和Lucene的关系

* Solr是Lucene的一个子项目，它在Lucene的基础上进行包装，成为一个企业级搜索服务器开发框架。* Solr与Lucene的主要区别体现在：  * Solr更加贴近实际应用，是Lucene在面向企业搜索服务领域的扩展；  * Solr的缓存等机制使全文检索获得性能上的提升；通过配置文件的开发使得Solr具有良好的扩展性；  * Solr提供了用户友好的管理界面与查询结果界面。

>简单讲：Solr使用Lucene并且扩展了它！

# Solr的构架
其构架如下。
![](https://o364p1r5a.qnssl.com/blog/14634625950922.jpg)


# 安装和配置
参考[官方quickstart文档](https://lucene.apache.org/solr/quickstart.html)
## 下载Solr
去Lucene的[官网](https://lucene.apache.org)下载就可以.会有三个文件可以下载

```
solr-x.x.x-src.tgz  
solr-x.x.x.tgz
solr-x.x.x.zip
```
有src是是源码，如果你不准备看源码、调试，不用管这个，另外两个是已经编译过的，下那个都行，只不过打包方式不同。这里直接下载zip后缀的。
## 环境要求
如果版本是5.x.x 或者 6.x.x用Java 8（写这篇文章最新版本是6.0.0）
建议操作系统最好是Unix系列，笔者这里用的是OS X系统，鉴于java环境的配置是开发最基本的技能，这里不再展开。
## 启动Solr
解压下载的文件，转到目录，输入一下命令即可启动solr服务器

```bash
bin/solr start
```
通过浏览器访问 [http://localhost:8983](http://localhost:8983)即可看到Solr的管理界面。上面的这条命令是按照单机模式启动，还有cloud模式，顾名思义应该是solr集群了。关于cloud后面会单独来讲。
![solr-admin-home](https://o364p1r5a.qnssl.com/blog/solr-admin-home.png)


# 必要了解
## 目录结构
以我开发用的solr-5.5.0为例
``` bash
.
├── CHANGES.txt
├── LICENSE.txt
├── LUCENE_CHANGES.txt
├── NOTICE.txt
├── README.txt
├── bin        # 存放的是solr为了方便使用所编写好的脚本
├── contrib    # 存放的大多是一些第三方提供的类库，使用这些类库能够极大扩展solr的功能
├── dist       # 存放的是solr自身所用到的一些核心类
├── docs       # 存放solr的文档，功能介绍，一些api的介绍
├── example    # 存放的是solr的例子
├── licenses   # 许可相关
└── server     # 是solr自带的jetty
```
## 主要概念
### Solr安装目录和SolrHome目录
首先要知道solr的启动必须要在类似于tomcat一样的servlet容器中进行的，在servlet容器中启动之后的solr仅仅是一个webapp实例，能够使用url进行admin页面的访问，然而这个页面并没有任何的数据可以进行索引。同时在servlet容器中启动solr时，需要指定一个solr.home.dir，这个路径为这个solr实例的根路径。可以用同一个servlet容器的文件启动多个servlet容器（需要端口号不同），同时，启动多个servlet容器的过程中如果使用不同的solr.home.dir可以启动多个不同的solr实例。也就是说solr.home.dir是solr在servlet容器中启动的时候定义的。之后如果这个solr实例需要创建一个collection，则会在该solr的home.dir下创建一个存放该collection索引文件的文件夹，这个文件夹中需要有solr.xml文件夹。如果使用cloud模式启动的话，这个collection的配置文件会被上传到ZooKeeper中，在ZooKeeper的资源路径下会有个该collection名字命名的文件夹，然后相应的配置文件会存放在ZooKeeper的这个文件夹中（这里只是提一下could模式，不了解可以跳过这句）。如果不是使用cloud模式启动的，则在solr的该collection路径下会有conf文件夹，这个文件夹里必须有solrconfig.xml和schema.xml文件。

而solr.installation.dir文件路径是你下载好solr并解压缩的路径，前面讲过这个路径下的文件结构，如果感兴趣的话可以阅读README.txt文件里的内容。
### SolrHome和SolrCore

SolrHome是一个目录，它是solr运行的主目录，它包括多个SolrCore目录，SolrCore目录中就solr实例的运行配置文件和数据文件。

SolrHome中可以包括多个SolrCore，每个SolrCore互相独立，而且可以单独对外提供搜索和索引服务。



