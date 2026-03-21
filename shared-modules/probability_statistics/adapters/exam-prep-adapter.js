/**
 * 期末速通应用适配器
 * 用于将概率统计模块集成到期末速通应用中
 */

// 如果在浏览器环境中，从全局加载 ModuleAdapter
// 如果在 Node 环境中，从文件加载
let ModuleAdapter;
if (typeof window !== 'undefined' && window.ModuleAdapter) {
  ModuleAdapter = window.ModuleAdapter;
} else if (typeof require !== 'undefined') {
  ModuleAdapter = require('./adapter-interface.js');
}

class ExamPrepAdapter extends ModuleAdapter {
  constructor(config = {}) {
    super({
      ...config,
      parentContext: 'exam-prep',
      parentName: '期末速通'
    });
  }

  /**
   * 获取导航路径（返回期末速通主页）
   */
  getNavigationPath() {
    return '../../index.html';
  }

  /**
   * 获取资源路径
   * @param {string} resource - 资源相对路径
   */
  getResourcePath(resource) {
    // 从 期末速通/modules/probability_statistics 指向 shared-modules
    return `../../shared-modules/probability_statistics/core/${resource}`;
  }

  /**
   * 获取返回链接配置
   */
  getBackLink() {
    return {
      text: '← 返回 "期末速通" 主页',
      url: this.getNavigationPath()
    };
  }

  /**
   * 获取面包屑导航
   */
  getBreadcrumb() {
    return [
      { text: '🎓 期末速通', url: '../../index.html' },
      { text: '📊 概率统计', url: './index.html' }
    ];
  }

  /**
   * 初始化模块
   */
  initialize() {
    console.log('[ExamPrepAdapter] 初始化概率统计模块（期末速通模式）...');

    // 加载期末速通的样式
    this.loadExamPrepStyles();

    // 设置页面标题
    this.setPageTitle('概率统计 - 期末速通');

    // 注入导航元素
    this.injectNavigationIfExists();

    // 启用考试模式
    this.enableExamMode();

    // 设置快速导航
    this.setupQuickNav();

    console.log('[ExamPrepAdapter] 初始化完成（考试模式已启用）');
  }

  /**
   * 加载期末速通的样式
   */
  loadExamPrepStyles() {
    // 加载期末速通特定的样式
    const style = document.createElement('style');
    style.textContent = `
      /* 期末速通主题样式 */
      :root {
        --exam-primary: #ff6b6b;
        --exam-secondary: #4ecdc4;
        --exam-accent: #ffe66d;
      }

      body {
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      }

      .exam-mode-badge {
        position: fixed;
        top: 20px;
        right: 20px;
        background: var(--exam-primary);
        color: white;
        padding: 8px 16px;
        border-radius: 20px;
        font-weight: bold;
        z-index: 1000;
        animation: pulse 2s infinite;
      }

      @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.7; }
      }

      .quick-nav {
        position: fixed;
        left: 20px;
        top: 50%;
        transform: translateY(-50%);
        background: white;
        padding: 15px;
        border-radius: 10px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        max-width: 200px;
      }

      .quick-nav h4 {
        margin: 0 0 10px 0;
        font-size: 14px;
        color: var(--exam-primary);
      }

      .quick-nav a {
        display: block;
        padding: 5px 0;
        color: #333;
        text-decoration: none;
        font-size: 13px;
      }

      .quick-nav a:hover {
        color: var(--exam-primary);
      }
    `;
    document.head.appendChild(style);
  }

  /**
   * 注入导航元素（如果存在目标容器）
   */
  injectNavigationIfExists() {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        this.injectNavigation('.module-header nav');
      });
    } else {
      this.injectNavigation('.module-header nav');
    }
  }

  /**
   * 启用考试模式
   */
  enableExamMode() {
    // 设置考试模式标识
    document.documentElement.setAttribute('data-theme', 'exam-prep');
    document.documentElement.setAttribute('data-exam-mode', 'true');

    // 添加考试模式徽章
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        this.addExamModeBadge();
      });
    } else {
      this.addExamModeBadge();
    }

    console.log('[ExamPrepAdapter] 考试模式已启用');
  }

  /**
   * 添加考试模式徽章
   */
  addExamModeBadge() {
    const badge = document.createElement('div');
    badge.className = 'exam-mode-badge';
    badge.textContent = '⚡ 期末速通模式';
    document.body.appendChild(badge);
  }

  /**
   * 设置快速导航
   */
  setupQuickNav() {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        this.createQuickNav();
      });
    } else {
      this.createQuickNav();
    }
  }

  /**
   * 创建快速导航
   */
  createQuickNav() {
    const quickNav = document.createElement('div');
    quickNav.className = 'quick-nav';
    quickNav.innerHTML = `
      <h4>🚀 快速跳转</h4>
      <a href="${this.getResourcePath('knowledge/knowledge-tree.html')}">知识树</a>
      <a href="${this.getResourcePath('knowledge/concept-navigator-fast.html')}">概念导航</a>
      <a href="./index.html">模块主页</a>
      <a href="${this.getNavigationPath()}">返回主页</a>
    `;
    document.body.appendChild(quickNav);
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
  module.exports = ExamPrepAdapter;
}

// 在浏览器环境中注册到全局
if (typeof window !== 'undefined') {
  window.ExamPrepAdapter = ExamPrepAdapter;
}
