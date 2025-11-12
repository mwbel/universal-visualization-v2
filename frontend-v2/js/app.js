/**
 * 万物可视化 v2.0 - 主应用入口
 * 基于方案A的简洁前端架构
 */

// 全局应用状态
const AppState = {
    isGenerating: false,
    currentGenerationId: null,
    currentVisualization: null,
    selectedTemplate: null,
    history: [],
    preferences: {
        autoSave: true,
        theme: 'light',
        language: 'zh-CN'
    },
    config: {
        apiBaseUrl: 'http://localhost:9999/api/v2',
        maxInputLength: 5000,
        animationDuration: 300
    }
};

// DOM 元素缓存
const Elements = {
    // 输入相关
    visualizationInput: null,
    generateBtn: null,
    clearBtn: null,
    charCount: null,

    // 模板相关
    templateChips: null,
    templateModal: null,
    templateGrid: null,

    // 结果相关
    resultSection: null,
    visualizationFrame: null,
    infoPanel: null,

    // 加载相关
    loadingOverlay: null,
    loadingStatus: null,
    progressFill: null,

    // 消息相关
    messageContainer: null,

    // 模态框相关
    helpModal: null,

    // 按钮
    downloadBtn: null,
    shareBtn: null,
    fullscreenBtn: null,
    newBtn: null
};

// 应用初始化
class VisualizationApp {
    constructor() {
        this.init();
    }

    async init() {
        console.log('🚀 万物可视化 v2.0 初始化中...');
        console.log('📋 架构: 方案A - 集中式路由架构');

        try {
            // 缓存 DOM 元素
            this.cacheElements();

            // 绑定事件监听器
            this.bindEventListeners();

            // 初始化服务
            await this.initializeServices();

            // 加载历史记录
            this.loadHistory();

            // 检查 API 连接
            await this.checkApiConnection();

            // 显示欢迎信息
            this.showWelcomeMessage();

            console.log('✅ 应用初始化完成');

        } catch (error) {
            console.error('❌ 应用初始化失败:', error);
            this.showMessage('应用初始化失败，请刷新页面重试', 'error');
        }
    }

    cacheElements() {
        // 输入元素
        Elements.visualizationInput = document.getElementById('visualizationInput');
        Elements.generateBtn = document.getElementById('generateBtn');
        Elements.clearBtn = document.getElementById('clearBtn');
        Elements.charCount = document.querySelector('.char-count');

        // 模板元素
        Elements.templateChips = document.querySelectorAll('.template-chip');
        Elements.templateModal = document.getElementById('templateModal');
        Elements.templateGrid = document.getElementById('templateGrid');

        // 结果元素
        Elements.resultSection = document.getElementById('resultSection');
        Elements.visualizationFrame = document.getElementById('visualizationFrame');
        Elements.infoPanel = document.getElementById('infoPanel');

        // 加载元素
        Elements.loadingOverlay = document.getElementById('loadingOverlay');
        Elements.loadingStatus = document.getElementById('loadingStatus');
        Elements.progressFill = document.getElementById('progressFill');

        // 消息元素
        Elements.messageContainer = document.getElementById('messageContainer');

        // 模态框元素
        Elements.helpModal = document.getElementById('helpModal');

        // 按钮元素
        Elements.downloadBtn = document.getElementById('downloadBtn');
        Elements.shareBtn = document.getElementById('shareBtn');
        Elements.fullscreenBtn = document.getElementById('fullscreenBtn');
        Elements.newBtn = document.getElementById('newBtn');

        console.log('📋 DOM 元素缓存完成');
    }

