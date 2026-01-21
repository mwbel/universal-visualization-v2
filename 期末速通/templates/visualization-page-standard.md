# 概率统计可视化页面开发规范

## 📋 概述

本文档定义了创建概率统计可视化页面的**标准规范**和**最佳实践**。所有新页面必须遵循这些标准，确保：

- ✅ 统一的用户体验
- ✅ 专业的数学排版
- ✅ 流畅的交互体验
- ✅ 完整的功能实现

---

## 🎯 必须实现的功能

### 1. 导航栏系统

**要求：** 每个页面必须包含导航栏，提供清晰的导航路径。

#### 必需元素：
- **返回上一级按钮** - 使用 `history.back()`
- **期末速通主页按钮** - 链接到 `../../期末速通/index.html`
- **页面标题** - 清晰描述当前页面内容
- **面包屑导航** - 显示完整路径（期末速通 / 概率统计 / 当前页面）

#### 实现代码：
```html
<nav class="page-navbar">
    <div class="nav-buttons">
        <button class="nav-btn nav-btn-back" onclick="history.back()">
            返回上一级
        </button>
        <a href="../../期末速通/index.html" class="nav-btn nav-btn-home">
            期末速通主页
        </a>
    </div>

    <div class="page-title">
        <h1>📊 页面标题</h1>
    </div>

    <div class="breadcrumb">
        <div class="breadcrumb-item">
            <a href="../../期末速通/index.html">期末速通</a>
            <span class="breadcrumb-separator">/</span>
        </div>
        <div class="breadcrumb-item">
            <a href="../../期末速通/index.html">概率统计</a>
            <span class="breadcrumb-separator">/</span>
        </div>
        <div class="breadcrumb-item">
            <a href="#">当前页面</a>
        </div>
    </div>
</nav>
```

---

### 2. LaTeX 数学公式渲染

**要求：** 所有数学符号、数字和公式必须使用 LaTeX 格式并用 MathJax 渲染。

#### MathJax 配置标准：
```javascript
window.MathJax = {
  tex: {
    inlineMath: [['$', '$']],          // 行内公式使用 $...$
    displayMath: [['$$', '$$']],       // 块级公式使用 $$...$$
    processEscapes: true
  },
  svg: {
    fontCache: 'global'
  }
};
```

#### LaTeX 使用规则：

| 类型 | 错误写法 | ✅ 正确写法 |
|------|---------|-----------|
| 事件符号 | A, B | `$A$`, `$B$` |
| 数字 | 1, 2, 6 | `$1$`, `$2$`, `$6$` |
| 分数 | 1/2, 1/6 | `$\frac{1}{2}$`, `$\frac{1}{6}$` |
| 概率 | P(A), P(B|A) | `$P(A)$`, `$P(B|A)$` |
| 集合运算 | A∩B, A∪B | `$A \cap B$`, `$A \cup B$` |
| 条件概率 | P(B|A) | `$P(B|A)$` |
| 空集 | 空集 | `$\emptyset$` |
| 包含 | A⊂B | `$A \subset B$` |
| 约等 | ≈, ≠ | `$\approx$`, `$\neq$` |

#### 示例：
```html
<!-- ❌ 错误 -->
<p>事件A发生时，概率从1/6变为1/3</p>

<!-- ✅ 正确 -->
<p>事件$A$发生时，概率从$\frac{1}{6}$变为$\frac{1}{3}$</p>
```

---

### 3. 加载动画

**要求：** 页面必须显示加载动画，提升用户体验。

#### 实现要求：
- 在 `<body>` 开始处添加加载遮罩层
- 页面加载完成后（500ms）自动隐藏
- 显示友好的加载文本

#### 代码模板：
```html
<div id="loading-overlay">
    <div class="loading-spinner"></div>
    <div class="loading-text">正在加载【可视化名称】...</div>
</div>

<script>
window.addEventListener('load', function() {
    setTimeout(function() {
        const overlay = document.getElementById('loading-overlay');
        if (overlay) {
            overlay.classList.add('loaded');
        }
    }, 500);
});
</script>
```

---

### 4. 参数探索控件

**要求：** 提供滑块控件让用户调整参数，实时看到可视化结果。

#### 必需元素：
1. **参数滑块** - 使用 `<input type="range">`
2. **参数标签** - 使用 LaTeX 格式显示参数名
3. **数值显示** - 实时显示当前参数值
4. **计算结果** - 使用 LaTeX 渲染的公式

#### 代码模板：
```html
<div class="control-panel">
    <label>$P(A)$: <input type="range" id="pa" min="0.1" max="0.9" step="0.05" value="0.5"></label>
    <span id="pa-val">0.5</span><br>

    <label>$P(B)$: <input type="range" id="pb" min="0.1" max="0.9" step="0.05" value="0.4"></label>
    <span id="pb-val">0.4</span><br>

    <div id="calcs" style="margin-top:10px; font-weight:bold;"></div>
</div>
```

