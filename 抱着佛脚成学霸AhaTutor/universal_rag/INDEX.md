# Universal RAG - 项目索引

欢迎使用 Universal RAG！这是一个功能完整的通用检索增强生成系统。

## 🎯 快速导航

### 新手入门
1. **[快速开始指南](QUICKSTART.md)** - 5 分钟上手
2. **[完整文档](README.md)** - 详细的使用说明
3. **[示例代码](examples/)** - 运行示例学习

### 核心功能
4. **[策略选择指南](STRATEGY_GUIDE.md)** - 11 种 RAG 策略详解
5. **[Web 界面](web/)** - 可视化操作界面
6. **[配置系统](config.py)** - 灵活的配置选项

### 开发文档
7. **[项目总结](PROJECT_SUMMARY.md)** - 技术架构和设计
8. **[完整功能总结](COMPLETE_SUMMARY.md)** - 所有功能概览
9. **[更新日志](CHANGELOG.md)** - 版本更新记录

## 🚀 三种使用方式

### 1️⃣ Web 界面（推荐新手）

```bash
cd web
./start.sh
# 访问 http://localhost:5001
```

**特点**: 可视化操作、策略对比、实时反馈

### 2️⃣ Python API（推荐开发者）

```python
from universal_rag import RAGPipeline, RAGConfig, RAGStrategy, RAGStrategySelector

config = RAGConfig(data_source_type="json", data_source_path="data.json")
RAGStrategySelector.apply_strategy(config, RAGStrategy.HYBRID)

with RAGPipeline(config) as rag:
    answer = rag.ask("你的问题")
```

**特点**: 灵活集成、编程控制、高性能

### 3️⃣ REST API（推荐远程调用）

```bash
curl -X POST http://localhost:5001/api/ask \
  -H "Content-Type: application/json" \
  -d '{"query": "什么是深度学习？"}'
```

**特点**: 跨语言、远程访问、标准接口

## 📚 文档结构

```
universal_rag/
├── INDEX.md                    ← 你在这里
├── README.md                   ← 完整文档（必读）
├── QUICKSTART.md              ← 快速开始（新手必读）
├── STRATEGY_GUIDE.md          ← 策略指南（选择策略必读）
├── PROJECT_SUMMARY.md         ← 项目总结（开发者必读）
├── COMPLETE_SUMMARY.md        ← 功能总结（全面了解）
├── CHANGELOG.md               ← 更新日志
│
├── core/                      ← 核心代码
│   ├── database.py            ← 数据库适配器
│   ├── retriever.py           ← 检索引擎
│   └── generator.py           ← RAG 生成器
│
├── examples/                  ← 示例代码
│   ├── example_json.py        ← JSON 示例（推荐）
│   ├── example_csv.py         ← CSV 示例
│   ├── example_basic.py       ← SQLite 示例
│   ├── example_templates.py   ← 配置模板示例
│   └── example_strategy.py    ← 策略选择示例
│
└── web/                       ← Web 界面
    ├── README.md              ← Web 文档
    ├── USAGE.md               ← 使用指南（Web 用户必读）
    ├── start.sh               ← 启动脚本
    └── app.py                 ← Flask 应用
```

## 🎓 学习路径

### 路径 1: 快速体验（10 分钟）
1. 阅读 [QUICKSTART.md](QUICKSTART.md)
2. 运行 `examples/example_json.py`
3. 启动 Web 界面体验

### 路径 2: 深入学习（30 分钟）
1. 阅读 [README.md](README.md)
2. 阅读 [STRATEGY_GUIDE.md](STRATEGY_GUIDE.md)
3. 运行所有示例代码
4. 尝试不同策略对比

### 路径 3: 开发集成（1 小时）
1. 阅读 [PROJECT_SUMMARY.md](PROJECT_SUMMARY.md)
2. 研究核心代码
3. 集成到自己的项目
4. 自定义适配器和策略

## 🔥 核心特性

| 特性 | 说明 | 文档 |
|------|------|------|
| 多数据源 | SQLite, JSON, CSV | [README.md](README.md#数据格式) |
| 11 种策略 | 向量、图、混合等 | [STRATEGY_GUIDE.md](STRATEGY_GUIDE.md) |
| Web 界面 | 可视化操作 | [web/USAGE.md](web/USAGE.md) |
| REST API | 标准接口 | [web/README.md](web/README.md#api-接口) |
| 零依赖 | 核心无需外部库 | [README.md](README.md#特性) |
| 易扩展 | 适配器模式 | [README.md](README.md#扩展) |

## 💡 常见问题

### Q: 如何开始使用？
**A**: 阅读 [QUICKSTART.md](QUICKSTART.md)，运行 `examples/example_json.py`

### Q: 如何选择策略？
**A**: 阅读 [STRATEGY_GUIDE.md](STRATEGY_GUIDE.md)，使用 Web 界面对比

### Q: 如何集成到项目？
**A**: 参考 [README.md](README.md#集成示例) 的集成示例

### Q: 如何启动 Web 界面？
**A**: 运行 `cd web && ./start.sh`，访问 http://localhost:5001

### Q: 支持哪些数据源？
**A**: SQLite, JSON, CSV，详见 [README.md](README.md#数据格式)

### Q: 如何自定义策略？
**A**: 参考 [README.md](README.md#自定义策略)

## 🎯 使用场景

| 场景 | 推荐策略 | 示例 |
|------|---------|------|
| 问答系统 | QA_FOCUSED | [example_strategy.py](examples/example_strategy.py) |
| 文档搜索 | DOCUMENT_RETRIEVAL | [example_json.py](examples/example_json.py) |
| 学习路径 | LEARNING_PATH | [example_strategy.py](examples/example_strategy.py) |
| 概念解释 | CONCEPT_EXPLANATION | [example_strategy.py](examples/example_strategy.py) |
| 知识图谱 | KNOWLEDGE_GRAPH | [example_basic.py](examples/example_basic.py) |

## 📊 项目信息

- **版本**: v1.1.0
- **总文件数**: 24 个
- **总代码量**: 2,800+ 行
- **支持策略**: 11 种
- **数据源**: 3 种
- **示例代码**: 5 个
- **文档文件**: 9 个

## 🔗 快速链接

### 文档
- [完整文档](README.md)
- [快速开始](QUICKSTART.md)
- [策略指南](STRATEGY_GUIDE.md)
- [Web 使用指南](web/USAGE.md)

### 代码
- [核心模块](core/)
- [示例代码](examples/)
- [Web 应用](web/)

### 工具
- [配置系统](config.py)
- [策略选择器](strategy_selector.py)
- [启动脚本](web/start.sh)

## 🎉 开始使用

选择你喜欢的方式开始：

1. **Web 界面**: `cd web && ./start.sh`
2. **示例代码**: `cd examples && python3 example_json.py`
3. **阅读文档**: 打开 [QUICKSTART.md](QUICKSTART.md)

---

**提示**: 如果你是第一次使用，强烈推荐从 [QUICKSTART.md](QUICKSTART.md) 开始！

**Web 界面**: http://localhost:5001

**问题反馈**: 查看文档或运行示例代码

**版本**: v1.1.0 | **作者**: Claude (Anthropic) | **许可证**: MIT
