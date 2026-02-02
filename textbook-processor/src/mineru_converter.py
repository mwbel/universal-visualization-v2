"""
MinerU 转换器 - 将 PDF 章节转换为 Markdown
支持 GPU 加速 (Apple Silicon M1/M2/M3/M4)
"""

import json
from pathlib import Path
from typing import List, Dict, Optional
import sys


class MinerUConverter:
    """MinerU PDF 到 Markdown 转换器"""

    def __init__(self, backend: str = "auto"):
        """
        初始化转换器

        Args:
            backend: 解析后端
                - "pipeline": 纯CPU，兼容性好
                - "auto": 自动选择（GPU优先）
        """
        self.backend = self._detect_backend(backend)
        self.mineru_available = self._check_mineru()

    def _detect_backend(self, backend: str) -> str:
        """检测最佳后端"""
        if backend != "auto":
            return backend

        # 检测是否有 GPU
        try:
            import torch
            if torch.backends.mps.is_available():
                print("✓ 检测到 Apple Silicon GPU (MPS)")
                return "hybrid-auto-engine"  # GPU 加速
            elif torch.cuda.is_available():
                print("✓ 检测到 NVIDIA GPU (CUDA)")
                return "hybrid-auto-engine"
            else:
                print("⚠️  未检测到 GPU，使用 CPU 模式")
                return "pipeline"
        except ImportError:
            print("⚠️  PyTorch 未安装，使用 pipeline 模式")
            return "pipeline"

    def _check_mineru(self) -> bool:
        """检查 mineru 是否可用"""
        try:
            import mineru
            print(f"✓ MinerU 可用 (Python API)")
            return True
        except ImportError:
            print("⚠️  MinerU 模块未找到")
            return False
        except Exception as e:
            print(f"⚠️  MinerU 检查失败: {e}")
            return False

    def convert_pdf_to_markdown(self, pdf_path: str, output_dir: str) -> Dict:
        """
        转换单个 PDF 到 Markdown

        Args:
            pdf_path: PDF 文件路径
            output_dir: 输出目录

        Returns:
            转换结果字典
        """
        if not self.mineru_available:
            return {
                'success': False,
                'error': 'MinerU module not found'
            }

        output_path = Path(output_dir)
        output_path.mkdir(parents=True, exist_ok=True)

        print(f"🔄 转换中...")
        print(f"   输入: {Path(pdf_path).name}")
        print(f"   输出: {output_path}")
        print(f"   后端: {self.backend}")

        try:
            # 使用 MinerU Python API (do_parse)
            from mineru.cli.common import do_parse

            # 读取 PDF 文件
            with open(pdf_path, 'rb') as f:
                pdf_bytes = f.read()

            pdf_name = Path(pdf_path).name

            # 执行解析
            result = do_parse(
                output_dir=str(output_path),
                pdf_file_names=[pdf_name],
                pdf_bytes_list=[pdf_bytes],
                p_lang_list=['zh'],  # 中文
                backend=self.backend
            )

            # 查找生成的 markdown 文件
            md_files = list(output_path.glob("*.md"))

            if md_files:
                print(f"✓ 转换成功!")
                print(f"   Markdown: {md_files[0].name}")

                return {
                    'success': True,
                    'markdown_file': str(md_files[0]),
                    'output_dir': str(output_path)
                }
            else:
                return {
                    'success': False,
                    'error': 'No markdown file generated'
                }

        except Exception as e:
            import traceback
            traceback.print_exc()
            return {
                'success': False,
                'error': str(e)
            }

    def batch_convert(self, pdf_files: List[str], output_base_dir: str) -> List[Dict]:
        """
        批量转换 PDF 文件

        Args:
            pdf_files: PDF 文件路径列表
            output_base_dir: 输出基础目录

        Returns:
            转换结果列表
        """
        results = []

        for i, pdf_file in enumerate(pdf_files, 1):
            pdf_name = Path(pdf_file).stem
            print(f"\n[{i}/{len(pdf_files)}] 转换: {pdf_name}")

            # 为每个文件创建独立的输出目录
            output_dir = Path(output_base_dir) / pdf_name

            result = self.convert_pdf_to_markdown(pdf_file, str(output_dir))
            result['source_file'] = pdf_file
            result['file_name'] = pdf_name
            results.append(result)

        # 打印总结
        success_count = sum(1 for r in results if r['success'])
        print(f"\n{'='*60}")
        print(f"批量转换完成:")
        print(f"  总数: {len(results)}")
        print(f"  成功: {success_count}")
        print(f"  失败: {len(results) - success_count}")
        print(f"{'='*60}")

        return results


def test_conversion():
    """测试转换功能"""
    import sys

    if len(sys.argv) < 2:
        print("用法: python mineru_converter.py <pdf_file>")
        sys.exit(1)

    pdf_file = sys.argv[1]

    converter = MinerUConverter(backend="auto")

    print("="*60)
    print("MinerU PDF → Markdown 转换测试")
    print("="*60)

    result = converter.convert_pdf_to_markdown(
        pdf_file,
        f"test_output_{Path(pdf_file).stem}"
    )

    print("\n" + "="*60)
    print("转换结果:")
    print("="*60)

    if result['success']:
        print(f"✅ 成功!")
        print(f"Markdown 文件: {result['markdown_file']}")

        # 显示前几行 Markdown 内容
        try:
            with open(result['markdown_file'], 'r', encoding='utf-8') as f:
                lines = f.readlines()[:20]
                print("\nMarkdown 内容预览:")
                print("-"*60)
                for line in lines:
                    print(line.rstrip())
        except Exception as e:
            print(f"无法预览: {e}")
    else:
        print(f"❌ 失败!")
        print(f"错误: {result['error']}")


if __name__ == "__main__":
    # 如果直接运行，执行测试
    test_conversion()
