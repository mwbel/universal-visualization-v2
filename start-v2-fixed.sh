#!/bin/bash

# 万物可视化 V2 启动脚本
# 固定主页: http://localhost:3000/index.html

echo "🌌 万物可视化 V2 启动中..."
echo "📋 架构: 前端智能输入 + 后端AI Agent系统"
echo ""

# 颜色定义
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 检查端口是否被占用
check_port() {
    if lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null ; then
        echo -e "${YELLOW}⚠️  端口 $1 已被占用，尝试终止现有进程...${NC}"
        lsof -ti:$1 | xargs kill -9
        sleep 2
    fi
}

# 终止现有服务
echo "🔧 检查并清理现有服务..."
check_port 9999  # 后端API端口
check_port 3000  # 前端端口

# 启动后端服务
echo -e "${BLUE}🚀 启动后端API服务器 (端口 9999)...${NC}"
cd /Users/Min369/Documents/同步空间/Manju/Projects/AlVisualization/backend-v2
python3 main.py &
BACKEND_PID=$!

# 等待后端启动
echo "⏳ 等待后端服务启动..."
sleep 3

# 检查后端是否启动成功
if curl -s http://localhost:9999/docs > /dev/null; then
    echo -e "${GREEN}✅ 后端API服务启动成功${NC}"
else
    echo -e "${YELLOW}⚠️  后端服务可能仍在启动中...${NC}"
fi

# 启动前端服务
echo -e "${BLUE}🚀 启动前端HTTP服务器 (端口 3000)...${NC}"
cd /Users/Min369/Documents/同步空间/Manju/Projects/AlVisualization/frontend-v2
python3 -m http.server 3000 &
FRONTEND_PID=$!

# 等待前端启动
echo "⏳ 等待前端服务启动..."
sleep 2

# 显示启动信息
echo ""
echo "🎉 万物可视化 V2 启动完成！"
echo "════════════════════════════════════════"
echo -e "${GREEN}🏠 固定主页地址: http://localhost:3000/index.html${NC}"
echo -e "${BLUE}🔧 后端API文档: http://localhost:9999/docs${NC}"
echo -e "${BLUE}📊 后端状态监控: http://localhost:9999/api/v2/status${NC}"
echo "════════════════════════════════════════"
echo ""
echo "💡 使用提示:"
echo "  • 在主页输入自然语言描述可视化需求"
echo "  • 支持数学、天文、物理等多学科"
echo "  • 示例: '正态分布 均值0 标准差1'"
echo "  • 示例: '太阳系行星轨道运动'"
echo "  • 示例: '抛体运动 初速度20m/s'"
echo ""
echo "🛑 停止服务: Ctrl+C 或运行 ./stop-v2.sh"
echo ""

# 保存PID到文件
echo $BACKEND_PID > /tmp/viz-backend.pid
echo $FRONTEND_PID > /tmp/viz-frontend.pid

# 等待用户中断
trap 'echo ""; echo "🛑 正在停止服务..."; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; rm -f /tmp/viz-backend.pid /tmp/viz-frontend.pid; echo "✅ 服务已停止"; exit 0' INT

echo "✨ 服务正在运行中，按 Ctrl+C 停止..."
# 保持脚本运行
wait