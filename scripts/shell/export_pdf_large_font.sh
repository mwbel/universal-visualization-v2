#!/bin/bash

# PDF导出脚本 - 大字体版本
# 用途：导出数学术语文档为PDF，使用较大字体

INPUT_FILE="沪教版高中数学1数学术语中英文对照20251223.v1.md"
OUTPUT_FILE="沪教版高中数学1数学术语中英文对照20251223.v1.large-font.pdf"
PREAMBLE_FILE="preamble.tex"

# 检查输入文件是否存在
if [ ! -f "$INPUT_FILE" ]; then
    echo "错误: 找不到文件 $INPUT_FILE"
    exit 1
fi

echo "正在导出PDF（大字体版本）..."

# 使用pandoc导出，设置字体大小
# 使用12pt作为基础，然后在preamble中通过\large命令放大到约14pt的效果
pandoc "$INPUT_FILE" \
    -o "$OUTPUT_FILE" \
    --pdf-engine=xelatex \
    --variable=mainfont:"PingFang SC" \
    --variable=CJKmainfont:"PingFang SC" \
    --variable=fontsize:12pt \
    --variable=geometry:margin=2cm \
    --toc \
    --number-sections \
    --include-in-header="$PREAMBLE_FILE"

if [ $? -eq 0 ]; then
    echo "✓ PDF导出成功: $OUTPUT_FILE"
    echo "  - 字体大小: 约14pt（通过LaTeX\large命令实现）"
    echo "  - 页边距: 2cm"
    echo "  - 包含目录和章节编号"

    # 尝试打开PDF
    if command -v open &> /dev/null; then
        open "$OUTPUT_FILE"
    fi
else
    echo "✗ PDF导出失败"
    exit 1
fi