    bindEventListeners() {
        // 输入事件
        Elements.visualizationInput?.addEventListener('input', (e) => {
            this.handleInputChange(e.target.value);
        });

        Elements.visualizationInput?.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === 'Enter') {
                e.preventDefault();
                this.generateVisualization();
            }
        });

        // 按钮事件
        Elements.generateBtn?.addEventListener('click', () => {
            this.generateVisualization();
        });

        Elements.clearBtn?.addEventListener('click', () => {
            this.clearInput();
        });

        // 模板芯片事件
        Elements.templateChips?.forEach(chip => {
            chip.addEventListener('click', () => {
                this.selectQuickTemplate(chip);
            });
        });

        // 模态框事件
        document.getElementById('templateLibraryBtn')?.addEventListener('click', () => {
            this.openTemplateModal();
        });

        document.getElementById('historyBtn')?.addEventListener('click', () => {
            this.openHistoryModal();
        });

        document.getElementById('helpBtn')?.addEventListener('click', () => {
            this.openHelpModal();
        });

        // 结果区域事件
        Elements.downloadBtn?.addEventListener('click', () => {
            this.downloadVisualization();
        });

        Elements.shareBtn?.addEventListener('click', () => {
            this.shareVisualization();
        });

        Elements.fullscreenBtn?.addEventListener('click', () => {
            this.toggleFullscreen();
        });

        Elements.newBtn?.addEventListener('click', () => {
            this.createNewVisualization();
        });

        // 关闭模态框事件
        document.getElementById('closeTemplateModal')?.addEventListener('click', () => {
            this.closeModal('templateModal');
        });

        document.getElementById('closeHelpModal')?.addEventListener('click', () => {
            this.closeModal('helpModal');
        });

        // 点击背景关闭模态框
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.style.display = 'none';
                }
            });
        });

        // 键盘快捷键
        document.addEventListener('keydown', (e) => {
            this.handleKeyboardShortcut(e);
        });

        console.log('🖱️ 事件监听器绑定完成');
    }

    async initializeServices() {
        // 初始化 API 服务
        if (window.APIService) {
            await window.APIService.initialize(AppState.config.apiBaseUrl);
        }

        // 初始化 UI 控制器
        if (window.UIController) {
            window.UIController.initialize();
        }

        // 初始化模板管理器
        if (window.TemplateManager) {
            await window.TemplateManager.initialize();
        }

        console.log('🔧 服务初始化完成');
    }

    handleInputChange(value) {
        // 更新字符计数
        if (Elements.charCount) {
            Elements.charCount.textContent = `${value.length} / ${AppState.config.maxInputLength}`;
        }

        // 更新生成按钮状态
        if (Elements.generateBtn) {
            Elements.generateBtn.disabled = value.trim().length === 0 || AppState.isGenerating;
        }

        // 自动保存输入内容
        if (AppState.preferences.autoSave) {
            this.saveInputToStorage(value);
        }

        // 显示智能建议（如果需要）
        if (value.trim().length > 5) {
            this.showSuggestions(value);
        } else {
            this.hideSuggestions();
        }
    }

    selectQuickTemplate(chip) {
        const templateId = chip.dataset.template;

        // 移除其他选中状态
        Elements.templateChips.forEach(c => c.classList.remove('active'));

        // 添加选中状态
        chip.classList.add('active');

        // 更新应用状态
        AppState.selectedTemplate = templateId;

        // 在输入框中插入模板内容
        const templateText = this.getTemplateText(templateId);
        Elements.visualizationInput.value = templateText;

        // 触发输入变化事件
        this.handleInputChange(templateText);

        // 聚焦到输入框
        Elements.visualizationInput.focus();

        console.log(`📋 选择模板: ${templateId}`);
    }

    getTemplateText(templateId) {
        const templates = {
            'normal_distribution': '正态分布 均值0 标准差1',
            'planetary_orbits': '太阳系内行星轨道运动 地球 火星 木星',
            'projectile_motion': '抛体运动 初速度20m/s 发射角度45度',
            'harmonic_oscillation': '简谐振动 振幅2 频率1Hz 无阻尼',
            'constellation': '大熊座星座图 显示恒星名称和连线',
            'matrix_transformation': '二阶行列式 计算 可视化步骤'
        };

        return templates[templateId] || '';
    }

    async generateVisualization() {
        const prompt = Elements.visualizationInput?.value.trim();

        if (!prompt) {
            this.showMessage('请输入可视化描述', 'warning');
            return;
        }

        if (AppState.isGenerating) {
            this.showMessage('正在生成中，请稍候...', 'info');
            return;
        }

        try {
            // 显示加载动画
            this.showLoading();

            // 更新状态
            AppState.isGenerating = true;
            AppState.currentGenerationId = null;
            this.updateGenerateButton();

            // 调用 API 生成可视化
            const response = await window.APIService?.generateVisualization({
                prompt: prompt,
                template_id: AppState.selectedTemplate,
                user_preferences: AppState.preferences
            });

            if (response?.generation_id) {
                AppState.currentGenerationId = response.generation_id;
                this.showMessage('开始生成可视化，请稍候...', 'info');

                // 开始状态轮询
                await this.pollGenerationStatus(response.generation_id, prompt);
            } else {
                throw new Error(response?.error || '生成请求失败');
            }

        } catch (error) {
            console.error('❌ 生成失败:', error);
            this.showMessage(`生成失败: ${error.message}`, 'error');

            // 清理状态
            AppState.isGenerating = false;
            AppState.currentGenerationId = null;
            this.updateGenerateButton();
            this.hideLoading();
        }
    }

    async pollGenerationStatus(generationId, originalPrompt) {
        const maxAttempts = 60; // 最多轮询60次（约5分钟）
        let attempts = 0;

        const poll = async () => {
            try {
                const status = await window.APIService?.getGenerationStatus(generationId);

                if (!status) {
                    throw new Error('无法获取生成状态');
                }

                // 更新进度
                this.updateProgress(status.progress || 0);

                switch (status.status) {
                    case 'completed':
                        // 生成完成
                        const visualizationUrl = status.html_url;
                        if (visualizationUrl) {
                            await this.loadVisualizationResult(visualizationUrl);
                            this.addToHistory(originalPrompt, {
                                generation_id: generationId,
                                html_url: visualizationUrl
                            });
                            this.showMessage('可视化生成成功！', 'success');
                        }
                        this.completeGeneration();
                        break;

                    case 'failed':
                        // 生成失败
                        const errorMsg = status.error || '生成过程中发生错误';
                        throw new Error(errorMsg);

                    case 'processing':
                    case 'classifying':
                    case 'parsing':
                    case 'matching':
                    case 'generating':
                        // 继续轮询
                        attempts++;
                        if (attempts < maxAttempts) {
                            setTimeout(poll, 2000); // 2秒后再次检查
                        } else {
                            throw new Error('生成超时，请重试');
                        }
                        break;

                    default:
                        // 未知状态，继续轮询
                        attempts++;
                        if (attempts < maxAttempts) {
                            setTimeout(poll, 2000);
                        } else {
                            throw new Error('生成超时，请重试');
                        }
                        break;
                }

            } catch (error) {
                console.error('❌ 状态轮询错误:', error);
                this.showMessage(`生成失败: ${error.message}`, 'error');
                this.completeGeneration();
            }
        };

        // 开始轮询
        await poll();
    }

    updateProgress(progress) {
        if (Elements.progressFill) {
            Elements.progressFill.style.width = `${progress}%`;
        }

        // 更新状态文本
        const statusText = this.getStatusText(progress);
        if (Elements.generateBtn) {
            const originalText = Elements.generateBtn.textContent;
            Elements.generateBtn.innerHTML = `<span class="btn-icon">⏳</span> ${statusText} (${progress}%)`;
        }
    }

    getStatusText(progress) {
        if (progress < 20) return '分析需求';
        if (progress < 40) return '匹配模板';
        if (progress < 60) return '生成配置';
        if (progress < 80) return '渲染可视化';
        if (progress < 100) return '完成处理';
        return '生成完成';
    }

    completeGeneration() {
        AppState.isGenerating = false;
        AppState.currentGenerationId = null;
        this.updateGenerateButton();
        this.hideLoading();

        // 重置进度条
        if (Elements.progressFill) {
            setTimeout(() => {
                Elements.progressFill.style.width = '0%';
            }, 1000);
        }
    }

    async loadVisualizationResult(visualizationUrl) {
        try {
            const response = await fetch(`http://localhost:9999${visualizationUrl}`);
            if (!response.ok) {
                throw new Error('获取可视化结果失败');
            }

            const htmlContent = await response.text();
            this.showVisualizationResult({
                html_content: htmlContent,
                html_url: visualizationUrl
            });

        } catch (error) {
            console.error('❌ 加载可视化结果失败:', error);
            throw new Error('加载可视化结果失败');
        }
    }

    showVisualizationResult(response) {
        // 显示结果区域
        if (Elements.resultSection) {
            Elements.resultSection.style.display = 'block';
        }

        // 填充可视化内容
        if (Elements.visualizationFrame && response.html_content) {
            Elements.visualizationFrame.innerHTML = response.html_content;
        }

        // 更新信息面板
        this.updateInfoPanel(response);

        // 滚动到结果区域
        Elements.resultSection?.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });

        // 更新当前可视化
        AppState.currentVisualization = response;

        console.log('🎨 可视化结果显示完成');
    }

    updateInfoPanel(response) {
        if (!Elements.infoPanel) return;

        const info = {
            subject: response.subject || '未知',
            concept: response.requirement?.concept_type || '未知',
            template: response.template?.name || '未知',
            time: new Date().toLocaleString('zh-CN')
        };

        document.getElementById('subjectInfo').textContent = info.subject;
        document.getElementById('conceptInfo').textContent = info.concept;
        document.getElementById('templateInfo').textContent = info.template;
        document.getElementById('timeInfo').textContent = info.time;

        Elements.infoPanel.style.display = 'block';
    }

    showLoading() {
        if (Elements.loadingOverlay) {
            Elements.loadingOverlay.style.display = 'flex';

            // 开始进度动画
            if (Elements.progressFill) {
                Elements.progressFill.style.width = '0%';
                setTimeout(() => {
                    Elements.progressFill.style.width = '70%';
                }, 100);
            }
        }

        // 更新加载状态文本
        this.updateLoadingStatus('AI正在分析您的需求...');
    }

    hideLoading() {
        if (Elements.loadingOverlay) {
            // 完成进度动画
            if (Elements.progressFill) {
                Elements.progressFill.style.width = '100%';
            }

            setTimeout(() => {
                Elements.loadingOverlay.style.display = 'none';
                Elements.progressFill.style.width = '0%';
            }, 300);
        }
    }

    updateLoadingStatus(message) {
        if (Elements.loadingStatus) {
            Elements.loadingStatus.textContent = message;
        }
    }

    updateGenerateButton() {
        if (Elements.generateBtn) {
            Elements.generateBtn.disabled = AppState.isGenerating;

            if (AppState.isGenerating) {
                Elements.generateBtn.innerHTML = '<span class="btn-icon">⏳</span>生成中...';
            } else {
                Elements.generateBtn.innerHTML = '<span class="btn-icon">✨</span>开始生成';
            }
        }
    }

    showMessage(message, type = 'info') {
        if (!Elements.messageContainer) return;

        const messageEl = document.createElement('div');
        messageEl.className = `message ${type}`;

        const icon = {
            'success': '✅',
            'error': '❌',
            'warning': '⚠️',
            'info': 'ℹ️'
        }[type] || 'ℹ️';

        messageEl.innerHTML = `
            <span>${icon}</span>
            <span>${message}</span>
        `;

        Elements.messageContainer.appendChild(messageEl);

        // 自动移除消息
        setTimeout(() => {
            messageEl.remove();
        }, 5000);

        console.log(`💬 消息 [${type}]: ${message}`);
    }

    clearInput() {
        if (Elements.visualizationInput) {
            Elements.visualizationInput.value = '';
            this.handleInputChange('');
        }

        // 清除模板选择
        Elements.templateChips?.forEach(chip => {
            chip.classList.remove('active');
        });

        AppState.selectedTemplate = null;

        this.showMessage('输入已清空', 'info');
    }

    handleKeyboardShortcut(e) {
        // Ctrl + Enter: 生成可视化
        if (e.ctrlKey && e.key === 'Enter') {
            if (!AppState.isGenerating && Elements.visualizationInput?.value.trim()) {
                this.generateVisualization();
            }
        }

        // Ctrl + K: 打开模板库
        else if (e.ctrlKey && e.key === 'k') {
            e.preventDefault();
            this.openTemplateModal();
        }

        // Ctrl + H: 打开历史记录
        else if (e.ctrlKey && e.key === 'h') {
            e.preventDefault();
            this.openHistoryModal();
        }

        // Escape: 关闭模态框
        else if (e.key === 'Escape') {
            this.closeAllModals();
        }
    }

    // 模态框相关方法
    openTemplateModal() {
        if (window.TemplateManager) {
            window.TemplateManager.loadTemplates();
        }
        this.openModal('templateModal');
    }

    openHistoryModal() {
        // TODO: 实现历史记录模态框
        this.showMessage('历史记录功能开发中...', 'info');
    }

    openHelpModal() {
        this.openModal('helpModal');
    }

    openModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'flex';
            document.body.style.overflow = 'hidden';
        }
    }

    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'none';
            document.body.style.overflow = '';
        }
    }

    closeAllModals() {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.style.display = 'none';
        });
        document.body.style.overflow = '';
    }

    // 结果区域操作方法
    downloadVisualization() {
        if (!AppState.currentVisualization) {
            this.showMessage('没有可下载的可视化', 'warning');
            return;
        }

        // TODO: 实现下载功能
        this.showMessage('下载功能开发中...', 'info');
    }

    shareVisualization() {
        if (!AppState.currentVisualization) {
            this.showMessage('没有可分享的可视化', 'warning');
            return;
        }

        // TODO: 实现分享功能
        this.showMessage('分享功能开发中...', 'info');
    }

    toggleFullscreen() {
        if (!Elements.visualizationFrame) return;

        if (!document.fullscreenElement) {
            Elements.visualizationFrame.requestFullscreen().catch(err => {
                console.error('全屏失败:', err);
                this.showMessage('全屏功能不可用', 'warning');
            });
        } else {
            document.exitFullscreen();
        }
    }

    createNewVisualization() {
        this.clearInput();
        if (Elements.resultSection) {
            Elements.resultSection.style.display = 'none';
        }
        AppState.currentVisualization = null;

        // 滚动到输入区域
        document.querySelector('.input-section')?.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });
    }

    // 辅助方法
    async checkApiConnection() {
        try {
            const response = await fetch(`${AppState.config.apiBaseUrl}/health`);
            if (response.ok) {
                console.log('🌐 API 连接正常');
                return true;
            }
        } catch (error) {
            console.warn('⚠️ API 连接失败:', error);
            this.showMessage('API 服务连接失败，某些功能可能不可用', 'warning');
            return false;
        }
    }

    showWelcomeMessage() {
        // 检查是否首次访问
        const hasVisited = localStorage.getItem('wv-visited');
        if (!hasVisited) {
            setTimeout(() => {
                this.showMessage('欢迎使用万物可视化 v2.0！在输入框中描述您想要的可视化即可开始', 'info');
                localStorage.setItem('wv-visited', 'true');
            }, 1000);
        }
    }

    saveInputToStorage(value) {
        try {
            localStorage.setItem('wv-input-cache', value);
        } catch (error) {
            console.warn('保存输入到本地存储失败:', error);
        }
    }

    loadInputFromStorage() {
        try {
            const cached = localStorage.getItem('wv-input-cache');
            if (cached && Elements.visualizationInput) {
                Elements.visualizationInput.value = cached;
                this.handleInputChange(cached);
            }
        } catch (error) {
            console.warn('从本地存储加载输入失败:', error);
        }
    }

    loadHistory() {
        try {
            const history = localStorage.getItem('wv-history');
            if (history) {
                AppState.history = JSON.parse(history);
            }
        } catch (error) {
            console.warn('加载历史记录失败:', error);
        }
    }

    addToHistory(prompt, response) {
        const historyItem = {
            id: Date.now(),
            prompt: prompt,
            subject: response.subject,
            concept: response.requirement?.concept_type,
            timestamp: new Date().toISOString(),
            response: response
        };

        AppState.history.unshift(historyItem);

        // 保持历史记录数量限制
        if (AppState.history.length > 50) {
            AppState.history = AppState.history.slice(0, 50);
        }

        // 保存到本地存储
        try {
            localStorage.setItem('wv-history', JSON.stringify(AppState.history));
        } catch (error) {
            console.warn('保存历史记录失败:', error);
        }
    }

    showSuggestions(prompt) {
        // TODO: 实现智能建议功能
        // 这里可以根据输入内容显示相关建议
    }

    hideSuggestions() {
        const suggestionsContainer = document.getElementById('suggestionsContainer');
        if (suggestionsContainer) {
            suggestionsContainer.style.display = 'none';
        }
    }
}

// 应用启动
document.addEventListener('DOMContentLoaded', () => {
    window.app = new VisualizationApp();
});

// 防止页面刷新时丢失数据
window.addEventListener('beforeunload', (e) => {
    if (AppState.isGenerating) {
        e.preventDefault();
        e.returnValue = '正在生成可视化，确定要离开吗？';
    }
});

console.log('📦 万物可视化 v2.0 前端模块加载完成');