#!/bin/bash
# OCR 章节检测 - 完整操作流程

echo "╔════════════════════════════════════════════════════════════╗"
echo "║     MinerU OCR 章节检测 - 操作指南                        ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# 检查代理
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "第 1 步：检查代理设置"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# 尝试检测常见代理端口
PROXY_PORT=""
for port in 7890 7891 1087 1080 8080 10808; do
    if (echo > /dev/tcp/localhost/$port) 2>/dev/null; then
        echo "✓ 发现代理端口: $port"
        PROXY_PORT=$port
        break
    fi
done

if [ -z "$PROXY_PORT" ]; then
    echo "⚠️  未检测到代理端口"
    echo ""
    echo "请先执行以下操作："
    echo "  1. 启动您的代理软件（Clash/V2Ray/Surge 等）"
    echo "  2. 确保系统代理已开启"
    echo "  3. 然后重新运行此脚本"
    echo ""
    exit 1
fi

# 设置代理环境变量
export http_proxy="http://127.0.0.1:$PROXY_PORT"
export https_proxy="http://127.0.0.1:$PROXY_PORT"
export HTTP_PROXY="http://127.0.0.1:$PROXY_PORT"
export HTTPS_PROXY="http://127.0.0.1:$PROXY_PORT"

echo "✓ 已设置代理: http://127.0.0.1:$PROXY_PORT"
echo ""

# 测试连接
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "第 2 步：测试 HuggingFace 连接"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if curl -I -m 10 https://huggingface.co > /dev/null 2>&1; then
    echo "✓ 成功连接 HuggingFace!"
else
    echo "✗ 无法连接 HuggingFace"
    echo ""
    echo "可能的问题："
    echo "  • 代理软件未启用系统代理"
    echo "  • 需要切换代理节点"
    echo "  • 防火墙阻止了连接"
    echo ""
    exit 1
fi

echo ""

# 激活虚拟环境
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "第 3 步：激活 Python 虚拟环境"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
VENV_PATH="$SCRIPT_DIR/.venv"

if [ ! -d "$VENV_PATH" ]; then
    echo "✗ 虚拟环境不存在: $VENV_PATH"
    exit 1
fi

source "$VENV_PATH/bin/activate"
echo "✓ 已激活虚拟环境: $VENV_PATH"
echo ""

# 运行 MinerU 章节检测
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "第 4 步：运行 MinerU 章节检测"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

PDF_PATH="/Users/Min369/Documents/同步空间/Manju/Projects/AlVisualization/书籍/概率论与数理统计第五版盛骤-完整版.pdf"

if [ ! -f "$PDF_PATH" ]; then
    echo "✗ PDF 文件不存在: $PDF_PATH"
    exit 1
fi

echo "处理文件: $(basename "$PDF_PATH")"
echo ""
echo "⏳ 开始处理（首次运行需要下载约 2GB 模型，请耐心等待）..."
echo ""

python3 "$SCRIPT_DIR/src/mineru_chapter_detector.py" "$PDF_PATH"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ 处理完成！"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
