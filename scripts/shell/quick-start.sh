#!/bin/bash

# 万物可视化项目快速启动脚本
echo "🚀 万物可视化 - 快速启动"
echo "================================"

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 检查后端服务是否运行
echo -n "🔍 检查后端服务状态..."
if curl -s http://localhost:8000/health > /dev/null 2>&1; then
    echo -e " ${GREEN}✅ 后端服务正在运行${NC}"
else
    echo -e " ${YELLOW}⚠️ 后端服务未运行${NC}"
    echo -e "${BLUE}🔧 启动后端服务...${NC}"

    # 检查虚拟环境是否存在
    if [ ! -d "backend-env" ]; then
        echo -e "${YELLOW}📦 创建Python虚拟环境...${NC}"
        python3 -m venv backend-env
    fi

    # 激活虚拟环境并安装依赖
    echo -e "${BLUE}📥 安装依赖包...${NC}"
    source backend-env/bin/activate
    pip install fastapi uvicorn pydantic > /dev/null 2>&1

    # 启动后端服务
    echo -e "${GREEN}🚀 启动后端API服务...${NC}"
    source backend-env/bin/activate && python backend-api.py &
    BACKEND_PID=$!

    # 等待后端启动
    echo -n "⏳ 等待后端服务启动..."
    for i in {1..10}; do
        sleep 1
        echo -n "."
        if curl -s http://localhost:8000/health > /dev/null 2>&1; then
            echo -e " ${GREEN}✅ 启动成功!${NC}"
            break
        fi
    done

    if ! curl -s http://localhost:8000/health > /dev/null 2>&1; then
        echo -e " ${RED}❌ 后端服务启动失败${NC}"
        echo -e "${YELLOW}请手动运行: source backend-env/bin/activate && python backend-api.py${NC}"
    fi
fi

# 显示访问入口
echo ""
echo -e "${GREEN}🎯 访问入口:${NC}"
echo "================================"
echo -e "${BLUE}1. 启动中心:${NC} file://$(pwd)/START_HERE.html"
echo -e "${BLUE}2. 主应用:${NC}   file://$(pwd)/main-app/index.html"
echo -e "${BLUE}3. 集成测试:${NC} file://$(pwd)/test-visualization.html"
echo -e "${BLUE}4. 后端API:${NC}   http://localhost:8000"
echo -e "${BLUE}5. API文档:${NC}   http://localhost:8000/docs"
echo ""

# 快速测试
echo -e "${YELLOW}🧪 执行快速测试...${NC}"
echo -n "测试正态分布生成..."
RESPONSE=$(curl -s -X POST "http://localhost:8000/resolve_or_generate" \
    -H "Content-Type: application/json" \
    -d '{"prompt": "正态分布 均值0 标准差1", "vizType": "auto", "complexity": "中等", "params": {}}' 2>/dev/null)

if [[ $RESPONSE == *"success":true* ]]; then
    echo -e " ${GREEN}✅ 测试通过${NC}"
else
    echo -e " ${RED}❌ 测试失败${NC}"
fi

echo ""
echo -e "${GREEN}🎉 启动完成!${NC}"
echo -e "${YELLOW}💡 提示: 使用 Ctrl+C 停止后端服务${NC}"

# 保存后端进程ID以便后续停止
if [ ! -z "$BACKEND_PID" ]; then
    echo $BACKEND_PID > .backend.pid
    echo -e "${BLUE}📝 后端进程ID: $BACKEND_PID${NC}"
fi