# PDF 教材处理 Agent - 本地客户端

## 架构

```
┌─────────────────┐         HTTP API          ┌──────────────────┐
│  本地 Mac       │ <─────────────────────> │  Linux 服务器     │
│                 │                          │                  │
│  Agent 客户端   │                          │  MinerU API      │
│  - PyMuPDF      │                          │  (服务器提供)     │
│  - 章节分割     │                          │                  │
└─────────────────┘                          └──────────────────┘
```

## 安装依赖

```bash
pip3 install pymupdf requests
```

## 快速使用

### 1. 使用便捷函数

```python
import asyncio
from textbook_processor_agent import process_textbook

async def main():
    result = await process_textbook(
        pdf_path="书籍/概率论与数理统计第五版盛骤-完整版.pdf",
        output_dir="output/chapters",
        use_ocr=False,
        split=True
    )

    print(f"找到 {len(result['chapters'])} 章")
    print(f"输出: {result['output_dir']}")

asyncio.run(main())
```

### 2. 使用 Agent 类

```python
import asyncio
from textbook_processor_agent import TextbookProcessorAgent

async def main():
    agent = TextbookProcessorAgent()

    # 分析教材
    result = await agent.analyze_textbook(
        pdf_path="书籍/概率论与数理统计第五版盛骤-完整版.pdf",
        extract_toc=True,
        use_ocr=False
    )

    # 显示章节
    for ch in result['chapters']:
        print(f"第{ch.number}章: {ch.title}")
        print(f"  页码: {ch.page_start}-{ch.page_end}")

    # 分割 PDF
    output_files = await agent.split_pdf_by_chapters(
        pdf_path="书籍/概率论与数理统计第五版盛骤-完整版.pdf",
        chapters=result['chapters'],
        output_dir="output/chapters"
    )

asyncio.run(main())
```

## API 配置

设置环境变量（可选）：

```bash
export MINERU_API_URL="http://49.52.18.227:8000"
export MINERU_API_KEY=""  # 如果需要认证
```

或在代码中配置：

```python
from textbook_processor_agent import MinerUAPIClient, TextbookProcessorAgent

api_client = MinerUAPIClient(
    base_url="http://your-server:8000",
    api_key="your-key",
    timeout=300
)

agent = TextbookProcessorAgent(api_client=api_client)
```

## 功能

### 1. 分析教材

提取 PDF 的基本信息、目录和章节结构。

### 2. 分割 PDF

按章节将大 PDF 分割成多个小文件。

### 3. OCR 支持

对于扫描版 PDF，可以通过服务器 API 进行 OCR 识别。

## 降级策略

当 API 不可用时，Agent 会自动使用本地 PyMuPDF：
- 从 PDF 元数据提取目录
- 从文本中简单识别章节
- 仍然可以分割 PDF

## 文件说明

- `backend-v2/agents/textbook_processor_agent.py` - Agent 客户端代码
- `textbook-processor/test_api.py` - API 测试工具

## 开发中

等待服务器端 API 提供后，将集成以下功能：
- ✅ 目录提取 API
- ✅ PDF OCR API
- ✅ 完整分析 API
- ⏳ 章节智能识别
- ⏳ 自动页码范围计算
