/**
 * SmartInput.js - 智能输入框组件
 * 支持自然语言输入、智能提示、自动补全、快捷键等功能
 */
(function(global) {
  'use strict';

  class SmartInput {
    constructor(options = {}) {
      this.options = {
        inputSelector: '#mainInput',
        suggestionsContainer: '#suggestionsContainer',
        suggestionsList: '#suggestionsList',
        charCountSelector: '.char-count',
        generateBtnSelector: '#generateBtn',
        // 新增元素ID配置
        textareaId: 'mainInput',
        submitBtnId: 'generateBtn',
        clearBtnId: 'clearInputBtn',
        historyBtnId: 'historyBtn',
        templateBtnId: 'templateBtn',
        historyPanelId: 'historyPanel',
        templatePanelId: 'templatePanel',
        autocompleteListId: 'autocompleteList',
        maxChars: 500,
        debounceDelay: 300,
        enableAutoComplete: true,
        enableSmartSuggestions: true,
        enableInputHistory: true,
        enableFormatValidation: true,
        enableRealTimeValidation: true,
        maxHistoryItems: 10,
        ...options
      };

      this.state = {
        currentValue: '',
        suggestions: [],
        selectedSuggestionIndex: -1,
        isLoading: false,
        lastSuggestionsTime: 0,
        inputHistory: this.loadInputHistory(),
        validationState: {
          isValid: true,
          errors: [],
          warnings: []
        },
        // 初始化状态跟踪
        initializationStatus: 'pending',
        initializationStartTime: Date.now(),
        initializationAttempts: 0,
        lastError: null,
        elementBindingTime: null,
        eventsBound: false,
        eventBindingTime: null
      };

      this.elements = {};
      this.domElements = {}; // 新增DOM元素缓存
      this.debounceTimer = null;
      this.validationTimer = null;
      this.eventListenersAttached = false;
      this.eventListeners = []; // 新增事件监听器列表
      this.formSubmitHandler = null; // 表单提交处理器
      this.externalEventHandlers = null; // 外部事件处理器

      this.init();
    }

    init() {
      this.state.initializationStatus = 'initializing';

      // 添加DOM就绪检查
      if (document.readyState !== 'complete') {
        console.log('SmartInput: Waiting for DOM to be ready...');

        document.addEventListener('DOMContentLoaded', () => {
          setTimeout(() => {
            this.init();
          }, 100);
        }, { once: true });

        return;
      }

      // 检查浏览器环境
      if (!window.document || !window.document.querySelector) {
        this.handleInitializationError('ENVIRONMENT_ERROR', 'DOM not available');
        return;
      }

      const elementsFound = this.bindElements();

      if (elementsFound) {
        this.bindEvents();
        this.updateCharCount();

        // 验证初始化
        if (this.validateInitialization()) {
          this.state.initializationStatus = 'success';
          this.emit('initialization-success', {
            totalTime: Date.now() - this.state.initializationStartTime,
            attempts: 1,
            domState: this.getDOMState()
          });
          console.log('SmartInput: Initialization successful on first attempt');
        } else {
          // 验证失败，触发重试
          this.handleInitializationError('VALIDATION_FAILED', 'Initial validation failed');
        }
      } else {
        // 元素未找到，重试机制已在bindElements中触发
        console.warn('SmartInput: Elements not found, scheduling retry...');
      }
    }

    bindElements() {
      // 检查必需的核心元素
      this.elements.input = document.querySelector(this.options.inputSelector);
      this.elements.generateBtn = document.querySelector(this.options.generateBtnSelector);

      // 检查可选元素
      this.elements.suggestionsContainer = document.querySelector(this.options.suggestionsContainer);
      this.elements.suggestionsList = document.querySelector(this.options.suggestionsList);
      this.elements.charCount = document.querySelector(this.options.charCountSelector);
      this.elements.closeSuggestions = document.querySelector('#closeSuggestions');

      // 验证核心元素
      if (!this.elements.input) {
        this.handleInitializationError('INPUT_NOT_FOUND',
          `Input element not found: ${this.options.inputSelector}`);
        return false;
      }

      if (!this.elements.generateBtn) {
        console.warn('SmartInput: Generate button not found:', this.options.generateBtnSelector);
        // 生成按钮是可选的，不影响核心功能
      }

      // 更新初始化状态
      this.state.initializationStatus = 'elements_found';
      this.state.elementBindingTime = Date.now();

      return true;
    }

    handleInitializationError(errorType, details) {
      this.state.initializationStatus = 'failed';
      this.state.lastError = {
        type: errorType,
        details: details,
        timestamp: Date.now(),
        attemptCount: this.state.initializationAttempts,
        domState: this.getDOMState()
      };

      console.error('SmartInput initialization error:', this.state.lastError);

      // 触发错误事件
      this.emit('initialization-error', this.state.lastError);

      // 如果是元素未找到错误，尝试重试
      if (errorType === 'INPUT_NOT_FOUND' && this.state.initializationAttempts < 5) {
        this.scheduleInitializationRetry();
      }
    }

    scheduleInitializationRetry() {
      this.state.initializationAttempts++;
      const delay = Math.min(200 * Math.pow(2, this.state.initializationAttempts - 1), 2000);

      console.log(`SmartInput: Scheduling retry attempt ${this.state.initializationAttempts} in ${delay}ms`);

      setTimeout(() => {
        if (this.state.initializationStatus !== 'success') {
          console.log(`SmartInput: Retry attempt ${this.state.initializationAttempts}`);
          this.retryInitialization();
        }
      }, delay);
    }

    retryInitialization() {
      try {
        this.state.initializationStatus = 'retrying';

        // 重新绑定元素
        const elementsFound = this.bindElements();

        if (elementsFound) {
          // 元素绑定成功，继续事件绑定
          this.bindEvents();

          if (this.validateInitialization()) {
            this.state.initializationStatus = 'success';
            this.emit('initialization-success', {
              attemptCount: this.state.initializationAttempts,
              totalTime: Date.now() - this.state.initializationStartTime
            });
            console.log('SmartInput: Initialization successful after retries');
            return true;
          }
        }

        // 如果仍然失败，继续重试或降级
        if (this.state.initializationAttempts >= 5) {
          this.handleMaxRetriesExceeded();
        }

      } catch (error) {
        this.handleInitializationError('RETRY_ERROR', error.message);
      }

      return false;
    }

    handleMaxRetriesExceeded() {
      this.state.initializationStatus = 'failed_max_retries';
      console.error('SmartInput: Maximum initialization retries exceeded');

      // 触发降级机制
      this.emit('initialization-failed', {
        reason: 'max_retries_exceeded',
        attempts: this.state.initializationAttempts,
        lastError: this.state.lastError
      });
    }

    getDOMState() {
      return {
        documentReady: document.readyState,
        mainInput: !!document.querySelector(this.options.inputSelector),
        generateBtn: !!document.querySelector(this.options.generateBtnSelector),
        suggestionsContainer: !!document.querySelector(this.options.suggestionsContainer),
        suggestionsList: !!document.querySelector(this.options.suggestionsList),
        charCount: !!document.querySelector(this.options.charCountSelector),
        closeSuggestions: !!document.querySelector('#closeSuggestions'),
        timestamp: Date.now()
      };
    }

    validateInitialization() {
      const requiredElements = ['input'];
      const missingElements = [];

      requiredElements.forEach(elementName => {
        if (!this.elements[elementName]) {
          missingElements.push(elementName);
        }
      });

      if (missingElements.length > 0) {
        this.handleInitializationError('VALIDATION_FAILED',
          `Missing required elements: ${missingElements.join(', ')}`);
        return false;
      }

      // 检查事件监听器是否绑定成功
      if (!this.eventListenersAttached) {
        this.handleInitializationError('EVENTS_NOT_BOUND', 'Event listeners not attached');
        return false;
      }

      return true;
    }

    /**
     * 解绑事件监听器 - 支持完整的清理
     */
    unbindEvents() {
      try {
        // 清理所有事件监听器
        if (this.eventListeners && this.eventListeners.length > 0) {
          this.eventListeners.forEach(({ element, event, handler }) => {
            if (element) {
              element.removeEventListener(event, handler);
              console.log(`SmartInput: Unbound ${event} event from`, element.tagName);
            }
          });
          this.eventListeners = [];
        }

        // 清理表单提交处理器
        const form = this.domElements.textarea?.closest('form');
        if (form && this.formSubmitHandler) {
          form.removeEventListener('submit', this.formSubmitHandler);
          this.formSubmitHandler = null;
        }

        // 清理外部事件监听器
        this.unbindExternalEvents();

        console.log('SmartInput: All events unbound successfully');
      } catch (error) {
        console.error('SmartInput: Error unbinding events:', error);
      }
    }

    /**
     * 绑定外部事件监听器
     */
    bindExternalEvents() {
      // 监听应用级别的事件
      this.externalEventHandlers = {
        'template:selected': this.handleTemplateSelected.bind(this),
        'theme:changed': this.handleThemeChanged.bind(this),
        'app:resize': this.handleAppResize.bind(this)
      };

      Object.entries(this.externalEventHandlers).forEach(([event, handler]) => {
        document.addEventListener(event, handler);
      });
    }

    /**
     * 解绑外部事件监听器
     */
    unbindExternalEvents() {
      if (this.externalEventHandlers) {
        Object.entries(this.externalEventHandlers).forEach(([event, handler]) => {
          document.removeEventListener(event, handler);
        });
        this.externalEventHandlers = null;
      }
    }

    /**
     * 重新缓存DOM元素引用
     */
    cacheElements() {
      // 更新新的DOM元素缓存
      this.domElements = {
        textarea: document.getElementById(this.options.textareaId),
        submitBtn: document.getElementById(this.options.submitBtnId),
        clearBtn: document.getElementById(this.options.clearBtnId),
        historyBtn: document.getElementById(this.options.historyBtnId),
        templateBtn: document.getElementById(this.options.templateBtnId),
        historyPanel: document.getElementById(this.options.historyPanelId),
        templatePanel: document.getElementById(this.options.templatePanelId),
        autocompleteList: document.getElementById(this.options.autocompleteListId)
      };

      // 保持与旧元素系统的兼容性
      this.elements.input = this.domElements.textarea;
      this.elements.generateBtn = this.domElements.submitBtn;

      // 其他可能的元素
      const suggestionsContainer = document.querySelector(this.options.suggestionsContainer);
      if (suggestionsContainer) {
        this.elements.suggestionsContainer = suggestionsContainer;
      }

      const suggestionsList = document.querySelector(this.options.suggestionsList);
      if (suggestionsList) {
        this.elements.suggestionsList = suggestionsList;
      }

      const charCount = document.querySelector(this.options.charCountSelector);
      if (charCount) {
        this.elements.charCount = charCount;
      }
    }

    /**
     * 动态检查和重新绑定缺失的元素
     */
    rebindMissingElements() {
      let rebound = false;

      // 检查关键元素
      const criticalElements = ['textarea', 'submitBtn'];

      criticalElements.forEach(elementName => {
        if (!this.domElements[elementName]) {
          const elementId = this.options[`${elementName.replace('Btn', '').replace('Panel', '').replace('List', '')}Id`];
          const element = document.getElementById(elementId);

          if (element) {
            this.domElements[elementName] = element;
            console.log(`SmartInput: Found missing element: ${elementName}`);
            rebound = true;
          }
        }
      });

      if (rebound) {
        console.log('SmartInput: Rebinding events due to newly found elements');
        this.bindEvents();
      }
    }

    bindEvents() {
      try {
        // 清理之前的事件监听器
        this.unbindEvents();

        // 重新获取DOM元素引用
        this.cacheElements();

        // 检查必要元素是否存在
        if (!this.domElements.textarea || !this.domElements.submitBtn) {
          console.warn('SmartInput: Required elements not found, retrying...');
          // 延迟重试
          setTimeout(() => {
            if (this.state.initializationStatus === 'initialized') {
              this.bindEvents();
            }
          }, 200);
          return false;
        }

        const events = [
          // 输入框事件
          { element: this.domElements.textarea, event: 'input', handler: this.handleInput.bind(this) },
          { element: this.domElements.textarea, event: 'keydown', handler: this.handleKeyDown.bind(this) },
          { element: this.domElements.textarea, event: 'focus', handler: this.handleFocus.bind(this) },
          { element: this.domElements.textarea, event: 'blur', handler: this.handleBlur.bind(this) },

          // 按钮事件
          { element: this.domElements.submitBtn, event: 'click', handler: this.handleSubmit.bind(this) },

          // 快捷操作按钮
          { element: this.domElements.clearBtn, event: 'click', handler: this.handleClear.bind(this) },
          { element: this.domElements.historyBtn, event: 'click', handler: this.handleHistoryToggle.bind(this) },
          { element: this.domElements.templateBtn, event: 'click', handler: this.handleTemplateToggle.bind(this) },

          // 历史记录和模板面板事件
          { element: this.domElements.historyPanel, event: 'click', handler: this.handleHistorySelect.bind(this) },
          { element: this.domElements.templatePanel, event: 'click', handler: this.handleTemplateSelect.bind(this) },

          // 自动补全事件
          { element: this.domElements.autocompleteList, event: 'click', handler: this.handleAutocompleteSelect.bind(this) }
        ];

        // 绑定所有事件监听器
        this.eventListeners = [];
        events.forEach(({ element, event, handler }) => {
          if (element) {
            element.addEventListener(event, handler);
            this.eventListeners.push({ element, event, handler });
            console.log(`SmartInput: Bound ${event} event to`, element.tagName, element.id || element.className);
          } else {
            console.warn(`SmartInput: Element not found for ${event} event`);
          }
        });

        // 绑定外部事件监听器
        this.bindExternalEvents();

        // 设置表单提交处理
        const form = this.domElements.textarea.closest('form');
        if (form) {
          this.formSubmitHandler = (e) => {
            e.preventDefault();
            this.handleSubmit();
          };
          form.addEventListener('submit', this.formSubmitHandler);
          console.log('SmartInput: Bound form submit handler');
        }

        console.log(`SmartInput: Bound ${this.eventListeners.length} event listeners`);
        this.state.eventsBound = true;
        return true;

      } catch (error) {
        console.error('SmartInput: Error binding events:', error);
        this.state.eventsBound = false;
        return false;
      }
    }

    handleInput(event) {
      const value = event.target.value;
      this.state.currentValue = value;

      // 更新字符计数
      this.updateCharCount();

      // 更新生成按钮状态
      this.updateGenerateButton();

      // 实时验证
      if (this.options.enableRealTimeValidation) {
        this.debouncedValidate(value);
      }

      // 处理智能建议
      if (this.options.enableSmartSuggestions) {
        this.debouncedGetSuggestions(value);
      }
    }

    handleKeyDown(event) {
      const key = event.key;
      const ctrlKey = event.ctrlKey || event.metaKey;

      // Ctrl+Enter 快速提交
      if (key === 'Enter' && ctrlKey) {
        event.preventDefault();
        this.handleGenerate();
        return;
      }

      // Ctrl+Space 显示历史记录
      if (key === ' ' && ctrlKey) {
        event.preventDefault();
        this.showInputHistory();
        return;
      }

      // Ctrl+/ 显示快捷键帮助
      if (key === '/' && ctrlKey) {
        event.preventDefault();
        this.showShortcutHelp();
        return;
      }

      // Enter 选择建议
      if (key === 'Enter' && this.state.selectedSuggestionIndex >= 0) {
        event.preventDefault();
        this.selectSuggestion(this.state.selectedSuggestionIndex);
        return;
      }

      // Tab 自动补全
      if (key === 'Tab' && this.state.suggestions.length > 0 && this.state.selectedSuggestionIndex >= 0) {
        event.preventDefault();
        this.selectSuggestion(this.state.selectedSuggestionIndex);
        return;
      }

      // 方向键导航建议
      if (this.state.suggestions.length > 0) {
        if (key === 'ArrowDown') {
          event.preventDefault();
          this.navigateSuggestions(1);
        } else if (key === 'ArrowUp') {
          event.preventDefault();
          this.navigateSuggestions(-1);
        } else if (key === 'Escape') {
          event.preventDefault();
          this.hideSuggestions();
        }
      }
    }

    handleFocus() {
      if (this.state.currentValue.trim()) {
        this.showSuggestions();
      }
    }

    handleBlur() {
      // 延迟隐藏建议，允许点击建议项
      setTimeout(() => {
        this.hideSuggestions();
      }, 200);
    }

    handleDocumentClick(event) {
      if (!this.elements.input.contains(event.target) &&
          !this.elements.suggestionsContainer.contains(event.target)) {
        this.hideSuggestions();
      }
    }

    handleGenerate() {
      const value = this.state.currentValue.trim();
      if (!value) {
        this.showError('请输入可视化需求描述');
        return;
      }

      // 验证输入
      if (this.options.enableFormatValidation && !this.validateInput(value)) {
        return;
      }

      // 添加到历史记录
      if (this.options.enableInputHistory) {
        this.addToInputHistory(value);
      }

      // 隐藏建议
      this.hideSuggestions();

      // 触发生成事件
      this.emit('generate', {
        prompt: value,
        timestamp: Date.now(),
        validationState: this.state.validationState
      });
    }

    debouncedGetSuggestions(value) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = setTimeout(() => {
        this.getSuggestions(value);
      }, this.options.debounceDelay);
    }

    async getSuggestions(query) {
      if (!query.trim()) {
        this.hideSuggestions();
        return;
      }

      // 防抖检查
      const now = Date.now();
      if (now - this.state.lastSuggestionsTime < 100) {
        return;
      }
      this.state.lastSuggestionsTime = now;

      try {
        this.state.isLoading = true;

        // 获取建议（这里可以接入API或本地数据）
        const suggestions = await this.fetchSuggestions(query);

        this.state.suggestions = suggestions;
        this.state.selectedSuggestionIndex = -1;

        if (suggestions.length > 0) {
          this.renderSuggestions(suggestions);
          this.showSuggestions();
        } else {
          this.hideSuggestions();
        }
      } catch (error) {
        console.error('SmartInput: Error fetching suggestions:', error);
        this.hideSuggestions();
      } finally {
        this.state.isLoading = false;
      }
    }

    async fetchSuggestions(query) {
      // 本地建议数据
      const localSuggestions = this.getLocalSuggestions(query);

      // 如果本地建议足够，直接返回
      if (localSuggestions.length >= 3) {
        return localSuggestions.slice(0, 5);
      }

      // TODO: 可以接入API获取智能建议
      // const apiSuggestions = await this.callSuggestionAPI(query);
      // return [...localSuggestions, ...apiSuggestions].slice(0, 5);

      return localSuggestions;
    }

    getLocalSuggestions(query) {
      const suggestions = [];
      const lowerQuery = query.toLowerCase();

      // 预定义的建议模板
      const templates = [
        {
          text: '正态分布',
          desc: '标准正态分布概率密度函数',
          category: 'math',
          params: { mu: 0, sigma: 1 }
        },
        {
          text: '二项分布',
          desc: '二项分布概率质量函数',
          category: 'math',
          params: { n: 20, p: 0.5 }
        },
        {
          text: '泊松分布',
          desc: '泊松分布概率质量函数',
          category: 'math',
          params: { lambda: 4 }
        },
        {
          text: '行星运动轨迹',
          desc: '地球绕太阳运动轨迹',
          category: 'astronomy',
          params: { planet: 'earth', period: 365 }
        },
        {
          text: '月相变化',
          desc: '一个月周期内的月相变化',
          category: 'astronomy',
          params: { days: 30 }
        },
        {
          text: '简谐振动',
          desc: '简谐振动位移时间图像',
          category: 'physics',
          params: { amplitude: 1, frequency: 1, phase: 0 }
        },
        {
          text: '自由落体',
          desc: '自由落体运动速度时间图像',
          category: 'physics',
          params: { height: 100, gravity: 9.8 }
        },
        {
          text: '二次函数',
          desc: '二次函数 y = ax² + bx + c 图像',
          category: 'math',
          params: { a: 1, b: 2, c: 1 }
        },
        {
          text: '三角函数',
          desc: '正弦、余弦函数图像',
          category: 'math',
          params: { function: 'sin', amplitude: 1, frequency: 1 }
        },
        {
          text: '矩阵变换',
          desc: '2D矩阵变换可视化',
          category: 'math',
          params: { matrix: [[1, 0], [0, 1]] }
        }
      ];

      // 过滤匹配的建议
      for (const template of templates) {
        if (template.text.toLowerCase().includes(lowerQuery) ||
            template.desc.toLowerCase().includes(lowerQuery)) {
          suggestions.push({
            ...template,
            displayText: this.highlightMatch(template.text, query)
          });
        }
      }

      // 如果查询很短，添加热门建议
      if (query.length < 3 && suggestions.length < 3) {
        const popularSuggestions = templates.slice(0, 5 - suggestions.length);
        for (const template of popularSuggestions) {
          if (!suggestions.find(s => s.text === template.text)) {
            suggestions.push({
              ...template,
              displayText: template.text
            });
          }
        }
      }

      return suggestions;
    }

    highlightMatch(text, query) {
      if (!query.trim()) return text;

      const regex = new RegExp(`(${query})`, 'gi');
      return text.replace(regex, '<mark>$1</mark>');
    }

    renderSuggestions(suggestions) {
      if (!this.elements.suggestionsList) return;

      this.elements.suggestionsList.innerHTML = suggestions.map((suggestion, index) => `
        <div class="suggestion-item" data-index="${index}" data-text="${suggestion.text}">
          <div class="suggestion-text">${suggestion.displayText || suggestion.text}</div>
          <div class="suggestion-desc">${suggestion.desc}</div>
          ${suggestion.category ? `<div class="suggestion-category">${this.getCategoryLabel(suggestion.category)}</div>` : ''}
        </div>
      `).join('');

      // 绑定点击事件
      this.elements.suggestionsList.querySelectorAll('.suggestion-item').forEach(item => {
        item.addEventListener('click', (e) => {
          const index = parseInt(e.currentTarget.dataset.index);
          this.selectSuggestion(index);
        });

        item.addEventListener('mouseenter', (e) => {
          const index = parseInt(e.currentTarget.dataset.index);
          this.highlightSuggestion(index);
        });
      });
    }

    getCategoryLabel(category) {
      const labels = {
        math: '数学',
        astronomy: '天文',
        physics: '物理',
        chemistry: '化学'
      };
      return labels[category] || category;
    }

    selectSuggestion(index) {
      if (index < 0 || index >= this.state.suggestions.length) return;

      const suggestion = this.state.suggestions[index];
      this.elements.input.value = suggestion.text;
      this.state.currentValue = suggestion.text;

      this.updateCharCount();
      this.updateGenerateButton();
      this.hideSuggestions();

      // 触发建议选择事件
      this.emit('suggestion-selected', {
        suggestion,
        index
      });
    }

    navigateSuggestions(direction) {
      const newIndex = this.state.selectedSuggestionIndex + direction;

      if (newIndex < -1) {
        this.state.selectedSuggestionIndex = this.state.suggestions.length - 1;
      } else if (newIndex >= this.state.suggestions.length) {
        this.state.selectedSuggestionIndex = -1;
      } else {
        this.state.selectedSuggestionIndex = newIndex;
      }

      this.highlightSuggestion(this.state.selectedSuggestionIndex);
    }

    highlightSuggestion(index) {
      const items = this.elements.suggestionsList.querySelectorAll('.suggestion-item');

      items.forEach((item, i) => {
        if (i === index) {
          item.classList.add('selected');
        } else {
          item.classList.remove('selected');
        }
      });
    }

    showSuggestions() {
      if (this.elements.suggestionsContainer && this.state.suggestions.length > 0) {
        this.elements.suggestionsContainer.style.display = 'block';
      }
    }

    hideSuggestions() {
      if (this.elements.suggestionsContainer) {
        this.elements.suggestionsContainer.style.display = 'none';
      }
      this.state.selectedSuggestionIndex = -1;
    }

    updateCharCount() {
      if (!this.elements.charCount) return;

      const length = this.state.currentValue.length;
      const maxLength = this.options.maxChars;

      this.elements.charCount.textContent = `${length} / ${maxLength}`;

      // 更新样式
      if (length > maxLength * 0.9) {
        this.elements.charCount.style.color = 'var(--error)';
      } else if (length > maxLength * 0.7) {
        this.elements.charCount.style.color = 'var(--warning)';
      } else {
        this.elements.charCount.style.color = 'var(--text-muted)';
      }
    }

    updateGenerateButton() {
      if (!this.elements.generateBtn) return;

      const hasContent = this.state.currentValue.trim().length > 0;
      const isValidLength = this.state.currentValue.length <= this.options.maxChars;

      this.elements.generateBtn.disabled = !hasContent || !isValidLength;

      if (hasContent && isValidLength) {
        this.elements.generateBtn.classList.add('active');
      } else {
        this.elements.generateBtn.classList.remove('active');
      }
    }

    showError(message) {
      this.emit('error', { message });
    }

    getValue() {
      return this.state.currentValue;
    }

    setValue(value) {
      this.elements.input.value = value;
      this.state.currentValue = value;
      this.updateCharCount();
      this.updateGenerateButton();
    }

    clear() {
      this.setValue('');
      this.hideSuggestions();
    }

    focus() {
      this.elements.input.focus();
    }

    blur() {
      this.elements.input.blur();
    }

    emit(eventName, data) {
      const event = new CustomEvent(`smart-input:${eventName}`, {
        detail: data,
        bubbles: true
      });
      this.elements.input.dispatchEvent(event);
    }

    on(eventName, handler) {
      this.elements.input.addEventListener(`smart-input:${eventName}`, handler);
    }

    off(eventName, handler) {
      this.elements.input.removeEventListener(`smart-input:${eventName}`, handler);
    }

    // ===================================
    // 新增功能方法
    // ===================================

    /**
     * 输入验证功能
     */
    debouncedValidate(value) {
      clearTimeout(this.validationTimer);
      this.validationTimer = setTimeout(() => {
        this.validateInput(value);
      }, 200);
    }

    validateInput(value) {
      if (!this.options.enableFormatValidation) return true;

      const validationState = {
        isValid: true,
        errors: [],
        warnings: []
      };

      // 长度验证
      if (value.length < 3) {
        validationState.warnings.push('输入内容较短，可能无法生成准确的可视化');
      }

      if (value.length > this.options.maxChars * 0.95) {
        validationState.warnings.push('输入内容接近字符限制，建议简化描述');
      }

      // 内容格式验证
      const contentValidation = this.validateContentFormat(value);
      validationState.errors.push(...contentValidation.errors);
      validationState.warnings.push(...contentValidation.warnings);

      // 关键词验证
      const keywordValidation = this.validateKeywords(value);
      validationState.warnings.push(...keywordValidation.warnings);

      validationState.isValid = validationState.errors.length === 0;
      this.state.validationState = validationState;

      // 更新UI显示验证状态
      this.updateValidationUI();

      return validationState.isValid;
    }

    validateContentFormat(value) {
      const errors = [];
      const warnings = [];

      // 检查是否包含特殊字符过多
      const specialCharCount = (value.match(/[^\w\s\u4e00-\u9fa5,.!?;:()[\]{}]/g) || []).length;
      if (specialCharCount > value.length * 0.3) {
        warnings.push('特殊字符较多，可能影响识别准确性');
      }

      // 检查是否为纯数字
      if (/^\d+$/.test(value)) {
        errors.push('不能只输入数字，请添加描述性文字');
      }

      // 检查是否包含中英文混合的常见问题
      const hasChinese = /[\u4e00-\u9fa5]/.test(value);
      const hasEnglish = /[a-zA-Z]/.test(value);
      if (hasChinese && hasEnglish && value.length < 10) {
        warnings.push('中英文混合输入，建议使用更完整的描述');
      }

      return { errors, warnings };
    }

    validateKeywords(value) {
      const warnings = [];
      const lowerValue = value.toLowerCase();

      // 检查是否包含数学关键词
      const mathKeywords = ['函数', '方程', '图形', '坐标', '函数', 'function', 'graph', 'equation'];
      const astronomyKeywords = ['行星', '轨道', '恒星', '星系', 'planet', 'orbit', 'star'];
      const physicsKeywords = ['运动', '力', '能量', '波动', 'motion', 'force', 'energy', 'wave'];

      const hasMathKeyword = mathKeywords.some(keyword => lowerValue.includes(keyword));
      const hasAstronomyKeyword = astronomyKeywords.some(keyword => lowerValue.includes(keyword));
      const hasPhysicsKeyword = physicsKeywords.some(keyword => lowerValue.includes(keyword));

      if (!hasMathKeyword && !hasAstronomyKeyword && !hasPhysicsKeyword) {
        warnings.push('建议包含具体的关键词，如"函数"、"行星"、"运动"等');
      }

      return { warnings };
    }

    updateValidationUI() {
      // 移除之前的验证状态类
      this.elements.input.classList.remove('validation-error', 'validation-warning');

      if (this.state.validationState.errors.length > 0) {
        this.elements.input.classList.add('validation-error');
      } else if (this.state.validationState.warnings.length > 0) {
        this.elements.input.classList.add('validation-warning');
      }

      // 触发验证状态更新事件
      this.emit('validation-updated', {
        validationState: this.state.validationState
      });
    }

    /**
     * 输入历史功能
     */
    loadInputHistory() {
      if (!this.options.enableInputHistory) return [];

      try {
        const history = localStorage.getItem('smart-input-history');
        return history ? JSON.parse(history) : [];
      } catch (error) {
        console.warn('Failed to load input history:', error);
        return [];
      }
    }

    saveInputHistory() {
      if (!this.options.enableInputHistory) return;

      try {
        localStorage.setItem('smart-input-history', JSON.stringify(this.state.inputHistory));
      } catch (error) {
        console.warn('Failed to save input history:', error);
      }
    }

    addToInputHistory(value) {
      if (!value.trim()) return;

      // 移除重复项
      this.state.inputHistory = this.state.inputHistory.filter(item => item !== value);

      // 添加到开头
      this.state.inputHistory.unshift(value);

      // 限制数量
      this.state.inputHistory = this.state.inputHistory.slice(0, this.options.maxHistoryItems);

      // 保存
      this.saveInputHistory();
    }

    showInputHistory() {
      if (!this.options.enableInputHistory || this.state.inputHistory.length === 0) {
        this.showInfo('暂无输入历史');
        return;
      }

      // 构造历史记录建议
      const historySuggestions = this.state.inputHistory.map((item, index) => ({
        text: item,
        desc: '历史记录',
        category: 'history',
        displayText: item,
        isHistory: true
      }));

      this.state.suggestions = historySuggestions;
      this.renderHistorySuggestions(historySuggestions);
      this.showSuggestions();
    }

    renderHistorySuggestions(suggestions) {
      if (!this.elements.suggestionsList) return;

      this.elements.suggestionsList.innerHTML = suggestions.map((suggestion, index) => `
        <div class="suggestion-item history-item" data-index="${index}" data-text="${suggestion.text}">
          <div class="suggestion-text">
            <span class="history-icon">🕐</span>
            ${suggestion.displayText}
          </div>
          <div class="suggestion-desc">${suggestion.desc}</div>
          <div class="suggestion-actions">
            <button class="history-action-btn" onclick="smartInput.removeFromHistory(${index})" title="删除">
              🗑️
            </button>
          </div>
        </div>
      `).join('');

      // 绑定点击事件
      this.elements.suggestionsList.querySelectorAll('.suggestion-item').forEach(item => {
        item.addEventListener('click', (e) => {
          if (!e.target.classList.contains('history-action-btn')) {
            const index = parseInt(e.currentTarget.dataset.index);
            this.selectSuggestion(index);
          }
        });

        item.addEventListener('mouseenter', (e) => {
          const index = parseInt(e.currentTarget.dataset.index);
          this.highlightSuggestion(index);
        });
      });
    }

    removeFromHistory(index) {
      this.state.inputHistory.splice(index, 1);
      this.saveInputHistory();

      // 重新显示历史记录
      if (this.state.inputHistory.length > 0) {
        this.showInputHistory();
      } else {
        this.hideSuggestions();
      }
    }

    clearInputHistory() {
      if (confirm('确定要清空所有输入历史吗？')) {
        this.state.inputHistory = [];
        this.saveInputHistory();
        this.hideSuggestions();
        this.showInfo('输入历史已清空');
      }
    }

    /**
     * 快捷键帮助功能
     */
    showShortcutHelp() {
      const helpContent = `
        <div class="shortcut-help">
          <h4>快捷键指南</h4>
          <div class="shortcut-list">
            <div class="shortcut-item">
              <kbd>Ctrl</kbd> + <kbd>Enter</kbd>
              <span>快速生成可视化</span>
            </div>
            <div class="shortcut-item">
              <kbd>Ctrl</kbd> + <kbd>Space</kbd>
              <span>显示输入历史</span>
            </div>
            <div class="shortcut-item">
              <kbd>Ctrl</kbd> + <kbd>/</kbd>
              <span>显示快捷键帮助</span>
            </div>
            <div class="shortcut-item">
              <kbd>↑</kbd> / <kbd>↓</kbd>
              <span>导航建议列表</span>
            </div>
            <div class="shortcut-item">
              <kbd>Tab</kbd>
              <span>自动补全选中项</span>
            </div>
            <div class="shortcut-item">
              <kbd>Esc</kbd>
              <span>关闭建议列表</span>
            </div>
          </div>
        </div>
      `;

      this.showModal('快捷键帮助', helpContent);
    }

    /**
     * 格式化功能
     */
    formatInput() {
      let value = this.state.currentValue;

      // 清理多余空格
      value = value.replace(/\s+/g, ' ').trim();

      // 标点符号格式化
      value = value.replace(/\s*([，。！？；：])\s*/g, '$1');
      value = value.replace(/\s*([,\.!?;:])\s*/g, '$1 ');

      // 应用格式化
      this.setValue(value);

      this.showInfo('输入已格式化');
    }

    /**
     * 事件系统
     */
    emit(eventName, data) {
      const event = new CustomEvent(`smart-input:${eventName}`, {
        detail: data,
        bubbles: true
      });
      document.dispatchEvent(event);
    }

    on(eventName, handler) {
      document.addEventListener(`smart-input:${eventName}`, handler);
    }

    off(eventName, handler) {
      document.removeEventListener(`smart-input:${eventName}`, handler);
    }

    /**
     * 状态查询方法
     */
    getInitializationStatus() {
      return {
        status: this.state.initializationStatus,
        attempts: this.state.initializationAttempts,
        lastError: this.state.lastError,
        hasInput: !!this.elements.input,
        hasGenerateBtn: !!this.elements.generateBtn,
        eventsAttached: this.eventListenersAttached,
        totalTime: this.state.initializationStatus === 'success' ?
          Date.now() - this.state.initializationStartTime : null
      };
    }

    isInitialized() {
      return this.state.initializationStatus === 'success' && this.eventListenersAttached;
    }

    /**
     * 通用UI辅助方法
     */
    showModal(title, content) {
      // 触发模态框显示事件，由应用处理
      this.emit('show-modal', { title, content });
    }

    showInfo(message) {
      this.emit('info', { message });
    }

    showError(message) {
      this.emit('error', { message });
    }

    destroy() {
      clearTimeout(this.debounceTimer);
      clearTimeout(this.validationTimer);

      // 使用新的事件清理方法
      this.unbindEvents();

      // 清理状态
      this.state.initializationStatus = 'destroyed';
      console.log('SmartInput: Component destroyed');
    }

    // ==================== 新增的事件处理器 ====================

    /**
     * 处理表单提交
     */
    handleSubmit() {
      this.handleGenerate();
    }

    /**
     * 处理清除输入
     */
    handleClear() {
      this.clearInput();
      this.emit('input:cleared');
    }

    /**
     * 处理历史记录切换
     */
    handleHistoryToggle(event) {
      event.preventDefault();
      this.toggleInputHistory();
    }

    /**
     * 处理模板切换
     */
    handleTemplateToggle(event) {
      event.preventDefault();
      this.emit('template:toggle');
    }

    /**
     * 处理历史记录选择
     */
    handleHistorySelect(event) {
      const item = event.target.closest('[data-history-item]');
      if (item) {
        const historyItem = JSON.parse(item.dataset.historyItem);
        this.setInputValue(historyItem.text);
        this.hideInputHistory();
        this.emit('history:selected', historyItem);
      }
    }

    /**
     * 处理模板选择
     */
    handleTemplateSelect(event) {
      const item = event.target.closest('[data-template-id]');
      if (item) {
        const templateId = item.dataset.templateId;
        this.emit('template:selected', { templateId });
      }
    }

    /**
     * 处理自动补全选择
     */
    handleAutocompleteSelect(event) {
      const item = event.target.closest('[data-suggestion-index]');
      if (item) {
        const index = parseInt(item.dataset.suggestionIndex);
        this.selectSuggestion(index);
      }
    }

    /**
     * 处理模板选择事件（外部）
     */
    handleTemplateSelected(event) {
      const { templateId } = event.detail;
      console.log('SmartInput: Template selected:', templateId);
    }

    /**
     * 处理主题变更事件（外部）
     */
    handleThemeChanged(event) {
      const { theme } = event.detail;
      console.log('SmartInput: Theme changed to:', theme);
    }

    /**
     * 处理应用尺寸变更事件（外部）
     */
    handleAppResize(event) {
      const { width, height } = event.detail;
      console.log('SmartInput: App resized to:', width, 'x', height);
    }
  }

  // 导出到全局
  global.SmartInput = SmartInput;

})(window);