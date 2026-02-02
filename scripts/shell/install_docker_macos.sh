#!/bin/bash
# Docker Desktop for Mac 安装脚本

echo "================================"
echo "Docker Desktop for Mac 安装向导"
echo "================================"
echo

# 检查是否已安装
if command -v docker &> /dev/null; then
    echo "✓ Docker 已安装"
    docker --version
    echo
    echo "是否要重新安装？(y/N)"
    read -r answer
    if [ "$answer" != "y" ] && [ "$answer" != "Y" ]; then
        echo "安装已取消"
        exit 0
    fi
fi

echo "选择安装方式:"
echo "1. 使用 Homebrew 安装（推荐，最快）"
echo "2. 手动下载安装（需要浏览器下载）"
echo
read -p "请选择 (1/2): " choice

case $choice in
    1)
        echo
        echo "正在使用 Homebrew 安装 Docker Desktop..."
        echo

        # 检查 Homebrew
        if ! command -v brew &> /dev/null; then
            echo "未检测到 Homebrew，正在安装..."
            /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
        fi

        # 安装 Docker Desktop
        echo "安装 Docker Desktop..."
        brew install --cask docker

        echo
        echo "✓ 安装完成！"
        echo "正在启动 Docker..."
        open -a Docker

        echo
        echo "等待 Docker 启动（约10-30秒）..."
        sleep 15

        # 验证安装
        if command -v docker &> /dev/null; then
            echo
            echo "================================"
            echo "✓ Docker 安装成功！"
            echo "================================"
            echo
            docker --version
            echo
            echo "运行 'docker info' 查看详细信息"
        else
            echo
            echo "⚠️  Docker 可能还在启动中，请稍等..."
            echo "可以在终端运行: docker --version"
        fi
        ;;

    2)
        echo
        echo "================================"
        echo "手动下载安装步骤"
        echo "================================"
        echo
        echo "1. 访问 Docker 官网："
        echo "   https://www.docker.com/products/docker-desktop/"
        echo
        echo "2. 点击 'Download for Mac'"
        echo
        echo "3. 选择 'Apple Chip' 版本（适用于 M1/M2/M3 Mac）"
        echo
        echo "4. 下载完成后，双击 Docker.dmg 文件"
        echo
        echo "5. 拖动 Docker 图标到 Applications 文件夹"
        echo
        echo "6. 从 Applications 启动 Docker"
        echo
        echo "7. 安装完成后，在终端运行："
        echo "   docker --version"
        echo

        # 自动打开下载页面
        echo "正在打开下载页面..."
        sleep 2
        open "https://www.docker.com/products/docker-desktop/"
        ;;

    *)
        echo "无效选择"
        exit 1
        ;;
esac

echo
echo "================================"
echo "安装后验证"
echo "================================"
echo
echo "运行以下命令验证安装："
echo
echo "  docker --version"
echo "  docker info"
echo "  docker run hello-world"
echo
echo "================================"
