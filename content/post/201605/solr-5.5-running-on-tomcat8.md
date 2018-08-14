+++
author = "Payne Xu"
categories = ["搜索引擎", "Solr"]
date = 2016-05-18T07:08:25Z
description = ""
draft = false
slug = "solr-5.5-running-on-tomcat8"
tags = ["搜索引擎", "Solr"]
title = "Solr5.5集成到Tomcat8"

+++



也许你不熟悉Jetty，或者觉得它性能不行，你想在Tomcat上运行Solr，没问题，理论上只要是servlet容器都可以运行Solr。不过问题是从solr5开始官方不再支持Tomcat的集成，所以可以有些配置问题需要自己来解决。于是我进行了一次尝试，solr4本来是比较容易的，Solr5就出现一些问题，由于对Tomcat了解也不是很深，除运行的时候Solr管理界面有些小问题外，基本可以正常使用。

<!--more-->

# 环境 
OSX 10.11.4 
JDK 1.8
# 安装Tomcat 
请自行搜索安装
# Solr基本知识 
[Solr基础知识及安装](/2016/05/17/introduction-of-solr-and-how-to-install-it/)
# 集成Solr

1.　指定 `$Solr`为压缩包路径，`$TomcatDir`为tomcat目录。

2.　将 `$Solr/server/solr-webapp/`下webapp文件夹，复制到 `$TomcatDir/webapps/`目录下，并改成solr(或你喜欢的名字）.

3.　将 `$Solr/server/lib/ext` 中的 jar 全部复制到 `$TomcatDir/webapps/solr/WEB-INF/lib` 目录中.

4.　将 `$Solr/server/resources/log4j.properties` 复制到 `$TomcatDir/webapps/solr/WEB-INF/classes` 目录中（如果没有classes则创建，放在bin中貌似也没影响）.

5.　将`$Solr/server/solr` 目录复制到你的 `$SolrHome`目录下，例如:`~/SolrHome`.

6.　打开`$TomcatDir/webapps/solr/WEB-INF`下的web.xml，找到如下配置内容（初始状态下该内容是被注释掉的）

```xml 
<env-entry>
  <env-entry-name>solr/home</env-entry-name>
  <env-entry-value>/put/your/solr/home/here</env-entry-value>
  <env-entry-type>java.lang.String</env-entry-type>
</env-entry>  
```

将`<env-entry-value>` 中的内容改成你的`$SolrHome`路径，~/SolrHome.

7.　打开`$TomcatDir/webapps/solr/WEB-INF`下的web.xml修改项目欢迎页面

```xml
<welcome-file-list>
  <welcome-file>./index.html</welcome-file>
</welcome-file-list>
```

注意：一定要确保文件中有这一项，否则会出现404错误。

8.　如果要导入数据，还要添加`$Solr/dist/`中的`solr-dataimporthandler-*.jar`和`solr-dataimporthandler-extras-*.jar`到`$TomcatDir/webapps/solr/WEB-INF/lib`目录下.

9.　启动tomcat，在浏览器输入http://localhost:8080/solr/admin.html 即可出现Solr的管理界面.
# 添加SolrCore

* 在solr_home目录下创建core_1（可自定义），在core_1目录下创建data目录，并将`solr_home/configsets/basic_configs/`目录下的conf目录复制到core_1下；通过控制台添加core，并重新启动Tomcat,就会看到新建的core_1了。

或者：
  
* http://localhost:8080/solr/admin/cores?action=CREATE&name=universal&instanceDir=universal&config=solrconfig.xml&schema=schema.xml&dataDir=data





