import os
import re
import subprocess
import sys

def md_to_pdf(md_file, pdf_file=None):
    """将单个 Markdown 文件转为 PDF"""
    if pdf_file is None:
        pdf_file = md_file.rsplit(".", 1)[0] + ".pdf"
    try:
        subprocess.run(
            ["pandoc", md_file, "--pdf-engine=xelatex", "-o", pdf_file],
            check=True
        )
        print(f"✅ 转换成功: {pdf_file}")
    except subprocess.CalledProcessError as e:
        print(f"❌ 转换失败: {md_file}, 错误: {e}")

def merge_markdowns(md_files, output_md):
    """将多个 Markdown 文件合并成一个"""
    with open(output_md, "w", encoding="utf-8") as outfile:
        for f in md_files:
            with open(f, "r", encoding="utf-8") as infile:
                outfile.write(infile.read())
                outfile.write("\n\n")  # 文件间加空行
    print(f"📖 合并完成: {output_md}")

def process_root(root_dir):
    # 记录书名 -> [part路径列表]
    books = {}

    for dirpath, _, filenames in os.walk(root_dir):
        # 只处理含 full.md 的目录
        if "full.md" in filenames:
            folder = os.path.basename(dirpath)
            match = re.match(r"(.+)_part(\d+)", folder, re.IGNORECASE)
            if match:
                book_name, part_num = match.group(1), int(match.group(2))
                md_path = os.path.join(dirpath, "full.md")
                books.setdefault(book_name, []).append((part_num, md_path))

    # 遍历每本书
    for book_name, parts in books.items():
        # 按 part 排序
        parts.sort(key=lambda x: x[0])
        md_files = [p[1] for p in parts]

        # 合并 md
        merged_md = os.path.join(root_dir, f"{book_name}.md")
        merge_markdowns(md_files, merged_md)

        # 转换 pdf
        merged_pdf = os.path.join(root_dir, f"{book_name}.pdf")
        md_to_pdf(merged_md, merged_pdf)

        # 如果还要生成每个 part 的单独 pdf，可以在这里调用：
        # for _, md in parts:
        #     md_to_pdf(md)

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("用法: python3 merge_md2pdf.py <目录路径>")
        sys.exit(1)

    root = sys.argv[1]
    if not os.path.isdir(root):
        print(f"错误: {root} 不是有效目录")
        sy
