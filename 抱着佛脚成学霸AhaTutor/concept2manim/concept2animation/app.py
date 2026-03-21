"""
Concept2Animation - 概念到 Manim 动画生成服务
基于 Math2Manim 项目的核心思想，使用 AI 自动生成数学/物理动画

核心特性：
1. 输入数学/物理概念
2. AI 分析并生成 Manim 代码
3. 自动渲染动画视频
4. 支持多种质量和风格
"""

from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse, JSONResponse, HTMLResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from typing import Optional, List
import subprocess
import tempfile
import os
import shutil
from pathlib import Path
import json
import anthropic
from zhipuai import ZhipuAI
import re

app = FastAPI(
    title="Concept2Animation Service",
    description="将数学/物理概念自动转换为 Manim 动画",
    version="1.0.0"
)

# 配置
MEDIA_DIR = Path("./media")
MEDIA_DIR.mkdir(exist_ok=True)

# AI 配置
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY", "94HM6EBG-43DT-6JMY-DXVM-355ET9U3R7C4")
GLM_API_KEY = os.getenv("GLM_API_KEY")

# 优先使用 Claude，其次 GLM
if ANTHROPIC_API_KEY:
    AI_PROVIDER = "anthropic"
    anthropic_client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)
    glm_client = None
    print("✅ AI 生成已启用 (使用 Claude API)")
elif GLM_API_KEY:
    AI_PROVIDER = "glm"
    glm_client = ZhipuAI(api_key=GLM_API_KEY)
    anthropic_client = None
    print("✅ AI 生成已启用 (使用 GLM-4 API)")
else:
    AI_PROVIDER = None
    anthropic_client = None
    glm_client = None
    print("⚠️  AI 生成未启用 (将使用默认模板)")

USE_AI_GENERATION = bool(AI_PROVIDER)

# 创建静态文件目录
STATIC_DIR = Path("./static")
STATIC_DIR.mkdir(exist_ok=True)
ANIMATIONS_DIR = STATIC_DIR / "animations"
ANIMATIONS_DIR.mkdir(exist_ok=True)

# 挂载静态文件
app.mount("/static", StaticFiles(directory=str(STATIC_DIR)), name="static")

class ConceptRequest(BaseModel):
    concept: str  # 概念描述，如 "勾股定理"
    language: str = "zh"  # zh 或 en
    quality: str = "m"  # l, m, h, k
    style: str = "educational"  # educational, professional, simple
    include_narration: bool = True  # 是否包含旁白文字

class AnimationResponse(BaseModel):
    success: bool
    message: str
    video_path: Optional[str] = None
    code: Optional[str] = None
    concept_analysis: Optional[dict] = None
    error: Optional[str] = None

# 预定义的概念模板库
CONCEPT_TEMPLATES = {
    "勾股定理": {
        "keywords": ["pythagorean", "直角三角形", "a²+b²=c²"],
        "prerequisites": ["三角形", "正方形", "面积"],
        "template": "pythagorean_theorem"
    },
    "正弦函数": {
        "keywords": ["sine", "sin", "三角函数", "周期"],
        "prerequisites": ["单位圆", "角度", "弧度"],
        "template": "sine_function"
    },
    "导数": {
        "keywords": ["derivative", "切线", "变化率"],
        "prerequisites": ["极限", "函数", "斜率"],
        "template": "derivative"
    },
    "开普勒第二定律": {
        "keywords": ["kepler", "行星运动", "面积", "椭圆轨道"],
        "prerequisites": ["椭圆", "角速度", "面积"],
        "template": "kepler_second_law"
    },
    "积分": {
        "keywords": ["integral", "面积", "累积"],
        "prerequisites": ["导数", "函数", "极限"],
        "template": "integral"
    }
}

def extract_scene_class_name(code: str) -> str:
    """从生成的代码中提取 Scene 类名"""
    # 匹配 class XXX(Scene): 或 class XXX(ThreeDScene):
    match = re.search(r'class\s+(\w+)\s*\(\s*(?:Scene|ThreeDScene)\s*\)', code)
    if match:
        return match.group(1)
    return "ConceptAnimation"  # 默认值

def generate_manim_code_with_ai(concept: str, style: str = "educational") -> str:
    """
    使用 AI 生成 Manim 代码
    优先级：预定义模板 > AI 生成 > 默认模板
    """

    # 1. 检查是否有预定义模板（最高质量）
    if concept in CONCEPT_TEMPLATES:
        template_name = CONCEPT_TEMPLATES[concept]["template"]
        return get_template_code(template_name, style)

    # 2. 尝试使用 AI 生成（智能生成）
    if USE_AI_GENERATION:
        try:
            if AI_PROVIDER == "glm":
                return generate_with_glm(concept, style)
            elif AI_PROVIDER == "anthropic":
                return generate_with_claude(concept, style)
        except Exception as e:
            print(f"⚠️  AI 生成失败: {e}，降级到默认模板")

    # 3. 降级到默认模板
    return generate_default_animation(concept)

