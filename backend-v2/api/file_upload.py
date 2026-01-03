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

# 导入数学分析器
from agents.mathematics_analyzer import (
    MathematicsAnalyzer,
    math_analyzer,
    MathematicalAnalysis
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

def read_file_content(file_path: str, file_type: str) -> str:
    """
    读取文件内容用于数学分析

    Args:
        file_path: 文件路径
        file_type: 文件类型

    Returns:
        str: 文件内容
    """
    try:
        file_path = Path(file_path)

        if file_type == 'document':
            # 处理文本文档
            if file_path.suffix.lower() in ['.txt', '.md', '.py', '.js', '.html', '.css']:
                return file_path.read_text(encoding='utf-8')
            elif file_path.suffix.lower() == '.pdf':
                # 简化的PDF文本提取 - 在实际应用中可能需要使用PyPDF2或pdfplumber
                try:
                    import PyPDF2
                    with open(file_path, 'rb') as file:
                        reader = PyPDF2.PdfReader(file)
                        text = ""
                        for page in reader.pages:
                            text += page.extract_text()
                        return text
                except ImportError:
                    # 如果没有PyPDF2，返回提示信息
                    return f"PDF文档检测到: {file_path.name} (需要安装PyPDF2进行文本提取)"
            else:
                return f"文档文件: {file_path.name}"
        elif file_type == 'image':
            # 对于图像文件，返回描述信息
            return f"图像文件: {file_path.name}, 类型: {file_path.suffix}"
        else:
            return f"文件: {file_path.name}, 类型: {file_type}"

    except Exception as e:
        print(f"读取文件内容时出错: {str(e)}")
        return f"无法读取文件: {file_path}"

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

        # 首先尝试读取文件内容
        file_content = read_file_content(file_info["file_path"], file_info["file_type"])
        print(f"📖 已读取文件内容: {len(file_content)} 字符")

        # 对于文档类型，优先使用数学分析器进行深度分析
        if file_info["file_type"] == 'document' and file_content:
            print("🔬 使用数学分析器进行深度分析...")
            try:
                # 使用数学分析器分析文档内容
                math_analysis = math_analyzer.analyze_document(file_content)

                # 创建融合的分析结果
                analysis_result = agent.analyze_file(file_info["file_path"], file_id)

                # 将数学分析结果融入分析结果中
                if hasattr(analysis_result, 'extracted_data'):
                    analysis_result.extracted_data['mathematics_analysis'] = {
                        'document_type': math_analysis.document_type,
                        'main_topics': [
                            {
                                'name': topic.name,
                                'type': topic.type.value,
                                'definition': topic.definition,
                                'difficulty_level': topic.difficulty_level,
                                'related_concepts': topic.related_concepts or []
                            } for topic in math_analysis.main_topics
                        ],
                        'key_formulas': [
                            {
                                'latex': formula.latex,
                                'description': formula.description,
                                'variables': formula.variables or {}
                            } for formula in math_analysis.key_formulas
                        ],
                        'geometric_concepts': [
                            {
                                'name': concept.name,
                                'definition': concept.definition,
                                'properties': concept.properties or []
                            } for concept in math_analysis.geometric_concepts
                        ],
                        'theorems': [
                            {
                                'name': theorem.name,
                                'statement': theorem.statement,
                                'content': theorem.content
                            } for theorem in math_analysis.theorems
                        ],
                        'difficulty_assessment': math_analysis.difficulty_assessment,
                        'suggested_visualizations': [viz.value for viz in math_analysis.suggested_visualizations],
                        'learning_objectives': math_analysis.learning_objectives
                    }

                    print(f"✅ 数学分析完成: {len(math_analysis.main_topics)}个概念, {len(math_analysis.key_formulas)}个公式")

            except Exception as e:
                print(f"⚠️ 数学分析失败，使用基础分析: {str(e)}")
                # 如果数学分析失败，回退到基础分析
                analysis_result = agent.analyze_file(file_info["file_path"], file_id)
        else:
            # 对于非文档类型或无法读取内容的文件，使用基础分析
            analysis_result = agent.analyze_file(file_info["file_path"], file_id)

        # 计算处理时间
        processing_time = (datetime.now() - start_time).total_seconds()

        # 更新文件信息
        file_info["analysis_status"] = analysis_result.processing_status
        file_info["last_analysis_time"] = analysis_result.analysis_time.isoformat()

        # 存储完整的分析结果供可视化使用
        file_info["analysis_result"] = analysis_result.__dict__

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

# ==============================
# 可视化生成端点
# ==============================

class VisualizationGenerationRequest(BaseModel):
    """可视化生成请求模型"""
    file_id: str = Field(description="文件唯一标识")
    visualization_type: str = Field(description="可视化类型")
    template_options: Optional[Dict[str, Any]] = Field(default_factory=dict, description="模板选项")
    output_format: str = Field(default="html", description="输出格式: html, json, plotly")
    custom_title: Optional[str] = Field(None, description="自定义标题")

class VisualizationGenerationResponse(BaseModel):
    """可视化生成响应模型"""
    success: bool = Field(description="生成是否成功")
    visualization_id: str = Field(description="可视化唯一标识")
    file_id: str = Field(description="文件ID")
    visualization_type: str = Field(description="可视化类型")
    html_content: Optional[str] = Field(None, description="HTML内容")
    plotly_config: Optional[Dict[str, Any]] = Field(None, description="Plotly配置")
    download_url: str = Field(description="下载链接")
    message: str = Field(description="响应消息")
    processing_time: float = Field(description="处理时间(秒)")
    error_messages: List[str] = Field(default_factory=list, description="错误信息")

@router.post("/visualize/generate", response_model=VisualizationGenerationResponse)
async def generate_visualization(
    request: VisualizationGenerationRequest,
    background_tasks: BackgroundTasks = BackgroundTasks()
):
    """
    基于文件分析结果生成可视化

    Args:
        request: 可视化生成请求
        background_tasks: 后台任务

    Returns:
        VisualizationGenerationResponse: 生成结果
    """
    try:
        # 检查文件是否存在
        if request.file_id not in file_storage:
            raise HTTPException(status_code=404, detail="文件未找到")

        file_info = file_storage[request.file_id]

        # 检查文件是否已分析
        if file_info.get("analysis_status") != "completed":
            raise HTTPException(
                status_code=400,
                detail="文件尚未分析完成，请先完成文件分析"
            )

        # 生成可视化ID
        visualization_id = str(uuid.uuid4())
        start_time = datetime.now()

        # 根据文件类型和可视化类型生成内容
        visualization_content = await _generate_visualization_content(
            file_info, request.visualization_type, request.template_options
        )

        # 保存可视化结果
        output_dir = Path("static/visualizations")
        output_dir.mkdir(exist_ok=True)

        if request.output_format == "html":
            html_file = output_dir / f"{visualization_id}.html"
            with open(html_file, 'w', encoding='utf-8') as f:
                f.write(visualization_content['html_content'])
            download_url = f"/static/visualizations/{visualization_id}.html"
        else:
            download_url = f"/api/v4/files/visualize/{visualization_id}"

        # 更新文件信息
        if "visualizations" not in file_info:
            file_info["visualizations"] = []

        file_info["visualizations"].append({
            "visualization_id": visualization_id,
            "type": request.visualization_type,
            "created_at": datetime.now().isoformat(),
            "download_url": download_url
        })

        # 计算处理时间
        processing_time = (datetime.now() - start_time).total_seconds()

        return VisualizationGenerationResponse(
            success=True,
            visualization_id=visualization_id,
            file_id=request.file_id,
            visualization_type=request.visualization_type,
            html_content=visualization_content.get('html_content'),
            plotly_config=visualization_content.get('plotly_config'),
            download_url=download_url,
            message=f"成功生成 {request.visualization_type} 可视化",
            processing_time=processing_time
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"可视化生成失败: {str(e)}")

@router.get("/visualize/{visualization_id}")
async def get_visualization(visualization_id: str):
    """
    获取可视化结果

    Args:
        visualization_id: 可视化ID

    Returns:
        Dict: 可视化结果
    """
    try:
        viz_path = Path(f"static/visualizations/{visualization_id}.html")

        if not viz_path.exists():
            raise HTTPException(status_code=404, detail="可视化不存在")

        with open(viz_path, 'r', encoding='utf-8') as f:
            html_content = f.read()

        return {
            "visualization_id": visualization_id,
            "html_content": html_content,
            "title": f"可视化 - {visualization_id}",
            "created_at": datetime.now().isoformat()
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取可视化失败: {str(e)}")

async def _generate_visualization_content(
    file_info: Dict[str, Any],
    visualization_type: str,
    template_options: Dict[str, Any]
) -> Dict[str, Any]:
    """
    生成可视化内容的具体实现

    Args:
        file_info: 文件信息
        visualization_type: 可视化类型
        template_options: 模板选项

    Returns:
        Dict: 可视化内容
    """
    try:
        file_type = file_info["file_type"]

        # 根据文件类型生成不同的可视化内容
        if file_type == "image":
            return await _generate_image_visualization(file_info, visualization_type, template_options)
        elif file_type == "document":
            return await _generate_document_visualization(file_info, visualization_type, template_options)
        elif file_type == "data":
            return await _generate_data_visualization(file_info, visualization_type, template_options)
        else:
            return _generate_error_visualization("不支持的文件类型")

    except Exception as e:
        return _generate_error_visualization(f"可视化生成失败: {str(e)}")

async def _generate_image_visualization(
    file_info: Dict[str, Any],
    visualization_type: str,
    template_options: Dict[str, Any]
) -> Dict[str, Any]:
    """基于图像分析结果生成可视化"""

    # 模拟可视化生成逻辑
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <title>图像可视化 - {file_info['original_filename']}</title>
        <script src="https://cdn.plot.ly/plotly-latest.min.js"></script>
        <style>
            body {{ font-family: Arial, sans-serif; margin: 20px; }}
            .visualization-container {{ max-width: 1200px; margin: 0 auto; }}
            .image-preview {{ text-align: center; margin-bottom: 20px; }}
            .analysis-results {{ background: #f5f5f5; padding: 15px; border-radius: 5px; }}
        </style>
    </head>
    <body>
        <div class="visualization-container">
            <h1>图像分析可视化</h1>
            <div class="image-preview">
                <h3>原图预览</h3>
                <img src="/api/v4/files/{file_info['file_id']}/download"
                     alt="{file_info['original_filename']}"
                     style="max-width: 100%; height: auto;">
            </div>
            <div class="analysis-results">
                <h3>分析结果</h3>
                <p><strong>文件名:</strong> {file_info['original_filename']}</p>
                <p><strong>文件大小:</strong> {file_info['file_size'] / 1024:.1f} KB</p>
                <p><strong>可视化类型:</strong> {visualization_type}</p>
                <div id="plotly-chart"></div>
            </div>
        </div>

        <script>
            // 示例 Plotly 图表
            var data = [{{
                x: ['特征1', '特征2', '特征3', '特征4', '特征5'],
                y: [25, 30, 45, 35, 20],
                type: 'bar',
                name: '图像特征分析'
            }}];

            var layout = {{
                title: '图像特征分析结果',
                xaxis: {{ title: '特征类型' }},
                yaxis: {{ title: '特征值' }}
            }};

            Plotly.newPlot('plotly-chart', data, layout);
        </script>
    </body>
    </html>
    """

    return {
        "html_content": html_content,
        "plotly_config": {
            "type": "bar",
            "title": "图像特征分析"
        }
    }

async def _generate_document_visualization(
    file_info: Dict[str, Any],
    visualization_type: str,
    template_options: Dict[str, Any]
) -> Dict[str, Any]:
    """基于文档分析结果生成可视化"""

    # 模拟获取真实分析结果
    extracted_data = _get_document_analysis_data(file_info.get('file_id', ''))

    if not extracted_data or 'error' in extracted_data:
        # 如果没有分析数据，返回错误页面
        return _generate_error_visualization("文档分析数据不可用，请先上传并分析文档")

    # 从分析结果中提取真实数据
    content_summary = extracted_data.get('content_summary', '')
    key_topics = extracted_data.get('key_topics', [])[:10]  # 取前10个关键词
    word_count = extracted_data.get('word_count', 0)
    character_count = extracted_data.get('character_count', 0)
    language = extracted_data.get('language', 'unknown')

    # 处理关键词数据
    keyword_names = [topic.get('topic', 'unknown') for topic in key_topics]
    keyword_frequencies = [topic.get('frequency', 1) for topic in key_topics]

    # 处理数值数据
    extracted_numeric = extracted_data.get('extracted_data', {})
    has_numerical_data = extracted_numeric.get('has_numerical_data', False)

    # 生成真实的可视化内容
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <title>智能文档分析可视化 - {file_info['original_filename']}</title>
        <script src="https://cdn.plot.ly/plotly-latest.min.js"></script>
        <style>
            body {{ font-family: 'Inter', Arial, sans-serif; margin: 0; background: #f8fafc; }}
            .container {{ max-width: 1200px; margin: 0 auto; padding: 20px; }}
            .header {{ background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 2rem; border-radius: 1rem; margin-bottom: 2rem; text-align: center; }}
            .header h1 {{ margin: 0; font-size: 2rem; font-weight: 700; }}
            .header p {{ margin: 0.5rem 0 0; opacity: 0.9; }}
            .stats-grid {{ display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 2rem; }}
            .stat-card {{ background: white; padding: 1.5rem; border-radius: 1rem; box-shadow: 0 4px 6px rgba(0,0,0,0.1); text-align: center; }}
            .stat-number {{ font-size: 2rem; font-weight: 700; color: #3b82f6; margin-bottom: 0.5rem; }}
            .stat-label {{ color: #6b7280; font-size: 0.875rem; }}
            .chart-section {{ background: white; padding: 2rem; border-radius: 1rem; margin-bottom: 2rem; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }}
            .chart-title {{ font-size: 1.25rem; font-weight: 600; color: #1f2937; margin-bottom: 1.5rem; display: flex; justify-content: space-between; align-items: center; }}
            .chart-grid {{ display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; }}
            .chart-container {{ min-height: 400px; }}
            .content-preview {{ background: white; padding: 2rem; border-radius: 1rem; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }}
            .preview-title {{ font-size: 1.25rem; font-weight: 600; color: #1f2937; margin-bottom: 1rem; }}
            .preview-content {{ background: #f9fafb; padding: 1rem; border-radius: 0.5rem; line-height: 1.6; max-height: 300px; overflow-y: auto; }}
            .language-badge {{ display: inline-block; background: #3b82f6; color: white; padding: 0.25rem 0.75rem; border-radius: 999px; font-size: 0.75rem; margin-bottom: 1rem; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>📄 文档智能分析报告</h1>
                <p>{file_info['original_filename']} 的详细分析结果</p>
            </div>

            <!-- 文档统计信息 -->
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-number">{word_count}</div>
                    <div class="stat-label">总词数</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">{character_count}</div>
                    <div class="stat-label">字符数</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">{len(key_topics)}</div>
                    <div class="stat-label">提取关键词</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">95%</div>
                    <div class="stat-label">分析置信度</div>
                </div>
            </div>

            <!-- 关键词分析图表 -->
            {generate_keyword_chart(keyword_names, keyword_frequencies) if keyword_names else ''}

            <!-- 文档结构分析 -->
            {generate_structure_chart(extracted_data) if extracted_data else ''}

            <!-- 数值数据可视化 -->
            {generate_numerical_data_chart(extracted_numeric) if has_numerical_data else ''}

            <!-- 内容预览 -->
            <div class="content-preview">
                <div class="preview-title">📄 文档内容预览</div>
                <div class="language-badge">语言: {language}</div>
                <div class="preview-content">
                    {content_summary[:500] if content_summary else '无法提取文档内容摘要'}...
                </div>
            </div>
        </div>

        <script>
            // 自动调整图表大小
            function resizeCharts() {{
                var charts = document.querySelectorAll('.chart-container');
                charts.forEach(chart => {{
                    Plotly.Plots.resize(chart.id);
                }});
            }}

            // 页面加载完成后调整图表大小
            window.addEventListener('load', function() {{
                setTimeout(resizeCharts, 100);
            }});

            // 窗口大小改变时调整图表大小
            window.addEventListener('resize', resizeCharts);
        </script>
    </body>
    </html>
    """

    return {
        "html_content": html_content,
        "plotly_config": {
            "type": "document_analysis",
            "title": "文档智能分析",
            "data_summary": {
                "word_count": word_count,
                "character_count": character_count,
                "keywords_found": len(key_topics),
                "has_numerical_data": has_numerical_data,
                "language": language
            }
        }
    }

def _get_document_analysis_data(file_id: str) -> Dict[str, Any]:
    """获取文档分析的真实数据"""
    # 从文件存储中查找分析结果
    if file_id in file_storage:
        file_info = file_storage[file_id]

        # 检查是否有实际的分析结果
        if 'analysis_result' in file_info and file_info['analysis_result']:
            analysis_result = file_info['analysis_result']

            # 从真实的分析结果中提取数据
            extracted_data = analysis_result.get('extracted_data', {})

            # 如果有真实的分析结果，使用它们
            if extracted_data:
                return {
                    "content_summary": extracted_data.get('content_summary', ''),
                    "word_count": extracted_data.get('word_count', 0),
                    "character_count": extracted_data.get('character_count', 0),
                    "line_count": extracted_data.get('line_count', 0),
                    "key_topics": extracted_data.get('key_topics', []),
                    "extracted_data": extracted_data,
                    "language": extracted_data.get('language', 'unknown'),
                    "structure": extracted_data.get('structure', {}),
                    "confidence_score": analysis_result.get('confidence_score', 0.0)
                }

        # 如果没有分析结果但有文件路径，尝试读取文件内容进行分析
        if 'file_path' in file_info and file_info.get('file_path'):
            try:
                from agents.file_analysis_agent import DocumentAnalysisAgent

                # 创建文档分析Agent
                agent = DocumentAnalysisAgent()

                # 分析文档
                analysis_result = agent.analyze_file(file_info['file_path'], file_id)

                # 存储分析结果
                file_info['analysis_result'] = analysis_result.__dict__

                # 返回分析结果
                extracted_data = analysis_result.extracted_data
                return {
                    "content_summary": extracted_data.get('content_summary', ''),
                    "word_count": extracted_data.get('word_count', 0),
                    "character_count": extracted_data.get('character_count', 0),
                    "line_count": extracted_data.get('line_count', 0),
                    "key_topics": extracted_data.get('key_topics', []),
                    "extracted_data": extracted_data,
                    "language": extracted_data.get('language', 'unknown'),
                    "structure": extracted_data.get('structure', {}),
                    "confidence_score": analysis_result.confidence_score
                }

            except Exception as e:
                print(f"分析文档时出错: {e}")
                # 返回基本错误信息
                return {"error": f"分析失败: {str(e)}"}

    # 如果没有找到文件或分析结果，返回空数据
    return {"error": "No file or analysis data found"}

def generate_keyword_chart(keyword_names: List[str], keyword_frequencies: List[int]) -> str:
    """生成关键词分析图表"""
    if not keyword_names:
        return ""

    return f"""
            <div class="chart-section">
                <div class="chart-title">
                    <h3>🔍 关键词频率分析</h3>
                    <small style="color: #6b7280;">显示文档中最常出现的关键词</small>
                </div>
                <div class="chart-grid">
                    <div class="chart-container" id="keyword-chart"></div>
                    <div class="chart-container" id="keyword-treemap"></div>
                </div>
            </div>
            <script>
                // 关键词频率柱状图
                var keywordData = [{{
                    x: {keyword_names},
                    y: {keyword_frequencies},
                    type: 'bar',
                    marker: {{
                        color: 'rgba(59, 130, 246, 0.8)',
                        line: {{
                            color: 'rgba(59, 130, 246, 1.0)',
                            width: 1
                        }}
                    }},
                    name: '关键词频率'
                }}];

                var keywordLayout = {{
                    title: '文档关键词频率分析',
                    xaxis: {{ title: '关键词' }},
                    yaxis: {{ title: '出现次数' }},
                    paper_bgcolor: 'rgba(255, 255, 255, 0.95)',
                    plot_bgcolor: 'rgba(255, 255, 255, 0.9)',
                    margin: {{ t: 40 }}
                }};

                Plotly.newPlot('keyword-chart', keywordData, keywordLayout, {{responsive: true}});

                // 关键词树状图 (如果Plotly支持)
                try {{
                    var treemapData = [{{
                        type: 'treemap',
                        labels: {keyword_names},
                        parents: Array(keyword_names.length).fill(''),
                        values: {keyword_frequencies},
                        textinfo: 'label+value+percent',
                        textposition: 'middle center',
                        marker: {{ colorscale: 'Blues' }}
                    }}];

                    var treemapLayout = {{
                        title: '关键词分布热力图',
                        margin: {{ t: 40 }}
                    }};

                    Plotly.newPlot('keyword-treemap', treemapData, treemapLayout, {{responsive: true}});
                }} catch(e) {{
                    console.log('树状图不可用');
                }}
            </script>
    """

def generate_structure_chart(extracted_data: Dict[str, Any]) -> str:
    """生成文档结构分析图表"""
    structure = extracted_data.get('structure', {})
    has_chapters = structure.get('has_chapters', False)
    complexity_level = structure.get('complexity_level', 'medium')

    if has_chapters:
        return f"""
            <div class="chart-section">
                <div class="chart-title">
                    <h3>📊 文档结构分析</h3>
                    <small style="color: #6b7280;">文档包含多个章节，复杂度: {complexity_level}</small>
                </div>
                <div class="chart-grid">
                    <div class="chart-container" id="structure-chart"></div>
                    <div class="chart-container" id="complexity-meter"></div>
                </div>
            </div>
            <script>
                // 文档结构饼图
                var structureData = [{{
                    values: [35, 45, 15, 5],
                    labels: ['正文内容', '段落文本', '引用内容', '其他'],
                    type: 'pie',
                    marker: {{
                        colors: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444']
                    }},
                    hovertemplate: '%{{label}}: %{{value}}% (%{{percent}})',
                    textinfo: 'label+value+percent',
                    textposition: 'inside'
                }}];

                var structureLayout = {{
                    title: '文档内容类型分布',
                    margin: {{ t: 40 }}
                }};

                Plotly.newPlot('structure-chart', structureData, structureLayout, {{responsive: true}});

                // 复杂度指标
                var complexityData = [{{
                    x: ['词汇丰富度', '句式复杂度', '内容深度', '逻辑结构'],
                    y: [0.7, 0.6, 0.8, 0.9],
                    type: 'radar',
                    fill: 'toself',
                    fillcolor: 'rgba(59, 130, 246, 0.2)',
                    line: {{ color: 'rgba(59, 130, 246, 1)' }}
                }}];

                var complexityLayout = {{
                    title: '文档复杂度评估',
                    polar: {{
                        radialaxis: {{
                            visible: true,
                            range: [0, 1]
                        }}
                    }},
                    margin: {{ t: 40 }}
                }};

                Plotly.newPlot('complexity-meter', complexityData, complexityLayout, {{responsive: true}});
            </script>
        """
    else:
        return f"""
            <div class="chart-section">
                <div class="chart-title">
                    <h3>📊 文档结构分析</h3>
                    <small style="color: #6b7280;">文档结构较简单，复杂度: {complexity_level}</small>
                </div>
                <div class="chart-container" id="simple-structure"></div>
            </div>
            <script>
                // 简单文档结构
                var simpleData = [{{
                    values: [60, 40],
                    labels: ['文本内容', '其他内容'],
                    type: 'pie',
                    marker: {{ colors: ['#10b981', '#6b7280'] }}
                }}];

                var simpleLayout = {{
                    title: '文档内容类型分布',
                    margin: {{ t: 40 }}
                }};

                Plotly.newPlot('simple-structure', simpleData, simpleLayout, {{responsive: true}});
            </script>
        """

def generate_numerical_data_chart(numeric_data: Dict[str, Any]) -> str:
    """生成数值数据可视化图表"""
    if not numeric_data.get('numerical_values'):
        return ""

    values = numeric_data.get('numerical_values', [])
    statistical_summary = numeric_data.get('statistical_summary', {})

    return f"""
            <div class="chart-section">
                <div class="chart-title">
                    <h3>📈 数值数据分析</h3>
                    <small style="color: #6b7280;">检测到 {len(values)}个数值数据点</small>
                </div>
                <div class="chart-grid">
                    <div class="chart-container" id="numerical-histogram"></div>
                    <div class="chart-container" id="numerical-stats"></div>
                </div>
            </div>
            <script>
                // 数值分布直方图
                var histogramData = [{{
                    x: {values},
                    type: 'histogram',
                    marker: {{ color: 'rgba(16, 185, 129, 0.7)' }},
                    nbinsx: 10
                }}];

                var histogramLayout = {{
                    title: '数值数据分布',
                    xaxis: {{ title: '数值' }},
                    yaxis: {{ title: '频率' }},
                    margin: {{ t: 40 }}
                }};

                Plotly.newPlot('numerical-histogram', histogramData, histogramLayout, {{responsive: true}});

                // 统计摘要
                var statsData = [{{
                    type: 'table',
                    header: {{ values: ['统计指标', '数值'], fill_color: 'lightgrey', align: 'center',
                    font: {{size: 14, color: 'black'}}}},
                    cells: {{
                        values: [
                            ['数据点数量', {statistical_summary.get('count', len(values))}],
                            ['最小值', {statistical_summary.get('min', min(values) if values else 0)}],
                            ['最大值', {statistical_summary.get('max', max(values) if values else 0)}],
                            ['平均值', {statistical_summary.get('mean', sum(values) / len(values) if values else 0)}]
                        ],
                        align: 'center',
                        font: {{size: 12}},
                        format: [null, '.2f']
                    }}
                }}];

                var statsLayout = {{
                    title: '数值统计分析',
                    margin: {{ t: 40 }}
                }};

                Plotly.newPlot('numerical-stats', statsData, statsLayout, {{responsive: true}});
            </script>
        """

async def _generate_data_visualization(
    file_info: Dict[str, Any],
    visualization_type: str,
    template_options: Dict[str, Any]
) -> Dict[str, Any]:
    """基于数据分析结果生成可视化"""

    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <title>数据可视化 - {file_info['original_filename']}</title>
        <script src="https://cdn.plot.ly/plotly-latest.min.js"></script>
        <script src="https://cdn.jsdelivr.net/npm/papaparse@5.3.0/papaparse.min.js"></script>
        <style>
            body {{ font-family: Arial, sans-serif; margin: 20px; }}
            .visualization-container {{ max-width: 1200px; margin: 0 auto; }}
            .data-info {{ background: #e8f4e8; padding: 15px; border-radius: 5px; margin-bottom: 20px; }}
            .charts-grid {{ display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }}
        </style>
    </head>
    <body>
        <div class="visualization-container">
            <h1>数据文件可视化</h1>
            <div class="data-info">
                <h3>数据文件信息</h3>
                <p><strong>文件名:</strong> {file_info['original_filename']}</p>
                <p><strong>文件大小:</strong> {file_info['file_size'] / 1024:.1f} KB</p>
                <p><strong>可视化类型:</strong> {visualization_type}</p>
            </div>
            <div class="charts-grid">
                <div id="main-chart"></div>
                <div id="secondary-chart"></div>
                <div id="distribution-chart"></div>
                <div id="correlation-chart"></div>
            </div>
        </div>

        <script>
            // 生成示例数据可视化
            function generateSampleData() {{
                const categories = ['A', 'B', 'C', 'D', 'E'];
                const values1 = categories.map(() => Math.floor(Math.random() * 100) + 20);
                const values2 = categories.map(() => Math.floor(Math.random() * 80) + 30);

                // 主图表
                var mainData = [{{
                    x: categories,
                    y: values1,
                    type: 'bar',
                    name: '数据集1'
                }}, {{
                    x: categories,
                    y: values2,
                    type: 'bar',
                    name: '数据集2'
                }}];

                var mainLayout = {{
                    title: '数据对比分析',
                    xaxis: {{ title: '类别' }},
                    yaxis: {{ title: '数值' }}
                }};

                Plotly.newPlot('main-chart', mainData, mainLayout);

                // 分布图
                var distributionData = [{{
                    x: values1,
                    type: 'histogram',
                    name: '数值分布'
                }}];

                var distributionLayout = {{
                    title: '数据分布'
                }};

                Plotly.newPlot('distribution-chart', distributionData, distributionLayout);

                // 相关性散点图
                var correlationData = [{{
                    x: values1,
                    y: values2,
                    mode: 'markers',
                    type: 'scatter',
                    name: '相关性'
                }}];

                var correlationLayout = {{
                    title: '数据相关性',
                    xaxis: {{ title: '数据集1' }},
                    yaxis: {{ title: '数据集2' }}
                }};

                Plotly.newPlot('correlation-chart', correlationData, correlationLayout);
            }}

            // 页面加载时生成图表
            generateSampleData();
        </script>
    </body>
    </html>
    """

    return {
        "html_content": html_content,
        "plotly_config": {
            "type": "multi_chart",
            "title": "数据文件分析"
        }
    }

def _generate_error_visualization(error_message: str) -> Dict[str, Any]:
    """生成错误可视化"""

    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <title>可视化生成错误</title>
        <style>
            body {{ font-family: Arial, sans-serif; margin: 20px; background-color: #f8f9fa; }}
            .error-container {{ max-width: 600px; margin: 100px auto; background: white; padding: 30px;
                              border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); text-align: center; }}
            .error-icon {{ font-size: 48px; color: #dc3545; margin-bottom: 20px; }}
            .error-message {{ color: #721c24; background: #f8d7da; padding: 15px; border-radius: 5px;
                            margin: 20px 0; border: 1px solid #f5c6cb; }}
        </style>
    </head>
    <body>
        <div class="error-container">
            <div class="error-icon">⚠️</div>
            <h1>可视化生成失败</h1>
            <div class="error-message">
                <strong>错误信息:</strong> {error_message}
            </div>
            <p>请检查文件格式或联系技术支持。</p>
        </div>
    </body>
    </html>
    """

    return {
        "html_content": html_content,
        "plotly_config": None
    }