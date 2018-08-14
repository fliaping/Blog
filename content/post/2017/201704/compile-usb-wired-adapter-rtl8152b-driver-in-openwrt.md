+++
author = "Payne Xu"
categories = ["openwrt"]
date = 2017-04-08T14:25:25Z
description = ""
draft = false
slug = "compile-usb-wired-adapter-rtl8152b-driver-in-openwrt"
tags = ["openwrt"]
title = "OpenWrt编译USB有线网卡RTL8152B驱动"

+++



路由器用的TP-Link WR13U（ar71xx），只有一个RJ-45口，我用来作为WAN口，局域网只能通过无线连接，所以局域网网速比较差，于是就像加一个USB有线网口。
在淘宝上淘了RT8152B的网卡，但是OpenWrt仓库没有该驱动，最后发现github源码中已经包含该驱动，于是下载源码，编译系统，得到驱动安装包。

# 系统编译
系统是archlinux，软件包的安装在参看资料的openwrt官方wiki中已经很清晰。

<!-- more  -->

## 下载源码
```bash
# 下载源码
git clone git://github.com/openwrt/openwrt.git
# 更新feed
./scripts/feeds update -a
# 安装feed
./scripts/feeds install -a
# 获取 shadowsocks-libev Makefile
git clone https://github.com/shadowsocks/openwrt-shadowsocks.git package/shadowsocks-libev
# 获取 LuCI for Shadowsocks-libev 源码
git clone https://github.com/shadowsocks/luci-app-shadowsocks.git package/luci-app-shadowsocks
# 编译安装 po2lmo (如果有po2lmo可跳过)
pushd package/luci-app-shadowsocks/tools/po2lmo
make && sudo make install
popd

```
## 配置编译参数

```bash
make menuconfig

# 进入菜单，选择自己需要安装的包(空格选中，第一次按为M，第二次为*，不同之处在于M不会编译到镜像中，*则会)
# 目标平台、目标机器
# RT8152B驱动在 kernel -> use* -> usb-net -> 空格选中，展开项中选择 -> kmod-usb-net-rtl8152
# shadowsocks-libev 在 NetWork -> shadowsocks-libev
# luci-app-shadowsocks 在 LuCI -> 3. Applications
```

```bash
# j参数 openwrt 推荐 core+1
make -j5 V=s
# 注意编译过程保持网络畅通，最好是VPN，全局代理也行。
# 推荐一个命令行代理工具 proxychains-ng
```
第一次编译需要挺久，心理上准备好两个小时以上时间。

编好的的镜像放在bin目录下

# 然并卵
一周过后我发现trunk软件仓库中有kernel文件夹，经过查找，发现有RT8152B的驱动，我费这么大事干嘛用，直接升级路由器到trunk版，什么事都解决了，废了好长时间在这件事上真是不应该。

另外本来想换LEDE系统的，但是，发现LEDE的系统不推荐在ROM低于8M的设备上使用，可怜的tp-mr-13u只有4M，就用不起来咯


# 参考资料

* [Eth Over USB, insert module rt8152b - 没有卵用，不过这是我在网上找到的唯一一个关于这个问题的讨论](https://bbs.nextthing.co/t/eth-over-usb-insert-module-rt8152b/3951)
* [OpenWrt-GetSource](https://dev.openwrt.org/wiki/GetSource)
* [openwrt-packages](https://wiki.openwrt.org/doc/packages)
* [howto-build](https://wiki.openwrt.org/doc/howto/build)
* [OpenWrt build system – Installation](https://wiki.openwrt.org/doc/howto/buildroot.exigence)
* [Shadowsocks-libev for OpenWrt](https://github.com/shadowsocks/openwrt-shadowsocks)
* [OpenWrt LuCI for Shadowsocks-libev](https://github.com/shadowsocks/luci-app-shadowsocks)
