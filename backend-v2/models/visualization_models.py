"""
万物可视化 v2.0 - 可视化数据模型
基于SQLAlchemy的现代化数据模型
"""

from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any
from sqlalchemy import (
    Column, String, Text, Integer, DateTime, Boolean,
    Float, JSON, Index, func, text
)
from sqlalchemy.dialects.sqlite import JSON as SQLiteJSON
from sqlalchemy.orm import relationship, backref
from sqlalchemy.ext.hybrid import hybrid_property

from database import Base

class VisualizationRecord(Base):
    """可视化记录表"""
    __tablename__ = 'visualization_records'

    id = Column(String(64), primary_key=True, comment="唯一标识符")
    prompt = Column(Text, nullable=False, comment="用户输入的提示词")
    keywords = Column(Text, comment="标准化后的关键词，逗号分隔")
    subject = Column(String(50), comment="学科分类")
    template_id = Column(String(64), comment="使用的模板ID")
    generation_source = Column(String(20), default="mock", comment="生成来源: mock/llm/template")
    html_content = Column(Text, comment="生成的HTML内容")
    parameters_used = Column(JSON, comment="实际使用的参数JSON")
    generation_time_ms = Column(Integer, comment="生成耗时(毫秒)")
    cache_hit = Column(Boolean, default=False, comment="是否为缓存命中")
    usage_count = Column(Integer, default=0, comment="使用次数")
    quality_score = Column(Float, comment="质量评分(0-5)")
    expires_at = Column(DateTime, comment="缓存过期时间")
    created_at = Column(DateTime, default=datetime.utcnow, comment="创建时间")
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, comment="更新时间")

    # 索引
    __table_args__ = (
        Index('idx_records_subject', 'subject'),
        Index('idx_records_created_at', 'created_at'),
        Index('idx_records_source', 'generation_source'),
        Index('idx_records_cache_active', 'cache_hit', 'expires_at'),
        Index('idx_records_usage_count', 'usage_count'),
        Index('idx_records_keywords_text', text('keywords')),
        Index('idx_records_prompt_text', text('prompt')),
    )

    def __repr__(self):
        return f"<VisualizationRecord(id='{self.id}', subject='{self.subject}', source='{self.generation_source}')>"

    @hybrid_property
    def is_expired(self) -> bool:
        """检查是否过期"""
        if self.expires_at is None:
            return False
        return datetime.utcnow() > self.expires_at

    @hybrid_property
    def keyword_list(self) -> List[str]:
        """获取关键词列表"""
        if not self.keywords:
            return []
        return [kw.strip() for kw in self.keywords.split(',') if kw.strip()]

    @keyword_list.expression
    def keyword_list(cls):
        """关键词列表的SQL表达式"""
        return func.split(
            func.coalesce(cls.keywords, ''),
            ','
        )

    @classmethod
    def create_new(cls, viz_id: str, prompt: str, keywords: List[str],
                   subject: str, html_content: str, source: str = "mock",
                   template_id: str = None, parameters: Dict = None,
                   generation_time_ms: int = None, expires_days: int = 30) -> "VisualizationRecord":
        """创建新记录的便捷方法"""
        return cls(
            id=viz_id,
            prompt=prompt,
            keywords=",".join(keywords),
            subject=subject,
            html_content=html_content,
            generation_source=source,
            template_id=template_id,
            parameters_used=parameters or {},
            generation_time_ms=generation_time_ms,
            expires_at=datetime.utcnow() + timedelta(days=expires_days)
        )

class VisualizationTemplate(Base):
    """可视化模板表"""
    __tablename__ = 'visualization_templates'

    id = Column(String(64), primary_key=True, comment="模板唯一标识符")
    name = Column(String(200), nullable=False, comment="模板名称")
    description = Column(Text, comment="模板描述")
    category = Column(String(100), comment="模板分类")
    subject = Column(String(50), nullable=False, comment="学科分类")
    difficulty_level = Column(String(20), comment="难度等级: elementary/intermediate/advanced")
    keywords = Column(Text, comment="关键词，逗号分隔")
    template_content = Column(Text, comment="模板HTML内容")
    parameters_schema = Column(JSON, comment="参数定义JSON Schema")
    examples = Column(JSON, comment="示例数据")
    usage_count = Column(Integer, default=0, comment="使用次数")
    is_system_template = Column(Boolean, default=False, comment="是否系统内置模板")
    is_active = Column(Boolean, default=True, comment="是否启用")
    created_at = Column(DateTime, default=datetime.utcnow, comment="创建时间")
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, comment="更新时间")

    # 索引
    __table_args__ = (
        Index('idx_templates_subject_category', 'subject', 'category'),
        Index('idx_templates_active', 'is_active'),
        Index('idx_templates_usage_count', 'usage_count'),
        Index('idx_templates_keywords_text', text('keywords')),
        Index('idx_templates_name_text', text('name')),
    )

    def __repr__(self):
        return f"<VisualizationTemplate(id='{self.id}', name='{self.name}', subject='{self.subject}')>"

    @hybrid_property
    def keyword_list(self) -> List[str]:
        """获取关键词列表"""
        if not self.keywords:
            return []
        return [kw.strip() for kw in self.keywords.split(',') if kw.strip()]

    @classmethod
    def create_system_template(cls, template_id: str, name: str, subject: str,
                             content: str, keywords: List[str] = None,
                             description: str = None, category: str = None) -> "VisualizationTemplate":
        """创建系统模板的便捷方法"""
        return cls(
            id=template_id,
            name=name,
            description=description,
            category=category,
            subject=subject,
            keywords=",".join(keywords or []),
            template_content=content,
            is_system_template=True,
            is_active=True
        )

class KeywordIndex(Base):
    """关键词索引表"""
    __tablename__ = 'keyword_index'

    keyword = Column(String(100), primary_key=True, comment="关键词")
    subject = Column(String(50), comment="相关学科")
    usage_frequency = Column(Integer, default=1, comment="使用频率")
    last_used = Column(DateTime, default=datetime.utcnow, comment="最后使用时间")
    related_keywords = Column(JSON, comment="相关关键词JSON数组")
    vector_embedding = Column(Text, comment="向量embeddings(JSON格式)")
    created_at = Column(DateTime, default=datetime.utcnow, comment="创建时间")

    # 索引
    __table_args__ = (
        Index('idx_keywords_subject', 'subject'),
        Index('idx_keywords_frequency', 'usage_frequency'),
        Index('idx_keywords_last_used', 'last_used'),
        Index('idx_keywords_keyword_text', text('keyword')),
    )

    def __repr__(self):
        return f"<KeywordIndex(keyword='{self.keyword}', subject='{self.subject}', frequency={self.usage_frequency})>"

    @classmethod
    def update_or_create(cls, keyword: str, subject: str = None) -> "KeywordIndex":
        """更新或创建关键词索引"""
        existing = cls.query.filter_by(keyword=keyword).first()

        if existing:
            existing.usage_frequency += 1
            existing.last_used = datetime.utcnow()
            if subject:
                existing.subject = subject
            return existing
        else:
            return cls(
                keyword=keyword,
                subject=subject,
                usage_frequency=1
            )