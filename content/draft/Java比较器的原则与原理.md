---
title: "Java比较器的原则与原理"
date: 2025-01-23T11:35:13+08:00
draft: true
categories: ["unnamed"] # Developer AI之遥 科幻Fans 智慧之光 星云尘埃 酷cool玩 读书 随笔
slug: "type the permlink"
tags: ["unnamed"]
author: "Payne Xu"

---

线上跑了一段时间的代码，突然出现了报错，如下：

```java
java.lang.IllegalArgumentException: Comparison method violates its general
contract!    at java.util.TimSort.mergeLo(TimSort.java:777) ~[?:1.8.0_192]
    at java.util.TimSort.mergeAt(TimSort.java:514) ~[?:1.8.0_192]
    at java.util.TimSort.mergeCollapse(TimSort.java:441) ~[?:1.8.0_192]
    at java.util.TimSort.sort(TimSort.java:245) ~[?:1.8.0_192]
    at java.util.Arrays.sort(Arrays.java:1512) ~[?:1.8.0_192]
    at java.util.stream.SortedOps$SizedRefSortingSink.end(SortedOps.java:348) ~[?:1.8.0_192]
    at java.util.stream.Sink$ChainedReference.end(Sink.java:258) ~[?:1.8.0_192]
    at java.util.stream.AbstractPipeline.copyInto(AbstractPipeline.java:482) ~[?:1.8.0_192]
    at java.util.stream.AbstractPipeline.wrapAndCopyInto(AbstractPipeline.java:471) ~[?:1.8.0_192]
    at java.util.stream.ReduceOps$ReduceOp.evaluateSequential(ReduceOps.java:708) ~[?:1.8.0_192]
```

问了相关业务同学，他说是新增了一些配置项，发生错误的这段代码就是对配置项进行排序的， 既然报错了，那么问题出在哪呢？

一看这个错误提示，想起来曾经看面试题的时候有这么个知识点，说的是比较器要满足以下条件：
1. 自反性：对于任意的元素 x，x.compareTo(x) 必须返回 0。
2. 对称性：对于任意的元素 x 和 y，如果 x.compareTo(y) 返回 0，那么 y.compareTo(x) 也必须返回 0。
3. 传递性：对于任意的元素 x、y 和 z，如果 x.compareTo(y) 返回 0，y.compareTo(z) 返回 0，那么 x.compareTo(z) 也必须返回 0。

看了下我原始的代码：

```java
//对结果排序，内存排序，满足「可兑换->皮肤不足->已达上限的」，只能实现页内排序，无法实现全局排序
List<ExchangeItemResult> itemList = pairList.stream().map(Pair::getRight)
        .sorted((o1, o2) -> {
            if (StringUtils.compare(o1.getNonExchangeableReason(), o2.getNonExchangeableReason()) == 0) {
                return 0;
            } else if (QUANTITY_NOT_ENOUGH.equalsIgnoreCase(o1.getNonExchangeableReason())) {
                return -1;
            } else {
                return 1;
            }
        })
        .sorted((o1, o2) -> Boolean.compare(o2.getCanExchange(), o1.getCanExchange()))
        .collect(Collectors.toList());
```

重点是