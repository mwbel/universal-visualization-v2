# 物理动画生成器 - Web版使用指南

## 🌐 项目概述

这是一个基于Web的物理动画生成器，采用Google风格的三栏式页面设计，用户可以通过输入物理概念关键词，一键生成精美的Manim动画。

---

## 📁 项目结构

```
physics_version/
├── web/                      # 前端文件
│   ├── index.html           # 主页面（三栏布局）
│   └── app.js               # 前端逻辑
├── server.py                # Flask后端服务
├── physics_generator.py     # 基础物理动画
├── advanced_physics.py      # 高级物理动画
├── requirements.txt         # Python依赖
└── WEB_GUIDE.md            # 本文档
```

---

## 🚀 快速开始

### 1. 安装依赖

```bash
# 进入项目目录
cd Math2Manim/source_code/physics_version

# 安装Python依赖
pip3 install -r requirements.txt
```

### 2. 启动服务器

```bash
# 启动Flask服务器
python3 server.py
```

你会看到类似输出：
```
============================================================
物理动画生成器 - 后端服务
============================================================
工作目录: /Users/.../physics_version
媒体目录: /Users/.../physics_version/media
可用概念: 9个
============================================================

启动服务器...
访问地址: http://localhost:5000

按 Ctrl+C 停止服务器
```

### 3. 打开浏览器

在浏览器中访问：
```
http://localhost:5000
```

---

## 🎨 页面功能介绍

### 三栏布局

#### 左侧边栏 - 概念分类
- 📚 全部概念
- ⚙️ 力学
- ⚡ 电磁学
- 🌊 波动
- 🔥 热力学
- 🔬 现代物理

点击分类可以筛选对应的物理概念。

#### 中间主内容区
1. **搜索框**：输入物理概念名称
2. **快速概念标签**：点击快速填充
3. **生成按钮**：点击生成动画
4. **结果展示**：
   - 视频播放器
   - 生成的Manim代码
   - 复制代码按钮

#### 右侧边栏
1. **生成历史**：显示最近生成的动画
2. **使用提示**：操作步骤说明
3. **统计信息**：生成次数统计

---

## 💡 使用方法

### 方法1：输入概念名称

1. 在搜索框输入物理概念，例如："牛顿第二定律"
2. 点击"生成动画"按钮
3. 等待30-60秒
4. 查看生成的视频和代码

### 方法2：点击快速标签

1. 点击页面上的概念标签（如"简谐运动"）
2. 自动填充到搜索框并开始生成
3. 查看结果

### 方法3：从历史记录选择

1. 在右侧边栏查看历史记录
2. 点击历史项目重新生成

---

## 🎬 支持的物理概念

### 基础物理（4个）
- 牛顿第二定律
- 简谐运动
- 动能定理
- 电场

### 高级物理（5个）
- 抛体运动
- 波的干涉
- 电磁感应
- 多普勒效应
- 光电效应

---

## 🔧 API接口说明

### 1. 获取所有概念
```
GET /api/concepts
```

响应：
```json
{
  "success": true,
  "concepts": [
    {
      "name": "牛顿第二定律",
      "scene": "NewtonSecondLaw",
      "category": "mechanics"
    }
  ]
}
```

### 2. 生成动画
```
POST /api/generate
Content-Type: application/json

{
  "concept": "牛顿第二定律",
  "quality": "l"
}
```

响应：
```json
{
  "success": true,
  "concept": "牛顿第二定律",
  "scene": "NewtonSecondLaw",
  "videoUrl": "/media/videos/physics_generator/480p15/NewtonSecondLaw.mp4",
  "code": "from manim import *...",
  "generationTime": 15.5,
  "timestamp": "2026-03-09T17:00:00"
}
```

### 3. 获取服务状态
```
GET /api/status
```

### 4. 获取统计信息
```
GET /api/stats
```

---

## 🎨 页面特色

### 1. Google风格设计
- 简洁的三栏布局
- 流畅的动画效果
- 渐变色背景
- 毛玻璃效果（backdrop-filter）

### 2. 响应式设计
- 支持桌面端和移动端
- 自适应布局
- 触摸友好

