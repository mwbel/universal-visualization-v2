#!/usr/bin/env python3
"""
使用 macOS 自带的 OCR 功能识别目录页
"""

import fitz
from pathlib import Path
import subprocess
import sys

def ocr_with_macos(pdf_path, page_nums, output_dir="output/ocr_results"):
    """
    使用 macOS 的文本提取功能进行 OCR

    方法：使用 macOS 的 textutil 命令行工具
    """
    doc = fitz.open(pdf_path)
    output_path = Path(output_dir)
    output_path.mkdir(parents=True, exist_ok=True)

    results = []

    print("使用 macOS 提取文本...\n")

    for page_num in page_nums:
        if page_num > len(doc):
            continue

        page = doc[page_num - 1]

        # 渲染为图片
        mat = fitz.Matrix(3, 3)
        pix = page.get_pixmap(matrix=mat)

        img_path = output_path / f"page_{page_num:03d}.png"
        pix.save(str(img_path))

        # 使用 macOS 的 textutil 提取文本
        txt_path = output_path / f"page_{page_num:03d}.txt"

        try:
            # 方法1: 使用 textutil
            subprocess.run([
                'textutil',
                '-convert', 'txt',
                '-stdout',
                str(img_path)
            ], stdout=open(txt_path, 'w'), stderr=subprocess.PIPE)

            with open(txt_path, 'r', encoding='utf-8') as f:
                text = f.read()

            results.append({
                'page': page_num,
                'text': text,
                'image': img_path,
                'text_file': txt_path
            })

            print(f"✓ 第{page_num}页 OCR 完成")

        except Exception as e:
            print(f"✗ 第{page_num}页 OCR 失败: {e}")

    doc.close()

    return results


if __name__ == "__main__":
    pdf_file = "书籍/概率论与数理统计第五版盛骤-完整版.pdf"

    # 识别目录页（12-15页）
    toc_pages = [12, 13, 14, 15]

    results = ocr_with_macos(pdf_file, toc_pages)

    print(f"\n✓ 完成！共处理 {len(results)} 页")
    print(f"\nOCR 结果保存在: output/ocr_results/")

    # 打印识别结果预览
    for result in results:
        print(f"\n{'='*80}")
        print(f"第{result['page']}页识别结果:")
        print(f"{'='*80}")
        # 只打印前500个字符作为预览
        print(result['text'][:500])
        if len(result['text']) > 500:
            print("...")
        print()
