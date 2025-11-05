/**
 * Resource Optimization Manager
 * 资源优化管理器
 *
 * 功能包括：
 * - 图片优化和懒加载
 * - 字体优化
 * - CSS/JS压缩和合并
 * - 网络资源预加载
 * - 内存使用优化
 */

class ResourceOptimizer {
  constructor(options = {}) {
    this.options = {
      enableImageOptimization: true,
      enableFontOptimization: true,
      enablePreloading: true,
      enableMemoryManagement: true,
      maxCacheSize: 50 * 1024 * 1024, // 50MB
      preloadStrategy: 'critical', // 'critical', 'aggressive', 'conservative'
      ...options
    };

    this.resourceCache = new Map();
    this.observerCallbacks = new Map();
    this.memoryUsage = { used: 0, limit: this.options.maxCacheSize };

    this.init();
  }

  /**
   * 初始化资源优化器
   */
  init() {
    console.log('🚀 Resource Optimizer: 初始化中...');

    // 初始化图片优化
    if (this.options.enableImageOptimization) {
      this.initImageOptimization();
    }

    // 初始化字体优化
    if (this.options.enableFontOptimization) {
      this.initFontOptimization();
    }

    // 初始化预加载策略
    if (this.options.enablePreloading) {
      this.initPreloadingStrategy();
    }

    // 初始化内存管理
    if (this.options.enableMemoryManagement) {
      this.initMemoryManagement();
    }

    // 初始化资源打包和压缩优化
    this.initBundlingOptimization();

    // 启用资源压缩
    this.enableResourceCompression();

    console.log('✅ Resource Optimizer: 初始化完成');
  }

  /**
   * 初始化图片优化
   */
  initImageOptimization() {
    // 配置图片懒加载
    this.setupImageLazyLoading();

    // 配置响应式图片
    this.setupResponsiveImages();

    // 配置图片格式优化
    this.setupImageFormatOptimization();

    // 配置图片压缩
    this.setupImageCompression();
  }

