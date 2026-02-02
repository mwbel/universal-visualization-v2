#!/usr/bin/env python3
"""
PDF 分割流程可视化演示
"""

def demonstrate_page_detection():
    """演示页码检测过程"""
    print("="*80)
    print("【演示1】页码识别原理")
    print("="*80)
    print()

    # 示例：模拟 PDF 的 TOC（目录）
    print("步骤 1: 读取 PDF 内置目录")
    print("-"*80)
    toc_data = [
        (1, "第1章 概率论的基本概念", 16),
        (2, "1.1 随机试验与样本空间", 16),
        (2, "1.2 随机事件的概率", 20),
        (1, "第2章 随机变量及其分布", 77),
        (2, "2.1 离散型随机变量", 77),
        (1, "第3章 多维随机变量及其分布", 133),
    ]

    print("PDF 目录 (TOC):")
    print("格式: (层级, 标题, 页码)")
    for level, title, page in toc_data:
        indent = "  " * (level - 1)
        print(f"{indent}├─ [{level}] {title:40s} → 第{page}页")
    print()

    # 步骤 2: 过滤一级标题
    print("步骤 2: 过滤一级标题（只提取'章'，忽略'节'）")
    print("-"*80)
    chapters = []
    for level, title, page in toc_data:
        if level == 1:
            chapters.append({'title': title, 'page_start': page, 'page_end': None})
            print(f"✓ 提取: {title:40s} → 起始页: {page}")
    print()

    # 步骤 3: 计算页码范围
    print("步骤 3: 计算每章的页码范围")
    print("-"*80)
    total_pages = 525

    for i, ch in enumerate(chapters):
        if i < len(chapters) - 1:
            # 当前章的结束页 = 下一章的起始页 - 1
            ch['page_end'] = chapters[i + 1]['page_start'] - 1
            print(f"{ch['title']:40s}")
            print(f"  起始页: {ch['page_start']:3d} → 结束页: {ch['page_end']:3d} "
                  f"(下一章从第{chapters[i+1]['page_start']}页开始)")
        else:
            # 最后一章的结束页 = PDF 总页数
            ch['page_end'] = total_pages
            print(f"{ch['title']:40s}")
            print(f"  起始页: {ch['page_start']:3d} → 结束页: {ch['page_end']:3d} (最后一章)")

    print()
    print("最终章节数据:")
    print("-"*80)
    for ch in chapters:
        page_count = ch['page_end'] - ch['page_start'] + 1
        print(f"  {ch['title']:40s} 第{ch['page_start']:3d}-{ch['page_end']:3d}页 ({page_count:3d}页)")

    return chapters


def demonstrate_pdf_splitting(chapters):
    """演示 PDF 分割过程"""
    print()
    print("="*80)
    print("【演示2】PDF 分割原理")
    print("="*80)
    print()

    print("关键概念: PDF 页码系统")
    print("-"*80)
    print("用户看到的页码（1-based）:  1,  2,  3, ..., 15, 16, ..., 76, 77, ...")
    print("PyMuPDF 内部索引（0-based）: 0,  1,  2, ..., 14, 15, ..., 75, 76, ...")
    print()

    print("示例: 分割第1章（第16-76页，共61页）")
    print("-"*80)

    # 获取第一章
    chapter = chapters[0]
    print(f"章节: {chapter['title']}")
    print(f"用户页码: 第{chapter['page_start']}-{chapter['page_end']}页")
    print()

    # 页码转换
    print("步骤 1: 页码转换（1-based → 0-based）")
    print("-"*80)
    start_index = chapter['page_start'] - 1
    end_index = chapter['page_end']
    print(f"起始页: {chapter['page_start']} → 索引: {start_index}")
    print(f"结束页: {chapter['page_end']} → 索引: {end_index} (range 不包含结束值)")
    print(f"复制范围: range({start_index}, {end_index})")
    print()

    # 模拟复制页面
    print("步骤 2: 逐页复制到新 PDF")
    print("-"*80)
    page_indices = list(range(start_index, end_index))
    print(f"复制的页面索引: {page_indices[:5]} ... {page_indices[-5:]}")
    print(f"共复制 {len(page_indices)} 页")
    print()

    print("Python 代码:")
    print("-"*80)
    print("""
    import fitz

    # 打开源 PDF
    doc = fitz.open("教材.pdf")

    # 创建新 PDF
    new_doc = fitz.open()

    # 复制页面（使用 0-based 索引）
    for page_num in range(15, 76):  # 第16-76页（用户页码）
        new_doc.insert_pdf(doc, from_page=page_num)

    # 保存
    new_doc.save("01_第1章 概率论的基本概念.pdf")
    new_doc.close()
    """)

    print("步骤 3: 保存章节文件")
    print("-"*80)
    filename = f"01_{chapter['title']}.pdf"
    print(f"✓ 生成文件: {filename}")
    print(f"✓ 包含页数: 第{chapter['page_start']}-{chapter['page_end']}页（共{chapter['page_end']-chapter['page_start']+1}页）")


