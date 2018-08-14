+++
author = "Payne Xu"
categories = ["Docker"]
date = 2017-10-08T05:56:11Z
description = ""
draft = false
slug = "container-core-technical-details"
tags = ["Docker"]
title = "容器核心技术详解"

+++

最近看了docker用到的技术，于是在公司分享了一下，对于Linux内核比较关心的同学肯定早就知道这些知识了，但是我一直对内核不怎么了解，这些对我来说算是新知识，寻思着后面看看内核相关的书。
# Linux Namespace
> a feature of the Linux kernel that isolate and virtualize system resources of a collection of processes.
> 注：linux kernel的一个特性，可以隔离并且虚拟化一组进程的系统资源。


|名称|宏定义|隔离内容|发布版本|
|---|---|---|---|
|IPC|CLONE_NEWIPC|System V IPC, POSIX message queues|since Linux 2.6.19|
|Network|CLONE_NEWNET|network device interfaces, IPv4 and IPv6 protocol stacks, IP routing tables, firewall rules, the /proc/net and /sys/class/net directory trees, sockets, etc|since Linux 2.6.24|
|Mount|CLONE_NEWNS|Mount points|since Linux 2.4.19|
|PID|CLONE_NEWPID|Process IDs|since Linux 2.6.24|
|User|CLONE_NEWUSER|User and group IDs|started in Linux 2.6.23 and completed in Linux 3.8|
|UTS|CLONE_NEWUTS|Hostname and NIS domain name|since Linux 2.6.19|

<!--more-->

