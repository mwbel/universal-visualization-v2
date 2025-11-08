"""
万物可视化 v2.0 - 物理学科Agent
处理物理相关的可视化需求，包括力学、电磁学、波动光学、热学等
"""

from typing import Dict, List, Optional, Any
import json
import math
import numpy as np
from .base_agent import BaseVisualizationAgent, VisualizationError, RequirementParseError

class PhysicsAgent(BaseVisualizationAgent):
    """物理学科可视化Agent"""

    def __init__(self):
        super().__init__("physics", {
            "supported_fields": [
                "mechanics", "electromagnetism", "thermodynamics",
                "optics", "quantum", "waves", "relativity"
            ],
            "supported_concepts": {
                "mechanics": [
                    "抛体运动", "简谐振动", "圆周运动", "动量守恒",
                    "能量守恒", "牛顿定律", "弹性碰撞"
                ],
                "electromagnetism": [
                    "电场", "磁场", "电磁感应", "库仑定律",
                    "安培定律", "法拉第定律", "电磁波"
                ],
                "waves": [
                    "波的传播", "干涉", "衍射", "驻波",
                    "声波", "光波", "多普勒效应"
                ],
                "thermodynamics": [
                    "理想气体", "热力学循环", "熵", "温度",
                    "热传导", "热对流", "热辐射"
                ]
            }
        })

    async def parse_requirement(self, prompt: str) -> Dict[str, Any]:
        """
        解析物理需求

        Args:
            prompt: 用户输入的物理需求描述

        Returns:
            Dict: 解析后的物理需求结构
        """
        try:
            requirement = {
                "subject": "physics",
                "original": prompt,
                "keywords": [],
                "field": None,
                "concept_type": None,
                "parameters": {},
                "numbers": [],
                "variables": {},
                "conditions": [],
                "raw_text": prompt
            }

            # 1. 识别物理领域
            field_patterns = {
                "mechanics": ["力学", "运动", "速度", "加速度", "力", "质量", "动量", "能量"],
                "electromagnetism": ["电磁", "电场", "磁场", "电流", "电压", "电阻", "电容"],
                "thermodynamics": ["热", "温度", "气体", "压强", "体积", "熵", "热力学"],
                "optics": ["光", "光学", "折射", "反射", "透镜", "干涉", "衍射"],
                "waves": ["波", "振动", "频率", "波长", "振幅", "声波", "驻波"],
                "quantum": ["量子", "原子", "电子", "光子", "波粒二象性"],
                "relativity": ["相对论", "时空", "光速", "爱因斯坦"]
            }

            for field, patterns in field_patterns.items():
                if any(pattern in prompt for pattern in patterns):
                    requirement["field"] = field
                    break

            # 2. 识别具体物理概念
            for field, concepts in self.config["supported_concepts"].items():
                for concept in concepts:
                    if concept in prompt:
                        requirement["concept_type"] = concept
                        requirement["field"] = field
                        break
                if requirement["concept_type"]:
                    break

            # 3. 特殊概念识别 (基于物理公式和条件)
            concept_patterns = {
                "抛体运动": ["抛体", "抛物线", "平抛", "斜抛", "初速度"],
                "简谐振动": ["简谐", "弹簧", "振子", "周期", "频率", "振幅"],
                "圆周运动": ["圆周", "向心力", "角速度", "周期", "转速"],
                "电场": ["点电荷", "电场线", "电场强度", "库仑定律"],
                "磁场": ["电流", "磁场", "磁感应强度", "安培力"],
                "波的传播": ["波速", "频率", "波长", "传播", "介质"]
            }

            for concept, patterns in concept_patterns.items():
                if any(pattern in prompt for pattern in patterns):
                    requirement["concept_type"] = concept
                    break

            # 4. 提取数值参数
            numbers = self._extract_numbers(prompt)
            if numbers:
                requirement["numbers"] = numbers

                # 根据概念类型分配物理参数
                concept = requirement.get("concept_type")
                if concept == "抛体运动":
                    if len(numbers) >= 2:
                        requirement["parameters"]["v0"] = numbers[0]  # 初速度
                        requirement["parameters"]["angle"] = numbers[1]  # 发射角度
                    elif len(numbers) == 1:
                        requirement["parameters"]["v0"] = numbers[0]
                        requirement["parameters"]["angle"] = 45  # 默认45度

                elif concept == "简谐振动":
                    if len(numbers) >= 1:
                        requirement["parameters"]["amplitude"] = numbers[0]  # 振幅
                    if len(numbers) >= 2:
                        requirement["parameters"]["frequency"] = numbers[1]  # 频率
                    elif len(numbers) == 1:
                        requirement["parameters"]["frequency"] = 1.0  # 默认频率

                elif concept == "圆周运动":
                    if len(numbers) >= 1:
                        requirement["parameters"]["radius"] = numbers[0]  # 半径
                    if len(numbers) >= 2:
                        requirement["parameters"]["angular_velocity"] = numbers[1]  # 角速度

                elif concept == "波的传播":
                    if len(numbers) >= 2:
                        requirement["parameters"]["frequency"] = numbers[0]  # 频率
                        requirement["parameters"]["wavelength"] = numbers[1]  # 波长

            # 5. 提取物理条件和约束
            condition_patterns = {
                "无空气阻力": ["无阻力", "真空", "忽略空气阻力"],
                "恒定加速度": ["恒定加速度", "匀加速"],
                "弹性碰撞": ["弹性", "完全弹性"],
                "理想气体": ["理想气体", "理想状态"]
            }

            for condition, patterns in condition_patterns.items():
                if any(pattern in prompt for pattern in patterns):
                    requirement["conditions"].append(condition)

            # 6. 提取变量和参数名称
            variable_patterns = {
                "初速度": ["初速度", "v0", "初始速度"],
                "加速度": ["加速度", "a", "重力加速度", "g"],
                "时间": ["时间", "t", "时刻"],
                "位移": ["位移", "s", "距离"],
                "质量": ["质量", "m"],
                "力": ["力", "F", "作用力"]
            }

            for var_name, patterns in variable_patterns.items():
                for pattern in patterns:
                    if pattern in prompt:
                        requirement["variables"][var_name] = pattern
                        break

            # 7. 提取所有关键词
            all_keywords = []
            for patterns in field_patterns.values():
                all_keywords.extend(patterns)
            all_keywords.extend(list(concept_patterns.keys()))

            requirement["keywords"] = self._extract_keywords(prompt, all_keywords)

            return requirement

        except Exception as e:
            raise RequirementParseError(f"物理需求解析失败: {str(e)}")

    async def match_template(self, requirement: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        匹配物理模板

        Args:
            requirement: 解析后的物理需求

        Returns:
            Dict: 匹配的模板配置
        """
        try:
            concept_type = requirement.get("concept_type")
            field = requirement.get("field")

            # 1. 精确概念匹配
            if concept_type:
                template_key = f"physics_{concept_type}"
                if template_key in self.templates:
                    return self.templates[template_key]

            # 2. 领域通用匹配
            if field:
                template_key = f"physics_{field}_general"
                if template_key in self.templates:
                    return self.templates[template_key]

            # 3. 默认物理模板
            return self.templates.get("physics_general", None)

        except Exception as e:
            raise VisualizationError(f"模板匹配失败: {str(e)}")

    async def generate_config(self, requirement: Dict[str, Any], template: Dict[str, Any], user_preferences: Dict[str, Any]) -> Dict[str, Any]:
        """
        生成物理可视化配置

        Args:
            requirement: 物理需求
            template: 匹配的模板
            user_preferences: 用户偏好

        Returns:
            Dict: 可视化配置
        """
        try:
            config = {
                "title": user_preferences.get("title") or self._generate_default_title(requirement),
                "subject": "physics",
                "field": requirement.get("field", "general"),
                "concept_type": requirement.get("concept_type"),
                "template_id": template.get("id"),
                "parameters": requirement.get("parameters", {}),
                "numbers": requirement.get("numbers", []),
                "variables": requirement.get("variables", {}),
                "conditions": requirement.get("conditions", []),
                "user_preferences": user_preferences,
                "interactive": True,
                "responsive": True,
                "animation_enabled": True
            }

            # 根据概念类型添加特定配置
            concept = requirement.get("concept_type")
            if concept == "抛体运动":
                config.update({
                    "chart_type": "trajectory",
                    "show_trajectory": True,
                    "show_velocity_vectors": True,
                    "time_range": [0, 10],
                    "grid_enabled": True
                })

            elif concept == "简谐振动":
                config.update({
                    "chart_type": "oscillation",
                    "show_phase_diagram": True,
                    "show_energy_diagram": True,
                    "time_range": [0, 20],
                    "amplitude_range": [-2, 2]
                })

            elif concept == "圆周运动":
                config.update({
                    "chart_type": "circular",
                    "show_angular_momentum": True,
                    "show_centripetal_force": True,
                    "3d_enabled": True
                })

            elif concept == "电场" or concept == "磁场":
                config.update({
                    "chart_type": "field",
                    "show_field_lines": True,
                    "show_field_vectors": True,
                    "interactive_charges": True
                })

            elif concept == "波的传播":
                config.update({
                    "chart_type": "wave",
                    "show_wave_properties": True,
                    "show_superposition": True,
                    "time_animation": True
                })

            return config

        except Exception as e:
            raise VisualizationError(f"配置生成失败: {str(e)}")

    async def generate_visualization(self, config: Dict[str, Any]) -> str:
        """
        生成物理可视化HTML

        Args:
            config: 可视化配置

        Returns:
            str: HTML内容
        """
        try:
            # 获取模板HTML
            template_id = config.get("template_id", "physics_general")
            template_content = self.templates.get(template_id, {}).get("html_template")

            if not template_content:
                template_content = self._get_default_physics_template()

            # 生成物理数据
            data = await self._generate_physics_data(config)

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
        """获取支持的物理主题"""
        topics = []

        # 力学主题
        mechanics_topics = self.config["supported_concepts"]["mechanics"]
        topics.extend([f"力学 - {topic}" for topic in mechanics_topics])

        # 电磁学主题
        electromagnetism_topics = self.config["supported_concepts"]["electromagnetism"]
        topics.extend([f"电磁学 - {topic}" for topic in electromagnetism_topics])

        # 波动主题
        waves_topics = self.config["supported_concepts"]["waves"]
        topics.extend([f"波动学 - {topic}" for topic in waves_topics])

        # 热力学主题
        thermodynamics_topics = self.config["supported_concepts"]["thermodynamics"]
        topics.extend([f"热力学 - {topic}" for topic in thermodynamics_topics])

        # 其他物理领域
        other_topics = [
            "光学 - 几何光学", "光学 - 物理光学",
            "量子物理 - 波粒二象性", "量子物理 - 原子结构",
            "相对论 - 狭义相对论", "相对论 - 广义相对论"
        ]
        topics.extend(other_topics)

        return topics

    async def _generate_physics_data(self, config: Dict[str, Any]) -> Dict[str, Any]:
        """生成物理数据"""
        data = {"time": [], "position": [], "velocity": [], "metadata": {}}

        concept_type = config.get("concept_type")
        params = config.get("parameters", {})

        if concept_type == "抛体运动":
            # 抛体运动数据
            v0 = params.get("v0", 20)  # 初速度 m/s
            angle = params.get("angle", 45)  # 发射角度
            g = 9.8  # 重力加速度

            angle_rad = math.radians(angle)
            vx = v0 * math.cos(angle_rad)
            vy = v0 * math.sin(angle_rad)

            # 计算飞行时间
            t_total = 2 * vy / g
            t = np.linspace(0, t_total, 100)

            x = vx * t
            y = vy * t - 0.5 * g * t**2

            data["time"] = t.tolist()
            data["position"] = {"x": x.tolist(), "y": y.tolist()}
            data["velocity"] = {"x": [vx] * len(t), "y": (vy - g * t).tolist()}
            data["metadata"]["type"] = "projectile"

        elif concept_type == "简谐振动":
            # 简谐振动数据
            amplitude = params.get("amplitude", 1)  # 振幅
            frequency = params.get("frequency", 1)  # 频率 Hz
            omega = 2 * math.pi * frequency  # 角频率

            t = np.linspace(0, 10, 200)
            x = amplitude * np.sin(omega * t)
            v = amplitude * omega * np.cos(omega * t)

            data["time"] = t.tolist()
            data["position"] = {"x": t.tolist(), "y": x.tolist()}
            data["velocity"] = {"x": t.tolist(), "y": v.tolist()}
            data["metadata"]["type"] = "oscillation"

        elif concept_type == "圆周运动":
            # 圆周运动数据
            radius = params.get("radius", 2)  # 半径 m
            angular_velocity = params.get("angular_velocity", 1)  # 角速度 rad/s

            t = np.linspace(0, 4 * math.pi / angular_velocity, 100)
            x = radius * np.cos(angular_velocity * t)
            y = radius * np.sin(angular_velocity * t)

            vx = -radius * angular_velocity * np.sin(angular_velocity * t)
            vy = radius * angular_velocity * np.cos(angular_velocity * t)

            data["time"] = t.tolist()
            data["position"] = {"x": x.tolist(), "y": y.tolist()}
            data["velocity"] = {"x": vx.tolist(), "y": vy.tolist()}
            data["metadata"]["type"] = "circular"

        else:
            # 默认物理数据
            t = np.linspace(0, 10, 100)
            x = np.sin(t)
            y = np.cos(t)

            data["time"] = t.tolist()
            data["position"] = {"x": x.tolist(), "y": y.tolist()}
            data["metadata"]["type"] = "general"

        return data

    async def _generate_plotly_config(self, data: Dict[str, Any], config: Dict[str, Any]) -> Dict[str, Any]:
        """生成Plotly配置"""
        plot_data = []
        layout = {
            "title": config.get("title", "物理可视化"),
            "xaxis": {"title": "X"},
            "yaxis": {"title": "Y"},
            "showlegend": True,
            "height": 500
        }

        concept_type = config.get("concept_type")

        if concept_type == "抛体运动":
            # 轨迹线
            plot_data.append({
                "x": data["position"]["x"],
                "y": data["position"]["y"],
                "mode": "lines+markers",
                "type": "scatter",
                "name": "运动轨迹",
                "line": {"color": "blue", "width": 2},
                "marker": {"size": 4}
            })

            # 速度矢量
            for i in range(0, len(data["time"]), 10):  # 每10个点显示一个矢量
                plot_data.append({
                    "x": [data["position"]["x"][i], data["position"]["x"][i] + data["velocity"]["x"][i]/10],
                    "y": [data["position"]["y"][i], data["position"]["y"][i] + data["velocity"]["y"][i]/10],
                    "mode": "lines",
                    "type": "scatter",
                    "line": {"color": "red", "width": 2},
                    "showlegend": False if i > 0 else True,
                    "name": "速度矢量" if i == 0 else None
                })

            layout["xaxis"]["title"] = "水平距离 (m)"
            layout["yaxis"]["title"] = "垂直距离 (m)"

        elif concept_type == "简谐振动":
            # 位置-时间图
            plot_data.append({
                "x": data["time"],
                "y": data["position"]["y"],
                "mode": "lines",
                "type": "scatter",
                "name": "位移",
                "line": {"color": "blue", "width": 2}
            })

            # 速度-时间图
            plot_data.append({
                "x": data["time"],
                "y": data["velocity"]["y"],
                "mode": "lines",
                "type": "scatter",
                "name": "速度",
                "line": {"color": "red", "width": 2},
                "yaxis": "y2"
            })

            layout["xaxis"]["title"] = "时间 (s)"
            layout["yaxis"]["title"] = "位移 (m)"
            layout["yaxis2"] = {
                "title": "速度 (m/s)",
                "overlaying": "y",
                "side": "right"
            }

        elif concept_type == "圆周运动":
            # 轨道圆
            plot_data.append({
                "x": data["position"]["x"],
                "y": data["position"]["y"],
                "mode": "lines+markers",
                "type": "scatter",
                "name": "运动轨迹",
                "line": {"color": "blue", "width": 2},
                "marker": {"size": 6}
            })

            layout["xaxis"]["title"] = "X 位置 (m)"
            layout["yaxis"]["title"] = "Y 位置 (m)"
            layout["xaxis"]["scaleanchor"] = "y"  # 保持纵横比
            layout["xaxis"]["scaleratio"] = 1

        plotly_config = {
            "data": plot_data,
            "layout": layout,
            "config": {
                "responsive": True,
                "displayModeBar": True,
                "displaylogo": False,
                "modeBarButtonsToRemove": ["pan2d", "select2d", "lasso2d"]
            }
        }

        return plotly_config

    def _get_default_physics_template(self) -> str:
        """获取默认物理模板"""
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
            background: linear-gradient(135deg, #f5f7fa, #c3cfe2);
            color: #333;
        }
        .container { max-width: 1200px; margin: 0 auto; padding: 20px; }
        .controls {
            margin-bottom: 20px;
            background: rgba(255,255,255,0.9);
            padding: 15px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .plot-container { height: 500px; border: 1px solid #ddd; border-radius: 8px; background: white; }
        .info-panel {
            margin-top: 20px;
            padding: 15px;
            background: rgba(255,255,255,0.9);
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .title { text-align: center; margin-bottom: 30px; color: #2c3e50; }
        .control-group { margin: 10px 0; display: flex; align-items: center; }
        .control-group label { display: inline-block; width: 120px; font-weight: bold; }
        .control-group input, .control-group select {
            background: white; border: 1px solid #ccc; color: #333;
            padding: 5px; border-radius: 4px; margin-left: 10px;
        }
        .button {
            background: #3498db; color: white; border: none; padding: 10px 20px;
            border-radius: 5px; cursor: pointer; margin: 5px;
        }
        .button:hover { background: #2980b9; }
        .button.play { background: #27ae60; }
        .button.play:hover { background: #229954; }
        .slider-container { display: flex; align-items: center; }
        .slider-container input { margin: 0 10px; }
    </style>
</head>
<body>
    <div class="container">
        <h1 class="title">{title}</h1>

        <div class="controls">
            <div class="control-group">
                <label>播放动画:</label>
                <button class="button play" onclick="toggleAnimation()">播放/暂停</button>
                <button class="button" onclick="resetAnimation()">重置</button>
            </div>

            <div class="control-group">
                <label>动画速度:</label>
                <div class="slider-container">
                    <input type="range" id="speedSlider" min="0.1" max="3" step="0.1" value="1">
                    <span id="speedValue">1.0x</span>
                </div>
            </div>

            <div class="control-group">
                <label>显示选项:</label>
                <input type="checkbox" id="showTrail" checked onchange="updateVisualization()">
                <label for="showTrail" style="width: auto;">显示轨迹</label>

                <input type="checkbox" id="showVectors" checked onchange="updateVisualization()">
                <label for="showVectors" style="width: auto;">显示矢量</label>
            </div>
        </div>

        <div id="plot" class="plot-container"></div>

        <div class="info-panel">
            <h3>物理仿真信息</h3>
            <p><strong>学科:</strong> 物理学</p>
            <p><strong>概念类型:</strong> <span id="concept-type"></span></p>
            <p><strong>当前时间:</strong> <span id="current-time">0.00 s</span></p>
            <p><strong>物理参数:</strong> <span id="param-info">{parameters}</span></p>
            <div id="real-time-data" style="margin-top: 10px;"></div>
        </div>
    </div>

    <script>
        const plotlyConfig = {plotly_config};
        const data = {data};
        const parameters = {parameters};

        let animationFrame = null;
        let isPlaying = false;
        let currentTime = 0;
        let animationSpeed = 1.0;

        // 初始化图表
        Plotly.newPlot('plot', plotlyConfig.data, plotlyConfig.layout, {
            responsive: true,
            displayModeBar: true
        });

        // 显示初始信息
        document.getElementById('concept-type').textContent =
            data.metadata?.type || '物理仿真';
        document.getElementById('param-info').textContent = JSON.stringify(parameters, null, 2);

        // 速度控制
        document.getElementById('speedSlider').addEventListener('input', function(e) {
            animationSpeed = parseFloat(e.target.value);
            document.getElementById('speedValue').textContent = animationSpeed.toFixed(1) + 'x';
        });

        // 动画控制
        function toggleAnimation() {
            isPlaying = !isPlaying;
            if (isPlaying) {
                animate();
            } else {
                cancelAnimationFrame(animationFrame);
            }
        }

        function resetAnimation() {
            currentTime = 0;
            isPlaying = false;
            cancelAnimationFrame(animationFrame);
            updateTimeDisplay();
            // 重置图表到初始状态
            updateVisualization();
        }

        function animate() {
            if (!isPlaying) return;

            currentTime += 0.05 * animationSpeed; // 时间步长

            // 根据不同的物理概念更新动画
            updateVisualization();
            updateTimeDisplay();

            animationFrame = requestAnimationFrame(animate);
        }

        function updateVisualization() {
            // 这里添加具体的可视化更新逻辑
            // 根据不同的概念类型更新图表数据

            const showTrail = document.getElementById('showTrail').checked;
            const showVectors = document.getElementById('showVectors').checked;

            // 更新实时数据显示
            updateRealTimeData();
        }

        function updateTimeDisplay() {
            document.getElementById('current-time').textContent = currentTime.toFixed(2) + ' s';
        }

        function updateRealTimeData() {
            const realTimeDiv = document.getElementById('real-time-data');

            // 根据不同概念类型显示不同的实时数据
            if (data.metadata?.type === 'projectile') {
                // 抛体运动的实时数据
                const idx = Math.min(Math.floor(currentTime * 10), data.time.length - 1);
                const x = data.position.x[idx];
                const y = data.position.y[idx];
                const vx = data.velocity.x[idx];
                const vy = data.velocity.y[idx];

                realTimeDiv.innerHTML = `
                    <strong>实时数据:</strong><br>
                    位置: (${x.toFixed(2)}, ${y.toFixed(2)}) m<br>
                    速度: (${vx.toFixed(2)}, ${vy.toFixed(2)}) m/s<br>
                    速率: ${Math.sqrt(vx*vx + vy*vy).toFixed(2)} m/s
                `;
            } else if (data.metadata?.type === 'oscillation') {
                // 简谐振动的实时数据
                const idx = Math.min(Math.floor(currentTime * 20), data.time.length - 1);
                const displacement = data.position.y[idx];
                const velocity = data.velocity.y[idx];

                realTimeDiv.innerHTML = `
                    <strong>实时数据:</strong><br>
                    位移: ${displacement.toFixed(3)} m<br>
                    速度: ${velocity.toFixed(3)} m/s<br>
                    动能: ${(0.5 * velocity * velocity).toFixed(3)} J<br>
                    势能: ${(0.5 * displacement * displacement).toFixed(3)} J
                `;
            }
        }

        // 初始化显示
        updateVisualization();
        updateTimeDisplay();
    </script>
</body>
</html>
        """

    def _load_templates(self) -> Dict[str, Any]:
        """加载物理模板"""
        return {
            "physics_抛体运动": {
                "id": "physics_projectile",
                "name": "抛体运动仿真",
                "description": "二维抛体运动轨迹和速度矢量可视化",
                "parameters": ["v0", "angle", "gravity"],
                "html_template": self._get_default_physics_template()
            },
            "physics_简谐振动": {
                "id": "physics_oscillation",
                "name": "简谐振动仿真",
                "description": "弹簧振子或单摆的简谐振动可视化",
                "parameters": ["amplitude", "frequency", "phase"],
                "html_template": self._get_default_physics_template()
            },
            "physics_圆周运动": {
                "id": "physics_circular",
                "name": "圆周运动仿真",
                "description": "匀速圆周运动和向心力可视化",
                "parameters": ["radius", "angular_velocity", "mass"],
                "html_template": self._get_default_physics_template()
            },
            "physics_电场": {
                "id": "physics_electric_field",
                "name": "电场可视化",
                "description": "点电荷电场线和等势面可视化",
                "parameters": ["charge_values", "positions"],
                "html_template": self._get_default_physics_template()
            }
        }