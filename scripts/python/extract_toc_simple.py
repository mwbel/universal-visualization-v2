#!/usr/bin/env python3
"""
使用 PyMuPDF (fitz) 直接从 PDF 中提取目录和章节信息
"""

import fitz
import re
import json
from pathlib import Path
from typing import List, Dict


def extract_toc_from_pdf(pdf_path: str) -> List[Dict]:
    """
    从 PDF 提取目录

    Args:
        pdf_path: PDF 文件路径

    Returns:
        目录列表
    """
    doc = fitz.open(pdf_path)

    # 1. 尝试从 PDF 内置目录获取
    toc = doc.get_toc()

    if toc:
        print(f"✓ 找到 PDF 内置目录，共 {len(toc)} 条")
        return process_toc_items(toc, doc)

    # 2. 如果没有内置目录，扫描每一页查找章节标题
    print("⚠️  未找到内置目录，扫描所有页面...")
    return scan_for_chapters(doc)


def process_toc_items(toc: list, doc: fitz.Document) -> List[Dict]:
    """
    处理 PDF 内置目录项

    Args:
        toc: 目录列表 [(level, title, page_num), ...]
        doc: PDF 文档对象

    Returns:
        处理后的章节列表
    """
    chapters = []

    for level, title, page_num in toc:
        # 过滤掉不需要的内容
        if any(keyword in title for keyword in ['前言', '目录', '序', '附录', '参考文献']):
            continue

        # 判断是否为章节标题
        if is_chapter_title(title):
            chapters.append({
                'title': title.strip(),
                'level': level,
                'page_start': page_num,
                'page_end': None  # 后续计算
            })

    # 计算页码范围
    chapters = calculate_page_ranges(chapters, doc.page_count)

    return chapters


def scan_for_chapters(doc: fitz.Document) -> List[Dict]:
    """
    扫描 PDF 的每一页，查找章节标题

    Args:
        doc: PDF 文档对象

    Returns:
        章节列表
    """
    chapters = []

    # 章节标题模式
    chapter_patterns = [
        r'^第[一二三四五六七八九十百千\d]+[章篇部]\s+(.+)',  # 第一章 xxx
        r'^Chapter\s+\d+[:：]\s*(.+)',  # Chapter 1: xxx
    ]

    for page_num in range(len(doc)):
        page = doc[page_num]
        text = page.get_text()

        # 按行分割
        lines = text.split('\n')

        for line in lines:
            line = line.strip()

            # 尝试匹配章节标题
            for pattern in chapter_patterns:
                match = re.match(pattern, line)
                if match:
                    title = match.group(1) if match.groups() else line
                    title = title.strip()

                    # 避免重复
                    if not any(c['title'] == title for c in chapters):
                        chapters.append({
                            'title': f"第{extract_chapter_number(line)}章 {title}" if '章' in line else title,
                            'level': 1,
                            'page_start': page_num + 1,  # fitz 页码从 0 开始，PDF 从 1 开始
                            'page_end': None
                        })
                    break

    # 计算页码范围
    chapters = calculate_page_ranges(chapters, doc.page_count)

    return chapters


def is_chapter_title(text: str) -> bool:
    """
    判断文本是否为章节标题

    Args:
        text: 文本内容

    Returns:
        是否为章节标题
    """
    # 章节标题模式
    patterns = [
        r'^第[一二三四五六七八九十百千\d]+[章篇部]',
        r'^Chapter\s+\d+',
        r'^\d+[\.\、]\s*[^\d]{5,}',  # 1. xxx 或 1、xxx
    ]

    for pattern in patterns:
        if re.match(pattern, text):
            return True

    return False


def extract_chapter_number(text: str) -> str:
    """
    从文本中提取章节号

    Args:
        text: 文本内容

    Returns:
        章节号（中文数字或阿拉伯数字）
    """
    match = re.search(r'第([一二三四五六七八九十百千\d]+)[章篇部]', text)
    if match:
        return match.group(1)
    return ''


def calculate_page_ranges(chapters: List[Dict], total_pages: int) -> List[Dict]:
    """
    计算章节的页码范围

    Args:
        chapters: 章节列表
        total_pages: PDF 总页数

    Returns:
        更新了页码范围的章节列表
    """
    if not chapters:
        return chapters

    # 按起始页排序
    chapters = sorted(chapters, key=lambda x: x['page_start'])

    # 计算范围
    for i, chapter in enumerate(chapters):
        if i < len(chapters) - 1:
            chapter['page_end'] = chapters[i + 1]['page_start'] - 1
        else:
            # 最后一章
            chapter['page_end'] = total_pages

    return chapters


def generate_output(chapters: List[Dict], pdf_path: str, output_dir: str):
    """
    生成输出文件（JSON 和 Markdown）

    Args:
        chapters: 章节列表
        pdf_path: PDF 文件路径
        output_dir: 输出目录
    """
    output_path = Path(output_dir)
    output_path.mkdir(parents=True, exist_ok=True)

    pdf_name = Path(pdf_path).stem

    # 1. 生成 JSON
    json_file = output_path / f"{pdf_name}_chapters.json"
    with open(json_file, 'w', encoding='utf-8') as f:
        json.dump({
            'source': pdf_path,
            'total_chapters': len(chapters),
            'chapters': chapters
        }, f, ensure_ascii=False, indent=2)

    print(f"\n✓ JSON 已保存: {json_file}")

    # 2. 生成 Markdown
    md_file = output_path / f"{pdf_name}_toc.md"
    with open(md_file, 'w', encoding='utf-8') as f:
        f.write(f"# {pdf_name} - 目录\n\n")
        f.write(f"**总章节数**: {len(chapters)}\n\n")
        f.write("---\n\n")

        for i, chapter in enumerate(chapters, 1):
            f.write(f"## {i}. {chapter['title']}\n\n")
            f.write(f"- **层级**: {chapter['level']}\n")
            f.write(f"- **起始页**: {chapter['page_start']}\n")
            f.write(f"- **结束页**: {chapter['page_end']}\n")
            f.write(f"- **页数**: {chapter['page_end'] - chapter['page_start'] + 1}\n\n")

    print(f"✓ Markdown 已保存: {md_file}")

    # 3. 打印摘要
    print("\n" + "="*80)
    print("章节列表:")
    print("="*80)

    for i, chapter in enumerate(chapters, 1):
        pages = chapter['page_end'] - chapter['page_start'] + 1
        print(f"{i:2d}. {chapter['title']}")
        print(f"    页码: {chapter['page_start']:3d} - {chapter['page_end']:3d} ({pages:3d} 页)")
        print()


def main():
    import sys

    if len(sys.argv) < 2:
        print("用法: python extract_toc_simple.py <pdf_file> [output_dir]")
        sys.exit(1)

    pdf_file = sys.argv[1]
    output_dir = sys.argv[2] if len(sys.argv) > 2 else "output/toc"

    print(f"正在处理: {pdf_file}")

    # 提取目录
    chapters = extract_toc_from_pdf(pdf_file)

    if not chapters:
        print("\n⚠️  未找到任何章节！")
        sys.exit(1)

    # 生成输出
    generate_output(chapters, pdf_file, output_dir)

    print(f"\n✓ 完成！共找到 {len(chapters)} 个章节")


if __name__ == "__main__":
    main()
