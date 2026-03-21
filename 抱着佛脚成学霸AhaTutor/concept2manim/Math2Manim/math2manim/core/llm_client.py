"""
LLM 客户端 - 支持 OpenAI 和 Anthropic Claude API

用于生成高质量的 Manim 动画代码
"""

import os
from typing import Optional, Dict, Any
from dataclasses import dataclass


@dataclass
class LLMConfig:
    """LLM 配置"""
    provider: str = "glm"  # "openai", "anthropic", or "glm"
    api_key: Optional[str] = None
    model: str = "glm-4-plus"  # 或 "claude-3-5-sonnet-20241022", "gpt-4"
    temperature: float = 0.7
    max_tokens: int = 4000


class LLMClient:
    """
    LLM 客户端，支持多个提供商
    """

    def __init__(self, config: Optional[LLMConfig] = None):
        """
        初始化 LLM 客户端

        Args:
            config: LLM 配置
        """
        self.config = config or LLMConfig()

        # 从环境变量获取 API key
        if not self.config.api_key:
            if self.config.provider == "anthropic":
                self.config.api_key = os.getenv("ANTHROPIC_API_KEY")
            elif self.config.provider == "openai":
                self.config.api_key = os.getenv("OPENAI_API_KEY")
            elif self.config.provider == "glm":
                self.config.api_key = os.getenv("GLM_API_KEY")

        self.client = None
        self._initialize_client()

    def _initialize_client(self):
        """初始化 API 客户端"""
        if not self.config.api_key:
            print(f"Warning: No API key found for {self.config.provider}")
            return

        try:
            if self.config.provider == "anthropic":
                import anthropic
                self.client = anthropic.Anthropic(api_key=self.config.api_key)
            elif self.config.provider == "openai":
                import openai
                self.client = openai.OpenAI(api_key=self.config.api_key)
            elif self.config.provider == "glm":
                from zhipuai import ZhipuAI
                self.client = ZhipuAI(api_key=self.config.api_key)
        except ImportError as e:
            print(f"Warning: Failed to import {self.config.provider} library: {e}")
            print(f"Install with: pip install {self.config.provider if self.config.provider != 'glm' else 'zhipuai'}")

    def generate(self, prompt: str, system_prompt: Optional[str] = None) -> Optional[str]:
        """
        生成代码

        Args:
            prompt: 用户提示词
            system_prompt: 系统提示词

        Returns:
            生成的代码，如果失败返回 None
        """
        if not self.client:
            return None

        try:
            if self.config.provider == "anthropic":
                return self._generate_anthropic(prompt, system_prompt)
            elif self.config.provider == "openai":
                return self._generate_openai(prompt, system_prompt)
            elif self.config.provider == "glm":
                return self._generate_glm(prompt, system_prompt)
        except Exception as e:
            print(f"LLM generation error: {e}")
            return None

    def _generate_anthropic(self, prompt: str, system_prompt: Optional[str]) -> str:
        """使用 Anthropic Claude API 生成"""
        messages = [{"role": "user", "content": prompt}]

        kwargs = {
            "model": self.config.model,
            "max_tokens": self.config.max_tokens,
            "temperature": self.config.temperature,
            "messages": messages
        }

        if system_prompt:
            kwargs["system"] = system_prompt

        response = self.client.messages.create(**kwargs)
        return response.content[0].text

    def _generate_openai(self, prompt: str, system_prompt: Optional[str]) -> str:
        """使用 OpenAI API 生成"""
        messages = []

        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})

        messages.append({"role": "user", "content": prompt})

        response = self.client.chat.completions.create(
            model=self.config.model,
            messages=messages,
            temperature=self.config.temperature,
            max_tokens=self.config.max_tokens
        )

        return response.choices[0].message.content

    def _generate_glm(self, prompt: str, system_prompt: Optional[str]) -> str:
        """使用 GLM API 生成"""
        messages = []

        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})

        messages.append({"role": "user", "content": prompt})

        response = self.client.chat.completions.create(
            model=self.config.model,
            messages=messages,
            temperature=self.config.temperature,
            max_tokens=self.config.max_tokens
        )

        return response.choices[0].message.content

    def is_available(self) -> bool:
        """检查 LLM 是否可用"""
        return self.client is not None
