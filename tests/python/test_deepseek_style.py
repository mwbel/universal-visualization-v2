#!/usr/bin/env python3
"""
测试 DeepSeek 风格的动画生成
基于 CSDN 文章的方法论
"""

import sys
from pathlib import Path

# 添加项目根目录到路径
project_root = Path(__file__).parent
sys.path.insert(0, str(project_root))

from backend_v2.agents.deepseek_style_agent import DeepSeekStyleAgent

def test_rectangle_diagonal():
    """测试矩形对角线动画（文章中的示例）"""
    print("=" * 60)
    print("🎬 测试 DeepSeek 风格的动画生成")
    print("=" * 60)
    print()

    print("📝 测试场景：矩形对角线（勾股定理）")
    print()

    # 创建代理
    agent = DeepSeekStyleAgent()

    # 生成动画
    print("🤖 正在调用 GLM-4.6（模拟 DeepSeek-R1）...")
    print("   方法：LaTeX Anchoring")
    print("   公式：$a^2 + b^2 = c^2$")
    print()

    result = agent.generate_rectangle_diagonal()

    if result["success"]:
        print("✅ 生成成功！")
        print(f"   Tokens 使用: {result['tokens_used']}")
        print(f"   方法: {result['method']}")
        print()

        # 保存文件
        output_dir = Path("output/deepseek_style")
        scene_name = "RectangleDiagonal"

        print("💾 保存文件...")
        saved_files = agent.save_files(
            result["files"],
            output_dir,
            scene_name
        )

        print()
        print("📄 生成的文件:")
        for file_type, file_path in saved_files.items():
            print(f"   {file_type:10s}: {file_path}")

        print()
        print("📊 生成的内容预览:")
        print("-" * 60)

        # 显示 Python 代码
        if result["files"].get("python"):
            print("Python 代码:")
            print(result["files"]["python"][:500] + "..." if len(result["files"]["python"]) > 500 else result["files"]["python"])
            print()

        # 显示 LaTeX
        if result["files"].get("latex"):
            print("LaTeX 代码:")
            print(result["files"]["latex"][:300] + "..." if len(result["files"]["latex"]) > 300 else result["files"]["latex"])
            print()

        print()
        print("🎯 下一步：")
        print(f"   1. 查看生成的代码: {saved_files.get('python')}")
        print(f"   2. 渲染动画: manim -pql {saved_files.get('python')} RectangleDiagonal")
        print(f"   3. 查看笔记: {saved_files.get('markdown')}")

    else:
        print(f"❌ 生成失败: {result['error']}")

    print()
    print("=" * 60)

def test_sine_function():
    """测试正弦函数动画"""
    print("=" * 60)
    print("🎬 测试正弦函数动画")
    print("=" * 60)
    print()

    agent = DeepSeekStyleAgent()

    print("🤖 正在生成正弦函数动画...")
    print("   方法：LaTeX Anchoring")
    print("   公式：$\\sin\\alpha = \\frac{y}{r}$")
    print()

    result = agent.generate_sine_function()

    if result["success"]:
        print("✅ 生成成功！")
        print(f"   Tokens 使用: {result['tokens_used']}")

        # 保存文件
        output_dir = Path("output/deepseek_style")
        scene_name = "SineFunction"

        saved_files = agent.save_files(
            result["files"],
            output_dir,
            scene_name
        )

        print()
        print("📄 生成的文件:")
        for file_type, file_path in saved_files.items():
            print(f"   {file_type:10s}: {file_path}")
    else:
        print(f"❌ 生成失败: {result['error']}")

    print()
    print("=" * 60)

if __name__ == "__main__":
    # 测试矩形对角线（文章中的示例）
    test_rectangle_diagonal()

    print()
    print()

    # 测试正弦函数
    test_sine_function()
