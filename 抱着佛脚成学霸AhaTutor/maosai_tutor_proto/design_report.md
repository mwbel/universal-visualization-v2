#Aha 概要设计报告

**版本**: 1.0  
**日期**: 2026-01-13  
**状态**: 原型开发完成 (Prototype Complete)

---

## 1. 引言 (Introduction)

### 1.1 项目背景
本项目旨在构建一个**AI驱动的高中数理学科辅导系统**原型。通过结合大语言模型（DeepSeek）的自然语言处理能力与动态数学可视化引擎，为学生提供一个既能像老师一样对话，又能像实验室一样演示的沉浸式学习环境。

### 1.2 设计目标
- **智能化**: 集成 DeepSeek API，提供准确、启发式的学科问答。
- **可视化**: 将抽象的数学公式（如二次函数、三角变换）转化为可交互的动态图形 可视化教学。
- **沉浸感**: 采用 "Liquid Glass"（液态透明玻璃）UI 设计语言，配合流畅的全局动画和主题切换，提升用户体验。
- **易用性**: 简化的启动流程与直观的交互逻辑。

---

## 2. 总体架构 (System Architecture)

### 2.1 技术栈 (Technology Stack)
- **后端 (Backend)**: Python 3.9+, FastAPI (Web框架), Uvicorn (ASGI服务器).
- **前端 (Frontend)**: 原生 HTML5/CSS3/JavaScript (ES6+).
    - **渲染引擎**: Plotly.js (科学绘图), MathJax (LaTeX公式渲染).
    - **样式**: CSS Variables (主题支持), CSS Animations (动态效果).
- **AI 服务**: DeepSeek API .
- **计算核心**: NumPy (数值计算).

### 2.2 系统逻辑架构
```mermaid
graph TD
    User[用户终端 (Browser)] --> |HTTP/WebSocket| WebServer[FastAPI Server]
    
    subgraph Frontend [前端交互层]
        UI[Liquid Glass UI]
        Viz[Plotly 可视化引擎]
        Logic[App.js 状态管理]
    end
    
    subgraph Backend [后端服务层]
        Router[API路由层]
        MathSvc[数学计算服务]
        AISvc[AI 对话服务]
    end
    
    subgraph External [外部依赖]
        DeepSeek[DeepSeek API]
    end

    User -- 交互 --> UI
    UI -- 事件 --> Logic
    Logic -- 更新视图 --> Viz
    Logic -- 请求数据 --> Router
    Router -- 调用 --> MathSvc
    Router -- 调用 --> AISvc
    AISvc -- 请求 --> DeepSeek
```

---

## 3. 模块设计 (Module Design)

### 3.1 前端交互层 (Frontend)
#### 3.1.1 视觉设计 (Visual Design)
- **设计语言**: Liquid Glass (液态毛玻璃)。深邃的背景配合半透明磨砂质感，强调内容的悬浮感。
- **主题系统**: 
    - **Dark Mode (默认)**: 适合沉浸式学习，背景为动态流转的深色渐变。
    - **Light Mode**: 适合明亮环境，重新调整了玻璃质感与对比度。
    - **动态背景**: CSS Keyframes 实现的 `bgShift` 动画，赋予背景呼吸感。

#### 3.1.2 核心组件
- **登陆页 (Landing Login)**: 全屏沉浸式登陆，带有悬浮卡片动画和 "Unlock your AI Potential" 标语。
- **侧边栏 (Sidebar)**: 
    - 集成品牌 Logo。
    - **Widget 区域**: 时间 (Clock) 与 天气 (Weather) 实时显示。
    - **导航菜单**: 学科分类（数学/物理）与历史记录。
- **全局输入坞 (Input Dock)**:
    - **Home 态**: 居中显示，作为主要入口。
    - **Chat 态**: 通过 CSS 变换 (`transform/transition`) 平滑移动至左侧聊天面板底部，无缝衔接。
- **分屏视图 (Split View)**:
    - **左侧**: AI 聊天窗口，支持 Markdown与LaTeX 渲染。
    - **右侧**: 动态可视化画布，悬浮参数控制器。

### 3.2 后端服务层 (Backend)
#### 3.2.1 目录结构
- [app/main.py](file:///Users/jance/Downloads/maosai_tutor_proto/app/main.py): 应用入口，配置 FastAPI 实例与路由。
- `app/routers/`:
    - `chat.py`: 处理用户对话请求，维护上下文。
    - `math.py`: 提供复杂数学模型的后端计算（如二项分布概率密度）。
- `app/services/ai_service.py`: 封装 **DeepSeek API** 调用，处理鉴权与错误回退。
- `run.py`: 简化的项目启动脚本，自动探测环境并启动 Uvicorn。

#### 3.2.2 核心接口
| 方法 | 路径 | 描述 |
| :--- | :--- | :--- |
| POST | `/chat` | 发送用户消息，获取 AI 回复与视图指令。 |
| GET | `/knowledge/quick_actions` | 获取首页快捷入口数据（JSON）。 |
| GET | `/api/binomial` | 获取二项分布与正态逼近的计算数据。 |

---

## 4. 关键功能特性 (Key Features)

### 4.1 DeepSeek 深度集成
- 替换了原有的 Gemini 模型，使用 `deepseek-chat` 模型。
- 系统角色设定为 "Aha Tutor"，专注于高中理科辅导。

### 4.2 交互式可视化 (Interactive Visualization)
解决了传统的“静态图表”痛点，实现了参数与图形的**实时双向绑定**：
1.  **二次函数**: 拖动 $a, b, c$ 立即看到抛物线开口、顶点移动。
2.  **三角函数**: 调整 $A, \omega, \phi$ 观察正弦波的振幅、周期变化。
3.  **向量运算**: 拖拽向量坐标，实时演示平行四边形面积（叉积几何意义）。
4.  **技术突破**: 
    - 使用 `requestAnimationFrame` 优化 `input` 事件，确保高频拖拽下的流畅度。
    - 解决了分屏切换时的 DOM 尺寸计算问题 (`Plotly.Plots.resize`)。

### 4.3 体验优化
- **无缝流转**: 从首页到进入具体知识点，输入框、背景、布局均有过渡动画，无突兀跳转。
- **实时性**: 前端直接计算简单模型（如二次函数），减少服务器往返延迟；复杂模型（如概率分布）异步请求后端。

---

## 5. 总结与展望 (Conclusion & Future Work)

### 5.1 成果总结
当前版本成功实现了一个具备**高颜值UI**、**真实AI对话能力**和**动态数学实验功能**的原型系统。解决了早期版本的 API 连接问题和可视化渲染 bug，提升了系统的整体可用性。

### 5.2 未来规划
- **知识库增强**: 引入 RAG (检索增强生成) 以支持更精准的教材内容问答。
- **多模态交互**: 支持用户上传题目图片进行识别与解答。
- **用户系统**: 完善数据库存储，保存用户的学习进度与错题本。
- **部署优化**: 容器化 (Docker) 以便于云端部署。
