# 📖 PDF 章节分割工具 - 快速参考

## 🚀 30秒快速上手

```bash
# 1. 安装依赖
pip install pymupdf mineru

# 2. 运行（扫描版 PDF）
python pdf_chapter_splitter.py 书.pdf --ocr -o output

# 3. 查看结果
ls output/
# 01_第一章xxx.pdf  02_第二章xxx.pdf  ...  metadata.json
```

## 📋 主要功能

| 功能 | 命令 |
|------|------|
| OCR 识别章节 | `python pdf_chapter_splitter.py file.pdf --ocr` |
| 从目录提取 | `python pdf_chapter_splitter.py file.pdf` |
| 指定输出目录 | `python pdf_chapter_splitter.py file.pdf -o output` |
| 选择后端 | `python pdf_chapter_splitter.py file.pdf --ocr --backend torch` |

## 🔧 常用选项

```
--ocr           使用 OCR 识别（扫描版 PDF 必需）
--backend MODE  选择后端: torch (准确) 或 pipeline (快速)
-o OUTPUT       输出目录（默认: output/chapters）
```

## 📁 输出结构

```
output/
├── 01_第一章xxx.pdf
├── 02_第二章xxx.pdf
├── ...
└── metadata.json    # 包含所有章节的元数据
```

## 💡 使用技巧

### 技巧 1: Python API

```python
from pdf_chapter_splitter import PDFChapterSplitter

splitter = PDFChapterSplitter(use_ocr=True)

# 识别章节
chapters = splitter.detect_chapters_from_ocr("book.pdf")

# 分割 PDF
result = splitter.split_by_chapters("book.pdf", "output", chapters)
```

### 技巧 2: 批量处理

```bash
for pdf in 书籍/*.pdf; do
    python pdf_chapter_splitter.py "$pdf" --ocr -o "output/$(basename $pdf .pdf)"
done
```

### 技巧 3: 只处理特定章节

```python
# 修改章节列表，只保留需要的章节
chapters = [ch for ch in all_chapters if ch['chapter_number'] <= 5]
```

## ⚠️ 注意事项

1. **扫描版 PDF** 必须使用 `--ocr` 参数
2. **OCR 需要时间**，大文件可能需要几分钟
3. **内存需求**: 建议至少 4GB RAM
4. **磁盘空间**: 输出文件大约等于原文件大小

## 🐛 故障排查

| 问题 | 解决方案 |
|------|---------|
| ImportError: No module named 'mineru' | `pip install mineru` |
| OCR 识别不准确 | 尝试 `--backend torch` |
| 内存不足 | 关闭其他程序或使用服务器 |
| 依赖冲突 | 使用虚拟环境 `python -m venv venv` |

## 📚 完整文档

详细文档请参考: `README_pdf_splitter.md`

## 🎯 典型场景

### 教材分割

```bash
python pdf_chapter_splitter.py "概率论与数理统计.pdf" --ocr -o "数学教材分章"
```

### 技术手册分割

```bash
python pdf_chapter_splitter.py "技术手册.pdf" -o "技术文档分章"
```

---

**版本**: v1.0
**平台**: Linux (Ubuntu/CentOS/Debian)
**更新**: 2026-01-30
