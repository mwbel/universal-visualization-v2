## Why

现有万物可视化系统虽然支持多种学科，但缺乏统一的智能路由和Agent架构。每个学科模块独立运作，导致代码重复、维护困难，用户体验不一致。需要设计一个统一的多学科可视化Agent系统，实现智能学科识别、模板匹配和可视化生成的端到端流程。

## What Changes

- **设计多学科Agent系统架构**：创建BaseVisualizationAgent基类和学科特定Agent实现
- **实现智能路由管理器**：VisualizationRouter负责智能分发请求到合适学科Agent
- **建立学科分类器**：SubjectClassifier实现基于关键词的学科自动识别
- **标准化模板生成机制**：统一的模板结构和渲染引擎
- **升级API路由系统**：v2 API支持学科特定和通用生成接口

## Impact

- **Affected specs**: backend-architecture, api-routing, template-system, multi-discipline-support
- **Affected code**:
  - backend-api.py (重构为Agent架构)
  - 新增学科Agent模块
  - 模板系统和渲染引擎
- **用户体验**: 实现智能学科识别，用户无需手动选择学科模块