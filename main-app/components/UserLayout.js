/**
 * UserLayout.js - 用户布局组件
 * 提供统一的用户模块布局框架，包括侧边栏、头部导航、内容区域等
 */
(function(global) {
  'use strict';

  /**
   * 用户布局组件类
   */
  class UserLayout {
    constructor(container, options = {}) {
      // 容器元素
      this.container = typeof container === 'string' ? document.querySelector(container) : container;
      if (!this.container) {
        throw new Error('无效的容器元素');
      }

      // 配置选项
      this.options = {
        theme: options.theme || 'default',
        layout: options.layout || 'sidebar', // sidebar, topbar, compact
        sidebarCollapsed: options.sidebarCollapsed || false,
        sidebarWidth: options.sidebarWidth || 260,
        enableResponsive: options.enableResponsive !== false,
        enableAnimations: options.enableAnimations !== false,
        enableNotifications: options.enableNotifications !== false,
        enableUserMenu: options.enableUserMenu !== false,
        enableBreadcrumb: options.enableBreadcrumb !== false,
        enableFooter: options.enableFooter || false,
        ...options
      };

      // 状态管理
      this.state = {
        sidebarOpen: !this.options.sidebarCollapsed,
        mobileMenuOpen: false,
        currentTheme: this.options.theme,
        notifications: [],
        userMenuOpen: false,
        screenSize: this.getScreenSize(),
        scrollY: 0,
        lastScrollY: 0
      };

      // 布局元素
      this.elements = {
        header: null,
        sidebar: null,
        content: null,
        footer: null,
        overlay: null,
        breadcrumb: null
      };

      // 导航菜单配置
      this.menuConfig = this.getDefaultMenuConfig();

      // 事件监听器
      this.eventListeners = new Map();

      // 响应式断点
      this.breakpoints = {
        mobile: 768,
        tablet: 1024,
        desktop: 1200
      };

      // 初始化
      this.init();
    }

    /**
     * 初始化组件
     */
    init() {
      try {
        console.log('UserLayout 初始化中...');

        // 设置样式
        this.setupStyles();

        // 创建布局结构
        this.createLayout();

        // 初始化子组件
        this.initializeSubComponents();

        // 设置事件监听
        this.setupEventListeners();

        // 应用初始状态
        this.applyInitialState();

        // 设置响应式监听
        if (this.options.enableResponsive) {
          this.setupResponsive();
        }

        console.log('UserLayout 初始化完成');
        this.emitEvent('layout:initialized');

      } catch (error) {
        console.error('UserLayout 初始化失败:', error);
        this.showError('初始化失败', error.message);
      }
    }

    /**
     * 设置样式
     */
    setupStyles() {
      const styleId = 'user-layout-styles';
      if (!document.getElementById(styleId)) {
        const style = document.createElement('style');
        style.id = styleId;
        style.textContent = `
          .user-layout {
            display: flex;
            flex-direction: column;
            min-height: 100vh;
            background: var(--bg-primary, #f8f9fa);
            font-family: var(--font-family, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif);
          }

          /* 布局头部 */
          .layout-header {
            position: sticky;
            top: 0;
            z-index: 1000;
            background: var(--bg-secondary, #ffffff);
            border-bottom: 1px solid var(--border-color, #e0e0e0);
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            transition: all 0.3s ease;
          }

          .layout-header.scrolled {
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          }

          .header-content {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 0 1.5rem;
            height: 64px;
          }

          .header-left {
            display: flex;
            align-items: center;
            gap: 1rem;
          }

          .header-right {
            display: flex;
            align-items: center;
            gap: 1rem;
          }

          .menu-toggle {
            display: none;
            background: none;
            border: none;
            font-size: 1.5rem;
            cursor: pointer;
            padding: 0.5rem;
            border-radius: 6px;
            transition: background-color 0.2s ease;
          }

          .menu-toggle:hover {
            background: var(--hover-bg, #f5f5f5);
          }

          .logo {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            font-size: 1.25rem;
            font-weight: 600;
            color: var(--text-primary, #333333);
            text-decoration: none;
          }

          .logo-icon {
            width: 32px;
            height: 32px;
            background: linear-gradient(135deg, var(--primary-color, #007bff), var(--secondary-color, #0056b3));
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 1.2rem;
          }

          .breadcrumb-container {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            font-size: 0.9rem;
            color: var(--text-secondary, #666666);
          }

          .breadcrumb-separator {
            color: var(--text-muted, #6c757d);
          }

          .breadcrumb-item {
            color: var(--text-secondary, #666666);
            text-decoration: none;
            transition: color 0.2s ease;
          }

          .breadcrumb-item:hover {
            color: var(--primary-color, #007bff);
          }

          .breadcrumb-item.active {
            color: var(--text-primary, #333333);
            font-weight: 500;
          }

          /* 搜索栏 */
          .search-bar {
            position: relative;
            width: 300px;
          }

          .search-input {
            width: 100%;
            padding: 0.5rem 2.5rem 0.5rem 1rem;
            border: 1px solid var(--border-color, #e0e0e0);
            border-radius: 20px;
            font-size: 0.9rem;
            background: var(--bg-tertiary, #f5f5f5);
            transition: all 0.2s ease;
          }

          .search-input:focus {
            outline: none;
            border-color: var(--primary-color, #007bff);
            background: var(--bg-secondary, #ffffff);
            box-shadow: 0 0 0 3px rgba(0,123,255,0.1);
          }

          .search-icon {
            position: absolute;
            right: 0.75rem;
            top: 50%;
            transform: translateY(-50%);
            color: var(--text-muted, #6c757d);
            pointer-events: none;
          }

          /* 用户菜单 */
          .user-menu {
            position: relative;
          }

          .user-avatar {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            background: linear-gradient(135deg, var(--primary-color, #007bff), var(--secondary-color, #0056b3));
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: 600;
            cursor: pointer;
            transition: transform 0.2s ease;
            overflow: hidden;
          }

          .user-avatar:hover {
            transform: scale(1.05);
          }

          .user-avatar img {
            width: 100%;
            height: 100%;
            object-fit: cover;
          }

          .user-dropdown {
            position: absolute;
            top: 100%;
            right: 0;
            margin-top: 0.5rem;
            background: var(--bg-secondary, #ffffff);
            border: 1px solid var(--border-color, #e0e0e0);
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            min-width: 200px;
            opacity: 0;
            visibility: hidden;
            transform: translateY(-10px);
            transition: all 0.2s ease;
            z-index: 1001;
          }

          .user-dropdown.active {
            opacity: 1;
            visibility: visible;
            transform: translateY(0);
          }

          .dropdown-item {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            padding: 0.75rem 1rem;
            color: var(--text-primary, #333333);
            text-decoration: none;
            transition: background-color 0.2s ease;
          }

          .dropdown-item:hover {
            background: var(--hover-bg, #f5f5f5);
          }

          .dropdown-divider {
            height: 1px;
            background: var(--border-color, #e0e0e0);
            margin: 0.5rem 0;
          }

          /* 通知系统 */
          .notifications {
            position: relative;
          }

          .notification-btn {
            position: relative;
            background: none;
            border: none;
            font-size: 1.25rem;
            cursor: pointer;
            padding: 0.5rem;
            border-radius: 6px;
            transition: background-color 0.2s ease;
          }

          .notification-btn:hover {
            background: var(--hover-bg, #f5f5f5);
          }

          .notification-badge {
            position: absolute;
            top: 0.25rem;
            right: 0.25rem;
            background: var(--danger-color, #dc3545);
            color: white;
            border-radius: 50%;
            width: 18px;
            height: 18px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 0.7rem;
            font-weight: bold;
          }

          .notification-panel {
            position: absolute;
            top: 100%;
            right: 0;
            margin-top: 0.5rem;
            background: var(--bg-secondary, #ffffff);
            border: 1px solid var(--border-color, #e0e0e0);
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            width: 320px;
            max-height: 400px;
            opacity: 0;
            visibility: hidden;
            transform: translateY(-10px);
            transition: all 0.2s ease;
            z-index: 1001;
            overflow: hidden;
          }

          .notification-panel.active {
            opacity: 1;
            visibility: visible;
            transform: translateY(0);
          }

          .notification-header {
            padding: 1rem;
            border-bottom: 1px solid var(--border-color, #e0e0e0);
            display: flex;
            justify-content: space-between;
            align-items: center;
          }

          .notification-list {
            max-height: 300px;
            overflow-y: auto;
          }

          .notification-item {
            padding: 1rem;
            border-bottom: 1px solid var(--border-color, #e0e0e0);
            transition: background-color 0.2s ease;
          }

          .notification-item:hover {
            background: var(--hover-bg, #f5f5f5);
          }

          .notification-item.unread {
            background: rgba(0,123,255,0.05);
            border-left: 3px solid var(--primary-color, #007bff);
          }

          .notification-title {
            font-weight: 500;
            margin-bottom: 0.25rem;
            color: var(--text-primary, #333333);
          }

          .notification-content {
            font-size: 0.85rem;
            color: var(--text-secondary, #666666);
            margin-bottom: 0.25rem;
          }

          .notification-time {
            font-size: 0.75rem;
            color: var(--text-muted, #6c757d);
          }

          /* 布局主体 */
          .layout-body {
            display: flex;
            flex: 1;
            overflow: hidden;
          }

          /* 侧边栏 */
          .layout-sidebar {
            width: ${this.options.sidebarWidth}px;
            background: var(--bg-secondary, #ffffff);
            border-right: 1px solid var(--border-color, #e0e0e0);
            overflow-y: auto;
            transition: transform 0.3s ease, width 0.3s ease;
            position: relative;
            z-index: 100;
          }

          .layout-sidebar.collapsed {
            width: 80px;
          }

          .sidebar-content {
            padding: 1rem 0;
          }

          .sidebar-section {
            margin-bottom: 2rem;
          }

          .sidebar-title {
            padding: 0.5rem 1.5rem;
            font-size: 0.75rem;
            font-weight: 600;
            text-transform: uppercase;
            color: var(--text-muted, #6c757d);
            letter-spacing: 0.5px;
          }

          .sidebar-nav {
            list-style: none;
            margin: 0;
            padding: 0;
          }

          .nav-item {
            margin-bottom: 0.25rem;
          }

          .nav-link {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            padding: 0.75rem 1.5rem;
            color: var(--text-secondary, #666666);
            text-decoration: none;
            transition: all 0.2s ease;
            position: relative;
          }

          .nav-link:hover {
            background: var(--hover-bg, #f5f5f5);
            color: var(--text-primary, #333333);
          }

          .nav-link.active {
            background: rgba(0,123,255,0.1);
            color: var(--primary-color, #007bff);
          }

          .nav-link.active::before {
            content: '';
            position: absolute;
            left: 0;
            top: 0;
            bottom: 0;
            width: 3px;
            background: var(--primary-color, #007bff);
          }

          .nav-icon {
            width: 20px;
            text-align: center;
            font-size: 1.1rem;
          }

          .nav-text {
            flex: 1;
          }

          .nav-badge {
            background: var(--danger-color, #dc3545);
            color: white;
            border-radius: 10px;
            padding: 0.125rem 0.5rem;
            font-size: 0.7rem;
            font-weight: 600;
          }

          .layout-sidebar.collapsed .nav-text,
          .layout-sidebar.collapsed .nav-badge,
          .layout-sidebar.collapsed .sidebar-title {
            display: none;
          }

          .layout-sidebar.collapsed .nav-link {
            justify-content: center;
            padding: 0.75rem;
          }

          /* 内容区域 */
          .layout-content {
            flex: 1;
            overflow-y: auto;
            background: var(--bg-primary, #f8f9fa);
            transition: margin-left 0.3s ease;
          }

          .layout-content.expanded {
            margin-left: -${this.options.sidebarWidth - 80}px;
          }

          .content-wrapper {
            padding: 2rem;
            min-height: 100%;
          }

          /* 底部 */
          .layout-footer {
            background: var(--bg-secondary, #ffffff);
            border-top: 1px solid var(--border-color, #e0e0e0);
            padding: 1rem 2rem;
            text-align: center;
            color: var(--text-muted, #6c757d);
            font-size: 0.85rem;
          }

          /* 移动端遮罩 */
          .layout-overlay {
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0,0,0,0.5);
            z-index: 99;
            opacity: 0;
            transition: opacity 0.3s ease;
          }

          .layout-overlay.active {
            display: block;
            opacity: 1;
          }

          /* 响应式设计 */
          @media (max-width: ${this.breakpoints.mobile}px) {
            .layout-body {
              flex-direction: column;
            }

            .layout-sidebar {
              position: fixed;
              top: 0;
              left: 0;
              bottom: 0;
              transform: translateX(-100%);
              z-index: 1000;
              width: 280px;
            }

            .layout-sidebar.mobile-open {
              transform: translateX(0);
            }

            .layout-content {
              margin-left: 0;
            }

            .layout-content.expanded {
              margin-left: 0;
            }

            .menu-toggle {
              display: block;
            }

            .search-bar {
              display: none;
            }

            .breadcrumb-container {
              display: none;
            }

            .content-wrapper {
              padding: 1rem;
            }
          }

          @media (max-width: ${this.breakpoints.tablet}px) {
            .search-bar {
              width: 200px;
            }

            .header-left,
            .header-right {
              gap: 0.5rem;
            }
          }

          /* 主题变量 */
          :root {
            --primary-color: #007bff;
            --secondary-color: #0056b3;
            --success-color: #28a745;
            --danger-color: #dc3545;
            --warning-color: #ffc107;
            --info-color: #17a2b8;

            --bg-primary: #f8f9fa;
            --bg-secondary: #ffffff;
            --bg-tertiary: #f5f5f5;
            --hover-bg: #f0f0f0;

            --text-primary: #333333;
            --text-secondary: #666666;
            --text-muted: #6c757d;

            --border-color: #e0e0e0;
            --shadow: 0 2px 4px rgba(0,0,0,0.1);
          }

          /* 深色主题 */
          [data-theme="dark"] {
            --primary-color: #4dabf7;
            --secondary-color: #339af0;

            --bg-primary: #1a1a1a;
            --bg-secondary: #2d2d2d;
            --bg-tertiary: #404040;
            --hover-bg: #495057;

            --text-primary: #ffffff;
            --text-secondary: #adb5bd;
            --text-muted: #6c757d;

            --border-color: #495057;
            --shadow: 0 2px 4px rgba(0,0,0,0.3);
          }

          /* 动画效果 */
          .fade-enter {
            opacity: 0;
          }

          .fade-enter-active {
            transition: opacity 0.3s ease;
          }

          .fade-enter-to {
            opacity: 1;
          }

          .slide-enter {
            transform: translateX(-100%);
          }

          .slide-enter-active {
            transition: transform 0.3s ease;
          }

          .slide-enter-to {
            transform: translateX(0);
          }

          /* 滚动条样式 */
          ::-webkit-scrollbar {
            width: 8px;
            height: 8px;
          }

          ::-webkit-scrollbar-track {
            background: var(--bg-tertiary, #f5f5f5);
          }

          ::-webkit-scrollbar-thumb {
            background: var(--border-color, #e0e0e0);
            border-radius: 4px;
          }

          ::-webkit-scrollbar-thumb:hover {
            background: var(--text-muted, #6c757d);
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
        <div class="user-layout" data-layout-id="${this.generateId()}">
          <!-- 头部导航 -->
          <header class="layout-header" id="layout-header">
            <div class="header-content">
              <div class="header-left">
                <button class="menu-toggle" id="menu-toggle">
                  ☰
                </button>

                <a href="/" class="logo">
                  <div class="logo-icon">📊</div>
                  <span class="logo-text">万物可视化</span>
                </a>

                <div class="breadcrumb-container" id="breadcrumb-container">
                  <!-- 面包屑导航将在这里插入 -->
                </div>
              </div>

              <div class="header-right">
                <div class="search-bar">
                  <input type="text" class="search-input" placeholder="搜索..." />
                  <span class="search-icon">🔍</span>
                </div>

                ${this.options.enableNotifications ? `
                  <div class="notifications">
                    <button class="notification-btn" id="notification-btn">
                      🔔
                      <span class="notification-badge" id="notification-count">0</span>
                    </button>

                    <div class="notification-panel" id="notification-panel">
                      <div class="notification-header">
                        <strong>通知</strong>
                        <button class="btn btn-link" id="clear-notifications">清空</button>
                      </div>
                      <div class="notification-list" id="notification-list">
                        <!-- 通知列表将在这里插入 -->
                      </div>
                    </div>
                  </div>
                ` : ''}

                ${this.options.enableUserMenu ? `
                  <div class="user-menu">
                    <div class="user-avatar" id="user-avatar">
                      <img src="/assets/default-avatar.png" alt="用户头像" />
                    </div>

                    <div class="user-dropdown" id="user-dropdown">
                      <a href="/user/profile" class="dropdown-item">
                        <span>👤</span> 个人资料
                      </a>
                      <a href="/user/settings" class="dropdown-item">
                        <span>⚙️</span> 设置
                      </a>
                      <div class="dropdown-divider"></div>
                      <a href="#" class="dropdown-item" id="logout-btn">
                        <span>🚪</span> 退出登录
                      </a>
                    </div>
                  </div>
                ` : ''}
              </div>
            </div>
          </header>

          <!-- 主体内容 -->
          <div class="layout-body">
            <!-- 侧边栏 -->
            <aside class="layout-sidebar ${this.state.sidebarOpen ? '' : 'collapsed'}" id="layout-sidebar">
              <div class="sidebar-content" id="sidebar-content">
                <!-- 导航菜单将在这里插入 -->
              </div>
            </aside>

            <!-- 内容区域 -->
            <main class="layout-content ${!this.state.sidebarOpen ? 'expanded' : ''}" id="layout-content">
              <div class="content-wrapper" id="content-wrapper">
                <!-- 页面内容将在这里插入 -->
              </div>
            </main>
          </div>

          ${this.options.enableFooter ? `
            <footer class="layout-footer">
              <p>&copy; 2024 万物可视化平台. All rights reserved.</p>
            </footer>
          ` : ''}

          <!-- 移动端遮罩 -->
          <div class="layout-overlay" id="layout-overlay"></div>
        </div>
      `;

      // 获取布局元素引用
      this.elements.header = this.container.querySelector('.layout-header');
      this.elements.sidebar = this.container.querySelector('.layout-sidebar');
      this.elements.content = this.container.querySelector('.layout-content');
      this.elements.overlay = this.container.querySelector('.layout-overlay');
      this.elements.breadcrumb = this.container.querySelector('#breadcrumb-container');

      if (this.options.enableFooter) {
        this.elements.footer = this.container.querySelector('.layout-footer');
      }
    }

    /**
     * 获取默认菜单配置
     */
    getDefaultMenuConfig() {
      return [
        {
          title: '工作台',
          items: [
            {
              id: 'dashboard',
              title: '概览',
              icon: '🏠',
              path: '/user',
              badge: null
            },
            {
              id: 'projects',
              title: '我的项目',
              icon: '📁',
              path: '/user/projects',
              badge: null
            },
            {
              id: 'favorites',
              title: '收藏夹',
              icon: '⭐',
              path: '/user/favorites',
              badge: null
            }
          ]
        },
        {
          title: '分析',
          items: [
            {
              id: 'analytics',
              title: '数据分析',
              icon: '📊',
              path: '/user/analytics',
              badge: null
            },
            {
              id: 'insights',
              title: '洞察报告',
              icon: '💡',
              path: '/user/insights',
              badge: '新'
            }
          ]
        },
        {
          title: '创作',
          items: [
            {
              id: 'create',
              title: '创建项目',
              icon: '➕',
              path: '/user/create',
              badge: null
            },
            {
              id: 'templates',
              title: '模板库',
              icon: '📋',
              path: '/user/templates',
              badge: null
            }
          ]
        },
        {
          title: '设置',
          items: [
            {
              id: 'settings',
              title: '设置',
              icon: '⚙️',
              path: '/user/settings',
              badge: null
            },
            {
              id: 'help',
              title: '帮助中心',
              icon: '❓',
              path: '/user/help',
              badge: null
            }
          ]
        }
      ];
    }

    /**
     * 初始化子组件
     */
    initializeSubComponents() {
      // 渲染侧边栏导航
      this.renderSidebarNav();

      // 初始化用户信息
      this.initUserInfo();

      // 初始化通知系统
      if (this.options.enableNotifications) {
        this.initNotifications();
      }

      // 初始化面包屑导航
      if (this.options.enableBreadcrumb) {
        this.initBreadcrumb();
      }
    }

    /**
     * 渲染侧边栏导航
     */
    renderSidebarNav() {
      const sidebarContent = this.getElement('sidebar-content');
      if (!sidebarContent) return;

      let navHTML = '';

      this.menuConfig.forEach(section => {
        navHTML += `
          <div class="sidebar-section">
            <div class="sidebar-title">${section.title}</div>
            <ul class="sidebar-nav">
              ${section.items.map(item => `
                <li class="nav-item">
                  <a href="${item.path}" class="nav-link" data-nav-id="${item.id}">
                    <span class="nav-icon">${item.icon}</span>
                    <span class="nav-text">${item.title}</span>
                    ${item.badge ? `<span class="nav-badge">${item.badge}</span>` : ''}
                  </a>
                </li>
              `).join('')}
            </ul>
          </div>
        `;
      });

      sidebarContent.innerHTML = navHTML;
    }

    /**
     * 初始化用户信息
     */
    initUserInfo() {
      // 这里可以从用户管理系统获取用户信息
      const user = global.userManagement?.currentUser;

      if (user && this.options.enableUserMenu) {
        const avatar = this.getElement('user-avatar');
        if (avatar) {
          const img = avatar.querySelector('img');
          if (img && user.avatar) {
            img.src = user.avatar;
          } else {
            // 显示用户名首字母
            avatar.innerHTML = user.name?.charAt(0)?.toUpperCase() || 'U';
          }
        }
      }
    }

    /**
     * 初始化通知系统
     */
    initNotifications() {
      // 模拟一些通知数据
      this.state.notifications = [
        {
          id: 1,
          title: '新项目模板',
          content: '数学函数可视化模板已上线',
          time: '5分钟前',
          unread: true
        },
        {
          id: 2,
          title: '系统维护通知',
          content: '今晚22:00-23:00进行系统维护',
          time: '1小时前',
          unread: true
        },
        {
          id: 3,
          title: '功能更新',
          content: '新增了批量操作功能',
          time: '2天前',
          unread: false
        }
      ];

      this.renderNotifications();
      this.updateNotificationCount();
    }

    /**
     * 渲染通知列表
     */
    renderNotifications() {
      const notificationList = this.getElement('notification-list');
      if (!notificationList) return;

      if (this.state.notifications.length === 0) {
        notificationList.innerHTML = `
          <div class="notification-item">
            <div class="notification-content">暂无通知</div>
          </div>
        `;
        return;
      }

      notificationList.innerHTML = this.state.notifications.map(notification => `
        <div class="notification-item ${notification.unread ? 'unread' : ''}" data-notification-id="${notification.id}">
          <div class="notification-title">${this.escapeHtml(notification.title)}</div>
          <div class="notification-content">${this.escapeHtml(notification.content)}</div>
          <div class="notification-time">${notification.time}</div>
        </div>
      `).join('');
    }

    /**
     * 更新通知数量
     */
    updateNotificationCount() {
      const countEl = this.getElement('notification-count');
      if (countEl) {
        const unreadCount = this.state.notifications.filter(n => n.unread).length;
        countEl.textContent = unreadCount;
        countEl.style.display = unreadCount > 0 ? 'flex' : 'none';
      }
    }

    /**
     * 初始化面包屑导航
     */
    initBreadcrumb() {
      // 这里可以根据当前路由生成面包屑
      this.updateBreadcrumb(['首页', '工作台']);
    }

    /**
     * 更新面包屑导航
     */
    updateBreadcrumb(items) {
      if (!this.elements.breadcrumb) return;

      const breadcrumbHTML = items.map((item, index) => {
        const isLast = index === items.length - 1;
        const className = isLast ? 'breadcrumb-item active' : 'breadcrumb-item';

        return `
          <span class="breadcrumb-separator" ${index === 0 ? 'style="display:none;"' : ''}>›</span>
          ${isLast ?
            `<span class="${className}">${this.escapeHtml(item)}</span>` :
            `<a href="#" class="${className}" data-breadcrumb-index="${index}">${this.escapeHtml(item)}</a>`
          }
        `;
      }).join('');

      this.elements.breadcrumb.innerHTML = breadcrumbHTML;
    }

    /**
     * 设置事件监听器
     */
    setupEventListeners() {
      // 菜单切换
      const menuToggle = this.getElement('menu-toggle');
      if (menuToggle) {
        menuToggle.addEventListener('click', () => {
          this.toggleSidebar();
        });
      }

      // 移动端遮罩
      const overlay = this.getElement('layout-overlay');
      if (overlay) {
        overlay.addEventListener('click', () => {
          this.closeMobileSidebar();
        });
      }

      // 用户菜单
      if (this.options.enableUserMenu) {
        const userAvatar = this.getElement('user-avatar');
        if (userAvatar) {
          userAvatar.addEventListener('click', () => {
            this.toggleUserMenu();
          });
        }

        // 点击外部关闭用户菜单
        document.addEventListener('click', (e) => {
          if (!e.target.closest('.user-menu')) {
            this.closeUserMenu();
          }
        });
      }

      // 通知面板
      if (this.options.enableNotifications) {
        const notificationBtn = this.getElement('notification-btn');
        if (notificationBtn) {
          notificationBtn.addEventListener('click', () => {
            this.toggleNotifications();
          });
        }

        // 点击外部关闭通知面板
        document.addEventListener('click', (e) => {
          if (!e.target.closest('.notifications')) {
            this.closeNotifications();
          }
        });

        // 清空通知
        const clearBtn = this.getElement('clear-notifications');
        if (clearBtn) {
          clearBtn.addEventListener('click', () => {
            this.clearNotifications();
          });
        }

        // 标记通知为已读
        const notificationList = this.getElement('notification-list');
        if (notificationList) {
          notificationList.addEventListener('click', (e) => {
            const notificationItem = e.target.closest('.notification-item');
            if (notificationItem) {
              this.markNotificationAsRead(notificationItem.dataset.notificationId);
            }
          });
        }
      }

      // 侧边栏导航
      this.elements.sidebar?.addEventListener('click', (e) => {
        const navLink = e.target.closest('.nav-link');
        if (navLink) {
          this.handleNavClick(navLink);
        }
      });

      // 搜索功能
      const searchInput = this.container.querySelector('.search-input');
      if (searchInput) {
        searchInput.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') {
            this.handleSearch(e.target.value);
          }
        });
      }

      // 滚动监听
      window.addEventListener('scroll', () => {
        this.handleScroll();
      });

      // 面包屑导航
      if (this.elements.breadcrumb) {
        this.elements.breadcrumb.addEventListener('click', (e) => {
          const breadcrumbLink = e.target.closest('.breadcrumb-item');
          if (breadcrumbLink && !breadcrumbLink.classList.contains('active')) {
            const index = parseInt(breadcrumbLink.dataset.breadcrumbIndex);
            this.handleBreadcrumbClick(index);
          }
        });
      }

      // 键盘快捷键
      document.addEventListener('keydown', (e) => {
        this.handleKeyboardShortcuts(e);
      });

      // 窗口大小变化
      window.addEventListener('resize', () => {
        this.handleResize();
      });
    }

    /**
     * 设置响应式
     */
    setupResponsive() {
      this.handleResize();
    }

    /**
     * 切换侧边栏
     */
    toggleSidebar() {
      this.state.sidebarOpen = !this.state.sidebarOpen;
      this.applySidebarState();
    }

    /**
     * 关闭移动端侧边栏
     */
    closeMobileSidebar() {
      if (this.state.screenSize === 'mobile') {
        this.elements.sidebar?.classList.remove('mobile-open');
        this.elements.overlay?.classList.remove('active');
        this.state.mobileMenuOpen = false;
      }
    }

    /**
     * 应用侧边栏状态
     */
    applySidebarState() {
      if (this.elements.sidebar) {
        this.elements.sidebar.classList.toggle('collapsed', !this.state.sidebarOpen);
      }

      if (this.elements.content) {
        this.elements.content.classList.toggle('expanded', !this.state.sidebarOpen);
      }

      this.emitEvent('sidebar:toggled', { open: this.state.sidebarOpen });
    }

    /**
     * 切换用户菜单
     */
    toggleUserMenu() {
      const dropdown = this.getElement('user-dropdown');
      if (dropdown) {
        this.state.userMenuOpen = !this.state.userMenuOpen;
        dropdown.classList.toggle('active', this.state.userMenuOpen);
      }
    }

    /**
     * 关闭用户菜单
     */
    closeUserMenu() {
      const dropdown = this.getElement('user-dropdown');
      if (dropdown) {
        this.state.userMenuOpen = false;
        dropdown.classList.remove('active');
      }
    }

    /**
     * 切换通知面板
     */
    toggleNotifications() {
      const panel = this.getElement('notification-panel');
      if (panel) {
        const isActive = panel.classList.contains('active');

        if (!isActive) {
          panel.classList.add('active');
          // 标记所有通知为已读
          this.markAllNotificationsAsRead();
        } else {
          panel.classList.remove('active');
        }
      }
    }

    /**
     * 关闭通知面板
     */
    closeNotifications() {
      const panel = this.getElement('notification-panel');
      if (panel) {
        panel.classList.remove('active');
      }
    }

    /**
     * 清空通知
     */
    clearNotifications() {
      this.state.notifications = [];
      this.renderNotifications();
      this.updateNotificationCount();
      this.closeNotifications();
    }

    /**
     * 标记通知为已读
     */
    markNotificationAsRead(notificationId) {
      const notification = this.state.notifications.find(n => n.id == notificationId);
      if (notification && notification.unread) {
        notification.unread = false;
        this.renderNotifications();
        this.updateNotificationCount();
      }
    }

    /**
     * 标记所有通知为已读
     */
    markAllNotificationsAsRead() {
      this.state.notifications.forEach(notification => {
        notification.unread = false;
      });
      this.renderNotifications();
      this.updateNotificationCount();
    }

    /**
     * 处理导航点击
     */
    handleNavClick(navLink) {
      const navId = navLink.dataset.navId;
      const path = navLink.getAttribute('href');

      // 更新活动状态
      this.container.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
      });
      navLink.classList.add('active');

      // 关闭移动端菜单
      this.closeMobileSidebar();

      this.emitEvent('nav:clicked', { navId, path });
    }

    /**
     * 处理搜索
     */
    handleSearch(query) {
      if (query.trim()) {
        this.emitEvent('search:performed', { query });
      }
    }

    /**
     * 处理滚动
     */
    handleScroll() {
      const currentScrollY = window.scrollY;
      const header = this.elements.header;

      if (header) {
        if (currentScrollY > this.state.lastScrollY && currentScrollY > 100) {
          // 向下滚动，隐藏头部
          header.style.transform = 'translateY(-100%)';
        } else {
          // 向上滚动，显示头部
          header.style.transform = 'translateY(0)';
        }

        // 添加滚动样式
        header.classList.toggle('scrolled', currentScrollY > 10);
      }

      this.state.lastScrollY = currentScrollY;
      this.state.scrollY = currentScrollY;
    }

    /**
     * 处理面包屑点击
     */
    handleBreadcrumbClick(index) {
      this.emitEvent('breadcrumb:clicked', { index });
    }

    /**
     * 处理键盘快捷键
     */
    handleKeyboardShortcuts(e) {
      // Ctrl+K 打开搜索
      if (e.ctrlKey && e.key === 'k') {
        e.preventDefault();
        const searchInput = this.container.querySelector('.search-input');
        if (searchInput) {
          searchInput.focus();
        }
      }

      // Escape 关闭面板
      if (e.key === 'Escape') {
        this.closeUserMenu();
        this.closeNotifications();
        this.closeMobileSidebar();
      }

      // Ctrl+B 切换侧边栏
      if (e.ctrlKey && e.key === 'b') {
        e.preventDefault();
        this.toggleSidebar();
      }
    }

    /**
     * 处理窗口大小变化
     */
    handleResize() {
      const newSize = this.getScreenSize();
      const oldSize = this.state.screenSize;

      this.state.screenSize = newSize;

      // 屏幕大小变化时的处理
      if (oldSize !== newSize) {
        this.handleScreenSizeChange(oldSize, newSize);
      }
    }

    /**
     * 处理屏幕大小变化
     */
    handleScreenSizeChange(oldSize, newSize) {
      if (newSize === 'mobile') {
        // 移动端：重置侧边栏状态
        this.elements.sidebar?.classList.remove('collapsed');
        this.state.sidebarOpen = true;
      } else if (oldSize === 'mobile') {
        // 从移动端切换到桌面端
        this.closeMobileSidebar();
        this.applySidebarState();
      }

      this.emitEvent('screen:resized', { oldSize, newSize });
    }

    /**
     * 获取屏幕尺寸
     */
    getScreenSize() {
      const width = window.innerWidth;

      if (width < this.breakpoints.mobile) {
        return 'mobile';
      } else if (width < this.breakpoints.tablet) {
        return 'tablet';
      } else if (width < this.breakpoints.desktop) {
        return 'desktop';
      } else {
        return 'large';
      }
    }

    /**
     * 设置活动导航项
     */
    setActiveNav(navId) {
      this.container.querySelectorAll('.nav-link').forEach(link => {
        link.classList.toggle('active', link.dataset.navId === navId);
      });
    }

    /**
     * 设置面包屑
     */
    setBreadcrumb(items) {
      this.updateBreadcrumb(items);
    }

    /**
     * 添加通知
     */
    addNotification(notification) {
      notification.id = Date.now();
      notification.unread = true;
      this.state.notifications.unshift(notification);

      // 限制通知数量
      if (this.state.notifications.length > 50) {
        this.state.notifications = this.state.notifications.slice(0, 50);
      }

      this.renderNotifications();
      this.updateNotificationCount();

      this.emitEvent('notification:added', notification);
    }

    /**
     * 设置主题
     */
    setTheme(theme) {
      this.state.currentTheme = theme;
      this.container.setAttribute('data-theme', theme);
      this.emitEvent('theme:changed', { theme });
    }

    /**
     * 应用初始状态
     */
    applyInitialState() {
      // 应用主题
      this.setTheme(this.state.currentTheme);

      // 应用侧边栏状态
      this.applySidebarState();
    }

    /**
     * 显示错误信息
     */
    showError(title, message) {
      console.error(`${title}: ${message}`);
      // 这里可以集成错误提示组件
    }

    /**
     * 工具方法：获取元素
     */
    getElement(id) {
      return this.container.querySelector(`#${id}`);
    }

    /**
     * 工具方法：生成ID
     */
    generateId() {
      return 'layout_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
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
     * 发送事件
     */
    emitEvent(eventName, data = {}) {
      const event = new CustomEvent(`layout:${eventName}`, { detail: data });
      this.container.dispatchEvent(event);
    }

    /**
     * 监听事件
     */
    on(eventName, callback) {
      this.container.addEventListener(`layout:${eventName}`, callback);
      return this;
    }

    /**
     * 移除事件监听
     */
    off(eventName, callback) {
      this.container.removeEventListener(`layout:${eventName}`, callback);
      return this;
    }

    /**
     * 获取当前状态
     */
    getState() {
      return { ...this.state };
    }

    /**
     * 获取布局统计信息
     */
    getStats() {
      return {
        sidebarOpen: this.state.sidebarOpen,
        mobileMenuOpen: this.state.mobileMenuOpen,
        userMenuOpen: this.state.userMenuOpen,
        notificationCount: this.state.notifications.filter(n => n.unread).length,
        screenSize: this.state.screenSize,
        theme: this.state.currentTheme,
        options: this.options
      };
    }

    /**
     * 销毁组件
     */
    destroy() {
      // 清理事件监听器
      this.eventListeners.forEach((listener, element) => {
        element.removeEventListener(listener.type, listener.callback);
      });
      this.eventListeners.clear();

      // 清理内容
      this.container.innerHTML = '';

      console.log('UserLayout 已销毁');
    }
  }

  // 导出到全局
  global.UserLayout = UserLayout;

})(window);