# Universal RAG - 独立模块使用指南

## 📍 模块位置

Universal RAG 现在是一个独立的模块，位于：
```
/Users/Min369/Documents/同步空间/Manju/Projects/共享/AlVisualization/抱着佛脚成学霸AhaTutor/universal_rag/
```

可以被多个项目共享使用。

---

## 🚀 在其他项目中使用

### 方法 1: 添加到 Python 路径

在你的项目代码中：

```python
import sys
sys.path.insert(0, '/Users/Min369/Documents/同步空间/Manju/Projects/共享/AlVisualization/抱着佛脚成学霸AhaTutor/universal_rag')

from universal_rag import RAGPipeline, RAGConfig, RAGStrategy, RAGStrategySelector

# 使用
config = RAGConfig(
    data_source_type="json",
    data_source_path="your_data.json"
)

with RAGPipeline(config) as rag:
    answer = rag.ask("你的问题")
```

### 方法 2: 使用相对路径

如果你的项目在同一父目录下：

```python
import sys
import os

# 添加 universal_rag 到路径
parent_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(parent_dir, 'universal_rag'))

from universal_rag import RAGPipeline, RAGConfig
```

### 方法 3: 创建软链接

在你的项目目录中创建软链接：

```bash
cd your_project
ln -s /Users/Min369/Documents/同步空间/Manju/Projects/共享/AlVisualization/抱着佛脚成学霸AhaTutor/universal_rag universal_rag
```

然后直接导入：
```python
from universal_rag import RAGPipeline, RAGConfig
```

---

## 📦 项目结构

```
universal_rag/                    # 独立模块根目录
├── __init__.py                   # 包初始化
├── config.py                     # 配置系统
├── strategy_selector.py          # 策略选择器
│
├── core/                         # 核心模块
│   ├── database.py               # 数据库适配器
│   ├── retriever.py              # 检索引擎
│   └── generator.py              # RAG 生成器
│
├── examples/                     # 示例代码
│   ├── example_json.py           # JSON 示例
│   ├── example_csv.py            # CSV 示例
│   ├── example_basic.py          # SQLite 示例
│   ├── example_strategy.py       # 策略选择示例
│   └── sample_data.json          # 示例数据
│
├── web/                          # Web 界面
│   ├── app.py                    # Flask 应用
│   ├── start.sh                  # 启动脚本
│   └── templates/
│       └── index.html            # 前端界面
│
└── 文档/
    ├── START_HERE.md             # 入口指南
    ├── README.md                 # 完整文档
    ├── QUICKSTART.md             # 快速开始
    ├── STRATEGY_GUIDE.md         # 策略指南
    └── INDEX.md                  # 项目索引
```

---

## 💡 使用示例

### 示例 1: concept2manim 项目中使用

```python
# concept2manim/some_module.py
import sys
sys.path.insert(0, '../universal_rag')

from universal_rag import RAGPipeline, RAGConfig, RAGStrategy, RAGStrategySelector

# 为数学概念创建 RAG
config = RAGConfig(
    data_source_type="json",
    data_source_path="math_concepts.json"
)

# 使用学习路径优化策略
RAGStrategySelector.apply_strategy(config, RAGStrategy.LEARNING_PATH)

with RAGPipeline(config) as rag:
    # 获取概念学习路径
    path = rag.get_path(target_id=10)

    # 回答数学问题
    answer = rag.ask("什么是导数？")
```

### 示例 2: 其他项目中使用

```python
# other_project/main.py
import sys
sys.path.insert(0, '/Users/Min369/Documents/同步空间/Manju/Projects/共享/AlVisualization/抱着佛脚成学霸AhaTutor/universal_rag')

from universal_rag import RAGPipeline, RAGConfig

config = RAGConfig(
    data_source_type="json",
    data_source_path="your_data.json"
)

with RAGPipeline(config) as rag:
    results = rag.search("关键词", top_k=10)
```

---

## 🌐 启动 Web 服务

### 从任何位置启动

```bash
cd /Users/Min369/Documents/同步空间/Manju/Projects/共享/AlVisualization/抱着佛脚成学霸AhaTutor/universal_rag/web
./start.sh
```

访问: http://localhost:5001

### 或使用 Python 直接启动

```bash
cd /Users/Min369/Documents/同步空间/Manju/Projects/共享/AlVisualization/抱着佛脚成学霸AhaTutor/universal_rag/web
python3 app.py
```

---

## 🎯 核心功能

### 1. 多数据源支持
- SQLite - 关系型数据库
- JSON - 轻量级文件
- CSV - 表格数据

### 2. 11 种 RAG 策略
- 基础策略: 纯向量、纯图、混合
- 高级策略: 语义搜索、知识图谱、多跳推理、上下文感知
- 场景优化: 问答、文档检索、学习路径、概念解释

### 3. 智能策略推荐
```python
strategy = RAGStrategySelector.recommend_strategy("我需要生成学习路径")
RAGStrategySelector.apply_strategy(config, strategy)
```

### 4. Web 可视化界面
- 策略详情显示
- 实时问答
- 文档搜索
- 学习路径生成
- 策略对比

---

## 📚 文档导航

- **START_HERE.md** - 从这里开始
- **QUICKSTART.md** - 5 分钟快速上手
- **README.md** - 完整文档
- **STRATEGY_GUIDE.md** - 策略选择指南
- **INDEX.md** - 项目索引

---

## 🔧 配置说明

### 基础配置

```python
config = RAGConfig(
    # 数据源
    data_source_type="json",        # json, csv, sqlite
    data_source_path="data.json",   # 数据文件路径

    # 检索配置
    retrieval_strategy="hybrid",    # vector, graph, hybrid
    top_k=5,                        # 返回结果数
    enable_graph=True,              # 启用图检索
    max_hops=2,                     # 最大跳数

    # 字段映射
    id_field="id",
    title_field="title",
    content_field="content"
)
```

### 使用预定义模板

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

## ⚠️ 注意事项

1. **路径问题**: 确保数据文件路径正确
2. **依赖问题**: 核心功能无需外部依赖，Web 界面需要 Flask
3. **数据格式**: 确保数据格式符合要求（参考示例数据）
4. **策略选择**: 根据使用场景选择合适的策略

---

## 🆘 常见问题

### Q: 如何在多个项目中共享？
A: 使用绝对路径或软链接，参考上面的方法 1-3

### Q: 如何更新模块？
A: 直接在 universal_rag 目录中更新，所有项目自动生效

### Q: 数据文件放在哪里？
A: 可以放在各自项目中，使用相对或绝对路径引用

### Q: Web 服务如何访问？
A: 启动后访问 http://localhost:5001

---

## 📞 获取帮助

- **完整文档**: universal_rag/README.md
- **快速开始**: universal_rag/QUICKSTART.md
- **策略指南**: universal_rag/STRATEGY_GUIDE.md
- **项目索引**: universal_rag/INDEX.md

---

**版本**: v1.1.0
**位置**: /Users/Min369/Documents/同步空间/Manju/Projects/共享/AlVisualization/抱着佛脚成学霸AhaTutor/universal_rag/
**状态**: ✅ 独立模块，可供多项目使用
