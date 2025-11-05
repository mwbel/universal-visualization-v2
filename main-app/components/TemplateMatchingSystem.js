/**
 * TemplateMatchingSystem.js - 模板匹配系统
 * 负责智能匹配用户需求与可视化模板
 */
(function(global) {
  'use strict';

  /**
   * 模板匹配系统类
   */
  class TemplateMatchingSystem {
    constructor(templates = null) {
      this.templates = templates || this.loadTemplates();
      this.matchingCache = new Map();
      this.indexingData = this.buildIndexingData();

      // 匹配算法配置
      this.config = {
        // 相似度权重
        weights: {
          name: 0.3,
          description: 0.2,
          tags: 0.25,
          keywords: 0.15,
          category: 0.1
        },

        // 匹配阈值
        thresholds: {
          min: 0.1,
          good: 0.5,
          excellent: 0.8
        },

        // 结果限制
        maxResults: 10,
        minResults: 3,

        // 缓存配置
        enableCache: true,
        cacheSize: 100,
        cacheTimeout: 30 * 60 * 1000 // 30分钟
      };

      // 预处理模板数据
      this.preprocessTemplates();

      // 同义词和术语映射
      this.thesaurus = this.buildThesaurus();

      // 事件系统
      this.eventListeners = new Map();

      console.log('TemplateMatchingSystem: Initialized with', this.templates.length, 'templates');
    }

    /**
     * 加载模板数据
     */
    loadTemplates() {
      // 尝试从全局变量加载
      if (window.templates) {
        return window.templates;
      }

      // 尝试从templates.json加载
      try {
        const templatesData = localStorage.getItem('templates-data');
        if (templatesData) {
          const parsed = JSON.parse(templatesData);
          return this.extractTemplatesFromData(parsed);
        }
      } catch (error) {
        console.warn('TemplateMatchingSystem: Failed to load templates from localStorage', error);
      }

      // 使用默认模板
      return this.getDefaultTemplates();
    }

    /**
     * 从数据中提取模板
     */
    extractTemplatesFromData(data) {
      const templates = [];

      if (data.categories) {
        data.categories.forEach(category => {
          if (category.templates) {
            category.templates.forEach(template => {
              templates.push({
                ...template,
                category: category.id,
                categoryName: category.name
              });
            });
          }
        });
      }

      return templates;
    }

    /**
     * 获取默认模板
     */
    getDefaultTemplates() {
      return [
        {
          id: 'normal_distribution',
          name: '正态分布',
          description: '标准正态分布概率密度函数',
          category: 'mathematics',
          categoryName: '数学可视化',
          tags: ['概率', '统计', '分布', '高斯分布'],
          keywords: ['正态', '高斯', 'normal', 'gaussian', '钟形曲线'],
          parameters: [
            { name: 'mu', label: '均值', default: 0, min: -10, max: 10 },
            { name: 'sigma', label: '标准差', default: 1, min: 0.1, max: 5 }
          ]
        },
        {
          id: 'quadratic_function',
          name: '二次函数',
          description: '二次函数 y = ax² + bx + c 的图像',
          category: 'mathematics',
          categoryName: '数学可视化',
          tags: ['函数', '代数', '抛物线'],
          keywords: ['二次', '抛物线', 'quadratic', '多项式'],
          parameters: [
            { name: 'a', label: '二次项系数', default: 1, min: -5, max: 5 },
            { name: 'b', label: '一次项系数', default: 2, min: -10, max: 10 },
            { name: 'c', label: '常数项', default: 1, min: -10, max: 10 }
          ]
        },
        {
          id: 'planetary_orbits',
          name: '行星运动轨迹',
          description: '太阳系行星运动轨迹的3D可视化',
          category: 'astronomy',
          categoryName: '天文学可视化',
          tags: ['行星', '轨道', '太阳系'],
          keywords: ['行星', '轨道', '太阳', '地球', '火星'],
          parameters: [
            { name: 'planet', label: '行星', default: 'earth', options: ['mercury', 'venus', 'earth', 'mars'] },
            { name: 'timeScale', label: '时间缩放', default: 1, min: 0.1, max: 100 }
          ]
        },
        {
          id: 'simple_harmonic_motion',
          name: '简谐振动',
          description: '简谐振动的位移时间图像',
          category: 'physics',
          categoryName: '物理学可视化',
          tags: ['振动', '简谐运动', '周期'],
          keywords: ['简谐', '振动', '弹簧', 'SHM'],
          parameters: [
            { name: 'amplitude', label: '振幅', default: 1, min: 0.1, max: 5 },
            { name: 'frequency', label: '频率', default: 1, min: 0.1, max: 5 },
            { name: 'phase', label: '相位', default: 0, min: -3.14, max: 3.14 }
          ]
        }
      ];
    }

    /**
     * 构建索引数据
     */
    buildIndexingData() {
      const indexing = {
        byCategory: new Map(),
        byTag: new Map(),
        byKeyword: new Map(),
        nameIndex: new Map(),
        fullTextIndex: []
      };

      this.templates.forEach((template, index) => {
        // 按类别索引
        if (!indexing.byCategory.has(template.category)) {
          indexing.byCategory.set(template.category, []);
        }
        indexing.byCategory.get(template.category).push({ template, index });

        // 按标签索引
        if (template.tags) {
          template.tags.forEach(tag => {
            if (!indexing.byTag.has(tag)) {
              indexing.byTag.set(tag, []);
            }
            indexing.byTag.get(tag).push({ template, index });
          });
        }

        // 按关键词索引
        if (template.keywords) {
          template.keywords.forEach(keyword => {
            if (!indexing.byKeyword.has(keyword)) {
              indexing.byKeyword.set(keyword, []);
            }
            indexing.byKeyword.get(keyword).push({ template, index });
          });
        }

        // 名称索引
        indexing.nameIndex.set(template.name.toLowerCase(), { template, index });

        // 全文索引
        const searchText = this.createSearchText(template);
        indexing.fullTextIndex.push({
          template,
          index,
          searchText: searchText.toLowerCase()
        });
      });

      return indexing;
    }

    /**
     * 创建搜索文本
     */
    createSearchText(template) {
      const parts = [
        template.name || '',
        template.description || '',
        template.categoryName || '',
        ...(template.tags || []),
        ...(template.keywords || [])
      ];
      return parts.join(' ');
    }

    /**
     * 预处理模板数据
     */
    preprocessTemplates() {
      this.templates.forEach(template => {
        // 标准化文本
        template.searchableText = this.createSearchText(template).toLowerCase();

        // 计算权重
        template.weight = this.calculateTemplateWeight(template);

        // 添加标准化字段
        template.normalizedTags = (template.tags || []).map(tag => tag.toLowerCase());
        template.normalizedKeywords = (template.keywords || []).map(keyword => keyword.toLowerCase());
      });
    }

    /**
     * 计算模板权重
     */
    calculateTemplateWeight(template) {
      let weight = 1.0;

      // 基于类别调整权重
      const categoryWeights = {
        'mathematics': 1.2,
        'astronomy': 1.1,
        'physics': 1.1,
        'chemistry': 1.0
      };

      if (categoryWeights[template.category]) {
        weight *= categoryWeights[template.category];
      }

      // 基于标签数量调整
      if (template.tags) {
        weight *= (1 + template.tags.length * 0.1);
      }

      // 基于关键词数量调整
      if (template.keywords) {
        weight *= (1 + template.keywords.length * 0.05);
      }

      return weight;
    }

    /**
     * 构建同义词词典
     */
    buildThesaurus() {
      return {
        // 数学术语同义词
        '正态分布': ['高斯分布', '钟形曲线', 'normal distribution', 'gaussian'],
        '二次函数': ['抛物线', 'quadratic function', 'parabola'],
        '三角函数': ['sin', 'cos', 'tan', '正弦', '余弦', '正切'],
        '矩阵': ['matrix', '线性变换', '变换'],
        '概率': ['probability', '可能性', '几率'],
        '统计': ['statistics', '数据分析', 'data analysis'],

        // 天文学术语同义词
        '行星': ['planet', '行星运动', '轨道'],
        '太阳': ['sun', '太阳系', 'solar system'],
        '地球': ['earth', '地球轨道'],
        '月球': ['moon', '月相', 'lunar'],
        '轨道': ['orbit', '轨道路径', 'trajectory'],

        // 物理学术语同义词
        '振动': ['vibration', 'oscillation', '波动'],
        '运动': ['motion', '移动', 'movement'],
        '力': ['force', '作用力'],
        '能量': ['energy', '功', 'work'],
        '速度': ['velocity', 'speed', '速率'],

        // 通用术语
        '可视化': ['visualization', '图表', 'graph', 'chart', '图像'],
        '动画': ['animation', '动态', 'dynamic'],
        '交互': ['interaction', 'interactive', '互动'],
        '模拟': ['simulation', '仿真', 'modeling']
      };
    }

    /**
     * 主要匹配方法
     */
    async match(input, options = {}) {
      const {
        category = null,
        tags = [],
        limit = this.config.maxResults,
        threshold = this.config.thresholds.min,
        includeDetails = true
      } = options;

      try {
        // 检查缓存
        const cacheKey = this.createCacheKey(input, options);
        if (this.config.enableCache && this.matchingCache.has(cacheKey)) {
          const cached = this.matchingCache.get(cacheKey);
          if (Date.now() - cached.timestamp < this.config.cacheTimeout) {
            this.emit('cache_hit', { input, options });
            return cached.results;
          }
        }

        // 预处理输入
        const processedInput = this.preprocessInput(input);

        // 执行匹配
        const matches = await this.performMatching(processedInput, {
          category,
          tags,
          threshold
        });

        // 后处理结果
        const results = this.postProcessResults(matches, {
          limit,
          includeDetails,
          input: processedInput
        });

        // 缓存结果
        if (this.config.enableCache) {
          this.cacheResult(cacheKey, results);
        }

        this.emit('match_complete', { input, options, results });
        return results;

      } catch (error) {
        console.error('TemplateMatchingSystem: Match failed', error);
        this.emit('match_error', { input, options, error: error.message });
        throw error;
      }
    }

    /**
     * 预处理输入
     */
    preprocessInput(input) {
      if (typeof input !== 'string') {
        input = String(input);
      }

      return {
        original: input,
        normalized: input.toLowerCase().trim(),
        tokens: this.tokenize(input),
        keywords: this.extractKeywords(input),
        intent: this.detectIntent(input)
      };
    }

    /**
     * 分词
     */
    tokenize(text) {
      return text.toLowerCase()
        .split(/[s,，。！？；：()（）【】\[\]{}]+/)
        .filter(token => token.length > 0);
    }

    /**
     * 提取关键词
     */
    extractKeywords(text) {
      const keywords = new Set();
      const tokens = this.tokenize(text);

      // 直接提取
      tokens.forEach(token => {
        keywords.add(token);
      });

      // 同义词扩展
      tokens.forEach(token => {
        const synonyms = this.thesaurus[token];
        if (synonyms) {
          synonyms.forEach(synonym => {
            keywords.add(synonym.toLowerCase());
          });
        }
      });

      return Array.from(keywords);
    }

    /**
     * 检测意图
     */
    detectIntent(text) {
      const intent = {
        type: 'general',
        domain: 'unknown',
        specificity: 'low',
        parameters: {}
      };

      const textLower = text.toLowerCase();

      // 检测领域
      const domainKeywords = {
        mathematics: ['函数', '方程', '图形', '坐标', '概率', '统计', '分布', '矩阵'],
        astronomy: ['行星', '轨道', '太阳', '地球', '月球', '恒星'],
        physics: ['运动', '力', '能量', '波动', '振动', '落体'],
        chemistry: ['分子', '原子', '化学键', '反应', '元素']
      };

      let maxScore = 0;
      Object.entries(domainKeywords).forEach(([domain, keywords]) => {
        const score = keywords.reduce((count, keyword) => {
          return count + (textLower.includes(keyword) ? 1 : 0);
        }, 0);

        if (score > maxScore) {
          maxScore = score;
          intent.domain = domain;
        }
      });

      // 检测具体性
      if (textLower.includes('参数') || /d+/.test(text)) {
        intent.specificity = 'high';
      } else if (maxScore >= 2) {
        intent.specificity = 'medium';
      }

      // 提取参数
      intent.parameters = this.extractParameters(text);

      return intent;
    }

    /**
     * 提取参数
     */
    extractParameters(text) {
      const parameters = {};
      const patterns = [
        /([a-zA-Z\u4e00-\u9fa5]+)\s*[:：=]\s*([-\d.]+)/g,
        /(\d+(?:\.\d+)?)\s*([a-zA-Z°%]+)/g
      ];

      patterns.forEach(pattern => {
        let match;
        while ((match = pattern.exec(text)) !== null) {
          if (pattern === patterns[0]) {
            parameters[match[1].trim()] = parseFloat(match[2]);
          } else {
            parameters[match[2]] = parseFloat(match[1]);
          }
        }
      });

      return parameters;
    }

    /**
     * 执行匹配
     */
    async performMatching(processedInput, options) {
      const matches = [];

      // 针对每个模板计算相似度
      this.templates.forEach((template, index) => {
        const match = this.calculateSimilarity(template, processedInput);

        // 应用过滤条件
        if (this.passesFilters(template, match, options)) {
          matches.push({
            template,
            index,
            similarity: match,
            reason: match.reason
          });
        }
      });

      // 按相似度排序
      matches.sort((a, b) => b.similarity.score - a.similarity.score);

      return matches;
    }

    /**
     * 计算相似度
     */
    calculateSimilarity(template, processedInput) {
      const similarity = {
        score: 0,
        details: {
          name: 0,
          description: 0,
          tags: 0,
          keywords: 0,
          category: 0
        },
        reason: []
      };

      // 名称相似度
      if (template.name) {
        similarity.details.name = this.calculateTextSimilarity(
          processedInput.normalized,
          template.name.toLowerCase()
        );
        if (similarity.details.name > 0.5) {
          similarity.reason.push('名称匹配');
        }
      }

      // 描述相似度
      if (template.description) {
        similarity.details.description = this.calculateTextSimilarity(
          processedInput.normalized,
          template.description.toLowerCase()
        );
        if (similarity.details.description > 0.3) {
          similarity.reason.push('描述匹配');
        }
      }

      // 标签相似度
      if (template.normalizedTags && template.normalizedTags.length > 0) {
        similarity.details.tags = this.calculateKeywordSimilarity(
          processedInput.keywords,
          template.normalizedTags
        );
        if (similarity.details.tags > 0.3) {
          similarity.reason.push('标签匹配');
        }
      }

      // 关键词相似度
      if (template.normalizedKeywords && template.normalizedKeywords.length > 0) {
        similarity.details.keywords = this.calculateKeywordSimilarity(
          processedInput.keywords,
          template.normalizedKeywords
        );
        if (similarity.details.keywords > 0.3) {
          similarity.reason.push('关键词匹配');
        }
      }

      // 类别匹配
      if (template.category === processedInput.intent.domain) {
        similarity.details.category = 1.0;
        similarity.reason.push('类别匹配');
      }

      // 计算总分
      similarity.score = Object.entries(this.config.weights).reduce((total, [key, weight]) => {
        return total + (similarity.details[key] || 0) * weight;
      }, 0);

      // 应用模板权重
      similarity.score *= template.weight;

      // 如果没有匹配原因，添加默认原因
      if (similarity.reason.length === 0 && similarity.score > 0) {
        similarity.reason.push('部分匹配');
      }

      return similarity;
    }

    /**
     * 计算文本相似度
     */
    calculateTextSimilarity(text1, text2) {
      const tokens1 = this.tokenize(text1);
      const tokens2 = this.tokenize(text2);

      if (tokens1.length === 0 && tokens2.length === 0) {
        return 1.0;
      }

      if (tokens1.length === 0 || tokens2.length === 0) {
        return 0.0;
      }

      const intersection = tokens1.filter(token => tokens2.includes(token));
      const union = [...new Set([...tokens1, ...tokens2])];

      return intersection.length / union.length; // Jaccard相似度
    }

    /**
     * 计算关键词相似度
     */
    calculateKeywordSimilarity(keywords1, keywords2) {
      if (keywords1.length === 0 && keywords2.length === 0) {
        return 1.0;
      }

      if (keywords1.length === 0 || keywords2.length === 0) {
        return 0.0;
      }

      const matches = keywords1.filter(keyword => keywords2.includes(keyword));
      return matches.length / Math.max(keywords1.length, keywords2.length);
    }

    /**
     * 检查过滤条件
     */
    passesFilters(template, similarity, options) {
      // 阈值过滤
      if (similarity.score < options.threshold) {
        return false;
      }

      // 类别过滤
      if (options.category && template.category !== options.category) {
        return false;
      }

      // 标签过滤
      if (options.tags.length > 0) {
        const hasMatchingTag = options.tags.some(tag =>
          template.normalizedTags && template.normalizedTags.includes(tag.toLowerCase())
        );
        if (!hasMatchingTag) {
          return false;
        }
      }

      return true;
    }

    /**
     * 后处理结果
     */
    postProcessResults(matches, options) {
      const { limit, includeDetails, input } = options;

      // 限制结果数量
      const limitedMatches = matches.slice(0, limit);

      // 添加详细信息
      if (includeDetails) {
        limitedMatches.forEach(match => {
          match.confidence = this.categorizeConfidence(match.similarity.score);
          match.recommendation = this.generateRecommendation(match, input);
        });
      }

      // 确保最少结果数量
      if (limitedMatches.length < this.config.minResults) {
        const additionalMatches = this.getFallbackMatches(
          limitedMatches.length,
          this.config.minResults - limitedMatches.length
        );
        limitedMatches.push(...additionalMatches);
      }

      return limitedMatches;
    }

    /**
     * 分类置信度
     */
    categorizeConfidence(score) {
      if (score >= this.config.thresholds.excellent) {
        return 'excellent';
      } else if (score >= this.config.thresholds.good) {
        return 'good';
      } else {
        return 'fair';
      }
    }

    /**
     * 生成推荐语
     */
    generateRecommendation(match, input) {
      const reasons = match.similarity.reason;
      const template = match.template;

      if (reasons.includes('名称匹配')) {
        return `完美匹配您的需求：${template.name}`;
      } else if (reasons.includes('类别匹配')) {
        return `在${template.categoryName}领域推荐：${template.name}`;
      } else if (match.similarity.score > 0.7) {
        return `高度推荐：${template.name}`;
      } else if (match.similarity.score > 0.4) {
        return `可以考虑：${template.name}`;
      } else {
        return `相关推荐：${template.name}`;
      }
    }

    /**
     * 获取降级匹配
     */
    getFallbackMatches(excludeCount, needed) {
      // 返回一些热门模板作为降级选择
      const popularTemplates = this.templates
        .filter((_, index) => index >= excludeCount)
        .slice(0, needed)
        .map(template => ({
          template,
          index: this.templates.indexOf(template),
          similarity: { score: 0.2, reason: ['热门推荐'] },
          confidence: 'fair'
        }));

      return popularTemplates;
    }

    /**
     * 根据ID获取模板
     */
    async getById(templateId) {
      return this.templates.find(t => t.id === templateId) || null;
    }

    /**
     * 根据意图匹配
     */
    async matchByIntent(intent) {
      return this.match('', {
        category: intent.details.domain,
        threshold: this.config.thresholds.min
      });
    }

    /**
     * 缓存管理
     */
    createCacheKey(input, options) {
      return JSON.stringify({ input: input.original || input, options });
    }

    cacheResult(key, results) {
      // 清理过期缓存
      if (this.matchingCache.size >= this.config.cacheSize) {
        this.cleanupCache();
      }

      this.matchingCache.set(key, {
        results: results,
        timestamp: Date.now()
      });
    }

    cleanupCache() {
      const now = Date.now();
      const entries = Array.from(this.matchingCache.entries());

      entries.forEach(([key, value]) => {
        if (now - value.timestamp > this.config.cacheTimeout) {
          this.matchingCache.delete(key);
        }
      });

      // 如果还是太大，删除最旧的
      if (this.matchingCache.size >= this.config.cacheSize) {
        const sorted = entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
        const toDelete = sorted.slice(0, sorted.length - this.config.cacheSize);
        toDelete.forEach(([key]) => this.matchingCache.delete(key));
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
            console.error(`TemplateMatchingSystem: Error in event handler for ${event}`, error);
          }
        });
      }
    }

    /**
     * 工具方法
     */
    getCategories() {
      const categories = new Set();
      this.templates.forEach(template => {
        categories.add(template.category);
      });
      return Array.from(categories);
    }

    getTemplatesByCategory(category) {
      return this.templates.filter(t => t.category === category);
    }

    getAllTags() {
      const tags = new Set();
      this.templates.forEach(template => {
        if (template.tags) {
          template.tags.forEach(tag => tags.add(tag));
        }
      });
      return Array.from(tags);
    }

    clearCache() {
      this.matchingCache.clear();
      this.emit('cache_cleared');
    }

    /**
     * 销毁系统
     */
    destroy() {
      this.matchingCache.clear();
      this.eventListeners.clear();
      console.log('TemplateMatchingSystem: Destroyed');
    }
  }

  // 导出到全局
  global.TemplateMatchingSystem = TemplateMatchingSystem;

})(window);