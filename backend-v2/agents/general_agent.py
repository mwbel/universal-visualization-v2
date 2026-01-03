"""
万物可视化 v2.0 - 通用可视化Agent
方案A核心组件：利用LLM动态生成可视化代码，不再依赖预设模板
"""

from typing import Dict, List, Optional, Any
import json
import re
from datetime import datetime
import asyncio

from .base_agent import BaseVisualizationAgent, VisualizationError
from custom_llm_config import LLMConfig, LLMProvider, get_client, load_config_from_file

class GeneralVisualizationAgent(BaseVisualizationAgent):
    """
    通用可视化Agent
    直接调用LLM生成前端代码(HTML/JS/Plotly/Three.js)
    """

    def __init__(self):
        super().__init__("general", {
            "supported_topics": ["any"],
            "capabilities": ["dynamic_generation", "code_writing"]
        })
        
        # 加载LLM配置
        # 注意: 实际部署时应从环境变量或配置文件加载安全密钥
        # 这里为了演示，假设使用一个默认配置或从文件中读取
        try:
            # 尝试加载自定义配置
            self.llm_config = LLMConfig(
                provider=LLMProvider.OPENAI, # 默认为OpenAI，实际会根据配置调整
                model_name="gpt-4o",
                api_key="os.environ.get('OPENAI_API_KEY')", # 占位符
                temperature=0.7
            )
            # 尝试从文件加载真实配置
            configs = load_config_from_file("llm_config.json")
            if "default" in configs:
                self.llm_config = configs["default"]
            elif configs:
                # 使用第一个可用配置
                self.llm_config = list(configs.values())[0]
                
        except Exception as e:
            print(f"⚠️ GeneralAgent LLM配置加载失败: {e}")
            self.llm_config = None

    async def parse_requirement(self, prompt: str) -> Dict[str, Any]:
        """
        通用需求解析 - 直接传递Prompt给LLM
        """
        return {
            "subject": "general",
            "original": prompt,
            "concept_type": "dynamic",
            "timestamp": datetime.now().isoformat()
        }

    async def match_template(self, requirement: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        通用Agent不适用固定模板，返回一个"动态生成"的伪模板
        """
        return {
            "id": "dynamic_generation",
            "name": "AI动态生成",
            "description": "根据用户描述实时编写代码",
            "type": "dynamic"
        }

    async def generate_config(self, requirement: Dict[str, Any], template: Dict[str, Any], user_preferences: Dict[str, Any]) -> Dict[str, Any]:
        """
        准备生成所需的上下文配置
        """
        return {
            "prompt": requirement["original"],
            "user_preferences": user_preferences,
            "template_id": "dynamic"
        }

    async def generate_visualization(self, config: Dict[str, Any]) -> str:
        """
        调用LLM生成可视化HTML代码
        """
        if not self.llm_config:
            raise VisualizationError("LLM未配置，无法使用通用生成功能")

        prompt = config["prompt"]
        client = get_client(self.llm_config)

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
                 cleaned_html = f"<!DOCTYPE html><html><body>{cleaned_html}</body></html>"
            
            return cleaned_html

        except Exception as e:
            raise VisualizationError(f"LLM生成失败: {str(e)}")

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
