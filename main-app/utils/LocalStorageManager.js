/**
 * LocalStorageManager.js - 本地存储管理器
 * 提供统一的本地存储接口，支持数据模型持久化、缓存管理和版本控制
 */
(function(global) {
  'use strict';

  /**
   * 本地存储管理器类
   */
  class LocalStorageManager {
    constructor(options = {}) {
      // 配置选项
      this.options = {
        prefix: options.prefix || 'universal_viz_',
        version: options.version || '1.0.0',
        maxSize: options.maxSize || 5 * 1024 * 1024, // 5MB
        enableCompression: options.enableCompression || false,
        enableEncryption: options.enableEncryption || false,
        autoCleanup: options.autoCleanup || true,
        ...options
      };

      // 存储键映射
      this.keys = {
        USER_PROJECTS: 'user_projects',
        USER_FAVORITES: 'user_favorites',
        USER_ANALYTICS: 'user_analytics',
        USER_PREFERENCES: 'user_preferences',
        APP_CACHE: 'app_cache',
        SESSION_DATA: 'session_data'
      };

      // 缓存管理
      this.cache = new Map();
      this.cacheTimeout = options.cacheTimeout || 5 * 60 * 1000; // 5分钟

      // 初始化
      this.init();
    }

    /**
     * 初始化存储管理器
     */
    init() {
      try {
        // 检查localStorage可用性
        if (!this.isLocalStorageAvailable()) {
          throw new Error('localStorage不可用');
        }

        // 检查存储版本
        this.checkVersion();

        // 自动清理过期数据
        if (this.options.autoCleanup) {
          this.autoCleanup();
        }

        console.log('LocalStorageManager 初始化成功');
      } catch (error) {
        console.error('LocalStorageManager 初始化失败:', error);
        this.fallbackToMemoryStorage();
      }
    }

    /**
     * 检查localStorage可用性
     */
    isLocalStorageAvailable() {
      try {
        const testKey = '__test__';
        localStorage.setItem(testKey, 'test');
        localStorage.removeItem(testKey);
        return true;
      } catch (error) {
        return false;
      }
    }

    /**
     * 检查存储版本
     */
    checkVersion() {
      const storedVersion = this.getItem('__version__');

      if (storedVersion && storedVersion !== this.options.version) {
        console.log(`检测到版本更新: ${storedVersion} -> ${this.options.version}`);
        this.handleVersionUpgrade(storedVersion, this.options.version);
      }

      this.setItem('__version__', this.options.version);
    }

    /**
     * 处理版本升级
     */
    handleVersionUpgrade(oldVersion, newVersion) {
      console.log(`执行版本升级从 ${oldVersion} 到 ${newVersion}`);

      // 备份现有数据
      this.backupData();

      // 根据版本执行迁移逻辑
      if (this.compareVersions(oldVersion, '1.0.0') < 0) {
        this.migrateFromPre1_0();
      }

      // 清理旧版本数据
      this.cleanupOldVersionData(oldVersion);
    }

    /**
     * 版本比较
     */
    compareVersions(version1, version2) {
      const v1Parts = version1.split('.').map(Number);
      const v2Parts = version2.split('.').map(Number);

      for (let i = 0; i < Math.max(v1Parts.length, v2Parts.length); i++) {
        const v1Part = v1Parts[i] || 0;
        const v2Part = v2Parts[i] || 0;

        if (v1Part > v2Part) return 1;
        if (v1Part < v2Part) return -1;
      }

      return 0;
    }

    /**
     * 从旧版本迁移数据
     */
    migrateFromPre1_0() {
      console.log('执行pre-1.0版本数据迁移');

      // 迁移用户项目数据
      const oldProjects = this.getItem('projects');
      if (oldProjects) {
        this.setItem(this.keys.USER_PROJECTS, oldProjects);
        this.removeItem('projects');
      }

      // 迁移用户偏好设置
      const oldPrefs = this.getItem('preferences');
      if (oldPrefs) {
        this.setItem(this.keys.USER_PREFERENCES, oldPrefs);
        this.removeItem('preferences');
      }
    }

    /**
     * 获取完整的存储键
     */
    getFullKey(key) {
      return this.options.prefix + key;
    }

    /**
     * 存储数据
     */
    setItem(key, value, options = {}) {
      try {
        const fullKey = this.getFullKey(key);
        const serializedValue = this.serialize(value, options);

        // 检查存储空间
        if (this.getStorageSize() + serializedValue.length > this.options.maxSize) {
          this.cleanupOldestData();
        }

        localStorage.setItem(fullKey, serializedValue);

        // 更新缓存
        if (options.cache !== false) {
          this.updateCache(key, value);
        }

        return true;
      } catch (error) {
        console.error(`存储数据失败 [${key}]:`, error);
        return false;
      }
    }

    /**
     * 获取数据
     */
    getItem(key, options = {}) {
      try {
        const fullKey = this.getFullKey(key);

        // 优先从缓存获取
        if (options.cache !== false && this.cache.has(key)) {
          const cached = this.cache.get(key);
          if (Date.now() - cached.timestamp < this.cacheTimeout) {
            return cached.value;
          }
          this.cache.delete(key);
        }

        const serializedValue = localStorage.getItem(fullKey);
        if (serializedValue === null) {
          return null;
        }

        const value = this.deserialize(serializedValue, options);

        // 更新缓存
        if (options.cache !== false) {
          this.updateCache(key, value);
        }

        return value;
      } catch (error) {
        console.error(`获取数据失败 [${key}]:`, error);
        return null;
      }
    }

    /**
     * 移除数据
     */
    removeItem(key) {
      try {
        const fullKey = this.getFullKey(key);
        localStorage.removeItem(fullKey);
        this.cache.delete(key);
        return true;
      } catch (error) {
        console.error(`删除数据失败 [${key}]:`, error);
        return false;
      }
    }

    /**
     * 检查数据是否存在
     */
    hasItem(key) {
      const fullKey = this.getFullKey(key);
      return localStorage.getItem(fullKey) !== null;
    }

    /**
     * 获取所有键
     */
    getAllKeys() {
      const keys = [];
      const prefix = this.options.prefix;

      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(prefix)) {
          keys.push(key.substring(prefix.length));
        }
      }

      return keys;
    }

    /**
     * 清空所有数据
     */
    clear() {
      try {
        const keys = this.getAllKeys();
        keys.forEach(key => this.removeItem(key));
        this.cache.clear();
        return true;
      } catch (error) {
        console.error('清空存储失败:', error);
        return false;
      }
    }

    /**
     * 序列化数据
     */
    serialize(value, options = {}) {
      const data = {
        value: value,
        timestamp: Date.now(),
        version: this.options.version,
        compressed: false,
        encrypted: false
      };

      let serialized = JSON.stringify(data);

      // 压缩（如果启用）
      if (this.options.enableCompression && serialized.length > 1000) {
        serialized = this.compress(serialized);
        data.compressed = true;
      }

      // 加密（如果启用）
      if (this.options.enableEncryption) {
        serialized = this.encrypt(serialized);
        data.encrypted = true;
      }

      return serialized;
    }

    /**
     * 反序列化数据
     */
    deserialize(serialized, options = {}) {
      try {
        // 解密（如果需要）
        if (this.options.enableEncryption) {
          serialized = this.decrypt(serialized);
        }

        // 解压缩（如果需要）
        const data = JSON.parse(serialized);

        if (data.compressed) {
          data.value = this.decompress(data.value);
        }

        return data.value;
      } catch (error) {
        console.error('反序列化失败:', error);
        return null;
      }
    }

    /**
     * 更新缓存
     */
    updateCache(key, value) {
      this.cache.set(key, {
        value: value,
        timestamp: Date.now()
      });

      // 清理过期缓存
      this.cleanupCache();
    }

    /**
     * 清理过期缓存
     */
    cleanupCache() {
      const now = Date.now();

      for (const [key, cached] of this.cache.entries()) {
        if (now - cached.timestamp > this.cacheTimeout) {
          this.cache.delete(key);
        }
      }
    }

    /**
     * 获取存储使用大小
     */
    getStorageSize() {
      let totalSize = 0;
      const prefix = this.options.prefix;

      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(prefix)) {
          const value = localStorage.getItem(key);
          totalSize += key.length + (value ? value.length : 0);
        }
      }

      return totalSize;
    }

    /**
     * 获取存储使用率
     */
    getStorageUsage() {
      const used = this.getStorageSize();
      const total = this.options.maxSize;

      return {
        used: used,
        total: total,
        percentage: (used / total * 100).toFixed(2),
        available: total - used
      };
    }

    /**
     * 清理最旧的数据
     */
    cleanupOldestData() {
      const keys = this.getAllKeys();
      const keyTimestamps = [];

      // 获取所有键的时间戳
      keys.forEach(key => {
        const fullKey = this.getFullKey(key);
        try {
          const data = JSON.parse(localStorage.getItem(fullKey));
          if (data && data.timestamp) {
            keyTimestamps.push({ key, timestamp: data.timestamp });
          }
        } catch (error) {
          // 忽略解析错误的数据
        }
      });

      // 按时间戳排序，删除最旧的数据
      keyTimestamps.sort((a, b) => a.timestamp - b.timestamp);

      const keysToRemove = Math.ceil(keys.length * 0.1); // 删除10%最旧的数据
      for (let i = 0; i < keysToRemove && i < keyTimestamps.length; i++) {
        this.removeItem(keyTimestamps[i].key);
      }
    }

    /**
     * 自动清理
     */
    autoCleanup() {
      // 清理过期缓存
      this.cleanupCache();

      // 检查存储空间，必要时清理
      const usage = this.getStorageUsage();
      if (usage.percentage > 80) {
        console.log('存储空间使用率过高，开始清理');
        this.cleanupOldestData();
      }
    }

    /**
     * 备份数据
     */
    backupData() {
      const backup = {};
      const keys = this.getAllKeys();

      keys.forEach(key => {
        backup[key] = this.getItem(key);
      });

      const backupData = {
        version: this.options.version,
        timestamp: Date.now(),
        data: backup
      };

      // 使用临时键存储备份
      this.setItem('__backup__', backupData);
      console.log('数据备份完成');
    }

    /**
     * 恢复数据
     */
    restoreData() {
      const backup = this.getItem('__backup__');
      if (!backup) {
        console.log('没有找到备份数据');
        return false;
      }

      try {
        Object.keys(backup.data).forEach(key => {
          this.setItem(key, backup.data[key]);
        });

        console.log('数据恢复完成');
        return true;
      } catch (error) {
        console.error('数据恢复失败:', error);
        return false;
      }
    }

    /**
     * 清理旧版本数据
     */
    cleanupOldVersionData(oldVersion) {
      console.log(`清理旧版本 ${oldVersion} 的数据`);

      // 这里可以根据版本号清理特定的旧数据
      // 目前只清理备份
      this.removeItem('__backup__');
    }

    /**
     * 降级到内存存储
     */
    fallbackToMemoryStorage() {
      console.warn('localStorage不可用，降级到内存存储');

      this.memoryStorage = new Map();

      // 重写存储方法
      this.setItem = (key, value) => {
        this.memoryStorage.set(key, value);
        return true;
      };

      this.getItem = (key) => {
        return this.memoryStorage.get(key) || null;
      };

      this.removeItem = (key) => {
        this.memoryStorage.delete(key);
        return true;
      };

      this.getAllKeys = () => {
        return Array.from(this.memoryStorage.keys());
      };

      this.clear = () => {
        this.memoryStorage.clear();
        return true;
      };
    }

    /**
     * 压缩数据（简单实现）
     */
    compress(data) {
      // 这里可以使用更复杂的压缩算法
      return data; // 暂时返回原数据
    }

    /**
     * 解压缩数据
     */
    decompress(data) {
      return data; // 暂时返回原数据
    }

    /**
     * 加密数据（简单实现）
     */
    encrypt(data) {
      // 这里可以使用更复杂的加密算法
      return btoa(data); // 简单的base64编码
    }

    /**
     * 解密数据
     */
    decrypt(data) {
      return atob(data); // 简单的base64解码
    }

    /**
     * 导出数据
     */
    exportData() {
      const exportData = {
        version: this.options.version,
        timestamp: Date.now(),
        keys: {}
      };

      this.getAllKeys().forEach(key => {
        exportData.keys[key] = this.getItem(key);
      });

      return exportData;
    }

    /**
     * 导入数据
     */
    importData(exportData, options = {}) {
      if (!exportData || !exportData.keys) {
        throw new Error('无效的导入数据');
      }

      const { overwrite = true, merge = true } = options;

      // 如果不清空且不合并，先清空现有数据
      if (!overwrite && !merge) {
        this.clear();
      }

      Object.keys(exportData.keys).forEach(key => {
        if (overwrite || !this.hasItem(key)) {
          this.setItem(key, exportData.keys[key]);
        }
      });

      console.log('数据导入完成');
    }
  }

  // 创建全局实例
  const localStorageManager = new LocalStorageManager();

  // 导出到全局
  global.LocalStorageManager = LocalStorageManager;
  global.localStorageManager = localStorageManager;

})(window);