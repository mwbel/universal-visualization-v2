"""
Manim 生成器 - 完整的动画生成流程

整合知识树、概念分析、代码生成等模块
"""

from typing import Optional, Dict, Any
from ..core.knowledge_tree import KnowledgeTree
from ..core.concept_analyzer import ConceptAnalyzer
from ..core.code_generator import CodeGenerator, GeneratedCode


class BaseGenerator:
    """
    基础生成器 - 完整的 Math2Manim 流程

    流程：
    1. 概念分析
    2. 构建知识树
    3. 生成代码
    4. （可选）渲染动画
    """

    def __init__(self, llm_client: Optional[Any] = None):
        """
        初始化生成器

        Args:
            llm_client: LLM 客户端（可选）
        """
        self.llm_client = llm_client
        self.analyzer = ConceptAnalyzer(llm_client)
        self.tree_builder = KnowledgeTree(llm_client)
        self.code_gen = CodeGenerator(llm_client)

    def generate(
        self,
        concept: str,
        style: str = "educational",
        quality: str = "m",
        build_tree: bool = True
    ) -> Dict[str, Any]:
        """
        生成动画（完整流程）

        Args:
            concept: 概念名称
            style: 风格 (educational/professional/simple)
            quality: 质量 (l/m/h/k)
            build_tree: 是否构建知识树

        Returns:
            包含代码、分析结果、知识树等的字典
        """
        # 1. 概念分析
        analysis = self.analyzer.analyze(concept)

        # 2. 构建知识树（可选）
        knowledge_tree = None
        learning_path = []
        if build_tree:
            knowledge_tree = self.tree_builder.build_tree(concept)
            learning_path = self.tree_builder.get_learning_path()

        # 3. 生成代码
        generated = self.code_gen.generate(
            concept=concept,
            analysis=analysis,
            knowledge_tree=knowledge_tree,
            style=style,
            quality=quality
        )

        # 4. 返回结果
        return {
            "success": True,
            "concept": concept,
            "code": generated.code,
            "scene_name": generated.scene_name,
            "analysis": {
                "type": analysis.type.value,
                "difficulty": analysis.difficulty.value,
                "keywords": analysis.keywords,
                "formulas": analysis.formulas,
                "prerequisites": analysis.prerequisites,
                "visualization_hints": analysis.visualization_hints
            },
            "knowledge_tree": knowledge_tree.to_dict() if knowledge_tree else None,
            "learning_path": learning_path,
            "metadata": {
                "style": style,
                "quality": quality,
                **generated.metadata
            }
        }

    def generate_code_only(
        self,
        concept: str,
        style: str = "educational",
        quality: str = "m"
    ) -> GeneratedCode:
        """
        仅生成代码（快速模式）

        Args:
            concept: 概念名称
            style: 风格
            quality: 质量

        Returns:
            生成的代码
        """
        analysis = self.analyzer.analyze(concept)
        return self.code_gen.generate(
            concept=concept,
            analysis=analysis,
            style=style,
            quality=quality
        )


class ManimGenerator(BaseGenerator):
    """Manim 生成器（别名）"""
    pass
