---
title: "ARTS-Week-1"
date: 2019-03-24T16:25:42+08:00
draft: false
categories: ["Developer"] # Developer AI之遥 科幻Fans 智慧之光 星云尘埃 酷cool玩
slug: "arts-week-1"
tags: ["ARTS"]
author: "Payne Xu"

---
# ARTS-WEEK-1

1. Algorithm：每周至少做一个 leetcode 的算法题
2. Review：阅读并点评至少一篇英文技术文章
3. Tip：学习至少一个技术技巧
4. Share：分享一篇有观点和思考的技术文章

## Algorithm

### 120 Triangle

Given a triangle, find the minimum path sum from top to bottom. Each step you may move to adjacent numbers on the row below.
For example, given the following triangle

```text
[
     [2],
    [3,4],
   [6,5,7],
  [4,1,8,3]
]
```

The minimum path sum from top to bottom is 11 (i.e., 2 + 3 + 5 + 1 = 11)
Note:
Bonus point if you are able to do this using only O(n) extra space, where n is the total number of rows in the triangle.

1. 暴力求解，使用DFS遍历所有的路径，记录最小值。时间复杂度为2^n,过不了

```java

```

1. 使用动态规划

```java
// 这是第一次写出的代码，不使用额外空间，叫做in-place algorithm，但是性能只超过20+%，
// 主要原因在于对List的操作比较多
public int minimumTotal(List<List<Integer>> triangle) {
        if (triangle.size() == 0) {
            return 0;
        }
        if (triangle.size() == 1) {
            return triangle.get(0).get(0);
        }
        for (int i = triangle.size() - 2; i >= 0; i--) {
            for (int j = 0; j < triangle.get(i).size(); j++) {
                int left = triangle.get(i + 1).get(j);
                int right = triangle.get(i + 1).get(j + 1);
                triangle.get(i).set(j, Math.min(left, right) + triangle.get(i).get(j));
            }
        }
        return triangle.get(0).get(0);
}
```

```java
// 优化后的代码，额外开辟一个数组来保存状态，减少list的访问，性能超过80+%
public int minimumTotal(List<List<Integer>> triangle) {
        int[] result = new int[triangle.size() + 1];
        for (int i = triangle.size() - 1; i >= 0; i--) {
            for (int j = 0; j < triangle.get(i).size(); j++) {
                result[j] = Math.min(result[j], result[j + 1]) + triangle.get(i).get(j);
            }
        }
        return result[0];
    }
```

### 152. Maximum Product Subarray

Given an integer array nums, find the contiguous subarray within an array (containing at least one number) which has the largest product.

Example 1:

```text
Input: [2,3,-2,4]
Output: 6
Explanation: [2,3] has the largest product 6.
```

Example 2:

```text
Input: [-2,0,-1]
Output: 0
Explanation: The result cannot be 2, because [-2,-1] is not a subarray.
```

1. 暴力求解， 遍历所有的连续子数组，找到最大的
2. 动态规划求解
   1. 定义状态： dp[x][i]，x的取值为{0,1}， dp[0][i]表示以i结束的连续子数组的乘积最大值，dp[1][i]表示以i结束的连续子数组的乘积最小值
   2. 状态转义方程如代码所示。

```java
    public int maxProduct(int[] nums) {
        int[][] dp = new int[2][nums.length];
        dp[0][0] = nums[0];
        dp[1][0] = nums[0];
        for (int i = 1; i < nums.length; i++) {
            if (nums[i] >= 0) {
                dp[0][i] = Math.max(dp[0][i - 1] * nums[i], nums[i]);
                dp[1][i] = Math.min(dp[1][i - 1] * nums[i], nums[i]);
            } else {
                dp[0][i] = Math.max(dp[1][i - 1] * nums[i], nums[i]);
                dp[1][i] = Math.min(dp[0][i - 1] * nums[i], nums[i]);
            }
        }

        int max = dp[0][0];
        for (int i = 1; i < nums.length; i++) {
            if (dp[0][i] > max) {
                max = dp[0][i];
            }
        }
        return max;
    }
```

