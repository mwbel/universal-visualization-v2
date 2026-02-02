#!/usr/bin/env python3
"""
测试 MinerU API 客户端
在本地 Mac 上运行，测试远程 API
"""
import os
import sys
import requests
import json
from pathlib import Path

# API 配置
API_BASE_URL = os.getenv("MINERU_API_URL", "http://49.52.18.227:8000")
API_KEY = os.getenv("MINERU_API_KEY", None)


def test_health_check():
    """测试健康检查"""
    print("测试 1: 健康检查")
    print("=" * 60)

    try:
        response = requests.get(f"{API_BASE_URL}/health", timeout=5)
        response.raise_for_status()
        data = response.json()

        print("✓ API 服务正常运行")
        print(json.dumps(data, indent=2, ensure_ascii=False))
        return True
    except Exception as e:
        print(f"✗ API 服务不可用: {e}")
        return False


def test_toc_extraction(pdf_path: str):
    """测试目录提取"""
    print("\n测试 2: 提取 PDF 目录")
    print("=" * 60)

    if not os.path.exists(pdf_path):
        print(f"✗ PDF 文件不存在: {pdf_path}")
        return False

    try:
        with open(pdf_path, 'rb') as f:
            files = {'file': f}
            response = requests.post(
                f"{API_BASE_URL}/api/toc",
                files=files,
                timeout=60
            )
            response.raise_for_status()
            data = response.json()

        print(f"✓ 目录提取成功")
        print(f"找到 {data.get('count', 0)} 个目录项")

        # 显示前几个目录项
        toc = data.get('toc', [])
        for i, entry in enumerate(toc[:10]):
            indent = "  " * (entry.get('level', 1) - 1)
            print(f"{indent}- {entry.get('title', '')} (页码: {entry.get('page', 'N/A')})")

        if len(toc) > 10:
            print(f"  ... 还有 {len(toc) - 10} 项")

        return True
    except Exception as e:
        print(f"✗ 目录提取失败: {e}")
        return False


def test_ocr(pdf_path: str):
    """测试 OCR 功能"""
    print("\n测试 3: PDF OCR 识别")
    print("=" * 60)

    if not os.path.exists(pdf_path):
        print(f"✗ PDF 文件不存在: {pdf_path}")
        return False

    try:
        with open(pdf_path, 'rb') as f:
            files = {'file': f}
            data = {
                'pages': '1-2',  # 只 OCR 前2页
                'format': 'markdown'
            }
            response = requests.post(
                f"{API_BASE_URL}/api/ocr",
                files=files,
                data=data,
                timeout=300  # OCR 可能需要较长时间
            )
            response.raise_for_status()
            result = response.json()

        print(f"✓ OCR 识别成功")
        print(f"状态: {result.get('status', 'unknown')}")

        # 显示部分结果
        content = result.get('content', '')
        if content:
            preview = content[:500] + "..." if len(content) > 500 else content
            print(f"\n内容预览:")
            print(preview)

        return True
    except Exception as e:
        print(f"✗ OCR 失败: {e}")
        return False


def test_full_analysis(pdf_path: str):
    """测试完整分析"""
    print("\n测试 4: 完整 PDF 分析")
    print("=" * 60)

    if not os.path.exists(pdf_path):
        print(f"✗ PDF 文件不存在: {pdf_path}")
        return False

    try:
        with open(pdf_path, 'rb') as f:
            files = {'file': f}
            data = {'use_ocr': False}  # 不使用 OCR，加快测试
            response = requests.post(
                f"{API_BASE_URL}/api/analyze",
                files=files,
                data=data,
                timeout=60
            )
            response.raise_for_status()
            result = response.json()

        print(f"✓ 分析成功")

        # 显示基本信息
        basic_info = result.get('basic_info', {})
        print(f"\n基本信息:")
        print(f"  总页数: {basic_info.get('total_pages', 'N/A')}")
        print(f"  文件大小: {basic_info.get('file_size', 0) / 1024:.2f} KB")

        # 显示目录统计
        toc_count = result.get('toc_count', 0)
        print(f"  目录项数: {toc_count}")

        return True
    except Exception as e:
        print(f"✗ 分析失败: {e}")
        return False


def main():
    """主测试函数"""
    print("╔════════════════════════════════════════════════════════════════╗")
    print("║        MinerU API 客户端测试                                 ║")
    print("╚════════════════════════════════════════════════════════════════╝")
    print()
    print(f"API 地址: {API_BASE_URL}")
    print()

    # 查找测试 PDF
    test_pdf = None
    possible_paths = [
        "书籍/概率论与数理统计第五版盛骤-完整版.pdf",
        "test.pdf",
        "sample.pdf"
    ]

    for path in possible_paths:
        if os.path.exists(path):
            test_pdf = path
            break

    if not test_pdf:
        print("警告: 未找到测试 PDF 文件")
        print("请将 PDF 文件放在以下位置之一:")
        for path in possible_paths:
            print(f"  - {path}")
        print()
        response = input("是否继续测试（仅测试健康检查）？(y/N): ")
        if response.lower() != 'y':
            return
    else:
        print(f"使用测试文件: {test_pdf}")
        print()

    # 运行测试
    results = []

    results.append(("健康检查", test_health_check()))

    if test_pdf:
        results.append(("目录提取", test_toc_extraction(test_pdf)))
        results.append(("完整分析", test_full_analysis(test_pdf)))

        # OCR 测试可选（较慢）
        ocr_test = input("\n是否测试 OCR 功能（较慢）？(y/N): ")
        if ocr_test.lower() == 'y':
            results.append(("OCR 识别", test_ocr(test_pdf)))

    # 总结
    print("\n" + "=" * 60)
    print("测试总结")
    print("=" * 60)

    for name, success in results:
        status = "✓ 通过" if success else "✗ 失败"
        print(f"{name}: {status}")

    total = len(results)
    passed = sum(1 for _, success in results if success)
    print(f"\n总计: {passed}/{total} 测试通过")

    if passed == total:
        print("\n🎉 所有测试通过！API 可以正常使用。")
    else:
        print("\n⚠️  部分测试失败，请检查配置。")


if __name__ == "__main__":
    main()
