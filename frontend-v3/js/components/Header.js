/**
 * 头部组件
 */
export class Header {
  constructor({ stateManager, onToggleSidebar, onShowSettings }) {
    this.stateManager = stateManager;
    this.onToggleSidebar = onToggleSidebar;
    this.onShowSettings = onShowSettings;

    // DOM元素
    this.headerElement = null;

    this.init();
  }

  /**
   * 初始化头部
   */
  init() {
    this.createHeader();
    this.bindEvents();
  }

  /**
   * 创建头部元素
   */
  createHeader() {
    this.headerElement = document.createElement('header');
    this.headerElement.className = 'header';
    this.headerElement.innerHTML = `
      <div class="header-left">
        <button id="menuToggle" class="btn-icon" title="菜单">
          <i class="icon-menu">☰</i>
        </button>
        <h1 class="app-title">万物可视化 v3</h1>
      </div>
      <div class="header-right">
        <button id="themeToggle" class="btn-icon" title="切换主题">
          <i class="icon-theme">🌙</i>
        </button>
        <button id="settingsBtn" class="btn-icon" title="设置">
          <i class="icon-settings">⚙️</i>
        </button>
      </div>
    `;
  }

  /**
   * 绑定事件
   */
  bindEvents() {
    // 菜单切换
    const menuToggle = this.headerElement.querySelector('#menuToggle');
    if (menuToggle) {
      menuToggle.addEventListener('click', () => {
        this.onToggleSidebar && this.onToggleSidebar();
      });
    }

    // 主题切换
    const themeToggle = this.headerElement.querySelector('#themeToggle');
    if (themeToggle) {
      themeToggle.addEventListener('click', () => {
        this.toggleTheme();
      });
    }

    // 设置按钮
    const settingsBtn = this.headerElement.querySelector('#settingsBtn');
    if (settingsBtn) {
      settingsBtn.addEventListener('click', () => {
        this.onShowSettings && this.onShowSettings();
      });
    }
  }

  /**
   * 切换主题
   */
  toggleTheme() {
    document.body.classList.toggle('dark-theme');

    const themeIcon = this.headerElement.querySelector('#themeToggle .icon-theme');
    if (document.body.classList.contains('dark-theme')) {
      themeIcon.textContent = '☀️';
    } else {
      themeIcon.textContent = '🌙';
    }
  }

  /**
   * 更新标题
   */
  updateTitle(title) {
    const titleElement = this.headerElement.querySelector('.app-title');
    if (titleElement) {
      titleElement.textContent = title || '万物可视化 v3';
    }
  }

  /**
   * 渲染头部
   */
  render() {
    return this.headerElement;
  }

  /**
   * 销毁组件
   */
  destroy() {
    if (this.headerElement && this.headerElement.parentNode) {
      this.headerElement.parentNode.removeChild(this.headerElement);
    }
  }
}