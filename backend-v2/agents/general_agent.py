"""
万物可视化 v2.0 - 通用可视化Agent
方案A核心组件：利用LLM动态生成可视化代码，不再依赖预设模板
"""

import json
import re
import asyncio
import sys
import os

# Add project root to path to import custom_llm_config
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

from typing import Dict, List, Optional, Any, Union
from datetime import datetime

from .base_agent import BaseVisualizationAgent, VisualizationError
from custom_llm_config import (
    LLMConfig,
    LLMProvider,
    get_client,
    load_config_from_file,
    LLM_CONFIGURATIONS,
)


class GeneralVisualizationAgent(BaseVisualizationAgent):
    """
    通用可视化Agent
    直接调用LLM生成前端代码(HTML/JS/Plotly/Three.js)
    """

    def __init__(self):
        super().__init__(
            "general",
            {
                "supported_topics": ["any"],
                "capabilities": ["dynamic_generation", "code_writing"],
            },
        )

        # LLM 配置将在每次请求时动态加载
        self.llm_config = None

    async def _get_llm_config(self):
        """动态获取最新的LLM配置"""
        try:
            # 重新导入以获取最新配置
            import sys
            import importlib

            # 尝试重新加载 custom_llm_config 模块
            if "custom_llm_config" in sys.modules:
                import custom_llm_config

                importlib.reload(custom_llm_config)
            else:
                import custom_llm_config

            from custom_llm_config import LLM_CONFIGURATIONS

            if LLM_CONFIGURATIONS:
                # 使用第一个可用的配置
                config_name = list(LLM_CONFIGURATIONS.keys())[0]
                config = LLM_CONFIGURATIONS[config_name]
                print(
                    f"✅ GeneralAgent 使用最新配置: {config_name} (provider={config.provider}, model={config.model_name})"
                )
                return config
            else:
                print(f"⚠️ GeneralAgent: 未找到可用的LLM配置")
                return None
        except Exception as e:
            print(f"⚠️ GeneralAgent 获取LLM配置失败: {e}")
            return None

    async def parse_requirement(self, prompt: str) -> Dict[str, Any]:
        """
        通用需求解析 - 直接传递Prompt给LLM
        """
        return {
            "subject": "general",
            "original": prompt,
            "concept_type": "dynamic",
            "timestamp": datetime.now().isoformat(),
        }

    async def match_template(
        self, requirement: Dict[str, Any]
    ) -> Optional[Dict[str, Any]]:
        """
        通用Agent不适用固定模板，返回一个"动态生成"的伪模板
        """
        return {
            "id": "dynamic_generation",
            "name": "AI动态生成",
            "description": "根据用户描述实时编写代码",
            "type": "dynamic",
        }

    async def generate_config(
        self,
        requirement: Dict[str, Any],
        template: Dict[str, Any],
        user_preferences: Dict[str, Any],
    ) -> Dict[str, Any]:
        """
        准备生成所需的上下文配置
        """
        return {
            "prompt": requirement["original"],
            "user_preferences": user_preferences,
            "template_id": "dynamic",
        }

    async def generate_visualization(self, config: Dict[str, Any]) -> str:
        """
        调用LLM生成可视化HTML代码
        """
        # 检查是否为 mock 模式
        user_preferences = config.get("user_preferences", {})
        if user_preferences.get("model") == "mock":
            print("🤖 GeneralAgent: Mock 模式，返回模拟 HTML")
            return self._generate_mock_html(config["prompt"])

        llm_config = await self._get_llm_config()
        if not llm_config:
            raise VisualizationError("LLM未配置，无法使用通用生成功能")

        prompt = config["prompt"]
        client = get_client(llm_config)

        # 构建系统提示词 - 核心逻辑
        system_prompt = """
You are an expert Data Visualization Engineer and Web Developer.
Your task is to generate a SINGLE, STANDALONE HTML file that visualizes the user's request.

Technical Constraints:
1. Use HTML5, CSS3, and JavaScript.
2. Use CDN libraries for visualization. Preferred libraries:
   - Plotly.js (https://cdn.plot.ly/plotly-latest.min.js) for charts and simple 3D.
   - Three.js (https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js) for complex 3D scenes.
   - MathJax (https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js) for math formulas.
3. The file must be self-contained. CSS and JS must be inside <style> and <script> tags.
4. The visualization must be INTERACTIVE (mouse controls, sliders if parameters are movable).
5. Do NOT output markdown code blocks. Output ONLY the raw HTML code.
6. Start immediately with <!DOCTYPE html>.
7. Handle window resize events to make the chart responsive.
8. Add a "Controls" panel (absolute positioned semi-transparent div) if there are adjustable parameters.

CRITICAL INSTRUCTION:
If the user provides a specific mathematical formula (e.g., "y = x^3", "sin(x)") that conflicts with their text description (e.g., "quadratic function", "linear"), YOU MUST PRIORITIZE THE FORMULA. The formula is the ground truth.
Example: If user says "Draw a quadratic function y=x^3", you must draw y=x^3 (cubic), NOT y=x^2.
IGNORE the text description if it contradicts the formula.
For "y=x^3", use a range that clearly shows the cubic nature (e.g., -2 to 2 or -5 to 5).

User Request:
"""
        full_prompt = f"{system_prompt}\n{prompt}"

        try:
            print(f"🤖 GeneralAgent: 调用LLM生成代码... (Prompt: {prompt[:50]}...)")
            response = await client.generate_response(full_prompt)

            # 清理响应 (移除可能存在的Markdown标记)
            cleaned_html = self._clean_llm_response(response)

            # 简单验证
            if "<!DOCTYPE html>" not in cleaned_html and "<html" not in cleaned_html:
                # 尝试修复，如果LLM只返回了代码片段
                cleaned_html = (
                    f"<!DOCTYPE html><html><body>{cleaned_html}</body></html>"
                )

            return cleaned_html

        except Exception as e:
            raise VisualizationError(f"LLM生成失败: {str(e)}")

    def _generate_mock_html(self, prompt: str) -> str:
        """生成模拟的HTML响应"""
        return f"""
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Mock Visualization</title>
    <style>
        body {{
            font-family: sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            background-color: #f0f2f5;
            margin: 0;
        }}
        .card {{
            background: white;
            padding: 40px;
            border-radius: 12px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
            text-align: center;
            max-width: 600px;
        }}
        h2 {{ color: #1a73e8; }}
        .mock-chart {{
            width: 100%;
            height: 200px;
            background: #e8f0fe;
            margin: 20px 0;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 8px;
            color: #1967d2;
            font-weight: bold;
        }}
    </style>
</head>
<body>
    <div class="card">
        <h2>Mock Visualization Mode</h2>
        <p>This is a simulated response for: <strong>{prompt}</strong></p>
        <div class="mock-chart">
            [ Interactive Chart Placeholder ]
        </div>
        <p style="color: #666; font-size: 0.9em;">
            To see real visualization, please select a real AI model (e.g., Gemini, Zhipu).
        </p>
    </div>
</body>
</html>
"""

    def _clean_llm_response(self, text: str) -> str:
        """清理LLM返回的Markdown标记"""
        # 移除 ```html ... ```
        pattern = r"```html\s*(.*?)\s*```"
        match = re.search(pattern, text, re.DOTALL)
        if match:
            return match.group(1)

        # 移除 ``` ... ```
        pattern = r"```\s*(.*?)\s*```"
        match = re.search(pattern, text, re.DOTALL)
        if match:
            return match.group(1)

        return text.strip()

    def get_supported_topics(self) -> List[str]:
        return ["通用", "任意主题", "数据可视化", "3D场景"]
