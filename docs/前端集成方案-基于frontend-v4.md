# 前端集成方案 - 基于 frontend-v4/index.html

> 现有前端结构与后端API的完整集成方案

**创建时间**: 2025-12-27
**版本**: v1.0
**基础**: frontend-v4/index.html

---

## 📋 目录

1. [前端结构分析](#前端结构分析)
2. [后端集成改造](#后端集成改造)
3. [JavaScript实现](#javascript实现)
4. [API交互流程](#api交互流程)
5. [完整示例代码](#完整示例代码)

---

## 前端结构分析

### 现有布局

```
┌─────────────────────────────────────────────┐
│  左侧边栏            │  主聊天区        │  右侧边栏    │
│  (left-sidebar)     │  (chat-area)     │(right-sidebar) │
│                     │                 │              │
│ ┌─────────────────┐ │ ┌─────────────┐ │ ┌──────────┐ │
│ │ 新建对话        │ │ │ 模型选择器  │ │ │ 可视化    │ │
│ │ 搜索历史        │ │ │ 消息列表    │ │ │ 预览      │ │
│ │ 对话列表        │ │ │ 输入框      │ │ │           │ │
│ │ (按日期分组)     │ │ │ (文件上传)  │ │ │ 工具栏    │ │
│ └─────────────────┘ │ └─────────────┘ │ └──────────┘ │
│                     │                 │              │
│ 用户信息            │                 │              │
└─────────────────────────────────────────────┘
```

### 组件对应关系

| 前端元素 | 对应功能模块 | 后端API |
|---------|-------------|---------|
| **输入框 + 文件上传** | 模块1：文档预处理 | `POST /api/v1/documents/upload` |
| **消息列表** | 模块5：AI问答 + 模块4：可视化 | `POST /api/v1/qa/ask` |
| **右侧边栏** | 模块4：可视化展示 | `GET /api/v1/.../visualizations/...` |
| **左侧历史** | 对话历史管理 | `GET /api/v1/qa/history/{doc_id}` |

---

## 后端集成改造

### 1. 文件上传功能增强

#### HTML结构（已有，保持）

```html
<div class="input-area-wrapper">
    <div class="file-upload-preview" id="filePreview" style="display: none;">
        <!-- File preview items -->
    </div>
    <textarea id="messageInput" placeholder="输入消息，或拖拽文件到此处..." rows="1"></textarea>
    <div class="input-controls">
        <button class="attach-btn" title="上传文件">
            <i class="fas fa-paperclip"></i>
        </button>
        <!-- ... -->
    </div>
</div>
```

#### JavaScript增强（需要添加）

```javascript
// frontend-v4/js/document-upload.js

class DocumentUploadHandler {
    constructor() {
        this.apiBase = 'http://localhost:8000/api/v1';
        this.uploadingFiles = new Map(); // 正在上传的文件

        this.initDragAndDrop();
        this.initFileInput();
    }

    initDragAndDrop() {
        const dropZone = document.body;
        const dragOverlay = document.getElementById('dragOverlay');

        // 拖拽进入
        dropZone.addEventListener('dragenter', (e) => {
            e.preventDefault();
            dragOverlay.style.display = 'flex';
        });

        // 拖拽悬停
        dragOverlay.addEventListener('dragover', (e) => {
            e.preventDefault();
        });

        // 拖拽离开
        dragOverlay.addEventListener('dragleave', (e) => {
            if (e.target === dragOverlay) {
                dragOverlay.style.display = 'none';
            }
        });

        // 释放文件
        dragOverlay.addEventListener('drop', async (e) => {
            e.preventDefault();
            dragOverlay.style.display = 'none';

            const files = Array.from(e.dataTransfer.files);
            await this.uploadFiles(files);
        });
    }

    initFileInput() {
        const attachBtn = document.querySelector('.attach-btn');

        // 创建隐藏的文件输入框
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = '.pdf';
        fileInput.multiple = true;
        fileInput.style.display = 'none';

        attachBtn.addEventListener('click', () => {
            fileInput.click();
        });

        fileInput.addEventListener('change', async (e) => {
            const files = Array.from(e.target.files);
            await this.uploadFiles(files);
        });
    }

    async uploadFiles(files) {
        // 过滤：只接受PDF
        const pdfFiles = files.filter(f =>
            f.type === 'application/pdf' ||
            f.name.toLowerCase().endsWith('.pdf')
        );

        if (pdfFiles.length === 0) {
            alert('请上传PDF文件');
            return;
        }

        // 显示预览
        this.showFilePreview(pdfFiles);

        // 上传每个文件
        for (const file of pdfFiles) {
            await this.uploadSingleFile(file);
        }
    }

    showFilePreview(files) {
        const previewContainer = document.getElementById('filePreview');
        previewContainer.style.display = 'block';
        previewContainer.innerHTML = '';

        files.forEach(file => {
            const previewItem = document.createElement('div');
            previewItem.className = 'file-preview-item';
            previewItem.innerHTML = `
                <i class="fas fa-file-pdf"></i>
                <span class="filename">${file.name}</span>
                <span class="filesize">${this.formatSize(file.size)}</span>
                <span class="upload-status">等待上传...</span>
            `;

            previewContainer.appendChild(previewItem);
        });
    }

    async uploadSingleFile(file) {
        const formData = new FormData();
        formData.append('file', file);

        // 更新状态：上传中
        this.updateFileStatus(file.name, 'uploading');

        try {
            // 调用后端API
            const response = await fetch(`${this.apiBase}/documents/upload`, {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const result = await response.json();

            if (result.code === 0) {
                // 上传成功
                this.updateFileStatus(file.name, 'success');

                // 开始处理流程
                this.startProcessing(result.data.doc_id);
            } else {
                // 上传失败
                this.updateFileStatus(file.name, 'error', result.message);
            }

        } catch (error) {
            console.error('Upload failed:', error);
            this.updateFileStatus(file.name, 'error', error.message);
        }
    }

    updateFileStatus(filename, status, message = '') {
        const previewItems = document.querySelectorAll('.file-preview-item');

        previewItems.forEach(item => {
            const nameEl = item.querySelector('.filename');
            if (nameEl && nameEl.textContent === filename) {
                const statusEl = item.querySelector('.upload-status');

                if (status === 'uploading') {
                    statusEl.textContent = '上传中...';
                    statusEl.className = 'upload-status uploading';
                } else if (status === 'success') {
                    statusEl.textContent = '✓ 上传成功，处理中...';
                    statusEl.className = 'upload-status success';
                } else if (status === 'error') {
                    statusEl.textContent = `✗ ${message}`;
                    statusEl.className = 'upload-status error';
                } else if (status === 'processing') {
                    statusEl.textContent = message;
                    statusEl.className = 'upload-status processing';
                }
            }
        });
    }

    async startProcessing(docId) {
        // 轮询处理状态
        const pollInterval = setInterval(async () => {
            try {
                const response = await fetch(`${this.apiBase}/documents/${docId}/status`);
                const result = await response.json();

                if (result.code === 0) {
                    const status = result.data.status;
                    const progress = result.data.progress;

                    // 更新进度
                    this.updateFileStatusByDocId(docId, 'processing', progress);

                    // 处理完成
                    if (status === 'visualization_ready') {
                        clearInterval(pollInterval);
                        this.onDocumentReady(docId);
                    }
                    // 处理失败
                    else if (status === 'failed') {
                        clearInterval(pollInterval);
                        this.updateFileStatusByDocId(docId, 'error', '处理失败');
                    }
                }

            } catch (error) {
                console.error('Polling error:', error);
            }
        }, 2000); // 每2秒轮询一次

        // 5分钟后停止轮询
        setTimeout(() => clearInterval(pollInterval), 300000);
    }

    updateFileStatusByDocId(docId, status, message) {
        // 根据doc_id查找对应的文件并更新状态
        const previewItems = document.querySelectorAll('.file-preview-item');

        previewItems.forEach(item => {
            if (item.dataset.docId === docId) {
                const statusEl = item.querySelector('.upload-status');

                if (status === 'processing') {
                    if (typeof message === 'object') {
                        statusEl.textContent = `${message.stage}: ${message.percentage}%`;
                    } else {
                        statusEl.textContent = message;
                    }
                    statusEl.className = 'upload-status processing';
                } else if (status === 'ready') {
                    statusEl.textContent = '✓ 处理完成';
                    statusEl.className = 'upload-status success';

                    // 显示"查看"按钮
                    this.showViewButton(item, docId);
                }
            }
        });
    }

    showViewButton(previewItem, docId) {
        const viewBtn = document.createElement('button');
        viewBtn.className = 'view-btn';
        viewBtn.textContent = '查看文档';
        viewBtn.onclick = () => this.openDocument(docId);

        previewItem.appendChild(viewBtn);
    }

    openDocument(docId) {
        // 切换到该文档的对话
        // 加载文档信息
        // 显示核心概念
        // 准备就绪进行AI问答

        console.log('Opening document:', docId);

        // TODO: 集成到主界面
        this.loadDocumentInfo(docId);
    }

    async loadDocumentInfo(docId) {
        try {
            // 获取文档信息
            const response = await fetch(`${this.apiBase}/documents/${docId}/info`);
            const result = await response.json();

            if (result.code === 0) {
                const docInfo = result.data;

                // 显示在消息区域
                this.addDocumentMessage(docInfo);

                // 显示核心概念
                this.showCoreConcepts(docInfo.concepts);

                // 准备可视化
                this.prepareVisualization(docId);
            }

        } catch (error) {
            console.error('Load document info failed:', error);
        }
    }

    addDocumentMessage(docInfo) {
        const messagesContainer = document.getElementById('messagesContainer');

        // 隐藏欢迎界面
        const welcomeScreen = messagesContainer.querySelector('.welcome-screen');
        if (welcomeScreen) {
            welcomeScreen.style.display = 'none';
        }

        // 添加文档消息
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message system-message';
        messageDiv.innerHTML = `
            <div class="message-content">
                <div class="document-card">
                    <i class="fas fa-file-pdf"></i>
                    <div class="document-info">
                        <h4>${docInfo.filename}</h4>
                        <p class="subject">学科：${docInfo.subject}</p>
                        <p class="stats">
                            <span>${docInfo.total_pages}页</span> |
                            <span>${docInfo.concepts.length}个核心概念</span>
                        </p>
                    </div>
                </div>
            </div>
        `;

        messagesContainer.appendChild(messageDiv);
    }

    async showCoreConcepts(concepts) {
        // 在右侧边栏显示核心概念
        const artifactsContainer = document.querySelector('.artifacts-container');

        let html = '<h3>核心概念</h3><ul class="concepts-list">';

        concepts.slice(0, 10).forEach(concept => {
            html += `
                <li class="concept-item" data-concept-id="${concept.id}">
                    <div class="concept-name">${concept.name}</div>
                    <div class="concept-score">重要性: ${(concept.importance * 100).toFixed(0)}%</div>
                    <button class="visualize-btn" data-concept-id="${concept.id}">
                        <i class="fas fa-chart-bar"></i> 可视化
                    </button>
                </li>
            `;
        });

        html += '</ul>';

        // 插入到右侧边栏
        const conceptDiv = document.createElement('div');
        conceptDiv.className = 'concepts-panel';
        conceptDiv.innerHTML = html;

        // 移除placeholder
        const placeholder = artifactsContainer.querySelector('.artifact-placeholder');
        if (placeholder) {
            placeholder.style.display = 'none';
        }

        // 隐藏之前的artifact-content
        const artifactContent = artifactsContainer.querySelector('.artifact-content');
        if (artifactContent) {
            artifactContent.style.display = 'none';
        }

        artifactsContainer.appendChild(conceptDiv);

        // 绑定可视化按钮事件
        conceptDiv.querySelectorAll('.visualize-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const conceptId = e.target.closest('.visualize-btn').dataset.conceptId;
                this.visualizeConcept(conceptId);
            });
        });
    }

    async visualizeConcept(conceptId) {
        try {
            // 获取可视化代码
            const response = await fetch(
                `${this.apiBase}/documents/${this.currentDocId}/visualizations/${conceptId}`
            );
            const result = await response.json();

            if (result.code === 0) {
                const vizData = result.data;
                this.renderVisualization(vizData);
            }

        } catch (error) {
            console.error('Visualize failed:', error);
        }
    }

    async renderVisualization(vizData) {
        const artifactsContainer = document.querySelector('.artifacts-container');

        // 隐藏核心概念面板
        const conceptsPanel = artifactsContainer.querySelector('.concepts-panel');
        if (conceptsPanel) {
            conceptsPanel.style.display = 'none';
        }

        // 创建可视化展示区
        const vizContent = document.createElement('div');
        vizContent.className = 'artifact-content';
        vizContent.style.display = 'block';

        vizContent.innerHTML = `
            <div class="artifact-toolbar">
                <button class="tab active">可视化</button>
                <button class="tab" onclick="exportVisualization()">导出</button>
            </div>
            <div class="artifact-view">
                <iframe srcdoc="" id="vizFrame" sandbox="allow-scripts allow-same-origin"></iframe>
            </div>
        `;

        artifactsContainer.appendChild(vizContent);

        // 加载并执行可视化代码
        const codeResponse = await fetch(vizData.code_url);
        const vizCode = await codeResponse.text();

        const iframe = document.getElementById('vizFrame');
        iframe.srcdoc = vizCode;
    }

    formatSize(bytes) {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    }
}

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    new DocumentUploadHandler();
});
```

---

## JavaScript实现

### 2. AI问答功能

```javascript
// frontend-v4/js/qa-service.js

class QAService {
    constructor(apiBase = 'http://localhost:8000/api/v1') {
        this.apiBase = apiBase;
        this.currentDocId = null;
        this.currentConversationId = null;
        this.selectedModel = 'gemini';
        this.comparisonMode = false;
    }

    async ask(question) {
        if (!this.currentDocId) {
            alert('请先上传文档');
            return;
        }

        // 添加用户消息到界面
        this.addUserMessage(question);

        // 显示加载动画
        const loadingId = this.addLoadingMessage();

        try {
            const response = await fetch(`${this.apiBase}/qa/ask`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    doc_id: this.currentDocId,
                    question: question,
                    selected_models: this.comparisonMode
                        ? { comparison: ['豆包', 'gemini'] }
                        : { single: this.selectedModel },
                    conversation_id: this.currentConversationId
                })
            });

            const result = await response.json();

            // 移除加载动画
            this.removeMessage(loadingId);

            if (result.code === 0) {
                // 显示AI回答
                this.addAIMessages(result.data.answers);

                // 更新对话ID
                this.currentConversationId = result.data.conversation_id;

            } else {
                this.addErrorMessage(result.message);
            }

        } catch (error) {
            console.error('QA failed:', error);
            this.removeMessage(loadingId);
            this.addErrorMessage('AI回答失败，请重试');
        }
    }

    addUserMessage(question) {
        const messagesContainer = document.getElementById('messagesContainer');

        // 隐藏欢迎界面
        const welcomeScreen = messagesContainer.querySelector('.welcome-screen');
        if (welcomeScreen) {
            welcomeScreen.style.display = 'none';
        }

        const messageDiv = document.createElement('div');
        messageDiv.className = 'message user-message';
        messageDiv.innerHTML = `
            <div class="message-content">
                ${this.escapeHtml(question)}
            </div>
            <div class="message-time">${this.formatTime(new Date())}</div>
        `;

        messagesContainer.appendChild(messageDiv);
        this.scrollToBottom();
    }

    addLoadingMessage() {
        const messagesContainer = document.getElementById('messagesContainer');

        const loadingId = 'loading-' + Date.now();
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message ai-message loading';
        messageDiv.id = loadingId;
        messageDiv.innerHTML = `
            <div class="message-content">
                <div class="loading-spinner">
                    <i class="fas fa-spinner fa-spin"></i>
                    <span>AI思考中...</span>
                </div>
            </div>
        `;

        messagesContainer.appendChild(messageDiv);
        this.scrollToBottom();

        return loadingId;
    }

    addAIMessages(answers) {
        if (this.comparisonMode && answers.length > 1) {
            // 对比模式：左右分栏
            this.addComparisonMessages(answers);
        } else {
            // 单模型：正常显示
            answers.forEach(answer => {
                this.addSingleAIMessage(answer);
            });
        }
    }

    addSingleAIMessage(answer) {
        const messagesContainer = document.getElementById('messagesContainer');

        const messageDiv = document.createElement('div');
        messageDiv.className = 'message ai-message';

        // 处理回答中的可视化链接
        const processedContent = this.processVizLinks(answer.answer);

        messageDiv.innerHTML = `
            <div class="message-header">
                <span class="model-badge">${answer.model}</span>
                <span class="message-time">${answer.time}</span>
            </div>
            <div class="message-content">
                ${processedContent}
            </div>
            <div class="message-actions">
                <button onclick="feedback('useful', '${answer.model}')">
                    <i class="fas fa-thumbs-up"></i> 有用
                </button>
                <button onclick="feedback('inaccurate', '${answer.model}')">
                    <i class="fas fa-thumbs-down"></i> 不准确
                </button>
            </div>
        `;

        messagesContainer.appendChild(messageDiv);
        this.scrollToBottom();
    }

    addComparisonMessages(answers) {
        const messagesContainer = document.getElementById('messagesContainer');

        const comparisonDiv = document.createElement('div');
        comparisonDiv.className = 'message ai-message comparison-message';

        let html = '<div class="comparison-container">';

        answers.forEach(answer => {
            html += `
                <div class="comparison-panel">
                    <div class="panel-header">
                        <span class="model-badge">${answer.model}</span>
                    </div>
                    <div class="panel-content">
                        ${this.processVizLinks(answer.answer)}
                    </div>
                    <div class="panel-time">${answer.time}</div>
                </div>
            `;
        });

        html += '</div>';

        comparisonDiv.innerHTML = html;
        messagesContainer.appendChild(comparisonDiv);
        this.scrollToBottom();
    }

    processVizLinks(answer) {
        // 处理可视化超链接
        // 已经由后端注入，直接返回
        return answer;
    }

    addErrorMessage(message) {
        const messagesContainer = document.getElementById('messagesContainer');

        const messageDiv = document.createElement('div');
        messageDiv.className = 'message system-message error';
        messageDiv.innerHTML = `
            <div class="message-content">
                <i class="fas fa-exclamation-circle"></i>
                ${message}
            </div>
        `;

        messagesContainer.appendChild(messageDiv);
        this.scrollToBottom();
    }

    removeMessage(messageId) {
        const message = document.getElementById(messageId);
        if (message) {
            message.remove();
        }
    }

    scrollToBottom() {
        const messagesContainer = document.getElementById('messagesContainer');
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    formatTime(date) {
        return date.toLocaleTimeString('zh-CN', {
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    setCurrentDocId(docId) {
        this.currentDocId = docId;
    }

    setSelectedModel(model) {
        this.selectedModel = model;
    }

    setComparisonMode(enabled) {
        this.comparisonMode = enabled;
    }
}

// 全局反馈函数
function feedback(type, model) {
    console.log(`Feedback: ${type} for ${model}`);
    // TODO: 发送到后端
    alert('感谢反馈！');
}

function exportVisualization() {
    console.log('Export visualization');
    // TODO: 实现导出功能
}
```

---

## 完整示例代码

### 3. 主入口集成

```javascript
// frontend-v4/js/main.js

class App {
    constructor() {
        this.docUploadHandler = new DocumentUploadHandler();
        this.qaService = new QAService();
        this.currentDocId = null;
    }

    init() {
        this.initFileUpload();
        this.initQAInterface();
        this.initModelSelector();
        this.initVisualizationPanel();
    }

    initFileUpload() {
        // 文档上传处理已在 DocumentUploadHandler 中实现
    }

    initQAInterface() {
        const messageInput = document.getElementById('messageInput');
        const sendBtn = document.querySelector('.send-btn');

        // 监听输入
        messageInput.addEventListener('input', () => {
            // 自动调整高度
            messageInput.style.height = 'auto';
            messageInput.style.height = messageInput.scrollHeight + 'px';

            // 启用/禁用发送按钮
            sendBtn.disabled = messageInput.value.trim() === '';
        });

        // 监听发送按钮
        sendBtn.addEventListener('click', () => {
            this.handleSend();
        });

        // 监听回车发送
        messageInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.handleSend();
            }
        });
    }

    async handleSend() {
        const messageInput = document.getElementById('messageInput');
        const question = messageInput.value.trim();

        if (!question) return;

        // 清空输入框
        messageInput.value = '';
        messageInput.style.height = 'auto';

        // 发送问题
        await this.qaService.ask(question);
    }

    initModelSelector() {
        const modelSelector = document.querySelector('.model-selector');
        const modelDropdown = modelSelector.querySelector('.model-name');
        const chevron = modelSelector.querySelector('.fa-chevron-down');

        // 创建下拉菜单
        const dropdown = document.createElement('div');
        dropdown.className = 'model-dropdown';
        dropdown.innerHTML = `
            <div class="dropdown-item" data-model="doubao">豆包</div>
            <div class="dropdown-item" data-model="gemini">Gemini 1.5 Pro</div>
            <div class="dropdown-item" data-model="chatgpt">ChatGPT</div>
        `;

        modelSelector.appendChild(dropdown);

        // 切换下拉菜单
        modelSelector.addEventListener('click', () => {
            dropdown.style.display =
                dropdown.style.display === 'block' ? 'none' : 'block';
        });

        // 选择模型
        dropdown.querySelectorAll('.dropdown-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const model = e.target.dataset.model;
                modelDropdown.textContent = e.target.textContent;
                this.qaService.setSelectedModel(model);
                dropdown.style.display = 'none';
            });
        });

        // 点击外部关闭
        document.addEventListener('click', (e) => {
            if (!modelSelector.contains(e.target)) {
                dropdown.style.display = 'none';
            }
        });
    }

    initVisualizationPanel() {
        // 可视化面板的初始化已在 DocumentUploadHandler 中实现
    }

    onDocumentUploaded(docId) {
        this.currentDocId = docId;
        this.qaService.setCurrentDocId(docId);

        // 更新界面提示
        const inputPlaceholder = document.getElementById('messageInput');
        inputPlaceholder.placeholder = `基于文档提问...（文档已关联）`;
    }
}

// 全局app实例
let app;

// DOM加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    app = new App();
    app.init();
});
```

---

## API交互流程

### 完整时序图

```
用户操作                    前端                  后端API
   │                        │                      │
   ├─ 拖拽PDF到输入框          │                      │
   │                        ├─ POST /upload       │
   │                        │   ├─ 保存到云存储    │
   │                        │   ├─ 生成doc_id     │
   │                        │   └─ 返回doc_id      │
   │                        ├─ 显示进度条          │
   │                        ├─ 轮询 /status       │
   │                        │   ├─ preprocessing │
   │                        │   ├─ subject_identified
   │                        │   ├─ concept_extracted
   │                        │   └─ visualization_ready
   │                        ├─ 显示"处理完成"      │
   │                        └─ 加载文档信息        │
   │                          ├─ GET /info         │
   │                          └─ 显示学科、概念      │
   │                        │                      │
   ├─ 点击"可视化"按钮        │                      │
   │                        ├─ GET /visualizations/{id}
   │                        │   ├─ 获取代码URL      │
   │                        │   └─ 加载HTML/CSS/JS  │
   │                        └─ 渲染到iframe       │
   │                        │                      │
   ├─ 输入问题                │                      │
   │                        ├─ POST /qa/ask       │
   │                        │   ├─ 携带文档上下文   │
   │                        │   ├─ 调用AI模型      │
   │                        │   ├─ 注入可视化链接   │
   │                        │   └─ 返回回答        │
   │                        └─ 显示回答+链接       │
   │                        │                      │
   └─ 点击可视化链接          │                      │
                            ├─ 在右侧边栏渲染     │
                            └─ 参数调整交互        │
```

---

## 样式调整

### CSS增强（style.css）

```css
/* frontend-v4/css/style.css */

/* 文件预览样式 */
.file-preview-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px;
    background: #f5f5f5;
    border-radius: 8px;
    margin-bottom: 8px;
}

.file-preview-item .filename {
    flex: 1;
    font-weight: 500;
}

.file-preview-item .upload-status {
    padding: 4px 12px;
    border-radius: 4px;
    font-size: 12px;
}

.upload-status.uploading {
    background: #e3f2fd;
    color: #1976d2;
}

.upload-status.success {
    background: #e8f5e9;
    color: #388e3c;
}

.upload-status.error {
    background: #ffebee;
    color: #d32f2f;
}

.upload-status.processing {
    background: #fff3e0;
    color: #f57c00;
}

/* 核心概念列表 */
.concepts-panel {
    padding: 16px;
}

.concepts-list {
    list-style: none;
    padding: 0;
    margin: 0;
}

.concept-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px;
    border-bottom: 1px solid #e0e0e0;
    transition: background 0.2s;
}

.concept-item:hover {
    background: #f5f5f5;
}

.concept-name {
    font-weight: 500;
    flex: 1;
}

.concept-score {
    font-size: 12px;
    color: #757575;
    margin-right: 12px;
}

.visualize-btn {
    padding: 6px 12px;
    background: #1976d2;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 12px;
}

.visualize-btn:hover {
    background: #1565c0;
}

/* 对比模式样式 */
.comparison-message {
    padding: 0;
}

.comparison-container {
    display: flex;
    gap: 16px;
}

.comparison-panel {
    flex: 1;
    border: 1px solid #e0e0e0;
    border-radius: 8px;
    overflow: hidden;
}

.comparison-panel .panel-header {
    background: #f5f5f5;
    padding: 8px 12px;
    border-bottom: 1px solid #e0e0e0;
}

.comparison-panel .panel-content {
    padding: 12px;
}

.comparison-panel .panel-time {
    padding: 8px 12px;
    font-size: 12px;
    color: #757575;
    border-top: 1px solid #e0e0e0;
}

/* 模型选择下拉菜单 */
.model-dropdown {
    display: none;
    position: absolute;
    top: 100%;
    left: 0;
    background: white;
    border: 1px solid #e0e0e0;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    z-index: 1000;
    min-width: 150px;
}

.dropdown-item {
    padding: 10px 16px;
    cursor: pointer;
    transition: background 0.2s;
}

.dropdown-item:hover {
    background: #f5f5f5;
}

/* 可视化iframe */
#vizFrame {
    width: 100%;
    height: 400px;
    border: none;
    border-radius: 8px;
}

/* 加载动画 */
.loading-spinner {
    display: flex;
    align-items: center;
    gap: 8px;
}

.loading-spinner i {
    animation: spin 1s linear infinite;
}

@keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
}
```

---

## 总结

### 实施步骤

**第1步：集成文件上传（1-2天）**
```javascript
// 1. 添加 document-upload.js
// 2. 实现拖拽上传
// 3. 集成后端API
// 4. 显示处理进度
```

**第2步：集成AI问答（2-3天）**
```javascript
// 1. 添加 qa-service.js
// 2. 实现多模型问答
// 3. 支持对比模式
// 4. 注入可视化链接
```

**第3步：集成可视化展示（3-5天）**
```javascript
// 1. 显示核心概念
// 2. 渲染可视化代码
// 3. 参数调整交互
// 4. 导出功能
```

### 关键文件

```
frontend-v4/
├── index.html (已有)
├── css/
│   └── style.css (需要添加样式)
└── js/
    ├── config.js (已有)
    ├── main.js (需要增强)
    ├── document-upload.js (新增)
    ├── qa-service.js (新增)
    └── api-client.js (新增)
```

---

**文档版本**: v1.0
**最后更新**: 2025-12-27
**基础**: frontend-v4/index.html
