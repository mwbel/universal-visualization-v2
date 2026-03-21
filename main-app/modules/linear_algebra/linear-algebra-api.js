/**
 * 线性代数可视化模块 - 公共API
 * Linear Algebra Visualization Module - Public API
 *
 * 提供简洁的API接口供外部项目调用
 */

(function(window) {
  'use strict';

  class LinearAlgebraAPI {
    constructor() {
      this.loader = null;
      this.database = null;
      this.pageGenerator = null;
      this.config = null;
      this.isReady = false;
    }

    /**
     * 初始化模块
     * @param {Object} options - 初始化选项
     * @param {string} options.basePath - 模块基础路径
     * @param {string} options.theme - 主题名称 ('default' | 'dark')
     * @param {boolean} options.enableDatabase - 是否启用数据库功能
     * @param {boolean} options.enablePageGenerator - 是否启用页面生成器
     */
    async init(options = {}) {
      try {
        // 加载配置
        if (!window.LinearAlgebraModuleConfig) {
          throw new Error('Module configuration not found. Please include module.config.js first.');
        }
        this.config = window.LinearAlgebraModuleConfig;

        // 创建加载器
        this.loader = new window.LinearAlgebraLoader(this.config);

        // 初始化加载器
        await this.loader.init(options);

        // 初始化数据库
        if (options.enableDatabase !== false && window.LinearAlgebraVisualizationDB) {
          this.database = new window.LinearAlgebraVisualizationDB();
        }

        // 初始化页面生成器
        if (options.enablePageGenerator !== false && window.VisualizationPageGenerator) {
          this.pageGenerator = new window.VisualizationPageGenerator();
        }

        this.isReady = true;
        return { success: true, message: 'Module initialized successfully' };
      } catch (error) {
        console.error('Failed to initialize module:', error);
        return { success: false, error: error.message };
      }
    }

    /**
     * 检查模块是否已准备好
     */
    checkReady() {
      if (!this.isReady) {
        throw new Error('Module not initialized. Please call init() first.');
      }
    }

    /**
     * 加载可视化页面到指定容器
     * @param {string} visualizationId - 可视化ID
     * @param {string|HTMLElement} container - 容器选择器或DOM元素
     */
    async loadVisualization(visualizationId, container) {
      this.checkReady();
      return await this.loader.loadVisualization(visualizationId, container);
    }

    /**
     * 获取所有可视化列表
     * @param {Object} filters - 过滤条件
     * @param {number} filters.chapter - 按章节过滤
     * @param {string} filters.keyword - 按关键词过滤
     * @param {string} filters.status - 按状态过滤
     */
    getVisualizationList(filters = {}) {
      this.checkReady();
      return this.loader.getVisualizationList(filters);
    }

    /**
     * 搜索概念
     * @param {string} query - 搜索关键词
     */
    searchConcept(query) {
      this.checkReady();
      if (!this.database) {
        throw new Error('Database not enabled');
      }
      return this.database.searchConcept(query);
    }

    /**
     * 获取概念详情
     * @param {string} conceptName - 概念名称
     */
    getConcept(conceptName) {
      this.checkReady();
      if (!this.database) {
        throw new Error('Database not enabled');
      }
      return this.database.getConcept(conceptName);
    }

    /**
     * 添加新概念
     * @param {number} chapterNum - 章节号
     * @param {Object} conceptData - 概念数据
     */
    addConcept(chapterNum, conceptData) {
      this.checkReady();
      if (!this.database) {
        throw new Error('Database not enabled');
      }
      return this.database.addConcept(chapterNum, conceptData);
    }

    /**
     * 生成可视化页面
     * @param {Object} conceptData - 概念数据
     */
    generatePage(conceptData) {
      this.checkReady();
      if (!this.pageGenerator) {
        throw new Error('Page generator not enabled');
      }
      return this.pageGenerator.generatePage(conceptData);
    }

    /**
     * 获取所有章节
     */
    getAllChapters() {
      this.checkReady();
      if (!this.database) {
        throw new Error('Database not enabled');
      }
      return this.database.getAllChapters();
    }

    /**
     * 获取统计信息
     */
    getStatistics() {
      this.checkReady();
      if (!this.database) {
        throw new Error('Database not enabled');
      }
      return this.database.getStatistics();
    }

    /**
     * 设置主题
     * @param {string} themeName - 主题名称 ('default' | 'dark')
     */
    setTheme(themeName) {
      this.checkReady();
      this.loader.applyTheme(themeName);
    }

    /**
     * 导出数据库为JSON
     */
    exportDatabase() {
      this.checkReady();
      if (!this.database) {
        throw new Error('Database not enabled');
      }
      return this.database.exportToJSON();
    }

    /**
     * 从JSON导入数据库
     * @param {string} jsonString - JSON字符串
     */
    importDatabase(jsonString) {
      this.checkReady();
      if (!this.database) {
        throw new Error('Database not enabled');
      }
      return this.database.importFromJSON(jsonString);
    }

    /**
     * 获取模块配置
     */
    getConfig() {
      return this.config;
    }

    /**
     * 获取模块版本
     */
    getVersion() {
      return this.config ? this.config.meta.version : 'unknown';
    }

    /**
     * 销毁模块
     */
    destroy() {
      if (this.loader) {
        this.loader.destroy();
      }
      this.loader = null;
      this.database = null;
      this.pageGenerator = null;
      this.config = null;
      this.isReady = false;
    }

    /**
     * 创建嵌入式视图
     * @param {string|HTMLElement} container - 容器
     * @param {Object} options - 选项
     */
    async createEmbeddedView(container, options = {}) {
      this.checkReady();

      const containerEl = typeof container === 'string'
        ? document.querySelector(container)
        : container;

      if (!containerEl) {
        throw new Error('Container not found');
      }

      // 创建模块容器
      const moduleContainer = document.createElement('div');
      moduleContainer.className = 'linear-algebra-embedded';
      moduleContainer.style.width = options.width || '100%';
      moduleContainer.style.height = options.height || '800px';

      // 如果指定了可视化ID，直接加载
      if (options.visualizationId) {
        await this.loadVisualization(options.visualizationId, moduleContainer);
      } else {
        // 否则显示可视化列表
        this.renderVisualizationList(moduleContainer, options);
      }

      containerEl.appendChild(moduleContainer);
      return moduleContainer;
    }

    /**
     * 渲染可视化列表
     */
    renderVisualizationList(container, options = {}) {
      const list = this.getVisualizationList(options.filters || {});

      const html = `
        <div class="la-viz-list">
          <h2>线性代数可视化</h2>
          <div class="la-viz-grid">
            ${list.map(viz => `
              <div class="la-viz-card" data-id="${viz.id}">
                <h3>${viz.name}</h3>
                <p>章节 ${viz.chapter}.${viz.section}</p>
                <div class="la-viz-keywords">
                  ${viz.keywords.map(k => `<span class="la-keyword">${k}</span>`).join('')}
                </div>
                <button class="la-load-btn" data-id="${viz.id}">查看可视化</button>
              </div>
            `).join('')}
          </div>
        </div>
      `;

      container.innerHTML = html;

      // 绑定点击事件
      container.querySelectorAll('.la-load-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const id = e.target.dataset.id;
          this.loadVisualization(id, container);
        });
      });
    }

    /**
     * 监听模块事件
     * @param {string} eventName - 事件名称
     * @param {Function} callback - 回调函数
     */
    on(eventName, callback) {
      window.addEventListener(`linearAlgebra${eventName}`, callback);
    }

    /**
     * 移除事件监听
     * @param {string} eventName - 事件名称
     * @param {Function} callback - 回调函数
     */
    off(eventName, callback) {
      window.removeEventListener(`linearAlgebra${eventName}`, callback);
    }
  }

  // 创建全局单例
  const api = new LinearAlgebraAPI();

  // 暴露API
  window.LinearAlgebra = api;

  // 简化的全局方法
  window.LinearAlgebra.ready = function(callback) {
    if (api.isReady) {
      callback(api);
    } else {
      window.addEventListener('linearAlgebraModuleReady', () => callback(api));
    }
  };

  // 快速初始化方法
  window.LinearAlgebra.quickInit = async function(basePath) {
    return await api.init({
      basePath: basePath || './',
      theme: 'default',
      enableDatabase: true,
      enablePageGenerator: true
    });
  };

})(window);
