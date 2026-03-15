"""
向量数据库服务模块
支持Pinecone和Weaviate两种向量数据库
用于高等数学知识库的向量存储和检索
"""

import os
import json
import hashlib
from typing import List, Dict, Any, Optional, Tuple
from dataclasses import dataclass
from pathlib import Path

# 尝试导入向量数据库客户端
try:
    import pinecone

    PINECONE_AVAILABLE = True
except ImportError:
    PINECONE_AVAILABLE = False

try:
    import weaviate

    WEAVIATE_AVAILABLE = True
except ImportError:
    WEAVIATE_AVAILABLE = False


# 用于本地开发的内存存储
class InMemoryVectorStore:
    """内存向量存储（用于开发和测试）"""

    def __init__(self, dimension: int = 1536):
        self.dimension = dimension
        self.vectors: Dict[str, List[float]] = {}
        self.metadata: Dict[str, Dict[str, Any]] = {}

    def upsert(self, vectors: List[Tuple[str, List[float], Dict[str, Any]]]):
        """插入或更新向量"""
        for id, vector, metadata in vectors:
            self.vectors[id] = vector
            self.metadata[id] = metadata

    def query(
        self, vector: List[float], top_k: int = 5, filter: Optional[Dict] = None
    ) -> List[Dict[str, Any]]:
        """查询相似向量（简化实现，使用余弦相似度）"""
        import math

        def cosine_similarity(v1: List[float], v2: List[float]) -> float:
            dot = sum(a * b for a, b in zip(v1, v2))
            norm1 = math.sqrt(sum(a * a for a in v1))
            norm2 = math.sqrt(sum(a * a for a in v2))
            return dot / (norm1 * norm2) if norm1 > 0 and norm2 > 0 else 0

        results = []
        for id, stored_vector in self.vectors.items():
            metadata = self.metadata.get(id, {})

            # 应用过滤器
            if filter:
                match = True
                for key, value in filter.items():
                    if metadata.get(key) != value:
                        match = False
                        break
                if not match:
                    continue

            score = cosine_similarity(vector, stored_vector)
            results.append({"id": id, "score": score, "metadata": metadata})

        # 按相似度排序
        results.sort(key=lambda x: x["score"], reverse=True)
        return results[:top_k]

    def delete(self, ids: List[str]):
        """删除向量"""
        for id in ids:
            self.vectors.pop(id, None)
            self.metadata.pop(id, None)

    def get_stats(self) -> Dict[str, Any]:
        """获取统计信息"""
        return {"total_vectors": len(self.vectors), "dimension": self.dimension}


@dataclass
class VectorDocument:
    """向量文档"""

    id: str
    text: str
    embedding: Optional[List[float]] = None
    metadata: Optional[Dict[str, Any]] = None

    def __post_init__(self):
        if self.metadata is None:
            self.metadata = {}


