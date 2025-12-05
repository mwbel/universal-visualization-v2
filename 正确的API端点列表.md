# 🎯 正确的万物可视化API端点列表

基于 http://localhost:8003/docs 实际页面内容

## 📋 **所有实际存在的API端点**

### **1. 系统和健康检查**

#### **根端点**
```
GET /
[GET] Root
```
**用途**: API根端点，返回基本信息
**如何使用**:
- **网页界面**: 点击展开 → "Try it out" → "Execute"
- **命令行**: `curl -X GET http://localhost:8003/`

#### **健康检查**
```
GET /health
[GET] Health Check
```
**用途**: 检查API服务器的健康状态
**如何使用**:
- **网页界面**: 点击展开 → "Try it out" → "Execute"
- **命令行**: `curl -X GET http://localhost:8003/health`

**期望结果**:
```json
{
  "status": "healthy",
  "version": "2.0.0",
  "agents": 5,
  "active_generations": 0,
  "timestamp": "2025-12-03T15:45:06.561481"
}
```

---

### **2. 学科分类系统**

#### **学科分类端点**
```
POST /api/v2/classify
[POST] Classify Visualization Request
```
**用途**: 智能识别用户输入的学科类别
**如何使用**:
- **网页界面**: "Try it out" → 输入请求体 → "Execute"
- **命令行**:
```bash
curl -X POST http://localhost:8003/api/v2/classify \
  -H "Content-Type: application/json" \
  -d '{"prompt": "太阳系内行星轨道运动"}'
```

**请求体**:
```json
{
  "prompt": "你的可视化需求描述"
}
```

**期望结果**:
```json
{
  "subject": "astronomy",
  "confidence": 0.85,
  "all_scores": {
    "mathematics": 0.1,
    "astronomy": 0.85,
    "physics": 0.05
  }
}
```

---

### **3. 生成系统**

#### **3.1 通用生成接口**
```
POST /api/v2/generate
[POST] Universal Generate
通用可视化生成接口 - 方案A核心入口

功能流程：
1. 智能学科识别
2. Agent需求解析
3. 模板匹配
4. 可视化生成
```
**用途**: 支持所有学科的通用可视化生成
**如何使用**:
- **网页界面**: "Try it out" → 输入请求体 → "Execute"
- **命令行**:
```bash
curl -X POST http://localhost:8003/api/v2/generate \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "太阳系内行星轨道运动 地球 火星 木星",
    "template_id": "solar_system",
    "parameters": {
      "planets": ["地球", "火星", "木星"],
      "show_orbits": true
    }
  }'
```

**请求体**:
```json
{
  "prompt": "用户输入的可视化需求",
  "template_id": "可选的模板ID",
  "user_preferences": {
    "theme": "dark"
  },
  "parameters": {
    "具体的可视化参数"
  }
}
```

**期望结果**:
```json
{
  "generation_id": "eff7714d-df2b-4f82-b2e1-5f1f78b889b0",
  "status": "processing",
  "message": "已开始生成可视化，请稍候...",
  "estimated_time": 5,
  "html_url": null
}
```

#### **3.2 茅塞顿开专用生成接口**
```
POST /api/v2/highschool/generate
[POST] Highschool Generate
茅塞顿开专用生成接口 - 高中全科可视化
```
**用途**: 专门针对高中学科的可视化生成
**如何使用**:
- **网页界面**: "Try it out" → 输入请求体 → "Execute"
- **命令行**:
```bash
curl -X POST http://localhost:8003/api/v2/highschool/generate \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "正态分布曲线分析",
    "subject": "mathematics",
    "grade_level": "高中"
  }'
```

**请求体**:
```json
{
  "prompt": "具体的可视化需求",
  "subject": "学科名称",
  "grade_level": "高中",
  "parameters": {}
}
```

#### **3.3 高中学科专用生成**
```
POST /api/v2/highschool/{subject}/generate
[POST] High School Subject Generate
针对特定高中科目的生成接口
```
**用途**: 明确指定高中科目的可视化生成
**如何使用**:
- **网页界面**:
  1. 点击展开端点
  2. 在 `subject` 参数中输入科目代码（如：mathematics、physics）
  3. "Try it out" → 输入请求体 → "Execute"

