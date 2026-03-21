# 策略选择器使用指南

## 概述

Universal RAG 提供了 11 种预定义的 RAG 策略，让用户可以根据不同的使用场景自由选择最合适的检索方案。

## 可用策略

### 1. 基础策略

| 策略 | 说明 | 适用场景 |
|------|------|----------|
| `VECTOR_ONLY` | 纯向量检索 | 简单问答，快速语义搜索 |
| `GRAPH_ONLY` | 纯图检索 | 探索概念关系，知识图谱遍历 |
| `HYBRID` | 混合检索 | 平衡语义和结构，通用场景 |

### 2. 高级策略

| 策略 | 说明 | 适用场景 |
|------|------|----------|
| `SEMANTIC_SEARCH` | 语义搜索 | 深度语义理解（需 embedding） |
| `KNOWLEDGE_GRAPH` | 知识图谱增强 | 复杂概念网络探索 |
| `MULTI_HOP` | 多跳推理 | 需要推导的复杂问题 |
| `CONTEXTUAL` | 上下文感知 | 需要全面上下文的回答 |

### 3. 场景优化策略

| 策略 | 说明 | 适用场景 |
|------|------|----------|
| `QA_FOCUSED` | 问答优化 | 快速准确的问答系统 |
| `DOCUMENT_RETRIEVAL` | 文档检索优化 | 大规模文档搜索 |
| `LEARNING_PATH` | 学习路径优化 | 生成结构化学习路径 |
| `CONCEPT_EXPLANATION` | 概念解释优化 | 深入解释概念 |

## 使用方法

### 方法 1: 直接应用策略

```python
from universal_rag import RAGPipeline, RAGConfig, RAGStrategy, RAGStrategySelector

# 创建基础配置
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

### 方法 2: 智能推荐策略

```python
# 根据使用场景自动推荐
strategy = RAGStrategySelector.recommend_strategy("问答")
RAGStrategySelector.apply_strategy(config, strategy)
```

### 方法 3: 查看所有策略

```python
# 列出所有可用策略
strategies = RAGStrategySelector.list_strategies()
for strategy, description in strategies.items():
    print(f"{strategy.value}: {description}")
```

### 方法 4: 对比不同策略

```python
strategies = [
    RAGStrategy.VECTOR_ONLY,
    RAGStrategy.GRAPH_ONLY,
    RAGStrategy.HYBRID
]

for strategy in strategies:
    config = RAGConfig(data_source_type="json", data_source_path="data.json")
    RAGStrategySelector.apply_strategy(config, strategy)

    with RAGPipeline(config) as rag:
        results = rag.search("查询", top_k=5)
        print(f"{strategy.value}: {len(results)} 个结果")
```

## 策略参数对比

| 策略 | 检索方式 | 图检索 | Top-K | 最大跳数 |
|------|---------|--------|-------|---------|
| VECTOR_ONLY | vector | ✗ | 5 | 0 |
| GRAPH_ONLY | graph | ✓ | 10 | 3 |
| HYBRID | hybrid | ✓ | 5 | 2 |
| SEMANTIC_SEARCH | vector | ✗ | 10 | 0 |
| KNOWLEDGE_GRAPH | hybrid | ✓ | 8 | 4 |
| MULTI_HOP | graph | ✓ | 15 | 5 |
| CONTEXTUAL | hybrid | ✓ | 7 | 2 |
| QA_FOCUSED | vector | ✗ | 3 | 0 |
| DOCUMENT_RETRIEVAL | vector | ✗ | 20 | 0 |
| LEARNING_PATH | graph | ✓ | 10 | 6 |
| CONCEPT_EXPLANATION | hybrid | ✓ | 8 | 3 |

## 完整示例

```python
from universal_rag import RAGPipeline, RAGConfig, RAGStrategy, RAGStrategySelector

# 场景 1: 简单问答
config = RAGConfig(data_source_type="json", data_source_path="data.json")
RAGStrategySelector.apply_strategy(config, RAGStrategy.QA_FOCUSED)

with RAGPipeline(config) as rag:
    answer = rag.ask("什么是机器学习？")
    print(answer)

# 场景 2: 学习路径
config = RAGConfig(data_source_type="json", data_source_path="data.json")
RAGStrategySelector.apply_strategy(config, RAGStrategy.LEARNING_PATH)

with RAGPipeline(config) as rag:
    path = rag.get_path(target_id=10)
    for step in path:
        print(f"{step['title']} (距离: {step['distance']})")

# 场景 3: 概念解释
config = RAGConfig(data_source_type="json", data_source_path="data.json")
RAGStrategySelector.apply_strategy(config, RAGStrategy.CONCEPT_EXPLANATION)

with RAGPipeline(config) as rag:
    results = rag.search("深度学习", top_k=5)
    for doc in results:
        print(doc['title'])
```

## 策略选择建议

### 根据数据特点选择

- **有知识图谱关系**: 使用 `GRAPH_ONLY`, `HYBRID`, `KNOWLEDGE_GRAPH`
- **纯文本数据**: 使用 `VECTOR_ONLY`, `SEMANTIC_SEARCH`, `DOCUMENT_RETRIEVAL`
- **结构化知识**: 使用 `LEARNING_PATH`, `CONCEPT_EXPLANATION`

### 根据性能要求选择

- **快速响应**: `QA_FOCUSED` (Top-K=3, 无图检索)
- **全面结果**: `KNOWLEDGE_GRAPH` (Top-K=8, 最大跳数=4)
- **平衡性能**: `HYBRID` (Top-K=5, 最大跳数=2)

### 根据应用场景选择

- **问答系统**: `QA_FOCUSED`
- **搜索引擎**: `DOCUMENT_RETRIEVAL`
- **教育平台**: `LEARNING_PATH`
- **知识库**: `CONCEPT_EXPLANATION`
- **研究工具**: `KNOWLEDGE_GRAPH`

## 自定义策略

如果预定义策略不满足需求，可以手动配置：

```python
config = RAGConfig(
    data_source_type="json",
    data_source_path="data.json",
    retrieval_strategy="hybrid",  # vector, graph, hybrid
    enable_graph=True,
    top_k=10,
    max_hops=3,
    vector_method="tfidf",  # tfidf, embedding
    relation_types=["prerequisite", "related"]
)
```

## 运行示例

```bash
cd universal_rag/examples
python3 example_strategy.py
```

## 总结

Universal RAG 的策略选择器提供了：

✅ **11 种预定义策略** - 覆盖常见使用场景
✅ **智能推荐** - 根据场景自动推荐最佳策略
✅ **灵活切换** - 一行代码切换策略
✅ **参数优化** - 每种策略都经过参数调优
✅ **易于扩展** - 可以自定义新策略

让用户可以根据具体需求，自由选择最合适的 RAG 方案！
