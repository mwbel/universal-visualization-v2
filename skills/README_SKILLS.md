# PDF 教材处理 Skills 使用指南

## 概述

本项目包含两个独立的 Skills，用于处理 PDF 教材：

- **Skill 1**: 目录识别和页码范围计算
- **Skill 2**: PDF 分章切分和 Markdown 转换

两个 Skills 可以单独使用，也可以组合成完整工作流。

## 架构说明

```
┌──────────────────────────────────────────────────────────────┐
│                      PDF 教材处理工作流                       │
└──────────────────────────────────────────────────────────────┘

   PDF 文件
      │
      ▼
┌─────────────────────────────────────────┐
│  Skill 1: TOC Recognizer                │
│  - 调用 MinerU API 识别目录             │
│  - 计算每章的准确页码范围               │
│  - 输出 Markdown 文件                   │
└──────────────┬──────────────────────────┘
               │ 章节信息 (页码范围)
               ▼
┌─────────────────────────────────────────┐
│  Skill 2: PDF Splitter                  │
│  - 按章节分割 PDF                       │
│  - 调用 MinerU API 转换为 Markdown      │
│  - 生成汇总报告                         │
└──────────────┬──────────────────────────┘
               │
               ▼
         Markdown 文件集
```

## Skill 1: 目录识别和页码范围计算

### 功能

1. 从 PDF 元数据或 OCR 提取目录结构
2. 解析章、节、小节信息
3. **计算每章的准确页码范围**
   - **重要**：目录中的所有页码都是"起始页"
   - 某章开始页码 = 目录中该章显示的页码
   - 某章结束页码 = 下一章开始页码 - 1（或文档末尾）
4. 输出为 Markdown 文件

### 使用方法

#### 方式 1: 便捷函数（推荐新手）

```python
from skills.toc_recognizer_skill import recognize_pdf_toc

result = await recognize_pdf_toc(
    pdf_path="your_book.pdf",
    output_path="output/toc.md",  # 可选
    use_ocr=False  # 是否使用 OCR（扫描版 PDF 需要）
)

print(f"识别到 {result['total_chapters']} 章")
print(f"目录文件: {result['markdown_file']}")
```

#### 方式 2: Skill 类（推荐高级用户）

```python
from skills.toc_recognizer_skill import TOCRecognizerSkill

skill = TOCRecognizerSkill()

# 识别目录
chapters = await skill.recognize_toc(
    pdf_path="your_book.pdf",
    toc_pages="1-5",  # 目录所在页码范围
    use_ocr=False
)

# 导出 Markdown
md_path = skill.export_to_markdown(
    chapters=chapters,
    pdf_path="your_book.pdf",
    output_path="output/toc.md"
)
```

### 输出示例

生成的 Markdown 文件格式：

```markdown
# 概率论与数理统计第五版盛骤-完整版.pdf - 目录结构

**生成时间**: 2026-02-02 12:00:00

**总章节数**: 12

---

## 第1章 概率论的基本概念 (第16-77页)

**包含章节**:

- 1.1 随机试验 (第16页)
- 1.2 样本空间与事件 (第20页)
- 1.3 概率 (第25页)
- 1.4 条件概率 (第35页)
...

**页码范围**: 第 16 - 77 页
**总页数**: 62 页

---
```

## Skill 2: PDF 分割和 Markdown 转换

### 功能

1. 根据章节页码范围分割 PDF
2. 对每个章节调用 MinerU API 进行 OCR
3. 将每个章节转换为 Markdown 格式
4. 生成处理汇总报告

### 使用方法

#### 方式 1: 便捷函数（推荐新手）

```python
from skills.pdf_splitter_skill import split_and_convert_pdf
from skills.toc_recognizer_skill import recognize_pdf_toc

# 先使用 Skill 1 获取章节信息
toc_result = await recognize_pdf_toc("your_book.pdf")
chapters = toc_result['chapters']

# 再使用 Skill 2 分割和转换
result = await split_and_convert_pdf(
    pdf_path="your_book.pdf",
    chapters=chapters,
    output_dir="output/chapters",
    convert_to_markdown=True
)

print(f"处理完成: {result['total_chapters']} 章")
print(f"输出目录: {result['output_dir']}")
print(f"汇总报告: {result['summary_file']}")
```

#### 方式 2: Skill 类（推荐高级用户）