## 实验
我将程序放在github上[fake_docker](https://github.com/fliaping/docker_learning/tree/master/fake_docker)，这里不再贴出代码，可以把代码下载下来自己玩一玩。

## UTS(Unix Time-sharing System)
> UTS namespaces allow a single system to appear to have different host and domain names to different processes.
> 注：允许在一个系统中的不同进程中可以出现不同的主机名和域名

到源码的fake_docker目录，编译该程序`gcc uts.cpp -o uts`，运行程序`sudo ./uts`，可以看到主机名发生了改变。

## IPC (Inter-Process Communication)
> IPC namespaces isolate processes from SysV style inter-process communication.
> 注：隔离SysV风格的进程间通讯

首先创建一个IPC的队列，可以看到这个msqid为0的队列

```bash
June@Payne:~/fake$ ipcmk -Q
Message queue id: 0
June@Payne:~/fake$ ipcs -q

------ Message Queues --------
key        msqid      owner      perms      used-bytes   messages    
0xa201b648 0          June       644        0            0    
```
同样编译ipc.cpp并运行，可以看到IPC中没有队列了

```bash
June@Payne:~/fake$ ./ipc 
Parent - start a container!
Parent - container stopped!
June@Payne:~/fake$ sudo ./ipc 
[sudo] password for June: 
Parent - start a container!
Container - inside the container!
root@container:~/fake# ipcs -q

------ Message Queues --------
key        msqid      owner      perms      used-bytes   messages 
```

## PID (Process ID)
> The PID namespace provides processes with an independent set of process IDs (PIDs) from other namespaces.
> 注：提供给进程独立于其它命名空间的PIDs集合

编译运行pid.cpp

```bash
June@Payne:~/fake$ sudo ./pid 
Parent [19487] - start a container!
Container [    1] - inside the container!
```

## Mount
> Mount namespaces control mount points. Upon creation the mounts from the current mount namespace are copied to the new namespace, but mount points created afterwards do not propagate between namespaces (using shared subtrees, it is possible to propagate mount points between namespaces).
> 注：控制挂载点，将当前的挂载信息拷贝到新的namespace中，但在次之后的挂载点不在不同的namespace中传播，除非是用到了shared sybtrees

通过`ls /proc`可以看到有很多文件和文件夹，以及数字名称的文件夹，那是对应进程号的进程的一些信息。
编译运行mount.cpp，再次列出/proc，可以看到少了好多内容，数字文件夹也只有两个。数字文件夹是对应进程的一些运行时文件，说明当前环境有两个在运行的进程，其中一个是进入容器时运行的终端 bash的进程号，另一个是`ls /proc`命令的进程号。

## User (User ID)
> User namespaces are a feature to provide both privilege isolation and user identification segregation across multiple sets of processes.
> 注： 跨进程集合的权限和用户身份隔离

当clone进程时使用了CLONE_NEWUSER参数，我们在容器中看到UID和GID已经与宿主机不同了，默认显示为65534。那是因为容器找不到其真正的UID所以，设置上了最大的UID（其设置定义在/proc/sys/kernel/overflowuid）。

要把容器中的uid和真实系统的uid给映射在一起，需要修改 `/proc/<pid>/uid_map` 和 `/proc/<pid>/gid_map` 这两个文件。这两个文件的格式为：

`ID-inside-ns ID-outside-ns length`

其中：

* 第一个字段ID-inside-ns表示在容器显示的UID或GID，
* 第二个字段ID-outside-ns表示容器外映射的真实的UID或GID。
* 第三个字段表示映射的范围，一般填1，表示一一对应。

比如，把真实的uid=1000映射成容器内的uid=0
`0       1000          1`

再比如下面的示例：表示把namespace内部从0开始的uid映射到外部从0开始的uid，其最大范围是无符号32位整形
`  0          0          4294967295`

另外，需要注意的是：
* 写这两个文件的进程需要这个namespace中的CAP_SETUID (CAP_SETGID)权限（可参看Capabilities）
* 写入的进程必须是此user namespace的父或子的user namespace进程。
* 另外需要满如下条件之一：1）父进程将effective uid/gid映射到子进程的user namespace中，2）父进程如果有CAP_SETUID/CAP_SETGID权限，那么它将可以映射到父进程中的任一uid/gid。

可以在代码fake_docker.cpp中看到相关用法，此外该文中有详细的用法[利用容器技术在一个宿主机上运行LEDE(OpenWrt)](/run-lede-on-a-fake-docker)

## Network
> Network namespaces virtualize the network stack. Each namespace will have a private set of IP addresses, its own routing table, socket listing, connection tracking table, firewall, and other network-related resources.
> 注：虚拟化网络栈，每个namespace会有自己私有的ip地址、路由表、socket清单、连接追踪表、防火墙以及别的网络相关的资源

网络相关的namespace，ip命令已经有很好的支持了，代码中的host_net.sh脚本实现如下功能

* 这个脚本可以带一个参数，参数是container在宿主机上的pid。
* 带参数时，将会创建一个虚拟网卡以及peer网卡，并把peer网卡归属到容器的namespace中
* 不带参数时，配置了NAT网络转发

详细的用法[利用容器技术在一个宿主机上运行LEDE(OpenWrt)](/run-lede-on-a-fake-docker)
# cgroup（Control Group）
* Resource limitation: 限制资源使用，比如内存使用上限以及文件系统的缓存限制。
* Prioritization: 优先级控制，比如：CPU利用和磁盘IO吞吐。
* Accounting: 一些审计或一些统计，主要目的是为了计费。
* Control: 挂起进程，恢复执行进程。

Linux把CGroup实现成了一个file system，通过mount来激活一个控制组, 如下通过mount命令显示类型为cgroup的mount point。

```bash
June@Payne:~/fake$ mount -t cgroup
cgroup on /sys/fs/cgroup/systemd type cgroup (rw,nosuid,nodev,noexec,relatime,xattr,release_agent=/lib/systemd/systemd-cgroups-agent,name=systemd)
cgroup on /sys/fs/cgroup/cpu,cpuacct type cgroup (rw,nosuid,nodev,noexec,relatime,cpu,cpuacct)
cgroup on /sys/fs/cgroup/net_cls,net_prio type cgroup (rw,nosuid,nodev,noexec,relatime,net_cls,net_prio)

...
```
或者使用lssubsys命令，如果没有的需要安装相应的软件包`sudo apt install cgroup-tools`

```bash
June@Payne:~$ lssubsys -m
cpuset /sys/fs/cgroup/cpuset
cpu,cpuacct /sys/fs/cgroup/cpu,cpuacct
blkio /sys/fs/cgroup/blkio

...
```
列出`/sys/fs/cgroup`目录我们可以看到很多目录，每个目录表示一种资源。

```bash
June@Payne:~$ ls /sys/fs/cgroup/
blkio  cgmanager  cpu  cpuacct  cpu,cpuacct  cpuset  devices  freezer  hugetlb  memory  net_cls  net_cls,net_prio  net_prio  perf_event  pids  systemd
```

## 实验
以下代码deadloop.cpp是一个死循环，我们用gcc编译并运行。

```c++
#include <sys/types.h>
#include <unistd.h>

int main(void)
{
    printf("PID [%5d] \n", getpid());
    int i = 0;
    for(;;) i++;
    return 0;
}
```
毫无疑问，cpu一定会飙到100%，接下来我们就用cgroup来控制这个程序的cpu占用率。

```bash
  PID USER      PR  NI    VIRT    RES    SHR S %CPU %MEM     TIME+ COMMAND  
13420 June      20   0    4360    656    580 R 98.7  0.1   0:34.26 deadloop 
```

转到`/sys/fs/cgroup/cpu`，可以看到像`cpu.stat`、`cpu.stat`这样的文件，然后创建一个目录`sudo mkdir xp`，进入xp目录，发现已经有了和上层目录同样的文件，这个xp目录就相当于是一个控制组的配置目录，我们把该组的cpu占用限制一下。

```bash
June@Payne:/sys/fs/cgroup/cpu/xp$ cat cpu.cfs_quota_us 
-1
June@Payne:/sys/fs/cgroup/cpu/xp$ sudo sh -c "echo 20000 >  cpu.cfs_quota_us"
```

然后将deadloop的pid加到tasks文件中
```bash
June@Payne:/sys/fs/cgroup/cpu/xp$ sudo sh -c "echo 13420 >  tasks"

June@Payne:/sys/fs/cgroup/cpu/xp$ top -p 13420

  PID USER      PR  NI    VIRT    RES    SHR S %CPU %MEM     TIME+ COMMAND  
13420 June      20   0    4360    656    580 R 20.3  0.1   3:03.35 deadloop 
```

cgroup能够实现资源的层级管理，例如直接在xp目录下建一个test，test目录会继承xp目录中已有的属性。

要把进程移出控制组，把 pid 写入到根 cgroup 的 tasks 文件即可。因为每个进程都属于且只属于一个 cgroup，加入到新的 cgroup 后，原有关系也就解除了。要删除一个 cgroup，可以用 rmdir 删除相应目录。不过在删除前，必须先让其中的进程全部退出，对应子系统的资源都已经释放，否则是无法删除的。当然如果有子控制组，需要先将其删除之后才能删除父控制组。

关于cgroup的内容比较多，这里不是主要讲这个的，大概理解cgroup是干什么的就可以，docker用run命令启动一个容器的时候，通过后面带的参数来限制资源，当然内部就是用的cgroup的功能。


## 概念解析
* 任务（Tasks）：就是系统的一个进程。
* 控制组（Control Group）：一组按照某种标准划分的进程，比如官方文档中的Professor和Student，或是WWW和System之类的，其表示了某进程组。Cgroups中的资源控制都是以控制组为单位实现。一个进程可以加入到某个控制组。而资源的限制是定义在这个组上，就像上面示例中我用的xp目录一样。简单点说，cgroup的呈现就是一个目录带一系列的可配置文件。
* 层级（Hierarchy）：控制组可以组织成hierarchical的形式，既一颗控制组的树（目录结构）。控制组树上的子节点继承父结点的属性。简单点说，hierarchy就是在一个或多个子系统上的cgroups目录树。
* 子系统（Subsystem）：一个子系统就是一个资源控制器，比如CPU子系统就是控制CPU时间分配的一个控制器。子系统必须附加到一个层级上才能起作用，一个子系统附加到某个层级以后，这个层级上的所有控制族群都受到这个子系统的控制。Cgroup的子系统可以有很多，也在不断增加中。

# UnionFS
目的：把不同物理位置的目录合并mount到同一个目录中
## 原理说明
### 写时复制（CoW）
所有驱动都用到的技术——写时复制（CoW）。CoW就是copy-on-write，表示只在需要写时才去复制，这个是针对已有文件的修改场景。比如基于一个image启动多个Container，如果为每个Container都去分配一个image一样的文件系统，那么将会占用大量的磁盘空间。而CoW技术可以让所有的容器共享image的文件系统，所有数据都从image中读取，只有当要对文件进行写操作时，才从image里把要写的文件复制到自己的文件系统进行修改。所以无论有多少个容器共享同一个image，所做的写操作都是对从image中复制到自己的文件系统中的复本上进行，并不会修改image的源文件，且多个容器操作同一个文件，会在每个容器的文件系统里生成一个复本，每个容器修改的都是自己的复本，相互隔离，相互不影响。使用CoW可以有效的提高磁盘的利用率。

### 用时分配（allocate-on-demand）
而写时分配是用在原本没有这个文件的场景，只有在要新写入一个文件时才分配空间，这样可以提高存储资源的利用率。比如启动一个容器，并不会为这个容器预分配一些磁盘空间，而是当有新文件写入时，才按需分配新空间。

## Docker用到的实现

### AUFS (Advance UnionFS)
Linus不同意并入kernel，但ubuntu、debian、gentoo支持
![docker-aufs-layer](https://o364p1r5a.qnssl.com/2017/10/docker-aufs-layer.png)
![aufs-merge](https://o364p1r5a.qnssl.com/2017/10/aufs-merge.png)

AUFS（AnotherUnionFS）是一种Union FS，是文件级的存储驱动。AUFS能透明覆盖一或多个现有文件系统的层状文件系统，把多层合并成文件系统的单层表示。简单来说就是支持将不同目录挂载到同一个虚拟文件系统下的文件系统。这种文件系统可以一层一层地叠加修改文件。无论底下有多少层都是只读的，只有最上层的文件系统是可写的。当需要修改一个文件时，AUFS创建该文件的一个副本，使用CoW将文件从只读层复制到可写层进行修改，结果也保存在可写层。在Docker中，底下的只读层就是image，可写层就是Container。结构如下图所示：
![aufs-layer](https://o364p1r5a.qnssl.com/2017/10/aufs-layer.png)
### btrfs
Btrfs被称为下一代写时复制文件系统，并入Linux内核，也是文件级级存储，但可以像Device mapper一直接操作底层设备。Btrfs把文件系统的一部分配置为一个完整的子文件系统，称之为subvolume 。那么采用 subvolume，一个大的文件系统可以被划分为多个子文件系统，这些子文件系统共享底层的设备空间，在需要磁盘空间时便从底层设备中分配，类似应用程序调用 malloc()分配内存一样。为了灵活利用设备空间，Btrfs 将磁盘空间划分为多个chunk 。每个chunk可以使用不同的磁盘空间分配策略。比如某些chunk只存放metadata，某些chunk只存放数据。这种模型有很多优点，比如Btrfs支持动态添加设备。用户在系统中增加新的磁盘之后，可以使用Btrfs的命令将该设备添加到文件系统中。Btrfs把一个大的文件系统当成一个资源池，配置成多个完整的子文件系统，还可以往资源池里加新的子文件系统，而基础镜像则是子文件系统的快照，每个子镜像和容器都有自己的快照，这些快照则都是subvolume的快照。
![btrfs](https://o364p1r5a.qnssl.com/2017/10/btrfs.png)

### device mapper
Device mapper是Linux内核2.6.9后支持的，提供的一种从逻辑设备到物理设备的映射框架机制，在该机制下，用户可以很方便的根据自己的需要制定实现存储资源的管理策略。前面讲的AUFS和OverlayFS都是文件级存储，而Device mapper是块级存储，所有的操作都是直接对块进行操作，而不是文件。Device mapper驱动会先在块设备上创建一个资源池，然后在资源池上创建一个带有文件系统的基本设备，所有镜像都是这个基本设备的快照，而容器则是镜像的快照。所以在容器里看到文件系统是资源池上基本设备的文件系统的快照，并不有为容器分配空间。当要写入一个新文件时，在容器的镜像内为其分配新的块并写入数据，这个叫用时分配。当要修改已有文件时，再使用CoW为容器快照分配块空间，将要修改的数据复制到在容器快照中新的块里再进行修改。Device mapper 驱动默认会创建一个100G的文件包含镜像和容器。每一个容器被限制在10G大小的卷内，可以自己配置调整。结构如下图所示：
![device-mapper](https://o364p1r5a.qnssl.com/2017/10/device-mapper.png)
### overlay
Overlay是Linux内核3.18后支持的，也是一种Union FS，和AUFS的多层不同的是Overlay只有两层：一个upper文件系统和一个lower文件系统，分别代表Docker的镜像层和容器层。当需要修改一个文件时，使用CoW将文件从只读的lower复制到可写的upper进行修改，结果也保存在upper层。在Docker中，底下的只读层就是image，可写层就是Container。结构如下图所示：
![overlay](https://o364p1r5a.qnssl.com/2017/10/overlay.png)
当写入一个新文件时，为在容器的快照里为其分配一个新的数据块，文件写在这个空间里，这个叫用时分配。而当要修改已有文件时，使用CoW复制分配一个新的原始数据和快照，在这个新分配的空间变更数据，变结束再更新相关的数据结构指向新子文件系统和快照，原来的原始数据和快照没有指针指向，被覆盖。
### ZFS
ZFS 文件系统是一个革命性的全新的文件系统，它从根本上改变了文件系统的管理方式，ZFS 完全抛弃了“卷管理”，不再创建虚拟的卷，而是把所有设备集中到一个存储池中来进行管理，用“存储池”的概念来管理物理存储空间。过去，文件系统都是构建在物理设备之上的。为了管理这些物理设备，并为数据提供冗余，“卷管理”的概念提供了一个单设备的映像。而ZFS创建在虚拟的，被称为“zpools”的存储池之上。每个存储池由若干虚拟设备（virtual devices，vdevs）组成。这些虚拟设备可以是原始磁盘，也可能是一个RAID1镜像设备，或是非标准RAID等级的多磁盘组。于是zpool上的文件系统可以使用这些虚拟设备的总存储容量。
![zfs-pool](https://o364p1r5a.qnssl.com/2017/10/zfs-pool.png)
下面看一下在Docker里ZFS的使用。首先从zpool里分配一个ZFS文件系统给镜像的基础层，而其他镜像层则是这个ZFS文件系统快照的克隆，快照是只读的，而克隆是可写的，当容器启动时则在镜像的最顶层生成一个可写层。如下图所示：
![zsh-container](https://o364p1r5a.qnssl.com/2017/10/zsh-container.png)
当要写一个新文件时，使用按需分配，一个新的数据快从zpool里生成，新的数据写入这个块，而这个新空间存于容器（ZFS的克隆）里。
当要修改一个已存在的文件时，使用写时复制，分配一个新空间并把原始数据复制到新空间完成修改。

# 参考内容
[DOCKER基础技术：LINUX CGROUP](https://coolshell.cn/articles/17049.html)
[DOCKER基础技术：LINUX NAMESPACE（上）](https://coolshell.cn/articles/17010.html)
[DOCKER基础技术：LINUX NAMESPACE（下）](https://coolshell.cn/articles/17029.html)
[DOCKER基础技术：AUFS](https://coolshell.cn/articles/17061.html)
[linux cgroups 概述](http://xiezhenye.com/2013/10/linux-cgroups-%E6%A6%82%E8%BF%B0.html)
[Docker基础技术-Linux Namespace](https://juejin.im/entry/59a4ec306fb9a024903ab48a)
[docker 容器基础技术：linux namespace 简介](http://cizixs.com/2017/08/29/linux-namespace)
[Docker五种存储驱动原理及应用场景和性能测试对比](http://dockone.io/article/1513)



