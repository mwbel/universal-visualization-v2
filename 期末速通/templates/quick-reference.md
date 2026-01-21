# 可视化页面快速参考

## 🚀 5分钟快速上手

### 第1步：复制模板
```bash
cp visualization-page-template.html your-page.html
```

### 第2步：修改5个关键位置

#### 位置1：页面标题（第14行）
```html
<title>你的页面标题</title>
```

#### 位置2：导航栏标题（第230行）
```html
<h1>📊 你的页面标题</h1>
```

#### 位置3：页面主标题（第265行）
```html
<h1>可视化标题：数学概念</h1>
```

#### 位置4：面包屑导航（第250-260行）
```html
<a href="#">你的页面名称</a>
```

#### 位置5：加载文本（第210行）
```html
<div class="loading-text">正在加载你的可视化...</div>
```

---

## 📝 LaTeX 速查表

### 常用符号（直接复制使用）

| 含义 | LaTeX | 显示效果 |
|------|-------|---------|
| 事件A/B | `$A$`, `$B$` | $A$, $B$ |
| 概率 | `$P(A)$` | $P(A)$ |
| 条件概率 | `$P(A\|B)$` | $P(A\|B)$ |
| 交集 | `$A \cap B$` | $A \cap B$ |
| 并集 | `$A \cup B$` | $A \cup B$ |
| 分数1/2 | `$\frac{1}{2}$` | $\frac{1}{2}$ |
| 分数a/b | `$\frac{a}{b}$` | $\frac{a}{b}$ |
| 约等 | `$\approx$` | $\approx$ |
| 不等 | `$\neq$` | $\neq$ |
| 小于等于 | `$\leq$` | $\leq$ |
| 大于等于 | `$\geq$ | $\geq$ |
| 箭头 | `$\rightarrow$` | $\rightarrow$ |
| 双箭头 | `$\Rightarrow$` | $\Rightarrow$ |
| 空集 | `$\emptyset$` | $\emptyset$ |
| 属于 | `$\in$` | $\in$ |
| 包含 | `$\subset$` | $\subset$ |
| 数字 | `$1$`, `$2$`, `$3$` | $1$, $2$, $3$ |

### 示例：

#### ❌ 错误写法：
```
事件A发生的概率是1/6
```

#### ✅ 正确写法：
```
事件$A$发生的概率是$\frac{1}{6}$
```

---

## ⚙️ 常用代码片段

### 滑块控件模板
```html
<label>$参数名$: <input type="range" id="paramId" min="0.1" max="0.9" step="0.05" value="0.5"></label>
<span id="paramId-val">0.5</span><br>
```

### draw() 函数模板
```javascript
function draw() {
    console.log('draw() 函数被调用');

    // 1. 读取参数
    const p1 = parseFloat(document.getElementById('param1').value);

    // 2. 更新显示
    document.getElementById('param1-val').innerText = p1.toFixed(2);

    // 3. 计算并渲染公式
    const result = p1 * 2;
    document.getElementById('calcs').innerHTML = `$结果 = ${result.toFixed(3)}$`;

    // 4. 渲染 MathJax
    if (window.MathJax && window.MathJax.typesetPromise) {
        MathJax.typesetPromise([document.getElementById('calcs')]);
    }

    // 5. 更新图表
    const timestamp = Date.now();
    const layout = {
        // 你的图表配置
        'data-revision': timestamp
    };
    Plotly.newPlot('plot', [], layout);
}

// 绑定事件
document.getElementById('param1').addEventListener('input', draw);
```

---

## 🎨 颜色速查

### 推荐颜色：

```css
/* 主色调 */
--primary-color: #5B8CBA;

/* 状态颜色 */
成功: #34a853 (绿色)
警告: #fbbc04 (黄色)
错误: #ea4335 (红色)
信息: #4285f4 (蓝色)

/* Plotly 图表颜色 */
红色: rgba(220, 38, 38, 0.3)
蓝色: rgba(37, 99, 235, 0.3)
绿色: rgba(34, 197, 94, 0.3)
紫色: rgba(139, 92, 246, 0.3)
```

---

## ✅ 提交前5项检查

在认为页面完成之前，快速检查这5项：

1. [ ] **所有数学符号用 LaTeX**
   - 检查是否有直接的数字（如 1, 2, 3）
   - 检查是否有直接的字母（如 A, B, x, y）
   - 应该写成：`$1$`, `$2$`, `$A$`, `$B$`

2. [ ] **滑块拖动时图表更新**
   - 拖动每个滑块
   - 确认图表形状/大小/位置会变化

3. [ ] **公式实时渲染**
   - 拖动滑块
   - 确认公式数字会更新
   - 确认公式没有反斜杠显示

4. [ ] **控制台无错误**
   - 按 F12 打开开发者工具
   - 查看 Console 标签
   - 确认没有红色错误信息

5. [ ] **导航栏正常工作**
   - 点击"返回上一级"应该能返回
   - 点击"期末速通主页"应该能跳转

---

## 🐛 常见问题速查

### Q1: 公式显示为原始代码（如 `\frac{1}{2}`）
**A:** MathJax 没有正确配置或加载
- 检查是否使用了 `$` 定界符
- 检查 MathJax 配置是否正确
- 查看 Console 是否有错误

### Q2: 拖动滑块时图表不更新
**A:** 使用 `Plotly.newPlot()` 而不是 `Plotly.react()`
```javascript
// 强制重新创建
Plotly.newPlot('plot', [], layout);
```

### Q3: 页面加载很慢
**A:** Plotly.js CDN 问题
- 使用国内CDN：`lib.baomitu.com`
- 添加备用CDN：`cdn.bootcdn.net`

### Q4: LaTeX 显示反斜杠
**A:** 定界符错误
- 使用 `$` 而不是 `\(`
- 确保使用单转义符 `\` 而不是 `\\`

---

## 📋 完整开发流程

```
1. 复制模板
   ↓
2. 修改5个关键位置
   ↓
3. 编写内容（一言以蔽之、适用场景、基础知识）
   ↓
4. 实现可视化（参数控件、draw函数、Plotly图表）
   ↓
5. 测试（5项检查）
   ↓
6. 优化（调整颜色、间距、字体）
   ↓
7. 提交
```

---

## 🎯 质量标准

### 优秀页面的特征：

- ✅ 所有数学符号用 LaTeX 渲染（美观、专业）
- ✅ 拖动滑块时，所有元素实时更新（公式、图表、标注）
- ✅ 可视化元素动态变化（大小、位置、颜色）
- ✅ 加载速度快（<3秒）
- ✅ 响应式布局（手机端正常）
- ✅ 控制台有清晰的调试日志
- ✅ 导航栏样式统一

### 需要改进的迹象：

- ❌ 混用纯文本和 LaTeX（如 "P(A)" 而不是 "$P(A)$"）
- ❌ 图表固定不动，不随参数变化
- ❌ 公式显示为原始代码（如 `\frac{1}{2}`）
- ❌ 页面加载缓慢
- ❌ 控制台有错误
- ❌ 移动端布局错乱

---

**最后更新：** 2025-01-18
**版本：** v1.0
