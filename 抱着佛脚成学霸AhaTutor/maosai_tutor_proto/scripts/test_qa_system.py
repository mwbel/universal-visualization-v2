#!/usr/bin/env python3
"""
测试问答系统
整合向量检索、知识图谱和RAG服务
"""

import sys
from pathlib import Path

# 添加父目录到路径
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.services.vector_store import VectorStoreService, EmbeddingService
from app.services.knowledge_graph import KnowledgeGraph, KnowledgeGraphBuilder
from app.services.rag_service import RAGService


def load_knowledge_graph(data_dir: Path) -> KnowledgeGraph:
    """加载知识图谱"""
    catalog_path = data_dir / "advanced_math_catalog.jsonc"
    builder = KnowledgeGraphBuilder(catalog_path)
    return builder.build()


def test_integrated_qa_system():
    """测试集成问答系统"""
    print("=" * 60)
    print("高等数学问答系统测试")
    print("=" * 60)

    # 初始化服务
    workspace_root = Path(__file__).parent.parent
    data_dir = workspace_root / "data"

    print("\n1. 初始化向量存储...")
    vector_store = VectorStoreService(provider="memory")
    embedding_service = EmbeddingService(provider="local")

    print("\n2. 加载知识图谱...")
    kg = load_knowledge_graph(data_dir)
    stats = kg.get_stats()
    print(f"   ✓ 知识图谱加载完成")
    print(f"   - 节点数: {stats['total_nodes']}")
    print(f"   - 边数: {stats['total_edges']}")

    print("\n3. 初始化RAG服务...")
    rag_service = RAGService(data_dir=str(data_dir))
    print(f"   ✓ RAG服务就绪: {rag_service.is_ready}")

    # 测试问题
    test_questions = [
        "什么是导数？",
        "如何计算极限？",
        "积分的几何意义是什么？",
        "泰勒公式有什么用？",
        "偏导数和全微分的关系",
    ]

    print("\n" + "=" * 60)
    print("问答测试")
    print("=" * 60)

    for i, question in enumerate(test_questions, 1):
        print(f"\n问题 {i}: {question}")
        print("-" * 60)

        # 1. 向量检索
        query_embedding = embedding_service.embed([question])[0]
        vector_results = vector_store.search(query_embedding, top_k=3)

        if vector_results:
            print("\n[向量检索结果]")
            for idx, result in enumerate(vector_results[:2], 1):
                metadata = result.get("metadata", {})
                print(
                    f"  {idx}. [{metadata.get('chapter', 'N/A')}] {metadata.get('title', 'N/A')}"
                )
                print(f"     相似度: {result['score']:.4f}")

        # 2. 知识图谱检索
        kg_results = kg.search_by_keyword(question[:5])
        if kg_results:
            print("\n[知识图谱检索]")
            for idx, node in enumerate(kg_results[:2], 1):
                print(f"  {idx}. [{node.chapter}] {node.title}")

                # 获取前置知识
                prerequisites = kg.get_prerequisites(node.id)
                if prerequisites:
                    print(f"     前置知识: {prerequisites[0].title}")

        # 3. RAG上下文
        if rag_service.is_ready:
            context = rag_service.get_context_for_query(question, max_context_length=500)
            if context:
                print("\n[RAG上下文]")
                print(f"  {context[:200]}...")

    # 测试学习路径
    print("\n" + "=" * 60)
    print("学习路径测试")
    print("=" * 60)

    target_concepts = ["导数", "积分", "偏导数"]
    for concept in target_concepts:
        nodes = kg.search_by_keyword(concept)
        if nodes:
            target_node = nodes[0]
            print(f"\n学习'{target_node.title}'的路径:")
            path = kg.get_learning_path(target_node.id)
            for i, node in enumerate(path[-5:], 1):
                print(f"  {i}. [{node.chapter}] {node.title}")

    print("\n" + "=" * 60)
    print("✓ 问答系统测试完成")
    print("=" * 60)


def main():
    """主函数"""
    test_integrated_qa_system()


if __name__ == "__main__":
    main()
