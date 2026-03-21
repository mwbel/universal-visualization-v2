"""
RAG 策略选择器 - 让用户自由选择不同的 RAG 方案
"""

from enum import Enum
from typing import Optional, Dict, Any
from dataclasses import dataclass


class RAGStrategy(Enum):
    """RAG 策略枚举"""

    # 基础策略
    VECTOR_ONLY = "vector_only"           # 纯向量检索
    GRAPH_ONLY = "graph_only"             # 纯图检索
    HYBRID = "hybrid"                     # 混合检索（向量+图）

    # 高级策略
    SEMANTIC_SEARCH = "semantic_search"   # 语义搜索（深度向量）
    KNOWLEDGE_GRAPH = "knowledge_graph"   # 知识图谱增强
    MULTI_HOP = "multi_hop"               # 多跳推理
    CONTEXTUAL = "contextual"             # 上下文感知

    # 特定场景策略
    QA_FOCUSED = "qa_focused"             # 问答优化
    DOCUMENT_RETRIEVAL = "document_retrieval"  # 文档检索优化
    LEARNING_PATH = "learning_path"       # 学习路径优化
    CONCEPT_EXPLANATION = "concept_explanation"  # 概念解释优化


@dataclass
class StrategyConfig:
    """策略配置"""
    name: str
    description: str
    retrieval_strategy: str
    enable_graph: bool
    top_k: int
    max_hops: int
    vector_method: str
    relation_types: list
    use_reranking: bool = False
    expand_context: bool = False


