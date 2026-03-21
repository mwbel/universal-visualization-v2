"""
Universal RAG 集成示例
演示如何在其他项目中使用 Universal RAG
"""

import sys
sys.path.insert(0, 'universal_rag')

from universal_rag import RAGPipeline, RAGConfig, RAGStrategy, RAGStrategySelector

def example_1_basic_usage():
    """示例 1: 基础使用"""
    print("=" * 70)
    print("示例 1: 基础使用 - 3 行代码搞定")
    print("=" * 70)

    config = RAGConfig(
        data_source_type="json",
        data_source_path="universal_rag/examples/sample_data.json"
    )

    with RAGPipeline(config) as rag:
        answer = rag.ask("什么是深度学习？")
        print(f"回答: {answer[:200]}...\n")


def example_2_with_strategy():
    """示例 2: 使用策略"""
    print("=" * 70)
    print("示例 2: 选择最佳策略")
    print("=" * 70)

    config = RAGConfig(
        data_source_type="json",
        data_source_path="universal_rag/examples/sample_data.json"
    )

    # 应用问答优化策略
    RAGStrategySelector.apply_strategy(config, RAGStrategy.QA_FOCUSED)

    with RAGPipeline(config) as rag:
        answer = rag.ask("什么是神经网络？")
        print(f"回答: {answer[:200]}...\n")


def example_3_smart_recommendation():
    """示例 3: 智能推荐策略"""
    print("=" * 70)
    print("示例 3: 智能推荐策略")
    print("=" * 70)

    use_cases = [
        "我需要快速回答用户问题",
        "我想生成学习路径",
        "我要搜索大量文档",
        "我需要深入解释概念"
    ]

    for use_case in use_cases:
        strategy = RAGStrategySelector.recommend_strategy(use_case)
        strategy_config = RAGStrategySelector.get_strategy(strategy)
        print(f"场景: {use_case}")
        print(f"推荐: {strategy_config.name} ({strategy.value})\n")


def example_4_multiple_data_sources():
    """示例 4: 多数据源支持"""
    print("=" * 70)
    print("示例 4: 支持多种数据源")
    print("=" * 70)

    # JSON 数据源
    config_json = RAGConfig(
        data_source_type="json",
        data_source_path="universal_rag/examples/sample_data.json"
    )

    # CSV 数据源
    config_csv = RAGConfig(
        data_source_type="csv",
        data_source_path="universal_rag/examples/sample_documents.csv",
        relations_table="universal_rag/examples/sample_relations.csv"
    )

    print("✅ JSON 数据源配置完成")
    print("✅ CSV 数据源配置完成")
    print("✅ SQLite 数据源也支持\n")


def example_5_rest_api():
    """示例 5: REST API 调用"""
    print("=" * 70)
    print("示例 5: REST API 远程调用")
    print("=" * 70)

    print("Web 服务地址: http://localhost:5001")
    print("\n初始化:")
    print("""
curl -X POST http://localhost:5001/api/init \\
  -H "Content-Type: application/json" \\
  -d '{
    "data_source_type": "json",
    "data_source_path": "examples/sample_data.json",
    "strategy": "hybrid"
  }'
""")

    print("问答:")
    print("""
curl -X POST http://localhost:5001/api/ask \\
  -H "Content-Type: application/json" \\
  -d '{"query": "什么是深度学习？"}'
""")


def example_6_integration_in_project():
    """示例 6: 项目集成模板"""
    print("=" * 70)
    print("示例 6: 在你的项目中集成")
    print("=" * 70)

    code = '''
# 1. 导入模块
from universal_rag import RAGPipeline, RAGConfig, RAGStrategy, RAGStrategySelector

# 2. 创建配置
config = RAGConfig(
    data_source_type="json",
    data_source_path="your_data.json"
)

# 3. 选择策略（可选）
RAGStrategySelector.apply_strategy(config, RAGStrategy.HYBRID)

# 4. 使用
with RAGPipeline(config) as rag:
    # 问答
    answer = rag.ask("你的问题")

    # 搜索
    results = rag.search("关键词", top_k=10)

    # 学习路径
    path = rag.get_path(target_id=5)
'''
    print(code)


if __name__ == "__main__":
    print("\n")
    print("🚀 Universal RAG - 集成示例")
    print("=" * 70)
    print("展示如何在任何项目中使用 Universal RAG")
    print("=" * 70)
    print("\n")

    example_1_basic_usage()
    example_2_with_strategy()
    example_3_smart_recommendation()
    example_4_multiple_data_sources()
    example_5_rest_api()
    example_6_integration_in_project()

    print("=" * 70)
    print("✅ 所有示例完成！")
    print("=" * 70)
    print("\n📚 更多信息:")
    print("  - 完整文档: universal_rag/README.md")
    print("  - 快速开始: universal_rag/QUICKSTART.md")
    print("  - 策略指南: universal_rag/STRATEGY_GUIDE.md")
    print("  - Web 界面: http://localhost:5001")
    print("\n")
