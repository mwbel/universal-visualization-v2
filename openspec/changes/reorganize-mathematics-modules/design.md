## Context

当前万物可视化项目的学科内容分散在多个位置：

1. **ai_visual_math/**: 独立的数学可视化目录（旧框架，已过滤不考虑）
   - 仅包含基础的概率统计演示和Geogebra文件
   - 不包含需要迁移的核心功能
   - 已被新的mathematics分支结构替代

2. **ai_visual_astronomy/**: 独立的天文学可视化目录（旧框架）
   - 现代天文学可视化功能
   - 藏历历算相关内容（在._orig版本中）
   - 独立的前端和后端代码

3. **ai_visual_differential_geometry/**: 独立的微分几何可视化目录（旧框架，已过滤不考虑）
   - 仅包含基础图像文件，无核心可视化功能
   - 已被新的differential_geometry模块替代

4. **GeneralVisualization/app/modules/**: 标准化的模块目录
   - probability_statistics/ (概率统计)
   - linear_algebra/ (线性代数)
   - differential_geometry/ (微分几何 - 基础版本)
   - astronomy/ (天文学 - 基础版本)
   - physics/ (物理学)

这种分散结构导致的问题：
- 维护困难，需要同时更新多个位置
- 代码重复，相同功能在不同目录中重复实现
- 用户体验不一致，不同的导航和界面风格
- 开发效率低，新功能需要在多个地方实现
- 版本混乱，同一学科有多个版本和实现

## Goals / Non-Goals

- **Goals**:
  - 将所有学科模块统一到GeneralVisualization/app/modules下
  - 建立清晰的学科层级结构
  - 标准化所有学科模块的接口和规范
  - 提供统一的学科导航和入口
  - 保持现有功能的完整性和可用性
  - 整合天文学的现代天文学和藏历历算功能
  - 统一微分几何的可视化实现

- **Non-Goals**:
  - 重新实现现有的可视化功能
  - 改变现有的模块加载机制
  - 影响未涉及学科模块的结构和功能
  - 强制立即迁移所有功能（分阶段进行）

## Decisions

### Decision 1: 数学学科分类标准
**选择**: 采用标准的数学学科分类，每个学科作为独立模块
**理由**:
- 符合学术界的标准分类
- 便于用户理解和导航
- 支持未来扩展新的数学分支
- 与现有的概率统计、线性代数模块保持一致

### Decision 2: 模块目录结构标准化
**选择**: 统一的模块目录结构，包含核心文件和子目录
**理由**:
- 标准化开发流程和接口
- 便于模块的维护和扩展
- 提高代码复用率
- 支持自动化测试和部署

### Decision 3: 渐进式迁移策略
**选择**: 分阶段迁移，优先核心功能，保留向后兼容
**理由**:
- 降低迁移风险
- 保持系统的稳定性
- 允许逐步验证和优化
- 给用户适应新结构的时间

### Decision 4: 天文学子模块结构
**选择**: 天文学模块下设立现代天文学和藏历历算两个子模块
**理由**:
- 保留天文学的完整性和多样性
- 藏历历算具有独特的文化和技术价值
- 便于用户根据需求选择特定功能
- 支持未来扩展其他天文学相关内容

## 新的学科模块结构设计

### 目录结构
```
GeneralVisualization/app/modules/
├── mathematics/                          # 数学总分支
│   ├── index.html                       # 数学学科总入口
│   ├── navigation.html                  # 数学学科导航
│   ├── config.json                      # 数学分支配置
│   ├── calculus/                        # 微积分（新建）
│   ├── index.html                       # 微积分主页面
│   ├── main.js                          # 微积分核心逻辑
│   ├── pages/                           # 页面文件
│   │   ├── differential.html            # 微分学
│   │   ├── integral.html                # 积分学
│   │   ├── series.html                  # 级数
│   │   └── multivariable.html           # 多元微积分
│   ├── templates/                       # 模板文件
│   ├── assets/                          # 静态资源
│   ├── docs/                            # 文档
│   └── config.json                      # 模块配置
├── algebra/                             # 代数学
│   ├── index.html                       # 代数学主页面
│   ├── main.js                          # 代数学核心逻辑
│   ├── pages/                           # 页面文件
│   │   ├── linear.html                  # 线性代数
│   │   ├── abstract.html                # 抽象代数
│   │   ├── polynomial.html              # 多项式
│   │   └── matrix.html                  # 矩阵理论
│   ├── templates/                       # 模板文件
│   ├── assets/                          # 静态资源
│   ├── docs/                            # 文档
│   └── config.json                      # 模块配置
├── geometry/                            # 几何学
│   ├── index.html                       # 几何学主页面
│   ├── main.js                          # 几何学核心逻辑
│   ├── pages/                           # 页面文件
│   │   ├── euclidean.html               # 欧几里得几何
│   │   ├── analytic.html                # 解析几何
│   │   ├── differential.html            # 微分几何
│   │   └── fractal.html                 # 分形几何
│   ├── templates/                       # 模板文件
│   ├── assets/                          # 静态资源
│   ├── docs/                            # 文档
│   └── config.json                      # 模块配置
├── discrete_math/                       # 离散数学
│   ├── index.html                       # 离散数学主页面
│   ├── main.js                          # 离散数学核心逻辑
│   ├── pages/                           # 页面文件
│   │   ├── graph.html                   # 图论
│   │   ├── combinatorics.html           # 组合数学
│   │   ├── logic.html                   数理逻辑
│   │   └── algorithm.html               # 算法分析
│   ├── templates/                       # 模板文件
│   ├── assets/                          # 静态资源
│   ├── docs/                            # 文档
│   └── config.json                      # 模块配置
│   ├── probability_statistics/          # 概率统计（迁移现有）
│   │   ├── index.html                   # 概率统计主页面
│   │   ├── main.js                      # 概率统计核心逻辑
│   │   ├── pages/                       # 页面文件
│   │   │   ├── normal_distribution.html # 正态分布
│   │   │   ├── binomial_distribution.html # 二项分布
│   │   │   ├── poisson_distribution.html # 泊松分布
│   │   │   ├── exponential_distribution.html # 指数分布
│   │   │   ├── chi_square_distribution.html # 卡方分布
│   │   │   └── t_distribution.html      # t分布
│   │   ├── templates/                   # 模板文件
│   │   ├── assets/                      # 静态资源
│   │   ├── docs/                        # 文档
│   │   └── config.json                  # 模块配置
│   └── linear_algebra/                  # 线性代数（迁移现有）
│       ├── index.html                   # 线性代数主页面
│       ├── main.js                      # 线性代数核心逻辑
│       ├── pages/                       # 页面文件
│       │   ├── vector_space.html        # 向量空间
│       │   ├── matrix_operations.html   # 矩阵运算
│       │   ├── determinant.html         # 行列式
│       │   ├── eigenvalue_decomposition.html # 特征值分解
│       │   ├── linear_transformation.html # 线性变换
│       │   └── basis_transformation.html # 基变换
│       ├── templates/                   # 模板文件
│       ├── assets/                      # 静态资源
│       ├── docs/                        # 文档
│       └── config.json                  # 模块配置
├── astronomy/                           # 天文学（整合现有+新增）
│   ├── index.html                       # 天文学总入口
│   ├── main.js                          # 天文学核心逻辑
│   ├── modern_astronomy/                # 现代天文学子模块
│   │   ├── index.html                   # 现代天文学主页面
│   │   ├── pages/                       # 页面文件
│   │   │   ├── solar_system.html        # 太阳系
│   │   │   ├── planetary_orbits.html    # 行星轨道
│   │   │   ├── celestial_sphere.html    # 天球坐标
│   │   │   └── lunar_phases.html        # 月相变化
│   │   ├── assets/                      # 静态资源
│   │   ├── data/                        # 天文数据
│   │   └── config.json                  # 子模块配置
│   ├── tibetan_calendar/                # 藏历历算子模块
│   │   ├── index.html                   # 藏历历算主页面
│   │   ├── pages/                       # 页面文件
│   │   │   ├── calendar_calc.html       # 藏历计算
│   │   │   ├── festival_dates.html      # 节气节日
│   │   │   ├── ephemeris.html           # 历算数据
│   │   │   └── conversion.html          # 公历藏历转换
│   │   ├── assets/                      # 静态资源
│   │   ├── data/                        # 藏历数据
│   │   └── config.json                  # 子模块配置
│   ├── templates/                       # 模板文件
│   ├── assets/                          # 静态资源
│   ├── docs/                            # 文档
│   └── config.json                      # 模块配置
├── differential_geometry/               # 微分几何（整合现有+新增）
│   ├── index.html                       # 微分几何主页面
│   ├── main.js                          # 微分几何核心逻辑
│   ├── pages/                           # 页面文件
│   │   ├── intrinsic_geometry.html      # 内蕴几何
│   │   ├── surfaces.html                # 曲面理论
│   │   ├── curvature.html               # 曲率计算
│   │   ├── geodesics.html               # 测地线
│   │   └── manifolds.html               # 流形理论
│   ├── templates/                       # 模板文件
│   ├── assets/                          # 静态资源
│   ├── docs/                            # 文档
│   └── config.json                      # 模块配置
└── physics/                            # 物理学（已存在）
```

### 模块配置标准
每个学科模块都包含以下配置文件：

**config.json结构**:
```json
{
  "module": {
    "id": "calculus",
    "name": "微积分",
    "category": "mathematics",
    "subcategory": "analysis",
    "version": "1.0.0",
    "description": "微积分学可视化工具集",
    "author": "万物可视化团队",
    "tags": ["微积分", "微分", "积分", "级数", "多元微积分"]
  },
  "dependencies": [
    {
      "name": "plotly.js",
      "version": "^2.0.0"
    },
    {
      "name": "math.js",
      "version": "^11.0.0"
    }
  ],
  "pages": [
    {
      "id": "differential",
      "name": "微分学",
      "path": "pages/differential.html",
      "description": "导数和微分可视化"
    },
    {
      "id": "integral",
      "name": "积分学",
      "path": "pages/integral.html",
      "description": "积分和面积计算可视化"
    }
  ],
  "assets": {
    "css": ["styles/main.css"],
    "js": ["lib/math-extensions.js"],
    "images": ["icons/calculus.svg"]
  },
  "settings": {
    "default_theme": "academic",
    "enable_animations": true,
    "export_formats": ["png", "svg", "pdf"]
  }
}
```

**天文学模块配置示例**:
```json
{
  "module": {
    "id": "astronomy",
    "name": "天文学",
    "category": "science",
    "subcategory": "astronomy",
    "version": "2.0.0",
    "description": "天文学可视化工具集，包含现代天文学和藏历历算",
    "author": "万物可视化团队",
    "tags": ["天文学", "行星", "恒星", "轨道", "藏历"]
  },
  "submodules": [
    {
      "id": "modern_astronomy",
      "name": "现代天文学",
      "description": "现代天文学可视化工具"
    },
    {
      "id": "tibetan_calendar",
      "name": "藏历历算",
      "description": "传统藏历计算和可视化工具"
    }
  ],
  "dependencies": [
    {
      "name": "plotly.js",
      "version": "^2.0.0"
    },
    {
      "name": "three.js",
      "version": "^0.150.0"
    }
  ],
  "data_sources": [
    {
      "name": "celestial_data",
      "type": "json",
      "path": "data/celestial_bodies.json"
    },
    {
      "name": "tibetan_calendar_data",
      "type": "json",
      "path": "tibetan_calendar/data/calendar_data.json"
    }
  ]
}
```

## Migration Plan

### 阶段1: 结构分析和设计 (1-2天)
1. 详细分析ai_visual_math、ai_visual_astronomy、ai_visual_differential_geometry目录中的所有内容
2. 识别可复用的功能和代码
3. 设计新的模块结构和接口规范
4. 制定迁移的优先级和时间表

### 阶段2: 核心模块创建 (3-4天)
1. 创建mathematics数学分支总目录和导航结构
2. 迁移现有的probability_statistics模块到mathematics/probability_statistics
3. 迁移现有的linear_algebra模块到mathematics/linear_algebra
4. 创建calculus、algebra、geometry、discrete_math模块的基础结构
5. 重组astronomy模块，建立modern_astronomy和tibetan_calendar子模块
6. 整合differential_geometry模块内容
7. 实现每个模块的基础页面和导航
8. 建立模块间的数据共享和通信机制

### 阶段3: 功能迁移和整合 (4-5天)
1. 将ai_visual_math中的核心功能迁移到对应的新模块
2. 将ai_visual_astronomy的内容迁移到astronomy模块
3. 将ai_visual_differential_geometry的内容整合到differential_geometry模块
4. 验证迁移后的probability_statistics和linear_algebra模块功能完整性
5. 实现模块间的跳转和关联功能
6. 添加新的可视化效果和交互功能
7. 建立数学分支的统一导航和搜索功能

### 阶段4: 测试和优化 (2-3天)
1. 进行全面的功能测试和兼容性测试
2. 优化性能和用户体验
3. 更新文档和使用指南
4. 准备部署和发布

### 回滚计划
- 保留ai_visual_math目录的完整备份
- 创建分支进行开发，支持快速回滚
- 逐步切换，确保每个阶段都可以独立回滚
- 建立监控和告警机制

## Risks / Trade-offs

### 风险分析
- **功能丢失风险**: 迁移过程中可能遗漏某些功能
  - **缓解措施**: 详细的功能清单和对比测试
- **兼容性风险**: 新结构可能影响现有用户的访问
  - **缓解措施**: 保持向后兼容的URL和接口
- **开发复杂度**: 重组工作量大，可能影响其他功能开发
  - **缓解措施**: 分阶段进行，并行开发其他功能

### 权衡选择
- **标准化 vs 灵活性**: 优先标准化，保留必要的灵活性
- **重构效率 vs 系统稳定性**: 优先考虑系统稳定性，逐步提高效率
- **用户体验 vs 开发成本**: 平衡用户体验改善和开发投入

## Success Criteria

1. **功能完整性**: 所有原有功能在新的模块结构中正常工作
2. **用户体验**: 提供更清晰的导航和更好的使用体验
3. **开发效率**: 新功能开发效率提升50%以上
4. **维护成本**: 模块维护工作量减少60%以上
5. **扩展性**: 支持快速添加新的数学分支和功能

## Open Questions

1. **是否需要创建一个数学总览模块**来统一所有数学分支的入口？
2. **如何处理现有的概率统计模块**，是否需要重新组织其内容？
3. **是否保留ai_visual_math中的某些特殊功能**作为独立模块？
4. **如何设计模块间的关联和跳转机制**？
5. **是否需要建立数学符号和公式的统一渲染机制**？