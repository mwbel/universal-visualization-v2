# 高等数学概念数据库

基于 `books/高等数学` 目录构建的完整概念知识库系统。

## 📋 项目概述

本项目从高等数学教材的 Markdown 文件中自动提取概念、定义、定理等，构建结构化的概念数据库，支持：

- 概念搜索和查询
- 前置知识关系图谱
- 学习路径生成
- 与 Manim 动画系统集成

## 🏗️ 架构设计

```
概念数据库系统
├── concept_database.py      # 核心数据库模块
├── markdown_parser.py        # Markdown 解析器
├── build_database.py         # 数据库构建脚本
├── database_examples.py      # 使用示例
└── math_concepts.db          # SQLite 数据库文件
```

### 数据模型

**概念表 (concepts)**
- 基本信息：名称、类型、章节、难度
- 内容：描述、公式、关键词
- 扩展：几何意义、物理意义

**关系表 (concept_relations)**
- 前置知识 (prerequisite)
- 派生关系 (derived)
- 相关概念 (related)
- 应用场景 (application)

**示例表 (examples)**
- 关联概念的例题和解答

**可视化表 (visualizations)**
- Manim 动画资源

## 🚀 快速开始

### 1. 构建数据库

```bash
python build_database.py
```

这将：
1. 解析 `books/高等数学` 目录下的所有 Markdown 文件
2. 提取概念、定义、定理等
3. 建立概念之间的关系
4. 生成知识图谱和统计报告

### 2. 使用数据库

```python
from concept_database import ConceptDatabase

# 创建数据库连接
with ConceptDatabase() as db:
    # 搜索概念
    results = db.search_concepts("导数")

    # 获取前置知识
    prereqs = db.get_prerequisites("偏导数")

    # 获取章节概念
    concepts = db.get_chapter_concepts("第3章")

    # 导出知识图谱
    graph = db.export_knowledge_graph()
```

### 3. 运行示例

```bash
python database_examples.py
```

查看 8 个完整的使用示例。

## 📊 数据统计

构建完成后，数据库包含：

- **概念数量**: 100+ 个核心概念
- **关系数量**: 50+ 个前置知识关系
- **覆盖章节**: 13 个章节（基本知识到微分方程）
- **概念类型**: 定义、定理、公式、性质、方法

## 🔍 核心功能

### 1. 概念搜索

```python
# 按关键词搜索
results = db.search_concepts("极限")

# 按章节搜索
results = db.search_concepts("导数", chapter="第3章")
```

### 2. 前置知识查询

```python
# 获取学习某个概念需要的前置知识
prereqs = db.get_prerequisites("梯度")
# 返回: ["偏导数", "向量", "方向导数"]
```

### 3. 学习路径生成

```python
# 自动生成从基础到目标的学习路径
path = build_learning_path("重积分")
# 返回: ["函数", "极限", "导数", "积分", "多元函数", "重积分"]
```

### 4. 知识图谱导出

```python
# 导出为 JSON 格式，可用于可视化
graph = db.export_knowledge_graph("knowledge_graph.json")
```

## 🎨 与 Manim 集成

数据库可以与现有的 Math2Manim 系统无缝集成：

```python
from concept_database import ConceptDatabase
from math2manim import generate_animation

with ConceptDatabase() as db:
    # 获取概念
    concept = db.get_concept("导数")

    # 生成动画
    animation_path = generate_animation(
        concept=concept['name'],
        formulas=concept['latex_formulas'],
        keywords=concept['keywords']
    )

    # 保存到数据库
    db.add_visualization(concept['id'], animation_path)
```

## 📁 文件说明

### concept_database.py
核心数据库模块，提供：
- 数据库初始化和管理
- 概念的增删改查
- 关系管理
- 统计和导出功能

### markdown_parser.py
Markdown 文件解析器，支持：
- 自动识别定义、定理、公式
- 提取 LaTeX 公式
- 提取章节和小节信息
- 智能概念命名

### build_database.py
数据库构建脚本，执行：
- 批量解析 Markdown 文件
- 导入概念到数据库
- 建立预定义关系
- 生成统计报告

### database_examples.py
8 个完整的使用示例：
1. 搜索概念
2. 获取前置知识
3. 获取章节概念
4. 构建学习路径
5. 导出知识图谱
6. 查看概念详情
7. 数据库统计
8. 与 Manim 集成

## 🔧 扩展功能

### 1. 添加自定义概念

```python
from concept_database import Concept, ConceptType

concept = Concept(
    name="泰勒级数",
    type=ConceptType.THEOREM.value,
    chapter="第11章",
    difficulty=5,
    latex_formulas=[r"f(x) = \sum_{n=0}^{\infty} \frac{f^{(n)}(a)}{n!}(x-a)^n"],
    keywords=["级数", "展开", "逼近"]
)

db.add_concept(concept)
```

### 2. 添加概念关系

```python
from concept_database import RelationType

db.add_relation(
    source_name="泰勒级数",
    target_name="导数",
    relation_type=RelationType.PREREQUISITE,
    strength=9
)
```

### 3. 自定义解析规则

在 `markdown_parser.py` 中修改 `CONCEPT_PATTERNS` 来识别更多概念类型。

## 📈 未来改进

- [ ] 使用 LLM 自动提取概念关系
- [ ] 添加向量数据库支持语义搜索
- [ ] 构建 Web 界面进行可视化浏览
- [ ] 集成更多教材和参考资料
- [ ] 支持概念的多语言版本
- [ ] 添加概念难度的自动评估

## 🤝 与现有系统集成

本数据库可以与项目中的其他模块集成：

```python
# 与 ConceptAnalyzer 集成
from math2manim.core.concept_analyzer import ConceptAnalyzer

analyzer = ConceptAnalyzer()
analysis = analyzer.analyze("导数")

# 将分析结果存入数据库
concept = Concept(
    name=analysis.concept,
    type=analysis.type.value,
    difficulty=analysis.difficulty.value,
    keywords=analysis.keywords,
    latex_formulas=analysis.formulas
)
db.add_concept(concept)

# 与 KnowledgeTree 集成
from math2manim.core.knowledge_tree import KnowledgeTree

tree = KnowledgeTree()
tree.build_tree("偏导数")

# 将知识树关系导入数据库
for prereq in tree.root.prerequisites:
    db.add_relation(
        tree.root.concept,
        prereq.concept,
        RelationType.PREREQUISITE
    )
```

## 📝 注意事项

1. 首次运行 `build_database.py` 会创建新数据库
2. 重复运行会跳过已存在的概念（基于名称去重）
3. 数据库文件默认为 `math_concepts.db`
4. 知识图谱导出为 `knowledge_graph.json`
5. 统计报告保存为 `database_report.json`

## 🎯 使用场景

1. **学习路径规划**: 为学生生成个性化学习路径
2. **概念可视化**: 自动为概念生成 Manim 动画
3. **知识图谱**: 可视化数学概念之间的关系
4. **智能推荐**: 根据已掌握的知识推荐下一步学习内容
5. **教学辅助**: 帮助教师组织教学内容

## 📞 支持

如有问题或建议，请查看项目文档或提交 Issue。
