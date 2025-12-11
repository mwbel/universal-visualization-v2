"""
文件上传和多媒体支持API
支持图片、文档等多种文件类型的上传和处理
"""

from fastapi import APIRouter, HTTPException, UploadFile, File, Form, Depends
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field
from typing import Dict, List, Optional, Any, Union
import json
import uuid
import os
import shutil
from pathlib import Path
import mimetypes
from datetime import datetime

router = APIRouter(prefix="/files", tags=["文件管理"])

# ==============================
# 配置和常量
# ==============================

# 允许的文件类型
ALLOWED_EXTENSIONS = {
    'image': ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.svg'],
    'document': ['.pdf', '.doc', '.docx', '.txt', '.md', '.rtf'],
    'data': ['.csv', '.xlsx', '.xls', '.json', '.xml'],
    'archive': ['.zip', '.rar', '.7z', '.tar', '.gz']
}

# 最大文件大小（字节）
MAX_FILE_SIZES = {
    'image': 10 * 1024 * 1024,  # 10MB
    'document': 20 * 1024 * 1024,  # 20MB
    'data': 50 * 1024 * 1024,  # 50MB
    'archive': 100 * 1024 * 1024  # 100MB
}

# 上传目录
UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)

# 按类型创建子目录
for category in ALLOWED_EXTENSIONS.keys():
    (UPLOAD_DIR / category).mkdir(exist_ok=True)

# ==============================
# 数据模型
# ==============================

class FileInfo(BaseModel):
    """文件信息模型"""
    id: str
    filename: str
    original_filename: str
    file_type: str
    category: str
    file_size: int
    mime_type: str
    upload_time: datetime
    url: str
    metadata: Dict[str, Any] = {}

class FileUploadResponse(BaseModel):
    """文件上传响应"""
    success: bool
    message: str
    file_info: Optional[FileInfo] = None
    error: Optional[str] = None

class FileListResponse(BaseModel):
    """文件列表响应"""
    files: List[FileInfo]
    total: int
    category: Optional[str] = None

class FileProcessingRequest(BaseModel):
    """文件处理请求"""
    file_id: str
    processing_type: str = Field(..., description="处理类型: extract_text, analyze_image, generate_chart")
    parameters: Dict[str, Any] = {}

# ==============================
# 全局文件存储
# ==============================

class FileStorage:
    """文件存储管理器"""

    def __init__(self):
        self.files: Dict[str, FileInfo] = {}

    def save_file(self, file_info: FileInfo) -> bool:
        """保存文件信息"""
        self.files[file_info.id] = file_info
        return True

    def get_file(self, file_id: str) -> Optional[FileInfo]:
        """获取文件信息"""
        return self.files.get(file_id)

    def delete_file(self, file_id: str) -> bool:
        """删除文件"""
        if file_id not in self.files:
            return False

        file_info = self.files[file_id]
        file_path = UPLOAD_DIR / file_info.category / file_info.filename

        # 删除物理文件
        if file_path.exists():
            file_path.unlink()

        # 删除记录
        del self.files[file_id]
        return True

    def list_files(self, category: Optional[str] = None, limit: int = 100) -> List[FileInfo]:
        """列出文件"""
        files = list(self.files.values())

        if category:
            files = [f for f in files if f.category == category]

        # 按上传时间排序
        files.sort(key=lambda x: x.upload_time, reverse=True)
        return files[:limit]

    def get_files_by_category(self) -> Dict[str, List[FileInfo]]:
        """按分类获取文件"""
        result = {}
        for category in ALLOWED_EXTENSIONS.keys():
            result[category] = [f for f in self.files.values() if f.category == category]
        return result

# 全局文件存储实例
file_storage = FileStorage()

# ==============================
# 辅助函数
# ==============================

def get_file_category(filename: str) -> str:
    """根据文件扩展名获取分类"""
    ext = Path(filename).suffix.lower()
    for category, extensions in ALLOWED_EXTENSIONS.items():
        if ext in extensions:
            return category
    return 'other'

def validate_file(file: UploadFile) -> tuple[bool, str, str]:
    """验证文件"""
    # 检查文件名
    if not file.filename:
        return False, "文件名不能为空", ""

    # 获取文件扩展名
    ext = Path(file.filename).suffix.lower()
    category = get_file_category(file.filename)

    if category == 'other':
        return False, f"不支持的文件类型: {ext}", ""

    # 检查文件大小
    if file.size and file.size > MAX_FILE_SIZES[category]:
        max_size_mb = MAX_FILE_SIZES[category] / (1024 * 1024)
        return False, f"文件大小超过限制: {max_size_mb}MB", ""

    return True, "", category

def generate_unique_filename(original_filename: str) -> str:
    """生成唯一文件名"""
    ext = Path(original_filename).suffix
    unique_id = str(uuid.uuid4())
    return f"{unique_id}{ext}"

def get_mime_type(filename: str) -> str:
    """获取MIME类型"""
    mime_type, _ = mimetypes.guess_type(filename)
    return mime_type or "application/octet-stream"

async def save_upload_file(file: UploadFile, category: str, filename: str) -> bool:
    """保存上传文件"""
    try:
        file_path = UPLOAD_DIR / category / filename

        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        return True
    except Exception as e:
        print(f"保存文件失败: {e}")
        return False

async def process_file_content(file_info: FileInfo) -> Dict[str, Any]:
    """处理文件内容，提取有用信息"""
    file_path = UPLOAD_DIR / file_info.category / file_info.filename
    content_info = {}

    try:
        if file_info.category == 'image':
            # 处理图片文件
            content_info = await process_image_file(file_path)
        elif file_info.category == 'document':
            # 处理文档文件
            content_info = await process_document_file(file_path)
        elif file_info.category == 'data':
            # 处理数据文件
            content_info = await process_data_file(file_path)

    except Exception as e:
        content_info = {"error": str(e)}

    return content_info

async def process_image_file(file_path: Path) -> Dict[str, Any]:
    """处理图片文件"""
    try:
        # 这里可以集成图片处理库，如Pillow
        file_size = file_path.stat().st_size

        return {
            "type": "image",
            "size": file_size,
            "dimensions": "unknown",  # 需要Pillow库来获取尺寸
            "format": file_path.suffix[1:].upper(),
            "can_visualize": True,
            "suggested_charts": ["image_display", "image_analysis"]
        }
    except Exception as e:
        return {"error": f"图片处理失败: {str(e)}"}

async def process_document_file(file_path: Path) -> Dict[str, Any]:
    """处理文档文件"""
    try:
        # 这里可以集成文档处理库
        content = ""
        if file_path.suffix.lower() in ['.txt', '.md']:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()[:1000]  # 读取前1000字符

        return {
            "type": "document",
            "size": file_path.stat().st_size,
            "format": file_path.suffix[1:].upper(),
            "content_preview": content,
            "can_visualize": False,
            "suggested_actions": ["extract_text", "summarize"]
        }
    except Exception as e:
        return {"error": f"文档处理失败: {str(e)}"}

async def process_data_file(file_path: Path) -> Dict[str, Any]:
    """处理数据文件"""
    try:
        # 这里可以集成数据处理库，如pandas
        return {
            "type": "data",
            "size": file_path.stat().st_size,
            "format": file_path.suffix[1:].upper(),
            "can_visualize": True,
            "suggested_charts": ["bar_chart", "line_chart", "pie_chart", "scatter_plot"]
        }
    except Exception as e:
        return {"error": f"数据文件处理失败: {str(e)}"}

# ==============================
# API端点实现
# ==============================

@router.post("/upload", response_model=FileUploadResponse)
async def upload_file(file: UploadFile = File(...)):
    """上传文件"""
    try:
        # 验证文件
        is_valid, error_msg, category = validate_file(file)
        if not is_valid:
            return FileUploadResponse(
                success=False,
                message="文件验证失败",
                error=error_msg
            )

        # 生成唯一文件名
        unique_filename = generate_unique_filename(file.filename)

        # 保存文件
        save_success = await save_upload_file(file, category, unique_filename)
        if not save_success:
            return FileUploadResponse(
                success=False,
                message="文件保存失败",
                error="服务器存储错误"
            )

        # 创建文件信息
        file_info = FileInfo(
            id=str(uuid.uuid4()),
            filename=unique_filename,
            original_filename=file.filename,
            file_type=category,
            category=category,
            file_size=file.size or 0,
            mime_type=get_mime_type(file.filename),
            upload_time=datetime.now(),
            url=f"/api/v3/files/{category}/{unique_filename}"
        )

        # 处理文件内容
        content_info = await process_file_content(file_info)
        file_info.metadata.update(content_info)

        # 保存文件信息
        file_storage.save_file(file_info)

        return FileUploadResponse(
            success=True,
            message="文件上传成功",
            file_info=file_info
        )

    except Exception as e:
        return FileUploadResponse(
            success=False,
            message="文件上传失败",
            error=str(e)
        )

