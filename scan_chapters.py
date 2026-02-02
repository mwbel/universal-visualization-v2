#!/usr/bin/env python3
"""
扫描 PDF 页面查找章节标题
"""

import fitz
import re
import json
from pathlib import Path


def scan_pdf_for_chapters(pdf_path: str):
    """
    扫描 PDF 查找章节标题

    Args:
        pdf_path: PDF 文件路径
    """
    doc = fitz.open(pdf_path)

    print(f"扫描 PDF: {Path(pdf_path).name}")
    print(f"总页数: {len(doc)}")
    print(f"开始扫描页面查找章节标题...\n")

    chapters = []

    # 定义章节标题模式（更精确）
    chapter_patterns = [
        (r'^第([一二三四五六七八九十百千\d]+)章\s+(.+)', 1, '中文数字'),
        (r'^(\d+)\.?\s*[概率统计随机变量函数分布极限大数定律中心极限定理抽样分布假设检验方差分析回归分析正态分布].{5,50}', 1, '阿拉伯数字'),
    ]

    # 从第16页开始（正文开始）
    start_page = 15  # 0-indexed，所以 15 = 第 16 页

    for page_num in range(start_page, len(doc)):
        page = doc[page_num]

        # 获取页面文本
        text = page.get_text()

        # 按行分割
        lines = text.split('\n')

        for line in lines:
            line = line.strip()

            # 跳过太短的行
            if len(line) < 5:
                continue

            # 尝试匹配章节标题
            for pattern, level, desc in chapter_patterns:
                match = re.match(pattern, line)
                if match:
                    title = line

                    # 避免重复
                    if not any(c['title'] == title for c in chapters):
                        chapters.append({
                            'title': title,
                            'level': level,
                            'page_start': page_num + 1,  # 转换为 1-indexed
                            'page_end': None,
                            'pattern_type': desc
                        })
                        print(f"  ✓ 找到章节 (第 {page_num + 1} 页): {title}")
                    break

    # 计算页码范围
    if chapters:
        chapters = sorted(chapters, key=lambda x: x['page_start'])

        for i, chapter in enumerate(chapters):
            if i < len(chapters) - 1:
                chapter['page_end'] = chapters[i + 1]['page_start'] - 1
            else:
                chapter['page_end'] = len(doc)

        print(f"\n✓ 共找到 {len(chapters)} 个章节")

    return chapters


def save_chapters(chapters, pdf_path, output_dir="output"):
    """
    保存章节信息到文件

    Args:
        chapters: 章节列表
        pdf_path: PDF 文件路径
        output_dir: 输出目录
    """
    output_path = Path(output_dir)
    output_path.mkdir(parents=True, exist_ok=True)

    pdf_name = Path(pdf_path).stem

    # 保存 JSON
    json_file = output_path / f"{pdf_name}_chapters.json"

    output_data = {
        'source': pdf_path,
        'pdf_name': pdf_name,
        'total_chapters': len(chapters),
        'chapters': chapters
    }

    with open(json_file, 'w', encoding='utf-8') as f:
        json.dump(output_data, f, ensure_ascii=False, indent=2)

    print(f"\n✓ JSON 已保存到: {json_file}")

    # 保存 Markdown
    md_file = output_path / f"{pdf_name}_toc.md"

    with open(md_file, 'w', encoding='utf-8') as f:
        f.write(f"# {pdf_name} - 章节目录\n\n")
        f.write(f"**生成时间**: {__import__('datetime').datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n\n")
        f.write(f"**总章节数**: {len(chapters)}\n\n")
        f.write("---\n\n")

        for i, chapter in enumerate(chapters, 1):
            page_count = chapter['page_end'] - chapter['page_start'] + 1
            f.write(f"## {i}. {chapter['title']}\n\n")
            f.write(f"- **层级**: {chapter['level']}\n")
            f.write(f"- **页码范围**: {chapter['page_start']} - {chapter['page_end']}\n")
            f.write(f"- **页数**: {page_count}\n")
            f.write(f"- **识别模式**: {chapter.get('pattern_type', 'unknown')}\n\n")

    print(f"✓ Markdown 已保存到: {md_file}")

    # 打印摘要
    print("\n" + "="*80)
    print("章节列表:")
    print("="*80)

    for i, chapter in enumerate(chapters, 1):
        page_count = chapter['page_end'] - chapter['page_start'] + 1
        print(f"{i:2d}. {chapter['title']}")
        print(f"    页码: {chapter['page_start']:3d} - {chapter['page_end']:3d} ({page_count:3d} 页)")
        print()


def main():
    import sys

    if len(sys.argv) < 2:
        print("用法: python scan_chapters.py <pdf_file> [output_dir]")
        sys.exit(1)

    pdf_file = sys.argv[1]
    output_dir = sys.argv[2] if len(sys.argv) > 2 else "output"

    chapters = scan_pdf_for_chapters(pdf_file)

    if chapters:
        save_chapters(chapters, pdf_file, output_dir)
    else:
        print("\n⚠️  未找到任何章节！")


if __name__ == "__main__":
    main()
