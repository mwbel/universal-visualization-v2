#!/bin/bash

# 万物可视化平台本地服务器启动脚本
# Author: Claude Code Assistant
# Date: $(date)

echo "🚀 启动万物可视化平台本地服务器..."
echo "=================================================="

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 函数：检查端口是否被占用
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        echo -e "${YELLOW}⚠️  端口 $port 已被占用${NC}"
        return 1
    else
        return 0
    fi
}

# 函数：启动服务器
start_server() {
    local port=$1
    local path=$2
    local name=$3

    echo -e "${BLUE}📂 启动 $name 服务器...${NC}"
    echo "   路径: $path"
    echo "   端口: $port"

    if check_port $port; then
        cd "$path"
        python3 -m http.server $port --bind 127.0.0.1 &
        local pid=$!
        echo -e "${GREEN}✅ $name 服务器已启动 (PID: $pid)${NC}"
        echo "   访问地址: http://127.0.0.1:$port/"
        echo $pid > "/tmp/visual_server_${port}.pid"
        return 0
    else
        echo -e "${RED}❌ 无法启动 $name 服务器，端口 $port 被占用${NC}"
        return 1
    fi
}

# 检查Python3是否安装
if ! command -v python3 &> /dev/null; then
    echo -e "${RED}❌ Python3 未安装，请先安装 Python3${NC}"
    exit 1
fi

# 启动main-app服务器 (主平台)
echo ""
start_server 8080 "/Users/Min369/Documents/同步空间/Manju/Projects/AlVisualization/main-app" "万物可视化主平台"

# 启动GeneralVisualization服务器 (传统版本)
echo ""
start_server 8081 "/Users/Min369/Documents/同步空间/Manju/Projects/AlVisualization/GeneralVisualization" "传统可视化模块"

echo ""
echo "=================================================="
echo -e "${GREEN}🎉 服务器启动完成！${NC}"
echo ""
echo -e "${BLUE}📱 访问地址：${NC}"
echo -e "  🌟 ${GREEN}主平台 (推荐):${NC} http://127.0.0.1:8080/"
echo -e "  📚 传统版本:${NC}         http://127.0.0.1:8081/"
echo ""
echo -e "${BLUE}🔗 直接模块访问：${NC}"
echo -e "  🌌 天文学模块:${NC}       http://127.0.0.1:8081/app/modules/astronomy/"
echo -e "  ⚛️  物理学模块:${NC}       http://127.0.0.1:8081/app/modules/physics/"
echo -e "  📊 线性代数:${NC}         http://127.0.0.1:8081/app/modules/linear_algebra/"
echo -e "  🎲 概率统计:${NC}         http://127.0.0.1:8081/app/modules/probability_statistics/"
echo ""
echo -e "${YELLOW}💡 提示：${NC}"
echo -e "  • 使用 ${GREEN}Ctrl+C${NC} 停止当前脚本显示"
echo -e "  • 运行 ${GREEN}./stop_servers.sh${NC} 停止所有服务器"
echo -e "  • 在浏览器中打开上述地址开始体验"
echo ""
echo -e "${GREEN}🚀 享受可视化探索之旅！${NC}"
echo "=================================================="

# 等待用户中断
trap 'echo -e "\n${YELLOW}🛑 正在停止服务器...${NC}"; ./stop_servers.sh; exit 0' INT

# 保持脚本运行
while true; do
    sleep 1
done