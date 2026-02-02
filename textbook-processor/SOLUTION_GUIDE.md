# 教材处理 - 章节检测解决方案

## 📊 当前状态分析

### 网络环境
- ❌ 无法访问 HuggingFace (huggingface.co)
- ❌ HuggingFace 镜像连接不稳定
- ❌ 无代理软件运行

### PDF 文档分析
**文件**: 概率论与数理统计第五版盛骤-完整版.pdf
- **总页数**: 525 页
- **类型**: 扫描版 PDF（无文本层）
- **嵌入式目录**: 仅包含高层级结构（封面、书名、正文等）
- **实际章节**: 第 1-8 章分布在第 16-524 页

### 可用方案对比

| 方案 | 优点 | 缺点 | 可行性 |
|------|------|------|--------|
| **OCR 自动检测** | 全自动，精确识别章节标题 | 需要下载 350MB 模型 | ⚠️ 网络限制 |
| **手动配置章节** | ✅ 无需网络，立即可用 | 需要查看目录手动输入 | ✅ **推荐** |
| **PDF 嵌入式 TOC** | 已经实现，快速 | 章节粒度太粗 | ✅ 已可用 |
| **文本提取检测** | 速度快 | 扫描版 PDF 无文本 | ❌ 不适用 |

---

## ✅ 推荐方案：手动配置章节

### 方案优势
1. ✅ **无需网络连接**
2. ✅ **无需下载模型**
3. ✅ **立即可用**
4. ✅ **精确控制**
5. ✅ **配置可复用**

### 操作步骤

#### 第 1 步：创建章节配置

```bash
cd /Users/Min369/Documents/同步空间/Manju/Projects/AlVisualization/textbook-processor
source .venv/bin/activate
python3 src/manual_chapters.py --create-sample
```

这会创建 `manual_chapters.json` 示例文件。

#### 第 2 步：编辑配置文件

根据教材的实际目录，编辑 `manual_chapters.json`：

```json
{
  "pdf_name": "概率论与数理统计第五版盛骤-完整版.pdf",
  "chapters": [
    {
      "id": "01",
      "title": "概率论的基本概念",
      "page_range": [16, 60],
      "level": 1
    },
    {
      "id": "02",
      "title": "随机变量及其分布",
      "page_range": [61, 120],
      "level": 1
    },
    {
      "id": "03",
      "title": "多维随机变量及其分布",
      "page_range": [121, 180],
      "level": 1
    },
    {
      "id": "04",
      "title": "随机变量的数字特征",
      "page_range": [181, 230],
      "level": 1
    },
    {
      "id": "05",
      "title": "大数定律与中心极限定理",
      "page_range": [231, 270],
      "level": 1
    },
    {
      "id": "06",
      "title": "样本及抽样分布",
      "page_range": [271, 310],
      "level": 1
    },
    {
      "id": "07",
      "title": "参数估计",
      "page_range": [311, 370],
      "level": 1
    },
    {
      "id": "08",
      "title": "假设检验",
      "page_range": [371, 430],
      "level": 1
    }
  ]
}
```

> **如何获取准确页码？**
> 1. 打开 PDF 文件
> 2. 查看目录页（通常在前几页）
> 3. 记录每一章的起始页码
> 4. 确定章节的结束页码（下一章开始前）
>
> **快速方法**：使用 Preview.app 或 Adobe Acrobat Reader 的侧边栏目录

#### 第 3 步：验证配置

```bash
python3 src/manual_chapters.py --validate manual_chapters.json
```

#### 第 4 步：运行处理

```bash
python3 process_textbook.py \
    "概率论与数理统计第五版盛骤-完整版.pdf" \
    --use-manual-config \
    --config-file manual_chapters.json
```

---

## 🎯 交互式配置（更简单）

如果您不喜欢手动编辑 JSON 文件，可以使用交互式工具：

```bash
source .venv/bin/activate
python3 src/manual_chapters.py --interactive
```

按照提示输入：
1. 章节编号（如：01）
2. 章节标题（如：概率论的基本概念）
3. 起始页码（如：16）
4. 结束页码（如：60）
5. 重复添加所有章节

完成后，配置会自动保存到 `manual_chapters.json`。

---

## 📋 完整示例：概率论与数理统计

假设教材有以下章节结构：

```
第一章  概率论的基本概念      (16-60页)
第二章  随机变量及其分布      (61-120页)
第三章  多维随机变量及其分布  (121-180页)
第四章  随机变量的数字特征    (181-230页)
第五章  大数定律与中心极限定理 (231-270页)
第六章  样本及抽样分布        (271-310页)
第七章  参数估计              (311-370页)
第八章  假设检验              (371-430页)
```

对应的配置文件：

