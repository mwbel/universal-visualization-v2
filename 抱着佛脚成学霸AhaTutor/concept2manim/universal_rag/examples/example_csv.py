"""
示例 4: CSV 数据源
"""

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..'))

import csv
from universal_rag.core.generator import RAGPipeline
from universal_rag.config import RAGConfig

def create_sample_csv():
    """创建示例 CSV 数据"""
    # 创建文档 CSV
    documents = [
        {"id": 1, "title": "Python 基础", "content": "Python 是一种高级编程语言，以其简洁的语法和强大的功能而闻名。"},
        {"id": 2, "title": "数据类型", "content": "Python 支持多种数据类型，包括整数、浮点数、字符串、列表、字典等。"},
        {"id": 3, "title": "函数定义", "content": "函数是可重用的代码块，使用 def 关键字定义，可以接受参数并返回值。"},
        {"id": 4, "title": "面向对象", "content": "Python 支持面向对象编程，可以定义类和对象，实现封装、继承和多态。"},
        {"id": 5, "title": "模块导入", "content": "Python 使用 import 语句导入模块，可以重用其他文件中的代码。"}
    ]

    with open("sample_documents.csv", "w", encoding="utf-8", newline='') as f:
        writer = csv.DictWriter(f, fieldnames=["id", "title", "content"])
        writer.writeheader()
        writer.writerows(documents)

    # 创建关系 CSV
    relations = [
        {"source_id": 2, "target_id": 1, "relation_type": "prerequisite"},
        {"source_id": 3, "target_id": 1, "relation_type": "prerequisite"},
        {"source_id": 3, "target_id": 2, "relation_type": "prerequisite"},
        {"source_id": 4, "target_id": 3, "relation_type": "prerequisite"},
        {"source_id": 5, "target_id": 1, "relation_type": "prerequisite"}
    ]

    with open("sample_relations.csv", "w", encoding="utf-8", newline='') as f:
        writer = csv.DictWriter(f, fieldnames=["source_id", "target_id", "relation_type"])
        writer.writeheader()
        writer.writerows(relations)

    print("✅ 创建示例数据: sample_documents.csv, sample_relations.csv")


def example_csv_source():
    """CSV 数据源示例"""
    print("=" * 70)
    print("示例 4: CSV 数据源")
    print("=" * 70)

    # 创建示例数据
    create_sample_csv()

    # 创建配置
    config = RAGConfig(
        data_source_type="csv",
        data_source_path="sample_documents.csv",
        relations_table="sample_relations.csv",  # CSV 使用 relations_table 指定关系文件路径
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
        query = "什么是 Python 函数？"
        answer = rag.ask(query)
        print(f"问题: {query}")
        print(f"回答:\n{answer}")

        # 2. 搜索
        print("\n2. 搜索:")
        results = rag.search("面向对象", top_k=3)
        print(f"找到 {len(results)} 个结果:")
        for i, doc in enumerate(results, 1):
            print(f"  {i}. {doc['title']}")

        # 3. 学习路径
        print("\n3. 学习路径:")
        path = rag.get_path(target_id=4)  # 面向对象
        print("学习 '面向对象' 的推荐路径:")
        for i, step in enumerate(path, 1):
            print(f"  {i}. {step['title']} (距离: {step['distance']})")

    print("\n✅ 示例完成\n")


if __name__ == "__main__":
    example_csv_source()