class VectorStoreService:
    """向量存储服务"""

    def __init__(self, provider: str = "memory", dimension: int = 1536):
        """
        初始化向量存储服务

        Args:
            provider: 向量数据库提供商 ("pinecone", "weaviate", "memory")
            dimension: 向量维度
        """
        self.provider = provider
        self.dimension = dimension
        self.client = None
        self.index = None

        if provider == "pinecone":
            self._init_pinecone()
        elif provider == "weaviate":
            self._init_weaviate()
        else:
            self._init_memory()

    def _init_pinecone(self):
        """初始化Pinecone"""
        if not PINECONE_AVAILABLE:
            print("警告: Pinecone未安装，切换到内存存储")
            self._init_memory()
            return

        api_key = os.getenv("PINECONE_API_KEY")
        environment = os.getenv("PINECONE_ENVIRONMENT", "us-west1-gcp")

        if not api_key:
            print("警告: 未设置PINECONE_API_KEY，切换到内存存储")
            self._init_memory()
            return

        pinecone.init(api_key=api_key, environment=environment)

        # 创建或获取索引
        index_name = "advanced-math-kb"
        if index_name not in pinecone.list_indexes():
            pinecone.create_index(
                name=index_name, dimension=self.dimension, metric="cosine"
            )

        self.index = pinecone.Index(index_name)
        print(f"✓ Pinecone索引 '{index_name}' 已连接")

    def _init_weaviate(self):
        """初始化Weaviate"""
        if not WEAVIATE_AVAILABLE:
            print("警告: Weaviate未安装，切换到内存存储")
            self._init_memory()
            return

        url = os.getenv("WEAVIATE_URL", "http://localhost:8080")

        try:
            self.client = weaviate.Client(url)

            # 创建schema
            class_name = "AdvancedMathNode"
            if not self.client.schema.exists(class_name):
                self.client.schema.create_class(
                    {
                        "class": class_name,
                        "vectorizer": "none",  # 我们提供自己的向量
                        "properties": [
                            {"name": "title", "dataType": ["text"]},
                            {"name": "content", "dataType": ["text"]},
                            {"name": "chapter", "dataType": ["text"]},
                            {"name": "section", "dataType": ["text"]},
                            {"name": "subject", "dataType": ["text"]},
                            {"name": "node_id", "dataType": ["text"]},
                        ],
                    }
                )

            print(f"✓ Weaviate已连接到 {url}")
        except Exception as e:
            print(f"警告: 无法连接到Weaviate ({e})，切换到内存存储")
            self._init_memory()

    def _init_memory(self):
        """初始化内存存储"""
        self.provider = "memory"
        self.index = InMemoryVectorStore(dimension=self.dimension)
        print("✓ 内存向量存储已初始化")

    def upsert_documents(self, documents: List[VectorDocument], batch_size: int = 100):
        """
        批量插入或更新文档

        Args:
            documents: 文档列表
            batch_size: 批处理大小
        """
        if self.provider == "pinecone":
            self._upsert_pinecone(documents, batch_size)
        elif self.provider == "weaviate":
            self._upsert_weaviate(documents, batch_size)
        else:
            self._upsert_memory(documents)

    def _upsert_pinecone(self, documents: List[VectorDocument], batch_size: int):
        """插入到Pinecone"""
        for i in range(0, len(documents), batch_size):
            batch = documents[i : i + batch_size]
            vectors = []

            for doc in batch:
                if doc.embedding is None:
                    continue

                vectors.append(
                    {
                        "id": doc.id,
                        "values": doc.embedding,
                        "metadata": {
                            "title": doc.metadata.get("title", ""),
                            "chapter": doc.metadata.get("chapter", ""),
                            "section": doc.metadata.get("section", ""),
                            "subject": doc.metadata.get("subject", ""),
                            **doc.metadata,
                        },
                    }
                )

            if vectors:
                self.index.upsert(vectors=vectors)

    def _upsert_weaviate(self, documents: List[VectorDocument], batch_size: int):
        """插入到Weaviate"""
        with self.client.batch as batch:
            batch.batch_size = batch_size

            for doc in documents:
                if doc.embedding is None:
                    continue

                self.client.batch.add_data_object(
                    data_object={
                        "title": doc.metadata.get("title", ""),
                        "content": doc.text,
                        "chapter": doc.metadata.get("chapter", ""),
                        "section": doc.metadata.get("section", ""),
                        "subject": doc.metadata.get("subject", ""),
                        "node_id": doc.id,
                    },
                    class_name="AdvancedMathNode",
                    vector=doc.embedding,
                )

    def _upsert_memory(self, documents: List[VectorDocument]):
        """插入到内存存储"""
        vectors = []
        for doc in documents:
            if doc.embedding is None:
                continue
            vectors.append((doc.id, doc.embedding, doc.metadata))

        self.index.upsert(vectors)

    def search(
        self,
        query_vector: List[float],
        top_k: int = 5,
        filter: Optional[Dict[str, Any]] = None,
    ) -> List[Dict[str, Any]]:
        """
        向量搜索

        Args:
            query_vector: 查询向量
            top_k: 返回结果数量
            filter: 过滤条件

        Returns:
            搜索结果列表
        """
        if self.provider == "pinecone":
            return self._search_pinecone(query_vector, top_k, filter)
        elif self.provider == "weaviate":
            return self._search_weaviate(query_vector, top_k, filter)
        else:
            return self._search_memory(query_vector, top_k, filter)

    def _search_pinecone(
        self, query_vector: List[float], top_k: int, filter: Optional[Dict]
    ) -> List[Dict[str, Any]]:
        """Pinecone搜索"""
        results = self.index.query(
            vector=query_vector, top_k=top_k, filter=filter, include_metadata=True
        )

        return [
            {"id": match.id, "score": match.score, "metadata": match.metadata}
            for match in results.matches
        ]

    def _search_weaviate(
        self, query_vector: List[float], top_k: int, filter: Optional[Dict]
    ) -> List[Dict[str, Any]]:
        """Weaviate搜索"""
        where_clause = None
        if filter:
            where_clause = {
                "operator": "And",
                "operands": [
                    {"path": [k], "operator": "Equal", "valueString": v}
                    for k, v in filter.items()
                ],
            }

        results = (
            self.client.query.get(
                "AdvancedMathNode",
                ["title", "content", "chapter", "section", "subject", "node_id"],
            )
            .with_near_vector({"vector": query_vector})
            .with_limit(top_k)
        )

        if where_clause:
            results = results.with_where(where_clause)

        results = results.do()

        return [
            {
                "id": item.get("node_id"),
                "score": item.get("_additional", {}).get("certainty", 0),
                "metadata": item,
            }
            for item in results.get("data", {})
            .get("Get", {})
            .get("AdvancedMathNode", [])
        ]

    def _search_memory(
        self, query_vector: List[float], top_k: int, filter: Optional[Dict]
    ) -> List[Dict[str, Any]]:
        """内存搜索"""
        return self.index.query(query_vector, top_k, filter)

    def delete_by_ids(self, ids: List[str]):
        """根据ID删除文档"""
        if self.provider == "pinecone":
            self.index.delete(ids=ids)
        elif self.provider == "weaviate":
            for id in ids:
                self.client.data_object.delete(id, "AdvancedMathNode")
        else:
            self.index.delete(ids)

    def get_stats(self) -> Dict[str, Any]:
        """获取统计信息"""
        if self.provider == "pinecone":
            stats = self.index.describe_index_stats()
            return {
                "total_vectors": stats.total_vector_count,
                "dimension": stats.dimension,
            }
        elif self.provider == "weaviate":
            return {"provider": "weaviate", "status": "connected"}
        else:
            return self.index.get_stats()


