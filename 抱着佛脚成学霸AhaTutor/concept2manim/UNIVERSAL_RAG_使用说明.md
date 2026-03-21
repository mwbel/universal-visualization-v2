# Universal RAG - 通用检索增强生成系统

## 🎉 系统已完成并运行中！

**Web 界面地址**: http://localhost:5001

---

## 📋 系统概述

Universal RAG 是一个功能完整的通用 RAG 模块，可以轻松集成到任何项目中。

### ✨ 核心特性

- ✅ **多数据源支持**: SQLite, JSON, CSV
- ✅ **11 种 RAG 策略**: 从简单向量检索到复杂知识图谱
- ✅ **Web 可视化界面**: 现代化的交互界面
- ✅ **REST API**: 标准的 HTTP 接口
- ✅ **零依赖设计**: 核心功能仅使用 Python 标准库
- ✅ **易于集成**: 3 行代码即可使用

---

## 🚀 三种使用方式

### 1️⃣ Python API（推荐开发者）

```python
from universal_rag import RAGPipeline, RAGConfig, RAGStrategy, RAGStrategySelector

# 创建配置
config = RAGConfig(
    data_source_type="json",
    data_source_path="your_data.json"
)

# 应用策略
RAGStrategySelector.apply_strategy(config, RAGStrategy.HYBRID)

# 使用
with RAGPipeline(config) as rag:
    answer = rag.ask("你的问题")
    results = rag.search("关键词", top_k=10)
    path = rag.get_path(target_id=5)
```

### 2️⃣ Web 界面（推荐新手）

```bash
# 启动 Web 服务
cd universal_rag/web
./start.sh

# 访问界面
# 打开浏览器: http://localhost:5001
```

**Web 界面功能**:
- 📊 策略可视化选择
- 💬 实时问答
- 🔍 文档搜索
- 🎓 学习路径生成
- ⚖️ 策略对比

### 3️⃣ REST API（推荐远程调用）

```bash
# 初始化
curl -X POST http://localhost:5001/api/init \
  -H "Content-Type: application/json" \
  -d '{
    "data_source_type": "json",
    "data_source_path": "examples/sample_data.json",
    "strategy": "hybrid"
  }'

# 问答
curl -X POST http://localhost:5001/api/ask \
  -H "Content-Type: application/json" \
  -d '{"query": "什么是深度学习？"}'

# 搜索
curl -X POST http://localhost:5001/api/search \
  -H "Content-Type: application/json" \
  -d '{"query": "神经网络", "top_k": 5}'
```

---

## 🎯 11 种 RAG 策略

### 基础策略
1. **纯向量检索** (`vector_only`) - 快速语义搜索
2. **纯图检索** (`graph_only`) - 探索概念关系
3. **混合检索** (`hybrid`) - 平衡语义和结构

### 高级策略
4. **语义搜索** (`semantic_search`) - 深度语义理解
5. **知识图谱增强** (`knowledge_graph`) - 深度图遍历
6. **多跳推理** (`multi_hop`) - 复杂推理
7. **上下文感知** (`contextual`) - 上下文理解

### 场景优化
8. **问答优化** (`qa_focused`) - 快速准确回答
9. **文档检索优化** (`document_retrieval`) - 大规模文档搜索
10. **学习路径优化** (`learning_path`) - 生成学习路径
11. **概念解释优化** (`concept_explanation`) - 深入解释概念

### 智能推荐

系统可以根据使用场景自动推荐最佳策略：

```python
strategy = RAGStrategySelector.recommend_strategy("我需要快速回答用户问题")
# 推荐: QA_FOCUSED
```

---

## 📚 项目结构

```
universal_rag/
├── __init__.py                 # 包初始化
├── config.py                   # 配置系统
├── strategy_selector.py        # 策略选择器
│
├── core/                       # 核心模块
│   ├── database.py             # 数据库适配器
│   ├── retriever.py            # 检索引擎
│   └── generator.py            # RAG 生成器
│
├── examples/                   # 示例代码
│   ├── example_json.py         # JSON 示例
│   ├── example_csv.py          # CSV 示例
│   ├── example_basic.py        # SQLite 示例
│   ├── example_strategy.py     # 策略选择示例
│   └── example_templates.py    # 配置模板示例
│
├── web/                        # Web 界面
│   ├── app.py                  # Flask 应用
│   ├── start.sh                # 启动脚本
│   └── templates/
│       └── index.html          # 前端界面
│
└── 文档/
    ├── README.md               # 完整文档
    ├── QUICKSTART.md           # 快速开始
    ├── STRATEGY_GUIDE.md       # 策略指南
    ├── INDEX.md                # 项目索引
    └── COMPLETE_SUMMARY.md     # 功能总结
```

