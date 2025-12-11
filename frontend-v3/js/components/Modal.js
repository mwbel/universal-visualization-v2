/**
 * 模态框组件
 */
export class Modal {
  constructor({ title, content, onClose, options = {} }) {
    this.title = title;
    this.content = content;
    this.onClose = onClose;
    this.options = {
      width: '500px',
      height: 'auto',
      closable: true,
      ...options
    };

    // DOM元素
    this.modalElement = null;
    this.overlayElement = null;
    this.isOpen = false;

    this.init();
  }

  /**
   * 初始化模态框
   */
  init() {
    this.createModal();
    this.bindEvents();
  }

  /**
   * 创建模态框元素
   */
  createModal() {
    // 创建遮罩层
    this.overlayElement = document.createElement('div');
    this.overlayElement.className = 'modal-overlay';
    this.overlayElement.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(0, 0, 0, 0.5);
      display: none;
      justify-content: center;
      align-items: center;
      z-index: 1000;
    `;

    // 创建模态框
    this.modalElement = document.createElement('div');
    this.modalElement.className = 'modal';
    this.modalElement.style.cssText = `
      background: white;
      border-radius: 8px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
      max-width: 90vw;
      max-height: 90vh;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      width: ${this.options.width};
      height: ${this.options.height};
    `;

    this.modalElement.innerHTML = `
      <div class="modal-header" style="
        padding: 16px 20px;
        border-bottom: 1px solid #e5e7eb;
        display: flex;
        justify-content: space-between;
        align-items: center;
        background: #f9fafb;
      ">
        <h3 style="margin: 0; font-size: 18px; font-weight: 600;">${this.title}</h3>
        ${this.options.closable ? '<button class="modal-close" style="background: none; border: none; font-size: 20px; cursor: pointer; padding: 4px;">×</button>' : ''}
      </div>
      <div class="modal-content" style="
        padding: 20px;
        flex: 1;
        overflow-y: auto;
      ">
        ${this.content}
      </div>
    `;

    this.overlayElement.appendChild(this.modalElement);
  }

  /**
   * 绑定事件
   */
  bindEvents() {
    // 关闭按钮点击
    const closeBtn = this.modalElement.querySelector('.modal-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        this.close();
      });
    }

    // 遮罩层点击
    this.overlayElement.addEventListener('click', (e) => {
      if (e.target === this.overlayElement) {
        this.close();
      }
    });

    // ESC键关闭
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen) {
        this.close();
      }
    });
  }

  /**
   * 显示模态框
   */
  show() {
    if (this.isOpen) return;

    this.overlayElement.style.display = 'flex';
    document.body.appendChild(this.overlayElement);
    this.isOpen = true;

    // 焦点管理
    const focusableElements = this.modalElement.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    if (focusableElements.length > 0) {
      focusableElements[0].focus();
    }
  }

  /**
   * 关闭模态框
   */
  close() {
    if (!this.isOpen) return;

    this.overlayElement.style.display = 'none';
    if (this.overlayElement.parentNode) {
      this.overlayElement.parentNode.removeChild(this.overlayElement);
    }
    this.isOpen = false;

    // 回调
    if (this.onClose) {
      this.onClose();
    }
  }

  /**
   * 更新内容
   */
  updateContent(newContent) {
    this.content = newContent;
    const contentElement = this.modalElement.querySelector('.modal-content');
    if (contentElement) {
      contentElement.innerHTML = newContent;
    }
  }

  /**
   * 更新标题
   */
  updateTitle(newTitle) {
    this.title = newTitle;
    const titleElement = this.modalElement.querySelector('.modal-header h3');
    if (titleElement) {
      titleElement.textContent = newTitle;
    }
  }

  /**
   * 检查是否打开
   */
  isModalOpen() {
    return this.isOpen;
  }

  /**
   * 销毁组件
   */
  destroy() {
    this.close();
    this.overlayElement = null;
    this.modalElement = null;
  }
}

/**
 * 设置模态框
 */
export class SettingsModal extends Modal {
  constructor({ onClose, settings = {} }) {
    const content = `
      <div class="settings-form">
        <div class="setting-group">
          <label>主题</label>
          <select name="theme" class="form-select">
            <option value="auto">自动</option>
            <option value="light">浅色</option>
            <option value="dark">深色</option>
          </select>
        </div>
        <div class="setting-group">
          <label>语言</label>
          <select name="language" class="form-select">
            <option value="zh-CN">简体中文</option>
            <option value="en">English</option>
          </select>
        </div>
        <div class="setting-group">
          <label>字体大小</label>
          <select name="fontSize" class="form-select">
            <option value="small">小</option>
            <option value="medium">中</option>
            <option value="large">大</option>
          </select>
        </div>
        <div class="setting-actions">
          <button class="btn btn-primary">保存设置</button>
          <button class="btn btn-secondary">取消</button>
        </div>
      </div>
    `;

    super({ title: '设置', content, onClose });

    this.initSettingsForm();
  }

  /**
   * 初始化设置表单
   */
  initSettingsForm() {
    const form = this.modalElement.querySelector('.settings-form');
    if (!form) return;

    // 保存按钮
    const saveBtn = form.querySelector('.btn-primary');
    if (saveBtn) {
      saveBtn.addEventListener('click', () => {
        this.saveSettings();
      });
    }

    // 取消按钮
    const cancelBtn = form.querySelector('.btn-secondary');
    if (cancelBtn) {
      cancelBtn.addEventListener('click', () => {
        this.close();
      });
    }
  }

  /**
   * 保存设置
   */
  saveSettings() {
    const form = this.modalElement.querySelector('.settings-form');
    if (!form) return;

    const formData = new FormData(form);
    const settings = {
      theme: formData.get('theme'),
      language: formData.get('language'),
      fontSize: formData.get('fontSize')
    };

    // 这里可以调用保存设置的API
    console.log('保存设置:', settings);

    this.close();
  }
}