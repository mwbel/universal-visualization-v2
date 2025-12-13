# 数据库系统设计文档（本地+Web API混合架构）

## 1. 数据库架构设计 - 本地优先，API增强

### 1.1 主数据库 Schema (SQLite本地存储)

**核心设计原则**：
- **SQLite本地数据库**：桌面应用唯一数据存储，完全本地化
- **离线优先设计**：Mock引擎数据处理完全基于本地SQLite
- **API结果缓存**：LLM API调用结果自动存储到SQLite，支持离线复用
- **智能路由决策**：基于本地数据分析决定是否需要API调用

```sql
-- 用户表
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    preferences JSONB DEFAULT '{}',
    usage_stats JSONB DEFAULT '{}'
);

-- 可视化模板表
CREATE TABLE visualization_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(200) NOT NULL,
    description TEXT,
    subject VARCHAR(50) NOT NULL, -- mathematics, physics, chemistry, etc.
    category VARCHAR(100), -- 具体分类如 probability, algebra
    difficulty_level VARCHAR(20), -- elementary, intermediate, advanced
    keywords TEXT[], -- 关键词数组
    template_content TEXT, -- HTML模板内容
    parameters JSONB, -- 模板参数定义
    examples TEXT[], -- 示例输入
    usage_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 可视化生成记录表
CREATE TABLE visualization_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    prompt TEXT NOT NULL,
    normalized_keywords TEXT[], -- 标准化后的关键词
    subject VARCHAR(50),
    template_id UUID REFERENCES visualization_templates(id),
    generation_source VARCHAR(20), -- 'mock', 'llm', 'template'
    html_content TEXT,
    parameters_used JSONB, -- 实际使用的参数
    file_references JSONB, -- 关联的文件信息
    generation_time_ms INTEGER,
    cache_hit BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP, -- 缓存过期时间
    metadata JSONB -- 其他元数据
);

-- 文件上传表
CREATE TABLE uploaded_files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    filename VARCHAR(255) NOT NULL,
    original_filename VARCHAR(255),
    file_type VARCHAR(50), -- 'image', 'markdown', 'pdf'
    mime_type VARCHAR(100),
    file_size INTEGER,
    file_path VARCHAR(500),
    extracted_content TEXT, -- OCR或解析后的文本内容
    content_vector VECTOR(1536), -- 内容向量embeddings
    upload_purpose VARCHAR(100), -- 'visualization_input', 'reference'
    processing_status VARCHAR(20) DEFAULT 'pending', -- pending, processing, completed, failed
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB
);

-- 关键词索引表
CREATE TABLE keyword_index (
    keyword VARCHAR(100) PRIMARY KEY,
    subject VARCHAR(50),
    usage_frequency INTEGER DEFAULT 1,
    last_used TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    related_keywords TEXT[],
    vector_embedding VECTOR(1536)
);

-- 用户反馈表
CREATE TABLE user_feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    visualization_id UUID REFERENCES visualization_records(id),
    user_id UUID REFERENCES users(id),
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    feedback_text TEXT,
    improvement_suggestions TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ========== 本地+API混合架构专用表 ==========

-- Mock本地引擎模板表（核心离线功能）
CREATE TABLE mock_templates (
    id TEXT PRIMARY KEY, -- 对应MockEngine的策略ID
    name TEXT NOT NULL,
    category TEXT,
    subject TEXT,
    template_content TEXT,
    parameters_schema TEXT, -- JSON格式的参数定义
    is_system_template BOOLEAN DEFAULT FALSE,
    usage_count INTEGER DEFAULT 0,
    last_used TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 智能路由规则表（决定是否需要API调用）
CREATE TABLE intelligent_routing_rules (
    id TEXT PRIMARY KEY,
    rule_name TEXT NOT NULL,
    condition_pattern TEXT, -- 匹配模式（正则表达式或关键词列表）
    complexity_threshold REAL DEFAULT 0.7, -- 复杂度阈值，超过则调用API
    preferred_engine TEXT CHECK(preferred_engine IN ('mock', 'api', 'hybrid')),
    priority INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- LLM API调用缓存表（避免重复API调用，节省成本）
CREATE TABLE llm_api_cache (
    id TEXT PRIMARY KEY,
    prompt_hash TEXT UNIQUE, -- 提示词的MD5哈希，用于去重
    original_prompt TEXT,
    normalized_keywords TEXT, -- 标准化后的关键词
    api_provider TEXT, -- 'openai', 'claude', 'baidu', 'local'
    model_name TEXT,
    response_content TEXT, -- API返回的可视化内容
    response_metadata TEXT, -- JSON格式，包含token使用、耗时、成本等
    cache_expires_at TIMESTAMP, -- 缓存过期时间
    hit_count INTEGER DEFAULT 0, -- 命中次数
    last_hit TIMESTAMP, -- 最后命中时间
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- API调用历史记录表（用于成本控制和性能分析）
CREATE TABLE api_usage_history (
    id TEXT PRIMARY KEY,
    session_id TEXT,
    user_prompt TEXT,
    api_provider TEXT,
    model_name TEXT,
    request_type TEXT, -- 'generation', 'enhancement', 'analysis'
    input_tokens INTEGER,
    output_tokens INTEGER,
    total_cost DECIMAL(10,6), -- API调用成本
    response_time_ms INTEGER,
    cache_hit BOOLEAN DEFAULT FALSE, -- 是否命中缓存
    success BOOLEAN,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 智能模式配置表（用户可配置的行为）
CREATE TABLE hybrid_mode_config (
    id TEXT PRIMARY KEY DEFAULT 'global_config',
    default_mode TEXT CHECK(default_mode IN ('mock_only', 'api_enhanced', 'intelligent_hybrid')) DEFAULT 'intelligent_hybrid',
    auto_api_threshold REAL DEFAULT 0.7, -- 自动调用API的阈值
    api_budget_daily DECIMAL(10,2) DEFAULT 10.00, -- 每日API预算
    cache_ttl_days INTEGER DEFAULT 30, -- 缓存有效期
    offline_mode BOOLEAN DEFAULT FALSE, -- 强制离线模式
    api_providers TEXT, -- JSON格式的API提供商配置
    api_keys_encrypted TEXT, -- 加密的API密钥
    cost_optimization TEXT, -- JSON格式的成本优化策略
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 智能使用分析表（用于优化路由决策）
CREATE TABLE usage_analytics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date DATE,
    hour INTEGER, -- 小时粒度分析
    mode_used TEXT, -- 'mock', 'api', 'cached'
    operation_type TEXT, -- 'generation', 'file_processing', 'search'
    input_complexity REAL, -- 输入复杂度评分
    response_time_ms INTEGER,
    cache_hit BOOLEAN,
    user_satisfaction INTEGER CHECK(user_satisfaction BETWEEN 1 AND 5),
    api_cost DECIMAL(10,6), -- API成本（0为本地处理）
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 本地文件处理记录表（文件上传和处理历史）
CREATE TABLE local_file_processing (
    id TEXT PRIMARY KEY,
    session_id TEXT,
    original_filename TEXT,
    local_file_path TEXT,
    file_type TEXT, -- 'image', 'pdf', 'markdown', 'txt'
    file_size INTEGER,
    ocr_extracted_text TEXT, -- OCR提取的文字
    content_analysis TEXT, -- JSON格式的内容分析结果
    processing_mode TEXT, -- 'mock_only', 'api_enhanced'
    matched_template_ids TEXT, -- JSON数组，匹配的模板ID
    api_enhancement_result TEXT, -- API增强结果（如果有）
    processing_time_ms INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 用户偏好和学习表（系统学习用户习惯，优化路由）
CREATE TABLE user_preferences_learning (
    id TEXT PRIMARY KEY DEFAULT 'desktop_user',
    preferred_complexity_threshold REAL DEFAULT 0.7, -- 用户偏好的复杂度阈值
    api_sensitivity_level INTEGER CHECK(api_sensitivity_level BETWEEN 1 AND 5), -- API使用敏感度
    subject_preferences TEXT, -- JSON格式的学科偏好
    visualization_style_preferences TEXT, -- JSON格式的可视化风格偏好
    learning_data TEXT, -- JSON格式的学习数据
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 1.2 索引设计 - SQLite优化版

```sql
-- 原有表的核心索引
CREATE INDEX idx_visualization_records_subject ON visualization_records(subject);
CREATE INDEX idx_visualization_records_created_at ON visualization_records(created_at DESC);
CREATE INDEX idx_visualization_records_cache_active ON visualization_records(cache_hit, expires_at) WHERE expires_at > CURRENT_TIMESTAMP;

