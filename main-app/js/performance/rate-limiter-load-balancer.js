/**
 * 请求限流和负载均衡系统
 * 任务3.2.2 - 后端性能优化核心组件
 * 目标: 系统可用性 > 99.5%, 支持并发用户 > 100
 */

class RateLimiter {
    constructor(options = {}) {
        this.options = {
            windowMs: 60 * 1000, // 1分钟窗口
            maxRequests: 100,    // 每分钟最大请求数
            skipSuccessfulRequests: false,
            skipFailedRequests: false,
            keyGenerator: (req) => {
                return req.ip || req.connection.remoteAddress || 'unknown';
            },
            ...options
        };

        // 请求计数器存储
        this.clients = new Map();
        this.stats = {
            totalRequests: 0,
            blockedRequests: 0,
            activeClients: 0
        };

        this.initCleanupTimer();
    }

    /**
     * 检查请求是否被允许
     */
    isAllowed(key) {
        const now = Date.now();
        const windowStart = now - this.options.windowMs;

        let clientData = this.clients.get(key);
        if (!clientData) {
            clientData = {
                requests: [],
                resetTime: now + this.options.windowMs
            };
            this.clients.set(key, clientData);
            this.stats.activeClients++;
        }

        // 清理过期请求
        clientData.requests = clientData.requests.filter(
            timestamp => timestamp > windowStart
        );

        // 检查是否超过限制
        if (clientData.requests.length >= this.options.maxRequests) {
            this.stats.blockedRequests++;
            return {
                allowed: false,
                remaining: 0,
                resetTime: clientData.resetTime,
                retryAfter: Math.ceil((clientData.resetTime - now) / 1000)
            };
        }

        // 记录新请求
        clientData.requests.push(now);
        this.stats.totalRequests++;

        return {
            allowed: true,
            remaining: this.options.maxRequests - clientData.requests.length,
            resetTime: clientData.resetTime
        };
    }

    /**
     * Express中间件
     */
    middleware() {
        return (req, res, next) => {
            try {
                const key = this.options.keyGenerator(req);
                const result = this.isAllowed(key);

                // 设置响应头
                res.set({
                    'X-RateLimit-Limit': this.options.maxRequests,
                    'X-RateLimit-Remaining': result.remaining,
                    'X-RateLimit-Reset': Math.ceil(result.resetTime / 1000)
                });

                if (!result.allowed) {
                    res.set('Retry-After', result.retryAfter);
                    return res.status(429).json({
                        error: 'Too Many Requests',
                        message: `Rate limit exceeded. Try again in ${result.retryAfter} seconds.`,
                        retryAfter: result.retryAfter
                    });
                }

                next();

            } catch (error) {
                console.error('❌ 限流中间件错误:', error);
                next();
            }
        };
    }

    /**
     * 定时清理过期客户端数据
     */
    initCleanupTimer() {
        setInterval(() => {
            const now = Date.now();
            const windowStart = now - this.options.windowMs;
            let cleanedCount = 0;

            for (const [key, clientData] of this.clients.entries()) {
                clientData.requests = clientData.requests.filter(
                    timestamp => timestamp > windowStart
                );

                if (clientData.requests.length === 0) {
                    this.clients.delete(key);
                    cleanedCount++;
                }
            }

            this.stats.activeClients = this.clients.size;

            if (cleanedCount > 0) {
                console.log(`🧹 清理了 ${cleanedCount} 个过期客户端数据`);
            }
        }, this.options.windowMs);
    }

    getStats() {
        return {
            ...this.stats,
            activeClients: this.clients.size,
            averageRequestsPerClient: this.stats.totalRequests / Math.max(this.stats.activeClients, 1)
        };
    }

    reset() {
        this.clients.clear();
        this.stats = {
            totalRequests: 0,
            blockedRequests: 0,
            activeClients: 0
        };
        console.log('🔄 限流统计已重置');
    }
}

class LoadBalancer {
    constructor(options = {}) {
        this.options = {
            algorithm: 'round-robin', // 'round-robin', 'least-connections', 'weighted', 'ip-hash'
            healthCheck: {
                enabled: true,
                interval: 30 * 1000, // 30秒
                timeout: 5000,       // 5秒超时
                retries: 3
            },
            servers: [], // 服务器列表
            defaultWeight: 100,
            ...options
        };

        this.servers = [];
        this.currentServerIndex = 0;
        this.stats = {
            totalRequests: 0,
            activeConnections: 0,
            failedRequests: 0,
            serverStats: {}
        };

        this.init();
    }

