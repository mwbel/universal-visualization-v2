/**
 * API缓存系统 - 实现多层缓存策略优化后端性能
 * 任务3.2.2 - 后端性能优化核心组件
 * 目标: API响应时间 < 500ms, 系统可用性 > 99.5%
 */

class APICacheSystem {
    constructor(options = {}) {
        this.options = {
            memoryCache: {
                maxSize: 100, // 最大缓存条目数
                ttl: 5 * 60 * 1000, // 5分钟过期
                enabled: true
            },
            redisCache: {
                enabled: false, // 如果有Redis可以启用
                host: 'localhost',
                port: 6379,
                ttl: 30 * 60 * 1000 // 30分钟过期
            },
            fileCache: {
                enabled: true,
                directory: './cache',
                ttl: 2 * 60 * 60 * 1000 // 2小时过期
            },
            compression: {
                enabled: true,
                threshold: 1024 // 大于1KB的数据压缩
            },
            ...options
        };

        // 内存缓存存储
        this.memoryCache = new Map();
        this.cacheStats = {
            hits: 0,
            misses: 0,
            sets: 0,
            evictions: 0,
            errors: 0
        };

        this.init();
    }

    async init() {
        try {
            // 初始化文件缓存目录
            if (this.options.fileCache.enabled) {
                await this.initFileCache();
            }

            // 初始化Redis连接（如果启用）
            if (this.options.redisCache.enabled) {
                await this.initRedisCache();
            }

            // 启动缓存清理定时器
            this.startCleanupTimer();

            console.log('🗄️ API缓存系统初始化完成');
        } catch (error) {
            console.error('❌ 缓存系统初始化失败:', error);
            this.cacheStats.errors++;
        }
    }

    /**
     * 生成缓存键
     */
    generateCacheKey(method, url, params = {}, body = null) {
        const keyData = {
            method: method.toUpperCase(),
            url: url,
            params: this.sortObject(params),
            body: body ? this.hashObject(body) : null
        };

        return 'api:' + this.hashObject(keyData);
    }

    /**
     * 获取缓存数据
     */
    async get(key) {
        try {
            // 1. 尝试内存缓存
            if (this.options.memoryCache.enabled) {
                const memoryResult = await this.getMemoryCache(key);
                if (memoryResult !== null) {
                    this.cacheStats.hits++;
                    return memoryResult;
                }
            }

            // 2. 尝试Redis缓存
            if (this.options.redisCache.enabled) {
                const redisResult = await this.getRedisCache(key);
                if (redisResult !== null) {
                    this.cacheStats.hits++;
                    // 回填到内存缓存
                    if (this.options.memoryCache.enabled) {
                        await this.setMemoryCache(key, redisResult, this.options.memoryCache.ttl);
                    }
                    return redisResult;
                }
            }

            // 3. 尝试文件缓存
            if (this.options.fileCache.enabled) {
                const fileResult = await this.getFileCache(key);
                if (fileResult !== null) {
                    this.cacheStats.hits++;
                    // 回填到上层缓存
                    if (this.options.memoryCache.enabled) {
                        await this.setMemoryCache(key, fileResult, this.options.memoryCache.ttl);
                    }
                    return fileResult;
                }
            }

            this.cacheStats.misses++;
            return null;

        } catch (error) {
            console.error('❌ 缓存获取失败:', error);
            this.cacheStats.errors++;
            return null;
        }
    }

    /**
     * 设置缓存数据
     */
    async set(key, data, ttl = null) {
        try {
            const effectiveTtl = ttl || this.options.memoryCache.ttl;
            const timestamp = Date.now();
            const expiryTime = timestamp + effectiveTtl;

            const cacheData = {
                data: data,
                timestamp: timestamp,
                expiryTime: expiryTime,
                compressed: false
            };

            // 压缩大数据
            if (this.options.compression.enabled &&
                JSON.stringify(data).length > this.options.compression.threshold) {
                cacheData.data = await this.compressData(data);
                cacheData.compressed = true;
            }

            // 1. 设置内存缓存
            if (this.options.memoryCache.enabled) {
                await this.setMemoryCache(key, cacheData, effectiveTtl);
            }

            // 2. 设置Redis缓存
            if (this.options.redisCache.enabled) {
                await this.setRedisCache(key, cacheData, this.options.redisCache.ttl);
            }

            // 3. 设置文件缓存
            if (this.options.fileCache.enabled) {
                await this.setFileCache(key, cacheData, this.options.fileCache.ttl);
            }

            this.cacheStats.sets++;

        } catch (error) {
            console.error('❌ 缓存设置失败:', error);
            this.cacheStats.errors++;
        }
    }

