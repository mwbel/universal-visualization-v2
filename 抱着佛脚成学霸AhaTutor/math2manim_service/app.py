"""
Concept2Manim Service - 基于反向知识树的智能动画生成服务

核心特性：
1. 反向知识树：递归分解前置知识
2. 概念分析：智能识别概念类型和难度
3. 学习路径：生成从基础到高级的完整路径
4. 代码生成：自动生成高质量 Manim 代码
5. 动画渲染：一键生成专业动画视频
"""

from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse, JSONResponse, HTMLResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
import subprocess
import tempfile
import os
import shutil
from pathlib import Path

# 导入 math2manim 包
import sys
sys.path.insert(0, str(Path(__file__).parent.parent / "Math2Manim"))

from math2manim import ManimGenerator, KnowledgeTree, ConceptAnalyzer, LLMClient, LLMConfig

app = FastAPI(
    title="Concept2Manim Service",
    description="基于反向知识树的智能概念动画生成服务",
    version="1.0.0"
)

# 配置
MEDIA_DIR = Path("./media")
MEDIA_DIR.mkdir(exist_ok=True)

STATIC_DIR = Path("./static")
STATIC_DIR.mkdir(exist_ok=True)

# 挂载静态文件
app.mount("/static", StaticFiles(directory=str(STATIC_DIR)), name="static")

# 初始化 LLM 客户端
llm_config = LLMConfig(
    provider="glm",  # 使用 GLM
    model="glm-4-plus"
)
llm_client = LLMClient(llm_config)

# 初始化 Math2Manim 生成器（带 LLM 支持）
generator = ManimGenerator(llm_client=llm_client)
tree_builder = KnowledgeTree(llm_client=llm_client)
analyzer = ConceptAnalyzer(llm_client=llm_client)


class GenerateRequest(BaseModel):
    concept: str  # 概念名称
    style: str = "educational"  # educational, professional, simple
    quality: str = "m"  # l, m, h, k
    build_tree: bool = True  # 是否构建知识树
    language: str = "zh"  # zh 或 en


class GenerateResponse(BaseModel):
    success: bool
    message: str
    video_path: Optional[str] = None
    code: Optional[str] = None
    scene_name: Optional[str] = None
    learning_path: Optional[List[str]] = None
    knowledge_tree: Optional[Dict[str, Any]] = None
    analysis: Optional[Dict[str, Any]] = None
    error: Optional[str] = None


@app.get("/", response_class=HTMLResponse)
async def index():
    """主页"""
    index_file = Path("index.html")
    if index_file.exists():
        return FileResponse(index_file)
    return HTMLResponse("""
    <html>
        <head><title>Concept2Manim Service</title></head>
        <body>
            <h1>Concept2Manim Service</h1>
            <p>基于反向知识树的智能概念动画生成服务</p>
            <p><a href="/docs">API 文档</a></p>
        </body>
    </html>
    """)


@app.get("/api")
def api_info():
    """API 信息"""
    return {
        "service": "Concept2Manim Service",
        "description": "基于反向知识树的智能概念动画生成服务",
        "version": "1.0.0",
        "features": [
            "反向知识树算法",
            "智能概念分析",
            "学习路径生成",
            "高质量代码生成",
            "自动动画渲染"
        ],
        "endpoints": {
            "GET /": "主页",
            "GET /api": "API 信息",
            "GET /health": "健康检查",
            "POST /generate": "生成动画",
            "POST /analyze": "分析概念",
            "POST /knowledge-tree": "构建知识树",
            "GET /concepts": "支持的概念",
            "GET /video/{path}": "获取视频"
        }
    }


@app.get("/health")
def health_check():
    """健康检查"""
    try:
        result = subprocess.run(
            ["python3", "-m", "manim", "--version"],
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
        "concept2manim_version": "1.0.0",
        "llm_available": llm_client.is_available() if llm_client else False,
        "llm_provider": llm_config.provider if llm_client and llm_client.is_available() else None,
        "features": {
            "knowledge_tree": True,
            "concept_analysis": True,
            "code_generation": True,
            "video_rendering": manim_installed,
            "llm_generation": llm_client.is_available() if llm_client else False
        },
        "media_dir": str(MEDIA_DIR.absolute())
    }


