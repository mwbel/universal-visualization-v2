"""
数据库构建脚本
从 Markdown 文件解析概念并导入数据库
"""

import sys
from pathlib import Path
from typing import List, Dict
import json

from concept_database import ConceptDatabase, Concept, ConceptType, RelationType
from markdown_parser import MarkdownParser


class DatabaseBuilder:
    """数据库构建器"""

    def __init__(self, books_dir: str, db_path: str = "math_concepts.db"):
        self.books_dir = books_dir
        self.db = ConceptDatabase(db_path)
        self.parser = MarkdownParser(books_dir)

        # 概念类型映射
        self.type_mapping = {
            'definition': ConceptType.DEFINITION.value,
            'theorem': ConceptType.THEOREM.value,
            'formula': ConceptType.FORMULA.value,
            'property': ConceptType.PROPERTY.value,
            'example': ConceptType.EXAMPLE.value,
        }

        # 难度映射（根据章节）
        self.difficulty_mapping = {
            '第1章': 2,
            '第2章': 3,
            '第3章': 3,
            '第4章': 4,
            '第5章': 4,
            '第6章': 4,
            '第7章': 4,
            '第8章': 5,
            '第9章': 5,
            '第10章': 5,
            '第11章': 5,
            '第12章': 5,
            '第13章': 5,
        }

    def build(self):
        """构建完整数据库"""
        print("=" * 70)
        print("开始构建高等数学概念数据库")
        print("=" * 70)

        # 步骤1: 解析所有概念
        print("\n📖 步骤1: 解析 Markdown 文件...")
        parsed_concepts = self.parser.parse_all_chapters()
        print(f"✅ 解析完成，共找到 {len(parsed_concepts)} 个概念")

        # 步骤2: 导入概念到数据库
        print("\n💾 步骤2: 导入概念到数据库...")
        imported_count = self._import_concepts(parsed_concepts)
        print(f"✅ 成功导入 {imported_count} 个概念")

        # 步骤3: 建立概念关系
        print("\n🔗 步骤3: 建立概念关系...")
        relations_count = self._build_relations()
        print(f"✅ 成功建立 {relations_count} 个关系")

        # 步骤4: 生成统计报告
        print("\n📊 步骤4: 生成统计报告...")
        self._generate_report()

        # 步骤5: 导出知识图谱
        print("\n🌐 步骤5: 导出知识图谱...")
        self.db.export_knowledge_graph("knowledge_graph.json")

        print("\n" + "=" * 70)
        print("✅ 数据库构建完成!")
        print("=" * 70)

    def _import_concepts(self, parsed_concepts: List) -> int:
        """导入概念到数据库"""
        imported = 0

        for pc in parsed_concepts:
            # 跳过例题（太多了）
            if pc.type == 'example':
                continue

            # 创建概念对象
            concept = Concept(
                name=pc.name,
                type=self.type_mapping.get(pc.type, ConceptType.DEFINITION.value),
                chapter=pc.chapter,
                section=pc.section,
                difficulty=self.difficulty_mapping.get(pc.chapter, 3),
                description=pc.content[:500] if pc.content else None,  # 限制长度
                latex_formulas=pc.latex_formulas[:10] if pc.latex_formulas else None,  # 限制数量
                keywords=self._extract_keywords(pc.content)
            )

            # 添加到数据库
            concept_id = self.db.add_concept(concept)
            if concept_id:
                imported += 1

        return imported

    def _extract_keywords(self, text: str) -> List[str]:
        """从文本中提取关键词"""
        if not text:
            return []

        # 简单的关键词提取（可以改进）
        keywords = []

        # 数学关键词
        math_keywords = [
            '函数', '极限', '连续', '导数', '微分', '积分', '级数',
            '收敛', '发散', '单调', '有界', '周期', '对称',
            '曲线', '曲面', '切线', '法线', '梯度', '方向导数',
            '偏导数', '全微分', '重积分', '曲线积分', '曲面积分',
            '微分方程', '特征值', '特征向量', '矩阵', '行列式'
        ]

        for keyword in math_keywords:
            if keyword in text:
                keywords.append(keyword)

        return keywords[:5]  # 最多5个关键词

    def _build_relations(self) -> int:
        """建立概念之间的关系"""
        relations_count = 0

        # 预定义的关系（基于数学知识）
        predefined_relations = [
            # 极限相关
            ("连续", "极限", RelationType.PREREQUISITE, 9),
            ("导数", "极限", RelationType.PREREQUISITE, 10),
            ("定积分", "极限", RelationType.PREREQUISITE, 8),

            # 导数相关
            ("微分", "导数", RelationType.PREREQUISITE, 10),
            ("高阶导数", "导数", RelationType.PREREQUISITE, 9),
            ("偏导数", "导数", RelationType.PREREQUISITE, 10),
            ("方向导数", "偏导数", RelationType.PREREQUISITE, 9),
            ("梯度", "偏导数", RelationType.PREREQUISITE, 10),

            # 积分相关
            ("定积分", "不定积分", RelationType.PREREQUISITE, 8),
            ("重积分", "定积分", RelationType.PREREQUISITE, 9),
            ("曲线积分", "定积分", RelationType.PREREQUISITE, 8),
            ("曲面积分", "重积分", RelationType.PREREQUISITE, 8),

            # 级数相关
            ("幂级数", "级数", RelationType.PREREQUISITE, 9),
            ("傅里叶级数", "级数", RelationType.PREREQUISITE, 8),

            # 微分方程相关
            ("常微分方程", "导数", RelationType.PREREQUISITE, 9),
            ("偏微分方程", "偏导数", RelationType.PREREQUISITE, 9),
        ]

        for source, target, rel_type, strength in predefined_relations:
            if self.db.add_relation(source, target, rel_type, strength):
                relations_count += 1

        return relations_count

    def _generate_report(self):
        """生成统计报告"""
        stats = self.db.get_statistics()

        print(f"\n{'='*60}")
        print("数据库统计报告")
        print(f"{'='*60}")
        print(f"总概念数: {stats['total_concepts']}")
        print(f"总关系数: {stats['total_relations']}")

        print(f"\n按章节分布:")
        for chapter, count in sorted(stats['by_chapter'].items()):
            print(f"  {chapter}: {count} 个概念")

        print(f"\n按类型分布:")
        for ctype, count in sorted(stats['by_type'].items()):
            print(f"  {ctype}: {count} 个")

        # 保存报告到文件
        report_path = "database_report.json"
        with open(report_path, 'w', encoding='utf-8') as f:
            json.dump(stats, f, ensure_ascii=False, indent=2)
        print(f"\n📄 详细报告已保存到: {report_path}")

    def add_custom_concepts(self):
        """添加自定义的重要概念（补充解析遗漏的）"""
        custom_concepts = [
            Concept(
                name="数列",
                type=ConceptType.DEFINITION.value,
                chapter="第2章",
                section="2.1",
                difficulty=2,
                description="按照自然数顺序排列的一列数",
                latex_formulas=[r"x_1, x_2, \dots, x_n, \dots"],
                keywords=["序列", "通项", "收敛"]
            ),
            Concept(
                name="函数极限",
                type=ConceptType.DEFINITION.value,
                chapter="第2章",
                section="2.2",
                difficulty=3,
                description="当自变量趋于某个值时，函数值的趋近值",
                latex_formulas=[r"\lim_{x \to x_0} f(x) = A"],
                keywords=["趋近", "邻域", "ε-δ语言"]
            ),
            Concept(
                name="无穷小",
                type=ConceptType.DEFINITION.value,
                chapter="第2章",
                section="2.3",
                difficulty=3,
                description="以零为极限的变量",
                keywords=["极限", "零", "高阶", "同阶"]
            ),
        ]

        print("\n➕ 添加自定义概念...")
        for concept in custom_concepts:
            self.db.add_concept(concept)


def main():
    """主函数"""
    # 配置路径
    books_dir = "/Users/Min369/Documents/同步空间/Manju/Projects/共享/AlVisualization/抱着佛脚成学霸AhaTutor/concept2manim/books/高等数学"
    db_path = "math_concepts.db"

    # 检查目录是否存在
    if not Path(books_dir).exists():
        print(f"❌ 错误: 目录不存在: {books_dir}")
        sys.exit(1)

    # 创建构建器并执行
    builder = DatabaseBuilder(books_dir, db_path)

    try:
        builder.build()
        builder.add_custom_concepts()

        print("\n🎉 所有任务完成!")
        print(f"📁 数据库文件: {db_path}")
        print(f"📁 知识图谱: knowledge_graph.json")
        print(f"📁 统计报告: database_report.json")

    except Exception as e:
        print(f"\n❌ 构建过程中出错: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

    finally:
        builder.db.close()


if __name__ == "__main__":
    main()
