#!/bin/bash

# 概率统计可视化 - 测试启动脚本
# 快速启动HTTP服务器并打开测试页面

echo "🚀 启动概率统计可视化测试环境..."
echo ""

# 检查端口是否被占用
PORT=8000
while lsof -Pi :$PORT -sTCP:LISTEN -t >/dev/null ; do
    echo "⚠️  端口 $PORT 已被占用，尝试下一个端口..."
    PORT=$((PORT + 1))
done

echo "✅ 使用端口: $PORT"
echo ""

# 启动HTTP服务器（后台运行）
echo "📡 启动HTTP服务器..."
if command -v python3 &> /dev/null; then
    python3 -m http.server $PORT > /dev/null 2>&1 &
    SERVER_PID=$!
    echo "✅ 服务器已启动 (PID: $SERVER_PID)"
elif command -v python &> /dev/null; then
    python -m SimpleHTTPServer $PORT > /dev/null 2>&1 &
    SERVER_PID=$!
    echo "✅ 服务器已启动 (PID: $SERVER_PID)"
elif command -v npx &> /dev/null; then
    npx http-server -p $PORT > /dev/null 2>&1 &
    SERVER_PID=$!
    echo "✅ 服务器已启动 (PID: $SERVER_PID)"
else
    echo "❌ 错误: 未找到Python或Node.js"
    echo "   请安装Python: brew install python3"
    exit 1
fi

# 等待服务器启动
sleep 2

echo ""
echo "🌐 服务器地址: http://localhost:$PORT"
echo ""

# 打开测试页面
echo "🧪 打开测试页面..."
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    open http://localhost:$PORT/quick-test.html
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    # Linux
    xdg-open http://localhost:$PORT/quick-test.html 2>/dev/null || \
    firefox http://localhost:$PORT/quick-test.html 2>/dev/null || \
    google-chrome http://localhost:$PORT/quick-test.html 2>/dev/null
else
    # Windows
    start http://localhost:$PORT/quick-test.html
fi

echo "✅ 测试页面已在浏览器中打开"
echo ""
echo "📋 可用页面:"
echo "   • 快速测试: http://localhost:$PORT/quick-test.html"
echo "   • 自动化测试: http://localhost:$PORT/test-all-pages.html"
echo "   • 主索引页: http://localhost:$PORT/index.html"
echo ""
echo "💡 提示:"
echo "   • 按 Ctrl+C 停止服务器"
echo "   • 或运行: kill $SERVER_PID"
echo ""

# 等待用户中断
trap "echo ''; echo '🛑 停止服务器...'; kill $SERVER_PID 2>/dev/null; exit 0" INT

# 保持运行
wait $SERVER_PID