### 3. 用户体验优化
- 实时加载状态
- 历史记录保存
- 一键复制代码
- 快速概念选择

---

## 🔍 技术栈

### 前端
- HTML5
- CSS3（Grid布局、Flexbox、渐变、动画）
- JavaScript（ES6+）
- LocalStorage（历史记录）

### 后端
- Python 3.11+
- Flask 3.0（Web框架）
- Flask-CORS（跨域支持）
- Manim 0.19.1（动画引擎）

---

## 📊 性能优化

### 1. 视频质量选项
- `l`: 480p15 - 快速生成（15-30秒）
- `m`: 720p30 - 中等质量（30-60秒）
- `h`: 1080p60 - 高质量（60-120秒）
- `k`: 2160p60 - 4K质量（120-300秒）

### 2. 缓存机制
- 已生成的视频会被缓存
- 重复请求直接返回缓存结果
- 历史记录保存在LocalStorage

---

## 🐛 故障排除

### 问题1：服务器启动失败

**错误**：`ModuleNotFoundError: No module named 'flask'`

**解决**：
```bash
pip3 install -r requirements.txt
```

### 问题2：生成动画失败

**错误**：`Manim执行失败`

**解决**：
```bash
# 检查manim是否正确安装
python3 -m manim --version

# 手动测试生成
python3 -m manim -pql physics_generator.py NewtonSecondLaw
```

### 问题3：视频无法播放

**原因**：浏览器不支持MP4格式

**解决**：
- 使用Chrome、Firefox、Safari等现代浏览器
- 检查视频文件是否存在

### 问题4：端口被占用

**错误**：`Address already in use`

**解决**：
```bash
# 查找占用5000端口的进程
lsof -i :5000

# 杀死进程
kill -9 <PID>

# 或者修改server.py中的端口号
app.run(port=5001)
```

---

## 🔐 安全注意事项

### 1. 生产环境部署
```python
# 关闭调试模式
app.run(debug=False)

# 使用生产级服务器（如Gunicorn）
gunicorn -w 4 -b 0.0.0.0:5000 server:app
```

### 2. 输入验证
- 后端已验证概念名称
- 防止路径遍历攻击
- 限制文件访问范围

### 3. 资源限制
- 设置生成超时（120秒）
- 限制并发请求数
- 定期清理临时文件

---

## 🚀 扩展功能建议

### 1. 用户系统
- 用户注册/登录
- 个人动画库
- 分享功能

### 2. 高级编辑
- 在线代码编辑器
- 参数可视化调整
- 实时预览

### 3. AI集成
- 自然语言描述转动画
- 智能参数优化
- 概念推荐

### 4. 社区功能
- 动画分享
- 评论点赞
- 排行榜

---

## 📝 开发指南

### 添加新的物理概念

1. **在physics_generator.py或advanced_physics.py中添加Scene类**：
```python
class YourNewPhysics(Scene):
    def construct(self):
        # 动画逻辑
        pass
```

2. **在server.py中添加映射**：
```python
CONCEPT_MAPPING = {
    '你的概念': {
        'scene': 'YourNewPhysics',
        'file': 'physics_generator.py',
        'category': 'mechanics'
    }
}
```

3. **在index.html中添加快速标签**：
```html
<span class="concept-tag" data-concept="你的概念">你的概念</span>
```

---

## 📞 获取帮助

### 文档
- [Manim官方文档](https://docs.manim.community/)
- [Flask官方文档](https://flask.palletsprojects.com/)

### 问题反馈
- 检查控制台错误信息
- 查看服务器日志
- 参考本文档的故障排除部分

---

## 🎉 总结

你现在拥有一个完整的Web版物理动画生成器！

**特点**：
✅ Google风格三栏布局
✅ 一键生成Manim动画
✅ 实时预览和代码展示
✅ 历史记录和统计
✅ 响应式设计
✅ RESTful API

**下一步**：
1. 启动服务器：`python3 server.py`
2. 打开浏览器：`http://localhost:5000`
3. 输入概念，生成动画！

**让物理动起来，让学习变得有趣！** 🎬✨
