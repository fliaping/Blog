+++
author = "Payne Xu"
date = 2017-12-03T22:25:12Z
description = ""
draft = true
slug = "the-quick-deploy-method-of-spring-boot-application-visualization-monitoring"
title = "Spring Boot 应用可视化监控快速搭建方案"

+++

# 概述
有人说没有监控的服务就是裸奔，耍流氓。虽然是玩笑话，但是也体现了监控对于服务的重要性，通过监控，我们可以很容易了解到当前应用的健康状况，业务状况。通过可视化的图表甚至还能防患于未然，提前感知到问题。

相信几乎每个互联网公司都有自己的监控系统，虽然方案不尽相同，但整体流程基本一样，都要经过这几步 `暴露监控项->采集->存储->可视化`。每一步都有很多种软件（库）可供选择，不同的选择组合起来遍形成了各种各样的方案，当然方案之间也有差别，

## 暴露监控项
监控性

## 采集

## 存储

## 可视化
# 方案一（prometheus）
## 简介
## Spring Boot配置
## Prometheus采集数据
## Grafana可视化
## Prometheus进阶（自定义监控项）

# 方案二（telegraf+influxdb）
## 简介


# 参考文章
1. http://www.spring4all.com/article/265
2. https://medium.com/@brunosimioni/near-real-time-monitoring-charts-with-spring-boot-actuator-jolokia-and-grafana-1ce267c50bcc