"""
万物可视化 v2.0 - Agent系统初始化模块
方案A：集中式路由架构
"""

from .base_agent import BaseVisualizationAgent
from .mathematics_agent import MathematicsAgent
from .astronomy_agent import AstronomyAgent
from .physics_agent import PhysicsAgent
from .router_manager import VisualizationRouter, SubjectClassifier
from .template_engine import UnifiedTemplateEngine

# 导出主要类
__all__ = [
    "BaseVisualizationAgent",
    "MathematicsAgent",
    "AstronomyAgent",
    "PhysicsAgent",
    "VisualizationRouter",
    "SubjectClassifier",
    "UnifiedTemplateEngine"
]

print("🤖 万物可视化 Agent 系统 v2.0 已加载")
print("📋 架构: 方案A - 集中式路由架构")