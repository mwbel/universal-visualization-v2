"""
万物可视化 v2.0 - 数学学科Agent
处理数学相关的可视化需求，包括概率统计、线性代数、微积分等
"""

from typing import Dict, List, Optional, Any
import json
import math
import datetime
import numpy as np
from .base_agent import BaseVisualizationAgent, VisualizationError, RequirementParseError

class MathematicsAgent(BaseVisualizationAgent):
    """数学学科可视化Agent"""

    def __init__(self):
        super().__init__("mathematics", {
            "supported_distributions": [
                "normal", "binomial", "poisson", "uniform",
                "exponential", "chi_square", "t"
            ],
            "supported_fields": [
                "probability", "statistics", "linear_algebra",
                "calculus", "geometry", "algebra"
            ],
            "supported_concepts": {
                "linear_algebra": [
                    "二阶行列式", "三阶行列式", "向量投影", "向量空间",
                    "旋转矩阵", "正交分解", "特征值分解", "矩阵运算",
                    "高斯消元法", "线性变换"
                ],
                "probability": [
                    "正态分布", "二项分布", "泊松分布", "均匀分布",
                    "指数分布", "卡方分布", "t分布"
                ]
            }
        })

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
                "raw_text": prompt
            }

            # 1. 识别数学领域
            field_patterns = {
                "probability": ["概率", "统计", "分布", "随机", "期望", "方差"],
                "linear_algebra": ["矩阵", "向量", "行列式", "线性", "变换", "特征值"],
                "calculus": ["导数", "积分", "极限", "微分", "函数", "曲线"],
                "geometry": ["几何", "图形", "角度", "长度", "面积", "体积"],
                "algebra": ["方程", "代数", "多项式", "根", "系数", "变量"]
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
                    "t": "t"
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
                    "旋转": "rotation_matrix"
                }

                # 精确匹配
                for concept in la_concepts:
                    if concept in prompt:
                        requirement["concept_type"] = "linear_algebra"
                        requirement["template_id"] = concept_mapping.get(concept, concept)
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
                            requirement["parameters"]["p"] = min(1.0, max(0.0, numbers[1]))
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

    async def match_template(self, requirement: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        匹配数学模板

        Args:
            requirement: 解析后的数学需求

        Returns:
            Dict: 匹配的模板配置
        """
        try:
            # 使用模板引擎进行匹配
            if hasattr(self, 'template_engine') and self.template_engine:
                # 搜索匹配的模板
                search_query = requirement.get("original", "")
                dist_type = requirement.get("distribution_type")

                # 如果识别了分布类型，优先匹配
                if dist_type:
                    subject_templates = await self.template_engine.get_subject_templates("mathematics")
                    for template in subject_templates:
                        if template.get("id") == f"{dist_type}_distribution":
                            return template

                # 通用搜索
                matched_templates = await self.template_engine.search_templates(search_query, "mathematics")
                if matched_templates:
                    return matched_templates[0]

            # 回退到内置模板
            return await self._match_builtin_template(requirement)

        except Exception as e:
            raise VisualizationError(f"模板匹配失败: {str(e)}")

    async def _match_builtin_template(self, requirement: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        回退到内置模板匹配

        Args:
            requirement: 解析后的数学需求

        Returns:
            Dict: 匹配的模板配置
        """
        try:
            # 1. 概率分布模板匹配
            if requirement.get("concept_type") == "distribution":
                dist_type = requirement.get("distribution_type")
                if dist_type in self.templates:
                    return self.templates[dist_type]

            # 2. 线性代数模板匹配
            elif requirement.get("concept_type") == "linear_algebra":
                concept = requirement.get("la_concept")
                template_key = f"la_{concept}"
                if template_key in self.templates:
                    return self.templates[template_key]

            # 3. 默认数学模板
            else:
                return self.templates.get("default_math", None)

        except Exception as e:
            raise VisualizationError(f"内置模板匹配失败: {str(e)}")

    async def generate_config(self, requirement: Dict[str, Any], template: Dict[str, Any], user_preferences: Dict[str, Any]) -> Dict[str, Any]:
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
                "title": user_preferences.get("title") or self._generate_default_title(requirement),
                "subject": "mathematics",
                "field": requirement.get("field", "general"),
                "concept_type": requirement.get("concept_type"),
                "template_id": template.get("id"),
                "parameters": requirement.get("parameters", {}),
                "numbers": requirement.get("numbers", []),
                "user_preferences": user_preferences,
                "interactive": True,
                "responsive": True
            }

            # 根据不同概念类型添加特定配置
            if requirement.get("distribution_type"):
                config.update({
                    "chart_type": "line",
                    "x_range": [-5, 5] if requirement["distribution_type"] == "normal" else [0, 20],
                    "show_statistics": True,
                    "show_probability": True
                })

            elif requirement.get("la_concept"):
                config.update({
                    "chart_type": "geometric",
                    "show_matrix": True,
                    "show_vectors": True,
                    "3d_enabled": requirement.get("la_concept") in ["向量空间", "特征值分解"]
                })

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
            # 生成简单的可视化HTML，绕过复杂的模板系统
            requirement = config.get("requirement", {})
            title = config.get("title", "数学可视化")
            viz_type = requirement.get("visualization_type", "function_graph")
            concepts = requirement.get("concepts", [])

            return f"""
            <!DOCTYPE html>
            <html lang="zh-CN">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>{title}</title>
                <style>
                    body {{
                        font-family: Arial, sans-serif;
                        margin: 20px;
                        background: #f5f5f5;
                    }}
                    .container {{
                        max-width: 800px;
                        margin: 0 auto;
                        background: white;
                        padding: 20px;
                        border-radius: 8px;
                        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                    }}
                    .header {{
                        text-align: center;
                        margin-bottom: 30px;
                    }}
                    .visualization {{
                        background: #e8f4fd;
                        padding: 20px;
                        border-radius: 5px;
                        margin: 20px 0;
                        text-align: center;
                    }}
                    .concept {{
                        background: #f0f8ff;
                        padding: 10px;
                        margin: 5px;
                        border-radius: 3px;
                        display: inline-block;
                    }}
                    canvas {{
                        border: 1px solid #ddd;
                        background: white;
                        margin: 10px 0;
                    }}
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>{title}</h1>
                        <p>类型: {viz_type}</p>
                        <p>概念: {', '.join(concepts) if concepts else '无'}</p>
                    </div>

                    <div class="visualization">
                        <h3>📊 数学可视化</h3>
                        <canvas id="mathCanvas" width="700" height="400"></canvas>
                        <p>这是一个基础的数学可视化界面，展示了数学函数的关系</p>
                    </div>

                    <div class="info">
                        <h3>ℹ️ 相关信息</h3>
                        <p><strong>学科:</strong> 数学</p>
                        <p><strong>年级:</strong> {config.get('grade_level', 'high_school')}</p>
                        <p><strong>生成时间:</strong> <script>document.write(new Date().toLocaleString());</script></p>
                    </div>
                </div>

                <script>
                    // 简单的坐标系绘制
                    const canvas = document.getElementById('mathCanvas');
                    const ctx = canvas.getContext('2d');

                    // 清空画布
                    ctx.clearRect(0, 0, canvas.width, canvas.height);

                    // 绘制坐标轴
                    ctx.strokeStyle = '#333';
                    ctx.lineWidth = 2;

                    // X轴
                    ctx.beginPath();
                    ctx.moveTo(50, 200);
                    ctx.lineTo(650, 200);
                    ctx.stroke();

                    // Y轴
                    ctx.beginPath();
                    ctx.moveTo(350, 50);
                    ctx.lineTo(350, 350);
                    ctx.stroke();

                    // 绘制网格
                    ctx.strokeStyle = '#e0e0e0';
                    ctx.lineWidth = 1;
                    for (let i = 100; i < 650; i += 50) {{
                        ctx.beginPath();
                        ctx.moveTo(i, 50);
                        ctx.lineTo(i, 350);
                        ctx.stroke();
                    }}
                    for (let i = 100; i < 350; i += 50) {{
                        ctx.beginPath();
                        ctx.moveTo(50, i);
                        ctx.lineTo(650, i);
                        ctx.stroke();
                    }}

                    // 绘制示例函数曲线
                    ctx.strokeStyle = '#1f77b4';
                    ctx.lineWidth = 2;
                    ctx.beginPath();

                    for (let x = 50; x < 650; x++) {{
                        const normalizedX = (x - 350) / 100;
                        const y = 200 - Math.sin(normalizedX) * 50 * Math.cos(normalizedX);
                        if (x === 50) {{
                            ctx.moveTo(x, y);
                        }} else {{
                            ctx.lineTo(x, y);
                        }}
                    }}
                    ctx.stroke();

                    // 添加标签
                    ctx.fillStyle = '#333';
                    ctx.font = '14px Arial';
                    ctx.fillText('X轴', 660, 205);
                    ctx.fillText('Y轴', 355, 40);
                    ctx.fillText('sin(x) * cos(x)', 10, 30);
                </script>
            </body>
            </html>
            """

        except Exception as e:
            print(f"数学HTML生成失败: {str(e)}")
            return self._get_error_html("数学可视化", str(e))

    async def _generate_legacy_visualization(self, config: Dict[str, Any]) -> str:
        """
        回退到传统可视化生成方式

        Args:
            config: 可视化配置

        Returns:
            str: HTML内容
        """
        try:
            # 优先使用模板引擎
            if hasattr(self, 'template_engine') and self.template_engine:
                template_id = config.get("template_id", "default")

                # 准备渲染配置
                render_config = {
                    "title": config.get("title", "数学可视化"),
                    "parameters": config.get("parameters", {}),
                    "data": await self._generate_math_data(config),
                    "plotly_config": await self._generate_plotly_config(await self._generate_math_data(config), config),
                    "timestamp": datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                    "subject": "mathematics",
                    "field": config.get("field", "general"),
                    "concept_type": config.get("concept_type")
                }

                # 使用模板引擎渲染
                html_content = await self.template_engine.render_template(template_id, render_config)

                if html_content and html_content.strip():
                    return html_content

            # 完全回退到内置模板
            template_content = self._get_default_math_template()

            # 生成数据
            data = await self._generate_math_data(config)

            # 生成Plotly配置
            plotly_config = await self._generate_plotly_config(data, config)

            # 使用安全的字符串替换
            html_content = template_content.replace("{title}", str(config["title"]))
            html_content = html_content.replace("{plotly_config}", json.dumps(plotly_config, ensure_ascii=False))
            html_content = html_content.replace("{parameters}", json.dumps(config["parameters"], ensure_ascii=False))
            html_content = html_content.replace("{data}", json.dumps(data, ensure_ascii=False))

            return html_content

        except Exception as e:
            raise VisualizationError(f"传统可视化生成失败: {str(e)}")

    def get_supported_topics(self) -> List[str]:
        """获取支持的数学主题"""
        topics = []

        # 概率统计主题
        dist_topics = [
            "正态分布", "二项分布", "泊松分布", "均匀分布",
            "指数分布", "卡方分布", "t分布"
        ]
        topics.extend([f"概率统计 - {topic}" for topic in dist_topics])

        # 线性代数主题
        la_topics = self.config["supported_concepts"]["linear_algebra"]
        topics.extend([f"线性代数 - {topic}" for topic in la_topics])

        # 其他数学领域
        other_topics = [
            "微积分 - 函数图像", "微积分 - 导数可视化",
            "几何学 - 图形变换", "代数学 - 方程求解"
        ]
        topics.extend(other_topics)

        return topics

    async def _generate_math_data(self, config: Dict[str, Any]) -> Dict[str, Any]:
        """生成数学数据"""
        data = {"x": [], "y": [], "metadata": {}}

        if config.get("distribution_type"):
            # 生成概率分布数据
            dist_type = config["distribution_type"]
            params = config["parameters"]

            if dist_type == "normal":
                mu = params.get("mu", 0)
                sigma = params.get("sigma", 1)
                x = np.linspace(mu - 4*sigma, mu + 4*sigma, 1000)
                y = (1/(sigma * np.sqrt(2*np.pi))) * np.exp(-0.5 * ((x - mu)/sigma)**2)

            elif dist_type == "binomial":
                n = params.get("n", 10)
                p = params.get("p", 0.5)
                x = list(range(n + 1))
                from scipy.stats import binom
                y = [binom.pmf(k, n, p) for k in x]

            else:
                # 其他分布的默认实现
                x = np.linspace(-5, 5, 100)
                y = np.exp(-x**2)  # 高斯形状

            data["x"] = x.tolist() if hasattr(x, 'tolist') else x
            data["y"] = y.tolist() if hasattr(y, 'tolist') else y
            data["metadata"]["type"] = dist_type

        return data

    async def _generate_plotly_config(self, data: Dict[str, Any], config: Dict[str, Any]) -> Dict[str, Any]:
        """生成Plotly配置"""
        plotly_config = {
            "data": [{
                "x": data["x"],
                "y": data["y"],
                "type": "scatter",
                "mode": "lines",
                "name": config.get("title", "数学可视化"),
                "line": {
                    "color": "#1f77b4",
                    "width": 2
                }
            }],
            "layout": {
                "title": config.get("title", "数学可视化"),
                "xaxis": {"title": "X"},
                "yaxis": {"title": "Y"},
                "responsive": True,
                "displayModeBar": True,
                "modeBarButtonsToRemove": ["pan2d", "select2d", "lasso2d"]
            }
        }

        # 根据概念类型调整配置
        if config.get("distribution_type"):
            plotly_config["layout"]["xaxis"]["title"] = "值"
            plotly_config["layout"]["yaxis"]["title"] = "概率密度"

        return plotly_config

    def _get_default_math_template(self) -> str:
        """获取默认数学模板"""
        return """
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{title}</title>
    <script src="https://cdn.plot.ly/plotly-latest.min.js"></script>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 20px; }
        .container { max-width: 1200px; margin: 0 auto; }
        .controls { margin-bottom: 20px; }
        .plot-container { height: 600px; border: 1px solid #ddd; border-radius: 8px; }
        .info-panel { margin-top: 20px; padding: 15px; background: #f5f5f5; border-radius: 8px; }
    </style>
</head>
<body>
    <div class="container">
        <h1>{title}</h1>

        <div class="controls">
            <label>参数调整:</label>
            <div id="parameter-controls"></div>
        </div>

        <div id="plot" class="plot-container"></div>

        <div class="info-panel">
            <h3>可视化信息</h3>
            <p><strong>学科:</strong> 数学</p>
            <p><strong>参数:</strong> <span id="param-info">{parameters}</span></p>
        </div>
    </div>

    <script>
        const plotlyConfig = {plotly_config};
        const data = {data};
        const parameters = {parameters};

        // 初始化图表
        Plotly.newPlot('plot', plotlyConfig.data, plotlyConfig.layout, {
            responsive: true,
            displayModeBar: true
        });

        // 显示参数信息
        document.getElementById('param-info').textContent = JSON.stringify(parameters, null, 2);
    </script>
</body>
</html>
        """

    def _load_templates(self) -> Dict[str, Any]:
        """加载数学模板"""
        return {
            "normal": {
                "id": "normal",
                "name": "正态分布可视化",
                "description": "交互式正态分布概率密度函数",
                "parameters": ["mu", "sigma"],
                "html_template": self._get_default_math_template()
            },
            "binomial": {
                "id": "binomial",
                "name": "二项分布可视化",
                "description": "二项分布概率质量函数",
                "parameters": ["n", "p"],
                "html_template": self._get_default_math_template()
            },
            "la_向量投影": {
                "id": "la_vector_projection",
                "name": "向量投影可视化",
                "description": "展示向量在其他向量上的投影",
                "parameters": ["vector1", "vector2"],
                "html_template": self._get_default_math_template()
            }
        }