CREATE INDEX idx_templates_subject_category ON visualization_templates(subject, category);
CREATE INDEX idx_files_content_type ON uploaded_files(file_type, created_at DESC);

-- ========== 混合架构专用索引 ==========

-- Mock引擎索引
CREATE INDEX idx_mock_templates_category ON mock_templates(category, is_active);
CREATE INDEX idx_mock_templates_usage ON mock_templates(usage_count DESC);
CREATE INDEX idx_mock_rules_priority ON mock_rendering_rules(template_id, priority DESC);

-- LLM缓存索引（性能关键）
CREATE INDEX idx_llm_cache_hash ON llm_response_cache(prompt_hash);
CREATE INDEX idx_llm_cache_expires ON llm_response_cache(cache_expires_at);
CREATE INDEX idx_llm_cache_provider ON llm_response_cache(llm_provider, hit_count DESC);
CREATE INDEX idx_llm_cache_created ON llm_response_cache(created_at DESC);

-- 历史记录索引
CREATE INDEX idx_llm_history_session ON llm_generation_history(session_id, created_at DESC);
CREATE INDEX idx_llm_history_mode ON llm_generation_history(generation_mode, created_at DESC);
CREATE INDEX idx_llm_history_quality ON llm_generation_history(quality_score DESC);

-- 统计和分析索引
CREATE INDEX idx_stats_date ON hybrid_usage_stats(date, mode_used);
CREATE INDEX idx_sessions_start ON user_sessions(session_start DESC);

-- ========== SQLite特定优化 ==========

-- 全文搜索支持（SQLite FTS5）
CREATE VIRTUAL TABLE IF NOT EXISTS content_search USING fts5(
    content,
    keywords,
    category,
    content='llm_generation_history',
    content_rowid='rowid'
);

-- 虚拟表：缓存命中率统计
CREATE VIRTUAL TABLE IF NOT EXISTS cache_stats USING fts5(
    prompt_hash,
    hit_count,
    created_at,
    content='llm_response_cache',
    content_rowid='rowid'
);

-- ========== 自动触发器 ==========

-- 自动更新时间戳
CREATE TRIGGER IF NOT EXISTS update_templates_timestamp
BEFORE UPDATE ON mock_templates
FOR EACH ROW
BEGIN
    UPDATE mock_templates SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS update_config_timestamp
BEFORE UPDATE ON hybrid_mode_config
FOR EACH ROW
BEGIN
    UPDATE hybrid_mode_config SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- 自动维护使用统计
CREATE TRIGGER IF NOT EXISTS increment_template_usage
AFTER UPDATE ON mock_templates
WHEN NEW.usage_count > OLD.usage_count
BEGIN
    INSERT OR REPLACE INTO hybrid_usage_stats
    (date, mode_used, operation_type, response_time_ms, success)
    VALUES (date('now'), 'mock', 'template_usage', 1, TRUE);
END;

-- 自动清理过期缓存
CREATE TRIGGER IF NOT EXISTS cleanup_expired_cache
AFTER INSERT ON llm_response_cache
BEGIN
    DELETE FROM llm_response_cache
    WHERE cache_expires_at < datetime('now', '-7 days')
      AND id != NEW.id;
