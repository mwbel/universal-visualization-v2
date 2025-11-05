/**
 * CDN Manager
 * CDN加速和缓存策略管理器
 *
 * 功能包括：
 * - CDN资源管理和优化
 * - 智能缓存策略
 * - 资源预取和预加载
 * - 离线支持
 * - 性能监控
 */

class CDNManager {
  constructor(options = {}) {
    this.options = {
      enableCDN: true,
      enableCaching: true,
      enablePrefetch: true,
      enableOffline: true,
      enablePerformanceMonitoring: true,
      cdnProviders: [
        {
          name: 'jsdelivr',
          baseUrl: 'https://cdn.jsdelivr.net/npm',
          priority: 1
        },
        {
          name: 'unpkg',
          baseUrl: 'https://unpkg.com',
          priority: 2
        },
        {
          name: 'cdnjs',
          baseUrl: 'https://cdnjs.cloudflare.com/ajax/libs',
          priority: 3
        }
      ],
      cacheStrategy: 'networkFirst', // 'networkFirst', 'cacheFirst', 'networkOnly'
      cacheExpiration: 24 * 60 * 60 * 1000, // 24小时
      prefetchThreshold: 0.8, // 预取阈值
      ...options
    };

    this.cache = new Map();
    this.performanceMetrics = {
      cdnHits: 0,
      cacheHits: 0,
      prefetches: 0,
      totalRequests: 0,
      averageResponseTime: 0,
      errorCount: 0
    };

    this.init();
  }

  /**
   * 初始化CDN管理器
   */
  init() {
    console.log('🌐 CDN Manager: 初始化中...');

    // 初始化Service Worker
    if (this.options.enableOffline && 'serviceWorker' in navigator) {
      this.initServiceWorker();
    }

    // 初始化缓存
    if (this.options.enableCaching) {
      this.initCacheManager();
    }

    // 初始化预取
    if (this.options.enablePrefetch) {
      this.initPrefetchManager();
    }

    // 初始化性能监控
    if (this.options.enablePerformanceMonitoring) {
      this.initPerformanceMonitoring();
    }

    // 分析现有资源
    this.analyzeExistingResources();

    console.log('✅ CDN Manager: 初始化完成');
  }

