"""
万物可视化 v2.0 - 数学学科Agent
处理数学相关的可视化需求，包括概率统计、线性代数、微积分等
"""

from typing import Dict, List, Optional, Any
import json
import math
import datetime
import numpy as np
from .base_agent import (
    BaseVisualizationAgent,
    VisualizationError,
    RequirementParseError,
)


class MathematicsAgent(BaseVisualizationAgent):
    """数学学科可视化Agent"""

    def __init__(self):
        super().__init__(
            "mathematics",
            {
                "supported_distributions": [
                    "normal",
                    "binomial",
                    "poisson",
                    "uniform",
                    "exponential",
                    "chi_square",
                    "t",
                ],
                "supported_fields": [
                    "probability",
                    "statistics",
                    "linear_algebra",
                    "calculus",
                    "geometry",
                    "algebra",
                ],
                "supported_concepts": {
                    "linear_algebra": [
                        "二阶行列式",
                        "三阶行列式",
                        "向量投影",
                        "向量空间",
                        "旋转矩阵",
                        "正交分解",
                        "特征值分解",
                        "矩阵运算",
                        "高斯消元法",
                        "线性变换",
                    ],
                    "probability": [
                        "正态分布",
                        "二项分布",
                        "泊松分布",
                        "均匀分布",
                        "指数分布",
                        "卡方分布",
                        "t分布",
                    ],
                },
            },
        )

    async def parse_requirement(self, prompt: str) -> Dict[str, Any]:
        """
        解析数学需求

        Args:
            prompt: 用户输入的数学需求描述

        Returns:
            Dict: 解析后的数学需求结构
        """
        try:
            requirement = {
                "subject": "mathematics",
                "original": prompt,
                "keywords": [],
                "field": None,
                "concept_type": None,
                "parameters": {},
                "numbers": [],
                "raw_text": prompt,
            }

            # 1. 识别数学领域
            field_patterns = {
                "probability": ["概率", "统计", "分布", "随机", "期望", "方差"],
                "linear_algebra": ["矩阵", "向量", "行列式", "线性", "变换", "特征值"],
                "calculus": ["导数", "积分", "极限", "微分", "函数", "曲线"],
                "geometry": ["几何", "图形", "角度", "长度", "面积", "体积"],
                "algebra": ["方程", "代数", "多项式", "根", "系数", "变量"],
            }

            for field, patterns in field_patterns.items():
                if any(pattern in prompt for pattern in patterns):
                    requirement["field"] = field
                    break

            # 2. 识别分布类型 (概率统计领域)
            if requirement["field"] == "probability":
                distribution_patterns = {
                    "正态分布": "normal",
                    "高斯分布": "normal",
                    "normal": "normal",
                    "gaussian": "normal",
                    "二项分布": "binomial",
                    "伯努利": "binomial",
                    "binomial": "binomial",
                    "泊松分布": "poisson",
                    "poisson": "poisson",
                    "均匀分布": "uniform",
                    "uniform": "uniform",
                    "指数分布": "exponential",
                    "exponential": "exponential",
                    "卡方分布": "chi_square",
                    "chi_square": "chi_square",
                    "卡方": "chi_square",
                    "t分布": "t",
                    "t分布": "t",
                    "t": "t",
                }

                for pattern, dist_type in distribution_patterns.items():
                    if pattern in prompt.lower():
                        requirement["concept_type"] = "distribution"
                        requirement["distribution_type"] = dist_type
                        break

            # 3. 识别线性代数概念
            elif requirement["field"] == "linear_algebra":
                la_concepts = self.config["supported_concepts"]["linear_algebra"]

                # 扩展的线性代数关键词映射
                concept_mapping = {
                    "二阶行列式": "determinant_2x2",
                    "三阶行列式": "determinant_3x3",
                    "行列式": "determinant_2x2",  # 默认二阶
                    "向量投影": "vector_projection",
                    "投影": "vector_projection",
                    "矩阵运算": "matrix_operations",
                    "矩阵": "matrix_operations",
                    "向量空间": "vector_space",
                    "线性变换": "linear_transformation",
                    "特征值": "eigenvalue_decomposition",
                    "特征值分解": "eigenvalue_decomposition",
                    "特征向量": "eigenvalue_decomposition",
                    "正交分解": "orthogonal_decomposition",
                    "高斯消元法": "gaussian_elimination",
                    "旋转矩阵": "rotation_matrix",
                    "旋转": "rotation_matrix",
                }

                # 精确匹配
                for concept in la_concepts:
                    if concept in prompt:
                        requirement["concept_type"] = "linear_algebra"
                        requirement["template_id"] = concept_mapping.get(
                            concept, concept
                        )
                        requirement["la_concept"] = concept
                        break

                # 关键词映射（如果没有精确匹配）
                if not requirement.get("template_id"):
                    for keyword, template_id in concept_mapping.items():
                        if keyword in prompt:
                            requirement["concept_type"] = "linear_algebra"
                            requirement["template_id"] = template_id
                            requirement["la_concept"] = keyword
                            break

            # 4. 提取数值参数
            numbers = self._extract_numbers(prompt)
            if numbers:
                requirement["numbers"] = numbers

                # 根据概念类型分配参数
                if requirement.get("distribution_type"):
                    if requirement["distribution_type"] == "normal":
                        if len(numbers) >= 2:
                            requirement["parameters"]["mu"] = numbers[0]
                            requirement["parameters"]["sigma"] = abs(numbers[1])
                        elif len(numbers) == 1:
                            requirement["parameters"]["mu"] = numbers[0]
                            requirement["parameters"]["sigma"] = 1.0
                    elif requirement["distribution_type"] == "binomial":
                        if len(numbers) >= 2:
                            requirement["parameters"]["n"] = int(abs(numbers[0]))
                            requirement["parameters"]["p"] = min(
                                1.0, max(0.0, numbers[1])
                            )
                        elif len(numbers) == 1:
                            requirement["parameters"]["n"] = int(abs(numbers[0]))
                            requirement["parameters"]["p"] = 0.5

            # 5. 提取关键词
            all_keywords = []
            for patterns in field_patterns.values():
                all_keywords.extend(patterns)
            requirement["keywords"] = self._extract_keywords(prompt, all_keywords)

            return requirement

        except Exception as e:
            raise RequirementParseError(f"数学需求解析失败: {str(e)}")

    async def match_template(
        self, requirement: Dict[str, Any]
    ) -> Optional[Dict[str, Any]]:
        """
        匹配数学模板

        Args:
            requirement: 解析后的数学需求

        Returns:
            Dict: 匹配的模板配置
        """
        try:
            # 使用模板引擎进行匹配
            if hasattr(self, "template_engine") and self.template_engine:
                # 搜索匹配的模板
                search_query = requirement.get("original", "")
                dist_type = requirement.get("distribution_type")

                # 如果识别了分布类型，优先匹配
                if dist_type:
                    subject_templates = (
                        await self.template_engine.get_subject_templates("mathematics")
                    )
                    for template in subject_templates:
                        if template.get("id") == f"{dist_type}_distribution":
                            return template

                # 通用搜索
                matched_templates = await self.template_engine.search_templates(
                    search_query, "mathematics"
                )
                if matched_templates:
                    return matched_templates[0]

            # 回退到内置模板
            return await self._match_builtin_template(requirement)

        except Exception as e:
            raise VisualizationError(f"模板匹配失败: {str(e)}")

    async def _match_builtin_template(
        self, requirement: Dict[str, Any]
    ) -> Optional[Dict[str, Any]]:
        """
        回退到内置模板匹配

        Args:
            requirement: 解析后的数学需求

        Returns:
            Dict: 匹配的模板配置
        """
        try:
            # 优先使用模板引擎中的模板（文件系统加载的模板）
            if hasattr(self, "template_engine") and self.template_engine:
                template_id = requirement.get("template_id", "")

                # 尝试从模板引擎获取模板
                if template_id:
                    template = await self.template_engine.get_template(template_id)
                    if template and "html_template" in template and len(template["html_template"]) > 100:
                        # 确保模板有实际的HTML内容（不只是占位符字符串）
                        print(f"✅ 使用模板引擎中的模板: {template_id}")
                        return template

            # 1. 概率分布模板匹配
            if requirement.get("concept_type") == "distribution":
                dist_type = requirement.get("distribution_type")
                if dist_type in self.templates:
                    return self.templates[dist_type]

            # 2. 线性代数模板匹配
            elif requirement.get("concept_type") == "linear_algebra":
                concept = requirement.get("la_concept")
                # 优先使用 template_id 如果存在
                if requirement.get("template_id"):
                    template_key = f"la_{requirement.get('template_id')}"
                else:
                    template_key = f"la_{concept}"

                # 特殊处理：如果concept_mapping映射了中文名到英文id，这里需要正确查找
                # 在 _load_templates 中，键是 "la_二阶行列式" 还是 "la_determinant_2x2"？
                # 检查 _load_templates 定义，键是 "la_向量投影" (中文) 和 "la_二阶行列式" (中文 - 刚才添加的)
                # 但 parse_requirement 中映射到了 "determinant_2x2"

                # 修正：为了匹配 _load_templates 中的键，我们需要反向查找或者标准化键名
                # 简单起见，我们直接检查两种可能

                if template_key in self.templates:
                    return self.templates[template_key]

                # 尝试用原始中文名查找
                chinese_key = f"la_{concept}"
                if chinese_key in self.templates:
                    return self.templates[chinese_key]

                # 尝试查找映射后的名称
                if (
                    requirement.get("la_concept") == "二阶行列式"
                    or requirement.get("la_concept") == "行列式"
                ):
                    if "la_二阶行列式" in self.templates:
                        return self.templates["la_二阶行列式"]

            # 3. 默认数学模板
            else:
                return self.templates.get("default_math", None)

        except Exception as e:
            raise VisualizationError(f"内置模板匹配失败: {str(e)}")

    async def generate_config(
        self,
        requirement: Dict[str, Any],
        template: Dict[str, Any],
        user_preferences: Dict[str, Any],
    ) -> Dict[str, Any]:
        """
        生成数学可视化配置

        Args:
            requirement: 数学需求
            template: 匹配的模板
            user_preferences: 用户偏好

        Returns:
            Dict: 可视化配置
        """
        try:
            config = {
                "title": user_preferences.get("title")
                or self._generate_default_title(requirement),
                "subject": "mathematics",
                "field": requirement.get("field", "general"),
                "concept_type": requirement.get("concept_type"),
                "template_id": template.get("id"),
                "parameters": requirement.get("parameters", {}),
                "numbers": requirement.get("numbers", []),
                "user_preferences": user_preferences,
                "interactive": True,
                "responsive": True,
                # 添加这些字段供 get_template_id 使用
                "viz_type": requirement.get("concept_type", ""),
                "requirement": requirement,
            }

            # 根据不同概念类型添加特定配置
            if requirement.get("distribution_type"):
                config.update(
                    {
                        "chart_type": "line",
                        "x_range": (
                            [-5, 5]
                            if requirement["distribution_type"] == "normal"
                            else [0, 20]
                        ),
                        "show_statistics": True,
                        "show_probability": True,
                    }
                )

            elif requirement.get("la_concept"):
                config.update(
                    {
                        "chart_type": "geometric",
                        "show_matrix": True,
                        "show_vectors": True,
                        "3d_enabled": requirement.get("la_concept")
                        in ["向量空间", "特征值分解"],
                    }
                )

            return config

        except Exception as e:
            raise VisualizationError(f"配置生成失败: {str(e)}")

    async def generate_visualization(self, config: Dict[str, Any]) -> str:
        """
        生成数学可视化HTML

        Args:
            config: 可视化配置

        Returns:
            str: HTML内容
        """
        try:
            # 使用统一模板引擎
            if hasattr(self, "template_engine") and self.template_engine:
                template_id = self.get_template_id(config)
                return await self.template_engine.render_template(template_id, config)
            else:
                # 降级到简单HTML
                return self._generate_fallback_html(config)
        except Exception as e:
            raise VisualizationError(f"可视化生成失败: {str(e)}")

    def _load_templates(self) -> Dict[str, Any]:
        """加载数学模板"""
        return {
            "normal": {
                "id": "normal",
                "name": "正态分布可视化",
                "description": "交互式正态分布概率密度函数",
                "parameters": ["mu", "sigma"],
                "html_template": "default_math_template",
            },
            "binomial": {
                "id": "binomial",
                "name": "二项分布可视化",
                "description": "二项分布概率质量函数",
                "parameters": ["n", "p"],
                "html_template": "default_math_template",
            },
            "la_向量投影": {
                "id": "la_vector_projection",
                "name": "向量投影可视化",
                "description": "展示向量在其他向量上的投影",
                "parameters": ["vector1", "vector2"],
                "html_template": "default_math_template",
            },
            "la_二阶行列式": {
                "id": "la_determinant_2x2",
                "name": "二阶行列式几何意义",
                "description": "展示二阶行列式的几何意义（平行四边形面积）",
                "parameters": ["a", "b", "c", "d"],
                "html_template": "default_math_template",
            },
        }

    def get_supported_topics(self) -> List[str]:
        """
        获取支持的数学主题

        Returns:
            List[str]: 支持的主题列表
        """
        return [
            "概率统计",
            "微积分",
            "线性代数",
            "离散数学",
            "数值分析",
            "复变函数",
            "实变函数",
            "常微分方程",
            "偏微分方程",
            "最优化理论",
            "图论",
            "组合数学",
            "数论",
            "抽象代数",
            "拓扑学",
            "几何学",
        ]

    def get_template_id(self, config: Dict[str, Any]) -> str:
        """
        根据配置获取模板ID

        Args:
            config: 可视化配置

        Returns:
            str: 模板ID
        """
        viz_type = config.get("viz_type", "")
        requirement = config.get("requirement", {})

        # 添加调试日志
        print(f"🔍 [DEBUG] get_template_id: viz_type={viz_type}, requirement={str(requirement)[:100]}")

        if viz_type == "distribution" or "distribution" in str(viz_type):
            result = "normal_distribution"
        elif "poisson" in str(viz_type) or "poisson" in str(requirement):
            result = "poisson_distribution"
        elif "vector" in str(viz_type) or "向量" in str(requirement):
            result = "vector_projection"
        elif "三阶行列式" in str(viz_type) or "三阶行列式" in str(requirement) or "3x3" in str(viz_type) or "3x3" in str(requirement):
            result = "determinant_3x3"
        elif "determinant" in str(viz_type) or "行列式" in str(requirement):
            result = "determinant_2x2"  # 默认二阶
        else:
            result = "probability_statistics_default"

        print(f"🔍 [DEBUG] get_template_id 返回: {result}")
        return result

    def _generate_fallback_html(self, config: Dict[str, Any]) -> str:
        """
        生成降级HTML内容

        Args:
            config: 可视化配置

        Returns:
            str: HTML内容
        """
        title = config.get("title", "数学可视化")
        viz_type = config.get("viz_type", "unknown")

        return f"""
        <div class="visualization-container" style="padding: 20px; text-align: center;">
            <h3>📊 {title}</h3>
            <div class="visualization-content" style="background: linear-gradient(45deg, #667eea 0%, #764ba2 100%);
                        color: white; padding: 40px; border-radius: 10px; margin: 20px 0;">
                <h4>类型: {viz_type}</h4>
                <p>这是一个数学学科的可视化</p>
                <div style="font-size: 48px; margin: 20px 0;">
                    📐
                </div>
                <p>系统正在为你的请求生成详细的可视化内容...</p>
            </div>
            <div class="visualization-info" style="text-align: left; margin-top: 20px;">
                <h4>相关信息：</h4>
                <ul>
                    <li>学科领域：数学</li>
                    <li>可视化类型：{viz_type}</li>
                    <li>生成时间：{datetime.now().strftime("%Y-%m-%d %H:%M:%S")}</li>
                </ul>
            </div>
        </div>
        """
