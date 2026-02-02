#!/bin/bash
# PDF 章节分割工具 - Linux 服务器一键部署脚本
# 适用于: Ubuntu 20.04+, CentOS 8+, Debian 11+

set -e  # 遇到错误立即退出

echo "================================"
echo "PDF 章节分割工具 - Linux 服务器部署"
echo "================================"
echo

# 检测操作系统
if [ -f /etc/os-release ]; then
    . /etc/os-release
    OS=$NAME
    VERSION=$VERSION_ID
    echo "检测到操作系统: $OS $VERSION"
    echo
else
    echo "❌ 无法检测操作系统"
    exit 1
fi

# 步骤 1: 安装 Docker
echo "================================"
echo "步骤 1: 安装 Docker"
echo "================================"
echo

if command -v docker &> /dev/null; then
    echo "✓ Docker 已安装"
    docker --version
else
    echo "正在安装 Docker..."

    if [[ "$OS" =~ "Ubuntu" ]] || [[ "$OS" =~ "Debian" ]]; then
        # Ubuntu/Debian
        sudo apt-get update
        sudo apt-get install -y \
            ca-certificates \
            curl \
            gnupg \
            lsb-release

        sudo mkdir -p /etc/apt/keyrings
        curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg

        echo \
          "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
          $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

        sudo apt-get update
        sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

    elif [[ "$OS" =~ "CentOS" ]] || [[ "$OS" =~ "Red Hat" ]]; then
        # CentOS/RHEL
        sudo yum install -y yum-utils
        sudo yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo
        sudo yum install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
    fi

    # 启动 Docker
    sudo systemctl start docker
    sudo systemctl enable docker

    # 添加当前用户到 docker 组
    sudo usermod -aG docker $USER

    echo "✓ Docker 安装完成"
fi

echo

# 步骤 2: 安装 Python 和 pip
echo "================================"
echo "步骤 2: 安装 Python"
echo "================================"
echo

if command -v python3 &> /dev/null; then
    echo "✓ Python3 已安装"
    python3 --version
else
    echo "正在安装 Python3..."
    sudo apt-get install -y python3 python3-pip  # Ubuntu/Debian
    # sudo yum install -y python3 python3-pip  # CentOS
    echo "✓ Python3 安装完成"
fi

echo

# 步骤 3: 安装 Python 依赖
echo "================================"
echo "步骤 3: 安装 Python 依赖"
echo "================================"
echo

echo "安装 PyMuPDF..."
pip3 install --user pymupdf

echo "安装 MinerU (OCR)..."
pip3 install --user mineru

echo "✓ 依赖安装完成"

echo

# 步骤 4: 验证安装
echo "================================"
echo "步骤 4: 验证安装"
echo "================================"
echo

python3 -c "import fitz; print('✓ PyMuPDF 可用')" || echo "❌ PyMuPDF 安装失败"
python3 -c "from mineru.cli.common import do_parse; print('✓ MinerU 可用')" || echo "❌ MinerU 安装失败"
docker --version || echo "❌ Docker 不可用"

echo

# 步骤 5: 创建工作目录
echo "================================"
echo "步骤 5: 创建工作目录"
echo "================================"
echo

WORK_DIR="$HOME/pdf-splitter"
mkdir -p "$WORK_DIR"/{books,output}

echo "✓ 工作目录已创建: $WORK_DIR"
echo "  - 书籍目录: $WORK_DIR/books"
echo "  - 输出目录: $WORK_DIR/output"

echo

# 步骤 6: 下载脚本
echo "================================"
echo "步骤 6: 准备脚本"
echo "================================"
echo

cat > "$WORK_DIR/pdf_split.py" << 'EOF'
#!/usr/bin/env python3
"""
PDF 章节分割工具 - Linux 版本
"""
import sys
import json
import tempfile
from pathlib import Path
from typing import List, Dict
import fitz


