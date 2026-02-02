#!/usr/bin/env python3
"""
Textbook Processor - 教材处理主脚本
自动识别章节、切分 PDF、转换 Markdown
"""

import argparse
import json
import sys
from pathlib import Path
from datetime import datetime

# 添加 src 目录到路径
sys.path.insert(0, str(Path(__file__).parent / 'src'))

from pdf_analyzer import PDFAnalyzer, PDFMetadata, ChapterInfo
from pdf_splitter import PDFSplitter
from mineru_converter import MinerUConverter


class TextbookProcessor:
    """教材处理器"""

    def __init__(self, pdf_path: str, output_base_dir: str = "output"):
        """
        初始化处理器

        Args:
            pdf_path: PDF 文件路径
            output_base_dir: 输出基础目录
        """
        self.pdf_path = Path(pdf_path)
        self.output_base_dir = Path(output_base_dir)
        self.output_base_dir.mkdir(parents=True, exist_ok=True)

        # 提取书名作为子目录名
        self.book_name = self.pdf_path.stem
        self.output_dir = self.output_base_dir / self.book_name
        self.output_dir.mkdir(exist_ok=True)

        # 创建子目录
        (self.output_dir / "original").mkdir(exist_ok=True)
        (self.output_dir / "chapters").mkdir(exist_ok=True)
        (self.output_dir / "markdown").mkdir(exist_ok=True)

        self.metadata: PDFMetadata = None
        self.process_result = {}

    def copy_original(self) -> Path:
        """复制原始 PDF 到输出目录"""
        dest = self.output_dir / "original" / self.pdf_path.name
        import shutil
        shutil.copy2(self.pdf_path, dest)
        print(f"✓ 已复制原始 PDF 到: {dest}")
        return dest

    def generate_metadata_file(self) -> Path:
        """生成 JSON 格式的元数据文件"""
        metadata_path = self.output_dir / "metadata.json"

        meta_data = {
            "title": self.metadata.title,
            "author": self.metadata.author,
            "total_pages": self.metadata.total_pages,
            "toc_available": self.metadata.toc_available,
            "processed_at": datetime.now().isoformat(),
            "original_file": str(self.pdf_path),
            "chapters": []
        }

        for chapter in self.metadata.chapters:
            chapter_data = {
                "chapter_number": chapter.chapter_number,
                "title": chapter.title,
                "level": chapter.level,
                "page_start": chapter.page_start,
                "page_end": chapter.page_end,
                "pdf_file": f"chapters/{self.book_name}_{chapter.chapter_number:02d}_{chapter.title[:30]}.pdf",
                "md_file": f"markdown/{chapter.chapter_number:02d}_{chapter.title[:30]}.md"
            }
            meta_data["chapters"].append(chapter_data)

        # 保存 JSON
        with open(metadata_path, 'w', encoding='utf-8') as f:
            json.dump(meta_data, f, ensure_ascii=False, indent=2)

        print(f"✓ 已生成元数据文件: {metadata_path}")
        return metadata_path

    def generate_index_html(self) -> Path:
        """生成 HTML 导航页面"""
        index_path = self.output_dir / "index.html"

        html_content = f"""<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{self.metadata.title} - 目录导航</title>
    <style>
        body {{
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            line-height: 1.6;
            max-width: 800px;
            margin: 40px auto;
            padding: 20px;
            background: #f5f5f5;
        }}
        h1 {{
            color: #333;
            border-bottom: 3px solid #4CAF50;
            padding-bottom: 10px;
        }}
        .info {{
            background: white;
            padding: 15px;
            border-radius: 5px;
            margin-bottom: 20px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }}
        .chapter-list {{
            list-style: none;
            padding: 0;
        }}
        .chapter-item {{
            background: white;
            margin: 10px 0;
            padding: 15px;
            border-radius: 5px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            transition: transform 0.2s;
        }}
        .chapter-item:hover {{
            transform: translateY(-2px);
            box-shadow: 0 4px 8px rgba(0,0,0,0.15);
        }}
        .chapter-title {{
            font-size: 1.2em;
            font-weight: bold;
            color: #2196F3;
            margin-bottom: 5px;
        }}
        .chapter-meta {{
            color: #666;
            font-size: 0.9em;
        }}
        .links a {{
            color: #4CAF50;
            text-decoration: none;
            margin-right: 15px;
        }}
        .links a:hover {{
            text-decoration: underline;
        }}
    </style>
</head>
<body>
    <h1>📚 {self.metadata.title}</h1>

    <div class="info">
        <p><strong>作者:</strong> {self.metadata.author or '未知'}</p>
        <p><strong>总页数:</strong> {self.metadata.total_pages}</p>
        <p><strong>章节数:</strong> {len(self.metadata.chapters)}</p>
        <p><strong>处理时间:</strong> {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}</p>
    </div>

    <h2>章节目录</h2>
    <ul class="chapter-list">
"""

        for chapter in self.metadata.chapters:
            chapter_title = chapter.title.replace('<', '&lt;').replace('>', '&gt;')
            html_content += f"""
        <li class="chapter-item">
            <div class="chapter-title">{chapter.chapter_number}. {chapter_title}</div>
            <div class="chapter-meta">
                页码: {chapter.page_start} - {chapter.page_end}
            </div>
            <div class="links">
                <a href="chapters/{self.book_name}_{chapter.chapter_number:02d}.pdf">📄 PDF</a>
                <a href="markdown/{chapter.chapter_number:02d}.md">📝 Markdown</a>
            </div>
        </li>
"""

        html_content += """
    </ul>
</body>
</html>
"""

        with open(index_path, 'w', encoding='utf-8') as f:
            f.write(html_content)

        print(f"✓ 已生成导航页面: {index_path}")
        return index_path

    def process(self, split_only: bool = False, convert_to_markdown: bool = False, backend: str = "auto") -> dict:
        """
        执行完整的处理流程

        Args:
            split_only: 仅切分，不转换 Markdown
            convert_to_markdown: 是否转换为 Markdown
            backend: MinerU 后端 ("auto", "pipeline", "hybrid-auto-engine")

        Returns:
            处理结果字典
        """
        print("="*70)
        print("Textbook Processor - 教材处理工具")
        print("="*70)
        print(f"输入文件: {self.pdf_path}")
        print(f"输出目录: {self.output_dir}")
        print()

        try:
            # Step 1: 复制原始文件
            print("[1/6] 复制原始文件...")
            self.copy_original()

            # Step 2: 分析 PDF
            print("\n[2/6] 分析 PDF 结构...")
            analyzer = PDFAnalyzer(str(self.pdf_path))
            self.metadata = analyzer.analyze()

            if not self.metadata.chapters:
                print("⚠️  警告: 未能识别到章节，请检查 PDF 格式")
                return {'success': False, 'error': 'No chapters found'}

            # Step 3: 切分 PDF
            print("\n[3/6] 切分 PDF 章节...")
            splitter = PDFSplitter(str(self.pdf_path), str(self.output_dir))
            split_result = splitter.split_all_chapters(self.metadata, self.book_name)

            # Step 4: 转换 Markdown (可选)
            md_conversion_result = None
            if convert_to_markdown:
                print("\n[4/6] 转换 PDF 为 Markdown...")
                converter = MinerUConverter(backend=backend)

                # 获取切分后的 PDF 文件
                chapter_pdfs = sorted((self.output_dir / "chapters").glob("*.pdf"))

                if chapter_pdfs:
                    # 批量转换
                    md_results = converter.batch_convert(
                        [str(f) for f in chapter_pdfs],
                        str(self.output_dir / "markdown")
                    )

                    # 统计结果
                    md_success_count = sum(1 for r in md_results if r['success'])
                    print(f"  转换成功: {md_success_count}/{len(md_results)}")

                    md_conversion_result = {
                        'total': len(md_results),
                        'success': md_success_count,
                        'failed': len(md_results) - md_success_count
                    }
            else:
                print("\n[4/6] 跳过 Markdown 转换")

            # Step 5: 生成元数据
            print("\n[5/6] 生成元数据文件...")
            self.generate_metadata_file()

            # Step 6: 生成导航页面
            print("\n[6/6] 生成导航页面...")
            self.generate_index_html()

            # 打印总结
            print("\n" + "="*70)
            print("✅ 处理完成!")
            print("="*70)
            print(f"输出目录: {self.output_dir}")
            print(f"  - original/  : 原始 PDF")
            print(f"  - chapters/  : 切分后的章节 PDF ({len(split_result['success'])} 个)")
            if convert_to_markdown and md_conversion_result:
                print(f"  - markdown/  : Markdown 文件 ({md_conversion_result['success']} 个)")
            else:
                print(f"  - markdown/  : Markdown 文件 (未转换)")
            print(f"  - metadata.json: 元数据")
            print(f"  - index.html : 导航页面")
            print()

            self.process_result = {
                'success': True,
                'total_chapters': len(self.metadata.chapters),
                'split_successful': len(split_result['success']),
                'split_failed': len(split_result['failed']),
                'md_conversion': md_conversion_result,
                'output_dir': str(self.output_dir)
            }

            return self.process_result

        except Exception as e:
            print(f"\n❌ 处理失败: {e}")
            import traceback
            traceback.print_exc()

            self.process_result = {
                'success': False,
                'error': str(e)
            }

            return self.process_result


