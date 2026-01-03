"""
GLM-4.6 动画生成 Web API
提供 RESTful API 接口用于生成数学动画
"""
from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.responses import HTMLResponse, FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional, List
import os
from pathlib import Path
import json
from datetime import datetime
import uvicorn

# 导入动画生成代理
import sys
project_root = Path(__file__).parent.parent.parent
sys.path.insert(0, str(project_root))

# 直接导入 GLM 代理，避免 __init__.py 的依赖问题
import importlib.util
spec = importlib.util.spec_from_file_location(
    "glm_animation_agent",
    project_root / "backend-v2" / "agents" / "glm_animation_agent.py"
)
glm_module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(glm_module)
GLMAnimationAgent = glm_module.GLMAnimationAgent

# 创建 FastAPI 应用
app = FastAPI(
    title="GLM-4.6 数学动画生成器",
    description="使用 GLM-4.6 AI 自动生成 Manim 数学动画",
    version="1.0.0"
)

# 添加 CORS 支持
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 配置
OUTPUT_DIR = Path("output/web_animations")
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

# 数据模型
class TerminologyRequest(BaseModel):
    """术语生成请求"""
    chinese: str = Field(..., description="中文术语")
    english: str = Field(..., description="英文术语")
    symbol: str = Field(..., description="数学符号（LaTeX 格式）")
    save_to_db: bool = Field(True, description="是否保存到数据库")

class ConceptRequest(BaseModel):
    """概念生成请求"""
    concept: str = Field(..., description="概念描述")
    latex: Optional[str] = Field(None, description="LaTeX 数学表达式")
    duration: Optional[int] = Field(10, description="动画时长（秒）")

class BatchGenerateRequest(BaseModel):
    """批量生成请求"""
    max_count: Optional[int] = Field(5, description="最大生成数量")
    chapter: Optional[str] = Field(None, description="指定章节")

class GenerationResponse(BaseModel):
    """生成响应"""
    success: bool
    scene_name: str
    code: Optional[str]
    file_path: Optional[str]
    tokens_used: Optional[int]
    cost: Optional[float]
    error: Optional[str]
    timestamp: str

# 历史记录（内存存储，生产环境应使用数据库）
generation_history = []

# API 路由

@app.get("/", response_class=HTMLResponse)
async def root():
    """返回主页"""
    # 获取项目根目录
    project_root = Path(__file__).parent.parent.parent
    html_file = project_root / "web_app" / "index.html"

    if html_file.exists():
        return HTMLResponse(content=html_file.read_text(encoding="utf-8"))

    return HTMLResponse(content="""
    <html>
        <head><title>GLM-4.6 数学动画生成器</title></head>
        <body>
            <h1>⚠️ 前端文件未找到</h1>
            <p>请确保 web_app/index.html 文件存在</p>
            <p>查找路径: {html_file}</p>
        </body>
    </html>
    """)

@app.get("/api/health")
async def health_check():
    """健康检查"""
    agent = GLMAnimationAgent()
    return {
        "status": "healthy",
        "model": "GLM-4-Flash",
        "timestamp": datetime.now().isoformat()
    }

@app.post("/api/generate/terminology", response_model=GenerationResponse)
async def generate_from_terminology(request: TerminologyRequest, background_tasks: BackgroundTasks):
    """
    从数学术语生成动画

    示例:
    ```json
    {
        "chinese": "正弦",
        "english": "Sine",
        "symbol": "\\\\sin \\\\alpha = \\\\frac{y}{r}",
        "save_to_db": true
    }
    ```
    """
    try:
        agent = GLMAnimationAgent()

        result = agent.generate_from_terminology(
            term_chinese=request.chinese,
            term_english=request.english,
            math_symbol=request.symbol,
            save_to_file=True
        )

        # 记录历史
        history_item = {
            "type": "terminology",
            "input": request.dict(),
            "result": result,
            "timestamp": datetime.now().isoformat()
        }
        generation_history.append(history_item)

        if result["success"]:
            return GenerationResponse(
                success=True,
                scene_name=result["scene_name"],
                code=result["code"][:500] + "..." if len(result.get("code", "")) > 500 else result.get("code"),
                file_path=result.get("file_path"),
                tokens_used=result.get("tokens_used"),
                cost=result.get("cost"),
                error=None,
                timestamp=datetime.now().isoformat()
            )
        else:
            return GenerationResponse(
                success=False,
                scene_name=request.chinese,
                code=None,
                file_path=None,
                tokens_used=None,
                cost=None,
                error=result.get("error", "未知错误"),
                timestamp=datetime.now().isoformat()
            )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/generate/concept", response_model=GenerationResponse)
