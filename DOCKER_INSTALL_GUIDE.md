# Docker 安装指南 - macOS ARM64

## 当前状态

✅ Homebrew 已安装
⚠️  Docker 安装遇到架构问题

---

## 推荐方案（按优先级）

### 🥇 方案 1: 修复 Lima 架构后使用 Colima（推荐）

**问题**: 当前 Lima 通过 Rosetta 运行（x86_64 模拟），需要原生 ARM64 版本

**解决步骤**:

```bash
# 1. 等待当前 Lima 重新安装完成
# 2. 验证架构
uname -m  # 应该显示 arm64

which brew
# 应该是 /opt/homebrew/bin/brew (ARM64)
# 而不是 /usr/local/bin/brew (x86_64)

# 3. 如果 Homebrew 在 /usr/local，需要重新安装 ARM64 版本
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# 4. 重新安装 Lima
brew install lima colima docker docker-compose

# 5. 启动 Colima
colima start

# 6. 验证
docker --version
docker run hello-world
```

**预计时间**: 10-20 分钟

---

### 🥈 方案 2: 使用 OrbStack（最快，最简单）

**OrbStack** 是专门为 macOS 设计的 Docker 替代品，比 Docker Desktop 更快、更轻量。

```bash
# 1. 使用 Homebrew 安装
brew install orbstack

# 2. 启动 OrbStack
open -a OrbStack

# 3. 验证
docker --version
docker run hello-world
```

**下载大小**: ~200 MB
**启动时间**: <5 秒
**内存占用**: ~500 MB（比 Docker Desktop 少 50%）

**优点**:
- ✅ 原生支持 Apple Silicon
- ✅ 安装简单，一行命令
- ✅ 启动速度快
- ✅ 资源占用少

---

### 🥉 方案 3: 手动下载 Docker Desktop

如果网络稳定，可以直接下载：

```bash
# 1. 访问 Docker 官网
open https://www.docker.com/products/docker-desktop/

# 2. 下载 "Apple Chip" 版本
#    注意：选择 Apple Chip，不是 Intel Chip

# 3. 双击下载的 Docker.dmg

# 4. 拖动 Docker 到 Applications

# 5. 启动 Docker
open -a Docker

# 6. 验证
docker --version
docker run hello-world
```

**下载大小**: ~1.2 GB
**预计时间**: 10-30 分钟（取决于网速）

---

### 🔧 方案 4: 在 Linux 服务器上运行（无本地资源占用）

如果你有 Linux 服务器访问权限：

```bash
# 1. SSH 连接到服务器
ssh user@linux-server

# 2. 安装 Docker
curl -fsSL https://get.docker.com | sh

# 3. 上传 PDF 文件
scp "书籍/概率论与数理统计第五版盛骤-完整版.pdf" user@server:/path/

# 4. 在服务器上运行
ssh user@linux-server
cd /path/
python pdf_chapter_splitter.py "概率论与数理统计第五版盛骤-完整版.pdf" --ocr -o output

# 5. 下载结果
scp -r user@linux-server:/path/output ./
```

**优点**:
- ✅ 不占用本地资源
- ✅ x86_64 架构，MinerU 完美运行
- ✅ 可以长时间运行大型任务

**缺点**:
- ❌ 需要 Linux 服务器访问权限
- ❌ 需要上传/下载文件

---

## 快速建议

### 如果你现在就想测试

**选择 OrbStack**（最快）:
```bash
brew install orbstack
open -a OrbStack
```

### 如果你想使用官方 Docker

**选择手动下载 Docker Desktop**:
- 访问：https://www.docker.com/products/docker-desktop/
- 下载 Apple Chip 版本

### 如果你有 Linux 服务器

**直接在服务器上运行**（推荐用于生产环境）

---

## 当前问题诊断

让我检查你的 Homebrew 配置：

```bash
# 检查 Homebrew 架构
brew config | grep arch

# 检查 Homebrew 路径
which brew

# 检查 Lima 架构
file $(which limactl)
```

**期望输出**:
```
arch: arm64
HOMEBREW_PREFIX: /opt/homebrew
which brew: /opt/homebrew/bin/brew
limactl: Mach-O 64-bit executable arm64
```

**如果有问题**:
```
arch: x86_64  # ❌ 错误
HOMEBREW_PREFIX: /usr/local  # ❌ 这是 x86_64 Homebrew
limactl: Mach-O 64-bit executable x86_64  # ❌ 错误
```

---

## 我的建议

基于当前情况，我建议：

**立即行动**: 安装 OrbStack（5分钟内可用）
```bash
brew install orbstack
open -a OrbStack
```

**长期规划**: 在 Linux 服务器上部署生产环境

---

**需要我帮你执行哪个方案？**
