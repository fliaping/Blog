+++
author = "Payne Xu"
categories = ["vpn"]
date = 2017-06-24T03:48:25Z
description = ""
draft = false
slug = "to-use-easyvpn-on-linux"
tags = ["vpn"]
title = "easyvpn-linux使用"

+++


![easy-vpn-interface-tun0](https://o79q42bb0.qnssl.com/blog/easy-vpn-interface-tun0.png)

公司vpn用的是easyvpn，就是这个[sangfor-深信服](http://www.sangfor.com.cn/index.html)，但是linux的连接方式是通过网页，在浏览器中执行java，也就是applet，但是现在的浏览器都不再支持运行java了，然后我尝试通过运行Windows10虚拟机，因为easyvpn的Windows客户端比较方便，然后通过http代理的方式提供给linux用，但是linux的全局代理了比较麻烦，我对iptables并不熟悉，并没有解决问题。之后又尝试将Windows10作为一个软路由，无奈不是Windows server，没有图形化界面的配置，只好放弃，最后又回过头来尝试了linux的配置，下面是实现过程。

<!-- more  -->

# 安装opera 10.60  (32位)

https://pan.baidu.com/s/1miNZCla
解压，运行文件夹的install，按步骤安装`~/.local/bin/opera` 启动即可。

也可能需要安装一些依赖：

```bash
sudo apt-get install libstdc++6:i386 libxt6:i386 libgtk2.0-0:i386
```
出现gtk WARNING，通过google解决，不解决也没太大影响

```bash
sudo apt-get install gtk2-engines-pixbuf:i386 gtk2-engines-murrine:i386 gnome-themes-standard:i386 libatk-adaptor:i386 libgail-common:i386 libcanberra-gtk-module:i386
```

# 安装jre1.6 (32位)
https://pan.baidu.com/s/1c1Z5gbQ
默认路径 /usr/java/jre1.6.x.x，找不到搜索就好了sudo find / -name jre1.6*

浏览器jre插件：将前面jre安装路径lib下的libnpjp2.so软链接到插件目录，例如
```bash
cd /usr/lib/mozilla/plugins/
sudo ln -s /usr/java/jre1.6.0_27/lib/i386/libnpjp2.so
```


# 验证浏览器插件安装成功
https://www.java.com/en/download/installed.jsp

只要页面上的applet能够被识别，开始运行，就算运行出错也没关系。（前提是能运行，要么运行成功，要不报错，没动静是不行滴）

打开easyvpn登录页登录即可，成功的话，会创建一个tun0的网络接口。

![easy-vpn-login-page](https://o79q42bb0.qnssl.com/blog/easy-vpn-login-page.jpg)
