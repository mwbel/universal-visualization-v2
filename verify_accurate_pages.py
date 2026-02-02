#!/usr/bin/env python3
"""
验证根据目录计算的页码是否准确
"""

import fitz
from pathlib import Path

def verify_chapter_pages(pdf_path):
    """
    验证关键章节的起始页
    """
    doc = fitz.open(pdf_path)

    # 根据目录计算的起始页（PDF绝对页码）
    check_pages = [
        (16, "第1章：概率论的基本概念"),
        (77, "第2章：随机变量及其分布"),
        (133, "第3章：多维随机变量及其分布"),
        (189, "第4章：随机变量的数字特征"),
        (244, "第7章：参数估计"),
    ]

    output_dir = Path("output/verification_accurate")
    output_dir.mkdir(parents=True, exist_ok=True)

    print("生成验证截图...\n")

    for page_num, title in check_pages:
        if page_num > len(doc):
            print(f"⚠️  第{page_num}页超出范围，跳过")
            continue

        page = doc[page_num - 1]
        mat = fitz.Matrix(2, 2)
        pix = page.get_pixmap(matrix=mat)

        img_path = output_dir / f"page_{page_num:03d}.png"
        pix.save(str(img_path))

        print(f"✓ 第{page_num:3d}页 → {title}")

    doc.close()

    print(f"\n✓ 截图已保存到: {output_dir}")
    print("\n请打开这些图片验证是否为对应章节的起始页")

if __name__ == "__main__":
    verify_chapter_pages("书籍/概率论与数理统计第五版盛骤-完整版.pdf")
