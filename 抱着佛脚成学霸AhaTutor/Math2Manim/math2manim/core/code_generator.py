"""
代码生成器 - 生成 Manim 动画代码

基于概念分析和知识树，生成高质量的 Manim 代码
"""

from typing import Optional, Dict, Any, List
from dataclasses import dataclass

from .knowledge_tree import KnowledgeNode
from .concept_analyzer import ConceptAnalysis


@dataclass
class GeneratedCode:
    """生成的代码结果"""

    code: str
    """Manim 代码"""

    scene_name: str
    """场景类名"""

    concept: str
    """概念名称"""

    quality: str = "m"
    """质量级别 (l/m/h/k)"""

    metadata: Dict[str, Any] = None
    """额外元数据"""

    def __post_init__(self):
        if self.metadata is None:
            self.metadata = {}


class CodeGenerator:
    """
    Manim 代码生成器

    支持两种模式：
    1. 模板模式：使用预定义模板
    2. AI 模式：使用 LLM 生成代码
    """

    # 代码模板
    TEMPLATES = {
        "偏导数": """from manim import *
import numpy as np

class PartialDerivative(ThreeDScene):
    def construct(self):
        # 1. 标题（2D部分）
        title = Text("偏导数", font_size=48, color=BLUE, weight=BOLD)
        subtitle = Text("Partial Derivative", font_size=28, color=GRAY)
        subtitle.next_to(title, DOWN)

        self.play(Write(title))
        self.play(FadeIn(subtitle))
        self.wait(1)

        # 移到顶部
        title_group = VGroup(title, subtitle)
        self.play(title_group.animate.scale(0.6).to_edge(UP))
        self.wait(0.5)

        # 2. 定义和公式
        definition = Text("对多元函数，固定其他变量，对某一变量求导", font_size=24)
        definition.to_edge(UP, buff=1.5)

        formula = MathTex(
            r"\\frac{\\partial f}{\\partial x} = \\lim_{h \\to 0} \\frac{f(x+h, y) - f(x, y)}{h}",
            font_size=36
        )
        formula.next_to(definition, DOWN, buff=0.5)

        self.play(Write(definition))
        self.wait(1)
        self.play(Write(formula))
        self.wait(2)

        # 3. 三维曲面示例
        self.play(FadeOut(definition), FadeOut(formula), FadeOut(title_group))

        # 设置3D相机角度
        self.set_camera_orientation(phi=75 * DEGREES, theta=30 * DEGREES)

        # 创建3D坐标系
        axes = ThreeDAxes(
            x_range=[-2, 2, 1],
            y_range=[-2, 2, 1],
            z_range=[0, 8, 2],
            x_length=6,
            y_length=6,
            z_length=5
        )

        # 创建曲面 z = x^2 + y^2
        surface = Surface(
            lambda u, v: axes.c2p(u, v, u**2 + v**2),
            u_range=[-2, 2],
            v_range=[-2, 2],
            resolution=(30, 30),
            fill_opacity=0.8,
            checkerboard_colors=[BLUE_D, BLUE_E]
        )

        # 添加标签（固定在屏幕空间）
        func_label = MathTex("f(x,y) = x^2 + y^2", font_size=36)
        func_label.to_corner(UL)
        self.add_fixed_in_frame_mobjects(func_label)

        self.play(Create(axes))
        self.play(Write(func_label))
        self.wait(0.5)
        self.play(Create(surface), run_time=2)
        self.wait(1)

        # 旋转相机以展示3D效果
        self.begin_ambient_camera_rotation(rate=0.3)
        self.wait(3)
        self.stop_ambient_camera_rotation()

        # 4. 显示偏导数和切线
        # 选择一个点 (1, 0)
        point_x, point_y = 1, 0
        point_z = point_x**2 + point_y**2

        # 在曲面上标记点
        dot = Dot3D(axes.c2p(point_x, point_y, point_z), color=RED, radius=0.1)
        self.play(Create(dot))
        self.wait(0.5)

        # x方向的切线 (固定y=0, 变化x)
        # 切线方程: z - z0 = (∂f/∂x)|_(x0,y0) * (x - x0)
        # ∂f/∂x = 2x, 在点(1,0)处 = 2
        # 切线: z - 1 = 2(x - 1), 即 z = 2x - 1
        dx = 0.8
        tangent_x = Line3D(
            axes.c2p(point_x - dx, point_y, point_z + 2 * point_x * (-dx)),
            axes.c2p(point_x + dx, point_y, point_z + 2 * point_x * dx),
            color=YELLOW,
            thickness=0.03
        )

        # y方向的切线 (固定x=1, 变化y)
        # 切线方程: z - z0 = (∂f/∂y)|_(x0,y0) * (y - y0)
        # ∂f/∂y = 2y, 在点(1,0)处 = 0
        # 切线: z - 1 = 0, 即 z = 1 (水平线)
        dy = 0.8
        tangent_y = Line3D(
            axes.c2p(point_x, point_y - dy, point_z),
            axes.c2p(point_x, point_y + dy, point_z),
            color=GREEN,
            thickness=0.03
        )

        # 显示偏导数公式
        partial_x = MathTex(
            r"\\frac{\\partial f}{\\partial x} = 2x",
            font_size=32,
            color=YELLOW
        )
        partial_y = MathTex(
            r"\\frac{\\partial f}{\\partial y} = 2y",
            font_size=32,
            color=GREEN
        )

        partial_x.to_corner(UR)
        partial_y.next_to(partial_x, DOWN, aligned_edge=RIGHT)
        self.add_fixed_in_frame_mobjects(partial_x, partial_y)

        # 显示x方向切线和公式
        self.play(Write(partial_x))
        self.play(Create(tangent_x))
        self.wait(1.5)

        # 显示y方向切线和公式
        self.play(Write(partial_y))
        self.play(Create(tangent_y))
        self.wait(1.5)

        # 添加说明文字
        explanation = Text("偏导数 = 切线斜率", font_size=28, color=WHITE)
        explanation.to_edge(DOWN)
        self.add_fixed_in_frame_mobjects(explanation)
        self.play(Write(explanation))
        self.wait(2)

        # 5. 淡出
        self.play(*[FadeOut(mob) for mob in self.mobjects])
        self.wait(0.5)
""",
        "勾股定理": """from manim import *

class PythagoreanTheorem(Scene):
    def construct(self):
        # 标题
        title = Text("勾股定理", font_size=48)
        title.to_edge(UP)
        self.play(Write(title))
        self.wait()

        # 创建直角三角形
        triangle = Polygon(
            ORIGIN, RIGHT * 3, RIGHT * 3 + UP * 4,
            color=BLUE
        )
        triangle.shift(LEFT * 2)

        # 标注边长
        a_label = MathTex("a", color=YELLOW).next_to(triangle, DOWN)
        b_label = MathTex("b", color=YELLOW).next_to(triangle, RIGHT)
        c_label = MathTex("c", color=YELLOW).move_to(triangle.get_center() + LEFT * 0.8)

        self.play(Create(triangle))
        self.play(Write(a_label), Write(b_label), Write(c_label))
        self.wait()

        # 显示公式
        formula = MathTex("a^2 + b^2 = c^2", font_size=40)
        formula.to_edge(DOWN)
        self.play(Write(formula))
        self.wait(2)
""",
        "正弦函数": """from manim import *

class SineFunction(Scene):
    def construct(self):
        # 创建坐标系
        axes = Axes(
            x_range=[-1, 7, 1],
            y_range=[-2, 2, 1],
            axis_config={"color": BLUE}
        )

        # 正弦函数
        sine_graph = axes.plot(lambda x: np.sin(x), color=YELLOW)
        sine_label = MathTex(r"y = \\sin(x)").next_to(axes, UP)

        self.play(Create(axes))
        self.play(Create(sine_graph), Write(sine_label))
        self.wait(2)
""",
        "简谐振动": """from manim import *
import numpy as np

class SimpleHarmonicMotion(Scene):
    def construct(self):
        # 1. 标题
        title = Text("简谐振动", font_size=48, color=BLUE, weight=BOLD)
        subtitle = Text("Simple Harmonic Motion", font_size=28, color=GRAY)
        subtitle.next_to(title, DOWN)

        self.play(Write(title))
        self.play(FadeIn(subtitle))
        self.wait(1)

        # 移到顶部
        title_group = VGroup(title, subtitle)
        self.play(title_group.animate.scale(0.6).to_edge(UP))
        self.wait(0.5)

        # 2. 创建弹簧振子系统
        # 固定点（天花板）
        ceiling = Line(LEFT * 2, RIGHT * 2, color=GRAY, stroke_width=6)
        ceiling.to_edge(UP, buff=1.5)
        self.play(Create(ceiling))

        # 平衡位置
        equilibrium_y = ceiling.get_y() - 2.5

        # 物体
        mass = Square(side_length=0.5, fill_opacity=1, fill_color=BLUE, color=WHITE)
        mass.move_to([0, equilibrium_y, 0])

        # 创建弹簧（螺旋形状）
        def create_spring(start, end, coils=8):
            spring_points = []
            spring_length = np.linalg.norm(end - start)
            direction = (end - start) / spring_length
            perpendicular = np.array([-direction[1], direction[0], 0]) * 0.15

            for i in range(coils * 2 + 1):
                t = i / (coils * 2)
                point = start + direction * spring_length * t
                if i % 2 == 1:
                    point += perpendicular
                elif i % 2 == 0 and i > 0:
                    point -= perpendicular
                spring_points.append(point)

            return VMobject().set_points_as_corners(spring_points).set_color(YELLOW).set_stroke(width=3)

        spring_start = ceiling.get_center()
        spring = create_spring(spring_start, mass.get_top())

        self.play(Create(spring), FadeIn(mass))
        self.wait(0.5)

        # 3. 显示运动方程
        equation = MathTex(r"x(t) = A \\sin(\\omega t)", font_size=36)
        equation.to_corner(UR)
        self.play(Write(equation))
        self.wait(1)

        # 4. 振动动画
        amplitude = 0.8  # 减小振幅，避免超出范围

        def update_spring(mob):
            new_spring = create_spring(spring_start, mass.get_top())
            mob.become(new_spring)

        spring.add_updater(update_spring)

        # 使用 ValueTracker 控制振动
        time_tracker = ValueTracker(0)

        def update_mass(mob):
            t = time_tracker.get_value()
            y_offset = amplitude * np.sin(2 * np.pi * t)
            mob.move_to([0, equilibrium_y + y_offset, 0])

        mass.add_updater(update_mass)

        # 执行3个完整周期的振动
        self.play(time_tracker.animate.set_value(3), run_time=6, rate_func=linear)

        mass.clear_updaters()
        spring.clear_updaters()

        # 回到平衡位置
        self.play(mass.animate.move_to([0, equilibrium_y, 0]), run_time=0.5)
        spring.become(create_spring(spring_start, mass.get_top()))
        self.wait(1)

        # 5. 显示特征参数
        params = VGroup(
            Text("振幅 A: 最大位移", font_size=24),
            Text("角频率 ω: 振动快慢", font_size=24),
            Text("周期 T = 2π/ω", font_size=24)
        ).arrange(DOWN, aligned_edge=LEFT, buff=0.3)
        params.to_corner(DL)

        self.play(FadeIn(params, shift=UP))
        self.wait(2)

        # 6. 淡出
        self.play(*[FadeOut(mob) for mob in self.mobjects])
        self.wait(0.5)
"""
    }

    def __init__(self, llm_client: Optional[Any] = None):
        """
        初始化代码生成器

        Args:
            llm_client: LLM 客户端（可选）
        """
        self.llm_client = llm_client

    def generate(
        self,
        concept: str,
        analysis: Optional[ConceptAnalysis] = None,
        knowledge_tree: Optional[KnowledgeNode] = None,
        style: str = "educational",
        quality: str = "m"
    ) -> GeneratedCode:
        """
        生成 Manim 代码

        Args:
            concept: 概念名称
            analysis: 概念分析结果（可选）
            knowledge_tree: 知识树（可选）
            style: 风格 (educational/professional/simple)
            quality: 质量 (l/m/h/k)

        Returns:
            生成的代码
        """
        # 先尝试使用模板
        concept_clean = concept.strip()  # 去除首尾空格
        print(f"[CodeGenerator] Checking template for concept: '{concept_clean}'")
        print(f"[CodeGenerator] Available templates: {list(self.TEMPLATES.keys())}")

        if concept_clean in self.TEMPLATES:
            print(f"[CodeGenerator] Using template for '{concept_clean}'")
            return self._generate_from_template(concept_clean, quality)

        print(f"[CodeGenerator] No template found, using LLM or basic generation")

        # 使用 LLM 生成
        if self.llm_client and analysis:
            return self._generate_with_llm(concept_clean, analysis, knowledge_tree, style, quality)

        # 生成基础代码
        return self._generate_basic(concept, quality)

    def _generate_from_template(self, concept: str, quality: str) -> GeneratedCode:
        """从模板生成代码"""
        code = self.TEMPLATES[concept]
        scene_name = self._extract_scene_name(code)

        return GeneratedCode(
            code=code,
            scene_name=scene_name,
            concept=concept,
            quality=quality,
            metadata={"source": "template"}
        )

    def _generate_basic(self, concept: str, quality: str) -> GeneratedCode:
        """生成基础代码（增强版，包含更多教学内容）"""
        scene_name = self._concept_to_class_name(concept)
        safe_concept = concept.replace('"', '\\"').replace("'", "\\'")

        code = f"""from manim import *

class {scene_name}(Scene):
    def construct(self):
        # 1. 标题介绍
        title = Text("{safe_concept}", font_size=56, color=BLUE, weight=BOLD)
        subtitle = Text("概念可视化", font_size=32, color=GRAY)
        subtitle.next_to(title, DOWN, buff=0.3)

        self.play(Write(title), run_time=1.5)
        self.play(FadeIn(subtitle, shift=UP), run_time=1)
        self.wait(1.5)

        # 2. 标题移到顶部
        title_group = VGroup(title, subtitle)
        self.play(
            title_group.animate.scale(0.5).to_edge(UP),
            run_time=1
        )
        self.wait(0.5)

        # 3. 主要内容 - 几何图形演示
        circle = Circle(radius=1.5, color=BLUE, fill_opacity=0.3)
        square = Square(side_length=2.5, color=GREEN, fill_opacity=0.3)
        triangle = Triangle(color=RED, fill_opacity=0.3).scale(1.5)

        shapes = VGroup(circle, square, triangle).arrange(RIGHT, buff=1)

        self.play(Create(circle), run_time=1.5)
        self.wait(0.5)
        self.play(Create(square), run_time=1.5)
        self.wait(0.5)
        self.play(Create(triangle), run_time=1.5)
        self.wait(1)

        # 4. 图形变换
        self.play(
            circle.animate.set_color(YELLOW),
            square.animate.rotate(PI/4),
            triangle.animate.flip(RIGHT),
            run_time=2
        )
        self.wait(1)

        # 5. 数学公式
        formula = MathTex(
            r"f(x) = ax^2 + bx + c",
            font_size=48,
            color=WHITE
        )
        formula.next_to(shapes, DOWN, buff=1)

        self.play(Write(formula), run_time=2)
        self.wait(1)

        # 6. 公式变换
        formula2 = MathTex(
            r"f(x) = a(x-h)^2 + k",
            font_size=48,
            color=YELLOW
        )
        formula2.move_to(formula)

        self.play(Transform(formula, formula2), run_time=2)
        self.wait(1.5)

        # 7. 总结
        conclusion = Text(
            f"探索 {safe_concept} 的奥秘",
            font_size=36,
            color=GREEN
        )
        conclusion.to_edge(DOWN)

        self.play(FadeIn(conclusion, shift=UP), run_time=1.5)
        self.wait(2)

        # 8. 淡出所有元素
        self.play(
            *[FadeOut(mob) for mob in self.mobjects],
            run_time=2
        )
        self.wait(0.5)
"""

        return GeneratedCode(
            code=code,
            scene_name=scene_name,
            concept=concept,
            quality=quality,
            metadata={"source": "basic_enhanced"}
        )

    def _generate_with_llm(
        self,
        concept: str,
        analysis: ConceptAnalysis,
        knowledge_tree: Optional[KnowledgeNode],
        style: str,
        quality: str
    ) -> GeneratedCode:
        """使用 LLM 生成代码"""
        # 构建提示词
        prompt = self._build_prompt(concept, analysis, knowledge_tree, style)

        system_prompt = """你是一个专业的 Manim 动画代码生成专家。
你的任务是根据给定的概念生成高质量、教学性强的 Manim 动画代码。

要求：
1. 使用 Manim Community Edition v0.19+ (最新版本语法)
2. 代码必须完整可运行，包含所有必要的导入
3. 动画要有教学性，清晰展示概念的核心思想
4. 包含适当的数学公式、图形和动画效果
5. 代码要有清晰的注释
6. 动画时长控制在 30-60 秒
7. 只返回 Python 代码，不要有其他解释文字
8. 不要在代码后面添加任何说明或解释

重要语法规则（Manim v0.19+）：
- 使用 .animate 语法：self.play(obj.animate.method()) 而不是 self.play(obj.method)
- 例如：self.play(title.animate.to_edge(UP)) 而不是 self.play(title.to_edge, UP)
- 例如：self.play(circle.animate.shift(RIGHT)) 而不是 self.play(circle.shift, RIGHT)

坐标转换 API（重要）：
- 使用 axes.coords_to_point(x, y) 或 axes.c2p(x, y) 将坐标转换为屏幕位置
- 错误：axes.coords_to_graph_point() - 这个方法不存在！
- 正确：axes.coords_to_point(x, y) 或 axes.c2p(x, y)
- 例如：dot.move_to(axes.c2p(1, 2))
- 对于 3D：axes.c2p(x, y, z)

LaTeX 公式规则（非常重要）：
- 在 MathTex 中使用双反斜杠：r"\\frac{a}{b}" 而不是 r"\frac{a}{b}"
- 在 MathTex 中使用双反斜杠：r"\\sin(x)" 而不是 r"\sin(x)"
- 在 MathTex 中使用双反斜杠：r"\\omega" 而不是 r"\omega"
- 例如：MathTex(r"x(t) = A\\sin(\\omega t + \\phi)")
- 例如：MathTex(r"\\frac{\\partial f}{\\partial x}")
- 保持公式简单，避免复杂的 LaTeX 命令

中文文字规则（极其重要，必须遵守）：
- MathTex 只能包含数学符号和英文字母，绝对不能包含中文字符
- 所有中文文字必须使用 Text() 对象，不能放在 MathTex 中
- 绝对禁止使用 \\text{中文}，LaTeX 的 \\text 命令不支持中文！
- 错误示例：MathTex(r"A: 振幅")  # LaTeX 编译错误！
- 错误示例：MathTex(r"\\omega: 角频率")  # LaTeX 编译错误！
- 错误示例：MathTex(r"A: \\text{振幅}")  # LaTeX 编译错误！\\text 不支持中文！
- 错误示例：MathTex(r"\\omega: \\text{角频率}")  # LaTeX 编译错误！\\text 不支持中文！
- 正确示例：Text("振幅 A", font_size=24)
- 正确示例：VGroup(MathTex(r"A"), Text("(振幅)")).arrange(RIGHT)
- 正确示例：MathTex(r"A") 和 Text("振幅") 分别创建
- 如果需要标注，使用纯英文：MathTex(r"A: \\text{Amplitude}")
- 或者只用数学符号：MathTex(r"A = 1.5")

重要：请只返回完整的 Python 代码，不要在代码后添加任何中文或英文的解释说明。代码应该以 from manim import * 开始，以类定义结束。"""

        # 调用 LLM
        code = self.llm_client.generate(prompt, system_prompt)

        if not code:
            # LLM 失败，回退到基础代码
            print(f"LLM generation failed for {concept}, using basic template")
            return self._generate_basic(concept, quality)

        # 清理代码（移除可能的 markdown 代码块标记）
        code = self._clean_generated_code(code)

        # 提取场景名
        scene_name = self._extract_scene_name(code)

        return GeneratedCode(
            code=code,
            scene_name=scene_name,
            concept=concept,
            quality=quality,
            metadata={"source": "llm", "provider": self.llm_client.config.provider if self.llm_client else 'unknown'}
        )

    def _build_prompt(
        self,
        concept: str,
        analysis: ConceptAnalysis,
        knowledge_tree: Optional[KnowledgeNode],
        style: str
    ) -> str:
        """构建 LLM 提示词"""
        prompt = f"""
生成 Manim 动画代码来解释概念："{concept}"

概念信息：
- 类型：{analysis.type.value}
- 难度：{analysis.difficulty.value}
- 关键词：{', '.join(analysis.keywords)}
- 公式：{', '.join(analysis.formulas)}

前置知识：
{', '.join(analysis.prerequisites)}

可视化建议：
{chr(10).join(f'- {hint}' for hint in analysis.visualization_hints)}

风格：{style}

要求：
1. 使用 Manim Community Edition
2. 代码清晰、注释完整
3. 动画流畅、教学性强
4. 包含公式和图形
5. 时长 30-60 秒

返回完整的 Python 代码。
"""
        return prompt

    @staticmethod
    def _extract_scene_name(code: str) -> str:
        """从代码中提取场景类名"""
        import re
        match = re.search(r'class\s+(\w+)\(Scene\)', code)
        return match.group(1) if match else "MathScene"

    @staticmethod
    def _concept_to_class_name(concept: str) -> str:
        """将概念名转换为类名"""
        # 移除特殊字符，转换为驼峰命名
        import re
        # 简单处理：移除非字母数字字符
        clean = re.sub(r'[^a-zA-Z0-9\u4e00-\u9fa5]', '', concept)
        return f"{clean}Scene"

    @staticmethod
    def _clean_generated_code(code: str) -> str:
        """清理 LLM 生成的代码"""
        # 移除 markdown 代码块标记
        code = code.strip()

        # 移除开头的 ```python 或 ```
        if code.startswith("```python"):
            code = code[9:]
        elif code.startswith("```"):
            code = code[3:]

        # 移除结尾的 ```
        if code.endswith("```"):
            code = code[:-3]

        code = code.strip()

        # 移除代码中间的 markdown 标记（GLM 有时会在代码中间插入 ```）
        lines = code.split('\n')
        cleaned_lines = []
        for line in lines:
            stripped = line.strip()
            # 跳过只包含 ``` 的行
            if stripped == '```' or stripped == '```python':
                continue
            cleaned_lines.append(line)

        code = '\n'.join(cleaned_lines)

        # 移除代码后面的解释文字（中文或英文）
        # 找到最后一个有效的 Python 代码行
        lines = code.split('\n')
        last_code_line = -1

        for i in range(len(lines) - 1, -1, -1):
            line = lines[i].strip()
            # 跳过空行和纯注释行
            if not line or line.startswith('#'):
                continue
            # 如果包含中文标点（全角逗号、句号等），可能是解释文字
            if '，' in line or '。' in line or '：' in line:
                continue
            # 如果是英文解释性文字（通常以 I'll, This, The 等开头，且不是有效的 Python 语法）
            # 检查是否是明显的英文解释句子
            if line.startswith(("I'll", "I will", "This ", "The ", "Here ", "Note:", "Explanation:")):
                continue
            # 检查是否包含未闭合的字符串（说明是解释文字的一部分）
            if line.count("'") % 2 == 1 or line.count('"') % 2 == 1:
                continue
            # 找到有效代码行
            last_code_line = i
            break

        if last_code_line >= 0:
            code = '\n'.join(lines[:last_code_line + 1])

        return code.strip()
