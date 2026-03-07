#!/bin/bash

#茅塞顿开高中数学助教 - 一键安装脚本
#适用于 Intel 芯片 Mac (macOS 11+)

set -e  # 遇到错误立即退出

echo "========================================"
echo "   茅塞顿开高中数学助教 - 安装向导"
echo "========================================"
echo ""

# 检查 Python 版本
echo "📋 检查系统环境..."
if ! command -v python3 &> /dev/null; then
    echo "❌ 未找到 Python3，请先安装 Python 3.8 或更高版本"
    echo "   访问 https://www.python.org/downloads/ 下载安装"
    exit 1
fi

PYTHON_VERSION=$(python3 --version | awk '{print $2}')
echo "✅ Python 版本: $PYTHON_VERSION"

# 检查 pip
if ! command -v pip3 &> /dev/null; then
    echo "❌ 未找到 pip3，请先安装"
    exit 1
fi

echo ""
echo "🔧 开始安装..."
echo ""

# 创建虚拟环境
if [ -d ".venv" ]; then
    echo "⚠️  虚拟环境已存在，跳过创建"
else
    echo "📦 创建虚拟环境..."
    python3 -m venv .venv
    echo "✅ 虚拟环境创建完成"
fi

# 激活虚拟环境
echo "🔌 激活虚拟环境..."
source .venv/bin/activate

# 升级 pip
echo "⬆️  升级 pip..."
pip install --upgrade pip -q

# 安装依赖
echo "📚 安装 Python 依赖包（这可能需要 5-10 分钟）..."
pip install -r requirements.txt

echo ""
echo "========================================"
echo "✅ 安装完成！"
echo "========================================"
echo ""
echo "📝 启动服务请运行："
echo ""
echo "   source .venv/bin/activate"
echo "   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000"
echo ""
echo "📱 然后在 iPad 浏览器访问:"
echo "   http://[你的Mac IP地址]:8000"
echo ""
echo "💡 查看 DEPLOY_GUIDE.md 获取详细使用说明"
echo "========================================"
