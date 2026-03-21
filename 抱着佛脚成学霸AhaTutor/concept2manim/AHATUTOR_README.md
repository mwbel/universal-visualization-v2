# AhaTutor - 高等数学可视化学习平台

## 🎉 项目完成！

AhaTutor 是一个基于 AI 的高等数学可视化交互式学习辅助平台，整合了知识检索和动画生成功能。

---

## 🏗️ 系统架构

```
AhaTutor
├── Universal RAG          # 知识检索系统
│   ├── 11种检索策略
│   ├── 向量检索
│   └── 知识图谱
│
├── Concept2Animation      # 动画生成系统
│   ├── Manim 代码生成
│   ├── 自动渲染
│   └── 视频输出
│
├── 高等数学知识库
│   ├── math_concepts.db   # SQLite 数据库
│   ├── knowledge_graph.json
│   └── 13章完整内容
│
└── AhaTutor Service       # 集成服务
    ├── ahatutor_service.py
    └── ahatutor_index.html
```

---

## ✨ 核心功能

### 1. 智能问答
- 基于高等数学知识库的自然语言问答
- 使用 Universal RAG 进行语义检索
- 支持上下文追问

### 2. 概念可视化
- 自动生成 Manim 动画
- 多种质量选项（低/中/高）
- 实时渲染和播放

### 3. 学习路径
- 基于知识图谱生成学习路径
- 显示前置知识和相关概念
- 智能推荐学习顺序

### 4. 相关概念推荐
- 自动识别相关概念
- 一键跳转学习
- 知识点关联展示

---

## 🚀 快速开始

### 1. 安装依赖

```bash
# 安装 Python 依赖
pip install fastapi uvicorn anthropic zhipuai manim

# 确保 Manim 已正确安装
python3 -m manim --version
```

### 2. 启动服务

```bash
cd concept2manim
python3 ahatutor_service.py
```

### 3. 访问界面

打开浏览器访问：
- **主页**: http://localhost:8000
- **API 文档**: http://localhost:8000/docs
- **API 信息**: http://localhost:8000/api
- **健康检查**: http://localhost:8000/health

---

## 📖 使用指南

### 基础使用

1. **提问**：在输入框中输入数学问题，例如"什么是导数？"
2. **查看答案**：系统会从知识库检索并生成答案
3. **观看动画**：如果勾选"生成动画"，系统会自动生成可视化动画
4. **探索概念**：点击相关概念标签，继续深入学习

### 快速提问

右侧边栏提供了常见问题快捷入口：
- 什么是导数？
- 什么是极限？
- 什么是积分？
- 什么是微分？
- 泰勒级数是什么？

### 动画质量设置

- **低 (l)**: 快速渲染，适合预览
- **中 (m)**: 平衡质量和速度（推荐）
- **高 (h)**: 高质量输出，渲染较慢

---

## 🔧 API 接口

### POST /ask
提问并获取答案

**请求体**:
```json
{
  "question": "什么是导数？",
  "generate_animation": true,
  "animation_quality": "m"
}
```

**响应**:
```json
{
  "success": true,
  "answer": "导数是函数在某一点的变化率...",
  "session_id": "abc123",
  "related_concepts": [
    {"id": 1, "title": "极限", "score": 0.95}
  ],
  "learning_path": [...],
  "animation_url": "/video/videos/导数_abc123.mp4"
}
```

### POST /animate
为指定概念生成动画

**请求体**:
```json
{
  "concept": "勾股定理",
  "quality": "m",
  "style": "educational"
}
```

### GET /concepts
获取所有概念列表

### GET /learning-path/{concept_id}
获取指定概念的学习路径

### GET /health
健康检查

---

## 📊 数据库结构

### math_concepts.db

**concepts 表**:
- id: 概念ID
- title: 概念名称
- content: 概念内容
- chapter: 所属章节
- difficulty: 难度等级
- prerequisites: 前置知识

**relations 表**:
- source_id: 源概念ID
- target_id: 目标概念ID
- relation_type: 关系类型（prerequisite, related, etc.）

---

## 🎯 技术栈

### 后端
- **FastAPI**: Web 框架
- **Universal RAG**: 知识检索
- **SQLite**: 数据库
- **Manim**: 动画生成

### 前端
- **HTML5 + CSS3**: 界面
- **JavaScript**: 交互逻辑
- **Fetch API**: 异步请求

### AI
- **Anthropic Claude**: 代码生成（可选）
- **GLM-4**: 代码生成（可选）
- **向量检索**: 语义搜索
- **知识图谱**: 关系推理

---

## 📁 项目文件

```
concept2manim/
├── ahatutor_service.py          # 主服务（新）
├── ahatutor_index.html          # Web 界面（新）
├── math_concepts.db             # 知识库
├── knowledge_graph.json         # 知识图谱
├── universal_rag/               # RAG 系统
│   ├── core/
│   ├── examples/
│   └── web/
├── concept2animation/           # 动画服务
│   └── app.py
└── media/                       # 生成的视频
```

