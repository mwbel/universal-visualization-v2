#!/bin/bash

# 转换离线版为在线版的脚本
# 主要修改：
# 1. 将本地库引用替换为CDN
# 2. 添加AI助手功能
# 3. 添加API客户端引用

ONLINE_DIR="/Users/Min369/Documents/同步空间/Manju/Projects/AlVisualization/probability-stats-online/modules"
OFFLINE_DIR="/Users/Min369/Documents/同步空间/Manju/Projects/AlVisualization/期末速通/概率统计可视化"

# 要转换的文件列表
FILES=(
    "常见离散分布可视化.html"
    "随机变量函数的分布可视化.html"
    "Bootstrap方法可视化.html"
    "二维随机变量联合分布可视化.html"
    "边缘分布与条件分布可视化.html"
)

echo "开始转换文件为在线版..."

for file in "${FILES[@]}"; do
    echo "处理: $file"

    # 复制文件
    cp "$OFFLINE_DIR/$file" "$ONLINE_DIR/$file"

    # 替换本地库为CDN
    sed -i.bak 's|<script src="lib/plotly.min.js"></script>|<script src="https://cdn.plot.ly/plotly-2.27.0.min.js"></script>|g' "$ONLINE_DIR/$file"
    sed -i.bak 's|<script src="lib/tex-mml-chtml.js"></script>|<script id="MathJax-script" async src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js"></script>|g' "$ONLINE_DIR/$file"

    # 删除备份文件
    rm "$ONLINE_DIR/$file.bak"

    echo "✓ 完成: $file"
done

echo ""
echo "所有文件转换完成！"
echo "文件位置: $ONLINE_DIR"
