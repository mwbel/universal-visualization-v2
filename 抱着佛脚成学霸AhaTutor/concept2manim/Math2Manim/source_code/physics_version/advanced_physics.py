"""
高级物理动画 - Advanced Physics Animations
包含更复杂的物理概念可视化
"""

from manim import *
import numpy as np


class ProjectileMotion(Scene):
    """抛体运动动画"""

    def construct(self):
        # 标题
        title = Text("抛体运动", font_size=48, color=BLUE)
        title.to_edge(UP)
        self.play(Write(title), run_time=1)

        # 坐标系
        axes = Axes(
            x_range=[0, 10, 1],
            y_range=[0, 6, 1],
            x_length=9,
            y_length=5,
            axis_config={"color": GRAY}
        )
        axes.shift(DOWN * 0.5 + LEFT * 0.5)

        # 坐标轴标签
        x_label = axes.get_x_axis_label("x", edge=RIGHT, direction=RIGHT)
        y_label = axes.get_y_axis_label("y", edge=UP, direction=UP)

        self.play(Create(axes), Write(x_label), Write(y_label))

        # 运动方程
        equations = VGroup(
            MathTex(r"x = v_0 \cos\theta \cdot t", font_size=28, color=GREEN),
            MathTex(r"y = v_0 \sin\theta \cdot t - \frac{1}{2}gt^2", font_size=28, color=ORANGE)
        ).arrange(DOWN, aligned_edge=LEFT)
        equations.to_corner(UR)
        self.play(Write(equations))

        # 初始参数
        v0 = 5  # 初速度
        theta = PI / 4  # 发射角度
        g = 9.8  # 重力加速度

        # 抛射物
        projectile = Dot(color=RED, radius=0.15)
        projectile.move_to(axes.c2p(0, 0))

        # 初速度矢量
        v0_arrow = Arrow(
            start=projectile.get_center(),
            end=projectile.get_center() + RIGHT * 1.5 * np.cos(theta) + UP * 1.5 * np.sin(theta),
            color=YELLOW,
            buff=0,
            stroke_width=6
        )
        v0_label = MathTex("v_0", font_size=32, color=YELLOW)
        v0_label.next_to(v0_arrow, UR, buff=0.1)

        self.play(Create(projectile), Create(v0_arrow), Write(v0_label))
        self.wait(0.5)

        # 轨迹路径
        def trajectory(t):
            x = v0 * np.cos(theta) * t
            y = v0 * np.sin(theta) * t - 0.5 * g * t**2
            return axes.c2p(x, y)

        # 计算飞行时间
        t_flight = 2 * v0 * np.sin(theta) / g

        # 绘制轨迹
        path = ParametricFunction(
            lambda t: trajectory(t),
            t_range=[0, t_flight],
            color=BLUE,
            stroke_width=2
        )

        # 动画：抛射物沿轨迹运动
        self.play(
            FadeOut(v0_arrow),
            FadeOut(v0_label)
        )

        self.play(
            MoveAlongPath(projectile, path),
            Create(path),
            run_time=3,
            rate_func=linear
        )

        # 标注最高点
        t_max = v0 * np.sin(theta) / g
        max_height_point = Dot(trajectory(t_max), color=GREEN, radius=0.1)
        max_height_label = Text("最高点", font_size=24, color=GREEN)
        max_height_label.next_to(max_height_point, UP)

        self.play(Create(max_height_point), Write(max_height_label))
        self.wait(2)


