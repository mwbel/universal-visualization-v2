/**
 * IntelligentInputProcessor.js - 智能输入处理器
 * 负责处理三种输入模式的统一接口和智能解析
 */
(function(global) {
  'use strict';

  /**
   * 智能输入处理器类
   */
  class IntelligentInputProcessor {
    constructor(options = {}) {
      this.options = {
        // 处理器配置
        enableNLP: true,
        enableCache: true,
        enableLearning: true,
        cacheSize: 100,
        cacheTimeout: 30 * 60 * 1000, // 30分钟

        // 模式配置
        defaultMode: 'text', // text, template, concept
        modes: ['text', 'template', 'concept'],

        // NLP配置
        minInputLength: 3,
        maxInputLength: 500,
        debounceDelay: 300,

        // 匹配配置
        similarityThreshold: 0.3,
        maxResults: 5,

        ...options
      };

      // 状态管理
      this.state = {
        currentMode: this.options.defaultMode,
        processing: false,
        lastInput: '',
        lastResult: null,
        cache: new Map(),
        learning: {
          userHistory: [],
          preferences: {},
          feedback: []
        }
      };

      // 组件引用
      this.templateMatcher = null;
      this.conceptSearcher = null;
      this.nlpProcessor = null;

      // 事件系统
      this.eventListeners = new Map();

      // 初始化
      this.init();
    }

    /**
     * 初始化处理器
     */
    async init() {
      try {
        console.log('IntelligentInputProcessor: Initializing...');

        // 加载依赖组件
        await this.loadDependencies();

        // 初始化NLP处理器
        if (this.options.enableNLP) {
          this.initNLPProcessor();
        }

        // 加载缓存和学习数据
        await this.loadCache();
        await this.loadLearningData();

        console.log('IntelligentInputProcessor: Initialization complete');
        this.emit('initialized', { component: 'IntelligentInputProcessor' });

      } catch (error) {
        console.error('IntelligentInputProcessor: Initialization failed', error);
        this.emit('error', {
          component: 'IntelligentInputProcessor',
          error: error.message
        });
      }
    }

    /**
     * 加载依赖组件
     */
    async loadDependencies() {
      try {
        // 检查全局依赖
        if (window.Templates) {
          this.templateMatcher = new TemplateMatchingSystem(window.Templates);
        }

        if (window.ConceptManager) {
          this.conceptSearcher = window.ConceptManager;
        }

        // 如果依赖不存在，创建基础版本
        if (!this.templateMatcher) {
          console.warn('IntelligentInputProcessor: TemplateMatchingSystem not found, creating basic version');
          this.templateMatcher = new BasicTemplateMatcher();
        }

        if (!this.conceptSearcher) {
          console.warn('IntelligentInputProcessor: ConceptManager not found, creating basic version');
          this.conceptSearcher = new BasicConceptSearcher();
        }

      } catch (error) {
        console.error('IntelligentInputProcessor: Failed to load dependencies', error);
        throw error;
      }
    }

    /**
     * 初始化NLP处理器
     */
    initNLPProcessor() {
      this.nlpProcessor = {
        // 关键词提取
        extractKeywords: (text) => {
          const keywords = [];

          // 数学术语
          const mathTerms = ['函数', '方程', '图像', '坐标', '概率', '统计', '分布', '正态', '二次', '三角', '矩阵', '变换'];
          // 天文学术语
          const astroTerms = ['行星', '轨道', '太阳', '地球', '月球', '恒星', '星系', '天球', '坐标'];
          // 物理学术语
          const physicsTerms = ['运动', '力', '能量', '波动', '振动', '落体', '抛体', '速度', '加速度'];
          // 化学术语
          const chemTerms = ['分子', '原子', '化学键', '反应', '元素', '周期表'];

          const allTerms = [...mathTerms, ...astroTerms, ...physicsTerms, ...chemTerms];

          allTerms.forEach(term => {
            if (text.includes(term)) {
              keywords.push({
                term: term,
                category: this.getTermCategory(term),
                confidence: 1.0
              });
            }
          });

          return keywords;
        },

        // 参数提取
        extractParameters: (text) => {
          const parameters = {};

          // 数值参数提取
          const numberPattern = /([a-zA-Z\u4e00-\u9fa5]+)\s*[:：=]\s*([-\d.]+)/g;
          let match;
          while ((match = numberPattern.exec(text)) !== null) {
            const [, key, value] = match;
            parameters[key.trim()] = parseFloat(value);
          }

          // 单位参数提取
          const unitPattern = /(\d+(?:\.\d+)?)\s*([a-zA-Z°%]+)/g;
          while ((match = unitPattern.exec(text)) !== null) {
            const [, value, unit] = match;
            parameters[unit] = parseFloat(value);
          }

          // 常见参数映射
          const paramMappings = {
            '均值': 'mu', '平均值': 'mu', 'mean': 'mu',
            '标准差': 'sigma', '方差': 'sigma', 'std': 'sigma',
            '振幅': 'amplitude', '幅值': 'amplitude',
            '频率': 'frequency', '赫兹': 'frequency', 'hz': 'frequency',
            '相位': 'phase', '初相': 'phase'
          };

          Object.entries(paramMappings).forEach(([chineseKey, englishKey]) => {
            if (text.includes(chineseKey)) {
              const valueMatch = text.match(new RegExp(`${chineseKey}\\s*[:：=]?\\s*([\\d.]+)`));
              if (valueMatch) {
                parameters[englishKey] = parseFloat(valueMatch[1]);
              }
            }
          });

          return parameters;
        },

        // 意图识别
        detectIntent: (text, keywords) => {
          const intent = {
            type: 'unknown',
            confidence: 0.0,
            details: {}
          };

          // 基于关键词判断意图
          const mathKeywords = keywords.filter(k => k.category === 'math');
          const astroKeywords = keywords.filter(k => k.category === 'astronomy');
          const physicsKeywords = keywords.filter(k => k.category === 'physics');
          const chemKeywords = keywords.filter(k => k.category === 'chemistry');

          if (mathKeywords.length > 0) {
            intent.type = 'math_visualization';
            intent.confidence = mathKeywords.length / keywords.length;
            intent.details.domain = 'mathematics';
            intent.details.concepts = mathKeywords.map(k => k.term);
          } else if (astroKeywords.length > 0) {
            intent.type = 'astronomy_visualization';
            intent.confidence = astroKeywords.length / keywords.length;
            intent.details.domain = 'astronomy';
            intent.details.concepts = astroKeywords.map(k => k.term);
          } else if (physicsKeywords.length > 0) {
            intent.type = 'physics_visualization';
            intent.confidence = physicsKeywords.length / keywords.length;
            intent.details.domain = 'physics';
            intent.details.concepts = physicsKeywords.map(k => k.term);
          } else if (chemKeywords.length > 0) {
            intent.type = 'chemistry_visualization';
            intent.confidence = chemKeywords.length / keywords.length;
            intent.details.domain = 'chemistry';
            intent.details.concepts = chemKeywords.map(k => k.term);
          }

          return intent;
        }
      };
    }

    /**
     * 获取术语类别
     */
    getTermCategory(term) {
      const mathTerms = ['函数', '方程', '图像', '坐标', '概率', '统计', '分布', '正态', '二次', '三角', '矩阵', '变换'];
      const astroTerms = ['行星', '轨道', '太阳', '地球', '月球', '恒星', '星系', '天球', '坐标'];
      const physicsTerms = ['运动', '力', '能量', '波动', '振动', '落体', '抛体', '速度', '加速度'];
      const chemTerms = ['分子', '原子', '化学键', '反应', '元素', '周期表'];

      if (mathTerms.includes(term)) return 'math';
      if (astroTerms.includes(term)) return 'astronomy';
      if (physicsTerms.includes(term)) return 'physics';
      if (chemTerms.includes(term)) return 'chemistry';

      return 'unknown';
    }

    /**
     * 处理输入 - 主要入口方法
     */
    async processInput(input, options = {}) {
      const {
        mode = this.state.currentMode,
        force = false,
        ...otherOptions
      } = options;

      try {
        // 输入验证
        if (!this.validateInput(input)) {
          throw new Error('Invalid input');
        }

        // 检查缓存
        if (!force && this.options.enableCache) {
          const cached = this.getCachedResult(input, mode);
          if (cached) {
            this.emit('cache_hit', { input, mode, result: cached });
            return cached;
          }
        }

        // 开始处理
        this.state.processing = true;
        this.state.lastInput = input;
        this.emit('processing_start', { input, mode });

        let result;

        // 根据模式处理
        switch (mode) {
          case 'text':
            result = await this.processTextInput(input, otherOptions);
            break;
          case 'template':
            result = await this.processTemplateInput(input, otherOptions);
            break;
          case 'concept':
            result = await this.processConceptInput(input, otherOptions);
            break;
          default:
            throw new Error(`Unknown processing mode: ${mode}`);
        }

        // 缓存结果
        if (this.options.enableCache) {
          this.cacheResult(input, mode, result);
        }

        // 更新学习数据
        if (this.options.enableLearning) {
          this.updateLearningData(input, mode, result);
        }

        this.state.lastResult = result;
        this.state.processing = false;

        this.emit('processing_complete', { input, mode, result });
        return result;

      } catch (error) {
        this.state.processing = false;
        console.error('IntelligentInputProcessor: Processing failed', error);
        this.emit('processing_error', { input, mode, error: error.message });
        throw error;
      }
    }

    /**
     * 处理文本输入
     */
    async processTextInput(input, options = {}) {
      const result = {
        mode: 'text',
        input: input,
        timestamp: Date.now(),
        intent: null,
        keywords: [],
        parameters: {},
        recommendations: [],
        confidence: 0.0
      };

      try {
        // 提取关键词
        if (this.nlpProcessor) {
          result.keywords = this.nlpProcessor.extractKeywords(input);
          result.parameters = this.nlpProcessor.extractParameters(input);
          result.intent = this.nlpProcessor.detectIntent(input, result.keywords);
        }

        // 基于意图获取推荐
        if (result.intent && result.intent.type !== 'unknown') {
          result.recommendations = await this.getRecommendations(result);
          result.confidence = result.intent.confidence;
        } else {
          // 降级处理：使用模板匹配
          result.recommendations = await this.templateMatcher.match(input);
          result.confidence = 0.5;
        }

        return result;

      } catch (error) {
        console.error('IntelligentInputProcessor: Text processing failed', error);
        // 降级到基础模板匹配
        result.recommendations = await this.templateMatcher.match(input);
        result.confidence = 0.3;
        return result;
      }
    }

    /**
     * 处理模板输入
     */
    async processTemplateInput(input, options = {}) {
      const result = {
        mode: 'template',
        input: input,
        timestamp: Date.now(),
        templates: [],
        selectedTemplate: null,
        parameters: {},
        preview: null
      };

      try {
        // 获取匹配的模板
        result.templates = await this.templateMatcher.match(input);

        // 如果有模板ID，直接获取
        if (typeof input === 'string' && input.includes('template:')) {
          const templateId = input.replace('template:', '');
          result.selectedTemplate = await this.templateMatcher.getById(templateId);
        } else {
          // 选择最佳匹配
          result.selectedTemplate = result.templates[0] || null;
        }

        // 生成预览
        if (result.selectedTemplate) {
          result.preview = await this.generatePreview(result.selectedTemplate);
        }

        return result;

      } catch (error) {
        console.error('IntelligentInputProcessor: Template processing failed', error);
        throw error;
      }
    }

    /**
     * 处理概念输入
     */
    async processConceptInput(input, options = {}) {
      const result = {
        mode: 'concept',
        input: input,
        timestamp: Date.now(),
        concepts: [],
        relatedConcepts: [],
        visualizations: [],
        selectedConcept: null
      };

      try {
        // 搜索概念
        result.concepts = await this.conceptSearcher.search(input);

        // 获取相关概念
        if (result.concepts.length > 0) {
          const primaryConcept = result.concepts[0];
          result.relatedConcepts = await this.conceptSearcher.getRecommendations(primaryConcept.id);
          result.selectedConcept = primaryConcept;

          // 获取相关的可视化
          result.visualizations = await this.getConceptVisualizations(primaryConcept);
        }

        return result;

      } catch (error) {
        console.error('IntelligentInputProcessor: Concept processing failed', error);
        throw error;
      }
    }

    /**
     * 获取推荐
     */
    async getRecommendations(analysisResult) {
      const recommendations = [];

      try {
        // 基于意图获取模板推荐
        if (this.templateMatcher) {
          const templateRecs = await this.templateMatcher.matchByIntent(analysisResult.intent);
          recommendations.push(...templateRecs.map(rec => ({
            type: 'template',
            ...rec
          })));
        }

        // 基于关键词获取概念推荐
        if (this.conceptSearcher && analysisResult.keywords.length > 0) {
          const keywordText = analysisResult.keywords.map(k => k.term).join(' ');
          const conceptRecs = await this.conceptSearcher.search(keywordText);
          recommendations.push(...conceptRecs.slice(0, 3).map(rec => ({
            type: 'concept',
            ...rec
          })));
        }

        // 基于学习数据个性化推荐
        if (this.options.enableLearning) {
          const personalizedRecs = this.getPersonalizedRecommendations(analysisResult);
          recommendations.push(...personalizedRecs);
        }

        // 排序和限制结果数量
        return recommendations
          .sort((a, b) => (b.confidence || 0) - (a.confidence || 0))
          .slice(0, this.options.maxResults);

      } catch (error) {
        console.error('IntelligentInputProcessor: Failed to get recommendations', error);
        return [];
      }
    }

    /**
     * 输入验证
     */
    validateInput(input) {
      if (!input || typeof input !== 'string') {
        return false;
      }

      const length = input.trim().length;
      return length >= this.options.minInputLength &&
             length <= this.options.maxInputLength;
    }

    /**
     * 缓存管理
     */
    getCachedResult(input, mode) {
      const key = `${mode}:${input}`;
      const cached = this.state.cache.get(key);

      if (cached && Date.now() - cached.timestamp < this.options.cacheTimeout) {
        return cached.result;
      }

      return null;
    }

    cacheResult(input, mode, result) {
      const key = `${mode}:${input}`;

      // 清理过期缓存
      if (this.state.cache.size >= this.options.cacheSize) {
        this.cleanupCache();
      }

      this.state.cache.set(key, {
        result: result,
        timestamp: Date.now()
      });
    }

    cleanupCache() {
      const now = Date.now();
      const entries = Array.from(this.state.cache.entries());

      // 删除过期缓存
      entries.forEach(([key, value]) => {
        if (now - value.timestamp > this.options.cacheTimeout) {
          this.state.cache.delete(key);
        }
      });

      // 如果还是太大，删除最旧的
      if (this.state.cache.size >= this.options.cacheSize) {
        const sorted = entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
        const toDelete = sorted.slice(0, sorted.length - this.options.cacheSize);
        toDelete.forEach(([key]) => this.state.cache.delete(key));
      }
    }

    /**
     * 学习数据管理
     */
    updateLearningData(input, mode, result) {
      // 添加到历史记录
      this.state.learning.userHistory.push({
        input: input,
        mode: mode,
        result: result,
        timestamp: Date.now()
      });

      // 限制历史记录数量
      if (this.state.learning.userHistory.length > 1000) {
        this.state.learning.userHistory = this.state.learning.userHistory.slice(-1000);
      }

      // 保存到本地存储
      this.saveLearningData();
    }

    async loadLearningData() {
      try {
        const saved = localStorage.getItem('intelligent-input-learning');
        if (saved) {
          const data = JSON.parse(saved);
          this.state.learning = { ...this.state.learning, ...data };
        }
      } catch (error) {
        console.warn('IntelligentInputProcessor: Failed to load learning data', error);
      }
    }

    saveLearningData() {
      try {
        localStorage.setItem('intelligent-input-learning', JSON.stringify(this.state.learning));
      } catch (error) {
        console.warn('IntelligentInputProcessor: Failed to save learning data', error);
      }
    }

    async loadCache() {
      try {
        const saved = localStorage.getItem('intelligent-input-cache');
        if (saved) {
          const data = JSON.parse(saved);
          this.state.cache = new Map(Object.entries(data));
        }
      } catch (error) {
        console.warn('IntelligentInputProcessor: Failed to load cache', error);
      }
    }

    saveCache() {
      try {
        const data = Object.fromEntries(this.state.cache);
        localStorage.setItem('intelligent-input-cache', JSON.stringify(data));
      } catch (error) {
        console.warn('IntelligentInputProcessor: Failed to save cache', error);
      }
    }

    /**
     * 事件系统
     */
    on(event, handler) {
      if (!this.eventListeners.has(event)) {
        this.eventListeners.set(event, []);
      }
      this.eventListeners.get(event).push(handler);
    }

    off(event, handler) {
      if (this.eventListeners.has(event)) {
        const handlers = this.eventListeners.get(event);
        const index = handlers.indexOf(handler);
        if (index > -1) {
          handlers.splice(index, 1);
        }
      }
    }

    emit(event, data) {
      if (this.eventListeners.has(event)) {
        this.eventListeners.get(event).forEach(handler => {
          try {
            handler(data);
          } catch (error) {
            console.error(`IntelligentInputProcessor: Error in event handler for ${event}`, error);
          }
        });
      }
    }

    /**
     * 工具方法
     */
    setMode(mode) {
      if (this.options.modes.includes(mode)) {
        this.state.currentMode = mode;
        this.emit('mode_changed', { mode });
      } else {
        throw new Error(`Invalid mode: ${mode}`);
      }
    }

    getMode() {
      return this.state.currentMode;
    }

    isProcessing() {
      return this.state.processing;
    }

    getLastResult() {
      return this.state.lastResult;
    }

    clearCache() {
      this.state.cache.clear();
      localStorage.removeItem('intelligent-input-cache');
      this.emit('cache_cleared');
    }

    clearLearningData() {
      this.state.learning = {
        userHistory: [],
        preferences: {},
        feedback: []
      };
      localStorage.removeItem('intelligent-input-learning');
      this.emit('learning_data_cleared');
    }

    /**
     * 销毁处理器
     */
    destroy() {
      // 保存数据
      this.saveCache();
      this.saveLearningData();

      // 清理状态
      this.state = null;
      this.templateMatcher = null;
      this.conceptSearcher = null;
      this.nlpProcessor = null;
      this.eventListeners.clear();

      console.log('IntelligentInputProcessor: Destroyed');
    }
  }

  /**
   * 基础模板匹配器（降级方案）
   */
  class BasicTemplateMatcher {
    constructor() {
      this.templates = window.templates || [];
    }

    async match(input) {
      // 简单的关键词匹配
      const results = [];
      const inputLower = input.toLowerCase();

      this.templates.forEach(template => {
        let score = 0;

        // 名称匹配
        if (template.name && template.name.toLowerCase().includes(inputLower)) {
          score += 1.0;
        }

        // 描述匹配
        if (template.description && template.description.toLowerCase().includes(inputLower)) {
          score += 0.5;
        }

        // 标签匹配
        if (template.tags) {
          template.tags.forEach(tag => {
            if (tag.toLowerCase().includes(inputLower)) {
              score += 0.3;
            }
          });
        }

        if (score > 0) {
          results.push({
            template: template,
            confidence: Math.min(score, 1.0),
            reason: 'keyword_match'
          });
        }
      });

      return results.sort((a, b) => b.confidence - a.confidence);
    }

    async getById(templateId) {
      return this.templates.find(t => t.id === templateId) || null;
    }

    async matchByIntent(intent) {
      // 基于意图的简单匹配
      const domainTemplates = this.templates.filter(t =>
        t.category === intent.details.domain
      );

      return domainTemplates.map(template => ({
        template: template,
        confidence: 0.7,
        reason: 'domain_match'
      }));
    }
  }

  /**
   * 基础概念搜索器（降级方案）
   */
  class BasicConceptSearcher {
    constructor() {
      this.concepts = window.concepts || [];
    }

    async search(query) {
      const results = [];
      const queryLower = query.toLowerCase();

      this.concepts.forEach(concept => {
        let score = 0;

        if (concept.name && concept.name.toLowerCase().includes(queryLower)) {
          score += 1.0;
        }

        if (concept.description && concept.description.toLowerCase().includes(queryLower)) {
          score += 0.5;
        }

        if (concept.tags) {
          concept.tags.forEach(tag => {
            if (tag.toLowerCase().includes(queryLower)) {
              score += 0.3;
            }
          });
        }

        if (score > 0) {
          results.push({
            ...concept,
            confidence: Math.min(score, 1.0)
          });
        }
      });

      return results.sort((a, b) => b.confidence - a.confidence);
    }

    async getRecommendations(conceptId) {
      // 简单的相关概念推荐
      const concept = this.concepts.find(c => c.id === conceptId);
      if (!concept) return [];

      return this.concepts
        .filter(c => c.id !== conceptId && c.category === concept.category)
        .slice(0, 5);
    }
  }

  // 导出到全局
  global.IntelligentInputProcessor = IntelligentInputProcessor;
  global.BasicTemplateMatcher = BasicTemplateMatcher;
  global.BasicConceptSearcher = BasicConceptSearcher;

})(window);