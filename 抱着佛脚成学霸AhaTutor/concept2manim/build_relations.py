"""
自动构建概念关系
基于规则和关键词匹配建立概念之间的前置关系
"""

from concept_database import ConceptDatabase, RelationType
import re


def build_prerequisite_relations(db: ConceptDatabase):
    """构建前置知识关系"""

    # 定义前置关系规则（基于数学知识体系）
    prerequisite_rules = {
        # 极限相关
        "函数极限": ["数列极限", "函数"],
        "连续": ["函数极限", "极限"],
        "无穷小": ["极限"],

        # 导数相关
        "导数": ["极限", "函数"],
        "微分": ["导数"],
        "高阶导数": ["导数"],
        "偏导数": ["导数", "多元函数"],
        "方向导数": ["偏导数"],
        "梯度": ["偏导数", "向量"],

        # 积分相关
        "不定积分": ["导数"],
        "定积分": ["不定积分", "极限"],
        "重积分": ["定积分", "多元函数"],
        "二重积分": ["定积分"],
        "三重积分": ["二重积分"],

        # 多元函数
        "多元函数": ["函数"],
        "二元函数": ["函数"],

        # 微分方程
        "微分方程": ["导数", "积分"],
        "常微分方程": ["导数"],

        # 级数
        "级数": ["极限", "数列"],
        "幂级数": ["级数"],
        "傅里叶级数": ["级数", "三角函数"],
    }

    # 获取所有概念
    cursor = db.conn.cursor()
    cursor.execute("SELECT id, name, keywords FROM concepts")
    all_concepts = cursor.fetchall()

    relations_added = 0

    # 基于规则建立关系
    for concept_row in all_concepts:
        concept_id = concept_row[0]
        concept_name = concept_row[1]

        # 检查概念名称中是否包含规则中的关键词
        for key_concept, prerequisites in prerequisite_rules.items():
            if key_concept in concept_name:
                # 为该概念添加前置知识
                for prereq_name in prerequisites:
                    # 查找前置概念
                    cursor.execute(
                        "SELECT id FROM concepts WHERE name LIKE ?",
                        (f"%{prereq_name}%",)
                    )
                    prereq_rows = cursor.fetchall()

                    for prereq_row in prereq_rows:
                        prereq_id = prereq_row[0]

                        # 避免自引用
                        if prereq_id == concept_id:
                            continue

                        # 添加关系
                        try:
                            cursor.execute("""
                                INSERT INTO concept_relations
                                (source_concept_id, target_concept_id, relation_type, strength)
                                VALUES (?, ?, ?, ?)
                            """, (concept_id, prereq_id, RelationType.PREREQUISITE.value, 8))
                            relations_added += 1
                            print(f"✅ 添加关系: {concept_name[:30]}... -> {prereq_name}")
                        except:
                            pass  # 关系已存在

    db.conn.commit()
    return relations_added


def build_chapter_relations(db: ConceptDatabase):
    """基于章节顺序建立关系"""

    # 章节依赖关系
    chapter_dependencies = {
        "第3章": ["第2章"],  # 导数依赖极限
        "第4章": ["第3章"],  # 微分中值定理依赖导数
        "第5章": ["第3章", "第4章"],  # 积分依赖导数
        "第6章": ["第5章"],  # 定积分应用依赖积分
        "第8章": ["第3章", "第5章"],  # 多元函数微分依赖单元函数
        "第9章": ["第5章", "第8章"],  # 重积分依赖定积分和多元函数
    }

    cursor = db.conn.cursor()
    relations_added = 0

    for chapter, prereq_chapters in chapter_dependencies.items():
        # 获取当前章节的概念
        cursor.execute(
            "SELECT id, name FROM concepts WHERE chapter = ? AND type = 'definition'",
            (chapter,)
        )
        current_concepts = cursor.fetchall()

        # 获取前置章节的基础概念
        for prereq_chapter in prereq_chapters:
            cursor.execute(
                "SELECT id, name FROM concepts WHERE chapter = ? AND type = 'definition' LIMIT 3",
                (prereq_chapter,)
            )
            prereq_concepts = cursor.fetchall()

            # 建立关系
            for current_concept in current_concepts[:2]:  # 只为前几个概念建立关系
                for prereq_concept in prereq_concepts[:1]:  # 只关联到最基础的概念
                    try:
                        cursor.execute("""
                            INSERT INTO concept_relations
                            (source_concept_id, target_concept_id, relation_type, strength)
                            VALUES (?, ?, ?, ?)
                        """, (current_concept[0], prereq_concept[0], RelationType.PREREQUISITE.value, 5))
                        relations_added += 1
                        print(f"✅ 章节关系: {current_concept[1][:30]}... -> {prereq_concept[1][:30]}...")
                    except:
                        pass

    db.conn.commit()
    return relations_added


def build_keyword_relations(db: ConceptDatabase):
    """基于关键词建立相关关系"""

    cursor = db.conn.cursor()
    cursor.execute("SELECT id, name, keywords FROM concepts WHERE keywords IS NOT NULL")
    concepts_with_keywords = cursor.fetchall()

    relations_added = 0

    for i, concept1 in enumerate(concepts_with_keywords):
        id1, name1, keywords1_json = concept1

        if not keywords1_json:
            continue

        import json
        keywords1 = json.loads(keywords1_json)

        # 与其他概念比较
        for concept2 in concepts_with_keywords[i+1:]:
            id2, name2, keywords2_json = concept2

            if not keywords2_json or id1 == id2:
                continue

            keywords2 = json.loads(keywords2_json)

            # 计算关键词重叠
            common_keywords = set(keywords1) & set(keywords2)

            if len(common_keywords) >= 2:  # 至少2个共同关键词
                try:
                    cursor.execute("""
                        INSERT INTO concept_relations
                        (source_concept_id, target_concept_id, relation_type, strength)
                        VALUES (?, ?, ?, ?)
                    """, (id1, id2, RelationType.RELATED.value, len(common_keywords)))
                    relations_added += 1
                    print(f"✅ 相关关系: {name1[:30]}... <-> {name2[:30]}... (共同关键词: {common_keywords})")
                except:
                    pass

    db.conn.commit()
    return relations_added


def main():
    print("=" * 70)
    print("开始构建概念关系")
    print("=" * 70)

    with ConceptDatabase() as db:
        print("\n📊 当前数据库状态:")
        stats = db.get_statistics()
        print(f"  概念数: {stats['total_concepts']}")
        print(f"  关系数: {stats['total_relations']}")

        print("\n🔗 步骤1: 基于规则建立前置关系...")
        count1 = build_prerequisite_relations(db)
        print(f"✅ 添加了 {count1} 个前置关系")

        print("\n🔗 步骤2: 基于章节建立关系...")
        count2 = build_chapter_relations(db)
        print(f"✅ 添加了 {count2} 个章节关系")

        print("\n🔗 步骤3: 基于关键词建立相关关系...")
        count3 = build_keyword_relations(db)
        print(f"✅ 添加了 {count3} 个相关关系")

        print("\n📊 更新后的数据库状态:")
        stats = db.get_statistics()
        print(f"  概念数: {stats['total_concepts']}")
        print(f"  关系数: {stats['total_relations']}")

        print("\n🌐 导出知识图谱...")
        db.export_knowledge_graph("knowledge_graph.json")

    print("\n" + "=" * 70)
    print("✅ 关系构建完成!")
    print("=" * 70)


if __name__ == "__main__":
    main()
