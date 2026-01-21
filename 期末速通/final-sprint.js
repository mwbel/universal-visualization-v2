// 期末速通 - 增强版主逻辑

// ========== 数据定义 ==========

// 考点数据
const checkLists = {
    probability: [
        { id: 'P1', topic: '条件概率与乘法公式', mastered: false, priority: 'high' },
        { id: 'P2', topic: '全概率公式与贝叶斯公式', mastered: false, priority: 'high' },
        { id: 'P3', topic: '常见分布（正态、二项、泊松、指数）', mastered: false, priority: 'high' },
        { id: 'P4', topic: '期望与方差', mastered: false, priority: 'high' },
        { id: 'P5', topic: '中心极限定理', mastered: false, priority: 'high' },
        { id: 'P6', topic: '抽样分布（t、F、χ²）', mastered: false, priority: 'high' },
        { id: 'P7', topic: '参数估计（点估计、区间估计）', mastered: false, priority: 'critical' },
        { id: 'P8', topic: '假设检验', mastered: false, priority: 'critical' }
    ],

    physics: [
        { id: 'PHY1', topic: '库仑定律与电场强度', mastered: false, priority: 'high' },
        { id: 'PHY2', topic: '高斯定理及其应用', mastered: false, priority: 'critical' },
        { id: 'PHY3', topic: '电势与电势差', mastered: false, priority: 'high' },
        { id: 'PHY4', topic: '毕奥-萨伐尔定律', mastered: false, priority: 'high' },
        { id: 'PHY5', topic: '安培环路定理', mastered: false, priority: 'critical' },
        { id: 'PHY6', topic: '法拉第电磁感应定律', mastered: false, priority: 'critical' },
        { id: 'PHY7', topic: '麦克斯韦方程组', mastered: false, priority: 'high' },
        { id: 'PHY8', topic: '杨氏双缝干涉', mastered: false, priority: 'high' },
        { id: 'PHY9', topic: '单缝衍射', mastered: false, priority: 'high' },
        { id: 'PHY10', topic: '光电效应', mastered: false, priority: 'medium' }
    ],

    cpp: [
        { id: 'CPP1', topic: '类与对象（封装）', mastered: false, priority: 'critical' },
        { id: 'CPP2', topic: '构造函数与析构函数', mastered: false, priority: 'high' },
        { id: 'CPP3', topic: '继承与派生', mastered: false, priority: 'critical' },
        { id: 'CPP4', topic: '多态性与虚函数', mastered: false, priority: 'critical' },
        { id: 'CPP5', topic: '纯虚函数与抽象类', mastered: false, priority: 'high' },
        { id: 'CPP6', topic: '运算符重载', mastered: false, priority: 'medium' },
        { id: 'CPP7', topic: '函数模板与类模板', mastered: false, priority: 'high' },
        { id: 'CPP8', topic: 'STL容器（vector、map、set）', mastered: false, priority: 'critical' },
        { id: 'CPP9', topic: '异常处理', mastered: false, priority: 'medium' },
        { id: 'CPP10', topic: '文件操作', mastered: false, priority: 'medium' }
    ]
};

// 可视化列表（复用现有资源）
const visualizations = {
    probability: [
        {
            name: '正态分布',
            path: '../main-app/modules/probability_statistics/pages/正态分布交互式可视化.html',
            topics: ['P3']
        },
        {
            name: '二项分布',
            path: '../main-app/modules/probability_statistics/pages/二项分布现代化可视化_离线版.html',
            topics: ['P3']
        },
        {
            name: '泊松分布',
            path: '../main-app/modules/probability_statistics/pages/泊松分布交互式可视化_完整离线版.html',
            topics: ['P3']
        },
        {
            name: '指数分布',
            path: '../main-app/modules/probability_statistics/pages/指数分布交互式可视化.html',
            topics: ['P3']
        },
        {
            name: '二维正态分布',
            path: '../main-app/modules/probability_statistics/pages/二维正态分布交互式可视化.html',
            topics: ['P4']
        }
    ],

    physics: [
        {
            name: '抛体运动',
            path: '../main-app/modules/physics/physics-visualization/web/index.html',
            topics: []
        }
    ],

    cpp: []
};

