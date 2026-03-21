# Concept2Animation - 概念到动画生成服务

基于 [Math2Manim](../Math2Manim) 项目的核心思想，自动将数学/物理概念转换为 Manim 动画。

## 🌟 核心特性

- 📝 **输入概念**：用自然语言描述数学/物理概念
- 🤖 **AI 生成**：自动生成高质量 Manim 代码
- 🎬 **自动渲染**：一键生成专业动画视频
- 🎨 **多种风格**：教育、专业、简洁等多种风格
- 🌍 **多语言**：支持中文和英文

## 🚀 快速开始

### 1. 安装依赖

```bash
pip install -r requirements.txt
```

### 2. 启动服务

```bash
python app.py
```

服务将在 **http://localhost:8002** 启动

### 3. 访问 API 文档

浏览器打开：**http://localhost:8002/docs**

## 📖 使用示例

### 查看支持的概念

```bash
curl http://localhost:8002/concepts
```

### 生成勾股定理动画

```bash
curl -X POST http://localhost:8002/generate \
  -H "Content-Type: application/json" \
  -d '{
    "concept": "勾股定理",
    "quality": "m",
    "style": "educational"
  }'
```

### Python 客户端

```python
import requests

response = requests.post(
    "http://localhost:8002/generate",
    json={
        "concept": "勾股定理",
        "language": "zh",
        "quality": "m",
        "style": "educational"
    }
)

result = response.json()
if result["success"]:
    print(f"✅ 动画生成成功！")
    print(f"视频地址: http://localhost:8002{result['video_path']}")
    print(f"生成的代码:\n{result['code']}")
else:
    print(f"❌ 生成失败: {result['error']}")
```

## 🎯 支持的概念

当前内置模板：

1. **勾股定理** - 直角三角形的经典定理
2. **正弦函数** - 三角函数的可视化
3. **导数** - 微积分基础概念
4. **积分** - 面积累积的可视化

更多概念可以通过 AI 动态生成！

## 🎨 动画风格

- `educational` - 教育风格（默认）：详细讲解，适合教学
- `professional` - 专业风格：精致效果，适合演示
- `simple` - 简洁风格：快速生成，适合测试

## ⚙️ 质量设置

- `l` - 低质量 (480p) - 快速预览
- `m` - 中质量 (720p) - 默认推荐
- `h` - 高质量 (1080p) - 专业制作
- `k` - 4K质量 (2160p) - 最高质量

## 🏗️ 架构设计

基于 Math2Manim 的核心思想：

```
用户输入概念
    ↓
概念分析 (识别关键词、前置知识)
    ↓
代码生成 (使用模板或 AI)
    ↓
Manim 渲染
    ↓
返回视频 + 代码
```

### 核心组件

1. **概念模板库** - 预定义的高质量动画模板
2. **AI 代码生成器** - 动态生成 Manim 代码
3. **渲染引擎** - 自动执行 Manim 渲染
4. **媒体管理** - 管理生成的视频文件

## 📊 API 端点

| 端点 | 方法 | 描述 |
|------|------|------|
| `/` | GET | 服务信息 |
| `/health` | GET | 健康检查 |
| `/concepts` | GET | 获取支持的概念列表 |
| `/generate` | POST | 生成概念动画 |
| `/video/{path}` | GET | 获取视频文件 |
| `/cleanup` | DELETE | 清理媒体文件 |

## 🔧 配置

### 环境变量

```bash
# 可选：配置 AI API（未来功能）
export ANTHROPIC_API_KEY="your-api-key"
export OPENAI_API_KEY="your-api-key"
```

### 自定义模板

在 `app.py` 中的 `CONCEPT_TEMPLATES` 添加新概念：

```python
CONCEPT_TEMPLATES = {
    "你的概念": {
        "keywords": ["关键词1", "关键词2"],
        "prerequisites": ["前置知识1", "前置知识2"],
        "template": "template_name"
    }
}
```

## 🎓 基于 Math2Manim 项目

本服务继承了 Math2Manim 的核心理念：

- ✅ **反向知识树**：递归分解前置知识
- ✅ **零训练数据**：纯推理生成，不依赖训练集
- ✅ **多风格支持**：从简单到专业的多种风格
- ✅ **LaTeX 富提示**：精确的数学表达

详见：[Math2Manim 项目文档](../Math2Manim/README.md)

## 🔮 未来计划

### 短期
- [ ] 集成 Claude API 实现真正的 AI 生成
- [ ] 添加更多概念模板（微积分、线性代数、物理）
- [ ] 支持自定义参数（颜色、速度、风格）

### 中期
- [ ] 实现前置知识递归分解
- [ ] 构建完整的知识图谱
- [ ] 支持多场景组合动画

### 长期
- [ ] Web 界面可视化编辑器
- [ ] 动画知识库和分享平台
- [ ] 多语言旁白生成

## 📝 示例输出

### 请求
```json
{
  "concept": "勾股定理",
  "quality": "m",
  "style": "educational"
}
```

### 响应
```json
{
  "success": true,
  "message": "成功生成 勾股定理 动画",
  "video_path": "/video/videos/勾股定理_a3f2.mp4",
  "code": "from manim import *\n\nclass PythagoreanTheorem(Scene):\n    ...",
  "concept_analysis": {
    "concept": "勾股定理",
    "recognized": true,
    "prerequisites": ["三角形", "正方形", "面积"]
  }
}
```

## 🤝 集成示例

### 集成到现有项目

```python
# 在你的项目中
import requests

def generate_math_animation(concept: str):
    """生成数学概念动画"""
    response = requests.post(
        "http://localhost:8002/generate",
        json={"concept": concept, "quality": "m"}
    )
    return response.json()

# 使用
result = generate_math_animation("勾股定理")
if result["success"]:
    video_url = f"http://localhost:8002{result['video_path']}"
    print(f"动画已生成: {video_url}")
```

## 📞 技术栈

- **FastAPI** - 现代 Web 框架
- **Manim** - 数学动画引擎
- **Python 3.10+** - 编程语言
- **Pydantic** - 数据验证
- **Uvicorn** - ASGI 服务器

## 🙏 致谢

- **Math2Manim** - 核心思想来源
- **Manim Community** - 强大的动画框架
- **3Blue1Brown** - 数学可视化先驱

## 📄 许可证

MIT License

---

**"从概念到动画，一键生成！"** 🎬✨
