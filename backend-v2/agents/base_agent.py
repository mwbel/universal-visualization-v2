"""
万物可视化 v2.0 - Base Agent 抽象类
定义所有学科可视化Agent的统一接口和基础功能
"""

from abc import ABC, abstractmethod
from typing import Dict, List, Optional, Any, Union
import json
import re
import uuid
from datetime import datetime

class BaseVisualizationAgent(ABC):
    """可视化Agent基类 - 方案A核心组件"""

    def __init__(self, subject: str, config: Dict[str, Any]):
        """
        初始化Agent

        Args:
            subject: 学科名称 (mathematics, astronomy, physics)
            config: Agent配置参数
        """
        self.subject = subject
        self.config = config
        self.templates = self._load_templates()
        self.domain_knowledge = self._load_domain_knowledge()
        self.agent_id = str(uuid.uuid4())

    @abstractmethod
    async def parse_requirement(self, prompt: str) -> Dict[str, Any]:
        """
        解析学科特定需求

        Args:
            prompt: 用户输入的自然语言描述

        Returns:
            Dict: 解析后的结构化需求
        """
        pass

    @abstractmethod
    async def match_template(self, requirement: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        匹配学科特定模板

        Args:
            requirement: 解析后的需求结构

        Returns:
            Dict: 匹配的模板配置，如果没有匹配则返回None
        """
        pass

    @abstractmethod
    async def generate_config(self, requirement: Dict[str, Any], template: Dict[str, Any], user_preferences: Dict[str, Any]) -> Dict[str, Any]:
        """
        生成可视化配置

        Args:
            requirement: 需求结构
            template: 模板配置
            user_preferences: 用户偏好

        Returns:
            Dict: 最终的可视化配置
        """
        pass

    @abstractmethod
    async def generate_visualization(self, config: Dict[str, Any]) -> str:
        """
        生成可视化HTML

        Args:
            config: 可视化配置

        Returns:
            str: 生成的HTML内容
        """
        pass

    @abstractmethod
    def get_supported_topics(self) -> List[str]:
        """
        获取支持的学科主题

        Returns:
            List[str]: 支持的主题列表
        """
        pass

    def _load_templates(self) -> Dict[str, Any]:
        """
        加载学科模板 (可被子类重写)

        Returns:
            Dict: 模板字典
        """
        return {}

    def _load_domain_knowledge(self) -> Dict[str, Any]:
        """
        加载领域知识 (可被子类重写)

        Returns:
            Dict: 领域知识字典
        """
        return {}

    def _extract_numbers(self, text: str) -> List[float]:
        """
        从文本中提取数字

        Args:
            text: 输入文本

        Returns:
            List[float]: 提取的数字列表
        """
        # 匹配整数、小数、负数、科学计数法
        pattern = r'[-+]?\d*\.?\d+(?:[eE][-+]?\d+)?'
        numbers = re.findall(pattern, text)
        return [float(num) for num in numbers]

    def _extract_keywords(self, text: str, keywords: List[str]) -> List[str]:
        """
        从文本中提取关键词

        Args:
            text: 输入文本
            keywords: 关键词列表

        Returns:
            List[str]: 匹配的关键词
        """
        text_lower = text.lower()
        matched = []
        for keyword in keywords:
            if keyword.lower() in text_lower:
                matched.append(keyword)
        return matched

    def _generate_default_title(self, requirement: Dict[str, Any]) -> str:
        """
        生成默认标题

        Args:
            requirement: 需求结构

        Returns:
            str: 生成的标题
        """
        subject_names = {
            "mathematics": "数学",
            "astronomy": "天文",
            "physics": "物理"
        }
        subject_name = subject_names.get(self.subject, "通用")
        return f"{subject_name}可视化 - {datetime.now().strftime('%Y-%m-%d %H:%M')}"

    def get_agent_info(self) -> Dict[str, Any]:
        """
        获取Agent信息

        Returns:
            Dict: Agent详细信息
        """
        return {
            "agent_id": self.agent_id,
            "subject": self.subject,
            "config": self.config,
            "template_count": len(self.templates),
            "supported_topics": self.get_supported_topics(),
            "created_at": datetime.now()
        }

class VisualizationError(Exception):
    """可视化生成错误"""
    pass

class TemplateNotFoundError(VisualizationError):
    """模板未找到错误"""
    pass

class RequirementParseError(VisualizationError):
    """需求解析错误"""
    pass

class UnsupportedFeatureError(VisualizationError):
    """不支持的功能错误"""
    pass