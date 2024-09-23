---
title: "ARTS-Week-4"
date: 2019-03-31T23:59:42+08:00
draft: false
categories: ["Developer"] # Developer AI之遥 科幻Fans 智慧之光 星云尘埃 酷cool玩
slug: "arts-week-4"
tags: ["ARTS"]
author: "Payne Xu"

---

1. Algorithm：每周至少做一个 leetcode 的算法题
2. Review：阅读并点评至少一篇英文技术文章
3. Tip：学习至少一个技术技巧
4. Share：分享一篇有观点和思考的技术文章

[ARTS挑战](https://www.zhihu.com/question/301150832)

## Algorithm

### 顺序输出1-n的素数，当n比较大时怎么办

参考：

- [素数筛选算法](https://cloud.tencent.com/developer/article/1173783)
- [O(N)的素数筛选法和欧拉函数](https://blog.csdn.net/Dream_you_to_life/article/details/43883367)

**方法一：** 通过过滤所有质数的，小于n的所有倍数的方式剔除合数，但是会有重复剔除的情况，例如对于12的过滤： `2 * 6、3 * 4` 的情况下都会过滤

```java
public int countPrimes(int n) {
    // 性质：每一合数都可以写成一个质数乘以一个数的形式
    boolean[] noPrimes = new boolean[n];
    int count = 0;
    for (int i = 2; i < n; i++) {
        if (!noPrimes[i]) {
            count++;
            int power;
            for (int j = 2; (power = i * j) < n; j++) {
                noPrimes[power] = true;
            }
        }
    }
    return count;
}
```

**方法二：** 欧拉线性筛除法。发现便利数组时使用的foreach方式比fori形式慢一倍

```java
public int countPrimes2(int n) {
    // 欧拉线性筛除法：
    // 性质：每一合数都可以以唯一形式被写成质数的乘积，现定义：对于某个范围内的任意合数，只能由其最小的质因子将其从表中删除
    // 当i是primes[j]的整数倍时（i % primes[j] == 0）
    //  1. i = primes[j] * x; next = i * primes[j+1] = primes[j] * x * primes[j+1],
    //  2. 其中primes[j]为next的唯一质因数形式中的最小质数，next应该由primes[j]*y时被筛除，其中i<y<(n/primes[j])
    //  3. 所以不需要在当前i的情况下删除

    int[] primes = new int[n];
    boolean[] noPrimes = new boolean[n];
    int count =0 ;
    for (int i = 2; i < n; i++) {
        if (!noPrimes[i]) {
            primes[count++] = i;
        }
        int power;
        for (int j = 0; j < count && (power = i * primes[j]) < n; j++) {
            noPrimes[power] = true;
            if (i % primes[j] == 0) {
                break;
            }
        }
    }
    return count;
}
```

## Review

[MapReduce-1](https://research.google.com/archive/mapreduce-osdi04.pdf)

MapReduce 这种思想很值得学习。通过将任务进行拆分，并行处理各个子任务，得到中间结果，然后对中间结果进行合并的方式是我们优化性能的一个方向。先找到问题的瓶颈点，看看能不能将任务拆分，拆分完了就可以并行处理，有的并行处理没有最终结果，直接就可以结束，有最终结果的可以进行汇总得到最终结果。这个流程在Java世界中，ForkJoin框架很合契合了这种模式。

当然了MapReduce除了带来这种处理问题的思想，更多的是在分布式环境下的任务分配、调度等方面的封装。

## Tip

专业术语：NUMA multi-processor

参考文章：

- [NUMA与UEFI](https://zhuanlan.zhihu.com/p/26078552)
- [NUMA架构的CPU -- 你真的用好了么？](http://cenalulu.github.io/linux/numa/)
- [CPU与内存互联的架构演变](https://blog.51cto.com/tasnrh/1729312)

个人理解：

- 是什么：一种特殊的CPU架构，是多核CPU的场景的一种优化手段，CPU之间用芯片互联总线连接，不同的CPU不能直接访问所有的内存空间，每个CPU只能直接连接就近内存块，要访问其它内存需要通过CPU的互联总线进行中转。
- 为什么： 为什么会有这样的架构？多核常常争抢总线资源用以访问在北桥上的内存，造成很大的延迟。在服务器芯片领域，由于多个CPU共享FSB（前端总线），情况尤为严重。按我自己的理解确实是这样，尤其是CPU有多级缓存，每个CPU都有一块自己的缓存，不同的CPU要通过总线嗅探的技术感知自己的那块缓存是否失效，有时甚至会有总线锁。并且总线是串行的，多个CPU要使用总线只能一个一个来，所以会产生延迟。所以通过对内存进行分块管理，不同的CPU尽量使用自己的内存块，这样就能减少对总线的争抢。
  ![2019-5-12/20190512230919.png](https://fliaping-blog.oss-rg-china-mainland.aliyuncs.com/storage/2019-5-12/20190512230919.png?imageslim)
  ![2019-5-12/20190512231021.png](https://fliaping-blog.oss-rg-china-mainland.aliyuncs.com/storage/2019-5-12/20190512231021.png?imageslim)
- 问题： 但是问题在于当操作系统选择就近分配内存之后，如果就近的内存满了怎么办？因为中转访问其它的内存块是比较慢的，为了性能，默认就是对就近内存进行淘汰，这就导致了明明内存还足够就开始频繁进行换页，这就变成了一个坑，当踩到的时候性能就急剧下降。
- 如何解决：通过Interleave的策略，将内存的Page打散到各个CPU Core上，可能会有疑问，假如有4个核，那么3/4都要通过中转来访问，那不就慢了。原因是Linux服务器的大多数workload分布都是随机的：即每个线程在处理各个外部请求对应的逻辑时，所需要访问的内存是在物理上随机分布的。也就是说同一块内存，这一秒是CPU1访问，下一秒可能就是CPU2访问。这样均匀之后性能反而有所提升。

## Share

NotImplementException