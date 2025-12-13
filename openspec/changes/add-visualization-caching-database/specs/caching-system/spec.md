# 可视化缓存系统规格说明

## ADDED Requirements

### Requirement: 高性能关键词匹配查询
系统SHALL能够基于用户输入的关键词快速查询数据库，返回已生成的可视化页面。
- **Priority**: High
- **Type**: Functional

#### Scenario: 用户输入精确关键词匹配
**Given**: 用户输入"正弦波"
**When**: 系统查询缓存数据库
**Then**: 返回已存储的正弦波可视化页面（响应时间 < 50ms）
**And**: 标记为缓存命中

#### Scenario: 用户输入模糊关键词匹配
**Given**: 用户输入"画一个波形图"
**When**: 系统进行语义分析和关键词提取
**Then**: 匹配到"正弦波"、"余弦波"等相关可视化
**And**: 返回相似度最高的结果

#### Scenario: 缓存未命中处理
**Given**: 用户输入"新的数学概念xyz"
**When**: 数据库中无匹配记录
**Then**: 调用MockEngine或LLM生成新的可视化
**And**: 将结果存储到数据库中

### Requirement: 智能关键词提取和标准化
系统必须能够从用户自然语言输入中提取核心概念并标准化。
- **Priority**: High
- **Type**: Functional

#### Scenario: 数学表达式提取
**Given**: 输入"画一个y=2x^2+3x+1的函数图像"
**When**: 系统解析数学表达式
**Then**: 提取关键词["二次函数", "抛物线", "math", "equation"]
**And**: 提取参数{"a": 2, "b": 3, "c": 1}

#### Scenario: 中文同义词处理
**Given**: 输入"显示正态分布曲线"和"展示高斯分布"
**When**: 系统进行同义词映射
**Then**: 都映射到标准化关键词["normal_distribution", "gaussian", "概率统计"]

### Requirement: 可视化结果持久化存储
系统必须能够将生成的可视化页面完整存储，包括HTML内容、参数、元数据等。
- **Priority**: High
- **Type**: Functional

#### Scenario: MockEngine结果存储
**Given**: MockEngine生成了正弦波可视化
**When**: 存储服务保存结果
**Then**: 存储HTML内容、参数配置、生成耗时、来源标识(mock)
**And**: 设置合适的缓存过期时间（如30天）

#### Scenario: LLM生成结果存储
**Given**: LLM生成了复杂的统计图表
**When**: 存储服务保存结果
**Then**: 存储完整的HTML/JS代码、提示词、生成参数
**And**: 记录API调用成本和tokens消耗

### Requirement: 缓存过期和清理机制
系统必须能够智能管理缓存生命周期，定期清理过期数据。
- **Priority**: Medium
- **Type**: Functional

#### Scenario: 基于时间的过期策略
**Given**: 缓存记录超过了设定的TTL（如30天）
**When**: 系统执行定期清理任务
**Then**: 自动删除过期记录
**And**: 释放存储空间

#### Scenario: 基于使用频率的清理
**Given**: 存储空间接近阈值
**When**: 触发LRU清理策略
**Then**: 优先清理访问频率低的数据
**And**: 保留热门数据

## MODIFIED Requirements

### Requirement: 修改现有的可视化生成流程
系统必须在现有的MockEngine和LLM生成流程中集成缓存检查和存储。
- **Priority**: High
- **Type**: Functional
- **Modified**: 原有的直接生成流程改为先查询缓存

#### Scenario: 集成到MockEngine
**Given**: MockEngine接收到生成请求
**When**: 执行关键词匹配之前
**Then**: 先查询数据库是否有缓存记录
**And**: 缓存命中直接返回，未命中继续原有流程

#### Scenario: 集成到LLM生成
**Given**: LLM生成完成新的可视化
**When**: 返回结果给前端之前
**Then**: 将结果存储到数据库
**And**: 标记为LLM生成来源

#### Scenario: 修改后端API
**Given**: backend-v2的/api/v2/generate接口被调用
**When**: 处理可视化生成请求
**Then**: 在process_visualization_generation函数中集成缓存逻辑
**And**: 返回响应中包含缓存命中状态

## REMOVED Requirements

无

## Performance Requirements

### 响应时间要求
- **缓存命中查询**: < 50ms (P95)
- **数据库查询**: < 200ms (P95)
- **关键词提取**: < 100ms (P95)
- **存储操作**: < 300ms (P95)

### 吞吐量要求
- **并发查询**: 1000 QPS
- **并发写入**: 500 QPS
- **缓存命中率**: > 80%

## Security Requirements

### 数据访问控制
- **用户隔离**: 不同用户的数据访问隔离
- **API认证**: 所有缓存API需要认证
- **数据脱敏**: 敏感信息不记录或脱敏存储

### 数据完整性
- **事务一致性**: 存储操作使用事务保证一致性
- **备份恢复**: 支持数据备份和灾难恢复
- **并发控制**: 防止并发写入冲突

## Testing Requirements

### 单元测试覆盖率
- **核心服务**: > 90%
- **数据访问层**: > 85%
- **关键词提取**: > 95%

### 集成测试场景
- **端到端缓存查询流程**
- **MockEngine集成测试**
- **并发访问压力测试**
- **数据一致性验证**