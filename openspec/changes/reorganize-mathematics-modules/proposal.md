## Why

当前学科模块分散在多个目录中，包括独立的ai_visual_math、ai_visual_astronomy、ai_visual_differential_geometry等目录和GeneralVisualization/app/modules下的部分模块。这种分散的结构导致维护困难、代码重复、用户体验不一致。需要将所有学科模块统一整理到GeneralVisualization/app/modules下，建立清晰的学科层级结构，便于统一管理和开发。

## What Changes

- **整合数学模块结构**: 将现有的probability_statistics、linear_algebra模块迁移到新的mathematics分支下，同时整合ai_visual_math目录中的内容
- **创建数学分支体系**: 建立包含微积分、代数学、几何学、离散数学、概率统计、线性代数的完整数学学科体系
- **重组天文学模块**: 将ai_visual_astronomy复制到GeneralVisualization/app/modules/astronomy，包含现代天文学和藏历历算两个子模块
- **整合微分几何模块**: 将ai_visual_differential_geometry的内容整合到GeneralVisualization/app/modules/differential_geometry
- **建立学科层级**: 创建所有学科的统一组织结构，数学、天文、物理等学科平级管理
- **标准化模块格式**: 确保所有模块遵循相同的目录结构和接口规范
- **更新引用和链接**: 修改所有相关的文档和代码引用
- **清理冗余代码**: 移除重复的代码和过时的框架

## Impact

- **Affected specs**: mathematics-module-structure, content-organization, module-hierarchy, astronomy-module-structure
- **Affected code**:
  - GeneralVisualization/app/modules/ (新增数学分支模块，重组天文学和微分几何模块)
  - 移除或归档ai_visual_math、ai_visual_astronomy、ai_visual_differential_geometry目录
  - 更新main-app中的相关路由和引用
- **用户体验**: 提供统一的学科入口，改善导航和使用体验