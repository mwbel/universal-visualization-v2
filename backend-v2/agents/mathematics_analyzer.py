"""
万物可视化 v2.0 - 数学文档分析器
专门针对数学、几何、微积分等学科进行深度分析和可视化生成
"""

import re
import json
from typing import Dict, List, Tuple, Optional, Any
from dataclasses import dataclass, asdict
from enum import Enum
import asyncio
from datetime import datetime

class MathConceptType(Enum):
    """数学概念类型"""
    GEOMETRY = "geometry"  # 几何学
    CALCULUS = "calculus"  # 微积分
    ALGEBRA = "algebra"    # 代数学
    TOPOLOGY = "topology"  # 拓扑学
    ANALYSIS = "analysis"  # 数学分析
    DISCRETE = "discrete"  # 离散数学
    STATISTICS = "statistics"  # 统计学
    APPLIED = "applied"    # 应用数学

class VisualizationType(Enum):
    """可视化类型"""
    CONCEPT_DIAGRAM = "concept_diagram"      # 概念图
    FORMULA_DERIVATION = "formula_derivation"  # 公式推导
    GEOMETRIC_CONSTRUCTION = "geometric_construction"  # 几何构造
    RELATIONSHIP_MAP = "relationship_map"    # 关系图谱
    INTERACTIVE_DEMO = "interactive_demo"     # 交互演示
    PROOF_FLOW = "proof_flow"               # 证明流程
    HISTORICAL_TIMELINE = "historical_timeline"  # 历史时间线
    APPLICATION_CASE = "application_case"    # 应用案例

@dataclass
class MathConcept:
    """数学概念"""
    name: str
    type: MathConceptType
    definition: str
    formula: Optional[str] = None
    visual_description: Optional[str] = None
    related_concepts: List[str] = None
    examples: List[str] = None
    applications: List[str] = None
    difficulty_level: int = 1  # 1-5
    historical_info: Optional[Dict] = None

@dataclass
class Formula:
    """数学公式"""
    latex: str
    description: str
    variables: Dict[str, str]  # 变量解释
    derivation_steps: List[str] = None
    applications: List[str] = None

@dataclass
class GeometricConcept:
    """几何概念"""
    name: str
    definition: str
    properties: List[str]
    construction_method: Optional[str] = None
    related_theorems: List[str] = None
    visual_elements: List[str] = None  # 可视化元素描述

@dataclass
class ProofStep:
    """证明步骤"""
    step_number: int
    statement: str
    reasoning: str
    visual_aid: Optional[str] = None

@dataclass
class MathematicalAnalysis:
    """数学文档分析结果"""
    document_type: str
    main_topics: List[MathConcept]
    key_formulas: List[Formula]
    geometric_concepts: List[GeometricConcept]
    theorems: List[Dict]
    proofs: List[Dict]
    applications: List[str]
    difficulty_assessment: int
    suggested_visualizations: List[VisualizationType]
    learning_objectives: List[str]
    prerequisite_concepts: List[str]

