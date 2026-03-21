"""
数据库查询和使用示例
演示如何使用高等数学概念数据库
"""

from concept_database import ConceptDatabase, RelationType
from markdown_parser import MarkdownParser
import json


def example_1_search_concepts():
    """示例1: 搜索概念"""
    print("\n" + "="*60)
    print("示例1: 搜索概念")
    print("="*60)

    with ConceptDatabase() as db:
        # 搜索"导数"相关概念
        results = db.search_concepts("导数")
        print(f"\n找到 {len(results)} 个与'导数'相关的概念:")
        for i, concept in enumerate(results[:5], 1):
            print(f"{i}. {concept['name']} ({concept['chapter']} - {concept['type']})")
            if concept['latex_formulas']:
                formulas = json.loads(concept['latex_formulas'])
                if formulas:
                    print(f"   公式: {formulas[0][:50]}...")


def example_2_get_prerequisites():
    """示例2: 获取前置知识"""
    print("\n" + "="*60)
    print("示例2: 获取前置知识")
    print("="*60)

    with ConceptDatabase() as db:
        concept_name = "偏导数"
        prereqs = db.get_prerequisites(concept_name)

        print(f"\n学习'{concept_name}'需要先掌握:")
        for i, prereq in enumerate(prereqs, 1):
            print(f"{i}. {prereq['name']} (重要性: {prereq['strength']}/10)")


def example_3_get_chapter_concepts():
    """示例3: 获取章节所有概念"""
    print("\n" + "="*60)
    print("示例3: 获取章节概念")
    print("="*60)

    with ConceptDatabase() as db:
        chapter = "第3章"
        concepts = db.get_chapter_concepts(chapter)

        print(f"\n{chapter} 包含的概念:")
        for i, concept in enumerate(concepts[:10], 1):
            print(f"{i}. {concept['name']} ({concept['section']})")


def example_4_build_learning_path():
    """示例4: 构建学习路径"""
    print("\n" + "="*60)
    print("示例4: 构建学习路径")
    print("="*60)

    with ConceptDatabase() as db:
        target = "梯度"

        # 递归获取所有前置知识
        def get_all_prerequisites(concept_name, visited=None):
            if visited is None:
                visited = set()

            if concept_name in visited:
                return []

            visited.add(concept_name)
            prereqs = db.get_prerequisites(concept_name)

            path = []
            for prereq in prereqs:
                path.extend(get_all_prerequisites(prereq['name'], visited))
                path.append(prereq['name'])

            return path

        path = get_all_prerequisites(target)
        path.append(target)

        # 去重并保持顺序
        seen = set()
        unique_path = []
        for item in path:
            if item not in seen:
                seen.add(item)
                unique_path.append(item)

        print(f"\n学习'{target}'的推荐路径:")
        for i, concept in enumerate(unique_path, 1):
            print(f"{i}. {concept}")


def example_5_export_chapter_graph():
    """示例5: 导出章节知识图谱"""
    print("\n" + "="*60)
    print("示例5: 导出章节知识图谱")
    print("="*60)

    with ConceptDatabase() as db:
        # 导出完整知识图谱
        graph = db.export_knowledge_graph("knowledge_graph.json")

        print(f"\n知识图谱统计:")
        print(f"节点数: {graph['metadata']['total_nodes']}")
        print(f"边数: {graph['metadata']['total_edges']}")
        print(f"已保存到: knowledge_graph.json")


def example_6_concept_details():
    """示例6: 查看概念详情"""
    print("\n" + "="*60)
    print("示例6: 查看概念详情")
    print("="*60)

    with ConceptDatabase() as db:
        concept_name = "导数"
        concept = db.get_concept(concept_name)

        if concept:
            print(f"\n概念: {concept['name']}")
            print(f"类型: {concept['type']}")
            print(f"章节: {concept['chapter']} - {concept['section']}")
            print(f"难度: {concept['difficulty']}/5")

            if concept['keywords']:
                print(f"关键词: {', '.join(concept['keywords'])}")

            if concept['latex_formulas']:
                print(f"\n公式:")
                for i, formula in enumerate(concept['latex_formulas'][:3], 1):
                    print(f"  {i}. ${formula}$")

            if concept['description']:
                print(f"\n描述: {concept['description'][:200]}...")


def example_7_statistics():
    """示例7: 数据库统计"""
    print("\n" + "="*60)
    print("示例7: 数据库统计")
    print("="*60)

    with ConceptDatabase() as db:
        stats = db.get_statistics()

        print(f"\n总体统计:")
        print(f"总概念数: {stats['total_concepts']}")
        print(f"总关系数: {stats['total_relations']}")

        print(f"\n按章节分布:")
        for chapter, count in sorted(stats['by_chapter'].items())[:5]:
            print(f"  {chapter}: {count} 个概念")

        print(f"\n按类型分布:")
        for ctype, count in sorted(stats['by_type'].items()):
            print(f"  {ctype}: {count} 个")


def example_8_integration_with_manim():
    """示例8: 与 Manim 动画集成"""
    print("\n" + "="*60)
    print("示例8: 与 Manim 动画集成")
    print("="*60)

    with ConceptDatabase() as db:
        # 获取需要可视化的概念
        concept = db.get_concept("导数")

        if concept:
            print(f"\n为概念'{concept['name']}'生成动画:")
            print(f"1. 提取公式: {concept['latex_formulas'][0] if concept['latex_formulas'] else '无'}")
            print(f"2. 提取关键词: {concept['keywords']}")
            print(f"3. 调用 Manim 生成器...")
            print(f"4. 保存动画路径到数据库...")

            # 这里可以调用你的 Math2Manim 系统
            # from math2manim import generate_animation
            # animation_path = generate_animation(concept['name'])
            # db.add_visualization(concept['id'], animation_path)

            print(f"✅ 动画生成完成（示例）")


def main():
    """运行所有示例"""
    print("\n" + "🎓 高等数学概念数据库使用示例 🎓".center(60))

    examples = [
        example_1_search_concepts,
        example_2_get_prerequisites,
        example_3_get_chapter_concepts,
        example_4_build_learning_path,
        example_5_export_chapter_graph,
        example_6_concept_details,
        example_7_statistics,
        example_8_integration_with_manim,
    ]

    for example in examples:
        try:
            example()
        except Exception as e:
            print(f"\n❌ 示例执行出错: {e}")

    print("\n" + "="*60)
    print("所有示例执行完成!")
    print("="*60)


if __name__ == "__main__":
    main()
