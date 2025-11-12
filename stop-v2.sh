#!/bin/bash

# 万物可视化 V2 停止脚本

echo "🛑 停止万物可视化 V2 服务..."

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m' # No Color

# 从PID文件读取并终止进程
if [ -f /tmp/viz-backend.pid ]; then
    BACKEND_PID=$(cat /tmp/viz-backend.pid)
    if ps -p $BACKEND_PID > /dev/null; then
        kill $BACKEND_PID
        echo -e "${RED}✅ 后端服务已停止 (PID: $BACKEND_PID)${NC}"
    else
        echo "⚠️  后端服务未运行"
    fi
    rm -f /tmp/viz-backend.pid
else
    echo "⚠️  未找到后端服务PID文件"
fi

if [ -f /tmp/viz-frontend.pid ]; then
    FRONTEND_PID=$(cat /tmp/viz-frontend.pid)
    if ps -p $FRONTEND_PID > /dev/null; then
        kill $FRONTEND_PID
        echo -e "${RED}✅ 前端服务已停止 (PID: $FRONTEND_PID)${NC}"
    else
        echo "⚠️  前端服务未运行"
    fi
    rm -f /tmp/viz-frontend.pid
else
    echo "⚠️  未找到前端服务PID文件"
fi

# 强制清理端口占用
echo "🔧 检查端口清理情况..."
if lsof -Pi :9999 -sTCP:LISTEN -t >/dev/null ; then
    echo "清理后端端口 9999..."
    lsof -ti:9999 | xargs kill -9 2>/dev/null
fi

if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null ; then
    echo "清理前端端口 3000..."
    lsof -ti:3000 | xargs kill -9 2>/dev/null
fi

echo -e "${GREEN}🎉 万物可视化 V2 服务已完全停止${NC}"
echo ""
echo "💡 重新启动请运行: ./start-v2-fixed.sh"