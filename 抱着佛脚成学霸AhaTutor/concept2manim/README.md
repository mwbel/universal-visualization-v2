# Concept2Manim 项目集合

将数学/物理概念自动转换为 Manim 动画的完整解决方案。

## 📁 项目结构

```
concept2manim/
├── Math2Manim/              # 核心库 (5.5MB)
│   ├── math2manim/          # Python 包
│   │   ├── core/            # 核心算法（知识树、概念分析、代码生成）
│   │   ├── generators/      # 生成器
│   │   └── templates/       # 模板管理
│   ├── examples/            # 使用示例
│   ├── tests/               # 测试套件
│   └── pyproject.toml       # 包配置
│
├── math2manim_service/      # 完整服务实现 (76MB)
│   ├── app.py               # FastAPI 服务
│   ├── index.html           # Web 界面
│   └── media/               # 生成的动画
│   # 端口: 8003
│   # 特性: 反向知识树、学习路径生成
│
├── concept2animation/       # 轻量级实现 (157MB)
│   ├── app.py               # FastAPI 服务
│   ├── index.html           # Web 界面
│   └── media/               # 生成的动画
│   # 端口: 8002
│   # 特性: 模板+AI生成，快速启动
│
└── docs/                    # 项目文档 (72KB)
    ├── INDEX.md             # 文档索引
    ├── README.md            # 使用指南
    ├── LLM_SETUP.md         # AI 配置
    ├── FINAL_REPORT.md      # 项目报告
    └── ...
```

## 🎯 三个组件的关系

### 1. Math2Manim (核心库)
- **类型**: Python 包
- **用途**: 可被其他项目导入使用
- **特点**:
  - 实现了完整的反向知识树算法
  - 可独立安装: `pip install -e Math2Manim/`
  - 提供 API: `from math2manim import ManimGenerator`

### 2. math2manim_service (完整服务)
- **类型**: Web 服务
- **依赖**: 依赖 Math2Manim 核心库
- **特点**:
  - 完整的知识树分解
  - 学习路径生成
  - 概念分析
- **启动**: `cd math2manim_service && python app.py`
- **访问**: http://localhost:8003

### 3. concept2animation (轻量级服务)
- **类型**: Web 服务
- **依赖**: 独立实现，不依赖核心库
- **特点**:
  - 更简单、更快速
  - 直接调用 AI API
  - 适合快速原型
- **启动**: `cd concept2animation && python app.py`
- **访问**: http://localhost:8002

## 🚀 快速开始

### 使用核心库
```bash
cd Math2Manim
pip install -e .

# Python 代码中使用
from math2manim import ManimGenerator
generator = ManimGenerator()
result = generator.generate("勾股定理")
```

### 启动完整服务
```bash
cd math2manim_service
pip install -r requirements.txt
python app.py
# 访问 http://localhost:8003
```

### 启动轻量级服务
```bash
cd concept2animation
pip install -r requirements.txt
python app.py
# 访问 http://localhost:8002
```

## 📚 文档

详细文档请查看 `docs/` 目录：
- [文档索引](docs/INDEX.md)
- [使用指南](docs/README.md)
- [AI 配置](docs/LLM_SETUP.md)
- [项目报告](docs/FINAL_REPORT.md)

## 🎓 核心理念

**反向知识树 (Reverse Knowledge Tree)**

递归分解概念的前置知识，从基础向上构建完整的理解路径。

```
传统方法: 用户输入 → AI 模式匹配 → 生成代码 ❌ (概念跳跃)
Math2Manim: 用户输入 → 递归分解 → 从基础构建 ✅ (完整路径)
```

## 📊 项目历史

- **2025-12-23**: 初始版本 Math2Manim
- **2026-03-11**: 重命名为 Concept2Manim
- **2026-03-15**: 整合所有相关项目到统一目录

## 📄 许可证

MIT License
