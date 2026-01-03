from manim import *
import numpy as np

class SetAnimation(Scene):
    def construct(self):
        # 创建标题
        title = Text("集合 (Set)", font_size=24)
        title.set_color(YELLOW)
        self.add(title)

        # 创建集合的符号
        set_symbol = Text("集合", font_size=18)
        set_symbol.next_to(title, down)
        self.add(set_symbol)

        # 创建英文术语
        set_english = Text("Set", font_size=18)
        set_english.next_to(set_symbol, right)
        self.add(set_english)

        # 创建数学符号
        set_formula = Math("{" + ", ".join([str(i) for i in range(1, 4)]) + "}")
        set_formula.set_color(RED)
        set_formula.next_to(set_english, right)
        self.add(set_formula)

        # 创建动画效果
        self.play(FadeIn(title), FadeIn(set_symbol), FadeIn(set_english), FadeIn(set_formula), run_time=5)
        self.play(Wiggle(title), Wiggle(set_symbol), Wiggle(set_english), Wiggle(set_formula), run_time=1)
        self.play(FadeOut(title), FadeOut(set_symbol), FadeOut(set_english), FadeOut(set_formula), run_time=5)