def generate_with_glm(concept: str, style: str = "educational") -> str:
    """使用 GLM-4 API 生成符合概念本质的 Manim 代码"""

    # 构建详细的 prompt
    prompt = f"""你是一个数学/物理概念可视化专家。请为"{concept}"生成一个 Manim 动画代码。

**核心要求：**
1. 动画必须体现"{concept}"的核心特征和本质
2. 使用恰当的数学符号、图形和公式
3. 展示概念的关键性质和直观理解
4. 代码必须可以直接运行，不要有语法错误

**重要：Manim API 使用规范**
- ❌ 不要使用 `axes.get_x_axis_labels()` 或 `axes.x_axis_labels`（不存在）
- ❌ 不要使用 `weight=BOLD` 参数（Text 不支持此参数）
- ❌ 不要使用 `dash_length` 或 `stroke_dash_length` 参数（不存在，请用 DashedLine）
- ❌ 不要在 `MathTex()` 中使用 `\\text{{}}` 包裹中文（LaTeX 无法编译中文）
- ❌ 函数调用时，关键字参数必须在位置参数之后（避免 SyntaxError）
- ✅ 使用 `axes.get_axis_labels(x_label="x", y_label="y")` 添加坐标轴标签
- ✅ 使用 `MathTex()` 创建数学公式，只用于纯数学符号和英文
- ✅ 使用 `Text()` 显示中文文字说明
- ✅ 使用 `Text()` 时只用基本参数：font_size, color
- ✅ 使用 `axes.plot(lambda x: func(x), x_range=[a, b])` 绘制函数
- ✅ 使用 `DashedLine()` 创建虚线，不要在 Line 上使用 dash_length
- ✅ 动画方法：`self.play()`, `self.wait()`, `Create()`, `Write()`, `FadeIn()`, `FadeOut()`
- ✅ 对于三角函数，使用 `np.sin()`, `np.cos()` 等
- ✅ 所有函数调用使用关键字参数，避免混用位置参数和关键字参数

**具体示例：**
- 余弦函数：绘制 y=cos(x) 曲线，展示周期性和振幅
- 梯度下降：绘制3D曲面，显示球体沿梯度方向逐步下降到最低点
- 向量：绘制箭头，展示向量加法的平行四边形法则和数乘效果
- 矩阵：展示矩阵变换如何改变平面上的网格

**代码结构：**
```python
from manim import *
import numpy as np

class ConceptAnimation(Scene):
    def construct(self):
        # 1. 标题
        title = Text("{concept}", font_size=48, color=BLUE)
        self.play(Write(title))
        self.wait(1)
        self.play(FadeOut(title))

        # 2. 核心可视化（这是最重要的部分！）
        # 根据概念特点，使用合适的图形：
        # - 函数：使用 axes.plot()
        # - 几何：使用 Circle, Square, Polygon 等
        # - 向量：使用 Arrow, Vector
        # - 3D：使用 ThreeDScene 和 Surface

        # 3. 动画展示概念的关键性质

        # 4. 总结
```

**风格：{style}**
- educational: 详细讲解，适合教学
- professional: 精致效果，适合演示
- simple: 简洁明了，快速理解（保持简单，避免复杂的动态变换）

**重要约束：**
1. 避免使用 `.animate` 配合复杂的几何变换（如 Arc.animate.set_angle）
2. 避免在循环中频繁更新和重建对象
3. 保持动画简洁，总时长控制在 15-30 秒
4. 对于 'simple' 风格，只展示核心概念，不要添加过多细节
5. 使用稳定的 Manim API，避免边缘情况
6. ❌ 不要使用 `stroke_dash_length` 参数（不存在）
7. ✅ 使用 `DashedLine` 而不是给 Line/Arrow 添加虚线参数
8. ✅ 保持代码简单，避免过多装饰性参数

请直接返回完整的 Python 代码，不要有任何解释文字。代码必须以 `from manim import *` 开头。确保代码可以直接运行，不要使用不存在的 API。"""

    # 调用 GLM API
    response = glm_client.chat.completions.create(
        model="glm-4-plus",
        messages=[
            {"role": "user", "content": prompt}
        ],
        temperature=0.3,  # 降低温度，生成更保守可靠的代码
        max_tokens=3000   # 限制代码长度，避免过于复杂
    )

    # 提取代码
    code = response.choices[0].message.content

    # 清理代码（移除可能的 markdown 标记）
    if "```python" in code:
        code = code.split("```python")[1].split("```")[0].strip()
    elif "```" in code:
        code = code.split("```")[1].split("```")[0].strip()

    # 验证代码语法
    try:
        compile(code, '<string>', 'exec')
    except SyntaxError as e:
        error_msg = str(e)
        print(f"⚠️  GLM 生成的代码有语法错误: {e}")

        # 如果是"位置参数在关键字参数之后"的错误，尝试重新生成一次
        if "positional argument follows keyword argument" in error_msg:
            print(f"🔄 检测到参数顺序错误，尝试重新生成...")
            try:
                # 添加更强的提示重新生成
                retry_prompt = prompt + "\n\n⚠️ 特别注意：在所有函数调用中，位置参数必须在关键字参数之前！例如：\n- ❌ 错误：func(x=1, y)\n- ✅ 正确：func(y, x=1)\n请仔细检查每一个函数调用。"

                response = glm_client.chat.completions.create(
                    model="glm-4-plus",
                    messages=[
                        {"role": "user", "content": retry_prompt}
                    ],
                    temperature=0.1,  # 降低温度，更保守
                    max_tokens=3000
                )

                code = response.choices[0].message.content

                # 清理代码
                if "```python" in code:
                    code = code.split("```python")[1].split("```")[0].strip()
                elif "```" in code:
                    code = code.split("```")[1].split("```")[0].strip()

                # 再次验证
                compile(code, '<string>', 'exec')
                print(f"✅ 重新生成成功")
            except Exception as retry_error:
                print(f"⚠️  重新生成也失败: {retry_error}")
                print(f"尝试降级到默认模板")
                return generate_default_animation(concept)
        else:
            print(f"尝试降级到默认模板")
            return generate_default_animation(concept)

    # 自动修复不支持的参数和错误的常量名
    fixes = [
        # 移除不支持的参数
        ('stroke_dash_length=', ''),
        ('dash_length=', ''),
        (', dash_length=[^,)]+', ''),
        (', stroke_dash_length=[^,)]+', ''),
        ('weight=BOLD', ''),
        ('weight=', ''),
        # 修复错误的颜色常量
        ('LIGHT_BLUE', 'BLUE'),
        ('LIGHT_RED', 'RED'),
        ('LIGHT_GREEN', 'GREEN'),
        ('LIGHT_YELLOW', 'YELLOW'),
    ]

    original_code = code
    for pattern, replacement in fixes:
        if pattern in code:
            print(f"⚠️  检测到问题: {pattern}，自动修复为: {replacement if replacement else '(移除)'}")
            code = re.sub(pattern, replacement, code)

    # 如果代码被修改了，显示修复信息
    if code != original_code:
        print(f"✅ 已自动修复代码")

    return code

