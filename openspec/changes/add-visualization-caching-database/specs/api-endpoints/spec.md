# API接口规格说明

## ADDED Requirements

### Requirement: 可视化缓存查询接口
系统必须提供高效的缓存查询API，支持多种查询方式和过滤条件。
- **Priority**: High
- **Type**: Functional

#### Scenario: 精确关键词查询
**Given**: 客户端发送POST请求到/api/v2/cache/search
**When**: 请求体包含{"keywords": ["正弦波"], "exact_match": true}
**Then**: 返回精确匹配的可视化记录
**And**: 响应时间 < 50ms

#### Scenario: 语义相似度搜索
**Given**: 客户端发送POST请求到/api/v2/cache/semantic-search
**When**: 请求体包含{"prompt": "画一个波浪形的图", "threshold": 0.7}
**Then**: 返回语义相似的可视化列表
**And**: 包含相似度评分

### Requirement: 缓存管理API
系统必须提供缓存数据的管理和维护接口。
- **Priority**: Medium
- **Type**: Functional

#### Scenario: 缓存数据清理
**Given**: 管理员发送DELETE请求到/api/v2/cache/cleanup
**When**: 请求体包含{"older_than": "30d", "subject": "physics"}
**Then**: 清理30天前的物理学科缓存
**And**: 返回清理记录数量

#### Scenario: 缓存统计信息
**Given**: 客户端发送GET请求到/api/v2/cache/stats
**When**: 查询缓存性能统计
**Then**: 返回命中率、存储使用量、查询性能等指标
**And**: 按时间维度提供历史数据

### Requirement: 文件上传和处理API
系统必须提供完整的文件上传、处理和状态查询接口。
- **Priority**: Medium
- **Type**: Functional

#### Scenario: 多文件上传
**Given**: 客户端发送POST请求到/api/v2/files/upload
**When**: 上传包含图片和文档的multipart/form-data
**Then**: 返回文件ID和处理状态
**And**: 支持进度回调

#### Scenario: 文件处理状态查询
**Given**: 客户端发送GET请求到/api/v2/files/{file_id}/status
**When**: 查询文件处理进度
**Then**: 返回当前状态和进度百分比
**And**: 包含错误信息（如果有）

### Requirement: 基于文件的可视化生成API
系统必须提供基于上传文件内容生成可视化的专用接口。
- **Priority**: Medium
- **Type**: Functional

#### Scenario: 单文件可视化生成
**Given**: 客户端发送POST请求到/api/v2/visualize/from-file
**When**: 请求体包含{"file_id": "uuid", "preferences": {}}
**Then**: 基于文件内容生成可视化
**And**: 返回可视化ID和HTML内容

#### Scenario: 多文件综合分析
**Given**: 客户端发送POST请求到/api/v2/visualize/from-files
**When**: 请求体包含{"file_ids": ["uuid1", "uuid2"]}
**Then**: 综合分析多个文件内容
**And**: 生成相关的可视化集合

## MODIFIED Requirements

### Requirement: 增强现有可视化生成接口
系统必须修改现有的/api/v2/generate接口，集成缓存查询功能。
- **Priority**: High
- **Type**: Functional
- **Modified**: backend-v2的生成流程需要优先查询缓存

#### Scenario: 集成缓存查询流程
**Given**: 客户端调用/api/v2/generate
**When**: 后端接收生成请求
**Then**: 先查询缓存是否有匹配结果
**And**: 缓存未命中才调用MockEngine或LLM

#### Scenario: 返回缓存状态信息
**Given**: 生成请求完成
**When**: 返回生成结果
**Then**: 响应中包含cache_hit字段
**And**: 标示数据来源（cache/mock/llm）

#### Scenario: 缓存自动存储
**Given**: LLM或MockEngine生成新结果
**When**: 生成完成返回给客户端
**Then**: 自动将结果存储到缓存
**And**: 设置合适的过期时间

### Requirement: 扩展高中课程API支持文件输入
系统必须为/api/v2/highschool/generate接口添加文件输入支持。
- **Priority**: Medium
- **Type**: Functional
- **Modified**: 茅塞顿开专用接口需要支持文件输入

