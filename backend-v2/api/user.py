"""
用户设置管理API
包括用户配置、主题设置、API密钥管理等功能
"""

from fastapi import APIRouter, HTTPException, Depends, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, Field, EmailStr
from typing import Dict, List, Optional, Any, Union
import json
import uuid
import hashlib
import secrets
from datetime import datetime, timedelta
from pathlib import Path
import os

router = APIRouter(prefix="/user", tags=["用户管理"])

# ==============================
# 安全配置
# ==============================

security = HTTPBearer()
SECRET_KEY = os.getenv("SECRET_KEY", secrets.token_urlsafe(32))
ALGORITHM = "HS256"

# ==============================
# 数据模型定义
# ==============================

class UserProfile(BaseModel):
    """用户基本信息"""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    username: str = Field(..., min_length=3, max_length=50)
    email: EmailStr
    display_name: Optional[str] = None
    avatar_url: Optional[str] = None
    bio: Optional[str] = Field(None, max_length=500)
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)

class UserPreferences(BaseModel):
    """用户偏好设置"""
    theme: str = Field(default="auto", description="主题: light, dark, auto")
    language: str = Field(default="zh-CN", description="界面语言")
    timezone: str = Field(default="Asia/Shanghai", description="时区")
    font_size: str = Field(default="medium", description="字体大小: small, medium, large")
    auto_save: bool = Field(default=True, description="自动保存对话")
    show_line_numbers: bool = Field(default=True, description="显示行号")
    enable_animations: bool = Field(default=True, description="启用动画")
    default_visualization_type: str = Field(default="interactive", description="默认可视化类型")

class VisualizationSettings(BaseModel):
    """可视化设置"""
    default_chart_style: str = Field(default="modern", description="默认图表样式")
    color_scheme: str = Field(default="default", description="配色方案")
    animation_speed: str = Field(default="medium", description="动画速度")
    export_format: str = Field(default="html", description="默认导出格式")
    resolution: str = Field(default="high", description="图表分辨率")
    interactive_elements: bool = Field(default=True, description="启用交互元素")

class ModelSettings(BaseModel):
    """模型设置"""
    preferred_model: str = Field(default="universal-v2", description="首选模型")
    temperature: float = Field(default=0.7, ge=0.0, le=2.0, description="创造性参数")
    max_tokens: int = Field(default=2000, ge=100, le=8000, description="最大令牌数")
    response_style: str = Field(default="balanced", description="响应风格: concise, balanced, detailed")
    auto_classify: bool = Field(default=True, description="自动学科分类")

class NotificationSettings(BaseModel):
    """通知设置"""
    email_notifications: bool = Field(default=False, description="邮件通知")
    browser_notifications: bool = Field(default=True, description="浏览器通知")
    completion_alerts: bool = Field(default=True, description="完成提醒")
    error_notifications: bool = Field(default=True, description="错误通知")
    updates_newsletter: bool = Field(default=False, description="更新资讯")

class ApiKey(BaseModel):
    """API密钥模型"""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str = Field(..., description="密钥名称")
    key: str = Field(..., description="密钥值")
    permissions: List[str] = Field(default_factory=list, description="权限列表")
    created_at: datetime = Field(default_factory=datetime.now)
    last_used: Optional[datetime] = None
    expires_at: Optional[datetime] = None
    is_active: bool = Field(default=True)

class UserSettings(BaseModel):
    """完整用户设置"""
    profile: UserProfile
    preferences: UserPreferences = Field(default_factory=UserPreferences)
    visualization: VisualizationSettings = Field(default_factory=VisualizationSettings)
    model: ModelSettings = Field(default_factory=ModelSettings)
    notifications: NotificationSettings = Field(default_factory=NotificationSettings)
    api_keys: List[ApiKey] = Field(default_factory=list)
    usage_stats: Dict[str, Any] = Field(default_factory=dict)

class SessionInfo(BaseModel):
    """会话信息"""
    session_id: str
    user_id: str
    created_at: datetime
    last_accessed: datetime
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    is_active: bool = True

