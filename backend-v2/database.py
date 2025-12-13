"""
万物可视化 v2.0 - 数据库连接管理
基于SQLAlchemy的现代化数据库管理
"""

import os
import logging
from typing import Generator
from sqlalchemy import create_engine, MetaData
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.pool import StaticPool

from config import settings

# 配置日志
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# 创建数据库引擎
def create_database_engine():
    """创建数据库引擎"""

    # 使用项目配置中的数据库路径
    db_path = settings.BASE_DIR / "data" / "visualization_cache.db"

    # 确保数据目录存在
    db_path.parent.mkdir(parents=True, exist_ok=True)

    # 构建数据库URL
    database_url = f"sqlite:///{db_path}"

    logger.info(f"数据库路径: {database_url}")

    # 创建引擎
    engine = create_engine(
        database_url,
        # SQLite特定配置
        poolclass=StaticPool,
        connect_args={
            "check_same_thread": False,
            "timeout": 20
        },
        # 启用SQL语句日志
        echo=settings.DEBUG,
        # 连接池配置
        pool_pre_ping=True,
        pool_recycle=3600
    )

    return engine, db_path

# 创建引擎和数据库路径
engine, DATABASE_PATH = create_database_engine()

# 创建会话工厂
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

# 创建基础模型类
Base = declarative_base()

# 元数据
metadata = MetaData()

def get_database_url() -> str:
    """获取数据库连接URL"""
    return f"sqlite:///{DATABASE_PATH}"

def get_db_session() -> Generator[Session, None, None]:
    """获取数据库会话

    用于FastAPI依赖注入
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_database():
    """初始化数据库"""
    try:
        # 导入所有模型以确保表被创建
        from models.visualization_models import (
            VisualizationRecord,
            VisualizationTemplate,
            KeywordIndex
        )

        # 创建所有表
        Base.metadata.create_all(bind=engine)
        logger.info("✅ 数据库初始化成功")

        return True

    except Exception as e:
        logger.error(f"❌ 数据库初始化失败: {e}")
        return False

def check_database_connection() -> bool:
    """检查数据库连接"""
    try:
        with engine.connect() as conn:
            conn.execute("SELECT 1")
        logger.info("✅ 数据库连接正常")
        return True
    except Exception as e:
        logger.error(f"❌ 数据库连接失败: {e}")
        return False

# 数据库信息
def get_database_info() -> dict:
    """获取数据库信息"""
    try:
        db_size = DATABASE_PATH.stat().st_size if DATABASE_PATH.exists() else 0

        return {
            "database_path": str(DATABASE_PATH),
            "database_exists": DATABASE_PATH.exists(),
            "database_size_mb": round(db_size / (1024 * 1024), 2),
            "database_url": get_database_url(),
            "connection_status": "正常" if check_database_connection() else "异常"
        }
    except Exception as e:
        logger.error(f"获取数据库信息失败: {e}")
        return {"error": str(e)}