async def generate_from_concept(request: ConceptRequest):
    """
    从概念描述生成动画

    示例:
    ```json
    {
        "concept": "展示勾股定理的几何证明",
        "latex": "a^2 + b^2 = c^2",
        "duration": 15
    }
    ```
    """
    try:
        agent = GLMAnimationAgent()

        result = agent.generate_from_concept(
            concept=request.concept,
            latex=request.latex,
            save_to_file=True
        )

        # 记录历史
        history_item = {
            "type": "concept",
            "input": request.dict(),
            "result": result,
            "timestamp": datetime.now().isoformat()
        }
        generation_history.append(history_item)

        if result["success"]:
            return GenerationResponse(
                success=True,
                scene_name=result["scene_name"],
                code=result["code"][:500] + "..." if len(result.get("code", "")) > 500 else result.get("code"),
                file_path=result.get("file_path"),
                tokens_used=result.get("tokens_used"),
                cost=result.get("cost"),
                error=None,
                timestamp=datetime.now().isoformat()
            )
        else:
            return GenerationResponse(
                success=False,
                scene_name=request.concept[:20],
                code=None,
                file_path=None,
                tokens_used=None,
                cost=None,
                error=result.get("error", "未知错误"),
                timestamp=datetime.now().isoformat()
            )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/history")
async def get_history(limit: int = 20):
    """获取生成历史"""
    return {
        "total": len(generation_history),
        "items": generation_history[-limit:],
        "timestamp": datetime.now().isoformat()
    }

@app.get("/api/stats")
async def get_statistics():
    """获取统计信息"""
    total_generations = len(generation_history)
    successful = sum(1 for h in generation_history if h.get("result", {}).get("success"))
    total_cost = sum(h.get("result", {}).get("cost", 0) for h in generation_history)

    return {
        "total_generations": total_generations,
        "successful": successful,
        "failed": total_generations - successful,
        "success_rate": successful / total_generations if total_generations > 0 else 0,
        "total_cost": total_cost,
        "average_cost": total_cost / total_generations if total_generations > 0 else 0,
        "timestamp": datetime.now().isoformat()
    }

@app.get("/api/download/{filename}")
async def download_file(filename: str):
    """下载生成的 Python 文件"""
    file_path = OUTPUT_DIR / filename

    if not file_path.exists():
        raise HTTPException(status_code=404, detail="文件不存在")

    return FileResponse(
        path=file_path,
        filename=filename,
        media_type="text/x-python"
    )

@app.get("/api/code/{scene_name}")
async def get_code(scene_name: str):
    """获取生成的代码"""
    file_path = OUTPUT_DIR / f"{scene_name}.py"

    if not file_path.exists():
        raise HTTPException(status_code=404, detail="文件不存在")

    code = file_path.read_text(encoding="utf-8")

    return {
        "scene_name": scene_name,
        "code": code,
        "file_path": str(file_path)
    }

# 启动服务器
if __name__ == "__main__":
    print("🚀 启动 GLM-4.6 数学动画生成器 Web 服务")
    print("=" * 60)
    print("📱 访问地址: http://localhost:8000")
    print("📚 API 文档: http://localhost:8000/docs")
    print("=" * 60)

    uvicorn.run(
        app,
        host="0.0.0.0",
        port=8000,
        log_level="info"
    )
