#!/bin/bash
# MinerU 模型下载和配置脚本 - Linux 服务器
# 适用于校园网服务器，避免 Mac ARM64 架构冲突

set -e

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║     MinerU 模型自动部署 - Linux 服务器版                    ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo

# 服务器信息
SERVER_USER="${SSH_USER:-mwu}"
SERVER_HOST="${SSH_HOST:-49.52.18.227}"
SERVER_PORT="${SSH_PORT:-22}"

echo "服务器配置:"
echo "  用户: $SERVER_USER"
echo "  主机: $SERVER_HOST"
echo "  端口: $SERVER_PORT"
echo

# 检查本地 MinerU（应该不工作）
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "步骤 1: 检查本地 Mac 环境"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo

echo "检查本地 MinerU..."
if python3 -c "from mineru.cli.common import do_parse" 2>/dev/null; then
    echo "✓ 本地 Mac 可以使用 MinerU"
else
    echo "✗ 本地 Mac 无法使用 MinerU（预期中的 ARM64 架构冲突）"
    echo "  这就是为什么我们需要在 Linux 服务器上运行"
fi

echo

# 连接到服务器
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "步骤 2: 连接到 Linux 服务器"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo

echo "正在连接服务器..."
if ssh -p $SERVER_PORT -o ConnectTimeout=10 $SERVER_USER@$SERVER_HOST "echo '连接成功'" 2>/dev/null; then
    echo "✓ 服务器连接成功"
else
    echo "❌ 无法连接到服务器"
    echo "请检查:"
    echo "  1. 是否在校园网内"
    echo "  2. 服务器地址是否正确: $SERVER_HOST"
    echo "  3. 用户名是否正确: $SERVER_USER"
    exit 1
fi

echo

# 在服务器上安装 MinerU
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "步骤 3: 在 Linux 服务器上安装 MinerU"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo

echo "安装 MinerU 及其依赖..."
ssh -p $SERVER_PORT $SERVER_USER@$SERVER_HOST << 'ENDSSH'
# 检查 Python 版本
echo "Python 版本:"
python3 --version

# 升级 pip
echo "升级 pip..."
pip3 install --user --upgrade pip

# 安装 MinerU
echo "安装 MinerU（这可能需要 2-5 分钟）..."
pip3 install --user mineru

# 验证安装
echo "验证 MinerU 安装..."
python3 -c "from mineru.cli.common import do_parse; print('✓ MinerU 安装成功')" || {
    echo "❌ MinerU 安装失败"
    echo "尝试使用国内镜像..."
    pip3 install --user -i https://pypi.tuna.tsinghua.edu.cn/simple mineru
}

# 检查 PyMuPDF
echo "检查 PyMuPDF..."
python3 -c "import fitz; print('✓ PyMuPDF 已安装')" || {
    echo "安装 PyMuPDF..."
    pip3 install --user pymupdf
}

echo "✓ 所有依赖安装完成"
ENDSSH

echo

# 创建工作目录
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "步骤 4: 创建工作目录"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo

ssh -p $SERVER_PORT $SERVER_USER@$SERVER_HOST << 'ENDSSH'
# 创建 PDF 分割工作目录
mkdir -p ~/pdf-splitter/{books,output,models}

# 显示目录结构
echo "✓ 工作目录已创建"
echo "目录结构:"
ls -lh ~/pdf-splitter/
ENDSSH

echo

# 上传分割脚本
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "步骤 5: 上传 PDF 分割脚本"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo

if [ -f "pdf_chapter_splitter.py" ]; then
    echo "上传分割脚本..."
    scp -P $SERVER_PORT pdf_chapter_splitter.py $SERVER_USER@$SERVER_HOST:~/pdf-splitter/
    echo "✓ 脚本已上传"
else
    echo "⚠️  未找到分割脚本，将在服务器上创建..."
fi

echo

# 测试 MinerU
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "步骤 6: 测试 MinerU 功能"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo

echo "测试 MinerU OCR 功能..."
ssh -p $SERVER_PORT $SERVER_USER@$SERVER_HOST << 'ENDSSH'
cat > ~/test_mineru.py << 'TESTEOF'
#!/usr/bin/env python3
import sys

print("测试 MinerU 组件...")

# 测试 1: 导入 MinerU
try:
    from mineru.cli.common import do_parse
    print("✓ MinerU 核心模块导入成功")
except Exception as e:
    print(f"✗ MinerU 导入失败: {e}")
    sys.exit(1)

# 测试 2: 检查 PyMuPDF
try:
    import fitz
    print("✓ PyMuPDF 可用")
except Exception as e:
    print(f"✗ PyMuPDF 不可用: {e}")
    sys.exit(1)

print("\n✓ 所有测试通过！MinerU 已准备好使用")
TESTEOF

python3 ~/test_mineru.py
rm ~/test_mineru.py
ENDSSH

echo

# 完成
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║              ✓ MinerU 部署完成！                              ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo
echo "下一步操作:"
echo
echo "1. 上传 PDF 文件到服务器:"
echo "   scp \"书籍/你的PDF.pdf\" $SERVER_USER@$SERVER_HOST:~/pdf-splitter/books/"
echo
echo "2. 在服务器上运行分割:"
echo "   ssh $SERVER_USER@$SERVER_HOST"
echo "   cd ~/pdf-splitter"
echo "   python3 pdf_chapter_splitter.py books/你的PDF.pdf --ocr -o output"
echo
echo "3. 下载结果:"
echo "   scp -r $SERVER_USER@$SERVER_HOST:~/pdf-splitter/output ./"
echo
echo "或使用 VS Code Remote-SSH 连接:"
echo "   code --remote ssh-remote+school-server"
echo
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
