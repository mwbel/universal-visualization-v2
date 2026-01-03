#!/bin/bash

# PDF导出脚本 - 自定义列宽版本
# 用途：导出数学术语文档为PDF，精确控制表格列宽

INPUT_FILE="沪教版高中数学1数学术语中英文对照20251223.v1.md"
OUTPUT_FILE="沪教版高中数学1数学术语中英文对照20251223.v1.custom-columns.pdf"

# 检查输入文件是否存在
if [ ! -f "$INPUT_FILE" ]; then
    echo "错误: 找不到文件 $INPUT_FILE"
    exit 1
fi

echo "正在导出PDF（自定义列宽版本）..."

# 创建临时LaTeX头文件
cat > temp_preamble.tex << 'EOFLATEX'
\usepackage{amsmath}
\usepackage{amssymb}
\usepackage{amsthm}
\usepackage{latexsym}
\usepackage{array}
\usepackage{longtable}
\usepackage{booktabs}
\usepackage{multirow}

% 全局字体设置
\large

% 设置表格行高
\renewcommand{\arraystretch}{1.4}

% 自动调整所有表格列宽
\usepackage{etoolbox}
\AtBeginEnvironment{tabular}{%
  \renewcommand{\arraystretch}{1.4}%
}
\AtBeginEnvironment{longtable}{%
  \renewcommand{\arraystretch}{1.4}%
}

% 调整表格字体大小，使公式不那么容易换行
\AtBeginEnvironment{tabular}{\small}
\AtBeginEnvironment{longtable}{\small}
EOFLATEX

# 使用pandoc导出
pandoc "$INPUT_FILE" \
    -o "$OUTPUT_FILE" \
    --pdf-engine=xelatex \
    --variable=mainfont:"PingFang SC" \
    --variable=CJKmainfont:"PingFang SC" \
    --variable=fontsize:12pt \
    --variable=geometry:"paperwidth=20cm, paperheight=28cm, margin=2cm" \
    --toc \
    --number-sections \
    --include-in-header=temp_preamble.tex \
    --columns=80

if [ $? -eq 0 ]; then
    echo "✓ PDF导出成功: $OUTPUT_FILE"
    echo "  - 字体大小: 约14pt（\large + 表格内\small）"
    echo "  - 页面尺寸: 20cm x 28cm（A4略窄，让表格更紧凑）"
    echo "  - 页边距: 2cm"
    echo "  - 包含目录和章节编号"

    # 清理临时文件
    rm -f temp_preamble.tex

    # 尝试打开PDF
    if command -v open &> /dev/null; then
        open "$OUTPUT_FILE"
    fi
else
    echo "✗ PDF导出失败"
    rm -f temp_preamble.tex
    exit 1
fi
