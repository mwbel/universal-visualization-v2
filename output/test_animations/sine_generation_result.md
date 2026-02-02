# 正弦 (Sine)

=== Manim 代码 ===
```python
from manim import *
import numpy as np

class SineDefinition(Scene):
    def construct(self):
        # 设置动画时长
        self.camera.frame.scale(2)
        
        # 创建标题
        title = Text("正弦的定义")
        title.scale(1.5)
        self.add(title)
        
        # 创建单位圆
        circle = Circle(radius=1, color=WHITE)
        self.add(circle)
        
        # 创建半径和角度
        angle = Angle(1, 1, radius=1, start_angle=0, arc_config={"color": RED, "radius": 0.1})
        radius = Line(ORIGIN, angle.get_point(1), color=RED)
        self.add(angle, radius)
        
        # 创建直角三角形
        triangle = Polygon(radius.get_point(1), angle.get_point(1), angle.get_point(2), color=BLUE)
        self.add(triangle)
        
        # 创建正弦函数的几何解释
        sine_line = Line(triangle.get_point(1), triangle.get_point(2), color=GREEN)
        self.add(sine_line)
        
        # 创建正弦的数学表达式
        sin_alpha = Tex(r"\sin \alpha = \frac{y}{r}", font_size=24)
        sin_alpha.move_to(sine_line.get_center() + DOWN * 1.5)
        self.add(sin_alpha)
        
        # 创建动画效果
        angle.rotate(angle.get_angle() * 2 * np.pi, about_point=ORIGIN, run_time=5)
        radius.rotate(angle.get_angle() * 2 * np.pi, about_point=ORIGIN, run_time=5)
        triangle.rotate(angle.get_angle() * 2 * np.pi, about_point=ORIGIN, run_time=5)
        sine_line.rotate(angle.get_angle() * 2 * np.pi, about_point=ORIGIN, run_time=5)
        
        # 结束动画
        self.wait(5)

# 运行动画
if __name__ == "__main__":
    from manim import config
    config.pixel_height = 480
    config.pixel_width = 640
    SineDefinition().render()
```

=== 场景说明 ===
1. 首先出现动画标题“正弦的定义”，字号较大，以便学生能快速识别。
2. 接着在屏幕上绘制一个单位圆，并填充为白色，以便于后续的绘制。
3. 在单位圆上绘制一个角度和半径，角度用红色表示，半径也用红色表示，以突出这两个元素。
4. 在角度和半径的基础上绘制一个直角三角形，三角形用蓝色表示，以区分其他元素。
5. 在直角三角形中，绘制出正弦线，用绿色表示，表示正弦的几何意义。
6. 在屏幕下方添加正弦的数学表达式 $\sin \alpha = \frac{y}{r}$，位于正弦线的中心下方，便于学生阅读。
7. 最后，动画通过旋转角度、半径、三角形和正弦线来展示正弦函数的周期性变化，整个动画时长约为10秒。