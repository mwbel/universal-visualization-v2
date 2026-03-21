"""
AhaTutor - 高等数学可视化交互学习平台
整合 Universal RAG (知识检索) + Concept2Animation (动画生成)

核心功能：
1. 自然语言问答 - 基于高等数学知识库
2. 概念可视化 - 自动生成 Manim 动画
3. 学习路径生成 - 基于知识图谱
4. 上下文追问 - 连续对话
"""

from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse, JSONResponse, HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List, Dict
import sys
import os
from pathlib import Path
import json
import subprocess
import tempfile
import shutil
import re

# 添加 universal_rag 到路径
sys.path.insert(0, str(Path(__file__).parent / "universal_rag"))

from universal_rag import RAGPipeline, RAGConfig, RAGStrategy, RAGStrategySelector

app = FastAPI(
    title="AhaTutor - 高等数学可视化学习平台",
    description="基于 AI 的学科可视化交互式学习辅助平台",
    version="1.0.0"
)

# CORS 配置
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 配置路径
BASE_DIR = Path(__file__).parent
MEDIA_DIR = BASE_DIR / "media"
MEDIA_DIR.mkdir(exist_ok=True)

# 数据库路径
DB_PATH = BASE_DIR / "math_concepts.db"
KNOWLEDGE_GRAPH_PATH = BASE_DIR / "knowledge_graph.json"

# 初始化 RAG 系统
# 注意：数据库表名是 concepts，不是 documents
# 字段映射：name -> title, description -> content
rag_config = RAGConfig(
    data_source_type="sqlite",
    data_source_path=str(DB_PATH),
    documents_table="concepts",  # 使用 concepts 表
    relations_table="concept_relations",  # 关系表
    id_field="id",
    title_field="name",  # 标题字段
    content_field="description",  # 内容字段
    retrieval_strategy="hybrid",
    top_k=5,
    enable_graph=True,
    max_hops=2
)

# 应用概念解释优化策略（适合教育场景）
RAGStrategySelector.apply_strategy(rag_config, RAGStrategy.CONCEPT_EXPLANATION)

# 全局 RAG 实例
rag_pipeline = None

# 会话管理（简单的内存存储）
sessions = {}

class QuestionRequest(BaseModel):
    question: str
    session_id: Optional[str] = None
    generate_animation: bool = True
    animation_quality: str = "m"  # l, m, h, k

class AnimationRequest(BaseModel):
    concept: str
    quality: str = "m"
    style: str = "educational"

class AnswerResponse(BaseModel):
    success: bool
    answer: str
    session_id: str
    related_concepts: List[Dict]
    learning_path: Optional[List[Dict]] = None
    animation_url: Optional[str] = None
    animation_code: Optional[str] = None
    error: Optional[str] = None

# ==================== RAG 相关函数 ====================

def initialize_rag():
    """初始化 RAG 系统"""
    global rag_pipeline
    if rag_pipeline is None:
        rag_pipeline = RAGPipeline(rag_config)
        rag_pipeline.__enter__()
        print("✅ RAG 系统已初始化")

def get_answer_from_rag(question: str, top_k: int = 5) -> Dict:
    """从 RAG 系统获取答案"""
    initialize_rag()

    # 搜索相关文档
    results = rag_pipeline.search(question, top_k=top_k)

    # 生成答案
    answer = rag_pipeline.ask(question)

    return {
        "answer": answer,
        "related_docs": results
    }

def get_learning_path(concept_id: int) -> List[Dict]:
    """获取学习路径"""
    initialize_rag()

    try:
        path = rag_pipeline.get_path(target_id=concept_id)
        return path
    except Exception as e:
        print(f"获取学习路径失败: {e}")
        return []

# ==================== 动画生成相关函数 ====================

def extract_scene_class_name(code: str) -> str:
    """从生成的代码中提取 Scene 类名"""
    match = re.search(r'class\s+(\w+)\s*\(\s*(?:Scene|ThreeDScene)\s*\)', code)
    if match:
        return match.group(1)
    return "ConceptAnimation"