- **命令行**:
```bash
curl -X POST http://localhost:8003/api/v2/highschool/mathematics/generate \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "二次函数图像",
    "chapter": "函数",
    "difficulty": "中等"
  }'
```

**可用科目**:
- `mathematics` (数学)
- `physics` (物理)
- `chemistry` (化学)
- `biology` (生物)
- `astronomy` (天文)

---

### **4. 状态查询系统**

#### **生成状态查询**
```
GET /api/v2/status/{generation_id}
[GET] Get Generation Status
查询可视化生成的进度和状态
```
**用途**: 检查异步生成任务的进度
**如何使用**:
- **网页界面**: "Try it out" → 输入generation_id → "Execute"
- **命令行**:
```bash
curl -X GET http://localhost:8003/api/v2/status/eff7714d-df2b-4f82-b2e1-5f1f78b889b0
```

**参数**:
- `generation_id`: 从生成接口返回的任务ID

**期望结果**:
```json
{
  "generation_id": "eff7714d-df2b-4f82-b2e1-5f1f78b889b0",
  "status": "completed",
  "progress": 100,
  "html_url": "/api/v2/visualizations/viz_eff7714d",
  "visualization_id": "viz_eff7714d"
}
```

**状态值说明**:
- `processing`: 正在处理中
- `completed`: 生成完成
- `failed`: 生成失败

---

### **5. 结果获取系统**

#### **获取可视化结果**
```
GET /api/v2/visualizations/{viz_id}
[GET] Get Visualization Result
获取生成的可视化HTML内容
```
**用途**: 获取完整的可视化页面内容
**如何使用**:
- **网页界面**: "Try it out" → 输入viz_id → "Execute"
- **命令行**:
```bash
curl -X GET http://localhost:8003/api/v2/visualizations/viz_eff7714d
```

**参数**:
- `viz_id`: 从状态查询接口返回的可视化ID

**期望结果**:
```json
{
  "visualization_id": "viz_eff7714d",
  "html_content": "<html>完整的可视化页面内容</html>",
  "title": "太阳系行星轨道运动",
  "subject": "astronomy",
  "created_at": "2025-12-03T15:21:10.881641"
}
```

---

### **6. 模板管理系统**

#### **6.1 获取所有模板**
```
GET /api/v2/templates
[GET] Get Available Templates
获取所有可用的可视化模板
```
**用途**: 查看系统支持的所有可视化模板
**如何使用**:
- **网页界面**: "Try it out" → "Execute"
- **命令行**:
```bash
curl -X GET http://localhost:8003/api/v2/templates
```

**期望结果**:
```json
{
  "templates": [
    {
      "id": "solar_system",
      "name": "太阳系行星轨道",
      "subject": "astronomy",
      "description": "展示太阳系内行星的运动轨迹",
      "parameters": ["planets", "show_orbits", "animation"]
    },
    {
      "id": "normal_distribution",
      "name": "正态分布曲线",
      "subject": "mathematics",
      "description": "绘制正态分布概率密度函数",
      "parameters": ["mean", "std", "range"]
    }
  ]
}
```

---

### **7. 高中科目系统**

#### **7.1 获取高中科目列表**
```
GET /api/v2/highschool/subjects
[GET] Get High School Subjects
获取支持的高中科目列表
```
**用途**: 查看茅塞顿开系统支持的高中科目
**如何使用**:
- **网页界面**: "Try it out" → "Execute"
- **命令行**:
```bash
curl -X GET http://localhost:8003/api/v2/highschool/subjects
```

**期望结果**:
```json
{
  "subjects": [
    {
      "name": "数学",
      "code": "mathematics",
      "chapters": ["函数", "几何", "概率统计"]
    },
    {
      "name": "物理",
      "code": "physics",
      "chapters": ["力学", "电磁学", "光学"]
    },
    {
      "name": "化学",
      "code": "chemistry",
      "chapters": ["原子结构", "化学反应", "有机化学"]
    }
  ]
}
```

---

### **8. 系统注册和管理**

#### **8.1 系统注册信息**
```
GET /api/v2/registry
[GET] Get System Registry
获取系统组件注册信息
```
**用途**: 查看已加载的Agent和模板信息
**如何使用**:
- **网页界面**: "Try it out" → "Execute"
- **命令行**:
```bash
curl -X GET http://localhost:8003/api/v2/registry
```

