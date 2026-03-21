# 线性代数可视化模块 - 集成指南

## 📦 模块简介

线性代数可视化模块是一个**可插拔的共享模块**，可以轻松集成到任何 Web 项目中。本模块提供 17+ 个交互式可视化页面，涵盖线性代数的核心概念。

## ✨ 核心特性

- 🎨 **可配置主题** - 支持默认和暗色主题，可自定义颜色方案
- 📦 **模块化设计** - 可作为独立应用或嵌入到其他项目
- 🔌 **多种集成方式** - 支持 standalone、embedded、iframe 三种模式
- 📊 **17+ 可视化** - 涵盖行列式、矩阵、向量、特征值等核心概念
- 🗄️ **数据库系统** - 管理和搜索可视化概念
- 🛠️ **页面生成器** - 智能生成新的可视化页面
- 📱 **响应式设计** - 适配桌面和移动设备

## 🚀 快速开始

### 方式 1: 独立应用模式

直接在浏览器中打开 `index.html`：

```bash
cd main-app/modules/linear_algebra
python3 -m http.server 8000
# 访问 http://localhost:8000
```

### 方式 2: 嵌入模式（推荐）

#### 步骤 1: 引入必要文件

在你的 HTML 文件中引入模块文件：

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>我的项目</title>
</head>
<body>
  <!-- 模块容器 -->
  <div id="linear-algebra-container"></div>

  <!-- 1. 引入配置 -->
  <script src="path/to/modules/linear_algebra/module.config.js"></script>

  <!-- 2. 引入加载器 -->
  <script src="path/to/modules/linear_algebra/linear-algebra-loader.js"></script>

  <!-- 3. 引入 API -->
  <script src="path/to/modules/linear_algebra/linear-algebra-api.js"></script>

  <!-- 4. 初始化模块 -->
  <script>
    // 快速初始化
    LinearAlgebra.quickInit('./modules/linear_algebra/')
      .then(result => {
        console.log('模块初始化成功', result);
      });
  </script>
</body>
</html>
```

#### 步骤 2: 使用模块功能

```javascript
// 等待模块准备就绪
LinearAlgebra.ready(function(api) {

  // 加载特定可视化到容器
  api.loadVisualization('determinant-2d', '#linear-algebra-container');

  // 或创建嵌入式视图（带可视化列表）
  api.createEmbeddedView('#linear-algebra-container', {
    width: '100%',
    height: '800px'
  });

});
```

### 方式 3: iframe 嵌入

最简单的集成方式，适合快速集成：

```html
<iframe
  src="path/to/modules/linear_algebra/index.html"
  width="100%"
  height="800px"
  style="border: none; border-radius: 8px;">
</iframe>
```

## 📖 详细集成示例

### 示例 1: 显示特定可视化

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>行列式可视化</title>
  <style>
    #viz-container {
      width: 100%;
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
    }
  </style>
</head>
<body>
  <div id="viz-container"></div>

  <script src="./modules/linear_algebra/module.config.js"></script>
  <script src="./modules/linear_algebra/linear-algebra-loader.js"></script>
  <script src="./modules/linear_algebra/linear-algebra-api.js"></script>

  <script>
    LinearAlgebra.init({
      basePath: './modules/linear_algebra/',
      theme: 'default'
    }).then(() => {
      // 加载二阶行列式可视化
      LinearAlgebra.loadVisualization('determinant-2d', '#viz-container');
    });
  </script>
</body>
</html>
```

### 示例 2: 显示可视化列表

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>线性代数学习平台</title>
</head>
<body>
  <h1>线性代数可视化</h1>
  <div id="app"></div>

  <script src="./modules/linear_algebra/module.config.js"></script>
  <script src="./modules/linear_algebra/linear-algebra-loader.js"></script>
  <script src="./modules/linear_algebra/linear-algebra-api.js"></script>

  <script>
    LinearAlgebra.quickInit('./modules/linear_algebra/').then(() => {
      // 创建嵌入式视图，显示所有可视化
      LinearAlgebra.createEmbeddedView('#app', {
        width: '100%',
        height: '800px',
        filters: {
          chapter: 1  // 只显示第一章的内容
        }
      });
    });
  </script>
</body>
</html>
```

### 示例 3: 按章节过滤

```javascript
LinearAlgebra.ready(function(api) {
  // 获取第五章的所有可视化
  const chapter5 = api.getVisualizationList({
    chapter: 5
  });

  console.log('第五章可视化:', chapter5);

  // 搜索包含"特征值"的可视化
  const eigenvalueViz = api.getVisualizationList({
    keyword: '特征值'
  });

  console.log('特征值相关:', eigenvalueViz);
});
```

### 示例 4: 主题切换

```html
<button onclick="switchTheme('default')">默认主题</button>
<button onclick="switchTheme('dark')">暗色主题</button>

