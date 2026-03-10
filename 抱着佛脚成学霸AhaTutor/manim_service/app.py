"""
Manim Animation Service - 独立的数学动画生成服务
提供简单的 HTTP API 来生成 Manim 动画
"""

from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse, JSONResponse
from pydantic import BaseModel
import subprocess
import tempfile
import os
import shutil
from pathlib import Path
from typing import Optional

app = FastAPI(title="Manim Animation Service", version="1.0.0")

# 配置
MEDIA_DIR = Path("./media")
MEDIA_DIR.mkdir(exist_ok=True)

class ManimRequest(BaseModel):
    code: str
    scene_name: str = "MathScene"
    quality: str = "m"  # l=低, m=中, h=高
    format: str = "mp4"  # mp4 或 gif

class ManimResponse(BaseModel):
    success: bool
    message: str
    video_path: Optional[str] = None
    error: Optional[str] = None

@app.get("/")
def root():
    return {
        "service": "Manim Animation Service",
        "version": "1.0.0",
        "endpoints": {
            "POST /generate": "生成 Manim 动画",
            "GET /video/{filename}": "获取生成的视频文件",
            "GET /health": "健康检查"
        }
    }

@app.get("/health")
def health_check():
    """健康检查"""
    try:
        result = subprocess.run(
            ["manim", "--version"],
            capture_output=True,
            text=True,
            timeout=5
        )
        manim_installed = result.returncode == 0
        version = result.stdout.strip() if manim_installed else "Not installed"
    except Exception as e:
        manim_installed = False
        version = str(e)

    return {
        "status": "healthy" if manim_installed else "manim not installed",
        "manim_version": version,
        "media_dir": str(MEDIA_DIR.absolute())
    }

@app.post("/generate", response_model=ManimResponse)
async def generate_animation(request: ManimRequest):
    """
    生成 Manim 动画

    示例请求:
    {
        "code": "from manim import *\\n\\nclass MathScene(Scene):\\n    def construct(self):\\n        text = Text('Hello Manim!')\\n        self.play(Write(text))",
        "scene_name": "MathScene",
        "quality": "m",
        "format": "mp4"
    }
    """

    # 创建临时文件
    with tempfile.NamedTemporaryFile(mode='w', suffix='.py', delete=False) as f:
        temp_file = f.name
        f.write(request.code)

    try:
        # 构建 manim 命令
        quality_flag = f"-q{request.quality}"
        output_dir = MEDIA_DIR / "videos"
        output_dir.mkdir(exist_ok=True)

        cmd = [
            "manim",
            quality_flag,
            temp_file,
            request.scene_name,
            "-o", f"{request.scene_name}_{os.urandom(4).hex()}"
        ]

        # 执行 manim
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=60,
            cwd=str(MEDIA_DIR)
        )

        if result.returncode != 0:
            return ManimResponse(
                success=False,
                message="Manim 执行失败",
                error=result.stderr
            )

        # 查找生成的视频文件
        video_files = list(output_dir.rglob(f"{request.scene_name}_*.mp4"))
        if not video_files:
            return ManimResponse(
                success=False,
                message="未找到生成的视频文件",
                error=result.stderr
            )

        video_path = video_files[-1]  # 获取最新的文件
        relative_path = video_path.relative_to(MEDIA_DIR)

        return ManimResponse(
            success=True,
            message="动画生成成功",
            video_path=f"/video/{relative_path}"
        )

    except subprocess.TimeoutExpired:
        return ManimResponse(
            success=False,
            message="执行超时",
            error="Manim 执行超过 60 秒"
        )
    except Exception as e:
        return ManimResponse(
            success=False,
            message="生成失败",
            error=str(e)
        )
    finally:
        # 清理临时文件
        if os.path.exists(temp_file):
            os.remove(temp_file)

@app.get("/video/{path:path}")
async def get_video(path: str):
    """获取生成的视频文件"""
    video_path = MEDIA_DIR / path

    if not video_path.exists():
        raise HTTPException(status_code=404, detail="视频文件不存在")

    return FileResponse(
        video_path,
        media_type="video/mp4",
        filename=video_path.name
    )

@app.delete("/cleanup")
async def cleanup_media():
    """清理所有生成的媒体文件"""
    try:
        if MEDIA_DIR.exists():
            shutil.rmtree(MEDIA_DIR)
            MEDIA_DIR.mkdir(exist_ok=True)
        return {"success": True, "message": "媒体文件已清理"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    print("Starting Manim Animation Service...")
    print("Access at http://localhost:8001")
    print("API docs at http://localhost:8001/docs")
    uvicorn.run(app, host="0.0.0.0", port=8001)
