+++
author = "Payne Xu"
date = 2017-08-10T18:41:46Z
categories = ["酷cool玩"]
tags = ["vps"]
draft = false
slug = "re-move-back-to-alibaba-cloud-for-my-vps"
title = "重新迁回阿里云"

+++

# 历史
细细数来，最开始在大学开始买了阿里云9.9的学生机，后来毕业之后就没有这优惠了，用了好几个月的45元的阿里云。然后有了个读研的GF，准备来个学生认证继续用阿里云，可惜认证没通过，不过在腾讯云认证通过了，就转移到腾讯云。可最近腾讯云要求域名备案，http的链接都已经被拦掉了，https依然可以，但毕竟不友好。我的域名在阿里云备过，还要重复再备一次，好麻烦，于是思索看阿里云能用不，所幸阿里云学生认证可以通过支付宝获取数据，于是又转回阿里云。
<!--more-->
# ECS系统
* CentOS 7
* RAM 2G
* CPU 1 core
# 更新内核并开启tcp bbr
## 要在 CentOS 7 上启用 ELRepo 仓库
```bash
rpm --import https://www.elrepo.org/RPM-GPG-KEY-elrepo.org
rpm -Uvh http://www.elrepo.org/elrepo-release-7.0-2.el7.elrepo.noarch.rpm
```
![rpm_add_kernel_source](https://storage.blog.fliaping.com/2017/08/rpm_add_kernel_source.png)
## 在 CentOS 7 启用 ELRepo
```bash
yum --disablerepo="*" --enablerepo="elrepo-kernel" list available
```
![yum_list_avaliable_kernel](https://storage.blog.fliaping.com/2017/08/yum_list_avaliable_kernel.png)

## 安装主线稳定内核
```bash
yum --enablerepo=elrepo-kernel install kernel-ml
```
![yum_install_kernel_ml](https://storage.blog.fliaping.com/2017/08/yum_install_kernel_ml.png)
## 将新内核作为第一启动项
```bash
grub2-set-default 0
```
## 开启TCP bbr
```bash
echo "net.core.default_qdisc=fq" >> /etc/sysctl.conf
echo "net.ipv4.tcp_congestion_control=bbr" >> /etc/sysctl.conf
```
## 验证
重启之后`uname -r` 可以看到内核升级了

```bash
# 查看可用的拥塞控制算法
sysctl net.ipv4.tcp_available_congestion_control
# 查看当前启用的拥塞控制算法
sysctl net.ipv4.tcp_congestion_control
# 查看 tcp_bbr 模块是否加载
lsmod | grep tcp_bbr
```
![check_tcp_bbr_open](https://storage.blog.fliaping.com/2017/08/check_tcp_bbr_open.png)

# 安装Docker
docker目前分为CE（Community Edition）和EE（Enterprise Edition），我们自己用，CE就可以。
详细步骤可查看官方文档：https://docs.docker.com/engine/installation/linux/docker-ce/centos/#install-docker-ce

docke安装之后，普通用户没有权限执行
1. `sudo cat /etc/group | grep docker`
2. 如果不存在docker组，可以添加`sudo groupadd docker`
3. 添加当前用户到docker组，`sudo gpasswd -a ${USER} docker`
4. 重启docker服务,`sudo systemctl restart docker`
5. 如果权限不够，即出现以下错误
```
Got permission denied while trying to connect to the Docker daemon socket at unix:///var/run/docker.sock: Get http://%2Fvar%2Frun%2Fdocker.sock/v1.34/containers/json: dial unix /var/run/docker.sock: connect: permission denied
```
可以通过给sock文件赋予读写权限解决问题 `sudo chmod a+rw /var/run/docker.sock`

关于docker的用法会有另外一篇文章：[Docker使用初探](/a-preliminary-study-of-using-docker)。

