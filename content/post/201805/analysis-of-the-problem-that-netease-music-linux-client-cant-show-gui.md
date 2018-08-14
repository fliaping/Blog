+++
author = "Payne Xu"
date = 2018-05-05T06:51:02Z
description = ""
draft = false
slug = "analysis-of-the-problem-that-netease-music-linux-client-cant-show-gui"
title = "网易云音乐Linux客户端GUI不能显示问题排查"

+++

![netease-music](https://o364p1r5a.qnssl.com/2018/05/deepinscreenshot_select-area_20180505224924.png)

OS: ubuntu 17.10,ubuntu 18.04
网易云音乐版本：netease-cloud-music_1.1.0_amd64_ubuntu.deb

## 症状
启动了页面弹不出来，命令行也一样，然后呢，点关机按钮，弹出来确认框，随后网易乐音乐页面也弹出来了，这时取消关机，可以正常使用云音乐。

并且录了屏：https://weibo.com/tv/v/FwZO3ltaM?fid=1034:1d480a191cbbcc940b81f619f0614a98

<!--more-->

## 问题分析

看现象，启动后GUI进程应该被阻塞，点了关机按钮，GUI正常出现。于是第一时间想到的应该是点关机按钮之后发出了某种消息，云音乐客户端在监听这个消息，收到消息后阻塞被打破，GUI正常执行。

观察发现在点关机键之后，WPS也会弹窗提醒你保存文档，那么这个信号一定是某种通用的信号，告知大家要关机的信号，第一时间想到是kill相关的信号，于是通过监听所有的kill信号来看看到底是哪个。

python代码如下：

```python
import sys
import time
import signal


def term_sig_handler(signum, frame):
    print('catched singal: %d' % signum)
    sys.exit()

if __name__ == '__main__':
    # catch term signal
    for i in list(signal.Signals):
        print(int(i))
        try:
            signal.signal(i, term_sig_handler)
        except Exception as e:
            print(e)

    while True:
        print('hello')
        time.sleep(3)
# signal 9和19是不能被程序捕获掉的，因为对于OS来说这些是强制关闭，告诉都不会告诉应用一下的
```

启动程序，这时在终端找到这个进程pid，发一个信号，例如 `kill -12 <pid>`
可以看到输出`catched singal: 12`，于是欣欣然取点关机按钮，并没有任何反应。于是想可能是某种其它类型的消息，但肯定和gnome的关机按钮有关的。因为对linux系统的了解主要在使用上，当时并没有想到dbus这个常用的模块

通过搜索发现一篇文章 https://ubuntuforums.org/showthread.php?t=2020630 ，是讨论电源按键事件和关机、重启、登出对话框的，于是看了相关的讨论，去找了按钮事件相关的代码，github项目[gnome-settings-daemon](https://github.com/GNOME/gnome-settings-daemon),在文件[gnome-settings-daemon/plugins/media-keys/gsd-media-keys-manager.c](https://github.com/GNOME/gnome-settings-daemon/blob/gnome-3-28/plugins/media-keys/gsd-media-keys-manager.c) 中找到对于power_key的处理

```c
        case POWER_KEY:
                do_config_power_button_action (manager, power_action_noninteractive);
```

这时推荐大家一个github插件`insight.io`能在浏览器上查看代码，查看方法，变量的引用，像在IDE中一样。
<script type="text/javascript" src="https://insight.io/snippet/1c3aebc2f4b18c6d38552197bd6cb589.js"></script>

## 结语
通过这个可以追溯点了关机按钮后发生的事情，确实是往dbus发了消息。本来想着通过在网易云音乐启动的时候触发一下关机消息，再取消这个操作（点了关机按钮默认会等60秒关机，当然点取消就好了），但是由于对c代码不熟悉，这个愿望也比较难以实现，不过对问题的探索也是一种学习吧。

