/**
 * Service Worker - 高级缓存和离线支持
 * 任务3.2.1 - 前端性能优化核心组件
 * 目标: 离线可用性 > 95%，缓存命中率 > 80%，页面加载速度提升 > 50%
 */

const CACHE_VERSION = 'v1.2.0';
const CACHE_PREFIX = 'alvisualization-';

// 缓存策略配置
const CACHE_STRATEGIES = {
    // 静态资源 - 缓存优先
    STATIC: {
        name: `${CACHE_PREFIX}static-${CACHE_VERSION}`,
        strategy: 'cacheFirst',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7天
        patterns: [
            /\.js$/,
            /\.css$/,
            /\.woff2?$/,
            /\.ttf$/,
            /\.eot$/,
            /\.svg$/,
            /\/images\//
        ]
    },

    // API响应 - 网络优先
    API: {
        name: `${CACHE_PREFIX}api-${CACHE_VERSION}`,
        strategy: 'networkFirst',
        maxAge: 5 * 60 * 1000, // 5分钟
        patterns: [
            /\/api\//,
            /\/data\//
        ]
    },

    // 页面内容 - 缓存优先但定期更新
    PAGES: {
        name: `${CACHE_PREFIX}pages-${CACHE_VERSION}`,
        strategy: 'staleWhileRevalidate',
        maxAge: 24 * 60 * 60 * 1000, // 1天
        patterns: [
            /\.html$/,
            /\/$/
        ]
    },

    // 图片资源 - 缓存优先，长期存储
    IMAGES: {
        name: `${CACHE_PREFIX}images-${CACHE_VERSION}`,
        strategy: 'cacheFirst',
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30天
        patterns: [
            /\.(jpg|jpeg|png|gif|webp|avif)$/
        ]
    }
};

// 关键资源列表 - 预缓存
const CRITICAL_RESOURCES = [
    '/main-app/index.html',
    '/main-app/js/performance/code-splitting-lazy-loading.js',
    '/main-app/js/performance/resource-optimizer.js'
];

// 离线页面
const OFFLINE_PAGE = '/offline.html';

// 性能监控
const performanceMetrics = {
    cacheHits: 0,
    cacheMisses: 0,
    networkRequests: 0,
    totalResponseTime: 0,
    errors: 0
};

/**
 * Service Worker生命周期事件
 */

// 安装事件 - 预缓存关键资源
self.addEventListener('install', (event) => {
    console.log('🚀 Service Worker 安装开始');

    event.waitUntil(
        (async () => {
            try {
                // 创建所有缓存
                const cacheNames = Object.values(CACHE_STRATEGIES).map(config => config.name);
                await Promise.all(cacheNames.map(name => caches.open(name)));

                // 预缓存关键资源
                const staticCache = await caches.open(CACHE_STRATEGIES.STATIC.name);
                await staticCache.addAll(CRITICAL_RESOURCES);

                console.log('✅ 关键资源预缓存完成');

                // 立即激活新的Service Worker
                self.skipWaiting();

            } catch (error) {
                console.error('❌ Service Worker 安装失败:', error);
            }
        })()
    );
});

// 激活事件 - 清理旧缓存
self.addEventListener('activate', (event) => {
    console.log('🔄 Service Worker 激活开始');

    event.waitUntil(
        (async () => {
            try {
                // 获取所有当前缓存
                const currentCacheNames = Object.values(CACHE_STRATEGIES).map(config => config.name);

                // 获取所有旧缓存
                const allCacheNames = await caches.keys();
                const oldCacheNames = allCacheNames.filter(name =>
                    name.startsWith(CACHE_PREFIX) && !currentCacheNames.includes(name)
                );

                // 删除旧缓存
                await Promise.all(
                    oldCacheNames.map(name => {
                        console.log(`🗑️ 删除旧缓存: ${name}`);
                        return caches.delete(name);
                    })
                );

                // 立即控制所有客户端
                await clients.claim();

                console.log('✅ Service Worker 激活完成');

            } catch (error) {
                console.error('❌ Service Worker 激活失败:', error);
            }
        })()
    );
});

