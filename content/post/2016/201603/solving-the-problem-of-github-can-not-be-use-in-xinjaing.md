+++
author = "Payne Xu"
categories = ["gfw", "github"]
date = 2016-03-01T15:04:33Z
description = ""
draft = false
slug = "solving-the-problem-of-github-can-not-be-use-in-xinjaing"
tags = ["gfw", "github"]
title = "github在新疆用不了的问题"

+++



新疆一直是GFW的实验区，甚至国内的很多网站也跟着遭殃，百度网盘分享链接、酷我、唱吧、github挂掉，再接着CSDN、cnblog相继挂掉，这里也不想探讨原因，大家都懂的。可怜了在新疆上学的孩子，本来新疆的师资力量都够烂了，还要增高学生的信息获取门槛。虽然我就要离开这个地方，但依然为在新疆上学的孩子感到悲伤。

> 本来在中国的学生在信息获取上处于劣势，在新疆上学的学生更是悲惨。作为搞技术的还好，通过与墙斗争能提高技术水平。但大多数只能被禁锢，但最让人胆颤的是很多人**被禁锢而不以为然**。

<!--more-->

今天用brew安装一个软件，brew update 一直报错

```bash
fatal: unable to access 'https://github.com/Homebrew/homebrew-boneyard/': 
SSL certificate problem: Invalid certificate chain
```
当然由于新疆github一直是封着的（也不能说一直，大陆解封github后有一段时间新疆也是能访问的，之后又被封掉了），我当然是有有工具可以出去的。

这个问题困扰了我好一会儿，以为是SSL证书的问题，把KeyChain Access的所有github有关的全删掉，不行。我提交我在github的代码，还有这个错误，当然URL不一样，开始怀疑不是证书的问题了。

然后我用wget github.com,呵呵，404，浏览器正常，ping 了一下github.com解析个这玩意203.208.39.99，连上vps，解析出来的是192.30.252.129，卧槽，太不厚道了。
### 解决方法
1. 修改/etc/hosts 添加  
   
   ```
  192.30.252.129   github.com
  ```
2. 改dns，114.114.114.114或者223.5.5.5都行
### 总结
这是墙的DNS污染功能，浏览器能访问的原因是安装了插件，解析没走本地。