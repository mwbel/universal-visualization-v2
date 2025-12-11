/**
 * 状态管理器
 */
export class StateManager {
  constructor() {
    this.state = {
      conversations: [],
      currentConversation: null,
      settings: {
        theme: 'light',
        fontSize: 'medium',
        language: 'zh-CN'
      },
      sidebarOpen: true,
      user: null
    };

    this.listeners = new Map();
    this.history = [];
    this.historyIndex = -1;
  }

  /**
   * 获取状态
   */
  get(key) {
    if (key.includes('.')) {
      return this.getNestedValue(key);
    }
    return this.state[key];
  }

  /**
   * 设置状态
   */
  set(key, value) {
    const oldValue = this.get(key);

    if (key.includes('.')) {
      this.setNestedValue(key, value);
    } else {
      this.state[key] = value;
    }

    // 触发监听器
    this.emit(key, value, oldValue);
    this.saveToHistory();
  }

  /**
   * 批量设置状态
   */
  setMultiple(updates) {
    const oldValues = {};

    for (const [key, value] of Object.entries(updates)) {
      oldValues[key] = this.get(key);

      if (key.includes('.')) {
        this.setNestedValue(key, value);
      } else {
        this.state[key] = value;
      }
    }

    // 批量触发监听器
    for (const [key, value] of Object.entries(updates)) {
      this.emit(key, value, oldValues[key]);
    }

    this.saveToHistory();
  }

  /**
   * 添加对话
   */
  addConversation(conversation) {
    this.state.conversations.unshift(conversation);
    this.emit('conversations', this.state.conversations);
    this.saveToHistory();
  }

  /**
   * 更新对话
   */
  updateConversation(id, updates) {
    const index = this.state.conversations.findIndex(conv => conv.id === id);
    if (index !== -1) {
      this.state.conversations[index] = { ...this.state.conversations[index], ...updates };
      this.emit('conversations', this.state.conversations);

      if (this.state.currentConversation && this.state.currentConversation.id === id) {
        this.state.currentConversation = this.state.conversations[index];
        this.emit('currentConversation', this.state.currentConversation);
      }

      this.saveToHistory();
    }
  }

  /**
   * 删除对话
   */
  deleteConversation(id) {
    this.state.conversations = this.state.conversations.filter(conv => conv.id !== id);

    if (this.state.currentConversation && this.state.currentConversation.id === id) {
      this.state.currentConversation = null;
      this.emit('currentConversation', null);
    }

    this.emit('conversations', this.state.conversations);
    this.saveToHistory();
  }

  /**
   * 搜索对话
   */
  searchConversations(query) {
    const lowerQuery = query.toLowerCase();
    return this.state.conversations.filter(conv => {
      return conv.title.toLowerCase().includes(lowerQuery) ||
             conv.messages.some(msg =>
               msg.content.toLowerCase().includes(lowerQuery)
             );
    });
  }

  /**
   * 添加状态监听器
   */
  subscribe(key, callback) {
    if (!this.listeners.has(key)) {
      this.listeners.set(key, new Set());
    }

    const listener = { callback };
    this.listeners.get(key).add(listener);

    // 返回取消订阅函数
    return () => {
      const listeners = this.listeners.get(key);
      if (listeners) {
        listeners.delete(listener);
        if (listeners.size === 0) {
          this.listeners.delete(key);
        }
      }
    };
  }

  /**
   * 触发事件
   */
  emit(key, newValue, oldValue) {
    const listeners = this.listeners.get(key);
    if (listeners) {
      listeners.forEach(listener => {
        try {
          listener.callback(newValue, oldValue, key);
        } catch (error) {
          console.error('State listener error:', error);
        }
      });
    }

    // 触发通用的状态变化监听器
    const generalListeners = this.listeners.get('*');
    if (generalListeners) {
      generalListeners.forEach(listener => {
        try {
          listener.callback({ key, newValue, oldValue });
        } catch (error) {
          console.error('General state listener error:', error);
        }
      });
    }
  }

  /**
   * 撤销
   */
  undo() {
    if (this.canUndo()) {
      this.historyIndex--;
      this.restoreFromHistory();
      return true;
    }
    return false;
  }

  /**
   * 重做
   */
  redo() {
    if (this.canRedo()) {
      this.historyIndex++;
      this.restoreFromHistory();
      return true;
    }
    return false;
  }

  /**
   * 是否可以撤销
   */
  canUndo() {
    return this.historyIndex > 0;
  }

