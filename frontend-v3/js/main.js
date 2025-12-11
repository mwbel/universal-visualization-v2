// 主应用入口点
import { ChatLayout } from './components/ChatLayout.js';
import { StateManager } from './utils/StateManager.js';
import { ApiClient } from './utils/ApiClient.js';
import { ThemeManager } from './utils/ThemeManager.js';
import { StorageManager } from './utils/StorageManager.js';
import { SettingsModal } from './components/SettingsModal.js';

/**
 * 主应用类
 */
class ChatApp {
  constructor() {
    this.stateManager = null;
    this.apiClient = null;
    this.themeManager = null;
    this.storageManager = null;
    this.chatLayout = null;
    this.settingsModal = null;

    this.init();
  }

  /**
   * 初始化应用
   */
  async init() {
    try {
      // 初始化工具管理器
      this.stateManager = new StateManager();
      this.apiClient = new ApiClient();
      this.themeManager = new ThemeManager();
      this.storageManager = new StorageManager();

      // 初始化设置弹窗
      this.settingsModal = new SettingsModal(this.apiClient);

      // 初始化主题
      await this.themeManager.init();

      // 初始化布局组件
      this.chatLayout = new ChatLayout({
        stateManager: this.stateManager,
        apiClient: this.apiClient,
        storageManager: this.storageManager
      });

      // 渲染应用
      await this.chatLayout.render();

      // 初始化事件监听
      this.initEventListeners();

      // 恢复上一次的状态
      await this.restoreState();

      console.log('Chat App initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Chat App:', error);
      this.showError('应用初始化失败，请刷新页面重试');
    }
  }

  /**
   * 初始化事件监听器
   */
  initEventListeners() {
    // 全局快捷键
    document.addEventListener('keydown', this.handleKeyDown.bind(this));

    // 主题切换
    document.addEventListener('click', (e) => {
      if (e.target.closest('#themeToggleBtn')) {
        this.themeManager.toggle();
      }
    });

    // 设置模态框
    document.addEventListener('click', (e) => {
      if (e.target.closest('#settingsBtn') || e.target.closest('#settingsDropdownBtn')) {
        this.chatLayout.showSettingsModal();
      }
    });

    // 窗口大小变化
    window.addEventListener('resize', this.handleResize.bind(this));

    // 页面卸载前保存状态
    window.addEventListener('beforeunload', this.handleBeforeUnload.bind(this));
  }

  /**
   * 处理键盘快捷键
   */
  handleKeyDown(event) {
    // Ctrl+K 或 Cmd+K: 新建对话
    if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
      event.preventDefault();
      this.chatLayout.createNewConversation();
    }

    // Ctrl+/: 显示帮助
    if ((event.ctrlKey || event.metaKey) && event.key === '/') {
      event.preventDefault();
      this.chatLayout.showHelp();
    }

    // Escape: 关闭模态框
    if (event.key === 'Escape') {
      this.chatLayout.closeModals();
    }
  }

  /**
   * 处理窗口大小变化
   */
  handleResize() {
    if (this.chatLayout) {
      this.chatLayout.handleResize();
    }
  }

  /**
   * 处理页面卸载
   */
  handleBeforeUnload() {
    if (this.stateManager) {
      this.stateManager.saveToStorage();
    }
  }

  /**
   * 恢复应用状态
   */
  async restoreState() {
    try {
      const savedState = await this.storageManager.getState();
      if (savedState) {
        this.stateManager.loadState(savedState);
      }

      // 恢复当前对话
      const currentConversation = this.stateManager.get('currentConversation');
      if (currentConversation) {
        await this.chatLayout.loadConversation(currentConversation.id);
      }
    } catch (error) {
      console.warn('Failed to restore state:', error);
    }
  }

  /**
   * 显示错误消息
   */
  showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-toast';
    errorDiv.textContent = message;
    errorDiv.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background-color: #ef4444;
      color: white;
      padding: 12px 16px;
      border-radius: 8px;
      z-index: 10000;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    `;

    document.body.appendChild(errorDiv);

    setTimeout(() => {
      if (errorDiv.parentNode) {
        errorDiv.parentNode.removeChild(errorDiv);
      }
    }, 5000);
  }
}

// 等待DOM加载完成
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new ChatApp();
  });
} else {
  new ChatApp();
}

// 导出主应用类供测试使用
export { ChatApp };