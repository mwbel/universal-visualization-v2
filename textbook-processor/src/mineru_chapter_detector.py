"""
基于 MinerU 的章节检测器
使用 MinerU 的布局分析能力识别章节结构
"""

import json
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


class MinerUChapterDetector:
    """基于 MinerU 的章节检测器"""

    def __init__(self, backend: str = "pipeline"):
        """
        初始化检测器

        Args:
            backend: MinerU 后端 ("pipeline" = 纯CPU, 不需要下载模型)
        """
        self.backend = backend
        self.available = self._check_availability()

    def _check_availability(self) -> bool:
        """检查 MinerU 是否可用"""
        try:
            from mineru.cli.common import do_parse
            print("✓ MinerU 章节检测器就绪")
            return True
        except ImportError as e:
            print(f"⚠️  MinerU 不可用: {e}")
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

        print(f"🔍 分析 PDF 结构: {Path(pdf_path).name}")
        print(f"   模式: {self.backend}")

        try:
            from mineru.cli.common import do_parse
            import tempfile

            # 创建临时输出目录
            with tempfile.TemporaryDirectory() as temp_dir:
                # 读取 PDF
                with open(pdf_path, 'rb') as f:
                    pdf_bytes = f.read()

                pdf_name = Path(pdf_path).name

                # 使用 pipeline 模式解析
                print("   正在解析...")
                result = do_parse(
                    output_dir=temp_dir,
                    pdf_file_names=[pdf_name],
                    pdf_bytes_list=[pdf_bytes],
                    p_lang_list=['en'],  # 使用英语（中文可能不被支持）
                    backend=self.backend,
                    f_dump_middle_json=True,  # 生成中间 JSON
                    f_dump_md=False,          # 不需要 markdown
                    f_dump_orig_pdf=False,     # 不需要原始 PDF
                )

                # 解析结果 JSON
                json_files = list(Path(temp_dir).glob("**/*.json"))

                if json_files:
                    chapters = self._extract_chapters_from_json(json_files[0])
                    print(f"✓ 检测到 {len(chapters)} 个章节")
                    return chapters
                else:
                    print("⚠️  未生成 JSON 结果")
                    return []

        except Exception as e:
            print(f"❌ 检测失败: {e}")
            import traceback
            traceback.print_exc()
            return []

    def _extract_chapters_from_json(self, json_path: Path) -> List[ChapterDetectionResult]:
        """
        从 MinerU 生成的 JSON 中提取章节信息

        Args:
            json_path: JSON 文件路径

        Returns:
            章节列表
        """
        try:
            with open(json_path, 'r', encoding='utf-8') as f:
                data = json.load(f)

            chapters = []

            # MinerU 的 JSON 结构：包含 pages 数组
            if 'pages' in data or isinstance(data, list):
                pages = data.get('pages', data) if isinstance(data, dict) else data

                current_page = 0

                for page_data in pages:
                    page_no = page_data.get('page_no', current_page)
                    current_page = page_no + 1

                    # 查找页面中的标题
                    if 'layout_dets' in page_data:
                        for block in page_data['layout_dets']:
                            if 'text' in block:
                                text = block['text']

                                # 检测章节标题
                                chapter_info = self._detect_chapter_title(text, page_no)
                                if chapter_info:
                                    chapters.append(chapter_info)

            # 计算章节页码范围
            if chapters:
                chapters = self._calculate_page_ranges(chapters)

            return chapters

        except Exception as e:
            print(f"解析 JSON 失败: {e}")
            return []

    def _detect_chapter_title(self, text: str, page_no: int) -> Optional[ChapterDetectionResult]:
        """
        检测文本是否为章节标题

        Args:
            text: 文本内容
            page_no: 页码

        Returns:
            章节信息或 None
        """
        import re

        text = text.strip()

        # 章节标题模式
        chapter_patterns = [
            r'^第[一二三四五六七八九十百千\d]+[章篇部]\s+(.+)',  # 第一章 xxx
            r'^Chapter\s+\d+[:：]\s*(.+)',  # Chapter 1: xxx
            r'^\d+[\.、]\s*(.{5,50})$',  # 1. xxx 或 1、xxx
            r'^[一二三四五六七八九十]+[、\.]\s*(.{5,50})$',  # 一、xxx
        ]

        for pattern in chapter_patterns:
            match = re.match(pattern, text)
            if match:
                title = match.group(1) if match.groups() else text
                title = title.strip()

                # 确定层级
                level = 1
                if '章' in text or 'Chapter' in text:
                    level = 1
                elif '节' in text:
                    level = 2

                return ChapterDetectionResult(
                    title=title,
                    page_start=page_no,
                    page_end=None,  # 后续计算
                    level=level,
                    content_type='chapter'
                )

        return None

    def _calculate_page_ranges(self, chapters: List[ChapterDetectionResult]) -> List[ChapterDetectionResult]:
        """
        计算章节的页码范围

        Args:
            chapters: 章节列表

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
                # 最后一章的结束页码未知，设为 None
                chapter.page_end = None

        return chapters


def test_detection():
    """测试章节检测"""
    import sys

    if len(sys.argv) < 2:
        print("用法: python mineru_chapter_detector.py <pdf_file>")
        sys.exit(1)

    pdf_file = sys.argv[1]

    detector = MinerUChapterDetector(backend="pipeline")
    chapters = detector.detect_chapters_from_pdf(pdf_file)

    print("\n" + "="*80)
    print(f"检测到 {len(chapters)} 个章节:")
    print("="*80)

    for i, chapter in enumerate(chapters, 1):
        print(f"{i}. {chapter.title}")
        print(f"   层级: {chapter.level}")
        print(f"   起始页: {chapter.page_start}")
        print(f"   结束页: {chapter.page_end if chapter.page_end else '(未确定)'}")
        print()


if __name__ == "__main__":
    test_detection()
