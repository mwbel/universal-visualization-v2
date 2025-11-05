/**
 * 代码分割和懒加载系统
 * 任务3.2.1 - 前端性能优化核心组件
 * 目标: 页面加载时间 < 1s，资源利用率 > 90%
 */

class CodeSplittingManager {
    constructor(options = {}) {
        this.options = {
            chunkSize: options.chunkSize || 50 * 1024,      // 50KB块大小
            preloadThreshold: options.preloadThreshold || 0.5, // 预加载阈值
            maxConcurrentLoads: options.maxConcurrentLoads || 3,
            retryAttempts: options.retryAttempts || 3,
            retryDelay: options.retryDelay || 1000,
            cacheExpiration: options.cacheExpiration || 24 * 60 * 60 * 1000, // 24小时
            compressionEnabled: options.compressionEnabled !== false,
            ...options
        };

        // 模块注册表
        this.modules = new Map();
        this.loadedChunks = new Map();
        this.loadingChunks = new Map();
        this.failedChunks = new Map();

        // 性能统计
        this.stats = {
            totalChunks: 0,
            loadedChunks: 0,
            failedChunks: 0,
            totalSize: 0,
            loadedSize: 0,
            averageLoadTime: 0,
            cacheHitRate: 0,
            preloadHits: 0
        };

        // 预加载队列
        this.preloadQueue = [];
        this.isPreloading = false;

        // 事件监听器
        this.eventListeners = new Map();

        this.init();
    }

    /**
     * 初始化代码分割系统
     */
    init() {
        try {
            // 初始化存储
            this.initStorage();

            // 启动预加载管理器
            this.startPreloadManager();

            // 启动性能监控
            this.startPerformanceMonitoring();

            // 注册路由变化监听
            this.initRouteMonitoring();

            console.log('🧩 代码分割系统初始化完成');
            console.log(`⚙️ 配置: 块大小=${this.options.chunkSize}B, 预加载阈值=${this.options.preloadThreshold}`);

        } catch (error) {
            console.error('❌ 代码分割系统初始化失败:', error);
        }
    }

    /**
     * 初始化存储系统
     */
    initStorage() {
        // 检查浏览器支持
        if ('caches' in window) {
            this.cache = caches.open('code-chunks-v1');
            console.log('💾 使用Cache API存储代码块');
        } else {
            console.warn('⚠️ 浏览器不支持Cache API，使用内存缓存');
        }
    }

    /**
     * 注册模块
     */
    registerModule(name, config) {
        const moduleConfig = {
            name: name,
            chunks: config.chunks || [],
            dependencies: config.dependencies || [],
            priority: config.priority || 0,
            preload: config.preload || false,
            lazy: config.lazy !== false,
            critical: config.critical || false,
            version: config.version || '1.0.0',
            ...config
        };

        this.modules.set(name, moduleConfig);
        console.log(`📦 注册模块: ${name}`);

        return moduleConfig;
    }

    /**
     * 动态加载模块
     */
    async loadModule(moduleName) {
        const startTime = performance.now();

        try {
            const module = this.modules.get(moduleName);
            if (!module) {
                throw new Error(`模块未找到: ${moduleName}`);
            }

            // 检查是否已加载
            if (this.isModuleLoaded(moduleName)) {
                console.log(`✅ 模块已加载: ${moduleName}`);
                return await this.getLoadedModule(moduleName);
            }

            console.log(`🔄 开始加载模块: ${moduleName}`);

            // 加载依赖
            await this.loadDependencies(module.dependencies);

            // 加载模块块
            const chunks = await this.loadChunks(module.chunks);

            // 执行模块代码
            const moduleExports = await this.executeModule(module, chunks);

            // 缓存已加载模块
            this.cacheLoadedModule(moduleName, moduleExports);

            // 更新统计信息
            const loadTime = performance.now() - startTime;
            this.updateStats(module, chunks, loadTime);

            // 触发加载完成事件
            this.emit('module:loaded', { name: moduleName, loadTime, size: this.calculateChunksSize(chunks) });

            console.log(`✅ 模块加载完成: ${moduleName} (${loadTime.toFixed(2)}ms)`);
            return moduleExports;

        } catch (error) {
            console.error(`❌ 模块加载失败: ${moduleName}`, error);
            this.emit('module:load-error', { name: moduleName, error });
            throw error;
        }
    }

