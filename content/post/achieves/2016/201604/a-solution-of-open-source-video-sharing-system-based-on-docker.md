+++
author = "Payne Xu"
categories = ["Developer"]
date = 2016-04-24T04:29:19Z
description = ""
draft = false
slug = "a-solution-of-open-source-video-sharing-system-based-on-docker"
tags = ["视频分享系统", "Docker"]
title = "基于Docker的开源视频分享系统解决方案"

+++

**序言**：
学校之前有个视频分享站点，用的是CC视频的系统，买的源码，后来服务器被黑掉了，存储服务器被格了，好几T的视频都没了，挺心疼人的。绊倒还是要站起来的，准备重新搭建视频系统，可是CC的系统已经太老了，对环境要求很苛刻，要求系统是redhat 5.4，php版本不能大于5.2，还有mysql也有特定要求，最重要的是所有的软件需要编译安装，视频转码那些软件不太好搞。之前搭建这个系统的师哥过来没搞定，把这个坑留给我，在准备跳下去的时候还是回来了，我感觉可能解决不了。于是转投其他系统，国内真心没啥好用的，都是CMS，是从各大视频网站抓链接，什么转码、截图都没有。CC视频也变成了纯粹的云服务了。国外有些很不错的，像Vimp，Melody，但免费版的功能有很多限制，也跳过坑，最后找到开源的clipbucket。

