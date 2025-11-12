# 线性代数可视化页面布局指南

## 概述

本文档规定了线性代数模块可视化页面的统一布局标准和技术实现规范，确保页面风格一致、交互统一、数学公式渲染规范。

## 布局标准

### 1. 双栏稳定布局 (`linear_algebra_dualcolumn_stable`)

#### 页面结构
```
┌─────────────────────────────────────────┐
│              Header                    │
├──────────────────┬────────────────────┤
│   Left Column    │   Right Column     │
│   (代数定义)      │   (几何可视化)      │
│                  │                    │
│  • 数学定义       │  • Plotly 2D/3D   │
│  • 公式推导       │  • 交互控件        │
│  • 例题解析       │  • 几何意义        │
│                  │                    │
└──────────────────┴────────────────────┘
```

#### 左栏内容规范
- **标题层级**: H2 (22-24px) > H3 (18-20px) > 正文 (17-18px)
- **字体**: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif
- **对齐**: 左对齐
- **颜色**: 紫灰色系 (#495057, #6c757d, #f8f9fa)

#### 右栏内容规范
- **可视化**: Plotly.js 2D/3D 交互式图表
- **控件**: 参数滑块、选择器、数值输入框
- **状态显示**: 实时计算结果、矩阵展示、状态指示器

## 技术实现规范

### 1. 文件头部声明

每个可视化页面必须包含以下声明：

```javascript
// concept: xxx_linear_algebra
// layout: linear_algebra_dualcolumn_stable
// math: responsive_autolatex_enabled
```

### 2. 核心库文件引入

必须引入以下三个核心库文件：

```html
<script src="../../../../app/lib/mathjax.js"></script>
<script src="../../../../app/lib/autoMath.js"></script>
<script src="../../../../app/lib/responsive-math.js"></script>
```

### 3. 根容器设置

```html
<div class="page" data-autolatex="true">
    <!-- 页面内容 -->
</div>
```

### 4. 数学公式渲染规范

#### 代数定义区
- 所有数学公式必须用 `.mathjax-block` 包裹
- 变量与参数取值优先同行展示
- 自动渲染与自适应缩放生效

```html
<div class="mathjax-block">
    $$\begin{vmatrix} a & b \\ c & d \end{vmatrix} = ad - bc$$
</div>
```

#### 例题与解析
- 结果推导与简短说明置于 `.explain-box` 中
- 所有公式用 `.mathjax-block` 包裹

```html
<div class="explain-box">
    <h4>例题1：可逆矩阵判定</h4>
    <p>判断矩阵的可逆性...</p>
    <div class="mathjax-block">
        $$\det(A) = ad - bc \neq 0$$
    </div>
</div>
```

### 5. 页面挂载规范

```javascript
document.addEventListener('DOMContentLoaded', function() {
    enableAutoMath(document.querySelector('.page'));
    typesetPage().then(() => {
        attachFormulaResizer(document.querySelector('.page'));
    });

    // 初始化其他组件
    initializeControls();
    updateVisualization();
});
```

## 自动渲染策略

### 1. 自动渲染作用域

- 仅在具有 `data-autolatex="true"` 的容器内启用自动渲染
- 自动渲染选择器：`.mathjax-block`, `.calculation-steps`, `.examples-section`

### 2. 排除节点

以下节点默认不被自动渲染：
- `code`, `pre`, `a`, `button`, `input`, `textarea`
- 具有 `data-nomath` 属性的节点

### 3. 自动包裹规则

```javascript
// 仅包裹符合以下条件的纯文本节点
if (node.children.length === 0 && node.textContent && !node.closest('mjx-container')) {
    const raw = node.textContent.trim();
    if (raw && /[=×+\-]/.test(raw) && !/[\$]/.test(raw)) {
        node.innerHTML = `\\(${escapeLatex(raw)}\\)`;
    }
}
```

## 公式自适应缩放策略

### 1. 缩放触发条件

```javascript
// 宽度超出父容器时触发缩放
if (ew > pw && pw > 50) {
    const scale = Math.max(0.3, (pw - 24) / ew);
    // 应用缩放变换
}
```

### 2. 缩放范围

- **最小缩放比例**: 0.3 (30%)
- **缩放原点**: left center
- **容器最小宽度**: 50px

### 3. 缩放重置

- 宽度充足时自动恢复原始大小
- 清除所有变换样式和容器样式

### 4. ResizeObserver 优化

- 仅绑定 `.mathjax-block` 元素
- 减少重排成本，提升性能

## 交互更新规范

### 1. 控件变更处理

```javascript
controlElement.addEventListener('input', function() {
    // 更新数据
    updateData();

    // 重新渲染数学公式
    typesetPage().then(() => {
        // 应用自适应缩放
        attachFormulaResizer(document.querySelector('.page'));
    });

    // 更新可视化
    updateVisualization();
});
```

### 2. 状态更新流程

1. **数据更新** → 2. **数学渲染** → 3. **缩放调整** → 4. **可视化更新**

## 配色方案

### 主色调 (紫灰配色)
- **主色**: #667eea (渐变起始色)
- **辅色**: #764ba2 (渐变结束色)
- **背景**: #f8f9fa (浅灰)
- **文字**: #495057 (深灰)
- **强调**: #6c757d (中灰)

### 状态色
- **成功**: #d4edda (绿)
- **警告**: #fff3cd (黄)
- **错误**: #f8d7da (红)
- **信息**: #d1ecf1 (蓝)

## 响应式设计

### 断点设置
- **桌面端**: > 768px (双栏布局)
- **移动端**: ≤ 768px (单栏布局)

### 移动端适配
```css
@media (max-width: 768px) {
    .main-content {
        flex-direction: column;
    }

    .left-column, .right-column {
        padding: 20px;
    }

    .left-column {
        border-right: none;
        border-bottom: 1px solid #e9ecef;
    }
}
```

## 性能优化

### 1. 数学渲染优化
- 使用 `MutationObserver` 监听内容变化
- 按需触发 MathJax 渲染
- 避免全页面重新渲染

### 2. 可视化优化
- Plotly.js 使用 `{responsive: true}` 选项
- 控制更新频率，避免重绘过多
- 使用 requestAnimationFrame 优化动画

### 3. 内存管理
- 及时清理事件监听器
- 销毁不再使用的 Plotly 实例
- 避免内存泄漏

## 组件规范

### 1. 控制面板 (`.control-panel`)
```html
<div class="control-panel">
    <h3>参数控制</h3>
    <div class="control-item">
        <label>参数名称: <span id="param-value">默认值</span></label>
        <input type="range" id="param-id" min="最小值" max="最大值" step="步长" value="默认值">
    </div>
</div>
```

### 2. 矩阵显示 (`.matrix-display`)
```html
<div class="matrix-display" id="matrix-display">
    A = [[1.0, 2.0], [3.0, 4.0]]
</div>
```

### 3. 解释框 (`.explain-box`)
```html
<div class="explain-box">
    <h4>标题</h4>
    <p>说明文字</p>
    <div class="mathjax-block">
        $$公式$$
    </div>
</div>
```

## 质量检查清单

### 页面加载
- [ ] 所有库文件正确引入
- [ ] MathJax 配置正确
- [ ] 自动渲染功能启用
- [ ] 初始渲染完成

### 交互功能
- [ ] 控件响应正常
- [ ] 数据更新正确
- [ ] 数学公式重新渲染
- [ ] 自适应缩放生效

### 视觉效果
- [ ] 配色方案统一
- [ ] 字体大小合适
- [ ] 布局整齐美观
- [ ] 响应式适配良好

### 性能表现
- [ ] 页面加载速度合理
- [ ] 交互响应流畅
- [ ] 内存使用正常
- [ ] 无明显卡顿

## 版本信息

- **版本**: 1.0
- **更新日期**: 2025-10-29
- **维护者**: Claude Code + GLM4.5

---

*本指南将根据实际使用情况持续更新完善。*