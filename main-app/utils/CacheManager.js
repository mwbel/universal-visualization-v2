/**
 * CacheManager.js - 缓存管理器
 * 提供智能缓存机制，支持多级缓存、过期策略和预加载功能
 */
(function(global) {
  'use strict';

  /**
   * 缓存管理器类
   */
  class CacheManager {
    constructor(options = {}) {
      // 配置选项
      this.options = {
        defaultTTL: options.defaultTTL || 5 * 60 * 1000, // 5分钟
        maxSize: options.maxSize || 1000, // 最大缓存项数
        enableCompression: options.enableCompression || false,
        enableMetrics: options.enableMetrics !== false,
        enablePreloading: options.enablePreloading || false,
        cleanupInterval: options.cleanupInterval || 60 * 1000, // 1分钟
        preloadStrategies: options.preloadStrategies || ['recently_used', 'popular'],
        ...options
      };

      // 多级缓存存储
      this.caches = {
        memory: new Map(), // 内存缓存（最快）
        session: new Map(), // 会话缓存（中等）
        persistent: new Map() // 持久缓存（较慢但持久）
      };

      // 缓存元数据
      this.metadata = new Map();

      // 缓存统计
      this.stats = {
        hits: 0,
        misses: 0,
        sets: 0,
        deletes: 0,
        evictions: 0,
        compressions: 0,
        decompressions: 0,
        preloadHits: 0,
        totalRequests: 0
      };

      // LRU队列
      this.lruQueue = [];

      // 预加载配置
      this.preloadConfig = new Map();

      // 清理定时器
      this.cleanupTimer = null;

      // 初始化
      this.init();
    }

    /**
     * 初始化缓存管理器
     */
    init() {
      try {
        // 启动定期清理
        this.startCleanupTimer();

        // 从持久化存储恢复缓存
        this.restoreFromPersistentStorage();

        // 设置预加载策略
        if (this.options.enablePreloading) {
          this.setupPreloading();
        }

        console.log('CacheManager 初始化完成');
      } catch (error) {
        console.error('CacheManager 初始化失败:', error);
      }
    }

    /**
     * 启动清理定时器
     */
    startCleanupTimer() {
      if (this.cleanupTimer) {
        clearInterval(this.cleanupTimer);
      }

      this.cleanupTimer = setInterval(() => {
        this.cleanup();
      }, this.options.cleanupInterval);
    }

    /**
     * 从持久化存储恢复缓存
     */
    restoreFromPersistentStorage() {
      try {
        if (global.localStorageManager) {
          const cachedData = global.localStorageManager.getItem('cache_persistent');
          if (cachedData) {
            this.caches.persistent = new Map(Object.entries(cachedData));
            console.log(`从持久化存储恢复了 ${this.caches.persistent.size} 个缓存项`);
          }
        }
      } catch (error) {
        console.error('恢复持久化缓存失败:', error);
      }
    }

    /**
     * 设置预加载策略
     */
    setupPreloading() {
      // 最近使用的项目预加载
      this.preloadConfig.set('recently_used', {
        keyPattern: /project_.*/,
        maxItems: 20,
        strategy: 'lru'
      });

      // 热门项目预加载
      this.preloadConfig.set('popular', {
        keyPattern: /popular_projects/,
        maxItems: 50,
        strategy: 'fixed'
      });

      // 用户分析数据预加载
      this.preloadConfig.set('user_analytics', {
        keyPattern: /analytics_.*/,
        maxItems: 10,
        strategy: 'session'
      });
    }

    /**
     * 获取缓存
     */
    async get(key, options = {}) {
      try {
        this.stats.totalRequests++;
        const startTime = Date.now();

        // 1. 尝试从内存缓存获取
        let result = this.getFromCache('memory', key);
        if (result !== null) {
          this.stats.hits++;
          this.updateLRU(key);
          this.emitEvent('cache:hit', { key, level: 'memory', duration: Date.now() - startTime });
          return result;
        }

        // 2. 尝试从会话缓存获取
        result = this.getFromCache('session', key);
        if (result !== null) {
          this.stats.hits++;
          // 提升到内存缓存
          this.setToCache('memory', key, result, options);
          this.updateLRU(key);
          this.emitEvent('cache:hit', { key, level: 'session', promoted: true, duration: Date.now() - startTime });
          return result;
        }

        // 3. 尝试从持久缓存获取
        result = this.getFromCache('persistent', key);
        if (result !== null) {
          this.stats.hits++;
          // 提升到会话缓存和内存缓存
          this.setToCache('session', key, result, options);
          this.setToCache('memory', key, result, options);
          this.updateLRU(key);
          this.emitEvent('cache:hit', { key, level: 'persistent', promoted: true, duration: Date.now() - startTime });
          return result;
        }

        // 4. 缓存未命中，尝试预加载
        if (this.options.enablePreloading && this.shouldPreload(key)) {
          const preloadedResult = await this.preloadKey(key);
          if (preloadedResult !== null) {
            this.stats.preloadHits++;
            this.emitEvent('cache:preload-hit', { key, duration: Date.now() - startTime });
            return preloadedResult;
          }
        }

        this.stats.misses++;
        this.emitEvent('cache:miss', { key, duration: Date.now() - startTime });
        return null;

      } catch (error) {
        console.error(`获取缓存失败 [${key}]:`, error);
        this.stats.misses++;
        return null;
      }
    }

    /**
     * 设置缓存
     */
    set(key, value, options = {}) {
      try {
        const {
          ttl = this.options.defaultTTL,
          level = 'memory',
          compress = this.options.enableCompression,
          priority = 'normal',
          tags = []
        } = options;

        this.stats.sets++;

        // 处理数据压缩
        let processedValue = value;
        let isCompressed = false;

        if (compress && this.shouldCompress(value)) {
          processedValue = this.compressData(value);
          isCompressed = true;
          this.stats.compressions++;
        }

        const cacheData = {
          value: processedValue,
          timestamp: Date.now(),
          ttl: ttl,
          compressed: isCompressed,
          priority: priority,
          tags: tags,
          accessCount: 0,
          lastAccess: Date.now()
        };

        // 设置到指定级别的缓存
        this.setToCache(level, key, cacheData, options);

        // 更新LRU队列
        this.updateLRU(key);

        // 触发缓存事件
        this.emitEvent('cache:set', { key, level, ttl, compressed: isCompressed });

        return true;

      } catch (error) {
        console.error(`设置缓存失败 [${key}]:`, error);
        return false;
      }
    }

    /**
     * 从指定级别的缓存获取数据
     */
    getFromCache(level, key) {
      const cache = this.caches[level];
      if (!cache.has(key)) {
        return null;
      }

      const cacheData = cache.get(key);

      // 检查是否过期
      if (this.isExpired(cacheData)) {
        cache.delete(key);
        this.metadata.delete(key);
        return null;
      }

      // 更新访问统计
      cacheData.accessCount++;
      cacheData.lastAccess = Date.now();

      // 解压缩数据（如果需要）
      let value = cacheData.value;
      if (cacheData.compressed) {
        value = this.decompressData(value);
        this.stats.decompressions++;
      }

      return value;
    }

    /**
     * 设置到指定级别的缓存
     */
    setToCache(level, key, cacheData, options = {}) {
      const cache = this.caches[level];

      // 检查缓存大小限制
      if (cache.size >= this.options.maxSize) {
        this.evictFromCache(level);
      }

      cache.set(key, cacheData);
      this.metadata.set(key, {
        level: level,
        ...cacheData
      });

      // 持久化（如果是持久缓存）
      if (level === 'persistent' && global.localStorageManager) {
        this.persistToStorage();
      }
    }

    /**
     * 更新LRU队列
     */
    updateLRU(key) {
      // 从队列中移除
      const index = this.lruQueue.indexOf(key);
      if (index > -1) {
        this.lruQueue.splice(index, 1);
      }

      // 添加到队列末尾
      this.lruQueue.push(key);

      // 限制队列大小
      if (this.lruQueue.length > this.options.maxSize * 2) {
        this.lruQueue = this.lruQueue.slice(-this.options.maxSize);
      }
    }

    /**
     * 检查数据是否应该压缩
     */
    shouldCompress(value) {
      if (typeof value === 'string') {
        return value.length > 1000; // 字符串长度超过1KB
      }

      if (typeof value === 'object') {
        return JSON.stringify(value).length > 1000;
      }

      return false;
    }

    /**
     * 压缩数据
     */
    compressData(data) {
      // 简单的压缩实现（实际项目中可以使用更高效的压缩算法）
      if (typeof data === 'string') {
        return btoa(data); // Base64编码作为简单压缩
      }

      if (typeof data === 'object') {
        return btoa(JSON.stringify(data));
      }

      return data;
    }

    /**
     * 解压缩数据
     */
    decompressData(compressedData) {
      try {
        const decompressed = atob(compressedData);
        return JSON.parse(decompressed);
      } catch (error) {
        // 如果解压缩失败，返回原始数据
        return compressedData;
      }
    }

    /**
     * 检查缓存是否过期
     */
    isExpired(cacheData) {
      if (!cacheData.ttl || cacheData.ttl === 0) {
        return false; // 永不过期
      }

      return Date.now() - cacheData.timestamp > cacheData.ttl;
    }

    /**
     * 从缓存中驱逐数据
     */
    evictFromCache(level) {
      const cache = this.caches[level];

      if (cache.size === 0) {
        return;
      }

      // 根据策略选择驱逐项
      let keysToEvict = [];

      if (level === 'memory') {
        // 内存缓存使用LRU策略
        const lruKeys = this.lruQueue.filter(key => this.metadata.get(key)?.level === 'memory');
        keysToEvict = lruKeys.slice(0, Math.ceil(cache.size * 0.1)); // 驱逐10%
      } else {
        // 其他缓存使用FIFO策略
        keysToEvict = Array.from(cache.keys()).slice(0, Math.ceil(cache.size * 0.1));
      }

      // 执行驱逐
      keysToEvict.forEach(key => {
        cache.delete(key);
        this.metadata.delete(key);
        this.stats.evictions++;
      });

      this.emitEvent('cache:evicted', { level, keys: keysToEvict });
    }

    /**
     * 删除缓存
     */
    delete(key) {
      try {
        let deleted = false;

        // 从所有级别的缓存中删除
        Object.keys(this.caches).forEach(level => {
          if (this.caches[level].has(key)) {
            this.caches[level].delete(key);
            deleted = true;
          }
        });

        if (deleted) {
          this.metadata.delete(key);
          this.stats.deletes++;

          // 从LRU队列中移除
          const index = this.lruQueue.indexOf(key);
          if (index > -1) {
            this.lruQueue.splice(index, 1);
          }

          this.emitEvent('cache:deleted', { key });
        }

        return deleted;

      } catch (error) {
        console.error(`删除缓存失败 [${key}]:`, error);
        return false;
      }
    }

    /**
     * 清空指定级别的缓存
     */
    clear(level = null) {
      try {
        if (level) {
          this.caches[level].clear();
          this.emitEvent('cache:cleared', { level });
        } else {
          Object.keys(this.caches).forEach(l => this.caches[l].clear());
          this.lruQueue = [];
          this.metadata.clear();
          this.emitEvent('cache:cleared', { level: 'all' });
        }

        return true;

      } catch (error) {
        console.error('清空缓存失败:', error);
        return false;
      }
    }

    /**
     * 检查是否存在缓存
     */
    has(key) {
      return Object.values(this.caches).some(cache => cache.has(key));
    }

    /**
     * 获取缓存大小
     */
    size(level = null) {
      if (level) {
        return this.caches[level].size;
      }

      return Object.values(this.caches).reduce((total, cache) => total + cache.size, 0);
    }

    /**
     * 清理过期缓存
     */
    cleanup() {
      try {
        const now = Date.now();
        let cleanedCount = 0;

        Object.keys(this.caches).forEach(level => {
          const cache = this.caches[level];
          const keysToDelete = [];

          cache.forEach((cacheData, key) => {
            if (this.isExpired(cacheData)) {
              keysToDelete.push(key);
            }
          });

          keysToDelete.forEach(key => {
            cache.delete(key);
            this.metadata.delete(key);
            cleanedCount++;
          });
        });

        // 清理LRU队列中的无效项
        this.lruQueue = this.lruQueue.filter(key => this.has(key));

        if (cleanedCount > 0) {
          this.emitEvent('cache:cleanup', { cleanedCount });
        }

      } catch (error) {
        console.error('缓存清理失败:', error);
      }
    }

    /**
     * 持久化到存储
     */
    persistToStorage() {
      try {
        if (global.localStorageManager) {
          const persistentData = Object.fromEntries(this.caches.persistent);
          global.localStorageManager.setItem('cache_persistent', persistentData);
        }
      } catch (error) {
        console.error('持久化缓存失败:', error);
      }
    }

    /**
     * 检查是否应该预加载
     */
    shouldPreload(key) {
      for (const [strategy, config] of this.preloadConfig) {
        if (config.keyPattern.test(key)) {
          return true;
        }
      }
      return false;
    }

    /**
     * 预加载指定键
     */
    async preloadKey(key) {
      try {
        // 这里应该根据键的模式调用相应的数据加载逻辑
        // 例如：如果是项目数据，调用UserDataService获取项目信息

        let data = null;

        if (key.startsWith('project_')) {
          const projectId = key.replace('project_', '');
          if (global.userDataService) {
            data = await global.userDataService.getProject(projectId);
          }
        } else if (key.startsWith('analytics_')) {
          const userId = key.replace('analytics_', '');
          if (global.userDataService) {
            data = await global.userDataService.getUserAnalytics();
          }
        }

        if (data) {
          this.set(key, data, { level: 'session', priority: 'high' });
        }

        return data;

      } catch (error) {
        console.error(`预加载缓存失败 [${key}]:`, error);
        return null;
      }
    }

    /**
     * 批量预加载
     */
    async preloadBatch(keys) {
      const results = [];

      for (const key of keys) {
        try {
          const result = await this.preloadKey(key);
          results.push({ key, success: result !== null, data: result });
        } catch (error) {
          results.push({ key, success: false, error: error.message });
        }
      }

      this.emitEvent('cache:batch-preloaded', { results });
      return results;
    }

    /**
     * 根据标签获取缓存
     */
    getByTag(tag) {
      const results = [];

      this.metadata.forEach((meta, key) => {
        if (meta.tags && meta.tags.includes(tag)) {
          results.push({
            key: key,
            level: meta.level,
            timestamp: meta.timestamp,
            accessCount: meta.accessCount
          });
        }
      });

      return results;
    }

    /**
     * 根据标签删除缓存
     */
    deleteByTag(tag) {
      const keysToDelete = [];

      this.metadata.forEach((meta, key) => {
        if (meta.tags && meta.tags.includes(tag)) {
          keysToDelete.push(key);
        }
      });

      keysToDelete.forEach(key => this.delete(key));

      this.emitEvent('cache:deleted-by-tag', { tag, count: keysToDelete.length });
      return keysToDelete.length;
    }

    /**
     * 获取缓存统计信息
     */
    getStats() {
      const hitRate = this.stats.totalRequests > 0
        ? (this.stats.hits / this.stats.totalRequests * 100).toFixed(2)
        : 0;

      const cacheSizes = {};
      Object.keys(this.caches).forEach(level => {
        cacheSizes[level] = this.caches[level].size;
      });

      return {
        ...this.stats,
        hitRate: `${hitRate}%`,
        cacheSizes: cacheSizes,
        lruQueueSize: this.lruQueue.length,
        metadataSize: this.metadata.size,
        memoryUsage: this.estimateMemoryUsage()
      };
    }

    /**
     * 估算内存使用量
     */
    estimateMemoryUsage() {
      let totalSize = 0;

      this.caches.memory.forEach((cacheData, key) => {
        totalSize += key.length * 2; // 字符串键的估算大小
        totalSize += JSON.stringify(cacheData).length * 2; // 值的估算大小
      });

      return {
        estimatedBytes: totalSize,
        estimatedMB: (totalSize / (1024 * 1024)).toFixed(2)
      };
    }

    /**
     * 导出缓存数据
     */
    exportCache(level = 'memory') {
      const cache = this.caches[level];
      return Object.fromEntries(cache);
    }

    /**
     * 导入缓存数据
     */
    importCache(data, level = 'memory', options = {}) {
      const { merge = true, overrideTTL = null } = options;

      if (!merge) {
        this.caches[level].clear();
      }

      Object.entries(data).forEach(([key, cacheData]) => {
        if (overrideTTL) {
          cacheData.ttl = overrideTTL;
        }
        this.caches[level].set(key, cacheData);
        this.metadata.set(key, { level, ...cacheData });
      });

      this.emitEvent('cache:imported', { level, count: Object.keys(data).length });
    }

    /**
     * 发送事件
     */
    emitEvent(eventName, data) {
      if (this.options.enableMetrics) {
        const event = new CustomEvent(eventName, { detail: data });
        this.eventBus?.dispatchEvent(event);
      }
    }

    /**
     * 监听事件
     */
    addEventListener(eventName, callback) {
      if (!this.eventBus) {
        this.eventBus = new EventTarget();
      }
      this.eventBus.addEventListener(eventName, callback);
    }

    /**
     * 移除事件监听
     */
    removeEventListener(eventName, callback) {
      if (this.eventBus) {
        this.eventBus.removeEventListener(eventName, callback);
      }
    }

    /**
     * 销毁缓存管理器
     */
    destroy() {
      if (this.cleanupTimer) {
        clearInterval(this.cleanupTimer);
      }

      this.clear();
      this.cleanup();
      this.persistToStorage();

      console.log('CacheManager 已销毁');
    }
  }

  // 创建全局实例
  const cacheManager = new CacheManager();

  // 导出到全局
  global.CacheManager = CacheManager;
  global.cacheManager = cacheManager;

})(window);