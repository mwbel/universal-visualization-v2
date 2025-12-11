"""
万物可视化 v2.0 - 基于方案A的集中式路由架构
主API网关和学科Agent管理层
"""

from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse, JSONResponse
from pydantic import BaseModel, Field
from typing import Dict, List, Optional, Any, Union
import json
import uuid
import asyncio
from datetime import datetime
import os
from pathlib import Path

# 导入Agent系统
from agents.base_agent import BaseVisualizationAgent
from agents.mathematics_agent import MathematicsAgent
from agents.astronomy_agent import AstronomyAgent
from agents.physics_agent import PhysicsAgent
from agents.chemistry_agent import ChemistryAgent
from agents.biology_agent import BiologyAgent
from agents.router_manager import VisualizationRouter
from agents.template_engine import UnifiedTemplateEngine

# 导入配置
from config import settings

# 导入新的聊天API
from api import api_router, ChatIntegration

app = FastAPI(
    title="万物可视化 v2.0 API",
    description="基于集中式路由架构的智能可视化生成平台 - 支持现代聊天界面",
    version="2.0.0"
)

# CORS配置
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 静态文件服务
app.mount("/static", StaticFiles(directory="static"), name="static")

# 挂载前端目录
app.mount("/frontend-v2", StaticFiles(directory="../frontend-v2", html=True), name="frontend")
app.mount("/main-app", StaticFiles(directory="../main-app", html=True), name="main-app")
app.mount("/frontend-v3", StaticFiles(directory="../frontend-v3", html=True), name="frontend-v3")

# 注册新的聊天API路由
app.include_router(api_router)

# 全局状态
class AppState:
    def __init__(self):
        self.router = VisualizationRouter()
        self.template_engine = UnifiedTemplateEngine()
        self.active_generations: Dict[str, Dict] = {}

state = AppState()

# ==============================
# 数据模型定义
# ==============================

class UniversalVisualizationRequest(BaseModel):
    """通用可视化生成请求"""
    prompt: str = Field(..., description="用户输入的可视化需求", min_length=1, max_length=5000)
    user_preferences: Optional[Dict[str, Any]] = Field(default={}, description="用户偏好设置")
    template_id: Optional[str] = Field(default=None, description="指定模板ID")
    parameters: Optional[Dict[str, Any]] = Field(default={}, description="可视化参数")

class ClassificationRequest(BaseModel):
    """学科分类请求"""
    prompt: str = Field(..., description="需要分类的文本")

class TemplateResponse(BaseModel):
    """模板响应"""
    id: str
    name: str
    description: str
    subject: str
    category: str
    difficulty: str
    parameters: List[Dict[str, Any]]
    keywords: List[str]
    examples: List[str]

class GenerationResponse(BaseModel):
    """生成响应"""
    generation_id: str
    status: str
    message: str
    estimated_time: Optional[int] = None
    html_url: Optional[str] = None

# ==============================
# 统一API网关端点
# ==============================

@app.get("/")
async def root():
    """API根端点"""
    return {
        "name": "万物可视化 v2.0 API",
        "version": "2.0.0",
        "description": "基于集中式路由架构的智能可视化生成平台 - 支持现代聊天界面",
        "frontend": {
            "v2": "/frontend-v2",
            "v3_chat": "/frontend-v3"
        },
        "api_versions": {
            "v2": {
                "description": "原始可视化API",
                "endpoints": {
                    "generate": "/api/v2/generate",
                    "classify": "/api/v2/classify",
                    "templates": "/api/v2/templates",
                    "status": "/api/v2/status/{generation_id}",
                    "highschool": "/api/v2/highschool/generate"
                }
            },
            "v3": {
                "description": "现代聊天界面API",
                "endpoints": {
                    "chat": "/api/v3/chat",
                    "files": "/api/v3/files",
                    "user": "/api/v3/user"
                }
            }
        }
    }

