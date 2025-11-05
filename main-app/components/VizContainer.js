/**
 * VizContainer.js - 可视化容器组件
 * 动态加载和管理可视化页面
 */
(function(global) {
  'use strict';

  class VizContainer {
    constructor(options = {}) {
      this.options = {
        containerSelector: '#vizContainer',
        fallbackUrl: '/error.html',
        loadingDelay: 500,
        ...options
      };

      this.state = {
        currentVisualization: null,
        isLoading: false,
        error: null,
        loadingTimeout: null
      };

      this.elements = {};
      this.init();
    }

    init() {
      this.bindElements();
      this.createContainer();
      this.bindEvents();
    }

    bindElements() {
      this.elements.container = document.querySelector(this.options.containerSelector);
    }

    createContainer() {
      if (!this.elements.container) {
        // 创建可视化容器
        this.elements.container = document.createElement('div');
        this.elements.container.id = 'vizContainer';
        this.elements.container.className = 'viz-container';

        // 添加到body中
        document.body.appendChild(this.elements.container);
      }

      // 设置容器HTML结构
      this.elements.container.innerHTML = `
        <div class="viz-header">
          <div class="viz-title">
            <h2 id="vizTitle">可视化标题</h2>
            <div class="viz-meta">
              <span id="vizType" class="viz-type"></span>
              <span id="vizDate" class="viz-date"></span>
            </div>
          </div>
          <div class="viz-actions">
            <button class="viz-btn" id="vizBackBtn" title="返回">
              ← 返回
            </button>
            <button class="viz-btn" id="vizRefreshBtn" title="刷新">
              ↻ 刷新
            </button>
            <button class="viz-btn" id="vizFullscreenBtn" title="全屏">
              ⛶ 全屏
            </button>
            <button class="viz-btn" id="vizCloseBtn" title="关闭">
              ✕ 关闭
            </button>
          </div>
        </div>

        <div class="viz-content">
          <div id="vizLoading" class="viz-loading" style="display: none;">
            <div class="loading-spinner"></div>
            <p>正在加载可视化...</p>
          </div>
          <div id="vizError" class="viz-error" style="display: none;">
            <h3>加载失败</h3>
            <p id="vizErrorMessage">无法加载可视化内容</p>
            <button class="viz-btn" id="vizRetryBtn">重试</button>
          </div>
          <div id="vizFrame" class="viz-frame">
            <!-- 可视化内容将在这里加载 -->
          </div>
        </div>

        <div class="viz-params" id="vizParams" style="display: none;">
          <h3>参数设置</h3>
          <div id="vizParamsContent">
            <!-- 参数控制面板将在这里动态生成 -->
          </div>
        </div>
      `;

      // 重新绑定元素
      this.bindContainerElements();
    }

    bindContainerElements() {
      this.elements.title = document.getElementById('vizTitle');
      this.elements.type = document.getElementById('vizType');
      this.elements.date = document.getElementById('vizDate');
      this.elements.backBtn = document.getElementById('vizBackBtn');
      this.elements.refreshBtn = document.getElementById('vizRefreshBtn');
      this.elements.fullscreenBtn = document.getElementById('vizFullscreenBtn');
      this.elements.closeBtn = document.getElementById('vizCloseBtn');
      this.elements.loading = document.getElementById('vizLoading');
      this.elements.error = document.getElementById('vizError');
      this.elements.errorMessage = document.getElementById('vizErrorMessage');
      this.elements.retryBtn = document.getElementById('vizRetryBtn');
      this.elements.frame = document.getElementById('vizFrame');
      this.elements.params = document.getElementById('vizParams');
      this.elements.paramsContent = document.getElementById('vizParamsContent');
    }

    bindEvents() {
      // 返回按钮
      if (this.elements.backBtn) {
        this.elements.backBtn.addEventListener('click', () => {
          this.goBack();
        });
      }

      // 刷新按钮
      if (this.elements.refreshBtn) {
        this.elements.refreshBtn.addEventListener('click', () => {
          this.refresh();
        });
      }

      // 全屏按钮
      if (this.elements.fullscreenBtn) {
        this.elements.fullscreenBtn.addEventListener('click', () => {
          this.toggleFullscreen();
        });
      }

      // 关闭按钮
      if (this.elements.closeBtn) {
        this.elements.closeBtn.addEventListener('click', () => {
          this.close();
        });
      }

      // 重试按钮
      if (this.elements.retryBtn) {
        this.elements.retryBtn.addEventListener('click', () => {
          this.retry();
        });
      }

      // 键盘事件
      document.addEventListener('keydown', this.handleKeyDown.bind(this));

      // 全屏事件监听
      document.addEventListener('fullscreenchange', this.handleFullscreenChange.bind(this));
      document.addEventListener('webkitfullscreenchange', this.handleFullscreenChange.bind(this));
      document.addEventListener('mozfullscreenchange', this.handleFullscreenChange.bind(this));
      document.addEventListener('MSFullscreenChange', this.handleFullscreenChange.bind(this));
    }

    /**
     * 加载可视化
     */
    async loadVisualization(url, options = {}) {
      const {
        title = '可视化',
        type = 'unknown',
        showParams = false,
        params = {}
      } = options;

      try {
        this.state.isLoading = true;
        this.state.error = null;
        this.state.currentVisualization = { url, title, type, params };

        // 显示容器
        this.showContainer();

        // 显示加载状态
        this.showLoading();

        // 更新元信息
        this.updateMetadata(title, type);

        // 加载内容
        await this.loadContent(url);

        // 显示参数面板
        if (showParams && Object.keys(params).length > 0) {
          this.showParams(params);
        }

        this.emit('visualization:loaded', { url, title, type, params });

      } catch (error) {
        console.error('Failed to load visualization:', error);
        this.handleError(error);
      } finally {
        this.state.isLoading = false;
        this.hideLoading();
      }
    }

    async loadContent(url) {
      try {
        // 检查URL类型
        if (url.endsWith('.html') || url.includes('/app/modules/')) {
          // HTML文件 - 使用iframe加载
          await this.loadInIframe(url);
        } else {
          // 其他类型 - 使用fetch加载
          await this.loadWithFetch(url);
        }
      } catch (error) {
        throw new Error(`Failed to load content from ${url}: ${error.message}`);
      }
    }

    async loadInIframe(url) {
      return new Promise((resolve, reject) => {
        const iframe = document.createElement('iframe');
        iframe.src = url;
        iframe.style.width = '100%';
        iframe.style.height = '600px';
        iframe.style.border = 'none';
        iframe.style.borderRadius = '8px';

        iframe.onload = () => {
          this.elements.frame.innerHTML = '';
          this.elements.frame.appendChild(iframe);
          resolve();
        };

        iframe.onerror = () => {
          reject(new Error('Failed to load iframe'));
        };

        // 设置超时
        setTimeout(() => {
          if (!iframe.onload) {
            reject(new Error('Loading timeout'));
          }
        }, 10000);

        this.elements.frame.innerHTML = '';
        this.elements.frame.appendChild(iframe);
      });
    }

    async loadWithFetch(url) {
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const contentType = response.headers.get('content-type');

      if (contentType && contentType.includes('text/html')) {
        const html = await response.text();
        this.elements.frame.innerHTML = html;

        // 执行脚本
        this.executeScripts(this.elements.frame);
      } else {
        // 其他内容类型
        const blob = await response.blob();
        const objectUrl = URL.createObjectURL(blob);

        const element = this.getElementForContentType(contentType, objectUrl);
        this.elements.frame.innerHTML = '';
        this.elements.frame.appendChild(element);
      }
    }

    getElementForContentType(contentType, url) {
      if (contentType && contentType.includes('image/')) {
        const img = document.createElement('img');
        img.src = url;
        img.style.maxWidth = '100%';
        img.style.height = 'auto';
        return img;
      } else {
        const iframe = document.createElement('iframe');
        iframe.src = url;
        iframe.style.width = '100%';
        iframe.style.height = '600px';
        iframe.style.border = 'none';
        return iframe;
      }
    }

    executeScripts(container) {
      const scripts = container.querySelectorAll('script');
      scripts.forEach(oldScript => {
        const newScript = document.createElement('script');
        Array.from(oldScript.attributes).forEach(attr => {
          newScript.setAttribute(attr.name, attr.value);
        });
        newScript.appendChild(document.createTextNode(oldScript.innerHTML));
        oldScript.parentNode.replaceChild(newScript, oldScript);
      });
    }

    /**
     * UI控制方法
     */
    showContainer() {
      this.elements.container.style.display = 'block';
      this.elements.container.classList.add('show');
      document.body.style.overflow = 'hidden';
    }

    hideContainer() {
      this.elements.container.classList.remove('show');
      setTimeout(() => {
        this.elements.container.style.display = 'none';
      }, 300);
      document.body.style.overflow = '';
    }

    showLoading() {
      if (this.elements.loading) {
        this.elements.loading.style.display = 'block';
      }
      if (this.elements.frame) {
        this.elements.frame.style.display = 'none';
      }
      if (this.elements.error) {
        this.elements.error.style.display = 'none';
      }
    }

    hideLoading() {
      if (this.elements.loading) {
        this.elements.loading.style.display = 'none';
      }
      if (this.elements.frame) {
        this.elements.frame.style.display = 'block';
      }
    }

    showError(message) {
      this.state.error = message;
      if (this.elements.errorMessage) {
        this.elements.errorMessage.textContent = message;
      }
      if (this.elements.error) {
        this.elements.error.style.display = 'block';
      }
      if (this.elements.frame) {
        this.elements.frame.style.display = 'none';
      }
      if (this.elements.loading) {
        this.elements.loading.style.display = 'none';
      }
    }

    updateMetadata(title, type) {
      if (this.elements.title) {
        this.elements.title.textContent = title;
      }
      if (this.elements.type) {
        this.elements.type.textContent = this.getTypeLabel(type);
        this.elements.type.className = `viz-type type-${type}`;
      }
      if (this.elements.date) {
        this.elements.date.textContent = new Date().toLocaleString();
      }

      // 更新页面标题
      document.title = `${title} - 万物可视化`;
    }

    getTypeLabel(type) {
      const labels = {
        'generated': 'AI生成',
        'existing': '预设模板',
        'math': '数学',
        'astronomy': '天文',
        'physics': '物理',
        'chemistry': '化学'
      };
      return labels[type] || type;
    }

    showParams(params) {
      if (!this.elements.params || !this.elements.paramsContent) return;

      // 生成参数控制面板
      const paramsHTML = Object.keys(params).map(key => `
        <div class="param-item">
          <label class="param-label">${key}:</label>
          <input type="text"
                 class="param-input"
                 value="${params[key]}"
                 data-param="${key}"
                 readonly>
        </div>
      `).join('');

      this.elements.paramsContent.innerHTML = paramsHTML;
      this.elements.params.style.display = 'block';

      // 绑定参数变更事件
      this.elements.paramsContent.querySelectorAll('.param-input').forEach(input => {
        input.addEventListener('change', (e) => {
          const param = e.target.dataset.param;
          const value = e.target.value;
          this.handleParamChange(param, value);
        });
      });
    }

    hideParams() {
      if (this.elements.params) {
        this.elements.params.style.display = 'none';
      }
    }

    /**
     * 操作方法
     */
    handleParamChange(param, value) {
      if (this.state.currentVisualization) {
        this.state.currentVisualization.params[param] = value;
      }

      this.emit('param:changed', { param, value });
    }

    goBack() {
      this.hideContainer();
      this.emit('navigation:back');
    }

    refresh() {
      if (this.state.currentVisualization) {
        const { url, title, type, params } = this.state.currentVisualization;
        this.loadVisualization(url, { title, type, params });
      }
    }

    retry() {
      if (this.state.currentVisualization) {
        const { url, title, type, params } = this.state.currentVisualization;
        this.loadVisualization(url, { title, type, params });
      }
    }

    toggleFullscreen() {
      if (!document.fullscreenElement) {
        this.elements.container.requestFullscreen().catch(err => {
          console.warn(`Error attempting to enable fullscreen: ${err.message}`);
        });
      } else {
        document.exitFullscreen();
      }
    }

    close() {
      this.hideContainer();
      this.state.currentVisualization = null;
      this.emit('visualization:closed');
    }

    /**
     * 事件处理器
     */
    handleKeyDown(event) {
      if (this.elements.container.style.display === 'none') return;

      switch (event.key) {
        case 'Escape':
          this.close();
          break;
        case 'F5':
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault();
            this.refresh();
          }
          break;
      }
    }

    handleFullscreenChange() {
      const isFullscreen = !!document.fullscreenElement;

      if (this.elements.fullscreenBtn) {
        this.elements.fullscreenBtn.textContent = isFullscreen ? '⛶ 退出全屏' : '⛶ 全屏';
        this.elements.fullscreenBtn.title = isFullscreen ? '退出全屏' : '全屏';
      }

      this.emit('fullscreen:changed', { isFullscreen });
    }

    handleError(error) {
      console.error('Visualization error:', error);
      let message = '加载可视化时发生错误';

      if (error.message) {
        message = error.message;
      }

      this.showError(message);
      this.emit('visualization:error', { error, message });
    }

    /**
     * 事件系统
     */
    emit(eventName, data) {
      const event = new CustomEvent(`viz-container:${eventName}`, {
        detail: data,
        bubbles: true
      });
      document.dispatchEvent(event);
    }

    on(eventName, handler) {
      document.addEventListener(`viz-container:${eventName}`, handler);
    }

    off(eventName, handler) {
      document.removeEventListener(`viz-container:${eventName}`, handler);
    }

    /**
     * 工具方法
     */
    getCurrentVisualization() {
      return this.state.currentVisualization;
    }

    isLoading() {
      return this.state.isLoading;
    }

    hasError() {
      return !!this.state.error;
    }

    /**
     * 销毁方法
     */
    destroy() {
      // 清理事件监听
      document.removeEventListener('keydown', this.handleKeyDown);
      document.removeEventListener('fullscreenchange', this.handleFullscreenChange);

      // 清理容器
      if (this.elements.container && this.elements.container.parentNode) {
        this.elements.container.parentNode.removeChild(this.elements.container);
      }

      // 重置状态
      this.state = {
        currentVisualization: null,
        isLoading: false,
        error: null,
        loadingTimeout: null
      };

      console.log('VizContainer destroyed');
    }
  }

  // 创建全局实例
  global.VizContainer = VizContainer;

})(window);