// 全局状态
let currentCourse = null;
let currentVizIndex = 0;

// ========== 进度管理 ==========

// 加载进度
function loadProgress() {
    const saved = localStorage.getItem('finalSprintProgress');
    if (saved) {
        try {
            const progress = JSON.parse(saved);
            if (progress.probability) checkLists.probability = progress.probability;
            if (progress.physics) checkLists.physics = progress.physics;
            if (progress.cpp) checkLists.cpp = progress.cpp;
        } catch (e) {
            console.error('加载进度失败:', e);
        }
    }
    updateAllProgress();
}

// 保存进度
function saveProgress() {
    const progress = {
        probability: checkLists.probability,
        physics: checkLists.physics,
        cpp: checkLists.cpp
    };
    localStorage.setItem('finalSprintProgress', JSON.stringify(progress));
}

// 更新所有课程的进度显示（带动画）
function updateAllProgress() {
    ['probability', 'physics', 'cpp'].forEach(course => {
        const list = checkLists[course];
        const mastered = list.filter(t => t.mastered).length;
        const total = list.length;
        const percentage = Math.round((mastered / total) * 100);

        // 更新进度条
        const progressFill = document.getElementById(
            course === 'probability' ? 'prob-progress' :
            course === 'physics' ? 'phys-progress' : 'cpp-progress'
        );
        const masteredText = document.getElementById(
            course === 'probability' ? 'prob-mastered' :
            course === 'physics' ? 'phys-mastered' : 'cpp-mastered'
        );

        if (progressFill) {
            // 动画效果
            progressFill.style.transition = 'width 0.8s cubic-bezier(0.4, 0, 0.2, 1)';
            progressFill.style.width = percentage + '%';
        }
        if (masteredText) {
            // 数字滚动动画
            animateValue(masteredText, parseInt(masteredText.textContent) || 0, mastered, 500);
        }
    });
}

// 数字滚动动画
function animateValue(element, start, end, duration) {
    const range = end - start;
    const increment = range / (duration / 16);
    let current = start;

    const timer = setInterval(() => {
        current += increment;
        if ((increment > 0 && current >= end) || (increment < 0 && current <= end)) {
            current = end;
            clearInterval(timer);
        }
        element.textContent = Math.round(current);
    }, 16);
}

// ========== 课程选择和导航 ==========

// 选择课程（带过渡动画）
function selectCourse(course) {
    // 如果选择概率统计，直接跳转到概念导航页面
    if (course === 'probability') {
        window.location.href = 'concept-navigator.html';
        return;
    }

    // 其他课程保持原有逻辑
    const courseSelector = document.getElementById('courseSelector');
    const learningInterface = document.getElementById('learningInterface');

    // 淡出效果
    courseSelector.style.transition = 'opacity 0.3s ease';
    courseSelector.style.opacity = '0';

    setTimeout(() => {
        currentCourse = course;
        courseSelector.style.display = 'none';
        learningInterface.style.display = 'block';

        // 淡入效果
        learningInterface.style.transition = 'opacity 0.3s ease';
        learningInterface.style.opacity = '0';

        setTimeout(() => {
            learningInterface.style.opacity = '1';

            // 加载考点清单
            renderChecklist(course);

            // 加载第一个可视化
            currentVizIndex = 0;
            if (visualizations[course].length > 0) {
                loadVisualization(0);
            } else {
                document.getElementById('vizFrame').src = 'about:blank';
            }

            // 渲染欢迎消息
            showWelcomeMessage(course);
        }, 50);
    }, 300);
}

// 返回课程选择（带过渡动画）
function backToSelection() {
    const courseSelector = document.getElementById('courseSelector');
    const learningInterface = document.getElementById('learningInterface');

    // 淡出效果
    learningInterface.style.transition = 'opacity 0.3s ease';
    learningInterface.style.opacity = '0';

    setTimeout(() => {
        currentCourse = null;
        learningInterface.style.display = 'none';
        courseSelector.style.display = 'block';

        // 淡入效果
        courseSelector.style.transition = 'opacity 0.3s ease';
        courseSelector.style.opacity = '0';

        setTimeout(() => {
            courseSelector.style.opacity = '1';
        }, 50);
    }, 300);
}