    /**
     * 初始化负载均衡器
     */
    init() {
        // 初始化服务器
        this.options.servers.forEach(serverConfig => {
            this.addServer(serverConfig);
        });

        // 启动健康检查
        if (this.options.healthCheck.enabled) {
            this.startHealthCheck();
        }

        console.log('⚖️ 负载均衡器初始化完成');
    }

    /**
     * 添加服务器
     */
    addServer(serverConfig) {
        const server = {
            id: serverConfig.id || `server_${this.servers.length + 1}`,
            host: serverConfig.host,
            port: serverConfig.port,
            weight: serverConfig.weight || this.options.defaultWeight,
            isHealthy: true,
            currentConnections: 0,
            totalRequests: 0,
            failedRequests: 0,
            lastHealthCheck: null,
            responseTime: 0,
            ...serverConfig
        };

        this.servers.push(server);
        this.stats.serverStats[server.id] = {
            totalRequests: 0,
            failedRequests: 0,
            avgResponseTime: 0
        };

        console.log(`➕ 添加服务器: ${server.id} (${server.host}:${server.port})`);
        return server;
    }

    /**
     * 移除服务器
     */
    removeServer(serverId) {
        const index = this.servers.findIndex(s => s.id === serverId);
        if (index !== -1) {
            const server = this.servers.splice(index, 1)[0];
            delete this.stats.serverStats[serverId];
            console.log(`➖ 移除服务器: ${server.id}`);
            return server;
        }
        return null;
    }

    /**
     * 选择服务器
     */
    selectServer(req = null) {
        const healthyServers = this.servers.filter(server => server.isHealthy);

        if (healthyServers.length === 0) {
            throw new Error('没有可用的健康服务器');
        }

        let selectedServer;

        switch (this.options.algorithm) {
            case 'round-robin':
                selectedServer = this.selectRoundRobin(healthyServers);
                break;

            case 'least-connections':
                selectedServer = this.selectLeastConnections(healthyServers);
                break;

            case 'weighted':
                selectedServer = this.selectWeighted(healthyServers);
                break;

            case 'ip-hash':
                selectedServer = this.selectIpHash(healthyServers, req);
                break;

            default:
                selectedServer = healthyServers[0];
        }

        // 更新统计信息
        selectedServer.totalRequests++;
        selectedServer.currentConnections++;
        this.stats.totalRequests++;
        this.stats.activeConnections++;

        return selectedServer;
    }

    selectRoundRobin(servers) {
        const server = servers[this.currentServerIndex % servers.length];
        this.currentServerIndex++;
        return server;
    }

    selectLeastConnections(servers) {
        return servers.reduce((min, server) =>
            server.currentConnections < min.currentConnections ? server : min
        );
    }

    selectWeighted(servers) {
        const totalWeight = servers.reduce((sum, server) => sum + server.weight, 0);
        let random = Math.random() * totalWeight;

        for (const server of servers) {
            random -= server.weight;
            if (random <= 0) {
                return server;
            }
        }

        return servers[0];
    }

    selectIpHash(servers, req) {
        if (!req || !req.ip) {
            return servers[0];
        }

        const hash = this.hashString(req.ip);
        const index = hash % servers.length;
        return servers[index];
    }

    /**
     * 释放服务器连接
     */
    releaseConnection(server) {
        if (server && server.currentConnections > 0) {
            server.currentConnections--;
            this.stats.activeConnections = Math.max(0, this.stats.activeConnections - 1);
        }
    }

    /**
     * 记录请求失败
     */
    recordFailure(server, error) {
        if (server) {
            server.failedRequests++;
            this.stats.failedRequests++;
        }
    }

    /**
     * 健康检查
     */
    async startHealthCheck() {
        setInterval(async () => {
            await this.checkAllServersHealth();
        }, this.options.healthCheck.interval);

        console.log('🏥 服务器健康检查已启动');
    }

    async checkAllServersHealth() {
        const checkPromises = this.servers.map(server =>
            this.checkServerHealth(server)
        );

        await Promise.allSettled(checkPromises);
    }