另外，本项目托管在 [mytube - github](https://github.com/fliaping/mytube) ，后续更新以此为准。

<!--more-->

# clipbucket概述

这个视频系统属于LAMP的技术栈的产品，主要是PHP代码构建的CMS系统，和利用PHP-CLI来执行bash命令调用转码软件。转码用到的软件有

* ffmpeg，大名鼎鼎的音视频软件，各种格式编解码、转码、录制、编辑等。
* flvtool2，因为ffmpeg对flv格式的视频支持不太好，所以需要这货
* imagemagick，看名字就知道这是处理图像用的，在这个系统中我们用它来获取视频截图。
* MP4Box(gpac)，转码的时候，ffmpeg先对视频解码，然后再编码成H264视频流和AAC音频流（具体格式可调）。HTML5默认支持MP4格式视频播放，所以还需要把音视频流打包成MP4文件，这个软件就干了这事。

# 安装Docker

## Docker概述

想了解Docker的可以去查下，这里是百科的概述

> Docker 是一个开源的应用容器引擎，让开发者可以打包他们的应用以及依赖包到一个可移植的容器中，然后发布到任何流行的 Linux 机器上，也可以实现虚拟化。容器是完全使用沙箱机制，相互之间不会有任何接口（类似 iPhone 的 app）。几乎没有性能开销,可以很容易地在机器和数据中心中运行。

你可以认为它是一个轻量级虚拟机。

这个视频分享系统是基于docker的ubuntu14.04的镜像，我为啥不用centos系列这个在服务器市场占主流的系统呢，主要是软件不好装，在两次失败的尝试后我还是选择了ubuntu，可能我以后主要还是用Debain系列，毕竟不是网维人员，用的系统简单顺手就好。


如果是docker熟练工，这节可以跳过。这里只提供ubuntu系统的安装方式

[Installation on Ubuntu - Docker Docs](https://docs.docker.com/engine/installation/linux/ubuntulinux/)

## 系统要求

Linux内核至少要是3.13以上，ubuntu 12.04以上的系统都支持。

## 更新Docker APT源

使用docker的源可以安装最新版，ubuntu的官方镜像源版本较低。

``` bash
sudo apt-get update

# docker APT 源用的是https连接，所以要确保https和CA证书软件可用
sudo apt-get install apt-transport-https ca-certificates

# 添加GPG Key
sudo apt-key adv --keyserver hkp://p80.pool.sks-keyservers.net:80 --recv-keys 58118E89F3A912897C070ADBF76221572C52609D

# 添加源
sudo vi /etc/apt/sources.list.d/docker.list
# i , On Ubuntu Trusty 14.04 (LTS)
deb https://apt.dockerproject.org/repo ubuntu-trusty main
# wq , 保存并退出

# On Ubuntu Precise 12.04 (LTS)
# deb https://apt.dockerproject.org/repo ubuntu-precise main
# On Ubuntu Wily 15.10
# deb https://apt.dockerproject.org/repo ubuntu-wily main
# Ubuntu Xenial 16.04 (LTS)
# deb https://apt.dockerproject.org/repo ubuntu-xenial main

# 更新软件源
sudo apt-get update

# 移除存在的老docker仓库
sudo apt-get purge lxc-docker

# 验证docker的新仓库生效
apt-cache policy docker-engine

```
## 安装前的准备
如果你的系统是ubuntu 12.04，并且内核版本低于3.13，需要更新内核，具体操作请看官方文档，链接前面给了。

```bash
sudo apt-get update

# 安装推荐的软件包
sudo apt-get install linux-image-extra-$(uname -r)

# 如果系统为Ubuntu 14.04 或者12.04，需要安装 apparmor
sudo apt-get install apparmor

```
## 开始安装

```bash
# 安装 docker
sudo apt-get install docker-engine

# 启动服务
sudo service docker start

# 验证安装成功，会打印出一些信息
sudo docker run hello-world
```
想深入学习docker的，建议看看官方安装文档，还有一些别的配置项

* [创建docker组](https://docs.docker.com/engine/installation/linux/ubuntulinux/#create-a-docker-group)
* [调整内存和交换空间的占用](https://docs.docker.com/engine/installation/linux/ubuntulinux/#adjust-memory-and-swap-accounting)
* [启用UFW转发](https://docs.docker.com/engine/installation/linux/ubuntulinux/#enable-ufw-forwarding)
* [配置docker的DNS服务器](https://docs.docker.com/engine/installation/linux/ubuntulinux/#configure-a-dns-server-for-use-by-docker)
* [配置docker在启动时运行](https://docs.docker.com/engine/installation/linux/ubuntulinux/#configure-docker-to-start-on-boot) 


# 当Clipbucket遇上Docker

终于到关键了，前面啰嗦了不少。

## 下载镜像
镜像大小为1.3G

国内下载点

```bash
# Daocloud下载点
docker pull daocloud.io/xuping/clipbucket:v1.0

# 灵雀云下载点
sudo docker pull index.alauda.cn/xuping/clipbucket:v1.0
```
国外下载点

```bash
# docker hub 下载点
sudo docker pull xuping/clipbucket:v1.0

```

查看下载下来的镜像

```bash
docker images
```

## 镜像相关信息

安装的软件：除了之前列的视频转码相关软件，还有apache2、MariaDB、php5、php5的一些插件

* root密码：123
* mysql root密码：123,关闭root远程登录
* clipbucket使用的数据库：clipbucket
* clipbucket管理员账户：admin:123
* apache默认目录： /var/www/html
* php.ini 配置如下：

```bash
upload_max_filesize = 1024M
max_execution_time = 7300
max_input_time = 3000
memory_limit = 512M
magic_quotes_gpc = on
magic_quotes_runtime = off
post_max_size = 1024M
output_buffering = off
display_errors = on
```


## 运行镜像

镜像就相当于是安装盘或者通常的ISO镜像文件，镜像是不可更改的，改了之后句不是原来的镜像了，例如windows有很多例如深度、雨林木风等Ghost镜像，这些都是对官方镜像安装之后，做了修改，通过Ghost程序克隆系统盘并重新打包的。这可以形象的类比到docker中，先有一个基础镜像，相当于win的官方镜像，我们在运行基础镜像并做了很多操作，相当于做了修改，通过commit提交为镜像，相当于用Ghost克隆系统盘。

了解了docker的基本原理之后，在来说下几个概念，

* 镜像，就是系统盘，上面解释过。
* 容器，运行镜像后产生，是镜像的一个实例。

**Note:** 容器并不具有持久化属性，可以很容易被停止、删除，所以需要挂载宿主机的目录到容器中。但如果你不删除容器，它会一直保持上次退出时的状态，直到再次运行。

终于到了说该咋用的时候了，因为我也是刚学的docker，构建出来的镜像各种不优雅，后面会进行改进，暂时用我这个uglily的方法。

```bash
docker run --restart=always -d -p 8081:80 -p 2222:22 -v /data:/data xuping/clipbucket:v1.0  /usr/bin/supervisord 
```
下面解释下参数的意义

* --restart=always 使容器随docker启动自动运行
* -d 以Detached模式运行容器
* -p 8081:80 -p 2222:22 端口映射，将容器的22端口映射到宿主机2222端口，80端口映射到8081端口
* -v /data:/data 挂载宿主机的 /data 目录到容器中的 /data 目录
* xuping/clipbucket:v1.0 是我镜像的名字
* /usr/bin/supervisord 容器启动时运行的程序，这是一个守护进程，确保该启动的软件都运行着，这由于docker的另外一个特性。

## 将数据文件存在宿主机中

前面说过，要持久化数据，最好将数据存在宿主机。下面的这些其实通过Dockerfile或者写在一个启动脚本中就可以的，但这个版本还没实现，后续版本更新会通过Dockerfile来进行。

```bash
# 因为已经挂载宿主机的/data目录到容器的/data目录，
# 所以可以认为当前/data目录就是主机的/data目录

# 数据库文件转移
cp -r /var/lib/mysql/clipbucket   /data
rm -r /var/lib/mysql/clipbucket/
ln -s /data/clipbucket/ /var/lib/mysql

# 视频文件转移
cp -r /var/www/html/files /data
rm -r /var/www/html/files
ln -s /data/files/ /var/www/html/
ls -l /var/www/html/files
```


## 宿主机nginx反向代理

如果宿主机可以开多个端口，或者这个应用就作为80口的应用，那直接映射就好了，但如果开放端口有限，或者80口上想放多个不同语言的web服务，那就需要一个代理了。

nginx的安装不多说，如果不配置https的话，ubuntu软件源中的版本就够用的，如果你需要https，最好安装nginx官方最新版。

```bash
# 我这里不需要https，安装低版本的就可以
sudo apt-get install nginx
```
主要是配置文件，好在基本的反向代理并不需要很复杂的配置
编辑 /etc/nginx/conf.d/vhost.conf,不存在则创建

添加一下配置

```
server
{
    listen 80;
    server_name v.rkshzu.cn;
    location / {
        proxy_redirect off;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_pass http://127.0.0.1:8081;
    }
    access_log /var/log/nginx/v.rkshzu.cn_access.log;
}
```
保存，重启nginx

```bash
sudo service nginx restart
```

至此，就可以通过v.rkshzu.cn访问到我们的服务，但是你会发现，什么鬼，图片、css、js全都加载不上，不要着急，因为clipbucket默认站点地址是我安装时访问的url，所以需要改过来。

```bash
# 在宿主机中用ssh登陆容器
ssh root@localhost -p 2222

# 登陆mysql
mysql -uroot -p
# 密码为 123

use clipbucket;

# 将http://v.rkshzu.cn替换成你的站点地址
update cb_config set value='http://v.rkshzu.cn' where name='baseurl'
```

这样我们就可以愉快的访问了。管理员账户：admin:123

## 修改密码

为了方便，默认的密码比较简单，在你部署好镜像之后一定要**修改密码**，需要修改的有系统的root密码，mysql的root密码。

```bash
# 修改系统root密码
passwd root

# 修改mysql的root密码
# 登陆mysql,默认密码123
mysql -uroot -p

mysql> use mysql;
mysql> update user set password=PASSWORD("你的密码") where User='root';
mysql> flush privileges;

```
修改clipbucket配置文件中的mysql密码

```bash
vi /var/www/html/includes/dbconnect.php

# 修改$DBPASS = '123';中的123为你的密码。
```

## 开机容器自启动
### docker自启动后自动启动容器

看标题就知道，先让docker启动，然后docker再启动容器。

一般Linux管理自启动用的是upstart和systemd，从15.04之后ubuntu使用的是systemd，centos系列7之后也是用的systemd。

```bash
# 对于ubuntu 14.04，啥都不用做，安装的时候已经配置了自启动

# 对于ubuntu 15.04，使用systemctl配置自启动
sudo systemctl enable docker
```
这样每次在宿主机启动的时候，docker软件都能自动启动，但是容器却并不能自启，需要运行容器时指定参数 --restart=always，如前面的启动命令所示。

关于restart参数的使用，请看 [Restart Policie](https://docs.docker.com/engine/reference/run/#restart-policies-restart)
### 容器通过自启动管理程序启动
这种方法首先要禁用docker自动启动容器

```bash
sudo sh -c "echo 'DOCKER_OPTS=\"-r=false\"' > /etc/default/docker"
```
如果是upstart启动，我们可以创建/etc/init/clipbucket.conf,内容如下

```bash
description "Clipbucket"
author "Payne.Xu"
start on filesystem and started docker
stop on runlevel [!2345]
respawn
script
  # Wait for docker to finish starting up first.
  FILE=/var/run/docker.sock
  while [ ! -e $FILE ] ; do
    inotifywait -t 2 -e create $(dirname $FILE)
  done
  /usr/bin/docker start -a [容器ID]
end script
```

如果是systemd启动,我们可以创建/usr/lib/systemd/system/clipbucket.serivce,内容如下

```bash
[Unit]
Description=Redis container
Author=Payne.Xu
After=docker.service

[Service]
Restart=always
ExecStart=/usr/bin/docker start -a [容器ID]
ExecStop=/usr/bin/docker stop -t 2 [容器ID]

[Install]
WantedBy=local.target
```
通过 ```systemctl enable clipbucket.service ``` 启用即可。


可参考官方文档 [Automatically start containers](https://docs.docker.com/engine/admin/host_integration/)

# 参考文章

1. [How to Setup ClipBucket to Start Video Sharing Website in Linux](http://linoxide.com/linux-how-to/setup-clipbucket-video-sharing-website-linux/)
2. [Install ClipBucket with Ubuntu 15.10](http://www.unixmen.com/install-clipbucket-ubuntu-15-10/)
3. [Installation on Ubuntu - Docker Docs](https://docs.docker.com/engine/installation/linux/ubuntulinux/)
4. [Automatically start containers](https://docs.docker.com/engine/admin/host_integration/)
5. [编写systemd下服务脚本](http://blog.csdn.net/fu_wayne/article/details/38018825)