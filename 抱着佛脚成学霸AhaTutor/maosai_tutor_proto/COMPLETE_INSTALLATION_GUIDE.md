# 茅塞顿开高中数学助教 - 完整安装指南

## 📋 目录

1. [准备工作](#准备工作)
2. [传输部署包](#传输部署包)
3. [系统检查](#系统检查)
4. [安装依赖](#安装依赖)
5. [启动测试](#启动测试)
6. [iPad连接](#ipad连接)
7. [开机自启](#开机自启)
8. [服务器优化](#服务器优化)
9. [日常管理](#日常管理)
10. [故障排查](#故障排查)

---

## 准备工作

### 硬件要求

| 设备 | 最低配置 | 推荐配置 |
|------|---------|---------|
| **Mac** | MacBook Pro 2012+ | MacBook Pro 2015 |
| **内存** | 8GB | 8GB 或更高 |
| **存储** | 5GB 可用空间 | 10GB 可用空间 |
| **系统** | macOS 10.15+ | macOS 11+ |

### 软件要求

- **Python**: 3.8 或更高版本
- **网络**: 稳定的 Wi-Fi 连接
- **浏览器**: iPad 上的 Safari

### 检查清单

在开始之前，请确认：

- [ ] 你有一台 MacBook Pro 2015（或其他 Mac）
- [ ] Mac 内存至少 8GB
- [ ] iPad 和 Mac 将在同一 Wi-Fi 网络
- [ ] 你有 Mac 的管理员密码
- [ ] Mac 系统版本 ≥ 10.15

---

## 传输部署包

### 方案选择

根据你的情况选择最合适的方式：

### 方案 A：AirDrop（推荐）

**适用场景**: 两台 Mac 在同一房间，都支持 AirDrop

**步骤**:

1. **在当前 Mac 上**:
   - 打开 Finder（访达）
   - 导航到：`/Users/Min369/Documents/同步空间/Manju/Projects/AlVisualization/抱着佛脚成学霸AhaTutor/`
   - 找到文件：`maosai_tutor_deploy.tar.gz`
   - 右键点击文件
   - 选择"共享" → "AirDrop"
   - 在列表中选择"MacBook Pro 2015"

2. **在 MacBook Pro 2015 上**:
   - 点击屏幕上的 AirDrop 通知
   - 点击"接受"
   - 文件会保存到 `~/Downloads/` 文件夹

3. **验证文件**:
   ```bash
   # 在 2015 Mac 的终端运行
   ls -lh ~/Downloads/maosai_tutor_deploy.tar.gz
   ```
   应该显示文件大小为 1.4M

### 方案 B：U 盘/移动硬盘

**适用场景**: AirDrop 不可用，或文件传输不稳定

**步骤**:

1. **在当前 Mac 上**:
   - 插入 U 盘或移动硬盘
   - 复制 `maosai_tutor_deploy.tar.gz` 到 U 盘
   - 安全弹出 U 盘

2. **在 MacBook Pro 2015 上**:
   - 插入 U 盘
   - 打开 U 盘
   - 将文件复制到桌面或 Documents 文件夹

### 方案 C：iCloud Drive

**适用场景**: 两台 Mac 都登录了相同的 Apple ID

**步骤**:

1. **在当前 Mac 上**:
   ```bash
   # 复制到 iCloud Drive
   cp ~/Downloads/maosai_tutor_deploy.tar.gz ~/Library/Mobile\ Documents/com~apple~CloudDocs/
   ```

2. **在 MacBook Pro 2015 上**:
   - 打开 Finder
   - 点击左侧的"iCloud Drive"
   - 找到 `maosai_tutor_deploy.tar.gz`
   - 复制到桌面
   - 等待同步完成（可能需要几分钟）

### 方案 D：网盘（百度网盘/阿里云盘）

**适用场景**: 其他方式不可用

**步骤**:

1. **在当前 Mac 上**:
   - 登录网盘客户端或网页版
   - 上传 `maosai_tutor_deploy.tar.gz`
   - 等待上传完成

2. **在 MacBook Pro 2015 上**:
   - 登录相同的网盘账号
   - 下载文件到桌面或 Documents
   - 等待下载完成

---

## 系统检查

### 打开终端

在 MacBook Pro 2015 上：

1. 按 `Command + Space` 打开 Spotlight 搜索
2. 输入 "Terminal" 或"终端"
3. 按回车打开终端

### 检查系统版本

```bash
sw_vers
```

**期望输出**:
```
ProductName:    macOS
ProductVersion: 12.7.3        # 至少要是 10.15.x
BuildVersion:   21H1320
```

**判断标准**:
- ✅ 如果 `ProductVersion` ≥ 10.15，可以继续
- ❌ 如果 < 10.15，需要先升级系统

### 检查 Python 版本

```bash
python3 --version
```

**期望输出**:
```
Python 3.8.10      # 或更高的 3.x 版本
```

**判断标准**:
- ✅ 如果版本 ≥ 3.8，可以继续
- ❌ 如果 < 3.8 或显示"command not found"，需要安装 Python

#### 安装 Python（如果需要）

```bash
# 1. 安装 Homebrew（如果未安装）
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# 2. 更新 Homebrew
brew update

# 3. 安装 Python 3
brew install python3

# 4. 验证安装
python3 --version
```

### 检查可用磁盘空间

```bash
df -h ~ | tail -1
```

**期望输出**: 至少有 5GB 可用空间

```
/dev/disk1s1    250G   80G   170G    33%    /
                    ↑
                至少需要 5GB
```

### 检查网络连接

```bash
# Ping 一个外部网站
ping -c 4 8.8.8.8
```

**期望输出**: 4 个包都成功接收

```
PING 8.8.8.8 (8.8.8.8): 56 data bytes
64 bytes from 8.8.8.8: icmp_seq=0 ttl=117 time=10.1 ms
64 bytes from 8.8.8.8: icmp_seq=1 ttl=117 time=9.8 ms
64 bytes from 8.8.8.8: icmp_seq=2 ttl=117 time=10.2 ms
64 bytes from 8.8.8.8: icmp_seq=3 ttl=117 time=10.0 ms

--- 8.8.8.8 ping statistics ---
4 packets transmitted, 4 packets received, 0.0% packet loss
```

---

## 安装依赖

### 导航到部署包位置

根据你传输文件的方式，选择对应的命令：

**如果文件在 Downloads**:
```bash
cd ~/Downloads
```

**如果文件在桌面**:
```bash
cd ~/Desktop
```

**如果文件在 Documents**:
```bash
cd ~/Documents
```

### 验证部署包

```bash
# 查看文件
ls -lh maosai_tutor_deploy.tar.gz
```

**期望输出**:
```
-rw-r--r--  1 yourname  staff   1.4M  2 26 13:31 maosai_tutor_deploy.tar.gz
```

**确认文件大小约为 1.4M**，如果不是，说明文件损坏，需要重新传输。

### 解压部署包

```bash
# 解压
tar -xzf maosai_tutor_deploy.tar.gz

# 进入项目目录
cd maosai_tutor_proto

# 查看内容
ls -lh
```

**期望输出**:
```
total 112
-rwxr-xr-x   1 yourname  staff   1.8K Feb 26 13:16 install.sh
-rwxr-xr-x   1 yourname  staff   3.3K Feb 26 13:26 check_memory.sh
-rwxr-xr-x   1 yourname  staff   1.7K Feb 26 13:26 switch_to_tutor.sh
-rwxr-xr-x   1 yourname  staff   0.8K Feb 26 13:26 switch_back_to_openclaw.sh
-rwxr-xr-x   1 yourname  staff   3.3K Feb 26 13:30 optimize_server.sh
drwxr-xr-x   3 yourname  staff    96B Feb 26 13:05 app/
-rw-r--r--   1 yourname  staff   182B Feb 25 23:32 requirements.txt
-rw-r--r--   1 yourname  staff    14K Feb 26 13:21 DEPLOY_GUIDE_2015.md
-rw-r--r--   1 yourname  staff    30K Feb 26 13:33 COMPLETE_INSTALLATION_GUIDE.md
-rw-r--r--   1 yourname  staff    27K Feb 26 13:31 STEP_BY_STEP_GUIDE.md
-rw-r--r--   1 yourname  staff   3.4K Feb 26 13:05 README.md
-rw-r--r--   1 yourname  staff   9.7K Feb 26 13:05 项目说明.md
drwxr-xr-x  11 yourname  staff   352B Feb 26 13:05 数学rag/
```

### 运行安装脚本

```bash
# 确保脚本有执行权限
chmod +x install.sh

# 运行安装
./install.sh
```

### 安装过程

安装脚本会执行以下操作：

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
Requirement already satisfied: pip in ./.venv/lib/python3.9/site-packages (21.2.4)
Collecting pip
  Downloading pip-24.0-py3-none-any.whl (2.1 MB)
     ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 2.1/2.1 MB 5.2 MB/s
Installing collected packages: pip
  Successfully installed pip-24.0

📚 安装 Python 依赖包（这可能需要 5-10 分钟）...
Collecting fastapi>=0.110
  Downloading fastapi-0.110.0-py3-none-any.whl (92 kB)
     ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 92.0/92.0 kB
Collecting uvicorn[standard]>=0.27
  Downloading uvicorn-0.27.0-py3-none-any.whl (60 kB)
     ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 60.0/60.0 kB
Collecting jinja2>=3.1
  Downloading jinja2-3.1.3-py3-none-any.whl (133 kB)
     ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 133.0/133.0 kB
...（更多安装输出）...
Successfully installed fastapi-0.110.0 uvicorn-0.27.0 jinja2-3.1.3 ...

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

**安装时间**: 约 5-10 分钟（取决于网络速度）

**如果安装过程中出现错误**:

1. **网络错误**:
   ```bash
   # 检查网络连接
   ping -c 4 8.8.8.8

   # 如果网络正常，重试安装
   ./install.sh
   ```

2. **权限错误**:
   ```bash
   # 确保脚本有执行权限
   chmod +x install.sh
   ./install.sh
   ```

3. **依赖安装失败**:
   ```bash
   # 手动安装依赖
   source .venv/bin/activate
   pip install --upgrade pip
   pip install -r requirements.txt
   ```

---

## 启动测试

### 激活虚拟环境

```bash
# 确保仍在项目目录
cd ~/Downloads/maosai_tutor_proto  # 或你解压的位置

# 激活虚拟环境
source .venv/bin/activate
```

**激活后，你的命令提示符会显示**:
```
(maosai_tutor_proto) yourname@MacBook-Pro ~ %
```

### 启动服务

```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

**期望输出**:
```
INFO:     Uvicorn running on uvicorn (0.27.0)
INFO:     Started server process [12345]
INFO:     Waiting for application startup.
INFO:     Application startup complete.
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
INFO:     Started reloader process [12346] using WatchFiles
```

**关键信息**:
- ✅ "Application startup complete" - 说明启动成功
- ✅ "Running on http://0.0.0.0:8000" - 服务运行在 8000 端口
- ✅ 服务进程 ID: 12345（你的可能不同）

**如果启动失败**:

**错误 1**: `Address already in use`
```bash
# 查看哪个进程占用了 8000 端口
lsof -i :8000

# 输出示例：
# COMMAND   PID     USER   FD   TYPE  DEVICE SIZE/OFF NODE NAME
# python   12345 yourname    4u  IPv4 0x1234      0t0  TCP *:8000 (LISTEN)

# 杀死进程
kill -9 12345

# 重新启动服务
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

**错误 2**: `ModuleNotFoundError`
```bash
# 重新安装依赖
pip install -r requirements.txt

# 再次尝试启动
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

### 本地测试（在同一台 Mac 上）

**打开新的终端窗口**（Command + T），保持原终端运行服务：

```bash
# 测试服务是否响应
curl http://localhost:8000
```

**期望输出**: HTML 代码

```html
<!doctype html>
<html lang="zh">
<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Aha Tutor</title>
    ...
```

**如果返回 HTML，说明服务正常运行！✅**

**如果显示 "Connection refused"**:
- 检查服务是否仍在运行
- 查看第一个终端是否有错误信息

### 获取 Mac 的 IP 地址

在终端运行：

```bash
ifconfig | grep "inet " | grep -v 127.0.0.1
```

**期望输出**:
```
        inet 192.168.1.100 netmask 0xffffff00 broadcast 192.168.1.255
```

**重要**: 记下你的 IP 地址（例如：`192.168.1.100`）

**如果看到多个 IP 地址**:
- 选择以 `192.168.x.x` 或 `10.x.x.x` 开头的
- 这通常是你的局域网 IP

### 测试服务是否监听所有接口

```bash
# 查看端口 8000 是否被监听
lsof -i :8000
```

**期望输出**:
```
COMMAND   PID     USER   FD   TYPE  DEVICE SIZE/OFF NODE NAME
python   12345 yourname    4u  IPv4 0x1234      0t0  TCP *:8000 (LISTEN)
python   12345 yourname    6u  IPv6 0x1235      0t0  TCP *:8000 (LISTEN)
```

**关键信息**:
- ✅ `*:8000 (LISTEN)` - 说明服务正在监听所有网络接口
- ✅ 同时有 IPv4 和 IPv6

### 停止测试服务

回到运行服务的终端窗口，按：

```
Ctrl + C
```

**期望输出**:
```
INFO:     Shutting down
INFO:     Waiting for application shutdown.
INFO:     Application shutdown complete.
INFO:     Finished server process [12345]
```

服务现在已经停止。

---

## iPad连接

### 确保 iPad 和 Mac 在同一 Wi-Fi

**在 Mac 上**:
1. 点击屏幕右上角的  图标
2. 记住当前连接的 Wi-Fi 名称（例如："MyHomeWiFi"）

**在 iPad 上**:
1. 打开 Settings（设置）
2. 点击 Wi-Fi
3. 连接到**相同的 Wi-Fi**："MyHomeWiFi"

### 在 iPad 上访问服务

1. 打开 Safari 浏览器
2. 在地址栏输入：`http://192.168.1.100:8000`（替换为你的实际 IP）
3. 点击"前往"或按回车

**期望结果**: 看到"茅塞顿开高中数学助教"的界面

**如果无法访问**，按以下步骤排查：

#### 排查步骤 1：检查 Mac 服务是否运行

```bash
# 在 Mac 终端运行
lsof -i :8000
```

**如果无输出**:
- 服务未运行，重新启动：
  ```bash
  cd ~/Downloads/maosai_tutor_proto
  source .venv/bin/activate
  uvicorn app.main:app --host 0.0.0.0 --port 8000
  ```

#### 排查步骤 2：检查网络连接

```bash
# 在 Mac 上 Ping iPad 的 IP
# 首先获取 iPad 的 IP：设置 → Wi-Fi → 当前网络的 → (i) → IP地址
ping -c 4 192.168.1.101  # 替换为 iPad 的实际 IP
```

**期望**: Ping 成功，无丢包

#### 排查步骤 3：检查 Mac 防火墙

1. 打开"系统偏好设置"
2. 点击"安全性与隐私"
3. 点击"防火墙"标签
4. 如果防火墙开启，点击"防火墙选项"
5. 确保"Python"或"uvicorn"被允许接收传入连接

#### 排查步骤 4：确认 IP 地址正确

```bash
# 重新获取 IP 地址
ifconfig | grep "inet " | grep -v 127.0.0.1
```

确保 iPad 访问的 IP 与这个 IP 一致

### 在 iPad 上添加书签

**为了方便下次访问，建议添加书签**：

1. 在 Safari 中访问 `http://192.168.1.100:8000`
2. 点击分享按钮
3. 向下滚动，点击"添加书签"
4. 修改名称为"茅塞顿开助教"
5. 点击"保存"

**添加到主屏幕（可选）**:

1. 在 Safari 中访问服务
2. 点击分享按钮
3. 点击"添加到主屏幕"
4. 点击"添加"

现在 iPad 主屏幕上会出现一个图标，就像一个 App 一样！

### 测试核心功能

在 iPad 上测试以下功能：

#### 1. 查看知识树
- 点击左侧的知识树
- 浏览不同的章节和知识点

#### 2. 打开交互式实验室
- 选择一个实验室（如"向量实验室"）
- 测试参数调整
- 查看图形变化

#### 3. 测试 AI 问答
- 在聊天框输入："什么是向量？"
- 查看 AI 回答
- 测试数学公式渲染

#### 4. 尝试考前速通
- 点击"考前速通"
- 做几道练习题
- 测试"换一批"功能

#### 5. 测试 OCR（如果有图片）
- 点击上传图片
- 选择一张数学题图片
- 查看识别结果

---

## 开机自启

### 创建服务配置文件

**首先获取你的用户名**:
```bash
whoami
```

**输出示例**: `john`

**记住你的用户名，下一步需要用到！**

### 创建 LaunchDaemon 配置

```bash
# 创建配置文件（需要管理员权限）
sudo nano /Library/LaunchDaemons/com.maosai.tutor.plist
```

**输入你的 Mac 密码**（输入时不会显示）

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
        <string>/Users/john/maosai_tutor_proto/.venv/bin/uvicorn</string>
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
    <key>EnvironmentDict</key>
    <dict>
        <key>PATH</key>
        <string>/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin</string>
    </dict>
</dict>
</plist>
```

**重要替换**:
- 将所有 `/Users/john` 替换为你的实际用户名
- 将 `/Users/john/maosai_tutor_proto` 替换为你的实际项目路径

**例如，如果你的用户名是 `mary`，项目在桌面**:
- `/Users/mary/Desktop/maosai_tutor_proto`

**保存并退出 nano 编辑器**:
1. 按 `Ctrl + O`（字母 O，不是零）
2. 按 `Enter` 确认保存
3. 按 `Ctrl + X` 退出

### 检查配置文件

```bash
# 查看文件内容
cat /Library/LaunchDaemons/com.maosai.tutor.plist
```

确认：
- ✅ 路径正确
- ✅ 用户名正确
- ✅ XML 格式正确

### 修复虚拟环境路径

**重要**: 检查虚拟环境的实际路径：

```bash
# 如果项目在 Downloads
ls -la ~/Downloads/maosai_tutor_proto/.venv/bin/uvicorn

# 如果项目在桌面
ls -la ~/Desktop/maosai_tutor_proto/.venv/bin/uvicorn
```

**期望输出**: 文件存在

**如果文件不存在**，虚拟环境路径可能是：
```bash
# 检查实际路径
which python3
# 可能是：/usr/local/bin/python3 或 /usr/bin/python3

# 对应的虚拟环境路径可能是：
.venv/bin/python3
```

**相应地修改 plist 文件中的路径**：
```bash
sudo nano /Library/LaunchDaemons/com.maosai.tutor.plist
```

### 加载服务

```bash
# 加载服务配置
sudo launchctl load /Library/LaunchDaemons/com.maosai.tutor.plist
```

**期望输出**: 无错误（如果有错误会显示）

### 启动服务

```bash
# 启动服务
sudo launchctl start com.maosai.tutor
```

### 验证服务运行

```bash
# 查看服务状态
sudo launchctl list | grep maosai
```

**期望输出**:
```
12345   0   com.maosai.tutor
```

**说明**:
- `12345` - 进程 ID（PID）
- `0` - 退出状态（0 表示正常）
- `com.maosai.tutor` - 服务名称

### 查看服务日志

```bash
# 查看标准输出日志
tail -f /tmp/maosai_tutor.log
```

**期望输出**:
```
INFO:     Started server process [12345]
INFO:     Waiting for application startup.
INFO:     Application startup complete.
INFO:     Uvicorn running on http://0.0.0.0:8000
```

**按 Ctrl + C 退出日志查看**

### 测试服务

```bash
# 测试服务是否响应
curl http://localhost:8000
```

**期望**: 返回 HTML 代码

### 测试远程访问

**在 iPad 上重新访问**:
```
http://192.168.1.100:8000
```

**应该能正常访问** ✅

### 重启测试

```bash
# 重启 Mac
sudo reboot
```

**重启后**:
1. Mac 自动登录（需要设置自动登录）
2. 等待 30-60 秒
3. 在 iPad 上访问服务
4. 应该可以直接访问，无需手动启动

**设置自动登录**（如果未设置）:
1. 系统偏好设置 → 用户与群组
2. 点击左下角的锁图标解锁
3. 选择你的账户
4. 点击"登录选项"
5. 设置"自动登录"为你的账户

---

## 服务器优化

### 运行优化脚本

```bash
# 进入项目目录
cd ~/Downloads/maosai_tutor_proto  # 或你的实际路径

# 确保脚本有执行权限
chmod +x optimize_server.sh

# 运行优化脚本（需要管理员权限）
sudo ./optimize_server.sh
```

**优化脚本会执行以下操作**:

```
========================================
   茅塞顿开助教 - 服务器优化
========================================

🔧 开始优化...

1️⃣  禁用不必要的启动项...

2️⃣  优化网络设置...

3️⃣  配置电源管理...
   ✅ 显示器 10 分钟后关闭
   ✅ 系统永不休眠（连接电源时）

4️⃣  创建服务监控脚本...
   创建文件: /usr/local/bin/check_maosai_service.sh

5️⃣  设置定时监控...
   添加定时任务到 crontab

6️⃣  创建管理脚本...
   创建文件: ~/maosai_manage.sh

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

💡 提示:
   - 服务已设置为开机自启动
   - 系统不会休眠（连接电源时）
   - 每分钟自动检查服务状态
========================================
```

### 验证管理脚本

```bash
# 给脚本添加执行权限（如果需要）
chmod +x ~/maosai_manage.sh

# 查看服务状态
~/maosai_manage.sh status
```

**期望输出**:
```
========================================
   服务状态查询
========================================

✅ 服务正在运行

📱 iPad 访问地址:
   http://192.168.1.100:8000

📊 服务信息:
   进程 ID: 12345
   端口: 8000
   运行时间: 5 分钟
```

### 查看日志

```bash
# 查看最近 50 行日志
~/maosai_manage.sh log
```

**期望输出**:
```
========================================
   服务日志（最近 50 行）
========================================

2024-02-26 13:30:00 INFO:     Started server process [12345]
2024-02-26 13:30:00 INFO:     Waiting for application startup.
2024-02-26 13:30:01 INFO:     Application startup complete.
2024-02-26 13:30:01 INFO:     Uvicorn running on http://0.0.0.0:8000
...
========================================
```

### 测试自动重启

```bash
# 手动杀死服务进程
sudo launchctl stop com.maosai.tutor

# 等待 1 分钟（定时任务会检查并重启）

# 再次检查状态
~/maosai_manage.sh status
```

**期望**: 服务自动恢复运行 ✅

### 固定 IP 地址（推荐）

**为什么固定 IP？**
- IP 地址不会变化
- iPad 书签不用修改
- 更稳定可靠

**设置固定 IP**:

1. 打开"系统偏好设置"
2. 点击"网络"
3. 选择 Wi-Fi
4. 点击"高级"
5. 点击"TCP/IP"标签
6. 配置 IPv4：选择"使用 DHCP（手动地址）"
7. IP 地址：`192.168.1.100`（或其他固定地址）
8. 子网掩码：`255.255.255.0`
9. 路由器：`192.168.1.1`（你的路由器 IP）
10. DNS：`8.8.8.8, 8.8.4.4`（Google DNS）
11. 点击"好"
12. 点击"应用"

**验证 IP**:
```bash
ifconfig | grep "inet " | grep -v 127.0.0.1
```

现在 IP 地址应该固定为 `192.168.1.100`

---

## 日常管理

### 查看服务状态

```bash
~/maosai_manage.sh status
```

**输出说明**:
- ✅ 服务正在运行 - 一切正常
- ❌ 服务未运行 - 需要启动或重启

### 启动服务

```bash
~/maosai_manage.sh start
```

**使用场景**: 服务意外停止后手动启动

### 停止服务

```bash
~/maosai_manage.sh stop
```

**使用场景**:
- 维护系统
- 更新代码
- 释放资源

### 重启服务

```bash
~/maosai_manage.sh restart
```

**使用场景**:
- 服务出现异常
- 配置更改后
- 定期维护

### 查看实时日志

```bash
# 持续监控日志
tail -f /tmp/maosai_tutor.log
```

**按 Ctrl + C 停止监控**

### 查看错误日志

```bash
# 查看错误日志
cat /tmp/maosai_tutor.error
```

### 监控资源使用

```bash
# 查看内存和 CPU 使用
top -o mem | head -20
```

**关注**:
- Python 进程的内存使用（应 < 500MB）
- CPU 使用率（应 < 20%）
- 总体内存压力（应 < 80%）

### 查看网络连接

```bash
# 查看端口 8000 的连接
netstat -an | grep 8000
```

**期望输出**: 多个 ESTABLISHED 连接（iPad 在使用）

### 定期维护

**每周运行一次**:

```bash
# 1. 检查服务状态
~/maosai_manage.sh status

# 2. 查看日志
~/maosai_manage.sh log | tail -20

# 3. 清理旧日志（可选）
> /tmp/maosai_tutor.log
> /tmp/maosai_tutor.error

# 4. 重启服务
~/maosai_manage.sh restart

# 5. 验证服务
curl http://localhost:8000
```

---

## 故障排查

### 问题 1：iPad 无法访问服务

**症状**: iPad 浏览器显示"无法连接"或"Safari无法打开网页"

**排查步骤**:

#### 1.1 确认服务运行

```bash
~/maosai_manage.sh status
```

**如果显示服务未运行**:
```bash
~/maosai_manage.sh start
```

#### 1.2 检查网络连接

```bash
# Ping iPad（需要知道 iPad 的 IP）
ping -c 4 192.168.1.101  # 替换为 iPad IP
```

**如果 Ping 不通**:
- 检查两台设备是否在同一 Wi-Fi
- 重启路由器
- 重新连接 Wi-Fi

#### 1.3 检查 IP 地址

```bash
ifconfig | grep "inet " | grep -v 127.0.0.1
```

**确认 iPad 访问的 IP 正确**

#### 1.4 检查防火墙

1. 系统偏好设置 → 安全性与隐私 → 防火墙
2. 如果防火墙开启：
   - 点击"防火墙选项"
   - 添加或允许"Python"

#### 1.5 重新加载服务

```bash
sudo launchctl unload /Library/LaunchDaemons/com.maosai.tutor.plist
sudo launchctl load /Library/LaunchDaemons/com.maosai.tutor.plist
sudo launchctl start com.maosai.tutor
```

### 问题 2：服务自动停止

**症状**: 使用一段时间后服务自动停止

**排查步骤**:

#### 2.1 查看错误日志

```bash
cat /tmp/maosai_tutor.error
```

**常见错误**:

**错误 A**: `MemoryError`
- 原因：内存不足
- 解决：重启 Mac，或禁用部分功能（如 RAG）

**错误 B**: `OSError: [Errno 24] Too many open files`
- 原因：文件描述符限制
- 解决：
  ```bash
  # 增加文件描述符限制
  ulimit -n 4096
  ```

**错误 C**: `ModuleNotFoundError`
- 原因：依赖缺失
- 解决：
  ```bash
  cd ~/Downloads/maosai_tutor_proto
  source .venv/bin/activate
  pip install -r requirements.txt
  ```

#### 2.2 启用自动重启

```bash
# 检查监控脚本是否运行
crontab -l | grep check_maosai_service
```

**如果没有输出**:
```bash
# 重新运行优化脚本
cd ~/Downloads/maosai_tutor_proto
sudo ./optimize_server.sh
```

### 问题 3：性能缓慢

**症状**: 页面加载慢，图形卡顿

**排查步骤**:

#### 3.1 检查资源使用

```bash
top -o mem | head -20
```

**如果内存压力 > 80%**:
- 重启 Mac
- 关闭其他应用
- 增加物理内存

#### 3.2 检查网络速度

```bash
# 测试网络速度
ping -c 10 8.8.8.8
```

**如果延迟 > 100ms**:
- 检查 Wi-Fi 信号强度
- 尝试靠近路由器
- 考虑使用有线连接

#### 3.3 检查磁盘空间

```bash
df -h ~
```

**如果可用空间 < 1GB**:
- 清理不必要的文件
- 清空垃圾箱
- 删除旧的日志文件

### 问题 4：开机未自动启动

**症状**: 重启后服务未自动运行

**排查步骤**:

#### 4.1 检查 LaunchDaemon 配置

```bash
# 检查文件是否存在
ls -l /Library/LaunchDaemons/com.maosai.tutor.plist
```

**如果文件不存在**:
- 重新创建配置文件（参考"开机自启"章节）

#### 4.2 检查服务是否加载

```bash
sudo launchctl list | grep maosai
```

**如果没有输出**:
```bash
# 重新加载
sudo launchctl load /Library/LaunchDaemons/com.maosai.tutor.plist
```

#### 4.3 检查自动登录

1. 系统偏好设置 → 用户与群组
2. 登录选项 → 自动登录
3. 确保设置为你的账户

#### 4.4 检查服务日志

```bash
cat /tmp/maosai_tutor.error
```

**查看是否有错误信息**

### 问题 5：虚拟环境问题

**症状**: 运行时提示找不到虚拟环境或模块

**解决方案**:

#### 5.1 重建虚拟环境

```bash
cd ~/Downloads/maosai_tutor_proto

# 删除旧虚拟环境
rm -rf .venv

# 重新创建
python3 -m venv .venv

# 激活
source .venv/bin/activate

# 安装依赖
pip install -r requirements.txt
```

#### 5.2 更新 plist 文件路径

```bash
# 查找实际的可执行文件路径
which uvicorn
find .venv -name uvicorn

# 更新 plist 文件
sudo nano /Library/LaunchDaemons/com.maosai.tutor.plist
```

### 问题 6：端口冲突

**症状**: 启动时显示"Address already in use"

**解决方案**:

#### 6.1 查找占用进程

```bash
lsof -i :8000
```

**输出示例**:
```
COMMAND   PID     USER   FD   TYPE  DEVICE SIZE/OFF NODE NAME
python   12345 yourname    4u  IPv4 0x1234      0t0  TCP *:8000 (LISTEN)
```

#### 6.2 杀死进程

```bash
# 方式 A：使用 kill
kill -9 12345

# 方式 B：使用 pkill
pkill -f "uvicorn app.main:app"
```

#### 6.3 更改端口（如果 8000 被其他应用占用）

```bash
# 使用其他端口启动
uvicorn app.main:app --host 0.0.0.0 --port 8001
```

**同时需要更新**:
- iPad 访问地址：`http://192.168.1.100:8001`
- plist 文件中的端口号
- 防火墙规则

---

## 完成检查清单

部署完成后，请确认以下所有项目都已完成：

### 系统配置

- [ ] macOS 版本 ≥ 10.15
- [ ] Python 3.8+ 已安装
- [ ] 虚拟环境已创建
- [ ] 所有依赖已安装

### 服务配置

- [ ] 服务可以手动启动
- [ ] 本地访问测试通过（curl localhost:8000）
- [ ] iPad 远程访问测试通过
- [ ] 获取并记录了 Mac IP 地址

### 自动化配置

- [ ] LaunchDaemon 配置文件已创建
- [ ] 服务已加载到 launchctl
- [ ] 开机自启动测试通过
- [ ] 自动登录已配置
- [ ] 服务监控脚本已运行

### 优化配置

- [ ] 电源管理已配置（连接电源不休眠）
- [ ] 管理脚本可用（~/maosai_manage.sh）
- [ ] IP 地址已固定（可选但推荐）
- [ ] 防火墙规则已配置

### 最终验证

- [ ] iPad 可以访问所有功能
- [ ] 重启 Mac 后服务自动启动
- [ ] 资源使用正常（内存 < 500MB）
- [ ] 日志正常输出
- [ ] iPad 书签已创建
- [ ] 管理员了解基本管理命令

### 文档准备

- [ ] 保存了 IP 地址
- [ ] 保存了管理员密码
- [ ] 记录了常见问题的解决方案
- [ ] 学生了解如何使用

---

## 快速参考

### 常用命令

```bash
# 启动服务
~/maosai_manage.sh start

# 停止服务
~/maosai_manage.sh stop

# 重启服务
~/maosai_manage.sh restart

# 查看状态
~/maosai_manage.sh status

# 查看日志
~/maosai_manage.sh log

# 获取 IP 地址
ifconfig | grep "inet " | grep -v 127.0.0.1

# 查看进程
ps aux | grep uvicorn

# 查看端口
lsof -i :8000

# 查看资源
top -o mem
```

### 重要路径

```
项目目录:           ~/Downloads/maosai_tutor_proto 或 ~/Desktop/maosai_tutor_proto
虚拟环境:           项目目录/.venv
配置文件:           /Library/LaunchDaemons/com.maosai.tutor.plist
日志文件:           /tmp/maosai_tutor.log
错误日志:           /tmp/maosai_tutor.error
管理脚本:           ~/maosai_manage.sh
```

### 访问地址

```
本地访问:           http://localhost:8000
远程访问（iPad）:   http://[Mac IP]:8000
```

### 端口信息

```
服务端口:           8000
如果被占用:         可以改为 8001, 8002 等
```

---

## 附录

### A: 卸载服务

如果需要完全移除服务：

```bash
# 1. 停止服务
sudo launchctl stop com.maosai.tutor

# 2. 卸载服务
sudo launchctl unload /Library/LaunchDaemons/com.maosai.tutor.plist

# 3. 删除配置文件
sudo rm /Library/LaunchDaemons/com.maosai.tutor.plist

# 4. 删除监控脚本
sudo rm /usr/local/bin/check_maosai_service.sh

# 5. 删除定时任务
crontab -e
# 删除包含 check_maosai_service 的行

# 6. 删除项目文件（可选）
rm -rf ~/Downloads/maosai_tutor_proto
```

### B: 更新代码

如果需要更新应用代码：

```bash
# 1. 停止服务
~/maosai_manage.sh stop

# 2. 备份当前版本
cp -r ~/Downloads/maosai_tutor_proto ~/Downloads/maosai_tutor_proto.backup

# 3. 替换代码文件
# 根据你的更新方式操作

# 4. 更新依赖（如果需要）
cd ~/Downloads/maosai_tutor_proto
source .venv/bin/activate
pip install -r requirements.txt --upgrade

# 5. 重启服务
~/maosai_manage.sh restart

# 6. 测试功能
curl http://localhost:8000
```

### C: 备份和恢复

#### 备份

```bash
# 1. 停止服务
~/maosai_manage.sh stop

# 2. 创建备份
tar -czf maosai_tutor_backup_$(date +%Y%m%d).tar.gz ~/Downloads/maosai_tutor_proto

# 3. 重启服务
~/maosai_manage.sh start
```

#### 恢复

```bash
# 1. 停止服务
~/maosai_manage.sh stop

# 2. 解压备份
tar -xzf maosai_tutor_backup_20240226.tar.gz -C ~/

# 3. 重启服务
~/maosai_manage.sh start
```

### D: 性能优化建议

如果发现性能不佳：

1. **减少依赖**:
   - 注释掉 `requirements.txt` 中不需要的包
   - 重新安装依赖

2. **优化 Python**:
   - 使用 PyPy（更快）
   - 启用 Python 优化

3. **增加硬件资源**:
   - 升级内存（8GB → 16GB）
   - 使用 SSD（如果还是 HDD）

4. **网络优化**:
   - 使用 5GHz Wi-Fi
   - 考虑有线连接

### E: 安全建议

1. **网络隔离**:
   - 使用访客网络运行服务
   - 配置路由器 ACL

2. **访问控制**:
   - 配置防火墙只允许特定 IP
   - 添加身份验证（需要修改代码）

3. **数据安全**:
   - 定期备份
   - 加密敏感数据

4. **系统更新**:
   - 定期更新 macOS
   - 定期更新 Python 依赖

---

## 总结

恭喜！如果你按照本指南完成了所有步骤，你现在拥有：

✅ 一台 24/7 运行的学习服务器
✅ iPad 随时可以访问的数学助教
✅ 开机自启动的可靠服务
✅ 完善的监控和管理工具

**学生现在可以**:
- 随时访问交互式实验室
- 获得 AI 智能答疑
- 练习数学题目
- 拍照识别题目

**管理员只需要**:
- 定期查看服务状态
- 保持 Mac 连接电源
- 偶尔查看日志

**享受你的学习之旅！** 🎓
