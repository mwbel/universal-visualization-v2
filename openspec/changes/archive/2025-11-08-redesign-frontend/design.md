# 万物可视化前端重新设计 - 设计文档

## 设计原则

### 1. 水平优先布局
- 采用CSS Grid和Flexbox实现水平展开
- 避免内容垂直堆叠造成的狭长布局
- 充分利用屏幕宽度，特别是大屏设备

### 2. 视觉居中对齐
- 主要标题和核心内容居中显示
- 对称式设计，避免左右偏移
- 建立清晰的视觉中轴线

### 3. 层次化组织
- 明确的信息层级：主标题 > 副标题 > 功能模块 > 操作按钮
- 使用大小、颜色、间距区分层次
- 渐进式信息展示，避免信息过载

### 4. 响应式适配
- 移动优先的设计思路
- 断点设计：手机(<768px)、平板(768-1024px)、桌面(>1024px)
- 灵活的布局调整，确保各设备体验一致

## 布局架构

### 整体结构
```
┌─────────────────────────────────────┐
│              页头 Header              │
├─────────────────────────────────────┤
│            Hero Section              │
│         (主标题 + 描述)              │
├─────────────────────────────────────┤
│          功能模块网格                │
│    ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐   │
│    │数学 │ │天文 │ │物理 │ │更多 │   │
│    └─────┘ └─────┘ └─────┘ └─────┘   │
├─────────────────────────────────────┤
│            输入操作区                │
│         (文本输入 + 生成)            │
├─────────────────────────────────────┤
│              页脚 Footer              │
└─────────────────────────────────────┘
```

### 技术实现

#### 容器系统
```css
.viewport-container {
  width: 100vw;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.content-wrapper {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 2rem;
}
```

#### 网格布局
```css
.modules-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 2rem;
  margin: 3rem 0;
}

@media (min-width: 1200px) {
  .modules-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}
```

#### 响应式设计
```css
/* 移动端 */
@media (max-width: 767px) {
  .modules-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 1rem;
  }
}

/* 小屏手机 */
@media (max-width: 480px) {
  .modules-grid {
    grid-template-columns: 1fr;
  }
}
```

## 视觉设计

### 色彩系统
- **主色调**: 深蓝渐变 (#1e3a8a → #3b82f6)
- **辅助色**: 青色 (#06b6d4)、紫色 (#8b5cf6)
- **背景色**: 深色模式 (#0f172a)、浅色模式 (#f8fafc)
- **文字色**: 深色模式文字 (#f1f5f9)、浅色模式文字 (#1e293b)

### 字体系统
```css
.text-display {
  font-size: clamp(2rem, 5vw, 4rem);
  font-weight: 800;
  line-height: 1.1;
}

.text-title {
  font-size: clamp(1.5rem, 3vw, 2.5rem);
  font-weight: 700;
}

.text-body {
  font-size: clamp(1rem, 2vw, 1.25rem);
  line-height: 1.6;
}
```

### 间距系统
```css
:root {
  --space-xs: 0.5rem;
  --space-sm: 1rem;
  --space-md: 1.5rem;
  --space-lg: 2rem;
  --space-xl: 3rem;
  --space-2xl: 4rem;
}
```

## 交互设计

### 状态反馈
- **悬停**: 微妙的阴影和位置变化
- **点击**: 短暂的缩放效果
- **加载**: 骨架屏或旋转动画
- **错误**: 明显的视觉提示

### 微交互
- 模块卡片悬停时轻微上浮
- 按钮点击时的涟漪效果
- 平滑的页面过渡动画
- 渐进式内容加载

## 性能优化

### 加载策略
- 关键CSS内联，非关键CSS异步加载
- 图片懒加载和WebP格式
- JavaScript模块按需加载
- 预加载关键资源

### 渲染优化
- 使用CSS Transform实现动画
- 避免强制同步布局
- 优化重绘和重排
- 合理使用GPU加速

## 可访问性

### 语义化HTML
- 使用正确的标签层级
- 提供替代文本
- 支持键盘导航
- 适当的ARIA标签

### 颜色对比
- 确保文字与背景对比度 > 4.5:1
- 不仅依赖颜色传达信息
- 支持高对比度模式
- 考虑色盲用户需求