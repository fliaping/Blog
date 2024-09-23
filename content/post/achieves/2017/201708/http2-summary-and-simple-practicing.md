+++
author = "Payne Xu"
categories = ["Developer"]
date = 2017-08-13T02:32:00Z
description = ""
draft = false
slug = "http2-summary-and-simple-practicing"
tags = ["http2"]
title = "http2总结及简单实践"

+++

# HTTP发展历史
在总结http2之前先来回顾下http的发展历史。以下三张图片来自[Jerry Qu](https://imququ.com/post/http2-new-opportunities-and-challenges.html)
## HTTP/0.9 (1991)
![http-0.9-connection-demo](https://o79q42bb0.qnssl.com/blog/http-0.9-connection-demo.png)
<!--more-->
## HTTP/1.0 (1996)
![http-1.0-connection-demo](https://o79q42bb0.qnssl.com/blog/http-1.0-connection-demo.png)

## HTTP/1.1 (1999)
![http-1.1-connection-demo](https://o79q42bb0.qnssl.com/blog/http-1.1-connection-demo.png)

# HTTP通信过程
众所周知，http是基于tcp之上的应用层协议，即在tcp连接建立之后，在tcp的链路上传送数据。

![http-data-transport-sequence-chart](https://o79q42bb0.qnssl.com/blog/http-data-transport-sequence-chart.png)

1. 首先进行TCP连接，三次握手，`C --(SYN{k})--> S`，`S --(ACK{k+1}&SYN{j})--> C`， `C --ACK{j+1}--> S`
2. 客户端发送ACK后，就会发送一个HTTP请求
3. 服务端接受到ACK，确认TCP连接建立，再接着收到HTTP请求，进行解析并将结果返回客户端。
4. 客户端收到HTTP请求结果。

在`HTTP/0.9`和`HTTP/1.0`中，第3步之后，服务端就会关闭连接，也就是TCP的四次挥手，但是在`HTTP/1.1`后，客户端在发送HTTP请求时头部可以带上`Connection：Keep-Alive`，就是告诉服务器保持连接，不要关闭TCP。当`Connection:Close`时，服务器会关闭连接。

`HTTP2`的通信过程无外乎这是这个流程，但是通过TCP传输的数据会有不同，客户端和服务器的行为也有了新的规则。引入了Connection、Stream、Message、Frame这四个概念，从下图大概可以看出他们之间的关系。

![http2-connection-stream-message-frame](https://fliaping-blog.oss-rg-china-mainland.aliyuncs.com/storage/blog/http2-connection-stream-message-frame.png)

* Connection： 其实就是一个TCP连接
* Stream：已建立的连接上的双向字节流
* Message：请求或者响应，由一个或多个帧组合而成
* Frame： Message中的二进制帧，HTTP/2通信的最小单位，后面会详细解释

# HTTP/2 新特性

* 二进制分帧（Binary framing layer）
* 多路复用 (Multiplexing)
* 单一连接（One connection per origin）
* 数据流优先级（Stream prioritization）
* 首部压缩（Header Compression）
* 流控 (Flow control)
* 服务端推送（Server Push）

这些新特性的产生，主要是为了解决之前的问题，我们来对比下之前的`HTTP/1.1`，看看解决了哪些问题

## 二进制分帧（Binary framing layer）

二进制分帧就是把http的数据按照规定的格式进行封装，类似IP和TCP的数据包, 简单画了个承载HTTP2数据的以太帧结构，方便理解。
![the-ethernet-frame-of-overing-http2](https://fliaping-blog.oss-rg-china-mainland.aliyuncs.com/storage/blog/the-ethernet-frame-of-overing-http2.png)

*通过wireshark抓包可以看到http2的结构*

![wireshark-http2-frame](https://fliaping-blog.oss-rg-china-mainland.aliyuncs.com/storage/blog/wireshark-http2-frame.png)

* Length: 无符号的自然数，24个比特表示，仅表示帧负载所占用字节数，不包括帧头所占用的9个字节。默认大小区间为为0~16,384(2^14)，一旦超过默认最大值2^14(16384)，发送方将不再允许发送，除非接收到接收方定义的SETTINGS_MAX_FRAME_SIZE（一般此值区间为2^14 ~ 2^24）值的通知。
* Type: 8个比特表示，定义了帧负载的具体格式和帧的语义，HTTP/2规范定义了10个帧类型，这里不包括实验类型帧和扩展类型帧
* Flags: 8个比特表示，服务于具体帧类型，默认值为0x0。有一个小技巧需要注意，一般来讲，8个比特可以容纳8个不同的标志，比如，PADDED值为0x8，二进制表示为00001000；END_HEADERS值为0x4，二进制表示为00000100；END_STREAM值为0X1，二进制为00000001。可以同时在一个字节中传达三种标志位，二进制表示为00001101，即0x13。因此，后面的帧结构中，标志位一般会使用8个比特表示，若某位不确定，使用问号?替代，表示此处可能会被设置标志位
* R: 在HTTP/2语境下为保留的比特位，固定值为0X0
* Stream Identifier: 无符号的31比特表示无符号自然数。0x0值表示为帧仅作用于连接，不隶属于单独的流。

HTTP2帧中的类型如下：[参考链接](https://www.iana.org/assignments/http2-parameters/http2-parameters.xhtml)

|    Code   | Frame Type                    |  Comment |
|:---------:|-------------------------------|---------|
| 0x00      | DATA                          | 数据帧，主要用来传递消息体 |
| 0x01      | HEADERS                       | 头部帧，主要用于传递消息头 |
| 0x02      | PRIORITY                      | 优先级帧，用于设置流的优先级 |
| 0x03      | RST_STREAM                    | 流结束帧，用于终止异常流 |
| 0x04      | SETTINGS                      | 连接配置参数帧，用于设置参数 |
| 0x05      | PUSH_PROMISE                  | 推送承诺帧，Server推送之前告知Client端 |
| 0x06      | PING                          | 发送端测量最小的RTT时间，检测连接是否可用 |
| 0x07      | GOAWAY                        | 超时帧，通知对端不要在连接上建新流 |
| 0x08      | WINDOW_UPDATE                 | 实现流量控制 |
| 0x09      | CONTINUATION                  | 延续帧，延续一个报头区块 |
| 0x0a      | ALTSVC                        | 通知客户端可用的替代服务 |
| 0xb-0xef  | Unassigned                    | 未分配    |
| 0xf0-0xff | Reserved for Experimental Use | 为实验性用途保留 |

*想了解每一个类型的详细数据结构可以参考我的另一篇文章 [http2帧类型详解](explanation-of-http2-frame-type)*

通过Google Developers中的一个图，我们可以更好的理解，HTTP2的分帧在网络数据中所处的位置，以及和HTTP/1.1的不同之处。

![binary_framing_layer](https://fliaping-blog.oss-rg-china-mainland.aliyuncs.com/storage/blog/binary_framing_layer01.svg)

HTTP/1.1中的头部变成HEADERS类型的帧，请求体/回应体变成DATA类型的帧，通过二进制分帧，将传输的数据使用二进制方式，对比文本方式减少数据量；通过不同类型的帧实现流控、服务器推送等功能。

## 多路复用 (Multiplexing) & 单一连接（One connection per origin）

我们知道在HTTP2之前，我们如果想加快网页资源的加载速度，会采用同时建立多条连接的方式，但是这样每次建立TCP连接效率比较低，并且浏览器往往会限制最大连接数（例如chrome的最大连接数为6）。另外在HTTP/1.1中引入了Pipeline，可以在一个TCP连接中连续发送多个请求，不用关心前面的响应是否到达，但是服务器必须要按照收到请求的顺序来进行响应，这样一旦前面的请求阻塞，后来的请求也将不能及时回应。

HTTP2中，因为新的二进制帧的使用，使得可以轻松复用单个TCP连接。客户端和服务器可以将 HTTP 消息分解为互不依赖的帧，然后交错发送，最后再在另一端把它们重新组装起来。

还是 Google Developers的图：
![multiplexing](https://fliaping-blog.oss-rg-china-mainland.aliyuncs.com/storage/blog/multiplexing01.svg)
可以看到我们可以并行交错的发送多个响应和请求，并且使用同一个TCP连接，没有先后顺序，每个帧中携带有如何组装的信息，客户端会等某项工作所需要的所有的资源都就绪之后再执行。

## 数据流优先级（Stream prioritization）

由于可以进行单连接复用，服务器和客户端的帧都是交错发送，对于发送给服务器的帧，为了解决哪些该先处理，哪些该后处理，因此引入了数据流的优先级，服务器根据优先级来分配资源。例如优先级高的获得更多的CPU和带宽资源。那么优先级是如何标示的呢？还记得前面的帧类型中有一个Type为PRIORITY，这种类型的帧就是为了告诉服务器这个stream的优先级，此外HEADERS帧中也包含了优先级信息。

HTTP/2通过父依赖和权重来标示优先级，每一个stream会标示一个父stream id，没有标示的默认为虚拟的root stream，这样按照这种依赖关系构建一个依赖树，树上层的stream权重较高，同一层的stream会有一个weight来区分资源分配比。。

![stream_prioritization](https://fliaping-blog.oss-rg-china-mainland.aliyuncs.com/storage/blog/stream_prioritization01.svg)

上图是依赖树的一些示例，从左到右，共四棵树。
* 第一个两个stream A 和 B，没有标明父stream，默认依赖虚拟的root节点，A、B处于同一层，优先级相同，根据权重分配资源，A分到`12/(12+4)=3/4`资源，B分到`1/4`资源。
* 第二个D和C有层级结构，C的父级是D，那么服务器拿完整资源优先处理D，然后再处理C。
* 第三个，服务器先处理D，再处理C，然后处理A和B，A分到`3/4`资源，B分到`1/4`资源。
* 第四个，先处理D，再讲资源对半分处理E和C，之后再按照权重处理A和B

*需要注意的一点是，流优先级并不是强制约束，当优先级高的流阻塞时，并不能不让服务器处理优先级低的流*

## 首部压缩 (Header Compression)
由于当前网站内容越来越复杂，单个页面的请求数基本都是几十个甚至上百，每个请求都要带上客户端或者用户的标识，例如：UA，cookie等头部数据，请求数量多了以后，传输http头部消耗的流量也非常可观，并且头部数据中大部分都是相同的，这就是赤裸裸的浪费呀。于是产生了头部压缩技术来节省流量。
![hpack-header-compression-google-io](https://fliaping-blog.oss-rg-china-mainland.aliyuncs.com/storage/2017/08/hpack-header-compression-google-io.png)
* 维护一份相同的静态字典（Static Table），包含常见的头部名称，以及特别常见的头部名称与值的组合
* 维护一份相同的动态字典（Dynamic Table），可以动态地添加内容
* 支持基于静态哈夫曼码表的哈夫曼编码（Huffman Coding）

### 静态字典
静态字典就是把常用的头部映射为字节较短的索引序号，如下图所示，截取了前面几个映射，全部定义可以看[Static Table Definition](https://http2.github.io/http2-spec/compression.html#rfc.section.A)
![part-of-http2-hpack-static-table](https://fliaping-blog.oss-rg-china-mainland.aliyuncs.com/storage/2017/08/part-of-http2-hpack-static-table.png)
例如当头部有个字段是`:method: GET`，那么查表可知，可以用序号2标识，于是这个字段的数据就是`0000010`(2的二进制表示)

### 动态字典
静态字典能表示的头部数据毕竟有限，压缩率也不会高。但是对于一个站点来讲，和某个用户交互时会发生非常多的请求，但是每次请求头部差别不大，会有很多重复数据，因为用户和浏览器的标识是不变的。那么我们可以针对一次HTTP2的连接生成一个可添加映射的动态字典，这样再后面的连接中就可以使用动态字典中的序号。动态字典的生成过程其实就是通知对方添加映射，客户端可以通知服务端添加，反之亦可。

具体的通知方式就是按照协议规定的格式传输数据，具体请看文末参考文章。
### Huffman Coding
哈弗曼编码的特性是出现频率越高，编码长度越短。HTTP2协议中根据大量的请求头部数据样本生成了一种canonical Huffman code，具体在[Huffman Code](https://http2.github.io/http2-spec/compression.html#huffman.code)列出。

## 流控 (Flow control)
HTTP/2 流量控制的目标，在流量窗口初始值的约束下，给予接收端以全权，控制当下想要接受的流量大小。

**算法：**
1. 两端（收发）保有一个流量控制窗口（window）初始值。
2. 发送端每发送一个DATA帧，就把window递减，递减量为这个帧的大小，要是window小于帧大小，那么这个帧就必须被拆分。如果window等于0，就不能发送任何帧
3. 接收端可以发送 WINDOW_UPDATE帧给发送端，发送端以帧内指定的Window Size Increment作为增量，加到window上

## 服务端推送 (Server Push)

**流程:**
1. 客户端在交换 SETTINGS 帧时，设置字段`SETTINGS_ENABLE_PUSH(0x2)`为1显式允许服务器推送
2. 服务器在接受到请求时，分析出要推送的资源，先发个 `PUSH_PROMISE` 帧给浏览器
3. 然后再发送各个response header和response body
4. 浏览器收到 `PUSH_PROMISE` 帧时，根据header block fragment字段里的url，可以知道当前有没有缓存，从而判断是否要接收。如果不要，浏览器就要发送个 `RST_STREAM` 来终止服务器推送

**问题：**
流量浪费。若浏览器有缓存，不要这个推送，就会出现浪费流量的现象，因为整个过程都是异步的，在服务器接收到RST_STREAM时，响应很有可能部份发出或者全部发出了。
# HTTP/2简单实践

Okhttp是一个java生态中有名的的http client，由于其简单易用，性能较好，支持http2。下面用这个工具来实践下，因为本人博客已经在nginx上配置了http2，就拿本博客来实验下。

```java
public class Http2Example {
    final static OkHttpClient client = new OkHttpClient.Builder().build();
    public static void main(String[] args) {
        Request request = new Request.Builder()
                .url("https://blog.fliaping.com")
                .build();
        try {
            Response response = client.newCall(request).execute();
            System.out.println(JSON.toJSONString(response.protocol()));
            System.out.println(response.headers().toString());
            System.out.println(response.body().string());
        } catch (IOException e) {
            e.printStackTrace();
        }
    }
}
```

用过Okhttp的同学就会发现，这跟平时用的方法一样啊，没有任何区别，是的没错，就是没有任何区别。别的不多说，执行下看看，不幸的是你会发现protocol还是http1.1，并不是h2，这是怎么回事？这是因为HTTP2新加入了ALPN（Application Layer Protocol Negotiation）,从字面意思理解就是应用层协议协商，即双方商量下用哪个协议。不幸的是jdk8是在2014年发布的，当时HTTP2协议还没出生，幸运的是通过第三方jar包就可以支持ALPN。另外jdk9已经支持了HTTP2，虽然还没正式发布，但是我们可以试用下JDK 9 Early-Access Builds。

jdk7和jdk8通过添加jvm参数加入第三方alpn支持包，注意版本不能搞错，jdk7使用`alpn-boot-7.*.jar` ，jdk8使用`alpn-boot-8.*.jar`，这里有版本对应关系 [alpn-versions](http://www.eclipse.org/jetty/documentation/current/alpn-chapter.html#alpn-versions)

```bash
# jdk8
-Xbootclasspath/p:/home/payne/Downloads/alpn-boot-8.1.11.v20170118.jar
# jdk7
-Xbootclasspath/p:/home/payne/Downloads/alpn-boot-7.1.3.v20150130.jar
# jdk9
# 使用jdk9平台时，注意okhttp版本大于3.3.0

# https://mvnrepository.com/artifact/org.mortbay.jetty.alpn/alpn-boot
```



# 参考内容

* [Introduction to HTTP/2](https://developers.google.com/web/fundamentals/performance/http2/)
* [HTTP/2 头部压缩技术介绍](https://imququ.com/post/header-compression-in-http2.html)
* [Jerry Qu-专题-HTTP/2相关](https://imququ.com/post/series.html)

[原文链接](https://blog.fliaping.com/http2-summary-and-simple-practicing)