END;
```

## 2. 向量数据库设计 - 本地优先策略

### 2.1 桌面应用向量搜索方案

**方案优先级**：
1. **SQLite FTS5 + 本地Embeddings**: 桌面应用首选，零依赖
2. **ChromaDB**: 本地向量数据库，Python生态友好
3. **Qdrant Cloud**: 云端向量数据库，Web应用备选

### 2.2 本地向量搜索实现

```python
# 基于SQLite的混合向量搜索
class HybridVectorSearch:
    """桌面应用混合向量搜索方案"""

    def __init__(self, db_connection):
        self.db = db_connection
        self.embedding_model = None  # 本地加载的embedding模型

    async def local_embedding_search(self, query: str, limit: int = 5):
        """本地向量相似度搜索"""
        # 1. 生成查询向量
        query_vector = await self._generate_embedding(query)

        # 2. 从数据库获取已存储的向量
        cursor = self.db.execute("""
            SELECT id, content, keywords, vector_embedding
            FROM llm_generation_history
            WHERE vector_embedding IS NOT NULL
            ORDER BY created_at DESC
            LIMIT 1000
        """)

        # 3. 本地计算余弦相似度
        results = []
        for row in cursor.fetchall():
            stored_vector = json.loads(row['vector_embedding'])
            similarity = self._cosine_similarity(query_vector, stored_vector)
            results.append({
                'id': row['id'],
                'content': row['content'],
                'similarity': similarity
            })

        # 4. 返回最相似的结果
        return sorted(results, key=lambda x: x['similarity'], reverse=True)[:limit]

    def _cosine_similarity(self, vec1, vec2):
        """计算余弦相似度"""
        import numpy as np
        vec1, vec2 = np.array(vec1), np.array(vec2)
        return np.dot(vec1, vec2) / (np.linalg.norm(vec1) * np.linalg.norm(vec2))

# FTS5全文搜索配置
fts5_config = """
-- 创建全文搜索虚拟表
CREATE VIRTUAL TABLE IF NOT EXISTS content_search USING fts5(
    prompt,
    generated_content,
    keywords,
    subject,
    tokenize = 'unicode61 remove_diacritics 1'
);

-- 插入触发器：自动维护搜索索引
CREATE TRIGGER IF NOT EXISTS update_search_index
AFTER INSERT ON llm_generation_history
BEGIN
    INSERT INTO content_search(rowid, prompt, generated_content, keywords, subject)
    VALUES (NEW.id, NEW.user_prompt, NEW.generated_content, NEW.input_parameters, NEW.llm_provider);
END;

-- 高效的全文搜索查询
SELECT llm_generation_history.*,
       bm25(content_search) as relevance_score
FROM content_search
JOIN llm_generation_history ON llm_generation_history.id = content_search.rowid
WHERE content_search MATCH ?
ORDER BY relevance_score DESC
LIMIT 10;
"""
```

### 2.3 云端向量数据库集成 (可选)

```python
# Qdrant Cloud集成配置
qdrant_config = {
    "collections": {
        "keywords": {
            "vectors": {
                "size": 1536,
                "distance": "Cosine"
            },
            "payload_schema": {
                "keyword": "keyword",
                "subject": "keyword",
                "frequency": "integer",
                "category": "keyword"
            }
        },
        "visualizations": {
            "vectors": {
                "size": 1536,
                "distance": "Cosine"
            },
            "payload_schema": {
                "id": "keyword",
                "subject": "keyword",
                "template_type": "keyword",
                "keywords": "array",
                "created_at": "integer"
            }
        }
    }
}
```

## 3. 缓存策略设计 - 桌面应用优化

### 3.1 桌面应用多级缓存架构

```
L1 Cache (应用内存) - 热点数据，应用生命周期
├── 当前会话的可视化结果 (10MB)
├── 高频Mock模板和规则 (20MB)
├── 最近LLM调用的响应缓存 (15MB)
└── 用户偏好和配置数据 (5MB)

L2 Cache (SQLite内存映射) - 温数据，持久化
├── 关键词FTS5索引和搜索结果 (100MB)
├── 向量相似度计算的缓存 (200MB)
├── Mock引擎的渲染结果缓存 (150MB)
└── 文件处理和OCR结果 (50MB)

