"""
API模块初始化
包含所有新的聊天界面API
"""

from fastapi import APIRouter
from .chat import router as chat_router
from .files import router as files_router
from .user import router as user_router
from .settings import router as settings_router
from .integration import ChatIntegration

# 创建主API路由器
api_router = APIRouter(prefix="/api/v3", tags=["新版API"])

# 注册所有子路由器
api_router.include_router(chat_router)
api_router.include_router(files_router)
api_router.include_router(user_router)
api_router.include_router(settings_router)

# 导出主要组件
__all__ = [
    "api_router",
    "ChatIntegration",
    "chat_router",
    "files_router",
    "user_router",
    "settings_router"
]