// 显示课程欢迎消息
function showWelcomeMessage(course) {
    const welcomeMessages = {
        probability: {
            title: '📊 欢迎学习概率论与数理统计',
            content: '本课程包含8个核心考点，已集成5个可视化。建议从常见分布开始学习！'
        },
        physics: {
            title: '⚛️ 欢迎学习大学物理（下册）',
            content: '本课程包含10个核心考点，重点关注电磁学和波动光学。部分内容正在开发中。'
        },
        cpp: {
            title: '💻 欢迎学习C++程序设计',
            content: '本课程包含10个核心考点，重点掌握面向对象、继承多态和STL容器。内容正在开发中。'
        }
    };

    const message = welcomeMessages[course];
    if (message) {
        addChatMessage('ai', `<strong>${message.title}</strong><br><br>${message.content}`);
    }
}

// ========== 概念导航 ==========

// 根据当前课程打开相应的概念导航
function openConceptNavigatorForCourse() {
    if (!currentCourse) {
        showToast('请先选择课程', 'warning');
        return;
    }

    switch(currentCourse) {
        case 'probability':
            window.open('concept-navigator.html', '_blank');
            break;
        case 'physics':
            showToast('大学物理概念导航即将推出！', 'info');
            break;
        case 'cpp':
            showToast('C++程序设计概念导航即将推出！', 'info');
            break;
        default:
            showToast('未知课程', 'error');
    }
}

// ========== 考点清单渲染 ==========

// 渲染考点清单（带动画）
function renderChecklist(course) {
    const container = document.getElementById('checklistContainer');
    const list = checkLists[course];

    // 清空容器
    container.innerHTML = '';

    // 逐个添加考点项（带延迟动画）
    list.forEach((item, index) => {
        setTimeout(() => {
            const itemDiv = document.createElement('div');
            itemDiv.className = `checklist-item ${item.mastered ? 'mastered' : ''} ${item.priority}`;
            itemDiv.onclick = () => toggleMastered(course, item.id);
            itemDiv.style.animation = 'fadeIn 0.3s ease-out backwards';

            itemDiv.innerHTML = `
                <div class="topic-name">${item.topic}</div>
                <span class="priority-badge priority-${item.priority}">
                    ${item.priority === 'critical' ? '重要' : item.priority === 'high' ? '较重要' : '一般'}
                </span>
            `;

            container.appendChild(itemDiv);
        }, index * 50);
    });
}

// 切换掌握状态（带动画）
function toggleMastered(course, itemId) {
    const list = checkLists[course];
    const item = list.find(i => i.id === itemId);

    if (item) {
        item.mastered = !item.mastered;
        saveProgress();

        // 更新UI（添加动画效果）
        renderChecklist(course);
        updateAllProgress();

        // 显示提示
        if (item.mastered) {
            showToast(`✓ 已标记"${item.topic}"为已掌握`, 'success');
        }

        // 触发庆祝效果（如果是critical考点）
        if (item.mastered && item.priority === 'critical') {
            triggerConfetti();
        }
    }
}

// ========== 可视化管理 ==========

// 加载可视化（带加载动画）
function loadVisualization(index) {
    if (!currentCourse) return;

    const vizList = visualizations[currentCourse];
    if (index >= 0 && index < vizList.length) {
        currentVizIndex = index;
        const viz = vizList[index];

        // 显示加载状态
        const vizFrame = document.getElementById('vizFrame');
        vizFrame.style.opacity = '0.5';

        setTimeout(() => {
            vizFrame.src = viz.path;
            vizFrame.onload = () => {
                vizFrame.style.opacity = '1';
            };
        }, 200);

        // 更新按钮状态
        updateVizButtons();
    }
}

// 更新可视化导航按钮状态
function updateVizButtons() {
    const prevBtn = document.getElementById('prevViz');
    const nextBtn = document.getElementById('nextViz');

    if (!currentCourse) return;

    const vizList = visualizations[currentCourse];

    prevBtn.disabled = currentVizIndex === 0;
    prevBtn.style.opacity = currentVizIndex === 0 ? '0.5' : '1';

    nextBtn.disabled = currentVizIndex === vizList.length - 1;
    nextBtn.style.opacity = currentVizIndex === vizList.length - 1 ? '0.5' : '1';
}

