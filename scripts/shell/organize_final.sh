#!/bin/bash
# 最终整理 - 处理所有剩余文件

echo "🏁 最终整理阶段..."

# 移动剩余的 HTML 文件
echo "🌐 整理剩余 HTML 文件..."
mv *.html tests/frontend/ 2>/dev/null || true

# 移动剩余的 Shell 文件  
echo "🐚 整理剩余 Shell 文件..."
mv *.sh scripts/shell/ 2>/dev/null || true

# 移动剩余的文档到 docs/
echo "📖 整理剩余文档..."
mv *.md docs/ 2>/dev/null || true

# 整理脚本本身
mv organize_*.sh scripts/shell/ 2>/dev/null || true

echo "✅ 最终整理完成！"
echo ""
echo "🎉 项目整理全部完成！"