L3 Cache (磁盘存储) - 冷数据，长期保存
├── 所有历史可视化记录 (可压缩)
├── 用户上传的原始文件 (可归档)
├── 系统使用统计和分析数据
└── 备份和恢复数据
```

### 3.2 桌面应用缓存管理策略

#### 缓存更新策略
- **Write-Through**: 数据写入时同步更新SQLite缓存
- **Cache-Aside**: 查询时优先检查内存缓存，未命中查询SQLite
- **智能预加载**: 根据用户使用模式预加载相关数据
- **LRU淘汰**: 内存缓存满时自动淘汰最久未使用数据

#### 桌面应用特有策略
- **启动时预热**: 应用启动时加载高频使用的数据
- **后台同步**: 网络可用时在后台同步云端数据
- **压缩存储**: 历史数据自动压缩，节省磁盘空间
- **增量备份**: 只备份变更的数据，提高备份效率

## 4. API 接口设计 - 本地+API混合架构

### 4.1 智能路由核心服务

```python
class IntelligentRoutingService:
    """智能路由服务 - 决定使用本地Mock还是API调用"""

    def __init__(self, db_connection, config_manager):
        self.db = db_connection
        self.config = config_manager
        self.mock_engine = MockEngine()  # 本地引擎，完全离线
        self.api_client = APIClient()    # API客户端，需要网络
        self.cache_manager = LocalCacheManager(db_connection)

    async def intelligent_generate(self, prompt: str, user_mode: str = 'intelligent') -> dict:
        """智能生成可视化 - 根据复杂度和用户设置自动路由"""

        start_time = time.time()

        # 1. 检查本地缓存（最快，离线）
        cache_result = await self._check_local_cache(prompt)
        if cache_result['found']:
            await self._log_usage('cache_hit', time.time() - start_time, 0)
            return {
                'content': cache_result['content'],
                'source': 'local_cache',
                'response_time_ms': int((time.time() - start_time) * 1000),
                'api_cost': 0.0
            }

        # 2. 分析输入复杂度
        complexity_score = await self._analyze_input_complexity(prompt)

        # 3. 根据用户模式和复杂度决定路由
        routing_decision = await self._make_routing_decision(prompt, complexity_score, user_mode)

        if routing_decision['engine'] == 'mock':
            return await self._generate_with_mock(prompt, routing_decision, start_time)
        elif routing_decision['engine'] == 'api':
            return await self._generate_with_api(prompt, routing_decision, start_time)
        else:  # hybrid - 先尝试Mock，不满足再API
            return await self._generate_with_hybrid_approach(prompt, routing_decision, start_time)

    async def _make_routing_decision(self, prompt: str, complexity_score: float, user_mode: str) -> dict:
        """智能路由决策"""

        # 获取用户配置
        config = await self._get_user_config()

        # 强制离线模式
        if config.get('offline_mode', False) or user_mode == 'mock_only':
            return {'engine': 'mock', 'confidence': 1.0}

        # API增强模式
        if user_mode == 'api_enhanced':
            return {'engine': 'api', 'confidence': 1.0}

        # 智能混合模式（默认）
        threshold = config.get('auto_api_threshold', 0.7)

        # 检查是否匹配本地模板
        template_match = await self._check_template_match(prompt)

        if template_match['match_score'] > 0.8:
            # 高匹配度，使用本地Mock
            return {
                'engine': 'mock',
                'confidence': template_match['match_score'],
                'template_id': template_match['template_id']
            }
        elif complexity_score > threshold:
            # 高复杂度，使用API
            return {
                'engine': 'api',
                'confidence': complexity_score,
                'reason': 'high_complexity'
            }
        else:
            # 中等情况，先尝试Mock
            return {
                'engine': 'hybrid',
                'confidence': complexity_score,
                'fallback_to_api': True
            }

    async def _generate_with_mock(self, prompt: str, decision: dict, start_time: float) -> dict:
        """使用本地Mock引擎生成"""
        try:
            result = await self.mock_engine.generate_visualization(
                prompt,
                template_id=decision.get('template_id')
            )

            # 记录使用统计
            await self._log_usage('mock', time.time() - start_time, 0)

            # 缓存结果
            await self.cache_manager.store_result(prompt, result)

            return {
                'content': result['content'],
                'source': 'local_mock',
                'confidence': decision['confidence'],
                'response_time_ms': int((time.time() - start_time) * 1000),
                'api_cost': 0.0,
                'offline_capable': True
            }

        except Exception as e:
            # Mock失败，记录错误
            await self._log_error('mock_generation_failed', str(e), prompt)
            raise

    async def _generate_with_api(self, prompt: str, decision: dict, start_time: float) -> dict:
        """使用API生成可视化"""
        try:
            # 检查API预算
            if not await self._check_api_budget():
                raise Exception("API budget exceeded for today")

            # 调用API
            api_response = await self.api_client.generate_visualization(prompt)

            # 计算成本
            api_cost = self._calculate_api_cost(api_response)

            # 记录API使用
            await self._record_api_usage(prompt, api_response, api_cost)

            # 缓存结果
            await self.cache_manager.store_api_result(prompt, api_response)

            # 记录使用统计
            await self._log_usage('api', time.time() - start_time, api_cost)

            return {
                'content': api_response['content'],
                'source': 'llm_api',
                'confidence': decision['confidence'],
                'response_time_ms': int((time.time() - start_time) * 1000),
                'api_cost': api_cost,
                'provider': api_response.get('provider', 'unknown'),
                'offline_capable': False
            }

        except Exception as e:
            await self._log_error('api_generation_failed', str(e), prompt)
            raise

    async def _generate_with_hybrid_approach(self, prompt: str, decision: dict, start_time: float) -> dict:
        """混合方式：先Mock，不满足再API"""
        try:
            # 1. 先尝试Mock
            mock_result = await self._generate_with_mock(prompt, decision, start_time)

            # 2. 评估Mock结果质量
            quality_score = await self._evaluate_output_quality(mock_result['content'])

            if quality_score > 0.7:
                # Mock结果足够好，直接返回
                return mock_result
            else:
                # Mock结果不够好，调用API增强
                try:
                    api_result = await self._generate_with_api(prompt, decision, start_time)

                    # 混合结果：以API为主，Mock为辅
                    return {
                        'content': api_result['content'],
                        'source': 'api_enhanced',
                        'mock_attempt': mock_result['content'],
                        'confidence': max(quality_score, api_result['confidence']),
                        'response_time_ms': int((time.time() - start_time) * 1000),
                        'api_cost': api_result['api_cost'],
                        'enhanced_from_mock': True
                    }
                except Exception as api_error:
                    # API失败，降级使用Mock结果
                    return {
                        **mock_result,
                        'source': 'mock_fallback',
                        'api_error': str(api_error)
                    }

        except Exception as e:
            # Mock也失败了，必须使用API
            return await self._generate_with_api(prompt, decision, start_time)

