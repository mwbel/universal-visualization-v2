#!/bin/bash

# 万物可视化项目 - HTTP服务器停止脚本
# 停止所有HTTP服务器

echo "🛑 停止万物可视化项目HTTP服务器..."

# 定义颜色
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 查找并停止所有Python HTTP服务器
echo -e "${BLUE}🔍 查找运行中的HTTP服务器...${NC}"

# 获取所有Python HTTP服务器的进程ID
SERVER_PIDS=$(pgrep -f "python3 -m http.server")

if [ -z "$SERVER_PIDS" ]; then
    echo -e "${YELLOW}⚠️  未找到运行中的Python HTTP服务器${NC}"
    exit 0
fi

echo -e "${YELLOW}📋 找到以下服务器进程:${NC}"
echo "$SERVER_PIDS" | while read pid; do
    if [ -n "$pid" ]; then
        # 获取进程详情
        CMD=$(ps -p $pid -o command= 2>/dev/null)
        echo -e "  ${BLUE}PID $pid:${NC} $CMD"
    fi
done

echo ""
echo -e "${RED}🛑 停止服务器...${NC}"

# 停止进程
echo "$SERVER_PIDS" | while read pid; do
    if [ -n "$pid" ] && kill -0 $pid 2>/dev/null; then
        kill $pid
        if kill -0 $pid 2>/dev/null; then
            # 如果进程仍在运行，强制杀死
            kill -9 $pid
            echo -e "${RED}⚡ 强制停止 PID $pid${NC}"
        else
            echo -e "${GREEN}✅ 优雅停止 PID $pid${NC}"
        fi
    fi
done

# 等待进程完全停止
sleep 2

# 验证服务器是否已停止
echo ""
echo -e "${BLUE}🔍 验证服务器状态...${NC}"

REMAINING_PIDS=$(pgrep -f "python3 -m http.server")
if [ -z "$REMAINING_PIDS" ]; then
    echo -e "${GREEN}✅ 所有HTTP服务器已成功停止${NC}"
else
    echo -e "${RED}❌ 仍有服务器在运行:${NC}"
    echo "$REMAINING_PIDS" | while read pid; do
        CMD=$(ps -p $pid -o command= 2>/dev/null)
        echo -e "  ${RED}PID $pid:${NC} $CMD"
    done
fi

# 检查端口占用
echo ""
echo -e "${BLUE}🔍 检查端口状态...${NC}"
PORTS="8000,8001,8002"

if lsof -i :$PORTS &> /dev/null; then
    echo -e "${YELLOW}⚠️  以下端口仍在使用:${NC}"
    lsof -i :$PORTS | grep LISTEN
else
    echo -e "${GREEN}✅ 所有端口已释放${NC}"
fi

echo ""
echo -e "${GREEN}🎉 HTTP服务器停止完成！${NC}"
echo -e "${BLUE}💡 提示:${NC} 使用 './start-http-servers.sh' 重新启动服务器"