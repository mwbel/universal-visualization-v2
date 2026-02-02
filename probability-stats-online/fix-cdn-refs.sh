#!/bin/bash

# 修复所有模块中的本地库引用，替换为CDN
# 作者: Claude AI Assistant
# 日期: 2026年1月22日

MODULES_DIR="/Users/Min369/Documents/同步空间/Manju/Projects/AlVisualization/probability-stats-online/modules"

# 计数器
total=0
fixed=0
skipped=0

echo "=========================================="
echo "  修复模块中的本地库引用为CDN"
echo "=========================================="
echo ""
echo "目标目录: $MODULES_DIR"
echo ""

cd "$MODULES_DIR"

# 处理所有HTML文件
for file in *.html; do
    if [ ! -f "$file" ]; then
        continue
    fi

    total=$((total + 1))
    echo "[$total] 检查: $file"

    # 检查是否包含本地库引用
    has_local_lib=0
    if grep -q 'lib/plotly.min.js' "$file" 2>/dev/null || \
       grep -q 'lib/tex-mml-chtml.js' "$file" 2>/dev/null; then
        has_local_lib=1
    fi

    if [ $has_local_lib -eq 0 ]; then
        echo "  ✓ 已使用CDN（无需修复）"
        skipped=$((skipped + 1))
        echo ""
        continue
    fi

    # 创建临时文件
    tmp_file=$(mktemp)

    # 执行所有替换
    sed -e 's|lib/plotly.min.js|https://cdn.plot.ly/plotly-2.27.0.min.js|g' \
        -e 's|lib/tex-mml-chtml.js|https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js|g' \
        "$file" > "$tmp_file"

    # 替换原文件
    mv "$tmp_file" "$file"

    echo "  ✓ 修复完成：本地库 → CDN"
    fixed=$((fixed + 1))
    echo ""
done

echo "=========================================="
echo "  修复完成！"
echo "=========================================="
echo "总计检查: $total 个文件"
echo "已修复: $fixed 个"
echo "跳过: $skipped 个"
echo ""

# 验证修复结果
echo "验证修复结果："
echo "=============="
remaining_local=$(grep -l 'lib/plotly.min.js\|lib/tex-mml-chtml.js' *.html 2>/dev/null | wc -l | tr -d ' ')
echo "仍包含本地库引用的文件: $remaining_local"

using_plotly_cdn=$(grep -l 'cdn.plot.ly' *.html 2>/dev/null | wc -l | tr -d ' ')
echo "使用Plotly CDN的文件: $using_plotly_cdn"

using_mathjax_cdn=$(grep -l 'cdn.jsdelivr.net.*mathjax' *.html 2>/dev/null | wc -l | tr -d ' ')
echo "使用MathJax CDN的文件: $using_mathjax_cdn"
echo ""

if [ $remaining_local -eq 0 ]; then
    echo "✅ 所有文件已成功转换为CDN！"
else
    echo "⚠️  仍有 $remaining_local 个文件包含本地库引用"
    echo "问题文件："
    grep -l 'lib/plotly.min.js\|lib/tex-mml-chtml.js' *.html 2>/dev/null
fi

echo ""
echo "✅ 修复完成！"
