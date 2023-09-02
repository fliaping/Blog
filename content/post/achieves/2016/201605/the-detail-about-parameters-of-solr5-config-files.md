+++
author = "Payne Xu"
categories = ["Developer"]
date = 2016-05-20T04:49:25Z
description = ""
draft = false
slug = "the-detail-about-parameters-of-solr5-config-files"
tags = ["搜索引擎", "Solr"]
title = "Solr5配置文件参数解析"

+++


Solr5的主要配置文件有`solrconfig.xml`和`managed-schema`，另外一些还有`solr.xml`,`数据导入配置`,`ZooKeeper配置`等。

这里详细介绍两个主要的配置文件。
<!--more-->

# solrconfig.xml

solrconfig.xml文件是solr的主配置文件，主要配置高亮、数据源、索引大小、索引合并等所有的索引策略。

该文件位于`$SolrHome/$Core/conf`文件夹中，这个配置包含了solr自身的一些参数，主要包括lib、数据目录、索引配置、更新处理、查询处理、缓存、请求分发、高亮等。可参考官方文档：[Configuring solrconfig.xml](https://cwiki.apache.org/confluence/display/solr/Configuring+solrconfig.xml),以下内容整理自[系统全面的认识Solr](http://lucien-zzy.iteye.com/blog/2089674)。

`<luceneMatchVersion>` 声明使用的lucene的版本。

`<lib>` 配置solr用到的jar包，具体语法示例中基本都有了。

`<dataDir>` 如果不用 `$SolrHome/data` 目录，可以指定其它别的目录来存放所有索引数据。如果使用了 replication，它可以匹配 replication 配置。如果这个目录不是绝对的，那会是当前 servlet 容器工作目录下的相对目录。

`<directoryFactory>` 索引文件的类型，默认`solr.NRTCachingDirectoryFactory`
这个文件类型包装了`solr.StandardDirectoryFactory`和小文件内存缓存的类型，来提供NRT搜索性能。NRT(near-real-time)近实时。

`<indexConfig>` 主要索引相关配置

`<writeLockTimeout>` IndexWriter写锁过时的时间，默认1000

`<maxIndexingThreads>` 最大索引的线程数，默认8

`<useCompoundFile>` 是否使用混合文件，Lucene默认是`true`，solr默认是`false`

`<ramBufferSizeMB>` 使用的内存的大小，默认100，这个实际用的时候应该修改大一点。

`<ramBufferdDocs>` 内存中最大的文档数，默认1000

`<mergePolicy>` 索引合并的策略。默认`TiereMergePolicy`，合并大小相似的段，与`LogByteSizeMergePolicy`相似。这个可以合并不相邻的段，能够设置一次合并多少个段，`maxMergeAtOnce`以及每层能合并多少个段`segmentsPerTier`。

`<mergeFactor>` 每次合并索引的时候获取多少个段，默认10。等同于同时设置了`maxMergeAtOnce`和`segmentsPerTier`两个参数。

`<mergeScheduler>` 段合并器，背后有一个线程负责合并，默认`ConcurrentMergeScheduler`。

`<lockType>` 文件锁的类型，默认`native`，使用`NativeFSLockFactory`。

`<unlockOnStartup>` 默认`false`

`<termIndexInterval>` Lucene每次加载到内存的terms数，默认128

`<reopenReaders>` 如果是`true`时，`IndexReaders`能够被reopened，而不是先关闭再打开，默认`true`

`<deletionPolicy>` 删除策略，用户可以自己定制，solr默认的是`SolrDeletionPolicy`，是solr标准的删除策略，允许在一定时间内保存索引提交点，来支持索引复制，以及快照等特性。可以设置`maxCommitsToKeep`保存提交的数量、`maxOptimizedCommitsToKeep`保存的优化条件的数量、`maxCommitAge`删除所有commit points的时间。

`<infoStream>` 为了调试，Lucene提供了这个参数，如果是`true`的话，`IndexWriter`会像设置的文件中写入debug信息。

`<jmx>` 一般不需要设置具体可以查看[wiki文档](http://wiki.apache.org/solr/SolrJmx)

`<updateHandler>` 更新的Handler，默认`DirectUpdateHandler2`

`<updateLog><str name="dir">` 配置更新日志的存放位置

`<autoCommit>` 硬自动提交，可以配置maxDocs即从上次提交后达到多少文档后会触发自动提交；maxTime时间限制；openSearcher，如果设为false，导致索引变化的最新提交，不需要重新打开searcher就能看到这些变化，默认false。

`<autoSoftCommit>` 如自动提交，与前面的`<autuCommit>`相似，但是它只是让这些变化能够看到，并不保证这些变化会同步到磁盘上。这种方法比硬提交要快，而且更接近实时更友好。

`<listerner event>` `update`时间监听器配置，`postCommit`每一次提交或优化命令后触发，

`poatOptimize`每次优化命令后触发。`RunExecutableListener`每次调用后执行一些其他操作。配置项：
![](https://storage.blog.fliaping.com/blog/14637396747699.jpg)
`<indexReaderFactory>` 这个配置项用户可以自己扩展`IndexReaderFactory`，可以自己实现自己的

`IndexReader`。如果要明确声明使用的Factory则可以如下配置：
![](https://storage.blog.fliaping.com/blog/14637396960073.jpg)

`<query>` 配置检索词相关参数以及缓存配置参数。

　`<maxBooleanClauses>` 每个BooleanQuery中最大Boolean Clauses的数目，默认1024。

　`<filterCache>` 为`IndexSearcher`使用，当一个`IndexSearcher` Open时，可以被重新赋于原来的值，或者使用旧的`IndexSearcher`的值，例如使用LRUCache时，最近被访问的Items将被赋予`IndexSearcher`。solr默认是`FastLRUCache` 。
>cache介绍：http://blog.csdn.net/phinecos/article/details/7876385
>filterCache存储了无序的lucene documentid集合，该cache有3种用途：
>1）filterCache存储了filterqueries(“fq”参数)得到的document id集合结果。Solr中的query参数有两种，即q和fq。如果fq存在，Solr是先查询fq（因为fq可以多个，所以多个fq查询是个取结果交集的过程），之后将fq结果和q结果取并。在这一过程中，filterCache就是key为单个fq（类型为Query），value为document id集合（类型为DocSet）的cache。对于fq为range query来说，filterCache表现出其有价值的一面。
>2）filterCache还可用于[facet查询](http://wiki.apache.org/solr/SolrFacetingOverview)，facet查询中各facet的计数是通过对满足query条件的documentid集合（可涉及到filterCache）的处理得到的。因为统计各facet计数可能会涉及到所有的doc id，所以filterCache的大小需要能容下索引的文档数。
>3）如果solfconfig.xml中配置了`<useFilterForSortedQuery/>`，那么如果查询有filter（此filter是一需要过滤的DocSet，而不是fq，我未见得它有什么用），则使用`filterCache`。

　`<queryResultCache>` 缓存查询的结果集的docs的id。

　`<documentCache>` 缓存document对象，因为document中的内部id是transient,所以autowarmed为0，不能被autowarmed。

　`<fieldValueCache>`字段缓存

　`<cache name="">`用户自定义一个cache，用来缓存指定的内容，可以用来缓存常用的数据，或者系统级的数据，可以通过`SolrIndexSearcher.getCache()`,`cacheLookup()`, `and cacheInsert()`等方法来操作。

　`<enableLazyFieldLoading>`保存的字段，如果不需要的话就懒加载，默认true。

　`<useFilterForSortedQuery>`一般来讲用不到，只有当你频繁的重复同一个搜索，并且使用不同的排序，而且它们都不用“score”

　`<queryResultWindowSize>`queryResultCache的一个参数。
　
　`<queryResultMaxDocsCached>` queryResultCache的一个参数。

　`<listener event"newSearcher" class="solr.QuerySenderListener">`query的事件监听器。

　`<useColdSearcher>`当一个检索请求到达时，如果现在没有注册的searcher，那么直接注册正在预热的searcher并使用它。如果设为false则所有请求都要block，直到有searcher完成预热。

　`<maxWarmingSearchers>`后台同步预热的searchers数量。

　`<requestDispatcher handleSelect="false">`solr接受请求后如何处理，推荐新手使用false

　`<requestParsers enableRemoteStreaming="true" multipartUploadLimitInKB="2048000" formdataUploadLimitInKB="2048" />`使系统能够接收远程流。

　`<httpCaching never304="true">`http cache参数，solr不输出任何HTTP Caching相关的头信息。

　`<requestHandler>`接收请求，根据名称分发到不同的handler。

```html
"/select" 检索SearchHandler
"/query" 检索SearchHandler
"/get" RealTimeGetHandler
"/browse" SearcherHandler
"/update" UpdateRequestHandler
"/update/json" JsonUpdateRequestHandler
"/update/csv" CSVRequestHandler
"/update/extract" ExtractingRequestHandler
"/analysis/field" FieldAnalysisRequestHandler
"/analysis/document" DocumentAnalysisRequestHandler
"/admin" AdminHandlers
"/replication" 复制，要有主，有从

```
`<searchComponent>`注册searchComponent。
`<queryResponseWriter>`返回数据
`<admin> <defaultQuery>`默认的搜索词

# managed-schema
managed-schema在solr5之前叫schema.xml，文件主要配置索引和查询的字段信息，定义了所有的数据类型和各索引字段的信息（如类型，是否建立索引，是否存储原始信息等）。

**fields块配置**

```xml
<field name="" type="" indexde="" stored="" required="" multiValued="" omitNorms="" termVectors="" termPositions="" termOffsets="">
```

* name：名称
* type：类型从<types> 的fieldType中取
* indexed：是否索引
* stored：是否保存
* required：是否必须
* multiValuer：在同一篇文档中可以有多个值
* omitNorms：true的话忽略norms
* termVectors：默认false，如果是true的话，要保存字段的term vector
* termPositions：保存term vector的位置信息
* termOffects：保存term vector的偏移信息
* default：字段的默认值

`<dynamicField>`动态字段，当不确定字段名称时采用这种配置
`<CopyField>`

**types块配置**
`<types>` 块内，声明一系列的 `<fieldtype>`，以 Solr fieldtype类为基础，如同默认选项一样来配置自己的类型。

任何 `FieldType` 的子类都可以作为 `field type` 来使用，使用时可以用完整的包名，如果`field type` 类在 solr 里，那可以用 “solr”代替包名。提供多种不同实现的普通数据类型（integer, float等）。想知道怎么样被 Solr 正确地加载自定义的数据类型，请看：SolrPlugins
通用的选项有：

* name：类型名称
* class：对应于solr fieldtype类
* sortMissingLast=true|false 如果设置为true，那么对这个字段排序的时候，包含该字段的文档就排到不包含该字段的文档前面。
* sortMissingFirst=true|false 如果设置为true，那么对这个字段排序的时候，没有该字段的文档排在包含该字段的文档前面
* precisionStep 如何理解precisionStep呢？需要一步一步来： 参考文档：http://blog.csdn.net/fancyerii/article/details/7256379
1) precisionStep是在做range search的起作用的，默认值是4
2) 数值类型（int float double）在Lucene里都是以string形式存储的，当然这个string是经过编码的
3) 经过编码后的string保证是顺序的，也就是说num1>num2，那么strNum1>strNum2
4) precisionStep用来分解编码后的string，例如有一个precisionStep，默认是4，也就是隔4位索引一个前缀，比如0100,0011,0001,1010会被分成下列的二进制位“0100,0011,0001,1010“，”0100,0011,0001“，0100,0011“，”0100“。这个值越大，那么索引就越小，那么范围查询的性能（尤其是细粒度的范围查询）也越差；这个值越小，索引就越大，那么性能越差。
* positionIncrementGap和multiValued一起使用,设置多个值之间的虚拟空白的数量。字段有多个值时使用，如果一篇文档有两个title

>   title1: ab cd
>   title2: xy zz

如果positionIncrementGap=0，那么这四个term的位置为0,1,2,3。如果检索"cd xy"那么能够找到，如果你不想让它找到，那么就需要调整positionIncrementGap值。如100，那么这是位置为0,1,100,101。这样就不能匹配了。

`<fieldType name="random" class="solr.RandomSortField" indexed="true" />`这个字段类型可以实现伪随机排序。

**analyzer配置**
![](https://storage.blog.fliaping.com/blog/14638040464120.jpg)
包括tokenizer和filter，可以配置多个filter

**其他配置**
`<uniqueKey>`唯一字段，除非这个字段标记了“required=false”，否则默认为required字段
`<copyField>`一个源字段一个目的字段，将源字段的内容拷贝到目的字段，可以将多个字段合并，也可以对同一个字段，不同索引方式。
`<defaultSearchField>`默认的搜索字段
`<solrQueryParser defaultOperator="OR"/>`默认的检索词间的关系


# 数据导入配置
这个配置文件的名字是在`solrconfig.xml`中配置的，不过通常我们用`data-config.xml`这个名字,它是配置数据库信息，比如配置何种数据源datasource，全量索引，增量索引的数据库查询等。

由于这个配置项要讲的东西较多，单独在[导入Mysql数据到Solr中](/2016/04/06/how-to-import-data-from-mysql-by-using-solr-dataimporthandler/)中讲解。
# solr.xml
solr.xml主要是配置solr主目录中的索引库即SolrCore，一个solr服务可以配置多个SolrCore，即可以管理多个索引库。

```xml
<solr>

  <solrcloud>

    <str name="host">${host:}</str>
    <int name="hostPort">${jetty.port:8983}</int>
    <str name="hostContext">${hostContext:solr}</str>

    <bool name="genericCoreNodeNames">${genericCoreNodeNames:true}</bool>

    <int name="zkClientTimeout">${zkClientTimeout:30000}</int>
    <int name="distribUpdateSoTimeout">${distribUpdateSoTimeout:600000}</int>
    <int name="distribUpdateConnTimeout">${distribUpdateConnTimeout:60000}</int>

  </solrcloud>

  <shardHandlerFactory name="shardHandlerFactory"
    class="HttpShardHandlerFactory">
    <int name="socketTimeout">${socketTimeout:600000}</int>
    <int name="connTimeout">${connTimeout:60000}</int>
  </shardHandlerFactory>

</solr>
```
这是默认的内容，一般情况下不需要更改这里的东西，并且我也没怎么理解，所以等到我明白了再说。
