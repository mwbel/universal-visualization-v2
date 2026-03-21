"""
配置系统 - 灵活的 RAG 配置
"""

from typing import Dict, Any, Optional
from dataclasses import dataclass, field
import json
from pathlib import Path


@dataclass
class RAGConfig:
    """RAG 配置类"""

    # 数据源配置
    data_source_type: str = "sqlite"  # sqlite, json, csv, mongodb
    data_source_path: str = "data.db"

    # 表/集合配置
    documents_table: str = "documents"
    relations_table: str = "relations"

    # 字段映射
    id_field: str = "id"
    content_field: str = "content"
    title_field: str = "title"
    metadata_field: str = "metadata"

    # 检索配置
    retrieval_strategy: str = "hybrid"  # vector, graph, hybrid
    top_k: int = 5
    max_hops: int = 2

    # 向量检索配置
    vector_method: str = "tfidf"  # tfidf, embedding
    embedding_model: Optional[str] = None

    # 图检索配置
    enable_graph: bool = True
    relation_types: list = field(default_factory=lambda: ["prerequisite", "related"])

    # 生成配置
    llm_provider: Optional[str] = None  # openai, anthropic, local
    llm_model: Optional[str] = None
    llm_api_key: Optional[str] = None
    temperature: float = 0.7
    max_tokens: int = 1000

    # 提示词模板
    prompt_template: str = """基于以下上下文回答问题：

上下文：
{context}

问题：{query}

回答："""

    # 缓存配置
    enable_cache: bool = True
    cache_dir: str = ".rag_cache"

    @classmethod
    def from_file(cls, config_path: str) -> "RAGConfig":
        """从配置文件加载"""
        with open(config_path, 'r', encoding='utf-8') as f:
            config_dict = json.load(f)
        return cls(**config_dict)

    def to_file(self, config_path: str):
        """保存到配置文件"""
        config_dict = {
            k: v for k, v in self.__dict__.items()
            if not k.startswith('_')
        }
        with open(config_path, 'w', encoding='utf-8') as f:
            json.dump(config_dict, f, ensure_ascii=False, indent=2)

    def validate(self) -> bool:
        """验证配置"""
        # 检查必需字段
        if not self.data_source_path:
            raise ValueError("data_source_path is required")

        # 检查检索策略
        valid_strategies = ["vector", "graph", "hybrid"]
        if self.retrieval_strategy not in valid_strategies:
            raise ValueError(f"retrieval_strategy must be one of {valid_strategies}")

        # 检查向量方法
        valid_vector_methods = ["tfidf", "embedding"]
        if self.vector_method not in valid_vector_methods:
            raise ValueError(f"vector_method must be one of {valid_vector_methods}")

        return True


# 预定义配置模板
class ConfigTemplates:
    """配置模板"""

    @staticmethod
    def simple_qa() -> RAGConfig:
        """简单问答配置"""
        return RAGConfig(
            retrieval_strategy="vector",
            enable_graph=False,
            top_k=3
        )

    @staticmethod
    def knowledge_graph() -> RAGConfig:
        """知识图谱配置"""
        return RAGConfig(
            retrieval_strategy="hybrid",
            enable_graph=True,
            max_hops=3,
            top_k=5
        )

    @staticmethod
    def document_search() -> RAGConfig:
        """文档搜索配置"""
        return RAGConfig(
            retrieval_strategy="vector",
            vector_method="tfidf",
            top_k=10,
            enable_graph=False
        )

    @staticmethod
    def learning_path() -> RAGConfig:
        """学习路径配置"""
        return RAGConfig(
            retrieval_strategy="graph",
            enable_graph=True,
            max_hops=5,
            relation_types=["prerequisite", "derived"]
        )
