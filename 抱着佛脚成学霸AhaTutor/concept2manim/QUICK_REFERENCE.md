# Universal RAG - 快速参考卡

## 🚀 一分钟上手

### 最简单的使用方式

```python
from universal_rag import RAGPipeline, RAGConfig

config = RAGConfig(data_source_type="json", data_source_path="data.json")
with RAGPipeline(config) as rag:
    print(rag.ask("你的问题"))
```

---

## 📍 快速链接

| 功能 | 链接/命令 |
|------|----------|
| **Web 界面** | http://localhost:5001 |
| **启动 Web** | `cd universal_rag/web && ./start.sh` |
| **运行示例** | `python3 universal_rag/examples/example_json.py` |
| **完整文档** | `universal_rag/README.md` |
| **策略指南** | `universal_rag/STRATEGY_GUIDE.md` |

---

## 🎯 策略速查表

| 使用场景 | 推荐策略 | 策略 ID |
|---------|---------|---------|
| 快速问答 | 问答优化 | `qa_focused` |
| 文档搜索 | 文档检索优化 | `document_retrieval` |
| 学习路径 | 学习路径优化 | `learning_path` |
| 概念解释 | 概念解释优化 | `concept_explanation` |
| 知识探索 | 知识图谱增强 | `knowledge_graph` |
| 简单场景 | 混合检索 | `hybrid` |

---

## 💻 常用代码片段

### 1. 基础问答

```python
from universal_rag import RAGPipeline, RAGConfig

config = RAGConfig(data_source_type="json", data_source_path="data.json")
with RAGPipeline(config) as rag:
    answer = rag.ask("什么是深度学习？")
    print(answer)
```

### 2. 使用策略

```python
from universal_rag import RAGPipeline, RAGConfig, RAGStrategy, RAGStrategySelector

config = RAGConfig(data_source_type="json", data_source_path="data.json")
RAGStrategySelector.apply_strategy(config, RAGStrategy.HYBRID)

with RAGPipeline(config) as rag:
    answer = rag.ask("你的问题")
```

### 3. 搜索文档

```python
with RAGPipeline(config) as rag:
    results = rag.search("关键词", top_k=10)
    for result in results:
        print(f"{result['title']}: {result['score']}")
```

### 4. 生成学习路径

```python
with RAGPipeline(config) as rag:
    path = rag.get_path(target_id=5)
    for step in path:
        print(f"{step['title']} (距离: {step['distance']})")
```

### 5. 智能推荐策略

```python
strategy = RAGStrategySelector.recommend_strategy("我需要快速回答问题")
RAGStrategySelector.apply_strategy(config, strategy)
```

---

## 🌐 REST API 速查

### 初始化

```bash
curl -X POST http://localhost:5001/api/init \
  -H "Content-Type: application/json" \
  -d '{"data_source_type": "json", "data_source_path": "data.json", "strategy": "hybrid"}'
```

### 问答

```bash
curl -X POST http://localhost:5001/api/ask \
  -H "Content-Type: application/json" \
  -d '{"query": "你的问题"}'
```

### 搜索

```bash
curl -X POST http://localhost:5001/api/search \
  -H "Content-Type: application/json" \
  -d '{"query": "关键词", "top_k": 5}'
```

### 获取策略列表

```bash
curl http://localhost:5001/api/strategies
```

---

## 📊 数据格式速查

### JSON 格式

```json
{
  "documents": [
    {"id": 1, "title": "标题", "content": "内容"}
  ],
  "relations": [
    {"source_id": 1, "target_id": 2, "relation_type": "prerequisite"}
  ]
}
```

### CSV 格式

**documents.csv**:
```
id,title,content
1,标题,内容
```

**relations.csv**:
```
source_id,target_id,relation_type
1,2,prerequisite
```

---

## ⚙️ 配置速查

### 基础配置

