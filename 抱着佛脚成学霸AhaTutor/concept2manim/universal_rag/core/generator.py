"""
RAG 生成器 - 检索增强生成
"""

from typing import List, Dict, Any, Optional
from .database import DatabaseAdapter
from .retriever import create_retriever


class RAGGenerator:
    """RAG 生成器"""

    def __init__(self, db_adapter: DatabaseAdapter, config):
        self.db = db_adapter
        self.config = config
        self.retriever = create_retriever(db_adapter, config)

    def retrieve_context(self, query: str, top_k: int = None) -> Dict:
        """检索上下文"""
        if top_k is None:
            top_k = self.config.top_k

        # 检索文档
        if hasattr(self.retriever, 'search'):
            results = self.retriever.search(query, top_k)
            # 如果返回的是 (doc_id, score) 元组列表，转换为文档列表
            if results and isinstance(results[0], tuple):
                doc_list = []
                for doc_id, score in results:
                    doc = self.db.get_document_by_id(doc_id)
                    if doc:
                        doc['_score'] = score
                        doc_list.append(doc)
                results = doc_list
        else:
            # 图检索器没有 search 方法，使用数据库搜索
            results = self.db.search(query, top_k)

        return {
            'query': query,
            'documents': results,
            'count': len(results)
        }

    def generate_answer(
        self,
        query: str,
        context: Optional[Dict] = None,
        llm_client: Optional[Any] = None
    ) -> Dict:
        """生成回答"""
        # 1. 检索上下文
        if context is None:
            context = self.retrieve_context(query)

        # 2. 构建提示词
        prompt = self._build_prompt(query, context)

        # 3. 生成回答
        if llm_client:
            answer = self._generate_with_llm(prompt, llm_client)
        else:
            answer = self._generate_fallback(context)

        return {
            'query': query,
            'answer': answer,
            'context': context,
            'prompt': prompt
        }

    def _build_prompt(self, query: str, context: Dict) -> str:
        """构建提示词"""
        # 提取文档内容
        docs_text = []
        for i, doc in enumerate(context['documents'][:5], 1):
            title = doc.get(self.config.title_field, "")
            content = doc.get(self.config.content_field, "")

            doc_text = f"{i}. {title}\n"
            if content:
                doc_text += f"   {content[:200]}...\n"

            docs_text.append(doc_text)

        context_text = "\n".join(docs_text)

        # 使用配置的模板
        prompt = self.config.prompt_template.format(
            context=context_text,
            query=query
        )

        return prompt

    def _generate_with_llm(self, prompt: str, llm_client) -> str:
        """使用 LLM 生成"""
        # 调用 LLM
        if hasattr(llm_client, 'generate'):
            return llm_client.generate(prompt)
        elif callable(llm_client):
            return llm_client(prompt)
        else:
            raise ValueError("Invalid LLM client")

    def _generate_fallback(self, context: Dict) -> str:
        """备用生成（无 LLM）"""
        answer = "根据检索结果，找到以下相关内容：\n\n"

        for i, doc in enumerate(context['documents'][:3], 1):
            title = doc.get(self.config.title_field, "未命名")
            content = doc.get(self.config.content_field, "")

            answer += f"{i}. **{title}**\n"
            if content:
                answer += f"   {content[:150]}...\n"
            answer += "\n"

        return answer

    def batch_generate(
        self,
        queries: List[str],
        llm_client: Optional[Any] = None
    ) -> List[Dict]:
        """批量生成"""
        results = []
        for query in queries:
            result = self.generate_answer(query, llm_client=llm_client)
            results.append(result)
        return results

    def explain_document(self, doc_id: Any) -> Dict:
        """解释文档"""
        # 获取文档
        doc = self.db.get_document_by_id(doc_id)
        if not doc:
            return {'error': f'Document not found: {doc_id}'}

        # 获取相关文档
        related = []
        if self.config.enable_graph:
            relations = self.db.get_relations(doc_id)
            for rel in relations[:5]:
                target_id = rel.get('target_concept_id') or rel.get('target_id')
                target_doc = self.db.get_document_by_id(target_id)
                if target_doc:
                    related.append({
                        'id': target_id,
                        'title': target_doc.get(self.config.title_field),
                        'relation': rel.get('relation_type', 'related')
                    })

        return {
            'document': doc,
            'related': related
        }

    def get_learning_path(self, target_id: Any) -> Dict:
        """获取学习路径"""
        if not self.config.enable_graph:
            return {'error': 'Graph retrieval is not enabled'}

        # 使用图检索器
        from .retriever import GraphRetriever
        if not isinstance(self.retriever, GraphRetriever):
            # 创建临时图检索器
            graph_retriever = GraphRetriever(self.db, self.config)
        else:
            graph_retriever = self.retriever

        # 多跳检索
        results = graph_retriever.multi_hop_search(target_id, max_hops=5)

        # 按距离排序（从远到近 = 从基础到高级）
        results.sort(key=lambda x: x[1], reverse=True)

        # 获取文档详情
        path = []
        for doc_id, distance in results:
            doc = self.db.get_document_by_id(doc_id)
            if doc:
                path.append({
                    'id': doc_id,
                    'title': doc.get(self.config.title_field),
                    'distance': distance
                })

        return {
            'target_id': target_id,
            'path': path,
            'total_steps': len(path)
        }


class RAGPipeline:
    """RAG 流水线 - 简化的接口"""

    def __init__(self, config):
        from .database import create_adapter

        self.config = config
        self.db = create_adapter(config)
        self.generator = RAGGenerator(self.db, config)

    def ask(self, query: str, llm_client: Optional[Any] = None) -> str:
        """问答（简化接口）"""
        result = self.generator.generate_answer(query, llm_client=llm_client)
        return result['answer']

    def search(self, query: str, top_k: int = None) -> List[Dict]:
        """搜索（简化接口）"""
        context = self.generator.retrieve_context(query, top_k)
        return context['documents']

    def explain(self, doc_id: Any) -> Dict:
        """解释（简化接口）"""
        return self.generator.explain_document(doc_id)

    def get_path(self, target_id: Any) -> List[Dict]:
        """获取路径（简化接口）"""
        result = self.generator.get_learning_path(target_id)
        return result.get('path', [])

    def close(self):
        """关闭连接"""
        self.db.close()

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.close()
