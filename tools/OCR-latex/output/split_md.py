import os
import re

# ========== 基本设置 ==========
input_file = "full.md"
output_dir = "chapters"

# 确保输出目录存在
os.makedirs(output_dir, exist_ok=True)

# 读取完整 md 文件
with open(input_file, "r", encoding="utf-8") as f:
    content = f.read()

# 按一级标题分割（保留标题行）
# 正则：匹配以 "#" 开头的行，且至少一个空格
chapters = re.split(r'(?m)(^# .*)', content)

# re.split 会把分隔符（标题行）也保留下来，所以需要重新组合
chapter_files = []
current_text = ""
current_title = None
chapter_index = 0

for part in chapters:
    if part.startswith("# "):  # 遇到新章节标题
        if current_text.strip():  # 保存上一个章节
            chapter_index += 1
            filename = f"ch{chapter_index:02d}.md"
            filepath = os.path.join(output_dir, filename)
            with open(filepath, "w", encoding="utf-8") as f:
                f.write(current_text.strip() + "\n")
            chapter_files.append(filepath)
        # 开始新章节
        current_text = part + "\n"
        current_title = part[2:].strip()
    else:
        current_text += part

# 保存最后一个章节
if current_text.strip():
    chapter_index += 1
    filename = f"ch{chapter_index:02d}.md"
    filepath = os.path.join(output_dir, filename)
    with open(filepath, "w", encoding="utf-8") as f:
        f.write(current_text.strip() + "\n")
    chapter_files.append(filepath)

print("✅ 拆分完成，共生成 {} 个章节文件：".format(len(chapter_files)))
for f in chapter_files:
    print(" -", f)
split_md.py