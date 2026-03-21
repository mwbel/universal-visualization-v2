"""
数据库可视化工具 - 生成概念关系图
"""
from concept_database import ConceptDatabase
import json


def generate_concept_tree_text():
    """生成文本格式的概念树"""
    with ConceptDatabase() as db:
        stats = db.get_statistics()

        print("=" * 70)
        print("高等数学概念数据库 - 概念树")
        print("=" * 70)

        # 按章节组织
        for chapter in sorted(stats['by_chapter'].keys()):
            concepts = db.get_chapter_concepts(chapter)
            print(f"\n{chapter} ({len(concepts)} 个概念)")
            print("-" * 70)

            # 按类型分组
            by_type = {}
            for concept in concepts:
                ctype = concept['type']
                if ctype not in by_type:
                    by_type[ctype] = []
                by_type[ctype].append(concept)

            # 显示定义
            if 'definition' in by_type:
                print(f"\n  📘 定义 ({len(by_type['definition'])} 个):")
                for i, c in enumerate(by_type['definition'][:5], 1):
                    name = c['name'][:60] + "..." if len(c['name']) > 60 else c['name']
                    print(f"    {i}. {name}")
                if len(by_type['definition']) > 5:
                    print(f"    ... 还有 {len(by_type['definition']) - 5} 个")

            # 显示定理
            if 'theorem' in by_type:
                print(f"\n  📗 定理 ({len(by_type['theorem'])} 个):")
                for i, c in enumerate(by_type['theorem'][:5], 1):
                    name = c['name'][:60] + "..." if len(c['name']) > 60 else c['name']
                    print(f"    {i}. {name}")
                if len(by_type['theorem']) > 5:
                    print(f"    ... 还有 {len(by_type['theorem']) - 5} 个")


def generate_statistics_report():
    """生成详细统计报告"""
    with ConceptDatabase() as db:
        stats = db.get_statistics()

        print("\n" + "=" * 70)
        print("详细统计报告")
        print("=" * 70)

        print(f"\n📊 总体统计:")
        print(f"   总概念数: {stats['total_concepts']}")
        print(f"   总关系数: {stats['total_relations']}")

        print(f"\n📚 按章节分布:")
        total = sum(stats['by_chapter'].values())
        for chapter, count in sorted(stats['by_chapter'].items()):
            percentage = (count / total * 100) if total > 0 else 0
            bar = "█" * int(percentage / 2)
            print(f"   {chapter}: {count:3d} 个 {bar} {percentage:.1f}%")

        print(f"\n📖 按类型分布:")
        total = sum(stats['by_type'].values())
        for ctype, count in sorted(stats['by_type'].items()):
            percentage = (count / total * 100) if total > 0 else 0
            bar = "█" * int(percentage / 2)
            print(f"   {ctype:12s}: {count:3d} 个 {bar} {percentage:.1f}%")


def export_concept_list():
    """导出概念列表到文件"""
    with ConceptDatabase() as db:
        stats = db.get_statistics()

        output = []
        output.append("# 高等数学概念列表\n")
        output.append(f"总计: {stats['total_concepts']} 个概念\n\n")

        for chapter in sorted(stats['by_chapter'].keys()):
            concepts = db.get_chapter_concepts(chapter)
            output.append(f"## {chapter}\n\n")

            for i, concept in enumerate(concepts, 1):
                output.append(f"{i}. **{concept['name'][:80]}**\n")
                output.append(f"   - 类型: {concept['type']}\n")
                output.append(f"   - 小节: {concept['section']}\n")
                if concept['keywords']:
                    keywords = json.loads(concept['keywords']) if isinstance(concept['keywords'], str) else concept['keywords']
                    if keywords:
                        output.append(f"   - 关键词: {', '.join(keywords)}\n")
                output.append("\n")

        # 保存到文件
        with open("概念列表.md", "w", encoding="utf-8") as f:
            f.writelines(output)

        print(f"\n✅ 概念列表已导出到: 概念列表.md")


def show_search_examples():
    """展示搜索示例"""
    with ConceptDatabase() as db:
        print("\n" + "=" * 70)
        print("搜索功能演示")
        print("=" * 70)

        search_terms = [
            ("极限", "第2章"),
            ("导数", "第3章"),
            ("积分", "第5章"),
            ("连续", None),
        ]

        for term, chapter in search_terms:
            results = db.search_concepts(term, chapter)
            chapter_str = f" (限定在{chapter})" if chapter else ""
            print(f"\n🔍 搜索 '{term}'{chapter_str}:")
            print(f"   找到 {len(results)} 个相关概念")

            if results:
                print(f"   前3个结果:")
                for i, concept in enumerate(results[:3], 1):
                    name = concept['name'][:50] + "..." if len(concept['name']) > 50 else concept['name']
                    print(f"     {i}. {name}")
                    print(f"        [{concept['chapter']} - {concept['type']}]")


def main():
    """主函数"""
    print("\n" + "🎓 高等数学概念数据库 - 可视化工具 🎓".center(70))

    # 1. 生成概念树
    generate_concept_tree_text()

    # 2. 生成统计报告
    generate_statistics_report()

    # 3. 搜索演示
    show_search_examples()

    # 4. 导出概念列表
    export_concept_list()

    print("\n" + "=" * 70)
    print("✅ 所有可视化任务完成!")
    print("=" * 70)
    print("\n生成的文件:")
    print("  - 概念列表.md (Markdown 格式的完整概念列表)")
    print("  - knowledge_graph.json (知识图谱)")
    print("  - database_report.json (统计报告)")
    print("\n")


if __name__ == "__main__":
    main()
