# MinerU 集成分析报告

## 📚 MinerU 项目概述

**MinerU** 是一个将 PDF 转换为机器可读格式（Markdown、JSON）的开源工具，由上海人工智能实验室 OpenDataLab 开发。

### 核心特性

✅ **自动公式识别** - 将数学公式转换为 LaTeX 格式
✅ **表格识别** - 将表格转换为 HTML/Markdown 格式
✅ **多语言 OCR** - 支持 109 种语言的文字识别
✅ **结构保留** - 保留标题、段落、列表等文档结构
✅ **图片提取** - 自动提取图片和图片描述
✅ **跨平台支持** - Windows / Linux / macOS
✅ **GPU 加速** - 支持 CUDA/NPU/MPS 加速

### 关键功能对比

| 特性 | MinerU | 我们需要 |
|------|--------|---------|
| PDF → Markdown | ✅ | ✅ |
| 数学公式 → LaTeX | ✅ | ✅ 核心 |
| 表格 → HTML/MD | ✅ | ✅ |
| 图片提取 | ✅ | ✅ |
| 自动 OCR | ✅ | ✅ |
| 章节切分 | ❌ | ✅ 我们已有 |
| 元数据生成 | ✅ | ✅ 我们已有 |

**结论**: MinerU 非常适合作为 Markdown 转换引擎！

---

## 🚀 安装和使用指南

### 方式 1: 使用本地安装的 MinerU

#### 1. 安装 MinerU

```bash
# 使用 pip 安装（推荐）
pip install --upgrade pip
pip install "mineru[all]"

# 或使用 uv（更快）
pip install uv
uv pip install "mineru[all]"
```

#### 2. 基本使用

```bash
# GPU 加速（如果有 NVIDIA GPU 或 Apple Silicon）
mineru -p input.pdf -o output_dir

# 纯 CPU 模式
mineru -p input.pdf -o output_dir -b pipeline
```

#### 3. 输出结构

```
output_dir/
├── input.md              # Markdown 文件
├── images/               # 提取的图片
└── input.json            # 结构化数据（可选）
```

### 方式 2: 使用源码中的 MinerU

如果你已经下载了源码：

```bash
cd /Users/Min369/Documents/同步空间/Manju/Projects/AlVisualization/tools/MinerU-master

# 安装依赖
uv pip install -e .[all]

# 使用
mineru -p input.pdf -o output
```

### 方式 3: Python API 调用

```python
from mineru import SingleFile

# 解析 PDF
pdf_file = SingleFile(
    pdf_path="input.pdf",
    output_dir="output"
)

# 执行解析
result = pdf_file()

# 获取结果
markdown_content = result.markdown.content  # Markdown 内容
images = result.markdown.images             # 图片列表
```

---

## 🔧 集成到 Textbook Processor

### 架构设计

```
Textbook Processor v0.2
├── PDF 分析模块 (已有)
├── PDF 切分模块 (已有)
├── MinerU 转换模块 (新增) ⭐
│   ├── 调用 MinerU API
│   ├── 批量转换
│   └── 结果整合
└── 元数据生成模块 (已有)
```

### 实现步骤

#### Step 1: 创建 MinerU 转换器

**文件**: `src/mineru_converter.py`

```python
"""
MinerU 转换器 - 将 PDF 章节转换为 Markdown
"""

import subprocess
import json
from pathlib import Path
from typing import List, Dict, Optional


class MinerUConverter:
    """MinerU 转换器"""

    def __init__(self, backend: str = "pipeline"):
        """
        初始化转换器

        Args:
            backend: 解析后端
                - "pipeline": 纯CPU，兼容性好
                - "hybrid-auto-engine": GPU加速，精度高
        """
        self.backend = backend

    def convert_pdf_to_markdown(self, pdf_path: str, output_dir: str) -> Dict:
        """
        转换单个 PDF 到 Markdown

        Args:
            pdf_path: PDF 文件路径
            output_dir: 输出目录

        Returns:
            转换结果字典
        """
        output_path = Path(output_dir)
        output_path.mkdir(parents=True, exist_ok=True)

        # 调用 mineru 命令
        cmd = [
            "mineru",
            "-p", pdf_path,
            "-o", str(output_path),
            "-b", self.backend
        ]

        try:
            # 执行转换
            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                timeout=600  # 10分钟超时
            )

            if result.returncode == 0:
                # 查找生成的 markdown 文件
                md_files = list(output_path.glob("*.md"))
                if md_files:
                    return {
                        'success': True,
                        'markdown_file': md_files[0],
                        'output_dir': str(output_path)
                    }
                else:
                    return {
                        'success': False,
                        'error': 'No markdown file generated'
                    }
            else:
                return {
                    'success': False,
                    'error': result.stderr
                }

        except subprocess.TimeoutExpired:
            return {
                'success': False,
                'error': 'Conversion timeout'
            }
        except Exception as e:
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
            print(f"[{i}/{len(pdf_files)}] 转换: {Path(pdf_file).name}")

            # 为每个文件创建独立的输出目录
            file_name = Path(pdf_file).stem
            output_dir = Path(output_base_dir) / file_name

            result = self.convert_pdf_to_markdown(pdf_file, str(output_dir))
            result['source_file'] = pdf_file
            results.append(result)

        return results
```

