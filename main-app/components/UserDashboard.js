/**
 * UserDashboard.js - 用户工作台组件
 * 提供用户个人工作台的主要界面，包括项目概览、快速操作、统计信息和推荐内容
 */
(function(global) {
  'use strict';

  /**
   * 用户工作台组件类
   */
  class UserDashboard {
    constructor(container, options = {}) {
      // 容器元素
      this.container = typeof container === 'string' ? document.querySelector(container) : container;
      if (!this.container) {
        throw new Error('无效的容器元素');
      }

      // 配置选项
      this.options = {
        enableAnimations: options.enableAnimations !== false,
        enableRealTimeUpdates: options.enableRealTimeUpdates || false,
        refreshInterval: options.refreshInterval || 30 * 1000, // 30秒
        maxRecentProjects: options.maxRecentProjects || 5,
        maxRecommendedItems: options.maxRecommendedItems || 8,
        enableNotifications: options.enableNotifications !== false,
        theme: options.theme || 'auto',
        layout: options.layout || 'default',
        ...options
      };

      // 状态管理
      this.state = {
        isLoading: false,
        currentUser: null,
        projects: [],
        favorites: [],
        analytics: null,
        recommendations: [],
        notifications: [],
        viewMode: 'grid', // grid, list
        sortBy: 'updatedAt',
        sortOrder: 'desc',
        filters: {
          category: 'all',
          status: 'all',
          tags: []
        }
      };

      // 子组件
      this.components = {
        header: null,
        sidebar: null,
        mainContent: null,
        projectGrid: null,
        statisticsPanel: null,
        quickActions: null,
        recommendationsPanel: null,
        notificationsPanel: null
      };

      // 事件监听器
      this.eventListeners = new Map();

      // 刷新定时器
      this.refreshTimer = null;

      // 初始化
      this.init();
    }

    /**
     * 初始化组件
     */
    async init() {
      try {
        console.log('UserDashboard 初始化中...');

        // 设置基础样式
        this.setupStyles();

        // 创建组件结构
        this.createLayout();

        // 初始化子组件
        await this.initializeComponents();

        // 加载初始数据
        await this.loadInitialData();

        // 设置事件监听
        this.setupEventListeners();

        // 启动实时更新
        if (this.options.enableRealTimeUpdates) {
          this.startRealTimeUpdates();
        }

        // 应用主题
        this.applyTheme();

        console.log('UserDashboard 初始化完成');
        this.emitEvent('dashboard:initialized');

      } catch (error) {
        console.error('UserDashboard 初始化失败:', error);
        this.showError('初始化失败', error.message);
      }
    }

    /**
     * 设置样式
     */
    setupStyles() {
      const styleId = 'user-dashboard-styles';
      if (!document.getElementById(styleId)) {
        const style = document.createElement('style');
        style.id = styleId;
        style.textContent = `
          .user-dashboard {
            display: flex;
            flex-direction: column;
            height: 100vh;
            background: var(--bg-primary, #f8f9fa);
            font-family: var(--font-family, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif);
          }

          .dashboard-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 1rem 2rem;
            background: var(--bg-secondary, #ffffff);
            border-bottom: 1px solid var(--border-color, #e0e0e0);
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            z-index: 100;
          }

          .dashboard-content {
            display: flex;
            flex: 1;
            overflow: hidden;
          }

          .dashboard-sidebar {
            width: 250px;
            background: var(--bg-secondary, #ffffff);
            border-right: 1px solid var(--border-color, #e0e0e0);
            overflow-y: auto;
            transition: transform 0.3s ease;
          }

          .dashboard-main {
            flex: 1;
            padding: 2rem;
            overflow-y: auto;
            background: var(--bg-primary, #f8f9fa);
          }

          .dashboard-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 1.5rem;
            margin-bottom: 2rem;
          }

          .dashboard-card {
            background: var(--bg-secondary, #ffffff);
            border-radius: 8px;
            padding: 1.5rem;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            transition: transform 0.2s ease, box-shadow 0.2s ease;
          }

          .dashboard-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 16px rgba(0,0,0,0.15);
          }

          .dashboard-card-title {
            font-size: 1.1rem;
            font-weight: 600;
            margin-bottom: 1rem;
            color: var(--text-primary, #333333);
          }

          .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            gap: 1rem;
            margin-bottom: 2rem;
          }

          .stat-item {
            text-align: center;
            padding: 1rem;
            background: linear-gradient(135deg, var(--primary-color, #007bff), var(--secondary-color, #0056b3));
            border-radius: 8px;
            color: white;
          }

          .stat-value {
            font-size: 2rem;
            font-weight: bold;
            margin-bottom: 0.5rem;
          }

          .stat-label {
            font-size: 0.9rem;
            opacity: 0.9;
          }

          .quick-actions {
            display: flex;
            gap: 1rem;
            flex-wrap: wrap;
            margin-bottom: 2rem;
          }

          .quick-action-btn {
            padding: 0.75rem 1.5rem;
            border: none;
            border-radius: 6px;
            background: var(--primary-color, #007bff);
            color: white;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.2s ease;
            display: flex;
            align-items: center;
            gap: 0.5rem;
          }

          .quick-action-btn:hover {
            background: var(--primary-hover, #0056b3);
            transform: translateY(-1px);
          }

          .project-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
            gap: 1.5rem;
            margin-bottom: 2rem;
          }

          .project-card {
            background: var(--bg-secondary, #ffffff);
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            transition: all 0.2s ease;
            cursor: pointer;
          }

          .project-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 16px rgba(0,0,0,0.15);
          }

          .project-thumbnail {
            width: 100%;
            height: 160px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 3rem;
          }

          .project-info {
            padding: 1rem;
          }

          .project-title {
            font-weight: 600;
            margin-bottom: 0.5rem;
            color: var(--text-primary, #333333);
          }

          .project-meta {
            font-size: 0.85rem;
            color: var(--text-secondary, #666666);
            margin-bottom: 0.5rem;
          }

          .project-tags {
            display: flex;
            gap: 0.5rem;
            flex-wrap: wrap;
          }

          .project-tag {
            padding: 0.25rem 0.5rem;
            background: var(--bg-tertiary, #f0f0f0);
            border-radius: 4px;
            font-size: 0.75rem;
            color: var(--text-secondary, #666666);
          }

          .loading-spinner {
            display: flex;
            justify-content: center;
            align-items: center;
            height: 200px;
          }

          .spinner {
            width: 40px;
            height: 40px;
            border: 4px solid var(--border-color, #e0e0e0);
            border-top: 4px solid var(--primary-color, #007bff);
            border-radius: 50%;
            animation: spin 1s linear infinite;
          }

          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }

          .empty-state {
            text-align: center;
            padding: 3rem;
            color: var(--text-secondary, #666666);
          }

          .empty-state-icon {
            font-size: 4rem;
            margin-bottom: 1rem;
            opacity: 0.5;
          }

          .notification-badge {
            position: absolute;
            top: -5px;
            right: -5px;
            background: var(--danger-color, #dc3545);
            color: white;
            border-radius: 50%;
            width: 20px;
            height: 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 0.75rem;
            font-weight: bold;
          }

          .fade-in {
            animation: fadeIn 0.3s ease-in;
          }

          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }

          @media (max-width: 768px) {
            .dashboard-content {
              flex-direction: column;
            }

            .dashboard-sidebar {
              width: 100%;
              order: 2;
            }

            .dashboard-main {
              order: 1;
              padding: 1rem;
            }

            .dashboard-grid {
              grid-template-columns: 1fr;
            }

            .stats-grid {
              grid-template-columns: repeat(2, 1fr);
            }
          }
        `;
        document.head.appendChild(style);
      }
    }

    /**
     * 创建布局结构
     */
    createLayout() {
      this.container.innerHTML = `
        <div class="user-dashboard" data-dashboard-id="${this.generateId()}">
          <header class="dashboard-header">
            <div class="header-left">
              <h1 class="dashboard-title">我的工作台</h1>
            </div>
            <div class="header-right">
              <button class="btn btn-primary" id="create-project-btn">
                <span class="icon">+</span> 创建项目
              </button>
              <div class="user-menu" id="user-menu">
                <div class="user-avatar" id="user-avatar">
                  <img src="/assets/default-avatar.png" alt="用户头像" />
                </div>
              </div>
            </div>
          </header>

          <div class="dashboard-content">
            <aside class="dashboard-sidebar" id="dashboard-sidebar">
              <nav class="sidebar-nav">
                <ul class="nav-list">
                  <li class="nav-item active" data-view="overview">
                    <a href="#" class="nav-link">
                      <span class="nav-icon">🏠</span>
                      <span class="nav-text">概览</span>
                    </a>
                  </li>
                  <li class="nav-item" data-view="projects">
                    <a href="#" class="nav-link">
                      <span class="nav-icon">📁</span>
                      <span class="nav-text">我的项目</span>
                    </a>
                  </li>
                  <li class="nav-item" data-view="favorites">
                    <a href="#" class="nav-link">
                      <span class="nav-icon">⭐</span>
                      <span class="nav-text">我的收藏</span>
                    </a>
                  </li>
                  <li class="nav-item" data-view="analytics">
                    <a href="#" class="nav-link">
                      <span class="nav-icon">📊</span>
                      <span class="nav-text">数据分析</span>
                    </a>
                  </li>
                  <li class="nav-item" data-view="templates">
                    <a href="#" class="nav-link">
                      <span class="nav-icon">📋</span>
                      <span class="nav-text">模板库</span>
                    </a>
                  </li>
                  <li class="nav-item" data-view="settings">
                    <a href="#" class="nav-link">
                      <span class="nav-icon">⚙️</span>
                      <span class="nav-text">设置</span>
                    </a>
                  </li>
                </ul>
              </nav>
            </aside>

            <main class="dashboard-main" id="dashboard-main">
              <div class="loading-spinner" id="loading-spinner">
                <div class="spinner"></div>
              </div>
              <div class="dashboard-content-area" id="dashboard-content" style="display: none;">
                <!-- 动态内容将在这里插入 -->
              </div>
            </main>
          </div>
        </div>
      `;
    }

    /**
     * 初始化子组件
     */
    async initializeComponents() {
      // 初始化组件引用
      this.components.header = this.container.querySelector('.dashboard-header');
      this.components.sidebar = this.container.querySelector('.dashboard-sidebar');
      this.components.mainContent = this.container.querySelector('#dashboard-content');

      // 初始化各个视图
      await this.initializeViews();
    }

    /**
     * 初始化视图
     */
    async initializeViews() {
      // 创建视图容器
      const viewsContainer = document.createElement('div');
      viewsContainer.className = 'views-container';

      // 概览视图
      viewsContainer.appendChild(this.createOverviewView());

      // 项目视图
      viewsContainer.appendChild(this.createProjectsView());

      // 收藏视图
      viewsContainer.appendChild(this.createFavoritesView());

      // 分析视图
      viewsContainer.appendChild(this.createAnalyticsView());

      // 模板视图
      viewsContainer.appendChild(this.createTemplatesView());

      // 设置视图
      viewsContainer.appendChild(this.createSettingsView());

      this.components.mainContent.appendChild(viewsContainer);

      // 默认显示概览视图
      this.showView('overview');
    }

    /**
     * 创建概览视图
     */
    createOverviewView() {
      const view = document.createElement('div');
      view.className = 'dashboard-view overview-view';
      view.id = 'view-overview';
      view.style.display = 'none';

      view.innerHTML = `
        <div class="dashboard-header-section">
          <h2>欢迎回来！</h2>
          <p class="dashboard-subtitle">这是您的个人可视化工作台</p>
        </div>

        <div class="stats-grid" id="stats-grid">
          <div class="stat-item">
            <div class="stat-value" id="stat-projects">0</div>
            <div class="stat-label">总项目数</div>
          </div>
          <div class="stat-item">
            <div class="stat-value" id="stat-views">0</div>
            <div class="stat-label">总浏览量</div>
          </div>
          <div class="stat-item">
            <div class="stat-value" id="stat-likes">0</div>
            <div class="stat-label">获赞数</div>
          </div>
          <div class="stat-item">
            <div class="stat-value" id="stat-active-days">0</div>
            <div class="stat-label">活跃天数</div>
          </div>
        </div>

        <div class="quick-actions" id="quick-actions">
          <button class="quick-action-btn" data-action="create-project">
            <span>➕</span> 创建项目
          </button>
          <button class="quick-action-btn" data-action="browse-templates">
            <span>📋</span> 浏览模板
          </button>
          <button class="quick-action-btn" data-action="import-project">
            <span>📥</span> 导入项目
          </button>
          <button class="quick-action-btn" data-action="view-analytics">
            <span>📊</span> 查看分析
          </button>
        </div>

        <div class="dashboard-grid">
          <div class="dashboard-card">
            <h3 class="dashboard-card-title">最近项目</h3>
            <div class="recent-projects" id="recent-projects">
              <div class="loading-spinner">
                <div class="spinner"></div>
              </div>
            </div>
          </div>

          <div class="dashboard-card">
            <h3 class="dashboard-card-title">推荐内容</h3>
            <div class="recommendations" id="recommendations">
              <div class="loading-spinner">
                <div class="spinner"></div>
              </div>
            </div>
          </div>
        </div>
      `;

      return view;
    }

    /**
     * 创建项目视图
     */
    createProjectsView() {
      const view = document.createElement('div');
      view.className = 'dashboard-view projects-view';
      view.id = 'view-projects';
      view.style.display = 'none';

      view.innerHTML = `
        <div class="view-header">
          <div class="view-header-left">
            <h2>我的项目</h2>
            <div class="view-filters">
              <select class="filter-select" id="category-filter">
                <option value="all">所有分类</option>
                <option value="mathematics">数学</option>
                <option value="astronomy">天文</option>
                <option value="physics">物理</option>
                <option value="chemistry">化学</option>
              </select>
              <select class="filter-select" id="status-filter">
                <option value="all">所有状态</option>
                <option value="draft">草稿</option>
                <option value="published">已发布</option>
                <option value="archived">已归档</option>
              </select>
              <select class="sort-select" id="sort-select">
                <option value="updatedAt">最近更新</option>
                <option value="createdAt">创建时间</option>
                <option value="title">标题</option>
                <option value="viewCount">浏览量</option>
              </select>
            </div>
          </div>
          <div class="view-header-right">
            <div class="view-toggle">
              <button class="toggle-btn active" data-view="grid">
                <span>⊞</span>
              </button>
              <button class="toggle-btn" data-view="list">
                <span>☰</span>
              </button>
            </div>
          </div>
        </div>

        <div class="projects-container" id="projects-container">
          <div class="loading-spinner">
            <div class="spinner"></div>
          </div>
        </div>
      `;

      return view;
    }

    /**
     * 创建收藏视图
     */
    createFavoritesView() {
      const view = document.createElement('div');
      view.className = 'dashboard-view favorites-view';
      view.id = 'view-favorites';
      view.style.display = 'none';

      view.innerHTML = `
        <div class="view-header">
          <h2>我的收藏</h2>
        </div>

        <div class="favorites-container" id="favorites-container">
          <div class="loading-spinner">
            <div class="spinner"></div>
          </div>
        </div>
      `;

      return view;
    }

    /**
     * 创建分析视图
     */
    createAnalyticsView() {
      const view = document.createElement('div');
      view.className = 'dashboard-view analytics-view';
      view.id = 'view-analytics';
      view.style.display = 'none';

      view.innerHTML = `
        <div class="view-header">
          <h2>数据分析</h2>
        </div>

        <div class="analytics-content" id="analytics-content">
          <div class="loading-spinner">
            <div class="spinner"></div>
          </div>
        </div>
      `;

      return view;
    }

    /**
     * 创建模板视图
     */
    createTemplatesView() {
      const view = document.createElement('div');
      view.className = 'dashboard-view templates-view';
      view.id = 'view-templates';
      view.style.display = 'none';

      view.innerHTML = `
        <div class="view-header">
          <h2>模板库</h2>
        </div>

        <div class="templates-container" id="templates-container">
          <div class="loading-spinner">
            <div class="spinner"></div>
          </div>
        </div>
      `;

      return view;
    }

    /**
     * 创建设置视图
     */
    createSettingsView() {
      const view = document.createElement('div');
      view.className = 'dashboard-view settings-view';
      view.id = 'view-settings';
      view.style.display = 'none';

      view.innerHTML = `
        <div class="view-header">
          <h2>设置</h2>
        </div>

        <div class="settings-content" id="settings-content">
          <div class="settings-section">
            <h3>个人资料</h3>
            <div class="settings-form">
              <div class="form-group">
                <label>用户名</label>
                <input type="text" id="username-input" />
              </div>
              <div class="form-group">
                <label>邮箱</label>
                <input type="email" id="email-input" />
              </div>
              <div class="form-group">
                <label>个人简介</label>
                <textarea id="bio-input" rows="4"></textarea>
              </div>
              <button class="btn btn-primary">保存设置</button>
            </div>
          </div>

          <div class="settings-section">
            <h3>偏好设置</h3>
            <div class="settings-form">
              <div class="form-group">
                <label>主题</label>
                <select id="theme-select">
                  <option value="auto">自动</option>
                  <option value="light">浅色</option>
                  <option value="dark">深色</option>
                </select>
              </div>
              <div class="form-group">
                <label>语言</label>
                <select id="language-select">
                  <option value="zh-CN">简体中文</option>
                  <option value="en-US">English</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      `;

      return view;
    }

    /**
     * 加载初始数据
     */
    async loadInitialData() {
      try {
        this.setLoading(true);

        // 获取当前用户信息
        await this.loadCurrentUser();

        // 并行加载数据
        const [projectsResult, favoritesResult, analytics] = await Promise.all([
          global.userDataService?.getUserProjects({ limit: this.options.maxRecentProjects }) || { projects: [] },
          global.userDataService?.getUserFavorites({ limit: 10 }) || { favorites: [] },
          global.userDataService?.getUserAnalytics() || null
        ]);

        this.state.projects = projectsResult.projects || [];
        this.state.favorites = favoritesResult.favorites || [];
        this.state.analytics = analytics;

        // 加载推荐内容
        await this.loadRecommendations();

        // 渲染界面
        this.renderOverviewView();

      } catch (error) {
        console.error('加载初始数据失败:', error);
        this.showError('加载数据失败', error.message);
      } finally {
        this.setLoading(false);
      }
    }

    /**
     * 加载当前用户信息
     */
    async loadCurrentUser() {
      try {
        // 从现有的用户管理系统获取用户信息
        if (global.userManagement?.currentUser) {
          this.state.currentUser = global.userManagement.currentUser;
          this.updateUserUI();
        } else {
          // 临时使用访客模式：创建默认访客用户对象
          // TODO: 等其他功能模块完善后，恢复正常的用户认证
          this.state.currentUser = {
            id: 'guest_user_demo',
            username: '访客用户',
            name: '访客演示用户',
            role: 'guest',
            avatar: null,
            createdAt: new Date().toISOString(),
            lastLogin: new Date().toISOString(),
            limits: {
              maxProjects: 10,
              maxFavorites: 50,
              maxStoragePerProject: 104857600, // 100MB
              maxApiCallsPerDay: 100
            },
            usage: {
              projectsCreated: 0,
              storageUsed: 0,
              apiCalls: 0
            }
          };
          console.log('使用访客模式，用户对象:', this.state.currentUser);
          this.updateUserUI();
        }
      } catch (error) {
        console.error('加载用户信息失败:', error);
        // 出错时也创建访客用户
        this.state.currentUser = {
          id: 'guest_user_demo',
          username: '访客用户',
          name: '访客演示用户',
          role: 'guest',
          avatar: null,
          createdAt: new Date().toISOString(),
          lastLogin: new Date().toISOString()
        };
        this.updateUserUI();
      }
    }

    /**
     * 加载推荐内容
     */
    async loadRecommendations() {
      try {
        if (global.projectDataService) {
          this.state.recommendations = await global.projectDataService.getRecommendedProjects(
            this.options.maxRecommendedItems
          );
        }
      } catch (error) {
        console.error('加载推荐内容失败:', error);
        this.state.recommendations = [];
      }
    }

    /**
     * 渲染概览视图
     */
    renderOverviewView() {
      // 更新统计数据
      this.updateStatistics();

      // 渲染最近项目
      this.renderRecentProjects();

      // 渲染推荐内容
      this.renderRecommendations();
    }

    /**
     * 更新统计数据
     */
    updateStatistics() {
      const stats = this.state.analytics?.statistics || {};

      this.updateElement('stat-projects', stats.totalProjects || this.state.projects.length);
      this.updateElement('stat-views', stats.totalViews || 0);
      this.updateElement('stat-likes', stats.totalLikes || 0);
      this.updateElement('stat-active-days', stats.activeDays || 0);
    }

    /**
     * 渲染最近项目
     */
    renderRecentProjects() {
      const container = this.getElement('recent-projects');
      if (!container) return;

      if (this.state.projects.length === 0) {
        container.innerHTML = `
          <div class="empty-state">
            <div class="empty-state-icon">📁</div>
            <p>还没有项目</p>
            <button class="btn btn-primary" onclick="window.location.hash='#/create-project'">
              创建第一个项目
            </button>
          </div>
        `;
        return;
      }

      const projectsHTML = this.state.projects.slice(0, 5).map(project => `
        <div class="recent-project-item" data-project-id="${project.id}">
          <div class="project-mini-thumbnail">
            ${project.category === 'mathematics' ? '📐' :
              project.category === 'astronomy' ? '🌌' :
              project.category === 'physics' ? '⚛️' : '🧪'}
          </div>
          <div class="project-mini-info">
            <div class="project-mini-title">${this.escapeHtml(project.title)}</div>
            <div class="project-mini-meta">
              ${this.formatDate(project.metadata.updatedAt)} · ${project.category}
            </div>
          </div>
        </div>
      `).join('');

      container.innerHTML = `<div class="recent-projects-list">${projectsHTML}</div>`;
    }

    /**
     * 渲染推荐内容
     */
    renderRecommendations() {
      const container = this.getElement('recommendations');
      if (!container) return;

      if (this.state.recommendations.length === 0) {
        container.innerHTML = `
          <div class="empty-state">
            <p>暂无推荐内容</p>
          </div>
        `;
        return;
      }

      const recommendationsHTML = this.state.recommendations.slice(0, 4).map(item => `
        <div class="recommendation-item" data-type="project" data-id="${item.id}">
          <div class="recommendation-icon">
            ${item.category === 'mathematics' ? '📐' :
              item.category === 'astronomy' ? '🌌' :
              item.category === 'physics' ? '⚛️' : '🧪'}
          </div>
          <div class="recommendation-info">
            <div class="recommendation-title">${this.escapeHtml(item.title)}</div>
            <div class="recommendation-meta">
              ${item.category} · ${item.metadata.viewCount || 0} 次浏览
            </div>
          </div>
        </div>
      `).join('');

      container.innerHTML = `<div class="recommendations-list">${recommendationsHTML}</div>`;
    }

    /**
     * 设置事件监听器
     */
    setupEventListeners() {
      // 导航事件
      this.container.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', (e) => {
          e.preventDefault();
          const view = item.dataset.view;
          this.showView(view);
          this.updateActiveNavigation(item);
        });
      });

      // 快速操作按钮
      this.container.querySelectorAll('.quick-action-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const action = btn.dataset.action;
          this.handleQuickAction(action);
        });
      });

      // 创建项目按钮
      const createBtn = this.getElement('create-project-btn');
      if (createBtn) {
        createBtn.addEventListener('click', () => {
          this.handleQuickAction('create-project');
        });
      }

      // 视图切换按钮
      this.container.querySelectorAll('.toggle-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const viewMode = btn.dataset.view;
          this.setViewMode(viewMode);
          this.updateViewToggle(btn);
        });
      });

      // 过滤器和排序
      const filters = ['category-filter', 'status-filter', 'sort-select'];
      filters.forEach(id => {
        const element = this.getElement(id);
        if (element) {
          element.addEventListener('change', () => {
            this.applyFilters();
          });
        }
      });

      // 项目点击事件
      this.container.addEventListener('click', (e) => {
        const projectItem = e.target.closest('[data-project-id]');
        if (projectItem) {
          const projectId = projectItem.dataset.projectId;
          this.openProject(projectId);
        }

        const recommendationItem = e.target.closest('[data-type="project"]');
        if (recommendationItem) {
          const projectId = recommendationItem.dataset.id;
          this.openProject(projectId);
        }
      });

      // 监听外部事件
      if (global.userDataService) {
        global.userDataService.addEventListener('project:created', () => {
          this.refreshData();
        });

        global.userDataService.addEventListener('project:updated', () => {
          this.refreshData();
        });

        global.userDataService.addEventListener('project:deleted', () => {
          this.refreshData();
        });
      }
    }

    /**
     * 显示指定视图
     */
    showView(viewName) {
      // 隐藏所有视图
      this.container.querySelectorAll('.dashboard-view').forEach(view => {
        view.style.display = 'none';
      });

      // 显示指定视图
      const targetView = this.getElement(`view-${viewName}`);
      if (targetView) {
        targetView.style.display = 'block';

        // 添加动画效果
        if (this.options.enableAnimations) {
          targetView.classList.add('fade-in');
          setTimeout(() => {
            targetView.classList.remove('fade-in');
          }, 300);
        }
      }

      // 加载视图特定数据
      this.loadViewData(viewName);

      this.emitEvent('view:changed', { view: viewName });
    }

    /**
     * 加载视图数据
     */
    async loadViewData(viewName) {
      try {
        switch (viewName) {
          case 'projects':
            await this.loadProjectsView();
            break;
          case 'favorites':
            await this.loadFavoritesView();
            break;
          case 'analytics':
            await this.loadAnalyticsView();
            break;
          case 'templates':
            await this.loadTemplatesView();
            break;
        }
      } catch (error) {
        console.error(`加载视图数据失败 [${viewName}]:`, error);
      }
    }

    /**
     * 加载项目视图数据
     */
    async loadProjectsView() {
      const container = this.getElement('projects-container');
      if (!container) return;

      try {
        const result = await global.userDataService?.getUserProjects({
          category: this.state.filters.category === 'all' ? undefined : this.state.filters.category,
          status: this.state.filters.status === 'all' ? undefined : this.state.filters.status,
          sortBy: this.state.sortBy,
          sortOrder: this.state.sortOrder,
          limit: 50
        }) || { projects: [] };

        this.renderProjectsGrid(result.projects);

      } catch (error) {
        console.error('加载项目数据失败:', error);
        container.innerHTML = `
          <div class="error-state">
            <p>加载项目失败</p>
            <button class="btn btn-secondary" onclick="this.loadProjectsView()">重试</button>
          </div>
        `;
      }
    }

    /**
     * 渲染项目网格
     */
    renderProjectsGrid(projects) {
      const container = this.getElement('projects-container');
      if (!container) return;

      if (projects.length === 0) {
        container.innerHTML = `
          <div class="empty-state">
            <div class="empty-state-icon">📁</div>
            <p>没有找到项目</p>
            <button class="btn btn-primary" onclick="window.location.hash='#/create-project'">
              创建新项目
            </button>
          </div>
        `;
        return;
      }

      const projectsHTML = projects.map(project => `
        <div class="project-card" data-project-id="${project.id}">
          <div class="project-thumbnail">
            ${project.category === 'mathematics' ? '📐' :
              project.category === 'astronomy' ? '🌌' :
              project.category === 'physics' ? '⚛️' : '🧪'}
          </div>
          <div class="project-info">
            <h3 class="project-title">${this.escapeHtml(project.title)}</h3>
            <p class="project-meta">
              ${this.formatDate(project.metadata.updatedAt)} · ${project.metadata.viewCount || 0} 次浏览
            </p>
            <div class="project-tags">
              ${project.tags.map(tag => `<span class="project-tag">${this.escapeHtml(tag)}</span>`).join('')}
            </div>
          </div>
        </div>
      `).join('');

      container.innerHTML = `<div class="project-grid">${projectsHTML}</div>`;
    }

    /**
     * 处理快速操作
     */
    handleQuickAction(action) {
      switch (action) {
        case 'create-project':
          this.emitEvent('action:create-project');
          break;
        case 'browse-templates':
          this.showView('templates');
          break;
        case 'import-project':
          this.emitEvent('action:import-project');
          break;
        case 'view-analytics':
          this.showView('analytics');
          break;
      }
    }

    /**
     * 打开项目
     */
    openProject(projectId) {
      this.emitEvent('project:open', { projectId });
    }

    /**
     * 应用过滤器
     */
    applyFilters() {
      const categoryFilter = this.getElement('category-filter')?.value;
      const statusFilter = this.getElement('status-filter')?.value;
      const sortSelect = this.getElement('sort-select')?.value;

      this.state.filters = {
        category: categoryFilter || 'all',
        status: statusFilter || 'all'
      };

      this.state.sortBy = sortSelect || 'updatedAt';

      // 重新加载项目数据
      this.loadProjectsView();
    }

    /**
     * 设置视图模式
     */
    setViewMode(mode) {
      this.state.viewMode = mode;
      const container = this.getElement('projects-container');
      if (container) {
        container.className = `projects-container view-${mode}`;
      }
    }

    /**
     * 启动实时更新
     */
    startRealTimeUpdates() {
      if (this.refreshTimer) {
        clearInterval(this.refreshTimer);
      }

      this.refreshTimer = setInterval(() => {
        this.refreshData();
      }, this.options.refreshInterval);
    }

    /**
     * 刷新数据
     */
    async refreshData() {
      try {
        await this.loadInitialData();
        this.emitEvent('data:refreshed');
      } catch (error) {
        console.error('刷新数据失败:', error);
      }
    }

    /**
     * 更新用户界面
     */
    updateUserUI() {
      if (!this.state.currentUser) return;

      const avatar = this.getElement('user-avatar');
      if (avatar) {
        const img = avatar.querySelector('img');
        if (img && this.state.currentUser.avatar) {
          img.src = this.state.currentUser.avatar;
        }
      }

      const title = this.getElement('dashboard-title');
      if (title) {
        title.textContent = `欢迎，${this.state.currentUser.name || this.state.currentUser.username}！`;
      }
    }

    /**
     * 更新活动导航
     */
    updateActiveNavigation(activeItem) {
      this.container.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
      });
      activeItem.classList.add('active');
    }

    /**
     * 更新视图切换按钮
     */
    updateViewToggle(activeBtn) {
      this.container.querySelectorAll('.toggle-btn').forEach(btn => {
        btn.classList.remove('active');
      });
      activeBtn.classList.add('active');
    }

    /**
     * 设置加载状态
     */
    setLoading(isLoading) {
      this.state.isLoading = isLoading;
      const spinner = this.getElement('loading-spinner');
      const content = this.getElement('dashboard-content');

      if (isLoading) {
        if (spinner) spinner.style.display = 'flex';
        if (content) content.style.display = 'none';
      } else {
        if (spinner) spinner.style.display = 'none';
        if (content) content.style.display = 'block';
      }
    }

    /**
     * 应用主题
     */
    applyTheme() {
      const theme = this.options.theme;
      if (theme === 'auto') {
        // 检测系统主题
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        this.container.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
      } else {
        this.container.setAttribute('data-theme', theme);
      }
    }

    /**
     * 显示错误
     */
    showError(title, message) {
      console.error(`${title}: ${message}`);

      // 创建错误提示
      const errorToast = document.createElement('div');
      errorToast.className = 'error-toast';
      errorToast.innerHTML = `
        <div class="error-toast-header">
          <strong>${this.escapeHtml(title)}</strong>
          <button class="error-toast-close">&times;</button>
        </div>
        <div class="error-toast-body">
          ${this.escapeHtml(message)}
        </div>
      `;

      // 添加到页面
      document.body.appendChild(errorToast);

      // 自动移除
      setTimeout(() => {
        if (errorToast.parentNode) {
          errorToast.parentNode.removeChild(errorToast);
        }
      }, 5000);

      // 点击关闭
      const closeBtn = errorToast.querySelector('.error-toast-close');
      if (closeBtn) {
        closeBtn.addEventListener('click', () => {
          if (errorToast.parentNode) {
            errorToast.parentNode.removeChild(errorToast);
          }
        });
      }
    }

    /**
     * 工具方法：获取元素
     */
    getElement(id) {
      return this.container.querySelector(`#${id}`);
    }

    /**
     * 工具方法：更新元素内容
     */
    updateElement(id, content) {
      const element = this.getElement(id);
      if (element) {
        element.textContent = content;
      }
    }

    /**
     * 工具方法：生成ID
     */
    generateId() {
      return 'dashboard_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    /**
     * 工具方法：HTML转义
     */
    escapeHtml(text) {
      const div = document.createElement('div');
      div.textContent = text;
      return div.innerHTML;
    }

    /**
     * 工具方法：格式化日期
     */
    formatDate(timestamp) {
      const date = new Date(timestamp);
      const now = new Date();
      const diffMs = now - date;
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      if (diffDays === 0) {
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        if (diffHours === 0) {
          const diffMinutes = Math.floor(diffMs / (1000 * 60));
          return diffMinutes === 0 ? '刚刚' : `${diffMinutes}分钟前`;
        }
        return `${diffHours}小时前`;
      } else if (diffDays === 1) {
        return '昨天';
      } else if (diffDays < 7) {
        return `${diffDays}天前`;
      } else {
        return date.toLocaleDateString('zh-CN');
      }
    }

    /**
     * 发送事件
     */
    emitEvent(eventName, data = {}) {
      const event = new CustomEvent(`dashboard:${eventName}`, { detail: data });
      this.container.dispatchEvent(event);
    }

    /**
     * 监听事件
     */
    on(eventName, callback) {
      this.container.addEventListener(`dashboard:${eventName}`, callback);
      return this;
    }

    /**
     * 移除事件监听
     */
    off(eventName, callback) {
      this.container.removeEventListener(`dashboard:${eventName}`, callback);
      return this;
    }

    /**
     * 销毁组件
     */
    destroy() {
      // 清理定时器
      if (this.refreshTimer) {
        clearInterval(this.refreshTimer);
      }

      // 清理事件监听器
      this.eventListeners.forEach((listener, element) => {
        element.removeEventListener(listener.type, listener.callback);
      });
      this.eventListeners.clear();

      // 清理内容
      this.container.innerHTML = '';

      console.log('UserDashboard 已销毁');
    }
  }

  // 导出到全局
  global.UserDashboard = UserDashboard;

})(window);