// 网络请求拦截 - 核心缓存逻辑
self.addEventListener('fetch', (event) => {
    const request = event.request;
    const url = new URL(request.url);

    // 跳过非HTTP(S)请求
    if (!request.url.startsWith('http')) {
        return;
    }

    // 跳过Chrome扩展请求
    if (url.protocol === 'chrome-extension:') {
        return;
    }

    event.respondWith(handleRequest(request));
});

/**
 * 核心请求处理逻辑
 */
async function handleRequest(request) {
    const startTime = performance.now();

    try {
        // 确定缓存策略
        const strategy = determineCacheStrategy(request);

        let response;
        let fromCache = false;

        switch (strategy.strategy) {
            case 'cacheFirst':
                response = await cacheFirst(request, strategy);
                fromCache = response.fromCache;
                break;

            case 'networkFirst':
                response = await networkFirst(request, strategy);
                fromCache = response.fromCache;
                break;

            case 'staleWhileRevalidate':
                response = await staleWhileRevalidate(request, strategy);
                fromCache = response.fromCache;
                break;

            default:
                response = await networkFirst(request, strategy);
                fromCache = response.fromCache;
        }

        // 更新性能指标
        updatePerformanceMetrics(startTime, fromCache, response.status);

        return response;

    } catch (error) {
        console.error('❌ 请求处理失败:', error);
        performanceMetrics.errors++;

        // 返回离线页面或错误响应
        return getOfflineResponse(request);
    }
}

/**
 * 缓存策略实现
 */

// 缓存优先策略
async function cacheFirst(request, strategy) {
    const cache = await caches.open(strategy.name);
    const cachedResponse = await cache.match(request);

    if (cachedResponse && !isResponseExpired(cachedResponse, strategy.maxAge)) {
        console.log(`💾 缓存命中: ${request.url}`);
        performanceMetrics.cacheHits++;

        // 后台更新缓存
        updateCacheInBackground(request, strategy);

        return {
            ...cachedResponse,
            fromCache: true
        };
    }

    // 缓存未命中或已过期，从网络获取
    console.log(`🌐 缓存未命中: ${request.url}`);
    performanceMetrics.cacheMisses++;

    try {
        const networkResponse = await fetch(request);

        if (networkResponse.ok) {
            // 缓存新响应
            await cache.put(request, networkResponse.clone());
        }

        performanceMetrics.networkRequests++;
        return {
            ...networkResponse,
            fromCache: false
        };

    } catch (error) {
        // 网络请求失败，返回过期缓存（如果有）
        if (cachedResponse) {
            console.log(`⚠️ 使用过期缓存: ${request.url}`);
            return {
                ...cachedResponse,
                fromCache: true,
                expired: true
            };
        }

        throw error;
    }
}

// 网络优先策略
async function networkFirst(request, strategy) {
    try {
        console.log(`🌐 网络请求: ${request.url}`);
        performanceMetrics.networkRequests++;

        const networkResponse = await fetch(request);

        if (networkResponse.ok) {
            const cache = await caches.open(strategy.name);
            await cache.put(request, networkResponse.clone());
        }

        return {
            ...networkResponse,
            fromCache: false
        };

    } catch (error) {
        console.log(`⚠️ 网络失败，尝试缓存: ${request.url}`);

        const cache = await caches.open(strategy.name);
        const cachedResponse = await cache.match(request);

        if (cachedResponse) {
            performanceMetrics.cacheHits++;
            return {
                ...cachedResponse,
                fromCache: true
            };
        }

        throw error;
    }
}