@router.get("/list", response_model=FileListResponse)
async def list_files(category: Optional[str] = None, limit: int = 100):
    """获取文件列表"""
    try:
        files = file_storage.list_files(category, limit)

        return FileListResponse(
            files=files,
            total=len(files),
            category=category
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取文件列表失败: {str(e)}")

@router.get("/files/{file_id}", response_model=FileInfo)
async def get_file_info(file_id: str):
    """获取文件信息"""
    file_info = file_storage.get_file(file_id)
    if not file_info:
        raise HTTPException(status_code=404, detail="文件不存在")

    return file_info

@router.get("/download/{file_id}")
async def download_file(file_id: str):
    """下载文件"""
    file_info = file_storage.get_file(file_id)
    if not file_info:
        raise HTTPException(status_code=404, detail="文件不存在")

    file_path = UPLOAD_DIR / file_info.category / file_info.filename
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="物理文件不存在")

    return FileResponse(
        path=file_path,
        filename=file_info.original_filename,
        media_type=file_info.mime_type
    )

@router.delete("/files/{file_id}")
async def delete_file(file_id: str):
    """删除文件"""
    success = file_storage.delete_file(file_id)
    if not success:
        raise HTTPException(status_code=404, detail="文件不存在")

    return {"success": True, "message": "文件已删除"}

@router.post("/process", response_model=Dict[str, Any])
async def process_file(request: FileProcessingRequest):
    """处理文件内容"""
    try:
        file_info = file_storage.get_file(request.file_id)
        if not file_info:
            raise HTTPException(status_code=404, detail="文件不存在")

        file_path = UPLOAD_DIR / file_info.category / file_info.filename

        result = {
            "file_id": request.file_id,
            "processing_type": request.processing_type,
            "file_info": file_info.dict()
        }

        # 根据处理类型执行不同操作
        if request.processing_type == "extract_text":
            result["result"] = await extract_text_from_file(file_path, file_info.category)
        elif request.processing_type == "analyze_image":
            result["result"] = await analyze_image_file(file_path)
        elif request.processing_type == "generate_chart":
            result["result"] = await generate_chart_from_file(file_path, request.parameters)
        else:
            raise HTTPException(status_code=400, detail=f"不支持的处理类型: {request.processing_type}")

        return result

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"文件处理失败: {str(e)}")

# ==============================
# 文件处理函数
# ==============================

async def extract_text_from_file(file_path: Path, category: str) -> Dict[str, Any]:
    """从文件中提取文本"""
    try:
        if category == 'document':
            if file_path.suffix.lower() in ['.txt', '.md']:
                with open(file_path, 'r', encoding='utf-8') as f:
                    content = f.read()

                return {
                    "success": True,
                    "text": content,
                    "length": len(content),
                    "lines": len(content.split('\n'))
                }

        return {
            "success": False,
            "error": "不支持从该文件类型提取文本"
        }

    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }

async def analyze_image_file(file_path: Path) -> Dict[str, Any]:
    """分析图片文件"""
    try:
        # 这里可以集成图片分析库
        file_size = file_path.stat().st_size

        return {
            "success": True,
            "file_size": file_size,
            "format": file_path.suffix[1:].upper(),
            "analysis": "图片分析功能需要集成专门的处理库"
        }

    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }

async def generate_chart_from_file(file_path: Path, parameters: Dict[str, Any]) -> Dict[str, Any]:
    """从数据文件生成图表"""
    try:
        # 这里可以集成数据分析库
        return {
            "success": True,
            "message": "数据文件图表生成功能需要集成数据分析库",
            "file_type": file_path.suffix[1:].upper(),
            "parameters": parameters
        }

    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }

@router.get("/stats")
async def get_file_stats():
    """获取文件统计信息"""
    try:
        files_by_category = file_storage.get_files_by_category()

        stats = {
            "total_files": len(file_storage.files),
            "categories": {}
        }

        for category, files in files_by_category.items():
            total_size = sum(f.file_size for f in files)
            stats["categories"][category] = {
                "count": len(files),
                "total_size": total_size,
                "total_size_mb": round(total_size / (1024 * 1024), 2)
            }

        return stats

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取统计信息失败: {str(e)}")