def generate_manim_code_simple(concept: str, context: str = "") -> str:
    """生成简单的 Manim 代码（基于模板）"""
    safe_concept = concept.replace('"', '\\"').replace("'", "\\'")

    return f"""from manim import *
import numpy as np

class ConceptAnimation(Scene):
    def construct(self):
        # 标题
        title = Text("{safe_concept}", font_size=48, color=BLUE)
        self.play(Write(title))
        self.wait(1)
        self.play(title.animate.scale(0.6).to_edge(UP))

        # 主要内容
        content = Text("概念可视化", font_size=36, color=WHITE)
        self.play(FadeIn(content))
        self.wait(2)

        # 淡出
        self.play(*[FadeOut(mob) for mob in self.mobjects])
"""

def render_manim_animation(code: str, concept: str, quality: str = "m") -> Dict:
    """渲染 Manim 动画"""
    # 保存代码到临时文件
    with tempfile.NamedTemporaryFile(mode='w', suffix='.py', delete=False) as f:
        temp_file = f.name
        f.write(code)

    try:
        # 提取场景类名
        scene_name = extract_scene_class_name(code)

        # 生成唯一输出名称
        unique_id = os.urandom(4).hex()
        output_name = f"{concept}_{unique_id}"

        # 渲染命令
        quality_flag = f"-q{quality}"
        cmd = [
            "python3", "-m", "manim",
            quality_flag,
            temp_file,
            scene_name,
            "-o", output_name
        ]

        # 执行渲染
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=120
        )

        if result.returncode != 0:
            return {
                "success": False,
                "error": result.stderr
            }

        # 查找生成的视频
        media_root = Path("media")
        video_files = list(media_root.rglob(f"{output_name}.mp4"))

        if not video_files:
            all_videos = sorted(media_root.rglob("*.mp4"), key=lambda p: p.stat().st_mtime, reverse=True)
            if all_videos:
                video_files = [all_videos[0]]
            else:
                return {
                    "success": False,
                    "error": "未找到生成的视频文件"
                }

        video_path = video_files[0]

        # 复制到 MEDIA_DIR
        final_video_dir = MEDIA_DIR / "videos"
        final_video_dir.mkdir(exist_ok=True)
        final_video_path = final_video_dir / f"{output_name}.mp4"
        shutil.copy2(video_path, final_video_path)

        return {
            "success": True,
            "video_url": f"/video/videos/{output_name}.mp4",
            "video_path": str(final_video_path)
        }

    except subprocess.TimeoutExpired:
        return {
            "success": False,
            "error": "渲染超时"
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }
    finally:
        if os.path.exists(temp_file):
            os.remove(temp_file)

# ==================== API 端点 ====================

@app.on_event("startup")
async def startup_event():
    """启动时初始化"""
    initialize_rag()
    print("=" * 70)
    print("AhaTutor 服务已启动")
    print("=" * 70)
    print(f"数据库: {DB_PATH}")
    print(f"知识图谱: {KNOWLEDGE_GRAPH_PATH}")
    print("=" * 70)

@app.on_event("shutdown")
async def shutdown_event():
    """关闭时清理"""
    global rag_pipeline
    if rag_pipeline:
        rag_pipeline.__exit__(None, None, None)
        print("RAG 系统已关闭")

@app.get("/")
async def index():
    """主页"""
    index_file = BASE_DIR / "ahatutor_index.html"
    if index_file.exists():
        return FileResponse(index_file)
    return HTMLResponse("<h1>AhaTutor - 高等数学可视化学习平台</h1><p>前端界面开发中...</p>")

@app.get("/api")
def api_info():
    """API 信息"""
    return {
        "service": "AhaTutor",
        "description": "高等数学可视化交互学习平台",
        "version": "1.0.0",
        "components": {
            "rag": "Universal RAG - 知识检索",
            "animation": "Concept2Animation - 动画生成",
            "database": "高等数学知识库 (13章)"
        },
        "endpoints": {
            "POST /ask": "提问并获取答案（可选生成动画）",
            "POST /animate": "为概念生成动画",
            "GET /concepts": "获取所有概念列表",
            "GET /learning-path/{concept_id}": "获取学习路径",
            "GET /health": "健康检查"
        }
    }

@app.get("/health")
def health_check():
    """健康检查"""
    initialize_rag()

    # 检查数据库
    db_exists = DB_PATH.exists()

    # 检查 Manim
    try:
        result = subprocess.run(
            ["python3", "-m", "manim", "--version"],
            capture_output=True,
            text=True,
            timeout=5
        )
        manim_installed = result.returncode == 0
    except:
        manim_installed = False

    return {
        "status": "healthy" if (db_exists and manim_installed) else "degraded",
        "database": "connected" if db_exists else "not found",
        "manim": "installed" if manim_installed else "not installed",
        "rag": "initialized" if rag_pipeline else "not initialized"
    }