def generate_with_claude(concept: str, style: str = "educational") -> str:
    """使用 Claude API 生成符合概念本质的 Manim 代码"""

    # 构建详细的 prompt
    prompt = f"""你是一个数学/物理概念可视化专家。请为"{concept}"生成一个 Manim 动画代码。

**核心要求：**
1. 动画必须体现"{concept}"的核心特征和本质
2. 使用恰当的数学符号、图形和公式
3. 展示概念的关键性质和直观理解
4. 代码必须可以直接运行，不要有语法错误

**重要：Manim API 使用规范**
- ❌ 不要使用 `axes.get_x_axis_labels()` 或 `axes.x_axis_labels`（不存在）
- ❌ 不要使用 `weight=BOLD` 参数（Text 不支持此参数）
- ❌ 不要使用 `dash_length` 或 `stroke_dash_length` 参数（不存在，请用 DashedLine）
- ❌ 不要在 `MathTex()` 中使用 `\\text{{}}` 包裹中文（LaTeX 无法编译中文）
- ❌ 函数调用时，关键字参数必须在位置参数之后（避免 SyntaxError）
- ✅ 使用 `axes.get_axis_labels(x_label="x", y_label="y")` 添加坐标轴标签
- ✅ 使用 `MathTex()` 创建数学公式，只用于纯数学符号和英文
- ✅ 使用 `Text()` 显示中文文字说明
- ✅ 使用 `Text()` 时只用基本参数：font_size, color
- ✅ 使用 `axes.plot(lambda x: func(x), x_range=[a, b])` 绘制函数
- ✅ 使用 `DashedLine()` 创建虚线，不要在 Line 上使用 dash_length
- ✅ 动画方法：`self.play()`, `self.wait()`, `Create()`, `Write()`, `FadeIn()`, `FadeOut()`
- ✅ 对于三角函数，使用 `np.sin()`, `np.cos()` 等
- ✅ 所有函数调用使用关键字参数，避免混用位置参数和关键字参数

**具体示例：**
- 余弦函数：绘制 y=cos(x) 曲线，展示周期性和振幅
- 梯度下降：绘制3D曲面，显示球体沿梯度方向逐步下降到最低点
- 向量：绘制箭头，展示向量加法的平行四边形法则和数乘效果
- 矩阵：展示矩阵变换如何改变平面上的网格

**代码结构：**
```python
from manim import *
import numpy as np

class ConceptAnimation(Scene):
    def construct(self):
        # 1. 标题
        title = Text("{concept}", font_size=48, color=BLUE)
        self.play(Write(title))
        self.wait(1)
        self.play(FadeOut(title))

        # 2. 核心可视化（这是最重要的部分！）
        # 根据概念特点，使用合适的图形：
        # - 函数：使用 axes.plot()
        # - 几何：使用 Circle, Square, Polygon 等
        # - 向量：使用 Arrow, Vector
        # - 3D：使用 ThreeDScene 和 Surface

        # 3. 动画展示概念的关键性质

        # 4. 总结
```

**风格：{style}**
- educational: 详细讲解，适合教学
- professional: 精致效果，适合演示
- simple: 简洁明了，快速理解（保持简单，避免复杂的动态变换）

**重要约束：**
1. 避免使用 `.animate` 配合复杂的几何变换（如 Arc.animate.set_angle）
2. 避免在循环中频繁更新和重建对象
3. 保持动画简洁，总时长控制在 15-30 秒
4. 对于 'simple' 风格，只展示核心概念，不要添加过多细节
5. 使用稳定的 Manim API，避免边缘情况
6. ❌ 不要使用 `stroke_dash_length` 参数（不存在）
7. ✅ 使用 `DashedLine` 而不是给 Line/Arrow 添加虚线参数
8. ✅ 保持代码简单，避免过多装饰性参数

请直接返回完整的 Python 代码，不要有任何解释文字。代码必须以 `from manim import *` 开头。确保代码可以直接运行，不要使用不存在的 API。"""

    # 调用 Claude API
    message = anthropic_client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=4000,
        temperature=0.7,
        messages=[
            {"role": "user", "content": prompt}
        ]
    )

    # 提取代码
    code = message.content[0].text

    # 清理代码（移除可能的 markdown 标记）
    if "```python" in code:
        code = code.split("```python")[1].split("```")[0].strip()
    elif "```" in code:
        code = code.split("```")[1].split("```")[0].strip()

    # 验证代码语法
    try:
        compile(code, '<string>', 'exec')
    except SyntaxError as e:
        error_msg = str(e)
        print(f"⚠️  Claude 生成的代码有语法错误: {e}")

        # 如果是"位置参数在关键字参数之后"的错误，尝试重新生成一次
        if "positional argument follows keyword argument" in error_msg:
            print(f"🔄 检测到参数顺序错误，尝试重新生成...")
            try:
                # 添加更强的提示重新生成
                retry_prompt = prompt + "\n\n⚠️ 特别注意：在所有函数调用中，位置参数必须在关键字参数之前！例如：\n- ❌ 错误：func(x=1, y)\n- ✅ 正确：func(y, x=1)\n请仔细检查每一个函数调用。"

                message = anthropic_client.messages.create(
                    model="claude-sonnet-4-20250514",
                    max_tokens=4000,
                    temperature=0.3,  # 降低温度，更保守
                    messages=[
                        {"role": "user", "content": retry_prompt}
                    ]
                )

                code = message.content[0].text

                # 清理代码
                if "```python" in code:
                    code = code.split("```python")[1].split("```")[0].strip()
                elif "```" in code:
                    code = code.split("```")[1].split("```")[0].strip()

                # 再次验证
                compile(code, '<string>', 'exec')
                print(f"✅ 重新生成成功")
            except Exception as retry_error:
                print(f"⚠️  重新生成也失败: {retry_error}")
                print(f"尝试降级到默认模板")
                return generate_default_animation(concept)
        else:
            print(f"尝试降级到默认模板")
            return generate_default_animation(concept)

    # 自动修复不支持的参数和错误的常量名
    fixes = [
        # 移除不支持的参数
        ('stroke_dash_length=', ''),
        ('dash_length=', ''),
        (', dash_length=[^,)]+', ''),
        (', stroke_dash_length=[^,)]+', ''),
        ('weight=BOLD', ''),
        ('weight=', ''),
        # 修复错误的颜色常量
        ('LIGHT_BLUE', 'BLUE'),
        ('LIGHT_RED', 'RED'),
        ('LIGHT_GREEN', 'GREEN'),
        ('LIGHT_YELLOW', 'YELLOW'),
    ]

    original_code = code
    for pattern, replacement in fixes:
        if pattern in code:
            print(f"⚠️  检测到问题: {pattern}，自动修复为: {replacement if replacement else '(移除)'}")
            code = re.sub(pattern, replacement, code)

    # 如果代码被修改了，显示修复信息
    if code != original_code:
        print(f"✅ 已自动修复代码")

    return code

