import os
import re
import sys

def merge_markdown_files(root_dir):
    """
    遍历指定根目录下的文件夹，查找名字类似于 书名_part1, 书名_part2, ... 的文件夹。
    每个文件夹里都有一个 full.md 文件。
    把同一本书的所有 full.md 按 part1, part2 的顺序合并。
    合并结果保存为一个 Markdown 文件，文件名为 书名.md。
    支持中文路径。
    """
    book_parts = {}  # 存储 { "书名": { "part_num": "full.md_path" } }
    print(f"开始在目录 '{root_dir}' 中查找书籍部分...")

    # 详细调试：列出 root_dir 下的所有内容并检查其类型
    print(f"目录 '{root_dir}' 的内容:")
    try:
        for entry in os.listdir(root_dir):
            entry_path = os.path.join(root_dir, entry)
            is_dir = os.path.isdir(entry_path)
            print(f"  - '{entry}' (是目录: {is_dir})")
    except Exception as e:
        print(f"  - 无法列出目录内容: {e}")
        print("请确保目录存在且有读取权限。")
        return

    found_any_book_parts = False
    # 遍历根目录下的所有项
    for item_name in os.listdir(root_dir):
        item_path = os.path.join(root_dir, item_name)

        # 检查是否是目录
        if os.path.isdir(item_path):
            # 尝试匹配 "书名_part_N.pdf" 或 "书名_part_N.pdf-UUID" 模式
            match = re.match(r"^(.*?)_part_(\d+)\.pdf(?:-[\da-fA-F-]+)?$", item_name)
            if match:
                book_name = match.group(1)
                part_num = int(match.group(2))
                full_md_path = os.path.join(item_path, "full.md")

                if os.path.exists(full_md_path):
                    print(f"  - 发现书籍部分: '{book_name}_part{part_num}'，包含 'full.md'")
                    if book_name not in book_parts:
                        book_parts[book_name] = {}
                    book_parts[book_name][part_num] = full_md_path
                    found_any_book_parts = True
                else:
                    print(f"  - 警告: 文件夹 '{item_name}' 匹配模式但未找到 'full.md' 文件。")
            else:
                print(f"  - 跳过目录 '{item_name}'，不符合 '书名_part_N.pdf' 或 '书名_part_N.pdf-UUID' 模式。")
        else:
            print(f"  - 跳过文件 '{item_name}'。")

    if not found_any_book_parts:
        print(f"在目录 '{root_dir}' 中未找到任何符合 '书名_part_N.pdf' 或 '书名_part_N.pdf-UUID' 模式的文件夹或其内部的 'full.md' 文件。")
        return

    # 合并文件和图片
    for book_name, parts in book_parts.items():
        sorted_parts = sorted(parts.items())  # 按 part_num 排序
        merged_content = []
        
        # 为合并后的图片创建一个新的目录
        merged_images_dir_name = f"{book_name}_images"
        merged_images_path = os.path.join(root_dir, merged_images_dir_name)
        os.makedirs(merged_images_path, exist_ok=True)
        print(f"\n为书籍 '{book_name}' 创建合并图片目录: '{merged_images_path}'")

        print(f"\n正在合并书籍: {book_name}")
        for part_num, file_path in sorted_parts:
            part_folder_name = os.path.basename(os.path.dirname(file_path))
            print(f"  - 处理 {part_folder_name}/full.md (part {part_num})")

            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    md_content = f.read()
                
                # 复制图片并更新 Markdown 引用
                images_source_path = os.path.join(os.path.dirname(file_path), "images")
                if os.path.isdir(images_source_path):
                    for image_name in os.listdir(images_source_path):
                        source_image_path = os.path.join(images_source_path, image_name)
                        if os.path.isfile(source_image_path):
                            # 为图片生成新的文件名以避免冲突
                            new_image_name = f"{part_folder_name}_{image_name}"
                            destination_image_path = os.path.join(merged_images_path, new_image_name)
                            
                            import shutil
                            shutil.copy2(source_image_path, destination_image_path)
                            print(f"    - 复制图片: '{image_name}' 到 '{merged_images_dir_name}/{new_image_name}'")
                            
                            # 更新 Markdown 中的图片引用
                            # 匹配 ![alt text](images/image.png) 或 ![alt text](./images/image.png)
                            md_content = re.sub(
                                r"!\[(.*?)\]\((?:\.?/)?images/(.*?)\)",
                                rf"![\\1]({merged_images_dir_name}/{new_image_name})",
                                md_content
                            )
                
                merged_content.append(md_content)
                print(f"  - 已添加 {part_folder_name}/full.md")
            except Exception as e:
                print(f"错误: 处理文件 '{file_path}' 失败: {e}")

        output_filename = f"{book_name}.md"
        output_path = os.path.join(root_dir, output_filename)

        try:
            with open(output_path, 'w', encoding='utf-8') as f:
                f.write("\n\n".join(merged_content))
            print(f"合并完成: '{output_filename}' 已保存到 '{root_dir}'")
        except Exception as e:
            print(f"错误: 写入文件 '{output_path}' 失败: {e}")

def main():
    if len(sys.argv) != 2:
        print("用法: python3 merge_md.py <根目录>")
        sys.exit(1)

    root_directory = sys.argv[1]
    
    # 打印当前工作目录和解析后的绝对路径，帮助用户调试
    print(f"当前工作目录: '{os.getcwd()}'")
    abs_root_directory = os.path.abspath(root_directory)
    print(f"您提供的根目录是: '{root_directory}'")
    print(f"解析后的绝对路径是: '{abs_root_directory}'")

    if not os.path.isdir(abs_root_directory):
        print(f"错误: '{abs_root_directory}' 不是一个有效的目录。请检查路径是否正确。")
        sys.exit(1)
    
    merge_markdown_files(abs_root_directory)

if __name__ == "__main__":
    main()
