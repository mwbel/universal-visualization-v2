"""
GLM-4.6 动画生成代理（优化版）
专门使用 GLM-4-Flash，避免余额问题
包含代码清理和验证功能
"""
import os
import re
from openai import OpenAI
from dotenv import load_dotenv
from typing import Dict, Optional

# 加载环境变量
load_dotenv()


class GLMAnimationAgent:
    """GLM-4.6 动画生成代理（使用 GLM-4-Flash）"""

    def __init__(self, api_key: str = None):
        """初始化 GLM 客户端"""
        self.api_key = api_key or os.getenv("ZHIPU_API_KEY")

        if not self.api_key:
            raise ValueError("未找到 ZHIPU_API_KEY，请设置环境变量")

        self.client = OpenAI(
            api_key=self.api_key,
            base_url="https://open.bigmodel.cn/api/paas/v4/"
        )

        # 固定使用 GLM-4-Flash（有免费额度，速度快）
        self.model = "glm-4-flash"

    def generate_from_terminology(
        self,
        term_chinese: str,
        term_english: str,
        math_symbol: str,
        save_to_file: bool = True
    ) -> Dict:
        """
        从数学术语生成动画

        Args:
            term_chinese: 中文术语
            term_english: 英文术语
            math_symbol: 数学符号（LaTeX 格式）
            save_to_file: 是否保存到文件

        Returns:
            {
                "success": True/False,
                "code": "Manim Python 代码",
                "notes": "学习笔记",
                "scene_name": "场景名称",
                "file_path": "代码文件路径"
            }
        """
        prompt = f"""请为以下数学术语创建一个教学动画：

中文术语: {term_chinese}
英文术语: {term_english}
数学符号: ${math_symbol}$

请生成 Manim Python 代码，要求：
1. 代码完整、可运行
2. 包含详细中文注释
3. 动画时长 10-15 秒
4. 场景简洁易懂

请只输出 Python 代码，不要其他解释文字。
代码不要使用 markdown 代码块包裹。
"""

        try:
            print(f"🤖 正在调用 {self.model} 生成动画...")

            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {
                        "role": "system",
                        "content": "你是专业的数学动画制作专家，精通 Manim 和 LaTeX。你只输出纯净的 Python 代码，不使用 markdown 代码块包裹。"
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                temperature=0.7,
                max_tokens=2048
            )

            raw_code = response.choices[0].message.content
            tokens_used = response.usage.total_tokens

            # 清理代码
            clean_code = self._clean_code(raw_code)

            # 验证代码
            validation = self._validate_code(clean_code)

            # 生成场景名称
            scene_name = self._generate_scene_name(term_chinese)

            # 保存到文件
            file_path = None
            if save_to_file and validation["valid"]:
                file_path = self._save_code(clean_code, scene_name)

            # 计算成本
            cost = (tokens_used / 1_000_000) * 0.1  # GLM-4-Flash 价格

            return {
                "success": validation["valid"],
                "code": clean_code,
                "notes": f"术语：{term_chinese} ({term_english})",
                "scene_name": scene_name,
                "file_path": file_path,
                "validation": validation,
                "tokens_used": tokens_used,
                "cost": cost,
                "model": self.model
            }

        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "code": None,
                "scene_name": term_chinese
            }

    def generate_from_concept(
        self,
        concept: str,
        latex: str = None,
        save_to_file: bool = True
    ) -> Dict:
        """从概念描述生成动画"""
        latex_section = f"\nLaTeX 表达式：{latex}" if latex else ""

        prompt = f"""请为以下数学概念创建教学动画：

概念描述: {concept}{latex_section}

请生成 Manim Python 代码，要求：
1. 代码完整、可运行
2. 包含详细中文注释
3. 动画时长 10-15 秒
4. 场景设计合理

请只输出 Python 代码，不要其他解释。
代码不要使用 markdown 代码块包裹。
"""

        try:
            print(f"🤖 正在调用 {self.model} 生成动画...")

            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {
                        "role": "system",
                        "content": "你是专业的数学动画制作专家，精通 Manim 和 LaTeX。你只输出纯净的 Python 代码，不使用 markdown 代码块包裹。"
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                temperature=0.7,
                max_tokens=2048
            )

            raw_code = response.choices[0].message.content
            tokens_used = response.usage.total_tokens

            # 清理代码
            clean_code = self._clean_code(raw_code)

            # 验证代码
            validation = self._validate_code(clean_code)

            # 生成场景名称
            scene_name = self._generate_scene_name(concept)

            # 保存到文件
            file_path = None
            if save_to_file and validation["valid"]:
                file_path = self._save_code(clean_code, scene_name)

            # 计算成本
            cost = (tokens_used / 1_000_000) * 0.1

            return {
                "success": validation["valid"],
                "code": clean_code,
                "notes": f"概念：{concept}",
                "scene_name": scene_name,
                "file_path": file_path,
                "validation": validation,
                "tokens_used": tokens_used,
                "cost": cost,
                "model": self.model
            }

        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "code": None,
                "scene_name": concept[:20]
            }

    def _clean_code(self, raw_code: str) -> str:
        """清理生成的代码"""
        code = raw_code.strip()

        # 移除 markdown 代码块
        if code.startswith("```python"):
            code = code[9:]
        elif code.startswith("```"):
            code = code[3:]

        if code.endswith("```"):
            code = code[:-3]

        # 清理多余空白
        code = code.strip()

        return code

    def _validate_code(self, code: str) -> Dict:
        """验证 Python 代码语法"""
        try:
            compile(code, '<string>', 'exec')
            return {"valid": True, "errors": []}
        except SyntaxError as e:
            return {
                "valid": False,
                "errors": [f"语法错误 (行 {e.lineno}): {e.msg}"]
            }
        except Exception as e:
            return {
                "valid": False,
                "errors": [str(e)]
            }

    def _generate_scene_name(self, name: str) -> str:
        """生成场景名称"""
        # 移除特殊字符，只保留字母、数字、中文
        clean_name = re.sub(r'[^\w\u4e00-\u9fff]+', '_', name)
        # 转换为驼峰命名
        return clean_name[:50]  # 限制长度

    def _save_code(self, code: str, scene_name: str) -> str:
        """保存代码到文件"""
        output_dir = "output/animations"
        os.makedirs(output_dir, exist_ok=True)

        file_path = os.path.join(output_dir, f"{scene_name}.py")

        with open(file_path, "w", encoding="utf-8") as f:
            f.write(code)

        return file_path


