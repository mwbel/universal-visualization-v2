# OCR 模型下载说明

## 当前情况

您正在处理的《概率论与数理统计第五版盛骤-完整版.pdf》是一个**扫描版 PDF**，没有文本层。这需要使用 OCR（光学字符识别）来提取文本内容。

## 检测方法对比

### 1. 基于嵌入 TOC (当前可用)
✅ **优点**：无需下载模型，速度快
⚠️  **限制**：只能识别 PDF 嵌入的目录结构，可能不够详细

```bash
python3 process_textbook.py "概率论与数理统计第五版盛骤-完整版.pdf" --split-only
```

**当前结果**：检测到10个高层级章节（封面、书名、正文等），"正文"部分涵盖了第16-524页的所有内容。

### 2. 基于 MinerU OCR (需要网络)
✅ **优点**：可以识别扫描版 PDF 中的所有章节标题
⚠️  **要求**：需要下载约 2GB 的 OCR 模型

**模型下载方法**：

```bash
# 激活虚拟环境
source .venv/bin/activate

# 下载 MinerU OCR 模型
python3 -c "
from mineru.backend.pipeline.pipeline_analyze import auto_download_and_get_model_root_path
from mineru.utils.model_path import ModelPath
import os

models = [
    'PDF-Extract-Kit-1.0',
]

print('开始下载 OCR 模型...')
for model in models:
    try:
        path = auto_download_and_get_model_root_path(model)
        print(f'✓ {model} 已下载到: {path}')
    except Exception as e:
        print(f'✗ {model} 下载失败: {e}')
        print('  请检查网络连接或稍后重试')
"
```

**使用 OCR 检测章节**：

```bash
python3 src/mineru_chapter_detector.py "概率论与数理统计第五版盛骤-完整版.pdf"
```

### 3. 手动指定章节 (最快)

如果您知道章节的页码范围，可以直接创建一个 JSON 配置文件：

```json
{
  "title": "概率论与数理统计第五版",
  "chapters": [
    {"number": 1, "title": "概率论的基本概念", "page_start": 16, "page_end": 50},
    {"number": 2, "title": "随机变量及其分布", "page_start": 51, "page_end": 100},
    {"number": 3, "title": "多维随机变量", "page_start": 101, "page_end": 150},
    {"number": 4, "title": "随机变量的数字特征", "page_start": 151, "page_end": 200},
    {"number": 5, "title": "大数定律与中心极限定理", "page_start": 201, "page_end": 230},
    {"number": 6, "title": "样本及抽样分布", "page_start": 231, "page_end": 260},
    {"number": 7, "title": "参数估计", "page_start": 261, "page_end": 310},
    {"number": 8, "title": "假设检验", "page_start": 311, "page_end": 360}
  ]
}
```

然后使用自定义配置处理：

```bash
python3 process_textbook.py "概率论与数理统计第五版盛骤-完整版.pdf" \
  --config custom_chapters.json \
  --convert-md
```

## 推荐方案

### 方案 A：等待网络恢复后使用 OCR (推荐)

1. 确保网络连接正常
2. 运行上面的模型下载命令
3. 使用 MinerU 章节检测器自动识别所有章节

### 方案 B：先用 TOC 快速切分，后续改进

1. 使用现有的 TOC 方法快速处理：
   ```bash
   python3 process_textbook.py "概率论与数理统计第五版盛骤-完整版.pdf" \
     --split-only \
     --convert-md
   ```
2. 手动编辑生成的 `metadata.json` 文件，补充详细章节信息
3. 重新运行处理脚本使用更新的元数据

### 方案 C：手动指定重要章节

如果只需要处理部分章节，手动创建章节配置文件是最快的方式。

## 技术说明

### 为什么需要 OCR？

- **文本 PDF**：有可选择的文本层，可以直接提取
- **扫描 PDF**：只是图片，需要 OCR 识别文字

### MinerU 模型说明

- **模型大小**：约 2GB
- **下载源**：HuggingFace (opendatalab/PDF-Extract-Kit-1.0)
- **存储位置**：`~/.cache/huggingface/hub/`
- **包含内容**：
  - 文字检测模型 (YOLO)
  - 文字识别模型 (OCR)
  - 版面分析模型 (Layout Analysis)

### 网络问题排查

如果下载失败，可能是：

1. **网络连接问题**：检查能否访问 huggingface.co
2. **防火墙限制**：尝试使用 VPN 或镜像站
3. **磁盘空间不足**：确保有至少 3GB 可用空间
4. **超时设置过短**：可以增加超时时间

```bash
# 测试网络连接
curl -I https://huggingface.co

# 检查磁盘空间
df -h ~
```

## 当前状态

- ✅ MinerU 已安装
- ✅ 基础功能可用
- ⏳ OCR 模型待下载（需要网络连接）
- ✅ 基于嵌入 TOC 的章节检测可用

## 下一步操作

选择最适合您的方案并执行。如果您有稳定的网络连接，建议使用方案 A（OCR），这样可以自动识别所有章节结构。
