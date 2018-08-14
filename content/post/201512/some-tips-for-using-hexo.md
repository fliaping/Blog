+++
author = "Payne Xu"
categories = ["hexo"]
date = 2015-12-26T12:45:44Z
description = ""
draft = false
slug = "some-tips-for-using-hexo"
tags = ["hexo"]
title = "hexo使用技巧汇总"

+++


<!--toc-->
## 为文章添加目录

在需要目录出现的地方放置一个标记，这样会自动生成一个嵌套的包含所有标题的列表。默认的标记是 [TOC]

```markdown
<!--toc-->
# Header 1

## Header 2
```
<!--more-->


## 添加文章后编辑器自动打开

1. 在Hexo目录下新建scripts目录(有就无视)
2. 在scripts下新建js脚本,名字随意(例子:~/blog/hexo/scripts/MacDown.js)

  >通过这个脚本，我们用其来监听hexo new这个动作，并在检测到hexo new之后，执行编辑器打开的命令。

3. 如果你是windows平台的Hexo用户，则将下列内容写入你的脚本：

  ```js
  var spawn = require('child_process').exec;
  
  // Hexo 2.x 用户复制这段
  hexo.on('new', function(path){
    exec('start  "markdown编辑器绝对路径.exe" ' + path);
  });
  
  // Hexo 3 用户复制这段
  hexo.on('new', function(data){
    exec('start  "markdown编辑器绝对路径.exe" ' + data.path);
  });
  ```
4. 如果你是Mac平台Hexo用户，则将下列内容写入你的脚本：

  ```js
  var exec = require('child_process').exec;
  
  // Hexo 2.x 用户复制这段
  hexo.on('new', function(path){
      exec('open -a "markdown编辑器绝对路径.app" ' + path);
  });
  // Hexo 3 用户复制这段
  hexo.on('new', function(data){
      exec('open -a "markdown编辑器绝对路径.app" ' + data.path);
  });
  ```
  
添加博文` hexo new "hexo test"`就会自动打开编辑器


$$E=mc^2$$

The *Gamma function* satisfying $\Gamma(n) = (n-1)!\quad\forall n\in\mathbb N$ is via the Euler integral
$$\Gamma(z) = \int_0^\infty t^{z-1}e^{-t}dt\,.$$

> 来源  
> [Hexo添加文章时自动打开编辑器
](http://notes.xiamo.tk/2015-06-29-Hexo%E6%B7%BB%E5%8A%A0%E6%96%87%E7%AB%A0%E6%97%B6%E8%87%AA%E5%8A%A8%E6%89%93%E5%BC%80%E7%BC%96%E8%BE%91%E5%99%A8.html)
  

## 自定义新菜单（使用NEXT主题）
假定你的菜单新增一项 something：

```
menu:
  home: /
  something: /something
```

同时，你使用的是中文简体，就需要编辑 languages/zh-Hans.yml，修改 menu 下的定义：

```
menu:
  home: 首页
  something: 三星
```
  
这样，就会自动 Hexo 就会自动使用 "三星" 作为新 item 的文本。
相关内容请看 [NEXT主题](https://github.com/iissnan/hexo-theme-next) 作者iissnan [github-Issue](https://github.com/iissnan/hexo-theme-next/issues/412)的回答

