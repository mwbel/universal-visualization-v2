"""
物理概念生成Manim动画 - Physics Animation Generator
基于Math2Manim项目的核心思想，实现物理概念的可视化动画生成

核心功能：
1. 物理概念分析
2. 前置知识探索
3. 动画场景生成
4. 可执行代码输出
"""

from manim import *
import numpy as np
from typing import Dict, List, Tuple


class PhysicsAnimationGenerator:
    """物理动画生成器基类"""

    def __init__(self, concept: str):
        self.concept = concept
        self.prerequisites = []
        self.formulas = {}
        self.visual_elements = {}

    def analyze_concept(self) -> Dict:
        """分析物理概念"""
        return {
            "concept": self.concept,
            "domain": "physics",
            "complexity": "intermediate",
            "visual_potential": "high"
        }

    def explore_prerequisites(self, depth: int = 2) -> List[str]:
        """探索前置知识（简化版）"""
        # 这里可以集成AI来递归探索
        physics_prerequisites = {
            "牛顿第二定律": ["力的概念", "加速度", "质量"],
            "简谐运动": ["周期运动", "回复力", "胡克定律"],
            "动能定理": ["功", "能量", "速度"],
            "电场": ["电荷", "库仑定律", "矢量场"],
            "磁场": ["电流", "洛伦兹力", "右手定则"]
        }
        return physics_prerequisites.get(self.concept, [])


# ============ 具体物理动画场景 ============

class NewtonSecondLaw(Scene):
    """牛顿第二定律动画：F = ma"""

    def construct(self):
        # 标题
        title = Text("牛顿第二定律", font_size=48, color=BLUE)
        title.to_edge(UP)
        self.play(Write(title), run_time=1)

        # 公式
        formula = MathTex(r"F = ma", font_size=60, color=YELLOW)
        formula.next_to(title, DOWN, buff=0.5)
        self.play(Write(formula), run_time=1)
        self.wait(0.5)

        # 创建物体（方块）
        box = Square(side_length=1, fill_color=RED, fill_opacity=0.8)
        box.shift(LEFT * 4)

        # 质量标签
        mass_label = MathTex("m", font_size=36, color=WHITE)
        mass_label.move_to(box.get_center())

        self.play(Create(box), Write(mass_label))
        self.wait(0.5)

        # 力的箭头
        force_arrow = Arrow(
            start=box.get_right(),
            end=box.get_right() + RIGHT * 2,
            color=GREEN,
            buff=0,
            stroke_width=8
        )
        force_label = MathTex("F", font_size=36, color=GREEN)
        force_label.next_to(force_arrow, UP)

        self.play(Create(force_arrow), Write(force_label))
        self.wait(0.5)

        # 加速度运动
        acceleration_text = Text("加速度 a", font_size=32, color=ORANGE)
        acceleration_text.to_edge(DOWN)
        self.play(Write(acceleration_text))

        # 物体加速运动
        self.play(
            box.animate.shift(RIGHT * 6),
            mass_label.animate.shift(RIGHT * 6),
            rate_func=lambda t: t**2,  # 加速运动
            run_time=2
        )

        # 移除力箭头
        self.play(FadeOut(force_arrow), FadeOut(force_label))

        # 展示关系
        explanation = VGroup(
            Text("力越大 → 加速度越大", font_size=28),
            Text("质量越大 → 加速度越小", font_size=28)
        ).arrange(DOWN, aligned_edge=LEFT)
        explanation.to_edge(DOWN)

        self.play(
            FadeOut(acceleration_text),
            Write(explanation)
        )
        self.wait(2)


