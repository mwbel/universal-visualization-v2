#!/usr/bin/env python3
"""
PDF 教材处理 Agent 演示 - 独立版本
直接导入模块，避免 backend-v2 依赖问题
"""
import asyncio
import os
import sys
from pathlib import Path

# 直接导入 textbook_processor_agent
sys.path.insert(0, str(Path(__file__).parent / "backend-v2" / "agents"))

# 检查 PyMuPDF 是否安装
try:
    import fitz
    PYMUPDF_AVAILABLE = True
except ImportError:
    PYMUPDF_AVAILABLE = False
    print("警告: PyMuPDF 未安装，请运行: pip3 install pymupdf")

# 导入 agent
from textbook_processor_agent import (
    TextbookProcessorAgent,
    ChapterInfo,
    process_textbook
)


async def demo_basic_analysis():
    """演示基本分析功能"""
    print("=" * 70)
    print("演示 1: PDF 基本分析")
    print("=" * 70)

    if not PYMUPDF_AVAILABLE:
        print("✗ PyMuPDF 未安装，无法运行演示")
        return

    pdf_path = "书籍/概率论与数理统计第五版盛骤-完整版.pdf"

    if not os.path.exists(pdf_path):
        print(f"✗ 测试文件不存在: {pdf_path}")
        return

    try:
        # 创建 Agent
        agent = TextbookProcessorAgent()

        # 分析 PDF
        print(f"\n正在分析: {os.path.basename(pdf_path)}")
        result = await agent.analyze_textbook(
            pdf_path=pdf_path,
            extract_toc=True,
            use_ocr=False
        )

        # 显示结果
        print(f"\n✓ 分析完成")
        print(f"  文件名: {result['file_info']['filename']}")
        print(f"  总页数: {result['file_info']['total_pages']}")
        print(f"  文件大小: {result['file_info']['file_size'] / 1024 / 1024:.2f} MB")
        print(f"  处理方式: {result['processing_method']}")

        # 显示目录
        if result['table_of_contents']:
            print(f"\n  目录结构 (前10项):")
            for item in result['table_of_contents'][:10]:
                indent = "  " * (item.get('level', 1) - 1)
                print(f"  {indent}- {item.get('title', '')}")

        # 显示章节
        if result['chapters']:
            print(f"\n  章节信息 (前5章):")
            for ch in result['chapters'][:5]:
                print(f"    第{ch.number}章: {ch.title}")
                print(f"      页码: {ch.page_start}-{ch.page_end}")

            if len(result['chapters']) > 5:
                print(f"    ... 还有 {len(result['chapters']) - 5} 章")

    except Exception as e:
        print(f"\n✗ 错误: {e}")
        import traceback
        traceback.print_exc()


async def demo_manual_chapters():
    """演示手动定义章节"""
    print("\n" + "=" * 70)
    print("演示 2: 手动定义章节")
    print("=" * 70)

    # 手动定义章节数据
    chapters = [
        ChapterInfo(
            number=1,
            title="概率论的基本概念",
            page_start=16,
            page_end=77,
            sections=[
                {"title": "1.1 随机试验", "page": 16, "level": 2},
                {"title": "1.2 样本空间与事件", "page": 20, "level": 2},
                {"title": "1.3 概率", "page": 25, "level": 2},
                {"title": "1.4 条件概率", "page": 35, "level": 2},
            ]
        ),
        ChapterInfo(
            number=2,
            title="随机变量及其分布",
            page_start=78,
            page_end=150,
            sections=[
                {"title": "2.1 随机变量", "page": 78, "level": 2},
                {"title": "2.2 离散型随机变量", "page": 85, "level": 2},
                {"title": "2.3 连续型随机变量", "page": 100, "level": 2},
            ]
        ),
        ChapterInfo(
            number=3,
            title="多维随机变量及其分布",
            page_start=151,
            page_end=220,
            sections=[
                {"title": "3.1 二维随机变量", "page": 151, "level": 2},
                {"title": "3.2 边缘分布", "page": 160, "level": 2},
                {"title": "3.3 条件分布", "page": 170, "level": 2},
            ]
        )
    ]

    print("\n手动定义了 3 章:")
    for ch in chapters:
        print(f"\n  第{ch.number}章: {ch.title}")
        print(f"    页码范围: {ch.page_start}-{ch.page_end}")
        print(f"    包含 {len(ch.sections)} 个节")

        # 显示前2个节
        for sec in ch.sections[:2]:
            indent = "      " + "  " * (sec.get('level', 2) - 2)
            print(f"{indent}- {sec.get('title', '')}")

    print("\n✓ 手动章节定义完成")
    print("  提示: 可以使用 split_pdf_by_chapters() 进行实际分割")


def demo_status():
    """演示状态检查"""
    print("\n" + "=" * 70)
    print("演示 3: Agent 状态检查")
    print("=" * 70)

    if not PYMUPDF_AVAILABLE:
        print("✗ PyMuPDF 未安装")
        print("  请运行: pip3 install pymupdf")
        return

    agent = TextbookProcessorAgent()
    status = agent.get_processing_status()

    print("\nAgent 配置:")
    print(f"  API 可用: {status['api_available']}")
    print(f"  本地降级: {status['local_fallback_enabled']}")
    print(f"  支持格式: {', '.join(status['supported_formats'])}")

    print("\n说明:")
    print("  - API 可用: 将使用服务器的 MinerU 进行 OCR")
    print("  - API 不可用: 将使用本地 PyMuPDF 进行基本处理")


def print_summary():
    """打印总结"""
    print("\n" + "=" * 70)
    print("总结")
    print("=" * 70)

    print("""
PDF 教材处理 Agent 已准备就绪！

主要功能:
  ✓ PDF 基本信息提取
  ✓ 目录结构识别
  ✓ 章节信息解析
  ✓ 按章节分割 PDF
  ✓ 支持 OCR（通过服务器 API）

使用方式:

1. 便捷函数（推荐新手）:
   from textbook_processor_agent import process_textbook

   result = await process_textbook(
       pdf_path="your_book.pdf",
       output_dir="output/chapters",
       use_ocr=False,
       split=True
   )

2. Agent 类（推荐高级用户）:
   from textbook_processor_agent import TextbookProcessorAgent

   agent = TextbookProcessorAgent()
   result = await agent.analyze_textbook("book.pdf")

   # 自定义处理...

下一步:
  1. 等待服务器 API 部署完成
  2. 配置 API URL（环境变量或代码中）
  3. 开始处理你的 PDF 教材

文档: textbook-processor/README_AGENT_CLIENT.md
    """)


async def main():
    """主函数"""
    print("╔════════════════════════════════════════════════════════════════╗")
    print("║        PDF 教材处理 Agent - 功能演示                        ║")
    print("╚════════════════════════════════════════════════════════════════╝")

    # 运行演示
    await demo_basic_analysis()
    await demo_manual_chapters()
    demo_status()
    print_summary()


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\n\n演示已中断")
    except Exception as e:
        print(f"\n\n错误: {e}")
        import traceback
        traceback.print_exc()
