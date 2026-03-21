"""
GraphRAG 完整实现 - 检索增强生成
结合图检索、向量检索和 LLM 生成
"""

from typing import List, Dict, Optional
from graph_rag import GraphRAG
from vector_retriever import HybridRetriever
from concept_database import ConceptDatabase


class GraphRAGGenerator:
    """
    GraphRAG 生成器

    工作流程：
    1. 用户提问
    2. 混合检索（向量 + 图）找到相关概念
    3. 提取概念的前置知识链
    4. 构建上下文
    5. 调用 LLM 生成回答
    """

    def __init__(self, db_path: str = "math_concepts.db"):
        self.db = ConceptDatabase(db_path)
        self.graph_rag = GraphRAG(db_path)
        self.retriever = HybridRetriever(db_path)

    def retrieve_context(
        self,
        query: str,
        top_k: int = 5,
        include_prerequisites: bool = True
    ) -> Dict:
        """
        检索相关上下文

        Args:
            query: 用户查询
            top_k: 返回概念数
            include_prerequisites: 是否包含前置知识

        Returns:
            上下文字典
        """
        # 1. 混合检索
        results = self.retriever.search(query, top_k=top_k, expand_graph=True)

        # 2. 提取前置知识
        context = {
            'query': query,
            'main_concepts': [],
            'prerequisites': [],
            'related_concepts': []
        }

        for result in results:
            concept_info = {
                'id': result['id'],
                'name': result['name'],
                'type': result['type'],
                'chapter': result['chapter'],
                'description': result['description'],
                'score': result['score']
            }

            context['main_concepts'].append(concept_info)

            # 获取前置知识
            if include_prerequisites:
                prereqs = self.db.get_prerequisites(result['name'])
                for prereq in prereqs[:3]:  # 只取前3个
                    context['prerequisites'].append({
                        'name': prereq['name'],
                        'chapter': prereq['chapter']
                    })

        return context

    def generate_answer(
        self,
        query: str,
        context: Optional[Dict] = None,
        llm_client: Optional[any] = None
    ) -> Dict:
        """
        生成回答

        Args:
            query: 用户查询
            context: 检索到的上下文（如果为None则自动检索）
            llm_client: LLM 客户端（可选）

        Returns:
            生成结果
        """
        # 1. 检索上下文
        if context is None:
            context = self.retrieve_context(query)

        # 2. 构建提示词
        prompt = self._build_prompt(query, context)

        # 3. 生成回答
        if llm_client:
            answer = llm_client.generate(prompt)
        else:
            # 如果没有 LLM，返回检索结果
            answer = self._generate_fallback_answer(context)

        return {
            'query': query,
            'answer': answer,
            'context': context,
            'prompt': prompt
        }

    def _build_prompt(self, query: str, context: Dict) -> str:
        """构建 LLM 提示词"""
        prompt = f"""你是一个数学概念解释专家。请基于以下知识库内容回答用户的问题。

用户问题：{query}

相关概念：
"""

        # 添加主要概念
        for i, concept in enumerate(context['main_concepts'][:3], 1):
            prompt += f"\n{i}. {concept['name']}"
            if concept['description']:
                prompt += f"\n   描述：{concept['description'][:100]}..."
            prompt += f"\n   章节：{concept['chapter']}"

        # 添加前置知识
        if context['prerequisites']:
            prompt += "\n\n前置知识："
            for prereq in context['prerequisites'][:5]:
                prompt += f"\n- {prereq['name']} ({prereq['chapter']})"

        prompt += """

请基于以上信息，用清晰易懂的语言回答用户的问题。要求：
1. 从基础概念开始解释
2. 说明概念之间的关系
3. 给出具体例子（如果适用）
4. 保持数学严谨性

回答："""

        return prompt

    def _generate_fallback_answer(self, context: Dict) -> str:
        """生成备用回答（无 LLM 时）"""
        answer = f"根据知识库检索，与您的问题相关的概念有：\n\n"

        for i, concept in enumerate(context['main_concepts'][:3], 1):
            answer += f"{i}. **{concept['name']}**\n"
            answer += f"   - 章节：{concept['chapter']}\n"
            if concept['description']:
                answer += f"   - 描述：{concept['description'][:150]}...\n"
            answer += "\n"

        if context['prerequisites']:
            answer += "学习这些概念前，建议先掌握：\n"
            for prereq in context['prerequisites'][:5]:
                answer += f"- {prereq['name']} ({prereq['chapter']})\n"

        return answer

    def generate_learning_path(self, target_concept: str) -> Dict:
        """
        生成学习路径

        Args:
            target_concept: 目标概念

        Returns:
            学习路径信息
        """
        # 1. 查找概念
        concept = self.db.get_concept(target_concept)
        if not concept:
            # 尝试搜索
            results = self.retriever.search(target_concept, top_k=1)
            if not results:
                return {'error': f'未找到概念: {target_concept}'}
            concept = results[0]
            target_concept = concept['name']

        # 2. 获取学习路径
        learning_path = self.graph_rag.recommend_learning_path(target_concept)

        # 3. 获取详细信息
        path_details = []
        for concept_name in learning_path[:10]:  # 限制长度
            concept_info = self.db.get_concept(concept_name)
            if concept_info:
                path_details.append({
                    'name': concept_info['name'],
                    'chapter': concept_info['chapter'],
                    'type': concept_info['type']
                })

        return {
            'target': target_concept,
            'path': learning_path,
            'path_details': path_details,
            'total_steps': len(learning_path)
        }

    def explain_concept(self, concept_name: str) -> Dict:
        """
        解释概念

        Args:
            concept_name: 概念名称

        Returns:
            概念解释
        """
        # 1. 获取概念信息
        concept = self.db.get_concept(concept_name)
        if not concept:
            return {'error': f'未找到概念: {concept_name}'}

        # 2. 获取前置知识
        prerequisites = self.db.get_prerequisites(concept_name)

        # 3. 获取派生概念
        derived = self.db.get_derived_concepts(concept_name)

        # 4. 获取相关概念（通过图检索）
        related_results = self.graph_rag.multi_hop_search(
            concept_name,
            max_hops=1
        )

        related = [
            {'name': r.node.name, 'chapter': r.node.chapter}
            for r in related_results[1:6]  # 跳过自己
        ]

        return {
            'concept': {
                'name': concept['name'],
                'type': concept['type'],
                'chapter': concept['chapter'],
                'description': concept['description']
            },
            'prerequisites': [
                {'name': p['name'], 'chapter': p['chapter']}
                for p in prerequisites
            ],
            'derived': [
                {'name': d['name'], 'chapter': d['chapter']}
                for d in derived
            ],
            'related': related
        }