# ==============================
# 用户数据存储
# ==============================

class UserStorage:
    """用户数据存储管理器"""

    def __init__(self):
        self.users: Dict[str, UserSettings] = {}
        self.sessions: Dict[str, SessionInfo] = {}
        self.api_key_map: Dict[str, str] = {}  # api_key -> user_id

    def create_user(self, username: str, email: str) -> UserSettings:
        """创建新用户"""
        profile = UserProfile(username=username, email=email)
        user_settings = UserSettings(profile=profile)
        self.users[profile.id] = user_settings
        return user_settings

    def get_user(self, user_id: str) -> Optional[UserSettings]:
        """获取用户设置"""
        return self.users.get(user_id)

    def get_user_by_email(self, email: str) -> Optional[UserSettings]:
        """通过邮箱获取用户"""
        for user in self.users.values():
            if user.profile.email == email:
                return user
        return None

    def update_user(self, user_id: str, **kwargs) -> bool:
        """更新用户信息"""
        if user_id not in self.users:
            return False

        user = self.users[user_id]
        for key, value in kwargs.items():
            if hasattr(user, key):
                setattr(user, key, value)

        user.profile.updated_at = datetime.now()
        return True

    def create_session(self, user_id: str, ip_address: str = None, user_agent: str = None) -> SessionInfo:
        """创建会话"""
        session_id = secrets.token_urlsafe(32)
        session = SessionInfo(
            session_id=session_id,
            user_id=user_id,
            created_at=datetime.now(),
            last_accessed=datetime.now(),
            ip_address=ip_address,
            user_agent=user_agent
        )
        self.sessions[session_id] = session
        return session

    def get_session(self, session_id: str) -> Optional[SessionInfo]:
        """获取会话"""
        session = self.sessions.get(session_id)
        if session:
            session.last_accessed = datetime.now()
        return session

    def invalidate_session(self, session_id: str) -> bool:
        """使会话失效"""
        if session_id in self.sessions:
            self.sessions[session_id].is_active = False
            return True
        return False

    def create_api_key(self, user_id: str, name: str, permissions: List[str] = None) -> ApiKey:
        """创建API密钥"""
        api_key = f"wk_{secrets.token_urlsafe(32)}"
        key_obj = ApiKey(
            name=name,
            key=api_key,
            permissions=permissions or ["read", "write"]
        )

        if user_id in self.users:
            self.users[user_id].api_keys.append(key_obj)
            self.api_key_map[api_key] = user_id

        return key_obj

    def get_user_by_api_key(self, api_key: str) -> Optional[UserSettings]:
        """通过API密钥获取用户"""
        user_id = self.api_key_map.get(api_key)
        return self.users.get(user_id) if user_id else None

    def update_usage_stats(self, user_id: str, action: str, count: int = 1):
        """更新使用统计"""
        if user_id in self.users:
            stats = self.users[user_id].usage_stats
            today = datetime.now().strftime("%Y-%m-%d")

            if "daily" not in stats:
                stats["daily"] = {}
            if today not in stats["daily"]:
                stats["daily"][today] = {}

            if action not in stats["daily"][today]:
                stats["daily"][today][action] = 0
            stats["daily"][today][action] += count

# 全局用户存储实例
user_storage = UserStorage()

# ==============================
# 认证和权限
# ==============================

def get_current_user(credentials: HTTPAuthorizationCredentials = Security(security)) -> UserSettings:
    """获取当前用户"""
    try:
        token = credentials.credentials
        session = user_storage.get_session(token)

        if not session or not session.is_active:
            raise HTTPException(status_code=401, detail="无效的会话令牌")

        user = user_storage.get_user(session.user_id)
        if not user:
            raise HTTPException(status_code=401, detail="用户不存在")

        return user

    except Exception:
        raise HTTPException(status_code=401, detail="认证失败")

