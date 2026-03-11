"""
Math2Manim - 数学概念到 Manim 动画的智能生成库

基于反向知识树 (Reverse Knowledge Tree) 理念，将数学/物理概念
递归分解为前置知识，从基础向上构建完整的动画。

核心特性:
- 反向知识树：递归分解前置知识
- 零训练数据：纯推理生成
- 多 AI 管道：支持 Claude/GPT/Gemini
- 模板系统：内置高质量动画模板
"""

__version__ = "0.1.0"
__author__ = "Math2Manim Team"

from .core.knowledge_tree import KnowledgeTree, KnowledgeNode
from .core.concept_analyzer import ConceptAnalyzer
from .core.code_generator import CodeGenerator
from .core.llm_client import LLMClient, LLMConfig
from .generators.base_generator import ManimGenerator
from .templates.template_manager import TemplateManager

__all__ = [
    "KnowledgeTree",
    "KnowledgeNode",
    "ConceptAnalyzer",
    "CodeGenerator",
    "LLMClient",
    "LLMConfig",
    "ManimGenerator",
    "TemplateManager",
]
