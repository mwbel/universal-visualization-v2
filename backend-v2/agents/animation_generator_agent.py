"""
多模型支持的动画生成代理
支持 GLM-4.6 和 DeepSeek，自动选择最优模型
"""
import os
from enum import Enum
from typing import Dict, Optional, Literal
from openai import OpenAI

class ModelProvider(str, Enum):
    """模型提供商"""
    GLM = "glm"
    DEEPSEEK = "deepseek"
    OPENAI = "openai"

class AnimationGeneratorAgent:
    """支持多模型的动画生成代理"""

    # 模型配置
    MODEL_CONFIGS = {
        ModelProvider.GLM: {
            "base_url": "https://open.bigmodel.cn/api/paas/v4/",
            "models": {
                "flash": "glm-4-flash",      # 极速：¥0.1/百万tokens
                "air": "glm-4-air",          # 高性能：¥0.5/百万tokens
                "standard": "glm-4-0520",    # 标准：¥0.5/百万tokens
                "plus": "glm-4-plus"         # 旗舰：¥0.5/百万tokens
            },
            "api_key_env": "ZHIPU_API_KEY",
            "default_model": "air"  # 平衡性能和成本
        },
        ModelProvider.DEEPSEEK: {
            "base_url": "https://api.deepseek.com",
            "models": {
                "chat": "deepseek-chat",         # 对话：¥1-2/百万tokens
                "reasoner": "deepseek-reasoner"  # 推理：¥1-32/百万tokens
            },
            "api_key_env": "DEEPSEEK_API_KEY",
            "default_model": "chat"
        }
    }

    def __init__(
        self,
        provider: ModelProvider = ModelProvider.GLM,  # 默认用 GLM
        model_type: str = None,
        api_key: str = None
    ):
        """
        初始化代理

        Args:
            provider: 模型提供商 (默认 GLM)
            model_type: 模型类型
            api_key: API 密钥
        """
        self.provider = provider
        self.config = self.MODEL_CONFIGS[provider]

        # 选择模型
        if model_type is None:
            model_type = self.config["default_model"]

        self.model = self.config["models"][model_type]

        # 初始化客户端
        self.client = OpenAI(
            api_key=api_key or os.getenv(self.config["api_key_env"]),
            base_url=self.config["base_url"]
        )

        # 加载术语库
        self.terminology_db = self._load_terminology()

    def generate_from_terminology(
        self,
        term_chinese: str,
        term_english: str,
        math_symbol: str,
        complexity: str = "auto"
    ) -> Dict:
        """
        从数学术语生成动画（支持智能模型选择）

        Args:
            term_chinese: 中文术语
            term_english: 英文术语
            math_symbol: 数学符号
            complexity: 复杂度 ("low", "medium", "high", "auto")

        Returns:
            生成结果字典
        """
        # 自动评估复杂度
        if complexity == "auto":
            complexity = self._assess_complexity(
                term_chinese, math_symbol
            )

        # 根据复杂度选择模型
        optimal_provider = self._select_provider_by_complexity(complexity)

        # 如果需要切换模型
        if optimal_provider != self.provider:
            print(f"检测到复杂度: {complexity}, 切换到 {optimal_provider.value}")
            temp_agent = AnimationGeneratorAgent(
                provider=optimal_provider,
                model_type=self._get_model_for_complexity(optimal_provider, complexity)
            )
            return temp_agent._generate_animation_code(
                term_chinese, term_english, math_symbol
            )

        # 使用当前模型生成
        return self._generate_animation_code(
            term_chinese, term_english, math_symbol
        )

    def generate_from_concept(
        self,
        concept: str,
        latex: str = None,
        complexity: str = "auto"
    ) -> Dict:
        """从数学概念生成动画"""
        if complexity == "auto":
            complexity = self._assess_complexity(concept, latex)

        optimal_provider = self._select_provider_by_complexity(complexity)

        if optimal_provider != self.provider:
            temp_agent = AnimationGeneratorAgent(provider=optimal_provider)
            return temp_agent._generate_concept_animation(concept, latex)

        return self._generate_concept_animation(concept, latex)

    def _assess_complexity(self, concept: str, latex: str = None) -> str:
        """
        评估任务复杂度

        策略：
        - Low: 简单图形、基础概念
        - Medium: 函数图像、标准公式
        - High: 推导证明、级数、多步骤
        """
        concept_lower = concept.lower()

        # 简单任务指标
        simple_indicators = [
            "绘制", "展示", "图形", "图像", "直线", "圆", "矩形",
            "triangle", "circle", "rectangle", "plot", "show"
        ]

        # 复杂任务指标
        complex_indicators = [
            "推导", "证明", "级数", "微分", "积分", "极限",
            "derivative", "integral", "series", "proof", "limit",
            "逼近", "变换", "泰勒", "傅里叶"
        ]

        # LaTeX 复杂度评估
        if latex:
            # 包含积分符号
            if r"\int" in latex or r"\sum" in latex:
                return "high"
            # 包含分数和根号
            if r"\frac" in latex or r"\sqrt" in latex:
                return "medium"
            # 包含上下标
            if "^" in latex or "_" in latex:
                return "medium"

        # 基于关键词判断
        simple_count = sum(1 for kw in simple_indicators if kw in concept_lower)
        complex_count = sum(1 for kw in complex_indicators if kw in concept_lower)

        if complex_count > 0:
            return "high"
        elif simple_count > 0:
            return "low"
        else:
            return "medium"

    def _select_provider_by_complexity(self, complexity: str) -> ModelProvider:
        """根据复杂度选择最优模型提供商"""
        # 策略：大部分用 GLM，只有特别复杂的用 DeepSeek
        if complexity == "high":
            return ModelProvider.DEEPSEEK
        else:
            return ModelProvider.GLM

    def _get_model_for_complexity(
        self,
        provider: ModelProvider,
        complexity: str
    ) -> str:
        """获取适合复杂度的模型"""
        if provider == ModelProvider.GLM:
            mapping = {
                "low": "flash",      # 最快最便宜
                "medium": "air",     # 平衡
                "high": "plus"       # 最强
            }
        else:  # DEEPSEEK
            mapping = {
                "low": "chat",
                "medium": "chat",
                "high": "reasoner"   # 推理模式
            }

        return mapping.get(complexity, "air")

    def _generate_animation_code(
        self,
        term_chinese: str,
        term_english: str,
        math_symbol: str
    ) -> Dict:
        """生成动画代码（内部方法）"""
        prompt = f"""请为以下数学术语创建一个教学动画：

**中文术语**: {term_chinese}
**英文术语**: {term_english}
**数学符号**: ${math_symbol}$

请生成：
1. Manim Python 代码（完整可运行）
2. LaTeX 源文件
3. Markdown 学习笔记（中文）
4. 场景设计说明

要求：
- 动画时长 10-15 秒
- 代码规范、注释详细
- 使用中文说明
- 场景简洁易懂
"""

        system_prompt = "你是专业的数学动画制作专家，精通 Manim、LaTeX 和数学教学。"

        response = self.client.chat.completions.create(
            model=self.model,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7,
            max_tokens=4096
        )

        content = response.choices[0].message.content
        return self._parse_response(content, term_chinese)

    def _generate_concept_animation(
        self,
        concept: str,
        latex: str = None
    ) -> Dict:
        """从概念生成动画（内部方法）"""
        latex_section = f"\n\nLaTeX 表达式：{latex}" if latex else ""

        prompt = f"""请为以下数学概念创建教学动画：

**概念描述**: {concept}{latex_section}

请生成：
1. Manim Python 代码（完整可运行）
2. LaTeX 源文件
3. Markdown 学习笔记
4. 场景设计说明

要求：
- 动画时长 10-15 秒
- 代码规范、注释详细
- 场景设计合理
"""

        system_prompt = "你是专业的数学动画制作专家，精通 Manim 和 LaTeX。"
        if self.provider == ModelProvider.GLM:
            system_prompt += " 你对中文理解优秀，请充分利用这一优势。"
        else:
            system_prompt += " 请使用你的推理能力，先思考场景设计，再生成代码。"

        response = self.client.chat.completions.create(
            model=self.model,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7,
            max_tokens=4096
        )

        content = response.choices[0].message.content
        return self._parse_response(content, concept)

    def _parse_response(self, content: str, scene_name: str) -> Dict:
        """解析 API 响应"""
        # 简化版解析（实际需要更复杂的逻辑）
        return {
            "raw_response": content,
            "scene_name": scene_name.replace(" ", "_").replace("/", "_")[:50],
            "provider": self.provider.value,
            "model": self.model
        }

    def _load_terminology(self) -> Dict:
        """加载术语数据库"""
        # TODO: 实现从 Markdown 文件加载
        return {}


