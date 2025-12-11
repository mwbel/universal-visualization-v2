/**
 * 主题管理器
 */
export class ThemeManager {
  constructor() {
    this.themes = {
      light: 'light',
      dark: 'dark',
      auto: 'auto'
    };

    this.currentTheme = 'light';
    this.systemPreference = this.getSystemPreference();
    this.mediaQuery = null;

    this.init();
  }

  /**
   * 初始化主题管理器
   */
  async init() {
    // 从存储中获取用户设置的主题
    const savedTheme = await this.getSavedTheme();

    if (savedTheme && this.themes[savedTheme]) {
      this.currentTheme = savedTheme;
    } else {
      // 默认跟随系统偏好
      this.currentTheme = 'auto';
    }

    this.applyTheme(this.currentTheme);
    this.setupSystemPreferenceListener();
  }

  /**
   * 获取保存的主题
   */
  async getSavedTheme() {
    try {
      const settings = localStorage.getItem('chatAppSettings');
      if (settings) {
        const parsed = JSON.parse(settings);
        return parsed.theme;
      }
    } catch (error) {
      console.warn('Failed to load saved theme:', error);
    }
    return null;
  }

  /**
   * 保存主题设置
   */
  async saveTheme(theme) {
    try {
      const settings = localStorage.getItem('chatAppSettings') || '{}';
      const parsed = JSON.parse(settings);
      parsed.theme = theme;
      localStorage.setItem('chatAppSettings', JSON.stringify(parsed));
    } catch (error) {
      console.warn('Failed to save theme:', error);
    }
  }

  /**
   * 获取系统主题偏好
   */
  getSystemPreference() {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  }

  /**
   * 设置系统偏好监听器
   */
  setupSystemPreferenceListener() {
    if (window.matchMedia) {
      this.mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      this.mediaQuery.addEventListener('change', (e) => {
        this.systemPreference = e.matches ? 'dark' : 'light';
        if (this.currentTheme === 'auto') {
          this.applyTheme('auto');
        }
      });
    }
  }

  /**
   * 应用主题
   */
  applyTheme(theme) {
    const actualTheme = this.getActualTheme(theme);
    document.documentElement.setAttribute('data-theme', actualTheme);
    this.updateThemeUI(actualTheme);
  }

  /**
   * 获取实际应用的主题
   */
  getActualTheme(theme) {
    if (theme === 'auto') {
      return this.systemPreference;
    }
    return theme;
  }

  /**
   * 切换主题
   */
  toggle() {
    const themes = ['light', 'dark', 'auto'];
    const currentIndex = themes.indexOf(this.currentTheme);
    const nextTheme = themes[(currentIndex + 1) % themes.length];

    this.setTheme(nextTheme);
  }

  /**
   * 设置主题
   */
  async setTheme(theme) {
    if (!this.themes[theme]) {
      console.warn(`Invalid theme: ${theme}`);
      return false;
    }

    this.currentTheme = theme;
    this.applyTheme(theme);
    await this.saveTheme(theme);

    this.emit('themeChanged', {
      theme,
      actualTheme: this.getActualTheme(theme)
    });

    return true;
  }

  /**
   * 获取当前主题
   */
  getCurrentTheme() {
    return this.currentTheme;
  }

  /**
   * 获取实际应用的主题
   */
  getAppliedTheme() {
    return this.getActualTheme(this.currentTheme);
  }

  /**
   * 获取所有可用主题
   */
  getAvailableThemes() {
    return Object.keys(this.themes).map(key => ({
      value: this.themes[key],
      label: this.getThemeLabel(this.themes[key])
    }));
  }

  /**
   * 获取主题标签
   */
  getThemeLabel(theme) {
    const labels = {
      light: '浅色主题',
      dark: '深色主题',
      auto: '跟随系统'
    };
    return labels[theme] || theme;
  }

