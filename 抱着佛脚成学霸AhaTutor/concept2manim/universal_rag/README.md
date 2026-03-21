# Universal RAG - 通用检索增强生成模块

一个可复用的 RAG 框架，支持多种数据源和检索策略。

## 特性

- ✅ **多数据源支持**: SQLite, JSON, CSV
- ✅ **多检索策略**: 向量检索、图检索、混合检索
- ✅ **灵活配置**: 基于配置文件的系统
- ✅ **轻量级**: 无需复杂依赖
- ✅ **易集成**: 简单的 API 接口

## 快速开始

### 1. 基础使用

```python
from universal_rag import RAGPipeline, RAGConfig

# 创建配置
config = RAGConfig(
    data_source_type="sqlite",
    data_source_path="your_data.db",
    documents_table="documents",
    retrieval_strategy="hybrid"
)

# 创建 RAG 流水线
with RAGPipeline(config) as rag:
    # 问答
    answer = rag.ask("什么是机器学习？")
    print(answer)

    # 搜索
    results = rag.search("深度学习", top_k=5)
    for doc in results:
        print(doc['title'])
```

### 2. 使用 JSON 数据源

```python
# 准备 JSON 数据
data = {
    "documents": [
        {
            "id": 1,
            "title": "机器学习简介",
            "content": "机器学习是人工智能的一个分支..."
        },
        {
            "id": 2,
            "title": "深度学习基础",
            "content": "深度学习是机器学习的一个子领域..."
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

# 保存为 JSON
import json
with open("data.json", "w") as f:
    json.dump(data, f)

# 使用 JSON 适配器
config = RAGConfig(
    data_source_type="json",
    data_source_path="data.json",
    id_field="id",
    title_field="title",
    content_field="content"
)

with RAGPipeline(config) as rag:
    answer = rag.ask("什么是深度学习？")
    print(answer)
```

### 3. 使用配置文件

```python
# config.json
{
    "data_source_type": "sqlite",
    "data_source_path": "math_concepts.db",
    "documents_table": "concepts",
    "relations_table": "concept_relations",
    "retrieval_strategy": "hybrid",
    "top_k": 5,
    "enable_graph": true
}

# 加载配置
config = RAGConfig.from_file("config.json")

with RAGPipeline(config) as rag:
    answer = rag.ask("什么是导数？")
    print(answer)
```

### 4. 高级用法

```python
from universal_rag import RAGGenerator, create_adapter, RAGConfig

# 创建配置
config = RAGConfig(
    data_source_type="sqlite",
    data_source_path="data.db",
    retrieval_strategy="hybrid",
    enable_graph=True
)

# 创建适配器
db = create_adapter(config)

# 创建生成器
generator = RAGGenerator(db, config)

# 检索上下文
context = generator.retrieve_context("什么是机器学习？")
print(f"找到 {context['count']} 个相关文档")

# 生成回答
result = generator.generate_answer("什么是机器学习？")
print(result['answer'])

# 获取学习路径
path = generator.get_learning_path(target_id=10)
print(f"学习路径包含 {path['total_steps']} 个步骤")

# 关闭连接
db.close()
```

## 配置选项

### 数据源配置

```python
config = RAGConfig(
    # 数据源类型: sqlite, json, csv
    data_source_type="sqlite",

    # 数据源路径
    data_source_path="data.db",

    # 表名
    documents_table="documents",
    relations_table="relations",

    # 字段映射
    id_field="id",
    content_field="content",
    title_field="title",
    metadata_field="metadata"
)
```

### 检索配置

```python
config = RAGConfig(
    # 检索策略: vector, graph, hybrid
    retrieval_strategy="hybrid",

    # 返回结果数
    top_k=5,

    # 图检索最大跳数
    max_hops=2,

    # 是否启用图检索
    enable_graph=True,

    # 关系类型过滤
    relation_types=["prerequisite", "related"]
)
```

### 向量检索配置

```python
config = RAGConfig(
    # 向量方法: tfidf, embedding
    vector_method="tfidf",

    # 嵌入模型（如果使用 embedding）
    embedding_model="sentence-transformers/all-MiniLM-L6-v2"
)
```

### LLM 配置

