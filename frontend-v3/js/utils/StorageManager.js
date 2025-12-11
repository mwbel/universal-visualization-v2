/**
 * 本地存储管理器
 */
export class StorageManager {
  constructor() {
    this.storageKeys = {
      conversations: 'chatAppConversations',
      settings: 'chatAppSettings',
      userState: 'chatAppState',
      cache: 'chatAppCache'
    };

    this.maxStorageSize = 10 * 1024 * 1024; // 10MB
    this.cacheExpiry = 24 * 60 * 60 * 1000; // 24小时

    this.init();
  }

  /**
   * 初始化存储管理器
   */
  async init() {
    try {
      await this.cleanupExpiredCache();
      await this.optimizeStorage();
    } catch (error) {
      console.warn('Storage initialization error:', error);
    }
  }

  /**
   * 保存对话
   */
  async saveConversation(conversation) {
    try {
      const conversations = await this.getConversations();
      const index = conversations.findIndex(conv => conv.id === conversation.id);

      if (index !== -1) {
        conversations[index] = conversation;
      } else {
        conversations.unshift(conversation);
      }

      // 限制对话数量，保留最新的1000个
      if (conversations.length > 1000) {
        conversations.splice(1000);
      }

      localStorage.setItem(this.storageKeys.conversations, JSON.stringify(conversations));
      await this.cacheConversation(conversation);

      return true;
    } catch (error) {
      console.error('Failed to save conversation:', error);
      return false;
    }
  }

  /**
   * 获取对话
   */
  async getConversation(id) {
    try {
      // 先尝试从缓存获取
      const cached = await this.getCachedConversation(id);
      if (cached) {
        return cached;
      }

      // 从主存储获取
      const conversations = await this.getConversations();
      return conversations.find(conv => conv.id === id) || null;
    } catch (error) {
      console.error('Failed to get conversation:', error);
      return null;
    }
  }

  /**
   * 获取所有对话
   */
  async getConversations() {
    try {
      const stored = localStorage.getItem(this.storageKeys.conversations);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Failed to get conversations:', error);
      return [];
    }
  }

  /**
   * 删除对话
   */
  async deleteConversation(id) {
    try {
      const conversations = await this.getConversations();
      const filtered = conversations.filter(conv => conv.id !== id);

      localStorage.setItem(this.storageKeys.conversations, JSON.stringify(filtered));
      await this.removeCachedConversation(id);

      return true;
    } catch (error) {
      console.error('Failed to delete conversation:', error);
      return false;
    }
  }

  /**
   * 搜索对话
   */
  async searchConversations(query) {
    try {
      const conversations = await this.getConversations();
      const lowerQuery = query.toLowerCase();

      return conversations.filter(conv => {
        return conv.title.toLowerCase().includes(lowerQuery) ||
               conv.messages.some(msg =>
                 msg.content.toLowerCase().includes(lowerQuery)
               );
      });
    } catch (error) {
      console.error('Failed to search conversations:', error);
      return [];
    }
  }

  /**
   * 保存设置
   */
  async saveSettings(settings) {
    try {
      localStorage.setItem(this.storageKeys.settings, JSON.stringify(settings));
      return true;
    } catch (error) {
      console.error('Failed to save settings:', error);
      return false;
    }
  }

  /**
   * 获取设置
   */
  async getSettings() {
    try {
      const stored = localStorage.getItem(this.storageKeys.settings);
      return stored ? JSON.parse(stored) : {};
    } catch (error) {
      console.error('Failed to get settings:', error);
      return {};
    }
  }

  /**
   * 保存用户状态
   */
  async saveState(state) {
    try {
      const stateToSave = {
        currentConversation: state.currentConversation,
        sidebarOpen: state.sidebarOpen,
        lastSaved: new Date().toISOString()
      };

      localStorage.setItem(this.storageKeys.userState, JSON.stringify(stateToSave));
      return true;
    } catch (error) {
      console.error('Failed to save state:', error);
      return false;
    }
  }

  /**
   * 获取用户状态
   */
  async getState() {
    try {
      const stored = localStorage.getItem(this.storageKeys.userState);
      return stored ? JSON.parse(stored) : {};
    } catch (error) {
      console.error('Failed to get state:', error);
      return {};
    }
  }

  /**
   * 缓存对话
   */
  async cacheConversation(conversation) {
    try {
      const cache = await this.getCache();
      cache.conversations[conversation.id] = {
        data: conversation,
        timestamp: Date.now()
      };

      localStorage.setItem(this.storageKeys.cache, JSON.stringify(cache));
    } catch (error) {
      console.error('Failed to cache conversation:', error);
    }
  }

  /**
   * 获取缓存的对话
   */
  async getCachedConversation(id) {
    try {
      const cache = await this.getCache();
      const cached = cache.conversations[id];

      if (!cached) {
        return null;
      }

      // 检查是否过期
      if (Date.now() - cached.timestamp > this.cacheExpiry) {
        delete cache.conversations[id];
        localStorage.setItem(this.storageKeys.cache, JSON.stringify(cache));
        return null;
      }

      return cached.data;
    } catch (error) {
      console.error('Failed to get cached conversation:', error);
      return null;
    }
  }

