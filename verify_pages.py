#!/usr/bin/env python3
"""
验证章节页码的准确性
使用 PyMuPDF 将指定页面转换为图片，方便人工验证
"""

import fitz
import sys
from pathlib import Path

def verify_page_numbers(pdf_path, output_dir="output/verification"):
    """
    验证关键页面的章节标题

    Args:
        pdf_path: PDF 文件路径
        output_dir: 输出目录
    """
    doc = fitz.open(pdf_path)

    # 需要验证的关键页面
    check_pages = [
        16,   # 第1章开始
        62,   # 第2章开始
        118,  # 第3章开始
        174,  # 第4章开始
        200,  # 第5章开始
        218,  # 第6章开始
        229,  # 第7章开始（已确认）
        290,  # 第8章开始
        355,  # 第9章开始
        470,  # 第10章开始
    ]

    output_path = Path(output_dir)
    output_path.mkdir(parents=True, exist_ok=True)

    print(f"正在从 PDF 中提取关键页面用于验证...\n")
    print(f"PDF 文件: {Path(pdf_path).name}")
    print(f"总页数: {len(doc)}")
    print("\n将生成以下页面的截图:")

    for page_num in check_pages:
        if page_num > len(doc):
            print(f"  ⚠️  第{page_num}页超出范围（PDF共{len(doc)}页），跳过")
            continue

        page = doc[page_num - 1]  # 转换为 0-indexed

        # 渲染为图片
        mat = fitz.Matrix(2, 2)  # 2倍缩放
        pix = page.get_pixmap(matrix=mat)

        img_path = output_path / f"page_{page_num:03d}.png"
        pix.save(str(img_path))

        print(f"  ✓ 第{page_num:3d}页 → {img_path.name}")

    doc.close()

    print(f"\n✓ 所有截图已保存到: {output_path}")
    print(f"\n下一步：")
    print(f"  1. 打开 {output_path} 目录")
    print(f"  2. 查看每张截图，确认是否为对应章节的起始页")
    print(f"  3. 如有错误，请记录正确的页码")


if __name__ == "__main__":
    pdf_file = "书籍/概率论与数理统计第五版盛骤-完整版.pdf"

    if len(sys.argv) > 1:
        pdf_file = sys.argv[1]

    verify_page_numbers(pdf_file)
