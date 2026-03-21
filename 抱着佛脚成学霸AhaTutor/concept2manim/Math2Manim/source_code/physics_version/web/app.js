// 物理动画生成器 - 前端逻辑

// 概念到场景的映射
const conceptMapping = {
    '牛顿第二定律': 'NewtonSecondLaw',
    '简谐运动': 'SimpleHarmonicMotion',
    '动能定理': 'KineticEnergyTheorem',
    '电场': 'ElectricField',
    '抛体运动': 'ProjectileMotion',
    '波的干涉': 'WaveInterference',
    '电磁感应': 'ElectromagneticInduction',
    '多普勒效应': 'DopplerEffect',
    '光电效应': 'PhotoelectricEffect'
};

// 概念分类
const categoryMapping = {
    'mechanics': ['牛顿第二定律', '简谐运动', '动能定理', '抛体运动'],
    'electromagnetism': ['电场', '电磁感应'],
    'waves': ['波的干涉', '多普勒效应'],
    'modern': ['光电效应']
};

// 全局状态
let generationHistory = [];
let totalGenerations = 0;
let todayGenerations = 0;

// DOM元素
const conceptInput = document.getElementById('conceptInput');
const generateBtn = document.getElementById('generateBtn');
const loadingSection = document.getElementById('loadingSection');
const resultContent = document.getElementById('resultContent');
const resultTitle = document.getElementById('resultTitle');
const videoContainer = document.getElementById('videoContainer');
const resultVideo = document.getElementById('resultVideo');
const codeBlock = document.getElementById('codeBlock');
const copyCodeBtn = document.getElementById('copyCodeBtn');
const historyList = document.getElementById('historyList');
const categoryItems = document.querySelectorAll('.category-item');
const conceptTags = document.querySelectorAll('.concept-tag');

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    loadHistory();
    setupEventListeners();
});

// 设置事件监听器
function setupEventListeners() {
    // 生成按钮点击
    generateBtn.addEventListener('click', handleGenerate);

    // 回车键生成
    conceptInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handleGenerate();
        }
    });

    // 快速概念标签点击
    conceptTags.forEach(tag => {
        tag.addEventListener('click', () => {
            const concept = tag.dataset.concept;
            conceptInput.value = concept;
            handleGenerate();
        });
    });

    // 分类筛选
    categoryItems.forEach(item => {
        item.addEventListener('click', () => {
            categoryItems.forEach(i => i.classList.remove('active'));
            item.classList.add('active');
            filterByConcept(item.dataset.category);
        });
    });

    // 复制代码按钮
    copyCodeBtn.addEventListener('click', copyCode);
}

// 处理生成动画
async function handleGenerate() {
    const concept = conceptInput.value.trim();

    if (!concept) {
        alert('请输入物理概念！');
        return;
    }

    // 检查是否支持该概念
    if (!conceptMapping[concept]) {
        alert(`暂不支持"${concept}"，请选择以下概念之一：\n${Object.keys(conceptMapping).join('、')}`);
        return;
    }

    // 显示加载状态
    showLoading();

    try {
        // 调用后端API生成动画
        const result = await generateAnimation(concept);

        // 显示结果
        showResult(concept, result);

        // 添加到历史记录
        addToHistory(concept);

        // 更新统计
        updateStats();

    } catch (error) {
        console.error('生成失败:', error);
        alert('生成动画失败，请稍后重试！\n错误信息: ' + error.message);
        hideLoading();
    }
}

// 调用后端API生成动画
async function generateAnimation(concept) {
    const sceneName = conceptMapping[concept];

    // 发送请求到后端
    const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            concept: concept,
            scene: sceneName
        })
    });

    if (!response.ok) {
        throw new Error('服务器错误');
    }

    const data = await response.json();
    return data;
}

// 显示加载状态
function showLoading() {
    generateBtn.disabled = true;
    generateBtn.textContent = '生成中...';
    loadingSection.classList.add('active');
    resultContent.classList.remove('active');
}

// 隐藏加载状态
function hideLoading() {
    generateBtn.disabled = false;
    generateBtn.textContent = '生成动画';
    loadingSection.classList.remove('active');
}

// 显示结果
function showResult(concept, result) {
    hideLoading();

    // 设置标题
    resultTitle.textContent = `${concept} - 动画结果`;

    // 设置视频
    if (result.videoUrl) {
        resultVideo.src = result.videoUrl;
        videoContainer.style.display = 'block';
    } else {
        videoContainer.style.display = 'none';
    }

    // 设置代码
    if (result.code) {
        codeBlock.textContent = result.code;
    }

    // 显示结果区域
    resultContent.classList.add('active');

    // 滚动到结果区域
    resultContent.scrollIntoView({ behavior: 'smooth' });
}

