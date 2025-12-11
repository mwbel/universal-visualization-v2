/**
 * 侧边栏组件
 */
export class Sidebar {
  constructor({ stateManager, onConversationSelect, onNewConversation, onSearch }) {
    this.stateManager = stateManager;
    this.onConversationSelect = onConversationSelect;
    this.onNewConversation = onNewConversation;
    this.onSearch = onSearch;

    this.element = null;
    this.conversationList = null;
    this.searchInput = null;

    this.init();
  }

  /**
   * 初始化侧边栏
   */
  init() {
    this.element = document.getElementById('sidebar');
    this.conversationList = document.getElementById('conversationList');
    this.searchInput = document.getElementById('searchInput');

    this.renderSettingsButton(); // 渲染设置按钮
    this.bindEvents();
    this.loadConversations();
  }

  /**
   * 渲染设置按钮
   */
  renderSettingsButton() {
    const header = this.element.querySelector('.sidebar-header');
    // 检查是否已经存在
    if (header.querySelector('.settings-btn-container')) return;

    const btnContainer = document.createElement('div');
    btnContainer.className = 'settings-btn-container';
    btnContainer.style.marginTop = '10px';
    
    btnContainer.innerHTML = `
      <button id="settingsBtn" class="new-chat-btn" style="background-color: var(--bg-tertiary); color: var(--text-primary); border: 1px solid var(--border-primary);">
        <span style="font-size: 1.2em;">⚙️</span> AI 设置
      </button>
    `;
    
    header.appendChild(btnContainer);
  }

