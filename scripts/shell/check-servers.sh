#!/bin/bash

# 万物可视化项目 - HTTP服务器状态检查脚本
# 检查所有HTTP服务器状态

echo "🔍 万物可视化项目HTTP服务器状态检查..."

# 定义颜色
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# 定义服务器信息
SERVER_8000="主项目目录"
SERVER_8001="Frontend-v2"
SERVER_8002="Main-app"

echo -e "${BLUE}📊 服务器状态报告${NC}"
echo "=================================="

# 检查端口占用
echo ""
echo -e "${CYAN}🔌 端口占用状态:${NC}"
for port in 8000 8001 8002; do
    description="SERVER_$port"
    description="${!description}"

    if lsof -i :$port &> /dev/null; then
        # 获取占用端口的进程信息
        PID=$(lsof -ti :$port)
        if [ -n "$PID" ]; then
            CMD=$(ps -p $PID -o command= 2>/dev/null)
            echo -e "  ${GREEN}✅ 端口 $port ($description): 正在运行${NC}"
            echo -e "    ${CYAN}   PID: $PID${NC}"
            echo -e "    ${CYAN}   命令: $CMD${NC}"
        fi
    else
        echo -e "  ${RED}❌ 端口 $port ($description): 未运行${NC}"
    fi
done

# 检查HTTP响应
echo ""
echo -e "${CYAN}🌐 HTTP响应测试:${NC}"
for port in 8000 8001 8002; do
    description="SERVER_$port"
    description="${!description}"

    # 使用curl测试HTTP响应
    HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:$port/ 2>/dev/null)

    if [ "$HTTP_STATUS" = "200" ]; then
        echo -e "  ${GREEN}✅ http://localhost:$port/ - 状态码: $HTTP_STATUS${NC}"
    elif [ -n "$HTTP_STATUS" ] && [ "$HTTP_STATUS" != "000" ]; then
        echo -e "  ${YELLOW}⚠️  http://localhost:$port/ - 状态码: $HTTP_STATUS${NC}"
    else
        echo -e "  ${RED}❌ http://localhost:$port/ - 无响应${NC}"
    fi
done

# 检查特定页面
echo ""
echo -e "${CYAN}📄 重要页面访问测试:${NC}"

# 测试MathJax页面
MATHJAX_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8000/test-mathjax.html 2>/dev/null)
if [ "$MATHJAX_STATUS" = "200" ]; then
    echo -e "  ${GREEN}✅ MathJax测试页面 - 状态码: $MATHJAX_STATUS${NC}"
    echo -e "    ${CYAN}   访问: http://localhost:8000/test-mathjax.html${NC}"
else
    echo -e "  ${RED}❌ MathJax测试页面 - 状态码: $MATHJAX_STATUS${NC}"
fi

# 测试Frontend-v2主页面
FRONTEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8001/ 2>/dev/null)
if [ "$FRONTEND_STATUS" = "200" ]; then
    echo -e "  ${GREEN}✅ Frontend-v2主页 - 状态码: $FRONTEND_STATUS${NC}"
    echo -e "    ${CYAN}   访问: http://localhost:8001/${NC}"
else
    echo -e "  ${RED}❌ Frontend-v2主页 - 状态码: $FRONTEND_STATUS${NC}"
fi

# 测试Main-app页面
MAINAPP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8002/index-fixed.html 2>/dev/null)
if [ "$MAINAPP_STATUS" = "200" ]; then
    echo -e "  ${GREEN}✅ Main-app主页 - 状态码: $MAINAPP_STATUS${NC}"
    echo -e "    ${CYAN}   访问: http://localhost:8002/index-fixed.html${NC}"
else
    echo -e "  ${RED}❌ Main-app主页 - 状态码: $MAINAPP_STATUS${NC}"
fi

# 网络访问信息
echo ""
echo -e "${CYAN}🌍 网络访问地址:${NC}"
echo -e "  ${YELLOW}局域网访问 (替换IP为您的局域网IP):${NC}"
LOCAL_IP=$(ifconfig | grep "inet " | grep -v 127.0.0.1 | awk '{print $2}' | head -1)
for port in 8000 8001 8002; do
    description="SERVER_$port"
    description="${!description}"
    if lsof -i :$port &> /dev/null; then
        echo -e "    ${GREEN}• http://$LOCAL_IP:$port ($description)${NC}"
    fi
done

echo ""
echo -e "${BLUE}📋 快捷命令:${NC}"
echo -e "  ${CYAN}• 启动服务器:${NC}   ./start-http-servers.sh"
echo -e "  ${CYAN}• 停止服务器:${NC}   ./stop-http-servers.sh"
echo -e "  ${CYAN}• 检查状态:${NC}     ./check-servers.sh"

echo ""
echo -e "${GREEN}🎉 检查完成！${NC}"