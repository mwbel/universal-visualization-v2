# 整合Python模块到GeneralVisualization框架

## Why
目前项目存在两种技术架构的模块：独立开发的Python模块（ai_visual_astronomy、ai_visual_physics）和统一的GeneralVisualization框架。Python模块功能强大但难以统一维护，需要将它们整合到GeneralVisualization框架中，实现统一的用户体验和标准化的技术架构。

## 概述
将之前在VSCode + Cline中开发的现代天文学模块和物理学模块从独立的Python项目整合到GeneralVisualization/app/modules目录下，转换为基于Web的标准化模块。

## 背景
- **ai_visual_astronomy**: 包含Python开发的天文学可视化功能，使用Skyfield、Plotly等库
- **ai_visual_physics**: 包含Python开发的物理学可视化功能
- **GeneralVisualization**: 基于Trae开发的统一可视化框架，使用TypeScript和Web技术
- **现状**: 两种技术栈并存，维护复杂，用户体验不统一

## 解决方案
采用渐进式整合策略：
1. 将独立模块的核心Web前端内容迁移到GeneralVisualization框架
2. 保留Python后端计算功能作为API服务
3. 优化Web端性能和用户体验
4. 统一视觉设计和交互模式

## 技术细节

### 迁移内容
- **天文学模块**: 天球模型、太阳系模拟、日月地系统、3D可视化
- **物理学模块**: 抛物运动、相对论演示、物理定律展示
- **保留**: Three.js 3D渲染、交互逻辑、数据模型
- **转换**: Python计算 → Web API + JavaScript计算

### 目标结构
```
GeneralVisualization/app/modules/
├── astronomy/          # 现代天文学可视化
│   ├── index.html
│   ├── js/astronomy.js
│   ├── css/astronomy.css
│   └── data/
└── physics/            # 物理学可视化
    ├── index.html
    ├── js/physics.js
    ├── css/physics.css
    └── data/
```

## 验收标准
- 用户可以从GeneralVisualization主页访问天文学和物理学模块
- 模块使用统一的视觉设计和交互模式
- 保留原有的核心功能和交互体验
- Web端性能优化，支持浏览器直接访问
- 符合GeneralVisualization框架的模块标准