#!/usr/bin/env python3
"""
快速演示 Math2Manim 包的功能
"""

from math2manim import ManimGenerator, KnowledgeTree

print("=" * 70)
print("Math2Manim 独立包 - 快速演示")
print("=" * 70)

# 1. 生成动画代码
print("\n1️⃣ 生成勾股定理动画代码:")
generator = ManimGenerator()
result = generator.generate("勾股定理", build_tree=True)

print(f"   ✓ 概念: {result['concept']}")
print(f"   ✓ 场景名: {result['scene_name']}")
print(f"   ✓ 代码长度: {len(result['code'])} 字符")
print(f"   ✓ 学习路径: {' → '.join(result['learning_path'])}")

# 2. 构建知识树
print("\n2️⃣ 构建导数的知识树:")
tree = KnowledgeTree()
root = tree.build_tree("导数")
print(tree.visualize())

# 3. 保存代码
print("3️⃣ 保存代码到文件:")
with open("demo_output.py", "w", encoding="utf-8") as f:
    f.write(result["code"])
print(f"   ✓ 已保存到: demo_output.py")
print(f"   ✓ 运行命令: manim -pql demo_output.py {result['scene_name']}")

print("\n" + "=" * 70)
print("✅ Math2Manim 包运行正常！")
print("=" * 70)
print("\n📖 查看完整文档: README_PACKAGE.md")
print("📦 集成示例: examples/integration_examples.py")
print("🧪 运行测试: python3 tests/test_package.py")
