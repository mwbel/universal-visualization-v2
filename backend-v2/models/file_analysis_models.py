"""
万物可视化 v2.0 - 文件分析数据模型
存储文件元数据和分析结果
"""

from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any
from sqlalchemy import (
    Column, String, Text, Integer, DateTime, Boolean,
    Float, JSON, Index, func, text, ForeignKey
)
from sqlalchemy.dialects.sqlite import JSON as SQLiteJSON
from sqlalchemy.orm import relationship, backref
from sqlalchemy.ext.hybrid import hybrid_property

from database import Base, engine
import os

class FileRecord(Base):
    """文件记录表"""
    __tablename__ = 'file_records'

    id = Column(String(64), primary_key=True, comment="文件唯一标识符")
    original_filename = Column(String(255), nullable=False, comment="原始文件名")
    stored_filename = Column(String(255), nullable=False, comment="存储的文件名")
    file_path = Column(String(500), nullable=False, comment="文件存储路径")
    file_type = Column(String(20), nullable=False, comment="文件类型: image/document/data")
    file_format = Column(String(10), nullable=False, comment="文件格式: .jpg/.pdf/.csv等")
    mime_type = Column(String(100), comment="MIME类型")
    file_size = Column(Integer, nullable=False, comment="文件大小(字节)")
    description = Column(Text, comment="文件描述")
    upload_time = Column(DateTime, default=datetime.now, comment="上传时间")

    # 分析状态
    analysis_status = Column(String(20), default="pending", comment="分析状态: pending/processing/completed/failed")
    last_analysis_time = Column(DateTime, comment="最后分析时间")
    analysis_progress = Column(Float, default=0.0, comment="分析进度(0-1)")

    # 用户和权限
    user_id = Column(String(64), comment="上传用户ID")
    is_public = Column(Boolean, default=False, comment="是否公开")
    tags = Column(JSON, comment="文件标签列表")

    # 文件内容摘要
    content_summary = Column(Text, comment="文件内容摘要")
    extracted_keywords = Column(JSON, comment="提取的关键词")

    # 系统字段
    created_at = Column(DateTime, default=datetime.now, comment="创建时间")
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now, comment="更新时间")
    is_deleted = Column(Boolean, default=False, comment="是否已删除")

    # 关联关系
    analysis_results = relationship("FileAnalysisResult", back_populates="file_record", cascade="all, delete-orphan")

    @hybrid_property
    def file_size_mb(self) -> float:
        """文件大小(MB)"""
        return self.file_size / (1024 * 1024) if self.file_size else 0

    @file_size_mb.expression
    def file_size_mb(cls):
        return func.cast(cls.file_size, Float) / (1024 * 1024)

    @hybrid_property
    def is_analyzed(self) -> bool:
        """是否已完成分析"""
        return self.analysis_status == "completed"

    @is_analyzed.expression
    def is_analyzed(cls):
        return func.coalesce(func.json_extract(cls.analysis_results, "$.processing_status"), cls.analysis_status) == "completed"

class FileAnalysisResult(Base):
    """文件分析结果表"""
    __tablename__ = 'file_analysis_results'

    id = Column(String(64), primary_key=True, comment="分析结果唯一标识符")
    file_id = Column(String(64), ForeignKey('file_records.id', ondelete='CASCADE'), nullable=False, comment="关联的文件ID")

    # 分析基本信息
    agent_type = Column(String(50), nullable=False, comment="分析Agent类型")
    analysis_version = Column(String(20), default="1.0", comment="分析算法版本")
    analysis_time = Column(DateTime, default=datetime.now, comment="分析时间")
    processing_time_ms = Column(Integer, comment="处理耗时(毫秒)")

    # 分析结果
    confidence_score = Column(Float, comment="分析置信度(0-1)")
    processing_status = Column(String(20), default="pending", comment="处理状态: pending/processing/completed/failed")
    error_messages = Column(JSON, comment="错误信息列表")

    # 提取的数据
    extracted_data = Column(JSON, comment="提取的结构化数据")
    metadata = Column(JSON, comment="文件元数据")
    suggested_visualizations = Column(JSON, comment="推荐的可视化类型")

    # 分析参数
    analysis_options = Column(JSON, comment="分析时使用的选项")
    model_version = Column(String(50), comment="使用的AI模型版本")

    # 结果质量评估
    data_completeness = Column(Float, comment="数据完整性评分(0-1)")
    accuracy_score = Column(Float, comment="准确性评分(0-1)")

    # 系统字段
    created_at = Column(DateTime, default=datetime.now, comment="创建时间")
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now, comment="更新时间")

    # 关联关系
    file_record = relationship("FileRecord", back_populates="analysis_results")

    # 索引
    __table_args__ = (
        Index('idx_file_analysis_file_id', 'file_id'),
        Index('idx_file_analysis_status', 'processing_status'),
        Index('idx_file_analysis_time', 'analysis_time'),
    )

