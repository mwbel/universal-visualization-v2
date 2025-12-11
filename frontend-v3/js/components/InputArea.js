/**
 * 输入区域组件
 */
export class InputArea {
  constructor({ apiClient, onSendMessage, onAttachFile }) {
    this.apiClient = apiClient;
    this.onSendMessage = onSendMessage;
    this.onAttachFile = onAttachFile;

    this.inputElement = null;
    this.sendButton = null;
    this.charCount = null;
    this.modelSelector = null;
    this.maxLength = 5000;

    this.init();
  }

  /**
   * 初始化输入区域
   */
  init() {
    this.inputElement = document.getElementById('messageInput');
    this.sendButton = document.getElementById('sendBtn');
    this.charCount = document.getElementById('charCount');
    this.modelSelector = document.getElementById('modelSelector');

    this.bindEvents();
    this.updateCharCount();
    this.initModelSelector();
  }

  initModelSelector() {
    if (this.modelSelector && this.apiClient) {
      // 初始化值
      this.syncSelectorValue();

      // 监听变更
      this.modelSelector.addEventListener('change', (e) => {
        const value = e.target.value;
        const [provider, model] = value.split(':');
        
        if (provider && model) {
          this.apiClient.config.mode = provider;
          this.apiClient.config.models[provider] = model;
          
          // 保存配置到 localStorage
          localStorage.setItem('visualization_llm_config', JSON.stringify(this.apiClient.config));
          
          // 触发事件通知其他组件（如 SettingsModal）
          window.dispatchEvent(new CustomEvent('config-updated', { detail: this.apiClient.config }));
        }
      });

      // 监听外部配置变更
      window.addEventListener('open-settings-modal', () => {
        this.syncSelectorValue();
      });

      // 监听配置更新事件 (来自 SettingsModal)
      window.addEventListener('config-updated', (e) => {
        this.syncSelectorValue();
      });
    }
  }

  syncSelectorValue() {
    if (!this.modelSelector || !this.apiClient) return;
    
    const config = this.apiClient.config;
    const currentMode = config.mode;
    const currentModel = config.models[currentMode] || '';
    
    // 构造当前选中的组合值
    const selectedValue = currentMode === 'mock' ? 'mock:mock' : `${currentMode}:${currentModel}`;
    
    // 尝试选中
    if (this.modelSelector.querySelector(`option[value="${selectedValue}"]`)) {
      this.modelSelector.value = selectedValue;
    } else {
      // Fallback: 如果具体模型不在列表中，尝试选中该 provider 的第一个选项
      const firstOption = this.modelSelector.querySelector(`option[value^="${currentMode}:"]`);
      if (firstOption) {
        this.modelSelector.value = firstOption.value;
        // 同时更新 config 以保持一致 (可选)
        const [_, model] = firstOption.value.split(':');
        this.apiClient.config.models[currentMode] = model;
      }
    }
  }

  /**
   * 绑定事件
   */
  bindEvents() {
    if (!this.inputElement) return;

    // 输入事件
    this.inputElement.addEventListener('input', () => {
      this.handleInput();
    });

    // 键盘事件
    this.inputElement.addEventListener('keydown', (e) => {
      this.handleKeyDown(e);
    });

    // 粘贴事件
    this.inputElement.addEventListener('paste', (e) => {
      this.handlePaste(e);
    });

    // 发送按钮事件
    if (this.sendButton) {
      this.sendButton.addEventListener('click', () => {
        this.sendMessage();
      });
    }

    // 自动调整高度
    this.inputElement.addEventListener('input', () => {
      this.adjustHeight();
    });

    // 附件按钮
    const attachBtn = document.getElementById('attachBtn');
    if (attachBtn) {
      attachBtn.addEventListener('click', () => {
        this.handleFileAttach();
      });
    }
  }

  /**
   * 处理输入
   */
  handleInput() {
    this.updateCharCount();
    this.updateSendButtonState();
    this.adjustHeight();
  }

  /**
   * 处理键盘事件
   */
  handleKeyDown(event) {
    // 检查是否正在输入中文 (composing)
    if (event.isComposing) {
      return;
    }

    // Enter 键 (无 Shift/Ctrl/Meta) -> 发送
    if (event.key === 'Enter' && !event.shiftKey && !event.ctrlKey && !event.metaKey) {
      event.preventDefault();
      this.sendMessage();
    }

    // Ctrl+Enter 或 Cmd+Enter -> 也可以发送 (保持兼容)
    else if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
      event.preventDefault();
      this.sendMessage();
    }
    
    // Shift+Enter -> 默认换行 (无需处理)

