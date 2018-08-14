+++
author = "Payne Xu"
categories = ["Solr", "搜索引擎"]
date = 2016-04-06T04:40:39Z
description = ""
draft = false
slug = "how-to-import-data-from-mysql-by-using-solr-dataimporthandler"
tags = ["Solr", "搜索引擎"]
title = "导入Mysql数据到Solr中"

+++


一般存储数据都会用到数据库，之前十几年关系型数据库大行其道，现在非关系性数据库（NoSql）如日中天，随着数据越来越来越多，人们发现关系型数据库的性能已经不能满足需要，经历了一番挣扎，从主-从（读-写）分离，到分库分表，虽然维持了一段时间，但是数据量很快就上来了，于是NoSql越来越显示出其在大数据时代的价值。

咳咳，不过这篇文章讲的却是从最流行的关系型数据库中导入数据到Solr，没办法，笔者还没用过NoSql，所以还是老老实实讲Mysql，哈哈。

<!--more-->

# 导入需要的jar包
做过数据库开发的童鞋都知道，要想用数据可就需要连接数据库的接口，java上叫JDBC(Java Data Base Connectivity)，别的语言也有类似的接口。

那么，这次我们需要两个jar包，分别是`solr-dataimporthandler-5.5.0.jar`和`mysql-connector-java-5.1.38-bin.jar`，前一个可以在solr的解压目录下的dist目录中获取，后一个我想大家都可以找到的。

将这两个jar包复制到`$Solr.Install.Dir/server/solr-webapp/webapp/WEB-INF/lib`这个目录下。

# 配置导入设置
1.　默认dataImport功能在Solr5中是禁用的，需要在`solrconfig.xml`中添加如下配置开启数据导入功能：

```xml
 <!-- Data import from mysql 要放在<config></config>中哦-->
  <requestHandler name="/dataimport" class="org.apache.solr.handler.dataimport.DataImportHandler">
    <lst name="defaults">
      <str name="config">data-config.xml</str>
     </lst>
  </requestHandler>
```
2.　因为前面定义了导入的配置文件是`data-config.xml`，所以在solrconfig.xml同级目录下新建这个文件，贴出我的配置，内容如下：

```xml
<?xml version="1.0" encoding="UTF-8" ?>  
<dataConfig>   
<dataSource name="fromMysql"
      type="JdbcDataSource"   
      driver="com.mysql.jdbc.Driver"   
      url="jdbc:mysql://localhost:3306/tripsearch"   
      user="root"   
      password="root"/>   
<document>   
  <entity name="sight" query="SELECT * FROM sight" transformer="RegexTransformer">
     <field column="sight_id" name="sight_id"/> 
     <field column="sight_name" name="sight_name"/> 
     <field column="sight_score_ctrip" name="sight_score_ctrip"/>
     <field column="sight_intro" name="sight_intro"/> 
     <field column="sight_address" name="sight_address"/> 
     <field column="sight_coordinate" name="sight_coordinate"/> 
     <field column="sight_type" name="sight_type" splitBy=","/>
     <field column="pageurl" name="pageurl"/>
  </entity>   
</document>   

</dataConfig>
```
其中fromMysql为数据源自定义名称，随便取，没什么约束，type这是固定值，表示JDBC数据源，后面的driver表示JDBC驱动类，这跟你使用的数据库有关，url即JDBC链接URL,后面的user，password分别表示链接数据库的账号密码，下面的entity映射有点类似hiberante的mapping映射，column即数据库表的列名称，name即schema.xml中定义的域名称。

还有些设置项、参数不知道什么意思，后面后会说的。现在只要清楚field这个标签是设置数据库表中的列（column）和Solr中的字段的映射关系的。

另外：Solr中field还没有配置的，请先阅读[Solr字段配置解析//TODO]()
# 进行数据导入
1.　重启Solr，进入管理页面，选中trip这个Core，进入Dataimport这个选项。如果一切正常会出现如下图所示的界面。
![solr-admin-ui-dataimporthandler-home](https://o364p1r5a.qnssl.com/blog/solr-admin-ui-dataimporthandler-home.png)

右面的那些代码是你点击Configuration后出现的，是`data-config.xml`文件中的内容，也是应该首先检查的地方，如果配有这些配置信息，说明数据库导入的配置文件没生效，是`solrconfig.xml`文件中开启导入功能的地方出错。

2.　开始导入，要注意command参数，它有两个选项，如下图：
![](https://o364p1r5a.qnssl.com/blog/14636563686394.jpg)
full-import:全量导入，它会覆盖原有的索引
delta-import:即增量导入，它会在原有索引的基础上追加

下面的几个多选框含义解释如下：
verbose:这个选项设为true的话，会打印导入的一些中间过程的详细信息，有利于调试以及了解内部操作细节
clean:表示是否在导入数据创建索引之前先清空掉原有的索引
commit:表示是否立即提交索引
optimize:表示是否优化索引
debug: 表示是否开启调试模式

3.然后选择需要导入的Entity,点击Execute按钮开始执行数据导入操作，如图：（别人的图，我实在不想去启动Mysql再导入一次，见谅）
![](https://o364p1r5a.qnssl.com/blog/14636565158236.jpg)
正常的话就开始进行导入了，如下图
![](https://o364p1r5a.qnssl.com/blog/14636566646663.jpg)
我们可以通过`Refresh Status`这个按钮刷新状态，如果出现错误或者Fetched一直是0，那就表明有问题了，你要查看日志进行检查。如果导入成功，就会看到下图所示的情况：
![](https://o364p1r5a.qnssl.com/blog/14636568379783.jpg)
查看OverView菜单，会看到文档信息。
![](https://o364p1r5a.qnssl.com/blog/14636569573254.jpg)
在查询中点击`Execute Query`按钮,就能看到我们导进去并建好索引的信息，更具体的查询用法后面会讲到，下面是默认的查询，显示文档的所有信息。
![](https://o364p1r5a.qnssl.com/blog/14636571125307.jpg)

# 较为复杂的字段映射
## 数据库单表多个字段到solr多值字段
例如我数据库一个表中有关于地址的几个字段，分别是国家、省份、地区这样的字段（sight_place_1, sight_place_2, sight_place_3..）我需要把这几个字段放到solr中一个多值字段sight_place中。

题外话：对于关系型数据库不应该这样建表的，至少要满足第二范式，但这里用mysql只是为了存数据。

<!--more-->

其实对于这个需求比较容易实现，修改`data-config.xml`文件中的entity就行了，配置如下

```xml
<field column="sight_place_1" name="sight_place"/>
<field column="sight_place_2" name="sight_place"/>
<field column="sight_place_3" name="sight_place"/>
<field column="sight_place_4" name="sight_place"/>
<field column="sight_place_5" name="sight_place"/> 
```
## 数据库单表单字段到solr多值字段

前提：数据库中的单字段中的数据包含多值信息，并且用分隔符分开。例如数据库中sight_type字段的值是

sight_name |sight_type
