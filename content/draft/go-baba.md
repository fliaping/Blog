+++
author = "Payne Xu"
date = 2018-08-18T04:40:24Z
description = ""
draft = true
slug = "go-baba"
title = "Go BABA review"

+++

## JAVA基础
### 并发
#### Synchronized
两个差不多结合着看
https://juejin.im/entry/589981fc1b69e60059a2156a
https://juejin.im/post/5abc9de851882555770c8c72

#### CAS 
JAVA CAS原理深度分析 http://zl198751.iteye.com/blog/1848575
#### concurrent并发包
- CyclicBarrier
- 阻塞队列BlockingQueue



面试编程题：

1、编程题：设有ｎ个人依围成一圈，从第１个人开始报数，数到第ｍ个人出列，然后从出列的下一个人开始报数，
数到第ｍ个人又出列，…，如此反复到所有的人全部出列为止。设ｎ个人的编号分别为1，2，…，n，
打印出出列的顺序；要求用java实现


```java
/**
    * 该实现可能在实际应用中比较常用，但是n如果非常大的话，内存可能不够装
    */
public void outLineLinkedHashImpl(int n, int m) {
    if (n == 0 || m == 0) {
        return;
    }
    Set<Integer> peoples = new LinkedHashSet<>(n, 1);
    for (int i = 1; i <= n; i++) {
        peoples.add(i);
    }

    int index = 1;
    while (peoples.size() != 0) {
        Iterator<Integer> it = peoples.iterator();
        while (it.hasNext()) {
            int people = it.next();
            if (peoples.size() < m && m % index == 0) {
                System.out.println(people);
                it.remove();
            } else if (index++ == m) {
                System.out.println(people);
                it.remove();
                index = 1;
            }
        }
    }
}

// 其它方法， 保存剔除的人在set中，遍历时忽略
public void testOutLine() {
    Scratch scratch = new Scratch();
    //1,2,3,4,5
    scratch.outLineLinkedHashImpl(5, 3);
    scratch.outLineLinkedHashImpl(6, 4);
    scratch.outLineLinkedHashImpl(0, 4);
}
```

2、有a,b,c,d,e五个线程，a线程必需在b,c,d,e四个线程执行完之后再执行，请编写可运行的程序

```java
// 其它方法：Semaphore实现， locker condition实现
public void threadWaitCountDownLatchImpl() {
    List<String> threadNames = Arrays.asList("b", "c", "d", "e");
    CountDownLatch countDownLatch = new CountDownLatch(threadNames.size());
    Runnable runnable = () -> {
        try {
            int cost = new Random(System.nanoTime()).nextInt(3000);
            Thread.sleep(cost);
            countDownLatch.countDown();
            System.out.println(Thread.currentThread().getName() + "-finished, cost:" + cost);
        } catch (InterruptedException e) {
            e.printStackTrace();
        }

    };

    Stream<Thread> threadStream = threadNames.stream().map(name -> {
        Thread thread = new Thread(runnable);
        thread.setName("thread-" + name);
        return thread;
    });

    Thread thread = new Thread(() -> {
        System.out.println("thread-a-wait-other-thread");
        try {
            countDownLatch.await();
            System.out.println("thread-a-execute-finished");
        } catch (InterruptedException e) {
            e.printStackTrace();
        }
    });
    thread.setName("thread-a");
    thread.start();
    threadStream.forEach(Thread::start);
}
```