"""
Manim 服务测试脚本
"""

import requests
import json

BASE_URL = "http://localhost:8001"

def test_health():
    """测试健康检查"""
    print("🔍 测试健康检查...")
    response = requests.get(f"{BASE_URL}/health")
    print(json.dumps(response.json(), indent=2, ensure_ascii=False))
    print()

def test_simple_animation():
    """测试简单动画生成"""
    print("🎬 测试简单动画生成...")

    code = """
from manim import *

class MathScene(Scene):
    def construct(self):
        # 创建一个圆
        circle = Circle(radius=2, color=BLUE)

        # 创建文字
        text = Text("Hello Manim!", font_size=48)
        text.next_to(circle, DOWN)

        # 动画
        self.play(Create(circle))
        self.play(Write(text))
        self.wait()
"""

    response = requests.post(
        f"{BASE_URL}/generate",
        json={
            "code": code,
            "scene_name": "MathScene",
            "quality": "l"  # 使用低质量加快测试
        }
    )

    result = response.json()
    print(json.dumps(result, indent=2, ensure_ascii=False))

    if result["success"]:
        print(f"\n✅ 成功！视频地址: {BASE_URL}{result['video_path']}")
    else:
        print(f"\n❌ 失败: {result['error']}")
    print()

def test_math_animation():
    """测试数学公式动画"""
    print("📐 测试数学公式动画...")

    code = """
from manim import *

class MathScene(Scene):
    def construct(self):
        # 勾股定理
        theorem = MathTex(r"a^2 + b^2 = c^2")
        theorem.scale(2)

        self.play(Write(theorem))
        self.wait()

        # 变换
        theorem2 = MathTex(r"c = \\sqrt{a^2 + b^2}")
        theorem2.scale(2)

        self.play(Transform(theorem, theorem2))
        self.wait()
"""

    response = requests.post(
        f"{BASE_URL}/generate",
        json={
            "code": code,
            "scene_name": "MathScene",
            "quality": "l"
        }
    )

    result = response.json()
    print(json.dumps(result, indent=2, ensure_ascii=False))

    if result["success"]:
        print(f"\n✅ 成功！视频地址: {BASE_URL}{result['video_path']}")
    else:
        print(f"\n❌ 失败: {result['error']}")
    print()

if __name__ == "__main__":
    print("=" * 50)
    print("Manim 服务测试")
    print("=" * 50)
    print()

    try:
        test_health()
        test_simple_animation()
        test_math_animation()

        print("=" * 50)
        print("✅ 所有测试完成")
        print("=" * 50)
    except requests.exceptions.ConnectionError:
        print("❌ 无法连接到服务，请确保服务已启动: python app.py")
    except Exception as e:
        print(f"❌ 测试失败: {e}")
