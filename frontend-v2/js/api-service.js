/**
 * 万物可视化 v2.0 - API 服务模块
 * 处理与后端 API 的通信
 */

class APIService {
    constructor() {
        this.baseUrl = '';
        this.timeout = 30000; // 30秒超时
        this.retryCount = 3;
        this.retryDelay = 1000;
    }

    async initialize(baseUrl) {
        this.baseUrl = baseUrl.replace(/\/$/, ''); // 移除尾部斜杠
        console.log(`🌐 API 服务初始化: ${this.baseUrl}`);
    }

    /**
     * 生成可视化
     */
    async generateVisualization(request) {
        const url = `${this.baseUrl}/generate`;
        return this.postRequest(url, request);
    }

    /**
     * 学科特定生成
     */
    async generateSubjectVisualization(subject, request) {
        const url = `${this.baseUrl}/${subject}/generate`;
        return this.postRequest(url, request);
    }

    /**
     * 学科分类
     */
    async classifySubject(prompt) {
        const url = `${this.baseUrl}/classify`;
        return this.postRequest(url, { prompt });
    }

    /**
     * 获取所有模板
     */
    async getAllTemplates() {
        const url = `${this.baseUrl}/templates`;
        return this.getRequest(url);
    }

    /**
     * 获取学科模板
     */
    async getSubjectTemplates(subject) {
        const url = `${this.baseUrl}/${subject}/templates`;
        return this.getRequest(url);
    }

    /**
     * 获取生成状态
     */
    async getGenerationStatus(generationId) {
        const url = `${this.baseUrl}/status/${generationId}`;
        return this.getRequest(url);
    }

    /**
     * 获取可视化结果
     */
    async getVisualization(vizId) {
        const url = `${this.baseUrl}/visualizations/${vizId}`;
        return this.getRequest(url, 'text');
    }

    /**
     * 获取系统健康状态
     */
    async getHealthStatus() {
        const url = `${this.baseUrl}/../health`;
        return this.getRequest(url);
    }

    /**
     * 获取系统注册信息
     */
    async getRegistry() {
        const url = `${this.baseUrl}/../registry`;
        return this.getRequest(url);
    }

    /**
     * 批量获取所有模板（供模板管理器使用）
     */
    async batchGetTemplates() {
        try {
            const response = await this.getAllTemplates();
            return {
                all: response.templates || [],
                mathematics: await this.getSubjectTemplates('mathematics'),
                astronomy: await this.getSubjectTemplates('astronomy'),
                physics: await this.getSubjectTemplates('physics')
            };
        } catch (error) {
            console.error('批量获取模板失败:', error);
            return {
                all: [],
                mathematics: [],
                astronomy: [],
                physics: []
            };
        }
    }

    /**
     * 搜索模板
     */
    async searchTemplates(query, subject = null) {
        const params = new URLSearchParams({ query });
        if (subject) {
            params.append('subject', subject);
        }
        const url = `${this.baseUrl}/templates/search?${params}`;
        return this.getRequest(url);
    }

    /**
     * 通用 GET 请求
     */
    async getRequest(url, responseType = 'json') {
        return this.makeRequest(url, {
            method: 'GET',
            responseType
        });
    }

    /**
     * 通用 POST 请求
     */
    async postRequest(url, data) {
        return this.makeRequest(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
    }

    /**
     * 发起 HTTP 请求
     */
    async makeRequest(url, options, attempt = 1) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);

