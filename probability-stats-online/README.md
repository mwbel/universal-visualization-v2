# 概率统计可视化 - 在线版（支持大模型集成）

## 🎉 项目概述

这是**概率统计可视化系统**的在线版本，专为部署到服务器并集成大语言模型（LLM）而设计。

### 核心特性

- ✅ **30+ 交互式可视化页面**：覆盖概率统计核心概念
- ✅ **CDN加速**：使用CDN加载库文件，无需本地依赖
- ✅ **大模型集成**：预留AI接口，支持智能问答、概念解释
- ✅ **完全离线可用**：也支持离线部署（参考离线版）
- ✅ **响应式设计**：支持PC、平板、手机
- ✅ **现代UI**：渐变色主题，流畅动画

---

## 📦 文件结构

```
probability-stats-online/
├── modules/                      # 可视化模块（使用CDN）
│   ├── 常见离散分布可视化.html
│   ├── 随机变量函数的分布可视化.html
│   ├── Bootstrap方法可视化.html
│   ├── 二维随机变量联合分布可视化.html
│   └── 边缘分布与条件分布可视化.html
│
├── api/                          # API客户端
│   └── api-client.js             # 封装所有API调用
│
├── config/                       # 配置文件
│   └── api-config.js             # API配置
│
├── docs/                         # 文档
│   ├── 大模型集成指南.md          # LLM集成详细指南
│   └── 服务器部署指南.md          # 服务器部署指南
│
├── convert-to-online.sh          # 转换脚本
└── README.md                     # 本文件
```

---

## 🚀 快速开始

### 方式1：本地测试（最简单）

```bash
# 1. 进入modules目录
cd modules/

# 2. 启动本地HTTP服务器
python -m http.server 8080

# 3. 打开浏览器访问
open http://localhost:8080/常见离散分布可视化.html
```

### 方式2：部署到服务器

**请参考**: [服务器部署指南.md](docs/服务器部署指南.md)

支持多种部署方式：
- 传统服务器部署（Ubuntu/CentOS + Nginx）
- Docker容器部署
- 云平台部署（AWS/阿里云/腾讯云）

---

## 🤖 大模型集成

本版本已预留大模型API接口，支持以下功能：

### 核心功能
1. **智能概念解释**：AI解释概率统计概念
2. **互动式问答**：实时回答学生问题
3. **自动测验生成**：根据内容生成练习题
4. **智能学习推荐**：个性化学习路径
5. **错题分析**：分析错误并给出建议

### 集成步骤

**1. 配置API密钥**
```javascript
// 修改 config/api-config.js
const API_CONFIG = {
    LLM_API: {
        apiKey: 'your-api-key',  // 替换为你的API密钥
        baseURL: 'https://api.openai.com/v1',
        model: 'gpt-3.5-turbo'
    }
};
```

**2. 在页面中添加AI助手按钮**
```html
<button onclick="askAI('条件概率')">🤖 AI解释</button>

<script src="../api/api-client.js"></script>
<script>
async function askAI(concept) {
    const response = await llmClient.explainConcept(concept);
    showAIExplanation(response.data);
}
</script>
```

**3. 详细集成指南**
请参考：[大模型集成指南.md](docs/大模型集成指南.md)

---

## 📊 可视化模块列表

### 🆕 新增模块（5个）
1. **常见离散分布可视化** - 几何分布、超几何分布、负二项分布
2. **随机变量函数的分布** - 线性、平方、指数、对数变换
3. **Bootstrap方法** - 自助法重采样技术
4. **二维随机变量联合分布** - 二维正态分布、3D可视化
5. **边缘分布与条件分布** - 联合、边缘、条件分布对比

### 📚 基础模块（25+个）
- 第一章：概率论的基本概念（6个）
- 第二章：随机变量及其分布（8个）
- 第三章：多维随机变量（6个）
- 第八章：中心极限定理（2个）
- 第九章：三大抽样分布（2个）
- 第十章：假设检验（4个）

---

## 🔧 技术栈

### 前端
- **HTML5/CSS3**: 页面结构和样式
- **JavaScript (ES6+)**: 交互逻辑
- **Plotly.js**: 数据可视化（CDN）
- **MathJax**: 数学公式渲染（CDN）

