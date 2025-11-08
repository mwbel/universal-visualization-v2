#!/bin/bash

# 快速测试命令集合
BASE_URL="http://localhost:9999/api/v2"

echo "🚀 万物可视化 v2.0 快速测试"
echo "============================"

# 选择测试类型
echo "请选择测试类型:"
echo "1. 基础连接测试"
echo "2. 模板功能测试"
echo "3. 生成功能测试"
echo "4. 前端访问测试"
echo "5. 运行完整测试"
echo "6. 查看服务器日志"

read -p "请输入选择 (1-6): " choice

case $choice in
    1)
        echo "🔌 基础连接测试..."
        curl -s "$BASE_URL/templates" | jq '.total'
        curl -s "$BASE_URL/health" 2>/dev/null || echo "健康检查端点不存在"
        ;;
    2)
        echo "📚 模板功能测试..."
        echo "获取所有模板:"
        curl -s "$BASE_URL/templates" | jq '.templates[] | {name, subject}'
        echo -e "\n搜索正态分布模板:"
        curl -s "$BASE_URL/templates/search?query=正态" | jq '.total'
        ;;
    3)
        echo "🎨 生成功能测试..."
        echo "开始生成正态分布..."
        curl -s -X POST "$BASE_URL/generate" \
          -H "Content-Type: application/json" \
          -d '{"prompt": "正态分布 均值2 标准差0.8"}' | jq .
        ;;
    4)
        echo "🌐 前端访问测试..."
        if command -v open &> /dev/null; then
            open "http://localhost:9999/frontend-v2/"
        elif command -v xdg-open &> /dev/null; then
            xdg-open "http://localhost:9999/frontend-v2/"
        else
            echo "请手动打开: http://localhost:9999/frontend-v2/"
        fi
        ;;
    5)
        echo "🧪 运行完整测试..."
        if command -v python3 &> /dev/null; then
            python3 test_system.py
        else
            echo "需要Python3来运行完整测试"
        fi
        ;;
    6)
        echo "📋 查看服务器日志..."
        echo "请查看运行main.py的终端输出"
        ;;
    *)
        echo "❌ 无效选择"
        ;;
esac