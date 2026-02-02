# Textbook Processor - 章节识别方案总结

## 概述

本项目提供多种 PDF 教材章节识别和处理方案，适用于不同类型的 PDF 文件。

## 方案对比

### 方案 1: 基于嵌入 TOC (pdf_analyzer.py) ✅

**适用场景**: PDF 文件包含嵌入式目录

**优点**:
- ✅ 无需额外依赖
- ✅ 处理速度快
- ✅ 准确率高（使用 PDF 原始 TOC）

**限制**:
- ⚠️  依赖 PDF 内置目录质量
- ⚠️  对于扫描版 PDF 效果有限

**使用方法**:
```bash
python3 process_textbook.py "textbook.pdf" --split-only
```

**示例结果**:
```
检测到 10 个章节:
1. 封面 (第 1 页)
2. 书名 (第 2 页)
3. 版权页 (第 3 页)
4. 第五版前言 (第 4-5 页)
5. 正文 (第 16-524 页)  ← 所有实际章节都在这里
...
```

---

### 方案 2: 基于 MinerU OCR (mineru_chapter_detector.py) ⏳

**适用场景**: 扫描版 PDF、无文本层的 PDF

**优点**:
- ✅ 可处理扫描版 PDF
- ✅ 自动识别章节结构
- ✅ 支持复杂布局

**限制**:
- ⚠️  需要下载约 2GB OCR 模型
- ⚠️  首次使用需要网络连接
- ⚠️  处理速度较慢

**使用方法**:

```bash
# 1. 首次使用需要下载模型
source .venv/bin/activate
python3 -c "
from mineru.backend.pipeline.pipeline_analyze import auto_download_and_get_model_root_path
from mineru.utils.model_path import ModelPath

# 下载 OCR 模型
path = auto_download_and_get_model_root_path(ModelPath.yolo_v8_mfd)
print(f'模型已下载到: {path}')
"

# 2. 使用 OCR 检测章节
python3 src/mineru_chapter_detector.py "scanned_textbook.pdf"
```

**详细说明**: 参见 [OCR_MODELS.md](OCR_MODELS.md)

---

### 方案 3: 手动配置 (manual_chapters.py) 📝

**适用场景**: 已知章节页码、需要精确控制

**优点**:
- ✅ 完全可控
- ✅ 无需网络
- ✅ 速度快

**限制**:
- ⚠️  需要手动确定页码
- ⚠️  不适合频繁更新的文档

**使用方法**:

```bash
# 1. 创建示例配置
python3 src/manual_chapters.py --create-sample

# 2. 编辑生成的 manual_chapters.json
# 3. 验证配置
python3 src/manual_chapters.py --validate manual_chapters.json

# 4. 交互式创建
python3 src/manual_chapters.py --interactive
```

**配置示例**:
```json
{
  "title": "概率论与数理统计第五版",
  "chapters": [
    {
      "number": 1,
      "title": "第一章 概率论的基本概念",
      "page_start": 16,
      "page_end": 50,
      "level": 1
    },
    {
      "number": 2,
      "title": "第二章 随机变量及其分布",
      "page_start": 51,
      "page_end": 100,
      "level": 1
    }
  ]
}
```

---

### 方案 4: 基于文本分析 (text_based_chapter_detector.py) 🔍

**适用场景**: 有文本层的 PDF、嵌入 TOC 不完整

**优点**:
- ✅ 无需模型下载
- ✅ 可识别正文章章标题
- ✅ 速度较快

**限制**:
- ⚠️  仅适用于有文本层的 PDF
- ⚠️  可能误识别其他标题

**使用方法**:
```bash
python3 src/text_based_chapter_detector.py "textbook.pdf"
```

**识别模式**:
```python
# 支持的章节标题格式:
- 第一章 xxx
- Chapter 1: xxx
- 1. xxx
- 一、xxx
```

---

## 推荐工作流程

### 情况 A: 有嵌入 TOC 的文本 PDF

```bash
# 直接使用嵌入 TOC
python3 process_textbook.py "textbook.pdf" \
  --split-only \
  --convert-md
```

