#!/bin/bash

#切换回 OpenClaw - 从学习模式切换回日常工作模式

echo "========================================"
echo "   切换回日常工作模式"
echo "========================================"
echo ""

# 检查助教服务
TUTOR_PROCESS=$(pgrep -f "uvicorn app.main:app" || true)

if [ -n "$TUTOR_PROCESS" ]; then
    echo "🛑 停止茅塞顿开助教服务..."
    kill $TUTOR_PROCESS
    sleep 2
    echo "✅ 助教服务已停止"
else
    echo "ℹ️  助教服务未运行"
fi

echo ""
echo "🚀 重新启动 OpenClaw..."
echo ""

# 根据你的 OpenClaw 实际启动方式修改以下命令
# 例如：
# cd ~/.openclaw && ./start.sh
# 或者：
# open -a Terminal "cd ~/.openclaw && ./start.sh"

echo "⚠️  请根据你的 OpenClaw 启动方式修改此脚本"
echo "========================================"