def demonstrate_metadata_generation(chapters):
    """演示元数据生成"""
    print()
    print("="*80)
    print("【演示3】元数据生成")
    print("="*80)
    print()

    print("生成的 metadata.json:")
    print("-"*80)

    metadata = {
        "source_pdf": "概率论与数理统计第五版盛骤-完整版.pdf",
        "total_chapters": len(chapters),
        "chapters": []
    }

    for i, ch in enumerate(chapters, 1):
        chapter_info = {
            "chapter_number": i,
            "title": ch['title'],
            "file": f"{i:02d}_{ch['title']}.pdf",
            "page_start": ch['page_start'],
            "page_end": ch['page_end'],
            "page_count": ch['page_end'] - ch['page_start'] + 1
        }
        metadata['chapters'].append(chapter_info)

    import json
    print(json.dumps(metadata, ensure_ascii=False, indent=2))


def demonstrate_ocr_process():
    """演示 OCR 识别过程"""
    print()
    print("="*80)
    print("【演示4】OCR 识别流程（适用于扫描版 PDF）")
    print("="*80)
    print()

    print("输入: 扫描版 PDF（图像）")
    print("-"*80)
    print("第12页（目录页）的图像 →")
    print()

    print("步骤 1: MinerU OCR 处理")
    print("-"*80)
    print("""
    python -m mineru 书籍.pdf --ocr
    """)

    print("步骤 2: 生成 Markdown 文件")
    print("-"*80)
    markdown_example = """
    # 第1章 概率论的基本概念

    ## 1.1 随机试验与样本空间

    在实际生活中，我们遇到各种各样...

    \\newpage

    ## 1.2 随机事件的概率

    ### 1.2.1 概率的定义

    概率是...

    \\newpage

    # 第2章 随机变量及其分布

    ## 2.1 离散型随机变量
    """
    print(markdown_example)

    print("步骤 3: 正则表达式提取章节")
    print("-"*80)
    print("使用的正则表达式:")
    print("  r'^#\\s+(第[一二三四五六七八九十\\d]+章[^\\n]*)'")
    print()
    print("匹配结果:")
    print("  ✓ 第1章 概率论的基本概念")
    print("  ✓ 第2章 随机变量及其分布")
    print()

    print("步骤 4: 计算页码范围")
    print("-"*80)
    print("根据 '\\newpage' 标记识别页码变化")
    print("  第1章: 页码 1-3")
    print("  第2章: 页码 4-...")


def main():
    """运行所有演示"""
    print()
    print("╔" + "="*78 + "╗")
    print("║" + " "*20 + "PDF 章节分割工具 - 可视化演示" + " "*26 + "║")
    print("╚" + "="*78 + "╝")
    print()

    # 演示 1: 页码识别
    chapters = demonstrate_page_detection()

    # 演示 2: PDF 分割
    demonstrate_pdf_splitting(chapters)

    # 演示 3: 元数据生成
    demonstrate_metadata_generation(chapters)

    # 演示 4: OCR 流程
    demonstrate_ocr_process()

    print()
    print("="*80)
    print("演示完成！")
    print("="*80)
    print()
    print("核心原理总结:")
    print("  1. 页码识别: 从 TOC 提取 / OCR 识别")
    print("  2. 页码转换: 1-based（用户）↔ 0-based（PyMuPDF）")
    print("  3. PDF 分割: insert_pdf() 逐页复制")
    print("  4. 元数据: JSON 格式保存章节信息")
    print()


if __name__ == "__main__":
    main()