class DesktopDatabaseManager:
    """桌面应用数据库管理"""

    def __init__(self, app_data_dir: str = None):
        self.db_path = self._get_optimized_db_path(app_data_dir)
        self.connection = None
        self._setup_database()

    def _get_optimized_db_path(self, app_data_dir: str = None) -> str:
        """获取跨平台优化的数据库路径"""
        if app_data_dir is None:
            import os
            if os.name == 'nt':  # Windows
                app_data_dir = os.path.expandvars("%APPDATA%/万物可视化")
            elif os.name == 'posix':
                import platform
                if platform.system() == 'Darwin':  # macOS
                    app_data_dir = os.path.expanduser("~/Library/Application Support/万物可视化")
                else:  # Linux
                    app_data_dir = os.path.expanduser("~/.万物可视化")

        from pathlib import Path
        Path(app_data_dir).mkdir(parents=True, exist_ok=True)
        return str(Path(app_data_dir) / "visualization.db")

    def _setup_database(self):
        """设置数据库和优化配置"""
        self.connection = sqlite3.connect(self.db_path, check_same_thread=False)

        # 桌面应用性能优化配置
        optimizations = [
            "PRAGMA journal_mode=WAL",           # 提高并发性能
            "PRAGMA synchronous=NORMAL",         # 平衡性能和安全性
            "PRAGMA cache_size=-64000",          # 64MB缓存
            "PRAGMA temp_store=MEMORY",          # 临时表存储在内存
            "PRAGMA mmap_size=268435456",       # 256MB内存映射
            "PRAGMA page_size=4096",             # 4KB页面大小
            "PRAGMA locking_mode=NORMAL",        # 正常锁定模式
        ]

        for pragma in optimizations:
            self.connection.execute(pragma)

    async def backup_data(self, backup_path: str = None) -> str:
        """数据库备份"""
        import shutil
        import datetime

        if backup_path is None:
            timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
            backup_path = f"visualization_backup_{timestamp}.db"

        shutil.copy2(self.db_path, backup_path)
        return backup_path

class HybridCacheManager:
    """混合架构缓存管理"""

    def __init__(self, db_connection):
        self.db = db_connection
        self.memory_cache = {}  # L1缓存
        self.cache_policies = self._load_cache_policies()

    async def smart_cache_lookup(self, prompt: str, mode: str) -> dict:
        """智能缓存查找"""
        prompt_hash = hashlib.md5(prompt.encode()).hexdigest()

        # 1. 检查L1内存缓存
        if prompt_hash in self.memory_cache:
            cache_entry = self.memory_cache[prompt_hash]
            if not self._is_expired(cache_entry):
                return {"found": True, "content": cache_entry["content"], "source": "memory"}

        # 2. 检查L2 SQLite缓存
        cursor = self.db.execute("""
            SELECT response_content, hit_count, created_at
            FROM llm_response_cache
            WHERE prompt_hash = ? AND cache_expires_at > datetime('now')
        """, (prompt_hash,)).fetchone()

        if cursor:
            # 更新命中计数
            self.db.execute("""
                UPDATE llm_response_cache
                SET hit_count = hit_count + 1
                WHERE prompt_hash = ?
            """, (prompt_hash,))

            # 提升到L1缓存
            self.memory_cache[prompt_hash] = {
                "content": cursor["response_content"],
                "timestamp": time.time()
            }

            return {"found": True, "content": cursor["response_content"], "source": "sqlite"}

        return {"found": False}

    async def cache_result(self, prompt: str, result: dict, mode: str):
        """缓存生成结果"""
        if mode not in ["llm", "hybrid"]:
            return  # 只缓存LLM相关的结果

        prompt_hash = hashlib.md5(prompt.encode()).hexdigest()

        # 存储到L1内存缓存
        self.memory_cache[prompt_hash] = {
            "content": result["content"],
            "timestamp": time.time()
        }

        # 存储到L2 SQLite缓存
        self.db.execute("""
            INSERT OR REPLACE INTO llm_response_cache
            (id, prompt_hash, original_prompt, llm_provider, model_name,
             response_content, response_metadata, cache_expires_at, hit_count)
            VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now', '+30 days'), 1)
        """, (
            f"cache_{prompt_hash}",
            prompt_hash,
            prompt,
            result.get("provider", "unknown"),
            result.get("model", "unknown"),
            result["content"],
            json.dumps(result.get("metadata", {}))
        ))

        self.db.commit()

class FileProcessingService:
    """文件处理服务 - 桌面应用增强"""

    async def upload_file(self, file_data: bytes, metadata: dict) -> str:
        """文件上传和预处理"""
        import uuid

        file_id = str(uuid.uuid4())

        # 存储文件到本地
        file_path = self._get_file_storage_path(file_id, metadata["filename"])
        with open(file_path, 'wb') as f:
            f.write(file_data)

        # 记录到数据库
        self.db.execute("""
            INSERT INTO uploaded_files
            (id, filename, original_filename, file_type, mime_type,
             file_size, file_path, processing_status)
            VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')
        """, (
            file_id,
            file_id,
            metadata["filename"],
            metadata["file_type"],
            metadata["mime_type"],
            len(file_data),
            file_path
        ))

        # 异步处理文件内容
        asyncio.create_task(self._process_file_content(file_id))

        return file_id

    def _get_file_storage_path(self, file_id: str, filename: str) -> str:
        """获取文件存储路径"""
        import os
        from pathlib import Path

        # 获取应用数据目录
        if os.name == 'nt':  # Windows
            base_dir = os.path.expandvars("%APPDATA%/万物可视化/files")
        elif os.name == 'posix':
            import platform
            if platform.system() == 'Darwin':  # macOS
                base_dir = os.path.expanduser("~/Library/Application Support/万物可视化/files")
            else:  # Linux
                base_dir = os.path.expanduser("~/.万物可视化/files")

        Path(base_dir).mkdir(parents=True, exist_ok=True)
        return str(Path(base_dir) / f"{file_id}_{filename}")
```

### 4.2 数据访问层

```python
class VisualizationRepository:
    def __init__(self, db_session):
        self.db = db_session

    async def find_by_keywords(self, keywords: List[str], subject: str = None) -> List[dict]:
        """基于关键词查找可视化记录"""
        pass

    async def find_similar_by_vector(self, vector: List[float], threshold: float = 0.8) -> List[dict]:
        """基于向量相似度查找"""
        pass

    async def create_record(self, record_data: dict) -> str:
        """创建新的可视化记录"""
        pass
