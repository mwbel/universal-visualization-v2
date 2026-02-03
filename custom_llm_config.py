"""
自定义大模型配置 - 支持灵活替换不同LLM提供商
"""

from typing import Dict, Any, Optional, List
from enum import Enum
import aiohttp
import json
import asyncio
from datetime import datetime


class LLMProvider(str, Enum):
    """大模型提供商枚举"""

    OPENAI = "openai"
    ANTHROPIC = "anthropic"
    AZURE = "azure"
    LOCAL = "local"
    HUGGINGFACE = "huggingface"
    OLLAMA = "ollama"
    QWEN = "qwen"
    GLM = "glm"
    DOUBAO = "doubao"
    KIMI = "kimi"
    DEEPSEEK = "deepseek"
    GOOGLE = "google"
    CUSTOM = "custom"


class LLMConfig:
    """大模型配置类"""

    def __init__(
        self,
        provider: LLMProvider,
        model_name: str,
        api_key: Optional[str] = None,
        base_url: Optional[str] = None,
        max_tokens: int = 4000,
        temperature: float = 0.7,
        timeout: int = 60,
        custom_headers: Optional[Dict[str, str]] = None,
    ):
        self.provider = provider
        self.model_name = model_name
        self.api_key = api_key
        self.base_url = base_url
        self.max_tokens = max_tokens
        self.temperature = temperature
        self.timeout = timeout
        self.custom_headers = custom_headers or {}


class CustomLLMClient:
    """自定义大模型客户端基类"""

    def __init__(self, config: LLMConfig):
        self.config = config
        self.provider = config.provider

    async def generate_response(self, prompt: str, **kwargs) -> str:
        """生成响应的抽象方法"""
        raise NotImplementedError("子类必须实现此方法")

    async def validate_connection(self) -> bool:
        """验证连接是否可用"""
        raise NotImplementedError("子类必须实现此方法")


class OpenAIClient(CustomLLMClient):
    """OpenAI客户端实现"""

    async def generate_response(self, prompt: str, **kwargs) -> str:
        headers = {
            "Authorization": f"Bearer {self.config.api_key}",
            "Content-Type": "application/json",
        }

        payload = {
            "model": self.config.model_name,
            "messages": [{"role": "user", "content": prompt}],
            "max_tokens": self.config.max_tokens,
            "temperature": self.config.temperature,
        }

        try:
            async with aiohttp.ClientSession(headers=headers) as session:
                async with session.post(
                    f"{self.config.base_url}/chat/completions",
                    json=payload,
                    timeout=self.config.timeout,
                ) as response:
                    if response.status == 200:
                        result = await response.json()
                        return result["choices"][0]["message"]["content"]
                    else:
                        error_text = await response.text()
                        raise Exception(
                            f"OpenAI API错误 {response.status}: {error_text}"
                        )
        except Exception as e:
            raise Exception(f"OpenAI API调用失败: {str(e)}")