# 茅塞顿开专用API端点（必须放在通用路由前面，避免路径冲突）
class HighSchoolRequest(BaseModel):
    prompt: str = Field(..., description="用户输入的自然语言描述")
    grade_level: str = Field(default="high_school", description="年级水平: elementary, middle_school, high_school, university")
    subject: Optional[str] = Field(None, description="指定学科: mathematics, physics, chemistry, biology, astronomy")
    interaction_mode: str = Field(default="visualization", description="交互模式: chat, visualization, both")
    user_preferences: Dict[str, Any] = Field(default_factory=dict, description="用户偏好设置")

class HighSchoolResponse(BaseModel):
    success: bool
    subject: str
    generation_id: str
    message: Optional[str] = None
    visualization: Optional[Dict[str, Any]] = None
    metadata: Dict[str, Any] = {}
    error: Optional[str] = None

@app.post("/api/v2/highschool/generate", response_model=HighSchoolResponse)
async def highschool_generate(request: HighSchoolRequest):
    """茅塞顿开专用生成接口 - 高中全科可视化"""
    try:
        print(f"🎓 茅塞顿开请求: {request.prompt[:50]}...")
        print(f"📚 年级水平: {request.grade_level}")
        print(f"🔬 指定学科: {request.subject or '自动识别'}")

        # 1. 学科识别（如果未指定）
        if request.subject:
            subject = request.subject
            print(f"✅ 使用指定学科: {subject}")
        else:
            subject = await state.router.subject_classifier.classify(request.prompt)
            print(f"🤖 智能识别学科: {subject}")

        # 2. 高中年级适配
        user_preferences = request.user_preferences.copy()
        user_preferences["grade_level"] = request.grade_level
        user_preferences["interaction_mode"] = request.interaction_mode

        # 3. 增强提示词（适配高中教育）
        enhanced_prompt = f"{request.prompt} [高中{request.grade_level}年级]"

        # 4. 调用路由生成
        response = await state.router.route_request(enhanced_prompt, user_preferences)

        if not response.get("success"):
            raise HTTPException(status_code=500, detail="可视化生成失败")

        # 5. 构建茅塞顿开专用响应
        result = {
            "success": True,
            "subject": subject,
            "generation_id": str(uuid.uuid4()),
            "message": f"成功生成{subject}学科的可视化内容",
            "visualization": {
                "type": response.get("requirement", {}).get("visualization_type", "default"),
                "title": response.get("template", {}).get("name", "默认可视化"),
                "html_content": response.get("html_content", ""),
                "interactive_elements": response.get("config", {}).get("interactive_elements", []),
                "concepts": response.get("requirement", {}).get("concepts", []),
                "grade_level": request.grade_level,
                "subject": subject
            },
            "metadata": {
                "processing_time": response.get("routing_info", {}).get("processing_time", "未知"),
                "agent_id": response.get("agent_info", {}).get("agent_id", "未知"),
                "template_id": response.get("template", {}).get("id", "default"),
                "confidence": response.get("routing_info", {}).get("confidence", 0.85),
                "request_type": "highschool_visualization"
            }
        }

        print(f"✅ 茅塞顿开生成完成: {subject}学科")
        return result

    except HTTPException:
        raise
    except Exception as e:
        error_msg = f"茅塞顿开生成失败: {str(e)}"
        print(f"❌ {error_msg}")

        return {
            "success": False,
            "subject": request.subject or "general",
            "generation_id": str(uuid.uuid4()),
            "message": "生成过程中发生错误",
            "error": error_msg,
            "metadata": {
                "request_type": "highschool_visualization",
                "error_details": str(e)
            }
        }

