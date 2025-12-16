"""
文件上传和分析API模块
支持图片、文档、数据文件的上传、存储和智能分析
"""

from fastapi import APIRouter, HTTPException, UploadFile, File, Form, Depends, BackgroundTasks
from fastapi.responses import FileResponse, JSONResponse
from pydantic import BaseModel, Field
from typing import Dict, List, Optional, Any, Union
import json
import uuid
import os
import shutil
import aiofiles
from pathlib import Path
import mimetypes
from datetime import datetime
import asyncio

# 导入文件分析Agent
from agents.file_analysis_agent import (
    ImageAnalysisAgent,
    DocumentAnalysisAgent,
    DataFileAnalysisAgent,
    FileAnalysisResult
)

# 导入配置
from config import settings

router = APIRouter(prefix="/api/v4/files", tags=["文件上传和分析"])

# ==============================
# 配置和常量
# ==============================

# 文件上传配置
UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)

# 允许的文件类型
ALLOWED_EXTENSIONS = {
    'image': ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.svg'],
    'document': ['.pdf', '.doc', '.docx', '.txt', '.md', '.rtf'],
    'data': ['.csv', '.xlsx', '.xls', '.json', '.xml'],
    'archive': ['.zip', '.rar', '.7z', '.tar', '.gz']
}

# 文件大小限制 (50MB)
MAX_FILE_SIZE = 50 * 1024 * 1024

# ==============================
# 数据模型
# ==============================

class FileUploadResponse(BaseModel):
    """文件上传响应模型"""
    success: bool = Field(description="上传是否成功")
    file_id: str = Field(description="文件唯一标识")
    filename: str = Field(description="原始文件名")
    file_type: str = Field(description="文件类型")
    file_size: int = Field(description="文件大小(字节)")
    upload_time: str = Field(description="上传时间")
    message: str = Field(description="响应消息")
    analysis_url: Optional[str] = Field(None, description="分析API地址")

class FileAnalysisRequest(BaseModel):
    """文件分析请求模型"""
    file_id: str = Field(description="文件唯一标识")
    analysis_options: Optional[Dict[str, Any]] = Field(default_factory=dict, description="分析选项")
    auto_visualize: bool = Field(default=True, description="是否自动生成可视化")

class FileAnalysisResponse(BaseModel):
    """文件分析响应模型"""
    success: bool = Field(description="分析是否成功")
    file_id: str = Field(description="文件唯一标识")
    analysis_status: str = Field(description="分析状态")
    extracted_data: Dict[str, Any] = Field(description="提取的数据")
    metadata: Dict[str, Any] = Field(description="文件元数据")
    confidence_score: float = Field(description="分析置信度")
    suggested_visualizations: List[str] = Field(description="推荐的可视化类型")
    processing_time: float = Field(description="处理时间(秒)")
    message: str = Field(description="响应消息")
    error_messages: List[str] = Field(default_factory=list, description="错误信息")

class FileListResponse(BaseModel):
    """文件列表响应模型"""
    files: List[Dict[str, Any]] = Field(description="文件列表")
    total_count: int = Field(description="总文件数")
    message: str = Field(description="响应消息")

# ==============================
# Agent实例管理
# ==============================

# 创建Agent实例
image_agent = ImageAnalysisAgent('image_analyzer', {
    'max_file_size': MAX_FILE_SIZE,
    'temp_dir': str(UPLOAD_DIR / 'temp')
})

document_agent = DocumentAnalysisAgent('document_analyzer', {
    'max_file_size': MAX_FILE_SIZE,
    'temp_dir': str(UPLOAD_DIR / 'temp')
})

data_agent = DataFileAnalysisAgent('data_analyzer', {
    'max_file_size': MAX_FILE_SIZE,
    'temp_dir': str(UPLOAD_DIR / 'temp')
})

# 文件存储管理
file_storage = {}  # 临时存储文件信息，实际应用中应使用数据库

def get_file_type(filename: str) -> str:
    """根据文件扩展名确定文件类型"""
    ext = Path(filename).suffix.lower()

    for file_type, extensions in ALLOWED_EXTENSIONS.items():
        if ext in extensions:
            return file_type

    return 'unknown'

