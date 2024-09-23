+++
author = "Payne Xu"
date = 2018-03-31T07:50:07Z
categories = ["Developer"]
tags = ["java"]
draft = false
slug = "learn-java9-modular-and-classload-from-the-problem-of-log-config-file"
title = "从日志配置文件读取了解java9模块化和类加载机制的改变"

+++

## 前言
Java9出来大半年了，Java10也发布了，Java11半年后就来了，将成为了一个LTS长期支持版，从Java9开始的模块化是java非常重大的改变，未来必然成为趋势，学习模块化也早晚的事。这不正好学习netty，写一个代理软件练练手，顺便学习下模块化。本文并不是完整介绍模块化，而是在使用模块化过程中遇到的一个问题的分析和解决。

## 问题描述
首先说下项目的基本情况：
* JDK9（模块化，即使用了module-info.java）
* 项目构建：gradle 4.6
* IDE: IntelliJ IDEA 2017.3.5

代码中有使用到日志工具，目前比较常用的是slf4j作为日志api，实现使用log4j、log4j2或者logback。我当然也这么用，slf4j+log4j2。在不使用模块化情况下（java9为了向前兼容，可以不使用模块化），将日志的配置文件log4j2.xml文件放到`src/main/resources`然后用idea build->run，但发现log4j2报错：
```
ERROR StatusLogger No Log4j 2 configuration file found. Using default configuration (logging only errors to the console), or user programmatically provided configurations. Set system property 'log4j2.debug' to show Log4j 2 internal initialization logging. See https://logging.apache.org/log4j/2.x/manual/configuration.html for instructions on how to configure Log4j 2
```
<!--more-->
## 错误分析
这错误明显就是log4j2的日志的配置文件没找到呀，来看看它是怎么找配置文件的:

>Log4j可以在初始化的时候执行自动配置。当Log4j启动的时候，会首先定位所有的ConfigurationFactory插件然后会根据权重进行从高到低的排序。目前的版本，Log4j包含了四种类型的ConfigurationFactory的实现，JSON，YAML，properties，XML。
>
>1：Log4j将会检查 log4j.configurationFile的系统属性，如果已经设置了对应的属性，将会使用ConfigurationFactory对应的属性去加载配置。
>
>2：如果没有设置对应的系统属性，将会在classpath中寻找log4j2-test.properties文件。
>
>3：如果没有找到，YAML ConfigurationFactory则会在classpath中继续寻找log4j2-test.yaml或者log4j2-test.yml文件。
>
>4：如果还是没有找到，JSON ConfigurationFactory则会在classpath中继续寻找log4j2-test.json或者log4j2-test.jsn文件。
>
>5：如果还是没有找到，XML ConfigurationFactory则会在classpath中继续寻找log4j2-test.xml文件。
>
>6：如果test文件不能classpath中被定位，那么就会寻找log4j2.properties文件。
>
>7：如果properties文件不能被定位，就会在classpath中寻找YAML的配置文件，log4j2.yaml或者log4j2.yml文件。
>
>8：如果YAML文件不能被定位，就会在classpath中寻找JSON格式的配置文件，log4j2.json或者log4j2.jsn文件。
>
>9：如果JSON文件不能被定位，就会在classpath中寻找XML格式的配置文件，log4j2.xml。
>
>10：如果依然没有配置文件被定位，那么将会使用缺省的配置DefaultConfiguration。日志将会被直接输出到控制台。


