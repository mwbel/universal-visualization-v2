/**
 * 图片和资源加载优化系统
 * 任务3.2.1 - 前端性能优化核心组件
 * 目标: 资源加载时间 < 500ms，压缩率 > 70%，缓存命中率 > 80%
 */

class ResourceOptimizer {
    constructor(options = {}) {
        this.options = {
            // 图片优化
            images: {
                lazyLoading: true,
                lazyLoadingThreshold: 200, // px
                placeholder: true,
                placeholderQuality: 20,    // 低质量占位符
                responsiveBreakpoints: [320, 768, 1024, 1920],
                formats: ['webp', 'avif', 'jpg', 'png'],
                quality: {
                    webp: 80,
                    avif: 85,
                    jpg: 75,
                    png: 90
                },
                progressive: true,
                compression: true
            },
            // 资源预加载
            preloading: {
                enabled: true,
                criticalResources: [],
                prefetchResources: [],
                maxConcurrent: 6,
                priority: 'high'
            },
            // 缓存策略
            caching: {
                enabled: true,
                strategy: 'cacheFirst', // 'cacheFirst', 'networkFirst', 'staleWhileRevalidate'
                maxAge: 7 * 24 * 60 * 60 * 1000, // 7天
                maxSize: 100 * 1024 * 1024, // 100MB
                compressionEnabled: true
            },
            // 资源监控
            monitoring: {
                enabled: true,
                performanceThreshold: 2000, // 2秒
                errorTracking: true,
                analyticsEnabled: true
            },
            // 自适应加载
            adaptive: {
                enabled: true,
                networkAware: true,
                deviceDetection: true,
                batteryAware: true
            },
            ...options
        };

        // 资源注册表
        this.resources = new Map();
        this.loadedResources = new Map();
        this.failedResources = new Map();
        this.loadingResources = new Map();

        // 性能统计
        this.stats = {
            totalResources: 0,
            loadedResources: 0,
            failedResources: 0,
            totalSize: 0,
            compressedSize: 0,
            averageLoadTime: 0,
            cacheHitRate: 0,
            errorRate: 0,
            resourceTypes: {}
        };

        // 观察器
        this.lazyLoadObserver = null;
        this.preloadObserver = null;

        // 网络状态
        this.networkInfo = {
            effectiveType: '4g',
            downlink: 10,
            rtt: 100,
            saveData: false
        };

        this.init();
    }

    /**
     * 初始化资源优化器
     */
    init() {
        try {
            // 初始化网络监控
            this.initNetworkMonitoring();

            // 初始化懒加载
            if (this.options.images.lazyLoading) {
                this.initLazyLoading();
            }

            // 初始化预加载
            if (this.options.preloading.enabled) {
                this.initPreloading();
            }

            // 初始化缓存
            if (this.options.caching.enabled) {
                this.initCaching();
            }

            // 初始化性能监控
            if (this.options.monitoring.enabled) {
                this.initPerformanceMonitoring();
            }

            // 初始化自适应加载
            if (this.options.adaptive.enabled) {
                this.initAdaptiveLoading();
            }

            // 注册全局错误处理
            this.initErrorHandling();

            console.log('🚀 资源优化器初始化完成');
            console.log(`⚙️ 配置: 懒加载=${this.options.images.lazyLoading}, 缓存=${this.options.caching.strategy}`);

        } catch (error) {
            console.error('❌ 资源优化器初始化失败:', error);
        }
    }

    /**
     * 网络状态监控
     */
    initNetworkMonitoring() {
        if ('connection' in navigator) {
            const connection = navigator.connection;
            this.updateNetworkInfo(connection);

            connection.addEventListener('change', () => {
                this.updateNetworkInfo(connection);
                this.adaptToNetworkConditions();
            });
        }

        // 监听在线/离线状态
        window.addEventListener('online', () => {
            console.log('🌐 网络已连接');
            this.resumeLoading();
        });

        window.addEventListener('offline', () => {
            console.log('📵 网络已断开');
            this.pauseLoading();
        });
    }

    updateNetworkInfo(connection) {
        this.networkInfo = {
            effectiveType: connection.effectiveType || '4g',
            downlink: connection.downlink || 10,
            rtt: connection.rtt || 100,
            saveData: connection.saveData || false
        };

        console.log('📶 网络状态更新:', this.networkInfo);
    }

