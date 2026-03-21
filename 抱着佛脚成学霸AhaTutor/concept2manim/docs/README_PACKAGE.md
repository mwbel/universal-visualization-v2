# Math2Manim

**智能数学概念到 Manim 动画生成库**

基于反向知识树 (Reverse Knowledge Tree) 理念，将数学/物理概念递归分解为前置知识，从基础向上构建完整的动画。

## 🌟 核心特性

- **反向知识树**：递归分解前置知识，确保完整的理解路径
- **零训练数据**：纯推理生成，不依赖大规模训练集
- **模块化设计**：独立的 Python 包，易于集成
- **多 AI 支持**：支持 Claude/GPT/Gemini 等 LLM
- **内置模板**：高质量动画模板库

## 🚀 快速开始

### 安装

```bash
# 从源码安装
cd Math2Manim
pip install -e .

# 或使用 pip（发布后）
pip install math2manim
```

### 基础使用

```python
from math2manim import ManimGenerator

# 创建生成器
generator = ManimGenerator()

# 生成动画代码
result = generator.generate("勾股定理")

print(result["code"])
print(f"学习路径: {result['learning_path']}")
```

### 使用知识树

```python
from math2manim import KnowledgeTree

# 构建知识树
tree = KnowledgeTree()
root = tree.build_tree("导数")

# 可视化知识树
print(tree.visualize())

# 获取学习路径
path = tree.get_learning_path()
print(f"学习路径: {path}")
```

### 概念分析

```python
from math2manim import ConceptAnalyzer

analyzer = ConceptAnalyzer()
analysis = analyzer.analyze("正弦函数")

print(f"类型: {analysis.type}")
print(f"难度: {analysis.difficulty}")
print(f"关键词: {analysis.keywords}")
print(f"公式: {analysis.formulas}")
```

## 📖 完整示例

```python
from math2manim import ManimGenerator

# 创建生成器
generator = ManimGenerator()

# 生成完整的动画
result = generator.generate(
    concept="勾股定理",
    style="educational",  # educational/professional/simple
    quality="m",          # l/m/h/k
    build_tree=True       # 构建知识树
)

# 保存代码
with open("pythagorean.py", "w") as f:
    f.write(result["code"])

# 查看分析结果
print("概念分析:")
print(f"  类型: {result['analysis']['type']}")
print(f"  难度: {result['analysis']['difficulty']}")
print(f"  关键词: {result['analysis']['keywords']}")

# 查看学习路径
print(f"\n学习路径: {' → '.join(result['learning_path'])}")

# 渲染动画（需要安装 Manim）
# manim -pql pythagorean.py PythagoreanTheorem
```

## 🏗️ 架构设计

```
math2manim/
├── core/                    # 核心模块
│   ├── knowledge_tree.py    # 反向知识树
│   ├── concept_analyzer.py  # 概念分析器
│   └── code_generator.py    # 代码生成器
├── generators/              # 生成器
│   └── base_generator.py    # 基础生成器
├── templates/               # 模板库
│   └── template_manager.py  # 模板管理器
└── __init__.py             # 包入口
```

## 🧠 核心理念：反向知识树

传统 AI 方法的问题：
```
用户输入 → AI 模式匹配 → 生成代码
❌ 容易出现概念跳跃、逻辑不完整
```

Math2Manim 的方法：
```
用户输入 → 递归分解前置知识 → 从基础向上构建
✅ 确保完整的理解路径
```

### 示例：理解"导数"

```
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

## 🎨 支持的概念

### 内置模板
- 勾股定理
- 正弦函数
- 导数
- 积分
- 牛顿第二定律

### AI 动态生成
任何数学/物理概念都可以通过 AI 动态生成（需要配置 LLM API）

## 🔧 集成到现有项目

### 作为 Python 库

```python
from math2manim import ManimGenerator

def generate_animation(concept: str) -> str:
    """生成动画代码"""
    generator = ManimGenerator()
    result = generator.generate_code_only(concept)
    return result.code
```

### 作为 HTTP 服务

```python
from fastapi import FastAPI
from math2manim import ManimGenerator

app = FastAPI()
generator = ManimGenerator()

@app.post("/generate")
async def generate(concept: str):
    result = generator.generate(concept)
    return result
```

## 🤖 AI 集成

### 使用 Claude

```python
from anthropic import Anthropic
from math2manim import ManimGenerator

# 配置 Claude
client = Anthropic(api_key="your-api-key")

# 创建生成器
generator = ManimGenerator(llm_client=client)

# 生成动画
result = generator.generate("量子纠缠")
```

### 使用 OpenAI

```python
from openai import OpenAI
from math2manim import ManimGenerator

client = OpenAI(api_key="your-api-key")
generator = ManimGenerator(llm_client=client)

result = generator.generate("傅里叶变换")
```

## 📊 API 参考

### ManimGenerator

主要生成器类，整合所有功能。

**方法：**
- `generate(concept, style, quality, build_tree)` - 完整生成流程
- `generate_code_only(concept, style, quality)` - 仅生成代码

### KnowledgeTree

反向知识树构建器。

**方法：**
- `build_tree(concept)` - 构建知识树
- `get_learning_path()` - 获取学习路径
- `visualize()` - 可视化知识树

### ConceptAnalyzer

概念分析器。

**方法：**
- `analyze(concept)` - 分析概念

## 🎯 使用场景

1. **教育平台**：自动生成教学动画
2. **内容创作**：快速制作数学视频
3. **学习工具**：可视化复杂概念
4. **研究展示**：学术演示动画

## 🛠️ 开发

```bash
# 克隆仓库
git clone https://github.com/yourusername/math2manim.git
cd math2manim

# 安装开发依赖
pip install -e ".[dev]"

# 运行测试
pytest

# 代码格式化
black math2manim/
```

## 📝 许可证

MIT License

## 🙏 致谢

- **Manim Community** - 强大的动画框架
- **3Blue1Brown** - 数学可视化先驱
- **HarleyCoops/Math-To-Manim** - 原始项目灵感

## 📞 联系方式

- Issues: https://github.com/yourusername/math2manim/issues
- Discussions: https://github.com/yourusername/math2manim/discussions

---

**"从概念到动画，智能生成！"** 🎬✨
