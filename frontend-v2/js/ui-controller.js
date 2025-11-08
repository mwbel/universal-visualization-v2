/**
 * 万物可视化 v2.0 - UI 控制器
 * 管理用户界面交互和状态显示
 */

class UIController {
    constructor() {
        this.initialized = false;
        this.observers = [];
        this.theme = localStorage.getItem('wv-theme') || 'light';
    }

    initialize() {
        if (this.initialized) return;

        this.setupTheme();
        this.setupAnimations();
        this.setupTooltips();
        this.setupResponsive();

        this.initialized = true;
        console.log('🎨 UI 控制器初始化完成');
    }

    /**
     * 设置主题
     */
    setupTheme() {
        document.documentElement.setAttribute('data-theme', this.theme);
        this.applyThemeStyles(this.theme);
    }

    applyThemeStyles(theme) {
        const root = document.documentElement;

        if (theme === 'dark') {
            root.style.setProperty('--background', '#1a1a1a');
            root.style.setProperty('--surface', '#2d2d2d');
            root.style.setProperty('--text-primary', '#ffffff');
            root.style.setProperty('--text-secondary', '#b0b0b0');
            root.style.setProperty('--border', '#404040');
        } else {
            root.style.setProperty('--background', '#f8f9fa');
            root.style.setProperty('--surface', '#ffffff');
            root.style.setProperty('--text-primary', '#2c3e50');
            root.style.setProperty('--text-secondary', '#7f8c8d');
            root.style.setProperty('--border', '#e9ecef');
        }
    }

    /**
     * 切换主题
     */
    toggleTheme() {
        this.theme = this.theme === 'light' ? 'dark' : 'light';
        this.setupTheme();
        localStorage.setItem('wv-theme', this.theme);

        // 通知主题变化
        this.notifyObservers('theme-changed', { theme: this.theme });
    }

    /**
     * 设置动画
     */
    setupAnimations() {
        // 为带有 data-animate 属性的元素设置动画
        document.querySelectorAll('[data-animate]').forEach(element => {
            const animationType = element.dataset.animate;
            element.classList.add(`animate-${animationType}`);
        });

        // 滚动动画
        this.setupScrollAnimations();
    }