  /**
   * 移除缓存的对话
   */
  async removeCachedConversation(id) {
    try {
      const cache = await this.getCache();
      delete cache.conversations[id];
      localStorage.setItem(this.storageKeys.cache, JSON.stringify(cache));
    } catch (error) {
      console.error('Failed to remove cached conversation:', error);
    }
  }

  /**
   * 获取缓存
   */
  async getCache() {
    try {
      const stored = localStorage.getItem(this.storageKeys.cache);
      return stored ? JSON.parse(stored) : { conversations: {} };
    } catch (error) {
      console.error('Failed to get cache:', error);
      return { conversations: {} };
    }
  }

  /**
   * 清理过期缓存
   */
  async cleanupExpiredCache() {
    try {
      const cache = await this.getCache();
      const now = Date.now();
      let hasChanges = false;

      Object.keys(cache.conversations).forEach(id => {
        if (now - cache.conversations[id].timestamp > this.cacheExpiry) {
          delete cache.conversations[id];
          hasChanges = true;
        }
      });

      if (hasChanges) {
        localStorage.setItem(this.storageKeys.cache, JSON.stringify(cache));
      }
    } catch (error) {
      console.error('Failed to cleanup cache:', error);
    }
  }

  /**
   * 优化存储空间
   */
  async optimizeStorage() {
    try {
      // 检查存储使用情况
      const totalSize = this.getStorageSize();

      if (totalSize > this.maxStorageSize * 0.8) {
        // 如果使用超过80%，清理旧的缓存
        await this.cleanupExpiredCache();

        // 如果仍然过大，删除最旧的对话
        const conversations = await this.getConversations();
        if (conversations.length > 500) {
          const toKeep = conversations.slice(0, 500);
          localStorage.setItem(this.storageKeys.conversations, JSON.stringify(toKeep));
        }
      }
    } catch (error) {
      console.error('Failed to optimize storage:', error);
    }
  }

  /**
   * 获取存储使用大小
   */
  getStorageSize() {
    let totalSize = 0;

    for (let key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        totalSize += localStorage[key].length + key.length;
      }
    }

    return totalSize;
  }

  /**
   * 获取存储统计信息
   */
  async getStorageStats() {
    try {
      const conversations = await this.getConversations();
      const cache = await this.getCache();
      const settings = await this.getSettings();
      const state = await this.getState();

      return {
        totalSize: this.getStorageSize(),
        maxSize: this.maxStorageSize,
        usage: (this.getStorageSize() / this.maxStorageSize * 100).toFixed(2) + '%',
        conversations: {
          count: conversations.length,
          totalMessages: conversations.reduce((total, conv) => total + conv.messages.length, 0)
        },
        cache: {
          conversations: Object.keys(cache.conversations).length,
          size: JSON.stringify(cache).length
        },
        settings: Object.keys(settings).length,
        lastCleanup: localStorage.getItem('chatAppLastCleanup') || 'Never'
      };
    } catch (error) {
      console.error('Failed to get storage stats:', error);
      return null;
    }
  }

  /**
   * 清除所有数据
   */
  async clearAll() {
    try {
      Object.values(this.storageKeys).forEach(key => {
        localStorage.removeItem(key);
      });

      // 清除其他相关的存储项
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('chatApp')) {
          localStorage.removeItem(key);
        }
      });

      localStorage.setItem('chatAppLastCleanup', new Date().toISOString());
      return true;
    } catch (error) {
      console.error('Failed to clear storage:', error);
      return false;
    }
  }

  /**
   * 导出数据
   */
  async exportData() {
    try {
      const conversations = await this.getConversations();
      const settings = await this.getSettings();
      const state = await this.getState();

      return {
        version: '1.0.0',
        exportedAt: new Date().toISOString(),
        conversations,
        settings,
        state
      };
    } catch (error) {
      console.error('Failed to export data:', error);
      return null;
    }
  }

  /**
   * 导入数据
   */
  async importData(data) {
    try {
      if (!data.version) {
        throw new Error('Invalid data format');
      }

      // 导入对话
      if (data.conversations && Array.isArray(data.conversations)) {
        localStorage.setItem(
          this.storageKeys.conversations,
          JSON.stringify(data.conversations)
        );
      }

      // 导入设置（合并现有设置）
      if (data.settings && typeof data.settings === 'object') {
        const currentSettings = await this.getSettings();
        const mergedSettings = { ...currentSettings, ...data.settings };
        await this.saveSettings(mergedSettings);
      }

      // 导入用户状态
      if (data.state && typeof data.state === 'object') {
        await this.saveState(data.state);
      }

      localStorage.setItem('chatAppLastImport', new Date().toISOString());
      return true;
    } catch (error) {
      console.error('Failed to import data:', error);
      return false;
    }
  }

  /**
   * 检查存储可用性
   */
  isStorageAvailable() {
    try {
      const testKey = 'chatAppStorageTest';
      localStorage.setItem(testKey, 'test');
      localStorage.removeItem(testKey);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * 获取存储类型
   */
  getStorageType() {
    if (typeof Storage !== 'undefined') {
      return 'localStorage';
    }
    return 'none';
  }
}