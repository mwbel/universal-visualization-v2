/**
 * 数据库查询性能优化系统
 * 任务3.2.2 - 后端性能优化核心组件
 * 目标: 查询响应时间 < 200ms, 连接池利用率 > 80%
 */

class DatabaseOptimizer {
    constructor(options = {}) {
        this.options = {
            connectionPool: {
                min: 5,
                max: 20,
                acquireTimeoutMillis: 60000,
                createTimeoutMillis: 30000,
                destroyTimeoutMillis: 5000,
                idleTimeoutMillis: 30000,
                reapIntervalMillis: 1000,
                createRetryIntervalMillis: 100
            },
            queryCache: {
                enabled: true,
                maxSize: 1000,
                ttl: 10 * 60 * 1000, // 10分钟
                keyPrefix: 'db_query:'
            },
            queryOptimization: {
                enabled: true,
                slowQueryThreshold: 1000, // 1秒
                logSlowQueries: true,
                explainQueries: false
            },
            indexing: {
                enabled: true,
                autoAnalyze: true,
                suggestIndexes: true
            },
            monitoring: {
                enabled: true,
                collectMetrics: true,
                alertThresholds: {
                    slowQueryCount: 10,
                    connectionPoolUsage: 0.8,
                    errorRate: 0.05
                }
            },
            ...options
        };

        // 性能指标
        this.metrics = {
            queryCount: 0,
            slowQueries: 0,
            cacheHits: 0,
            cacheMisses: 0,
            errors: 0,
            avgQueryTime: 0,
            connectionPoolUsage: 0,
            indexHitRate: 0
        };

        // 查询缓存
        this.queryCache = new Map();

        // 慢查询日志
        this.slowQueryLog = [];

        this.init();
    }

    async init() {
        try {
            // 初始化连接池
            await this.initConnectionPool();

            // 初始化查询监控
            if (this.options.monitoring.enabled) {
                this.initMonitoring();
            }

            // 分析现有索引
            if (this.options.indexing.enabled && this.options.indexing.autoAnalyze) {
                await this.analyzeIndexes();
            }

            console.log('🗄️ 数据库优化器初始化完成');

        } catch (error) {
            console.error('❌ 数据库优化器初始化失败:', error);
        }
    }

    /**
     * 初始化连接池
     */
    async initConnectionPool() {
        // 这里应该根据实际数据库类型初始化连接池
        // 例如使用 pg、mysql2、mongoose 等库
        console.log('🔗 数据库连接池初始化（模拟）');

        // 模拟连接池状态
        this.connectionPool = {
            total: this.options.connectionPool.max,
            active: 0,
            idle: this.options.connectionPool.min,
            waiting: 0
        };
    }

    /**
     * 执行优化查询
     */
    async query(sql, params = [], options = {}) {
        const startTime = Date.now();
        const queryId = this.generateQueryId();

        try {
            // 1. 检查查询缓存
            if (this.options.queryCache.enabled && this.isCacheableQuery(sql)) {
                const cacheKey = this.generateCacheKey(sql, params);
                const cachedResult = await this.getQueryCache(cacheKey);

                if (cachedResult !== null) {
                    this.metrics.cacheHits++;
                    this.recordQueryMetrics(sql, Date.now() - startTime, true);
                    return cachedResult;
                }

                this.metrics.cacheMisses++;
            }

            // 2. 获取数据库连接
            const connection = await this.getConnection();

            // 3. 执行查询
            const result = await this.executeQuery(connection, sql, params, options);

            // 4. 释放连接
            this.releaseConnection(connection);

            // 5. 缓存结果
            if (this.options.queryCache.enabled && this.isCacheableQuery(sql)) {
                const cacheKey = this.generateCacheKey(sql, params);
                await this.setQueryCache(cacheKey, result);
            }

            // 6. 记录性能指标
            const queryTime = Date.now() - startTime;
            this.recordQueryMetrics(sql, queryTime, false);

            // 7. 检查慢查询
            if (queryTime > this.options.queryOptimization.slowQueryThreshold) {
                this.logSlowQuery(sql, params, queryTime);
            }

            return result;

        } catch (error) {
            this.metrics.errors++;
            console.error('❌ 查询执行失败:', error);
            throw error;
        }
    }

    /**
     * 连接池管理
     */
    async getConnection() {
        // 模拟连接获取
        if (this.connectionPool.idle > 0) {
            this.connectionPool.idle--;
            this.connectionPool.active++;
            return { id: `conn_${Date.now()}` };
        }

        // 如果没有空闲连接，等待或创建新连接
        if (this.connectionPool.active < this.connectionPool.total) {
            this.connectionPool.active++;
            return { id: `conn_${Date.now()}` };
        }

        // 等待连接可用
        this.connectionPool.waiting++;
        throw new Error('连接池已满，请稍后重试');
    }

    releaseConnection(connection) {
        this.connectionPool.active--;
        this.connectionPool.idle++;

        if (this.connectionPool.waiting > 0) {
            this.connectionPool.waiting--;
            this.connectionPool.active++;
        }
    }