        try {
            console.log(`📡 API 请求: ${options.method || 'GET'} ${url}`);

            const response = await fetch(url, {
                ...options,
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            // 根据响应类型处理数据
            let data;
            const contentType = response.headers.get('content-type');

            if (options.responseType === 'text') {
                data = await response.text();
            } else if (contentType?.includes('application/json')) {
                data = await response.json();
            } else if (contentType?.includes('text/html')) {
                data = await response.text();
            } else {
                data = await response.text();
            }

            console.log(`✅ API 请求成功: ${url}`);
            return data;

        } catch (error) {
            clearTimeout(timeoutId);

            // 网络错误或超时，尝试重试
            if (attempt < this.retryCount && this.shouldRetry(error)) {
                console.warn(`⚠️ API 请求失败，第 ${attempt} 次重试: ${error.message}`);
                await this.delay(this.retryDelay * attempt);
                return this.makeRequest(url, options, attempt + 1);
            }

            console.error(`❌ API 请求失败: ${error.message}`);
            throw error;
        }
    }

    /**
     * 判断是否应该重试
     */
    shouldRetry(error) {
        if (error.name === 'AbortError') {
            return true; // 超时重试
        }

        if (error.message.includes('Failed to fetch') ||
            error.message.includes('NetworkError') ||
            error.message.includes('ECONNREFUSED')) {
            return true; // 网络错误重试
        }

        return false;
    }

    /**
     * 延迟函数
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * 轮询生成状态
     */
    async pollGenerationStatus(generationId, onUpdate, maxPolls = 60) {
        let polls = 0;

        const poll = async () => {
            try {
                const status = await this.getGenerationStatus(generationId);

                if (onUpdate) {
                    onUpdate(status);
                }

                if (status.status === 'completed') {
                    return status;
                } else if (status.status === 'failed') {
                    throw new Error(status.error || '生成失败');
                } else if (polls < maxPolls) {
                    polls++;
                    await this.delay(2000); // 2秒后再次检查
                    return poll();
                } else {
                    throw new Error('生成超时');
                }

            } catch (error) {
                if (polls >= maxPolls) {
                    throw error;
                }
                polls++;
                await this.delay(2000);
                return poll();
            }
        };

        return poll();
    }

    /**
     * 批量获取模板
     */
    async batchGetTemplates() {
        try {
            const [allTemplates, mathTemplates, astronomyTemplates, physicsTemplates] = await Promise.all([
                this.getAllTemplates(),
                this.getSubjectTemplates('mathematics'),
                this.getSubjectTemplates('astronomy'),
                this.getSubjectTemplates('physics')
            ]);

            return {
                all: allTemplates?.templates || [],
                mathematics: mathTemplates?.templates || [],
                astronomy: astronomyTemplates?.templates || [],
                physics: physicsTemplates?.templates || []
            };

        } catch (error) {
            console.warn('批量获取模板失败:', error);
            return {
                all: [],
                mathematics: [],
                astronomy: [],
                physics: []
            };
        }
    }

    /**
     * 搜索模板
     */
    async searchTemplates(query, subject = null) {
        // 注意：这里假设后端有搜索接口，如果没有则需要前端过滤
        const url = subject
            ? `${this.baseUrl}/${subject}/templates?search=${encodeURIComponent(query)}`
            : `${this.baseUrl}/templates?search=${encodeURIComponent(query)}`;

        try {
            return await this.getRequest(url);
        } catch (error) {
            console.warn('模板搜索失败，使用前端过滤:', error);

            // 回退到前端过滤
            const allTemplates = await this.getAllTemplates();
            const templates = allTemplates.templates || [];

            const queryLower = query.toLowerCase();
            return {
                total: templates.length,
                templates: templates.filter(template =>
                    template.name.toLowerCase().includes(queryLower) ||
                    template.description.toLowerCase().includes(queryLower) ||
                    (template.keywords && template.keywords.some(k => k.toLowerCase().includes(queryLower)))
                )
            };
        }
    }

    /**
     * 验证 API 连接
     */
    async validateConnection() {
        try {
            const health = await this.getHealthStatus();
            return {
                connected: true,
                version: health.version,
                agents: health.agents || 0,
                timestamp: health.timestamp
            };
        } catch (error) {
            return {
                connected: false,
                error: error.message
            };
        }
    }

    /**
     * 获取 API 统计信息
     */
    async getApiStats() {
        try {
            const [health, registry] = await Promise.all([
                this.getHealthStatus(),
                this.getRegistry()
            ]);

            return {
                health: health,
                registry: registry,
                connectionTime: new Date().toISOString()
            };
        } catch (error) {
            console.warn('获取 API 统计信息失败:', error);
            return null;
        }
    }

    /**
     * 上传文件（如果支持）
     */
    async uploadFile(file, metadata = {}) {
        const url = `${this.baseUrl}/upload`;
        const formData = new FormData();

        formData.append('file', file);

        // 添加元数据
        Object.keys(metadata).forEach(key => {
            formData.append(key, metadata[key]);
        });

        return this.makeRequest(url, {
            method: 'POST',
            body: formData
            // 不设置 Content-Type，让浏览器自动设置
        });
    }

    /**
     * 取消生成任务
     */
    async cancelGeneration(generationId) {
        const url = `${this.baseUrl}/cancel/${generationId}`;
        return this.postRequest(url, {});
    }

    /**
     * 导出可视化数据
     */
    async exportVisualization(vizId, format = 'json') {
        const url = `${this.baseUrl}/visualizations/${vizId}/export?format=${format}`;
        return this.getRequest(url);
    }

    /**
     * 获取支持的学科列表
     */
    async getSupportedSubjects() {
        try {
            const registry = await this.getRegistry();
            return registry.subjects || ['mathematics', 'astronomy', 'physics'];
        } catch (error) {
            console.warn('获取支持的学科列表失败:', error);
            return ['mathematics', 'astronomy', 'physics']; // 默认值
        }
    }

    /**
     * 清除缓存
     */
    clearCache() {
        // 清除可能存在的缓存
        console.log('🗑️ API 缓存已清除');
    }
}

// 创建全局实例
window.APIService = new APIService();

console.log('🌐 API 服务模块加载完成');