---

### 5. 动态可视化

**要求：** 可视化图表必须根据参数动态更新。

#### 实现原则：

1. **使用 Plotly.react 或 Plotly.newPlot**
   - 优先使用 `Plotly.react()`（更高效）
   - 如果图表不更新，使用 `Plotly.newPlot()`（强制重建）

2. **动态调整可视化元素**
   - 椭圆/图形大小根据参数值变化
   - 位置根据计算结果调整
   - 颜色、透明度等视觉属性动态变化

3. **添加唯一标识强制更新**
   ```javascript
   const timestamp = Date.now();
   layout['data-revision'] = timestamp;
   ```

#### 代码模板：
```javascript
function draw() {
    console.log('draw() 函数被调用');

    // 1. 读取参数
    const pa = parseFloat(document.getElementById('pa').value);
    const pb = parseFloat(document.getElementById('pb').value);

    // 2. 更新显示
    document.getElementById('pa-val').innerText = pa.toFixed(2);

    // 3. 计算结果（LaTeX 格式）
    const calcsEl = document.getElementById('calcs');
    calcsEl.innerHTML = `$P(A|B) = \\frac{P(A \\cap B)}{P(B)} = ${result.toFixed(3)}$`;

    // 4. 渲染 MathJax
    if (window.MathJax && window.MathJax.typesetPromise) {
        MathJax.typesetPromise([calcsEl]);
    }

    // 5. 动态可视化
    const timestamp = Date.now();
    const layout = {
        title: {text: '<b>标题</b>'},
        // 根据 pa, pb 动态计算图形大小和位置
        shapes: [
            {
                type: 'circle',
                xref: 'x', yref: 'y',
                x0: centerX - radius,
                y0: centerY - radius,
                x1: centerX + radius,
                y1: centerY + radius
            }
        ],
        'data-revision': timestamp
    };

    Plotly.newPlot('plot', [], layout);
}

// 6. 绑定事件
document.getElementById('pa').addEventListener('input', draw);
document.getElementById('pb').addEventListener('input', draw);
```

---

## 📐 页面结构标准

### 必需区块（按顺序）：

1. **`<!DOCTYPE html>`** - HTML5 声明
2. **`<head>`** - 包含 meta、title、样式、脚本
3. **外部库加载** - Plotly.js（国内CDN）
4. **MathJax 配置** - 标准配置
5. **CSS 样式** - 内嵌或外部
6. **`</head><body>`**
7. **加载遮罩层** - 第一个元素
8. **导航栏** - 第二个元素
9. **主要内容区** - 包含介绍和可视化
10. **脚本逻辑** - `draw()` 函数和事件绑定

### 内容区块结构：

```html
<div class="content-wrapper">
    <!-- 页面主标题 -->
    <h1>可视化标题：数学概念</h1>

    <!-- 介绍区域 -->
    <div class="section-container intro-box">
        <h2>📖 一言以蔽之</h2>
        <p>简明描述（使用 LaTeX）</p>

        <div>
            <h3>🛠️ 适用场景</h3>
            <p>应用场景描述</p>
        </div>

        <div>
            <h3>📐 基础知识</h3>
            <p>数学定义（使用 LaTeX）</p>
            <div class="mathjax-block">
                $$ 核心公式 $$
            </div>
        </div>
    </div>

    <!-- 参数探索与可视化区域 -->
    <div class="section-container">
        <h2>🎛️ 参数探索与可视化</h2>

        <div class="control-panel">
            <!-- 参数控件 -->
        </div>

        <div id="plot">
            <!-- Plotly 图表 -->
        </div>
    </div>
</div>
```

---

## 🎨 样式规范

### 颜色标准：

```css
:root {
    --primary-color: #5B8CBA;      /* 主色调 */
    --border-color: #e2e8f0;       /* 边框颜色 */
    --bg-color: #f8f9fa;           /* 背景色 */
    --text-color: #2c3e50;         /* 文本颜色 */
}
```

### 字体规范：

- **正文**：'Segoe UI', system-ui, sans-serif
- **数学公式**：'Times New Roman', serif（MathJax 默认）

### 间距规范：

```css
.section-container { margin-bottom: 32px; }
.mathjax-block { padding: 15px; margin: 15px 0; }
.control-panel { padding: 20px; margin-bottom: 20px; }
```

---

## 📝 内容编写规范

### 1. 一言以蔽之

**要求：** 用1-2句话简洁明了地解释概念。

