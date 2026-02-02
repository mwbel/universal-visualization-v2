#!/usr/bin/env python3
"""
正确使用 MinerU 进行 OCR 识别
"""

import os
import json
from pathlib import Path
from mineru import MinerU

def ocr_pdf_with_mineru(pdf_path, output_dir="output/mineru_results"):
    """
    使用 MinerU 对 PDF 进行 OCR

    Args:
        pdf_path: PDF 文件路径
        output_dir: 输出目录
    """
    pdf_path = Path(pdf_path)
    output_path = Path(output_dir)
    output_path.mkdir(parents=True, exist_ok=True)

    print(f"使用 MinerU 处理: {pdf_path.name}")
    print(f"输出目录: {output_path}\n")

    # 实例化 MinerU
    mineru = MinerU(
        output_dir=str(output_path),
        pdf_path=str(pdf_path),
        model_mode='light',  # 使用轻量级模型
        )

    # 执行 OCR
    print("正在执行 OCR（这可能需要几分钟）...\n")
    result = mineru()

    # 查看结果
    print(f"\n✓ OCR 完成！")
    print(f"结果保存在: {output_path}")

    # 列出生成的文件
    print("\n生成的文件:")
    for file in output_path.rglob("*"):
        if file.is_file():
            print(f"  - {file.relative_to(output_path)} ({file.stat().st_size:,} bytes)")

    return result


if __name__ == "__main__":
    pdf_file = "书籍/概率论与数理统计第五版盛骤-完整版.pdf"

    # 只处理目录页（12-15页）
    # 但 MinerU 会处理整个 PDF，我们可以只提取需要的部分

    try:
        result = ocr_pdf_with_mineru(pdf_file)
    except Exception as e:
        print(f"错误: {e}")
        import traceback
        traceback.print_exc()