class WaveInterference(Scene):
    """波的干涉动画"""

    def construct(self):
        # 标题
        title = Text("波的干涉", font_size=48, color=BLUE)
        title.to_edge(UP)
        self.play(Write(title), run_time=1)

        # 两个波源
        source1 = Dot(LEFT * 2, color=RED, radius=0.2)
        source2 = Dot(RIGHT * 2, color=BLUE, radius=0.2)

        source1_label = Text("S₁", font_size=24, color=RED)
        source1_label.next_to(source1, DOWN)
        source2_label = Text("S₂", font_size=24, color=BLUE)
        source2_label.next_to(source2, DOWN)

        self.play(
            Create(source1), Create(source2),
            Write(source1_label), Write(source2_label)
        )

        # 波的方程
        wave_eq = MathTex(r"y = A\sin(kx - \omega t)", font_size=36, color=YELLOW)
        wave_eq.to_edge(DOWN)
        self.play(Write(wave_eq))

        # 创建波纹
        waves1 = VGroup()
        waves2 = VGroup()

        for i in range(5):
            radius = 0.5 + i * 0.6
            circle1 = Circle(radius=radius, color=RED, stroke_width=2, stroke_opacity=0.7)
            circle1.move_to(source1.get_center())
            circle2 = Circle(radius=radius, color=BLUE, stroke_width=2, stroke_opacity=0.7)
            circle2.move_to(source2.get_center())

            waves1.add(circle1)
            waves2.add(circle2)

        # 动画：波纹扩散
        self.play(
            *[Create(w) for w in waves1],
            *[Create(w) for w in waves2],
            run_time=2
        )

        # 干涉说明
        interference_text = Text("相长干涉与相消干涉", font_size=28, color=GREEN)
        interference_text.next_to(wave_eq, UP)
        self.play(Write(interference_text))

        self.wait(2)


class ElectromagneticInduction(Scene):
    """电磁感应动画"""

    def construct(self):
        # 标题
        title = Text("电磁感应", font_size=48, color=BLUE)
        title.to_edge(UP)
        self.play(Write(title), run_time=1)

        # 法拉第定律
        faraday_law = MathTex(r"\varepsilon = -\frac{d\Phi_B}{dt}", font_size=40, color=YELLOW)
        faraday_law.next_to(title, DOWN, buff=0.5)
        self.play(Write(faraday_law))

        # 磁场区域（用矩形表示）
        magnetic_field = Rectangle(
            width=4, height=3,
            fill_color=BLUE,
            fill_opacity=0.3,
            stroke_color=BLUE
        )
        magnetic_field.shift(LEFT * 2)

        # 磁场符号（×表示磁场进入纸面）
        field_symbols = VGroup()
        for i in range(-1, 2):
            for j in range(-1, 2):
                symbol = Text("×", font_size=24, color=BLUE)
                symbol.move_to(magnetic_field.get_center() + RIGHT * i * 0.8 + UP * j * 0.6)
                field_symbols.add(symbol)

        self.play(Create(magnetic_field), Write(field_symbols))

        # 线圈
        coil = Rectangle(width=1.5, height=2, color=RED, stroke_width=4)
        coil.shift(RIGHT * 2.5)

        self.play(Create(coil))
        self.wait(0.5)

        # 线圈移动进入磁场
        self.play(
            coil.animate.shift(LEFT * 4),
            run_time=2
        )

        # 感应电流箭头
        current_arrow = CurvedArrow(
            start_point=coil.get_corner(UL),
            end_point=coil.get_corner(UR),
            color=YELLOW,
            stroke_width=6
        )
        current_label = Text("感应电流", font_size=24, color=YELLOW)
        current_label.next_to(coil, DOWN)

        self.play(Create(current_arrow), Write(current_label))

        # 说明文字
        explanation = Text("磁通量变化 → 产生感应电动势", font_size=28, color=GREEN)
        explanation.to_edge(DOWN)
        self.play(Write(explanation))

        self.wait(2)


