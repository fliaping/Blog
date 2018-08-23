+++
author = "Payne Xu"
date = 2017-12-04T02:31:48Z
description = ""
draft = false
slug = "run-lede-on-a-fake-docker"
title = "利用容器技术在一个宿主机上运行LEDE(OpenWrt)"

+++

在阅读本文之前，可以先了解下另外一篇文章[容器核心技术详解](/container-core-technical-details)。

容器技术所用到的技术主要是Linux Namespace和cgroup，目前最成功的方案就是Docker，我们也来试着利用Linux kernel的 Namespace来简单实现docker的部分功能，这里称之为假Docker。

本文相关的代码在这里 [fake_docker](https://github.com/fliaping/docker_learning/tree/master/fake_docker)，文章中对于比较长的代码会省略，可以在代码仓库中查看。
<!--more-->

# 本文目标

实现在Ubuntu服务器上运行*路由器系统lede/openwrt*的包管理程序opkg，并进行软件安装、卸载操作。至于说路由器的其它功能，并没有实现，一个原因是需要的配置比较麻烦，我们的假Docker过于简单，不能满足要求，但是在另外一篇文章[在树莓派上用Docker运行LEDE(OpenWrt)](/run-lede-on-raspberry-pi-with-docker)会尝试运行一个可用的lede系统。

**启动一个LEDE Bash**
![lede-on-linux-server](https://o364p1r5a.qnssl.com/2017/10/lede-on-linux-server.png)

**用opkg安装软件**
![lede-opkg-install-curl-on-linux-server](https://o364p1r5a.qnssl.com/2017/10/lede-opkg-install-curl-on-linux-server.png)

# 如何做

在知道docker原理的前提下，要想实现本文的目标，步骤就比较清晰了。

1. 首先是找到lede系统的rootfs，也就是一个完整的lede系统的根目录结构和文件。
2. 接着通过Linux Namespace各种特性，启动一个隔离的子进程
3. 利用Network Namespace来为隔离子进程提供网络访问件。
4. 这个隔离的子进程运行lede系统中的bin文件opkg
5. 目的达成！！！

## 获取LEDE的rootfs

因为实验用的服务器是x86构架的CPU，所以我们选用的rootfs也该是x86，直接从lede仓库中就可以获得
[lede-17.01.2-x86-generic-generic-rootfs.tar.gz](https://downloads.lede-project.org/releases/17.01.2/targets/x86/generic/lede-17.01.2-x86-generic-generic-rootfs.tar.gz)

`tar xvf` 解压获得rootfs文件夹。另外github目录中已经存在[fake_docker/rootfs](https://github.com/fliaping/docker_learning/tree/master/fake_docker/rootfs)

## 编译代码并设置capability

编译代码并设置可执行文件的capability

```bash
gcc fake_docker.cpp -o fake_docker
# 安装cap相关的工具
sudo apt-get install libcap-dev
# 为文件设置setgid和setuid的能力
sudo setcap cap_setgid,cap_setuid+ep ./fake_docker
# 查看文件有哪些能力
getcap ./fake_docker

# 查看当前进程的能力
cat /proc/$$/status | egrep 'Cap(Inh|Prm|Eff)'
```

关于 Linux capability: 在使用user namespace时需要来做uid和did的映射，即将容器中的某个用户映射为宿主机的某个用户，因为容器中很多情况是需要root权限的，但是如果使用宿主机的root用户来执行，风险非常高，但是我们讲宿主机的普通用户应成为容器中的root用户，这样容器对容器内的所有操作有root权限，但是并不会对宿主产生超过普通用户权限的影响。

## 启动一个隔离的子进程

执行`./fake_docker`进入容器,可以看到相关输出信息，执行该命令的uid，gid都是500，容器中的都是0，大家知道uid=0意味着是root用户。

```bash
Parent: eUID = 500;  eGID = 500, UID=500, GID=500
Parent [13945] - start a container!
Parent [13945] - Container [13946]!
Parent [13945] - user/group mapping done!
Container [    1] - inside the container!
Container: eUID = 0;  eGID = 0, UID=0, GID=0
Container [    1] - setup hostname!
```

## 配置网络

1. 新开一个终端，处于宿主机环境下，执行代码中的脚本`sudo ./host_net.sh 13946`，脚本后的参数是容器进程在宿主机下真实pid。此时在宿主机新建了一个veth0的虚拟网卡并新建了一个peer的veth0.1,并将veth0.1按入容器的Namespace中。
   ![deepinscreenshot_select-area_20171204182053](https://o364p1r5a.qnssl.com/2017/12/deepinscreenshot_select-area_20171204182053.png)
2. 将代码中的inner_net.sh复制到rootfs文件夹
3. 返回已经进入容器的终端，执行`inner_net.sh`，这时初始化了按入容器的网卡veth0.1，并改为名字eth0。还有DNS服务器的配置，opkg的初始化。
   ![deepinscreenshot_select-area_20171204182304](https://o364p1r5a.qnssl.com/2017/12/deepinscreenshot_select-area_20171204182304.png)
4. 宿主机设置NAT网络转发，讲veth0通过宿主机的eth0转发出去。网络结构： 容器eth0 <---peer---> 宿主veth0 <---NAT Forward---> 宿主eth0 <---> internet

此时我们可以通过ping命令检查网络是否正常，然后 `opkg update & opkg install curl && curl www.baidu.com`

# 参考文章

1. [Docker基础技术-Linux Namespace](http://www.jianshu.com/p/353eb8d8eb05)
2. [DOCKER基础技术：LINUX NAMESPACE（下）](https://coolshell.cn/articles/17029.html)