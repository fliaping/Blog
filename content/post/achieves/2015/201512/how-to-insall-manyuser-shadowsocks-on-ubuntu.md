+++
author = "Payne Xu"
categories = ["Developer"]
date = 2015-12-24T17:53:24Z
description = ""
draft = false
slug = "how-to-insall-manyuser-shadowsocks-on-ubuntu"
tags = ["shadowsocks", "gfw"]
title = "在ubuntu下安装shadowsocks多用户版"

+++



###环境说明
系统：AWS ubuntu 14.04 x64
##安装shadowsocks支持
1.首先更新软件源

```bash
apt-get update
```
2.安装Python

```bash
apt-get install python-pip python-m2crypto 
pip install cymysql
```
<!--more-->
##安装LNMP
```bash
wget -c http://soft.vpser.net/lnmp/lnmp1.2-full.tar.gz && tar zxf lnmp1.2-full.tar.gz && cd lnmp1.2-full && ./install.sh lnmp
```


##后端安装配置
1.安装

```bash
git clone -b manyuser https://github.com/mengskysama/shadowsocks.git  
cd ./shadowsocks/shadowsocks  
vim Config.py      
#Config      
MYSQL_HOST = 'localhost' #这一行是服务器IP，127.0.0.1表示本机      
MYSQL_PORT = 3306 #数据库端口号      
MYSQL_USER = 'ss' #数据库用户名      
MYSQL_PASS = 'ss' #数据库密码      
MYSQL_DB = 'shadowsocks' #数据库名称  
      
MANAGE_PASS = 'ss233333333'      
 #if you want manage in other server you should set this value to global ip      
MANAGE_BIND_IP = '127.0.0.1'      
 #make sure this port is idle      
MANAGE_PORT = 23333
```
2.数据库配置  

2.1 新建ss用户，用来操作shadowsocks这个数据库

```bash
//登录MYSQL
@>mysql -u root -p
@>密码
//创建用户
mysql> insert into mysql.user(Host,User,Password) values("localhost","ss",password("ss"));
//刷新系统权限表
mysql>flush privileges;
```

2.2 新建shadowsocks数据库

```
//登录MYSQL（有ROOT权限）。我里我以ROOT身份登录.
@>mysql -u root -p
@>密码
//首先为用户创建一个数据库(shadowsocks)
mysql>create database shadowsocks;
//授权phplamp用户拥有phplamp数据库的所有权限。
>grant all privileges on shadowsocks.* to ss@localhost identified by 'ss';
//刷新系统权限表
mysql>flush privileges;
```
2.3 导入sql脚本

```bash
mysql> use shadowsocks;
mysql> source shadowsocks.sql;
mysql> show tables;  #查看表
mysql> show columns from user;  #查看表结构
```

4、安装supervisor进程守护

这样可以不用长时间开启SSH连接，即使断开SSH后端也会继续运行下去，亦可用screen来运行。

```bash
apt-get install python-pip python-m2crypto supervisor
```

在目录/etc/supervisor/conf.d/下， 新建一个文件，名字：shadowsocks.conf
在shadowsocks.conf文件里编辑添加：

```
[program:shadowsocks]
command=python /root/shadowsocks/shadowsocks/server.py -c /root/shadowsocks/shadowsocks/config.json #/此处目录请自行修改
autorestart=true
user=root
```
修改以下文件
/etc/profile
/etc/default/supervisor
在文件结尾处添加以下3行内容

```
ulimit -n 51200
ulimit -Sn 4096
ulimit -Hn 8192
```
启动supervisor
```
service supervisor start #启动
supervisorctl reload #重载
```

debug查看连接日志等

```
supervisorctl tail -f shadowsocks stderr #Ctrl+C 取消查看
supervisorctl status  #获得所有程序状态
supervisorctl stop spider  #关闭目标程序
supervisorctl start spider   #启动目标程序
supervisorctl shutdown    #关闭所有程序
```
开机supervisord自启动

编辑文件：vi /etc/rc.local  
在末尾另起一行添加supervisord，保存退出
##安装前端程序
安装sspanel：  
git项目地址：https://github.com/orvice/ss-panel  
中文安装文档：https://github.com/orvice/ss-panel/wiki/Install-Guide-zh_cn

中文安装文档已经说明的很详细了。导入ss-panel-master里sql文件夹下面的所有数据库到你自己建立的数据库中，就是之前建立了的ss数据库，修改lib/config-sample.php（里面填写你的数据库信息）并改为：config.php即可。
修改默认配置即可。

新版sspanel后台默认用户名密码已更新，默认情况下，user表中uid为1的用户为管理员
默认管理帐号: first@blood.com 密码 1993