### 121. Best Time to Buy and Sell Stock

Say you have an array for which the ith element is the price of a given stock on day i.

If you were only permitted to complete at most one transaction (i.e., buy one and sell one share of the stock), design an algorithm to find the maximum profit.

Note that you cannot sell a stock before you buy one.

Example 1:

```text
Input: [7,1,5,3,6,4]
Output: 5
Explanation: Buy on day 2 (price = 1) and sell on day 5 (price = 6), profit = 6-1 = 5.
             Not 7-1 = 6, as selling price needs to be larger than buying price.
```

Example 2:

```text
Input: [7,6,4,3,1]
Output: 0
Explanation: In this case, no transaction is done, i.e. max profit = 0.
```

1. 只做一次遍历，记录最小值和最大收益，每遍历一个元素计算看看可不可以更新最大收益和最小值

```java
public int maxProfit(int[] prices) {
        if (prices.length == 0) {
            return 0;
        }
        int min = prices[0];
        int maxProfile = 0;
        for (int i = 1; i < prices.length; i++) {
            int profile = prices[i] - min;
            if (profile > maxProfile) {
                maxProfile = profile;
            }
            if (prices[i] < min) {
                min = prices[i];
            }
        }
        return maxProfile;
}
```

## Review

原文：[New Google project offers Kubernetes building blocks for CI/CD](https://www.infoworld.com/article/3373650/new-google-project-offers-kubernetes-building-blocks-for-cicd.html)

算是一篇技术新闻吧，大意是介绍google的一个和Kubernetes相关的项目Tekton，用于云原生的框架，能够快速构建运行在Kubernetes的CI/CD系统。

特点：

1. 能够和现有的系统像Jenkins一起工作
2. 开发者可以构建复杂的pipeline
3. 可以做一些存储、管理和安全的工作
4. 通过store api能够看到测试和构建结果

该项目是Google领导，其它公司参与的项目，属于一个新组建的机构Continuous Delivery Foundation，该机构的项目还包含Jenkins X, Jenkins, and Spinnaker，。该机构隶属于Linux Foundation


## Tip

Java字节码学习，Lambda底层原理 ：

- Lambda 表达式也是借助 invokedynamic 来实现的
- 在编译过程中，Java 编译器会对 Lambda 表达式进行解语法糖（desugar），生成一个方法来保存Lambda 表达式的内容。该方法的参数列表不仅包含原本 Lambda 表达式的参数，还包含它所捕获的变量。
- 第一次执行 invokedynamic 指令时，它所对应的启动方法会通过 ASM 来生成一个适配器类。这个适配器类实现了对应的函数式接口，在我们的例子中，也就是 IntUnaryOperator。启动方法的返回值是一个 ConstantCallSite，其链接对象为一个返回适配器类实例的方法句柄。
- 如果该 Lambda 表达式没有捕获其他变量，那么可以认为它是上下文无关的。因此，启动方法将新建一个适配器类的实例，并且生成一个特殊的方法句柄，始终返回该实例。
- 如果该 Lambda 表达式捕获了其他变量，那么每次执行该 invokedynamic 指令，我们都要更新这些捕获了的变量，以防止它们发生了变化。为了保证 Lambda 表达式的线程安全，我们无法共享同一个适配器类的实例。因此，在每次执行 invokedynamic 指令时，所调用的方法句柄都需要新建一个适配器类实例。


## Share

公司KPI要求，技术分享，本周主要是做PPT，将我学习的专栏《深入拆解Java虚拟机》分享给组内的同学： [深入拆解Java虚拟机](https://docs.google.com/presentation/d/14UaO-4cMZTW6sS4iK2MKuV8nojlXLJZLwdPjpGbJxTU/edit?usp=sharing)