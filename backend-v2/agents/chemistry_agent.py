"""
万物可视化 v2.0 - 化学学科Agent
专门处理高中化学的可视化需求，包括分子结构、化学反应、元素周期表等
"""

from typing import Dict, List, Optional, Any, Union
import json
import re
from agents.base_agent import BaseVisualizationAgent

class ChemistryAgent(BaseVisualizationAgent):
    """化学学科可视化Agent"""

    def __init__(self, config: Dict[str, Any] = None):
        """
        初始化化学Agent

        Args:
            config: Agent配置参数
        """
        default_config = {
            "supported_visualizations": [
                "molecule_structure",      # 分子结构
                "chemical_reaction",       # 化学反应
                "periodic_table",          # 元素周期表
                "chemical_bonds",          # 化学键
                "atomic_structure",        # 原子结构
                "organic_chemistry",       # 有机化学
                "acid_base_reaction",      # 酸碱反应
                "oxidation_reduction"      # 氧化还原反应
            ],
            "default_grade_level": "high_school",
            "template_path": "templates/chemistry/",
            "keywords": [
                "分子", "原子", "化学键", "元素", "周期表", "反应", "化合物",
                "酸碱", "氧化还原", "有机", "无机", "溶液", "电解质", "离子",
                "化合价", "电子", "质子", "中子", "分子式", "化学方程式",
                "molecule", "atom", "chemical bond", "element", "periodic table",
                "reaction", "compound", "acid", "base", "organic", "inorganic"
            ]
        }

        if config:
            default_config.update(config)

        super().__init__("chemistry", default_config)

    async def parse_requirement(self, prompt: str) -> Dict[str, Any]:
        """
        解析化学学科需求

        Args:
            prompt: 用户输入的自然语言描述

        Returns:
            Dict: 解析后的结构化需求
        """
        requirement = {
            "subject": "chemistry",
            "grade_level": self._detect_grade_level(prompt),
            "visualization_type": None,
            "concepts": [],
            "parameters": {},
            "difficulty": "intermediate"
        }

        # 识别可视化类型
        prompt_lower = prompt.lower()

        if any(keyword in prompt_lower for keyword in ["分子结构", "分子", "molecule", "分子式"]):
            requirement["visualization_type"] = "molecule_structure"
            requirement["concepts"] = self._extract_molecules(prompt)

        elif any(keyword in prompt_lower for keyword in ["反应", "反应式", "reaction", "化学方程式"]):
            requirement["visualization_type"] = "chemical_reaction"
            requirement["concepts"] = self._extract_reactions(prompt)

        elif any(keyword in prompt_lower for keyword in ["周期表", "元素", "periodic table", "element"]):
            requirement["visualization_type"] = "periodic_table"
            requirement["concepts"] = self._extract_elements(prompt)

        elif any(keyword in prompt_lower for keyword in ["化学键", "键", "bond", "共价", "离子"]):
            requirement["visualization_type"] = "chemical_bonds"
            requirement["concepts"] = self._extract_bonds(prompt)

        elif any(keyword in prompt_lower for keyword in ["酸碱", "酸", "碱", "acid", "base", "ph"]):
            requirement["visualization_type"] = "acid_base_reaction"
            requirement["concepts"] = self._extract_acid_base(prompt)

        elif any(keyword in prompt_lower for keyword in ["氧化还原", "氧化", "还原", "oxidation", "reduction"]):
            requirement["visualization_type"] = "oxidation_reduction"
            requirement["concepts"] = self._extract_redox(prompt)

        else:
            # 默认为分子结构
            requirement["visualization_type"] = "molecule_structure"
            requirement["concepts"] = self._extract_molecules(prompt)

        # 提取参数
        requirement["parameters"] = self._extract_parameters(prompt, requirement["visualization_type"])

        return requirement

    async def match_template(self, requirement: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        匹配化学学科模板

        Args:
            requirement: 解析后的需求结构

        Returns:
            Dict: 匹配的模板配置
        """
        viz_type = requirement["visualization_type"]

        # 根据概念和参数查找最佳模板
        if viz_type in self.templates:
            templates = self.templates[viz_type]

            # 根据概念匹配
            for template in templates:
                if self._concept_match(requirement["concepts"], template.get("concepts", [])):
                    return template

            # 返回默认模板
            return templates[0] if templates else None

        return None

  
    def _load_domain_knowledge(self) -> Dict[str, Any]:
        """加载化学领域知识"""
        return {
            "elements": {
                "H": {"name": "氢", "atomic_number": 1, "symbol": "H"},
                "O": {"name": "氧", "atomic_number": 8, "symbol": "O"},
                "C": {"name": "碳", "atomic_number": 6, "symbol": "C"},
                "N": {"name": "氮", "atomic_number": 7, "symbol": "N"},
                "Na": {"name": "钠", "atomic_number": 11, "symbol": "Na"},
                "Cl": {"name": "氯", "atomic_number": 17, "symbol": "Cl"},
                "Fe": {"name": "铁", "atomic_number": 26, "symbol": "Fe"},
                "Cu": {"name": "铜", "atomic_number": 29, "symbol": "Cu"},
                "Zn": {"name": "锌", "atomic_number": 30, "symbol": "Zn"},
                "Ca": {"name": "钙", "atomic_number": 20, "symbol": "Ca"}
            },
            "common_molecules": {
                "H2O": {"name": "水", "formula": "H2O", "elements": ["H", "H", "O"]},
                "CO2": {"name": "二氧化碳", "formula": "CO2", "elements": ["C", "O", "O"]},
                "CH4": {"name": "甲烷", "formula": "CH4", "elements": ["C", "H", "H", "H", "H"]},
                "NH3": {"name": "氨", "formula": "NH3", "elements": ["N", "H", "H", "H"]},
                "NaCl": {"name": "氯化钠", "formula": "NaCl", "elements": ["Na", "Cl"]},
                "C6H12O6": {"name": "葡萄糖", "formula": "C6H12O6", "elements": ["C"] * 6 + ["H"] * 12 + ["O"] * 6},
                "C2H5OH": {"name": "乙醇", "formula": "C2H5OH", "elements": ["C"] * 2 + ["H"] * 6 + ["O"]}
            },
            "reaction_types": [
                "synthesis", "decomposition", "single_replacement",
                "double_replacement", "combustion", "acid_base", "redox"
            ]
        }

    def _detect_grade_level(self, prompt: str) -> str:
        """检测年级水平"""
        if any(keyword in prompt for keyword in ["初中", "基础", "简单"]):
            return "middle_school"
        elif any(keyword in prompt for keyword in ["高中", "进阶", "复杂"]):
            return "high_school"
        elif any(keyword in prompt for keyword in ["大学", "专业", "研究"]):
            return "university"
        return "high_school"

    def _extract_molecules(self, prompt: str) -> List[str]:
        """提取分子相关的概念"""
        molecules = []
        prompt_upper = prompt.upper()

        # 常见分子式检测
        common_patterns = [
            r'H2O', r'CO2', r'CH4', r'NH3', r'NaCl', r'C6H12O6', r'C2H5OH',
            r'H2SO4', r'HNO3', r'HCl', r'NaOH', r'KOH', r'CaCO3'
        ]

        for pattern in common_patterns:
            if re.search(pattern, prompt_upper):
                molecules.append(pattern)

        # 水的多种表达
        if any(keyword in prompt for keyword in ["水", "water"]):
            molecules.append("H2O")

        # 二氧化碳
        if any(keyword in prompt for keyword in ["二氧化碳", "carbon dioxide"]):
            molecules.append("CO2")

        # 甲烷
        if any(keyword in prompt for keyword in ["甲烷", "methane"]):
            molecules.append("CH4")

        return molecules if molecules else ["H2O"]  # 默认为水分子

    def _extract_reactions(self, prompt: str) -> List[str]:
        """提取化学反应相关的概念"""
        reactions = []

        if any(keyword in prompt for keyword in ["酸碱", "中和", "neutralization"]):
            reactions.append("acid_base_neutralization")

        if any(keyword in prompt for keyword in ["燃烧", "combustion"]):
            reactions.append("combustion")

        if any(keyword in prompt for keyword in ["氧化", "还原", "oxidation", "reduction"]):
            reactions.append("redox")

        if any(keyword in prompt for keyword in ["分解", "decomposition"]):
            reactions.append("decomposition")

        return reactions if reactions else ["acid_base_neutralization"]

    def _extract_elements(self, prompt: str) -> List[str]:
        """提取元素相关的概念"""
        elements = []

        # 检测常见元素符号
        element_patterns = [
            r'\bH\b', r'\bO\b', r'\bC\b', r'\bN\b', r'\bNa\b',
            r'\bCl\b', r'\bFe\b', r'\bCu\b', r'\bZn\b', r'\bCa\b'
        ]

        for pattern in element_patterns:
            if re.search(pattern, prompt):
                elements.append(pattern.strip('\\b'))

        return elements if elements else ["H", "O", "C"]

    def _extract_bonds(self, prompt: str) -> List[str]:
        """提取化学键相关的概念"""
        bonds = []

        if any(keyword in prompt for keyword in ["共价键", "covalent"]):
            bonds.append("covalent")

        if any(keyword in prompt for keyword in ["离子键", "ionic"]):
            bonds.append("ionic")

        if any(keyword in prompt for keyword in ["氢键", "hydrogen bond"]):
            bonds.append("hydrogen")

        return bonds if bonds else ["covalent"]

    def _extract_acid_base(self, prompt: str) -> List[str]:
        """提取酸碱反应相关的概念"""
        concepts = []

        if any(keyword in prompt for keyword in ["强酸", "strong acid"]):
            concepts.append("strong_acid")

        if any(keyword in prompt for keyword in ["弱酸", "weak acid"]):
            concepts.append("weak_acid")

        if any(keyword in prompt for keyword in ["强碱", "strong base"]):
            concepts.append("strong_base")

        if any(keyword in prompt for keyword in ["弱碱", "weak base"]):
            concepts.append("weak_base")

        if any(keyword in prompt for keyword in ["PH值", "pH"]):
            concepts.append("ph_scale")

        return concepts if concepts else ["acid_base_neutralization"]

    def _extract_redox(self, prompt: str) -> List[str]:
        """提取氧化还原反应相关的概念"""
        concepts = []

        if any(keyword in prompt for keyword in ["氧化剂", "oxidizing agent"]):
            concepts.append("oxidizing_agent")

        if any(keyword in prompt for keyword in ["还原剂", "reducing agent"]):
            concepts.append("reducing_agent")

        if any(keyword in prompt for keyword in ["电子转移", "electron transfer"]):
            concepts.append("electron_transfer")

        return concepts if concepts else ["oxidation_reduction"]

    def _extract_parameters(self, prompt: str, viz_type: str) -> Dict[str, Any]:
        """提取可视化参数"""
        params = {}

        # 检测3D需求
        if any(keyword in prompt for keyword in ["3D", "三维", "立体"]):
            params["render_mode"] = "3d"
        else:
            params["render_mode"] = "2d"

        # 检测动画需求
        if any(keyword in prompt for keyword in ["动画", "动态", "animation"]):
            params["animation"] = True
        else:
            params["animation"] = False

        # 检测交互需求
        if any(keyword in prompt for keyword in ["交互", "interactive", "旋转"]):
            params["interactive"] = True
        else:
            params["interactive"] = False

        return params

    def _concept_match(self, user_concepts: List[str], template_concepts: List[str]) -> bool:
        """检查概念匹配度"""
        if not template_concepts:
            return True

        matches = sum(1 for concept in user_concepts if concept in template_concepts)
        return matches >= len(template_concepts) / 2

    async def _generate_molecule_structure(self, concepts: List[str], template: Dict[str, Any]) -> Dict[str, Any]:
        """生成分子结构可视化"""
        # 这里将调用具体的可视化生成逻辑
        return {
            "type": "molecule_structure",
            "title": f"分子结构: {', '.join(concepts)}",
            "html_content": f"<div class='chemistry-viz'>分子结构可视化待实现</div>",
            "interactive_elements": ["rotate", "zoom", "info"],
            "concepts": concepts
        }

    async def _generate_chemical_reaction(self, concepts: List[str], template: Dict[str, Any]) -> Dict[str, Any]:
        """生成化学反应可视化"""
        return {
            "type": "chemical_reaction",
            "title": f"化学反应: {', '.join(concepts)}",
            "html_content": f"<div class='chemistry-viz'>化学反应可视化待实现</div>",
            "interactive_elements": ["play_animation", "step_by_step"],
            "concepts": concepts
        }

    async def _generate_periodic_table(self, concepts: List[str], template: Dict[str, Any]) -> Dict[str, Any]:
        """生成元素周期表可视化"""
        return {
            "type": "periodic_table",
            "title": "元素周期表",
            "html_content": f"<div class='chemistry-viz'>元素周期表可视化待实现</div>",
            "interactive_elements": ["hover_info", "filter_elements", "highlight_groups"],
            "concepts": concepts
        }

    async def _generate_chemical_bonds(self, concepts: List[str], template: Dict[str, Any]) -> Dict[str, Any]:
        """生成化学键可视化"""
        return {
            "type": "chemical_bonds",
            "title": f"化学键: {', '.join(concepts)}",
            "html_content": f"<div class='chemistry-viz'>化学键可视化待实现</div>",
            "interactive_elements": ["show_bond_info", "animate_formation"],
            "concepts": concepts
        }

    async def _generate_acid_base_reaction(self, concepts: List[str], template: Dict[str, Any]) -> Dict[str, Any]:
        """生成酸碱反应可视化"""
        return {
            "type": "acid_base_reaction",
            "title": f"酸碱反应: {', '.join(concepts)}",
            "html_content": f"<div class='chemistry-viz'>酸碱反应可视化待实现</div>",
            "interactive_elements": ["ph_indicator", "reaction_steps"],
            "concepts": concepts
        }

    async def _generate_oxidation_reduction(self, concepts: List[str], template: Dict[str, Any]) -> Dict[str, Any]:
        """生成氧化还原反应可视化"""
        return {
            "type": "oxidation_reduction",
            "title": f"氧化还原反应: {', '.join(concepts)}",
            "html_content": f"<div class='chemistry-viz'>氧化还原反应可视化待实现</div>",
            "interactive_elements": ["electron_flow", "oxidation_states"],
            "concepts": concepts
        }

    async def _generate_default_chemistry(self, concepts: List[str], template: Dict[str, Any]) -> Dict[str, Any]:
        """生成默认化学可视化"""
        return {
            "type": "chemistry_default",
            "title": "化学概念可视化",
            "html_content": f"<div class='chemistry-viz'>化学可视化待实现</div>",
            "interactive_elements": ["basic_interaction"],
            "concepts": concepts
        }

    async def generate_config(self, requirement: Dict[str, Any], template: Dict[str, Any], user_preferences: Dict[str, Any]) -> Dict[str, Any]:
        """
        生成化学可视化配置

        Args:
            requirement: 化学需求
            template: 匹配的模板
            user_preferences: 用户偏好

        Returns:
            Dict: 可视化配置
        """
        try:
            config = {
                "title": user_preferences.get("title") or self._generate_default_title(requirement),
                "requirement": requirement,
                "template": template,
                "interactive_elements": user_preferences.get("interactive_elements", template.get("interactive_elements", [])),
                "parameters": {**template.get("parameters", {}), **user_preferences.get("parameters", {})},
                "style": user_preferences.get("style", template.get("style", "default")),
                "difficulty": user_preferences.get("difficulty", requirement.get("difficulty", "intermediate"))
            }

            # 化学特有配置
            if requirement["visualization_type"] == "molecule_structure":
                config.update({
                    "render_mode": user_preferences.get("render_mode", "3d"),
                    "show_atoms": user_preferences.get("show_atoms", True),
                    "show_bonds": user_preferences.get("show_bonds", True),
                    "color_scheme": user_preferences.get("color_scheme", "cpk")
                })
            elif requirement["visualization_type"] == "chemical_reaction":
                config.update({
                    "animation_speed": user_preferences.get("animation_speed", 1.0),
                    "show_energy": user_preferences.get("show_energy", False),
                    "reaction_steps": user_preferences.get("reaction_steps", True)
                })

            return config

        except Exception as e:
            print(f"化学配置生成失败: {str(e)}")
            return {
                "title": "化学可视化",
                "requirement": requirement,
                "template": template,
                "interactive_elements": [],
                "parameters": {},
                "style": "default",
                "difficulty": "intermediate"
            }

    async def generate_visualization(self, config: Dict[str, Any]) -> str:
        """
        生成可视化HTML内容

        Args:
            config: 可视化配置

        Returns:
            str: 生成的HTML内容
        """
        try:
            requirement = config["requirement"]
            template = config["template"]

            # 根据可视化类型调用具体的生成方法
            viz_type = requirement["visualization_type"]
            concepts = requirement["concepts"]

            if viz_type == "molecule_structure":
                visualization_data = await self._generate_molecule_structure(concepts, template)
            elif viz_type == "chemical_reaction":
                visualization_data = await self._generate_chemical_reaction(concepts, template)
            elif viz_type == "periodic_table":
                visualization_data = await self._generate_periodic_table(concepts, template)
            elif viz_type == "chemical_bonds":
                visualization_data = await self._generate_chemical_bonds(concepts, template)
            elif viz_type == "acid_base_reaction":
                visualization_data = await self._generate_acid_base_reaction(concepts, template)
            elif viz_type == "oxidation_reduction":
                visualization_data = await self._generate_oxidation_reduction(concepts, template)
            else:
                visualization_data = await self._generate_default_chemistry(concepts, template)

            # 如果模板有HTML模板，则渲染
            if template.get("html_template"):
                return self._render_template(template["html_template"], {
                    **config,
                    **visualization_data,
                    "title": config["title"]
                })
            else:
                # 返回基本的HTML
                return f"""
                <!DOCTYPE html>
                <html lang="zh-CN">
                <head>
                    <meta charset="UTF-8">
                    <title>{config["title"]}</title>
                    <style>
                        body {{ font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }}
                        .container {{ max-width: 800px; margin: 0 auto; background: white; padding: 20px; border-radius: 10px; }}
                        h1 {{ color: #333; text-align: center; }}
                        .visualization {{ margin: 20px 0; text-align: center; }}
                    </style>
                </head>
                <body>
                    <div class="container">
                        <h1>{config["title"]}</h1>
                        <div class="visualization">
                            <p>化学可视化生成中...</p>
                            <p>类型: {visualization_data.get("type", "未知")}</p>
                            <p>概念: {', '.join(visualization_data.get("concepts", []))}</p>
                        </div>
                    </div>
                </body>
                </html>
                """

        except Exception as e:
            print(f"化学HTML生成失败: {str(e)}")
            return f"""
            <!DOCTYPE html>
            <html lang="zh-CN">
            <head>
                <meta charset="UTF-8">
                <title>化学可视化</title>
                <style>
                    body {{ font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }}
                    .container {{ max-width: 800px; margin: 0 auto; background: white; padding: 20px; border-radius: 10px; }}
                    .error {{ color: red; text-align: center; padding: 20px; }}
                </style>
            </head>
            <body>
                <div class="container">
                    <h1>化学可视化</h1>
                    <div class="error">
                        <p>可视化生成过程中发生错误</p>
                        <p>错误信息: {str(e)}</p>
                    </div>
                </div>
            </body>
            </html>
            """

    def _generate_default_title(self, requirement: Dict[str, Any]) -> str:
        """生成默认标题"""
        viz_type = requirement.get("visualization_type", "chemistry")
        concepts = requirement.get("concepts", [])

        type_names = {
            "molecule_structure": "分子结构",
            "chemical_reaction": "化学反应",
            "periodic_table": "元素周期表",
            "chemical_bonds": "化学键",
            "acid_base_reaction": "酸碱反应",
            "oxidation_reduction": "氧化还原反应"
        }

        base_title = type_names.get(viz_type, "化学可视化")
        if concepts:
            base_title += f" - {', '.join(concepts[:3])}"

        return base_title

    def _render_template(self, template_str: str, data: Dict[str, Any]) -> str:
        """简单的模板渲染"""
        try:
            result = template_str
            for key, value in data.items():
                if isinstance(value, (str, int, float)):
                    result = result.replace(f"{{{{{key}}}}}", str(value))
                elif isinstance(value, dict):
                    result = result.replace(f"{{{{{key}}}}}", str(value))
                elif isinstance(value, list):
                    result = result.replace(f"{{{{{key}}}}}", str(value))
            return result
        except Exception as e:
            print(f"模板渲染失败: {str(e)}")
            return template_str

    def get_supported_topics(self) -> List[str]:
        """
        获取支持的化学主题

        Returns:
            List[str]: 支持的主题列表
        """
        return [
            "分子结构",
            "化学键",
            "化学反应",
            "酸碱反应",
            "氧化还原反应",
            "元素周期表",
            "原子结构",
            "有机化学",
            "无机化学",
            "化学计量",
            "溶液化学",
            "电化学",
            "化学平衡"
        ]

    def get_agent_info(self) -> Dict[str, Any]:
        """
        获取Agent信息

        Returns:
            Dict[str, Any]: Agent信息
        """
        return {
            "agent_id": self.agent_id,
            "subject": self.subject,
            "version": "1.0.0",
            "supported_topics": self.get_supported_topics(),
            "supported_visualizations": self.config.get("supported_visualizations", []),
            "template_count": len(self.templates),
            "capabilities": [
                "分子结构可视化",
                "化学反应动画",
                "元素周期表展示",
                "化学键可视化",
                "酸碱中和反应",
                "氧化还原过程"
            ]
        }