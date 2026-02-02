#!/bin/bash

# PDF导出脚本 - 精确列宽控制版本
# 用途：导出数学术语文档为PDF，精确控制表格列宽比例（18%:32%:50%）

INPUT_FILE="沪教版高中数学1数学术语中英文对照20251223.v1.md"
OUTPUT_FILE="沪教版高中数学1数学术语中英文对照20251223.v1.precise-columns.pdf"
TEMP_TEX="temp_output.tex"

# 检查输入文件是否存在
if [ ! -f "$INPUT_FILE" ]; then
    echo "错误: 找不到文件 $INPUT_FILE"
    exit 1
fi

echo "正在导出PDF（精确列宽控制版本）..."

# 第一步：生成LaTeX源文件
echo "步骤1: 生成LaTeX源文件..."
pandoc "$INPUT_FILE" \
    -o "$TEMP_TEX" \
    --pdf-engine=xelatex \
    --variable=mainfont:"PingFang SC" \
    --variable=CJKmainfont:"PingFang SC" \
    --variable=fontsize:12pt \
    --variable=geometry:"margin=2cm" \
    --toc \
    --number-sections \
    --include-in-header=preamble.tex

if [ $? -ne 0 ]; then
    echo "✗ LaTeX源文件生成失败"
    exit 1
fi

# 第二步：修改表格列宽（使用sed替换longtable的列定义）
echo "步骤2: 调整表格列宽比例（18%:32%:50%）..."

# 替换所有longtable的列定义为精确宽度
# 将 \begin{longtable}{lll} 或类似的定义替换为指定宽度
sed -i.tmp -E '
  # 匹配longtable的列定义
  s/\\begin\{longtable\}\[\]\{[lc]+\}/\\begin{longtable}[|p{0.18\\textwidth}|p{0.32\\textwidth}|p{0.50\\textwidth}|]/g
  s/\\begin\{longtable\}\{[lc]+\}/\\begin{longtable}{|p{0.18\\textwidth}|p{0.32\\textwidth}|p{0.50\\textwidth}|}/g
  s/\\begin\{longtable\}\[\]\{\\\\[a-z]+\|[lc]+\}/\\begin{longtable}[|p{0.18\\textwidth}|p{0.32\\textwidth}|p{0.50\\textwidth}|]/g
  s/\\begin\{tabular\}\{[lc]+\}/\\begin{tabular}{|p{0.18\\textwidth}|p{0.32\\textwidth}|p{0.50\\textwidth}|}/g
' "$TEMP_TEX"

# 第三步：编译LaTeX为PDF
echo "步骤3: 编译PDF..."
xelatex -interaction=nonstopmode "$TEMP_TEX" > /dev/null 2>&1
xelatex -interaction=nonstopmode "$TEMP_TEX" > /dev/null 2>&1

# 重命名输出文件
if [ -f "${TEMP_TEX%.tex}.pdf" ]; then
    mv "${TEMP_TEX%.tex}.pdf" "$OUTPUT_FILE"
    echo "✓ PDF导出成功: $OUTPUT_FILE"
    echo "  - 列宽比例: 中文18% | 英文32% | 数学符号50%"
    echo "  - 字体大小: 约14pt"
    echo "  - 页边距: 2cm"
    echo "  - 包含目录和章节编号"

    # 清理临时文件
    rm -f "$TEMP_TEX" "$TEMP_TEX.tmp" "$TEMP_TEX.aux" "$TEMP_TEX.log" "$TEMP.tex.out" "$TEMP.tex.toc"

    # 尝试打开PDF
    if command -v open &> /dev/null; then
        open "$OUTPUT_FILE"
    fi
else
    echo "✗ PDF编译失败"
    echo "检查 $TEMP_TEX.log 获取错误信息"
    rm -f "$TEMP_TEX" "$TEMP_TEX.tmp"
    exit 1
fi
