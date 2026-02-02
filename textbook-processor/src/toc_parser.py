"""
目录解析器 - 从PDF目录页提取章节信息
"""

import fitz
import re
from typing import List, Dict, Tuple
from dataclasses import dataclass


@dataclass
class TOCEntry:
    """目录条目"""
    level: int          # 层级（1=章，2=节）
    title: str          # 标题
    page_number: int    # 起始页码
    page_end: int = None  # 结束页码（后续计算）


class TOCParser:
    """目录解析器"""

    # 章节标题模式
    CHAPTER_PATTERNS = [
        r'^(\d+)\s+([第章]+)\s+(.+)',           # "1 第X章 xxx" 或 "1 章 xxx"
        r'^第([一二三四五六七八九十百千0-9]+)[章篇部]\s+(.+)',  # "第一章 xxx"
        r'^Chapter\s+(\d+):\s*(.+)',            # "Chapter 1: xxx"
        r'^(\d+)\.\s*(.{5,100})',               # "1. 标题" (至少5个字符)
        r'^([一二三四五六七八九十]+)、\s*(.{5,100})',  # "一、标题"
    ]

    # 页码模式（在行尾或特定位置）
    PAGE_PATTERNS = [
        r'(\d+)\s*$',                    # 行尾的数字
        r'[\s\.]{2,}(\d+)\s*$',         # 多个空格/点后的数字
        r'····(\d+)',                   # 点线后的页码
    ]

    def __init__(self, pdf_path: str):
        """初始化目录解析器"""
        self.pdf_path = pdf_path
        self.doc: fitz.Document = None
        self.toc_entries: List[TOCEntry] = []

    def open_pdf(self):
        """打开PDF"""
        self.doc = fitz.open(self.pdf_path)

    def close_pdf(self):
        """关闭PDF"""
        if self.doc:
            self.doc.close()

    def extract_toc_pages(self, start_page: int = 12, end_page: int = 16) -> List[str]:
        """
        提取目录页的文本内容

        Args:
            start_page: 目录起始页
            end_page: 目录结束页

        Returns:
            每页的文本列表
        """
        if not self.doc:
            self.open_pdf()

        pages_text = []

        for page_num in range(start_page - 1, min(end_page, len(self.doc))):
            page = self.doc[page_num]

            # 尝试多种文本提取方式
            text = page.get_text("text")  # 普通文本
            if not text or len(text.strip()) < 50:
                # 如果文本太少，尝试提取布局
                text = page.get_text("blocks")
                # 如果还是没有，可能是图片，需要OCR（暂不实现）

            pages_text.append(text)

        return pages_text

    def parse_toc_text(self, toc_text: str) -> List[TOCEntry]:
        """
        解析目录文本，提取章节信息

        Args:
            toc_text: 目录页的文本内容

        Returns:
            目录条目列表
        """
        entries = []
        lines = toc_text.split('\n')

        for line in lines:
            line = line.strip()
            if not line or len(line) < 3:
                continue

            # 尝试匹配章节标题模式
            entry = self._parse_line(line)
            if entry:
                entries.append(entry)

        return entries

    def _parse_line(self, line: str) -> TOCEntry:
        """解析单行文本"""
        # 首先尝试提取页码
        page_number = None
        for pattern in self.PAGE_PATTERNS:
            match = re.search(pattern, line)
            if match:
                try:
                    page_number = int(match.group(1))
                    # 移除页码部分，保留标题
                    line = re.sub(pattern, '', line).strip()
                    break
                except (ValueError, IndexError):
                    continue

        if not page_number:
            return None

        # 尝试匹配章节标题
        for pattern in self.CHAPTER_PATTERNS:
            match = re.match(pattern, line)
            if match:
                groups = match.groups()

                # 根据不同的模式提取信息
                if '第' in pattern or 'Chapter' in pattern.lower():
                    # 模式1: "第一章 xxx" 或 "Chapter 1: xxx"
                    title = groups[-1] if len(groups) > 1 else line
                    level = 1
                elif re.match(r'^\d+', line):
                    # 模式2: "1. xxx" 或 "一、xxx"
                    title = groups[-1] if len(groups) > 1 else line
                    level = 1
                else:
                    title = line
                    level = 1

                return TOCEntry(
                    level=level,
                    title=title.strip(),
                    page_number=page_number
                )

        # 如果都不匹配，但页码合理，可能是章节
        if 1 <= page_number <= 1000:  # 合理的页码范围
            # 检查是否是常见的章节标题格式
            if any(keyword in line for keyword in ['章', 'Chapter', '节', '部分', '篇']):
                return TOCEntry(
                    level=1,
                    title=line,
                    page_number=page_number
                )

        return None

    def extract_from_embedded_toc(self) -> List[TOCEntry]:
        """从PDF内置TOC提取（更可靠）"""
        if not self.doc:
            self.open_pdf()

        toc = self.doc.get_toc()
        if not toc:
            return []

        entries = []
        for item in toc:
            # 兼容不同长度的元组
            if len(item) >= 3:
                if len(item) == 3:
                    level, title, page_num = item
                else:
                    # 尝试自动检测格式
                    if isinstance(item[1], int) or (isinstance(item[1], str) and str(item[1]).isdigit()):
                        level, page_num, title = item[0], int(item[1]), str(item[2])
                    else:
                        level, title, page_num = item[0], str(item[1]), item[2]

                # 只提取一级标题（章）
                if level == 1:
                    entries.append(TOCEntry(
                        level=level,
                        title=title.strip(),
                        page_number=int(page_num)
                    ))

        return entries

    def calculate_page_ranges(self, entries: List[TOCEntry], total_pages: int) -> List[TOCEntry]:
        """
        计算每个章节的页码范围

        Args:
            entries: 目录条目列表
            total_pages: PDF总页数

        Returns:
            更新了页码范围的条目列表
        """
        if not entries:
            return []

        # 按页码排序
        entries = sorted(entries, key=lambda x: x.page_number)

        # 计算范围
        for i, entry in enumerate(entries):
            if i < len(entries) - 1:
                entry.page_end = entries[i + 1].page_number - 1
            else:
                # 最后一章到文档末尾
                entry.page_end = total_pages

        return entries

    def parse(self, use_embedded: bool = True, toc_pages: Tuple[int, int] = (12, 16)) -> List[TOCEntry]:
        """
        解析目录，返回完整的章节信息

        Args:
            use_embedded: 优先使用内置TOC
            toc_pages: 目录页范围（start, end）

        Returns:
            包含页码范围的章节列表
        """
        if not self.doc:
            self.open_pdf()

        total_pages = len(self.doc)
        entries = []

        # 方法1: 使用内置TOC
        if use_embedded:
            entries = self.extract_from_embedded_toc()

        # 方法2: 如果内置TOC为空或失败，解析目录页文本
        if not entries:
            toc_texts = self.extract_toc_pages(toc_pages[0], toc_pages[1])
            for text in toc_texts:
                page_entries = self.parse_toc_text(text)
                entries.extend(page_entries)

        # 计算页码范围
        if entries:
            entries = self.calculate_page_ranges(entries, total_pages)

        return entries

    def __enter__(self):
        """上下文管理器入口"""
        self.open_pdf()
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        """上下文管理器出口"""
        self.close_pdf()


if __name__ == "__main__":
    # 测试
    import sys

    if len(sys.argv) < 2:
        print("用法: python toc_parser.py <pdf_file>")
        sys.exit(1)

    pdf_file = sys.argv[1]

    try:
        with TOCParser(pdf_file) as parser:
            entries = parser.parse()

            print(f"\n找到 {len(entries)} 个章节:")
            print("="*80)

            for i, entry in enumerate(entries, 1):
                print(f"{i}. {entry.title}")
                print(f"   页码范围: {entry.page_number} - {entry.page_end} ({entry.page_end - entry.page_number + 1} 页)")
                print()

    except Exception as e:
        print(f"错误: {e}")
        import traceback
        traceback.print_exc()
