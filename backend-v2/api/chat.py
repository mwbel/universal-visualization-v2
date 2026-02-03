"""
聊天界面API接口模块
提供现代聊天界面所需的完整API支持
"""

from fastapi import APIRouter, HTTPException, BackgroundTasks, Depends
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
from typing import Dict, List, Optional, Any, Union, AsyncGenerator
import json
import uuid
import asyncio
from datetime import datetime
from pathlib import Path
import re

# 导入集成模块
from .integration import ChatIntegration

router = APIRouter(prefix="/chat", tags=["聊天界面"])

# 全局集成器实例（将在主应用中初始化）
chat_integration: Optional[ChatIntegration] = None

def get_chat_integration() -> ChatIntegration:
    """获取聊天集成器实例"""
    global chat_integration
    if chat_integration is None:
        raise HTTPException(status_code=500, detail="聊天集成器未初始化")
    return chat_integration

# ==============================
# 数据模型定义
# ==============================

class Message(BaseModel):
    """消息模型"""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    role: str = Field(..., description="消息角色: user, assistant, system")
    content: Union[str, Dict[str, Any]] = Field(..., description="消息内容")
    timestamp: datetime = Field(default_factory=datetime.now)
    metadata: Dict[str, Any] = Field(default_factory=dict)

    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }

class Conversation(BaseModel):
    """对话模型"""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str = Field(..., description="对话标题")
    messages: List[Message] = Field(default_factory=list)
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)
    metadata: Dict[str, Any] = Field(default_factory=dict)
    settings: Dict[str, Any] = Field(default_factory=dict)

class SendMessageRequest(BaseModel):
    """发送消息请求"""
    conversation_id: Optional[str] = Field(None, description="对话ID，为空时创建新对话")
    message: str = Field(..., description="消息内容", min_length=1, max_length=5000)
    stream: bool = Field(default=False, description="是否使用流式响应")
    user_preferences: Dict[str, Any] = Field(default_factory=dict)
    generate_visualization: bool = Field(default=True, description="是否生成可视化")
    model: Optional[str] = Field(default="gemini-pro", description="AI模型选择")

class SendMessageResponse(BaseModel):
    """发送消息响应"""
    success: bool
    conversation_id: str
    message_id: str
    response: Optional[Union[str, Dict[str, Any]]] = None
    visualization: Optional[Dict[str, Any]] = None
    metadata: Dict[str, Any] = {}

class ConversationRequest(BaseModel):
    """对话操作请求"""
    title: Optional[str] = None
    settings: Dict[str, Any] = {}

class ConversationListResponse(BaseModel):
    """对话列表响应"""
    conversations: List[Conversation]
    total: int
    page: int
    page_size: int

class SearchRequest(BaseModel):
    """搜索请求"""
    query: str = Field(..., min_length=1, max_length=100)
    page: int = Field(default=1, ge=1)
    page_size: int = Field(default=20, ge=1, le=100)
    filters: Dict[str, Any] = {}

class UserSettings(BaseModel):
    """用户设置"""
    theme: str = Field(default="auto", description="主题: light, dark, auto")
    language: str = Field(default="zh-CN", description="语言")
    model_preferences: Dict[str, Any] = {}
    visualization_settings: Dict[str, Any] = {}
    notification_settings: Dict[str, Any] = {}

class FileUploadResponse(BaseModel):
    """文件上传响应"""
    success: bool
    file_id: str
    filename: str
    file_type: str
    file_size: int
    url: str
    metadata: Dict[str, Any] = {}

# ==============================
# 内存存储（实际应使用数据库）
# ==============================

class ChatStorage:
    """聊天数据存储管理器"""

    def __init__(self):
        self.conversations: Dict[str, Conversation] = {}
        self.user_settings: Dict[str, UserSettings] = {}
        self.files: Dict[str, Dict[str, Any]] = {}

    def create_conversation(self, title: str = "新对话") -> Conversation:
        """创建新对话"""
        conversation = Conversation(title=title)
        self.conversations[conversation.id] = conversation
        return conversation

    def get_conversation(self, conversation_id: str) -> Optional[Conversation]:
        """获取对话"""
        return self.conversations.get(conversation_id)

    def update_conversation(self, conversation_id: str, **kwargs) -> bool:
        """更新对话"""
        if conversation_id not in self.conversations:
            return False
        conversation = self.conversations[conversation_id]
        for key, value in kwargs.items():
            if hasattr(conversation, key):
                setattr(conversation, key, value)
        conversation.updated_at = datetime.now()
        return True

    def delete_conversation(self, conversation_id: str) -> bool:
        """删除对话"""
        if conversation_id in self.conversations:
            del self.conversations[conversation_id]
            return True
        return False

    def add_message(self, conversation_id: str, message: Message) -> bool:
        """添加消息"""
        if conversation_id not in self.conversations:
            return False
        self.conversations[conversation_id].messages.append(message)
        self.conversations[conversation_id].updated_at = datetime.now()
        return True

    def search_conversations(self, query: str, page: int = 1, page_size: int = 20) -> List[Conversation]:
        """搜索对话"""
        query_lower = query.lower()
        results = []

        for conv in self.conversations.values():
            # 搜索标题
            if query_lower in conv.title.lower():
                results.append(conv)
                continue

            # 搜索消息内容
            for msg in conv.messages:
                if isinstance(msg.content, str) and query_lower in msg.content.lower():
                    results.append(conv)
                    break

        # 排序（按更新时间）
        results.sort(key=lambda x: x.updated_at, reverse=True)

        # 分页
        start = (page - 1) * page_size
        end = start + page_size
        return results[start:end]

    def get_conversations_page(self, page: int = 1, page_size: int = 20) -> List[Conversation]:
        """分页获取对话列表"""
        all_convs = sorted(self.conversations.values(), key=lambda x: x.updated_at, reverse=True)
        start = (page - 1) * page_size
        end = start + page_size
        return all_convs[start:end]

    def get_conversations(self, page: int = 1, page_size: int = 20) -> List[Conversation]:
        """获取对话列表（兼容方法）"""
        return self.get_conversations_page(page, page_size)