  /**
   * 初始化Service Worker
   */
  async initServiceWorker() {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('✅ Service Worker 注册成功:', registration.scope);

      // 监听Service Worker消息
      navigator.serviceWorker.addEventListener('message', this.handleSWMessage.bind(this));

    } catch (error) {
      console.warn('⚠️ Service Worker 注册失败:', error);
    }
  }

  /**
   * 处理Service Worker消息
   */
  handleSWMessage(event) {
    const { type, data } = event.data;

    switch (type) {
      case 'cache-update':
        console.log('📦 缓存更新:', data);
        break;
      case 'offline-ready':
        console.log('📴 离线模式已准备就绪');
        break;
      case 'resource-cached':
        this.updateCacheMetrics(data);
        break;
    }
  }

  /**
   * 初始化缓存管理器
   */
  initCacheManager() {
    // 尝试打开IndexedDB进行持久化缓存
    if ('indexedDB' in window) {
      this.openCacheDatabase();
    }

    // 清理过期缓存
    this.cleanExpiredCache();

    // 设置定期缓存清理
    setInterval(() => {
      this.cleanExpiredCache();
    }, 60 * 60 * 1000); // 每小时清理一次
  }

  /**
   * 打开缓存数据库
   */
  async openCacheDatabase() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('CDNCacheDB', 1);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.cacheDB = request.result;
        resolve(this.cacheDB);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains('resources')) {
          const store = db.createObjectStore('resources', { keyPath: 'url' });
          store.createIndex('timestamp', 'timestamp', { unique: false });
          store.createIndex('expires', 'expires', { unique: false });
        }
      };
    });
  }

  /**
   * 清理过期缓存
   */
  cleanExpiredCache() {
    const now = Date.now();

    // 清理内存缓存
    for (const [url, resource] of this.cache.entries()) {
      if (resource.expires && resource.expires < now) {
        this.cache.delete(url);
        console.log(`🗑️ 清理过期缓存: ${url}`);
      }
    }

    // 清理IndexedDB缓存
    if (this.cacheDB) {
      const transaction = this.cacheDB.transaction(['resources'], 'readwrite');
      const store = transaction.objectStore('resources');
      const index = store.index('expires');

      const request = index.openCursor(IDBKeyRange.upperBound(now));
      request.onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor) {
          cursor.delete();
          cursor.continue();
        }
      };
    }
  }

  /**
   * 初始化预取管理器
   */
  initPrefetchManager() {
    // 监听用户交互
    this.setupInteractionPrefetching();

    // 监听网络状态
    this.setupNetworkAwarePrefetching();

    // 设置智能预取
    this.setupIntelligentPrefetching();
  }

  /**
   * 设置交互预取
   */
  setupInteractionPrefetching() {
    // 监听鼠标悬停
    document.addEventListener('mouseover', (event) => {
      const link = event.target.closest('a[href]');
      if (link && this.shouldPrefetch(link.href)) {
        this.prefetchResource(link.href);
      }
    }, { passive: true });

    // 监听触摸开始（移动端）
    document.addEventListener('touchstart', (event) => {
      const link = event.target.closest('a[href]');
      if (link && this.shouldPrefetch(link.href)) {
        this.prefetchResource(link.href);
      }
    }, { passive: true });
  }

  /**
   * 设置网络感知预取
   */
  setupNetworkAwarePrefetching() {
    // 监听网络变化
    if ('connection' in navigator) {
      navigator.connection.addEventListener('change', () => {
        this.adaptToNetworkConditions();
      });
    }

    // 初始网络适应
    this.adaptToNetworkConditions();
  }

  /**
   * 适应网络条件
   */
  adaptToNetworkConditions() {
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;

    if (connection) {
      const { effectiveType, downlink } = connection;

      // 根据网络条件调整策略
      if (effectiveType === 'slow-2g' || effectiveType === '2g') {
        this.options.prefetchThreshold = 0.95; // 更保守的预取
        console.log('📶 检测到慢速网络，调整预取策略');
      } else if (effectiveType === '4g') {
        this.options.prefetchThreshold = 0.7; // 更积极的预取
        console.log('📶 检测到快速网络，启用积极预取');
      }
    }
  }

  /**
   * 设置智能预取
   */
  setupIntelligentPrefetching() {
    // 分析用户行为模式
    this.analyzeUserPatterns();

    // 预取关键资源
    this.prefetchCriticalResources();

    // 设置定期预取
    setInterval(() => {
      this.performScheduledPrefetch();
    }, 5 * 60 * 1000); // 每5分钟
  }

  /**
   * 分析用户行为模式
   */
  analyzeUserPatterns() {
    // 记录页面访问
    const pageVisits = JSON.parse(localStorage.getItem('pageVisits') || '{}');
    const currentPath = window.location.pathname;
    pageVisits[currentPath] = (pageVisits[currentPath] || 0) + 1;
    localStorage.setItem('pageVisits', JSON.stringify(pageVisits));

    // 分析常用页面
    const frequentPages = Object.entries(pageVisits)
      .filter(([_, count]) => count > 3)
      .sort(([_, a], [__, b]) => b - a)
      .slice(0, 5);

    console.log('📊 常用页面:', frequentPages);

    // 预取常用页面资源
    frequentPages.forEach(([page, _]) => {
      if (page !== currentPath) {
        this.prefetchPageResources(page);
      }
    });
  }

  /**
   * 预取关键资源
   */
  prefetchCriticalResources() {
    const criticalResources = [
      // 核心JavaScript库
      'https://cdn.jsdelivr.net/npm/plotly.js@2.27.0/dist/plotly.min.js',
      'https://cdn.jsdelivr.net/npm/d3@7.8.5/dist/d3.min.js',
      'https://cdn.jsdelivr.net/npm/three@0.157.0/build/three.min.js',
      // 字体
      'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap',
      // 样式
      '/styles/design-system.css',
      '/styles/main.css'
    ];

    criticalResources.forEach(resource => {
      this.prefetchResource(resource);
    });
  }

  /**
   * 预取页面资源
   */
  async prefetchPageResources(pagePath) {
    try {
      // 获取页面HTML
      const response = await fetch(pagePath);
      const html = await response.text();

      // 提取资源链接
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');

      const resources = [
        ...Array.from(doc.querySelectorAll('link[rel="stylesheet"]')).map(link => link.href),
        ...Array.from(doc.querySelectorAll('script[src]')).map(script => script.src),
        ...Array.from(doc.querySelectorAll('img[src]')).map(img => img.src)
      ];

      // 预取资源
      resources.forEach(resource => {
        if (this.shouldPrefetch(resource)) {
          this.prefetchResource(resource);
        }
      });

    } catch (error) {
      console.warn('预取页面资源失败:', pagePath, error);
    }
  }

  /**
   * 定期预取
   */
  performScheduledPrefetch() {
    // 检查网络状态
    if (navigator.onLine && this.isGoodNetworkCondition()) {
      // 预取低优先级资源
      this.prefetchLowPriorityResources();
    }
  }

  /**
   * 检查网络条件
   */
  isGoodNetworkCondition() {
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;

    if (connection) {
      return connection.effectiveType !== 'slow-2g' && connection.effectiveType !== '2g';
    }

    return true; // 默认认为网络条件良好
  }

  /**
   * 预取低优先级资源
   */
  prefetchLowPriorityResources() {
    const lowPriorityResources = [
      // 文档资源
      '/docs/user-guide.html',
      '/docs/api-reference.html',
      // 示例资源
      '/examples/math-visualization.html',
      '/examples/astronomy-simulation.html'
    ];

    lowPriorityResources.forEach(resource => {
      if (Math.random() < 0.3) { // 30%概率预取
        this.prefetchResource(resource, { priority: 'low' });
      }
    });
  }

  /**
   * 判断是否应该预取
   */
  shouldPrefetch(url) {
    // 排除外部链接和非HTTP(S)协议
    if (!url.startsWith('http') || url.includes('://')) {
      return false;
    }

    // 排除当前页面
    if (url === window.location.href) {
      return false;
    }

    // 检查缓存状态
    if (this.cache.has(url)) {
      return false;
    }

    return true;
  }

  /**
   * 预取资源
   */
  async prefetchResource(url, options = {}) {
    if (this.cache.has(url)) {
      return;
    }

    try {
      const startTime = Date.now();

      const response = await fetch(url, {
        method: 'GET',
        cache: 'force-cache',
        priority: options.priority || 'high'
      });

      if (response.ok) {
        const content = await response.arrayBuffer();
        const loadTime = Date.now() - startTime;

        // 存储到缓存
        this.storeResource(url, content, response.headers, loadTime);

        // 更新指标
        this.performanceMetrics.prefetches++;
        this.updateAverageResponseTime(loadTime);

        console.log(`⚡ 预取完成: ${url} (${loadTime}ms)`);
      }

    } catch (error) {
      console.warn('预取失败:', url, error);
      this.performanceMetrics.errorCount++;
    }
  }

  /**
   * 存储资源
   */
  storeResource(url, content, headers, loadTime) {
    const resource = {
      url,
      content,
      headers: Object.fromEntries(headers.entries()),
      timestamp: Date.now(),
      expires: Date.now() + this.options.cacheExpiration,
      loadTime
    };

    // 内存缓存
    this.cache.set(url, resource);

    // 持久化缓存
    if (this.cacheDB) {
      const transaction = this.cacheDB.transaction(['resources'], 'readwrite');
      const store = transaction.objectStore('resources');
      store.put(resource);
    }
  }

  /**
   * 从缓存获取资源
   */
  async getResource(url) {
    // 先检查内存缓存
    if (this.cache.has(url)) {
      const resource = this.cache.get(url);

      // 检查是否过期
      if (!resource.expires || resource.expires > Date.now()) {
        this.performanceMetrics.cacheHits++;
        return resource;
      } else {
        this.cache.delete(url);
      }
    }

    // 检查持久化缓存
    if (this.cacheDB) {
      return new Promise((resolve) => {
        const transaction = this.cacheDB.transaction(['resources'], 'readonly');
        const store = transaction.objectStore('resources');
        const request = store.get(url);

        request.onsuccess = () => {
          const resource = request.result;

          if (resource && (!resource.expires || resource.expires > Date.now())) {
            // 恢复到内存缓存
            this.cache.set(url, resource);
            this.performanceMetrics.cacheHits++;
            resolve(resource);
          } else {
            resolve(null);
          }
        };

        request.onerror = () => resolve(null);
      });
    }

    return null;
  }

  /**
   * 获取CDN资源URL
   */
  getCDNUrl(packageName, version = 'latest', file = '') {
    if (!this.options.enableCDN) {
      return file;
    }

    // 选择最佳CDN提供商
    const provider = this.selectBestCDNProvider();

    const baseUrl = provider.baseUrl;
    let url = `${baseUrl}/${packageName}@${version}`;

    if (file) {
      url += `/${file}`;
    }

    return url;
  }

  /**
   * 选择最佳CDN提供商
   */
  selectBestCDNProvider() {
    // 简单选择策略，可以根据实际性能指标优化
    return this.options.cdnProviders
      .sort((a, b) => a.priority - b.priority)[0];
  }

  /**
   * 分析现有资源
   */
  analyzeExistingResources() {
    // 分析样式表
    document.querySelectorAll('link[rel="stylesheet"]').forEach(link => {
      this.analyzeResource(link.href, 'css');
    });

    // 分析脚本
    document.querySelectorAll('script[src]').forEach(script => {
      this.analyzeResource(script.src, 'js');
    });

    // 分析图片
    document.querySelectorAll('img[src]').forEach(img => {
      this.analyzeResource(img.src, 'image');
    });
  }

  /**
   * 分析资源
   */
  analyzeResource(url, type) {
    // 检查是否可以使用CDN
    if (this.canUseCDN(url, type)) {
      console.log(`🔗 建议使用CDN: ${url}`);
    }

    // 检查缓存优化机会
    if (this.canOptimizeCaching(url)) {
      console.log(`💾 建议优化缓存: ${url}`);
    }
  }

  /**
   * 检查是否可以使用CDN
   */
  canUseCDN(url, type) {
    // 排除本地资源
    if (url.startsWith('/') || url.includes('localhost')) {
      return false;
    }

    // 检查是否是常见的库
    const commonLibs = [
      'jquery', 'bootstrap', 'fontawesome', 'chart.js', 'd3', 'three',
      'plotly', 'mathjax', 'axios', 'lodash', 'moment'
    ];

    return commonLibs.some(lib => url.toLowerCase().includes(lib));
  }

  /**
   * 检查是否可以优化缓存
   */
  canOptimizeCaching(url) {
    // 检查是否有合适的缓存头
    // 这里简化处理，实际应该检查响应头
    return url.includes('static') || url.includes('assets');
  }

  /**
   * 初始化性能监控
   */
  initPerformanceMonitoring() {
    // 监听资源加载性能
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        list.getEntries().forEach(entry => {
          if (entry.initiatorType === 'script' ||
              entry.initiatorType === 'stylesheet' ||
              entry.initiatorType === 'img') {
            this.recordResourcePerformance(entry);
          }
        });
      });

      observer.observe({ entryTypes: ['resource'] });
    }

    // 监听导航性能
    if ('performance' in window && 'getEntriesByType' in performance) {
      const navigationEntries = performance.getEntriesByType('navigation');
      if (navigationEntries.length > 0) {
        this.recordNavigationPerformance(navigationEntries[0]);
      }
    }
  }

  /**
   * 记录资源性能
   */
  recordResourcePerformance(entry) {
    const url = entry.name;
    const metrics = {
      url,
      type: entry.initiatorType,
      duration: entry.duration,
      size: entry.transferSize || 0,
      cached: entry.transferSize === 0 && entry.decodedBodySize > 0
    };

    if (metrics.cached) {
      this.performanceMetrics.cacheHits++;
    }

    this.updateAverageResponseTime(metrics.duration);
    this.performanceMetrics.totalRequests++;

    console.log('📊 资源性能:', metrics);
  }

  /**
   * 记录导航性能
   */
  recordNavigationPerformance(entry) {
    const navigationMetrics = {
      domContentLoaded: entry.domContentLoadedEventEnd - entry.domContentLoadedEventStart,
      loadComplete: entry.loadEventEnd - entry.loadEventStart,
      firstPaint: 0,
      firstContentfulPaint: 0
    };

    // 获取Paint Timing
    if ('performance' in window && 'getEntriesByType' in performance) {
      const paintEntries = performance.getEntriesByType('paint');
      paintEntries.forEach(paintEntry => {
        if (paintEntry.name === 'first-paint') {
          navigationMetrics.firstPaint = paintEntry.startTime;
        } else if (paintEntry.name === 'first-contentful-paint') {
          navigationMetrics.firstContentfulPaint = paintEntry.startTime;
        }
      });
    }

    console.log('📈 页面导航性能:', navigationMetrics);
  }

  /**
   * 更新平均响应时间
   */
  updateAverageResponseTime(responseTime) {
    const total = this.performanceMetrics.totalRequests || 1;
    this.performanceMetrics.averageResponseTime =
      (this.performanceMetrics.averageResponseTime * (total - 1) + responseTime) / total;
  }

  /**
   * 更新缓存指标
   */
  updateCacheMetrics(data) {
    this.performanceMetrics.cacheHits++;
  }

  /**
   * 获取性能指标
   */
  getPerformanceMetrics() {
    return {
      ...this.performanceMetrics,
      cacheHitRate: this.performanceMetrics.totalRequests > 0 ?
        (this.performanceMetrics.cacheHits / this.performanceMetrics.totalRequests * 100).toFixed(2) + '%' : '0%',
      errorRate: this.performanceMetrics.totalRequests > 0 ?
        (this.performanceMetrics.errorCount / this.performanceMetrics.totalRequests * 100).toFixed(2) + '%' : '0%',
      cacheSize: this.cache.size,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * 清理资源
   */
  cleanup() {
    // 清理缓存
    this.cache.clear();

    // 关闭数据库连接
    if (this.cacheDB) {
      this.cacheDB.close();
    }

    // 重置指标
    this.performanceMetrics = {
      cdnHits: 0,
      cacheHits: 0,
      prefetches: 0,
      totalRequests: 0,
      averageResponseTime: 0,
      errorCount: 0
    };

    console.log('🧹 CDN Manager 已清理');
  }
}

// 导出
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CDNManager;
}

// 全局暴露
window.CDNManager = CDNManager;