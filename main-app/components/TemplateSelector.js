/**
 * TemplateSelector.js - 模板选择器组件
 * 支持模板分类浏览、搜索、预览和选择功能
 */
(function(global) {
  'use strict';

  class TemplateSelector {
    constructor(options = {}) {
      this.options = {
        templateDataPath: './data/templates.json',
        categoriesContainer: '#templateCategories',
        searchInput: '#templateSearch',
        modeButtons: '.mode-btn',
        textInputPanel: '#textInputPanel',
        templateInputPanel: '#templateInputPanel',
        ...options
      };

      this.state = {
        templates: null,
        categories: null,
        selectedTemplate: null,
        searchQuery: '',
        selectedCategory: null,
        selectedSubcategory: null,
        selectedDifficulty: null,
        sortBy: 'name', // 'name', 'difficulty', 'popularity'
        sortOrder: 'asc', // 'asc', 'desc'
        isLoading: false,
        favorites: this.loadFavorites(),
        recentlyViewed: this.loadRecentlyViewed()
      };

      this.elements = {};
      this.init();
    }

    async init() {
      this.bindElements();
      this.bindEvents();
      await this.loadTemplates();
    }

    bindElements() {
      this.elements.categoriesContainer = document.querySelector(this.options.categoriesContainer);
      this.elements.searchInput = document.querySelector(this.options.searchInput);
      this.elements.modeButtons = document.querySelectorAll(this.options.modeButtons);
      this.elements.textInputPanel = document.querySelector(this.options.textInputPanel);
      this.elements.templateInputPanel = document.querySelector(this.options.templateInputPanel);
    }

    bindEvents() {
      // 模式切换事件
      this.elements.modeButtons.forEach(btn => {
        btn.addEventListener('click', this.handleModeToggle.bind(this));
      });

      // 搜索事件
      if (this.elements.searchInput) {
        this.elements.searchInput.addEventListener('input', this.handleSearch.bind(this));
        this.elements.searchInput.addEventListener('keydown', this.handleSearchKeyDown.bind(this));
      }
    }

    async loadTemplates() {
      try {
        this.state.isLoading = true;

        const response = await fetch(this.options.templateDataPath);
        if (!response.ok) {
          throw new Error(`Failed to load templates: ${response.status}`);
        }

        const data = await response.json();
        this.state.templates = data;
        this.state.categories = data.categories;

        this.renderCategories();
        this.emit('templates-loaded', data);

      } catch (error) {
        console.error('TemplateSelector: Error loading templates:', error);
        this.emit('error', {
          type: 'load-templates-error',
          message: '无法加载模板数据，请稍后重试'
        });
      } finally {
        this.state.isLoading = false;
      }
    }

    handleModeToggle(event) {
      const mode = event.currentTarget.dataset.mode;
      const isActive = event.currentTarget.classList.contains('active');

      // 更新按钮状态
      this.elements.modeButtons.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.mode === mode);
      });

      // 切换面板
      if (mode === 'text') {
        this.elements.textInputPanel.classList.add('active');
        this.elements.templateInputPanel.classList.remove('active');
      } else {
        this.elements.textInputPanel.classList.remove('active');
        this.elements.templateInputPanel.classList.add('active');
      }

      this.emit('mode-changed', { mode });
    }

    handleSearch(event) {
      const query = event.target.value.trim();
      this.state.searchQuery = query;

      if (query) {
        this.searchTemplates(query);
      } else {
        this.renderCategories();
      }
    }

    handleSearchKeyDown(event) {
      if (event.key === 'Enter') {
        event.preventDefault();
        const firstResult = this.elements.categoriesContainer.querySelector('.template-card');
        if (firstResult) {
          firstResult.click();
        }
      }
    }

    searchTemplates(query) {
      if (!this.state.templates) return;

      const results = [];
      const lowerQuery = query.toLowerCase();

      // 搜索所有模板
      this.state.categories.forEach(category => {
        category.templates.forEach(template => {
          const matches = this.matchesQuery(template, lowerQuery);
          if (matches.score > 0) {
            results.push({
              ...template,
              category: category,
              matchScore: matches.score,
              matchReasons: matches.reasons
            });
          }
        });
      });

      // 按匹配分数排序
      results.sort((a, b) => b.matchScore - a.matchScore);

      // 渲染搜索结果
      this.renderSearchResults(results, query);
    }

    matchesQuery(template, query) {
      let score = 0;
      const reasons = [];

      // 检查名称匹配
      if (template.name.toLowerCase().includes(query)) {
        score += 100;
        reasons.push('名称匹配');
      }

      // 检查描述匹配
      if (template.description.toLowerCase().includes(query)) {
        score += 50;
        reasons.push('描述匹配');
      }

      // 检查标签匹配
      template.tags.forEach(tag => {
        if (tag.toLowerCase().includes(query)) {
          score += 30;
          reasons.push('标签匹配');
        }
      });

      // 检查关键词匹配
      template.keywords.forEach(keyword => {
        if (keyword.toLowerCase().includes(query)) {
          score += 20;
          reasons.push('关键词匹配');
        }
      });

      // 检查示例匹配
      template.examples.forEach(example => {
        if (example.toLowerCase().includes(query)) {
          score += 15;
          reasons.push('示例匹配');
        }
      });

      return { score, reasons };
    }

    renderCategories() {
      if (!this.elements.categoriesContainer || !this.state.categories) return;

      // 添加筛选和排序控制
      const filterControls = `
        <div class="template-controls">
          <div class="control-group">
            <label class="control-label">学科分类:</label>
            <select class="control-select" id="categoryFilter">
              <option value="">全部分类</option>
              ${this.state.categories.map(cat => `
                <option value="${cat.id}" ${this.state.selectedCategory === cat.id ? 'selected' : ''}>
                  ${cat.icon} ${cat.name}
                </option>
              `).join('')}
            </select>
          </div>

          <div class="control-group">
            <label class="control-label">难度等级:</label>
            <select class="control-select" id="difficultyFilter">
              <option value="">全部难度</option>
              <option value="初级" ${this.state.selectedDifficulty === '初级' ? 'selected' : ''}>初级</option>
              <option value="中级" ${this.state.selectedDifficulty === '中级' ? 'selected' : ''}>中级</option>
              <option value="高级" ${this.state.selectedDifficulty === '高级' ? 'selected' : ''}>高级</option>
            </select>
          </div>

          <div class="control-group">
            <label class="control-label">排序方式:</label>
            <select class="control-select" id="sortBy">
              <option value="name" ${this.state.sortBy === 'name' ? 'selected' : ''}>名称</option>
              <option value="difficulty" ${this.state.sortBy === 'difficulty' ? 'selected' : ''}>难度</option>
              <option value="popularity" ${this.state.sortBy === 'popularity' ? 'selected' : ''}>热度</option>
            </select>
          </div>

          <div class="control-group">
            <button class="control-btn" id="clearFilters">清除筛选</button>
          </div>
        </div>
      `;

      // 过滤和排序模板
      const filteredCategories = this.getFilteredCategories();

      this.elements.categoriesContainer.innerHTML = filterControls + filteredCategories.map(category => `
        <div class="template-category ${this.state.selectedCategory === category.id ? 'active' : ''}"
             data-category="${category.id}">
          <div class="template-category-header">
            <span class="template-category-icon">${category.icon}</span>
            <div class="category-info">
              <h4 class="template-category-title">${category.name}</h4>
              <span class="template-category-desc">${category.description}</span>
              <span class="template-category-count">${category.templates.length} 个模板</span>
            </div>
            <button class="category-toggle" data-category="${category.id}">
              <span class="toggle-icon">▼</span>
            </button>
          </div>
          <div class="template-grid" ${this.state.selectedCategory !== category.id ? 'style="display: none;"' : ''}>
            ${category.templates.map(template => this.renderTemplateCard(template, category)).join('')}
          </div>
        </div>
      `).join('');

      // 绑定控制事件
      this.bindControlEvents();

      // 绑定模板卡片事件
      this.bindTemplateCardEvents();
    }

    renderSearchResults(results, query) {
      if (!this.elements.categoriesContainer) return;

      if (results.length === 0) {
        this.elements.categoriesContainer.innerHTML = `
          <div class="empty-state">
            <div class="empty-state-icon">🔍</div>
            <h4 class="empty-state-title">未找到匹配的模板</h4>
            <p class="empty-state-description">
              没有找到与 "${query}" 相关的模板，请尝试其他关键词或直接输入描述
            </p>
          </div>
        `;
        return;
      }

      this.elements.categoriesContainer.innerHTML = `
        <div class="search-results">
          <div class="search-results-header">
            <h4>搜索结果: "${query}"</h4>
            <p class="search-results-count">找到 ${results.length} 个相关模板</p>
          </div>
          <div class="template-grid">
            ${results.map(template => this.renderTemplateCard(template, template.category, true)).join('')}
          </div>
        </div>
      `;

      // 绑定模板卡片事件
      this.bindTemplateCardEvents();
    }

    renderTemplateCard(template, category, isSearchResult = false) {
      const isFavorite = this.state.favorites.includes(template.id);
      const matchInfo = isSearchResult ? `
        <div class="template-match-info">
          <span class="match-score">匹配度: ${Math.round(template.matchScore)}%</span>
          <div class="match-reasons">
            ${template.matchReasons.map(reason => `<span class="match-reason">${reason}</span>`).join('')}
          </div>
        </div>
      ` : '';

      return `
        <div class="template-card ${this.state.selectedTemplate?.id === template.id ? 'selected' : ''}"
             data-template-id="${template.id}"
             data-category="${category.id}">
          <div class="template-header">
            <div class="template-info">
              <h5 class="template-name">${template.name}</h5>
              <span class="template-difficulty difficulty-${template.difficulty}">${this.getDifficultyLabel(template.difficulty)}</span>
            </div>
            <button class="template-favorite ${isFavorite ? 'active' : ''}"
                    data-template-id="${template.id}"
                    title="收藏模板">
              <span class="favorite-icon">${isFavorite ? '❤️' : '🤍'}</span>
            </button>
          </div>

          <p class="template-description">${template.description}</p>

          <div class="template-params">
            ${template.parameters.slice(0, 3).map(param => `
              <span class="template-param">
                ${param.label}: ${this.formatDefaultValue(param)}
              </span>
            `).join('')}
            ${template.parameters.length > 3 ? '<span class="template-param">...</span>' : ''}
          </div>

          <div class="template-tags">
            ${template.tags.slice(0, 3).map(tag => `
              <span class="tag">${tag}</span>
            `).join('')}
          </div>

          ${matchInfo}

          <div class="template-actions">
            <button class="template-btn preview-btn" data-template-id="${template.id}">
              预览
            </button>
            <button class="template-btn select-btn" data-template-id="${template.id}">
              选择
            </button>
          </div>
        </div>
      `;
    }

    bindTemplateCardEvents() {
      // 模板卡片点击
      this.elements.categoriesContainer.querySelectorAll('.template-card').forEach(card => {
        card.addEventListener('click', (e) => {
          // 如果点击的是按钮，不触发卡片选择
          if (e.target.closest('.template-actions, .template-favorite')) {
            return;
          }

          const templateId = card.dataset.templateId;
          this.selectTemplate(templateId);
        });
      });

      // 预览按钮
      this.elements.categoriesContainer.querySelectorAll('.preview-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const templateId = btn.dataset.templateId;
          this.previewTemplate(templateId);
        });
      });

      // 选择按钮
      this.elements.categoriesContainer.querySelectorAll('.select-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const templateId = btn.dataset.templateId;
          this.selectTemplate(templateId);
          this.applyTemplate(templateId);
        });
      });

      // 收藏按钮
      this.elements.categoriesContainer.querySelectorAll('.template-favorite').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const templateId = btn.dataset.templateId;
          this.toggleFavorite(templateId);
        });
      });
    }

    selectTemplate(templateId) {
      const template = this.findTemplate(templateId);
      if (!template) return;

      this.state.selectedTemplate = template;

      // 更新UI状态
      this.elements.categoriesContainer.querySelectorAll('.template-card').forEach(card => {
        card.classList.toggle('selected', card.dataset.templateId === templateId);
      });

      this.emit('template-selected', { template });
    }

    applyTemplate(templateId) {
      const template = this.findTemplate(templateId);
      if (!template) return;

      // 切换到文本输入模式
      const textModeBtn = document.querySelector('[data-mode="text"]');
      if (textModeBtn && !textModeBtn.classList.contains('active')) {
        textModeBtn.click();
      }

      // 生成提示文本
      const promptText = this.generatePromptFromTemplate(template);

      // 设置到输入框
      const input = document.querySelector('#mainInput');
      if (input) {
        input.value = promptText;
        input.dispatchEvent(new Event('input'));
      }

      this.emit('template-applied', { template, promptText });
    }

    previewTemplate(templateId) {
      const template = this.findTemplate(templateId);
      if (!template) return;

      this.emit('template-preview', { template });
    }

    toggleFavorite(templateId) {
      const index = this.state.favorites.indexOf(templateId);
      const isFavorite = index > -1;

      if (isFavorite) {
        this.state.favorites.splice(index, 1);
      } else {
        this.state.favorites.push(templateId);
      }

      this.saveFavorites();

      // 更新UI
      const btn = document.querySelector(`.template-favorite[data-template-id="${templateId}"]`);
      if (btn) {
        btn.classList.toggle('active', !isFavorite);
        const icon = btn.querySelector('.favorite-icon');
        if (icon) {
          icon.textContent = !isFavorite ? '❤️' : '🤍';
        }
      }

      this.emit('favorite-toggled', { templateId, isFavorite: !isFavorite });
    }

    generatePromptFromTemplate(template) {
      // 生成基于模板的提示文本
      let prompt = template.name;

      // 添加参数
      const params = template.parameters
        .filter(param => param.default !== undefined)
        .map(param => `${param.label}: ${this.formatDefaultValue(param)}`)
        .join(' ');

      if (params) {
        prompt += ` ${params}`;
      }

      return prompt;
    }

    formatDefaultValue(param) {
      if (param.type === 'matrix' && Array.isArray(param.default)) {
        return `[${param.default.map(row => `[${row.join(',')}]`).join(',')}]`;
      }
      return param.default;
    }

    findTemplate(templateId) {
      if (!this.state.categories) return null;

      for (const category of this.state.categories) {
        const template = category.templates.find(t => t.id === templateId);
        if (template) return template;
      }
      return null;
    }

    getDifficultyLabel(difficulty) {
      const labels = {
        '初级': 'beginner',
        '中级': 'intermediate',
        '高级': 'advanced'
      };
      return labels[difficulty] || difficulty;
    }

    loadFavorites() {
      try {
        return JSON.parse(localStorage.getItem('template-favorites') || '[]');
      } catch {
        return [];
      }
    }

    saveFavorites() {
      try {
        localStorage.setItem('template-favorites', JSON.stringify(this.state.favorites));
      } catch (error) {
        console.warn('Failed to save favorites:', error);
      }
    }

    getFavorites() {
      return this.state.favorites.map(id => this.findTemplate(id)).filter(Boolean);
    }

    getPopularTemplates() {
      if (!this.state.templates) return [];

      const popularIds = this.state.templates.popularTemplates || [];
      return popularIds.map(id => this.findTemplate(id)).filter(Boolean);
    }

    getCategoryById(categoryId) {
      if (!this.state.categories) return null;
      return this.state.categories.find(c => c.id === categoryId);
    }

    getTemplatesByCategory(categoryId) {
      const category = this.getCategoryById(categoryId);
      return category ? category.templates : [];
    }

    // ===================================
    // 新增的筛选和排序方法
    // ===================================

    getFilteredCategories() {
      if (!this.state.categories) return [];

      return this.state.categories.map(category => {
        let filteredTemplates = [...category.templates];

        // 按难度筛选
        if (this.state.selectedDifficulty) {
          filteredTemplates = filteredTemplates.filter(template =>
            template.difficulty === this.state.selectedDifficulty
          );
        }

        // 按子分类筛选
        if (this.state.selectedSubcategory) {
          filteredTemplates = filteredTemplates.filter(template =>
            template.subcategory === this.state.selectedSubcategory
          );
        }

        // 排序
        filteredTemplates = this.sortTemplates(filteredTemplates);

        return {
          ...category,
          templates: filteredTemplates
        };
      }).filter(category =>
        // 如果选择了分类，只显示该分类
        !this.state.selectedCategory || category.id === this.state.selectedCategory
      );
    }

    sortTemplates(templates) {
      return templates.sort((a, b) => {
        let aValue, bValue;

        switch (this.state.sortBy) {
          case 'difficulty':
            const difficultyOrder = { '初级': 1, '中级': 2, '高级': 3 };
            aValue = difficultyOrder[a.difficulty] || 0;
            bValue = difficultyOrder[b.difficulty] || 0;
            break;
          case 'popularity':
            aValue = this.state.favorites.includes(a.id) ? 1 : 0;
            bValue = this.state.favorites.includes(b.id) ? 1 : 0;
            break;
          case 'name':
          default:
            aValue = a.name.toLowerCase();
            bValue = b.name.toLowerCase();
            break;
        }

        if (aValue < bValue) return this.state.sortOrder === 'asc' ? -1 : 1;
        if (aValue > bValue) return this.state.sortOrder === 'asc' ? 1 : -1;
        return 0;
      });
    }

    bindControlEvents() {
      // 分类筛选
      const categoryFilter = document.getElementById('categoryFilter');
      if (categoryFilter) {
        categoryFilter.addEventListener('change', (e) => {
          this.state.selectedCategory = e.target.value || null;
          this.renderCategories();
        });
      }

      // 难度筛选
      const difficultyFilter = document.getElementById('difficultyFilter');
      if (difficultyFilter) {
        difficultyFilter.addEventListener('change', (e) => {
          this.state.selectedDifficulty = e.target.value || null;
          this.renderCategories();
        });
      }

      // 排序
      const sortBy = document.getElementById('sortBy');
      if (sortBy) {
        sortBy.addEventListener('change', (e) => {
          this.state.sortBy = e.target.value;
          this.renderCategories();
        });
      }

      // 清除筛选
      const clearFilters = document.getElementById('clearFilters');
      if (clearFilters) {
        clearFilters.addEventListener('click', () => {
          this.clearFilters();
        });
      }

      // 分类展开/收起
      const categoryToggles = document.querySelectorAll('.category-toggle');
      categoryToggles.forEach(toggle => {
        toggle.addEventListener('click', (e) => {
          const categoryId = e.currentTarget.dataset.category;
          this.toggleCategory(categoryId);
        });
      });
    }

    toggleCategory(categoryId) {
      if (this.state.selectedCategory === categoryId) {
        this.state.selectedCategory = null;
      } else {
        this.state.selectedCategory = categoryId;
      }
      this.renderCategories();
    }

    clearFilters() {
      this.state.selectedCategory = null;
      this.state.selectedSubcategory = null;
      this.state.selectedDifficulty = null;
      this.state.sortBy = 'name';
      this.state.sortOrder = 'asc';
      this.renderCategories();
    }

    // 最近查看功能
    loadRecentlyViewed() {
      try {
        const viewed = localStorage.getItem('template-recently-viewed');
        return viewed ? JSON.parse(viewed) : [];
      } catch (error) {
        console.warn('Failed to load recently viewed templates:', error);
        return [];
      }
    }

    saveRecentlyViewed() {
      try {
        localStorage.setItem('template-recently-viewed', JSON.stringify(this.state.recentlyViewed));
      } catch (error) {
        console.warn('Failed to save recently viewed templates:', error);
      }
    }

    addToRecentlyViewed(templateId) {
      // 移除重复项
      this.state.recentlyViewed = this.state.recentlyViewed.filter(id => id !== templateId);

      // 添加到开头
      this.state.recentlyViewed.unshift(templateId);

      // 限制数量
      this.state.recentlyViewed = this.state.recentlyViewed.slice(0, 10);

      this.saveRecentlyViewed();
    }

    getRecentlyViewedTemplates() {
      return this.state.recentlyViewed
        .map(id => this.findTemplate(id))
        .filter(Boolean);
    }

    // 推荐模板功能
    getRecommendedTemplates() {
      if (!this.state.categories) return [];

      const allTemplates = this.state.categories.flatMap(cat => cat.templates);

      // 基于收藏和最近查看的推荐
      const favorites = this.state.favorites;
      const recentlyViewed = this.state.recentlyViewed;

      if (favorites.length === 0 && recentlyViewed.length === 0) {
        // 如果没有历史记录，返回热门模板
        return allTemplates.filter(template =>
          template.tags.includes('热门') || template.difficulty === '初级'
        ).slice(0, 6);
      }

      // 基于历史推荐相似模板
      const userCategories = new Set();
      const userDifficulties = new Set();

      [...favorites, ...recentlyViewed].forEach(templateId => {
        const template = this.findTemplate(templateId);
        if (template) {
          const category = this.getCategoryByTemplate(templateId);
          if (category) userCategories.add(category.id);
          userDifficulties.add(template.difficulty);
        }
      });

      return allTemplates
        .filter(template => {
          const category = this.getCategoryByTemplate(template.id);
          return category && userCategories.has(category.id) &&
                 !favorites.includes(template.id) &&
                 !recentlyViewed.includes(template.id);
        })
        .slice(0, 6);
    }

    getCategoryByTemplate(templateId) {
      if (!this.state.categories) return null;

      return this.state.categories.find(category =>
        category.templates.some(template => template.id === templateId)
      );
    }

    // 统计信息
    getStatistics() {
      if (!this.state.categories) return null;

      const stats = {
        totalTemplates: 0,
        categoryStats: {},
        difficultyStats: { '初级': 0, '中级': 0, '高级': 0 },
        favoriteCount: this.state.favorites.length,
        recentlyViewedCount: this.state.recentlyViewed.length
      };

      this.state.categories.forEach(category => {
        stats.categoryStats[category.id] = {
          name: category.name,
          count: category.templates.length,
          icon: category.icon
        };
        stats.totalTemplates += category.templates.length;

        category.templates.forEach(template => {
          stats.difficultyStats[template.difficulty]++;
        });
      });

      return stats;
    }

    emit(eventName, data) {
      const event = new CustomEvent(`template-selector:${eventName}`, {
        detail: data,
        bubbles: true
      });
      document.dispatchEvent(event);
    }

    on(eventName, handler) {
      document.addEventListener(`template-selector:${eventName}`, handler);
    }

    off(eventName, handler) {
      document.removeEventListener(`template-selector:${eventName}`, handler);
    }

    destroy() {
      // 清理事件监听器
      this.elements.modeButtons.forEach(btn => {
        btn.removeEventListener('click', this.handleModeToggle);
      });

      if (this.elements.searchInput) {
        this.elements.searchInput.removeEventListener('input', this.handleSearch);
        this.elements.searchInput.removeEventListener('keydown', this.handleSearchKeyDown);
      }
    }
  }

  // 导出到全局
  global.TemplateSelector = TemplateSelector;

})(window);