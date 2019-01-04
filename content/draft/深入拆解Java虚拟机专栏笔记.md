---
title: "深入拆解Java虚拟机专栏笔记"
date: 2019-01-03T17:20:35+08:00
draft: true
categories: ["unnamed"] # Developer AI之遥 科幻Fans 智慧之光 星云尘埃 酷cool玩
slug: "the-note-of-jvm-analysis-deeply"
tags: ["jvm"]
author: "Payne Xu"

---

# 深入拆解Java虚拟机专栏笔记

## Java的基本类型

### 布尔类型

在 Java 虚拟机规范中，boolean 类型则被映射成 int 类型。具体来说，“true”被映射为整数 1，而“false”被映射为整数 0。这个编码规则约束了 Java 字节码的具体实现。

### 正负无穷和NaN

数学上，正无穷：1.0/0.0， 负无穷：-1.0/0.0， 在Java中表示浮点数，有float和double，都是由三部分组成：符号位，指数，尾数，以Float举例，最大值：0x7f7fffff(符号位：0，指数：128，尾数：16777215)，最小值：0x8f7fffff(符号位：1，指数：128，尾数：16777215), 对于正无穷的表示是：最大值+1 = 0x7f800000，对于负无穷的表示是：最小值-1 = 0x8


### 基本类型大小

- 栈帧：局部变量区 + 
- 

