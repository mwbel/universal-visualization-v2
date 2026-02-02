# Linux 服务器部署 - 完整指南

## 📋 目录
1. [一键部署](#一键部署)
2. [手动部署](#手动部署)
3. [使用方法](#使用方法)
4. [常见问题](#常见问题)

---

## 一键部署

### 步骤 1: 上传部署脚本

在你的 **本地 Mac** 上执行：

```bash
# 给脚本添加执行权限
chmod +x deploy_to_linux.sh

# 上传到服务器（替换为你的服务器信息）
scp deploy_to_linux.sh user@your-server-ip:~/
```

### 步骤 2: 在服务器上运行部署

```bash
# SSH 登录服务器
ssh user@your-server-ip

# 运行部署脚本
bash deploy_to_linux.sh
```

**部署脚本会自动完成**：
- ✅ 安装 Docker
- ✅ 安装 Python3 和 pip
- ✅ 安装 PyMuPDF
- ✅ 安装 MinerU
- ✅ 创建工作目录
- ✅ 生成 PDF 分割脚本

---

## 手动部署

如果一键脚本有问题，可以手动执行：

### 1. 安装 Docker

**Ubuntu/Debian**:
```bash
sudo apt-get update
sudo apt-get install -y ca-certificates curl gnupg
sudo mkdir -p /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo apt-get install -y docker-ce docker-ce-cli containerd.io
sudo systemctl start docker
sudo systemctl enable docker
```

**CentOS/RHEL**:
```bash
sudo yum install -y yum-utils
sudo yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo
sudo yum install -y docker-ce docker-ce-cli containerd.io
sudo systemctl start docker
sudo systemctl enable docker
```

### 2. 安装 Python 依赖

```bash
# 安装 Python3（如果未安装）
sudo apt-get install -y python3 python3-pip

# 安装 PyMuPDF 和 MinerU
pip3 install --user pymupdf mineru
```

### 3. 创建工作目录

```bash
mkdir -p ~/pdf-splitter/{books,output}
cd ~/pdf-splitter
```

### 4. 上传 PDF 分割脚本

在你的 Mac 上执行（我已经为你准备好了 `pdf_chapter_splitter.py`）：

```bash
scp pdf_chapter_splitter.py user@server:~/pdf-splitter/
```

---

## 使用方法

### 完整工作流程

#### 1. 上传 PDF 到服务器

在你的 Mac 上：

```bash
# 上传概率论教材
scp "书籍/概率论与数理统计第五版盛骤-完整版.pdf" \
    user@your-server-ip:~/pdf-splitter/books/
```

#### 2. 在服务器上运行 OCR 分割

SSH 登录服务器：

```bash
ssh user@your-server-ip
cd ~/pdf-splitter
```

运行分割：

```bash
# 使用 OCR 识别并分割（推荐）
python3 pdf_chapter_splitter.py \
    "books/概率论与数理统计第五版盛骤-完整版.pdf" \
    --ocr \
    -o output
```

**预计时间**：
- 525页的 PDF
- 大约需要 **5-15 分钟**
- 取决于服务器性能

#### 3. 下载结果到本地

在你的 Mac 上：

```bash
# 下载所有分割后的文件
scp -r user@your-server-ip:~/pdf-splitter/output ./output_result

# 或者只下载元数据查看
scp user@your-server-ip:~/pdf-splitter/output/metadata.json ./
```

---

## 高级用法

### 只识别章节，不分割

```bash
python3 pdf_chapter_splitter.py books/sample.pdf --ocr
```

### 指定 OCR 后端

```bash
# 使用 torch 后端（更准确，默认）
python3 pdf_chapter_splitter.py books/sample.pdf --ocr --backend torch

# 使用 pipeline 后端（更快）
python3 pdf_chapter_splitter.py books/sample.pdf --ocr --backend pipeline
```

### 批量处理多个 PDF

```bash
# 创建批处理脚本
cat > batch_split.sh << 'EOF'
#!/bin/bash
for pdf in books/*.pdf; do
    echo "处理: $pdf"
    python3 pdf_chapter_splitter.py "$pdf" --ocr -o "output/$(basename $pdf .pdf)"
done
EOF

chmod +x batch_split.sh
./batch_split.sh
```

---

## 常见问题

### Q1: MinerU 安装失败

**问题**: `ImportError: No module named 'mineru'`

**解决**:
```bash
pip3 install --user mineru
```

### Q2: Docker 权限问题

**问题**: `Permission denied when trying to connect to the Docker daemon`

**解决**:
```bash
# 添加用户到 docker 组
sudo usermod -aG docker $USER

# 重新登录或执行
newgrp docker
```

### Q3: OCR 识别不准确

**解决**: 尝试不同的后端
```bash
# 尝试 torch 后端（更准确但更慢）
python3 pdf_chapter_splitter.py book.pdf --ocr --backend torch
```

### Q4: 内存不足

**问题**: 处理大文件时内存溢出

**解决**:
```bash
# 创建交换空间
sudo fallocate -l 4G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
```

### Q5: 网络连接问题

**问题**: 无法下载 MinerU 或依赖包

**解决**: 使用国内镜像
```bash
pip3 install --user -i https://pypi.tuna.tsinghua.edu.cn/simple pymupdf mineru
```

---

## 性能优化建议

### 1. 使用 GPU 加速（如果有）

```bash
# 安装 GPU 版本的依赖
pip3 install --user torch torchvision --index-url https://download.pytorch.org/whl/cu118
```

### 2. 限制 CPU 使用

```bash
# 使用 nice 降低优先级
nice -n 19 python3 pdf_chapter_splitter.py book.pdf --ocr -o output
```

### 3. 后台运行

```bash
# 使用 nohup 后台运行
nohup python3 pdf_chapter_splitter.py book.pdf --ocr -o output > split.log 2>&1 &

# 查看进度
tail -f split.log
```

---

## 服务器配置建议

### 最低配置

- CPU: 2 核
- 内存: 4 GB
- 磁盘: 20 GB
- 系统: Ubuntu 20.04+ / CentOS 8+

### 推荐配置

- CPU: 4 核+
- 内存: 8 GB+
- 磁盘: 50 GB+
- 系统: Ubuntu 22.04 LTS

---

## 成本估算（云服务器）

### 阿里云/腾讯云

| 配置 | 价格 | 适合场景 |
|-----|------|---------|
| 2核4GB | ¥30-50/月 | 轻度使用，偶尔处理 |
| 4核8GB | ¥60-100/月 | 中度使用，经常处理 |
| 8核16GB | ¥150-200/月 | 重度使用，批量处理 |

### 按需付费（推荐）

如果只是偶尔使用：
- 使用按量付费
- 用完即删
- 成本更低

---

## 快速测试

### 测试 MinerU 是否正常

```bash
python3 -c "from mineru.cli.common import do_parse; print('✓ MinerU 可用')"
```

### 测试 PyMuPDF 是否正常

```bash
python3 -c "import fitz; print('✓ PyMuPDF 可用')"
```

### 测试小文件

先用小文件测试（几页的 PDF）：
```bash
python3 pdf_chapter_splitter.py small.pdf --ocr -o test_output
```

---

## 总结

### ✅ 优势

- 无需本地安装任何依赖
- Linux x86_64 架构完美支持 MinerU
- 不占用本地资源
- 可以长时间运行大型任务
- 可以使用云服务器按需付费

### ⏱️ 时间估算

**首次部署**: 10-20 分钟（包括安装依赖）
**后续使用**: 上传 + 处理 + 下载，约 20-30 分钟

### 🎯 下一步

1. 选择云服务器（阿里云/腾讯云/AWS）
2. 执行一键部署脚本
3. 上传 PDF 并运行分割
4. 下载结果

---

**准备好开始了吗？告诉我你的服务器信息，我可以帮你定制部署命令！**
