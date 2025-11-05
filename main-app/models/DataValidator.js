/**
 * DataValidator.js - 数据模型验证器
 * 提供统一的数据验证机制，支持所有用户数据模型的验证需求
 */
(function(global) {
  'use strict';

  /**
   * 数据模型验证器类
   */
  class DataValidator {
    constructor() {
      // 验证规则配置
      this.validationRules = {
        UserProject: {
          required: ['id', 'userId', 'title'],
          optional: ['description', 'type', 'category', 'tags', 'content', 'metadata', 'settings', 'collaboration', 'status'],
          types: {
            id: 'string',
            userId: 'string',
            title: 'string',
            description: 'string',
            type: ['visualization', 'analysis', 'report'],
            category: ['mathematics', 'astronomy', 'physics', 'chemistry'],
            tags: 'array',
            content: 'object',
            metadata: 'object',
            settings: 'object',
            collaboration: 'object',
            status: ['draft', 'published', 'archived']
          },
          constraints: {
            id: { minLength: 1, maxLength: 100 },
            userId: { minLength: 1, maxLength: 50 },
            title: { minLength: 1, maxLength: 200 },
            description: { maxLength: 1000 },
            tags: { maxItems: 20, itemMaxLength: 50 }
          }
        },
        UserFavorite: {
          required: ['id', 'userId', 'targetType', 'targetId'],
          optional: ['folderId', 'properties', 'stats', 'createdAt', 'updatedAt'],
          types: {
            id: 'string',
            userId: 'string',
            targetType: ['project', 'template', 'visualization'],
            targetId: 'string',
            folderId: ['string', 'null'],
            properties: 'object',
            stats: 'object',
            createdAt: 'number',
            updatedAt: 'number'
          },
          constraints: {
            id: { minLength: 1, maxLength: 100 },
            userId: { minLength: 1, maxLength: 50 },
            targetType: { enum: ['project', 'template', 'visualization'] },
            targetId: { minLength: 1, maxLength: 100 },
            folderId: { maxLength: 100 }
          }
        },
        UserAnalytics: {
          required: ['userId'],
          optional: ['statistics', 'categoryStats', 'timeline', 'achievements', 'activityPatterns', 'lastUpdated'],
          types: {
            userId: 'string',
            statistics: 'object',
            categoryStats: 'object',
            timeline: 'array',
            achievements: 'array',
            activityPatterns: 'object',
            lastUpdated: 'number'
          },
          constraints: {
            userId: { minLength: 1, maxLength: 50 }
          },
          custom: {
            statistics: this.validateStatistics.bind(this),
            categoryStats: this.validateCategoryStats.bind(this),
            timeline: this.validateTimeline.bind(this),
            achievements: this.validateAchievements.bind(this),
            activityPatterns: this.validateActivityPatterns.bind(this)
          }
        }
      };

      // 验证错误消息模板
      this.errorMessages = {
        required: '{field} 是必需字段',
        type: '{field} 类型错误，期望 {expectedType}，实际 {actualType}',
        minLength: '{field} 长度不能少于 {minLength} 个字符',
        maxLength: '{field} 长度不能超过 {maxLength} 个字符',
        maxItems: '{field} 项目数量不能超过 {maxItems} 个',
        enum: '{field} 值必须是以下之一: {allowedValues}',
        custom: '{field} 验证失败: {message}'
      };
    }

    /**
     * 验证数据模型
     */
    validate(modelName, data) {
      const result = {
        valid: true,
        errors: [],
        warnings: []
      };

      try {
        // 检查模型是否支持
        if (!this.validationRules[modelName]) {
          throw new Error(`不支持的模型类型: ${modelName}`);
        }

        const rules = this.validationRules[modelName];

        // 验证必需字段
        this.validateRequiredFields(data, rules.required, result);

        // 验证字段类型和约束
        this.validateFields(data, rules, result);

        // 执行自定义验证
        if (rules.custom) {
          this.validateCustom(data, rules.custom, result);
        }

      } catch (error) {
        result.valid = false;
        result.errors.push(`验证过程发生错误: ${error.message}`);
      }

      return result;
    }

    /**
     * 验证必需字段
     */
    validateRequiredFields(data, requiredFields, result) {
      requiredFields.forEach(field => {
        if (data[field] === undefined || data[field] === null || data[field] === '') {
          result.valid = false;
          result.errors.push(this.formatErrorMessage('required', { field }));
        }
      });
    }

    /**
     * 验证字段
     */
    validateFields(data, rules, result) {
      Object.keys(data).forEach(field => {
        const value = data[field];
        const fieldRules = rules.types[field];

        if (!fieldRules) {
          // 未定义的字段，检查是否在可选列表中
          if (!rules.optional.includes(field)) {
            result.warnings.push(`未定义的字段: ${field}`);
          }
          return;
        }

        // 类型验证
        if (!this.validateType(value, fieldRules)) {
          result.valid = false;
          result.errors.push(this.formatErrorMessage('type', {
            field,
            expectedType: Array.isArray(fieldRules) ? fieldRules.join('|') : fieldRules,
            actualType: Array.isArray(value) ? 'array' : typeof value
          }));
          return;
        }

        // 约束验证
        if (rules.constraints && rules.constraints[field]) {
          this.validateConstraints(value, field, rules.constraints[field], result);
        }
      });
    }

    /**
     * 验证类型
     */
    validateType(value, expectedType) {
      if (Array.isArray(expectedType)) {
        return expectedType.includes(typeof value) ||
               (Array.isArray(value) && expectedType.includes('array'));
      }

      switch (expectedType) {
        case 'string':
          return typeof value === 'string';
        case 'number':
          return typeof value === 'number' && !isNaN(value);
        case 'boolean':
          return typeof value === 'boolean';
        case 'object':
          return typeof value === 'object' && !Array.isArray(value) && value !== null;
        case 'array':
          return Array.isArray(value);
        default:
          return typeof value === expectedType;
      }
    }

    /**
     * 验证约束条件
     */
    validateConstraints(value, field, constraints, result) {
      // 字符串长度约束
      if (typeof value === 'string') {
        if (constraints.minLength && value.length < constraints.minLength) {
          result.valid = false;
          result.errors.push(this.formatErrorMessage('minLength', {
            field,
            minLength: constraints.minLength
          }));
        }

        if (constraints.maxLength && value.length > constraints.maxLength) {
          result.valid = false;
          result.errors.push(this.formatErrorMessage('maxLength', {
            field,
            maxLength: constraints.maxLength
          }));
        }
      }

      // 数组约束
      if (Array.isArray(value)) {
        if (constraints.maxItems && value.length > constraints.maxItems) {
          result.valid = false;
          result.errors.push(this.formatErrorMessage('maxItems', {
            field,
            maxItems: constraints.maxItems
          }));
        }
      }

      // 枚举约束
      if (constraints.enum && !constraints.enum.includes(value)) {
        result.valid = false;
        result.errors.push(this.formatErrorMessage('enum', {
          field,
          allowedValues: constraints.enum.join(', ')
        }));
      }
    }

    /**
     * 自定义验证
     */
    validateCustom(data, customRules, result) {
      Object.keys(customRules).forEach(field => {
        if (data[field] !== undefined) {
          const customResult = customRules[field](data[field]);
          if (customResult !== true) {
            result.valid = false;
            result.errors.push(this.formatErrorMessage('custom', {
              field,
              message: customResult
            }));
          }
        }
      });
    }

    /**
     * 验证统计数据
     */
    validateStatistics(stats) {
      if (!stats || typeof stats !== 'object') {
        return '统计数据必须是对象';
      }

      const requiredFields = ['totalProjects', 'totalViews', 'totalLikes', 'activeDays'];
      for (const field of requiredFields) {
        if (typeof stats[field] !== 'number' || stats[field] < 0) {
          return `${field} 必须是非负数`;
        }
      }

      if (stats.favoriteCategories && !Array.isArray(stats.favoriteCategories)) {
        return 'favoriteCategories 必须是数组';
      }

      return true;
    }

    /**
     * 验证分类统计
     */
    validateCategoryStats(categoryStats) {
      if (!categoryStats || typeof categoryStats !== 'object') {
        return '分类统计必须是对象';
      }

      const validCategories = ['mathematics', 'astronomy', 'physics', 'chemistry'];
      for (const [category, stats] of Object.entries(categoryStats)) {
        if (!validCategories.includes(category)) {
          return `无效的分类: ${category}`;
        }

        if (typeof stats !== 'object' || typeof stats.count !== 'number' || stats.count < 0) {
          return `${category} 统计数据无效`;
        }
      }

      return true;
    }

    /**
     * 验证时间线
     */
    validateTimeline(timeline) {
      if (!Array.isArray(timeline)) {
        return '时间线必须是数组';
      }

      const validActions = ['create', 'edit', 'view', 'like', 'share', 'comment'];

      for (let i = 0; i < timeline.length; i++) {
        const event = timeline[i];

        if (!event || typeof event !== 'object') {
          return `时间线事件 ${i} 必须是对象`;
        }

        if (typeof event.date !== 'string' && typeof event.date !== 'number') {
          return `时间线事件 ${i} 的 date 字段无效`;
        }

        if (!validActions.includes(event.action)) {
          return `时间线事件 ${i} 的 action 字段无效`;
        }

        if (typeof event.targetId !== 'string') {
          return `时间线事件 ${i} 的 targetId 字段必须是字符串`;
        }
      }

      return true;
    }

    /**
     * 验证成就系统
     */
    validateAchievements(achievements) {
      if (!Array.isArray(achievements)) {
        return '成就列表必须是数组';
      }

      const validTypes = ['first_project', 'project_views', 'likes_received', 'social_butterfly'];

      for (let i = 0; i < achievements.length; i++) {
        const achievement = achievements[i];

        if (!achievement || typeof achievement !== 'object') {
          return `成就 ${i} 必须是对象`;
        }

        if (!validTypes.includes(achievement.type)) {
          return `成就 ${i} 的 type 字段无效`;
        }

        if (typeof achievement.unlockedAt !== 'number') {
          return `成就 ${i} 的 unlockedAt 字段必须是数字`;
        }
      }

      return true;
    }

    /**
     * 验证活动模式
     */
    validateActivityPatterns(patterns) {
      if (!patterns || typeof patterns !== 'object') {
        return '活动模式必须是对象';
      }

      // 验证最佳工作时间
      if (patterns.bestWorkingHours && !Array.isArray(patterns.bestWorkingHours)) {
        return 'bestWorkingHours 必须是数组';
      }

      // 验证最佳工作日
      if (patterns.bestWorkingDays && !Array.isArray(patterns.bestWorkingDays)) {
        return 'bestWorkingDays 必须是数组';
      }

      // 验证平均会话时长
      if (patterns.averageSessionDuration && (typeof patterns.averageSessionDuration !== 'number' || patterns.averageSessionDuration < 0)) {
        return 'averageSessionDuration 必须是非负数';
      }

      return true;
    }

    /**
     * 格式化错误消息
     */
    formatErrorMessage(type, params) {
      let message = this.errorMessages[type];

      Object.keys(params).forEach(key => {
        message = message.replace(new RegExp(`{${key}}`, 'g'), params[key]);
      });

      return message;
    }

    /**
     * 快速验证方法 - 只检查必需字段和基本类型
     */
    quickValidate(modelName, data) {
      const rules = this.validationRules[modelName];
      if (!rules) return { valid: false, errors: [`不支持的模型类型: ${modelName}`] };

      const result = { valid: true, errors: [] };

      // 快速检查必需字段
      rules.required.forEach(field => {
        if (data[field] === undefined || data[field] === null || data[field] === '') {
          result.valid = false;
          result.errors.push(this.formatErrorMessage('required', { field }));
        }
      });

      return result;
    }

    /**
     * 批量验证
     */
    validateBatch(validations) {
      const results = [];

      validations.forEach(({ modelName, data }) => {
        const result = this.validate(modelName, data);
        results.push({
          modelName,
          data,
          ...result
        });
      });

      return {
        overallValid: results.every(r => r.valid),
        results
      };
    }
  }

  // 创建全局验证器实例
  const validator = new DataValidator();

  // 导出到全局
  global.DataValidator = DataValidator;
  global.validator = validator;

})(window);