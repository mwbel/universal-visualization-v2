"""
数学文档智能可视化服务
基于Gemini分析结果的深度学习，生成专业的数学概念可视化
"""

import os
import json
import asyncio
from typing import Dict, List, Optional, Any
from pathlib import Path
from datetime import datetime
import re

from agents.mathematics_analyzer import (
    MathematicsAnalyzer,
    math_analyzer,
    MathematicalAnalysis,
    VisualizationType
)
from template_engine import TemplateEngine

class MathVisualizationService:
    """数学可视化服务"""

    def __init__(self):
        self.math_analyzer = math_analyzer
        self.template_engine = TemplateEngine()
        self.output_dir = Path("generated_visualizations")
        self.output_dir.mkdir(exist_ok=True)

    async def generate_comprehensive_visualization(self,
                                                  file_id: str,
                                                  file_content: str,
                                                  metadata: Dict) -> Dict:
        """生成综合数学可视化"""
        print(f"🎨 开始为文件 {file_id} 生成数学可视化...")

        try:
            # 1. 深度数学分析
            math_analysis = self.math_analyzer.analyze_document(file_content)

            # 2. 生成可视化内容
            viz_content = await self._create_visualization_content(
                math_analysis, file_id, metadata
            )

            # 3. 生成HTML文件
            html_file = await self._generate_html_visualization(
                viz_content, file_id
            )

            # 4. 生成交互式组件
            interactive_components = await self._create_interactive_components(
                math_analysis, file_id
            )

            return {
                "success": True,
                "file_id": file_id,
                "math_analysis": self._serialize_analysis(math_analysis),
                "visualization_content": viz_content,
                "html_file": html_file,
                "interactive_components": interactive_components,
                "download_url": f"/static/visualizations/{html_file}",
                "generation_time": datetime.now().isoformat()
            }

        except Exception as e:
            print(f"❌ 数学可视化生成失败: {str(e)}")
            return {
                "success": False,
                "error": str(e),
                "file_id": file_id
            }

    async def _create_visualization_content(self,
                                           analysis: MathematicalAnalysis,
                                           file_id: str,
                                           metadata: Dict) -> Dict:
        """创建可视化内容"""
        content = {
            "title": f"{analysis.document_type}深度可视化分析",
            "file_id": file_id,
            "metadata": metadata,
            "analysis_summary": self._create_analysis_summary(analysis),
            "concepts": [],
            "formulas": [],
            "geometric_constructions": [],
            "proof_flows": [],
            "interactive_demos": []
        }

        # 处理主要概念
        for concept in analysis.main_topics:
            concept_viz = await self._create_concept_visualization(concept)
            content["concepts"].append(concept_viz)

        # 处理公式
        for formula in analysis.key_formulas:
            formula_viz = await self._create_formula_visualization(formula)
            content["formulas"].append(formula_viz)

        # 处理几何概念
        for geo_concept in analysis.geometric_concepts:
            geo_viz = await self._create_geometric_visualization(geo_concept)
            content["geometric_constructions"].append(geo_viz)

        # 处理定理和证明
        for i, theorem in enumerate(analysis.theorems):
            proof_viz = await self._create_proof_visualization(theorem, i+1)
            content["proof_flows"].append(proof_viz)

        # 创建交互式演示
        demos = await self._create_math_demos(analysis)
        content["interactive_demos"] = demos

        return content

    def _create_analysis_summary(self, analysis: MathematicalAnalysis) -> Dict:
        """创建分析摘要"""
        return {
            "document_type": analysis.document_type,
            "difficulty_level": analysis.difficulty_assessment,
            "main_topics_count": len(analysis.main_topics),
            "formulas_count": len(analysis.key_formulas),
            "theorems_count": len(analysis.theorems),
            "applications_count": len(analysis.applications),
            "suggested_visualizations": [viz_type.value for viz_type in analysis.suggested_visualizations],
            "learning_objectives": analysis.learning_objectives
        }

    async def _create_concept_visualization(self, concept) -> Dict:
        """为单个数学概念创建可视化"""
        viz_type = self._determine_concept_viz_type(concept.type.value)

        return {
            "concept_name": concept.name,
            "concept_type": concept.type.value,
            "definition": concept.definition,
            "difficulty_level": concept.difficulty_level,
            "visualization_type": viz_type,
            "visual_elements": self._get_concept_visual_elements(concept),
            "interactive_features": self._get_concept_interactive_features(concept),
            "related_concepts": concept.related_concepts or [],
            "examples": concept.examples or [],
            "applications": concept.applications or []
        }

    async def _create_formula_visualization(self, formula) -> Dict:
        """为公式创建可视化"""
        return {
            "latex": formula.latex,
            "description": formula.description,
            "variables": formula.variables or {},
            "visualization_type": "formula_derivation",
            "interactive_elements": ["parameter_slider", "plot_function"],
            "derivation_steps": self._generate_formula_derivation(formula),
            "graph_representation": self._create_formula_graph(formula)
        }

    async def _create_geometric_visualization(self, geo_concept) -> Dict:
        """为几何概念创建可视化"""
        return {
            "concept_name": geo_concept.name,
            "definition": geo_concept.definition,
            "properties": geo_concept.properties or [],
            "construction_method": geo_concept.construction_method,
            "visualization_type": "geometric_construction",
            "3d_model_available": self._check_3d_support(geo_concept.name),
            "interactive_features": ["rotate", "zoom", "measure", "animate"],
            "related_theorems": geo_concept.related_theorems or []
        }

    async def _create_proof_visualization(self, theorem: Dict, step_number: int) -> Dict:
        """为证明创建可视化流程"""
        return {
            "step_number": step_number,
            "theorem_statement": theorem.get("statement", ""),
            "proof_type": theorem.get("type", "standard"),
            "visualization_type": "proof_flow",
            "steps": self._parse_proof_steps(theorem),
            "logical_structure": self._analyze_proof_logic(theorem),
            "key_insights": self._extract_proof_insights(theorem)
        }

    async def _create_math_demos(self, analysis: MathematicalAnalysis) -> List[Dict]:
        """创建数学交互式演示"""
        demos = []

        # 基于主要概念创建演示
        for concept in analysis.main_topics[:3]:  # 限制数量
            demo = {
                "title": f"{concept.name}交互式演示",
                "description": f"探索{concept.name}的数学原理和可视化表现",
                "type": "interactive_demo",
                "parameters": self._get_demo_parameters(concept),
                "visualizations": ["2d_plot", "3d_model", "animation"],
                "educational_goals": self._get_educational_goals(concept)
            }
            demos.append(demo)

        return demos

    async def _generate_html_visualization(self, content: Dict, file_id: str) -> str:
        """生成HTML可视化文件"""
        template_name = "mathematics_concept_visualization.html"
        template_path = Path("templates") / template_name

        # 使用模板引擎渲染
        html_content = await self.template_engine.render_template(
            template_path, content
        )

        # 保存文件
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"math_viz_{file_id}_{timestamp}.html"
        output_path = self.output_dir / filename

        async with asyncio.create_task(
            asyncio.to_thread(output_path.write_text, html_content, encoding='utf-8')
        ):
            pass

        print(f"✅ 数学可视化HTML已生成: {filename}")
        return filename

    async def _create_interactive_components(self, analysis: MathematicalAnalysis, file_id: str) -> Dict:
        """创建交互式组件"""
        components = {
            "concept_explorer": {
                "type": "interactive_graph",
                "data": self._build_concept_graph(analysis),
                "features": ["zoom", "pan", "hover_info", "click_expand"]
            },
            "formula_calculator": {
                "type": "parameter_tool",
                "formulas": [f.latex for f in analysis.key_formulas],
                "variables": self._extract_all_variables(analysis.key_formulas)
            },
            "geometry_builder": {
                "type": "construction_tool",
                "concepts": [c.name for c in analysis.geometric_concepts],
                "tools": ["compass", "ruler", "protractor"]
            }
        }

        return components

    def _determine_concept_viz_type(self, concept_type: str) -> str:
        """确定概念可视化类型"""
        viz_mapping = {
            "geometry": "geometric_construction",
            "calculus": "calculus_graph",
            "algebra": "algebraic_diagram",
            "topology": "topological_visualization",
            "analysis": "function_plot",
            "statistics": "statistical_chart",
            "applied": "application_diagram"
        }
        return viz_mapping.get(concept_type, "concept_diagram")

    def _get_concept_visual_elements(self, concept) -> List[str]:
        """获取概念的可视化元素"""
        elements = ["definition_box", "examples"]

        if concept.type.value == "geometry":
            elements.extend(["shapes", "measurements", "coordinates"])
        elif concept.type.value == "calculus":
            elements.extend(["function_plot", "derivatives", "integrals"])
        elif concept.type.value == "algebra":
            elements.extend(["equations", "graphs", "matrices"])

        return elements

    def _get_concept_interactive_features(self, concept) -> List[str]:
        """获取概念的交互功能"""
        features = ["highlight", "tooltip"]

        if concept.type.value == "geometry":
            features.extend(["rotate_3d", "measure_distance", "animate_construction"])
        elif concept.type.value == "calculus":
            features.extend(["adjust_parameters", "show_derivative", "area_animation"])

        return features

    def _generate_formula_derivation(self, formula) -> List[str]:
        """生成公式推导步骤"""
        # 简化的推导步骤生成
        steps = [
            "步骤1: 识别公式中的变量和常数",
            "步骤2: 分析公式的数学结构",
            "步骤3: 理解公式的几何或物理意义"
        ]
        return steps

    def _create_formula_graph(self, formula) -> Dict:
        """创建公式图形表示"""
        return {
            "type": "mathematical_function",
            "plot_type": "2d_cartesian",
            "domain": "auto_detect",
            "range": "auto_detect",
            "features": ["grid", "axes_labels", "interactive_points"]
        }

    def _parse_proof_steps(self, theorem: Dict) -> List[Dict]:
        """解析证明步骤"""
        content = theorem.get("content", "")

        # 简单的步骤解析
        steps = []
        sentences = re.split(r'[。；;]', content)

        for i, sentence in enumerate(sentences):
            if sentence.strip():
                steps.append({
                    "step_number": i + 1,
                    "statement": sentence.strip(),
                    "type": "logical_step"
                })

        return steps

    def _analyze_proof_logic(self, theorem: Dict) -> Dict:
        """分析证明的逻辑结构"""
        return {
            "proof_method": "deductive",
            "key_assumptions": ["基础公理", "已知条件"],
            "logical_flow": "linear",
            "conclusion_strength": "strong"
        }

    def _extract_proof_insights(self, theorem: Dict) -> List[str]:
        """提取证明的关键洞见"""
        return [
            "这个证明展示了数学推理的美妙",
            "关键在于理解基本概念之间的关系",
            "证明过程体现了逻辑的严密性"
        ]

    def _serialize_analysis(self, analysis: MathematicalAnalysis) -> Dict:
        """序列化分析结果为字典"""
        return {
            "document_type": analysis.document_type,
            "main_topics": [
                {
                    "name": c.name,
                    "type": c.type.value,
                    "definition": c.definition,
                    "difficulty_level": c.difficulty_level
                }
                for c in analysis.main_topics
            ],
            "difficulty_assessment": analysis.difficulty_assessment,
            "suggested_visualizations": [v.value for v in analysis.suggested_visualizations],
            "learning_objectives": analysis.learning_objectives
        }

# 全局服务实例
math_visualization_service = MathVisualizationService()