```python
config = RAGConfig(
    # LLM 提供商: openai, anthropic, local
    llm_provider="openai",

    # 模型名称
    llm_model="gpt-3.5-turbo",

    # API Key
    llm_api_key="your-api-key",

    # 生成参数
    temperature=0.7,
    max_tokens=1000
)
```

## 配置模板

使用预定义的配置模板：

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
```

## 数据格式

### SQLite 数据库

```sql
-- 文档表
CREATE TABLE documents (
    id INTEGER PRIMARY KEY,
    title TEXT,
    content TEXT,
    metadata TEXT
);

-- 关系表（可选）
CREATE TABLE relations (
    id INTEGER PRIMARY KEY,
    source_concept_id INTEGER,
    target_concept_id INTEGER,
    relation_type TEXT,
    FOREIGN KEY (source_concept_id) REFERENCES documents(id),
    FOREIGN KEY (target_concept_id) REFERENCES documents(id)
);
```

### JSON 格式

```json
{
    "documents": [
        {
            "id": 1,
            "title": "标题",
            "content": "内容",
            "metadata": {}
        }
    ],
    "relations": [
        {
            "source_id": 1,
            "target_id": 2,
            "relation_type": "related"
        }
    ]
}
```

### CSV 格式

```csv
id,title,content,metadata
1,"标题1","内容1","{}"
2,"标题2","内容2","{}"
```

## API 参考

### RAGPipeline

简化的 RAG 接口：

```python
pipeline = RAGPipeline(config)

# 问答
answer = pipeline.ask(query, llm_client=None)

# 搜索
results = pipeline.search(query, top_k=5)

# 解释文档
info = pipeline.explain(doc_id)

# 获取学习路径
path = pipeline.get_path(target_id)

# 关闭
pipeline.close()
```

### RAGGenerator

完整的 RAG 生成器：

```python
generator = RAGGenerator(db_adapter, config)

# 检索上下文
context = generator.retrieve_context(query, top_k=5)

# 生成回答
result = generator.generate_answer(query, context=None, llm_client=None)

# 批量生成
results = generator.batch_generate(queries, llm_client=None)

# 解释文档
info = generator.explain_document(doc_id)

# 获取学习路径
path = generator.get_learning_path(target_id)
```

## 集成示例

### 集成到 FastAPI

```python
from fastapi import FastAPI
from universal_rag import RAGPipeline, RAGConfig

app = FastAPI()

# 初始化 RAG
config = RAGConfig.from_file("config.json")
rag = RAGPipeline(config)

@app.post("/api/ask")
async def ask_question(query: str):
    answer = rag.ask(query)
    return {"answer": answer}

@app.get("/api/search")
async def search_documents(query: str, top_k: int = 5):
    results = rag.search(query, top_k)
    return {"results": results}

@app.on_event("shutdown")
async def shutdown():
    rag.close()
```

### 集成到 Flask

```python
from flask import Flask, request, jsonify
from universal_rag import RAGPipeline, RAGConfig

app = Flask(__name__)

config = RAGConfig.from_file("config.json")
rag = RAGPipeline(config)

@app.route("/api/ask", methods=["POST"])
def ask_question():
    query = request.json.get("query")
    answer = rag.ask(query)
    return jsonify({"answer": answer})

@app.route("/api/search", methods=["GET"])
def search_documents():
    query = request.args.get("query")
    top_k = int(request.args.get("top_k", 5))
    results = rag.search(query, top_k)
    return jsonify({"results": results})

if __name__ == "__main__":
    app.run()
```

## 扩展

### 自定义数据库适配器

```python
from universal_rag.core.database import DatabaseAdapter

class MyDatabaseAdapter(DatabaseAdapter):
    def connect(self):
        # 实现连接逻辑
        pass

    def get_documents(self, filters=None):
        # 实现获取文档逻辑
        pass

    # 实现其他方法...
```

### 自定义 LLM 客户端

```python
class MyLLMClient:
    def generate(self, prompt):
        # 调用你的 LLM API
        return "生成的回答"

# 使用
llm = MyLLMClient()
answer = rag.ask("问题", llm_client=llm)
```

## 性能优化

- 使用缓存减少重复检索
- 批量处理提高吞吐量
- 调整 top_k 和 max_hops 参数
- 使用更高效的向量方法（如 embedding）

## 许可证

MIT License
