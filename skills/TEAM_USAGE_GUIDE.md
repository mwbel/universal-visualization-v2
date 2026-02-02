# PDF 教材处理 Skills - 团队使用指南

## 📦 快速开始（给项目其他成员）

### 1. 安装依赖

```bash
# 进入项目目录
cd /path/to/AlVisualization

# 安装必需的依赖
pip3 install pymupdf requests

# 可选：如果需要异步支持
pip3 install aiohttp
```

### 2. 验证安装

```bash
python3 -c "import fitz; print('✓ PyMuPDF 安装成功')"
python3 -c "from skills import recognize_pdf_toc; print('✓ Skills 导入成功')"
```

### 3. 运行示例

```bash
# 交互式演示
python3 demo_two_skills_workflow.py

# 或直接运行测试
python3 skills/toc_recognizer_skill.py
```

## 🎯 三种使用方式

### 方式 1：最简单（复制粘贴）

直接使用示例脚本，修改 PDF 路径：

```python
import asyncio
from skills import recognize_pdf_toc

async def main():
    # 修改这里的 PDF 路径
    result = await recognize_pdf_toc(
        pdf_path="your_book.pdf",
        output_path="output/toc.md"
    )

    print(f"识别到 {result['total_chapters']} 章")
    print(f"目录文件: {result['markdown_file']}")

asyncio.run(main())
```

### 方式 2：作为工具函数导入

在你的代码中导入使用：

```python
from skills import recognize_pdf_toc, split_and_convert_pdf

# 使用 Skill 1
toc_result = await recognize_pdf_toc("book.pdf")

# 使用 Skill 2
split_result = await split_and_convert_pdf(
    "book.pdf",
    toc_result['chapters']
)
```

### 方式 3：集成到现有 Agent

如果你的项目有 Agent 系统：

```python
# 在你的 Agent 中导入
from skills.toc_recognizer_skill import TOCRecognizerSkill
from skills.pdf_splitter_skill import PDFSplitterSkill

class MyAgent:
    def __init__(self):
        self.toc_skill = TOCRecognizerSkill()
        self.split_skill = PDFSplitterSkill()

    async def process_textbook(self, pdf_path):
        # 识别目录
        chapters = await self.toc_skill.recognize_toc(pdf_path)

        # 分割 PDF
        result = await self.split_skill.split_and_convert(
            pdf_path, chapters
        )

        return result
```

## 📂 项目结构

```
AlVisualization/
├── skills/                          # PDF 处理模块
│   ├── __init__.py                  # 包初始化
│   ├── toc_recognizer_skill.py      # Skill 1: 目录识别
│   ├── pdf_splitter_skill.py        # Skill 2: PDF 分割
│   ├── README_SKILLS.md             # 详细文档
│   └── CREATION_SUMMARY.md          # 开发总结
│
├── demo_two_skills_workflow.py      # 交互式演示
│
└── 你的项目代码...
    └── your_code.py                 # 你的代码可以导入 skills
```

## 💡 使用示例

### 示例 1：批量处理多个 PDF

```python
import asyncio
from pathlib import Path
from skills import recognize_pdf_toc

async def batch_process(pdf_dir):
    """批量处理目录中的所有 PDF"""
    pdf_files = list(Path(pdf_dir).glob("*.pdf"))

    for pdf_file in pdf_files:
        print(f"处理: {pdf_file.name}")
        result = await recognize_pdf_toc(str(pdf_file))
        print(f"  ✓ {result['total_chapters']} 章")

asyncio.run(batch_process("books/"))
```

### 示例 2：只获取章节信息，不保存文件

```python
import asyncio
from skills.toc_recognizer_skill import TOCRecognizerSkill

async def get_chapters_only(pdf_path):
    skill = TOCRecognizerSkill()
    chapters = await skill.recognize_toc(pdf_path)

    # 只使用章节信息，不保存文件
    for ch in chapters:
        print(f"第{ch.number}章: {ch.title}")
        print(f"  页码: {ch.page_start}-{ch.page_end}")

    return chapters

chapters = asyncio.run(get_chapters_only("book.pdf"))
```

### 示例 3：自定义输出格式

```python
import asyncio
from skills.toc_recognizer_skill import TOCRecognizerSkill
import json

async def export_to_json(pdf_path):
    skill = TOCRecognizerSkill()
    chapters = await skill.recognize_toc(pdf_path)

    # 转换为 JSON
    data = [
        {
            "number": ch.number,
            "title": ch.title,
            "page_start": ch.page_start,
            "page_end": ch.page_end,
            "page_count": ch.page_end - ch.page_start + 1
        }
        for ch in chapters
    ]

    # 保存 JSON
    with open("chapters.json", "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    print(f"✓ 已导出到 chapters.json")

asyncio.run(export_to_json("book.pdf"))
```

