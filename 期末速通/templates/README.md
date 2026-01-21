# 可视化页面模板目录

## 📁 目录结构

```
templates/
├── visualization-page-template.html    # 完整页面模板（主要使用）
├── visualization-page-standard.md      # 完整开发规范文档
├── quick-reference.md                  # 快速参考指南
└── README.md                           # 本文件
```

---

## 🎯 使用指南

### 快速开始（3步完成）

1. **复制模板**
   ```bash
   cp visualization-page-template.html your-new-page.html
   ```

2. **查看快速参考**
   - 打开 `quick-reference.md`
   - 按照步骤修改5个关键位置

3. **查阅详细规范**（如需要）
   - 打开 `visualization-page-standard.md`
   - 查找具体功能的实现要求

---

## 📄 文件说明

### 1. visualization-page-template.html
**用途：** 完整的可视化页面模板

**包含内容：**
- ✅ 完整的 HTML 结构
- ✅ 导航栏系统
- ✅ MathJax 配置
- ✅ Plotly.js 加载
- ✅ 加载动画
- ✅ 样式定义
- ✅ 示例 draw() 函数
- ✅ 事件绑定示例

**使用场景：**
- 创建新的可视化页面时，直接复制此文件作为起点

---

### 2. visualization-page-standard.md
**用途：** 完整的开发规范文档

**包含内容：**
- 📋 必须实现的功能清单
- 📐 页面结构标准
- 🎨 样式规范
- 📝 内容编写规范
- ⚙️ 交互规范
- ✅ 开发检查清单

**使用场景：**
- 需要了解详细实现要求时
- 需要查看代码示例时
- 需要确认页面是否完整时

---

### 3. quick-reference.md
**用途：** 快速参考指南

**包含内容：**
- 🚀 5分钟快速上手
- 📝 LaTeX 速查表
- ⚙️ 常用代码片段
- 🎨 颜色速查
- ✅ 提交前5项检查
- 🐛 常见问题速查

**使用场景：**
- 快速查找 LaTeX 语法
- 快速复制代码片段
- 快速排查问题

---

## 💡 典型使用流程

### 场景1：创建新的可视化页面

```bash
# 1. 复制模板
cp visualization-page-template.html conditional_probability.html

# 2. 编辑文件，修改关键位置
# - 打开文件找到 5 个关键位置并修改

# 3. 实现可视化逻辑
# - 在 draw() 函数中添加你的代码

# 4. 测试
# - 浏览器打开文件
# - 拖动滑块测试

# 5. 完成！
```

### 场景2：查找如何实现某个功能

```bash
# 1. 打开详细规范文档
open visualization-page-standard.md

# 2. 使用搜索功能
# - 搜索关键词（如 "导航栏"、"MathJax"、"Plotly"）

# 3. 查看示例代码
# - 复制示例代码到你的文件

# 4. 根据需要调整
```

### 场景3：快速检查页面质量

```bash
# 1. 打开快速参考
open quick-reference.md

# 2. 查看"提交前5项检查"
# - 逐一检查每项

# 3. 查看控制台
# - F12 打开开发者工具
# - 确认没有错误

# 4. 完成！
```

---

## 🎓 学习路径

### 初学者
1. 阅读 `quick-reference.md` 的"5分钟快速上手"
2. 复制模板并完成一个简单页面
3. 查看 `visualization-page-standard.md` 了解详细规范

### 进阶开发者
1. 直接使用 `visualization-page-template.html`
2. 参考 `quick-reference.md` 的 LaTeX 速查表
3. 遇到问题时查看 `visualization-page-standard.md` 的对应章节

### 高级开发者
1. 熟练掌握模板后，根据需求定制
2. 参考规范文档进行优化
3. 贡献新的示例和改进

---

## 📊 模板特点

### 优势
- ✅ **即开即用** - 复制后立即开始开发
- ✅ **完整功能** - 包含所有必需组件
- ✅ **最佳实践** - 符合所有开发规范
- ✅ **详细注释** - 每个部分都有说明
- ✅ **实时更新** - 与规范保持同步

### 保证
- 🎯 **质量标准** - 所有页面都保持一致的高质量
- 🎨 **视觉统一** - 统一的样式和用户体验
- 📝 **内容规范** - 统一的写作和数学符号标准
- ⚙️ **功能完整** - 所有必需功能都已实现

---

## 🔧 自定义和扩展

### 修改模板

如果你需要修改模板本身：

1. **先备份**
   ```bash
   cp visualization-page-template.html visualization-page-template.html.backup
   ```

2. **修改并测试**
   - 在实际页面中测试修改
   - 确认所有功能正常

3. **更新文档**
   - 同步更新 `visualization-page-standard.md`
   - 更新 `quick-reference.md`

4. **版本记录**
   - 在文档中记录修改内容和日期

---

## 📞 获取帮助

### 遇到问题时：

1. **查看常见问题**
   - `quick-reference.md` 的"常见问题速查"

2. **查看详细规范**
   - `visualization-page-standard.md` 的对应章节

3. **参考示例页面**
   - `/conditional_probability.html` - 完整实现示例

4. **检查控制台**
   - F12 打开开发者工具
   - 查看 Console 标签的错误信息

---

## 📈 版本历史

### v1.0 (2025-01-18)
- ✅ 初始版本
- ✅ 包含完整模板
- ✅ 包含详细规范
- ✅ 包含快速参考

---

**维护者：** AI Assistant (Claude)
**最后更新：** 2025-01-18
**版本：** v1.0
