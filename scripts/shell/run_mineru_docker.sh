#!/bin/bash
# 使用 Docker 运行 MinerU（避免 ARM64 依赖问题）
# Docker 镜像使用 x86_64 架构，可以正常运行 MinerU

docker run --rm \
  -v "$(pwd)/书籍:/books" \
  -v "$(pwd)/output:/output" \
  --platform linux/amd64 \
  opendatalab/mineru:latest \
  mineru_cli /books/概率论与数理统计第五版盛骤-完整版.pdf \
  --output /output \
  --lang zh \
  --backend torch \
  --format markdown

echo "✓ OCR 完成！结果保存在 output/ 目录"
