"""
万物可视化 v2.0 - 配置文件
定义应用的各种配置参数
"""

import os
from pathlib import Path
from typing import Dict, Any, List

# 基础配置
class Settings:
    """应用配置类"""

    # 应用信息
    APP_NAME = "万物可视化"
    APP_VERSION = "2.0.0"
    APP_DESCRIPTION = "基于集中式路由架构的智能可视化生成平台"

    # 服务器配置
    HOST = "0.0.0.0"
    PORT = 8000
    DEBUG = True

    # 路径配置
    BASE_DIR = Path(__file__).parent
    STATIC_DIR = BASE_DIR / "static"
    TEMPLATES_DIR = BASE_DIR / "templates"
    OUTPUT_DIR = STATIC_DIR / "visualizations"

    # API配置
    API_V1_PREFIX = "/api/v1"
    API_V2_PREFIX = "/api/v2"
    CORS_ORIGINS = ["*"]

    # 模板引擎配置
    TEMPLATE_CACHE_ENABLED = True
    TEMPLATE_CACHE_SIZE = 100

    # Agent配置
    AGENT_TIMEOUT = 30  # 秒
    MAX_CONCURRENT_GENERATIONS = 5

    # 文件上传配置
    MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB
    ALLOWED_FILE_TYPES = [".csv", ".txt", ".json", ".xlsx"]

    # 数据库配置（如果需要）
    DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./visualization.db")

    # 日志配置
    LOG_LEVEL = "INFO"
    LOG_FILE = BASE_DIR / "logs" / "app.log"

    # 缓存配置
    REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")
    CACHE_TTL = 3600  # 1小时

    # 安全配置
    SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-here")
    ACCESS_TOKEN_EXPIRE_MINUTES = 30

    # 可视化配置
    DEFAULT_PLOTLY_CONFIG = {
        "responsive": True,
        "displayModeBar": True,
        "displaylogo": False,
        "modeBarButtonsToRemove": ["pan2d", "select2d", "lasso2d"],
        "toImageButtonOptions": {
            "format": "png",
            "filename": "visualization",
            "height": 600,
            "width": 1000,
            "scale": 1
        }
    }

    # 学科配置
    SUPPORTED_SUBJECTS = ["mathematics", "astronomy", "physics"]
    SUBJECT_DISPLAY_NAMES = {
        "mathematics": "数学",
        "astronomy": "天文学",
        "physics": "物理学",
        "chemistry": "化学",
        "biology": "生物学"
    }

    # 模板配置
    DEFAULT_TEMPLATE_PARAMS = {
        "responsive": True,
        "interactive": True,
        "export_enabled": True,
        "share_enabled": True
    }

    @property
    def supported_subjects_info(self) -> Dict[str, Dict[str, Any]]:
        """获取支持的学科信息"""
        return {
            "mathematics": {
                "name": "数学",
                "description": "数学概念可视化",
                "topics": ["概率统计", "线性代数", "微积分", "几何学"],
                "color": "#3498db"
            },
            "astronomy": {
                "name": "天文学",
                "description": "天文现象和天体运动可视化",
                "topics": ["行星轨道", "星座", "日月食", "天球坐标"],
                "color": "#f39c12"
            },
            "physics": {
                "name": "物理学",
                "description": "物理现象和规律可视化",
                "topics": ["力学", "电磁学", "波动", "热力学", "量子物理"],
                "color": "#e74c3c"
            }
        }

# 创建全局配置实例
settings = Settings()

# 确保必要的目录存在
def ensure_directories():
    """确保必要的目录存在"""
    directories = [
        settings.BASE_DIR / "logs",
        settings.STATIC_DIR,
        settings.TEMPLATES_DIR,
        settings.OUTPUT_DIR,
        settings.BASE_DIR / "data"
    ]

    for directory in directories:
        directory.mkdir(parents=True, exist_ok=True)

# 在导入时创建目录
ensure_directories()