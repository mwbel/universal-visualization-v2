#!/usr/bin/env python3
"""
测试 PDF 分割功能（使用已有的章节数据）
"""

import json
from pathlib import Path
from pdf_chapter_splitter import PDFChapterSplitter

def main():
    # 读取已提取的章节数据
    metadata_file = Path("output/概率论与数理统计第五版_章节结构_准确版.json")

    if not metadata_file.exists():
        print(f"❌ 章节数据文件不存在: {metadata_file}")
        return

    with open(metadata_file, 'r', encoding='utf-8') as f:
        metadata = json.load(f)

    chapters = metadata['chapters']

    print("="*80)
    print("使用已提取的章节数据进行分割测试")
    print("="*80)
    print(f"\n教材名称: {metadata['教材名称']}")
    print(f"作者: {metadata['作者']}")
    print(f"章节数量: {len(chapters)}\n")

    # 转换为 PDFChapterSplitter 需要的格式
    formatted_chapters = []
    for ch in chapters:
        formatted_chapters.append({
            'title': f"第{ch['number']}章 {ch['title']}",
            'page_start': ch['pdf_page_start'],
            'page_end': ch['pdf_page_end']
        })

    # 显示章节信息
    print("章节列表:")
    for ch in formatted_chapters:
        page_count = ch['page_end'] - ch['page_start'] + 1
        print(f"  {ch['title']:40s} (第{ch['page_start']}-{ch['page_end']}页, {page_count}页)")

    # 创建分割器
    splitter = PDFChapterSplitter(use_ocr=False)

    # 分割 PDF
    print("\n" + "="*80)
    print("开始分割 PDF...")
    print("="*80)

    result = splitter.split_by_chapters(
        "书籍/概率论与数理统计第五版盛骤-完整版.pdf",
        "output/test_split",
        formatted_chapters
    )

    print(f"\n✓ 测试完成！")
    print(f"✓ 输出目录: output/test_split")
    print(f"✓ 共生成 {len(result['chapters'])} 个章节文件")

if __name__ == "__main__":
    main()