### 后端（需自行开发）
- **FastAPI**: Python Web框架（推荐）
- **PostgreSQL**: 数据库
- **Redis**: 缓存和限流
- **Nginx**: 反向代理

### 大模型
- **OpenAI GPT**: gpt-3.5-turbo / gpt-4
- **Anthropic Claude**: claude-3系列
- **国产大模型**: 智谱GLM、百度文心等
- **本地模型**: Ollama + Llama2

---

## 📖 文档索引

### 开发文档
- [大模型集成指南](docs/大模型集成指南.md) - 如何集成LLM API
- [API设计文档](docs/大模型集成指南.md#api设计) - API接口规范

### 部署文档
- [服务器部署指南](docs/服务器部署指南.md) - 完整部署流程
- [Docker部署](docs/服务器部署指南.md#方案2docker部署) - 容器化部署
- [云平台部署](docs/服务器部署指南.md#方案3云平台部署) - AWS/阿里云/腾讯云

### 使用文档
- [快速开始](#快速开始) - 本地测试
- [功能说明](#大模型集成) - AI功能介绍
- [模块列表](#可视化模块列表) - 所有可视化页面

---

## 🎯 使用场景

### ✅ 适合
- 在线教育平台集成
- 学校教学辅助系统
- 考研数学学习平台
- 统计学入门学习
- 企业培训系统

### 💡 核心优势
- **零依赖部署**: 使用CDN，无需本地库文件
- **AI增强**: 支持大模型集成，智能问答
- **易于扩展**: 模块化设计，方便添加新功能
- **生产就绪**: 完整的部署方案和文档

---

## 🔐 安全和成本

### API密钥管理
```bash
# 使用环境变量，不要硬编码
export LLM_API_KEY="sk-..."
```

### 成本控制
- **Token优化**: 缓存常见回答，减少API调用
- **请求限流**: 防止滥用，控制成本
- **预算控制**: 设置每日最大使用量

详细策略请参考：[大模型集成指南 - 成本优化](docs/大模型集成指南.md)

---

## 🆚 版本对比

| 特性 | 离线版 | 在线版 |
|------|--------|--------|
| 库文件 | 本地lib/ | CDN加载 |
| 文件大小 | 1.5MB | 小（无本地库） |
| 网络需求 | 无需网络 | 需要网络（CDN） |
| AI功能 | ❌ | ✅ 预留接口 |
| 部署 | 本地打开 | 服务器部署 |
| 使用场景 | 个人学习 | 在线平台 |

---

## 🛠️ 开发路线图

### 已完成 ✅
- [x] 30+ 可视化页面
- [x] CDN版本转换
- [x] API客户端封装
- [x] 配置文件设计
- [x] 完整文档编写

### 进行中 🚧
- [ ] AI助手UI组件
- [ ] 后端API实现
- [ ] 用户认证系统
- [ ] 数据持久化

### 计划中 📋
- [ ] 学习进度追踪
- [ ] 智能推荐算法
- [ ] 社区功能
- [ ] 移动端优化

---

## 🤝 贡献指南

欢迎贡献代码和提出建议！

### 如何贡献
1. Fork本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启Pull Request

### 代码规范
- 使用ES6+语法
- 遵循PEP 8（Python后端）
- 添加注释和文档
- 编写单元测试

---

## 📧 联系方式

- **问题反馈**: 提交Issue
- **功能建议**: 提交Pull Request
- **商业合作**: 联系项目维护者

---

## 📄 开源协议

本项目采用 MIT 协议 - 查看 [LICENSE](LICENSE) 文件了解详情

---

## 🎉 致谢

- Plotly.js - 强大的图表库
- MathJax - 数学公式渲染
- OpenAI - GPT系列模型
- Anthropic - Claude系列模型

---

**最后更新**: 2026年1月21日
**版本**: v1.0 Online
**状态**: ✅ 可用于生产部署

---

## 🚀 立即开始

```bash
# 1. 克隆或下载项目
git clone <repository-url>
cd probability-stats-online

# 2. 本地测试
cd modules/
python -m http.server 8080

# 3. 打开浏览器
open http://localhost:8080/常见离散分布可视化.html

# 4. 开始集成AI（可选）
# 查看 docs/大模型集成指南.md
```

**祝使用愉快！** 🎓✨
