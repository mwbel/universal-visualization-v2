"""
AI Service - AI 对话服务（集成 RAG 增强）
"""
import os
import requests
import json
import re
from typing import Optional

# API 配置 - 使用智谱 GLM-4
API_KEY = os.getenv("ZHIPU_API_KEY", "8992de2379654f96bd128f6711dc6339.CLJFa7LIkUaX7bWy")
API_URL = "https://open.bigmodel.cn/api/paas/v4/chat/completions"
# 使用用户要求的最新模型
MODEL_NAME = "glm-4" 

# 延迟导入 RAG 服务（避免循环依赖）
_rag_service = None

def get_rag():
    """获取 RAG 服务实例"""
    global _rag_service
    if _rag_service is None:
        try:
            from app.services.rag_service import get_rag_service
            _rag_service = get_rag_service()
        except Exception as e:
            print(f"RAG 服务加载失败: {e}")
            _rag_service = None
    return _rag_service


class AIService:
    """AI 对话服务"""
    
    # RAG 增强开关
    RAG_ENABLED = True
    
    @staticmethod
    def generate_response(
        prompt: str, 
        context: str = "", 
        generate_code: bool = True,
        use_rag: bool = True
    ) -> dict:
        """
        使用智谱AI生成响应和可视化代码（支持 RAG 增强）
        
        Args:
            prompt: 用户问题
            context: 额外上下文
            generate_code: 是否生成可视化代码
            use_rag: 是否使用 RAG 增强
            
        Returns:
            {
                "content": str,           # AI 回答
                "viz_code": str|None,     # 可视化代码
                "viz_type": str|None,     # 可视化类型
                "rag_context": str|None,  # RAG 检索的上下文
                "rag_sources": list|None  # RAG 来源
            }
        """
        rag_context = ""
        rag_sources = []
        
        # RAG 增强：检索相关知识
        if use_rag and AIService.RAG_ENABLED:
            rag = get_rag()
            if rag and rag.is_ready:
                try:
                    # 检索相关文档
                    results = rag.search(prompt, top_k=3)
                    if results:
                        rag_context = rag.get_context_for_query(prompt)
                        rag_sources = [
                            {"topic": r.topic, "source": r.source, "score": r.score}
                            for r in results
                        ]
                except Exception as e:
                    print(f"RAG 检索失败: {e}")
        
        # 构建增强的系统提示词
        system_prompt = AIService._build_system_prompt(generate_code, bool(rag_context))
        
        # 构建用户消息（包含 RAG 上下文）
        user_content = AIService._build_user_content(prompt, context, rag_context)
        
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {API_KEY}"
        }

        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_content}
        ]

        payload = {
            "model": MODEL_NAME,
            "messages": messages,
            "temperature": 0.7,
            "max_tokens": 2000
        }

        try:
            response = requests.post(API_URL, headers=headers, json=payload, timeout=30)
            response.raise_for_status()

            data = response.json()
            if "choices" in data and len(data["choices"]) > 0:
                content = data["choices"][0]["message"]["content"]

                # 提取可视化代码
                viz_code, viz_type = AIService._extract_viz_code(content)

                return {
                    "content": content,
                    "viz_code": viz_code,
                    "viz_type": viz_type,
                    "rag_context": rag_context if rag_context else None,
                    "rag_sources": rag_sources if rag_sources else None
                }
            else:
                return AIService._error_response("抱歉，我暂时无法回答这个问题。")

        except requests.exceptions.Timeout:
            return AIService._error_response("AI 服务响应超时，请稍后再试。")
        except Exception as e:
            print(f"AI Service Error: {e}")
            return AIService._error_response(f"AI 服务暂时不可用：{str(e)}")
    
    @staticmethod
    def _build_system_prompt(generate_code: bool, has_rag_context: bool) -> str:
        """构建系统提示词"""
        base_prompt = """你是 Aha Tutor，一位专业的高中数学AI助教。

你的特点：
1. 精准解答数学问题，步骤清晰
2. 用中文回答，使用 LaTeX 格式的数学公式（用 $ 包裹行内公式，$$ 包裹块级公式）
3. 回答时引用知识库中的相关内容，确保准确性"""

        if has_rag_context:
            base_prompt += """
4. 当提供了知识库参考时，优先使用这些内容来回答问题
5. 如果知识库内容与问题直接相关，请明确引用"""

        if generate_code:
            base_prompt += """

当需要生成可视化时，请按以下格式在回复中包含代码：

```plotly
import plotly.graph_objects as go
# 创建 fig 对象并添加内容
fig = go.Figure()
# ... 你的代码
```

你的代码必须创建一个名为 `fig` 的 Plotly Figure 对象，且不需要调用 `fig.show()`。

支持的可视化类型：
- cartesian_plot: 函数图像
- number_line: 数轴/区间图
- venn: 集合韦恩图
- coordinate_geometry: 坐标几何图形

保持代码简洁，确保可以在后端正确执行并返回 JSON。"""

        return base_prompt
    
    @staticmethod
    def _build_user_content(prompt: str, context: str, rag_context: str) -> str:
        """构建用户消息内容"""
        parts = []
        
        # 添加 RAG 知识库上下文
        if rag_context:
            parts.append(f"【知识库参考】\n{rag_context}")
        
        # 添加额外上下文
        if context:
            parts.append(f"【当前状态】{context}")
        
        # 添加用户问题
        parts.append(f"【用户问题】{prompt}")
        
        return "\n\n".join(parts)
    
    @staticmethod
    def _extract_viz_code(content: str) -> tuple:
        """从回复中提取可视化代码"""
        viz_code = None
        viz_type = None

        # 查找 plotly 代码块
        plotly_match = re.search(r'```plotly\n(.*?)```', content, re.DOTALL)
        if plotly_match:
            viz_code = plotly_match.group(1).strip()
            # 检测可视化类型
            if "go.Figure" in viz_code or "go.Scatter" in viz_code:
                viz_type = "cartesian_plot"
            elif "go.Layout" in viz_code and "shapes" in viz_code:
                viz_type = "number_line"
            elif "shapes" in viz_code and "circle" in viz_code.lower():
                viz_type = "venn"
        
        return viz_code, viz_type
    
    @staticmethod
    def _error_response(message: str) -> dict:
        """构建错误响应"""
        return {
            "content": message,
            "viz_code": None,
            "viz_type": None,
            "rag_context": None,
            "rag_sources": None
        }

    @staticmethod
    def generate_visualization(topic: str, knowledge_point: dict) -> dict:
        """
        为特定知识点生成可视化
        """
        prompt = f"""请为以下数学知识点生成一个 Plotly 可视化：

知识点：{knowledge_point.get('title', '')}
详细说明：{knowledge_point.get('details', '')}

要求：
1. 生成清晰、直观的可视化
2. 添加适当的标签和注释
3. 使用适合的图表类型
4. 只返回 Plotly Python 代码，不要其他解释

代码格式：
```python
import plotly.graph_objects as go

fig = go.Figure()
# 你的代码

return fig
```"""

        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {API_KEY}"
        }

        messages = [
            {"role": "system", "content": "你是专业的数学可视化专家。只生成 Plotly Python 代码。"},
            {"role": "user", "content": prompt}
        ]

        payload = {
            "model": MODEL_NAME,
            "messages": messages,
            "temperature": 0.3
        }

        try:
            response = requests.post(API_URL, headers=headers, json=payload, timeout=30)
            response.raise_for_status()

            data = response.json()
            if "choices" in data and len(data["choices"]) > 0:
                content = data["choices"][0]["message"]["content"]

                # 提取代码
                code_match = re.search(r'```python\n(.*?)```', content, re.DOTALL)
                if code_match:
                    return {"success": True, "code": code_match.group(1).strip()}

                # 尝试提取其他格式的代码
                code_match = re.search(r'```.*?\n(.*?)```', content, re.DOTALL)
                if code_match:
                    return {"success": True, "code": code_match.group(1).strip()}

            return {"success": False, "error": "无法生成可视化代码"}

        except Exception as e:
            return {"success": False, "error": str(e)}
    
    @staticmethod
    def chat_with_rag(message: str, history: list = None) -> dict:
        """
        带历史记录的 RAG 增强对话
        
        Args:
            message: 用户消息
            history: 对话历史 [{"role": "user/assistant", "content": "..."}]
            
        Returns:
            AI 响应
        """
        # 构建上下文（从历史记录）
        context = ""
        if history:
            recent_history = history[-4:]  # 只取最近 4 条
            context = "\n".join([
                f"{'用户' if h['role'] == 'user' else 'AI'}: {h['content'][:100]}"
                for h in recent_history
            ])
        
        return AIService.generate_response(
            prompt=message,
            context=context,
            generate_code=True,
            use_rag=True
        )

    @staticmethod
    def generate_practice_question(topic: str, category: str) -> dict:
        """
        生成符合特定专题和类别的数学练习题
        """
        prompt = f"""请为以下数学专题生成一道【{category}】练习题：
专题：{topic}

要求：
1. 题目难度应符合“{category}”的定位（基础练为基础题，押题练为综合性较强的模拟题）。
2. 提供4个选项，并指出正确答案。
3. 提供详细的解析。
4. 必须使用 LaTeX 格式书写数学公式（如 $...$）。
5. 严格按以下 JSON 格式返回，不要包含任何其他说明文字：

{{
    "question": "题目内容",
    "options": ["A. 选项1", "B. 选项2", "C. 选项3", "D. 选项4"],
    "answer": "A/B/C/D",
    "explanation": "详细解析"
}}
"""
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {API_KEY}"
        }

        messages = [
            {"role": "system", "content": "你是一个专业的数学教研员。只能输出 JSON 格式。"},
            {"role": "user", "content": prompt}
        ]

        payload = {
            "model": MODEL_NAME,
            "messages": messages,
            "temperature": 0.7,
            "response_format": {"type": "json_object"}
        }

        try:
            response = requests.post(API_URL, headers=headers, json=payload, timeout=30)
            response.raise_for_status()

            data = response.json()
            if "choices" in data and len(data["choices"]) > 0:
                content_str = data["choices"][0]["message"]["content"]
                # 尝试解析 JSON
                try:
                    question_data = json.loads(re.search(r'(\{.*\})', content_str, re.DOTALL).group(1))
                    question_data["topic"] = topic
                    question_data["category"] = category
                    return {"success": True, "data": question_data}
                except Exception as e:
                    print(f"JSON 解析失败: {e}, 内容: {content_str}")
                    return {"success": False, "error": "AI 生成的格式不正确"}
            
            return {"success": False, "error": "AI 无法生成题目"}
        except Exception as e:
            print(f"AI Practice Gen Error: {e}")
            return {"success": False, "error": str(e)}