@app.post("/analyze")
async def analyze_concept(concept: str):
    """分析概念"""
    try:
        analysis = analyzer.analyze(concept)
        return {
            "success": True,
            "concept": analysis.concept,
            "type": analysis.type.value,
            "difficulty": analysis.difficulty.value,
            "keywords": analysis.keywords,
            "formulas": analysis.formulas,
            "prerequisites": analysis.prerequisites,
            "visualization_hints": analysis.visualization_hints
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/knowledge-tree")
async def build_knowledge_tree(concept: str):
    """构建知识树"""
    try:
        root = tree_builder.build_tree(concept)
        learning_path = tree_builder.get_learning_path()
        tree_viz = tree_builder.visualize()

        return {
            "success": True,
            "concept": concept,
            "tree": root.to_dict(),
            "learning_path": learning_path,
            "visualization": tree_viz
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/concepts")
def get_concepts():
    """获取支持的概念"""
    builtin_concepts = [
        {
            "name": "勾股定理",
            "type": "mathematics",
            "difficulty": "middle_school",
            "has_template": True
        },
        {
            "name": "正弦函数",
            "type": "mathematics",
            "difficulty": "high_school",
            "has_template": True
        },
        {
            "name": "导数",
            "type": "mathematics",
            "difficulty": "high_school",
            "has_template": False
        },
        {
            "name": "积分",
            "type": "mathematics",
            "difficulty": "high_school",
            "has_template": False
        }
    ]

    return {
        "total": len(builtin_concepts),
        "builtin_concepts": builtin_concepts,
        "supports_custom": True,
        "note": "任何数学/物理概念都可以通过 AI 动态生成"
    }


@app.post("/generate", response_model=GenerateResponse)
async def generate_animation(request: GenerateRequest):
    """
    生成动画（完整流程）

    使用 Math2Manim 的反向知识树算法：
    1. 分析概念
    2. 构建知识树（可选）
    3. 生成代码
    4. 渲染动画
    """

    try:
        # 1. 使用 Math2Manim 生成
        result = generator.generate(
            concept=request.concept,
            style=request.style,
            quality=request.quality,
            build_tree=request.build_tree
        )

        if not result["success"]:
            return GenerateResponse(
                success=False,
                message="生成失败",
                error=result.get("error", "Unknown error")
            )

        code = result["code"]
        scene_name = result["scene_name"]

        # 2. 保存代码到临时文件
        with tempfile.NamedTemporaryFile(mode='w', suffix='.py', delete=False) as f:
            temp_file = f.name
            f.write(code)

        try:
            # 3. 渲染动画
            quality_flag = f"-q{request.quality}"
            unique_id = os.urandom(4).hex()
            output_name = f"{request.concept}_{unique_id}"

            cmd = [
                "python3", "-m", "manim",
                quality_flag,
                temp_file,
                scene_name,
                "-o", output_name
            ]

            render_result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                timeout=120
            )

            if render_result.returncode != 0:
                return GenerateResponse(
                    success=False,
                    message="渲染失败",
                    code=code,
                    scene_name=scene_name,
                    learning_path=result.get("learning_path"),
                    analysis=result.get("analysis"),
                    error=render_result.stderr
                )

            # 4. 查找生成的视频
            media_root = Path("media")
            video_files = list(media_root.rglob(f"{output_name}.mp4"))

            if not video_files:
                all_videos = sorted(
                    media_root.rglob("*.mp4"),
                    key=lambda p: p.stat().st_mtime,
                    reverse=True
                )
                if all_videos:
                    video_files = [all_videos[0]]

            if not video_files:
                return GenerateResponse(
                    success=False,
                    message="未找到生成的视频",
                    code=code,
                    scene_name=scene_name,
                    learning_path=result.get("learning_path"),
                    analysis=result.get("analysis"),
                    error="Video file not found after rendering"
                )

            video_path = video_files[0]

            # 5. 复制到 MEDIA_DIR
            final_video_dir = MEDIA_DIR / "videos"
            final_video_dir.mkdir(exist_ok=True)
            final_video_path = final_video_dir / f"{output_name}.mp4"
            shutil.copy2(video_path, final_video_path)

            return GenerateResponse(
                success=True,
                message=f"成功生成 {request.concept} 动画",
                video_path=f"/video/videos/{output_name}.mp4",
                code=code,
                scene_name=scene_name,
                learning_path=result.get("learning_path"),
                knowledge_tree=result.get("knowledge_tree"),
                analysis=result.get("analysis")
            )

        except subprocess.TimeoutExpired:
            return GenerateResponse(
                success=False,
                message="渲染超时",
                code=code,
                scene_name=scene_name,
                error="Rendering timeout (120s)"
            )
        finally:
            if os.path.exists(temp_file):
                os.remove(temp_file)

    except Exception as e:
        return GenerateResponse(
            success=False,
            message="生成失败",
            error=str(e)
        )


@app.get("/video/{path:path}")
async def get_video(path: str):
    """获取视频文件"""
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
    """清理媒体文件"""
    try:
        if MEDIA_DIR.exists():
            shutil.rmtree(MEDIA_DIR)
            MEDIA_DIR.mkdir(exist_ok=True)
        return {"success": True, "message": "媒体文件已清理"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    print("=" * 70)
    print("Concept2Manim Service - 基于反向知识树的智能概念动画生成服务")
    print("=" * 70)
    print()
    print("核心特性：")
    print("  ✓ 反向知识树算法")
    print("  ✓ 智能概念分析")
    print("  ✓ 学习路径生成")
    print("  ✓ 高质量代码生成")
    print("  ✓ 自动动画渲染")
    print()
    print("访问地址：")
    print("  - 主页: http://localhost:8003")
    print("  - API 文档: http://localhost:8003/docs")
    print("  - 健康检查: http://localhost:8003/health")
    print("=" * 70)
    uvicorn.run(app, host="0.0.0.0", port=8003)
