/**
 * ThemeManager.js - 主题管理器
 * 负责管理用户可视化模块的主题系统，与现有平台主题系统集成
 */
(function(global) {
  'use strict';

  /**
   * 主题管理器类
   */
  class ThemeManager {
    constructor(options = {}) {
      // 配置选项
      this.options = {
        enableSystemTheme: options.enableSystemTheme !== false,
        enableUserPreference: options.enableUserPreference !== false,
        enableTransitions: options.enableTransitions !== false,
        transitionDuration: options.transitionDuration || 300,
        storageKey: options.storageKey || 'user-module-theme',
        defaultTheme: options.defaultTheme || 'auto',
        ...options
      };

      // 当前主题状态
      this.state = {
        currentTheme: this.options.defaultTheme,
        systemTheme: 'light',
        userPreference: null,
        isTransitioning: false,
        customThemes: new Map()
      };

      // 预定义主题
      this.themes = {
        light: {
          name: 'light',
          displayName: '浅色主题',
          description: '明亮清新的浅色主题',
          colors: {
            primary: '#3b82f6',
            primaryHover: '#2563eb',
            primaryActive: '#1d4ed8',
            secondary: '#64748b',
            success: '#22c55e',
            warning: '#f59e0b',
            error: '#ef4444',
            info: '#3b82f6',
            background: {
              primary: '#ffffff',
              secondary: '#f8fafc',
              tertiary: '#f1f5f9',
              quaternary: '#e2e8f0'
            },
            text: {
              primary: '#111827',
              secondary: '#374151',
              tertiary: '#6b7280',
              quaternary: '#9ca3af',
              inverse: '#ffffff'
            },
            border: {
              primary: '#e5e7eb',
              secondary: '#d1d5db',
              focus: '#3b82f6'
            },
            shadow: {
              sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
              default: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
              md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
              lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
              xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
            }
          },
          semantics: {
            'color-primary': 'var(--primary)',
            'color-primary-hover': 'var(--primary-hover)',
            'color-primary-active': 'var(--primary-active)',
            'bg-primary': 'var(--background-primary)',
            'bg-secondary': 'var(--background-secondary)',
            'bg-tertiary': 'var(--background-tertiary)',
            'text-primary': 'var(--text-primary)',
            'text-secondary': 'var(--text-secondary)',
            'border-primary': 'var(--border-primary)',
            'border-focus': 'var(--border-focus)'
          }
        },

        dark: {
          name: 'dark',
          displayName: '深色主题',
          description: '护眼的深色主题',
          colors: {
            primary: '#60a5fa',
            primaryHover: '#3b82f6',
            primaryActive: '#2563eb',
            secondary: '#94a3b8',
            success: '#34d399',
            warning: '#fbbf24',
            error: '#f87171',
            info: '#60a5fa',
            background: {
              primary: '#0f172a',
              secondary: '#1e293b',
              tertiary: '#334155',
              quaternary: '#475569'
            },
            text: {
              primary: '#f8fafc',
              secondary: '#e2e8f0',
              tertiary: '#cbd5e1',
              quaternary: '#94a3b8',
              inverse: '#0f172a'
            },
            border: {
              primary: '#334155',
              secondary: '#475569',
              focus: '#60a5fa'
            },
            shadow: {
              sm: '0 1px 2px 0 rgba(0, 0, 0, 0.3)',
              default: '0 1px 3px 0 rgba(0, 0, 0, 0.4), 0 1px 2px 0 rgba(0, 0, 0, 0.3)',
              md: '0 4px 6px -1px rgba(0, 0, 0, 0.4), 0 2px 4px -1px rgba(0, 0, 0, 0.3)',
              lg: '0 10px 15px -3px rgba(0, 0, 0, 0.4), 0 4px 6px -2px rgba(0, 0, 0, 0.3)',
              xl: '0 20px 25px -5px rgba(0, 0, 0, 0.4), 0 10px 10px -5px rgba(0, 0, 0, 0.3)'
            }
          },
          semantics: {
            'color-primary': 'var(--primary)',
            'color-primary-hover': 'var(--primary-hover)',
            'color-primary-active': 'var(--primary-active)',
            'bg-primary': 'var(--background-primary)',
            'bg-secondary': 'var(--background-secondary)',
            'bg-tertiary': 'var(--background-tertiary)',
            'text-primary': 'var(--text-primary)',
            'text-secondary': 'var(--text-secondary)',
            'border-primary': 'var(--border-primary)',
            'border-focus': 'var(--border-focus)'
          }
        },

        auto: {
          name: 'auto',
          displayName: '跟随系统',
          description: '自动跟随系统主题设置',
          isAdaptive: true
        }
      };

      // 事件总线
      this.eventBus = new EventTarget();

      // 媒体查询监听器
      this.mediaQuery = null;

      // 初始化
      this.init();
    }

    /**
     * 初始化主题管理器
     */
    init() {
      try {
        console.log('ThemeManager 初始化中...');

        // 加载用户偏好设置
        this.loadUserPreference();

        // 检测系统主题
        if (this.options.enableSystemTheme) {
          this.detectSystemTheme();
          this.setupSystemThemeListener();
        }

        // 应用初始主题
        this.applyTheme(this.state.currentTheme);

        // 设置CSS变量
        this.setupCSSVariables();

        // 集成现有主题系统
        this.integrateWithExistingTheme();

        console.log('ThemeManager 初始化完成');
        this.emitEvent('theme:initialized', {
          theme: this.state.currentTheme,
          systemTheme: this.state.systemTheme
        });

      } catch (error) {
        console.error('ThemeManager 初始化失败:', error);
      }
    }

    /**
     * 加载用户偏好设置
     */
    loadUserPreference() {
      try {
        if (this.options.enableUserPreference && global.localStorageManager) {
          const savedTheme = global.localStorageManager.getItem(this.options.storageKey);
          if (savedTheme && this.themes[savedTheme]) {
            this.state.userPreference = savedTheme;
            this.state.currentTheme = savedTheme;
          }
        }
      } catch (error) {
        console.error('加载用户主题偏好失败:', error);
      }
    }

    /**
     * 保存用户偏好设置
     */
    saveUserPreference() {
      try {
        if (this.options.enableUserPreference && global.localStorageManager) {
          global.localStorageManager.setItem(this.options.storageKey, this.state.userPreference);
        }
      } catch (error) {
        console.error('保存用户主题偏好失败:', error);
      }
    }

    /**
     * 检测系统主题
     */
    detectSystemTheme() {
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        this.state.systemTheme = 'dark';
      } else {
        this.state.systemTheme = 'light';
      }
    }

    /**
     * 设置系统主题监听器
     */
    setupSystemThemeListener() {
      if (window.matchMedia) {
        this.mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

        const handleChange = (e) => {
          const oldTheme = this.state.systemTheme;
          this.state.systemTheme = e.matches ? 'dark' : 'light';

          if (this.state.currentTheme === 'auto') {
            this.applyTheme('auto');
          }

          this.emitEvent('system-theme:changed', {
            oldTheme,
            newTheme: this.state.systemTheme
          });
        };

        // 监听系统主题变化
        if (this.mediaQuery.addListener) {
          this.mediaQuery.addListener(handleChange);
        } else {
          this.mediaQuery.addEventListener('change', handleChange);
        }
      }
    }

    /**
     * 设置CSS变量
     */
    setupCSSVariables() {
      const root = document.documentElement;

      // 设置默认CSS变量
      this.setCSSVariables(root, this.themes.light);
    }

    /**
     * 设置CSS变量
     */
    setCSSVariables(element, theme) {
      if (!theme.colors) return;

      Object.entries(theme.colors).forEach(([key, value]) => {
        if (typeof value === 'object') {
          // 处理嵌套对象
          Object.entries(value).forEach(([subKey, subValue]) => {
            const cssVar = `--${key}-${subKey}`;
            element.style.setProperty(cssVar, subValue);
          });
        } else {
          // 处理顶层变量
          const cssVar = `--${key}`;
          element.style.setProperty(cssVar, value);
        }
      });

      // 设置语义化变量
      if (theme.semantics) {
        Object.entries(theme.semantics).forEach(([key, value]) => {
          element.style.setProperty(key, value);
        });
      }
    }

    /**
     * 集成现有主题系统
     */
    integrateWithExistingTheme() {
      try {
        // 检查是否存在现有的主题管理器
        if (global.themeManager) {
          console.log('检测到现有主题系统，进行集成...');

          // 监听现有主题系统的变化
          if (global.themeManager.addEventListener) {
            global.themeManager.addEventListener('themeChanged', (event) => {
              const existingTheme = event.detail.theme;
              this.syncWithExistingTheme(existingTheme);
            });
          }

          // 同步当前主题
          const currentExistingTheme = global.themeManager.getCurrentTheme?.();
          if (currentExistingTheme) {
            this.syncWithExistingTheme(currentExistingTheme);
          }
        }

        // 检查是否存在全局主题变量
        this.syncGlobalThemeVariables();

      } catch (error) {
        console.error('集成现有主题系统失败:', error);
      }
    }

    /**
     * 与现有主题系统同步
     */
    syncWithExistingTheme(existingTheme) {
      try {
        // 将现有主题映射到当前系统
        const mappedTheme = this.mapExistingTheme(existingTheme);

        if (mappedTheme && mappedTheme !== this.state.currentTheme) {
          this.state.currentTheme = mappedTheme;
          this.applyTheme(mappedTheme, { silent: true });
        }

      } catch (error) {
        console.error('同步现有主题失败:', error);
      }
    }

    /**
     * 映射现有主题
     */
    mapExistingTheme(existingTheme) {
      const themeMap = {
        'light': 'light',
        'dark': 'dark',
        'auto': 'auto',
        'default': 'light',
        'system': 'auto'
      };

      return themeMap[existingTheme.toLowerCase()] || 'light';
    }

    /**
     * 同步全局主题变量
     */
    syncGlobalThemeVariables() {
      const root = document.documentElement;
      const computedStyle = getComputedStyle(root);

      // 检查是否存在全局主题变量
      const globalPrimary = computedStyle.getPropertyValue('--global-primary').trim();
      const globalBg = computedStyle.getPropertyValue('--global-bg').trim();

      if (globalPrimary) {
        root.style.setProperty('--color-primary', globalPrimary);
      }

      if (globalBg) {
        root.style.setProperty('--bg-primary', globalBg);
      }
    }

    /**
     * 应用主题
     */
    applyTheme(themeName, options = {}) {
      const { silent = false, save = true } = options;

      try {
        if (this.state.isTransitioning && !silent) {
          console.warn('主题正在切换中，忽略新的切换请求');
          return;
        }

        const theme = this.themes[themeName];
        if (!theme) {
          console.error(`未找到主题: ${themeName}`);
          return;
        }

        const oldTheme = this.state.currentTheme;
        let actualTheme = themeName;

        // 处理自适应主题
        if (theme.isAdaptive) {
          actualTheme = this.state.systemTheme;
        }

        // 开始主题切换
        if (!silent) {
          this.state.isTransitioning = true;
          this.emitEvent('theme:changing', { from: oldTheme, to: actualTheme });
        }

        // 应用主题过渡效果
        if (this.options.enableTransitions && !silent) {
          this.startThemeTransition();
        }

        // 应用实际主题
        const actualThemeData = this.themes[actualTheme];
        if (actualThemeData) {
          this.setCSSVariables(document.documentElement, actualThemeData);
        }

        // 设置主题属性
        document.documentElement.setAttribute('data-theme', actualTheme);
        document.documentElement.setAttribute('data-user-theme', themeName);

        // 更新状态
        this.state.currentTheme = themeName;

        if (save && themeName !== 'auto') {
          this.state.userPreference = themeName;
          this.saveUserPreference();
        }

        // 结束主题切换
        if (!silent) {
          setTimeout(() => {
            this.state.isTransitioning = false;
            this.emitEvent('theme:changed', {
              theme: themeName,
              actualTheme: actualTheme,
              from: oldTheme
            });
          }, this.options.transitionDuration);
        }

      } catch (error) {
        console.error('应用主题失败:', error);
        this.state.isTransitioning = false;
      }
    }

    /**
     * 开始主题过渡效果
     */
    startThemeTransition() {
      const root = document.documentElement;

      // 添加过渡类
      root.classList.add('theme-transitioning');

      // 设置过渡样式
      root.style.transition = `background-color ${this.options.transitionDuration}ms ease, color ${this.options.transitionDuration}ms ease, border-color ${this.options.transitionDuration}ms ease`;

      // 移除过渡类
      setTimeout(() => {
        root.classList.remove('theme-transitioning');
        root.style.transition = '';
      }, this.options.transitionDuration);
    }

    /**
     * 切换主题
     */
    toggleTheme() {
      const nextTheme = this.getNextTheme(this.state.currentTheme);
      this.setTheme(nextTheme);
    }

    /**
     * 获取下一个主题
     */
    getNextTheme(currentTheme) {
      const themeOrder = ['light', 'dark', 'auto'];
      const currentIndex = themeOrder.indexOf(currentTheme);
      const nextIndex = (currentIndex + 1) % themeOrder.length;
      return themeOrder[nextIndex];
    }

    /**
     * 设置主题
     */
    setTheme(themeName) {
      if (this.themes[themeName]) {
        this.applyTheme(themeName);
      } else {
        console.error(`未知的主题: ${themeName}`);
      }
    }

    /**
     * 获取当前主题
     */
    getCurrentTheme() {
      return this.state.currentTheme;
    }

    /**
     * 获取实际主题（考虑自适应）
     */
    getActualTheme() {
      const theme = this.themes[this.state.currentTheme];
      return theme.isAdaptive ? this.state.systemTheme : this.state.currentTheme;
    }

    /**
     * 获取可用主题列表
     */
    getAvailableThemes() {
      return Object.keys(this.themes).map(key => ({
        name: key,
        displayName: this.themes[key].displayName,
        description: this.themes[key].description,
        isAdaptive: this.themes[key].isAdaptive || false,
        isCurrent: key === this.state.currentTheme
      }));
    }

    /**
     * 注册自定义主题
     */
    registerTheme(name, themeConfig) {
      try {
        // 验证主题配置
        if (!this.validateThemeConfig(themeConfig)) {
          throw new Error('无效的主题配置');
        }

        this.themes[name] = {
          name: name,
          ...themeConfig
        };

        this.state.customThemes.set(name, themeConfig);

        this.emitEvent('theme:registered', { name, theme: themeConfig });

        console.log(`自定义主题已注册: ${name}`);
        return true;

      } catch (error) {
        console.error(`注册自定义主题失败 [${name}]:`, error);
        return false;
      }
    }

    /**
     * 注销自定义主题
     */
    unregisterTheme(name) {
      if (this.state.customThemes.has(name)) {
        delete this.themes[name];
        this.state.customThemes.delete(name);

        this.emitEvent('theme:unregistered', { name });

        console.log(`自定义主题已注销: ${name}`);
        return true;
      }

      return false;
    }

    /**
     * 验证主题配置
     */
    validateThemeConfig(config) {
      // 检查必需的字段
      if (!config.displayName || !config.colors) {
        return false;
      }

      // 检查颜色配置
      const requiredColors = ['primary', 'background', 'text'];
      for (const colorKey of requiredColors) {
        if (!config.colors[colorKey]) {
          return false;
        }
      }

      return true;
    }

    /**
     * 获取主题变量
     */
    getThemeVariable(variableName, themeName = null) {
      const theme = themeName ? this.themes[themeName] : this.themes[this.getActualTheme()];

      if (!theme || !theme.colors) {
        return null;
      }

      // 支持嵌套访问，如 'background.primary'
      const keys = variableName.split('.');
      let value = theme.colors;

      for (const key of keys) {
        if (value && typeof value === 'object' && key in value) {
          value = value[key];
        } else {
          return null;
        }
      }

      return value;
    }

    /**
     * 生成主题CSS
     */
    generateThemeCSS(themeName) {
      const theme = this.themes[themeName];
      if (!theme || !theme.colors) {
        return '';
      }

      let css = `/* Theme: ${theme.displayName} */\n`;
      css += `[data-theme="${themeName}"] {\n`;

      Object.entries(theme.colors).forEach(([key, value]) => {
        if (typeof value === 'object') {
          Object.entries(value).forEach(([subKey, subValue]) => {
            css += `  --${key}-${subKey}: ${subValue};\n`;
          });
        } else {
          css += `  --${key}: ${value};\n`;
        }
      });

      if (theme.semantics) {
        Object.entries(theme.semantics).forEach(([key, value]) => {
          css += `  ${key}: ${value};\n`;
        });
      }

      css += '}\n';

      return css;
    }

    /**
     * 导出主题配置
     */
    exportTheme(themeName) {
      const theme = this.themes[themeName];
      if (!theme) {
        throw new Error(`未找到主题: ${themeName}`);
      }

      return JSON.stringify(theme, null, 2);
    }

    /**
     * 导入主题配置
     */
    importTheme(themeConfig) {
      try {
        const theme = typeof themeConfig === 'string' ? JSON.parse(themeConfig) : themeConfig;

        if (!theme.name) {
          throw new Error('主题配置必须包含name字段');
        }

        return this.registerTheme(theme.name, theme);

      } catch (error) {
        console.error('导入主题配置失败:', error);
        return false;
      }
    }

    /**
     * 重置为默认主题
     */
    resetToDefault() {
      this.setTheme(this.options.defaultTheme);
      this.state.userPreference = null;

      if (global.localStorageManager) {
        global.localStorageManager.removeItem(this.options.storageKey);
      }
    }

    /**
     * 获取主题统计信息
     */
    getStats() {
      return {
        currentTheme: this.state.currentTheme,
        actualTheme: this.getActualTheme(),
        systemTheme: this.state.systemTheme,
        userPreference: this.state.userPreference,
        customThemesCount: this.state.customThemes.size,
        availableThemes: Object.keys(this.themes).length,
        isTransitioning: this.state.isTransitioning,
        options: this.options
      };
    }

    /**
     * 发送事件
     */
    emitEvent(eventName, data = {}) {
      const event = new CustomEvent(`theme:${eventName}`, { detail: data });
      this.eventBus.dispatchEvent(event);
    }

    /**
     * 监听事件
     */
    on(eventName, callback) {
      this.eventBus.addEventListener(`theme:${eventName}`, callback);
      return this;
    }

    /**
     * 移除事件监听
     */
    off(eventName, callback) {
      this.eventBus.removeEventListener(`theme:${eventName}`, callback);
      return this;
    }

    /**
     * 销毁主题管理器
     */
    destroy() {
      // 清理媒体查询监听器
      if (this.mediaQuery) {
        if (this.mediaQuery.removeListener) {
          this.mediaQuery.removeListener(this.handleSystemThemeChange);
        } else {
          this.mediaQuery.removeEventListener('change', this.handleSystemThemeChange);
        }
      }

      // 清理事件监听器
      this.eventBus.removeEventListener = null;

      // 清理自定义主题
      this.state.customThemes.clear();

      console.log('ThemeManager 已销毁');
    }
  }

  // 创建全局实例
  const themeManager = new ThemeManager();

  // 导出到全局
  global.ThemeManager = ThemeManager;
  global.themeManager = themeManager;

})(window);