```

## 5. 性能优化策略

### 5.1 数据库优化

- **分区表**: 按时间分区存储visualization_records
- **连接池**: 使用连接池管理数据库连接
- **批量操作**: 批量插入和更新减少数据库往返
- **读写分离**: 查询使用只读副本，写入使用主库

### 5.2 查询优化

```sql
-- 高效的关键词匹配查询
WITH matched_records AS (
    SELECT vr.*,
           ts_rank_cd(to_tsvector('chinese', vr.normalized_keywords::text),
                     plainto_tsquery('chinese', :keywords)) as rank
    FROM visualization_records vr
    WHERE vr.expires_at > CURRENT_TIMESTAMP
      AND to_tsvector('chinese', vr.normalized_keywords::text) @@ plainto_tsquery('chinese', :keywords)
)
SELECT * FROM matched_records
ORDER BY rank DESC
LIMIT 10;
```

### 5.3 内存优化

- **对象池**: 复用数据库连接和向量计算对象
- **流式处理**: 大结果集使用游标分批处理
- **内存监控**: 监控内存使用，及时清理缓存

## 6. 数据迁移和备份策略

### 6.1 数据迁移

```python
# MockEngine数据导入脚本
async def migrate_mock_engine_data():
    """将MockEngine的硬编码模板导入数据库"""
    templates = MockEngine().strategies

    for strategy in templates:
        await create_template_record({
            'name': strategy.id,
            'subject': extract_subject(strategy.keywords),
            'keywords': strategy.keywords,
            'template_content': generate_template_html(strategy),
            'parameters': extract_parameters(strategy.handler)
        })
```

### 6.2 备份策略

- **增量备份**: 每日增量备份数据变更
- **全量备份**: 每周全量备份整个数据库
- **跨地域备份**: 备份数据存储到不同地域
- **快速恢复**: 支持分钟级数据恢复

## 7. 监控和告警

### 7.1 关键指标

- **缓存命中率**: 目标 > 80%
- **查询响应时间**: P99 < 100ms
- **数据库连接数**: 监控连接池使用率
- **存储空间**: 文件存储容量监控

### 7.2 告警规则

```yaml
alerts:
  - name: cache_hit_rate_low
    condition: cache_hit_rate < 0.7
    action: "缓存命中率过低，需要检查缓存策略"

  - name: query_response_time_high
    condition: query_p99_latency > 500ms
    action: "查询响应时间过长，需要优化数据库或增加缓存"
```

## 8. 桌面应用部署配置

### 8.1 跨平台数据库路径管理

```python
class DesktopPathManager:
    """桌面应用路径管理器"""

    @staticmethod
    def get_app_data_dir() -> str:
        """获取应用数据目录"""
        import os
        import platform

        system = platform.system()
        if system == "Windows":
            return os.path.expandvars("%APPDATA%/万物可视化")
        elif system == "Darwin":  # macOS
            return os.path.expanduser("~/Library/Application Support/万物可视化")
        else:  # Linux
            return os.path.expanduser("~/.local/share/万物可视化")

    @staticmethod
    def get_database_path() -> str:
        """获取数据库文件路径"""
        from pathlib import Path
        app_data_dir = DesktopPathManager.get_app_data_dir()
        Path(app_data_dir).mkdir(parents=True, exist_ok=True)
        return str(Path(app_data_dir) / "visualization.db")

    @staticmethod
    def get_files_storage_path() -> str:
        """获取文件存储路径"""
        from pathlib import Path
        app_data_dir = DesktopPathManager.get_app_data_dir()
        files_dir = Path(app_data_dir) / "files"
        files_dir.mkdir(parents=True, exist_ok=True)
        return str(files_dir)

    @staticmethod
    def get_logs_path() -> str:
        """获取日志文件路径"""
        from pathlib import Path
        app_data_dir = DesktopPathManager.get_app_data_dir()
        logs_dir = Path(app_data_dir) / "logs"
        logs_dir.mkdir(parents=True, exist_ok=True)
        return str(logs_dir)
```

### 8.2 桌面应用打包配置

```python
# PyInstaller 配置文件 (build.spec)
import sys
from pathlib import Path

# 获取项目根目录
project_root = Path(__file__).parent

# 数据库初始化脚本
datas = [
    # 数据库Schema文件
    ('database/schema.sql', 'database'),
    ('database/init_data.sql', 'database'),

    # 前端资源
    ('frontend/dist/*', 'frontend/dist'),
    ('static/*', 'static'),

    # 配置文件
    ('config/app_config.json', 'config'),

    # 图标和资源
    ('assets/icon.ico', 'assets') if sys.platform == 'win32' else ('assets/icon.icns', 'assets'),
]

# 隐式导入的模块
hiddenimports = [
    'sqlite3',
    'tkinter',
    'json',
    'asyncio',
    'pathlib',
    'hashlib',
    'gzip',
    'threading',
    'queue',
    'multiprocessing',
    'numpy',
    'PIL',
    'openai',
    'anthropic',
]

# Windows打包配置
exe_win = EXE(
    py,
    name='万物可视化',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    upx_exclude=[],
    runtime_tmpdir=None,
    console=False,  # GUI应用
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
    icon='assets/icon.ico',
    datas=datas,
    hiddenimports=hiddenimports,
)

# macOS打包配置
app_mac = BUNDLE(
    exe_win,
    name='万物可视化.app',
    icon='assets/icon.icns',
    bundle_identifier='com.manju.visualization',
    info_plist={
        'CFBundleName': '万物可视化',
        'CFBundleDisplayName': '万物可视化',
        'CFBundleVersion': '1.0.0',
        'CFBundleShortVersionString': '1.0.0',
        'CFBundleExecutable': '万物可视化',
        'NSHighResolutionCapable': True,
        'LSMinimumSystemVersion': '10.13.0',
    }
)

# Linux打包配置
exe_linux = EXE(
    py,
    name='万物可视化',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    upx_exclude=[],
    runtime_tmpdir=None,
    console=False,
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    icon='assets/icon.png',
    datas=datas,
    hiddenimports=hiddenimports,
)
```

### 8.3 数据库初始化脚本

```python
# database/init_desktop_db.py
import sqlite3
import json
import os
from pathlib import Path