# ========== 使用示例 ==========

def test_simple_terminology():
    """测试：简单术语（应该用 GLM-Flash）"""
    agent = AnimationGeneratorAgent(provider=ModelProvider.GLM)

    result = agent.generate_from_terminology(
        term_chinese="正弦",
        term_english="Sine",
        math_symbol=r"\sin \alpha = \frac{y}{r}",
        complexity="auto"  # 自动选择
    )

    print(f"使用的模型: {result['provider']} - {result['model']}")
    # 预期: glm - glm-4-flash (最便宜最快)


def test_complex_concept():
    """测试：复杂概念（应该用 DeepSeek-Reasoner）"""
    agent = AnimationGeneratorAgent(provider=ModelProvider.GLM)

    result = agent.generate_from_concept(
        concept="展示傅里叶级数逼近方波的过程，包含前5项的逐步逼近",
        latex=r"f(x) = \frac{4}{\pi}\sum_{n=1,3,5...}^{\infty}\frac{\sin(nx)}{n}",
        complexity="auto"  # 自动选择
    )

    print(f"使用的模型: {result['provider']} - {result['model']}")
    # 预期: deepseek - deepseek-reasoner (最强推理)


def batch_generate_from_terminology_file():
    """批量从术语文件生成动画"""
    agent = AnimationGeneratorAgent(provider=ModelProvider.GLM)

    # 示例：从术语表读取
    terms = [
        {"chinese": "集合", "english": "Set", "symbol": r"\{1, 2, 3\}"},
        {"chinese": "函数", "english": "Function", "symbol": r"f: A \to B"},
        {"chinese": "导数", "english": "Derivative", "symbol": r"f'(x) = \lim_{h\to 0}\frac{f(x+h)-f(x)}{h}"},
    ]

    results = []
    for term in terms:
        print(f"正在生成: {term['chinese']}...")
        result = agent.generate_from_terminology(
            term_chinese=term["chinese"],
            term_english=term["english"],
            math_symbol=term["symbol"],
            complexity="auto"
        )
        results.append(result)
        print(f"  使用模型: {result['provider']} - {result['model']}")

    return results


if __name__ == "__main__":
    print("=== 测试 1: 简单术语 ===")
    test_simple_terminology()

    print("\n=== 测试 2: 复杂概念 ===")
    test_complex_concept()

    print("\n=== 测试 3: 批量生成 ===")
    batch_generate_from_terminology_file()