@app.post("/api/v2/generate", response_model=GenerationResponse)
async def universal_generate(request: UniversalVisualizationRequest, background_tasks: BackgroundTasks):
    """
    通用可视化生成接口 - 方案A核心入口

    功能流程：
    1. 智能学科识别
    2. Agent需求解析
    3. 模板匹配
    4. 可视化生成
    """
    try:
        # 生成唯一ID
        generation_id = str(uuid.uuid4())

        # 记录生成状态
        state.active_generations[generation_id] = {
            "status": "initializing",
            "created_at": datetime.now(),
            "prompt": request.prompt,
            "progress": 0
        }

        # 后台任务处理
        background_tasks.add_task(
            process_visualization_generation,
            generation_id,
            request.prompt,
            request.user_preferences or {},
            request.template_id,
            request.parameters or {}
        )

        return GenerationResponse(
            generation_id=generation_id,
            status="processing",
            message="已开始生成可视化，请稍候...",
            estimated_time=5
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"生成失败: {str(e)}")

@app.post("/api/v2/{subject}/generate", response_model=GenerationResponse)
async def subject_specific_generate(subject: str, request: UniversalVisualizationRequest, background_tasks: BackgroundTasks):
    """
    学科特定可视化生成接口
    支持的学科: mathematics, astronomy, physics, chemistry, biology
    排除 "highschool" 避免路径冲突
    """
    supported_subjects = ["mathematics", "astronomy", "physics", "chemistry", "biology"]
    if subject not in supported_subjects or subject == "highschool":
        raise HTTPException(
            status_code=400,
            detail=f"不支持的学科: {subject}。支持的学科: {', '.join(supported_subjects)}"
        )

    try:
        generation_id = str(uuid.uuid4())

        state.active_generations[generation_id] = {
            "status": "initializing",
            "created_at": datetime.now(),
            "subject": subject,
            "prompt": request.prompt,
            "progress": 0
        }

        background_tasks.add_task(
            process_subject_specific_generation,
            generation_id,
            subject,
            request.prompt,
            request.user_preferences or {},
            request.template_id,
            request.parameters or {}
        )

        return GenerationResponse(
            generation_id=generation_id,
            status="processing",
            message=f"已开始生成{subject}可视化...",
            estimated_time=5
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"{subject}学科生成失败: {str(e)}")

