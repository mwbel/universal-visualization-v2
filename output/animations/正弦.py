from manim import *
import numpy as np

class SineAnimation(Scene):
    def construct(self):
        # 创建标题
        title = Text("正弦函数", font_size=24)
        title.set_color(RED)
        self.add(title)

        # 创建单位圆
        circle = Circle(radius=1, color=BLUE)
        self.add(circle)

        # 创建角度标记
        angle = Line(circle.get_center(), circle.point_at_angle(np.pi / 2), color=GREEN)
        angle_label = Text("$\alpha$", font_size=20).next_to(angle, RIGHT)
        self.add(angle, angle_label)

        # 创建正弦线
        sine_line = Line(circle.get_center(), circle.point_at_angle(np.pi / 2), color=PURPLE)
        sine_line_label = Text("$y = \sin \alpha$", font_size=20).next_to(sine_line, DOWN)
        self.add(sine_line, sine_line_label)

        # 创建半径标记
        radius = Line(circle.get_center(), circle.point_at_angle(0), color=ORANGE)
        radius_label = Text("$r$", font_size=20).next_to(radius, DOWN)
        self.add(radius, radius_label)

        # 创建y坐标标记
        y_label = Text("$y$", font_size=20).next_to(circle.point_at_angle(np.pi / 2), UP)
        self.add(y_label)

        # 动画：旋转角度标记
        angle.rotate(PI / 2, about_point=circle.get_center(), run_time=3)
        angle_label.rotate(PI / 2, about_point=circle.get_center(), run_time=3)

        # 动画：移动正弦线
        sine_line.move_to(circle.point_at_angle(np.pi / 2), run_time=3)
        sine_line_label.move_to(circle.point_at_angle(np.pi / 2), run_time=3)

        # 动画：显示半径
        radius.rotate(PI / 2, about_point=circle.get_center(), run_time=3)
        radius_label.rotate(PI / 2, about_point=circle.get_center(), run_time=3)

        # 动画：显示y坐标
        y_label.move_to(circle.point_at_angle(np.pi / 2), run_time=3)

        # 动画：结束
        self.wait(2)