# PDF 书籍按章节分割工具 - Linux 服务器部署指南

## 📋 功能特性

- ✅ 支持扫描版 PDF（使用 MinerU OCR）
- ✅ 支持普通 PDF（从内置目录提取）
- ✅ 自动识别章节结构
- ✅ 按章节准确分割 PDF
- ✅ 生成结构化元数据（JSON）
- ✅ 适用于 Linux 服务器

## 🚀 快速开始

### 1. 环境要求

**Linux 服务器**（推荐配置）：
- Ubuntu 20.04+ / CentOS 8+ / Debian 11+
- Python 3.8+
- 4GB+ RAM
- 10GB+ 磁盘空间

### 2. 安装依赖

```bash
# 安装 Python 依赖
pip install pymupdf mineru

# 如果使用 torch 后端（推荐，准确率更高）
pip install torch torchvision --index-url https://download.pytorch.org/whl/cpu

# 如果使用 pipeline 后端（更快，但需要额外配置）
pip install paddlepaddle
```

### 3. 使用方法

#### 方法 1: 自动 OCR 识别章节（扫描版 PDF）

```bash
python pdf_chapter_splitter.py 书籍/概率论与数理统计第五版盛骤-完整版.pdf \
    --ocr \
    --backend torch \
    -o output/chapters
```

#### 方法 2: 从目录提取章节（有内置目录的 PDF）

```bash
python pdf_chapter_splitter.py 书籍/概率论与数理统计第五版盛骤-完整版.pdf \
    -o output/chapters
```

### 4. 输出结果

```
output/chapters/
├── 01_第一章 概率论的基本概念.pdf
├── 02_第二章 随机变量及其分布.pdf
├── 03_第三章 多维随机变量及其分布.pdf
├── ...
└── metadata.json  # 元数据文件
```

## 📁 metadata.json 格式

```json
{
  "source_pdf": "概率论与数理统计第五版盛骤-完整版.pdf",
  "total_chapters": 10,
  "chapters": [
    {
      "chapter_number": 1,
      "title": "第一章 概率论的基本概念",
      "file": "01_第一章 概率论的基本概念.pdf",
      "page_start": 16,
      "page_end": 76,
      "page_count": 61
    }
  ]
}
```

## 🔧 高级用法

### Python API 调用

```python
from pdf_chapter_splitter import PDFChapterSplitter

# 创建分割器
splitter = PDFChapterSplitter(use_ocr=True, ocr_backend="torch")

# 方式 1: OCR 识别章节
chapters = splitter.detect_chapters_from_ocr("书籍/sample.pdf")

# 方式 2: 从目录提取
chapters = splitter.detect_chapters_from_toc("书籍/sample.pdf")

# 分割 PDF
result = splitter.split_by_chapters(
    "书籍/sample.pdf",
    "output/chapters",
    chapters
)
```

### 批量处理多本书籍

```bash
#!/bin/bash
# batch_split.sh

for pdf in 书籍/*.pdf; do
    echo "处理: $pdf"
    python pdf_chapter_splitter.py "$pdf" --ocr -o "output/$(basename $pdf .pdf)"
done
```

## 🐳 Docker 部署（推荐）

创建 `Dockerfile`:

```dockerfile
FROM python:3.11-slim

RUN apt-get update && apt-get install -y \
    libgl1-mesa-glx \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender-dev \
    libgomp1

WORKDIR /app

COPY requirements.txt .
RUN pip install -r requirements.txt

COPY pdf_chapter_splitter.py .

ENTRYPOINT ["python", "pdf_chapter_splitter.py"]
```

创建 `requirements.txt`:

```
pymupdf>=1.23.0
mineru>=2.7.0
torch>=2.0.0 --index-url https://download.pytorch.org/whl/cpu
```

构建和运行：

```bash
# 构建镜像
docker build -t pdf-splitter .

# 运行容器
docker run --rm \
  -v $(pwd)/书籍:/books \
  -v $(pwd)/output:/output \
  pdf-splitter /books/样本.pdf --ocr -o /output
```

## ⚙️ 性能优化

### 1. 使用 GPU 加速（如果可用）

```python
# 安装 GPU 版本的 PyTorch
pip install torch torchvision --index-url https://download.pytorch.org/whl/cu118
```

### 2. 多进程处理

```python
from multiprocessing import Pool

def process_pdf(pdf_path):
    splitter = PDFChapterSplitter(use_ocr=True)
    return splitter.detect_chapters_from_ocr(pdf_path)

# 并行处理
with Pool(processes=4) as pool:
    results = pool.map(process_pdf, pdf_list)
```

## 🔍 故障排查

### 问题 1: MinerU OCR 失败

```bash
# 检查依赖
python -c "from mineru.cli.common import do_parse; print('OK')"

# 尝试不同后端
python pdf_chapter_splitter.py sample.pdf --ocr --backend pipeline
```

### 问题 2: 内存不足

```bash
# 分割处理大文件
# 可以只处理目录页，然后手动指定章节
```

### 问题 3: OCR 识别不准确

```bash
# 使用 torch 后端（更准确但更慢）
python pdf_chapter_splitter.py sample.pdf --ocr --backend torch
```

## 📊 API 接口（可选）

如果需要 Web API，可以添加 FastAPI:

```python
from fastapi import FastAPI, UploadFile, File
from pdf_chapter_splitter import PDFChapterSplitter

app = FastAPI()

@app.post("/split")
async def split_pdf(
    file: UploadFile = File(...),
    use_ocr: bool = True
):
    # 保存上传的文件
    pdf_path = f"uploads/{file.filename}"
    with open(pdf_path, "wb") as f:
        f.write(await file.read())

    # 处理
    splitter = PDFChapterSplitter(use_ocr=use_ocr)
    chapters = splitter.detect_chapters_from_ocr(pdf_path)
    result = splitter.split_by_chapters(pdf_path, "output", chapters)

    return result
```

## 📝 最佳实践

1. **测试先行**: 先用小文件测试
2. **备份数据**: 处理前备份原始 PDF
3. **验证结果**: 检查生成的章节 PDF 是否正确
4. **日志记录**: 保存处理日志以便调试
5. **资源监控**: 监控 CPU 和内存使用

## 🎯 示例场景

### 场景 1: 单本扫描版教材

```bash
python pdf_chapter_splitter.py \
    "概率论与数理统计.pdf" \
    --ocr \
    -o "概率论_分章"
```

### 场景 2: 批量处理多本书

```python
# batch_process.py
import os
from pdf_chapter_splitter import PDFChapterSplitter

splitter = PDFChapterSplitter(use_ocr=True)

pdf_dir = Path("书籍")
output_dir = Path("output")

for pdf_file in pdf_dir.glob("*.pdf"):
    print(f"处理: {pdf_file.name}")

    # OCR 识别
    chapters = splitter.detect_chapters_from_ocr(str(pdf_file))

    # 分割
    output_subdir = output_dir / pdf_file.stem
    result = splitter.split_by_chapters(
        str(pdf_file),
        str(output_subdir),
        chapters
    )
```

## 📧 技术支持

- MinGuU 文档: https://github.com/opendatalab/MinerU
- PyMuPDF 文档: https://pymupdf.readthedocs.io/
- 问题反馈: 在项目中提 Issue

---

**生成时间**: 2026-01-30
**版本**: v1.0
**适用环境**: Linux 服务器 (Ubuntu/CentOS/Debian)