def get_template_code(template_name: str, style: str) -> str:
    """获取预定义模板代码"""

    if template_name == "pythagorean_theorem":
        return """
from manim import *
import numpy as np

class PythagoreanTheorem(Scene):
    def construct(self):
        # 标题
        title = Text("勾股定理", font_size=48, color=BLUE)
        subtitle = MathTex("a^2 + b^2 = c^2", font_size=36)
        subtitle.next_to(title, DOWN)

        self.play(Write(title))
        self.play(Write(subtitle))
        self.wait(1)

        # 移到顶部
        title_group = VGroup(title, subtitle)
        self.play(title_group.animate.scale(0.6).to_edge(UP))
        self.wait(0.5)

        # 创建直角三角形 (3-4-5)，缩小并居中
        scale = 0.8
        A = np.array([0, 0, 0]) * scale      # 左下角（直角）
        B = np.array([3, 0, 0]) * scale      # 右下角
        C = np.array([0, 4, 0]) * scale      # 左上角

        # 创建三个正方形（先创建，后面再显示）
        # 正方形 a (底边 AB) - 向下延伸
        square_a_points = [
            A,
            B,
            B + DOWN * 3 * scale,
            A + DOWN * 3 * scale
        ]
        square_a = Polygon(*square_a_points, color=YELLOW, fill_opacity=0.4, stroke_width=2)
        a_area = MathTex("a^2=9", color=YELLOW, font_size=28)
        a_area.move_to(square_a.get_center())

        # 正方形 b (左边 AC) - 向左延伸
        square_b_points = [
            A,
            C,
            C + LEFT * 4 * scale,
            A + LEFT * 4 * scale
        ]
        square_b = Polygon(*square_b_points, color=GREEN, fill_opacity=0.4, stroke_width=2)
        b_area = MathTex("b^2=16", color=GREEN, font_size=28)
        b_area.move_to(square_b.get_center())

        # 正方形 c (斜边 BC) - 向右上延伸（远离三角形内部）
        bc_vec = C - B
        bc_len = np.linalg.norm(bc_vec)
        bc_unit = bc_vec / bc_len
        # 垂直向量（顺时针旋转90度，指向外侧）
        perp_vec = np.array([bc_unit[1], -bc_unit[0], 0]) * bc_len

        square_c_points = [
            B,
            C,
            C + perp_vec,
            B + perp_vec
        ]
        square_c = Polygon(*square_c_points, color=RED, fill_opacity=0.4, stroke_width=2)
        c_area = MathTex("c^2=25", color=RED, font_size=28)
        c_area.move_to(square_c.get_center())

        # 整体向右移动，避免左侧被裁剪
        everything = VGroup(square_a, square_b, square_c, a_area, b_area, c_area)
        everything.shift(RIGHT * 1.5)

        # 重新定义三角形顶点（应用相同的位移）
        A = A + RIGHT * 1.5
        B = B + RIGHT * 1.5
        C = C + RIGHT * 1.5

        triangle = Polygon(A, B, C, color=WHITE, stroke_width=4, fill_opacity=0)

        # 先显示正方形
        self.play(
            Create(square_a),
            Create(square_b),
            Create(square_c),
            run_time=2
        )
        self.wait(0.5)

        # 再显示三角形（在最上层）
        self.play(Create(triangle), run_time=1.5)
        self.wait(0.5)

        # 标注边长
        a_label = MathTex("a=3", color=YELLOW, font_size=32)
        a_label.next_to((A + B) / 2, DOWN, buff=0.3)

        b_label = MathTex("b=4", color=GREEN, font_size=32)
        b_label.next_to((A + C) / 2, LEFT, buff=0.3)

        c_label = MathTex("c=5", color=RED, font_size=32)
        c_label.next_to((B + C) / 2, UR, buff=0.3)

        self.play(Write(a_label), Write(b_label), Write(c_label))
        self.wait(0.5)

        # 显示面积标注
        self.play(Write(a_area), Write(b_area), Write(c_area), run_time=1.5)
        self.wait(1)

        # 显示等式验证
        equation = MathTex("9", "+", "16", "=", "25", font_size=48)
        equation.to_edge(DOWN, buff=1)
        equation[0].set_color(YELLOW)
        equation[2].set_color(GREEN)
        equation[4].set_color(RED)

        self.play(Write(equation), run_time=2)
        self.wait(2)

        # 淡出
        self.play(*[FadeOut(mob) for mob in self.mobjects], run_time=2)
        self.wait(0.5)
"""

    elif template_name == "kepler_second_law":
        return """
from manim import *
import numpy as np

class KeplerSecondLaw(Scene):
    def construct(self):
        # 标题
        title = Text("开普勒第二定律", font_size=48, color=BLUE)
        subtitle = Text("相等时间扫过相等面积", font_size=28, color=GRAY)
        subtitle.next_to(title, DOWN)

        self.play(Write(title))
        self.play(Write(subtitle))
        self.wait(1)

        # 移到顶部
        title_group = VGroup(title, subtitle)
        self.play(title_group.animate.scale(0.6).to_edge(UP))
        self.wait(0.5)

        # 创建椭圆轨道（a=3, b=2）
        a = 3  # 半长轴
        b = 2  # 半短轴
        c = np.sqrt(a**2 - b**2)  # 焦距

        # 椭圆
        ellipse = Ellipse(width=2*a, height=2*b, color=WHITE, stroke_width=2)

        # 太阳在左焦点
        sun = Dot(point=LEFT * c, color=YELLOW, radius=0.15)
        sun_label = Text("太阳", font_size=24, color=YELLOW)
        sun_label.next_to(sun, DOWN, buff=0.2)

        self.play(Create(ellipse))
        self.play(Create(sun), Write(sun_label))
        self.wait(0.5)

        # 创建行星
        planet = Dot(color=BLUE, radius=0.1)

        # 定义椭圆上的点（参数方程）
        def ellipse_point(t):
            return np.array([a * np.cos(t) - c, b * np.sin(t), 0])

        # 近日点（t=0）和远日点（t=π）
        perihelion_t = 0  # 近日点角度
        aphelion_t = PI  # 远日点角度

        # 近日点扇形（时间短，角度小，但速度快）
        perihelion_start = perihelion_t - 0.3  # 较小的角度范围
        perihelion_end = perihelion_t + 0.3

        # 远日点扇形（时间长，角度大，但速度慢）
        aphelion_start = aphelion_t - 0.6  # 较大的角度范围
        aphelion_end = aphelion_t + 0.6

        # 创建近日点扇形区域
        perihelion_points = [sun.get_center()]
        for t in np.linspace(perihelion_start, perihelion_end, 20):
            perihelion_points.append(ellipse_point(t))
        perihelion_points.append(sun.get_center())

        perihelion_sector = Polygon(*perihelion_points, color=GREEN, fill_opacity=0.4, stroke_width=2)
        perihelion_label = Text("近日点区域", font_size=20, color=GREEN)
        perihelion_label.move_to(ellipse_point(perihelion_t) + RIGHT * 0.8 + DOWN * 0.5)

        # 创建远日点扇形区域
        aphelion_points = [sun.get_center()]
        for t in np.linspace(aphelion_start, aphelion_end, 20):
            aphelion_points.append(ellipse_point(t))
        aphelion_points.append(sun.get_center())

        aphelion_sector = Polygon(*aphelion_points, color=RED, fill_opacity=0.4, stroke_width=2)
        aphelion_label = Text("远日点区域", font_size=20, color=RED)
        aphelion_label.move_to(ellipse_point(aphelion_t) + LEFT * 0.8 + DOWN * 0.5)

        # 显示近日点扇形
        planet.move_to(ellipse_point(perihelion_start))
        self.play(Create(planet))
        self.wait(0.3)

        self.play(
            Create(perihelion_sector),
            MoveAlongPath(planet,
                VMobject().set_points_as_corners([ellipse_point(t) for t in np.linspace(perihelion_start, perihelion_end, 30)])),
            run_time=1.5
        )
        self.play(Write(perihelion_label))
        self.wait(1)

        # 显示远日点扇形
        planet.move_to(ellipse_point(aphelion_start))
        self.play(
            Create(aphelion_sector),
            MoveAlongPath(planet,
                VMobject().set_points_as_corners([ellipse_point(t) for t in np.linspace(aphelion_start, aphelion_end, 30)])),
            run_time=1.5
        )
        self.play(Write(aphelion_label))
        self.wait(1)

        # 说明文字
        explanation = Text("相等时间内，扫过的面积相等", font_size=28, color=WHITE)
        explanation.to_edge(DOWN, buff=0.8)

        # 面积公式
        area_text = MathTex(r"\\frac{dA}{dt} = \\text{常数}", font_size=36, color=YELLOW)
        area_text.next_to(explanation, UP, buff=0.5)

        self.play(Write(explanation))
        self.play(Write(area_text))
        self.wait(2)

        # 淡出
        self.play(*[FadeOut(mob) for mob in self.mobjects], run_time=2)
        self.wait(0.5)
"""

    elif template_name == "sine_function":
        return """
from manim import *

class SineFunction(Scene):
    def construct(self):
        # 标题
        title = Text("正弦函数", font_size=48, color=BLUE, )
        subtitle = MathTex("y = \\sin(x)", font_size=36)
        subtitle.next_to(title, DOWN)

        self.play(Write(title))
        self.play(Write(subtitle))
        self.wait(1)

        # 移到顶部
        title_group = VGroup(title, subtitle)
        self.play(title_group.animate.scale(0.6).to_edge(UP))
        self.wait(0.5)

        # 创建单位圆（左侧）
        circle = Circle(radius=1.5, color=WHITE, stroke_width=2)
        circle.shift(LEFT * 4)

        # 创建坐标轴（右侧）
        axes = Axes(
            x_range=[0, 2*PI, PI/2],
            y_range=[-2, 2, 1],
            x_length=6,
            y_length=3,
            axis_config={"color": GRAY}
        ).shift(RIGHT * 1.5)

        self.play(Create(circle), Create(axes))
        self.wait(0.5)

        # 添加坐标轴标签
        x_label = MathTex("x", font_size=28).next_to(axes.x_axis, RIGHT)
        y_label = MathTex("y", font_size=28).next_to(axes.y_axis, UP)
        self.play(Write(x_label), Write(y_label))

        # 创建单位圆上的动点
        dot_circle = Dot(color=RED, radius=0.08)
        dot_circle.move_to(circle.point_at_angle(0))

        # 创建正弦曲线上的对应点
        dot_sine = Dot(color=RED, radius=0.08)
        dot_sine.move_to(axes.c2p(0, 0))

        # 创建连接线（显示 y 坐标）
        line_y = always_redraw(lambda: DashedLine(
            circle.get_center(),
            dot_circle.get_center(),
            color=YELLOW,
            stroke_width=2
        ))

        line_horizontal = always_redraw(lambda: DashedLine(
            dot_circle.get_center(),
            dot_circle.get_center() + RIGHT * 5.5,
            color=GREEN,
            stroke_width=2
        ))

        self.play(Create(dot_circle), Create(dot_sine))
        self.add(line_y, line_horizontal)
        self.wait(0.5)

        # 绘制正弦曲线
        sine_curve = VMobject(color=BLUE, stroke_width=3)
        sine_curve.set_points_as_corners([axes.c2p(0, 0)])

        def update_sine_curve(mob, alpha):
            angle = alpha * 2 * PI
            # 更新圆上的点
            dot_circle.move_to(circle.point_at_angle(angle))
            # 更新正弦曲线上的点
            y_val = np.sin(angle)
            dot_sine.move_to(axes.c2p(angle, y_val))
            # 绘制正弦曲线
            points = [axes.c2p(t, np.sin(t)) for t in np.linspace(0, angle, int(angle * 20) + 2)]
            sine_curve.set_points_as_corners(points)

        self.play(
            UpdateFromAlphaFunc(sine_curve, update_sine_curve),
            run_time=6,
            rate_func=linear
        )
        self.wait(1)

        # 显示关键点标注
        annotations = VGroup(
            MathTex("0", font_size=24).next_to(axes.c2p(0, 0), DOWN),
            MathTex("\\pi/2", font_size=24).next_to(axes.c2p(PI/2, 0), DOWN),
            MathTex("\\pi", font_size=24).next_to(axes.c2p(PI, 0), DOWN),
            MathTex("2\\pi", font_size=24).next_to(axes.c2p(2*PI, 0), DOWN)
        )

        self.play(Write(annotations), run_time=1.5)
        self.wait(2)

        # 淡出
        self.play(*[FadeOut(mob) for mob in self.mobjects], run_time=2)
        self.wait(0.5)
"""

    return generate_default_animation("未知概念")