## 🔧 配置选项

### 环境变量（可选）

创建 `.env` 文件或在项目中设置：

```bash
# MinerU API 地址（服务器部署后）
export MINERU_API_URL="http://your-server:8000"
export MINERU_API_KEY="your-api-key"
```

### 代码中配置

```python
from skills.toc_recognizer_skill import TOCRecognizerSkill

# 自定义配置
skill = TOCRecognizerSkill(
    api_url="http://your-server:8000",
    timeout=300
)
```

## 🤝 团队协作建议

### 1. 统一依赖管理

在项目的 `requirements.txt` 中添加：

```
pymupdf>=1.23.0
requests>=2.31.0
aiohttp>=3.9.0
```

团队成员安装：
```bash
pip3 install -r requirements.txt
```

### 2. 创建共享的工具模块

在项目中创建 `utils/textbook_utils.py`：

```python
"""
团队成员共享的 PDF 处理工具
"""
from skills import recognize_pdf_toc, split_and_convert_pdf
from pathlib import Path

async def process_textbook(
    pdf_path: str,
    output_dir: str = "output"
):
    """
    标准的教材处理流程

    Args:
        pdf_path: PDF 文件路径
        output_dir: 输出目录

    Returns:
        处理结果字典
    """
    # 识别目录
    toc_result = await recognize_pdf_toc(pdf_path)

    # 分割 PDF
    split_result = await split_and_convert_pdf(
        pdf_path,
        toc_result['chapters'],
        output_dir=output_dir,
        convert_to_markdown=False
    )

    return {
        "toc": toc_result,
        "split": split_result
    }
```

### 3. 文档共享

将以下文档分享给团队：
- `skills/README_SKILLS.md` - 使用指南
- `skills/TEAM_USAGE_GUIDE.md` - 本文档
- `demo_two_skills_workflow.py` - 示例代码

### 4. 代码审查清单

在使用 Skills 前检查：
- [ ] PDF 文件路径正确
- [ ] 输出目录存在
- [ ] 有足够的磁盘空间
- [ ] PyMuPDF 已安装

### 5. 问题反馈

如果遇到问题，提供以下信息：
```python
import fitz
print(f"PyMuPDF 版本: {fitz.version}")
print(f"Python 版本: {sys.version}")

# 测试代码
try:
    from skills import recognize_pdf_toc
    print("✓ Skills 导入成功")
except Exception as e:
    print(f"✗ 导入失败: {e}")
```

## 📊 性能建议

### 大文件处理

对于大型 PDF（>500页）：

```python
# 增加超时时间
skill = TOCRecognizerSkill(timeout=600)

# 或只处理部分章节
chapters = chapters[:5]  # 只处理前 5 章
```

### 批量处理

```python
import asyncio

async def process_batch(pdf_files):
    """并发处理多个 PDF"""
    tasks = [
        recognize_pdf_toc(pdf)
        for pdf in pdf_files
    ]
    results = await asyncio.gather(*tasks)
    return results

# 使用
pdf_files = ["book1.pdf", "book2.pdf", "book3.pdf"]
results = asyncio.run(process_batch(pdf_files))
```

## 🐛 常见问题

### Q1: 导入错误 "No module named 'skills'"

**解决**：
```bash
# 确保在项目根目录
cd /path/to/AlVisualization

# 或添加到 Python 路径
export PYTHONPATH="/path/to/AlVisualization:$PYTHONPATH"
```

### Q2: PyMuPDF 安装失败

**解决**：
```bash
# macOS
pip3 install pymupdf

# 如果失败，尝试
brew install pymupdf

# 或使用 conda
conda install -c conda-forge pymupdf
```

### Q3: 中文路径问题

**解决**：
```python
# 使用绝对路径
from pathlib import Path

pdf_path = str(Path("书籍/教材.pdf").resolve())
result = await recognize_pdf_toc(pdf_path)
```

## 📞 获取帮助

1. **查看文档**：`skills/README_SKILLS.md`
2. **运行演示**：`python3 demo_two_skills_workflow.py`
3. **查看示例**：测试脚本中的示例代码
4. **联系开发**：提供错误信息和复现步骤

## 🎓 学习资源

- PyMuPDF 文档：https://pymupdf.readthedocs.io/
- 项目开发总结：`skills/CREATION_SUMMARY.md`
- 完整 API 文档：`skills/README_SKILLS.md`

---

**版本**: 1.0
**更新时间**: 2026-02-02
**维护者**: 项目开发团队
