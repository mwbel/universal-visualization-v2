# Concept2Manim 文档索引

基于反向知识树的智能概念动画生成服务

## 📚 文档目录

### 核心文档

1. **[README.md](./README.md)** - 服务使用指南
   - 快速开始
   - API 接口说明
   - 使用示例

2. **[LLM_SETUP.md](./LLM_SETUP.md)** - LLM 配置指南
   - 如何配置 Anthropic Claude API
   - 如何配置 OpenAI GPT API
   - 启用真实物理/数学概念生成

### 开发文档

3. **[MATH2MANIM_ORIGINAL.md](./MATH2MANIM_ORIGINAL.md)** - Math2Manim 原始文档
   - 项目架构
   - 核心算法
   - 反向知识树原理

4. **[PACKAGE_README.md](./PACKAGE_README.md)** - Python 包文档
   - 安装方法
   - API 参考
   - 代码示例

5. **[README_PACKAGE.md](./README_PACKAGE.md)** - 包发布文档

### 项目报告

6. **[COMPLETION_SUMMARY.md](./COMPLETION_SUMMARY.md)** - 完成总结
7. **[DELIVERY_CHECKLIST.md](./DELIVERY_CHECKLIST.md)** - 交付清单
8. **[FINAL_REPORT.md](./FINAL_REPORT.md)** - 最终报告

## 🚀 快速开始

### 1. 启动服务

```bash
cd math2manim_service
python3 app.py
```

服务将运行在 http://localhost:8003

### 2. 访问 Web 界面

打开浏览器访问: http://localhost:8003

### 3. 配置 LLM（可选但推荐）

查看 [LLM_SETUP.md](./LLM_SETUP.md) 配置 API Key，启用真实的物理/数学概念生成。

## 📖 主要特性

- ✅ **反向知识树算法** - 递归分解前置知识
- ✅ **智能概念分析** - 自动识别概念类型和难度
- ✅ **学习路径生成** - 从基础到高级的完整路径
- ✅ **高质量代码生成** - 自动生成 Manim 动画代码
- ✅ **自动动画渲染** - 一键生成专业视频
- ✅ **LLM 集成** - 支持 Claude/GPT 动态生成

## 🔧 技术栈

- **后端**: FastAPI + Python
- **动画引擎**: Manim Community Edition
- **AI**: Anthropic Claude / OpenAI GPT
- **前端**: HTML + CSS + JavaScript

## 📝 更新日志

### 2026-03-11
- ✅ 重命名为 Concept2Manim
- ✅ 更新 UI 为白蓝科技风格
- ✅ 集成 LLM 客户端
- ✅ 修复偏导数动画（3D 曲面 + 切线）
- ✅ 整理项目文档

### 2025-12-23
- ✅ 初始版本 Math2Manim
- ✅ 实现反向知识树算法
- ✅ 添加预定义模板
