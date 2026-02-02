# 使用 VS Code Remote-SSH 连接校园网服务器

## 快速开始

### 1. 打开 Remote-SSH 面板

在 VS Code 中：
- 按 `Cmd + Shift + P` (macOS)
- 输入 `Remote-SSH: Connect to Host...`
- 或点击左侧活动栏的 📡 图标

### 2. 连接到已配置的服务器

在列表中选择：`school-server`

或者直接在终端输入：
```bash
code --remote ssh-remote+school-server
```

### 3. 打开远程工作目录

连接成功后：
1. 点击 `File > Open Folder`
2. 输入路径：`/home/mwu/` (或你的用户目录)
3. 点击 `Open`

### 4. 在远程服务器上工作

现在你可以在 VS Code 中：
- ✅ 编辑远程文件
- ✅ 使用终端
- ✅ 运行 Python 脚本
- ✅ 调试代码

---

## 配置新的服务器（如果需要）

### 通过 VS Code 图形界面配置

1. 按 `Cmd + Shift + P`
2. 输入 `Remote-SSH: Open SSH Configuration File`
3. 选择 `~/.ssh/config`
4. 添加新配置：

```
Host my-campus-server
    HostName 49.52.18.227
    User mwu
    Port 22
```

保存后，新服务器会出现在连接列表中。

---

## 常见操作

### 在远程服务器上运行命令

1. 连接到服务器后，打开终端：`` ` Cmd+` ` (macOS)
2. 或点击菜单：`Terminal > New Terminal`
3. 现在可以在远程服务器上执行命令

### 上传文件到服务器

在 VS Code 终端中：
```bash
# 在本地 Mac 上执行
scp local_file.txt mwu@49.52.18.227:/home/mwu/
```

### 从服务器下载文件

```bash
# 在本地 Mac 上执行
scp mwu@49.52.18.227:/home/mwu/remote_file.txt ./
```

---

## 使用 Remote-SSH 部署 PDF 分割工具

### 1. 连接到服务器

按 `Cmd + Shift + P` → `Remote-SSH: Connect to Host...` → 选择 `school-server`

### 2. 在远程服务器创建工作目录

在 VS Code 终端中：
```bash
mkdir -p ~/pdf-splitter/{books,output}
cd ~/pdf-splitter
```

### 3. 上传脚本

从你的 Mac 本地终端：
```bash
scp pdf_chapter_splitter.py mwu@49.52.18.227:~/pdf-splitter/
```

### 4. 在 VS Code 中编辑脚本

1. 连接到服务器后，打开文件：
   - `File > Open File`
   - 选择 `/home/mwu/pdf-splitter/pdf_chapter_splitter.py`

2. 在 VS Code 中编辑

3. 保存后直接在远程终端运行

### 5. 上传 PDF 文件

```bash
# 在 Mac 本地
scp "书籍/概率论与数理统计第五版盛骤-完整版.pdf" \
    mwu@49.52.18.227:~/pdf-splitter/books/
```

### 6. 在远程终端运行分割

在 VS Code 远程终端中：
```bash
cd ~/pdf-splitter
python3 pdf_chapter_splitter.py books/概率论与数理统计第五版盛骤-完整版.pdf --ocr -o output
```

---

## 优势

使用 VS Code Remote-SSH 的好处：

✅ **图形化编辑** - 比命令行更方便
✅ **代码高亮** - Python 语法高亮
✅ **智能提示** - 自动补全
✅ **集成终端** - 无需切换应用
✅ **文件浏览** - 可视化查看远程文件
✅ **直接运行** - 保存即运行

---

## 快捷键

| 操作 | 快捷键 |
|-----|--------|
| 打开命令面板 | `Cmd + Shift + P` |
| 打开终端 | `` Ctrl+` `` |
| 切换远程/本地 | 重新打开窗口 |
| 保存文件 | `Cmd + S` |

---

## 故障排查

### 问题：看不到 Remote-SSH 图标

**解决**：
1. 确认扩展已安装
2. 重新加载窗口：`Developer: Reload Window`

### 问题：无法连接到服务器

**解决**：
1. 先测试 SSH 连接：
   ```bash
   ssh mwu@49.52.18.227
   ```
2. 检查网络连接
3. 确认在校园网内

### 问题：连接后打不开文件夹

**解决**：
1. 确认路径存在
2. 检查文件权限
3. 尝试绝对路径：`/home/mwu/`

---

**现在试试连接到你的服务器吧！** 🚀
