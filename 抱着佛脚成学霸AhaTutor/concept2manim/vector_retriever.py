"""
向量检索模块 - 为 GraphRAG 添加语义搜索能力
使用简单的 TF-IDF 和余弦相似度实现（无需外部依赖）
"""

import json
import math
from typing import List, Dict, Tuple, Optional
from collections import Counter, defaultdict
import re
from concept_database import ConceptDatabase


class VectorRetriever:
    """
    向量检索器 - 基于 TF-IDF 的语义搜索

    特点：
    1. 无需外部依赖（不需要 sentence-transformers）
    2. 轻量级实现
    3. 支持中文分词（简单字符级）
    4. 适合数学概念检索
    """

    def __init__(self, db_path: str = "math_concepts.db"):
        self.db_path = db_path
        self.documents = []  # 所有文档
        self.doc_ids = []  # 文档ID
        self.vocab = set()  # 词汇表
        self.idf = {}  # IDF值
        self.doc_vectors = []  # 文档向量

        self._load_and_index()

    def _tokenize(self, text: str) -> List[str]:
        """
        简单分词（字符级 + 关键词提取）

        对于数学概念，我们使用：
        1. 单字分词（中文）
        2. 数学关键词提取
        """
        if not text:
            return []

        # 提取数学关键词
        math_keywords = [
            '函数', '极限', '导数', '积分', '微分', '偏导数', '连续',
            '定理', '公式', '方程', '不等式', '级数', '矩阵', '向量',
            '曲线', '曲面', '空间', '平面', '坐标', '变换', '映射',
            '收敛', '发散', '单调', '有界', '可导', '可微', '可积'
        ]

        tokens = []

        # 提取关键词
        for keyword in math_keywords:
            if keyword in text:
                tokens.append(keyword)

        # 字符级分词（去除标点和空格）
        chars = [c for c in text if c.strip() and not re.match(r'[^\w]', c)]
        tokens.extend(chars[:50])  # 限制长度

        return tokens

    def _load_and_index(self):
        """加载文档并建立索引"""
        db = ConceptDatabase(self.db_path)
        cursor = db.conn.cursor()

        # 加载所有概念
        cursor.execute("""
            SELECT id, name, description, keywords
            FROM concepts
        """)

        for row in cursor.fetchall():
            doc_id = row[0]
            name = row[1] or ""
            description = row[2] or ""
            keywords_json = row[3]

            # 合并文本
            text = name + " " + description
            if keywords_json:
                keywords = json.loads(keywords_json)
                text += " " + " ".join(keywords)

            self.documents.append(text)
            self.doc_ids.append(doc_id)

        db.close()

        # 建立索引
        self._build_index()

        print(f"✅ 向量索引构建完成: {len(self.documents)} 个文档")

    def _build_index(self):
        """构建 TF-IDF 索引"""
        # 1. 分词并构建词汇表
        tokenized_docs = []
        for doc in self.documents:
            tokens = self._tokenize(doc)
            tokenized_docs.append(tokens)
            self.vocab.update(tokens)

        # 2. 计算 IDF
        doc_count = len(self.documents)
        word_doc_count = defaultdict(int)

        for tokens in tokenized_docs:
            unique_tokens = set(tokens)
            for token in unique_tokens:
                word_doc_count[token] += 1

        for word, count in word_doc_count.items():
            self.idf[word] = math.log(doc_count / (count + 1))

        # 3. 计算文档向量（TF-IDF）
        for tokens in tokenized_docs:
            vector = self._compute_tfidf(tokens)
            self.doc_vectors.append(vector)

    def _compute_tfidf(self, tokens: List[str]) -> Dict[str, float]:
        """计算 TF-IDF 向量"""
        # 计算词频
        tf = Counter(tokens)
        total_words = len(tokens)

        # 计算 TF-IDF
        vector = {}
        for word, count in tf.items():
            tf_value = count / total_words if total_words > 0 else 0
            idf_value = self.idf.get(word, 0)
            vector[word] = tf_value * idf_value

        return vector

    def _cosine_similarity(self, vec1: Dict[str, float], vec2: Dict[str, float]) -> float:
        """计算余弦相似度"""
        # 计算点积
        common_words = set(vec1.keys()) & set(vec2.keys())
        dot_product = sum(vec1[word] * vec2[word] for word in common_words)

        # 计算模长
        norm1 = math.sqrt(sum(v ** 2 for v in vec1.values()))
        norm2 = math.sqrt(sum(v ** 2 for v in vec2.values()))

        if norm1 == 0 or norm2 == 0:
            return 0.0

        return dot_product / (norm1 * norm2)

    def search(self, query: str, top_k: int = 10) -> List[Tuple[int, float]]:
        """
        语义搜索

        Args:
            query: 查询文本
            top_k: 返回前k个结果

        Returns:
            [(doc_id, similarity_score), ...]
        """
        # 查询向量化
        query_tokens = self._tokenize(query)
        query_vector = self._compute_tfidf(query_tokens)

        # 计算相似度
        similarities = []
        for i, doc_vector in enumerate(self.doc_vectors):
            similarity = self._cosine_similarity(query_vector, doc_vector)
            similarities.append((self.doc_ids[i], similarity))

        # 排序并返回 top_k
        similarities.sort(key=lambda x: x[1], reverse=True)
        return similarities[:top_k]

    def search_with_details(self, query: str, top_k: int = 10) -> List[Dict]:
        """
        语义搜索（返回详细信息）

        Returns:
            [{'id': ..., 'name': ..., 'score': ..., 'description': ...}, ...]
        """
        results = self.search(query, top_k)

        # 获取详细信息
        db = ConceptDatabase(self.db_path)
        detailed_results = []

        for doc_id, score in results:
            cursor = db.conn.cursor()
            cursor.execute("""
                SELECT id, name, type, chapter, description
                FROM concepts
                WHERE id = ?
            """, (doc_id,))

            row = cursor.fetchone()
            if row:
                detailed_results.append({
                    'id': row[0],
                    'name': row[1],
                    'type': row[2],
                    'chapter': row[3],
                    'description': row[4],
                    'score': score
                })

        db.close()
        return detailed_results