def get_user_by_api_key(api_key: str) -> UserSettings:
    """通过API密钥获取用户"""
    user = user_storage.get_user_by_api_key(api_key)
    if not user:
        raise HTTPException(status_code=401, detail="无效的API密钥")
    return user

# ==============================
# API端点实现
# ==============================

@router.get("/me", response_model=UserSettings)
async def get_current_user_info(current_user: UserSettings = Depends(get_current_user)):
    """获取当前用户信息"""
    return current_user

@router.put("/profile", response_model=UserProfile)
async def update_profile(
    profile_update: UserProfile,
    current_user: UserSettings = Depends(get_current_user)
):
    """更新用户资料"""
    try:
        # 只允许更新特定字段
        update_data = {
            "display_name": profile_update.display_name,
            "avatar_url": profile_update.avatar_url,
            "bio": profile_update.bio
        }

        user_storage.update_user(current_user.profile.id, **update_data)

        # 返回更新后的资料
        updated_user = user_storage.get_user(current_user.profile.id)
        return updated_user.profile

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"更新资料失败: {str(e)}")

@router.put("/preferences", response_model=UserPreferences)
async def update_preferences(
    preferences: UserPreferences,
    current_user: UserSettings = Depends(get_current_user)
):
    """更新用户偏好设置"""
    try:
        current_user.preferences = preferences
        current_user.profile.updated_at = datetime.now()

        user_storage.update_user(current_user.profile.id, preferences=preferences)
        return preferences

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"更新偏好设置失败: {str(e)}")

@router.put("/visualization", response_model=VisualizationSettings)
async def update_visualization_settings(
    settings: VisualizationSettings,
    current_user: UserSettings = Depends(get_current_user)
):
    """更新可视化设置"""
    try:
        current_user.visualization = settings
        user_storage.update_user(current_user.profile.id, visualization=settings)
        return settings

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"更新可视化设置失败: {str(e)}")

@router.put("/model", response_model=ModelSettings)
async def update_model_settings(
    settings: ModelSettings,
    current_user: UserSettings = Depends(get_current_user)
):
    """更新模型设置"""
    try:
        current_user.model = settings
        user_storage.update_user(current_user.profile.id, model=settings)
        return settings

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"更新模型设置失败: {str(e)}")

@router.put("/notifications", response_model=NotificationSettings)
async def update_notification_settings(
    settings: NotificationSettings,
    current_user: UserSettings = Depends(get_current_user)
):
    """更新通知设置"""
    try:
        current_user.notifications = settings
        user_storage.update_user(current_user.profile.id, notifications=settings)
        return settings

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"更新通知设置失败: {str(e)}")

@router.get("/api-keys", response_model=List[ApiKey])
async def get_api_keys(current_user: UserSettings = Depends(get_current_user)):
    """获取API密钥列表"""
    return current_user.api_keys

@router.post("/api-keys", response_model=ApiKey)
async def create_api_key(
    name: str,
    permissions: List[str] = None,
    current_user: UserSettings = Depends(get_current_user)
):
    """创建新的API密钥"""
    try:
        api_key = user_storage.create_api_key(current_user.profile.id, name, permissions)
        return api_key

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"创建API密钥失败: {str(e)}")

@router.delete("/api-keys/{key_id}")
async def delete_api_key(
    key_id: str,
    current_user: UserSettings = Depends(get_current_user)
):
    """删除API密钥"""
    try:
        # 查找并删除密钥
        for i, key in enumerate(current_user.api_keys):
            if key.id == key_id:
                # 从映射中删除
                if key.key in user_storage.api_key_map:
                    del user_storage.api_key_map[key.key]

                # 从用户列表中删除
                current_user.api_keys.pop(i)
                return {"success": True, "message": "API密钥已删除"}

        raise HTTPException(status_code=404, detail="API密钥不存在")

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"删除API密钥失败: {str(e)}")