**期望结果**:
```json
{
  "agents": {
    "mathematics": {
      "name": "数学Agent",
      "templates": 3,
      "status": "active"
    },
    "astronomy": {
      "name": "天文Agent",
      "templates": 2,
      "status": "active"
    }
  },
  "total_templates": 13,
  "system_version": "2.0.0"
}
```

---

## 🔄 **推荐使用流程**

### **茅塞顿开用户（高中全科）**

1. **查看科目**: `GET /api/v2/highschool/subjects`
2. **直接生成**: `POST /api/v2/highschool/generate`
3. **查询状态**: `GET /api/v2/status/{generation_id}`
4. **获取结果**: `GET /api/v2/visualizations/{viz_id}`

### **通用用户（任意学科）**

1. **健康检查**: `GET /health` (确保服务正常)
2. **学科分类**: `POST /api/v2/classify` (可选，自动识别学科)
3. **查看模板**: `GET /api/v2/templates` (可选，了解可用模板)
4. **发起生成**: `POST /api/v2/generate`
5. **查询状态**: `GET /api/v2/status/{generation_id}`
6. **获取结果**: `GET /api/v2/visualizations/{viz_id}`

## 🧪 **完整测试示例**

### **测试用例1: 太阳系行星运动**
```bash
# 步骤1: 健康检查
curl -X GET http://localhost:8003/health

# 步骤2: 学科分类（可选）
curl -X POST http://localhost:8003/api/v2/classify \
  -H "Content-Type: application/json" \
  -d '{"prompt": "太阳系内行星轨道运动"}'

# 步骤3: 发起生成
curl -X POST http://localhost:8003/api/v2/generate \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "太阳系内行星轨道运动 地球 火星 木星",
    "template_id": "solar_system",
    "parameters": {
      "planets": ["地球", "火星", "木星"],
      "show_orbits": true
    }
  }'

# 步骤4: 查询状态（使用返回的generation_id）
curl -X GET http://localhost:8003/api/v2/status/YOUR_GENERATION_ID

# 步骤5: 获取结果（使用返回的viz_id）
curl -X GET http://localhost:8003/api/v2/visualizations/YOUR_VIZ_ID
```

### **测试用例2: 高中数学正态分布**
```bash
# 步骤1: 查看高中科目
curl -X GET http://localhost:8003/api/v2/highschool/subjects

# 步骤2: 茅塞顿开专用生成
curl -X POST http://localhost:8003/api/v2/highschool/generate \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "正态分布曲线分析 均值0 标准差1",
    "subject": "mathematics",
    "grade_level": "高中",
    "parameters": {
      "mean": 0,
      "std": 1,
      "range": [-3, 3]
    }
  }'

# 步骤3: 查询状态和获取结果
curl -X GET http://localhost:8003/api/v2/status/YOUR_GENERATION_ID
curl -X GET http://localhost:8003/api/v2/visualizations/YOUR_VIZ_ID
```

## 🚨 **常见错误纠正**

### **纠正1: 健康检查端点**
- ❌ 错误: `GET /root` 或 `GET /api/v2/health`
- ✅ 正确: `GET /health`

### **纠正2: 学科分类端点**
- ❌ 错误: `POST /classify`
- ✅ 正确: `POST /api/v2/classify`

### **纠正3: 端点完整性**
- 你的系统同时支持 `/health` 和 `/api/v2/health`
- 两个端点功能相同，都可以用于健康检查

## 💡 **使用建议**

### **新手用户**:
1. 先用健康检查确认服务正常：`GET /health`
2. 使用通用生成接口：`POST /api/v2/generate`
3. 按照提示查询状态和获取结果

### **高中学生**:
1. 查看支持的科目：`GET /api/v2/highschool/subjects`
2. 使用茅塞顿开专用接口：`POST /api/v2/highschool/generate`

### **开发者**:
1. 查看系统组件信息：`GET /api/v2/registry`
2. 了解可用模板：`GET /api/v2/templates`
3. 结合前端应用实现完整工作流

现在你可以对照这个正确的端点列表，在 http://localhost:8003/docs 页面中准确测试所有功能了！