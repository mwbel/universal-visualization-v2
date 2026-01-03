#!/bin/bash

# Manim 安装和渲染指南

echo "🎬 Manim 安装和动画渲染指南"
echo "=" * 60
echo ""

# 检查 Python
if ! command -v python3 &> /dev/null; then
    echo "❌ 错误: 需要先安装 Python 3"
    exit 1
fi

echo "✅ Python 版本: $(python3 --version)"
echo ""

# 方案 1: 使用 pip 安装（推荐）
echo "📦 安装 Manim..."
echo ""
echo "方案 1: 使用 pip 安装（推荐，最简单）"
echo "--------------------------------------"
echo "运行命令:"
echo "  pip3 install manim"
echo ""

# 方案 2: 使用 conda
echo "方案 2: 使用 conda（推荐用于虚拟环境）"
echo "--------------------------------------"
echo "运行命令:"
echo "  conda create -n manim-env python=3.9"
echo "  conda activate manim-env"
echo "  pip install manim"
echo ""

# 方案 3: 使用 Homebrew（macOS）
echo "方案 3: 使用 Homebrew（macOS）"
echo "--------------------------------------"
echo "运行命令:"
echo "  brew install manim"
echo ""

# 询问用户
echo "请选择安装方式:"
echo "1) pip3 install manim"
echo "2) conda + pip"
echo "3) Homebrew (macOS only)"
echo "4) 跳过，我自己安装"
echo ""
read -p "请输入选择 (1-4): " choice

case $choice in
    1)
        echo "📦 正在使用 pip3 安装 Manim..."
        pip3 install manim
        ;;
    2)
        echo "📦 正在创建 conda 环境..."
        conda create -n manim-env python=3.9 -y
        echo "✅ 环境创建成功"
        echo ""
        echo "请运行以下命令激活环境并安装 Manim:"
        echo "  conda activate manim-env"
        echo "  pip install manim"
        ;;
    3)
        if [[ "$OSTYPE" == "darwin"* ]]; then
            echo "📦 正在使用 Homebrew 安装 Manim..."
            brew install manim
        else
            echo "❌ Homebrew 只支持 macOS"
            exit 1
        fi
        ;;
    4)
        echo "⏭️  跳过安装"
        ;;
    *)
        echo "❌ 无效选择"
        exit 1
        ;;
esac

echo ""
echo "=" * 60
echo "📚 Manim 使用指南"
echo "=" * 60
echo ""
echo "安装完成后，你可以："
echo ""
echo "1. 渲染单个动画："
echo "   manim -pql output/animations/正弦.py SineAnimation"
echo ""
echo "2. 渲染所有生成的动画："
echo "   cd output/animations"
echo "   for file in *.py; do"
echo "     manim -pql \"$file\" Scene"
echo "   done"
echo ""
echo "3. 查看渲染的视频："
echo "   open output/media/videos/"
echo ""
echo "📖 命令说明："
echo "  -p: 预览（渲染后自动打开视频播放器）"
echo "  -q: 质量（l=低, m=中, h=高, k=超高）"
echo "  -l: 不渲染，最后预览"
echo ""
echo "✅ 安装完成！"
