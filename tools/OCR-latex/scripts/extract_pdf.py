#!/usr/bin/env python3
import sys
from pypdf import PdfReader, PdfWriter
from pathlib import Path

def extract_pdf_pages(input_pdf, output_pdf, start_page, end_page):
    reader = PdfReader(input_pdf)
    writer = PdfWriter()

    # 页码检查
    num_pages = len(reader.pages)
    if start_page < 1 or end_page > num_pages:
        raise ValueError(f"页码超出范围：PDF 共 {num_pages} 页")

    for i in range(start_page - 1, end_page):
        writer.add_page(reader.pages[i])

    with open(output_pdf, "wb") as f_out:
        writer.write(f_out)

if __name__ == "__main__":
    if len(sys.argv) != 5:
        print("用法: python extract_pdf.py input.pdf start_page end_page output.pdf")
        sys.exit(1)

    input_pdf = Path(sys.argv[1])
    start_page = int(sys.argv[2])
    end_page = int(sys.argv[3])
    output_pdf = Path(sys.argv[4])

    try:
        extract_pdf_pages(input_pdf, output_pdf, start_page, end_page)
        print(f"✅ 提取完成: {input_pdf} 第 {start_page}-{end_page} 页 → {output_pdf}")
    except Exception as e:
        print(f"❌ 错误: {e}")
        sys.exit(1)