<div id="viz-container"></div>

<script>
  LinearAlgebra.quickInit('./modules/linear_algebra/').then(() => {
    LinearAlgebra.loadVisualization('eigenvalue', '#viz-container');
  });

  function switchTheme(themeName) {
    LinearAlgebra.setTheme(themeName);
  }
</script>
```

## 🎨 主题配置

### 使用内置主题

模块提供两种内置主题：

```javascript
// 默认主题（蓝色系）
LinearAlgebra.setTheme('default');

// 暗色主题
LinearAlgebra.setTheme('dark');
```

### 自定义主题

修改 `module.config.js` 中的主题配置：

```javascript
theme: {
  myTheme: {
    primaryColor: '#ff6b6b',      // 主色调
    secondaryColor: '#4ecdc4',    // 次要色
    backgroundColor: '#f7f7f7',   // 背景色
    cardBackground: '#ffffff',    // 卡片背景
    textColor: '#2d3436',         // 文字颜色
    borderRadius: '8px',          // 圆角大小
    fontFamily: 'Arial, sans-serif'  // 字体
  }
}
```

然后应用自定义主题：

```javascript
LinearAlgebra.setTheme('myTheme');
```

## 📚 API 参考

### 初始化方法

#### `LinearAlgebra.init(options)`

完整初始化模块。

**参数:**
```javascript
{
  basePath: string,           // 模块基础路径（必需）
  theme: 'default' | 'dark',  // 主题名称（可选，默认 'default'）
  enableDatabase: boolean,    // 启用数据库（可选，默认 true）
  enablePageGenerator: boolean // 启用页面生成器（可选，默认 true）
}
```

**返回:** `Promise<{success: boolean, message: string}>`

**示例:**
```javascript
LinearAlgebra.init({
  basePath: './modules/linear_algebra/',
  theme: 'dark',
  enableDatabase: true,
  enablePageGenerator: true
}).then(result => {
  if (result.success) {
    console.log('初始化成功');
  }
});
```

#### `LinearAlgebra.quickInit(basePath)`

快速初始化，使用默认配置。

**参数:**
- `basePath` (string) - 模块基础路径

**返回:** `Promise<{success: boolean, message: string}>`

**示例:**
```javascript
LinearAlgebra.quickInit('./modules/linear_algebra/');
```

#### `LinearAlgebra.ready(callback)`

等待模块准备就绪后执行回调。

**参数:**
- `callback` (function) - 回调函数，接收 API 实例作为参数

**示例:**
```javascript
LinearAlgebra.ready(function(api) {
  console.log('模块已准备就绪');
  api.loadVisualization('determinant-2d', '#container');
});
```

### 可视化管理

#### `loadVisualization(id, container)`

加载特定可视化到容器。

**参数:**
- `id` (string) - 可视化 ID
- `container` (string | HTMLElement) - 容器选择器或 DOM 元素

**返回:** `Promise<HTMLIFrameElement>`

**示例:**
```javascript
LinearAlgebra.loadVisualization('eigenvalue', '#my-container');
```

#### `getVisualizationList(filters)`

获取可视化列表。

**参数:**
```javascript
{
  chapter: number,    // 按章节过滤（可选）
  keyword: string,    // 按关键词过滤（可选）
  status: string      // 按状态过滤（可选）
}
```

**返回:** `Array<Visualization>`

**示例:**
```javascript
// 获取所有可视化
const all = LinearAlgebra.getVisualizationList();

// 获取第一章的可视化
const chapter1 = LinearAlgebra.getVisualizationList({ chapter: 1 });

// 搜索关键词
const results = LinearAlgebra.getVisualizationList({ keyword: '矩阵' });
```

#### `createEmbeddedView(container, options)`

创建嵌入式视图。

**参数:**
- `container` (string | HTMLElement) - 容器
- `options` (object) - 配置选项
  - `visualizationId` (string) - 指定可视化 ID（可选）
  - `width` (string) - 宽度（可选，默认 '100%'）
  - `height` (string) - 高度（可选，默认 '800px'）
  - `filters` (object) - 过滤条件（可选）

**返回:** `Promise<HTMLElement>`

**示例:**
```javascript
// 显示特定可视化
LinearAlgebra.createEmbeddedView('#app', {
  visualizationId: 'svd',
  width: '100%',
  height: '600px'
});

