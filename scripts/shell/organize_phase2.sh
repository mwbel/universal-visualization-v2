#!/bin/bash
# 第二轮整理 - 处理剩余文件

echo "🔄 第二轮整理..."

# 移动剩余的 Python 脚本
echo "📜 移动剩余 Python 脚本..."
mv mineru_ocr_toc.py scripts/python/ 2>/dev/null || true
mv ocr_macos.py scripts/python/ 2>/dev/null || true
mv pdf_chapter_splitter.py scripts/python/ 2>/dev/null || true
mv scan_chapters.py scripts/python/ 2>/dev/null || true

# 移动剩余的 Shell 脚本
echo "🐚 移动剩余 Shell 脚本..."
mv quick_deploy.sh scripts/shell/ 2>/dev/null || true
mv quick-start.sh scripts/shell/ 2>/dev/null || true
mv run_mineru_docker.sh scripts/shell/ 2>/dev/null || true
mv setup_mineru_server.sh scripts/shell/ 2>/dev/null || true

# 移动剩余的 HTML 文件
echo "🌐 移动剩余 HTML 文件..."
mv minimal-test.html tests/frontend/ 2>/dev/null || true
mv modern-chat-interface.html tests/frontend/ 2>/dev/null || true

# 移动剩余的 README 文件到 docs/
echo "📖 移动剩余 README 文件..."
mv README_*.md docs/ 2>/dev/null || true
mv QUICKREF.md docs/ 2>/dev/null || true
mv PDF导出说明.md docs/ 2>/dev/null || true

echo "✅ 第二轮整理完成！"