    /**
     * 内存缓存操作
     */
    async getMemoryCache(key) {
        const item = this.memoryCache.get(key);
        if (!item) return null;

        if (Date.now() > item.expiryTime) {
            this.memoryCache.delete(key);
            return null;
        }

        // 更新LRU
        this.memoryCache.delete(key);
        this.memoryCache.set(key, item);

        return item.compressed ? await this.decompressData(item.data) : item.data;
    }

    async setMemoryCache(key, data, ttl) {
        // 检查容量限制
        if (this.memoryCache.size >= this.options.memoryCache.maxSize) {
            this.evictLRU();
        }

        this.memoryCache.set(key, {
            data: data,
            expiryTime: Date.now() + ttl
        });
    }

    evictLRU() {
        const firstKey = this.memoryCache.keys().next().value;
        if (firstKey) {
            this.memoryCache.delete(firstKey);
            this.cacheStats.evictions++;
        }
    }

    /**
     * Redis缓存操作（简化实现）
     */
    async initRedisCache() {
        // 这里应该连接真实的Redis
        console.log('📗 Redis缓存初始化（模拟）');
    }

    async getRedisCache(key) {
        // 模拟Redis获取
        return null; // 实际实现应该连接真实Redis
    }

    async setRedisCache(key, data, ttl) {
        // 模拟Redis设置
        console.log(`📗 Redis缓存设置: ${key}`);
    }

    /**
     * 文件缓存操作
     */
    async initFileCache() {
        const fs = require('fs').promises;
        try {
            await fs.mkdir(this.options.fileCache.directory, { recursive: true });
        } catch (error) {
            console.error('❌ 文件缓存目录创建失败:', error);
        }
    }

    async getFileCache(key) {
        const fs = require('fs').promises;
        const path = require('path');
        const filePath = path.join(this.options.fileCache.directory, `${key}.cache`);

        try {
            const data = await fs.readFile(filePath, 'utf8');
            const cacheItem = JSON.parse(data);

            if (Date.now() > cacheItem.expiryTime) {
                await fs.unlink(filePath);
                return null;
            }

            return cacheItem.compressed ?
                await this.decompressData(cacheItem.data) : cacheItem.data;

        } catch (error) {
            // 文件不存在或读取失败
            return null;
        }
    }

    async setFileCache(key, data, ttl) {
        const fs = require('fs').promises;
        const path = require('path');
        const filePath = path.join(this.options.fileCache.directory, `${key}.cache`);

        try {
            const cacheItem = {
                data: data,
                expiryTime: Date.now() + ttl
            };

            await fs.writeFile(filePath, JSON.stringify(cacheItem), 'utf8');

        } catch (error) {
            console.error('❌ 文件缓存设置失败:', error);
        }
    }

    /**
     * 数据压缩/解压
     */
    async compressData(data) {
        try {
            const zlib = require('zlib');
            const jsonString = JSON.stringify(data);
            return await zlib.deflateAsync(jsonString);
        } catch (error) {
            console.error('❌ 数据压缩失败:', error);
            return data;
        }
    }

    async decompressData(compressedData) {
        try {
            const zlib = require('zlib');
            const jsonString = await zlib.inflateAsync(compressedData);
            return JSON.parse(jsonString);
        } catch (error) {
            console.error('❌ 数据解压失败:', error);
            return compressedData;
        }
    }

    /**
     * 缓存装饰器 - 用于API函数
     */
    cached(ttl = null) {
        return (target, propertyName, descriptor) => {
            const method = descriptor.value;

            descriptor.value = async function(...args) {
                const cacheKey = this.generateCacheKey(
                    'POST',
                    propertyName,
                    { args: args }
                );

                // 尝试从缓存获取
                let result = await this.get(cacheKey);
                if (result !== null) {
                    console.log(`🎯 缓存命中: ${propertyName}`);
                    return result;
                }

                // 执行原方法
                console.log(`⚡ 执行方法: ${propertyName}`);
                result = await method.apply(this, args);

                // 缓存结果
                await this.set(cacheKey, result, ttl);

                return result;
            };

            return descriptor;
        };
    }

