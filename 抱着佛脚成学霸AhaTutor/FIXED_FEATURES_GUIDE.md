# 修复功能使用指南

## 问题已修复 ✅

针对"偏导数"概念的两个问题已经完全修复：

### 1. 知识树现在正确显示
- **之前**：只显示"偏导数"一个节点
- **现在**：显示完整的学习路径，包含13个节点
  - 偏导数 → 导数 → 函数/极限/变化率
  - 偏导数 → 多元函数
  - 偏导数 → 极限 → 函数/数列/无穷

### 2. 视频包含完整教学内容
- **之前**：只有标题，时长3秒
- **现在**：完整的30秒教学动画，包含：
  - 标题介绍
  - 几何图形演示
  - 图形变换动画
  - 数学公式展示
  - 公式变换
  - 总结文字

## 如何使用

### 方式1：通过前端界面（推荐）

1. 打开浏览器访问：`http://localhost:8002`（concept2animation服务）
2. 在"概念名称"输入框中输入：`偏导数`
3. 选择视频质量（推荐：中质量 720p）
4. 选择动画风格（推荐：专业风格）
5. 点击"🎬 生成动画"按钮
6. 等待30-120秒，视频生成完成后会自动播放

### 方式2：通过 API 调用

#### 生成带知识树的完整动画（Math2Manim服务）

```bash
curl -X POST http://localhost:8003/generate \
  -H "Content-Type: application/json" \
  -d '{
    "concept": "偏导数",
    "quality": "m",
    "style": "professional",
    "build_tree": true
  }'
```

**返回结果包含**：
- `success`: 是否成功
- `video_path`: 视频文件路径
- `code`: 生成的 Manim 代码
- `learning_path`: 学习路径（从基础到高级）
- `knowledge_tree`: 完整的知识树结构
- `analysis`: 概念分析（类型、难度、关键词、公式等）

#### 快速生成动画（Concept2Animation服务）

```bash
curl -X POST http://localhost:8002/generate \
  -H "Content-Type: application/json" \
  -d '{
    "concept": "偏导数",
    "quality": "m",
    "style": "educational"
  }'
```

#### 仅分析概念（不生成视频）

```bash
curl -X POST http://localhost:8003/analyze \
  -H "Content-Type: application/json" \
  -d '{"concept": "偏导数"}'
```

**返回结果**：
```json
{
  "success": true,
  "concept": "偏导数",
  "type": "mathematics",
  "difficulty": "undergraduate",
  "keywords": ["多元函数", "变化率", "方向", "梯度"],
  "formulas": ["\\frac{\\partial f}{\\partial x}", "\\frac{\\partial f}{\\partial y}"],
  "prerequisites": ["导数", "多元函数", "极限"],
  "visualization_hints": [
    "绘制三维曲面",
    "显示切平面",
    "动画展示沿不同方向的变化率",
    "可视化梯度向量"
  ]
}
```

## 支持的新概念

除了"偏导数"，以下概念现在也完全支持：

### 高等数学
- ✅ 偏导数
- ✅ 梯度
- ✅ 二重积分
- ✅ 微分方程
- ✅ 泰勒级数
- ✅ 拉格朗日乘数法

### 线性代数
- ✅ 行列式
- ✅ 特征值
- ✅ 矩阵
- ✅ 向量

### 数学分析
- ✅ 极限
- ✅ 连续性
- ✅ 傅里叶变换

### 概率统计
- ✅ 概率分布

## 视频质量选项

| 质量级别 | 分辨率 | 渲染时间 | 适用场景 |
|---------|--------|---------|---------|
| `l` (低) | 480p | 30-60秒 | 快速预览 |
| `m` (中) | 720p | 60-90秒 | 日常使用（推荐）|
| `h` (高) | 1080p | 90-120秒 | 专业制作 |
| `k` (4K) | 2160p | 120-180秒 | 最高质量 |

## 动画风格选项

| 风格 | 特点 | 适用场景 |
|-----|------|---------|
| `educational` | 详细讲解，步骤清晰 | 教学视频 |
| `professional` | 精致效果，专业呈现 | 演示文稿 |
| `simple` | 简洁快速，核心内容 | 快速理解 |

## 常见问题

### Q: 视频生成失败怎么办？
A: 检查以下几点：
1. 确保 Manim 已正确安装：`python3 -m manim --version`
2. 检查服务是否运行：`curl http://localhost:8002/health`
3. 查看错误日志，通常会提示具体问题

### Q: 知识树显示不完整？
A: 这是正常的，系统会递归到基础概念（高中水平）为止。如果需要更深的知识树，可以修改 `max_depth` 参数。

### Q: 可以自定义概念吗？
A: 可以！即使是未预定义的概念，系统也会：
1. 自动分析概念类型和难度
2. 生成基础的教学动画
3. 尝试推断前置知识

### Q: 如何获取生成的视频文件？
A: 视频保存在以下位置：
- Concept2Animation: `./concept2animation/media/videos/`
- Math2Manim: `./math2manim_service/media/videos/`

或通过 API 返回的 `video_path` 访问。

## 技术细节

### 服务端口
- **Concept2Animation**: `http://localhost:8002`
- **Math2Manim**: `http://localhost:8003`
- **主应用 (Aha Tutor)**: `http://localhost:8000`

### 核心文件
- 知识树逻辑: `Math2Manim/math2manim/core/knowledge_tree.py`
- 概念分析: `Math2Manim/math2manim/core/concept_analyzer.py`
- 代码生成: `Math2Manim/math2manim/core/code_generator.py`

## 下一步

### 建议尝试的概念
1. **梯度** - 查看如何可视化向量场
2. **二重积分** - 体验三维体积计算
3. **傅里叶变换** - 观看频域分析动画
4. **特征值** - 理解线性变换

### 反馈和改进
如果发现任何问题或有改进建议，请：
1. 查看 `BUG_FIX_REPORT.md` 了解技术细节
2. 在项目中创建 issue
3. 或直接修改相关代码文件

---

**修复日期**: 2026-03-11
**版本**: v1.1.0
**状态**: ✅ 已验证通过