    /**
     * 执行SQL查询
     */
    async executeQuery(connection, sql, params, options) {
        // 这里应该执行实际的数据库查询
        // 模拟查询执行
        console.log(`🔍 执行查询: ${sql.substring(0, 50)}...`);

        // 模拟查询延迟
        await new Promise(resolve => setTimeout(resolve, Math.random() * 100));

        // 模拟查询结果
        return {
            rows: [],
            rowCount: 0,
            queryId: this.generateQueryId()
        };
    }

    /**
     * 查询缓存管理
     */
    generateCacheKey(sql, params) {
        const keyData = {
            sql: sql.trim().toLowerCase(),
            params: params
        };

        return this.options.queryCache.keyPrefix +
               require('crypto')
                   .createHash('md5')
                   .update(JSON.stringify(keyData))
                   .digest('hex');
    }

    async getQueryCache(key) {
        const item = this.queryCache.get(key);
        if (!item) return null;

        if (Date.now() > item.expiryTime) {
            this.queryCache.delete(key);
            return null;
        }

        return item.data;
    }

    async setQueryCache(key, data) {
        // 检查缓存大小限制
        if (this.queryCache.size >= this.options.queryCache.maxSize) {
            this.evictOldestCache();
        }

        this.queryCache.set(key, {
            data: data,
            timestamp: Date.now(),
            expiryTime: Date.now() + this.options.queryCache.ttl
        });
    }

    evictOldestCache() {
        const firstKey = this.queryCache.keys().next().value;
        if (firstKey) {
            this.queryCache.delete(firstKey);
        }
    }

    isCacheableQuery(sql) {
        const normalizedSql = sql.trim().toLowerCase();

        // 只缓存SELECT查询
        if (!normalizedSql.startsWith('select')) {
            return false;
        }

        // 不缓存包含函数或计算的查询
        const excludePatterns = [
            'random()', 'now()', 'current_timestamp',
            'uuid_generate', 'sleep('
        ];

        return !excludePatterns.some(pattern =>
            normalizedSql.includes(pattern)
        );
    }

    /**
     * 慢查询日志
     */
    logSlowQuery(sql, params, queryTime) {
        this.metrics.slowQueries++;

        const slowQuery = {
            timestamp: new Date().toISOString(),
            sql: sql,
            params: params,
            queryTime: queryTime,
            queryId: this.generateQueryId()
        };

        this.slowQueryLog.push(slowQuery);

        // 保持慢查询日志大小
        if (this.slowQueryLog.length > 1000) {
            this.slowQueryLog = this.slowQueryLog.slice(-500);
        }

        console.warn(`⚠️ 慢查询检测 (${queryTime}ms):`, sql.substring(0, 100));

        // 如果启用了查询解释，自动分析
        if (this.options.queryOptimization.explainQueries) {
            this.explainQuery(sql, params);
        }
    }

    /**
     * 查询性能分析
     */
    async explainQuery(sql, params) {
        try {
            const explainSql = `EXPLAIN (ANALYZE, BUFFERS) ${sql}`;
            const explainResult = await this.query(explainSql, params);

            console.log('📊 查询执行计划:', explainResult);

            // 分析执行计划并提供建议
            this.analyzeExecutionPlan(explainResult);

        } catch (error) {
            console.error('❌ 查询解释失败:', error);
        }
    }

    analyzeExecutionPlan(explainResult) {
        // 分析执行计划并提供优化建议
        const suggestions = [];

        // 检查全表扫描
        if (explainResult.includes('Seq Scan')) {
            suggestions.push('考虑添加索引以避免全表扫描');
        }

        // 检查排序操作
        if (explainResult.includes('Sort')) {
            suggestions.push('考虑添加排序索引或优化ORDER BY子句');
        }

        // 检查哈希连接
        if (explainResult.includes('Hash Join')) {
            suggestions.push('考虑优化连接条件或增加连接索引');
        }

        if (suggestions.length > 0) {
            console.log('💡 性能优化建议:', suggestions);
        }
    }

    /**
     * 索引分析和管理
     */
    async analyzeIndexes() {
        console.log('🔍 分析数据库索引使用情况...');

        // 模拟索引分析
        const indexAnalysis = {
            unusedIndexes: [],
            missingIndexes: [],
            duplicatedIndexes: []
        };

        // 检查未使用的索引
        // 这里应该查询实际的数据库统计信息

        // 检查缺失的索引
        const missingIndexes = await this.suggestMissingIndexes();
        indexAnalysis.missingIndexes = missingIndexes;

        console.log('📈 索引分析结果:', indexAnalysis);
        return indexAnalysis;
    }

    async suggestMissingIndexes() {
        // 分析慢查询日志，建议缺失的索引
        const suggestions = [];

        // 简单的索引建议逻辑
        this.slowQueryLog.forEach(query => {
            if (query.sql.includes('WHERE') && !query.sql.includes('INDEX')) {
                // 提取WHERE条件中的列
                const whereMatch = query.sql.match(/WHERE\s+([^\\s]+)/i);
                if (whereMatch) {
                    suggestions.push({
                        table: 'unknown_table',
                        column: whereMatch[1],
                        reason: '慢查询WHERE条件',
                        queryId: query.queryId
                    });
                }
            }
        });

        return suggestions;
    }

