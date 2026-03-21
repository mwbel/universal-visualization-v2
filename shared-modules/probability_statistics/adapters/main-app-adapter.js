/**
 * 万物可视化主应用适配器
 * 用于将概率统计模块集成到 main-app 中
 */

// 如果在浏览器环境中，从全局加载 ModuleAdapter
// 如果在 Node 环境中，从文件加载
let ModuleAdapter;
if (typeof window !== 'undefined' && window.ModuleAdapter) {
  ModuleAdapter = window.ModuleAdapter;
} else if (typeof require !== 'undefined') {
  ModuleAdapter = require('./adapter-interface.js');
}

class MainAppAdapter extends ModuleAdapter {
  constructor(config = {}) {
    super({
      ...config,
      parentContext: 'main-app',
      parentName: '万物可视化'
    });
  }

  /**
   * 获取导航路径（返回主应用主页）
   */
  getNavigationPath() {
    return '../../../index.html';
  }

  /**
   * 获取资源路径
   * @param {string} resource - 资源相对路径，如 'pages/xxx.html' 或 'lib/plotly.min.js'
   */
  getResourcePath(resource) {
    // 从 main-app/modules/probability_statistics 指向 shared-modules
    return `../../../shared-modules/probability_statistics/core/${resource}`;
  }

  /**
   * 获取返回链接配置
   */
  getBackLink() {
    return {
      text: '← 返回 "万物可视化" 主页',
      url: this.getNavigationPath()
    };
  }

  /**
   * 获取面包屑导航
   */
  getBreadcrumb() {
    return [
      { text: '🌌 万物可视化', url: '../../../index.html' },
      { text: '📐 数学', url: '../../../index.html#mathematics-section' },
      { text: '📊 概率统计', url: './index.html' }
    ];
  }

  /**
   * 初始化模块
   */
  initialize() {
    console.log('[MainAppAdapter] 初始化概率统计模块...');

    // 加载主应用的全局样式
    this.loadGlobalStyles('../../lib/global-styles.css');

    // 设置页面标题
    this.setPageTitle('概率论与数理统计');

    // 注入导航元素（如果页面有对应的容器）
    this.injectNavigationIfExists();

    // 设置主应用特定的配置
    this.setupMainAppConfig();

    console.log('[MainAppAdapter] 初始化完成');
  }

  /**
   * 注入导航元素（如果存在目标容器）
   */
  injectNavigationIfExists() {
    // 等待 DOM 加载完成
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        this.injectNavigation('.module-header nav');
      });
    } else {
      this.injectNavigation('.module-header nav');
    }
  }

  /**
   * 设置主应用特定的配置
   */
  setupMainAppConfig() {
    // 设置主题
    document.documentElement.setAttribute('data-theme', 'main-app');

    // 启用分析（如果需要）
    if (this.config.enableAnalytics) {
      this.enableAnalytics();
    }

    // 设置面包屑
    this.setupBreadcrumbNavigation();
  }

  /**
   * 设置面包屑导航
   */
  setupBreadcrumbNavigation() {
    const breadcrumb = this.getBreadcrumb();

    // 存储到全局，供页面使用
    if (typeof window !== 'undefined') {
      window.moduleBreadcrumb = breadcrumb;
    }
  }

  /**
   * 启用分析
   */
  enableAnalytics() {
    console.log('[MainAppAdapter] 分析功能已启用');
    // 这里可以添加分析代码
  }

  /**
   * 获取知识树路径
   */
  getKnowledgeTreePath() {
    return this.getResourcePath('knowledge/knowledge-tree.html');
  }

  /**
   * 获取概念导航器路径
   */
  getConceptNavigatorPath() {
    return this.getResourcePath('knowledge/concept-navigator-fast.html');
  }

  /**
   * 获取页面路径
   * @param {string} pageName - 页面文件名
   */
  getPagePath(pageName) {
    return this.getResourcePath(`pages/${pageName}`);
  }
}

// 导出适配器
if (typeof module !== 'undefined' && module.exports) {
  module.exports = MainAppAdapter;
}

// 在浏览器环境中注册到全局
if (typeof window !== 'undefined') {
  window.MainAppAdapter = MainAppAdapter;
}
