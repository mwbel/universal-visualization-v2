#!/usr/bin/env python3
"""
《概率论与数理统计第五版 盛骤》标准章节结构
根据教材标准结构手动定义
"""

import json
from pathlib import Path

# 盛骤《概率论与数理统计第五版》标准章节结构
CHAPTERS = [
    {"number": 1, "title": "概率论的基本概念", "page_start": 16, "topics": ["样本空间与随机事件", "频率与概率", "等可能概型", "条件概率", "独立性"]},
    {"number": 2, "title": "随机变量及其分布", "page_start": None, "topics": ["随机变量", "离散型随机变量", "连续型随机变量", "分布函数"]},
    {"number": 3, "title": "多维随机变量及其分布", "page_start": None, "topics": ["二维随机变量", "边缘分布", "条件分布", "相互独立性"]},
    {"number": 4, "title": "随机变量的数字特征", "page_start": None, "topics": ["数学期望", "方差", "协方差", "相关系数", "矩"]},
    {"number": 5, "title": "大数定律与中心极限定理", "page_start": None, "topics": ["大数定律", "中心极限定理"]},
    {"number": 6, "title": "样本及抽样分布", "page_start": None, "topics": ["随机样本", "统计量", "抽样分布"]},
    {"number": 7, "title": "参数估计", "page_start": 229, "topics": ["点估计", "估计量的评选标准", "区间估计"]},
    {"number": 8, "title": "假设检验", "page_start": None, "topics": ["假设检验的基本概念", "正态总体均值的检验", "正态总体方差的检验"]},
    {"number": 9, "title": "方差分析与回归分析", "page_start": None, "topics": ["单因素方差分析", "双因素方差分析", "一元线性回归", "多元线性回归"]},
    {"number": 10, "title": "Bootstrap方法", "page_start": None, "topics": ["Bootstrap基本思想", "Bootstrap估计", "Bootstrap检验"]},
]

def calculate_page_ranges(chapters, total_pages=525):
    """
    根据总页数计算各章节的页码范围

    Args:
        chapters: 章节列表
        total_pages: 总页数

    Returns:
        更新了页码范围的章节列表
    """
    # 找到第一个有明确页码的章节
    first_known = None
    for i, ch in enumerate(chapters):
        if ch['page_start'] is not None:
            first_known = i
            break

    if first_known is None:
        # 如果没有明确的页码，平均分配
        pages_per_chapter = (total_pages - 16) // len(chapters)
        for i, ch in enumerate(chapters):
            ch['page_start'] = 16 + i * pages_per_chapter  # 从第16页开始
            if i < len(chapters) - 1:
                ch['page_end'] = 16 + (i + 1) * pages_per_chapter - 1
            else:
                ch['page_end'] = total_pages
    elif first_known == 0:
        # 第一章就有页码，根据后续章节推算
        for i in range(1, len(chapters)):
            if chapters[i]['page_start'] is None:
                # 估算（假设每章约30-50页）
                chapters[i]['page_start'] = chapters[i-1]['page_end'] + 1

            if i < len(chapters) - 1:
                # 估算下一章
                if chapters[i]['page_end'] is None:
                    chapters[i]['page_end'] = chapters[i]['page_start'] + 39  # 假设每章40页
            else:
                chapters[i]['page_end'] = total_pages
    else:
        # 根据已知页码推算其他章节
        # 第1章到first_known章
        pages_per_chapter = (chapters[first_known]['page_start'] - 16) // first_known

        for i in range(first_known):
            chapters[i]['page_start'] = 16 + i * pages_per_chapter
            chapters[i]['page_end'] = 16 + (i + 1) * pages_per_chapter - 1

        # first_known章及以后
        for i in range(first_known, len(chapters)):
            if chapters[i]['page_start'] is None:
                # 估算
                chapters[i]['page_start'] = chapters[i-1]['page_end'] + 1

            if chapters[i]['page_end'] is None:
                if i < len(chapters) - 1:
                    # 估算下一章（假设每章约40页）
                    chapters[i]['page_end'] = chapters[i]['page_start'] + 39
                else:
                    chapters[i]['page_end'] = total_pages

    return chapters


def save_chapter_data(chapters, output_dir="output"):
    """
    保存章节数据

    Args:
        chapters: 章节列表
        output_dir: 输出目录
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
            '章节数量': len(chapters),
            'chapters': chapters
        }, f, ensure_ascii=False, indent=2)

    print(f"✓ JSON 已保存: {json_file}")

    # 2. 保存 Markdown
    md_file = output_path / "概率论与数理统计第五版_章节目录.md"

    with open(md_file, 'w', encoding='utf-8') as f:
        f.write("# 概率论与数理统计第五版（盛骤）\n\n")
        f.write("## 章节目录\n\n")
        f.write(f"**总页数**: 525页\n\n")
        f.write(f"**章节数**: {len(chapters)}章\n\n")
        f.write("---\n\n")

        for ch in chapters:
            f.write(f"## 第{ch['number']}章 {ch['title']}\n\n")
            f.write(f"- **页码范围**: {ch['page_start']} - {ch['page_end']} ({ch['page_end'] - ch['page_start'] + 1}页)\n")
            f.write(f"- **主要知识点**:\n")

            for topic in ch['topics']:
                f.write(f"  - {topic}\n")
            f.write("\n")

    print(f"✓ Markdown 已保存: {md_file}")

    # 3. 打印摘要
    print("\n" + "="*80)
    print("章节列表:")
    print("="*80)

    for ch in chapters:
        page_count = ch['page_end'] - ch['page_start'] + 1
        print(f"第{ch['number']:2d}章 {ch['title']}")
        print(f"  页码: {ch['page_start']:3d} - {ch['page_end']:3d} ({page_count:3d} 页)")
        print()


def main():
    print("《概率论与数理统计第五版 盛骤》章节结构\n")

    # 计算页码范围
    chapters = calculate_page_ranges(CHAPTERS.copy())

    # 保存数据
    save_chapter_data(chapters)

    print("\n✓ 完成！")


if __name__ == "__main__":
    main()
