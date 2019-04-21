---
title: "ARTS-Week-5"
date: 2019-04-21T23:11:42+08:00
draft: false
categories: ["Developer"] # Developer AI之遥 科幻Fans 智慧之光 星云尘埃 酷cool玩
slug: "arts-week-5"
tags: ["ARTS"]
author: "Payne Xu"

---

1. Algorithm：每周至少做一个 leetcode 的算法题
2. Review：阅读并点评至少一篇英文技术文章
3. Tip：学习至少一个技术技巧
4. Share：分享一篇有观点和思考的技术文章

[ARTS挑战](https://www.zhihu.com/question/301150832)

## Algorithm

### 43. Multiply Strings

Given two non-negative integers num1 and num2 represented as strings, return the product of num1 and num2, also represented as a string.

Example 1:

```text
Input: num1 = "2", num2 = "3"
Output: "6"
```

Example 2:

```text
Input: num1 = "123", num2 = "456"
Output: "56088"
```

Note:

1. The length of both num1 and num2 is < 110.
2. Both num1 and num2 contain only digits 0-9.
3. Both num1 and num2 do not contain any leading zero, except the number 0 itself.
4. You must not use any built-in BigInteger library or convert the inputs to integer directly.

该题本身有限定条件：

1. 两数长度小于110，其实这个条件对算法的实现没太大意义，就算是更大的长度也要能算，只不过耗时更久点吧
2. 两个数都是数字，那样我们就不用校验了，并且没有符号的，表示都是正数
3. 两个数没有前导的0，除了本身就是0，这样也少了一步去除前导0的步骤

但是下面的算法是假设没有这些限定条件的，也就是说，会有如下情况：

1. 字符串可能不合法，有非数字的字符
2. 有符号位，可正可符，例如：-99，+99
3. 有前导0，例如：-0099，+0099， 0099

在这样的前提下，代码如下。

> Runtime: 7 ms, faster than 78.84% of Java online submissions for Multiply Strings.  
> Memory Usage: 38.8 MB, less than 38.50% of Java online submissions for Multiply Strings.

主要的问题在于内存占用比较大，原因是很多直接对字符串进行操作，需要对字符串进行拷贝，所以占用了空间，可以通过预先分配字符数组的方式，通过操作数组减少内存分配。

另外Discussion中点赞最多的答案, 很巧妙，定义了一个成绩图，通过找到两数中i,j位乘积与乘积图的位置关系，让代码非常简介。[Easiest JAVA Solution with Graph Explanation](https://leetcode.com/problems/multiply-strings/discuss/17605/Easiest-JAVA-Solution-with-Graph-Explanation)

```java
class Solution {
    public String multiply(String num1, String num2) {
        // 校验参数，leetcode本题有限定条件，是不需要校验的
        String num1c = numCheckAndRemoveHeadZero(num1);
        String num2c = numCheckAndRemoveHeadZero(num2);
        if (num1c == null || num2c == null) {
            throw new IllegalArgumentException("参数不合法");
        }

        if (num1c.equals("0") || num2c.equals("0")) {
            return "0";
        }
        // 处理结果的符号
        boolean negative = false;
        int negativeCount = 0;
        if (num1c.charAt(0) == '-') {
            negativeCount++;
            num1c = num1c.substring(1);
        }
        if (num2c.charAt(0) == '-') {
            negativeCount++;
            num2c = num2c.substring(1);
        }
        if (negativeCount == 1) {
            negative = true;
        }
        String result = "0";
        char[] mRes = new char[num2c.length() + 1];
        StringBuilder appendZero = new StringBuilder();
        // 按照乘法运算规则，循环相乘相加
        for (int i = num1c.length() - 1; i >= 0; i--) {
            int multiplyUpNum = 0;
            int oneNum = num1c.charAt(i) - '0';
            if (i < num1c.length() - 1) {
                appendZero.append("0");
            }
            for (int j = num2c.length() - 1; j >= 0; j--) {
                int twoNum = num2c.charAt(j) - '0';
                int jNum = oneNum * twoNum + multiplyUpNum;
                if (jNum > 9) {
                    multiplyUpNum = jNum / 10;
                    mRes[j + 1] = (char) (jNum % 10 + '0');
                } else {
                    multiplyUpNum = 0;
                    mRes[j + 1] = (char) (jNum + '0');
                }
            }
            if (multiplyUpNum == 0) {
                result = add(new String(mRes, 1, mRes.length - 1) + appendZero, result);
            } else {
                mRes[0] = (char) (multiplyUpNum + '0');
                result = add(new String(mRes) + appendZero, result);
            }
        }
        return negative ? '-' + result : result;
    }

    /**
     * 两个正数相加
     */
    private String add(String num1, String num2) {
        String max;
        String min;
        if (num1.length() > num2.length()) {
            max = num1;
            min = num2;
        } else {
            max = num2;
            min = num1;
        }
        int minIndex = min.length() - 1;
        char[] result = new char[max.length() + 1];
        boolean addUp = false;

        for (int maxIndex = max.length() - 1; maxIndex >= 0; maxIndex--) {
            int iChar;
            if (minIndex < 0) {
                iChar = addUp ? max.charAt(maxIndex) + 1 : max.charAt(maxIndex);
            } else {
                int i1 = max.charAt(maxIndex) + min.charAt(minIndex--) - '0';
                iChar = addUp ? i1 + 1 : i1;
            }
            addUp = iChar > '9';
            result[maxIndex + 1] = (char) (addUp ? iChar - 10 : iChar);
        }
        if (addUp) {
            result[0] = '1';
            return new String(result);
        } else {
            return new String(result, 1, result.length - 1);
        }
    }

    /**
     * 带符号的数字检查，并去除前导0
     */
    private String numCheckAndRemoveHeadZero(String num) {
        if (num.length() == 0) {
            return null;
        }
        char firstChar = num.charAt(0);
        boolean negative = false;
        int numBegin = 0;
        if (firstChar == '-') {
            negative = true;
            numBegin = 1;
        } else if (firstChar == '+') {
            numBegin = 1;
        }
        if (numBegin > num.length() - 1) {
            return null;
        }
        int headZeroIndex = numBegin - 1;
        boolean headZeroRemoved = false;
        for (int i = numBegin; i < num.length(); i++) {
            char aChar = num.charAt(i);
            if (aChar < '0' || aChar > '9') {
                return null;
            }
            if (!headZeroRemoved) {
                if (aChar == '0' && i < num.length() - 1) {
                    headZeroIndex = i;
                } else {
                    headZeroRemoved = true;
                }
            }
        }
        String result = num.substring(headZeroIndex + 1);
        if (negative) {
            if (result.equals("0")) {
                result = "0";
            } else {
                result = '-' + result;
            }
        }
        return result;
    }
}
```

### 415. Add Strings

上题中包含了两大数相乘, 直接把add方法拷过去就可以，结果如下：

> Runtime: 1 ms, faster than 100.00% of Java online submissions for Add Strings.  
> Memory Usage: 37.2 MB, less than 95.20% of Java online submissions for Add Strings.

### 用wait-notify写一个解决生产消费者问题

最主要的就是阻塞的条件需要是循环检测，并且在锁代码块内。因为条件，buff这些参数伴随多线程生产消费是会变化的，如果对这些参数的读取和修改不加锁就会产生问题。

```java
public class WaitNotifyImpl {

    String[] buff = new String[10];
    int index = -1;
    final Object lock = new Object();

    class Producer implements Runnable {
        int id = 0;

        @Override
        public void run() {
            String threadName = Thread.currentThread().getName();
            while (true) {
                synchronized (lock) {
                    while (index == buff.length - 1) {
                        try {
                            System.out.println("生产者：" + threadName + ", 缓存满了，等待");
                            lock.wait();
                        } catch (InterruptedException e) {
                            e.printStackTrace();
                        }
                    }
                    String name = threadName + "：" + id;
                    buff[++index] = name;
                    System.out.println("生产数据：" + name + ", index:" + index);
                    lock.notify();
                }
                id++;
                try {
                    Thread.sleep(1000);
                } catch (InterruptedException e) {
                    e.printStackTrace();
                }
            }
        }
    }

    class Consumer implements Runnable {
        @Override
        public void run() {
            String threadName = Thread.currentThread().getName();
            while (true) {
                synchronized (lock) {
                    while (index < 0) {
                        try {
                            System.out.println("消费者：" + threadName + ", 缓存空了，等待");
                            lock.wait();
                        } catch (InterruptedException e) {
                            e.printStackTrace();
                        }
                    }
                    System.out.println("消费数据：" + buff[index] + ", index:" + index);
                    index--;
                    lock.notify();
                }

                try {
                    Thread.sleep(1000);
                } catch (InterruptedException e) {
                    e.printStackTrace();
                }
            }
        }
    }

    public void start() {
        for (int i = 0; i < 10; i++) {
            new Thread(new Producer()).start();
            new Thread(new Consumer()).start();
        }
    }
    public static void main(String[] args) {
        new WaitNotifyImpl().start();
    }
}
```

## Review

原文：[In Search of an Understandable Consensus Algorithm (Extended Version)](https://raft.github.io/raft.pdf)

这是之前看的，做过一次分享，来复习下。PPT: [分布式共识算法Raft](https://docs.google.com/presentation/d/1ACtYhJuu6aX-JiGDlHsz0FTs7QuUUnJ2Xijilirzl1M/edit?usp=sharing)

两个概念，共识(Consensus)和一致性(Consistency), Consensus是达成一致的过程，是手段；Consistency是数据的状态，是结果。达成某种共识不意味着保障了一致性，只能说共识机制能实现某种程度的一致性。

共识是过程，那这个过程怎么进行会有一个**共识算法**, 通常的共识算法就是对某个提案（Proposal），大部分节点达成一致意见的过程。Proposal可以是事件发生的顺序、某个键值对的值、谁是主节点等。

如何达成不同节点对提案的共识呢，这里引出复制状态机（State-Machine-Replication）,假设每个节点从相同的初始状态开始接收相同顺序的指令，则可以保证相同的结果状态。进而推导出共识的关键是对多个事件（指令）的顺序进行共识，即排序。

复制状态机的架构，保存来自客户端的指令log，然后状态机执行这些来自log的顺序唯一的指令序列，最终每个节点产生相同的输出。

那么如何保证所有节点都接收到相同顺序的指令呢？如果不同的指令分散到不同的机器上，我们唯一能确定顺序的就只有时间了，但是机器的时间不是很精确，除非使用原子钟，就算这样也只是在原子钟误差范围内的顺序。所以要想保证真正的顺序，只能让所有的请求都由一台机器来处理，这台机器就是leader，然后让把排好序的指令同步给其它节点，防止自己挂了之后丢消息。

考虑到节点之间通过网络通信，总会有一些节点下线或者没有回应，那么当指令过来时，leader节点先进行持久化，然后把数据同步给其它节点，其实只要获得多数节点的回应既可以认为是安全的，因为共识算法会保证在重新选主的时候多数人能占优势，一定是接收了leader最新消息的节点选主胜出。

Raft共识算法的三个角色：Leader（领导者）、Follower（跟随者）、Candidate（候选人）

更多细节下次再写吧。。。

## Tip

工作上的一个坑：
[Java正则替换异常问题](java-regex-replacement-exception-problem/)

## Share

NoImplementException