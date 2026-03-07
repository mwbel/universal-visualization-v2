"""
RAG Service - 检索增强生成服务（轻量级版本）
使用 TF-IDF 实现文本相似度搜索，不依赖外部向量数据库
"""
import os
import re
import json
import math
from pathlib import Path
from typing import List, Dict, Optional, Any
from dataclasses import dataclass
from collections import defaultdict
import hashlib


@dataclass
class SearchResult:
    """检索结果"""
    content: str
    source: str
    topic: str
    score: float
    metadata: Dict[str, Any]


class SimpleTokenizer:
    """简单的中英文分词器"""
    
    # 中文停用词
    STOPWORDS = {'的', '了', '是', '在', '我', '有', '和', '就', '不', '人', '都', 
                 '一', '一个', '上', '也', '很', '到', '说', '要', '去', '你', '会',
                 '着', '没有', '看', '好', '自己', '这', '那', '它', '他', '她'}
    
    @staticmethod
    def tokenize(text: str) -> List[str]:
        """分词"""
        # 移除标点和特殊字符
        text = re.sub(r'[^\w\s\u4e00-\u9fff]', ' ', text)
        # 分割英文单词
        words = re.findall(r'[a-zA-Z]+', text.lower())
        # 分割中文（按字符）
        chinese = re.findall(r'[\u4e00-\u9fff]+', text)
        # 中文按 2-gram 分词
        for phrase in chinese:
            for i in range(len(phrase) - 1):
                words.append(phrase[i:i+2])
            if len(phrase) >= 1:
                words.append(phrase)  # 也保留完整词
        # 移除停用词
        words = [w for w in words if w not in SimpleTokenizer.STOPWORDS and len(w) > 1]
        return words


class TFIDFIndex:
    """TF-IDF 索引"""
    
    def __init__(self):
        self.documents: List[Dict[str, Any]] = []
        self.vocab: Dict[str, int] = {}
        self.idf: Dict[str, float] = {}
        self.doc_tf: List[Dict[str, float]] = []
        self.doc_norms: List[float] = []
    
    def add_documents(self, docs: List[Dict[str, Any]]):
        """添加文档并构建索引"""
        self.documents.extend(docs)
        self._build_index()
    
    def _build_index(self):
        """构建 TF-IDF 索引"""
        # 计算词频
        doc_freqs = defaultdict(int)
        self.doc_tf = []
        
        for doc in self.documents:
            tokens = SimpleTokenizer.tokenize(doc['content'])
            tf = defaultdict(int)
            for token in tokens:
                tf[token] += 1
                if token not in self.vocab:
                    self.vocab[token] = len(self.vocab)
            
            # 归一化 TF
            max_tf = max(tf.values()) if tf else 1
            tf = {k: v / max_tf for k, v in tf.items()}
            self.doc_tf.append(tf)
            
            # 更新文档频率
            for token in set(tokens):
                doc_freqs[token] += 1
        
        # 计算 IDF
        n_docs = len(self.documents)
        for token, freq in doc_freqs.items():
            self.idf[token] = math.log(n_docs / (1 + freq))
        
        # 计算文档向量范数
        self.doc_norms = []
        for tf in self.doc_tf:
            norm = math.sqrt(sum((v * self.idf.get(k, 0)) ** 2 for k, v in tf.items()))
            self.doc_norms.append(norm if norm > 0 else 1)
    
    def search(self, query: str, top_k: int = 5) -> List[tuple]:
        """搜索相似文档"""
        if not self.documents:
            return []
        
        # 计算查询向量
        query_tokens = SimpleTokenizer.tokenize(query)
        query_tf = defaultdict(int)
        for token in query_tokens:
            query_tf[token] += 1
        
        max_tf = max(query_tf.values()) if query_tf else 1
        query_tf = {k: v / max_tf for k, v in query_tf.items()}
        
        # 计算查询范数
        query_norm = math.sqrt(sum((v * self.idf.get(k, 0)) ** 2 for k, v in query_tf.items()))
        if query_norm == 0:
            query_norm = 1
        
        # 计算余弦相似度
        scores = []
        for i, (doc_tf, doc_norm) in enumerate(zip(self.doc_tf, self.doc_norms)):
            dot_product = 0
            for token, tf in query_tf.items():
                if token in doc_tf:
                    dot_product += tf * doc_tf[token] * (self.idf.get(token, 0) ** 2)
            
            similarity = dot_product / (query_norm * doc_norm)
            scores.append((similarity, i))
        
        # 排序返回 top_k
        scores.sort(reverse=True)
        return scores[:top_k]


