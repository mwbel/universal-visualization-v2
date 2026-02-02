"""
PDF 教材处理 Agent
支持通过 API 调用远程 MinerU 服务进行 OCR 和章节识别
"""
import os
import json
import requests
from typing import Dict, List, Optional, Any, Union
from pathlib import Path
import fitz  # PyMuPDF
from dataclasses import dataclass, asdict
import re


@dataclass
class ChapterInfo:
    """章信息"""
    number: int
    title: str
    page_start: int
    page_end: int
    sections: List[Dict[str, Any]] = None

    def to_dict(self):
        return asdict(self)


@dataclass
class SectionInfo:
    """节信息"""
    title: str
    page: int
    level: int  # 1=章, 2=节, 3=小节


class MinerUAPIClient:
    """MinerU API 客户端 - 调用远程服务器"""

    def __init__(
        self,
        base_url: str = None,
        api_key: str = None,
        timeout: int = 300
    ):
        """
        初始化 API 客户端

        Args:
            base_url: MinerU API 基础 URL
            api_key: API 密钥（如果需要）
            timeout: 请求超时时间（秒）
        """
        # 默认使用校园网服务器
        self.base_url = base_url or os.getenv(
            "MINERU_API_URL",
            "http://49.52.18.227:8000"  # 示例，需要根据实际 API 配置
        )
        self.api_key = api_key or os.getenv("MINERU_API_KEY")
        self.timeout = timeout

    def ocr_pdf(
        self,
        pdf_path: str,
        pages: str = "1-3",  # 默认只 OCR 前3页（目录页）
        output_format: str = "markdown"
    ) -> Dict[str, Any]:
        """
        对 PDF 进行 OCR 识别

        Args:
            pdf_path: PDF 文件路径
            pages: 页码范围，如 "1-3", "1,5,10"
            output_format: 输出格式 (markdown, json, text)

        Returns:
            Dict: OCR 结果
        """
        # TODO: 实现实际的 API 调用
        # 现在先用本地实现作为占位符

        endpoint = f"{self.base_url}/api/ocr"
        headers = {}

        if self.api_key:
            headers["Authorization"] = f"Bearer {self.api_key}"

        # 准备文件
        if not os.path.exists(pdf_path):
            raise FileNotFoundError(f"PDF 文件不存在: {pdf_path}")

        # 实际实现时，这里应该发送文件到服务器
        # files = {"file": open(pdf_path, "rb")}
        # data = {"pages": pages, "format": output_format}
        # response = requests.post(endpoint, headers=headers, files=files, data=data, timeout=self.timeout)

        # 临时返回占位符
        return {
            "status": "pending",
            "message": "API 调用待实现 - 需要在服务器上部署 MinerU API"
        }

    def extract_table_of_contents(
        self,
        pdf_path: str,
        toc_pages: str = "1-5"
    ) -> List[Dict[str, Any]]:
        """
        提取目录结构

        Args:
            pdf_path: PDF 文件路径
            toc_pages: 目录页码范围

        Returns:
            List[Dict]: 目录结构
        """
        endpoint = f"{self.base_url}/api/toc"
        # TODO: 实现实际 API 调用
        return []

    def health_check(self) -> bool:
        """
        检查 API 服务健康状态

        Returns:
            bool: 服务是否可用
        """
        try:
            response = requests.get(
                f"{self.base_url}/health",
                timeout=5
            )
            return response.status_code == 200
        except:
            return False


