/**
 * 聊天区域组件
 */
export class ChatArea {
  constructor({ stateManager, apiClient, onSendMessage, onQuickAction }) {
    this.stateManager = stateManager;
    this.apiClient = apiClient;
    this.onSendMessage = onSendMessage;
    this.onQuickAction = onQuickAction;

    this.messagesContainer = null;
    this.welcomeScreen = null;
    this.loadingIndicator = null;

    this.init();
  }

  /**
   * 初始化聊天区域
   */
  init() {
    this.messagesContainer = document.getElementById('messageContainer');
    this.welcomeScreen = document.getElementById('welcomeScreen');
    this.loadingIndicator = document.getElementById('loadingIndicator');

    this.bindEvents();
  }

  /**
   * 绑定事件
   */
  bindEvents() {
    // 快速操作按钮
    const actionCards = document.querySelectorAll('.action-card');
    actionCards.forEach(card => {
      card.addEventListener('click', () => {
        const template = card.dataset.template;
        this.onQuickAction(template);
      });
    });

    // 监听当前对话变化
    this.stateManager.subscribe('currentConversation', (conversation) => {
      if (conversation && conversation.messages.length > 0) {
        this.loadMessages(conversation.messages);
        this.hideWelcomeScreen();
      } else {
        this.clearMessages();
        this.showWelcomeScreen();
      }
    });
  }

  /**
   * 显示欢迎界面
   */
  showWelcomeScreen() {
    if (this.welcomeScreen) {
      this.welcomeScreen.style.display = 'flex';
    }
    if (this.messagesContainer) {
      this.messagesContainer.style.display = 'none';
    }
  }

  /**
   * 隐藏欢迎界面
   */
  hideWelcomeScreen() {
    if (this.welcomeScreen) {
      this.welcomeScreen.style.display = 'none';
    }
    if (this.messagesContainer) {
      this.messagesContainer.style.display = 'block';
    }
  }

  /**
   * 清空消息
   */
  clearMessages() {
    if (this.messagesContainer) {
      this.messagesContainer.innerHTML = '';
    }
  }

  /**
   * 加载消息
   */
  loadMessages(messages) {
    this.clearMessages();

    if (!this.messagesContainer || !messages.length) {
      return;
    }

    messages.forEach(message => {
      this.addMessage(message, false);
    });

    // 滚动到底部
    this.scrollToBottom();
  }

  /**
   * 添加消息
   */
  addMessage(message, scroll = true) {
    if (!this.messagesContainer) return;
    
    console.log('ChatArea: addMessage', message.id, typeof message.content, message.content);

    const messageElement = this.createMessageElement(message);
    this.messagesContainer.appendChild(messageElement);

    if (scroll) {
      this.scrollToBottom();
    }
  }

