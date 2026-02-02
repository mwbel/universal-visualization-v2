#!/usr/bin/env python3
"""
PDF 教材处理 - 快速开始示例
适合团队成员快速上手使用
"""
import asyncio
import sys
from pathlib import Path

# 添加项目根目录到路径
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

from skills import recognize_pdf_toc, split_and_convert_pdf


async def example_1_basic_usage():
    """示例 1: 基本使用 - 识别目录"""
    print("=" * 70)
    print("示例 1: 识别 PDF 目录")
    print("=" * 70)

    # 修改这里的 PDF 路径
    pdf_path = "书籍/概率论与数理统计第五版盛骤-完整版.pdf"

    # 检查文件是否存在
    if not Path(pdf_path).exists():
        print(f"\n⚠️  文件不存在: {pdf_path}")
        print("请修改脚本中的 pdf_path 变量")
        return

    try:
        # 识别目录
        result = await recognize_pdf_toc(
            pdf_path=pdf_path,
            output_path="output/quick_start_toc.md",
            use_ocr=False  # 使用本地 PyMuPDF（不需要服务器）
        )

        # 显示结果
        print(f"\n✅ 识别成功!")
        print(f"  总章节数: {result['total_chapters']}")
        print(f"  目录文件: {result['markdown_file']}")

        # 显示前 3 章
        print(f"\n前 3 章信息:")
        for ch in result['chapters'][:3]:
            print(f"  第{ch.number}章: {ch.title}")
            print(f"    页码: {ch.page_start}-{ch.page_end}")

    except Exception as e:
        print(f"\n❌ 错误: {e}")


async def example_2_custom_output():
    """示例 2: 自定义输出 - 导出为 JSON"""
    print("\n" + "=" * 70)
    print("示例 2: 导出章节信息为 JSON")
    print("=" * 70)

    import json

    pdf_path = "书籍/概率论与数理统计第五版盛骤-完整版.pdf"

    if not Path(pdf_path).exists():
        print(f"\n⚠️  文件不存在: {pdf_path}")
        return

    try:
        # 识别目录
        result = await recognize_pdf_toc(pdf_path)

        # 转换为自定义格式
        chapters_data = []
        for ch in result['chapters']:
            chapters_data.append({
                "序号": ch.number,
                "标题": ch.title,
                "起始页": ch.page_start,
                "结束页": ch.page_end,
                "总页数": ch.page_end - ch.page_start + 1,
                "节数量": len(ch.sections) if ch.sections else 0
            })

        # 保存为 JSON
        output_file = "output/chapters.json"
        Path(output_file).parent.mkdir(exist_ok=True)

        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(chapters_data, f, ensure_ascii=False, indent=2)

        print(f"\n✅ 导出成功!")
        print(f"  输出文件: {output_file}")
        print(f"  章节数量: {len(chapters_data)}")

    except Exception as e:
        print(f"\n❌ 错误: {e}")


async def example_3_split_pdf():
    """示例 3: 分割 PDF"""
    print("\n" + "=" * 70)
    print("示例 3: 分割 PDF 为章节文件")
    print("=" * 70)

    pdf_path = "书籍/概率论与数理统计第五版盛骤-完整版.pdf"

    if not Path(pdf_path).exists():
        print(f"\n⚠️  文件不存在: {pdf_path}")
        return

    try:
        # 先识别目录
        toc_result = await recognize_pdf_toc(pdf_path)

        # 只处理前 3 章（演示用）
        chapters = toc_result['chapters'][:3]
        print(f"\n将处理前 {len(chapters)} 章...")

        # 分割 PDF
        split_result = await split_and_convert_pdf(
            pdf_path=pdf_path,
            chapters=chapters,
            output_dir="output/quick_start_chapters",
            convert_to_markdown=False  # 暂时不转换 Markdown
        )

        print(f"\n✅ 分割成功!")
        print(f"  输出目录: {split_result['output_dir']}")
        print(f"  汇总报告: {split_result['summary_file']}")

    except Exception as e:
        print(f"\n❌ 错误: {e}")


async def example_4_batch_process():
    """示例 4: 批量处理"""
    print("\n" + "=" * 70)
    print("示例 4: 批量处理多个 PDF")
    print("=" * 70)

    # 这里可以放置多个 PDF 文件
    pdf_files = [
        "书籍/概率论与数理统计第五版盛骤-完整版.pdf",
        # "books/another_book.pdf",
        # "books/textbook2.pdf",
    ]

    # 过滤存在的文件
    existing_files = [f for f in pdf_files if Path(f).exists()]

    if not existing_files:
        print(f"\n⚠️  没有找到有效的 PDF 文件")
        print("请修改脚本中的 pdf_files 列表")
        return

    print(f"\n找到 {len(existing_files)} 个文件:")
    for f in existing_files:
        print(f"  - {f}")

    # 批量处理
    for pdf_file in existing_files:
        print(f"\n处理: {Path(pdf_file).name}")
        try:
            result = await recognize_pdf_toc(pdf_file)
            print(f"  ✅ {result['total_chapters']} 章")
        except Exception as e:
            print(f"  ❌ 错误: {e}")


def print_menu():
    """打印菜单"""
    print("""
╔════════════════════════════════════════════════════════════════╗
║           PDF 教材处理 - 快速开始示例                          ║
╚════════════════════════════════════════════════════════════════╝

请选择示例:

  1. 基本使用 - 识别 PDF 目录
  2. 自定义输出 - 导出为 JSON
  3. 分割 PDF - 将 PDF 按章节分割
  4. 批量处理 - 处理多个 PDF 文件
  0. 退出

提示: 运行前请先修改脚本中的 PDF 文件路径！

    """)


async def main():
    """主函数"""
    while True:
        print_menu()

        try:
            choice = input("请选择 (0-4): ").strip()

            if choice == "0":
                print("\n👋 再见!")
                break
            elif choice == "1":
                await example_1_basic_usage()
            elif choice == "2":
                await example_2_custom_output()
            elif choice == "3":
                await example_3_split_pdf()
            elif choice == "4":
                await example_4_batch_process()
            else:
                print("\n✗ 无效选项")

            # 询问是否继续
            print("\n" + "-" * 70)
            continue_choice = input("按 Enter 继续，输入 q 退出: ").strip().lower()
            if continue_choice == 'q':
                print("\n👋 再见!")
                break

        except KeyboardInterrupt:
            print("\n\n👋 已中断")
            break
        except Exception as e:
            print(f"\n❌ 错误: {e}")
            import traceback
            traceback.print_exc()


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\n\n👋 已中断")
