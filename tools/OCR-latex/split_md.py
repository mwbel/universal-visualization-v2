#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import os, re, sys

# ========== 输入文件处理 ==========
if len(sys.argv) > 1:
    input_file = sys.argv[1]
else:
    # 默认在脚本所在目录寻找 full.md
    base_dir = os.path.dirname(os.path.abspath(__file__))
    input_file = os.path.join(base_dir, "full.md")

if not os.path.isfile(input_file):
    print(f"❌ 找不到 Markdown 文件: {input_file}")
    print("💡 用法: python split_md.py [your_file.md]")
    sys.exit(1)

# ========== 输出目录 ==========
output_dir = "chapters"
os.makedirs(output_dir, exist_ok=True)

# ========== 读取文件 ==========
with open(input_file, "r", encoding="utf-8") as f:
    content = f.read()

# ========== 按一级标题拆分 ==========
chapters = re.split(r'(?m)(^# .*)', content)

chapter_files = []
current_text = ""
chapter_index = 0

for part in chapters:
    if part.startswith("# "):  # 新标题
        if current_text.strip():
            chapter_index += 1
            filename = f"ch{chapter_index:02d}.md"
            filepath = os.path.join(output_dir, filename)
            with open(filepath, "w", encoding="utf-8") as f:
                f.write(current_text.strip() + "\n")
            chapter_files.append(filepath)
        current_text = part + "\n"
    else:
        current_text += part

# 保存最后一章
if current_text.strip():
    chapter_index += 1
    filename = f"ch{chapter_index:02d}.md"
    filepath = os.path.join(output_dir, filename)
    with open(filepath, "w", encoding="utf-8") as f:
        f.write(current_text.strip() + "\n")
    chapter_files.append(filepath)

print(f"🎉 拆分完成: 共 {len(chapter_files)} 个章节文件，存放于 {output_dir}/")