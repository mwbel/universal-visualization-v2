#!/usr/bin/env python3
"""
PDF 教材处理 Agent 演示
展示如何使用 TextbookProcessorAgent
"""
import asyncio
import os
import sys
from pathlib import Path

# 添加项目根目录到路径
PROJECT_ROOT = Path(__file__).parent
sys.path.insert(0, str(PROJECT_ROOT / "backend-v2"))

from agents.textbook_processor_agent import (
    TextbookProcessorAgent,
    ChapterInfo,
    process_textbook
)


async def demo_basic_usage():
    """演示基本用法"""
    print("=" * 70)
    print("演示 1: 基本用法 - 便捷函数")
    print("=" * 70)

    pdf_path = "书籍/概率论与数理统计第五版盛骤-完整版.pdf"

    if not os.path.exists(pdf_path):
        print(f"测试文件不存在: {pdf_path}")
        print("跳过此演示")
        return

    try:
        result = await process_textbook(
            pdf_path=pdf_path,
            output_dir="output/demo_chapters",
            use_ocr=False,  # 暂时不使用 OCR
            split=False     # 只分析，不实际分割
        )

        print(f"\n✓ 分析完成")
        print(f"  文件名: {result['file_info']['filename']}")
        print(f"  总页数: {result['file_info']['total_pages']}")
        print(f"  文件大小: {result['file_info']['file_size'] / 1024 / 1024:.2f} MB")

        if result['chapters']:
            print(f"\n  找到 {len(result['chapters'])} 章:")
            for ch in result['chapters'][:5]:  # 只显示前5章
                print(f"    第{ch.number}章: {ch.title}")
                print(f"      页码: {ch.page_start}-{ch.page_end}")

            if len(result['chapters']) > 5:
                print(f"    ... 还有 {len(result['chapters']) - 5} 章")

    except Exception as e:
        print(f"\n✗ 错误: {e}")


async def demo_agent_usage():
    """演示 Agent 类的详细用法"""
    print("\n" + "=" * 70)
    print("演示 2: Agent 类详细用法")
    print("=" * 70)

    # 创建 Agent
    agent = TextbookProcessorAgent(
        use_local_fallback=True  # API 不可用时使用本地
    )

    # 检查状态
    status = agent.get_processing_status()
    print(f"\nAgent 状态:")
    print(f"  API 可用: {status['api_available']}")
    print(f"  本地降级: {status['local_fallback_enabled']}")
    print(f"  支持格式: {', '.join(status['supported_formats'])}")

    pdf_path = "书籍/概率论与数理统计第五版盛骤-完整版.pdf"

    if not os.path.exists(pdf_path):
        print(f"\n测试文件不存在: {pdf_path}")
        print("跳过此演示")
        return

    try:
        # 分析教材
        print(f"\n正在分析: {os.path.basename(pdf_path)}")
        result = await agent.analyze_textbook(
            pdf_path=pdf_path,
            extract_toc=True,
            use_ocr=False
        )

        # 显示详细信息
        print(f"\n✓ 分析方法: {result['processing_method']}")

        if result['table_of_contents']:
            print(f"\n目录结构 (前10项):")
            for item in result['table_of_contents'][:10]:
                indent = "  " * (item.get('level', 1) - 1)
                print(f"{indent}- {item.get('title', '')}")

        if result['chapters']:
            print(f"\n章节信息:")
            for ch in result['chapters'][:3]:
                print(f"\n  第{ch.number}章: {ch.title}")
                print(f"    页码范围: {ch.page_start}-{ch.page_end}")
                print(f"    包含 {len(ch.sections)} 个节")

                # 显示前几个节
                for sec in ch.sections[:3]:
                    indent = "      " + "  " * (sec.get('level', 2) - 2)
                    print(f"{indent}- {sec.get('title', '')}")

    except Exception as e:
        print(f"\n✗ 错误: {e}")


async def demo_manual_chapters():
    """演示手动定义章节"""
    print("\n" + "=" * 70)
    print("演示 3: 手动定义章节（当 PDF 没有目录时）")
    print("=" * 70)

    # 手动定义章节
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
        )
    ]

    print("\n手动定义了 2 章:")
    for ch in chapters:
        print(f"  第{ch.number}章: {ch.title}")
        print(f"    页码: {ch.page_start}-{ch.page_end}")
        print(f"    节数: {len(ch.sections)}")

    print("\n注意: 这只是演示，不会实际分割 PDF")
    print("在实际使用时，可以调用 split_pdf_by_chapters() 进行分割")


async def demo_api_client():
    """演示 API 客户端配置"""
    print("\n" + "=" * 70)
    print("演示 4: API 客户端配置")
    print("=" * 70)

    from agents.textbook_processor_agent import MinerUAPIClient

    # 创建 API 客户端
    api_client = MinerUAPIClient(
        base_url="http://49.52.18.227:8000",  # 示例 URL
        api_key=None,  # 如果需要认证
        timeout=300
    )

    print("\nAPI 客户端配置:")
    print(f"  Base URL: {api_client.base_url}")
    print(f"  Timeout: {api_client.timeout} 秒")
    print(f"  API Key: {'已设置' if api_client.api_key else '未设置'}")

    # 健康检查（如果服务器可用）
    print("\n尝试连接服务器...")
    is_healthy = api_client.health_check()
    print(f"  服务器状态: {'✓ 正常' if is_healthy else '✗ 不可用'}")

    if not is_healthy:
        print("\n提示: 服务器 API 还未部署")
        print("  Agent 会自动降级到本地 PyMuPDF")


def print_summary():
    """打印总结"""
    print("\n" + "=" * 70)
    print("总结")
    print("=" * 70)

    print("""
PDF 教材处理 Agent 提供以下功能:

1. 便捷函数 process_textbook()
   - 一键分析并分割 PDF
   - 适合简单场景

2. Agent 类 TextbookProcessorAgent
   - 更灵活的控制
   - 支持手动定义章节
   - 可配置 API 客户端

3. 自动降级策略
   - API 可用时: 使用服务器 MinerU
   - API 不可用时: 使用本地 PyMuPDF

4. 主要功能
   ✓ 提取 PDF 目录
   ✓ 识别章节结构
   ✓ 按章节分割 PDF
   ✓ 支持扫描版 PDF (通过 OCR)

下一步:
1. 等待服务器 API 部署完成
2. 配置 API URL
3. 开始处理你的 PDF 教材

文档: textbook-processor/README_AGENT_CLIENT.md
    """)


async def main():
    """主函数"""
    print("╔════════════════════════════════════════════════════════════════╗")
    print("║        PDF 教材处理 Agent - 功能演示                        ║")
    print("╚════════════════════════════════════════════════════════════════╝")

    # 运行演示
    await demo_basic_usage()
    await demo_agent_usage()
    await demo_manual_chapters()
    await demo_api_client()

    # 打印总结
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