---

## 🎓 支持的知识点

### 高等数学 13 章

1. **基本知识**: 集合、函数、初等函数
2. **极限与连续**: 数列极限、函数极限、连续性
3. **导数与微分**: 导数定义、求导法则、微分
4. **微分中值定理**: 罗尔定理、拉格朗日定理
5. **积分**: 不定积分、定积分、积分方法
6. **定积分的应用**: 面积、体积、弧长
7. **空间解析几何**: 向量、平面、直线、曲面
8. **多元函数微分学**: 偏导数、全微分、极值
9. **重积分**: 二重积分、三重积分
10. **曲线曲面积分**: 曲线积分、曲面积分
11. **无穷级数**: 数项级数、幂级数、傅里叶级数
12. **微分方程**: 一阶方程、高阶方程
13. **差分方程**: 差分概念、线性差分方程

---

## 🔍 使用示例

### 示例 1: 基础问答

**问题**: "什么是导数？"

**系统响应**:
1. 从知识库检索相关内容
2. 生成详细解答
3. 推荐相关概念（极限、微分、切线）
4. 生成导数可视化动画

### 示例 2: 学习路径

**问题**: "我想学习积分"

**系统响应**:
1. 识别"积分"概念
2. 生成学习路径：极限 → 导数 → 不定积分 → 定积分
3. 显示每个步骤的难度和预计学习时间

### 示例 3: 追问

**对话流程**:
- 用户: "什么是导数？"
- 系统: [解释导数概念]
- 用户: "导数有什么应用？"
- 系统: [基于上下文，解释导数的应用]

---

## 🛠️ 配置选项

### RAG 策略

在 `ahatutor_service.py` 中可以修改 RAG 策略：

```python
# 当前使用：概念解释优化策略
RAGStrategySelector.apply_strategy(rag_config, RAGStrategy.CONCEPT_EXPLANATION)

# 其他可选策略：
# - RAGStrategy.QA_FOCUSED: 问答优化
# - RAGStrategy.LEARNING_PATH: 学习路径优化
# - RAGStrategy.HYBRID: 混合检索
```

### 动画质量

- `l`: 480p, 15fps
- `m`: 720p, 30fps
- `h`: 1080p, 60fps
- `k`: 4K, 60fps

---

## 🐛 故障排除

### 问题 1: RAG 系统初始化失败

**解决方案**:
```bash
# 检查数据库文件是否存在
ls -la math_concepts.db

# 如果不存在，运行构建脚本
python3 build_database.py
```

### 问题 2: Manim 渲染失败

**解决方案**:
```bash
# 检查 Manim 安装
python3 -m manim --version

# 重新安装 Manim
pip install --upgrade manim
```

### 问题 3: 视频无法播放

**解决方案**:
- 检查浏览器是否支持 MP4 格式
- 确保 media 目录有写入权限
- 查看浏览器控制台错误信息

---

## 📈 性能优化

### 1. 缓存策略
- RAG 检索结果缓存
- 常见问题答案缓存
- 动画文件缓存

### 2. 并发处理
- 异步 API 调用
- 后台动画渲染
- 数据库连接池

### 3. 资源管理
- 定期清理旧视频文件
- 限制并发渲染数量
- 内存使用监控

---

## 🚧 未来计划

### Phase 1 (已完成)
- ✅ Universal RAG 集成
- ✅ Concept2Animation 集成
- ✅ 基础问答功能
- ✅ 动画生成功能
- ✅ Web 界面

### Phase 2 (计划中)
- ⏳ 用户认证系统
- ⏳ 学习进度追踪
- ⏳ 艾宾浩斯复习提醒
- ⏳ 习题练习模式
- ⏳ 移动端适配

### Phase 3 (未来)
- 📋 多学科扩展（线性代数、概率论）
- 📋 3D 可视化支持
- 📋 教师端功能
- 📋 协作学习功能

---

## 📝 开发日志

- **2026-03-15**: 完成 Universal RAG 系统
- **2026-03-15**: 完成高等数学知识库构建
- **2026-03-16**: 完成 AhaTutor 集成服务
- **2026-03-16**: 完成 Web 前端界面

---

## 👥 贡献者

- Claude (Anthropic) - AI 助手

---

## 📄 许可证

MIT License

---

## 🙏 致谢

- **Manim**: 数学动画引擎
- **FastAPI**: 现代 Web 框架
- **Anthropic**: AI 技术支持

---

## 📞 联系方式

如有问题或建议，请通过以下方式联系：
- GitHub Issues
- Email: [待添加]

---

**🎉 开始使用 AhaTutor，让数学学习更直观、更有趣！**