#### Scenario: 文件输入处理
**Given**: 高中课程生成请求包含file_id
**When**: 处理课程内容生成
**Then**: 基于文件内容适配高中教材
**And**: 生成符合年级水平的可视化

#### Scenario: 学科识别增强
**Given**: 上传文件包含多个学科内容
**When**: 进行智能学科分类
**Then**: 识别主要学科和相关概念
**And**: 提供学科切换选项

## REMOVED Requirements

无

## API接口定义

### POST /api/v2/cache/search
```python
# 请求体
class CacheSearchRequest(BaseModel):
    keywords: List[str]
    subject: Optional[str] = None
    exact_match: bool = False
    limit: int = 10
    include_expired: bool = False

# 响应体
class CacheSearchResponse(BaseModel):
    success: bool
    total_found: int
    results: List[VisualizationRecord]
    query_time_ms: int
    cache_type: str  # "memory", "redis", "database"
```

### POST /api/v2/files/upload
```python
# 请求体 (multipart/form-data)
# file: 上传的文件
# purpose: 文件用途 "visualization_input" | "reference"
# user_id: 用户ID

# 响应体
class FileUploadResponse(BaseModel):
    success: bool
    file_id: str
    filename: str
    file_type: str
    file_size: int
    processing_status: str
    estimated_processing_time: int  # 秒
```

### POST /api/v2/generate (增强)
```python
# 原有请求体增强
class EnhancedVisualizationRequest(BaseModel):
    prompt: str
    user_preferences: Optional[Dict[str, Any]] = {}
    template_id: Optional[str] = None
    parameters: Optional[Dict[str, Any]] = {}
    file_id: Optional[str] = None  # 新增：支持文件输入
    cache_enabled: bool = True  # 新增：是否启用缓存
    force_regenerate: bool = False  # 新增：强制重新生成

# 响应体增强
class EnhancedGenerationResponse(BaseModel):
    generation_id: str
    status: str
    message: str
    html_content: str
    cache_hit: bool  # 新增：是否缓存命中
    data_source: str  # 新增：数据来源 "cache" | "mock" | "llm"
    processing_time_ms: int
    suggestions: List[str]  # 新增：相关建议
```

## 错误处理

### 标准错误响应格式
```python
class ErrorResponse(BaseModel):
    success: False
    error_code: str
    error_message: str
    details: Optional[Dict[str, Any]] = {}
    timestamp: datetime
    request_id: str
```

### 常见错误码
- `CACHE_NOT_FOUND`: 缓存未找到
- `FILE_TOO_LARGE`: 文件过大
- `UNSUPPORTED_FILE_TYPE`: 不支持的文件类型
- `OCR_PROCESSING_FAILED`: OCR处理失败
- `STORAGE_QUOTA_EXCEEDED`: 存储配额超限
- `INVALID_KEYWORDS`: 无效的关键词
- `DATABASE_ERROR`: 数据库错误

## Performance Requirements

### API响应时间
- **缓存查询**: < 50ms (P95)
- **文件上传响应**: < 200ms
- **OCR处理**: < 5s (1MB图片)
- **语义搜索**: < 100ms
- **管理接口**: < 500ms

### 并发处理能力
- **缓存查询**: 2000 QPS
- **文件上传**: 100 并发
- **可视化生成**: 500 QPS
- **管理操作**: 50 QPS

### 数据传输
- **请求大小限制**: 10MB
- **响应大小限制**: 50MB
- **文件上传限制**: 50MB
- **批量操作限制**: 100个项目

## Security Requirements

### 认证和授权
- **API Key认证**: 所有API需要有效的API密钥
- **用户认证**: 用户相关API需要用户登录
- **权限控制**: 管理接口需要管理员权限
- **请求限流**: 防止API滥用和DDoS攻击

### 数据保护
- **HTTPS传输**: 所有API通信必须使用HTTPS
- **输入验证**: 严格验证所有输入参数
- **敏感数据**: 敏感信息不记录或脱敏处理
- **访问日志**: 记录所有API访问日志