    async checkServerHealth(server) {
        try {
            const startTime = Date.now();

            // 模拟健康检查请求
            // 实际实现应该发送HTTP请求到服务器的健康检查端点
            const response = await this.sendHealthCheckRequest(server);

            const responseTime = Date.now() - startTime;
            server.responseTime = responseTime;
            server.lastHealthCheck = new Date().toISOString();

            if (response.status === 'healthy') {
                if (!server.isHealthy) {
                    console.log(`✅ 服务器恢复健康: ${server.id}`);
                    server.isHealthy = true;
                }
            } else {
                throw new Error(`健康检查失败: ${response.message}`);
            }

        } catch (error) {
            if (server.isHealthy) {
                console.warn(`❌ 服务器健康检查失败: ${server.id} - ${error.message}`);
                server.isHealthy = false;
            }
        }
    }

    async sendHealthCheckRequest(server) {
        // 模拟健康检查请求
        // 实际实现应该使用 fetch 或其他HTTP客户端
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                // 模拟90%的健康检查成功率
                if (Math.random() > 0.1) {
                    resolve({ status: 'healthy' });
                } else {
                    reject(new Error('连接超时'));
                }
            }, 100 + Math.random() * 400);
        });
    }

    /**
     * Express中间件
     */
    middleware() {
        return async (req, res, next) => {
            try {
                // 选择服务器
                const server = this.selectServer(req);

                // 在响应头中添加服务器信息
                res.set('X-Served-By', server.id);
                res.set('X-Server-Info', `${server.host}:${server.port}`);

                // 存储服务器信息以便后续使用
                req.selectedServer = server;

                // 在响应结束时释放连接
                res.on('finish', () => {
                    this.releaseConnection(server);
                });

                // 在响应错误时记录失败
                res.on('error', (error) => {
                    this.recordFailure(server, error);
                    this.releaseConnection(server);
                });

                next();

            } catch (error) {
                console.error('❌ 负载均衡器错误:', error);
                res.status(503).json({
                    error: 'Service Unavailable',
                    message: '没有可用的服务器'
                });
            }
        };
    }

    /**
     * 获取统计信息
     */
    getStats() {
        const serverStats = {};

        this.servers.forEach(server => {
            serverStats[server.id] = {
                host: `${server.host}:${server.port}`,
                isHealthy: server.isHealthy,
                currentConnections: server.currentConnections,
                totalRequests: server.totalRequests,
                failedRequests: server.failedRequests,
                successRate: server.totalRequests > 0 ?
                    ((server.totalRequests - server.failedRequests) / server.totalRequests * 100).toFixed(2) + '%' : '0%',
                responseTime: server.responseTime + 'ms',
                lastHealthCheck: server.lastHealthCheck
            };
        });

        return {
            totalRequests: this.stats.totalRequests,
            activeConnections: this.stats.activeConnections,
            failedRequests: this.stats.failedRequests,
            overallSuccessRate: this.stats.totalRequests > 0 ?
                ((this.stats.totalRequests - this.stats.failedRequests) / this.stats.totalRequests * 100).toFixed(2) + '%' : '0%',
            healthyServers: this.servers.filter(s => s.isHealthy).length,
            totalServers: this.servers.length,
            algorithm: this.options.algorithm,
            servers: serverStats
        };
    }

    /**
     * 更新服务器权重
     */
    updateServerWeight(serverId, newWeight) {
        const server = this.servers.find(s => s.id === serverId);
        if (server) {
            server.weight = newWeight;
            console.log(`⚖️ 更新服务器权重: ${serverId} -> ${newWeight}`);
        }
    }

    /**
     * 手动设置服务器健康状态
     */
    setServerHealth(serverId, isHealthy) {
        const server = this.servers.find(s => s.id === serverId);
        if (server) {
            server.isHealthy = isHealthy;
            console.log(`${isHealthy ? '✅' : '❌'} 手动设置服务器状态: ${serverId} -> ${isHealthy ? '健康' : '不健康'}`);
        }
    }

    /**
     * 工具方法
     */
    hashString(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // 转换为32位整数
        }
        return Math.abs(hash);
    }

    /**
     * 重置统计信息
     */
    resetStats() {
        this.stats = {
            totalRequests: 0,
            activeConnections: 0,
            failedRequests: 0,
            serverStats: {}
        };

        this.servers.forEach(server => {
            server.totalRequests = 0;
            server.failedRequests = 0;
            server.currentConnections = 0;
            this.stats.serverStats[server.id] = {
                totalRequests: 0,
                failedRequests: 0,
                avgResponseTime: 0
            };
        });

        console.log('📊 负载均衡器统计已重置');
    }
}

/**
 * 请求管理器 - 整合限流和负载均衡
 */
