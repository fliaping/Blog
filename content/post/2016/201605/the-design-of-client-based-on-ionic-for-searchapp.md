+++
author = "Payne Xu"
categories = ["搜索引擎", "Ionic"]
date = 2016-05-23T10:27:25Z
description = ""
draft = false
slug = "the-design-of-client-based-on-ionic-for-searchapp"
tags = ["搜索引擎", "Ionic"]
title = "基于Ionic的客户端设计"

+++



客户端的设计，利用的是Hybrid APP的构建技术，核心是HTML5技术，下面先简单介绍下Hybrid应用的以及Ionic框架。

# 技术介绍
## Hybrid App介绍

移动app可以大致被分为三种，native、hybrid和web app。如果使用native app，你可以使用设备和操作系统的所有能力，同时，平台的性能负荷最小。然而，构建web app可以让你的代码跨平台，使得开发时间和成本大大减少。而hybrid app把这两者的优点都结合起来，使用一套共同代码，在许多不同的平台上部署类似原生的app。

<!--more-->

有两种构建hybrid app的方法：

1)  Webview app：HTML,CSS和Javascript基础代码在一个内部的浏览器（叫做WebView）中运行，这个浏览器打包在一个原生的app中，一些原生的API可以通过这个包被Javascript获得，比如Adobe PhoneGap和Trigger.io。
2)  被编译的hybrid app：用一种语言编写代码（如C#或者Javascript），对于每一种支持的平台都把代码编译进原生代码中，这样做的结果是，每一个平台都有一个原生的app，但是在开发过程中少了一些自由空间。可以看一下这些例子，Xamarin，Appcelerator Titanium，Embarcadero FireMonkey。

优点：

* 开发人员可以使用现有的网页技术
* 对于多种平台使用一套基础代码
* 减少开发时间和成本
* 使用响应式网页设计可以非常简便的设计出多样的元素（包括平板）
* 一些设备和操作系统特征的访问
* 高级的离线特性
* 可见度上升，因为app可以原生发布（通过app store），也可以发布给移动端浏览器（通过搜索引擎）

缺点：

* 某些特定app的性能问题（那些依赖于复杂的原生功能或者繁重的过渡动画的app，如3D游戏）
* 为了模拟native app的UI和感官所增加的时间和精力
* 并不完全支持所有的设备和操作系统
* 如果app的体验并不够原生化，有被Apple拒绝的风险（比如说一个简单的网站）
* 这些缺点比较显著，不能忽略，它们告诉我们，并不是所有的app都适合混合模式，你需要小心的预计你的目标用户、他们对平台的选择和对app的需求。对于许多app来说，好处都是大于坏处的，比如内容驱动的app。

## Ionic介绍

Ionic是一个强大的 HTML5 应用程序开发框架(HTML5 Hybrid Mobile App Framework )。 可以帮助您使用 Web 技术，比如 HTML、CSS 和 Javascript 构建接近原生体验的移动应用程序。ionic 主要关注外观和体验，以及和你的应用程序的 UI 交互，特别适合用于基于 Hybird 模式的 HTML5 移动应用程序开发。ionic是一个轻量的手机UI库，具有速度快，界面现代化、美观等特点。为了解决其他一些UI库在手机上运行缓慢的问题，它直接放弃了IOS6和Android4.1以下的版本支持，来获取更好的使用体验。
Ionic特点:

1.  ionic 基于Angular语法，简单易学。
2.  ionic 是一个轻量级框架。
3.  ionic 完美的融合下一代移动框架，支持 storage.blog.fliaping.com，代码易维护。
4.  ionic 提供了漂亮的设计，通过SASS构建应用程序，它提供了很多UI组件来帮助开发者开发强大的应用。
5.  ionic 专注原生，让你看不出混合应用和原生的区别
6.  ionic 提供了强大的命令行工具。
7.  ionic 性能优越，运行速度快。storage.blog.fliaping.com

# Ionic学习
## 前导知识
storage.blog.fliaping.com
* HTML5技术
* JavaScript
* AngularJS
storage.blog.fliaping.com
## 基础学习
请参考网络其他教程，例如：

