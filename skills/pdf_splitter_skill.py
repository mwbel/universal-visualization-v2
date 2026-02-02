"""
Skill 2: PDF 分章切分和 Markdown 转换
根据章节页码范围分割 PDF，并调用 MinerU API 进行 Markdown 识别
"""
import os
import json
import asyncio
from typing import Dict, List, Any, Optional
from pathlib import Path
from dataclasses import dataclass, asdict
from datetime import datetime
import re

try:
    import fitz  # PyMuPDF
    PYMUPDF_AVAILABLE = True
except ImportError:
    PYMUPDF_AVAILABLE = False

try:
    import requests
    REQUESTS_AVAILABLE = True
except ImportError:
    REQUESTS_AVAILABLE = False


@dataclass
class ChapterResult:
    """章节处理结果"""
    number: int
    title: str
    page_start: int
    page_end: int
    pdf_file: str  # 分割后的 PDF 文件路径
    markdown_file: str  # Markdown 文件路径
    status: str  # success, failed, pending
    error: Optional[str] = None


class PDFSplitterSkill:
    """PDF 分割和 Markdown 转换 Skill

    功能：
    1. 根据章节页码范围分割 PDF
    2. 调用 MinerU API 将每章转换为 Markdown
    3. 保存转换结果
    """

    def __init__(
        self,
        api_url: str = None,
        api_key: str = None,
        timeout: int = 600  # 10分钟超时（大文件）
    ):
        """
        初始化 Skill

        Args:
            api_url: MinerU API 地址
            api_key: API 密钥
            timeout: 请求超时时间
        """
        self.api_url = api_url or os.getenv("MINERU_API_URL", "http://49.52.18.227:8000")
        self.api_key = api_key or os.getenv("MINERU_API_KEY")
        self.timeout = timeout

        if not PYMUPDF_AVAILABLE:
            print("⚠️  警告: PyMuPDF 未安装，无法分割 PDF")
            print("   请运行: pip3 install pymupdf")

    async def split_and_convert(
        self,
        pdf_path: str,
        chapters: List[Any],  # List[Chapter] from Skill 1
        output_dir: str = None,
        convert_to_markdown: bool = True,
        split_pdf: bool = True
    ) -> Dict[str, Any]:
        """
        分割 PDF 并转换为 Markdown

        Args:
            pdf_path: 原始 PDF 路径
            chapters: 章节列表（来自 Skill 1）
            output_dir: 输出目录
            convert_to_markdown: 是否转换为 Markdown
            split_pdf: 是否分割 PDF

        Returns:
            Dict: 处理结果
        """
        print(f"📚 开始处理: {os.path.basename(pdf_path)}")
        print(f"   总章节数: {len(chapters)}")

        # 创建输出目录
        if not output_dir:
            pdf_name = Path(pdf_path).stem
            output_dir = Path("output/chapters") / pdf_name
        else:
            output_dir = Path(output_dir)

        output_dir.mkdir(parents=True, exist_ok=True)

        results = []

        # 1. 分割 PDF（可选）
        chapter_pdfs = []
        if split_pdf:
            if not PYMUPDF_AVAILABLE:
                return {
                    "success": False,
                    "error": "PyMuPDF 未安装，无法分割 PDF"
                }

            print(f"\n✂️  开始分割 PDF...")
            chapter_pdfs = await self._split_pdf_by_chapters(
                pdf_path,
                chapters,
                output_dir / "pdfs"
            )
            print(f"✓ 分割完成，生成 {len(chapter_pdfs)} 个文件")

        # 2. 转换为 Markdown（可选）
        if convert_to_markdown:
            if not REQUESTS_AVAILABLE:
                return {
                    "success": False,
                    "error": "requests 未安装，无法调用 API"
                }

            print(f"\n📝 开始转换为 Markdown...")

            for i, chapter in enumerate(chapters):
                chapter_pdf = chapter_pdfs[i] if chapter_pdfs else pdf_path

                result = await self._convert_chapter_to_markdown(
                    chapter_pdf,
                    chapter,
                    output_dir / "markdown"
                )

                results.append(result)

                # 显示进度
                status_icon = "✓" if result.status == "success" else "✗"
                print(f"  {status_icon} 第{chapter.number}章: {chapter.title}")

                if result.error:
                    print(f"      错误: {result.error}")

        # 3. 生成汇总报告
        summary_path = await self._generate_summary(
            chapters,
            results,
            output_dir
        )

        return {
            "success": True,
            "total_chapters": len(chapters),
            "output_dir": str(output_dir),
            "results": results,
            "summary_file": str(summary_path)
        }

    async def _split_pdf_by_chapters(
        self,
        pdf_path: str,
        chapters: List[Any],
        output_dir: Path
    ) -> List[str]:
        """
        按章节分割 PDF

        Args:
            pdf_path: 原始 PDF 路径
            chapters: 章节列表
            output_dir: 输出目录

        Returns:
            List[str]: 生成的 PDF 文件路径列表
        """
        if not PYMUPDF_AVAILABLE:
            raise RuntimeError("PyMuPDF 未安装")

        output_dir.mkdir(parents=True, exist_ok=True)

        doc = fitz.open(pdf_path)
        output_files = []

        for chapter in chapters:
            # 创建新 PDF
            chapter_doc = fitz.open()

            # 复制章节页面（0-based 索引）
            start = chapter.page_start - 1
            end = chapter.page_end

            for page_num in range(start, end):
                if page_num < len(doc):
                    chapter_doc.insert_pdf(doc, from_page=page_num, to_page=page_num)

            # 保存章节文件
            filename = f"{chapter.number:02d}_{self._sanitize_filename(chapter.title)}.pdf"
            output_path = output_dir / filename
            chapter_doc.save(str(output_path))
            output_files.append(str(output_path))

            chapter_doc.close()

        doc.close()
        return output_files

    async def _convert_chapter_to_markdown(
        self,
        chapter_pdf: str,
        chapter: Any,
        output_dir: Path
    ) -> ChapterResult:
        """
        转换单章为 Markdown

        Args:
            chapter_pdf: 章节 PDF 路径
            chapter: 章节信息
            output_dir: 输出目录

        Returns:
            ChapterResult: 转换结果
        """
        output_dir.mkdir(parents=True, exist_ok=True)

        # 准备输出文件名
        md_filename = f"{chapter.number:02d}_{self._sanitize_filename(chapter.title)}.md"
        md_path = output_dir / md_filename

        # 调用 MinerU API
        try:
            # TODO: 实现实际的 API 调用
            # 现在先创建占位符文件

            markdown_content = await self._call_mineru_api(chapter_pdf)

            if markdown_content:
                # 保存 Markdown
                with open(md_path, 'w', encoding='utf-8') as f:
                    f.write(markdown_content)

                return ChapterResult(
                    number=chapter.number,
                    title=chapter.title,
                    page_start=chapter.page_start,
                    page_end=chapter.page_end,
                    pdf_file=chapter_pdf,
                    markdown_file=str(md_path),
                    status="success"
                )
            else:
                return ChapterResult(
                    number=chapter.number,
                    title=chapter.title,
                    page_start=chapter.page_start,
                    page_end=chapter.page_end,
                    pdf_file=chapter_pdf,
                    markdown_file=str(md_path),
                    status="failed",
                    error="API 返回空内容"
                )

        except Exception as e:
            return ChapterResult(
                number=chapter.number,
                title=chapter.title,
                page_start=chapter.page_start,
                page_end=chapter.page_end,
                pdf_file=chapter_pdf,
                markdown_file=str(md_path),
                status="failed",
                error=str(e)
            )

    async def _call_mineru_api(self, pdf_path: str) -> Optional[str]:
        """
        调用 MinerU API 进行 OCR

        Args:
            pdf_path: PDF 文件路径

        Returns:
            str: Markdown 内容
        """
        # TODO: 实现实际的 API 调用
        # 现在返回占位符内容

        print(f"      调用 API: {self.api_url}/api/ocr")
        print(f"      文件: {os.path.basename(pdf_path)}")

        # 临时实现：返回占位符
        return f"""# {os.path.splitext(os.path.basename(pdf_path))[0]}

**说明**: 这是临时占位符内容。

服务器 MinerU API 部署完成后，将调用实际 API 进行 OCR 识别。

**文件信息**:
- 路径: {pdf_path}
- 大小: {os.path.getsize(pdf_path) / 1024:.2f} KB

---

*等待服务器 API 部署...*
"""

    async def _generate_summary(
        self,
        chapters: List[Any],
        results: List[ChapterResult],
        output_dir: Path
    ) -> Path:
        """
        生成汇总报告

        Args:
            chapters: 章节列表
            results: 处理结果列表
            output_dir: 输出目录

        Returns:
            Path: 汇总文件路径
        """
        summary_path = output_dir / "汇总报告.md"

        lines = []
        lines.append("# PDF 教材处理汇总报告\n")
        lines.append(f"**生成时间**: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
        lines.append(f"**总章节数**: {len(chapters)}\n\n")

        # 统计
        success_count = sum(1 for r in results if r.status == "success")
        failed_count = sum(1 for r in results if r.status == "failed")

        lines.append("## 处理统计\n\n")
        lines.append(f"- ✅ 成功: {success_count} 章\n")
        lines.append(f"- ❌ 失败: {failed_count} 章\n")
        lines.append(f"- ⏳ 待处理: {len(chapters) - success_count - failed_count} 章\n\n")

        # 详细结果
        lines.append("## 章节详情\n\n")

        for result in results:
            status_icon = "✅" if result.status == "success" else "❌"
            lines.append(f"### {status_icon} 第{result.number}章: {result.title}\n\n")
            lines.append(f"- **页码范围**: {result.page_start} - {result.page_end}\n")
            lines.append(f"- **PDF 文件**: `{os.path.basename(result.pdf_file)}`\n")

            if result.markdown_file:
                lines.append(f"- **Markdown 文件**: `{os.path.basename(result.markdown_file)}`\n")

            if result.error:
                lines.append(f"- **错误**: {result.error}\n")

            lines.append("\n")

        # 写入文件
        content = "".join(lines)
        with open(summary_path, 'w', encoding='utf-8') as f:
            f.write(content)

        print(f"\n📊 汇总报告已生成: {summary_path}")
        return summary_path

    def _sanitize_filename(self, title: str) -> str:
        """清理文件名"""
        # 移除或替换不安全的字符
        title = re.sub(r'[<>:"/\\|?*]', '', title)
        title = title.strip()
        return title[:50]  # 限制长度


# 便捷函数
async def split_and_convert_pdf(
    pdf_path: str,
    chapters: List[Any],
    output_dir: str = None,
    convert_to_markdown: bool = True
) -> Dict[str, Any]:
    """
    分割并转换 PDF 的便捷函数

    Args:
        pdf_path: PDF 文件路径
        chapters: 章节列表（来自 Skill 1）
        output_dir: 输出目录
        convert_to_markdown: 是否转换为 Markdown

    Returns:
        Dict: 处理结果
    """
    skill = PDFSplitterSkill()

    result = await skill.split_and_convert(
        pdf_path=pdf_path,
        chapters=chapters,
        output_dir=output_dir,
        convert_to_markdown=convert_to_markdown
    )

    return result


if __name__ == "__main__":
    import asyncio

    async def test():
        """测试 Skill 2"""
        from skills.toc_recognizer_skill import Chapter

        # 测试数据（实际使用时从 Skill 1 获取）
        test_chapters = [
            Chapter(
                number=1,
                title="概率论的基本概念",
                page_start=16,
                page_end=77,
                sections=[
                    {"title": "1.1 随机试验", "page": 16, "level": 2},
                    {"title": "1.2 样本空间与事件", "page": 20, "level": 2},
                    {"title": "1.3 概率", "page": 25, "level": 2},
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

        # 测试 PDF
        pdf_path = "书籍/概率论与数理统计第五版盛骤-完整版.pdf"

        if os.path.exists(pdf_path):
            result = await split_and_convert_pdf(
                pdf_path=pdf_path,
                chapters=test_chapters,
                output_dir="output/test_splitter",
                convert_to_markdown=True
            )

            print(f"\n✅ 处理完成!")
            print(f"  总章节数: {result['total_chapters']}")
            print(f"  输出目录: {result['output_dir']}")
            print(f"  汇总报告: {result['summary_file']}")
        else:
            print(f"✗ 测试文件不存在: {pdf_path}")

    asyncio.run(test())
