from __future__ import annotations

import math
from datetime import datetime
from typing import List

from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates

from app.models import (
    QuickAction,
    Project,
    Thread,
    ViewSpec
)
from app.routers import chat, math as math_router
from app.services.knowledge_loader import KnowledgeLoader
from pathlib import Path

app = FastAPI(title="MaosaiDunkai Tutor Prototype", version="0.4.0")

BASE_DIR = __file__.rsplit("/", 1)[0]

app.mount(
    "/static",
    StaticFiles(directory=f"{BASE_DIR}/static"),
    name="static",
)

templates = Jinja2Templates(directory=f"{BASE_DIR}/templates")

# Include Routers
app.include_router(chat.router)
app.include_router(math_router.router)

# Initialize KnowledgeLoader
WORKSPACE_ROOT = Path(BASE_DIR).parent
kb = KnowledgeLoader(WORKSPACE_ROOT)
kb.load()

# -----------------------------------------------------------------------------
# Data Store (Mock)
# -----------------------------------------------------------------------------

# Patch IDs from aha_jsonc_integration_patch.jsonc
QUICK_ACTION_IDS = [
    "math.C01.S01.P03",
    "math.C04.S01.P04",
    "math.C06.S01.P01",
    "math.C07.S03.P04",
    "math.C08.S01.P01",
    "math.C14.S01.P01"
]

QUICK_ACTIONS = kb.get_quick_actions(QUICK_ACTION_IDS)
# Fallback if KB failed
if not QUICK_ACTIONS:
    QUICK_ACTIONS = [
        QuickAction(
            id="b1_quad", subject="数学", grade="必修一", title="一元二次不等式可视化",
            tags=["不等式", "二次函数", "抛物线"], view_id="quadratic_inequality",
            default_params={"a": 1, "b": -2, "c": -3},
            starter_prompt="观察抛物线与x轴的交点。当 a<0 时，解集怎么变？调整 c 的值看看。"
        )
    ]

PROJECTS = [
    Project(id="p1", name="必修一：函数与集合", subject="数学", grade="高一"),
    Project(id="p2", name="必修二：几何与三角", subject="数学", grade="高一"),
]

# -----------------------------------------------------------------------------
# Endpoints (Pages & Data)
# -----------------------------------------------------------------------------

@app.get("/", response_class=HTMLResponse)
def index(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})

@app.get("/test", response_class=HTMLResponse)
def test_page(request: Request):
    return templates.TemplateResponse("test.html", {"request": request})

@app.get("/debug", response_class=HTMLResponse)
def debug_page(request: Request):
    return templates.TemplateResponse("debug.html", {"request": request})

@app.get("/simple", response_class=HTMLResponse)
def simple_page(request: Request):
    return templates.TemplateResponse("simple.html", {"request": request})

@app.get("/knowledge/tree")
def get_knowledge_tree():
    return kb.get_tree()

@app.get("/knowledge/node/{node_id}")
def get_knowledge_node(node_id: str):
    node = kb.get_node(node_id)
    if not node:
        return {"error": "Not found"}
    return node

@app.get("/knowledge/quick_actions")
def get_quick_actions():
    return QUICK_ACTIONS

@app.get("/projects", response_model=List[Project])
def get_projects():
    return PROJECTS

# -----------------------------------------------------------------------------
# RAG Endpoints
# -----------------------------------------------------------------------------

from app.services.rag_service import get_rag_service
from app.services.ai_service import AIService
from pydantic import BaseModel

class RAGSearchRequest(BaseModel):
    query: str
    top_k: int = 5
    topic: str = None

class RAGChatRequest(BaseModel):
    message: str
    history: list = None

@app.get("/rag/topics")
def get_rag_topics():
    """获取 RAG 知识库中的所有主题"""
    rag = get_rag_service()
    return rag.get_topics()

@app.get("/rag/search")
def rag_search(q: str, top_k: int = 5, topic: str = None):
    """
    RAG 知识检索
    
    Args:
        q: 搜索查询
        top_k: 返回结果数量
        topic: 可选的主题过滤
    """
    rag = get_rag_service()
    results = rag.search(q, top_k=top_k, topic_filter=topic)
    
    return {
        "query": q,
        "count": len(results),
        "results": [
            {
                "content": r.content[:500] + "..." if len(r.content) > 500 else r.content,
                "topic": r.topic,
                "source": r.source,
                "score": round(r.score, 3)
            }
            for r in results
        ]
    }

@app.post("/rag/chat")
def rag_chat(request: RAGChatRequest):
    """
    RAG 增强的 AI 对话
    
    支持知识库检索增强，返回更准确的回答
    """
    result = AIService.chat_with_rag(
        message=request.message,
        history=request.history
    )
    
    return {
        "content": result.get("content", ""),
        "viz_code": result.get("viz_code"),
        "viz_type": result.get("viz_type"),
        "rag_sources": result.get("rag_sources", []),
        "has_rag_context": bool(result.get("rag_context"))
    }

@app.get("/rag/status")
def rag_status():
    """获取 RAG 服务状态"""
    rag = get_rag_service()
    return {
        "ready": rag.is_ready,
        "document_count": rag.collection.count() if rag.is_ready else 0,
        "topics": len(rag.get_topics())
    }
