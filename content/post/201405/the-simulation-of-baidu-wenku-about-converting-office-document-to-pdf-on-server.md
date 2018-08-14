+++
author = "Payne Xu"
categories = ["文库", "Linux", "doc2pdf"]
date = 2014-05-01T09:30:25Z
description = ""
draft = false
slug = "the-simulation-of-baidu-wenku-about-converting-office-document-to-pdf-on-server"
tags = ["文库", "Linux", "doc2pdf"]
title = "仿百度文库，office转pdf核心转换功能"

+++



这是我两年前写的东西，现在转移过来，进行稍微的整理。

在我现在看来，当时简直就是不知所云，当时可以拿自己是新手来当借口，可现在呢？如果工作中做不好事情，能拿我是应届生来当借口吗？

<!--more-->

这是SRP（大学生研究计划项目）中的一个模块，目的是把office文档转换为pdf，发现网上没有一个完整的教程。下面我把我的过程写一下，一来为了作为笔记，二来给新手一点福利（我自己也是新手，费了好大的劲）。

目前为止，是在linux下，我用的环境是ubuntu14.04(12+的版本应该都没问题)+libreoffice（openoffice也一样）+JODConverter3.0+php
以后会加上windows环境下的内容

 

# 实现原理思路

要实现 word 等文档在线阅读，需要将文档转换成 pdf，然后在把 pdf 格式的文件转换为 swf 的格式。或者直接在页面上阅读显示,这就要用到 pdf.js。

用到的软件：

 > * libreoffice（openoffice）<开源的office套件>这两个本来是一个，后来分家了，所以对它们的基本控制都一样。我这里用的是libreoffice，因为ubuntu自带的. 
  
 > * libreoffice（openoffice）的SDK  ，即开发套件包
 > * JODConverter （开源的一個Java的OpenDocument 文件转换器）
 > * jdk（java环境）
 > * pdf.js (js来解析渲染PDF文件)
 
# 下载软件
 > [百度网盘链接](http://pan.baidu.com/s/1i34BY0P)
 
 > 官网下载：  
 >　　　　　[libreoffice](http://zh-cn.libreoffice.org/download/) 　　[(SDK)](http://download.documentfoundation.org/libreoffice/stable/4.2.3/deb/x86_64/LibreOffice_4.2.3_Linux_x86-64_deb_sdk.tar.gz)    
  　　　　　[openoffice](http://www.openoffice.org/download/index.html)　　[(SDK)](http://www.openoffice.org/download/other.html#notes)   
  　　　　　[JODConverter](https://code.google.com/p/jodconverter/)  
  　　　　　[jdk](http://www.oracle.com/technetwork/java/javase/downloads/index.html)  
  　　　　　[pdf.js](https://mozilla.github.io/pdf.js/)
               

# 环境配置
 
安装顺序为Java JDK ，libreoffice主程序，libreoffice sdk，jodconverter

## 安装jdk（安装过的的童鞋可以忽略）

下载系统对应位数32或64的jdk，我下的是tar.gz 格式的。解压之后用root权限放在/opt目录下，改名字为jdk-7-sun（这是我的个人喜好，配置方法有很多种，可以自行搜索）

配置java环境

用以下指令，或者用sudo nautilus命令在图形界面找到 /etc/profile文件，然后添加内容

```bash
vi  /etc/profile 
```

添加以下内容到文件尾部

```bash
JAVA_HOME=/usr/java/jdk1.7.0_45
JRE_HOME=/usr/java/jre1.7.0_45
PATH=$PATH:$JAVA_HOME/bin:$JRE_HOME/bin
CLASSPATH=.:$JAVA_HOME/lib/dt.jar:$JAVA_HOME/lib/tools.jar:$JRE_HOME/lib
export JAVA_HOME JRE_HOME PATH CLASSPATH
```

接着使生效

```bash
source profile
```

在alternative中注册1.7版本

```bash
update-alternatives --install "/usr/bin/java" "java" "/usr/java/jdk1.7.0_45/bin/java" 90

update-alternatives --install "/usr/bin/javac" "javac" "/usr/java/jdk1.7.0_45/bin/javac" 90
```
更改java各版本运行优先级

```bash
update-alternatives --config java
```
出现已经安装的多个Java版本，选择相应序号就可设置哪个java作为最高优先级运行了。
   
更改javac各版本运行优先级（同上）  

```bash
update-alternatives --config javac
```
解决像这样的问题bash:/opt/jdk-7-sun/bin/java:权限不够”的问题

```bash
root@xmax-K43TK:~$ chmod +x/opt/jdk-7-sun/bin/java
```
## 安装libreoffice（openoffice）主程序

