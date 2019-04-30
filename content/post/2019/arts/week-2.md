---
title: "ARTS-Week-2"
date: 2019-03-31T23:59:42+08:00
draft: false
categories: ["Developer"] # Developer AI之遥 科幻Fans 智慧之光 星云尘埃 酷cool玩
slug: "arts-week-2"
tags: ["ARTS"]
author: "Payne Xu"

---

1. Algorithm：每周至少做一个 leetcode 的算法题
2. Review：阅读并点评至少一篇英文技术文章
3. Tip：学习至少一个技术技巧
4. Share：分享一篇有观点和思考的技术文章

[ARTS挑战](https://www.zhihu.com/question/301150832)

## Algorithm

### 300. Longest Increasing Subsequence

[300. Longest Increasing Subsequence](https://leetcode.com/problems/longest-increasing-subsequence/)

Given an unsorted array of integers, find the length of longest increasing subsequence.

Example:

```text
Input: [10,9,2,5,3,7,101,18]
Output: 4 
Explanation: The longest increasing subsequence is [2,3,7,101], therefore the length is 4. 
```

Note:

There may be more than one LIS combination, it is only necessary for you to return the length.
Your algorithm should run in O(n2) complexity.
Follow up: Could you improve it to O(n log n) time complexity?

这个题是要求的子序列不是连续的，刚开始没理解题，当做是连续的子序列来求解，跟连续子数组的和或者乘积类似

1. 暴力求解，直接枚举所有的子序列（n^2）
2. 动态规划，dp[i]表示以第i个元素结尾的连续子序列的【最大|最小】【个数|乘积|和|差】

不连续的情况

1. 暴力就无法使用常规枚举，通过对逐个元素，选，不选，递归求解，可以配合剪枝优化，时间复杂度是2^n
2. 使用动态规划：
   1. 状态定义：dp[i] 表示第i个元素选中时，前面所有元素的最大增长序列数
   2. 状态转移：dp[i] = 定义j （0 ~ n-1），若`a[j] < a[i]`, 表示当i选中时，（0～i）序列的最长子序列中包含a[j], 但是后续的数（j~n-1）也有可能在该序列中，所以dp[j]的最大值+1即为dp[i]
   3. 初始化条件：dp[i]最小值是只有i位的元素 = 1；
   4. 时间复杂度：两层循环，n^2

    ```java
    public int lengthOfLIS(int[] nums) {
        int[] dp = new int[nums.length];
        // 初始化为1，即最小值
        for (int i = 0; i < dp.length; i++) {
            dp[i] = 1;
        }
        int maxLength = 0;
        for (int i = 1; i < nums.length; i++) {
            // 遍历 0～i-1, 找到前面可选中的最大dp[i]
            for (int j = 0; j < i; j++) {
                if (nums[i] >= nums[j]) {
                    dp[i] = Math.max(dp[i], dp[j] + 1);
                }
            }
            if (maxLength < dp[i]) {
                maxLength = dp[i];
            }
        }
        return maxLength;
    }
    ```

3. 使用二分法, 一个tricky的办法
   1. 使用一个数组记录最长子序列，但是最后的结果不一定是最长子序列这个结果集，不过结果集的大小即为所求解
   2. 算法过程：维持一个结果集LIS列表，便利原始数据，如果a[i] > LIS[Last_One]，将a[i]追加到LIS后面，否则使用二分法替换比a[i]大的数中的最小的一个，最后LIS列表大小即为结果

    ```java
    public int lengthOfLISBinary(int[] nums) {
        if (nums.length == 0)
            return 0;
        int[] LIS = new int[nums.length];
        LIS[0] = nums[0];
        int endPointer = 0;
        for (int i = 1; i < nums.length; i++) {
            if (nums[i] > LIS[endPointer]) {
                endPointer++;
                LIS[endPointer] = nums[i];
            } else {
                findAndReplace(LIS, nums[i], 0, endPointer);
            }
        }
        return endPointer + 1;
    }
    ```

## Review

原文链接：[How Java 10 changes the way we use Anonymous Inner Classes](https://medium.com/the-java-report/how-java-10-changes-the-way-we-use-anonymous-inner-classes-b3735cf45593)

本文主要内容是讲Java10如何改变我们使用匿名内部类的方式，在我们使用匿名内部类时需要继承一个父类，我们可以在匿名内部类中定义一些方法，可以是重载父类方法，也可以是新定义的方法,如下代码所示：

```java
/* AnonDemo.java */
class Anon { };
public class AnonDemo {
    public static void main (String[] args) {
        Anon anonInner = new Anon () { 
            public String toString() { return "Overriden"; };
            public void doSomething() {
                 System.out.println("Blah");
            };
        };
        System.out.println(anonInner.toString());       
        anonInner.doSomething(); // Won't compile!
    };
};

```

在上面的代码中，创建了一个继承自Anon的匿名内部类的实例，并通过Anon类型变量anonInner引用，该匿名内部类重载了父类的toString方法，新定义了一个doSomething方法，anonInner可以调用toString方法，但是不能调用doSomething，因为anonInner的类型是Anon，并没有doSomething方法, 故不能调用，会发生编译错误。

调用匿名类新定义的方法只有一种方法，如下：

```java
new Anon() { public void foo() { System.out.println("Woah"); } }.foo();
```

但是这样的方式并没有使用多态。通常这样的写法有很大的局限性。不过从Java10引入的var关键字解决了这个问题，如下示例：

```java
/* AnonDemo.java */
class Anon { };
public class AnonDemo {
    public static void main (String[] args) {
          var anonInner = new Anon() {
          public void hello() { 
                   System.out.println("New method here, and you can
                   easily access me in Java 10!\n" +
                  "The class is:  " + this.getClass() 
          ); 
          anonInner.hello(); // Works!!
    };
};
```

通过var关键字的类型推断可以将匿名内部类实例赋值给一个未定义类型的引用，而Java在编译阶段的类型推断可以判定引用的类型，从而可以调用匿名内部类新定义的字段、方法。

## Tips

问题： 在使用Redisson的过程中，从3.7.2 升级至3.10.2之后出现编解码错误的问题，通过Release Log看到，在3.10.0时有如下修改：Improvement - default codec changed to FSTCodec

1. 谨慎对待版本升级，阅读升级所跨区间的Release Log，尤其注意那些不是非常熟悉的类库
2. 由于三方包对于开发者来说是一个黑盒子，三方包难免会有bug，默认配置的更改等情况，这些都是难以避免，如何在三方包不可控的情况下让我们的系统更加可靠？无外乎需要每次升级改动之后进行全面的测试，但是由于常规测试流程长，比较好的解决办法就是自动化测试的使用，任何源码的改动都会触发自动化构建测试，其实这也叫做CI（持续集成）
3. CI的目的为：针对软体系统每个变动，能持续且自动地进行验证。此验证通常包含了：
   - 构建 (build)
   - 测试 (test)
   - 代码分析 (source code analysis)
   - 其他相关工作 (Auto deploy)
4. CI的好处：
   - 降低风险。
   - 减少人工手动的繁杂步骤。
   - 可随时产生一版可部署的版本。
   - 增加系统透明度。
5. 我们公司可能不太重视这块，但是这是保证软件质量很重要的环节。仅仅靠业务测试很难保证软件质量。

## Share

NotImplementException