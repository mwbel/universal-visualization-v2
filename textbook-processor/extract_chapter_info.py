#!/usr/bin/env python3
"""
从已有的分章PDF中提取章节信息，生成完整的目录结构
"""

import fitz
import re
from pathlib import Path
from typing import List, Dict
import json


def extract_chapter_info_from_split_pdfs(split_dir: str) -> List[Dict]:
    """
    从分章PDF文件中提取章节信息

    Args:
        split_dir: 分章PDF所在目录

    Returns:
        章节信息列表
    """
    split_path = Path(split_dir)
    chapters = []

    # 按文件名排序
    pdf_files = sorted(split_path.glob("概率论与数理统计第五版盛骤_*.pdf"))

    for pdf_file in pdf_files:
        try:
            doc = fitz.open(str(pdf_file))

            # 从文件名提取信息
            filename = pdf_file.stem
            # 文件名格式：概率论与数理统计第五版盛骤_1-2章.pdf
            match = re.search(r'_(\d+)-(\d+)[章篇部]', filename)
            if match:
                chapter_start = int(match.group(1))
                chapter_end = int(match.group(2))
                title = f"第{chapter_start}-{chapter_end}章"
            else:
                # 其他格式
                title = filename.split('_', 1)[-1] if '_' in filename else filename

            # 获取页数
            page_count = len(doc)

            chapters.append({
                'title': title,
                'file': pdf_file.name,
                'page_count': page_count,
                'chapter_range': f"{chapter_start}-{chapter_end}" if match else None
            })

            doc.close()

        except Exception as e:
            print(f"处理文件 {pdf_file} 失败: {e}")

    return chapters


def merge_with_main_pdf(main_pdf_path: str, chapters: List[Dict]) -> List[Dict]:
    """
    将分章信息与主PDF合并，计算实际页码

    Args:
        main_pdf_path: 完整版PDF路径
        chapters: 章节信息列表

    Returns:
        包含实际页码的章节列表
    """
    main_doc = fitz.open(main_pdf_path)
    total_pages = len(main_doc)
    main_doc.close()

    # 假设正文从第16页开始（前面是前言等）
    current_page = 16

    for i, chapter in enumerate(chapters):
        chapter['page_start'] = current_page
        chapter['page_end'] = current_page + chapter['page_count'] - 1

        # 更新下一章的起始页
        current_page = chapter['page_end'] + 1

    return chapters


def generate_complete_metadata(main_pdf_path: str, split_dir: str, output_file: str):
    """
    生成完整的元数据文件

    Args:
        main_pdf_path: 完整版PDF路径
        split_dir: 分章PDF目录
        output_file: 输出JSON文件路径
    """
    print("提取分章信息...")
    chapters = extract_chapter_info_from_split_pdfs(split_dir)

    print(f"\n找到 {len(chapters)} 个章节:")
    for i, chapter in enumerate(chapters, 1):
        print(f"{i}. {chapter['title']} ({chapter['page_count']} 页)")

    print("\n计算页码范围...")
    chapters = merge_with_main_pdf(main_pdf_path, chapters)

    # 构建元数据
    metadata = {
        "title": "概率论与数理统计第五版盛骤",
        "author": "盛骤",
        "total_pages": 525,
        "toc_source": "从分章PDF提取",
        "processed_at": "2026-01-30",
        "chapters": []
    }

    for i, chapter in enumerate(chapters, 1):
        chapter_info = {
            "chapter_number": i,
            "title": chapter['title'],
            "level": 1,
            "page_start": chapter['page_start'],
            "page_end": chapter['page_end'],
            "page_count": chapter['page_count'],
            "original_file": chapter['file']
        }
        metadata['chapters'].append(chapter_info)

    # 保存JSON
    output_path = Path(output_file)
    output_path.parent.mkdir(parents=True, exist_ok=True)

    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(metadata, f, ensure_ascii=False, indent=2)

    print(f"\n✓ 元数据已保存到: {output_file}")

    return metadata


if __name__ == "__main__":
    import sys

    if len(sys.argv) < 3:
        print("用法: python extract_chapter_info.py <完整版PDF> <分章目录> [输出文件]")
        sys.exit(1)

    main_pdf = sys.argv[1]
    split_dir = sys.argv[2]
    output = sys.argv[3] if len(sys.argv) > 3 else "chapter_metadata.json"

    try:
        metadata = generate_complete_metadata(main_pdf, split_dir, output)

        print("\n" + "="*80)
        print("章节列表（包含页码范围）:")
        print("="*80)

        for chapter in metadata['chapters']:
            print(f"{chapter['chapter_number']}. {chapter['title']}")
            print(f"   页码范围: {chapter['page_start']} - {chapter['page_end']} ({chapter['page_count']} 页)")
            print()

    except Exception as e:
        print(f"错误: {e}")
        import traceback
        traceback.print_exc()
