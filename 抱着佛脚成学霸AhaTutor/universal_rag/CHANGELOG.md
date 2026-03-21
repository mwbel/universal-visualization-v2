# Universal RAG - 策略选择功能更新

## 新增功能：自由选择 RAG 方案

现在 Universal RAG 支持用户自由选择不同的 RAG 策略！

### ✨ 核心特性

- **11 种预定义策略** - 覆盖各种使用场景
- **智能推荐系统** - 根据场景自动推荐最佳策略
- **一键切换** - 一行代码即可切换策略
- **参数优化** - 每种策略都经过调优
- **策略对比** - 轻松对比不同策略的效果

### 📊 可用策略

#### 基础策略
- `VECTOR_ONLY` - 纯向量检索（快速语义搜索）
- `GRAPH_ONLY` - 纯图检索（探索概念关系）
- `HYBRID` - 混合检索（平衡语义和结构）

#### 高级策略
- `SEMANTIC_SEARCH` - 语义搜索（深度语义理解）
- `KNOWLEDGE_GRAPH` - 知识图谱增强（复杂概念网络）
- `MULTI_HOP` - 多跳推理（复杂问题推导）
- `CONTEXTUAL` - 上下文感知（全面的答案）

#### 场景优化策略
- `QA_FOCUSED` - 问答优化（快速准确）
- `DOCUMENT_RETRIEVAL` - 文档检索优化（大规模搜索）
- `LEARNING_PATH` - 学习路径优化（结构化学习）
- `CONCEPT_EXPLANATION` - 概念解释优化（深入解释）

### 🚀 快速使用

```python
from universal_rag import RAGPipeline, RAGConfig, RAGStrategy, RAGStrategySelector

# 创建配置
config = RAGConfig(
    data_source_type="json",
    data_source_path="data.json"
)

# 应用策略
RAGStrategySelector.apply_strategy(config, RAGStrategy.QA_FOCUSED)

# 使用
with RAGPipeline(config) as rag:
    answer = rag.ask("你的问题")
```

### 🎯 智能推荐

```python
# 根据场景自动推荐
strategy = RAGStrategySelector.recommend_strategy("问答")
RAGStrategySelector.apply_strategy(config, strategy)
```

### 📈 策略对比

```python
strategies = [RAGStrategy.VECTOR_ONLY, RAGStrategy.GRAPH_ONLY, RAGStrategy.HYBRID]

for strategy in strategies:
    config = RAGConfig(data_source_type="json", data_source_path="data.json")
    RAGStrategySelector.apply_strategy(config, strategy)

    with RAGPipeline(config) as rag:
        results = rag.search("查询", top_k=5)
        print(f"{strategy.value}: {len(results)} 个结果")
```

### 📚 文档

- **完整指南**: [STRATEGY_GUIDE.md](STRATEGY_GUIDE.md)
- **使用示例**: [examples/example_strategy.py](examples/example_strategy.py)
- **策略对比**: 运行 `python3 strategy_selector.py` 查看对比表

### 🔧 新增文件

- `strategy_selector.py` - 策略选择器核心模块
- `examples/example_strategy.py` - 策略使用示例
- `STRATEGY_GUIDE.md` - 策略选择完整指南

### 📊 项目统计

- **总代码量**: 2334 行（+379 行）
- **总文件数**: 17 个（+4 个）
- **策略数量**: 11 种
- **示例代码**: 5 个

### 🎉 使用场景

根据不同需求选择最合适的策略：

| 需求 | 推荐策略 | 特点 |
|------|---------|------|
| 快速问答 | QA_FOCUSED | Top-K=3, 无图检索 |
| 文档搜索 | DOCUMENT_RETRIEVAL | Top-K=20, 大规模检索 |
| 学习路径 | LEARNING_PATH | 最大跳数=6, 强调前置关系 |
| 概念解释 | CONCEPT_EXPLANATION | 混合检索, 包含示例 |
| 知识探索 | KNOWLEDGE_GRAPH | 最大跳数=4, 深度遍历 |

### 🔄 版本更新

**v1.0.0 -> v1.1.0**
- ✅ 新增策略选择器
- ✅ 11 种预定义策略
- ✅ 智能推荐系统
- ✅ 策略对比功能
- ✅ 修复向量检索返回格式问题

---

**更新日期**: 2026-03-15
**作者**: Claude (Anthropic)