def get_agent_for_file(file_type: str):
    """根据文件类型获取对应的Agent"""
    if file_type == 'image':
        return image_agent
    elif file_type == 'document':
        return document_agent
    elif file_type == 'data':
        return data_agent
    else:
        raise HTTPException(status_code=400, detail=f"不支持的文件类型: {file_type}")

# ==============================
# API端点实现
# ==============================

@router.post("/upload", response_model=FileUploadResponse)
async def upload_file(
    file: UploadFile = File(...),
    description: Optional[str] = Form(None),
    background_tasks: BackgroundTasks = BackgroundTasks()
):
    """
    上传文件

    Args:
        file: 上传的文件
        description: 文件描述（可选）
        background_tasks: 后台任务

    Returns:
        FileUploadResponse: 上传结果
    """
    try:
        # 验证文件
        if not file.filename:
            raise HTTPException(status_code=400, detail="未提供文件名")

        file_type = get_file_type(file.filename)
        if file_type == 'unknown':
            raise HTTPException(status_code=400, detail="不支持的文件格式")

        # 检查文件大小
        file_content = await file.read()
        if len(file_content) > MAX_FILE_SIZE:
            raise HTTPException(
                status_code=413,
                detail=f"文件大小超过限制 ({MAX_FILE_SIZE / 1024 / 1024:.1f}MB)"
            )

        # 生成文件ID和存储路径
        file_id = str(uuid.uuid4())
        file_ext = Path(file.filename).suffix
        stored_filename = f"{file_id}{file_ext}"
        file_path = UPLOAD_DIR / stored_filename

        # 保存文件
        async with aiofiles.open(file_path, 'wb') as f:
            await f.write(file_content)

        # 存储文件信息
        file_info = {
            "file_id": file_id,
            "original_filename": file.filename,
            "stored_filename": stored_filename,
            "file_path": str(file_path),
            "file_type": file_type,
            "file_size": len(file_content),
            "upload_time": datetime.now().isoformat(),
            "description": description,
            "analysis_status": "pending"
        }

        file_storage[file_id] = file_info

        return FileUploadResponse(
            success=True,
            file_id=file_id,
            filename=file.filename,
            file_type=file_type,
            file_size=len(file_content),
            upload_time=file_info["upload_time"],
            message=f"文件 '{file.filename}' 上传成功",
            analysis_url=f"/api/v4/files/analyze/{file_id}"
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"文件上传失败: {str(e)}")

@router.post("/analyze/{file_id}", response_model=FileAnalysisResponse)
async def analyze_file(
    file_id: str,
    request: FileAnalysisRequest,
    background_tasks: BackgroundTasks = BackgroundTasks()
):
    """
    分析已上传的文件

    Args:
        file_id: 文件唯一标识
        request: 分析请求
        background_tasks: 后台任务

    Returns:
        FileAnalysisResponse: 分析结果
    """
    try:
        # 检查文件是否存在
        if file_id not in file_storage:
            raise HTTPException(status_code=404, detail="文件未找到")

        file_info = file_storage[file_id]

        # 获取对应的Agent
        agent = get_agent_for_file(file_info["file_type"])

        # 验证文件
        validation_result = agent.validate_file(file_info["file_path"])
        if not validation_result["is_valid"]:
            raise HTTPException(
                status_code=400,
                detail=f"文件验证失败: {'; '.join(validation_result['error_messages'])}"
            )

        # 开始分析
        start_time = datetime.now()

        # 执行文件分析
        analysis_result = agent.analyze_file(file_info["file_path"], file_id)

        # 计算处理时间
        processing_time = (datetime.now() - start_time).total_seconds()

        # 更新文件信息
        file_info["analysis_status"] = analysis_result.processing_status
        file_info["last_analysis_time"] = analysis_result.analysis_time.isoformat()

        # 如果启用了自动可视化生成，添加后台任务
        if request.auto_visualize and analysis_result.processing_status == "completed":
            # TODO: 添加可视化生成的后台任务
            pass

        return FileAnalysisResponse(
            success=analysis_result.processing_status == "completed",
            file_id=file_id,
            analysis_status=analysis_result.processing_status,
            extracted_data=analysis_result.extracted_data,
            metadata=analysis_result.metadata,
            confidence_score=analysis_result.confidence_score,
            suggested_visualizations=analysis_result.suggested_visualizations,
            processing_time=processing_time,
            message="文件分析完成" if analysis_result.processing_status == "completed" else "文件分析失败",
            error_messages=analysis_result.error_messages
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"文件分析失败: {str(e)}")

