"""
示例 2: JSON 数据源
"""

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..'))

import json
from universal_rag.core.generator import RAGPipeline
from universal_rag.config import RAGConfig

def create_sample_json():
    """创建示例 JSON 数据"""
    data = {
        "documents": [
            {
                "id": 1,
                "title": "机器学习简介",
                "content": "机器学习是人工智能的一个分支，它使计算机能够从数据中学习并做出决策。"
            },
            {
                "id": 2,
                "title": "监督学习",
                "content": "监督学习是机器学习的一种方法，使用标记的训练数据来训练模型。"
            },
            {
                "id": 3,
                "title": "深度学习",
                "content": "深度学习是机器学习的一个子领域，使用多层神经网络来学习数据的表示。"
            },
            {
                "id": 4,
                "title": "神经网络",
                "content": "神经网络是一种受生物神经系统启发的计算模型，由多个相互连接的节点组成。"
            },
            {
                "id": 5,
                "title": "卷积神经网络",
                "content": "卷积神经网络（CNN）是一种专门用于处理图像数据的深度学习模型。"
            }
        ],
        "relations": [
            {"source_id": 2, "target_id": 1, "relation_type": "prerequisite"},
            {"source_id": 3, "target_id": 1, "relation_type": "prerequisite"},
            {"source_id": 3, "target_id": 2, "relation_type": "prerequisite"},
            {"source_id": 4, "target_id": 3, "relation_type": "prerequisite"},
            {"source_id": 5, "target_id": 4, "relation_type": "prerequisite"}
        ]
    }

    with open("sample_data.json", "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    print("✅ 创建示例数据: sample_data.json")


def example_json_source():
    """JSON 数据源示例"""
    print("=" * 70)
    print("示例 2: JSON 数据源")
    print("=" * 70)

    # 创建示例数据
    create_sample_json()

    # 创建配置
    config = RAGConfig(
        data_source_type="json",
        data_source_path="sample_data.json",
        id_field="id",
        title_field="title",
        content_field="content",
        retrieval_strategy="hybrid",
        enable_graph=True,
        top_k=3
    )

    # 使用 RAG
    with RAGPipeline(config) as rag:
        # 1. 问答
        print("\n1. 问答:")
        query = "什么是深度学习？"
        answer = rag.ask(query)
        print(f"问题: {query}")
        print(f"回答:\n{answer}")

        # 2. 搜索
        print("\n2. 搜索:")
        results = rag.search("神经网络", top_k=3)
        print(f"找到 {len(results)} 个结果:")
        for i, doc in enumerate(results, 1):
            print(f"  {i}. {doc['title']}")

        # 3. 学习路径
        print("\n3. 学习路径:")
        path = rag.get_path(target_id=5)  # 卷积神经网络
        print("学习 '卷积神经网络' 的推荐路径:")
        for i, step in enumerate(path, 1):
            print(f"  {i}. {step['title']} (距离: {step['distance']})")

    print("\n✅ 示例完成\n")


if __name__ == "__main__":
    example_json_source()
