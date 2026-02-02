#!/bin/bash
# 整理所有测试文件

echo "🧪 整理测试文件..."

# 创建测试子目录
mkdir -p tests/python
mkdir -p tests/api

# 移动 Python 测试文件
echo "📜 移动 Python 测试文件..."
mv test_glm_animation.py tests/python/ 2>/dev/null || true
mv test_frontend_api.py tests/python/ 2>/dev/null || true
mv test_web_api.py tests/python/ 2>/dev/null || true
mv test_api_integration.py tests/python/ 2>/dev/null || true
mv test_deepseek_style.py tests/python/ 2>/dev/null || true
mv test_linear_algebra_templates.py tests/python/ 2>/dev/null || true
mv test_split_with_metadata.py tests/python/ 2>/dev/null || true
mv test_new_api.py tests/python/ 2>/dev/null || true

# 移动 HTML 测试文件
echo "🌐 移动 HTML 测试文件..."
mv test_frontend_api.html tests/frontend/ 2>/dev/null || true
mv test_frontend_buttons.html tests/frontend/ 2>/dev/null || true
mv test_matrix_input.html tests/frontend/ 2>/dev/null || true
mv test_api_connection.html tests/frontend/ 2>/dev/null || true

# 移动其他测试相关文件
echo "📝 移动其他测试文件..."
mv test_*.md tests/ 2>/dev/null || true

echo "✅ 测试文件整理完成！"
echo ""
echo "📊 整理结果:"
echo "  Python 测试: tests/python/"
echo "  HTML 测试: tests/frontend/"