```json
{
  "pdf_name": "概率论与数理统计第五版盛骤-完整版.pdf",
  "total_pages": 525,
  "chapters": [
    {"id": "01", "title": "概率论的基本概念", "page_range": [16, 60], "level": 1},
    {"id": "02", "title": "随机变量及其分布", "page_range": [61, 120], "level": 1},
    {"id": "03", "title": "多维随机变量及其分布", "page_range": [121, 180], "level": 1},
    {"id": "04", "title": "随机变量的数字特征", "page_range": [181, 230], "level": 1},
    {"id": "05", "title": "大数定律与中心极限定理", "page_range": [231, 270], "level": 1},
    {"id": "06", "title": "样本及抽样分布", "page_range": [271, 310], "level": 1},
    {"id": "07", "title": "参数估计", "page_range": [311, 370], "level": 1},
    {"id": "08", "title": "假设检验", "page_range": [371, 430], "level": 1}
  ]
}
```

---

## 🔧 其他备选方案

### 方案 A：使用现有的嵌入式 TOC

如果不需要细粒度的章节划分，可以使用现有的嵌入式目录：

```bash
python3 process_textbook.py \
    "概率论与数理统计第五版盛骤-完整版.pdf" \
    --split-only
```

这会按照 PDF 的嵌入式目录分割，得到：
- 封面（1-3 页）
- 书名（4-15 页）
- 正文（16-524 页）
- 版权、目录等（525 页）

### 方案 B：稍后再尝试 OCR

如果将来有稳定的网络或代理环境，可以重新尝试 OCR 方案：

**方式 1：使用代理**
```bash
# 1. 启动代理软件（Clash/V2Ray）
# 2. 运行检测脚本
./run_ocr_detection.sh
```

**方式 2：使用镜像**
```bash
export HF_ENDPOINT=https://hf-mirror.com
source .venv/bin/activate
python3 src/mineru_chapter_detector.py "概率论与数理统计第五版盛骤-完整版.pdf"
```

---

## 📂 输出结构

使用手动配置后，处理流程会产生以下结构：

```
output/
└── 概率论与数理统计第五版盛骤-完整版/
    ├── chapters/
    │   ├── 概率论与数理统计第五版盛骤-完整版_01_概率论的基本概念.pdf
    │   ├── 概率论与数理统计第五版盛骤-完整版_02_随机变量及其分布.pdf
    │   ├── ...
    │   └── 概率论与数理统计第五版盛骤-完整版_08_假设检验.pdf
    └── markdown/
        ├── 概率论与数理统计第五版盛骤-完整版_01.md
        ├── 概率论与数理统计第五版盛骤-完整版_02.md
        ├── ...
        └── 概率论与数理统计第五版盛骤-完整版_08.md
```

---

## ❓ 常见问题

### Q1: 手动配置很麻烦，有没有更快的方法？

**A**: 使用交互式工具会稍微快一些：
```bash
python3 src/manual_chapters.py --interactive
```

但手动输入章节信息确实需要一些时间。这是在无法使用 OCR 的情况下的最佳替代方案。

### Q2: 配置文件中的页码是从 0 开始还是从 1 开始？

**A**: 从 1 开始，与 PDF 阅读器中显示的页码一致。

### Q3: 如果配置错误怎么办？

**A**: 使用验证命令检查：
```bash
python3 src/manual_chapters.py --validate manual_chapters.json
```

### Q4: 能否只处理部分章节？

**A**: 可以，在配置文件中只添加需要处理的章节即可。

### Q5: 如何确保页码准确？

**A**:
1. 在 PDF 阅读器中打开文件
2. 查看侧边栏的目录（如果有）
3. 跳转到每章的起始位置
4. 记录页码
5. 交叉验证：下一章起始页 - 1 = 上一章结束页

---

## 📝 总结

### 当前最佳方案：手动配置
- ✅ 无需网络
- ✅ 立即可用
- ✅ 完全可控
- ⏰ 预计耗时：10-15 分钟（查看目录 + 输入配置）

### 未来可选方案：OCR 自动检测
- ⚠️ 需要稳定网络或代理
- ⏰ 首次运行：下载模型 + 处理时间
- 🎯 后续处理：全自动

### 下一步操作

```bash
# 1. 创建示例配置
python3 src/manual_chapters.py --create-sample

# 2. 编辑配置文件（根据实际目录）
# 使用文本编辑器打开 manual_chapters.json

# 3. 验证配置
python3 src/manual_chapters.py --validate manual_chapters.json

# 4. 运行处理
python3 process_textbook.py \
    "概率论与数理统计第五版盛骤-完整版.pdf" \
    --use-manual-config \
    --config-file manual_chapters.json
```

---

**创建时间**: 2026-01-30
**状态**: ✅ 推荐使用手动配置方案
**原因**: OCR 模型无法下载（网络限制）