def generate_default_animation(concept: str) -> str:
    """生成默认动画代码"""
    # 转义概念名称中的特殊字符
    safe_concept = concept.replace('"', '\\"').replace("'", "\\'")

    return f"""from manim import *

class ConceptAnimation(Scene):
    def construct(self):
        # 1. 标题介绍
        title = Text("{safe_concept}", font_size=56, color=BLUE)
        subtitle = Text("概念可视化", font_size=32, color=GRAY)
        subtitle.next_to(title, DOWN, buff=0.3)

        self.play(Write(title), run_time=1.5)
        self.play(FadeIn(subtitle, shift=UP), run_time=1)
        self.wait(1.5)

        # 2. 标题移到顶部
        title_group = VGroup(title, subtitle)
        self.play(
            title_group.animate.scale(0.5).to_edge(UP),
            run_time=1
        )
        self.wait(0.5)

        # 3. 主要内容 - 几何图形演示
        circle = Circle(radius=1.5, color=BLUE, fill_opacity=0.3)
        square = Square(side_length=2.5, color=GREEN, fill_opacity=0.3)
        triangle = Triangle(color=RED, fill_opacity=0.3).scale(1.5)

        shapes = VGroup(circle, square, triangle).arrange(RIGHT, buff=1)

        self.play(Create(circle), run_time=1.5)
        self.wait(0.5)
        self.play(Create(square), run_time=1.5)
        self.wait(0.5)
        self.play(Create(triangle), run_time=1.5)
        self.wait(1)

        # 4. 图形变换
        self.play(
            circle.animate.set_color(YELLOW),
            square.animate.rotate(PI/4),
            triangle.animate.flip(RIGHT),
            run_time=2
        )
        self.wait(1)

        # 5. 数学公式
        formula = MathTex(
            r"f(x) = ax^2 + bx + c",
            font_size=48,
            color=WHITE
        )
        formula.next_to(shapes, DOWN, buff=1)

        self.play(Write(formula), run_time=2)
        self.wait(1)

        # 6. 公式变换
        formula2 = MathTex(
            r"f(x) = a(x-h)^2 + k",
            font_size=48,
            color=YELLOW
        )
        formula2.move_to(formula)

        self.play(Transform(formula, formula2), run_time=2)
        self.wait(1.5)

        # 7. 总结
        conclusion = Text(
            f"探索 {safe_concept} 的奥秘",
            font_size=36,
            color=GREEN
        )
        conclusion.to_edge(DOWN)

        self.play(FadeIn(conclusion, shift=UP), run_time=1.5)
        self.wait(2)

        # 8. 淡出所有元素
        self.play(
            *[FadeOut(mob) for mob in self.mobjects],
            run_time=2
        )
        self.wait(0.5)
"""

