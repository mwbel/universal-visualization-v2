"""
示例 1: 基础使用 - SQLite 数据源
"""

from universal_rag import RAGPipeline, RAGConfig

def example_basic_sqlite():
    """基础 SQLite 示例"""
    print("=" * 70)
    print("示例 1: 基础使用 - SQLite 数据源")
    print("=" * 70)

    # 创建配置
    config = RAGConfig(
        data_source_type="sqlite",
        data_source_path="../math_concepts.db",
        documents_table="concepts",
        relations_table="concept_relations",
        id_field="id",
        title_field="name",
        content_field="description",
        retrieval_strategy="hybrid",
        top_k=5,
        enable_graph=True
    )

    # 使用 RAG
    with RAGPipeline(config) as rag:
        # 1. 问答
        print("\n1. 问答:")
        query = "什么是导数？"
        answer = rag.ask(query)
        print(f"问题: {query}")
        print(f"回答: {answer[:200]}...")

        # 2. 搜索
        print("\n2. 搜索:")
        results = rag.search("函数极限", top_k=3)
        print(f"找到 {len(results)} 个结果:")
        for i, doc in enumerate(results, 1):
            print(f"  {i}. {doc.get('name', 'N/A')[:50]}...")

        # 3. 解释文档
        print("\n3. 解释文档:")
        if results:
            doc_id = results[0]['id']
            info = rag.explain(doc_id)
            print(f"文档 ID: {doc_id}")
            print(f"相关文档数: {len(info.get('related', []))}")

    print("\n✅ 示例完成\n")


if __name__ == "__main__":
    example_basic_sqlite()
