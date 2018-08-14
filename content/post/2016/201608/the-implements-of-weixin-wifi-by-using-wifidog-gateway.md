+++
author = "Payne Xu"
categories = ["openwrt"]
date = 2016-08-14T07:51:25Z
description = ""
draft = false
slug = "the-implements-of-weixin-wifi-by-using-wifidog-gateway"
tags = ["openwrt"]
title = "利用wifidog实现微信wifi连接"

+++

# 前言

大家如果有用公共场合wifi的习惯，想必都有过如下的体验。

![](https://o364p1r5a.qnssl.com/blog/14711616774040.jpg)

这就是利用微信身份来进行wifi连接认证，主要目的是商家为了吸引顾客，推广其公众号。别的也不多说，下面就来讲一讲怎么实现这样的wifi认证方式。

本篇文章要讲的是portal型路由设备（具体就是OpenWrt路由）的改造实现。在进行改造之前请务必要看微信公众平台开发文档的[微信连wifi](http://mp.weixin.qq.com/wiki/11/3ccabd900dbb942dff317c11db70e157.html),后面提到的相关设涉及微信公众平台开发的相关术语、参数不再一一解释。

<!--more-->

# 微信wifi认证用户操作流程

简单的讲（无技术实现），通过微信连wifi的流程（手机端）：

1. 用户连上无密码的热点，请求一个链接
2. 路由器返回个用户一个portal页面。
3. 用户在portal页点击`微信连WiFi`按钮，唤起手机微信。
4. 微信显示提供热点的公众号，用户点击`立即连接`后向开发者的认证服务器进行认证。
5. 认证通过，微信提示连接成功并转跳公众号预设的主页。

对于用户而言，前面是TA要走的流程，对于开发者而言，要搞清楚每一步路由器、微信、认证服务器这三者到底做了什么，之间有什么关系。要想清楚这些，首先需要了解wifidog。

# wifidog认证处理流程

wifidog的介绍就省略掉，相信看这篇文章的人都知道，直接进入正题。wifidog的认证有五种向认证服务器发送的协议，一种自己接受协议，虽说是协议，不过是不同的URL罢了。
例如：`192.168.1.2:9408/login/?mac=xx&gw_id=**`


| 协议 | 默认路径 | 作用 |
| --- | --- | --- |
| Login | `login/?`  | 用于登录时 |
| Auth | `auth/?` | 用于初次认证和心跳认证 |
| Ping | `ping/?` | 用于路由器心跳 |
| Portal | `portal/?` | 登录成功跳转 |
| Msg | `gw_message.php?` | 用于出错时用于展示给用户信息 |


PS:官方画的这个图真的好奇葩，委屈下看官的脖子。或者可以转动屏幕，最好发到手机上看。

![](https://o364p1r5a.qnssl.com/blog/14711637260078.jpg)

下面对这个流程图做个解释：

1. 客户端发送一个请求，请求被转发到认证服务器（AuthServer）的Login协议的URL上。这个过程中，具体情况是当客户端向路由器发送一个HTTP时，OpenWrt中的iptables预定义的规则（在wifidog启动时写入规则）将所有请求转发到wifidog监听的地址（默认端口是2060）。当然配置文件中可以设置白名单，保证白名单列表的正常连接。再接着wifidog将向客户端返回302重定向，location的url如下，客户端将请求这个地址。

	```
	http://auth_server/login/?
	gw_id=[GatewaylD, default: "default]&
	gw_address=[GatewayAddress, internal IP of router]&
	gw_port=[GatewayPort, port that wifidog Gateway is listening on]&
	ur1=[user requested url]
	```
	在配置文件中如果不设`GatewayID`，wifidog会将GatewayInterface的mac地址去掉冒号当做GatewayID。
	
	>If none is supplied, the mac address of the GatewayInterface interface will be used,without the : separators
	
	如图前面流程图所示，每个参数都给出了解释，很清楚。当然url是没有换行的。

2. 服务器收到login请求后，返回一个登录页面，用户提交表单（假如有的话）。
3. 服务器处理表单，保存表单信息，生成一个token。向客户端返回302重定向，重定向的location是`http://GatewayIP:GatewayPort/wifidog/auth?token=token`，然后客户端向wifidog请求这个url。
4. wifidog收到请求后取得token，并向AuthServer发送Auth请求，url如下所示，之后认证服务器取得参数并判断是否认证通过。
	
	```
	http://auth_server/auth/?
	stage=[login|counters]&
	ip=[client ip]&
	mac=[client mac]&
	token=[token]&
	incoming=[in data usage]&
	outgoing=[out data usage]
	```
	* stage有两个值login表示登录认证，counters表示计数（心跳）认证。
	* incoming和outgoing是从连接开始到当前的总量，不是每次auth的值。

	AuthServer返回是否认证成功时，若成功，返回`Auth: 1`，若不成功，返回`Auth: 0`
5. 若认证成功，wifidog会重定向客户端到portal页，url如：`http://auth_server/portal/?gw_id=%s`
6. Ping协议：在每次wifidog启动的时候都会首先通过ping协议判断某认证服务器（可以有多个）是否在线，如果是Down状态就会尝试下一个。url如下：
	
	```
	http://auth_sever/ping/?
	gw_id=%s&
	sys_uptime=%lu&
	sys_memfree=%u&
	sys_load=%.2f&
	wifidog_uptime=%lu
	```
7. 若验证失败，则会根据失败原因跳转至如下页面
	
	```
	gw_message.php?message=[denied|activate|failed_validation]
	```
	
# 加入微信认证的流程

要想比较容易的理解这个流程，需要仔细阅读[Wi-Fi硬件鉴权协议接口说明](http://mp.weixin.qq.com/wiki/2/55f1e301f4558846d2bf0dd51543e252.html)

为了方便起见，把微信的认证流程图粘了过来。
![](https://o364p1r5a.qnssl.com/blog/14712311928997.png)

结合微信的认证流程图和前面wifidog的认证流程，我们应该会有一些如何结合两者的想法。

1. 手机选择SSID，无密码，连接。
2. 手机系统尝试打开一个URL来确定网络可用（或者手动打开一个链接），路由的iptables转发请求到wifidog，wifidog将请求重定向到AuthServer，并加入参数。（参见Login协议）
3. AuthServer返回微信portal页，页面中包含获得微信ticket的参数，包括`appId,extend,timestamp,shopId,authUrl,mac,ssid,bssid,secretKey`以及`sign`即对前面参数md5后的值。（参数后面再解释）
	注意此处有坑：
	* 此portal非wifidog认证中的portal，在结合微信的认证中wifidog的portal不会用到。
	* md5函数的结果中字母一定要是小写
4. 点击portal页中的`呼起微信连wifi`按钮。
	* 首先portal页面中的js代码会向微信服务器发送Ajax请求，就是把要获取ticket的参数传过去。
	* 微信服务器验证参数和sign匹配，返回唤起微信所需要的ticket。
	* portal页面将通过微信的Schema:`weixin://connectToFreeWifi/ticket=xx`呼起微信。（有的浏览器不支持打开外部应用，最好用系统自带浏览器）
	* 微信连接微信服务器，核对ticket，成功则返回给微信用户的`extend,openId,tid`，然后微信会打开前置的连接wifi页（如图1中的连接前页）。
5. 点击连接，向AuthServer发起请求认证，参数包括`extend,openId,tid`，AuthServer返回AC（Access Control）结果，如果通过要返回302重定向到wifidog的auth上，也就是wifidog认证流程中的第3步，重定向的location为`http://GatewayIP:GatewayPort/wifidog/auth?token=token`
6. 微信请求重定向的链接，wifidog收到请求并取得token，发起向AuthServer的认证。若认证成功，微信显示连接成功页面。不成功则连接失败。
7. 在连接成功页面点击完成转跳到公众号预设的home页。连接成功也也可以关注公众号。

对于关注公众号可以联网，取消关注断网：

* 可以让用户提前关注公众号，在第5步时判断是否有粉丝关系，有即通过否则拒绝。这可以做到关注了公众号可以联网。
* 要想做到取消关注即断网需要在认证成功之后的auth心跳时进行判断，具体怎么判断是否取消关注，是每次查询微信接口还是用户取消关注微信服务器会给你个回调，这个我还没研究。

# 关于实现的简单说明

把认证流程搞清楚之后，有开发能力的人基本就不用往下看了，本文也是针对于有一定开发能力的人，关于实现不会像教程一样详细，主要是提几个关键点。

## wifidog客户端

### 安装wifidog
首先在OpenWrt中安装wifidog，如果是开发用的话安装repository中的就可以了。如果是用于生产的话需要对wifidog进行一些修改然后编译成自己需要的包，这里可以参考 [WiFiDog 多线程优化思路](http://www.wifidog.pro/2015/11/11/WiFiDog-%E5%A4%9A%E7%BA%BF%E7%A8%8B%E4%BC%98%E5%8C%96%E6%80%9D%E8%B7%AF.html)。

```bash
opkg update
opkg install wifidog
```
开机自启 `/etc/init.d/wifidog enable`
启动服务 `/etc/init.d/wifidog start`

### 配置文件修改

wifidog默认配置文件在`/etc/wifidog.conf`，最好是要通读整个配置文件，也不是很多。

1. 修改GatewayID，位置大概在15行
	 GatewayID用来表示这个wifidog网关的，前面也提到过，注释掉着一行的话wifidog会取GatewayInterface的mac地址去掉冒号（separators）作为网关ID，如果一个路由上只运行一个wifidog这样做挺好，多个的话就需要自己设置。
	 GatewayAddress和GatewayInterface一般按照默认就行，如果有需要自行设置。
	 
	 ```
	 # GatewayID default
	 # 这里很大一个坑，每个去掉注释的设置项一定要顶头开始，不能有空格，当然设置项的子项是要有缩进的。
	 ```
2. AuthServer项配置，位置大概在80行。
	
	```
	AuthServer {
          Hostname    192.168.66.186 
          HTTPPort  9408
          SSLAvailable no
          Path      /     
          MsgScriptPathFragment gw_message/?
      }
	```
	每项配置的具体作用和可选值在前面的注释中有。
	
3. wifidog防火墙配置，在FirewallRuleSet中加入如下规则，位置大概在245行。
	
	```
	# 放行微信
	FirewallRule allow tcp to wifi.weixin.qq.com
	FirewallRule allow tcp to dns.weixin.qq.com
	FirewallRule allow tcp to short.weixin.qq.com
	FirewallRule allow tcp to long.weixin.qq.com
	FirewallRule allow tcp to szshort.weixin.qq.com
	FirewallRule allow tcp to mp.weixin.qq.com
	FirewallRule allow tcp to res.wx.qq.com
 	FirewallRule allow tcp to wx.qlogo.cn
	FirewallRule allow tcp to minorshort.weixin.qq.com
	FirewallRule allow tcp to adfilter.imtt.qq.com
	FirewallRule allow tcp to log.tbs.qq.com
	
	# 放行Apple
	#FirewallRule allow tcp to apple.com
	#FirewallRule allow tcp to icloud.com 
	```
最小化修改就是以上三个地方，其它配置项建议也要看看，如果有需要的时候知道改哪里。

通过 `wifidog -h` 命令查看用法，一般在开发的时候使用 `wifidog -f -d 7`即可。

## 认证服务器
认证服务器就是处理wifidog的五种协议，如果只是简单的认证，用php、python或者其他的脚本语言会更容易实现。因为我需要别的一些处理，所以我选择JAVA来处理。

代码的话不准备在这里写了，放在Github，不过现在代码写的太烂，完成度太低，还没有push，先放链接 [fliapingWifi-auth](https://github.com/paynexu/fliapingWifi-auth)

	


# 参考文章
* [\[wifidog-gateway\]-Github](https://github.com/wifidog/wifidog-gateway)
* [Wi-Fi硬件鉴权协议接口说明](http://mp.weixin.qq.com/wiki/2/55f1e301f4558846d2bf0dd51543e252.html)
* [wifidog安装以及自写wifidog认证服务器](http://blog.csdn.net/just_young/article/details/38003015)