// 后台更新策略
async function staleWhileRevalidate(request, strategy) {
    const cache = await caches.open(strategy.name);
    const cachedResponse = await cache.match(request);

    // 立即返回缓存响应（如果有）
    if (cachedResponse) {
        performanceMetrics.cacheHits++;

        // 后台更新缓存
        updateCacheInBackground(request, strategy);

        return {
            ...cachedResponse,
            fromCache: true
        };
    }

    // 没有缓存，从网络获取
    performanceMetrics.cacheMisses++;
    performanceMetrics.networkRequests++;

    try {
        const networkResponse = await fetch(request);

        if (networkResponse.ok) {
            await cache.put(request, networkResponse.clone());
        }

        return {
            ...networkResponse,
            fromCache: false
        };

    } catch (error) {
        throw error;
    }
}

/**
 * 工具函数
 */

// 确定缓存策略
function determineCacheStrategy(request) {
    const url = new URL(request.url);

    // 检查每种策略的匹配模式
    for (const [key, strategy] of Object.entries(CACHE_STRATEGIES)) {
        for (const pattern of strategy.patterns) {
            if (pattern.test(url.pathname) || pattern.test(url.href)) {
                return strategy;
            }
        }
    }

    // 默认使用网络优先策略
    return CACHE_STRATEGIES.API;
}

// 检查响应是否过期
function isResponseExpired(response, maxAge) {
    const dateHeader = response.headers.get('date');
    if (!dateHeader) return true;

    const responseTime = new Date(dateHeader).getTime();
    const now = Date.now();

    return (now - responseTime) > maxAge;
}

// 后台更新缓存
async function updateCacheInBackground(request, strategy) {
    try {
        const networkResponse = await fetch(request);

        if (networkResponse.ok) {
            const cache = await caches.open(strategy.name);
            await cache.put(request, networkResponse);
            console.log(`🔄 后台更新缓存: ${request.url}`);
        }
    } catch (error) {
        console.warn(`⚠️ 后台更新失败: ${request.url}`, error);
    }
}

