"""
快速测试数据库查询功能
"""
from concept_database import ConceptDatabase

def test_queries():
    with ConceptDatabase() as db:
        print("=" * 70)
        print("高等数学概念数据库 - 快速测试")
        print("=" * 70)
        
        # 1. 统计信息
        stats = db.get_statistics()
        print(f"\n📊 数据库统计:")
        print(f"   总概念数: {stats['total_concepts']}")
        print(f"   总关系数: {stats['total_relations']}")
        
        # 2. 搜索测试
        print(f"\n🔍 搜索测试:")
        keywords = ["极限", "导数", "积分", "连续"]
        for keyword in keywords:
            results = db.search_concepts(keyword)
            print(f"   '{keyword}': 找到 {len(results)} 个概念")
        
        # 3. 章节概念
        print(f"\n📚 章节概念:")
        for chapter in ["第2章", "第3章", "第5章"]:
            concepts = db.get_chapter_concepts(chapter)
            print(f"   {chapter}: {len(concepts)} 个概念")
        
        # 4. 查看具体概念
        print(f"\n📖 概念详情示例:")
        concept_names = [
            "设函数 $y = f$ 在点 $x_0$ 的某一邻域内有意义, 若极限",
            "单调有界数列必有极限"
        ]
        
        for name in concept_names:
            concept = db.get_concept(name)
            if concept:
                print(f"\n   概念: {concept['name'][:50]}...")
                print(f"   章节: {concept['chapter']} - {concept['section']}")
                print(f"   类型: {concept['type']}")
                if concept['latex_formulas']:
                    import json
                    formulas = json.loads(concept['latex_formulas'])
                    print(f"   公式数: {len(formulas)}")
        
        print("\n" + "=" * 70)
        print("✅ 测试完成!")
        print("=" * 70)

if __name__ == "__main__":
    test_queries()
