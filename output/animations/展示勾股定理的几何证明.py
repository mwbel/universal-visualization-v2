from manim import *
import numpy as np

class PythagoreanTheorem(Scene):
    def construct(self):
        # 设置动画背景
        self.camera.background_color = LIGHT_GRAY

        # 创建勾股定理的标题
        title = Text("勾股定理的几何证明", font_size=40)
        title.set_color(GREEN)
        self.add(title)

        # 创建一个正方形
        square = Square(side_length=3, fill_color=BLUE, fill_opacity=0.8)
        square.rotate(PI / 4)
        square.move_to(ORIGIN)
        self.add(square)

        # 创建两个直角三角形
        triangle1 = Triangle(color=RED, fill_color=RED, fill_opacity=0.8)
        triangle1.stretch_by_factor(1.5, axis=RIGHT)
        triangle1.rotate(PI / 4)
        triangle1.move_to(square.get_top() + np.array([0, 1, 0]))

        triangle2 = Triangle(color=RED, fill_color=RED, fill_opacity=0.8)
        triangle2.stretch_by_factor(1.5, axis=RIGHT)
        triangle2.rotate(PI / 4)
        triangle2.move_to(square.get_bottom() + np.array([0, -1, 0]))

        # 创建直角边和斜边
        leg1 = Line(square.get_top(), triangle1.get_left())
        leg2 = Line(square.get_bottom(), triangle2.get_left())
        hypotenuse = Line(triangle1.get_left(), triangle2.get_left())

        # 创建 a^2, b^2 和 c^2 的文本
        a_squared = MathTex("a^2", font_size=32)
        b_squared = MathTex("b^2", font_size=32)
        c_squared = MathTex("c^2", font_size=32)

        a_squared.move_to(triangle1.get_left() + np.array([0, 0.5, 0]))
        b_squared.move_to(triangle2.get_left() + np.array([0, 0.5, 0]))
        c_squared.move_to(hypotenuse.get_center() + np.array([0, 1, 0]))

        # 添加所有元素
        self.add(square, triangle1, triangle2, leg1, leg2, hypotenuse, a_squared, b_squared, c_squared)

        # 动画过程
        self.play(Write(title), run_time=2)
        self.play(ShowCreation(square), run_time=2)
        self.play(ShowCreation(triangle1), ShowCreation(triangle2), run_time=2)
        self.play(ShowCreation(leg1), ShowCreation(leg2), ShowCreation(hypotenuse), run_time=2)
        self.play(ShowCreation(a_squared), ShowCreation(b_squared), ShowCreation(c_squared), run_time=2)
        self.wait(3)  # 保持3秒