"""
DeepSeek 风格的矩形对角线动画
基于 CSDN 文章中的代码示例
文章链接：https://blog.csdn.net/qq_45019121/article/details/145351760

这是文章中提到的具体示例代码，用于验证勾股定理
"""

from manim import *

class RectangleDiagonal(Scene):
    """
    矩形对角线动画 - 验证勾股定理
    a² + b² = c²

    对于 3x4 的矩形：
    - a = 3 (宽度)
    - b = 4 (高度)
    - c = 5 (对角线长度)
    - 验证：3² + 4² = 9 + 16 = 25 = 5²
    """

    def construct(self):
        # 创建矩形和对角线
        rect = Rectangle(width=3, height=4, color=BLUE)
        diagonal = Line(rect.get_corner(DL), rect.get_corner(UR), color=RED)

        # 添加标签
        a_label = MathTex("a = 3").next_to(rect, DOWN)
        b_label = MathTex("b = 4").next_to(rect, RIGHT)
        c_label = MathTex("c = 5").next_to(diagonal, UP, buff=0.2)

        # 勾股定理公式
        formula = MathTex("a^2 + b^2 = c^2").to_edge(UP)
        formula_box = SurroundingRectangle(formula, color=YELLOW)

        # 动画序列
        self.play(Create(rect), run_time=2)
        self.play(Write(a_label), Write(b_label))
        self.wait(1)
        self.play(Create(diagonal), Write(c_label))
        self.wait(1)
        self.play(Write(formula), Create(formula_box))
        self.wait(3)

        # 数值验证动画
        verification = MathTex("3^2 + 4^2 = 5^2", "9 + 16 = 25", "25 = 25")
        verification[0].next_to(formula, DOWN, buff=1)
        verification[1].next_to(verification[0], DOWN, buff=0.5)
        verification[2].next_to(verification[1], DOWN, buff=0.5)

        self.play(Write(verification[0]), run_time=1)
        self.wait(0.5)
        self.play(Write(verification[1]), run_time=1)
        self.wait(0.5)
        self.play(
            Write(verification[2]),
            verification[2].animate.set_color(GREEN),
            run_time=1.5
        )

        self.wait(2)


# 运行命令（在终端执行）：
# manim -pql RectangleDiagonal.py RectangleDiagonal
