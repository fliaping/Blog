---
title: "ARTS-Week-3"
date: 2019-03-31T23:59:42+08:00
draft: false
categories: ["Developer"] # Developer AI之遥 科幻Fans 智慧之光 星云尘埃 酷cool玩
slug: "arts-week-3"
tags: ["ARTS"]
author: "Payne Xu"

---

1. Algorithm：每周至少做一个 leetcode 的算法题
2. Review：阅读并点评至少一篇英文技术文章
3. Tip：学习至少一个技术技巧
4. Share：分享一篇有观点和思考的技术文章

[ARTS挑战](https://www.zhihu.com/question/301150832)

## Algorithm

### 146. LRU Cache

基于LinkedHashMap实现， 重载方法`removeEldestEntry`，判断当size大于缓存容量时删除最老项；另外要注意设置accessOrder=true，就是每次访问一个元素要把元素放到头部

```java
class LRUCache {

    private LinkedHashMap<Integer, Integer> hashMap;

    public LRUCache(int capacity) {
        this.hashMap = new LinkedHashMap(capacity, 1, true) {

            @Override
            protected boolean removeEldestEntry(Map.Entry eldest) {
                return size() > capacity;
            }
        };
    }

    public int get(int key) {
        Integer s = this.hashMap.get(key);
        if (s == null) {
            s = -1;
        }
        return s;
    }

    public void put(int key, int value) {
        this.hashMap.put(key, value);
    }
}
```

基于HashMap+双向链表实现，添加元素，访问元素都要放到链表头部

```java
import java.util.HashMap;
import java.util.Map;

public class LRUCacheBaseHashMap {
    private Map<Object, Entry> cache;
    private Entry head, tail;
    private int capacity;

    public LRUCacheBaseHashMap(int capacity) {
        this.cache = new HashMap<>(capacity, 1);
        this.capacity = capacity;
        this.head = new Entry();
        this.tail = new Entry();
        this.head.next = this.tail;
        this.tail.pre = this.head;
    }

    class Entry {
        private Object key;
        private Object value;
        Entry pre, next;
    }

    public int get(int key) {
        Entry entry = cache.get(key);
        int result;
        if (entry == null) {
            result = -1;
        } else {
            moveToHead(entry);
            result = (int) entry.value;
        }
//            System.out.println("get " + key + ":" + result + " ");
//            printCache();
        return result;
    }

    public void put(int key, int value) {
//            System.out.println("put " + key + ":" + value);
        Entry entry = cache.get(key);
        if (entry == null) {
            if (cache.size() >= capacity) {
                removeTail();
            }
            entry = new Entry();
            entry.key = key;
            entry.value = value;
            cache.put(key, entry);
            addEntry(entry);
        } else {
            entry.value = value;
            moveToHead(entry);
        }
//            printCache();
    }

    private void moveToHead(Entry entry) {
        removeEntry(entry);
        addEntry(entry);
    }

    private void addEntry(Entry entry) {
        entry.pre = head;
        entry.next = head.next;
        head.next.pre = entry;
        head.next = entry;
    }

    private void removeEntry(Entry entry) {
        entry.pre.next = entry.next;
        entry.next.pre = entry.pre;
    }

    private void removeTail() {
        Entry removeEntry = tail.pre;
        if (removeEntry != head) {
            tail.pre = removeEntry.pre;
            removeEntry.pre.next = tail;
            cache.remove(removeEntry.key);
        }
    }

    public void printCache() {
        Entry current = head.next;
        while (true) {
            if (current != tail) {
                System.out.print(current.key + ":" + current.value + " -> ");
                current = current.next;
            } else {
                break;
            }
        }
        System.out.println("\n");
    }

}
```

### 实现超时过期缓存

```java
// 超时过期缓存, 可通过refresher自动更新，类似与guava cache
    public class ExpireCache<K, V> {

        private Map<K, CacheValue> cacheItemMap;
        private Function<K, V> refresher;
        private Integer defaultTtl;

        public ExpireCache(Integer defaultTtl, Function<K, V> refresher) {
            this(defaultTtl);
            this.refresher = refresher;
        }

        public ExpireCache(Integer defaultTtl) {
            this.defaultTtl = defaultTtl;
            this.cacheItemMap = new ConcurrentHashMap<>();
        }

        class CacheValue {
            private V value;
            private Long expireTimestamp;
            private Integer ttl;

            public CacheValue(V value, Integer ttl) {
                this.value = value;
                this.ttl = ttl;
                this.expireTimestamp = System.currentTimeMillis() + ttl;
            }

            public void setExpireTimestamp(Long expireTimestamp) {
                this.expireTimestamp = expireTimestamp;
            }
        }

        public void putCache(K key, V value, Integer ttl) {
            cacheItemMap.put(key, new CacheValue(value, ttl));
        }

        public V getCache(K key) {
            return getCache(key, null);
        }

        public V getCache(K key, Integer ttl) {
            CacheValue cacheValue = cacheItemMap.get(key);
            if (cacheValue == null || cacheValue.expireTimestamp != null && System.currentTimeMillis() > cacheValue.expireTimestamp) {
                if (refresher != null) {
                    V value;
                    try {
                        value = refresher.apply(key);
                        if (value == null) return null;
                    } catch (Exception e) {
                        e.printStackTrace();
                        return null;
                    }
                    return cacheItemMap.compute(key, (k, v) -> {
                        if (v == null) {
                            return new CacheValue(value, ttl == null ? defaultTtl : ttl);
                        } else {
                            if (ttl != null) {
                                v.ttl = ttl;
                            }
                            v.value = value;
                            v.setExpireTimestamp(System.currentTimeMillis() + v.ttl);
                            return v;
                        }
                    }).value;
                } else {
                    return null;
                }
            } else {
                return cacheValue.value;
            }
        }
        
        public static void main(String[] args) {
            Random random = new Random();
            ExpireCache<String, String> expireCache = new ExpireCache<>(5000,
                    key -> key + random.nextInt(100));

            while (true) {
                String value = expireCache.getCache("hello");
                System.out.println(value);
                try {
                    Thread.sleep(1000);
                } catch (InterruptedException e) {
                    e.printStackTrace();
                }
            }

        }
    }
```

## Review

[Java新发展和特性-Dzone](https://dzone.com/guides/java-new-developments-and-features)

这是Dzone出的一份报告，内容主要涉及：

- Java新的发布周期带来的问题和解决方法；
- 开发人员对于不同Java版本的选择
- 新型的GC
- MicroProfile对于cloud的支持
- Java的license的变更，Java8的支持问题
- 当前的Java生态

对于新项目，86%的人会选择Java8, 24%的人选择Java11，老项目83%的人选择Java8,11%的人选择Java11；其它的版本的选择都比较少，也就不说了，目前看来Java8还是占绝大多数份额。如果想使用新的特性，Java11 是一个TLS版本，直接选这个。老项目的话没有太大就还用Java8吧。

Java没六个月发布一个版本的好处有如下几点：

- 更容易计划
  不仅使得语言的开发更好计划，使用者的升级也一样
- 高质量
  频繁的发布意味着一个特性在当前版本没有准备好，可以等到下一次发布，对于语言开发者来说有更小的压力不用慌忙完成某个东西，因此会有高质量的发布。
- 持续提供新特性
  代替三年的停滞之后的超大更新，使用更频繁来添加语言特性、垃圾收集器和性能改善。

license的变更包括：两个Java版本，OpenJDK是免费的，但是需要在新版本发布后的六个月内更新到新版本。OracleJDK是商业版的，需要给Oracle交点钱，估计也不会少了，想想Oracle数据库就知道了。这两种JDK的功能是一致的。

那么很多人可能就会选择OpenJDK，但是要遵守半年内更新的规则，可能会有和现有代码不兼容的情况，但是鉴于自动化测试的广泛应用，这个问题应该不大。前提是公司有成熟的自动化测试流程，但是我估计中小型企业肯定是没有的。

另外一个方案是使用别的JDK分支，例如Amazon Corretto，阿里也有Alibaba Dragonwell版本；但是我觉得这样的策略导致Java社区开始分化，好在Java生态的标准化做的比较好，只要都符合标准，例如Java SE。

GC方面：

- Epsilon Garbage Collector
  是一个no-op gc，就是说是一个假的gc，不做任何工作，应用分配了内存，就不会再被回收了，知道内存撑爆，应用crash。有啥用呢？用于测试及调优，要想榨干应用的性能，使用这个GC可以找出你应用消耗内存的部分。
- The Z Garbage Collector
  ZGC是一个用于超大堆的低延迟GC，从Java 11时添加的功能。ZGC是可以和应用并发工作，使用load barriers来处理引用，但是跟G1的pre-and-post-barriers相比会导致一点延迟。ZGC利用带有颜色的64位指针，有色指针存储了堆对象的额外的信息，所以ZGC要求64位的JVM，假设限制堆大小为4T，那么还有22bit可以存储额外的信息，ZGC使用了4bit来存储额外的信息。
- Shenandoah GC
  Shenandoah 是另一个低延迟的GC，并且停顿时间很短并且可预测。

## Tip

对日志中IP按照请求次数降序排列

`cat /home/admin/logs/webx.log | grep "Login" |awk '{print $3}’| uniq -c | sort -nr`

- cat 打印文件内容
- grep 搜索关键词
- awk '{print $3}' 选择按照空格或Tab划分的第三个项
- uniq -c 对重复行进行合并，并打印重复次数
- sort -nr 按照数值倒序排列

## Share

NotImplementException