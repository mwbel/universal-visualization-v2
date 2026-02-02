# 代理设置指南 - HuggingFace 模型下载

## 🌐 为什么需要代理？

HuggingFace (huggingface.co) 在中国大陆访问受限，需要通过代理服务器才能下载 OCR 模型。

## ✅ 快速设置步骤

### 步骤 1: 确保代理软件运行中

确保您的代理软件（如 Clash、V2Ray、Surge 等）正在运行，并已启用系统代理。

### 步骤 2: 使用自动配置脚本（推荐）

```bash
# 赋予执行权限
chmod +x setup_proxy.sh

# 运行代理配置脚本
./setup_proxy.sh
```

脚本会自动：
- ✓ 检测本地代理端口
- ✓ 设置环境变量
- ✓ 测试连接
- ✓ 提供下一步操作提示

### 步骤 3: 下载 OCR 模型

代理设置成功后，执行：

```bash
source .venv/bin/activate
python3 src/mineru_chapter_detector.py "概率论与数理统计第五版盛骤-完整版.pdf"
```

## 📋 手动设置代理

如果自动脚本不工作，可以手动设置：

### 方法 1: 临时设置（当前终端会话）

```bash
# 假设您的代理端口是 7890（Clash 默认）
export http_proxy="http://127.0.0.1:7890"
export https_proxy="http://127.0.0.1:7890"
export HTTP_PROXY="http://127.0.0.1:7890"
export HTTPS_PROXY="http://127.0.0.1:7890"

# 验证设置
echo $http_proxy
```

### 方法 2: 永久设置（添加到 shell 配置）

```bash
# 编辑配置文件
nano ~/.zshrc   # macOS 默认
# 或
nano ~/.bash_profile

# 添加以下内容（替换成您的代理端口）
export http_proxy="http://127.0.0.1:7890"
export https_proxy="http://127.0.0.1:7890"
export HTTP_PROXY="http://127.0.0.1:7890"
export HTTPS_PROXY="http://127.0.0.1:7890"

# 保存并重新加载配置
source ~/.zshrc
```

## 🔍 常见代理端口

| 代理软件 | HTTP 端口 | SOCKS5 端口 |
|---------|-----------|-------------|
| Clash   | 7890      | 7891        |
| V2Ray   | 10808     | 1080        |
| Shadowsocks | 1080  | 1080        |
| Surge   | 6152      | 6153        |

## 🧪 测试代理连接

### 测试 1: 检查环境变量

```bash
echo $http_proxy
echo $https_proxy
```

应该输出类似：`http://127.0.0.1:7890`

### 测试 2: 测试 HuggingFace 连接

```bash
curl -I https://huggingface.co
```

成功会返回 HTTP 200，失败会显示 timeout。

### 测试 3: 查看 Python 是否使用代理

```bash
python3 -c "import os; print(os.getenv('HTTP_PROXY'))"
```

## ❓ 常见问题

### Q1: 代理已开启，但还是连接超时？

**A**: 检查以下几点：
1. 确认代理软件的"系统代理"开关已打开
2. 确认代理软件的"允许局域网连接"已启用
3. 尝试在代理软件中切换节点
4. 检查防火墙是否阻止了连接

### Q2: 如何验证代理是否生效？

```bash
# 查看 IP 地址
curl https://api.ipify.org

# 应该显示代理服务器的 IP，而不是您的真实 IP
```

### Q3: 只想临时使用代理怎么办？

只运行"方法 1"中的命令即可，关闭终端后自动失效。

### Q4: 有些软件不支持代理怎么办？

对于这些软件，可以使用 **ProxyChains-NG**：

```bash
# 安装
brew install proxychains-ng

# 配置
sudo nano /opt/homebrew/etc/proxychains.conf
# 将 socks4 127.0.0.1 9050 改为:
# socks5 127.0.0.1 7891

# 使用
proxychains4 python3 src/mineru_chapter_detector.py "xxx.pdf"
```

## 🚀 一键操作流程

```bash
# 1. 启动代理软件（Clash/V2Ray 等）
# 2. 运行配置脚本
./setup_proxy.sh

# 3. 激活虚拟环境
source .venv/bin/activate

# 4. 下载模型并检测章节
python3 src/mineru_chapter_detector.py "概率论与数理统计第五版盛骤-完整版.pdf"
```

## 📝 注意事项

1. **安全性**：代理仅用于下载模型，不会传输敏感数据
2. **速度**：首次下载约 2GB，需要几分钟时间
3. **存储**：模型会缓存到 `~/.cache/huggingface/hub/`
4. **后续使用**：模型下载后，无需代理即可使用

## 🔄 取消代理

如果需要临时取消代理：

```bash
unset http_proxy
unset https_proxy
unset HTTP_PROXY
unset HTTPS_PROXY
unset ALL_PROXY
```

## 💡 其他方案

如果代理方案不便，还可以考虑：

### 方案 A: 使用 HuggingFace 镜像站

```bash
export HF_ENDPOINT=https://hf-mirror.com
```

### 方案 B: 手动下载模型

1. 从其他渠道下载模型文件
2. 放置到 `~/.cache/huggingface/hub/` 对应目录

### 方案 C: 使用手动配置章节

```bash
python3 src/manual_chapters.py --interactive
```

---

**最后更新**: 2026-01-30
**状态**: ✅ 需要代理才能下载 OCR 模型