class RAGStrategySelector:
    """RAG 策略选择器"""

    # 预定义策略配置
    STRATEGIES: Dict[RAGStrategy, StrategyConfig] = {
        RAGStrategy.VECTOR_ONLY: StrategyConfig(
            name="纯向量检索",
            description="使用 TF-IDF 或 embedding 进行语义相似度检索，适合简单问答",
            retrieval_strategy="vector",
            enable_graph=False,
            top_k=5,
            max_hops=0,
            vector_method="tfidf",
            relation_types=[]
        ),

        RAGStrategy.GRAPH_ONLY: StrategyConfig(
            name="纯图检索",
            description="基于知识图谱的关系遍历，适合探索概念关系",
            retrieval_strategy="graph",
            enable_graph=True,
            top_k=10,
            max_hops=3,
            vector_method="tfidf",
            relation_types=["prerequisite", "related", "derived"]
        ),

        RAGStrategy.HYBRID: StrategyConfig(
            name="混合检索",
            description="结合向量和图检索，平衡语义相似度和结构关系",
            retrieval_strategy="hybrid",
            enable_graph=True,
            top_k=5,
            max_hops=2,
            vector_method="tfidf",
            relation_types=["prerequisite", "related"],
            use_reranking=True
        ),

        RAGStrategy.SEMANTIC_SEARCH: StrategyConfig(
            name="语义搜索",
            description="深度语义理解，使用 embedding 模型",
            retrieval_strategy="vector",
            enable_graph=False,
            top_k=10,
            max_hops=0,
            vector_method="embedding",
            relation_types=[]
        ),

        RAGStrategy.KNOWLEDGE_GRAPH: StrategyConfig(
            name="知识图谱增强",
            description="深度图遍历，探索复杂的概念网络",
            retrieval_strategy="hybrid",
            enable_graph=True,
            top_k=8,
            max_hops=4,
            vector_method="tfidf",
            relation_types=["prerequisite", "related", "derived", "example"],
            expand_context=True
        ),

        RAGStrategy.MULTI_HOP: StrategyConfig(
            name="多跳推理",
            description="多步推理，适合需要推导的复杂问题",
            retrieval_strategy="graph",
            enable_graph=True,
            top_k=15,
            max_hops=5,
            vector_method="tfidf",
            relation_types=["prerequisite", "derived", "related"]
        ),

        RAGStrategy.CONTEXTUAL: StrategyConfig(
            name="上下文感知",
            description="考虑上下文关系，提供更全面的答案",
            retrieval_strategy="hybrid",
            enable_graph=True,
            top_k=7,
            max_hops=2,
            vector_method="tfidf",
            relation_types=["prerequisite", "related"],
            expand_context=True,
            use_reranking=True
        ),

        RAGStrategy.QA_FOCUSED: StrategyConfig(
            name="问答优化",
            description="针对问答场景优化，快速准确",
            retrieval_strategy="vector",
            enable_graph=False,
            top_k=3,
            max_hops=0,
            vector_method="tfidf",
            relation_types=[]
        ),

        RAGStrategy.DOCUMENT_RETRIEVAL: StrategyConfig(
            name="文档检索优化",
            description="大规模文档检索，返回更多结果",
            retrieval_strategy="vector",
            enable_graph=False,
            top_k=20,
            max_hops=0,
            vector_method="tfidf",
            relation_types=[]
        ),

        RAGStrategy.LEARNING_PATH: StrategyConfig(
            name="学习路径优化",
            description="生成结构化学习路径，强调前置关系",
            retrieval_strategy="graph",
            enable_graph=True,
            top_k=10,
            max_hops=6,
            vector_method="tfidf",
            relation_types=["prerequisite", "derived"]
        ),

        RAGStrategy.CONCEPT_EXPLANATION: StrategyConfig(
            name="概念解释优化",
            description="深入解释概念，包含相关和示例",
            retrieval_strategy="hybrid",
            enable_graph=True,
            top_k=8,
            max_hops=3,
            vector_method="tfidf",
            relation_types=["prerequisite", "related", "example"],
            expand_context=True
        )
    }

    @classmethod
    def get_strategy(cls, strategy: RAGStrategy) -> StrategyConfig:
        """获取策略配置"""
        return cls.STRATEGIES.get(strategy)

    @classmethod
    def list_strategies(cls) -> Dict[RAGStrategy, str]:
        """列出所有可用策略"""
        return {
            strategy: config.description
            for strategy, config in cls.STRATEGIES.items()
        }

    @classmethod
    def apply_strategy(cls, config, strategy: RAGStrategy):
        """将策略应用到 RAGConfig"""
        strategy_config = cls.get_strategy(strategy)
        if not strategy_config:
            raise ValueError(f"Unknown strategy: {strategy}")

        # 应用策略配置
        config.retrieval_strategy = strategy_config.retrieval_strategy
        config.enable_graph = strategy_config.enable_graph
        config.top_k = strategy_config.top_k
        config.max_hops = strategy_config.max_hops
        config.vector_method = strategy_config.vector_method
        config.relation_types = strategy_config.relation_types

        return config

    @classmethod
    def recommend_strategy(cls, use_case: str) -> RAGStrategy:
        """根据使用场景推荐策略"""
        recommendations = {
            "问答": RAGStrategy.QA_FOCUSED,
            "qa": RAGStrategy.QA_FOCUSED,
            "搜索": RAGStrategy.DOCUMENT_RETRIEVAL,
            "search": RAGStrategy.DOCUMENT_RETRIEVAL,
            "学习": RAGStrategy.LEARNING_PATH,
            "learning": RAGStrategy.LEARNING_PATH,
            "解释": RAGStrategy.CONCEPT_EXPLANATION,
            "explain": RAGStrategy.CONCEPT_EXPLANATION,
            "知识图谱": RAGStrategy.KNOWLEDGE_GRAPH,
            "graph": RAGStrategy.KNOWLEDGE_GRAPH,
            "推理": RAGStrategy.MULTI_HOP,
            "reasoning": RAGStrategy.MULTI_HOP,
        }

        use_case_lower = use_case.lower()
        for key, strategy in recommendations.items():
            if key in use_case_lower:
                return strategy

        # 默认返回混合策略
        return RAGStrategy.HYBRID


def print_strategy_comparison():
    """打印策略对比表"""
    print("\n" + "=" * 100)
    print("RAG 策略对比表")
    print("=" * 100)
    print(f"{'策略名称':<20} {'检索方式':<12} {'图检索':<8} {'Top-K':<8} {'跳数':<8} {'适用场景':<30}")
    print("-" * 100)

    for strategy, config in RAGStrategySelector.STRATEGIES.items():
        graph_status = "✓" if config.enable_graph else "✗"
        print(f"{config.name:<18} {config.retrieval_strategy:<12} {graph_status:<8} "
              f"{config.top_k:<8} {config.max_hops:<8} {config.description:<30}")

    print("=" * 100 + "\n")


if __name__ == "__main__":
    # 打印策略对比
    print_strategy_comparison()

    # 列出所有策略
    print("\n可用的 RAG 策略:")
    for strategy, desc in RAGStrategySelector.list_strategies().items():
        print(f"  • {strategy.value}: {desc}")

    # 推荐策略
    print("\n\n策略推荐示例:")
    use_cases = ["问答", "学习路径", "文档搜索", "概念解释"]
    for use_case in use_cases:
        recommended = RAGStrategySelector.recommend_strategy(use_case)
        config = RAGStrategySelector.get_strategy(recommended)
        print(f"  {use_case} -> {config.name}")
