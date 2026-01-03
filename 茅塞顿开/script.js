document.addEventListener('DOMContentLoaded', function () {
    // DOM元素
    const chatMessages = document.getElementById('chatMessages');
    const chatInput = document.getElementById('chatInput');
    const sendBtn = document.getElementById('sendBtn');
    const fileInput = document.getElementById('fileInput');
    const uploadBtn = document.getElementById('uploadBtn');
    const settingsBtn = document.getElementById('settingsBtn');
    const settingsModal = document.getElementById('settingsModal');
    const closeSettings = document.getElementById('closeSettings');
    const saveSettings = document.getElementById('saveSettings');
    const loadingIndicator = document.getElementById('loadingIndicator');
    const togglePassword = document.getElementById('togglePassword');
    const newChatBtn = document.getElementById('newChatBtn');
    const chatList = document.getElementById('chatList');
    const subjectList = document.getElementById('subjectList');

    // API设置
    let apiSettings = {
        url: localStorage.getItem('apiUrl') || '',
        key: localStorage.getItem('apiKey') || '',
        model: localStorage.getItem('model') || 'gpt-3.5-turbo'
    };

    // 对话管理
    let conversations = JSON.parse(localStorage.getItem('conversations')) || [];
    let currentConversationId = localStorage.getItem('currentConversationId') || null;

    // 对话历史记录
    let conversationHistory = [];

    // 用户薄弱点记录
    let weakPoints = JSON.parse(localStorage.getItem('weakPoints')) || [];

    // 当前选中的学科
    let currentSubject = localStorage.getItem('currentSubject') || 'general';

    // 学科配置
    const subjectConfig = {
        general: {
            name: '综合助手',
            icon: 'fa-graduation-cap',
            systemPrompt: '你是一个专业的AI家教助手，擅长多个学科领域。请用简洁明了的语言回答学生的问题，提供准确的知识解释，并根据学生的水平调整回答的深度。鼓励学生思考，而不仅仅是给出答案。',
            welcomeMessage: '你好！我是你的AI家教助手，有什么问题可以随时问我。你可以输入文字、上传图片或文件，我会尽力帮助你学习。'
        },
        math: {
            name: '高等数学',
            icon: 'fa-calculator',
            systemPrompt: '你是一位专业的高等数学教师，擅长微积分、极限、导数、积分等内容。请用清晰的语言解释数学概念，提供详细的解题步骤，并强调数学思维方法。在解答问题时，请先理解题意，然后给出详细的解题过程，最后总结关键知识点。',
            welcomeMessage: '你好！我是你的高等数学老师。我可以帮你解决微积分、极限、导数、积分等问题。请随时提出你的数学问题，我会为你提供详细的解答和思路。'
        },
        linear: {
            name: '线性代数',
            icon: 'fa-chart-line',
            systemPrompt: '你是一位专业的线性代数教师，精通矩阵运算、向量空间、线性变换、特征值等概念。请用直观的方式解释抽象概念，提供清晰的计算步骤，并强调几何意义。在解答问题时，请注重概念的理解和实际应用。',
            welcomeMessage: '你好！我是你的线性代数老师。我可以帮你解决矩阵运算、向量空间、线性变换等问题。请随时提出你的疑问，我会为你提供清晰的解答。'
        },
        analysis: {
            name: '数学分析',
            icon: 'fa-square-root-alt',
            systemPrompt: '你是一位专业的数学分析教师，精通实数理论、极限理论、连续性、微分、积分等严格数学概念。请用严谨的数学语言解释概念，提供详细的证明过程，并强调数学的严谨性。在解答问题时，请注重逻辑推理和证明方法。',
            welcomeMessage: '你好！我是你的数学分析老师。我可以帮你解决实数理论、极限理论、连续性、微分、积分等问题。请随时提出你的疑问，我会为你提供严谨的解答。'
        },
        probability: {
            name: '概率统计',
            icon: 'fa-dice',
            systemPrompt: '你是一位专业的概率统计教师，精通概率论、数理统计、随机过程等内容。请用直观的方式解释概率概念，提供详细的计算步骤，并强调实际应用。在解答问题时，请注重概念的理解和实际应用场景。',
            welcomeMessage: '你好！我是你的概率统计老师。我可以帮你解决概率论、数理统计、随机过程等问题。请随时提出你的疑问，我会为你提供清晰的解答。'
        },
        physics: {
            name: '大学物理',
            icon: 'fa-atom',
            systemPrompt: '你是一位专业的大学物理教师，精通力学、热学、电磁学、光学、近代物理等内容。请用直观的方式解释物理概念，提供详细的解题步骤，并强调物理意义和实际应用。在解答问题时，请注重物理概念的理解和实际应用。',
            welcomeMessage: '你好！我是你的大学物理老师。我可以帮你解决力学、热学、电磁学、光学、近代物理等问题。请随时提出你的疑问，我会为你提供清晰的解答。'
        },
        programming: {
            name: '编程基础',
            icon: 'fa-code',
            systemPrompt: '你是一位专业的编程教师，精通多种编程语言和算法。请用清晰的语言解释编程概念，提供详细的代码示例，并强调编程思维和最佳实践。在解答问题时，请注重代码的可读性和效率，并解释代码的执行过程。',
            welcomeMessage: '你好！我是你的编程老师。我可以帮你解决各种编程问题，包括语法、算法、数据结构等。请随时提出你的疑问，我会为你提供详细的解答和代码示例。'
        },
        english: {
            name: '大学英语',
            icon: 'fa-language',
            systemPrompt: '你是一位专业的英语教师，精通英语语法、词汇、阅读、写作等内容。请用地道的英语表达，提供详细的语法解释，并强调语言的实际应用。在解答问题时，请注重语言的实际应用场景和文化背景。',
            welcomeMessage: '你好！我是你的英语老师。我可以帮你解决英语语法、词汇、阅读、写作等问题。请随时提出你的疑问，我会为你提供详细的解答。'
        }
    };

    // 初始化
    function init() {
        // 加载设置
        document.getElementById('apiUrl').value = apiSettings.url;
        document.getElementById('apiKey').value = apiSettings.key;
        document.getElementById('model').value = apiSettings.model;

        // 初始化对话
        if (conversations.length === 0) {
            createNewConversation();
        } else {
            if (currentConversationId) {
                loadConversation(currentConversationId);
            } else {
                loadConversation(conversations[0].id);
            }
        }

        // 渲染对话列表
        renderChatList();

        // 设置事件监听器
        setupEventListeners();

        // 自动调整输入框高度
        chatInput.addEventListener('input', function () {
            this.style.height = 'auto';
            this.style.height = Math.min(this.scrollHeight, 120) + 'px';
        });
    }

    // 设置事件监听器
    function setupEventListeners() {
        // 发送消息
        sendBtn.addEventListener('click', sendMessage);
        chatInput.addEventListener('keydown', function (e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        });

        // 文件上传
        uploadBtn.addEventListener('click', function () {
            fileInput.click();
        });

        fileInput.addEventListener('change', handleFileUpload);

        // 新对话按钮
        newChatBtn.addEventListener('click', function () {
            createNewConversation();
        });

        // 设置模态框
        settingsBtn.addEventListener('click', function () {
            settingsModal.style.display = 'block';
        });

        closeSettings.addEventListener('click', function () {
            settingsModal.style.display = 'none';
        });

        window.addEventListener('click', function (e) {
            if (e.target === settingsModal) {
                settingsModal.style.display = 'none';
            }
        });

        // 密码显示/隐藏切换
        togglePassword.addEventListener('click', function () {
            const apiKeyInput = document.getElementById('apiKey');
            const icon = this.querySelector('i');

            if (apiKeyInput.type === 'password') {
                apiKeyInput.type = 'text';
                icon.classList.remove('fa-eye');
                icon.classList.add('fa-eye-slash');
            } else {
                apiKeyInput.type = 'password';
                icon.classList.remove('fa-eye-slash');
                icon.classList.add('fa-eye');
            }
        });

        saveSettings.addEventListener('click', function () {
            apiSettings.url = document.getElementById('apiUrl').value;
            apiSettings.key = document.getElementById('apiKey').value;
            apiSettings.model = document.getElementById('model').value;

            // 保存到本地存储
            localStorage.setItem('apiUrl', apiSettings.url);
            localStorage.setItem('apiKey', apiSettings.key);
            localStorage.setItem('model', apiSettings.model);

            settingsModal.style.display = 'none';
            addMessage('设置已保存', 'ai');
        });

        // 确保输入框支持复制粘贴
        document.getElementById('apiUrl').addEventListener('paste', function (e) {
            // 不需要阻止默认行为，让浏览器处理粘贴
            console.log('API地址粘贴成功');
        });

        document.getElementById('apiKey').addEventListener('paste', function (e) {
            // 不需要阻止默认行为，让浏览器处理粘贴
            console.log('API密钥粘贴成功');
        });
    }

    // 发送消息
    async function sendMessage() {
        const message = chatInput.value.trim();
        if (!message) return;

        // 添加用户消息到界面
        addMessage(message, 'user');

        // 清空输入框
        chatInput.value = '';
        chatInput.style.height = 'auto';

        // 添加到对话历史
        conversationHistory.push({ role: 'user', content: message });

        // 更新当前对话
        updateCurrentConversation();

        // 显示加载指示器
        showLoading();

        try {
            // 调用AI API
            const response = await callAIAPI(conversationHistory);

            // 添加AI回复到界面
            addMessage(response, 'ai');

            // 添加到对话历史
            conversationHistory.push({ role: 'assistant', content: response });

            // 更新当前对话
            updateCurrentConversation();

            // 分析用户薄弱点
            analyzeWeakPoints(message, response);

        } catch (error) {
            console.error('Error calling AI API:', error);
            addMessage('抱歉，我遇到了一些问题。请检查你的API设置或稍后再试。', 'ai');
        } finally {
            // 隐藏加载指示器
            hideLoading();
        }
    }

    // 调用AI API
    async function callAIAPI(messages) {
        if (!apiSettings.url || !apiSettings.key) {
            throw new Error('API设置不完整，请在设置中配置API地址和密钥');
        }

        const response = await fetch(apiSettings.url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiSettings.key}`
            },
            body: JSON.stringify({
                model: apiSettings.model,
                messages: messages,
                max_tokens: 1000,
                temperature: 0.7
            })
        });

        if (!response.ok) {
            throw new Error(`API请求失败: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();

        // 处理不同API的响应格式
        if (data.choices && data.choices.length > 0) {
            return data.choices[0].message.content;
        } else if (data.content) {
            return data.content;
        } else {
            throw new Error('无法解析API响应');
        }
    }

    // 处理文件上传
    function handleFileUpload(event) {
        const files = event.target.files;
        if (files.length === 0) return;

        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const reader = new FileReader();

            reader.onload = function (e) {
                const content = e.target.result;
                let fileMessage = '';

                if (file.type.startsWith('image/')) {
                    // 图片文件
                    fileMessage = `[图片: ${file.name}]`;
                    addMessageWithFile(fileMessage, content, 'user', 'image');
                } else {
                    // 文本文件
                    fileMessage = `[文件: ${file.name}]\n\n${content}`;
                    addMessageWithFile(fileMessage, null, 'user', 'text');
                }

                // 添加到对话历史
                conversationHistory.push({
                    role: 'user',
                    content: fileMessage,
                    type: file.type.startsWith('image/') ? 'image' : 'text',
                    fileName: file.name
                });

                // 更新当前对话
                updateCurrentConversation();
            };

            if (file.type.startsWith('image/')) {
                reader.readAsDataURL(file);
            } else {
                reader.readAsText(file);
            }
        }

        // 清空文件输入
        event.target.value = '';
    }

    // 添加消息到聊天界面
    function addMessage(content, sender) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}-message`;

        const avatarDiv = document.createElement('div');
        avatarDiv.className = 'message-avatar';
        avatarDiv.innerHTML = sender === 'user' ? '<i class="fas fa-user"></i>' : '<i class="fas fa-robot"></i>';

        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';

        // 处理代码块和链接
        const formattedContent = formatMessage(content);
        contentDiv.innerHTML = formattedContent;

        messageDiv.appendChild(avatarDiv);
        messageDiv.appendChild(contentDiv);

        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    // 添加带文件的消息
    function addMessageWithFile(content, fileData, sender, fileType) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}-message`;

        const avatarDiv = document.createElement('div');
        avatarDiv.className = 'message-avatar';
        avatarDiv.innerHTML = sender === 'user' ? '<i class="fas fa-user"></i>' : '<i class="fas fa-robot"></i>';

        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';

        if (fileType === 'image' && fileData) {
            const img = document.createElement('img');
            img.src = fileData;
            img.alt = '上传的图片';
            contentDiv.appendChild(img);
        } else if (fileType === 'text') {
            const pre = document.createElement('pre');
            pre.textContent = content;
            contentDiv.appendChild(pre);
        }

        messageDiv.appendChild(avatarDiv);
        messageDiv.appendChild(contentDiv);

        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    // 格式化消息内容
    function formatMessage(content) {
        // 处理代码块
        content = content.replace(/```([^`]+)```/g, '<pre>$1</pre>');

        // 处理链接
        content = content.replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank">$1</a>');

        // 处理换行
        content = content.replace(/\n/g, '<br>');

        return content;
    }

    // 分析用户薄弱点
    function analyzeWeakPoints(userMessage, aiResponse) {
        // 这里可以实现更复杂的分析逻辑
        // 简单示例：检测用户是否多次询问同一主题
        const keywords = extractKeywords(userMessage);

        keywords.forEach(keyword => {
            let found = false;
            for (let i = 0; i < weakPoints.length; i++) {
                if (weakPoints[i].keyword === keyword) {
                    weakPoints[i].count += 1;
                    weakPoints[i].lastAsked = new Date().toISOString();
                    found = true;
                    break;
                }
            }

            if (!found) {
                weakPoints.push({
                    keyword: keyword,
                    count: 1,
                    firstAsked: new Date().toISOString(),
                    lastAsked: new Date().toISOString()
                });
            }
        });

        // 保存薄弱点数据
        localStorage.setItem('weakPoints', JSON.stringify(weakPoints));
    }

    // 提取关键词
    function extractKeywords(message) {
        // 简单的关键词提取，实际应用中可以使用更复杂的NLP技术
        const stopWords = ['的', '了', '是', '在', '我', '你', '他', '她', '它', '们', '这', '那', '什么', '怎么', '为什么', '如何'];
        const words = message.split(/\s+/).filter(word => word.length > 1 && !stopWords.includes(word));

        // 返回前3个最长的词作为关键词
        return words.sort((a, b) => b.length - a.length).slice(0, 3);
    }

    // 保存对话历史
    function saveConversationHistory() {
        // 这个函数已被updateCurrentConversation替代
    }

    // 创建新对话
    function createNewConversation() {
        const conversationId = generateId();
        const newConversation = {
            id: conversationId,
            title: '新对话',
            messages: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        conversations.unshift(newConversation);
        currentConversationId = conversationId;
        conversationHistory = [];

        saveConversations();
        loadConversation(conversationId);
        renderChatList();

        // 清空聊天界面
        chatMessages.innerHTML = `
            <div class="message ai-message">
                <div class="message-avatar">
                    <i class="fas fa-robot"></i>
                </div>
                <div class="message-content">
                    <p>你好！我是你的AI家教助手，有什么问题可以随时问我。你可以输入文字、上传图片或文件，我会尽力帮助你学习。</p>
                </div>
            </div>
        `;
    }

    // 加载对话
    function loadConversation(conversationId) {
        const conversation = conversations.find(c => c.id === conversationId);
        if (!conversation) return;

        currentConversationId = conversationId;
        conversationHistory = conversation.messages || [];

        // 清空聊天界面
        chatMessages.innerHTML = '';

        // 添加欢迎消息
        const welcomeMessage = document.createElement('div');
        welcomeMessage.className = 'message ai-message';
        welcomeMessage.innerHTML = `
            <div class="message-avatar">
                <i class="fas fa-robot"></i>
            </div>
            <div class="message-content">
                <p>你好！我是你的AI家教助手，有什么问题可以随时问我。你可以输入文字、上传图片或文件，我会尽力帮助你学习。</p>
            </div>
        `;
        chatMessages.appendChild(welcomeMessage);

        // 显示历史消息
        conversationHistory.forEach(msg => {
            if (msg.role === 'user') {
                if (msg.type === 'image') {
                    // 处理图片消息
                    addMessageWithFile(msg.content, null, 'user', 'text');
                } else if (msg.type === 'text' && msg.fileName) {
                    // 处理文件消息
                    addMessageWithFile(msg.content, null, 'user', 'text');
                } else {
                    // 普通文本消息
                    addMessage(msg.content, 'user');
                }
            } else if (msg.role === 'assistant') {
                addMessage(msg.content, 'ai');
            }
        });

        // 更新UI
        renderChatList();
        localStorage.setItem('currentConversationId', conversationId);
    }

    // 更新当前对话
    function updateCurrentConversation() {
        const conversation = conversations.find(c => c.id === currentConversationId);
        if (!conversation) return;

        conversation.messages = [...conversationHistory];
        conversation.updatedAt = new Date().toISOString();

        // 自动生成标题（使用第一条用户消息的前20个字符）
        if (conversation.title === '新对话' && conversationHistory.length > 0) {
            const firstUserMessage = conversationHistory.find(msg => msg.role === 'user');
            if (firstUserMessage) {
                conversation.title = firstUserMessage.content.substring(0, 20) + (firstUserMessage.content.length > 20 ? '...' : '');
            }
        }

        saveConversations();
        renderChatList();
    }

    // 保存对话列表
    function saveConversations() {
        // 只保存最近50个对话，避免存储过多
        const recentConversations = conversations.slice(0, 50);
        localStorage.setItem('conversations', JSON.stringify(recentConversations));
    }

    // 渲染对话列表
    function renderChatList() {
        chatList.innerHTML = '';

        conversations.forEach(conversation => {
            const chatItem = document.createElement('div');
            chatItem.className = `chat-item ${conversation.id === currentConversationId ? 'active' : ''}`;
            chatItem.dataset.conversationId = conversation.id;

            const date = new Date(conversation.updatedAt);
            const dateStr = formatDate(date);

            chatItem.innerHTML = `
                <div class="chat-item-title">${conversation.title}</div>
                <div class="chat-item-date">${dateStr}</div>
            `;

            chatItem.addEventListener('click', function () {
                loadConversation(conversation.id);
            });

            chatList.appendChild(chatItem);
        });
    }

    // 生成唯一ID
    function generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    // 格式化日期
    function formatDate(date) {
        const now = new Date();
        const diff = now - date;
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));

        if (days === 0) {
            const hours = Math.floor(diff / (1000 * 60 * 60));
            if (hours === 0) {
                const minutes = Math.floor(diff / (1000 * 60));
                return minutes <= 1 ? '刚刚' : `${minutes}分钟前`;
            }
            return `${hours}小时前`;
        } else if (days === 1) {
            return '昨天';
        } else if (days < 7) {
            return `${days}天前`;
        } else {
            return date.toLocaleDateString();
        }
    }

    // 显示加载指示器
    function showLoading() {
        loadingIndicator.style.display = 'flex';
    }

    // 隐藏加载指示器
    function hideLoading() {
        loadingIndicator.style.display = 'none';
    }

    // 初始化应用
    init();
});