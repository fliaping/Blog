+++
author = "Payne Xu"
categories = ["Developer"]
date = 2016-06-12T05:17:25Z
description = ""
draft = false
slug = "filtering-and-sorting-the-search-result"
tags = ["搜索引擎"]
title = "搜索结果的筛选和排序"

+++



实现对搜索结果的筛选和排序，需要利用solr的sort功能和facet功能，这两个是垂直搜索中比较常用的功能。对于如何使用这两个功能，其实在索引建好之后我们并不需要做太多的工作就能使用，只用在查询的时候指定相关的参数，Solr会根据参数来执行相应的查询，获得相应的结果。

因为项目中使用SolrJ作为Solr的客户端，并通过servlet提供对外的服务接口，本文将以介绍如何用SolrJ来实现，此外也会涉及利用HTTP接口的参数使用。

<!--more-->

# 结果排序

但字段排序来说相对简单，通过改变sort参数的值即可，对于根据多字段，然后利用不同字段的权值来进行排序，相对来说复杂点。

**对于单字段排序**，在HTTP参数中，例如加上：

```
&sort=geodist() asc
```
这即是按照距离升序排列，其中geodist()为solr中的距离函数，得到point点到文档中所标记坐标的距离。

**对于多字段参与的排序，即Solr权重**

Solr利用Lucene的权重算法，也就是通过一个公式计算每个Documents的得分，然后按得分高低排序，公式如下：

![](https://storage.blog.fliaping.com/blog/14658258239201.jpg)

其中：

`Tf` Term frequency，就是条目出现的次数。
`Idf` Inverse document frequency，就是用来描述在一个搜索关键字中，不同字词的稀有程度。比如搜索The Cat in the Hat，那么很明显The和in远没有Cat和Hat重要。
`Boosting` 这个是我们设置权重的重点，例如在景点结果排序的时候，不光想考虑距离，还想考虑评分、评论人数等，而boosting是不同的Filed有不同权重，之后根据公式计算得分。所以可以看到，我们并不能直接影响solr搜索结果的排序，需要改变权重，进而改变不同Document的得分，从而影响排序。

其中还有很多因子和公式的解释，有兴趣的同学可以参考Solr in action这本书，里面有比较详细的解释。

前一节讲到Query Parser有三种：Standard、Dismax、Extended Dismax，这里权重排序使用到了Dismax。

在HTTP参数中，例如：

```
&defType=dismax&qf=sight_name^10+sight_coordinate^5
```

此外还可以设置bf设置其他Field的权重，可以使用很多Function Query，我没有用这个，所以不能细讲。

```
&bf=sum(div(sight_score,0.01),if(exists(near_hotels),20000,0))
```

这里简单了解下，比如div,代表相除、exists代表如果near_hotels如果不为空那么设置它的权重为20000，为空则为0。记住最后要sum起来，因为从上面的公式可以看出来，boosting是一个变量，所以最好要有一个和值。


项目中实现了距离排序、评分排序、评论数量排序、关键词最佳匹配、综合排序

```java
//设置排序
String sortOrder = notNull(request.getParameter(UrlP.sort_order.name()),SortOrder.distance.get()); //默认距离排序


if (SortOrder.distance.is(sortOrder)) { //距离排序
  solrQuery.setSort("geodist()", SolrQuery.ORDER.asc);

}else if (SortOrder.score.is(sortOrder)){ //评分排序

  solrQuery.setSort("sight_score", SolrQuery.ORDER.desc);

}else if (SortOrder.comment.is(sortOrder)){ //评论数量排序
  solrQuery.setSort("sight_comment_num", SolrQuery.ORDER.desc);

}else if (SortOrder.keyword.is(sortOrder)){ //关键词最佳匹配
  // 关键词最佳匹配
  solrQuery.set("defType","dismax");
  solrQuery.set("qf","sight_name^2 sight_intro^1 sight_comments^0.8");

}else if (SortOrder.best.is(sortOrder)){ //综合排序
  //  &defType=dismax&qf=sight_name^10+sight_coordinate^5
  solrQuery.set("defType","dismax");
  solrQuery.set("qf","sight_name^2 sight_intro^1");
  //solrQuery.set("bf", "sum(div(sight_score,0.01),if(exists(near_hotels),20000,0))");
  solrQuery.addSort("geodist()", SolrQuery.ORDER.asc);
  solrQuery.addSort("sight_score", SolrQuery.ORDER.desc);
}
```
# 结果过滤

## 利用FacetField进行分类

这个比较简单，只用传入要分类的字段即可，例如

```
&facet=true&facet.field=sight_type
```

这样就会对sight_type进行facet，列出这个字段不重复的值

## 利用RangeFacet划分区间

如果想对某一数值字段进行范围划分，需要用到`facet.range`，例如：

```
&facet=true&facet.range=sight_score
&f.sight_score.facet.range.start=1
&f.sight_score.facet.range.end=5.1
&f.sight_score.facet.range.gap=1
```
这需要划分的字段是sight_score，并且设置划分的起始值为1，终止值为5.1，间隔为1，也就是说划分出来的区间为 [1,2)，[2,3)，[3,4)，[4,5.1)，因为区间是右开的，所以终止值要多一点。

## 用FacetQuery根据函数查询

如果我们想对距离进行区间划分，这时不能再用RangeFacet功能，只能利用FacetQuery来通过函数查询。

例如：`facet.query={!frange l=0 u=5}geodist()` 表示先根据geodist()函数得到距离，然后限制距离是1-5KM的景点。


```java
//设置facet
solrQuery.setFacet(true)
      .setFacetMissing(true);
//景点类型facet
solrQuery.addFacetField(new String[]{"sight_type"});

//评分范围facet
solrQuery.add("facet.range","sight_score");

solrQuery.add("f.sight_score.facet.range.start","1")
      .add("f.sight_score.facet.range.end","5.1")
      .add("f.sight_score.facet.range.gap","1");

//距离范围facet
solrQuery.addFacetQuery("{!frange l=0 u=5}geodist()")
      .addFacetQuery("{!frange l=5.001 u=50}geodist()")
      .addFacetQuery("{!frange l=50.001 u=500}geodist()")
      .addFacetQuery("{!frange l=500.001 u=5000}geodist()");
```
# 参考链接
* [Solr高亮与Field权重](http://www.cnblogs.com/edwinchen/p/3977366.html)

