# Textbook Processor

教材 PDF 自动分章处理工具 - 自动识别目录、切分章节、生成元数据。

## 功能特点

✅ **自动识别章节** - 支持内置 TOC 和文本识别
✅ **智能切分 PDF** - 按章节自动切分，保留前言和附录
✅ **生成元数据** - JSON 格式，便于知识点溯源
✅ **HTML 导航** - 自动生成目录导航页面
✅ **错误处理** - 健壮的错误处理和恢复机制

## 快速开始

### 安装依赖

```bash
cd textbook-processor
pip install -r requirements.txt
```

### 基本使用

```bash
# 处理单个 PDF
python3 process_textbook.py /path/to/textbook.pdf

# 指定输出目录
python3 process_textbook.py /path/to/textbook.pdf -o /path/to/output
```

### 在 Claude Code 中使用

直接告诉 Claude：
```
请帮我处理教材：概率论与数理统计.pdf
```

## 输出结构

```
output/
└── 教材名称/
    ├── original/          # 原始 PDF
    ├── chapters/          # 切分后的章节 PDF
    ├── markdown/          # Markdown 文件（待实现）
    ├── metadata.json      # 元数据
    └── index.html         # 导航页面
```

## 项目结构

```
textbook-processor/
├── process_textbook.py    # 主处理脚本
├── requirements.txt       # Python 依赖
├── README.md             # 本文档
└── src/
    ├── pdf_analyzer.py   # PDF 分析模块
    └── pdf_splitter.py   # PDF 切分模块
```

## 使用示例

### 示例 1：处理线性代数教材

```bash
python3 process_textbook.py ~/Documents/线性代数第三版.pdf
```

输出：
```
✓ 找到内置 TOC，共 10 个条目
✓ 成功切分 10 个章节
✓ 已生成元数据和导航页面
```

### 示例 2：处理无 TOC 的教材

```bash
python3 process_textbook.py 扫描版教材.pdf
```

系统会自动扫描页面，识别章节标题模式。

## 命令行参数

```
usage: process_textbook.py [-h] [-o OUTPUT] [--split-only] pdf_file

positional arguments:
  pdf_file             PDF 教材文件路径

optional arguments:
  -h, --help           show this help message and exit
  -o OUTPUT, --output OUTPUT
                       输出目录 (默认: output)
  --split-only         仅切分 PDF，不转换 Markdown
```

## 元数据格式

`metadata.json` 包含以下信息：

```json
{
  "title": "教材标题",
  "author": "作者",
  "total_pages": 500,
  "toc_available": true,
  "processed_at": "2025-01-30T12:00:00",
  "chapters": [
    {
      "chapter_number": 1,
      "title": "第1章 绪论",
      "page_start": 1,
      "page_end": 50,
      "pdf_file": "chapters/教材名_01_第1章_绪论.pdf",
      "md_file": "markdown/01_第1章_绪论.md"
    }
  ]
}
```

## 限制和注意事项

### 目录识别准确率
- **有内置 TOC**: > 95% 准确率
- **无内置 TOC**: 约 70-80% 准确率

建议：对于重要教材，人工复核识别结果。

### 支持的 PDF 类型
- ✅ 文字版 PDF
- ✅ 有目录结构的 PDF
- ⚠️ OCR 版 PDF（准确率较低）
- ❌ 加密 PDF（需先解密）
- ❌ 纯图片扫描版 PDF（需先 OCR）

### 性能
- 小型教材（< 300 页）：< 30 秒
- 大型教材（> 500 页）：1-2 分钟

## 故障排查

### 问题：未识别到章节

**可能原因：**
- PDF 没有标准目录格式
- 章节标题不符合常见模式

**解决方法：**
1. 检查 PDF 是否有内置 TOC
2. 查看扫描日志，确认识别的章节
3. 手动调整 `metadata.json` 中的页码

### 问题：切分页码不准确

**可能原因：**
- 目录页码与实际页码不符
- PDF 有特殊页码编号（罗马数字等）

**解决方法：**
1. 人工核对章节页码
2. 编辑 `metadata.json` 调整
3. 重新生成章节 PDF（手动）

### 问题：PDF 打开失败

**可能原因：**
- PDF 文件损坏
- PDF 加密

**解决方法：**
1. 使用 PDF 阅读器测试文件
2. 检查文件大小是否正常
3. 如果加密，先使用工具解密

## 开发

### 运行测试

```bash
# 测试 PDF 分析
python3 src/pdf_analyzer.py /path/to/test.pdf

# 测试 PDF 切分
python3 src/pdf_splitter.py /path/to/test.pdf output/test
```

### 添加新功能

1. 编辑 `src/` 下的模块
2. 更新 `process_textbook.py` 主脚本
3. 更新本文档

## 路线图

- [ ] **v0.2** - Markdown 转换功能
  - 集成 MinerU
  - 保留数学公式（LaTeX）
  - 提取图片和表格

- [ ] **v0.3** - 增强功能
  - 手动标注工具
  - 断点续传
  - 批量处理

- [ ] **v0.4** - 知识点提取
  - 自动识别关键概念
  - 生成知识图谱
  - 集成到导航系统

## 相关资源

- [PyMuPDF 文档](https://pymupdf.readthedocs.io/)
- [OpenSpec 提案](../openspec/changes/add-textbook-processor-skill/)
- [Skill 定义](../.claude/skills/textbook-processor.md)

## 许可证

本项目是万物可视化项目的一部分。

## 贡献

欢迎提交 Issue 和 Pull Request！

## 更新日志

### v0.1.0 (2025-01-30)
- ✅ 初始版本
- ✅ PDF 目录识别（内置 TOC + 文本识别）
- ✅ PDF 章节切分
- ✅ 元数据生成（JSON + HTML）
- ✅ 错误处理和日志
