#!/bin/bash

# 万物可视化平台服务器停止脚本
# Author: Claude Code Assistant

echo "🛑 停止万物可视化平台本地服务器..."
echo "=================================================="

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 函数：停止指定端口的服务器
stop_server() {
    local port=$1
    local name=$2

    echo -e "${BLUE}🔄 停止 $name 服务器 (端口 $port)...${NC}"

    # 查找并杀死占用端口的进程
    local pid=$(lsof -ti:$port 2>/dev/null)
    if [ -n "$pid" ]; then
        kill -9 $pid 2>/dev/null
        echo -e "${GREEN}✅ $name 服务器已停止 (PID: $pid)${NC}"
    else
        echo -e "${YELLOW}⚠️  $name 服务器未运行${NC}"
    fi

    # 清理PID文件
    if [ -f "/tmp/visual_server_${port}.pid" ]; then
        rm -f "/tmp/visual_server_${port}.pid"
    fi
}

# 停止main-app服务器 (端口8080)
stop_server 8080 "万物可视化主平台"

# 停止GeneralVisualization服务器 (端口8081)
stop_server 8081 "传统可视化模块"

echo ""
echo "=================================================="
echo -e "${GREEN}🎉 所有服务器已停止！${NC}"
echo "=================================================="