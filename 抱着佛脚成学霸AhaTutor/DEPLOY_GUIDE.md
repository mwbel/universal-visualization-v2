# 茅塞顿开高中数学助教 - 部署指南

## 📋 部署清单

**适用设备**: Intel 芯片 Mac (macOS 11+)
**目标用户**: 高一学生
**部署方式**: 本地服务器 + iPad 远程访问

---

## 🚀 快速部署（5分钟）

### 第一步：解压并安装

```bash
# 1. 解压部署包
tar -xzf maosai_tutor_deploy.tar.gz
cd maosai_tutor_proto

# 2. 运行一键安装脚本
chmod +x install.sh
./install.sh
```

### 第二步：启动服务

```bash
# 激活虚拟环境
source .venv/bin/activate

# 启动服务
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 第三步：获取 Mac IP 地址

```bash
# 在新终端窗口运行
ifconfig | grep "inet " | grep -v 127.0.0.1
```

会看到类似 `inet 192.168.1.100` 的地址

### 第四步：iPad 连接使用

1. 确保 iPad 和 Mac 在同一 Wi-Fi
2. Safari 浏览器访问: `http://192.168.1.100:8000`
3. 开始学习！

---

## 📦 部署包内容

```
maosai_tutor_deploy.tar.gz (1.4MB)
├── app/                          # 核心应用代码
│   ├── main.py                   # FastAPI 主程序
│   ├── models.py                 # 数据模型
│   ├── routers/                  # API 路由
│   ├── services/                 # 业务服务
│   ├── static/                   # 前端资源
│   └── templates/                # HTML 模板
├── aha_knowledge_catalog.jsonc   # 知识库配置
├── 数学rag/                      # RAG 知识库
├── requirements.txt              # Python 依赖
└── install.sh                    # 一键安装脚本
```

---

## ⚙️ 系统要求

- **操作系统**: macOS 11 (Big Sur) 或更高
- **Python**: 3.8 或更高（系统自带或自行安装）
- **内存**: 建议 8GB 以上
- **网络**: Mac 和 iPad 需在同一 Wi-Fi

---

## 🔧 手动安装（如果脚本失败）

```bash
# 1. 创建虚拟环境
python3 -m venv .venv

# 2. 激活虚拟环境
source .venv/bin/activate

# 3. 升级 pip
pip install --upgrade pip

# 4. 安装依赖（可能需要 5-10 分钟）
pip install -r requirements.txt

# 5. 启动服务
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

---

## 📱 iPad 使用说明

### 访问方式
- **家中**: 浏览器访问 `http://[Mac IP]:8000`
- **确保 Mac 服务持续运行**

### 核心功能
1. **交互式实验室**: 向量、函数、三角函数等可视化学习
2. **AI 智能问答**: 数学问题随时提问
3. **考前速通**: 随机练习题，支持换一批
4. **OCR 拍照**: 上传题目图片自动识别

### 常见问题
- **无法访问**: 检查 Mac 服务是否运行，防火墙是否允许
- **显示异常**: 刷新页面或清除浏览器缓存
- **功能缺失**: 检查依赖是否完整安装

---

## 🛠️ 高级配置

### 开机自启动（可选）

在 Mac 上创建启动脚本：
```bash
# 创建自动启动配置（需要管理员权限）
sudo nano /Library/LaunchDaemons/com.maosai.tutor.plist
```

内容：
```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.maosai.tutor</string>
    <key>ProgramArguments</key>
    <array>
        <string>/Users/学生用户名/maosai_tutor_proto/.venv/bin/uvicorn</string>
        <string>app.main:app</string>
        <string>--host</string>
        <string>0.0.0.0</string>
        <string>--port</string>
        <string>8000</string>
    </array>
    <key>WorkingDirectory</key>
    <string>/Users/学生用户名/maosai_tutor_proto</string>
    <key>RunAtLoad</key>
    <true/>
</dict>
</plist>
```

### 保持服务运行

使用 tmux 让服务在后台运行：
```bash
# 安装 tmux（如果未安装）
brew install tmux

# 创建会话并启动服务
tmux new -s maosai
cd ~/maosai_tutor_proto
source .venv/bin/activate
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# 分离会话：按 Ctrl+B 然后按 D
# 重新连接：tmux attach -t maosai
```

---

## 📞 技术支持

### 遇到问题？

1. **检查日志**: 查看终端输出的错误信息
2. **测试端口**: 浏览器访问 `http://localhost:8000` 是否正常
3. **查看依赖**: `pip list` 检查是否所有包都安装成功
4. **Python 版本**: `python3 --version` 确认版本 >= 3.8

### 常见错误

| 错误 | 解决方案 |
|------|---------|
| `ModuleNotFoundError` | 重新运行 `pip install -r requirements.txt` |
| `Address already in use` | 修改端口号 `--port 8001` |
| `Permission denied` | 检查文件权限，使用 `chmod +x` |
| iPad 无法访问 | 检查防火墙设置，确保允许 Python 网络访问 |

---

## ✅ 部署检查清单

- [ ] Python 3.8+ 已安装
- [ ] 虚拟环境创建成功
- [ ] 所有依赖包安装完成
- [ ] 服务启动成功（终端显示 "Application startup complete"）
- [ ] 本地浏览器访问 `http://localhost:8000` 正常
- [ ] iPad 浏览器访问 `http://[Mac IP]:8000` 正常
- [ ] 测试 AI 问答功能
- [ ] 测试可视化实验室

---

## 🎓 学生使用建议

1. **每日使用**: 建议每天使用 30-60 分钟
2. **功能顺序**: 先看可视化演示，再做题巩固
3. **错题回顾**: 利用 AI 问答功能深入理解错题
4. **考前突击**: 使用"考前速通"功能快速复习

---

**部署完成时间**: 约 5-10 分钟（取决于网络速度）
**维护难度**: 低（几乎零维护）
**适用场景**: 高中数学日常学习、预习、复习
