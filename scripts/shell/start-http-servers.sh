#!/bin/bash

# 万物可视化项目 - HTTP服务器启动脚本
# 启动多个HTTP服务器用于前端测试

echo "🌐 启动万物可视化项目HTTP服务器..."

# 检查Python是否可用
if ! command -v python3 &> /dev/null; then
    echo "❌ 错误: 未找到Python3，请先安装Python3"
    exit 1
fi

# 定义颜色
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 定义端口和目录
declare -A SERVERS=(
    [8000]="."          # 主项目目录
    [8001]="frontend-v2" # 前端v2目录
    [8002]="main-app"    # 主应用目录
)

# 停止可能存在的服务器
echo "🛑 停止现有的服务器..."
pkill -f "python3 -m http.server" 2>/dev/null
sleep 2

# 启动服务器
for port in "${!SERVERS[@]}"; do
    directory="${SERVERS[$port]}"
    if [ ! -d "$directory" ]; then
        echo -e "${RED}❌ 目录不存在: $directory${NC}"
        continue
    fi

    echo -e "${BLUE}🚀 启动服务器端口 $port (目录: $directory)${NC}"
    cd "$directory" && python3 -m http.server "$port" --bind 0.0.0.0 &> /dev/null &
    SERVER_PID=$!

    # 等待服务器启动
    sleep 2
    if kill -0 $SERVER_PID 2>/dev/null; then
        echo -e "${GREEN}✅ 服务器 $port 启动成功 (PID: $SERVER_PID)${NC}"
    else
        echo -e "${RED}❌ 服务器 $port 启动失败${NC}"
    fi

    cd - > /dev/null
done

# 检查服务器状态
echo ""
echo "📊 服务器状态检查:"
sleep 1

for port in "${!SERVERS[@]}"; do
    if lsof -i :$port &> /dev/null; then
        echo -e "${GREEN}✅ 端口 $port: 正在运行${NC}"
    else
        echo -e "${RED}❌ 端口 $port: 未运行${NC}"
    fi
done

echo ""
echo "🎯 服务器访问地址:"
echo -e "${YELLOW}📁 主项目 (所有文件):${NC}     http://localhost:8000"
echo -e "${YELLOW}🎨 Frontend-v2:${NC}            http://localhost:8001"
echo -e "${YELLOW}🏗️  Main-app:${NC}                http://localhost:8002"
echo ""
echo -e "${YELLOW}🧮 MathJax测试页面:${NC}         http://localhost:8000/test-mathjax.html"
echo -e "${YELLOW}🚀 万物可视化主页面:${NC}         http://localhost:8001/"
echo -e "${YELLOW}📊 Main-app修复版:${NC}          http://localhost:8002/index-fixed.html"
echo ""
echo -e "${GREEN}🎉 所有服务器已启动！您可以在浏览器中访问上述地址进行测试。${NC}"
echo ""
echo -e "${BLUE}💡 提示:${NC}"
echo "  • 使用 './stop-http-servers.sh' 停止所有服务器"
echo "  • 使用 'lsof -i :8000,8001,8002' 查看服务器状态"
echo "  • 服务器支持所有设备的网络访问 (绑定到 0.0.0.0)"