**规则：**
- ✅ 使用具体例子
- ✅ 所有数学符号用 LaTeX
- ✅ 字数控制在50-100字

**示例：**
```
当我们获得新信息（$A$发生）时，样本空间缩小了。比如知道掷出的点数是偶数（$A$），
那么点数是$6$（$B$）的概率就从$\frac{1}{6}$变成了$\frac{1}{3}$。
```

### 2. 适用场景

**要求：** 列举3-5个实际应用场景。

**格式：**
- 医疗诊断
- 垃圾邮件过滤
- 天气预报
- 质量检测

### 3. 基础知识

**要求：** 提供准确的数学定义和核心公式。

**必需元素：**
- 概念定义
- 符号说明（全部 LaTeX）
- 核心公式（在 `mathjax-block` 中）

---

## ⚙️ 交互规范

### 滑块控件：

| 属性 | 标准值 | 说明 |
|------|--------|------|
| `min` | 0.01 或 0.1 | 最小值 |
| `max` | 0.9 或 1.0 | 最大值 |
| `step` | 0.01 或 0.05 | 步长 |
| `value` | 0.5 | 默认值 |

### 事件绑定：

```javascript
// ✅ 正确：使用 addEventListener
document.getElementById('pa').addEventListener('input', draw);

// ❌ 错误：使用 oninput（可能不触发）
document.getElementById('pa').oninput = draw;
```

### 调试日志：

**要求：** 在关键步骤添加 `console.log()` 输出。

```javascript
function draw() {
    console.log('draw() 函数被调用');
    console.log(`参数值: P(A)=${pa}, P(B)=${pb}`);
    console.log('更新公式完成');
    console.log('准备更新 Plotly 图表');
}
```

---

## ✅ 开发检查清单

在提交页面之前，确认以下所有项都已完成：

### 功能检查：
- [ ] 导航栏包含返回和主页按钮
- [ ] 导航栏面包屑正确显示
- [ ] 加载动画正常显示和隐藏
- [ ] 所有滑块可以拖动
- [ ] 拖动滑块时公式实时更新
- [ ] 拖动滑块时图表实时更新
- [ ] 所有数学符号使用 LaTeX 格式

### 内容检查：
- [ ] "一言以蔽之"清晰简洁
- [ ] "适用场景"列举了3-5个例子
- [ ] "基础知识"包含准确定义和公式
- [ ] 所有数字使用 LaTeX（如 `$1$`, `$2$`）
- [ ] 所有符号使用 LaTeX（如 `$A$`, `$B$`, `$\cap$`）
- [ ] 所有分数使用 `\frac`（如 `$\frac{1}{2}$`）

### 技术检查：
- [ ] 使用国内 Plotly CDN
- [ ] MathJax 正确配置
- [ ] 控制台没有错误
- [ ] 控制台有调试日志输出
- [ ] 页面响应式设计（移动端正常）
- [ ] 加载速度正常（<3秒）

### 视觉检查：
- [ ] 导航栏样式一致
- [ ] 公式渲染美观（Times New Roman 字体）
- [ ] 图表颜色协调
- [ ] 文字大小合适
- [ ] 间距布局合理

---

## 🚀 快速开始

### 使用模板创建新页面：

1. **复制模板文件**
   ```bash
   cp visualization-page-template.html my-new-page.html
   ```

2. **修改基础信息**
   - `<title>` 标签
   - 导航栏标题
   - 面包屑导航

3. **编写内容**
   - "一言以蔽之"
   - "适用场景"
   - "基础知识"（含 LaTeX 公式）

4. **实现可视化**
   - 修改参数控件
   - 实现 `draw()` 函数
   - 添加 Plotly 图表代码

5. **测试验证**
   - 使用检查清单验证
   - 在不同浏览器测试
   - 测试响应式布局

---

## 📚 参考资源

### 完整示例：
- `/conditional_probability.html` - 条件概率可视化

### LaTeX 速查表：
- 分数：`\frac{分子}{分母}`
- 上标：`x^{2}`
- 下标：`x_{i}`
- 希腊字母：`\alpha`, `\beta`, `\theta`
- 集合：`\cap`（交）, `\cup`（并）, `\in`（属于）, `\subset`（包含）
- 关系符号：`\approx`（约等）, `\neq`（不等）, `\leq`（小于等于）, `\geq`（大于等于）
- 箭头：`\rightarrow`（→）, `\Rightarrow`（⇒）
- 文本：`\text{文本}`

### Plotly 文档：
- [Plotly.js API](https://plotly.com/javascript/)
- [Plotly Shapes](https://plotly.com/javascript/shapes/)

---

**版本：** v1.0
**最后更新：** 2025-01-18
**维护者：** AI Assistant (Claude)
