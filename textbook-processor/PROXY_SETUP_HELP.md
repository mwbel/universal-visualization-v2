# 如何设置代理并运行 OCR 检测

## 🚀 快速步骤

### 第 1 步：启动代理软件

请先启动您的代理软件，并确保"系统代理"已开启：

**Clash 用户：**
1. 打开 Clash 应用
2. 确保主开关是绿色（已启用）
3. 确保设置了代理模式（规则模式/全局模式）
4. 默认端口：7890

**V2Ray 用户：**
1. 启动 V2Ray
2. 确保系统代理已开启
3. 默认端口：10808

**其他代理软件：**
- 查看设置中的端口号
- 确保启用系统代理

---

### 第 2 步：验证代理

打开新的终端窗口，运行：

```bash
# 测试是否可以访问 Google
curl -I https://www.google.com

# 测试是否可以访问 HuggingFace
curl -I https://huggingface.co
```

如果返回 `HTTP/1.1 200 OK`，说明代理工作正常。

---

### 第 3 步：运行 OCR 检测

**方法 A：使用自动化脚本（推荐）**

```bash
cd /Users/Min369/Documents/同步空间/Manju/Projects/AlVisualization/textbook-processor

# 运行 OCR 检测脚本（会自动检测代理）
./run_ocr_detection.sh
```

**方法 B：使用灵活脚本（可手动输入端口）**

```bash
# 运行灵活脚本
./run_ocr_flexible.sh

# 选择选项 B
# 然后输入您的代理端口号（例如 7890）
```

**方法 C：手动设置**

```bash
# 1. 设置代理（替换成您的实际端口）
export http_proxy="http://127.0.0.1:7890"
export https_proxy="http://127.0.0.1:7890"

# 2. 激活虚拟环境
source .venv/bin/activate

# 3. 运行检测
python3 src/mineru_chapter_detector.py "概率论与数理统计第五版盛骤-完整版.pdf"
```

---

## ❓ 常见问题

### Q1: 如何确认我的代理端口号？

**Clash:**
- 打开 Clash → 设置 → 外部控制
- 端口通常是：7890 (HTTP) 或 7891 (SOCKS5)

**V2Ray:**
- 设置 → 参数设置 → 允许局域网连接
- 端口通常是：10808 (HTTP) 或 1080 (SOCKS5)

**查看系统代理设置:**
```bash
scutil --proxy
```

### Q2: 代理已开启，但还是连接失败？

**解决方案：**
1. 尝试切换代理节点
2. 检查防火墙设置
3. 在代理软件中启用"允许局域网连接"
4. 确认代理软件的"系统代理"开关已打开

### Q3: 不想用代理，有其他方案吗？

**是的！使用手动配置章节：**
```bash
python3 src/manual_chapters.py --interactive
```

这是最可靠的方案，无需下载大模型。

---

## 📋 完整示例

假设您的代理端口是 7890：

```bash
# 1. 启动代理软件（Clash/V2Ray 等）

# 2. 验证代理
curl -I https://huggingface.co

# 3. 设置环境变量
export http_proxy="http://127.0.0.1:7890"
export https_proxy="http://127.0.0.1:7890"

# 4. 进入项目目录
cd /Users/Min369/Documents/同步空间/Manju/Projects/AlVisualization/textbook-processor

# 5. 激活虚拟环境
source .venv/bin/activate

# 6. 运行 OCR 检测
python3 src/mineru_chapter_detector.py "概率论与数理统计第五版盛骤-完整版.pdf"
```

---

## 🎯 下一步

代理设置成功后，脚本会：
1. ✅ 自动下载 OCR 模型（约 350MB）
2. ✅ 分析 PDF 结构
3. ✅ 检测所有章节
4. ✅ 输出章节列表和页码范围

首次运行需要几分钟时间下载模型，请耐心等待。

---

**准备好了吗？启动代理后，运行 `./run_ocr_detection.sh` 即可！**
