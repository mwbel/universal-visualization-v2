# 万物可视化 v2.0 API 文档

## 概述

万物可视化 v2.0 API 提供了完整的智能可视化生成平台，支持多学科的可视化生成和现代聊天界面。

## API 版本

### v2 API - 原始可视化API
传统的RESTful API，专注于可视化生成功能。

### v3 API - 现代聊天界面API
新的聊天界面API，提供完整的对话管理和用户体验功能。

## 基础信息

- **基础URL**: `http://localhost:9999`
- **认证方式**: Bearer Token (v3 API)
- **内容类型**: `application/json`
- **响应格式**: JSON

---

# v3 API - 现代聊天界面

## 聊天接口 `/api/v3/chat`

### 创建对话
```http
POST /api/v3/chat/conversations
Content-Type: application/json

{
  "title": "新对话标题",
  "settings": {}
}
```

### 获取对话列表
```http
GET /api/v3/chat/conversations?page=1&page_size=20
```

### 发送消息
```http
POST /api/v3/chat/message
Content-Type: application/json

{
  "conversation_id": "对话ID或null",
  "message": "用户消息内容",
  "stream": false,
  "user_preferences": {},
  "generate_visualization": true
}
```

### 搜索对话
```http
POST /api/v3/chat/search
Content-Type: application/json

{
  "query": "搜索关键词",
  "page": 1,
  "page_size": 20,
  "filters": {}
}
```

### 获取快速操作
```http
GET /api/v3/chat/quick-actions
```

## 文件管理 `/api/v3/files`

### 上传文件
```http
POST /api/v3/files/upload
Content-Type: multipart/form-data

file: [文件]
```

### 获取文件列表
```http
GET /api/v3/files/list?category=image&limit=100
```

### 下载文件
```http
GET /api/v3/files/download/{file_id}
```

### 处理文件
```http
POST /api/v3/files/process
Content-Type: application/json

{
  "file_id": "文件ID",
  "processing_type": "extract_text",
  "parameters": {}
}
```

## 用户管理 `/api/v3/user`

### 获取用户信息
```http
GET /api/v3/user/me
Authorization: Bearer {token}
```

### 更新用户偏好
```http
PUT /api/v3/user/preferences
Authorization: Bearer {token}
Content-Type: application/json

{
  "theme": "dark",
  "language": "zh-CN",
  "auto_save": true
}
```

### 创建API密钥
```http
POST /api/v3/user/api-keys
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "我的API密钥",
  "permissions": ["read", "write"]
}
```

### 获取使用统计
```http
GET /api/v3/user/stats
Authorization: Bearer {token}
```

---

# v2 API - 原始可视化API

## 核心端点

### 通用可视化生成
```http
POST /api/v2/generate
Content-Type: application/json

{
  "prompt": "用户输入的可视化需求",
  "user_preferences": {},
  "template_id": null,
  "parameters": {}
}
```

### 学科分类
```http
POST /api/v2/classify
Content-Type: application/json

{
  "prompt": "需要分类的文本"
}
```

### 获取模板列表
```http
GET /api/v2/templates
```

### 获取生成状态
```http
GET /api/v2/status/{generation_id}
```

## 茅塞顿开专用API

### 高中全科可视化生成
```http
POST /api/v2/highschool/generate
Content-Type: application/json

{
  "prompt": "用户输入的自然语言描述",
  "grade_level": "high_school",
  "subject": "mathematics",
  "interaction_mode": "visualization",
  "user_preferences": {}
}
```

---

# 数据模型

## 消息模型
```json
{
  "id": "消息ID",
  "role": "user|assistant|system",
  "content": "消息内容",
  "timestamp": "2024-01-01T00:00:00Z",
  "metadata": {}
}
```

## 对话模型
```json
{
  "id": "对话ID",
  "title": "对话标题",
  "messages": [消息数组],
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-01T00:00:00Z",
  "metadata": {},
  "settings": {}
}
```

## 可视化响应
```json
{
  "success": true,
  "subject": "mathematics",
  "generation_id": "生成ID",
  "visualization": {
    "type": "chart",
    "title": "可视化标题",
    "html_content": "HTML内容",
    "interactive_elements": [],
    "config": {}
  },
  "metadata": {}
}
```

## 文件信息
```json
{
  "id": "文件ID",
  "filename": "文件名",
  "original_filename": "原始文件名",
  "file_type": "image|document|data",
  "category": "文件分类",
  "file_size": 1024,
  "mime_type": "image/png",
  "upload_time": "2024-01-01T00:00:00Z",
  "url": "/api/v3/files/download/文件ID",
  "metadata": {}
}
```

---

# 错误处理

## 标准错误响应
```json
{
  "detail": "错误描述",
  "status_code": 400,
  "error_type": "ValidationError"
}
```

## 常见错误码

- `400` - 请求参数错误
- `401` - 认证失败
- `403` - 权限不足
- `404` - 资源不存在
- `429` - 请求过于频繁
- `500` - 服务器内部错误

---

# 使用示例

## JavaScript 客户端示例

```javascript
// 发送聊天消息
async function sendMessage(message, conversationId = null) {
  const response = await fetch('/api/v3/chat/message', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      conversation_id: conversationId,
      message: message,
      stream: false,
      generate_visualization: true
    })
  });

  const result = await response.json();
  return result;
}

// 上传文件
async function uploadFile(file) {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch('/api/v3/files/upload', {
    method: 'POST',
    body: formData
  });

  const result = await response.json();
  return result;
}
```

## Python 客户端示例

```python
import requests
import json

# 发送聊天消息
def send_message(message, conversation_id=None):
    url = "http://localhost:9999/api/v3/chat/message"
    data = {
        "conversation_id": conversation_id,
        "message": message,
        "generate_visualization": True
    }

    response = requests.post(url, json=data)
    return response.json()

# 上传文件
def upload_file(file_path):
    url = "http://localhost:9999/api/v3/files/upload"

    with open(file_path, 'rb') as f:
        files = {'file': f}
        response = requests.post(url, files=files)

    return response.json()
```

---

# 配置选项

## 用户偏好设置
- `theme`: `light` | `dark` | `auto`
- `language`: 语言代码 (如 `zh-CN`, `en-US`)
- `font_size`: `small` | `medium` | `large`
- `auto_save`: 自动保存对话

## 可视化设置
- `default_chart_style`: `modern` | `classic` | `minimal`
- `color_scheme`: `default` | `dark` | `colorful`
- `animation_speed`: `slow` | `medium` | `fast`
- `export_format`: `html` | `png` | `svg`

## 模型设置
- `preferred_model`: 首选模型名称
- `temperature`: 0.0-2.0 (创造性参数)
- `max_tokens`: 100-8000 (最大令牌数)
- `response_style`: `concise` | `balanced` | `detailed`

---

# 更新日志

## v2.0.0
- 集中式路由架构
- 多学科智能识别
- 模板引擎系统
- 茅塞顿开高中教育版

## v3.0.0
- 现代聊天界面API
- 会话管理系统
- 文件上传支持
- 用户配置管理
- API认证机制

---

# 技术支持

如有问题或建议，请联系开发团队或查看项目文档。