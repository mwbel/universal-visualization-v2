# MacBook Pro 2015 专用服务器部署指南

## 🎯 为什么选择 2015 款作为专用服务器？

### ✅ 完美的选择

| 对比项 | 单机部署(2018) | 双机分离(2018+2015) |
|--------|---------------|-------------------|
| **2018 内存压力** | 紧张(剩余1.5-3.5GB) | 充裕(剩余4-5GB) ✅ |
| **服务可用性** | 按需启动 | 24/7 运行 ✅ |
| **学生体验** | 需等待启动 | 随时可用 ✅ |
| **资源隔离** | 相互竞争 | 完全隔离 ✅ |
| **设备利用** | 一台过载 | 两台平衡 ✅ |

**结论**: 双机分离是**最佳方案**！

---

## 📋 部署前检查清单

### MacBook Pro 2015 配置要求

- [ ] **内存**: 8GB（完美）
- [ ] **存储**: 至少 5GB 可用空间
- [ ] **系统**: macOS 10.15 (Catalina) 或更高
- [ ] **网络**: Wi-Fi 连接（与 iPad 同一网络）
- [ ] **电源**: 建议一直连接电源（避免休眠）

### 检查系统版本

```bash
# 在 2015 Mac 上运行
sw_vers
```

**输出示例**:
```
ProductName:    macOS
ProductVersion: 12.7.3
BuildVersion:   21H1320
```

**如果版本 < 10.15**，需要先升级系统。

---

## 🚀 完整部署流程（20-30 分钟）

### 第一步：传输部署包

**选择方式**:
1. **AirDrop**（最快）- 两台 Mac 靠近，直接拖拽
2. **U 盘/移动硬盘** - 传统可靠
3. **网盘** - iCloud Drive、百度网盘等
4. **对传线** - Thunderbolt/FireWire 线缆

---

### 第二步：解压并安装

```bash
# 1. 解压部署包
tar -xzf maosai_tutor_deploy.tar.gz
cd maosai_tutor_proto

# 2. 检查 Python 版本
python3 --version

# 需要是 3.8 或更高，如果版本低:
# brew install python3

# 3. 运行一键安装脚本
chmod +x install.sh
./install.sh

# 安装过程需要 5-10 分钟
```

**安装脚本会自动**:
- ✅ 创建虚拟环境
- ✅ 升级 pip
- ✅ 安装所有依赖（FastAPI、PaddleOCR、ChromaDB 等）

---

### 第三步：测试启动

```bash
# 1. 激活虚拟环境
source .venv/bin/activate

# 2. 启动服务
uvicorn app.main:app --host 0.0.0.0 --port 8000

# 3. 等待看到:
# "Application startup complete. Running on http://0.0.0.0:8000"
```

---

### 第四步：验证服务

**在 2015 Mac 上测试**:
```bash
# 新开一个终端窗口
curl http://localhost:8000

# 应该返回 HTML 内容（包含 <!doctype html>）
```

**获取 IP 地址**:
```bash
ifconfig | grep "inet " | grep -v 127.0.0.1

# 输出类似: inet 192.168.1.100
```

---

### 第五步：iPad 连接测试

1. 确保 iPad 和 2015 Mac 在**同一 Wi-Fi**
2. 打开 Safari 浏览器
3. 访问 `http://192.168.1.100:8000`（替换为实际 IP）
4. 应该看到茅塞顿开助教的界面

---

### 第六步：设置开机自启动

**创建服务配置文件**:
```bash
sudo nano /Library/LaunchDaemons/com.maosai.tutor.plist
```

**复制粘贴以下内容**:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.maosai.tutor</string>
    <key>ProgramArguments</key>
    <array>
        <string>/Users/你的用户名/maosai_tutor_proto/.venv/bin/uvicorn</string>
        <string>app.main:app</string>
        <string>--host</string>
        <string>0.0.0.0</string>
        <string>--port</string>
        <string>8000</string>
    </array>
    <key>WorkingDirectory</key>
    <string>/Users/你的用户名/maosai_tutor_proto</string>
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

**重要**: 将 `你的用户名` 替换为实际用户名（可用 `whoami` 查看）

**加载服务**:
```bash
# 加载配置
sudo launchctl load /Library/LaunchDaemons/com.maosai.tutor.plist

# 启动服务
sudo launchctl start com.maosai.tutor

# 验证服务正在运行
sudo launchctl list | grep maosai

# 查看日志
tail -f /tmp/maosai_tutor.log
```

---

### 第七步：服务器优化

```bash
# 运行优化脚本
chmod +x optimize_server.sh
sudo ./optimize_server.sh
```

**优化内容**:
- ✅ 配置电源管理（连接电源时不休眠）
- ✅ 创建服务监控脚本（自动重启）
- ✅ 设置定时任务（每分钟检查）
- ✅ 创建管理脚本（快速控制）

---

## 📱 学生使用说明

### 日常使用流程