class TextbookProcessorAgent:
    """PDF 教材处理 Agent"""

    def __init__(
        self,
        api_client: MinerUAPIClient = None,
        use_local_fallback: bool = True
    ):
        """
        初始化 Agent

        Args:
            api_client: MinerU API 客户端
            use_local_fallback: 是否在 API 不可用时使用本地 PyMuPDF
        """
        self.api_client = api_client or MinerUAPIClient()
        self.use_local_fallback = use_local_fallback
        self.supported_formats = ['.pdf']

    async def analyze_textbook(
        self,
        pdf_path: str,
        extract_toc: bool = True,
        use_ocr: bool = False
    ) -> Dict[str, Any]:
        """
        分析 PDF 教材

        Args:
            pdf_path: PDF 文件路径
            extract_toc: 是否提取目录
            use_ocr: 是否使用 OCR（针对扫描版 PDF）

        Returns:
            Dict: 分析结果
        """
        if not os.path.exists(pdf_path):
            raise FileNotFoundError(f"PDF 文件不存在: {pdf_path}")

        # 获取基本信息
        basic_info = self._get_pdf_basic_info(pdf_path)

        # 提取目录
        toc = None
        if extract_toc:
            toc = await self._extract_table_of_contents(pdf_path, use_ocr)

        # 章节分割
        chapters = None
        if toc:
            chapters = await self._parse_chapters_from_toc(toc, basic_info['total_pages'])

        return {
            "file_info": basic_info,
            "table_of_contents": toc,
            "chapters": chapters,
            "processing_method": "api" if not self.use_local_fallback else "local"
        }

    def _get_pdf_basic_info(self, pdf_path: str) -> Dict[str, Any]:
        """获取 PDF 基本信息"""
        doc = fitz.open(pdf_path)
        return {
            "total_pages": len(doc),
            "metadata": doc.metadata,
            "file_size": os.path.getsize(pdf_path),
            "filename": os.path.basename(pdf_path)
        }

    async def _extract_table_of_contents(
        self,
        pdf_path: str,
        use_ocr: bool
    ) -> Optional[List[Dict]]:
        """提取目录"""
        # 1. 尝试从 PDF 元数据提取 TOC
        doc = fitz.open(pdf_path)
        toc = doc.get_toc()

        if toc:
            # PyMuPDF 格式: (level, title, page_number)
            return [
                {
                    "level": item[0],
                    "title": item[1],
                    "page": item[2]
                }
                for item in toc
            ]

        # 2. 如果 PDF 没有 TOC，尝试 OCR
        if use_ocr:
            # 调用 MinerU API
            try:
                result = self.api_client.ocr_pdf(
                    pdf_path,
                    pages="1-5",  # 假设目录在前5页
                    output_format="markdown"
                )

                # TODO: 解析 OCR 结果提取目录
                # 现在返回空列表作为占位符
                return []

            except Exception as e:
                print(f"OCR 识别失败: {e}")
                if self.use_local_fallback:
                    # 3. 降级到本地文本提取
                    return self._extract_toc_from_text(pdf_path)
        else:
            if self.use_local_fallback:
                return self._extract_toc_from_text(pdf_path)

        return None

    def _extract_toc_from_text(self, pdf_path: str) -> List[Dict]:
        """从 PDF 文本中提取目录（本地降级方案）"""
        doc = fitz.open(pdf_path)
        toc_entries = []

        # 假设目录在前10页
        for page_num in range(min(10, len(doc))):
            page = doc[page_num]
            text = page.get_text()

            # 简单的目录模式匹配
            # 匹配模式: "第X章 ...", "1. ...", etc.
            patterns = [
                r'(第[一二三四五六七八九十\d]+章)\s+(.+?)(?:\s+\d+)?$',
                r'(\d+)\.?\s+(.+?)(?:\s+\d+)?$',
            ]

            for pattern in patterns:
                matches = re.finditer(pattern, text, re.MULTILINE)
                for match in matches:
                    title = match.group(1)
                    content = match.group(2) if len(match.groups()) > 1 else ""

                    toc_entries.append({
                        "level": 1,
                        "title": f"{title} {content}".strip(),
                        "page": page_num + 1  # 0-based to 1-based
                    })

        return toc_entries

    async def _parse_chapters_from_toc(
        self,
        toc: List[Dict],
        total_pages: int
    ) -> List[ChapterInfo]:
        """从目录解析章节信息"""
        chapters = []
        current_chapter = None

        for entry in toc:
            level = entry.get('level', 1)
            title = entry.get('title', '')
            page = entry.get('page', 1)

            if level == 1:  # 章
                # 保存上一章
                if current_chapter:
                    chapters.append(current_chapter)

                # 创建新章
                current_chapter = ChapterInfo(
                    number=len(chapters) + 1,
                    title=title,
                    page_start=page,
                    page_end=total_pages,  # 默认到文档末尾
                    sections=[]
                )
            elif current_chapter:  # 节或小节
                current_chapter.sections.append({
                    "title": title,
                    "page": page,
                    "level": level
                })

                # 更新章节结束页码（使用最后一个节的页码）
                current_chapter.page_end = page

        # 添加最后一章
        if current_chapter:
            chapters.append(current_chapter)

        return chapters

    async def split_pdf_by_chapters(
        self,
        pdf_path: str,
        chapters: List[ChapterInfo],
        output_dir: str
    ) -> List[str]:
        """
        按章节分割 PDF

        Args:
            pdf_path: 原始 PDF 路径
            chapters: 章节信息列表
            output_dir: 输出目录

        Returns:
            List[str]: 生成的文件路径列表
        """
        os.makedirs(output_dir, exist_ok=True)
        doc = fitz.open(pdf_path)
        output_files = []

        for chapter in chapters:
            # 创建新 PDF
            chapter_doc = fitz.open()

            # 复制章节页面
            # PyMuPDF 使用 0-based 索引
            start = chapter.page_start - 1
            end = chapter.page_end

            for page_num in range(start, end):
                if page_num < len(doc):
                    chapter_doc.insert_pdf(doc, from_page=page_num, to_page=page_num)

            # 保存章节文件
            filename = f"{chapter.number:02d}_{self._sanitize_filename(chapter.title)}.pdf"
            output_path = os.path.join(output_dir, filename)
            chapter_doc.save(output_path)
            output_files.append(output_path)

            chapter_doc.close()

        doc.close()
        return output_files

    def _sanitize_filename(self, title: str) -> str:
        """清理文件名"""
        # 移除或替换不安全的字符
        title = re.sub(r'[<>:"/\\|?*]', '', title)
        title = title.strip()
        return title[:50]  # 限制长度

    def get_processing_status(self) -> Dict[str, Any]:
        """获取处理状态"""
        return {
            "api_available": self.api_client.health_check(),
            "local_fallback_enabled": self.use_local_fallback,
            "supported_formats": self.supported_formats
        }


