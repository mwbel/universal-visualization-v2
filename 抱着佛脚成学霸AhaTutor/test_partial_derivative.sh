#!/bin/bash

# 测试脚本：验证"偏导数"概念的修复
# 使用方法: bash test_partial_derivative.sh

echo "╔════════════════════════════════════════════════════════════╗"
echo "║          测试"偏导数"概念生成功能                          ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# 颜色定义
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 测试计数
PASSED=0
FAILED=0

# 测试函数
test_service() {
    local service_name=$1
    local port=$2
    local endpoint=$3

    echo -e "${YELLOW}测试 ${service_name}...${NC}"

    response=$(curl -s "http://localhost:${port}${endpoint}")

    if [ $? -eq 0 ] && [ ! -z "$response" ]; then
        echo -e "${GREEN}✓ ${service_name} 运行正常${NC}"
        ((PASSED++))
        return 0
    else
        echo -e "${RED}✗ ${service_name} 无响应${NC}"
        ((FAILED++))
        return 1
    fi
}

# 测试 1: 检查服务健康状态
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "测试 1: 服务健康检查"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

test_service "Concept2Animation" 8002 "/health"
test_service "Math2Manim" 8003 "/health"

echo ""

# 测试 2: 概念分析
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "测试 2: 概念分析（偏导数）"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

analysis=$(curl -s "http://localhost:8003/analyze?concept=偏导数")

if echo "$analysis" | grep -q "success.*true"; then
    echo -e "${GREEN}✓ 概念分析成功${NC}"

    # 提取关键信息
    type=$(echo "$analysis" | python3 -c "import sys, json; print(json.load(sys.stdin).get('type', 'N/A'))" 2>/dev/null)
    difficulty=$(echo "$analysis" | python3 -c "import sys, json; print(json.load(sys.stdin).get('difficulty', 'N/A'))" 2>/dev/null)
    prerequisites=$(echo "$analysis" | python3 -c "import sys, json; print(', '.join(json.load(sys.stdin).get('prerequisites', [])))" 2>/dev/null)

    echo "  类型: $type"
    echo "  难度: $difficulty"
    echo "  前置知识: $prerequisites"
    ((PASSED++))
else
    echo -e "${RED}✗ 概念分析失败${NC}"
    ((FAILED++))
fi

echo ""

# 测试 3: 知识树生成
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "测试 3: 知识树生成"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

tree_result=$(curl -s -X POST http://localhost:8003/generate \
  -H "Content-Type: application/json" \
  -d '{"concept": "偏导数", "quality": "l", "build_tree": true}')

if echo "$tree_result" | grep -q "success.*true"; then
    echo -e "${GREEN}✓ 知识树生成成功${NC}"

    # 提取学习路径
    path_length=$(echo "$tree_result" | python3 -c "import sys, json; print(len(json.load(sys.stdin).get('learning_path', [])))" 2>/dev/null)
    learning_path=$(echo "$tree_result" | python3 -c "import sys, json; print(' → '.join(json.load(sys.stdin).get('learning_path', [])[:5]))" 2>/dev/null)

    echo "  知识树节点数: $path_length"
    echo "  学习路径（前5个）: $learning_path ..."

    if [ "$path_length" -gt 1 ]; then
        echo -e "${GREEN}✓ 知识树包含多个节点（修复成功）${NC}"
        ((PASSED++))
    else
        echo -e "${RED}✗ 知识树只有一个节点（修复失败）${NC}"
        ((FAILED++))
    fi
else
    echo -e "${RED}✗ 知识树生成失败${NC}"
    ((FAILED++))
fi

echo ""

# 测试 4: 视频代码生成
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "测试 4: 视频代码生成"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

code_result=$(curl -s -X POST http://localhost:8002/generate \
  -H "Content-Type: application/json" \
  -d '{"concept": "偏导数", "quality": "l", "style": "simple"}')

if echo "$code_result" | grep -q "success.*true"; then
    echo -e "${GREEN}✓ 视频代码生成成功${NC}"

    # 提取代码长度
    code_length=$(echo "$code_result" | python3 -c "import sys, json; print(len(json.load(sys.stdin).get('code', '')))" 2>/dev/null)
    video_path=$(echo "$code_result" | python3 -c "import sys, json; print(json.load(sys.stdin).get('video_path', 'N/A'))" 2>/dev/null)

    echo "  代码长度: $code_length 字符"
    echo "  视频路径: $video_path"

    if [ "$code_length" -gt 500 ]; then
        echo -e "${GREEN}✓ 代码包含完整内容（修复成功）${NC}"
        ((PASSED++))
    else
        echo -e "${RED}✗ 代码过短，可能只有标题（修复失败）${NC}"
        ((FAILED++))
    fi
else
    echo -e "${RED}✗ 视频代码生成失败${NC}"
    ((FAILED++))
fi

echo ""

# 测试总结
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "测试总结"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

TOTAL=$((PASSED + FAILED))
echo "总测试数: $TOTAL"
echo -e "${GREEN}通过: $PASSED${NC}"
echo -e "${RED}失败: $FAILED${NC}"

echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║                  🎉 所有测试通过！ 🎉                      ║${NC}"
    echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"
    exit 0
else
    echo -e "${RED}╔════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${RED}║                  ⚠️  部分测试失败  ⚠️                      ║${NC}"
    echo -e "${RED}╚════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo "请检查："
    echo "1. 服务是否正常运行"
    echo "2. 端口 8002 和 8003 是否被占用"
    echo "3. 查看服务日志获取详细错误信息"
    exit 1
fi
