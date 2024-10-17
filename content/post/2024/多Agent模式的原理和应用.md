---
title: "多Agent模式的原理和应用"
date: 2024-10-17T21:40:36+08:00
draft: false
categories: ["AI之遥"] # Developer AI之遥 科幻Fans 智慧之光 星云尘埃 酷cool玩 读书 随笔
slug: "multi-agent-introduce"
tags: ["智能体"]
author: "Payne Xu"
---
# 很早以前

## 智能体的定义

**智能体** （Agent）是指能够自主感知环境并采取行动以实现目标的系统或实体。智能体在不同的领域和学科中有不同的定义，但其核心特征是它们能够感知（Perception）、推理（Reasoning）、决策（Decision-making）并采取行动（Action）。在人工智能（AI）领域，智能体通常指那些能够自主与环境互动，并基于感知采取最优决策的计算机程序或系统。

在大模型（如GPT、BERT等）兴起之前，**智能体** 的概念在以下领域中得到了广泛讨论和应用：

1. **控制系统** ：在控制论（Cybernetics）和系统理论中，智能体概念源于自动控制理论，智能体通过感知外部环境并采取适当的措施来实现目标，如恒温器调节温度。
2. **人工智能（AI）** ：早期的AI主要集中在符号推理和逻辑规则的智能体设计上。这些系统基于明确的规则来推理和做出决策，最经典的例子是专家系统。
3. **机器人** ：智能体在机器人领域的应用是显而易见的，机器人通过传感器感知环境，通过算法进行路径规划、目标追踪和任务执行。
4. **多智能体系统** ：多智能体系统（Multi-Agent System，MAS）是由多个智能体组成的复杂系统，这些智能体通过合作、竞争或自组织来完成某个任务。该领域的研究促进了去中心化控制和协同行为的理论发展。

## 智能体的历史