@app.get("/", response_class=HTMLResponse)
async def index():
    """主页 - 友好的前端界面"""
    index_file = Path("index.html")
    if index_file.exists():
        return FileResponse(index_file)
    return HTMLResponse("<h1>首页未找到</h1>")

@app.get("/api")
def api_info():
    """API 信息"""
    return {
        "service": "Concept2Animation",
        "description": "将数学/物理概念转换为 Manim 动画",
        "version": "1.0.0",
        "based_on": "Math2Manim Project",
        "endpoints": {
            "GET /": "友好的前端界面",
            "GET /showcase": "动画展示页面",
            "POST /generate": "生成概念动画",
            "GET /concepts": "获取支持的概念列表",
            "GET /video/{filename}": "获取生成的视频",
            "GET /health": "健康检查"
        }
    }

@app.get("/health")
def health_check():
    """健康检查"""
    try:
        result = subprocess.run(
            ["python3", "-m", "manim", "--version"],
            capture_output=True,
            text=True,
            timeout=5
        )
        manim_installed = result.returncode == 0
        version = result.stdout.strip() if manim_installed else "Not installed"
    except Exception as e:
        manim_installed = False
        version = str(e)

    return {
        "status": "healthy" if manim_installed else "manim not installed",
        "manim_version": version,
        "supported_concepts": len(CONCEPT_TEMPLATES),
        "media_dir": str(MEDIA_DIR.absolute())
    }

