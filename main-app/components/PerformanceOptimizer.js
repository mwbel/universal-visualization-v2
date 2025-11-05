/**
 * Performance Optimization Manager
 * 前端性能优化管理器
 *
 * 功能包括：
 * - 代码分割和懒加载
 * - 资源预加载和缓存
 * - CDN优化
 * - 关键资源优化
 * - 性能监控
 */

class PerformanceOptimizer {
  constructor(options = {}) {
    this.options = {
      enableCDN: true,
      enableLazyLoading: true,
      enableCodeSplitting: true,
      enableResourceHints: true,
      enableServiceWorker: true,
      cdnBase: 'https://cdn.jsdelivr.net/npm',
      ...options
    };

    this.loadedModules = new Set();
    this.preloadedResources = new Set();
    this.performanceMetrics = new Map();

    this.init();
  }

  /**
   * 初始化性能优化器
   */
  async init() {
    console.log('🚀 Performance Optimizer: 初始化中...');

    // 预加载关键资源
    if (this.options.enableResourceHints) {
      this.addResourceHints();
    }

    // 注册Service Worker
    if (this.options.enableServiceWorker && 'serviceWorker' in navigator) {
      await this.registerServiceWorker();
    }

    // 初始化资源优化器
    await this.initResourceOptimizer();

    // 初始化CDN管理器
    await this.initCDNManager();

    // 初始化懒加载观察器
    if (this.options.enableLazyLoading) {
      this.initLazyLoading();
    }

    // 启动性能监控
    this.startPerformanceMonitoring();

    // 优化关键渲染路径
    this.optimizeCriticalRenderingPath();

    console.log('✅ Performance Optimizer: 初始化完成');
  }

