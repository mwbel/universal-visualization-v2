#!/usr/bin/env python3
"""
简单的数据库操作类
专为数据库小白设计，所有复杂操作都封装好了
"""

import sqlite3
import json
from datetime import datetime, timedelta
import os

class SimpleVisualizationDatabase:
    """超级简单的可视化数据库操作类"""

    def __init__(self, db_path="data/visualization_cache.db"):
        self.db_path = db_path
        self.ensure_database_exists()

    def ensure_database_exists(self):
        """确保数据库存在"""
        if not os.path.exists(self.db_path):
            print("⚠️ 数据库不存在，正在创建...")
            self._create_tables()

    def _create_tables(self):
        """创建数据库表"""
        os.makedirs(os.path.dirname(self.db_path), exist_ok=True)
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()

        cursor.execute('''
            CREATE TABLE visualization_records (
                id TEXT PRIMARY KEY,
                prompt TEXT NOT NULL,
                keywords TEXT,
                subject TEXT,
                html_content TEXT,
                generation_source TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                expires_at TIMESTAMP,
                usage_count INTEGER DEFAULT 0
            )
        ''')

        cursor.execute('''
            CREATE TABLE keyword_index (
                keyword TEXT PRIMARY KEY,
                subject TEXT,
                usage_count INTEGER DEFAULT 1,
                last_used TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')

        conn.commit()
        conn.close()
        print("✅ 数据库创建完成！")

    def save_visualization(self, viz_id, prompt, keywords, subject, html_content, source="mock"):
        """保存可视化记录 - 超级简单！"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()

        # 设置30天后过期
        expires_at = datetime.now() + timedelta(days=30)

        cursor.execute('''
            INSERT OR REPLACE INTO visualization_records
            (id, prompt, keywords, subject, html_content, generation_source, expires_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ''', (viz_id, prompt, ",".join(keywords), subject, html_content, source, expires_at))

        conn.commit()
        conn.close()
        return True

    def search_by_keywords(self, keywords):
        """根据关键词搜索 - 返回匹配的结果"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()

        # 构建搜索条件
        keyword_conditions = []
        params = []

        for keyword in keywords:
            keyword_conditions.append("keywords LIKE ?")
            params.append(f"%{keyword}%")

        # 添加过期检查
        keyword_conditions.append("(expires_at IS NULL OR expires_at > ?)")
        params.append(datetime.now())

        where_clause = " OR ".join(keyword_conditions)
        query = f"SELECT * FROM visualization_records WHERE {where_clause} ORDER BY usage_count DESC LIMIT 10"

        cursor.execute(query, params)
        results = cursor.fetchall()

        conn.close()

        # 转换为字典格式
        formatted_results = []
        for row in results:
            formatted_results.append({
                'id': row[0],
                'prompt': row[1],
                'keywords': row[2].split(',') if row[2] else [],
                'subject': row[3],
                'html_content': row[4],
                'generation_source': row[5],
                'created_at': row[6],
                'usage_count': row[8] if len(row) > 8 else 0
            })

        return formatted_results

    def get_statistics(self):
        """获取数据库统计信息"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()

        # 总记录数
        cursor.execute("SELECT COUNT(*) FROM visualization_records")
        total_records = cursor.fetchone()[0]

        # 按学科统计
        cursor.execute("SELECT subject, COUNT(*) FROM visualization_records GROUP BY subject")
        subject_stats = cursor.fetchall()

        # 今日新增
        cursor.execute("""
            SELECT COUNT(*) FROM visualization_records
            WHERE DATE(created_at) = DATE('now')
        """)
        today_records = cursor.fetchone()[0]

        conn.close()

        return {
            'total_records': total_records,
            'today_records': today_records,
            'subject_stats': dict(subject_stats),
            'db_size_mb': os.path.getsize(self.db_path) / (1024 * 1024)
        }

    def is_cache_hit(self, prompt, keywords):
        """检查是否命中缓存"""
        results = self.search_by_keywords(keywords)
        return len(results) > 0, results[0] if results else None

    def delete_expired_records(self):
        """删除过期记录"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()

        cursor.execute("DELETE FROM visualization_records WHERE expires_at < ?", (datetime.now(),))
        deleted_count = cursor.rowcount

        conn.commit()
        conn.close()
        return deleted_count

# 使用示例（数据库小白专用）
if __name__ == "__main__":
    print("🧪 测试数据库操作...")

    # 创建数据库实例
    db = SimpleVisualizationDatabase()

    # 测试保存
    print("💾 测试保存数据...")
    db.save_visualization(
        viz_id="test_001",
        prompt="正弦波图像",
        keywords=["正弦波", "三角函数", "数学"],
        subject="mathematics",
        html_content="<html><body><h1>正弦波</h1></body></html>",
        source="mock"
    )

    # 测试搜索
    print("🔍 测试搜索数据...")
    results = db.search_by_keywords(["正弦波"])
    print(f"找到 {len(results)} 条记录")

    # 查看统计
    print("📊 数据库统计:")
    stats = db.get_statistics()
    for key, value in stats.items():
        print(f"  {key}: {value}")

    print("✅ 数据库测试完成！现在你可以开始使用了！")