  /**
   * 是否可以重做
   */
  canRedo() {
    return this.historyIndex < this.history.length - 1;
  }

  /**
   * 保存到历史记录
   */
  saveToHistory() {
    // 如果当前不在历史记录的末尾，删除后续记录
    if (this.historyIndex < this.history.length - 1) {
      this.history = this.history.slice(0, this.historyIndex + 1);
    }

    // 添加当前状态到历史记录
    this.history.push(JSON.parse(JSON.stringify(this.state)));
    this.historyIndex = this.history.length - 1;

    // 限制历史记录长度
    if (this.history.length > 50) {
      this.history.shift();
      this.historyIndex--;
    }
  }

  /**
   * 从历史记录恢复
   */
  restoreFromHistory() {
    if (this.historyIndex >= 0 && this.historyIndex < this.history.length) {
      const prevState = this.state;
      this.state = JSON.parse(JSON.stringify(this.history[this.historyIndex]));

      // 触发所有状态变化事件
      this.emit('*', {
        type: 'history-restore',
        newState: this.state,
        prevState
      });
    }
  }

  /**
   * 保存到本地存储
   */
  async saveToStorage() {
    try {
      const stateToSave = {
        conversations: this.state.conversations,
        settings: this.state.settings,
        sidebarOpen: this.state.sidebarOpen,
        lastSaved: new Date().toISOString()
      };

      localStorage.setItem('chatAppState', JSON.stringify(stateToSave));
    } catch (error) {
      console.error('Failed to save state to storage:', error);
    }
  }

  /**
   * 从本地存储加载
   */
  async loadFromStorage() {
    try {
      const saved = localStorage.getItem('chatAppState');
      if (saved) {
        const parsedState = JSON.parse(saved);

        // 只恢复指定的状态项
        this.state.conversations = parsedState.conversations || [];
        this.state.settings = { ...this.state.settings, ...parsedState.settings };
        this.state.sidebarOpen = parsedState.sidebarOpen !== false;

        return true;
      }
    } catch (error) {
      console.error('Failed to load state from storage:', error);
    }
    return false;
  }

  /**
   * 清除所有状态
   */
  clear() {
    this.state = {
      conversations: [],
      currentConversation: null,
      settings: {
        theme: 'light',
        fontSize: 'medium',
        language: 'zh-CN'
      },
      sidebarOpen: true,
      user: null
    };

    this.history = [];
    this.historyIndex = -1;

    this.emit('*', { type: 'clear' });
  }

  /**
   * 导出状态
   */
  export() {
    return {
      ...this.state,
      exportedAt: new Date().toISOString(),
      version: '1.0.0'
    };
  }

  /**
   * 导入状态
   */
  import(importedState) {
    try {
      // 验证导入的状态
      if (!this.validateImportedState(importedState)) {
        throw new Error('Invalid state format');
      }

      this.state = { ...this.state, ...importedState };
      this.saveToHistory();

      this.emit('*', { type: 'import', importedState });
      return true;
    } catch (error) {
      console.error('Failed to import state:', error);
      return false;
    }
  }

  /**
   * 验证导入的状态
   */
  validateImportedState(state) {
    // 基本的结构验证
    return state &&
           typeof state === 'object' &&
           Array.isArray(state.conversations) &&
           typeof state.settings === 'object';
  }

  /**
   * 获取嵌套值
   */
  getNestedValue(path) {
    const keys = path.split('.');
    let current = this.state;

    for (const key of keys) {
      if (current && typeof current === 'object' && key in current) {
        current = current[key];
      } else {
        return undefined;
      }
    }

    return current;
  }

  /**
   * 设置嵌套值
   */
  setNestedValue(path, value) {
    const keys = path.split('.');
    let current = this.state;

    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i];
      if (!(key in current) || typeof current[key] !== 'object') {
        current[key] = {};
      }
      current = current[key];
    }

    current[keys[keys.length - 1]] = value;
  }

  /**
   * 获取状态统计信息
   */
  getStats() {
    return {
      conversationsCount: this.state.conversations.length,
      totalMessages: this.state.conversations.reduce((total, conv) =>
        total + conv.messages.length, 0
      ),
      lastActivity: this.state.conversations.length > 0
        ? Math.max(...this.state.conversations.map(conv =>
            new Date(conv.updatedAt).getTime()
          ))
        : null,
      stateSize: JSON.stringify(this.state).length
    };
  }
}