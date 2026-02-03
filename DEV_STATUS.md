# 万物可视化 AI - 开发状态报告

**日期**: 2026-02-03
**当前状态**: 🔧 调试中 - LLM 调用未正常工作

---

## 📊 项目架构

### 技术栈
- **前端**: 纯 HTML/CSS/JavaScript (Vanilla JS)
- **后端**: Python FastAPI
- **端口**: 前端 3000, 后端 9999
- **AI 模型**: 支持多提供商（Google Gemini, GLM, OpenAI, DeepSeek, Claude）

### 核心功能
1. **智能路由**: 自动识别学科（数学、物理、天文、化学、生物、通用）
2. **动态生成**: 使用 LLM 实时生成交互式可视化代码
3. **API Key 管理**: 支持多提供商、多 Key 轮值
4. **可视化库**: Plotly.js, Three.js, MathJax

---

## 🔧 最近修复的问题

### ✅ 已修复
1. **GeneralAgent 硬编码 OpenAI 问题** (`backend-v2/agents/general_agent.py:32-41`)
   - 改为使用 `LLM_CONFIGURATIONS` 中第一个可用配置

2. **LLM 提供商支持不完整** (`custom_llm_config.py:296-314`)
   - 添加了对 Google、GLM、DeepSeek 的支持

3. **配置优先级问题** (`custom_llm_config.py:465-485`)
   - 按优先级加载：Google > GLM > DeepSeek > OpenAI > Anthropic
   - 清除旧的预定义配置

4. **前端 API Key 收集问题** (`frontend-v4/js/main.js:1120-1132`)
   - 支持同时收集 input 和 textarea 的 API keys

5. **多行 API Key 格式支持** (`custom_llm_config.py:380-393`)
   - 自动识别并分割换行符分隔的多个 keys

### ⚠️ 当前问题（已找到根本原因！）

**用户报告**: "依然返回模拟数据，而不是真实的 AI 生成可视化"

**🎯 真正的问题**（2026-02-03 03:57 发现）：
```
❌ 路由处理失败: LLM生成失败: Gemini API错误 404:
"models/gemini-1.5-flash is not found for API version v1beta"
```

**根本原因**：配置的 Google Gemini 模型名称不正确！
- ❌ 当前配置（`custom_llm_config.py:427`）: `gemini-1.5-flash`
- ✅ 正确的名称应该是: `gemini-1.5-flash-latest` 或其他有效模型名

**修复方法**：修改 `custom_llm_config.py` 第 427 行的模型名称

---

## 🎯 诊断步骤

### 第一步：检查后端日志
```bash
# 查看最新的后端输出
lsof -ti:9999 | xargs ps -p | grep -v PID
```

**关键日志点**：
- `✅ GeneralAgent 使用配置: xxx` - 确认使用的提供商
- `🤖 GeneralAgent: 调用LLM生成代码...` - 确认发起调用
- `❌ 路由处理失败: xxx` - 查看错误信息

### 第二步：测试 API 调用
```bash
# 测试 Google Gemini API
curl -X POST "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"contents":[{"parts":[{"text":"Hi"}]}]}'
```

### 第三步：检查前端请求
打开浏览器开发者工具 -> Network 标签，查看：
- `/api/v3/chat/message` 请求的响应
- 响应中的 `visualization_html` 字段

---

## 📁 关键文件说明

### 后端文件

#### `backend-v2/main.py`
- **端口**: 9999
- **关键路由**:
  - `POST /api/v3/chat/message` - 主聊天接口
  - `GET /api/v3/settings/api-keys` - 获取 API keys
  - `POST /api/v3/settings/api-keys/batch` - 保存 API keys

#### `backend-v2/agents/general_agent.py`
- **行 27-41**: `__init__()` - 加载 LLM 配置
- **行 82-129**: `generate_visualization()` - 调用 LLM 生成 HTML
- **行 92-112**: System Prompt - 关键的生成指令

#### `custom_llm_config.py`
- **行 11-25**: `LLMProvider` 枚举
- **行 27-47**: `LLMConfig` 配置类
- **行 96-180**: `GoogleGenAIClient` - Google API 客户端
- **行 296-314**: `get_client()` - 客户端工厂函数
- **行 402-488**: `update_llm_configurations_with_api_keys()` - 加载 API keys

#### `backend-v2/agents/router_manager.py`
- **行 42-94**: `classify_subject()` - 学科分类
- **行 96-254**: `route_to_agent()` - 路由到对应 Agent

### 前端文件

#### `frontend-v4/js/main.js`
- **行 1076-1100**: `updateFormWithKeys()` - 显示 API key 状态
- **行 1120-1132**: API key 收集逻辑（支持 input 和 textarea）
- **行 1188-1248**: `saveApiKeys()` - 保存 API keys

---

## 🔍 调试提示

### 检查点 1: LLM 配置是否正确加载
后端启动日志应该显示：
```
✅ 创建配置: gemini-pro (provider=google, model=gemini-1.5-flash)
✅ GeneralAgent 使用配置: gemini-pro
```

### 检查点 2: LLM 调用是否成功
查看日志中的：
```
🤖 GeneralAgent: 调用LLM生成代码... (Prompt: xxx)
```
如果没有后续的错误日志，说明调用可能成功了。

### 检查点 3: 响应格式是否正确
API 响应格式：
```json
{
  "success": true,
  "data": {
    "visualization_html": "<!DOCTYPE html>...",
    "subject": "mathematics",
    "title": "二次函数可视化"
  }
}
```

---

## 💡 建议的修复方向

1. **启用详细日志**: 在 `generate_visualization()` 中添加更多日志
2. **检查前端显示逻辑**: 确认 `visualization_html` 被正确渲染到 iframe
3. **测试简化场景**: 使用简单的 prompt 测试 LLM 是否正常返回
4. **检查 API 余额**: 确认 Google Gemini API key 有可用额度

---

## 🚀 快速启动命令

```bash
# 启动后端
cd backend-v2
PYTHONPATH=/Users/Min369/Documents/同步空间/Manju/Projects/AlVisualization:$PYTHONPATH python3 main.py

# 启动前端
cd frontend-v4
python3 -m http.server 3000

# 访问
open http://localhost:3000
```

---

## 📝 待办事项

- [ ] 确认 Google Gemini API key 是否有可用额度
- [ ] 检查后端日志中的 LLM 调用详情
- [ ] 验证前端是否正确显示返回的可视化 HTML
- [ ] 测试简单的 prompt（如 "画一个圆"）
- [ ] 添加更详细的错误日志和调试信息