    /**
     * 性能监控
     */
    initMonitoring() {
        // 每30秒收集一次性能指标
        setInterval(() => {
            this.collectMetrics();
        }, 30000);

        // 每5分钟生成性能报告
        setInterval(() => {
            this.generatePerformanceReport();
        }, 5 * 60 * 1000);
    }

    collectMetrics() {
        this.metrics.connectionPoolUsage =
            this.connectionPool.active / this.connectionPool.total;

        // 检查告警阈值
        this.checkAlertThresholds();
    }

    checkAlertThresholds() {
        const thresholds = this.options.monitoring.alertThresholds;

        if (this.metrics.connectionPoolUsage > thresholds.connectionPoolUsage) {
            console.warn('⚠️ 连接池使用率过高:',
                `${(this.metrics.connectionPoolUsage * 100).toFixed(1)}%`);
        }

        if (this.slowQueryLog.length > thresholds.slowQueryCount) {
            console.warn('⚠️ 慢查询数量过多:', this.slowQueryLog.length);
        }

        const errorRate = this.metrics.errors / (this.metrics.queryCount || 1);
        if (errorRate > thresholds.errorRate) {
            console.warn('⚠️ 查询错误率过高:', `${(errorRate * 100).toFixed(1)}%`);
        }
    }

    generatePerformanceReport() {
        const report = {
            timestamp: new Date().toISOString(),
            metrics: { ...this.metrics },
            connectionPool: { ...this.connectionPool },
            cacheStats: {
                size: this.queryCache.size,
                hitRate: this.calculateCacheHitRate()
            },
            slowQueries: this.slowQueryLog.slice(-10), // 最近10个慢查询
            recommendations: this.generateRecommendations()
        };

        console.log('📊 数据库性能报告:', report);
        return report;
    }

    calculateCacheHitRate() {
        const total = this.metrics.cacheHits + this.metrics.cacheMisses;
        return total > 0 ? (this.metrics.cacheHits / total * 100).toFixed(2) + '%' : '0%';
    }

    generateRecommendations() {
        const recommendations = [];

        if (this.metrics.connectionPoolUsage > 0.8) {
            recommendations.push('考虑增加连接池大小');
        }

        if (this.calculateCacheHitRate() < '50%') {
            recommendations.push('考虑增加查询缓存大小或TTL');
        }

        if (this.metrics.slowQueries > 10) {
            recommendations.push('存在慢查询，建议优化SQL或添加索引');
        }

        return recommendations;
    }

    /**
     * 工具方法
     */
    generateQueryId() {
        return `query_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    recordQueryMetrics(sql, queryTime, fromCache) {
        this.metrics.queryCount++;

        if (!fromCache) {
            // 更新平均查询时间
            const totalQueryTime = this.metrics.avgQueryTime * (this.metrics.queryCount - 1);
            this.metrics.avgQueryTime = (totalQueryTime + queryTime) / this.metrics.queryCount;
        }
    }

    /**
     * 数据库健康检查
     */
    async healthCheck() {
        try {
            const startTime = Date.now();
            await this.query('SELECT 1');
            const responseTime = Date.now() - startTime;

            return {
                status: 'healthy',
                responseTime: responseTime,
                connectionPool: {
                    active: this.connectionPool.active,
                    idle: this.connectionPool.idle,
                    total: this.connectionPool.total
                },
                cacheHitRate: this.calculateCacheHitRate(),
                metrics: this.metrics
            };

        } catch (error) {
            return {
                status: 'unhealthy',
                error: error.message,
                timestamp: new Date().toISOString()
            };
        }
    }

    /**
     * 清理缓存
     */
    clearCache() {
        this.queryCache.clear();
        console.log('🧹 数据库查询缓存已清空');
    }

    /**
     * 重置统计信息
     */
    resetMetrics() {
        this.metrics = {
            queryCount: 0,
            slowQueries: 0,
            cacheHits: 0,
            cacheMisses: 0,
            errors: 0,
            avgQueryTime: 0,
            connectionPoolUsage: 0,
            indexHitRate: 0
        };

        this.slowQueryLog = [];
        console.log('📊 数据库性能统计已重置');
    }
}

/**
 * 数据库查询装饰器
 */
function optimizedQuery(options = {}) {
    return function(target, propertyName, descriptor) {
        const method = descriptor.value;

        descriptor.value = async function(...args) {
            // 如果有DatabaseOptimizer实例，使用优化查询
            if (this.dbOptimizer) {
                const sql = args[0];
                const params = args[1] || [];

                return await this.dbOptimizer.query(sql, params, options);
            }

            // 否则使用原方法
            return await method.apply(this, args);
        };

        return descriptor;
    };
}

module.exports = {
    DatabaseOptimizer,
    optimizedQuery
};