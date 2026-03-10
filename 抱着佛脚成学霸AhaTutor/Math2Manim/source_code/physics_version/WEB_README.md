# 🎬 物理动画生成器 - Web版

一个基于Web的物理概念可视化动画生成系统，采用Google风格的三栏式页面设计，让用户通过输入关键词一键生成精美的Manim动画。

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![Python](https://img.shields.io/badge/python-3.11+-green)
![Manim](https://img.shields.io/badge/manim-0.19.1-purple)
![Flask](https://img.shields.io/badge/flask-3.0.0-red)

---

## ✨ 特性

- 🎨 **Google风格三栏布局** - 简洁美观的用户界面
- ⚡ **一键生成动画** - 输入概念名称即可生成
- 📹 **实时预览** - 在线观看生成的动画视频
- 💻 **代码展示** - 查看和复制Manim源代码
- 📊 **历史记录** - 自动保存生成历史
- 📱 **响应式设计** - 支持桌面和移动设备
- 🔍 **分类筛选** - 按物理领域快速查找
- 🚀 **RESTful API** - 完整的后端接口

---

## 🖼️ 页面预览

### 三栏布局结构

```
┌─────────────────────────────────────────────────────────┐
│                    顶部导航栏                              │
├──────────┬─────────────────────────┬────────────────────┤
│          │                         │                    │
│  左侧栏   │      中间主内容区         │     右侧栏          │
│          │                         │                    │
│ 概念分类  │   搜索框 + 快速标签       │   生成历史          │
│          │   ─────────────         │                    │
│ 📚 全部   │   [输入概念...]  [生成]  │   🕐 历史记录       │
│ ⚙️ 力学   │                         │                    │
│ ⚡ 电磁学 │   快速概念标签            │   💡 使用提示       │
│ 🌊 波动   │   [牛顿] [简谐] [电场]   │                    │
│ 🔬 现代   │                         │   📊 统计信息       │
│          │   视频播放器              │                    │
│          │   ┌─────────────────┐   │                    │
│          │   │                 │   │                    │
│          │   │   [视频预览]     │   │                    │
│          │   │                 │   │                    │
│          │   └─────────────────┘   │                    │
│          │                         │                    │
│          │   代码展示区              │                    │
│          │   ┌─────────────────┐   │                    │
│          │   │ Python代码       │   │                    │
│          │   │ [复制代码]       │   │                    │
│          │   └─────────────────┘   │                    │
└──────────┴─────────────────────────┴────────────────────┘
```

---

## 🚀 快速开始

### 方法1：使用启动脚本（推荐）

```bash
cd Math2Manim/source_code/physics_version
./start.sh
```

### 方法2：手动启动

```bash
# 1. 安装依赖
pip3 install -r requirements.txt

# 2. 启动服务器
python3 server.py

# 3. 打开浏览器
# 访问 http://localhost:5000
```

---

## 📁 项目文件

```
physics_version/
├── web/                          # 前端文件
│   ├── index.html               # 主页面（三栏布局）
│   └── app.js                   # 前端JavaScript逻辑
│
├── server.py                    # Flask后端服务器
├── physics_generator.py         # 基础物理动画（4个）
├── advanced_physics.py          # 高级物理动画（5个）
│
├── requirements.txt             # Python依赖
├── start.sh                     # 快速启动脚本
├── WEB_GUIDE.md                # 详细使用指南
└── WEB_README.md               # 本文档
```

---

## 🎯 支持的物理概念

### 基础物理动画（4个）
| 概念 | 场景名 | 分类 |
|-----|--------|------|
| 牛顿第二定律 | NewtonSecondLaw | 力学 |
| 简谐运动 | SimpleHarmonicMotion | 力学 |
| 动能定理 | KineticEnergyTheorem | 力学 |
| 电场 | ElectricField | 电磁学 |

### 高级物理动画（5个）
| 概念 | 场景名 | 分类 |
|-----|--------|------|
| 抛体运动 | ProjectileMotion | 力学 |
| 波的干涉 | WaveInterference | 波动 |
| 电磁感应 | ElectromagneticInduction | 电磁学 |
| 多普勒效应 | DopplerEffect | 波动 |
| 光电效应 | PhotoelectricEffect | 现代物理 |

---

## 💡 使用方法

### 1. 输入概念生成

1. 在搜索框输入物理概念（如"牛顿第二定律"）
2. 点击"生成动画"按钮
3. 等待30-60秒
4. 查看视频和代码

### 2. 快速标签生成

1. 点击页面上的概念标签
2. 自动填充并开始生成
3. 查看结果

### 3. 历史记录重用

1. 在右侧边栏查看历史
2. 点击历史项目重新生成

---

## 🔧 技术栈

### 前端
- **HTML5** - 页面结构
- **CSS3** - 样式和布局
  - Grid布局（三栏）
  - Flexbox（组件）
  - 渐变背景
  - 毛玻璃效果
  - 动画过渡
- **JavaScript (ES6+)** - 交互逻辑
  - Fetch API（HTTP请求）
  - LocalStorage（历史记录）
  - DOM操作

### 后端
- **Python 3.11+** - 编程语言
- **Flask 3.0** - Web框架
- **Flask-CORS** - 跨域支持
- **Manim 0.19.1** - 动画引擎
- **Subprocess** - 进程管理

---

## 🌐 API接口

### 1. 获取所有概念
```http
GET /api/concepts
```

### 2. 生成动画
```http
POST /api/generate
Content-Type: application/json

{
  "concept": "牛顿第二定律",
  "quality": "l"
}
```

### 3. 获取服务状态
```http
GET /api/status
```

### 4. 获取统计信息
```http
GET /api/stats
```

详细API文档请查看 [WEB_GUIDE.md](WEB_GUIDE.md)

---

## 🎨 页面特色

### 1. 左侧边栏 - 概念分类
- 📚 全部概念
- ⚙️ 力学（4个）
- ⚡ 电磁学（2个）
- 🌊 波动（2个）
- 🔬 现代物理（1个）

点击分类可筛选对应概念。

### 2. 中间主内容区
- **搜索框**：输入物理概念
- **快速标签**：一键填充常用概念
- **生成按钮**：启动动画生成
- **加载动画**：显示生成进度
- **视频播放器**：预览生成的动画
- **代码展示**：查看Manim源代码
- **复制按钮**：一键复制代码

### 3. 右侧边栏
- **生成历史**：最近10条记录
- **使用提示**：操作步骤说明
- **统计信息**：生成次数统计

---

## 📊 性能说明

### 生成时间
- **低质量 (480p)**: 15-30秒
- **中等质量 (720p)**: 30-60秒
- **高质量 (1080p)**: 60-120秒
- **4K质量 (2160p)**: 120-300秒

### 视频大小
- **480p15**: ~100-300KB
- **720p30**: ~300-800KB
- **1080p60**: ~1-3MB
- **2160p60**: ~5-15MB

---

## 🐛 常见问题

### Q1: 服务器启动失败？
```bash
# 检查依赖
pip3 install -r requirements.txt

# 检查端口
lsof -i :5000
```

### Q2: 生成动画失败？
```bash
# 测试Manim
python3 -m manim --version

# 手动测试
python3 -m manim -pql physics_generator.py NewtonSecondLaw
```

### Q3: 视频无法播放？
- 使用Chrome/Firefox/Safari浏览器
- 检查视频文件是否存在
- 查看浏览器控制台错误

### Q4: 端口被占用？
```bash
# 修改server.py中的端口
app.run(port=5001)
```

更多问题请查看 [WEB_GUIDE.md](WEB_GUIDE.md)

---

## 🔐 安全建议

### 开发环境
```python
app.run(debug=True)  # 当前配置
```

### 生产环境
```python
app.run(debug=False)  # 关闭调试

# 使用Gunicorn
gunicorn -w 4 -b 0.0.0.0:5000 server:app
```

---

## 🚀 扩展功能

### 计划中的功能
- [ ] 用户登录系统
- [ ] 在线代码编辑器
- [ ] 参数可视化调整
- [ ] AI自动生成动画
- [ ] 动画分享功能
- [ ] 社区评论系统
- [ ] 多语言支持

---

## 📝 开发指南

### 添加新概念

1. **创建Scene类**（在physics_generator.py或advanced_physics.py）
```python
class YourNewPhysics(Scene):
    def construct(self):
        # 动画逻辑
        pass
```

2. **添加映射**（在server.py）
```python
CONCEPT_MAPPING = {
    '你的概念': {
        'scene': 'YourNewPhysics',
        'file': 'physics_generator.py',
        'category': 'mechanics'
    }
}
```

3. **添加标签**（在index.html）
```html
<span class="concept-tag" data-concept="你的概念">你的概念</span>
```

---

## 📚 相关文档

- [WEB_GUIDE.md](WEB_GUIDE.md) - 详细使用指南
- [INSTALLATION.md](INSTALLATION.md) - 安装说明
- [README.md](README.md) - 项目总览
- [SUMMARY.md](SUMMARY.md) - 项目总结

---

## 🙏 致谢

- **Manim Community** - 强大的动画引擎
- **Flask** - 轻量级Web框架
- **3Blue1Brown** - 数学可视化先驱
- **Math-To-Manim** - 核心思想来源

---

## 📄 许可证

MIT License

---

## 📞 快速链接

- 🌐 **访问地址**: http://localhost:5000
- 📖 **详细文档**: [WEB_GUIDE.md](WEB_GUIDE.md)
- 🐛 **问题反馈**: 查看控制台日志
- 💡 **使用提示**: 页面右侧边栏

---

## 🎉 开始使用

```bash
# 一键启动
./start.sh

# 然后在浏览器打开
# http://localhost:5000
```

**让物理动起来，让学习变得有趣！** 🎬✨
