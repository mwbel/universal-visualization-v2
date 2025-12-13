#!/usr/bin/env python3
"""
检查迁移状态
"""

from database import SessionLocal
from models.visualization_models import VisualizationTemplate, KeywordIndex

def check_migration_status():
    """检查迁移后的数据库状态"""
    db = SessionLocal()
    try:
        print("=== 检查迁移状态 ===")

        # 检查模板
        templates = db.query(VisualizationTemplate).filter_by(is_system_template=True).all()
        print(f"\n系统模板数量: {len(templates)}")
        for template in templates:
            print(f"  - {template.name} ({template.subject}) - {template.category}")

        # 检查关键词
        keywords = db.query(KeywordIndex).all()
        print(f"\n关键词数量: {len(keywords)}")
        for keyword in keywords:
            print(f"  - {keyword.keyword}: {keyword.usage_frequency}次 ({keyword.subject})")

    finally:
        db.close()

if __name__ == "__main__":
    check_migration_status()