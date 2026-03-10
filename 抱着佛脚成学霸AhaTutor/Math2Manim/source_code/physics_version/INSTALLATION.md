# 物理动画生成系统 - 安装和使用指南

## 📦 安装步骤

### 1. 安装Manim

Manim是一个强大的数学动画引擎，需要先安装它才能运行物理动画。

#### macOS安装方法：

```bash
# 方法1: 使用pip（推荐）
pip install manim

# 方法2: 使用conda
conda install -c conda-forge manim

# 方法3: 使用brew（需要先安装依赖）
brew install py3cairo ffmpeg
pip install manim
```

#### 验证安装：

```bash
manim --version
```

如果看到版本号（如 v0.18.0），说明安装成功。

---

## 🎬 快速开始

### 运行第一个物理动画

```bash
# 进入physics_version目录
cd Math2Manim/source_code/physics_version

# 运行牛顿第二定律动画（低质量快速预览）
manim -pql physics_generator.py NewtonSecondLaw
```

参数说明：
- `-p`: 渲染完成后自动播放
- `-q`: 质量设置
- `l`: 低质量（480p15fps，适合快速测试）

### 运行所有基础动画

```bash
# 牛顿第二定律
manim -pql physics_generator.py NewtonSecondLaw

# 简谐运动
manim -pql physics_generator.py SimpleHarmonicMotion

# 动能定理
manim -pql physics_generator.py KineticEnergyTheorem

# 电场
manim -pql physics_generator.py ElectricField
```

### 运行高级动画

```bash
# 抛体运动
manim -pql advanced_physics.py ProjectileMotion

# 波的干涉
manim -pql advanced_physics.py WaveInterference

# 电磁感应
manim -pql advanced_physics.py ElectromagneticInduction

# 多普勒效应
manim -pql advanced_physics.py DopplerEffect

# 光电效应
manim -pql advanced_physics.py PhotoelectricEffect
```

---

## 🎨 质量设置

根据需求选择不同的质量等级：

| 参数 | 分辨率 | 帧率 | 用途 | 渲染时间 |
|------|--------|------|------|----------|
| `-ql` | 480p | 15fps | 快速测试 | 最快 |
| `-qm` | 720p | 30fps | 一般预览 | 中等 |
| `-qh` | 1080p | 60fps | 高质量输出 | 较慢 |
| `-qk` | 2160p | 60fps | 4K输出 | 最慢 |

示例：
```bash
# 高质量渲染
manim -pqh physics_generator.py NewtonSecondLaw

# 4K渲染（用于专业制作）
manim -pqk physics_generator.py NewtonSecondLaw
```

---

## 📁 输出文件位置

渲染完成的视频会保存在：

```
Math2Manim/source_code/physics_version/media/videos/
├── physics_generator/
│   ├── 480p15/
│   │   └── NewtonSecondLaw.mp4
│   ├── 720p30/
│   └── 1080p60/
└── advanced_physics/
    ├── 480p15/
    │   └── ProjectileMotion.mp4
    └── ...
```

---

## 🔧 使用测试脚本

我们提供了一个自动化测试脚本来批量运行动画：

```bash
# 给脚本添加执行权限
chmod +x test_animations.py

# 测试所有动画
python3 test_animations.py

# 只测试基础动画
python3 test_animations.py --basic

# 只测试高级动画
python3 test_animations.py --advanced

# 测试特定场景
python3 test_animations.py --scene physics_generator.py:NewtonSecondLaw
```

---

## 🎯 自定义动画

### 修改现有动画

1. 打开对应的Python文件（如 `physics_generator.py`）
2. 找到要修改的Scene类
3. 调整参数，例如：

```python
# 修改颜色
box = Square(side_length=1, fill_color=BLUE, fill_opacity=0.8)

# 修改运动时间
self.play(box.animate.shift(RIGHT * 6), run_time=3)  # 改为3秒

# 修改公式
formula = MathTex(r"F = ma", font_size=60, color=YELLOW)
```

### 创建新动画

在 `physics_generator.py` 或 `advanced_physics.py` 中添加新的Scene类：

```python
class YourNewPhysics(Scene):
    def construct(self):
        # 标题
        title = Text("你的物理概念", font_size=48, color=BLUE)
        title.to_edge(UP)
        self.play(Write(title), run_time=1)

        # 添加你的动画逻辑
        # ...

        self.wait(2)
```

然后运行：
```bash
manim -pql physics_generator.py YourNewPhysics
```

---

## 🐛 常见问题

### 问题1: "manim: command not found"

**解决方案**：
```bash
# 确认Python和pip已安装
python3 --version
pip3 --version

# 重新安装manim
pip3 install manim

# 或者使用完整路径
python3 -m manim -pql physics_generator.py NewtonSecondLaw
```

### 问题2: LaTeX渲染错误

**解决方案**：
```bash
# macOS安装LaTeX
brew install --cask mactex-no-gui

# 或安装完整版
brew install --cask mactex
```

### 问题3: FFmpeg错误

**解决方案**：
```bash
# 安装FFmpeg
brew install ffmpeg

# 验证安装
ffmpeg -version
```

### 问题4: 渲染速度慢

**解决方案**：
- 使用低质量模式测试：`-ql`
- 减少动画时长：调整 `run_time` 参数
- 简化场景元素

---

## 📚 学习资源

### Manim教程
- 官方文档：https://docs.manim.community/
- 快速入门：https://docs.manim.community/en/stable/tutorials/quickstart.html
- 示例库：https://docs.manim.community/en/stable/examples.html

### 物理概念参考
- 费曼物理学讲义
- 大学物理教材
- Khan Academy物理课程

### 视频教程
- 3Blue1Brown频道
- Manim Community教程
- Physics Girl

---

## 💡 最佳实践

### 1. 开发流程
```bash
# 1. 低质量快速测试
manim -ql physics_generator.py NewtonSecondLaw

# 2. 中等质量预览
manim -qm physics_generator.py NewtonSecondLaw

# 3. 高质量最终渲染
manim -qh physics_generator.py NewtonSecondLaw
```

### 2. 代码组织
- 每个物理概念一个Scene类
- 使用有意义的变量名
- 添加注释说明物理含义
- 保持代码简洁清晰

### 3. 动画设计
- 先展示公式，再展示动画
- 使用颜色区分不同物理量
- 控制动画速度（不要太快）
- 添加适当的等待时间

---

## 🎓 教学建议

### 课堂使用
1. 提前渲染好动画（使用 `-qh`）
2. 准备好暂停点进行讲解
3. 结合板书和动画
4. 鼓励学生提问

### 在线教学
1. 录制屏幕配合讲解
2. 添加字幕和旁白
3. 分段发布便于学习
4. 提供源代码供学生实验

### 自主学习
1. 按顺序观看动画
2. 尝试修改参数
3. 创建自己的动画
4. 分享学习成果

---

## 🚀 下一步

1. **运行示例动画**：熟悉基本操作
2. **修改参数**：理解代码结构
3. **创建新动画**：实现自己的物理概念
4. **分享作品**：帮助更多人学习

---

## 📞 获取帮助

如果遇到问题：
1. 查看本文档的"常见问题"部分
2. 阅读Manim官方文档
3. 检查代码中的注释
4. 查看错误信息并搜索解决方案

---

**祝你使用愉快！让物理动起来！** 🎉✨