![](https://fliaping-blog.oss-rg-china-mainland.aliyuncs.com/storage/2024-10-17/21-44/20241017_144452_image.png)

智能体（Agent）不是一个新概念，它的历史比大模型更久，1995年出版的经典著作 《Artificial Intelligence：A modern approach》 第一版就以Agent为中心展开。感知器Sensor、行动器 Effector，规划器Planner，Memory， 这些Agent的核心组件或能力在1995-2000年那时就成体系的提出来了。如果说智能体这个概念那就更早了，我让ChatGPT列了出来:

> 1. **1940年代 - 控制论** ：控制论创始人诺伯特·维纳（Norbert Wiener）提出反馈控制系统的概念，开启了智能体系统的早期研究。自动控制系统被认为是最早的简单智能体。
> 2. **1950年代 - 早期人工智能与符号智能体** ：艾伦·图灵提出了“图灵测试”来衡量机器是否具有智能。这一时期的智能体主要是基于符号逻辑和规则的专家系统，如1956年的达特茅斯会议，被认为是AI领域的开端。
> 3. **1960年代 - 博弈论与决策智能体** ：约翰·冯·诺依曼和奥斯卡·摩根斯坦提出博弈论理论，开启了智能体决策理论的发展，智能体通过博弈策略优化其决策行为。
> 4. **1970年代 - 反应式智能体与自适应系统** ：研究人员开始探索更加灵活和适应环境变化的智能体模型，例如 Brooks 提出的反应式智能体（Reactive Agent），不依赖复杂的规则推理，而是基于环境的实时反馈做出反应。
> 5. **1980-1990年代 - 多智能体系统（MAS）** ：该时期多智能体系统兴起，研究如何让多个智能体在分布式环境中协作或竞争，尤其是在机器人学、交通控制和资源分配领域。
> 6. **2000年代 - 自主学习与强化学习智能体** ：机器学习，特别是强化学习（Reinforcement Learning）发展迅速，智能体通过与环境交互自主学习，特别是在动态和未知环境中执行任务。这一阶段的智能体不再依赖预设规则，而是通过反馈（奖赏或惩罚）调整其行为策略。
> 7. **2010年代 - 深度学习与智能体** ：深度学习的崛起让智能体在复杂任务中的表现有了质的飞跃，如AlphaGo在围棋比赛中的成功。此时的智能体不仅能够感知，还能够通过神经网络进行高效决策。
> 8. **2020年代 - 大模型与智能体融合** ：随着GPT、BERT等大语言模型的兴起，智能体的能力得到了进一步增强，尤其在自然语言处理、复杂推理和情境理解方面。如今的智能体不仅能够完成具体任务，还能够与用户进行自然语言交互，表现出类似人类的智能行为。

# 大模型和智能体

![alt text](https://fliaping-blog.oss-rg-china-mainland.aliyuncs.com/storage/2024-10-17/21-44/image-2.png)

## 大模型

大模型只是一个无状态的query-answer machine，LLM和其他神经网络模型一样是个无状态的函数。比如你在和大模型聊过五分钟后和它再聊，与隔上五天再和它聊，它对待你不会有任何差别，有差别也只是temprature参数带来的随机性。

有点像一个哲学家约翰塞尔（John Searle）提出的中文屋子（chinese room）的思想实验:

> 一个对**中文**一窍不通，只说**英语**的人关在一间只有一个开口的封闭房间中。房间里有一本用英文写成的手册，指示该如何处理收到的中文讯息及如何以中文相应地回复。房外的人不断向房间内递进用中文写成的问题。房内的人便按照手册的说明，寻找合适的指示，将相应的中文字符组合成对问题的解答，并将答案递出房间。

如果给大模型的输入没有命中“手册”中的某个知识，就开始胡乱输出，这就是大模型的幻觉问题。

目前LLM的一切状态性处理，都依赖外部的Prompt机制。LLM能和人进行多轮对谈，需要外部系统对整个对话session的状态保持（并回传到prompt里），可以认为大模型本身没有记忆能力，所以也不能存储状态。

## 智能体

![](https://fliaping-blog.oss-rg-china-mainland.aliyuncs.com/storage/2024-10-17/21-44/20241017_144541_image.png)

从功能上看模型具备一定的简单推理能力，为了增强它的能力，就要给它上外挂。之前的研究已经告诉我们方向是智能体。从大模型到智能体，关键的区别就是从无状态的模型变成了有状态的状态机。怎么实现有状态的任务，最常规的做法的就是接入流程(Flow)， 所以随着ChatGPT出现的第一个框架就是Langchain。

回到智能体Agent上，目前基于大模型的Agent核心决策机制围绕着**动态适应**与**持续优化**展开。它使LLM（大型语言模型）能够依据实时变动的**环境信息**，灵活选择并执行恰当的**行动策略**，或对行动结果进行精准**评估与判断**。这一过程通过**多轮迭代**不断重复，每一次迭代都基于对环境的深入理解与上一次执行效果的反馈，旨在逐步逼近并最终达成既定目标。Agent的此种运作模式，确保了其在复杂多变的环境中能够保持高效、灵活与适应性，持续推动任务向成功迈进。

**决策流程：** P（感知）→ P（规划）→ A（行动）

1. 感知（Perception）是指Agent从环境中收集信息并从中提取相关知识的能力。
2. 规划（Planning）是指Agent为了某一目标而作出的决策过程。
3. 行动（Action）是指基于环境和规划做出的动作。
4. 记忆（Memory）能够保存状态，为规划提供上下文。

![](https://fliaping-blog.oss-rg-china-mainland.aliyuncs.com/storage/2024-10-17/21-44/20241014_193027_image.png)

## 多智能体

**专业任务往往是多环节多分支的，在每个环节和分支上，专业化分工会有更高效的ROI。这就产生了从智能体发展到多智能体的必要性** 。通过编程能够执行特定任务、做出决策并协作实现共同目标的智能体。每个智能体都有其独特的技能和角色，利用大型语言模型（LLMs）作为推理引擎，支持高级决策和高效完成任务。它们的自主性和适应性在多智能体系统中的动态交互和流程管理中至关重要。

这些智能体还能够调用外部工具以扩展其能力，从简单的数据检索（如来自API或知识库）到复杂的分析，执行多样化的任务。然而，单一智能体的能力终究有限，因此，多智能体系统越来越受到重视。

> 当然我认为后续的发展有一个趋势是，智能体的能力会融合进单个模型，好处是端到端的能力，稳定性更好，性能也更好，但是定制性会更差.

多智能体通过智能体之间的合作来提高AI Agent的能力，模拟人类团队的协作方式。构建多智能体系统就像组建一个功能团队，每个成员（智能体）担任不同角色，共同完成预定义的项目。

![](https://fliaping-blog.oss-rg-china-mainland.aliyuncs.com/storage/2024-10-17/21-44/20241017_150808_image.png)

在不同环节的职能岗位上，不同的智能体如何通过合理的协同模式组织在一起，这是属于多智能体的核心技术问题，多智能体作为一个团队，需要比直接大模型端到端或单一智能体从头单打独斗更鲁棒，而不能因为组织的复杂性让整体变得更脆弱。

# 多智能体的应用

## 智能体搭建平台

智能体搭建平台国内外目前已经有非常多，国内主要有

- **斑头雁智能科技**：[BetterYeah](https://www.betteryeah.com/agentstore) 「钉钉的团队成员创立」
- **字节扣子：**[Coze](https://www.coze.cn)
- **百度千帆AgentBuilder**: [AgentBuilder](https://agents.baidu.com/)
- **SkyAgents(昆仑万维)**: [天工开放平台](https://model-platform.tiangong.cn/)
- **阿里云魔搭**:[ModelScope](https://modelscope.cn/studios/agent)
- **星火大模型(讯飞)**: [星火智能体创建](https://xinghuo.xfyun.cn/botcenter/createbot)

## 开源框架对比


| 特性         | AutoGen          | CrewAI                         | LangGraph          | Swarm |
| -------------- | ------------------ | -------------------------------- | -------------------- | ------- |
| 框架类型     | 对话智能体       | 角色智能体                     | 基于图的智能体     |       |
| 自主性       | 高度自主         | 高度自主                       | 条件自主           |       |
| 协作         | 集中式群聊       | 具有角色和目标的自主智能体     | 基于条件的循环图   |       |
| 执行         | 由专用智能体管理 | 动态委托，但可以定义层次化流程 | 所有智能体均可执行 |       |
| **适用场景** | 原型设计         | 从开发到生产                   | 详细控制场景       |       |

### AutoGen

AutoGen 专注于对话智能体，具备多智能体协作的能力。其设计理念围绕模拟小组讨论进行，智能体通过发送和接收消息来启动或继续对话。

### CrewAI

CrewAI 结合了AutoGen的高度自主性与结构化角色扮演方法，促进更复杂的智能体交互。它旨在在自主性和结构化流程之间找到平衡，适用于开发和生产阶段。CrewAI在自主性方面与AutoGen相似，但通过摆脱AutoGen“通过消息交互”的限制，提供了更大的灵活性。

### LangGraph

LangGraph 更多地被视作一个图框架，它允许开发者将复杂的智能体交互定义为图。该框架专注于构建有状态的多参与者应用程序，并提供对智能体交互的细粒度控制。可以将其视作构建基于LLM的工作流的框架，用于手动制作个体智能体和多智能体交互。

## 应用示例

### 斯坦福小镇

研究者们成功地构建了一个名为 Smallville 的「虚拟小镇」，25 个 AI 智能体在小镇上生活，他们有工作，会八卦，能组织社交，结交新朋友，甚至举办情人节派对，每个「小镇居民」都有独特的个性和背景故事。

为了让「小镇居民」更加真实，Smallville 小镇还设置了许多公共场景，包括咖啡馆、酒吧、公园、学校、宿舍、房屋和商店。「小镇居民」可以在 Smallville 内随处走动，进入或离开一个场所，甚至去和另一个「小镇居民」打招呼。

![alt text](https://fliaping-blog.oss-rg-china-mainland.aliyuncs.com/storage/2024-10-17/21-44/image-1.png)
论文地址：https://arxiv.org/pdf/2304.03442v1.pdf
项目地址：https://github.com/joonspk-research/generative_agents

### MetaGPT

用 GPTs 组成软件公司，协作处理更复杂的任务

1. MetaGPT输入**一句话的老板需求** ，输出**用户故事 / 竞品分析 / 需求 / 数据结构 / APIs / 文件等**
2. MetaGPT内部包括**产品经理 / 架构师 / 项目经理 / 工程师** ，它提供了一个**软件公司** 的全过程与精心调配的SOP
   1. `Code = SOP(Team)` 是核心哲学。我们将SOP具象化，并且用于LLM构成的团队

![](https://fliaping-blog.oss-rg-china-mainland.aliyuncs.com/storage/2024-10-17/21-44/20241017_192107_image.png)

### CrewAI

基于Langchain的智能体框架，定制性更强，可自定义角色和协同方式。

项目地址：https://github.com/crewAIInc/crewAI

文档地址：https://docs.crewai.com/introduction

![](https://fliaping-blog.oss-rg-china-mainland.aliyuncs.com/storage/2024-10-17/21-44/20241017_200020_image.png)

#### 特点

**🤼‍♀️ 角色扮演代理**：代理可以承担不同的角色和人格，以便更好地理解和与复杂系统交互。

**🤖 自主决策**：代理可以根据给定的上下文和可用工具自主做出决策。

**🤝 无缝协作**：代理可以无缝地协同工作，共享信息和资源以实现共同目标。

**🧠 复杂任务处理**：CrewAI 旨在处理复杂任务，例如多步骤工作流、决策制定和问题解决。

#### 核心概念

- **工具(Tool)** ：工具是智能体执行特定任务所需的辅助手段，如搜索引擎、文档加载器等。CrewAI基于LangChain构建，允许开发者使用LangChain提供的现有工具或自定义新工具，以满足不同任务的需求。
- **任务(Task)** ：任务是智能体需要执行的具体工作单元。在CrewAI中，每个任务都被明确定义，并配备必要的工具和资源。智能体根据任务要求，选择合适的工具和方法来完成工作。
- **智能体(Agent)** ：智能体是CrewAI框架中的核心单元，扮演着团队成员的角色。每个智能体都具备特定的角色、背景故事、目标和记忆。CrewAI中的智能体基于LangChain Agent进行扩展，增加了ReActSingleInputOutputParser以支持更复杂的角色扮演和上下文记忆功能。
- **团队(Crew)** ：团队由多个智能体组成，共同协作以完成特定目标。在CrewAI中，团队成员之间的协作方式通过预定义的流程或策略进行组织和管理，确保任务能够有序、高效地执行。
- **流程(Process)** ：流程定义了团队完成任务的策略和方式。CrewAI框架提供了三种基本流程策略：顺序执行(Sequential)、层次化执行(Hierarchical)和共识过程(Consensual，计划中)。这些策略允许开发者根据任务特性和需求选择合适的协作模式。

**其他的概念**：

- **Flows**：CrewAI Flows（CrewAI 流程）是一项强大的功能，旨在简化人工智能工作流的创建和管理。流程允许开发人员高效地组合和协调编码任务与 Crews，为构建复杂的人工智能自动化提供强大的框架。流程允许您创建结构化的、事件驱动的工作流。它们为连接多个任务、管理状态以及控制人工智能应用程序中的执行流提供无缝方式。使用流程，您可以轻松设计和实现多步骤流程，充分发挥 CrewAI 的全部潜力。

  - **简化工作流创建**：轻松将多个 Crews 和任务链接在一起，以创建复杂的人工智能工作流。
  - **状态管理**：使得在工作流中的不同任务之间管理和共享状态变得非常容易。
  - **事件驱动架构**：基于事件驱动模型构建，允许动态和响应式工作流。
  - **灵活的控制流**：在工作流中实现条件逻辑、循环和分支。
- **Collaboration**：在 CrewAI 中，协作至关重要，它使智能体能够结合各自的技能、共享信息并在任务执行中相互协助，体现了一个真正的合作生态系统。

  - 信息共享：通过共享数据和发现，确保所有智能体都充分了解信息并能有效贡献。
  - 任务协助：允许智能体在特定任务中向具有所需专业知识的同伴寻求帮助。
  - 资源分配：通过在智能体之间高效分配和共享资源来优化任务执行。
- **Memory**：CrewAI 框架引入了一个复杂的记忆系统，旨在显著增强人工智能代理的能力。这个系统包括短期记忆、长期记忆、实体记忆和上下文记忆，每一种都在帮助代理记住、推理和从过去的交互中学习方面发挥着独特的作用。
- **Planning**：CrewAI 中的规划功能允许你为你的团队添加规划能力。启用后，在每次团队迭代之前，所有团队信息都会被发送到一个智能规划器（AgentPlanner），它将逐步规划任务，并且这个计划将被添加到每个任务描述中。

#### 股票分析的实例

> 角色流程：金融分析师 -> 研究分析师 -> 私人投资顾问 -> 中文翻译员
>
> 角色任务：分析金融财务指标 -> 分析新闻事件&财务报告 -> 汇总建议 -> 翻译中文
>
> 工具：网站爬取工具、网络搜索工具、自定义的证券委员会网站的查询工具

agents定义：

```yaml
financial_analyst:
  role: >
    最佳金融分析师
  goal: >
    用你的财务数据和市场趋势分析给所有客户留下深刻印象
  backstory: >
    经验最丰富的金融分析师，拥有丰富的股市分析和投资策略经验，为一个非常重要的客户工作。

research_analyst:
  role: >
    研究分析师
  goal: >
    成为收集和解读数据的最佳者，并用这些数据令客户惊叹
  backstory: >
    被称为最佳研究分析师，你擅长筛选新闻、公司公告和市场情绪。现在你正在为一个非常重要的客户工作。

investment_advisor:
  role: >
    私人投资顾问
  goal: >
    用全面的股票分析和完整的投资建议给客户留下深刻印象
  backstory: >
    你是最有经验的投资顾问，结合各种分析见解来制定战略投资建议。现在你正在为一个需要你印象深刻的重要客户工作。
chinese_translator:
  role: >
    中文翻译员
  goal: >
    自动识别其他语言类型，并将其他语言翻译成中文，如果已经是中文，则不需要翻译。
  backstory: >
    你是最有经验的翻译家，特别擅长英文到中文的翻译，也可以做其他语言到中文的翻译， 并且有专业的证券知识。现在你正在为一个跨国的金融证券公司工作 。
```

tasks定义：

```yaml
financial_analysis:
  description: >
    对{company_stock}的股票财务健康状况和市场表现进行全面分析。这包括检查关键财务指标，如市盈率（P/E ratio）、每股收益（EPS）增长、收入趋势和债务权益比率。此外，还需分析该股票与其行业同行及总体市场趋势的比较表现。

  expected_output: >
    完整报告必须在提供的摘要基础上扩展，包括对股票财务状况的明确评估，其优缺点，以及在当前市场情境中相较于竞争对手的表现。确保使用尽可能最新的数据。

research:
  description: >
    收集并总结与{company_stock}股票及其行业相关的最新新闻文章、新闻稿和市场分析。特别关注任何重大事件、市场情绪和分析师意见。还包括即将到来的事件，如财报等。

  expected_output: >
    一份报告，包括最新新闻的综合总结、市场情绪的任何显著变化及其对股票的潜在影响。还请确保返回股票代码为{company_stock}。确保使用尽可能最新的数据。

filings_analysis:
  description: >
    分析EDGAR上与问题相关的{company_stock}股票的最新10-Q和10-K文件。重点关注管理层讨论与分析、财务报表、内幕交易活动和任何披露的风险等关键部分。提取可能影响股票未来表现的相关数据和见解。

  expected_output: >
    最终答案必须是扩展报告，重点突出这些文件中的重要发现，包括任何风险信号或积极的指标，以便为您的客户服务。

recommend:
  description: >
    审查并综合金融分析师和研究分析师提供的分析。结合这些见解，形成综合的投资建议。您必须考虑所有方面，包括财务健康状况、市场情绪和来自EDGAR文件的定性数据。
  
    确保包括显示内幕交易活动和即将到来的事件，如财报等的部分。

  expected_output: >
    您的最终答案必须是给客户的建议。它应当是一个非常详细的完整报告，提供明确的投资立场和策略，并附有支持性证据。请确保格式美观，以便客户查看。

translate:
  description: >
    将给定的文本翻译成中文。

  expected_output: >
    请确保格式美观，以便客户查看。
```

crew定义

```python
from typing import List
from crewai import Agent, Crew, Process, Task
from crewai.project import CrewBase, agent, crew, task
from langchain_openai import ChatOpenAI

from tools.calculator_tool import CalculatorTool
from tools.sec_tools import SEC10KTool, SEC10QTool

from crewai_tools import WebsiteSearchTool, ScrapeWebsiteTool, TXTSearchTool

from dotenv import load_dotenv
load_dotenv()

from langchain.llms import Ollama
# llm = Ollama(model="qwen2.5:7b")
llm = ChatOpenAI(model='gpt-4o')

@CrewBase
class StockAnalysisCrew:
    agents_config = 'config/agents.yaml'
    tasks_config = 'config/tasks.yaml'
  
    @agent
    def financial_agent(self) -> Agent:
        return Agent(
            config=self.agents_config['financial_analyst'],
            verbose=True,
            llm=llm,
            tools=[
                ScrapeWebsiteTool(),
                WebsiteSearchTool(),
                CalculatorTool(),
                SEC10QTool("BABA"),
                SEC10KTool("BABA"),
            ]
        )
  
    @task
    def financial_analysis(self) -> Task: 
        return Task(
            config=self.tasks_config['financial_analysis'],
            agent=self.financial_agent(),
        )
  

    @agent
    def research_analyst_agent(self) -> Agent:
        return Agent(
            config=self.agents_config['research_analyst'],
            verbose=True,
            llm=llm,
            tools=[
                ScrapeWebsiteTool(),
                # WebsiteSearchTool(), 
                SEC10QTool("BABA"),
                SEC10KTool("BABA"),
            ]
        )
  
    @task
    def research(self) -> Task:
        return Task(
            config=self.tasks_config['research'],
            agent=self.research_analyst_agent(),
        )
  
    @agent
    def financial_analyst_agent(self) -> Agent:
        return Agent(
            config=self.agents_config['financial_analyst'],
            verbose=True,
            llm=llm,
            tools=[
                ScrapeWebsiteTool(),
                WebsiteSearchTool(),
                CalculatorTool(),
                SEC10QTool(),
                SEC10KTool(),
            ]
        )
  
    @task
    def financial_analysis(self) -> Task: 
        return Task(
            config=self.tasks_config['financial_analysis'],
            agent=self.financial_analyst_agent(),
        )
  
    @task
    def filings_analysis(self) -> Task:
        return Task(
            config=self.tasks_config['filings_analysis'],
            agent=self.financial_analyst_agent(),
        )

    @agent
    def investment_advisor_agent(self) -> Agent:
        return Agent(
            config=self.agents_config['investment_advisor'],
            verbose=True,
            llm=llm,
            tools=[
                ScrapeWebsiteTool(),
                WebsiteSearchTool(),
                CalculatorTool(),
            ]
        )

    @task
    def recommend(self) -> Task:
        return Task(
            config=self.tasks_config['recommend'],
            agent=self.investment_advisor_agent(),
        )
  
    @agent
    def translator_agent(self) -> Agent:
        return Agent(
            config=self.agents_config['chinese_translator'],
            verbose=True,
            llm=llm,
            tools=[]
        )

    @task
    def translate(self) -> Task:
        return Task(
            config=self.tasks_config['translate'],
            agent=self.translator_agent(),
        )
  
    @crew
    def crew(self) -> Crew:
        """Creates the Stock Analysis"""
        return Crew(
            agents=self.agents,  
            tasks=self.tasks, 
            process=Process.sequential,
            verbose=True,
        )

```

运行：

```python
def run():
    inputs = {
        'query': '你想分析的公司是哪家？',
        'company_stock': 'BABA',
    }
    return StockAnalysisCrew().crew().kickoff(inputs=inputs)
```

日志片段：

```text
 [2024-10-17 19:05:53][DEBUG]: == Working Agent: 研究分析师

 [2024-10-17 19:05:53][INFO]: == Starting Task: 收集并总结与BABA股票及其行业相关的最新新闻文章、新闻稿和市场分析。特别关注任何重大事件、市场情绪和分析师意见。还包括即将到来的事件，如财报等。



> Entering new CrewAgentExecutor chain...
To collect and summarize the latest news articles, press releases, and market analysis related to Alibaba Group Holding Limited (BABA), I will begin by searching for recent news and updates from credible financial news websites. This will help me gather information on any significant events, market sentiment, and analyst opinions.

Action: Read website content
Action Input: {"website_url": "https://www.cnbc.com/alibaba/"}

----- 省略网页输出

It seems there was an issue accessing the CNBC website for the latest news on Alibaba. I will attempt to gather information from another source to provide the necessary updates on Alibaba (BABA).

Action: Read website content
Action Input: {"website_url": "https://www.reuters.com/companies/9988.HK"} 

----- 省略网页输出

Thought: I have gathered the latest financial data and news from Reuters about Alibaba Group Holding Limited (BABA). This includes stock performance, key financial metrics, company profile, and recent market news. This information will provide a comprehensive overview of Alibaba's current market situation and potential future developments.

Final Answer: Here is the comprehensive report on Alibaba Group Holding Limited (BABA) based on the latest available data:

**Stock Performance:**
- **Latest Trade:** Trading lower at 98.5 HKD, a change of -0.45% as of October 17, 2024.
- **Today's Range:** 97.70 - 102.70 HKD
- **52 Week Range:** 64.60 - 118.70 HKD
- **Market Cap:** 1,894,455 million HKD
- **Forward P/E:** 12.04
- **Dividend Yield:** 0.99%

**Key Financial Metrics:**
- **P/E Excl. Extra Items (TTM):** 26.27
- **Price To Sales (TTM):** 1.83
- **Price To Book (Quarterly):** 1.84
- **Price To Cash Flow (Per Share TTM):** 14.66
- **Total Debt/Total Equity (Quarterly):** 22.17
- **Long Term Debt/Equity (Quarterly):** 18.98
- **Return On Investment (TTM):** 5.78
- **Return On Equity (TTM):** 4.01

**Company Profile:**
Alibaba Group Holding Ltd provides technology infrastructure and marketing platforms. The company operates through seven segments, including China Commerce, International Commerce, Local Consumer Services, Cainiao, Cloud, Digital Media and Entertainment, and Innovation Initiatives and Others. The company is headquartered in Hangzhou, China.

**Executive Leadership:**
- **Chairman of the Board:** Joseph C. Tsai
- **President, Director, Co-Chairman, Alibaba International Digital Commerce Group:** J. Michael Evans
- **Chief Executive Officer, Director:** Yongming Wu

**Recent Market News:**
- **October 16, 2024:** An exclusive EU AI Act checker reveals Big Tech's compliance pitfalls.
- **October 14, 2024:** LVMH investors are jittery over anaemic China demand for European designer goods.
- **October 8, 2024:** US-listed shares of Chinese firms, including Alibaba, slide as stimulus optimism ebbs.

This report provides a detailed overview of Alibaba's current market position and recent activities, offering insights into its financial health and market sentiment.

```

# 未来发展

## gpt-O1

OpenAI 使用了一种大规模的**强化学习**算法，来训练 o1-preview 模型。该算法通过高效的数据训练，让模型学会如何利用“**思维链**”（Chain of Thought）来生产性地思考问题。模型在训练过程中会通过强化学习不断优化其思维链，最终提升解决问题的能力。

通过思维链式的问题拆解，模型可以不断验证、纠错，尝试新的方法，这一过程显著提升了模型的推理能力。

o1的性能随着更多的强化学习（训练时间计算）和更多的思考时间（测试时间计算）而持续提高。

![](https://fliaping-blog.oss-rg-china-mainland.aliyuncs.com/storage/2024-10-17/21-44/20241017_212446_image.png)

感觉就像是在「Debug」，只不过这次 Debug 的不是代码，而是「思维推导」的「过程」，而且有偏差时还会自我修正。相比之前的模型，o1 不再是一个“黑盒”，而是让你看到清晰的思路演变过程。

![](https://fliaping-blog.oss-rg-china-mainland.aliyuncs.com/storage/2024-10-17/21-44/20241017_212643_image.png)

**人类类比：系统1与系统2**

> 系统1与系统2来自诺贝尔经济学奖得主丹尼尔·卡尼曼的《思考，快与慢》，其核心观点包括：
>
> 系统 1：快速、直观、自动的思维方式。
>
> 这种思维模式通常是无意识的，依赖于直觉和经验，能迅速做出反应。例如，看到一个熟悉的面孔时，我们几乎无需思考便能认出它。
>
> 系统 2：慢速、深思熟虑、逻辑性的思维方式。
>
> 这种思维模式需要有意识的努力和思考，用于解决复杂问题或做出深思熟虑的决策。例如，解决数学题或计划长期目标时，我们会调动系统 2 的思维。

![](https://fliaping-blog.oss-rg-china-mainland.aliyuncs.com/storage/2024-10-17/21-44/20241017_213117_image.png)

## Internet of Agents

项目地址：https://github.com/OpenBMB/IoA

🌐 受互联网启发的架构：就像互联网连接人们一样，智能体互联网（IoA）可以连接不同环境中的不同人工智能体。
🤝 自主嵌套团队组建：智能体可以自行组建团队和子团队，以适应复杂任务。
🧩 异构智能体集成：将具有不同技能和背景的智能体聚集在一起，有点像组建一支全明星团队。
⏳ 异步任务执行：智能体可以多任务处理，使整个系统更高效。
🗣️ 自适应对话流：对话流是自主管理的，以保持智能体对话结构化但又灵活。
🔄 可扩展和可延伸：易于添加新类型的智能体或处理不同类型的任务。
