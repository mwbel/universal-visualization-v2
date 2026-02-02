#!/bin/bash

# 批量转换所有离线版模块为在线版
# 作者: Claude AI Assistant
# 日期: 2026年1月22日

ONLINE_DIR="/Users/Min369/Documents/同步空间/Manju/Projects/AlVisualization/probability-stats-online/modules"
OFFLINE_DIR="/Users/Min369/Documents/同步空间/Manju/Projects/AlVisualization/期末速通/概率统计可视化"

# 计数器
total=0
success=0
failed=0

echo "=========================================="
echo "  批量转换离线版模块为在线版"
echo "=========================================="
echo ""
echo "源目录: $OFFLINE_DIR"
echo "目标目录: $ONLINE_DIR"
echo ""

# 创建临时文件列表
cd "$OFFLINE_DIR"
find . -maxdepth 1 -name "*.html" -type f -exec basename {} \; | \
grep -v -E "test|backup|pure|placeholder|index|navigator|knowledge|template" | \
sort > /tmp/modules-to-convert.txt

# 读取文件列表并逐个处理
while IFS= read -r file; do
    if [ -z "$file" ]; then
        continue
    fi

    total=$((total + 1))
    echo "[$total] 处理: $file"

    # 检查源文件是否存在
    if [ ! -f "$OFFLINE_DIR/$file" ]; then
        echo "  ❌ 源文件不存在，跳过"
        failed=$((failed + 1))
        continue
    fi

    # 复制文件到在线版目录
    cp "$OFFLINE_DIR/$file" "$ONLINE_DIR/$file"

    # 检查文件是否包含本地库引用
    if grep -q 'lib/plotly.min.js' "$ONLINE_DIR/$file" 2>/dev/null; then
        # 替换Plotly本地库为CDN
        sed -i '' 's|<script src="lib/plotly.min.js"></script>|<script src="https://cdn.plot.ly/plotly-2.27.0.min.js"></script>|g' "$ONLINE_DIR/$file"
        echo "  ✓ Plotly: 本地 → CDN"
    fi

    if grep -q 'lib/tex-mml-chtml.js' "$ONLINE_DIR/$file" 2>/dev/null; then
        # 替换MathJax本地库为CDN
        sed -i '' 's|<script src="lib/tex-mml-chtml.js"></script>|<script id="MathJax-script" async src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js"></script>|g' "$ONLINE_DIR/$file"
        echo "  ✓ MathJax: 本地 → CDN"
    fi

    # 如果文件没有本地库引用，也复制过去
    if ! grep -q 'lib/' "$ONLINE_DIR/$file" 2>/dev/null; then
        echo "  ✓ 已使用CDN（无需转换）"
    fi

    success=$((success + 1))
    echo ""

done < /tmp/modules-to-convert.txt

# 清理临时文件
rm -f /tmp/modules-to-convert.txt

echo "=========================================="
echo "  转换完成！"
echo "=========================================="
echo "总计: $total 个文件"
echo "成功: $success 个"
echo "失败: $failed 个"
echo ""
echo "在线版目录: $ONLINE_DIR"
echo ""

# 列出转换后的文件
echo "已转换的模块："
ls -1 "$ONLINE_DIR"/*.html 2>/dev/null | wc -l | xargs echo "总共模块数:"
echo ""

echo "✅ 批量转换完成！"