class SimpleHarmonicMotion(Scene):
    """简谐运动动画"""

    def construct(self):
        # 标题
        title = Text("简谐运动", font_size=48, color=BLUE)
        title.to_edge(UP)
        self.play(Write(title), run_time=1)

        # 弹簧振子系统
        # 固定点
        fixed_point = Dot(LEFT * 4 + UP * 0, color=GRAY, radius=0.15)

        # 弹簧
        spring = Line(
            start=fixed_point.get_center(),
            end=fixed_point.get_center() + RIGHT * 2,
            color=BLUE
        )

        # 质量块
        mass = Square(side_length=0.6, fill_color=RED, fill_opacity=0.8)
        mass.move_to(spring.get_end())

        # 平衡位置标记
        equilibrium = DashedLine(
            start=UP * 1.5,
            end=DOWN * 1.5,
            color=YELLOW,
            dash_length=0.1
        )
        equilibrium.move_to(fixed_point.get_center() + RIGHT * 2)

        self.play(
            Create(fixed_point),
            Create(spring),
            Create(mass),
            Create(equilibrium)
        )

        # 位移标签
        x_label = MathTex("x", font_size=36, color=GREEN)
        x_label.next_to(mass, DOWN)
        self.play(Write(x_label))

        # 简谐运动公式
        formula = MathTex(r"x(t) = A\cos(\omega t)", font_size=40, color=YELLOW)
        formula.to_edge(DOWN)
        self.play(Write(formula))

        self.wait(0.5)

        # 执行简谐运动
        amplitude = 1.5
        omega = 2 * PI

        def spring_updater(mob, dt):
            """弹簧跟随质量块"""
            mob.put_start_and_end_on(
                fixed_point.get_center(),
                mass.get_center()
            )

        spring.add_updater(spring_updater)
        x_label.add_updater(lambda m: m.next_to(mass, DOWN))

        # 简谐运动动画
        self.play(
            mass.animate.shift(RIGHT * amplitude),
            run_time=0.5
        )

        for _ in range(3):  # 3个周期
            self.play(
                mass.animate.shift(LEFT * 2 * amplitude),
                rate_func=lambda t: np.cos(PI * t),
                run_time=2
            )
            self.play(
                mass.animate.shift(RIGHT * 2 * amplitude),
                rate_func=lambda t: np.cos(PI * t),
                run_time=2
            )

        spring.clear_updaters()
        x_label.clear_updaters()

        self.wait(1)


class KineticEnergyTheorem(Scene):
    """动能定理动画：W = ΔEk"""

    def construct(self):
        # 标题
        title = Text("动能定理", font_size=48, color=BLUE)
        title.to_edge(UP)
        self.play(Write(title), run_time=1)

        # 公式
        formula = MathTex(r"W = \Delta E_k = \frac{1}{2}mv_2^2 - \frac{1}{2}mv_1^2",
                         font_size=40, color=YELLOW)
        formula.next_to(title, DOWN, buff=0.5)
        self.play(Write(formula), run_time=1.5)

        # 创建地面
        ground = Line(LEFT * 6, RIGHT * 6, color=GRAY)
        ground.shift(DOWN * 2)
        self.play(Create(ground))

        # 物体
        obj = Circle(radius=0.4, fill_color=RED, fill_opacity=0.8)
        obj.next_to(ground, UP, buff=0)
        obj.shift(LEFT * 4)

        # 初速度标签
        v1_label = MathTex("v_1", font_size=32, color=GREEN)
        v1_label.next_to(obj, UP)

        self.play(Create(obj), Write(v1_label))

        # 力的作用
        force_arrow = Arrow(
            start=obj.get_right(),
            end=obj.get_right() + RIGHT * 1.5,
            color=ORANGE,
            buff=0,
            stroke_width=6
        )
        force_label = MathTex("F", font_size=32, color=ORANGE)
        force_label.next_to(force_arrow, UP)

        self.play(Create(force_arrow), Write(force_label))
        self.wait(0.5)

        # 物体加速运动
        displacement = 4

        self.play(
            obj.animate.shift(RIGHT * displacement),
            v1_label.animate.shift(RIGHT * displacement),
            force_arrow.animate.shift(RIGHT * displacement),
            force_label.animate.shift(RIGHT * displacement),
            rate_func=lambda t: t**1.5,  # 加速
            run_time=2
        )

        # 末速度标签
        v2_label = MathTex("v_2", font_size=32, color=BLUE)
        v2_label.next_to(obj, UP)

        self.play(
            FadeOut(v1_label),
            Write(v2_label),
            FadeOut(force_arrow),
            FadeOut(force_label)
        )

        # 功的计算
        work_calc = MathTex(r"W = F \cdot s", font_size=36, color=ORANGE)
        work_calc.to_edge(DOWN).shift(UP * 0.5)
        self.play(Write(work_calc))

        # 动能变化
        energy_change = VGroup(
            MathTex(r"E_{k1} = \frac{1}{2}mv_1^2", font_size=28, color=GREEN),
            MathTex(r"\rightarrow", font_size=28),
            MathTex(r"E_{k2} = \frac{1}{2}mv_2^2", font_size=28, color=BLUE)
        ).arrange(RIGHT)
        energy_change.next_to(work_calc, DOWN)

        self.play(Write(energy_change))
        self.wait(2)


