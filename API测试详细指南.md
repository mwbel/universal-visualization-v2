# 🎯 API测试详细指南 - 万物可视化后端

## 📋 API文档访问和理解

### 访问API文档
```
http://localhost:8003/docs
```

这个页面是一个**交互式API文档**，由FastAPI自动生成，包含：
- 📚 所有可用的API端点
- 🔄 请求/响应格式
- 🧪 内置测试功能
- 📋 参数说明

## 🏗️ API工作流程理解

### 核心工作流程

```
用户输入 → 分类 → 生成 → 轮询状态 → 获取可视化 → 展示结果
    ↓         ↓        ↓        ↓          ↓        ↓
  输入文本 → 学科识别 → 后台处理 → 状态检查 → HTML内容 → 最终图表
```

### 1. **健康检查** - 第一步
**目的**: 确认API服务器正常运行
**端点**: `GET /api/v2/health`
**何时使用**: 每次开始测试时

### 2. **学科分类** - 智能识别
**目的**: 识别用户输入属于哪个学科（数学、天文、物理等）
**端点**: `POST /api/v2/classify`
**输入**: 用户输入的文本
**输出**: 学科分类结果

### 3. **发起生成** - 核心功能
**目的**: 开始生成可视化内容
**端点**: `POST /api/v2/generate`
**输入**: 可视化请求
**输出**: 生成任务ID

### 4. **状态轮询** - 进度监控
**目的**: 检查生成任务的进度
**端点**: `GET /api/v2/status/{generation_id}`
**输出**: 任务状态和进度

### 5. **获取结果** - 最终内容
**目的**: 获取生成的可视化HTML内容
**端点**: `GET /api/v2/visualizations/{viz_id}`
**输出**: 完整的可视化页面

## 🧪 详细测试步骤

### 准备工作

```bash
# 1. 确认服务器运行
curl -s http://localhost:8003/api/v2/health

# 2. 查看API文档
open http://localhost:8003/docs
```

### 测试用例1：完整的行星轨道可视化

#### 第1步：健康检查
```bash
# 在浏览器中访问
http://localhost:8003/docs

# 或者在终端中测试
curl -s http://localhost:8003/api/v2/health | jq .
```

**期望结果**:
```json
{
  "status": "healthy",
  "version": "2.0.0",
  "api_version": "v2",
  "agents": 5,
  "active_generations": 0,
  "timestamp": "2025-12-03T15:13:11.251930"
}
```

#### 第2步：学科分类测试

**方法A - 使用API文档网页**:
1. 打开 http://localhost:8003/docs
2. 找到 `POST /api/v2/classify` 端点
3. 点击展开
4. 点击 "Try it out"
5. 在请求体中输入：
```json
{
  "prompt": "太阳系内行星轨道运动 地球 火星 木星"
}
```
6. 点击 "Execute"

**方法B - 使用curl命令**:
```bash
curl -X POST http://localhost:8003/api/v2/classify \
  -H "Content-Type: application/json" \
  -d '{"prompt": "太阳系内行星轨道运动 地球 火星 木星"}'
```

**期望结果**:
```json
{
  "subject": "astronomy",
  "concept": "planetary_orbits",
  "keywords": ["太阳系", "行星", "轨道运动", "地球", "火星", "木星"],
  "confidence": 0.95,
  "template_id": "solar_system"
}
```

#### 第3步：发起可视化生成

**方法A - 使用API文档网页**:
1. 在 http://localhost:8003/docs 中找到 `POST /api/v2/generate`
2. 点击 "Try it out"
3. 输入请求体：
```json
{
  "prompt": "太阳系内行星轨道运动 地球 火星 木星",
  "template_id": "solar_system",
  "parameters": {
    "planets": ["地球", "火星", "木星"],
    "show_orbits": true,
    "animation": true
  }
}
```

**方法B - 使用curl命令**:
```bash
curl -X POST http://localhost:8003/api/v2/generate \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "太阳系内行星轨道运动 地球 火星 木星",
    "template_id": "solar_system",
    "parameters": {
      "planets": ["地球", "火星", "木星"],
      "show_orbits": true,
      "animation": true
    }
  }'
```

**期望结果**:
```json
{
  "generation_id": "gen_123456789_abc",
  "status": "processing",
  "message": "生成任务已开始",
  "estimated_time": 15,
  "subject": "astronomy",
  "template_id": "solar_system"
}
```

**重要**: 保存返回的 `generation_id` 用于下一步查询！

#### 第4步：轮询生成状态

**替换YOUR_GENERATION_ID为上一步返回的ID**

**方法A - 使用API文档网页**:
1. 找到 `GET /api/v2/status/{generation_id}`
2. 点击 "Try it out"
3. 在 `generation_id` 参数中输入你的ID
4. 点击 "Execute"

**方法B - 使用curl命令**:
```bash
# 替换为你的实际generation_id
curl http://localhost:8003/api/v2/status/gen_123456789_abc
```

**期望状态变化**:
1. 第一次调用: `{"status": "processing", "progress": 20}`
2. 第二次调用: `{"status": "processing", "progress": 60}`
3. 最后一次调用: `{"status": "completed", "progress": 100, "visualization_id": "viz_123456789_def"}`