    /**
     * 缓存统计
     */
    getStats() {
        const hitRate = this.cacheStats.hits / (this.cacheStats.hits + this.cacheStats.misses) * 100;

        return {
            ...this.cacheStats,
            hitRate: hitRate.toFixed(2) + '%',
            memoryCacheSize: this.memoryCache.size,
            memoryUsage: process.memoryUsage()
        };
    }

    /**
     * 清理过期缓存
     */
    cleanup() {
        const now = Date.now();

        // 清理内存缓存
        for (const [key, item] of this.memoryCache.entries()) {
            if (now > item.expiryTime) {
                this.memoryCache.delete(key);
            }
        }

        // TODO: 清理文件缓存
        this.cleanupFileCache();
    }

    async cleanupFileCache() {
        const fs = require('fs').promises;
        const path = require('path');

        try {
            const files = await fs.readdir(this.options.fileCache.directory);
            const now = Date.now();

            for (const file of files) {
                if (file.endsWith('.cache')) {
                    const filePath = path.join(this.options.fileCache.directory, file);
                    try {
                        const data = await fs.readFile(filePath, 'utf8');
                        const cacheItem = JSON.parse(data);

                        if (now > cacheItem.expiryTime) {
                            await fs.unlink(filePath);
                        }
                    } catch (error) {
                        // 删除损坏的缓存文件
                        await fs.unlink(filePath).catch(() => {});
                    }
                }
            }
        } catch (error) {
            console.error('❌ 文件缓存清理失败:', error);
        }
    }

    /**
     * 启动清理定时器
     */
    startCleanupTimer() {
        // 每5分钟清理一次过期缓存
        setInterval(() => {
            this.cleanup();
        }, 5 * 60 * 1000);
    }

    /**
     * 工具方法
     */
    hashObject(obj) {
        return require('crypto')
            .createHash('md5')
            .update(JSON.stringify(obj))
            .digest('hex');
    }

    sortObject(obj) {
        if (typeof obj !== 'object' || obj === null) {
            return obj;
        }

        if (Array.isArray(obj)) {
            return obj.map(this.sortObject.bind(this));
        }

        const sorted = {};
        Object.keys(obj).sort().forEach(key => {
            sorted[key] = this.sortObject(obj[key]);
        });

        return sorted;
    }

    /**
     * 清空所有缓存
     */
    async clear() {
        this.memoryCache.clear();

        if (this.options.fileCache.enabled) {
            const fs = require('fs').promises;
            const path = require('path');

            try {
                const files = await fs.readdir(this.options.fileCache.directory);
                for (const file of files) {
                    if (file.endsWith('.cache')) {
                        await fs.unlink(path.join(this.options.fileCache.directory, file));
                    }
                }
            } catch (error) {
                console.error('❌ 文件缓存清空失败:', error);
            }
        }

        console.log('🧹 所有缓存已清空');
    }
}

/**
 * API缓存中间件 - Express/Node.js
 */
function apiCacheMiddleware(cacheSystem, options = {}) {
    const defaultOptions = {
        ttl: 5 * 60 * 1000, // 5分钟
        keyGenerator: (req) => {
            return cacheSystem.generateCacheKey(
                req.method,
                req.url,
                req.query,
                req.body
            );
        },
        shouldCache: (req) => {
            // 只缓存GET请求和成功的响应
            return req.method === 'GET' && req.statusCode < 400;
        },
        ...options
    };

    return async (req, res, next) => {
        try {
            const cacheKey = defaultOptions.keyGenerator(req);

            // 尝试从缓存获取
            const cachedData = await cacheSystem.get(cacheKey);
            if (cachedData !== null) {
                res.set('X-Cache', 'HIT');
                res.set('X-Cache-Key', cacheKey);
                return res.json(cachedData);
            }

            // 拦截响应
            const originalJson = res.json;
            res.json = function(data) {
                // 缓存成功的响应
                if (defaultOptions.shouldCache(req)) {
                    cacheSystem.set(cacheKey, data, defaultOptions.ttl);
                }

                res.set('X-Cache', 'MISS');
                res.set('X-Cache-Key', cacheKey);
                return originalJson.call(this, data);
            };

            next();

        } catch (error) {
            console.error('❌ 缓存中间件错误:', error);
            next();
        }
    };
}

module.exports = {
    APICacheSystem,
    apiCacheMiddleware
};