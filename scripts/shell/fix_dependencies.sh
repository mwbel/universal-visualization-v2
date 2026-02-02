#!/bin/bash
# 修复 MinerU 依赖库的 ARM64 架构问题

echo "正在修复 MinerU 依赖库..."

# 需要重新安装的包列表
packages=(
    "safetensors"
    "huggingface-hub"
    "transformers"
    "torch"
    "torchvision"
)

for pkg in "${packages[@]}"; do
    echo "正在重新安装 $pkg ..."
    pip3 install --user --force-reinstall --no-cache-dir "$pkg" 2>&1 | tail -5
done

echo "完成！"
