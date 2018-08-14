+++
author = "Payne Xu"
date = 2017-12-03T20:11:43Z
description = ""
draft = false
slug = "some-software-problems-after-install-ubuntu-17-10"
title = "安装ubuntu17.10后的相关软件问题"

+++

# 字体
```bash
sudo apt-get install ttf-wqy-microhei  #文泉驿-微米黑
sudo apt-get install ttf-wqy-zenhei  #文泉驿-正黑
sudo apt-get install xfonts-wqy #文泉驿-点阵宋体
```
自带google的思源黑体 Noto Sans CJK
# WPS
1.到优麒麟下载wps64位，dpkg -i安装。
2.apt-get install -f修复依赖
3.到debian网站下载libpng12,安装
4.下载网上专为wps做的字体包安装
5.apt-get安装文泉驿字体
<!--more-->
```bash
# Installing libpng12
sudo apt install libpng12-0
# Installing wps http://www.ubuntukylin.com/application/show.php?lang=cn&id=278
wget http://archive.ubuntukylin.com:10006/ubuntukylin/pool/main/w/wps-office/wps-office_10.1.0.6115_amd64.deb
sudo dpkg -i wps-office_10.1.0.5707~a21_amd64.deb
# Running wps (in a X or Desktop)
wps 
```

# ubuntu 安装深度截图
## 添加DDE源
```bash
sudo add-apt-repository ppa:leaeasy/dde
sudo apt-get update
```
## 安装依赖
```bash
sudo apt install debhelper qt5-qmake qt5-default qtbase5-dev pkg-config libqt5svg5-dev libqt5x11extras5-dev qttools5-dev-tools libxcb-util0-dev libstartup-notification0-dev qtbase5-private-dev qtmultimedia5-dev x11proto-xext-dev libmtdev-dev libegl1-mesa-dev x11proto-record-dev libxtst-dev libudev-dev libfontconfig1-dev libfreetype6-dev libglib2.0-dev libxrender-dev libdtkwidget-dev deepin-notifications libdtkwm-dev
```
## 编译安装
```bash
git clone https://github.com/linuxdeepin/deepin-screenshot.git
qmake
make
sudo make install
```

## 显示服务器问题
从ubuntu 17.10开始，默认显示服务器是Wayland，深度截图貌似还没有兼容，如果截图时，出现黑屏，选择Xorg登录桌面就可以的


# 网易云音乐
## 旧版 1.0.0
```bash
wget http://s1.music.126.net/download/pc/netease-cloud-music_1.0.0-2_amd64_ubuntu16.04.deb
dpkg -i netease-cloud-music_1.0.0-2_amd64_ubuntu16.04.deb
apt-get install -f
# 这时是启动不了的，需要加参数
netease-cloud-music --no-sandbox

# 这里还会有问题，歌词乱码，根据archlinux社区的讨论，应该是qt的问题
# https://bbs.archlinuxcn.org/viewtopic.php?id=5021
wget http://download.qt.io/archive/qt/5.8/5.8.0/qt-opensource-linux-x64-5.8.0.run
chmod +x qt-opensource-linux-x64-5.8.0.run
sudo ./qt-opensource-linux-x64-5.8.0.run
LD_LIBRARY_PATH=/opt/Qt5.8.0/5.8/gcc_64/lib netease-cloud-music --no-sandbox
```

也可以加到.desktop里，
`Exec=env LD_LIBRARY_PATH=/opt/Qt5.8.0/5.8/gcc_64/lib netease-cloud-music --no-sandbox %U`

## 新版1.1.0
目前有问题，但是暂时可以用：

启动了页面弹不出来，命令行也一样，然后呢，点关机按钮，弹出来确认框，随后网易乐音乐页面也弹出来了，这时取消关机，可以正常使用云音乐
https://www.v2ex.com/t/407421#r_5012700

录了个屏 https://weibo.com/tv/v/FwZO3ltaM?fid=1034:1d480a191cbbcc940b81f619f0614a98

