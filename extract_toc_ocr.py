#!/usr/bin/env python3
"""
使用 OCR 识别 PDF 目录，提取准确的章节页码
"""

import fitz
import sys
from pathlib import Path

def extract_toc_pages(pdf_path, output_dir="output/toc_pages"):
    """
    提取目录页（通常是第12-15页）

    Args:
        pdf_path: PDF 文件路径
        output_dir: 输出目录
    """
    doc = fitz.open(pdf_path)

    output_path = Path(output_dir)
    output_path.mkdir(parents=True, exist_ok=True)

    # 目录通常在第12-15页
    toc_page_range = range(11, min(16, len(doc)))  # 0-indexed, so 11=第12页

    print(f"正在提取目录页（第12-15页）...\n")

    toc_images = []

    for page_num in toc_page_range:
        page = doc[page_num + 1]  # 转换回 1-indexed

        # 渲染为高分辨率图片
        mat = fitz.Matrix(3, 3)  # 3倍缩放以提高 OCR 准确率
        pix = page.get_pixmap(matrix=mat)

        img_path = output_path / f"toc_page_{page_num + 1:03d}.png"
        pix.save(str(img_path))

        toc_images.append({
            'page_num': page_num + 1,
            'path': img_path
        })

        print(f"  ✓ 第{page_num + 1}页 → {img_path.name}")

    doc.close()

    print(f"\n✓ 目录页已提取到: {output_path}")
    print(f"\n下一步：使用 OCR 识别这些图片中的目录信息")

    return toc_images


def suggest_ocr_method():
    """
    建议 OCR 方法
    """
    print("\n" + "="*80)
    print("OCR 识别方案")
    print("="*80)
    print("""
由于之前遇到的依赖问题，这里提供几种方案：

方案 1: 使用在线 OCR 服务（推荐）
  - https://www.ocr.space/ （免费，支持中文）
  - https://ocr.wdku.net/ （国内，识别准确）
  - 上传 output/toc_pages/ 中的图片
  - 下载识别结果

方案 2: 使用系统自带 OCR
  macOS:
    - 右键点击图片 → 快速操作 → "从图像提取文本"
    - 或使用预览应用的"标记"功能

方案 3: 使用 Python OCR 库
  pip install pytesseract pillow
  (需要安装 Tesseract 引擎)

方案 4: 手动输入（最准确）
  - 打开 output/toc_pages/ 中的图片
  - 手动记录每章的页码
  - 填写到模板中
    """)


if __name__ == "__main__":
    pdf_file = "书籍/概率论与数理统计第五版盛骤-完整版.pdf"

    if len(sys.argv) > 1:
        pdf_file = sys.argv[1]

    extract_toc_pages(pdf_file)
    suggest_ocr_method()