#### Step 2: 集成到主处理流程

**修改**: `process_textbook.py`

在切分 PDF 后，添加 MinerU 转换步骤：

```python
# 在 process() 方法中添加
def process(self, convert_to_markdown: bool = False):
    # ... 已有代码 ...

    # Step 3.5: Markdown 转换（可选）
    if convert_to_markdown:
        print("\n[3.5/6] 转换 PDF 为 Markdown...")
        from mineru_converter import MinerUConverter

        converter = MinerUConverter(backend="pipeline")

        # 获取切分后的 PDF 文件
        chapter_pdfs = list((self.output_dir / "chapters").glob("*.pdf"))

        # 批量转换
        results = converter.batch_convert(
            [str(f) for f in chapter_pdfs],
            str(self.output_dir / "markdown")
        )

        # 统计结果
        success_count = sum(1 for r in results if r['success'])
        print(f"  转换成功: {success_count}/{len(results)}")
```

---

## 📊 性能预估

### 转换速度

| 硬件配置 | 速度估算 |
|---------|---------|
| 纯 CPU (pipeline) | ~1-2 秒/页 |
| GPU 加速 (hybrid) | ~0.3-0.5 秒/页 |

### 示例

**概率论与数理统计（525页）**:
- 纯 CPU: ~10-15 分钟
- GPU 加速: ~3-5 分钟

---

## ⚙️ 推荐配置

### 开发环境（MacBook）

```python
# 使用 pipeline 后端（纯CPU）
converter = MinerUConverter(backend="pipeline")
```

**优点**:
- ✅ 兼容性好
- ✅ 不需要 GPU
- ✅ 内存占用低

### 生产环境（有 GPU）

```python
# 使用 hybrid-auto-engine（GPU加速）
converter = MinerUConverter(backend="hybrid-auto-engine")
```

**优点**:
- ✅ 速度快（3-5倍）
- ✅ 精度更高
- ⚠️ 需要 GPU（NVIDIA/Apple Silicon）

---

## 🎯 下一步行动

### 立即可做

1. **安装 MinerU**
   ```bash
   pip install "mineru[all]"
   ```

2. **测试基本功能**
   ```bash
   mineru -p test.pdf -o test_output
   ```

3. **创建集成模块**
   - 创建 `src/mineru_converter.py`
   - 修改 `process_textbook.py` 添加转换步骤

### 测试方案

1. **单章测试**
   ```bash
   # 使用已切分的小文件测试
   mineru -p "概率论与数理统计第五版盛骤_1-2章.pdf" -o test_output
   ```

2. **完整流程测试**
   ```bash
   python3 process_textbook.py textbook.pdf --convert-md
   ```

---

## 📝 总结

### ✅ MinerU 优势

1. **完美适配需求** - 专门处理学术 PDF，公式识别准确
2. **开源免费** - MIT 协议，可商用
3. **持续更新** - 活跃的社区支持
4. **易于集成** - 提供 Python API

### ⚠️ 注意事项

1. **首次运行慢** - 需要下载模型（~2GB）
2. **内存占用** - 建议 16GB+ 内存
3. **GPU 要求** - GPU 加速需要 10GB+ 显存

### 🚀 建议方案

**Phase 1**: 集成 pipeline 后端（纯CPU）
- ✅ 立即可用
- ✅ 兼容性好
- ⏱️ 速度可接受

**Phase 2**: 优化 GPU 加速
- 🚀 提升速度 3-5倍
- 📈 提升精度
- 💰 需要 GPU 资源

---

**准备开始集成吗？我可以立即帮你创建 MinerU 转换器模块！**
