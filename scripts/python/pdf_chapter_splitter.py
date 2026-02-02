#!/usr/bin/env python3
"""
PDF 书籍按章节分割工具
支持扫描版 PDF（使用 MinerU OCR）
适用于 Linux 服务器
"""

import os
import sys
import json
import tempfile
from pathlib import Path
from typing import List, Dict, Optional
import fitz  # PyMuPDF


class PDFChapterSplitter:
    """PDF 章节分割器"""

    def __init__(self, use_ocr: bool = True, ocr_backend: str = "torch"):
        """
        初始化分割器

        Args:
            use_ocr: 是否使用 OCR（扫描版 PDF 需要）
            ocr_backend: OCR 后端 ("torch" 或 "pipeline")
        """
        self.use_ocr = use_ocr
        self.ocr_backend = ocr_backend
        self.mineru_available = self._check_mineru()

    def _check_mineru(self) -> bool:
        """检查 MinerU 是否可用"""
        try:
            from mineru.cli.common import do_parse
            return True
        except ImportError:
            return False

    def split_by_chapters(
        self,
        pdf_path: str,
        output_dir: str,
        chapters: List[Dict]
    ) -> Dict:
        """
        按章节分割 PDF

        Args:
            pdf_path: PDF 文件路径
            output_dir: 输出目录
            chapters: 章节列表，格式：[{"title": "第1章", "page_start": 16, "page_end": 76}, ...]

        Returns:
            分割结果
        """
        pdf_path = Path(pdf_path)
        output_path = Path(output_dir)
        output_path.mkdir(parents=True, exist_ok=True)

        doc = fitz.open(str(pdf_path))

        results = []

        for i, chapter in enumerate(chapters, 1):
            # 计算页码范围（转换为 0-indexed）
            start = chapter['page_start'] - 1
            end = chapter['page_end']

            # 创建新 PDF
            new_doc = fitz.open()

            # 复制页面
            for page_num in range(start, end):
                new_doc.insert_pdf(doc, from_page=page_num)

            # 保存章节 PDF
            chapter_filename = f"{i:02d}_{chapter['title']}.pdf"
            chapter_path = output_path / chapter_filename
            new_doc.save(str(chapter_path))
            new_doc.close()

            results.append({
                'chapter_number': i,
                'title': chapter['title'],
                'file': chapter_filename,
                'page_start': chapter['page_start'],
                'page_end': chapter['page_end'],
                'page_count': end - start
            })

            print(f"✓ 生成: {chapter_filename} ({chapter['page_start']}-{chapter['page_end']}页, {end-start}页)")

        doc.close()

        # 保存元数据
        metadata = {
            'source_pdf': pdf_path.name,
            'total_chapters': len(chapters),
            'chapters': results
        }

        metadata_file = output_path / "metadata.json"
        with open(metadata_file, 'w', encoding='utf-8') as f:
            json.dump(metadata, f, ensure_ascii=False, indent=2)

        print(f"\n✓ 元数据已保存: {metadata_file}")
        print(f"✓ 共分割为 {len(results)} 个章节文件")

        return metadata

    def detect_chapters_from_ocr(self, pdf_path: str) -> List[Dict]:
        """
        使用 MinerU OCR 识别章节

        Args:
            pdf_path: PDF 文件路径

        Returns:
            章节列表
        """
        if not self.mineru_available:
            raise RuntimeError("MinerU 不可用，请安装: pip install mineru")

        pdf_path = Path(pdf_path)

        with tempfile.TemporaryDirectory() as temp_dir:
            print(f"正在使用 MinerU OCR 处理: {pdf_path.name}...")
            print(f"模式: {self.ocr_backend}\n")

            # 读取 PDF
            with open(pdf_path, 'rb') as f:
                pdf_bytes = f.read()

            # 调用 MinerU
            from mineru.cli.common import do_parse

            result = do_parse(
                output_dir=temp_dir,
                pdf_file_names=[pdf_path.name],
                pdf_bytes_list=[pdf_bytes],
                p_lang_list=['zh'],
                backend=self.ocr_backend,
                f_dump_md=True,
                f_dump_middle_json=True,
                f_dump_content_list=False,
                f_draw_layout_bbox=False,
                f_draw_span_bbox=False,
            )

            # 解析 OCR 结果
            chapters = self._parse_ocr_results(temp_dir)

            return chapters

    def _parse_ocr_results(self, ocr_output_dir: str) -> List[Dict]:
        """
        解析 MinerU OCR 结果，提取章节信息

        Args:
            ocr_output_dir: OCR 输出目录

        Returns:
            章节列表
        """
        import re
        from pathlib import Path

        ocr_path = Path(ocr_output_dir)

        # 查找生成的 Markdown 文件
        md_files = list(ocr_path.rglob("*.md"))

        if not md_files:
            raise RuntimeError("未找到 OCR 生成的 Markdown 文件")

        chapters = []

        # 读取 Markdown 文件内容
        for md_file in md_files:
            with open(md_file, 'r', encoding='utf-8') as f:
                content = f.read()

            # 解析章节标题
            # 匹配模式：# 第一章 xxx 或 ## 1.1 xxx
            lines = content.split('\n')

            current_page = 1  # Markdown 中的页码（从1开始）

            for line in lines:
                line = line.strip()

                # 一级标题：章
                match = re.match(r'^#\s+(第[一二三四五六七八九十\d]+章[^\n]*)', line)
                if match:
                    title = match.group(1)
                    chapters.append({
                        'title': title,
                        'level': 1,
                        'page_start': current_page,  # OCR 结果中的页码
                        'page_end': None
                    })

                # 二级标题：节
                match = re.match(r'^##\s+(\d+\.\d+\s*[^\n]*)', line)
                if match:
                    # 可以记录小节信息
                    pass

                # 更新页码（如果有分页标记）
                if '\\newpage' in line or '---' in line:
                    current_page += 1

        # 计算页码范围
        if chapters:
            for i, ch in enumerate(chapters):
                if i < len(chapters) - 1:
                    ch['page_end'] = chapters[i + 1]['page_start'] - 1
                else:
                    ch['page_end'] = None  # 最后一章

        return chapters

    def detect_chapters_from_toc(self, pdf_path: str) -> List[Dict]:
        """
        从 PDF 内置目录提取章节（如果有）

        Args:
            pdf_path: PDF 文件路径

        Returns:
            章节列表
        """
        doc = fitz.open(pdf_path)
        toc = doc.get_toc()
        doc.close()

        if not toc:
            return []

        chapters = []

        for level, title, page_num in toc:
            # 只提取一级标题（章）
            if level == 1 and self._is_chapter_title(title):
                chapters.append({
                    'title': title,
                    'level': level,
                    'page_start': page_num,
                    'page_end': None
                })

        # 计算页码范围
        total_pages = len(fitz.open(pdf_path))
        for i, ch in enumerate(chapters):
            if i < len(chapters) - 1:
                ch['page_end'] = chapters[i + 1]['page_start'] - 1
            else:
                ch['page_end'] = total_pages

        return chapters

    def _is_chapter_title(self, text: str) -> bool:
        """判断是否为章节标题"""
        import re
        patterns = [
            r'^第[一二三四五六七八九十\d]+[章篇部]',
            r'^Chapter\s+\d+',
        ]
        return any(re.match(p, text) for p in patterns)