```
1. iPad 连接到 Wi-Fi（与 2015 Mac 同一网络）

2. 打开 Safari 浏览器

3. 访问 http://[2015 Mac IP]:8000

4. 开始学习！
   - 交互式实验室
   - AI 智能问答
   - 考前速通
   - OCR 拍照
```

### 管理命令（在 2015 Mac 上）

```bash
# 查看服务状态
~/maosai_manage.sh status

# 启动服务
~/maosai_manage.sh start

# 停止服务
~/maosai_manage.sh stop

# 重启服务
~/maosai_manage.sh restart

# 查看日志
~/maosai_manage.sh log
```

---

## 🔧 日常维护

### 查看资源使用

```bash
# 使用活动监视器
/Applications/Utilities/Activity Monitor.app

# 或使用命令行
top -o mem
```

### 查看服务日志

```bash
# 实时查看
tail -f /tmp/maosai_tutor.log

# 查看最近 50 行
tail -50 /tmp/maosai_tutor.log
```

### 更新代码（如果需要）

```bash
cd ~/maosai_tutor_proto

# 停止服务
~/maosai_manage.sh stop

# 替换代码文件
# ...

# 重启服务
~/maosai_manage.sh restart
```

---

## ⚠️ 常见问题

### 1. 端口被占用

**错误**: `Address already in use`

**解决**:
```bash
# 查看占用端口的进程
lsof -i :8000

# 杀死进程
kill -9 [PID]

# 或使用其他端口
uvicorn app.main:app --host 0.0.0.0 --port 8001
```

### 2. iPad 无法访问

**检查清单**:
- [ ] 2015 Mac 服务是否运行？`~/maosai_manage.sh status`
- [ ] 两台设备是否在同一 Wi-Fi？
- [ ] IP 地址是否正确？
- [ ] 防火墙是否阻止？（系统偏好设置 -> 安全性与隐私 -> 防火墙）

### 3. 服务自动停止

**查看日志**:
```bash
tail -50 /tmp/maosai_tutor.error
```

**手动重启**:
```bash
~/maosai_manage.sh restart
```

### 4. 内存占用过高

**检查**:
```bash
# 查看内存使用
top -o mem | head -20
```

**如果内存 > 6GB**:
- 重启服务
- 重启 Mac
- 考虑禁用部分功能（如 RAG）

---

## 🎯 最佳实践

### 电源管理

```bash
# 连接电源时，保持运行
pmset -c sleep 0

# 仅关闭显示器
pmset -c displaysleep 10

# 查看当前设置
pmset -g
```

### 网络配置

**固定 IP 地址**（推荐）:
1. 系统偏好设置 -> 网络
2. Wi-Fi -> 高级 -> TCP/IP
3. 配置 IPv4: 使用 DHCP（手动地址）
4. IP 地址: 192.168.1.100（或其他固定地址）
5. 路由器: 192.168.1.1
6. DNS: 8.8.8.8, 8.8.4.4

**好处**: IP 地址不会变化，iPad 书签不用修改

### 定期维护

```bash
# 每周运行一次
# 1. 检查更新
cd ~/maosai_tutor_proto
git pull  # 如果使用 git

# 2. 清理日志
> /tmp/maosai_tutor.log
> /tmp/maosai_tutor.error

# 3. 重启服务
~/maosai_manage.sh restart
```

---

## 📊 性能监控

### 创建监控仪表板

```bash
# 安装监控工具（可选）
brew install htop

# 使用 htop 查看资源
htop
```

### 查看服务统计

```bash
# 查看服务运行时间
ps aux | grep uvicorn | grep -v grep

# 查看网络连接
netstat -an | grep 8000
```

---

## 🎓 总结

### 双机部署优势

| 项目 | 说明 |
|------|------|
| **2018 Mac** | OpenClaw 专属，性能最佳 |
| **2015 Mac** | 助教专属，24/7 运行 |
| **iPad** | 随时访问，体验流畅 |
| **资源隔离** | 互不干扰，稳定性高 |
| **设备利用** | 旧物利用，环保经济 |

### 部署检查清单

- [ ] 2015 Mac 系统版本 ≥ 10.15
- [ ] Python 3.8+ 已安装
- [ ] 部署包已传输
- [ ] 虚拟环境已创建
- [ ] 依赖包已安装
- [ ] 服务启动成功
- [ ] 本地访问测试通过
- [ ] iPad 远程访问测试通过
- [ ] 开机自启动已配置
- [ ] 电源管理已优化
- [ ] 监控脚本已运行

---

**部署完成时间**: 约 20-30 分钟
**维护难度**: 低（几乎零维护）
**服务可用性**: 24/7
**学生体验**: ⭐⭐⭐⭐⭐

---

## 📞 需要帮助？

如果遇到问题：

1. 查看日志文件
2. 运行 `~/maosai_manage.sh status` 检查状态
3. 运行 `check_memory.sh` 查看资源
4. 重启服务或重启 Mac

祝你部署成功！🎉
