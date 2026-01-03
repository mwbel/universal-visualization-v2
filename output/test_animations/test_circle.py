```python
from manim import *
import numpy as np

class CircleAnimation(Scene):
    def construct(self):
        # 创建一个圆，半径为2，颜色为蓝色
        circle = Circle(radius=2, color=BLUE)
        
        # 将圆添加到场景中
        self.add(circle)
        
        # 设置动画时长为3秒
        self.play(Write(circle), run_time=3)
```