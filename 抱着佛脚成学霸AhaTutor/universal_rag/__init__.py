"""
Universal RAG - 通用检索增强生成模块

一个可复用的 RAG 框架，支持：
- 多种数据源（SQLite, JSON, CSV, MongoDB等）
- 多种检索策略（向量、图、混合）
- 灵活的配置系统
- 易于集成到任何项目

作者: Claude
版本: 1.0.0
"""

from .core.database import DatabaseAdapter, SQLiteAdapter, JSONAdapter, CSVAdapter, create_adapter
from .core.retriever import VectorRetriever, GraphRetriever, HybridRetriever, create_retriever
from .core.generator import RAGGenerator, RAGPipeline
from .config import RAGConfig, ConfigTemplates
from .strategy_selector import RAGStrategy, RAGStrategySelector

__version__ = "1.0.0"
__all__ = [
    "DatabaseAdapter",
    "SQLiteAdapter",
    "JSONAdapter",
    "CSVAdapter",
    "create_adapter",
    "VectorRetriever",
    "GraphRetriever",
    "HybridRetriever",
    "create_retriever",
    "RAGGenerator",
    "RAGPipeline",
    "RAGConfig",
    "ConfigTemplates",
    "RAGStrategy",
    "RAGStrategySelector"
]
