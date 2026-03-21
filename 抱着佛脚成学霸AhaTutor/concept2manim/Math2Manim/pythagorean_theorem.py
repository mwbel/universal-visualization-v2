from manim import *

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