    /**
     * 懒加载初始化
     */
    initLazyLoading() {
        if ('IntersectionObserver' in window) {
            this.lazyLoadObserver = new IntersectionObserver(
                this.handleIntersection.bind(this),
                {
                    rootMargin: `${this.options.images.lazyLoadingThreshold}px`,
                    threshold: 0.1
                }
            );

            console.log('👁️ 懒加载观察器已启动');
        } else {
            console.warn('⚠️ 浏览器不支持IntersectionObserver，使用回退方案');
            this.initFallbackLazyLoading();
        }
    }

    handleIntersection(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const element = entry.target;
                this.loadResource(element);
                this.lazyLoadObserver.unobserve(element);
            }
        });
    }

    initFallbackLazyLoading() {
        // 使用滚动事件作为回退方案
        let ticking = false;

        const checkVisibility = () => {
            const elements = document.querySelectorAll('[data-lazy]');

            elements.forEach(element => {
                if (this.isElementInViewport(element)) {
                    this.loadResource(element);
                    element.removeAttribute('data-lazy');
                }
            });

            ticking = false;
        };

        window.addEventListener('scroll', () => {
            if (!ticking) {
                requestAnimationFrame(checkVisibility);
                ticking = true;
            }
        });
    }

    isElementInViewport(element) {
        const rect = element.getBoundingClientRect();
        const threshold = this.options.images.lazyLoadingThreshold;

        return (
            rect.top >= -threshold &&
            rect.left >= -threshold &&
            rect.bottom <= window.innerHeight + threshold &&
            rect.right <= window.innerWidth + threshold
        );
    }

    /**
     * 预加载初始化
     */
    initPreloading() {
        // 预加载关键资源
        if (this.options.preloading.criticalResources.length > 0) {
            this.preloadCriticalResources();
        }

        // 监听鼠标悬停预加载
        document.addEventListener('mouseover', this.handleHoverPreload.bind(this));

        // 监听触摸开始预加载
        document.addEventListener('touchstart', this.handleTouchPreload.bind(this));

        console.log('⚡ 预加载系统已启动');
    }

    preloadCriticalResources() {
        this.options.preloading.criticalResources.forEach(resource => {
            this.preloadResource(resource, 'critical');
        });
    }

    handleHoverPreload(event) {
        const link = event.target.closest('a[data-preload]');
        if (link) {
            const resourceUrl = link.dataset.preload;
            this.preloadResource(resourceUrl, 'hover');
        }
    }

    handleTouchPreload(event) {
        const link = event.target.closest('a[data-preload]');
        if (link) {
            const resourceUrl = link.dataset.preload;
            this.preloadResource(resourceUrl, 'touch');
        }
    }

    /**
     * 缓存初始化
     */
    initCaching() {
        if ('caches' in window) {
            caches.open('resource-cache-v1').then(cache => {
                this.cache = cache;
                console.log('💾 资源缓存已初始化');
            });
        } else {
            console.warn('⚠️ 浏览器不支持Cache API');
        }
    }

    /**
     * 性能监控初始化
     */
    initPerformanceMonitoring() {
        if ('PerformanceObserver' in window) {
            const observer = new PerformanceObserver((list) => {
                const entries = list.getEntries();
                entries.forEach(entry => {
                    this.analyzeResourcePerformance(entry);
                });
            });

            observer.observe({ entryTypes: ['resource', 'navigation'] });
        }
    }

    analyzeResourcePerformance(entry) {
        if (entry.transferSize > 0) {
            const resourceType = this.getResourceType(entry.name);

            // 更新类型统计
            if (!this.stats.resourceTypes[resourceType]) {
                this.stats.resourceTypes[resourceType] = {
                    count: 0,
                    size: 0,
                    loadTime: 0
                };
            }

            this.stats.resourceTypes[resourceType].count++;
            this.stats.resourceTypes[resourceType].size += entry.transferSize;
            this.stats.resourceTypes[resourceType].loadTime += entry.duration;

            // 检查性能阈值
            if (entry.duration > this.options.monitoring.performanceThreshold) {
                console.warn(`⚠️ 资源加载缓慢: ${entry.name} (${entry.duration.toFixed(2)}ms)`);
                this.emit('resource:slow', { name: entry.name, duration: entry.duration });
            }
        }
    }

    /**
     * 自适应加载初始化
     */
    initAdaptiveLoading() {
        // 监听设备方向变化
        window.addEventListener('orientationchange', () => {
            this.adaptToDeviceChange();
        });

        // 监听视口大小变化
        window.addEventListener('resize', this.debounce(() => {
            this.adaptToViewportChange();
        }, 250));

        // 监听电池状态（如果支持）
        if ('getBattery' in navigator) {
            navigator.getBattery().then(battery => {
                this.updateBatteryInfo(battery);
                battery.addEventListener('levelchange', () => this.updateBatteryInfo(battery));
                battery.addEventListener('chargingchange', () => this.updateBatteryInfo(battery));
            });
        }
    }

    updateBatteryInfo(battery) {
        this.batteryInfo = {
            level: battery.level,
            charging: battery.charging
        };

        console.log('🔋 电池状态更新:', this.batteryInfo);
        this.adaptToBatteryConditions();
    }

    /**
     * 错误处理初始化
     */
    initErrorHandling() {
        window.addEventListener('error', (event) => {
            if (event.target !== window) {
                this.handleResourceError(event.target, event.error);
            }
        }, true);

        window.addEventListener('unhandledrejection', (event) => {
            if (event.reason && event.reason.src) {
                this.handleResourceError({ src: event.reason.src }, event.reason);
            }
        });
    }

    handleResourceError(element, error) {
        const resourceUrl = element.src || element.href;
        console.error(`❌ 资源加载失败: ${resourceUrl}`, error);

        this.failedResources.set(resourceUrl, { element, error, timestamp: Date.now() });
        this.stats.failedResources++;

        // 尝试重新加载
        this.retryResourceLoad(element);

        this.emit('resource:error', { url: resourceUrl, error });
    }

    /**
     * 资源加载核心方法
     */
    async loadResource(element) {
        const resourceUrl = this.getResourceUrl(element);
        const resourceType = this.getResourceType(resourceUrl);

        if (this.loadingResources.has(resourceUrl)) {
            return await this.loadingResources.get(resourceUrl);
        }

        if (this.loadedResources.has(resourceUrl)) {
            console.log(`✅ 资源已加载: ${resourceUrl}`);
            return this.loadedResources.get(resourceUrl);
        }

        const loadPromise = this.performResourceLoad(element, resourceUrl, resourceType);
        this.loadingResources.set(resourceUrl, loadPromise);

        try {
            const result = await loadPromise;
            this.loadedResources.set(resourceUrl, result);
            this.stats.loadedResources++;
            return result;

        } catch (error) {
            this.failedResources.set(resourceUrl, { error, timestamp: Date.now() });
            this.stats.failedResources++;
            throw error;

        } finally {
            this.loadingResources.delete(resourceUrl);
        }
    }

    async performResourceLoad(element, resourceUrl, resourceType) {
        const startTime = performance.now();

        try {
            console.log(`📥 开始加载资源: ${resourceUrl}`);

            let optimizedUrl = resourceUrl;

            // 应用自适应优化
            if (this.options.adaptive.enabled) {
                optimizedUrl = await this.optimizeResourceUrl(resourceUrl, resourceType);
            }

            // 检查缓存
            let resource = await this.loadFromCache(optimizedUrl);
            let fromCache = true;

            if (!resource) {
                // 从网络加载
                resource = await this.loadFromNetwork(optimizedUrl, resourceType);
                fromCache = false;

                // 缓存资源
                await this.saveToCache(optimizedUrl, resource, resourceType);
            }

            // 应用资源到元素
            await this.applyResourceToElement(element, resource, resourceType);

            const loadTime = performance.now() - startTime;
            this.updateLoadStats(resourceUrl, resourceType, loadTime, fromCache);

            this.emit('resource:loaded', {
                url: resourceUrl,
                type: resourceType,
                loadTime: loadTime,
                fromCache: fromCache
            });

            console.log(`✅ 资源加载完成: ${resourceUrl} (${loadTime.toFixed(2)}ms)`);
            return resource;

        } catch (error) {
            console.error(`❌ 资源加载失败: ${resourceUrl}`, error);
            throw error;
        }
    }

    /**
     * 自适应资源URL优化
     */
    async optimizeResourceUrl(url, resourceType) {
        let optimizedUrl = url;

        // 根据网络条件调整
        if (this.options.adaptive.networkAware) {
            optimizedUrl = this.optimizeForNetwork(optimizedUrl, resourceType);
        }

        // 根据设备条件调整
        if (this.options.adaptive.deviceDetection) {
            optimizedUrl = this.optimizeForDevice(optimizedUrl, resourceType);
        }

        // 根据电池状态调整
        if (this.options.adaptive.batteryAware && this.batteryInfo) {
            optimizedUrl = this.optimizeForBattery(optimizedUrl, resourceType);
        }

        return optimizedUrl;
    }

    optimizeForNetwork(url, resourceType) {
        const params = new URLSearchParams(url.split('?')[1] || '');

        // 根据网络类型调整质量
        switch (this.networkInfo.effectiveType) {
            case 'slow-2g':
            case '2g':
                if (resourceType === 'image') {
                    params.set('quality', '30');
                    params.set('format', 'jpg');
                }
                break;
            case '3g':
                if (resourceType === 'image') {
                    params.set('quality', '60');
                    params.set('format', 'webp');
                }
                break;
            case '4g':
            default:
                if (resourceType === 'image') {
                    params.set('quality', '80');
                    params.set('format', 'webp');
                }
                break;
        }

        // 节省数据模式
        if (this.networkInfo.saveData) {
            params.set('save-data', 'true');
            if (resourceType === 'image') {
                params.set('quality', '20');
            }
        }

        const queryString = params.toString();
        return queryString ? `${url.split('?')[0]}?${queryString}` : url;
    }

    optimizeForDevice(url, resourceType) {
        if (resourceType !== 'image') {
            return url;
        }

        const params = new URLSearchParams(url.split('?')[1] || '');
        const dpr = window.devicePixelRatio || 1;
        const viewport = {
            width: window.innerWidth,
            height: window.innerHeight
        };

        // 根据视口大小选择合适的分辨率
        let targetWidth = viewport.width;

        // 为高DPI设备调整
        if (dpr > 1) {
            targetWidth = Math.min(targetWidth * dpr, 1920); // 限制最大宽度
        }

        params.set('width', targetWidth.toString());
        params.set('dpr', dpr.toString());

        const queryString = params.toString();
        return queryString ? `${url.split('?')[0]}?${queryString}` : url;
    }

    optimizeForBattery(url, resourceType) {
        if (!this.batteryInfo || this.batteryInfo.charging) {
            return url;
        }

        const params = new URLSearchParams(url.split('?')[1] || '');

        // 低电量时降低质量
        if (this.batteryInfo.level < 0.2) {
            if (resourceType === 'image') {
                params.set('quality', '40');
                params.set('format', 'jpg');
            }
        } else if (this.batteryInfo.level < 0.5) {
            if (resourceType === 'image') {
                params.set('quality', '60');
            }
        }

        const queryString = params.toString();
        return queryString ? `${url.split('?')[0]}?${queryString}` : url;
    }

    /**
     * 缓存操作
     */
    async loadFromCache(url) {
        try {
            if (this.cache) {
                const response = await this.cache.match(url);
                if (response && response.ok) {
                    console.log(`💾 缓存命中: ${url}`);
                    return response;
                }
            }
        } catch (error) {
            console.warn('⚠️ 缓存读取失败:', error);
        }
        return null;
    }

    async loadFromNetwork(url, resourceType) {
        const headers = {};

        // 根据资源类型设置请求头
        if (resourceType === 'image') {
            headers['Accept'] = 'image/webp,image/apng,image/*,*/*;q=0.8';
        }

        const response = await fetch(url, { headers });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        return response;
    }

    async saveToCache(url, response, resourceType) {
        try {
            if (this.cache && this.shouldCacheResource(resourceType)) {
                await this.cache.put(url, response.clone());
                console.log(`💾 资源已缓存: ${url}`);
            }
        } catch (error) {
            console.warn('⚠️ 缓存保存失败:', error);
        }
    }

    shouldCacheResource(resourceType) {
        // 不缓存某些类型的资源
        const noCacheTypes = ['text/html', 'application/json'];
        return !noCacheTypes.includes(resourceType);
    }

    /**
     * 资源应用
     */
    async applyResourceToElement(element, resource, resourceType) {
        switch (resourceType) {
            case 'image':
                await this.applyImageResource(element, resource);
                break;
            case 'script':
                await this.applyScriptResource(element, resource);
                break;
            case 'style':
                await this.applyStyleResource(element, resource);
                break;
            default:
                await this.applyGenericResource(element, resource);
                break;
        }
    }

    async applyImageResource(element, resource) {
        // 创建新图片对象进行预加载
        const img = new Image();

        await new Promise((resolve, reject) => {
            img.onload = resolve;
            img.onerror = reject;
            img.src = resource.url;
        });

        // 应用到元素
        if (element.tagName === 'IMG') {
            element.src = resource.url;

            // 设置srcset（如果有响应式图片）
            if (element.dataset.srcset) {
                element.srcset = element.dataset.srcset;
                element.removeAttribute('data-srcset');
            }
        } else {
            // 背景图片
            element.style.backgroundImage = `url(${resource.url})`;
        }

        // 添加加载完成类
        element.classList.add('loaded');
        element.classList.remove('loading');
    }

    async applyScriptResource(element, resource) {
        if (element.tagName === 'SCRIPT') {
            element.src = resource.url;
            element.removeAttribute('data-src');
        }
    }

    async applyStyleResource(element, resource) {
        if (element.tagName === 'LINK') {
            element.href = resource.url;
            element.removeAttribute('data-href');
        }
    }

    async applyGenericResource(element, resource) {
        // 通用资源应用逻辑
        if (element.dataset.src) {
            element.src = resource.url;
            element.removeAttribute('data-src');
        }
        if (element.dataset.href) {
            element.href = resource.url;
            element.removeAttribute('data-href');
        }
    }

    /**
     * 预加载资源
     */
    async preloadResource(url, trigger = 'manual') {
        try {
            console.log(`⚡ 预加载资源: ${url} (触发: ${trigger})`);

            const link = document.createElement('link');
            link.rel = 'preload';
            link.href = url;

            // 根据文件类型设置as属性
            const resourceType = this.getResourceType(url);
            switch (resourceType) {
                case 'script':
                    link.as = 'script';
                    break;
                case 'style':
                    link.as = 'style';
                    break;
                case 'image':
                    link.as = 'image';
                    break;
                case 'font':
                    link.as = 'font';
                    link.type = 'font/woff2';
                    break;
                default:
                    link.as = 'fetch';
                    break;
            }

            document.head.appendChild(link);

            this.emit('resource:preloaded', { url, trigger });

        } catch (error) {
            console.warn(`⚠️ 预加载失败: ${url}`, error);
        }
    }

    /**
     * 工具方法
     */
    getResourceUrl(element) {
        return element.dataset.src || element.dataset.href || element.src || element.href;
    }

    getResourceType(url) {
        const extension = url.split('.').pop()?.toLowerCase();
        const contentType = this.getContentTypeFromExtension(extension);

        return contentType || 'unknown';
    }

    getContentTypeFromExtension(extension) {
        const typeMap = {
            'jpg': 'image',
            'jpeg': 'image',
            'png': 'image',
            'gif': 'image',
            'webp': 'image',
            'avif': 'image',
            'svg': 'image',
            'js': 'script',
            'css': 'style',
            'woff': 'font',
            'woff2': 'font',
            'ttf': 'font',
            'eot': 'font'
        };

        return typeMap[extension];
    }

    updateLoadStats(url, resourceType, loadTime, fromCache) {
        this.stats.totalResources++;
        this.stats.totalSize += this.getResourceSize(url);

        // 更新平均加载时间
        const totalTime = this.stats.averageLoadTime * (this.stats.loadedResources - 1);
        this.stats.averageLoadTime = (totalTime + loadTime) / this.stats.loadedResources;

        // 更新缓存命中率
        if (fromCache) {
            this.stats.cacheHitRate = ((this.stats.cacheHitRate * (this.stats.loadedResources - 1)) + 1) / this.stats.loadedResources;
        } else {
            this.stats.cacheHitRate = (this.stats.cacheHitRate * (this.stats.loadedResources - 1)) / this.stats.loadedResources;
        }

        // 更新类型统计
        if (!this.stats.resourceTypes[resourceType]) {
            this.stats.resourceTypes[resourceType] = { count: 0, size: 0, loadTime: 0 };
        }
        this.stats.resourceTypes[resourceType].count++;
        this.stats.resourceTypes[resourceType].loadTime += loadTime;
    }

    getResourceSize(url) {
        // 模拟获取资源大小
        // 实际实现应该从响应头获取
        return 1024; // 1KB
    }

    retryResourceLoad(element) {
        const resourceUrl = this.getResourceUrl(element);
        const retryCount = parseInt(element.dataset.retryCount || '0');

        if (retryCount < 3) {
            setTimeout(() => {
                element.dataset.retryCount = (retryCount + 1).toString();
                this.loadResource(element).catch(error => {
                    console.warn(`⚠️ 资源重试失败: ${resourceUrl}`, error);
                });
            }, 1000 * Math.pow(2, retryCount)); // 指数退避
        }
    }

    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    /**
     * 自适应方法
     */
    adaptToNetworkConditions() {
        console.log('🔄 适应网络条件变化:', this.networkInfo);

        // 暂停低优先级资源加载
        if (this.networkInfo.effectiveType === 'slow-2g' || this.networkInfo.effectiveType === '2g') {
            this.pauseLowPriorityLoading();
        } else {
            this.resumeLoading();
        }

        this.emit('network:changed', this.networkInfo);
    }

    adaptToDeviceChange() {
        console.log('📱 设备条件变化，重新计算资源优化');
        // 重新优化现有资源
        this.reoptimizeResources();
    }

    adaptToViewportChange() {
        console.log('🖼️ 视口大小变化，调整响应式资源');
        // 更新响应式图片
        this.updateResponsiveImages();
    }

    adaptToBatteryConditions() {
        console.log('🔋 适应电池条件:', this.batteryInfo);

        if (this.batteryInfo && !this.batteryInfo.charging && this.batteryInfo.level < 0.2) {
            console.log('🔋 低电量模式，降低资源质量');
            this.enableLowPowerMode();
        }

        this.emit('battery:changed', this.batteryInfo);
    }

    pauseLowPriorityLoading() {
        // 暂停低优先级资源的加载
        document.querySelectorAll('[data-priority="low"]').forEach(element => {
            if (element.dataset.lazy) {
                this.lazyLoadObserver?.unobserve(element);
            }
        });
    }

    resumeLoading() {
        // 恢复所有资源加载
        document.querySelectorAll('[data-lazy]').forEach(element => {
            this.lazyLoadObserver?.observe(element);
        });
    }

    enableLowPowerMode() {
        // 启用低功耗模式
        document.documentElement.classList.add('low-power-mode');
        console.log('🔋 低功耗模式已启用');
    }

    reoptimizeResources() {
        // 重新优化已加载的资源
        this.loadedResources.forEach((resource, url) => {
            const newUrl = this.optimizeResourceUrl(url, this.getResourceType(url));
            if (newUrl !== url) {
                console.log(`🔄 重新优化资源: ${url} -> ${newUrl}`);
            }
        });
    }

    updateResponsiveImages() {
        // 更新响应式图片
        document.querySelectorAll('img[data-srcset]').forEach(img => {
            const newSrcset = this.generateResponsiveSrcset(img.dataset.srcset);
            img.dataset.srcset = newSrcset;
        });
    }

    generateResponsiveSrcset(baseUrl) {
        // 生成响应式图片srcset
        const breakpoints = this.options.images.responsiveBreakpoints;
        const srcsetEntries = breakpoints.map(width => `${baseUrl}?w=${width} ${width}w`);
        return srcsetEntries.join(', ');
    }

    /**
     * 事件系统
     */
    on(event, listener) {
        if (!this.eventListeners) {
            this.eventListeners = new Map();
        }
        if (!this.eventListeners.has(event)) {
            this.eventListeners.set(event, []);
        }
        this.eventListeners.get(event).push(listener);
    }

    emit(event, data) {
        if (this.eventListeners && this.eventListeners.has(event)) {
            this.eventListeners.get(event).forEach(listener => {
                try {
                    listener(data);
                } catch (error) {
                    console.error(`❌ 事件监听器错误 (${event}):`, error);
                }
            });
        }
    }

    /**
     * 公共API
     */
    getStats() {
        return {
            ...this.stats,
            cacheHitRate: (this.stats.cacheHitRate * 100).toFixed(2) + '%',
            errorRate: this.stats.totalResources > 0 ?
                ((this.stats.failedResources / this.stats.totalResources) * 100).toFixed(2) + '%' : '0%',
            compressionRatio: this.stats.totalSize > 0 ?
                ((1 - this.stats.compressedSize / this.stats.totalSize) * 100).toFixed(2) + '%' : '0%',
            networkInfo: this.networkInfo,
            batteryInfo: this.batteryInfo
        };
    }

    clearCache() {
        if (this.cache) {
            this.cache.keys().then(keys => {
                keys.forEach(key => this.cache.delete(key));
            });
        }

        this.loadedResources.clear();
        this.failedResources.clear();

        console.log('🧹 资源缓存已清空');
    }

    analyzePerformance() {
        const analysis = {
            slowResources: [],
            largeResources: [],
            optimizationSuggestions: []
        };

        // 分析慢速资源
        this.loadedResources.forEach((resource, url) => {
            if (resource.loadTime > this.options.monitoring.performanceThreshold) {
                analysis.slowResources.push({ url, loadTime: resource.loadTime });
            }
        });

        // 分析大型资源
        this.loadedResources.forEach((resource, url) => {
            if (resource.size > 1024 * 1024) { // > 1MB
                analysis.largeResources.push({ url, size: resource.size });
            }
        });

        // 生成优化建议
        analysis.optimizationSuggestions = this.generateOptimizationSuggestions(analysis);

        return analysis;
    }

    generateOptimizationSuggestions(analysis) {
        const suggestions = [];

        if (analysis.slowResources.length > 0) {
            suggestions.push(`发现 ${analysis.slowResources.length} 个加载缓慢的资源，建议优化或预加载`);
        }

        if (analysis.largeResources.length > 0) {
            suggestions.push(`发现 ${analysis.largeResources.length} 个大型资源，建议压缩或分割`);
        }

        if (parseFloat(this.stats.cacheHitRate) < 50) {
            suggestions.push('缓存命中率较低，建议优化缓存策略');
        }

        if (this.networkInfo.effectiveType === '2g' || this.networkInfo.effectiveType === 'slow-2g') {
            suggestions.push('网络条件较差，建议启用更激进的资源优化');
        }

        return suggestions;
    }
}

