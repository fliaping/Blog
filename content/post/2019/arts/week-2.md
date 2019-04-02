---
title: "ARTS-Week-2"
date: 2019-03-31T23:59:42+08:00
draft: true
categories: ["Developer"] # Developer AI之遥 科幻Fans 智慧之光 星云尘埃 酷cool玩
slug: "arts-week-2"
tags: ["ARTS"]
author: "Payne Xu"

---

# ARTS-WEEK-2

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