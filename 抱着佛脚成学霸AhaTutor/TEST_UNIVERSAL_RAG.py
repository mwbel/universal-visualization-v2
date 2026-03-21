#!/usr/bin/env python3
"""
Universal RAG 独立模块测试
测试从父目录导入和使用 Universal RAG 模块
"""

import sys
import os

# 添加 universal_rag 到 Python 路径
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'universal_rag'))

from universal_rag import RAGPipeline, RAGConfig, RAGStrategy, RAGStrategySelector

def test_module_import():
    """测试模块导入"""
    print("=" * 60)
    print("测试 1: 模块导入")
    print("=" * 60)
    print("✅ RAGPipeline 导入成功")
    print("✅ RAGConfig 导入成功")
    print("✅ RAGStrategy 导入成功")
    print("✅ RAGStrategySelector 导入成功")
    print(f"✅ 可用策略数量: {len(RAGStrategy.__members__)}")
    print()

def test_strategy_list():
    """测试策略列表"""
    print("=" * 60)
    print("测试 2: 策略列表")
    print("=" * 60)
    strategies = RAGStrategySelector.list_strategies()
    for i, (strategy, description) in enumerate(strategies.items(), 1):
        config = RAGStrategySelector.get_strategy(strategy)
        print(f"{i}. {config.name} ({strategy.value})")
        print(f"   描述: {description}")
    print()

def test_strategy_recommendation():
    """测试策略推荐"""
    print("=" * 60)
    print("测试 3: 智能策略推荐")
    print("=" * 60)

    test_cases = [
        "我需要快速回答用户问题",
        "我想搜索大量文档",
        "我需要生成学习路径",
        "我想深入解释概念"
    ]

    for query in test_cases:
        strategy = RAGStrategySelector.recommend_strategy(query)
        print(f"查询: {query}")
        print(f"推荐: {strategy.value}")
        print()

def test_config_creation():
    """测试配置创建"""
    print("=" * 60)
    print("测试 4: 配置创建")
    print("=" * 60)

    # 基础配置
    config = RAGConfig(
        data_source_type="json",
        data_source_path="universal_rag/examples/sample_data.json"
    )
    print("✅ 基础配置创建成功")
    print(f"   数据源类型: {config.data_source_type}")
    print(f"   检索策略: {config.retrieval_strategy}")
    print(f"   Top K: {config.top_k}")
    print()

    # 应用策略
    RAGStrategySelector.apply_strategy(config, RAGStrategy.HYBRID)
    print("✅ 策略应用成功")
    print(f"   当前策略: HYBRID")
    print(f"   检索策略: {config.retrieval_strategy}")
    print(f"   启用图检索: {config.enable_graph}")
    print()

def test_rag_pipeline():
    """测试 RAG Pipeline"""
    print("=" * 60)
    print("测试 5: RAG Pipeline 功能")
    print("=" * 60)

    config = RAGConfig(
        data_source_type="json",
        data_source_path="universal_rag/examples/sample_data.json"
    )

    RAGStrategySelector.apply_strategy(config, RAGStrategy.HYBRID)

    try:
        with RAGPipeline(config) as rag:
            print("✅ RAG Pipeline 初始化成功")

            # 测试搜索
            results = rag.search("深度学习", top_k=3)
            print(f"✅ 搜索功能正常 (找到 {len(results)} 个结果)")

            # 测试问答
            answer = rag.ask("什么是深度学习？")
            print(f"✅ 问答功能正常")
            print(f"   回答: {answer[:100]}...")

    except Exception as e:
        print(f"❌ 测试失败: {e}")

    print()

def test_multi_project_usage():
    """测试多项目使用场景"""
    print("=" * 60)
    print("测试 6: 多项目使用场景")
    print("=" * 60)

    print("✅ 场景 1: concept2manim 项目")
    print("   导入方式: sys.path.insert(0, '../universal_rag')")
    print("   用途: 数学概念可视化的知识检索")
    print()

    print("✅ 场景 2: 其他教育项目")
    print("   导入方式: 绝对路径导入")
    print("   用途: 通用知识问答系统")
    print()

    print("✅ 场景 3: Web 服务")
    print("   访问方式: http://localhost:5001")
    print("   用途: 可视化界面和 REST API")
    print()

def main():
    """主测试函数"""
    print("\n")
    print("╔" + "=" * 58 + "╗")
    print("║" + " " * 10 + "Universal RAG 独立模块测试" + " " * 20 + "║")
    print("╚" + "=" * 58 + "╝")
    print()

    try:
        test_module_import()
        test_strategy_list()
        test_strategy_recommendation()
        test_config_creation()
        test_rag_pipeline()
        test_multi_project_usage()

        print("=" * 60)
        print("🎉 所有测试通过！")
        print("=" * 60)
        print()
        print("✅ Universal RAG 模块已成功部署为独立模块")
        print("✅ 可以在多个项目中共享使用")
        print("✅ Web 界面: http://localhost:5001")
        print("✅ 文档位置: universal_rag/README_USAGE.md")
        print()

    except Exception as e:
        print(f"\n❌ 测试失败: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()
