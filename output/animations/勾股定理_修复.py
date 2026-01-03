from manim import *
import numpy as np

class PythagoreanTheoremFixed(Scene):
    def construct(self):
        # 创建标题
        title = Text("勾股定理", font_size=48)
        title.set_color(GREEN)
        title.to_edge(UP)
        self.play(Write(title), run_time=1)

        # 创建直角三角形
        # 使用 Polygon 创建直角三角形
        triangle = Polygon(
            LEFT * 1.5 + DOWN * 1,  # 左下角
            RIGHT * 1.5 + DOWN * 1,  # 右下角
            LEFT * 1.5 + UP * 2,     # 左上角（直角）
            stroke_color=BLUE,
            fill_color=BLUE,
            fill_opacity=0.5
        )
        triangle.move_to(ORIGIN)
        self.play(Create(triangle), run_time=2)

        # 标注边长
        a_label = MathTex("a", font_size=36, color=RED)
        a_label.next_to(triangle, DOWN, buff=0.2)
        self.play(Write(a_label), run_time=0.5)

        b_label = MathTex("b", font_size=36, color=YELLOW)
        b_label.next_to(triangle, LEFT, buff=0.2)
        self.play(Write(b_label), run_time=0.5)

        c_label = MathTex("c", font_size=36, color=GREEN)
        c_label.next_to(triangle, UR, buff=0.2)
        self.play(Write(c_label), run_time=0.5)

        # 创建勾股定理公式
        formula = MathTex("a^2", "+", "b^2", "=", "c^2", font_size=48)
        formula.to_edge(DOWN)
        self.play(Write(formula), run_time=2)

        # 创建正方形
        square_a = Square(side_length=2, color=RED, fill_opacity=0.3)
        square_a.next_to(triangle, LEFT, buff=1)
        self.play(Create(square_a), run_time=1)

        square_b = Square(side_length=2, color=YELLOW, fill_opacity=0.3)
        square_b.next_to(triangle, DOWN, buff=1)
        self.play(Create(square_b), run_time=1)

        square_c = Square(side_length=2.8, color=GREEN, fill_opacity=0.3)
        square_c.rotate(PI/4)
        square_c.next_to(triangle, RIGHT, buff=1)
        self.play(Create(square_c), run_time=1)

        # 标注正方形面积
        a_squared = MathTex("a^2", font_size=24, color=RED)
        a_squared.move_to(square_a.get_center())
        self.play(Write(a_squared), run_time=0.5)

        b_squared = MathTex("b^2", font_size=24, color=YELLOW)
        b_squared.move_to(square_b.get_center())
        self.play(Write(b_squared), run_time=0.5)

        c_squared = MathTex("c^2", font_size=24, color=GREEN)
        c_squared.move_to(square_c.get_center())
        self.play(Write(c_squared), run_time=0.5)

        self.wait(2)
