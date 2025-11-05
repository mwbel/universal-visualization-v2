/**
 * UserProject.js - 用户项目数据模型
 * 定义用户可视化项目的数据结构和操作方法
 */
(function(global) {
  'use strict';

  /**
   * 用户项目数据模型类
   */
  class UserProject {
    constructor(data = {}) {
      // 基础属性
      this.id = data.id || this.generateId();
      this.userId = data.userId || null;
      this.title = data.title || '未命名项目';
      this.description = data.description || '';

      // 项目分类
      this.type = data.type || 'visualization'; // visualization, analysis, report
      this.category = data.category || 'mathematics'; // mathematics, astronomy, physics, chemistry
      this.tags = Array.isArray(data.tags) ? data.tags : [];

      // 项目内容
      this.content = {
        components: Array.isArray(data.content?.components) ? data.content.components : [],
        layout: data.content?.layout || {
          type: 'single-column',
          sections: []
        },
        data: data.content?.data || {},
        settings: data.content?.settings || {},
        ...data.content
      };

      // 元数据
      this.metadata = {
        createdAt: data.metadata?.createdAt || Date.now(),
        updatedAt: data.metadata?.updatedAt || Date.now(),
        lastViewed: data.metadata?.lastViewed || Date.now(),
        viewCount: typeof data.metadata?.viewCount === 'number' ? data.metadata.viewCount : 0,
        likeCount: typeof data.metadata?.likeCount === 'number' ? data.metadata.likeCount : 0,
        shareCount: typeof data.metadata?.shareCount === 'number' ? data.metadata.shareCount : 0,
        version: data.metadata?.version || '1.0',
        thumbnail: data.metadata?.thumbnail || null,
        ...data.metadata
      };

      // 项目设置
      this.settings = {
        visibility: data.settings?.visibility || 'private', // public, private, unlisted
        allowComments: typeof data.settings?.allowComments === 'boolean' ? data.settings.allowComments : true,
        allowFork: typeof data.settings?.allowFork === 'boolean' ? data.settings.allowFork : false,
        allowDownload: typeof data.settings?.allowDownload === 'boolean' ? data.settings.allowDownload : true,
        showInProfile: typeof data.settings?.showInProfile === 'boolean' ? data.settings.showInProfile : true,
        ...data.settings
      };

      // 协作信息
      this.collaboration = {
        collaborators: Array.isArray(data.collaboration?.collaborators) ? data.collaboration.collaborators : [],
        owner: data.collaboration?.owner || data.userId,
        permissions: data.collaboration?.permissions || {},
        ...data.collaboration
      };

      // 状态管理
      this.status = data.status || 'draft'; // draft, published, archived

      // 验证数据完整性
      this.validate();
    }

    /**
     * 生成唯一ID
     */
    generateId() {
      return 'project_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    /**
     * 验证数据完整性
     */
    validate() {
      const errors = [];

      // 验证必需字段
      if (!this.id) errors.push('项目ID不能为空');
      if (!this.userId) errors.push('用户ID不能为空');
      if (!this.title || this.title.trim().length === 0) errors.push('项目标题不能为空');

      // 验证类型
      const validTypes = ['visualization', 'analysis', 'report'];
      if (!validTypes.includes(this.type)) {
        errors.push('无效的项目类型');
      }

      // 验证分类
      const validCategories = ['mathematics', 'astronomy', 'physics', 'chemistry'];
      if (!validCategories.includes(this.category)) {
        errors.push('无效的项目分类');
      }

      // 验证可见性设置
      const validVisibilities = ['public', 'private', 'unlisted'];
      if (!validVisibilities.includes(this.settings.visibility)) {
        errors.push('无效的可见性设置');
      }

      // 验证状态
      const validStatuses = ['draft', 'published', 'archived'];
      if (!validStatuses.includes(this.status)) {
        errors.push('无效的项目状态');
      }

      if (errors.length > 0) {
        throw new Error('数据验证失败: ' + errors.join(', '));
      }
    }

    /**
     * 更新项目内容
     */
    updateContent(newContent) {
      this.content = {
        ...this.content,
        ...newContent
      };
      this.metadata.updatedAt = Date.now();
      return this;
    }

    /**
     * 更新元数据
     */
    updateMetadata(newMetadata) {
      this.metadata = {
        ...this.metadata,
        ...newMetadata,
        updatedAt: Date.now()
      };
      return this;
    }

    /**
     * 更新设置
     */
    updateSettings(newSettings) {
      this.settings = {
        ...this.settings,
        ...newSettings
      };
      this.metadata.updatedAt = Date.now();
      return this;
    }

    /**
     * 添加标签
     */
    addTag(tag) {
      if (typeof tag === 'string' && tag.trim().length > 0) {
        const cleanTag = tag.trim().toLowerCase();
        if (!this.tags.includes(cleanTag)) {
          this.tags.push(cleanTag);
          this.metadata.updatedAt = Date.now();
        }
      }
      return this;
    }

    /**
     * 移除标签
     */
    removeTag(tag) {
      if (typeof tag === 'string') {
        const cleanTag = tag.trim().toLowerCase();
        const index = this.tags.indexOf(cleanTag);
        if (index > -1) {
          this.tags.splice(index, 1);
          this.metadata.updatedAt = Date.now();
        }
      }
      return this;
    }

    /**
     * 添加协作者
     */
    addCollaborator(userId, permissions = {}) {
      if (!userId) return this;

      const existingIndex = this.collaboration.collaborators.findIndex(c => c.userId === userId);

      if (existingIndex > -1) {
        // 更新现有协作者权限
        this.collaboration.collaborators[existingIndex].permissions = {
          ...this.collaboration.collaborators[existingIndex].permissions,
          ...permissions
        };
      } else {
        // 添加新协作者
        this.collaboration.collaborators.push({
          userId: userId,
          permissions: permissions,
          addedAt: Date.now()
        });
      }

      this.metadata.updatedAt = Date.now();
      return this;
    }

    /**
     * 移除协作者
     */
    removeCollaborator(userId) {
      const index = this.collaboration.collaborators.findIndex(c => c.userId === userId);
      if (index > -1) {
        this.collaboration.collaborators.splice(index, 1);
        this.metadata.updatedAt = Date.now();
      }
      return this;
    }

    /**
     * 增加查看次数
     */
    incrementViewCount() {
      this.metadata.viewCount++;
      this.metadata.lastViewed = Date.now();
      return this;
    }

    /**
     * 增加点赞数
     */
    incrementLikeCount() {
      this.metadata.likeCount++;
      this.metadata.updatedAt = Date.now();
      return this;
    }

    /**
     * 增加分享数
     */
    incrementShareCount() {
      this.metadata.shareCount++;
      this.metadata.updatedAt = Date.now();
      return this;
    }

    /**
     * 发布项目
     */
    publish() {
      if (this.status === 'draft') {
        this.status = 'published';
        this.metadata.publishedAt = Date.now();
        this.metadata.updatedAt = Date.now();
      }
      return this;
    }

    /**
     * 归档项目
     */
    archive() {
      if (this.status === 'published') {
        this.status = 'archived';
        this.metadata.archivedAt = Date.now();
        this.metadata.updatedAt = Date.now();
      }
      return this;
    }

    /**
     * 恢复项目
     */
    restore() {
      if (this.status === 'archived') {
        this.status = 'draft';
        delete this.metadata.archivedAt;
        this.metadata.updatedAt = Date.now();
      }
      return this;
    }

    /**
     * 克隆项目
     */
    clone(newTitle) {
      const cloneData = this.toJSON();
      delete cloneData.id;
      delete cloneData.metadata.createdAt;
      delete cloneData.metadata.publishedAt;
      delete cloneData.metadata.archivedAt;

      if (newTitle) {
        cloneData.title = newTitle;
      } else {
        cloneData.title = this.title + ' (副本)';
      }

      cloneData.status = 'draft';
      cloneData.metadata.viewCount = 0;
      cloneData.metadata.likeCount = 0;
      cloneData.metadata.shareCount = 0;

      return new UserProject(cloneData);
    }

    /**
     * 检查用户权限
     */
    hasPermission(userId, permission) {
      // 项目所有者拥有所有权限
      if (this.userId === userId) {
        return true;
      }

      // 检查协作者权限
      const collaborator = this.collaboration.collaborators.find(c => c.userId === userId);
      if (collaborator && collaborator.permissions[permission]) {
        return true;
      }

      // 公开项目的查看权限
      if (this.settings.visibility === 'public' && permission === 'view') {
        return true;
      }

      return false;
    }

    /**
     * 获取项目摘要信息
     */
    getSummary() {
      return {
        id: this.id,
        title: this.title,
        description: this.description,
        type: this.type,
        category: this.category,
        tags: this.tags,
        status: this.status,
        thumbnail: this.metadata.thumbnail,
        createdAt: this.metadata.createdAt,
        updatedAt: this.metadata.updatedAt,
        viewCount: this.metadata.viewCount,
        likeCount: this.metadata.likeCount,
        settings: {
          visibility: this.settings.visibility
        }
      };
    }

    /**
     * 转换为JSON对象
     */
    toJSON() {
      return {
        id: this.id,
        userId: this.userId,
        title: this.title,
        description: this.description,
        type: this.type,
        category: this.category,
        tags: this.tags,
        content: this.content,
        metadata: this.metadata,
        settings: this.settings,
        collaboration: this.collaboration,
        status: this.status
      };
    }

    /**
     * 从JSON对象创建实例
     */
    static fromJSON(data) {
      return new UserProject(data);
    }

    /**
     * 创建空项目
     */
    static createEmpty(userId, options = {}) {
      return new UserProject({
        userId: userId,
        type: options.type || 'visualization',
        category: options.category || 'mathematics',
        title: options.title || '新项目',
        description: options.description || '',
        tags: options.tags || [],
        content: {
          components: [],
          layout: {
            type: 'single-column',
            sections: []
          },
          data: {},
          settings: {}
        },
        settings: {
          visibility: options.visibility || 'private',
          allowComments: true,
          allowFork: false,
          allowDownload: true,
          showInProfile: true
        }
      });
    }

    /**
     * 验证项目数据
     */
    static validate(data) {
      try {
        new UserProject(data);
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
      if (this.title.toLowerCase().includes(query)) {
        return true;
      }

      // 搜索描述
      if (this.description.toLowerCase().includes(query)) {
        return true;
      }

      // 搜索标签
      if (this.tags.some(tag => tag.toLowerCase().includes(query))) {
        return true;
      }

      // 搜索分类
      if (this.category.toLowerCase().includes(query)) {
        return true;
      }

      // 搜索类型
      if (this.type.toLowerCase().includes(query)) {
        return true;
      }

      return false;
    }

    /**
     * 获取项目大小
     */
    getSize() {
      const contentSize = JSON.stringify(this.content).length;
      const metadataSize = JSON.stringify(this.metadata).length;
      return contentSize + metadataSize;
    }

    /**
     * 检查项目是否为空
     */
    isEmpty() {
      return this.content.components.length === 0;
    }

    /**
     * 获取项目复杂度
     */
    getComplexity() {
      const componentCount = this.content.components.length;
      const dataSize = Object.keys(this.content.data).length;

      if (componentCount === 0) return 'empty';
      if (componentCount <= 3 && dataSize <= 2) return 'simple';
      if (componentCount <= 10 && dataSize <= 5) return 'medium';
      return 'complex';
    }

    /**
     * 估算项目加载时间
     */
    estimateLoadTime() {
      const complexity = this.getComplexity();
      const baseTime = {
        empty: 100,
        simple: 300,
        medium: 800,
        complex: 2000
      };

      return baseTime[complexity] || 1000;
    }
  }

  // 导出到全局
  global.UserProject = UserProject;

})(window);