* [ionic 教程-菜鸟教程](http://wstorage.blog.fliaping.com/ionic-tutorial.html)
* [ionic中文教程-皓眸大前端](http://www.haomou.net/2014/10/06/2014_ionic_learn/)

当然最好的还是官方的文档 [Ionic Documentation](http://ionicframework.com/docs/)
storage.blog.fliaping.com
**本篇文章针对已经入门Ionic的童鞋，没有入门的请先完成基础学习。**

# 界面介绍
## 界面截图storage.blog.fliaping.com
先界面贴出效果。

下图：主界面和景点详情页面

![searchapp-home](https://o364p1r5a.qnssl.com/blog/searchapp-home.png)

下图：景点详情页面

![searchapp-detail-page](https://o364p1r5a.qnssl.com/blog/searchapp-detail-page.jpg)

下图：原始链接页面

![QQ20160612-3@2x copy](https://o364p1r5a.qnssl.com/blog/QQ20160612-3@2x%20copy.png)

下图：AND和OR查询

![searchapp-and-or-query](https://o364p1r5a.qnssl.com/blog/searchapp-and-or-query.png)

下图：结果排序页面

![searchapp-sort](https://o364p1r5a.qnssl.com/blog/searchapp-sort.png)

下图：结果筛选页面

![searchapp-filte](https://o364p1r5a.qnssl.com/blog/searchapp-filter.png)

## 界面逻辑结构
页面结构图如下：
![searchapp-page-framework](https://o364p1r5a.qnssl.com/blog/searchapp-page-framework.png)

# 项目构建
关于Ionic框架的详情使用，请参考基础学习内容和项目中的源码。
## ngCordova插件模块

1.　在源码起始HTML页面中，引入`ng-cordova.js`文件，如下，把该文件放在项目目录的lib/ngCordova/dist目录下，并在`index.html`中添加如下代码片段。

```html
<script src="lib/ngCordova/dist/ng-cordova.js"></script>
<script src="cordova.js"></script>
```

2.　将ng-cordova模块注入应用,如下代码，在angular中构建module时加入`ngCordova`模块。

```JavaScript
var app = angular.module('searchIndex', ['ionic','ngCordova']);
```

## 定位插件
本项目中使用了设备的定位功能，如果简单使用HTML的定位功能，在当前Ionic环境下并没有效果，因为可能Ionic构建出来的应用并不是标准的浏览器，并没有调用设备的定位硬件，但Ionic的最大好处是Hybrid方式，既可以通过中间层`Cordova`来调用设备硬件。

插件介绍页：http://ngcordova.com/docs/plugins/geolocation/

1.　安装插件：

```bash
cordova plugin add cordova-plugin-geolocation
```

2.　在controler中注入`$cordovaGeolocation`插件。

```JavaScript
app.controller("homeCtrl",['$scope','$cordovaGeolocation',
      function ($scope,$cordovaGeolocation){
    //......
    }
```

3.　在代码中使用该插件的定位功能

```JavaScript
var isIOS = ionic.Platform.isIOS();
        var isAndroid = ionic.Platform.isAndroid();
        console.log("Platform:"+ionic.Platform.platform());

        if(isAndroid || isIOS){
            var posOptions = {timeout: 10000, enableHighAccuracy: false};
            $cordovaGeolocation
                .getCurrentPosition(posOptions)
                .then(function (position) {
                    window.localStorage['latitude']  = position.coords.latitude;
                    window.localStorage['longitude'] = position.coords.longitude;
                    //$scope.closeLocation();
                    $scope.loading(false);
                }, function(err) {
                    // error
                });
        }
```

## 应用内网页浏览

插件介绍页：http://ngcordova.com/docs/plugins/inAppBrowser/

1.　安装插件：

```bash
cordova plugin add cordova-plugin-inappbrowser
```

2.　在controler中注入`$cordovaInAppBrowser`插件。

```JavaScript
app.controller("homeCtrl",['$scope','$cordovaInAppBrowser',
      function ($scope,$cordovaInAppBrowser){
    //......
    }
```

3.　在代码中使用该插件，实现应用内打开链接

```JavaScript
$scope.openUrl = function (url) {
            var isIOS = ionic.Platform.isIOS();
            var isAndroid = ionic.Platform.isAndroid();
            console.log("Platform:"+ionic.Platform.platform());

            if(isAndroid || isIOS){

                var options = {
                    location: 'yes',
                    clearcache: 'yes',
                    toolbar: 'yes'
                };

                $cordovaInAppBrowser.open(url, '_blank', options)

            }else {
                $window.open(url);
            }

        };
```

# 调试
## Android平台
由于Android平台的开放特性，发布该平台软件比较简单，直接利用Ionic提供的命令即可。

在本项目的目录下执行如下命令

```bash
ionic platform android   #添加android平台
ionic build android      #构建android平台代码
ionic emulate android    #在android模拟器上运行程序
ionic run android        #在运行android机器上运行程序
```

`emulate`命令是打开android模拟器并加载应用，`run`命令需要将手机插到电脑上，并确认Debug功能打开，并在手机上对该电脑进行了认证。
## IOS平台
因为ios平台的封闭性，如果想在ios平台进行调试，可以利用Xcode提供的模拟器，当然需要在OSX平台上进行。此外也可以利用Xcode直接加载Ionic构建好的工程，在真机上调试。

```bash
ionic platform ios  #添加ios平台
ionic build ios     #构建ios平台代码
ionic emulate ios   #在ios模拟器上运行程序
```

如果在真机上进行调试，需要在构建ios平台代码之后打开Xcode，加载Ionic应用目录下的platforms/ios/TripSearch.xcodeproj工程。之后登陆Apple账号，获得免费的ios开发授权之后即可对项目编译并在真机上运行。

整个过程还是比较麻烦的，需要一定的经验和问题解决能力，因为这不是我们的重点，这里不再多说。

# 发布
真正的发布需要签名之后发布到各大应用市场，笔者没有相关经验，但觉得这些都还简单，应该难不倒聪明的大家。





