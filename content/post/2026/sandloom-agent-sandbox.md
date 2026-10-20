---
title: "每一个 Agent 都有一个容器？轻量进程沙箱降低你的成本。"
date: 2026-10-20T09:00:00+08:00
draft: false
categories: ["AI之遥"]
slug: "sandloom-agent-sandbox"
tags: ["Agent", "Sandbox", "Sandloom", "Bubblewrap", "工程实践"]
author: "Payne Xu"
toc: true
description: "将工作区和执行进程拆开：4C8G 起步的 Sandloom 如何复用 worker 与依赖，接续多轮任务，以及资源成本、隔离和恢复的取舍。"
---

Agent 改几行代码、跑一次测试，为什么要为每个会话常驻一套执行环境？

我们把工作区和执行进程拆开，做了 **Sandloom**：**4C8G 起步，按普通应用部署，多个工作区共用 worker，命令按需执行。** 现在开源了。

项目的公开压测里，50 个空闲沙箱没有新增进程。它适合改代码、跑测试、处理文件；需要保留浏览器会话或完整内存状态，则要选另一种方案。

这篇讲清楚三个问题：为什么选进程隔离，资源省在哪里，以及哪些任务适合用。

项目地址：[github.com/fliaping/sandloom](https://github.com/fliaping/sandloom)。

![Agent Sandbox：轻装上阵，4C8G 起步，普通应用就能部署](https://fliaping-blog.oss-rg-china-mainland.aliyuncs.com/storage/2026-10-20/21-41/sandloom-agent-sandbox/cover.png)

*本文同步自 [X 长文](https://x.com/fliaping/article/2110394441890746418)。*

<!--more-->

## 1. 为什么要自己做一个 Agent 沙箱

让 Agent 改代码，它会读文件、安装依赖、跑测试。让它生成报告，它会下载数据、写 Python、输出图表。模型决定下一步，真正执行这些动作的，还是程序。

程序总要有个地方跑。

直接放在用户电脑上，一条写错的命令就可能改到真实文件；放进业务服务，又可能影响已有依赖和其他进程。即使用户可信，Agent 拉取的仓库、安装的包、处理的输入也未必可信。我们需要一个隔离环境，限制它能看到什么、能改什么，以及可以执行多久。

### 1.1 开源方案很多，部署条件却不一定满足

自研之前，我们先看了已有服务和开源项目。E2B、Daytona、OpenSandbox、CubeSandbox 都有值得复用的能力，托管服务还能省下部署和运维工作。[1]

我们遇到的是一个更具体的限制：预算有限，现成服务的接入条件不合适；低成本可用的资源，是能定义 Dockerfile 的普通应用。

我们能在镜像里装依赖、放代码、定义启动命令，再交给应用平台发布。但无法自行连接宿主的 Docker daemon 去管理容器，也拿不到 KVM，不能更换宿主内核。

**能写 Dockerfile，和能管理 Docker，是两回事。**

这也说明，不能简单把问题归结为“开源方案都要求 K8s”。OpenSandbox 有 Docker 路线，CubeSandbox 可以单机部署。真正影响我们的，是能否使用对应的容器或虚拟化后端。机器规格小了，运行权限不一定就有了。[1][2]

所以，自研的目标很明确：沿用已有应用平台，在一个 worker 里管理工作区和隔离进程，减少额外的部署与接入成本。

### 1.2 多轮任务，需要一直保留进程吗

再看一次编码任务：拉仓库，改代码，跑测试，把结果交给模型，然后等下一步。有时等模型，有时等用户确认。

下一轮一定需要上一轮的代码和测试结果，但很多时候，已经不需要那个 shell 进程了。只要文件还在，重新起一个进程，任务就能继续。

![命令结束后保留工作区文件，下一轮按需创建新进程](https://fliaping-blog.oss-rg-china-mainland.aliyuncs.com/storage/2026-10-20/21-41/sandloom-agent-sandbox/task-continuity.png)

于是，我们把两件事拆开：

- **工作区跨轮保留**，存代码、数据、依赖和中间产物。
- **命令按次执行**，有请求时创建进程，执行结束后清理。

这对改代码、跑测试、处理文件和生成报告都比较合适。需要一直保留 REPL 变量、浏览器会话或后台服务的任务，则要另一种执行模型。

## 2. 看看其他方案，哪些地方值得借鉴

选 sandbox，其实在选两层能力：底层怎样隔离，上层怎样管理环境和任务。Bubblewrap 提供的是构造执行环境的工具；E2B、OpenSandbox 这类项目，还提供了实例、文件和生命周期管理。只拿“能不能执行命令”来比，容易漏掉后面这些工程工作。[1][3]

底层的选择也不同。Linux namespace 共享宿主内核，便于使用现成工具；gVisor 用用户态内核处理系统调用；microVM 提供独立 guest kernel；Wasm 则更适合能够适配到其运行时的工具。隔离边界、软件兼容性和部署条件，要放在一起看。[3][4]

我们需要继续跑 Python、Node.js、shell 和已有 CLI，又没有虚拟化后端的控制权，因此选择了 Bubblewrap。它解决执行环境的构造，任务管理仍由我们来做。

不过，选择进程模型之前，有两个问题值得再看一眼：完整环境怎样减少开销？不同任务是不是都需要完整环境？CubeSandbox 和 DeepSeek DSec 分别提供了很好的参照。

### 2.1 CubeSandbox：让完整环境更便宜

如果任务要保留一个 Python REPL，下一轮还要使用内存里的变量，单存文件就不够了。CubeSandbox 采用 microVM，围绕模板、写时复制和暂停恢复，减少完整环境的使用成本。[2]

它的模板比普通镜像多做一步：先启动环境，等服务通过就绪探针，再保存文件系统、内存和运行配置。后续实例从这份状态恢复，复用已经完成的初始化。探针检查到哪一步，模板就准备到哪一步；只检查命令服务，并不能说明 Jupyter 或业务服务也准备好了。[5]

创建实例时，CubeCoW 利用 XFS reflink 共享模板的数据块，发生修改时再写入自己的数据。这样既能减少复制，也能让实例保留独立的可写状态和 guest kernel。[6]

等待阶段则可以暂停，把内存和执行状态保存下来，后续请求再恢复。REPL 变量能够接续，出站网络连接通常需要重建；释放调度容量以后，恢复时也要重新获得容量。[7]

这些能力适合需要完整执行状态的任务。我们当时没选它，主要是部署权限：常规路径需要 KVM，PVM 路径需要专用宿主内核。它也有 4 核、8GB 的体验配置，资源规格本身并不是我们排除它的理由。[2]

### 2.2 DSec：先分任务，再分配环境

CubeSandbox 优化完整环境的成本。DeepSeek 的 DSec（DeepSeek Elastic Compute）技术报告，则进一步按任务选择后端：短函数使用预热容器，仓库任务使用 Container，需要独立内核时使用 Firecracker microVM，Android、GUI 等任务使用完整 VM。[8]

环境也拆成基础镜像、工作区和工具包，公共内容只读复用，修改进入私有层。结合 EROFS 和 3FS 按需读取，可以减少启动时需要搬运的数据。暂停和回收方式则跟随后端变化。[8]

它面向大规模 Agent 训练，不能直接当成一个开箱即用的开源服务。但这个判断顺序值得借鉴：先确认任务要用什么，再决定给多大的环境、保存哪些状态。

我们的任务集中在文件操作和代码执行，所以先把这一条链路做好。将来需要 GUI、独立内核或进程快照，再增加后端。

## 3. Sandloom 怎样实现

### 3.1 一个 worker，管理多个工作区

Sandloom 对外提供 HTTP 和 MCP 接口。调用方用稳定的 sandbox 标识操作文件、提交命令；内部由控制层分配 worker，执行层创建隔离进程。[9]

一个逻辑 sandbox 对应一份工作区，而不是一个常驻容器。代码和中间结果存放在 POSIX 目录里，公共依赖在 worker 上复用。

![多个私有工作区共用 Linux worker，执行进程按需创建，公共依赖只读复用](https://fliaping-blog.oss-rg-china-mainland.aliyuncs.com/storage/2026-10-20/21-41/sandloom-agent-sandbox/sandbox-architecture.png)

例如第一次请求拉取仓库，命令结束，仓库留下。第二次请求修改代码、跑测试，重新创建执行进程，挂入同一份文件。等待期间，没有每个工作区专属的 shell 或执行服务常驻。

这也带来一个直接的使用约定：上一条 shell 的 `export`、当前目录和内存变量，不会自动传到下一条命令。需要接续的状态，要写进文件，或者通过执行参数传入。

### 3.2 身份、文件和进程，分别限制

多个任务放在一个 worker，不能只给它们分几个目录。

每个 sandbox 分配独立的外层 UID/GID。执行器通过 `setpriv` 切换身份、清空补充组、设置 `no_new_privs`，再由 Bubblewrap 创建 namespace 和安排挂载。系统目录与公共依赖只读，任务写自己的工作区。[3][10]

外层 UID 决定进程以谁的身份运行；mount namespace 决定它能看到哪些文件。两层一起使用，才能减少跨工作区访问和误修改。

项目提供 `basic`、`standard`、`strict` 三个隔离档位，逐步增加 PID、cgroup namespace 等能力。启动时实际执行探测命令，再选择可用档位；显式要求的能力无法满足，就拒绝启动。[10]

资源控制单独处理。可以管理 cgroup v2 时，使用内核配额；否则结合 `rlimit` 和 supervisor 管理资源，采样检查的精度与内核限制不同。实际启用了什么，要看 `/healthz`，不能只看档位名字。[10]

### 3.3 依赖准备一次，执行时复用

轻量进程省下的启动时间，不能再花在每轮重新装包上。

Sandloom 把常用依赖准备成只读模板，在 worker 缓存，再挂给不同任务使用。模板按内容 digest 固定版本，工作区、home 和任务自己的缓存独立保存。[11]

比如一批任务都用同一套 Python 数据处理依赖，公共环境只需在 worker 准备一份。各自下载的数据、修改的代码，继续写到自己的目录。

复用只读内容，既减少重复准备，也避免一个任务升级公共依赖，影响其他任务。调用方固定模板版本，还能保证多轮任务用的是同一套环境。

### 3.4 重试、清理和文件恢复

命令跑起来以后，剩下的工程工作一点也不少。网络会超时，worker 会重启，客户端可能拿着旧地址继续请求。

Sandloom 用 `generation` 和 worker epoch 检查请求是否仍对应当前归属，用 `exec_id` 复用执行记录，用 `exec_scope` 协调同一工作区内的并发。重复请求因此有机会拿回已有结果，而不是马上再执行一遍。[9][12]

外部副作用仍要由业务保证幂等。脚本已经写入下游，worker 却在保存结果前崩溃，仅靠 sandbox 的执行记录，无法保证下游绝不重复写入。

文件 API 则用目录文件描述符配合 `O_NOFOLLOW` 约束路径，避免检查路径之后，目录被替换成符号链接，最终访问到工作区外。写入通过临时文件和原子替换完成。[10]

等待时可以调用 `suspend`，释放调度名额并保留文件。原目录还在，恢复时直接复用；共享存储可以让其他 worker 访问同一份文件；本地工作区在配置对象存储和对应策略后，可以在挂起时保存快照，再由其他 worker 恢复。[13]

这里恢复的是文件，下一条命令启动新进程。正在执行的任务意外丢失 worker，则需要共享存储或调用方管理的检查点，不能把挂起快照当成实时备份。

### 3.5 企业接入：脚本要代表正确的用户

企业里的 Agent 经常要查数据、读文档、调用业务服务。代码能运行之后，下游还会问：这次操作代表谁？

如果所有脚本共用 worker 的业务账号，用户之间的权限差异就丢了。我们的接入采用 OBO（On-Behalf-Of）委托关系：把发起任务的用户身份带到调用链里，仍由下游检查这位用户的业务权限。[14]

这条链路有三种身份，各管一层：

- 服务身份决定哪个接入方可以调用 Sandbox API。
- 用户委托身份决定脚本代表谁访问业务资源。
- Linux UID 决定进程能访问哪些本地文件。

我们也适配了已有 SDK 和服务发现配置，让原来的脚本可以继续使用。接入成本除了调用接口，还包括这些运行环境和权限关系。

公开项目保留 `CredentialBroker` 和运行时扩展接口，企业专有的鉴权、SDK、存储与服务发现适配通过独立插件提供。具体企业适配没有放进开源包，使用者可以按自己的环境接入。[15]

凭据传递也要单独管理，减少它出现在日志和执行记录中的机会。凭据一旦交给脚本，脚本就有可能读取它；权限范围和有效期需要在接入时限定，下一轮执行重新取得有效的委托上下文。

### 3.6 先单副本，再按需要加中间件

起步部署可以只用一个 worker：SQLite 保存元数据，进程内 registry 管理 worker，本地 POSIX 目录保存文件。[16] 我们的轻量场景可以从 4C8G 起步，实际执行并发按任务规划。

并发和副本增加以后，再接 PostgreSQL / MySQL、Redis，以及需要的共享存储或 S3 兼容对象存储。数据库负责控制状态，工作区存实际文件，对象存储放模板和快照，三者的备份不能互相替代。[9][15][16]

普通应用部署仍有运行前提：Linux 环境需要允许相应的 namespace、挂载和身份切换。Dockerfile 能安装工具，无法改变平台的 seccomp、AppArmor 等策略，需要在目标环境里先做探测。[10][16]

满足这些条件，就可以沿用应用平台的构建、发布和扩容方式。Sandloom worker 不需要 Docker socket，也不使用 KVM。

## 4. 部署轻了，资源到底省在哪里

### 4.1 先看项目自己的公开压测

Sandloom 的容量文档已经给出一组可复跑的数据。测试环境是 **14 核 Apple Silicon、24 GiB 内存、Docker Desktop**，容器未设置 CPU 和内存额度，使用 `basic` 隔离。[17]

其中几项比较直观：

- 创建 **50 个空闲沙箱**，容器内存观测增量约 **0.1 MiB**，没有新增 PID。
- 串行执行 `/bin/true`，p50 约 **49 ms**，可以用来观察单条空命令的固定开销。
- 同一测试条件下，短命令吞吐约为 **SQLite 25 次/秒、PostgreSQL 35 次/秒**。

这些数字对应文档里的测试环境，并不是 4C8G 的容量承诺。实际 Python 脚本、测试和编译需要多少资源，还要看任务本身。

它们能支持一个具体判断：空闲工作区不需要常驻执行进程，资源主要随执行并发增长，文件则占磁盘。

压测也暴露了瓶颈。短命令多了，元数据写入会排队，SQLite 的单写者限制开始影响吞吐和尾延迟。增加客户端并发，不一定能多干活。真正接入并发任务时，要选合适的数据库，并观察命令等待多久才开始执行。[17]

### 4.2 用一个简单假设，算算常驻开销

假设有 **100 个 Agent 会话，只有 10 条命令同时执行**。两种方案都计入 1 GiB 公共管理开销，每条执行命令再占 256 MiB；如果每个会话还有一套 64 MiB 的常驻执行服务：

- 每会话一套常驻环境：1 + 100 × 64 / 1024 + 10 × 256 / 1024，约 **9.75 GiB**。
- 共用 worker、命令按需执行：1 + 10 × 256 / 1024，约 **3.5 GiB**。

**这个假设下，运行内存减少约六成。** 同样的资源，就有机会承接更多轻量 Agent 会话。

这是一笔估算，不是同条件对比压测，也没有计入工作区存储。容器方案如果也做暂停、回收或共享执行服务，差距会缩小。省下的是重复常驻的执行开销，真实任务需要的内存不会因此消失。

### 4.3 其他项目，也在优化等待成本

DSec 的生产统计中，约 90% 的容器和 microVM 沙箱，平均 CPU 使用量不超过申请量的 5%。CubeSandbox 的 1,000 个空闲沙箱评测中，单实例摊销内存约 25.7 MB。[8][18]

这两组数据不构成 Sandloom 的性能对比，但说明等待期间的资源占用，确实值得优化。需要接续内存状态，可以做暂停和快照；只需要接续文件，可以让执行进程结束。任务不同，回收方式也应该不同。

## 5. 哪些任务适合用，哪些先别用

如果你在做编码 Agent、数据分析工具或多轮文件处理，任务之间主要靠文件接续，又希望沿用现有 Linux 工具，Sandloom 值得试一试。部署门槛低一些，公共依赖复用，已有 SDK 和鉴权体系也有地方接入。

还有几项取舍需要提前知道：

- **共享内核。** Bubblewrap 这条后端不提供 microVM 的独立内核边界。面对陌生用户运行任意恶意代码，不能把它直接当成完整的安全方案。
- **接续文件。** REPL 内存变量、后台服务、浏览器会话，不会通过工作区恢复自动回来。
- **网络策略要另外配。** 内置后端提供共享 worker 网络或无对外接口的隔离网络，尚未强制执行选择性出口白名单。代理环境变量也不能阻止程序直连。
- **容量按真实任务算。** 磁盘监控和 supervisor 采样不等于内核硬配额；重型编译、高并发执行，仍要规划资源和排队。

这次实现用了 AI Coding，研发投入比较低。Bubblewrap、数据库和现有工具链承担了基础能力，我们主要把精力放在任务接续、执行管理和接入上。后续维护仍要持续投入，尤其是资源控制、出口策略和文件恢复。

Sandloom 已经开源，采用 Apache-2.0 许可证，仓库里有部署文档、HTTP / MCP 接口、Python SDK 和容量测试脚本。如果你的 Agent 也需要一个轻量执行环境，欢迎试用，带着实际任务反馈问题或参与改进。

👉 [github.com/fliaping/sandloom](https://github.com/fliaping/sandloom)

END

## 6. 参考资料

公开资料核对于 2026 年 10 月 14 日。第 4.1 节引用项目文档中的实测，第 4.2 节为假设估算，第 4.3 节为其他项目的独立统计和评测。

- [1] [E2B Runtime](https://github.com/e2b-dev/runtime)、[Daytona](https://github.com/daytonaio/daytona)、[OpenSandbox 部署说明](https://github.com/opensandbox-group/OpenSandbox/blob/main/docs/getting-started/installation.md)。
- [2] [CubeSandbox 项目](https://github.com/TencentCloud/CubeSandbox)与 [PVM 部署说明](https://github.com/TencentCloud/CubeSandbox/blob/master/docs/guide/pvm-deploy.md)。
- [3] [Bubblewrap README](https://github.com/containers/bubblewrap/blob/main/README.md)。
- [4] [gVisor 架构](https://gvisor.dev/docs/architecture_guide/intro/)、[Firecracker 架构](https://github.com/firecracker-microvm/firecracker/blob/main/docs/design.md)、[Wasmtime 安全模型](https://docs.wasmtime.dev/security.html)。
- [5] [CubeSandbox 模板](https://github.com/TencentCloud/CubeSandbox/blob/master/docs/guide/templates.md)。
- [6] [CubeSandbox 架构](https://github.com/TencentCloud/CubeSandbox/blob/master/docs/architecture/overview.md)。
- [7] [CubeSandbox 生命周期](https://github.com/TencentCloud/CubeSandbox/blob/master/docs/guide/lifecycle.md)。
- [8] [DeepSeek DSec 技术报告](https://arxiv.org/html/2609.22978v1)，后端与环境见第 2、3 节，资源统计见第 4.3 节。
- [9] [Sandloom 架构](https://github.com/fliaping/sandloom/blob/main/docs/ARCHITECTURE.md)。
- [10] [Sandloom 隔离与资源控制](https://github.com/fliaping/sandloom/blob/main/docs/ISOLATION.md)。
- [11] [Sandloom 环境模板](https://github.com/fliaping/sandloom/blob/main/docs/TEMPLATES.md)。
- [12] [Sandloom API 与并发执行](https://github.com/fliaping/sandloom#api-flow)。
- [13] [Sandloom 挂起与恢复](https://github.com/fliaping/sandloom/blob/main/docs/SUSPEND_RESUME.md)。
- [14] [OBO 委托流程说明](https://learn.microsoft.com/en-us/entra/identity-platform/v2-oauth2-on-behalf-of-flow)，用于解释用户委托关系。
- [15] [Sandloom 适配与插件](https://github.com/fliaping/sandloom/blob/main/docs/ADAPTERS.md)。
- [16] [Sandloom 部署](https://github.com/fliaping/sandloom/blob/main/docs/DEPLOYMENT.md)。
- [17] [Sandloom 容量与压测数据](https://github.com/fliaping/sandloom/blob/main/docs/SIZING.md)。
- [18] [CubeSandbox 性能评测](https://github.com/TencentCloud/CubeSandbox/blob/master/docs/blog/posts/2026-06-01-cubesandbox-perf-benchmark.md)，空闲密度见第 3.3 节。
