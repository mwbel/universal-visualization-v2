/**
 * 万物可视化 v2.0 - 模板管理器
 * 管理可视化模板的加载、搜索和应用
 */

class TemplateManager {
    constructor() {
        this.templates = [];
        this.categorizedTemplates = {};
        this.searchResults = [];
        this.currentCategory = 'all';
        this.initialized = false;
        this.cache = new Map();
        this.cacheExpiry = 5 * 60 * 1000; // 5分钟缓存
    }

    async initialize() {
        if (this.initialized) return;

        try {
            await this.loadTemplates();
            this.setupEventListeners();
            this.initialized = true;
            console.log('📚 模板管理器初始化完成');
        } catch (error) {
            console.error('❌ 模板管理器初始化失败:', error);
        }
    }

    /**
     * 设置事件监听器
     */
    setupEventListeners() {
        // 分类标签点击
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.filterByCategory(btn.dataset.category);
                this.updateActiveTab(btn);
            });
        });

        // 模板搜索
        const searchInput = document.getElementById('templateSearch');
        if (searchInput) {
            searchInput.addEventListener('input', this.debounce((e) => {
                this.searchTemplates(e.target.value);
            }, 300));
        }

        // 关闭建议
        document.getElementById('closeSuggestions')?.addEventListener('click', () => {
            this.hideSuggestions();
        });
    }

    /**
     * 加载所有模板
     */
    async loadTemplates() {
        try {
            // 检查缓存
            const cached = this.getFromCache('all_templates');
            if (cached) {
                this.templates = cached;
                this.categorizeTemplates(this.templates);
                return;
            }

            // 从 API 加载
            const response = await window.APIService?.batchGetTemplates();

            if (response) {
                this.templates = response.all || [];
                this.categorizeTemplates(this.templates);

                // 缓存结果
                this.setCache('all_templates', this.templates);
                console.log(`📚 已加载 ${this.templates.length} 个模板`);
            }

        } catch (error) {
            console.warn('加载模板失败，使用默认模板:', error);
            this.loadDefaultTemplates();
        }
    }

    /**
     * 加载默认模板（离线模式）
     */
    loadDefaultTemplates() {
        this.templates = [
            {
                id: 'normal_distribution',
                name: '正态分布',
                description: '交互式正态分布概率密度函数可视化',
                subject: 'mathematics',
                category: 'probability',
                difficulty: '初级',
                keywords: ['正态', '高斯', '概率', '统计'],
                examples: ['正态分布 均值0 标准差1', '高斯分布 μ=2 σ=1.5'],
                icon: '📊'
            },
            {
                id: 'planetary_orbits',
                name: '行星轨道运动',
                description: '太阳系行星轨道运动模拟',
                subject: 'astronomy',
                category: 'solar_system',
                difficulty: '中级',
                keywords: ['行星', '轨道', '太阳系', '天文学'],
                examples: ['太阳系内行星轨道运动', '地球火星轨道对比'],
                icon: '🪐'
            },
            {
                id: 'projectile_motion',
                name: '抛体运动',
                description: '二维抛体运动轨迹和速度矢量可视化',
                subject: 'physics',
                category: 'mechanics',
                difficulty: '中级',
                keywords: ['抛体', '运动', '轨迹', '物理'],
                examples: ['45度角抛体运动 初速度20m/s', '平抛运动'],
                icon: '⚡'
            },
            {
                id: 'harmonic_oscillation',
                name: '简谐振动',
                description: '弹簧振子或单摆的简谐振动可视化',
                subject: 'physics',
                category: 'waves',
                difficulty: '中级',
                keywords: ['振动', '简谐', '频率', '振幅'],
                examples: ['简谐振动 振幅2 频率1Hz', '弹簧振子'],
                icon: '🌊'
            },
            {
                id: 'constellation',
                name: '星座图',
                description: '星座的恒星位置和连线可视化',
                subject: 'astronomy',
                category: 'celestial_sphere',
                difficulty: '初级',
                keywords: ['星座', '恒星', '天文', '星图'],
                examples: ['大熊座星座图', '猎户座恒星位置'],
                icon: '✨'
            },
            {
                id: 'matrix_transformation',
                name: '矩阵变换',
                description: '矩阵线性变换的可视化展示',
                subject: 'mathematics',
                category: 'linear_algebra',
                difficulty: '高级',
                keywords: ['矩阵', '变换', '线性代数', '向量'],
                examples: ['二阶矩阵旋转变换', '矩阵缩放变换'],
                icon: '🔄'
            }
        ];

        this.categorizeTemplates(this.templates);
    }

    /**
     * 分类模板
     */
    categorizeTemplates(templates) {
        this.categorizedTemplates = {
            all: templates,
            mathematics: templates.filter(t => t.subject === 'mathematics'),
            astronomy: templates.filter(t => t.subject === 'astronomy'),
            physics: templates.filter(t => t.subject === 'physics')
        };
    }

    /**
     * 按分类过滤模板
     */
    filterByCategory(category) {
        this.currentCategory = category;
        this.renderTemplates(this.categorizedTemplates[category] || []);
    }

    /**
     * 搜索模板
     */
    async searchTemplates(query) {
        if (!query.trim()) {
            this.filterByCategory(this.currentCategory);
            return;
        }

        try {
            // 检查缓存
            const cacheKey = `search_${query}`;
            const cached = this.getFromCache(cacheKey);
            if (cached) {
                this.renderTemplates(cached);
                return;
            }

            // API 搜索
            const response = await window.APIService?.searchTemplates(query);

            if (response?.templates) {
                this.searchResults = response.templates;
                this.renderTemplates(this.searchResults);
                this.setCache(cacheKey, this.searchResults);
            } else {
                // 前端过滤作为后备
                const filtered = this.templates.filter(template =>
                    template.name.toLowerCase().includes(query.toLowerCase()) ||
                    template.description.toLowerCase().includes(query.toLowerCase()) ||
                    template.keywords.some(k => k.toLowerCase().includes(query.toLowerCase()))
                );
                this.searchResults = filtered;
                this.renderTemplates(filtered);
            }

        } catch (error) {
            console.warn('搜索模板失败:', error);
            // 前端过滤
            const filtered = this.templates.filter(template =>
                template.name.toLowerCase().includes(query.toLowerCase()) ||
                template.description.toLowerCase().includes(query.toLowerCase())
            );
            this.renderTemplates(filtered);
        }
    }

    /**
     * 渲染模板列表
     */
    renderTemplates(templates) {
        const grid = document.getElementById('templateGrid');
        if (!grid) return;

        if (templates.length === 0) {
            grid.innerHTML = `
                <div class="no-results">
                    <div class="no-results-icon">🔍</div>
                    <h3>没有找到模板</h3>
                    <p>尝试使用其他关键词或选择不同的分类</p>
                </div>
            `;
            return;
        }

        grid.innerHTML = templates.map(template => `
            <div class="template-card" data-template-id="${template.id}">
                <div class="template-header">
                    <div class="template-icon">${template.icon || '📊'}</div>
                    <div class="template-info">
                        <h4 class="template-name">${template.name}</h4>
                        <span class="template-difficulty difficulty-${template.difficulty}">${this.getDifficultyText(template.difficulty)}</span>
                    </div>
                </div>
                <p class="template-description">${template.description}</p>
                <div class="template-meta">
                    <span class="template-subject">${this.getSubjectText(template.subject)}</span>
                    <span class="template-category">${template.category || '通用'}</span>
                </div>
                ${template.examples && template.examples.length > 0 ? `
                    <div class="template-examples">
                        <strong>示例:</strong>
                        <ul>
                            ${template.examples.slice(0, 2).map(example =>
                                `<li>${example}</li>`
                            ).join('')}
                        </ul>
                    </div>
                ` : ''}
                <div class="template-actions">
                    <button class="btn btn-primary btn-sm template-apply" data-template="${template.id}">
                        使用模板
                    </button>
                    <button class="btn btn-secondary btn-sm template-preview" data-template="${template.id}">
                        预览
                    </button>
                </div>
            </div>
        `).join('');

        // 绑定模板事件
        this.bindTemplateEvents();
    }

    /**
     * 绑定模板卡片事件
     */
    bindTemplateEvents() {
        // 应用模板按钮
        document.querySelectorAll('.template-apply').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const templateId = btn.dataset.template;
                this.applyTemplate(templateId);
            });
        });

        // 预览按钮
        document.querySelectorAll('.template-preview').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const templateId = btn.dataset.template;
                this.previewTemplate(templateId);
            });
        });

        // 模板卡片点击
        document.querySelectorAll('.template-card').forEach(card => {
            card.addEventListener('click', () => {
                const templateId = card.dataset.templateId;
                this.selectTemplate(templateId);
            });
        });
    }

    /**
     * 应用模板
     */
    applyTemplate(templateId) {
        const template = this.findTemplate(templateId);
        if (!template) return;

        // 生成模板文本
        const templateText = this.generateTemplateText(template);

        // 填充到输入框
        const input = document.getElementById('visualizationInput');
        if (input) {
            input.value = templateText;
            input.dispatchEvent(new Event('input'));
            input.focus();

            // 关闭模态框
            this.closeModal();

            // 显示消息
            window.app?.showMessage(`已应用模板: ${template.name}`, 'success');

            console.log(`📋 应用模板: ${template.name}`);
        }
    }

    /**
     * 预览模板
     */
    async previewTemplate(templateId) {
        const template = this.findTemplate(templateId);
        if (!template) return;

        // 创建预览模态框
        const modal = document.createElement('div');
        modal.className = 'modal template-preview-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>📋 ${template.name}</h3>
                    <button class="modal-close">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="preview-content">
                        <div class="preview-info">
                            <div class="preview-section">
                                <h4>描述</h4>
                                <p>${template.description}</p>
                            </div>

                            <div class="preview-section">
                                <h4>学科</h4>
                                <span class="subject-tag subject-${template.subject}">${this.getSubjectText(template.subject)}</span>
                            </div>

                            <div class="preview-section">
                                <h4>难度</h4>
                                <span class="difficulty-tag difficulty-${template.difficulty}">${this.getDifficultyText(template.difficulty)}</span>
                            </div>

                            <div class="preview-section">
                                <h4>关键词</h4>
                                <div class="keywords">
                                    ${template.keywords.map(keyword =>
                                        `<span class="keyword-tag">${keyword}</span>`
                                    ).join('')}
                                </div>
                            </div>

                            ${template.examples && template.examples.length > 0 ? `
                                <div class="preview-section">
                                    <h4>使用示例</h4>
                                    <ul class="example-list">
                                        ${template.examples.map(example =>
                                            `<li><code>${example}</code></li>`
                                        ).join('')}
                                    </ul>
                                </div>
                            ` : ''}
                        </div>

                        <div class="preview-actions">
                            <button class="btn btn-primary" onclick="window.TemplateManager.applyTemplate('${templateId}')">
                                使用此模板
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // 绑定关闭事件
        modal.querySelector('.modal-close').addEventListener('click', () => {
            modal.remove();
        });

        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });

        // 显示动画
        requestAnimationFrame(() => {
            modal.classList.add('visible');
        });
    }

    /**
     * 选择模板（高亮显示）
     */
    selectTemplate(templateId) {
        // 移除之前的选中状态
        document.querySelectorAll('.template-card').forEach(card => {
            card.classList.remove('selected');
        });

        // 添加选中状态
        const selectedCard = document.querySelector(`[data-template-id="${templateId}"]`);
        if (selectedCard) {
            selectedCard.classList.add('selected');
            selectedCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }

    /**
     * 生成模板文本
     */
    generateTemplateText(template) {
        const templates = {
            'normal_distribution': '正态分布 均值0 标准差1',
            'planetary_orbits': '太阳系内行星轨道运动 地球 火星 木星',
            'projectile_motion': '抛体运动 初速度20m/s 发射角度45度',
            'harmonic_oscillation': '简谐振动 振幅2 频率1Hz 无阻尼',
            'constellation': '大熊座星座图 显示恒星名称和连线',
            'matrix_transformation': '二阶矩阵变换 旋转角度90度'
        };

        return templates[template.id] || template.name;
    }

    /**
     * 查找模板
     */
    findTemplate(templateId) {
        return this.templates.find(t => t.id === templateId);
    }

    /**
     * 更新活动标签
     */
    updateActiveTab(activeBtn) {
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        activeBtn.classList.add('active');
    }

    /**
     * 获取学科文本
     */
    getSubjectText(subject) {
        const subjects = {
            'mathematics': '数学',
            'astronomy': '天文',
            'physics': '物理',
            'chemistry': '化学',
            'biology': '生物'
        };
        return subjects[subject] || subject;
    }

    /**
     * 获取难度文本
     */
    getDifficultyText(difficulty) {
        const difficulties = {
            '初级': '初级',
            '中级': '中级',
            '高级': '高级',
            'beginner': '初级',
            'intermediate': '中级',
            'advanced': '高级'
        };
        return difficulties[difficulty] || difficulty;
    }

    /**
     * 关闭模态框
     */
    closeModal() {
        const modal = document.getElementById('templateModal');
        if (modal) {
            modal.style.display = 'none';
        }
    }

    /**
     * 显示智能建议
     */
    showSuggestions(prompt) {
        const container = document.getElementById('suggestionsContainer');
        const list = document.getElementById('suggestionsList');

        if (!container || !list) return;

        // 查找相关模板
        const suggestions = this.templates.filter(template =>
            template.keywords.some(keyword =>
                prompt.toLowerCase().includes(keyword.toLowerCase())
            ) ||
            template.name.toLowerCase().includes(prompt.toLowerCase()) ||
            template.description.toLowerCase().includes(prompt.toLowerCase())
        ).slice(0, 3);

        if (suggestions.length === 0) {
            this.hideSuggestions();
            return;
        }

        list.innerHTML = suggestions.map(template => `
            <div class="suggestion-item" onclick="window.TemplateManager.applySuggestion('${template.id}')">
                <div class="suggestion-icon">${template.icon || '📊'}</div>
                <div class="suggestion-content">
                    <div class="suggestion-title">${template.name}</div>
                    <div class="suggestion-desc">${template.description}</div>
                </div>
            </div>
        `).join('');

        container.style.display = 'block';
    }

    /**
     * 应用建议
     */
    applySuggestion(templateId) {
        this.applyTemplate(templateId);
        this.hideSuggestions();
    }

    /**
     * 隐藏建议
     */
    hideSuggestions() {
        const container = document.getElementById('suggestionsContainer');
        if (container) {
            container.style.display = 'none';
        }
    }

    /**
     * 缓存管理
     */
    setCache(key, data) {
        this.cache.set(key, {
            data,
            timestamp: Date.now()
        });
    }

    getFromCache(key) {
        const cached = this.cache.get(key);
        if (cached && (Date.now() - cached.timestamp) < this.cacheExpiry) {
            return cached.data;
        }
        return null;
    }

    clearCache() {
        this.cache.clear();
    }

    /**
     * 防抖函数
     */
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    /**
     * 获取模板统计
     */
    getTemplateStats() {
        const stats = {
            total: this.templates.length,
            bySubject: {},
            byDifficulty: {}
        };

        this.templates.forEach(template => {
            // 按学科统计
            const subject = template.subject;
            stats.bySubject[subject] = (stats.bySubject[subject] || 0) + 1;

            // 按难度统计
            const difficulty = template.difficulty;
            stats.byDifficulty[difficulty] = (stats.byDifficulty[difficulty] || 0) + 1;
        });

        return stats;
    }

    /**
     * 导出模板配置
     */
    exportTemplates() {
        const exportData = {
            version: '2.0.0',
            timestamp: new Date().toISOString(),
            templates: this.templates,
            stats: this.getTemplateStats()
        };

        const blob = new Blob([JSON.stringify(exportData, null, 2)], {
            type: 'application/json'
        });

        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `visualization-templates-${Date.now()}.json`;
        a.click();

        URL.revokeObjectURL(url);
    }
}

// 创建全局实例
window.TemplateManager = new TemplateManager();

console.log('📚 模板管理器模块加载完成');