// 导航可视化
function navigateViz(direction) {
    if (!currentCourse) return;

    const vizList = visualizations[currentCourse];
    const newIndex = currentVizIndex + direction;

    if (newIndex >= 0 && newIndex < vizList.length) {
        loadVisualization(newIndex);
    }
}

// ========== AI问答系统 ==========

// AI问答（增强版）
function askQuestion() {
    const input = document.getElementById('questionInput');
    const question = input.value.trim();

    if (!question || !currentCourse) {
        showToast('请输入问题', 'warning');
        return;
    }

    // 添加用户消息
    addChatMessage('user', question);
    input.value = '';

    // 显示"正在思考"指示器
    const thinkingIndicator = addThinkingIndicator();

    // 模拟AI回答（实际应该调用后端API）
    setTimeout(() => {
        removeThinkingIndicator(thinkingIndicator);
        const answer = generateMockAnswer(currentCourse, question);
        addChatMessage('ai', answer);

        // 渲染MathJax公式
        if (typeof MathJax !== 'undefined') {
            MathJax.typesetPromise();
        }
    }, 1000);
}

// 添加聊天消息（带动画）
function addChatMessage(sender, message) {
    const container = document.getElementById('chatMessages');
    const messageDiv = document.createElement('div');
    messageDiv.className = `chat-message ${sender}`;

    const senderName = sender === 'user' ? '你' : 'AI导师';
    messageDiv.innerHTML = `
        <div class="sender">${senderName}</div>
        <div class="content">${message}</div>
    `;

    container.appendChild(messageDiv);

    // 平滑滚动到底部
    container.scrollTo({
        top: container.scrollHeight,
        behavior: 'smooth'
    });
}

// 添加"正在思考"指示器
function addThinkingIndicator() {
    const container = document.getElementById('chatMessages');
    const indicator = document.createElement('div');
    indicator.className = 'chat-message ai thinking';
    indicator.innerHTML = `
        <div class="sender">AI导师</div>
        <div class="content">
            <div class="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
            </div>
        </div>
    `;

    container.appendChild(indicator);
    container.scrollTop = container.scrollHeight;

    return indicator;
}

// 移除"正在思考"指示器
function removeThinkingIndicator(indicator) {
    if (indicator && indicator.parentNode) {
        indicator.parentNode.removeChild(indicator);
    }
}

// 生成模拟回答（增强版）
function generateMockAnswer(course, question) {
    const answers = {
        probability: `关于"<strong>${question}</strong>"的理解：<br><br>
1. <strong>核心概念</strong>：这是概率论的重要知识点<br>
2. <strong>直观理解</strong>：可以用可视化来帮助理解<br>
3. <strong>关键公式</strong>：需要掌握相关公式<br>
4. <strong>常见误区</strong>：注意概念之间的区别<br><br>
💡 建议：查看相关的可视化来加深理解！`,

        physics: `关于"<strong>${question}</strong>"的解释：<br><br>
1. <strong>物理原理</strong>：这是物理学的基本定律<br>
2. <strong>数学表达</strong>：相关公式是...<br>
3. <strong>实际应用</strong>：在生活中有广泛的应用<br>
4. <strong>记忆方法</strong>：可以通过类比来记忆<br><br>
💡 提示：可以通过模拟实验来观察这个现象！`,

        cpp: `关于"<strong>${question}</strong>"的解答：<br><br>
1. <strong>语法要点</strong>：注意正确的语法格式<br>
2. <strong>内存模型</strong>：理解内存中的存储方式<br>
3. <strong>常见错误</strong>：避免这些典型错误<br>
4. <strong>最佳实践</strong>：推荐这样写代码<br><br>
💡 提示：可以查看代码示例和内存可视化！`
    };

    return answers[course] || '正在思考你的问题...';
}

// 键盘事件处理
function handleKeyPress(event) {
    if (event.key === 'Enter') {
        askQuestion();
    }
}

// ========== UI增强功能 ==========

