# Design: 期末速通学习系统

## Overview
"期末速通"是一个为三门课程期末复习设计的学习系统，通过整合现有可视化资源和AI辅助功能，提供高效、互动的学习体验。

## Architecture

### System Architecture
```
┌─────────────────────────────────────────────────────────┐
│            期末速通主界面 (Final Exam Sprint)             │
│  - 课程选择卡片                                          │
│  - 学习进度总览                                          │
│  - 快速入口                                              │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│              课程学习界面 (Course Learning)                │
│  - 考点清单（左侧）                                        │
│  - 可视化展示区（中间）                                    │
│  - AI助手（右侧/底部）                                     │
│  - 进度追踪                                              │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────┬─────────────┬─────────────────────────────┐
│ 概率统计    │ 大学物理    │ C++程序设计                 │
│ 可视化引擎  │ 可视化引擎  │ 代码可视化引擎               │
└─────────────┴─────────────┴─────────────────────────────┘
```

### Data Flow
```
用户操作
   ↓
更新 localStorage（进度数据）
   ↓
刷新UI（进度条、考点状态）
   ↓
（可选）同步到服务器
```

## Component Design

### 1. CourseSelector Component
**Purpose**: 显示三门课程卡片，处理课程选择

**Responsibilities**:
- 渲染课程卡片
- 处理点击事件
- 显示每门课的进度

**Props**:
```javascript
{
  courses: [
    {
      id: 'probability',
      name: '概率论与数理统计',
      icon: '📊',
      description: '分布可视化、统计推断、假设检验',
      totalCheckpoints: 8,
      masteredCheckpoints: 0
    },
    // ...
  ],
  onCourseSelect: (courseId) => void
}
```

### 2. CheckListTracker Component
**Purpose**: 管理和显示考点清单

**Responsibilities**:
- 显示考点列表
- 处理勾选/取消勾选
- 保存/加载进度
- 筛选未掌握考点

**Data Structure**:
```javascript
const checkpointData = {
  probability: [
    {
      id: 'P1',
      topic: '条件概率与乘法公式',
      mastered: false,
      priority: 'high',
      visualizations: [
        {
          name: '条件概率可视化',
          path: '/path/to/viz.html',
          type: 'new' // or 'classic'
        }
      ]
    },
    // ...
  ]
}
```

### 3. VizNavigator Component
**Purpose**: 导航到相关可视化资源

**Responsibilities**:
- 显示可视化列表
- 区分新增/经典可视化
- 处理可视化链接点击

## Technical Decisions

### 1. 为什么创建独立的期末速通页面？
**Decision**: 创建独立的`期末速通/`目录，而不是在现有模块中添加

**Rationale**:
- **针对性**: 期末复习有特殊的紧迫感和组织方式
- **灵活性**: 可以独立于主项目进行迭代
- **复用性**: 深度复用现有可视化，但提供不同的组织方式

**Trade-offs**:
- + 优点: 更清晰的用户体验，易于维护
- - 缺点: 增加了文件数量，需要维护额外的导航

### 2. 进度数据存储方案
**Decision**: 使用localStorage存储进度

**Rationale**:
- **简单**: 无需后端支持
- **快速**: 本地读写速度快
- **隐私**: 数据不离开用户设备

**Implementation**:
```javascript
const saveProgress = (course, checkpointId, mastered) => {
  const key = `final_sprint_${course}`;
  const data = JSON.parse(localStorage.getItem(key) || '{}');
  data[checkpointId] = { mastered, timestamp: Date.now() };
  localStorage.setItem(key, JSON.stringify(data));
};
```

**Future Enhancement**: 如果需要跨设备同步，可以添加云存储选项

### 3. 可视化页面托管
**Decision**: 新增可视化托管在`frontend-v3/generated_pages/`，通过独立端口(8080)提供服务

**Rationale**:
- **隔离**: 不影响主项目结构
- **灵活性**: 可以独立更新可视化内容
- **性能**: 专用端口，避免与主项目冲突

**Trade-offs**:
- + 优点: 独立管理，易于版本控制
- - 缺点: 需要维护多个HTTP服务器

### 4. UI设计风格
**Decision**: 采用现代卡片式设计，使用渐变色和动画效果

**Rationale**:
- **吸引力**: 符合现代Web设计趋势
- **清晰度**: 卡片式布局层次分明
- **交互性**: 动画效果提升用户体验

**Color Scheme**:
- 主色: 紫色渐变 (#667eea → #764ba2)
- 强调色: 红色 (#ff6b6b) - 用于"新增"标记
- 成功色: 绿色 (#51cf66) - 用于已掌握标记

## Integration Points

### 1. 与现有概率统计模块的集成
**Method**: 通过链接跳转集成

**Implementation**:
```html
<!-- 在期末速通页面中 -->
<a href="http://localhost:3000/modules/probability_statistics/index.html" target="_blank">
  进入概率统计模块 →
</a>
```

### 2. 与新增可视化的集成
**Method**: 通过绝对路径或相对路径引用

**Implementation**:
```html
<!-- 在概率统计模块首页 -->
<a href="http://localhost:8080/bivariate_random_variable.html" target="_blank">
  二维随机变量联合分布 ⭐新增
</a>
```

### 3. 与AI助手的集成（规划中）
**Method**: 复用SmartInput组件，添加学科专属Prompt

**Design**:
```javascript
class AITutor extends SmartInput {
  constructor(course) {
    super();
    this.course = course;
    this.setSystemPrompt(this.getPrompt(course));
  }

  getPrompt(course) {
    const prompts = {
      probability: `你是概率论与数理统计的AI导师...`,
      physics: `你是大学物理的AI导师...`,
      cpp: `你是C++程序设计的AI导师...`
    };
    return prompts[course];
  }
}
```

## Performance Considerations

### 1. 页面加载优化
- **懒加载**: 考点清单分页或虚拟滚动
- **图片优化**: 使用WebP格式，压缩图片
- **代码分割**: 按课程动态加载JavaScript

### 2. 本地存储优化
- **去重**: 避免重复保存相同数据
- **压缩**: 对大量数据使用压缩
- **清理**: 定期清理过期数据

## Security Considerations

### 1. XSS防护
- 所有用户输入都需要转义
- 使用textContent而非innerHTML

### 2. 数据验证
- 验证localStorage数据格式
- 处理损坏数据的情况

## Future Enhancements

### Phase 3: AI助手集成
- 实现智能问答功能
- 添加个性化学习路径推荐
- 实现错题本功能

### Phase 4: 社交功能
- 学习小组功能
- 进度排行榜
- 协作学习模式

### Phase 5: 数据分析
- 学习时间统计
- 薄弱知识点分析
- 学习效果评估

## Risks and Mitigations

### Risk 1: 用户不适应新界面
**Mitigation**: 提供详细的使用指南，保持与主项目的视觉一致性

### Risk 2: 可视化页面链接失效
**Mitigation**: 使用绝对URL，定期检查链接有效性

### Risk 3: 本地存储数据丢失
**Mitigation**: 提供导出/导入功能，考虑添加云备份选项

## Testing Strategy

### Unit Tests
- 考点清单CRUD操作
- 进度计算逻辑
- 本地存储读写

### Integration Tests
- 页面导航流程
- 可视化链接跳转
- 进度保存/加载

### User Acceptance Tests
- 三门课程完整学习流程
- 多设备兼容性测试
- 性能测试（加载时间<3s）

## Documentation

### User Documentation
- 快速入门指南
- 功能说明文档
- 常见问题解答

### Developer Documentation
- 架构设计文档
- API文档
- 组件使用指南