    // Esc 键清空输入
    else if (event.key === 'Escape') {
      this.clearInput();
    }
  }

  /**
   * 处理粘贴事件
   */
  handlePaste(event) {
    // 处理文件粘贴
    const items = event.clipboardData?.items;
    if (items) {
      for (let i = 0; i < items.length; i++) {
        if (items[i].kind === 'file') {
          const file = items[i].getAsFile();
          if (file) {
            event.preventDefault();
            this.onAttachFile(file);
            return;
          }
        }
      }
    }
  }

  /**
   * 发送消息
   */
  async sendMessage() {
    const content = this.getValue().trim();

    if (!content) {
      return;
    }

    // 禁用发送按钮
    this.setSendButtonState(false);
    this.inputElement.disabled = true;

    try {
      await this.onSendMessage(content);
      this.clearInput();
    } catch (error) {
      console.error('Failed to send message:', error);
      this.showToast('消息发送失败，请重试');
    } finally {
      // 重新启用发送按钮
      this.setSendButtonState(true);
      this.inputElement.disabled = false;
      this.inputElement.focus();
    }
  }

  /**
   * 处理文件附件
   */
  handleFileAttach() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*,.pdf,.txt,.json,.csv,.md';
    input.multiple = false;

    input.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        this.onAttachFile(file);
      }
    });

    input.click();
  }

  /**
   * 更新字符计数
   */
  updateCharCount() {
    if (!this.charCount) return;

    const length = this.getValue().length;
    this.charCount.textContent = `${length} / ${this.maxLength}`;

    // 超过限制时显示警告颜色
    if (length > this.maxLength * 0.9) {
      this.charCount.style.color = 'var(--text-tertiary)';
    } else {
      this.charCount.style.color = 'var(--text-tertiary)';
    }

    if (length >= this.maxLength) {
      this.charCount.style.color = 'var(--accent-color)';
      this.charCount.style.fontWeight = '600';
    } else {
      this.charCount.style.fontWeight = 'normal';
    }
  }

  /**
   * 更新发送按钮状态
   */
  updateSendButtonState() {
    const hasContent = this.getValue().trim().length > 0;
    this.setSendButtonState(hasContent);
  }

  /**
   * 设置发送按钮状态
   */
  setSendButtonState(enabled) {
    if (!this.sendButton) return;

    this.sendButton.disabled = !enabled;
    this.sendButton.classList.toggle('disabled', !enabled);
  }

  /**
   * 自动调整输入框高度
   */
  adjustHeight() {
    if (!this.inputElement) return;

    // 重置高度
    this.inputElement.style.height = 'auto';

    // 计算新高度
    const scrollHeight = this.inputElement.scrollHeight;
    const maxHeight = 120; // 最大高度

    if (scrollHeight > maxHeight) {
      this.inputElement.style.height = `${maxHeight}px`;
      this.inputElement.style.overflowY = 'auto';
    } else {
      this.inputElement.style.height = `${scrollHeight}px`;
      this.inputElement.style.overflowY = 'hidden';
    }
  }

  /**
   * 清空输入
   */
  clearInput() {
    if (this.inputElement) {
      this.inputElement.value = '';
      this.inputElement.style.height = 'auto';
      this.inputElement.style.overflowY = 'hidden';
      this.updateCharCount();
      this.updateSendButtonState();
    }
  }

  /**
   * 获取输入值
   */
  getValue() {
    return this.inputElement ? this.inputElement.value : '';
  }

  /**
   * 设置输入值
   */
  setValue(value) {
    if (this.inputElement) {
      this.inputElement.value = value;
      this.handleInput();
      this.adjustHeight();
    }
  }

  /**
   * 设置占位符
   */
  setPlaceholder(placeholder) {
    if (this.inputElement) {
      this.inputElement.placeholder = placeholder;
    }
  }

  /**
   * 获取焦点
   */
  focus() {
    if (this.inputElement) {
      this.inputElement.focus();
    }
  }

  /**
   * 设置最大长度
   */
  setMaxLength(maxLength) {
    this.maxLength = maxLength;
    if (this.inputElement) {
      this.inputElement.maxLength = maxLength;
    }
    this.updateCharCount();
  }

  /**
   * 显示提示消息
   */
  showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    toast.style.cssText = `
      position: fixed;
      bottom: 120px;
      left: 50%;
      transform: translateX(-50%);
      background: var(--bg-tertiary);
      color: var(--text-primary);
      padding: 8px 16px;
      border-radius: var(--border-radius);
      box-shadow: var(--shadow-md);
      z-index: 1000;
      opacity: 0;
      transition: opacity 0.3s ease;
    `;

    document.body.appendChild(toast);

    // 触发动画
    setTimeout(() => {
      toast.style.opacity = '1';
    }, 100);

    // 自动移除
    setTimeout(() => {
      toast.style.opacity = '0';
      setTimeout(() => {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
      }, 300);
    }, 2000);
  }

  /**
   * 获取输入统计
   */
  getStats() {
    return {
      length: this.getValue().length,
      maxLength: this.maxLength,
      remaining: this.maxLength - this.getValue().length,
      isOverLimit: this.getValue().length > this.maxLength
    };
  }

  /**
   * 销毁组件
   */
  destroy() {
    // 移除事件监听器
    if (this.inputElement) {
      this.inputElement.removeEventListener('input', this.handleInput);
      this.inputElement.removeEventListener('keydown', this.handleKeyDown);
      this.inputElement.removeEventListener('paste', this.handlePaste);
    }

    if (this.sendButton) {
      this.sendButton.removeEventListener('click', this.sendMessage);
    }

    // 清空引用
    this.inputElement = null;
    this.sendButton = null;
    this.charCount = null;
  }
}