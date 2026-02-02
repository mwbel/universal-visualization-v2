#!/bin/bash
# 校园网服务器快速部署 - 使用指南
# 适用于：在校园网内，可直接访问服务器

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║          PDF 章节分割工具 - 校园网服务器部署指南              ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo

# ============================================
# 第一步：填写服务器信息
# ============================================
echo "📝 第一步：填写服务器信息"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo

# 让用户输入服务器信息
read -p "请输入服务器 IP 地址或域名: " SERVER_HOST
read -p "请输入 SSH 用户名: " SERVER_USER
read -p "请输入 SSH 端口（默认 22，直接回车）: " SERVER_PORT
SERVER_PORT=${SERVER_PORT:-22}

echo
echo "服务器配置:"
echo "  地址: $SERVER_USER@$SERVER_HOST:$SERVER_PORT"
echo

# 测试连接
echo "正在测试连接..."
if ssh -p $SERVER_PORT -o ConnectTimeout=5 $SERVER_USER@$SERVER_HOST "echo '连接成功'" 2>/dev/null; then
    echo "✓ 服务器连接成功"
else
    echo "❌ 无法连接到服务器"
    echo
    echo "请检查:"
    echo "  1. 服务器地址是否正确: $SERVER_HOST"
    echo "  2. 用户名是否正确: $SERVER_USER"
    echo "  3. 端口是否正确: $SERVER_PORT"
    echo "  4. 服务器是否正在运行"
    echo
    exit 1
fi

echo

# ============================================
# 第二步：选择部署方式
# ============================================
echo "📦 第二步：选择部署方式"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo
echo "请选择:"
echo "  1. 自动部署（推荐）"
echo "     - 自动安装所有依赖"
echo "     - 适合首次部署"
echo "     - 需要 10-15 分钟"
echo
echo "  2. 快速部署（如果已安装 Docker/Python）"
echo "     - 只安装必要的 Python 包"
echo "     - 需要 2-3 分钟"
echo
echo "  3. 测试连接（检查服务器环境）"
echo
read -p "请选择 (1/2/3): " CHOICE

echo

case $CHOICE in
    1)
        # ============================================
        # 自动部署
        # ============================================
        echo "🚀 开始自动部署..."
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo

        # 上传部署脚本
        echo "[1/5] 上传部署脚本..."
        scp -P $SERVER_PORT deploy_to_linux.sh $SERVER_USER@$SERVER_HOST:~/

        # 运行部署
        echo "[2/5] 在服务器上安装 Docker 和依赖..."
        echo "（这可能需要 5-10 分钟，请耐心等待）"
        ssh -p $SERVER_PORT $SERVER_USER@$SERVER_HOST "bash ~/deploy_to_linux.sh"

        echo "[3/5] 上传 PDF 文件..."
        if [ -f "书籍/概率论与数理统计第五版盛骤-完整版.pdf" ]; then
            scp -P $SERVER_PORT "书籍/概率论与数理统计第五版盛骤-完整版.pdf" \
                $SERVER_USER@$SERVER_HOST:~/pdf-splitter/books/
        else
            echo "⚠️  未找到 PDF 文件，请手动上传"
        fi

        echo "[4/5] 上传分割脚本..."
        scp -P $SERVER_PORT pdf_chapter_splitter.py $SERVER_USER@$SERVER_HOST:~/pdf-splitter/

        echo "[5/5] 运行 PDF 分割..."
        ssh -p $SERVER_PORT $SERVER_USER@$SERVER_HOST \
            "cd ~/pdf-splitter && python3 pdf_chapter_splitter.py books/概率论与数理统计第五版盛骤-完整版.pdf --ocr -o output"

        echo
        echo "✓ 自动部署完成！"
        ;;

    2)
        # ============================================
        # 快速部署
        # ============================================
        echo "⚡ 开始快速部署..."
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo

        # 只安装 Python 包
        echo "[1/3] 安装 Python 依赖..."
        ssh -p $SERVER_PORT $SERVER_USER@$SERVER_HOST \
            "pip3 install --user pymupdf mineru || pip3 install --user pymupdf mineru"

        echo "[2/3] 上传文件..."
        scp -P $SERVER_PORT pdf_chapter_splitter.py $SERVER_USER@$SERVER_HOST:~/
        if [ -f "书籍/概率论与数理统计第五版盛骤-完整版.pdf" ]; then
            scp -P $SERVER_PORT "书籍/概率论与数理统计第五版盛骤-完整版.pdf" \
                $SERVER_USER@$SERVER_HOST:~/book.pdf
        fi

        echo "[3/3] 运行分割..."
        ssh -p $SERVER_PORT $SERVER_USER@$SERVER_HOST \
            "python3 ~/pdf_chapter_splitter.py ~/book.pdf --ocr -o output"

        echo
        echo "✓ 快速部署完成！"
        ;;

    3)
        # ============================================
        # 测试连接
        # ============================================
        echo "🔍 检查服务器环境..."
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo

        echo "检查 Python3..."
        ssh -p $SERVER_PORT $SERVER_USER@$SERVER_HOST "python3 --version"

        echo "检查 Docker..."
        ssh -p $SERVER_PORT $SERVER_USER@$SERVER_HOST "docker --version || echo 'Docker 未安装'"

        echo "检查 PyMuPDF..."
        ssh -p $SERVER_PORT $SERVER_USER@$SERVER_HOST \
            "python3 -c 'import fitz; print(\"✓ PyMuPDF 已安装\")' 2>/dev/null || echo '✗ PyMuPDF 未安装'"

        echo "检查 MinerU..."
        ssh -p $SERVER_PORT $SERVER_USER@$SERVER_HOST \
            "python3 -c 'from mineru.cli.common import do_parse; print(\"✓ MinerU 已安装\")' 2>/dev/null || echo '✗ MinerU 未安装'"

        echo
        echo "✓ 环境检查完成"
        echo "根据检查结果选择合适的部署方式"
        exit 0
        ;;

    *)
        echo "无效选择"
        exit 1
        ;;
esac

echo

# ============================================
# 第三步：下载结果
# ============================================
echo "📥 第三步：下载结果"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo

read -p "是否下载结果到本地？(y/N): " DOWNLOAD

if [ "$DOWNLOAD" = "y" ] || [ "$DOWNLOAD" = "Y" ]; then
    echo "正在下载..."
    mkdir -p output_result

    if [ "$CHOICE" = "1" ]; then
        scp -r -P $SERVER_PORT $SERVER_USER@$SERVER_HOST:~/pdf-splitter/output/* ./output_result/
    else
        scp -r -P $SERVER_PORT $SERVER_USER@$SERVER_HOST:~/output/* ./output_result/
    fi

    echo
    echo "✓ 结果已下载到: ./output_result/"
    echo
    echo "生成的文件:"
    ls -lh output_result/
fi

echo
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║                     ✓ 部署完成！                              ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo
