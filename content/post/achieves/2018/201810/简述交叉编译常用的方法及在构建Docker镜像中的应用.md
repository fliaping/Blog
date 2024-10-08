---
title: "简述交叉编译常用的方法及在构建Docker镜像中的应用"
date: 2018-10-14T13:38:44+08:00
draft: false
categories: ["Developer"]
tags: ["docker","编译"]
slug: "introduce-the-method-and-application-of-cross-compilation"
author: "Payne Xu"
---

![CrossCompile](https://fliaping-blog.oss-rg-china-mainland.aliyuncs.com/storage/18-10-14/CrossCompile.png)

# 软件编译

众所周知，服务器大部分都是复杂指令集的x86平台，移动设备是精简指令集的ARM平台，还有IMB的PowerPC平台，之前家用路由器和一些嵌入式设备常用的MIPS平台。 不同平台的CPU的指令集（ISA，Instruction Set Architecture）是不同的，对于在其上运行的软件都要编译成对应的平台可识别的执行之后才可以运行。

<!--more-->

一个可执行文件的产生需要经过的步骤不尽相同，但都是要将编程语言翻译成CPU可识别的二进制指令。而编程语言主要有两种：编译型和解释型，其中编译型像`C/C++`,`Golang`等，都是在运行前编译，直接生成可执行文件。另外一种解释型语言如`Java`，`Python`，`PHP`， 是在运行时进行编译（运行前也可能编译，不过是中间码，例如Java），将编程语言或者中间码交给预先安装的解释器，由解释器来识别并转换成相应的机器指令并执行。其实不管是哪种类型，都是需要有可执行的（即CPU可识别的）二进制文件来运行于CPU之上。

对于使用解释型语言的开发者来说，基本上不谈编译，只有开发这个语言解释器（运行时）的人才会涉及到这个问题。但这个世界不可能只使用解释型语言，开发者一定会接触到一些编译型语言，尤其是在关注到性能，或者是资源受限的情况下。当然那些有极客精神，喜欢捣鼓的人来讲更是不可避免。（多说两句，虽说我称不上极客，但是还是有些捣鼓的精神的，在技术上从来不会觉得哪些事情做不到，仅仅是代价问题，解决方案不会局限于熟悉的领域，喜欢尝试其它可能的方向）

编译型语言生成可执行文件最重要的两步是编译和链接。

- 编译是将编程语言翻译为机器指令，当然这个过程有很多步骤，通常是先翻译成汇编语言，再由汇编转换成机器码。而汇编就是和CPU指令紧密相关的。
- 链接是分为静态链接和动态链接，静态链接就是要把程序依赖的外部库的二进制代码复制进可执行文件，而动态链接是指定依赖库的路径即可

上面两步中都是和CPU指令相关的，编译时要生成目标平台对应的二进制代码，链接要链接的是目标平台对应的库。那么我们需要在什么平台上运行，直接去这个平台上编译不就好了么？当然这样是可以的。

# 交叉编译

> 交叉编译: 简单地说，就是在一个平台上生成另一个平台上的可执行代码
>
> 为什么要这么做？  
> 答：有时是因为目的平台上不允许或不能够安装我们所需要的编译器，而我们又需要这个编译器的某些特征；有时是因为目的平台上的资源贫乏，无法运行我们所需要编译器；有时又是因为目的平台还没有建立，连操作系统都没有，根本谈不上运行什么编译器。

接着上面的问题，受限于目标平台的环境和性能，就产生了交叉编译。目前主要方式两种：通过虚拟机或者对编译器做文章

## 虚拟机实现

虚拟机是个好东西，能用软件模拟出不同平台的硬件环境，做到资源隔离和充分利用，缺点大家都知道，性能损耗。原因也是很简单的，虚拟机本质和解释型语言的解释器类似，做的都是即时翻译的工作，翻译当然要耗费性能，翻译的级别越低，性能耗费就更严重。当然有时候这个额外的消耗却很值。

### 优点

- 对于ARM和其它的嵌入式平台，性能往往都不如x86平台，我们通过虚拟机的方式在x86平台上进行编译就可以获得很高的编译速度。
- 最接近目标平台的环境，使得编译更容易通过，减少出错的可能

## 编译器实现

通过文章第一段的介绍，编译器的工作是将编程语言翻译为另外一种CPU能识别的语言，那么不同的CPU指令相当于是不同的方言，让编译器适配一下不同的方言不就好了么。例如将英语翻译为普通话，河南话，四川话。这就是用编译器实现交叉编译的方法。

但是要实现交叉编译需要一系列工具，包括C函数库，内核文件，编译器，链接器，调试器，二进制工具……， 这些称为交叉编译工具链。需要这么多东西的原因在于程序不仅仅是编译这么简单，还要链接依赖的其它的库文件，都是需要是针对特定平台的。由于目前并不在做相关领域的工作，交叉编译的环境也比较复杂，在此不再详述。另外有些别人做好的docker镜像，可以直接拉下来使用。

# 常见应用

## QEMU

![qemu](https://fliaping-blog.oss-rg-china-mainland.aliyuncs.com/storage/18-10-14/qemu.jpg)

>QEMU (short for Quick Emulator) is a free and open-source hosted hypervisor that performs hardware virtualization.
>
>QEMU is a hosted virtual machine monitor: it emulates the machine's processor through dynamic binary translation and provides a set of different hardware and device models for the machine, enabling it to run a variety of guest operating systems. It also can be used with KVM to run virtual machines at near-native speed (by taking advantage of hardware extensions such as IntelVT). QEMU can also do emulation for user-level processes, allowing applications compiled for one architecture to run on another.

QEMU是一个主机上的VMM（virtual machine monitor）,通过动态二进制转换来模拟CPU，并提供一系列的硬件模型，使guest os认为自己和硬件直接打交道，其实是同QEMU模拟出来的硬件打交道，QEMU再将这些指令翻译给真正硬件进行操作。

### 运行模式

QEMU提供多种运行模式：

1. User-mode emulation： 这种模式下QEMU上仅进运行一个linux或其他系统程序，由和主机不同的指令集来编译运行。这种模式一般用于交叉编译及交叉调试使用。

2. System emulation： 这种模式QEMU模拟一个完整的操作系统，包括外设。可用来实现一台物理主机模拟提供多个虚拟主机。QEMU也支持多种guest OS：Linux,windows,BSD等。支持多种指令集：x86,MIPS,ARMv8,PowerCP,SPARC,MicroBlaze等等。

3. KVM Hosting： 这种模式下QEMU处理包括KVM镜像的启停和移植，也涉及到硬件的模拟，guest的程序运行由KVM请求调用QEMU来实现。

4. Xen Hosting：这种模式下QEMU仅参与硬件模拟，guest的运行完全对QEMU不可见。

其中User-mode emulation就是用来做交叉编译用的。

### 实验及相关概念

用Go语言来做个实验，因为它原生支持不同平台可执行文件的编译，通过下面的代码片段可以看到，用go编译了linux-arm64的可执行文件，但是在x86_64的的机器上并不能执行，因为格式错误。

```bash
fliaping@June:~/temp$ GOOS=linux GOARCH=arm64 go build hello.go
fliaping@June:~/temp$ ls
hello  hello.go
fliaping@June:~/temp$ file hello
hello: ELF 64-bit LSB executable, ARM aarch64, version 1 (SYSV), statically linked, not stripped
fliaping@June:~/temp$ ./hello
-bash: ./hello: cannot execute binary file: Exec format error
```

上面的ELF即Executable and Linkable Format，简单说就是可执行文件、库文件，具体解释如下：

> In computing, the Executable and Linkable Format (ELF, formerly named Extensible Linking Format), is a common standard file format for executable files, object code, shared libraries, and core dumps.

下面的代码块中展示，通过`qemu-aarch64-static`来执行刚刚构建的arm64的可执行文件hello，居然就成功了。其实功劳在于qemu把文件中的指令进行了翻译，转换为x86认识的指令。

```bash
fliaping@June:~/temp$ ls
hello  hello.go  qemu-aarch64-static
fliaping@June:~/temp$ ./qemu-aarch64-static hello
Hello, 世界
```

每次运行前都要加一个命令挺烦的，那么有没有办法让linux直接执行其它架构可执行文件？当然有，那就是 **binfmt_misc**

> binfmt_misc is a capability of the Linux kernel which allows arbitrary executable file formats to be recognized and passed to certain user space applications, such as emulators and virtual machines. It is one of a number of binary format handlers in the kernel that are involved in preparing a user-space program to run.
> The executable formats are registered through the special purpose file system binfmt_misc file-system interface (usually mounted under part of /proc). This is either done directly by sending special sequences to the register procfs file or using a wrapper like Debian-based distributions binfmt-support package or systemd's systemd-binfmt.service.

上面那段话的大体意思就是说linux内核有个功能叫binfmt_misc，能够识别可执行文件格式，并传递给用户空间的应用，例如模拟器或虚拟机。它是内核中二进制文件处理程序之一，用于准备程序运行的用户空间。不同格式的可执行文件的处理程序通过专用文件系统binfmt_misc文件系统接口（通常安装在/proc目录下）注册。注册方式有：通过将特殊序列发送到寄存器 procfs文件、使用基于Debian的`binfmt-support`包、systemd的`systemd-binfmt.service`之类的服务或类库来完成。

注册的不同格式的处理器都安装在这个目录下 `/proc/sys/fs/binfmt_misc`，我们进去可以看到register和status文件，接着安装`qemu-user-static`和`binfmt-support`，并运行前面的hello程序。

```bash
# 安装
sudo apt update
sudo apt install -y qemu-user-static binfmt-support

# /proc/sys/fs/binfmt_misc目录
fliaping@June:/proc/sys/fs/binfmt_misc$ ls
python2.7  qemu-aarch64  qemu-arm    qemu-cris  qemu-microblaze  qemu-mips64    qemu-mipsel  qemu-ppc64       qemu-ppc64le  qemu-sh4    qemu-sparc        qemu-sparc64  status
python3.6  qemu-alpha    qemu-armeb  qemu-m68k  qemu-mips        qemu-mips64el  qemu-ppc     qemu-ppc64abi32  qemu-s390x    qemu-sh4eb  qemu-sparc32plus  register

# 再次执行上文的arm64可执行文件，成功运行
fliaping@June:~/temp$ ./hello
Hello, 世界
```

这时原理应该清楚了，kernel在处理可执行文件时通过`binfmt_misc`机制，找到了`qemu-aarch64`并连同`/usr/bin/qemu-aarch64-static`来执行arm64构架的可执行文件，进而翻译为x86的指令，于是程序可以跨平台运行咯。

# 构建不同平台的Docker镜像

因为docker的兴起，一些物联网平台也开始广泛应用，并从中获得隔离和系统无关的益处。例如[resin.io](https://resin.io/),[home assistant](https://www.home-assistant.io/blog/2018/07/11/hassio-images/)。而物联网设备最常的就是ARM架构的CPU，ARM架构又分为两种互不兼容的指令集，32位的arm(ARMv3 to ARMv7)和64位的aarch64(ARMv8)。当然也有其它架构的物联网设备，所以在制作docker镜像的时候需要兼容不同的CPU架构。

## ARM平台为例

知道上面的原理之后，docker镜像的构建就很容易理解了，因为docker本身隔离的就是一些文件，设备之类的东西，实质还是用的宿主机内核，在运行容器时`binfmt_misc`机制依然是起作用的，只要把qemu相关联的包放到容器中相应的位置就好了。例如下面的示例：

```Dockerfile
FROM aarch64/debian:stretch

COPY ./qemu-aarch64-static /usr/bin

RUN apt-get update && apt-get install nginx

EXPOSE 80
```

# 参考内容

1. [交叉编译 - 百科](https://baike.baidu.com/item/%E4%BA%A4%E5%8F%89%E7%BC%96%E8%AF%91)
2. [微处理器 - Wiki](https://zh.wikipedia.org/wiki/%E5%BE%AE%E5%A4%84%E7%90%86%E5%99%A8)
3. [编译器的工作过程](http://www.ruanyifeng.com/blog/2014/11/compiler.html)
4. [QEMU,KVM及QEMU-KVM介绍](https://www.jianshu.com/p/4e893b5bfe81)
5. [binfmt_misc](https://en.wikipedia.org/wiki/Binfmt_misc)
6. [Executable and Linkable Format](https://en.wikipedia.org/wiki/Executable_and_Linkable_Format)
7. [How to Build ARM Docker Images on Intel host](http://www.hotblackrobotics.com/en/blog/2018/01/22/docker-images-arm/)