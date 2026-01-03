# 第一基本形式与第二基本形式 - 可视化页面

## 如何使用

### 方法1：使用本地HTTP服务器（推荐）

1. 打开终端，进入页面所在目录：
```bash
cd /Users/Min369/Documents/同步空间/Manju/Projects/AlVisualization/main-app/modules/differential_geometry/pages/act-1/
```

2. 运行启动脚本：
```bash
./start-server.sh
```

3. 在浏览器中访问：
```
http://localhost:8080/chapter2.5-fundamental-forms.html
```

### 方法2：手动启动服务器

如果没有启动脚本，可以使用以下命令：

**使用 Python 3：**
```bash
cd /Users/Min369/Documents/同步空间/Manju/Projects/AlVisualization/main-app/modules/differential_geometry/pages/act-1/
python3 -m http.server 8080
```

**使用 Python 2：**
```bash
cd /Users/Min369/Documents/同步空间/Manju/Projects/AlVisualization/main-app/modules/differential_geometry/pages/act-1/
python -m SimpleHTTPServer 8080
```

**使用 PHP：**
```bash
cd /Users/Min369/Documents/同步空间/Manju/Projects/AlVisualization/main-app/modules/differential_geometry/pages/act-1/
php -S localhost:8080
```

然后在浏览器访问：`http://localhost:8080/chapter2.5-fundamental-forms.html`

### 方法3：使用其他HTTP服务器

如果你使用 VS Code，可以安装 "Live Server" 扩展：
1. 安装 "Live Server" 扩展
2. 右键点击 `chapter2.5-fundamental-forms.html`
3. 选择 "Open with Live Server"

## 注意事项

⚠️ **不要直接用 file:// 协议打开HTML文件**

直接双击HTML文件打开会遇到以下问题：
- CORS（跨域资源共享）错误
- JavaScript无法加载
- 样式可能无法正确应用

**错误示例：**
```
file:///.../chapter2.5-fundamental-forms.html  ❌
```

**正确示例：**
```
http://localhost:8080/chapter2.5-fundamental-forms.html  ✅
```

## 网络要求

页面需要从CDN加载以下资源：
- **Plotly** (https://cdn.plot.ly/plotly-latest.min.js) - 3D可视化库
- **MathJax** (https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js) - 数学公式渲染

如果无法访问这些CDN，可以：
1. 使用VPN或代理
2. 或者下载这些库到本地并修改HTML中的引用路径

## 功能说明

本页面包含以下可视化内容：

1. **第一基本形式（内蕴度量）**
   - 参数化曲面可视化
   - 系数矩阵 (E, F, G) 计算
   - 弧长和面积测量

2. **第二基本形式（外蕴曲率）**
   - 法向量场显示
   - 系数矩阵 (e, f, g) 计算
   - 高斯曲率计算

3. **交互式计算器**
   - 多种曲面类型选择
   - 实时参数调整
   - 数据导出功能

## 浏览器兼容性

推荐使用现代浏览器：
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## 故障排除

### 页面无法加载
- 检查是否使用了HTTP服务器
- 查看浏览器控制台错误信息
- 确认网络连接正常（CDN资源）

### 数学公式不显示
- 检查MathJax是否成功加载
- 等待几秒钟让MathJax完成渲染
- 刷新页面重试

### 3D图形不显示
- 检查Plotly是否成功加载
- 确认浏览器支持WebGL
- 更新浏览器到最新版本

## 联系与反馈

如有问题或建议，请在项目中提issue。
