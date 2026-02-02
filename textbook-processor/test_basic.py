#!/usr/bin/env python3
"""
基础功能测试脚本
"""

import sys
from pathlib import Path

# 添加 src 目录到路径
sys.path.insert(0, str(Path(__file__).parent / 'src'))

from pdf_analyzer import PDFAnalyzer


def test_pdf_analyzer():
    """测试 PDF 分析器"""
    print("="*70)
    print("测试 PDF 分析器")
    print("="*70)

    # 测试文件
    test_files = [
        "/Users/Min369/Documents/同步空间/Manju/Projects/AlVisualization/期末速通/书籍/概率论与数理统计/概率论与数理统计第五版盛骤_1-2章.pdf"
    ]

    for pdf_file in test_files:
        if not Path(pdf_file).exists():
            print(f"⚠️  测试文件不存在: {pdf_file}")
            continue

        print(f"\n测试文件: {Path(pdf_file).name}")
        print("-"*70)

        try:
            analyzer = PDFAnalyzer(pdf_file)
            metadata = analyzer.analyze()

            print(f"\n✓ 分析成功!")
            print(f"  标题: {metadata.title}")
            print(f"  作者: {metadata.author}")
            print(f"  总页数: {metadata.total_pages}")
            print(f"  TOC 可用: {metadata.toc_available}")
            print(f"  识别章节数: {len(metadata.chapters)}")

            if metadata.chapters:
                print(f"\n  前3个章节:")
                for i, chapter in enumerate(metadata.chapters[:3], 1):
                    print(f"    {i}. {chapter.title} (第 {chapter.page_start}-{chapter.page_end} 页)")

            analyzer.close_pdf()
            return True

        except Exception as e:
            print(f"\n✗ 分析失败: {e}")
            import traceback
            traceback.print_exc()
            return False


def test_imports():
    """测试模块导入"""
    print("\n" + "="*70)
    print("测试模块导入")
    print("="*70)

    try:
        import fitz
        print(f"✓ PyMuPDF (fitz) 版本: {fitz.version}")

        from pdf_analyzer import PDFAnalyzer, PDFMetadata, ChapterInfo
        print("✓ pdf_analyzer 模块导入成功")

        from pdf_splitter import PDFSplitter
        print("✓ pdf_splitter 模块导入成功")

        print("\n所有模块导入测试通过!")
        return True

    except Exception as e:
        print(f"\n✗ 模块导入失败: {e}")
        import traceback
        traceback.print_exc()
        return False


def main():
    """主测试函数"""
    print("\n🧪 Textbook Processor - 基础功能测试\n")

    # 测试 1: 模块导入
    imports_ok = test_imports()

    # 测试 2: PDF 分析
    if imports_ok:
        analyzer_ok = test_pdf_analyzer()
    else:
        analyzer_ok = False

    # 总结
    print("\n" + "="*70)
    print("测试总结")
    print("="*70)
    print(f"模块导入: {'✓ 通过' if imports_ok else '✗ 失败'}")
    print(f"PDF 分析: {'✓ 通过' if analyzer_ok else '✗ 失败'}")
    print()

    if imports_ok and analyzer_ok:
        print("✅ 所有基础功能测试通过!")
        return 0
    else:
        print("⚠️  部分测试失败，请检查错误信息")
        return 1


if __name__ == "__main__":
    sys.exit(main())
