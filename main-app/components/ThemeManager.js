/**
 * ThemeManager.js - 主题管理组件
 * 提供完整的主题切换功能，包括系统主题检测、平滑过渡、主题持久化等
 */
(function(global) {
  'use strict';

  class ThemeManager {
    constructor(options = {}) {
      this.options = {
        defaultTheme: 'dark',
        enableSystemDetection: true,
        enableTransitions: true,
        storageKey: 'app-theme',
        transitionDuration: 300,
        ...options
      };

      this.state = {
        currentTheme: this.options.defaultTheme,
        systemTheme: null,
        isTransitioning: false,
        prefersDark: false,
        prefersReducedMotion: false
      };

      this.elements = {};
      this.init();
    }

    init() {
      this.detectSystemCapabilities();
      this.loadSavedTheme();
      this.setupMediaQueries();
      this.bindElements();
      this.bindEvents();
      this.applyTheme(this.state.currentTheme, false);

      console.log('ThemeManager initialized with theme:', this.state.currentTheme);
    }

    detectSystemCapabilities() {
      // 检测系统主题偏好
      if (window.matchMedia) {
        const darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)');
        this.state.systemTheme = darkModeQuery.matches ? 'dark' : 'light';
        this.state.prefersDark = darkModeQuery.matches;

        // 监听系统主题变化
        if (this.options.enableSystemDetection) {
          darkModeQuery.addEventListener('change', (e) => {
            this.state.systemTheme = e.matches ? 'dark' : 'light';
            this.state.prefersDark = e.matches;
            this.handleSystemThemeChange();
          });
        }
      }

      // 检测动画偏好
      if (window.matchMedia) {
        const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
        this.state.prefersReducedMotion = reducedMotionQuery.matches;
      }

      // 检测高对比度模式
      if (window.matchMedia) {
        const highContrastQuery = window.matchMedia('(prefers-contrast: high)');
        this.state.prefersHighContrast = highContrastQuery.matches;
      }
    }

    setupMediaQueries() {
      // 设置CSS媒体查询变量
      this.updateCSSMediaQueries();
    }

    updateCSSMediaQueries() {
      const root = document.documentElement;

      // 系统主题变量
      root.style.setProperty('--system-theme', this.state.systemTheme || 'dark');
      root.style.setProperty('--prefers-dark', this.state.prefersDark ? '1' : '0');

      // 动画偏好
      root.style.setProperty('--prefers-reduced-motion', this.state.prefersReducedMotion ? '1' : '0');

      // 高对比度
      root.style.setProperty('--prefers-high-contrast', this.state.prefersHighContrast ? '1' : '0');
    }

    bindElements() {
      this.elements.themeToggle = document.getElementById('themeToggle');
      this.elements.themeIcon = document.querySelector('.theme-icon');
      this.elements.themeStyle = document.getElementById('theme-style');

      // 创建主题样式标签（如果不存在）
      if (!this.elements.themeStyle) {
        this.elements.themeStyle = document.createElement('style');
        this.elements.themeStyle.id = 'theme-style';
        this.elements.themeStyle.setAttribute('data-theme-manager', 'true');
        document.head.appendChild(this.elements.themeStyle);
      }
    }

    bindEvents() {
      // 主题切换按钮
      if (this.elements.themeToggle) {
        this.elements.themeToggle.addEventListener('click', this.handleThemeToggle.bind(this));
        this.elements.themeToggle.addEventListener('keydown', this.handleToggleKeyDown.bind(this));
      }

      // 键盘快捷键
      document.addEventListener('keydown', this.handleKeyboardShortcuts.bind(this));

      // 主题变化事件
      this.setupThemeTransitionEvents();
    }

    handleThemeToggle() {
      const newTheme = this.state.currentTheme === 'dark' ? 'light' : 'dark';
      this.setTheme(newTheme);
    }

    handleToggleKeyDown(event) {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        this.handleThemeToggle();
      }
    }

    handleKeyboardShortcuts(event) {
      // Ctrl/Cmd + Shift + T 切换主题
      const ctrlKey = event.ctrlKey || event.metaKey;
      const shiftKey = event.shiftKey;

      if (ctrlKey && shiftKey && event.key === 'T') {
        event.preventDefault();
        this.handleThemeToggle();
        this.showThemeNotification();
      }

      // Ctrl/Cmd + Shift + S 跟随系统主题
      if (ctrlKey && shiftKey && event.key === 'S') {
        event.preventDefault();
        this.toggleSystemThemeFollow();
      }
    }

    handleSystemThemeChange() {
      if (this.options.enableSystemDetection && this.state.currentTheme === 'system') {
        this.applyTheme(this.state.systemTheme);
      }

      this.updateCSSMediaQueries();
      this.emit('system-theme-changed', {
        systemTheme: this.state.systemTheme,
        prefersDark: this.state.prefersDark
      });
    }

    setupThemeTransitionEvents() {
      // 监听主题开始变化
      document.addEventListener('theme-change-start', (e) => {
        this.state.isTransitioning = true;
        this.addTransitionClass();
      });

      // 监听主题变化完成
      document.addEventListener('theme-change-end', (e) => {
        this.state.isTransitioning = false;
        this.removeTransitionClass();
      });
    }

    setTheme(theme, save = true) {
      if (this.state.currentTheme === theme) return;

      const previousTheme = this.state.currentTheme;
      this.state.currentTheme = theme;

      // 触发主题变化开始事件
      this.emit('theme-change-start', {
        from: previousTheme,
        to: theme,
        system: false
      });

      // 应用主题
      this.applyTheme(theme, this.options.enableTransitions);

      // 更新UI
      this.updateThemeUI(theme);

      // 保存设置
      if (save) {
        this.saveTheme(theme);
      }

      // 触发主题变化完成事件
      setTimeout(() => {
        this.emit('theme-change-end', {
          from: previousTheme,
          to: theme,
          system: false
        });

        this.emit('theme-changed', { theme });
      }, this.options.enableTransitions ? this.options.transitionDuration : 0);
    }

    applyTheme(theme, enableTransition = true) {
      const root = document.documentElement;

      // 设置主题属性
      root.setAttribute('data-theme', theme);

      // 设置CSS变量
      this.updateThemeVariables(theme);

      // 处理过渡效果
      if (enableTransition && this.options.enableTransitions && !this.state.prefersReducedMotion) {
        this.enableThemeTransition();
      } else {
        this.disableThemeTransition();
      }

      // 更新meta标签（为了移动端状态栏）
      this.updateMetaThemeColor(theme);
    }

    updateThemeVariables(theme) {
      const root = document.documentElement;

      // 设置当前主题变量
      root.style.setProperty('--current-theme', theme);
      root.style.setProperty('--theme-transition-duration', `${this.options.transitionDuration}ms`);

      // 根据主题设置颜色方案
      const colorScheme = theme === 'dark' ? 'dark' : 'light';
      root.style.setProperty('color-scheme', colorScheme);
    }

    updateThemeUI(theme) {
      // 更新主题图标
      if (this.elements.themeIcon) {
        const iconMap = {
          'dark': '🌙',
          'light': '☀️',
          'system': '🖥️'
        };
        this.elements.themeIcon.textContent = iconMap[theme] || '🌙';
        this.elements.themeIcon.setAttribute('title', `当前主题: ${this.getThemeDisplayName(theme)}`);
      }

      // 更新切换按钮状态
      if (this.elements.themeToggle) {
        this.elements.themeToggle.setAttribute('aria-label', `切换到 ${this.getOppositeTheme(theme)} 主题`);
        this.elements.themeToggle.classList.toggle('dark-theme', theme === 'dark');
        this.elements.themeToggle.classList.toggle('light-theme', theme === 'light');
      }
    }

    enableThemeTransition() {
      const root = document.documentElement;
      root.style.setProperty('--theme-transition', 'all var(--theme-transition-duration) var(--ease-out)');

      // 添加过渡类
      document.body.classList.add('theme-transitioning');
    }

    disableThemeTransition() {
      const root = document.documentElement;
      root.style.setProperty('--theme-transition', 'none');

      // 移除过渡类
      document.body.classList.remove('theme-transitioning');
    }

    addTransitionClass() {
      document.body.classList.add('theme-transitioning');
    }

    removeTransitionClass() {
      document.body.classList.remove('theme-transitioning');
    }

    updateMetaThemeColor(theme) {
      // 移除现有的主题色meta标签
      const existingMeta = document.querySelector('meta[name="theme-color"]');
      if (existingMeta) {
        existingMeta.remove();
      }

      // 创建新的主题色meta标签
      const meta = document.createElement('meta');
      meta.name = 'theme-color';

      // 根据主题设置颜色
      const themeColors = {
        'dark': '#0B0C10',
        'light': '#FFFFFF'
      };

      meta.content = themeColors[theme] || themeColors.dark;
      document.head.appendChild(meta);
    }

    getThemeDisplayName(theme) {
      const names = {
        'dark': '深色主题',
        'light': '浅色主题',
        'system': '跟随系统'
      };
      return names[theme] || theme;
    }

    getOppositeTheme(theme) {
      return theme === 'dark' ? '浅色' : '深色';
    }

    // 系统主题跟随
    toggleSystemThemeFollow() {
      if (this.state.currentTheme === 'system') {
        this.setTheme(this.options.defaultTheme);
        this.showNotification('已关闭跟随系统主题');
      } else {
        this.setTheme('system');
        this.showNotification('已开启跟随系统主题');
      }
    }

    // 通知系统
    showNotification(message, type = 'info') {
      // 创建通知元素
      const notification = document.createElement('div');
      notification.className = `theme-notification theme-notification-${type}`;
      notification.textContent = message;
      notification.setAttribute('role', 'alert');
      notification.setAttribute('aria-live', 'polite');

      // 添加样式
      Object.assign(notification.style, {
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        background: 'var(--color-primary)',
        color: 'var(--text-inverse)',
        padding: '12px 16px',
        borderRadius: '8px',
        fontSize: '14px',
        fontWeight: '500',
        boxShadow: 'var(--shadow-lg)',
        zIndex: '9999',
        transform: 'translateX(100%)',
        transition: 'transform 0.3s ease',
        maxWidth: '300px'
      });

      document.body.appendChild(notification);

      // 显示动画
      requestAnimationFrame(() => {
        notification.style.transform = 'translateX(0)';
      });

      // 自动隐藏
      setTimeout(() => {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
          if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
          }
        }, 300);
      }, 3000);
    }

    showThemeNotification() {
      const themeName = this.getThemeDisplayName(this.state.currentTheme);
      this.showNotification(`已切换到${themeName}`, 'success');
    }

    // 主题预设
    getAvailableThemes() {
      return [
        {
          id: 'dark',
          name: '深色主题',
          description: '适合在暗光环境下使用',
          icon: '🌙'
        },
        {
          id: 'light',
          name: '浅色主题',
          description: '适合在明亮环境下使用',
          icon: '☀️'
        },
        {
          id: 'system',
          name: '跟随系统',
          description: '自动跟随系统主题设置',
          icon: '🖥️'
        }
      ];
    }

    // 主题信息
    getThemeInfo() {
      return {
        current: this.state.currentTheme,
        system: this.state.systemTheme,
        available: this.getAvailableThemes(),
        preferences: {
          dark: this.state.prefersDark,
          reducedMotion: this.state.prefersReducedMotion,
          highContrast: this.state.prefersHighContrast
        },
        capabilities: {
          systemDetection: this.options.enableSystemDetection,
          transitions: this.options.enableTransitions && !this.state.prefersReducedMotion
        }
      };
    }

    // 存储管理
    loadSavedTheme() {
      try {
        const saved = localStorage.getItem(this.options.storageKey);
        if (saved) {
          const parsedTheme = JSON.parse(saved);
          this.state.currentTheme = parsedTheme.theme || this.options.defaultTheme;
        } else {
          // 首次访问，检测系统偏好
          if (this.options.enableSystemDetection && this.state.prefersDark) {
            this.state.currentTheme = 'dark';
          }
        }
      } catch (error) {
        console.warn('Failed to load saved theme:', error);
        this.state.currentTheme = this.options.defaultTheme;
      }
    }

    saveTheme(theme) {
      try {
        const themeData = {
          theme,
          timestamp: Date.now(),
          version: '1.0'
        };
        localStorage.setItem(this.options.storageKey, JSON.stringify(themeData));
      } catch (error) {
        console.warn('Failed to save theme:', error);
      }
    }

    // 事件系统
    emit(eventName, data) {
      const event = new CustomEvent(`theme-manager:${eventName}`, {
        detail: data,
        bubbles: true
      });
      document.dispatchEvent(event);
    }

    on(eventName, handler) {
      document.addEventListener(`theme-manager:${eventName}`, handler);
    }

    off(eventName, handler) {
      document.removeEventListener(`theme-manager:${eventName}`, handler);
    }

    // 公共API
    getCurrentTheme() {
      return this.state.currentTheme;
    }

    getSystemTheme() {
      return this.state.systemTheme;
    }

    isDarkTheme() {
      return this.state.currentTheme === 'dark' ||
             (this.state.currentTheme === 'system' && this.state.prefersDark);
    }

    isTransitioning() {
      return this.state.isTransitioning;
    }

    // 强制刷新主题
    refresh() {
      this.applyTheme(this.state.currentTheme, false);
      this.updateThemeUI(this.state.currentTheme);
      this.updateCSSMediaQueries();
    }

    // 销毁方法
    destroy() {
      // 移除事件监听器
      if (this.elements.themeToggle) {
        this.elements.themeToggle.removeEventListener('click', this.handleThemeToggle);
        this.elements.themeToggle.removeEventListener('keydown', this.handleToggleKeyDown);
      }

      document.removeEventListener('keydown', this.handleKeyboardShortcuts);

      // 清理样式
      if (this.elements.themeStyle && this.elements.themeStyle.parentNode) {
        this.elements.themeStyle.parentNode.removeChild(this.elements.themeStyle);
      }

      // 清理meta标签
      const metaThemeColor = document.querySelector('meta[name="theme-color"]');
      if (metaThemeColor) {
        metaThemeColor.remove();
      }

      console.log('ThemeManager destroyed');
    }
  }

  // 导出到全局
  global.ThemeManager = ThemeManager;

})(window);