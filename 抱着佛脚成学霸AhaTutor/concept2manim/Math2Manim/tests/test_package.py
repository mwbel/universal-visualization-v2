"""测试 Math2Manim 包的基本功能"""

import sys
import os

# 添加包路径
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from math2manim import ManimGenerator, KnowledgeTree, ConceptAnalyzer


def test_basic_import():
    """测试基本导入"""
    print("✓ 成功导入 math2manim 包")


def test_knowledge_tree():
    """测试知识树"""
    print("\n测试知识树...")
    tree = KnowledgeTree()
    root = tree.build_tree("勾股定理")

    assert root is not None
    assert root.concept == "勾股定理"
    print(f"✓ 知识树构建成功: {root.concept}")

    # 测试学习路径
    path = tree.get_learning_path()
    print(f"✓ 学习路径: {' → '.join(path)}")


def test_concept_analyzer():
    """测试概念分析器"""
    print("\n测试概念分析器...")
    analyzer = ConceptAnalyzer()
    analysis = analyzer.analyze("勾股定理")

    assert analysis is not None
    assert analysis.concept == "勾股定理"
    print(f"✓ 概念分析成功: {analysis.concept}")
    print(f"  类型: {analysis.type.value}")
    print(f"  难度: {analysis.difficulty.value}")


def test_code_generator():
    """测试代码生成器"""
    print("\n测试代码生成器...")
    generator = ManimGenerator()
    result = generator.generate_code_only("勾股定理")

    assert result is not None
    assert result.code is not None
    assert len(result.code) > 0
    print(f"✓ 代码生成成功: {len(result.code)} 字符")
    print(f"  场景名: {result.scene_name}")


def test_full_pipeline():
    """测试完整流程"""
    print("\n测试完整流程...")
    generator = ManimGenerator()
    result = generator.generate("勾股定理", build_tree=True)

    assert result["success"] is True
    assert result["code"] is not None
    assert result["analysis"] is not None
    print(f"✓ 完整流程测试成功")
    print(f"  概念: {result['concept']}")
    print(f"  学习路径: {' → '.join(result['learning_path'])}")


if __name__ == "__main__":
    print("=" * 60)
    print("Math2Manim 包测试")
    print("=" * 60)

    try:
        test_basic_import()
        test_knowledge_tree()
        test_concept_analyzer()
        test_code_generator()
        test_full_pipeline()

        print("\n" + "=" * 60)
        print("✓ 所有测试通过！")
        print("=" * 60)

    except Exception as e:
        print(f"\n✗ 测试失败: {e}")
        import traceback
        traceback.print_exc()
