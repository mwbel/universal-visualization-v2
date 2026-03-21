# LLM 配置指南

Concept2Manim 现已支持 LLM 动态生成真实的物理/数学概念动画！

## 当前状态

- ✅ LLM 客户端已集成
- ✅ 支持 Anthropic Claude 和 OpenAI GPT
- ⚠️ 需要配置 API Key

## 配置步骤

### 方案 A: 使用 Anthropic Claude (推荐)

1. 获取 API Key: https://console.anthropic.com/
2. 设置环境变量:
   ```bash
   export ANTHROPIC_API_KEY="your-api-key-here"
   ```
3. 重启服务:
   ```bash
   cd math2manim_service
   python3 app.py
   ```

### 方案 B: 使用 OpenAI GPT

1. 获取 API Key: https://platform.openai.com/
2. 修改 `app.py` 第 46-49 行:
   ```python
   llm_config = LLMConfig(
       provider="openai",  # 改为 openai
       model="gpt-4"       # 使用 gpt-4
   )
   ```
3. 设置环境变量:
   ```bash
   export OPENAI_API_KEY="your-api-key-here"
   ```
4. 重启服务

## 安装依赖

```bash
# 如果使用 Anthropic
pip install anthropic

# 如果使用 OpenAI
pip install openai
```

## 验证配置

访问 http://localhost:8003/health 检查:
- `llm_available`: 应该为 `true`
- `llm_provider`: 应该显示 `anthropic` 或 `openai`

## 功能对比

### 没有 LLM (当前状态)
- ✅ 预定义模板: 偏导数、勾股定理、正弦函数
- ❌ 其他概念: 生成通用几何图形

### 配置 LLM 后
- ✅ 预定义模板: 使用高质量模板
- ✅ 任何概念: AI 动态生成真实的可视化
  - 物理: 牛顿定律、简谐振动、电磁场...
  - 数学: 泰勒级数、傅里叶变换、拓扑...
  - 化学: 分子结构、化学反应...

## 测试

配置完成后，测试生成物理概念:

```bash
curl -X POST http://localhost:8003/generate \
  -H "Content-Type: application/json" \
  -d '{"concept": "牛顿第二定律", "quality": "l", "build_tree": true}'
```

应该生成真实的 F=ma 动画，而不是通用几何图形！