class DesktopDatabaseInitializer:
    """桌面应用数据库初始化器"""

    def __init__(self, db_path: str):
        self.db_path = db_path
        self.connection = None

    def initialize_database(self):
        """初始化完整的数据库结构"""
        try:
            # 确保数据目录存在
            Path(self.db_path).parent.mkdir(parents=True, exist_ok=True)

            # 连接数据库
            self.connection = sqlite3.connect(self.db_path)
            self.connection.row_factory = sqlite3.Row

            # 1. 创建基础表结构
            self._create_basic_tables()

            # 2. 创建混合架构专用表
            self._create_hybrid_tables()

            # 3. 创建索引和触发器
            self._create_indexes_and_triggers()

            # 4. 创建全文搜索表
            self._create_fts_tables()

            # 5. 插入初始数据
            self._insert_initial_data()

            # 6. 优化数据库设置
            self._optimize_database()

            print(f"✅ 数据库初始化完成: {self.db_path}")
            return True

        except Exception as e:
            print(f"❌ 数据库初始化失败: {e}")
            return False

        finally:
            if self.connection:
                self.connection.close()

    def _create_basic_tables(self):
        """创建基础表结构"""
        schema = """
        -- 基础用户表
        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY DEFAULT 'desktop_user',
            username TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            preferences TEXT DEFAULT '{}',
            usage_stats TEXT DEFAULT '{}'
        );

        -- 可视化模板表
        CREATE TABLE IF NOT EXISTS visualization_templates (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            description TEXT,
            subject TEXT,
            category TEXT,
            keywords TEXT,
            template_content TEXT,
            parameters TEXT,
            usage_count INTEGER DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        -- 可视化记录表
        CREATE TABLE IF NOT EXISTS visualization_records (
            id TEXT PRIMARY KEY,
            user_id TEXT DEFAULT 'desktop_user',
            prompt TEXT NOT NULL,
            keywords TEXT,
            subject TEXT,
            template_id TEXT,
            generation_source TEXT,
            html_content TEXT,
            parameters_used TEXT,
            generation_time_ms INTEGER,
            cache_hit BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            expires_at TIMESTAMP,
            metadata TEXT
        );
        """
        self.connection.executescript(schema)

    def _create_hybrid_tables(self):
        """创建混合架构专用表"""
        schema = """
        -- Mock模板表
        CREATE TABLE IF NOT EXISTS mock_templates (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            category TEXT,
            subject TEXT,
            template_content TEXT,
            parameters_schema TEXT,
            is_system_template BOOLEAN DEFAULT FALSE,
            usage_count INTEGER DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        -- LLM缓存表
        CREATE TABLE IF NOT EXISTS llm_response_cache (
            id TEXT PRIMARY KEY,
            prompt_hash TEXT UNIQUE,
            original_prompt TEXT,
            llm_provider TEXT,
            model_name TEXT,
            response_content TEXT,
            response_metadata TEXT,
            cache_expires_at TIMESTAMP,
            hit_count INTEGER DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        -- 混合模式配置表
        CREATE TABLE IF NOT EXISTS hybrid_mode_config (
            id TEXT PRIMARY KEY DEFAULT 'global_config',
            default_mode TEXT CHECK(default_mode IN ('mock', 'llm', 'hybrid')) DEFAULT 'hybrid',
            auto_switch_rules TEXT,
            llm_providers TEXT,
            api_keys_encrypted TEXT,
            cache_settings TEXT,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        -- 使用统计表
        CREATE TABLE IF NOT EXISTS hybrid_usage_stats (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            date DATE,
            mode_used TEXT,
            operation_type TEXT,
            response_time_ms INTEGER,
            success BOOLEAN,
            user_satisfaction INTEGER CHECK(user_satisfaction BETWEEN 1 AND 5),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        """
        self.connection.executescript(schema)

    def _create_indexes_and_triggers(self):
        """创建索引和触发器"""
        sql_statements = [
            # 索引
            "CREATE INDEX IF NOT EXISTS idx_records_subject ON visualization_records(subject);",
            "CREATE INDEX IF NOT EXISTS idx_records_created_at ON visualization_records(created_at DESC);",
            "CREATE INDEX IF NOT EXISTS idx_cache_hash ON llm_response_cache(prompt_hash);",
            "CREATE INDEX IF NOT EXISTS idx_cache_expires ON llm_response_cache(cache_expires_at);",
            "CREATE INDEX IF NOT EXISTS idx_stats_date ON hybrid_usage_stats(date, mode_used);",

            # 触发器
            """CREATE TRIGGER IF NOT EXISTS update_config_timestamp
               BEFORE UPDATE ON hybrid_mode_config
               FOR EACH ROW
               BEGIN
                   UPDATE hybrid_mode_config SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
               END;"""
        ]

        for sql in sql_statements:
            self.connection.execute(sql)

    def _create_fts_tables(self):
        """创建全文搜索表"""
        fts_sql = """
        -- 内容搜索虚拟表
        CREATE VIRTUAL TABLE IF NOT EXISTS content_search USING fts5(
            prompt,
            html_content,
            keywords,
            subject,
            tokenize = 'unicode61 remove_diacritics 1'
        );

        -- 自动更新搜索索引的触发器
        CREATE TRIGGER IF NOT EXISTS update_search_index
        AFTER INSERT ON visualization_records
        BEGIN
            INSERT INTO content_search(rowid, prompt, html_content, keywords, subject)
            VALUES (NEW.id, NEW.prompt, NEW.html_content, NEW.keywords, NEW.subject);
        END;
        """
        self.connection.executescript(fts_sql)

    def _insert_initial_data(self):
        """插入初始数据"""
        # 插入默认桌面用户
        self.connection.execute("""
            INSERT OR IGNORE INTO users (id, username, preferences, usage_stats)
            VALUES ('desktop_user', 'Desktop User', '{}', '{}')
        """)

        # 插入默认配置
        default_config = {
            "default_mode": "hybrid",
            "auto_switch_rules": {
                "simple_keywords_threshold": 0.7,
                "complexity_threshold": 0.8
            },
            "llm_providers": ["openai", "claude"],
            "cache_settings": {
                "memory_cache_size": 50,
                "disk_cache_size": 500,
                "cache_ttl_days": 30
            }
        }

        self.connection.execute("""
            INSERT OR IGNORE INTO hybrid_mode_config
            (id, default_mode, auto_switch_rules, llm_providers, cache_settings)
            VALUES (?, ?, ?, ?, ?)
        """, (
            'global_config',
            default_config["default_mode"],
            json.dumps(default_config["auto_switch_rules"]),
            json.dumps(default_config["llm_providers"]),
            json.dumps(default_config["cache_settings"])
        ))

    def _optimize_database(self):
        """优化数据库设置"""
        optimizations = [
            "PRAGMA journal_mode=WAL",
            "PRAGMA synchronous=NORMAL",
            "PRAGMA cache_size=-64000",
            "PRAGMA temp_store=MEMORY",
            "PRAGMA mmap_size=268435456",
            "PRAGMA page_size=4096",
            "PRAGMA optimize"
        ]

        for pragma in optimizations:
            self.connection.execute(pragma)

        self.connection.commit()

