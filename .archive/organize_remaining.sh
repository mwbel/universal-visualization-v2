#!/bin/bash
# 最终整理脚本 - 组织剩余散落文件

set -e

echo "═══════════════════════════════════════════════════"
echo "      最终整理 - 组织剩余文件"
echo "═══════════════════════════════════════════════════"
echo

# 1. 创建 JavaScript 脚本目录
echo "1. 创建 scripts/javascript/ 目录..."
mkdir -p scripts/javascript

# 2. 移动 JavaScript 文件
if [ -f "start-dev-server.js" ]; then
    echo "  ✓ 移动 start-dev-server.js → scripts/javascript/"
    mv start-dev-server.js scripts/javascript/
fi

# 3. 移动 Python 脚本
if [ -f "simple_chapters.py" ]; then
    echo "  ✓ 移动 simple_chapters.py → scripts/python/"
    mv simple_chapters.py scripts/python/
fi

# 4. 创建 LaTeX 目录并移动文件
echo
echo "2. 创建 docs/latex/ 目录..."
mkdir -p docs/latex

if [ -f "preamble.tex" ]; then
    echo "  ✓ 移动 preamble.tex → docs/latex/"
    mv preamble.tex docs/latex/
fi

# 5. 清理临时文件
echo
echo "3. 清理临时文件..."
temp_files=(
    "temp_output.aux"
    "temp_output.log"
    "temp_output.toc"
)

for file in "${temp_files[@]}"; do
    if [ -f "$file" ]; then
        echo "  ✗ 删除 $file"
        rm "$file"
    fi
done

# 6. 保留在根目录的配置文件说明
echo
echo "4. 保留在根目录的配置文件:"
echo "  ✓ package.json (Node.js 配置)"
echo "  ✓ requirements.txt (Python 依赖)"

# 7. 显示最终状态
echo
echo "═══════════════════════════════════════════════════"
echo "  最终整理完成!"
echo "═══════════════════════════════════════════════════"
echo
echo "目录结构:"
echo "  scripts/"
echo "    python/      - Python 脚本"
echo "    javascript/  - JavaScript 脚本"
echo "    shell/       - Shell 脚本"
echo "  docs/"
echo "    latex/       - LaTeX 文件"
echo "    guides/      - 指南文档"
echo "    reports/     - 报告文档"
echo "  tests/"
echo "    python/      - Python 测试"
echo "    frontend/    - 前端测试"
echo