# ========== 批量生成功能 ==========

def batch_generate_from_terminology_file(
    markdown_file: str,
    chapter: str = None,
    max_count: int = None
) -> list:
    """
    从术语文件批量生成动画

    Args:
        markdown_file: 术语 Markdown 文件路径
        chapter: 指定章节（如 "第1章"）
        max_count: 最大生成数量（用于测试）

    Returns:
        生成结果列表
    """
    # TODO: 实现从 Markdown 文件读取术语
    # 这里先提供一个示例

    agent = GLMAnimationAgent()

    # 示例术语
    terms = [
        {"chinese": "集合", "english": "Set", "symbol": r"A, B, C"},
        {"chinese": "元素", "english": "Element", "symbol": r"a, b, c"},
        {"chinese": "属于", "english": "Belongs to", "symbol": r"\in"},
    ]

    results = []

    for i, term in enumerate(terms):
        if max_count and i >= max_count:
            break

        print(f"\n[{i+1}/{len(terms)}] 正在生成: {term['chinese']}")

        result = agent.generate_from_terminology(
            term_chinese=term["chinese"],
            term_english=term["english"],
            math_symbol=term["symbol"]
        )

        results.append(result)

        if result["success"]:
            print(f"   ✅ 成功 - 成本: ¥{result['cost']:.6f}")
        else:
            print(f"   ❌ 失败 - {result.get('error', '未知错误')}")

    # 统计
    total_cost = sum(r.get("cost", 0) for r in results)
    success_count = sum(1 for r in results if r["success"])

    print(f"\n{'='*60}")
    print(f"批量生成完成！")
    print(f"成功: {success_count}/{len(results)}")
    print(f"总成本: ¥{total_cost:.6f}")
    print(f"平均每个: ¥{total_cost/len(results):.6f}")
    print(f"{'='*60}")

    return results


# ========== 使用示例 ==========

if __name__ == "__main__":
    print("🚀 GLM-4.6 动画生成代理（优化版）\n")

    agent = GLMAnimationAgent()

    # 示例 1: 从术语生成
    print("=" * 60)
    print("示例 1: 从数学术语生成动画")
    print("=" * 60)

    result1 = agent.generate_from_terminology(
        term_chinese="正弦",
        term_english="Sine",
        math_symbol=r"\sin \alpha = \frac{y}{r}"
    )

    if result1["success"]:
        print(f"\n✅ 生成成功！")
        print(f"场景名称: {result1['scene_name']}")
        print(f"文件路径: {result1['file_path']}")
        print(f"使用的 tokens: {result1['tokens_used']}")
        print(f"成本: ¥{result1['cost']:.6f}")
        print(f"\n代码预览（前 10 行）:")
        print("-" * 60)
        lines = result1['code'].split('\n')
        for line in lines[:10]:
            print(line)
        print("-" * 60)
    else:
        print(f"\n❌ 生成失败: {result1.get('error')}")

    # 示例 2: 从概念生成
    print("\n" + "=" * 60)
    print("示例 2: 从概念描述生成动画")
    print("=" * 60)

    result2 = agent.generate_from_concept(
        concept="展示勾股定理的几何证明",
        latex=r"a^2 + b^2 = c^2"
    )

    if result2["success"]:
        print(f"\n✅ 生成成功！")
        print(f"场景名称: {result2['scene_name']}")
        print(f"成本: ¥{result2['cost']:.6f}")
    else:
        print(f"\n❌ 生成失败: {result2.get('error')}")
