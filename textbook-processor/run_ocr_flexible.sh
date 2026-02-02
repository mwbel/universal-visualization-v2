#!/bin/bash
# 灵活的代理设置脚本

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "MinerU OCR 检测 - 代理设置"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# 选项 1: 使用 HuggingFace 镜像（无需代理）
echo "选项 A: 使用 HuggingFace 镜像站"
echo "选项 B: 手动设置代理"
echo "选项 C: 直接尝试（可能失败）"
echo ""
read -p "请选择 (A/B/C): " choice

case "$choice" in
    A|a)
        echo ""
        echo "✓ 使用 HuggingFace 镜像: https://hf-mirror.com"
        export HF_ENDPOINT=https://hf-mirror.com
        ;;
    B|b)
        echo ""
        read -p "请输入代理端口 (例如 7890): " port
        if [ -z "$port" ]; then
            echo "✗ 未输入端口号"
            exit 1
        fi

        echo "✓ 设置代理: http://127.0.0.1:$port"
        export http_proxy="http://127.0.0.1:$port"
        export https_proxy="http://127.0.0.1:$port"
        export HTTP_PROXY="http://127.0.0.1:$port"
        export HTTPS_PROXY="http://127.0.0.1:$port"

        # 测试连接
        echo ""
        echo "测试连接..."
        if ! curl -I -m 5 https://huggingface.co > /dev/null 2>&1; then
            echo "✗ 无法连接 HuggingFace"
            echo "  请检查："
            echo "  1. 代理软件是否运行"
            echo "  2. 端口号是否正确"
            echo "  3. 系统代理是否开启"
            exit 1
        fi
        echo "✓ 连接成功!"
        ;;
    C|c)
        echo ""
        echo "⚠️  将直接尝试（不使用代理）"
        ;;
    *)
        echo "✗ 无效选择"
        exit 1
        ;;
esac

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "运行 MinerU 章节检测"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# 激活虚拟环境
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/.venv/bin/activate"

# 运行检测
python3 "$SCRIPT_DIR/src/mineru_chapter_detector.py" \
    "/Users/Min369/Documents/同步空间/Manju/Projects/AlVisualization/书籍/概率论与数理统计第五版盛骤-完整版.pdf"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ 完成!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
