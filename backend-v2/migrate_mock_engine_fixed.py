#!/usr/bin/env python3
"""
MockEngine模板数据迁移脚本（修复版）
将现有的MockEngine策略数据导入到新的数据库系统中
"""

import sys
import os
import json
import hashlib
from datetime import datetime

# 添加项目路径
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database import SessionLocal, init_database
from models.visualization_models import VisualizationTemplate, KeywordIndex

def generate_template_id(name: str) -> str:
    """生成模板ID"""
    return hashlib.md5(f"template_{name}".encode()).hexdigest()[:16]

def get_existing_keywords(db):
    """获取现有关键词字典"""
    existing_keywords = {}
    keywords = db.query(KeywordIndex).all()
    for kw in keywords:
        existing_keywords[kw.keyword] = kw
    return existing_keywords

def get_existing_templates(db):
    """获取现有模板字典"""
    existing_templates = {}
    templates = db.query(VisualizationTemplate).all()
    for template in templates:
        existing_templates[template.id] = template
    return existing_templates

def extract_mock_engine_strategies():
    """提取MockEngine策略定义（简化版，只包含模板ID和基本信息）"""
    return {
        "math_function_graph": {
            "name": "函数图像生成器",
            "description": "根据数学函数表达式生成交互式函数图像，支持多种函数类型和参数调整",
            "category": "函数图像",
            "subject": "数学",
            "difficulty_level": "intermediate",
            "keywords": ["函数", "图像", "坐标", "参数", "图形", "数学", "可视化"],
            "template_content": "<!DOCTYPE html><html><head><title>函数图像生成器</title></head><body><h1>函数图像生成器</h1><p>这是一个示例内容，实际内容在完整版中</p></body></html>",
            "parameters_schema": {"type": "object", "properties": {"function": {"type": "string"}}, "required": ["function"]},
            "examples": [{"name": "二次函数", "parameters": {"function": "x^2"}}]
        },
        "physics_wave_simulation": {
            "name": "波动现象模拟器",
            "description": "模拟各种波动现象，包括机械波、电磁波等，支持波长、频率、振幅等参数调整",
            "category": "波动模拟",
            "subject": "物理",
            "difficulty_level": "intermediate",
            "keywords": ["波动", "频率", "波长", "振幅", "机械波", "电磁波", "物理"],
            "template_content": "<!DOCTYPE html><html><head><title>波动现象模拟器</title></head><body><h1>波动现象模拟器</h1><p>这是一个示例内容，实际内容在完整版中</p></body></html>",
            "parameters_schema": {"type": "object", "properties": {"frequency": {"type": "number"}, "wavelength": {"type": "number"}}, "required": []},
            "examples": [{"name": "标准正弦波", "parameters": {"frequency": 1, "wavelength": 2}}]
        },
        "chemistry_molecular_model": {
            "name": "分子结构3D模型",
            "description": "展示化学分子的三维结构，支持旋转、缩放和不同分子模型展示",
            "category": "分子结构",
            "subject": "化学",
            "difficulty_level": "advanced",
            "keywords": ["分子", "原子", "化学键", "3D模型", "结构", "化学"],
            "template_content": "<!DOCTYPE html><html><head><title>分子结构3D模型</title></head><body><h1>分子结构3D模型</h1><p>这是一个示例内容，实际内容在完整版中</p></body></html>",
            "parameters_schema": {"type": "object", "properties": {"molecule": {"type": "string"}}, "required": ["molecule"]},
            "examples": [{"name": "水分子", "parameters": {"molecule": "H2O"}}]
        },
        "astronomy_solar_system": {
            "name": "太阳系运行模拟",
            "description": "模拟太阳系行星运行轨迹，支持时间控制和行星轨道参数调整",
            "category": "天体运行",
            "subject": "天文",
            "difficulty_level": "intermediate",
            "keywords": ["太阳系", "行星", "轨道", "天文", "宇宙", "模拟"],
            "template_content": "<!DOCTYPE html><html><head><title>太阳系运行模拟</title></head><body><h1>太阳系运行模拟</h1><p>这是一个示例内容，实际内容在完整版中</p></body></html>",
            "parameters_schema": {"type": "object", "properties": {"timeSpeed": {"type": "number", "default": 1}}, "required": []},
            "examples": [{"name": "标准太阳系", "parameters": {"timeSpeed": 1}}]
        },
        "biology_cell_structure": {
            "name": "细胞结构图解",
            "description": "展示生物细胞的结构组成，包括植物细胞和动物细胞的对比",
            "category": "细胞结构",
            "subject": "生物",
            "difficulty_level": "intermediate",
            "keywords": ["细胞", "细胞器", "植物细胞", "动物细胞", "生物", "结构"],
            "template_content": "<!DOCTYPE html><html><head><title>细胞结构图解</title></head><body><h1>细胞结构图解</h1><p>这是一个示例内容，实际内容在完整版中</p></body></html>",
            "parameters_schema": {"type": "object", "properties": {"displayMode": {"type": "string", "default": "structure"}}, "required": []},
            "examples": [{"name": "基础结构", "parameters": {"displayMode": "structure"}}]
        }
    }