class RAGService:
    """RAG 检索增强生成服务（轻量级版本）"""
    
    def __init__(self, data_dir: Optional[str] = None):
        """
        初始化 RAG 服务
        
        Args:
            data_dir: 数据目录，默认为项目 data 目录
        """
        self.data_dir = data_dir or self._get_default_data_dir()
        self.index = TFIDFIndex()
        self.documents: List[Dict[str, Any]] = []
        self._initialized = False
        
        # 尝试加载已有索引
        self._load_index()
    
    def _get_default_data_dir(self) -> str:
        """获取默认数据目录"""
        base_dir = Path(__file__).parent.parent.parent
        return str(base_dir / "data")
    
    def _get_index_path(self) -> Path:
        """获取索引文件路径"""
        return Path(self.data_dir) / "rag_index.json"
    
    def _load_index(self):
        """加载已有索引"""
        index_path = self._get_index_path()
        if index_path.exists():
            try:
                with open(index_path, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    self.documents = data.get('documents', [])
                    if self.documents:
                        self.index.add_documents(self.documents)
                        self._initialized = True
                        print(f"RAG 服务加载成功，文档数量: {len(self.documents)}")
            except Exception as e:
                print(f"加载索引失败: {e}")
    
    def _save_index(self):
        """保存索引到文件"""
        try:
            os.makedirs(self.data_dir, exist_ok=True)
            index_path = self._get_index_path()
            with open(index_path, 'w', encoding='utf-8') as f:
                json.dump({'documents': self.documents}, f, ensure_ascii=False, indent=2)
        except Exception as e:
            print(f"保存索引失败: {e}")
    
    @property
    def is_ready(self) -> bool:
        """检查服务是否就绪"""
        return self._initialized and len(self.documents) > 0
    
    @property
    def collection(self):
        """兼容旧接口"""
        class FakeCollection:
            def __init__(self, docs):
                self._docs = docs
            def count(self):
                return len(self._docs)
        return FakeCollection(self.documents)
    
    def search(self, query: str, top_k: int = 5, topic_filter: Optional[str] = None) -> List[SearchResult]:
        """
        语义搜索知识库
        
        Args:
            query: 搜索查询
            top_k: 返回结果数量
            topic_filter: 可选的主题过滤器
            
        Returns:
            检索结果列表
        """
        if not self.is_ready:
            return []
        
        try:
            results = self.index.search(query, top_k=top_k * 2)  # 多获取一些用于过滤
            
            search_results = []
            for score, idx in results:
                doc = self.documents[idx]
                
                # 主题过滤
                if topic_filter and doc.get('metadata', {}).get('topic') != topic_filter:
                    continue
                
                if score > 0.01:  # 最小相似度阈值
                    search_results.append(SearchResult(
                        content=doc['content'],
                        source=doc.get('metadata', {}).get('source', '未知'),
                        topic=doc.get('metadata', {}).get('topic', '未知'),
                        score=min(score * 2, 1.0),  # 归一化分数
                        metadata=doc.get('metadata', {})
                    ))
                
                if len(search_results) >= top_k:
                    break
            
            return search_results
            
        except Exception as e:
            print(f"RAG 搜索失败: {e}")
            return []
    
    def get_context_for_query(self, query: str, max_context_length: int = 2000) -> str:
        """
        根据查询获取增强上下文
        
        Args:
            query: 用户查询
            max_context_length: 最大上下文长度
            
        Returns:
            用于增强 AI 回答的上下文字符串
        """
        results = self.search(query, top_k=3)
        
        if not results:
            return ""
        
        context_parts = []
        total_length = 0
        
        for result in results:
            part = f"【{result.topic}】\n{result.content}\n"
            
            if total_length + len(part) > max_context_length:
                break
            
            context_parts.append(part)
            total_length += len(part)
        
        if context_parts:
            return "以下是相关知识点参考：\n\n" + "\n---\n".join(context_parts)
        
        return ""
    
    def get_topics(self) -> List[Dict[str, Any]]:
        """
        获取所有知识主题列表
        
        Returns:
            主题列表，包含名称和文档数量
        """
        if not self.is_ready:
            return self._get_default_topics()
        
        try:
            topic_counts = {}
            for doc in self.documents:
                topic = doc.get('metadata', {}).get('topic', '其他')
                topic_counts[topic] = topic_counts.get(topic, 0) + 1
            
            topics = [
                {"name": name, "count": count, "icon": self._get_topic_icon(name)}
                for name, count in sorted(topic_counts.items())
            ]
            
            return topics if topics else self._get_default_topics()
            
        except Exception as e:
            print(f"获取主题列表失败: {e}")
            return self._get_default_topics()
    
    def _get_default_topics(self) -> List[Dict[str, Any]]:
        """获取默认主题列表"""
        topics = [
            {"name": "三角函数", "count": 0, "icon": "triangle"},
            {"name": "三角比", "count": 0, "icon": "ruler"},
            {"name": "向量", "count": 0, "icon": "move"},
            {"name": "数列", "count": 0, "icon": "list-ordered"},
            {"name": "函数", "count": 0, "icon": "trending-up"},
            {"name": "不等式", "count": 0, "icon": "git-compare"},
            {"name": "对数", "count": 0, "icon": "superscript"},
            {"name": "指数", "count": 0, "icon": "zap"},
            {"name": "幂函数", "count": 0, "icon": "activity"},
            {"name": "复数", "count": 0, "icon": "infinity"},
            {"name": "反函数", "count": 0, "icon": "repeat"},
            {"name": "分式函数", "count": 0, "icon": "divide"},
            {"name": "二次函数", "count": 0, "icon": "maximize-2"},
        ]
        return topics
    
    def _get_topic_icon(self, topic_name: str) -> str:
        """根据主题名称获取图标"""
        icon_map = {
            "三角函数": "triangle",
            "三角比": "ruler",
            "向量": "move",
            "数列": "list-ordered",
            "函数": "trending-up",
            "不等式": "git-compare",
            "对数": "superscript",
            "指数": "zap",
            "幂函数": "activity",
            "复数": "infinity",
            "反函数": "repeat",
            "分式函数": "divide",
            "二次函数": "maximize-2",
        }
        
        for key, icon in icon_map.items():
            if key in topic_name:
                return icon
        
        return "book-open"
    
    def add_documents(self, documents: List[Dict[str, Any]]) -> bool:
        """
        添加文档到知识库
        
        Args:
            documents: 文档列表
            
        Returns:
            是否成功
        """
        try:
            self.documents.extend(documents)
            self.index = TFIDFIndex()
            self.index.add_documents(self.documents)
            self._initialized = True
            self._save_index()
            print(f"成功添加 {len(documents)} 个文档")
            return True
        except Exception as e:
            print(f"添加文档失败: {e}")
            return False
    
    def clear_collection(self) -> bool:
        """清空知识库"""
        try:
            self.documents = []
            self.index = TFIDFIndex()
            self._initialized = False
            index_path = self._get_index_path()
            if index_path.exists():
                os.remove(index_path)
            print("知识库已清空")
            return True
        except Exception as e:
            print(f"清空知识库失败: {e}")
            return False


# 全局单例实例
_rag_service: Optional[RAGService] = None

def get_rag_service() -> RAGService:
    """获取 RAG 服务单例"""
    global _rag_service
    if _rag_service is None:
        _rag_service = RAGService()
    return _rag_service