通过查看源码发现`ConfigurationFactory`类的子类有这么多，每个子类通过`Order`注解排序
![log4j2-configurationfactorys](https://fliaping-blog.oss-rg-china-mainland.aliyuncs.com/storage/2018/03/log4j2-configurationfactorys.png)

拿我们常用的xml配置来说，通过下面的代码可以看出`XmlConfigurationFactory`序号是5
```java
/**
 * Factory to construct an XmlConfiguration.
 */
@Plugin(name = "XmlConfigurationFactory", category = ConfigurationFactory.CATEGORY)
@Order(5)
public class XmlConfigurationFactory extends ConfigurationFactory {
 //......
}
```

ConfigurationFactory在初始化实例时加载config插件并排序

```java
//org.apache.logging.log4j.core.config.ConfigurationFactory#getInstance

Map<String, PluginType<?>> plugins = manager.getPlugins();
List<Class<? extends ConfigurationFactory>> ordered = new ArrayList(plugins.size());
// ... 省略
// 进行排序
Collections.sort(ordered, OrderComparator.getInstance());    
```
再看看排序的Comparator，可以发现就是根据`Order`注解进行排序的。
```java
//org.apache.logging.log4j.core.config.OrderComparator
public int compare(Class<?> lhs, Class<?> rhs) {
        Order lhsOrder = (Order)((Class)Objects.requireNonNull(lhs, "lhs")).getAnnotation(Order.class);
        Order rhsOrder = (Order)((Class)Objects.requireNonNull(rhs, "rhs")).getAnnotation(Order.class);
        if (lhsOrder == null && rhsOrder == null) {
            return 0;
        } else if (rhsOrder == null) {
            return -1;
        } else {
            return lhsOrder == null ? 1 : Integer.signum(rhsOrder.value() - lhsOrder.value());
        }
    }
```

`ConfigurationFactory`通过静态方法`getInstance`获取到`ConfigurationFactory.Factory`类型的单例对象，而这个Factory又继承自`ConfigurationFactory`，通过下图可以看到在获取这个单例时的初始化插件的过程。

![log4j2-configurationfactory-getinstance](https://fliaping-blog.oss-rg-china-mainland.aliyuncs.com/storage/2018/03/log4j2-configurationfactory-getinstance.png)

 而真正获取配置文件的逻辑在`ConfigurationFactory.Factory#getConfiguration(org.apache.logging.log4j.core.LoggerContext, java.lang.String, java.net.URI)`，首先是检查系统属性参数`log4j.configurationFile`看看有没有配置文件。
 
 ![log4j2-configurationfactory-get-from-system-property](https://fliaping-blog.oss-rg-china-mainland.aliyuncs.com/storage/2018/03/log4j2-configurationfactory-get-from-system-property.png)
 
 然后查找不同文件名的配置文件。
 ![log4j2-configurationfactory-find-config](https://fliaping-blog.oss-rg-china-mainland.aliyuncs.com/storage/2018/03/log4j2-configurationfactory-find-config.png)
 
 查找的具体实现就是用ClassLoader去getResource，就是从classpath中查找不同名字的配置文件
 ![log4j2-configurationfactory-search-config-in-classpath](https://fliaping-blog.oss-rg-china-mainland.aliyuncs.com/storage/2018/03/log4j2-configurationfactory-search-config-in-classpath.png)
  到这里也就是说log4j2并没有从classpath中找到配置文件，当然我们可以通过手动设置系统属性来解决这个问题：
  
  ```java
  public static void main(String[] args) {
      System.setProperty("log4j2.configurationFile", "/home/payne/Workspace/log4j2.xml");
      // 注意logger属性一定不能在类初始化时赋值，要保证在设置了系统属性之后
      logger = LoggerFactory.getLogger(ProxyLocal.class);
      
      // your code
  }
  // 或者在程序启动时增加JVM参数 -Dlog4j2.configurationFile=/home/payne/Workspace/log4j2.xml
  ```
 
 到这里问题似乎解决了，确实，问题是能解决，但是为什么在java9的模块化的classpath中就找不到配置文件了呢？后面再来解答，稍微透露下，还是挺狗血的。
 ## Java9模块化
 java9的模块化是为了解决长久以来的java依赖，大小，可访问性等问题，具体有：
 
1.一个包只是一个类型的容器，而不强制执行任何可访问性边界。包中的公共类型可以在所有其他包中访问，没有办法阻止在一个包中公开类型的全局可见性。
2.除了以java和javax开头的包外，包应该是开放扩展的。如果你在具有包级别访问的JAR中进行了类型化，则可以在其他JAR中访问定义与你的名称相同的包中的类型。
3.Java运行时会看到从JAR列表加载的一组包。没有办法知道是否在不同的JAR中有多个相同类型的副本。Java运行时首先加载在类路径中遇到的JAR中找到的类型。
4.Java运行时可能会出现由于应用程序在类路径中需要的其中一个JAR引起的运行时缺少类型的情况。当代码尝试使用它们时，缺少的类型会引起运行时错误。
5.在启动时没有办法知道应用程序中使用的某些类型已经丢失。还可以包含错误的JAR文件版本，并在运行时产生错误。
6.因为JDK是太大的，对于小设备很难进行等比例缩减。Java SE 8提出了3种紧凑类型解决这个问题：compact1、compact2和compact3。 但是这个问题并没有得到有效的解决。

要解决这些问题，openjdk开启了jigsaw项目，并在java9得以实现。那么下面简单介绍一下模块化。java9新定义了一个module-info.java来实现这个特性，模块化顾名思义就是把实现某一功能的类放到一个容器中当作一个模块，然后定义这个容器可以给别人用的接口和需要用到别的容器的接口。其实之前的jar包也是一个容器，但是这个容器是敞口的，别人可以随意访问到里面的package，就算是非public的一个反射也是可以搞定，并且jar这个容器没什么原则，啥都可以放，就算不同的功能一般也可以放里面，导致我们需要用到别的容器提供的某一个功能时需要把整个jar容器都搬过来，费时费力。模块化是jar容器里的一个小管家，把不同功能的package放到不同的模块容器中，别人要用模块中的某个类的时候先看看这个package可不可以给别人用。自己的模块用到别的哪些模块都有个小本本记着，编译是就可以检查用的模块在不在，不用等到运行的时候才发现自己要用的东西还没有。

通过上面简单的描述大家初步了解模块的含义，那java9中是如何使用模块化的呢，首先java9先将jre的系统库进行的分解，将不同的功能分别组装成不同的模块：

![dependencygraph](https://fliaping-blog.oss-rg-china-mainland.aliyuncs.com/storage/2018/03/dependencygraph.png)
JAVA_HOME的目录中多了个jmods的目录来放系统类库的模块，哦对了，java9定义了每个模块的存在形式--jmod文件

```
├── jmods
│   ├── java.activation.jmod
│   ├── java.base.jmod
│   ├── java.compiler.jmod
│   ├── java.corba.jmod
│   ├── java.datatransfer.jmod
│   ├── java.desktop.jmod
│   ├── javafx.base.jmod
│   ├── javafx.controls.jmod
│   ├── javafx.deploy.jmod
```
那么如何在开发过程中使用模块化的特性呢？其实只要一个module-info.java就可以了，这个文件放在模块的根目录，也就是和最上层package平级，定义了依赖和开放，新增了一些关键词，如下示例：
```java
module com.fliaping.proxy {
    //声明依赖的模块
    requires org.slf4j;
    requires java.xml;
    requires java.naming;
    
    //声明可以向下传递的依赖
    requires transitive io.netty.all;
    //声明本模块对外开放的package
    exports com.fliaping.proxy.local;
    //可以开放的包，意味着别人可以通过反射取得
    opens com.fliaping.proxy.local;
}
```
当然关于模块化的内容还是不少的，这是只是最基本的用法，关于模块化的实现除了将系统库拆分成为模块以及定义了模块描述文件，另外比较重要的方面就是modulepath和ClassLoader。
## java9 module-path
在java9之前有一个classpath，这个classpath是啥用的呢，其实就是从这些path中找class文件，回到最开始的日志问题，在不使用模块化的时候，使用idea启动，可以看到启动参数中有classpath，例如像这样的：
```
-classpath /home/payne/Workspace/Git/h2-proxy/local/out/production/classes:/home/payne/Workspace/Git/h2-proxy/local/out/production/resources:/home/payne/Workspace/Git/h2-proxy/libs/netty-all-4.1.22.Final.jar
```
我们项目的代码编译成的class是放在`out/production/classes目录中的`，我们的资源文件是放在`out/production/resources`目录的，但这两个目录都被加入到classpath中了，所以log4j可以根据方法`java.lang.Class#getResource`取得配置文件，这是没有问题的，但是我们加了模块化的描述文件`module-info.java`之后，idea的启动参数中没有了classpath，取而代之的是`-p`,这个参数是`--module-path`的简写，所以变成里这样：
```
-p /home/payne/Workspace/Git/h2-proxy/local/out/production/classes:/home/payne/Workspace/Git/h2-proxy/local/out/production/resources:/home/payne/Workspace/Git/h2-proxy/libs/netty-all-4.1.22.Final.jar
```
可以看到除了参数名不一样之外别的都一样，但是这个时候log4j加载不到配置文件，也就是说通过`java.lang.Class#getResource`并不能取得这个模块中的`log4j2.xml`，这是为什么呢？resources目录也加在了moudlepath，问题在于模块化的限制。首先，resource作为一个modulepath的目录，java先去看看目录中与没有`module-info.java`文件，没有的，就把这个目录归为未命名模块，里面的文件自然也是未命名模块中的了（java9的向前兼容其实就是把所有的类包归为同一个模块--未命名模块），但是不同模块中的资源是不能直接访问的，除非声明了`opens`，但由于未命名模块是自动的，我们并不能声明`opens`，到这里问题清楚了，就是在编译阶段，resource目录中的内容放错了地方，应该放在该模块的作用范围内，对于本例子来说放到`classes`目录就好了。

项目使用的是gradle，通过查询资料，引入idea插件，配置一些配置项，让resource的output目录和classes目录一致：
```gradle
plugins {
    id 'idea'
}

idea {
    module {
        inheritOutputDirs = false
        outputDir = file("$buildDir/classes/java/main/")
        testOutputDir = file("$buildDir/classes/java/test/")
    }
}
```
其实如果是打包成jar来运行的话，上面的问题是不会出现的，因为idea会在打包jar的时候将resource目录中的所有的文件复制到jar打包的根目录也就是和`module-info.java`平级，是属于这个模块中的，就可以直接访问到。

我们接着再来看看java9的`java.lang.Class#getResource`方法，看它如何实现兼容
![java9-class-getresources](https://fliaping-blog.oss-rg-china-mainland.aliyuncs.com/storage/2018/03/java9-class-getresources.png)

## Java9 ClassLoader
在java9之前JDK使用三个类加载器来加载类，使用双亲委派机制来防止重复加载，如下图所示：
![classloaders-before-java9](https://fliaping-blog.oss-rg-china-mainland.aliyuncs.com/storage/2018/03/classloaders-before-java9.png)

* 启动类加载器(Bootstrap ClassLoader)：负责加载 JAVA_HOME\lib 目录中的，或通过-Xbootclasspath参数指定路径中的，且被虚拟机认可（按文件名识别，如rt.jar）的类。
* 扩展类加载器(Extension ClassLoader)：负责加载 JAVA_HOME\lib\ext 目录中的，或通过java.ext.dirs系统变量指定路径中的类库。
* 应用程序类加载器(Application ClassLoader)：负责加载用户路径（classpath）上的类库。

双亲委派机制是这样的，例如我们平时项目中写的一个类，是由Application ClassLoader来加载，加载时Application ClassLoader先将这个工作委托给父加载器加载，也就是Extension ClassLoader，Extension ClassLoader不会自己先加载，还是会让父加载器加载，也就是Bootstrap ClassLoader，Bootstrap ClassLoader找不到，又交给了Extension ClassLoader，Extension ClassLoader找不到最后又交给Application ClassLoader。这就是双亲委派机制。

在java9中做了修改，如下图，保持三级分层类加载器架构以实现向后兼容。但是，从模块系统加载类的方式有一些变化，应用程序类加载器可以委托给平台类加载器以及引导类加载器，平台类加载器可以委托给引导类加载器和应用程序类加载器。。
![classloaders-java9](https://fliaping-blog.oss-rg-china-mainland.aliyuncs.com/storage/2018/03/classloaders-java9.png)

![java9-classloaders-hierarchy](https://fliaping-blog.oss-rg-china-mainland.aliyuncs.com/storage/2018/03/java9-classloaders-hierarchy.png)

* BootClassLoader:启动类加载器，在虚拟机中实现的，用于加载启动的基础模块类，有这些模块`java.base`、`java.logging`、`java.prefs`、`java.desktop`
* PlatformClassLoader：平台类加载器，用于加载一些平台相关的模块，例如：`java.activation`、`java.se`、`jdk.desktop`、`java.compiler` 等，双亲是BootClassLoader。
* AppClassLoader：应用模块加载器，用于加载应用级别的模块，除了我们项目中的模块，还包括jdk相关的应用模块，例如：`jdk.javadoc`、`jdk.jshell`、`jdk.jlink` 等，双亲是PlatformClassLoader。

1.当应用程序类加载器需要加载类时，它将搜索定义到所有类加载器的模块。 如果有合适的模块定义在这些类加载器中，则该类加载器将加载类，这意味着应用程序类加载器现在可以委托给引导类加载器和平台类加载器。 如果在为这些类加载器定义的命名模块中找不到类，则应用程序类加载器将委托给其父类，即平台类加载器。 如果类尚未加载，则应用程序类加载器将搜索类路径。 如果它在类路径中找到类，它将作为其未命名模块的成员加载该类。 如果在类路径中找不到类，则抛出ClassNotFoundException异常。
2.当平台类加载器需要加载类时，它将搜索定义到所有类加载器的模块。 如果一个合适的模块被定义为这些类加载器中，则该类加载器加载该类。 这意味着平台类加载器可以委托给引导类加载器以及应用程序类加载器。 如果在为这些类加载器定义的命名模块中找不到一个类，那么平台类加载器将委托给它的父类，即引导类加载器。
3.当引导类加载器需要加载一个类时，它会搜索自己的命名模块列表。 如果找不到类，它将通过命令行选项-Xbootclasspath/a指定的文件和目录列表进行搜索。 如果它在引导类路径上找到一个类，它将作为其未命名模块的成员加载该类。