@router.get("/analyze/{file_id}/status")
async def get_analysis_status(file_id: str):
    """
    获取文件分析状态

    Args:
        file_id: 文件唯一标识

    Returns:
        Dict: 分析状态信息
    """
    try:
        if file_id not in file_storage:
            raise HTTPException(status_code=404, detail="文件未找到")

        file_info = file_storage[file_id]

        return {
            "file_id": file_id,
            "analysis_status": file_info.get("analysis_status", "pending"),
            "upload_time": file_info["upload_time"],
            "last_analysis_time": file_info.get("last_analysis_time"),
            "message": "分析进行中" if file_info.get("analysis_status") == "processing" else "等待分析"
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取分析状态失败: {str(e)}")

@router.get("/", response_model=FileListResponse)
async def list_files(
    file_type: Optional[str] = None,
    limit: int = 50,
    offset: int = 0
):
    """
    获取文件列表

    Args:
        file_type: 文件类型过滤
        limit: 返回数量限制
        offset: 偏移量

    Returns:
        FileListResponse: 文件列表
    """
    try:
        # 过滤文件
        files = []
        for file_id, file_info in file_storage.items():
            if file_type and file_info["file_type"] != file_type:
                continue
            files.append(file_info)

        # 排序（按上传时间倒序）
        files.sort(key=lambda x: x["upload_time"], reverse=True)

        # 分页
        total_count = len(files)
        paginated_files = files[offset:offset + limit]

        return FileListResponse(
            files=paginated_files,
            total_count=total_count,
            message=f"获取到 {len(paginated_files)} 个文件"
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取文件列表失败: {str(e)}")

@router.get("/{file_id}")
async def get_file_info(file_id: str):
    """
    获取文件详细信息

    Args:
        file_id: 文件唯一标识

    Returns:
        Dict: 文件详细信息
    """
    try:
        if file_id not in file_storage:
            raise HTTPException(status_code=404, detail="文件未找到")

        file_info = file_storage[file_id]
        return file_info

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取文件信息失败: {str(e)}")

@router.delete("/{file_id}")
async def delete_file(file_id: str):
    """
    删除文件

    Args:
        file_id: 文件唯一标识

    Returns:
        Dict: 删除结果
    """
    try:
        if file_id not in file_storage:
            raise HTTPException(status_code=404, detail="文件未找到")

        file_info = file_storage[file_id]

        # 删除物理文件
        file_path = Path(file_info["file_path"])
        if file_path.exists():
            file_path.unlink()

        # 删除文件记录
        del file_storage[file_id]

        return {
            "success": True,
            "file_id": file_id,
            "message": f"文件 '{file_info['original_filename']}' 删除成功"
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"删除文件失败: {str(e)}")

@router.get("/{file_id}/download")
async def download_file(file_id: str):
    """
    下载文件

    Args:
        file_id: 文件唯一标识

    Returns:
        FileResponse: 文件下载响应
    """
    try:
        if file_id not in file_storage:
            raise HTTPException(status_code=404, detail="文件未找到")

        file_info = file_storage[file_id]
        file_path = Path(file_info["file_path"])

        if not file_path.exists():
            raise HTTPException(status_code=404, detail="文件不存在")

        return FileResponse(
            path=str(file_path),
            filename=file_info["original_filename"],
            media_type=mimetypes.guess_type(file_info["original_filename"])[0]
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"下载文件失败: {str(e)}")