    /**
     * 检查模块是否已加载
     */
    isModuleLoaded(moduleName) {
        return window[moduleName] !== undefined || this.loadedChunks.has(moduleName);
    }

    /**
     * 获取已加载的模块
     */
    async getLoadedModule(moduleName) {
        if (window[moduleName]) {
            return window[moduleName];
        }

        const cached = this.loadedChunks.get(moduleName);
        if (cached) {
            return cached.exports;
        }

        throw new Error(`模块未找到: ${moduleName}`);
    }

    /**
     * 加载依赖模块
     */
    async loadDependencies(dependencies) {
        const loadPromises = dependencies.map(dep => this.loadModule(dep));
        await Promise.all(loadPromises);
    }

    /**
     * 加载代码块
     */
    async loadChunks(chunks) {
        const loadPromises = chunks.map(chunk => this.loadChunk(chunk));
        return await Promise.all(loadPromises);
    }

    /**
     * 加载单个代码块
     */
    async loadChunk(chunk) {
        const chunkKey = typeof chunk === 'string' ? chunk : chunk.name;

        // 检查是否正在加载
        if (this.loadingChunks.has(chunkKey)) {
            return await this.loadingChunks.get(chunkKey);
        }

        // 检查是否已加载
        if (this.loadedChunks.has(chunkKey)) {
            this.stats.preloadHits++;
            return this.loadedChunks.get(chunkKey);
        }

        // 开始加载
        const loadPromise = this.performChunkLoad(chunk);
        this.loadingChunks.set(chunkKey, loadPromise);

        try {
            const result = await loadPromise;
            this.loadedChunks.set(chunkKey, result);
            this.stats.loadedChunks++;
            return result;

        } catch (error) {
            this.failedChunks.set(chunkKey, error);
            this.stats.failedChunks++;
            throw error;

        } finally {
            this.loadingChunks.delete(chunkKey);
        }
    }

    /**
     * 执行代码块加载
     */
    async performChunkLoad(chunk) {
        const chunkName = typeof chunk === 'string' ? chunk : chunk.name;
        const chunkUrl = typeof chunk === 'string' ? chunk : chunk.url;

        for (let attempt = 1; attempt <= this.options.retryAttempts; attempt++) {
            try {
                console.log(`📥 加载代码块: ${chunkName} (尝试 ${attempt}/${this.options.retryAttempts})`);

                // 尝试从缓存加载
                let code = await this.loadFromCache(chunkUrl);
                let fromCache = true;

                if (!code) {
                    // 从网络加载
                    code = await this.loadFromNetwork(chunkUrl);
                    fromCache = false;

                    // 缓存代码
                    await this.saveToCache(chunkUrl, code);
                }

                // 解压缩（如果需要）
                if (this.options.compressionEnabled && chunk.compressed) {
                    code = await this.decompressCode(code);
                }

                // 执行代码
                const exports = await this.executeCode(code, chunkName);

                this.emit('chunk:loaded', {
                    name: chunkName,
                    size: code.length,
                    fromCache: fromCache,
                    attempt: attempt
                });

                return { code, exports };

            } catch (error) {
                console.warn(`⚠️ 代码块加载失败: ${chunkName}, 尝试 ${attempt}`, error.message);

                if (attempt === this.options.retryAttempts) {
                    throw new Error(`代码块加载失败: ${chunkName} - ${error.message}`);
                }

                // 等待后重试
                await this.delay(this.options.retryDelay * attempt);
            }
        }
    }

    /**
     * 从缓存加载代码
     */
    async loadFromCache(url) {
        try {
            if (this.cache) {
                const response = await this.cache.then(cache => cache.match(url));
                if (response) {
                    return await response.text();
                }
            }
        } catch (error) {
            console.warn('⚠️ 缓存读取失败:', error);
        }
        return null;
    }