// 显示可视化列表
LinearAlgebra.createEmbeddedView('#app', {
  filters: { chapter: 5 }
});
```

### 数据库操作

#### `searchConcept(query)`

搜索概念。

**参数:**
- `query` (string) - 搜索关键词

**返回:** `Array<Concept>`

#### `getConcept(conceptName)`

获取概念详情。

**参数:**
- `conceptName` (string) - 概念名称

**返回:** `Concept | null`

#### `addConcept(chapterNum, conceptData)`

添加新概念。

**参数:**
- `chapterNum` (number) - 章节号
- `conceptData` (object) - 概念数据

**返回:** `boolean`

#### `getAllChapters()`

获取所有章节。

**返回:** `Array<Chapter>`

#### `getStatistics()`

获取统计信息。

**返回:** `Object`

### 页面生成

#### `generatePage(conceptData)`

生成可视化页面。

**参数:**
- `conceptData` (object) - 概念数据

**返回:** `string` (HTML 内容)

### 主题管理

#### `setTheme(themeName)`

设置主题。

**参数:**
- `themeName` (string) - 主题名称

**示例:**
```javascript
LinearAlgebra.setTheme('dark');
```

#### `getConfig()`

获取模块配置。

**返回:** `Object`

#### `getVersion()`

获取模块版本。

**返回:** `string`

### 事件系统

#### `on(eventName, callback)`

监听模块事件。

**参数:**
- `eventName` (string) - 事件名称
- `callback` (function) - 回调函数

**示例:**
```javascript
LinearAlgebra.on('ModuleReady', (event) => {
  console.log('模块已准备就绪', event.detail);
});
```

#### `off(eventName, callback)`

移除事件监听。

**参数:**
- `eventName` (string) - 事件名称
- `callback` (function) - 回调函数

### 清理方法

#### `destroy()`

销毁模块，清理资源。

**示例:**
```javascript
LinearAlgebra.destroy();
```

## 📊 可视化列表

### 第一章 行列式
- `determinant-2d` - 二阶行列式
- `determinant-3d` - 三阶行列式

### 第二章 矩阵
- `matrix-operations` - 矩阵运算
- `elementary-matrix` - 矩阵的初等变换
- `gaussian-elimination` - 高斯消元法
- `matrix-rank` - 矩阵的秩

### 第三章 向量
- `vector-space` - 向量的线性关系
- `vector-projection` - 向量投影
- `linear-equations` - 线性方程组

### 第五章 特征值与特征向量
- `eigenvalue` - 特征值与特征向量
- `orthogonal` - 正交矩阵
- `rotation` - 旋转矩阵
- `svd` - 奇异值分解
- `least-squares` - 最小二乘法

### 第六章 二次型
- `quadratic-form` - 二次型标准化

### 第七章 线性变换
- `linear-transformation` - 线性变换

## 🔧 高级配置

### 自动初始化

在 `module.config.js` 中配置自动初始化：

```javascript
integration: {
  embedded: {
    enabled: true,
    containerSelector: '#linear-algebra-module',
    autoInit: true,  // 启用自动初始化
    initOptions: {
      theme: 'default',
      showNavigation: true,
      showHeader: true,
      enableDatabase: true
    }
  }
}
```

### 性能优化

```javascript
performance: {
  lazyLoad: true,  // 启用懒加载
  preload: ['shared-styles.css', 'visualization-database.js'],
  cache: {
    enabled: true,
    duration: 3600000  // 缓存时长（毫秒）
  }
}
```

## 🌐 浏览器兼容性

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- 移动浏览器（iOS Safari 14+, Chrome Mobile）

## 📦 依赖

模块依赖以下库（通过 CDN 自动加载）：

- [Plotly.js](https://plotly.com/javascript/) 2.27.0 - 交互式图表
- [MathJax](https://www.mathjax.org/) 3.x - 数学公式渲染

## 🐛 常见问题

### Q: 模块初始化失败？

**A:** 检查以下几点：
1. 确保 `basePath` 路径正确
2. 确保按顺序引入了 config、loader、api 三个文件
3. 检查浏览器控制台是否有错误信息

### Q: 可视化无法显示？

**A:** 可能的原因：
1. 容器元素不存在或选择器错误
2. 可视化 ID 不正确
3. 模块未完全初始化（使用 `LinearAlgebra.ready()` 确保初始化完成）

### Q: 如何自定义样式？

**A:** 可以通过以下方式：
1. 修改 `module.config.js` 中的主题配置
2. 覆盖 CSS 变量（`--la-primary-color` 等）
3. 添加自定义 CSS 文件

### Q: 如何添加新的可视化？

**A:** 步骤：
1. 使用数据库管理界面添加概念
2. 使用页面生成器生成页面
3. 将生成的页面放到 `pages/` 目录
4. 在 `module.config.js` 的 `visualizations` 数组中注册

## 📄 许可证

MIT License

## 👥 作者

AI Assistant (Claude)

## 📌 版本

v3.0.0 - 可插拔共享模块版本

---

**创建日期**: 2025-03-17
**最后更新**: 2025-03-17
