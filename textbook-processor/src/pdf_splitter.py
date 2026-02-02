"""
PDF 切分模块
根据章节信息将 PDF 切分为独立的文件
"""

import fitz  # PyMuPDF
from pathlib import Path
from typing import List, Optional
import shutil

from pdf_analyzer import ChapterInfo, PDFMetadata, PDFAnalyzer


class PDFSplitter:
    """PDF 切分器"""

    def __init__(self, pdf_path: str, output_dir: str):
        """
        初始化 PDF 切分器

        Args:
            pdf_path: 源 PDF 文件路径
            output_dir: 输出目录
        """
        self.pdf_path = Path(pdf_path)
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(parents=True, exist_ok=True)

        # 创建子目录
        self.chapters_dir = self.output_dir / "chapters"
        self.chapters_dir.mkdir(exist_ok=True)

        self.doc: fitz.Document = None
        self.metadata: PDFMetadata = None

    def sanitize_filename(self, filename: str, max_length: int = 100) -> str:
        """
        清理文件名，移除非法字符

        Args:
            filename: 原始文件名
            max_length: 最大长度

        Returns:
            清理后的文件名
        """
        # 移除或替换非法字符
        invalid_chars = ['<', '>', ':', '"', '/', '\\', '|', '?', '*']
        for char in invalid_chars:
            filename = filename.replace(char, '_')

        # 移除前后空格
        filename = filename.strip()

        # 限制长度
        if len(filename) > max_length:
            filename = filename[:max_length]

        # 如果为空，使用默认名称
        if not filename:
            filename = "unnamed"

        return filename

    def split_chapter(self, chapter: ChapterInfo, doc: fitz.Document,
                     prefix: str = "") -> Optional[Path]:
        """
        切分单个章节

        Args:
            chapter: 章节信息
            doc: PDF 文档对象
            prefix: 文件名前缀

        Returns:
            切分后的文件路径，如果失败返回 None
        """
        try:
            # 计算页码范围（fitz 页码从 0 开始）
            start = chapter.page_start - 1
            end = chapter.page_end

            # 创建新 PDF
            new_doc = fitz.open()

            # 复制页面
            for page_num in range(start, end):
                if page_num < len(doc):
                    new_doc.insert_pdf(doc, from_page=page_num, to_page=page_num)

            # 生成文件名
            chapter_num = f"{chapter.chapter_number:02d}"
            title_clean = self.sanitize_filename(chapter.title)

            filename = f"{prefix}{chapter_num}_{title_clean}.pdf"
            output_path = self.chapters_dir / filename

            # 保存文件
            new_doc.save(output_path)
            new_doc.close()

            print(f"✓ 已保存: {filename} ({end - start} 页)")
            return output_path

        except Exception as e:
            print(f"✗ 切分章节 {chapter.title} 失败: {e}")
            return None

    def split_special_pages(self, doc: fitz.Document,
                          metadata: PDFMetadata) -> List[Path]:
        """
        切分特殊页面（前言、目录等）

        Args:
            doc: PDF 文档对象
            metadata: PDF 元数据

        Returns:
            保存的文件路径列表
        """
        paths = []

        try:
            # 如果有章节信息，第一章之前的页面作为前言
            if metadata.chapters:
                first_chapter_start = metadata.chapters[0].page_start - 1

                if first_chapter_start > 0:
                    # 切分前言部分
                    preface_doc = fitz.open()
                    for page_num in range(0, first_chapter_start):
                        preface_doc.insert_pdf(doc, from_page=page_num, to_page=page_num)

                    output_path = self.chapters_dir / "00_前言.pdf"
                    preface_doc.save(output_path)
                    preface_doc.close()

                    print(f"✓ 已保存前言: 00_前言.pdf ({first_chapter_start} 页)")
                    paths.append(output_path)

            return paths

        except Exception as e:
            print(f"✗ 切分特殊页面失败: {e}")
            return paths

    def split_all_chapters(self, metadata: PDFMetadata,
                          book_title: str = "") -> dict:
        """
        切分所有章节

        Args:
            metadata: PDF 元数据（包含章节信息）
            book_title: 书名（用于文件名前缀）

        Returns:
            切分结果字典，包含成功和失败的章节
        """
        if not metadata.chapters:
            print("没有章节信息，无法切分")
            return {'success': [], 'failed': [], 'special': []}

        # 打开 PDF
        try:
            self.doc = fitz.open(str(self.pdf_path))
        except Exception as e:
            print(f"无法打开 PDF: {e}")
            return {'success': [], 'failed': [], 'special': []}

        # 生成文件名前缀
        if book_title:
            prefix = self.sanitize_filename(book_title) + "_"
        else:
            prefix = ""

        # 切分特殊页面
        special_paths = self.split_special_pages(self.doc, metadata)

        # 切分章节
        success_chapters = []
        failed_chapters = []

        print(f"\n开始切分 {len(metadata.chapters)} 个章节...")

        for chapter in metadata.chapters:
            path = self.split_chapter(chapter, self.doc, prefix)
            if path:
                success_chapters.append({
                    'chapter': chapter,
                    'path': path
                })
            else:
                failed_chapters.append(chapter)

        # 关闭 PDF
        self.doc.close()

        # 保存元数据
        self.metadata = metadata

        # 打印统计
        print(f"\n切分完成:")
        print(f"  成功: {len(success_chapters)} 个章节")
        print(f"  失败: {len(failed_chapters)} 个章节")
        print(f"  特殊页面: {len(special_paths)} 个文件")
        print(f"\n输出目录: {self.chapters_dir}")

        return {
            'success': success_chapters,
            'failed': failed_chapters,
            'special': special_paths
        }

    def create_manifest(self, split_result: dict,
                       metadata: PDFMetadata) -> Path:
        """
        创建切分清单文件

        Args:
            split_result: 切分结果
            metadata: PDF 元数据

        Returns:
            清单文件路径
        """
        manifest_path = self.output_dir / "manifest.txt"

        try:
            with open(manifest_path, 'w', encoding='utf-8') as f:
                f.write(f"PDF 切分清单\n")
                f.write(f"{'='*60}\n\n")
                f.write(f"书名: {metadata.title}\n")
                f.write(f"作者: {metadata.author}\n")
                f.write(f"总页数: {metadata.total_pages}\n")
                f.write(f"章节数: {len(metadata.chapters)}\n\n")

                f.write(f"成功切分的章节:\n")
                f.write(f"{'-'*60}\n")
                for item in split_result['success']:
                    chapter = item['chapter']
                    path = item['path']
                    f.write(f"  {chapter.chapter_number}. {chapter.title}\n")
                    f.write(f"     页码: {chapter.page_start}-{chapter.page_end}\n")
                    f.write(f"     文件: {path.name}\n")

                if split_result['failed']:
                    f.write(f"\n失败的章节:\n")
                    f.write(f"{'-'*60}\n")
                    for chapter in split_result['failed']:
                        f.write(f"  {chapter.chapter_number}. {chapter.title}\n")
                        f.write(f"     页码: {chapter.page_start}-{chapter.page_end}\n")

                if split_result['special']:
                    f.write(f"\n特殊页面:\n")
                    f.write(f"{'-'*60}\n")
                    for path in split_result['special']:
                        f.write(f"  文件: {path.name}\n")

            print(f"✓ 已创建清单文件: {manifest_path}")
            return manifest_path

        except Exception as e:
            print(f"✗ 创建清单失败: {e}")
            return None


if __name__ == "__main__":
    # 测试代码
    import sys

    if len(sys.argv) < 3:
        print("用法: python pdf_splitter.py <pdf_file> <output_dir>")
        sys.exit(1)

    pdf_file = sys.argv[1]
    output_dir = sys.argv[2]

    try:
        # 先分析 PDF
        analyzer = PDFAnalyzer(pdf_file)
        metadata = analyzer.analyze()

        # 切分 PDF
        splitter = PDFSplitter(pdf_file, output_dir)
        result = splitter.split_all_chapters(metadata, metadata.title)

        # 创建清单
        splitter.create_manifest(result, metadata)

    except Exception as e:
        print(f"错误: {e}")
        import traceback
        traceback.print_exc()
