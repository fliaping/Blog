---
title: "项目梳理 DWD"
date: 2019-04-30T15:10:49+08:00
draft: true
categories: ["Developer"] # Developer AI之遥 科幻Fans 智慧之光 星云尘埃 酷cool玩
slug: "type the permlink"
tags: ["unnamed"]
author: "Payne Xu"

---

【架构和实现细节】，【正常流程和异常流程的处理】，【难点+坑+复盘优化】

DRMS项目

架构

实现

正常、异常流程

难点：

如何提高性能
下单qps200，状态回调一般就是5-10倍，按照数千qps设计，传统线程池模式消耗资源较多，并且这种应用是IO密集型，使用非阻塞模型可以显著提高性能。

客户端接入异构问题
剥离出连接代理层，真正来管理客户端的连接，可以是不同语言的实现，仅仅是一个代理功能，非常轻量级，便于其它语言的接入

broker集群负载均衡问题 - work stealing
采用TaskPool的模式，将所有任务分配到不同的broker，每个broker进行

集群消费时客户端负载均衡
采集每一次推送的指标，包括耗时，结果，利用滑动窗口和椭圆函数计算每个通道权重，

RocketMq客户端问题
异步非阻塞客户端

扩展性问题
存储层、缓存层、集群管理
大topic、海量topic


开放平台项目

接口网关、平台门户、鉴权服务、消息推送、运营平台

信使鸟项目

异地多活架构


配置中心

菜鸟业务

其它小项目

天气、人脸识别、地图服务
