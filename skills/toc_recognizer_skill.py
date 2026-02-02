"""
Skill 1: 目录识别和页码范围计算
调用 MinerU API 识别目录，计算每章的准确页码范围
输出为 Markdown 文件
"""
import os
import json
import asyncio
from typing import Dict, List, Any, Optional
from pathlib import Path
from dataclasses import dataclass, asdict
from datetime import datetime
import re

try:
    import fitz  # PyMuPDF
    PYMUPDF_AVAILABLE = True
except ImportError:
    PYMUPDF_AVAILABLE = False

try:
    import requests
    REQUESTS_AVAILABLE = True
except ImportError:
    REQUESTS_AVAILABLE = False


@dataclass
class Chapter:
    """章信息"""
    number: int
    title: str
    page_start: int
    page_end: int
    sections: List[Dict[str, Any]] = None

    def __str__(self):
        return f"第{self.number}章 {self.title} (第{self.page_start}-{self.page_end}页)"


@dataclass
class Section:
    """节信息"""
    title: str
    page: int
    level: int  # 1=章, 2=节, 3=小节

    def __str__(self):
        indent = "  " * (self.level - 1)
        return f"{indent}{self.title} (第{self.page}页)"


class TOCRecognizerSkill:
    """目录识别 Skill

    功能：
    1. 调用 MinerU API 识别 PDF 目录
    2. 解析目录结构（章、节、小节）
    3. 计算每章的准确页码范围
       - 某章开头页码
       - 上一章最后一节页码
    4. 输出为 Markdown 文件
    """

    def __init__(
        self,
        api_url: str = None,
        api_key: str = None,
        timeout: int = 300
    ):
        """
        初始化 Skill

        Args:
            api_url: MinerU API 地址
            api_key: API 密钥
            timeout: 请求超时时间
        """
        self.api_url = api_url or os.getenv("MINERU_API_URL", "http://49.52.18.227:8000")
        self.api_key = api_key or os.getenv("MINERU_API_KEY")
        self.timeout = timeout

    async def recognize_toc(
        self,
        pdf_path: str,
        toc_pages: str = "1-5",
        use_ocr: bool = True
    ) -> List[Chapter]:
        """
        识别 PDF 目录

        Args:
            pdf_path: PDF 文件路径
            toc_pages: 目录页码范围（如 "1-5"）
            use_ocr: 是否使用 OCR（扫描版 PDF 需要）

        Returns:
            List[Chapter]: 章节列表
        """
        print(f"📖 开始识别目录: {os.path.basename(pdf_path)}")

        # 1. 尝试从 PDF 元数据提取目录
        if PYMUPDF_AVAILABLE:
            toc_from_metadata = self._extract_toc_from_metadata(pdf_path)
            if toc_from_metadata and len(toc_from_metadata) > 0:
                print(f"✓ 从 PDF 元数据提取到 {len(toc_from_metadata)} 个目录项")
                chapters = self._parse_chapters_from_toc(toc_from_metadata, pdf_path)

                if chapters:
                    # 2. 如果有目录，计算页码范围
                    chapters = self._calculate_page_ranges(chapters, pdf_path)
                    return chapters

        # 2. 如果元数据没有目录，使用 OCR
        if use_ocr and REQUESTS_AVAILABLE:
            print("📷 使用 OCR 识别目录...")
            toc_from_ocr = await self._extract_toc_via_ocr(pdf_path, toc_pages)

            if toc_from_ocr:
                print(f"✓ 从 OCR 提取到 {len(toc_from_ocr)} 个目录项")
                chapters = self._parse_chapters_from_toc(toc_from_ocr, pdf_path)

                if chapters:
                    chapters = self._calculate_page_ranges(chapters, pdf_path)
                    return chapters

        # 3. 降级：简单文本提取
        print("⚠️  未能提取目录，使用简单模式...")
        chapters = self._fallback_simple_recognition(pdf_path)

        return chapters

    def _extract_toc_from_metadata(self, pdf_path: str) -> List[Dict]:
        """从 PDF 元数据提取目录"""
        if not PYMUPDF_AVAILABLE:
            return []

        doc = fitz.open(pdf_path)
        toc = doc.get_toc()
        doc.close()

        if not toc:
            return []

        # 转换为统一格式
        return [
            {
                "level": item[0],
                "title": item[1],
                "page": item[2]
            }
            for item in toc
        ]

    async def _extract_toc_via_ocr(
        self,
        pdf_path: str,
        toc_pages: str
    ) -> List[Dict]:
        """通过 OCR 提取目录"""
        # TODO: 调用服务器 MinerU API
        # 现在先返回空，等 API 部署完成后实现

        print(f"   调用 API: {self.api_url}/api/ocr")
        print(f"   页码范围: {toc_pages}")

        # 临时实现：使用本地文本提取
        return self._extract_toc_from_text(pdf_path, int(toc_pages.split('-')[0]))

    def _extract_toc_from_text(self, pdf_path: str, max_page: int = 10) -> List[Dict]:
        """从 PDF 文本中提取目录"""
        if not PYMUPDF_AVAILABLE:
            return []

        doc = fitz.open(pdf_path)
        toc_entries = []

        # 检查前 max_page 页
        for page_num in range(min(max_page, len(doc))):
            page = doc[page_num]
            text = page.get_text()

            # 常见目录模式
            patterns = [
                r'第([一二三四五六七八九十\d]+章)\s+(.+?)(?:\s+\d+页)?$',
                r'(\d+)\.?\s*(.+?)(?:\s+\d+页)?$',
                r'Chapter\s+(\d+)\s*:\s*(.+?)(?:\s+p\.\s*\d+)?$',
            ]

            for pattern in patterns:
                matches = re.finditer(pattern, text, re.MULTILINE | re.IGNORECASE)
                for match in matches:
                    title = match.group(1)
                    content = match.group(2) if len(match.groups()) > 1 else ""

                    toc_entries.append({
                        "level": 1,
                        "title": f"{title} {content}".strip(),
                        "page": page_num + 1,  # 1-based
                        "confidence": "text_extraction"
                    })

        doc.close()
        return toc_entries

    def _parse_chapters_from_toc(
        self,
        toc: List[Dict],
        pdf_path: str
    ) -> List[Chapter]:
        """从目录解析章节"""
        if not PYMUPDF_AVAILABLE:
            return []

        doc = fitz.open(pdf_path)
        total_pages = len(doc)
        doc.close()

        chapters = []
        current_chapter = None
        current_sections = []

        for entry in toc:
            level = entry.get('level', 1)
            title = entry.get('title', '')
            page = entry.get('page', 1)

            if level == 1:  # 章
                # 保存上一章
                if current_chapter:
                    current_chapter.sections = current_sections
                    chapters.append(current_chapter)

                # 创建新章
                current_chapter = Chapter(
                    number=len(chapters) + 1,
                    title=title,
                    page_start=page,
                    page_end=total_pages,  # 默认到文档末尾
                    sections=[]
                )
                current_sections = []

            elif current_chapter and level == 2:  # 节
                current_sections.append({
                    "title": title,
                    "page": page,
                    "level": level
                })

        # 添加最后一章
        if current_chapter:
            current_chapter.sections = current_sections
            chapters.append(current_chapter)

        return chapters

    def _calculate_page_ranges(
        self,
        chapters: List[Chapter],
        pdf_path: str
    ) -> List[Chapter]:
        """
        计算每章的准确页码范围

        重要说明：目录中的页码都是"起始页"，不是"结束页"！

        算法：
        - 某章开始页码 = 目录中该章显示的页码
        - 某章结束页码 = 下一章开始页码 - 1
        - 最后一章的结束页码 = PDF 总页数

        例如：
        目录: 第一章 (第16页), 第二章 (第78页)
        结果: 第一章范围 = 16-77页
        """
        if not chapters:
            return chapters

        # 获取 PDF 总页数
        if PYMUPDF_AVAILABLE:
            doc = fitz.open(pdf_path)
            total_pages = len(doc)
            doc.close()
        else:
            total_pages = 9999  # 降级：使用一个很大的数

        print(f"🔢 计算页码范围... (PDF 总页数: {total_pages})")

        for i, chapter in enumerate(chapters):
            # 开始页码已经在解析时设置好了
            # 现在只需要确定结束页码

            if i < len(chapters) - 1:
                # 不是最后一章：使用下一章的开始页 - 1
                next_chapter = chapters[i + 1]
                chapter.page_end = next_chapter.page_start - 1
            else:
                # 最后一章：使用 PDF 总页数
                chapter.page_end = total_pages

            print(f"  {chapter}")

        return chapters

    def _fallback_simple_recognition(self, pdf_path: str) -> List[Chapter]:
        """降级方案：简单识别"""
        if not PYMUPDF_AVAILABLE:
            return []

        doc = fitz.open(pdf_path)
        total_pages = len(doc)
        doc.close()

        # 创建一个默认章节
        return [
            Chapter(
                number=1,
                title=os.path.splitext(os.path.basename(pdf_path))[0],
                page_start=1,
                page_end=total_pages,
                sections=[]
            )
        ]

    def export_to_markdown(
        self,
        chapters: List[Chapter],
        pdf_path: str,
        output_path: str = None
    ) -> str:
        """
        导出为 Markdown 文件

        Args:
            chapters: 章节列表
            pdf_path: 原始 PDF 路径
            output_path: 输出文件路径（可选）

        Returns:
            str: Markdown 文件路径
        """
        if not output_path:
            # 默认输出路径
            pdf_name = Path(pdf_path).stem
            output_dir = Path("output/toc")
            output_dir.mkdir(parents=True, exist_ok=True)
            output_path = output_dir / f"{pdf_name}_目录.md"

        # 生成 Markdown 内容
        lines = []
        lines.append(f"# {Path(pdf_path).name} - 目录结构\n")
        lines.append(f"**生成时间**: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
        lines.append(f"**总章节数**: {len(chapters)}\n")
        lines.append("---\n\n")

        for chapter in chapters:
            lines.append(f"## {chapter}\n\n")

            if chapter.sections:
                lines.append("**包含章节**:\n\n")
                for section in chapter.sections:
                    lines.append(f"- {Section(**section)}\n")
                lines.append("\n")

            lines.append(f"**页码范围**: 第 {chapter.page_start} - {chapter.page_end} 页\n")
            lines.append(f"**总页数**: {chapter.page_end - chapter.page_start + 1} 页\n\n")
            lines.append("---\n\n")

        # 写入文件
        content = "".join(lines)

        with open(output_path, 'w', encoding='utf-8') as f:
            f.write(content)

        print(f"✓ 已导出目录到: {output_path}")
        return str(output_path)


# 便捷函数
async def recognize_pdf_toc(
    pdf_path: str,
    output_path: str = None,
    use_ocr: bool = True
) -> Dict[str, Any]:
    """
    识别 PDF 目录的便捷函数

    Args:
        pdf_path: PDF 文件路径
        output_path: 输出 Markdown 文件路径（可选）
        use_ocr: 是否使用 OCR

    Returns:
        Dict: 包含章节信息和输出文件路径
    """
    skill = TOCRecognizerSkill()

    # 识别目录
    chapters = await skill.recognize_toc(pdf_path, use_ocr=use_ocr)

    # 导出 Markdown
    if not output_path:
        pdf_name = Path(pdf_path).stem
        output_dir = Path("output/toc")
        output_dir.mkdir(parents=True, exist_ok=True)
        output_path = output_dir / f"{pdf_name}_目录.md"

    md_path = skill.export_to_markdown(chapters, pdf_path, output_path)

    return {
        "chapters": chapters,
        "markdown_file": md_path,
        "pdf_path": pdf_path,
        "total_chapters": len(chapters)
    }


if __name__ == "__main__":
    import asyncio

    async def test():
        # 测试目录识别
        pdf_path = "书籍/概率论与数理统计第五版盛骤-完整版.pdf"

        if os.path.exists(pdf_path):
            result = await recognize_pdf_toc(
                pdf_path=pdf_path,
                use_ocr=False  # 暂时不使用 OCR
            )

            print(f"\n✓ 识别完成!")
            print(f"  总章节数: {result['total_chapters']}")
            print(f"  Markdown 文件: {result['markdown_file']}")
        else:
            print(f"✗ 文件不存在: {pdf_path}")

    asyncio.run(test())
