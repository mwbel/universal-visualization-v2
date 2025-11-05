/**
 * UserDataService.js - 用户数据服务
 * 提供用户相关数据的统一管理接口，包括项目、收藏、分析数据的CRUD操作
 */
(function(global) {
  'use strict';

  /**
   * 用户数据服务类
   */
  class UserDataService {
    constructor(options = {}) {
      // 依赖注入
      this.storageManager = options.storageManager || global.localStorageManager;
      this.validator = options.validator || global.validator;
      this.stateManager = options.stateManager || global.stateManager;

      // 配置选项
      this.options = {
        enableCache: options.enableCache !== false,
        enableRealTimeSync: options.enableRealTimeSync || false,
        autoSave: options.autoSave !== false,
        batchSize: options.batchSize || 50,
        retryAttempts: options.retryAttempts || 3,
        ...options
      };

      // 事件总线
      this.eventBus = new EventTarget();

      // 数据缓存
      this.cache = {
        projects: new Map(),
        favorites: new Map(),
        analytics: new Map(),
        preferences: new Map()
      };

      // 加载状态
      this.loadingStates = {
        projects: false,
        favorites: false,
        analytics: false,
        preferences: false
      };

      // 当前用户
      this.currentUserId = null;

      // 初始化
      this.init();
    }

    /**
     * 初始化服务
     */
    async init() {
      try {
        console.log('UserDataService 初始化中...');

        // 获取当前用户
        await this.loadCurrentUser();

        // 监听用户状态变化
        this.setupUserStateListeners();

        // 设置自动保存
        if (this.options.autoSave) {
          this.setupAutoSave();
        }

        console.log('UserDataService 初始化完成');
      } catch (error) {
        console.error('UserDataService 初始化失败:', error);
      }
    }

    /**
     * 加载当前用户
     */
    async loadCurrentUser() {
      try {
        // 从现有的用户管理系统获取当前用户
        if (global.userManagement && global.userManagement.currentUser) {
          this.currentUserId = global.userManagement.currentUser.id;
          console.log('已加载当前用户:', this.currentUserId);
        } else {
          // 临时使用访客模式：设置默认访客用户ID
          // TODO: 等其他功能模块完善后，恢复正常的用户认证
          this.currentUserId = 'guest_user_demo';
          console.log('使用访客模式，用户ID:', this.currentUserId);
        }
      } catch (error) {
        console.error('加载当前用户失败:', error);
        // 出错时也使用访客模式
        this.currentUserId = 'guest_user_demo';
        console.log('出错时使用访客模式，用户ID:', this.currentUserId);
      }
    }

    /**
     * 设置用户状态监听器
     */
    setupUserStateListeners() {
      // 监听用户登录/登出事件
      if (global.eventBus) {
        global.eventBus.addEventListener('user:login', (event) => {
          this.currentUserId = event.detail.user.id;
          this.clearCache();
          this.loadUserData();
        });

        global.eventBus.addEventListener('user:logout', () => {
          this.currentUserId = null;
          this.clearCache();
        });
      }
    }

    /**
     * 设置自动保存
     */
    setupAutoSave() {
      // 每隔5分钟自动保存缓存数据
      setInterval(() => {
        this.saveAllCachedData();
      }, 5 * 60 * 1000);
    }

    /**
     * 检查用户权限
     */
    checkUserPermission(action, resource) {
      if (!this.currentUserId) {
        throw new Error('用户未登录');
      }

      // 这里可以集成更复杂的权限检查逻辑
      return true;
    }

    // ==================== 项目数据管理 ====================

    /**
     * 获取用户项目列表
     */
    async getUserProjects(options = {}) {
      if (!this.currentUserId) {
        return [];
      }

      try {
        this.loadingStates.projects = true;
        this.emitEvent('projects:loading', true);

        const {
          page = 1,
          limit = 20,
          sortBy = 'updatedAt',
          sortOrder = 'desc',
          category,
          status,
          search
        } = options;

        // 从存储获取数据
        const storageKey = `projects_${this.currentUserId}`;
        let projects = this.storageManager.getItem(storageKey) || [];

        // 应用过滤器
        if (category) {
          projects = projects.filter(p => p.category === category);
        }

        if (status) {
          projects = projects.filter(p => p.status === status);
        }

        if (search) {
          const searchLower = search.toLowerCase();
          projects = projects.filter(p =>
            p.title.toLowerCase().includes(searchLower) ||
            p.description.toLowerCase().includes(searchLower) ||
            p.tags.some(tag => tag.toLowerCase().includes(searchLower))
          );
        }

        // 排序
        projects.sort((a, b) => {
          const aValue = a[sortBy];
          const bValue = b[sortBy];

          if (sortOrder === 'asc') {
            return aValue > bValue ? 1 : -1;
          } else {
            return aValue < bValue ? 1 : -1;
          }
        });

        // 分页
        const startIndex = (page - 1) * limit;
        const paginatedProjects = projects.slice(startIndex, startIndex + limit);

        // 更新缓存
        if (this.options.enableCache) {
          this.cache.projects.clear();
          paginatedProjects.forEach(project => {
            this.cache.projects.set(project.id, project);
          });
        }

        this.emitEvent('projects:loaded', paginatedProjects);

        return {
          projects: paginatedProjects,
          total: projects.length,
          page: page,
          limit: limit,
          totalPages: Math.ceil(projects.length / limit)
        };

      } catch (error) {
        console.error('获取用户项目失败:', error);
        this.emitEvent('projects:error', error);
        return [];
      } finally {
        this.loadingStates.projects = false;
        this.emitEvent('projects:loading', false);
      }
    }

    /**
     * 获取单个项目
     */
    async getProject(projectId) {
      if (!this.currentUserId || !projectId) {
        return null;
      }

      try {
        // 优先从缓存获取
        if (this.cache.projects.has(projectId)) {
          return this.cache.projects.get(projectId);
        }

        // 从存储获取
        const storageKey = `projects_${this.currentUserId}`;
        const projects = this.storageManager.getItem(storageKey) || [];
        const project = projects.find(p => p.id === projectId);

        if (project) {
          // 更新缓存
          if (this.options.enableCache) {
            this.cache.projects.set(projectId, project);
          }

          // 更新查看次数
          await this.incrementProjectViewCount(projectId);
        }

        return project || null;

      } catch (error) {
        console.error('获取项目失败:', error);
        return null;
      }
    }

    /**
     * 创建项目
     */
    async createProject(projectData) {
      if (!this.currentUserId) {
        throw new Error('用户未登录');
      }

      try {
        this.checkUserPermission('create', 'project');

        // 验证数据
        const validation = this.validator.validate('UserProject', {
          ...projectData,
          userId: this.currentUserId
        });

        if (!validation.valid) {
          throw new Error('项目数据验证失败: ' + validation.errors.join(', '));
        }

        // 创建项目实例
        const project = new global.UserProject({
          ...projectData,
          userId: this.currentUserId
        });

        // 保存到存储
        await this.saveProject(project);

        // 更新缓存
        if (this.options.enableCache) {
          this.cache.projects.set(project.id, project);
        }

        // 更新用户统计
        await this.updateUserAnalytics('create', project.id);

        this.emitEvent('project:created', project);

        return project;

      } catch (error) {
        console.error('创建项目失败:', error);
        this.emitEvent('project:error', error);
        throw error;
      }
    }

    /**
     * 更新项目
     */
    async updateProject(projectId, updateData) {
      if (!this.currentUserId || !projectId) {
        throw new Error('参数错误');
      }

      try {
        this.checkUserPermission('update', 'project');

        // 获取现有项目
        const existingProject = await this.getProject(projectId);
        if (!existingProject) {
          throw new Error('项目不存在');
        }

        // 检查权限
        if (existingProject.userId !== this.currentUserId) {
          throw new Error('无权限修改此项目');
        }

        // 更新项目数据
        const updatedProject = global.UserProject.fromJSON({
          ...existingProject,
          ...updateData,
          id: projectId,
          userId: this.currentUserId
        });

        // 验证更新后的数据
        const validation = this.validator.validate('UserProject', updatedProject.toJSON());
        if (!validation.valid) {
          throw new Error('项目数据验证失败: ' + validation.errors.join(', '));
        }

        // 保存更新
        await this.saveProject(updatedProject);

        // 更新缓存
        if (this.options.enableCache) {
          this.cache.projects.set(projectId, updatedProject);
        }

        // 更新用户统计
        await this.updateUserAnalytics('edit', projectId);

        this.emitEvent('project:updated', updatedProject);

        return updatedProject;

      } catch (error) {
        console.error('更新项目失败:', error);
        this.emitEvent('project:error', error);
        throw error;
      }
    }

    /**
     * 删除项目
     */
    async deleteProject(projectId) {
      if (!this.currentUserId || !projectId) {
        throw new Error('参数错误');
      }

      try {
        this.checkUserPermission('delete', 'project');

        // 获取项目确认权限
        const project = await this.getProject(projectId);
        if (!project) {
          throw new Error('项目不存在');
        }

        if (project.userId !== this.currentUserId) {
          throw new Error('无权限删除此项目');
        }

        // 从存储删除
        const storageKey = `projects_${this.currentUserId}`;
        let projects = this.storageManager.getItem(storageKey) || [];
        projects = projects.filter(p => p.id !== projectId);
        this.storageManager.setItem(storageKey, projects);

        // 从缓存删除
        this.cache.projects.delete(projectId);

        // 更新用户统计
        await this.updateUserAnalytics('delete', projectId);

        this.emitEvent('project:deleted', projectId);

        return true;

      } catch (error) {
        console.error('删除项目失败:', error);
        this.emitEvent('project:error', error);
        throw error;
      }
    }

    /**
     * 保存项目到存储
     */
    async saveProject(project) {
      const storageKey = `projects_${this.currentUserId}`;
      let projects = this.storageManager.getItem(storageKey) || [];

      const existingIndex = projects.findIndex(p => p.id === project.id);
      if (existingIndex > -1) {
        projects[existingIndex] = project.toJSON();
      } else {
        projects.push(project.toJSON());
      }

      this.storageManager.setItem(storageKey, projects);
    }

    /**
     * 增加项目查看次数
     */
    async incrementProjectViewCount(projectId) {
      try {
        const storageKey = `projects_${this.currentUserId}`;
        let projects = this.storageManager.getItem(storageKey) || [];
        const projectIndex = projects.findIndex(p => p.id === projectId);

        if (projectIndex > -1) {
          projects[projectIndex].metadata.viewCount++;
          projects[projectIndex].metadata.lastViewed = Date.now();
          this.storageManager.setItem(storageKey, projects);

          // 更新缓存
          if (this.cache.projects.has(projectId)) {
            const cachedProject = this.cache.projects.get(projectId);
            cachedProject.incrementViewCount();
          }
        }
      } catch (error) {
        console.error('更新项目查看次数失败:', error);
      }
    }

    // ==================== 收藏数据管理 ====================

    /**
     * 获取用户收藏列表
     */
    async getUserFavorites(options = {}) {
      if (!this.currentUserId) {
        return [];
      }

      try {
        this.loadingStates.favorites = true;
        this.emitEvent('favorites:loading', true);

        const {
          page = 1,
          limit = 20,
          folderId,
          targetType,
          sortBy = 'createdAt',
          sortOrder = 'desc'
        } = options;

        const storageKey = `favorites_${this.currentUserId}`;
        let favorites = this.storageManager.getItem(storageKey) || [];

        // 应用过滤器
        if (folderId) {
          favorites = favorites.filter(f => f.folderId === folderId);
        }

        if (targetType) {
          favorites = favorites.filter(f => f.targetType === targetType);
        }

        // 排序
        favorites.sort((a, b) => {
          const aValue = a[sortBy];
          const bValue = b[sortBy];

          if (sortOrder === 'asc') {
            return aValue > bValue ? 1 : -1;
          } else {
            return aValue < bValue ? 1 : -1;
          }
        });

        // 分页
        const startIndex = (page - 1) * limit;
        const paginatedFavorites = favorites.slice(startIndex, startIndex + limit);

        // 更新缓存
        if (this.options.enableCache) {
          this.cache.favorites.clear();
          paginatedFavorites.forEach(favorite => {
            this.cache.favorites.set(favorite.id, favorite);
          });
        }

        this.emitEvent('favorites:loaded', paginatedFavorites);

        return {
          favorites: paginatedFavorites,
          total: favorites.length,
          page: page,
          limit: limit,
          totalPages: Math.ceil(favorites.length / limit)
        };

      } catch (error) {
        console.error('获取用户收藏失败:', error);
        this.emitEvent('favorites:error', error);
        return [];
      } finally {
        this.loadingStates.favorites = false;
        this.emitEvent('favorites:loading', false);
      }
    }

    /**
     * 添加收藏
     */
    async addFavorite(targetType, targetId, options = {}) {
      if (!this.currentUserId) {
        throw new Error('用户未登录');
      }

      try {
        this.checkUserPermission('create', 'favorite');

        // 检查是否已收藏
        const existingFavorites = await this.getUserFavorites();
        const alreadyExists = existingFavorites.favorites.some(f =>
          f.targetType === targetType && f.targetId === targetId
        );

        if (alreadyExists) {
          throw new Error('已经收藏过了');
        }

        // 创建收藏实例
        const favorite = new global.UserFavorite({
          userId: this.currentUserId,
          targetType: targetType,
          targetId: targetId,
          folderId: options.folderId || null,
          properties: options.properties || {}
        });

        // 保存到存储
        const storageKey = `favorites_${this.currentUserId}`;
        let favorites = this.storageManager.getItem(storageKey) || [];
        favorites.push(favorite.toJSON());
        this.storageManager.setItem(storageKey, favorites);

        // 更新缓存
        if (this.options.enableCache) {
          this.cache.favorites.set(favorite.id, favorite);
        }

        // 更新用户统计
        await this.updateUserAnalytics('favorite', targetId);

        this.emitEvent('favorite:added', favorite);

        return favorite;

      } catch (error) {
        console.error('添加收藏失败:', error);
        this.emitEvent('favorite:error', error);
        throw error;
      }
    }

    /**
     * 移除收藏
     */
    async removeFavorite(favoriteId) {
      if (!this.currentUserId || !favoriteId) {
        throw new Error('参数错误');
      }

      try {
        this.checkUserPermission('delete', 'favorite');

        const storageKey = `favorites_${this.currentUserId}`;
        let favorites = this.storageManager.getItem(storageKey) || [];

        const favoriteIndex = favorites.findIndex(f => f.id === favoriteId);
        if (favoriteIndex === -1) {
          throw new Error('收藏不存在');
        }

        const removedFavorite = favorites[favoriteIndex];
        favorites.splice(favoriteIndex, 1);
        this.storageManager.setItem(storageKey, favorites);

        // 从缓存删除
        this.cache.favorites.delete(favoriteId);

        this.emitEvent('favorite:removed', favoriteId);

        return removedFavorite;

      } catch (error) {
        console.error('移除收藏失败:', error);
        this.emitEvent('favorite:error', error);
        throw error;
      }
    }

    // ==================== 用户分析数据管理 ====================

    /**
     * 获取用户分析数据
     */
    async getUserAnalytics() {
      if (!this.currentUserId) {
        return null;
      }

      try {
        this.loadingStates.analytics = true;
        this.emitEvent('analytics:loading', true);

        // 优先从缓存获取
        if (this.cache.analytics.has(this.currentUserId)) {
          return this.cache.analytics.get(this.currentUserId);
        }

        const storageKey = `analytics_${this.currentUserId}`;
        let analyticsData = this.storageManager.getItem(storageKey);

        if (!analyticsData) {
          // 创建新的分析数据
          analyticsData = new global.UserAnalytics({
            userId: this.currentUserId
          });
        } else {
          analyticsData = global.UserAnalytics.fromJSON(analyticsData);
        }

        // 更新缓存
        if (this.options.enableCache) {
          this.cache.analytics.set(this.currentUserId, analyticsData);
        }

        this.emitEvent('analytics:loaded', analyticsData);

        return analyticsData;

      } catch (error) {
        console.error('获取用户分析数据失败:', error);
        this.emitEvent('analytics:error', error);
        return null;
      } finally {
        this.loadingStates.analytics = false;
        this.emitEvent('analytics:loading', false);
      }
    }

    /**
     * 更新用户分析数据
     */
    async updateUserAnalytics(action, targetId, metadata = {}) {
      if (!this.currentUserId) {
        return;
      }

      try {
        const analytics = await this.getUserAnalytics();
        if (!analytics) {
          return;
        }

        // 添加时间线事件
        analytics.addTimelineEvent({
          action: action,
          targetId: targetId,
          metadata: metadata
        });

        // 更新统计数据
        switch (action) {
          case 'create':
            analytics.updateProjectStats('totalProjects', 1);
            break;
          case 'view':
            analytics.updateProjectStats('totalViews', 1);
            break;
          case 'like':
          case 'favorite':
            analytics.updateProjectStats('totalLikes', 1);
            break;
          case 'edit':
            analytics.updateProjectStats('totalEdits', 1);
            break;
        }

        // 保存更新
        const storageKey = `analytics_${this.currentUserId}`;
        this.storageManager.setItem(storageKey, analytics.toJSON());

        // 更新缓存
        if (this.options.enableCache) {
          this.cache.analytics.set(this.currentUserId, analytics);
        }

        this.emitEvent('analytics:updated', analytics);

      } catch (error) {
        console.error('更新用户分析数据失败:', error);
      }
    }

    // ==================== 工具方法 ====================

    /**
     * 清除所有缓存
     */
    clearCache() {
      Object.keys(this.cache).forEach(key => {
        this.cache[key].clear();
      });
      console.log('用户数据缓存已清除');
    }

    /**
     * 保存所有缓存数据
     */
    async saveAllCachedData() {
      try {
        // 保存项目缓存
        if (this.cache.projects.size > 0) {
          const projects = Array.from(this.cache.projects.values());
          const storageKey = `projects_${this.currentUserId}`;
          this.storageManager.setItem(storageKey, projects.map(p => p.toJSON()));
        }

        console.log('缓存数据已保存');
      } catch (error) {
        console.error('保存缓存数据失败:', error);
      }
    }

    /**
     * 加载用户数据
     */
    async loadUserData() {
      if (!this.currentUserId) {
        return;
      }

      try {
        await Promise.all([
          this.getUserProjects(),
          this.getUserFavorites(),
          this.getUserAnalytics()
        ]);

        console.log('用户数据加载完成');
      } catch (error) {
        console.error('加载用户数据失败:', error);
      }
    }

    /**
     * 发送事件
     */
    emitEvent(eventName, data) {
      const event = new CustomEvent(eventName, { detail: data });
      this.eventBus.dispatchEvent(event);
    }

    /**
     * 监听事件
     */
    addEventListener(eventName, callback) {
      this.eventBus.addEventListener(eventName, callback);
    }

    /**
     * 移除事件监听
     */
    removeEventListener(eventName, callback) {
      this.eventBus.removeEventListener(eventName, callback);
    }

    /**
     * 获取加载状态
     */
    isLoading(dataType) {
      return this.loadingStates[dataType] || false;
    }

    /**
     * 获取服务统计信息
     */
    getServiceStats() {
      return {
        cacheSize: {
          projects: this.cache.projects.size,
          favorites: this.cache.favorites.size,
          analytics: this.cache.analytics.size,
          preferences: this.cache.preferences.size
        },
        currentUserId: this.currentUserId,
        loadingStates: this.loadingStates,
        options: this.options
      };
    }
  }

  // 创建全局实例
  const userDataService = new UserDataService();

  // 导出到全局
  global.UserDataService = UserDataService;
  global.userDataService = userDataService;

})(window);