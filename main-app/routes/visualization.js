/**
 * Visualization Route Handler
 * 可视化路由处理器
 *
 * 处理可视化相关的路由逻辑
 * 支持动态加载和渲染
 */

class VisualizationRoute {
  constructor() {
    this.name = 'Visualization Route';
    this.currentVisualization = null;
    this.container = null;
  }

  /**
   * 初始化路由
   */
  async init(container) {
    console.log('📊 初始化可视化路由...');
    this.container = container;

    // 监听路由变化
    this.setupRouteListeners();

    console.log('✅ 可视化路由初始化完成');
  }

  /**
   * 设置路由监听器
   */
  setupRouteListeners() {
    // 监听路由变化事件
    window.addEventListener('routeChange', this.handleRouteChange.bind(this));

    // 监听可视化模块加载事件
    window.addEventListener('moduleLoaded', this.handleModuleLoaded.bind(this));
  }

  /**
   * 处理路由变化
   */
  async handleRouteChange(event) {
    const { route, params } = event.detail;

    if (route === '/visualization' || route.startsWith('/visualization/')) {
      await this.renderVisualization(route, params);
    }
  }

  /**
   * 处理模块加载完成
   */
  handleModuleLoaded(event) {
    const { moduleId } = event.detail;
    console.log(`✅ 模块 ${moduleId} 加载完成，可以开始渲染可视化`);
  }

  /**
   * 渲染可视化
   */
  async renderVisualization(route, params) {
    console.log('🎨 渲染可视化页面', { route, params });

    // 清空容器
    if (this.container) {
      this.container.innerHTML = '';

      // 创建可视化容器
      const vizContainer = this.createVisualizationContainer();
      this.container.appendChild(vizContainer);

      // 根据参数加载对应的可视化
      await this.loadVisualizationContent(vizContainer, params);
    }
  }

  /**
   * 创建可视化容器
   */
  createVisualizationContainer() {
    const container = document.createElement('div');
    container.className = 'visualization-container';
    container.innerHTML = `
      <div class="visualization-header">
        <h2 class="visualization-title">可视化展示</h2>
        <div class="visualization-controls">
          <button id="backBtn" class="btn btn-secondary">
            <span class="icon">←</span>
            返回
          </button>
          <button id="refreshBtn" class="btn btn-primary">
            <span class="icon">↻</span>
            刷新
          </button>
          <button id="fullscreenBtn" class="btn btn-secondary">
            <span class="icon">⛶</span>
            全屏
          </button>
        </div>
      </div>
      <div class="visualization-content" id="vizContent">
        <div class="loading-indicator">
          <div class="spinner"></div>
          <p>正在加载可视化内容...</p>
        </div>
      </div>
      <div class="visualization-footer">
        <div class="visualization-info">
          <span class="info-item">
            <span class="label">类型:</span>
            <span class="value" id="vizType">-</span>
          </span>
          <span class="info-item">
            <span class="label">生成时间:</span>
            <span class="value" id="vizTime">-</span>
          </span>
        </div>
      </div>
    `;

    // 绑定事件
    this.bindVisualizationEvents(container);

    return container;
  }

  /**
   * 绑定可视化事件
   */
  bindVisualizationEvents(container) {
    const backBtn = container.querySelector('#backBtn');
    const refreshBtn = container.querySelector('#refreshBtn');
    const fullscreenBtn = container.querySelector('#fullscreenBtn');

    backBtn?.addEventListener('click', () => {
      // 触发路由返回
      window.dispatchEvent(new CustomEvent('navigate', {
        detail: { route: '/' }
      }));
    });

    refreshBtn?.addEventListener('click', () => {
      // 刷新当前可视化
      this.refreshVisualization();
    });

    fullscreenBtn?.addEventListener('click', () => {
      // 切换全屏
      this.toggleFullscreen(container);
    });
  }

  /**
   * 加载可视化内容
   */
  async loadVisualizationContent(container, params) {
    const contentArea = container.querySelector('#vizContent');

    try {
      // 根据参数确定可视化类型
      const vizType = this.determineVisualizationType(params);

      // 更新信息
      this.updateVisualizationInfo(vizType);

      // 加载对应的模块
      await this.loadVisualizationModule(vizType.module);

      // 渲染可视化
      await this.renderVisualizationType(contentArea, vizType, params);

    } catch (error) {
      console.error('可视化加载失败:', error);
      this.showError(contentArea, error);
    }
  }

