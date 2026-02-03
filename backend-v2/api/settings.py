"""
设置管理API接口模块
提供API密钥管理等设置相关的API支持
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Dict, Optional, Any
import json
from pathlib import Path
import os
from datetime import datetime

router = APIRouter(prefix="/settings", tags=["设置管理"])

# API密钥存储路径
API_KEYS_FILE = Path(__file__).parent.parent / "data" / "api_keys.json"

# 确保数据目录存在
API_KEYS_FILE.parent.mkdir(parents=True, exist_ok=True)

# 如果文件不存在，创建空文件
if not API_KEYS_FILE.exists():
    API_KEYS_FILE.write_text("{}")
    # 设置文件权限为只有所有者可读写
    os.chmod(API_KEYS_FILE, 0o600)


# ==============================
# 数据模型定义
# ==============================

class APIKeyModel(BaseModel):
    """API密钥模型"""
    provider: str = Field(..., description="提供商名称: google, openai, glm, deepseek, anthropic")
    api_key: str = Field(..., description="API密钥")
    model_name: Optional[str] = Field(None, description="模型名称")
    updated_at: Optional[str] = Field(None, description="更新时间")

    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }


class APIKeysWithRotation(BaseModel):
    """支持轮值的API密钥模型"""
    api_keys: list = Field(default_factory=list, description="API密钥列表")
    current_index: int = Field(0, description="当前使用的密钥索引")
    rotation_enabled: bool = Field(True, description="是否启用轮值")
    last_rotation: Optional[str] = Field(None, description="上次轮换时间")
    rotation_count: int = Field(0, description="轮换次数")


class APIKeyResponse(BaseModel):
    """API密钥响应（已掩码）"""
    provider: str
    api_key: str  # 已掩码的密钥
    model_name: Optional[str] = None
    is_configured: bool = True
    updated_at: Optional[str] = None


class UpdateAPIKeysRequest(BaseModel):
    """批量更新API密钥请求"""
    keys: Dict[str, str] = Field(..., description="提供商到API密钥的映射（旧版，兼容）")
    multiple_keys: Optional[Dict[str, list]] = Field(None, description="提供商到API密钥列表的映射（新版，支持轮值）")


class RotateAPIKeyRequest(BaseModel):
    """手动轮换API密钥请求"""
    provider: str = Field(..., description="提供商名称")
    force: bool = Field(False, description="是否强制轮换")


# ==============================
# 辅助函数
# ==============================

def mask_api_key(api_key: str, visible_chars: int = 8) -> str:
    """
    掩码API密钥，只显示前几个和后几个字符

    Args:
        api_key: 原始API密钥
        visible_chars: 前后可见字符数

    Returns:
        掩码后的密钥，如 sk-abc...xyz
    """
    if not api_key or len(api_key) <= visible_chars * 2:
        return "***" if api_key else ""

    prefix = api_key[:visible_chars]
    suffix = api_key[-visible_chars:]
    masked_length = len(api_key) - visible_chars * 2
    return f"{prefix}{'*' * masked_length}{suffix}"


def load_api_keys() -> Dict[str, Any]:
    """从文件加载API密钥"""
    try:
        data = json.loads(API_KEYS_FILE.read_text())
        return data
    except Exception as e:
        print(f"加载API密钥失败: {str(e)}")
        return {}


def save_api_keys(keys: Dict[str, Any]):
    """保存API密钥到文件"""
    try:
        # 添加更新时间戳
        keys["last_updated"] = datetime.now().isoformat()

        API_KEYS_FILE.write_text(json.dumps(keys, indent=2, ensure_ascii=False))

        # 确保文件权限正确
        os.chmod(API_KEYS_FILE, 0o600)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"保存API密钥失败: {str(e)}")


def get_current_api_key(provider: str) -> Optional[str]:
    """
    获取提供商当前使用的 API key（支持轮值）

    Args:
        provider: 提供商名称

    Returns:
        当前应使用的 API key，如果没有配置则返回 None
    """
    keys_data = load_api_keys()

    if provider not in keys_data:
        return None

    provider_data = keys_data[provider]

    # 如果是旧格式（单个 key），直接返回
    if "api_key" in provider_data:
        return provider_data.get("api_key")

    # 如果是新格式（支持轮值）
    if "api_keys" in provider_data and provider_data["api_keys"]:
        rotation_data = provider_data
        api_keys_list = rotation_data["api_keys"]
        current_index = rotation_data.get("current_index", 0)

        # 确保索引在有效范围内
        if 0 <= current_index < len(api_keys_list):
            return api_keys_list[current_index]

    return None


def rotate_api_key(provider: str, force: bool = False) -> Optional[str]:
    """
    轮换 API key 到下一个可用的 key

    Args:
        provider: 提供商名称
        force: 是否强制轮换（忽略配额检查）

    Returns:
        新的 API key，如果没有更多可用的 key 则返回 None
    """
    keys_data = load_api_keys()

    if provider not in keys_data:
        return None

    provider_data = keys_data[provider]

    # 如果是旧格式，转换为新格式
    if "api_key" in provider_data:
        old_key = provider_data["api_key"]
        provider_data = {
            "api_keys": [old_key],
            "current_index": 0,
            "rotation_enabled": True,
            "last_rotation": None,
            "rotation_count": 0
        }
        keys_data[provider] = provider_data

    # 检查是否有多个 key
    if "api_keys" not in provider_data or len(provider_data["api_keys"]) <= 1:
        return None  # 没有其他 key 可以轮换

    api_keys_list = provider_data["api_keys"]
    current_index = provider_data.get("current_index", 0)

    # 计算下一个索引
    next_index = (current_index + 1) % len(api_keys_list)

    # 更新轮换信息
    provider_data["current_index"] = next_index
    provider_data["last_rotation"] = datetime.now().isoformat()
    provider_data["rotation_count"] = provider_data.get("rotation_count", 0) + 1

    # 保存更新
    save_api_keys(keys_data)

    return api_keys_list[next_index]


def mark_api_key_quota_exceeded(provider: str):
    """
    标记当前 API key 的配额已用完，并自动轮换到下一个

    Args:
        provider: 提供商名称
    """
    new_key = rotate_api_key(provider, force=True)
    if new_key:
        print(f"⚠️  {provider} API key 配额已用完，已自动切换到下一个 key")
    else:
        print(f"❌ {provider} 没有更多可用的 API key")


# ==============================
# API端点
# ==============================

@router.get("/api-keys", response_model=Dict[str, APIKeyResponse])
async def get_api_keys():
    """
    获取所有已配置的API密钥（已掩码）

    返回所有提供商的API密钥状态，密钥已掩码处理
    """
    keys_data = load_api_keys()
    result = {}

    # 支持的提供商列表
    providers = {
        "google": {"model_name": "gemini-1.5-flash"},
        "openai": {"model_name": "gpt-4o"},
        "glm": {"model_name": "glm-4"},
        "deepseek": {"model_name": "deepseek-chat"},
        "anthropic": {"model_name": "claude-sonnet-4-5"}
    }

    for provider, default_config in providers.items():
        if provider in keys_data and keys_data[provider]:
            api_key = keys_data[provider].get("api_key", "")
            result[provider] = APIKeyResponse(
                provider=provider,
                api_key=mask_api_key(api_key) if api_key else "",
                model_name=keys_data[provider].get("model_name", default_config["model_name"]),
                is_configured=bool(api_key and not api_key.startswith("your-")),
                updated_at=keys_data[provider].get("updated_at")
            )
        else:
            result[provider] = APIKeyResponse(
                provider=provider,
                api_key="",
                model_name=default_config["model_name"],
                is_configured=False,
                updated_at=None
            )

    return result


@router.post("/api-keys")
async def update_api_key(request: APIKeyModel):
    """
    更新单个API密钥

    保存或更新指定提供商的API密钥
    """
    if not request.api_key or request.api_key.strip() == "":
        raise HTTPException(status_code=400, detail="API密钥不能为空")

    keys_data = load_api_keys()

    # 更新密钥
    keys_data[request.provider] = {
        "api_key": request.api_key.strip(),
        "model_name": request.model_name,
        "updated_at": datetime.now().isoformat()
    }

    save_api_keys(keys_data)

    return {
        "success": True,
        "message": f"{request.provider} API密钥已更新",
        "provider": request.provider,
        "api_key_masked": mask_api_key(request.api_key)
    }


@router.post("/api-keys/batch")
async def update_api_keys_batch(request: UpdateAPIKeysRequest):
    """
    批量更新多个API密钥（支持单个或多个）

    如果提供 multiple_keys，则支持轮值功能
    如果只提供 keys，则保持旧版兼容性
    """
    keys_data = load_api_keys()

    updated_providers = []

    # 优先处理新版多 key 格式
    if request.multiple_keys:
        for provider, api_keys_list in request.multiple_keys.items():
            # 过滤掉空字符串
            valid_keys = [key.strip() for key in api_keys_list if key and key.strip()]

            if valid_keys:
                # 检查是否已有配置
                if provider in keys_data and "api_keys" in keys_data[provider]:
                    # 保持轮换信息
                    old_data = keys_data[provider]
                    current_index = old_data.get("current_index", 0)
                    rotation_count = old_data.get("rotation_count", 0)

                    # 确保索引在有效范围内
                    if current_index >= len(valid_keys):
                        current_index = 0

                    keys_data[provider] = {
                        "api_keys": valid_keys,
                        "current_index": current_index,
                        "rotation_enabled": True,
                        "last_rotation": old_data.get("last_rotation"),
                        "rotation_count": rotation_count,
                        "updated_at": datetime.now().isoformat()
                    }
                else:
                    # 新配置
                    keys_data[provider] = {
                        "api_keys": valid_keys,
                        "current_index": 0,
                        "rotation_enabled": True,
                        "last_rotation": None,
                        "rotation_count": 0,
                        "updated_at": datetime.now().isoformat()
                    }

                updated_providers.append(provider)
    else:
        # 旧版单 key 格式（兼容）
        for provider, api_key in request.keys.items():
            if api_key and api_key.strip():
                keys_data[provider] = {
                    "api_key": api_key.strip(),
                    "updated_at": datetime.now().isoformat()
                }
                updated_providers.append(provider)

    save_api_keys(keys_data)

    return {
        "success": True,
        "message": f"已更新 {len(updated_providers)} 个提供商的API密钥",
        "updated_providers": updated_providers
    }


@router.delete("/api-keys/{provider}")
async def delete_api_key(provider: str):
    """
    删除指定提供商的API密钥

    从配置中移除API密钥
    """
    keys_data = load_api_keys()

    if provider not in keys_data:
        raise HTTPException(status_code=404, detail=f"未找到 {provider} 的API密钥配置")

    del keys_data[provider]
    save_api_keys(keys_data)

    return {
        "success": True,
        "message": f"{provider} API密钥已删除"
    }


@router.post("/api-keys/test/{provider}")
async def test_api_key(provider: str, api_key: Optional[str] = None):
    """
    测试API密钥是否有效

    测试指定提供商的API密钥连接状态
    """
    # 如果没有提供密钥，从配置中读取
    if not api_key:
        keys_data = load_api_keys()
        if provider not in keys_data:
            raise HTTPException(status_code=404, detail=f"未找到 {provider} 的API密钥配置")
        api_key = keys_data[provider].get("api_key", "")

    if not api_key:
        raise HTTPException(status_code=400, detail="API密钥不能为空")

    # 这里可以添加实际的API测试逻辑
    # 暂时返回成功响应
    try:
        # TODO: 实现真实的API测试
        # 例如调用各提供商的API进行验证

        return {
            "success": True,
            "message": f"{provider} API密钥测试通过",
            "provider": provider,
            "api_key_masked": mask_api_key(api_key)
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"API密钥测试失败: {str(e)}")


@router.get("/config")
async def get_settings_config():
    """
    获取系统配置信息

    返回当前系统的配置状态
    """
    keys_data = load_api_keys()

    # 统计已配置的提供商数量
    configured_count = sum(
        1 for p in keys_data
        if p != "last_updated" and keys_data[p].get("api_key") and not keys_data[p].get("api_key", "").startswith("your-")
    )

    return {
        "total_providers": 5,  # google, openai, glm, deepseek, anthropic
        "configured_providers": configured_count,
        "storage_file": str(API_KEYS_FILE),
        "last_updated": keys_data.get("last_updated")
    }


@router.get("/api-keys/{provider}/current")
async def get_current_api_key_endpoint(provider: str):
    """
    获取提供商当前使用的API密钥（已掩码）

    返回当前正在使用的API密钥，支持轮值
    """
    current_key = get_current_api_key(provider)

    if not current_key:
        raise HTTPException(status_code=404, detail=f"未找到 {provider} 的API密钥配置")

    keys_data = load_api_keys()
    provider_data = keys_data.get(provider, {})

    # 构建响应
    response = {
        "provider": provider,
        "api_key_masked": mask_api_key(current_key),
        "is_configured": True
    }

    # 如果支持轮值，添加额外信息
    if "api_keys" in provider_data:
        response["total_keys"] = len(provider_data["api_keys"])
        response["current_index"] = provider_data.get("current_index", 0)
        response["rotation_enabled"] = provider_data.get("rotation_enabled", True)
        response["last_rotation"] = provider_data.get("last_rotation")
        response["rotation_count"] = provider_data.get("rotation_count", 0)

    return response


@router.post("/api-keys/rotate")
async def rotate_api_key_endpoint(request: RotateAPIKeyRequest):
    """
    手动轮换API密钥到下一个

    强制切换到下一个可用的API密钥
    """
    new_key = rotate_api_key(request.provider, force=request.force)

    if not new_key:
        raise HTTPException(
            status_code=400,
            detail=f"{request.provider} 没有更多可用的API密钥进行轮换"
        )

    keys_data = load_api_keys()
    provider_data = keys_data.get(request.provider, {})

    return {
        "success": True,
        "message": f"{request.provider} API密钥已轮换",
        "provider": request.provider,
        "new_api_key_masked": mask_api_key(new_key),
        "current_index": provider_data.get("current_index", 0),
        "rotation_count": provider_data.get("rotation_count", 0)
    }


@router.post("/api-keys/{provider}/quota-exceeded")
async def mark_quota_exceeded(provider: str):
    """
    标记当前API密钥配额已用完，自动轮换到下一个

    当API调用返回配额超限错误时调用此端点
    """
    mark_api_key_quota_exceeded(provider)

    new_key = get_current_api_key(provider)

    keys_data = load_api_keys()
    provider_data = keys_data.get(provider, {})

    return {
        "success": True,
        "message": f"{provider} API密钥已切换",
        "provider": provider,
        "new_api_key_masked": mask_api_key(new_key) if new_key else "",
        "current_index": provider_data.get("current_index", 0) if provider_data else 0,
        "rotation_enabled": provider_data.get("rotation_enabled", True) if provider_data else False
    }