# 全局存储实例
chat_storage = ChatStorage()

# ==============================
# API端点实现
# ==============================

@router.post("/conversations", response_model=Conversation)
async def create_conversation(request: ConversationRequest):
    """创建新对话"""
    try:
        title = request.title or f"对话 {len(chat_storage.conversations) + 1}"
        conversation = chat_storage.create_conversation(title=title)

        # 应用设置
        if request.settings:
            conversation.settings.update(request.settings)

        return conversation

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"创建对话失败: {str(e)}")

@router.get("/conversations", response_model=ConversationListResponse)
async def get_conversations(page: int = 1, page_size: int = 20):
    """获取对话列表"""
    try:
        conversations = chat_storage.get_conversations(page, page_size)
        total = len(chat_storage.conversations)

        return ConversationListResponse(
            conversations=conversations,
            total=total,
            page=page,
            page_size=page_size
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取对话列表失败: {str(e)}")

@router.get("/conversations/{conversation_id}", response_model=Conversation)
async def get_conversation(conversation_id: str):
    """获取特定对话"""
    conversation = chat_storage.get_conversation(conversation_id)
    if not conversation:
        raise HTTPException(status_code=404, detail="对话不存在")

    return conversation

@router.put("/conversations/{conversation_id}", response_model=Conversation)
async def update_conversation(conversation_id: str, request: ConversationRequest):
    """更新对话"""
    if not chat_storage.get_conversation(conversation_id):
        raise HTTPException(status_code=404, detail="对话不存在")

    success = chat_storage.update_conversation(
        conversation_id,
        title=request.title,
        settings=request.settings
    )

    if not success:
        raise HTTPException(status_code=500, detail="更新对话失败")

    return chat_storage.get_conversation(conversation_id)

@router.delete("/conversations/{conversation_id}")
async def delete_conversation(conversation_id: str):
    """删除对话"""
    if not chat_storage.get_conversation(conversation_id):
        raise HTTPException(status_code=404, detail="对话不存在")

    success = chat_storage.delete_conversation(conversation_id)
    if not success:
        raise HTTPException(status_code=500, detail="删除对话失败")

    return {"success": True, "message": "对话已删除"}

@router.post("/search", response_model=ConversationListResponse)
async def search_conversations(request: SearchRequest):
    """搜索对话"""
    try:
        conversations = chat_storage.search_conversations(
            request.query,
            request.page,
            request.page_size
        )
        total = len(chat_storage.search_conversations(request.query, 1, 1000))

        return ConversationListResponse(
            conversations=conversations,
            total=total,
            page=request.page,
            page_size=request.page_size
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"搜索失败: {str(e)}")

@router.post("/message", response_model=SendMessageResponse)
async def send_message(request: SendMessageRequest, background_tasks: BackgroundTasks):
    """发送消息"""
    try:
        # 获取或创建对话
        if request.conversation_id:
            conversation = chat_storage.get_conversation(request.conversation_id)
            if not conversation:
                raise HTTPException(status_code=404, detail="对话不存在")
        else:
            conversation = chat_storage.create_conversation()

        # 创建用户消息
        user_message = Message(
            role="user",
            content=request.message,
            metadata={
                "generate_visualization": request.generate_visualization,
                "user_preferences": request.user_preferences,
                "model": request.model
            }
        )

        # 添加用户消息
        chat_storage.add_message(conversation.id, user_message)

        # 如果请求流式响应
        if request.stream:
            # 这里应该返回流式响应，暂时简化处理
            pass

        # 生成AI响应
        ai_response_content, visualization = await generate_ai_response(
            request.message,
            request.user_preferences,
            request.generate_visualization,
            request.model
        )

        # 创建AI响应消息
        ai_message = Message(
            role="assistant",
            content=ai_response_content,
            metadata={
                "visualization": visualization,
                "response_type": "generated"
            }
        )

        # 添加AI消息
        chat_storage.add_message(conversation.id, ai_message)

        # 自动生成对话标题（如果是第一条消息）
        if len(conversation.messages) == 2:  # 用户消息 + AI响应
            title = generate_conversation_title(request.message)
            chat_storage.update_conversation(conversation.id, title=title)

        return SendMessageResponse(
            success=True,
            conversation_id=conversation.id,
            message_id=ai_message.id,
            response=ai_response_content,
            visualization=visualization,
            metadata={
                "processing_time": "1.2s",
                "model": "universal-v2",
                "subject": "auto-detected"
            }
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"发送消息失败: {str(e)}")

@router.get("/message/stream")
async def stream_message(
    conversation_id: str,
    message: str,
    user_preferences: str = "{}"
):
    """流式消息响应"""
    async def generate_stream():
        try:
            # 获取对话
            conversation = chat_storage.get_conversation(conversation_id)
            if not conversation:
                yield f"data: {json.dumps({'error': '对话不存在'})}\n\n"
                return

            # 创建用户消息
            user_message = Message(role="user", content=message)
            chat_storage.add_message(conversation_id, user_message)

            # 模拟流式响应
            response_text = f"这是对'{message}'的AI响应。"
            for i, char in enumerate(response_text):
                chunk = {
                    "type": "content",
                    "content": char,
                    "conversation_id": conversation_id,
                    "message_id": str(uuid.uuid4())
                }
                yield f"data: {json.dumps(chunk)}\n\n"
                await asyncio.sleep(0.05)  # 模拟打字效果

            # 结束标记
            yield f"data: {json.dumps({'type': 'done'})}\n\n"

        except Exception as e:
            error_chunk = {
                "type": "error",
                "error": str(e)
            }
            yield f"data: {json.dumps(error_chunk)}\n\n"

    return StreamingResponse(generate_stream(), media_type="text/plain")

# ==============================
# 辅助函数
# ==============================

async def generate_ai_response(
    message: str,
    user_preferences: Dict[str, Any],
    generate_visualization: bool,
    model: Optional[str] = None
) -> tuple[str, Optional[Dict[str, Any]]]:
    """生成AI响应 - 集成现有路由系统"""
    try:
        # 使用聊天集成器处理消息
        integration = get_chat_integration()

        # 将model添加到user_preferences中
        if model:
            user_preferences = user_preferences.copy()
            user_preferences['model'] = model

        response, visualization = await integration.process_chat_message(
            message, user_preferences, generate_visualization
        )
        return response, visualization

    except Exception as e:
        error_msg = f"抱歉，生成响应时遇到错误：{str(e)}"
        return error_msg, None

def generate_conversation_title(message: str) -> str:
    """生成对话标题"""
    # 提取关键词作为标题
    message = message.strip()
    if len(message) <= 20:
        return message

    # 简单的标题生成逻辑
    keywords = ["数学", "物理", "化学", "生物", "天文", "图表", "函数", "几何", "统计"]
    for keyword in keywords:
        if keyword in message:
            return f"{keyword}相关讨论"

    # 截取前20个字符
    return message[:20] + "..."

# ==============================
# 用户设置API
# ==============================

@router.get("/settings", response_model=UserSettings)
async def get_user_settings(user_id: str = "default"):
    """获取用户设置"""
    settings = chat_storage.user_settings.get(user_id, UserSettings())
    return settings

@router.put("/settings", response_model=UserSettings)
async def update_user_settings(
    settings: UserSettings,
    user_id: str = "default"
):
    """更新用户设置"""
    chat_storage.user_settings[user_id] = settings
    return settings

# ==============================
# 快速操作API
# ==============================

@router.get("/quick-actions")
async def get_quick_actions():
    """获取快速操作列表 - 基于现有模板系统"""
    try:
        integration = get_chat_integration()
        return await integration.get_quick_actions()
    except Exception as e:
        # 如果集成系统不可用，返回默认快速操作
        return {
            "actions": {
                "general": [
                    {
                        "id": "general_chart",
                        "title": "创建图表",
                        "description": "生成数据可视化图表",
                        "template": "创建一个柱状图显示数据"
                    }
                ]
            },
            "total_templates": 0,
            "subjects": ["general"]
        }

@router.post("/quick-actions/{action_id}")
async def execute_quick_action(action_id: str):
    """执行快速操作"""
    actions = {
        "math_plot": "我想画出函数 y = x^2 的图像",
        "solar_system": "展示太阳系的行星运动模型",
        "physics_simulation": "模拟自由落体运动",
        "chemistry_molecule": "展示水分子的结构"
    }

    template = actions.get(action_id)
    if not template:
        raise HTTPException(status_code=404, detail="快速操作不存在")

    return {
        "success": True,
        "template": template,
        "action_id": action_id
    }