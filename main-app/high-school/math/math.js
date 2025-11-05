/**
 * math.js - 高中数学学习页面JavaScript
 * 处理章节导航、概念可视化和AI交互
 */

(function() {
    'use strict';

    class MathLearningApp {
        constructor() {
            this.currentChapter = null;
            this.currentConcept = null;
            this.currentVisualization = null;
            this.themeManager = null;

            // 章节数据
            this.chaptersData = {
                '1-1': {
                    title: '第1章：集合',
                    concepts: [
                        {
                            id: 'set-basics',
                            title: '集合的含义与表示',
                            description: '集合是数学的基本概念，学习如何表示和描述集合',
                            type: 'set-venn-diagram'
                        },
                        {
                            id: 'set-relations',
                            title: '集合的基本关系',
                            description: '子集、真子集、相等关系等集合间的基本关系',
                            type: 'set-relations'
                        },
                        {
                            id: 'set-operations',
                            title: '集合的基本运算',
                            description: '并集、交集、补集等集合运算及其性质',
                            type: 'set-operations'
                        }
                    ]
                },
                '1-2': {
                    title: '第2章：函数',
                    concepts: [
                        {
                            id: 'function-concept',
                            title: '函数的概念',
                            description: '函数的定义、定义域、值域等基本概念',
                            type: 'function-mapping'
                        },
                        {
                            id: 'function-representation',
                            title: '函数的表示法',
                            description: '解析式、列表法、图像法等函数表示方法',
                            type: 'function-representation'
                        },
                        {
                            id: 'function-properties',
                            title: '函数的基本性质',
                            description: '单调性、奇偶性、周期性等函数性质',
                            type: 'function-properties'
                        }
                    ]
                },
                '1-3': {
                    title: '第3章：基本初等函数',
                    concepts: [
                        {
                            id: 'exponential-function',
                            title: '指数函数',
                            description: '指数函数的图像、性质和应用',
                            type: 'exponential-function'
                        },
                        {
                            id: 'logarithmic-function',
                            title: '对数函数',
                            description: '对数函数的图像、性质和计算',
                            type: 'logarithmic-function'
                        },
                        {
                            id: 'power-function',
                            title: '幂函数',
                            description: '幂函数的图像和性质分析',
                            type: 'power-function'
                        }
                    ]
                }
            };

            this.init();
        }

        async init() {
            try {
                // 初始化主题管理器
                this.initThemeManager();

                // 绑定事件
                this.bindEvents();

                // 加载学习进度
                await this.loadLearningProgress();

                // 初始化MathJax
                this.initMathJax();

                console.log('Math Learning App initialized successfully');

            } catch (error) {
                console.error('Math Learning App initialization failed:', error);
                this.showError('应用初始化失败，请刷新页面重试');
            }
        }

        initThemeManager() {
            if (typeof ThemeManager !== 'undefined') {
                this.themeManager = new ThemeManager();
            }
        }

        bindEvents() {
            // 章节点击事件
            document.querySelectorAll('.chapter-item').forEach(item => {
                item.addEventListener('click', () => {
                    const chapterId = item.dataset.chapter;
                    this.openChapter(chapterId);
                });
            });

            // AI输入框回车事件
            const aiInput = document.getElementById('aiInput');
            if (aiInput) {
                aiInput.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') {
                        this.generateVisualization();
                    }
                });
            }

            // 页面加载动画
            this.initPageAnimations();
        }

        async loadLearningProgress() {
            try {
                const progress = localStorage.getItem('math_learning_progress');
                if (progress) {
                    const data = JSON.parse(progress);
                    this.updateProgressDisplay(data);
                }
            } catch (error) {
                console.error('Failed to load learning progress:', error);
            }
        }

        updateProgressDisplay(progress) {
            // 更新总体进度
            const progressCircle = document.querySelector('.progress-circle');
            const progressText = document.querySelector('.progress-text');
            const progressDetail = document.querySelector('.progress-detail');

            if (progressCircle && progressText && progressDetail) {
                const totalProgress = progress.totalProgress || 0;
                const completedConcepts = progress.completedConcepts || 0;
                const totalConcepts = progress.totalConcepts || 50;

                progressText.textContent = `${totalProgress}%`;
                progressDetail.textContent = `${completedConcepts}/${totalConcepts} 概念已完成`;

                // 更新进度圆环
                const angle = (totalProgress / 100) * 360;
                progressCircle.style.background = `conic-gradient(var(--primary-color) 0deg, var(--primary-color) ${angle}deg, #e5e7eb ${angle}deg)`;
            }

            // 更新章节进度
            Object.keys(progress.chapters || {}).forEach(chapterId => {
                this.updateChapterProgress(chapterId, progress.chapters[chapterId]);
            });
        }

        updateChapterProgress(chapterId, chapterProgress) {
            const chapterItem = document.querySelector(`[data-chapter="${chapterId}"]`);
            if (!chapterItem) return;

            const progressFill = chapterItem.querySelector('.progress-fill');
            const statusBadge = chapterItem.querySelector('.status-badge');

            if (progressFill) {
                progressFill.style.width = `${chapterProgress.progress}%`;
            }

            if (statusBadge) {
                if (chapterProgress.progress === 0) {
                    statusBadge.textContent = '未开始';
                    statusBadge.className = 'status-badge';
                } else if (chapterProgress.progress === 100) {
                    statusBadge.textContent = '已完成';
                    statusBadge.className = 'status-badge completed';
                } else {
                    statusBadge.textContent = '学习中';
                    statusBadge.className = 'status-badge in-progress';
                }
            }
        }

        initMathJax() {
            if (window.MathJax) {
                MathJax.typesetPromise().catch((err) => console.log('MathJax error:', err));
            }
        }

        initPageAnimations() {
            // 章节卡片动画
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.style.animation = 'fadeInUp 0.6s ease forwards';
                    }
                });
            });

            document.querySelectorAll('.chapter-item').forEach(item => {
                item.style.opacity = '0';
                observer.observe(item);
            });
        }

        openChapter(chapterId) {
            const chapter = this.chaptersData[chapterId];
            if (!chapter) return;

            this.currentChapter = chapterId;

            // 显示可视化区域
            const visualizationSection = document.getElementById('visualizationSection');
            const chaptersSection = document.querySelector('.chapters-section');

            if (visualizationSection && chaptersSection) {
                chaptersSection.style.display = 'none';
                visualizationSection.style.display = 'block';

                // 显示第一个概念
                if (chapter.concepts.length > 0) {
                    this.showConcept(chapter.concepts[0]);
                }
            }

            // 保存学习进度
            this.saveChapterProgress(chapterId);
        }

        showConcept(concept) {
            this.currentConcept = concept;

            // 更新概念标题和描述
            const conceptTitle = document.getElementById('conceptTitle');
            const conceptDescription = document.getElementById('conceptDescription');

            if (conceptTitle) conceptTitle.textContent = concept.title;
            if (conceptDescription) conceptDescription.textContent = concept.description;

            // 生成可视化
            this.generateConceptVisualization(concept);

            // 生成解释内容
            this.generateExplanation(concept);
        }

        generateConceptVisualization(concept) {
            const chartContainer = document.getElementById('plotlyChart');
            if (!chartContainer) return;

            // 根据概念类型生成不同的可视化
            switch (concept.type) {
                case 'set-venn-diagram':
                    this.generateVennDiagram(chartContainer);
                    break;
                case 'function-mapping':
                    this.generateFunctionMapping(chartContainer);
                    break;
                case 'exponential-function':
                    this.generateExponentialFunction(chartContainer);
                    break;
                case 'logarithmic-function':
                    this.generateLogarithmicFunction(chartContainer);
                    break;
                default:
                    this.generateDefaultVisualization(chartContainer, concept);
            }
        }

        generateVennDiagram(container) {
            const data = [{
                type: 'scatter',
                x: [1, 2, 3],
                y: [1, 2, 3],
                mode: 'text',
                text: ['A', 'B', 'A∩B'],
                textfont: { size: 16 },
                marker: { size: 0 }
            }];

            const layout = {
                title: '集合的韦恩图',
                showlegend: false,
                xaxis: { visible: false },
                yaxis: { visible: false },
                height: 400,
                shapes: [
                    {
                        type: 'circle',
                        xref: 'x',
                        yref: 'y',
                        x0: 0.5, y0: 0.5, x1: 2.5, y1: 2.5,
                        fillcolor: 'rgba(99, 102, 241, 0.3)',
                        line: { color: 'var(--primary-color)' }
                    },
                    {
                        type: 'circle',
                        xref: 'x',
                        yref: 'y',
                        x0: 1.5, y0: 0.5, x1: 3.5, y1: 2.5,
                        fillcolor: 'rgba(139, 92, 246, 0.3)',
                        line: { color: 'var(--secondary-color)' }
                    }
                ]
            };

            Plotly.newPlot(container, data, layout);
            this.addFunctionControls(container, 'venn');
        }

        generateFunctionMapping(container) {
            const x = Array.from({ length: 100 }, (_, i) => (i - 50) / 10);
            const y = x.map(val => val * val);

            const data = [{
                x: x,
                y: y,
                type: 'scatter',
                mode: 'lines',
                name: 'f(x) = x²',
                line: { color: 'var(--primary-color)', width: 3 }
            }];

            const layout = {
                title: '函数映射关系',
                xaxis: { title: 'x' },
                yaxis: { title: 'f(x)' },
                height: 400
            };

            Plotly.newPlot(container, data, layout);
            this.addFunctionControls(container, 'quadratic');
        }

        generateExponentialFunction(container) {
            const x = Array.from({ length: 100 }, (_, i) => (i - 50) / 10);
            const y1 = x.map(val => Math.pow(2, val));
            const y2 = x.map(val => Math.pow(0.5, val));

            const data = [
                {
                    x: x,
                    y: y1,
                    type: 'scatter',
                    mode: 'lines',
                    name: 'y = 2ˣ',
                    line: { color: 'var(--primary-color)', width: 3 }
                },
                {
                    x: x,
                    y: y2,
                    type: 'scatter',
                    mode: 'lines',
                    name: 'y = (1/2)ˣ',
                    line: { color: 'var(--secondary-color)', width: 3 }
                }
            ];

            const layout = {
                title: '指数函数图像',
                xaxis: { title: 'x' },
                yaxis: { title: 'y' },
                height: 400,
                yaxis: { type: 'log' }
            };

            Plotly.newPlot(container, data, layout);
            this.addFunctionControls(container, 'exponential');
        }

        generateLogarithmicFunction(container) {
            const x = Array.from({ length: 100 }, (_, i) => i / 10 + 0.1);
            const y1 = x.map(val => Math.log2(val));
            const y2 = x.map(val => Math.log10(val));

            const data = [
                {
                    x: x,
                    y: y1,
                    type: 'scatter',
                    mode: 'lines',
                    name: 'y = log₂(x)',
                    line: { color: 'var(--primary-color)', width: 3 }
                },
                {
                    x: x,
                    y: y2,
                    type: 'scatter',
                    mode: 'lines',
                    name: 'y = log₁₀(x)',
                    line: { color: 'var(--secondary-color)', width: 3 }
                }
            ];

            const layout = {
                title: '对数函数图像',
                xaxis: { title: 'x' },
                yaxis: { title: 'y' },
                height: 400
            };

            Plotly.newPlot(container, data, layout);
            this.addFunctionControls(container, 'logarithmic');
        }

        generateDefaultVisualization(container, concept) {
            const x = Array.from({ length: 100 }, (_, i) => (i - 50) / 10);
            const y = x.map(val => Math.sin(val));

            const data = [{
                x: x,
                y: y,
                type: 'scatter',
                mode: 'lines',
                name: concept.title,
                line: { color: 'var(--primary-color)', width: 3 }
            }];

            const layout = {
                title: concept.title,
                xaxis: { title: 'x' },
                yaxis: { title: 'y' },
                height: 400
            };

            Plotly.newPlot(container, data, layout);
            this.addFunctionControls(container, 'trigonometric');
        }

        addFunctionControls(container, type) {
            const controlsList = document.getElementById('controlsList');
            if (!controlsList) return;

            let controlsHTML = '';

            switch (type) {
                case 'quadratic':
                    controlsHTML = `
                        <div class="control-item">
                            <label class="control-label">系数 a</label>
                            <div class="control-input">
                                <input type="range" class="control-slider" id="param-a"
                                       min="-3" max="3" step="0.1" value="1">
                                <span class="control-value" id="value-a">1.0</span>
                            </div>
                        </div>
                        <div class="control-item">
                            <label class="control-label">系数 b</label>
                            <div class="control-input">
                                <input type="range" class="control-slider" id="param-b"
                                       min="-5" max="5" step="0.1" value="0">
                                <span class="control-value" id="value-b">0.0</span>
                            </div>
                        </div>
                        <div class="control-item">
                            <label class="control-label">系数 c</label>
                            <div class="control-input">
                                <input type="range" class="control-slider" id="param-c"
                                       min="-5" max="5" step="0.1" value="0">
                                <span class="control-value" id="value-c">0.0</span>
                            </div>
                        </div>
                    `;
                    break;
                case 'exponential':
                    controlsHTML = `
                        <div class="control-item">
                            <label class="control-label">底数 a</label>
                            <div class="control-input">
                                <input type="range" class="control-slider" id="param-a"
                                       min="0.1" max="5" step="0.1" value="2">
                                <span class="control-value" id="value-a">2.0</span>
                            </div>
                        </div>
                    `;
                    break;
                case 'trigonometric':
                    controlsHTML = `
                        <div class="control-item">
                            <label class="control-label">振幅 A</label>
                            <div class="control-input">
                                <input type="range" class="control-slider" id="param-a"
                                       min="0.1" max="3" step="0.1" value="1">
                                <span class="control-value" id="value-a">1.0</span>
                            </div>
                        </div>
                        <div class="control-item">
                            <label class="control-label">频率 ω</label>
                            <div class="control-input">
                                <input type="range" class="control-slider" id="param-omega"
                                       min="0.5" max="5" step="0.1" value="1">
                                <span class="control-value" id="value-omega">1.0</span>
                            </div>
                        </div>
                        <div class="control-item">
                            <label class="control-label">相位 φ</label>
                            <div class="control-input">
                                <input type="range" class="control-slider" id="param-phi"
                                       min="-3.14" max="3.14" step="0.1" value="0">
                                <span class="control-value" id="value-phi">0.0</span>
                            </div>
                        </div>
                    `;
                    break;
                default:
                    controlsHTML = `
                        <div class="control-item">
                            <label class="control-label">缩放</label>
                            <div class="control-input">
                                <input type="range" class="control-slider" id="param-scale"
                                       min="0.5" max="2" step="0.1" value="1">
                                <span class="control-value" id="value-scale">1.0</span>
                            </div>
                        </div>
                    `;
            }

            controlsList.innerHTML = controlsHTML;

            // 绑定控制事件
            this.bindControlEvents(container, type);
        }

        bindControlEvents(container, type) {
            const sliders = document.querySelectorAll('.control-slider');
            sliders.forEach(slider => {
                slider.addEventListener('input', (e) => {
                    const paramId = e.target.id;
                    const valueId = `value-${paramId.split('-')[1]}`;
                    const valueDisplay = document.getElementById(valueId);

                    if (valueDisplay) {
                        valueDisplay.textContent = parseFloat(e.target.value).toFixed(1);
                    }

                    this.updateVisualization(container, type);
                });
            });
        }

        updateVisualization(container, type) {
            const getParam = (name) => {
                const slider = document.getElementById(`param-${name}`);
                return slider ? parseFloat(slider.value) : 1;
            };

            let x, y1, y2, data;

            switch (type) {
                case 'quadratic':
                    x = Array.from({ length: 100 }, (_, i) => (i - 50) / 10);
                    const a = getParam('a');
                    const b = getParam('b');
                    const c = getParam('c');
                    y1 = x.map(val => a * val * val + b * val + c);

                    data = [{
                        x: x,
                        y: y1,
                        type: 'scatter',
                        mode: 'lines',
                        name: `f(x) = ${a}x² + ${b}x + ${c}`,
                        line: { color: 'var(--primary-color)', width: 3 }
                    }];
                    break;

                case 'exponential':
                    x = Array.from({ length: 100 }, (_, i) => (i - 50) / 10);
                    const base = getParam('a');
                    y1 = x.map(val => Math.pow(base, val));

                    data = [{
                        x: x,
                        y: y1,
                        type: 'scatter',
                        mode: 'lines',
                        name: `y = ${base}^x`,
                        line: { color: 'var(--primary-color)', width: 3 }
                    }];
                    break;

                case 'trigonometric':
                    x = Array.from({ length: 100 }, (_, i) => (i - 50) / 10);
                    const A = getParam('a');
                    const omega = getParam('omega');
                    const phi = getParam('phi');
                    y1 = x.map(val => A * Math.sin(omega * val + phi));

                    data = [{
                        x: x,
                        y: y1,
                        type: 'scatter',
                        mode: 'lines',
                        name: `y = ${A}sin(${omega}x + ${phi})`,
                        line: { color: 'var(--primary-color)', width: 3 }
                    }];
                    break;

                default:
                    x = Array.from({ length: 100 }, (_, i) => (i - 50) / 10);
                    const scale = getParam('scale');
                    y1 = x.map(val => Math.sin(val) * scale);

                    data = [{
                        x: x,
                        y: y1,
                        type: 'scatter',
                        mode: 'lines',
                        name: '缩放函数',
                        line: { color: 'var(--primary-color)', width: 3 }
                    }];
            }

            Plotly.react(container, data, container.layout);
        }

        generateExplanation(concept) {
            const explanationContent = document.getElementById('explanationContent');
            if (!explanationContent) return;

            const explanations = {
                'set-basics': `
                    <p>集合是数学的基本概念，是由确定的、不同的对象组成的整体。</p>
                    <div class="math-formula">
                        \\( A = \\{x | x \\text{具有某种性质}\\} \\)
                    </div>
                    <p>集合的表示方法：</p>
                    <ul>
                        <li><strong>列举法</strong>：将集合中的元素一一列出，如 A = {1, 2, 3, 4, 5}</li>
                        <li><strong>描述法</strong>：用集合中元素的共同特征来描述，如 A = {x | x 是小于10的正整数}</li>
                    </ul>
                `,
                'function-concept': `
                    <p>函数是数学中最重要的概念之一，描述了两个集合之间的对应关系。</p>
                    <div class="math-formula">
                        \\( f: A \\rightarrow B \\)
                    </div>
                    <p>函数的三要素：</p>
                    <ul>
                        <li><strong>定义域</strong>：自变量x的取值范围</li>
                        <li><strong>值域</strong>：函数值y的取值范围</li>
                        <li><strong>对应法则</strong>：从定义域到值域的对应关系</li>
                    </ul>
                `,
                'exponential-function': `
                    <p>指数函数是形式为 y = aˣ (a > 0, a ≠ 1) 的函数。</p>
                    <div class="math-formula">
                        \\( y = a^x \\quad (a > 0, a \\neq 1) \\)
                    </div>
                    <p>指数函数的性质：</p>
                    <ul>
                        <li>定义域：R</li>
                        <li>值域：(0, +∞)</li>
                        <li>过定点(0, 1)</li>
                        <li>当 a > 1 时，函数单调递增</li>
                        <li>当 0 < a < 1 时，函数单调递减</li>
                    </ul>
                `
            };

            const defaultExplanation = `
                <p>这是<strong>${concept.title}</strong>的可视化展示。</p>
                <p>${concept.description}</p>
                <p>通过调节右侧的参数，你可以观察不同条件下函数图像的变化，这有助于深入理解概念的本质特征。</p>
            `;

            explanationContent.innerHTML = explanations[concept.id] || defaultExplanation;

            // 重新渲染MathJax
            if (window.MathJax) {
                MathJax.typesetPromise([explanationContent]).catch((err) => console.log('MathJax error:', err));
            }
        }

        saveChapterProgress(chapterId) {
            try {
                let progress = JSON.parse(localStorage.getItem('math_learning_progress') || '{}');

                if (!progress.chapters) progress.chapters = {};
                if (!progress.chapters[chapterId]) {
                    progress.chapters[chapterId] = {
                        progress: 10,
                        lastAccessed: new Date().toISOString()
                    };
                }

                // 更新总体进度
                const totalChapters = Object.keys(this.chaptersData).length;
                const accessedChapters = Object.keys(progress.chapters).length;
                progress.totalProgress = Math.round((accessedChapters / totalChapters) * 100);
                progress.completedConcepts = accessedChapters * 3; // 假设每章3个概念
                progress.totalConcepts = totalChapters * 3;

                localStorage.setItem('math_learning_progress', JSON.stringify(progress));
                this.updateProgressDisplay(progress);
            } catch (error) {
                console.error('Failed to save chapter progress:', error);
            }
        }

        // AI可视化生成
        async generateVisualization() {
            const input = document.getElementById('aiInput');
            const query = input?.value.trim();

            if (!query) {
                this.showWarning('请输入要可视化的数学概念');
                return;
            }

            this.showLoading('正在生成可视化...');

            try {
                // 模拟AI处理延迟
                await new Promise(resolve => setTimeout(resolve, 2000));

                // 根据输入内容生成相应的可视化
                await this.processAIQuery(query);

                this.hideLoading();
                this.showSuccess('可视化生成成功！');

            } catch (error) {
                console.error('Failed to generate visualization:', error);
                this.hideLoading();
                this.showError('生成失败，请重试');
            }
        }

        async processAIQuery(query) {
            // 隐藏章节区域，显示可视化区域
            const chaptersSection = document.querySelector('.chapters-section');
            const visualizationSection = document.getElementById('visualizationSection');

            if (chaptersSection && visualizationSection) {
                chaptersSection.style.display = 'none';
                visualizationSection.style.display = 'block';
            }

            // 更新标题和描述
            const conceptTitle = document.getElementById('conceptTitle');
            const conceptDescription = document.getElementById('conceptDescription');

            if (conceptTitle) conceptTitle.textContent = 'AI生成可视化';
            if (conceptDescription) conceptDescription.textContent = `基于查询："${query}" 生成的交互式可视化`;

            // 根据查询内容生成相应的可视化
            const chartContainer = document.getElementById('plotlyChart');
            if (chartContainer) {
                if (query.includes('二次函数') || query.includes('quadratic')) {
                    this.generateQuadraticFunction(chartContainer, query);
                } else if (query.includes('正弦') || query.includes('sin')) {
                    this.generateSineFunction(chartContainer, query);
                } else if (query.includes('正态分布') || query.includes('normal')) {
                    this.generateNormalDistribution(chartContainer, query);
                } else {
                    this.generateDefaultAIResponse(chartContainer, query);
                }
            }

            // 生成解释内容
            this.generateAIExplanation(query);
        }

        generateQuadraticFunction(container, query) {
            const x = Array.from({ length: 200 }, (_, i) => (i - 100) / 10);
            const y = x.map(val => val * val + 2 * val + 1);

            const data = [{
                x: x,
                y: y,
                type: 'scatter',
                mode: 'lines',
                name: 'y = x² + 2x + 1',
                line: { color: 'var(--primary-color)', width: 3 }
            }];

            const layout = {
                title: '二次函数图像',
                xaxis: { title: 'x' },
                yaxis: { title: 'y' },
                height: 400
            };

            Plotly.newPlot(container, data, layout);
            this.addFunctionControls(container, 'quadratic');
        }

        generateSineFunction(container, query) {
            const x = Array.from({ length: 200 }, (_, i) => (i - 100) / 10);
            const y = x.map(val => Math.sin(val));

            const data = [{
                x: x,
                y: y,
                type: 'scatter',
                mode: 'lines',
                name: 'y = sin(x)',
                line: { color: 'var(--primary-color)', width: 3 }
            }];

            const layout = {
                title: '正弦函数图像',
                xaxis: { title: 'x' },
                yaxis: { title: 'y' },
                height: 400
            };

            Plotly.newPlot(container, data, layout);
            this.addFunctionControls(container, 'trigonometric');
        }

        generateNormalDistribution(container, query) {
            const x = Array.from({ length: 200 }, (_, i) => (i - 100) / 20);
            const y = x.map(val => Math.exp(-0.5 * val * val) / Math.sqrt(2 * Math.PI));

            const data = [{
                x: x,
                y: y,
                type: 'scatter',
                mode: 'lines',
                name: '标准正态分布',
                line: { color: 'var(--primary-color)', width: 3 },
                fill: 'tozeroy'
            }];

            const layout = {
                title: '正态分布曲线',
                xaxis: { title: 'x' },
                yaxis: { title: '概率密度' },
                height: 400
            };

            Plotly.newPlot(container, data, layout);
        }

        generateDefaultAIResponse(container, query) {
            const x = Array.from({ length: 100 }, (_, i) => (i - 50) / 10);
            const y = x.map(val => Math.cos(val) * Math.exp(-Math.abs(val) * 0.1));

            const data = [{
                x: x,
                y: y,
                type: 'scatter',
                mode: 'lines',
                name: 'AI生成函数',
                line: { color: 'var(--primary-color)', width: 3 }
            }];

            const layout = {
                title: `AI理解："${query}"`,
                xaxis: { title: 'x' },
                yaxis: { title: 'y' },
                height: 400
            };

            Plotly.newPlot(container, data, layout);
        }

        generateAIExplanation(query) {
            const explanationContent = document.getElementById('explanationContent');
            if (!explanationContent) return;

            const explanation = `
                <p>这是基于您的查询<strong>"${query}"</strong>由AI生成的可视化展示。</p>
                <p>AI系统分析了您的查询意图，生成了相应的数学概念可视化。您可以通过右侧的参数控制面板来调节函数参数，观察不同条件下的变化规律。</p>
                <div class="math-formula">
                    通过交互式探索，深入理解数学概念的本质特征
                </div>
                <p>提示：尝试调节参数，观察图像的实时变化，这将帮助您更好地理解概念之间的关系。</p>
            `;

            explanationContent.innerHTML = explanation;

            if (window.MathJax) {
                MathJax.typesetPromise([explanationContent]).catch((err) => console.log('MathJax error:', err));
            }
        }

        // UI辅助方法
        showLoading(message = '正在加载...') {
            const overlay = document.getElementById('loadingOverlay');
            if (overlay) {
                overlay.querySelector('p').textContent = message;
                overlay.style.display = 'flex';
            }
        }

        hideLoading() {
            const overlay = document.getElementById('loadingOverlay');
            if (overlay) {
                overlay.style.display = 'none';
            }
        }

        showToast(message, type = 'info') {
            // 使用父级应用的toast方法
            if (window.highSchoolApp && window.highSchoolApp.showToast) {
                window.highSchoolApp.showToast(message, type);
            } else {
                console.log(`[${type.toUpperCase()}] ${message}`);
            }
        }

        showSuccess(message) { this.showToast(message, 'success'); }
        showError(message) { this.showToast(message, 'error'); }
        showWarning(message) { this.showToast(message, 'warning'); }
        showInfo(message) { this.showToast(message, 'info'); }
    }

    // 全局函数
    window.backToChapters = function() {
        const chaptersSection = document.querySelector('.chapters-section');
        const visualizationSection = document.getElementById('visualizationSection');

        if (chaptersSection && visualizationSection) {
            chaptersSection.style.display = 'block';
            visualizationSection.style.display = 'none';
        }
    };

    window.generateVisualization = function() {
        if (window.mathLearningApp) {
            window.mathLearningApp.generateVisualization();
        }
    };

    window.setExample = function(example) {
        const input = document.getElementById('aiInput');
        if (input) {
            input.value = example;
            input.focus();
        }
    };

    // 页面加载完成后初始化
    document.addEventListener('DOMContentLoaded', () => {
        window.mathLearningApp = new MathLearningApp();
    });

})();