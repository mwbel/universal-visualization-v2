/**
 * Service Worker管理器
 * 任务3.2.1 - 前端性能优化核心组件
 * 提供Service Worker注册、更新和通信管理
 */

class ServiceWorkerManager {
    constructor(options = {}) {
        this.options = {
            swUrl: options.swUrl || '/sw.js',
            scope: options.scope || '/',
            autoRegister: options.autoRegister !== false,
            updateInterval: options.updateInterval || 60 * 60 * 1000, // 1小时
            verbose: options.verbose || false,
            enableNotifications: options.enableNotifications !== false,
            enableBackgroundSync: options.enableBackgroundSync !== false,
            ...options
        };

        this.registration = null;
        this.isOnline = navigator.onLine;
        this.updateAvailable = false;
        this.metrics = {
            registrationTime: null,
            lastUpdateTime: null,
            updateCount: 0,
            notificationsSent: 0,
            syncEvents: 0
        };

        // 事件监听器
        this.eventListeners = new Map();

        this.init();
    }

    /**
     * 初始化Service Worker管理器
     */
    async init() {
        try {
            // 检查浏览器支持
            if (!('serviceWorker' in navigator)) {
                console.warn('⚠️ 浏览器不支持Service Worker');
                return;
            }

            // 监听网络状态
            this.initNetworkMonitoring();

            // 自动注册
            if (this.options.autoRegister) {
                await this.register();
            }

            // 启动定期更新检查
            this.startUpdateChecker();

            // 初始化消息通信
            this.initMessageCommunication();

            console.log('🚀 Service Worker管理器初始化完成');

        } catch (error) {
            console.error('❌ Service Worker管理器初始化失败:', error);
        }
    }

    /**
     * 注册Service Worker
     */
    async register() {
        try {
            console.log('📝 注册Service Worker:', this.options.swUrl);

            this.registration = await navigator.serviceWorker.register(this.options.swUrl, {
                scope: this.options.scope
            });

            this.metrics.registrationTime = Date.now();

            // 监听Service Worker事件
            this.registration.addEventListener('updatefound', this.handleUpdateFound.bind(this));
            this.registration.addEventListener('controllerchange', this.handleControllerChange.bind(this));

            // 检查是否已经激活
            if (this.registration.active) {
                console.log('✅ Service Worker已激活');
                this.emit('sw:activated', { registration: this.registration });
            }

            // 等待Service Worker激活
            await this.waitForActivation();

            // 启用后台同步
            if (this.options.enableBackgroundSync) {
                await this.enableBackgroundSync();
            }

            // 请求通知权限
            if (this.options.enableNotifications) {
                await this.requestNotificationPermission();
            }

            console.log('✅ Service Worker注册成功');
            this.emit('sw:registered', { registration: this.registration });

            return this.registration;

        } catch (error) {
            console.error('❌ Service Worker注册失败:', error);
            this.emit('sw:register-error', { error });
            throw error;
        }
    }

    /**
     * 等待Service Worker激活
     */
    async waitForActivation() {
        if (!this.registration || !this.registration.installing) {
            return;
        }

        return new Promise((resolve) => {
            const installingWorker = this.registration.installing;

            installingWorker.addEventListener('statechange', () => {
                if (installingWorker.state === 'activated') {
                    console.log('✅ Service Worker激活完成');
                    this.emit('sw:activated', { registration: this.registration });
                    resolve();
                } else if (installingWorker.state === 'redundant') {
                    console.warn('⚠️ Service Worker安装失败');
                    this.emit('sw:install-failed', { registration: this.registration });
                    resolve();
                }
            });
        });
    }

