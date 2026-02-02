#!/usr/bin/env python3
"""
PDF 教材处理完整工作流演示
展示如何使用两个 Skills 完成目录识别和分章转换
"""
import asyncio
import os
import sys
from pathlib import Path

# 添加 skills 目录到路径
sys.path.insert(0, str(Path(__file__).parent / "skills"))

from toc_recognizer_skill import recognize_pdf_toc
from pdf_splitter_skill import split_and_convert_pdf


async def complete_workflow_demo():
    """演示完整工作流：Skill 1 → Skill 2"""
    print("=" * 80)
    print("PDF 教材处理完整工作流演示")
    print("=" * 80)

    # 测试 PDF 文件
    pdf_path = "书籍/概率论与数理统计第五版盛骤-完整版.pdf"

    if not os.path.exists(pdf_path):
        print(f"\n✗ 测试文件不存在: {pdf_path}")
        print("\n请修改脚本中的 pdf_path 为实际文件路径")
        return

    print(f"\n📄 输入文件: {os.path.basename(pdf_path)}")
    print(f"   文件大小: {os.path.getsize(pdf_path) / 1024 / 1024:.2f} MB")

    # ═══════════════════════════════════════════════════════════
    # 步骤 1: 使用 Skill 1 识别目录和计算页码范围
    # ═══════════════════════════════════════════════════════════
    print("\n" + "=" * 80)
    print("步骤 1/2: 目录识别和页码范围计算 (Skill 1)")
    print("=" * 80)

    try:
        toc_result = await recognize_pdf_toc(
            pdf_path=pdf_path,
            output_path="output/workflow_demo/目录.md",
            use_ocr=False  # 暂时不使用 OCR，等待服务器 API
        )

        print(f"\n✅ Skill 1 完成!")
        print(f"   识别章节数: {toc_result['total_chapters']}")
        print(f"   目录文件: {toc_result['markdown_file']}")

        # 显示前3章信息
        chapters = toc_result['chapters']
        print(f"\n   前3章信息:")
        for ch in chapters[:3]:
            print(f"   - 第{ch.number}章: {ch.title}")
            print(f"     页码: {ch.page_start} - {ch.page_end}")
            print(f"     包含 {len(ch.sections) if ch.sections else 0} 个节")

    except Exception as e:
        print(f"\n✗ Skill 1 失败: {e}")
        import traceback
        traceback.print_exc()
        return

    # ═══════════════════════════════════════════════════════════
    # 步骤 2: 使用 Skill 2 分割 PDF 并转换为 Markdown
    # ═══════════════════════════════════════════════════════════
    print("\n" + "=" * 80)
    print("步骤 2/2: PDF 分割和 Markdown 转换 (Skill 2)")
    print("=" * 80)

    try:
        split_result = await split_and_convert_pdf(
            pdf_path=pdf_path,
            chapters=chapters,
            output_dir="output/workflow_demo",
            convert_to_markdown=True
        )

        print(f"\n✅ Skill 2 完成!")
        print(f"   输出目录: {split_result['output_dir']}")
        print(f"   汇总报告: {split_result['summary_file']}")

        # 显示处理统计
        success_count = sum(1 for r in split_result['results'] if r.status == "success")
        failed_count = sum(1 for r in split_result['results'] if r.status == "failed")

        print(f"\n   处理统计:")
        print(f"   - 成功: {success_count} 章")
        print(f"   - 失败: {failed_count} 章")

    except Exception as e:
        print(f"\n✗ Skill 2 失败: {e}")
        import traceback
        traceback.print_exc()
        return

    # ═══════════════════════════════════════════════════════════
    # 总结
    # ═══════════════════════════════════════════════════════════
    print("\n" + "=" * 80)
    print("🎉 完整工作流执行成功!")
    print("=" * 80)

    print(f"""
输出文件结构:
output/workflow_demo/
├── 目录.md              (Skill 1 生成 - 章节目录和页码范围)
├── pdfs/                (Skill 2 生成 - 分割后的章节 PDF)
│   ├── 01_第一章.pdf
│   ├── 02_第二章.pdf
│   └── ...
├── markdown/            (Skill 2 生成 - 转换后的 Markdown)
│   ├── 01_第一章.md
│   ├── 02_第二章.md
│   └── ...
└── 汇总报告.md          (Skill 2 生成 - 处理结果汇总)

下一步:
  1. 查看 "目录.md" 了解章节结构
  2. 查看 "markdown/" 目录获取每章的 Markdown 版本
  3. 查看 "汇总报告.md" 了解处理详情
  4. 等待服务器 API 部署后，重新运行以获得真实的 OCR 结果
    """)


