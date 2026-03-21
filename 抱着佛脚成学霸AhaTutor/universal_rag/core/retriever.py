"""
通用检索器 - 支持向量、图、混合检索
"""

from typing import List, Dict, Any, Optional, Tuple
from collections import Counter, defaultdict
import math
import re
from collections import deque


class VectorRetriever:
    """向量检索器（TF-IDF）"""

    def __init__(self, db_adapter, config):
        self.db = db_adapter
        self.config = config
        self.documents = []
        self.doc_ids = []
        self.vocab = set()
        self.idf = {}
        self.doc_vectors = []

        self._build_index()

    def _tokenize(self, text: str) -> List[str]:
        """分词"""
        if not text:
            return []

        # 简单分词：字符级 + 空格分割
        # 移除标点
        text = re.sub(r'[^\w\s]', ' ', text)

        # 分词
        tokens = []

        # 空格分割（英文/数字）
        words = text.split()
        tokens.extend(words)

        # 字符级（中文）
        chars = [c for c in text if c.strip() and len(c.encode('utf-8')) > 1]
        tokens.extend(chars[:100])  # 限制长度

        return tokens

    def _build_index(self):
        """构建索引"""
        # 加载文档
        docs = self.db.get_documents()

        for doc in docs:
            doc_id = doc.get(self.config.id_field)
            content = str(doc.get(self.config.content_field, ""))
            title = str(doc.get(self.config.title_field, ""))

            text = title + " " + content
            self.documents.append(text)
            self.doc_ids.append(doc_id)

        # 分词
        tokenized_docs = []
        for doc in self.documents:
            tokens = self._tokenize(doc)
            tokenized_docs.append(tokens)
            self.vocab.update(tokens)

        # 计算 IDF
        doc_count = len(self.documents)
        word_doc_count = defaultdict(int)

        for tokens in tokenized_docs:
            unique_tokens = set(tokens)
            for token in unique_tokens:
                word_doc_count[token] += 1

        for word, count in word_doc_count.items():
            self.idf[word] = math.log(doc_count / (count + 1))

        # 计算文档向量
        for tokens in tokenized_docs:
            vector = self._compute_tfidf(tokens)
            self.doc_vectors.append(vector)

    def _compute_tfidf(self, tokens: List[str]) -> Dict[str, float]:
        """计算 TF-IDF"""
        tf = Counter(tokens)
        total_words = len(tokens)

        vector = {}
        for word, count in tf.items():
            tf_value = count / total_words if total_words > 0 else 0
            idf_value = self.idf.get(word, 0)
            vector[word] = tf_value * idf_value

        return vector

    def _cosine_similarity(self, vec1: Dict[str, float], vec2: Dict[str, float]) -> float:
        """余弦相似度"""
        common_words = set(vec1.keys()) & set(vec2.keys())
        dot_product = sum(vec1[word] * vec2[word] for word in common_words)

        norm1 = math.sqrt(sum(v ** 2 for v in vec1.values()))
        norm2 = math.sqrt(sum(v ** 2 for v in vec2.values()))

        if norm1 == 0 or norm2 == 0:
            return 0.0

        return dot_product / (norm1 * norm2)

    def search(self, query: str, top_k: int = None) -> List[Tuple[Any, float]]:
        """搜索"""
        if top_k is None:
            top_k = self.config.top_k

        # 查询向量化
        query_tokens = self._tokenize(query)
        query_vector = self._compute_tfidf(query_tokens)

        # 计算相似度
        similarities = []
        for i, doc_vector in enumerate(self.doc_vectors):
            similarity = self._cosine_similarity(query_vector, doc_vector)
            similarities.append((self.doc_ids[i], similarity))

        # 排序
        similarities.sort(key=lambda x: x[1], reverse=True)
        return similarities[:top_k]