    setupScrollAnimations() {
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate-in');
                    observer.unobserve(entry.target);
                }
            });
        }, observerOptions);

        document.querySelectorAll('.animate-on-scroll').forEach(element => {
            observer.observe(element);
        });
    }

    /**
     * 设置工具提示
     */
    setupTooltips() {
        document.querySelectorAll('[title]').forEach(element => {
            this.createTooltip(element);
        });
    }

    createTooltip(element) {
        const text = element.getAttribute('title');
        if (!text) return;

        // 移除原生的 title 属性
        element.removeAttribute('title');

        const tooltip = document.createElement('div');
        tooltip.className = 'tooltip';
        tooltip.textContent = text;
        document.body.appendChild(tooltip);

        element.addEventListener('mouseenter', (e) => {
            const rect = element.getBoundingClientRect();
            tooltip.style.left = rect.left + rect.width / 2 - tooltip.offsetWidth / 2 + 'px';
            tooltip.style.top = rect.top - tooltip.offsetHeight - 8 + 'px';
            tooltip.classList.add('visible');
        });

        element.addEventListener('mouseleave', () => {
            tooltip.classList.remove('visible');
        });

        element.addEventListener('click', () => {
            tooltip.classList.remove('visible');
        });
    }

    /**
     * 设置响应式处理
     */
    setupResponsive() {
        // 监听窗口大小变化
        window.addEventListener('resize', this.debounce(() => {
            this.handleResize();
        }, 250));

        // 初始响应式检查
        this.handleResize();
    }

    handleResize() {
        const width = window.innerWidth;
        const isMobile = width < 768;
        const isTablet = width >= 768 && width < 1024;

        document.body.classList.toggle('mobile', isMobile);
        document.body.classList.toggle('tablet', isTablet);
        document.body.classList.toggle('desktop', !isMobile && !isTablet);

        this.notifyObservers('viewport-changed', {
            width,
            isMobile,
            isTablet
        });
    }

    /**
     * 显示加载状态
     */
    showLoading(element, text = '加载中...') {
        if (!element) return;

        const loadingEl = document.createElement('div');
        loadingEl.className = 'element-loading';
        loadingEl.innerHTML = `
            <div class="loading-spinner-small"></div>
            <span>${text}</span>
        `;

        element.style.position = 'relative';
        element.appendChild(loadingEl);
        element.classList.add('loading');

        return loadingEl;
    }

    /**
     * 隐藏加载状态
     */
    hideLoading(element) {
        if (!element) return;

        const loadingEl = element.querySelector('.element-loading');
        if (loadingEl) {
            loadingEl.remove();
        }
        element.classList.remove('loading');
    }

    /**
     * 显示按钮加载状态
     */
    showButtonLoading(button, originalText) {
        if (!button) return;

        button.disabled = true;
        button.dataset.originalText = originalText || button.textContent;
        button.innerHTML = '<span class="btn-spinner"></span>处理中...';
        button.classList.add('btn-loading');
    }

    /**
     * 隐藏按钮加载状态
     */
    hideButtonLoading(button) {
        if (!button) return;

        button.disabled = false;
        button.innerHTML = button.dataset.originalText || '按钮';
        button.classList.remove('btn-loading');
        delete button.dataset.originalText;
    }

    /**
     * 显示进度条
     */
    showProgressBar(container, options = {}) {
        const {
            value = 0,
            max = 100,
            showText = true,
            color = 'primary'
        } = options;

        const progressBar = document.createElement('div');
        progressBar.className = 'progress-bar';
        progressBar.innerHTML = `
            <div class="progress-track">
                <div class="progress-fill progress-${color}" style="width: ${value}%"></div>
            </div>
            ${showText ? `<div class="progress-text">${Math.round(value)}%</div>` : ''}
        `;

        if (container) {
            container.appendChild(progressBar);
        }

        return {
            element: progressBar,
            updateProgress: (newValue) => {
                const fill = progressBar.querySelector('.progress-fill');
                const text = progressBar.querySelector('.progress-text');

                if (fill) {
                    fill.style.width = `${Math.min(newValue, max)}%`;
                }
                if (text) {
                    text.textContent = `${Math.round(newValue)}%`;
                }
            }
        };
    }

    /**
     * 创建确认对话框
     */
    createConfirmDialog(message, options = {}) {
        const {
            title = '确认',
            confirmText = '确认',
            cancelText = '取消',
            type = 'warning'
        } = options;

        return new Promise((resolve) => {
            const dialog = document.createElement('div');
            dialog.className = 'confirm-dialog';
            dialog.innerHTML = `
                <div class="confirm-content">
                    <div class="confirm-header">
                        <h3>${title}</h3>
                        <button class="confirm-close">&times;</button>
                    </div>
                    <div class="confirm-body">
                        <div class="confirm-icon confirm-${type}"></div>
                        <p>${message}</p>
                    </div>
                    <div class="confirm-footer">
                        <button class="btn btn-secondary confirm-cancel">${cancelText}</button>
                        <button class="btn btn-primary confirm-confirm">${confirmText}</button>
                    </div>
                </div>
            `;

            document.body.appendChild(dialog);

            const closeDialog = () => {
                dialog.remove();
            };

            const confirm = () => {
                closeDialog();
                resolve(true);
            };

            const cancel = () => {
                closeDialog();
                resolve(false);
            };

            dialog.querySelector('.confirm-close').addEventListener('click', cancel);
            dialog.querySelector('.confirm-cancel').addEventListener('click', cancel);
            dialog.querySelector('.confirm-confirm').addEventListener('click', confirm);
            dialog.addEventListener('click', (e) => {
                if (e.target === dialog) {
                    cancel();
                }
            });

            // 显示动画
            requestAnimationFrame(() => {
                dialog.classList.add('visible');
            });
        });
    }

    /**
     * 创建输入对话框
     */
    createInputDialog(message, options = {}) {
        const {
            title = '输入',
            placeholder = '请输入内容',
            defaultValue = '',
            confirmText = '确认',
            cancelText = '取消',
            type = 'text'
        } = options;

        return new Promise((resolve) => {
            const dialog = document.createElement('div');
            dialog.className = 'input-dialog';
            dialog.innerHTML = `
                <div class="input-content">
                    <div class="input-header">
                        <h3>${title}</h3>
                        <button class="input-close">&times;</button>
                    </div>
                    <div class="input-body">
                        <p>${message}</p>
                        <input type="${type}" class="input-field" placeholder="${placeholder}" value="${defaultValue}">
                    </div>
                    <div class="input-footer">
                        <button class="btn btn-secondary input-cancel">${cancelText}</button>
                        <button class="btn btn-primary input-confirm">${confirmText}</button>
                    </div>
                </div>
            `;

            document.body.appendChild(dialog);
            const input = dialog.querySelector('.input-field');

            // 聚焦到输入框
            requestAnimationFrame(() => {
                input.focus();
                input.select();
            });

            const closeDialog = () => {
                dialog.remove();
            };

            const confirm = () => {
                const value = input.value.trim();
                closeDialog();
                resolve(value);
            };

            const cancel = () => {
                closeDialog();
                resolve(null);
            };

            dialog.querySelector('.input-close').addEventListener('click', cancel);
            dialog.querySelector('.input-cancel').addEventListener('click', cancel);
            dialog.querySelector('.input-confirm').addEventListener('click', confirm);

            input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    confirm();
                } else if (e.key === 'Escape') {
                    cancel();
                }
            });

            dialog.addEventListener('click', (e) => {
                if (e.target === dialog) {
                    cancel();
                }
            });

            requestAnimationFrame(() => {
                dialog.classList.add('visible');
            });
        });
    }

    /**
     * 通知观察者
     */
    notifyObservers(event, data) {
        this.observers.forEach(observer => {
            if (typeof observer === 'function') {
                try {
                    observer(event, data);
                } catch (error) {
                    console.error('Observer error:', error);
                }
            }
        });
    }

    /**
     * 添加观察者
     */
    addObserver(observer) {
        this.observers.push(observer);
    }

    /**
     * 移除观察者
     */
    removeObserver(observer) {
        const index = this.observers.indexOf(observer);
        if (index > -1) {
            this.observers.splice(index, 1);
        }
    }

    /**
     * 防抖函数
     */
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
     * 节流函数
     */
    throttle(func, limit) {
        let inThrottle;
        return function(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    /**
     * 平滑滚动到元素
     */
    smoothScrollTo(element, offset = 0) {
        if (!element) return;

        const targetPosition = element.offsetTop + offset;
        const startPosition = window.pageYOffset;
        const distance = targetPosition - startPosition;
        const duration = 800;
        let start = null;

        const animation = (currentTime) => {
            if (start === null) start = currentTime;
            const timeElapsed = currentTime - start;
            const run = this.easeInOutQuad(timeElapsed, startPosition, distance, duration);

            window.scrollTo(0, run);

            if (timeElapsed < duration) {
                requestAnimationFrame(animation);
            }
        };

        requestAnimationFrame(animation);
    }

    /**
     * 缓动函数
     */
    easeInOutQuad(t, b, c, d) {
        t /= d / 2;
        if (t < 1) return c / 2 * t * t + b;
        t--;
        return -c / 2 * (t * (t - 2) - 1) + b;
    }

    /**
     * 复制到剪贴板
     */
    async copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            return true;
        } catch (error) {
            // 降级方案
            const textArea = document.createElement('textarea');
            textArea.value = text;
            textArea.style.position = 'fixed';
            textArea.style.opacity = '0';
            document.body.appendChild(textArea);
            textArea.select();

            try {
                document.execCommand('copy');
                return true;
            } catch (error) {
                return false;
            } finally {
                document.body.removeChild(textArea);
            }
        }
    }

    /**
     * 获取元素相对于视口的位置
     */
    getElementPosition(element) {
        const rect = element.getBoundingClientRect();
        return {
            top: rect.top + window.pageYOffset,
            left: rect.left + window.pageXOffset,
            width: rect.width,
            height: rect.height,
            inViewport: (
                rect.top >= 0 &&
                rect.left >= 0 &&
                rect.bottom <= window.innerHeight &&
                rect.right <= window.innerWidth
            )
        };
    }

    /**
     * 格式化文件大小
     */
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';

        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));

        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    /**
     * 格式化时间
     */
    formatTime(date, options = {}) {
        const defaults = {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        };

        return new Date(date).toLocaleString('zh-CN', { ...defaults, ...options });
    }

    /**
     * 获取性能信息
     */
    getPerformanceInfo() {
        if (!window.performance) return null;

        const navigation = performance.getEntriesByType('navigation')[0];
        const memory = performance.memory;

        return {
            // 页面加载性能
            loadTime: navigation.loadEventEnd - navigation.loadEventStart,
            domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,

            // 内存使用（如果可用）
            memory: memory ? {
                used: this.formatFileSize(memory.usedJSHeapSize),
                total: this.formatFileSize(memory.totalJSHeapSize),
                limit: this.formatFileSize(memory.jsHeapSizeLimit)
            } : null,

            // 连接信息
            connection: navigator.connection ? {
                effectiveType: navigator.connection.effectiveType,
                downlink: navigator.connection.downlink,
                rtt: navigator.connection.rtt
            } : null
        };
    }
}

// 创建全局实例
window.UIController = new UIController();

console.log('🎨 UI 控制器模块加载完成');