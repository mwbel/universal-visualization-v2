# Math2Manim Service

基于反向知识树的智能数学动画生成服务

## 🌟 核心特性

- **反向知识树算法**: 递归分解前置知识，构建完整学习路径
- **智能概念分析**: 自动识别概念类型、难度和关键词
- **学习路径生成**: 从基础到高级的完整学习路径
- **高质量代码生成**: 自动生成专业的 Manim 动画代码
- **自动动画渲染**: 一键生成专业动画视频

## 🚀 快速开始

### 1. 安装依赖

```bash
# 安装 Math2Manim 包
cd ../Math2Manim
pip install -e .

# 安装服务依赖
cd ../math2manim_service
pip install -r requirements.txt
```

### 2. 启动服务

```bash
python3 app.py
```

服务将在 http://localhost:8003 启动

### 3. 访问界面

- 主页: http://localhost:8003
- API 文档: http://localhost:8003/docs
- 健康检查: http://localhost:8003/health

## 📡 API 端点

### GET /
主页 - Web 界面

### GET /api
API 信息

### GET /health
健康检查
```json
{
  "status": "healthy",
  "manim_version": "v0.18.0",
  "math2manim_version": "1.0.0",
  "features": {
    "knowledge_tree": true,
    "concept_analysis": true,
    "code_generation": true,
    "video_rendering": true
  }
}
```

### POST /generate
生成动画（完整流程）

**请求体:**
```json
{
  "concept": "勾股定理",
  "style": "educational",
  "quality": "m",
  "build_tree": true,
  "language": "zh"
}
```

**响应:**
```json
{
  "success": true,
  "message": "成功生成 勾股定理 动画",
  "video_path": "/video/videos/勾股定理_abc123.mp4",
  "code": "from manim import *...",
  "scene_name": "PythagoreanTheorem",
  "learning_path": ["三角形", "正方形", "面积", "勾股定理"],
  "knowledge_tree": {...},
  "analysis": {...}
}
```

### POST /analyze
分析概念

**请求参数:**
- `concept` (query): 概念名称

**响应:**
```json
{
  "success": true,
  "concept": "勾股定理",
  "type": "mathematics",
  "difficulty": "middle_school",
  "keywords": ["三角形", "直角", "平方"],
  "formulas": ["a^2 + b^2 = c^2"],
  "prerequisites": ["三角形", "正方形", "面积"],
  "visualization_hints": [...]
}
```

### POST /knowledge-tree
构建知识树

**请求参数:**
- `concept` (query): 概念名称

**响应:**
```json
{
  "success": true,
  "concept": "导数",
  "tree": {
    "concept": "导数",
    "is_basic": false,
    "children": [...]
  },
  "learning_path": ["函数", "极限", "变化率", "导数"],
  "visualization": "└── 导数\n    ├── 函数 ⭐\n    ├── 极限\n    └── 变化率"
}
```

### GET /concepts
获取支持的概念列表

### GET /video/{path}
获取视频文件

### DELETE /cleanup
清理媒体文件

## 🎯 使用示例

### 使用 Web 界面

1. 打开 http://localhost:8003
2. 输入数学概念（如"勾股定理"）
3. 选择动画风格和视频质量
4. 点击"生成动画"
5. 查看学习路径、知识树和生成的动画

### 使用 API

```python
import requests

# 生成动画
response = requests.post('http://localhost:8003/generate', json={
    'concept': '勾股定理',
    'style': 'educational',
    'quality': 'm',
    'build_tree': True
})

result = response.json()
print(f"学习路径: {' → '.join(result['learning_path'])}")
print(f"视频路径: {result['video_path']}")
```

```bash
# 使用 curl
curl -X POST http://localhost:8003/generate \
  -H "Content-Type: application/json" \
  -d '{
    "concept": "勾股定理",
    "style": "educational",
    "quality": "m",
    "build_tree": true
  }'
```

## 🏗️ 架构

```
math2manim_service/
├── app.py              # FastAPI 应用
├── index.html          # Web 界面
├── requirements.txt    # 依赖
├── README.md          # 文档
└── media/             # 生成的媒体文件
    └── videos/        # 视频输出
```

## 🔧 配置

### 端口
默认端口: 8003

修改端口:
```python
# 在 app.py 最后一行
uvicorn.run(app, host="0.0.0.0", port=YOUR_PORT)
```

### 媒体目录
默认: `./media`

修改:
```python
MEDIA_DIR = Path("./your_media_dir")
```

## 🆚 与 concept2animation 的区别

| 特性 | concept2animation | math2manim_service |
|------|-------------------|-------------------|
| 代码生成 | 模板匹配 | AI + 反向知识树 |
| 学习路径 | ❌ | ✅ |
| 知识树 | ❌ | ✅ |
| 概念分析 | 简单 | 深度分析 |
| 扩展性 | 有限 | 高度可扩展 |

## 📊 性能

- 代码生成: <1秒
- 知识树构建: <2秒
- 视频渲染: 30-120秒（取决于质量）

## 🐛 故障排除

### Manim 未安装
```bash
pip install manim
```

### 端口被占用
```bash
# 查找占用端口的进程
lsof -ti :8003

# 终止进程
kill -9 $(lsof -ti :8003)
```

### 视频渲染失败
检查 Manim 是否正确安装:
```bash
python3 -m manim --version
```

## 📝 开发

### 添加新模板
在 `Math2Manim/math2manim/templates/` 中添加新模板

### 扩展概念分析
修改 `Math2Manim/math2manim/core/concept_analyzer.py`

### 自定义知识树
修改 `Math2Manim/math2manim/core/knowledge_tree.py`

## 🤝 集成

### 集成到其他项目

```python
from math2manim import ManimGenerator

generator = ManimGenerator()
result = generator.generate("勾股定理", build_tree=True)
```

### 作为微服务

```yaml
# docker-compose.yml
services:
  math2manim:
    build: ./math2manim_service
    ports:
      - "8003:8003"
```

## 📄 许可证

MIT License

## 🔗 相关项目

- [Math2Manim Package](../Math2Manim) - 核心 Python 包
- [concept2animation](../concept2animation) - 简化版服务
- [manim_service](../manim_service) - Manim 渲染服务

## 📞 支持

- 查看文档: [Math2Manim README](../Math2Manim/README_PACKAGE.md)
- 运行测试: `python3 ../Math2Manim/tests/test_package.py`
- 查看示例: `python3 ../Math2Manim/demo.py`