#### 第5步：获取最终可视化结果

**使用第4步返回的visualization_id**

**方法A - 使用API文档网页**:
1. 找到 `GET /api/v2/visualizations/{viz_id}`
2. 点击 "Try it out"
3. 输入你的 `viz_id`
4. 点击 "Execute"

**方法B - 使用curl命令**:
```bash
# 替换为你的实际visualization_id
curl http://localhost:8003/api/v2/visualizations/viz_123456789_def
```

**期望结果**:
```json
{
  "visualization_id": "viz_123456789_def",
  "html_content": "<html>...</html>",
  "title": "太阳系行星轨道运动",
  "subject": "astronomy",
  "created_at": "2025-12-03T15:15:00Z"
}
```

## 🧪 自动化测试脚本

### 完整的自动化测试

创建测试脚本 `test_api_workflow.sh`:

```bash
#!/bin/bash

echo "🚀 开始API工作流测试..."

# 配置
API_BASE="http://localhost:8003/api/v2"
TEST_PROMPT="太阳系内行星轨道运动 地球 火星 木星"

# 步骤1: 健康检查
echo "📡 步骤1: 检查API健康状态"
HEALTH_RESPONSE=$(curl -s "$API_BASE/health")
echo "响应: $HEALTH_RESPONSE"

if echo "$HEALTH_RESPONSE" | grep -q '"status":"healthy"'; then
    echo "✅ API健康检查通过"
else
    echo "❌ API健康检查失败"
    exit 1
fi

# 步骤2: 学科分类
echo "🎯 步骤2: 学科分类"
CLASSIFY_RESPONSE=$(curl -X POST "$API_BASE/classify" \
  -H "Content-Type: application/json" \
  -d "{\"prompt\":\"$TEST_PROMPT\"}")
echo "响应: $CLASSIFY_RESPONSE"

SUBJECT=$(echo "$CLASSIFY_RESPONSE" | grep -o '"subject":"[^"]*' | cut -d'"' -f4)
echo "📚 识别学科: $SUBJECT"

if [ "$SUBJECT" = "astronomy" ]; then
    echo "✅ 学科分类正确"
else
    echo "❌ 学科分类错误"
fi

# 步骤3: 发起生成
echo "🎨 步骤3: 发起可视化生成"
GENERATE_RESPONSE=$(curl -X POST "$API_BASE/generate" \
  -H "Content-Type: application/json" \
  -d "{\"prompt\":\"$TEST_PROMPT\"}")
echo "响应: $GENERATE_RESPONSE"

GEN_ID=$(echo "$GENERATE_RESPONSE" | grep -o '"generation_id":"[^"]*' | cut -d'"' -f4)
echo "📝 生成任务ID: $GEN_ID"

if [ -n "$GEN_ID" ]; then
    echo "✅ 生成任务创建成功"
else
    echo "❌ 生成任务创建失败"
    exit 1
fi

# 步骤4: 轮询状态
echo "⏱️ 步骤4: 轮询生成状态"
for i in {1..10}; do
    echo "🔄 第 $i 次状态检查..."
    STATUS_RESPONSE=$(curl -s "$API_BASE/status/$GEN_ID")
    echo "响应: $STATUS_RESPONSE"

    STATUS=$(echo "$STATUS_RESPONSE" | grep -o '"status":"[^"]*' | cut -d'"' -f4)
    echo "📊 状态: $STATUS"

    if [ "$STATUS" = "completed" ]; then
        echo "🎉 生成完成！"
        VIZ_ID=$(echo "$STATUS_RESPONSE" | grep -o '"visualization_id":"[^"]*' | cut -d'"' -f4)
        echo "🎨 可视化ID: $VIZ_ID"
        break
    elif [ "$STATUS" = "failed" ]; then
        echo "❌ 生成失败"
        echo "$STATUS_RESPONSE"
        exit 1
    fi

    sleep 2
done

# 步骤5: 获取可视化内容
if [ -n "$VIZ_ID" ]; then
    echo "🖼️ 步骤5: 获取可视化内容"
    VIZ_RESPONSE=$(curl -s "$API_BASE/visualizations/$VIZ_ID")
    echo "📄 可视化内容长度: $(echo "$VIZ_RESPONSE" | wc -c)"

    if echo "$VIZ_RESPONSE" | grep -q "html_content"; then
        echo "✅ 成功获取可视化内容"

        # 保存结果到文件
        echo "$VIZ_RESPONSE" | grep -o '"html_content":"[^"]*' | cut -d'"' -f4 | sed 's/\\//g' > result.html
        echo "📁 结果已保存到 result.html"
    else
        echo "❌ 获取可视化内容失败"
    fi
fi

echo "🎊 API工作流测试完成！"
```

### 使用测试脚本

