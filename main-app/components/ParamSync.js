/**
 * ParamSync.js - 参数同步机制
 * 处理URL参数、路由状态和可视化组件之间的参数同步
 */
(function(global) {
  'use strict';

  class ParamSync {
    constructor(options = {}) {
      this.options = {
        debounceDelay: 300,
        enableHistory: true,
        enableStorage: true,
        storageKey: 'viz-params',
        syncMode: 'url', // 'url', 'storage', 'memory'
        ...options
      };

      this.state = {
        currentParams: {},
        defaultParams: {},
        paramSchema: new Map(),
        changeListeners: new Map(),
        validationRules: new Map(),
        lastSyncTime: 0,
        isInitialized: false
      };

      this.debounceTimers = new Map();
      this.storageCache = new Map();

      this.init();
    }

    init() {
      this.setupEventListeners();
      this.loadStoredParams();
      this.syncFromURL();
      this.state.isInitialized = true;
      this.log('info', 'ParamSync initialized');
    }

    setupEventListeners() {
      // 监听URL变化
      window.addEventListener('popstate', this.handleURLChange.bind(this));
      window.addEventListener('hashchange', this.handleURLChange.bind(this));

      // 监听参数变更事件
      document.addEventListener('params:update', this.handleParamUpdate.bind(this));
      document.addEventListener('viz:params:update', this.handleVizParamUpdate.bind(this));

      // 监听路由变化
      document.addEventListener('router:route:changed', this.handleRouteChange.bind(this));
    }

    /**
     * 参数定义
     */
    defineParam(name, config = {}) {
      const schema = {
        name,
        type: config.type || 'string',
        default: config.default,
        required: config.required || false,
        validator: config.validator,
        serializer: config.serializer,
        deserializer: config.deserializer,
        encode: config.encode !== false,
        description: config.description,
        group: config.group || 'default'
      };

      this.state.paramSchema.set(name, schema);

      // 设置默认值
      if (config.default !== undefined) {
        this.state.defaultParams[name] = config.default;
      }

      this.log('info', `Parameter defined: ${name}`, schema);
      return this;
    }

    defineParams(paramsConfig) {
      Object.keys(paramsConfig).forEach(name => {
        this.defineParam(name, paramsConfig[name]);
      });
      return this;
    }

    /**
     * 参数获取
     */
    getParam(name) {
      return this.state.currentParams[name] ?? this.state.defaultParams[name];
    }

    getParams() {
      return { ...this.state.currentParams };
    }

    getParamsByGroup(group) {
      const params = {};
      for (const [name, schema] of this.state.paramSchema) {
        if (schema.group === group) {
          params[name] = this.getParam(name);
        }
      }
      return params;
    }

    /**
     * 参数设置
     */
    setParam(name, value, options = {}) {
      return this.setParams({ [name]: value }, options);
    }

    setParams(params, options = {}) {
      const {
        silent = false,
        sync = true,
        validate = true,
        persist = true
      } = options;

      const oldParams = { ...this.state.currentParams };
      let newParams = { ...this.state.currentParams };

      // 处理每个参数
      for (const [name, value] of Object.entries(params)) {
        const schema = this.state.paramSchema.get(name);

        // 序列化值
        let serializedValue = value;
        if (schema && schema.serializer) {
          serializedValue = schema.serializer(value);
        }

        // 验证值
        if (validate && schema) {
          const validationResult = this.validateParam(name, serializedValue);
          if (!validationResult.valid) {
            this.log('warn', `Parameter validation failed: ${name}`, validationResult.error);
            continue;
          }
        }

        newParams[name] = serializedValue;
      }

      // 检查是否有变化
      const hasChanges = this.hasParamsChanged(oldParams, newParams);
      if (!hasChanges) {
        return this;
      }

      // 更新状态
      this.state.currentParams = newParams;
      this.state.lastSyncTime = Date.now();

      // 持久化存储
      if (persist && this.options.enableStorage) {
        this.storeParams(newParams);
      }

      // 同步到URL
      if (sync && this.options.syncMode === 'url') {
        this.syncToURL(newParams, options);
      }

      // 触发变更事件
      if (!silent) {
        this.notifyParamChange(oldParams, newParams);
      }

      this.log('info', 'Parameters updated:', { old: oldParams, new: newParams });
      return this;
    }

    /**
     * 参数验证
     */
    validateParam(name, value) {
      const schema = this.state.paramSchema.get(name);
      if (!schema) {
        return { valid: true };
      }

      // 类型检查
      if (schema.type && typeof value !== schema.type) {
        return {
          valid: false,
          error: `Expected type ${schema.type}, got ${typeof value}`
        };
      }

      // 必填检查
      if (schema.required && (value === undefined || value === null || value === '')) {
        return {
          valid: false,
          error: 'Parameter is required'
        };
      }

      // 自定义验证
      if (schema.validator) {
        const result = schema.validator(value);
        if (result !== true) {
          return {
            valid: false,
            error: typeof result === 'string' ? result : 'Validation failed'
          };
        }
      }

      return { valid: true };
    }

    validateAllParams(params = this.state.currentParams) {
      const errors = {};
      let isValid = true;

      for (const [name, value] of Object.entries(params)) {
        const result = this.validateParam(name, value);
        if (!result.valid) {
          errors[name] = result.error;
          isValid = false;
        }
      }

      // 检查必填参数
      for (const [name, schema] of this.state.paramSchema) {
        if (schema.required && !(name in params)) {
          errors[name] = 'Required parameter missing';
          isValid = false;
        }
      }

      return { isValid, errors };
    }

    /**
     * URL同步
     */
    syncFromURL() {
      if (this.options.syncMode !== 'url') return;

      try {
        const urlParams = new URLSearchParams(window.location.search);
        const params = {};

        for (const [name, schema] of this.state.paramSchema) {
          const value = urlParams.get(name);
          if (value !== null) {
            // 反序列化值
            let deserializedValue = value;
            if (schema && schema.deserializer) {
              deserializedValue = schema.deserializer(value);
            } else if (schema && schema.type === 'number') {
              deserializedValue = Number(value);
            } else if (schema && schema.type === 'boolean') {
              deserializedValue = value === 'true';
            }

            params[name] = deserializedValue;
          } else if (schema && schema.default !== undefined) {
            params[name] = schema.default;
          }
        }

        this.state.currentParams = params;
        this.log('info', 'Parameters synced from URL:', params);

      } catch (error) {
        this.log('error', 'Failed to sync from URL:', error);
      }
    }

    syncToURL(params = this.state.currentParams, options = {}) {
      if (this.options.syncMode !== 'url') return;

      const {
        replace = false,
        debounce = this.options.debounceDelay > 0
      } = options;

      const syncAction = () => {
        try {
          const url = new URL(window.location);

          // 清除现有参数
          for (const [name] of url.searchParams) {
            if (this.state.paramSchema.has(name)) {
              url.searchParams.delete(name);
            }
          }

          // 添加新参数
          for (const [name, value] of Object.entries(params)) {
            const schema = this.state.paramSchema.get(name);
            if (schema && schema.encode && value !== undefined && value !== null) {
              let encodedValue = value.toString();
              if (schema.serializer) {
                encodedValue = schema.serializer(value);
              }
              url.searchParams.set(name, encodedValue);
            }
          }

          // 更新URL
          if (this.options.enableHistory) {
            const method = replace ? 'replaceState' : 'pushState';
            history[method]({ params }, '', url);
          }

          this.log('info', 'Parameters synced to URL:', params);

        } catch (error) {
          this.log('error', 'Failed to sync to URL:', error);
        }
      };

      if (debounce) {
        // 防抖处理
        if (this.debounceTimers.has('url')) {
          clearTimeout(this.debounceTimers.get('url'));
        }

        const timerId = setTimeout(syncAction, this.options.debounceDelay);
        this.debounceTimers.set('url', timerId);

      } else {
        syncAction();
      }
    }

    /**
     * 存储同步
     */
    loadStoredParams() {
      if (!this.options.enableStorage || this.options.syncMode === 'url') return;

      try {
        const stored = localStorage.getItem(this.options.storageKey);
        if (stored) {
          const params = JSON.parse(stored);
          this.state.currentParams = { ...this.state.defaultParams, ...params };
          this.log('info', 'Parameters loaded from storage:', params);
        } else {
          this.state.currentParams = { ...this.state.defaultParams };
        }
      } catch (error) {
        this.log('error', 'Failed to load stored parameters:', error);
        this.state.currentParams = { ...this.state.defaultParams };
      }
    }

    storeParams(params = this.state.currentParams) {
      if (!this.options.enableStorage || this.options.syncMode === 'url') return;

      try {
        const data = JSON.stringify(params);
        localStorage.setItem(this.options.storageKey, data);
        this.storageCache.set('current', params);
        this.log('info', 'Parameters stored:', params);
      } catch (error) {
        this.log('error', 'Failed to store parameters:', error);
      }
    }

    clearStoredParams() {
      if (!this.options.enableStorage) return;

      try {
        localStorage.removeItem(this.options.storageKey);
        this.storageCache.clear();
        this.log('info', 'Stored parameters cleared');
      } catch (error) {
        this.log('error', 'Failed to clear stored parameters:', error);
      }
    }

    /**
     * 事件处理
     */
    handleURLChange() {
      const oldParams = { ...this.state.currentParams };
      this.syncFromURL();

      if (this.hasParamsChanged(oldParams, this.state.currentParams)) {
        this.notifyParamChange(oldParams, this.state.currentParams);
      }
    }

    handleParamUpdate(event) {
      const { params, options = {} } = event.detail;
      this.setParams(params, options);
    }

    handleVizParamUpdate(event) {
      const { params, url } = event.detail;

      // 如果提供了URL，解析URL中的参数
      if (url) {
        try {
          const urlObj = new URL(url, window.location.origin);
          const urlParams = {};

          for (const [name, value] of urlObj.searchParams) {
            urlParams[name] = value;
          }

          this.setParams(urlParams, { sync: false });
        } catch (error) {
          this.log('error', 'Failed to parse visualization URL parameters:', error);
        }
      }

      // 更新可视化参数
      if (params) {
        this.setParams(params, { sync: false });
      }
    }

    handleRouteChange(event) {
      const { to, params: routeParams } = event.detail;

      // 合并路由参数
      if (routeParams) {
        this.setParams(routeParams, { sync: false, persist: false });
      }

      this.log('info', 'Route changed, updating parameters:', { to, routeParams });
    }

    /**
     * 变更通知
     */
    notifyParamChange(oldParams, newParams) {
      const changes = this.getParamChanges(oldParams, newParams);

      // 触发全局参数变更事件
      this.emit('params:changed', {
        oldParams,
        newParams,
        changes,
        timestamp: Date.now()
      });

      // 通知特定参数的监听器
      for (const [name, listeners] of this.state.changeListeners) {
        if (changes[name]) {
          const change = changes[name];
          listeners.forEach(listener => {
            try {
              listener({
                name,
                oldValue: change.oldValue,
                newValue: change.newValue,
                timestamp: Date.now()
              });
            } catch (error) {
              this.log('error', `Error in parameter listener for ${name}:`, error);
            }
          });
        }
      }
    }

    /**
     * 参数监听
     */
    onParamChange(name, listener) {
      if (!this.state.changeListeners.has(name)) {
        this.state.changeListeners.set(name, new Set());
      }
      this.state.changeListeners.get(name).add(listener);

      return () => {
        this.state.changeListeners.get(name)?.delete(listener);
      };
    }

    onParamsChange(listener) {
      const wrappedListener = (event) => {
        listener(event.detail);
      };

      document.addEventListener('params:changed', wrappedListener);

      return () => {
        document.removeEventListener('params:changed', wrappedListener);
      };
    }

    /**
     * 工具方法
     */
    hasParamsChanged(oldParams, newParams) {
      const oldKeys = Object.keys(oldParams);
      const newKeys = Object.keys(newParams);

      if (oldKeys.length !== newKeys.length) {
        return true;
      }

      for (const key of oldKeys) {
        if (oldParams[key] !== newParams[key]) {
          return true;
        }
      }

      return false;
    }

    getParamChanges(oldParams, newParams) {
      const changes = {};

      // 找出变化的参数
      for (const [key, newValue] of Object.entries(newParams)) {
        if (oldParams[key] !== newValue) {
          changes[key] = {
            oldValue: oldParams[key],
            newValue: newValue
          };
        }
      }

      // 找出删除的参数
      for (const [key, oldValue] of Object.entries(oldParams)) {
        if (!(key in newParams)) {
          changes[key] = {
            oldValue: oldValue,
            newValue: undefined
          };
        }
      }

      return changes;
    }

    resetParams(options = {}) {
      const { silent = false, persist = true } = options;
      const oldParams = { ...this.state.currentParams };

      this.state.currentParams = { ...this.state.defaultParams };

      if (persist) {
        this.clearStoredParams();
      }

      this.syncToURL(this.state.currentParams, { replace: true });

      if (!silent) {
        this.notifyParamChange(oldParams, this.state.currentParams);
      }

      this.log('info', 'Parameters reset to defaults');
      return this;
    }

    exportParams() {
      return {
        params: { ...this.state.currentParams },
        schema: Array.from(this.state.paramSchema.entries()),
        timestamp: Date.now()
      };
    }

    importParams(data, options = {}) {
      if (!data || typeof data !== 'object') {
        throw new Error('Invalid import data');
      }

      const params = data.params || data;
      return this.setParams(params, options);
    }

    /**
     * 事件系统
     */
    emit(eventName, data) {
      const event = new CustomEvent(`param-sync:${eventName}`, {
        detail: data,
        bubbles: true
      });
      document.dispatchEvent(event);
    }

    /**
     * 日志系统
     */
    log(level, message, ...args) {
      if (typeof console !== 'undefined') {
        console[level](`[ParamSync] ${message}`, ...args);
      }
    }

    /**
     * 销毁方法
     */
    destroy() {
      // 清理防抖定时器
      for (const timerId of this.debounceTimers.values()) {
        clearTimeout(timerId);
      }
      this.debounceTimers.clear();

      // 移除事件监听
      window.removeEventListener('popstate', this.handleURLChange);
      window.removeEventListener('hashchange', this.handleURLChange);
      document.removeEventListener('params:update', this.handleParamUpdate);
      document.removeEventListener('viz:params:update', this.handleVizParamUpdate);
      document.removeEventListener('router:route:changed', this.handleRouteChange);

      // 清理状态
      this.state.changeListeners.clear();
      this.state.paramSchema.clear();
      this.state.validationRules.clear();
      this.storageCache.clear();

      this.log('info', 'ParamSync destroyed');
    }
  }

  // 创建全局实例
  global.ParamSync = ParamSync;

  // 自动创建全局实例
  window.paramSync = null;

  // 初始化函数
  global.initParamSync = function(options = {}) {
    if (window.paramSync) {
      window.paramSync.destroy();
    }
    window.paramSync = new ParamSync(options);
    return window.paramSync;
  };

})(window);