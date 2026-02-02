# Tasks: 添加"期末速通"学习系统

## Overview
实现"期末速通"期末复习学习系统，包括主界面、概率统计可视化增强、系统集成等。

## Completed Tasks ✅

### 基础框架搭建
- [x] **TASK-001**: 创建期末速通目录结构
  - 创建 `期末速通/` 文件夹
  - 创建 `index.html` 主页
  - 创建 `css/final-sprint.css` 样式文件
  - 验证: 页面可以在浏览器中正常打开

- [x] **TASK-002**: 实现课程选择界面
  - 添加三门课程卡片（概率统计、大学物理、C++）
  - 实现点击事件处理
  - 添加进度条显示
  - 验证: 点击卡片可以进入对应课程

### 概率统计可视化开发
- [x] **TASK-003**: 创建二维随机变量联合分布可视化
  - 文件: `frontend-v3/generated_pages/probability_statistics_textbook/bivariate_random_variable.html`
  - 实现3D联合概率密度曲面
  - 添加相关系数调整功能
  - 支持离散和连续两种分布
  - 验证: 参数调整时图表实时更新

- [x] **TASK-004**: 创建边缘分布与条件分布可视化
  - 文件: `frontend-v3/generated_pages/probability_statistics_textbook/marginal_conditional_distribution.html`
  - 实现从联合分布推导边缘分布
  - 实现条件分布可视化
  - 添加独立性判别
  - 验证: 可以清晰理解边缘/条件分布的关系

- [x] **TASK-005**: 创建常见离散分布可视化
  - 文件: `frontend-v3/generated_pages/probability_statistics_textbook/common_discrete_distributions.html`
  - 实现几何分布
  - 实现超几何分布
  - 实现负二项分布
  - 添加PMF/CDF/统计性质显示
  - 验证: 三种分布可以切换查看

- [x] **TASK-006**: 创建随机变量函数的分布可视化
  - 文件: `frontend-v3/generated_pages/probability_statistics_textbook/transformation_of_random_variables.html`
  - 实现线性变换 Y = aX + b
  - 实现平方变换 Y = X²
  - 实现变量之和 Z = X + Y（卷积）
  - 实现变量之商 Z = X/Y
  - 验证: 每种变换都有完整的可视化

- [x] **TASK-007**: 创建Bootstrap方法可视化
  - 文件: `frontend-v3/generated_pages/probability_statistics_textbook/bootstrap_method.html`
  - 实现Bootstrap均值估计
  - 实现Bootstrap中位数估计
  - 实现Bootstrap方差估计
  - 实现置信区间构建
  - 验证: 包含重采样动画和统计结果显示

### 系统集成
- [x] **TASK-008**: 更新概率统计模块首页
  - 文件: `main-app/modules/probability_statistics/index.html`
  - 添加左侧快速导航（包含5个新增可视化）
  - 添加顶部横幅（展示新增内容）
  - 更新章节导航（第二、三、十章）
  - 验证: 所有链接可以正常跳转

- [x] **TASK-009**: 创建可视化索引页面
  - 文件: `frontend-v3/generated_pages/probability_statistics_textbook/new_visualizations_index.html`
  - 展示所有5个新增可视化
  - 提供卡片式导航界面
  - 添加统计信息和使用指南
  - 验证: 页面美观且功能完整

- [x] **TASK-010**: 启动HTTP服务器
  - 在端口8888启动期末速通服务器
  - 在端口8080启动新增可视化服务器
  - 在端口3000启动主应用服务器
  - 验证: 所有页面可以通过浏览器访问

## Pending Tasks 🔄

### Phase 3: AI学习助手集成
- [ ] **TASK-011**: 设计AI学习助手界面
  - 复用现有的SmartInput组件
  - 添加学科专属的Prompt模板
  - 实现问答历史记录
  - 验证: 可以向AI提问并获得回答

- [ ] **TASK-012**: 实现考点追踪功能
  - 创建考点清单数据结构
  - 实现勾选/取消勾选功能
  - 保存学习进度到localStorage
  - 验证: 刷新页面后进度保持

- [ ] **TASK-013**: 添加AI推荐可视化功能
  - 根据考点内容推荐相关可视化
  - 在回答中嵌入可视化链接
  - 验证: 推荐准确且可点击

### Phase 4: 其他课程内容
- [ ] **TASK-014**: 规划大学物理（下册）可视化
  - 电磁学内容优先
  - 波动光学内容次之
  - 确定可视化技术栈
  - 验证: 完成详细规划文档

- [ ] **TASK-015**: 规划C++程序设计可视化
  - 面向对象基础优先
  - STL容器次之
  - 确定可视化方案
  - 验证: 完成详细规划文档

## Optional Tasks 💡
- [ ] 添加学习统计面板
- [ ] 实现错题本功能
- [ ] 添加模拟考试功能
- [ ] 创建学习提醒系统

## Notes
- 所有新增可视化都使用Plotly.js实现
- 遵循现有的设计风格和代码规范
- 所有页面支持响应式设计
- 使用MathJax渲染数学公式
