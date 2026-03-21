# 🚀 Universal RAG - 从这里开始

欢迎使用 Universal RAG！这是你的项目入口指南。

---

## ⚡ 30 秒快速开始

### 方式 1: Web 界面（最简单）

```bash
cd web
./start.sh
```

然后访问: **http://localhost:5001**

### 方式 2: 运行示例（快速体验）

```bash
cd examples
python3 example_json.py
```

### 方式 3: 集成到项目（3 行代码）

```python
from universal_rag import RAGPipeline, RAGConfig

config = RAGConfig(data_source_type="json", data_source_path="data.json")
with RAGPipeline(config) as rag:
    print(rag.ask("你的问题"))
```

---

## 📚 文档导航

### 新手必读
1. **[QUICKSTART.md](QUICKSTART.md)** - 5 分钟快速上手
2. **[INDEX.md](INDEX.md)** - 完整项目导航

### 深入学习
3. **[README.md](README.md)** - 完整文档（438 行）
4. **[STRATEGY_GUIDE.md](STRATEGY_GUIDE.md)** - 11 种策略详解

### Web 界面
5. **[web/USAGE.md](web/USAGE.md)** - Web 使用指南
6. **[web/README.md](web/README.md)** - Web 服务文档

### 开发者
7. **[PROJECT_SUMMARY.md](PROJECT_SUMMARY.md)** - 技术架构
8. **[COMPLETE_SUMMARY.md](COMPLETE_SUMMARY.md)** - 功能总结

---

## 🎯 根据你的需求选择

### 我想快速体验
→ 运行 `python3 examples/example_json.py`

### 我想可视化操作
→ 运行 `cd web && ./start.sh`，访问 http://localhost:5001

### 我想集成到项目
→ 阅读 [README.md](README.md) 的集成示例

### 我想了解策略
→ 阅读 [STRATEGY_GUIDE.md](STRATEGY_GUIDE.md)

### 我想看 API 文档
→ 阅读 [web/README.md](web/README.md#api-接口)

---

## 🌟 核心特性一览

- ✅ **多数据源**: SQLite, JSON, CSV
- ✅ **11 种策略**: 从简单到复杂
- ✅ **Web 界面**: 现代化可视化操作
- ✅ **REST API**: 标准 HTTP 接口
- ✅ **零依赖**: 核心功能无需外部库
- ✅ **易集成**: 3 行代码即可使用

---

## 📖 示例代码

### 基础问答
```python
from universal_rag import RAGPipeline, RAGConfig

config = RAGConfig(data_source_type="json", data_source_path="data.json")
with RAGPipeline(config) as rag:
    answer = rag.ask("什么是深度学习？")
    print(answer)
```

### 使用策略
```python
from universal_rag import RAGPipeline, RAGConfig, RAGStrategy, RAGStrategySelector

config = RAGConfig(data_source_type="json", data_source_path="data.json")
RAGStrategySelector.apply_strategy(config, RAGStrategy.HYBRID)

with RAGPipeline(config) as rag:
    answer = rag.ask("你的问题")
```

### 智能推荐
```python
strategy = RAGStrategySelector.recommend_strategy("我需要快速回答问题")
RAGStrategySelector.apply_strategy(config, strategy)
```

---

## 🎓 学习路径

### 路径 1: 快速体验（10 分钟）
1. 阅读本文件
2. 运行 `examples/example_json.py`
3. 启动 Web 界面体验

### 路径 2: 深入学习（30 分钟）
1. 阅读 [QUICKSTART.md](QUICKSTART.md)
2. 阅读 [STRATEGY_GUIDE.md](STRATEGY_GUIDE.md)
3. 运行所有示例代码
4. 尝试不同策略对比

### 路径 3: 开发集成（1 小时）
1. 阅读 [README.md](README.md)
2. 阅读 [PROJECT_SUMMARY.md](PROJECT_SUMMARY.md)
3. 研究核心代码
4. 集成到自己的项目

---

## 🔗 快速链接

| 功能 | 链接 |
|------|------|
| Web 界面 | http://localhost:5001 |
| 完整文档 | [README.md](README.md) |
| 快速开始 | [QUICKSTART.md](QUICKSTART.md) |
| 策略指南 | [STRATEGY_GUIDE.md](STRATEGY_GUIDE.md) |
| 项目索引 | [INDEX.md](INDEX.md) |

---

## 💡 常见问题

**Q: 如何开始使用？**
A: 运行 `cd web && ./start.sh`，访问 http://localhost:5001

**Q: 如何选择策略？**
A: 阅读 [STRATEGY_GUIDE.md](STRATEGY_GUIDE.md)，或使用智能推荐

**Q: 支持哪些数据源？**
A: SQLite, JSON, CSV

**Q: 如何集成到项目？**
A: 参考 [README.md](README.md) 的集成示例

---

## 🎉 立即开始

选择你喜欢的方式：

```bash
# 方式 1: Web 界面
cd web && ./start.sh

# 方式 2: 运行示例
cd examples && python3 example_json.py

# 方式 3: 阅读文档
cat QUICKSTART.md
```

---

**提示**: 如果你是第一次使用，强烈推荐从 Web 界面开始！

**Web 界面**: http://localhost:5001

**版本**: v1.1.0 | **状态**: ✅ 运行中
