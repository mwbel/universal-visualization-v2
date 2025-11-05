# 万物可视化 - 使用指南

## 🚀 快速开始

### 方式一：使用启动脚本（推荐）

```bash
# 1. 进入项目目录
cd /Users/Min369/Documents/同步空间/Manju/Projects/AlVisualization

# 2. 运行快速启动脚本
./quick-start.sh
```

### 方式二：手动启动

#### 1. 启动后端服务

```bash
# 创建虚拟环境（首次使用）
python3 -m venv backend-env

# 激活虚拟环境
source backend-env/bin/activate

# 安装依赖（首次使用）
pip install fastapi uvicorn pydantic

# 启动后端服务
python backend-api.py
```

#### 2. 访问前端界面

选择以下任一入口：

- **🎯 启动中心**: `START_HERE.html` - 包含所有入口和状态检查
- **🚀 主应用**: `main-app/index.html` - 完整的可视化应用
- **🧪 集成测试**: `test-visualization.html` - 前后端集成测试

## 📍 访问入口

| 入口 | 文件路径 | 描述 |
|------|----------|------|
| 🎯 启动中心 | `START_HERE.html` | 统一入口，状态检查，快速访问 |
| 🚀 主应用 | `main-app/index.html` | 完整的可视化应用界面 |
| 🧪 集成测试 | `test-visualization.html` | 测试前后端数据流 |
| 🔧 后端API | `http://localhost:8000` | RESTful API服务 |
| 📚 API文档 | `http://localhost:8000/docs` | Swagger API文档 |

## 🎨 使用示例

### 1. 主应用使用

1. 打开 `main-app/index.html`
2. 在输入框中输入可视化需求，例如：
   - "正态分布 均值0 标准差1"
   - "二项分布 n=20 p=0.3"
   - "泊松分布 λ=5"
3. 点击"开始生成"按钮
4. 在新窗口中查看交互式可视化

### 2. 集成测试使用

1. 打开 `test-visualization.html`
2. 选择快速示例或输入自定义需求
3. 点击"生成可视化"
4. 查看生成的可视化结果

## 🔧 支持的可视化类型

### 概率分布可视化

- **正态分布**: 支持均值μ和标准差σ参数调节
- **二项分布**: 支持试验次数n和成功概率p参数调节
- **泊松分布**: 支持强度参数λ调节

### 输入格式示例

```
正态分布 均值0 标准差1
正态分布 μ=2 σ=1.5
高斯分布 平均值5 方差2

二项分布 n=20 p=0.3
抛硬币20次正面朝上的概率分布
伯努利试验 成功率30%

泊松分布 λ=5
单位时间内事件发生次数
计数分布
```

## 🌟 核心功能

### ✨ 智能理解
- 自然语言输入解析
- 关键词自动匹配
- 参数智能提取

### 📊 交互式可视化
- Plotly.js动态图表
- 实时参数调节
- 响应式设计

### 🔄 完整数据流
- 前端输入 → API调用 → 后端处理 → HTML生成 → 前端展示
- 错误处理和回退机制
- 状态监控和反馈

## 🛠️ 技术栈

- **前端**: HTML5 + CSS3 + JavaScript + Plotly.js
- **后端**: Python + FastAPI + Uvicorn
- **可视化**: Plotly.js + WebGL
- **样式**: 现代CSS + 响应式设计

## 📁 项目结构

```
AlVisualization/
├── START_HERE.html              # 🎯 启动中心
├── test-visualization.html      # 🧪 集成测试
├── backend-api.py              # 🔧 后端API服务
├── quick-start.sh              # 🚀 快速启动脚本
├── backend-env/                # 📦 Python虚拟环境
└── main-app/                   # 🎨 主应用目录
    ├── index.html              # 主应用入口
    ├── app-fusion.js           # 核心应用逻辑
    ├── components/             # 组件库
    ├── styles/                 # 样式文件
    └── data/                   # 数据和模板
```

## 🔍 故障排除

### 后端服务无法启动

1. 检查Python版本（需要3.7+）
2. 确保虚拟环境正确创建
3. 检查端口8000是否被占用
4. 查看终端错误信息

### 前端无法访问后端

1. 确认后端服务正在运行
2. 检查CORS设置
3. 查看浏览器控制台错误信息

### 可视化生成失败

1. 检查输入格式是否正确
2. 确认关键词匹配成功
3. 查看网络请求状态

## 📞 技术支持

如遇到问题，请检查：

1. **后端状态**: 访问 `http://localhost:8000/health`
2. **API文档**: 访问 `http://localhost:8000/docs`
3. **浏览器控制台**: F12查看错误信息
4. **终端输出**: 查看后端服务日志

---

**最后更新**: 2025-11-05
**版本**: v1.0.0
**状态**: ✅ 可用