#!/bin/bash
# 校园网服务器快速部署脚本

# 配置区域 - 请修改为你的服务器信息
SERVER_USER="your_username"      # SSH 用户名
SERVER_HOST="192.168.x.x"        # 服务器 IP
SERVER_PORT="22"                 # SSH 端口（默认 22）
SSH_KEY=""                       # SSH 密钥路径（如果有，留空则用密码）

# 本地文件路径
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEPLOY_SCRIPT="$SCRIPT_DIR/deploy_to_linux.sh"
PDF_FILE="$SCRIPT_DIR/书籍/概率论与数理统计第五版盛骤-完整版.pdf"
SPLITTER_SCRIPT="$SCRIPT_DIR/pdf_chapter_splitter.py"

echo "================================"
echo "PDF 章节分割工具 - 校园网服务器部署"
echo "================================"
echo
echo "服务器信息:"
echo "  地址: $SERVER_USER@$SERVER_HOST:$SERVER_PORT"
echo

# 检查本地文件
echo "检查本地文件..."
if [ ! -f "$DEPLOY_SCRIPT" ]; then
    echo "❌ 找不到部署脚本: $DEPLOY_SCRIPT"
    exit 1
fi

if [ ! -f "$PDF_FILE" ]; then
    echo "⚠️  找不到 PDF 文件: $PDF_FILE"
    echo "请检查路径，或手动上传"
fi

echo "✓ 本地文件检查完成"
echo

# 构建 SSH 命令
SSH_CMD="ssh"
if [ -n "$SSH_KEY" ]; then
    SSH_CMD="$SSH_CMD -i $SSH_KEY"
fi
SSH_CMD="$SSH_CMD -p $SERVER_PORT $SERVER_USER@$SERVER_HOST"

SCP_CMD="scp"
if [ -n "$SSH_KEY" ]; then
    SCP_CMD="$SCP_CMD -i $SSH_KEY"
fi
SCP_CMD="$SCP_CMD -P $SERVER_PORT"

# 步骤 1: 测试连接
echo "================================"
echo "步骤 1: 测试服务器连接"
echo "================================"
echo

echo "正在连接服务器..."
if $SSH_CMD "echo '连接成功'" > /dev/null 2>&1; then
    echo "✓ 服务器连接正常"
else
    echo "❌ 无法连接到服务器"
    echo "请检查:"
    echo "  1. 是否在校园网内或已连接 VPN"
    echo "  2. 服务器地址是否正确: $SERVER_HOST"
    echo "  3. 用户名是否正确: $SERVER_USER"
    exit 1
fi

echo

# 步骤 2: 上传文件
echo "================================"
echo "步骤 2: 上传文件到服务器"
echo "================================"
echo

echo "上传部署脚本..."
$SCP_CMD "$DEPLOY_SCRIPT" $SERVER_USER@$SERVER_HOST:~/
echo "✓ 部署脚本已上传"

if [ -f "$PDF_FILE" ]; then
    echo "上传 PDF 文件（可能需要几分钟）..."
    $SCP_CMD "$PDF_FILE" $SERVER_USER@$SERVER_HOST:~/book.pdf
    echo "✓ PDF 文件已上传"
fi

if [ -f "$SPLITTER_SCRIPT" ]; then
    echo "上传分割脚本..."
    $SCP_CMD "$SPLITTER_SCRIPT" $SERVER_USER@$SERVER_HOST:~/
    echo "✓ 分割脚本已上传"
fi

echo

# 步骤 3: 运行部署
echo "================================"
echo "步骤 3: 在服务器上部署环境"
echo "================================"
echo

echo "正在部署 Docker 和依赖..."
echo "（这可能需要 5-10 分钟，请耐心等待）"
echo

$SSH_CMD "bash ~/deploy_to_linux.sh"

echo
echo "✓ 环境部署完成"
echo

# 步骤 4: 运行 PDF 分割
if [ -f "$PDF_FILE" ]; then
    echo "================================"
    echo "步骤 4: 运行 PDF 分割"
    echo "================================"
    echo

    echo "开始处理 PDF（预计 5-15 分钟）..."
    echo

    $SSH_CMD "cd ~/pdf-splitter && python3 pdf_chapter_splitter.py ~/book.pdf --ocr -o output"

    echo
    echo "✓ PDF 处理完成"
fi

# 步骤 5: 下载结果
if [ -f "$PDF_FILE" ]; then
    echo "================================"
    echo "步骤 5: 下载结果到本地"
    echo "================================"
    echo

    mkdir -p "$SCRIPT_DIR/output_result"

    echo "下载分割后的文件..."
    $SCP_CMD -r $SERVER_USER@$SERVER_HOST:~/pdf-splitter/output/* "$SCRIPT_DIR/output_result/"

    echo
    echo "✓ 结果已下载到: $SCRIPT_DIR/output_result/"
    echo
    echo "生成文件:"
    ls -lh "$SCRIPT_DIR/output_result/"
fi

echo
echo "================================"
echo "✓ 全部完成！"
echo "================================"
