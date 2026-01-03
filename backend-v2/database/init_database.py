#!/usr/bin/env python3
"""
数据库初始化脚本
万物可视化项目 - 本地 PostgreSQL 数据库初始化

使用方法:
    python3 init_database.py --init        # 初始化数据库
    python3 init_database.py --test        # 测试连接
    python3 init_database.py --backup      # 备份数据库
    python3 init_database.py --restore     # 恢复数据库
    python3 init_database.py --reset       # 重置数据库
"""

import os
import sys
import argparse
import subprocess
from datetime import datetime
from pathlib import Path

# 添加项目路径
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

try:
    from sqlalchemy import create_engine, text
    from sqlalchemy.orm import sessionmaker
    from models.database_models import Base, Subject, SubjectKeyword, CoreConcept, VisualizationTemplate
    from config.database import DATABASE_CONFIG, SYNC_DATABASE_URL
except ImportError as e:
    print(f"❌ 导入错误: {e}")
    print("请确保已安装依赖: pip install sqlalchemy psycopg2-binary")
    sys.exit(1)


class DatabaseManager:
    """数据库管理器"""

    def __init__(self):
        self.engine = None
        self.SessionLocal = None
        self.backup_dir = project_root / "backups" / "postgresql"
        self.backup_dir.mkdir(parents=True, exist_ok=True)

    def connect(self):
        """连接数据库"""
        try:
            self.engine = create_engine(SYNC_DATABASE_URL, pool_pre_ping=True)
            self.SessionLocal = sessionmaker(bind=self.engine)
            print("✅ 数据库连接成功！")
            return True
        except Exception as e:
            print(f"❌ 数据库连接失败: {e}")
            return False

    def test_connection(self):
        """测试数据库连接"""
        print("\n🔍 测试数据库连接...")

        if not self.connect():
            return False

        try:
            with self.engine.connect() as conn:
                result = conn.execute(text("SELECT version()"))
                version = result.fetchone()[0]
                print(f"✅ PostgreSQL 版本: {version.split(',')[0]}")

                result = conn.execute(text("SELECT current_database()"))
                db_name = result.fetchone()[0]
                print(f"✅ 当前数据库: {db_name}")

                result = conn.execute(text("SELECT current_user"))
                user = result.fetchone()[0]
                print(f"✅ 当前用户: {user}")

            return True
        except Exception as e:
            print(f"❌ 测试失败: {e}")
            return False

    def create_tables(self):
        """创建所有表"""
        print("\n📊 创建数据库表...")

        try:
            Base.metadata.create_all(self.engine)
            print("✅ 数据库表创建成功！")

            # 显示创建的表
            with self.engine.connect() as conn:
                result = conn.execute(text("""
                    SELECT tablename
                    FROM pg_tables
                    WHERE schemaname = 'public'
                    ORDER BY tablename
                """))
                tables = [row[0] for row in result]
                print(f"✅ 共创建 {len(tables)} 个表:")
                for table in tables:
                    print(f"   - {table}")

            return True
        except Exception as e:
            print(f"❌ 创建表失败: {e}")
            return False

    def insert_sample_data(self):
        """插入示例数据"""
        print("\n📝 插入示例数据...")

        db = self.SessionLocal()
        try:
            # 1. 插入学科数据
            print("  - 插入学科数据...")
            subjects_data = [
                {
                    "name": "线性代数",
                    "name_en": "Linear Algebra",
                    "description": "研究向量空间、线性变换和矩阵理论",
                    "icon": "📐",
                    "color": "#3498db"
                },
                {
                    "name": "微积分",
                    "name_en": "Calculus",
                    "description": "研究函数的极限、导数、积分等",
                    "icon": "∫",
                    "color": "#e74c3c"
                },
                {
                    "name": "概率论",
                    "name_en": "Probability Theory",
                    "description": "研究随机现象和统计规律",
                    "icon": "🎲",
                    "color": "#f39c12"
                },
                {
                    "name": "数论",
                    "name_en": "Number Theory",
                    "description": "研究整数性质和相互关系",
                    "icon": "🔢",
                    "color": "#9b59b6"
                },
                {
                    "name": "几何学",
                    "name_en": "Geometry",
                    "description": "研究空间结构、形状和大小",
                    "icon": "📊",
                    "color": "#1abc9c"
                }
            ]

            subjects_dict = {}
            for data in subjects_data:
                # 检查是否已存在
                existing = db.query(Subject).filter(Subject.name == data["name"]).first()
                if not existing:
                    subject = Subject(**data)
                    db.add(subject)
                    db.flush()
                    subjects_dict[subject.name] = subject
                else:
                    subjects_dict[existing.name] = existing

            db.commit()
            print(f"    ✅ 插入 {len(subjects_data)} 个学科")

            # 2. 插入关键词
            print("  - 插入关键词数据...")
            keywords_data = [
                # 线性代数关键词
                ("线性代数", "矩阵", 2.0, True),
                ("线性代数", "向量", 2.0, True),
                ("线性代数", "特征值", 1.8, True),
                ("线性代数", "特征向量", 1.8, True),
                ("线性代数", "线性变换", 1.5, True),
                ("线性代数", "行列式", 1.5, False),
                ("线性代数", "秩", 1.3, False),
                ("线性代数", "线性空间", 1.5, False),
                ("线性代数", "正交", 1.2, False),
                ("线性代数", "对角化", 1.4, False),
                # 微积分关键词
                ("微积分", "导数", 2.0, True),
                ("微积分", "积分", 2.0, True),
                ("微积分", "极限", 1.8, True),
                ("微积分", "微分", 1.5, False),
                ("微积分", "函数", 1.8, False),
                ("微积分", "连续", 1.3, False),
                ("微积分", "级数", 1.4, False),
                ("微积分", "泰勒展开", 1.3, False),
            ]

            for subject_name, keyword, weight, is_core in keywords_data:
                # 检查是否已存在
                subject = subjects_dict[subject_name]
                existing = db.query(SubjectKeyword).filter(
                    SubjectKeyword.subject_id == subject.id,
                    SubjectKeyword.keyword == keyword
                ).first()

                if not existing:
                    kw = SubjectKeyword(
                        subject_id=subject.id,
                        keyword=keyword,
                        weight=weight,
                        is_core=is_core
                    )
                    db.add(kw)

            db.commit()
            print(f"    ✅ 插入 {len(keywords_data)} 个关键词")

            # 3. 插入核心概念
            print("  - 插入核心概念数据...")
            concepts_data = [
                {
                    "subject_name": "线性代数",
                    "concept_name": "矩阵乘法",
                    "concept_name_en": "Matrix Multiplication",
                    "description": "两个矩阵相乘的运算规则",
                    "difficulty_level": "basic",
                    "visualization_type": "manim"
                },
                {
                    "subject_name": "线性代数",
                    "concept_name": "特征值分解",
                    "concept_name_en": "Eigenvalue Decomposition",
                    "description": "将矩阵分解为特征值和特征向量",
                    "difficulty_level": "intermediate",
                    "visualization_type": "manim"
                },
                {
                    "subject_name": "线性代数",
                    "concept_name": "奇异值分解",
                    "concept_name_en": "SVD",
                    "description": "矩阵的奇异值分解",
                    "difficulty_level": "advanced",
                    "visualization_type": "manim"
                },
                {
                    "subject_name": "线性代数",
                    "concept_name": "线性变换",
                    "concept_name_en": "Linear Transformation",
                    "description": "向量空间的线性映射",
                    "difficulty_level": "basic",
                    "visualization_type": "plotly"
                },
                {
                    "subject_name": "微积分",
                    "concept_name": "导数",
                    "concept_name_en": "Derivative",
                    "description": "函数变化率的度量",
                    "difficulty_level": "basic",
                    "visualization_type": "manim"
                },
                {
                    "subject_name": "微积分",
                    "concept_name": "积分",
                    "concept_name_en": "Integral",
                    "description": "曲线下面积或累积量",
                    "difficulty_level": "basic",
                    "visualization_type": "plotly"
                }
            ]

            for data in concepts_data:
                subject_name = data.pop("subject_name")
                subject = subjects_dict[subject_name]

                # 检查是否已存在
                existing = db.query(CoreConcept).filter(
                    CoreConcept.subject_id == subject.id,
                    CoreConcept.concept_name == data["concept_name"]
                ).first()

                if not existing:
                    concept = CoreConcept(subject_id=subject.id, **data)
                    db.add(concept)

            db.commit()
            print(f"    ✅ 插入 {len(concepts_data)} 个核心概念")

            print("\n✅ 示例数据插入成功！")
            return True

        except Exception as e:
            db.rollback()
            print(f"❌ 插入数据失败: {e}")
            return False
        finally:
            db.close()

    def show_stats(self):
        """显示数据库统计信息"""
        print("\n📊 数据库统计信息:")

        db = self.SessionLocal()
        try:
            # 学科统计
            subject_count = db.query(Subject).count()
            print(f"  - 学科总数: {subject_count}")

            # 关键词统计
            keyword_count = db.query(SubjectKeyword).count()
            print(f"  - 关键词总数: {keyword_count}")

            # 核心概念统计
            concept_count = db.query(CoreConcept).count()
            print(f"  - 核心概念总数: {concept_count}")

            # 模板统计
            template_count = db.query(VisualizationTemplate).count()
            print(f"  - 可视化模板总数: {template_count}")

            # 各学科关键词分布
            print("\n  各学科关键词分布:")
            subjects = db.query(Subject).all()
            for subject in subjects:
                kw_count = len(subject.keywords)
                print(f"    - {subject.name}: {kw_count} 个关键词")

        except Exception as e:
            print(f"❌ 统计失败: {e}")
        finally:
            db.close()

    def backup(self):
        """备份数据库"""
        print("\n💾 备份数据库...")

        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        backup_file = self.backup_dir / f"universal_viz_db_{timestamp}.backup"

        try:
            cmd = [
                "pg_dump",
                f"-U{DATABASE_CONFIG['user']}",
                f"-d{DATABASE_CONFIG['database']}",
                "--format=custom",
                f"--file={backup_file}"
            ]

            # 设置 PGPASSWORD 环境变量
            env = os.environ.copy()
            env["PGPASSWORD"] = DATABASE_CONFIG["password"]

            result = subprocess.run(cmd, env=env, capture_output=True, text=True)

            if result.returncode == 0:
                file_size = backup_file.stat().st_size / (1024 * 1024)  # MB
                print(f"✅ 备份成功: {backup_file}")
                print(f"   文件大小: {file_size:.2f} MB")
                return True
            else:
                print(f"❌ 备份失败: {result.stderr}")
                return False

        except Exception as e:
            print(f"❌ 备份出错: {e}")
            return False

    def restore(self, backup_file=None):
        """恢复数据库"""
        print("\n🔄 恢复数据库...")

        if not backup_file:
            # 列出可用的备份文件
            backups = list(self.backup_dir.glob("*.backup"))
            if not backups:
                print("❌ 没有找到备份文件")
                return False

            print("可用的备份文件:")
            for i, backup in enumerate(sorted(backups, reverse=True)[:10], 1):
                print(f"  {i}. {backup.name}")

            try:
                choice = int(input("\n请选择要恢复的备份编号: ")) - 1
                backup_file = sorted(backups, reverse=True)[choice]
            except (ValueError, IndexError):
                print("❌ 无效的选择")
                return False

        backup_path = Path(backup_file)
        if not backup_path.exists():
            print(f"❌ 备份文件不存在: {backup_file}")
            return False

        try:
            # 删除现有数据库
            drop_cmd = [
                "dropdb",
                f"-U{DATABASE_CONFIG['user']}",
                f"--if-exists",
                DATABASE_CONFIG["database"]
            ]

            # 创建新数据库
            create_cmd = [
                "createdb",
                f"-U{DATABASE_CONFIG['user']}",
                DATABASE_CONFIG["database"]
            ]

            # 恢复备份
            restore_cmd = [
                "pg_restore",
                f"-U{DATABASE_CONFIG['user']}",
                f"-d{DATABASE_CONFIG['database']}",
                str(backup_path)
            ]

            env = os.environ.copy()
            env["PGPASSWORD"] = DATABASE_CONFIG["password"]

            print(f"  1. 删除现有数据库...")
            subprocess.run(drop_cmd, env=env, capture_output=True)

            print(f"  2. 创建新数据库...")
            result = subprocess.run(create_cmd, env=env, capture_output=True)
            if result.returncode != 0:
                print(f"❌ 创建数据库失败: {result.stderr.decode()}")
                return False

            print(f"  3. 恢复数据...")
            result = subprocess.run(restore_cmd, env=env, capture_output=True)
            if result.returncode != 0:
                print(f"❌ 恢复失败: {result.stderr.decode()}")
                return False

            print(f"✅ 数据库恢复成功！")
            return True

        except Exception as e:
            print(f"❌ 恢复出错: {e}")
            return False

    def reset(self):
        """重置数据库"""
        print("\n⚠️  警告：此操作将删除所有数据！")

        confirm = input("确认要重置数据库吗？(yes/no): ")
        if confirm.lower() != "yes":
            print("❌ 操作已取消")
            return False

        # 先备份
        if not self.backup():
            print("❌ 备份失败，取消重置操作")
            return False

        # 删除所有表
        print("  删除所有表...")
        Base.metadata.drop_all(self.engine)

        # 重新创建表
        if not self.create_tables():
            return False

        # 插入初始数据
        if not self.insert_sample_data():
            return False

        print("✅ 数据库重置成功！")
        return True


def main():
    """主函数"""
    parser = argparse.ArgumentParser(description="数据库管理工具")
    parser.add_argument("--init", action="store_true", help="初始化数据库")
    parser.add_argument("--test", action="store_true", help="测试数据库连接")
    parser.add_argument("--backup", action="store_true", help="备份数据库")
    parser.add_argument("--restore", metavar="BACKUP_FILE", help="恢复数据库（可选备份文件路径）")
    parser.add_argument("--reset", action="store_true", help="重置数据库")
    parser.add_argument("--stats", action="store_true", help="显示统计信息")

    args = parser.parse_args()

    # 如果没有参数，显示帮助
    if len(sys.argv) == 1:
        parser.print_help()
        return

    manager = DatabaseManager()

    if args.test:
        success = manager.test_connection()
        sys.exit(0 if success else 1)

    elif args.init:
        if not manager.connect():
            sys.exit(1)

        if not manager.create_tables():
            sys.exit(1)

        if not manager.insert_sample_data():
            sys.exit(1)

        manager.show_stats()
        print("\n✅ 数据库初始化完成！")
        sys.exit(0)

    elif args.backup:
        success = manager.backup()
        sys.exit(0 if success else 1)

    elif args.restore:
        success = manager.restore(args.restore)
        sys.exit(0 if success else 1)

    elif args.reset:
        success = manager.reset()
        sys.exit(0 if success else 1)

    elif args.stats:
        if not manager.connect():
            sys.exit(1)
        manager.show_stats()
        sys.exit(0)


if __name__ == "__main__":
    main()
