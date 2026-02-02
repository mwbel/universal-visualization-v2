#!/usr/bin/env python3
"""
使用 MinerU 的 do_parse API 进行 OCR
"""

import os
import json
import tempfile
from pathlib import Path
from mineru.cli.common import do_parse

def ocr_toc_pages_with_mineru(pdf_path, output_dir="output/mineru_ocr"):
    """
    使用 MinerU 识别目录页（12-15页）

    Args:
        pdf_path: PDF 文件路径
        output_dir: 输出目录
    """
    pdf_path = Path(pdf_path)
    output_path = Path(output_dir)
    output_path.mkdir(parents=True, exist_ok=True)

    print(f"使用 MinerU OCR 处理: {pdf_path.name}")
    print(f"只处理目录页（第12-15页）\n")

    # 读取 PDF
    with open(pdf_path, 'rb') as f:
        pdf_bytes = f.read()

    pdf_name = pdf_path.name

    # 使用 do_parse 进行 OCR
    # 注意：MinerU 会处理整个 PDF，我们可以后续只提取需要的页面
    print("正在执行 OCR（这可能需要几分钟）...\n")

    try:
        result = do_parse(
            output_dir=str(output_path),
            pdf_file_names=[pdf_name],
            pdf_bytes_list=[pdf_bytes],
            p_lang_list=['zh'],  # 中文识别
            backend='pipeline',   # 使用 pipeline 模式（不需要模型）
            parse_method='auto',
            f_dump_md=True,          # 生成 Markdown
            f_dump_middle_json=True, # 生成中间 JSON
            f_draw_layout_bbox=False,  # 不绘制边界框
            f_draw_span_bbox=False,
        )

        print("\n✓ OCR 完成！")
        print(f"\n生成的文件:")

        # 列出生成的文件
        for file in sorted(output_path.rglob("*")):
            if file.is_file() and not file.name.startswith('.'):
                print(f"  - {file.relative_to(output_path)}")

        # 查找生成的 Markdown 文件
        md_files = list(output_path.rglob("*.md"))
        if md_files:
            print(f"\n✓ 找到 {len(md_files)} 个 Markdown 文件")
            for md_file in md_files:
                print(f"  - {md_file.name}")

        return result

    except Exception as e:
        print(f"\n✗ OCR 失败: {e}")
        import traceback
        traceback.print_exc()
        return None


if __name__ == "__main__":
    import sys

    pdf_file = "书籍/概率论与数理统计第五版盛骤-完整版.pdf"

    if len(sys.argv) > 1:
        pdf_file = sys.argv[1]

    ocr_toc_pages_with_mineru(pdf_file)
