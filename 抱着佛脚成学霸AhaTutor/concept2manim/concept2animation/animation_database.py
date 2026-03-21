"""
动画数据库 - 存储已生成的概念动画
"""
import sqlite3
import json
from pathlib import Path
from datetime import datetime
from typing import Optional, List, Dict

class AnimationDatabase:
    def __init__(self, db_path: str = "animations.db"):
        self.db_path = db_path
        self.init_database()

    def init_database(self):
        """初始化数据库表"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()

        # 创建动画表
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS animations (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                concept TEXT NOT NULL,
                video_path TEXT NOT NULL,
                code TEXT,
                quality TEXT,
                style TEXT,
                ai_provider TEXT,
                scene_name TEXT,
                duration REAL,
                file_size INTEGER,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                category TEXT,
                chapter TEXT,
                tags TEXT,
                status TEXT DEFAULT 'success'
            )
        """)

        # 创建索引
        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_concept ON animations(concept)
        """)
        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_category ON animations(category)
        """)
        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_chapter ON animations(chapter)
        """)

        conn.commit()
        conn.close()
        print(f"✅ 数据库初始化完成: {self.db_path}")

    def add_animation(self, concept: str, video_path: str, code: str = None,
                     quality: str = "m", style: str = "educational",
                     ai_provider: str = "claude", scene_name: str = None,
                     category: str = None, chapter: str = None, tags: List[str] = None) -> int:
        """添加动画记录"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()

        # 获取视频文件信息
        video_file = Path(video_path)
        file_size = video_file.stat().st_size if video_file.exists() else 0

        # 转换标签为 JSON
        tags_json = json.dumps(tags, ensure_ascii=False) if tags else None

        cursor.execute("""
            INSERT INTO animations
            (concept, video_path, code, quality, style, ai_provider, scene_name,
             file_size, category, chapter, tags)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (concept, video_path, code, quality, style, ai_provider, scene_name,
              file_size, category, chapter, tags_json))

        animation_id = cursor.lastrowid
        conn.commit()
        conn.close()

        print(f"✅ 已添加动画: {concept} (ID: {animation_id})")
        return animation_id

    def get_animation(self, concept: str) -> Optional[Dict]:
        """获取指定概念的动画"""
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()

        cursor.execute("""
            SELECT * FROM animations WHERE concept = ? ORDER BY created_at DESC LIMIT 1
        """, (concept,))

        row = cursor.fetchone()
        conn.close()

        if row:
            result = dict(row)
            if result['tags']:
                result['tags'] = json.loads(result['tags'])
            return result
        return None

    def concept_exists(self, concept: str) -> bool:
        """检查概念是否已生成"""
        return self.get_animation(concept) is not None

    def get_all_animations(self, category: str = None, chapter: str = None) -> List[Dict]:
        """获取所有动画"""
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()

        query = "SELECT * FROM animations WHERE 1=1"
        params = []

        if category:
            query += " AND category = ?"
            params.append(category)

        if chapter:
            query += " AND chapter = ?"
            params.append(chapter)

        query += " ORDER BY created_at DESC"

        cursor.execute(query, params)
        rows = cursor.fetchall()
        conn.close()

        results = []
        for row in rows:
            result = dict(row)
            if result['tags']:
                result['tags'] = json.loads(result['tags'])
            results.append(result)

        return results

    def get_statistics(self) -> Dict:
        """获取统计信息"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()

        # 总数
        cursor.execute("SELECT COUNT(*) FROM animations")
        total = cursor.fetchone()[0]

        # 按分类统计
        cursor.execute("""
            SELECT category, COUNT(*) as count
            FROM animations
            WHERE category IS NOT NULL
            GROUP BY category
        """)
        by_category = dict(cursor.fetchall())

        # 按章节统计
        cursor.execute("""
            SELECT chapter, COUNT(*) as count
            FROM animations
            WHERE chapter IS NOT NULL
            GROUP BY chapter
        """)
        by_chapter = dict(cursor.fetchall())

        conn.close()

        return {
            "total": total,
            "by_category": by_category,
            "by_chapter": by_chapter
        }

if __name__ == "__main__":
    # 测试数据库
    db = AnimationDatabase()
    stats = db.get_statistics()
    print(f"\n数据库统计:")
    print(f"总动画数: {stats['total']}")
    print(f"按分类: {stats['by_category']}")
    print(f"按章节: {stats['by_chapter']}")
