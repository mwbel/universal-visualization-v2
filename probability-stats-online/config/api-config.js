/**
 * API 配置文件
 * 用于配置大模型API和其他后端服务
 */

const API_CONFIG = {
    // 大模型API配置
    LLM_API: {
        // API基础URL
        baseURL: process.env.LLM_API_URL || 'http://localhost:8000/api/v1',

        // API密钥（从环境变量读取）
        apiKey: process.env.LLM_API_KEY || '',

        // 模型配置
        model: process.env.LLM_MODEL || 'gpt-3.5-turbo',

        // 超时时间（毫秒）
        timeout: 30000,

        // 最大重试次数
        maxRetries: 3,

        // 端点配置
        endpoints: {
            chat: '/chat/completions',
            explain: '/explain',
            generateQuiz: '/quiz/generate',
            analyze: '/analyze'
        }
    },

    // 推荐系统API配置
    RECOMMENDATION_API: {
        baseURL: process.env.RECOMMEND_API_URL || 'http://localhost:8001/api/v1',
        timeout: 10000,
        endpoints: {
            getRecommendations: '/recommendations',
            trackProgress: '/progress'
        }
    },

    // 分析统计API
    ANALYTICS_API: {
        baseURL: process.env.ANALYTICS_API_URL || 'http://localhost:8002/api/v1',
        timeout: 5000,
        endpoints: {
            track: '/track',
            stats: '/stats'
        }
    },

    // 是否启用API功能
    features: {
        llmExplain: true,        // 大模型解释功能
        autoQuiz: true,          // 自动生成测验
        smartRecommend: true,    // 智能推荐
        progressTracking: true,  // 学习进度跟踪
        analytics: true          // 使用分析
    },

    // 开发模式配置
    development: {
        mockAPI: process.env.NODE_ENV === 'development',  // 开发环境使用模拟数据
        debugMode: process.env.DEBUG === 'true',          // 调试模式
        logRequests: true                                  // 记录API请求
    }
};

// 导出配置
if (typeof module !== 'undefined' && module.exports) {
    module.exports = API_CONFIG;
}