class DopplerEffect(Scene):
    """多普勒效应动画"""

    def construct(self):
        # 标题
        title = Text("多普勒效应", font_size=48, color=BLUE)
        title.to_edge(UP)
        self.play(Write(title), run_time=1)

        # 多普勒公式
        formula = MathTex(
            r"f' = f \frac{v \pm v_o}{v \mp v_s}",
            font_size=40,
            color=YELLOW
        )
        formula.next_to(title, DOWN, buff=0.5)
        self.play(Write(formula))

        # 声源（救护车）
        source = Circle(radius=0.4, fill_color=RED, fill_opacity=0.8)
        source.shift(LEFT * 4)
        source_label = Text("声源", font_size=24, color=WHITE)
        source_label.move_to(source.get_center())

        self.play(Create(source), Write(source_label))

        # 观察者
        observer = Circle(radius=0.3, fill_color=GREEN, fill_opacity=0.8)
        observer.shift(RIGHT * 4)
        observer_label = Text("观察者", font_size=20, color=WHITE)
        observer_label.move_to(observer.get_center())

        self.play(Create(observer), Write(observer_label))

        # 声波（同心圆）
        waves = VGroup()
        for i in range(4):
            wave = Circle(
                radius=0.6 + i * 0.5,
                color=BLUE,
                stroke_width=2
            )
            wave.move_to(source.get_center())
            waves.add(wave)

        self.play(*[Create(w) for w in waves], run_time=1)

        # 声源向观察者移动
        self.play(
            source.animate.shift(RIGHT * 3),
            source_label.animate.shift(RIGHT * 3),
            *[w.animate.shift(RIGHT * 1.5) for w in waves],
            run_time=2
        )

        # 说明：波长变化
        explanation = VGroup(
            Text("声源靠近 → 波长变短 → 频率升高", font_size=24, color=GREEN),
            Text("声源远离 → 波长变长 → 频率降低", font_size=24, color=ORANGE)
        ).arrange(DOWN, aligned_edge=LEFT)
        explanation.to_edge(DOWN)

        self.play(Write(explanation))
        self.wait(2)


class PhotoelectricEffect(Scene):
    """光电效应动画"""

    def construct(self):
        # 标题
        title = Text("光电效应", font_size=48, color=BLUE)
        title.to_edge(UP)
        self.play(Write(title), run_time=1)

        # 爱因斯坦光电方程
        einstein_eq = MathTex(
            r"E_k = h\nu - W",
            font_size=40,
            color=YELLOW
        )
        einstein_eq.next_to(title, DOWN, buff=0.5)
        self.play(Write(einstein_eq))

        # 金属板
        metal_plate = Rectangle(
            width=0.3, height=3,
            fill_color=GRAY,
            fill_opacity=0.8,
            stroke_color=WHITE
        )
        metal_plate.shift(LEFT * 2)

        plate_label = Text("金属", font_size=24, color=WHITE)
        plate_label.next_to(metal_plate, DOWN)

        self.play(Create(metal_plate), Write(plate_label))

        # 入射光子
        photons = VGroup()
        for i in range(5):
            photon = Arrow(
                start=LEFT * 5 + UP * (1 - i * 0.5),
                end=LEFT * 2.2 + UP * (1 - i * 0.5),
                color=YELLOW,
                buff=0,
                stroke_width=4
            )
            photons.add(photon)

        photon_label = Text("光子 hν", font_size=28, color=YELLOW)
        photon_label.next_to(photons, LEFT)

        self.play(Create(photons), Write(photon_label))

        # 光子照射到金属板
        self.play(
            *[p.animate.shift(RIGHT * 2.8) for p in photons],
            run_time=1.5
        )

        self.play(FadeOut(photons))

        # 发射电子
        electrons = VGroup()
        for i in range(5):
            electron = Dot(color=BLUE, radius=0.1)
            electron.move_to(metal_plate.get_right() + UP * (1 - i * 0.5))
            electrons.add(electron)

        electron_label = Text("光电子", font_size=24, color=BLUE)
        electron_label.shift(RIGHT * 2 + UP * 2)

        self.play(Create(electrons))

        # 电子飞出
        self.play(
            *[e.animate.shift(RIGHT * 3) for e in electrons],
            Write(electron_label),
            run_time=1.5
        )

        # 说明
        explanation = VGroup(
            Text("光子能量 > 逸出功 → 发射电子", font_size=26, color=GREEN),
            Text("动能 = 光子能量 - 逸出功", font_size=26, color=ORANGE)
        ).arrange(DOWN, aligned_edge=LEFT)
        explanation.to_edge(DOWN)

        self.play(Write(explanation))
        self.wait(2)


if __name__ == "__main__":
    """
    运行示例：

    # 抛体运动
    manim -pql advanced_physics.py ProjectileMotion

    # 波的干涉
    manim -pql advanced_physics.py WaveInterference

    # 电磁感应
    manim -pql advanced_physics.py ElectromagneticInduction

    # 多普勒效应
    manim -pql advanced_physics.py DopplerEffect

    # 光电效应
    manim -pql advanced_physics.py PhotoelectricEffect
    """
    pass
