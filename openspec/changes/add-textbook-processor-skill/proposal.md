# Proposal: Add Textbook Processor Skill

## Why

当前项目需要处理大量教材 PDF 内容，但缺乏自动化工具来：
1. 识别教材目录结构
2. 按章节自动切分 PDF
3. 将 PDF 转换为 Markdown 格式以便知识点溯源

手工处理这些任务效率低下，且容易出错。需要一个专门的 skill 来自动化这些流程。

## What Changes

- **新增** Textbook Processor Skill
  - 自动识别 PDF 目录（TOC）结构
  - 根据章节页码范围切分 PDF
  - 集成 MinerU 进行 PDF 到 Markdown 的转换
  - 生成结构化的元数据和索引

- **支持功能**
  - 处理文字版和 OCR 版 PDF
  - 中英文教材支持
  - 章节级别和子章节级别切分
  - 生成知识点溯源所需的元数据

## Impact

- **Affected specs:**
  - 新增 `textbook-processor` capability

- **Affected code:**
  - `.claude/skills/textbook-processor.md` (新增)
  - 可能需要后端支持 PDF 处理服务
  - 需要集成 MinerU 工具

- **Dependencies:**
  - PyMuPDF (fitz) - PDF 读取和切分
  - MinerU - PDF 到 Markdown 转换
  - pdfplumber - 文本提取（可选）

- **User benefits:**
  - 大幅提升教材处理效率
  - 便于后续知识点的溯源和导航
  - 为知识图谱构建提供结构化数据
