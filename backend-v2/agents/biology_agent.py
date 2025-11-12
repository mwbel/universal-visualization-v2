"""
万物可视化 v2.0 - 生物学科Agent
专门处理高中生物的可视化需求，包括细胞结构、DNA、遗传学、生态系统等
"""

from typing import Dict, List, Optional, Any, Union
import json
import re
from agents.base_agent import BaseVisualizationAgent

class BiologyAgent(BaseVisualizationAgent):
    """生物学科可视化Agent"""

    def __init__(self, config: Dict[str, Any] = None):
        """
        初始化生物Agent

        Args:
            config: Agent配置参数
        """
        default_config = {
            "supported_visualizations": [
                "cell_structure",          # 细胞结构
                "dna_structure",           # DNA双螺旋结构
                "protein_synthesis",       # 蛋白质合成
                "photosynthesis",          # 光合作用
                "cell_respiration",        # 细胞呼吸
                "genetics_inheritance",    # 遗传学
                "ecosystem_food_chain",    # 生态食物链
                "human_body_systems",      # 人体系统
                "plant_structure",         # 植物结构
                "evolution_tree"           # 进化树
            ],
            "default_grade_level": "high_school",
            "template_path": "templates/biology/",
            "keywords": [
                "细胞", "DNA", "基因", "遗传", "蛋白质", "光合作用", "呼吸作用",
                "生态系统", "食物链", "进化", "植物", "动物", "人体", "器官",
                "染色体", "细胞核", "线粒体", "叶绿体", "细胞膜", "细胞壁",
                "核糖体", "内质网", "高尔基体", "溶酶体", "液泡", "中心体",
                "cell", "DNA", "gene", "genetics", "protein", "photosynthesis",
                "respiration", "ecosystem", "food chain", "evolution", "plant",
                "animal", "human body", "organ", "chromosome", "nucleus", "mitochondria"
            ]
        }

        if config:
            default_config.update(config)

        super().__init__("biology", default_config)

    async def parse_requirement(self, prompt: str) -> Dict[str, Any]:
        """
        解析生物学科需求

        Args:
            prompt: 用户输入的自然语言描述

        Returns:
            Dict: 解析后的结构化需求
        """
        requirement = {
            "subject": "biology",
            "grade_level": self._detect_grade_level(prompt),
            "visualization_type": None,
            "concepts": [],
            "parameters": {},
            "difficulty": "intermediate"
        }

        # 识别可视化类型
        prompt_lower = prompt.lower()

        if any(keyword in prompt_lower for keyword in ["细胞", "细胞结构", "cell", "cell structure"]):
            requirement["visualization_type"] = "cell_structure"
            requirement["concepts"] = self._extract_cell_concepts(prompt)

        elif any(keyword in prompt_lower for keyword in ["DNA", "双螺旋", "遗传物质", "脱氧核糖核酸"]):
            requirement["visualization_type"] = "dna_structure"
            requirement["concepts"] = self._extract_dna_concepts(prompt)

        elif any(keyword in prompt_lower for keyword in ["蛋白质", "protein", "合成", "translation"]):
            requirement["visualization_type"] = "protein_synthesis"
            requirement["concepts"] = self._extract_protein_concepts(prompt)

        elif any(keyword in prompt_lower for keyword in ["光合作用", "photosynthesis", "植物", "叶绿体"]):
            requirement["visualization_type"] = "photosynthesis"
            requirement["concepts"] = self._extract_photosynthesis_concepts(prompt)

        elif any(keyword in prompt_lower for keyword in ["呼吸作用", "respiration", "细胞呼吸", "有氧呼吸"]):
            requirement["visualization_type"] = "cell_respiration"
            requirement["concepts"] = self._extract_respiration_concepts(prompt)

        elif any(keyword in prompt_lower for keyword in ["遗传", "基因", "gene", "genetics", "孟德尔"]):
            requirement["visualization_type"] = "genetics_inheritance"
            requirement["concepts"] = self._extract_genetics_concepts(prompt)

        elif any(keyword in prompt_lower for keyword in ["生态", "食物链", "ecosystem", "food chain", "生产者"]):
            requirement["visualization_type"] = "ecosystem_food_chain"
            requirement["concepts"] = self._extract_ecosystem_concepts(prompt)

        elif any(keyword in prompt_lower for keyword in ["人体", "器官", "系统", "human body", "organ system"]):
            requirement["visualization_type"] = "human_body_systems"
            requirement["concepts"] = self._extract_body_systems_concepts(prompt)

        elif any(keyword in prompt_lower for keyword in ["进化", "evolution", "达尔文", "物种起源"]):
            requirement["visualization_type"] = "evolution_tree"
            requirement["concepts"] = self._extract_evolution_concepts(prompt)

        elif any(keyword in prompt_lower for keyword in ["植物", "plant", "根", "茎", "叶", "花", "果实"]):
            requirement["visualization_type"] = "plant_structure"
            requirement["concepts"] = self._extract_plant_concepts(prompt)

        else:
            # 默认为细胞结构
            requirement["visualization_type"] = "cell_structure"
            requirement["concepts"] = self._extract_cell_concepts(prompt)

        # 提取参数
        requirement["parameters"] = self._extract_parameters(prompt, requirement["visualization_type"])

        return requirement

    async def match_template(self, requirement: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        匹配生物学科模板

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
        """加载生物领域知识"""
        return {
            "cell_organelles": {
                "nucleus": {"name": "细胞核", "function": "遗传物质存储和转录"},
                "mitochondria": {"name": "线粒体", "function": "细胞呼吸和能量产生"},
                "chloroplast": {"name": "叶绿体", "function": "光合作用"},
                "ribosome": {"name": "核糖体", "function": "蛋白质合成"},
                "endoplasmic_reticulum": {"name": "内质网", "function": "蛋白质加工和脂质合成"},
                "golgi_apparatus": {"name": "高尔基体", "function": "蛋白质包装和分泌"},
                "lysosome": {"name": "溶酶体", "function": "分解和消化"},
                "vacuole": {"name": "液泡", "function": "储存物质"},
                "cell_membrane": {"name": "细胞膜", "function": "控制物质进出"},
                "cell_wall": {"name": "细胞壁", "function": "支持和保护"}
            },
            "dna_components": {
                "adenine": {"name": "腺嘌呤", "symbol": "A", "complement": "T"},
                "thymine": {"name": "胸腺嘧啶", "symbol": "T", "complement": "A"},
                "guanine": {"name": "鸟嘌呤", "symbol": "G", "complement": "C"},
                "cytosine": {"name": "胞嘧啶", "symbol": "C", "complement": "G"},
                "phosphate": {"name": "磷酸基团", "symbol": "P"},
                "deoxyribose": {"name": "脱氧核糖", "symbol": "D"}
            },
            "genetics_terms": [
                "gene", "allele", "dominant", "recessive", "homozygous", "heterozygous",
                "genotype", "phenotype", "mutation", "chromosome", "meiosis", "mitosis"
            ],
            "ecosystem_levels": [
                "organism", "population", "community", "ecosystem", "biosphere"
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

    def _extract_cell_concepts(self, prompt: str) -> List[str]:
        """提取细胞相关概念"""
        concepts = []

        # 检测细胞类型
        if any(keyword in prompt for keyword in ["动物细胞", "animal cell"]):
            concepts.append("animal_cell")
        if any(keyword in prompt for keyword in ["植物细胞", "plant cell"]):
            concepts.append("plant_cell")
        if any(keyword in prompt for keyword in ["细菌", "bacteria", "原核细胞"]):
            concepts.append("prokaryotic_cell")

        # 检测细胞器
        organelles = ["nucleus", "mitochondria", "chloroplast", "ribosome",
                     "endoplasmic_reticulum", "golgi_apparatus", "lysosome", "vacuole"]

        organelle_keywords = {
            "nucleus": ["细胞核", "nucleus"],
            "mitochondria": ["线粒体", "mitochondria"],
            "chloroplast": ["叶绿体", "chloroplast"],
            "ribosome": ["核糖体", "ribosome"],
            "endoplasmic_reticulum": ["内质网", "endoplasmic reticulum", "ER"],
            "golgi_apparatus": ["高尔基体", "golgi apparatus", "golgi body"],
            "lysosome": ["溶酶体", "lysosome"],
            "vacuole": ["液泡", "vacuole"]
        }

        for organelle, keywords in organelle_keywords.items():
            if any(keyword in prompt for keyword in keywords):
                concepts.append(organelle)

        return concepts if concepts else ["animal_cell", "nucleus"]

    def _extract_dna_concepts(self, prompt: str) -> List[str]:
        """提取DNA相关概念"""
        concepts = []

        if any(keyword in prompt for keyword in ["双螺旋", "double helix"]):
            concepts.append("double_helix")
        if any(keyword in prompt for keyword in ["复制", "replication"]):
            concepts.append("replication")
        if any(keyword in prompt for keyword in ["转录", "transcription"]):
            concepts.append("transcription")
        if any(keyword in prompt for keyword in ["碱基", "base", "ATCG"]):
            concepts.append("base_pairs")

        return concepts if concepts else ["double_helix", "base_pairs"]

    def _extract_protein_concepts(self, prompt: str) -> List[str]:
        """提取蛋白质相关概念"""
        concepts = []

        if any(keyword in prompt for keyword in ["翻译", "translation"]):
            concepts.append("translation")
        if any(keyword in prompt for keyword in ["氨基酸", "amino acid"]):
            concepts.append("amino_acids")
        if any(keyword in prompt for keyword in ["折叠", "folding"]):
            concepts.append("protein_folding")
        if any(keyword in prompt for keyword in ["酶", "enzyme"]):
            concepts.append("enzyme")

        return concepts if concepts else ["translation", "amino_acids"]

    def _extract_photosynthesis_concepts(self, prompt: str) -> List[str]:
        """提取光合作用相关概念"""
        concepts = []

        if any(keyword in prompt for keyword in ["光反应", "light reactions"]):
            concepts.append("light_reactions")
        if any(keyword in prompt for keyword in ["暗反应", "dark reactions", "calvin cycle"]):
            concepts.append("dark_reactions")
        if any(keyword in prompt for keyword in ["叶绿素", "chlorophyll"]):
            concepts.append("chlorophyll")
        if any(keyword in prompt for keyword in ["二氧化碳", "CO2"]):
            concepts.append("carbon_dioxide")
        if any(keyword in prompt for keyword in ["氧气", "O2"]):
            concepts.append("oxygen")

        return concepts if concepts else ["light_reactions", "dark_reactions"]

    def _extract_respiration_concepts(self, prompt: str) -> List[str]:
        """提取呼吸作用相关概念"""
        concepts = []

        if any(keyword in prompt for keyword in ["有氧呼吸", "aerobic respiration"]):
            concepts.append("aerobic_respiration")
        if any(keyword in prompt for keyword in ["无氧呼吸", "anaerobic respiration"]):
            concepts.append("anaerobic_respiration")
        if any(keyword in prompt for keyword in ["糖酵解", "glycolysis"]):
            concepts.append("glycolysis")
        if any(keyword in prompt for keyword in ["三羧酸循环", "citric acid cycle", "Krebs cycle"]):
            concepts.append("citric_acid_cycle")
        if any(keyword in prompt for keyword in ["电子传递链", "electron transport chain"]):
            concepts.append("electron_transport")

        return concepts if concepts else ["aerobic_respiration"]

    def _extract_genetics_concepts(self, prompt: str) -> List[str]:
        """提取遗传学相关概念"""
        concepts = []

        if any(keyword in prompt for keyword in ["孟德尔", "Mendel", "遗传定律"]):
            concepts.append("mendelian_genetics")
        if any(keyword in prompt for keyword in ["显性", "dominant"]):
            concepts.append("dominant")
        if any(keyword in prompt for keyword in ["隐性", "recessive"]):
            concepts.append("recessive")
        if any(keyword in prompt for keyword in ["基因型", "genotype"]):
            concepts.append("genotype")
        if any(keyword in prompt for keyword in ["表现型", "phenotype"]):
            concepts.append("phenotype")
        if any(keyword in prompt for keyword in ["突变", "mutation"]):
            concepts.append("mutation")

        return concepts if concepts else ["mendelian_genetics"]

    def _extract_ecosystem_concepts(self, prompt: str) -> List[str]:
        """提取生态系统相关概念"""
        concepts = []

        if any(keyword in prompt for keyword in ["生产者", "producer"]):
            concepts.append("producer")
        if any(keyword in prompt for keyword in ["消费者", "consumer"]):
            concepts.append("consumer")
        if any(keyword in prompt for keyword in ["分解者", "decomposer"]):
            concepts.append("decomposer")
        if any(keyword in prompt for keyword in ["食物链", "food chain"]):
            concepts.append("food_chain")
        if any(keyword in prompt for keyword in ["食物网", "food web"]):
            concepts.append("food_web")

        return concepts if concepts else ["food_chain", "producer", "consumer"]

    def _extract_body_systems_concepts(self, prompt: str) -> List[str]:
        """提取人体系统相关概念"""
        concepts = []

        systems = {
            "循环系统": ["循环系统", "心血管", "heart", "blood", "circulatory"],
            "呼吸系统": ["呼吸系统", "肺", "lung", "respiratory"],
            "消化系统": ["消化系统", "胃", "肠", "digestive"],
            "神经系统": ["神经系统", "神经", "大脑", "nervous", "brain"],
            "内分泌系统": ["内分泌", "激素", "endocrine", "hormone"],
            "骨骼系统": ["骨骼", "骨头", "skeletal", "bone"],
            "肌肉系统": ["肌肉", "muscular", "muscle"]
        }

        for system, keywords in systems.items():
            if any(keyword in prompt for keyword in keywords):
                concepts.append(system.lower().replace("系统", ""))

        return concepts if concepts else ["循环系统", "呼吸系统"]

    def _extract_evolution_concepts(self, prompt: str) -> List[str]:
        """提取进化相关概念"""
        concepts = []

        if any(keyword in prompt for keyword in ["自然选择", "natural selection"]):
            concepts.append("natural_selection")
        if any(keyword in prompt for keyword in ["适应性", "adaptation"]):
            concepts.append("adaptation")
        if any(keyword in prompt for keyword in ["物种", "species"]):
            concepts.append("speciation")
        if any(keyword in prompt for keyword in ["共同祖先", "common ancestor"]):
            concepts.append("common_ancestor")

        return concepts if concepts else ["natural_selection", "evolution"]

    def _extract_plant_concepts(self, prompt: str) -> List[str]:
        """提取植物相关概念"""
        concepts = []

        plant_parts = {
            "根": ["根", "root"],
            "茎": ["茎", "stem"],
            "叶": ["叶", "leaf"],
            "花": ["花", "flower"],
            "果实": ["果实", "fruit"],
            "种子": ["种子", "seed"]
        }

        for part, keywords in plant_parts.items():
            if any(keyword in prompt for keyword in keywords):
                concepts.append(part)

        return concepts if concepts else ["根", "茎", "叶", "花"]

    def _extract_parameters(self, prompt: str, viz_type: str) -> Dict[str, Any]:
        """提取可视化参数"""
        params = {}

        # 检测3D需求
        if any(keyword in prompt for keyword in ["3D", "三维", "立体"]):
            params["render_mode"] = "3d"
        else:
            params["render_mode"] = "2d"

        # 检测动画需求
        if any(keyword in prompt for keyword in ["动画", "动态", "animation", "过程"]):
            params["animation"] = True
        else:
            params["animation"] = False

        # 检测交互需求
        if any(keyword in prompt for keyword in ["交互", "interactive", "点击", "hover"]):
            params["interactive"] = True
        else:
            params["interactive"] = False

        # 检测详细程度
        if any(keyword in prompt for keyword in ["详细", "detail", "深入"]):
            params["detail_level"] = "high"
        elif any(keyword in prompt for keyword in ["简单", "基础", "basic"]):
            params["detail_level"] = "low"
        else:
            params["detail_level"] = "medium"

        return params

    def _concept_match(self, user_concepts: List[str], template_concepts: List[str]) -> bool:
        """检查概念匹配度"""
        if not template_concepts:
            return True

        matches = sum(1 for concept in user_concepts if concept in template_concepts)
        return matches >= len(template_concepts) / 2

    async def _generate_cell_structure(self, concepts: List[str], template: Dict[str, Any]) -> Dict[str, Any]:
        """生成细胞结构可视化"""
        return {
            "type": "cell_structure",
            "title": f"细胞结构: {', '.join(concepts)}",
            "html_content": "<div class='biology-viz'>细胞结构可视化待实现</div>",
            "interactive_elements": ["hover_organelle", "zoom", "rotate"],
            "concepts": concepts
        }

    async def _generate_dna_structure(self, concepts: List[str], template: Dict[str, Any]) -> Dict[str, Any]:
        """生成DNA结构可视化"""
        return {
            "type": "dna_structure",
            "title": f"DNA结构: {', '.join(concepts)}",
            "html_content": "<div class='biology-viz'>DNA双螺旋结构可视化待实现</div>",
            "interactive_elements": ["rotate_helix", "show_base_pairs", "animate_replication"],
            "concepts": concepts
        }

    async def _generate_protein_synthesis(self, concepts: List[str], template: Dict[str, Any]) -> Dict[str, Any]:
        """生成蛋白质合成可视化"""
        return {
            "type": "protein_synthesis",
            "title": f"蛋白质合成: {', '.join(concepts)}",
            "html_content": "<div class='biology-viz'>蛋白质合成过程可视化待实现</div>",
            "interactive_elements": ["step_by_step", "show_amino_acids", "animate_translation"],
            "concepts": concepts
        }

    async def _generate_photosynthesis(self, concepts: List[str], template: Dict[str, Any]) -> Dict[str, Any]:
        """生成光合作用可视化"""
        return {
            "type": "photosynthesis",
            "title": f"光合作用: {', '.join(concepts)}",
            "html_content": "<div class='biology-viz'>光合作用过程可视化待实现</div>",
            "interactive_elements": ["light_reactions", "dark_reactions", "energy_flow"],
            "concepts": concepts
        }

    async def _generate_cell_respiration(self, concepts: List[str], template: Dict[str, Any]) -> Dict[str, Any]:
        """生成细胞呼吸可视化"""
        return {
            "type": "cell_respiration",
            "title": f"细胞呼吸: {', '.join(concepts)}",
            "html_content": "<div class='biology-viz'>细胞呼吸过程可视化待实现</div>",
            "interactive_elements": ["glycolysis", "citric_acid_cycle", "electron_transport"],
            "concepts": concepts
        }

    async def _generate_genetics_inheritance(self, concepts: List[str], template: Dict[str, Any]) -> Dict[str, Any]:
        """生成遗传学可视化"""
        return {
            "type": "genetics_inheritance",
            "title": f"遗传学: {', '.join(concepts)}",
            "html_content": "<div class='biology-viz'>遗传学规律可视化待实现</div>",
            "interactive_elements": ["punnett_square", "genotype_calculator", "phenotype_display"],
            "concepts": concepts
        }

    async def _generate_ecosystem_food_chain(self, concepts: List[str], template: Dict[str, Any]) -> Dict[str, Any]:
        """生成生态系统食物链可视化"""
        return {
            "type": "ecosystem_food_chain",
            "title": f"生态系统: {', '.join(concepts)}",
            "html_content": "<div class='biology-viz'>生态系统食物链可视化待实现</div>",
            "interactive_elements": ["energy_flow", "organism_info", "trophic_levels"],
            "concepts": concepts
        }

    async def _generate_human_body_systems(self, concepts: List[str], template: Dict[str, Any]) -> Dict[str, Any]:
        """生成人体系统可视化"""
        return {
            "type": "human_body_systems",
            "title": f"人体系统: {', '.join(concepts)}",
            "html_content": "<div class='biology-viz'>人体系统可视化待实现</div>",
            "interactive_elements": ["organ_highlight", "system_info", "interaction_demo"],
            "concepts": concepts
        }

    async def _generate_plant_structure(self, concepts: List[str], template: Dict[str, Any]) -> Dict[str, Any]:
        """生成植物结构可视化"""
        return {
            "type": "plant_structure",
            "title": f"植物结构: {', '.join(concepts)}",
            "html_content": "<div class='biology-viz'>植物结构可视化待实现</div>",
            "interactive_elements": ["part_info", "growth_stages", "function_display"],
            "concepts": concepts
        }

    async def _generate_evolution_tree(self, concepts: List[str], template: Dict[str, Any]) -> Dict[str, Any]:
        """生成进化树可视化"""
        return {
            "type": "evolution_tree",
            "title": f"生物进化: {', '.join(concepts)}",
            "html_content": "<div class='biology-viz'>进化树可视化待实现</div>",
            "interactive_elements": ["timeline", "species_info", "branch_exploration"],
            "concepts": concepts
        }

    async def _generate_default_biology(self, concepts: List[str], template: Dict[str, Any]) -> Dict[str, Any]:
        """生成默认生物可视化"""
        return {
            "type": "biology_default",
            "title": "生物概念可视化",
            "html_content": "<div class='biology-viz'>生物可视化待实现</div>",
            "interactive_elements": ["basic_interaction"],
            "concepts": concepts
        }

    async def generate_config(self, requirement: Dict[str, Any], template: Dict[str, Any], user_preferences: Dict[str, Any]) -> Dict[str, Any]:
        """
        生成生物可视化配置

        Args:
            requirement: 生物需求
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

            # 生物特有配置
            if requirement["visualization_type"] == "cell_structure":
                config.update({
                    "cell_type": user_preferences.get("cell_type", "animal"),
                    "show_labels": user_preferences.get("show_labels", True),
                    "detail_level": user_preferences.get("detail_level", "detailed"),
                    "interactive": user_preferences.get("interactive", True)
                })
            elif requirement["visualization_type"] == "dna_structure":
                config.update({
                    "rotation": user_preferences.get("rotation", True),
                    "show_base_pairs": user_preferences.get("show_base_pairs", True),
                    "detail_level": user_preferences.get("detail_level", "detailed"),
                    "color_scheme": user_preferences.get("color_scheme", "classic")
                })

            return config

        except Exception as e:
            print(f"生物配置生成失败: {str(e)}")
            return {
                "title": "生物可视化",
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

            if viz_type == "cell_structure":
                visualization_data = await self._generate_cell_structure(concepts, template)
            elif viz_type == "dna_structure":
                visualization_data = await self._generate_dna_structure(concepts, template)
            elif viz_type == "protein_synthesis":
                visualization_data = await self._generate_protein_synthesis(concepts, template)
            elif viz_type == "photosynthesis":
                visualization_data = await self._generate_photosynthesis(concepts, template)
            elif viz_type == "cell_respiration":
                visualization_data = await self._generate_cell_respiration(concepts, template)
            elif viz_type == "genetics_inheritance":
                visualization_data = await self._generate_genetics_inheritance(concepts, template)
            elif viz_type == "ecosystem_food_chain":
                visualization_data = await self._generate_ecosystem_food_chain(concepts, template)
            elif viz_type == "human_body_systems":
                visualization_data = await self._generate_human_body_systems(concepts, template)
            elif viz_type == "plant_structure":
                visualization_data = await self._generate_plant_structure(concepts, template)
            elif viz_type == "evolution_tree":
                visualization_data = await self._generate_evolution_tree(concepts, template)
            else:
                visualization_data = await self._generate_default_biology(concepts, template)

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
                            <p>生物可视化生成中...</p>
                            <p>类型: {visualization_data.get("type", "未知")}</p>
                            <p>概念: {', '.join(visualization_data.get("concepts", []))}</p>
                        </div>
                    </div>
                </body>
                </html>
                """

        except Exception as e:
            print(f"生物HTML生成失败: {str(e)}")
            return f"""
            <!DOCTYPE html>
            <html lang="zh-CN">
            <head>
                <meta charset="UTF-8">
                <title>生物可视化</title>
                <style>
                    body {{ font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }}
                    .container {{ max-width: 800px; margin: 0 auto; background: white; padding: 20px; border-radius: 10px; }}
                    .error {{ color: red; text-align: center; padding: 20px; }}
                </style>
            </head>
            <body>
                <div class="container">
                    <h1>生物可视化</h1>
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
        viz_type = requirement.get("visualization_type", "biology")
        concepts = requirement.get("concepts", [])

        type_names = {
            "cell_structure": "细胞结构",
            "dna_structure": "DNA结构",
            "protein_synthesis": "蛋白质合成",
            "photosynthesis": "光合作用",
            "cell_respiration": "细胞呼吸",
            "genetics_inheritance": "遗传学",
            "ecosystem_food_chain": "生态系统",
            "human_body_systems": "人体系统",
            "plant_structure": "植物结构",
            "evolution_tree": "进化树"
        }

        base_title = type_names.get(viz_type, "生物可视化")
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
        获取支持的主题

        Returns:
            List[str]: 支持的主题列表
        """
        return [
            "细胞结构",
            "DNA双螺旋",
            "基因表达",
            "蛋白质合成",
            "光合作用",
            "细胞呼吸",
            "遗传学",
            "进化论",
            "生态系统",
            "人体系统",
            "植物结构",
            "生物多样性",
            "微生物学",
            "分子生物学",
            "生物技术"
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
                "细胞结构可视化",
                "DNA双螺旋展示",
                "生物过程动画",
                "遗传学交互演示",
                "生态系统模型",
                "人体系统模拟"
            ]
        }