---

## 💡 快速开始

### 步骤 1: 运行示例

```bash
cd universal_rag/examples
python3 example_json.py
```

### 步骤 2: 启动 Web 界面

```bash
cd universal_rag/web
./start.sh
# 访问 http://localhost:5001
```

### 步骤 3: 集成到你的项目

```python
# 复制 universal_rag 目录到你的项目
# 然后导入使用
from universal_rag import RAGPipeline, RAGConfig

config = RAGConfig(
    data_source_type="json",
    data_source_path="your_data.json"
)

with RAGPipeline(config) as rag:
    answer = rag.ask("你的问题")
```

---

## 🎓 使用场景

### 场景 1: 教育平台
```python
# 使用学习路径优化策略
RAGStrategySelector.apply_strategy(config, RAGStrategy.LEARNING_PATH)
path = rag.get_path(target_id=concept_id)
```

### 场景 2: 知识库系统
```python
# 使用概念解释优化策略
RAGStrategySelector.apply_strategy(config, RAGStrategy.CONCEPT_EXPLANATION)
answer = rag.ask("解释深度学习")
```

### 场景 3: 问答系统
```python
# 使用问答优化策略
RAGStrategySelector.apply_strategy(config, RAGStrategy.QA_FOCUSED)
answer = rag.ask("什么是神经网络？")
```

### 场景 4: 文档搜索引擎
```python
# 使用文档检索优化策略
RAGStrategySelector.apply_strategy(config, RAGStrategy.DOCUMENT_RETRIEVAL)
results = rag.search("机器学习", top_k=20)
```

---

## 📊 数据格式

### JSON 格式

```json
{
  "documents": [
    {
      "id": 1,
      "title": "深度学习",
      "content": "深度学习是机器学习的一个子领域..."
    }
  ],
  "relations": [
    {
      "source_id": 1,
      "target_id": 2,
      "relation_type": "prerequisite"
    }
  ]
}
```

### CSV 格式

**documents.csv**:
```csv
id,title,content
1,深度学习,深度学习是机器学习的一个子领域...
```

**relations.csv**:
```csv
source_id,target_id,relation_type
1,2,prerequisite
```

---

## 🔧 REST API 接口

### 获取策略列表
```
GET /api/strategies
```

### 初始化 RAG
```
POST /api/init
Body: {
  "data_source_type": "json",
  "data_source_path": "data.json",
  "strategy": "hybrid"
}
```

### 问答
```
POST /api/ask
Body: {"query": "你的问题"}
```

### 搜索
```
POST /api/search
Body: {"query": "关键词", "top_k": 5}
```

### 学习路径
```
POST /api/path
Body: {"target_id": 5}
```

### 策略对比
```
POST /api/compare
Body: {
  "query": "深度学习",
  "strategies": ["vector_only", "graph_only", "hybrid"]
}
```

---

## 📖 完整文档

- **完整文档**: `universal_rag/README.md`
- **快速开始**: `universal_rag/QUICKSTART.md`
- **策略指南**: `universal_rag/STRATEGY_GUIDE.md`
- **项目索引**: `universal_rag/INDEX.md`
- **Web 使用指南**: `universal_rag/web/USAGE.md`

---

## 🎯 运行示例

### 示例 1: 基础使用
```bash
python3 universal_rag/examples/example_json.py
```

### 示例 2: 策略对比
```bash
python3 universal_rag/examples/example_strategy.py
```

### 示例 3: 集成示例
```bash
python3 INTEGRATION_EXAMPLE.py
```

---

## ✅ 系统状态

- ✅ Web 服务运行中: http://localhost:5001
- ✅ 所有示例测试通过
- ✅ 11 种策略全部可用
- ✅ 支持 3 种数据源
- ✅ REST API 正常工作

---

## 💡 使用建议

1. **首次使用**: 先运行 `example_json.py` 了解基本功能
2. **策略选择**: 阅读 `STRATEGY_GUIDE.md` 选择合适策略
3. **Web 体验**: 访问 http://localhost:5001 可视化操作
4. **项目集成**: 参考 `INTEGRATION_EXAMPLE.py` 集成到项目

---

## 🎉 总结

Universal RAG 是一个功能完整、易于使用、高度灵活的通用 RAG 系统：

- ✅ 3 行代码即可使用
- ✅ 11 种策略自由选择
- ✅ Web 界面可视化操作
- ✅ REST API 远程调用
- ✅ 零依赖核心设计
- ✅ 完善的文档支持

**立即开始**: http://localhost:5001

---

**版本**: v1.1.0
**创建日期**: 2026-03-15
**作者**: Claude (Anthropic)
**许可证**: MIT
