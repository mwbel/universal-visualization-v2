/**
 * 线性代数可视化模块加载器
 * Linear Algebra Visualization Module Loader
 *
 * 负责动态加载模块资源和初始化
 */

(function(window) {
  'use strict';

  class LinearAlgebraLoader {
    constructor(config) {
      this.config = config || window.LinearAlgebraModuleConfig;
      this.basePath = '';
      this.loadedResources = new Set();
      this.isInitialized = false;
    }

    /**
     * 设置模块基础路径
     */
    setBasePath(path) {
      this.basePath = path.endsWith('/') ? path : path + '/';
    }

    /**
     * 获取完整路径
     */
    getFullPath(relativePath) {
      return this.basePath + relativePath;
    }

    /**
     * 加载CSS文件
     */
    loadCSS(url, id) {
      return new Promise((resolve, reject) => {
        if (this.loadedResources.has(url)) {
          resolve();
          return;
        }

        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = url;
        if (id) link.id = id;

        link.onload = () => {
          this.loadedResources.add(url);
          resolve();
        };
        link.onerror = () => reject(new Error(`Failed to load CSS: ${url}`));

        document.head.appendChild(link);
      });
    }

    /**
     * 加载JavaScript文件
     */
    loadScript(url, id) {
      return new Promise((resolve, reject) => {
        if (this.loadedResources.has(url)) {
          resolve();
          return;
        }

        const script = document.createElement('script');
        script.src = url;
        if (id) script.id = id;

        script.onload = () => {
          this.loadedResources.add(url);
          resolve();
        };
        script.onerror = () => reject(new Error(`Failed to load script: ${url}`));

        document.head.appendChild(script);
      });
    }

    /**
     * 加载依赖库
     */
    async loadDependencies() {
      const deps = this.config.dependencies;
      const promises = [];

      // 加载 Plotly
      if (deps.plotly && deps.plotly.required) {
        promises.push(this.loadScript(deps.plotly.url, 'plotly-script'));
      }

      // 加载 MathJax
      if (deps.mathjax && deps.mathjax.required) {
        promises.push(this.loadScript(deps.mathjax.url, 'mathjax-script'));
      }

      // 加载 Polyfill
      if (deps.polyfill && deps.polyfill.required) {
        promises.push(this.loadScript(deps.polyfill.url, 'polyfill-script'));
      }

      await Promise.all(promises);
    }

    /**
     * 加载模块样式
     */
    async loadStyles(theme = 'default') {
      const promises = [];

      // 加载共享样式
      promises.push(
        this.loadCSS(
          this.getFullPath('shared-styles.css'),
          'linear-algebra-shared-styles'
        )
      );

      // 如果启用了动态视图，加载动态样式
      if (this.config.features.dynamicView.enabled) {
        promises.push(
          this.loadCSS(
            this.getFullPath(this.config.features.dynamicView.styles),
            'linear-algebra-dynamic-styles'
          )
        );
      }

      await Promise.all(promises);

      // 应用主题
      this.applyTheme(theme);
    }

    /**
     * 应用主题
     */
    applyTheme(themeName) {
      const theme = this.config.theme[themeName] || this.config.theme.default;
      const root = document.documentElement;

      root.style.setProperty('--la-primary-color', theme.primaryColor);
      root.style.setProperty('--la-secondary-color', theme.secondaryColor);
      root.style.setProperty('--la-bg-color', theme.backgroundColor);
      root.style.setProperty('--la-card-bg', theme.cardBackground);
      root.style.setProperty('--la-text-color', theme.textColor);
      root.style.setProperty('--la-border-radius', theme.borderRadius);
      root.style.setProperty('--la-font-family', theme.fontFamily);
    }

    /**
     * 加载模块脚本
     */
    async loadModuleScripts() {
      const promises = [];

      // 加载数据库
      if (this.config.features.database.enabled) {
        promises.push(
          this.loadScript(
            this.getFullPath(this.config.features.database.api),
            'linear-algebra-database'
          )
        );
      }

      // 加载页面生成器
      if (this.config.features.pageGenerator.enabled) {
        promises.push(
          this.loadScript(
            this.getFullPath(this.config.features.pageGenerator.file),
            'linear-algebra-page-generator'
          )
        );
      }

      // 加载动态视图
      if (this.config.features.dynamicView.enabled) {
        promises.push(
          this.loadScript(
            this.getFullPath(this.config.features.dynamicView.file),
            'linear-algebra-main'
          )
        );
      }

      await Promise.all(promises);
    }

    /**
     * 初始化模块
     */
    async init(options = {}) {
      if (this.isInitialized) {
        console.warn('Linear Algebra Module is already initialized');
        return;
      }

      try {
        // 设置基础路径
        if (options.basePath) {
          this.setBasePath(options.basePath);
        }

        // 加载依赖库
        console.log('Loading dependencies...');
        await this.loadDependencies();

        // 加载样式
        console.log('Loading styles...');
        await this.loadStyles(options.theme || 'default');

        // 加载模块脚本
        console.log('Loading module scripts...');
        await this.loadModuleScripts();

        this.isInitialized = true;
        console.log('Linear Algebra Module initialized successfully');

        // 触发初始化完成事件
        window.dispatchEvent(new CustomEvent('linearAlgebraModuleReady', {
          detail: { config: this.config }
        }));

        return true;
      } catch (error) {
        console.error('Failed to initialize Linear Algebra Module:', error);
        throw error;
      }
    }

    /**
     * 加载特定的可视化页面
     */
    async loadVisualization(id, container) {
      const viz = this.config.visualizations.find(v => v.id === id);
      if (!viz) {
        throw new Error(`Visualization not found: ${id}`);
      }

      const iframe = document.createElement('iframe');
      iframe.src = this.getFullPath(viz.file);
      iframe.style.width = '100%';
      iframe.style.height = '100%';
      iframe.style.border = 'none';

      if (typeof container === 'string') {
        container = document.querySelector(container);
      }

      if (!container) {
        throw new Error('Container not found');
      }

      container.innerHTML = '';
      container.appendChild(iframe);

      return iframe;
    }

    /**
     * 获取可视化列表
     */
    getVisualizationList(filters = {}) {
      let list = [...this.config.visualizations];

      // 按章节过滤
      if (filters.chapter) {
        list = list.filter(v => v.chapter === filters.chapter);
      }

      // 按关键词过滤
      if (filters.keyword) {
        const keyword = filters.keyword.toLowerCase();
        list = list.filter(v =>
          v.keywords.some(k => k.toLowerCase().includes(keyword)) ||
          v.name.toLowerCase().includes(keyword)
        );
      }

      // 按状态过滤
      if (filters.status) {
        list = list.filter(v => v.status === filters.status);
      }

      return list;
    }

    /**
     * 卸载模块
     */
    destroy() {
      // 移除加载的样式
      const styles = document.querySelectorAll('[id^="linear-algebra-"]');
      styles.forEach(style => style.remove());

      // 清除加载记录
      this.loadedResources.clear();
      this.isInitialized = false;

      console.log('Linear Algebra Module destroyed');
    }
  }

  // 创建全局实例
  window.LinearAlgebraLoader = LinearAlgebraLoader;

  // 自动初始化（如果配置了自动初始化）
  if (window.LinearAlgebraModuleConfig &&
      window.LinearAlgebraModuleConfig.integration.embedded.autoInit) {

    document.addEventListener('DOMContentLoaded', () => {
      const container = document.querySelector(
        window.LinearAlgebraModuleConfig.integration.embedded.containerSelector
      );

      if (container) {
        const loader = new LinearAlgebraLoader();
        const options = window.LinearAlgebraModuleConfig.integration.embedded.initOptions;

        loader.init(options).then(() => {
          console.log('Linear Algebra Module auto-initialized');
        }).catch(error => {
          console.error('Auto-initialization failed:', error);
        });
      }
    });
  }

})(window);
