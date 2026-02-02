#!/usr/bin/env python3
"""
检查 PDF 前 30 页的内容
"""

import fitz
import sys

if len(sys.argv) < 2:
    print("用法: python check_pages.py <pdf_file>")
    sys.exit(1)

pdf_file = sys.argv[1]
doc = fitz.open(pdf_file)

print(f"检查前 30 页内容（从第 16 页 - 正文开始）:")
print("=" * 80)

# 从第 16 页开始检查
for page_num in range(15, min(45, len(doc))):  # 检查第16-45页
    page = doc[page_num]
    text = page.get_text()

    # 获取前几行
    lines = [line.strip() for line in text.split('\n') if line.strip()]

    print(f"\n第 {page_num + 1} 页 ({len(lines)} 行):")
    print("-" * 40)

    # 显示前 10 行
    for i, line in enumerate(lines[:10], 1):
        print(f"  {i}. {line[:70]}")

    if len(lines) > 10:
        print(f"  ... (还有 {len(lines) - 10} 行)")