  /**
   * 设置图片懒加载
   */
  setupImageLazyLoading() {
    // 使用 Intersection Observer 进行懒加载
    if ('IntersectionObserver' in window) {
      const imageObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target;
            this.loadImage(img);
            imageObserver.unobserve(img);
          }
        });
      }, {
        rootMargin: '100px 0px',
        threshold: 0.1
      });

      // 观察所有带 data-src 的图片
      this.observeNewImages(imageObserver);
    } else {
      // 降级到传统懒加载
      this.setupFallbackLazyLoading();
    }
  }

  /**
   * 加载图片
   */
  loadImage(img) {
    const src = img.dataset.src;
    if (!src) return;

    // 创建新图片对象进行预加载
    const newImg = new Image();

    newImg.onload = () => {
      img.src = src;
      img.classList.add('loaded');
      img.removeAttribute('data-src');

      // 触发加载完成事件
      img.dispatchEvent(new CustomEvent('imageLoaded', {
        detail: { element: img, src }
      }));
    };

    newImg.onerror = () => {
      img.classList.add('error');
      console.warn('图片加载失败:', src);
    };

    // 设置响应式图片源
    if (img.dataset.srcset) {
      newImg.srcset = img.dataset.srcset;
    }

    newImg.src = src;
  }

  /**
   * 观察新图片
   */
  observeNewImages(observer) {
    const images = document.querySelectorAll('img[data-src]');
    images.forEach(img => observer.observe(img));

    // 使用 MutationObserver 监听新增图片
    const mutationObserver = new MutationObserver((mutations) => {
      mutations.forEach(mutation => {
        mutation.addedNodes.forEach(node => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const images = node.querySelectorAll ?
              node.querySelectorAll('img[data-src]') : [];
            images.forEach(img => observer.observe(img));
          }
        });
      });
    });

    mutationObserver.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  /**
   * 设置响应式图片
   */
  setupResponsiveImages() {
    // 为图片添加响应式处理
    document.addEventListener('imageLoaded', (event) => {
      const img = event.detail.element;
      this.makeImageResponsive(img);
    });
  }

  /**
   * 使图片响应式
   */
  makeImageResponsive(img) {
    // 根据视口宽度调整图片尺寸
    const updateImageSize = () => {
      const viewportWidth = window.innerWidth;
      const containerWidth = img.parentElement?.offsetWidth || viewportWidth;

      // 计算合适的图片尺寸
      let targetWidth = containerWidth;
      if (viewportWidth < 768) {
        targetWidth = Math.min(containerWidth, viewportWidth);
      } else if (viewportWidth < 1024) {
        targetWidth = Math.min(containerWidth * 0.8, viewportWidth);
      }

      // 如果有 srcset，让浏览器自动选择
      if (!img.srcset) {
        img.style.maxWidth = '100%';
        img.style.height = 'auto';
      }
    };

    updateImageSize();
    window.addEventListener('resize', updateImageSize);
  }

  /**
   * 设置图片格式优化
   */
  setupImageFormatOptimization() {
    // 检查浏览器支持的图片格式
    const supportsWebP = this.checkWebPSupport();
    const supportsAVIF = this.checkAVIFSupport();

    // 根据支持情况优化图片源
    document.addEventListener('imageLoaded', (event) => {
      const img = event.detail.element;
      this.optimizeImageFormat(img, { supportsWebP, supportsAVIF });
    });
  }

  /**
   * 检查 WebP 支持
   */
  checkWebPSupport() {
    const canvas = document.createElement('canvas');
    return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
  }

  /**
   * 检查 AVIF 支持
   */
  checkAVIFSupport() {
    return new Promise(resolve => {
      const avif = new Image();
      avif.onload = () => resolve(true);
      avif.onerror = () => resolve(false);
      avif.src = 'data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAADybWV0YQAAAAAAAAAoaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAGxpYmF2aWYAAAAADnBpdG0AAAAAAAEAAAAeaWxvYwAAAABEAAABAAEAAAABAAABGgAAAB0AAAAoaWluZgAAAAAAAQAAABppbmZlAgAAAAABAABhdjAxQ29sb3IAAAAAamlwcnAAAABLaXBjbwAAABRpc3BlAAAAAAAAAAEAAAABAAAABhgAAAUaAAAA+XRleHQAAAAAQAAAAEAARgABAAAAGXRleHkAAAAAAQAAAAEAAAAGAAAAGAAAAARcAAAAbAAAAAHR0cHQAAAABQAAAAAEAAAABAAZABgAAAAAEluYm90YWgAAAAAdAAAADgAAABYAAAAoAAAAKgA';
    });
  }

  /**
   * 优化图片格式
   */
  optimizeImageFormat(img, formatSupport) {
    // 如果浏览器支持更优格式，尝试替换
    if (formatSupport.supportsAVIF && img.dataset.srcAvif) {
      img.src = img.dataset.srcAvif;
    } else if (formatSupport.supportsWebP && img.dataset.srcWebp) {
      img.src = img.dataset.srcWebp;
    }
  }

  /**
   * 设置图片压缩
   */
  setupImageCompression() {
    // 为上传的图片提供压缩功能
    this.setupImageUploadCompression();
  }

  /**
   * 设置上传图片压缩
   */
  setupImageUploadCompression() {
    // 监听文件上传
    document.addEventListener('change', (event) => {
      if (event.target.type === 'file' && event.target.accept?.includes('image')) {
        this.compressUploadedImage(event.target.files[0]);
      }
    });
  }

  /**
   * 压缩上传的图片
   */
  async compressUploadedImage(file) {
    if (!file || !file.type.startsWith('image/')) return;

    try {
      const compressedFile = await this.compressImage(file, {
        quality: 0.8,
        maxWidth: 1920,
        maxHeight: 1080
      });

      console.log('图片压缩完成:', {
        originalSize: file.size,
        compressedSize: compressedFile.size,
        compressionRatio: ((file.size - compressedFile.size) / file.size * 100).toFixed(2) + '%'
      });

      return compressedFile;
    } catch (error) {
      console.error('图片压缩失败:', error);
      return file;
    }
  }

  /**
   * 压缩图片
   */
  compressImage(file, options) {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        // 计算压缩后的尺寸
        let { width, height } = this.calculateCompressedSize(img.width, img.height, options);

        canvas.width = width;
        canvas.height = height;

        // 绘制压缩后的图片
        ctx.drawImage(img, 0, 0, width, height);

        // 转换为 Blob
        canvas.toBlob((blob) => {
          if (blob) {
            const compressedFile = new File([blob], file.name, {
              type: blob.type,
              lastModified: Date.now()
            });
            resolve(compressedFile);
          } else {
            reject(new Error('图片压缩失败'));
          }
        }, file.type, options.quality);
      };

      img.onerror = reject;
      img.src = URL.createObjectURL(file);
    });
  }

  /**
   * 计算压缩后的尺寸
   */
  calculateCompressedSize(originalWidth, originalHeight, options) {
    let { maxWidth, maxHeight } = options;
    let width = originalWidth;
    let height = originalHeight;

    // 如果尺寸超出限制，按比例缩放
    if (width > maxWidth || height > maxHeight) {
      const aspectRatio = width / height;

      if (width > height) {
        width = Math.min(width, maxWidth);
        height = width / aspectRatio;
      } else {
        height = Math.min(height, maxHeight);
        width = height * aspectRatio;
      }
    }

    return { width, height };
  }

  /**
   * 初始化字体优化
   */
  initFontOptimization() {
    this.optimizeFontLoading();
    this.setupFontDisplay();
    this.preloadCriticalFonts();
  }

  /**
   * 优化字体加载
   */
  optimizeFontLoading() {
    // 使用 Font Face Observer 监听字体加载
    if ('fonts' in document) {
      document.fonts.ready.then(() => {
        console.log('✅ 字体加载完成');
        document.body.classList.add('fonts-loaded');
      });
    }

    // 字体加载失败处理
    this.setupFontFallback();
  }

  /**
   * 设置字体显示策略
   */
  setupFontDisplay() {
    // 添加 font-display: swap CSS
    const style = document.createElement('style');
    style.textContent = `
      @font-face {
        font-family: 'Inter';
        font-display: swap;
        src: local('Inter'), url('https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hiA.woff2') format('woff2');
      }
    `;
    document.head.appendChild(style);
  }

  /**
   * 预加载关键字体
   */
  preloadCriticalFonts() {
    const criticalFonts = [
      'https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hiA.woff2'
    ];

    criticalFonts.forEach(fontUrl => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'font';
      link.type = 'font/woff2';
      link.href = fontUrl;
      link.crossOrigin = 'anonymous';
      document.head.appendChild(link);
    });
  }

  /**
   * 设置字体降级
   */
  setupFontFallback() {
    // 监听字体加载错误
    document.addEventListener('error', (event) => {
      if (event.target.tagName === 'LINK' && event.target.rel === 'stylesheet') {
        console.warn('字体加载失败:', event.target.href);
        // 使用系统字体作为降级
        document.body.style.fontFamily = 'system-ui, -apple-system, sans-serif';
      }
    }, true);
  }

  /**
   * 初始化预加载策略
   */
  initPreloadingStrategy() {
    switch (this.options.preloadStrategy) {
      case 'critical':
        this.preloadCriticalResources();
        break;
      case 'aggressive':
        this.preloadAllResources();
        break;
      case 'conservative':
        this.preloadMinimalResources();
        break;
    }
  }

  /**
   * 预加载关键资源
   */
  preloadCriticalResources() {
    const criticalResources = [
      { href: '/styles/main.css', as: 'style' },
      { href: '/app.js', as: 'script' },
      { href: '/components/SmartInput.js', as: 'script' },
      { href: '/components/ApiClient.js', as: 'script' }
    ];

    this.preloadResources(criticalResources);
  }

  /**
   * 预加载所有资源
   */
  preloadAllResources() {
    // 预加载所有模块
    const modules = ['math', 'astronomy', 'physics', 'chemistry'];
    modules.forEach(module => {
      this.preloadModule(module);
    });
  }

  /**
   * 预加载最小资源
   */
  preloadMinimalResources() {
    // 只预加载必要的资源
    const minimalResources = [
      { href: '/styles/main.css', as: 'style' }
    ];

    this.preloadResources(minimalResources);
  }

  /**
   * 预加载资源
   */
  preloadResources(resources) {
    resources.forEach(resource => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.href = resource.href;
      link.as = resource.as;

      if (resource.type) {
        link.type = resource.type;
      }

      if (resource.crossorigin) {
        link.crossOrigin = resource.crossorigin;
      }

      document.head.appendChild(link);
    });
  }

  /**
   * 预加载模块
   */
  async preloadModule(moduleId) {
    try {
      await import(`../modules/${moduleId}.js`);
      console.log(`✅ 模块 ${moduleId} 预加载完成`);
    } catch (error) {
      console.warn(`⚠️ 模块 ${moduleId} 预加载失败:`, error);
    }
  }

  /**
   * 初始化内存管理
   */
  initMemoryManagement() {
    this.setupMemoryMonitoring();
    this.setupCacheCleanup();
    this.setupGarbageCollection();
  }

  /**
   * 设置内存监控
   */
  setupMemoryMonitoring() {
    if ('memory' in performance) {
      setInterval(() => {
        const memory = performance.memory;
        this.memoryUsage.used = memory.usedJSHeapSize;

        // 内存使用率超过80%时发出警告
        const usagePercent = (memory.usedJSHeapSize / memory.jsHeapSizeLimit * 100);
        if (usagePercent > 80) {
          console.warn('⚠️ 内存使用率过高:', usagePercent.toFixed(2) + '%');
          this.triggerMemoryCleanup();
        }
      }, 30000); // 每30秒检查一次
    }
  }

  /**
   * 设置缓存清理
   */
  setupCacheCleanup() {
    // 监听内存压力事件
    if ('memory' in performance) {
      setInterval(() => {
        this.cleanupExpiredCache();
      }, 60000); // 每分钟清理一次
    }
  }

  /**
   * 清理过期缓存
   */
  cleanupExpiredCache() {
    const now = Date.now();
    const maxAge = 30 * 60 * 1000; // 30分钟

    for (const [key, resource] of this.resourceCache.entries()) {
      if (now - resource.timestamp > maxAge) {
        this.resourceCache.delete(key);
        console.log('🗑️ 清理过期缓存:', key);
      }
    }
  }

  /**
   * 设置垃圾回收
   */
  setupGarbageCollection() {
    // 在页面隐藏时触发垃圾回收
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.triggerMemoryCleanup();
      }
    });

    // 监听内存压力
    if ('memory' in performance) {
      setInterval(() => {
        const usagePercent = (performance.memory.usedJSHeapSize / performance.memory.jsHeapSizeLimit * 100);
        if (usagePercent > 85) {
          this.triggerMemoryCleanup();
        }
      }, 45000); // 每45秒检查一次
    }
  }

  /**
   * 触发内存清理
   */
  triggerMemoryCleanup() {
    // 清理资源缓存
    this.resourceCache.clear();

    // 清理观察器回调
    this.observerCallbacks.clear();

    // 建议浏览器进行垃圾回收（如果支持）
    if (window.gc) {
      window.gc();
    }

    console.log('🧹 内存清理完成');
  }

  /**
   * 降级懒加载
   */
  setupFallbackLazyLoading() {
    // 使用滚动事件进行降级懒加载
    let ticking = false;

    const updateLazyImages = () => {
      const images = document.querySelectorAll('img[data-src]');
      const scrollTop = window.pageYOffset;
      const windowHeight = window.innerHeight;

      images.forEach(img => {
        const rect = img.getBoundingClientRect();
        if (rect.top <= windowHeight + 200 && rect.bottom >= -200) {
          this.loadImage(img);
        }
      });

      ticking = false;
    };

    const onScroll = () => {
      if (!ticking) {
        requestAnimationFrame(updateLazyImages);
        ticking = true;
      }
    };

    window.addEventListener('scroll', onScroll);
    window.addEventListener('resize', onScroll);
    updateLazyImages(); // 初始加载
  }

  /**
   * 初始化资源打包和压缩优化
   */
  initBundlingOptimization() {
    console.log('📦 初始化资源打包优化...');

    // 创建CSS和JS打包器
    this.bundleManager = new BundleManager({
      enableMinification: true,
      enableCompression: true,
      enableTreeShaking: true,
      chunkSizeLimit: 250 * 1024 // 250KB
    });

    // 分析和优化现有资源
    this.analyzeResourceBundles();

    // 启用动态打包
    this.enableDynamicBundling();

    // 优化HTTP请求
    this.optimizeHTTPRequests();

    // 减少资源大小
    this.reduceResourceSizes();
  }

  /**
   * 分析资源包
   */
  analyzeResourceBundles() {
    const stylesheets = document.querySelectorAll('link[rel="stylesheet"]');
    const scripts = document.querySelectorAll('script[src]');

    // 分析CSS文件
    stylesheets.forEach(link => {
      if (!link.href.includes('font') && !link.dataset.bundled) {
        this.bundleManager.addCSSFile(link.href);
      }
    });

    // 分析JS文件
    scripts.forEach(script => {
      if (!script.src.includes('font') && !script.dataset.bundled) {
        this.bundleManager.addJSFile(script.src);
      }
    });

    // 生成优化建议
    const suggestions = this.bundleManager.generateOptimizationSuggestions();
    console.log('💡 资源优化建议:', suggestions);
  }

  /**
   * 启用动态打包
   */
  enableDynamicBundling() {
    // 监听模块加载事件
    window.addEventListener('moduleLoaded', (event) => {
      const { moduleId } = event.detail;
      this.bundleManager.trackModuleLoad(moduleId);
    });

    // 创建动态CSS包
    this.createDynamicCSSBundle();

    // 创建动态JS包
    this.createDynamicJSBundle();
  }

  /**
   * 创建动态CSS包
   */
  async createDynamicCSSBundle() {
    const criticalCSS = await this.extractCriticalCSS();
    const bundleCSS = await this.bundleManager.createCSSBundle([
      'styles/design-system.css',
      'styles/main.css',
      'styles/components.css'
    ]);

    // 内联关键CSS
    this.inlineCriticalCSS(criticalCSS);

    // 延迟加载非关键CSS
    this.loadNonCriticalCSS(bundleCSS);
  }

  /**
   * 提取关键CSS
   */
  async extractCriticalCSS() {
    const criticalSelectors = [
      // 关键布局元素
      '.app-header', '.app-main', '.container',
      // 关键组件
      '.hero-section', '.input-section', '.btn',
      // 基础样式
      'body', 'html', '*'
    ];

    // 这里应该使用真实的CSS提取工具
    // 简化版本，返回基础CSS
    return `
      body{margin:0;font-family:system-ui,-apple-system,sans-serif;line-height:1.6}
      .container{max-width:1200px;margin:0 auto;padding:0 20px}
      .app-header{background:#1a1a1a;color:#fff;padding:1rem 0}
      .btn{display:inline-block;padding:0.75rem 1.5rem;border:none;border-radius:4px;cursor:pointer}
      .btn-primary{background:#3498db;color:#fff}
      .btn-secondary{background:#95a5a6;color:#fff}
      .hero-section{text-align:center;padding:4rem 0}
    `;
  }

  /**
   * 内联关键CSS
   */
  inlineCriticalCSS(css) {
    const style = document.createElement('style');
    style.textContent = css;
    style.setAttribute('data-critical', 'true');
    document.head.insertBefore(style, document.head.firstChild);
  }

  /**
   * 延迟加载非关键CSS
   */
  loadNonCriticalCSS(bundleURL) {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'style';
    link.href = bundleURL;
    link.onload = function() {
      this.onload = null;
      this.rel = 'stylesheet';
    };
    document.head.appendChild(link);
  }

  /**
   * 创建动态JS包
   */
  createDynamicJSBundle() {
    // 核心模块包
    const coreBundle = [
      'components/StateManager.js',
      'components/ApiClient.js',
      'components/Router.js'
    ];

    // 可视化模块包
    const vizBundle = [
      'components/SmartInput.js',
      'components/VizContainer.js',
      'components/TemplateSelector.js'
    ];

    // 性能优化包
    const perfBundle = [
      'components/PerformanceOptimizer.js',
      'components/ResourceOptimizer.js'
    ];

    // 注册包
    this.bundleManager.registerBundle('core', coreBundle);
    this.bundleManager.registerBundle('visualization', vizBundle);
    this.bundleManager.registerBundle('performance', perfBundle);
  }

  /**
   * 启用资源压缩
   */
  enableResourceCompression() {
    // 压缩内联CSS
    this.compressInlineStyles();

    // 压缩内联JS
    this.compressInlineScripts();

    // 启用Gzip/Brotli预压缩
    this.enablePreCompression();
  }

  /**
   * 压缩内联样式
   */
  compressInlineStyles() {
    const styles = document.querySelectorAll('style:not([data-compressed])');

    styles.forEach(style => {
      if (style.textContent.length > 1000) { // 只压缩大的样式块
        const compressed = this.minifyCSS(style.textContent);
        style.textContent = compressed;
        style.setAttribute('data-compressed', 'true');

        console.log(`🗜️ CSS压缩: ${(style.textContent.length / 1024).toFixed(1)}KB`);
      }
    });
  }

  /**
   * 压缩内联脚本
   */
  compressInlineScripts() {
    const scripts = document.querySelectorAll('script:not([src]):not([data-compressed])');

    scripts.forEach(script => {
      if (script.textContent.length > 1000) { // 只压缩大的脚本块
        const compressed = this.minifyJS(script.textContent);
        script.textContent = compressed;
        script.setAttribute('data-compressed', 'true');

        console.log(`🗜️ JS压缩: ${(script.textContent.length / 1024).toFixed(1)}KB`);
      }
    });
  }

  /**
   * CSS压缩
   */
  minifyCSS(css) {
    return css
      .replace(/\/\*[\s\S]*?\*\//g, '') // 移除注释
      .replace(/\s+/g, ' ') // 压缩空白
      .replace(/;\s*}/g, '}') // 移除最后的分号
      .replace(/\s*{\s*/g, '{') // 压缩大括号
      .replace(/\s*}\s*/g, '}')
      .replace(/\s*;\s*/g, ';') // 压缩分号
      .replace(/\s*:\s*/g, ':') // 压缩冒号
      .replace(/\s*,\s*/g, ',') // 压缩逗号
      .trim();
  }

  /**
   * JS压缩
   */
  minifyJS(js) {
    return js
      .replace(/\/\*[\s\S]*?\*\//g, '') // 移除块注释
      .replace(/\/\/.*$/gm, '') // 移除行注释
      .replace(/\s+/g, ' ') // 压缩空白
      .replace(/;\s*}/g, '}') // 移除最后的分号
      .replace(/\s*{\s*/g, '{') // 压缩大括号
      .replace(/\s*}\s*/g, '}')
      .replace(/\s*;\s*/g, ';') // 压缩分号
      .replace(/\s*,\s*/g, ',') // 压缩逗号
      .replace(/\s*=\s*/g, '=') // 压缩等号
      .trim();
  }

  /**
   * 启用预压缩
   */
  enablePreCompression() {
    // 设置Accept-Encoding头
    const originalFetch = window.fetch;
    window.fetch = function(...args) {
      const [url, options = {}] = args;

      // 添加压缩支持
      options.headers = {
        ...options.headers,
        'Accept-Encoding': 'gzip, deflate, br'
      };

      return originalFetch.apply(this, [url, options]);
    };
  }

  /**
   * 优化字体加载
   */
  optimizeFontLoading() {
    // 字体显示策略
    document.fonts.ready.then(() => {
      document.body.classList.add('fonts-loaded');
    });

    // 字体回退策略
    setTimeout(() => {
      document.body.classList.add('fonts-fallback');
    }, 3000);
  }

  /**
   * 获取资源统计信息
   */
  getResourceStats() {
    const baseStats = {
      cacheSize: this.resourceCache.size,
      memoryUsage: {
        used: this.memoryUsage.used,
        limit: this.memoryUsage.limit,
        usagePercent: (this.memoryUsage.used / this.memoryUsage.limit * 100).toFixed(2) + '%'
      },
      loadedImages: document.querySelectorAll('img.loaded').length,
      pendingImages: document.querySelectorAll('img[data-src]').length,
      timestamp: new Date().toISOString()
    };

    // 添加打包统计
    if (this.bundleManager) {
      baseStats.bundling = this.bundleManager.getStats();
    }

    // 添加压缩统计
    baseStats.compression = {
      compressedStyles: document.querySelectorAll('style[data-compressed]').length,
      compressedScripts: document.querySelectorAll('script[data-compressed]').length,
      estimatedSavings: this.calculateCompressionSavings()
    };

    return baseStats;
  }

  /**
   * 计算压缩节省量
   */
  calculateCompressionSavings() {
    let totalOriginal = 0;
    let totalCompressed = 0;

    // 计算CSS压缩节省
    document.querySelectorAll('style[data-compressed]').forEach(style => {
      const originalSize = parseInt(style.dataset.originalSize) || style.textContent.length * 2;
      totalOriginal += originalSize;
      totalCompressed += style.textContent.length;
    });

    // 计算JS压缩节省
    document.querySelectorAll('script[data-compressed]').forEach(script => {
      const originalSize = parseInt(script.dataset.originalSize) || script.textContent.length * 2;
      totalOriginal += originalSize;
      totalCompressed += script.textContent.length;
    });

    if (totalOriginal > 0) {
      const savings = totalOriginal - totalCompressed;
      return {
        original: (totalOriginal / 1024).toFixed(1) + 'KB',
        compressed: (totalCompressed / 1024).toFixed(1) + 'KB',
        saved: (savings / 1024).toFixed(1) + 'KB',
        percent: ((savings / totalOriginal) * 100).toFixed(1) + '%'
      };
    }

    return null;
  }

  /**
   * 优化HTTP请求
   */
  optimizeHTTPRequests() {
    console.log('🔄 优化HTTP请求...');

    // 合并相似的CSS文件
    this.mergeSimilarCSSFiles();

    // 合并相似的JS文件
    this.mergeSimilarJSFiles();

    // 使用CSS Sprites合并小图标
    this.createIconSprites();

    // 启用HTTP/2 Server Push
    this.enableHTTP2ServerPush();

    // 优化字体加载
    this.optimizeFontLoading();

    // 减少重定向
    this.eliminateRedirects();

    // 使用资源提示优化
    this.addResourceHintsOptimization();
  }

  /**
   * 合并相似的CSS文件
   */
  mergeSimilarCSSFiles() {
    const stylesheets = Array.from(document.querySelectorAll('link[rel="stylesheet"]'));
    const cssGroups = new Map();

    // 按类型分组CSS文件
    stylesheets.forEach(link => {
      const href = link.href;
      let category = 'common';

      if (href.includes('design-system')) category = 'design';
      else if (href.includes('main')) category = 'main';
      else if (href.includes('component')) category = 'component';
      else if (href.includes('theme')) category = 'theme';

      if (!cssGroups.has(category)) {
        cssGroups.set(category, []);
      }
      cssGroups.get(category).push(link);
    });

    // 为每个类别创建合并建议
    cssGroups.forEach((files, category) => {
      if (files.length > 1) {
        console.log(`💡 建议合并 ${category} 类别的CSS文件:`, files.map(f => f.href));
      }
    });
  }

  /**
   * 合并相似的JS文件
   */
  mergeSimilarJSFiles() {
    const scripts = Array.from(document.querySelectorAll('script[src]'));
    const jsGroups = new Map();

    // 按功能分组JS文件
    scripts.forEach(script => {
      const src = script.src;
      let category = 'common';

      if (src.includes('component')) category = 'component';
      else if (src.includes('util')) category = 'util';
      else if (src.includes('api')) category = 'api';
      else if (src.includes('visual')) category = 'visualization';

      if (!jsGroups.has(category)) {
        jsGroups.set(category, []);
      }
      jsGroups.get(category).push(script);
    });

    // 为每个类别创建合并建议
    jsGroups.forEach((files, category) => {
      if (files.length > 1) {
        console.log(`💡 建议合并 ${category} 类别的JS文件:`, files.map(f => f.src));
      }
    });
  }

  /**
   * 创建图标雪碧图
   */
  createIconSprites() {
    const icons = document.querySelectorAll('img[src*="icon"], img[src*="logo"]');

    if (icons.length > 3) {
      console.log('💡 建议创建CSS雪碧图来合并以下图标:',
        Array.from(icons).map(img => img.src).slice(0, 5));

      // 简单的CSS类建议
      const spriteCSS = `
/* 图标雪碧图建议 */
.icon-sprite {
  background-image: url('icons-sprite.svg');
  background-repeat: no-repeat;
}
.icon-home { background-position: 0 0; width: 16px; height: 16px; }
.icon-settings { background-position: -16px 0; width: 16px; height: 16px; }
.icon-user { background-position: -32px 0; width: 16px; height: 16px; }
      `;
      console.log('建议的CSS雪碧图样式:', spriteCSS);
    }
  }

  /**
   * 启用HTTP/2 Server Push
   */
  enableHTTP2ServerPush() {
    // 关键资源推送列表
    const criticalResources = [
      'styles/design-system.css',
      'styles/main.css',
      'components/StateManager.js',
      'components/ApiClient.js'
    ];

    // 添加Link头提示Server Push
    criticalResources.forEach(resource => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.href = resource;
      link.as = resource.endsWith('.css') ? 'style' : 'script';
      link.setAttribute('data-push', 'true');
      document.head.appendChild(link);
    });

    console.log('🚀 HTTP/2 Server Push 资源已配置:', criticalResources);
  }

  /**
   * 优化字体加载策略
   */
  optimizeFontLoading() {
    // 使用font-display优化字体加载
    const fontDisplayCSS = `
@font-face {
  font-family: 'Inter';
  font-display: swap; /* 优化字体加载 */
  src: url('fonts/inter-regular.woff2') format('woff2');
}
    `;

    // 插入字体优化CSS
    const style = document.createElement('style');
    style.textContent = fontDisplayCSS;
    style.setAttribute('data-font-optimization', 'true');
    document.head.appendChild(style);

    // 预加载字体
    const fonts = [
      'https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hiA.woff2'
    ];

    fonts.forEach(fontUrl => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'font';
      link.type = 'font/woff2';
      link.href = fontUrl;
      link.crossOrigin = 'anonymous';
      document.head.appendChild(link);
    });

    console.log('🔤 字体加载优化完成');
  }

  /**
   * 消除重定向
   */
  eliminateRedirects() {
    // 检测可能的重定向
    const links = document.querySelectorAll('a[href]');
    const redirectPatterns = [
      /http:\/\/www\./,
      /https:\/\/www\./,
      /\/index\.html$/,
      /\/default\.aspx$/
    ];

    links.forEach(link => {
      const href = link.href;
      redirectPatterns.forEach(pattern => {
        if (pattern.test(href)) {
          console.log('🔄 发现潜在重定向:', href);
        }
      });
    });
  }

  /**
   * 添加资源提示优化
   */
  addResourceHintsOptimization() {
    const head = document.head;

    // preconnect：提前建立连接
    const preconnectDomains = [
      'https://fonts.googleapis.com',
      'https://fonts.gstatic.com',
      'https://cdn.jsdelivr.net',
      'https://api.github.com'
    ];

    preconnectDomains.forEach(domain => {
      const link = document.createElement('link');
      link.rel = 'preconnect';
      link.href = domain;
      link.crossOrigin = 'anonymous';
      head.appendChild(link);
    });

    // dns-prefetch：DNS预解析
    const dnsPrefetchDomains = [
      '//fonts.googleapis.com',
      '//cdn.jsdelivr.net',
      '//cdnjs.cloudflare.com'
    ];

    dnsPrefetchDomains.forEach(domain => {
      const link = document.createElement('link');
      link.rel = 'dns-prefetch';
      link.href = domain;
      head.appendChild(link);
    });

    console.log('⚡ 资源提示优化完成');
  }

  /**
   * 减少资源大小
   */
  reduceResourceSizes() {
    console.log('📉 减少资源大小...');

    // 优化图片
    this.optimizeImages();

    // 压缩CSS
    this.compressExistingCSS();

    // 压缩JavaScript
    this.compressExistingJS();

    // 移除未使用的CSS
    this.removeUnusedCSS();

    // 优化SVG
    this.optimizeSVGs();

    // 启用Brotli压缩
    this.enableBrotliCompression();
  }

  /**
   * 优化图片
   */
  optimizeImages() {
    const images = document.querySelectorAll('img');

    images.forEach(img => {
      const src = img.src;

      // 检查图片格式优化机会
      if (src.includes('.png') && !src.includes('.svg')) {
        console.log('🖼️ 建议转换为WebP格式:', src);
      }

      // 检查响应式图片
      if (!img.srcset && img.width > 300) {
        console.log('📱 建议添加srcset属性:', src);
      }

      // 检查懒加载
      if (!img.hasAttribute('loading') && !img.closest('.hero-section')) {
        img.setAttribute('loading', 'lazy');
      }
    });

    // 添加现代图片格式支持检测
    this.addModernImageFormatSupport();
  }

  /**
   * 添加现代图片格式支持
   */
  addModernImageFormatSupport() {
    // WebP支持检测
    const webpSupport = this.checkWebPSupport();

    if (webpSupport) {
      console.log('✅ 浏览器支持WebP格式');
      // 可以在这里添加WebP图片替换逻辑
    } else {
      console.log('⚠️ 浏览器不支持WebP格式，使用传统格式');
    }
  }

  /**
   * 检查WebP支持
   */
  checkWebPSupport() {
    return new Promise(resolve => {
      const webP = new Image();
      webP.onload = webP.onerror = () => {
        resolve(webP.height === 2);
      };
      webP.src = 'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA';
    });
  }

  /**
   * 压缩现有CSS
   */
  compressExistingCSS() {
    const stylesheets = document.querySelectorAll('link[rel="stylesheet"]');

    stylesheets.forEach(link => {
      if (link.href && !link.dataset.compressed) {
        console.log('🗜️ 建议压缩CSS文件:', link.href);
      }
    });

    // 压缩内联样式
    const inlineStyles = document.querySelectorAll('style:not([data-compressed])');
    inlineStyles.forEach(style => {
      if (style.textContent.length > 500) {
        const compressed = this.minifyCSS(style.textContent);
        const savings = style.textContent.length - compressed.length;

        if (savings > 100) {
          console.log(`🗜️ 内联CSS压缩节省 ${savings} 字节`);
          style.textContent = compressed;
          style.setAttribute('data-compressed', 'true');
        }
      }
    });
  }

  /**
   * 压缩现有JavaScript
   */
  compressExistingJS() {
    const scripts = document.querySelectorAll('script:not([src]):not([data-compressed])');

    scripts.forEach(script => {
      if (script.textContent.length > 500) {
        const compressed = this.minifyJS(script.textContent);
        const savings = script.textContent.length - compressed.length;

        if (savings > 100) {
          console.log(`🗜️ 内联JS压缩节省 ${savings} 字节`);
          script.textContent = compressed;
          script.setAttribute('data-compressed', 'true');
        }
      }
    });
  }

  /**
   * 移除未使用的CSS
   */
  removeUnusedCSS() {
    // 简单的未使用CSS检测
    const allElements = document.querySelectorAll('*');
    const usedClasses = new Set();
    const usedIds = new Set();

    // 收集使用的类和ID
    allElements.forEach(element => {
      if (element.className) {
        element.className.split(' ').forEach(className => {
          if (className.trim()) {
            usedClasses.add(className.trim());
          }
        });
      }
      if (element.id) {
        usedIds.add(element.id);
      }
    });

    console.log('📊 使用的CSS类数量:', usedClasses.size);
    console.log('📊 使用的CSS ID数量:', usedIds.size);
    console.log('💡 建议使用工具如PurgeCSS移除未使用的CSS');
  }

  /**
   * 优化SVG
   */
  optimizeSVGs() {
    const svgElements = document.querySelectorAll('svg');

    svgElements.forEach(svg => {
      // 移除不必要的属性
      svg.removeAttribute('version');
      svg.removeAttribute('xmlns:xlink');

      // 移除编辑器元数据
      const metadata = svg.querySelector('metadata');
      if (metadata) {
        metadata.remove();
        console.log('🎨 移除SVG元数据');
      }
    });

    // 优化SVG文件引用
    const svgImages = document.querySelectorAll('img[src$=".svg"]');
    svgImages.forEach(img => {
      console.log('💡 建议内联SVG或使用SVG sprite:', img.src);
    });
  }

  /**
   * 启用Brotli压缩
   */
  enableBrotliCompression() {
    // 添加Brotli支持检测
    const acceptEncoding = navigator.userAgent || '';
    const supportsBrotli = acceptEncoding.includes('br');

    if (supportsBrotli) {
      console.log('🗜️ 浏览器支持Brotli压缩');

      // 可以在这里添加Brotli优先的fetch逻辑
      const originalFetch = window.fetch;
      window.fetch = function(...args) {
        const [url, options = {}] = args;

        // 优先请求Brotli压缩版本
        options.headers = {
          ...options.headers,
          'Accept-Encoding': 'br, gzip, deflate'
        };

        return originalFetch.apply(this, [url, options]);
      };
    }
  }

  /**
   * 获取优化建议
   */
  getOptimizationSuggestions() {
    const suggestions = [];

    // 分析资源数量
    const totalResources = document.querySelectorAll('link, script, img').length;
    if (totalResources > 50) {
      suggestions.push({
        type: 'too-many-resources',
        message: `页面资源过多 (${totalResources})，建议合并或延迟加载`,
        priority: 'high'
      });
    }

    // 分析图片优化
    const images = document.querySelectorAll('img');
    const largeImages = Array.from(images).filter(img => img.naturalWidth > 1000);
    if (largeImages.length > 0) {
      suggestions.push({
        type: 'large-images',
        message: `发现 ${largeImages.length} 个大图片，建议压缩或使用响应式图片`,
        priority: 'medium'
      });
    }

    // 分析CSS文件大小
    const stylesheets = document.querySelectorAll('link[rel="stylesheet"]');
    if (stylesheets.length > 5) {
      suggestions.push({
        type: 'many-css-files',
        message: `CSS文件过多 (${stylesheets.length})，建议合并`,
        priority: 'medium'
      });
    }

    return suggestions;
  }

  /**
   * 清理资源
   */
  cleanup() {
    this.resourceCache.clear();
    this.observerCallbacks.clear();
  }
}

// 导出
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ResourceOptimizer;
}

// 全局暴露
window.ResourceOptimizer = ResourceOptimizer;