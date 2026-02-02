"""
基于文本内容的章节检测器
使用 pymupdf 直接提取 PDF 文本，无需 ML 模型
"""

import re
from pathlib import Path
from typing import List, Dict, Optional
from dataclasses import dataclass


@dataclass
class ChapterDetectionResult:
    """章节检测结果"""
    title: str
    page_start: int
    page_end: int
    level: int
    content_type: str  # 'chapter', 'section', 'preface', etc.


class TextBasedChapterDetector:
    """基于文本内容的章节检测器"""

    def __init__(self):
        """初始化检测器"""
        self.available = self._check_availability()

    def _check_availability(self) -> bool:
        """检查 pymupdf 是否可用"""
        try:
            import fitz
            print("✓ 文本章节检测器就绪 (pymupdf)")
            return True
        except ImportError:
            print("⚠️  pymupdf 不可用，请安装: pip install pymupdf")
            return False

    def detect_chapters_from_pdf(self, pdf_path: str) -> List[ChapterDetectionResult]:
        """
        从 PDF 检测章节结构

        Args:
            pdf_path: PDF 文件路径

        Returns:
            章节列表
        """
        if not self.available:
            return []

        print(f"🔍 分析 PDF 文本内容: {Path(pdf_path).name}")

        try:
            import fitz  # PyMuPDF

            doc = fitz.open(pdf_path)
            total_pages = len(doc)
            print(f"   总页数: {total_pages}")

            chapters = []

            # 遍历每一页，提取文本并检测章节标题
            for page_no in range(total_pages):
                page = doc[page_no]

                # 获取页面文本
                text = page.get_text("text")

                # 按行分析
                lines = text.split('\n')
                for line in lines:
                    line = line.strip()
                    if len(line) < 5:  # 跳过太短的行
                        continue

                    # 检测章节标题
                    chapter_info = self._detect_chapter_title(line, page_no)
                    if chapter_info:
                        chapters.append(chapter_info)
                        print(f"   发现: {chapter_info.title} (第 {page_no + 1} 页)")

            doc.close()

            # 计算章节页码范围
            if chapters:
                chapters = self._calculate_page_ranges(chapters, total_pages)
                print(f"✓ 检测到 {len(chapters)} 个章节")
            else:
                print("⚠️  未检测到章节")

            return chapters

        except Exception as e:
            print(f"❌ 检测失败: {e}")
            import traceback
            traceback.print_exc()
            return []

    def _detect_chapter_title(self, text: str, page_no: int) -> Optional[ChapterDetectionResult]:
        """
        检测文本是否为章节标题

        Args:
            text: 文本内容
            page_no: 页码（从0开始）

        Returns:
            章节信息或 None
        """
        # 章节标题模式（按优先级排序）
        chapter_patterns = [
            # 第一级：章
            (r'^第[一二三四五六七八九十百千\d]+[章篇部]\s+(.+)', 1),
            (r'^Chapter\s+\d+[:：]?\s*(.+)', 1),

            # 第二级：节
            (r'^§?\d+[\.\d]*[\.\s]\s*(.{5,50})$', 2),

            # 第三级：小节
            (r'^[一二三四五六七八九十]+[、\.]\s*(.{5,50})$', 3),
            (r'^\d+[\.\d]+[\.\s]\s*(.{5,50})$', 3),

            # 英文章节
            (r'^[A-Z][A-Z\s\d]+$', 2),  # 全大写标题
        ]

        # 排除模式（不是章节标题的情况）
        exclude_patterns = [
            r'^\d+\s*$',  # 单独的数字
            r'^[一二三四五六七八九十]\s*$',  # 单独的中文数字
            r'^[第页]\s*\d+\s*[页张]*$',  # "第3页" 类似内容
            r'^ISBN',  # ISBN号
            r'^http',  # URL
        ]

        text = text.strip()

        # 先检查排除模式
        for exclude_pattern in exclude_patterns:
            if re.match(exclude_pattern, text):
                return None

        # 检查章节模式
        for pattern, level in chapter_patterns:
            match = re.match(pattern, text)
            if match:
                title = match.group(1) if match.groups() else text
                title = title.strip()

                # 清理标题中的多余内容
                title = re.sub(r'^\s*[第章篇部节Chapter]+\s*', '', title)
                title = title.strip()

                # 标题不能太短或太长
                if len(title) < 3 or len(title) > 100:
                    continue

                return ChapterDetectionResult(
                    title=title,
                    page_start=page_no,  # 页码从0开始
                    page_end=None,  # 后续计算
                    level=level,
                    content_type='chapter'
                )

        return None

    def _calculate_page_ranges(self, chapters: List[ChapterDetectionResult], total_pages: int) -> List[ChapterDetectionResult]:
        """
        计算章节的页码范围

        Args:
            chapters: 章节列表
            total_pages: PDF总页数

        Returns:
            更新了页码范围的章节列表
        """
        if not chapters:
            return chapters

        # 按页码排序
        chapters = sorted(chapters, key=lambda x: x.page_start)

        # 计算范围
        for i, chapter in enumerate(chapters):
            if i < len(chapters) - 1:
                chapter.page_end = chapters[i + 1].page_start - 1
            else:
                # 最后一章延伸到文档末尾
                chapter.page_end = total_pages - 1

        # 去重：如果相邻章节在同一页，移除后面的
        unique_chapters = []
        for chapter in chapters:
            if not unique_chapters or chapter.page_start != unique_chapters[-1].page_start:
                unique_chapters.append(chapter)

        return unique_chapters


def test_detection():
    """测试章节检测"""
    import sys

    if len(sys.argv) < 2:
        print("用法: python text_based_chapter_detector.py <pdf_file>")
        sys.exit(1)

    pdf_file = sys.argv[1]

    detector = TextBasedChapterDetector()
    chapters = detector.detect_chapters_from_pdf(pdf_file)

    print("\n" + "="*80)
    print(f"检测到 {len(chapters)} 个章节:")
    print("="*80)

    for i, chapter in enumerate(chapters, 1):
        print(f"{i}. {chapter.title}")
        print(f"   层级: {chapter.level}")
        print(f"   起始页: {chapter.page_start + 1}")  # 转换为1-based
        print(f"   结束页: {chapter.page_end + 1 if chapter.page_end is not None else '(未确定)'}")
        print(f"   页数: {(chapter.page_end - chapter.page_start + 1) if chapter.page_end else '?'}")
        print()


if __name__ == "__main__":
    test_detection()