  /**
   * 更新主题UI
   */
  updateThemeUI(theme) {
    // 更新主题切换按钮
    const themeToggleBtn = document.getElementById('themeToggleBtn');
    if (themeToggleBtn) {
      themeToggleBtn.textContent = theme === 'dark' ? '☀️' : '🌙';
      themeToggleBtn.title = theme === 'dark' ? '切换到浅色主题' : '切换到深色主题';
    }

    // 更新设置面板中的主题选择
    const themeSelect = document.getElementById('themeSelect');
    if (themeSelect) {
      themeSelect.value = this.currentTheme;
    }

    // 更新meta主题色
    this.updateMetaThemeColor(theme);
  }

  /**
   * 更新meta主题色
   */
  updateMetaThemeColor(theme) {
    const themeColors = {
      light: '#ffffff',
      dark: '#343541'
    };

    let metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (!metaThemeColor) {
      metaThemeColor = document.createElement('meta');
      metaThemeColor.name = 'theme-color';
      document.head.appendChild(metaThemeColor);
    }

    metaThemeColor.content = themeColors[theme] || themeColors.light;
  }

  /**
   * 检查是否为深色主题
   */
  isDarkTheme() {
    return this.getAppliedTheme() === 'dark';
  }

  /**
   * 检查是否为浅色主题
   */
  isLightTheme() {
    return this.getAppliedTheme() === 'light';
  }

  /**
   * 刷新主题（重新应用）
   */
  refresh() {
    this.applyTheme(this.currentTheme);
  }

  /**
   * 获取主题CSS变量
   */
  getThemeCSSVariables(theme = null) {
    const actualTheme = theme || this.getAppliedTheme();
    const rootStyle = getComputedStyle(document.documentElement);

    const variables = {};
    for (let i = 0; i < rootStyle.length; i++) {
      const property = rootStyle[i];
      if (property.startsWith('--')) {
        variables[property] = rootStyle.getPropertyValue(property);
      }
    }

    return variables;
  }

  /**
   * 应用自定义CSS变量
   */
  setCSSVariable(name, value, theme = null) {
    const element = theme ? document.documentElement : document.documentElement;
    element.style.setProperty(name, value);
  }

  /**
   * 获取主题配置
   */
  getThemeConfig() {
    return {
      current: this.currentTheme,
      actual: this.getAppliedTheme(),
      system: this.systemPreference,
      available: this.getAvailableThemes()
    };
  }

  /**
   * 导出主题配置
   */
  exportThemeConfig() {
    return {
      theme: this.currentTheme,
      customVariables: this.getThemeCSSVariables(),
      exportedAt: new Date().toISOString()
    };
  }

  /**
   * 导入主题配置
   */
  async importThemeConfig(config) {
    try {
      if (config.theme && this.themes[config.theme]) {
        await this.setTheme(config.theme);
      }

      if (config.customVariables) {
        Object.entries(config.customVariables).forEach(([name, value]) => {
          this.setCSSVariable(name, value);
        });
      }

      return true;
    } catch (error) {
      console.error('Failed to import theme config:', error);
      return false;
    }
  }

  /**
   * 重置为默认主题
   */
  async reset() {
    await this.setTheme('auto');

    // 清除自定义CSS变量
    const rootStyle = getComputedStyle(document.documentElement);
    for (let i = 0; i < rootStyle.length; i++) {
      const property = rootStyle[i];
      if (property.startsWith('--') && property.includes('custom-')) {
        document.documentElement.style.removeProperty(property);
      }
    }
  }

  /**
   * 事件发射器
   */
  emit(event, data) {
    const customEvent = new CustomEvent(`theme:${event}`, {
      detail: data
    });
    document.dispatchEvent(customEvent);
  }

  /**
   * 监听主题事件
   */
  on(event, callback) {
    document.addEventListener(`theme:${event}`, callback);
    return () => {
      document.removeEventListener(`theme:${event}`, callback);
    };
  }

  /**
   * 销毁主题管理器
   */
  destroy() {
    if (this.mediaQuery) {
      this.mediaQuery.removeEventListener('change', this.systemPreferenceListener);
    }
  }
}