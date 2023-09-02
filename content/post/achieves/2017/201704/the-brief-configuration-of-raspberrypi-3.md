+++
author = "Payne Xu"
categories = ["酷cool玩"]
date = 2017-04-08T12:33:25Z
description = ""
draft = false
slug = "the-brief-configuration-of-raspberrypi-3"
tags = ["raspberry-pi"]
title = "树莓派3简明配置"

+++


# 系统安装

首先选择一个系统，Linux有很多发行版都是支持raspberry-pi的，每个人有自己的喜好，如果是想深入学习Linux（或者说喜欢折腾）的，ArchLinux和Gentoo是不错的选择，但是若目的不再于此，选择官方系统可能是比较好的选择。另外像Ubuntu Meta也挺不错。

## 使用 noobs 安装
* 有显示器：格式化 sd 卡为 fat32格式，将 [noobs](https://www.raspberrypi.org/downloads/noobs/)解压拷贝到 sd 卡，插上sd 卡上电，HDMI 连接显示器按照步骤安装就可以。
* 无显示器：recovery.cmdline 加入silentinstall

## 直接安装

**官方系统Raspbain**
1. 直接将系统刻录到SD卡
Mac和Linux一般使用dd命令即可，Windows需要一些刻录软件，例如UltalISO，以及一些装机软件，如大白菜都可以完成刻录工作。

```bash
sudo dd bs=4M if=raspbian.img of=/dev/sdb
```

2. 插入内存卡，开机
官方系统会自动扩展文件系统，如果没有自动扩展，开机之后也可以使用raspi-config和扩展以及另外的一些配置

```bash
sudo raspi-config
```
<!--more-->

**第三方系统**
和官方系统类似，详细请参照官方的安装文档，基本步骤都是一样，需要注意的是有的系统不会自动扩展文件系统，可能需要自己手动扩展，一般官方文档都会有说明。

## 参考内容
* [NOOBS安裝(多系統開機)](https://sites.google.com/site/raspberypishare0918/home/di-yi-ci-qi-dong/noobs-an-zhuang)
* [Installing Raspbian from NOOBS without display](http://raspberrypi.stackexchange.com/questions/15192/installing-raspbian-from-noobs-without-display)
* [树莓派官方文档](https://www.raspberrypi.org/documentation/)

# 网络配置&远程连接
官方系统自带VNC，只要设置好网络就可以连接。 ip:5900

## 参考内容
* [树莓派：漂洋过海来看你](http://www.cnblogs.com/vamei/p/6227951.html)

# 互联网远程连接
## ngrok
ngrok的大名就不用多说，国内也很多这样的服务Sunny-ngrok,NATAPP，不过这些都开始收费了，当然如果自己有服务器，可以动手搭建一个ngrok，官方的源码会有些内存泄漏的问题。问题不大。另外一个问题是没有认证，任何ngrok-client都可以连接。

[ngrok](https://github.com/inconshreveable/ngrok)
## frp
国人出品，目标是ngrok的替代品。目前正在使用，稳定性也很好。
Github地址：[frp - github](https://github.com/fatedier/frp)

## Weaved Connect（remote3.it）
这是一个远程连接服务，通过安装软件来使用，官方有详细的安装和使用文档[Installation Instructions for Raspberry Pi](https://www.weaved.com/installing-weaved-raspberry-pi-raspbian-os/)，当然这个服务有几个缺点，就是速度比较慢（因为服务器在境外）以及每隔一段时间就要换地址，所以该服务的应用场景也仅仅是应急的ssh连接了。

几个简单的命令：

```bash
# 安装
sudo apt-get update
sudo apt-get install weavedconnectd
#配置
sudo weavedinstaller
```

## 参考资料
* [搭建 ngrok 服务实现内网穿透](https://imququ.com/post/self-hosted-ngrokd.html)

# 磁盘挂载
```
UUID="DE5EEB695EEB38C3" https://storage.blog.fliaping.com/blog/Data  ntfs-3g  defaults,nofail,x-systemd.device-timeout=1   0  0

UUID="c6d814f6-259e-3ad2-9386-8e9f778fbe44"   https://storage.blog.fliaping.com/blog/TimeMachine  hfsplus defaults,nofail,x-systemd.device-timeout=1   0  0
```
UUID 可以通过 blkid 命令获得。

- defaults 使用文件系统的默认挂载参数
- nofail 开机时若连接不到该设备不报错
- x-systemd.device-timeout=1 开机设备连接超时默认是90秒，可自定义时长，需要注意的是0为无限等待（Raspbain系统，后面会有一个任务，仍然会等90秒）

之前我没有加nofail，然后就当我拔掉移动硬盘之后就无法开机。

## 参考资料
* [fstab - archlinux](https://wiki.archlinux.org/index.php/Fstab#External_devices)

# 媒体软件

## 安装 miniDLNA
如果采用`sudo apt-get install minidlna`，安装的不是最新版本，并且默认是不支持rmvb格式的视频。
所以最好自己下载源代码，只需要做很少改动就可以支持rmvb，然后编译安装。

```bash
# 移除已安装的
sudo apt-get purge minidlna -y
sudo apt-get remove minidlna
sudo apt-get autoremove -y

# 安装miniDLNA所依赖的包
sudo apt-get build-dep minidlna -y

# 安装编译相关工具
sudo apt-get install autoconf automake autopoint build-essential

```

下载源码 `http://sourceforge.net/projects/minidlna/files/minidlna/1.1.5/minidlna-1.1.5.tar.gz`

解压出代码，修改源代码支持rmvb/rm

```c++
## metadata.c
//line 840
else if( strncmp(ctx->iformatctx->name, "matroska", 8) == 0 )
    xasprintf(&m.mime, "video/x-matroska");
else if( strcmp(ctx->iformatctx->name, "flv") == 0 )
    xasprintf(&m.mime, "video/x-flv");
//
