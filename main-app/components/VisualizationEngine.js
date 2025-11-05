/**
 * VisualizationEngine.js - 可视化生成引擎
 * 负责动态生成可视化页面和组件
 */
(function(global) {
  'use strict';

  /**
   * 可视化引擎类
   */
  class VisualizationEngine {
    constructor(options = {}) {
      this.options = {
        // 渲染配置
        defaultRenderer: 'canvas',
        enableAnimation: true,
        enableInteraction: true,
        enableResponsive: true,

        // 组件配置
        containerSelector: '#visualization-container',
        componentLibrary: {
          chart: ['ChartJS', 'D3', 'Plotly'],
          '3d': ['ThreeJS', 'WebGL'],
          math: ['MathJax', 'KaTeX'],
          generic: ['Custom']
        },

        // 性能配置
        maxRenderTime: 5000,
        enableLazyLoad: true,
        enableCache: true,
        cacheSize: 50,

        // 错误处理
        enableErrorRecovery: true,
        maxRetryAttempts: 3,

        ...options
      };

      // 状态管理
      this.state = {
        initialized: false,
        rendering: false,
        components: new Map(),
        cache: new Map(),
        errors: [],
        stats: {
          rendersCount: 0,
          successCount: 0,
          errorCount: 0,
          avgRenderTime: 0
        }
      };

      // 组件注册表
      this.renderers = new Map();
      this.componentFactories = new Map();
      this.interactionHandlers = new Map();

      // 事件系统
      this.eventListeners = new Map();

      // 初始化
      this.init();
    }

    /**
     * 初始化引擎
     */
    async init() {
      try {
        console.log('VisualizationEngine: Initializing...');

        // 注册默认渲染器
        this.registerDefaultRenderers();

        // 注册组件工厂
        this.registerComponentFactories();

        // 初始化全局依赖
        await this.initializeDependencies();

        // 设置错误处理
        this.setupErrorHandling();

        this.state.initialized = true;
        console.log('VisualizationEngine: Initialization complete');
        this.emit('initialized', { component: 'VisualizationEngine' });

      } catch (error) {
        console.error('VisualizationEngine: Initialization failed', error);
        this.emit('error', {
          component: 'VisualizationEngine',
          error: error.message
        });
      }
    }

    /**
     * 注册默认渲染器
     */
    registerDefaultRenderers() {
      // Chart.js 渲染器
      this.registerRenderer('chartjs', {
        name: 'Chart.js',
        version: '3.x',
        supported: this.checkLibraryAvailability('Chart'),
        render: this.renderChartJS.bind(this)
      });

      // D3.js 渲染器
      this.registerRenderer('d3', {
        name: 'D3.js',
        version: '7.x',
        supported: this.checkLibraryAvailability('d3'),
        render: this.renderD3.bind(this)
      });

      // Three.js 渲染器
      this.registerRenderer('threejs', {
        name: 'Three.js',
        version: '0.x',
        supported: this.checkLibraryAvailability('THREE'),
        render: this.renderThreeJS.bind(this)
      });

      // 自定义渲染器
      this.registerRenderer('custom', {
        name: 'Custom Renderer',
        version: '1.0',
        supported: true,
        render: this.renderCustom.bind(this)
      });
    }

    /**
     * 注册组件工厂
     */
    registerComponentFactories() {
      // 数学可视化工厂
      this.registerComponentFactory('math', {
        create: this.createMathVisualization.bind(this),
        getDefaultConfig: this.getMathDefaultConfig.bind(this)
      });

      // 天文学可视化工厂
      this.registerComponentFactory('astronomy', {
        create: this.createAstronomyVisualization.bind(this),
        getDefaultConfig: this.getAstronomyDefaultConfig.bind(this)
      });

      // 物理可视化工厂
      this.registerComponentFactory('physics', {
        create: this.createPhysicsVisualization.bind(this),
        getDefaultConfig: this.getPhysicsDefaultConfig.bind(this)
      });

      // 化学可视化工厂
      this.registerComponentFactory('chemistry', {
        create: this.createChemistryVisualization.bind(this),
        getDefaultConfig: this.getChemistryDefaultConfig.bind(this)
      });
    }

    /**
     * 检查库可用性
     */
    checkLibraryAvailability(libraryName) {
      switch (libraryName) {
        case 'Chart':
          return typeof window.Chart !== 'undefined';
        case 'd3':
          return typeof window.d3 !== 'undefined';
        case 'THREE':
          return typeof window.THREE !== 'undefined';
        default:
          return false;
      }
    }

    /**
     * 初始化依赖
     */
    async initializeDependencies() {
      // 动态加载必要的库
      const requiredLibraries = [];

      if (!this.checkLibraryAvailability('Chart')) {
        requiredLibraries.push('https://cdn.jsdelivr.net/npm/chart.js');
      }

      if (!this.checkLibraryAvailability('d3')) {
        requiredLibraries.push('https://d3js.org/d3.v7.min.js');
      }

      if (!this.checkLibraryAvailability('THREE')) {
        requiredLibraries.push('https://cdn.jsdelivr.net/npm/three@0.150.0/build/three.min.js');
      }

      // 异步加载库
      for (const lib of requiredLibraries) {
        await this.loadLibrary(lib);
      }
    }

    /**
     * 动态加载库
     */
    loadLibrary(url) {
      return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = url;
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
      });
    }

    /**
     * 主要生成方法
     */
    async generate(config) {
      const startTime = Date.now();

      try {
        // 验证配置
        this.validateConfig(config);

        // 检查缓存
        if (this.options.enableCache) {
          const cached = this.getCachedVisualization(config);
          if (cached) {
            this.emit('cache_hit', { config });
            return cached;
          }
        }

        this.state.rendering = true;
        this.state.stats.rendersCount++;
        this.emit('render_start', { config });

        // 创建可视化
        const visualization = await this.createVisualization(config);

        // 应用配置
        await this.applyConfiguration(visualization, config);

        // 设置交互
        if (this.options.enableInteraction) {
          await this.setupInteractions(visualization, config);
        }

        // 缓存结果
        if (this.options.enableCache) {
          this.cacheVisualization(config, visualization);
        }

        // 更新统计
        const renderTime = Date.now() - startTime;
        this.updateStats(renderTime, true);

        this.state.rendering = false;
        this.emit('render_complete', { config, visualization, renderTime });

        return visualization;

      } catch (error) {
        this.state.rendering = false;
        const renderTime = Date.now() - startTime;
        this.updateStats(renderTime, false);

        console.error('VisualizationEngine: Generate failed', error);
        this.emit('render_error', { config, error: error.message });

        // 错误恢复
        if (this.options.enableErrorRecovery) {
          return this.handleErrorRecovery(config, error);
        }

        throw error;
      }
    }

    /**
     * 创建可视化
     */
    async createVisualization(config) {
      const { type, category, template } = config;

      // 选择合适的渲染器
      const renderer = this.selectRenderer(config);
      if (!renderer) {
        throw new Error(`No suitable renderer found for type: ${type}`);
      }

      // 选择组件工厂
      const factory = this.componentFactories.get(category);
      if (!factory) {
        throw new Error(`No component factory found for category: ${category}`);
      }

      // 创建组件
      const component = await factory.create(config);

      // 渲染组件
      const visualization = await renderer.render(component, config);

      return {
        id: this.generateId(),
        type: type,
        category: category,
        config: config,
        component: component,
        renderer: renderer,
        container: null,
        interactions: [],
        timestamp: Date.now()
      };
    }

    /**
     * 选择渲染器
     */
    selectRenderer(config) {
      const { type, template } = config;
      let preferredRenderer = null;

      // 基于类型选择渲染器
      switch (type) {
        case 'chart':
        case 'graph':
          preferredRenderer = 'chartjs';
          break;
        case '3d':
        case 'animation':
          preferredRenderer = 'threejs';
          break;
        case 'custom':
          preferredRenderer = 'custom';
          break;
        default:
          preferredRenderer = 'd3';
      }

      // 检查渲染器可用性
      const renderer = this.renderers.get(preferredRenderer);
      if (renderer && renderer.supported) {
        return renderer;
      }

      // 降级到可用的渲染器
      for (const [name, r] of this.renderers) {
        if (r.supported) {
          return r;
        }
      }

      return null;
    }

    /**
     * 应用配置
     */
    async applyConfiguration(visualization, config) {
      const { component } = visualization;

      // 应用参数
      if (config.parameters) {
        await this.applyParameters(component, config.parameters);
      }

      // 应用样式
      if (config.style) {
        await this.applyStyle(component, config.style);
      }

      // 应用动画
      if (config.animation && this.options.enableAnimation) {
        await this.applyAnimation(component, config.animation);
      }

      // 应用响应式
      if (config.responsive && this.options.enableResponsive) {
        await this.applyResponsive(component, config.responsive);
      }
    }

    /**
     * 数学可视化创建器
     */
    async createMathVisualization(config) {
      const { template, parameters } = config;

      switch (template.id) {
        case 'normal_distribution':
          return this.createNormalDistribution(parameters);
        case 'quadratic_function':
          return this.createQuadraticFunction(parameters);
        case 'trigonometric_functions':
          return this.createTrigonometricFunctions(parameters);
        case 'matrix_transform':
          return this.createMatrixTransform(parameters);
        default:
          throw new Error(`Unknown math template: ${template.id}`);
      }
    }

    /**
     * 创建正态分布可视化
     */
    createNormalDistribution(parameters) {
      const { mu = 0, sigma = 1 } = parameters;

      // 生成数据
      const data = this.generateNormalDistributionData(mu, sigma);

      return {
        type: 'chart',
        data: data,
        options: {
          type: 'line',
          data: {
            labels: data.x,
            datasets: [{
              label: `正态分布 (μ=${mu}, σ=${sigma})`,
              data: data.y,
              borderColor: 'rgb(75, 192, 192)',
              backgroundColor: 'rgba(75, 192, 192, 0.2)',
              tension: 0.1
            }]
          },
          options: {
            responsive: true,
            plugins: {
              title: {
                display: true,
                text: '正态分布概率密度函数'
              }
            },
            scales: {
              x: {
                title: {
                  display: true,
                  text: 'x'
                }
              },
              y: {
                title: {
                  display: true,
                  text: '概率密度'
                }
              }
            }
          }
        }
      };
    }

    /**
     * 生成正态分布数据
     */
    generateNormalDistributionData(mu, sigma) {
      const points = 100;
      const range = 4 * sigma;
      const x = [];
      const y = [];

      for (let i = 0; i <= points; i++) {
        const xVal = mu - range + (2 * range * i) / points;
        const yVal = (1 / (sigma * Math.sqrt(2 * Math.PI))) *
                    Math.exp(-0.5 * Math.pow((xVal - mu) / sigma, 2));

        x.push(xVal.toFixed(2));
        y.push(yVal);
      }

      return { x, y };
    }

    /**
     * 创建二次函数可视化
     */
    createQuadraticFunction(parameters) {
      const { a = 1, b = 2, c = 1 } = parameters;

      const data = this.generateQuadraticFunctionData(a, b, c);

      return {
        type: 'chart',
        data: data,
        options: {
          type: 'line',
          data: {
            labels: data.x,
            datasets: [{
              label: `y = ${a}x² + ${b}x + ${c}`,
              data: data.y,
              borderColor: 'rgb(255, 99, 132)',
              backgroundColor: 'rgba(255, 99, 132, 0.2)',
              tension: 0.1
            }]
          },
          options: {
            responsive: true,
            plugins: {
              title: {
                display: true,
                text: '二次函数图像'
              }
            },
            scales: {
              x: {
                title: {
                  display: true,
                  text: 'x'
                }
              },
              y: {
                title: {
                  display: true,
                  text: 'y'
                }
              }
            }
          }
        }
      };
    }

    /**
     * 生成二次函数数据
     */
    generateQuadraticFunctionData(a, b, c) {
      const points = 100;
      const range = 10;
      const x = [];
      const y = [];

      for (let i = 0; i <= points; i++) {
        const xVal = -range + (2 * range * i) / points;
        const yVal = a * xVal * xVal + b * xVal + c;

        x.push(xVal.toFixed(2));
        y.push(yVal);
      }

      return { x, y };
    }

    /**
     * Chart.js 渲染器
     */
    async renderChartJS(component, config) {
      if (!window.Chart) {
        throw new Error('Chart.js not available');
      }

      const container = this.createContainer(config);
      const ctx = container.getContext('2d');

      const chart = new window.Chart(ctx, component.options);

      return {
        container: container,
        chart: chart,
        type: 'chartjs'
      };
    }

    /**
     * D3.js 渲染器
     */
    async renderD3(component, config) {
      if (!window.d3) {
        throw new Error('D3.js not available');
      }

      const container = this.createContainer(config);
      const svg = window.d3.select(container)
        .append('svg')
        .attr('width', config.width || 800)
        .attr('height', config.height || 600);

      // 基础D3渲染逻辑
      // 这里可以根据具体组件类型实现不同的渲染逻辑

      return {
        container: container,
        svg: svg,
        type: 'd3'
      };
    }

    /**
     * Three.js 渲染器
     */
    async renderThreeJS(component, config) {
      if (!window.THREE) {
        throw new Error('Three.js not available');
      }

      const container = this.createContainer(config);

      // 创建场景、相机、渲染器
      const scene = new window.THREE.Scene();
      const camera = new window.THREE.PerspectiveCamera(
        75,
        (config.width || 800) / (config.height || 600),
        0.1,
        1000
      );
      const renderer = new window.THREE.WebGLRenderer({ container: container });

      renderer.setSize(config.width || 800, config.height || 600);
      container.appendChild(renderer.domElement);

      return {
        container: container,
        scene: scene,
        camera: camera,
        renderer: renderer,
        type: 'threejs'
      };
    }

    /**
     * 自定义渲染器
     */
    async renderCustom(component, config) {
      const container = this.createContainer(config);

      // 实现自定义渲染逻辑
      container.innerHTML = `
        <div class="custom-visualization">
          <h3>${component.title || '自定义可视化'}</h3>
          <div class="visualization-content">
            ${component.content || ''}
          </div>
        </div>
      `;

      return {
        container: container,
        type: 'custom'
      };
    }

    /**
     * 创建容器
     */
    createContainer(config) {
      const container = document.createElement('canvas');
      container.width = config.width || 800;
      container.height = config.height || 600;
      container.className = 'visualization-canvas';
      container.style.border = '1px solid #ddd';
      container.style.borderRadius = '4px';

      return container;
    }

    /**
     * 设置交互
     */
    async setupInteractions(visualization, config) {
      const interactions = [];

      // 缩放交互
      if (config.interactions?.zoom) {
        interactions.push(this.setupZoomInteraction(visualization));
      }

      // 平移交互
      if (config.interactions?.pan) {
        interactions.push(this.setupPanInteraction(visualization));
      }

      // 选择交互
      if (config.interactions?.select) {
        interactions.push(this.setupSelectInteraction(visualization));
      }

      visualization.interactions = interactions;
    }

    /**
     * 缓存管理
     */
    getCachedVisualization(config) {
      const key = JSON.stringify(config);
      const cached = this.state.cache.get(key);

      if (cached && Date.now() - cached.timestamp < 3600000) { // 1小时
        return cached.visualization;
      }

      return null;
    }

    cacheVisualization(config, visualization) {
      const key = JSON.stringify(config);

      // 清理过期缓存
      if (this.state.cache.size >= this.options.cacheSize) {
        this.cleanupCache();
      }

      this.state.cache.set(key, {
        visualization: visualization,
        timestamp: Date.now()
      });
    }

    cleanupCache() {
      const now = Date.now();
      const entries = Array.from(this.state.cache.entries());

      entries.forEach(([key, value]) => {
        if (now - value.timestamp > 3600000) { // 1小时
          this.state.cache.delete(key);
        }
      });

      // 如果还是太大，删除最旧的
      if (this.state.cache.size >= this.options.cacheSize) {
        const sorted = entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
        const toDelete = sorted.slice(0, sorted.length - this.options.cacheSize);
        toDelete.forEach(([key]) => this.state.cache.delete(key));
      }
    }

    /**
     * 统计更新
     */
    updateStats(renderTime, success) {
      if (success) {
        this.state.stats.successCount++;
      } else {
        this.state.stats.errorCount++;
      }

      // 更新平均渲染时间
      const totalRenders = this.state.stats.successCount + this.state.stats.errorCount;
      this.state.stats.avgRenderTime =
        (this.state.stats.avgRenderTime * (totalRenders - 1) + renderTime) / totalRenders;
    }

    /**
     * 验证配置
     */
    validateConfig(config) {
      if (!config || typeof config !== 'object') {
        throw new Error('Invalid config: must be an object');
      }

      if (!config.type || !config.category) {
        throw new Error('Invalid config: missing required fields type or category');
      }

      if (!config.template) {
        throw new Error('Invalid config: missing template');
      }
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
            console.error(`VisualizationEngine: Error in event handler for ${event}`, error);
          }
        });
      }
    }

    /**
     * 工具方法
     */
    registerRenderer(name, renderer) {
      this.renderers.set(name, renderer);
    }

    registerComponentFactory(category, factory) {
      this.componentFactories.set(category, factory);
    }

    generateId() {
      return 'viz_' + Math.random().toString(36).substr(2, 9);
    }

    getStats() {
      return { ...this.state.stats };
    }

    clearCache() {
      this.state.cache.clear();
      this.emit('cache_cleared');
    }

    /**
     * 销毁引擎
     */
    destroy() {
      // 清理组件
      this.state.components.forEach(component => {
        if (component.destroy) {
          component.destroy();
        }
      });

      // 清理状态
      this.state.initialized = false;
      this.renderers.clear();
      this.componentFactories.clear();
      this.eventListeners.clear();

      console.log('VisualizationEngine: Destroyed');
    }
  }

  // 导出到全局
  global.VisualizationEngine = VisualizationEngine;

})(window);