class GoogleGenAIClient(CustomLLMClient):
    """Google Gemini客户端实现（支持API key轮值）"""

    def __init__(self, config: LLMConfig):
        super().__init__(config)
        self.provider_name = "google"
        self.base_url = "http://localhost:9999"  # 后端API地址

    async def notify_quota_exceeded(self):
        """通知后端当前key配额已用完，触发轮换"""
        try:
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    f"{self.base_url}/api/v3/settings/api-keys/{self.provider_name}/quota-exceeded",
                    timeout=10,
                ) as response:
                    if response.status == 200:
                        result = await response.json()
                        print(f"✅ {self.provider_name} API key已自动切换")

                        # 从文件重新加载API keys
                        api_keys = load_api_keys_from_settings()
                        if self.provider_name in api_keys:
                            self.config.api_key = api_keys[self.provider_name]
                            print(f"🔑 新API key已加载")
                    else:
                        print(f"⚠️  API key轮换失败")
        except Exception as e:
            print(f"❌ 通知配额超限失败: {str(e)}")

    async def generate_response(self, prompt: str, **kwargs) -> str:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{self.config.model_name}:generateContent?key={self.config.api_key}"

        headers = {"Content-Type": "application/json"}

        # Gemini API format
        payload = {
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {
                "temperature": self.config.temperature,
                "maxOutputTokens": self.config.max_tokens,
            },
        }

        async with aiohttp.ClientSession(headers=headers) as session:
            async with session.post(
                url, json=payload, timeout=self.config.timeout
            ) as response:
                if response.status == 200:
                    result = await response.json()
                    try:
                        return result["candidates"][0]["content"]["parts"][0]["text"]
                    except (KeyError, IndexError):
                        raise Exception(f"Gemini API响应解析失败: {result}")
                elif response.status == 429:
                    # 配额超限，尝试轮换并重试
                    error_text = await response.text()
                    print(f"⚠️  {self.provider_name} API配额超限: {error_text}")

                    # 通知后端轮换
                    await self.notify_quota_exceeded()

                    # 重试一次（使用新的key）
                    print(f"🔄 使用新API key重试...")
                    return await self.generate_response(prompt, **kwargs)
                else:
                    error_text = await response.text()
                    raise Exception(f"Gemini API错误 {response.status}: {error_text}")

    async def validate_connection(self) -> bool:
        # Simple validation call
        try:
            # Try a minimal generation for validation since listing models might function differently with keys
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{self.config.model_name}:generateContent?key={self.config.api_key}"
            payload = {
                "contents": [{"parts": [{"text": "Hi"}]}],
                "generationConfig": {"maxOutputTokens": 1},
            }
            async with aiohttp.ClientSession() as session:
                async with session.post(url, json=payload, timeout=10) as response:
                    return response.status == 200
        except Exception as e:
            return False


class AnthropicClient(CustomLLMClient):
    """Anthropic Claude客户端实现"""

    async def generate_response(self, prompt: str, **kwargs) -> str:
        headers = {
            "x-api-key": self.config.api_key,
            "Content-Type": "application/json",
            "anthropic-version": "2023-06-01",
        }

        payload = {
            "model": self.config.model_name,
            "max_tokens": self.config.max_tokens,
            "messages": [{"role": "user", "content": prompt}],
        }

        async with aiohttp.ClientSession(headers=headers) as session:
            async with session.post(
                f"{self.config.base_url}/v1/messages",
                json=payload,
                timeout=self.config.timeout,
            ) as response:
                if response.status == 200:
                    result = await response.json()
                    return result["content"][0]["text"]
                else:
                    raise Exception(f"Anthropic API错误: {response.status}")

    async def validate_connection(self) -> bool:
        try:
            headers = {"x-api-key": self.config.api_key}
            async with aiohttp.ClientSession(headers=headers) as session:
                async with session.get(f"{self.config.base_url}/v1/models") as response:
                    return response.status == 200
        except Exception as e:
            return False


class LocalLLMClient(CustomLLMClient):
    """本地大模型客户端实现（如Ollama、LocalAI等）"""

    async def generate_response(self, prompt: str, **kwargs) -> str:
        payload = {
            "model": self.config.model_name,
            "prompt": prompt,
            "stream": False,
            "options": {
                "temperature": self.config.temperature,
                "num_predict": self.config.max_tokens // 4,  # 近似token数
            },
        }

        async with aiohttp.ClientSession() as session:
            async with session.post(
                f"{self.config.base_url}/api/generate",
                json=payload,
                timeout=self.config.timeout,
            ) as response:
                if response.status == 200:
                    result = await response.json()
                    return result.get("response", "")
                else:
                    raise Exception(f"本地LLM API错误: {response.status}")

    async def validate_connection(self) -> bool:
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(f"{self.config.base_url}/api/tags") as response:
                    return response.status == 200
        except Exception as e:
            return False


