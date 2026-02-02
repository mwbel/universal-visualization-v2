#!/usr/bin/env python3
"""
《概率论与数理统计第五版 盛骤》标准章节结构
简化版本
"""

import json
from pathlib import Path

# 盛骤《概率论与数理统计第五版》标准章节结构（根据教材标准）
CHAPTERS = [
    {"number": 1, "title": "概率论的基本概念", "page_start": 16},
    {"number": 2, "title": "随机变量及其分布", "page_start": 62},
    {"number": 3, "title": "多维随机变量及其分布", "page_start": 118},
    {"number": 4, "title": "随机变量的数字特征", "page_start": 174},
    {"number": 5, "title": "大数定律与中心极限定理", "page_start": 200},
    {"number": 6, "title": "样本及抽样分布", "page_start": 218},
    {"number": 7, "title": "参数估计", "page_start": 229},
    {"number": 8, "title": "假设检验", "page_start": 290},
    {"number": 9, "title": "方差分析与回归分析", "page_start": 355},
    {"number": 10, "title": "Bootstrap方法", "page_start": 470},
]

def calculate_page_ranges(chapters, total_pages=525):
    """
    计算各章节的页码范围
    """
    for i, ch in enumerate(chapters):
        if i < len(chapters) - 1:
            ch['page_end'] = chapters[i + 1]['page_start'] - 1
        else:
            ch['page_end'] = total_pages

        ch['page_count'] = ch['page_end'] - ch['page_start'] + 1

    return chapters


def save_chapter_data(chapters, output_dir="output"):
    """
    保存章节数据
    """
    output_path = Path(output_dir)
    output_path.mkdir(parents=True, exist_ok=True)

    # 1. 保存 JSON
    json_file = output_path / "概率论与数理统计第五版_章节结构.json"

    with open(json_file, 'w', encoding='utf-8') as f:
        json.dump({
            '教材名称': '概率论与数理统计第五版',
            '作者': '盛骤',
            '出版社': '高等教育出版社',
            '总页数': 525,
            '正文起始页': 16,
            '章节数量': len(chapters),
            'chapters': chapters
        }, f, ensure_ascii=False, indent=2)

    print(f"✓ JSON 已保存: {json_file}")

    # 2. 保存 Markdown
    md_file = output_path / "概率论与数理统计第五版_章节目录.md"

    with open(md_file, 'w', encoding='utf-8') as f:
        f.write("# 概率论与数理统计第五版（盛骤）\n\n")
        f.write("## 章节目录与页码范围\n\n")
        f.write(f"**教材**: 概率论与数理统计第五版\n\n")
        f.write(f"**作者**: 盛骤\n\n")
        f.write(f"**总页数**: 525页\n\n")
        f.write(f"**正文起始**: 第16页\n\n")
        f.write(f"**章节数**: {len(chapters)}章\n\n")
        f.write("---\n\n")

        for ch in chapters:
            f.write(f"## 第{ch['number']}章 {ch['title']}\n\n")
            f.write(f"- **页码范围**: 第{ch['page_start']}页 - 第{ch['page_end']}页\n")
            f.write(f"- **页数**: {ch['page_count']}页\n\n")

    print(f"✓ Markdown 已保存: {md_file}")

    # 3. 打印摘要
    print("\n" + "="*80)
    print("章节列表（含页码范围）:")
    print("="*80)

    for ch in chapters:
        print(f"第{ch['number']:2d}章 {ch['title']}")
        print(f"  页码: 第{ch['page_start']:3d}页 - 第{ch['page_end']:3d}页 ({ch['page_count']:3d}页)")
        print()


def main():
    print("《概率论与数理统计第五版 盛骤》章节结构\n")
    print("正在生成章节数据...\n")

    # 计算页码范围
    chapters = calculate_page_ranges(CHAPTERS.copy())

    # 保存数据
    save_chapter_data(chapters)

    print("\n✓ 完成！")
    print(f"✓ 共 {len(chapters)} 章")
    print(f"✓ 数据已保存到 output/ 目录")


if __name__ == "__main__":
    main()
