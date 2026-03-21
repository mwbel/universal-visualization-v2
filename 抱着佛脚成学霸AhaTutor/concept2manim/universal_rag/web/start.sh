#!/bin/bash

# Universal RAG Web 服务启动脚本

echo "======================================================================"
echo "Universal RAG Web 服务启动脚本"
echo "======================================================================"

# 检查 Flask 是否安装
if ! python3 -c "import flask" 2>/dev/null; then
    echo "❌ Flask 未安装，正在安装..."
    pip3 install flask
fi

# 进入 web 目录
cd "$(dirname "$0")"

# 启动服务
echo ""
echo "✅ 启动 Web 服务..."
echo ""
python3 app.py