  /**
   * 绑定事件
   */
  bindEvents() {
    // 设置按钮事件
    const settingsBtn = document.getElementById('settingsBtn');
    if (settingsBtn) {
      settingsBtn.addEventListener('click', () => {
        // 触发自定义事件，打开设置弹窗
        window.dispatchEvent(new CustomEvent('open-settings-modal'));
      });
    }

    // 新建对话按钮
    const newChatBtn = document.getElementById('newChatBtn');
    if (newChatBtn) {
      newChatBtn.addEventListener('click', () => {
        this.onNewConversation();
      });
    }

    // 搜索功能
    if (this.searchInput) {
      let searchTimeout;
      this.searchInput.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
          this.handleSearch(e.target.value);
        }, 300);
      });
    }

    // 监听状态变化
    this.stateManager.subscribe('conversations', () => {
      this.loadConversations();
    });

    this.stateManager.subscribe('currentConversation', (conv) => {
      this.updateActiveConversation(conv);
    });
  }

  /**
   * 处理搜索
   */
  async handleSearch(query) {
    if (this.onSearch) {
      await this.onSearch(query);
    }
  }

  /**
   * 加载对话列表
   */
  async loadConversations() {
    try {
      const conversations = this.stateManager.get('conversations') || [];
      this.renderConversationList(conversations);
    } catch (error) {
      console.error('Failed to load conversations:', error);
      this.renderConversationList([]);
    }
  }

  /**
   * 渲染对话列表
   */
  renderConversationList(conversations) {
    if (!this.conversationList) return;

    this.conversationList.innerHTML = '';

    if (conversations.length === 0) {
      this.conversationList.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">💬</div>
          <div class="empty-text">还没有对话</div>
          <div class="empty-desc">点击"新建对话"开始聊天</div>
        </div>
      `;
      return;
    }

    conversations.forEach(conversation => {
      const item = this.createConversationItem(conversation);
      this.conversationList.appendChild(item);
    });
  }

  /**
   * 创建对话项
   */
  createConversationItem(conversation) {
    const item = document.createElement('div');
    item.className = 'conversation-item';
    item.dataset.id = conversation.id;

    const lastMessage = conversation.messages[conversation.messages.length - 1];
    const preview = lastMessage ? this.getMessagePreview(lastMessage.content) : '暂无消息';
    const time = this.formatTime(conversation.updatedAt);
    const messageCount = conversation.messages.length;

    item.innerHTML = `
      <div class="conversation-icon">
        ${this.getConversationIcon(conversation)}
      </div>
      <div class="conversation-info">
        <div class="conversation-title">${this.escapeHtml(conversation.title)}</div>
        <div class="conversation-preview">${this.escapeHtml(preview)}</div>
      </div>
      <div class="conversation-meta">
        <div class="conversation-time">${time}</div>
        ${messageCount > 1 ? `<div class="conversation-badge">${messageCount}</div>` : ''}
      </div>
    `;

    // 点击事件
    item.addEventListener('click', () => {
      this.onConversationSelect(conversation);
    });

    // 右键菜单
    item.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      this.showContextMenu(e, conversation);
    });

    return item;
  }

  /**
   * 获取对话图标
   */
  getConversationIcon(conversation) {
    // 根据对话内容返回合适的图标
    const lastMessage = conversation.messages[conversation.messages.length - 1];
    if (!lastMessage) return '💬';

    const content = lastMessage.content.toLowerCase();
    if (content.includes('图表') || content.includes('图形') || content.includes('可视化')) {
      return '📊';
    } else if (content.includes('数学') || content.includes('公式')) {
      return '🔢';
    } else if (content.includes('天文') || content.includes('星球') || content.includes('太阳系')) {
      return '🪐';
    } else if (content.includes('物理') || content.includes('运动')) {
      return '⚡';
    } else {
      return '💬';
    }
  }

  /**
   * 获取消息预览
   */
  getMessagePreview(content) {
    // 移除HTML标签和多余空格
    const cleanContent = content
      .replace(/<[^>]*>/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    // 限制预览长度
    return cleanContent.length > 50
      ? cleanContent.substring(0, 50) + '...'
      : cleanContent;
  }

  /**
   * 格式化时间
   */
  formatTime(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) {
      return '刚刚';
    } else if (diffMins < 60) {
      return `${diffMins}分钟前`;
    } else if (diffHours < 24) {
      return `${diffHours}小时前`;
    } else if (diffDays < 7) {
      return `${diffDays}天前`;
    } else {
      // 显示具体日期
      return date.toLocaleDateString('zh-CN', {
        month: 'short',
        day: 'numeric'
      });
    }
  }

  /**
   * 转义HTML
   */
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * 更新活动对话
   */
  updateActiveConversation(currentConversation) {
    const items = this.conversationList.querySelectorAll('.conversation-item');
    items.forEach(item => {
      const isActive = currentConversation && item.dataset.id === currentConversation.id;
      item.classList.toggle('active', isActive);
    });
  }

  /**
   * 显示右键菜单
   */
  showContextMenu(event, conversation) {
    // 移除现有菜单
    const existingMenu = document.querySelector('.context-menu');
    if (existingMenu) {
      existingMenu.remove();
    }

    const menu = document.createElement('div');
    menu.className = 'context-menu';
    menu.style.cssText = `
      position: fixed;
      left: ${event.clientX}px;
      top: ${event.clientY}px;
      background: var(--bg-primary);
      border: 1px solid var(--border-primary);
      border-radius: var(--border-radius);
      box-shadow: var(--shadow-lg);
      z-index: 1000;
      min-width: 150px;
    `;

    menu.innerHTML = `
      <div class="context-menu-item" data-action="rename">
        <span>📝</span>
        <span>重命名</span>
      </div>
      <div class="context-menu-item" data-action="duplicate">
        <span>📋</span>
        <span>复制</span>
      </div>
      <div class="context-menu-divider"></div>
      <div class="context-menu-item" data-action="delete">
        <span>🗑️</span>
        <span>删除</span>
      </div>
    `;

    document.body.appendChild(menu);

    // 绑定菜单事件
    menu.addEventListener('click', (e) => {
      const action = e.target.closest('.context-menu-item')?.dataset.action;
      if (action) {
        this.handleContextMenuAction(action, conversation);
        menu.remove();
      }
    });

    // 点击其他地方关闭菜单
    const closeMenu = (e) => {
      if (!menu.contains(e.target)) {
        menu.remove();
        document.removeEventListener('click', closeMenu);
      }
    };
    document.addEventListener('click', closeMenu);
  }

  /**
   * 处理右键菜单操作
   */
  async handleContextMenuAction(action, conversation) {
    switch (action) {
      case 'rename':
        this.renameConversation(conversation);
        break;
      case 'duplicate':
        await this.duplicateConversation(conversation);
        break;
      case 'delete':
        await this.deleteConversation(conversation);
        break;
    }
  }

  /**
   * 重命名对话
   */
  renameConversation(conversation) {
    const newTitle = prompt('请输入新的对话名称:', conversation.title);
    if (newTitle && newTitle.trim() && newTitle !== conversation.title) {
      conversation.title = newTitle.trim();
      this.stateManager.updateConversation(conversation.id, { title: conversation.title });
    }
  }

  /**
   * 复制对话
   */
  async duplicateConversation(conversation) {
    const newConversation = {
      ...conversation,
      id: this.generateId(),
      title: `${conversation.title} (副本)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.stateManager.addConversation(newConversation);
  }

  /**
   * 删除对话
   */
  async deleteConversation(conversation) {
    const confirmed = confirm(`确定要删除对话"${conversation.title}"吗？此操作不可撤销。`);
    if (confirmed) {
      this.stateManager.deleteConversation(conversation.id);
    }
  }

  /**
   * 更新对话列表
   */
  updateConversationList(conversations) {
    this.renderConversationList(conversations);
  }

  /**
   * 搜索对话
   */
  async searchConversations(query) {
    if (!query.trim()) {
      this.loadConversations();
      return;
    }

    try {
      const results = await this.stateManager.searchConversations(query);
      this.renderConversationList(results);
    } catch (error) {
      console.error('Failed to search conversations:', error);
    }
  }

  /**
   * 生成唯一ID
   */
  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  /**
   * 滚动到对话
   */
  scrollToConversation(conversationId) {
    const item = this.conversationList.querySelector(`[data-id="${conversationId}"]`);
    if (item) {
      item.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      item.classList.add('highlight');
      setTimeout(() => {
        item.classList.remove('highlight');
      }, 1000);
    }
  }

  /**
   * 获取焦点
   */
  focus() {
    if (this.searchInput) {
      this.searchInput.focus();
    }
  }

  /**
   * 销毁组件
   */
  destroy() {
    // 移除事件监听器
    if (this.searchInput) {
      this.searchInput.removeEventListener('input', this.handleSearch);
    }

    // 清空引用
    this.element = null;
    this.conversationList = null;
    this.searchInput = null;
  }
}