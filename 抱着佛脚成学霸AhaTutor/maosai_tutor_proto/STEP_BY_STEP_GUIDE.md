# 茅塞顿开助教 - 手把手部署教程
## MacBook Pro 2015 专用服务器

**目标**: 将 MacBook Pro 2015 变成 24/7 运行的学习服务器
**时间**: 约 30 分钟
**难度**: ⭐⭐ (中等)

---

## 📦 第一步：准备部署包（在当前 Mac 上）

### 1.1 确认部署包位置

部署包已经准备好了：
```
/Users/Min369/Documents/同步空间/Manju/Projects/AlVisualization/抱着佛脚成学霸AhaTutor/maosai_tutor_deploy.tar.gz
```

**大小**: 1.4MB

### 1.2 验证部署包内容

在当前 Mac 上运行：
```bash
cd /Users/Min369/Documents/同步空间/Manju/Projects/AlVisualization/抱着佛脚成学霸AhaTutor

# 查看部署包
ls -lh maosai_tutor_deploy.tar.gz

# 查看内容列表（不解压）
tar -tzf maosai_tutor_deploy.tar.gz | head -20
```

应该看到类似：
```
-rw-r--r--  1 Min369  staff   1.4M  2 26 13:30 maosai_tutor_deploy.tar.gz
./app/
./app/main.py
./install.sh
./optimize_server.sh
./DEPLOY_GUIDE_2015.md
...
```

---

## 🚀 第二步：传输到 MacBook Pro 2015

### 方案 A：AirDrop（推荐，最快）

**在当前 Mac 上**:
1. 打开 Finder
2. 找到 `maosai_tutor_deploy.tar.gz`
3. 右键点击 -> 共享 -> AirDrop
4. 选择 MacBook Pro 2015

**在 MacBook Pro 2015 上**:
1. 点击接受
2. 文件会保存到 `~/Downloads/` 文件夹

### 方案 B：U 盘/移动硬盘

1. 将 `maosai_tutor_deploy.tar.gz` 复制到 U 盘
2. 将 U 盘插入 MacBook Pro 2015
3. 复制到桌面或 Documents 文件夹

### 方案 C：网盘（iCloud Drive）

**在当前 Mac 上**:
```bash
# 复制到 iCloud Drive
cp maosai_tutor_deploy.tar.gz ~/Library/Mobile\ Documents/com~apple~CloudDocs/
```

**在 MacBook Pro 2015 上**:
1. 打开 iCloud Drive 文件夹
2. 等待同步完成
3. 将文件复制到桌面

---

## 🔧 第三步：在 MacBook Pro 2015 上部署

### 3.1 打开终端

在 MacBook Pro 2015 上：
1. 按 `Command + Space` 打开 Spotlight 搜索
2. 输入 "Terminal"
3. 回车打开终端

### 3.2 检查系统版本

```bash
# 在终端运行
sw_vers
```

**期望输出**:
```
ProductName:    macOS
ProductVersion: 12.x.x 或更高  # 至少要是 10.15 (Catalina)
BuildVersion:   xxxxx
```

**如果版本 < 10.15**:
- 需要先升级系统
- 或者在当前 Mac 上使用 Docker 容器部署

### 3.3 检查 Python 版本

```bash
python3 --version
```

**期望输出**: `Python 3.8.x` 或更高

**如果版本过低或未安装**:
```bash
# 安装 Homebrew（如果未安装）
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# 安装 Python 3
brew install python3
```

### 3.4 解压部署包

```bash
# 进入下载文件夹（或你放置文件的文件夹）
cd ~/Downloads

# 解压
tar -xzf maosai_tutor_deploy.tar.gz

# 进入项目目录
cd maosai_tutor_proto

# 查看文件列表
ls -lh
```

**应该看到**:
```
total 80
-rwxr-xr-x  1 username  staff   1.8K install.sh
-rwxr-xr-x  1 username  staff   3.3K check_memory.sh
-rwxr-xr-x  1 username  staff   1.7K switch_to_tutor.sh
-rwxr-xr-x  1 username  staff   3.3K optimize_server.sh
drwxr-xr-x  3 username  staff    96B app/
-rw-r--r--  1 username  staff   182B requirements.txt
-rw-r--r--  1 username  staff   14KB DEPLOY_GUIDE_2015.md
```

### 3.5 运行安装脚本

```bash
# 给安装脚本添加执行权限（如果还没有）
chmod +x install.sh

# 运行安装
./install.sh
```

**安装过程（需要 5-10 分钟）**:

你会看到类似输出：
```
========================================
   茅塞顿开高中数学助教 - 安装向导
========================================

📋 检查系统环境...
✅ Python 版本: 3.9.7

🔧 开始安装...

📦 创建虚拟环境...
✅ 虚拟环境创建完成

🔌 激活虚拟环境...
⬆️  升级 pip...
📚 安装 Python 依赖包（这可能需要 5-10 分钟）...

[安装过程...]

========================================
✅ 安装完成！
========================================

📝 启动服务请运行：

   source .venv/bin/activate
   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

📱 然后在 iPad 浏览器访问:
   http://[你的Mac IP地址]:8000

💡 查看 DEPLOY_GUIDE_2015.md 获取详细使用说明
========================================
```

**如果安装失败**:
- 检查网络连接
- 尝试手动安装：`pip3 install -r requirements.txt`

---

## 🚀 第四步：启动服务（测试）

### 4.1 启动服务

```bash
# 激活虚拟环境
source .venv/bin/activate

# 启动服务
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

**期望输出**:
```
INFO:     Started server process [12345]
INFO:     Waiting for application startup.
INFO:     Application startup complete.
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
INFO:     Started reloader process [12346] using WatchFiles
```

### 4.2 本地测试

**打开新的终端窗口**（Command + T）：
```bash
# 测试服务是否响应
curl http://localhost:8000
```

**期望输出**: HTML 代码（包含 `<!doctype html>`）

如果返回 HTML，说明服务正常运行！✅

### 4.3 获取 IP 地址

```bash
ifconfig | grep "inet " | grep -v 127.0.0.1
```

**输出示例**:
```
        inet 192.168.1.100 netmask 0xffffff00 broadcast 192.168.1.255
```

**记下你的 IP 地址**，例如：`192.168.1.100`

### 4.4 停止测试服务

回到第一个终端窗口，按 `Ctrl + C` 停止服务

---

## 📱 第五步：iPad 连接测试

### 5.1 确保 iPad 和 Mac 在同一 Wi-Fi

**在 Mac 上**:
1. 点击屏幕右上角的 Wi-Fi 图标
2. 记录当前连接的 Wi-Fi 名称

**在 iPad 上**:
1. 打开 Settings -> Wi-Fi
2. 连接到**相同的 Wi-Fi**

### 5.2 在 iPad 上访问

1. 打开 Safari 浏览器
2. 在地址栏输入：`http://192.168.1.100:8000`（替换为你的 IP）
3. 回车

**期望结果**: 看到 "茅塞顿开助教" 的界面

**如果无法访问**:
- 检查 Mac 服务是否运行
- 检查两台设备是否在同一 Wi-Fi
- 检查 Mac 防火墙设置

---

## ⚙️ 第六步：设置开机自启动

### 6.1 创建服务配置文件

**在 Mac 终端运行**:
```bash
# 查看当前用户名
whoami
```

记下你的用户名（例如：`john`）

```bash
# 创建服务配置（需要管理员权限）
sudo nano /Library/LaunchDaemons/com.maosai.tutor.plist
```

**复制粘贴以下内容**（注意替换用户名）:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.maosai.tutor</string>
    <key>ProgramArguments</key>
    <array>
        <string>/Users/john/.venv/bin/uvicorn</string>
        <string>app.main:app</string>
        <string>--host</string>
        <string>0.0.0.0</string>
        <string>--port</string>
        <string>8000</string>
    </array>
    <key>WorkingDirectory</key>
    <string>/Users/john/maosai_tutor_proto</string>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
    <key>StandardOutPath</key>
    <string>/tmp/maosai_tutor.log</string>
    <key>StandardErrorPath</key>
    <string>/tmp/maosai_tutor.error</string>
</dict>
</plist>
```

**重要**: 将 `/Users/john` 替换为你的实际用户名

**保存并退出**:
- 按 `Ctrl + O` 保存
- 按 `Enter` 确认
- 按 `Ctrl + X` 退出

### 6.2 加载并启动服务

```bash
# 加载服务配置
sudo launchctl load /Library/LaunchDaemons/com.maosai.tutor.plist

# 启动服务
sudo launchctl start com.maosai.tutor

# 查看服务状态
sudo launchctl list | grep maosai
```

**期望输出**:
```
12345   0   com.maosai.tutor
```

### 6.3 验证服务

```bash
# 查看日志
tail -f /tmp/maosai_tutor.log
```

应该看到服务启动信息

**按 Ctrl + C 退出日志查看**

### 6.4 测试开机自启动

```bash
# 重启 Mac
sudo reboot
```

**重启后**:
1. Mac 自动登录
2. 等待 30 秒
3. 在 iPad 上访问 `http://[Mac IP]:8000`
4. 应该可以直接访问 ✅

