#!/bin/bash

# 概率统计可视化页面 - 离线化脚本
# 用途：将在线版本转换为离线版本

echo "🚀 开始将页面转换为离线版本..."
echo ""

# 定义目录
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
LIB_DIR="$SCRIPT_DIR/lib"

# 创建lib目录
echo "📁 创建库文件目录: $LIB_DIR"
mkdir -p "$LIB_DIR"

# 检查并下载 Plotly
PLOTLY_FILE="$LIB_DIR/plotly.min.js"
if [ ! -f "$PLOTLY_FILE" ]; then
    echo "⬇️  下载 Plotly (约3.5MB)..."
    curl -L -o "$PLOTLY_FILE" "https://cdn.plot.ly/plotly-2.26.0.min.js"

    if [ $? -eq 0 ]; then
        echo "✅ Plotly 下载成功!"
    else
        echo "❌ Plotly 下载失败，请手动下载"
        echo "   下载地址: https://cdn.plot.ly/plotly-2.26.0.min.js"
        echo "   保存位置: $PLOTLY_FILE"
        exit 1
    fi
else
    echo "✅ Plotly 已存在，跳过下载"
fi

# 要转换的HTML文件列表
FILES=(
    "常见离散分布可视化.html"
    "随机变量函数的分布可视化.html"
    "Bootstrap方法可视化.html"
    "二维随机变量联合分布可视化.html"
    "边缘分布与条件分布可视化.html"
)

# 转换每个文件
echo ""
echo "🔄 开始转换HTML文件..."

for file in "${FILES[@]}"; do
    INPUT_FILE="$SCRIPT_DIR/$file"

    if [ ! -f "$INPUT_FILE" ]; then
        echo "⚠️  文件不存在: $file，跳过"
        continue
    fi

    echo "  处理: $file"

    # 创建备份
    cp "$INPUT_FILE" "$INPUT_FILE.bak"

    # 替换CDN链接为本地链接
    sed -i '' 's|https://cdn.plot.ly/plotly-latest.min.js|lib/plotly.min.js|g' "$INPUT_FILE"

    echo "    ✅ 转换完成"
done

echo ""
echo "🎉 离线化完成！"
echo ""
echo "📋 转换总结:"
echo "  - 下载库文件到: $LIB_DIR"
echo "  - 转换了 ${#FILES[@]} 个HTML文件"
echo "  - 原文件已备份为 .bak"
echo ""
echo "✅ 现在可以离线使用这些页面了！"
echo ""
echo "📦 如需分享，请打包整个 pages 文件夹："
echo "   cd main-app/modules/probability_statistics"
echo "   zip -r probability_stats_pages.zip pages/"