@app.post("/api/v2/classify")
async def classify_subject(request: ClassificationRequest):
    """智能学科分类接口"""
    try:
        subject = await state.router.subject_classifier.classify(request.prompt)

        return {
            "subject": subject,
            "confidence": 0.85,  # 简化版，实际应该计算置信度
            "all_scores": {
                "mathematics": 0.9 if "数学" in request.prompt else 0.1,
                "astronomy": 0.9 if "天文" in request.prompt else 0.1,
                "physics": 0.9 if "物理" in request.prompt else 0.1,
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"分类失败: {str(e)}")

# 茅塞顿开专用API端点
class HighSchoolRequest(BaseModel):
    prompt: str = Field(..., description="用户输入的自然语言描述")
    grade_level: str = Field(default="high_school", description="年级水平: elementary, middle_school, high_school, university")
    subject: Optional[str] = Field(None, description="指定学科: mathematics, physics, chemistry, biology, astronomy")
    interaction_mode: str = Field(default="visualization", description="交互模式: chat, visualization, both")
    user_preferences: Dict[str, Any] = Field(default_factory=dict, description="用户偏好设置")

class HighSchoolResponse(BaseModel):
    success: bool
    subject: str
    generation_id: str
    message: Optional[str] = None
    visualization: Optional[Dict[str, Any]] = None
    metadata: Dict[str, Any] = {}
    error: Optional[str] = None

@app.post("/api/v2/highschool/generate", response_model=HighSchoolResponse)
async def highschool_generate(request: HighSchoolRequest):
    """茅塞顿开专用生成接口 - 高中全科可视化"""
    try:
        print(f"🎓 茅塞顿开请求: {request.prompt[:50]}...")
        print(f"📚 年级水平: {request.grade_level}")
        print(f"🔬 指定学科: {request.subject or '自动识别'}")

        # 1. 学科识别（如果未指定）
        if request.subject:
            subject = request.subject
            print(f"✅ 使用指定学科: {subject}")
        else:
            subject = await state.router.subject_classifier.classify(request.prompt)
            print(f"🤖 智能识别学科: {subject}")

        # 2. 高中年级适配
        user_preferences = request.user_preferences.copy()
        user_preferences["grade_level"] = request.grade_level
        user_preferences["interaction_mode"] = request.interaction_mode

        # 3. 增强提示词（适配高中教育）
        enhanced_prompt = f"{request.prompt} [高中{request.grade_level}年级]"

        # 4. 调用路由生成
        response = await state.router.route_request(enhanced_prompt, user_preferences)

        if not response.get("success"):
            raise HTTPException(status_code=500, detail="可视化生成失败")

        # 5. 构建茅塞顿开专用响应
        result = {
            "success": True,
            "subject": subject,
            "generation_id": str(uuid.uuid4()),
            "message": f"成功生成{subject}学科的可视化内容",
            "visualization": {
                "type": response.get("requirement", {}).get("visualization_type", "default"),
                "title": response.get("template", {}).get("name", "默认可视化"),
                "html_content": response.get("html_content", ""),
                "interactive_elements": response.get("config", {}).get("interactive_elements", []),
                "concepts": response.get("requirement", {}).get("concepts", []),
                "grade_level": request.grade_level,
                "subject": subject
            },
            "metadata": {
                "processing_time": response.get("routing_info", {}).get("processing_time", "未知"),
                "agent_id": response.get("agent_info", {}).get("agent_id", "未知"),
                "template_id": response.get("template", {}).get("id", "default"),
                "confidence": response.get("routing_info", {}).get("confidence", 0.85),
                "request_type": "highschool_visualization"
            }
        }

        print(f"🎉 茅塞顿开生成完成: {subject} 学科")
        return result

    except Exception as e:
        error_msg = f"茅塞顿开生成失败: {str(e)}"
        print(f"❌ {error_msg}")

        return {
            "success": False,
            "subject": request.subject or "general",
            "generation_id": str(uuid.uuid4()),
            "message": "生成过程中发生错误",
            "error": error_msg,
            "metadata": {
                "request_type": "highschool_visualization",
                "error_details": str(e)
            }
        }

@app.post("/api/v2/highschool/{subject}/generate", response_model=HighSchoolResponse)
async def highschool_subject_generate(subject: str, request: HighSchoolRequest):
    """茅塞顿开学科专用生成接口"""
    try:
        # 验证学科支持
        supported_subjects = state.router.get_supported_subjects()
        if subject not in supported_subjects:
            raise HTTPException(
                status_code=400,
                detail=f"不支持的学科: {subject}。支持的学科: {', '.join(supported_subjects)}"
            )

        # 覆盖请求中的学科
        request.subject = subject

        # 调用主生成接口
        return await highschool_generate(request)

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"学科专用生成失败: {str(e)}")

