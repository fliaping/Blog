+++
author = "Payne Xu"
categories = ["酷cool玩"]
date = 2017-09-24T06:11:58Z
description = ""
draft = false
slug = "connecting-android-devices-with-linux"
tags = ["软件"]
title = "Connecting Android Devices with Linux"

+++

结合自身的实际，在Linux上连接Android的需求其实可以分为一下几类：

1. 手机的通知可以在Linux上弹窗提示
2. 能方便的在手机和Linux之间传输文件、甚至同步粘贴板
3. 能将手机画面同步到Linux上，并且还能直接操作
4. 将手机作为另外一个屏幕，共享Linux的鼠标键盘，直接操作Android系统
5. 仅仅将手机作为Linux的扩展屏

接下来我就来介绍几个软件，看看它们都能实现哪些需求

<!--more-->

# KDE Connect
看名字就知道是KDE桌面环境的组件，KDE桌面的高度定制以及酷炫的特性就不用多说了，没想到还这么关心小众需求，值得赞一个。

KDE Connect实现的需求是1和2另外还有些特色功能，下面列出主要功能

* 在Desktop上展示手机通知
* 互相传送文件
* 用手机模拟成桌面的触摸板（感觉这个功能还是蛮有用的）
* 控制桌面的打开的媒体播放器

该软件分为桌面端和手机端，手机端直接在google play就可以下载，桌面端可以在各大发行版仓库中下载。它们之间的连接是通过内网连接，需要在同一个环境下，并且需要开放相关端口。安装KDE Connect之后它们会自动发现，但是有时候并不能，需要手动添加。在右上角三竖点的子项 Add devices by IP。输入桌面端的IP地址即可在，KDE Connect Settings中发现手机，pair之后即可看到对于该手机的一些设置项。
![kde-connect-settings](https://storage.blog.fliaping.com/2017/09/kde-connect-settings.png)

对于手机端，如下图，可以发送文件，控制桌面的媒体播放器，模拟桌面的触摸板，除此之外还可以在右上角三竖点的子项中发现Plugin settings，对应于桌面端的那些设置，尤其值得注意，要想在桌面收到手机端的通知需要开启Notification sync，哦也可以设置APP维度通知的过滤。

![kde-connect-android](https://storage.blog.fliaping.com/2017/09/kde-connect-android.jpg)

![kde-connect-android-plugin-settings](https://storage.blog.fliaping.com/2017/09/kde-connect-android-plugin-settings.jpg)

另外有个扩展软件叫indicator-kdeconnect，可以在托盘中显示一个手机图标，显示设备的状态，以及一些快捷选项。可以通过一下命令安装，安装不成功的话就编译安装吧。Github: [indicator-kdeconnect](https://github.com/vikoadi/indicator-kdeconnect)

```bash
sudo add-apt-repository ppa:webupd8team/indicator-kdeconnect
sudo apt update
sudo apt install kdeconnect indicator-kdeconnect
```
编译安装：

```bash
sudo apt-get install gtk+-3.0-dev libappindicator3-dev valac
mkdir build
cd build
cmake .. -DCMAKE_INSTALL_PREFIX=/usr
make
sudo make install
```

相关链接（介绍和用法）：
[KDEConnect - KDE Community Wiki](https://community.kde.org/KDEConnect)
[How To Install KDE Connect On Linux To Access Files And Notifications On Andriod](https://www.addictivetips.com/ubuntu-linux-tips/install-kde-connect-on-linux/)

# DeskDock
用你电脑键盘鼠标控制你的手机，利用adb来模拟外设，能做到文章开头的2和4。同样是桌面端和手机端，但是手机端免费版功能受限，例如键盘不可用等，收费版要$5.49，还不便宜呀。我只试用了免费版的，感觉还可以，只是鼠标进入手机屏幕时会有些不畅甚至进不去的问题(可能是linux问题，windows和macOs应该好一点)，不过总体用起来还可以，可以通过快捷键切换鼠标焦点到PC或者手机。

桌面端软件是个jar包，安装了jre的都可以运行。因为是用adb连接，需要连接数据线，当然也可以开启Android的无线adb功能（下文会提到）。

![deskdock-android-status](https://storage.blog.fliaping.com/2017/09/deskdock-android-status.jpg)

![deskdock-pc-settings](https://storage.blog.fliaping.com/2017/09/deskdock-pc-settings.png)

相关链接（介绍和用法）：
[DeskDock - Share computer's mouse & keyboard with Android (+ Drag & Drop)](https://forum.xda-developers.com/android/apps-games/app-deskdock-missing-link-computer-t3447035)
[DeskDock Controls Your Android Device With Your Computer's Keyboard and Mouse](https://lifehacker.com/deskdock-controls-your-android-device-with-your-compute-1786425812)

# Vysor
这是一款chrome插件，但是它能做到真正的控制，首先是画面的同步、然后是操作的控制，还有截图、录像等功能，不过这是一款订阅收费的软件，免费版限制很多，不过即便如此免费版已经满足基本需求，满足文章开头的3。

使用vysor需要连接数据线，当然也可以不用数据线，通过无线adb连接。
![vysor-pc-ui](https://storage.blog.fliaping.com/2017/09/vysor-pc-ui.png)
![vysor-pc-android-view](https://storage.blog.fliaping.com/2017/09/vysor-pc-android-view.png)
![vysor-pc-android-settings](https://storage.blog.fliaping.com/2017/09/vysor-pc-android-settings.png)

# 其他内容
其实还有很多android透屏到电脑的软件，以后用到了再介绍。不过我目前还没发现满足需求5的软件，发现了再说。

对于键盘鼠标共享有个`Synergy`的软件蛮不错的，但是没有Android平台

## 无线adb
对于没有root的android设备，要想开启无线adb需要先用数据线连一次，通过adb命令开启网络adb功能后即可。

```bash
# 连接数据线，开启网络adb功能
adb tcpip 5555
# 断开数据线，连接手机
adb connect <device_ip_address>
# 检测是否连接成功
adb devices
```

[Android Debug Bridge (adb) | Android Studio](https://developer.android.com/studio/command-line/adb.html)