# 使用示例
def initialize_desktop_database():
    """初始化桌面应用数据库"""
    from .desktop_path_manager import DesktopPathManager

    db_path = DesktopPathManager.get_database_path()
    initializer = DesktopDatabaseInitializer(db_path)
    return initializer.initialize_database()

if __name__ == "__main__":
    initialize_desktop_database()
```

### 8.4 桌面应用性能监控

```python
# monitoring/desktop_monitor.py
import time
import sqlite3
import psutil
from typing import Dict, Any
from pathlib import Path

class DesktopPerformanceMonitor:
    """桌面应用性能监控"""

    def __init__(self, db_path: str):
        self.db_path = db_path
        self.start_time = time.time()

    def collect_performance_metrics(self) -> Dict[str, Any]:
        """收集性能指标"""
        try:
            # 系统资源
            cpu_percent = psutil.cpu_percent()
            memory = psutil.virtual_memory()
            disk = psutil.disk_usage(Path(self.db_path).anchor)

            # 数据库性能
            db_metrics = self._get_database_metrics()

            # 应用运行时
            uptime = time.time() - self.start_time

            return {
                "timestamp": time.time(),
                "system": {
                    "cpu_percent": cpu_percent,
                    "memory_percent": memory.percent,
                    "memory_available_gb": memory.available / (1024**3),
                    "disk_free_gb": disk.free / (1024**3),
                },
                "database": db_metrics,
                "application": {
                    "uptime_seconds": uptime,
                    "cache_hit_rate": db_metrics.get("cache_hit_rate", 0),
                }
            }

        except Exception as e:
            return {"error": str(e), "timestamp": time.time()}

    def _get_database_metrics(self) -> Dict[str, Any]:
        """获取数据库性能指标"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()

            # 缓存命中率
            cursor.execute("""
                SELECT
                    COUNT(*) as total_requests,
                    SUM(hit_count) as total_hits,
                    ROUND(SUM(hit_count) * 100.0 / COUNT(*), 2) as hit_rate
                FROM llm_response_cache
                WHERE created_at > datetime('now', '-7 days')
            """)
            cache_stats = cursor.fetchone()

            # 数据库大小
            cursor.execute("SELECT page_count * page_size as size FROM pragma_page_count(), pragma_page_size()")
            db_size = cursor.fetchone()[0]

            # 表统计
            cursor.execute("""
                SELECT name,
                       (SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name=main.name) as row_count
                FROM sqlite_master
                WHERE type='table' AND name NOT LIKE 'sqlite_%'
            """)
            table_stats = cursor.fetchall()

            conn.close()

            return {
                "cache_hit_rate": cache_stats[2] if cache_stats[0] > 0 else 0,
                "database_size_mb": db_size / (1024 * 1024),
                "total_cache_requests": cache_stats[0],
                "total_cache_hits": cache_stats[1],
                "table_statistics": dict(table_stats)
            }

        except Exception as e:
            return {"error": str(e)}

    def log_performance_metrics(self):
        """记录性能指标到数据库"""
        metrics = self.collect_performance_metrics()

        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()

            # 插入性能记录
            cursor.execute("""
                INSERT INTO hybrid_usage_stats
                (date, mode_used, operation_type, response_time_ms, success)
                VALUES (date('now'), 'system', 'performance_monitoring', ?, ?)
            """, (
                int(metrics.get("application", {}).get("uptime_seconds", 0) * 1000),
                "system" in metrics  # 成功与否
            ))

            conn.commit()
            conn.close()

        except Exception as e:
            print(f"Failed to log performance metrics: {e}")

        return metrics
```

这份完整的design.md更新包含了：

1. **混合架构数据库设计** - 添加了Mock+LLM专用的表结构
2. **桌面应用优化** - SQLite特定优化和本地存储策略
3. **跨平台路径管理** - Windows/macOS/Linux统一处理
4. **打包配置** - PyInstaller配置文件示例
5. **数据库初始化** - 桌面应用启动时的数据库设置
6. **性能监控** - 桌面应用特有的性能指标收集
TodoWrite
<arg_key>todos</arg_key>
<arg_value>[{"content": "更新 proposal.md - 添加混合架构和桌面应用考虑", "status": "completed", "activeForm": "更新 proposal.md - 添加混合架构和桌面应用考虑"}, {"content": "更新 design.md - 添加混合架构数据库设计和桌面应用优化策略", "status": "completed", "activeForm": "更新 design.md - 添加混合架构数据库设计和桌面应用优化策略"}, {"content": "更新 tasks.md - 添加桌面应用打包和部署任务", "status": "in_progress", "activeForm": "更新 tasks.md - 添加桌面应用打包和部署任务"}]