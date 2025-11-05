/**
 * UserAnalytics.js - 用户统计数据模型
 * 定义用户行为分析和统计的数据结构
 */
(function(global) {
  'use strict';

  /**
   * 用户统计数据模型类
   */
  class UserAnalytics {
    constructor(data = {}) {
      // 基础属性
      this.userId = data.userId || null;
      this.period = data.period || 'all'; // all, day, week, month, year

      // 基础统计数据
      this.statistics = {
        totalProjects: typeof data.statistics?.totalProjects === 'number' ? data.statistics.totalProjects : 0,
        publishedProjects: typeof data.statistics?.publishedProjects === 'number' ? data.statistics.publishedProjects : 0,
        draftProjects: typeof data.statistics?.draftProjects === 'number' ? data.statistics.draftProjects : 0,
        archivedProjects: typeof data.statistics?.archivedProjects === 'number' ? data.statistics.archivedProjects : 0,

        totalViews: typeof data.statistics?.totalViews === 'number' ? data.statistics.totalViews : 0,
        totalLikes: typeof data.statistics?.totalLikes === 'number' ? data.statistics.totalLikes : 0,
        totalShares: typeof data.statistics?.totalShares === 'number' ? data.statistics.totalShares : 0,
        totalComments: typeof data.statistics?.totalComments === 'number' ? data.statistics.totalComments : 0,

        totalFavorites: typeof data.statistics?.totalFavorites === 'number' ? data.statistics.totalFavorites : 0,
        totalFollowers: typeof data.statistics?.totalFollowers === 'number' ? data.statistics.totalFollowers : 0,
        totalFollowing: typeof data.statistics?.totalFollowing === 'number' ? data.statistics.totalFollowing : 0,

        activeDays: typeof data.statistics?.activeDays === 'number' ? data.statistics.activeDays : 0,
        totalSessions: typeof data.statistics?.totalSessions === 'number' ? data.statistics.totalSessions : 0,
        avgSessionDuration: typeof data.statistics?.avgSessionDuration === 'number' ? data.statistics.avgSessionDuration : 0,
        lastActiveAt: data.statistics?.lastActiveAt || Date.now(),

        favoriteCategories: Array.isArray(data.statistics?.favoriteCategories) ? data.statistics.favoriteCategories : [],
        mostUsedTags: Array.isArray(data.statistics?.mostUsedTags) ? data.statistics.mostUsedTags : [],
        mostUsedTypes: Array.isArray(data.statistics?.mostUsedTypes) ? data.statistics.mostUsedTypes : [],

        ...data.statistics
      };

      // 项目分类统计
      this.categoryStats = {
        mathematics: {
          total: typeof data.categoryStats?.mathematics?.total === 'number' ? data.categoryStats.mathematics.total : 0,
          published: typeof data.categoryStats?.mathematics?.published === 'number' ? data.categoryStats.mathematics.published : 0,
          views: typeof data.categoryStats?.mathematics?.views === 'number' ? data.categoryStats.mathematics.views : 0,
          likes: typeof data.categoryStats?.mathematics?.likes === 'number' ? data.categoryStats.mathematics.likes : 0,
          shares: typeof data.categoryStats?.mathematics?.shares === 'number' ? data.categoryStats.mathematics.shares : 0,
          ...data.categoryStats?.mathematics
        },
        astronomy: {
          total: typeof data.categoryStats?.astronomy?.total === 'number' ? data.categoryStats.astronomy.total : 0,
          published: typeof data.categoryStats?.astronomy?.published === 'number' ? data.categoryStats.astronomy.published : 0,
          views: typeof data.categoryStats?.astronomy?.views === 'number' ? data.categoryStats.astronomy.views : 0,
          likes: typeof data.categoryStats?.astronomy?.likes === 'number' ? data.categoryStats.astronomy.likes : 0,
          shares: typeof data.categoryStats?.astronomy?.shares === 'number' ? data.categoryStats.astronomy.shares : 0,
          ...data.categoryStats?.astronomy
        },
        physics: {
          total: typeof data.categoryStats?.physics?.total === 'number' ? data.categoryStats.physics.total : 0,
          published: typeof data.categoryStats?.physics?.published === 'number' ? data.categoryStats.physics.published : 0,
          views: typeof data.categoryStats?.physics?.views === 'number' ? data.categoryStats.physics.views : 0,
          likes: typeof data.categoryStats?.physics?.likes === 'number' ? data.categoryStats.physics.likes : 0,
          shares: typeof data.categoryStats?.physics?.shares === 'number' ? data.categoryStats.physics.shares : 0,
          ...data.categoryStats?.physics
        },
        chemistry: {
          total: typeof data.categoryStats?.chemistry?.total === 'number' ? data.categoryStats.chemistry.total : 0,
          published: typeof data.categoryStats?.chemistry?.published === 'number' ? data.categoryStats.chemistry.published : 0,
          views: typeof data.categoryStats?.chemistry?.views === 'number' ? data.categoryStats.chemistry.views : 0,
          likes: typeof data.categoryStats?.chemistry?.likes === 'number' ? data.categoryStats.chemistry.likes : 0,
          shares: typeof data.categoryStats?.chemistry?.shares === 'number' ? data.categoryStats.chemistry.shares : 0,
          ...data.categoryStats?.chemistry
        },
        ...data.categoryStats
      };

      // 时间线数据
      this.timeline = Array.isArray(data.timeline) ? data.timeline : [];

      // 成就数据
      this.achievements = {
        firstProject: data.achievements?.firstProject || null,
        firstLike: data.achievements?.firstLike || null,
        firstShare: data.achievements?.firstShare || null,
        firstComment: data.achievements?.firstComment || null,
        firstFollower: data.achievements?.firstFollower || null,
        milestones: Array.isArray(data.achievements?.milestones) ? data.achievements.milestones : [],
        badges: Array.isArray(data.achievements?.badges) ? data.achievements.badges : [],
        ...data.achievements
      };

      // 活动模式
      this.activityPatterns = {
        mostActiveHours: Array.isArray(data.activityPatterns?.mostActiveHours) ? data.activityPatterns.mostActiveHours : [],
        mostActiveDays: Array.isArray(data.activityPatterns?.mostActiveDays) ? data.activityPatterns.mostActiveDays : [],
        preferredContentTypes: Array.isArray(data.activityPatterns?.preferredContentTypes) ? data.activityPatterns.preferredContentTypes : [],
        avgProjectsPerWeek: typeof data.activityPatterns?.avgProjectsPerWeek === 'number' ? data.activityPatterns.avgProjectsPerWeek : 0,
        peakProductivityHour: typeof data.activityPatterns?.peakProductivityHour === 'number' ? data.activityPatterns.peakProductivityHour : null,
        ...data.activityPatterns
      };

      // 元数据
      this.metadata = {
        lastCalculated: data.metadata?.lastCalculated || Date.now(),
        calculationPeriod: data.metadata?.calculationPeriod || '30d',
        dataVersion: data.metadata?.dataVersion || '1.0',
        accuracy: typeof data.metadata?.accuracy === 'number' ? data.metadata.accuracy : 100,
        ...data.metadata
      };

      // 验证数据完整性
      this.validate();
    }

    /**
     * 验证数据完整性
     */
    validate() {
      const errors = [];

      // 验证必需字段
      if (!this.userId) errors.push('用户ID不能为空');

      // 验证统计数据类型
      Object.keys(this.statistics).forEach(key => {
        const value = this.statistics[key];
        if (typeof value !== 'number' || value < 0) {
          errors.push(`统计字段 ${key} 必须是非负数`);
        }
      });

      // 验证分类统计
      if (this.categoryStats) {
        Object.keys(this.categoryStats).forEach(category => {
          const categoryStats = this.categoryStats[category];
          if (typeof categoryStats.total !== 'number' || categoryStats.total < 0) {
            errors.push(`分类统计 ${category}.total 必须是非负数`);
          }
        });
      }

      // 验证时间线
      if (this.timeline && !Array.isArray(this.timeline)) {
        errors.push('时间线必须是数组');
      }

      if (errors.length > 0) {
        throw new Error('数据验证失败: ' + errors.join(', '));
      }
    }

    /**
     * 添加时间线事件
     */
    addTimelineEvent(event) {
      const timelineEvent = {
        timestamp: event.timestamp || Date.now(),
        action: event.action, // create, edit, view, like, share, comment, follow
        targetType: event.targetType, // project, template, visualization, user
        targetId: event.targetId,
        targetTitle: event.targetTitle || '',
        metadata: event.metadata || {}
      };

      this.timeline.push(timelineEvent);
      this.updateTimestamp();
      return this;
    }

    /**
     * 更新项目统计
     */
    updateProjectStats(project, action = 'create') {
      const category = project.category;

      // 更新基础统计
      switch (action) {
        case 'create':
          this.statistics.totalProjects++;
          if (category && this.categoryStats[category]) {
            this.categoryStats[category].total++;
          }
          break;
        case 'publish':
          this.statistics.publishedProjects++;
          if (category && this.categoryStats[category]) {
            this.categoryStats[category].published++;
          }
          break;
        case 'archive':
          this.statistics.archivedProjects++;
          break;
        case 'unarchive':
          this.statistics.archivedProjects = Math.max(0, this.statistics.archivedProjects - 1);
          break;
        case 'delete':
          this.statistics.totalProjects = Math.max(0, this.statistics.totalProjects - 1);
          if (category && this.categoryStats[category]) {
            this.categoryStats[category].total = Math.max(0, this.categoryStats[category].total - 1);
          }
          break;
      }

      // 更新草稿项目数
      this.statistics.draftProjects = this.statistics.totalProjects -
        this.statistics.publishedProjects -
        this.statistics.archivedProjects;

      this.updateTimestamp();
      return this;
    }

    /**
     * 更新互动统计
     */
    updateInteractionStats(action, targetType, category = null) {
      switch (action) {
        case 'view':
          this.statistics.totalViews++;
          if (category && this.categoryStats[category]) {
            this.categoryStats[category].views++;
          }
          break;
        case 'like':
          this.statistics.totalLikes++;
          if (category && this.categoryStats[category]) {
            this.categoryStats[category].likes++;
          }
          break;
        case 'share':
          this.statistics.totalShares++;
          if (category && this.categoryStats[category]) {
            this.categoryStats[category].shares++;
          }
          break;
        case 'comment':
          this.statistics.totalComments++;
          break;
        case 'favorite':
          this.statistics.totalFavorites++;
          break;
        case 'follow':
          this.statistics.totalFollowing++;
          break;
        case 'follower':
          this.statistics.totalFollowers++;
          break;
      }

      this.updateTimestamp();
      return this;
    }

    /**
     * 更新活跃度统计
     */
    updateActivityStats(sessionDuration = 0) {
      this.statistics.totalSessions++;
      if (sessionDuration > 0) {
        const totalDuration = this.statistics.avgSessionDuration * (this.statistics.totalSessions - 1) + sessionDuration;
        this.statistics.avgSessionDuration = totalDuration / this.statistics.totalSessions;
      }

      this.statistics.lastActiveAt = Date.now();
      this.updateTimestamp();
      return this;
    }

    /**
     * 更新活跃天数
     */
    updateActiveDays() {
      const today = new Date().toDateString();
      const lastActiveDate = new Date(this.statistics.lastActiveAt).toDateString();

      if (today !== lastActiveDate) {
        this.statistics.activeDays++;
        this.updateTimestamp();
      }

      return this.statistics.activeDays;
    }

    /**
     * 更新常用分类
     */
    updateFavoriteCategories(categories) {
      if (Array.isArray(categories)) {
        this.statistics.favoriteCategories = categories.slice(0, 10); // 保留前10个
        this.updateTimestamp();
      }
      return this;
    }

    /**
     * 更新常用标签
     */
    updateMostUsedTags(tags) {
      if (Array.isArray(tags)) {
        this.statistics.mostUsedTags = tags.slice(0, 20); // 保留前20个
        this.updateTimestamp();
      }
      return this;
    }

    /**
     * 更新常用类型
     */
    updateMostUsedTypes(types) {
      if (Array.isArray(types)) {
        this.statistics.mostUsedTypes = types.slice(0, 10); // 保留前10个
        this.updateTimestamp();
      }
      return this;
    }

    /**
     * 更新活动模式
     */
    updateActivityPatterns(patterns) {
      this.activityPatterns = {
        ...this.activityPatterns,
        ...patterns
      };
      this.updateTimestamp();
      return this;
    }

    /**
     * 更新成就
     */
    updateAchievements(achievementType, data) {
      if (!this.achievements[achievementType]) {
        this.achievements[achievementType] = null;
      }

      if (data && typeof data === 'object') {
        this.achievements[achievementType] = {
          timestamp: Date.now(),
          ...data
        };
      }

      this.updateTimestamp();
      return this;
    }

    /**
     * 添加里程碑
     */
    addMilestone(milestone) {
      if (!this.achievements.milestones) {
        this.achievements.milestones = [];
      }

      const milestoneData = {
        id: this.generateId(),
        title: milestone.title,
        description: milestone.description,
        achievedAt: Date.now(),
        category: milestone.category || 'general',
        icon: milestone.icon || '🏆',
        points: typeof milestone.points === 'number' ? milestone.points : 0,
        metadata: milestone.metadata || {}
      };

      this.achievements.milestones.push(milestoneData);
      this.updateTimestamp();
      return this;
    }

    /**
     * 添加徽章
     */
    addBadge(badge) {
      if (!this.achievements.badges) {
        this.achievements.badges = [];
      }

      const badgeData = {
        id: this.generateId(),
        name: badge.name,
        description: badge.description,
        earnedAt: Date.now(),
        category: badge.category || 'general',
        icon: badge.icon || '🎖',
        rarity: badge.rarity || 'common', // common, rare, epic, legendary
        points: typeof badge.points === 'number' ? badge.points : 0,
        metadata: badge.metadata || {}
      };

      this.achievements.badges.push(badgeData);
      this.updateTimestamp();
      return this;
    }

    /**
     * 计算趋势数据
     */
    calculateTrends(period = 30) {
      const now = Date.now();
      const periodMs = period * 24 * 60 * 60 * 1000;
      const startTime = now - periodMs;

      const relevantEvents = this.timeline.filter(event =>
        event.timestamp >= startTime && event.timestamp <= now
      );

      const trends = {
        dailyActivity: this.calculateDailyActivity(relevantEvents, period),
        actionDistribution: this.calculateActionDistribution(relevantEvents),
        categoryDistribution: this.calculateCategoryDistribution(relevantEvents),
        growthMetrics: this.calculateGrowthMetrics(relevantEvents, period),
        engagementMetrics: this.calculateEngagementMetrics(relevantEvents)
      };

      return trends;
    }

    /**
     * 计算每日活动
     */
    calculateDailyActivity(events, days) {
      const dailyActivity = {};

      for (let i = 0; i < days; i++) {
        const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
        const dateKey = date.toDateString();
        dailyActivity[dateKey] = {
          date: dateKey,
          actions: 0,
          projects: new Set(),
          uniqueActions: new Set()
        };
      }

      events.forEach(event => {
        const dateKey = new Date(event.timestamp).toDateString();
        if (dailyActivity[dateKey]) {
          dailyActivity[dateKey].actions++;
          dailyActivity[dateKey].uniqueActions.add(event.action);
          if (event.targetType === 'project') {
            dailyActivity[dateKey].projects.add(event.targetId);
          }
        }
      });

      return dailyActivity;
    }

    /**
     * 计算操作分布
     */
    calculateActionDistribution(events) {
      const distribution = {};

      events.forEach(event => {
        distribution[event.action] = (distribution[event.action] || 0) + 1;
      });

      return distribution;
    }

    /**
     * 计算分类分布
     */
    calculateCategoryDistribution(events) {
      const distribution = {};

      events.forEach(event => {
        const category = event.metadata?.category || 'unknown';
        distribution[category] = (distribution[category] || 0) + 1;
      });

      return distribution;
    }

    /**
     * 计算增长指标
     */
    calculateGrowthMetrics(events, days) {
      const now = Date.now();
      const periodMs = days * 24 * 60 * 60 * 1000;
      const halfPeriod = Math.floor(days / 2);

      const firstHalf = events.filter(event =>
        event.timestamp >= now - periodMs &&
        event.timestamp < now - halfPeriod * 24 * 60 * 60 * 1000
      );

      const secondHalf = events.filter(event =>
        event.timestamp >= now - halfPeriod * 24 * 60 * 60 * 1000 &&
        event.timestamp <= now
      );

      const firstHalfActions = new Set(firstHalf.map(e => `${e.action}-${e.targetId}`)).size;
      const secondHalfActions = new Set(secondHalf.map(e => `${e.action}-${e.targetId}`)).size;

      return {
        period: days,
        firstHalfActions,
        secondHalfActions,
        growthRate: firstHalfActions > 0 ? ((secondHalfActions - firstHalfActions) / firstHalfActions) * 100 : 0
      };
    }

    /**
     * 计算参与度指标
     */
    calculateEngagementMetrics(events) {
      const uniqueProjects = new Set();
      const totalInteractions = events.filter(e =>
        ['like', 'share', 'comment', 'favorite'].includes(e.action)
      ).length;

      events.forEach(event => {
        if (event.targetType === 'project') {
          uniqueProjects.add(event.targetId);
        }
      });

      const interactionRate = uniqueProjects.size > 0 ? totalInteractions / uniqueProjects.size : 0;

      return {
        uniqueProjects: uniqueProjects.size,
        totalInteractions,
        interactionRate,
        avgInteractionsPerProject: interactionRate
      };
    }

    /**
     * 获取用户等级
     */
    getUserLevel() {
      const score = this.calculateUserScore();

      if (score < 100) return { level: '新手', levelNum: 1, color: '#gray' };
      if (score < 500) return { level: '学徒', levelNum: 2, color: '#green' };
      if (score < 1000) return { level: '专家', levelNum: 3, color: '#blue' };
      if (score < 2000) return { level: '大师', levelNum: 4, color: '#purple' };
      return { level: '传奇', levelNum: 5, color: 'orange' };
    }

    /**
     * 计算用户得分
     */
    calculateUserScore() {
      let score = 0;

      // 项目得分
      score += this.statistics.totalProjects * 10;
      score += this.statistics.publishedProjects * 20;

      // 互动得分
      score += this.statistics.totalViews * 1;
      score += this.statistics.totalLikes * 2;
      score += this.statistics.totalShares * 5;
      score += this.statistics.totalComments * 3;

      // 收藏得分
      score += this.statistics.totalFavorites * 15;

      // 社交得分
      score += this.statistics.totalFollowers * 10;
      score += this.statistics.totalFollowing * 5;

      // 活跃度得分
      score += this.statistics.activeDays * 5;
      score += Math.min(this.statistics.totalSessions * 2, 100);

      // 成就得分
      if (this.achievements.milestones) {
        score += this.achievements.milestones.length * 50;
      }
      if (this.achievements.badges) {
        score += this.achievements.badges.reduce((sum, badge) => {
          const badgeScores = { common: 10, rare: 25, epic: 50, legendary: 100 };
          return sum + (badgeScores[badge.rarity] || 10);
        }, 0);
      }

      return score;
    }

    /**
     * 获取用户活跃度状态
     */
    getActivityStatus() {
      const daysSinceLastActive = (Date.now() - this.statistics.lastActiveAt) / (1000 * 60 * 60 * 24);
      const avgSessionsPerWeek = this.activityPatterns.avgProjectsPerWeek;

      if (daysSinceLastActive === 0 && avgSessionsPerWeek >= 5) {
        return 'very_active';
      }
      if (daysSinceLastActive <= 1 && avgSessionsPerWeek >= 3) {
        return 'active';
      }
      if (daysSinceLastActive <= 7 && avgSessionsPerWeek >= 1) {
        return 'moderate';
      }
      if (daysSinceLastActive <= 30) {
        return 'occasional';
      }
      return 'inactive';
    }

    /**
     * 获取用户类型
     */
    getUserType() {
      const stats = this.statistics;
      const publishedRatio = stats.totalProjects > 0 ? stats.publishedProjects / stats.totalProjects : 0;
      const interactionRatio = stats.totalViews > 0 ? (stats.totalLikes + stats.totalShares) / stats.totalViews : 0;
      const socialRatio = stats.totalFollowers > 0 ? stats.totalFollowing / stats.totalFollowers : 0;

      if (publishedRatio >= 0.8 && interactionRatio >= 0.1) {
        return 'creator';
      }
      if (interactionRatio >= 0.05 || socialRatio >= 1) {
        return 'socializer';
      }
      if (publishedRatio >= 0.3) {
        return 'contributor';
      }
      return 'explorer';
    }

    /**
     * 更新时间戳
     */
    updateTimestamp() {
      this.metadata.lastCalculated = Date.now();
      return this;
    }

    /**
     * 生成唯一ID
     */
    generateId() {
      return 'analytics_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    /**
     * 转换为JSON对象
     */
    toJSON() {
      return {
        userId: this.userId,
        period: this.period,
        statistics: this.statistics,
        categoryStats: this.categoryStats,
        timeline: this.timeline,
        achievements: this.achievements,
        activityPatterns: this.activityPatterns,
        metadata: this.metadata
      };
    }

    /**
     * 从JSON对象创建实例
     */
    static fromJSON(data) {
      return new UserAnalytics(data);
    }

    /**
     * 验证统计数据
     */
    static validate(data) {
      try {
        new UserAnalytics(data);
        return { valid: true, errors: [] };
      } catch (error) {
        return {
          valid: false,
          errors: [error.message]
        };
      }
    }

    /**
     * 为用户创建分析实例
     */
    static createForUser(userId, options = {}) {
      return new UserAnalytics({
        userId: userId,
        period: options.period || 'all',
        statistics: {
          totalProjects: 0,
          publishedProjects: 0,
          draftProjects: 0,
          archivedProjects: 0,
          totalViews: 0,
          totalLikes: 0,
          totalShares: 0,
          totalComments: 0,
          totalFavorites: 0,
          totalFollowers: 0,
          totalFollowing: 0,
          activeDays: 0,
          totalSessions: 0,
          avgSessionDuration: 0,
          lastActiveAt: Date.now()
        },
        categoryStats: {
          mathematics: { total: 0, published: 0, views: 0, likes: 0, shares: 0 },
          astronomy: { total: 0, published: 0, views: 0, likes: 0, shares: 0 },
          physics: { total: 0, published: 0, views: 0, likes: 0, shares: 0 },
          chemistry: { total: 0, published: 0, views: 0, likes: 0, shares: 0 }
        },
        timeline: [],
        achievements: {
          firstProject: null,
          firstLike: null,
          firstShare: null,
          firstComment: null,
          firstFollower: null,
          milestones: [],
          badges: []
        },
        activityPatterns: {
          mostActiveHours: [],
          mostActiveDays: [],
          preferredContentTypes: [],
          avgProjectsPerWeek: 0,
          peakProductivityHour: null
        }
      });
    }
  }

  // 导出到全局
  global.UserAnalytics = UserAnalytics;

})(window);