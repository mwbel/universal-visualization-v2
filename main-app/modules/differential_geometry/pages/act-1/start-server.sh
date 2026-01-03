#!/bin/bash

# 启动本地HTTP服务器来访问微分几何可视化页面

echo "======================================"
echo "微分几何可视化 - 本地服务器"
echo "======================================"
echo ""
echo "正在启动服务器..."
echo ""

# 进入包含页面的目录
cd "$(dirname "$0")"

# 启动Python HTTP服务器
if command -v python3 &> /dev/null; then
    echo "使用 Python 3 启动服务器..."
    echo "请在浏览器中访问: http://localhost:8080/chapter2.5-fundamental-forms.html"
    echo ""
    echo "按 Ctrl+C 停止服务器"
    echo ""
    python3 -m http.server 8080
elif command -v python &> /dev/null; then
    echo "使用 Python 2 启动服务器..."
    echo "请在浏览器中访问: http://localhost:8080/chapter2.5-fundamental-forms.html"
    echo ""
    echo "按 Ctrl+C 停止服务器"
    echo ""
    python -m SimpleHTTPServer 8080
elif command -v php &> /dev/null; then
    echo "使用 PHP 启动服务器..."
    echo "请在浏览器中访问: http://localhost:8080/chapter2.5-fundamental-forms.html"
    echo ""
    echo "按 Ctrl+C 停止服务器"
    echo ""
    php -S localhost:8080
else
    echo "错误: 未找到 Python 或 PHP"
    echo "请安装 Python 3 来运行本地服务器"
    exit 1
fi