# 预定义的常用配置
LLM_CONFIGURATIONS = {
    "gpt-4": LLMConfig(
        provider=LLMProvider.OPENAI,
        model_name="gpt-4",
        api_key="your-openai-key",
        base_url="https://api.openai.com/v1",
    ),
    "claude-3-sonnet": LLMConfig(
        provider=LLMProvider.ANTHROPIC,
        model_name="claude-3-sonnet-20240229",
        api_key="your-anthropic-key",
        base_url="https://api.anthropic.com",
    ),
    "qwen-max": LLMConfig(
        provider=LLMProvider.QWEN,
        model_name="qwen-max",
        api_key="your-qwen-key",
        base_url="https://dashscope.aliyuncs.com/api/v1",
    ),
    "deepseek-coder": LLMConfig(
        provider=LLMProvider.DEEPSEEK,
        model_name="deepseek-coder",
        api_key="your-deepseek-key",
        base_url="https://api.deepseek.com",
    ),
    "local-llama": LLMConfig(
        provider=LLMProvider.LOCAL,
        model_name="llama2",
        base_url="http://localhost:11434",
    ),
    "ollama-mistral": LLMConfig(
        provider=LLMProvider.OLLAMA,
        model_name="mistral",
        base_url="http://localhost:11434",
    ),
}


def get_client(config: LLMConfig) -> CustomLLMClient:
    """工厂函数：根据配置返回对应的客户端"""
    if config.provider == LLMProvider.OPENAI:
        return OpenAIClient(config)
    elif config.provider == LLMProvider.ANTHROPIC:
        return AnthropicClient(config)
    elif config.provider == LLMProvider.GOOGLE:
        return GoogleGenAIClient(config)
    elif config.provider == LLMProvider.GLM:
        # GLM 使用类似 OpenAI 的 API 格式
        return OpenAIClient(config)
    elif config.provider == LLMProvider.DEEPSEEK:
        # DeepSeek 使用类似 OpenAI 的 API 格式
        return OpenAIClient(config)
    elif config.provider == LLMProvider.LOCAL or config.provider == LLMProvider.OLLAMA:
        return LocalLLMClient(config)
    else:
        # 为其他提供商实现对应的客户端
        raise ValueError(f"不支持的提供商: {config.provider}")


def load_config_from_file(config_path: str) -> Dict[str, LLMConfig]:
    """从配置文件加载LLM配置"""
    try:
        with open(config_path, "r", encoding="utf-8") as f:
            config_data = json.load(f)

        configs = {}
        for name, config_dict in config_data.items():
            configs[name] = LLMConfig(**config_dict)

        return configs
    except Exception as e:
        print(f"加载LLM配置失败: {e}")
        return {}


def save_config_to_file(configs: Dict[str, LLMConfig], config_path: str):
    """保存LLM配置到文件"""
    config_data = {}
    for name, config in configs.items():
        config_data[name] = {
            "provider": config.provider.value,
            "model_name": config.model_name,
            "api_key": config.api_key,
            "base_url": config.base_url,
            "max_tokens": config.max_tokens,
            "temperature": config.temperature,
            "timeout": config.timeout,
        }

    with open(config_path, "w", encoding="utf-8") as f:
        json.dump(config_data, f, indent=2, ensure_ascii=False)


def load_api_keys_from_settings(settings_path: str = None) -> Dict[str, str]:
    """
    从设置文件加载API密钥（支持轮值）

    Args:
        settings_path: 设置文件路径，默认为 backend-v2/data/api_keys.json

    Returns:
        提供商到当前应使用的API密钥的映射字典
    """
    if settings_path is None:
        # 默认路径：backend-v2/data/api_keys.json
        from pathlib import Path

        current_dir = Path(__file__).parent

        # 检查是否在 backend-v2 目录中
        if current_dir.name == "backend-v2":
            settings_path = current_dir / "data" / "api_keys.json"
        else:
            # 在项目根目录，需要进入 backend-v2
            settings_path = current_dir / "backend-v2" / "data" / "api_keys.json"

    try:
        if not Path(settings_path).exists():
            print(f"⚠️  设置文件不存在: {settings_path}")
            return {}

        with open(settings_path, "r", encoding="utf-8") as f:
            settings_data = json.load(f)

        # 提取API密钥（排除 last_updated 等元数据字段）
        api_keys = {}
        for provider, data in settings_data.items():
            if provider == "last_updated":
                continue

            # 新格式：支持轮值
            if isinstance(data, dict) and "api_keys" in data:
                api_keys_list = data["api_keys"]
                current_index = data.get("current_index", 0)

                # 返回当前应使用的key
                if api_keys_list and 0 <= current_index < len(api_keys_list):
                    api_keys[provider] = api_keys_list[current_index]
                    print(
                        f"✅ {provider}: 使用第 {current_index + 1}/{len(api_keys_list)} 个API key"
                    )
            # 旧格式：单个key（可能包含换行符）
            elif isinstance(data, dict) and "api_key" in data:
                key_value = data["api_key"]

                # 如果key包含换行符，说明是多个key，取第一个
                if isinstance(key_value, str) and "\n" in key_value:
                    keys_list = [k.strip() for k in key_value.split("\n") if k.strip()]
                    if keys_list:
                        api_keys[provider] = keys_list[0]  # 使用第一个key
                        print(
                            f"✅ {provider}: 检测到 {len(keys_list)} 个API key，使用第 1 个"
                        )
                    else:
                        print(f"⚠️  {provider}: API key列表为空")
                else:
                    api_keys[provider] = key_value
                    print(f"✅ {provider}: 已加载单个API key")

        print(f"✅ 从设置文件加载了 {len(api_keys)} 个API密钥")
        return api_keys

    except Exception as e:
        print(f"❌ 加载设置文件失败: {str(e)}")
        return {}