```python
from skills.pdf_splitter_skill import PDFSplitterSkill

skill = PDFSplitterSkill(
    api_url="http://49.52.18.227:8000",
    timeout=600
)

result = await skill.split_and_convert(
    pdf_path="your_book.pdf",
    chapters=chapters,  # 来自 Skill 1
    output_dir="output/chapters",
    convert_to_markdown=True,
    split_pdf=True
)
```

### 输出结构

```
output/chapters/
├── pdfs/                    # 分割后的章节 PDF
│   ├── 01_第一章.pdf
│   ├── 02_第二章.pdf
│   └── ...
├── markdown/                # 转换后的 Markdown
│   ├── 01_第一章.md
│   ├── 02_第二章.md
│   └── ...
└── 汇总报告.md             # 处理结果汇总
```

## 完整工作流示例

### 自动化脚本

```python
import asyncio
from skills.toc_recognizer_skill import recognize_pdf_toc
from skills.pdf_splitter_skill import split_and_convert_pdf

async def process_textbook(pdf_path: str):
    """完整工作流：识别 → 分割 → 转换"""

    # 步骤 1: 识别目录
    print("步骤 1: 识别目录...")
    toc_result = await recognize_pdf_toc(
        pdf_path=pdf_path,
        use_ocr=False
    )
    print(f"✓ 识别到 {toc_result['total_chapters']} 章")

    # 步骤 2: 分割和转换
    print("步骤 2: 分割和转换...")
    split_result = await split_and_convert_pdf(
        pdf_path=pdf_path,
        chapters=toc_result['chapters'],
        output_dir="output/processed",
        convert_to_markdown=True
    )

    print(f"✓ 完成！输出目录: {split_result['output_dir']}")
    return split_result

# 运行
result = asyncio.run(process_textbook("your_book.pdf"))
```

### 交互式演示

运行交互式演示脚本：

```bash
python3 demo_two_skills_workflow.py
```

这将提供菜单选项，让你选择：
- 完整工作流 (Skill 1 → Skill 2)
- 仅运行 Skill 1
- 仅运行 Skill 2

## 依赖安装

```bash
# 必需的依赖
pip3 install pymupdf requests

# 可选：如果需要异步支持
pip3 install aiohttp
```

## 配置

### 环境变量（可选）

```bash
# MinerU API 地址
export MINERU_API_URL="http://49.52.18.227:8000"

# API 密钥（如果需要）
export MINERU_API_KEY="your-api-key"
```

### 代码中配置

```python
# Skill 1
from skills.toc_recognizer_skill import TOCRecognizerSkill

skill = TOCRecognizerSkill(
    api_url="http://your-server:8000",
    timeout=300
)

# Skill 2
from skills.pdf_splitter_skill import PDFSplitterSkill

skill = PDFSplitterSkill(
    api_url="http://your-server:8000",
    timeout=600  # 大文件需要更长时间
)
```

## 常见问题

### 1. 如何处理扫描版 PDF？

对于扫描版 PDF，需要启用 OCR：

```python
# Skill 1
toc_result = await recognize_pdf_toc(
    pdf_path="scanned_book.pdf",
    use_ocr=True  # 启用 OCR
)

# Skill 2
split_result = await split_and_convert_pdf(
    pdf_path="scanned_book.pdf",
    chapters=chapters,
    convert_to_markdown=True  # 会自动使用 OCR
)
```

### 2. 页码范围计算逻辑

**重要概念**：目录中的所有页码都是"起始页"，不是"结束页"！

Skill 1 使用以下算法计算页码范围：

```python
for each chapter:
    # 开始页码 = 目录中该章显示的页码
    page_start = 目录页码

    # 结束页码计算:
    if 不是最后一章:
        page_end = 下一章.page_start - 1
    else:  # 最后一章
        page_end = PDF 总页数
```

**示例**：

```
目录内容:
  第一章 概率论的基本概念 ............ 第16页
  第二章 随机变量及其分布 ............ 第78页
  第三章 多维随机变量 ................ 第151页

计算结果:
  第一章: 16-77页  (包含到第77页，第78页是第二章开始)
  第二章: 78-150页 (包含到第150页，第151页是第三章开始)
  第三章: 151-525页 (到文档末尾)
```

这样计算能确保：
- ✅ 包含每章的所有内容（正文+习题+总结等）
- ✅ 不会遗漏章节之间的内容
- ✅ 章节之间不会重叠

### 3. 如何只分割 PDF，不转换 Markdown？

