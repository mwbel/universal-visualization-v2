#!/bin/bash

# GLM-4.6 数学动画生成器 - Web 应用启动脚本

echo "🚀 启动 GLM-4.6 数学动画生成器 Web 服务"
echo "================================================"
echo ""

# 检查 Python
if ! command -v python3 &> /dev/null; then
    echo "❌ 错误: 未找到 Python3"
    exit 1
fi

echo "✅ Python 版本: $(python3 --version)"
echo ""

# 检查依赖
echo "📦 检查依赖..."
python3 -c "import fastapi" 2>/dev/null
if [ $? -ne 0 ]; then
    echo "⚠️  FastAPI 未安装，正在安装..."
    pip3 install fastapi uvicorn python-multipart
fi

python3 -c "import openai" 2>/dev/null
if [ $? -ne 0 ]; then
    echo "⚠️  OpenAI 包未安装，正在安装..."
    pip3 install openai python-dotenv
fi

echo "✅ 所有依赖已就绪"
echo ""

# 检查 .env 文件
if [ ! -f ".env" ]; then
    echo "❌ 错误: 未找到 .env 文件"
    echo "请先创建 .env 文件并设置 ZHIPU_API_KEY"
    exit 1
fi

echo "✅ 配置文件已找到"
echo ""

# 启动服务
echo "🌐 启动 Web 服务..."
echo "================================================"
echo ""
echo "📱 访问地址: http://localhost:8000"
echo "📚 API 文档: http://localhost:8000/docs"
echo ""
echo "按 Ctrl+C 停止服务"
echo "================================================"
echo ""

# 启动 FastAPI 服务
cd backend-v2/api
python3 web_animation.py
