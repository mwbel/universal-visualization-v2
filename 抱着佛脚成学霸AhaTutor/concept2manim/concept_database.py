"""
高等数学概念数据库
基于 books/高等数学 目录构建完整的概念知识库
"""

import sqlite3
import json
import re
from pathlib import Path
from typing import List, Dict, Optional, Tuple
from dataclasses import dataclass, asdict
from datetime import datetime
from enum import Enum


class ConceptType(Enum):
    """概念类型"""
    DEFINITION = "definition"  # 定义
    THEOREM = "theorem"  # 定理
    FORMULA = "formula"  # 公式
    METHOD = "method"  # 方法
    PROPERTY = "property"  # 性质
    EXAMPLE = "example"  # 例题


class RelationType(Enum):
    """关系类型"""
    PREREQUISITE = "prerequisite"  # 前置知识
    DERIVED = "derived"  # 派生关系
    RELATED = "related"  # 相关概念
    APPLICATION = "application"  # 应用


@dataclass
class Concept:
    """概念数据类"""
    name: str
    name_en: Optional[str] = None
    type: str = ConceptType.DEFINITION.value
    chapter: Optional[str] = None
    section: Optional[str] = None
    difficulty: int = 3  # 1-5
    description: Optional[str] = None
    latex_formulas: Optional[List[str]] = None
    keywords: Optional[List[str]] = None
    geometric_meaning: Optional[str] = None
    physical_meaning: Optional[str] = None
    id: Optional[int] = None
    created_at: Optional[str] = None