```bash
# 创建测试脚本
cat > test_api_workflow.sh << 'EOF'
#!/bin/bash

echo "🚀 开始API工作流测试..."

API_BASE="http://localhost:8003/api/v2"
TEST_PROMPT="太阳系内行星轨道运动 地球 火星 木星"

# 步骤1: 健康检查
echo "📡 健康检查..."
HEALTH_RESPONSE=$(curl -s "$API_BASE/health")
echo "$HEALTH_RESPONSE"

# 步骤2: 学科分类
echo "🎯 学科分类..."
CLASSIFY_RESPONSE=$(curl -X POST "$API_BASE/classify" \
  -H "Content-Type: application/json" \
  -d "{\"prompt\":\"$TEST_PROMPT\"}")
echo "$CLASSIFY_RESPONSE"

# 步骤3: 发起生成
echo "🎨 发起生成..."
GENERATE_RESPONSE=$(curl -X POST "$API_BASE/generate" \
  -H "Content-Type: application/json" \
  -d "{\"prompt\":\"$TEST_PROMPT\"}")
echo "$GENERATE_RESPONSE"

GEN_ID=$(echo "$GENERATE_RESPONSE" | jq -r '.generation_id')
echo "📝 生成ID: $GEN_ID"

# 步骤4: 轮询状态
for i in {1..10}; do
    echo "🔄 检查状态 $i/10..."
    STATUS_RESPONSE=$(curl -s "$API_BASE/status/$GEN_ID")
    echo "$STATUS_RESPONSE"

    STATUS=$(echo "$STATUS_RESPONSE" | jq -r '.status')
    if [ "$STATUS" = "completed" ]; then
        VIZ_ID=$(echo "$STATUS_RESPONSE" | jq -r '.visualization_id')
        echo "✅ 生成完成，可视化ID: $VIZ_ID"
        break
    fi
    sleep 2
done

# 步骤5: 获取结果
if [ -n "$VIZ_ID" ]; then
    echo "🖼️ 获取可视化..."
    VIZ_RESPONSE=$(curl -s "$API_BASE/visualizations/$VIZ_ID")
    echo "$VIZ_RESPONSE" | jq '.html_content' -r > visualization_result.html
    echo "📁 结果保存到 visualization_result.html"
fi

echo "🎊 测试完成！"
EOF

# 给执行权限并运行
chmod +x test_api_workflow.sh
./test_api_workflow.sh
```

## 🔍 常见问题和调试

### 问题1: API连接失败

**症状**: `curl` 命令超时或连接被拒绝

**解决方法**:
```bash
# 检查服务器是否运行
lsof -i :8003

# 如果没有运行，启动服务器
cd backend-v2
python3 -m uvicorn main:app --host 0.0.0.0 --port 8003 --reload
```

### 问题2: JSON格式错误

**症状**: 返回 "400 Bad Request" 或 "JSON格式错误"

**解决方法**:
```bash
# 验证JSON格式
echo '{"prompt": "测试"}' | jq .

# 使用转义字符处理特殊字符
curl -X POST http://localhost:8003/api/v2/classify \
  -H "Content-Type: application/json" \
  -d "{\"prompt\":\"正态分布 均值0 标准差1\"}"
```

### 问题3: 生成任务超时

**症状**: 长时间 `processing` 状态

**解决方法**:
```bash
# 增加轮询次数和间隔
for i in {1..30}; do  # 从10次增加到30次
    sleep 3           # 从2秒增加到3秒
    # ...
done

# 或者查看服务器日志
tail -f backend-v2/logs/app.log
```

### 问题4: 跨域问题(CORS)

**症状**: 浏览器控制台显示CORS错误

**解决方法**:
```bash
# 检查后端CORS配置
grep -A 10 CORSMiddleware backend-v2/main.py

# 确保允许前端域名
allow_origins=["*"]
```

## 📊 更多测试用例

### 测试用例2: 数学函数可视化

```bash
# 正态分布测试
curl -X POST http://localhost:8003/api/v2/generate \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "正态分布 均值0 标准差1",
    "parameters": {
      "mean": 0,
      "std": 1,
      "range": [-3, 3]
    }
  }'
```

### 测试用例3: 物理运动可视化

```bash
# 抛体运动测试
curl -X POST http://localhost:8003/api/v2/generate \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "45度角抛体运动 初速度20m/s",
    "parameters": {
      "angle": 45,
      "initial_velocity": 20,
      "gravity": 9.8
    }
  }'
```

## 🎯 最佳实践建议

### 1. 开发时使用API文档网页
- 网址: http://localhost:8003/docs
- 优点: 界面友好，有示例和文档
- 适合: 调试和探索API

### 2. 自动化测试使用curl脚本
- 优点: 可重复，可集成到CI/CD
- 适合: 回归测试和批量测试

### 3. 生产环境使用编程语言客户端
- Python: `requests` 库
- JavaScript: `fetch` API
- 适合: 集成到应用中

### 4. 监控和日志
- 使用 `/health` 端点监控服务状态
- 检查后端日志排查问题
- 监控生成任务的完成时间

## 🎊 总结

通过这个详细的API测试指南，你可以：

1. **理解API流程**: 从健康检查到最终获取可视化结果
2. **掌握测试方法**: 使用API文档网页和命令行工具
3. **自动化测试**: 运行完整的测试脚本
4. **调试问题**: 快速定位和解决常见问题

现在你可以自信地测试和理解整个可视化生成流程了！