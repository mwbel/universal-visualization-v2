#!/bin/bash

# Python天文可视化启动脚本
# 作者：天文可视化团队
# 日期：$(date +%Y-%m-%d)

echo "🌟 启动Python天文可视化系统..."
echo "=================================="

# 检查Python环境
if ! command -v python3 &> /dev/null; then
    echo "❌ Python3 未安装，请先安装Python3"
    exit 1
fi

# 进入天文模块目录
cd "$(dirname "$0")"

# 检查必要的Python库
echo "🔍 检查Python依赖库..."
python3 -c "import flask, flask_cors, plotly, skyfield, numpy, scipy, PIL" 2>/dev/null
if [ $? -ne 0 ]; then
    echo "⚠️  缺少必要的Python库，正在安装..."
    pip3 install flask flask-cors plotly scipy pillow skyfield numpy
    if [ $? -ne 0 ]; then
        echo "❌ 依赖库安装失败，请手动运行："
        echo "   pip3 install flask flask-cors plotly scipy pillow skyfield numpy"
        exit 1
    fi
fi

# 检查星历数据文件
if [ ! -f "src/de421.bsp" ]; then
    echo "⚠️  星历数据文件 src/de421.bsp 未找到"
    echo "   该文件对于精确的天文计算是必需的"
    echo "   请确保该文件存在于src目录中"
fi

# 检查月球纹理文件
if [ ! -f "src/moon_texture_map.tif" ]; then
    echo "⚠️  月球纹理文件 src/moon_texture_map.tif 未找到"
    echo "   月相可视化将使用简化渲染模式"
fi

# 启动API服务器
echo "🚀 启动Flask API服务器..."
echo "📊 API文档: http://localhost:5000"
echo "🌙 月相可视化: http://localhost:8080/python_moon_phase.html"
echo "🌌 天文模块主页: http://localhost:8080/index.html"
echo ""
echo "💡 使用说明:"
echo "   1. 确保在另一个终端启动Web服务器：python3 -m http.server 8080"
echo "   2. 访问上述链接体验Python天文可视化"
echo "   3. 按 Ctrl+C 停止API服务器"
echo ""

# 启动Flask应用
python3 api_server.py