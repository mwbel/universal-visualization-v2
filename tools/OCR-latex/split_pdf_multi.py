import sys
import os
from pypdf import PdfReader, PdfWriter

def split_pdf_by_ranges(input_file, ranges):
    """
    根据多个页码范围切分 PDF 文件
    :param input_file: 输入 PDF 文件路径
    :param ranges: 例如 ["1-10", "20-30", "50-55"]
    """
    reader = PdfReader(input_file)
    total_pages = len(reader.pages)

    base_name, ext = os.path.splitext(input_file)

    for r in ranges:
        try:
            start_str, end_str = r.split("-")
            start_page, end_page = int(start_str), int(end_str)
        except ValueError:
            print(f"❌ 格式错误: {r}, 应该是 例如 10-20")
            continue

        if start_page < 1 or end_page > total_pages or start_page > end_page:
            print(f"❌ 页码范围无效: {r}, PDF共 {total_pages} 页")
            continue

        writer = PdfWriter()
        for i in range(start_page - 1, end_page):
            writer.add_page(reader.pages[i])

        output_file = f"{base_name}_part_{start_page}-{end_page}.pdf"
        with open(output_file, "wb") as f:
            writer.write(f)

        print(f"✅ 已生成 {output_file} ({start_page}-{end_page})")

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("用法: python split_pdf_multi.py <输入PDF> <范围1> <范围2> ...")
        print("示例: python split_pdf_multi.py book.pdf 1-10 20-30 50-55")
    else:
        input_pdf = sys.argv[1]
        ranges = sys.argv[2:]
        split_pdf_by_ranges(input_pdf, ranges)