---

## 🔧 第七步：优化服务器

### 7.1 运行优化脚本

```bash
cd ~/maosai_tutor_proto

# 给脚本添加执行权限
chmod +x optimize_server.sh

# 运行优化（需要管理员权限）
sudo ./optimize_server.sh
```

**优化内容**:
- ✅ 配置电源管理（连接电源时不休眠）
- ✅ 创建服务监控脚本（自动重启）
- ✅ 设置定时任务（每分钟检查）
- ✅ 创建管理脚本（快速控制）

**期望输出**:
```
========================================
   茅塞顿开助教 - 服务器优化
========================================

🔧 开始优化...

1️⃣  禁用不必要的启动项...
2️⃣  优化网络设置...
3️⃣  配置电源管理...
   ✅ 显示器 10 分钟后关闭
   ✅ 系统永不休眠
4️⃣  创建服务监控脚本...
5️⃣  设置定时监控...
6️⃣  创建管理脚本...

========================================
✅ 优化完成！
========================================

📝 管理命令:
   ~/maosai_manage.sh start    # 启动服务
   ~/maosai_manage.sh stop     # 停止服务
   ~/maosai_manage.sh restart  # 重启服务
   ~/maosai_manage.sh status   # 查看状态
   ~/maosai_manage.sh log      # 查看日志

📱 iPad 访问地址:
   http://192.168.1.100:8000
========================================
```

### 7.2 测试管理脚本

```bash
# 查看服务状态
~/maosai_manage.sh status
```

**期望输出**:
```
✅ 服务正在运行

访问地址:
   http://192.168.1.100:8000
```

---

## ✅ 第八步：最终测试

### 8.1 在 iPad 上完整测试

1. **打开 Safari** 访问 `http://192.168.1.100:8000`

2. **测试各个功能**:
   - [ ] 查看知识树
   - [ ] 打开交互式实验室
   - [ ] 测试 AI 问答
   - [ ] 尝试考前速通
   - [ ] 测试 OCR 上传（如果有题目图片）

3. **观察性能**:
   - 页面加载是否流畅？
   - 图形交互是否正常？
   - AI 回答是否及时？

### 8.2 检查资源使用

**在 Mac 上运行**:
```bash
# 查看内存使用
top -o mem | head -20
```

**期望**: 助教服务占用 < 500MB 内存

### 8.3 重启测试

```bash
# 重启 Mac
sudo reboot

# 重启后等待 30 秒

# 在 iPad 上再次访问
# 应该可以直接使用 ✅
```

---

## 🎉 完成！

### 部署检查清单

- [ ] ✅ 部署包已传输到 2015 Mac
- [ ] ✅ Python 3.8+ 已安装
- [ ] ✅ 虚拟环境已创建
- [ ] ✅ 所有依赖已安装
- [ ] ✅ 服务可以手动启动
- [ ] ✅ 本地访问测试通过
- [ ] ✅ iPad 远程访问测试通过
- [ ] ✅ 开机自启动已配置
- [ ] ✅ 服务器优化已完成
- [ ] ✅ 管理脚本可用

### 日常使用

**对于学生**:
1. iPad 连接 Wi-Fi
2. Safari 访问 `http://192.168.1.100:8000`
3. 开始学习！

**对于管理员**:
```bash
# 查看服务状态
~/maosai_manage.sh status

# 查看日志
~/maosai_manage.sh log

# 重启服务（如果需要）
~/maosai_manage.sh restart
```

### iPad 书签建议

在 iPad Safari 上：
1. 访问 `http://192.168.1.100:8000`
2. 点击分享按钮
3. 选择"添加书签"
4. 命名为"茅塞顿开助教"
5. 添加到主屏幕（方便快速访问）

---

## 🆘 遇到问题？

### 常见问题

**Q: iPad 无法访问？**
- 检查服务是否运行：`~/maosai_manage.sh status`
- 检查 Wi-Fi 是否同一网络
- 检查 IP 地址是否正确

**Q: 服务自动停止？**
- 查看错误日志：`cat /tmp/maosai_tutor.error`
- 手动重启：`~/maosai_manage.sh restart`

**Q: Mac 休眠后无法访问？**
- 检查电源管理：`pmset -g`
- 确保 Mac 连接电源
- 或者禁用休眠：`sudo pmset -c sleep 0`

---

**恭喜你完成了部署！** 🎊

现在 MacBook Pro 2015 已经变成了一台专属的学习服务器，24/7 为学生服务！