class ConceptDatabase:
    """高等数学概念数据库"""

    def __init__(self, db_path: str = "math_concepts.db"):
        self.db_path = db_path
        self.conn = None
        self.init_database()

    def init_database(self):
        """初始化数据库结构"""
        self.conn = sqlite3.connect(self.db_path)
        self.conn.row_factory = sqlite3.Row
        cursor = self.conn.cursor()

        # 概念表
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS concepts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL UNIQUE,
                name_en TEXT,
                type TEXT NOT NULL,
                chapter TEXT,
                section TEXT,
                difficulty INTEGER DEFAULT 3,
                description TEXT,
                latex_formulas TEXT,
                keywords TEXT,
                geometric_meaning TEXT,
                physical_meaning TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)

        # 概念关系表
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS concept_relations (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                source_concept_id INTEGER NOT NULL,
                target_concept_id INTEGER NOT NULL,
                relation_type TEXT NOT NULL,
                strength INTEGER DEFAULT 5,
                description TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (source_concept_id) REFERENCES concepts(id),
                FOREIGN KEY (target_concept_id) REFERENCES concepts(id),
                UNIQUE(source_concept_id, target_concept_id, relation_type)
            )
        """)

        # 示例表
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS examples (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                concept_id INTEGER NOT NULL,
                title TEXT,
                content TEXT NOT NULL,
                solution TEXT,
                difficulty INTEGER DEFAULT 3,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (concept_id) REFERENCES concepts(id)
            )
        """)

        # 可视化资源表
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS visualizations (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                concept_id INTEGER NOT NULL,
                animation_path TEXT,
                code TEXT,
                thumbnail TEXT,
                quality TEXT DEFAULT 'medium',
                duration REAL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (concept_id) REFERENCES concepts(id)
            )
        """)

        # 创建索引
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_concept_name ON concepts(name)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_concept_chapter ON concepts(chapter)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_concept_type ON concepts(type)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_relation_source ON concept_relations(source_concept_id)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_relation_target ON concept_relations(target_concept_id)")

        self.conn.commit()
        print(f"✅ 数据库初始化完成: {self.db_path}")

    def add_concept(self, concept: Concept) -> int:
        """添加概念"""
        cursor = self.conn.cursor()

        # 转换列表为JSON
        latex_formulas_json = json.dumps(concept.latex_formulas, ensure_ascii=False) if concept.latex_formulas else None
        keywords_json = json.dumps(concept.keywords, ensure_ascii=False) if concept.keywords else None

        try:
            cursor.execute("""
                INSERT INTO concepts
                (name, name_en, type, chapter, section, difficulty, description,
                 latex_formulas, keywords, geometric_meaning, physical_meaning)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                concept.name, concept.name_en, concept.type, concept.chapter,
                concept.section, concept.difficulty, concept.description,
                latex_formulas_json, keywords_json, concept.geometric_meaning,
                concept.physical_meaning
            ))

            concept_id = cursor.lastrowid
            self.conn.commit()
            print(f"✅ 已添加概念: {concept.name} (ID: {concept_id})")
            return concept_id

        except sqlite3.IntegrityError:
            print(f"⚠️  概念已存在: {concept.name}")
            # 返回已存在的概念ID
            cursor.execute("SELECT id FROM concepts WHERE name = ?", (concept.name,))
            return cursor.fetchone()[0]

    def add_relation(self, source_name: str, target_name: str,
                    relation_type: RelationType, strength: int = 5,
                    description: str = None) -> bool:
        """添加概念关系"""
        cursor = self.conn.cursor()

        # 获取概念ID
        cursor.execute("SELECT id FROM concepts WHERE name = ?", (source_name,))
        source_row = cursor.fetchone()
        cursor.execute("SELECT id FROM concepts WHERE name = ?", (target_name,))
        target_row = cursor.fetchone()

        if not source_row or not target_row:
            print(f"⚠️  概念不存在: {source_name} 或 {target_name}")
            return False

        source_id = source_row[0]
        target_id = target_row[0]

        try:
            cursor.execute("""
                INSERT INTO concept_relations
                (source_concept_id, target_concept_id, relation_type, strength, description)
                VALUES (?, ?, ?, ?, ?)
            """, (source_id, target_id, relation_type.value, strength, description))

            self.conn.commit()
            print(f"✅ 已添加关系: {source_name} -> {target_name} ({relation_type.value})")
            return True

        except sqlite3.IntegrityError:
            print(f"⚠️  关系已存在: {source_name} -> {target_name}")
            return False

    def get_concept(self, name: str) -> Optional[Dict]:
        """获取概念详情"""
        cursor = self.conn.cursor()
        cursor.execute("SELECT * FROM concepts WHERE name = ?", (name,))
        row = cursor.fetchone()

        if row:
            result = dict(row)
            # 解析JSON字段
            if result['latex_formulas']:
                result['latex_formulas'] = json.loads(result['latex_formulas'])
            if result['keywords']:
                result['keywords'] = json.loads(result['keywords'])
            return result
        return None

    def get_prerequisites(self, concept_name: str) -> List[Dict]:
        """获取前置知识"""
        cursor = self.conn.cursor()
        cursor.execute("""
            SELECT c.*, r.strength, r.description as relation_desc
            FROM concepts c
            JOIN concept_relations r ON c.id = r.target_concept_id
            JOIN concepts source ON source.id = r.source_concept_id
            WHERE source.name = ? AND r.relation_type = 'prerequisite'
            ORDER BY r.strength DESC
        """, (concept_name,))

        return [dict(row) for row in cursor.fetchall()]

    def get_derived_concepts(self, concept_name: str) -> List[Dict]:
        """获取派生概念"""
        cursor = self.conn.cursor()
        cursor.execute("""
            SELECT c.*, r.strength
            FROM concepts c
            JOIN concept_relations r ON c.id = r.source_concept_id
            JOIN concepts target ON target.id = r.target_concept_id
            WHERE target.name = ? AND r.relation_type = 'derived'
            ORDER BY r.strength DESC
        """, (concept_name,))

        return [dict(row) for row in cursor.fetchall()]

    def search_concepts(self, keyword: str, chapter: str = None) -> List[Dict]:
        """搜索概念"""
        cursor = self.conn.cursor()

        query = "SELECT * FROM concepts WHERE (name LIKE ? OR description LIKE ?)"
        params = [f"%{keyword}%", f"%{keyword}%"]

        if chapter:
            query += " AND chapter = ?"
            params.append(chapter)

        query += " ORDER BY difficulty ASC"

        cursor.execute(query, params)
        return [dict(row) for row in cursor.fetchall()]

    def get_chapter_concepts(self, chapter: str) -> List[Dict]:
        """获取章节所有概念"""
        cursor = self.conn.cursor()
        cursor.execute("""
            SELECT * FROM concepts
            WHERE chapter = ?
            ORDER BY section, id
        """, (chapter,))

        return [dict(row) for row in cursor.fetchall()]

    def get_statistics(self) -> Dict:
        """获取统计信息"""
        cursor = self.conn.cursor()

        # 总概念数
        cursor.execute("SELECT COUNT(*) FROM concepts")
        total_concepts = cursor.fetchone()[0]

        # 按章节统计
        cursor.execute("""
            SELECT chapter, COUNT(*) as count
            FROM concepts
            WHERE chapter IS NOT NULL
            GROUP BY chapter
            ORDER BY chapter
        """)
        by_chapter = {row[0]: row[1] for row in cursor.fetchall()}

        # 按类型统计
        cursor.execute("""
            SELECT type, COUNT(*) as count
            FROM concepts
            GROUP BY type
        """)
        by_type = {row[0]: row[1] for row in cursor.fetchall()}

        # 关系统计
        cursor.execute("SELECT COUNT(*) FROM concept_relations")
        total_relations = cursor.fetchone()[0]

        return {
            "total_concepts": total_concepts,
            "total_relations": total_relations,
            "by_chapter": by_chapter,
            "by_type": by_type
        }

    def export_knowledge_graph(self, output_path: str = "knowledge_graph.json"):
        """导出知识图谱为JSON"""
        cursor = self.conn.cursor()

        # 获取所有概念
        cursor.execute("SELECT id, name, type, chapter, difficulty FROM concepts")
        nodes = [
            {
                "id": row[0],
                "name": row[1],
                "type": row[2],
                "chapter": row[3],
                "difficulty": row[4]
            }
            for row in cursor.fetchall()
        ]

        # 获取所有关系
        cursor.execute("""
            SELECT source_concept_id, target_concept_id, relation_type, strength
            FROM concept_relations
        """)
        edges = [
            {
                "source": row[0],
                "target": row[1],
                "type": row[2],
                "strength": row[3]
            }
            for row in cursor.fetchall()
        ]

        graph = {
            "nodes": nodes,
            "edges": edges,
            "metadata": {
                "created_at": datetime.now().isoformat(),
                "total_nodes": len(nodes),
                "total_edges": len(edges)
            }
        }

        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(graph, f, ensure_ascii=False, indent=2)

        print(f"✅ 知识图谱已导出: {output_path}")
        return graph

    def close(self):
        """关闭数据库连接"""
        if self.conn:
            self.conn.close()

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.close()


