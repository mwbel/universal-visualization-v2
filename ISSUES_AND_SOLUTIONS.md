# PDF 章节分割工具 - 问题分析与解决方案

## 问题 1: 章节结束页码错误

### 问题描述
当前工具使用简单的算法计算章节结束页码：
```python
ch['page_end'] = chapters[i + 1]['page_start'] - 1
```

这个算法的假设：**下一章的起始页 - 1 = 当前章的结束页**

**但是这个假设是错误的！**

### 为什么错误？

从目录图片可以看到：

```
第一章 概率论的基本概念 ........................... 16
  1.1 随机试验与样本空间 .............................. 16
  1.2 样本空间与事件 ............................... 18
  1.3 频率与概率 .................................... 22
  1.4 等可能概型（古典概型）.......................... 28
  1.5 条件概率 .................................... 34
  1.6 独立性 ..................................... 40
  习题一 .......................................... 44

第二章 随机变量及其分布 ............................ 47
```

**分析**：
- 第一章从第16页开始（PDF页码）
- 第二章从第47页开始（正文页码）→ 转换为PDF页码：47 + 15 = 62
- 第一章的"习题一"在第44页（正文页码）→ 转换为PDF页码：44 + 15 = 59

**实际问题**：
- 当前算法认为第一章在第76页结束（第2章PDF起始页77-1）
- 但实际第一章在第59页结束（习题一的位置）
- 第60-76页之间是空白页、章节小结等内容

### 正确的算法应该是

根据你的原始需求："根据每一章的标题后面的页码以及上一章最后一节的页码来确定页码范围"

**步骤**：
1. 找到每一章的所有小节（包括习题）
2. 找到该章最后一节的页码
3. 使用最后一节的页码作为章节结束页

**示例**：
```
第一章：
  - 1.1 随机试验（第16页）
  - 1.2 样本空间（第18页）
  - ...
  - 习题一（第44页）← 这是第一章的最后一节

所以第一章的页码范围：第16-59页（PDF页码）
```

---

## 问题 2: 应该使用 MinerU OCR 而不是手动提取

### 问题描述
当前实现有3种获取章节信息的方式：
1. ❌ **手动从图片提取**（我之前的错误做法）
2. ✅ **从 PDF 内置目录提取**（`detect_chapters_from_toc()`）
3. ⚠️ **MinerU OCR**（`detect_chapters_from_ocr()` - 本地未测试）

**正确的做法应该是**：
- **对于扫描版 PDF**：使用 MinerU OCR 识别整个 PDF
- 从 OCR 结果中提取章节信息（包括所有小节）
- 根据最后一节的页码确定章节结束

### 为什么必须用 MinerU OCR？

1. **扫描版 PDF 没有内置目录** - `detect_chapters_from_toc()` 无法使用
2. **需要识别所有小节** - 找到最后一节才能确定章节结束
3. **准确提取页码** - OCR 可以识别每个小节的页码

### 本地 macOS ARM64 依赖问题

**是的，这正是问题所在！**

```
错误信息：
ImportError: dlopen(_cffi_backend.cpython-311-darwin.so, 0x0002):
  mach-o file, but is an incompatible architecture
  (have 'x86_64', need 'arm64e' or 'arm64')
```

**原因**：
- 你的 Mac 使用 ARM64 架构（Apple Silicon，M1/M2/M3）
- MinerU 的某些依赖包（如 pypdfium2, cffi）只提供 x86_64 版本
- ARM64 和 x86_64 是不同的CPU指令集，不兼容

**解决方案**：

#### 方案 A: 在 Linux 服务器上运行（推荐）
```bash
# Linux 服务器通常是 x86_64 架构
# MinerU 可以正常工作
ssh user@linux-server
python pdf_chapter_splitter.py book.pdf --ocr -o output
```

#### 方案 B: 使用 Docker
```dockerfile
FROM python:3.11-slim
# x86_64 环境，MinerU 可以正常工作
RUN pip install mineru pymupdf
```

#### 方案 C: 等待 MinerU 支持 ARM64
- 关注 MinerU 项目更新
- 或提交 issue 请求 ARM64 支持

---

## 改进的实现方案

### 修正后的算法

```python
def detect_chapters_with_sections(pdf_path: str) -> List[Dict]:
    """
    使用 MinerU OCR 识别章节（包括小节）
    """
    # 1. OCR 处理
    ocr_result = mineru_ocr(pdf_path)

    # 2. 解析章节和小节
    chapters = []
    current_chapter = None

    for item in ocr_result:
        # 匹配章节标题
        if match_chapter_title(item):
            if current_chapter:
                chapters.append(current_chapter)
            current_chapter = {
                'title': item.title,
                'page_start': item.page,
                'sections': []
            }

        # 匹配小节标题
        elif match_section_title(item):
            if current_chapter:
                current_chapter['sections'].append({
                    'title': item.title,
                    'page': item.page
                })

    # 添加最后一章
    if current_chapter:
        chapters.append(current_chapter)

    # 3. 根据最后一节计算结束页码
    for ch in chapters:
        if ch['sections']:
            last_section = ch['sections'][-1]
            ch['page_end'] = last_section['page']  # 使用最后一节的页码
        else:
            # 如果没有小节，使用下一章起始 - 1
            ch['page_end'] = next_chapter_start - 1

    return chapters
```

### 实际例子

```
输入（OCR识别的目录）：
第一章 概率论的基本概念 (第16页)
  1.1 随机试验与样本空间 (第16页)
  1.2 样本空间与事件 (第18页)
  1.3 频率与概率 (第22页)
  1.4 等可能概型 (第28页)
  1.5 条件概率 (第34页)
  1.6 独立性 (第40页)
  习题一 (第44页)

输出（章节数据）：
{
  'title': '第一章 概率论的基本概念',
  'page_start': 16,
  'page_end': 59,  # 习题一的页码（正文44 + 偏移15）
  'sections': [...]
}
```

---

## 下一步行动

### 短期（本地测试）
1. ✅ 使用 Linux 服务器测试 MinerU OCR
2. ✅ 改进章节识别算法（包含小节）
3. ✅ 修正页码计算逻辑

### 长期（生产部署）
1. 在 Linux 服务器上部署完整工具
2. 使用 Docker 容器化部署
3. 添加 Web API 接口

### 临时方案（本地）
如果不能立即使用 Linux 服务器：
1. 手动提取目录信息（如之前所做）
2. 修正 JSON 文件中的页码
3. 使用修正后的数据进行分割

---

## 总结

**问题 1 - 页码错误**：
- ❌ 旧算法：下一章起始 - 1
- ✅ 新算法：该章最后一节的页码

**问题 2 - OCR 方法**：
- ❌ 错误：手动从图片提取
- ✅ 正确：使用 MinerU OCR 识别
- ⚠️ 障碍：本地 macOS ARM64 依赖问题
- 🎯 解决：部署到 Linux x86_64 服务器

**核心问题**：你的 Mac 是 ARM64 架构，MinerU 的依赖包不兼容。需要在 Linux 服务器上才能完整使用 OCR 功能。

---

**创建时间**: 2026-01-30
**状态**: 待解决（需要 Linux 服务器环境）
