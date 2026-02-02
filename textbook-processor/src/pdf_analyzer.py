"""
PDF 分析模块
识别 PDF 的目录结构和章节信息
"""

import fitz  # PyMuPDF
import re
from typing import List, Dict, Tuple, Optional
from dataclasses import dataclass
from pathlib import Path


@dataclass
class ChapterInfo:
    """章节信息"""
    chapter_number: int
    title: str
    level: int  # 1=章, 2=节, 3=小节
    page_start: int
    page_end: Optional[int] = None
    children: List['ChapterInfo'] = None

    def __post_init__(self):
        if self.children is None:
            self.children = []


@dataclass
class PDFMetadata:
    """PDF 元数据"""
    title: str
    author: str = ""
    total_pages: int = 0
    toc_available: bool = False
    chapters: List[ChapterInfo] = None

    def __post_init__(self):
        if self.chapters is None:
            self.chapters = []


class PDFAnalyzer:
    """PDF 分析器"""

    # 常见章节标题的正则模式
    CHAPTER_PATTERNS = [
        r'第[一二三四五六七八九十百千0-9]+章',  # 第X章
        r'Chapter\s+\d+',  # Chapter X
        r'^\d+\.\s+',  # 数字开头如 "1. "
        r'第[一二三四五六七八九十百千0-9]+[篇部编]',  # 第X篇/部/编
        r'[第]?[一二三四五六七八九十百千0-9]+[、\.]\s*[^\n]{1,50}',  # "一、xxx" 或 "1. xxx"
    ]

    def __init__(self, pdf_path: str):
        """
        初始化 PDF 分析器

        Args:
            pdf_path: PDF 文件路径
        """
        self.pdf_path = Path(pdf_path)
        if not self.pdf_path.exists():
            raise FileNotFoundError(f"PDF 文件不存在: {pdf_path}")

        self.doc: fitz.Document = None
        self.metadata: PDFMetadata = None

    def open_pdf(self) -> fitz.Document:
        """打开 PDF 文件"""
        try:
            self.doc = fitz.open(str(self.pdf_path))
            return self.doc
        except Exception as e:
            raise IOError(f"无法打开 PDF 文件: {e}")

    def close_pdf(self):
        """关闭 PDF 文件"""
        if self.doc:
            self.doc.close()
            self.doc = None

    def extract_basic_info(self) -> Dict:
        """
        提取 PDF 基本信息

        Returns:
            包含页数、标题、作者等信息的字典
        """
        if not self.doc:
            self.open_pdf()

        # 从 PDF 元数据中提取信息
        meta = self.doc.metadata
        title = meta.get('title', '') or self.pdf_path.stem
        author = meta.get('author', '')
        total_pages = len(self.doc)

        return {
            'title': title,
            'author': author,
            'total_pages': total_pages,
            'subject': meta.get('subject', ''),
            'keywords': meta.get('keywords', ''),
            'creator': meta.get('creator', ''),
            'producer': meta.get('producer', ''),
        }

    def extract_toc_from_pdf(self) -> List[Tuple[int, int, str, str, int]]:
        """
        从 PDF 内置 TOC 中提取目录

        Returns:
            TOC 列表，每个元素为 (level, page_num, title, dest, flags)
        """
        if not self.doc:
            self.open_pdf()

        toc = self.doc.get_toc()
        if toc:
            print(f"✓ 找到内置 TOC，共 {len(toc)} 个条目")
        else:
            print("✗ 未找到内置 TOC")

        return toc

    def detect_chapters_by_text(self, max_pages: int = 20) -> List[ChapterInfo]:
        """
        通过文本识别章节标题

        Args:
            max_pages: 扫描的最大页数（默认前20页）

        Returns:
            识别到的章节列表
        """
        if not self.doc:
            self.open_pdf()

        chapters = []
        total_pages = len(self.doc)

        # 只扫描前面部分（通常目录在前面）
        pages_to_scan = min(max_pages, total_pages)

        print(f"正在扫描前 {pages_to_scan} 页，寻找章节标题...")

        for page_num in range(pages_to_scan):
            page = self.doc[page_num]
            text = page.get_text("text")

            # 按行分析
            lines = text.split('\n')
            for line in lines:
                line = line.strip()
                if not line:
                    continue

                # 检查是否匹配章节标题模式
                for pattern in self.CHAPTER_PATTERNS:
                    if re.match(pattern, line, re.IGNORECASE):
                        # 过滤掉太短的匹配
                        if len(line) < 3:
                            continue

                        # 避免重复
                        if chapters and chapters[-1].title == line:
                            continue

                        chapter = ChapterInfo(
                            chapter_number=len(chapters) + 1,
                            title=line,
                            level=1,
                            page_start=page_num + 1  # fitz 页码从 0 开始，显示从 1 开始
                        )
                        chapters.append(chapter)
                        print(f"  发现章节: {line} (第 {page_num + 1} 页)")
                        break

        return chapters

    def extract_chapters(self, use_toc: bool = True) -> List[ChapterInfo]:
        """
        提取章节信息（优先使用 TOC，回退到文本识别）

        Args:
            use_toc: 是否优先使用内置 TOC

        Returns:
            章节列表
        """
        chapters = []

        # 策略 1: 优先使用内置 TOC
        if use_toc:
            toc = self.extract_toc_from_pdf()

            if toc:
                # 转换 TOC 为 ChapterInfo
                for item in toc:
                    # TOC 元组长度可能不一致 (3-5 个元素)
                    # 兼容不同版本: (level, title, page_num, ...) 或 (level, page_num, title, ...)
                    if len(item) >= 3:
                        if len(item) == 3:
                            level, title, page_num = item[0], item[1], item[2]
                        else:
                            # 尝试自动检测格式
                            # 格式1: (level, page_num, title, ...)
                            # 格式2: (level, title, page_num, ...)
                            if isinstance(item[1], int) or (isinstance(item[1], str) and item[1].isdigit()):
                                level, page_num, title = item[0], int(item[1]), item[2]
                            else:
                                level, title, page_num = item[0], item[1], item[2]

                        # 只取第一级（章）
                        if level == 1:
                            chapter = ChapterInfo(
                                chapter_number=len(chapters) + 1,
                                title=str(title).strip(),
                                level=level,
                                page_start=int(page_num)
                            )
                            chapters.append(chapter)
                            print(f"  TOC 章节: {title} (第 {page_num} 页)")

        # 策略 2: 如果没有 TOC 或 TOC 为空，使用文本识别
        if not chapters:
            print("内置 TOC 不可用或为空，使用文本识别...")
            chapters = self.detect_chapters_by_text()

        # 计算每章的结束页
        if chapters:
            for i, chapter in enumerate(chapters):
                if i < len(chapters) - 1:
                    chapter.page_end = chapters[i + 1].page_start - 1
                else:
                    # 最后一章到文档结尾
                    chapter.page_end = len(self.doc)

        return chapters

    def analyze(self) -> PDFMetadata:
        """
        执行完整的 PDF 分析

        Returns:
            PDF 元数据对象
        """
        try:
            # 打开 PDF
            self.open_pdf()

            # 提取基本信息
            info = self.extract_basic_info()

            # 提取章节
            chapters = self.extract_chapters()

            # 构建元数据
            self.metadata = PDFMetadata(
                title=info['title'],
                author=info['author'],
                total_pages=info['total_pages'],
                toc_available=bool(self.doc.get_toc()),
                chapters=chapters
            )

            print(f"\n分析完成:")
            print(f"  标题: {info['title']}")
            print(f"  总页数: {info['total_pages']}")
            print(f"  识别章节数: {len(chapters)}")
            print(f"  TOC 可用: {self.doc.get_toc() is not None}")

            return self.metadata

        finally:
            # 保持 PDF 打开状态，供后续使用
            pass

    def __enter__(self):
        """上下文管理器入口"""
        self.open_pdf()
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        """上下文管理器出口"""
        self.close_pdf()


if __name__ == "__main__":
    # 测试代码
    import sys

    if len(sys.argv) < 2:
        print("用法: python pdf_analyzer.py <pdf_file>")
        sys.exit(1)

    pdf_file = sys.argv[1]

    try:
        analyzer = PDFAnalyzer(pdf_file)
        metadata = analyzer.analyze()

        print("\n" + "="*60)
        print("章节列表:")
        print("="*60)
        for i, chapter in enumerate(metadata.chapters, 1):
            print(f"{i}. {chapter.title}")
            print(f"   页码范围: {chapter.page_start} - {chapter.page_end}")

    except Exception as e:
        print(f"错误: {e}")
        import traceback
        traceback.print_exc()
