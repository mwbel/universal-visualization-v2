"""
示例 5: 使用策略选择器
"""

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..'))

from universal_rag import RAGPipeline, RAGConfig
from universal_rag.strategy_selector import RAGStrategy, RAGStrategySelector


def example_strategy_selector():
    """策略选择器示例"""
    print("=" * 70)
    print("示例 5: 使用策略选择器 - 自由选择不同的 RAG 方案")
    print("=" * 70)

    # 准备数据源配置
    base_config = RAGConfig(
        data_source_type="json",
        data_source_path="sample_data.json",
        id_field="id",
        title_field="title",
        content_field="content"
    )

    # 场景 1: 简单问答 - 使用问答优化策略
    print("\n【场景 1: 简单问答】")
    print("策略: 问答优化 (QA_FOCUSED)")
    config1 = RAGConfig(**base_config.__dict__)
    RAGStrategySelector.apply_strategy(config1, RAGStrategy.QA_FOCUSED)

    print(f"  检索方式: {config1.retrieval_strategy}")
    print(f"  图检索: {config1.enable_graph}")
    print(f"  返回数: {config1.top_k}")

    with RAGPipeline(config1) as rag:
        answer = rag.ask("什么是深度学习？")
        print(f"  回答: {answer[:100]}...")

    # 场景 2: 学习路径 - 使用学习路径优化策略
    print("\n【场景 2: 学习路径生成】")
    print("策略: 学习路径优化 (LEARNING_PATH)")
    config2 = RAGConfig(**base_config.__dict__)
    RAGStrategySelector.apply_strategy(config2, RAGStrategy.LEARNING_PATH)

    print(f"  检索方式: {config2.retrieval_strategy}")
    print(f"  图检索: {config2.enable_graph}")
    print(f"  最大跳数: {config2.max_hops}")

    with RAGPipeline(config2) as rag:
        path = rag.get_path(target_id=5)
        print(f"  学习路径: {len(path)} 步")
        for i, step in enumerate(path[:3], 1):
            print(f"    {i}. {step['title']}")

    # 场景 3: 概念解释 - 使用概念解释优化策略
    print("\n【场景 3: 概念深度解释】")
    print("策略: 概念解释优化 (CONCEPT_EXPLANATION)")
    config3 = RAGConfig(**base_config.__dict__)
    RAGStrategySelector.apply_strategy(config3, RAGStrategy.CONCEPT_EXPLANATION)

    print(f"  检索方式: {config3.retrieval_strategy}")
    print(f"  图检索: {config3.enable_graph}")
    print(f"  返回数: {config3.top_k}")
    print(f"  最大跳数: {config3.max_hops}")

    with RAGPipeline(config3) as rag:
        results = rag.search("神经网络", top_k=3)
        print(f"  找到 {len(results)} 个相关概念:")
        for i, doc in enumerate(results, 1):
            print(f"    {i}. {doc['title']}")

    # 场景 4: 知识图谱探索 - 使用知识图谱增强策略
    print("\n【场景 4: 知识图谱探索】")
    print("策略: 知识图谱增强 (KNOWLEDGE_GRAPH)")
    config4 = RAGConfig(**base_config.__dict__)
    RAGStrategySelector.apply_strategy(config4, RAGStrategy.KNOWLEDGE_GRAPH)

    print(f"  检索方式: {config4.retrieval_strategy}")
    print(f"  图检索: {config4.enable_graph}")
    print(f"  最大跳数: {config4.max_hops}")

    with RAGPipeline(config4) as rag:
        results = rag.search("机器学习", top_k=5)
        print(f"  探索到 {len(results)} 个相关概念")

    # 场景 5: 智能推荐策略
    print("\n【场景 5: 智能推荐策略】")
    use_cases = ["问答", "学习", "搜索", "解释"]
    for use_case in use_cases:
        recommended = RAGStrategySelector.recommend_strategy(use_case)
        strategy_config = RAGStrategySelector.get_strategy(recommended)
        print(f"  {use_case} -> {strategy_config.name}")

    # 场景 6: 对比不同策略
    print("\n【场景 6: 策略对比】")
    strategies_to_compare = [
        RAGStrategy.VECTOR_ONLY,
        RAGStrategy.GRAPH_ONLY,
        RAGStrategy.HYBRID
    ]

    query = "深度学习"
    print(f"  查询: '{query}'")
    print(f"  {'策略':<15} {'检索方式':<10} {'结果数':<8}")
    print("  " + "-" * 40)

    for strategy in strategies_to_compare:
        config = RAGConfig(**base_config.__dict__)
        RAGStrategySelector.apply_strategy(config, strategy)
        strategy_info = RAGStrategySelector.get_strategy(strategy)

        with RAGPipeline(config) as rag:
            results = rag.search(query, top_k=5)
            print(f"  {strategy_info.name:<15} {config.retrieval_strategy:<10} {len(results):<8}")

    print("\n✅ 示例完成\n")


if __name__ == "__main__":
    example_strategy_selector()