@router.get("/stats")
async def get_usage_stats(current_user: UserSettings = Depends(get_current_user)):
    """获取使用统计"""
    try:
        stats = current_user.usage_stats

        # 计算总统计
        total_stats = {
            "total_requests": 0,
            "total_visualizations": 0,
            "active_days": len(stats.get("daily", {})),
            "last_activity": None
        }

        # 按日统计汇总
        for daily_data in stats.get("daily", {}).values():
            for action, count in daily_data.items():
                if action in ["requests", "messages"]:
                    total_stats["total_requests"] += count
                elif action in ["visualizations", "charts"]:
                    total_stats["total_visualizations"] += count

        # 最近活动时间
        if stats.get("daily"):
            last_date = max(stats["daily"].keys())
            total_stats["last_activity"] = last_date

        return {
            "summary": total_stats,
            "daily_breakdown": stats.get("daily", {}),
            "most_active_day": max(stats.get("daily", {}).items(), key=lambda x: sum(x[1].values()))[0] if stats.get("daily") else None
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取统计信息失败: {str(e)}")

@router.post("/export")
async def export_user_data(current_user: UserSettings = Depends(get_current_user)):
    """导出用户数据"""
    try:
        export_data = {
            "user_id": current_user.profile.id,
            "exported_at": datetime.now().isoformat(),
            "profile": current_user.profile.dict(),
            "preferences": current_user.preferences.dict(),
            "visualization_settings": current_user.visualization.dict(),
            "model_settings": current_user.model.dict(),
            "notification_settings": current_user.notifications.dict(),
            "usage_stats": current_user.usage_stats,
            "api_keys_count": len(current_user.api_keys)
            # 不导出实际的API密钥值
        }

        return {
            "success": True,
            "data": export_data,
            "filename": f"user_data_{current_user.profile.id}_{datetime.now().strftime('%Y%m%d')}.json"
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"导出数据失败: {str(e)}")

@router.post("/reset")
async def reset_user_settings(
    confirm: bool = False,
    current_user: UserSettings = Depends(get_current_user)
):
    """重置用户设置"""
    if not confirm:
        raise HTTPException(status_code=400, detail="需要确认重置操作")

    try:
        # 重置为默认设置
        current_user.preferences = UserPreferences()
        current_user.visualization = VisualizationSettings()
        current_user.model = ModelSettings()
        current_user.notifications = NotificationSettings()

        # 保留资料和使用统计，只重置设置
        user_storage.update_user(
            current_user.profile.id,
            preferences=current_user.preferences,
            visualization=current_user.visualization,
            model=current_user.model,
            notifications=current_user.notifications
        )

        return {"success": True, "message": "用户设置已重置为默认值"}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"重置设置失败: {str(e)}")

# ==============================
# 公开API端点（无需认证）
# ==============================

@router.post("/register", response_model=UserSettings)
async def register_user(username: str, email: str, password: str):
    """用户注册"""
    try:
        # 检查邮箱是否已存在
        if user_storage.get_user_by_email(email):
            raise HTTPException(status_code=400, detail="邮箱已被注册")

        # 创建新用户
        user = user_storage.create_user(username, email)

        # 创建初始会话
        session = user_storage.create_session(user.profile.id)

        return {
            **user.dict(),
            "session_id": session.session_id
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"注册失败: {str(e)}")

@router.post("/login")
async def login_user(email: str, password: str):
    """用户登录（简化版本，实际应该验证密码）"""
    try:
        user = user_storage.get_user_by_email(email)
        if not user:
            raise HTTPException(status_code=401, detail="邮箱或密码错误")

        # 创建新会话
        session = user_storage.create_session(user.profile.id)

        return {
            "success": True,
            "message": "登录成功",
            "session_id": session.session_id,
            "user_id": user.profile.id,
            "username": user.profile.username
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"登录失败: {str(e)}")

@router.post("/logout")
async def logout_user(session_id: str):
    """用户登出"""
    try:
        success = user_storage.invalidate_session(session_id)
        if not success:
            raise HTTPException(status_code=404, detail="会话不存在")

        return {"success": True, "message": "已安全登出"}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"登出失败: {str(e)}")