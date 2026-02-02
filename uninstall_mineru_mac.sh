#!/bin/bash
# MinerU 完全卸载脚本 - macOS
# 清理所有 MinerU 相关的包和依赖

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║        MinerU 及依赖完全卸载 - macOS                          ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo

# 检查是否在 macOS 上
if [[ "$OSTYPE" != "darwin"* ]]; then
    echo "❌ 此脚本仅适用于 macOS"
    exit 1
fi

echo "当前系统: macOS"
echo "架构: $(uname -m)"
echo

# ============================================
# 步骤 1: 列出已安装的 MinerU 相关包
# ============================================
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "步骤 1: 检查已安装的 MinerU 相关包"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo

echo "使用 pip3 查找已安装的包..."
INSTALLED_PACKAGES=$(pip3 list 2>/dev/null | grep -i mineru || true)

if [ -n "$INSTALLED_PACKAGES" ]; then
    echo "找到以下 MinerU 相关包:"
    echo "$INSTALLED_PACKAGES"
else
    echo "未找到 MinerU 包"
fi

echo

# ============================================
# 步骤 2: 卸载 MinerU 主包
# ============================================
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "步骤 2: 卸载 MinerU"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo

echo "正在卸载 MinerU..."
pip3 uninstall -y mineru 2>/dev/null || echo "MinerU 未通过 pip3 安装"

echo "✓ MinerU 已卸载"
echo

# ============================================
# 步骤 3: 清理依赖包（可选）
# ============================================
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "步骤 3: 清理相关依赖"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo

# MinerU 的常见依赖
DEPENDENCIES=(
    "mineru[core]"
    "pypdfium2"
    "pdfminer"
    "unstructured-inference"
    "unstructured.py"
    "pillow-heif"
    "pyzbar"
)

echo "检查 MinerU 相关依赖..."
for pkg in "${DEPENDENCIES[@]}"; do
    if pip3 list | grep -q "$pkg"; then
        echo "  - 发现 $pkg"
    fi
done

echo
read -p "是否同时卸载这些依赖？(y/N): " UNINSTALL_DEPS

if [ "$UNINSTALL_DEPS" = "y" ] || [ "$UNINSTALL_DEPS" = "Y" ]; then
    echo "正在卸载依赖..."

    # 卸载依赖
    pip3 uninstall -y pypdfium2 2>/dev/null || true
    pip3 uninstall -y pdfminer 2>/dev/null || true
    pip3 uninstall -y unstructured-inference 2>/dev/null || true
    pip3 uninstall -y unstructured.py 2>/dev/null || true
    pip3 uninstall -y pillow-heif 2>/dev/null || true
    pip3 uninstall -y pyzbar 2>/dev/null || true

    echo "✓ 依赖已卸载"
else
    echo "跳过依赖卸载"
fi

echo

# ============================================
# 步骤 4: 清理 pip 缓存
# ============================================
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "步骤 4: 清理缓存"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo

echo "清理 pip 缓存..."
pip3 cache purge 2>/dev/null || echo "缓存清理完成"

echo

# ============================================
# 步骤 5: 检查并清理残留文件
# ============================================
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "步骤 5: 检查残留文件"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo

# 检查常见的残留位置
LOCATIONS=(
    "$HOME/.mineru"
    "$HOME/Library/Application Support/mineru"
    "$HOME/.cache/mineru"
    "/tmp/mineru-*"
)

FOUND_REMAINDERS=false

for location in "${LOCATIONS[@]}"; do
    if ls $location 2>/dev/null >/dev/null; then
        echo "发现残留文件: $location"
        FOUND_REMAINDERS=true

        read -p "是否删除？(y/N): " DELETE
        if [ "$DELETE" = "y" ] || [ "$DELETE" = "Y" ]; then
            rm -rf $location 2>/dev/null
            echo "  ✓ 已删除"
        fi
    fi
done

if [ "$FOUND_REMAINDERS" = false ]; then
    echo "✓ 未发现残留文件"
fi

echo

# ============================================
# 步骤 6: 验证卸载
# ============================================
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "步骤 6: 验证卸载"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo

echo "检查 MinerU 是否还存在..."
if python3 -c "import mineru" 2>/dev/null; then
    echo "⚠️  MinerU 仍然可导入"
    echo "可能需要手动清理"
else
    echo "✓ MinerU 已完全卸载"
fi

echo

# ============================================
# 完成
# ============================================
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║              ✓ MinerU 卸载完成！                              ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo
echo "下一步:"
echo "  1. 在 Linux 服务器上安装 MinerU"
echo "  2. 使用 VS Code Remote-SSH 连接到服务器"
echo "  3. 在服务器上运行 PDF 分割"
echo
echo "运行以下命令在服务器上安装:"
echo "  ssh mwu@49.52.18.227"
echo "  pip3 install --user mineru pymupdf"
echo
