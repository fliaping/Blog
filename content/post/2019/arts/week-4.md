---
title: "ARTS-Week-4"
date: 2019-03-31T23:59:42+08:00
draft: true
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

### 实现简单的HashMap



## Review

[MapReduce](https://research.google.com/archive/mapreduce-osdi04.pdf)

## Tip


## Share