    /**
     * 处理更新发现
     */
    handleUpdateFound() {
        const newWorker = this.registration.installing;

        console.log('🔄 发现Service Worker更新');

        newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                this.updateAvailable = true;
                console.log('🆕 新的Service Worker可用');
                this.emit('sw:update-available', {
                    newWorker,
                    registration: this.registration
                });

                // 显示更新提示
                this.showUpdateNotification();
            }
        });
    }

    /**
     * 处理控制器变化
     */
    handleControllerChange() {
        console.log('🔄 Service Worker控制器已更新');
        this.updateAvailable = false;
        this.metrics.lastUpdateTime = Date.now();
        this.metrics.updateCount++;

        this.emit('sw:controller-changed', { registration: this.registration });

        // 重新加载页面以应用新版本
        if (this.options.autoReload) {
            window.location.reload();
        }
    }

    /**
     * 应用Service Worker更新
     */
    async applyUpdate() {
        if (!this.updateAvailable || !this.registration.waiting) {
            return false;
        }

        try {
            console.log('🔄 应用Service Worker更新');

            // 发送消息告诉等待中的Service Worker跳过等待
            this.registration.waiting.postMessage({ type: 'SKIP_WAITING' });

            this.updateAvailable = false;
            this.emit('sw:update-applied', { registration: this.registration });

            return true;

        } catch (error) {
            console.error('❌ 应用更新失败:', error);
            return false;
        }
    }

    /**
     * 启动更新检查器
     */
    startUpdateChecker() {
        setInterval(async () => {
            try {
                await this.checkForUpdates();
            } catch (error) {
                console.warn('⚠️ 更新检查失败:', error);
            }
        }, this.options.updateInterval);
    }

    /**
     * 检查Service Worker更新
     */
    async checkForUpdates() {
        if (!this.registration) {
            return false;
        }

        try {
            console.log('🔍 检查Service Worker更新');
            await this.registration.update();

            this.emit('sw:update-checked', { registration: this.registration });
            return true;

        } catch (error) {
            console.warn('⚠️ 更新检查失败:', error);
            this.emit('sw:update-check-failed', { error });
            return false;
        }
    }

    /**
     * 消息通信初始化
     */
    initMessageCommunication() {
        // 监听来自Service Worker的消息
        navigator.serviceWorker.addEventListener('message', (event) => {
            this.handleServiceWorkerMessage(event);
        });
    }

    /**
     * 处理Service Worker消息
     */
    handleServiceWorkerMessage(event) {
        const { type, data } = event.data;

        switch (type) {
            case 'STATS':
                this.emit('sw:stats', data);
                break;

            case 'CACHE_CLEARED':
                this.emit('sw:cache-cleared');
                break;

            case 'PRECACHE_COMPLETE':
                this.emit('sw:precache-complete', data);
                break;

            case 'CACHE_UPDATED':
                this.emit('sw:cache-updated', data);
                break;

            default:
                console.log('📨 收到Service Worker消息:', type, data);
                this.emit('sw:message', { type, data });
        }
    }

    /**
     * 发送消息给Service Worker
     */
    async sendMessage(type, data = {}) {
        if (!this.registration || !this.registration.active) {
            console.warn('⚠️ Service Worker未激活');
            return null;
        }

        return new Promise((resolve) => {
            const messageChannel = new MessageChannel();

            messageChannel.port1.onmessage = (event) => {
                resolve(event.data);
            };

            this.registration.active.postMessage({ type, data }, [messageChannel.port2]);
        });
    }

    /**
     * 获取Service Worker统计信息
     */
    async getStats() {
        try {
            const stats = await this.sendMessage('GET_STATS');

            return {
                ...stats,
                managerMetrics: this.metrics,
                updateAvailable: this.updateAvailable,
                isOnline: this.isOnline
            };
        } catch (error) {
            console.warn('⚠️ 获取统计信息失败:', error);
            return null;
        }
    }

    /**
     * 清理所有缓存
     */
    async clearAllCaches() {
        try {
            const result = await this.sendMessage('CLEAR_CACHE');
            console.log('🧹 缓存清理完成');
            this.emit('sw:cache-cleared', result);
            return result;
        } catch (error) {
            console.error('❌ 缓存清理失败:', error);
            throw error;
        }
    }

    /**
     * 预缓存资源
     */
    async precacheResources(resources) {
        try {
            const result = await this.sendMessage('PRECACHE_RESOURCES', { resources });
            console.log(`📦 资源预缓存完成: ${result.successful} 成功, ${result.failed} 失败`);
            this.emit('sw:precache-complete', result);
            return result;
        } catch (error) {
            console.error('❌ 资源预缓存失败:', error);
            throw error;
        }
    }

    /**
     * 更新特定资源缓存
     */
    async updateCache(url) {
        try {
            const result = await this.sendMessage('UPDATE_CACHE', { url });
            console.log(`🔄 缓存更新: ${url}`, result);
            this.emit('sw:cache-updated', result);
            return result;
        } catch (error) {
            console.error('❌ 缓存更新失败:', error);
            throw error;
        }
    }

    /**
     * 网络状态监控
     */
    initNetworkMonitoring() {
        window.addEventListener('online', () => {
            this.isOnline = true;
            console.log('🌐 网络已连接');
            this.emit('network:online');
        });

        window.addEventListener('offline', () => {
            this.isOnline = false;
            console.log('📵 网络已断开');
            this.emit('network:offline');
        });
    }

    /**
     * 启用后台同步
     */
    async enableBackgroundSync() {
        try {
            if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
                await this.registration.sync.register('background-sync');
                console.log('🔄 后台同步已启用');
                this.emit('sync:enabled');
            } else {
                console.warn('⚠️ 浏览器不支持后台同步');
            }
        } catch (error) {
            console.error('❌ 后台同步启用失败:', error);
        }
    }

    /**
     * 手动触发后台同步
     */
    async triggerBackgroundSync() {
        try {
            await this.registration.sync.register('background-sync');
            console.log('🔄 后台同步已触发');
            this.emit('sync:triggered');
        } catch (error) {
            console.error('❌ 后台同步触发失败:', error);
        }
    }

    /**
     * 请求通知权限
     */
    async requestNotificationPermission() {
        try {
            if ('Notification' in window && Notification.permission === 'default') {
                const permission = await Notification.requestPermission();

                if (permission === 'granted') {
                    console.log('✅ 通知权限已授予');
                    this.emit('notification:permission-granted');
                } else {
                    console.warn('⚠️ 通知权限被拒绝');
                    this.emit('notification:permission-denied');
                }

                return permission;
            }

            return Notification.permission;
        } catch (error) {
            console.error('❌ 通知权限请求失败:', error);
            return 'denied';
        }
    }

    /**
     * 显示更新通知
     */
    showUpdateNotification() {
        if (!this.options.enableNotifications || Notification.permission !== 'granted') {
            return;
        }

        try {
            const notification = new Notification('应用更新可用', {
                body: '点击重新加载应用以获取最新功能',
                icon: '/images/icons/icon-192x192.png',
                badge: '/images/icons/badge-72x72.png',
                tag: 'app-update',
                requireInteraction: true,
                actions: [
                    {
                        action: 'update',
                        title: '立即更新',
                        icon: '/images/icons/checkmark.png'
                    },
                    {
                        action: 'dismiss',
                        title: '稍后',
                        icon: '/images/icons/xmark.png'
                    }
                ]
            });

            notification.onclick = (event) => {
                event.preventDefault();
                notification.close();

                if (event.action === 'update') {
                    this.applyUpdate();
                }
            };

            this.metrics.notificationsSent++;
            console.log('🔔 更新通知已显示');

        } catch (error) {
            console.error('❌ 显示更新通知失败:', error);
        }

        // 同时显示UI更新提示
        this.showUpdateUI();
    }

    /**
     * 显示更新UI提示
     */
    showUpdateUI() {
        // 创建更新提示横幅
        const banner = document.createElement('div');
        banner.className = 'sw-update-banner';
        banner.innerHTML = `
            <div class="update-content">
                <span class="update-icon">🆕</span>
                <span class="update-message">应用有新版本可用</span>
                <div class="update-actions">
                    <button class="update-btn" id="sw-update-apply">立即更新</button>
                    <button class="dismiss-btn" id="sw-update-dismiss">稍后</button>
                </div>
            </div>
        `;

        banner.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 12px 20px;
            z-index: 10000;
            transform: translateY(-100%);
            transition: transform 0.3s ease;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        `;

        const style = document.createElement('style');
        style.textContent = `
            .sw-update-banner .update-content {
                display: flex;
                align-items: center;
                justify-content: space-between;
                max-width: 1200px;
                margin: 0 auto;
            }
            .sw-update-banner .update-icon {
                font-size: 20px;
                margin-right: 10px;
            }
            .sw-update-banner .update-message {
                flex: 1;
                margin: 0 15px;
                font-weight: 500;
            }
            .sw-update-banner .update-actions {
                display: flex;
                gap: 10px;
            }
            .sw-update-banner .update-btn,
            .sw-update-banner .dismiss-btn {
                padding: 6px 12px;
                border: none;
                border-radius: 4px;
                cursor: pointer;
                font-size: 14px;
                transition: all 0.2s ease;
            }
            .sw-update-banner .update-btn {
                background: white;
                color: #667eea;
                font-weight: 600;
            }
            .sw-update-banner .update-btn:hover {
                background: #f8f9fa;
                transform: translateY(-1px);
            }
            .sw-update-banner .dismiss-btn {
                background: rgba(255,255,255,0.2);
                color: white;
            }
            .sw-update-banner .dismiss-btn:hover {
                background: rgba(255,255,255,0.3);
            }
            .sw-update-banner.show {
                transform: translateY(0);
            }
        `;

        document.head.appendChild(style);
        document.body.appendChild(banner);

        // 显示横幅
        setTimeout(() => banner.classList.add('show'), 100);

        // 绑定事件
        document.getElementById('sw-update-apply').onclick = () => {
            this.applyUpdate();
            this.hideUpdateBanner(banner);
        };

        document.getElementById('sw-update-dismiss').onclick = () => {
            this.hideUpdateBanner(banner);
        };

        // 自动隐藏（10秒后）
        setTimeout(() => {
            if (document.body.contains(banner)) {
                this.hideUpdateBanner(banner);
            }
        }, 10000);

        this.emit('ui:update-shown');
    }

    /**
     * 隐藏更新横幅
     */
    hideUpdateBanner(banner) {
        banner.classList.remove('show');
        setTimeout(() => {
            if (document.body.contains(banner)) {
                document.body.removeChild(banner);
            }
        }, 300);
        this.emit('ui:update-hidden');
    }

    /**
     * 检查Service Worker支持
     */
    static isSupported() {
        return 'serviceWorker' in navigator;
    }

    /**
     * 检查通知支持
     */
    static isNotificationSupported() {
        return 'Notification' in window;
    }

    /**
     * 检查后台同步支持
     */
    static isBackgroundSyncSupported() {
        return 'serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype;
    }

    /**
     * 检查推送支持
     */
    static isPushSupported() {
        return 'serviceWorker' in navigator && 'PushManager' in window;
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

    off(event, listener) {
        if (this.eventListeners.has(event)) {
            const listeners = this.eventListeners.get(event);
            const index = listeners.indexOf(listener);
            if (index > -1) {
                listeners.splice(index, 1);
            }
        }
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

        // 调试模式下输出详细日志
        if (this.options.verbose) {
            console.log(`📢 Service Worker事件: ${event}`, data);
        }
    }

    /**
     * 卸载Service Worker
     */
    async unregister() {
        try {
            if (this.registration) {
                const result = await this.registration.unregister();
                console.log('🗑️ Service Worker已卸载:', result);
                this.registration = null;
                this.emit('sw:unregistered', { success: result });
                return result;
            }
            return false;
        } catch (error) {
            console.error('❌ Service Worker卸载失败:', error);
            throw error;
        }
    }

    /**
     * 获取当前状态
     */
    getStatus() {
        return {
            supported: ServiceWorkerManager.isSupported(),
            registered: !!this.registration,
            activated: !!(this.registration && this.registration.active),
            updateAvailable: this.updateAvailable,
            isOnline: this.isOnline,
            metrics: this.metrics,
            features: {
                notifications: ServiceWorkerManager.isNotificationSupported(),
                backgroundSync: ServiceWorkerManager.isBackgroundSyncSupported(),
                push: ServiceWorkerManager.isPushSupported()
            }
        };
    }
}

// 创建全局实例
const serviceWorkerManager = new ServiceWorkerManager({
    swUrl: '/sw.js',
    autoRegister: true,
    verbose: true,
    enableNotifications: true,
    enableBackgroundSync: true
});

// 导出供其他模块使用
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ServiceWorkerManager;
}

// 全局暴露
window.ServiceWorkerManager = ServiceWorkerManager;
window.serviceWorkerManager = serviceWorkerManager;