// 添加到历史记录
function addToHistory(concept) {
    const now = new Date();
    const historyItem = {
        concept: concept,
        timestamp: now.getTime(),
        timeString: formatTime(now)
    };

    generationHistory.unshift(historyItem);

    // 只保留最近10条
    if (generationHistory.length > 10) {
        generationHistory = generationHistory.slice(0, 10);
    }

    // 保存到localStorage
    saveHistory();

    // 更新UI
    renderHistory();
}

// 渲染历史记录
function renderHistory() {
    historyList.innerHTML = '';

    generationHistory.forEach(item => {
        const li = document.createElement('li');
        li.className = 'history-item';
        li.innerHTML = `
            <div>${item.concept}</div>
            <div class="history-time">${item.timeString}</div>
        `;

        li.addEventListener('click', () => {
            conceptInput.value = item.concept;
            handleGenerate();
        });

        historyList.appendChild(li);
    });

    if (generationHistory.length === 0) {
        historyList.innerHTML = '<li class="history-item">暂无历史记录</li>';
    }
}

// 格式化时间
function formatTime(date) {
    const now = new Date();
    const diff = now - date;

    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return '刚刚';
    if (minutes < 60) return `${minutes}分钟前`;
    if (hours < 24) return `${hours}小时前`;
    return `${days}天前`;
}

// 保存历史记录
function saveHistory() {
    localStorage.setItem('generationHistory', JSON.stringify(generationHistory));
    localStorage.setItem('totalGenerations', totalGenerations.toString());
    localStorage.setItem('todayGenerations', todayGenerations.toString());
}

// 加载历史记录
function loadHistory() {
    const saved = localStorage.getItem('generationHistory');
    if (saved) {
        generationHistory = JSON.parse(saved);
        renderHistory();
    }

    const total = localStorage.getItem('totalGenerations');
    if (total) {
        totalGenerations = parseInt(total);
    }

    const today = localStorage.getItem('todayGenerations');
    if (today) {
        todayGenerations = parseInt(today);
    }

    updateStatsDisplay();
}

// 更新统计信息
function updateStats() {
    totalGenerations++;
    todayGenerations++;
    saveHistory();
    updateStatsDisplay();
}

// 更新统计显示
function updateStatsDisplay() {
    const statsCard = document.querySelector('.sidebar-card:last-child .help-item');
    if (statsCard) {
        statsCard.innerHTML = `
            <strong>可用动画：</strong> ${Object.keys(conceptMapping).length}个<br>
            <strong>今日生成：</strong> ${todayGenerations}次<br>
            <strong>总计生成：</strong> ${totalGenerations}次
        `;
    }
}

// 复制代码
function copyCode() {
    const code = codeBlock.textContent;

    navigator.clipboard.writeText(code).then(() => {
        const originalText = copyCodeBtn.textContent;
        copyCodeBtn.textContent = '已复制！';
        copyCodeBtn.style.background = '#4caf50';

        setTimeout(() => {
            copyCodeBtn.textContent = originalText;
            copyCodeBtn.style.background = '#667eea';
        }, 2000);
    }).catch(err => {
        console.error('复制失败:', err);
        alert('复制失败，请手动复制');
    });
}

// 按分类筛选
function filterByConcept(category) {
    const tags = document.querySelectorAll('.concept-tag');

    if (category === 'all') {
        tags.forEach(tag => tag.style.display = 'inline-block');
        return;
    }

    const concepts = categoryMapping[category] || [];

    tags.forEach(tag => {
        const concept = tag.dataset.concept;
        if (concepts.includes(concept)) {
            tag.style.display = 'inline-block';
        } else {
            tag.style.display = 'none';
        }
    });
}

// 模拟生成动画（用于演示，实际应该调用后端API）
async function generateAnimation(concept) {
    // 模拟网络延迟
    await new Promise(resolve => setTimeout(resolve, 2000));

    const sceneName = conceptMapping[concept];

    // 返回模拟数据
    return {
        videoUrl: `/media/videos/physics_generator/480p15/${sceneName}.mp4`,
        code: getSampleCode(concept, sceneName)
    };
}

// 获取示例代码
function getSampleCode(concept, sceneName) {
    return `from manim import *
import numpy as np

class ${sceneName}(Scene):
    """${concept}动画"""

    def construct(self):
        # 标题
        title = Text("${concept}", font_size=48, color=BLUE)
        title.to_edge(UP)
        self.play(Write(title), run_time=1)

        # 公式
        formula = MathTex(r"F = ma", font_size=60, color=YELLOW)
        formula.next_to(title, DOWN, buff=0.5)
        self.play(Write(formula), run_time=1)

        # 创建物体
        box = Square(side_length=1, fill_color=RED, fill_opacity=0.8)
        box.shift(LEFT * 4)
        self.play(Create(box), run_time=1.5)

        # 动画演示
        self.play(
            box.animate.shift(RIGHT * 6),
            rate_func=lambda t: t**2,
            run_time=2
        )

        self.wait(2)

# 运行命令:
# python3 -m manim -pql physics_generator.py ${sceneName}`;
}
