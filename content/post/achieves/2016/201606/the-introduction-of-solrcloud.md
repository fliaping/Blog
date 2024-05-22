+++
author = "Payne Xu"
categories = ["Developer"]
date = 2016-06-12T08:02:25Z
description = ""
draft = false
slug = "the-introduction-of-solrcloud"
tags = ["搜索引擎", "Solr"]
title = "SolrCloud基础"

+++



本节是SolrCloud基础理论知识，我也是从网上学习到，这里只是进行一些整理。参考的博客比本文更好，更有深度，有耐心的请看参考的原文-- [SolrCloud之分布式索引及与Zookeeper的集成](http://josh-persistence.iteye.com/blog/2234411)

# SolrCloud基本概念

SolrCloud模式下有Cluster，Node，Collection，Shard，LeaderCore，ReplicationCore等重要概念。

<!--more-->

1. **Cluster集群：**Cluster是一组Solr节点，逻辑上作为一个单元进行管理，整个集群必须使用同一套schema和SolrConfig。
2. **Node节点：**一个运行Solr的JVM实例。
3. **Collection：**在SolrCloud集群中逻辑意义上的完整的索引,常常被划分为一个或多个Shard，这些Shard使用相同的Config Set，如果Shard数超过一个，那么索引方案就是分布式索引。SolrCloud允许客户端用户通过Collection名称引用它，这样用户不需要关心分布式检索时需要使用的和Shard相关参数。
4. **Core:** 也就是Solr Core，一个Solr中包含一个或者多个Solr Core，每个Solr Core可以独立提供索引和查询功能，Solr Core的提出是为了增加管理灵活性和共用资源。SolrCloud中使用的配置是在Zookeeper中的，而传统的Solr Core的配置文件是在磁盘上的配置目录中。
5. **Config Set:** Solr Core提供服务必须的一组配置文件,每个Config Set有一个名字。最小需要包括solrconfig.xml和schema.xml，除此之外，依据这两个文件的配置内容，可能还需要包含其它文件,如中文索引需要的词库文件。Config Set存储在Zookeeper中，可以重新上传或者使用upconfig命令进行更新，可使用Solr的启动参数bootstrap_confdir进行初始化或更新。
6. **Shard分片:** Collection的逻辑分片。每个Shard被分成一个或者多个replicas，通过选举确定哪个是Leader。
7. **Replica:** Shard的一个拷贝。每个Replica存在于Solr的一个Core中。换句话说一个Solr Core对应着一个Replica，如一个命名为“test”的collection以numShards=1创建，并且指定replicationFactor为2，这会产生2个replicas，也就是对应会有2个Core，分别存储在不同的机器或者Solr实例上，其中一个会被命名为test_shard1_replica1，另一个命名为test_shard1_replica2，它们中的一个会被选举为Leader。
8. **Leader:** 赢得选举的Shard replicas，每个Shard有多个Replicas，这几个Replicas需要选举来确定一个Leader。选举可以发生在任何时间，但是通常他们仅在某个Solr实例发生故障时才会触发。当进行索引操作时，SolrCloud会将索引操作请求传到此Shard对应的leader，leader再分发它们到全部Shard的replicas。
9. **Zookeeper:** Zookeeper提供分布式锁功能，这对SolrCloud是必须的，主要负责处理Leader的选举。Solr可以以内嵌的Zookeeper运行，也可以使用独立的Zookeeper，并且Solr官方建议最好有3个以上的主机。

# Collection逻辑图

![](/storage/blog/14657908838729.jpg)

**解释：**

* 从上图可以看到，有一个collection，被分为两个shard，每个shard分为三个replica，其中每个shard从自己的三个replica选择一个作为Leader。
* 每个shard的replica被分别存储在三台不同的机器（Solr实例）中，这样的目的是容灾处理，提高可用性。如果有一个机器挂掉之后，因为每个shard在别的机器上有复制品，所以能保证整个数据的可用，这是Solrcloud就会在还存在的replica中重新选举一个作为这个shard的Leader。

# SolrCloud的工作模式
![](/storage/blog/14657929987086.jpg)

**解释：**

* 上图的下半部分就是Collection逻辑图，上半部分是SolrCloud的物理结构，每个solr实例中有两个core，每个core对应一个Shard的一个replica。
* 当Solr Client通过Collection访问Solr集群的时候，便可通过Shard分片找到对应的Replica即Solr Core，从而就可以访问索引文档了。

#SolrCloud创建索引和更新索引

![](/storage/blog/14657978881168.jpg)

**解释：**

1.　用户可以把新建文档提交给任意一个Replica（Solr Core）
2. 如果它不是leader，它会把请求转给和自己同Shard的Leader。
3. Leader把文档路由给本Shard的每个Replica。
Ⅲ. 如果文档基于路由规则(如取hash值)并不属于当前的Shard，leader会把它转交给对应Shard的Leader。
Ⅵ. 对应Leader会把文档路由给本Shard的每个Replica。

**更新索引：**

1. Leader接受到update请求后，先将update信息存放到本地的update log，同时Leader还会给document分配新的version，对于已存在的document，如果新的版本高就会抛弃旧版本，最后发送至replica。
2. 一旦document经过验证以及加入version后，就会并行的被转发至所有上线的replica。SolrCloud并不会关注那些已经下线的replica，因为当他们上线时候会有recovery进程对他们进行恢复。如果转发的replica处于recovering状态，那么这个replica就会把update放入update transaction 日志。
3. 当leader接受到所有的replica的反馈成功后，它才会反馈客户端成功。只要shard中有一个replica是active的，Solr就会继续接受update请求。这一策略其实是牺牲了一致性换取了写入的有效性。

**近实时搜索：**

SolrCloud支持近实时搜索（near real time），所谓的近实时搜索即在较短的时间内使得新添加的document可见可查，这主要基于softcommit机制。软提交（softcommit）指的是仅把数据提交到内存，index可见，此时没有写入到磁盘索引文件中。


# SolrCloud索引的检索
![](/storage/blog/14657975180492.jpg)

**解释：**

1.　用户的一个查询，可以发送到含有该Collection的任意Solr的Server，Solr内部处理的逻辑会转到一个Replica。
2.　此Replica会基于查询索引的方式，启动分布式查询，基于索引的Shard的个数，把查询转为多个子查询，并把每个子查询定位到对应Shard的任意一个Replica。
3.　每个子查询返回查询结果。
4.　最初的Replica合并子查询，并把最终结果返回给用户。

# Solr Shard Splitting的具体过程

![](/storage/blog/14657976046061.jpg)

**解释：**

* 一般情况下，增加Shard和Replica的数量能提升SolrCloud的查询性能和容灾能力，但是我们仍然得根据实际的document的数量，document的大小，以及建索引的并发，查询复杂度，以及索引的增长率来统筹考虑Shard和Replica的数量。
* 多个shard的情况下需要对文档进行分片，这就是这节要讲的。

Shard分割的具体过程（old shard split为newShard1和newShard2）可以描述为：

a. 在一个Shard的文档到达阈值，或者接收到用户的API命令，Solr将启动Shard的分裂过程。
b. 此时，原有的Shard仍然会提供服务，Solr将会提取原有Shard并按路由规则，转到新的Shard做索引。

同时，新加入的文档：

1. 用户可以把文档提交给任意一个Replica
2. Replica将文档转交给Leader。
3. Leader把文档路由给原有Shard的每个Replica，各自做索引。

III.V. 同时，会把文档路由给新的Shard的Leader

IV.VI. 新Shard的Leader会路由文档到自己的Replica，各自做索引，在原有文档重新索引完成，系统会把分发文档路由切到对应的新的Leader上，原有Shard关闭。Shard只是一个逻辑概念，所以Shard的Splitting只是将原有Shard的Replica均匀的分不到更多的Shard的更多的Solr节点上去。

# Zookeeper
![](/storage/blog/14658023256630.jpg)

以上为本项目中的Zookeeper的文件结构，可以看到上传的Solr配置文件。

zookeeper的主要作用有：

* 集中配置存储以及管理。
* 集群状态改变时进行监控以及通知。
* shard leader的选举。