class ElectricField(Scene):
    """电场动画"""

    def construct(self):
        # 标题
        title = Text("电场", font_size=48, color=BLUE)
        title.to_edge(UP)
        self.play(Write(title), run_time=1)

        # 点电荷
        charge = Circle(radius=0.3, fill_color=RED, fill_opacity=1)
        charge.move_to(ORIGIN)
        charge_label = MathTex("+Q", font_size=36, color=WHITE)
        charge_label.move_to(charge.get_center())

        self.play(Create(charge), Write(charge_label))

        # 电场公式
        formula = MathTex(r"E = \frac{kQ}{r^2}", font_size=40, color=YELLOW)
        formula.to_edge(DOWN)
        self.play(Write(formula))

        self.wait(0.5)

        # 电场线
        field_lines = VGroup()
        num_lines = 12

        for i in range(num_lines):
            angle = i * 2 * PI / num_lines
            start = charge.get_center() + 0.4 * np.array([np.cos(angle), np.sin(angle), 0])
            end = charge.get_center() + 2.5 * np.array([np.cos(angle), np.sin(angle), 0])

            line = Arrow(
                start=start,
                end=end,
                color=BLUE,
                buff=0,
                stroke_width=2,
                max_tip_length_to_length_ratio=0.15
            )
            field_lines.add(line)

        self.play(Create(field_lines), run_time=2)

        # 测试电荷
        test_charge = Circle(radius=0.15, fill_color=YELLOW, fill_opacity=1)
        test_charge.move_to(LEFT * 2)
        test_label = MathTex("+q", font_size=24, color=BLACK)
        test_label.move_to(test_charge.get_center())

        self.play(Create(test_charge), Write(test_label))

        # 受力箭头
        force = Arrow(
            start=test_charge.get_center(),
            end=test_charge.get_center() + RIGHT * 1,
            color=GREEN,
            buff=0,
            stroke_width=6
        )
        force_label = MathTex("F", font_size=28, color=GREEN)
        force_label.next_to(force, UP)

        self.play(Create(force), Write(force_label))

        # 测试电荷移动
        self.play(
            test_charge.animate.shift(RIGHT * 1),
            test_label.animate.shift(RIGHT * 1),
            force.animate.shift(RIGHT * 1),
            force_label.animate.shift(RIGHT * 1),
            run_time=1.5
        )

        self.wait(2)


# ============ 使用示例 ============

if __name__ == "__main__":
    """
    运行示例：

    # 牛顿第二定律
    manim -pql physics_generator.py NewtonSecondLaw

    # 简谐运动
    manim -pql physics_generator.py SimpleHarmonicMotion

    # 动能定理
    manim -pql physics_generator.py KineticEnergyTheorem

    # 电场
    manim -pql physics_generator.py ElectricField
    """
    pass
