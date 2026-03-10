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

app = FastAPI(
    title="Concept2Animation Service",
    description="将数学/物理概念自动转换为 Manim 动画",
    version="1.0.0"
)

# 配置
MEDIA_DIR = Path("./media")
MEDIA_DIR.mkdir(exist_ok=True)

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
    "积分": {
        "keywords": ["integral", "面积", "累积"],
        "prerequisites": ["导数", "函数", "极限"],
        "template": "integral"
    }
}

def generate_manim_code_with_ai(concept: str, style: str = "educational") -> str:
    """
    使用 AI 生成 Manim 代码
    这里使用模板，实际项目中可以调用 Claude/GPT API
    """

    # 检查是否有预定义模板
    if concept in CONCEPT_TEMPLATES:
        template_name = CONCEPT_TEMPLATES[concept]["template"]
        return get_template_code(template_name, style)

    # 默认生成简单动画
    return generate_default_animation(concept)

def get_template_code(template_name: str, style: str) -> str:
    """获取预定义模板代码"""

    if template_name == "pythagorean_theorem":
        return """
from manim import *

class PythagoreanTheorem(Scene):
    def construct(self):
        # 标题
        title = Text("勾股定理", font_size=48, color=BLUE, weight=BOLD)
        subtitle = MathTex("a^2 + b^2 = c^2", font_size=36)
        subtitle.next_to(title, DOWN)

        self.play(Write(title))
        self.play(Write(subtitle))
        self.wait(1)

        # 移到顶部
        title_group = VGroup(title, subtitle)
        self.play(title_group.animate.scale(0.6).to_edge(UP))
        self.wait(0.5)

        # 创建直角三角形 (3-4-5)
        A = np.array([-2, -1, 0])
        B = np.array([1, -1, 0])
        C = np.array([1, 2, 0])

        triangle = Polygon(A, B, C, color=WHITE, stroke_width=3)

        self.play(Create(triangle), run_time=1.5)
        self.wait(0.5)

        # 标注边长
        a_label = MathTex("a=3", color=YELLOW, font_size=32)
        a_label.next_to((A + B) / 2, DOWN)

        b_label = MathTex("b=4", color=GREEN, font_size=32)
        b_label.next_to((B + C) / 2, RIGHT)

        c_label = MathTex("c=5", color=RED, font_size=32)
        c_label.next_to((A + C) / 2, LEFT)

        self.play(Write(a_label), Write(b_label), Write(c_label))
        self.wait(1)

        # 创建三个正方形，分别在三条边上
        # 正方形 a (底边)
        square_a = Square(side_length=1.5, color=YELLOW, fill_opacity=0.4, stroke_width=2)
        square_a.next_to(triangle, DOWN, buff=0).shift(LEFT * 0.5)
        a_area = MathTex("a^2=9", color=YELLOW, font_size=28)
        a_area.move_to(square_a.get_center())

        # 正方形 b (右边)
        square_b = Square(side_length=2, color=GREEN, fill_opacity=0.4, stroke_width=2)
        square_b.next_to(triangle, RIGHT, buff=0).shift(UP * 0.5)
        b_area = MathTex("b^2=16", color=GREEN, font_size=28)
        b_area.move_to(square_b.get_center())

        # 正方形 c (斜边)
        square_c = Square(side_length=2.5, color=RED, fill_opacity=0.4, stroke_width=2)
        square_c.rotate(np.arctan2(3, 3))
        square_c.next_to(triangle, LEFT, buff=0).shift(UP * 1)
        c_area = MathTex("c^2=25", color=RED, font_size=28)
        c_area.move_to(square_c.get_center())

        # 依次显示三个正方形
        self.play(Create(square_a), Write(a_area), run_time=1.5)
        self.wait(0.5)
        self.play(Create(square_b), Write(b_area), run_time=1.5)
        self.wait(0.5)
        self.play(Create(square_c), Write(c_area), run_time=1.5)
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

    elif template_name == "sine_function":
        return """
from manim import *

class SineFunction(Scene):
    def construct(self):
        # 标题
        title = Text("正弦函数", font_size=48, color=BLUE, weight=BOLD)
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
        title = Text("{safe_concept}", font_size=56, color=BLUE, weight=BOLD)
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

        # 确定场景名称
        scene_name = "PythagoreanTheorem" if "勾股定理" in request.concept else \
                     "SineFunction" if "正弦" in request.concept else \
                     "ConceptAnimation"

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
