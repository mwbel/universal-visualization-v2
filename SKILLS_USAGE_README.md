# 📚 PDF 教材处理功能 - 快速开始

## 给团队成员的 3 步快速指南

### 第 1 步：安装依赖（1 分钟）

```bash
# 在项目根目录执行
pip3 install -r requirements-skills.txt
```

或者手动安装：
```bash
pip3 install pymupdf requests
```

### 第 2 步：运行示例（2 分钟）

```bash
# 方式 1: 交互式演示
python3 examples/quick_start.py

# 方式 2: 完整工作流演示
python3 demo_two_skills_workflow.py
```

### 第 3 步：在你的代码中使用

```python
from skills import recognize_pdf_toc

# 识别目录
result = await recognize_pdf_toc("your_book.pdf")
print(f"识别到 {result['total_chapters']} 章")
```

## 📖 详细文档

- **团队使用指南**: `skills/TEAM_USAGE_GUIDE.md`
- **完整使用文档**: `skills/README_SKILLS.md`
- **开发总结**: `skills/CREATION_SUMMARY.md`

## 🎯 核心功能

### Skill 1: 目录识别
- ✅ 从 PDF 提取目录结构
- ✅ 计算每章的准确页码范围
- ✅ 导出为 Markdown 文件

### Skill 2: PDF 分割
- ✅ 按章节分割 PDF
- ✅ 调用 MinerU API 转换为 Markdown（服务器部署后）
- ✅ 生成处理汇总报告

## 💡 常见使用场景

### 场景 1: 我想知道一本书有哪些章节

```python
from skills import recognize_pdf_toc

result = await recognize_pdf_toc("book.pdf")
for ch in result['chapters']:
    print(f"第{ch.number}章: {ch.title} ({ch.page_start}-{ch.page_end}页)")
```

### 场景 2: 我想把一本书按章节分割

```python
from skills import recognize_pdf_toc, split_and_convert_pdf

# 识别目录
toc_result = await recognize_pdf_toc("book.pdf")

# 分割 PDF
split_result = await split_and_convert_pdf(
    "book.pdf",
    toc_result['chapters'],
    output_dir="output/chapters"
)
```

### 场景 3: 我想批量处理多本书

```python
from skills import recognize_pdf_toc

books = ["book1.pdf", "book2.pdf", "book3.pdf"]

for book in books:
    result = await recognize_pdf_toc(book)
    print(f"{book}: {result['total_chapters']} 章")
```

## 🔧 配置说明

### 默认配置（开箱即用）
- 使用本地 PyMuPDF 处理 PDF
- 不需要服务器
- 适合有文本层的 PDF

### 服务器配置（完整功能）
```bash
# 设置环境变量
export MINERU_API_URL="http://your-server:8000"
```

启用后可使用 OCR 功能，处理扫描版 PDF。

## ❓ 遇到问题？

### 1. 导入错误
```bash
# 确保在项目根目录
cd /path/to/AlVisualization

# 测试导入
python3 -c "from skills import recognize_pdf_toc; print('OK')"
```

### 2. 依赖未安装
```bash
# 重新安装
pip3 install --upgrade pymupdf requests
```

### 3. 文件路径问题
```python
# 使用绝对路径
from pathlib import Path

pdf_path = str(Path("your_book.pdf").resolve())
result = await recognize_pdf_toc(pdf_path)
```

## 📞 获取帮助

1. 查看 `skills/TEAM_USAGE_GUIDE.md`
2. 运行 `python3 examples/quick_start.py` 查看示例
3. 查看代码注释：所有函数都有详细文档

## 🚀 立即开始

```bash
# 1. 安装依赖
pip3 install -r requirements-skills.txt

# 2. 运行示例
python3 examples/quick_start.py

# 3. 查看输出
ls output/
```

就是这么简单！

---

**版本**: 1.0
**更新**: 2026-02-02
**状态**: ✅ 可用
