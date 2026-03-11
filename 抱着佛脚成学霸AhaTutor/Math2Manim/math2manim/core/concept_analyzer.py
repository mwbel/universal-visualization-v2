"""
概念分析器 - 分析数学/物理概念的核心组件

负责：
1. 识别概念类型（数学/物理/化学）
2. 提取关键词和公式
3. 判断概念难度
4. 推荐可视化方式
"""

from typing import Dict, List, Optional, Any
from dataclasses import dataclass
from enum import Enum


class ConceptType(Enum):
    """概念类型"""
    MATH = "mathematics"
    PHYSICS = "physics"
    CHEMISTRY = "chemistry"
    UNKNOWN = "unknown"


class DifficultyLevel(Enum):
    """难度级别"""
    ELEMENTARY = "elementary"  # 小学
    MIDDLE_SCHOOL = "middle_school"  # 初中
    HIGH_SCHOOL = "high_school"  # 高中
    UNDERGRADUATE = "undergraduate"  # 大学
    GRADUATE = "graduate"  # 研究生


@dataclass
class ConceptAnalysis:
    """概念分析结果"""

    concept: str
    """概念名称"""

    type: ConceptType
    """概念类型"""

    difficulty: DifficultyLevel
    """难度级别"""

    keywords: List[str]
    """关键词列表"""

    formulas: List[str]
    """相关公式（LaTeX 格式）"""

    prerequisites: List[str]
    """前置知识"""

    visualization_hints: List[str]
    """可视化建议"""

    metadata: Dict[str, Any]
    """额外元数据"""


class ConceptAnalyzer:
    """
    概念分析器

    使用规则和 AI 结合的方式分析概念
    """

    # 概念关键词映射
    CONCEPT_KEYWORDS = {
        ConceptType.MATH: [
            "定理", "公式", "函数", "方程", "几何", "代数",
            "微积分", "导数", "积分", "极限", "矩阵", "向量"
        ],
        ConceptType.PHYSICS: [
            "定律", "力", "运动", "能量", "动量", "电", "磁",
            "波", "光", "热", "量子", "相对论"
        ],
        ConceptType.CHEMISTRY: [
            "元素", "化合物", "反应", "平衡", "酸碱", "氧化还原",
            "有机", "无机", "分子", "原子"
        ]
    }

    # 内置概念库
    KNOWN_CONCEPTS = {
        "勾股定理": {
            "type": ConceptType.MATH,
            "difficulty": DifficultyLevel.MIDDLE_SCHOOL,
            "keywords": ["直角三角形", "平方", "面积"],
            "formulas": [r"a^2 + b^2 = c^2"],
            "prerequisites": ["三角形", "正方形", "面积"],
            "visualization_hints": ["绘制直角三角形", "显示三个正方形", "动画展示面积关系"]
        },
        "正弦函数": {
            "type": ConceptType.MATH,
            "difficulty": DifficultyLevel.HIGH_SCHOOL,
            "keywords": ["三角函数", "周期", "振幅"],
            "formulas": [r"y = A\sin(\omega x + \phi) + k"],
            "prerequisites": ["三角形", "角度", "比例", "函数"],
            "visualization_hints": ["绘制单位圆", "显示正弦曲线", "动画展示周期变化"]
        },
        "导数": {
            "type": ConceptType.MATH,
            "difficulty": DifficultyLevel.HIGH_SCHOOL,
            "keywords": ["变化率", "切线", "斜率", "极限"],
            "formulas": [r"f'(x) = \lim_{h \to 0} \frac{f(x+h) - f(x)}{h}"],
            "prerequisites": ["函数", "极限", "斜率"],
            "visualization_hints": ["绘制函数曲线", "显示切线", "动画展示极限过程"]
        },
        "牛顿第二定律": {
            "type": ConceptType.PHYSICS,
            "difficulty": DifficultyLevel.HIGH_SCHOOL,
            "keywords": ["力", "质量", "加速度"],
            "formulas": [r"F = ma"],
            "prerequisites": ["力", "质量", "加速度", "向量"],
            "visualization_hints": ["绘制物体", "显示力的方向", "动画展示加速运动"]
        },
        "偏导数": {
            "type": ConceptType.MATH,
            "difficulty": DifficultyLevel.UNDERGRADUATE,
            "keywords": ["多元函数", "变化率", "方向", "梯度"],
            "formulas": [r"\frac{\partial f}{\partial x}", r"\frac{\partial f}{\partial y}"],
            "prerequisites": ["导数", "多元函数", "极限"],
            "visualization_hints": ["绘制三维曲面", "显示切平面", "动画展示沿不同方向的变化率", "可视化梯度向量"]
        }
    }

    def __init__(self, llm_client: Optional[Any] = None):
        """
        初始化概念分析器

        Args:
            llm_client: LLM 客户端（可选）
        """
        self.llm_client = llm_client

    def analyze(self, concept: str) -> ConceptAnalysis:
        """
        分析概念

        Args:
            concept: 概念名称

        Returns:
            概念分析结果
        """
        # 先检查内置概念库
        if concept in self.KNOWN_CONCEPTS:
            return self._create_analysis_from_known(concept)

        # 使用 LLM 分析（如果可用）
        if self.llm_client:
            return self._analyze_with_llm(concept)

        # 使用规则分析
        return self._analyze_with_rules(concept)

    def _create_analysis_from_known(self, concept: str) -> ConceptAnalysis:
        """从内置概念库创建分析结果"""
        data = self.KNOWN_CONCEPTS[concept]
        return ConceptAnalysis(
            concept=concept,
            type=data["type"],
            difficulty=data["difficulty"],
            keywords=data["keywords"],
            formulas=data["formulas"],
            prerequisites=data["prerequisites"],
            visualization_hints=data["visualization_hints"],
            metadata={"source": "known_concepts"}
        )

    def _analyze_with_rules(self, concept: str) -> ConceptAnalysis:
        """使用规则分析概念"""
        # 判断概念类型
        concept_type = self._detect_type(concept)

        # 简单的难度判断
        difficulty = DifficultyLevel.HIGH_SCHOOL  # 默认高中

        return ConceptAnalysis(
            concept=concept,
            type=concept_type,
            difficulty=difficulty,
            keywords=[],
            formulas=[],
            prerequisites=[],
            visualization_hints=["使用基础几何图形", "添加文字说明"],
            metadata={"source": "rules"}
        )

    def _detect_type(self, concept: str) -> ConceptType:
        """检测概念类型"""
        concept_lower = concept.lower()

        for ctype, keywords in self.CONCEPT_KEYWORDS.items():
            if any(kw in concept_lower for kw in keywords):
                return ctype

        return ConceptType.UNKNOWN

    def _analyze_with_llm(self, concept: str) -> ConceptAnalysis:
        """使用 LLM 分析概念"""
        prompt = f"""
分析以下概念："{concept}"

请提供：
1. 概念类型（数学/物理/化学）
2. 难度级别（小学/初中/高中/大学/研究生）
3. 关键词列表（3-5个）
4. 相关公式（LaTeX 格式）
5. 前置知识（3-5个）
6. 可视化建议（3-5条）

返回 JSON 格式。
"""
        # 这里需要调用实际的 LLM API
        # response = self.llm_client.generate(prompt)
        # return parse_response(response)

        # 临时返回规则分析结果
        return self._analyze_with_rules(concept)
