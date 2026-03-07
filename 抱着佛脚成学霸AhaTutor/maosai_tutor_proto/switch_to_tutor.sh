#!/bin/bash

#茅塞顿开助教 - 切换到学习模式脚本
#适用于与 OpenClaw 共存的环境

echo "========================================"
echo "   切换到学习模式"
echo "========================================"
echo ""

# 检查是否有 OpenClaw 进程
OPENCLAW_PROCESS=$(pgrep -f "openclaw" || true)

if [ -n "$OPENCLAW_PROCESS" ]; then
    echo "⚠️  检测到 OpenClaw 正在运行"
    echo ""
    read -p "是否停止 OpenClaw 以释放内存？(y/n) " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "🛑 停止 OpenClaw..."
        # 根据你的 OpenClaw 实际启动方式修改以下命令
        # 例如：pkill -f "openclaw"
        # 或者：cd ~/.openclaw && ./stop.sh
        echo "✅ OpenClaw 已停止（请根据实际情况修改脚本）"
    else
        echo "⚠️  继续保持 OpenClaw 运行"
    fi
else
    echo "✅ 未检测到 OpenClaw 进程"
fi

echo ""
echo "🚀 启动茅塞顿开助教..."
echo ""

# 进入项目目录
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

# 激活虚拟环境
if [ ! -d ".venv" ]; then
    echo "❌ 虚拟环境不存在，请先运行 ./install.sh"
    exit 1
fi

source .venv/bin/activate

# 显示内存使用情况
echo "📊 当前内存使用情况："
echo ""
if command -v vm_stat &> /dev/null; then
    vm_stat | head -5
fi

echo ""
echo "🎓 助教服务启动中..."
echo "📱 iPad 访问地址: http://$(ipconfig getifaddr en0 2>/dev/null || echo "你的Mac-IP"):8000"
echo ""
echo "💡 提示："
echo "   - 按 Ctrl+C 停止服务"
echo "   - 查看活动监视器了解内存使用情况"
echo "========================================"
echo ""

# 启动服务
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