# ========== 命令行接口 ==========

def main():
    """命令行接口"""
    import argparse

    parser = argparse.ArgumentParser(description='PDF 书籍按章节分割工具')
    parser.add_argument('pdf_file', help='PDF 文件路径')
    parser.add_argument('-o', '--output', default='output/chapters', help='输出目录')
    parser.add_argument('--ocr', action='store_true', help='使用 OCR 识别章节')
    parser.add_argument('--backend', default='torch', choices=['torch', 'pipeline'],
                       help='OCR 后端')

    args = parser.parse_args()

    # 创建分割器
    splitter = PDFChapterSplitter(use_ocr=args.ocr, ocr_backend=args.backend)

    # 检测章节
    print("="*80)
    print("步骤 1: 检测章节")
    print("="*80)

    if args.ocr:
        chapters = splitter.detect_chapters_from_ocr(args.pdf_file)
    else:
        chapters = splitter.detect_chapters_from_toc(args.pdf_file)

    if not chapters:
        print("\n⚠️  未检测到章节，请手动指定章节数据")
        sys.exit(1)

    print(f"\n✓ 检测到 {len(chapters)} 个章节")
    for i, ch in enumerate(chapters, 1):
        print(f"  {i}. {ch['title']} (第{ch['page_start']}-{ch['page_end']}页)")

    # 分割 PDF
    print("\n" + "="*80)
    print("步骤 2: 分割 PDF")
    print("="*80)

    result = splitter.split_by_chapters(args.pdf_file, args.output, chapters)

    print(f"\n✓ 完成！输出目录: {args.output}")


if __name__ == "__main__":
    main()