class FileVisualizationGeneration(Base):
    """文件可视化生成记录表"""
    __tablename__ = 'file_visualization_generations'

    id = Column(String(64), primary_key=True, comment="生成记录唯一标识符")
    file_id = Column(String(64), ForeignKey('file_records.id', ondelete='CASCADE'), nullable=False, comment="关联的文件ID")
    analysis_result_id = Column(String(64), ForeignKey('file_analysis_results.id', ondelete='CASCADE'), comment="关联的分析结果ID")

    # 生成信息
    visualization_type = Column(String(50), nullable=False, comment="可视化类型")
    template_id = Column(String(64), comment="使用的模板ID")
    generation_parameters = Column(JSON, comment="生成参数")

    # 生成结果
    html_content = Column(Text, comment="生成的HTML内容")
    chart_data = Column(JSON, comment="图表数据")
    interactive_config = Column(JSON, comment="交互配置")

    # 生成状态
    generation_status = Column(String(20), default="pending", comment="生成状态: pending/processing/completed/failed")
    generation_time_ms = Column(Integer, comment="生成耗时(毫秒)")

    # 用户反馈
    user_rating = Column(Integer, comment="用户评分(1-5)")
    user_feedback = Column(Text, comment="用户反馈")
    improvement_suggestions = Column(JSON, comment="改进建议")

    # 分享和导出
    share_token = Column(String(64), comment="分享令牌")
    export_formats = Column(JSON, comment="支持的导出格式")
    download_count = Column(Integer, default=0, comment="下载次数")

    # 系统字段
    created_at = Column(DateTime, default=datetime.now, comment="创建时间")
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now, comment="更新时间")
    expires_at = Column(DateTime, comment="过期时间")

    # 索引
    __table_args__ = (
        Index('idx_file_viz_file_id', 'file_id'),
        Index('idx_file_viz_type', 'visualization_type'),
        Index('idx_file_viz_status', 'generation_status'),
        Index('idx_file_viz_share_token', 'share_token'),
    )

class FileProcessingQueue(Base):
    """文件处理队列表"""
    __tablename__ = 'file_processing_queue'

    id = Column(String(64), primary_key=True, comment="队列任务唯一标识符")
    file_id = Column(String(64), ForeignKey('file_records.id', ondelete='CASCADE'), nullable=False, comment="关联的文件ID")

    # 任务信息
    task_type = Column(String(50), nullable=False, comment="任务类型: analysis/visualization/enhancement")
    task_priority = Column(Integer, default=5, comment="任务优先级(1-10)")
    task_parameters = Column(JSON, comment="任务参数")

    # 调度信息
    scheduled_at = Column(DateTime, comment="计划执行时间")
    started_at = Column(DateTime, comment="开始执行时间")
    completed_at = Column(DateTime, comment="完成时间")

    # 执行状态
    execution_status = Column(String(20), default="pending", comment="执行状态: pending/running/completed/failed/cancelled")
    progress_percentage = Column(Float, default=0.0, comment="执行进度百分比")
    current_step = Column(String(100), comment="当前执行步骤")

    # 结果信息
    result_data = Column(JSON, comment="执行结果数据")
    error_message = Column(Text, comment="错误信息")
    retry_count = Column(Integer, default=0, comment="重试次数")
    max_retries = Column(Integer, default=3, comment="最大重试次数")

    # 系统字段
    created_at = Column(DateTime, default=datetime.now, comment="创建时间")
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now, comment="更新时间")

    # 索引
    __table_args__ = (
        Index('idx_file_queue_file_id', 'file_id'),
        Index('idx_file_queue_status', 'execution_status'),
        Index('idx_file_queue_priority', 'task_priority'),
        Index('idx_file_queue_scheduled', 'scheduled_at'),
    )

# 数据库操作辅助类
class FileRepository:
    """文件数据仓库类"""

    @staticmethod
    def create_file_record(
        db_session,
        file_id: str,
        original_filename: str,
        stored_filename: str,
        file_path: str,
        file_type: str,
        file_size: int,
        user_id: Optional[str] = None,
        description: Optional[str] = None
    ) -> FileRecord:
        """创建文件记录"""
        file_record = FileRecord(
            id=file_id,
            original_filename=original_filename,
            stored_filename=stored_filename,
            file_path=file_path,
            file_type=file_type,
            file_format=os.path.splitext(original_filename)[1].lower(),
            file_size=file_size,
            user_id=user_id,
            description=description
        )

        db_session.add(file_record)
        db_session.commit()
        return file_record

    @staticmethod
    def update_analysis_status(
        db_session,
        file_id: str,
        status: str,
        progress: Optional[float] = None
    ) -> Optional[FileRecord]:
        """更新文件分析状态"""
        file_record = db_session.query(FileRecord).filter(
            FileRecord.id == file_id,
            FileRecord.is_deleted == False
        ).first()

        if file_record:
            file_record.analysis_status = status
            if progress is not None:
                file_record.analysis_progress = progress
            file_record.updated_at = datetime.now()
            db_session.commit()

        return file_record

    @staticmethod
    def get_user_files(
        db_session,
        user_id: Optional[str] = None,
        file_type: Optional[str] = None,
        limit: int = 50,
        offset: int = 0
    ) -> List[FileRecord]:
        """获取用户文件列表"""
        query = db_session.query(FileRecord).filter(FileRecord.is_deleted == False)

        if user_id:
            query = query.filter(FileRecord.user_id == user_id)
        if file_type:
            query = query.filter(FileRecord.file_type == file_type)

        return query.order_by(FileRecord.upload_time.desc()).offset(offset).limit(limit).all()

# 创建数据库表
def create_file_analysis_tables():
    """创建文件分析相关的数据库表"""
    Base.metadata.create_all(bind=engine)