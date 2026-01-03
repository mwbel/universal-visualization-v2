from manim import *
import numpy as np

class SineAnimationPerfect(Scene):
    def construct(self):
        # 创建标题
        title = Text("正弦函数", font_size=48)
        title.set_color(RED)
        title.to_edge(UP)
        self.add(title)

        # 设置原点位置
        origin = LEFT * 3 + DOWN * 0.5

        # 创建单位圆（圆心在原点）
        circle = Circle(radius=2, color=BLUE)
        circle.move_to(origin)
        self.add(circle)

        # 创建圆心标记
        center_dot = Dot(point=origin, color=WHITE)
        center_label = MathTex("O", font_size=24).next_to(center_dot, DOWN)
        self.add(center_dot, center_label)

        # 创建坐标轴（通过圆心）
        x_axis = Line(
            origin + LEFT * 2.5,
            origin + RIGHT * 2.5,
            color=GRAY,
            stroke_width=2
        )
        y_axis = Line(
            origin + DOWN * 2.5,
            origin + UP * 2.5,
            color=GRAY,
            stroke_width=2
        )
        self.add(x_axis, y_axis)

        # 角度值（45度）
        angle_value = PI / 4
        point_on_circle = origin + np.array([
            2 * np.cos(angle_value),
            2 * np.sin(angle_value),
            0
        ])

        # 创建半径（从圆心到圆上点）
        radius = Line(origin, point_on_circle, color=YELLOW, stroke_width=3)
        radius_label = MathTex("r", font_size=28, color=YELLOW)
        radius_label.move_to(radius.get_center() + UP * 0.3 + RIGHT * 0.3)
        self.add(radius, radius_label)

        # 创建角度弧线
        angle_arc = Arc(
            radius=0.5,
            start_angle=0,
            angle=angle_value,
            color=GREEN
        )
        angle_arc.move_to(origin)
        self.add(angle_arc)

        angle_label = MathTex(r"\alpha", font_size=28, color=GREEN)
        angle_label.next_to(angle_arc, RIGHT, buff=0.1)
        self.add(angle_label)

        # 创建x坐标投影
        x_point = origin + np.array([2 * np.cos(angle_value), 0, 0])
        x_line = DashedLine(point_on_circle, x_point, color=PURPLE)
        self.add(x_line)

        # 创建y坐标投影（正弦线）
        y_line = DashedLine(point_on_circle, x_point, color=RED, stroke_width=3)
        self.add(y_line)

        # 标注正弦值
        sine_label = MathTex(r"\sin\alpha", font_size=24, color=RED)
        sine_label.next_to(y_line, RIGHT, buff=0.2)
        self.add(sine_label)

        # 标注x坐标
        cos_label = MathTex(r"\cos\alpha", font_size=24, color=PURPLE)
        cos_label.next_to(x_line, DOWN, buff=0.2)
        self.add(cos_label)

        # 创建右侧的函数图像区域
        graph_origin = origin + RIGHT * 5

        # 创建坐标轴
        graph_x_axis = Line(
            graph_origin + LEFT * 2,
            graph_origin + RIGHT * 3,
            color=WHITE,
            stroke_width=2
        )
        graph_y_axis = Line(
            graph_origin + DOWN * 1.5,
            graph_origin + UP * 1.5,
            color=WHITE,
            stroke_width=2
        )
        self.add(graph_x_axis, graph_y_axis)

        # 坐标轴标签
        x_label = MathTex("x", font_size=24).next_to(graph_x_axis, RIGHT)
        y_label_graph = MathTex("y", font_size=24).next_to(graph_y_axis, UP)
        self.add(x_label, y_label_graph)

        # 创建正弦曲线
        sine_curve = ParametricFunction(
            lambda t: np.array([
                t,
                np.sin(t),
                0
            ]),
            t_range=[0, 2*PI],
            color=YELLOW,
            stroke_width=3
        )
        sine_curve.move_to(graph_origin)
        self.add(sine_curve)

        # 标注当前位置
        current_x = angle_value
        current_point = graph_origin + np.array([current_x, np.sin(current_x), 0])
        current_dot = Dot(point=current_point, color=RED)
        self.add(current_dot)

        # 标注 sin(α) 在曲线上
        sine_curve_label = MathTex(r"y = \sin x", font_size=28, color=YELLOW)
        sine_curve_label.to_edge(UP + RIGHT)
        self.add(sine_curve_label)

        # 添加公式说明
        formula = MathTex(
            r"\sin\alpha = \frac{y}{r}",
            font_size=32,
            color=WHITE
        )
        formula.to_edge(DOWN)
        self.add(formula)

        # 动画：点沿圆周运动
        moving_dot = Dot(color=RED)
        self.add(moving_dot)

        def update_dot(mob, alpha):
            point = origin + np.array([
                2 * np.cos(alpha * PI / 2),
                2 * np.sin(alpha * PI / 2),
                0
            ])
            mob.move_to(point)

        self.play(
            UpdateFromAlphaFunc(moving_dot, update_dot),
            run_time=4,
            rate_func=linear
        )

        self.wait(2)