def update_llm_configurations_with_api_keys():
    """
    使用设置文件中的API密钥更新 LLM_CONFIGURATIONS

    这个函数会：
    1. 清除旧的预定义配置（没有真实API key的配置）
    2. 从设置文件读取API密钥
    3. 创建新的配置（只保留有真实API key的配置）

    Returns:
        更新后的配置数量
    """
    # 从设置文件加载API密钥
    api_keys = load_api_keys_from_settings()

    if not api_keys:
        print("⚠️  未找到API密钥配置，使用默认配置")
        return 0

    # 清除旧的预定义配置（只保留有真实API key的配置）
    # 这样可以确保只使用当前配置了API key的提供商
    LLM_CONFIGURATIONS.clear()
    print("🧹 清除旧的预定义配置")

    updated_count = 0

    # 提供商到配置的映射
    provider_config_map = {
        "google": {
            "config_name": "gemini-pro",
            "model_name": "gemini-flash-latest",
            "base_url": "https://generativelanguage.googleapis.com",
        },
        "openai": {
            "config_name": "gpt-4o",
            "model_name": "gpt-4o",
            "base_url": "https://api.openai.com/v1",
        },
        "glm": {
            "config_name": "glm-4-flash",
            "model_name": "glm-4-flash",
            "base_url": "https://open.bigmodel.cn/api/paas/v4",
        },
        "deepseek": {
            "config_name": "deepseek-chat",
            "model_name": "deepseek-chat",
            "base_url": "https://api.deepseek.com",
        },
        "anthropic": {
            "config_name": "claude-sonnet-4-5",
            "model_name": "claude-sonnet-4-5-20250514",
            "base_url": "https://api.anthropic.com",
        },
    }

    # 创建配置（字典已清空，总是创建新配置）
    # 优先级顺序：Google > GLM > DeepSeek > 其他
    provider_priority = ["google", "glm", "deepseek", "openai", "anthropic"]

    for provider in provider_priority:
        if provider in api_keys and provider in provider_config_map:
            api_key = api_keys[provider]
            config_info = provider_config_map[provider]
            config_name = config_info["config_name"]

            # 创建新配置
            provider_enum = LLMProvider[provider.upper()]
            LLM_CONFIGURATIONS[config_name] = LLMConfig(
                provider=provider_enum,
                model_name=config_info["model_name"],
                api_key=api_key,
                base_url=config_info["base_url"],
            )
            print(
                f"✅ 创建配置: {config_name} (provider={provider}, model={config_info['model_name']})"
            )

            updated_count += 1

    print(f"🎉 总共更新了 {updated_count} 个LLM配置")
    return updated_count


# 自动加载API密钥（在模块导入时执行）
try:
    update_llm_configurations_with_api_keys()
except Exception as e:
    print(f"⚠️  自动加载API密钥时出错: {str(e)}")