# 便捷函数
async def process_textbook(
    pdf_path: str,
    output_dir: str = None,
    use_ocr: bool = False,
    split: bool = True
) -> Dict[str, Any]:
    """
    处理 PDF 教材的便捷函数

    Args:
        pdf_path: PDF 文件路径
        output_dir: 输出目录
        use_ocr: 是否使用 OCR
        split: 是否按章节分割

    Returns:
        Dict: 处理结果
    """
    agent = TextbookProcessorAgent()

    # 分析教材
    result = await agent.analyze_textbook(pdf_path, use_ocr=use_ocr)

    # 如果需要分割
    if split and result.get('chapters'):
        if not output_dir:
            output_dir = os.path.join(
                os.path.dirname(pdf_path),
                f"chapters_{os.path.splitext(os.path.basename(pdf_path))[0]}"
            )

        output_files = await agent.split_pdf_by_chapters(
            pdf_path,
            result['chapters'],
            output_dir
        )
        result['output_files'] = output_files
        result['output_dir'] = output_dir

    return result


if __name__ == "__main__":
    # 测试代码
    import asyncio

    async def test():
        # 测试 PDF 处理
        pdf_path = "书籍/概率论与数理统计第五版盛骤-完整版.pdf"

        if os.path.exists(pdf_path):
            result = await process_textbook(
                pdf_path,
                output_dir="output/test_agent",
                use_ocr=False,
                split=False  # 只测试分析，不实际分割
            )

            print(json.dumps(result, indent=2, ensure_ascii=False))
        else:
            print(f"测试文件不存在: {pdf_path}")
            print("当前状态:")
            agent = TextbookProcessorAgent()
            print(json.dumps(agent.get_processing_status(), indent=2))

    asyncio.run(test())