// Toast提示
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 12px 20px;
        background: ${type === 'success' ? '#34a853' : type === 'error' ? '#ea4335' : type === 'warning' ? '#fbbc04' : '#4285f4'};
        color: white;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 10000;
        animation: slideInRight 0.3s ease-out;
        font-weight: 500;
    `;

    document.body.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = 'slideOutRight 0.3s ease-out';
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    }, 3000);
}

// 庆祝效果（纸屑动画）
function triggerConfetti() {
    // 简化版纸屑效果
    const colors = ['#4285f4', '#ea4335', '#fbbc04', '#34a853'];

    for (let i = 0; i < 50; i++) {
        setTimeout(() => {
            const confetti = document.createElement('div');
            confetti.style.cssText = `
                position: fixed;
                width: 10px;
                height: 10px;
                background: ${colors[Math.floor(Math.random() * colors.length)]};
                left: ${Math.random() * 100}vw;
                top: -10px;
                border-radius: 2px;
                z-index: 10000;
                animation: confettiFall ${2 + Math.random() * 2}s linear forwards;
            `;

            document.body.appendChild(confetti);

            setTimeout(() => {
                if (confetti.parentNode) {
                    confetti.parentNode.removeChild(confetti);
                }
            }, 4000);
        }, i * 30);
    }
}

// 添加CSS动画
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }

    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }

    @keyframes confettiFall {
        to {
            transform: translateY(100vh) rotate(720deg);
        }
    }

    .typing-indicator {
        display: flex;
        gap: 4px;
        padding: 8px 0;
    }

    .typing-indicator span {
        width: 8px;
        height: 8px;
        background: #4285f4;
        border-radius: 50%;
        animation: typing 1.4s infinite;
    }

    .typing-indicator span:nth-child(2) {
        animation-delay: 0.2s;
    }

    .typing-indicator span:nth-child(3) {
        animation-delay: 0.4s;
    }

    @keyframes typing {
        0%, 60%, 100% {
            transform: translateY(0);
        }
        30% {
            transform: translateY(-10px);
        }
    }

    .chat-message.thinking {
        opacity: 0.7;
    }
`;
document.head.appendChild(style);

// ========== 快速导航功能 ==========

// 显示整体进度
function showOverallProgress() {
    const totalPoints = Object.values(checkLists).reduce((sum, list) => sum + list.length, 0);
    const masteredPoints = Object.values(checkLists).reduce((sum, list) => sum + list.filter(t => t.mastered).length, 0);
    const percentage = Math.round((masteredPoints / totalPoints) * 100);

    const message = `
        <strong>📊 整体学习进度</strong><br><br>
        总考点：${totalPoints} 个<br>
        已掌握：${masteredPoints} 个<br>
        完成度：${percentage}%<br><br>
        ${percentage >= 90 ? '🎉 太棒了！继续保持！' :
          percentage >= 70 ? '💪 进展不错，加油！' :
          percentage >= 50 ? '📚 继续努力，你可以的！' :
          '🚀 开始你的学习之旅吧！'}
    `;

    alert(message.replace(/<br>/g, '\n').replace(/<strong>|<\/strong>/g, '').replace(/📊|🎉|💪|📚|🚀/g, ''));
}

// 显示学习计划
function showStudyPlan() {
    const message = `
📅 三周冲刺计划

Week 1（Day 1-7）：
  复习概率统计，开发3个新可视化

Week 2（Day 8-14）：
  开发电磁学、光学可视化

Week 3（Day 15-21）：
  开发C++可视化，综合冲刺

每天坚持2-3小时，祝你期末顺利！
    `;

    alert(message);
}

// ========== 初始化 ==========

window.onload = function() {
    console.log('🎯 期末速通 - 增强版已加载');

    // 加载进度
    loadProgress();

    // 添加页面加载动画
    document.body.style.opacity = '0';
    setTimeout(() => {
        document.body.style.transition = 'opacity 0.5s ease';
        document.body.style.opacity = '1';
    }, 100);

    // 显示欢迎提示
    setTimeout(() => {
        if (!localStorage.getItem('finalSprintVisited')) {
            showToast('👋 欢迎使用期末速通！选择一门课程开始学习吧', 'info');
            localStorage.setItem('finalSprintVisited', 'true');
        }
    }, 1000);
};
