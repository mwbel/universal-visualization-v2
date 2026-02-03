# 🌐 万物可视化项目 - HTTP服务器使用指南

本项目已配置多端口HTTP服务器，方便前端开发测试。

## 🚀 快速启动

### 1. 启动所有服务器
```bash
./start-http-servers.sh
```

### 2. 检查服务器状态
```bash
./check-servers.sh
```

### 3. 停止所有服务器
```bash
./stop-http-servers.sh
```

## 📊 服务器配置

| 端口 | 目录 | 用途 | 访问地址 |
|------|------|------|----------|
| 8000 | 项目根目录 | 主要文件和测试页面 | http://localhost:8000 |
| 8001 | frontend-v2 | 现代化前端应用 | http://localhost:8001 |
| 8002 | main-app | 主应用界面 | http://localhost:8002 |

## 🔗 重要页面访问

### 数学公式测试
- **MathJax测试页面**: http://localhost:8000/test-mathjax.html
- 包含各种数学公式渲染测试
- 支持内联公式 `$E = mc^2$` 和块级公式 `$$\int_a^b f(x)dx$$`

### 主要应用
- **万物可视化 v2.0**: http://localhost:8001/
- 集成AI驱动的可视化生成平台
- 支持数学、天文、物理等多学科可视化

- **Main-app修复版**: http://localhost:8002/index-fixed.html
- 传统主应用界面
- 包含完整的模块导航

### 开发测试页面
- **综合测试**: http://localhost:8000/comprehensive-test-suite.html
- **浏览器兼容性**: http://localhost:8000/browser_compatibility_test.html
- **用户界面测试**: http://localhost:8000/user_experience_test.html

## 🌍 网络访问

服务器绑定到 `0.0.0.0`，支持局域网内其他设备访问：

```bash
# 获取您的局域网IP
ifconfig | grep "inet " | grep -v 127.0.0.1
```

局域网访问格式：
- http://[您的IP]:8000
- http://[您的IP]:8001
- http://[您的IP]:8002

## 🛠️ 服务器特性

### MathJax 3.x 支持
- ✅ 自动渲染数学公式
- ✅ 支持LaTeX语法
- ✅ 响应式设计
- ✅ 高性能渲染

### CORS 支持
Python HTTP服务器默认支持CORS，可以：
- 跨域访问静态资源
- 支持前端框架开发
- API接口调用（如需要）

### MIME类型支持
自动识别并正确处理：
- HTML页面 (`text/html`)
- CSS样式表 (`text/css`)
- JavaScript脚本 (`application/javascript`)
- JSON数据 (`application/json`)
- 图片文件 (`image/*`)

## 🔧 开发调试

### 浏览器开发者工具
1. 打开任意应用页面
2. 按 `F12` 或右键选择"检查"
3. 查看控制台输出和网络请求

### 实时刷新
大多数页面支持实时刷新：
- 修改HTML/CSS/JS文件后直接刷新浏览器
- 无需重启服务器

### 日志查看
```bash
# 查看服务器进程
ps aux | grep "python3 -m http.server"

# 查看端口占用
lsof -i :8000,8001,8002
```

## ⚠️ 注意事项

1. **端口占用**: 确保8000-8002端口未被其他程序占用
2. **防火墙**: 如需局域网访问，请检查防火墙设置
3. **文件权限**: 确保脚本有执行权限 (`chmod +x *.sh`)
4. **Python版本**: 需要Python 3.7或更高版本

## 🆘 常见问题

### Q: 端口已被占用怎么办？
```bash
# 查看占用进程
lsof -i :8000

# 杀死进程
kill -9 <PID>

# 或修改启动脚本中的端口号
```

### Q: 页面无法访问？
```bash
# 检查服务器状态
./check-servers.sh

# 重启服务器
./stop-http-servers.sh
./start-http-servers.sh
```

### Q: MathJax公式不显示？
1. 检查网络连接
2. 查看浏览器控制台错误信息
3. 确认使用了正确的LaTeX语法

## 📞 技术支持

如遇到问题，请：
1. 运行 `./check-servers.sh` 获取服务器状态
2. 查看浏览器开发者工具的控制台
3. 检查项目日志文件

---

**🎉 享受您的万物可视化开发体验！**