class MathematicsAnalyzer:
    """数学文档分析器"""

    def __init__(self):
        self.math_patterns = self._initialize_patterns()
        self.concept_database = self._load_concept_database()

    def _initialize_patterns(self) -> Dict:
        """初始化数学模式识别"""
        return {
            'theorems': [
                r'(定理|Theorem)[：:\s]*(.+?)(?=\n|$)',
                r'(引理|Lemma)[：:\s]*(.+?)(?=\n|$)',
                r'(推论|Corollary)[：:\s]*(.+?)(?=\n|$)'
            ],
            'definitions': [
                r'(定义|Definition)[：:\s]*(.+?)(?=\n|$)',
                r'(设|Let|假设|Assume)[：:\s]*(.+?)(?=\n|$)'
            ],
            'formulas': [
                r'([A-Za-z]+)\s*=\s*([^=\n]+?)(?=\n|$)',
                r'\\begin\{equation\}(.+?)\\end\{equation\}',
                r'\$\$(.+?)\$\$',
                r'\\[(.+?)\\]'
            ],
            'proofs': [
                r'(证明|Proof)[：:\s]*(.+?)(?=\n\n|\Z)',
                r'(证|∎)[：:\s]*(.+?)(?=\n\n|\Z)'
            ]
        }

    def _load_concept_database(self) -> Dict:
        """加载数学概念数据库"""
        return {
            'geometry': {
                'concepts': [
                    '测地线', '高斯曲率', '黎曼几何', '欧氏几何', '非欧几何',
                    '角盈', '度量', '流形', '切空间', '法向量', '主曲率'
                ],
                'keywords': [
                    'geodesic', 'Gaussian curvature', 'Riemannian geometry',
                    'metric', 'manifold', 'tangent space'
                ]
            },
            'calculus': {
                'concepts': [
                    '微分', '积分', '极限', '导数', '偏导数', '梯度',
                    '散度', '旋度', '拉普拉斯算子'
                ],
                'keywords': [
                    'derivative', 'integral', 'limit', 'gradient',
                    'divergence', 'curl', 'Laplacian'
                ]
            },
            'algebra': {
                'concepts': [
                    '群', '环', '域', '向量空间', '线性变换', '特征值',
                    '矩阵', '行列式', '张量'
                ],
                'keywords': [
                    'group', 'ring', 'field', 'vector space',
                    'linear transformation', 'eigenvalue', 'matrix'
                ]
            }
        }

    def analyze_document(self, text: str) -> MathematicalAnalysis:
        """分析数学文档"""
        print("🔬 开始深度数学分析...")

        # 识别主要概念
        main_topics = self._extract_main_concepts(text)

        # 提取公式
        key_formulas = self._extract_formulas(text)

        # 识别几何概念
        geometric_concepts = self._extract_geometric_concepts(text)

        # 提取定理
        theorems = self._extract_theorems(text)

        # 识别证明
        proofs = self._extract_proofs(text)

        # 识别应用
        applications = self._extract_applications(text)

        # 难度评估
        difficulty_assessment = self._assess_difficulty(text, main_topics)

        # 推荐可视化
        suggested_visualizations = self._suggest_visualizations(
            main_topics, geometric_concepts, theorems
        )

        # 学习目标
        learning_objectives = self._generate_learning_objectives(main_topics)

        # 先修概念
        prerequisite_concepts = self._identify_prerequisites(main_topics)

        return MathematicalAnalysis(
            document_type=self._classify_document(text),
            main_topics=main_topics,
            key_formulas=key_formulas,
            geometric_concepts=geometric_concepts,
            theorems=theorems,
            proofs=proofs,
            applications=applications,
            difficulty_assessment=difficulty_assessment,
            suggested_visualizations=suggested_visualizations,
            learning_objectives=learning_objectives,
            prerequisite_concepts=prerequisite_concepts
        )

    def _extract_main_concepts(self, text: str) -> List[MathConcept]:
        """提取主要数学概念"""
        concepts = []

        # 基于关键词匹配识别概念
        for concept_type, data in self.concept_database.items():
            for concept_name in data['concepts']:
                if concept_name in text:
                    # 提取定义
                    definition = self._extract_definition(text, concept_name)

                    # 提取相关公式
                    formula = self._extract_concept_formula(text, concept_name)

                    concept = MathConcept(
                        name=concept_name,
                        type=MathConceptType(concept_type),
                        definition=definition,
                        formula=formula,
                        related_concepts=self._find_related_concepts(text, concept_name),
                        examples=self._find_examples(text, concept_name)
                    )
                    concepts.append(concept)

        return concepts

    def _extract_formulas(self, text: str) -> List[Formula]:
        """提取数学公式"""
        formulas = []

        # LaTeX公式
        latex_matches = re.findall(r'\\\[(.+?)\\\]', text, re.DOTALL)
        for match in latex_matches:
            formula = Formula(
                latex=f"[{match}]",
                description="提取的数学公式",
                variables=self._extract_variables(match)
            )
            formulas.append(formula)

        # 行内公式
        inline_matches = re.findall(r'\$\$(.+?)\$\$', text)
        for match in inline_matches:
            formula = Formula(
                latex=f"${match}$",
                description="行内数学公式",
                variables=self._extract_variables(match)
            )
            formulas.append(formula)

        return formulas

    def _extract_geometric_concepts(self, text: str) -> List[GeometricConcept]:
        """提取几何概念"""
        geometric_concepts = []

        # 几何相关术语
        geometry_terms = [
            '测地线', '曲率', '切线', '法线', '角度', '距离', '面积', '体积',
            '球面', '平面', '曲面', '流形', '圆', '三角形', '多边形'
        ]

        for term in geometry_terms:
            if term in text:
                concept = GeometricConcept(
                    name=term,
                    definition=self._extract_definition(text, term),
                    properties=self._extract_properties(text, term),
                    construction_method=self._extract_construction_method(text, term)
                )
                geometric_concepts.append(concept)

        return geometric_concepts

    def _extract_theorems(self, text: str) -> List[Dict]:
        """提取定理"""
        theorems = []

        for pattern in self.math_patterns['theorems']:
            matches = re.findall(pattern, text, re.IGNORECASE | re.MULTILINE)
            for match in matches:
                theorem = {
                    'statement': match,
                    'type': 'theorem',
                    'context': self._get_context(text, match)
                }
                theorems.append(theorem)

        return theorems

    def _extract_proofs(self, text: str) -> List[Dict]:
        """提取证明"""
        proofs = []

        for pattern in self.math_patterns['proofs']:
            matches = re.findall(pattern, text, re.IGNORECASE | re.MULTILINE | re.DOTALL)
            for match in matches:
                proof = {
                    'content': match,
                    'steps': self._parse_proof_steps(match),
                    'type': 'proof'
                }
                proofs.append(proof)

        return proofs

    def _suggest_visualizations(self, concepts: List[MathConcept],
                              geometric_concepts: List[GeometricConcept],
                              theorems: List[Dict]) -> List[VisualizationType]:
        """推荐可视化类型"""
        visualizations = []

        # 基于几何概念推荐
        if geometric_concepts:
            visualizations.extend([
                VisualizationType.GEOMETRIC_CONSTRUCTION,
                VisualizationType.CONCEPT_DIAGRAM
            ])

        # 基于定理推荐
        if theorems:
            visualizations.extend([
                VisualizationType.PROOF_FLOW,
                VisualizationType.RELATIONSHIP_MAP
            ])

        # 基于公式推荐
        if concepts and any(c.formula for c in concepts):
            visualizations.append(VisualizationType.FORMULA_DERIVATION)

        # 基于应用推荐
        if len(concepts) > 3:
            visualizations.append(VisualizationType.APPLICATION_CASE)

        return list(set(visualizations))  # 去重

    def generate_visualization_content(self, analysis: MathematicalAnalysis) -> Dict:
        """生成可视化内容"""
        content = {
            'title': f'{analysis.document_type}概念可视化',
            'concepts': [],
            'formulas': [],
            'geometric_constructions': [],
            'relationship_maps': []
        }

        # 为每个概念生成可视化
        for concept in analysis.main_topics:
            viz_content = {
                'concept_name': concept.name,
                'concept_type': concept.type.value,
                'definition': concept.definition,
                'visual_elements': self._generate_concept_visualization(concept),
                'interactive_elements': self._generate_interactive_elements(concept)
            }
            content['concepts'].append(viz_content)

        return content

    def _generate_concept_visualization(self, concept: MathConcept) -> Dict:
        """为单个概念生成可视化"""
        if concept.type == MathConceptType.GEOMETRY:
            return {
                'type': 'geometric_diagram',
                'elements': ['shapes', 'measurements', 'annotations'],
                'interactions': ['rotate', 'zoom', 'measure'],
                'description': f'{concept.name}的几何可视化'
            }
        elif concept.type == MathConceptType.CALCULUS:
            return {
                'type': 'calculus_graph',
                'elements': ['function_plot', 'derivatives', 'integrals'],
                'interactions': ['animate_derivative', 'area_under_curve'],
                'description': f'{concept.name}的微积分可视化'
            }
        else:
            return {
                'type': 'concept_diagram',
                'elements': ['nodes', 'edges', 'labels'],
                'interactions': ['highlight', 'expand'],
                'description': f'{concept.name}的概念关系图'
            }

    def _generate_interactive_elements(self, concept: MathConcept) -> List[str]:
        """生成交互元素"""
        elements = []

        if concept.type == MathConceptType.GEOMETRY:
            elements.extend(['3D_rotation', 'measurement_tools', 'animation'])
        elif concept.type == MathConceptType.CALCULUS:
            elements.extend(['parameter_sliders', 'function_plotter', 'tangent_animation'])

        return elements

    def _extract_definition(self, text: str, concept: str) -> str:
        """提取概念定义"""
        patterns = [
            rf'{concept}[：:\s]*(.+?)(?=\n|$)',
            rf'{concept}是(.+?)(?=\n|。|；)',
            rf'{concept}定义为(.+?)(?=\n|。|；)'
        ]

        for pattern in patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                return match.group(1).strip()

        return f"找到概念: {concept}"

    def _extract_concept_formula(self, text: str, concept: str) -> Optional[str]:
        """提取概念相关的公式"""
        # 在概念附近的文本中查找公式
        concept_section_pattern = rf'{concept}[：:\s].*?(?=\n##|\n\n|\Z)'
        match = re.search(concept_section_pattern, text, re.IGNORECASE | re.DOTALL)

        if match:
            section_text = match.group(0)
            # 查找LaTeX风格的公式
            formula_patterns = [
                r'\\\[.*?\\\]',  # \[ ... \]
                r'\$.*?\$',       # $ ... $
                r'``.*?``',       # `...` 中的公式
                r'[A-Za-z]\s*=\s*[^。；；\n]+',  # 简单的等式
            ]

            for pattern in formula_patterns:
                formula_match = re.search(pattern, section_text)
                if formula_match:
                    return formula_match.group(0).strip()

        return None

    def _find_related_concepts(self, text: str, concept: str) -> List[str]:
        """查找相关概念"""
        # 简单的相关概念查找
        related = []
        math_keywords = [
            '微分几何', '流形', '切空间', '黎曼度量', '曲率', '测地线',
            '积分', '导数', '拓扑', '同胚', '同伦', '同调',
            '向量', '矩阵', '线性空间', '内积', '正交'
        ]

        # 在文本中查找其他数学关键词
        for keyword in math_keywords:
            if keyword in text and keyword != concept:
                related.append(keyword)

        return related[:5]  # 最多返回5个相关概念

    def _find_examples(self, text: str, concept: str) -> List[str]:
        """查找概念的例子"""
        examples = []

        # 简单的例子提取
        patterns = [
            rf'{concept}[：:\s].*?例如(.+?)(?=\n|。|；)',
            rf'{concept}[：:\s].*?比如(.+?)(?=\n|。|；)',
            rf'{concept}[：:\s].*?如(.+?)(?=\n|。|；)'
        ]

        for pattern in patterns:
            matches = re.findall(pattern, text, re.IGNORECASE)
            examples.extend(matches[:2])  # 最多取2个例子

        return examples

    def _extract_properties(self, text: str, concept: str) -> List[str]:
        """提取概念的属性"""
        properties = []

        # 简单的属性提取
        patterns = [
            rf'{concept}[：:\s].*?具有(.+?)(?=\n|。|；)',
            rf'{concept}[：:\s].*?特点(.+?)(?=\n|。|；)',
            rf'{concept}[：:\s].*?性质(.+?)(?=\n|。|；)'
        ]

        for pattern in patterns:
            matches = re.findall(pattern, text, re.IGNORECASE)
            properties.extend(matches[:2])

        return properties

    def _extract_construction_method(self, text: str, concept: str) -> Optional[str]:
        """提取几何概念的构造方法"""
        # 简单的构造方法提取
        patterns = [
            rf'{concept}[：:\s].*?构造(.+?)(?=\n|。|；)',
            rf'{concept}[：:\s].*?构建(.+?)(?=\n|。|；)',
            rf'{concept}[：:\s].*?作图(.+?)(?=\n|。|；)'
        ]

        for pattern in patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                return match.group(1).strip()

        return None

    def _get_context(self, text: str, match) -> str:
        """获取匹配项的上下文"""
        if hasattr(match, 'start'):
            start = max(0, match.start() - 50)
            end = min(len(text), match.end() + 50)
            return text[start:end]
        return ""

    def _extract_applications(self, text: str) -> List[Dict]:
        """提取应用案例"""
        applications = []

        # 简单的应用提取
        patterns = [
            r'应用[：:\s](.+?)(?=\n|。|；)',
            r'应 用[：:\s](.+?)(?=\n|。|；)',
            r'实际应用[：:\s](.+?)(?=\n|。|；)'
        ]

        for pattern in patterns:
            matches = re.findall(pattern, text)
            for match in matches:
                applications.append({
                    'description': match.strip(),
                    'field': 'general'
                })

        return applications

    def _assess_difficulty(self, text: str, main_topics: List[MathConcept]) -> int:
        """评估文档难度"""
        if not main_topics:
            return 1

        # 基于概念数量和概念难度评估
        total_difficulty = sum(concept.difficulty_level for concept in main_topics)
        avg_difficulty = total_difficulty / len(main_topics)

        # 基于文本长度调整
        text_length_factor = min(len(text) / 1000, 2.0)

        # 基于公式数量调整
        formula_count = len(re.findall(r'[=+\-*/]', text))
        formula_factor = min(formula_count / 10, 1.5)

        final_difficulty = int(avg_difficulty * text_length_factor * formula_factor)
        return min(max(final_difficulty, 1), 5)

    def _generate_learning_objectives(self, main_topics: List[MathConcept]) -> List[str]:
        """生成学习目标"""
        objectives = []

        if not main_topics:
            return objectives

        # 基于主要概念生成学习目标
        for concept in main_topics[:3]:
            if concept.type.value == 'geometry':
                objectives.append(f"理解{concept.name}的几何意义和构造方法")
            elif concept.type.value == 'calculus':
                objectives.append(f"掌握{concept.name}的计算方法和应用")
            elif concept.type.value == 'algebra':
                objectives.append(f"熟悉{concept.name}的代数性质和运算规则")
            else:
                objectives.append(f"理解{concept.name}的基本概念和应用")

        # 添加通用学习目标
        objectives.extend([
            "能够应用所学概念解决实际问题",
            "掌握相关数学工具的使用方法"
        ])

        return objectives[:5]  # 最多返回5个学习目标

    def _identify_prerequisites(self, main_topics: List[MathConcept]) -> List[str]:
        """识别前置概念"""
        prerequisites = []

        # 基于主要概念类型推断前置知识
        concept_types = {concept.type.value for concept in main_topics}

        if 'geometry' in concept_types:
            prerequisites.extend(['欧几里得几何', '基础代数'])
        if 'calculus' in concept_types:
            prerequisites.extend(['极限理论', '导数和积分'])
        if 'algebra' in concept_types:
            prerequisites.extend(['基础代数运算', '方程求解'])
        if 'topology' in concept_types:
            prerequisites.extend(['集合论', '基础拓扑'])

        # 通用前置知识
        prerequisites.extend(['数学基础概念', '逻辑推理能力'])

        return list(set(prerequisites))[:5]  # 去重并限制数量

    def _extract_variables(self, formula_text: str) -> Dict[str, str]:
        """提取公式变量"""
        variables = {}
        # 简单的变量识别
        var_matches = re.findall(r'([a-zA-Z])(?=\s*[=+\-*/])', formula_text)
        for var in set(var_matches):
            variables[var] = f"变量 {var}"
        return variables

    def _classify_document(self, text: str) -> str:
        """分类文档类型"""
        if '几何' in text or 'geometr' in text.lower():
            return '几何学文档'
        elif '微积分' in text or 'calculu' in text.lower():
            return '微积分文档'
        elif '代数' in text or 'algebra' in text.lower():
            return '代数学文档'
        elif '统计' in text or 'statistic' in text.lower():
            return '统计学文档'
        else:
            return '数学文档'

# 全局实例
math_analyzer = MathematicsAnalyzer()