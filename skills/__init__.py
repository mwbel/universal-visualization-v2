"""
PDF 教材处理 Skills 包

包含两个独立的 Skills:
1. TOCRecognizerSkill - 目录识别和页码范围计算
2. PDFSplitterSkill - PDF 分割和 Markdown 转换
"""

from .toc_recognizer_skill import (
    TOCRecognizerSkill,
    Chapter,
    Section,
    recognize_pdf_toc
)

from .pdf_splitter_skill import (
    PDFSplitterSkill,
    ChapterResult,
    split_and_convert_pdf
)

__all__ = [
    # Skill 1
    'TOCRecognizerSkill',
    'Chapter',
    'Section',
    'recognize_pdf_toc',

    # Skill 2
    'PDFSplitterSkill',
    'ChapterResult',
    'split_and_convert_pdf',
]

__version__ = '1.0.0'
