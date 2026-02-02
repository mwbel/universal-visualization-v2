#!/usr/bin/env python3
"""
检查 PDF 目录内容
"""

import fitz
import sys

if len(sys.argv) < 2:
    print("用法: python inspect_toc.py <pdf_file>")
    sys.exit(1)

pdf_file = sys.argv[1]
doc = fitz.open(pdf_file)

toc = doc.get_toc()

print(f"PDF 目录内容 (共 {len(toc)} 条):")
print("=" * 80)

for i, (level, title, page_num) in enumerate(toc, 1):
    indent = "  " * (level - 1)
    print(f"{i:2d}. [{level}] {indent}{title:50s} -> 页码 {page_num}")

print("\n" + "=" * 80)
print(f"总页数: {len(doc)}")