@app.get("/api/v2/highschool/subjects")
async def get_highschool_subjects():
    """获取茅塞顿开支持的学科列表"""
    try:
        supported_subjects = state.router.get_supported_subjects()

        subject_info = {}
        for subject in supported_subjects:
            info = state.router.get_subject_info(subject)
            subject_info[subject] = {
                "name": info.get("agent_id", subject),
                "supported_topics": info.get("supported_topics", []),
                "template_count": info.get("template_count", 0),
                "grade_levels": ["middle_school", "high_school", "university"]
            }

        return {
            "total_subjects": len(supported_subjects),
            "subjects": supported_subjects,
            "subject_info": subject_info,
            "grade_levels": ["elementary", "middle_school", "high_school", "university"],
            "features": ["智能学科识别", "多模板支持", "交互式可视化", "年级适配"]
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取学科信息失败: {str(e)}")

@app.get("/api/v2/templates")
async def get_all_templates():
    """获取所有学科模板"""
    try:
        templates = await state.template_engine.get_all_templates()
        return {
            "total": len(templates),
            "subjects": ["mathematics", "astronomy", "physics"],
            "templates": templates
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取模板失败: {str(e)}")

@app.get("/api/v2/{subject}/templates")
async def get_subject_templates(subject: str):
    """获取特定学科模板"""
    try:
        templates = await state.template_engine.get_subject_templates(subject)
        return {
            "subject": subject,
            "total": len(templates),
            "templates": templates
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取{subject}模板失败: {str(e)}")

@app.get("/api/v2/templates/search")
async def search_templates(query: str, subject: Optional[str] = None):
    """搜索模板"""
    try:
        templates = await state.template_engine.search_templates(query, subject)
        return {
            "query": query,
            "subject": subject,
            "total": len(templates),
            "templates": templates
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"搜索模板失败: {str(e)}")

@app.get("/api/v2/status/{generation_id}")
async def get_generation_status(generation_id: str):
    """获取生成状态"""
    if generation_id not in state.active_generations:
        raise HTTPException(status_code=404, detail="生成任务不存在")

    generation_info = state.active_generations[generation_id]

    return {
        "generation_id": generation_id,
        "status": generation_info["status"],
        "progress": generation_info.get("progress", 0),
        "created_at": generation_info["created_at"],
        "html_url": generation_info.get("html_url"),
        "error": generation_info.get("error")
    }

@app.get("/api/v2/visualizations/{viz_id}")
async def get_visualization(viz_id: str):
    """获取可视化结果"""
    try:
        # 这里应该从存储中读取HTML内容
        viz_path = Path(f"static/visualizations/{viz_id}.html")

        if not viz_path.exists():
            raise HTTPException(status_code=404, detail="可视化不存在")

        with open(viz_path, 'r', encoding='utf-8') as f:
            html_content = f.read()

        return {
            "visualization_id": viz_id,
            "html_content": html_content,
            "title": f"可视化 - {viz_id}",
            "created_at": datetime.now().isoformat()
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取可视化失败: {str(e)}")

# ==============================
# 后台任务处理
# ==============================

async def process_visualization_generation(
    generation_id: str,
    prompt: str,
    user_preferences: Dict[str, Any],
    template_id: Optional[str],
    parameters: Dict[str, Any]
):
    """处理可视化生成 - 方案A核心逻辑"""

    try:
        # 1. 更新状态: 学科识别
        state.active_generations[generation_id]["status"] = "classifying"
        state.active_generations[generation_id]["progress"] = 10
        await asyncio.sleep(0.5)  # 模拟处理时间

        # 2. 智能路由分发
        result = await state.router.route_request(prompt, user_preferences)

        # 3. 更新状态: 生成中
        state.active_generations[generation_id]["status"] = "generating"
        state.active_generations[generation_id]["progress"] = 50
        state.active_generations[generation_id]["subject"] = result["subject"]

        # 4. 生成可视化HTML
        html_content = result["html_content"]
        viz_id = f"viz_{generation_id[:8]}"

        # 5. 保存HTML文件
        output_dir = Path("static/visualizations")
        output_dir.mkdir(exist_ok=True)

        with open(output_dir / f"{viz_id}.html", 'w', encoding='utf-8') as f:
            f.write(html_content)

        # 6. 更新完成状态
        state.active_generations[generation_id].update({
            "status": "completed",
            "progress": 100,
            "html_url": f"/api/v2/visualizations/{viz_id}",
            "completed_at": datetime.now()
        })

    except Exception as e:
        state.active_generations[generation_id].update({
            "status": "failed",
            "error": str(e),
            "failed_at": datetime.now()
        })

async def process_subject_specific_generation(
    generation_id: str,
    subject: str,
    prompt: str,
    user_preferences: Dict[str, Any],
    template_id: Optional[str],
    parameters: Dict[str, Any]
):
    """处理学科特定生成"""

    try:
        # 直接使用指定学科的Agent
        agent = state.router.agents.get(subject)
        if not agent:
            raise ValueError(f"不支持的学科: {subject}")

        # 更新状态
        state.active_generations[generation_id]["status"] = "parsing"
        state.active_generations[generation_id]["progress"] = 20

        # 解析需求
        requirement = await agent.parse_requirement(prompt)

        # 匹配模板
        state.active_generations[generation_id]["status"] = "matching"
        state.active_generations[generation_id]["progress"] = 40

        template = await agent.match_template(requirement)

        # 生成配置和可视化
        state.active_generations[generation_id]["status"] = "generating"
        state.active_generations[generation_id]["progress"] = 70

        config = await agent.generate_config(requirement, template, user_preferences)
        html_content = await agent.generate_visualization(config)

        # 保存结果
        viz_id = f"viz_{generation_id[:8]}"
        output_dir = Path("static/visualizations")
        output_dir.mkdir(exist_ok=True)

        with open(output_dir / f"{viz_id}.html", 'w', encoding='utf-8') as f:
            f.write(html_content)

        # 完成状态
        state.active_generations[generation_id].update({
            "status": "completed",
            "progress": 100,
            "html_url": f"/api/v2/visualizations/{viz_id}",
            "completed_at": datetime.now()
        })

    except Exception as e:
        state.active_generations[generation_id].update({
            "status": "failed",
            "error": str(e),
            "failed_at": datetime.now()
        })

# ==============================
# 健康检查和监控
# ==============================

@app.get("/health")
async def health_check():
    """健康检查"""
    return {
        "status": "healthy",
        "version": "2.0.0",
        "agents": len(state.router.agents),
        "active_generations": len(state.active_generations),
        "timestamp": datetime.now()
    }

@app.get("/api/v2/health")
async def api_v2_health_check():
    """API v2 健康检查 - 匹配前端调用"""
    return {
        "status": "healthy",
        "version": "2.0.0",
        "api_version": "v2",
        "agents": len(state.router.agents),
        "active_generations": len(state.active_generations),
        "timestamp": datetime.now(),
        "endpoints": {
            "health": "/api/v2/health",
            "generate": "/api/v2/generate",
            "classify": "/api/v2/classify",
            "templates": "/api/v2/templates",
            "status": "/api/v2/status/{generation_id}",
            "visualizations": "/api/v2/visualizations/{viz_id}"
        }
    }

@app.get("/api/v2/registry")
async def get_registry():
    """获取系统注册信息"""
    return {
        "agents": list(state.router.agents.keys()),
        "subjects": ["mathematics", "astronomy", "physics"],
        "template_engine": {
            "total_templates": len(await state.template_engine.get_all_templates()),
            "supported_formats": ["html", "json", "plotly"]
        }
    }

# ==============================
# 启动事件
# ==============================

@app.on_event("startup")
async def startup_event():
    """应用启动事件"""
    print("🚀 万物可视化 v2.0 启动中...")
    print("📋 方案A: 集中式路由架构")
    print("🤖 已加载Agent系统")

    # 加载模板
    try:
        loaded_count = await state.template_engine.load_templates_from_files()
        print(f"📚 已加载 {loaded_count} 个模板")
    except Exception as e:
        print(f"⚠️  模板加载警告: {str(e)}")

    # 将模板引擎注入到路由管理器
    state.router.set_template_engine(state.template_engine)

    # 初始化聊天集成器
    try:
        from api.chat import chat_integration
        chat_integration_instance = ChatIntegration(state.router, state.template_engine)
        import api.chat
        api.chat.chat_integration = chat_integration_instance
        print("💬 聊天集成器已初始化")
    except Exception as e:
        print(f"⚠️  聊天集成器初始化警告: {str(e)}")

    print("🔧 统一模板引擎已就绪")
    print("✅ API网关已启动")
    print("🎯 支持现代聊天界面 (v3)")

    # 确保输出目录存在
    Path("static/visualizations").mkdir(exist_ok=True)
    Path("uploads").mkdir(exist_ok=True)

@app.on_event("shutdown")
async def shutdown_event():
    """应用关闭事件"""
    print("🛑 万物可视化 v2.0 正在关闭...")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=9999,
        reload=True,
        log_level="info"
    )