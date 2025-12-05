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
        custom_headers: Optional[Dict[str, str]] = None
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
            "Content-Type": "application/json"
        }

        payload = {
            "model": self.config.model_name,
            "messages": [{"role": "user", "content": prompt}],
            "max_tokens": self.config.max_tokens,
            "temperature": self.config.temperature
        }

        async with aiohttp.ClientSession(headers=headers) as session:
            async with session.post(
                f"{self.config.base_url}/chat/completions",
                json=payload,
                timeout=self.config.timeout
            ) as response:
                if response.status == 200:
                    result = await response.json()
                    return result["choices"][0]["message"]["content"]
                else:
                    raise Exception(f"OpenAI API错误: {response.status}")

    async def validate_connection(self) -> bool:
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(
                    f"{self.config.base_url}/models",
                    headers={"Authorization": f"Bearer {self.config.api_key}"}
                ) as response:
                    return response.status == 200
        except:
            return False

class AnthropicClient(CustomLLMClient):
    """Anthropic Claude客户端实现"""

    async def generate_response(self, prompt: str, **kwargs) -> str:
        headers = {
            "x-api-key": self.config.api_key,
            "Content-Type": "application/json",
            "anthropic-version": "2023-06-01"
        }

        payload = {
            "model": self.config.model_name,
            "max_tokens": self.config.max_tokens,
            "messages": [{"role": "user", "content": prompt}]
        }

        async with aiohttp.ClientSession(headers=headers) as session:
            async with session.post(
                f"{self.config.base_url}/v1/messages",
                json=payload,
                timeout=self.config.timeout
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
        except:
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
                "num_predict": self.config.max_tokens // 4  # 近似token数
            }
        }

        async with aiohttp.ClientSession() as session:
            async with session.post(
                f"{self.config.base_url}/api/generate",
                json=payload,
                timeout=self.config.timeout
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
        except:
            return False

# 预定义的常用配置
LLM_CONFIGURATIONS = {
    "gpt-4": LLMConfig(
        provider=LLMProvider.OPENAI,
        model_name="gpt-4",
        api_key="your-openai-key",
        base_url="https://api.openai.com/v1"
    ),

    "claude-3-sonnet": LLMConfig(
        provider=LLMProvider.ANTHROPIC,
        model_name="claude-3-sonnet-20240229",
        api_key="your-anthropic-key",
        base_url="https://api.anthropic.com"
    ),

    "qwen-max": LLMConfig(
        provider=LLMProvider.QWEN,
        model_name="qwen-max",
        api_key="your-qwen-key",
        base_url="https://dashscope.aliyuncs.com/api/v1"
    ),

    "deepseek-coder": LLMConfig(
        provider=LLMProvider.DEEPSEEK,
        model_name="deepseek-coder",
        api_key="your-deepseek-key",
        base_url="https://api.deepseek.com"
    ),

    "local-llama": LLMConfig(
        provider=LLMProvider.LOCAL,
        model_name="llama2",
        base_url="http://localhost:11434"
    ),

    "ollama-mistral": LLMConfig(
        provider=LLMProvider.OLLAMA,
        model_name="mistral",
        base_url="http://localhost:11434"
    )
}

def get_client(config: LLMConfig) -> CustomLLMClient:
    """工厂函数：根据配置返回对应的客户端"""
    if config.provider == LLMProvider.OPENAI:
        return OpenAIClient(config)
    elif config.provider == LLMProvider.ANTHROPIC:
        return AnthropicClient(config)
    elif config.provider == LLMProvider.LOCAL or config.provider == LLMProvider.OLLAMA:
        return LocalLLMClient(config)
    else:
        # 为其他提供商实现对应的客户端
        raise ValueError(f"不支持的提供商: {config.provider}")

def load_config_from_file(config_path: str) -> Dict[str, LLMConfig]:
    """从配置文件加载LLM配置"""
    try:
        with open(config_path, 'r', encoding='utf-8') as f:
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
            "timeout": config.timeout
        }

    with open(config_path, 'w', encoding='utf-8') as f:
        json.dump(config_data, f, indent=2, ensure_ascii=False)