/**
 * 聊天布局组件
 */
import { Sidebar } from './Sidebar.js';
import { ChatArea } from './ChatArea.js';
import { Header } from './Header.js';
import { InputArea } from './InputArea.js';
import { Modal } from './Modal.js';

export class ChatLayout {
  constructor({ stateManager, apiClient, storageManager }) {
    this.stateManager = stateManager;
    this.apiClient = apiClient;
    this.storageManager = storageManager;

    // 子组件
    this.sidebar = null;
    this.chatArea = null;
    this.header = null;
    this.inputArea = null;
    this.settingsModal = null;

    // DOM元素
    this.appElement = document.getElementById('app');
    this.overlay = null;

    // 响应式状态
    this.isMobile = window.innerWidth <= 768;
    this.isSidebarOpen = !this.isMobile;

    this.init();
  }

  /**
   * 初始化布局
   */
  init() {
    this.createOverlay();
    this.initComponents();
    this.bindEvents();
  }

  /**
   * 创建遮罩层
   */
  createOverlay() {
    this.overlay = document.createElement('div');
    this.overlay.className = 'overlay';
    this.overlay.addEventListener('click', () => {
      this.toggleSidebar(false);
    });
  }

  /**
   * 初始化子组件
   */
  initComponents() {
    this.sidebar = new Sidebar({
      stateManager: this.stateManager,
      onConversationSelect: (conversation) => this.loadConversation(conversation.id),
      onNewConversation: () => this.createNewConversation(),
      onSearch: (query) => this.searchConversations(query)
    });

    this.chatArea = new ChatArea({
      stateManager: this.stateManager,
      apiClient: this.apiClient,
      onSendMessage: (message) => this.sendMessage(message),
      onQuickAction: (template) => this.handleQuickAction(template)
    });

    this.header = new Header({
      onSidebarToggle: () => this.toggleSidebar(),
      onSettingsClick: () => this.showSettingsModal(),
      onUserMenuClick: () => this.showUserMenu()
    });

    this.inputArea = new InputArea({
      apiClient: this.apiClient,
      onSendMessage: (message) => this.sendMessage(message),
      onAttachFile: (file) => this.handleFileAttach(file)
    });

    // 设置模态框
    this.settingsModal = new Modal({
      title: '设置',
      onSave: (settings) => this.saveSettings(settings),
      onCancel: () => this.closeSettingsModal()
    });
  }