/**
 * 图片优化器
 */
class ImageOptimizer extends ResourceOptimizer {
    constructor(options = {}) {
        super({
            ...options,
            images: {
                ...options.images,
                lazyLoading: true,
                placeholder: true
            }
        });
    }

    // 图片特定的优化方法
    async optimizeImage(src, options = {}) {
        const imageOptions = {
            quality: options.quality || this.options.images.quality.webp,
            format: options.format || 'webp',
            width: options.width,
            height: options.height,
            crop: options.crop || false,
            ...options
        };

        // 生成优化后的图片URL
        const optimizedUrl = this.generateOptimizedImageUrl(src, imageOptions);
        return optimizedUrl;
    }

    generateOptimizedImageUrl(baseUrl, options) {
        const params = new URLSearchParams();

        if (options.quality) params.set('quality', options.quality.toString());
        if (options.format) params.set('format', options.format);
        if (options.width) params.set('width', options.width.toString());
        if (options.height) params.set('height', options.height.toString());
        if (options.crop) params.set('crop', 'true');

        const queryString = params.toString();
        return queryString ? `${baseUrl}?${queryString}` : baseUrl;
    }

    // 创建低质量占位符
    createPlaceholder(originalSrc, element) {
        if (!this.options.images.placeholder) return;

        const placeholderUrl = this.generateOptimizedImageUrl(originalSrc, {
            quality: this.options.images.placeholderQuality,
            width: 50,
            format: 'jpg',
            blur: 10
        });

        const placeholderImg = new Image();
        placeholderImg.src = placeholderUrl;
        placeholderImg.className = 'image-placeholder';
        placeholderImg.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            filter: blur(10px);
            transition: opacity 0.3s ease;
        `;

        element.parentNode.style.position = 'relative';
        element.parentNode.insertBefore(placeholderImg, element);

        // 加载完成后淡出占位符
        element.onload = () => {
            placeholderImg.style.opacity = '0';
            setTimeout(() => {
                if (placeholderImg.parentNode) {
                    placeholderImg.parentNode.removeChild(placeholderImg);
                }
            }, 300);
        };
    }
}

module.exports = {
    ResourceOptimizer,
    ImageOptimizer
};