class PDFChapterSplitter:
    def __init__(self, use_ocr: bool = True, ocr_backend: str = "torch"):
        self.use_ocr = use_ocr
        self.ocr_backend = ocr_backend
        self.mineru_available = self._check_mineru()

    def _check_mineru(self) -> bool:
        try:
            from mineru.cli.common import do_parse
            return True
        except ImportError:
            return False

    def split_by_chapters(self, pdf_path: str, output_dir: str, chapters: List[Dict]) -> Dict:
        pdf_path = Path(pdf_path)
        output_path = Path(output_dir)
        output_path.mkdir(parents=True, exist_ok=True)

        doc = fitz.open(str(pdf_path))
        results = []

        for i, chapter in enumerate(chapters, 1):
            start = chapter['page_start'] - 1
            end = chapter['page_end']

            new_doc = fitz.open()
            for page_num in range(start, end):
                new_doc.insert_pdf(doc, from_page=page_num)

            chapter_filename = f"{i:02d}_{chapter['title']}.pdf"
            chapter_path = output_path / chapter_filename
            new_doc.save(str(chapter_path))
            new_doc.close()

            results.append({
                'chapter_number': i,
                'title': chapter['title'],
                'file': chapter_filename,
                'page_start': chapter['page_start'],
                'page_end': chapter['page_end'],
                'page_count': end - start
            })

            print(f"✓ 生成: {chapter_filename}")

        doc.close()

        metadata = {
            'source_pdf': pdf_path.name,
            'total_chapters': len(chapters),
            'chapters': results
        }

        metadata_file = output_path / "metadata.json"
        with open(metadata_file, 'w', encoding='utf-8') as f:
            json.dump(metadata, f, ensure_ascii=False, indent=2)

        print(f"✓ 共分割为 {len(results)} 个章节文件")
        return metadata

    def detect_chapters_from_ocr(self, pdf_path: str) -> List[Dict]:
        if not self.mineru_available:
            raise RuntimeError("MinerU 不可用，请安装: pip install mineru")

        pdf_path = Path(pdf_path)
        print(f"正在使用 MinerU OCR 处理: {pdf_path.name}...")

        with tempfile.TemporaryDirectory() as temp_dir:
            with open(pdf_path, 'rb') as f:
                pdf_bytes = f.read()

            from mineru.cli.common import do_parse

            result = do_parse(
                output_dir=temp_dir,
                pdf_file_names=[pdf_path.name],
                pdf_bytes_list=[pdf_bytes],
                p_lang_list=['zh'],
                backend=self.ocr_backend,
                f_dump_md=True,
                f_dump_middle_json=True,
            )

            chapters = self._parse_ocr_results(temp_dir)
            return chapters

    def _parse_ocr_results(self, ocr_output_dir: str) -> List[Dict]:
        import re
        from pathlib import Path

        ocr_path = Path(ocr_output_dir)
        md_files = list(ocr_path.rglob("*.md"))

        if not md_files:
            raise RuntimeError("未找到 OCR 生成的 Markdown 文件")

        chapters = []

        for md_file in md_files:
            with open(md_file, 'r', encoding='utf-8') as f:
                content = f.read()

            lines = content.split('\n')
            current_page = 1

            for line in lines:
                line = line.strip()

                # 匹配章节标题
                match = re.match(r'^#\s+(第[一二三四五六七八九十\d]+章[^\n]*)', line)
                if match:
                    title = match.group(1)
                    chapters.append({
                        'title': title,
                        'level': 1,
                        'page_start': current_page,
                        'page_end': None
                    })

                # 更新页码
                if '\\newpage' in line or '---' in line:
                    current_page += 1

        # 计算页码范围
        if chapters:
            for i, ch in enumerate(chapters):
                if i < len(chapters) - 1:
                    ch['page_end'] = chapters[i + 1]['page_start'] - 1
                else:
                    ch['page_end'] = None  # 最后一章

        return chapters


def main():
    import argparse

    parser = argparse.ArgumentParser(description='PDF 书籍按章节分割工具')
    parser.add_argument('pdf_file', help='PDF 文件路径')
    parser.add_argument('-o', '--output', default='output', help='输出目录')
    parser.add_argument('--ocr', action='store_true', help='使用 OCR 识别章节')
    parser.add_argument('--backend', default='torch', choices=['torch', 'pipeline'],
                       help='OCR 后端')

    args = parser.parse_args()

    splitter = PDFChapterSplitter(use_ocr=args.ocr, ocr_backend=args.backend)

    print("="*80)
    print("步骤 1: 检测章节")
    print("="*80)

    if args.ocr:
        chapters = splitter.detect_chapters_from_ocr(args.pdf_file)
    else:
        print("⚠️  请使用 --ocr 参数进行 OCR 识别")
        sys.exit(1)

    if not chapters:
        print("\n⚠️  未检测到章节")
        sys.exit(1)

    print(f"\n✓ 检测到 {len(chapters)} 个章节")
    for i, ch in enumerate(chapters, 1):
        end_page = ch['page_end'] if ch['page_end'] else "最后一页"
        print(f"  {i}. {ch['title']} (第{ch['page_start']}-{end_page}页)")

    print("\n" + "="*80)
    print("步骤 2: 分割 PDF")
    print("="*80)

    result = splitter.split_by_chapters(args.pdf_file, args.output, chapters)

    print(f"\n✓ 完成！输出目录: {args.output}")


if __name__ == "__main__":
    main()
EOF

chmod +x "$WORK_DIR/pdf_split.py"

echo "✓ 脚本已创建: $WORK_DIR/pdf_split.py"

echo

# 完成
echo "================================"
echo "部署完成！"
echo "================================"
echo
echo "工作目录: $WORK_DIR"
echo
echo "使用方法:"
echo
echo "  1. 上传 PDF 文件到服务器:"
echo "     scp 书籍/你的PDF.pdf user@server:$WORK_DIR/books/"
echo
echo "  2. SSH 登录服务器:"
echo "     ssh user@server"
echo
echo "  3. 进入工作目录:"
echo "     cd $WORK_DIR"
echo
echo "  4. 运行分割:"
echo "     python3 pdf_split.py books/你的PDF.pdf --ocr -o output"
echo
echo "  5. 下载结果:"
echo "     scp -r user@server:$WORK_DIR/output ./"
echo
echo "================================"
