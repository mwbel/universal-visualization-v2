#!/bin/bash

echo "🌟 启动Python天文可视化API服务器..."
echo "=================================="

cd "$(dirname "$0")"

# 检查Python3
if ! command -v python3 &> /dev/null; then
    echo "❌ Python3 未安装"
    exit 1
fi

# 检查依赖
echo "🔍 检查依赖库..."
python3 -c "import flask, flask_cors, numpy" 2>/dev/null
if [ $? -ne 0 ]; then
    echo "⚠️  正在安装依赖库..."
    pip3 install flask flask-cors numpy plotly skyfield
fi

echo "🚀 启动API服务器..."
echo "📊 API地址: http://localhost:5001"
echo "🌙 月相可视化: http://localhost:8080/python_moon_phase.html"
echo ""
echo "按 Ctrl+C 停止服务器"
echo ""

python3 api_server_simple.py