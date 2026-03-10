# Manim Animation Service

独立的数学动画生成服务，提供简单的 HTTP API 来生成 Manim 动画。

## 功能特性

- 🎬 通过 HTTP API 生成 Manim 动画
- 📦 独立部署，不依赖其他服务
- 🚀 支持多种质量和格式
- 📁 自动管理生成的媒体文件
- 📖 自动生成的 API 文档

## 快速开始

### 1. 安装依赖

```bash
pip install -r requirements.txt
```

### 2. 启动服务

```bash
python app.py
```

服务将在 http://localhost:8001 启动

### 3. 访问 API 文档

打开浏览器访问：http://localhost:8001/docs

## API 使用示例

### 生成动画

```bash
curl -X POST http://localhost:8001/generate \
  -H "Content-Type: application/json" \
  -d '{
    "code": "from manim import *\n\nclass MathScene(Scene):\n    def construct(self):\n        circle = Circle()\n        self.play(Create(circle))\n        self.wait()",
    "scene_name": "MathScene",
    "quality": "m"
  }'
```

### Python 客户端示例

```python
import requests

code = """
from manim import *

class MathScene(Scene):
    def construct(self):
        text = Text("Hello Manim!")
        self.play(Write(text))
        self.wait()
"""

response = requests.post(
    "http://localhost:8001/generate",
    json={
        "code": code,
        "scene_name": "MathScene",
        "quality": "m"
    }
)

result = response.json()
if result["success"]:
    video_url = f"http://localhost:8001{result['video_path']}"
    print(f"视频生成成功: {video_url}")
else:
    print(f"生成失败: {result['error']}")
```

## API 端点

- `GET /` - 服务信息
- `GET /health` - 健康检查
- `POST /generate` - 生成动画
- `GET /video/{path}` - 获取视频文件
- `DELETE /cleanup` - 清理媒体文件

## 配置参数

### quality (质量)
- `l` - 低质量 (480p)
- `m` - 中质量 (720p) 【默认】
- `h` - 高质量 (1080p)

### format (格式)
- `mp4` - MP4 视频 【默认】
- `gif` - GIF 动图

## 集成到其他项目

这个服务可以轻松集成到任何项目中：

```python
# 在你的项目中调用
import requests

def generate_manim_animation(code: str, scene_name: str = "MathScene"):
    response = requests.post(
        "http://localhost:8001/generate",
        json={"code": code, "scene_name": scene_name}
    )
    return response.json()
```

## 注意事项

- 确保已安装 Manim 及其依赖（LaTeX、FFmpeg 等）
- 生成的视频文件保存在 `./media` 目录
- 每次生成会创建唯一的文件名，避免冲突
- 建议定期清理媒体文件以节省空间
