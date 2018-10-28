+++
author = "Payne Xu"
categories = ["Developer"]
date = 2016-03-04T12:19:40Z
description = ""
draft = false
slug = "some-notes-ablout-my-ghost-blog"
tags = ["Ghost", "node.js"]
title = "Ghost博客系统的一些笔记"

+++



我决定将博客分开，[主站](https://xvping.cn) 用Ghost，是技术无关的内容，记录一些生活、想法，而[Payne's Blog](http://blog.xvping.cn/) 是用的Hexo，都是我的原创技术博客。

简单写一下，有时间再详细补充
<!--more-->
# Node.js更新到4.2.x
我用的是nvm（Node Version Manager）来更新的，还有很多别的方法，例如npm,编译安装等。

1.安装nvm

```  shell
mkdir ~/App/Nvm -p  
cd ~/App/Nvm/   
git clone https://github.com/creationix/nvm.git Git 
cd Git   
git checkout git describe --abbrev=0 --tags
./install.sh  
```
2.安装指定版本的node

```bash 
nvm install 4.2.6  #ghost0.7.4最高支持node4.2.x
nvm use 4.2.6   #使用指定的版本
```
 
3.版本相关

```bash
nvm ls    #查看当前已经安装的版本
nvm current  #查看正在使用的版本
nvm run 0.10.24 myApp.js   #以指定版本执行脚本
rm -rf ~/.nvm   #卸载nvm
```

# 启用http2
http2属于加密连接，如果页面中嵌有http连接将产生错误，因此所有的连接都最好是https加密的，但是我们之前有不少已经发布的文章中的图片都是http的怎么办呢？我的办法是直接改数据库，当然也有别的办法。

我用的是七牛存储来加速图片，并且它也提供了https的域名，那我只改url头就行了。

```sql
update posts set html=(replace(html,'http://7xirr0.com1.z0.glb.clouddn.com','https://storage.blog.fliaping.com'));
```
另一个办法就是强制http走https连接，前提是你图片都是本地的。

```html
<meta http-equiv="Content-Security-Policy" content="upgrade-insecure-requests"/>
```


# Ghost系统相关分析
## 本地文件-> URL映射
* core/built/assets/ -> $host/ghost/ 
* core/shared/ -> $host/shared/