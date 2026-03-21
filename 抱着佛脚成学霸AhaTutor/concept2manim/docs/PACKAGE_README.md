# Math2Manim 独立包

## 📦 项目结构

```
Math2Manim/
├── math2manim/              # 主包
│   ├── __init__.py         # 包入口
│   ├── core/               # 核心模块
│   │   ├── __init__.py
│   │   ├── knowledge_tree.py      # 反向知识树
│   │   ├── concept_analyzer.py    # 概念分析器
│   │   └── code_generator.py      # 代码生成器
│   ├── generators/         # 生成器
│   │   ├── __init__.py
│   │   └── base_generator.py      # 基础生成器
│   └── templates/          # 模板库
│       ├── __init__.py
│       └── template_manager.py    # 模板管理器
├── examples/               # 使用示例
│   ├── basic_usage.py             # 基础使用
│   └── integration_examples.py    # 集成示例
├── tests/                  # 测试
│   └── test_package.py            # 包测试
├── pyproject.toml          # 包配置
└── README_PACKAGE.md       # 包文档
```

## 🚀 安装

### 开发模式安装

```bash
cd Math2Manim
pip install -e .
```

### 生产环境安装（发布后）

```bash
pip install math2manim
```

## 📖 快速开始

### 1. 基础使用

```python
from math2manim import ManimGenerator

# 创建生成器
generator = ManimGenerator()

# 生成动画代码
result = generator.generate("勾股定理")

print(result["code"])
```

### 2. 使用知识树

```python
from math2manim import KnowledgeTree

tree = KnowledgeTree()
root = tree.build_tree("导数")

# 可视化
print(tree.visualize())

# 学习路径
print(tree.get_learning_path())
```

### 3. 概念分析

```python
from math2manim import ConceptAnalyzer

analyzer = ConceptAnalyzer()
analysis = analyzer.analyze("正弦函数")

print(f"类型: {analysis.type}")
print(f"难度: {analysis.difficulty}")
```

## 🔧 集成到现有项目

### 作为 Python 库

```python
from math2manim import ManimGenerator

def my_animation_generator(concept: str):
    generator = ManimGenerator()
    result = generator.generate(concept)
    return result["code"]
```

### 作为 HTTP 服务

```python
from fastapi import FastAPI
from math2manim import ManimGenerator

app = FastAPI()
generator = ManimGenerator()

@app.post("/generate")
async def generate(concept: str):
    return generator.generate(concept)
```

### 集成到 concept2animation 服务

在 `concept2animation/app.py` 中：

```python
from math2manim import ManimGenerator

# 替换现有的生成逻辑
generator = ManimGenerator()

@app.post("/generate")
async def generate_animation(request: GenerateRequest):
    result = generator.generate(
        concept=request.concept,
        style=request.style,
        quality=request.quality,
        build_tree=True
    )

    # 使用生成的代码渲染动画
    # ...
```

## ✅ 测试结果

```
============================================================
Math2Manim 包测试
============================================================
✓ 成功导入 math2manim 包

测试知识树...
✓ 知识树构建成功: 勾股定理
✓ 学习路径: 三角形 → 正方形 → 面积 → 勾股定理

测试概念分析器...
✓ 概念分析成功: 勾股定理
  类型: mathematics
  难度: middle_school

测试代码生成器...
✓ 代码生成成功: 904 字符
  场景名: PythagoreanTheorem

测试完整流程...
✓ 完整流程测试成功
  概念: 勾股定理
  学习路径: 三角形 → 正方形 → 面积 → 勾股定理

============================================================
✓ 所有测试通过！
============================================================
```

## 🎯 核心特性

### 1. 反向知识树

递归分解概念的前置知识，确保完整的理解路径：

```python
导数
├── 函数
│   ├── 变量
│   └── 映射关系
├── 极限
│   ├── 无限接近
│   └── 数列
└── 变化率
    ├── 速度
    └── 斜率
```

### 2. 模块化设计

- **独立安装**：可作为独立 Python 包安装
- **易于集成**：简单的 API，易于集成到任何项目
- **可扩展**：支持自定义 LLM 客户端

### 3. 零依赖 AI

- 内置规则系统，无需 AI 也能工作
- 可选集成 Claude/GPT/Gemini
- 内置高质量模板库

## 📊 API 文档

### ManimGenerator

主要生成器类。

```python
generator = ManimGenerator(llm_client=None)

# 完整生成
result = generator.generate(
    concept: str,
    style: str = "educational",
    quality: str = "m",
    build_tree: bool = True
)

# 仅生成代码
code = generator.generate_code_only(
    concept: str,
    style: str = "educational",
    quality: str = "m"
)
```

### KnowledgeTree

知识树构建器。

```python
tree = KnowledgeTree(llm_client=None, max_depth=5)

# 构建树
root = tree.build_tree(concept: str)

# 获取学习路径
path = tree.get_learning_path()

# 可视化
print(tree.visualize())
```

### ConceptAnalyzer

概念分析器。

```python
analyzer = ConceptAnalyzer(llm_client=None)

# 分析概念
analysis = analyzer.analyze(concept: str)

# 访问结果
print(analysis.type)          # ConceptType
print(analysis.difficulty)    # DifficultyLevel
print(analysis.keywords)      # List[str]
print(analysis.formulas)      # List[str]
```

## 🔮 下一步计划

### 短期
- [x] 创建独立 Python 包
- [x] 实现核心功能（知识树、分析器、生成器）
- [x] 编写使用示例和文档
- [ ] 集成到 concept2animation 服务
- [ ] 添加更多内置模板

### 中期
- [ ] 集成 Claude/GPT API
- [ ] 实现真正的 AI 代码生成
- [ ] 添加单元测试
- [ ] 发布到 PyPI

### 长期
- [ ] Web 界面
- [ ] 动画预览功能
- [ ] 社区模板库
- [ ] 多语言支持

## 📝 许可证

MIT License

---

**Math2Manim 现在是一个独立的、可重用的 Python 包！** 🎉