  /**
   * 创建消息元素
   */
  createMessageElement(message) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${message.role}`;
    messageDiv.dataset.id = message.id;

    const isUser = message.role === 'user';

    messageDiv.innerHTML = `
      <div class="message-header">
        <div class="message-avatar ${isUser ? 'user' : 'assistant'}">
          ${isUser ? '👤' : '🤖'}
        </div>
        <div class="message-author">${isUser ? '我' : 'AI助手'}</div>
        <div class="message-time">${this.formatTime(message.timestamp)}</div>
      </div>
      <div class="message-content">
        ${this.formatMessageContent(message.content)}
      </div>
      <div class="message-actions">
        <button class="message-action-btn" data-action="copy" title="复制">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M16 1H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V3c0-1.1-.9-2-2-2zm-1 12H5V4h10v11z"/>
          </svg>
        </button>
        <button class="message-action-btn" data-action="regenerate" title="重新生成">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 4V1L8 5l3.65 3.65c.2.2.2.51 0 .71L8 12l3.65 3.65c.2.2.2.51 0 .71L12 12V9c4.42 0 8 3.58 8 8s-3.58 8-8 8z"/>
          </svg>
        </button>
        <button class="message-action-btn" data-action="share" title="分享">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7v-2.77c0-.65-.22-1.26-.58-1.76l2.76-2.02c.51-.38 1.11-.58 1.76-.58.59 0 1.16.17 1.66.46l3.19 2.32c.51.37.83.98.83 1.65V16c0 .1 0 .2-.01.3zm-.8-2.08V9.96L14.08 11.3c-.31-.23-.64-.43-.99-.59l-.28.09c-.08-.02-.16-.04-.24-.04-.41 0-.82.05-1.21.14l-2.54 1.86c-.35.26-.59.63-.67 1.03-.06.31-.06.64.02.93l2.46 1.79c.39.29.86.47 1.33.47.15 0 .3-.02.44-.05l.3-.08c.06-.02.12-.04.18-.04.44 0 .88.1 1.29.28l2.54 1.85c.35.26.59.63.67 1.03.04.26.01.53-.1.77l-2.46-1.78z"/>
          </svg>
        </button>
      </div>
    `;

    // 绑定消息操作按钮
    const actionButtons = messageDiv.querySelectorAll('.message-action-btn');
    actionButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.handleMessageAction(btn.dataset.action, message);
      });
    });

    // 绑定可视化操作按钮
    if (!isUser && typeof message.content === 'object' && message.content.type === 'visualization') {
      console.log('Detected visualization content, binding events');
      messageDiv.classList.add('has-visualization');
      this.bindVisualizationEvents(messageDiv, message.content);
    }

    return messageDiv;
  }

  /**
   * 格式化消息内容
   */
  formatMessageContent(content) {
    if (content === undefined || content === null) {
      return '生成可视化中...';
    }
    if (typeof content === 'string') {
      // 处理代码块
      content = content.replace(/```([\s\S]*?)```/g, (match, code) => {
        const language = this.detectLanguage(code);
        return `<div class="code-block">
          <div class="code-header">
            <span class="code-language">${language}</span>
            <button class="code-copy-btn">复制</button>
          </div>
          <div class="code-content"><pre><code>${this.escapeHtml(code)}</code></pre></div>
        </div>`;
      });

      // 处理行内代码
      content = content.replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>');

      // 处理链接
      content = content.replace(
        /(https?:\/\/[^\s]+)/g,
        '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>'
      );

      // 处理换行
      content = content.replace(/\n/g, '<br>');

      return content;
    }

    // 处理复杂内容对象
    if (typeof content === 'object') {
      return this.formatComplexContent(content);
    }

    return this.escapeHtml(String(content));
  }

  /**
   * 检测代码语言
   */
  detectLanguage(code) {
    const firstLine = code.split('\n')[0].toLowerCase();

    if (firstLine.includes('python')) return 'Python';
    if (firstLine.includes('javascript')) return 'JavaScript';
    if (firstLine.includes('java')) return 'Java';
    if (firstLine.includes('css')) return 'CSS';
    if (firstLine.includes('html')) return 'HTML';
    if (firstLine.includes('sql')) return 'SQL';
    if (firstLine.includes('json')) return 'JSON';

    return 'Code';
  }

  /**
   * 格式化复杂内容
   */
  formatComplexContent(content) {
    if (content.type === 'visualization') {
      let paramsHtml = '';
      if (content.parameters && Object.keys(content.parameters).length > 0) {
        const params = Object.entries(content.parameters).map(([key, value]) => {
          const isNumber = typeof value === 'number';
          if (!isNumber) return '';
          // 简易推断范围: 默认 0-2倍值，或 0-100
          const min = value < 0 ? value * 2 : 0;
          const max = value === 0 ? 10 : value * 2;
          const step = (max - min) / 100 || 0.1;
          
          return `
            <div class="param-item">
              <label>${key}</label>
              <div class="range-container">
                <input type="range" class="param-slider" data-key="${key}" 
                  min="${min}" max="${max}" step="${step}" value="${value}">
                <span class="param-value">${value.toFixed(2)}</span>
              </div>
            </div>`;
        }).join('');
        
        if (params) {
          paramsHtml = `
            <div class="visualization-parameters">
              <div class="param-header">交互参数</div>
              <div class="param-list">${params}</div>
            </div>`;
        }
      }

      return `<div class="visualization-container">
        <div class="visualization-header">
          <span class="visualization-title">${content.title || '可视化'}</span>
          <div class="visualization-actions">
            ${content.visualization_type === 'dynamic_generated' ? `
            <button class="visualization-action-btn" data-action="ai-optimize" title="使用 AI 优化 (需配置 Key)">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20,6H4V4H20V6M20,18V20H4V18H20M20,11H4V13H20V11Z"/>
                <!-- Magic/Sparkle icon simplified -->
                <path d="M19,10.5L21,9L19,7.5L17.5,9L19,10.5M12.5,4.5L14,2.5L15.5,4.5L17.5,6L15.5,7.5L14,9.5L12.5,7.5L10.5,6L12.5,4.5M6,10.5L8,9L6,7.5L4.5,9L6,10.5Z" transform="translate(0, 5) scale(0.8)"/>
              </svg>
            </button>` : ''}
            <button class="visualization-action-btn" data-action="open-new" title="在新页面打开">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 19H5V5h7V3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14c1.1 0 2-.9 2-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z"/>
              </svg>
            </button>
            <button class="visualization-action-btn" data-action="fullscreen" title="全屏">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M7 14H5v5h14V7M5 10h2m7 0h7M5 21h14"/>
              </svg>
            </button>
            <button class="visualization-action-btn" data-action="download" title="下载HTML">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
            </button>
          </div>
        </div>
        <div class="visualization-content">
          <!-- iframe will be injected here -->
        </div>
        ${paramsHtml}
      </div>`;
    }

    return JSON.stringify(content, null, 2);
  }

  /**
   * 绑定可视化交互事件
   */
  bindVisualizationEvents(container, content) {
    try {
      console.log('bindVisualizationEvents called', content);
      // 确保HTML包含字符集声明
      let htmlContent = content.html || '';
      console.log('HTML content length:', htmlContent.length);
      
      // 注入错误处理和调试脚本
      const debugScript = `
        <script>
          window.onerror = function(msg, url, line, col, error) {
            console.error('Visualization Error:', msg, 'at line', line);
            const plotDiv = document.getElementById('plot');
            if (plotDiv) {
              plotDiv.innerHTML += '<div style="color:red;padding:10px;border:1px solid red;margin-top:10px;">Error: ' + msg + '</div>';
            }
          };
          window.addEventListener('load', function() {
            if (typeof Plotly === 'undefined' && document.querySelector('script[src*="plotly"]')) {
               console.error('Plotly failed to load');
               const plotDiv = document.getElementById('plot');
               if (plotDiv) {
                 plotDiv.innerHTML = '<div style="color:red;padding:20px;">Error: Visualization library (Plotly) failed to load. Please check your internet connection.</div>';
               }
            }
          });
        </script>
      `;
      // 注入 debugScript
      if (htmlContent) {
        if (htmlContent.includes('<head>')) {
          htmlContent = htmlContent.replace('<head>', '<head>' + debugScript);
        } else {
          htmlContent = debugScript + htmlContent;
        }
      } else {
        console.warn('Visualization content is empty');
        const vizContent = container.querySelector('.visualization-content');
        if (vizContent) {
          vizContent.innerHTML = '<div style="color: #ef4444; padding: 20px;">可视化内容为空</div>';
        }
        return;
      }

      if (htmlContent && !htmlContent.toLowerCase().includes('<meta charset')) {
        if (htmlContent.toLowerCase().includes('<html')) {
          // 如果有html标签但没charset，插入head
          htmlContent = htmlContent.replace('<head>', '<head><meta charset="UTF-8">');
        } else {
          // 如果是片段，包裹完整结构
          htmlContent = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>
  body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; }
</style>
</head>
<body>
${htmlContent}
</body>
</html>`;
        }
      }

      // 注入iframe
      const vizContent = container.querySelector('.visualization-content');
      if (vizContent && htmlContent) {
        console.log('Creating blob from HTML content of length:', htmlContent.length);
        const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        console.log('Created blob URL:', url);
        
        const iframe = document.createElement('iframe');
        iframe.className = 'visualization-iframe';
        // 移除 sandbox 以排除权限问题，或者添加 allow-modals allow-orientation-lock 等
        // iframe.sandbox = 'allow-scripts allow-same-origin allow-forms allow-popups'; 
        iframe.src = url;
        
        vizContent.innerHTML = '';
        vizContent.appendChild(iframe);
        
        iframe.onload = () => {
          console.log('Iframe loaded successfully');
        };
        
        // 监听iframe加载错误
        iframe.onerror = () => {
          console.error('Iframe failed to load');
          vizContent.innerHTML = '<div style="color: #ef4444; padding: 20px;">可视化加载失败</div>';
        };
      }

      const btns = container.querySelectorAll('.visualization-action-btn');
      btns.forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const action = btn.dataset.action;
          
          if (action === 'open-new') {
            const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            window.open(url, '_blank');
          } else if (action === 'ai-optimize') {
            this.onSendMessage(`请使用 AI 模型重新生成可视化：${content.title}`);
          } else if (action === 'download') {
            const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${content.title || 'visualization'}.html`;
            a.click();
            URL.revokeObjectURL(url);
          } else if (action === 'fullscreen') {
            const vizContent = container.querySelector('.visualization-content');
            if (vizContent) {
              if (!document.fullscreenElement) {
                vizContent.requestFullscreen().catch(err => {
                  console.error(`Error attempting to enable full-screen mode: ${err.message}`);
                });
              } else {
                document.exitFullscreen();
              }
            }
          }
        });
      });

      // 绑定参数滑动条
      const sliders = container.querySelectorAll('.param-slider');
      sliders.forEach(slider => {
        slider.addEventListener('input', (e) => {
          const valSpan = e.target.nextElementSibling;
          if (valSpan) valSpan.textContent = parseFloat(e.target.value).toFixed(2);
        });

        // 防抖发送更新请求
        let timeout;
        slider.addEventListener('change', (e) => {
          clearTimeout(timeout);
          timeout = setTimeout(() => {
            const key = e.target.dataset.key;
            const val = e.target.value;
            this.onSendMessage(`请更新可视化，将参数 ${key} 设置为 ${val}`);
          }, 500);
        });
      });
    } catch (error) {
      console.error('Error binding visualization events:', error);
      const vizContent = container.querySelector('.visualization-content');
      if (vizContent) {
        vizContent.innerHTML = `<div style="color: #ef4444; padding: 20px;">渲染错误: ${error.message}</div>`;
      }
    }
  }

  /**
   * 转义HTML
   */
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * 处理消息操作
   */
  handleMessageAction(action, message) {
    switch (action) {
      case 'copy':
        this.copyMessageContent(message);
        break;
      case 'regenerate':
        this.regenerateMessage(message);
        break;
      case 'share':
        this.shareMessage(message);
        break;
      default:
        console.warn('Unknown message action:', action);
    }
  }

  /**
   * 复制消息内容
   */
  async copyMessageContent(message) {
    try {
      const content = typeof message.content === 'string'
        ? message.content
        : JSON.stringify(message.content, null, 2);

      await navigator.clipboard.writeText(content);
      this.showToast('已复制到剪贴板');
    } catch (error) {
      console.error('Failed to copy message:', error);
      this.showToast('复制失败');
    }
  }

  /**
   * 重新生成消息
   */
  regenerateMessage(message) {
    // 找到用户消息并重新发送
    const conversation = this.stateManager.get('currentConversation');
    if (conversation) {
      const userMessageIndex = conversation.messages.findIndex(
        msg => msg.id === message.id
      );

      if (userMessageIndex > 0) {
        const userMessage = conversation.messages[userMessageIndex - 1];
        this.onSendMessage(userMessage.content);
      }
    }
  }

  /**
   * 分享消息
   */
  shareMessage(message) {
    const shareData = {
      title: '来自万物可视化的对话',
      text: typeof message.content === 'string'
        ? message.content.substring(0, 100) + '...'
        : '查看可视化内容',
      url: window.location.href
    };

    if (navigator.share) {
      navigator.share(shareData).catch(error => {
        console.error('Failed to share:', error);
        this.copyShareLink(shareData);
      });
    } else {
      this.copyShareLink(shareData);
    }
  }

  /**
   * 复制分享链接
   */
  copyShareLink(shareData) {
    const link = `${shareData.url}?message=${message.id}`;
    navigator.clipboard.writeText(link).then(() => {
      this.showToast('分享链接已复制');
    }).catch(error => {
      console.error('Failed to copy share link:', error);
    });
  }

  /**
   * 更新消息状态
   */
  updateMessageStatus(messageId, status) {
    const messageElement = document.querySelector(`[data-id="${messageId}"]`);
    if (messageElement) {
      messageElement.classList.toggle('error', status === 'error');
      messageElement.classList.toggle('sending', status === 'sending');
    }
  }

  /**
   * 显示加载状态
   */
  showLoading(show) {
    // 移除旧的加载消息
    const existingLoading = this.messagesContainer.querySelector('.message.loading-message');
    if (existingLoading) {
      existingLoading.remove();
    }

    if (show) {
      const loadingDiv = document.createElement('div');
      loadingDiv.className = 'message assistant loading-message';
      loadingDiv.innerHTML = `
        <div class="message-header">
          <div class="message-avatar assistant">🤖</div>
          <div class="message-author">AI助手</div>
        </div>
        <div class="message-content">
          <div class="typing-indicator">
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>
      `;
      this.messagesContainer.appendChild(loadingDiv);
      this.scrollToBottom();
    }
  }

  /**
   * 滚动到底部
   */
  scrollToBottom() {
    if (this.messagesContainer) {
      this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
    }
  }

  /**
   * 获取焦点
   */
  focus() {
    const inputElement = document.getElementById('messageInput');
    if (inputElement) {
      inputElement.focus();
    }
  }

  /**
   * 格式化时间
   */
  formatTime(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit'
    });
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
      bottom: 80px;
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
   * 销毁组件
   */
  destroy() {
    // 清空引用
    this.messagesContainer = null;
    this.welcomeScreen = null;
    this.loadingIndicator = null;
  }
}
