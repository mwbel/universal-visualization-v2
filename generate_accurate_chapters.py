#!/usr/bin/env python3
"""
根据 PDF 目录生成准确的章节页码范围
"""

import json
from pathlib import Path

# 从目录图片中提取的准确信息
CHAPTERS_FROM_TOC = [
    {"number": 1, "title": "概率论的基本概念", "page_start": 1},
    {"number": 2, "title": "随机变量及其分布", "page_start": 62},
    {"number": 3, "title": "多维随机变量及其分布", "page_start": 118},
    {"number": 4, "title": "随机变量的数字特征", "page_start": 174},
    {"number": 5, "title": "大数定律与中心极限定理", "page_start": 200},
    {"number": 6, "title": "样本及抽样分布", "page_start": 218},
    {"number": 7, "title": "参数估计", "page_start": 229},
    {"number": 8, "title": "假设检验", "page_start": 290},
    {"number": 9, "title": "方差分析与回归分析", "page_start": 355},
    {"number": 10, "title": "bootstrap方法", "page_start": 470},
]

# 注意：目录中的页码是从第1章开始的页码，不是PDF的绝对页码
# 需要加上前面的页数（封面等15页）
OFFSET = 15  # 前15页是封面、前言、目录等


def convert_to_pdf_page_num(toc_page_num):
    """
    将目录中的页码转换为PDF的绝对页码

    目录中第1章是第1页，实际PDF中是第16页
    """
    return toc_page_num + OFFSET


def calculate_page_ranges(chapters, total_pages=525):
    """
    计算各章节的页码范围

    方法：
    1. 起始页 = 目录中的页码 + OFFSET
    2. 结束页 = 下一章起始页 - 1
    3. 最后一章的结束页 = 总页数
    """
    # 转换为PDF绝对页码
    for ch in chapters:
        ch['pdf_page_start'] = convert_to_pdf_page_num(ch['page_start'])

    # 计算结束页
    for i, ch in enumerate(chapters):
        if i < len(chapters) - 1:
            ch['pdf_page_end'] = chapters[i + 1]['pdf_page_start'] - 1
        else:
            ch['pdf_page_end'] = total_pages

        ch['page_count'] = ch['pdf_page_end'] - ch['pdf_page_start'] + 1

    return chapters


def save_chapter_data(chapters, output_dir="output"):
    """
    保存准确的章节数据
    """
    output_path = Path(output_dir)
    output_path.mkdir(parents=True, exist_ok=True)

    # 1. 保存 JSON
    json_file = output_path / "概率论与数理统计第五版_章节结构_准确版.json"

    with open(json_file, 'w', encoding='utf-8') as f:
        json.dump({
            '说明': '页码来源于PDF目录，经人工验证',
            '教材名称': '概率论与数理统计第五版',
            '作者': '盛骤',
            '总页数': 525,
            '正文起始页': 16,
            '偏移量': OFFSET,  # 目录页码到PDF页码的偏移
            '章节数量': len(chapters),
            'chapters': chapters
        }, f, ensure_ascii=False, indent=2)

    print(f"✓ JSON 已保存: {json_file}")

    # 2. 保存 Markdown
    md_file = output_path / "概率论与数理统计第五版_章节目录_准确版.md"

    with open(md_file, 'w', encoding='utf-8') as f:
        f.write("# 概率论与数理统计第五版（盛骤）\n\n")
        f.write("## 章节目录（基于PDF目录）\n\n")
        f.write(f"**数据来源**: PDF内嵌目录（经人工识别）\n\n")
        f.write(f"**总页数**: 525页\n\n")
        f.write(f"**正文起始**: 第16页\n\n")
        f.write(f"**章节数**: {len(chapters)}章\n\n")
        f.write("---\n\n")

        for ch in chapters:
            f.write(f"## 第{ch['number']}章 {ch['title']}\n\n")
            f.write(f"- **目录页码**: 第{ch['page_start']}页\n")
            f.write(f"- **PDF页码**: 第{ch['pdf_page_start']}页 - 第{ch['pdf_page_end']}页\n")
            f.write(f"- **页数**: {ch['page_count']}页\n\n")

    print(f"✓ Markdown 已保存: {md_file}")

    # 3. 打印摘要
    print("\n" + "="*80)
    print("章节列表（基于PDF目录）:")
    print("="*80)

    for ch in chapters:
        print(f"第{ch['number']:2d}章 {ch['title']}")
        print(f"  目录页码: 第{ch['page_start']:3d}页")
        print(f"  PDF页码: 第{ch['pdf_page_start']:3d}页 - 第{ch['pdf_page_end']:3d}页 ({ch['page_count']:3d}页)")
        print()


def main():
    print("《概率论与数理统计第五版 盛骤》准确章节结构\n")
    print("数据来源: PDF目录（第12-13页）\n")

    # 计算页码范围
    chapters = calculate_page_ranges([ch.copy() for ch in CHAPTERS_FROM_TOC])

    # 保存数据
    save_chapter_data(chapters)

    print("\n✓ 完成！")
    print(f"✓ 共 {len(chapters)} 章")
    print(f"✓ 页码已根据PDF目录校正")


if __name__ == "__main__":
    main()
