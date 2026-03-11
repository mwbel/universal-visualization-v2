"""
集成示例 - 将 Math2Manim 集成到现有项目

演示如何在不同场景下使用 Math2Manim
"""

# ============================================================
# 示例 1: 集成到 FastAPI 服务
# ============================================================

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from math2manim import ManimGenerator

app = FastAPI(title="Math2Manim API")
generator = ManimGenerator()


class GenerateRequest(BaseModel):
    concept: str
    style: str = "educational"
    quality: str = "m"
    build_tree: bool = False


@app.post("/api/generate")
async def generate_animation(request: GenerateRequest):
    """生成动画 API"""
    try:
        result = generator.generate(
            concept=request.concept,
            style=request.style,
            quality=request.quality,
            build_tree=request.build_tree
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/concepts")
async def list_concepts():
    """列出支持的概念"""
    return {
        "builtin": ["勾股定理", "正弦函数", "导数", "积分"],
        "ai_supported": True
    }


# ============================================================
# 示例 2: 集成到教育平台
# ============================================================

class EducationPlatform:
    """教育平台集成示例"""

    def __init__(self):
        self.generator = ManimGenerator()
        self.cache = {}  # 简单的缓存

    def get_animation_for_lesson(self, lesson_id: str, concept: str):
        """为课程生成动画"""
        cache_key = f"{lesson_id}:{concept}"

        # 检查缓存
        if cache_key in self.cache:
            return self.cache[cache_key]

        # 生成动画
        result = self.generator.generate(
            concept=concept,
            style="educational",
            build_tree=True
        )

        # 保存到缓存
        self.cache[cache_key] = result
        return result

    def get_learning_path(self, concept: str):
        """获取学习路径"""
        result = self.generator.generate(concept, build_tree=True)
        return result.get("learning_path", [])


# ============================================================
# 示例 3: 批量处理
# ============================================================

def batch_generate_animations(concepts: list, output_dir: str = "./output"):
    """批量生成动画"""
    import os
    from math2manim import ManimGenerator

    os.makedirs(output_dir, exist_ok=True)
    generator = ManimGenerator()

    results = []
    for concept in concepts:
        print(f"正在生成: {concept}...")

        result = generator.generate(concept)

        # 保存代码
        filename = f"{concept.replace(' ', '_')}.py"
        filepath = os.path.join(output_dir, filename)

        with open(filepath, "w", encoding="utf-8") as f:
            f.write(result["code"])

        results.append({
            "concept": concept,
            "file": filepath,
            "scene_name": result["scene_name"]
        })

        print(f"  ✓ 已保存到: {filepath}")

    return results


# ============================================================
# 示例 4: 与现有 Manim 项目集成
# ============================================================

class ManimProjectIntegration:
    """与现有 Manim 项目集成"""

    def __init__(self, project_dir: str):
        self.project_dir = project_dir
        self.generator = ManimGenerator()

    def add_scene(self, concept: str, filename: str = None):
        """添加新场景到项目"""
        import os

        result = self.generator.generate(concept)

        if filename is None:
            filename = f"{concept.replace(' ', '_').lower()}.py"

        filepath = os.path.join(self.project_dir, filename)

        with open(filepath, "w", encoding="utf-8") as f:
            f.write(result["code"])

        return {
            "file": filepath,
            "scene_name": result["scene_name"],
            "command": f"manim -pql {filename} {result['scene_name']}"
        }


# ============================================================
# 示例 5: 命令行工具
# ============================================================

def cli_tool():
    """命令行工具示例"""
    import argparse
    from math2manim import ManimGenerator

    parser = argparse.ArgumentParser(description="Math2Manim CLI")
    parser.add_argument("concept", help="概念名称")
    parser.add_argument("-o", "--output", help="输出文件", default="output.py")
    parser.add_argument("-s", "--style", help="风格", default="educational")
    parser.add_argument("-q", "--quality", help="质量", default="m")
    parser.add_argument("--tree", action="store_true", help="显示知识树")

    args = parser.parse_args()

    generator = ManimGenerator()
    result = generator.generate(
        concept=args.concept,
        style=args.style,
        quality=args.quality,
        build_tree=args.tree
    )

    # 保存代码
    with open(args.output, "w", encoding="utf-8") as f:
        f.write(result["code"])

    print(f"✓ 代码已保存到: {args.output}")
    print(f"  场景名: {result['scene_name']}")

    if args.tree and result.get("learning_path"):
        print(f"\n学习路径:")
        print("  " + " → ".join(result["learning_path"]))


# ============================================================
# 使用示例
# ============================================================

if __name__ == "__main__":
    print("Math2Manim 集成示例\n")

    # 示例 1: FastAPI 服务
    print("1. FastAPI 服务已定义")
    print("   启动: uvicorn integration_examples:app --reload\n")

    # 示例 2: 教育平台
    print("2. 教育平台集成:")
    platform = EducationPlatform()
    path = platform.get_learning_path("勾股定理")
    print(f"   学习路径: {' → '.join(path)}\n")

    # 示例 3: 批量处理
    print("3. 批量生成:")
    concepts = ["勾股定理", "正弦函数"]
    results = batch_generate_animations(concepts, "./batch_output")
    print(f"   生成了 {len(results)} 个动画\n")

    # 示例 4: 项目集成
    print("4. Manim 项目集成:")
    # project = ManimProjectIntegration("./my_manim_project")
    # result = project.add_scene("导数")
    print("   (需要指定项目目录)\n")

    print("所有集成示例完成！")