@app.get("/showcase", response_class=HTMLResponse)
async def showcase():
    """动画展示页面"""
    showcase_file = Path("showcase.html")
    if showcase_file.exists():
        return FileResponse(showcase_file)
    return HTMLResponse("<h1>展示页面未找到</h1>")

@app.get("/concepts")
def get_concepts():
    """获取支持的概念列表"""
    concepts = []
    for name, info in CONCEPT_TEMPLATES.items():
        concepts.append({
            "name": name,
            "keywords": info["keywords"],
            "prerequisites": info["prerequisites"]
        })
    return {
        "total": len(concepts),
        "concepts": concepts
    }

@app.post("/generate", response_model=AnimationResponse)
async def generate_animation(request: ConceptRequest):
    """
    生成概念动画

    示例请求:
    {
        "concept": "勾股定理",
        "language": "zh",
        "quality": "m",
        "style": "educational"
    }
    """

    # 1. 分析概念
    concept_analysis = {
        "concept": request.concept,
        "recognized": request.concept in CONCEPT_TEMPLATES,
        "prerequisites": CONCEPT_TEMPLATES.get(request.concept, {}).get("prerequisites", [])
    }

    # 2. 生成 Manim 代码
    try:
        manim_code = generate_manim_code_with_ai(request.concept, request.style)
    except Exception as e:
        return AnimationResponse(
            success=False,
            message="代码生成失败",
            error=str(e)
        )

    # 3. 保存代码到临时文件
    with tempfile.NamedTemporaryFile(mode='w', suffix='.py', delete=False) as f:
        temp_file = f.name
        f.write(manim_code)

    try:
        # 4. 执行 Manim 渲染
        quality_flag = f"-q{request.quality}"

        # 从生成的代码中提取实际的场景类名
        scene_name = extract_scene_class_name(manim_code)
        print(f"📝 检测到场景类名: {scene_name}")

        unique_id = os.urandom(4).hex()
        output_name = f"{request.concept}_{unique_id}"

        cmd = [
            "python3", "-m", "manim",
            quality_flag,
            temp_file,
            scene_name,
            "-o", output_name
        ]

        # 在当前目录运行，让 Manim 自己创建 media 目录
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=120
        )

        if result.returncode != 0:
            # 检查是否是"位置参数在关键字参数之后"的错误
            if "positional argument follows keyword argument" in result.stderr:
                print(f"🔄 检测到参数顺序错误，尝试重新生成代码...")
                try:
                    # 重新生成代码，使用更强的提示
                    if AI_PROVIDER == "anthropic":
                        retry_prompt = f"""你是一个数学/物理概念可视化专家。请为"{request.concept}"生成一个 Manim 动画代码。

⚠️ 特别重要：你之前生成的代码有语法错误 "positional argument follows keyword argument"。

这意味着在某个函数调用中，位置参数出现在关键字参数之后，这在 Python 中是不允许的。

例如：
- ❌ 错误：func(x=1, y)  # 位置参数 y 在关键字参数 x=1 之后
- ✅ 正确：func(y, x=1)  # 位置参数 y 在关键字参数 x=1 之前
- ✅ 正确：func(x=1, y=2)  # 全部使用关键字参数

请仔细检查每一个函数调用，确保：
1. 所有位置参数都在关键字参数之前
2. 或者全部使用关键字参数

请重新生成代码，确保没有这个语法错误。代码必须以 `from manim import *` 开头。"""

                        message = anthropic_client.messages.create(
                            model="claude-sonnet-4-20250514",
                            max_tokens=4000,
                            temperature=0.1,
                            messages=[{"role": "user", "content": retry_prompt}]
                        )
                        manim_code = message.content[0].text
                    elif AI_PROVIDER == "glm":
                        retry_prompt = f"""你是一个数学/物理概念可视化专家。请为"{request.concept}"生成一个 Manim 动画代码。

⚠️ 特别重要：你之前生成的代码有语法错误 "positional argument follows keyword argument"。

请仔细检查每一个函数调用，确保位置参数在关键字参数之前！

例如：
- ❌ 错误：func(x=1, y)
- ✅ 正确：func(y, x=1)

请重新生成代码。"""

                        response = glm_client.chat.completions.create(
                            model="glm-4-plus",
                            messages=[{"role": "user", "content": retry_prompt}],
                            temperature=0.1,
                            max_tokens=3000
                        )
                        manim_code = response.choices[0].message.content

                    # 清理代码
                    if "```python" in manim_code:
                        manim_code = manim_code.split("```python")[1].split("```")[0].strip()
                    elif "```" in manim_code:
                        manim_code = manim_code.split("```")[1].split("```")[0].strip()

                    # 保存新代码到临时文件
                    with open(temp_file, 'w') as f:
                        f.write(manim_code)

                    # 重新渲染
                    scene_name = extract_scene_class_name(manim_code)
                    cmd = [
                        "python3", "-m", "manim",
                        quality_flag,
                        temp_file,
                        scene_name,
                        "-o", output_name
                    ]

                    result = subprocess.run(
                        cmd,
                        capture_output=True,
                        text=True,
                        timeout=120
                    )

                    if result.returncode != 0:
                        print(f"⚠️  重新渲染也失败")
                        return AnimationResponse(
                            success=False,
                            message="Manim 渲染失败（重试后仍失败）",
                            code=manim_code,
                            concept_analysis=concept_analysis,
                            error=result.stderr
                        )

                    print(f"✅ 重新渲染成功")

                except Exception as retry_error:
                    print(f"⚠️  重试过程出错: {retry_error}")
                    return AnimationResponse(
                        success=False,
                        message="Manim 渲染失败",
                        code=manim_code,
                        concept_analysis=concept_analysis,
                        error=f"原始错误: {result.stderr}\n\n重试错误: {str(retry_error)}"
                    )
            else:
                return AnimationResponse(
                    success=False,
                    message="Manim 渲染失败",
                    code=manim_code,
                    concept_analysis=concept_analysis,
                    error=result.stderr
                )

        # 5. 查找生成的视频（Manim 默认输出到 media/videos/）
        media_root = Path("media")
        video_files = list(media_root.rglob(f"{output_name}.mp4"))
        if not video_files:
            # 尝试查找任何最近生成的 mp4 文件
            all_videos = sorted(media_root.rglob("*.mp4"), key=lambda p: p.stat().st_mtime, reverse=True)
            if all_videos:
                video_files = [all_videos[0]]
            else:
                # 列出实际生成的文件用于调试
                actual_files = list(media_root.rglob("*"))
                return AnimationResponse(
                    success=False,
                    message="未找到生成的视频文件",
                    code=manim_code,
                    concept_analysis=concept_analysis,
                    error=f"stderr: {result.stderr}\n\nstdout: {result.stdout}\n\n实际文件: {[str(f) for f in actual_files[:10]]}"
                )

        video_path = video_files[0]

        # 复制到 MEDIA_DIR 以便访问
        final_video_dir = MEDIA_DIR / "videos"
        final_video_dir.mkdir(exist_ok=True)
        final_video_path = final_video_dir / f"{output_name}.mp4"
        shutil.copy2(video_path, final_video_path)

        return AnimationResponse(
            success=True,
            message=f"成功生成 {request.concept} 动画",
            video_path=f"/video/videos/{output_name}.mp4",
            code=manim_code,
            concept_analysis=concept_analysis
        )

    except subprocess.TimeoutExpired:
        return AnimationResponse(
            success=False,
            message="渲染超时",
            code=manim_code,
            concept_analysis=concept_analysis,
            error="Manim 渲染超过 120 秒"
        )
    except Exception as e:
        return AnimationResponse(
            success=False,
            message="生成失败",
            code=manim_code,
            concept_analysis=concept_analysis,
            error=str(e)
        )
    finally:
        # 清理临时文件
        if os.path.exists(temp_file):
            os.remove(temp_file)

@app.get("/video/{path:path}")
async def get_video(path: str):
    """获取生成的视频文件"""
    video_path = MEDIA_DIR / path

    if not video_path.exists():
        raise HTTPException(status_code=404, detail="视频文件不存在")

    return FileResponse(
        video_path,
        media_type="video/mp4",
        filename=video_path.name
    )

@app.delete("/cleanup")
async def cleanup_media():
    """清理所有生成的媒体文件"""
    try:
        if MEDIA_DIR.exists():
            shutil.rmtree(MEDIA_DIR)
            MEDIA_DIR.mkdir(exist_ok=True)
        return {"success": True, "message": "媒体文件已清理"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    print("=" * 60)
    print("Concept2Animation Service - 概念到动画生成服务")
    print("=" * 60)
    print("基于 Math2Manim 项目核心思想")
    print()
    print("访问地址:")
    print("  - API 服务: http://localhost:8002")
    print("  - API 文档: http://localhost:8002/docs")
    print("  - 概念列表: http://localhost:8002/concepts")
    print("=" * 60)
    uvicorn.run(app, host="0.0.0.0", port=8002)
