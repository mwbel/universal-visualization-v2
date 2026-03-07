# 茅塞顿开 (Maosai Tutor) · 全学科智能家教原型

这是一个基于 **FastAPI + Vanilla JS/CSS** 构建的高中全学科（数学、物理、化学）智能家教原型系统。

核心理念是**“程序级可交互可视化”**：左侧提供 AI 引导式对话，右侧提供可交互的动态图形，帮助学生直观理解抽象概念。

## ✨ 核心特性

### 1. 沉浸式 UI (Liquid Glass)
- 采用现代化的**玻璃拟态 (Glassmorphism)** 设计风格。
- 动态背景与环境光效，提供专注于学习的沉浸体验。
- 集成实时时钟与天气组件（UI 演示）。

### 2. 多学科可视化引擎
系统内置了基于 Plotly.js 的高性能交互可视化模组，支持参数实时调整：
- **数学 (Mathematics)**
  - **一元二次不等式/函数**：拖动 $a, b, c$ 参数，直观观察抛物线开口、顶点及与 x 轴交点的变化。
  - **三角函数变换**：调节 $A, \omega, \varphi, k$ 理解振幅、周期、初相和平移。
  - **向量几何**：通过拖动向量端点，演示向量叉积与平行四边形面积（行列式）的几何意义。
  - **概率统计**：二项分布 $B(n,p)$ 随 $n$ 增大向正态分布收敛的动态演示。
- **物理 (Physics)**
  - **平抛运动**：速度分解与轨迹模拟（原型）。
- **化学 (Chemistry)**
  - **化学平衡**：浓度与平衡常数 $K$ 的响应关系（原型）。

### 3. AI 智能辅导 (Prototype)
- **快捷指令 (Quick Actions)**：针对特定知识点（如“必修一向量”）的一键启动预设场景。
- **双屏协同**：左屏聊天窗口与右屏可视化视图联动。AI 输出不仅是文字，还可以包含 `ViewSpec` 指令来控制右侧图形。

## 🛠️ 技术栈
- **后端**: Python 3.10+, FastAPI, Uvicorn
- **前端**: HTML5, CSS3 (Variables, Flexbox/Grid), Vanilla JavaScript
- **可视化**: Plotly.js
- **模板引擎**: Jinja2

## 🚀 快速开始

### 1. 环境准备
确保已安装 Python 3.8 或以上版本。

```bash
# 克隆项目（如果尚未下载）
# git clone ...

# 创建虚拟环境
python -m venv .venv

# 激活虚拟环境
# macOS / Linux:
source .venv/bin/activate
# Windows:
# .venv\Scripts\activate
```

### 2. 安装依赖
```bash
pip install -r requirements.txt
```

### 3. 运行服务
```bash
uvicorn app.main:app --reload
```
终端显示 `Application startup complete.` 后，在浏览器访问：
👉 `http://127.0.0.1:8000`

## 📂 项目结构
```
.
├── app
│   ├── main.py              # FastAPI 主程序入口，路由与数据定义
│   ├── models.py            # Pydantic 数据模型
│   ├── routers/             # [规划中] 路由模块
│   ├── static
│   │   ├── app.css          # 全局样式（Liquid Glass 主题）
│   │   └── app.js           # 前端逻辑、Plotly 绘图控制、API 通信
│   └── templates
│       └── index.html       # 单页应用入口模板
├── requirements.txt         # Python 依赖列表
└── README.md                # 项目说明文档
```

## 🗓️ 待开发/规划中
- [ ] **接入真实 LLM API**：将当前的规则/Mock 对话替换为 Gemini/OpenAI API 调用。
- [ ] **更多可视化模型**：增加物理力学分析、立体几何交互等。
- [ ] **用户系统完善**：持久化学习记录与偏好设置。