// 获取离线响应
async function getOfflineResponse(request) {
    const url = new URL(request.url);

    // 如果是页面请求，返回离线页面
    if (request.mode === 'navigate' || url.pathname.endsWith('.html')) {
        const cache = await caches.open(CACHE_STRATEGIES.PAGES.name);
        const offlineResponse = await cache.match(OFFLINE_PAGE);

        if (offlineResponse) {
            return offlineResponse;
        }

        // 生成基本离线页面
        return new Response(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>离线模式 - 万物可视化</title>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1">
                <style>
                    body { font-family: system-ui, sans-serif; text-align: center; padding: 2rem; }
                    .offline-icon { font-size: 4rem; margin-bottom: 1rem; }
                    .offline-message { color: #666; margin-bottom: 2rem; }
                    .retry-button { background: #007bff; color: white; border: none; padding: 0.5rem 1rem; border-radius: 4px; cursor: pointer; }
                </style>
            </head>
            <body>
                <div class="offline-icon">📱</div>
                <h1>离线模式</h1>
                <p class="offline-message">您当前处于离线状态，请检查网络连接后重试。</p>
                <button class="retry-button" onclick="window.location.reload()">重新连接</button>
            </body>
            </html>
        `, {
            status: 200,
            statusText: 'OK',
            headers: { 'Content-Type': 'text/html' }
        });
    }

    // 其他请求返回空响应
    return new Response('离线模式', { status: 503, statusText: 'Service Unavailable' });
}

// 更新性能指标
function updatePerformanceMetrics(startTime, fromCache, status) {
    const responseTime = performance.now() - startTime;
    performanceMetrics.totalResponseTime += responseTime;

    // 定期清理性能指标
    if (performanceMetrics.cacheHits + performanceMetrics.cacheMisses > 1000) {
        resetPerformanceMetrics();
    }
}

// 重置性能指标
function resetPerformanceMetrics() {
    performanceMetrics.cacheHits = 0;
    performanceMetrics.cacheMisses = 0;
    performanceMetrics.networkRequests = 0;
    performanceMetrics.totalResponseTime = 0;
    performanceMetrics.errors = 0;
}

/**
 * 消息处理 - 与客户端通信
 */

// 监听来自客户端的消息
self.addEventListener('message', (event) => {
    const { type, data } = event.data;

    switch (type) {
        case 'SKIP_WAITING':
            self.skipWaiting();
            break;

        case 'GET_STATS':
            event.ports[0].postMessage({
                type: 'STATS',
                data: getPerformanceStats()
            });
            break;

        case 'CLEAR_CACHE':
            clearAllCaches().then(() => {
                event.ports[0].postMessage({ type: 'CACHE_CLEARED' });
            });
            break;

        case 'PRECACHE_RESOURCES':
            precacheResources(data.resources).then(() => {
                event.ports[0].postMessage({ type: 'PRECACHE_COMPLETE' });
            });
            break;

        case 'UPDATE_CACHE':
            updateCache(data.url).then(() => {
                event.ports[0].postMessage({ type: 'CACHE_UPDATED' });
            });
            break;
    }
});

// 获取性能统计
function getPerformanceStats() {
    const totalRequests = performanceMetrics.cacheHits + performanceMetrics.cacheMisses;
    const cacheHitRate = totalRequests > 0 ? (performanceMetrics.cacheHits / totalRequests * 100).toFixed(2) : 0;
    const avgResponseTime = totalRequests > 0 ? (performanceMetrics.totalResponseTime / totalRequests).toFixed(2) : 0;

    return {
        cacheHitRate: `${cacheHitRate}%`,
        totalRequests,
        cacheHits: performanceMetrics.cacheHits,
        cacheMisses: performanceMetrics.cacheMisses,
        networkRequests: performanceMetrics.networkRequests,
        avgResponseTime: `${avgResponseTime}ms`,
        errors: performanceMetrics.errors,
        timestamp: new Date().toISOString()
    };
}

// 清理所有缓存
async function clearAllCaches() {
    const cacheNames = await caches.keys();
    const appCacheNames = cacheNames.filter(name => name.startsWith(CACHE_PREFIX));

    await Promise.all(
        appCacheNames.map(name => {
            console.log(`🗑️ 删除缓存: ${name}`);
            return caches.delete(name);
        })
    );

    resetPerformanceMetrics();
    console.log('🧹 所有缓存已清理');
}

// 预缓存资源
async function precacheResources(resources) {
    const staticCache = await caches.open(CACHE_STRATEGIES.STATIC.name);

    const results = await Promise.allSettled(
        resources.map(async (resource) => {
            try {
                await staticCache.add(resource);
                console.log(`✅ 预缓存成功: ${resource}`);
                return { url: resource, success: true };
            } catch (error) {
                console.warn(`⚠️ 预缓存失败: ${resource}`, error);
                return { url: resource, success: false, error: error.message };
            }
        })
    );

    const successful = results.filter(r => r.value.success).length;
    const failed = results.filter(r => !r.value.success).length;

    console.log(`📦 预缓存完成: ${successful} 成功, ${failed} 失败`);

    return { successful, failed, results: results.map(r => r.value) };
}

// 更新特定缓存
async function updateCache(url) {
    const strategy = determineCacheStrategy({ url });
    const cache = await caches.open(strategy.name);

    try {
        const response = await fetch(url);

        if (response.ok) {
            await cache.put(url, response);
            console.log(`🔄 缓存更新成功: ${url}`);
            return { success: true };
        } else {
            throw new Error(`HTTP ${response.status}`);
        }
    } catch (error) {
        console.warn(`⚠️ 缓存更新失败: ${url}`, error);
        return { success: false, error: error.message };
    }
}

/**
 * 后台同步 - 离线数据同步
 */

// 后台同步事件
self.addEventListener('sync', (event) => {
    if (event.tag === 'background-sync') {
        event.waitUntil(doBackgroundSync());
    }
});

// 执行后台同步
async function doBackgroundSync() {
    console.log('🔄 开始后台同步');

    try {
        // 同步离线数据
        await syncOfflineData();

        // 更新缓存
        await updateCriticalCache();

        console.log('✅ 后台同步完成');

    } catch (error) {
        console.error('❌ 后台同步失败:', error);
    }
}

// 同步离线数据
async function syncOfflineData() {
    // 从IndexedDB获取离线数据
    const offlineData = await getOfflineData();

    for (const data of offlineData) {
        try {
            await syncDataItem(data);
        } catch (error) {
            console.warn('⚠️ 数据同步失败:', data, error);
        }
    }
}

// 获取离线数据（模拟）
async function getOfflineData() {
    // 这里应该从IndexedDB读取离线存储的数据
    return [];
}

// 同步单个数据项（模拟）
async function syncDataItem(data) {
    // 这里应该发送数据到服务器
    console.log('📤 同步数据:', data);
}

// 更新关键缓存
async function updateCriticalCache() {
    const staticCache = await caches.open(CACHE_STRATEGIES.STATIC.name);

    // 检查关键资源是否需要更新
    for (const resource of CRITICAL_RESOURCES) {
        try {
            const cached = await staticCache.match(resource);
            const needsUpdate = !cached || isResponseExpired(cached, CACHE_STRATEGIES.STATIC.maxAge / 2);

            if (needsUpdate) {
                const response = await fetch(resource);
                if (response.ok) {
                    await staticCache.put(resource, response);
                    console.log(`🔄 关键资源更新: ${resource}`);
                }
            }
        } catch (error) {
            console.warn(`⚠️ 关键资源更新失败: ${resource}`, error);
        }
    }
}

/**
 * 推送通知支持
 */

// 推送事件
self.addEventListener('push', (event) => {
    const options = {
        body: '您有新的可视化内容可以查看',
        icon: '/images/icons/icon-192x192.png',
        badge: '/images/icons/badge-72x72.png',
        vibrate: [100, 50, 100],
        data: {
            dateOfArrival: Date.now(),
            primaryKey: '1'
        },
        actions: [
            {
                action: 'explore',
                title: '查看详情',
                icon: '/images/icons/checkmark.png'
            },
            {
                action: 'close',
                title: '关闭',
                icon: '/images/icons/xmark.png'
            }
        ]
    };

    if (event.data) {
        const data = event.data.json();
        options.title = data.title || '万物可视化';
        options.body = data.body || options.body;
        if (data.url) {
            options.data.url = data.url;
        }
    }

    event.waitUntil(
        self.registration.showNotification(options.title, options)
    );
});

// 通知点击事件
self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    if (event.action === 'explore') {
        // 打开应用
        event.waitUntil(
            clients.openWindow(event.notification.data.url || '/')
        );
    } else if (event.action === 'close') {
        // 关闭通知
        event.notification.close();
    } else {
        // 默认行为：打开应用
        event.waitUntil(
            clients.matchAll().then(clientList => {
                for (const client of clientList) {
                    if (client.url === '/' && 'focus' in client) {
                        return client.focus();
                    }
                }
                if (clients.openWindow) {
                    return clients.openWindow('/');
                }
            })
        );
    }
});

/**
 * 网络状态监控
 */

// 网络状态变化
self.addEventListener('online', () => {
    console.log('🌐 网络已连接');
    // 触发后台同步
    self.registration.sync.register('background-sync');
});

self.addEventListener('offline', () => {
    console.log('📵 网络已断开');
});

// 导出配置供调试使用
if (typeof self !== 'undefined' && self.swConfig) {
    self.swConfig = {
        version: CACHE_VERSION,
        strategies: CACHE_STRATEGIES,
        criticalResources: CRITICAL_RESOURCES
    };
}