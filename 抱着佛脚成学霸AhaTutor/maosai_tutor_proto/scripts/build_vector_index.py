#!/usr/bin/env python3
"""
向量索引构建脚本
读取 advanced_math_catalog.jsonc 并构建向量索引
"""

import json
import sys
from pathlib import Path

# 添加父目录到路径
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.services.vector_store import (
    VectorStoreService,
    EmbeddingService,
    VectorDocument,
)


def load_catalog(catalog_path: Path) -> dict:
    """加载知识库目录"""
    with open(catalog_path, "r", encoding="utf-8") as f:
        # 跳过注释行
        lines = f.readlines()
        json_lines = [line for line in lines if not line.strip().startswith("//")]
        json_content = "".join(json_lines)
        return json.loads(json_content)


def build_vector_index(catalog_path: Path, provider: str = "memory"):
    """构建向量索引"""
    print("=" * 60)
    print("向量索引构建工具")
    print("=" * 60)

    # 加载知识库
    print(f"\n加载知识库: {catalog_path}")
    catalog = load_catalog(catalog_path)
    knowledge_nodes = catalog.get("knowledge_nodes", [])
    print(f"✓ 加载了 {len(knowledge_nodes)} 个知识点")

    # 初始化服务
    print(f"\n初始化向量存储 (provider: {provider})...")
    vector_store = VectorStoreService(provider=provider)

    print("初始化嵌入服务...")
    embedding_service = EmbeddingService(provider="local")

    # 准备文档
    print("\n准备文档...")
    documents = []
    for node in knowledge_nodes:
        # 组合文本：标题 + 详情
        text = f"{node['title']}\n{node['details']}"

        doc = VectorDocument(
            id=node["id"],
            text=text,
            metadata={
                "title": node["title"],
                "chapter": node["chapter"],
                "section": node["section"],
                "subject": node["subject"],
                "label": node["label"],
                "viz_id": node["viz"]["viz_id"],
            },
        )
        documents.append(doc)

    print(f"✓ 准备了 {len(documents)} 个文档")

    # 生成嵌入
    print("\n生成嵌入向量...")
    batch_size = 50
    for i in range(0, len(documents), batch_size):
        batch = documents[i : i + batch_size]
        texts = [doc.text for doc in batch]

        embeddings = embedding_service.embed(texts)

        for doc, embedding in zip(batch, embeddings):
            doc.embedding = embedding

        print(f"  处理进度: {min(i + batch_size, len(documents))}/{len(documents)}")

    print("✓ 嵌入生成完成")

    # 插入向量存储
    print("\n插入向量存储...")
    vector_store.upsert_documents(documents, batch_size=100)
    print("✓ 向量索引构建完成")

    # 统计信息
    stats = vector_store.get_stats()
    print(f"\n统计信息:")
    print(f"  总向量数: {stats.get('total_vectors', 0)}")
    print(f"  向量维度: {stats.get('dimension', 0)}")

    # 测试搜索
    print("\n" + "=" * 60)
    print("测试搜索功能")
    print("=" * 60)

    test_queries = [
        "什么是极限",
        "导数的定义",
        "如何计算积分",
        "泰勒公式",
        "偏导数",
    ]

    for query in test_queries:
        print(f"\n查询: {query}")
        query_embedding = embedding_service.embed([query])[0]
        results = vector_store.search(query_embedding, top_k=3)

        print(f"找到 {len(results)} 个结果:")
        for idx, result in enumerate(results, 1):
            metadata = result.get("metadata", {})
            print(
                f"  {idx}. [{metadata.get('chapter', 'N/A')}] {metadata.get('title', 'N/A')}"
            )
            print(f"     相似度: {result['score']:.4f}")

    print("\n" + "=" * 60)
    print("✓ 向量索引构建和测试完成")
    print("=" * 60)

    return vector_store


def main():
    """主函数"""
    # 设置路径
    workspace_root = Path(__file__).parent.parent
    catalog_path = workspace_root / "data" / "advanced_math_catalog.jsonc"

    if not catalog_path.exists():
        print(f"✗ 错误: 找不到知识库文件 {catalog_path}")
        print("请先运行 import_advanced_math.py 导入知识内容")
        return

    # 构建索引
    build_vector_index(catalog_path, provider="memory")


if __name__ == "__main__":
    main()
