/**
 * UserRouter.js - 用户模块路由管理器
 * 提供SPA路由功能，管理用户可视化模块的页面导航和状态
 */
(function(global) {
  'use strict';

  /**
   * 用户路由管理器类
   */
  class UserRouter {
    constructor(options = {}) {
      // 配置选项
      this.options = {
        root: options.root || '/user',
        useHash: options.useHash || false,
        enableHistory: options.enableHistory !== false,
        enableTransition: options.enableTransition !== false,
        transitionDuration: options.transitionDuration || 300,
        enableGuards: options.enableGuards !== false,
        enableCache: options.enableCache !== false,
        ...options
      };

      // 路由表
      this.routes = new Map();

      // 当前路由信息
      this.currentRoute = null;
      this.previousRoute = null;

      // 路由参数
      this.params = {};
      this.query = {};

      // 路由守卫
      this.guards = {
        beforeEach: [],
        afterEach: []
      };

      // 路由缓存
      this.cache = new Map();

      // 组件实例
      this.components = new Map();

      // 导航状态
      this.navigationState = {
        isNavigating: false,
        pendingNavigation: null
      };

      // 事件总线
      this.eventBus = new EventTarget();

      // 初始化
      this.init();
    }

    /**
     * 初始化路由管理器
     */
    init() {
      try {
        console.log('UserRouter 初始化中...');

        // 注册默认路由
        this.registerDefaultRoutes();

        // 设置监听器
        this.setupListeners();

        // 处理初始路由
        this.handleInitialRoute();

        console.log('UserRouter 初始化完成');
        this.emitEvent('router:initialized');

      } catch (error) {
        console.error('UserRouter 初始化失败:', error);
      }
    }

    /**
     * 注册默认路由
     */
    registerDefaultRoutes() {
      // 工作台首页
      this.addRoute('/', {
        name: 'dashboard',
        component: 'UserDashboard',
        title: '我的工作台',
        meta: {
          requiresAuth: true,
          keepAlive: true
        }
      });

      // 项目管理
      this.addRoute('/projects', {
        name: 'projects',
        component: 'ProjectManager',
        title: '项目管理',
        meta: {
          requiresAuth: true,
          keepAlive: true
        }
      });

      // 项目详情
      this.addRoute('/projects/:id', {
        name: 'project-detail',
        component: 'ProjectDetail',
        title: '项目详情',
        meta: {
          requiresAuth: true,
          keepAlive: false
        }
      });

      // 项目编辑
      this.addRoute('/projects/:id/edit', {
        name: 'project-edit',
        component: 'ProjectEditor',
        title: '编辑项目',
        meta: {
          requiresAuth: true,
          keepAlive: false
        }
      });

      // 创建项目
      this.addRoute('/create', {
        name: 'create-project',
        component: 'ProjectCreator',
        title: '创建项目',
        meta: {
          requiresAuth: true,
          keepAlive: false
        }
      });

      // 从模板创建
      this.addRoute('/create/:templateId', {
        name: 'create-from-template',
        component: 'ProjectCreator',
        title: '从模板创建',
        meta: {
          requiresAuth: true,
          keepAlive: false
        }
      });

      // 收藏夹
      this.addRoute('/favorites', {
        name: 'favorites',
        component: 'FavoritesManager',
        title: '我的收藏',
        meta: {
          requiresAuth: true,
          keepAlive: true
        }
      });

      // 数据分析
      this.addRoute('/analytics', {
        name: 'analytics',
        component: 'AnalyticsView',
        title: '数据分析',
        meta: {
          requiresAuth: true,
          keepAlive: true
        }
      });

      // 模板库
      this.addRoute('/templates', {
        name: 'templates',
        component: 'TemplatesView',
        title: '模板库',
        meta: {
          requiresAuth: false,
          keepAlive: true
        }
      });

      // 设置页面
      this.addRoute('/settings', {
        name: 'settings',
        component: 'SettingsView',
        title: '设置',
        meta: {
          requiresAuth: true,
          keepAlive: true
        }
      });

      // 个人资料
      this.addRoute('/profile', {
        name: 'profile',
        component: 'ProfileView',
        title: '个人资料',
        meta: {
          requiresAuth: true,
          keepAlive: true
        }
      });

      // 404页面
      this.addRoute('*', {
        name: 'not-found',
        component: 'NotFoundView',
        title: '页面未找到',
        meta: {
          requiresAuth: false,
          keepAlive: false
        }
      });
    }

    /**
     * 添加路由
     */
    addRoute(path, config) {
      const route = {
        path: path,
        name: config.name,
        component: config.component,
        title: config.title,
        meta: config.meta || {},
        props: config.props || {},
        beforeEnter: config.beforeEnter,
        children: config.children || []
      };

      // 编译路由正则表达式
      route.regex = this.compileRouteRegex(path);
      route.paramNames = this.extractParamNames(path);

      this.routes.set(path, route);

      console.log(`注册路由: ${path} -> ${config.name}`);
      return this;
    }

    /**
     * 编译路由正则表达式
     */
    compileRouteRegex(path) {
      if (path === '*') {
        return /^.*$/;
      }

      // 将路径参数转换为正则表达式
      let regexPath = path
        .replace(/\//g, '\\/')
        .replace(/:([^/]+)/g, '([^/]+)')
        .replace(/\*/g, '.*');

      return new RegExp(`^${regexPath}$`);
    }

    /**
     * 提取参数名称
     */
    extractParamNames(path) {
      const paramNames = [];
      const matches = path.match(/:([^/]+)/g);

      if (matches) {
        matches.forEach(match => {
          paramNames.push(match.substring(1));
        });
      }

      return paramNames;
    }

    /**
     * 设置监听器
     */
    setupListeners() {
      // 监听浏览器历史变化
      if (this.options.useHash) {
        window.addEventListener('hashchange', () => {
          this.handleRouteChange();
        });
      } else {
        window.addEventListener('popstate', (e) => {
          this.handleRouteChange();
        });
      }

      // 监听点击事件（支持HTML5 History API）
      if (!this.options.useHash) {
        document.addEventListener('click', (e) => {
          this.handleLinkClick(e);
        });
      }
    }

    /**
     * 处理链接点击
     */
    handleLinkClick(e) {
      const link = e.target.closest('a');
      if (!link) return;

      const href = link.getAttribute('href');
      if (!href) return;

      // 只处理内部链接
      if (href.startsWith(this.options.root) || href.startsWith('/')) {
        e.preventDefault();
        this.push(href);
      }
    }

    /**
     * 处理初始路由
     */
    handleInitialRoute() {
      const path = this.getCurrentPath();
      this.navigate(path, { replace: true });
    }

    /**
     * 获取当前路径
     */
    getCurrentPath() {
      if (this.options.useHash) {
        const hash = window.location.hash.slice(1);
        return hash || '/';
      } else {
        return window.location.pathname;
      }
    }

    /**
     * 处理路由变化
     */
    async handleRouteChange() {
      const path = this.getCurrentPath();
      await this.navigate(path);
    }

    /**
     * 导航到指定路径
     */
    async navigate(path, options = {}) {
      if (this.navigationState.isNavigating) {
        console.warn('路由导航正在进行中，忽略新的导航请求');
        return false;
      }

      this.navigationState.isNavigating = true;

      try {
        // 查找匹配的路由
        const route = this.matchRoute(path);
        if (!route) {
          console.warn(`未找到匹配的路由: ${path}`);
          route = this.matchRoute('*');
        }

        // 执行前置守卫
        const canNavigate = await this.executeGuards('beforeEach', {
          to: route,
          from: this.currentRoute,
          path: path
        });

        if (!canNavigate) {
          console.log('导航被守卫阻止');
          return false;
        }

        // 执行路由的beforeEnter守卫
        if (route.beforeEnter) {
          const canEnter = await route.beforeEnter(route, this.currentRoute);
          if (!canEnter) {
            console.log('进入路由被守卫阻止');
            return false;
          }
        }

        // 解析参数
        const { params, query } = this.parsePath(path, route);

        // 更新浏览器历史
        if (!options.replace) {
          this.updateHistory(path);
        }

        // 执行导航
        await this.performNavigation(route, params, query, options);

        this.emitEvent('route:changed', {
          route: route,
          params: params,
          query: query,
          path: path
        });

        return true;

      } catch (error) {
        console.error('导航失败:', error);
        this.emitEvent('navigation:error', { error, path });
        return false;
      } finally {
        this.navigationState.isNavigating = false;
      }
    }

    /**
     * 匹配路由
     */
    matchRoute(path) {
      for (const [routePath, route] of this.routes) {
        if (route.regex.test(path)) {
          return route;
        }
      }
      return null;
    }

    /**
     * 解析路径参数
     */
    parsePath(path, route) {
      const params = {};
      const query = {};

      // 解析路径参数
      const match = path.match(route.regex);
      if (match && route.paramNames.length > 0) {
        route.paramNames.forEach((paramName, index) => {
          params[paramName] = match[index + 1];
        });
      }

      // 解析查询参数
      const queryString = path.split('?')[1];
      if (queryString) {
        const searchParams = new URLSearchParams(queryString);
        for (const [key, value] of searchParams) {
          query[key] = value;
        }
      }

      return { params, query };
    }

    /**
     * 更新浏览器历史
     */
    updateHistory(path) {
      if (this.options.useHash) {
        window.location.hash = path;
      } else {
        window.history.pushState({ path: path }, '', path);
      }
    }

    /**
     * 执行导航
     */
    async performNavigation(route, params, query, options) {
      // 保存当前路由
      this.previousRoute = this.currentRoute;
      this.currentRoute = route;
      this.params = params;
      this.query = query;

      // 更新页面标题
      this.updatePageTitle(route.title);

      // 执行组件切换
      await this.switchComponent(route, params, query, options);

      // 执行后置守卫
      await this.executeGuards('afterEach', {
        to: route,
        from: this.previousRoute,
        params: params,
        query: query
      });
    }

    /**
     * 切换组件
     */
    async switchComponent(route, params, query, options) {
      const container = this.getComponentContainer();
      if (!container) {
        throw new Error('找不到组件容器');
      }

      try {
        // 获取组件类
        const ComponentClass = this.getComponentClass(route.component);
        if (!ComponentClass) {
          throw new Error(`找不到组件类: ${route.component}`);
        }

        // 检查缓存
        let component = null;
        const cacheKey = this.getCacheKey(route, params);

        if (this.options.enableCache && route.meta.keepAlive && this.cache.has(cacheKey)) {
          component = this.cache.get(cacheKey);
          console.log(`从缓存加载组件: ${route.name}`);
        }

        // 如果没有缓存，创建新组件
        if (!component) {
          component = new ComponentClass(container, {
            route: route,
            params: params,
            query: query,
            router: this
          });

          // 缓存组件
          if (this.options.enableCache && route.meta.keepAlive) {
            this.cache.set(cacheKey, component);
            console.log(`缓存组件: ${route.name}`);
          }
        }

        // 保存组件实例
        this.components.set(route.name, component);

        // 执行转场动画
        if (this.options.enableTransition && !options.replace) {
          await this.performTransition(container, component);
        } else {
          // 直接显示组件
          container.innerHTML = '';
          if (component.element) {
            container.appendChild(component.element);
          }
        }

        // 更新组件状态
        if (component.update) {
          await component.update(params, query);
        }

      } catch (error) {
        console.error('切换组件失败:', error);
        this.showError(`加载组件失败: ${error.message}`);
      }
    }

    /**
     * 获取组件容器
     */
    getComponentContainer() {
      return document.querySelector('#user-module-container') ||
             document.querySelector('[data-user-module]') ||
             document.querySelector('main') ||
             document.body;
    }

    /**
     * 获取组件类
     */
    getComponentClass(componentName) {
      // 首先尝试从全局获取
      if (global[componentName]) {
        return global[componentName];
      }

      // 尝试从用户模块命名空间获取
      if (global.UserModule && global.UserModule[componentName]) {
        return global.UserModule[componentName];
      }

      // 尝试动态加载
      return this.loadComponent(componentName);
    }

    /**
     * 动态加载组件
     */
    async loadComponent(componentName) {
      try {
        // 这里可以实现动态导入逻辑
        console.log(`动态加载组件: ${componentName}`);
        return null;
      } catch (error) {
        console.error(`加载组件失败: ${componentName}`, error);
        return null;
      }
    }

    /**
     * 执行转场动画
     */
    async performTransition(container, newComponent) {
      return new Promise((resolve) => {
        // 添加转场类
        container.classList.add('route-transitioning');

        // 清空容器
        container.innerHTML = '';

        // 添加新组件
        if (newComponent.element) {
          container.appendChild(newComponent.element);
        }

        // 延迟移除转场类
        setTimeout(() => {
          container.classList.remove('route-transitioning');
          resolve();
        }, this.options.transitionDuration);
      });
    }

    /**
     * 获取缓存键
     */
    getCacheKey(route, params) {
      const paramStr = Object.keys(params)
        .sort()
        .map(key => `${key}:${params[key]}`)
        .join(',');
      return `${route.name}:${paramStr}`;
    }

    /**
     * 更新页面标题
     */
    updatePageTitle(title) {
      if (title) {
        document.title = `${title} - 万物可视化`;
      }
    }

    /**
     * 执行路由守卫
     */
    async executeGuards(type, context) {
      const guards = this.guards[type];
      if (guards.length === 0) {
        return true;
      }

      for (const guard of guards) {
        try {
          const result = await guard(context);
          if (result === false) {
            return false;
          }
        } catch (error) {
          console.error('路由守卫执行失败:', error);
          return false;
        }
      }

      return true;
    }

    /**
     * 添加前置守卫
     */
    beforeEach(guard) {
      this.guards.beforeEach.push(guard);
      return this;
    }

    /**
     * 添加后置守卫
     */
    afterEach(guard) {
      this.guards.afterEach.push(guard);
      return this;
    }

    /**
     * 移除守卫
     */
    removeGuard(type, guard) {
      const guards = this.guards[type];
      const index = guards.indexOf(guard);
      if (index > -1) {
        guards.splice(index, 1);
      }
      return this;
    }

    /**
     * 导航到新路径（添加到历史记录）
     */
    push(path) {
      return this.navigate(path);
    }

    /**
     * 替换当前路径（不添加到历史记录）
     */
    replace(path) {
      return this.navigate(path, { replace: true });
    }

    /**
     * 返回上一页
     */
    back() {
      if (this.options.enableHistory) {
        window.history.back();
      } else {
        console.warn('历史功能未启用');
      }
    }

    /**
     * 前进一页
     */
    forward() {
      if (this.options.enableHistory) {
        window.history.forward();
      } else {
        console.warn('历史功能未启用');
      }
    }

    /**
     * 获取当前路由信息
     */
    getCurrentRoute() {
      return {
        route: this.currentRoute,
        params: this.params,
        query: this.query,
        path: this.getCurrentPath()
      };
    }

    /**
     * 生成路由URL
     */
    generateUrl(routeName, params = {}, query = {}) {
      const route = this.getRouteByName(routeName);
      if (!route) {
        throw new Error(`未找到路由: ${routeName}`);
      }

      let url = route.path;

      // 替换路径参数
      Object.keys(params).forEach(key => {
        url = url.replace(`:${key}`, params[key]);
      });

      // 添加查询参数
      const queryKeys = Object.keys(query);
      if (queryKeys.length > 0) {
        const queryString = queryKeys
          .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(query[key])}`)
          .join('&');
        url += `?${queryString}`;
      }

      return url;
    }

    /**
     * 根据名称获取路由
     */
    getRouteByName(name) {
      for (const [path, route] of this.routes) {
        if (route.name === name) {
          return route;
        }
      }
      return null;
    }

    /**
     * 检查是否有指定权限
     */
    hasPermission(route) {
      if (!route.meta.requiresAuth) {
        return true;
      }

      // 临时禁用认证检查：默认允许访客模式访问
      // TODO: 等其他功能模块完善后，恢复正常的认证检查
      // return global.userManagement?.currentUser != null;
      return true; // 临时允许所有访问（访客模式）
    }

    /**
     * 显示错误信息
     */
    showError(message) {
      console.error(message);
      // 这里可以集成错误显示组件
      alert(message);
    }

    /**
     * 清理缓存
     */
    clearCache() {
      this.cache.clear();
      console.log('路由缓存已清理');
    }

    /**
     * 销毁组件
     */
    destroyComponents() {
      // 销毁所有缓存的组件
      for (const [key, component] of this.cache) {
        if (component.destroy) {
          component.destroy();
        }
      }

      // 销毁当前组件
      for (const [name, component] of this.components) {
        if (component.destroy) {
          component.destroy();
        }
      }

      this.cache.clear();
      this.components.clear();

      console.log('所有路由组件已销毁');
    }

    /**
     * 发送事件
     */
    emitEvent(eventName, data = {}) {
      const event = new CustomEvent(`router:${eventName}`, { detail: data });
      this.eventBus.dispatchEvent(event);
    }

    /**
     * 监听事件
     */
    on(eventName, callback) {
      this.eventBus.addEventListener(`router:${eventName}`, callback);
      return this;
    }

    /**
     * 移除事件监听
     */
    off(eventName, callback) {
      this.eventBus.removeEventListener(`router:${eventName}`, callback);
      return this;
    }

    /**
     * 获取路由统计信息
     */
    getStats() {
      return {
        totalRoutes: this.routes.size,
        cachedComponents: this.cache.size,
        activeComponents: this.components.size,
        currentRoute: this.currentRoute?.name,
        navigationState: this.navigationState,
        options: this.options
      };
    }

    /**
     * 导出路由配置
     */
    exportRoutes() {
      const routes = {};

      for (const [path, route] of this.routes) {
        routes[route.name] = {
          path: path,
          component: route.component,
          title: route.title,
          meta: route.meta
        };
      }

      return routes;
    }

    /**
     * 销毁路由管理器
     */
    destroy() {
      // 销毁所有组件
      this.destroyComponents();

      // 清理守卫
      this.guards.beforeEach = [];
      this.guards.afterEach = [];

      // 移除事件监听器
      if (this.options.useHash) {
        window.removeEventListener('hashchange', this.handleRouteChange);
      } else {
        window.removeEventListener('popstate', this.handleRouteChange);
        document.removeEventListener('click', this.handleLinkClick);
      }

      console.log('UserRouter 已销毁');
    }
  }

  // 创建全局实例
  const userRouter = new UserRouter();

  // 导出到全局
  global.UserRouter = UserRouter;
  global.userRouter = userRouter;

})(window);