```python
result = await split_and_convert_pdf(
    pdf_path="your_book.pdf",
    chapters=chapters,
    convert_to_markdown=False,  # 不转换
    split_pdf=True              # 只分割
)
```

### 4. 服务器 API 还未部署怎么办？

两个 Skills 都有**本地降级功能**：

- **Skill 1**: 使用 PyMuPDF 从 PDF 元数据提取目录
- **Skill 2**: 使用 PyMuPDF 分割 PDF（不转换 Markdown）

```python
# Skill 1: 自动降级到本地提取
toc_result = await recognize_pdf_toc(
    pdf_path="your_book.pdf",
    use_ocr=False  # 不调用 API
)

# Skill 2: 只分割，不转换（避免 API 调用）
split_result = await split_and_convert_pdf(
    pdf_path="your_book.pdf",
    chapters=chapters,
    convert_to_markdown=False  # 不调用 API
)
```

### 5. 处理大文件时超时怎么办？

增加超时时间：

```python
skill = PDFSplitterSkill(
    timeout=1200  # 20 分钟
)
```

## 高级用法

### 自定义章节信息

如果 Skill 1 的识别不准确，可以手动定义章节：

```python
from skills.toc_recognizer_skill import Chapter
from skills.pdf_splitter_skill import split_and_convert_pdf

# 手动定义章节
chapters = [
    Chapter(
        number=1,
        title="第一章标题",
        page_start=16,
        page_end=77,
        sections=[
            {"title": "1.1 第一节", "page": 16, "level": 2},
            {"title": "1.2 第二节", "page": 25, "level": 2},
        ]
    ),
    Chapter(
        number=2,
        title="第二章标题",
        page_start=78,
        page_end=150,
        sections=[
            {"title": "2.1 第一节", "page": 78, "level": 2},
        ]
    )
]

# 直接使用 Skill 2
result = await split_and_convert_pdf(
    pdf_path="your_book.pdf",
    chapters=chapters,
    output_dir="output/custom"
)
```

### 批量处理多个 PDF

```python
import asyncio
from pathlib import Path

async def batch_process(pdf_dir: str):
    """批量处理目录中的所有 PDF"""
    pdf_files = list(Path(pdf_dir).glob("*.pdf"))

    for pdf_file in pdf_files:
        print(f"处理: {pdf_file.name}")

        # 完整工作流
        toc_result = await recognize_pdf_toc(str(pdf_file))
        split_result = await split_and_convert_pdf(
            pdf_path=str(pdf_file),
            chapters=toc_result['chapters']
        )

        print(f"✓ 完成: {pdf_file.name}")

# 运行
asyncio.run(batch_process("books/"))
```

## 技术细节

### 页码索引说明

- **输入**: 使用 1-based 页码（第 1 页，第 2 页，...）
- **PyMuPDF 内部**: 使用 0-based 索引
- **Skills 自动处理**转换，你只需要使用自然页码

### 异步操作

两个 Skills 都使用 `async/await`，支持异步操作：

```python
import asyncio

async def main():
    # 可以并发执行多个 PDF 的处理
    tasks = [
        recognize_pdf_toc("book1.pdf"),
        recognize_pdf_toc("book2.pdf"),
        recognize_pdf_toc("book3.pdf"),
    ]

    results = await asyncio.gather(*tasks)
    return results

asyncio.run(main())
```

## 下一步

1. **测试 Skill 1**
   ```bash
   python3 -c "
   import asyncio
   from skills.toc_recognizer_skill import recognize_pdf_toc
   asyncio.run(recognize_pdf_toc('your_book.pdf'))
   "
   ```

2. **测试完整工作流**
   ```bash
   python3 demo_two_skills_workflow.py
   ```

3. **等待服务器 API 部署**
   - 配置 `MINERU_API_URL`
   - 启用 `use_ocr=True`
   - 获得完整的 OCR 功能

## 相关文件

- `skills/toc_recognizer_skill.py` - Skill 1 实现
- `skills/pdf_splitter_skill.py` - Skill 2 实现
- `demo_two_skills_workflow.py` - 交互式演示
- `textbook-processor/README_AGENT_CLIENT.md` - Agent 使用指南
- `textbook-processor/DEVELOPMENT_SUMMARY.md` - 开发总结

## 获取帮助

如果遇到问题：

1. 查看错误信息
2. 确认依赖已安装 (`pip3 list | grep -E "pymupdf|requests"`)
3. 检查 PDF 文件路径
4. 如果是 API 问题，确认服务器是否运行
