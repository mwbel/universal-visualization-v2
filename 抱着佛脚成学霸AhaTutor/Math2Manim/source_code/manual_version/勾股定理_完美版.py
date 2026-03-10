from manim import *
import numpy as np

class PythagoreanTheoremPerfect(Scene):
    def construct(self):
        # 设置背景
        self.camera.background_color = BLACK

        # 创建标题
        title = Text("勾股定理", font_size=48)
        title.set_color(GREEN)
        title.to_edge(UP)
        self.play(Write(title), run_time=1)

        # 定义三角形边长
        a = 2  # 直角边 a
        b = 1.5  # 直角边 b
        c = np.sqrt(a**2 + b**2)  # 斜边

        # 创建直角三角形（使用Polygon，确保正确的形状）
        # 顶点：(0,0), (a,0), (0,b) - 直角在原点
        triangle = Polygon(
            ORIGIN,  # (0,0) 直角顶点
            RIGHT * a,  # (a,0)
            UP * b,  # (0,b)
            stroke_color=BLUE,
            stroke_width=3,
            fill_color=BLUE,
            fill_opacity=0.3
        )
        triangle_center = triangle.get_center()
        triangle.move_to(ORIGIN)
        self.play(Create(triangle), run_time=1.5)

        # 标注边长
        a_label = MathTex("a", font_size=32, color=YELLOW)
        a_label.next_to(triangle, DOWN, buff=0.3)
        a_label.shift(RIGHT * a/2)
        self.play(Write(a_label), run_time=0.5)

        b_label = MathTex("b", font_size=32, color=YELLOW)
        b_label.next_to(triangle, LEFT, buff=0.3)
        b_label.shift(UP * b/2)
        self.play(Write(b_label), run_time=0.5)

        c_label = MathTex("c", font_size=32, color=YELLOW)
        c_label.next_to(triangle, UR, buff=0.3)
        self.play(Write(c_label), run_time=0.5)

        self.wait(0.5)

        # 创建正方形 a²（在底边下方）
        square_a = Square(side_length=a, color=RED, stroke_width=2, fill_opacity=0.4)
        square_a.next_to(triangle, DOWN, buff=0)
        square_a.align_to(triangle, LEFT)
        self.play(Create(square_a), run_time=1)

        a_squared_label = MathTex("a^2", font_size=28, color=WHITE)
        a_squared_label.move_to(square_a.get_center())
        self.play(Write(a_squared_label), run_time=0.5)

        # 创建正方形 b²（在左侧边的左边）
        square_b = Square(side_length=b, color=YELLOW, stroke_width=2, fill_opacity=0.4)
        square_b.next_to(triangle, LEFT, buff=0)
        square_b.align_to(triangle, DOWN)
        self.play(Create(square_b), run_time=1)

        b_squared_label = MathTex("b^2", font_size=28, color=BLACK)
        b_squared_label.move_to(square_b.get_center())
        self.play(Write(b_squared_label), run_time=0.5)

        # 创建正方形 c²（在斜边外侧）
        # 计算斜边的角度和位置
        hypotenuse_vector = np.array([a, -b, 0])  # 从(0,b)到(a,0)
        hypotenuse_length = np.linalg.norm(hypotenuse_vector)
        hypotenuse_unit_vector = hypotenuse_vector / hypotenuse_length
        perpendicular_vector = np.array([hypotenuse_unit_vector[1], -hypotenuse_unit_vector[0], 0])

        # 斜边中点
        midpoint = (triangle.get_vertices()[1] + triangle.get_vertices()[2]) / 2

        # 创建c²正方形（旋转对齐斜边）
        square_c = Square(side_length=c, color=GREEN, stroke_width=2, fill_opacity=0.4)
        # 旋转正方形使其一边与斜边平行
        angle = np.arctan2(-b, a)
        square_c.rotate(angle - PI/4)
        square_c.move_to(midpoint + perpendicular_vector * c * 0.7)

        self.play(Create(square_c), run_time=1)

        c_squared_label = MathTex("c^2", font_size=28, color=WHITE)
        c_squared_label.move_to(square_c.get_center())
        self.play(Write(c_squared_label), run_time=0.5)

        self.wait(1)

        # 显示勾股定理公式
        formula = MathTex(
            "a", "^2", "+", "b", "^2", "=", "c", "^2",
            font_size=48
        )
        formula[0].set_color(YELLOW)  # a
        formula[1].set_color(RED)     # a²
        formula[3].set_color(YELLOW)  # b
        formula[4].set_color(YELLOW)  # b²
        formula[6].set_color(YELLOW)  # c
        formula[7].set_color(GREEN)   # c²

        formula.to_edge(DOWN)
        self.play(Write(formula), run_time=2)

        self.wait(1)

        # 添加面积相等的说明
        explanation = Text(
            "Area Relationship",
            font_size=32,
            color=WHITE
        )
        explanation.to_edge(DOWN).shift(UP * 1.5)
        self.play(Write(explanation), run_time=1)

        # 高亮显示面积关系
        self.play(
            square_a.animate.set_fill(RED, opacity=0.8),
            square_b.animate.set_fill(YELLOW, opacity=0.8),
            square_c.animate.set_fill(GREEN, opacity=0.8),
            run_time=1
        )

        # 添加箭头指向正方形
        arrow_a = Arrow(
            formula[1].get_center(),
            square_a.get_center(),
            color=RED,
            buff=0.2,
            stroke_width=3
        )
        arrow_b = Arrow(
            formula[4].get_center(),
            square_b.get_center(),
            color=YELLOW,
            buff=0.2,
            stroke_width=3
        )
        arrow_c = Arrow(
            formula[7].get_center(),
            square_c.get_center(),
            color=GREEN,
            buff=0.2,
            stroke_width=3
        )

        self.play(
            Create(arrow_a),
            Create(arrow_b),
            Create(arrow_c),
            run_time=1.5
        )

        self.wait(1)

        # 验证面积相等的动画
        # 创建面积计算文本
        area_calc = MathTex(
            "a^2+b^2", "=", str(round(a**2, 2)), "+", str(round(b**2, 2)),
            "=", str(round(a**2 + b**2, 2)), "=", "c^2",
            font_size=32
        )
        area_calc[0].set_color(RED)
        area_calc[2].set_color(YELLOW)
        area_calc[8].set_color(GREEN)

        area_calc.next_to(explanation, DOWN, buff=0.5)
        self.play(Write(area_calc), run_time=2)

        self.wait(2)

        # 最终验证：c² = a² + b²
        verification = MathTex(
            str(round(c**2, 2)), "=", str(round(a**2 + b**2, 2)),
            font_size=36,
            color=GREEN
        )
        verification.next_to(area_calc, DOWN, buff=0.5)
        self.play(
            Write(verification),
            run_time=1.5
        )

        self.wait(2)

        # 清除箭头和说明，保持图形
        self.play(
            FadeOut(arrow_a),
            FadeOut(arrow_b),
            FadeOut(arrow_c),
            run_time=0.5
        )

        self.wait(2)
