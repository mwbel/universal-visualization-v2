/**
 * ApiClient.js - 统一API客户端
 * 封装所有后端API调用，包括错误处理、重试机制、请求取消等功能
 */
(function(global) {
  'use strict';

  class ApiClient {
    constructor(options = {}) {
      this.options = {
        baseURL: 'http://localhost:8000',
        timeout: 30000,
        retryAttempts: 3,
        retryDelay: 1000,
        enableRetry: true,
        enableLogging: true,
        ...options
      };

      this.state = {
        isOnline: navigator.onLine,
        pendingRequests: new Map(),
        requestQueue: [],
        isProcessingQueue: false
      };

      this.init();
    }

    init() {
      // 监听网络状态
      window.addEventListener('online', this.handleOnline.bind(this));
      window.addEventListener('offline', this.handleOffline.bind(this));

      // 设置默认请求头
      this.defaultHeaders = {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      };
    }

    /**
     * 主要API调用方法
     */
    async resolveOrGenerate(prompt, options = {}) {
      const payload = {
        prompt: prompt.trim(),
        vizType: options.vizType || '自动',
        complexity: options.complexity || '中等',
        ...options.params
      };

      return this.post('/resolve_or_generate', payload, {
        timeout: options.timeout || this.options.timeout,
        retries: options.retries !== undefined ? options.retries : this.options.retryAttempts
      });
    }

    async getTemplates(options = {}) {
      return this.get('/templates', {
        params: options.params,
        timeout: options.timeout || 10000
      });
    }

    async getVisualization(id, options = {}) {
      return this.get(`/visualizations/${id}`, {
        params: options.params,
        timeout: options.timeout || 15000
      });
    }

    async getRegistry(options = {}) {
      return this.get('/registry', {
        params: options.params,
        timeout: options.timeout || 10000
      });
    }

    async healthCheck() {
      try {
        const response = await this.get('/health', { timeout: 5000 });
        return { status: 'healthy', ...response };
      } catch (error) {
        return { status: 'unhealthy', error: error.message };
      }
    }

    /**
     * HTTP方法封装
     */
    async get(endpoint, options = {}) {
      return this.request('GET', endpoint, null, options);
    }

    async post(endpoint, data, options = {}) {
      return this.request('POST', endpoint, data, options);
    }

    async put(endpoint, data, options = {}) {
      return this.request('PUT', endpoint, data, options);
    }

    async delete(endpoint, options = {}) {
      return this.request('DELETE', endpoint, null, options);
    }

    /**
     * 核心请求方法
     */
    async request(method, endpoint, data, options = {}) {
      const requestId = this.generateRequestId();
      const url = this.buildURL(endpoint, options.params);

      const config = {
        method: method.toUpperCase(),
        headers: { ...this.defaultHeaders, ...options.headers },
        body: data ? JSON.stringify(data) : null,
        signal: this.createAbortSignal(options.timeout),
        ...options
      };

      // 记录请求
      this.logRequest(method, url, data, requestId);

      try {
        // 如果离线且支持队列，加入队列
        if (!this.state.isOnline && options.queue !== false) {
          return this.queueRequest(method, endpoint, data, options);
        }

        // 执行请求
        const response = await this.fetchWithRetry(url, config, options.retries);

        // 处理响应
        const result = await this.handleResponse(response, requestId);

        this.logResponse(method, url, result, requestId);
        return result;

      } catch (error) {
        this.logError(method, url, error, requestId);
        throw this.enhanceError(error, config, requestId);
      }
    }

    async fetchWithRetry(url, config, maxRetries = 0) {
      let lastError;

      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
          const response = await fetch(url, config);

          // 检查响应状态
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }

          return response;

        } catch (error) {
          lastError = error;

          // 如果是最后一次尝试或不应重试的错误，直接抛出
          if (attempt === maxRetries || !this.shouldRetry(error)) {
            throw error;
          }

          // 计算重试延迟（指数退避）
          const delay = this.options.retryDelay * Math.pow(2, attempt);
          await this.sleep(delay);

          this.log('warn', `Request failed, retrying (${attempt + 1}/${maxRetries}):`, error.message);
        }
      }

      throw lastError;
    }

    shouldRetry(error) {
      // 网络错误或服务器错误可以重试
      if (error.name === 'TypeError' || error.name === 'NetworkError') {
        return true;
      }

      // HTTP状态码 5xx 可以重试
      if (error.message.includes('HTTP 5')) {
        return true;
      }

      // 408 Request Timeout 可以重试
      if (error.message.includes('HTTP 408')) {
        return true;
      }

      // 429 Too Many Requests 可以重试
      if (error.message.includes('HTTP 429')) {
        return true;
      }

      return false;
    }

    async handleResponse(response, requestId) {
      const contentType = response.headers.get('content-type');

      if (contentType && contentType.includes('application/json')) {
        return await response.json();
      } else if (contentType && contentType.includes('text/')) {
        return await response.text();
      } else {
        return await response.blob();
      }
    }

    /**
     * 请求队列管理
     */
    queueRequest(method, endpoint, data, options) {
      return new Promise((resolve, reject) => {
        this.state.requestQueue.push({
          method,
          endpoint,
          data,
          options,
          resolve,
          reject,
          timestamp: Date.now()
        });

        this.processQueue();
      });
    }

    async processQueue() {
      if (this.state.isProcessingQueue || this.state.requestQueue.length === 0) {
        return;
      }

      this.state.isProcessingQueue = true;

      while (this.state.requestQueue.length > 0 && this.state.isOnline) {
        const request = this.state.requestQueue.shift();

        try {
          const result = await this.request(
            request.method,
            request.endpoint,
            request.data,
            { ...request.options, queue: false }
          );
          request.resolve(result);
        } catch (error) {
          request.reject(error);
        }
      }

      this.state.isProcessingQueue = false;
    }

    /**
     * 工具方法
     */
    buildURL(endpoint, params = {}) {
      const url = new URL(endpoint, this.options.baseURL);

      Object.keys(params).forEach(key => {
        if (params[key] !== undefined && params[key] !== null) {
          url.searchParams.append(key, params[key]);
        }
      });

      return url.toString();
    }

    createAbortSignal(timeout) {
      if (!timeout) return undefined;

      const controller = new AbortController();
      setTimeout(() => controller.abort(), timeout);
      return controller.signal;
    }

    generateRequestId() {
      return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    enhanceError(error, config, requestId) {
      const enhanced = new Error(error.message);
      enhanced.name = error.name;
      enhanced.stack = error.stack;
      enhanced.config = config;
      enhanced.requestId = requestId;
      enhanced.timestamp = new Date().toISOString();
      enhanced.isApiClientError = true;

      if (error.name === 'AbortError') {
        enhanced.type = 'TIMEOUT';
        enhanced.message = '请求超时，请检查网络连接';
      } else if (error.message.includes('Failed to fetch')) {
        enhanced.type = 'NETWORK';
        enhanced.message = '网络连接失败，请检查网络设置';
      } else if (error.message.includes('HTTP 4')) {
        enhanced.type = 'CLIENT_ERROR';
      } else if (error.message.includes('HTTP 5')) {
        enhanced.type = 'SERVER_ERROR';
        enhanced.message = '服务器错误，请稍后重试';
      } else {
        enhanced.type = 'UNKNOWN';
      }

      return enhanced;
    }

    sleep(ms) {
      return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * 事件处理
     */
    handleOnline() {
      this.state.isOnline = true;
      this.log('info', 'Network connection restored');
      this.processQueue();
      this.emit('online');
    }

    handleOffline() {
      this.state.isOnline = false;
      this.log('warn', 'Network connection lost');
      this.emit('offline');
    }

    /**
     * 日志记录
     */
    logRequest(method, url, data, requestId) {
      if (!this.options.enableLogging) return;
      this.log('info', `API Request: ${method} ${url}`, { requestId, data });
    }

    logResponse(method, url, data, requestId) {
      if (!this.options.enableLogging) return;
      this.log('info', `API Response: ${method} ${url}`, { requestId, status: 'success' });
    }

    logError(method, url, error, requestId) {
      if (!this.options.enableLogging) return;
      this.log('error', `API Error: ${method} ${url}`, { requestId, error: error.message });
    }

    log(level, message, data = {}) {
      if (!this.options.enableLogging) return;

      const logEntry = {
        timestamp: new Date().toISOString(),
        level: level.toUpperCase(),
        message,
        ...data
      };

      // 开发环境输出到控制台
      if (typeof console !== 'undefined') {
        console[level] || console.log(`[ApiClient] ${message}`, data);
      }

      // 触发日志事件
      this.emit('log', logEntry);
    }

    /**
     * 事件系统
     */
    emit(eventName, data) {
      const event = new CustomEvent(`api-client:${eventName}`, {
        detail: data,
        bubbles: true
      });
      document.dispatchEvent(event);
    }

    on(eventName, handler) {
      document.addEventListener(`api-client:${eventName}`, handler);
    }

    off(eventName, handler) {
      document.removeEventListener(`api-client:${eventName}`, handler);
    }

    /**
     * 公共方法
     */
    isOnline() {
      return this.state.isOnline;
    }

    getQueueLength() {
      return this.state.requestQueue.length;
    }

    clearQueue() {
      this.state.requestQueue = [];
      this.log('info', 'Request queue cleared');
    }

    setDefaultHeader(name, value) {
      this.defaultHeaders[name] = value;
    }

    removeDefaultHeader(name) {
      delete this.defaultHeaders[name];
    }

    updateOptions(newOptions) {
      this.options = { ...this.options, ...newOptions };
    }

    /**
     * 批量请求
     */
    async batch(requests) {
      const results = await Promise.allSettled(
        requests.map(req =>
          this.request(req.method, req.endpoint, req.data, req.options)
        )
      );

      return results.map((result, index) => ({
        index,
        status: result.status,
        value: result.status === 'fulfilled' ? result.value : null,
        error: result.status === 'rejected' ? result.reason : null
      }));
    }

    /**
     * 并发控制
     */
    async concurrent(requests, concurrency = 3) {
      const results = [];

      for (let i = 0; i < requests.length; i += concurrency) {
        const batch = requests.slice(i, i + concurrency);
        const batchResults = await Promise.allSettled(
          batch.map(req =>
            this.request(req.method, req.endpoint, req.data, req.options)
          )
        );
        results.push(...batchResults);
      }

      return results;
    }

    /**
     * 缓存管理
     */
    getCacheKey(method, endpoint, params) {
      return `${method}:${endpoint}:${JSON.stringify(params)}`;
    }

    async getFromCache(key) {
      try {
        const cached = localStorage.getItem(`api_cache:${key}`);
        if (cached) {
          const { data, timestamp, ttl } = JSON.parse(cached);
          if (Date.now() - timestamp < ttl) {
            return data;
          }
          localStorage.removeItem(`api_cache:${key}`);
        }
      } catch (error) {
        this.log('warn', 'Cache read error:', error);
      }
      return null;
    }

    async setCache(key, data, ttl = 300000) { // 默认5分钟
      try {
        localStorage.setItem(`api_cache:${key}`, JSON.stringify({
          data,
          timestamp: Date.now(),
          ttl
        }));
      } catch (error) {
        this.log('warn', 'Cache write error:', error);
      }
    }

    clearCache() {
      try {
        const keys = Object.keys(localStorage);
        keys.forEach(key => {
          if (key.startsWith('api_cache:')) {
            localStorage.removeItem(key);
          }
        });
        this.log('info', 'Cache cleared');
      } catch (error) {
        this.log('warn', 'Cache clear error:', error);
      }
    }

    /**
     * 销毁方法
     */
    destroy() {
      window.removeEventListener('online', this.handleOnline);
      window.removeEventListener('offline', this.handleOffline);
      this.clearQueue();
      this.clearCache();
    }
  }

  // 创建默认实例
  global.ApiClient = ApiClient;

  // 创建全局实例
  global.api = new ApiClient();

})(window);