# 概率论与数理统计 - 可插拔模块

## 📦 模块信息

- **名称**: probability_statistics
- **版本**: 3.0.0
- **类型**: 可插拔模块
- **作者**: AlVisualization Team

## 🎯 模块特性

这是一个独立的、可插拔的概率统计可视化模块，可以被多个父项目引用：

- ✅ **万物可视化** (main-app)
- ✅ **期末速通** (期末速通)
- ✅ 独立运行

## 📂 目录结构

```
probability_statistics/
├── core/                              # 核心内容（与父项目无关）
│   ├── pages/                         # 43个可视化页面
│   ├── lib/                           # 库文件（plotly, mathjax）
│   ├── knowledge/                     # 知识系统
│   │   ├── knowledge-tree.html
│   │   ├── concept-navigator-fast.html
│   │   └── knowledge-data.js
│   └── assets/                        # 资源文件
│
├── adapters/                          # 适配器（适配不同父项目）
│   ├── adapter-interface.js          # 适配器接口
│   ├── main-app-adapter.js           # 万物可视化适配器
│   └── exam-prep-adapter.js          # 期末速通适配器
│
├── config/                            # 配置文件
├── docs/                              # 文档
├── module.json                        # 模块元数据
└── README.md                          # 本文档
```

## 🔧 使用方法

### 1. 在万物可视化中使用

在 `main-app/modules/probability_statistics/` 创建引用：

```json
// module-ref.json
{
  "type": "module-reference",
  "modulePath": "../../../shared-modules/probability_statistics",
  "adapter": "main-app",
  "config": {
    "theme": "main-app",
    "showBreadcrumb": true
  }
}
```

在页面中加载适配器：

```html
<script src="../../../shared-modules/probability_statistics/adapters/adapter-interface.js"></script>
<script src="../../../shared-modules/probability_statistics/adapters/main-app-adapter.js"></script>
<script>
  const adapter = new MainAppAdapter({
    enableAnalytics: true
  });
  adapter.initialize();
</script>
```

### 2. 在期末速通中使用

在 `期末速通/modules/probability_statistics/` 创建引用：

```json
// module-ref.json
{
  "type": "module-reference",
  "modulePath": "../../shared-modules/probability_statistics",
  "adapter": "exam-prep",
  "config": {
    "theme": "exam-prep",
    "examMode": true
  }
}
```

在页面中加载适配器：

```html
<script src="../../shared-modules/probability_statistics/adapters/adapter-interface.js"></script>
<script src="../../shared-modules/probability_statistics/adapters/exam-prep-adapter.js"></script>
<script>
  const adapter = new ExamPrepAdapter();
  adapter.initialize();
</script>
```

### 3. 独立运行

直接打开模块中的任何 HTML 文件即可独立运行。

## 📊 内容清单

### 可视化页面（43个）
- 01-独立性.html
- 02-随机事件与样本空间.html
- 03-频率与概率.html
- ... (共43个页面)

### 知识系统
- knowledge-tree.html - 知识树导航
- concept-navigator-fast.html - 概念快速导航
- knowledge-data.js - 知识数据

### 库文件
- plotly.min.js (3.4MB) - 图表可视化
- tex-mml-chtml.js (1.1MB) - 数学公式渲染

## 🎨 适配器说明

### MainAppAdapter（万物可视化适配器）

**功能**：
- 加载主应用全局样式
- 设置面包屑导航
- 启用分析功能
- 适配主应用主题

**路径配置**：
- 返回主页：`../../../index.html`
- 资源路径：`../../../shared-modules/probability_statistics/core/`

### ExamPrepAdapter（期末速通适配器）

**功能**：
- 加载考试模式样式
- 显示考试模式徽章
- 启用快速导航
- 适配期末速通主题

**路径配置**：
- 返回主页：`../../index.html`
- 资源路径：`../../shared-modules/probability_statistics/core/`

## 🔌 适配器 API

### 基础方法

```javascript
// 获取导航路径
adapter.getNavigationPath()

// 获取资源路径
adapter.getResourcePath('pages/xxx.html')

// 获取返回链接
adapter.getBackLink()

// 获取面包屑
adapter.getBreadcrumb()

// 初始化模块
adapter.initialize()
```

### 辅助方法

```javascript
// 获取知识树路径
adapter.getKnowledgeTreePath()

// 获取概念导航器路径
adapter.getConceptNavigatorPath()

// 获取页面路径
adapter.getPagePath('01-独立性.html')
```

## 💡 优势

1. **单一数据源** - 所有内容只维护一份
2. **灵活适配** - 通过适配器适配不同父项目
3. **独立运行** - 模块可以独立运行和测试
4. **易于扩展** - 添加新父项目只需创建新适配器
5. **版本管理** - 模块有独立的版本号

## 🚀 快速开始

### 从万物可视化访问
```
main-app/modules/probability_statistics/index.html
```

### 从期末速通访问
```
期末速通/modules/probability_statistics/index.html
```

### 直接访问共享模块
```
shared-modules/probability_statistics/core/knowledge/knowledge-tree.html
```

## 📖 参考教材

《概率论与数理统计（第五版）》
- 作者：盛骤 等
- 出版社：高等教育出版社

## 🔄 更新日志

### v3.0.0 (2026-03-17)
- ✅ 创建可插拔模块架构
- ✅ 实现适配器系统
- ✅ 迁移43个可视化页面
- ✅ 集成知识导航系统
- ✅ 支持万物可视化和期末速通

---

**创建日期**: 2026年3月17日
**最后更新**: 2026年3月17日
