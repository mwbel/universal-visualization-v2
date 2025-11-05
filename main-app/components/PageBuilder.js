/**
 * PageBuilder.js - 页面构建器
 * 负责动态构建和管理可视化页面
 */
(function(global) {
  'use strict';

  /**
   * 页面构建器类
   */
  class PageBuilder {
    constructor(options = {}) {
      this.options = {
        // 页面配置
        defaultLayout: 'single-column',
        enableResponsive: true,
        enableAnimations: true,
        enableInteractions: true,

        // 组件配置
        containerSelector: '#app-container',
        componentRegistry: new Map(),

        // 布局配置
        layouts: {
          'single-column': {
            name: '单列布局',
            description: '适合单个大型可视化',
            maxComponents: 1
          },
          'two-column': {
            name: '双列布局',
            description: '适合多个相关可视化',
            maxComponents: 4
          },
          'grid': {
            name: '网格布局',
            description: '适合多个独立可视化',
            maxComponents: 9
          },
          'dashboard': {
            name: '仪表板布局',
            description: '适合数据仪表板',
            maxComponents: 6
          }
        },

        // 样式配置
        defaultTheme: 'light',
        enableThemeToggle: true,
        customCSS: '',

        // 性能配置
        enableLazyLoad: true,
        renderTimeout: 10000,
        maxRetries: 3,

        ...options
      };

      // 状态管理
      this.state = {
        initialized: false,
        currentLayout: this.options.defaultLayout,
        components: [],
        pages: new Map(),
        currentPage: null,
        rendering: false,
        theme: this.options.defaultTheme
      };

      // 组件管理
      this.componentFactory = null;
      this.layoutManager = null;
      this.themeManager = null;

      // 事件系统
      this.eventListeners = new Map();

      // 初始化
      this.init();
    }

    /**
     * 初始化构建器
     */
    async init() {
      try {
        console.log('PageBuilder: Initializing...');

        // 初始化子组件
        await this.initializeComponents();

        // 设置布局管理器
        this.layoutManager = new LayoutManager(this.options.layouts);

        // 设置主题管理器
        this.themeManager = new ThemeManager({
          defaultTheme: this.options.defaultTheme,
          enableToggle: this.options.enableThemeToggle
        });

        // 注册默认组件类型
        this.registerDefaultComponents();

        // 设置全局样式
        this.setupGlobalStyles();

        this.state.initialized = true;
        console.log('PageBuilder: Initialization complete');
        this.emit('initialized', { component: 'PageBuilder' });

      } catch (error) {
        console.error('PageBuilder: Initialization failed', error);
        this.emit('error', {
          component: 'PageBuilder',
          error: error.message
        });
      }
    }

    /**
     * 初始化子组件
     */
    async initializeComponents() {
      // 检查依赖
      if (window.IntelligentInputProcessor) {
        this.componentFactory = new ComponentFactory({
          inputProcessor: new window.IntelligentInputProcessor()
        });
      } else {
        console.warn('PageBuilder: IntelligentInputProcessor not available');
        this.componentFactory = new ComponentFactory();
      }
    }

    /**
     * 注册默认组件类型
     */
    registerDefaultComponents() {
      // 可视化组件
      this.registerComponent('visualization', {
        name: '可视化组件',
        description: '显示图表、动画等可视化内容',
        factory: this.createVisualizationComponent.bind(this),
        defaultConfig: {
          width: '100%',
          height: '400px',
          responsive: true,
          animation: true
        }
      });

      // 文本组件
      this.registerComponent('text', {
        name: '文本组件',
        description: '显示标题、说明等文本内容',
        factory: this.createTextComponent.bind(this),
        defaultConfig: {
          fontSize: '16px',
          color: '#333',
          textAlign: 'left'
        }
      });

      // 控制组件
      this.registerComponent('controls', {
        name: '控制组件',
        description: '提供参数调整、交互控制等功能',
        factory: this.createControlsComponent.bind(this),
        defaultConfig: {
          position: 'bottom',
          showLabels: true,
          compact: false
        }
      });

      // 信息组件
      this.registerComponent('info', {
        name: '信息组件',
        description: '显示数据说明、图例等信息',
        factory: this.createInfoComponent.bind(this),
        defaultConfig: {
          collapsible: true,
          defaultExpanded: true,
          showIcon: true
        }
      });
    }

    /**
     * 主要构建方法
     */
    async build(config) {
      const startTime = Date.now();

      try {
        // 验证配置
        this.validateConfig(config);

        this.state.rendering = true;
        this.emit('build_start', { config });

        // 创建页面
        const page = await this.createPage(config);

        // 构建布局
        await this.buildLayout(page, config.layout);

        // 添加组件
        if (config.components) {
          await this.addComponents(page, config.components);
        }

        // 应用主题
        await this.applyTheme(page, config.theme || this.state.theme);

        // 设置交互
        if (this.options.enableInteractions) {
          await this.setupInteractions(page, config.interactions);
        }

        // 渲染页面
        await this.renderPage(page);

        this.state.currentPage = page;
        this.state.rendering = false;

        const buildTime = Date.now() - startTime;
        this.emit('build_complete', { config, page, buildTime });

        return page;

      } catch (error) {
        this.state.rendering = false;
        console.error('PageBuilder: Build failed', error);
        this.emit('build_error', { config, error: error.message });
        throw error;
      }
    }

    /**
     * 创建页面
     */
    async createPage(config) {
      const page = {
        id: this.generatePageId(),
        title: config.title || '可视化页面',
        description: config.description || '',
        layout: config.layout || this.options.defaultLayout,
        theme: config.theme || this.state.theme,
        components: [],
        container: null,
        metadata: {
          createdAt: Date.now(),
          updatedAt: Date.now(),
          version: '1.0'
        }
      };

      this.state.pages.set(page.id, page);
      return page;
    }

    /**
     * 构建布局
     */
    async buildLayout(page, layoutConfig) {
      const layout = this.layoutManager.getLayout(page.layout);
      if (!layout) {
        throw new Error(`Unknown layout: ${page.layout}`);
      }

      // 创建页面容器
      page.container = this.createPageContainer(page, layout);

      // 创建布局结构
      const layoutElement = this.layoutManager.createLayout(layout, page.container);
      page.layoutElement = layoutElement;

      this.emit('layout_built', { page, layout });
    }

    /**
     * 创建页面容器
     */
    createPageContainer(page, layout) {
      const container = document.createElement('div');
      container.className = `visualization-page ${layout.className}`;
      container.id = `page-${page.id}`;
      container.setAttribute('data-page-id', page.id);
      container.setAttribute('data-layout', page.layout);

      // 添加页面头部
      const header = this.createPageHeader(page);
      container.appendChild(header);

      // 添加内容区域
      const content = document.createElement('div');
      content.className = 'page-content';
      container.appendChild(content);

      // 添加页面尾部
      const footer = this.createPageFooter(page);
      container.appendChild(footer);

      return container;
    }

    /**
     * 创建页面头部
     */
    createPageHeader(page) {
      const header = document.createElement('header');
      header.className = 'page-header';

      header.innerHTML = `
        <div class="header-content">
          <h1 class="page-title">${page.title}</h1>
          ${page.description ? `<p class="page-description">${page.description}</p>` : ''}
        </div>
        <div class="header-actions">
          ${this.options.enableThemeToggle ? this.createThemeToggle() : ''}
          <button class="btn btn-secondary" onclick="pageBuilder.exportPage('${page.id}')">
            导出
          </button>
          <button class="btn btn-primary" onclick="pageBuilder.sharePage('${page.id}')">
            分享
          </button>
        </div>
      `;

      return header;
    }

    /**
     * 创建主题切换器
     */
    createThemeToggle() {
      return `
        <div class="theme-toggle">
          <button class="btn btn-icon" onclick="pageBuilder.toggleTheme()" title="切换主题">
            <span class="theme-icon">🌙</span>
          </button>
        </div>
      `;
    }

    /**
     * 创建页面尾部
     */
    createPageFooter(page) {
      const footer = document.createElement('footer');
      footer.className = 'page-footer';

      footer.innerHTML = `
        <div class="footer-content">
          <p class="footer-info">
            由万物可视化平台生成 |
            创建时间: ${new Date(page.metadata.createdAt).toLocaleString()}
          </p>
        </div>
      `;

      return footer;
    }

    /**
     * 添加组件
     */
    async addComponents(page, componentConfigs) {
      const contentArea = page.container.querySelector('.page-content');
      const layout = this.layoutManager.getLayout(page.layout);

      for (let i = 0; i < componentConfigs.length; i++) {
        const config = componentConfigs[i];

        // 检查组件数量限制
        if (page.components.length >= layout.maxComponents) {
          console.warn(`PageBuilder: Maximum components (${layout.maxComponents}) reached`);
          break;
        }

        try {
          // 创建组件
          const component = await this.createComponent(config, i);

          // 添加到页面
          await this.addComponentToPage(page, component, contentArea);

          page.components.push(component);

        } catch (error) {
          console.error(`PageBuilder: Failed to create component ${i}`, error);
          // 继续处理其他组件
        }
      }

      this.emit('components_added', { page, components: page.components });
    }

    /**
     * 创建组件
     */
    async createComponent(config, index) {
      const componentType = config.type || 'visualization';
      const componentRegistry = this.options.componentRegistry.get(componentType);

      if (!componentRegistry) {
        throw new Error(`Unknown component type: ${componentType}`);
      }

      // 合并默认配置
      const mergedConfig = {
        ...componentRegistry.defaultConfig,
        ...config
      };

      // 创建组件实例
      const component = await componentRegistry.factory(mergedConfig, index);

      return {
        id: this.generateComponentId(),
        type: componentType,
        config: mergedConfig,
        instance: component,
        container: null,
        element: null,
        index: index
      };
    }

    /**
     * 添加组件到页面
     */
    async addComponentToPage(page, component, container) {
      // 创建组件容器
      const componentContainer = document.createElement('div');
      componentContainer.className = `component component-${component.type}`;
      componentContainer.id = `component-${component.id}`;
      componentContainer.setAttribute('data-component-type', component.type);
      componentContainer.setAttribute('data-component-index', component.index);

      // 添加组件标题（如果有）
      if (component.config.title) {
        const title = document.createElement('h3');
        title.className = 'component-title';
        title.textContent = component.config.title;
        componentContainer.appendChild(title);
      }

      // 创建组件元素
      component.element = await component.instance.render();
      componentContainer.appendChild(component.element);

      // 添加组件操作按钮
      const actions = this.createComponentActions(component);
      componentContainer.appendChild(actions);

      // 添加到容器
      container.appendChild(componentContainer);
      component.container = componentContainer;

      // 设置大小和位置
      this.applyComponentLayout(component);

      this.emit('component_added', { page, component });
    }

    /**
     * 创建组件操作按钮
     */
    createComponentActions(component) {
      const actions = document.createElement('div');
      actions.className = 'component-actions';

      actions.innerHTML = `
        <button class="btn btn-sm btn-icon" onclick="pageBuilder.configureComponent('${component.id}')" title="配置">
          ⚙️
        </button>
        <button class="btn btn-sm btn-icon" onclick="pageBuilder.duplicateComponent('${component.id}')" title="复制">
          📋
        </button>
        <button class="btn btn-sm btn-icon" onclick="pageBuilder.removeComponent('${component.id}')" title="删除">
          🗑️
        </button>
      `;

      return actions;
    }

    /**
     * 应用组件布局
     */
    applyComponentLayout(component) {
      const container = component.container;
      const config = component.config;

      // 设置尺寸
      if (config.width) {
        container.style.width = config.width;
      }
      if (config.height) {
        container.style.height = config.height;
      }

      // 设置响应式
      if (config.responsive) {
        container.classList.add('responsive');
      }

      // 设置其他样式
      if (config.className) {
        container.classList.add(config.className);
      }
    }

    /**
     * 渲染页面
     */
    async renderPage(page) {
      // 找到应用容器
      const appContainer = document.querySelector(this.options.containerSelector);
      if (!appContainer) {
        throw new Error(`App container not found: ${this.options.containerSelector}`);
      }

      // 清空容器
      appContainer.innerHTML = '';

      // 添加页面
      appContainer.appendChild(page.container);

      // 初始化组件
      for (const component of page.components) {
        if (component.instance.init) {
          await component.instance.init();
        }
      }

      // 添加到全局
      if (window.app) {
        window.app.currentPage = page;
      }

      this.emit('page_rendered', { page });
    }

    /**
     * 组件工厂方法
     */
    createVisualizationComponent(config, index) {
      return new VisualizationComponent(config, index);
    }

    createTextComponent(config, index) {
      return new TextComponent(config, index);
    }

    createControlsComponent(config, index) {
      return new ControlsComponent(config, index);
    }

    createInfoComponent(config, index) {
      return new InfoComponent(config, index);
    }

    /**
     * 主题管理
     */
    async applyTheme(page, theme) {
      if (this.themeManager) {
        await this.themeManager.applyTheme(page.container, theme);
        page.theme = theme;
        this.state.theme = theme;
        this.emit('theme_changed', { page, theme });
      }
    }

    toggleTheme() {
      const newTheme = this.state.theme === 'light' ? 'dark' : 'light';
      if (this.state.currentPage) {
        this.applyTheme(this.state.currentPage, newTheme);
      }
    }

    /**
     * 组件操作
     */
    configureComponent(componentId) {
      const component = this.findComponent(componentId);
      if (component && component.instance.configure) {
        component.instance.configure();
      }
    }

    duplicateComponent(componentId) {
      const component = this.findComponent(componentId);
      if (component && this.state.currentPage) {
        const newConfig = { ...component.config };
        this.addComponentToPage(this.state.currentPage, {
          id: this.generateComponentId(),
          type: component.type,
          config: newConfig,
          index: this.state.currentPage.components.length
        }, this.state.currentPage.container.querySelector('.page-content'));
      }
    }

    removeComponent(componentId) {
      const component = this.findComponent(componentId);
      if (component && component.container) {
        component.container.remove();
        if (this.state.currentPage) {
          const index = this.state.currentPage.components.indexOf(component);
          if (index > -1) {
            this.state.currentPage.components.splice(index, 1);
          }
        }
        this.emit('component_removed', { component });
      }
    }

    findComponent(componentId) {
      if (this.state.currentPage) {
        return this.state.currentPage.components.find(c => c.id === componentId);
      }
      return null;
    }

    /**
     * 页面操作
     */
    exportPage(pageId) {
      const page = this.state.pages.get(pageId);
      if (page) {
        const exportData = {
          page: {
            title: page.title,
            description: page.description,
            layout: page.layout,
            theme: page.theme,
            components: page.components.map(c => ({
              type: c.type,
              config: c.config
            }))
          },
          metadata: page.metadata,
          exportedAt: Date.now()
        };

        const blob = new Blob([JSON.stringify(exportData, null, 2)], {
          type: 'application/json'
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `visualization-${pageId}.json`;
        a.click();
        URL.revokeObjectURL(url);
      }
    }

    sharePage(pageId) {
      const page = this.state.pages.get(pageId);
      if (page) {
        const shareUrl = `${window.location.origin}${window.location.pathname}#page=${pageId}`;

        if (navigator.share) {
          navigator.share({
            title: page.title,
            text: page.description,
            url: shareUrl
          });
        } else {
          navigator.clipboard.writeText(shareUrl).then(() => {
            this.showMessage('链接已复制到剪贴板');
          });
        }
      }
    }

    showMessage(message) {
      // 创建消息提示
      const messageEl = document.createElement('div');
      messageEl.className = 'message toast';
      messageEl.textContent = message;
      document.body.appendChild(messageEl);

      setTimeout(() => {
        messageEl.remove();
      }, 3000);
    }

    /**
     * 验证配置
     */
    validateConfig(config) {
      if (!config || typeof config !== 'object') {
        throw new Error('Invalid config: must be an object');
      }

      if (!config.components || !Array.isArray(config.components)) {
        throw new Error('Invalid config: components must be an array');
      }
    }

    /**
     * 设置全局样式
     */
    setupGlobalStyles() {
      const styleId = 'page-builder-styles';
      if (!document.getElementById(styleId)) {
        const style = document.createElement('style');
        style.id = styleId;
        style.textContent = this.getGlobalStyles();
        document.head.appendChild(style);
      }
    }

    /**
     * 获取全局样式
     */
    getGlobalStyles() {
      return `
        .visualization-page {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 1200px;
          margin: 0 auto;
          padding: 20px;
        }

        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 30px;
          padding-bottom: 20px;
          border-bottom: 1px solid #e0e0e0;
        }

        .page-title {
          margin: 0 0 10px 0;
          font-size: 2em;
          font-weight: 600;
        }

        .page-description {
          margin: 0;
          color: #666;
          font-size: 1.1em;
        }

        .header-actions {
          display: flex;
          gap: 10px;
          align-items: center;
        }

        .page-content {
          display: grid;
          gap: 20px;
          margin-bottom: 30px;
        }

        .component {
          background: #fff;
          border: 1px solid #e0e0e0;
          border-radius: 8px;
          padding: 20px;
          position: relative;
        }

        .component-title {
          margin: 0 0 15px 0;
          font-size: 1.3em;
          font-weight: 500;
        }

        .component-actions {
          position: absolute;
          top: 10px;
          right: 10px;
          opacity: 0;
          transition: opacity 0.2s;
        }

        .component:hover .component-actions {
          opacity: 1;
        }

        .page-footer {
          text-align: center;
          padding-top: 20px;
          border-top: 1px solid #e0e0e0;
          color: #666;
          font-size: 0.9em;
        }

        .btn {
          padding: 8px 16px;
          border: 1px solid #ddd;
          border-radius: 4px;
          background: #fff;
          cursor: pointer;
          font-size: 14px;
          transition: all 0.2s;
        }

        .btn:hover {
          background: #f5f5f5;
        }

        .btn-primary {
          background: #007bff;
          color: white;
          border-color: #007bff;
        }

        .btn-primary:hover {
          background: #0056b3;
        }

        .btn-secondary {
          background: #6c757d;
          color: white;
          border-color: #6c757d;
        }

        .btn-icon {
          padding: 6px 10px;
          font-size: 12px;
        }

        .message.toast {
          position: fixed;
          bottom: 20px;
          right: 20px;
          background: #333;
          color: white;
          padding: 12px 20px;
          border-radius: 4px;
          z-index: 1000;
        }

        /* 响应式设计 */
        @media (max-width: 768px) {
          .visualization-page {
            padding: 10px;
          }

          .page-header {
            flex-direction: column;
            gap: 15px;
          }

          .header-actions {
            width: 100%;
            justify-content: flex-end;
          }

          .component {
            padding: 15px;
          }
        }
      `;
    }

    /**
     * 工具方法
     */
    registerComponent(type, config) {
      this.options.componentRegistry.set(type, config);
    }

    generatePageId() {
      return 'page_' + Math.random().toString(36).substr(2, 9);
    }

    generateComponentId() {
      return 'comp_' + Math.random().toString(36).substr(2, 9);
    }

    /**
     * 事件系统
     */
    on(event, handler) {
      if (!this.eventListeners.has(event)) {
        this.eventListeners.set(event, []);
      }
      this.eventListeners.get(event).push(handler);
    }

    off(event, handler) {
      if (this.eventListeners.has(event)) {
        const handlers = this.eventListeners.get(event);
        const index = handlers.indexOf(handler);
        if (index > -1) {
          handlers.splice(index, 1);
        }
      }
    }

    emit(event, data) {
      if (this.eventListeners.has(event)) {
        this.eventListeners.get(event).forEach(handler => {
          try {
            handler(data);
          } catch (error) {
            console.error(`PageBuilder: Error in event handler for ${event}`, error);
          }
        });
      }
    }

    /**
     * 销毁构建器
     */
    destroy() {
      // 清理页面
      this.state.pages.clear();

      // 清理事件监听器
      this.eventListeners.clear();

      // 清理子组件
      if (this.layoutManager) {
        this.layoutManager.destroy();
      }
      if (this.themeManager) {
        this.themeManager.destroy();
      }

      console.log('PageBuilder: Destroyed');
    }
  }

  /**
   * 布局管理器
   */
  class LayoutManager {
    constructor(layouts) {
      this.layouts = layouts;
    }

    getLayout(layoutId) {
      return this.layouts[layoutId] || null;
    }

    createLayout(layout, container) {
      const contentArea = container.querySelector('.page-content');
      contentArea.className = `page-content layout-${layout.name.replace(/\s+/g, '-')}`;

      switch (layout.name) {
        case 'single-column':
          contentArea.style.gridTemplateColumns = '1fr';
          break;
        case 'two-column':
          contentArea.style.gridTemplateColumns = '1fr 1fr';
          break;
        case 'grid':
          contentArea.style.gridTemplateColumns = 'repeat(auto-fit, minmax(300px, 1fr))';
          break;
        case 'dashboard':
          contentArea.style.gridTemplateColumns = '2fr 1fr';
          break;
      }

      contentArea.style.display = 'grid';
      contentArea.style.gap = '20px';

      return contentArea;
    }

    destroy() {
      // 清理资源
    }
  }

  /**
   * 主题管理器
   */
  class ThemeManager {
    constructor(options) {
      this.options = options;
      this.currentTheme = options.defaultTheme;
    }

    async applyTheme(container, theme) {
      container.className = container.className.replace(/theme-\w+/g, '');
      container.classList.add(`theme-${theme}`);
      this.currentTheme = theme;
    }

    destroy() {
      // 清理资源
    }
  }

  /**
   * 组件工厂
   */
  class ComponentFactory {
    constructor(options = {}) {
      this.options = options;
    }

    // 可以根据需要扩展组件工厂逻辑
  }

  /**
   * 基础组件类
   */
  class BaseComponent {
    constructor(config, index) {
      this.config = config;
      this.index = index;
      this.element = null;
    }

    async render() {
      throw new Error('render method must be implemented');
    }

    async init() {
      // 初始化逻辑
    }

    configure() {
      // 配置逻辑
    }
  }

  /**
   * 可视化组件
   */
  class VisualizationComponent extends BaseComponent {
    async render() {
      const container = document.createElement('div');
      container.className = 'visualization-content';
      container.style.width = this.config.width || '100%';
      container.style.height = this.config.height || '400px';

      // 这里可以集成实际的渲染逻辑
      if (this.config.visualizationData) {
        // 渲染可视化数据
        container.innerHTML = `
          <div class="visualization-placeholder">
            <p>可视化内容将在此显示</p>
            <p>配置: ${JSON.stringify(this.config, null, 2)}</p>
          </div>
        `;
      }

      return container;
    }
  }

  /**
   * 文本组件
   */
  class TextComponent extends BaseComponent {
    async render() {
      const container = document.createElement('div');
      container.className = 'text-content';

      if (this.config.content) {
        container.innerHTML = `<p>${this.config.content}</p>`;
      } else if (this.config.markdown) {
        // 简单的markdown渲染
        container.innerHTML = this.config.markdown.replace(/\n/g, '<br>');
      }

      return container;
    }
  }

  /**
   * 控制组件
   */
  class ControlsComponent extends BaseComponent {
    async render() {
      const container = document.createElement('div');
      container.className = 'controls-content';

      // 根据配置生成控制界面
      if (this.config.controls) {
        this.config.controls.forEach(control => {
          const controlEl = this.createControl(control);
          container.appendChild(controlEl);
        });
      }

      return container;
    }

    createControl(control) {
      const controlEl = document.createElement('div');
      controlEl.className = 'control-item';

      switch (control.type) {
        case 'slider':
          controlEl.innerHTML = `
            <label>${control.label}</label>
            <input type="range" min="${control.min}" max="${control.max}" value="${control.default}">
            <span>${control.default}</span>
          `;
          break;
        case 'select':
          controlEl.innerHTML = `
            <label>${control.label}</label>
            <select>
              ${control.options.map(opt => `<option value="${opt.value}">${opt.label}</option>`).join('')}
            </select>
          `;
          break;
        default:
          controlEl.innerHTML = `<p>Unknown control type: ${control.type}</p>`;
      }

      return controlEl;
    }
  }

  /**
   * 信息组件
   */
  class InfoComponent extends BaseComponent {
    async render() {
      const container = document.createElement('div');
      container.className = 'info-content';

      if (this.config.info) {
        container.innerHTML = `
          <div class="info-panel ${this.config.collapsible ? 'collapsible' : ''}">
            <h4>${this.config.title || '信息'}</h4>
            <div class="info-content">
              ${this.config.info}
            </div>
          </div>
        `;
      }

      return container;
    }
  }

  // 导出到全局
  global.PageBuilder = PageBuilder;
  global.LayoutManager = LayoutManager;
  global.ThemeManager = ThemeManager;
  global.ComponentFactory = ComponentFactory;
  global.BaseComponent = BaseComponent;
  global.VisualizationComponent = VisualizationComponent;
  global.TextComponent = TextComponent;
  global.ControlsComponent = ControlsComponent;
  global.InfoComponent = InfoComponent;

})(window);