# 🔑 万物可视化 - API密钥配置指南

## 📋 目录
1. [快速开始](#快速开始)
2. [获取API密钥](#获取api密钥)
3. [配置API密钥](#配置api密钥)
4. [测试连接](#测试连接)
5. [常见问题](#常见问题)

---

## 🚀 快速开始

### 方法一：环境变量配置（推荐）

在项目根目录创建 `.env` 文件：

```bash
# Google Gemini
GOOGLE_API_KEY=your-gemini-api-key-here

# OpenAI
OPENAI_API_KEY=your-openai-api-key-here

# 智谱AI (GLM)
ZHIPU_API_KEY=your-glm-api-key-here

# DeepSeek
DEEPSEEK_API_KEY=your-deepseek-api-key-here

# Anthropic Claude
ANTHROPIC_API_KEY=your-anthropic-api-key-here
```

### 方法二：直接修改配置文件

编辑 `custom_llm_config.py` 文件中的 `LLM_CONFIGURATIONS` 字典。

---

## 🔑 获取API密钥

### 1. Google Gemini（免费额度）

1. **访问**: https://makersuite.google.com/app/apikey
2. **登录**: 使用Google账号登录
3. **创建密钥**:
   - 点击 "Create API Key"
   - 复制生成的API密钥
4. **免费额度**: 每天15次请求限制（适合测试）

**文档**: https://ai.google.dev/gemini-api/docs

### 2. OpenAI (GPT-4/ GPT-3.5)

1. **访问**: https://platform.openai.com/api-keys
2. **登录**: 注册或登录OpenAI账号
3. **创建密钥**:
   - 点击 "Create new secret key"
   - 命名密钥（如：万物可视化）
   - 复制密钥（只显示一次！）
4. **充值**: 需要绑定信用卡并充值

**文档**: https://platform.openai.com/docs

### 3. 智谱AI GLM（国产推荐）

1. **访问**: https://open.bigmodel.cn/usercenter/apikeys
2. **注册**: 使用手机号注册
3. **实名认证**: 完成实名认证
4. **创建密钥**:
   - 点击 "创建API Key"
   - 复制密钥
5. **免费额度**: 新用户有免费额度

**文档**: https://open.bigmodel.cn/dev/api

### 4. DeepSeek（高性价比）

1. **访问**: https://platform.deepseek.com/api_keys
2. **注册**: 使用邮箱或手机注册
3. **创建密钥**:
   - 点击 "创建API Key"
   - 复制密钥
4. **价格**: 非常便宜，适合大量使用

**文档**: https://platform.deepseek.com/api-docs/

### 5. Anthropic Claude

1. **访问**: https://console.anthropic.com/settings/keys
2. **注册**: 创建Anthropic账号
3. **创建密钥**:
   - 点击 "Create Key"
   - 选择用途
   - 复制密钥

**文档**: https://docs.anthropic.com/

---

## ⚙️ 配置API密钥

### 步骤1：编辑配置文件

打开项目根目录的 `custom_llm_config.py` 文件，找到第215-255行：

```python
LLM_CONFIGURATIONS = {
    "gpt-4": LLMConfig(
        provider=LLMProvider.OPENAI,
        model_name="gpt-4",
        api_key="your-openai-key",  # 👈 替换这里
        base_url="https://api.openai.com/v1"
    ),

    "gemini-pro": LLMConfig(
        provider=LLMProvider.GOOGLE,
        model_name="gemini-pro",
        api_key="your-gemini-key",  # 👈 替换这里
        base_url="https://generativelanguage.googleapis.com"
    ),

    # ... 更多配置
}
```

### 步骤2：添加你的模型配置

例如，如果你想添加Gemini 1.5 Flash：

```python
"gemini-1.5-flash": LLMConfig(
    provider=LLMProvider.GOOGLE,
    model_name="gemini-1.5-flash",
    api_key="AIzaSy...your-actual-key-here",  # 替换为真实密钥
    base_url="https://generativelanguage.googleapis.com",
    max_tokens=4000,
    temperature=0.7
),
```

### 步骤3：完整配置示例

```python
LLM_CONFIGURATIONS = {
    # Google Gemini - 推荐！
    "gemini-1.5-flash": LLMConfig(
        provider=LLMProvider.GOOGLE,
        model_name="gemini-1.5-flash",
        api_key="AIzaSyxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",  # 你的Gemini密钥
        base_url="https://generativelanguage.googleapis.com"
    ),

    # OpenAI GPT
    "gpt-4o": LLMConfig(
        provider=LLMProvider.OPENAI,
        model_name="gpt-4o",
        api_key="sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",  # 你的OpenAI密钥
        base_url="https://api.openai.com/v1"
    ),

    # 智谱AI GLM
    "glm-4": LLMConfig(
        provider=LLMProvider.GLM,
        model_name="glm-4",
        api_key="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",  # 你的智谱密钥
        base_url="https://open.bigmodel.cn/api/paas/v4"
    ),

    # DeepSeek
    "deepseek-v3": LLMConfig(
        provider=LLMProvider.DEEPSEEK,
        model_name="deepseek-chat",
        api_key="sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",  # 你的DeepSeek密钥
        base_url="https://api.deepseek.com"
    )
}
```

---

## ✅ 测试连接

### 方法1：使用Python脚本测试

创建测试脚本 `test_api_key.py`：

```python
import asyncio
from custom_llm_config import LLMConfig, LLMProvider, get_client

async def test_gemini():
    config = LLMConfig(
        provider=LLMProvider.GOOGLE,
        model_name="gemini-1.5-flash",
        api_key="your-api-key-here"  # 替换为你的密钥
    )

    client = get_client(config)

    # 测试生成
    response = await client.generate_response("你好，请用一句话介绍你自己")
    print(f"✅ Gemini测试成功: {response}")

    # 验证连接
    is_valid = await client.validate_connection()
    print(f"连接状态: {'✅ 有效' if is_valid else '❌ 无效'}")

if __name__ == "__main__":
    asyncio.run(test_gemini())
```

运行测试：

```bash
python3 test_api_key.py
```

### 方法2：在应用中测试

1. 启动后端服务
2. 打开前端 http://localhost:3000
3. 选择对应的模型
4. 发送测试消息："你好"
5. 查看是否正常响应

---

## 🔧 前端模型选择器配置

前端已经配置好所有模型，格式为 `provider:model-id`：

```html
<option value="gemini:gemini-1.5-flash">⚡ Gemini 1.5 Flash</option>
<option value="openai:gpt-4o">🟢 GPT-4o</option>
<option value="glm:glm-4">🟣 GLM-4</option>
<option value="deepseek:deepseek-v3">🔍 DeepSeek V3</option>
```

后端会自动解析这个格式并使用相应的API密钥。

---

## ❓ 常见问题

### Q1: API密钥保存在哪里最安全？

**A**:
- ✅ 推荐：使用环境变量或 `.env` 文件（记得添加到 `.gitignore`）
- ❌ 不推荐：直接硬编码在代码中（可能会被提交到Git）
- ❌ 绝对不要：在前端代码中暴露API密钥

### Q2: 如何检查我的API密钥是否有效？

**A**: 运行上面的测试脚本，或者查看提供商的控制台：
- Gemini: https://makersuite.google.com/app/apikey
- OpenAI: https://platform.openai.com/usage
- 智谱: https://open.bigmodel.cn/usercenter/balance

### Q3: 出现 "API key无效" 错误怎么办？

**A**:
1. 检查密钥是否正确复制（没有多余空格）
2. 检查密钥是否已激活
3. 检查账户是否有余额
4. 检查是否超过了速率限制

### Q4: 可以同时使用多个AI模型吗？

**A**: 可以！配置多个模型的API密钥，前端可以选择切换使用。

### Q5: 哪个AI模型最推荐？

**A**:
- **测试/学习**: Gemini 1.5 Flash（免费，速度快）
- **生产环境**: DeepSeek V3（便宜，效果好）
- **高质量需求**: GPT-4o 或 Claude Sonnet 4.5

### Q6: 本地模型（Mock）是什么？

**A**: Mock模式不调用真实API，返回模拟数据，适合：
- 测试前端界面
- 开发调试
- 无网络环境

### Q7: 如何查看我的API使用量？

**A**: 登录各平台查看：
- Gemini: Google Cloud Console
- OpenAI: Platform Usage
- 智谱: 用户中心 - 账户余额
- DeepSeek: 控制台 - 使用记录

---

## 💡 最佳实践

1. **安全性**:
   - 定期轮换API密钥
   - 为不同项目使用不同密钥
   - 设置每日预算上限

2. **成本控制**:
   - 开发时使用免费的Gemini Flash
   - 生产环境使用性价比高的DeepSeek
   - 设置请求速率限制

3. **容错处理**:
   - 配置多个API提供商作为备份
   - 实现请求重试机制
   - 记录API调用日志

---

## 📞 获取帮助

如果遇到问题：
1. 查看各AI提供商的官方文档
2. 检查后端日志：`backend-v2/logs/app.log`
3. 检查浏览器控制台错误信息
4. 提交Issue到项目仓库

---

## 🎯 快速配置模板

复制以下模板，替换为你的API密钥：

```python
# 在 custom_llm_config.py 中添加

LLM_CONFIGURATIONS = {
    # 🌟 Google Gemini（推荐新手使用 - 免费）
    "gemini-flash": LLMConfig(
        provider=LLMProvider.GOOGLE,
        model_name="gemini-1.5-flash",
        api_key="AIzaSyxxxxxxxxxxxxxxxx",  # 👈 替换这里
        base_url="https://generativelanguage.googleapis.com"
    ),

    # 🟣 智谱AI（国产 - 性价比高）
    "glm-4": LLMConfig(
        provider=LLMProvider.GLM,
        model_name="glm-4",
        api_key="xxxxxxxxxxxxxxxx",  # 👈 替换这里
        base_url="https://open.bigmodel.cn/api/paas/v4"
    ),

    # 🔍 DeepSeek（超便宜）
    "deepseek-chat": LLMConfig(
        provider=LLMProvider.DEEPSEEK,
        model_name="deepseek-chat",
        api_key="sk-xxxxxxxxxxxxxxxx",  # 👈 替换这里
        base_url="https://api.deepseek.com"
    )
}
```

配置完成后，重启后端服务即可使用！

```bash
# 重启后端
cd backend-v2
python3 main.py
```

祝使用愉快！🎉
