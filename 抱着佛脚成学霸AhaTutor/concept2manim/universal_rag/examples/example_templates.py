"""
示例 3: 配置模板使用
"""

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..'))

from universal_rag import RAGPipeline
from universal_rag.config import ConfigTemplates

def example_config_templates():
    """配置模板示例"""
    print("=" * 70)
    print("示例 3: 配置模板使用")
    print("=" * 70)

    # 1. 简单问答配置
    print("\n1. 简单问答配置:")
    config = ConfigTemplates.simple_qa()
    config.data_source_type = "json"
    config.data_source_path = "sample_data.json"
    config.id_field = "id"
    config.title_field = "title"
    config.content_field = "content"

    print(f"  检索策略: {config.retrieval_strategy}")
    print(f"  启用图检索: {config.enable_graph}")
    print(f"  返回结果数: {config.top_k}")

    # 2. 知识图谱配置
    print("\n2. 知识图谱配置:")
    config = ConfigTemplates.knowledge_graph()
    config.data_source_type = "json"
    config.data_source_path = "sample_data.json"
    config.id_field = "id"
    config.title_field = "title"
    config.content_field = "content"

    print(f"  检索策略: {config.retrieval_strategy}")
    print(f"  启用图检索: {config.enable_graph}")
    print(f"  最大跳数: {config.max_hops}")

    with RAGPipeline(config) as rag:
        results = rag.search("深度学习", top_k=3)
        print(f"  搜索结果: {len(results)} 个")

    # 3. 文档搜索配置
    print("\n3. 文档搜索配置:")
    config = ConfigTemplates.document_search()
    config.data_source_type = "json"
    config.data_source_path = "sample_data.json"
    config.id_field = "id"
    config.title_field = "title"
    config.content_field = "content"

    print(f"  检索策略: {config.retrieval_strategy}")
    print(f"  向量方法: {config.vector_method}")
    print(f"  返回结果数: {config.top_k}")

    # 4. 学习路径配置
    print("\n4. 学习路径配置:")
    config = ConfigTemplates.learning_path()
    config.data_source_type = "json"
    config.data_source_path = "sample_data.json"
    config.id_field = "id"
    config.title_field = "title"
    config.content_field = "content"

    print(f"  检索策略: {config.retrieval_strategy}")
    print(f"  最大跳数: {config.max_hops}")
    print(f"  关系类型: {config.relation_types}")

    print("\n✅ 示例完成\n")


if __name__ == "__main__":
    example_config_templates()
