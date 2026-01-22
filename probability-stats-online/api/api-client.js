/**
 * API客户端 - 封装所有后端API调用
 * 包括大模型API、推荐系统API等
 */

class APIClient {
    constructor(config) {
        this.config = config;
        this.requestQueue = [];
        this.isProcessing = false;
    }

    /**
     * 通用请求方法
     */
    async request(endpoint, options = {}) {
        const {
            method = 'GET',
            data = null,
            headers = {},
            timeout = this.config.timeout
        } = options;

        const url = `${this.config.baseURL}${endpoint}`;

        // 构建请求配置
        const requestConfig = {
            method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.config.apiKey}`,
                ...headers
            }
        };

        if (data) {
            requestConfig.body = JSON.stringify(data);
        }

        try {
            // 添加请求超时
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), timeout);

            const response = await fetch(url, {
                ...requestConfig,
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            return await response.json();

        } catch (error) {
            if (error.name === 'AbortError') {
                throw new Error(`请求超时: ${timeout}ms`);
            }
            throw error;
        }
    }

    /**
     * 大模型API - 解释概念
     */
    async explainConcept(conceptName, context = {}) {
        if (!this.config.features?.llmExplain) {
            console.warn('LLM解释功能未启用');
            return null;
        }

        return await this.request(this.config.endpoints.explain, {
            method: 'POST',
            data: {
                concept: conceptName,
                context: context,
                language: 'zh-CN'
            }
        });
    }

    /**
     * 大模型API - 聊天对话
     */
    async chat(messages, options = {}) {
        if (!this.config.features?.llmExplain) {
            console.warn('LLM聊天功能未启用');
            return null;
        }

        return await this.request(this.config.endpoints.chat, {
            method: 'POST',
            data: {
                messages: messages,
                model: this.config.model,
                ...options
            }
        });
    }

    /**
     * 大模型API - 生成测验题
     */
    async generateQuiz(topic, difficulty = 'medium', count = 5) {
        if (!this.config.features?.autoQuiz) {
            console.warn('自动测验功能未启用');
            return null;
        }

        return await this.request(this.config.endpoints.generateQuiz, {
            method: 'POST',
            data: {
                topic: topic,
                difficulty: difficulty,
                count: count,
                language: 'zh-CN'
            }
        });
    }

    /**
     * 推荐系统 - 获取学习推荐
     */
    async getRecommendations(userId, currentProgress) {
        if (!this.config.features?.smartRecommend) {
            console.warn('智能推荐功能未启用');
            return null;
        }

        const recommendConfig = this.config.constructor.name === 'LLM_API' ?
            null : API_CONFIG.RECOMMENDATION_API;

        if (!recommendConfig) return null;

        return await this.request(
            `${recommendConfig.baseURL}${recommendConfig.endpoints.getRecommendations}`,
            {
                method: 'POST',
                data: {
                    userId: userId,
                    currentProgress: currentProgress,
                    timestamp: Date.now()
                },
                timeout: recommendConfig.timeout
            }
        );
    }

    /**
     * 分析统计 - 跟踪用户行为
     */
    async trackEvent(eventType, eventData) {
        if (!this.config.features?.analytics) {
            return;
        }

        const analyticsConfig = API_CONFIG.ANALYTICS_API;
        if (!analyticsConfig) return;

        try {
            await this.request(
                `${analyticsConfig.baseURL}${analyticsConfig.endpoints.track}`,
                {
                    method: 'POST',
                    data: {
                        eventType: eventType,
                        eventData: eventData,
                        timestamp: Date.now(),
                        userAgent: navigator.userAgent,
                        url: window.location.href
                    },
                    timeout: analyticsConfig.timeout
                }
            );
        } catch (error) {
            // 分析统计失败不影响主功能，仅记录日志
            console.warn('分析统计失败:', error);
        }
    }

    /**
     * 获取学习统计数据
     */
    async getStats(userId, timeRange = '7d') {
        if (!this.config.features?.analytics) {
            return null;
        }

        const analyticsConfig = API_CONFIG.ANALYTICS_API;
        if (!analyticsConfig) return null;

        return await this.request(
            `${analyticsConfig.baseURL}${analyticsConfig.endpoints.stats}`,
            {
                method: 'GET',
                timeout: analyticsConfig.timeout
            }
        );
    }
}

// 创建API客户端实例
const llmClient = new APIClient(API_CONFIG.LLM_API);
const recommendClient = new APIClient(API_CONFIG.RECOMMENDATION_API);
const analyticsClient = new APIClient(API_CONFIG.ANALYTICS_API);

// 导出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { APIClient, llmClient, recommendClient, analyticsClient };
}