class EmbeddingService:
    """文本嵌入服务"""

    def __init__(self, provider: str = "openai"):
        """
        初始化嵌入服务

        Args:
            provider: 嵌入提供商 ("openai", "local")
        """
        self.provider = provider

        if provider == "openai":
            self._init_openai()
        else:
            self._init_local()

    def _init_openai(self):
        """初始化OpenAI嵌入"""
        try:
            import openai

            self.client = openai.OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
            self.model = "text-embedding-3-small"
            self.dimension = 1536
        except ImportError:
            print("警告: OpenAI未安装，使用本地嵌入")
            self._init_local()

    def _init_local(self):
        """初始化本地嵌入（简化实现）"""
        self.provider = "local"
        self.dimension = 384  # 使用较小的维度
        print("✓ 本地嵌入服务已初始化")

    def embed(self, texts: List[str]) -> List[List[float]]:
        """
        将文本转换为向量

        Args:
            texts: 文本列表

        Returns:
            向量列表
        """
        if self.provider == "openai":
            return self._embed_openai(texts)
        else:
            return self._embed_local(texts)

    def _embed_openai(self, texts: List[str]) -> List[List[float]]:
        """OpenAI嵌入"""
        response = self.client.embeddings.create(model=self.model, input=texts)
        return [item.embedding for item in response.data]

    def _embed_local(self, texts: List[str]) -> List[List[float]]:
        """本地嵌入（使用简单的哈希方法作为示例）"""
        import hashlib
        import struct

        embeddings = []
        for text in texts:
            # 使用哈希生成伪随机向量
            hash_bytes = hashlib.sha256(text.encode()).digest()

            # 将哈希转换为浮点数向量
            vector = []
            for i in range(0, len(hash_bytes), 4):
                if len(vector) >= self.dimension:
                    break
                val = struct.unpack(
                    "f",
                    hash_bytes[i : i + 4] + b"\x00" * (4 - len(hash_bytes[i : i + 4])),
                )[0]
                vector.append(val)

            # 归一化
            import math

            norm = math.sqrt(sum(x * x for x in vector))
            if norm > 0:
                vector = [x / norm for x in vector]

            embeddings.append(vector)

        return embeddings


# 便捷函数
def create_vector_store(provider: str = "memory") -> VectorStoreService:
    """创建向量存储服务"""
    return VectorStoreService(provider=provider)


def create_embedding_service(provider: str = "local") -> EmbeddingService:
    """创建嵌入服务"""
    return EmbeddingService(provider=provider)


if __name__ == "__main__":
    # 测试代码
    print("=" * 60)
    print("向量数据库服务测试")
    print("=" * 60)

    # 创建服务
    store = create_vector_store("memory")
    embedder = create_embedding_service("local")

    # 测试数据
    test_docs = [
        VectorDocument(
            id="test_1",
            text="极限的定义：当x趋近于a时，f(x)的极限为L",
            metadata={"chapter": "第2章 极限与连续", "section": "极限概念"},
        ),
        VectorDocument(
            id="test_2",
            text="导数的定义：函数在某点的变化率",
            metadata={"chapter": "第3章 导数与微分", "section": "导数概念"},
        ),
    ]

    # 生成嵌入
    print("\n生成嵌入...")
    embeddings = embedder.embed([doc.text for doc in test_docs])
    for doc, emb in zip(test_docs, embeddings):
        doc.embedding = emb

    # 插入数据
    print("插入文档...")
    store.upsert_documents(test_docs)

    # 搜索测试
    print("\n搜索测试...")
    query = "什么是极限"
    query_embedding = embedder.embed([query])[0]

    results = store.search(query_embedding, top_k=2)

    print(f"\n查询: {query}")
    print(f"找到 {len(results)} 个结果:")
    for result in results:
        print(f"  - ID: {result['id']}, 相似度: {result['score']:.4f}")

    # 统计信息
    print(f"\n统计信息: {store.get_stats()}")