class HybridRetriever:
    """
    混合检索器 - 结合图检索和向量检索

    策略：
    1. 向量检索找到语义相关的概念
    2. 图检索扩展相关概念的前置知识
    3. 融合排序
    """

    def __init__(self, db_path: str = "math_concepts.db"):
        from graph_rag import GraphRAG

        self.vector_retriever = VectorRetriever(db_path)
        self.graph_rag = GraphRAG(db_path)

    def search(
        self,
        query: str,
        top_k: int = 10,
        expand_graph: bool = True,
        max_hops: int = 2
    ) -> List[Dict]:
        """
        混合检索

        Args:
            query: 查询文本
            top_k: 返回结果数
            expand_graph: 是否使用图扩展
            max_hops: 图扩展的最大跳数

        Returns:
            检索结果列表
        """
        # 1. 向量检索
        vector_results = self.vector_retriever.search_with_details(query, top_k * 2)

        if not expand_graph:
            return vector_results[:top_k]

        # 2. 图扩展
        expanded_concepts = set()
        for result in vector_results[:5]:  # 只对前5个结果做图扩展
            concept_name = result['name']

            # 多跳检索
            graph_results = self.graph_rag.multi_hop_search(
                concept_name,
                max_hops=max_hops
            )

            for graph_result in graph_results:
                expanded_concepts.add(graph_result.node.id)

        # 3. 融合结果
        final_results = []
        seen_ids = set()

        # 优先返回向量检索的结果
        for result in vector_results:
            if result['id'] not in seen_ids:
                final_results.append(result)
                seen_ids.add(result['id'])

        # 添加图扩展的结果
        db = self.graph_rag.conn
        cursor = db.cursor()
        for concept_id in expanded_concepts:
            if concept_id not in seen_ids:
                cursor.execute("""
                    SELECT id, name, type, chapter, description
                    FROM concepts
                    WHERE id = ?
                """, (concept_id,))

                row = cursor.fetchone()
                if row:
                    final_results.append({
                        'id': row[0],
                        'name': row[1],
                        'type': row[2],
                        'chapter': row[3],
                        'description': row[4],
                        'score': 0.5  # 图扩展的结果给较低分数
                    })
                    seen_ids.add(concept_id)

        return final_results[:top_k]


if __name__ == "__main__":
    print("=" * 70)
    print("测试向量检索")
    print("=" * 70)

    # 测试 1: 基础向量检索
    print("\n=== 测试 1: 向量检索 ===")
    retriever = VectorRetriever()

    query = "如何求函数的变化率"
    results = retriever.search_with_details(query, top_k=5)

    print(f"查询: {query}")
    print(f"找到 {len(results)} 个相关概念:\n")
    for i, result in enumerate(results, 1):
        print(f"{i}. {result['name'][:50]}...")
        print(f"   章节: {result['chapter']}, 相似度: {result['score']:.3f}")

    # 测试 2: 混合检索
    print("\n=== 测试 2: 混合检索（向量 + 图）===")
    hybrid = HybridRetriever()

    query = "多元函数的导数"
    results = hybrid.search(query, top_k=5, expand_graph=True)

    print(f"查询: {query}")
    print(f"找到 {len(results)} 个相关概念:\n")
    for i, result in enumerate(results, 1):
        print(f"{i}. {result['name'][:50]}...")
        print(f"   章节: {result['chapter']}, 分数: {result['score']:.3f}")

    print("\n" + "=" * 70)
    print("✅ 向量检索测试完成")
    print("=" * 70)