@app.post("/ask", response_model=AnswerResponse)
async def ask_question(request: QuestionRequest):
    """
    提问并获取答案

    示例请求:
    {
        "question": "什么是导数？",
        "generate_animation": true,
        "animation_quality": "m"
    }
    """
    try:
        # 生成或获取 session_id
        session_id = request.session_id or os.urandom(8).hex()

        # 获取答案
        rag_result = get_answer_from_rag(request.question, top_k=5)
        answer = rag_result["answer"]
        related_docs = rag_result["related_docs"]

        # 提取相关概念
        related_concepts = []
        for doc in related_docs[:3]:
            related_concepts.append({
                "id": doc.get("id"),
                "title": doc.get("title", ""),
                "score": doc.get("score", 0)
            })

        # 生成学习路径（如果有相关概念）
        learning_path = None
        if related_concepts and related_concepts[0].get("id"):
            learning_path = get_learning_path(related_concepts[0]["id"])

        # 生成动画（可选）
        animation_url = None
        animation_code = None

        if request.generate_animation and related_concepts:
            concept_name = related_concepts[0]["title"]

            # 生成 Manim 代码
            manim_code = generate_manim_code_simple(concept_name, answer)

            # 渲染动画
            render_result = render_manim_animation(
                manim_code,
                concept_name,
                request.animation_quality
            )

            if render_result["success"]:
                animation_url = render_result["video_url"]
                animation_code = manim_code

        # 保存会话
        sessions[session_id] = {
            "history": sessions.get(session_id, {}).get("history", []) + [
                {"question": request.question, "answer": answer}
            ]
        }

        return AnswerResponse(
            success=True,
            answer=answer,
            session_id=session_id,
            related_concepts=related_concepts,
            learning_path=learning_path,
            animation_url=animation_url,
            animation_code=animation_code
        )

    except Exception as e:
        return AnswerResponse(
            success=False,
            answer="",
            session_id=request.session_id or "",
            related_concepts=[],
            error=str(e)
        )

@app.post("/animate")
async def generate_animation(request: AnimationRequest):
    """
    为指定概念生成动画

    示例请求:
    {
        "concept": "勾股定理",
        "quality": "m",
        "style": "educational"
    }
    """
    try:
        # 生成 Manim 代码
        manim_code = generate_manim_code_simple(request.concept)

        # 渲染动画
        render_result = render_manim_animation(
            manim_code,
            request.concept,
            request.quality
        )

        if render_result["success"]:
            return {
                "success": True,
                "video_url": render_result["video_url"],
                "code": manim_code
            }
        else:
            return {
                "success": False,
                "error": render_result["error"]
            }

    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }

@app.get("/concepts")
def get_concepts():
    """获取所有概念列表"""
    initialize_rag()

    try:
        # 搜索所有文档
        results = rag_pipeline.search("", top_k=100)

        concepts = []
        for doc in results:
            concepts.append({
                "id": doc.get("id"),
                "title": doc.get("title", ""),
                "chapter": doc.get("chapter", ""),
                "difficulty": doc.get("difficulty", 0)
            })

        return {
            "total": len(concepts),
            "concepts": concepts
        }
    except Exception as e:
        return {
            "total": 0,
            "concepts": [],
            "error": str(e)
        }

@app.get("/learning-path/{concept_id}")
def get_concept_learning_path(concept_id: int):
    """获取指定概念的学习路径"""
    try:
        path = get_learning_path(concept_id)
        return {
            "success": True,
            "path": path
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }

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

if __name__ == "__main__":
    import uvicorn
    print("=" * 70)
    print("AhaTutor - 高等数学可视化学习平台")
    print("=" * 70)
    print("整合组件:")
    print("  - Universal RAG: 知识检索")
    print("  - Concept2Animation: 动画生成")
    print("  - 高等数学知识库: 13章完整内容")
    print()
    print("访问地址:")
    print("  - 主页: http://localhost:8000")
    print("  - API 文档: http://localhost:8000/docs")
    print("  - API 信息: http://localhost:8000/api")
    print("=" * 70)
    uvicorn.run(app, host="0.0.0.0", port=8000)
