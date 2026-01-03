from manim import *
import numpy as np

class SineAnimation(Scene):
    def construct(self):
        # 设置动画时长
        self.camera.background_color = WHITE
        # 创建标题
        title = Text("正弦函数", font_size=36)
        title.set_color(RED)
        self.add(title)
        self.wait(2)
        
        # 创建单位圆
        circle = Circle(radius=1, color=GRAY)
        self.add(circle)
        
        # 创建角度α
        alpha = Angle(np.pi / 6, circle, start_angle=np.pi / 2, radius=0.1, color=GREEN)
        self.add(alpha)
        
        # 创建射线
        ray = Line(circle.get_center(), alpha.get_point_on_circle(), color=BLUE)
        self.add(ray)
        
        # 创建正弦线
        sine_line = Line(circle.get_center(), np.array([0, np.sin(np.pi / 6), 0]), color=ORANGE)
        self.add(sine_line)
        
        # 创建正弦值
        sine_value = Text("sin α = y/r", font_size=24)
        sine_value.set_color(ORANGE)
        sine_value.next_to(sine_line, UP)
        self.add(sine_value)
        
        # 创建y和r的标签
        y_label = Text("y", font_size=20)
        y_label.set_color(ORANGE)
        y_label.next_to(sine_line, UP * 0.5)
        self.add(y_label)
        
        r_label = Text("r", font_size=20)
        r_label.set_color(GRAY)
        r_label.next_to(circle, UP * 0.5)
        self.add(r_label)
        
        # 动画结束
        self.wait(7)