class RequestManager {
    constructor(options = {}) {
        this.options = {
            rateLimiter: {
                enabled: true,
                windowMs: 60 * 1000,
                maxRequests: 100
            },
            loadBalancer: {
                enabled: true,
                algorithm: 'round-robin'
            },
            circuitBreaker: {
                enabled: true,
                threshold: 5, // 失败阈值
                timeout: 60000 // 熔断超时时间
            },
            ...options
        };

        // 初始化组件
        if (this.options.rateLimiter.enabled) {
            this.rateLimiter = new RateLimiter(this.options.rateLimiter);
        }

        if (this.options.loadBalancer.enabled) {
            this.loadBalancer = new LoadBalancer(this.options.loadBalancer);
        }

        if (this.options.circuitBreaker.enabled) {
            this.circuitBreaker = new CircuitBreaker(this.options.circuitBreaker);
        }

        console.log('🎛️ 请求管理器初始化完成');
    }

    /**
     * Express中间件
     */
    middleware() {
        const middlewares = [];

        // 添加限流中间件
        if (this.rateLimiter) {
            middlewares.push(this.rateLimiter.middleware());
        }

        // 添加负载均衡中间件
        if (this.loadBalancer) {
            middlewares.push(this.loadBalancer.middleware());
        }

        // 添加熔断器中间件
        if (this.circuitBreaker) {
            middlewares.push(this.circuitBreaker.middleware());
        }

        return middlewares;
    }

    /**
     * 获取综合统计信息
     */
    getStats() {
        const stats = {
            timestamp: new Date().toISOString()
        };

        if (this.rateLimiter) {
            stats.rateLimiter = this.rateLimiter.getStats();
        }

        if (this.loadBalancer) {
            stats.loadBalancer = this.loadBalancer.getStats();
        }

        if (this.circuitBreaker) {
            stats.circuitBreaker = this.circuitBreaker.getState();
        }

        return stats;
    }
}

/**
 * 熔断器
 */
class CircuitBreaker {
    constructor(options = {}) {
        this.options = {
            failureThreshold: options.threshold || 5,
            timeout: options.timeout || 60000,
            monitoringPeriod: 10000, // 监控周期
            ...options
        };

        this.state = 'CLOSED'; // CLOSED, OPEN, HALF_OPEN
        this.failureCount = 0;
        this.lastFailureTime = null;
        this.successCount = 0;

        this.startMonitoring();
    }

    async execute(operation) {
        if (this.state === 'OPEN') {
            if (Date.now() - this.lastFailureTime > this.options.timeout) {
                this.state = 'HALF_OPEN';
                this.successCount = 0;
                console.log('🔓 熔断器进入半开状态');
            } else {
                throw new Error('熔断器开启状态，拒绝请求');
            }
        }

        try {
            const result = await operation();
            this.onSuccess();
            return result;

        } catch (error) {
            this.onFailure();
            throw error;
        }
    }

    onSuccess() {
        if (this.state === 'HALF_OPEN') {
            this.successCount++;
            if (this.successCount >= 3) { // 连续成功3次后关闭熔断器
                this.state = 'CLOSED';
                this.failureCount = 0;
                console.log('✅ 熔断器已关闭');
            }
        } else {
            this.failureCount = 0;
        }
    }

    onFailure() {
        this.failureCount++;
        this.lastFailureTime = Date.now();

        if (this.failureCount >= this.options.failureThreshold) {
            this.state = 'OPEN';
            console.warn('⚠️ 熔断器已开启');
        }
    }

    middleware() {
        return (req, res, next) => {
            if (this.state === 'OPEN') {
                return res.status(503).json({
                    error: 'Service Unavailable',
                    message: '服务暂时不可用，请稍后重试'
                });
            }
            next();
        };
    }

    getState() {
        return {
            state: this.state,
            failureCount: this.failureCount,
            lastFailureTime: this.lastFailureTime,
            successCount: this.successCount
        };
    }

    startMonitoring() {
        setInterval(() => {
            // 监控熔断器状态
            if (this.state === 'OPEN' &&
                Date.now() - this.lastFailureTime > this.options.timeout) {
                this.state = 'HALF_OPEN';
                this.successCount = 0;
                console.log('🔓 熔断器自动进入半开状态');
            }
        }, this.options.monitoringPeriod);
    }

    reset() {
        this.state = 'CLOSED';
        this.failureCount = 0;
        this.lastFailureTime = null;
        this.successCount = 0;
        console.log('🔄 熔断器已重置');
    }
}

module.exports = {
    RateLimiter,
    LoadBalancer,
    RequestManager,
    CircuitBreaker
};