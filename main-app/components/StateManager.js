/**
 * StateManager.js - 应用状态管理器
 * 提供全局状态管理和事件系统
 */
(function(global) {
  'use strict';

  class StateManager {
    constructor(initialState = {}) {
      this.state = {
        // UI状态
        ui: {
          isLoading: false,
          error: null,
          currentView: 'input',
          theme: 'dark'
        },

        // 用户输入
        input: {
          prompt: '',
          template: null,
          parameters: {}
        },

        // 可视化状态
        visualization: {
          url: null,
          title: null,
          type: null,
          isGenerating: false,
          progress: 0
        },

        // 应用数据
        data: {
          templates: null,
          categories: null,
          history: [],
          favorites: []
        },

        // 用户设置
        settings: {
          language: 'zh-CN',
          autoSave: true,
          showTips: true,
          ...initialState
        },

        ...initialState
      };

      this.listeners = new Map();
      this.history = [];
      this.maxHistorySize = 50;

      this.init();
    }

    init() {
      // 从localStorage恢复状态
      this.loadFromStorage();

      // 监听页面可见性变化
      document.addEventListener('visibilitychange', this.handleVisibilityChange.bind(this));

      // 监听页面卸载
      window.addEventListener('beforeunload', this.handleBeforeUnload.bind(this));

      console.log('StateManager initialized');
    }

    /**
     * 状态获取和设置
     */
    getState(path) {
      if (!path) return this.deepClone(this.state);

      return this.getNestedValue(this.state, path);
    }

    setState(pathOrUpdates, value, options = {}) {
      const { silent = false, persist = true } = options;

      let updates;
      if (typeof pathOrUpdates === 'string') {
        updates = { [pathOrUpdates]: value };
      } else {
        updates = pathOrUpdates;
      }

      // 保存当前状态到历史
      if (!silent) {
        this.saveToHistory();
      }

      // 应用更新
      Object.keys(updates).forEach(path => {
        this.setNestedValue(this.state, path, updates[path]);
      });

      // 持久化
      if (persist) {
        this.saveToStorage();
      }

      // 触发更新事件
      if (!silent) {
        this.emit('state:changed', {
          updates,
          state: this.deepClone(this.state)
        });

        // 触发特定路径的更新事件
        Object.keys(updates).forEach(path => {
          this.emit(`state:${path}`, {
            path,
            value: updates[path],
            oldValue: this.getNestedValue(this.state, path)
          });
        });
      }
    }

    /**
     * 批量状态更新
     */
    batchUpdate(updates, options = {}) {
      this.setState(updates, null, options);
    }

    /**
     * 重置状态
     */
    reset(path, options = {}) {
      if (!path) {
        this.state = this.getInitialState();
      } else {
        this.setNestedValue(this.state, path, this.getNestedValue(this.getInitialState(), path));
      }

      this.emit('state:reset', { path });
      this.saveToStorage();
    }

    /**
     * 状态合并
     */
    mergeState(path, data, options = {}) {
      const currentValue = this.getState(path) || {};
      const mergedValue = this.deepMerge(currentValue, data);
      this.setState(path, mergedValue, options);
    }

    /**
     * 历史记录管理
     */
    saveToHistory() {
      const snapshot = this.deepClone(this.state);
      this.history.push(snapshot);

      // 限制历史记录大小
      if (this.history.length > this.maxHistorySize) {
        this.history.shift();
      }
    }

    undo() {
      if (this.history.length > 1) {
        this.history.pop(); // 移除当前状态
        const previousState = this.history.pop();
        this.state = this.deepClone(previousState);

        this.emit('state:undone', { state: this.deepClone(this.state) });
        this.saveToStorage();
        return true;
      }
      return false;
    }

    redo() {
      // redo功能需要额外的前向历史记录
      this.emit('state:redo-requested');
      return false;
    }

    /**
     * 事件系统
     */
    on(event, handler) {
      if (!this.listeners.has(event)) {
        this.listeners.set(event, []);
      }
      this.listeners.get(event).push(handler);
    }

    off(event, handler) {
      if (this.listeners.has(event)) {
        const handlers = this.listeners.get(event);
        const index = handlers.indexOf(handler);
        if (index > -1) {
          handlers.splice(index, 1);
        }
      }
    }

    emit(event, data) {
      if (this.listeners.has(event)) {
        this.listeners.get(event).forEach(handler => {
          try {
            handler(data);
          } catch (error) {
            console.error(`Error in event handler for ${event}:`, error);
          }
        });
      }
    }

    once(event, handler) {
      const onceHandler = (data) => {
        handler(data);
        this.off(event, onceHandler);
      };
      this.on(event, onceHandler);
    }

    /**
     * 计算属性
     */
    computed(getter, dependencies = []) {
      let cachedValue = null;
      let dirty = true;

      const compute = () => {
        if (dirty) {
          cachedValue = getter(this.state);
          dirty = false;
        }
        return cachedValue;
      };

      // 监听依赖变化
      dependencies.forEach(dep => {
        this.on(`state:${dep}`, () => {
          dirty = true;
        });
      });

      return compute;
    }

    /**
     * 持久化
     */
    saveToStorage() {
      try {
        const toSave = {
          state: this.state,
          timestamp: Date.now()
        };

        localStorage.setItem('app-state', JSON.stringify(toSave));
      } catch (error) {
        console.warn('Failed to save state to localStorage:', error);
      }
    }

    loadFromStorage() {
      try {
        const saved = localStorage.getItem('app-state');
        if (saved) {
          const { state, timestamp } = JSON.parse(saved);

          // 检查是否过期（24小时）
          const now = Date.now();
          const maxAge = 24 * 60 * 60 * 1000;

          if (now - timestamp < maxAge) {
            this.state = this.deepMerge(this.state, state);
            console.log('State restored from localStorage');
          } else {
            console.log('Saved state expired');
            localStorage.removeItem('app-state');
          }
        }
      } catch (error) {
        console.warn('Failed to load state from localStorage:', error);
      }
    }

    clearStorage() {
      try {
        localStorage.removeItem('app-state');
        console.log('State cleared from localStorage');
      } catch (error) {
        console.warn('Failed to clear state from localStorage:', error);
      }
    }

    /**
     * 工具方法
     */
    getNestedValue(obj, path) {
      return path.split('.').reduce((current, key) => {
        return current && current[key] !== undefined ? current[key] : undefined;
      }, obj);
    }

    setNestedValue(obj, path, value) {
      const keys = path.split('.');
      const lastKey = keys.pop();
      const target = keys.reduce((current, key) => {
        if (!current[key] || typeof current[key] !== 'object') {
          current[key] = {};
        }
        return current[key];
      }, obj);

      if (lastKey) {
        target[lastKey] = value;
      }
    }

    deepClone(obj) {
      if (obj === null || typeof obj !== 'object') {
        return obj;
      }

      if (obj instanceof Date) {
        return new Date(obj.getTime());
      }

      if (obj instanceof Array) {
        return obj.map(item => this.deepClone(item));
      }

      if (typeof obj === 'object') {
        const cloned = {};
        Object.keys(obj).forEach(key => {
          cloned[key] = this.deepClone(obj[key]);
        });
        return cloned;
      }

      return obj;
    }

    deepMerge(target, source) {
      if (!source) return target;

      const result = this.deepClone(target);

      Object.keys(source).forEach(key => {
        if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
          result[key] = this.deepMerge(result[key] || {}, source[key]);
        } else {
          result[key] = source[key];
        }
      });

      return result;
    }

    getInitialState() {
      return {
        ui: {
          isLoading: false,
          error: null,
          currentView: 'input',
          theme: 'dark'
        },
        input: {
          prompt: '',
          template: null,
          parameters: {}
        },
        visualization: {
          url: null,
          title: null,
          type: null,
          isGenerating: false,
          progress: 0
        },
        data: {
          templates: null,
          categories: null,
          history: [],
          favorites: []
        },
        settings: {
          language: 'zh-CN',
          autoSave: true,
          showTips: true
        }
      };
    }

    /**
     * 事件处理器
     */
    handleVisibilityChange() {
      if (document.visibilityState === 'hidden') {
        this.saveToStorage();
      }
    }

    handleBeforeUnload() {
      this.saveToStorage();
    }

    /**
     * 调试方法
     */
    debug() {
      console.group('StateManager Debug');
      console.log('Current State:', this.state);
      console.log('History Length:', this.history.length);
      console.log('Listeners:', Array.from(this.listeners.keys()));
      console.groupEnd();
    }

    exportState() {
      return {
        state: this.state,
        history: this.history,
        timestamp: Date.now()
      };
    }

    importState(exportedData) {
      try {
        if (exportedData.state) {
          this.state = exportedData.state;
        }
        if (exportedData.history) {
          this.history = exportedData.history;
        }
        this.saveToStorage();
        this.emit('state:imported', { state: this.deepClone(this.state) });
        return true;
      } catch (error) {
        console.error('Failed to import state:', error);
        return false;
      }
    }

    /**
     * 性能监控
     */
    startPerformanceMonitoring() {
      if (!this.performanceStats) {
        this.performanceStats = {
          updates: 0,
          events: 0,
          startTime: Date.now()
        };
      }

      this.on('state:changed', () => {
        this.performanceStats.updates++;
      });

      this.on('*', () => {
        this.performanceStats.events++;
      });
    }

    getPerformanceStats() {
      if (!this.performanceStats) {
        return null;
      }

      const now = Date.now();
      const uptime = now - this.performanceStats.startTime;

      return {
        ...this.performanceStats,
        uptime,
        updatesPerSecond: (this.performanceStats.updates / uptime) * 1000,
        eventsPerSecond: (this.performanceStats.events / uptime) * 1000
      };
    }

    /**
     * 销毁方法
     */
    destroy() {
      this.saveToStorage();
      this.listeners.clear();
      this.history = [];
      console.log('StateManager destroyed');
    }
  }

  // 创建全局状态管理器实例
  global.StateManager = StateManager;

  // 创建默认实例
  global.stateManager = new StateManager();

})(window);