async def skill_1_only_demo():
    """演示只使用 Skill 1（目录识别）"""
    print("\n" + "=" * 80)
    print("演示 A: 仅使用 Skill 1 - 目录识别")
    print("=" * 80)

    pdf_path = "书籍/概率论与数理统计第五版盛骤-完整版.pdf"

    if not os.path.exists(pdf_path):
        print(f"✗ 文件不存在: {pdf_path}")
        return

    print(f"\n📄 输入文件: {os.path.basename(pdf_path)}")

    result = await recognize_pdf_toc(
        pdf_path=pdf_path,
        use_ocr=False
    )

    print(f"\n✅ 目录识别完成!")
    print(f"   识别章节数: {result['total_chapters']}")
    print(f"   输出文件: {result['markdown_file']}")

    # 显示目录内容预览
    print(f"\n   目录文件内容预览:")
    try:
        with open(result['markdown_file'], 'r', encoding='utf-8') as f:
            lines = f.readlines()
            # 显示前20行
            for line in lines[:20]:
                print(f"   {line.rstrip()}")
            if len(lines) > 20:
                print(f"   ... (还有 {len(lines) - 20} 行)")
    except:
        print("   (无法读取文件)")


async def skill_2_only_demo():
    """演示只使用 Skill 2（分割和转换）"""
    print("\n" + "=" * 80)
    print("演示 B: 仅使用 Skill 2 - 分割和转换")
    print("=" * 80)

    from toc_recognizer_skill import Chapter

    # 手动定义章节数据（实际使用时从 Skill 1 获取）
    chapters = [
        Chapter(
            number=1,
            title="概率论的基本概念",
            page_start=16,
            page_end=77,
            sections=[
                {"title": "1.1 随机试验", "page": 16, "level": 2},
                {"title": "1.2 样本空间与事件", "page": 20, "level": 2},
            ]
        ),
        Chapter(
            number=2,
            title="随机变量及其分布",
            page_start=78,
            page_end=150,
            sections=[
                {"title": "2.1 随机变量", "page": 78, "level": 2},
                {"title": "2.2 离散型随机变量", "page": 85, "level": 2},
            ]
        )
    ]

    pdf_path = "书籍/概率论与数理统计第五版盛骤-完整版.pdf"

    if not os.path.exists(pdf_path):
        print(f"✗ 文件不存在: {pdf_path}")
        return

    print(f"\n📄 输入文件: {os.path.basename(pdf_path)}")
    print(f"   处理章节数: {len(chapters)} (手动定义)")

    result = await split_and_convert_pdf(
        pdf_path=pdf_path,
        chapters=chapters,
        output_dir="output/skill2_only_demo",
        convert_to_markdown=True
    )

    print(f"\n✅ 分割和转换完成!")
    print(f"   输出目录: {result['output_dir']}")
    print(f"   汇总报告: {result['summary_file']}")


def print_menu():
    """打印菜单"""
    print("""
╔════════════════════════════════════════════════════════════════╗
║          PDF 教材处理 Skills - 完整工作流演示                  ║
╚════════════════════════════════════════════════════════════════╝

请选择演示模式:

  1. 完整工作流 (Skill 1 → Skill 2)
     - 识别目录和页码范围
     - 分割 PDF 并转换为 Markdown

  2. 仅 Skill 1 (目录识别)
     - 识别目录结构
     - 计算页码范围
     - 生成目录 Markdown 文件

  3. 仅 Skill 2 (分割和转换)
     - 使用预定义章节进行分割
     - 转换为 Markdown

  0. 退出

    """)


async def main():
    """主函数"""
    while True:
        print_menu()

        try:
            choice = input("请输入选项 (0-3): ").strip()

            if choice == "0":
                print("\n👋 再见!")
                break
            elif choice == "1":
                await complete_workflow_demo()
            elif choice == "2":
                await skill_1_only_demo()
            elif choice == "3":
                await skill_2_only_demo()
            else:
                print("\n✗ 无效选项，请重新选择")

            # 询问是否继续
            print("\n" + "-" * 80)
            continue_demo = input("按 Enter 继续主菜单，输入 q 退出: ").strip().lower()
            if continue_demo == 'q':
                print("\n👋 再见!")
                break

        except KeyboardInterrupt:
            print("\n\n👋 演示已中断")
            break
        except Exception as e:
            print(f"\n✗ 发生错误: {e}")
            import traceback
            traceback.print_exc()


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\n\n👋 演示已中断")
