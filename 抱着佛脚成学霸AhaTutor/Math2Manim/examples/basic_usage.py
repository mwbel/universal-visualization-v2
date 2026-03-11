"""
Math2Manim 使用示例

演示如何使用 Math2Manim 库生成动画
"""

from math2manim import ManimGenerator, KnowledgeTree, ConceptAnalyzer


def example_1_basic_generation():
    """示例 1: 基础代码生成"""
    print("=" * 60)
    print("示例 1: 基础代码生成")
    print("=" * 60)

    generator = ManimGenerator()
    result = generator.generate("勾股定理")

    print(f"\n概念: {result['concept']}")
    print(f"场景名: {result['scene_name']}")
    print(f"\n生成的代码:\n{result['code'][:500]}...")


def example_2_knowledge_tree():
    """示例 2: 构建知识树"""
    print("\n" + "=" * 60)
    print("示例 2: 构建知识树")
    print("=" * 60)

    tree = KnowledgeTree()
    root = tree.build_tree("导数")

    print("\n知识树结构:")
    print(tree.visualize())

    print("\n学习路径:")
    path = tree.get_learning_path()
    print(" → ".join(path))


def example_3_concept_analysis():
    """示例 3: 概念分析"""
    print("\n" + "=" * 60)
    print("示例 3: 概念分析")
    print("=" * 60)

    analyzer = ConceptAnalyzer()
    analysis = analyzer.analyze("正弦函数")

    print(f"\n概念: {analysis.concept}")
    print(f"类型: {analysis.type.value}")
    print(f"难度: {analysis.difficulty.value}")
    print(f"关键词: {', '.join(analysis.keywords)}")
    print(f"公式: {', '.join(analysis.formulas)}")
    print(f"前置知识: {', '.join(analysis.prerequisites)}")


def example_4_full_pipeline():
    """示例 4: 完整流程"""
    print("\n" + "=" * 60)
    print("示例 4: 完整流程（包含知识树）")
    print("=" * 60)

    generator = ManimGenerator()

    result = generator.generate(
        concept="勾股定理",
        style="educational",
        quality="m",
        build_tree=True
    )

    print(f"\n概念: {result['concept']}")
    print(f"\n分析结果:")
    print(f"  类型: {result['analysis']['type']}")
    print(f"  难度: {result['analysis']['difficulty']}")
    print(f"  关键词: {', '.join(result['analysis']['keywords'])}")

    if result['learning_path']:
        print(f"\n学习路径:")
        print("  " + " → ".join(result['learning_path']))

    print(f"\n代码已生成 ({len(result['code'])} 字符)")


def example_5_multiple_concepts():
    """示例 5: 批量生成"""
    print("\n" + "=" * 60)
    print("示例 5: 批量生成多个概念")
    print("=" * 60)

    concepts = ["勾股定理", "正弦函数", "导数"]
    generator = ManimGenerator()

    for concept in concepts:
        result = generator.generate_code_only(concept)
        print(f"\n✓ {concept}: {result.scene_name} ({len(result.code)} 字符)")


def example_6_save_to_file():
    """示例 6: 保存到文件"""
    print("\n" + "=" * 60)
    print("示例 6: 保存代码到文件")
    print("=" * 60)

    generator = ManimGenerator()
    result = generator.generate("勾股定理")

    filename = "pythagorean_theorem.py"
    with open(filename, "w", encoding="utf-8") as f:
        f.write(result["code"])

    print(f"\n✓ 代码已保存到: {filename}")
    print(f"  运行命令: manim -pql {filename} {result['scene_name']}")


if __name__ == "__main__":
    # 运行所有示例
    example_1_basic_generation()
    example_2_knowledge_tree()
    example_3_concept_analysis()
    example_4_full_pipeline()
    example_5_multiple_concepts()
    example_6_save_to_file()

    print("\n" + "=" * 60)
    print("所有示例运行完成！")
    print("=" * 60)