def main():
    """主函数"""
    parser = argparse.ArgumentParser(
        description='Textbook Processor - 教材 PDF 自动分章处理工具',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
示例:
  %(prog)s textbook.pdf                    # 使用默认输出目录
  %(prog)s textbook.pdf -o output          # 指定输出目录
  %(prog)s textbook.pdf --split-only       # 仅切分，不转换
  %(prog)s textbook.pdf --convert-md       # 切分并转换为 Markdown
  %(prog)s textbook.pdf --convert-md --backend hybrid-auto-engine  # 使用 GPU 加速
        """
    )

    parser.add_argument('pdf_file', help='PDF 教材文件路径')
    parser.add_argument('-o', '--output', default='output',
                       help='输出目录 (默认: output)')
    parser.add_argument('--split-only', action='store_true',
                       help='仅切分 PDF，不转换 Markdown')
    parser.add_argument('--convert-md', action='store_true',
                       help='切分 PDF 并转换为 Markdown (使用 MinerU)')
    parser.add_argument('--backend', default='auto',
                       choices=['auto', 'pipeline', 'hybrid-auto-engine'],
                       help='MinerU 后端: auto(自动检测), pipeline(CPU), hybrid-auto-engine(GPU加速) (默认: auto)')

    args = parser.parse_args()

    # 检查文件是否存在
    if not Path(args.pdf_file).exists():
        print(f"❌ 错误: 文件不存在: {args.pdf_file}")
        sys.exit(1)

    # 创建处理器并执行
    processor = TextbookProcessor(args.pdf_file, args.output)

    # 如果指定了 --convert-md，启用 Markdown 转换
    convert_to_markdown = args.convert_md and not args.split_only

    result = processor.process(
        split_only=args.split_only,
        convert_to_markdown=convert_to_markdown,
        backend=args.backend
    )

    # 根据结果设置退出码
    sys.exit(0 if result['success'] else 1)


if __name__ == "__main__":
    main()
