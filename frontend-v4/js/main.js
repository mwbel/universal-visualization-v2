// 调试信息
console.log('🚀 万物可视化前端脚本开始加载...');

// 等待DOM加载完成
document.addEventListener('DOMContentLoaded', function() {
  console.log('📄 DOM已加载完成，开始初始化...');

  // DOM Elements
  const app = document.getElementById('app');
  const leftSidebar = document.getElementById('leftSidebar');
  const rightSidebar = document.getElementById('rightSidebar');
  const toggleLeftBtn = document.getElementById('toggleLeftSidebar');
  const toggleRightBtn = document.getElementById('toggleRightSidebar');
  const closeRightBtn = document.getElementById('closeRightSidebar');
  const messageInput = document.getElementById('messageInput');
  const sendBtn = document.querySelector('.send-btn');
  const messagesContainer = document.getElementById('messagesContainer');
  const welcomeScreen = document.querySelector('.welcome-screen');
  const dragOverlay = document.getElementById('dragOverlay');
  const filePreview = document.getElementById('filePreview');

  console.log('🔍 DOM元素查找结果:', {
    app: !!app,
    leftSidebar: !!leftSidebar,
    rightSidebar: !!rightSidebar,
    toggleLeftBtn: !!toggleLeftBtn,
    toggleRightBtn: !!toggleRightBtn,
    closeRightBtn: !!closeRightBtn,
    messageInput: !!messageInput,
    sendBtn: !!sendBtn,
    messagesContainer: !!messagesContainer,
    welcomeScreen: !!welcomeScreen,
    dragOverlay: !!dragOverlay,
    filePreview: !!filePreview
  });

  // 检查必要的元素是否存在
  if (!app || !messageInput || !sendBtn) {
    console.error('❌ 关键DOM元素未找到，脚本初始化失败');
    return;
  }

  // State
  let isLeftSidebarOpen = true;
  let isRightSidebarOpen = false; // Default closed
  let uploadedFiles = [];
  let isProcessing = false;
  let retryAttempts = 3;

  // API配置 - 使用配置文件中的设置
  const API_BASE_URL = CONFIG.API_BASE_URL;

  console.log('🔧 API配置:', API_BASE_URL);

  // Event Listeners

  // 1. Sidebar Toggles
  if (toggleLeftBtn) {
    toggleLeftBtn.addEventListener('click', () => {
      leftSidebar.classList.toggle('collapsed');
      // Handle mobile
      if (window.innerWidth <= 768) {
        leftSidebar.classList.toggle('mobile-open');
      }
      console.log('🔼 左侧边栏切换');
    });
  }

  if (toggleRightBtn) {
    toggleRightBtn.addEventListener('click', () => {
      toggleRightPanel();
    });
  }

  if (closeRightBtn) {
    closeRightBtn.addEventListener('click', () => {
      closeRightPanel();
    });
  }

  function toggleRightPanel() {
    rightSidebar.classList.toggle('collapsed');
    isRightSidebarOpen = !rightSidebar.classList.contains('collapsed');
    console.log('🔽 右侧边栏切换');
  }

  function closeRightPanel() {
    rightSidebar.classList.add('collapsed');
    isRightSidebarOpen = false;
  }

  function openRightPanel() {
    rightSidebar.classList.remove('collapsed');
    isRightSidebarOpen = true;
  }

  // Initialize sidebars
  if (window.innerWidth <= 1024) {
    closeRightPanel();
  } else {
    // On large screens, maybe keep it closed initially or open depending on preference
    closeRightPanel();
  }

  // 2. Input Handling
  messageInput.addEventListener('input', () => {
    // Auto resize
    messageInput.style.height = 'auto';
    messageInput.style.height = (messageInput.scrollHeight) + 'px';

    // Enable/Disable send button (considering processing state)
    if (!isProcessing && (messageInput.value.trim().length > 0 || uploadedFiles.length > 0)) {
      sendBtn.removeAttribute('disabled');
    } else {
      sendBtn.setAttribute('disabled', 'true');
    }
  });

  messageInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!isProcessing) {
        sendMessage();
      }
    } else if (e.key === 'Escape') {
      // Clear uploaded files on Escape
      if (uploadedFiles.length > 0) {
        uploadedFiles = [];
        updateFilePreview();
        updateProcessingState();
        addMessage('已清空上传的文件', 'system');
      }
    } else if (e.ctrlKey && e.key === 'v') {
      // Enhanced paste handling
      setTimeout(() => {
        if (messageInput.value.trim().length > 0 && !isProcessing) {
          sendBtn.removeAttribute('disabled');
        }
      }, 100);
    }
  });

  sendBtn.addEventListener('click', sendMessage);

  // 3. File Upload (Drag & Drop)
  window.addEventListener('dragenter', (e) => {
    e.preventDefault();
    dragOverlay.classList.add('active');
  });

  dragOverlay.addEventListener('dragleave', (e) => {
    e.preventDefault();
    if (e.target === dragOverlay) {
      dragOverlay.classList.remove('active');
    }
  });

  dragOverlay.addEventListener('dragover', (e) => {
    e.preventDefault();
  });

  dragOverlay.addEventListener('drop', (e) => {
    e.preventDefault();
    dragOverlay.classList.remove('active');

    const files = e.dataTransfer.files;
    handleFiles(files);
  });

  // Also handle paste events for images
  document.addEventListener('paste', (e) => {
    const items = e.clipboardData.items;
    const files = [];
    for (let i = 0; i < items.length; i++) {
      if (items[i].kind === 'file') {
        files.push(items[i].getAsFile());
      }
    }
    if (files.length > 0) {
      handleFiles(files);
    }
  });

  // Add click handler for attach button
  const attachBtn = document.querySelector('.attach-btn');
  if (attachBtn) {
    attachBtn.addEventListener('click', () => {
      const input = document.createElement('input');
      input.type = 'file';
      input.multiple = true;
      input.accept = '.jpg,.jpeg,.png,.gif,.bmp,.webp,.svg,.pdf,.doc,.docx,.txt,.md,.rtf,.csv,.xlsx,.xls,.json,.xml';
      input.onchange = (e) => {
        handleFiles(e.target.files);
      };
      input.click();
      console.log('📁 文件选择对话框已打开');
    });
  }

  // Functions
  async function handleFiles(files) {
    console.log('📁 处理文件:', files);
    if (files.length > 0) {
      // Validate files
      const validFiles = Array.from(files).filter(file => validateFile(file));

      if (validFiles.length !== files.length) {
        addMessage('部分文件格式不支持，已自动过滤', 'system');
      }

      if (validFiles.length > 0) {
        // Upload files to backend
        await uploadFiles(validFiles);
      }
    }
  }

  function validateFile(file) {
    const allowedExtensions = CONFIG.ALLOWED_FILE_TYPES;
    const maxSize = CONFIG.MAX_FILE_SIZE;

    const fileExt = '.' + file.name.split('.').pop().toLowerCase();

    if (!allowedExtensions.includes(fileExt)) {
      const friendlyName = getFileTypeFriendlyName(fileExt);
      addMessage(`❌ 不支持的文件类型: ${friendlyName} (${fileExt})`, 'system');
      return false;
    }

    if (file.size > maxSize) {
      const sizeMB = (file.size / 1024 / 1024).toFixed(1);
      const maxSizeMB = (maxSize / 1024 / 1024).toFixed(0);
      addMessage(`❌ 文件太大: ${file.name} (${sizeMB}MB)，最大支持 ${maxSizeMB}MB`, 'system');
      return false;
    }

    return true;
  }

  async function uploadFiles(files) {
    console.log('⬆️ 开始上传文件...');
    isProcessing = true;
    updateProcessingState();

    try {
      for (const file of files) {
        await uploadSingleFileWithRetry(file);
      }

      updateFilePreview();
      sendBtn.removeAttribute('disabled');

    } catch (error) {
      console.error('Upload error:', error);
      addMessage(`❌ 文件上传失败: ${error.message}`, 'system');
    } finally {
      isProcessing = false;
      updateProcessingState();
    }
  }

  async function uploadSingleFileWithRetry(file, attempts = 0) {
    if (attempts >= CONFIG.MAX_RETRY_ATTEMPTS) {
      throw new Error(`上传失败，已重试 ${CONFIG.MAX_RETRY_ATTEMPTS} 次`);
    }

    try {
      const formData = new FormData();
      formData.append('file', file);

      // Show upload progress message with retry info if needed
      if (attempts > 0) {
        addMessage(`正在重试上传文件 (${attempts + 1}/${CONFIG.MAX_RETRY_ATTEMPTS}): ${file.name}`, 'system');
      } else {
        addMessage(`正在上传文件: ${file.name}`, 'system');
      }

      // Show progress indicator
      const progressId = showProgressIndicator(`上传 ${file.name}`);

      const response = await fetch(`${API_BASE_URL}/api/v4/files/upload`, {
        method: 'POST',
        body: formData
      });

      updateProgress(progressId, 100);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();

      if (result.success) {
        uploadedFiles.push({
          file: file,
          fileId: result.file_id,
          filename: result.filename,
          fileType: result.file_type,
          fileSize: result.file_size,
          uploadTime: result.upload_time,
          analysisUrl: result.analysis_url
        });

        hideProgressIndicator(progressId);
        addMessage(`✅ 文件上传成功: ${file.name}`, 'system');

        // Automatically start analysis
        setTimeout(() => analyzeFile(result.file_id), 1000);
      } else {
        throw new Error(result.message || 'Upload failed');
      }

    } catch (error) {
      console.warn(`Upload attempt ${attempts + 1} failed:`, error);

      if (attempts < CONFIG.MAX_RETRY_ATTEMPTS - 1) {
        // Wait before retrying (exponential backoff)
        const delay = Math.pow(2, attempts) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
        return uploadSingleFileWithRetry(file, attempts + 1);
      } else {
        throw error;
      }
    }
  }

  function addMessage(text, sender, files = []) {
    const msgDiv = document.createElement('div');
    msgDiv.className = `message ${sender}`;

    // Special styling for system messages
    if (sender === 'system') {
      msgDiv.style.display = 'flex';
      msgDiv.style.justifyContent = 'center';
      msgDiv.style.marginBottom = '16px';

      const systemBadge = document.createElement('div');
      systemBadge.style.cssText = `
        background: #f3f4f6;
        color: #374151;
        padding: 8px 16px;
        border-radius: 20px;
        font-size: 13px;
        border: 1px solid #e5e7eb;
        max-width: 80%;
        text-align: center;
        line-height: 1.4;
      `;

      // Handle emoji and formatting in system messages
      systemBadge.innerHTML = text.replace(/✅/g, '<span style="color: #10b981;">✅</span>')
                                  .replace(/❌/g, '<span style="color: #ef4444;">❌</span>')
                                  .replace(/📊/g, '<span style="color: #3b82f6;">📊</span>');

      msgDiv.appendChild(systemBadge);
    } else {
      msgDiv.style.display = 'flex';
      msgDiv.style.gap = '16px';
      msgDiv.style.marginBottom = '24px';

      const avatar = document.createElement('div');
      avatar.className = 'message-avatar';
      avatar.style.width = '32px';
      avatar.style.height = '32px';
      avatar.style.borderRadius = '50%';
      avatar.style.display = 'flex';
      avatar.style.alignItems = 'center';
      avatar.style.justifyContent = 'center';
      avatar.style.flexShrink = '0';

      if (sender === 'user') {
        avatar.style.backgroundColor = '#f0f0f0';
        avatar.innerText = 'U';
      } else {
        avatar.style.backgroundColor = 'var(--primary-color)';
        avatar.style.color = 'white';
        avatar.innerHTML = '<i class="fas fa-robot"></i>';
      }

      const content = document.createElement('div');
      content.className = 'message-content';
      content.style.flex = '1';

      const name = document.createElement('div');
      name.style.fontWeight = '600';
      name.style.marginBottom = '4px';
      name.style.fontSize = '14px';
      name.innerText = sender === 'user' ? 'User' : 'AI Assistant';

      const textDiv = document.createElement('div');
      textDiv.style.lineHeight = '1.6';

      // Handle markdown-like formatting for AI messages
      if (sender === 'ai' && text.includes('**')) {
        textDiv.innerHTML = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                               .replace(/\n/g, '<br>');
      } else {
        textDiv.innerText = text;
      }

      content.appendChild(name);

      if (files.length > 0) {
        const filesDiv = document.createElement('div');
        filesDiv.style.marginBottom = '8px';
        filesDiv.innerHTML = files.map(f =>
          `<div style="display:inline-block; background:#f5f5f5; padding:4px 8px; border-radius:4px; font-size:12px; margin: 2px;">
            <i class="fas fa-file"></i> ${f.name}
          </div>`
        ).join(' ');
        content.appendChild(filesDiv);
      }

      content.appendChild(textDiv);

      msgDiv.appendChild(avatar);
      msgDiv.appendChild(content);
    }

    messagesContainer.appendChild(msgDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  function updateFilePreview() {
    if (uploadedFiles.length > 0) {
      filePreview.style.display = 'flex';
      filePreview.innerHTML = uploadedFiles.map((fileObj, index) => {
        const file = fileObj.file || fileObj;
        const name = fileObj.filename || file.name;
        const fileType = fileObj.fileType || getFileType(file);
        const icon = getFileIcon(fileType);

        return `
          <div class="file-item" style="background: #f0f0f0; padding: 6px 10px; border-radius: 6px; display: flex; align-items: center; gap: 8px; font-size: 12px; margin-bottom: 6px; border: 1px solid #e0e0e0;">
            <i class="fas ${icon}" style="color: ${getFileIconColor(fileType)};"></i>
            <span style="flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${name}</span>
            <div style="display: flex; align-items: center; gap: 4px;">
              ${fileObj.analysisResult ? '<i class="fas fa-check-circle" style="color: #10b981;" title="分析完成"></i>' : ''}
              <i class="fas fa-times" style="cursor: pointer; color: #666;" onclick="removeFile(${index})" title="移除文件"></i>
            </div>
          </div>
        `;
      }).join('');
    } else {
      filePreview.style.display = 'none';
      filePreview.innerHTML = '';
    }
  }

  function getFileType(file) {
    const name = file.name.toLowerCase();
    if (name.match(/\.(jpg|jpeg|png|gif|bmp|webp|svg)$/)) return 'image';
    if (name.match(/\.(pdf|doc|docx|txt|md|rtf)$/)) return 'document';
    if (name.match(/\.(csv|xlsx|xls|json|xml)$/)) return 'data';
    return 'unknown';
  }

  function getFileIcon(fileType) {
    const icons = {
      'image': 'fa-image',
      'document': 'fa-file-alt',
      'data': 'fa-table',
      'unknown': 'fa-file'
    };
    return icons[fileType] || icons.unknown;
  }

  function getFileIconColor(fileType) {
    const colors = {
      'image': '#3b82f6',
      'document': '#10b981',
      'data': '#f59e0b',
      'unknown': '#6b7280'
    };
    return colors[fileType] || colors.unknown;
  }

  // Make removeFile global so it can be called from HTML string
  window.removeFile = (index) => {
    uploadedFiles.splice(index, 1);
    updateFilePreview();
    if (uploadedFiles.length === 0 && messageInput.value.trim().length === 0) {
      sendBtn.setAttribute('disabled', 'true');
    }
  };

  function sendMessage() {
    const text = messageInput.value.trim();
    if (!text && uploadedFiles.length === 0) return;

    // Hide welcome screen if it's the first message
    if (welcomeScreen.style.display !== 'none') {
      welcomeScreen.style.display = 'none';
    }

    // Add User Message
    addMessage(text, 'user', uploadedFiles);

    // Clear input
    messageInput.value = '';
    messageInput.style.height = 'auto';
    uploadedFiles = [];
    updateFilePreview();
    sendBtn.setAttribute('disabled', 'true');

    // Simulate AI Response
    showTypingIndicator();

    setTimeout(() => {
      removeTypingIndicator();

      // Check if user asked for visualization
      if (text.includes('可视化') || text.includes('图表') || text.includes('分析')) {
        addMessage('好的，我为您生成了相关数据的可视化分析。您可以在右侧面板查看详情。', 'ai');
        openRightPanel();
        showArtifact();
      } else {
        addMessage('这是一个模拟的回复。在实际系统中，这里会连接到后端 API 进行处理。', 'ai');
      }
    }, 1500);
  }

  function showTypingIndicator() {
    const indicator = document.createElement('div');
    indicator.id = 'typingIndicator';
    indicator.className = 'message ai';
    indicator.style.display = 'flex';
    indicator.style.gap = '16px';
    indicator.style.marginBottom = '24px';
    indicator.innerHTML = `
      <div class="message-avatar" style="width:32px; height:32px; border-radius:50%; background:var(--primary-color); color:white; display:flex; align-items:center; justify-content:center;">
        <i class="fas fa-robot"></i>
      </div>
      <div class="message-content">
        <div style="font-weight:600; margin-bottom:4px; font-size:14px;">AI Assistant</div>
        <div style="color:#888;">思考中...</div>
      </div>
    `;
    messagesContainer.appendChild(indicator);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  function removeTypingIndicator() {
    const indicator = document.getElementById('typingIndicator');
    if (indicator) indicator.remove();
  }

  function showArtifact() {
    const placeholder = document.querySelector('.artifact-placeholder');
    const content = document.querySelector('.artifact-content');
    const mockChart = document.querySelector('.mock-chart');

    if (placeholder) placeholder.style.display = 'none';
    if (content) {
      content.style.display = 'flex';
      // Add a simple CSS chart representation
      mockChart.innerHTML = `
        <div style="height: 100%; display: flex; flex-direction: column; justify-content: center; align-items: center; gap: 20px;">
          <div style="width: 100%; height: 200px; display: flex; align-items: flex-end; justify-content: space-around; padding: 0 20px;">
            <div style="width: 40px; height: 60%; background: #3b82f6; border-radius: 4px 4px 0 0;"></div>
            <div style="width: 40px; height: 80%; background: #10b981; border-radius: 4px 4px 0 0;"></div>
            <div style="width: 40px; height: 40%; background: #f59e0b; border-radius: 4px 4px 0 0;"></div>
            <div style="width: 40px; height: 90%; background: #ef4444; border-radius: 4px 4px 0 0;"></div>
          </div>
          <div style="text-align: center; color: #666;">
            <h4>数据分析图表</h4>
            <p style="font-size: 12px;">基于您上传的数据生成的示例图表</p>
          </div>
        </div>
      `;
    }
  }

  // Progress indicator functions
  function showProgressIndicator(message) {
    const progressId = 'progress_' + Date.now();
    const progressDiv = document.createElement('div');
    progressDiv.id = progressId;
    progressDiv.className = 'progress-indicator';
    progressDiv.style.cssText = `
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 8px 16px;
      background: #f0f9ff;
      border: 1px solid #bae6fd;
      border-radius: 8px;
      margin-bottom: 8px;
      font-size: 13px;
      color: #0369a1;
    `;

    progressDiv.innerHTML = `
      <div class="progress-spinner" style="
        width: 16px;
        height: 16px;
        border: 2px solid #e5e7eb;
        border-top: 2px solid #3b82f6;
        border-radius: 50%;
        animation: spin 1s linear infinite;
      "></div>
      <span class="progress-message">${message}</span>
      <span class="progress-percent" style="margin-left: auto; font-weight: 600;">0%</span>
    `;

    // Add CSS animation if not already added
    if (!document.querySelector('#progress-spinner-style')) {
      const style = document.createElement('style');
      style.id = 'progress-spinner-style';
      style.textContent = `
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `;
      document.head.appendChild(style);
    }

    // Insert progress indicator after the last system message or at the beginning
    const lastSystemMsg = messagesContainer.querySelector('.message.system:last-of-type');
    if (lastSystemMsg) {
      lastSystemMsg.parentNode.insertBefore(progressDiv, lastSystemMsg.nextSibling);
    } else {
      messagesContainer.appendChild(progressDiv);
    }

    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    return progressId;
  }

  function updateProgress(progressId, percent) {
    const progressDiv = document.getElementById(progressId);
    if (progressDiv) {
      const percentSpan = progressDiv.querySelector('.progress-percent');
      if (percentSpan) {
        percentSpan.textContent = `${Math.round(percent)}%`;
      }
    }
  }

  function hideProgressIndicator(progressId) {
    const progressDiv = document.getElementById(progressId);
    if (progressDiv) {
      progressDiv.style.transition = 'opacity 0.3s ease-out';
      progressDiv.style.opacity = '0';
      setTimeout(() => progressDiv.remove(), 300);
    }
  }

  function updateProcessingState() {
    // Update send button state
    if (isProcessing) {
      sendBtn.setAttribute('disabled', 'true');
      sendBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
    } else {
      if (messageInput.value.trim().length > 0 || uploadedFiles.length > 0) {
        sendBtn.removeAttribute('disabled');
      }
      sendBtn.innerHTML = '<i class="fas fa-arrow-up"></i>';
    }

    // Update file input state
    const attachBtn = document.querySelector('.attach-btn');
    if (attachBtn) {
      attachBtn.style.opacity = isProcessing ? '0.5' : '1';
      attachBtn.style.cursor = isProcessing ? 'not-allowed' : 'pointer';
    }
  }

  async function analyzeFile(fileId) {
    try {
      addMessage('开始分析文件内容...', 'system');

      const response = await fetch(`${API_BASE_URL}/api/v4/files/analyze/${fileId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          file_id: fileId,
          auto_visualize: true
        })
      });

      if (!response.ok) {
        throw new Error(`Analysis failed: ${response.statusText}`);
      }

      const result = await response.json();

      if (result.success) {
        addMessage(`✅ 文件分析完成 (置信度: ${(result.confidence_score * 100).toFixed(1)}%)`, 'system');

        // Show analysis summary
        const analysisSummary = generateAnalysisSummary(result);
        addMessage(analysisSummary, 'ai');

        // Generate visualization if data available
        if (result.suggested_visualizations.length > 0) {
          generateVisualization(fileId, result.suggested_visualizations[0]);
        }

        // Update file info in uploadedFiles
        const fileInfo = uploadedFiles.find(f => f.fileId === fileId);
        if (fileInfo) {
          fileInfo.analysisResult = result;
        }

      } else {
        addMessage(`❌ 文件分析失败: ${result.message}`, 'system');
      }

    } catch (error) {
      console.error('Analysis error:', error);
      addMessage(`❌ 文件分析失败: ${error.message}`, 'system');
    }
  }

  function generateAnalysisSummary(result) {
    const { extracted_data, metadata, confidence_score, suggested_visualizations } = result;

    let summary = `📊 **文件分析结果**\n\n`;
    summary += `**文件信息:**\n`;
    summary += `- 文件名: ${metadata.file_name}\n`;
    summary += `- 文件大小: ${(metadata.file_size / 1024).toFixed(1)} KB\n`;
    summary += `- 文件类型: ${metadata.file_format}\n`;
    summary += `- 分析置信度: ${(confidence_score * 100).toFixed(1)}%\n\n`;

    if (extracted_data.content_summary) {
      summary += `**内容摘要:**\n${extracted_data.content_summary.substring(0, 200)}...\n\n`;
    }

    if (extracted_data.key_topics && extracted_data.key_topics.length > 0) {
      summary += `**关键词:** ${extracted_data.key_topics.slice(0, 5).map(t => t.topic || t).join(', ')}\n\n`;
    }

    if (extracted_data.word_count) {
      summary += `**统计信息:**\n`;
      summary += `- 词数: ${extracted_data.word_count}\n`;
      summary += `- 字符数: ${extracted_data.character_count}\n\n`;
    }

    if (suggested_visualizations.length > 0) {
      summary += `**推荐可视化:** ${suggested_visualizations.join(', ')}\n\n`;
    }

    return summary;
  }

  async function generateVisualization(fileId, visualizationType) {
    try {
      addMessage('正在生成可视化...', 'system');

      const response = await fetch(`${API_BASE_URL}/api/v4/files/visualize/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          file_id: fileId,
          visualization_type: visualizationType,
          output_format: 'html'
        })
      });

      if (!response.ok) {
        throw new Error(`Visualization failed: ${response.statusText}`);
      }

      const result = await response.json();

      if (result.success) {
        addMessage('✅ 可视化生成完成，请在右侧面板查看', 'system');
        showVisualizationArtifact(result);
      } else {
        addMessage(`❌ 可视化生成失败: ${result.message}`, 'system');
      }

    } catch (error) {
      console.error('Visualization error:', error);
      addMessage(`❌ 可视化生成失败: ${error.message}`, 'system');
    }
  }

  function showVisualizationArtifact(vizResult) {
    openRightPanel();

    const placeholder = document.querySelector('.artifact-placeholder');
    const content = document.querySelector('.artifact-content');
    const mockChart = document.querySelector('.mock-chart');

    if (placeholder) placeholder.style.display = 'none';
    if (content) {
      content.style.display = 'flex';

      // Create an iframe to show the visualization
      const fullDownloadUrl = vizResult.download_url.startsWith('http')
        ? vizResult.download_url
        : `${API_BASE_URL}${vizResult.download_url}`;

      mockChart.innerHTML = `
        <div style="height: 100%; display: flex; flex-direction: column;">
          <div style="padding: 10px; border-bottom: 1px solid #eee; display: flex; justify-content: space-between; align-items: center;">
            <h4 style="margin: 0; color: #333;">${vizResult.visualization_type} 可视化</h4>
            <a href="${fullDownloadUrl}" target="_blank" style="padding: 4px 8px; background: #3b82f6; color: white; text-decoration: none; border-radius: 4px; font-size: 12px;">在新窗口打开</a>
          </div>
          <iframe src="${fullDownloadUrl}" style="flex: 1; border: none; width: 100%;"></iframe>
        </div>
      `;
    }
  }

  function getFileTypeFriendlyName(ext) {
    const typeMap = {
      '.jpg': 'JPEG图片', '.jpeg': 'JPEG图片', '.png': 'PNG图片', '.gif': 'GIF图片',
      '.bmp': 'BMP图片', '.webp': 'WebP图片', '.svg': 'SVG图片',
      '.pdf': 'PDF文档', '.doc': 'Word文档', '.docx': 'Word文档',
      '.txt': '文本文件', '.md': 'Markdown文件', '.rtf': 'RTF文档',
      '.csv': 'CSV数据', '.xlsx': 'Excel文件', '.xls': 'Excel文件',
      '.json': 'JSON数据', '.xml': 'XML文件'
    };
    return typeMap[ext] || '未知类型';
  }

  // Quick Actions
  const suggestionCards = document.querySelectorAll('.suggestion-card');
  suggestionCards.forEach(card => {
    card.addEventListener('click', () => {
      const text = card.querySelector('.text').innerText;
      messageInput.value = `请${text}`;
      sendMessage();
    });
  });

  console.log('✅ 前端界面初始化完成，所有按钮和事件已绑定');
});