  /**
   * 绑定事件
   */
  bindEvents() {
    // 窗口大小变化
    window.addEventListener('resize', () => {
      this.handleResize();
    });

    // 快捷键
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.closeModals();
      }
    });

    // 移动端手势
    let touchStartX = 0;
    document.addEventListener('touchstart', (e) => {
      touchStartX = e.touches[0].clientX;
    });

    document.addEventListener('touchend', (e) => {
      const touchEndX = e.changedTouches[0].clientX;
      const diff = touchStartX - touchEndX;

      // 右滑打开侧边栏
      if (Math.abs(diff) > 50 && touchStartX < 50) {
        this.toggleSidebar(true);
      }

      // 左滑关闭侧边栏
      if (Math.abs(diff) > 50 && touchStartX > window.innerWidth - 50) {
        this.toggleSidebar(false);
      }
    });
  }

  /**
   * 渲染布局
   */
  async render() {
    // 组件在构造时已绑定所需DOM，无需渲染方法
    // 兼容存在render方法的组件
    if (this.sidebar && typeof this.sidebar.render === 'function') {
      await this.sidebar.render();
    }
    if (this.chatArea && typeof this.chatArea.render === 'function') {
      await this.chatArea.render();
    }
    if (this.header && typeof this.header.render === 'function') {
      const headerEl = this.header.render();
      const topBar = document.querySelector('.topbar');
      if (headerEl && topBar && !topBar.dataset.injected) {
        topBar.dataset.injected = 'true';
        // 可选择将header内容插入到现有topbar中
      }
    }
    if (this.inputArea && typeof this.inputArea.render === 'function') {
      await this.inputArea.render();
    }

    this.updateResponsiveState();
  }

  /**
   * 切换侧边栏
   */
  toggleSidebar(force = null) {
    if (force !== null) {
      this.isSidebarOpen = force;
    } else {
      this.isSidebarOpen = !this.isSidebarOpen;
    }

    this.updateSidebarState();
    this.stateManager.set('sidebarOpen', this.isSidebarOpen);
  }

  /**
   * 更新侧边栏状态
   */
  updateSidebarState() {
    const sidebar = document.getElementById('sidebar');

    if (this.isMobile) {
      if (this.isSidebarOpen) {
        sidebar.classList.add('open');
        document.body.appendChild(this.overlay);
        this.overlay.classList.add('active');
      } else {
        sidebar.classList.remove('open');
        this.overlay.classList.remove('active');
        if (this.overlay.parentNode) {
          this.overlay.parentNode.removeChild(this.overlay);
        }
      }
    } else {
      sidebar.style.transform = this.isSidebarOpen ? 'translateX(0)' : `translateX(-100%)`;
    }
  }

  /**
   * 处理窗口大小变化
   */
  handleResize() {
    const wasMobile = this.isMobile;
    this.isMobile = window.innerWidth <= 768;

    if (wasMobile !== this.isMobile) {
      this.updateResponsiveState();
    }
  }

  /**
   * 更新响应式状态
   */
  updateResponsiveState() {
    const chatArea = document.querySelector('.chat-area');
    const sidebar = document.getElementById('sidebar');

    if (this.isMobile) {
      // 移动端状态
      if (this.overlay.parentNode) {
        this.overlay.parentNode.removeChild(this.overlay);
      }
      sidebar.classList.remove('open');
      this.isSidebarOpen = false;
      chatArea.style.marginLeft = '0';
    } else {
      // 桌面端状态
      const sidebarWidth = getComputedStyle(document.documentElement)
        .getPropertyValue('--sidebar-width').trim();
      chatArea.style.marginLeft = this.isSidebarOpen ? sidebarWidth : '0';
      sidebar.style.transform = this.isSidebarOpen ? 'translateX(0)' : `translateX(-100%)`;
    }
  }

  /**
   * 创建新对话
   */
  createNewConversation() {
    const conversation = {
      id: this.generateId(),
      title: '新对话',
      messages: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.stateManager.set('currentConversation', conversation);
    this.stateManager.addConversation(conversation);
    this.chatArea.clearMessages();
    this.chatArea.showWelcomeScreen();
  }

  /**
   * 加载对话
   */
  async loadConversation(conversationId) {
    try {
      const conversation = await this.storageManager.getConversation(conversationId);
      if (conversation) {
        this.stateManager.set('currentConversation', conversation);
        this.chatArea.loadMessages(conversation.messages);
        this.chatArea.hideWelcomeScreen();
      }
    } catch (error) {
      console.error('Failed to load conversation:', error);
      this.showError('加载对话失败');
    }
  }

  /**
   * 发送消息
   */
  async sendMessage(content) {
    try {
      const message = {
        id: this.generateId(),
        role: 'user',
        content: content,
        timestamp: new Date().toISOString(),
        status: 'sending'
      };

      // 添加消息到当前对话
      const currentConversation = this.stateManager.get('currentConversation');
      if (!currentConversation) {
        this.createNewConversation();
      }

      // 显示用户消息
      this.chatArea.addMessage(message);

      // 更新对话状态
      const updatedConversation = this.stateManager.get('currentConversation');
      updatedConversation.messages.push(message);
      updatedConversation.updatedAt = new Date().toISOString();

      // 如果是新对话的第一条消息，生成标题
      if (updatedConversation.messages.length === 1) {
        updatedConversation.title = this.generateConversationTitle(content);
      }

      this.stateManager.set('currentConversation', updatedConversation);
      this.storageManager.saveConversation(updatedConversation);

      // 发送到API
      this.chatArea.showLoading(true);

      const response = await this.apiClient.sendMessage({
        message: content,
        conversationHistory: updatedConversation.messages.slice(0, -1)
      });

      this.chatArea.showLoading(false);

      // 添加AI回复
      const aiMessage = {
        id: this.generateId(),
        role: 'assistant',
        content: response.content,
        timestamp: new Date().toISOString(),
        status: 'sent',
        metadata: response.metadata
      };

      this.chatArea.addMessage(aiMessage);

      // 更新对话
      const finalConversation = this.stateManager.get('currentConversation');
      finalConversation.messages.push(aiMessage);
      finalConversation.updatedAt = new Date().toISOString();

      this.stateManager.set('currentConversation', finalConversation);
      this.storageManager.saveConversation(finalConversation);

    } catch (error) {
      console.error('Failed to send message:', error);
      this.chatArea.showLoading(false);
      this.showError('消息发送失败，请重试');

      // 更新消息状态为错误
      const conversation = this.stateManager.get('currentConversation');
      if (conversation && conversation.messages.length > 0) {
        const lastMessage = conversation.messages[conversation.messages.length - 1];
        lastMessage.status = 'error';
        this.chatArea.updateMessageStatus(lastMessage.id, 'error');
      }
    }
  }

  /**
   * 处理快速操作
   */
  handleQuickAction(template) {
    console.log('ChatLayout: handleQuickAction called with:', template);
    const templates = {
      normal_distribution: '生成正态分布图表 均值0 标准差1',
      planetary_orbits: '创建太阳系内行星轨道运动模拟',
      projectile_motion: '模拟45度角抛体运动 初速度20m/s',
      harmonic_oscillation: '生成简谐振动图像 振幅2 频率1Hz'
    };

    const message = templates[template] || template;
    console.log('ChatLayout: sending message:', message);
    this.sendMessage(message);
  }

  /**
   * 处理文件附件
   */
  handleFileAttach(file) {
    console.log('File attached:', file);
    // TODO: 实现文件上传逻辑
  }

  /**
   * 搜索对话
   */
  async searchConversations(query) {
    try {
      const conversations = await this.storageManager.searchConversations(query);
      this.sidebar.updateConversationList(conversations);
    } catch (error) {
      console.error('Failed to search conversations:', error);
    }
  }

  /**
   * 显示设置模态框
   */
  showSettingsModal() {
    const settings = this.stateManager.get('settings') || {};
    this.settingsModal.show(settings);
  }

  /**
   * 关闭设置模态框
   */
  closeSettingsModal() {
    this.settingsModal.hide();
  }

  /**
   * 保存设置
   */
  async saveSettings(settings) {
    try {
      this.stateManager.set('settings', settings);
      await this.storageManager.saveSettings(settings);

      // 应用主题设置
      if (settings.theme) {
        document.documentElement.setAttribute('data-theme', settings.theme);
      }

      // 应用字体大小设置
      if (settings.fontSize) {
        document.documentElement.setAttribute('data-font-size', settings.fontSize);
      }

      this.closeSettingsModal();
      this.showSuccess('设置已保存');
    } catch (error) {
      console.error('Failed to save settings:', error);
      this.showError('保存设置失败');
    }
  }

  /**
   * 显示用户菜单
   */
  showUserMenu() {
    const dropdown = document.getElementById('userDropdown');
    dropdown.style.display = dropdown.style.display === 'none' ? 'block' : 'none';
  }

  /**
   * 显示帮助
   */
  showHelp() {
    // TODO: 实现帮助功能
    console.log('Show help');
  }

  /**
   * 关闭所有模态框
   */
  closeModals() {
    this.closeSettingsModal();
    document.getElementById('userDropdown').style.display = 'none';
  }

  /**
   * 显示成功消息
   */
  showSuccess(message) {
    this.showToast(message, 'success');
  }

  /**
   * 显示错误消息
   */
  showError(message) {
    this.showToast(message, 'error');
  }

  /**
   * 显示提示消息
   */
  showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;

    const colors = {
      success: '#10b981',
      error: '#ef4444',
      info: '#3b82f6',
      warning: '#f59e0b'
    };

    toast.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      background-color: ${colors[type]};
      color: white;
      padding: 12px 16px;
      border-radius: 8px;
      z-index: 10000;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      transform: translateY(100px);
      opacity: 0;
      transition: all 0.3s ease;
    `;

    document.body.appendChild(toast);

    // 触发动画
    setTimeout(() => {
      toast.style.transform = 'translateY(0)';
      toast.style.opacity = '1';
    }, 100);

    // 自动移除
    setTimeout(() => {
      toast.style.transform = 'translateY(100px)';
      toast.style.opacity = '0';
      setTimeout(() => {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
      }, 300);
    }, 3000);
  }

  /**
   * 生成唯一ID
   */
  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  /**
   * 生成对话标题
   */
  generateConversationTitle(content) {
    const words = content.split(/\s+/).slice(0, 4);
    return words.join(' ') + (content.split(/\s+/).length > 4 ? '...' : '');
  }
}