if __name__ == "__main__":
    print("=" * 70)
    print("GraphRAG 完整测试")
    print("=" * 70)

    rag = GraphRAGGenerator()

    # 测试 1: 问答
    print("\n=== 测试 1: 问答生成 ===")
    query = "什么是偏导数？如何计算？"
    result = rag.generate_answer(query)

    print(f"问题: {result['query']}")
    print(f"\n回答:\n{result['answer']}")

    # 测试 2: 学习路径
    print("\n=== 测试 2: 学习路径生成 ===")
    path_result = rag.generate_learning_path("偏导数")

    print(f"目标: {path_result['target']}")
    print(f"总步骤: {path_result['total_steps']}")
    print("\n推荐学习路径:")
    for i, step in enumerate(path_result['path_details'][:5], 1):
        print(f"{i}. {step['name'][:40]}... ({step['chapter']})")

    # 测试 3: 概念解释
    print("\n=== 测试 3: 概念解释 ===")
    explain_result = rag.explain_concept("函数极限")

    if 'error' not in explain_result:
        print(f"概念: {explain_result['concept']['name']}")
        print(f"章节: {explain_result['concept']['chapter']}")

        if explain_result['prerequisites']:
            print("\n前置知识:")
            for prereq in explain_result['prerequisites'][:3]:
                print(f"  - {prereq['name'][:40]}...")

        if explain_result['related']:
            print("\n相关概念:")
            for rel in explain_result['related'][:3]:
                print(f"  - {rel['name'][:40]}...")

    print("\n" + "=" * 70)
    print("✅ GraphRAG 测试完成")
    print("=" * 70)
