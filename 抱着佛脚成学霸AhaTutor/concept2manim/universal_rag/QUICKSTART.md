# Universal RAG 快速开始

## 5 分钟上手

### 1. 最简单的例子

```python
from universal_rag import RAGPipeline, RAGConfig

# 创建配置
config = RAGConfig(
    data_source_type="json",
    data_source_path="your_data.json"
)

# 使用 RAG
with RAGPipeline(config) as rag:
    answer = rag.ask("你的问题")
    print(answer)
```

### 2. 准备数据

#### JSON 格式（推荐）

```json
{
  "documents": [
    {
      "id": 1,
      "title": "标题",
      "content": "内容"
    }
  ],
  "relations": [
    {
      "source_id": 2,
      "target_id": 1,
      "relation_type": "prerequisite"
    }
  ]
}
```

#### CSV 格式

**documents.csv:**
```csv
id,title,content
1,"标题1","内容1"
2,"标题2","内容2"
```

**relations.csv:**
```csv
source_id,target_id,relation_type
2,1,prerequisite
```

#### SQLite 数据库

```sql
CREATE TABLE documents (
    id INTEGER PRIMARY KEY,
    title TEXT,
    content TEXT
);

CREATE TABLE relations (
    source_id INTEGER,
    target_id INTEGER,
    relation_type TEXT
);
```

### 3. 核心功能

```python
with RAGPipeline(config) as rag:
    # 问答
    answer = rag.ask("什么是机器学习？")

    # 搜索
    results = rag.search("深度学习", top_k=5)

    # 学习路径
    path = rag.get_path(target_id=10)

    # 解释文档
    info = rag.explain(doc_id=5)
```

### 4. 配置模板

```python
from universal_rag.config import ConfigTemplates

# 简单问答
config = ConfigTemplates.simple_qa()

# 知识图谱
config = ConfigTemplates.knowledge_graph()

# 文档搜索
config = ConfigTemplates.document_search()

# 学习路径
config = ConfigTemplates.learning_path()

# 设置数据源
config.data_source_type = "json"
config.data_source_path = "data.json"
```

### 5. 运行示例

```bash
# JSON 示例
cd universal_rag/examples
python3 example_json.py

# CSV 示例
python3 example_csv.py

# SQLite 示例
python3 example_basic.py

# 配置模板示例
python3 example_templates.py
```

## 常见问题

### Q: 需要安装什么依赖？
A: 无需任何外部依赖！使用 Python 标准库即可运行。

### Q: 支持哪些数据源？
A: SQLite, JSON, CSV，可扩展支持 MongoDB, PostgreSQL 等。

### Q: 如何自定义 LLM？
A: 传入自定义的 `llm_client` 对象到 `ask()` 方法。

### Q: 如何提高检索准确度？
A: 使用 `hybrid` 检索策略，结合向量和图检索。

### Q: 数据量大时如何优化？
A: 调整 `top_k` 参数，启用缓存，使用 embedding 向量方法。

## 下一步

- 查看完整文档: [README.md](README.md)
- 浏览示例代码: [examples/](examples/)
- 自定义适配器: 继承 `DatabaseAdapter` 类
- 集成到项目: 参考 FastAPI/Flask 集成示例
