/**
 * UserFavorite.js - 用户收藏数据模型
 * 定义用户收藏内容的数据结构和操作方法
 */
(function(global) {
  'use strict';

  /**
   * 用户收藏数据模型类
   */
  class UserFavorite {
    constructor(data = {}) {
      // 基础属性
      this.id = data.id || this.generateId();
      this.userId = data.userId || null;

      // 收藏目标
      this.targetType = data.targetType || 'project'; // project, template, visualization, user
      this.targetId = data.targetId || null;
      this.targetTitle = data.targetTitle || '';
      this.targetDescription = data.targetDescription || '';
      this.targetThumbnail = data.targetThumbnail || '';
      this.targetUrl = data.targetUrl || '';

      // 收藏夹管理
      this.folderId = data.folderId || 'default';
      this.folderName = data.folderName || '默认收藏夹';
      this.customTags = Array.isArray(data.customTags) ? data.customTags : [];

      // 元数据
      this.createdAt = data.createdAt || Date.now();
      this.updatedAt = data.updatedAt || Date.now();
      this.lastAccessed = data.lastAccessed || Date.now();

      // 收藏属性
      this.properties = {
        priority: data.properties?.priority || 'normal', // low, normal, high
        isPrivate: typeof data.properties?.isPrivate === 'boolean' ? data.properties.isPrivate : false,
        isPinned: typeof data.properties?.isPinned === 'boolean' ? data.properties.isPinned : false,
        notes: data.properties?.notes || '',
        rating: typeof data.properties?.rating === 'number' ? data.properties.rating : null,
        tags: Array.isArray(data.properties?.tags) ? data.properties.tags : [],
        metadata: data.properties?.metadata || {},
        ...data.properties
      };

      // 统计信息
      this.stats = {
        accessCount: typeof data.stats?.accessCount === 'number' ? data.stats.accessCount : 0,
        shareCount: typeof data.stats?.shareCount === 'number' ? data.stats.shareCount : 0,
        copyCount: typeof data.stats?.copyCount === 'number' ? data.stats.copyCount : 0,
        ...data.stats
      };

      // 状态管理
      this.status = data.status || 'active'; // active, archived, deleted

      // 验证数据完整性
      this.validate();
    }

    /**
     * 生成唯一ID
     */
    generateId() {
      return 'favorite_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    /**
     * 验证数据完整性
     */
    validate() {
      const errors = [];

      // 验证必需字段
      if (!this.id) errors.push('收藏ID不能为空');
      if (!this.userId) errors.push('用户ID不能为空');
      if (!this.targetType) errors.push('收藏目标类型不能为空');
      if (!this.targetId) errors.push('收藏目标ID不能为空');

      // 验证目标类型
      const validTypes = ['project', 'template', 'visualization', 'user'];
      if (!validTypes.includes(this.targetType)) {
        errors.push('无效的收藏目标类型');
      }

      // 验证状态
      const validStatuses = ['active', 'archived', 'deleted'];
      if (!validStatuses.includes(this.status)) {
        errors.push('无效的收藏状态');
      }

      // 验证优先级
      const validPriorities = ['low', 'normal', 'high'];
      if (!validPriorities.includes(this.properties.priority)) {
        errors.push('无效的优先级设置');
      }

      // 验证评分
      if (this.properties.rating !== null &&
          (typeof this.properties.rating !== 'number' ||
           this.properties.rating < 1 ||
           this.properties.rating > 5)) {
        errors.push('评分必须是1-5之间的数字');
      }

      if (errors.length > 0) {
        throw new Error('数据验证失败: ' + errors.join(', '));
      }
    }

    /**
     * 更新访问时间
     */
    updateAccessed() {
      this.lastAccessed = Date.now();
      this.stats.accessCount++;
      this.updatedAt = Date.now();
      return this;
    }

    /**
     * 更新元数据
     */
    updateMetadata(newMetadata) {
      this.properties.metadata = {
        ...this.properties.metadata,
        ...newMetadata
      };
      this.updatedAt = Date.now();
      return this;
    }

    /**
     * 更新属性
     */
    updateProperties(newProperties) {
      this.properties = {
        ...this.properties,
        ...newProperties
      };
      this.updatedAt = Date.now();
      return this;
    }

    /**
     * 更新统计信息
     */
    updateStats(newStats) {
      this.stats = {
        ...this.stats,
        ...newStats
      };
      this.updatedAt = Date.now();
      return this;
    }

    /**
     * 设置评分
     */
    setRating(rating) {
      if (typeof rating !== 'number' || rating < 1 || rating > 5) {
        throw new Error('评分必须是1-5之间的数字');
      }
      this.properties.rating = rating;
      this.updatedAt = Date.now();
      return this;
    }

    /**
     * 添加标签
     */
    addTag(tag) {
      if (typeof tag === 'string' && tag.trim().length > 0) {
        const cleanTag = tag.trim();
        if (!this.properties.tags.includes(cleanTag)) {
          this.properties.tags.push(cleanTag);
          this.updatedAt = Date.now();
        }
      }
      return this;
    }

    /**
     * 移除标签
     */
    removeTag(tag) {
      if (typeof tag === 'string') {
        const cleanTag = tag.trim();
        const index = this.properties.tags.indexOf(cleanTag);
        if (index > -1) {
          this.properties.tags.splice(index, 1);
          this.updatedAt = Date.now();
        }
      }
      return this;
    }

    /**
     * 添加自定义标签
     */
    addCustomTag(tag) {
      if (typeof tag === 'string' && tag.trim().length > 0) {
        const cleanTag = tag.trim();
        if (!this.customTags.includes(cleanTag)) {
          this.customTags.push(cleanTag);
          this.updatedAt = Date.now();
        }
      }
      return this;
    }

    /**
     * 移除自定义标签
     */
    removeCustomTag(tag) {
      if (typeof tag === 'string') {
        const cleanTag = tag.trim();
        const index = this.customTags.indexOf(cleanTag);
        if (index > -1) {
          this.customTags.splice(index, 1);
          this.updatedAt = Date.now();
        }
      }
      return this;
    }

    /**
     * 设置优先级
     */
    setPriority(priority) {
      const validPriorities = ['low', 'normal', 'high'];
      if (!validPriorities.includes(priority)) {
        throw new Error('优先级必须是 low、normal 或 high');
      }
      this.properties.priority = priority;
      this.updatedAt = Date.now();
      return this;
    }

    /**
     * 设置私有状态
     */
    setPrivate(isPrivate) {
      this.properties.isPrivate = Boolean(isPrivate);
      this.updatedAt = Date.now();
      return this;
    }

    /**
     * 设置置顶状态
     */
    setPinned(isPinned) {
      this.properties.isPinned = Boolean(isPinned);
      this.updatedAt = Date.now();
      return this;
    }

    /**
     * 设置备注
     */
    setNotes(notes) {
      this.properties.notes = String(notes || '');
      this.updatedAt = Date.now();
      return this;
    }

    /**
     * 移动到收藏夹
     */
    moveToFolder(folderId, folderName) {
      this.folderId = folderId || 'default';
      if (folderName) {
        this.folderName = folderName;
      }
      this.updatedAt = Date.now();
      return this;
    }

    /**
     * 归档收藏
     */
    archive() {
      if (this.status === 'active') {
        this.status = 'archived';
        this.updatedAt = Date.now();
      }
      return this;
    }

    /**
     * 恢复收藏
     */
    restore() {
      if (this.status === 'archived') {
        this.status = 'active';
        this.updatedAt = Date.now();
      }
      return this;
    }

    /**
     * 删除收藏
     */
    delete() {
      this.status = 'deleted';
      this.updatedAt = Date.now();
      return this;
    }

    /**
     * 增加分享次数
     */
    incrementShareCount() {
      this.stats.shareCount++;
      this.updatedAt = Date.now();
      return this;
    }

    /**
     * 增加复制次数
     */
    incrementCopyCount() {
      this.stats.copyCount++;
      this.updatedAt = Date.now();
      return this;
    }

    /**
     * 获取收藏摘要信息
     */
    getSummary() {
      return {
        id: this.id,
        targetType: this.targetType,
        targetId: this.targetId,
        targetTitle: this.targetTitle,
        targetDescription: this.targetDescription,
        targetThumbnail: this.targetThumbnail,
        folderId: this.folderId,
        folderName: this.folderName,
        properties: {
          priority: this.properties.priority,
          isPrivate: this.properties.isPrivate,
          isPinned: this.properties.isPinned,
          rating: this.properties.rating,
          tags: this.properties.tags,
          notes: this.properties.notes
        },
        stats: {
          accessCount: this.stats.accessCount,
          shareCount: this.stats.shareCount,
          copyCount: this.stats.copyCount
        },
        status: this.status,
        createdAt: this.createdAt,
        updatedAt: this.updatedAt,
        lastAccessed: this.lastAccessed
      };
    }

    /**
     * 转换为JSON对象
     */
    toJSON() {
      return {
        id: this.id,
        userId: this.userId,
        targetType: this.targetType,
        targetId: this.targetId,
        targetTitle: this.targetTitle,
        targetDescription: this.targetDescription,
        targetThumbnail: this.targetThumbnail,
        targetUrl: this.targetUrl,
        folderId: this.folderId,
        folderName: this.folderName,
        customTags: this.customTags,
        createdAt: this.createdAt,
        updatedAt: this.updatedAt,
        lastAccessed: this.lastAccessed,
        properties: this.properties,
        stats: this.stats,
        status: this.status
      };
    }

    /**
     * 从JSON对象创建实例
     */
    static fromJSON(data) {
      return new UserFavorite(data);
    }

    /**
     * 创建新收藏
     */
    static create(userId, targetType, targetId, options = {}) {
      return new UserFavorite({
        userId: userId,
        targetType: targetType,
        targetId: targetId,
        targetTitle: options.title || '',
        targetDescription: options.description || '',
        targetThumbnail: options.thumbnail || '',
        targetUrl: options.url || '',
        folderId: options.folderId || 'default',
        folderName: options.folderName || '默认收藏夹',
        properties: {
          priority: options.priority || 'normal',
          isPrivate: options.isPrivate || false,
          isPinned: options.isPinned || false,
          notes: options.notes || '',
          rating: options.rating || null,
          tags: options.tags || [],
          metadata: options.metadata || {}
        }
      });
    }

    /**
     * 验证收藏数据
     */
    static validate(data) {
      try {
        new UserFavorite(data);
        return { valid: true, errors: [] };
      } catch (error) {
        return {
          valid: false,
          errors: [error.message]
        };
      }
    }

    /**
     * 搜索匹配
     */
    matches(searchQuery) {
      if (!searchQuery || typeof searchQuery !== 'string') {
        return false;
      }

      const query = searchQuery.toLowerCase();

      // 搜索标题
      if (this.targetTitle.toLowerCase().includes(query)) {
        return true;
      }

      // 搜索描述
      if (this.targetDescription.toLowerCase().includes(query)) {
        return true;
      }

      // 搜索标签
      if (this.properties.tags.some(tag => tag.toLowerCase().includes(query))) {
        return true;
      }

      // 搜索自定义标签
      if (this.customTags.some(tag => tag.toLowerCase().includes(query))) {
        return true;
      }

      // 搜索收藏夹名称
      if (this.folderName.toLowerCase().includes(query)) {
        return true;
      }

      // 搜索备注
      if (this.properties.notes.toLowerCase().includes(query)) {
        return true;
      }

      // 搜索目标类型
      if (this.targetType.toLowerCase().includes(query)) {
        return true;
      }

      return false;
    }

    /**
     * 获取收藏价值评分
     */
    getValueScore() {
      let score = 0;

      // 评分加分
      if (this.properties.rating) {
        score += this.properties.rating * 10;
      }

      // 访问次数加分
      score += Math.min(this.stats.accessCount, 50);

      // 优先级加分
      const priorityScores = {
        high: 20,
        normal: 10,
        low: 5
      };
      score += priorityScores[this.properties.priority] || 0;

      // 置顶加分
      if (this.properties.isPinned) {
        score += 15;
      }

      // 最近访问加分
      const daysSinceAccess = (Date.now() - this.lastAccessed) / (1000 * 60 * 60 * 24);
      if (daysSinceAccess < 7) {
        score += 10;
      } else if (daysSinceAccess < 30) {
        score += 5;
      }

      return score;
    }

    /**
     * 获取收藏热度
     */
    getPopularity() {
      const total = this.stats.accessCount + this.stats.shareCount + this.stats.copyCount;

      if (total === 0) return 'cold';
      if (total < 10) return 'warm';
      if (total < 50) return 'hot';
      return 'viral';
    }

    /**
     * 检查是否为高价值收藏
     */
    isHighValue() {
      return this.getValueScore() > 50 || this.properties.rating >= 4;
    }

    /**
     * 检查是否为最近访问
     */
    isRecentlyAccessed(days = 7) {
      const daysSinceAccess = (Date.now() - this.lastAccessed) / (1000 * 60 * 60 * 24);
      return daysSinceAccess <= days;
    }

    /**
     * 获取收藏年龄（天数）
     */
    getAgeInDays() {
      return Math.floor((Date.now() - this.createdAt) / (1000 * 60 * 60 * 24));
    }
  }

  // 导出到全局
  global.UserFavorite = UserFavorite;

})(window);