#!/bin/bash
# PDF 章节分割工具 - Linux 快速部署脚本

echo "================================"
echo "PDF 章节分割工具 - 部署脚本"
echo "================================"
echo

# 检查 Python 版本
echo "1. 检查 Python 版本..."
python3 --version
if [ $? -ne 0 ]; then
    echo "✗ Python3 未安装，请先安装 Python 3.8+"
    exit 1
fi
echo "✓ Python 已安装"
echo

# 创建虚拟环境（推荐）
echo "2. 创建虚拟环境..."
python3 -m venv venv
source venv/bin/activate
echo "✓ 虚拟环境已创建"
echo

# 安装依赖
echo "3. 安装依赖..."
pip install --upgrade pip
pip install -r requirements.txt
echo "✓ 依赖安装完成"
echo

# 测试安装
echo "4. 测试安装..."
python3 -c "import fitz; print('✓ PyMuPDF 可用')"
python3 -c "from mineru.cli.common import do_parse; print('✓ MinerU 可用')"
echo

# 创建示例目录
echo "5. 创建示例目录..."
mkdir -p 书籍 output
echo "✓ 目录已创建"
echo

echo "================================"
echo "部署完成！"
echo "================================"
echo
echo "使用方法:"
echo
echo "  # 方式 1: OCR 识别（扫描版 PDF）"
echo "  python pdf_chapter_splitter.py 书籍/样本.pdf --ocr -o output/chapters"
echo
echo "  # 方式 2: 从目录提取（有内置目录的 PDF）"
echo "  python pdf_chapter_splitter.py 书籍/样本.pdf -o output/chapters"
echo
echo "详细文档: README_pdf_splitter.md"
