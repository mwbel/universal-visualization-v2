#!/bin/bash
# 代理设置和测试脚本

echo "================================================"
echo "HuggingFace 代理配置助手"
echo "================================================"
echo ""

# 检测常见的代理端口
echo "1️⃣  检测本地代理端口..."
FOUND_PROXY=""
for port in 7890 7891 1087 1080 8080 10808; do
    if nc -z localhost $port 2>/dev/null; then
        echo "  ✓ 发现代理端口: $port"
        FOUND_PROXY=$port
    fi
done

if [ -z "$FOUND_PROXY" ]; then
    echo "  ✗ 未发现常见的代理端口"
    echo ""
    echo "请先启动您的代理软件（如 Clash、V2Ray 等），然后重新运行此脚本"
    echo ""
    echo "常见代理端口："
    echo "  - Clash: 7890 (HTTP) / 7891 (SOCKS5)"
    echo "  - V2Ray: 10808 (HTTP) / 1080 (SOCKS5)"
    exit 1
fi

echo ""
echo "2️⃣  设置环境变量代理..."

# 设置临时代理（仅在当前 shell 有效）
export http_proxy="http://127.0.0.1:$FOUND_PROXY"
export https_proxy="http://127.0.0.1:$FOUND_PROXY"
export HTTP_PROXY="http://127.0.0.1:$FOUND_PROXY"
export HTTPS_PROXY="http://127.0.0.1:$FOUND_PROXY"
export ALL_PROXY="socks5://127.0.0.1:$FOUND_PROXY"
export no_proxy="localhost,127.0.0.1,localaddress,.local.com.cn"

echo "  ✓ 已设置代理: http://127.0.0.1:$FOUND_PROXY"
echo ""

# 测试连接
echo "3️⃣  测试 HuggingFace 连接..."
if curl -I -m 10 --proxy "$http_proxy" https://huggingface.co > /dev/null 2>&1; then
    echo "  ✓ 成功连接 HuggingFace!"
    echo ""
    echo "4️⃣  现在可以下载 OCR 模型了！"
    echo ""
    echo "执行以下命令："
    echo ""
    echo "  source .venv/bin/activate"
    echo "  python3 src/mineru_chapter_detector.py \"概率论与数理统计第五版盛骤-完整版.pdf\""
    echo ""
else
    echo "  ✗ 代理连接失败"
    echo ""
    echo "可能的原因："
    echo "  1. 代理软件未启用系统代理"
    echo "  2. 代理端口不正确"
    echo "  3. 需要在代理软件中允许局域网连接"
    echo ""
    echo "请检查代理软件设置后重试"
    exit 1
fi

echo "提示：这些代理设置仅在当前终端会话有效"
echo "如需永久设置，请将以下内容添加到 ~/.zshrc 或 ~/.bash_profile："
echo ""
echo "  export http_proxy=http://127.0.0.1:$FOUND_PROXY"
echo "  export https_proxy=http://127.0.0.1:$FOUND_PROXY"
