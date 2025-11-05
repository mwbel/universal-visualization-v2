/**
 * ProjectDataService.js - 项目数据服务
 * 专门处理项目的复杂业务逻辑，包括项目管理、批量操作、搜索和分析
 */
(function(global) {
  'use strict';

  /**
   * 项目数据服务类
   */
  class ProjectDataService {
    constructor(options = {}) {
      // 依赖注入
      this.userDataService = options.userDataService || global.userDataService;
      this.storageManager = options.storageManager || global.localStorageManager;
      this.validator = options.validator || global.validator;

      // 配置选项
      this.options = {
        enableIndexing: options.enableIndexing !== false,
        enableFullTextSearch: options.enableFullTextSearch !== false,
        maxSearchResults: options.maxSearchResults || 100,
        enableProjectCloning: options.enableProjectCloning !== false,
        enableVersionHistory: options.enableVersionHistory || false,
        ...options
      };

      // 事件总线
      this.eventBus = new EventTarget();

      // 搜索索引
      this.searchIndex = new Map();

      // 项目模板
      this.templates = new Map();

      // 项目分类统计
      this.categoryStats = new Map();

      // 初始化
      this.init();
    }

    /**
     * 初始化服务
     */
    async init() {
      try {
        console.log('ProjectDataService 初始化中...');

        // 加载项目模板
        await this.loadProjectTemplates();

        // 构建搜索索引
        if (this.options.enableIndexing) {
          await this.buildSearchIndex();
        }

        // 监听用户数据服务事件
        this.setupEventListeners();

        console.log('ProjectDataService 初始化完成');
      } catch (error) {
        console.error('ProjectDataService 初始化失败:', error);
      }
    }

    /**
     * 加载项目模板
     */
    async loadProjectTemplates() {
      try {
        const defaultTemplates = [
          {
            id: 'template_basic_math',
            name: '基础数学可视化',
            category: 'mathematics',
            description: '包含基础数学函数图表模板',
            thumbnail: '/assets/templates/basic-math.png',
            components: [
              {
                type: 'function-plot',
                config: {
                  function: 'x^2',
                  range: [-10, 10],
                  color: '#3498db'
                }
              }
            ],
            tags: ['数学', '函数', '基础'],
            difficulty: 'beginner',
            estimatedTime: 5
          },
          {
            id: 'template_astronomy_solar',
            name: '太阳系模拟',
            category: 'astronomy',
            description: '太阳系行星运动模拟模板',
            thumbnail: '/assets/templates/solar-system.png',
            components: [
              {
                type: 'orbital-system',
                config: {
                  sunSize: 1,
                  planets: [
                    { name: 'Mercury', distance: 0.4, period: 88 },
                    { name: 'Venus', distance: 0.7, period: 225 },
                    { name: 'Earth', distance: 1.0, period: 365 }
                  ]
                }
              }
            ],
            tags: ['天文', '太阳系', '行星'],
            difficulty: 'intermediate',
            estimatedTime: 15
          },
          {
            id: 'template_physics_pendulum',
            name: '单摆运动模拟',
            category: 'physics',
            description: '单摆运动物理模拟模板',
            thumbnail: '/assets/templates/pendulum.png',
            components: [
              {
                type: 'physics-simulation',
                config: {
                  type: 'pendulum',
                  gravity: 9.8,
                  length: 1.0,
                  initialAngle: 30
                }
              }
            ],
            tags: ['物理', '力学', '模拟'],
            difficulty: 'intermediate',
            estimatedTime: 10
          },
          {
            id: 'template_chemistry_molecule',
            name: '分子结构可视化',
            category: 'chemistry',
            description: '化学分子3D结构展示模板',
            thumbnail: '/assets/templates/molecule.png',
            components: [
              {
                type: 'molecular-viewer',
                config: {
                  molecule: 'H2O',
                  showBonds: true,
                  rotation: true
                }
              }
            ],
            tags: ['化学', '分子', '3D'],
            difficulty: 'advanced',
            estimatedTime: 20
          }
        ];

        defaultTemplates.forEach(template => {
          this.templates.set(template.id, template);
        });

        console.log(`已加载 ${this.templates.size} 个项目模板`);
      } catch (error) {
        console.error('加载项目模板失败:', error);
      }
    }

    /**
     * 构建搜索索引
     */
    async buildSearchIndex() {
      try {
        const projectsResult = await this.userDataService.getUserProjects({ limit: 1000 });
        const projects = projectsResult.projects || [];

        this.searchIndex.clear();

        projects.forEach(project => {
          this.indexProject(project);
        });

        console.log(`已为 ${projects.length} 个项目构建搜索索引`);
      } catch (error) {
        console.error('构建搜索索引失败:', error);
      }
    }

    /**
     * 索引项目
     */
    indexProject(project) {
      const searchText = [
        project.title,
        project.description,
        project.tags.join(' '),
        project.category,
        project.type
      ].join(' ').toLowerCase();

      const words = searchText.split(/\s+/).filter(word => word.length > 1);

      words.forEach(word => {
        if (!this.searchIndex.has(word)) {
          this.searchIndex.set(word, new Set());
        }
        this.searchIndex.get(word).add(project.id);
      });
    }

    /**
     * 设置事件监听器
     */
    setupEventListeners() {
      // 监听项目创建事件
      this.userDataService.addEventListener('project:created', (event) => {
        const project = event.detail;
        if (this.options.enableIndexing) {
          this.indexProject(project);
        }
        this.updateCategoryStats(project.category, 1);
        this.emitEvent('project:indexed', project);
      });

      // 监听项目更新事件
      this.userDataService.addEventListener('project:updated', (event) => {
        const project = event.detail;
        if (this.options.enableIndexing) {
          // 重建索引
          this.removeFromSearchIndex(project.id);
          this.indexProject(project);
        }
        this.emitEvent('project:reindexed', project);
      });

      // 监听项目删除事件
      this.userDataService.addEventListener('project:deleted', (event) => {
        const projectId = event.detail;
        if (this.options.enableIndexing) {
          this.removeFromSearchIndex(projectId);
        }
        this.emitEvent('project:removed-from-index', projectId);
      });
    }

    /**
     * 从搜索索引中移除项目
     */
    removeFromSearchIndex(projectId) {
      for (const [word, projectIds] of this.searchIndex.entries()) {
        projectIds.delete(projectId);
        if (projectIds.size === 0) {
          this.searchIndex.delete(word);
        }
      }
    }

    /**
     * 更新分类统计
     */
    updateCategoryStats(category, delta) {
      const current = this.categoryStats.get(category) || 0;
      this.categoryStats.set(category, current + delta);
    }

    // ==================== 项目搜索功能 ====================

    /**
     * 搜索项目
     */
    async searchProjects(query, options = {}) {
      try {
        const {
          categories = [],
          tags = [],
          types = [],
          dateRange = null,
          sortBy = 'relevance',
          sortOrder = 'desc',
          limit = this.options.maxSearchResults
        } = options;

        // 获取所有项目
        const projectsResult = await this.userDataService.getUserProjects({ limit: 1000 });
        let projects = projectsResult.projects || [];

        // 文本搜索
        if (query && this.options.enableFullTextSearch) {
          projects = this.performTextSearch(projects, query);
        }

        // 分类过滤
        if (categories.length > 0) {
          projects = projects.filter(p => categories.includes(p.category));
        }

        // 标签过滤
        if (tags.length > 0) {
          projects = projects.filter(p =>
            tags.some(tag => p.tags.includes(tag))
          );
        }

        // 类型过滤
        if (types.length > 0) {
          projects = projects.filter(p => types.includes(p.type));
        }

        // 日期范围过滤
        if (dateRange) {
          const { start, end } = dateRange;
          projects = projects.filter(p => {
            const createdAt = p.metadata.createdAt;
            return createdAt >= start && createdAt <= end;
          });
        }

        // 排序
        projects = this.sortProjects(projects, sortBy, sortOrder, query);

        // 限制结果数量
        projects = projects.slice(0, limit);

        // 计算搜索统计
        const searchStats = {
          query: query,
          totalResults: projects.length,
          categories: this.getCategoryDistribution(projects),
          executionTime: Date.now()
        };

        this.emitEvent('search:completed', { projects, stats: searchStats });

        return {
          projects: projects,
          stats: searchStats,
          query: query,
          filters: options
        };

      } catch (error) {
        console.error('搜索项目失败:', error);
        this.emitEvent('search:error', error);
        return { projects: [], stats: null };
      }
    }

    /**
     * 执行文本搜索
     */
    performTextSearch(projects, query) {
      const queryLower = query.toLowerCase();
      const queryWords = queryLower.split(/\s+/).filter(word => word.length > 1);

      const scoredProjects = projects.map(project => {
        let score = 0;
        const text = [
          project.title,
          project.description,
          project.tags.join(' '),
          project.category,
          project.type
        ].join(' ').toLowerCase();

        // 计算匹配分数
        queryWords.forEach(word => {
          // 标题匹配权重最高
          if (project.title.toLowerCase().includes(word)) {
            score += 10;
          }

          // 标签匹配权重较高
          if (project.tags.some(tag => tag.toLowerCase().includes(word))) {
            score += 5;
          }

          // 描述匹配权重中等
          if (project.description.toLowerCase().includes(word)) {
            score += 3;
          }

          // 分类和类型匹配权重较低
          if (project.category.toLowerCase().includes(word) ||
              project.type.toLowerCase().includes(word)) {
            score += 1;
          }

          // 完全匹配额外加分
          if (text.includes(word)) {
            score += 2;
          }
        });

        return { project, score };
      });

      // 过滤掉没有匹配的项目并按分数排序
      return scoredProjects
        .filter(item => item.score > 0)
        .sort((a, b) => b.score - a.score)
        .map(item => item.project);
    }

    /**
     * 排序项目
     */
    sortProjects(projects, sortBy, sortOrder, query = null) {
      const sortedProjects = [...projects];

      switch (sortBy) {
        case 'relevance':
          if (query) {
            // 按相关性排序（已在搜索时计算）
            return sortedProjects;
          } else {
            // 无查询时按更新时间排序
            return sortedProjects.sort((a, b) =>
              b.metadata.updatedAt - a.metadata.updatedAt
            );
          }

        case 'createdAt':
          return sortedProjects.sort((a, b) => {
            const diff = a.metadata.createdAt - b.metadata.createdAt;
            return sortOrder === 'asc' ? diff : -diff;
          });

        case 'updatedAt':
          return sortedProjects.sort((a, b) => {
            const diff = a.metadata.updatedAt - b.metadata.updatedAt;
            return sortOrder === 'asc' ? diff : -diff;
          });

        case 'title':
          return sortedProjects.sort((a, b) => {
            const diff = a.title.localeCompare(b.title);
            return sortOrder === 'asc' ? diff : -diff;
          });

        case 'viewCount':
          return sortedProjects.sort((a, b) => {
            const diff = a.metadata.viewCount - b.metadata.viewCount;
            return sortOrder === 'asc' ? diff : -diff;
          });

        case 'likeCount':
          return sortedProjects.sort((a, b) => {
            const diff = a.metadata.likeCount - b.metadata.likeCount;
            return sortOrder === 'asc' ? diff : -diff;
          });

        default:
          return sortedProjects;
      }
    }

    /**
     * 获取分类分布
     */
    getCategoryDistribution(projects) {
      const distribution = {};

      projects.forEach(project => {
        distribution[project.category] = (distribution[project.category] || 0) + 1;
      });

      return distribution;
    }

    // ==================== 项目模板功能 ====================

    /**
     * 获取项目模板列表
     */
    getProjectTemplates(filters = {}) {
      const { category, difficulty, tags } = filters;
      let templates = Array.from(this.templates.values());

      // 分类过滤
      if (category) {
        templates = templates.filter(t => t.category === category);
      }

      // 难度过滤
      if (difficulty) {
        templates = templates.filter(t => t.difficulty === difficulty);
      }

      // 标签过滤
      if (tags && tags.length > 0) {
        templates = templates.filter(t =>
          tags.some(tag => t.tags.includes(tag))
        );
      }

      return templates;
    }

    /**
     * 根据模板创建项目
     */
    async createProjectFromTemplate(templateId, projectOptions = {}) {
      try {
        const template = this.templates.get(templateId);
        if (!template) {
          throw new Error('模板不存在');
        }

        const projectData = {
          title: projectOptions.title || template.name,
          description: projectOptions.description || template.description,
          category: template.category,
          type: 'visualization',
          tags: [...template.tags],
          content: {
            components: template.components.map(comp => ({ ...comp })),
            layout: {
              type: 'single-column',
              sections: []
            },
            data: {},
            settings: {}
          },
          thumbnail: template.thumbnail,
          metadata: {
            templateId: template.id,
            templateVersion: '1.0',
            ...projectOptions.metadata
          }
        };

        const project = await this.userDataService.createProject(projectData);

        this.emitEvent('project:created-from-template', { project, template });

        return project;

      } catch (error) {
        console.error('从模板创建项目失败:', error);
        throw error;
      }
    }

    // ==================== 项目克隆功能 ====================

    /**
     * 克隆项目
     */
    async cloneProject(projectId, cloneOptions = {}) {
      if (!this.options.enableProjectCloning) {
        throw new Error('项目克隆功能未启用');
      }

      try {
        const originalProject = await this.userDataService.getProject(projectId);
        if (!originalProject) {
          throw new Error('原项目不存在');
        }

        const clonedProject = originalProject.clone(cloneOptions.title);

        // 保存克隆的项目
        await this.userDataService.saveProject(clonedProject);

        this.emitEvent('project:cloned', {
          original: originalProject,
          cloned: clonedProject
        });

        return clonedProject;

      } catch (error) {
        console.error('克隆项目失败:', error);
        throw error;
      }
    }

    // ==================== 批量操作功能 ====================

    /**
     * 批量删除项目
     */
    async batchDeleteProjects(projectIds) {
      try {
        const results = {
          successful: [],
          failed: [],
          total: projectIds.length
        };

        for (const projectId of projectIds) {
          try {
            await this.userDataService.deleteProject(projectId);
            results.successful.push(projectId);
          } catch (error) {
            results.failed.push({ id: projectId, error: error.message });
          }
        }

        this.emitEvent('projects:batch-deleted', results);

        return results;

      } catch (error) {
        console.error('批量删除项目失败:', error);
        throw error;
      }
    }

    /**
     * 批量更新项目标签
     */
    async batchUpdateProjectTags(projectIds, tags, operation = 'add') {
      try {
        const results = {
          successful: [],
          failed: [],
          total: projectIds.length
        };

        for (const projectId of projectIds) {
          try {
            const project = await this.userDataService.getProject(projectId);
            if (!project) {
              throw new Error('项目不存在');
            }

            if (operation === 'add') {
              tags.forEach(tag => project.addTag(tag));
            } else if (operation === 'remove') {
              tags.forEach(tag => project.removeTag(tag));
            } else if (operation === 'replace') {
              project.tags = [...tags];
            }

            await this.userDataService.updateProject(projectId, project.toJSON());
            results.successful.push(projectId);

          } catch (error) {
            results.failed.push({ id: projectId, error: error.message });
          }
        }

        this.emitEvent('projects:batch-tags-updated', results);

        return results;

      } catch (error) {
        console.error('批量更新项目标签失败:', error);
        throw error;
      }
    }

    /**
     * 批量移动项目到分类
     */
    async batchMoveProjectsToCategory(projectIds, category) {
      try {
        const results = {
          successful: [],
          failed: [],
          total: projectIds.length
        };

        for (const projectId of projectIds) {
          try {
            await this.userDataService.updateProject(projectId, { category });
            results.successful.push(projectId);
          } catch (error) {
            results.failed.push({ id: projectId, error: error.message });
          }
        }

        this.emitEvent('projects:batch-moved', results);

        return results;

      } catch (error) {
        console.error('批量移动项目失败:', error);
        throw error;
      }
    }

    // ==================== 项目分析功能 ====================

    /**
     * 获取项目统计信息
     */
    async getProjectStatistics() {
      try {
        const projectsResult = await this.userDataService.getUserProjects({ limit: 1000 });
        const projects = projectsResult.projects || [];

        const stats = {
          totalProjects: projects.length,
          categoryDistribution: {},
          typeDistribution: {},
          statusDistribution: {},
          averageViews: 0,
          averageLikes: 0,
          totalViews: 0,
          totalLikes: 0,
          recentlyActive: 0,
          topProjects: []
        };

        let totalViews = 0;
        let totalLikes = 0;
        const oneWeekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);

        projects.forEach(project => {
          // 分类统计
          stats.categoryDistribution[project.category] =
            (stats.categoryDistribution[project.category] || 0) + 1;

          // 类型统计
          stats.typeDistribution[project.type] =
            (stats.typeDistribution[project.type] || 0) + 1;

          // 状态统计
          stats.statusDistribution[project.status] =
            (stats.statusDistribution[project.status] || 0) + 1;

          // 浏览和点赞统计
          totalViews += project.metadata.viewCount || 0;
          totalLikes += project.metadata.likeCount || 0;

          // 最近活跃统计
          if (project.metadata.updatedAt > oneWeekAgo) {
            stats.recentlyActive++;
          }
        });

        stats.totalViews = totalViews;
        stats.totalLikes = totalLikes;
        stats.averageViews = projects.length > 0 ? Math.round(totalViews / projects.length) : 0;
        stats.averageLikes = projects.length > 0 ? Math.round(totalLikes / projects.length) : 0;

        // 热门项目（按浏览量排序）
        stats.topProjects = projects
          .sort((a, b) => b.metadata.viewCount - a.metadata.viewCount)
          .slice(0, 5)
          .map(p => ({
            id: p.id,
            title: p.title,
            views: p.metadata.viewCount,
            likes: p.metadata.likeCount,
            category: p.category
          }));

        return stats;

      } catch (error) {
        console.error('获取项目统计失败:', error);
        return null;
      }
    }

    /**
     * 获取推荐项目
     */
    async getRecommendedProjects(limit = 10) {
      try {
        const projectsResult = await this.userDataService.getUserProjects({ limit: 100 });
        const projects = projectsResult.projects || [];

        // 基于浏览量和更新时间计算推荐分数
        const scoredProjects = projects.map(project => {
          let score = 0;

          // 浏览量权重
          score += (project.metadata.viewCount || 0) * 0.3;

          // 点赞量权重
          score += (project.metadata.likeCount || 0) * 0.5;

          // 最近更新权重
          const daysSinceUpdate = (Date.now() - project.metadata.updatedAt) / (24 * 60 * 60 * 1000);
          score += Math.max(0, 10 - daysSinceUpdate) * 0.2;

          return { project, score };
        });

        // 按分数排序并返回前N个
        return scoredProjects
          .sort((a, b) => b.score - a.score)
          .slice(0, limit)
          .map(item => item.project);

      } catch (error) {
        console.error('获取推荐项目失败:', error);
        return [];
      }
    }

    // ==================== 工具方法 ====================

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
     * 获取服务统计信息
     */
    getServiceStats() {
      return {
        searchIndexSize: this.searchIndex.size,
        templateCount: this.templates.size,
        categoryStats: Object.fromEntries(this.categoryStats),
        options: this.options
      };
    }

    /**
     * 清理资源
     */
    cleanup() {
      this.searchIndex.clear();
      this.templates.clear();
      this.categoryStats.clear();
    }
  }

  // 创建全局实例
  const projectDataService = new ProjectDataService();

  // 导出到全局
  global.ProjectDataService = ProjectDataService;
  global.projectDataService = projectDataService;

})(window);