if __name__ == "__main__":
    # 测试数据库
    with ConceptDatabase() as db:
        # 添加示例概念
        concept1 = Concept(
            name="极限",
            name_en="Limit",
            type=ConceptType.DEFINITION.value,
            chapter="第2章",
            section="2.1",
            difficulty=3,
            description="数列或函数在某点或无穷远处的趋近值",
            latex_formulas=[r"\lim_{n \to \infty} x_n = a"],
            keywords=["收敛", "发散", "无穷小"]
        )

        concept2 = Concept(
            name="导数",
            name_en="Derivative",
            type=ConceptType.DEFINITION.value,
            chapter="第3章",
            section="3.1",
            difficulty=4,
            description="函数在某点的瞬时变化率",
            latex_formulas=[r"f'(x) = \lim_{h \to 0} \frac{f(x+h) - f(x)}{h}"],
            keywords=["变化率", "切线", "斜率"]
        )

        db.add_concept(concept1)
        db.add_concept(concept2)

        # 添加关系
        db.add_relation("导数", "极限", RelationType.PREREQUISITE, strength=9)

        # 查询统计
        stats = db.get_statistics()
        print(f"\n📊 数据库统计:")
        print(f"总概念数: {stats['total_concepts']}")
        print(f"总关系数: {stats['total_relations']}")
        print(f"按章节: {stats['by_chapter']}")
