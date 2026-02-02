## ADDED Requirements

### Requirement: PDF 目录结构识别

Textbook Processor SHALL 能够自动识别教材 PDF 的目录结构，包括章节标题和对应的页码范围。

#### Scenario: 识别内置 TOC 的教材
- **WHEN** PDF 文件包含内置目录（TOC）
- **THEN** 系统 SHALL 优先使用内置 TOC，准确率 > 95%
- **AND** 提取章节标题、页码范围信息

#### Scenario: 识别无 TOC 的教材
- **WHEN** PDF 文件不包含内置目录
- **THEN** 系统 SHALL 使用正则表达式扫描每一页
- **AND** 识别常见的章节标题模式：
  - `第X章`（中文）
  - `Chapter X`（英文）
  - `X.`（数字编号）
- **AND** 生成目录结构，准确率 > 80%

#### Scenario: 多级目录识别
- **WHEN** 教材包含章、节、小节等多级结构
- **THEN** 系统 SHALL 识别完整的层级关系
- **AND** 生成树状目录结构

### Requirement: PDF 章节切分

Textbook Processor SHALL 根据识别的目录结构，将整本 PDF 按章节切分为独立的 PDF 文件。

#### Scenario: 标准章节切分
- **WHEN** 目录识别完成
- **THEN** 系统 SHALL 根据页码范围切分 PDF
- **AND** 为每个章节创建独立的 PDF 文件
- **AND** 文件命名格式：`{书名}_第{n}章_{标题}.pdf`
- **AND** 切分误差 < 1 页

#### Scenario: 特殊页面处理
- **WHEN** 遇到前言、目录、附录等特殊页面
- **THEN** 系统 SHALL 将它们单独保存
- **AND** 命名为：`00_前言.pdf`、`00_目录.pdf`、`99_附录.pdf`

#### Scenario: 文件组织
- **WHEN** 章节切分完成
- **THEN** 系统 SHALL 将文件保存到结构化目录：
  ```
  processed/{书名}/chapters/
    ├── 00_前言.pdf
    ├── 01_第1章_标题.pdf
    ├── 02_第2章_标题.pdf
    └── 99_附录.pdf
  ```

### Requirement: PDF 到 Markdown 转换

Textbook Processor SHALL 使用 MinerU 将切分后的 PDF 章节转换为 Markdown 格式，保留数学公式、图片和表格。

#### Scenario: 数学公式保留
- **WHEN** PDF 中包含数学公式
- **THEN** 系统 SHALL 将公式转换为 LaTeX 格式
- **AND** 使用 `$` 或 `$$` 包裹公式
- **AND** 公式保留率 > 95%

#### Scenario: 图片和表格保留
- **WHEN** PDF 中包含图片和表格
- **THEN** 系统 SHALL 将图片保存为独立文件
- **AND** 在 Markdown 中使用 `![alt](path)` 引用
- **AND** 表格转换为 Markdown 表格格式

#### Scenario: 批量转换
- **WHEN** 多个章节 PDF 需要转换
- **THEN** 系统 SHALL 支持批量处理
- **AND** 显示转换进度
- **AND** 转换成功率 > 90%

#### Scenario: Markdown 文件组织
- **WHEN** 转换完成
- **THEN** 系统 SHALL 将 Markdown 文件保存到：
  ```
  processed/{书名}/markdown/
    ├── 第1章_标题.md
    ├── 第2章_标题.md
    └── images/
        ├── fig1_1.png
        └── fig1_2.png
  ```

### Requirement: 元数据生成

Textbook Processor SHALL 生成结构化的元数据文件，记录教材信息和章节索引。

#### Scenario: 基本信息元数据
- **WHEN** 开始处理教材
- **THEN** 系统 SHALL 提取并记录：
  - 书名
  - 作者
  - 总页数
  - 出版信息（如有）
  - 处理时间戳

#### Scenario: 章节索引元数据
- **WHEN** 章节切分完成
- **THEN** 系统 SHALL 生成 `metadata.json`，包含：
  ```json
  {
    "title": "教材标题",
    "total_pages": 500,
    "chapters": [
      {
        "chapter_number": 1,
        "title": "章节标题",
        "page_start": 1,
        "page_end": 50,
        "pdf_file": "chapters/第1章_标题.pdf",
        "md_file": "markdown/第1章_标题.md"
      }
    ]
  }
  ```

#### Scenario: 处理状态记录
- **WHEN** 处理过程中出现错误或警告
- **THEN** 系统 SHALL 在元数据中记录：
  - 成功处理的章节
  - 失败的章节及原因
  - 跳过的章节
  - 处理耗时

### Requirement: 错误处理和恢复

Textbook Processor SHALL 提供健壮的错误处理机制，确保处理过程的可恢复性。

#### Scenario: PDF 文件损坏
- **WHEN** 输入的 PDF 文件损坏或无法读取
- **THEN** 系统 SHALL 显示清晰的错误信息
- **AND** 跳过该文件，继续处理其他文件（批量模式）
- **AND** 记录到错误日志

#### Scenario: MinerU 转换失败
- **WHEN** 某个章节的 Markdown 转换失败
- **THEN** 系统 SHALL 记录失败的章节
- **AND** 保留原始 PDF 文件
- **AND** 支持单独重新转换该章节

#### Scenario: 断点续传
- **WHEN** 处理过程被中断
- **THEN** 系统 SHALL 保存处理进度
- **AND** 下次运行时从上次中断处继续
- **AND** 不重复处理已完成的章节

### Requirement: Skill 接口和集成

Textbook Processor SHALL 以 Claude Code Skill 的形式提供，便于集成到项目中。

#### Scenario: Skill 调用
- **WHEN** 用户调用 `/textbook-processor` skill
- **THEN** 系统 SHALL 接收 PDF 文件路径作为参数
- **AND** 自动执行完整的处理流程
- **AND** 返回处理结果和输出路径

#### Scenario: 进度反馈
- **WHEN** 处理大型教材（> 200 页）
- **THEN** 系统 SHALL 实时显示处理进度
- **AND** 包括当前阶段、已完成章节、预估剩余时间

#### Scenario: 配置选项
- **WHEN** 用户需要自定义处理行为
- **THEN** 系统 SHALL 支持可选配置：
  - 输出目录
  - 是否生成 Markdown
  - 是否保留原始 PDF
  - 并行处理数量