  /**
   * 确定可视化类型
   */
  determineVisualizationType(params) {
    const { type, category, subject } = params;

    // 类型映射
    const typeMap = {
      'math': {
        module: 'math',
        defaultType: 'function-plot'
      },
      'astronomy': {
        module: 'astronomy',
        defaultType: 'solar-system'
      },
      'physics': {
        module: 'physics',
        defaultType: 'mechanics'
      },
      'chemistry': {
        module: 'chemistry',
        defaultType: 'molecule'
      }
    };

    const module = typeMap[category || subject || 'math'];

    return {
      module: module.module,
      type: type || module.defaultType,
      category: category || subject || 'math'
    };
  }

  /**
   * 加载可视化模块
   */
  async loadVisualizationModule(moduleId) {
    // 检查模块是否已加载
    if (window.loadedModules && window.loadedModules.has(moduleId)) {
      console.log(`✅ 模块 ${moduleId} 已加载`);
      return;
    }

    // 触发模块加载
    window.dispatchEvent(new CustomEvent('loadModule', {
      detail: { moduleId }
    }));

    // 等待模块加载完成
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error(`模块 ${moduleId} 加载超时`));
      }, 10000);

      const handleModuleLoaded = (event) => {
        if (event.detail.moduleId === moduleId) {
          clearTimeout(timeout);
          window.removeEventListener('moduleLoaded', handleModuleLoaded);
          resolve();
        }
      };

      window.addEventListener('moduleLoaded', handleModuleLoaded);
    });
  }

  /**
   * 渲染可视化类型
   */
  async renderVisualizationType(container, vizType, params) {
    // 查找已注册的可视化类型
    const registeredTypes = this.getRegisteredVisualizationTypes();
    const vizConfig = registeredTypes.find(t =>
      t.id === vizType.type && t.category === vizType.category
    );

    if (!vizConfig) {
      throw new Error(`未找到可视化类型: ${vizType.type} (${vizType.category})`);
    }

    // 调用渲染函数
    await vizConfig.render(container, {
      ...params,
      type: vizType.type,
      category: vizType.category
    });

    // 记录当前可视化
    this.currentVisualization = {
      type: vizType.type,
      category: vizType.category,
      params: params,
      config: vizConfig
    };
  }

  /**
   * 获取已注册的可视化类型
   */
  getRegisteredVisualizationTypes() {
    // 从全局状态获取已注册的类型
    if (window.registeredVisualizationTypes) {
      return window.registeredVisualizationTypes;
    }

    // 默认返回空数组
    return [];
  }

  /**
   * 更新可视化信息
   */
  updateVisualizationInfo(vizType) {
    const typeElement = document.getElementById('vizType');
    const timeElement = document.getElementById('vizTime');

    if (typeElement) {
      typeElement.textContent = `${vizType.category} - ${vizType.type}`;
    }

    if (timeElement) {
      timeElement.textContent = new Date().toLocaleString();
    }
  }

  /**
   * 刷新可视化
   */
  async refreshVisualization() {
    if (this.currentVisualization) {
      const contentArea = document.querySelector('#vizContent');
      if (contentArea) {
        contentArea.innerHTML = `
          <div class="loading-indicator">
            <div class="spinner"></div>
            <p>正在刷新可视化内容...</p>
          </div>
        `;

        await this.renderVisualizationType(
          contentArea,
          this.currentVisualization,
          this.currentVisualization.params
        );
      }
    }
  }

  /**
   * 切换全屏
   */
  toggleFullscreen(container) {
    if (!document.fullscreenElement) {
      container.requestFullscreen().then(() => {
        container.classList.add('fullscreen');
      }).catch(err => {
        console.error('无法进入全屏模式:', err);
      });
    } else {
      document.exitFullscreen().then(() => {
        container.classList.remove('fullscreen');
      });
    }
  }

  /**
   * 显示错误
   */
  showError(container, error) {
    container.innerHTML = `
      <div class="error-container">
        <div class="error-icon">❌</div>
        <h3>可视化加载失败</h3>
        <p class="error-message">${error.message}</p>
        <div class="error-actions">
          <button class="btn btn-primary" onclick="location.reload()">
            重新加载页面
          </button>
          <button class="btn btn-secondary" onclick="history.back()">
            返回上一页
          </button>
        </div>
      </div>
    `;
  }

  /**
   * 销毁路由
   */
  destroy() {
    console.log('🧹 清理可视化路由资源...');

    // 清理当前可视化
    if (this.currentVisualization) {
      // 调用可视化组件的销毁方法
      if (this.currentVisualization.config && this.currentVisualization.config.destroy) {
        this.currentVisualization.config.destroy();
      }
      this.currentVisualization = null;
    }

    // 移除事件监听器
    window.removeEventListener('routeChange', this.handleRouteChange);
    window.removeEventListener('moduleLoaded', this.handleModuleLoaded);

    this.container = null;
  }
}

// 导出路由
export default VisualizationRoute;

// 如果需要支持CommonJS
if (typeof module !== 'undefined' && module.exports) {
  module.exports = VisualizationRoute;
}