### 情况 B: 扫描版 PDF (有网络连接)

```bash
# 1. 下载 OCR 模型（首次）
python3 -c "from mineru.backend.pipeline.pipeline_analyze import auto_download_and_get_model_root_path; print('下载中...')"

# 2. 使用 OCR 检测章节
python3 src/mineru_chapter_detector.py "scanned_textbook.pdf"

# 3. 处理 PDF
python3 process_textbook.py "scanned_textbook.pdf" --convert-md
```

### 情况 C: 扫描版 PDF (无网络连接)

```bash
# 1. 手动创建章节配置
python3 src/manual_chapters.py --interactive

# 2. 使用配置文件处理
# TODO: 需要在 process_textbook.py 中添加 --config 参数支持
```

### 情况 D: 嵌入 TOC 不完整但有文本层

```bash
# 使用文本分析补充
python3 src/text_based_chapter_detector.py "textbook.pdf"
```

---

## 当前项目状态

### ✅ 已完成

- [x] PDF 基础分析 (pdf_analyzer.py)
- [x] PDF 章节切分 (pdf_splitter.py)
- [x] MinerU 集成 (mineru_converter.py)
- [x] 文本章节检测 (text_based_chapter_detector.py)
- [x] 手动配置工具 (manual_chapters.py)
- [x] Markdown 转换 (MinerU)

### ⏳ 待完成

- [ ] OCR 模型下载 (需要网络连接)
- [ ] 整合手动配置到主流程
- [ ] 支持 config 参数的章节处理
- [ ] 章节检测结果的合并/去重

---

## 快速开始

### 安装依赖

```bash
# 创建虚拟环境
python3 -m venv .venv
source .venv/bin/activate

# 安装依赖
pip install -r requirements.txt
```

### 基础使用

```bash
# 仅切分 PDF（使用嵌入 TOC）
python3 process_textbook.py "textbook.pdf" --split-only

# 切分并转换为 Markdown
python3 process_textbook.py "textbook.pdf" --convert-md

# 使用 GPU 加速转换（Apple Silicon）
python3 process_textbook.py "textbook.pdf" \
  --convert-md \
  --backend hybrid-auto-engine
```

---

## 文件说明

| 文件 | 功能 | 状态 |
|------|------|------|
| `process_textbook.py` | 主处理脚本 | ✅ 可用 |
| `src/pdf_analyzer.py` | PDF 分析器 | ✅ 可用 |
| `src/pdf_splitter.py` | PDF 切分器 | ✅ 可用 |
| `src/mineru_converter.py` | MinerU 转换器 | ✅ 可用 |
| `src/mineru_chapter_detector.py` | MinerU 章节检测 | ⏳ 需要模型 |
| `src/text_based_chapter_detector.py` | 文本章节检测 | ✅ 可用 |
| `src/manual_chapters.py` | 手动配置工具 | ✅ 可用 |

---

## 故障排除

### 问题 1: MinerU 下载模型超时

**症状**: `ConnectTimeoutError: HTTPSConnectionPool(host='huggingface.co')`

**解决方案**:
1. 检查网络连接
2. 使用 VPN 或镜像站
3. 先下载模型到本地，再离线使用

详见 [OCR_MODELS.md](OCR_MODELS.md)

### 问题 2: 检测不到章节

**可能原因**:
- PDF 是扫描版（无文本层）
- PDF 没有 TOC
- 章节标题格式不被识别

**解决方案**:
- 使用 OCR 检测（方案 2）
- 手动配置（方案 3）
- 检查 PDF 是否有文本层

### 问题 3: 架构不兼容

**症状**: `OSError: tried: 'x86_64', need 'arm64'`

**解决方案**:
```bash
# 使用虚拟环境（已自动处理）
source .venv/bin/activate
```

---

## 下一步

1. **短期**: 完善手动配置集成
2. **中期**: 优化章节检测准确率
3. **长期**: 支持更多 PDF 格式和布局

---

## 贡献

欢迎提交问题和改进建议！

---

**最后更新**: 2026-01-30
**版本**: 0.2.0
