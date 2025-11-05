/**
 * Router.js - SPA路由系统
 * 提供客户端路由功能和导航管理
 */
(function(global) {
  'use strict';

  class Router {
    constructor(options = {}) {
      this.options = {
        mode: 'history', // 'history' or 'hash'
        basePath: '/',
        ...options
      };

      this.routes = new Map();
      this.currentRoute = null;
      this.notFoundRoute = null;
      this.beforeEachHooks = [];
      this.afterEachHooks = [];

      this.state = {
        isNavigating: false,
        navigationQueue: []
      };

      this.init();
    }

    init() {
      this.bindEvents();
      this.setupInitialState();
      console.log('Router initialized');
    }

    /**
     * 路由定义
     */
    route(path, handler, options = {}) {
      const route = {
        path,
        handler,
        options,
        params: this.extractParams(path)
      };

      this.routes.set(path, route);
      return this;
    }

    notFound(handler) {
      this.notFoundRoute = {
        path: '*',
        handler,
        options: {},
        params: {}
      };
      return this;
    }

    /**
     * 导航守卫
     */
    beforeEach(hook) {
      this.beforeEachHooks.push(hook);
    }

    afterEach(hook) {
      this.afterEachHooks.push(hook);
    }

    /**
     * 导航方法
     */
    async navigate(path, state = {}) {
      if (this.state.isNavigating) {
        this.state.navigationQueue.push({ path, state });
        return;
      }

      try {
        this.state.isNavigating = true;

        // 执行前置守卫
        const to = this.resolveRoute(path);
        const from = this.currentRoute;

        for (const hook of this.beforeEachHooks) {
          const result = await hook({ to, from, state });
          if (result === false) {
            return; // 取消导航
          }
        }

        // 更新URL
        this.updateURL(path);

        // 执行路由处理器
        await this.executeRoute(to, state);

        // 更新当前路由
        this.currentRoute = to;

        // 执行后置守卫
        for (const hook of this.afterEachHooks) {
          await hook({ to, from, state });
        }

        this.emit('route:changed', { to, from, state });

      } catch (error) {
        console.error('Navigation error:', error);
        this.emit('route:error', { error, path, state });
      } finally {
        this.state.isNavigating = false;
        this.processNavigationQueue();
      }
    }

    back() {
      window.history.back();
    }

    forward() {
      window.history.forward();
    }

    go(delta) {
      window.history.go(delta);
    }

    /**
     * 路由解析
     */
    resolveRoute(path) {
      const normalizedPath = this.normalizePath(path);

      for (const [routePath, route] of this.routes) {
        const match = this.matchPath(routePath, normalizedPath);
        if (match) {
          return {
            ...route,
            params: match.params,
            query: match.query
          };
        }
      }

      // 404处理
      if (this.notFoundRoute) {
        return {
          ...this.notFoundRoute,
          params: { path: normalizedPath },
          query: {}
        };
      }

      throw new Error(`Route not found: ${path}`);
    }

    matchPath(routePath, actualPath) {
      const routeParts = routePath.split('/').filter(Boolean);
      const actualParts = actualPath.split('/').filter(Boolean);

      if (routeParts.length !== actualParts.length) {
        // 检查是否为通配符路由
        if (routeParts.includes('*')) {
          return { params: {}, query: {} };
        }
        return null;
      }

      const params = {};
      const query = this.parseQuery(actualPath);

      for (let i = 0; i < routeParts.length; i++) {
        const routePart = routeParts[i];
        const actualPart = actualParts[i];

        if (routePart.startsWith(':')) {
          // 参数路由
          const paramName = routePart.substring(1);
          params[paramName] = decodeURIComponent(actualPart);
        } else if (routePart !== actualPart) {
          // 不匹配
          return null;
        }
      }

      return { params, query };
    }

    extractParams(path) {
      const params = [];
      const parts = path.split('/').filter(Boolean);

      parts.forEach(part => {
        if (part.startsWith(':')) {
          params.push(part.substring(1));
        }
      });

      return params;
    }

    /**
     * URL操作
     */
    updateURL(path) {
      const fullPath = this.options.basePath + path;

      if (this.options.mode === 'history') {
        window.history.pushState({ path }, '', fullPath);
      } else {
        window.location.hash = path;
      }
    }

    getCurrentPath() {
      if (this.options.mode === 'history') {
        return window.location.pathname.replace(this.options.basePath, '') || '/';
      } else {
        return window.location.hash.slice(1) || '/';
      }
    }

    normalizePath(path) {
      // 确保路径以/开头
      if (!path.startsWith('/')) {
        path = '/' + path;
      }

      // 移除末尾的/（除非是根路径）
      if (path.length > 1 && path.endsWith('/')) {
        path = path.slice(0, -1);
      }

      return path;
    }

    parseQuery(path) {
      const query = {};
      const queryString = path.split('?')[1];

      if (queryString) {
        const params = new URLSearchParams(queryString);
        for (const [key, value] of params) {
          query[key] = decodeURIComponent(value);
        }
      }

      return query;
    }

    buildPath(routePath, params = {}, query = {}) {
      let path = routePath;

      // 替换参数
      Object.keys(params).forEach(key => {
        path = path.replace(`:${key}`, encodeURIComponent(params[key]));
      });

      // 添加查询字符串
      const queryString = Object.keys(query)
        .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(query[key])}`)
        .join('&');

      if (queryString) {
        path += '?' + queryString;
      }

      return this.normalizePath(path);
    }

    /**
     * 路由执行
     */
    async executeRoute(route, state) {
      if (typeof route.handler === 'function') {
        await route.handler({
          params: route.params,
          query: route.query,
          state
        });
      }
    }

    /**
     * 事件处理
     */
    bindEvents() {
      if (this.options.mode === 'history') {
        window.addEventListener('popstate', this.handlePopState.bind(this));
      } else {
        window.addEventListener('hashchange', this.handleHashChange.bind(this));
      }

      // 阻止链接的默认行为
      document.addEventListener('click', this.handleLinkClick.bind(this));
    }

    handlePopState(event) {
      if (event.state && event.state.path) {
        this.navigate(event.state.path, { replace: true });
      }
    }

    handleHashChange() {
      this.navigate(this.getCurrentPath(), { replace: true });
    }

    handleLinkClick(event) {
      const link = event.target.closest('a[href]');
      if (!link) return;

      const href = link.getAttribute('href');
      if (!href) return;

      // 只处理内部链接
      if (href.startsWith('http') || href.startsWith('//')) {
        return;
      }

      // 阻止默认行为
      event.preventDefault();

      // 导航到目标路径
      this.navigate(href);
    }

    /**
     * 初始化
     */
    setupInitialState() {
      const initialPath = this.getCurrentPath();

      // 立即导航到初始路径
      this.navigate(initialPath, { replace: true });
    }

    processNavigationQueue() {
      if (this.state.navigationQueue.length > 0 && !this.state.isNavigating) {
        const { path, state } = this.state.navigationQueue.shift();
        this.navigate(path, state);
      }
    }

    /**
     * 工具方法
     */
    isActive(routePath, params = {}) {
      if (!this.currentRoute) return false;

      const currentPath = this.currentRoute.path;
      const normalizedCurrent = this.normalizePath(currentPath);
      const normalizedTarget = this.normalizePath(routePath);

      if (normalizedCurrent !== normalizedTarget) {
        return false;
      }

      // 检查参数
      if (Object.keys(params).length > 0) {
        return Object.keys(params).every(key =>
          this.currentRoute.params[key] === params[key]
        );
      }

      return true;
    }

    /**
     * 事件系统
     */
    emit(eventName, data) {
      const event = new CustomEvent(`router:${eventName}`, {
        detail: data,
        bubbles: true
      });
      document.dispatchEvent(event);
    }

    on(eventName, handler) {
      document.addEventListener(`router:${eventName}`, handler);
    }

    off(eventName, handler) {
      document.removeEventListener(`router:${eventName}`, handler);
    }

    /**
     * 销毁方法
     */
    destroy() {
      if (this.options.mode === 'history') {
        window.removeEventListener('popstate', this.handlePopState);
      } else {
        window.removeEventListener('hashchange', this.handleHashChange);
      }

      document.removeEventListener('click', this.handleLinkClick);

      this.routes.clear();
      this.beforeEachHooks = [];
      this.afterEachHooks = [];

      console.log('Router destroyed');
    }
  }

  // 创建全局实例
  global.Router = Router;

})(window);