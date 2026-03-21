/**
 * 模块适配器接口
 * 所有适配器必须实现此接口
 */
class ModuleAdapter {
  constructor(config = {}) {
    this.config = config;
    this.modulePath = config.modulePath || '';
    this.parentContext = config.parentContext || 'standalone';
  }

  /**
   * 获取导航路径（返回父项目主页的路径）
   * @returns {string} 父项目主页路径
   */
  getNavigationPath() {
    throw new Error('Must implement getNavigationPath()');
  }

  /**
   * 获取资源路径
   * @param {string} resource - 资源相对路径
   * @returns {string} 完整资源路径
   */
  getResourcePath(resource) {
    throw new Error('Must implement getResourcePath()');
  }

  /**
   * 获取返回链接配置
   * @returns {Object} {text: string, url: string}
   */
  getBackLink() {
    throw new Error('Must implement getBackLink()');
  }

  /**
   * 获取面包屑导航
   * @returns {Array} [{text: string, url: string}, ...]
   */
  getBreadcrumb() {
    throw new Error('Must implement getBreadcrumb()');
  }

  /**
   * 初始化模块
   * 加载样式、设置配置等
   */
  initialize() {
    throw new Error('Must implement initialize()');
  }

  /**
   * 加载全局样式
   * @param {string} stylePath - 样式文件路径
   */
  loadGlobalStyles(stylePath) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = stylePath;
    document.head.appendChild(link);
  }

  /**
   * 设置页面标题
   * @param {string} title - 页面标题
   */
  setPageTitle(title) {
    document.title = `${title} - ${this.config.parentName || '可视化平台'}`;
  }

  /**
   * 注入导航元素
   * @param {string} selector - 目标元素选择器
   */
  injectNavigation(selector) {
    const target = document.querySelector(selector);
    if (!target) return;

    const backLink = this.getBackLink();
    const breadcrumb = this.getBreadcrumb();

    // 创建导航HTML
    const navHTML = `
      <nav class="module-navigation">
        <div class="breadcrumb">
          ${breadcrumb.map(item => `
            <a href="${item.url}">${item.text}</a>
          `).join('<span class="separator">›</span>')}
        </div>
        <a href="${backLink.url}" class="back-link">${backLink.text}</a>
      </nav>
    `;

    target.innerHTML = navHTML + target.innerHTML;
  }

  /**
   * 获取模块配置
   * @returns {Object} 模块配置对象
   */
  getModuleConfig() {
    return {
      modulePath: this.modulePath,
      parentContext: this.parentContext,
      ...this.config
    };
  }
}

// 导出适配器接口
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ModuleAdapter;
}
