/**
 * ProjectManager.js - 项目管理器组件
 * 提供完整的项目管理功能，包括项目创建、编辑、组织和批量操作
 */
(function(global) {
  'use strict';

  /**
   * 项目管理器组件类
   */
  class ProjectManager {
    constructor(container, options = {}) {
      // 容器元素
      this.container = typeof container === 'string' ? document.querySelector(container) : container;
      if (!this.container) {
        throw new Error('无效的容器元素');
      }

      // 配置选项
      this.options = {
        enableDragDrop: options.enableDragDrop !== false,
        enableBatchOperations: options.enableBatchOperations !== false,
        enableTemplates: options.enableTemplates !== false,
        enableSearch: options.enableSearch !== false,
        enableFilters: options.enableFilters !== false,
        maxProjectsPerPage: options.maxProjectsPerPage || 20,
        enableSorting: options.enableSorting !== false,
        enablePreview: options.enablePreview !== false,
        autoSave: options.autoSave !== false,
        ...options
      };

      // 状态管理
      this.state = {
        isLoading: false,
        currentView: 'grid', // grid, list, table
        projects: [],
        selectedProjects: new Set(),
        filters: {
          category: 'all',
          status: 'all',
          tags: [],
          dateRange: null,
          searchQuery: ''
        },
        sortBy: 'updatedAt',
        sortOrder: 'desc',
        currentPage: 1,
        totalPages: 1,
        totalProjects: 0,
        viewMode: 'manage', // manage, create, edit
        currentProject: null,
        templates: [],
        folders: [],
        currentFolder: null
      };

      // 子组件
      this.components = {
        toolbar: null,
        searchBox: null,
        filtersPanel: null,
        projectGrid: null,
        projectTable: null,
        createModal: null,
        editModal: null,
        batchActionsBar: null,
        previewModal: null
      };

      // 拖拽状态
      this.dragState = {
        isDragging: false,
        draggedProject: null,
        dropTarget: null
      };

      // 事件监听器
      this.eventListeners = new Map();

      // 初始化
      this.init();
    }

    /**
     * 初始化组件
     */
    async init() {
      try {
        console.log('ProjectManager 初始化中...');

        // 设置样式
        this.setupStyles();

        // 创建布局结构
        this.createLayout();

        // 初始化子组件
        await this.initializeComponents();

        // 加载初始数据
        await this.loadInitialData();

        // 设置事件监听
        this.setupEventListeners();

        // 应用初始状态
        this.applyInitialState();

        console.log('ProjectManager 初始化完成');
        this.emitEvent('manager:initialized');

      } catch (error) {
        console.error('ProjectManager 初始化失败:', error);
        this.showError('初始化失败', error.message);
      }
    }

    /**
     * 设置样式
     */
    setupStyles() {
      const styleId = 'project-manager-styles';
      if (!document.getElementById(styleId)) {
        const style = document.createElement('style');
        style.id = styleId;
        style.textContent = `
          .project-manager {
            display: flex;
            flex-direction: column;
            height: 100%;
            background: var(--bg-primary, #f8f9fa);
          }

          .manager-toolbar {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 1rem;
            background: var(--bg-secondary, #ffffff);
            border-bottom: 1px solid var(--border-color, #e0e0e0);
            gap: 1rem;
            flex-wrap: wrap;
          }

          .toolbar-left {
            display: flex;
            align-items: center;
            gap: 1rem;
          }

          .toolbar-right {
            display: flex;
            align-items: center;
            gap: 1rem;
          }

          .search-box {
            position: relative;
            width: 300px;
          }

          .search-input {
            width: 100%;
            padding: 0.5rem 2.5rem 0.5rem 1rem;
            border: 1px solid var(--border-color, #e0e0e0);
            border-radius: 6px;
            font-size: 0.9rem;
          }

          .search-icon {
            position: absolute;
            right: 0.75rem;
            top: 50%;
            transform: translateY(-50%);
            color: var(--text-secondary, #666666);
          }

          .filter-controls {
            display: flex;
            gap: 0.5rem;
            align-items: center;
          }

          .filter-select {
            padding: 0.5rem;
            border: 1px solid var(--border-color, #e0e0e0);
            border-radius: 6px;
            font-size: 0.9rem;
            background: var(--bg-secondary, #ffffff);
          }

          .view-toggle {
            display: flex;
            background: var(--bg-tertiary, #f5f5f5);
            border-radius: 6px;
            padding: 0.25rem;
          }

          .view-btn {
            padding: 0.5rem;
            border: none;
            background: transparent;
            border-radius: 4px;
            cursor: pointer;
            transition: background-color 0.2s ease;
          }

          .view-btn.active {
            background: var(--primary-color, #007bff);
            color: white;
          }

          .manager-content {
            flex: 1;
            display: flex;
            flex-direction: column;
            overflow: hidden;
          }

          .batch-actions-bar {
            display: none;
            padding: 1rem;
            background: var(--info-bg, #d1ecf1);
            border-bottom: 1px solid var(--info-border, #bee5eb);
            align-items: center;
            justify-content: space-between;
          }

          .batch-actions-bar.active {
            display: flex;
          }

          .batch-info {
            display: flex;
            align-items: center;
            gap: 1rem;
          }

          .batch-actions {
            display: flex;
            gap: 0.5rem;
          }

          .projects-container {
            flex: 1;
            padding: 1rem;
            overflow-y: auto;
          }

          .projects-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
            gap: 1.5rem;
          }

          .project-card {
            background: var(--bg-secondary, #ffffff);
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            transition: all 0.2s ease;
            cursor: pointer;
            position: relative;
          }

          .project-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 16px rgba(0,0,0,0.15);
          }

          .project-card.selected {
            border: 2px solid var(--primary-color, #007bff);
            box-shadow: 0 0 0 2px rgba(0,123,255,0.25);
          }

          .project-card.dragging {
            opacity: 0.5;
            transform: rotate(5deg);
          }

          .project-checkbox {
            position: absolute;
            top: 1rem;
            left: 1rem;
            z-index: 10;
            width: 20px;
            height: 20px;
            cursor: pointer;
          }

          .project-thumbnail {
            width: 100%;
            height: 180px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 3rem;
            position: relative;
            overflow: hidden;
          }

          .project-status {
            position: absolute;
            top: 1rem;
            right: 1rem;
            padding: 0.25rem 0.5rem;
            border-radius: 4px;
            font-size: 0.75rem;
            font-weight: 500;
            text-transform: uppercase;
          }

          .project-status.draft {
            background: var(--warning-bg, #fff3cd);
            color: var(--warning-text, #856404);
          }

          .project-status.published {
            background: var(--success-bg, #d4edda);
            color: var(--success-text, #155724);
          }

          .project-status.archived {
            background: var(--secondary-bg, #e2e3e5);
            color: var(--secondary-text, #383d41);
          }

          .project-info {
            padding: 1rem;
          }

          .project-title {
            font-weight: 600;
            margin-bottom: 0.5rem;
            color: var(--text-primary, #333333);
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
          }

          .project-description {
            font-size: 0.85rem;
            color: var(--text-secondary, #666666);
            margin-bottom: 0.75rem;
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
          }

          .project-meta {
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 0.8rem;
            color: var(--text-muted, #6c757d);
            margin-bottom: 0.75rem;
          }

          .project-stats {
            display: flex;
            gap: 1rem;
            font-size: 0.8rem;
            color: var(--text-muted, #6c757d);
          }

          .project-tags {
            display: flex;
            gap: 0.5rem;
            flex-wrap: wrap;
            margin-bottom: 0.75rem;
          }

          .project-tag {
            padding: 0.25rem 0.5rem;
            background: var(--bg-tertiary, #f0f0f0);
            border-radius: 4px;
            font-size: 0.75rem;
            color: var(--text-secondary, #666666);
          }

          .project-actions {
            display: flex;
            gap: 0.5rem;
            opacity: 0;
            transition: opacity 0.2s ease;
          }

          .project-card:hover .project-actions {
            opacity: 1;
          }

          .project-action-btn {
            padding: 0.25rem 0.5rem;
            border: 1px solid var(--border-color, #e0e0e0);
            border-radius: 4px;
            background: var(--bg-secondary, #ffffff);
            color: var(--text-secondary, #666666);
            font-size: 0.8rem;
            cursor: pointer;
            transition: all 0.2s ease;
          }

          .project-action-btn:hover {
            background: var(--primary-color, #007bff);
            color: white;
            border-color: var(--primary-color, #007bff);
          }

          .projects-table {
            width: 100%;
            background: var(--bg-secondary, #ffffff);
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          }

          .projects-table thead {
            background: var(--bg-tertiary, #f5f5f5);
          }

          .projects-table th {
            padding: 1rem;
            text-align: left;
            font-weight: 600;
            color: var(--text-primary, #333333);
            border-bottom: 1px solid var(--border-color, #e0e0e0);
          }

          .projects-table td {
            padding: 1rem;
            border-bottom: 1px solid var(--border-color, #e0e0e0);
          }

          .projects-table tbody tr {
            transition: background-color 0.2s ease;
          }

          .projects-table tbody tr:hover {
            background: var(--hover-bg, #f8f9fa);
          }

          .projects-table tbody tr.selected {
            background: rgba(0,123,255,0.1);
          }

          .modal {
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.5);
            z-index: 1000;
            align-items: center;
            justify-content: center;
          }

          .modal.active {
            display: flex;
          }

          .modal-content {
            background: var(--bg-secondary, #ffffff);
            border-radius: 8px;
            max-width: 90%;
            max-height: 90%;
            overflow-y: auto;
            box-shadow: 0 4px 20px rgba(0,0,0,0.3);
          }

          .modal-header {
            padding: 1.5rem;
            border-bottom: 1px solid var(--border-color, #e0e0e0);
            display: flex;
            justify-content: space-between;
            align-items: center;
          }

          .modal-title {
            font-size: 1.25rem;
            font-weight: 600;
            color: var(--text-primary, #333333);
          }

          .modal-close {
            background: none;
            border: none;
            font-size: 1.5rem;
            cursor: pointer;
            color: var(--text-secondary, #666666);
          }

          .modal-body {
            padding: 1.5rem;
          }

          .modal-footer {
            padding: 1.5rem;
            border-top: 1px solid var(--border-color, #e0e0e0);
            display: flex;
            justify-content: flex-end;
            gap: 1rem;
          }

          .form-group {
            margin-bottom: 1.5rem;
          }

          .form-label {
            display: block;
            margin-bottom: 0.5rem;
            font-weight: 500;
            color: var(--text-primary, #333333);
          }

          .form-input,
          .form-select,
          .form-textarea {
            width: 100%;
            padding: 0.75rem;
            border: 1px solid var(--border-color, #e0e0e0);
            border-radius: 6px;
            font-size: 0.9rem;
            background: var(--bg-secondary, #ffffff);
          }

          .form-textarea {
            resize: vertical;
            min-height: 100px;
          }

          .form-help {
            font-size: 0.8rem;
            color: var(--text-muted, #6c757d);
            margin-top: 0.25rem;
          }

          .btn {
            padding: 0.75rem 1.5rem;
            border: none;
            border-radius: 6px;
            font-size: 0.9rem;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.2s ease;
          }

          .btn-primary {
            background: var(--primary-color, #007bff);
            color: white;
          }

          .btn-primary:hover {
            background: var(--primary-hover, #0056b3);
          }

          .btn-secondary {
            background: var(--secondary-color, #6c757d);
            color: white;
          }

          .btn-secondary:hover {
            background: #545b62;
          }

          .btn-outline {
            background: transparent;
            border: 1px solid var(--border-color, #e0e0e0);
            color: var(--text-secondary, #666666);
          }

          .btn-outline:hover {
            background: var(--bg-tertiary, #f5f5f5);
          }

          .pagination {
            display: flex;
            justify-content: center;
            align-items: center;
            gap: 0.5rem;
            padding: 1rem;
          }

          .page-btn {
            padding: 0.5rem 0.75rem;
            border: 1px solid var(--border-color, #e0e0e0);
            border-radius: 4px;
            background: var(--bg-secondary, #ffffff);
            color: var(--text-primary, #333333);
            cursor: pointer;
            transition: all 0.2s ease;
          }

          .page-btn.active {
            background: var(--primary-color, #007bff);
            color: white;
            border-color: var(--primary-color, #007bff);
          }

          .page-btn:disabled {
            opacity: 0.5;
            cursor: not-allowed;
          }

          .empty-state {
            text-align: center;
            padding: 3rem;
            color: var(--text-secondary, #666666);
          }

          .empty-state-icon {
            font-size: 4rem;
            margin-bottom: 1rem;
            opacity: 0.5;
          }

          .loading-spinner {
            display: flex;
            justify-content: center;
            align-items: center;
            height: 200px;
          }

          .spinner {
            width: 40px;
            height: 40px;
            border: 4px solid var(--border-color, #e0e0e0);
            border-top: 4px solid var(--primary-color, #007bff);
            border-radius: 50%;
            animation: spin 1s linear infinite;
          }

          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }

          .template-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
            gap: 1.5rem;
            margin-bottom: 2rem;
          }

          .template-card {
            background: var(--bg-secondary, #ffffff);
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            transition: all 0.2s ease;
            cursor: pointer;
            border: 2px solid transparent;
          }

          .template-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 16px rgba(0,0,0,0.15);
          }

          .template-card.selected {
            border-color: var(--primary-color, #007bff);
          }

          .template-thumbnail {
            width: 100%;
            height: 150px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 2rem;
          }

          .template-info {
            padding: 1rem;
          }

          .template-title {
            font-weight: 600;
            margin-bottom: 0.5rem;
            color: var(--text-primary, #333333);
          }

          .template-description {
            font-size: 0.85rem;
            color: var(--text-secondary, #666666);
            margin-bottom: 0.5rem;
          }

          .template-meta {
            display: flex;
            justify-content: space-between;
            font-size: 0.8rem;
            color: var(--text-muted, #6c757d);
          }

          .drop-zone {
            border: 2px dashed var(--border-color, #e0e0e0);
            border-radius: 8px;
            padding: 2rem;
            text-align: center;
            background: var(--bg-tertiary, #f5f5f5);
            transition: all 0.2s ease;
          }

          .drop-zone.active {
            border-color: var(--primary-color, #007bff);
            background: rgba(0,123,255,0.1);
          }

          @media (max-width: 768px) {
            .manager-toolbar {
              flex-direction: column;
              align-items: stretch;
              gap: 1rem;
            }

            .toolbar-left,
            .toolbar-right {
              flex-direction: column;
              gap: 1rem;
            }

            .search-box {
              width: 100%;
            }

            .projects-grid {
              grid-template-columns: 1fr;
            }

            .batch-actions-bar {
              flex-direction: column;
              gap: 1rem;
            }
          }
        `;
        document.head.appendChild(style);
      }
    }

    /**
     * 创建布局结构
     */
    createLayout() {
      this.container.innerHTML = `
        <div class="project-manager" data-manager-id="${this.generateId()}">
          <div class="manager-toolbar">
            <div class="toolbar-left">
              <button class="btn btn-primary" id="create-project-btn">
                <span>➕</span> 新建项目
              </button>

              <div class="search-box" id="search-box">
                <input type="text" class="search-input" id="search-input" placeholder="搜索项目..." />
                <span class="search-icon">🔍</span>
              </div>

              <div class="filter-controls" id="filter-controls">
                <select class="filter-select" id="category-filter">
                  <option value="all">所有分类</option>
                  <option value="mathematics">数学</option>
                  <option value="astronomy">天文</option>
                  <option value="physics">物理</option>
                  <option value="chemistry">化学</option>
                </select>

                <select class="filter-select" id="status-filter">
                  <option value="all">所有状态</option>
                  <option value="draft">草稿</option>
                  <option value="published">已发布</option>
                  <option value="archived">已归档</option>
                </select>

                <select class="filter-select" id="sort-select">
                  <option value="updatedAt">最近更新</option>
                  <option value="createdAt">创建时间</option>
                  <option value="title">标题</option>
                  <option value="viewCount">浏览量</option>
                </select>
              </div>
            </div>

            <div class="toolbar-right">
              <div class="view-toggle">
                <button class="view-btn active" data-view="grid">
                  <span>⊞</span>
                </button>
                <button class="view-btn" data-view="list">
                  <span>☰</span>
                </button>
                <button class="view-btn" data-view="table">
                  <span>⊟</span>
                </button>
              </div>
            </div>
          </div>

          <div class="manager-content">
            <div class="batch-actions-bar" id="batch-actions-bar">
              <div class="batch-info">
                <span>已选择 <strong id="selected-count">0</strong> 个项目</span>
              </div>
              <div class="batch-actions">
                <button class="btn btn-outline" data-batch-action="delete">删除</button>
                <button class="btn btn-outline" data-batch-action="move">移动</button>
                <button class="btn btn-outline" data-batch-action="tag">添加标签</button>
                <button class="btn btn-outline" data-batch-action="export">导出</button>
                <button class="btn btn-secondary" data-batch-action="deselect">取消选择</button>
              </div>
            </div>

            <div class="projects-container" id="projects-container">
              <div class="loading-spinner">
                <div class="spinner"></div>
              </div>
            </div>
          </div>
        </div>
      `;
    }

    /**
     * 初始化子组件
     */
    async initializeComponents() {
      // 初始化组件引用
      this.components.toolbar = this.container.querySelector('.manager-toolbar');
      this.components.searchBox = this.container.querySelector('#search-box');
      this.components.projectsContainer = this.container.querySelector('#projects-container');
      this.components.batchActionsBar = this.container.querySelector('#batch-actions-bar');

      // 创建模态框
      this.createModals();
    }

    /**
     * 创建模态框
     */
    createModals() {
      const modalsContainer = document.createElement('div');
      modalsContainer.innerHTML = `
        <!-- 创建项目模态框 -->
        <div class="modal" id="create-modal">
          <div class="modal-content">
            <div class="modal-header">
              <h3 class="modal-title">创建新项目</h3>
              <button class="modal-close" data-close="create-modal">&times;</button>
            </div>
            <div class="modal-body">
              <div class="form-group">
                <label class="form-label">项目名称</label>
                <input type="text" class="form-input" id="create-title" placeholder="输入项目名称" />
                <div class="form-help">给您的项目起一个描述性的名称</div>
              </div>

              <div class="form-group">
                <label class="form-label">项目描述</label>
                <textarea class="form-textarea" id="create-description" placeholder="描述您的项目内容"></textarea>
                <div class="form-help">简要描述项目的功能和目的</div>
              </div>

              <div class="form-group">
                <label class="form-label">项目分类</label>
                <select class="form-select" id="create-category">
                  <option value="mathematics">数学</option>
                  <option value="astronomy">天文</option>
                  <option value="physics">物理</option>
                  <option value="chemistry">化学</option>
                </select>
              </div>

              <div class="form-group">
                <label class="form-label">项目类型</label>
                <select class="form-select" id="create-type">
                  <option value="visualization">可视化</option>
                  <option value="analysis">分析</option>
                  <option value="report">报告</option>
                </select>
              </div>

              <div class="form-group">
                <label class="form-label">选择模板（可选）</label>
                <div class="template-grid" id="template-grid">
                  <div class="loading-spinner">
                    <div class="spinner"></div>
                  </div>
                </div>
              </div>

              <div class="form-group">
                <label class="form-label">标签</label>
                <input type="text" class="form-input" id="create-tags" placeholder="输入标签，用逗号分隔" />
                <div class="form-help">为项目添加标签，便于分类和搜索</div>
              </div>
            </div>
            <div class="modal-footer">
              <button class="btn btn-secondary" data-close="create-modal">取消</button>
              <button class="btn btn-primary" id="create-confirm-btn">创建项目</button>
            </div>
          </div>
        </div>

        <!-- 编辑项目模态框 -->
        <div class="modal" id="edit-modal">
          <div class="modal-content">
            <div class="modal-header">
              <h3 class="modal-title">编辑项目</h3>
              <button class="modal-close" data-close="edit-modal">&times;</button>
            </div>
            <div class="modal-body">
              <div class="form-group">
                <label class="form-label">项目名称</label>
                <input type="text" class="form-input" id="edit-title" />
              </div>

              <div class="form-group">
                <label class="form-label">项目描述</label>
                <textarea class="form-textarea" id="edit-description"></textarea>
              </div>

              <div class="form-group">
                <label class="form-label">项目分类</label>
                <select class="form-select" id="edit-category">
                  <option value="mathematics">数学</option>
                  <option value="astronomy">天文</option>
                  <option value="physics">物理</option>
                  <option value="chemistry">化学</option>
                </select>
              </div>

              <div class="form-group">
                <label class="form-label">项目状态</label>
                <select class="form-select" id="edit-status">
                  <option value="draft">草稿</option>
                  <option value="published">已发布</option>
                  <option value="archived">已归档</option>
                </select>
              </div>

              <div class="form-group">
                <label class="form-label">标签</label>
                <input type="text" class="form-input" id="edit-tags" />
              </div>
            </div>
            <div class="modal-footer">
              <button class="btn btn-secondary" data-close="edit-modal">取消</button>
              <button class="btn btn-primary" id="edit-confirm-btn">保存更改</button>
            </div>
          </div>
        </div>

        <!-- 预览模态框 -->
        <div class="modal" id="preview-modal">
          <div class="modal-content" style="max-width: 800px;">
            <div class="modal-header">
              <h3 class="modal-title">项目预览</h3>
              <button class="modal-close" data-close="preview-modal">&times;</button>
            </div>
            <div class="modal-body" id="preview-content">
              <!-- 预览内容将在这里插入 -->
            </div>
            <div class="modal-footer">
              <button class="btn btn-secondary" data-close="preview-modal">关闭</button>
              <button class="btn btn-primary" id="preview-edit-btn">编辑项目</button>
            </div>
          </div>
        </div>
      `;

      this.container.appendChild(modalsContainer);

      // 初始化模态框组件引用
      this.components.createModal = this.container.querySelector('#create-modal');
      this.components.editModal = this.container.querySelector('#edit-modal');
      this.components.previewModal = this.container.querySelector('#preview-modal');
    }

    /**
     * 加载初始数据
     */
    async loadInitialData() {
      try {
        this.setLoading(true);

        // 并行加载数据
        const [projectsResult, templates] = await Promise.all([
          global.userDataService?.getUserProjects({
            limit: this.options.maxProjectsPerPage,
            page: this.state.currentPage,
            sortBy: this.state.sortBy,
            sortOrder: this.state.sortOrder
          }) || { projects: [], total: 0, totalPages: 1 },
          global.projectDataService?.getProjectTemplates() || []
        ]);

        this.state.projects = projectsResult.projects || [];
        this.state.totalProjects = projectsResult.total || 0;
        this.state.totalPages = projectsResult.totalPages || 1;
        this.state.templates = templates;

        // 渲染界面
        this.renderProjects();
        this.renderTemplates();

      } catch (error) {
        console.error('加载初始数据失败:', error);
        this.showError('加载数据失败', error.message);
      } finally {
        this.setLoading(false);
      }
    }

    /**
     * 设置事件监听器
     */
    setupEventListeners() {
      // 工具栏事件
      this.setupToolbarEvents();

      // 搜索和过滤事件
      this.setupSearchEvents();

      // 视图切换事件
      this.setupViewToggleEvents();

      // 批量操作事件
      this.setupBatchOperationEvents();

      // 模态框事件
      this.setupModalEvents();

      // 项目卡片事件
      this.setupProjectCardEvents();

      // 拖拽事件
      if (this.options.enableDragDrop) {
        this.setupDragDropEvents();
      }

      // 键盘事件
      this.setupKeyboardEvents();

      // 外部事件监听
      this.setupExternalEventListeners();
    }

    /**
     * 设置工具栏事件
     */
    setupToolbarEvents() {
      // 创建项目按钮
      const createBtn = this.getElement('create-project-btn');
      if (createBtn) {
        createBtn.addEventListener('click', () => {
          this.showCreateModal();
        });
      }

      // 分类过滤
      const categoryFilter = this.getElement('category-filter');
      if (categoryFilter) {
        categoryFilter.addEventListener('change', () => {
          this.state.filters.category = categoryFilter.value;
          this.applyFilters();
        });
      }

      // 状态过滤
      const statusFilter = this.getElement('status-filter');
      if (statusFilter) {
        statusFilter.addEventListener('change', () => {
          this.state.filters.status = statusFilter.value;
          this.applyFilters();
        });
      }

      // 排序
      const sortSelect = this.getElement('sort-select');
      if (sortSelect) {
        sortSelect.addEventListener('change', () => {
          this.state.sortBy = sortSelect.value;
          this.applySorting();
        });
      }
    }

    /**
     * 设置搜索事件
     */
    setupSearchEvents() {
      const searchInput = this.getElement('search-input');
      if (searchInput) {
        let searchTimeout;

        searchInput.addEventListener('input', (e) => {
          clearTimeout(searchTimeout);
          searchTimeout = setTimeout(() => {
            this.state.filters.searchQuery = e.target.value.trim();
            this.applyFilters();
          }, 300);
        });

        searchInput.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') {
            this.state.filters.searchQuery = e.target.value.trim();
            this.applyFilters();
          }
        });
      }
    }

    /**
     * 设置视图切换事件
     */
    setupViewToggleEvents() {
      this.container.querySelectorAll('.view-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const view = btn.dataset.view;
          this.switchView(view);
        });
      });
    }

    /**
     * 设置批量操作事件
     */
    setupBatchOperationEvents() {
      // 批量操作按钮
      this.container.querySelectorAll('[data-batch-action]').forEach(btn => {
        btn.addEventListener('click', () => {
          const action = btn.dataset.batchAction;
          this.handleBatchAction(action);
        });
      });

      // 取消选择按钮
      const deselectBtn = this.container.querySelector('[data-batch-action="deselect"]');
      if (deselectBtn) {
        deselectBtn.addEventListener('click', () => {
          this.clearSelection();
        });
      }
    }

    /**
     * 设置模态框事件
     */
    setupModalEvents() {
      // 关闭按钮
      this.container.querySelectorAll('[data-close]').forEach(btn => {
        btn.addEventListener('click', () => {
          const modalId = btn.dataset.close;
          this.closeModal(modalId);
        });
      });

      // 点击背景关闭
      this.container.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
          if (e.target === modal) {
            this.closeModal(modal.id);
          }
        });
      });

      // 创建项目确认
      const createConfirmBtn = this.getElement('create-confirm-btn');
      if (createConfirmBtn) {
        createConfirmBtn.addEventListener('click', () => {
          this.handleCreateProject();
        });
      }

      // 编辑项目确认
      const editConfirmBtn = this.getElement('edit-confirm-btn');
      if (editConfirmBtn) {
        editConfirmBtn.addEventListener('click', () => {
          this.handleEditProject();
        });
      }

      // 预览编辑按钮
      const previewEditBtn = this.getElement('preview-edit-btn');
      if (previewEditBtn) {
        previewEditBtn.addEventListener('click', () => {
          this.closeModal('preview-modal');
          this.showEditModal(this.state.currentProject);
        });
      }
    }

    /**
     * 设置项目卡片事件
     */
    setupProjectCardEvents() {
      // 使用事件委托处理项目卡片点击
      this.components.projectsContainer.addEventListener('click', (e) => {
        const projectCard = e.target.closest('.project-card');
        if (!projectCard) return;

        const projectId = projectCard.dataset.projectId;
        const project = this.state.projects.find(p => p.id === projectId);
        if (!project) return;

        // 处理不同的点击区域
        if (e.target.closest('.project-checkbox')) {
          this.toggleProjectSelection(projectId);
        } else if (e.target.closest('.project-action-btn')) {
          const action = e.target.closest('.project-action-btn').dataset.action;
          this.handleProjectAction(project, action);
        } else if (e.target.closest('.project-thumbnail') || e.target.closest('.project-info')) {
          this.openProject(project);
        }
      });

      // 双击编辑
      this.components.projectsContainer.addEventListener('dblclick', (e) => {
        const projectCard = e.target.closest('.project-card');
        if (projectCard) {
          const projectId = projectCard.dataset.projectId;
          const project = this.state.projects.find(p => p.id === projectId);
          if (project) {
            this.showEditModal(project);
          }
        }
      });
    }

    /**
     * 设置拖拽事件
     */
    setupDragDropEvents() {
      // 项目拖拽
      this.components.projectsContainer.addEventListener('dragstart', (e) => {
        const projectCard = e.target.closest('.project-card');
        if (projectCard) {
          this.handleDragStart(e, projectCard);
        }
      });

      this.components.projectsContainer.addEventListener('dragend', (e) => {
        this.handleDragEnd(e);
      });

      this.components.projectsContainer.addEventListener('dragover', (e) => {
        e.preventDefault();
        this.handleDragOver(e);
      });

      this.components.projectsContainer.addEventListener('drop', (e) => {
        e.preventDefault();
        this.handleDrop(e);
      });
    }

    /**
     * 设置键盘事件
     */
    setupKeyboardEvents() {
      document.addEventListener('keydown', (e) => {
        // Ctrl+A 全选
        if (e.ctrlKey && e.key === 'a') {
          const searchInput = this.getElement('search-input');
          if (document.activeElement !== searchInput) {
            e.preventDefault();
            this.selectAllProjects();
          }
        }

        // Escape 取消选择
        if (e.key === 'Escape') {
          if (this.state.selectedProjects.size > 0) {
            this.clearSelection();
          } else {
            // 关闭所有模态框
            this.closeAllModals();
          }
        }

        // Delete 删除选中项目
        if (e.key === 'Delete' && this.state.selectedProjects.size > 0) {
          this.handleBatchAction('delete');
        }
      });
    }

    /**
     * 设置外部事件监听
     */
    setupExternalEventListeners() {
      // 监听数据服务事件
      if (global.userDataService) {
        global.userDataService.addEventListener('project:created', () => {
          this.refreshProjects();
        });

        global.userDataService.addEventListener('project:updated', () => {
          this.refreshProjects();
        });

        global.userDataService.addEventListener('project:deleted', () => {
          this.refreshProjects();
        });
      }
    }

    /**
     * 渲染项目列表
     */
    renderProjects() {
      const container = this.components.projectsContainer;
      if (!container) return;

      if (this.state.projects.length === 0) {
        container.innerHTML = `
          <div class="empty-state">
            <div class="empty-state-icon">📁</div>
            <h3>还没有项目</h3>
            <p>创建您的第一个可视化项目</p>
            <button class="btn btn-primary" onclick="this.showCreateModal()">
              创建项目
            </button>
          </div>
        `;
        return;
      }

      let html = '';

      // 根据当前视图模式渲染
      switch (this.state.currentView) {
        case 'grid':
          html = this.renderProjectsGrid();
          break;
        case 'list':
          html = this.renderProjectsList();
          break;
        case 'table':
          html = this.renderProjectsTable();
          break;
      }

      // 添加分页
      if (this.state.totalPages > 1) {
        html += this.renderPagination();
      }

      container.innerHTML = html;
    }

    /**
     * 渲染项目网格
     */
    renderProjectsGrid() {
      return `
        <div class="projects-grid">
          ${this.state.projects.map(project => this.renderProjectCard(project)).join('')}
        </div>
      `;
    }

    /**
     * 渲染项目卡片
     */
    renderProjectCard(project) {
      const isSelected = this.state.selectedProjects.has(project.id);
      const categoryIcon = this.getCategoryIcon(project.category);
      const statusClass = project.status;

      return `
        <div class="project-card ${isSelected ? 'selected' : ''}"
             data-project-id="${project.id}"
             draggable="${this.options.enableDragDrop}">

          <input type="checkbox"
                 class="project-checkbox"
                 ${isSelected ? 'checked' : ''}
                 onclick="event.stopPropagation()" />

          <div class="project-thumbnail">
            <span>${categoryIcon}</span>
            <div class="project-status ${statusClass}">${this.getStatusText(project.status)}</div>
          </div>

          <div class="project-info">
            <h3 class="project-title">${this.escapeHtml(project.title)}</h3>
            <p class="project-description">${this.escapeHtml(project.description || '')}</p>

            <div class="project-meta">
              <span>${this.formatDate(project.metadata.updatedAt)}</span>
              <span>${project.category}</span>
            </div>

            <div class="project-stats">
              <span>👁 ${project.metadata.viewCount || 0}</span>
              <span>❤️ ${project.metadata.likeCount || 0}</span>
            </div>

            <div class="project-tags">
              ${project.tags.map(tag => `<span class="project-tag">${this.escapeHtml(tag)}</span>`).join('')}
            </div>

            <div class="project-actions">
              <button class="project-action-btn" data-action="edit">编辑</button>
              <button class="project-action-btn" data-action="preview">预览</button>
              <button class="project-action-btn" data-action="duplicate">复制</button>
              <button class="project-action-btn" data-action="delete">删除</button>
            </div>
          </div>
        </div>
      `;
    }

    /**
     * 渲染项目列表
     */
    renderProjectsList() {
      return `
        <div class="projects-list">
          ${this.state.projects.map(project => `
            <div class="project-list-item ${this.state.selectedProjects.has(project.id) ? 'selected' : ''}"
                 data-project-id="${project.id}">
              <div class="project-list-content">
                <div class="project-list-main">
                  <input type="checkbox"
                         class="project-checkbox"
                         ${this.state.selectedProjects.has(project.id) ? 'checked' : ''}
                         onclick="event.stopPropagation()" />
                  <div class="project-list-info">
                    <h4 class="project-list-title">${this.escapeHtml(project.title)}</h4>
                    <p class="project-list-description">${this.escapeHtml(project.description || '')}</p>
                    <div class="project-list-meta">
                      <span>${this.formatDate(project.metadata.updatedAt)}</span>
                      <span>${project.category}</span>
                      <span>👁 ${project.metadata.viewCount || 0}</span>
                      <span>❤️ ${project.metadata.likeCount || 0}</span>
                    </div>
                  </div>
                </div>
                <div class="project-list-actions">
                  <button class="project-action-btn" data-action="edit">编辑</button>
                  <button class="project-action-btn" data-action="preview">预览</button>
                  <button class="project-action-btn" data-action="duplicate">复制</button>
                  <button class="project-action-btn" data-action="delete">删除</button>
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      `;
    }

    /**
     * 渲染项目表格
     */
    renderProjectsTable() {
      return `
        <table class="projects-table">
          <thead>
            <tr>
              <th width="40">
                <input type="checkbox" id="select-all-checkbox"
                       ${this.state.selectedProjects.size === this.state.projects.length ? 'checked' : ''} />
              </th>
              <th>项目名称</th>
              <th>分类</th>
              <th>状态</th>
              <th>创建时间</th>
              <th>更新时间</th>
              <th>浏览量</th>
              <th>点赞数</th>
              <th width="200">操作</th>
            </tr>
          </thead>
          <tbody>
            ${this.state.projects.map(project => `
              <tr class="${this.state.selectedProjects.has(project.id) ? 'selected' : ''}"
                  data-project-id="${project.id}">
                <td>
                  <input type="checkbox"
                         class="project-checkbox"
                         ${this.state.selectedProjects.has(project.id) ? 'checked' : ''} />
                </td>
                <td>
                  <div class="project-title-cell">
                    <strong>${this.escapeHtml(project.title)}</strong>
                    ${project.description ? `<br><small>${this.escapeHtml(project.description)}</small>` : ''}
                  </div>
                </td>
                <td>${project.category}</td>
                <td>
                  <span class="project-status ${project.status}">${this.getStatusText(project.status)}</span>
                </td>
                <td>${this.formatDate(project.metadata.createdAt)}</td>
                <td>${this.formatDate(project.metadata.updatedAt)}</td>
                <td>${project.metadata.viewCount || 0}</td>
                <td>${project.metadata.likeCount || 0}</td>
                <td>
                  <div class="project-table-actions">
                    <button class="project-action-btn" data-action="edit">编辑</button>
                    <button class="project-action-btn" data-action="preview">预览</button>
                    <button class="project-action-btn" data-action="duplicate">复制</button>
                    <button class="project-action-btn" data-action="delete">删除</button>
                  </div>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
    }

    /**
     * 渲染分页
     */
    renderPagination() {
      const currentPage = this.state.currentPage;
      const totalPages = this.state.totalPages;

      let paginationHTML = '<div class="pagination">';

      // 上一页按钮
      paginationHTML += `
        <button class="page-btn" ${currentPage === 1 ? 'disabled' : ''}
                data-page="${currentPage - 1}">
          上一页
        </button>
      `;

      // 页码按钮
      const startPage = Math.max(1, currentPage - 2);
      const endPage = Math.min(totalPages, currentPage + 2);

      if (startPage > 1) {
        paginationHTML += `<button class="page-btn" data-page="1">1</button>`;
        if (startPage > 2) {
          paginationHTML += `<span>...</span>`;
        }
      }

      for (let i = startPage; i <= endPage; i++) {
        paginationHTML += `
          <button class="page-btn ${i === currentPage ? 'active' : ''}" data-page="${i}">
            ${i}
          </button>
        `;
      }

      if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
          paginationHTML += `<span>...</span>`;
        }
        paginationHTML += `<button class="page-btn" data-page="${totalPages}">${totalPages}</button>`;
      }

      // 下一页按钮
      paginationHTML += `
        <button class="page-btn" ${currentPage === totalPages ? 'disabled' : ''}
                data-page="${currentPage + 1}">
          下一页
        </button>
      `;

      paginationHTML += '</div>';
      return paginationHTML;
    }

    /**
     * 渲染模板
     */
    renderTemplates() {
      const container = this.getElement('template-grid');
      if (!container) return;

      if (this.state.templates.length === 0) {
        container.innerHTML = '<p>暂无可用模板</p>';
        return;
      }

      container.innerHTML = this.state.templates.map(template => `
        <div class="template-card" data-template-id="${template.id}">
          <div class="template-thumbnail">
            ${this.getCategoryIcon(template.category)}
          </div>
          <div class="template-info">
            <h4 class="template-title">${this.escapeHtml(template.name)}</h4>
            <p class="template-description">${this.escapeHtml(template.description)}</p>
            <div class="template-meta">
              <span>${template.category}</span>
              <span>${template.difficulty}</span>
              <span>${template.estimatedTime}分钟</span>
            </div>
          </div>
        </div>
      `).join('');

      // 添加模板选择事件
      container.addEventListener('click', (e) => {
        const templateCard = e.target.closest('.template-card');
        if (templateCard) {
          this.selectTemplate(templateCard.dataset.templateId);
        }
      });
    }

    /**
     * 切换视图
     */
    switchView(view) {
      this.state.currentView = view;

      // 更新按钮状态
      this.container.querySelectorAll('.view-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.view === view);
      });

      // 重新渲染
      this.renderProjects();

      this.emitEvent('view:changed', { view });
    }

    /**
     * 切换项目选择状态
     */
    toggleProjectSelection(projectId) {
      if (this.state.selectedProjects.has(projectId)) {
        this.state.selectedProjects.delete(projectId);
      } else {
        this.state.selectedProjects.add(projectId);
      }

      this.updateSelectionUI();
    }

    /**
     * 选择所有项目
     */
    selectAllProjects() {
      this.state.projects.forEach(project => {
        this.state.selectedProjects.add(project.id);
      });
      this.updateSelectionUI();
    }

    /**
     * 清除选择
     */
    clearSelection() {
      this.state.selectedProjects.clear();
      this.updateSelectionUI();
    }

    /**
     * 更新选择UI
     */
    updateSelectionUI() {
      const selectedCount = this.state.selectedProjects.size;

      // 更新批量操作栏
      const batchActionsBar = this.components.batchActionsBar;
      if (batchActionsBar) {
        batchActionsBar.classList.toggle('active', selectedCount > 0);
      }

      // 更新选择计数
      const selectedCountEl = this.getElement('selected-count');
      if (selectedCountEl) {
        selectedCountEl.textContent = selectedCount;
      }

      // 更新项目卡片选择状态
      this.container.querySelectorAll('.project-card').forEach(card => {
        const projectId = card.dataset.projectId;
        card.classList.toggle('selected', this.state.selectedProjects.has(projectId));
      });

      // 更新表格选择状态
      this.container.querySelectorAll('.projects-table tbody tr').forEach(row => {
        const projectId = row.dataset.projectId;
        row.classList.toggle('selected', this.state.selectedProjects.has(projectId));
      });

      // 更新全选复选框
      const selectAllCheckbox = this.getElement('select-all-checkbox');
      if (selectAllCheckbox) {
        selectAllCheckbox.checked = selectedCount === this.state.projects.length && this.state.projects.length > 0;
      }

      this.emitEvent('selection:changed', {
        selectedCount,
        selectedProjects: Array.from(this.state.selectedProjects)
      });
    }

    /**
     * 显示创建模态框
     */
    showCreateModal() {
      this.state.currentProject = null;
      this.resetCreateForm();
      this.openModal('create-modal');
    }

    /**
     * 显示编辑模态框
     */
    showEditModal(project) {
      this.state.currentProject = project;
      this.populateEditForm(project);
      this.openModal('edit-modal');
    }

    /**
     * 显示预览模态框
     */
    showPreviewModal(project) {
      this.state.currentProject = project;
      this.renderPreviewContent(project);
      this.openModal('preview-modal');
    }

    /**
     * 打开模态框
     */
    openModal(modalId) {
      const modal = this.container.querySelector(`#${modalId}`);
      if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
      }
    }

    /**
     * 关闭模态框
     */
    closeModal(modalId) {
      const modal = this.container.querySelector(`#${modalId}`);
      if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
      }
    }

    /**
     * 关闭所有模态框
     */
    closeAllModals() {
      this.container.querySelectorAll('.modal').forEach(modal => {
        modal.classList.remove('active');
      });
      document.body.style.overflow = '';
    }

    /**
     * 处理创建项目
     */
    async handleCreateProject() {
      try {
        const formData = this.getCreateFormData();

        // 验证表单数据
        if (!formData.title.trim()) {
          this.showError('错误', '请输入项目名称');
          return;
        }

        // 创建项目
        const project = await global.userDataService?.createProject(formData);

        if (project) {
          this.closeModal('create-modal');
          this.showSuccess('项目创建成功');
          this.refreshProjects();
        }

      } catch (error) {
        console.error('创建项目失败:', error);
        this.showError('创建失败', error.message);
      }
    }

    /**
     * 处理编辑项目
     */
    async handleEditProject() {
      try {
        if (!this.state.currentProject) return;

        const formData = this.getEditFormData();

        // 验证表单数据
        if (!formData.title.trim()) {
          this.showError('错误', '请输入项目名称');
          return;
        }

        // 更新项目
        const updatedProject = await global.userDataService?.updateProject(
          this.state.currentProject.id,
          formData
        );

        if (updatedProject) {
          this.closeModal('edit-modal');
          this.showSuccess('项目更新成功');
          this.refreshProjects();
        }

      } catch (error) {
        console.error('更新项目失败:', error);
        this.showError('更新失败', error.message);
      }
    }

    /**
     * 处理项目操作
     */
    handleProjectAction(project, action) {
      switch (action) {
        case 'edit':
          this.showEditModal(project);
          break;
        case 'preview':
          this.showPreviewModal(project);
          break;
        case 'duplicate':
          this.duplicateProject(project);
          break;
        case 'delete':
          this.deleteProject(project);
          break;
      }
    }

    /**
     * 处理批量操作
     */
    async handleBatchAction(action) {
      const selectedIds = Array.from(this.state.selectedProjects);

      if (selectedIds.length === 0) {
        this.showError('错误', '请先选择项目');
        return;
      }

      try {
        switch (action) {
          case 'delete':
            await this.batchDeleteProjects(selectedIds);
            break;
          case 'move':
            await this.batchMoveProjects(selectedIds);
            break;
          case 'tag':
            await this.batchAddTags(selectedIds);
            break;
          case 'export':
            await this.batchExportProjects(selectedIds);
            break;
        }
      } catch (error) {
        console.error('批量操作失败:', error);
        this.showError('操作失败', error.message);
      }
    }

    /**
     * 删除项目
     */
    async deleteProject(project) {
      if (!confirm(`确定要删除项目"${project.title}"吗？此操作不可恢复。`)) {
        return;
      }

      try {
        await global.userDataService?.deleteProject(project.id);
        this.showSuccess('项目已删除');
        this.refreshProjects();
      } catch (error) {
        console.error('删除项目失败:', error);
        this.showError('删除失败', error.message);
      }
    }

    /**
     * 复制项目
     */
    async duplicateProject(project) {
      try {
        if (global.projectDataService) {
          const clonedProject = await global.projectDataService.cloneProject(
            project.id,
            { title: `${project.title} (副本)` }
          );

          if (clonedProject) {
            this.showSuccess('项目复制成功');
            this.refreshProjects();
          }
        }
      } catch (error) {
        console.error('复制项目失败:', error);
        this.showError('复制失败', error.message);
      }
    }

    /**
     * 批量删除项目
     */
    async batchDeleteProjects(projectIds) {
      if (!confirm(`确定要删除选中的 ${projectIds.length} 个项目吗？此操作不可恢复。`)) {
        return;
      }

      try {
        if (global.projectDataService) {
          const result = await global.projectDataService.batchDeleteProjects(projectIds);

          if (result.successful.length > 0) {
            this.showSuccess(`成功删除 ${result.successful.length} 个项目`);
            this.clearSelection();
            this.refreshProjects();
          }

          if (result.failed.length > 0) {
            this.showError('部分删除失败', `${result.failed.length} 个项目删除失败`);
          }
        }
      } catch (error) {
        console.error('批量删除失败:', error);
        throw error;
      }
    }

    /**
     * 应用过滤器
     */
    async applyFilters() {
      try {
        this.setLoading(true);

        const filters = {
          category: this.state.filters.category === 'all' ? undefined : this.state.filters.category,
          status: this.state.filters.status === 'all' ? undefined : this.state.filters.status,
          search: this.state.filters.searchQuery || undefined
        };

        const result = await global.userDataService?.getUserProjects({
          ...filters,
          page: 1, // 重置到第一页
          sortBy: this.state.sortBy,
          sortOrder: this.state.sortOrder,
          limit: this.options.maxProjectsPerPage
        }) || { projects: [], total: 0, totalPages: 1 };

        this.state.projects = result.projects || [];
        this.state.totalProjects = result.total || 0;
        this.state.totalPages = result.totalPages || 1;
        this.state.currentPage = 1;

        this.renderProjects();

      } catch (error) {
        console.error('应用过滤器失败:', error);
        this.showError('过滤失败', error.message);
      } finally {
        this.setLoading(false);
      }
    }

    /**
     * 应用排序
     */
    async applySorting() {
      try {
        this.setLoading(true);

        const result = await global.userDataService?.getUserProjects({
          category: this.state.filters.category === 'all' ? undefined : this.state.filters.category,
          status: this.state.filters.status === 'all' ? undefined : this.state.filters.status,
          search: this.state.filters.searchQuery || undefined,
          page: this.state.currentPage,
          sortBy: this.state.sortBy,
          sortOrder: this.state.sortOrder,
          limit: this.options.maxProjectsPerPage
        }) || { projects: [], total: 0, totalPages: 1 };

        this.state.projects = result.projects || [];
        this.state.totalProjects = result.total || 0;
        this.state.totalPages = result.totalPages || 1;

        this.renderProjects();

      } catch (error) {
        console.error('应用排序失败:', error);
        this.showError('排序失败', error.message);
      } finally {
        this.setLoading(false);
      }
    }

    /**
     * 刷新项目列表
     */
    async refreshProjects() {
      await this.loadInitialData();
    }

    /**
     * 获取创建表单数据
     */
    getCreateFormData() {
      return {
        title: this.getElement('create-title')?.value || '',
        description: this.getElement('create-description')?.value || '',
        category: this.getElement('create-category')?.value || 'mathematics',
        type: this.getElement('create-type')?.value || 'visualization',
        tags: this.parseTags(this.getElement('create-tags')?.value || '')
      };
    }

    /**
     * 获取编辑表单数据
     */
    getEditFormData() {
      return {
        title: this.getElement('edit-title')?.value || '',
        description: this.getElement('edit-description')?.value || '',
        category: this.getElement('edit-category')?.value || 'mathematics',
        status: this.getElement('edit-status')?.value || 'draft',
        tags: this.parseTags(this.getElement('edit-tags')?.value || '')
      };
    }

    /**
     * 解析标签
     */
    parseTags(tagsString) {
      if (!tagsString.trim()) return [];

      return tagsString.split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);
    }

    /**
     * 重置创建表单
     */
    resetCreateForm() {
      this.getElement('create-title').value = '';
      this.getElement('create-description').value = '';
      this.getElement('create-category').value = 'mathematics';
      this.getElement('create-type').value = 'visualization';
      this.getElement('create-tags').value = '';
    }

    /**
     * 填充编辑表单
     */
    populateEditForm(project) {
      this.getElement('edit-title').value = project.title || '';
      this.getElement('edit-description').value = project.description || '';
      this.getElement('edit-category').value = project.category || 'mathematics';
      this.getElement('edit-status').value = project.status || 'draft';
      this.getElement('edit-tags').value = project.tags ? project.tags.join(', ') : '';
    }

    /**
     * 渲染预览内容
     */
    renderPreviewContent(project) {
      const container = this.getElement('preview-content');
      if (!container) return;

      container.innerHTML = `
        <div class="project-preview">
          <div class="preview-header">
            <h2>${this.escapeHtml(project.title)}</h2>
            <div class="preview-meta">
              <span class="preview-category">${project.category}</span>
              <span class="preview-status ${project.status}">${this.getStatusText(project.status)}</span>
            </div>
          </div>

          <div class="preview-description">
            <p>${this.escapeHtml(project.description || '暂无描述')}</p>
          </div>

          <div class="preview-stats">
            <div class="stat-item">
              <span class="stat-label">创建时间</span>
              <span class="stat-value">${this.formatDate(project.metadata.createdAt)}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">更新时间</span>
              <span class="stat-value">${this.formatDate(project.metadata.updatedAt)}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">浏览量</span>
              <span class="stat-value">${project.metadata.viewCount || 0}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">点赞数</span>
              <span class="stat-value">${project.metadata.likeCount || 0}</span>
            </div>
          </div>

          <div class="preview-tags">
            <h4>标签</h4>
            <div class="tags-list">
              ${project.tags.map(tag => `<span class="project-tag">${this.escapeHtml(tag)}</span>`).join('')}
            </div>
          </div>
        </div>
      `;
    }

    /**
     * 选择模板
     */
    selectTemplate(templateId) {
      // 切换选中状态
      this.container.querySelectorAll('.template-card').forEach(card => {
        card.classList.toggle('selected', card.dataset.templateId === templateId);
      });

      // 这里可以存储选中的模板ID
      this.state.selectedTemplate = templateId;
    }

    /**
     * 拖拽开始
     */
    handleDragStart(e, projectCard) {
      this.dragState.isDragging = true;
      this.dragState.draggedProject = projectCard.dataset.projectId;
      projectCard.classList.add('dragging');
      e.dataTransfer.effectAllowed = 'move';
    }

    /**
     * 拖拽结束
     */
    handleDragEnd(e) {
      this.dragState.isDragging = false;
      this.dragState.draggedProject = null;
      this.dragState.dropTarget = null;

      this.container.querySelectorAll('.project-card').forEach(card => {
        card.classList.remove('dragging');
      });
    }

    /**
     * 拖拽经过
     */
    handleDragOver(e) {
      if (!this.dragState.isDragging) return;

      const projectCard = e.target.closest('.project-card');
      if (projectCard && projectCard.dataset.projectId !== this.dragState.draggedProject) {
        projectCard.style.borderTop = '3px solid var(--primary-color, #007bff)';
        this.dragState.dropTarget = projectCard.dataset.projectId;
      }
    }

    /**
     * 放置
     */
    handleDrop(e) {
      e.preventDefault();

      if (this.dragState.isDragging && this.dragState.dropTarget) {
        // 这里可以实现项目重新排序的逻辑
        console.log(`移动项目 ${this.dragState.draggedProject} 到 ${this.dragState.dropTarget}`);
      }

      // 清理样式
      this.container.querySelectorAll('.project-card').forEach(card => {
        card.style.borderTop = '';
      });
    }

    /**
     * 设置加载状态
     */
    setLoading(isLoading) {
      this.state.isLoading = isLoading;

      const container = this.components.projectsContainer;
      if (container) {
        if (isLoading) {
          container.innerHTML = `
            <div class="loading-spinner">
              <div class="spinner"></div>
            </div>
          `;
        }
      }
    }

    /**
     * 应用初始状态
     */
    applyInitialState() {
      // 设置初始视图
      this.switchView(this.state.currentView);
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
    showError(title, message) {
      this.showToast(`${title}: ${message}`, 'error');
    }

    /**
     * 显示提示消息
     */
    showToast(message, type = 'info') {
      const toast = document.createElement('div');
      toast.className = `toast toast-${type}`;
      toast.textContent = message;

      // 添加样式
      Object.assign(toast.style, {
        position: 'fixed',
        top: '20px',
        right: '20px',
        padding: '12px 20px',
        borderRadius: '6px',
        color: 'white',
        fontWeight: '500',
        zIndex: '9999',
        opacity: '0',
        transform: 'translateX(100%)',
        transition: 'all 0.3s ease'
      });

      // 设置背景色
      switch (type) {
        case 'success':
          toast.style.backgroundColor = '#28a745';
          break;
        case 'error':
          toast.style.backgroundColor = '#dc3545';
          break;
        default:
          toast.style.backgroundColor = '#007bff';
      }

      document.body.appendChild(toast);

      // 显示动画
      setTimeout(() => {
        toast.style.opacity = '1';
        toast.style.transform = 'translateX(0)';
      }, 10);

      // 自动移除
      setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100%)';
        setTimeout(() => {
          if (toast.parentNode) {
            toast.parentNode.removeChild(toast);
          }
        }, 300);
      }, 3000);
    }

    /**
     * 获取分类图标
     */
    getCategoryIcon(category) {
      const icons = {
        mathematics: '📐',
        astronomy: '🌌',
        physics: '⚛️',
        chemistry: '🧪'
      };
      return icons[category] || '📊';
    }

    /**
     * 获取状态文本
     */
    getStatusText(status) {
      const statusTexts = {
        draft: '草稿',
        published: '已发布',
        archived: '已归档'
      };
      return statusTexts[status] || status;
    }

    /**
     * 工具方法：获取元素
     */
    getElement(id) {
      return this.container.querySelector(`#${id}`);
    }

    /**
     * 工具方法：生成ID
     */
    generateId() {
      return 'pm_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    /**
     * 工具方法：HTML转义
     */
    escapeHtml(text) {
      const div = document.createElement('div');
      div.textContent = text;
      return div.innerHTML;
    }

    /**
     * 工具方法：格式化日期
     */
    formatDate(timestamp) {
      const date = new Date(timestamp);
      return date.toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    }

    /**
     * 发送事件
     */
    emitEvent(eventName, data = {}) {
      const event = new CustomEvent(`manager:${eventName}`, { detail: data });
      this.container.dispatchEvent(event);
    }

    /**
     * 监听事件
     */
    on(eventName, callback) {
      this.container.addEventListener(`manager:${eventName}`, callback);
      return this;
    }

    /**
     * 移除事件监听
     */
    off(eventName, callback) {
      this.container.removeEventListener(`manager:${eventName}`, callback);
      return this;
    }

    /**
     * 获取当前状态
     */
    getState() {
      return { ...this.state };
    }

    /**
     * 销毁组件
     */
    destroy() {
      // 清理事件监听器
      this.eventListeners.forEach((listener, element) => {
        element.removeEventListener(listener.type, listener.callback);
      });
      this.eventListeners.clear();

      // 清理内容
      this.container.innerHTML = '';

      console.log('ProjectManager 已销毁');
    }
  }

  // 导出到全局
  global.ProjectManager = ProjectManager;

})(window);