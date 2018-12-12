---
title: "基于oauth2的接口管理设计"
date: 2018-12-12T11:24:44+08:00
draft: true
categories: ["Developer"] # Developer AI之遥 科幻Fans 智慧之光 星云尘埃 酷cool玩
slug: "open-api-management-based-oauth2"
tags: ["oauth2","spring-security"]
author: "Payne Xu"

---
# 前言

当一个系统的外部接入方变得越来越多，业务越来越复杂，帮助接入方排查问题耗费的时间越来越多，就有必要构建一套自助接入的系统。再进一步，就会变成公司战略意义的开放平台。其实通俗的说一般公司的开放平台就是提供一些接口，使得合作伙伴或个人能通过这些接口获得企业的服务、能力、数据。

## 意义

- 减轻外部接入时的人员消耗
- 减轻开发不必要的工作量
- 有利于企业构建相应的生态体系
- 方便对接口进行管控

