#!/bin/bash

# 万物可视化 v2.0 启动脚本
# 基于方案A的集中式路由架构

echo "🌌 万物可视化 v2.0 启动脚本"
echo "📋 架构: 方案A - 集中式路由架构"
echo "=================================="

# 检查Python版本
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 未安装，请先安装 Python 3.8+"
    exit 1
fi

PYTHON_VERSION=$(python3 -c "import sys; print(f'{sys.version_info.major}.{sys.version_info.minor}')")
echo "🐍 Python 版本: $PYTHON_VERSION"

# 检查必要的Python包
REQUIRED_PACKAGES=("fastapi" "uvicorn" "numpy" "matplotlib" "plotly" "scipy" "jinja2")
MISSING_PACKAGES=()

for package in "${REQUIRED_PACKAGES[@]}"; do
    if ! python3 -c "import ${package}" 2>/dev/null; then
        MISSING_PACKAGES+=("$package")
    fi
done

if [ ${#MISSING_PACKAGES[@]} -ne 0 ]; then
    echo "⚠️  缺少以下Python包: ${MISSING_PACKAGES[*]}"
    echo "📦 正在安装依赖包..."
    pip3 install fastapi uvicorn "numpy>=1.21.0" "matplotlib>=3.5.0" "plotly>=5.0.0" "scipy>=1.7.0" "jinja2>=3.0.0" "skyfield>=1.39" "scikit-learn>=1.0.0"

    if [ $? -ne 0 ]; then
        echo "❌ 依赖包安装失败"
        exit 1
    fi
    echo "✅ 依赖包安装完成"
fi

# 创建必要的目录
echo "📁 创建必要目录..."
mkdir -p backend-v2/logs
mkdir -p backend-v2/static/visualizations
mkdir -p backend-v2/templates

# 检查端口是否被占用
PORT=8000
if lsof -Pi :$PORT -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo "⚠️  端口 $PORT 已被占用"
    read -p "是否使用其他端口? (y/n): " use_other_port
    if [ "$use_other_port" = "y" ] || [ "$use_other_port" = "Y" ]; then
        read -p "请输入端口号: " new_port
        PORT=$new_port
    else
        echo "🛑 启动取消"
        exit 1
    fi
fi

# 进入后端目录
cd backend-v2

echo "🚀 启动万物可视化 v2.0 后端服务..."
echo "🌐 服务地址: http://localhost:$PORT"
echo "📊 API文档: http://localhost:$PORT/docs"
echo "⏹️  按 Ctrl+C 停止服务"
echo "=================================="

# 启动服务
if command -v uvicorn &> /dev/null; then
    uvicorn main:app --host 0.0.0.0 --port $PORT --reload --log-level info
else
    python3 -m uvicorn main:app --host 0.0.0.0 --port $PORT --reload --log-level info
fi