  /**
   * 添加资源提示（Preconnect, DNS-Prefetch, Preload）
   */
  addResourceHints() {
    const head = document.head;

    // DNS预解析和预连接
    const hints = [
      // Google Fonts
      { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
      { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: true },
      // 主要CDN提供商
      { rel: 'preconnect', href: 'https://cdn.jsdelivr.net', crossorigin: true },
      { rel: 'preconnect', href: 'https://unpkg.com', crossorigin: true },
      { rel: 'preconnect', href: 'https://cdnjs.cloudflare.com', crossorigin: true },
      // CDN (如果使用)
      ...(this.options.enableCDN ? [
        { rel: 'preconnect', href: this.options.cdnBase }
      ] : []),
      // 常用库CDN
      { rel: 'dns-prefetch', href: 'https://fonts.googleapis.com' },
      { rel: 'dns-prefetch', href: 'https://ajax.googleapis.com' }
    ];

    hints.forEach(hint => {
      const link = document.createElement('link');
      link.rel = hint.rel;
      link.href = hint.href;
      if (hint.crossorigin) link.crossOrigin = hint.crossorigin;
      head.appendChild(link);
    });

    // 预加载关键资源
    this.preloadCriticalResources();
  }

  /**
   * 初始化资源优化器
   */
  async initResourceOptimizer() {
    try {
      // 动态导入ResourceOptimizer
      const { default: ResourceOptimizer } = await import('./ResourceOptimizer.js');

      this.resourceOptimizer = new ResourceOptimizer({
        enableImageOptimization: true,
        enableFontOptimization: true,
        enablePreloading: true,
        enableMemoryManagement: true,
        maxCacheSize: 50 * 1024 * 1024, // 50MB
        preloadStrategy: 'critical'
      });

      console.log('✅ 资源优化器初始化完成');
    } catch (error) {
      console.warn('⚠️ 资源优化器初始化失败:', error);
    }
  }

  /**
   * 初始化CDN管理器
   */
  async initCDNManager() {
    try {
      // 动态导入CDNManager
      const { default: CDNManager } = await import('./CDNManager.js');

      this.cdnManager = new CDNManager({
        enableCDN: this.options.enableCDN,
        enableCaching: true,
        enablePrefetch: true,
        enableOffline: true,
        enablePerformanceMonitoring: true,
        cacheStrategy: 'networkFirst',
        cacheExpiration: 24 * 60 * 60 * 1000, // 24小时
        prefetchThreshold: 0.8
      });

      console.log('✅ CDN管理器初始化完成');
    } catch (error) {
      console.warn('⚠️ CDN管理器初始化失败:', error);
    }
  }

  /**
   * 预加载关键资源
   */
  preloadCriticalResources() {
    const criticalResources = [
      // 核心CSS
      { href: 'styles/design-system.css', as: 'style' },
      { href: 'styles/main.css', as: 'style' },
      // 核心字体
      { href: 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap', as: 'style' },
      // 关键JavaScript
      { href: 'components/EventBus.js', as: 'script' },
      { href: 'components/StateManager.js', as: 'script' }
    ];

    criticalResources.forEach(resource => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.href = resource.href;
      link.as = resource.as;
      if (resource.as === 'script') {
        link.crossOrigin = 'anonymous';
      }
      document.head.appendChild(link);
    });
  }

  /**
   * 注册Service Worker
   */
  async registerServiceWorker() {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('✅ Service Worker 注册成功:', registration);

      // 检查更新
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            console.log('🔄 新版本可用，请刷新页面');
            // 可以在这里添加更新提示
          }
        });
      });
    } catch (error) {
      console.warn('⚠️ Service Worker 注册失败:', error);
    }
  }

  /**
   * 初始化懒加载
   */
  initLazyLoading() {
    // 图片懒加载
    this.initImageLazyLoading();

    // 模块懒加载
    this.initModuleLazyLoading();

    // 路由级别的代码分割
    this.initRouteLevelSplitting();
  }

  /**
   * 图片懒加载
   */
  initImageLazyLoading() {
    if ('IntersectionObserver' in window) {
      const imageObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target;

            // 加载图片
            if (img.dataset.src) {
              img.src = img.dataset.src;
              img.removeAttribute('data-src');
            }

            // 添加加载完成处理
            img.addEventListener('load', () => {
              img.classList.add('loaded');
            });

            // 停止观察
            imageObserver.unobserve(img);
          }
        });
      }, {
        rootMargin: '50px 0px',
        threshold: 0.1
      });

      // 观察所有带data-src的图片
      document.querySelectorAll('img[data-src]').forEach(img => {
        imageObserver.observe(img);
      });
    }
  }

  /**
   * 模块懒加载
   */
  initModuleLazyLoading() {
    // 为模块卡片添加懒加载
    const moduleCards = document.querySelectorAll('.module-card');

    if ('IntersectionObserver' in window) {
      const moduleObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting && !entry.target.classList.contains('loaded')) {
            const module = entry.target;
            const moduleId = module.dataset.module;

            if (moduleId && !this.loadedModules.has(moduleId)) {
              this.loadModuleOnDemand(moduleId);
              this.loadedModules.add(moduleId);
              module.classList.add('loaded');
            }

            moduleObserver.unobserve(module);
          }
        });
      }, {
        rootMargin: '100px 0px',
        threshold: 0.1
      });

      moduleCards.forEach(card => {
        moduleObserver.observe(card);
      });
    }
  }

  /**
   * 按需加载模块
   */
  async loadModuleOnDemand(moduleId) {
    try {
      const moduleConfig = {
        math: () => import('../modules/math.js'),
        astronomy: () => import('../modules/astronomy.js'),
        physics: () => import('../modules/physics.js'),
        chemistry: () => import('../modules/chemistry.js')
      };

      const loader = moduleConfig[moduleId];
      if (loader) {
        const module = await loader();
        console.log(`✅ 模块 ${moduleId} 加载完成`);

        // 触发模块加载完成事件
        window.dispatchEvent(new CustomEvent('moduleLoaded', {
          detail: { moduleId, module }
        }));
      }
    } catch (error) {
      console.error(`❌ 模块 ${moduleId} 加载失败:`, error);
    }
  }

  /**
   * 路由级别的代码分割
   */
  initRouteLevelSplitting() {
    // 监听路由变化
    window.addEventListener('routeChange', async (event) => {
      const { route, params } = event.detail;

      // 根据路由动态加载对应的代码
      await this.loadRouteComponent(route);
    });
  }

  /**
   * 加载路由组件
   */
  async loadRouteComponent(route) {
    const routeMap = {
      '/visualization': () => import('../routes/visualization.js'),
      '/templates': () => import('../routes/templates.js'),
      '/history': () => import('../routes/history.js'),
      '/settings': () => import('../routes/settings.js')
    };

    const loader = routeMap[route];
    if (loader) {
      try {
        const component = await loader();
        console.log(`✅ 路由组件 ${route} 加载完成`);
        return component;
      } catch (error) {
        console.error(`❌ 路由组件 ${route} 加载失败:`, error);
        return null;
      }
    }
  }

  /**
   * 优化关键渲染路径
   */
  optimizeCriticalRenderingPath() {
    // 内联关键CSS
    this.inlineCriticalCSS();

    // 异步加载非关键CSS
    this.loadNonCriticalCSS();

    // 优化字体加载
    this.optimizeFontLoading();

    // 减少布局抖动
    this.reduceLayoutShift();
  }

  /**
   * 内联关键CSS
   */
  inlineCriticalCSS() {
    const criticalCSS = `
      /* 关键CSS - 首屏内容 */
      body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif; }
      .loading { display: flex; justify-content: center; align-items: center; height: 100vh; }
      .container { max-width: 1200px; margin: 0 auto; padding: 20px; }
    `;

    const style = document.createElement('style');
    style.textContent = criticalCSS;
    document.head.insertBefore(style, document.head.firstChild);
  }

  /**
   * 异步加载非关键CSS
   */
  loadNonCriticalCSS() {
    const nonCriticalCSS = [
      'styles/animations.css',
      'styles/responsive.css',
      'styles/print.css'
    ];

    nonCriticalCSS.forEach(href => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'style';
      link.href = href;
      link.onload = function() {
        this.onload = null;
        this.rel = 'stylesheet';
      };
      document.head.appendChild(link);
    });
  }

  /**
   * 优化字体加载
   */
  optimizeFontLoading() {
    // 使用Font Display API优化字体加载
    const fontDisplayCSS = `
      @font-face {
        font-family: 'Inter';
        font-style: normal;
        font-weight: 400;
        font-display: swap;
        src: local('Inter'), url('https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hiA.woff2') format('woff2');
      }
    `;

    const style = document.createElement('style');
    style.textContent = fontDisplayCSS;
    document.head.appendChild(style);
  }

  /**
   * 减少布局抖动
   */
  reduceLayoutShift() {
    // 为动态内容设置明确的尺寸
    const dynamicElements = document.querySelectorAll('.dynamic-content');
    dynamicElements.forEach(element => {
      if (!element.style.minHeight) {
        element.style.minHeight = '200px';
      }
    });

    // 使用骨架屏
    this.addSkeletonScreens();
  }

  /**
   * 添加骨架屏
   */
  addSkeletonScreens() {
    const skeletonCSS = `
      .skeleton {
        background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
        background-size: 200% 100%;
        animation: loading 1.5s infinite;
      }
      @keyframes loading {
        0% { background-position: 200% 0; }
        100% { background-position: -200% 0; }
      }
      .skeleton-text {
        height: 1em;
        margin: 0.5em 0;
        border-radius: 4px;
      }
      .skeleton-avatar {
        width: 40px;
        height: 40px;
        border-radius: 50%;
      }
    `;

    const style = document.createElement('style');
    style.textContent = skeletonCSS;
    document.head.appendChild(style);
  }

  /**
   * 启动性能监控
   */
  startPerformanceMonitoring() {
    // 监控页面加载性能
    this.observePageLoad();

    // 监控资源加载性能
    this.observeResourceTiming();

    // 监控用户交互性能
    this.observeUserInteraction();

    // 监控内存使用
    this.observeMemoryUsage();
  }

  /**
   * 监控页面加载性能
   */
  observePageLoad() {
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'navigation') {
            const metrics = {
              domContentLoaded: entry.domContentLoadedEventEnd - entry.domContentLoadedEventStart,
              loadComplete: entry.loadEventEnd - entry.loadEventStart,
              firstPaint: this.getMetric('first-paint'),
              firstContentfulPaint: this.getMetric('first-contentful-paint'),
              largestContentfulPaint: this.getMetric('largest-contentful-paint')
            };

            console.log('📊 页面加载性能指标:', metrics);
            this.performanceMetrics.set('pageLoad', metrics);
          }
        }
      });

      observer.observe({ entryTypes: ['navigation'] });
    }
  }

  /**
   * 监控资源加载性能
   */
  observeResourceTiming() {
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'resource') {
            const resource = {
              name: entry.name,
              duration: entry.duration,
              size: entry.transferSize,
              type: entry.initiatorType
            };

            // 记录慢资源
            if (resource.duration > 1000) {
              console.warn('⚠️ 慢资源检测:', resource);
            }
          }
        }
      });

      observer.observe({ entryTypes: ['resource'] });
    }
  }

  /**
   * 监控用户交互性能
   */
  observeUserInteraction() {
    // 监控点击响应时间
    let clickStartTime;

    document.addEventListener('click', (event) => {
      clickStartTime = performance.now();
    });

    document.addEventListener('clickend', (event) => {
      if (clickStartTime) {
        const responseTime = performance.now() - clickStartTime;

        if (responseTime > 100) {
          console.warn('⚠️ 点击响应慢:', responseTime.toFixed(2) + 'ms');
        }

        clickStartTime = null;
      }
    });

    // 监控长任务
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'longtask') {
            console.warn('⚠️ 长任务检测:', entry.duration.toFixed(2) + 'ms', entry);
          }
        }
      });

      observer.observe({ entryTypes: ['longtask'] });
    }
  }

  /**
   * 监控内存使用
   */
  observeMemoryUsage() {
    if ('memory' in performance) {
      const checkMemory = () => {
        const memory = {
          used: performance.memory.usedJSHeapSize,
          total: performance.memory.totalJSHeapSize,
          limit: performance.memory.jsHeapSizeLimit
        };

        const usagePercent = (memory.used / memory.limit * 100).toFixed(2);

        if (usagePercent > 80) {
          console.warn('⚠️ 内存使用率高:', usagePercent + '%', memory);
        }

        this.performanceMetrics.set('memory', memory);
      };

      // 每30秒检查一次内存使用
      setInterval(checkMemory, 30000);
      checkMemory(); // 立即检查一次
    }
  }

  /**
   * 获取性能指标
   */
  getMetric(name) {
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.name === name) {
            return entry.startTime;
          }
        }
      });

      observer.observe({ entryTypes: ['paint'] });
    }
    return null;
  }

  /**
   * 获取性能报告
   */
  getPerformanceReport() {
    return {
      metrics: Object.fromEntries(this.performanceMetrics),
      loadedModules: Array.from(this.loadedModules),
      preloadedResources: Array.from(this.preloadedResources),
      timestamp: new Date().toISOString()
    };
  }

  /**
   * 清理资源
   */
  cleanup() {
    this.loadedModules.clear();
    this.preloadedResources.clear();
    this.performanceMetrics.clear();
  }
}

// 导出
if (typeof module !== 'undefined' && module.exports) {
  module.exports = PerformanceOptimizer;
}

// 全局暴露
window.PerformanceOptimizer = PerformanceOptimizer;