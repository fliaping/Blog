+++
author = "Payne Xu"
categories = ["shadowsocks"]
date = 2015-12-23T07:23:17Z
description = ""
draft = false
slug = "how-to-compile-and-install-shadowsocks-on-centos"
tags = ["shadowsocks"]
title = "shadowsocks在centos编译安装"

+++


现在新疆把python 的软件库都封了，pip都安不上，那只好自己编译安装了。系统为centos6 x64
###1.安装编译环境

```bash
yum install gcc glib2-devel openssl-devel pcre-devel bzip2-devel gzip-devel zlib-devel 

yum install build-essential autoconf libtool gcc -y 
```
<!--more-->
###2.编译安装shadowsocks
```bash
git clone git://github.com/madeye/shadowsocks-libev.git
cd shadowsocks-libev
./configure
make 
make install
```



```bash
cd ~
git clone https://github.com/rofl0r/proxychains-ng.git 
cd proxychains-ng 
./configure && make && make install  
make install-config
```
Now we can edit proxychains configure file 

```bash
vim /usr/local/etc/proxychains.conf
```

Go to last line, replace this line  

```bash
socks4  127.0.0.1 9050  -->  socks5 127.0.0.1 1080
```
 

save and quit, and now you can using it .

```bash
proxychains4 wget google.com
```
