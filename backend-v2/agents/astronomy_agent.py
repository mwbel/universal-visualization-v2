"""
万物可视化 v2.0 - 天文学科Agent
处理天文相关的可视化需求，包括天体运动、星系结构、轨道计算等
"""

from typing import Dict, List, Optional, Any
import json
import math
import numpy as np
from datetime import datetime, timedelta
from .base_agent import BaseVisualizationAgent, VisualizationError, RequirementParseError

class AstronomyAgent(BaseVisualizationAgent):
    """天文学科可视化Agent"""

    def __init__(self):
        super().__init__("astronomy", {
            "supported_objects": [
                "sun", "moon", "earth", "planets", "stars",
                "constellations", "galaxies", "asteroids"
            ],
            "supported_phenomena": [
                "orbits", "phases", "eclipses", "seasons",
                "tides", "retrograde", "conjunctions"
            ],
            "supported_concepts": {
                "solar_system": [
                    "行星轨道", "太阳系", "行星运动", "公转", "自转"
                ],
                "celestial_sphere": [
                    "天球", "星座", "赤道坐标系", "黄道坐标系"
                ],
                "phenomena": [
                    "日月食", "月相", "行星逆行", "合相", "冲日"
                ]
            }
        })

    async def parse_requirement(self, prompt: str) -> Dict[str, Any]:
        """
        解析天文需求

        Args:
            prompt: 用户输入的天文需求描述

        Returns:
            Dict: 解析后的天文需求结构
        """
        try:
            requirement = {
                "subject": "astronomy",
                "original": prompt,
                "keywords": [],
                "objects": [],
                "phenomena": [],
                "time_period": None,
                "region": None,
                "parameters": {},
                "concept_type": None,
                "numbers": [],
                "raw_text": prompt
            }

            # 1. 识别天体对象
            object_patterns = {
                "太阳": "sun",
                "月亮": "moon",
                "地球": "earth",
                "行星": "planets",
                "恒星": "stars",
                "星座": "constellations",
                "星系": "galaxies",
                "小行星": "asteroids",
                "水星": "mercury",
                "金星": "venus",
                "火星": "mars",
                "木星": "jupiter",
                "土星": "saturn",
                "天王星": "uranus",
                "海王星": "neptune"
            }

            for pattern, obj_type in object_patterns.items():
                if pattern in prompt:
                    requirement["objects"].append(obj_type)

            # 2. 识别天文现象
            phenomenon_patterns = {
                "轨道": "orbits",
                "轨道运动": "orbits",
                "公转": "orbits",
                "自转": "rotation",
                "相位": "phases",
                "月相": "phases",
                "日月食": "eclipses",
                "日食": "solar_eclipse",
                "月食": "lunar_eclipse",
                "季节": "seasons",
                "潮汐": "tides",
                "逆行": "retrograde",
                "合相": "conjunctions"
            }

            for pattern, phen_type in phenomenon_patterns.items():
                if pattern in prompt:
                    requirement["phenomena"].append(phen_type)

            # 3. 识别概念类型
            if any(obj in ["sun", "moon", "earth", "planets"] for obj in requirement["objects"]):
                if "orbits" in requirement["phenomena"]:
                    requirement["concept_type"] = "solar_system_orbits"
                elif "phases" in requirement["phenomena"]:
                    requirement["concept_type"] = "lunar_phases"
                elif "eclipses" in requirement["phenomena"]:
                    requirement["concept_type"] = "eclipses"
                else:
                    requirement["concept_type"] = "solar_system"

            elif "constellations" in requirement["objects"]:
                requirement["concept_type"] = "celestial_sphere"

            # 4. 时间信息提取
            time_patterns = {
                "今天": "today",
                "明天": "tomorrow",
                "今年": "this_year",
                "\d{4}年": "year",
                "\d{1,2}月": "month",
                "\d{1,2}日": "day"
            }

            import re
            for pattern, time_type in time_patterns.items():
                match = re.search(pattern, prompt)
                if match:
                    if time_type == "year":
                        requirement["time_period"] = {"type": "year", "value": int(match.group()[:4])}
                    elif time_type == "month":
                        requirement["time_period"] = {"type": "month", "value": int(match.group()[:2])}
                    elif time_type == "day":
                        requirement["time_period"] = {"type": "day", "value": int(match.group()[:2])}
                    else:
                        requirement["time_period"] = {"type": time_type}
                    break

            # 5. 地理位置提取
            location_patterns = ["北京", "上海", "纽约", "伦敦", "东京", "北极", "南极", "赤道"]
            for location in location_patterns:
                if location in prompt:
                    requirement["region"] = location
                    break

            # 6. 数值参数提取
            numbers = self._extract_numbers(prompt)
            if numbers:
                requirement["numbers"] = numbers

                # 根据上下文分配参数
                if requirement.get("concept_type") == "solar_system_orbits":
                    if len(numbers) >= 1:
                        requirement["parameters"]["time_scale"] = numbers[0]
                    if len(numbers) >= 2:
                        requirement["parameters"]["zoom_level"] = numbers[1]

            # 7. 提取所有关键词
            all_keywords = []
            all_keywords.extend(list(object_patterns.keys()))
            all_keywords.extend(list(phenomenon_patterns.keys()))
            all_keywords.extend(time_patterns.keys())
            all_keywords.extend(location_patterns)

            requirement["keywords"] = self._extract_keywords(prompt, all_keywords)

            return requirement

        except Exception as e:
            raise RequirementParseError(f"天文需求解析失败: {str(e)}")

    async def match_template(self, requirement: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        匹配天文模板

        Args:
            requirement: 解析后的天文需求

        Returns:
            Dict: 匹配的模板配置
        """
        try:
            concept_type = requirement.get("concept_type")

            # 1. 精确概念类型匹配
            if concept_type:
                template_key = f"astro_{concept_type}"
                if template_key in self.templates:
                    return self.templates[template_key]

            # 2. 对象特定匹配
            if "planets" in requirement.get("objects", []):
                return self.templates.get("astro_planetary_system", self.templates.get("astro_solar_system"))

            elif "constellations" in requirement.get("objects", []):
                return self.templates.get("astro_constellations")

            elif "eclipses" in requirement.get("phenomena", []):
                return self.templates.get("astro_eclipses")

            # 3. 默认天文模板
            return self.templates.get("astro_general", None)

        except Exception as e:
            raise VisualizationError(f"模板匹配失败: {str(e)}")

    async def generate_config(self, requirement: Dict[str, Any], template: Dict[str, Any], user_preferences: Dict[str, Any]) -> Dict[str, Any]:
        """
        生成天文可视化配置

        Args:
            requirement: 天文需求
            template: 匹配的模板
            user_preferences: 用户偏好

        Returns:
            Dict: 可视化配置
        """
        try:
            config = {
                "title": user_preferences.get("title") or self._generate_default_title(requirement),
                "subject": "astronomy",
                "concept_type": requirement.get("concept_type"),
                "template_id": template.get("id"),
                "objects": requirement.get("objects", []),
                "phenomena": requirement.get("phenomena", []),
                "time_period": requirement.get("time_period"),
                "region": requirement.get("region"),
                "parameters": requirement.get("parameters", {}),
                "numbers": requirement.get("numbers", []),
                "user_preferences": user_preferences,
                "interactive": True,
                "responsive": True,
                "3d_enabled": requirement.get("concept_type") in ["solar_system_orbits", "celestial_sphere"]
            }

            # 根据概念类型添加特定配置
            if requirement.get("concept_type") == "solar_system_orbits":
                config.update({
                    "chart_type": "3d_scatter",
                    "show_orbits": True,
                    "show_labels": True,
                    "time_animation": True,
                    "default_time_scale": requirement.get("parameters", {}).get("time_scale", 1.0)
                })

            elif requirement.get("concept_type") == "lunar_phases":
                config.update({
                    "chart_type": "sequence",
                    "show_phases": True,
                    "phase_labels": True,
                    "time_slider": True
                })

            elif requirement.get("concept_type") == "constellations":
                config.update({
                    "chart_type": "sky_map",
                    "show_constellations": True,
                    "show_stars": True,
                    "coordinate_system": "equatorial"
                })

            return config

        except Exception as e:
            raise VisualizationError(f"配置生成失败: {str(e)}")

    async def generate_visualization(self, config: Dict[str, Any]) -> str:
        """
        生成天文可视化HTML

        Args:
            config: 可视化配置

        Returns:
            str: HTML内容
        """
        try:
            # 获取模板HTML
            template_id = config.get("template_id", "astro_general")
            template_content = self.templates.get(template_id, {}).get("html_template")

            if not template_content:
                template_content = self._get_default_astronomy_template()

            # 生成天文数据
            data = await self._generate_astronomy_data(config)

            # 生成Plotly配置
            plotly_config = await self._generate_plotly_config(data, config)

            # 渲染HTML
            html_content = template_content.format(
                title=config["title"],
                plotly_config=json.dumps(plotly_config, ensure_ascii=False),
                parameters=json.dumps(config["parameters"], ensure_ascii=False),
                data=json.dumps(data, ensure_ascii=False)
            )

            return html_content

        except Exception as e:
            raise VisualizationError(f"可视化生成失败: {str(e)}")

    def get_supported_topics(self) -> List[str]:
        """获取支持的天文主题"""
        topics = []

        # 太阳系主题
        solar_system_topics = [
            "行星轨道运动", "太阳系模型", "地球公转", "月球相位",
            "日月食模拟", "行星逆行", "潮汐现象"
        ]
        topics.extend([f"太阳系 - {topic}" for topic in solar_system_topics])

        # 天球和星座主题
        celestial_topics = [
            "星座识别", "天球坐标系", "恒星分布", "深空天体",
            "银河系结构", "星系团", "星云"
        ]
        topics.extend([f"天体观测 - {topic}" for topic in celestial_topics])

        # 天文现象主题
        phenomena_topics = [
            "季节变化", "昼夜长短", "极昼极夜", "日出日落",
            "行星合相", "流星雨", "彗星轨道"
        ]
        topics.extend([f"天文现象 - {topic}" for topic in phenomena_topics])

        return topics

    async def _generate_astronomy_data(self, config: Dict[str, Any]) -> Dict[str, Any]:
        """生成天文数据"""
        data = {
            "objects": [],
            "orbits": [],
            "metadata": {}
        }

        if config.get("concept_type") == "solar_system_orbits":
            # 生成行星轨道数据
            planets_data = [
                {"name": "水星", "a": 0.39, "period": 88, "color": "#8C8C8C"},
                {"name": "金星", "a": 0.72, "period": 225, "color": "#FFC649"},
                {"name": "地球", "a": 1.0, "period": 365, "color": "#4169E1"},
                {"name": "火星", "a": 1.52, "period": 687, "color": "#CD5C5C"},
                {"name": "木星", "a": 5.2, "period": 4333, "color": "#DAA520"},
                {"name": "土星", "a": 9.54, "period": 10759, "color": "#F4A460"}
            ]

            for planet in planets_data:
                # 生成轨道点
                theta = np.linspace(0, 2*np.pi, 100)
                r = planet["a"]
                x = r * np.cos(theta)
                y = r * np.sin(theta)
                z = np.zeros_like(theta)

                data["orbits"].append({
                    "name": planet["name"],
                    "x": x.tolist(),
                    "y": y.tolist(),
                    "z": z.tolist(),
                    "color": planet["color"]
                })

                # 当前位置
                current_angle = np.random.random() * 2 * np.pi
                data["objects"].append({
                    "name": planet["name"],
                    "x": [r * np.cos(current_angle)],
                    "y": [r * np.sin(current_angle)],
                    "z": [0],
                    "color": planet["color"],
                    "size": 8 if planet["name"] in ["木星", "土星"] else 5
                })

            data["metadata"]["type"] = "solar_system"

        elif config.get("concept_type") == "constellations":
            # 生成星座数据（简化版）
            constellations = {
                "大熊座": [
                    {"x": 1, "y": 3, "name": "天枢"},
                    {"x": 2, "y": 2.5, "name": "天璇"},
                    {"x": 3, "y": 2.3, "name": "天玑"},
                    {"x": 4, "y": 2.4, "name": "天权"},
                    {"x": 5, "y": 2.8, "name": "玉衡"},
                    {"x": 6, "y": 3.5, "name": "开阳"},
                    {"x": 7, "y": 4.2, "name": "摇光"}
                ]
            }

            for constellation_name, stars in constellations.items():
                data["objects"].append({
                    "type": "constellation",
                    "name": constellation_name,
                    "stars": stars,
                    "connections": [(i, i+1) for i in range(len(stars)-1)]
                })

            data["metadata"]["type"] = "constellations"

        return data

    async def _generate_plotly_config(self, data: Dict[str, Any], config: Dict[str, Any]) -> Dict[str, Any]:
        """生成Plotly配置"""
        plot_data = []
        layout = {
            "title": config.get("title", "天文可视化"),
            "showlegend": True,
            "height": 600
        }

        if config.get("concept_type") == "solar_system_orbits":
            # 3D轨道配置
            layout.update({
                "scene": {
                    "xaxis": {"title": "X (AU)"},
                    "yaxis": {"title": "Y (AU)"},
                    "zaxis": {"title": "Z (AU)"},
                    "aspectmode": "data"
                }
            })

            # 添加轨道线
            for orbit in data["orbits"]:
                plot_data.append({
                    "x": orbit["x"],
                    "y": orbit["y"],
                    "z": orbit["z"],
                    "mode": "lines",
                    "type": "scatter3d",
                    "name": f"{orbit['name']} 轨道",
                    "line": {"color": orbit["color"], "width": 2},
                    "showlegend": True
                })

            # 添加行星位置
            for obj in data["objects"]:
                plot_data.append({
                    "x": obj["x"],
                    "y": obj["y"],
                    "z": obj["z"],
                    "mode": "markers",
                    "type": "scatter3d",
                    "name": obj["name"],
                    "marker": {
                        "color": obj["color"],
                        "size": obj["size"]
                    },
                    "showlegend": True
                })

        elif config.get("concept_type") == "constellations":
            # 2D星座配置
            layout.update({
                "xaxis": {"title": "赤经 (度)"},
                "yaxis": {"title": "赤纬 (度)"},
                "showgrid": True,
                "gridcolor": "#e0e0e0"
            })

            for constellation in data["objects"]:
                if constellation["type"] == "constellation":
                    stars = constellation["stars"]

                    # 添加恒星
                    plot_data.append({
                        "x": [star["x"] for star in stars],
                        "y": [star["y"] for star in stars],
                        "mode": "markers+text",
                        "type": "scatter",
                        "name": constellation["name"],
                        "marker": {"color": "gold", "size": 10},
                        "text": [star["name"] for star in stars],
                        "textposition": "top center"
                    })

                    # 添加连线
                    for start, end in constellation["connections"]:
                        plot_data.append({
                            "x": [stars[start]["x"], stars[end]["x"]],
                            "y": [stars[start]["y"], stars[end]["y"]],
                            "mode": "lines",
                            "type": "scatter",
                            "line": {"color": "gold", "width": 2},
                            "showlegend": False
                        })

        plotly_config = {
            "data": plot_data,
            "layout": layout,
            "config": {
                "responsive": True,
                "displayModeBar": True,
                "displaylogo": False
            }
        }

        return plotly_config

    def _get_default_astronomy_template(self) -> str:
        """获取默认天文模板"""
        return """
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{title}</title>
    <script src="https://cdn.plot.ly/plotly-latest.min.js"></script>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            margin: 0;
            background: linear-gradient(135deg, #0a0a0a, #1a1a2e);
            color: #ffffff;
        }
        .container { max-width: 1200px; margin: 0 auto; padding: 20px; }
        .controls {
            margin-bottom: 20px;
            background: rgba(255,255,255,0.1);
            padding: 15px;
            border-radius: 8px;
            backdrop-filter: blur(10px);
        }
        .plot-container { height: 600px; border: 1px solid #444; border-radius: 8px; background: rgba(0,0,0,0.3); }
        .info-panel {
            margin-top: 20px;
            padding: 15px;
            background: rgba(255,255,255,0.1);
            border-radius: 8px;
            backdrop-filter: blur(10px);
        }
        .title { text-align: center; margin-bottom: 30px; color: #ffd700; }
        .control-group { margin: 10px 0; }
        .control-group label { display: inline-block; width: 120px; }
        .control-group input, .control-group select {
            background: rgba(255,255,255,0.2);
            border: 1px solid #666;
            color: #fff;
            padding: 5px;
            border-radius: 4px;
        }
        .button {
            background: #4169e1; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer;
        }
        .button:hover { background: #5179f1; }
    </style>
</head>
<body>
    <div class="container">
        <h1 class="title">{title}</h1>

        <div class="controls">
            <div class="control-group">
                <label>时间缩放:</label>
                <input type="range" id="timeScale" min="0.1" max="10" step="0.1" value="1">
                <span id="timeScaleValue">1.0</span>
            </div>
            <div class="control-group">
                <label>视角:</label>
                <select id="viewAngle">
                    <option value="top">俯视</option>
                    <option value="side">侧视</option>
                    <option value="angle">斜视</option>
                </select>
            </div>
            <div class="control-group">
                <button class="button" onclick="toggleAnimation()">播放/暂停动画</button>
            </div>
        </div>

        <div id="plot" class="plot-container"></div>

        <div class="info-panel">
            <h3>天文可视化信息</h3>
            <p><strong>学科:</strong> 天文学</p>
            <p><strong>显示对象:</strong> <span id="object-info"></span></p>
            <p><strong>参数:</strong> <span id="param-info">{parameters}</span></p>
        </div>
    </div>

    <script>
        const plotlyConfig = {plotly_config};
        const data = {data};
        const parameters = {parameters};

        let animationId = null;
        let isAnimating = false;

        // 初始化3D图表
        Plotly.newPlot('plot', plotlyConfig.data, plotlyConfig.layout, {
            responsive: true,
            displayModeBar: true
        });

        // 显示信息
        document.getElementById('object-info').textContent =
            data.objects ? data.objects.map(obj => obj.name).join(', ') : '无';
        document.getElementById('param-info').textContent = JSON.stringify(parameters, null, 2);

        // 时间缩放控制
        document.getElementById('timeScale').addEventListener('input', function(e) {
            const value = parseFloat(e.target.value);
            document.getElementById('timeScaleValue').textContent = value.toFixed(1);
            // 这里可以添加更新图表的逻辑
        });

        // 视角控制
        document.getElementById('viewAngle').addEventListener('change', function(e) {
            const angle = e.target.value;
            let cameraUpdate = {};

            switch(angle) {
                case 'top':
                    cameraUpdate = {eye: {x: 0, y: 0, z: 2}};
                    break;
                case 'side':
                    cameraUpdate = {eye: {x: 2, y: 0, z: 0}};
                    break;
                case 'angle':
                    cameraUpdate = {eye: {x: 1.5, y: 1.5, z: 1.5}};
                    break;
            }

            Plotly.relayout('plot', {'scene.camera': cameraUpdate});
        });

        // 动画控制
        function toggleAnimation() {
            isAnimating = !isAnimating;
            if (isAnimating) {
                animateScene();
            } else {
                cancelAnimationFrame(animationId);
            }
        }

        function animateScene() {
            if (!isAnimating) return;

            // 这里添加旋转逻辑
            Plotly.relayout('plot', {
                'scene.camera': {
                    eye: {
                        x: 2 * Math.cos(Date.now() * 0.0001),
                        y: 2 * Math.sin(Date.now() * 0.0001),
                        z: 2
                    }
                }
            });

            animationId = requestAnimationFrame(animateScene);
        }
    </script>
</body>
</html>
        """

    def _load_templates(self) -> Dict[str, Any]:
        """加载天文模板"""
        return {
            "astro_solar_system_orbits": {
                "id": "astro_solar_system_orbits",
                "name": "太阳系轨道运动",
                "description": "3D太阳系行星轨道模拟",
                "parameters": ["time_scale", "zoom_level", "selected_planets"],
                "html_template": self._get_default_astronomy_template()
            },
            "astro_lunar_phases": {
                "id": "astro_lunar_phases",
                "name": "月相变化",
                "description": "月球相位变化演示",
                "parameters": ["time_period", "view_angle"],
                "html_template": self._get_default_astronomy_template()
            },
            "astro_constellations": {
                "id": "astro_constellations",
                "name": "星座展示",
                "description": "主要星座可视化",
                "parameters": ["constellation_name", "show_labels"],
                "html_template": self._get_default_astronomy_template()
            }
        }