class GraphRetriever:
    """图检索器"""

    def __init__(self, db_adapter, config):
        self.db = db_adapter
        self.config = config
        self.graph = None

        if self.config.enable_graph:
            self._build_graph()

    def _build_graph(self):
        """构建图"""
        # 加载所有文档
        docs = self.db.get_documents()

        # 构建邻接表
        self.graph = {}
        for doc in docs:
            doc_id = doc.get(self.config.id_field)
            relations = self.db.get_relations(doc_id)

            self.graph[doc_id] = []
            for rel in relations:
                target_id = rel.get('target_concept_id') or rel.get('target_id')
                rel_type = rel.get('relation_type', 'related')

                if not self.config.relation_types or rel_type in self.config.relation_types:
                    self.graph[doc_id].append((target_id, rel_type))

    def multi_hop_search(self, start_id: Any, max_hops: int = None) -> List[Tuple[Any, int]]:
        """多跳检索"""
        if not self.config.enable_graph or not self.graph:
            return [(start_id, 0)]

        if max_hops is None:
            max_hops = self.config.max_hops

        results = []
        visited = set()
        queue = deque([(start_id, 0)])

        while queue:
            current_id, distance = queue.popleft()

            if current_id in visited or distance > max_hops:
                continue

            visited.add(current_id)
            results.append((current_id, distance))

            # 遍历邻居
            if current_id in self.graph:
                for neighbor_id, _ in self.graph[current_id]:
                    if neighbor_id not in visited:
                        queue.append((neighbor_id, distance + 1))

        return results

    def find_path(self, start_id: Any, end_id: Any, max_depth: int = 5) -> Optional[List[Any]]:
        """查找路径"""
        if not self.config.enable_graph or not self.graph:
            return None

        queue = deque([(start_id, [start_id])])
        visited = set()

        while queue:
            current_id, path = queue.popleft()

            if len(path) > max_depth:
                continue

            if current_id == end_id:
                return path

            if current_id in visited:
                continue

            visited.add(current_id)

            if current_id in self.graph:
                for neighbor_id, _ in self.graph[current_id]:
                    if neighbor_id not in visited:
                        queue.append((neighbor_id, path + [neighbor_id]))

        return None


class HybridRetriever:
    """混合检索器"""

    def __init__(self, db_adapter, config):
        self.db = db_adapter
        self.config = config
        self.vector_retriever = VectorRetriever(db_adapter, config)
        self.graph_retriever = GraphRetriever(db_adapter, config) if config.enable_graph else None

    def search(self, query: str, top_k: int = None, expand_graph: bool = True) -> List[Dict]:
        """混合检索"""
        if top_k is None:
            top_k = self.config.top_k

        # 1. 向量检索
        vector_results = self.vector_retriever.search(query, top_k * 2)

        # 2. 图扩展
        expanded_ids = set()
        if expand_graph and self.graph_retriever:
            for doc_id, score in vector_results[:5]:
                graph_results = self.graph_retriever.multi_hop_search(doc_id)
                for expanded_id, distance in graph_results:
                    expanded_ids.add(expanded_id)

        # 3. 融合结果
        final_results = []
        seen_ids = set()

        # 优先返回向量检索结果
        for doc_id, score in vector_results:
            if doc_id not in seen_ids:
                doc = self.db.get_document_by_id(doc_id)
                if doc:
                    doc['_score'] = score
                    doc['_source'] = 'vector'
                    final_results.append(doc)
                    seen_ids.add(doc_id)

        # 添加图扩展结果
        for doc_id in expanded_ids:
            if doc_id not in seen_ids and len(final_results) < top_k:
                doc = self.db.get_document_by_id(doc_id)
                if doc:
                    doc['_score'] = 0.5
                    doc['_source'] = 'graph'
                    final_results.append(doc)
                    seen_ids.add(doc_id)

        return final_results[:top_k]


def create_retriever(db_adapter, config):
    """工厂方法：创建检索器"""
    strategy = config.retrieval_strategy

    if strategy == "vector":
        return VectorRetriever(db_adapter, config)
    elif strategy == "graph":
        return GraphRetriever(db_adapter, config)
    elif strategy == "hybrid":
        return HybridRetriever(db_adapter, config)
    else:
        raise ValueError(f"Unknown retrieval strategy: {strategy}")