```python
config = RAGConfig(
    data_source_type="json",        # 数据源类型: json, csv, sqlite
    data_source_path="data.json",   # 数据源路径
    retrieval_strategy="hybrid",    # 检索策略: vector, graph, hybrid
    top_k=5,                        # 返回结果数
    enable_graph=True,              # 启用图检索
    max_hops=2                      # 最大跳数
)
```

### 预定义模板

```python
from universal_rag import ConfigTemplates

# 简单问答
config = ConfigTemplates.simple_qa()

# 知识图谱
config = ConfigTemplates.knowledge_graph()

# 文档搜索
config = ConfigTemplates.document_search()

# 学习路径
config = ConfigTemplates.learning_path()
```

---

## 🔧 常见问题

### Q: 如何启动 Web 界面？
```bash
cd universal_rag/web
./start.sh
# 访问 http://localhost:5001
```

### Q: 如何选择策略？
```python
# 方法 1: 手动选择
RAGStrategySelector.apply_strategy(config, RAGStrategy.HYBRID)

# 方法 2: 智能推荐
strategy = RAGStrategySelector.recommend_strategy("你的使用场景")
RAGStrategySelector.apply_strategy(config, strategy)
```

### Q: 如何切换数据源？
```python
# JSON
config = RAGConfig(data_source_type="json", data_source_path="data.json")

# CSV
config = RAGConfig(data_source_type="csv", data_source_path="docs.csv")

# SQLite
config = RAGConfig(data_source_type="sqlite", data_source_path="data.db")
```

### Q: 如何对比策略？
使用 Web 界面的"策略对比"功能，或：
```python
strategies = [RAGStrategy.VECTOR_ONLY, RAGStrategy.GRAPH_ONLY, RAGStrategy.HYBRID]
for strategy in strategies:
    RAGStrategySelector.apply_strategy(config, strategy)
    with RAGPipeline(config) as rag:
        results = rag.search("查询", top_k=5)
        print(f"{strategy.value}: {len(results)} 个结果")
```

---

## 📁 项目文件速查

```
universal_rag/
├── README.md              # 完整文档
├── QUICKSTART.md          # 快速开始
├── STRATEGY_GUIDE.md      # 策略指南
├── INDEX.md               # 项目索引
├── config.py              # 配置系统
├── strategy_selector.py   # 策略选择器
├── core/                  # 核心模块
├── examples/              # 示例代码
└── web/                   # Web 界面
    ├── app.py             # Flask 应用
    └── start.sh           # 启动脚本
```

---

## 🎯 示例文件

| 文件 | 说明 |
|------|------|
| `example_json.py` | JSON 数据源示例 |
| `example_csv.py` | CSV 数据源示例 |
| `example_basic.py` | SQLite 数据源示例 |
| `example_strategy.py` | 策略选择示例 |
| `example_templates.py` | 配置模板示例 |

运行示例：
```bash
cd universal_rag/examples
python3 example_json.py
```

---

## 🚀 立即开始

### 选项 1: Web 界面（最简单）
```bash
cd universal_rag/web && ./start.sh
# 访问 http://localhost:5001
```

### 选项 2: 运行示例（快速体验）
```bash
python3 universal_rag/examples/example_json.py
```

### 选项 3: 集成到项目（开发者）
```python
from universal_rag import RAGPipeline, RAGConfig
config = RAGConfig(data_source_type="json", data_source_path="data.json")
with RAGPipeline(config) as rag:
    print(rag.ask("你的问题"))
```

---

## 📞 获取帮助

- **完整文档**: `universal_rag/README.md`
- **快速开始**: `universal_rag/QUICKSTART.md`
- **策略指南**: `universal_rag/STRATEGY_GUIDE.md`
- **使用说明**: `UNIVERSAL_RAG_使用说明.md`
- **集成示例**: `INTEGRATION_EXAMPLE.py`

---

**Web 界面**: http://localhost:5001
**版本**: v1.1.0
**状态**: ✅ 运行中
