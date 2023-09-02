+++
author = "Payne Xu"
categories = ["Developer"]
date = 2017-01-23T12:58:25Z
description = ""
draft = false
slug = "the-execute-of-java-static-code-block"
tags = ["java"]
title = "Java静态代码块的执行"

+++



# 问题及总结
关于静态代码块其实是面试时老生常谈的问题，虽然面试时问了我也大概知道，但是在用的时候还是踩了个小坑。我想通过调用类的静态变量来触发静态代码块的调用，但是没有成功。

总结下静态代码块能执行的条件：

1. 第一次初始化对象
2. 第一次调用静态方法
3. 第一次调用静态代码块下面的静态变量

<!--more-->

```java
            public class ConfigHandler {
                    public static p1 = “p1”;

                    static{
                        System.out.println("this is a static code block");
                    }

                    public static p2 = “p2”;
                    public static p3 ;

                    public static init(){}
            }
```

static中`System.out.println("this is a static code block");`可以执行的情况如下：

1. new ConfigHandler();
2. System.out.println(ConfigHandler.p2);
3. System.out.println(ConfigHandler.p3)
4. ConfigHandler.init(); //在代码中的位置任意

输出p1时static代码块不执行，即调用静态代码块前面的静态变量，静态代码块不会执行。



