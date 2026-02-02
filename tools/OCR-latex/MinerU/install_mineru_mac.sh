#!/bin/bash

echo "Step 1: 创建 Python 虚拟环境"
python3 -m venv mineru-env
source mineru-env/bin/activate

echo " Step 2: 升级 pip/setuptools/wheel"
pip install --upgrade pip setuptools wheel

echo " Step 3: 克隆 MinerU 仓库"
if [ ! -d "MinerU" ]; then
    git clone https://github.com/alibaba/MinerU.git
fi
cd MinerU

echo " Step 4: 安装依赖 (CPU 版)"
pip install -r requirements.txt
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cpu

echo " Step 5: 测试运行 MinerU"
python mineru/main.py --input tests/examples/sample.pdf --output output.md

echo " 安装完成！请查看 MinerU/output.md 文件。"
