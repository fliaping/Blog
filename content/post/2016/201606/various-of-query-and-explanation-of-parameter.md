+++
author = "Payne Xu"
categories = ["搜索引擎"]
date = 2016-06-11T09:14:25Z
description = ""
draft = false
slug = "various-of-query-and-explanation-of-parameter"
tags = ["搜索引擎"]
title = "各种查询及参数说明"

+++


Solr默认有三种查询解析器（Query Parser）：

* Standard Query Parser
* DisMax Query Parser
* Extended DisMax Query Parser (eDisMax)

第一种是标准的Parser，最后一种是最强大的。

本文中所提到的参数并不能包含Solr所有参数，具体的使用和更详细的参数请参考官方文档。
<!--more-->

# 常用参数

* `defType` 选择查询解析器类型，例如dismax, edismax
* `q` 主查询参数（field_name:value）
* `sort` 排序，例如score desc，price asc
* `start` 起始的数据偏移offset，用于分页
* `raws` 一次返回的数量，用于分页
* `fq` filter query 返回结果的过滤查询
* `fl` fields to list 返回的字段（*, score）
* `debug` 返回调试信息，debug=timing，debug=results
* `timeAllowed` 超时时间
* `wt` response writer返回的响应格式

下面是DisMax Parser可以使用的：

* `qf` query fields，指定查询的字段，指定solr从哪些field中搜索，没有值的时候使用df
* `mm` 最小匹配比例
* `pf` phrase fields
* `ps` phrase slop
* `qs` query phrase slop

**结果高亮：**

* `hl` 是否高亮 ,如hl=true
* `hl.fl` 高亮field ,hl.fl=Name,SKU
* `hl.snippets` 默认是1,这里设置为3个片段
* `hl.simple.pre` 高亮前面的格式 
* `hl.simple.post` 高亮后面的格式 

**facet统计：**

* `facet` 是否启动统计 
* `facet.field`  统计field 

# Solr运算符

* `:` 指定字段查指定值，如返回所有值*:*
* `?` 表示单个任意字符的通配
* `*` 表示多个任意字符的通配（不能在检索的项开始使用`*`或者`?`符号）
* `~` 表示模糊检索，如检索拼写类似于"roam"的项这样写:`roam~`将找到形如foam和roams的单词；`roam~0.8`，检索返回相似度在0.8以上的记录。
* 邻近检索，如检索相隔10个单词的"apache"和"jakarta"，`"jakarta apache"~10`
* `^` 控制相关度检索，如检索"jakarta apache"，同时希望去让"jakarta"的相关度更加好，那么在其后加上`^`符号和增量值，即`jakarta^4 apache`
* 布尔操作符`AND`、`||`
* 布尔操作符`OR`、`&&`
* 布尔操作符`NOT`、`!`、`-`（排除操作符不能单独与项使用构成查询）
* `+` 存在操作符，要求符号”+”后的项必须在文档相应的域中存在
* `( )`用于构成子查询
* `[]` 包含范围检索，如检索某时间段记录，包含头尾，`date:[200707 TO 200710]`
*  `{}` 不包含范围检索，如检索某时间段记录，不包含头尾`date:{200707 TO 200710}`
* `/` 转义操作符，特殊字符包括 `+ - && || ! ( ) { } [ ] ^ ” ~ * ? : /`

**注意：** “+”和”-“表示对单个查询单元的修饰，and 、or 、 not 是对两个查询单元是否做交集或者做差集还是取反的操作的符号。

比如:AB:china +AB:america ,表示的是AB:china忽略不计可有可无，必须满足第二个条件才是对的,而不是你所认为的必须满足这两个搜索条件

如果输入:AB:china AND AB:america ,解析出来的结果是两个条件同时满足，即+AB:china AND +AB:america或+AB:china +AB:america




