# OpenClaw Agent 开发范式

> 基于小红书自动化Agent的实践  
> 版本: 1.0 | 日期: 2026-03-08

---

## 📋 目录

1. [概述](#概述)
2. [核心理念](#核心理念)
3. [目录结构规范](#目录结构规范)
4. [核心文件说明](#核心文件说明)
5. [开发流程](#开发流程)
6. [最佳实践](#最佳实践)
7. [常见问题](#常见问题)

---

## 概述

本文档提供了一套经过实战验证的 OpenClaw Agent 开发范式，适用于构建任何需要持久化状态、模块化技能、人工审核的自动化Agent。

### 适用场景

- ✅ 内容自动化（抓取、生成、发布）
- ✅ 数据采集与处理
- ✅ 多步骤工作流编排
- ✅ 需要人工审核的自动化任务
- ✅ 跨session持久化的长期项目

---

## 核心理念

### 1. 分离关注点

```
配置 (config/)     - 用户手动设置，很少改动
状态 (state/)      - 程序运行时动态更新
数据 (data/)       - 业务数据（输入/输出/中间结果）
记忆 (memory/)     - 项目历史和开发计划
技能 (skills/)     - 功能模块，可复用
```

### 2. 持久化优先

- 所有重要状态必须写入文件
- 跨session可恢复
- 支持断点续传

### 3. 人机协作

- 关键决策由人类做
- Agent负责执行和建议
- 审核机制保证质量

### 4. 渐进式开发

- 先MVP，后优化
- 模块化设计，逐步扩展
- 每个阶段都可独立运行

---

## 目录结构规范

```
workspace-{project}/
├── config/                    # 配置文件目录
│   ├── api.json              # API密钥配置
│   ├── workflow.json         # 工作流配置
│   └── {module}.json         # 各模块配置
│
├── state/                     # 运行时状态目录
│   ├── {module}_state.json   # 各模块状态文件
│   └── usage_history.json    # 使用历史记录
│
├── data/                      # 业务数据目录
│   ├── input/                # 输入数据（抓取、导入）
│   ├── processed/            # 处理后数据
│   ├── output/               # 输出数据（生成、发布）
│   ├── queue/                # 任务队列
│   │   └── failed/           # 失败任务
│   └── archive/              # 归档数据
│
├── skills/                    # 技能模块目录
│   ├── {skill-name}/
│   │   ├── scripts/          # 脚本文件
│   │   │   ├── main.py       # 主入口
│   │   │   └── utils.py      # 工具函数
│   │   ├── references/       # 参考文档
│   │   │   └── README.md
│   │   └── SKILL.md          # 技能说明
│   └── orchestrator/         # 调度中心（必需）
│       └── scripts/
│           └── workflow.py   # 工作流编排
│
├── logs/                      # 日志文件目录
│   └── YYYY-MM-DD.log        # 按日期分割
│
├── memory/                    # 项目记忆目录
│   ├── MEMORY.md             # 长期记忆（当前状态+计划）
│   └── YYYY-MM-DD.md         # 每日工作日志
│
├── output/                    # 临时输出目录（可选）
│   ├── images/
│   ├── videos/
│   └── reports/
│
├── AGENTS.md                  # Agent工作规则
├── SOUL.md                    # Agent性格定义
├── USER.md                    # 用户信息和偏好
└── README.md                  # 项目说明
```

---

## 核心文件说明

### 1. AGENTS.md - Agent工作规则

**用途：** 定义Agent的工作方式、启动规则、核心任务

**必需内容：**
```markdown
## Session启动规则
- 每次启动前必须读取的文件
- 完成任务后必须更新的文件

## 核心任务
- Agent的主要职责

## 工作流程
- 任务执行的标准流程

## 安全规则
- 禁止的操作
- 需要确认的操作
```

**示例：**
```markdown
## Session启动规则

**每次新session开始工作前，必须先执行：**
1. 阅读 `memory/MEMORY.md` - 了解当前项目状态
2. 如有需要，阅读 `memory/YYYY-MM-DD.md` - 查看最近日志

**每次完成一个阶段或任务后，必须：**
1. 更新 `memory/MEMORY.md` - 更新当前状态
2. 记录到 `memory/YYYY-MM-DD.md` - 记录详细过程
```

---

### 2. SOUL.md - Agent性格定义

**用途：** 定义Agent的沟通风格、性格特点、边界

**必需内容：**
```markdown
## 我是谁
- Agent的角色定位

## 性格
- 性格特点（活泼/严谨/高效等）

## 沟通风格
- 如何与用户交流

## 边界
- 不会做的事情
```

**示例：**
```markdown
## 性格

- **活泼** - 轻松友好的沟通风格
- **严谨** - 涉及专业问题时必须准确
- **高效** - 快速执行任务，不拖延
- **谨慎** - 涉及发布操作时会提醒确认

## 边界

- 我不会擅自发布内容
- 我不会泄露账号信息
- 我会在不确定时问你
```

---

### 3. USER.md - 用户信息和偏好

**用途：** 记录用户的个人信息、偏好设置、开发习惯

**必需内容：**
```markdown
## 基本信息
- 称呼、时区、主要用途

## 业务配置
- 账号信息、频率限制等

## 偏好设置
- 内容风格、目标受众等

## 开发习惯
- 日志输出方式
- 审核渠道
- Session启动规则
```

**示例：**
```markdown
## 开发习惯

- **日志输出**: 脚本运行的终端输出同时写入 `logs/` 目录
- **调试方式**: 实时查看终端输出 + 事后查看日志文件
- **审核渠道**: QQBot推送
- **开发记录**: 每完成一阶段或任务后，立即更新 `memory/MEMORY.md`
- **Session启动**: 新session前必须先阅读 `memory/MEMORY.md`
```

---

### 4. memory/MEMORY.md - 长期记忆

**用途：** 项目的主记忆文件，记录当前状态和下一步计划

**必需内容：**
```markdown
## 项目概述
- 目标、工作流程、技术栈

## 当前状态
- 已完成的模块
- 账号配置
- 已知问题

## 下一步计划
- 待开发功能
- 文件清单
- 工时估算

## 快速使用
- 常用命令

## 项目文件结构
- 目录说明
```

**关键原则：**
- ✅ 精简版，只保留"当前状态 + 下一步计划"
- ✅ 新session必读
- ✅ 每完成一个阶段必须更新
- ❌ 不记录详细历史（历史放在每日日志）

---

### 5. memory/YYYY-MM-DD.md - 每日工作日志

**用途：** 记录每天的详细工作过程、问题和解决方案

**必需内容：**
```markdown
## 今日任务
- 任务概述

## 完成工作
### 1. 任务名称 (时间段)
- 问题描述
- 解决方案
- 结果

## 下一步行动
- 待办事项
```

**关键原则：**
- ✅ 记录详细过程
- ✅ 包含时间戳
- ✅ 记录问题和解决方案
- ✅ 每天一个文件

---

### 6. config/ - 配置文件目录

**用途：** 存放用户手动配置的静态设置

**文件类型：**
- API密钥配置（api.json, bailian.json, glm.json）
- 工作流配置（workflow.json）
- 模块配置（各模块的配置文件）
- 定时任务配置（schedule.json）

**关键原则：**
- ✅ 只存放静态配置
- ✅ 用户手动编辑
- ✅ 很少改动
- ❌ 不存放运行时状态

**示例结构：**
```json
{
  "api_key": "your-api-key",
  "model": "glm-5",
  "base_url": "https://api.example.com"
}
```

---

### 7. state/ - 运行时状态目录

**用途：** 存放程序运行时动态更新的状态数据

**文件类型：**
- 频率控制状态（rate_limiter_state.json）
- 使用历史记录（usage_history.json）
- 会话状态（session_state.json）
- 各模块的运行时状态

**关键原则：**
- ✅ 程序自动生成和更新
- ✅ 记录运行时状态
- ✅ 支持断点续传
- ❌ 用户不手动编辑
- ❌ 初始文件为空或不存在

**示例结构：**
```json
{
  "history": [],
  "last_updated": null
}
```

**运行后自动记录：**
```json
{
  "history": [
    {
      "action": "scrape",
      "topic": "上海旅游",
      "timestamp": "2026-03-08T16:30:00",
      "result": "success"
    }
  ],
  "last_updated": "2026-03-08T16:30:00"
}
```

---

### 8. data/ - 业务数据目录

**用途：** 存放业务相关的输入、输出、中间数据

**子目录规范：**
```
data/
├── input/          # 输入数据（抓取、导入）
├── processed/      # 处理后数据
├── output/         # 输出数据（生成、发布）
├── queue/          # 任务队列
│   └── failed/     # 失败任务
└── archive/        # 归档数据
```

**关键原则：**
- ✅ 按业务流程分类
- ✅ 保留原始数据
- ✅ 失败任务单独存放
- ✅ 定期归档历史数据

**文件命名规范：**
```
{type}_{timestamp}_{id}.json

示例：
scraped_20260308_163000_abc123.json
created_20260308_163500_def456.json
published_20260308_164000_ghi789.json
```

---

### 9. skills/ - 技能模块目录

**用途：** 存放功能模块，每个模块独立、可复用

**模块结构：**
```
skills/{skill-name}/
├── scripts/              # 脚本文件
│   ├── main.py          # 主入口
│   ├── utils.py         # 工具函数
│   └── config.py        # 模块配置
├── references/           # 参考文档
│   ├── README.md        # 使用说明
│   └── API.md           # API文档
└── SKILL.md             # 技能说明
```

**SKILL.md 必需内容：**
```markdown
## 功能描述
- 模块的主要功能

## 使用方式
- 命令行示例
- 参数说明

## 依赖
- 外部依赖
- 其他模块依赖

## 配置
- 配置文件位置
- 配置项说明
```

**关键原则：**
- ✅ 单一职责
- ✅ 独立运行
- ✅ 可复用
- ✅ 文档完善

---

### 10. skills/orchestrator/ - 调度中心（必需）

**用途：** 编排各个技能模块，实现完整工作流

**核心文件：**
```
skills/orchestrator/
└── scripts/
    ├── workflow.py           # 工作流编排
    ├── task_manager.py       # 任务管理
    └── heartbeat_checker.py  # 心跳检查（可选）
```

**workflow.py 核心功能：**
```python
# 1. 串联各个模块
def run_workflow(topic):
    # 抓取
    scraped_data = scraper.scrape(topic)
    
    # 生成
    created_data = creator.create(scraped_data)
    
    # 审核
    review_result = reviewer.review(created_data)
    
    # 发布
    if review_result.approved:
        publisher.publish(created_data)

# 2. 错误处理
# 3. 状态记录
# 4. 日志输出
```

**关键原则：**
- ✅ 统一入口
- ✅ 错误处理
- ✅ 状态记录
- ✅ 日志输出

---

## 开发流程

### Phase 1: 项目初始化

**1. 创建目录结构**
```bash
mkdir -p workspace-{project}/{config,state,data,skills,logs,memory,output}
mkdir -p workspace-{project}/data/{input,processed,output,queue,archive}
```

**2. 创建核心文件**
```bash
touch workspace-{project}/AGENTS.md
touch workspace-{project}/SOUL.md
touch workspace-{project}/USER.md
touch workspace-{project}/memory/MEMORY.md
```

**3. 编写初始文档**
- AGENTS.md - 定义工作规则
- SOUL.md - 定义性格
- USER.md - 记录用户信息
- memory/MEMORY.md - 项目概述

---

### Phase 2: 模块开发

**开发顺序建议：**
```
1. 输入模块（抓取/导入）
   ↓
2. 处理模块（转换/生成）
   ↓
3. 输出模块（发布/导出）
   ↓
4. 调度模块（编排/自动化）
```

**每个模块开发步骤：**
1. 创建模块目录结构
2. 编写 SKILL.md
3. 实现核心功能
4. 编写测试脚本
5. 更新 memory/MEMORY.md

---

### Phase 3: 集成测试

**测试清单：**
- [ ] 单模块测试
- [ ] 端到端测试
- [ ] 错误处理测试
- [ ] 状态持久化测试
- [ ] 跨session恢复测试

---

### Phase 4: 优化迭代

**优化方向：**
- 性能优化
- 错误恢复
- 日志系统
- 监控告警
- 文档完善

---

## 最佳实践

### 1. 路径配置

**统一使用绝对路径：**
```python
from pathlib import Path

# 获取项目根目录
BASE_DIR = Path(__file__).parent.parent.parent.parent

# 配置目录
CONFIG_DIR = BASE_DIR / "config"
STATE_DIR = BASE_DIR / "state"
DATA_DIR = BASE_DIR / "data"
```

**关键原则：**
- ✅ 使用 Path 对象
- ✅ 从脚本位置计算根目录
- ✅ 所有路径相对于根目录
- ❌ 避免硬编码路径

---

### 2. 配置管理

**配置文件加载：**
```python
import json

def load_config(config_name):
    config_path = CONFIG_DIR / f"{config_name}.json"
    with open(config_path, 'r', encoding='utf-8') as f:
        return json.load(f)

# 使用
api_config = load_config("api")
```

**关键原则：**
- ✅ 集中管理配置
- ✅ 配置与代码分离
- ✅ 支持多环境配置
- ❌ 不在代码中硬编码配置

---

### 3. 状态持久化

**状态文件读写：**
```python
def load_state(state_name):
    state_path = STATE_DIR / f"{state_name}.json"
    if not state_path.exists():
        return {"history": [], "last_updated": None}
    
    with open(state_path, 'r', encoding='utf-8') as f:
        return json.load(f)

def save_state(state_name, state_data):
    STATE_DIR.mkdir(parents=True, exist_ok=True)
    state_path = STATE_DIR / f"{state_name}.json"
    
    with open(state_path, 'w', encoding='utf-8') as f:
        json.dump(state_data, f, ensure_ascii=False, indent=2)
```

**关键原则：**
- ✅ 初始状态为空
- ✅ 自动创建目录
- ✅ 原子性写入
- ✅ 错误处理

---

### 4. 数据文件命名

**统一命名规范：**
```python
from datetime import datetime

def generate_filename(prefix, suffix="json"):
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    unique_id = uuid.uuid4().hex[:8]
    return f"{prefix}_{timestamp}_{unique_id}.{suffix}"

# 使用
filename = generate_filename("scraped")
# 输出: scraped_20260308_163000_abc12345.json
```

**关键原则：**
- ✅ 包含时间戳
- ✅ 包含唯一ID
- ✅ 前缀表示类型
- ✅ 便于排序和查找

---

### 5. 日志输出

**日志配置：**
```python
import logging
from datetime import datetime

def setup_logger(name):
    logger = logging.getLogger(name)
    logger.setLevel(logging.INFO)
    
    # 控制台输出
    console_handler = logging.StreamHandler()
    console_handler.setLevel(logging.INFO)
    
    # 文件输出
    log_file = LOGS_DIR / f"{datetime.now().strftime('%Y-%m-%d')}.log"
    file_handler = logging.FileHandler(log_file, encoding='utf-8')
    file_handler.setLevel(logging.DEBUG)
    
    # 格式化
    formatter = logging.Formatter(
        '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )
    console_handler.setFormatter(formatter)
    file_handler.setFormatter(formatter)
    
    logger.addHandler(console_handler)
    logger.addHandler(file_handler)
    
    return logger
```

**关键原则：**
- ✅ 同时输出到控制台和文件
- ✅ 按日期分割日志文件
- ✅ 包含时间戳和级别
- ✅ 便于调试和回溯

---

### 6. 错误处理

**统一错误处理：**
```python
def safe_execute(func, *args, **kwargs):
    try:
        result = func(*args, **kwargs)
        return {"success": True, "data": result}
    except Exception as e:
        logger.error(f"执行失败: {e}", exc_info=True)
        return {"success": False, "error": str(e)}

# 使用
result = safe_execute(scraper.scrape, topic="上海旅游")
if result["success"]:
    data = result["data"]
else:
    print(f"错误: {result['error']}")
```

**关键原则：**
- ✅ 统一返回格式
- ✅ 记录详细错误
- ✅ 不中断流程
- ✅ 便于调试

---

### 7. 记忆更新

**每完成一个阶段：**
```markdown
1. 更新 memory/MEMORY.md
   - 更新"当前状态"
   - 更新"下一步计划"

2. 记录到 memory/YYYY-MM-DD.md
   - 记录详细过程
   - 记录问题和解决方案
   - 记录时间戳
```

**关键原则：**
- ✅ 及时更新
- ✅ 详细记录
- ✅ 便于回溯
- ✅ 支持跨session

---

## 常见问题

### Q1: config/ 和 state/ 如何区分？

**A:** 
- **config/** - 用户手动配置，很少改动（如API密钥、工作流配置）
- **state/** - 程序自动更新，频繁改动（如频率控制状态、使用历史）

**判断标准：**
- 用户会手动编辑吗？ → config/
- 程序运行时会自动更新吗？ → state/

---

### Q3：state/ 和 memory/ 如何区分？

**A:**
- **state/** - "我正在做什么，做到哪里了"（运行时）
- **memory/** - "我做过什么，下一步做什么"（项目级）

---

### Q2: data/ 和 output/ 如何区分？

**A:**
- **data/** - 业务数据，需要持久化保存
- **output/** - 临时输出，可以删除重新生成

**建议：**
- 优先使用 data/，按业务流程分类
- output/ 可选，用于临时文件

---

### Q3: 如何实现跨session恢复？

**A:**
1. 所有状态写入 state/
2. 每次启动读取 memory/MEMORY.md
3. 检查 state/ 中的状态文件
4. 从断点继续执行

**示例：**
```python
def resume_workflow():
    # 1. 读取状态
    state = load_state("workflow")
    
    # 2. 检查是否有未完成任务
    if state.get("pending_task"):
        task = state["pending_task"]
        print(f"恢复任务: {task['name']}")
        
        # 3. 从断点继续
        continue_task(task)
    else:
        print("无待恢复任务")
```

---


## 总结

### 核心要点

1. **分离关注点** - config/state/data/memory 各司其职
2. **持久化优先** - 所有重要状态写入文件
3. **人机协作** - 关键决策由人类做
4. **渐进式开发** - 先MVP，后优化
5. **文档完善** - 每个模块都有说明

### 开发检查清单

- [ ] 目录结构符合规范
- [ ] 核心文件齐全（AGENTS.md, SOUL.md, USER.md）
- [ ] memory/MEMORY.md 记录当前状态
- [ ] 每日工作日志及时更新
- [ ] 配置与状态分离
- [ ] 路径使用绝对路径
- [ ] 错误处理完善
- [ ] 日志输出规范
- [ ] 支持跨session恢复
- [ ] 文档完善

---

*文档版本: 1.0*  
*最后更新: 2026-03-08*  
*基于小红书Agent实践提炼*
