/**
 * 茅塞顿开 API 客户端
 * 连接 backend-v2 FastAPI 服务器的统一API接口
 */

class HighSchoolAPI {
    constructor(baseURL = 'http://localhost:9999') {
        this.baseURL = baseURL;
        this.timeout = 30000; // 30秒超时
    }

    /**
     * 通用HTTP请求方法
     * @param {string} endpoint - API端点
     * @param {Object} options - 请求选项
     * @returns {Promise} 响应结果
     */
    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;

        const config = {
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                ...options.headers
            },
            ...options
        };

        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), this.timeout);

            const response = await fetch(url, {
                ...config,
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                throw new Error(`HTTP错误: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            return data;

        } catch (error) {
            console.error(`API请求失败 [${endpoint}]:`, error);

            if (error.name === 'AbortError') {
                throw new Error('请求超时，请检查网络连接');
            }

            throw error;
        }
    }

    /**
     * 生成可视化内容
     * @param {string} prompt - 用户输入的提示词
     * @param {Object} options - 可选参数
     * @returns {Promise} 生成结果
     */
    async generateVisualization(prompt, options = {}) {
        const payload = {
            prompt: prompt,
            grade_level: options.gradeLevel || 'high_school',
            subject: options.subject || null,
            interaction_mode: options.interactionMode || 'visualization',
            user_preferences: {
                interactive_elements: options.interactiveElements || true,
                detail_level: options.detailLevel || 'detailed',
                style: options.style || 'modern',
                ...options.userPreferences
            }
        };

        return this.request('/api/v2/highschool/generate', {
            method: 'POST',
            body: JSON.stringify(payload)
        });
    }

    /**
     * 指定学科生成可视化
     * @param {string} subject - 学科名称
     * @param {string} prompt - 用户输入的提示词
     * @param {Object} options - 可选参数
     * @returns {Promise} 生成结果
     */
    async generateSubjectVisualization(subject, prompt, options = {}) {
        const payload = {
            prompt: prompt,
            grade_level: options.gradeLevel || 'high_school',
            interaction_mode: options.interactionMode || 'visualization',
            user_preferences: {
                interactive_elements: options.interactiveElements || true,
                detail_level: options.detailLevel || 'detailed',
                style: options.style || 'modern',
                ...options.userPreferences
            }
        };

        return this.request(`/api/v2/highschool/${subject}/generate`, {
            method: 'POST',
            body: JSON.stringify(payload)
        });
    }

    /**
     * 获取支持的学科列表
     * @returns {Promise} 学科信息
     */
    async getSupportedSubjects() {
        return this.request('/api/v2/highschool/subjects');
    }

    /**
     * 智能学科分类
     * @param {string} prompt - 需要分类的文本
     * @returns {Promise} 分类结果
     */
    async classifySubject(prompt) {
        return this.request('/api/v2/classify', {
            method: 'POST',
            body: JSON.stringify({ prompt: prompt })
        });
    }

    /**
     * 获取所有模板
     * @returns {Promise} 模板列表
     */
    async getAllTemplates() {
        return this.request('/api/v2/templates');
    }

    /**
     * 获取指定学科的模板
     * @param {string} subject - 学科名称
     * @returns {Promise} 学科模板
     */
    async getSubjectTemplates(subject) {
        return this.request(`/api/v2/${subject}/templates`);
    }

    /**
     * 搜索模板
     * @param {string} keyword - 搜索关键词
     * @param {string} subject - 学科过滤（可选）
     * @returns {Promise} 搜索结果
     */
    async searchTemplates(keyword, subject = null) {
        const params = new URLSearchParams({ q: keyword });
        if (subject) {
            params.append('subject', subject);
        }
        return this.request(`/api/v2/templates/search?${params}`);
    }

    /**
     * 检查服务器健康状态
     * @returns {Promise} 健康状态
     */
    async checkHealth() {
        return this.request('/health');
    }

    /**
     * 获取系统状态
     * @returns {Promise} 系统信息
     */
    async getRegistry() {
        return this.request('/api/v2/registry');
    }

    // 便捷方法

    /**
     * 生成数学可视化
     * @param {string} prompt - 数学问题描述
     * @param {Object} options - 选项
     * @returns {Promise} 数学可视化结果
     */
    async generateMathVisualization(prompt, options = {}) {
        return this.generateSubjectVisualization('mathematics', prompt, options);
    }

    /**
     * 生成物理可视化
     * @param {string} prompt - 物理问题描述
     * @param {Object} options - 选项
     * @returns {Promise} 物理可视化结果
     */
    async generatePhysicsVisualization(prompt, options = {}) {
        return this.generateSubjectVisualization('physics', prompt, options);
    }

    /**
     * 生成化学可视化
     * @param {string} prompt - 化学问题描述
     * @param {Object} options - 选项
     * @returns {Promise} 化学可视化结果
     */
    async generateChemistryVisualization(prompt, options = {}) {
        return this.generateSubjectVisualization('chemistry', prompt, options);
    }

    /**
     * 生成生物可视化
     * @param {string} prompt - 生物问题描述
     * @param {Object} options - 选项
     * @returns {Promise} 生物可视化结果
     */
    async generateBiologyVisualization(prompt, options = {}) {
        return this.generateSubjectVisualization('biology', prompt, options);
    }

    /**
     * 生成天文可视化
     * @param {string} prompt - 天文问题描述
     * @param {Object} options - 选项
     * @returns {Promise} 天文可视化结果
     */
    async generateAstronomyVisualization(prompt, options = {}) {
        return this.generateSubjectVisualization('astronomy', prompt, options);
    }
}

/**
 * 前端显示管理器
 * 负责管理可视化内容的显示和交互
 */
class VisualizationManager {
    constructor(apiClient, containerId) {
        this.api = apiClient;
        this.containerId = containerId;
        this.container = document.getElementById(containerId);
        this.currentVisualization = null;
        this.isLoading = false;
    }

    /**
     * 显示加载状态
     * @param {string} message - 加载消息
     */
    showLoading(message = '正在生成可视化内容...') {
        this.isLoading = true;
        this.container.innerHTML = `
            <div class="loading-container">
                <div class="loading-spinner"></div>
                <div class="loading-text">${message}</div>
                <div class="loading-progress">
                    <div class="progress-bar">
                        <div class="progress-fill" id="progress-fill"></div>
                    </div>
                </div>
            </div>
        `;
        this.animateProgress();
    }

    /**
     * 动画进度条
     */
    animateProgress() {
        let progress = 0;
        const progressBar = document.getElementById('progress-fill');
        if (progressBar) {
            const interval = setInterval(() => {
                if (!this.isLoading) {
                    clearInterval(interval);
                    progressBar.style.width = '100%';
                    return;
                }
                progress += Math.random() * 15;
                progress = Math.min(progress, 90);
                progressBar.style.width = progress + '%';
            }, 200);
        }
    }

    /**
     * 显示错误信息
     * @param {Error} error - 错误对象
     */
    showError(error) {
        this.container.innerHTML = `
            <div class="error-container">
                <div class="error-icon">❌</div>
                <div class="error-title">生成失败</div>
                <div class="error-message">${error.message}</div>
                <div class="error-actions">
                    <button class="btn btn-primary" onclick="location.reload()">
                        重新加载
                    </button>
                    <button class="btn btn-secondary" onclick="window.history.back()">
                        返回上页
                    </button>
                </div>
            </div>
        `;
    }

    /**
     * 显示可视化内容
     * @param {Object} visualizationData - 可视化数据
     */
    showVisualization(visualizationData) {
        this.isLoading = false;
        this.currentVisualization = visualizationData;

        if (visualizationData.success && visualizationData.visualization) {
            const viz = visualizationData.visualization;

            // 创建包含iframe的容器
            this.container.innerHTML = `
                <div class="visualization-wrapper">
                    <div class="visualization-header">
                        <h2 class="visualization-title">${viz.title}</h2>
                        <div class="visualization-meta">
                            <span class="subject-tag">${this.getSubjectName(viz.subject)}</span>
                            <span class="grade-tag">${this.getGradeName(viz.grade_level)}</span>
                            <button class="fullscreen-btn" onclick="this.openFullscreen()">
                                🔍 全屏查看
                            </button>
                        </div>
                    </div>
                    <div class="visualization-content">
                        <iframe
                            srcdoc="${viz.html_content.replace(/"/g, '&quot;')}"
                            class="visualization-frame"
                            sandbox="allow-scripts allow-same-origin"
                            onload="this.style.opacity = '1'">
                        </iframe>
                    </div>
                    <div class="visualization-footer">
                        <div class="concepts">
                            <strong>相关概念:</strong> ${viz.concepts ? viz.concepts.join(', ') : '无'}
                        </div>
                        <div class="interactive-elements">
                            <strong>交互功能:</strong> ${viz.interactive_elements ? viz.interactive_elements.join(', ') : '基本显示'}
                        </div>
                    </div>
                </div>
            `;
        } else {
            this.showError(new Error(visualizationData.error || '未知的可视化数据'));
        }
    }

    /**
     * 获取学科中文名称
     * @param {string} subject - 学科英文名
     * @returns {string} 学科中文名
     */
    getSubjectName(subject) {
        const subjectNames = {
            'mathematics': '数学',
            'physics': '物理',
            'chemistry': '化学',
            'biology': '生物',
            'astronomy': '天文'
        };
        return subjectNames[subject] || subject;
    }

    /**
     * 获取年级中文名称
     * @param {string} grade - 年级英文名
     * @returns {string} 年级中文名
     */
    getGradeName(grade) {
        const gradeNames = {
            'elementary': '小学',
            'middle_school': '初中',
            'high_school': '高中',
            'university': '大学'
        };
        return gradeNames[grade] || grade;
    }

    /**
     * 全屏显示
     */
    openFullscreen() {
        const frame = this.container.querySelector('.visualization-frame');
        if (frame.requestFullscreen) {
            frame.requestFullscreen();
        } else if (frame.webkitRequestFullscreen) {
            frame.webkitRequestFullscreen();
        } else if (frame.msRequestFullscreen) {
            frame.msRequestFullscreen();
        }
    }

    /**
     * 生成并显示可视化
     * @param {string} prompt - 用户输入
     * @param {Object} options - 生成选项
     * @returns {Promise} 生成结果
     */
    async generateAndShow(prompt, options = {}) {
        try {
            this.showLoading(options.loadingMessage);

            const result = await this.api.generateVisualization(prompt, options);
            this.showVisualization(result);

            return result;

        } catch (error) {
            this.showError(error);
            throw error;
        }
    }
}

// 导出类供其他模块使用
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { HighSchoolAPI, VisualizationManager };
}

// 全局变量（用于浏览器环境）
window.HighSchoolAPI = HighSchoolAPI;
window.VisualizationManager = VisualizationManager;