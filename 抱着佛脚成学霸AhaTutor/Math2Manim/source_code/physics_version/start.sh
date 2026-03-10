#!/bin/bash
# 物理动画生成器 - 快速启动脚本

echo "======================================"
echo "物理动画生成器 - 启动脚本"
echo "======================================"
echo ""

# 检查Python
if ! command -v python3 &> /dev/null; then
    echo "❌ 错误: Python3 未安装"
    exit 1
fi

echo "✅ Python3: $(python3 --version)"

# 检查依赖
echo ""
echo "检查依赖..."

if ! python3 -c "import flask" 2>/dev/null; then
    echo "⚠️  Flask 未安装，正在安装..."
    pip3 install flask flask-cors
fi

if ! python3 -c "import manim" 2>/dev/null; then
    echo "⚠️  Manim 未安装，正在安装..."
    pip3 install manim
fi

echo "✅ 所有依赖已安装"
echo ""

# 启动服务器
echo "======================================"
echo "启动服务器..."
echo "======================================"
echo ""
echo "访问地址: http://localhost:5000"
echo "按 Ctrl+C 停止服务器"
echo ""

python3 server.py
