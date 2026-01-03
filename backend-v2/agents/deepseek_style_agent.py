"""
DeepSeek-R1 风格的 Manim 动画生成代理
基于 CSDN 文章：https://blog.csdn.net/qq_45019121/article/details/145351760

核心技术：
1. LaTeX Anchoring - 在提示中使用 LaTeX 提升准确率 62%
2. Dual-Stream Output - 同时生成动画代码 + 学习笔记
3. 智能参数优化 - 自动优化动画参数
"""

from openai import OpenAI
import os
import re
from typing import Dict, Optional
from pathlib import Path

class DeepSeekStyleAgent:
    """DeepSeek-R1 风格的动画生成器"""

    def __init__(self, api_key: str = None):
        """初始化代理（使用 GLM-4.6 模拟 DeepSeek-R1 的功能）"""
        self.client = OpenAI(
            api_key=api_key or os.getenv("ZHIPU_API_KEY"),
            base_url="https://open.bigmodel.cn/api/paas/v4/"
        )
        self.model = "glm-4-flash"  # 使用 GLM-4-Flash

    def generate_with_latex_anchoring(
        self,
        concept: str,
        latex_formula: str,
        scenario: str = "geometric_proof"
    ) -> Dict:
        """
        使用 LaTeX Anchoring 技术生成动画

        Args:
            concept: 概念描述（自然语言）
            latex_formula: LaTeX 格式的数学公式
            scenario: 场景类型

        Returns:
            包含代码、笔记、LaTeX 的字典
        """

        # 核心提示词工程 - 使用 LaTeX Anchoring
        system_prompt = """你是一个专业的数学动画生成器，基于 Manim 引擎。
你擅长将数学概念转化为精美的动画代码。

核心技术要点：
1. 始终在代码中包含 LaTeX 数学公式
2. 使用标准的 Manim API
3. 生成清晰的教学场景
4. 包含完整的动画序列

输出格式必须包含三个文件：
1. LaTeX 文件（.tex）- 数学公式和理论
2. Manim 脚本（.py）- 动画代码
3. Markdown 笔记（.md）- 学习笔记"""

        # 使用 LaTeX 锚定的用户提示
        user_prompt = f"""请为以下数学概念生成 Manim 动画：

**概念描述**: {concept}

**LaTeX 公式**: ${latex_formula}$

**场景要求**: {scenario}

请按照以下步骤生成：
1. 首先生成 LaTeX 文件，包含数学公式的完整推导
2. 然后生成 Manim Python 脚本，实现可视化
3. 最后生成 Markdown 学习笔记，详细解释概念

要求：
- LaTeX 代码要完整可编译
- Manim 代码要符合最佳实践
- 动画要清晰展示数学原理
- 使用颜色编码区分不同元素"""

        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                temperature=0.7,
                max_tokens=4000
            )

            content = response.choices[0].message.content

            # 解析三个文件的输出
            files = self._parse_dual_stream_output(content)

            return {
                "success": True,
                "content": content,
                "files": files,
                "method": "LaTeX Anchoring",
                "tokens_used": response.usage.total_tokens
            }

        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "method": "LaTeX Anchoring"
            }

    def _parse_dual_stream_output(self, content: str) -> Dict:
        """解析双流输出（LaTeX + Python + Markdown）"""
        files = {
            "latex": None,
            "python": None,
            "markdown": None
        }

        # 提取 LaTeX 文件
        latex_match = re.search(r'```latex\n(.*?)```', content, re.DOTALL)
        if latex_match:
            files["latex"] = latex_match.group(1)

        # 提取 Python 文件
        python_match = re.search(r'```python\n(.*?)```', content, re.DOTALL)
        if python_match:
            files["python"] = python_match.group(1)

        # 提取 Markdown 文件
        md_match = re.search(r'```markdown\n(.*?)```', content, re.DOTALL)
        if md_match:
            files["markdown"] = md_match.group(1)

        return files

    def generate_rectangle_diagonal(self) -> Dict:
        """
        生成文章中的矩形对角线动画（勾股定理）
        这是文章中提到的具体示例
        """
        concept = "验证勾股定理：矩形的对角线长度满足 a² + b² = c²"
        latex_formula = r"a^2 + b^2 = c^2"

        return self.generate_with_latex_anchoring(
            concept=concept,
            latex_formula=latex_formula,
            scenario="geometric_proof"
        )

    def generate_sine_function(self) -> Dict:
        """生成正弦函数动画"""
        concept = "单位圆与正弦函数的几何关系"
        latex_formula = r"\sin\alpha = \frac{y}{r}"

        return self.generate_with_latex_anchoring(
            concept=concept,
            latex_formula=latex_formula,
            scenario="trigonometry"
        )

    def clean_manim_code(self, code: str) -> str:
        """清理 Manim 代码（自动纠错）"""
        if not code:
            return code

        # 移除 markdown 代码块标记
        code = re.sub(r'```python\n?', '', code)
        code = re.sub(r'```', '', code)

        # 常见错误修复
        # 1. 确保导入语句正确
        if 'from manim import' not in code:
            code = 'from manim import *\n\n' + code

        # 2. 修复动画方法调用
        code = re.sub(
            r'(\w+)\.rotate\(([^)]+)\)',
            r'self.play(Rotate(\1, \2))',
            code
        )

        # 3. 修复不存在的类
        code = re.sub(r'RightTriangle\(', 'Polygon(', code)

        return code.strip()

    def save_files(self, files: Dict, output_dir: Path, scene_name: str):
        """保存生成的三个文件"""
        output_dir = Path(output_dir)
        output_dir.mkdir(parents=True, exist_ok=True)

        saved_files = {}

        # 保存 LaTeX 文件
        if files.get("latex"):
            tex_file = output_dir / f"{scene_name}.tex"
            tex_file.write_text(files["latex"], encoding="utf-8")
            saved_files["latex"] = str(tex_file)

        # 保存 Python 文件
        if files.get("python"):
            python_code = self.clean_manim_code(files["python"])
            py_file = output_dir / f"{scene_name}.py"
            py_file.write_text(python_code, encoding="utf-8")
            saved_files["python"] = str(py_file)

        # 保存 Markdown 文件
        if files.get("markdown"):
            md_file = output_dir / f"{scene_name}.md"
            md_file.write_text(files["markdown"], encoding="utf-8")
            saved_files["markdown"] = str(md_file)

        return saved_files


# 创建 DeepSeek 风格的实例
deepseek_agent = DeepSeekStyleAgent()