def migrate_mock_data_to_db():
    """将MockEngine数据迁移到数据库（修复版）"""

    # 确保数据库已初始化
    print("初始化数据库...")
    if not init_database():
        raise Exception("数据库初始化失败")

    print("提取策略数据...")
    try:
        # 提取策略数据
        strategies = extract_mock_engine_strategies()
        print("策略数据提取成功")
    except Exception as e:
        print(f"策略数据提取失败: {e}")
        import traceback
        traceback.print_exc()
        raise

    print(f"开始迁移 {len(strategies)} 个模板...")

    db = SessionLocal()
    try:
        # 获取现有数据
        existing_keywords = get_existing_keywords(db)
        existing_templates = get_existing_templates(db)

        templates_created = 0
        keywords_updated = 0

        # 迁移每个策略
        for strategy_key, strategy_data in strategies.items():
            template_id = generate_template_id(strategy_key)

            # 检查模板是否已存在
            if template_id in existing_templates:
                print(f"模板 {template_id} 已存在，跳过")
                continue

            # 创建模板记录
            template = VisualizationTemplate(
                id=template_id,
                name=strategy_data["name"],
                description=strategy_data["description"],
                category=strategy_data["category"],
                subject=strategy_data["subject"],
                difficulty_level=strategy_data["difficulty_level"],
                keywords=",".join(strategy_data["keywords"]),
                template_content=strategy_data["template_content"],
                parameters_schema=strategy_data["parameters_schema"],
                examples=strategy_data["examples"],
                is_system_template=True,
                is_active=True,
                usage_count=0
            )

            db.add(template)
            templates_created += 1
            print(f"已创建模板: {template.name} ({template.subject})")

            # 更新关键词索引
            for keyword in strategy_data["keywords"]:
                if keyword in existing_keywords:
                    # 更新现有关键词
                    existing_keyword = existing_keywords[keyword]
                    existing_keyword.usage_frequency += 1
                    existing_keyword.last_used = datetime.utcnow()
                    if not existing_keyword.subject:
                        existing_keyword.subject = strategy_data["subject"]
                    keywords_updated += 1
                else:
                    # 创建新关键词
                    new_keyword = KeywordIndex(
                        keyword=keyword,
                        subject=strategy_data["subject"],
                        usage_frequency=1
                    )
                    db.add(new_keyword)
                    existing_keywords[keyword] = new_keyword
                    keywords_updated += 1

        # 提交事务
        db.commit()
        print("MockEngine模板数据迁移完成!")

        # 显示统计信息
        template_count = db.query(VisualizationTemplate).filter_by(is_system_template=True).count()
        keyword_count = db.query(KeywordIndex).count()

        print(f"迁移统计:")
        print(f"  - 新建模板数量: {templates_created}")
        print(f"  - 总系统模板数量: {template_count}")
        print(f"  - 关键词操作数量: {keywords_updated}")
        print(f"  - 总关键词数量: {keyword_count}")

        return {
            "templates_created": templates_created,
            "total_templates": template_count,
            "keywords_updated": keywords_updated,
            "total_keywords": keyword_count
        }

    except Exception as e:
        db.rollback()
        print(f"迁移失败: {e}")
        import traceback
        traceback.print_exc()
        raise
    finally:
        db.close()

def verify_migration():
    """验证迁移结果"""
    db = SessionLocal()
    try:
        print("\n验证迁移结果...")

        # 检查模板
        templates = db.query(VisualizationTemplate).filter_by(is_system_template=True).all()
        print(f"\n系统模板列表 ({len(templates)}个):")
        for template in templates:
            print(f"  - {template.name} ({template.subject}) - {template.category}")

        # 检查关键词
        keywords = db.query(KeywordIndex).order_by(KeywordIndex.usage_frequency.desc()).limit(10).all()
        print(f"\n高频关键词 (前10):")
        for keyword in keywords:
            print(f"  - {keyword.keyword}: {keyword.usage_frequency}次 ({keyword.subject})")

    finally:
        db.close()

if __name__ == "__main__":
    print("开始MockEngine模板数据迁移（修复版）...")

    try:
        result = migrate_mock_data_to_db()
        verify_migration()

        print(f"\n✅ 迁移成功完成!")
        print(f"   新建模板数: {result['templates_created']}")
        print(f"   总模板数: {result['total_templates']}")
        print(f"   关键词操作数: {result['keywords_updated']}")
        print(f"   总关键词数: {result['total_keywords']}")

    except Exception as e:
        print(f"\n❌ 迁移失败: {e}")
        sys.exit(1)