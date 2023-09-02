+++
author = "Payne Xu"
categories = ["Developer"]
date = 2016-05-19T03:51:25Z
description = ""
draft = false
slug = "configure-mmseg4j-analyzer-on-solr5"
tags = ["搜索引擎", "Solr"]
title = "Solr整合中文分词器mmseg4j"

+++




# 分词的基础概念
## 为什么要进行分词
>中文分词(Chinese Word Segmentation) 指的是将一个汉字序列切分成一个一个单独的词。

分词就是将连续的字序列按照一定的规范重新组合成词序列的过程。我们知道，在英文的行文中，单词之间是以空格作为自然分界符的，而中文只是字、句和段能通过明显的分界符来简单划界，唯独词没有一个形式上的分界符，虽然英文也同样存在短语的划分问题，不过在词这一层上，中文比之英文要复杂的多、困难的多。

<!--more-->

## 分词方法

1. 基于字符串匹配的分词方法（机械分词法）：将待分字串与词典进行匹配

   * 正向最大匹配法 （由左到右的方向）
   * 逆向最大匹配法（由右到左的方向）storage.blog.fliaping.com
   * 最小切分法（每句话切分的词数最少）
   * 双向最大匹配法（进行由左到右、由右到左两次扫描）
![Chinese-Word-Segmentation-arithmeti](https://o364p1r5a.qnssl.com/blog/Chinese-Word-Segmentation-arithmetic.png)
2. 基于理解(Semantic)的分词法：在分词的同时引入句法和语义信息处理歧义
3. 基于统计的分词方法：相邻字频率越高越成词；多用于新词识别(补充词典) 
4. 复合分词法（上述3种方法的综合运用和相互补充） 

那些高级的分词方法难度较大，所以用最简单的基于字符串匹配的分词方法，我们选择的mmseg4j分词器有Simple和Complex两种模式，都是基于正向最大匹配。

# 常用分词器介绍

* mmseg4j 用 storage.blog.fliaping.comeg 算法(http://technology.chtsai.org/mmseg/ )实现的中文分词器，并实现 lucene 的 analyzer 和 solr 的TokenizerFactory 以方便在Lucene和Solr中使用，并且最后更新时间为2015年，支持Solr5。
* IKAnalyzer，采用了特有的“正向迭代最细粒度切分算法“，具有60万字/秒的高速处理能力。采用了多子处理器分析模式，支持：英文字母、数字、中文词汇等分词处理，兼容韩文、日文字符。可以说IK也是很不错的分词器，不过由于他对Solr5兼容不是很好，所以最后也没用它。
* paoding，Paoding's Knives 中文分词具有极高效率和高扩展性 。引入隐喻，采用完全的面向对象设计，构思先进。但是已经很久不更新了。

下表出自[中文分词器性能比较](http://www.cnblogs.com/wgp13x/p/3748764.html)
![](https://o364p1r5a.qnssl.com/blog/14636338894868.jpg)
 
# 整合mmseg4j到Solr5.5

## 下载：[mmseg4j-solr](https://github.com/chenlb/mmseg4j-solr)

有很多个版本，支持Solr5的为`mmseg4j-solr-2.3.0.jar `，如果你在代码中使用还可以用maven仓库来直接添加依赖。要想整合进Solr，就需要另外的包`mmseg4j-core-1.10.jar`，其实`mmseg4j-core`这个包才是分词器的核心，`mmseg4j-solr`只是兼容Solr的接口。

## 放置jar包到正确位置
将这两个包放进servlet的类库目录中，这里的路径就是`$Solr.Install.Dir/server/solr-webapp/webapp/WEB-INF/lib`。如果你用的是Tomcat作为servlet，那么可以路径就应该是`$TomcatDir/webapps/solr/WEB-INF/lib`。

## 创建一个SolrCore
首先保证Solr正常启动了，下面有三中创建方法。

* 方法一：在命令行中新建。转到`$Solr.Install.Dir`,输入一下命令：

```bash
bin/solr create -c trip
```
成功可以看到如下输出日志

```bash
Copying configuration to new core instance directory:
/Users/Payne/Workspace/GraduateProject/Solr/solr-5.5.0/server/solr/trip

Creating new core 'trip' using command:
http://localhost:8983/solr/admin/cores?action=CREATE&name=trip&instanceDir=trip

{
  "responseHeader":{
    "status":0,
    "QTime":1217},storage.blog.fliaping.com
  "core":"trip"}
```
* 方法二：在管理界面创建，首先在你的`$SolrHome`目录下建立要创建Core的文件夹，然后把同目录下的`configsets/basic_configs/conf`文件夹copy到你新建的Core文件夹中，之后再管理界面就可新建了，如下图所示。

![create-new-core-useing-admin-ui](https://o364p1r5a.qnssl.com/blog/create-new-core-useing-admin-ui.png)
* 方法三：在方法二copy完成配置文件的基础上，可以通过URL-API来创建，假如我要创建一个名为trip的core，可以用如下的链接

```html
http://localhost:8983/solr/admin/cores?action=CREATE&name=trip&instanceDir=trip
```
如果创建成功页面中会返回

```xml
<response>
  <lst name="responseHeader">
    <int name="status">0</int>
    <int name="QTime">275</int>
  </lst>
  <str name="core">trip</str>
</response>
```
其实命令行创建就是把这个方法自动化的

## 修改配置文件
找到Core的配置文件夹，就是方法二中复制过来的那个，修改文件`$SolrHome/trip/conf/managed-schema`(在5.0前，该文件是shcema.xml，当然可以将该文件重命名为schema.xml,但不建议这么做），加入下面的内容并重启Solr，即可在Solr Admin 的console中看到新增的这些field了。

```xml
<!-- mmseg4j-->
    <field name="mmseg4j_complex_name" type="text_mmseg4j_complex" indexed="true" stored="true"/>
    <field name="mmseg4j_maxword_name" type="text_mmseg4j_maxword" indexed="true" stored="true"/>
    <field name="mmseg4j_simple_name" type="text_mmseg4j_simple" indexed="true" stored="true"/>

    <fieldType name="text_mmseg4j_complex" class="solr.TextField" positionIncrementGap="100" >
       <analyzer>
          <tokenizer class="com.chenlb.mmseg4j.solr.MMSegTokenizerFactory" mode="complex" dicPath="/Users/Payne/Workspace/GitHub/trip-search/SolrHome/trip/conf"/>
          <filter class="solr.StopFilterFactory" ignoreCase="true" words="stopwords.txt" />
        </analyzer>
    </fieldType>
    <fieldType name="text_mmseg4j_maxword" class="solr.TextField" positionIncrementGap="100" >
         <analyzer>
           <tokenizer class="com.chenlb.mmseg4j.solr.MMSegTokenizerFactory" mode="max-word" dicPath="/Users/Payne/Workspace/GitHub/trip-search/SolrHome/trip/conf"/>
           <filter class="solr.StopFilterFactory" ignoreCase="true" words="stopwords.txt" />
         </analyzer>
     </fieldType>
     <fieldType name="text_mmseg4j_simple" class="solr.TextField" positionIncrementGap="100" >
        <analyzer>
           <tokenizer class="com.chenlb.mmseg4j.solr.MMSegTokenizerFactory" mode="simple" dicPath="/Users/Payne/Workspace/GitHub/trip-search/SolrHome/trip/conf"/>
           <filter class="solr.StopFilterFactory" ignoreCase="true" words="stopwords.txt" />
         </analyzer>
     </fieldType>
<!-- mmseg4j-->storage.blog.fliaping.com
```
这里要注意`dicPath`，是这个`tokenizer`的词库文件的路径，最好用绝对位置。

重启Solr 后，即可在新创建的trip这个core的Analysis中看到mmseg4j新增的field。
![show-mmseg4j-field-added](https://o364p1r5a.qnssl.com/blog/show-mmseg4j-field-added.png)
## 停用词字典
概念：
>在信息检索中，为节省存储空间和提高搜索效率，在处理自然语言数据（或文本）之前或之后会自动过滤掉某些字或词，这些字或词即被称为Stop Words(停用词)。

停用词分为两类：功能词和词汇词。在这里我们不做区分，主要是屏蔽一些如"是，的，地，得"等一些功能性的词汇。

编辑配置目录中的`stopwords.txt`文件，添加停用词，每个词占一行。添加了如下停用词之后（记得要重启Solr哦）,对`九寨沟的水真是美丽极了`这句话分词的结果如图所示，看到所分出来的词`的，真是`在停用词文件中有匹配，所以被屏蔽掉了。

```
是
的
啊storage.blog.fliaping.com
哈
嗯
真是
```
![the-water-of-jiuzhaogou-is-so-beautifu](https://o364p1r5a.qnssl.com/blog/the-water-of-jiuzhaogou-is-so-beautiful.png)
## 增加词库
mmseg4j默认是使用mmseg4j-core-1.10.0.jar中的words.dic,总共只有不到15万的中文词，另外我做的是旅游搜索，所以会有很多地名、经典名之类的专有词，所以，我们还需要另外增加词库。这些词库已经有很多现成的资源可以供我们使用，各大输入法厂商都有专有名词包供我们下载，但它们一般都是私有的二进制格式，不是文本文件，所幸有人做了词库转换软件，我们可以下载输入法的词库文件然后转成文本。

* 深蓝词库转换：[imewlconverter-github](https://github.com/studyzy/imewlconverter)，[下载](http://www.onlinedown.net/soft/577118.htm)
* 搜狗词库：[细胞词库](http://pinyin.sogou.com/dict/)
* 百度词库：[词库](storage.blog.fliaping.comu.com/dict.html)

将做好的词库文件命名为`word.dic`，放在前面`dicPath`配置的文件夹下，我这里就放在SolrHome的conf目录下。(名字一定要是word.dic)

重启Solr，再次进行Analysis，这次关闭了详细参数的显示。
![](https://o364p1r5a.qnssl.com/blog/14636499218731.jpg)

至此，已经完成mmseg4j的整合。

## complex和maxword两种类型的区别
引用自: [Solr 5.x的搭建（Solr自带的Jetty Server）与mmseg4j中文分词](http://josh-persistence.iteye.com/blog/2249791)

我们假定我们的分词库中存在着”林书豪“，”书豪“，”林书“3个词。
在mmseg4j-complex算法中，"林书豪"会被完整分词为"林书豪"，而mmseg4j-maxword中由于只支持两个字的分词，“林书豪”会被分词为“林书”，“书豪”。这也就以为这如果你选的是mmseg4j-complex算法，你要搜索出含有“林书豪”的内容，则你必须完整的输入“林书豪”才会能够搜得出结果，而在mmseg4j-maxword算法中，你只需要输入“林书”或者“书豪”就可以得出想要的结果了。

所以在实际开发过程中，我们常常需要在精度和广度之间得出权衡的时候，可以选择性的丰富词库，更改词库，比我我希望输入“林书”或者“书豪”的时候就可以得到我想要的结果，那么我就可以在词库中加入“林书”和“书豪”，并且使用mmseg4j-maxword算法，但是我希望的是输入完整的林书豪才能得到我希望的搜索结果，那么就需要使用mmseg4j-complex算法，而且词库中需要加入“林书豪”。

**注意：**

* 在words.dic中分词的顺序是很重要的，比如对于上面的例子“林书豪来中国了”，如果选择mmseg4j-complex算法，并且在词库的最后加入“来中国”，那么你可以看到分词的结果为后面的”来中国“将替代前面的“中国”。