    /**
     * 从网络加载代码
     */
    async loadFromNetwork(url) {
        const response = await fetch(url, {
            headers: {
                'Accept-Encoding': this.options.compressionEnabled ? 'gzip, deflate' : '*/*'
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        return await response.text();
    }

    /**
     * 保存到缓存
     */
    async saveToCache(url, code) {
        try {
            if (this.cache) {
                const cache = await this.cache;
                await cache.put(url, new Response(code, {
                    headers: { 'Content-Type': 'application/javascript' }
                }));
            }
        } catch (error) {
            console.warn('⚠️ 缓存保存失败:', error);
        }
    }

    /**
     * 代码解压缩
     */
    async decompressCode(compressedCode) {
        try {
            // 使用浏览器的解压缩API
            const stream = new Response(compressedCode).body;
            const decompressedStream = stream.pipeThrough(new DecompressionStream('gzip'));
            const decompressedResponse = new Response(decompressedStream);
            return await decompressedResponse.text();
        } catch (error) {
            console.warn('⚠️ 代码解压缩失败，返回原始代码:', error);
            return compressedCode;
        }
    }

    /**
     * 执行代码
     */
    async executeCode(code, chunkName) {
        try {
            // 创建安全的执行环境
            const module = { exports: {} };
            const exports = module.exports;

            // 使用Function构造器执行代码
            const executeFunction = new Function('module', 'exports', code);
            executeFunction(module, exports);

            return module.exports;

        } catch (error) {
            console.error(`❌ 代码执行失败: ${chunkName}`, error);
            throw new Error(`代码执行失败: ${chunkName} - ${error.message}`);
        }
    }

    /**
     * 执行模块
     */
    async executeModule(module, chunks) {
        if (module.factory) {
            // 使用工厂函数创建模块
            const dependencies = await Promise.all(
                module.dependencies.map(dep => this.getLoadedModule(dep))
            );

            return module.factory(...dependencies);
        } else {
            // 使用代码块执行
            const chunkExports = chunks.map(chunk => chunk.exports);
            return chunkExports.length === 1 ? chunkExports[0] : chunkExports;
        }
    }

    /**
     * 缓存已加载模块
     */
    cacheLoadedModule(moduleName, moduleExports) {
        this.loadedChunks.set(moduleName, { exports: moduleExports });

        // 也设置为全局变量（向后兼容）
        window[moduleName] = moduleExports;
    }

    /**
     * 预加载管理
     */
    startPreloadManager() {
        // 监听用户交互，触发预加载
        document.addEventListener('mouseover', this.handleMouseOver.bind(this));
        document.addEventListener('touchstart', this.handleTouchStart.bind(this));

        // 监听页面可见性变化
        document.addEventListener('visibilitychange', this.handleVisibilityChange.bind(this));

        // 定期预加载
        setInterval(() => {
            this.performScheduledPreload();
        }, 5000);
    }

    handleMouseOver(event) {
        const link = event.target.closest('a[data-module]');
        if (link) {
            const moduleName = link.dataset.module;
            this.preloadModule(moduleName, 'hover');
        }
    }

    handleTouchStart(event) {
        const link = event.target.closest('a[data-module]');
        if (link) {
            const moduleName = link.dataset.module;
            this.preloadModule(moduleName, 'touch');
        }
    }

    handleVisibilityChange() {
        if (!document.hidden) {
            // 页面变为可见时预加载关键模块
            this.preloadCriticalModules();
        }
    }

    /**
     * 预加载模块
     */
    async preloadModule(moduleName, trigger = 'manual') {
        const module = this.modules.get(moduleName);
        if (!module || !module.preload || this.isModuleLoaded(moduleName)) {
            return;
        }

        // 添加到预加载队列
        this.preloadQueue.push({ module, trigger, priority: module.priority });

        // 按优先级排序
        this.preloadQueue.sort((a, b) => b.priority - a.priority);

        if (!this.isPreloading) {
            this.processPreloadQueue();
        }
    }

    async processPreloadQueue() {
        if (this.isPreloading || this.preloadQueue.length === 0) {
            return;
        }

        this.isPreloading = true;
        const maxConcurrent = this.options.maxConcurrentLoads;
        const activeLoads = [];

        while (this.preloadQueue.length > 0 && activeLoads.length < maxConcurrent) {
            const { module, trigger } = this.preloadQueue.shift();
            const loadPromise = this.performPreload(module, trigger);
            activeLoads.push(loadPromise);
        }

        try {
            await Promise.all(activeLoads);
        } catch (error) {
            console.warn('⚠️ 预加载过程中出现错误:', error);
        } finally {
            this.isPreloading = false;

            // 继续处理队列
            if (this.preloadQueue.length > 0) {
                setTimeout(() => this.processPreloadQueue(), 100);
            }
        }
    }

    async performPreload(module, trigger) {
        try {
            console.log(`🚀 预加载模块: ${module.name} (触发: ${trigger})`);
            await this.loadModule(module.name);
            this.stats.preloadHits++;
        } catch (error) {
            console.warn(`⚠️ 预加载失败: ${module.name}`, error);
        }
    }

    performScheduledPreload() {
        // 预加载高优先级模块
        for (const [name, module] of this.modules) {
            if (module.preload && module.priority > 5 && !this.isModuleLoaded(name)) {
                this.preloadModule(name, 'scheduled');
            }
        }
    }

    preloadCriticalModules() {
        for (const [name, module] of this.modules) {
            if (module.critical && !this.isModuleLoaded(name)) {
                this.preloadModule(name, 'critical');
            }
        }
    }

    /**
     * 路由监控
     */
    initRouteMonitoring() {
        // 监听路由变化
        window.addEventListener('popstate', this.handleRouteChange.bind(this));

        // 劫持pushState和replaceState
        const originalPushState = history.pushState;
        const originalReplaceState = history.replaceState;

        history.pushState = (...args) => {
            originalPushState.apply(history, args);
            this.handleRouteChange();
        };

        history.replaceState = (...args) => {
            originalReplaceState.apply(history, args);
            this.handleRouteChange();
        };
    }

    handleRouteChange() {
        // 预加载当前路由相关的模块
        const currentPath = window.location.pathname;
        this.preloadModulesForRoute(currentPath);
    }

    preloadModulesForRoute(path) {
        for (const [name, module] of this.modules) {
            if (module.routes && module.routes.includes(path)) {
                this.preloadModule(name, 'route');
            }
        }
    }

    /**
     * 性能监控
     */
    startPerformanceMonitoring() {
        // 监控资源加载性能
        if ('PerformanceObserver' in window) {
            const observer = new PerformanceObserver((list) => {
                const entries = list.getEntries();
                entries.forEach(entry => {
                    if (entry.name.includes('.js') || entry.name.includes('.chunk')) {
                        this.analyzePerformanceEntry(entry);
                    }
                });
            });

            observer.observe({ entryTypes: ['resource', 'navigation'] });
        }

        // 定期收集性能指标
        setInterval(() => {
            this.collectPerformanceMetrics();
        }, 30000);
    }

    analyzePerformanceEntry(entry) {
        if (entry.transferSize > 0) {
            console.log(`📊 资源加载: ${entry.name}`, {
                size: entry.transferSize,
                duration: entry.duration,
                cached: entry.transferSize === 0
            });
        }
    }

    collectPerformanceMetrics() {
        const navigation = performance.getEntriesByType('navigation')[0];
        if (navigation) {
            const metrics = {
                domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
                loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
                firstPaint: this.getFirstPaint(),
                firstContentfulPaint: this.getFirstContentfulPaint()
            };

            console.log('📈 页面性能指标:', metrics);
            this.emit('performance:metrics', metrics);
        }
    }

    getFirstPaint() {
        const paintEntries = performance.getEntriesByType('paint');
        const firstPaint = paintEntries.find(entry => entry.name === 'first-paint');
        return firstPaint ? firstPaint.startTime : 0;
    }

    getFirstContentfulPaint() {
        const paintEntries = performance.getEntriesByType('paint');
        const fcp = paintEntries.find(entry => entry.name === 'first-contentful-paint');
        return fcp ? fcp.startTime : 0;
    }

    /**
     * 工具方法
     */
    calculateChunksSize(chunks) {
        return chunks.reduce((total, chunk) => total + (chunk.code?.length || 0), 0);
    }

    updateStats(module, chunks, loadTime) {
        this.stats.totalChunks += chunks.length;
        this.stats.totalSize += this.calculateChunksSize(chunks);

        // 更新平均加载时间
        const totalTime = this.stats.averageLoadTime * (this.stats.loadedChunks - 1);
        this.stats.averageLoadTime = (totalTime + loadTime) / this.stats.loadedChunks;
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * 事件系统
     */
    on(event, listener) {
        if (!this.eventListeners.has(event)) {
            this.eventListeners.set(event, []);
        }
        this.eventListeners.get(event).push(listener);
    }

    emit(event, data) {
        if (this.eventListeners.has(event)) {
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
            cacheHitRate: this.stats.loadedChunks > 0 ?
                ((this.stats.preloadHits / this.stats.loadedChunks) * 100).toFixed(2) + '%' : '0%',
            registeredModules: this.modules.size,
            loadingChunks: this.loadingChunks.size,
            failedChunks: this.failedChunks.size
        };
    }

    clearCache() {
        if (this.cache) {
            this.cache.then(cache => cache.keys().then(keys => {
                keys.forEach(key => cache.delete(key));
            }));
        }

        this.loadedChunks.clear();
        this.failedChunks.clear();

        console.log('🧹 代码缓存已清空');
    }

    async optimizeBundle() {
        console.log('🔧 开始包优化分析...');

        // 分析模块使用情况
        const unusedModules = [];
        for (const [name, module] of this.modules) {
            if (!this.isModuleLoaded(name) && !module.preload && !module.critical) {
                unusedModules.push(name);
            }
        }

        // 分析代码块大小
        const largeChunks = [];
        for (const [name, chunk] of this.loadedChunks) {
            if (chunk.code && chunk.code.length > this.options.chunkSize) {
                largeChunks.push({ name, size: chunk.code.length });
            }
        }

        return {
            unusedModules,
            largeChunks,
            recommendations: this.generateOptimizationRecommendations(unusedModules, largeChunks)
        };
    }

    generateOptimizationRecommendations(unusedModules, largeChunks) {
        const recommendations = [];

        if (unusedModules.length > 0) {
            recommendations.push(`发现 ${unusedModules.length} 个未使用模块，建议移除或延迟加载`);
        }

        if (largeChunks.length > 0) {
            recommendations.push(`发现 ${largeChunks.length} 个大型代码块，建议进一步分割`);
        }

        if (this.stats.cacheHitRate < '50%') {
            recommendations.push('缓存命中率较低，建议优化缓存策略');
        }

        return recommendations;
    }
}

/**
 * 懒加载装饰器
 */
function lazyLoad(moduleName, options = {}) {
    return function(target, propertyName, descriptor) {
        const method = descriptor.value;

        descriptor.value = async function(...args) {
            // 确保代码分割管理器存在
            if (!this.codeSplittingManager) {
                console.warn('⚠️ 代码分割管理器未初始化');
                return await method.apply(this, args);
            }

            try {
                // 加载所需模块
                await this.codeSplittingManager.loadModule(moduleName);

                // 执行原方法
                return await method.apply(this, args);

            } catch (error) {
                console.error(`❌ 懒加载失败: ${moduleName}`, error);
                throw error;
            }
        };

        return descriptor;
    };
}

/**
 * 路由级代码分割
 */
class RouteCodeSplitter {
    constructor(codeSplittingManager) {
        this.codeSplittingManager = codeSplittingManager;
        this.routes = new Map();
        this.initRouteInterception();
    }

    registerRoute(path, moduleName, options = {}) {
        this.routes.set(path, {
            moduleName,
            preload: options.preload !== false,
            priority: options.priority || 0,
            ...options
        });

        // 注册模块到代码分割管理器
        this.codeSplittingManager.registerModule(moduleName, {
            routes: [path],
            preload: options.preload,
            priority: options.priority,
            ...options
        });

        console.log(`🛣️ 注册路由: ${path} -> ${moduleName}`);
    }

    initRouteInterception() {
        // 拦截导航事件
        window.addEventListener('beforeunload', this.handleNavigation.bind(this));
        document.addEventListener('click', this.handleLinkClick.bind(this));
    }

    handleNavigation(event) {
        const currentPath = window.location.pathname;
        const route = this.routes.get(currentPath);

        if (route && route.preload) {
            this.codeSplittingManager.preloadModule(route.moduleName, 'navigation');
        }
    }

    handleLinkClick(event) {
        const link = event.target.closest('a');
        if (link && link.href) {
            try {
                const url = new URL(link.href);
                const route = this.routes.get(url.pathname);

                if (route && route.preload) {
                    this.codeSplittingManager.preloadModule(route.moduleName, 'link-click');
                }
            } catch (error) {
                // 忽略无效URL
            }
        }
    }

    async loadRoute(path) {
        const route = this.routes.get(path);
        if (!route) {
            throw new Error(`路由未注册: ${path}`);
        }

        return await this.codeSplittingManager.loadModule(route.moduleName);
    }
}

module.exports = {
    CodeSplittingManager,
    lazyLoad,
    RouteCodeSplitter
};