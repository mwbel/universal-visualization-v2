from manim import *
import numpy as np

class SineAnimationFixed(Scene):
    def construct(self):
        # 创建标题
        title = Text("正弦函数", font_size=48)
        title.set_color(RED)
        title.to_edge(UP)
        self.add(title)

        # 创建单位圆
        circle = Circle(radius=2, color=BLUE)
        circle.shift(LEFT * 3)
        self.add(circle)

        # 创建坐标轴
        axes = Axes(
            x_range=[-1, 6, 1],
            y_range=[-2, 2, 0.5],
            axis_config={"color": GREEN}
        )
        axes.shift(RIGHT * 1.5)
        self.add(axes)

        # 创建正弦曲线
        sine_graph = axes.plot(lambda x: np.sin(x), color=YELLOW)
        self.add(sine_graph)

        # 创建角度标记
        angle_line = Line(circle.get_center(), circle.point_at_angle(PI/4), color=GREEN)
        angle_label = MathTex(r"\alpha", font_size=36).next_to(angle_line, RIGHT)
        self.add(angle_line, angle_label)

        # 创建正弦线
        sine_line = DashedLine(
            circle.point_at_angle(PI/4),
            circle.get_center() + np.array([0, circle.radius * np.sin(PI/4), 0]),
            color=PURPLE
        )
        self.add(sine_line)

        # 动画：展示旋转效果
        dot = Dot(color=RED)
        self.add(dot)
        self.play(
            MoveAlongPath(dot, circle, run_time=4),
            rate_func=linear
        )

        # 动画：显示正弦值随时间变化
        self.wait(1)
