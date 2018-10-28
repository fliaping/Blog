+++
author = "Payne Xu"
categories = ["Developer"]
date = 2016-02-25T10:48:43Z
description = ""
draft = false
slug = "the-method-to-create-link-for-directory"
tags = ["android"]
title = "Android文件夹链接方法(ln不能用)"

+++




在android中，当用ln命令来建立文件夹软连接的时候，出现以下错误

``` 
"link failed Function not implemented"
```
xda论坛一位解释了[原因](http://forum.xda-developers.com/showthread.php?t=1122710#2)

>symlinks (ln -s) doesn't work because /sdcard is fat32. It doesn't support symlink. You can indeed mount the external_sd underneat /sdcard, but as you say, it's lost after reboot. You have to do it everytime you boot.

<!--more-->

就是说android的sdcard目录所在的是fat32文件系统不支持链接，但** 可以用mount来挂载外置存储卡到sdcard目录下 **

``` bash
mount -o bind /storage/sdcard1/ /sdcard/sdcard1
```
#### Notice： 以下方法开机自启动有问题，还是做成apk好了

于是我们还可以在自启动脚本中加入这条指令。
linux中开机自启动脚本一般是放在init.d目录中，然后在rc*.d目录中

android 开机启动脚本/init.rc是在ramdisk.img中的，每次开机启动会解出来。

所以直接修改/init.rc是行不通的，修改后，重启就恢复了。
但是/init.rc里面调用了/system/etc/install-recovery.sh
可以修改/system/etc/install-recovery.sh，来执行启动脚本


上面那个所以可以在这个文件中加入挂载命令就行了，但是你会发现你改不了这个文件，因为开机的时候/system分区是挂载的只读，所以需要重新挂载下就OK了。

``` bash
mount -o rw,remount -t yaffs2 /dev/block/mtdblock3 /system
```

但是在install-recovery.sh文件中可以看到下面这些代码

```
# Some apps like to run stuff from this script as well, that will
# obviously break root - in your code, just search this file
# for "install-recovery-2.sh", and if present, write there instead.

/system/etc/install-recovery-2.sh
```
意思很明显，想让放到单独的文件中，那就按他说的做吧（我是MIUI7系统，别的系统可能不一样，视具体情况而定）。

以下是完整代码(要连接shell，并且有root权限)：

```
mount -o rw,remount -t yaffs2 /dev/block/mtdblock3 /system
vi /system/etc/install-recorvery-2.sh
```
添加

```
sleep 99   
mount -o bind /storage/sdcard1/ /sdcard/sdcard1

```




