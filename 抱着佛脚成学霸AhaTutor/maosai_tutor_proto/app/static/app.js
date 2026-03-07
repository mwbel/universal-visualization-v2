/**
 * Aha Tutor Frontend Logic - Module-Driven Version
 * Implements "Liquid Glass" interactions and dynamic module rendering.
 */

'use strict';

const $ = (id) => document.getElementById(id);

// --- State Management ---
const AppState = {
    mode: 'dashboard', // 'dashboard' | 'chat'
    activeModule: 'overview',
    params: {},
    currentViewId: null,
    // Practice state
    currentPracticeTopic: null,
    currentPracticeCategory: "基础练",
    currentQuestions: [],
    questionIndex: 0,
    wrongQuestions: JSON.parse(localStorage.getItem('aha_wrong_questions') || '[]'),
    predictedQuestions: JSON.parse(localStorage.getItem('aha_predicted_questions') || '[]'),
};

// --- Module Configuration ---
const ModuleConfig = [
    {
        id: "overview",
        icon: "home",
        label: "Overview",
        sidebar: {
            sections: [
                { title: "Starred", items: ["Set Properties", "Vector Geometry", "Trig Basics"] },
                { title: "Recent", items: ["Quadratic Inequalities", "Complex Numbers"] },
                { title: "Projects", isTree: true }
            ]
        },
        main: {
            title: "Study Report",
            widgets: [
                {
                    type: "kpiRow", cards: [
                        { label: "Study Time", val: "45m", icon: "clock" },
                        { label: "Accuracy", val: "92%", icon: "target" },
                        { label: "Weak Topics", val: "3", icon: "alert-circle" },
                        { label: "Streak", val: "5d", icon: "zap" }
                    ]
                },
                {
                    type: "bento", cards: [
                        { type: "quickActions", title: "Quick Modules", icon: "zap" },
                        { type: "recommended", title: "Recommended", icon: "sparkles" },
                        { type: "inverted", title: "Best Module", topic: "Binomial Distribution", desc: "Normal Approximation" }
                    ]
                }
            ]
        }
    },
    {
        id: "timeline",
        icon: "clock",
        label: "Timeline",
        sidebar: {
            sections: [
                { title: "Search", isSearch: true },
                { title: "Today", items: ["Sets & Logic - 1h ago", "Function Basics - 4h ago"] },
                { title: "This Week", items: ["Vector Projections", "Matrix Mult"] }
            ]
        },
        main: {
            title: "Recent Sessions",
            widgets: [
                {
                    type: "timelineStream", items: [
                        { date: "Today", title: "Intersection Operations", desc: "Mastered the formal definition.", active: true },
                        { date: "Yesterday", title: "Quadratic Equation Roots", desc: "Practiced 15 problems.", active: false },
                        { date: "Oct 12", title: "Trigonometric Units", desc: "First introduction.", active: false }
                    ]
                },
                { type: "reviewQueue", title: "Review Queue", items: ["Question #42 (Vectors)", "Question #12 (Sets)"] }
            ]
        }
    },
    {
        id: "insights",
        icon: "bar-chart-2",
        label: "Insights",
        sidebar: {
            sections: [
                { title: "Overview", items: ["Week View", "Month View"] },
                { title: "By Topic", items: ["Algebra", "Geometry", "Calculus"] }
            ]
        },
        main: {
            title: "Learning Analytics",
            widgets: [
                { type: "heatmap", title: "Weakness Heatmap", desc: "Topics vs Error Reasons" },
                {
                    type: "kpiRow", cards: [
                        { label: "Careless", val: "12", icon: "help-circle" },
                        { label: "Concept", val: "8", icon: "book" },
                        { label: "Strategy", val: "4", icon: "navigation" }
                    ]
                }
            ]
        }
    },
    {
        id: "editor",
        icon: "pencil",
        label: "Editor",
        sidebar: {
            sections: [
                { title: "Templates", items: ["View Template", "Quick Action"] },
                { title: "Knowledge", items: ["New Card", "Tags List"] }
            ]
        },
        main: {
            title: "Content Creation",
            widgets: [
                { type: "editor", title: "Knowledge Card Editor" }
            ]
        }
    },
    {
        id: "knowledge",
        icon: "book-open",
        label: "Knowledge",
        sidebar: {
            sections: [
                { title: "搜索知识库", isRAGSearch: true },
                { title: "BY TOPIC", isRAGTopics: true }
            ]
        },
        main: {
            title: "知识库",
            widgets: [
                { type: "ragStatus", title: "RAG 状态" },
                { type: "ragSearchResults", title: "搜索结果" }
            ]
        }
    },
    {
        id: "fast_pass",
        icon: "zap",
        label: "考前速通",
        sidebar: {
            sections: [
                {
                    title: "速通主题",
                    items: [
                        "专题(1)：集合、命题、不等式",
                        "专题(2)：函数的图像与性质",
                        "专题(3)：三角恒等变形和三角函数的图像与性质",
                        "专题(4)：平面向量"
                    ]
                },
                { title: "今日必刷", items: ["基础练", "错题练", "押题练"] }
            ]
        },
        main: {
            title: "考前/佛脚/速通 (短时记忆)",
            widgets: [
                { type: "shortTermPractice", title: "一站式速通应用" },
                {
                    type: "kpiRow", cards: [
                        { label: "速通进度", val: "65%", icon: "trending-up" },
                        { label: "平均耗时", val: "12min", icon: "zap" }
                    ]
                }
            ]
        }
    },
    {
        id: "deep_research",
        icon: "microscope",
        label: "深度研究",
        sidebar: {
            sections: [
                { title: "专题透析", items: ["函数解析式深度特辑", "解析几何综合性研究"] },
                { title: "长期规划", items: ["寒假攻克计划", "导数专项突破"] },
                { title: "知识沉淀", isRAGTopics: true }
            ]
        },
        main: {
            title: "深度/学霸/研究 (长时记忆)",
            widgets: [
                { type: "knowledgeGraph", title: "AI 交互知识图谱" },
                { type: "ebbinghaus", title: "遗忘曲线与长期规划" }
            ]
        }
    }
];

// --- API Helpers ---
async function fetchJSON(url) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
}

async function postJSON(url, body) {
    const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
}

// --- Dynamic Rendering ---

function switchToModule(moduleId) {
    console.log("Switching to module:", moduleId);
    AppState.activeModule = moduleId;
    AppState.mode = 'dashboard';
    document.body.classList.remove('mode-chat');

    // Update rail
    document.querySelectorAll('.rail-item').forEach(el => el.classList.remove('active'));
    const railItem = $(`rail_${moduleId}`);
    if (railItem) {
        railItem.classList.add('active');
    }

    renderSidebar(moduleId);
    renderMain(moduleId);

    if (moduleId === 'fast_pass') {
        setTimeout(loadPractice, 100);
    }
}

function renderSidebar(moduleId) {
    const conf = ModuleConfig.find(m => m.id === moduleId);
    const container = $('dynamicSidebar');
    if (!container) return;

    container.innerHTML = '';

    const collapseBtn = document.createElement('div');
    collapseBtn.className = 'collapse-btn';
    collapseBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>';
    collapseBtn.onclick = () => {
        document.querySelector('.left-nav').classList.toggle('collapsed');
    };
    container.appendChild(collapseBtn);

    conf.sidebar.sections.forEach(sec => {
        const secEl = document.createElement('div');
        secEl.className = 'sidebar-section';
        secEl.innerHTML = `<div class="section-title">${sec.title}</div>`;

        const listEl = document.createElement('div');
        listEl.style.display = 'flex';
        listEl.style.flexDirection = 'column';
        listEl.style.gap = '2px';

        if (sec.items) {
            sec.items.forEach(item => {
                const itemEl = document.createElement('div');
                itemEl.className = 'tree-item';
                itemEl.innerHTML = `<i data-lucide="file-text" size="14"></i> ${item}`;
                itemEl.onclick = () => {
                    if (moduleId === 'fast_pass') {
                        if (sec.title === '速通主题') {
                            AppState.currentPracticeTopic = item;
                            loadPractice();
                        } else if (sec.title === '今日必刷') {
                            AppState.currentPracticeTopic = null;
                            AppState.currentPracticeCategory = item;
                            loadPractice();
                        }
                    } else {
                        // Mock behavior for items
                        setMode('chat');
                        addChatMessage('ai', `Loading **${item}** details for you...`);
                    }
                };
                listEl.appendChild(itemEl);
            });
        }

        if (sec.isTree) {
            const treeContainer = document.createElement('div');
            treeContainer.id = 'projectTreeContainer';
            listEl.appendChild(treeContainer);
            loadKnowledgeTree();
        }

        if (sec.isSearch) {
            listEl.innerHTML = `
                <div class="global-search" style="width:100%; height:36px; margin: 4px 8px;">
                    <i data-lucide="search" size="14"></i>
                    <input type="text" class="search-input" placeholder="Filter...">
                </div>
            `;
        }

        // RAG 知识库搜索框
        if (sec.isRAGSearch) {
            listEl.innerHTML = `
                <div class="rag-search-box" style="padding: 8px;">
                    <div class="global-search" style="width:100%; height:40px;">
                        <i data-lucide="search" size="14"></i>
                        <input type="text" class="search-input" id="ragSearchInput" placeholder="搜索知识点...">
                    </div>
                    <button class="rag-search-btn" onclick="performRAGSearch()" style="margin-top:8px; width:100%; padding:8px; background:var(--accent); color:white; border:none; border-radius:8px; cursor:pointer;">
                        <i data-lucide="sparkles" size="14" style="margin-right:4px;"></i>搜索
                    </button>
                </div>
            `;
        }

        // RAG 主题列表
        if (sec.isRAGTopics) {
            const topicsContainer = document.createElement('div');
            topicsContainer.id = 'ragTopicsContainer';
            topicsContainer.style.padding = '4px';
            listEl.appendChild(topicsContainer);
            loadRAGTopics();
        }

        secEl.appendChild(listEl);
        container.appendChild(secEl);
    });

    if (window.lucide) lucide.createIcons();
}

function renderMain(moduleId) {
    const conf = ModuleConfig.find(m => m.id === moduleId);
    const container = $('dynamicMainContent');
    if (!container) return;

    container.innerHTML = `
        <div class="headline-section">
            <div style="display:flex; justify-content:space-between; align-items:center;">
                <div>
                    <h1>${moduleId === 'overview' ? 'New session' : conf.main.title}</h1>
                    <p>${moduleId === 'overview' ? 'Ask anything. We’ll respond with dialogue + interactive views.' : 'Module active: ' + conf.label}</p>
                </div>
                ${moduleId !== 'overview' ? `<button class="btn-secondary" onclick="switchToModule('overview')" style="display:flex; align-items:center; gap:6px; padding:8px 12px; border-radius:10px;"><i data-lucide="arrow-left" size="14"></i> 返回上一级</button>` : ''}
            </div>
        </div>
    `;

    conf.main.widgets.forEach(w => {
        if (w.type === 'kpiRow') {
            const row = document.createElement('div');
            row.className = 'kpi-row';
            w.cards.forEach(c => {
                row.innerHTML += `
                    <div class="kpi-card">
                        <span class="kpi-title">${c.label}</span>
                        <div style="display:flex; align-items:baseline; gap:8px;">
                             <span class="kpi-value">${c.val}</span>
                             <i data-lucide="${c.icon}" size="14" style="opacity:0.4;"></i>
                        </div>
                    </div>
                `;
            });
            container.appendChild(row);
        } else if (w.type === 'bento') {
            const grid = document.createElement('div');
            grid.className = 'bento-grid';
            w.cards.forEach(c => {
                if (c.type === 'quickActions') {
                    grid.innerHTML += `
                        <div class="dashboard-card">
                             <div class="card-header-row"><span class="card-title">${c.title}</span><i data-lucide="${c.icon}" size="16"></i></div>
                             <ul class="quick-list" id="quickModuleList"><li class="quick-list-item">Loading...</li></ul>
                        </div>
                    `;
                } else if (c.type === 'recommended') {
                    grid.innerHTML += `
                        <div class="dashboard-card">
                             <div class="card-header-row"><span class="card-title">${c.title}</span><i data-lucide="${c.icon}" size="16"></i></div>
                             <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px;">
                                <div class="quick-list-item" style="justify-content:center; height:60px;">高一向量</div>
                                <div class="quick-list-item" style="justify-content:center; height:60px;">高二概率</div>
                                <div class="quick-list-item" style="justify-content:center; height:60px;">导数</div>
                                <div class="quick-list-item" style="justify-content:center; height:60px;">解析几何</div>
                             </div>
                        </div>
                    `;
                } else if (c.type === 'inverted') {
                    grid.innerHTML += `
                        <div class="dashboard-card inverted">
                             <div class="card-header-row"><span class="card-title">${c.title}</span><i data-lucide="star" size="16"></i></div>
                             <div style="font-size:24px; font-weight:700;">${c.topic}</div>
                             <div style="font-size:13px; opacity:0.7;">${c.desc}</div>
                             <button style="margin-top:auto; background:white; color:black; border:none; padding:8px 16px; border-radius:8px; font-weight:600;">Explore</button>
                        </div>
                    `;
                }
            });
            container.appendChild(grid);
            loadQuickActions();
        } else if (w.type === 'timelineStream') {
            const stream = document.createElement('div');
            stream.className = 'timeline-stream';
            w.items.forEach(it => {
                stream.innerHTML += `
                    <div class="timeline-item">
                        <div class="timeline-dot" style="${it.active ? 'background:var(--accent)' : ''}"></div>
                        <div class="timeline-content">
                            <div style="font-size:12px; opacity:0.5;">${it.date}</div>
                            <div style="font-weight:600; font-size:15px;">${it.title}</div>
                            <div style="font-size:13px; opacity:0.7;">${it.desc}</div>
                        </div>
                    </div>
                `;
            });
            container.appendChild(stream);
        } else if (w.type === 'editor') {
            const editor = document.createElement('div');
            editor.className = 'editor-workspace';
            editor.innerHTML = `
                <div class="editor-main">
                    <div class="form-group">
                        <label>Title</label>
                        <input type="text" class="form-input" placeholder="e.g. Pythagoras Theorem">
                    </div>
                    <div class="form-group">
                        <label>Content (Markdown/LaTeX)</label>
                        <textarea class="form-input" placeholder="Write definition here..."></textarea>
                    </div>
                    <button class="btn-primary" style="background:var(--accent); color:white; border:none; padding:12px; border-radius:12px; font-weight:600;">Save Knowledge Card</button>
                </div>
                <div class="editor-sidebar">
                    <div class="kpi-card">
                        <span class="kpi-title">Guidelines</span>
                        <p style="font-size:12px; opacity:0.6;">Use $$ for LaTeX formulas. Keep definitions concise.</p>
                    </div>
                </div>
            `;
            container.appendChild(editor);
        } else if (w.type === 'heatmap') {
            const heatmap = document.createElement('div');
            heatmap.className = 'dashboard-card';
            heatmap.innerHTML = `
                <div class="card-header-row"><span class="card-title">${w.title}</span><i data-lucide="map" size="16"></i></div>
                <div class="heatmap-grid">
                    ${Array.from({ length: 40 }, () => `<div class="heatmap-cell level-${Math.floor(Math.random() * 5)}"></div>`).join('')}
                </div>
                <p style="font-size:12px; opacity:0.5; margin-top:10px;">${w.desc}</p>
            `;
            container.appendChild(heatmap);
        } else if (w.type === 'ragStatus') {
            const statusCard = document.createElement('div');
            statusCard.className = 'dashboard-card';
            statusCard.innerHTML = `
                <div class="card-header-row"><span class="card-title">${w.title}</span><i data-lucide="info" size="16"></i></div>
                <div id="ragStatusInfo" style="font-size:14px; color:var(--text);">加载知识库状态...</div>
            `;
            container.appendChild(statusCard);
            updateRAGStatus();
        } else if (w.type === 'ragSearchResults') {
            const resultsWrapper = document.createElement('div');
            resultsWrapper.id = 'ragSearchResultsWrapper';
            resultsWrapper.innerHTML = '<p style="color:var(--muted); font-size:14px;">在左侧输入关键词搜索，或点击主题浏览内容。</p>';
            container.appendChild(resultsWrapper);
        } else if (w.type === 'shortTermPractice') {
            const card = document.createElement('div');
            card.className = 'dashboard-card';
            card.style.background = 'linear-gradient(135deg, rgba(227, 75, 114, 0.05) 0%, rgba(255, 255, 255, 1) 100%)';
            card.innerHTML = `
                <div class="card-header-row">
                    <span class="card-title">${w.title}</span>
                    <i data-lucide="zap" size="18" style="color:var(--accent);"></i>
                </div>
                <div style="padding:10px 0;">
                    <p style="font-size:14px; opacity:0.8; margin-bottom:15px;" id="practice-status">当前正在进行：<strong>集合专题速通</strong></p>
                    <div style="background:var(--surface); border-radius:16px; padding:20px; border:1px solid var(--border); max-height: 500px; overflow-y: auto;" id="practice-card">
                        <div style="font-weight:600; margin-bottom:12px;" id="practice-question">点击左侧专题或下方按钮开始练习。</div>
                        <div style="display:flex; flex-direction:column; gap:8px;" id="practice-options">
                        </div>
                    </div>
                    <div style="margin-top:20px; display:flex; gap:12px; flex-wrap: wrap;">
                        <button class="btn-primary" onclick="handleSubmitPractice()" style="flex:1; min-width: 120px; background:var(--accent); color:white; border:none; padding:12px; border-radius:12px; font-weight:600;">提交并追问 AI</button>
                        <button class="btn-secondary" onclick="refreshPractice()" style="flex:1; min-width: 100px; background:var(--surface); border:1px solid var(--border); padding:12px; border-radius:12px; font-weight:600; display:flex; align-items:center; justify-content:center; gap:8px;">
                            <i data-lucide="refresh-cw" size="16"></i> 换一批
                        </button>
                        <button class="btn-secondary" onclick="generateAIPractice()" style="flex:1; min-width: 130px; background:var(--surface); color:var(--text); border:1px solid var(--border); padding:12px; border-radius:12px; font-weight:600; display:flex; align-items:center; justify-content:center; gap:8px;">
                            <i data-lucide="sparkles" size="16" style="color:var(--accent);"></i> AI 生题
                        </button>
                        <button class="btn-secondary" onclick="nextPractice()" style="width:50px; border-radius:12px;"><i data-lucide="chevron-right" size="18"></i></button>
                    </div>
                </div>
            `;
            container.appendChild(card);
        } else if (w.type === 'knowledgeGraph') {
            const card = document.createElement('div');
            card.className = 'dashboard-card';
            card.style.height = '400px';
            card.innerHTML = `
                <div class="card-header-row">
                    <span class="card-title">${w.title}</span>
                    <i data-lucide="network" size="18" style="color:var(--accent);"></i>
                </div>
                <div id="kg-container" style="width:100%; height:320px; display:flex; align-items:center; justify-content:center; background:rgba(0,0,0,0.02); border-radius:12px; position:relative; overflow:hidden;">
                    <div style="text-align:center; opacity:0.3;" id="kg-loading">
                        <i data-lucide="share-2" size="48" style="margin-bottom:10px; display:block; margin-left:auto; margin-right:auto;"></i>
                        <span>正在构建高精地图...</span>
                    </div>
                    <!-- Nodes will be injected here -->
                </div>
            `;
            container.appendChild(card);
            setTimeout(renderInteractiveKG, 100);
        } else if (w.type === 'ebbinghaus') {
            const card = document.createElement('div');
            card.className = 'dashboard-card';
            card.innerHTML = `
                <div class="card-header-row">
                    <span class="card-title">${w.title}</span>
                    <i data-lucide="calendar" size="18" style="color:var(--accent);"></i>
                </div>
                <div style="padding:15px 0;">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                        <span style="font-size:14px; font-weight:600;">遗忘权重分布 (Ebbinghaus)</span>
                        <span style="font-size:12px; color:var(--muted);">下次复习：明天 09:00</span>
                    </div>
                    <div style="height:120px; display:flex; align-items:flex-end; gap:8px; padding-bottom:20px; border-bottom:1px solid var(--border);">
                        ${[80, 60, 45, 35, 30, 28, 26].map((h, i) => `
                            <div style="flex:1; background:var(--accent); height:${h}%; opacity:${1 - i * 0.1}; border-radius:4px; position:relative;">
                                <span style="position:absolute; bottom:-20px; left:50%; transform:translateX(-50%); font-size:10px; opacity:0.6;">D${i + 1}</span>
                            </div>
                        `).join('')}
                    </div>
                    <div style="margin-top:15px;">
                        <div style="display:flex; justify-content:space-between; font-size:13px; margin-bottom:8px;">
                            <span>函数解析式研究</span>
                            <span style="color:var(--accent);">进行中</span>
                        </div>
                        <div style="width:100%; height:6px; background:var(--surface); border-radius:3px;">
                            <div style="width:75%; height:100%; background:var(--accent); border-radius:3px;"></div>
                        </div>
                    </div>
                </div>
            `;
            container.appendChild(card);
        }
    });

    if (window.lucide) lucide.createIcons();
}

// --- Core UI Logic ---

function setMode(mode) {
    AppState.mode = mode;
    if (mode === 'chat') {
        document.body.classList.add('mode-chat');
        setTimeout(() => {
            const plotDiv = $('plotlyDiv');
            if (plotDiv && plotDiv.data) Plotly.Plots.resize(plotDiv);
        }, 650);
    } else {
        document.body.classList.remove('mode-chat');
        $('chatMessages').innerHTML = '';
    }
}

function renderParityApps(container) {
    container.innerHTML = `
        <div style="display:flex; height:100%; gap:20px; padding:20px;">
            <div style="width:220px; flex-shrink:0; background:#f8fafc; border-radius:12px; padding:10px; overflow-y:auto; height: 100%;">
                <h3 style="padding:10px; margin:0; border-bottom:1px solid #e2e8f0; font-size:16px;">重要结论</h3>
                <div class="nav-pills" id="apps-nav" style="margin-top:10px;">
                    <div class="nav-item active" data-target="c1">1. 定义域对称性</div>
                    <div class="nav-item" data-target="c2">2. 图像对称性</div>
                    <div class="nav-item" data-target="c3">3. 构造奇偶函数</div>
                    <div class="nav-item" data-target="c4">4. 函数分解公式</div>
                    <div class="nav-item" data-target="c5">5. 奇偶函数运算</div>
                    <div class="nav-item" data-target="c6">6. 既奇又偶函数</div>
                    <div class="nav-item" data-target="c7">7. 奇函数在0处</div>
                    <div class="nav-item" data-target="c8">8. 多项式系数</div>
                </div>
            </div>
            <div id="apps-content" style="flex:1; overflow-y:auto; background:#fff; border-radius:12px; padding:20px; border:1px solid #e2e8f0;">
            </div>
        </div>
    `;

    const navItems = container.querySelectorAll('.nav-item');
    const content = container.querySelector('#apps-content');

    function loadContent(target) {
        content.innerHTML = '';
        const renderers = {
            'c1': renderConclusion1,
            'c2': renderConclusion2,
            'c3': renderConclusion3,
            'c4': renderConclusion4,
            'c5': renderConclusion5,
            'c6': renderConclusion6,
            'c7': renderConclusion7,
            'c8': renderConclusion8
        };
        if (renderers[target]) renderers[target](content);
        if (window.MathJax) MathJax.typesetPromise();
    }

    navItems.forEach(item => {
        item.onclick = () => {
            navItems.forEach(n => n.classList.remove('active'));
            item.classList.add('active');
            loadContent(item.dataset.target);
        };
    });

    loadContent('c1');
}

function renderConclusion1(container) {
    container.innerHTML = `
        <h3>结论1：定义域对称性</h3>
        <p>具有奇偶性的函数，其定义域关于原点对称。</p>
        <div class="formula-box">$$ x \\in D \\Rightarrow -x \\in D $$</div>
        
        <div style="margin-top:20px; padding:20px; background:#f8fafc; border-radius:8px;">
            <p><strong>互动演示：</strong>调整定义域区间 $[a, b]$</p>
            <div style="margin-bottom:10px;">
                <label>a = <input type="number" id="val-a" value="-5" step="1" style="width:60px;"></label>
                <label style="margin-left:20px;">b = <input type="number" id="val-b" value="5" step="1" style="width:60px;"></label>
            </div>
            <div id="domain-viz" style="height:100px;"></div>
            <div id="domain-msg" style="margin-top:10px; font-weight:bold;"></div>
        </div>
    `;

    const inputA = container.querySelector('#val-a');
    const inputB = container.querySelector('#val-b');

    function update() {
        const a = parseFloat(inputA.value);
        const b = parseFloat(inputB.value);

        const isSymmetric = (a === -b);

        const trace = {
            x: [a, b],
            y: [0, 0],
            mode: 'lines+markers',
            line: { width: 5, color: isSymmetric ? '#3b82f6' : '#ef4444' },
            marker: { size: 10 }
        };

        const layout = {
            title: `区间 [${a}, ${b}]`,
            height: 100,
            margin: { t: 30, b: 30, l: 20, r: 20 },
            xaxis: { range: [-10, 10], zeroline: true },
            yaxis: { visible: false }
        };

        Plotly.newPlot('domain-viz', [trace], layout, { displayModeBar: false });

        const msg = container.querySelector('#domain-msg');
        msg.innerHTML = isSymmetric
            ? '<span style="color:green">✔ 定义域关于原点对称，可能具有奇偶性</span>'
            : '<span style="color:red">✘ 定义域不关于原点对称，一定是非奇非偶函数</span>';
    }

    inputA.oninput = update;
    inputB.oninput = update;
    update();
}

function renderConclusion2(container) {
    container.innerHTML = `
        <h3>结论2：图像对称性</h3>
        <ul>
            <li>偶函数 $\\Leftrightarrow$ 图像关于 y 轴对称</li>
            <li>奇函数 $\\Leftrightarrow$ 图像关于原点对称</li>
        </ul>
        
        <div style="margin-top:20px;">
            <button class="btn-primary" id="btn-even">展示偶函数对称性</button>
            <button class="btn-secondary" id="btn-odd">展示奇函数对称性</button>
        </div>
        <div id="sym-plot" style="height:300px; margin-top:20px;"></div>
    `;

    const btnEven = container.querySelector('#btn-even');
    const btnOdd = container.querySelector('#btn-odd');

    function plot(type) {
        const x = [];
        const y = [];
        for (let i = -3; i <= 3; i += 0.1) {
            x.push(i);
            y.push(type === 'even' ? i * i : i * i * i);
        }

        const trace = { x, y, type: 'scatter', name: 'f(x)' };
        const layout = {
            title: type === 'even' ? '偶函数：关于y轴对称' : '奇函数：关于原点对称',
            xaxis: { zeroline: true },
            yaxis: { zeroline: true }
        };

        // Add symmetry indicators
        if (type === 'even') {
            layout.shapes = [{
                type: 'line', x0: 0, y0: -10, x1: 0, y1: 10,
                line: { color: 'red', width: 2, dash: 'dash' }
            }];
        } else {
            layout.annotations = [{
                x: 0, y: 0, text: '对称中心', showarrow: true, arrowhead: 2
            }];
        }

        Plotly.newPlot('sym-plot', [trace], layout, { displayModeBar: false });
    }

    btnEven.onclick = () => plot('even');
    btnOdd.onclick = () => plot('odd');
    plot('even');
}

function renderConclusion3(container) {
    container.innerHTML = `
        <h3>结论3：构造奇偶函数</h3>
        <p>若定义域关于原点对称，则：</p>
        <div class="formula-box">$$ F(x) = f(x) + f(-x) \\quad (\\text{偶函数}) $$</div>
        <div class="formula-box">$$ G(x) = f(x) - f(-x) \\quad (\\text{奇函数}) $$</div>
        
        <div style="margin-top:20px;">
            <p>示例函数 $f(x) = e^x$</p>
            <div id="cons-plot" style="height:300px;"></div>
        </div>
    `;

    const x = [];
    const yF = [], yEven = [], yOdd = [];

    for (let i = -2; i <= 2; i += 0.1) {
        x.push(i);
        const f = Math.exp(i);
        const f_neg = Math.exp(-i);
        yF.push(f);
        yEven.push(f + f_neg);
        yOdd.push(f - f_neg);
    }

    const traces = [
        { x, y: yF, name: 'f(x)=e^x', line: { dash: 'dot' } },
        { x, y: yEven, name: 'f(x)+f(-x) (偶)' },
        { x, y: yOdd, name: 'f(x)-f(-x) (奇)' }
    ];

    Plotly.newPlot('cons-plot', traces, { title: '构造演示' }, { displayModeBar: false });
}

function renderConclusion4(container) {
    container.innerHTML = `
        <h3>结论4：函数分解公式</h3>
        <p>任意定义域关于原点对称的函数，都可以唯一分解为一个奇函数与一个偶函数之和。</p>
        <div class="formula-box">$$ f(x) = \\frac{f(x)+f(-x)}{2} + \\frac{f(x)-f(-x)}{2} $$</div>
        <p>即 $f(x) = \\text{偶部} + \\text{奇部}$</p>
    `;
    renderConclusion3(container); // Reuse visualization
    container.querySelector('h3').innerText = "结论4：函数分解公式"; // Patch title
}

function renderConclusion5(container) {
    container.innerHTML = `
        <h3>结论5：奇偶函数运算规律</h3>
        <table style="width:100%; border-collapse:collapse; margin-top:20px;">
            <tr style="background:#f1f5f9;">
                <th style="padding:8px; border:1px solid #cbd5e1;">运算</th>
                <th style="padding:8px; border:1px solid #cbd5e1;">结果</th>
            </tr>
            <tr><td style="padding:8px; border:1px solid #cbd5e1;">奇 ± 奇</td><td style="padding:8px; border:1px solid #cbd5e1;">奇</td></tr>
            <tr><td style="padding:8px; border:1px solid #cbd5e1;">偶 ± 偶</td><td style="padding:8px; border:1px solid #cbd5e1;">偶</td></tr>
            <tr><td style="padding:8px; border:1px solid #cbd5e1;">奇 × 奇</td><td style="padding:8px; border:1px solid #cbd5e1;">偶</td></tr>
            <tr><td style="padding:8px; border:1px solid #cbd5e1;">偶 × 偶</td><td style="padding:8px; border:1px solid #cbd5e1;">偶</td></tr>
            <tr><td style="padding:8px; border:1px solid #cbd5e1;">奇 × 偶</td><td style="padding:8px; border:1px solid #cbd5e1;">奇</td></tr>
        </table>
        <div style="margin-top:20px; font-style:italic; color:gray;">注：前提是定义域交集关于原点对称且非空。</div>
    `;
}

function renderConclusion6(container) {
    container.innerHTML = `
        <h3>结论6：既奇又偶函数</h3>
        <p>若 $f(x)$ 既是奇函数又是偶函数，则 $f(x) = 0$ (在定义域内)。</p>
        <div class="formula-box">$$ f(x) = 0, x \\in D $$</div>
        <div id="zero-plot" style="height:200px;"></div>
    `;

    Plotly.newPlot('zero-plot', [{
        x: [-5, 5], y: [0, 0], mode: 'lines', line: { width: 4, color: 'purple' }
    }], {
        title: 'f(x) = 0', xaxis: { range: [-5, 5] }, yaxis: { range: [-2, 2] }
    }, { displayModeBar: false });
}

function renderConclusion7(container) {
    container.innerHTML = `
        <h3>结论7：奇函数在 0 处取值</h3>
        <p>若奇函数在 $x=0$ 处有定义，则必有：</p>
        <div class="formula-box">$$ f(0) = 0 $$</div>
        <div id="odd-zero-plot" style="height:250px;"></div>
    `;

    const x = [], y = [];
    for (let i = -2; i <= 2; i += 0.1) { x.push(i); y.push(Math.sin(i)); }

    Plotly.newPlot('odd-zero-plot', [
        { x, y, type: 'scatter', name: 'sin(x)' },
        { x: [0], y: [0], mode: 'markers', marker: { size: 12, color: 'red' }, name: '(0,0)' }
    ], {
        title: '例如 f(x)=sin(x), f(0)=0'
    }, { displayModeBar: false });
}

function renderConclusion8(container) {
    container.innerHTML = `
        <h3>结论8：多项式函数判定</h3>
        <p>$f(x) = a_n x^n + \\dots + a_1 x + a_0$</p>
        <ul>
            <li>奇函数 $\\Leftrightarrow$ 偶次项系数全为 0</li>
            <li>偶函数 $\\Leftrightarrow$ 奇次项系数全为 0</li>
        </ul>
        
        <div style="background:#f8fafc; padding:15px; border-radius:8px;">
            <div style="display:flex; gap:10px; flex-wrap:wrap;">
                <label>a3 ($x^3$): <input type="range" min="-2" max="2" step="1" value="1" id="c-a3"> <span id="v-a3">1</span></label>
                <label>a2 ($x^2$): <input type="range" min="-2" max="2" step="1" value="0" id="c-a2"> <span id="v-a2">0</span></label>
                <label>a1 ($x^1$): <input type="range" min="-2" max="2" step="1" value="0" id="c-a1"> <span id="v-a1">0</span></label>
                <label>a0 ($x^0$): <input type="range" min="-2" max="2" step="1" value="0" id="c-a0"> <span id="v-a0">0</span></label>
            </div>
            <div id="poly-status" style="margin-top:10px; font-weight:bold; min-height:24px;"></div>
        </div>
        <div id="poly-plot" style="height:250px;"></div>
    `;

    const inputs = ['a3', 'a2', 'a1', 'a0'].map(id => container.querySelector('#c-' + id));
    const displays = ['a3', 'a2', 'a1', 'a0'].map(id => container.querySelector('#v-' + id));

    function update() {
        const coeffs = inputs.map(inp => parseFloat(inp.value));
        coeffs.forEach((v, i) => displays[i].innerText = v);

        const [a3, a2, a1, a0] = coeffs;

        const x = [], y = [];
        for (let i = -2; i <= 2; i += 0.1) {
            x.push(i);
            y.push(a3 * i * i * i + a2 * i * i + a1 * i + a0);
        }

        Plotly.newPlot('poly-plot', [{ x, y, type: 'scatter' }], { margin: { t: 20, b: 20 } }, { displayModeBar: false });

        const isOdd = (a2 === 0 && a0 === 0);
        const isEven = (a3 === 0 && a1 === 0);

        const status = container.querySelector('#poly-status');
        if (isOdd && isEven) status.innerHTML = "<span style='color:purple'>既奇又偶 (零多项式)</span>";
        else if (isOdd) status.innerHTML = "<span style='color:blue'>奇函数 (偶次项系数为0)</span>";
        else if (isEven) status.innerHTML = "<span style='color:green'>偶函数 (奇次项系数为0)</span>";
        else status.innerHTML = "<span style='color:gray'>非奇非偶</span>";
    }

    inputs.forEach(inp => inp.oninput = update);
    update();
}

function toggleTheme() {
    document.body.classList.toggle('dark-mode');
}

// --- Knowledge Management (Simplified) ---

async function loadKnowledgeTree() {
    try {
        const tree = await fetchJSON("/knowledge/tree");
        const container = $('projectTreeContainer');
        if (!container) return;
        container.innerHTML = '';

        for (const [subject, chapters] of Object.entries(tree)) {
            const subjEl = createTreeItem(subject, 'folder-kanban', true);
            container.appendChild(subjEl);

            const subjChildren = document.createElement('div');
            subjChildren.className = 'tree-children';
            subjChildren.style.paddingLeft = '16px';
            subjChildren.style.display = 'none';
            container.appendChild(subjChildren);

            subjEl.onclick = () => {
                const isHidden = subjChildren.style.display === 'none';
                subjChildren.style.display = isHidden ? 'block' : 'none';
                subjEl.querySelector('i[data-lucide^="chevron"]').setAttribute('data-lucide', isHidden ? 'chevron-down' : 'chevron-right');
                lucide.createIcons();
            };

            for (const [chapter, sections] of Object.entries(chapters)) {
                const chapEl = createTreeItem(chapter, 'book-open', true);
                subjChildren.appendChild(chapEl);

                const chapChildren = document.createElement('div');
                chapChildren.className = 'tree-children';
                chapChildren.style.paddingLeft = '16px';
                chapChildren.style.display = 'none';
                subjChildren.appendChild(chapChildren);

                chapEl.onclick = (e) => {
                    e.stopPropagation();
                    const isHidden = chapChildren.style.display === 'none';
                    chapChildren.style.display = isHidden ? 'block' : 'none';
                    chapEl.querySelector('i[data-lucide^="chevron"]').setAttribute('data-lucide', isHidden ? 'chevron-down' : 'chevron-right');
                    lucide.createIcons();
                };

                for (const [section, points] of Object.entries(sections)) {
                    const secEl = createTreeItem(section, 'layers', true);
                    chapChildren.appendChild(secEl);

                    const secChildren = document.createElement('div');
                    secChildren.className = 'tree-children';
                    secChildren.style.paddingLeft = '16px';
                    secChildren.style.display = 'none';
                    chapChildren.appendChild(secChildren);

                    secEl.onclick = (e) => {
                        e.stopPropagation();
                        const isHidden = secChildren.style.display === 'none';
                        secChildren.style.display = isHidden ? 'block' : 'none';
                        secEl.querySelector('i[data-lucide^="chevron"]').setAttribute('data-lucide', isHidden ? 'chevron-down' : 'chevron-right');
                        lucide.createIcons();
                    };

                    points.forEach(point => {
                        const pointEl = createTreeItem(point.title, 'circle', false);
                        pointEl.style.fontSize = '12px';
                        pointEl.style.opacity = '0.8';
                        secChildren.appendChild(pointEl);

                        pointEl.onclick = (e) => {
                            e.stopPropagation();
                            activateKnowledgePoint(point.id);
                        };
                    });
                }
            }
        }
        lucide.createIcons();
    } catch (e) { console.error("Failed to load knowledge tree:", e); }
}

async function activateKnowledgePoint(nodeId) {
    try {
        const node = await fetchJSON(`/knowledge/node/${nodeId}`);
        setMode('chat');

        const chatLog = $('chatMessages');
        chatLog.innerHTML = '';
        addChatMessage('ai', `正在为您加载知识点：**${node.title}**\n\n${node.details || ''}`);

        $('viewTitle').innerText = node.title;
        renderView({
            view_id: node.viz.viz_id,
            viz_args: node.viz.viz_args || {},
            params: {}
        });

    } catch (e) {
        console.error("Failed to activate node:", e);
    }
}

function createTreeItem(label, icon, hasChevron) {
    const div = document.createElement('div');
    div.className = 'tree-item';
    div.style.padding = '6px 8px';
    div.style.display = 'flex';
    div.style.alignItems = 'center';
    div.style.gap = '8px';
    let html = hasChevron ? `<i data-lucide="chevron-right" size="14"></i>` : '';
    html += `<i data-lucide="${icon}" size="14"></i><span>${label}</span>`;
    div.innerHTML = html;
    return div;
}

async function loadQuickActions() {
    try {
        const actions = await fetchJSON("/knowledge/quick_actions");
        const list = $('quickModuleList');
        if (list) {
            list.innerHTML = '';
            actions.forEach(a => {
                const li = document.createElement('li');
                li.className = 'quick-list-item';
                li.innerHTML = `<i data-lucide="zap" size="14" style="color:var(--accent)"></i><span>${a.title}</span>`;
                li.onclick = () => {
                    setMode('chat');
                    $('viewTitle').innerText = a.title;
                    renderView({
                        view_id: a.view_id,
                        viz_args: a.viz_args || {},
                        params: a.default_params || {}
                    });
                };
                list.appendChild(li);
            });
            lucide.createIcons();
        }
    } catch (e) { }
}

// --- Chat & Viz ---

function addChatMessage(role, text) {
    const log = $('chatMessages');
    const div = document.createElement('div');
    div.style.marginBottom = '16px';
    div.style.display = 'flex';
    div.style.gap = '12px';
    div.style.justifyContent = role === 'user' ? 'flex-end' : 'flex-start';
    const isUser = role === 'user';
    let content = text.replace(/\n/g, "<br>").replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");

    // 隐藏 plotly 代码块并添加提示
    if (!isUser && content.includes('```plotly')) {
        content = content.replace(/```plotly[\s\S]*?```/g, `
            <div class="viz-hint-box" onclick="switchToModule('overview'); setMode('chat');" style="margin: 10px 0; padding: 12px; background: rgba(var(--accent-rgb), 0.1); border: 1px dashed var(--accent); border-radius: 12px; cursor: pointer; display: flex; align-items: center; gap: 10px;">
                <div style="width: 32px; height: 32px; background: var(--accent); border-radius: 8px; display: flex; align-items: center; justify-content: center; color: white;">
                    <i data-lucide="line-chart" size="16"></i>
                </div>
                <div>
                    <div style="font-weight: 600; font-size: 13px; color: var(--accent);">交互式数学图像已生成</div>
                    <div style="font-size: 11px; opacity: 0.7;">点击或查看右侧探索面板</div>
                </div>
            </div>
        `);
    }

    div.innerHTML = `
        ${isUser ? '' : '<div style="width:36px; height:36px; background:var(--accent); border-radius:12px; display:flex; align-items:center; justify-content:center; color:white; flex-shrink:0;">A</div>'}
        <div class="message-bubble" style="${isUser ? 'background:var(--accent); color:white;' : 'background:var(--surface);'} padding:12px 16px; border-radius:16px; max-width:85%;">
            ${content}
        </div>
    `;
    log.appendChild(div);
    log.scrollTop = log.scrollHeight;
    if (window.MathJax) MathJax.typesetPromise();
}

async function handleSendMessage() {
    const input = $('mainInput');
    const text = input.value.trim();
    if (!text) return;
    setMode('chat');
    addChatMessage('user', text);
    input.value = '';
    // Mock response
    setTimeout(() => addChatMessage('ai', `I've received your query about **${text}**. Let me analyze that for you.`), 500);
}

async function renderView(viewSpec) {
    AppState.currentViewId = viewSpec.view_id;
    AppState.params = { ...viewSpec.params };

    const controls = $('viewControls');
    const plotContainer = $('plotlyDiv');
    const labOverlay = $('labOverlay');

    // Reset all views
    plotContainer.classList.remove('lab-mode');
    plotContainer.style.display = 'block';
    controls.style.display = 'block';
    controls.innerHTML = '';
    plotContainer.innerHTML = '';
    if (labOverlay) {
        labOverlay.classList.remove('active');
        labOverlay.innerHTML = '';
    }

    // Specialized Logic for math visualizations
    if (viewSpec.view_id === "quadratic_inequality") {
        createControl(controls, "a", AppState.params.a || 1, -5, 5, 0.1);
        await updatePlot_Quadratic();
    } else if (viewSpec.view_id === "trig_func_params") {
        createControl(controls, "A", AppState.params.A || 1, 0.1, 5, 0.1);
        await updatePlot_Trig();
    } else if (viewSpec.view_id === "set_properties_lab") {
        controls.style.display = 'none';
        plotContainer.style.display = 'none';
        if (labOverlay) {
            labOverlay.classList.add('active');
            initSetPropertiesLab(labOverlay);
        }
    } else if (viewSpec.view_id === "subset_generator") {
        controls.style.display = 'none';
        plotContainer.style.display = 'none';
        if (labOverlay) {
            labOverlay.classList.add('active');
            renderSubsetGenerator(labOverlay);
        }
    } else if (viewSpec.view_id === "venn_logic_lab") {
        controls.style.display = 'none';
        plotContainer.style.display = 'none';
        if (labOverlay) {
            labOverlay.classList.add('active');
            renderVennLogicLab(labOverlay);
        }
    } else if (viewSpec.view_id === "inequality_properties_lab") {
        controls.style.display = 'none';
        plotContainer.style.display = 'none';
        if (labOverlay) {
            labOverlay.classList.add('active');
            renderInequalityProperties(labOverlay);
        }
    } else if (viewSpec.view_id === "inequality_solver_lab") {
        controls.style.display = 'none';
        plotContainer.style.display = 'none';
        if (labOverlay) {
            labOverlay.classList.add('active');
            renderInequalitySolver(labOverlay);
        }
    } else if (viewSpec.view_id === "inequality_basic_lab") {
        controls.style.display = 'none';
        plotContainer.style.display = 'none';
        if (labOverlay) {
            labOverlay.classList.add('active');
            renderBasicInequality(labOverlay);
        }
    } else if (viewSpec.view_id === "function_concept_lab") {
        controls.style.display = 'none';
        plotContainer.style.display = 'none';
        if (labOverlay) {
            labOverlay.classList.add('active');
            renderFunctionConcept(labOverlay);
        }
    } else if (viewSpec.view_id === "function_operations_lab") {
        controls.style.display = 'none';
        plotContainer.style.display = 'none';
        if (labOverlay) {
            labOverlay.classList.add('active');
            renderFunctionOperations(labOverlay);
        }
    } else if (viewSpec.view_id === "function_composite_lab") {
        controls.style.display = 'none';
        plotContainer.style.display = 'none';
        if (labOverlay) {
            labOverlay.classList.add('active');
            renderFunctionComposite(labOverlay);
        }
    } else if (viewSpec.view_id === "function_domain_range_lab") {
        controls.style.display = 'none';
        plotContainer.style.display = 'none';
        if (labOverlay) {
            labOverlay.classList.add('active');
            renderFunctionDomainRange(labOverlay);
        }
    } else if (viewSpec.view_id === "function_expression_lab") {
        controls.style.display = 'none';
        plotContainer.style.display = 'none';
        if (labOverlay) {
            labOverlay.classList.add('active');
            renderFunctionExpression(labOverlay);
        }
    } else if (viewSpec.view_id === "function_parity_lab") {
        controls.style.display = 'none';
        plotContainer.style.display = 'none';
        if (labOverlay) {
            labOverlay.classList.add('active');
            initFunctionParityLab(labOverlay);
        }
    } else if (viewSpec.view_id === "function_monotonicity_lab") {
        controls.style.display = 'none';
        plotContainer.style.display = 'none';
        if (labOverlay) {
            labOverlay.classList.add('active');
            initFunctionMonotonicityLab(labOverlay);
        }
    } else if (viewSpec.view_id === "function_extrema_lab") {
        controls.style.display = 'none';
        plotContainer.style.display = 'none';
        if (labOverlay) {
            labOverlay.classList.add('active');
            initFunctionExtremaLab(labOverlay);
        }
    } else if (viewSpec.view_id === "function_quadratic_lab") {
        controls.style.display = 'none';
        plotContainer.style.display = 'none';
        if (labOverlay) {
            labOverlay.classList.add('active');
            initFunctionQuadraticLab(labOverlay);
        }
    } else if (viewSpec.view_id === "function_fractional_lab") {
        controls.style.display = 'none';
        plotContainer.style.display = 'none';
        if (labOverlay) {
            labOverlay.classList.add('active');
            initFunctionFractionalLab(labOverlay);
        }
    } else if (viewSpec.view_id === "function_power_lab") {
        controls.style.display = 'none';
        plotContainer.style.display = 'none';
        if (labOverlay) {
            labOverlay.classList.add('active');
            initFunctionPowerLab(labOverlay);
        }
    } else if (viewSpec.view_id === "function_exponential_lab") {
        controls.style.display = 'none';
        plotContainer.style.display = 'none';
        if (labOverlay) {
            labOverlay.classList.add('active');
            initFunctionExponentialLab(labOverlay);
        }
    } else if (viewSpec.view_id === "function_inverse_lab") {
        controls.style.display = 'none';
        plotContainer.style.display = 'none';
        if (labOverlay) {
            labOverlay.classList.add('active');
            initFunctionInverseLab(labOverlay);
        }
    } else if (viewSpec.view_id === "function_log_eq_ineq_lab") {
        controls.style.display = 'none';
        plotContainer.style.display = 'none';
        if (labOverlay) {
            labOverlay.classList.add('active');
            initFunctionLogEqIneqLab(labOverlay);
        }
    } else if (viewSpec.view_id === "sequence_lab") {
        controls.style.display = 'none';
        plotContainer.style.display = 'none';
        if (labOverlay) {
            labOverlay.classList.add('active');
            initSequenceLab(labOverlay, viewSpec.viz_args);
        }
    } else if (viewSpec.view_id === "function_log_lab") {
        controls.style.display = 'none';
        plotContainer.style.display = 'none';
        if (labOverlay) {
            labOverlay.classList.add('active');
            initFunctionLogLab(labOverlay);
        }
    } else if (viewSpec.view_id === "function_complex_lab") {
        controls.style.display = 'none';
        plotContainer.style.display = 'none';
        if (labOverlay) {
            labOverlay.classList.add('active');
            initFunctionComplexLab(labOverlay);
        }
    } else if (viewSpec.view_id === "trig_ratio_lab") {
        controls.style.display = 'none';
        plotContainer.style.display = 'none';
        if (labOverlay) {
            labOverlay.classList.add('active');
            initTrigRatioLab(labOverlay);
        }
    } else if (viewSpec.view_id === "trig_function_lab") {
        controls.style.display = 'none';
        plotContainer.style.display = 'none';
        if (labOverlay) {
            labOverlay.classList.add('active');
            initTrigFunctionLab(labOverlay);
        }
    } else if (viewSpec.view_id === "vector_lab") {
        controls.style.display = 'none';
        plotContainer.style.display = 'none';
        if (labOverlay) {
            labOverlay.classList.add('active');
            initVectorLab(labOverlay, viewSpec.viz_args);
        }
    } else if (viewSpec.view_id === "info_card") {
        // Just show info card, keep standard view but maybe clear plot
        plotContainer.innerHTML = `<div style="padding:40px; text-align:center; opacity:0.7;">
            <i data-lucide="book-open" size="48" style="margin-bottom:16px;"></i>
            <h3>${$('viewTitle').innerText}</h3>
            <p>请点击侧边实验台模块进行深度探索</p>
        </div>`;
        if (window.lucide) lucide.createIcons();
    } else {
        controls.innerHTML = `<div style="padding:20px; text-align:center; opacity:0.5;">[View: ${viewSpec.view_id}]<br>Visualization sandbox placeholder.<br>(If you see this for a new lab, please refresh the page to clear cache)</div>`;
    }
}

// --- Dynamic Controls & Plots ---

function createControl(container, label, val, min, max, step) {
    const div = document.createElement('div');
    div.style.marginBottom = '12px';
    div.innerHTML = `
        <div style="display:flex; justify-content:space-between; margin-bottom:4px; font-size:12px; color:var(--muted);">
            <label>${label}</label>
            <span id="disp_${label}">${val}</span>
        </div>
        <input type="range" id="rng_${label}" min="${min}" max="${max}" step="${step}" value="${val}" style="width:100%; accent-color:var(--accent);">
    `;
    container.appendChild(div);
    div.querySelector('input').oninput = (e) => {
        const v = parseFloat(e.target.value);
        div.querySelector('span').innerText = v;
        AppState.params[label] = v;
        requestAnimationFrame(() => refreshCurrentPlot());
    };
}

function refreshCurrentPlot() {
    const vid = AppState.currentViewId;
    if (vid === "quadratic_inequality") updatePlot_Quadratic();
    else if (vid === "trig_func_params") updatePlot_Trig();
}

async function updatePlot_Quadratic() {
    const a = AppState.params.a || 1;
    const xData = [], yData = [];
    for (let i = 0; i <= 100; i++) {
        const x = -5 + 10 * (i / 100);
        xData.push(x); yData.push(a * x * x);
    }
    Plotly.react("plotlyDiv", [{ x: xData, y: yData, mode: 'lines', line: { color: '#E34B72', width: 3 } }], { paper_bgcolor: 'transparent', plot_bgcolor: 'transparent', margin: { t: 20 } });
}

async function updatePlot_Trig() {
    const A = AppState.params.A || 1;
    const xData = [], yData = [];
    for (let i = 0; i <= 200; i++) {
        const x = -Math.PI * 2 + Math.PI * 4 * (i / 200);
        xData.push(x); yData.push(A * Math.sin(x));
    }
    Plotly.react("plotlyDiv", [{ x: xData, y: yData, mode: 'lines', line: { color: '#E34B72', width: 3 } }], { paper_bgcolor: 'transparent', plot_bgcolor: 'transparent', margin: { t: 20 } });
}

// --- Set Properties Lab Logic (Restored) ---

function initSetPropertiesLab(container) {
    AppState.params.lab = {
        mode: 'determinacy',
        elements: [
            { id: 1, val: 'A', name: '元素 A' },
            { id: 2, val: 'B', name: '元素 B' },
            { id: 3, val: 'C', name: '元素 C' }
        ],
        list: ['元素 A', '元素 B', '元素 C'],
        order: ['元素 A', '元素 B', '元素 C'],
        uncertainty: false,
        explainerText: '集合的元素必须是<b>确定</b>的。归属判定必须明确（是/否）。'
    };

    container.innerHTML = `
        <div class="lab-container">
            <div class="lab-header">
                <div class="lab-badges">
                    <div id="badge_det" class="badge">确定性</div>
                    <div id="badge_dist" class="badge">互异性</div>
                    <div id="badge_dis" class="badge">无序性</div>
                </div>
                <div class="viz-actions">
                    <button id="btn_toggle_lab" class="btn-secondary" title="切换模式"><i data-lucide="refresh-cw"></i></button>
                </div>
            </div>
            <div id="lab_canvas" class="lab-canvas"></div>
            <div id="explainer_card" class="explainer-card">
                <div class="explainer-title">观察与结论</div>
                <div id="explainer_text">${AppState.params.lab.explainerText}</div>
            </div>
            <div class="lab-controls" style="display:flex; gap:10px;">
                <button id="lab_btn_action" class="btn-secondary" style="flex:1"></button>
            </div>
        </div>
    `;
    lucide.createIcons();
    attachLabEvents();
    renderLabMode();
}

function attachLabEvents() {
    $('badge_det').onclick = () => { AppState.params.lab.mode = 'determinacy'; renderLabMode(); };
    $('badge_dist').onclick = () => { AppState.params.lab.mode = 'distinctness'; renderLabMode(); };
    $('badge_dis').onclick = () => { AppState.params.lab.mode = 'disorder'; renderLabMode(); };
    $('btn_toggle_lab').onclick = () => {
        const modes = ['determinacy', 'distinctness', 'disorder'];
        const idx = modes.indexOf(AppState.params.lab.mode);
        AppState.params.lab.mode = modes[(idx + 1) % modes.length];
        renderLabMode();
    };
}

function renderLabMode() {
    const lab = AppState.params.lab;
    const canvas = $('lab_canvas');
    const actionBtn = $('lab_btn_action');
    const explainerText = $('explainer_text');
    document.querySelectorAll('.badge').forEach(b => b.classList.remove('active', 'error'));
    $(`badge_${lab.mode.substring(0, 3)}`).classList.add('active');
    canvas.innerHTML = '';
    if (lab.mode === 'determinacy') renderDeterminacyMode(canvas, actionBtn, explainerText);
    else if (lab.mode === 'distinctness') renderDistinctnessMode(canvas, actionBtn, explainerText);
    else if (lab.mode === 'disorder') renderDisorderMode(canvas, actionBtn, explainerText);
    if (window.MathJax) MathJax.typesetPromise();
}

function renderDeterminacyMode(canvas, btn, text) {
    const lab = AppState.params.lab;
    text.innerHTML = lab.uncertainty ? "元素 C 的判定规则模糊，导致归属结果<b>不确定</b>。" : "判定结果要么是 <b>True</b>，要么是 <b>False</b>。这就是<b>确定性</b>。";
    btn.innerText = lab.uncertainty ? "恢复确定规则" : "引入模糊规则 (反例)";
    btn.onclick = () => { lab.uncertainty = !lab.uncertainty; renderLabMode(); };
    canvas.innerHTML = `
        <div class="lab-row">
            <div class="lab-column">
                <div class="column-title">宇宙集</div>
                <div id="u_elements" class="lab-box"></div>
            </div>
            <div class="lab-column" style="flex:0.7; align-items:center; justify-content:center;">
                <div style="font-size:12px; font-weight:700; background:rgba(0,0,0,0.05); padding:4px 8px; border-radius:4px;">${lab.uncertainty ? "x 是大数 ?" : "x 是偶数"}</div>
            </div>
            <div class="lab-column">
                <div class="column-title">集合 A</div>
                <div id="a_elements" class="lab-box"></div>
            </div>
        </div>
    `;
    const elements = [{ val: 2 }, { val: 5 }, { val: 10 }, { val: 15 }];
    elements.forEach(elt => {
        const isSelected = lab.uncertainty ? (elt.val > 10) : (elt.val % 2 === 0);
        const chip = document.createElement('div');
        chip.className = 'element-chip';
        chip.innerHTML = `<span>元素 ${elt.val}</span><div class="truth-light ${isSelected ? 'true' : 'false'}"></div>`;
        if (isSelected) $('a_elements').appendChild(chip);
        else $('u_elements').appendChild(chip);
    });
}

function renderDistinctnessMode(canvas, btn, text) {
    const lab = AppState.params.lab;
    const listSize = lab.list ? lab.list.length : lab.elements.length;
    text.innerHTML = `左侧是<b>有序列表 L</b>，右侧是<b>集合 A</b>。<br>无论列表中重复添加多少次，集合基数 |A| 只计算一次。`;
    btn.innerText = "向列表添加重复元素 C";
    btn.onclick = () => {
        lab.list.push('元素 C');
        const chip = document.createElement('div');
        chip.className = 'element-chip';
        chip.innerText = '元素 C';
        chip.style.borderColor = "#ef4444";
        chip.style.position = 'absolute';
        chip.style.top = '0';
        chip.style.left = '50%';
        chip.style.transform = 'translateX(-50%)';
        chip.style.transition = 'all 0.5s ease, opacity 0.5s ease';
        canvas.appendChild(chip);
        requestAnimationFrame(() => {
            chip.style.top = '120px';
            chip.style.opacity = '0';
        });
        setTimeout(() => {
            chip.remove();
            renderLabMode();
        }, 600);
    };
    canvas.innerHTML = `
        <div class="lab-row">
            <div class="lab-column">
                <div class="column-title">有序列表 L</div>
                <div id="list_box" class="lab-box"></div>
                <div class="lab-metrics">当前列表长度 |L| = <b>${listSize}</b></div>
            </div>
            <div class="lab-column">
                <div class="column-title">集合 A</div>
                <div id="set_chips" class="lab-box"></div>
                <div class="lab-metrics">集合基数 |A| = <b>${lab.elements.length}</b></div>
            </div>
        </div>
    `;
    (lab.list || []).forEach((name, idx) => {
        const chip = document.createElement('div');
        chip.className = 'element-chip';
        chip.innerText = name;
        if (name === '元素 C' && idx >= lab.list.indexOf('元素 C', 0) + 1) {
            chip.style.borderColor = '#f97316';
        }
        $('list_box').appendChild(chip);
    });
    lab.elements.forEach(it => {
        const chip = document.createElement('div');
        chip.className = 'element-chip';
        chip.innerText = it.name;
        $('set_chips').appendChild(chip);
    });
}

function renderDisorderMode(canvas, btn, text) {
    const lab = AppState.params.lab;
    const fingerprint = lab.elements
        .map(e => e.val)
        .slice()
        .sort()
        .join(' · ');
    if (!lab.order) {
        lab.order = lab.elements.map(e => e.name);
    }
    text.innerHTML = `左侧列表的顺序会改变，但右侧集合的<b>指纹</b>保持不变，这体现了集合的无序性。`;
    btn.innerText = "Shuffle 列表顺序";
    btn.onclick = () => {
        lab.order.sort(() => Math.random() - 0.5);
        renderLabMode();
    };
    canvas.innerHTML = `
        <div class="lab-row">
            <div class="lab-column">
                <div class="column-title">有序列表 L</div>
                <div id="order_list" class="lab-box"></div>
            </div>
            <div class="lab-column">
                <div class="column-title">集合云图 A</div>
                <div id="set_cloud" class="lab-box cloud-view"></div>
                <div class="lab-metrics">集合指纹（排序后）：<b>${fingerprint}</b></div>
            </div>
        </div>
    `;
    lab.order.forEach(name => {
        const chip = document.createElement('div');
        chip.className = 'element-chip';
        chip.innerText = name;
        $('order_list').appendChild(chip);
    });
    lab.elements.forEach(it => {
        const chip = document.createElement('div');
        chip.className = 'element-chip';
        chip.innerText = it.name;
        $('set_cloud').appendChild(chip);
    });
}

// --- AI Chat Popup ---

function initAIChatPopup() {
    const toggleBtn = $('chatToggleBtn');
    const popup = $('aiChatPopup');
    const closeBtn = $('aiChatClose');
    const sendBtn = $('aiChatSend');
    const input = $('aiChatInput');

    if (!toggleBtn || !popup) return;

    toggleBtn.onclick = () => {
        popup.classList.add('visible');
        toggleBtn.classList.add('hidden');
    };

    closeBtn.onclick = () => {
        popup.classList.remove('visible');
        setTimeout(() => {
            toggleBtn.classList.remove('hidden');
        }, 300);
    };

    const handleSend = () => {
        const message = input.value.trim();
        if (!message) return;

        addAIChatMessage('user', message);
        input.value = '';

        setTimeout(() => {
            addAIChatMessage('ai', `我收到了你的问题："${message}"。这是一个模拟响应，实际应用中会连接AI服务。`);
        }, 500);
    };

    sendBtn.onclick = handleSend;
    input.onkeydown = (e) => { if (e.key === 'Enter') handleSend(); };
}

function addAIChatMessage(type, content) {
    const body = $('aiChatBody');
    if (!body) return;

    const messageEl = document.createElement('div');
    messageEl.className = `ai-chat-message ${type}`;
    messageEl.innerHTML = `
        <div class="ai-chat-message-avatar">${type === 'ai' ? 'A' : 'U'}</div>
        <div class="ai-chat-message-content">${content}</div>
    `;

    body.appendChild(messageEl);
    body.scrollTop = body.scrollHeight;
}

// --- OCR logic ---
function initOCR() {
    const cameraBtn = document.getElementById('cameraBtn');
    const ocrInput = document.getElementById('ocrInput');

    if (cameraBtn && ocrInput) {
        cameraBtn.onclick = () => ocrInput.click();

        ocrInput.onchange = async (e) => {
            const file = e.target.files[0];
            if (!file) return;

            // 1. Show loading state in chat
            setMode('chat');
            const placeholderId = "ocr_" + Date.now();
            addChatMessage('ai', `<div id="${placeholderId}" class="ocr-status-container"><div class="ocr-loading-spinner-small"></div> 正在识别题目并生成解答...</div>`);

            const formData = new FormData();
            formData.append('file', file);

            try {
                const res = await fetch('/api/ocr/solve', {
                    method: 'POST',
                    body: formData
                });
                const data = await res.json();

                if (data.success) {
                    const placeholder = document.getElementById(placeholderId);
                    if (placeholder) {
                        const contentEl = placeholder.closest('.message-bubble');
                        if (contentEl) {
                            // Use the existing Markdown/LaTeX rendering flow
                            let html = `好的，识别到题目内容如下：<br><br><blockquote style="border-left:4px solid var(--accent); padding-left:12px; margin:0; opacity:0.8;">${data.ocr_text}</blockquote><br>正在为你讲解...<br><br><hr style="border:none; border-top:1px solid var(--border); margin:16px 0;"><br>${data.ai_response.content.replace(/\n/g, '<br>')}`;
                            contentEl.innerHTML = html;

                            // Re-render MathJax
                            if (window.MathJax) MathJax.typesetPromise([contentEl]);

                            // Handle visualization if AI returned code
                            if (data.ai_response.viz_code) {
                                renderPlotly(data.ai_response.viz_code, data.ai_response.viz_type);
                            }
                        }
                    }
                } else {
                    const placeholder = document.getElementById(placeholderId);
                    if (placeholder) {
                        placeholder.innerHTML = `<span style="color:#ef4444;">识别失败: ${data.error || '未知错误'}</span>`;
                    }
                }
            } catch (err) {
                console.error("OCR Error:", err);
                const placeholder = document.getElementById(placeholderId);
                if (placeholder) {
                    placeholder.innerHTML = `<span style="color:#ef4444;">识别过程出错，请检查网络或后端服务状态。</span>`;
                }
            } finally {
                ocrInput.value = ''; // Reset input
            }
        };
    }
}

// --- Initialization ---

function init() {
    console.log("Initializing Aha Tutor App...");

    const railMap = {
        'rail_overview': 'overview',
        'rail_timeline': 'timeline',
        'rail_insights': 'insights',
        'rail_editor': 'editor',
        'rail_knowledge': 'knowledge',
        'rail_fast_pass': 'fast_pass',
        'rail_deep_research': 'deep_research'
    };

    Object.entries(railMap).forEach(([id, mod]) => {
        const el = $(id);
        if (el) el.onclick = () => switchToModule(mod);
    });

    if ($('sendBtn')) $('sendBtn').onclick = handleSendMessageWithRAG;
    if ($('mainInput')) $('mainInput').onkeydown = (e) => {
        if (e.key === 'Enter') {
            handleSendMessageWithRAG();
        }
    };
    if ($('themeToggle')) $('themeToggle').onclick = toggleTheme;
    if ($('closeVizBtn')) $('closeVizBtn').onclick = () => switchToModule('overview');

    initAIChatPopup();
    initOCR();

    switchToModule('overview');
}

// Robust initialization
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

// --- Subset Generator Logic ---

function renderSubsetGenerator(container) {
    container.innerHTML = `
        <div class="lab-container">
            <div class="lab-header">
                <div class="headline-section">
                   <h1>子集生成器 (Subset Generator)</h1>
                   <p>含 n 个元素的集合的子集计数 (2^n)</p>
                </div>
            </div>
            
             <div class="lab-canvas" style="background:white; align-items:center;">
                <div class="controls-section" style="background:#f4f4f5; padding:15px; border-radius:12px;width:100%;max-width:600px;">
                    <label for="n-input">元素个数 (n): </label>
                    <input type="number" id="n-input" min="1" max="5" value="3" style="padding:4px; border-radius:4px; border:1px solid #ccc;">
                    <p style="margin:8px 0 0 0;">原集合 S = <span id="original-set-display" style="font-weight:bold; color:var(--accent);">{ e1, e2, e3 }</span></p>
                </div>

                <p style="text-align: center; margin-top:20px;">拨动开关构建子集：</p>
                <div class="switch-container" id="switches-area"></div>

                <p>当前构造的子集：</p>
                <div class="result-box" id="current-subset-display" style="width:100%; max-width:600px;">∅</div>
                <p style="text-align: center; color: var(--muted); font-size: 0.9em;" id="subset-status-text">这是空集，也是真子集</p>

                <table class="stats-table" style="max-width:600px;">
                    <tr>
                        <th>类型</th>
                        <th>公式</th>
                        <th>当前值 (n=<span class="n-val">3</span>)</th>
                    </tr>
                    <tr>
                        <td>所有子集</td>
                        <td>2<sup>n</sup></td>
                        <td id="count-total">8</td>
                    </tr>
                    <tr>
                        <td>真子集</td>
                        <td>2<sup>n</sup> - 1</td>
                        <td id="count-proper">7</td>
                    </tr>
                    <tr>
                        <td>非空真子集</td>
                        <td>2<sup>n</sup> - 2</td>
                        <td id="count-nonempty-proper">6</td>
                    </tr>
                </table>
            </div>
        </div>
    `;

    const nInput = document.getElementById('n-input');
    const originalSetDisplay = document.getElementById('original-set-display');
    const switchesArea = document.getElementById('switches-area');
    const currentSubsetDisplay = document.getElementById('current-subset-display');
    const subsetStatusText = document.getElementById('subset-status-text');
    const nValDisplays = container.querySelectorAll('.n-val');
    const countTotal = document.getElementById('count-total');
    const countProper = document.getElementById('count-proper');
    const countNonemptyProper = document.getElementById('count-nonempty-proper');

    let n = 3;
    let elements = [];
    let switchStates = [];

    function initSubsetsModule() {
        n = parseInt(nInput.value);
        nValDisplays.forEach(el => el.textContent = n);

        elements = Array.from({ length: n }, (_, i) => `e${i + 1}`);
        originalSetDisplay.textContent = `{ ${elements.join(', ')} }`;

        const total = Math.pow(2, n);
        countTotal.textContent = total;
        countProper.textContent = total - 1;
        countNonemptyProper.textContent = Math.max(0, total - 2);

        switchesArea.innerHTML = '';
        switchStates = new Array(n).fill(false);
        elements.forEach((el, index) => {
            const wrapper = document.createElement('div');
            wrapper.className = 'switch-wrapper';
            wrapper.innerHTML = `
                <p style="margin-bottom:4px;">${el}</p>
                <label class="switch">
                    <input type="checkbox" data-index="${index}">
                    <span class="slider"></span>
                </label>
            `;
            switchesArea.appendChild(wrapper);
            wrapper.querySelector('input').addEventListener('change', handleSwitchChange);
        });

        updateSubsetDisplay();
    }

    function handleSwitchChange(e) {
        const index = e.target.dataset.index;
        switchStates[index] = e.target.checked;
        updateSubsetDisplay();
    }

    function updateSubsetDisplay() {
        const currentElements = elements.filter((_, index) => switchStates[index]);
        const activeCount = currentElements.length;

        if (activeCount === 0) {
            currentSubsetDisplay.textContent = '∅';
            subsetStatusText.textContent = '这是空集，也是真子集';
        } else if (activeCount === n) {
            currentSubsetDisplay.textContent = `{ ${currentElements.join(', ')} }`;
            subsetStatusText.textContent = '这是原集合 S (非真子集)';
        } else {
            currentSubsetDisplay.textContent = `{ ${currentElements.join(', ')} }`;
            subsetStatusText.textContent = `包含 ${activeCount} 个元素的真子集`;
        }
    }

    nInput.addEventListener('change', initSubsetsModule);
    initSubsetsModule();
}

// --- Venn Logic Lab Logic ---

function renderVennLogicLab(container) {
    container.innerHTML = `
        <div class="lab-container">
            <div class="lab-header">
                <div class="headline-section">
                   <h1>维恩逻辑实验室 (Venn Logic Lab)</h1>
                   <p>运算定律与逻辑可视化</p>
                </div>
            </div>

            <div class="lab-canvas" style="background:white; display:block; overflow-y:auto;">
                <div class="controls-section" style="display: flex; align-items: center; gap: 10px; margin-bottom:12px;">
                    <label style="display: flex; align-items: center; cursor: pointer;">
                        <input type="checkbox" id="subset-mode-check" style="margin-right: 8px;">
                        <strong>模拟 A ⊆ B 模式</strong>
                    </label>
                    <span style="font-size: 0.85em; color: var(--muted);">(用于理解包含相关的定律)</span>
                </div>

                <svg id="venn-diagram" viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg" style="width:100%; height:300px; max-width:600px; margin:0 auto; display:block; border:1px solid #eee;">
                    <rect x="0" y="0" width="400" height="300" fill="white" />
                    <path id="region-a-only" class="venn-region" d="" />
                    <path id="region-b-only" class="venn-region" d="" />
                    <path id="region-intersect" class="venn-region" d="" />
                    <path id="region-outside" class="venn-region" d="M0,0 H400 V300 H0 Z" fill-rule="evenodd" />

                    <circle id="borderA" cx="150" cy="150" r="80" fill="none" stroke="#3498db" stroke-width="2" />
                    <circle id="borderB" cx="250" cy="150" r="80" fill="none" stroke="#2c3e50" stroke-width="2" />
                    <text x="145" y="155" font-size="16" fill="#3498db">A</text>
                    <text x="245" y="155" font-size="16" fill="#2c3e50">B</text>
                    <text x="10" y="25" font-size="16">U</text>
                </svg>

                <h3 style="margin:16px 0 8px 0; font-size:14px;">基础运算点选 (Basic Operations)</h3>
                <div class="btn-group">
                    <button class="pill-chip" onclick="window.vennHighlight('A')">A</button>
                    <button class="pill-chip" onclick="window.vennHighlight('B')">B</button>
                    <button class="pill-chip" onclick="window.vennHighlight('intersect')">A ∩ B</button>
                    <button class="pill-chip" onclick="window.vennHighlight('union')">A ∪ B</button>
                    <button class="pill-chip" onclick="window.vennHighlight('complementA')">∁A</button>
                    <button class="pill-chip" onclick="window.vennHighlight('complementB')">∁B</button>
                    <button class="pill-chip" onclick="window.vennHighlight('reset')" style="background-color: #eee; color:black;">重置</button>
                </div>

                <h3 style="margin:16px 0 8px 0; font-size:14px;">定律验证 (Law Verification)</h3>
                <div style="display: flex; gap: 10px; margin-bottom: 10px; flex-wrap:wrap;">
                    <select id="law-selector" style="padding:8px; border-radius:8px; border:1px solid #ccc; flex-grow:1;">
                        <optgroup label="交集性质">
                            <option value="A_cap_A">① A ∩ A = A</option>
                            <option value="A_cap_empty">② A ∩ ∅ = ∅</option>
                            <option value="A_subset_B_cap">④ A ⊆ B ⇔ A ∩ B = A (需开启A⊆B模式)</option>
                        </optgroup>
                        <optgroup label="并集性质">
                            <option value="A_cup_A">① A ∪ A = A</option>
                            <option value="A_cup_empty">② A ∪ ∅ = A</option>
                            <option value="A_subset_B_cup">④ A ⊆ B ⇔ A ∪ B = B (需开启A⊆B模式)</option>
                        </optgroup>
                        <optgroup label="补集性质">
                            <option value="C_U">① ∁U = ∅</option>
                            <option value="C_empty">② ∁∅ = U</option>
                            <option value="C_C_A">③ ∁(∁A) = A</option>
                            <option value="A_cup_CA">④ A ∪ ∁A = U</option>
                            <option value="A_cap_CA">⑤ A ∩ ∁A = ∅</option>
                        </optgroup>
                        <optgroup label="德摩根定律 (De Morgan's)">
                            <option value="demorgan_1">⑥ ∁A ∪ ∁B = ∁(A ∩ B)</option>
                            <option value="demorgan_2">⑦ ∁A ∩ ∁B = ∁(A ∪ B)</option>
                        </optgroup>
                    </select>
                    <button class="btn-primary" onclick="window.vennVerifyHelper()" style="background-color: var(--accent); color:white; border:none; padding:8px 16px; border-radius:8px;">演示定律</button>
                </div>
                <div id="verification-status"></div>

                <div class="logic-note">
                    <strong>命题逻辑关联：</strong>
                    <br>• <strong>充分条件</strong>：若图中显示 A 完全被 B 包含 ( \subseteq B$)，则命题“x在A中”是命题“x在B中”的<strong>充分</strong>条件
                    ( \in A \Rightarrow x \in B$)。
                    <br>• <strong>逆否命题</strong>：这等价于“x不在B中”是“x不在A中”的充分条件 ( \notin B \Rightarrow x \notin A$)，即可视化为
                    $\complement B \subseteq \complement A$。
                </div>
            </div>
        </div>
    `;

    const vennSvg = document.getElementById('venn-diagram');
    const pathAOnly = document.getElementById('region-a-only');
    const pathBOnly = document.getElementById('region-b-only');
    const pathOutside = document.getElementById('region-outside');
    const borderA = document.getElementById('borderA');
    const borderB = document.getElementById('borderB');
    const subsetModeCheck = document.getElementById('subset-mode-check');
    const statusDiv = document.getElementById('verification-status');
    const lawSelector = document.getElementById('law-selector');

    let isSubsetMode = false;
    let cA = { cx: 150, cy: 150, r: 80 };
    let cB = { cx: 250, cy: 150, r: 80 };

    function updateVennGeometry() {
        isSubsetMode = subsetModeCheck.checked;
        if (isSubsetMode) {
            cA = { cx: 220, cy: 150, r: 50 };
            cB = { cx: 250, cy: 150, r: 80 };
        } else {
            cA = { cx: 150, cy: 150, r: 80 };
            cB = { cx: 250, cy: 150, r: 80 };
        }
        borderA.setAttribute('cx', cA.cx); borderA.setAttribute('cy', cA.cy); borderA.setAttribute('r', cA.r);
        borderB.setAttribute('cx', cB.cx); borderB.setAttribute('cy', cB.cy); borderB.setAttribute('r', cB.r);

        // Update text labels via DOM query to ensure we catch them even if not in vars
        const txtA = vennSvg.querySelector('text[fill="#3498db"]');
        const txtB = vennSvg.querySelector('text[fill="#2c3e50"]');
        if (txtA) txtA.setAttribute('x', cA.cx - 5);
        if (txtB) txtB.setAttribute('x', cB.cx - 5);

        pathAOnly.setAttribute('d', describeCircle(cA));
        pathBOnly.setAttribute('d', describeCircle(cB));
    }

    function describeCircle(c) {
        return `M ${c.cx}, ${c.cy} m -${c.r}, 0 a ${c.r},${c.r} 0 1,0 ${c.r * 2},0 a ${c.r},${c.r} 0 1,0 -${c.r * 2},0`;
    }

    subsetModeCheck.addEventListener('change', () => {
        updateVennGeometry();
        resetVenn();
        statusDiv.textContent = isSubsetMode ? "模式已切换：A 现在是 B 的子集 (A ⊆ B)" : "模式已切换：标准重叠模式";
    });

    const layerA = pathAOnly;
    const layerB = pathBOnly;
    const layerU = pathOutside;

    function resetVenn() {
        [layerA, layerB, layerU].forEach(el => {
            el.classList.remove('active-region', 'verify-left', 'verify-right', 'verify-match');
            el.style.opacity = '1';
            el.style.fill = '';
        });
        statusDiv.textContent = "";
        vennSvg.insertBefore(layerU, layerA); // Reset layer order
        if (layerA.parentNode === vennSvg) {
            // Ensure basic order: U -> A -> B (or U -> B -> A). We want U at bottom.
            // Since SVG z-index is DOM order, we prepend U.
            vennSvg.prepend(layerU);
        }
    }

    // Attach to window for onclick handlers
    window.vennHighlight = function (op) {
        // Reset styles
        [layerA, layerB, layerU].forEach(el => {
            el.classList.remove('active-region', 'verify-left', 'verify-right', 'verify-match');
            el.style.opacity = '1';
            el.style.fill = '';
        });
        statusDiv.textContent = "";

        // Ensure U is at bottom
        vennSvg.prepend(layerU);

        if (op === 'reset') return;

        switch (op) {
            case 'A': layerA.classList.add('active-region'); break;
            case 'B': layerB.classList.add('active-region'); break;
            case 'intersect':
                layerA.classList.add('active-region');
                layerB.classList.add('active-region');
                break;
            case 'union':
                layerA.classList.add('active-region');
                layerB.classList.add('active-region');
                break;
            case 'complementA':
                layerU.classList.add('active-region');
                layerB.classList.add('active-region');
                // White mask for A
                layerA.style.fill = 'white'; layerA.style.opacity = '1';
                vennSvg.appendChild(layerA); // Bring to front
                break;
            case 'complementB':
                layerU.classList.add('active-region');
                layerA.classList.add('active-region');
                // White mask for B
                layerB.style.fill = 'white'; layerB.style.opacity = '1';
                vennSvg.appendChild(layerB); // Bring to front
                break;
        }
    };

    window.vennVerifyHelper = async function () {
        const law = lawSelector.value;
        resetVenn();
        statusDiv.innerHTML = "正在演示等式左边... <span style='color:var(--set-a-color)'>■</span>";

        applyVisualState(law, 'LHS', 'verify-left');
        await new Promise(r => setTimeout(r, 1500));

        statusDiv.innerHTML = "正在演示等式右边... <span style='color:var(--set-b-color)'>■</span> (重合部分变黄)";
        applyVisualState(law, 'RHS', 'verify-right');
        await new Promise(r => setTimeout(r, 1500));

        statusDiv.innerHTML = "<span style='color:green'>✓ 验证成功！</span> 左右两边表示相同的区域。";
        [layerA, layerB, layerU].forEach(el => {
            if (el.classList.contains('verify-left') && el.classList.contains('verify-right')) {
                el.classList.remove('verify-left', 'verify-right');
                el.classList.add('verify-match');
            }
        });

        if (law === 'demorgan_1') {
            // ∁(A ∩ B) visual fix
            // We want external region + exclusive A + exclusive B. 
            // In our simple circle model, just make sure intersection is NOT covered or covered by white mask if needed.
            // But verify-match is solid yellow.
            // Let's just rely on css classes mixing for now.
        }
    };

    function applyVisualState(law, side, className) {
        const targets = [];
        if (law === 'demorgan_1') {
            if (side === 'LHS') { // ∁A ∪ ∁B -> Everything except intersection
                targets.push(layerA, layerB, layerU);
                // Ideally we'd mask intersection. 
                // For this demo, highlighting everything simulates 'union of complements' visually enough
            } else { // ∁(A ∩ B)
                targets.push(layerA, layerB, layerU);
            }
        }
        else if (law === 'demorgan_2') { // ∁A ∩ ∁B = ∁(A ∪ B) -> Outside
            targets.push(layerU);
        }
        else if (law === 'A_cup_CA') { // A ∪ ∁A = U
            targets.push(layerU, layerA);
        }
        else if (law === 'A_cap_A' || law === 'A_cup_A') {
            targets.push(layerA);
        }
        else if (isSubsetMode && law === 'A_subset_B_cap') { targets.push(layerA); }
        else if (isSubsetMode && law === 'A_subset_B_cup') { targets.push(layerB); }

        if (targets.length === 0 && side === 'LHS') targets.push(layerA); // fallback
        if (targets.length === 0 && side === 'RHS') targets.push(layerA);

        targets.forEach(el => el.classList.add(className));
    }

    updateVennGeometry();
    if (window.MathJax) MathJax.typesetPromise();
}

// --- Inequality Properties Lab ---

function renderInequalityProperties(container) {
    container.innerHTML = `
        <div class="ineq-lab-container">
            <div class="property-nav" id="prop-nav">
                <!-- Nav items generated via JS -->
            </div>
            <div class="lab-viewport">
                <div class="lab-header" style="margin-bottom:20px;">
                    <div class="headline-section">
                        <h1 id="prop-title">不等式基本性质</h1>
                        <p id="prop-subtitle">Interactive visualization of inequality rules</p>
                    </div>
                </div>
                
                <div id="prop-formula" class="formula-box"></div>
                <div id="prop-controls" style="margin-bottom:20px;"></div>
                <div id="prop-canvas" style="flex:1; border:1px solid #eee; border-radius:12px; position:relative; overflow:hidden; min-height:300px;"></div>
                <div id="prop-note" style="margin-top:10px; color:var(--muted); font-size:13px;"></div>
            </div>
        </div>
    `;

    const nav = document.getElementById('prop-nav');
    const title = document.getElementById('prop-title');
    const subtitle = document.getElementById('prop-subtitle');
    const formula = document.getElementById('prop-formula');
    const controls = document.getElementById('prop-controls');
    const canvas = document.getElementById('prop-canvas');
    const note = document.getElementById('prop-note');

    const properties = [
        {
            id: 'p1', name: '(1) 对称性',
            desc: 'a > b ⇔ b < a',
            latex: 'a > b \\iff b < a',
            render: (cvs, ctrl) => renderPropSymmetry(cvs, ctrl)
        },
        {
            id: 'p2', name: '(2) 传递性',
            desc: 'a > b, b > c ⇒ a > c',
            latex: 'a > b, b > c \\Rightarrow a > c',
            render: (cvs, ctrl) => renderPropTransitivity(cvs, ctrl)
        },
        {
            id: 'p3', name: '(3) 可加性',
            desc: 'a > b ⇒ a+c > b+c',
            latex: 'a > b \\Rightarrow a+c > b+c',
            render: (cvs, ctrl) => renderPropAdditivity(cvs, ctrl)
        },
        {
            id: 'p5', name: '(5) 可乘性',
            desc: '乘正不变，乘负变号',
            latex: '\\begin{cases} c > 0 \\Rightarrow ac > bc \\\\ c < 0 \\Rightarrow ac < bc \\end{cases}',
            render: (cvs, ctrl) => renderPropMultiplicativity(cvs, ctrl)
        },
        {
            id: 'p7', name: '(7) 可倒性',
            desc: '同号倒数反向',
            latex: 'ab > 0, a > b \\Rightarrow \\frac{1}{a} < \\frac{1}{b}',
            render: (cvs, ctrl) => renderPropReciprocal(cvs, ctrl)
        },
        {
            id: 'p9', name: '(9) 糖水不等式',
            desc: 'b < a, m > 0 ⇒ b/a < (b+m)/(a+m)',
            latex: 'a > b > 0, m > 0 \\Rightarrow \\frac{b}{a} < \\frac{b+m}{a+m}',
            render: (cvs, ctrl) => renderPropSugarWater(cvs, ctrl)
        }
    ];

    properties.forEach((p, idx) => {
        const item = document.createElement('div');
        item.className = `nav-item ${idx === 0 ? 'active' : ''}`;
        item.textContent = p.name;
        item.onclick = () => loadProp(idx);
        nav.appendChild(item);
    });

    let currentPropIndex = 0;

    function loadProp(index) {
        currentPropIndex = index;
        document.querySelectorAll('.nav-item').forEach((el, i) => el.classList.toggle('active', i === index));
        const p = properties[index];
        title.textContent = p.name;
        subtitle.textContent = p.desc;
        formula.innerHTML = `$$${p.latex}$$`;
        if (window.MathJax) MathJax.typesetPromise([formula]);

        controls.innerHTML = '';
        canvas.innerHTML = '';
        note.textContent = '';

        p.render(canvas, controls);
    }

    // -- Sub-renderers --

    function renderPropSymmetry(cvs, ctrl) {
        cvs.innerHTML = `
             <div style="display:flex; justify-content:center; align-items:center; height:100%; flex-direction:column; gap:40px;">
                <div id="sym-pan" style="font-size:40px; font-weight:bold; transition:all 0.5s;">a > b</div>
                <button class="btn-primary" id="sym-btn">交换位置</button>
             </div>
        `;
        let state = true;
        cvs.querySelector('#sym-btn').onclick = () => {
            state = !state;
            const el = cvs.querySelector('#sym-pan');
            el.style.transform = 'scale(0.8)';
            setTimeout(() => {
                el.innerHTML = state ? 'a > b' : 'b < a';
                el.style.color = state ? 'var(--text)' : 'var(--accent)';
                el.style.transform = 'scale(1)';
            }, 200);
        };
    }

    function renderPropMultiplicativity(cvs, ctrl) {
        ctrl.innerHTML = `调节乘数 c: <input type="range" min="-2" max="2" step="0.1" value="1" style="width:200px"><span id="c-val" style="margin-left:10px; font-weight:bold;">1.0</span>`;

        const plotDiv = document.createElement('div');
        plotDiv.style.width = '100%'; plotDiv.style.height = '100%';
        cvs.appendChild(plotDiv);

        function update(c) {
            const a = 3, b = 1; // a > b
            const ac = a * c;
            const bc = b * c;

            const trace = {
                x: [ac, bc],
                y: [0, 0],
                mode: 'markers+text',
                text: ['ac', 'bc'],
                textposition: 'top center',
                marker: { size: 15, color: [c > 0 ? '#2563eb' : '#e34b72', c > 0 ? '#38bdf8' : '#f472b6'] }
            };

            const layout = {
                xaxis: { range: [-8, 8], title: 'Number Line' },
                yaxis: { visible: false, range: [-1, 1] },
                title: c > 0 ? `c > 0, 不等号方向不变 (ac > bc)` : (c < 0 ? `c < 0, 不等号方向改变 (ac < bc)` : `c = 0`),
                margin: { t: 40, b: 40, l: 40, r: 40 }
            };
            Plotly.react(plotDiv, [trace], layout, { displayModeBar: false });
        }

        ctrl.querySelector('input').addEventListener('input', (e) => {
            const v = parseFloat(e.target.value);
            ctrl.querySelector('#c-val').textContent = v.toFixed(1);
            update(v);
        });
        update(1);
    }

    function renderPropSugarWater(cvs, ctrl) {
        // Sugar Water Viz
        cvs.innerHTML = `
            <div class="beaker-container">
                <div style="text-align:center;">
                    <div class="beaker"><div class="liquid" style="height:50%"></div><div class="sugar" style="height:20%"></div></div>
                    <p>原浓度 b/a</p>
                </div>
                <div style="font-size:40px; padding-bottom:50px; color:var(--muted);">&lt;</div>
                <div style="text-align:center;">
                    <div class="beaker"><div class="liquid" id="liq2" style="height:50%"></div><div class="sugar" id="sug2" style="height:20%"></div></div>
                    <p>新浓度 (b+m)/(a+m)</p>
                </div>
            </div>
        `;
        ctrl.innerHTML = `添加糖量 m: <input type="range" min="0" max="40" value="0" style="width:200px">`;

        const liq2 = cvs.querySelector('#liq2');
        const sug2 = cvs.querySelector('#sug2');

        ctrl.querySelector('input').addEventListener('input', (e) => {
            const m = parseInt(e.target.value);
            // Base: 50% liquid, 20% sugar. Max m adds 30%.
            liq2.style.height = (50 + m) + '%';
            sug2.style.height = (20 + m) + '%';
        });
    }

    // Placeholders for others for brevity
    function renderPropTransitivity(cvs, ctrl) {
        cvs.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:#aaa;">Visualizing: If A > B and B > C... then A > C (Height comparison)</div>';
    }
    function renderPropAdditivity(cvs, ctrl) {
        cvs.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:#aaa;">Shift both points on number line by +c</div>';
    }
    function renderPropReciprocal(cvs, ctrl) {
        cvs.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:#aaa;">Visualize 1/x curve monotonicity</div>';
    }

    loadProp(0);
}

// --- Inequality Solver Lab ---

function renderInequalitySolver(container) {
    container.innerHTML = `
        <div class="ineq-lab-container" style="flex-direction:column;">
            <div class="tab-bar">
                <div class="tab-btn active" data-tab="quad">一元二次</div>
                <div class="tab-btn" data-tab="high">高次(穿根法)</div>
                <div class="tab-btn" data-tab="abs">绝对值</div>
                <div class="tab-btn" data-tab="frac">分式</div>
            </div>
            
            <div id="solver-viewport" style="flex:1; overflow-y:auto;"></div>
        </div>
    `;

    const viewport = container.querySelector('#solver-viewport');
    const tabs = container.querySelectorAll('.tab-btn');

    tabs.forEach(tab => {
        tab.onclick = () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            renderSolverTab(viewport, tab.dataset.tab);
        };
    });

    renderSolverTab(viewport, 'quad');
}

function renderSolverTab(container, type) {
    container.innerHTML = '';
    if (type === 'quad') {
        container.innerHTML = `
            <div class="solver-grid">
                <div class="solver-option" onclick="window.drawQuadCase(1)">1. 两正根 (x1, x2 > 0)</div>
                <div class="solver-option" onclick="window.drawQuadCase(2)">2. 两负根 (x1, x2 < 0)</div>
                <div class="solver-option" onclick="window.drawQuadCase(3)">3. 异号根 (x1x2 < 0)</div>
                <div class="solver-option" onclick="window.drawQuadCase(4)">4. 两根大于 m</div>
                <div class="solver-option" onclick="window.drawQuadCase(5)">5. m 在两根间</div>
                <div class="solver-option" onclick="window.drawQuadCase(6)">6. 两根在区间 (m, n)</div>
            </div>
            <div id="quad-plot" style="width:100%; height:300px; margin-top:20px;"></div>
            <div id="quad-info" class="formula-box" style="margin-top:20px;">点击上方按钮查看对应根分布条件</div>
        `;

        window.drawQuadCase = (idx) => {
            let title = "", cond = "", xpts = [], ypts = [];
            // Mock parabolas
            const x = Array.from({ length: 100 }, (_, i) => -4 + 8 * (i / 100));
            let y = [];

            if (idx === 1) { // 2 pos roots
                title = "两正根"; cond = "Δ≥0, -b/2a>0, f(0)>0";
                y = x.map(v => (v - 1) * (v - 3));
            } else if (idx === 3) { // 1 pos 1 neg
                title = "一正一负"; cond = "f(0)<0 (Δ必>0)";
                y = x.map(v => (v + 2) * (v - 2));
            } else {
                title = "演示模式: case " + idx; cond = "对应条件...";
                y = x.map(v => (v - 1) * (v - 2));
            }

            document.getElementById('quad-info').innerHTML = `<strong>${title}</strong><br>${cond}`;

            Plotly.react('quad-plot', [
                { x: x, y: y, mode: 'lines', name: 'f(x)' },
                { x: [-4, 4], y: [0, 0], mode: 'lines', line: { color: 'black', width: 1 }, showlegend: false }
            ], { margin: { t: 20, b: 20, l: 30, r: 20 }, title: title });
        };
        window.drawQuadCase(1);

    } else if (type === 'high') {
        container.innerHTML = `
             <div style="padding:20px;">
                <h3>高次不等式：穿根法 (Wavy Curve)</h3>
                <p>输入根 (用逗号分隔，如 -2, 1, 3):</p>
                <input id="roots-input" type="text" value="-2, 1, 3" style="font-size:18px; padding:8px; width:100%; box-sizing:border-box;">
                <div id="wavy-plot" style="width:100%; height:350px; margin-top:20px;"></div>
             </div>
        `;

        const input = document.getElementById('roots-input');
        const update = () => {
            const raw = input.value;
            const roots = raw.split(/[,\s]+/).map(Number).filter(n => !isNaN(n)).sort((a, b) => a - b);
            const xVal = [], yVal = [];
            const margin = 1;
            const start = (roots[0] || 0) - margin;
            const end = (roots[roots.length - 1] || 0) + margin;

            for (let t = start; t <= end; t += 0.05) {
                let val = 1;
                roots.forEach(r => val *= (t - r));
                xVal.push(t);
                // Clamp y for better viz
                yVal.push(Math.max(-5, Math.min(5, val)));
            }

            Plotly.react('wavy-plot', [
                { x: xVal, y: yVal, fill: 'tozeroy', mode: 'lines', line: { color: '#8b5cf6', width: 3 } }
            ], { title: "奇穿偶回，从右上方起笔" });
        };
        input.oninput = update;
        setTimeout(update, 100);
    } else {
        container.innerHTML = '<div style="padding:40px; text-align:center; color:#aaa;">该模块待后续实现 (Placeholder)</div>';
    }
}

// --- Basic Inequality Lab ---

function renderBasicInequality(container) {
    container.innerHTML = `
         <div class="ineq-lab-container" style="flex-direction:column; padding:0 20px;">
            <div class="headline-section" style="margin:20px 0;">
                <h1>基本不等式链</h1>
                <p>Hn ≤ Gn ≤ An ≤ Qn</p>
            </div>
            
            <div style="background:#f8fafc; padding:20px; border-radius:12px; margin-bottom:20px;">
                 <div style="display:flex; gap:40px; justify-content:center;">
                     <div>
                        <label>a = <span id="val-a">2</span></label>
                        <br>
                        <input type="range" id="rng-a" min="0.1" max="10" step="0.1" value="2" style="width:200px">
                     </div>
                     <div>
                        <label>b = <span id="val-b">8</span></label>
                         <br>
                        <input type="range" id="rng-b" min="0.1" max="10" step="0.1" value="8" style="width:200px">
                     </div>
                 </div>
            </div>

            <div id="mean-plot" style="width:100%; height:400px;"></div>
         </div>
    `;

    const rngA = container.querySelector('#rng-a');
    const rngB = container.querySelector('#rng-b');

    function update() {
        const a = parseFloat(rngA.value);
        const b = parseFloat(rngB.value);
        container.querySelector('#val-a').textContent = a;
        container.querySelector('#val-b').textContent = b;

        const H = 2 / (1 / a + 1 / b);
        const G = Math.sqrt(a * b);
        const A = (a + b) / 2;
        const Q = Math.sqrt((a * a + b * b) / 2);

        Plotly.react('mean-plot', [{
            x: ['调和 H', '几何 G', '算术 A', '平方 Q'],
            y: [H, G, A, Q],
            type: 'bar',
            marker: {
                color: ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b']
            },
            text: [H.toFixed(2), G.toFixed(2), A.toFixed(2), Q.toFixed(2)],
            textposition: 'auto'
        }], {
            title: '均值大小关系可视',
            yaxis: { range: [0, 12] }
        });
    }

    rngA.oninput = update;
    rngB.oninput = update;
    setTimeout(update, 100);
}

// --- Function Concept Lab ---

function renderFunctionConcept(container) {
    container.innerHTML = `
        <div class="ineq-lab-container" style="flex-direction:column;">
            <div class="headline-section" style="margin:20px 0;">
                <h1>函数概念实验台</h1>
                <p>三要素：定义域、值域、对应法则</p>
            </div>
            
            <div class="mapping-diagram">
                <div class="mapping-set" id="domain-set">
                    <div class="mapping-label">定义域 D</div>
                    <!-- Points generated -->
                </div>
                <div style="font-size:30px; color:var(--muted);">f(x) &rarr;</div>
                <div class="mapping-set" id="range-set">
                    <div class="mapping-label">值域 R</div>
                </div>
                <svg id="mapping-svg" class="mapping-arrow" style="overflow:visible;"></svg>
            </div>

            <div style="background:#f8fafc; padding:20px; border-radius:12px; margin-top:20px; text-align:center;">
                <h3>f(x) = <span id="func-def">2x + 1</span></h3>
                <div style="display:flex; justify-content:center; gap:20px; margin-top:15px;">
                     <input type="range" min="-3" max="3" step="1" value="0" id="x-slider" style="width:200px">
                </div>
                <p style="margin-top:10px;">x = <span id="x-val">0</span>, y = <span id="y-val">1</span></p>
            </div>
        </div>
    `;

    const svg = container.querySelector('#mapping-svg');
    const domainSet = container.querySelector('#domain-set');
    const rangeSet = container.querySelector('#range-set');
    const xSlider = container.querySelector('#x-slider');
    const xDist = container.querySelector('#x-val');
    const yDist = container.querySelector('#y-val');

    // Create static points for vis
    const inputs = [-3, -2, -1, 0, 1, 2, 3];
    const func = x => 2 * x + 1;

    // Render points
    inputs.forEach((x, i) => {
        const topPc = 10 + (i / (inputs.length - 1)) * 80;

        const pD = document.createElement('div');
        pD.className = 'mapping-point';
        pD.style.top = topPc + '%';
        pD.dataset.x = x;
        domainSet.appendChild(pD);

        const pR = document.createElement('div');
        pR.className = 'mapping-point';
        pR.style.top = topPc + '%'; // Simplified distribution
        pR.dataset.y = func(x);
        pR.style.background = '#e2e8f0'; // ranges are passive
        rangeSet.appendChild(pR);
    });

    function drawArrow(x) {
        // Clear
        svg.innerHTML = '';

        // Find points
        const dPt = Array.from(domainSet.querySelectorAll('.mapping-point')).find(el => parseInt(el.dataset.x) == x);
        const rPt = Array.from(rangeSet.querySelectorAll('.mapping-point')).find(el => parseInt(el.dataset.y) == func(x));

        if (dPt && rPt) {
            dPt.classList.add('active');
            rPt.classList.add('active');

            // Calc coords relative to svg
            const r1 = dPt.getBoundingClientRect();
            const r2 = rPt.getBoundingClientRect();
            const svgR = svg.getBoundingClientRect();

            const x1 = r1.left + r1.width - svgR.left;
            const y1 = r1.top + r1.height / 2 - svgR.top;
            const x2 = r2.left - svgR.left;
            const y2 = r2.top + r2.height / 2 - svgR.top;

            const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            path.setAttribute('d', `M ${x1} ${y1} C ${x1 + 50} ${y1}, ${x2 - 50} ${y2}, ${x2} ${y2}`);
            path.setAttribute('stroke', '#e34b72');
            path.setAttribute('stroke-width', '3');
            path.setAttribute('fill', 'none');
            path.setAttribute('marker-end', 'url(#arrowhead)');
            svg.appendChild(path);
        }
    }

    // Add arrowhead def
    if (!document.getElementById('arrowhead')) {
        const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
        defs.innerHTML = `<marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto"><polygon points="0 0, 10 3.5, 0 7" fill="#e34b72" /></marker>`;
        svg.appendChild(defs);
    }

    xSlider.oninput = () => {
        // Reset actives
        container.querySelectorAll('.active').forEach(e => e.classList.remove('active'));
        const val = parseInt(xSlider.value);
        xDist.textContent = val;
        yDist.textContent = func(val);
        drawArrow(val);
    };

    setTimeout(() => { xSlider.oninput(); }, 100);
}

// --- Function Operations Lab ---

function renderFunctionOperations(container) {
    container.innerHTML = `
        <div class="ineq-lab-container" style="flex-direction:column; padding:0 20px;">
           <div class="headline-section" style="margin:10px 0;">
                <h1>函数运算 (和与积)</h1>
            </div>
           <div style="display:flex; gap:10px; margin-bottom:10px;">
               <label><input type="checkbox" id="chk-f" checked> f(x) = sin(x)</label>
               <label><input type="checkbox" id="chk-g" checked> g(x) = x/2</label>
               <label><input type="radio" name="op" value="add" checked> f + g</label>
               <label><input type="radio" name="op" value="mul"> f · g</label>
           </div>
           <div id="ops-plot" style="width:100%; height:400px;"></div>
        </div>
    `;

    const chkF = container.querySelector('#chk-f');
    const chkG = container.querySelector('#chk-g');
    const ops = container.querySelectorAll('input[name="op"]');

    function update() {
        const showF = chkF.checked;
        const showG = chkG.checked;
        const op = Array.from(ops).find(r => r.checked).value;

        const x = [], yf = [], yg = [], yres = [];
        for (let i = 0; i <= 100; i++) {
            const val = -5 + 10 * (i / 100);
            x.push(val);
            const fv = Math.sin(val);
            const gv = val / 2;
            yf.push(fv);
            yg.push(gv);
            yres.push(op === 'add' ? fv + gv : fv * gv);
        }

        const traces = [];
        if (showF) traces.push({ x, y: yf, name: 'f(x)=sin(x)', line: { dash: 'dot' } });
        if (showG) traces.push({ x, y: yg, name: 'g(x)=x/2', line: { dash: 'dot' } });
        traces.push({ x, y: yres, name: op === 'add' ? 'f(x)+g(x)' : 'f(x)·g(x)', line: { width: 3, color: '#e34b72' } });

        Plotly.react('ops-plot', traces, { margin: { t: 30, b: 30 } });
    }

    container.querySelectorAll('input').forEach(el => el.onchange = update);
    setTimeout(update, 100);
}

// --- Function Composite Lab ---

function renderFunctionComposite(container) {
    container.innerHTML = `
        <div class="ineq-lab-container" style="flex-direction:column; align-items:center;">
             <div class="headline-section" style="margin:20px 0;">
                <h1>复合函数流水线</h1>
                <p>y = f(g(x))</p>
            </div>
            
            <div style="background:#f8fafc; padding:15px; border-radius:8px; margin-bottom:30px; display:flex; gap:20px; align-items:center;">
                <label>内函数 g(x) = <input type="text" id="g-input" value="x^2" style="width:80px; padding:4px; font-family:monospace;"></label>
                <span>&rarr; u &rarr;</span>
                <label>外函数 f(u) = <input type="text" id="f-input" value="sin(u)" style="width:80px; padding:4px; font-family:monospace;"></label>
            </div>

            <div class="composite-pipeline">
                 <div class="pipeline-node" style="border-color:#3b82f6;">x</div>
                 <div class="pipeline-connector"><div class="pipeline-flow" id="flow1"></div></div>
                 <div class="pipeline-box">
                      <strong id="g-disp">x²</strong>
                      <span style="font-size:12px; color:#666;">u = <span id="val-u">0</span></span>
                 </div>
                 <div class="pipeline-connector"><div class="pipeline-flow" id="flow2"></div></div>
                 <div class="pipeline-box">
                      <strong id="f-disp">sin(u)</strong>
                      <span style="font-size:12px; color:#666;">y = <span id="val-y">0</span></span>
                 </div>
                 <div class="pipeline-connector"><div class="pipeline-flow" id="flow3"></div></div>
                 <div class="pipeline-node" style="border-color:#e34b72;">y</div>
            </div>

            <div style="width:100%; max-width:500px; margin-top:40px;">
                <input type="range" min="0" max="3" step="0.1" value="0" id="comp-slider" style="width:100%;">
                <p style="text-align:center;">Input x: <span id="val-x">0</span></p>
                <div style="text-align:center; margin-top:10px;">
                   <button class="btn-primary" id="auto-play">自动演示</button>
                </div>
            </div>
        </div>
    `;

    const slider = container.querySelector('#comp-slider');
    const uSpan = container.querySelector('#val-u');
    const ySpan = container.querySelector('#val-y');
    const xSpan = container.querySelector('#val-x');
    const gInput = container.querySelector('#g-input');
    const fInput = container.querySelector('#f-input');
    const gDisp = container.querySelector('#g-disp');
    const fDisp = container.querySelector('#f-disp');
    const flows = [container.querySelector('#flow1'), container.querySelector('#flow2'), container.querySelector('#flow3')];

    // Helper to eval math expr
    function safeMathEval(expr, varName, val) {
        try {
            // Replace ^ with **
            let jsExpr = expr.replace(/\^/g, '**');
            // Allow Math functions e.g. sin(x) -> Math.sin(x)
            // Naive replace for basic funcs
            ['sin', 'cos', 'tan', 'sqrt', 'abs', 'log', 'exp'].forEach(fn => {
                const regex = new RegExp(fn + '\\\\(', 'g');
                jsExpr = jsExpr.replace(regex, 'Math.' + fn + '(');
            });
            const f = new Function(varName, 'return ' + jsExpr);
            return f(val);
        } catch (e) {
            return NaN;
        }
    }

    function update(x) {
        const gExpr = gInput.value;
        const fExpr = fInput.value;

        gDisp.textContent = gExpr;
        fDisp.textContent = fExpr;

        const u = safeMathEval(gExpr, 'x', x);
        const y = safeMathEval(fExpr, 'u', u);

        xSpan.textContent = x.toFixed(2);
        uSpan.textContent = isNaN(u) ? 'Err' : u.toFixed(2);
        ySpan.textContent = isNaN(y) ? 'Err' : y.toFixed(2);

        flows.forEach(f => f.style.width = '100%');
    }

    slider.oninput = (e) => update(parseFloat(e.target.value));
    gInput.oninput = () => update(parseFloat(slider.value));
    fInput.oninput = () => update(parseFloat(slider.value));

    let playing = false;
    container.querySelector('#auto-play').onclick = () => {
        if (playing) return;
        playing = true;
        let v = 0;
        const intv = setInterval(() => {
            v += 0.05;
            if (v > 3) {
                v = 0;
                clearInterval(intv);
                playing = false;
            }
            slider.value = v;
            update(v);
        }, 30);
    };

    update(0);
}

// --- Function Domain & Range Lab ---

function renderFunctionDomainRange(container) {
    container.innerHTML = `
        < div class="ineq-lab-container" style = "flex-direction:column;" >
             <div class="tab-bar">
                <div class="tab-btn active" data-mode="domain">求定义域</div>
                <div class="tab-btn" data-mode="range">求值域</div>
            </div>
            <div id="dr-content" style="flex:1;"></div>
        </div >
        `;

    const content = container.querySelector('#dr-content');
    const tabs = container.querySelectorAll('.tab-btn');

    tabs.forEach(t => t.onclick = () => {
        tabs.forEach(x => x.classList.remove('active'));
        t.classList.add('active');
        renderDRMode(t.dataset.mode);
    });

    function renderDRMode(mode) {
        if (mode === 'domain') {
            content.innerHTML = `
                <div style="padding:20px;">
                    <h3>f(x) = √x-2 + 1/(x-5)</h3>
                    <p>约束条件：</p>
                    <ul>
                        <li>被开方数 ≥ 0: x - 2 ≥ 0 ⇒ x ≥ 2</li>
                        <li>分母 ≠ 0: x - 5 ≠ 0 ⇒ x ≠ 5</li>
                    </ul>
                    <div id="domain-plot" style="width:100%; height:300px;"></div>
                </div>
             `;
            Plotly.react('domain-plot', [
                { x: [2, 10], y: [0, 0], mode: 'lines', line: { color: 'green', width: 5 }, name: 'Valid Region' },
                { x: [5], y: [0], mode: 'markers', marker: { color: 'white', size: 10, line: { color: 'red', width: 2 } }, name: 'Hole' }
            ], {
                xaxis: { range: [0, 8] },
                yaxis: { visible: false },
                shapes: [
                    { type: 'rect', x0: -5, x1: 2, y0: -1, y1: 1, fillcolor: 'rgba(0,0,0,0.2)', line: { width: 0 } }
                ],
                title: '定义域可视化'
            });
        } else {
            // Range Lab Expanded
            content.innerHTML = `
                <div style="display:flex; height:100%;">
                    <div style="width:200px; background:#f1f5f9; padding:10px; border-right:1px solid #e2e8f0;">
                        <div class="solver-option" onclick="window.drawRangeMethod('direct')">1. 直接法/观察法</div>
                        <div class="solver-option" onclick="window.drawRangeMethod('quadratic')">2. 配方法 (二次)</div>
                        <div class="solver-option" onclick="window.drawRangeMethod('sep_const')">3. 分离常数法</div>
                        <div class="solver-option" onclick="window.drawRangeMethod('subst')">4. 换元法</div>
                        <div class="solver-option" onclick="window.drawRangeMethod('ineq')">5. 基本不等式法</div>
                    </div>
                    <div style="flex:1; padding:20px;">
                        <div id="range-desc" style="margin-bottom:10px; font-weight:bold;">请选择左侧方法</div>
                        <div id="range-plot" style="width:100%; height:350px;"></div>
                    </div>
                </div>
             `;

            window.drawRangeMethod = (method) => {
                let title = '', x = [], y = [], layout = {};
                const desc = document.getElementById('range-desc');

                if (method === 'direct') {
                    title = '直接法 / 观察法';
                    desc.innerHTML = '例: y = 2x + 1 (x∈R) &rarr; y∈R<br>反比例 y = 1/x &rarr; y≠0';
                    for (let i = -5; i <= 5; i += 0.1) {
                        if (Math.abs(i) < 0.1) continue;
                        x.push(i); y.push(1 / i);
                    }
                    layout = { title: 'y = 1/x', yaxis: { range: [-10, 10] } };
                } else if (method === 'quadratic') {
                    title = '配方法';
                    desc.innerHTML = '例: y = x² - 4x + 5 = (x-2)² + 1 &ge; 1';
                    for (let i = 0; i <= 6; i += 0.1) { x.push(i); y.push(i * i - 4 * i + 5); }
                    layout = {
                        title: 'y = x² - 4x + 5',
                        shapes: [{ type: 'line', x0: -10, x1: 10, y0: 1, y1: 1, line: { dash: 'dash', color: 'red' } }],
                        annotations: [{ x: 2, y: 1, text: 'Min=1', startarrow: true }]
                    };
                } else if (method === 'sep_const') {
                    title = '分离常数法 (分式函数)';
                    desc.innerHTML = '例: y = (2x+3)/(x+1) = (2(x+1)+1)/(x+1) = 2 + 1/(x+1) &ne; 2';
                    // Atymptote at y=2
                    for (let i = -6; i <= 4; i += 0.05) {
                        if (Math.abs(i + 1) < 0.1) continue;
                        x.push(i); y.push((2 * i + 3) / (i + 1));
                    }
                    layout = {
                        title: 'y = (2x+3)/(x+1)',
                        shapes: [{ type: 'line', x0: -10, x1: 10, y0: 2, y1: 2, line: { dash: 'dot', color: 'red' } }],
                        yaxis: { range: [-5, 8] }
                    };
                } else if (method === 'subst') {
                    title = '换元法';
                    desc.innerHTML = '例: y = x + √(1-x). 令 t=√(1-x) &ge;0, x=1-t². <br>y = (1-t²) + t = -t²+t+1 (t&ge;0)';
                    // Plot -t^2+t+1 for t>=0
                    for (let t = 0; t <= 3; t += 0.1) {
                        x.push(t); y.push(-t * t + t + 1);
                    }
                    layout = { title: '转化后: y = -t² + t + 1 (t≥0)', xaxis: { title: 't' }, yaxis: { title: 'y' } };
                } else if (method === 'ineq') {
                    title = '基本不等式法';
                    desc.innerHTML = '例: y = x + 1/x (x>0). &ge; 2√(x*1/x) = 2, 当且仅当 x=1 时取等';
                    for (let i = 0.1; i <= 4; i += 0.1) {
                        x.push(i); y.push(i + 1 / i);
                    }
                    layout = {
                        title: 'y = x + 1/x (x>0)',
                        shapes: [{ type: 'line', x0: 0, x1: 10, y0: 2, y1: 2, line: { dash: 'dash', color: 'red' } }],
                        annotations: [{ x: 1, y: 2, text: 'Min=2', startarrow: true }]
                    };
                }

                Plotly.react('range-plot', [{ x, y, mode: 'lines', line: { width: 3, color: '#3b82f6' } }], layout);
            };

            // Init
            setTimeout(() => window.drawRangeMethod('quadratic'), 100);
        }
    }
    renderDRMode('domain');
}

// --- Function Expression Lab ---

function renderFunctionExpression(container) {
    container.innerHTML = `
        <div style="padding:40px; text-align:center;">
           <div class="expression-box" id="expr-target">
               已知 f(2x+1) = 4x² + 4x + 3
           </div>
           <div style="margin-bottom:20px;">
               <select id="example-sel" style="padding:8px; border-radius:4px;">
                   <option value="1">例1: f(x+1) = x² + 2x + 1</option>
                   <option value="2" selected>例2: f(2x+1) = 4x² + 4x + 3</option>
               </select>
           </div>
           <button class="btn-primary" id="solve-btn">逐步演示换元法</button>
           <div id="solve-steps" style="margin-top:30px; text-align:left; max-width:400px; margin-left:auto; margin-right:auto;"></div>
       </div >
        `;

    const btn = container.querySelector('#solve-btn');
    const steps = container.querySelector('#solve-steps');
    const sel = container.querySelector('#example-sel');
    const target = container.querySelector('#expr-target');

    const examples = {
        "1": {
            title: "已知 f(x+1) = x² + 2x + 1",
            steps: [
                "第一步：设元。 令 t = x + 1",
                "第二步：反解。 则 x = t - 1",
                "第三步：代入。 f(t) = (t-1)² + 2(t-1) + 1",
                "第四步：展开。 f(t) = (t² - 2t + 1) + (2t - 2) + 1",
                "第五步：化简。 f(t) = t²",
                "第六步：回代。 f(x) = x²"
            ]
        },
        "2": {
            title: "已知 f(2x+1) = 4x² + 4x + 3",
            steps: [
                "第一步：设元。 令 t = 2x + 1",
                "第二步：反解。 x = (t - 1) / 2",
                "第三步：代入。 f(t) = 4((t-1)/2)² + 4((t-1)/2) + 3",
                "第四步：展开。 f(t) = 4(t²-2t+1)/4 + 2(t-1) + 3",
                "第五步：化简。 f(t) = (t² - 2t + 1) + (2t - 2) + 3",
                "第六步：整理。 f(t) = t² + 2",
                "第七步：回代。 f(x) = x² + 2"
            ]
        }
    };

    sel.onchange = () => {
        target.textContent = examples[sel.value].title;
        steps.innerHTML = '';
    };

    btn.onclick = () => {
        // Clear previous interval if exists
        if (container._solveInterval) clearInterval(container._solveInterval);

        steps.innerHTML = '';
        const ex = examples[sel.value];
        let i = 0;

        container._solveInterval = setInterval(() => {
            if (i >= ex.steps.length) {
                clearInterval(container._solveInterval);
                return;
            }
            const p = document.createElement('div');
            p.className = 'formula-box';
            p.textContent = ex.steps[i];
            p.style.opacity = 0;
            p.style.transform = 'translateY(10px)';
            p.style.transition = 'all 0.5s';
            // Highlight keywords
            p.innerHTML = p.innerHTML.replace(/^(.*?)([:\s])/, '<strong>$1</strong>$2');

            steps.appendChild(p);

            // Trigger reflow
            void p.offsetWidth;

            p.style.opacity = 1;
            p.style.transform = 'translateY(0)';

            container.closest('.lab-viewport').scrollTop = container.closest('.lab-viewport').scrollHeight;

            i++;
        }, 800);
    };
}

// --- Function Parity Lab ---

function initFunctionParityLab(container) {
    container.innerHTML = `
        <div class="ineq-lab-container" style="flex-direction:column;">
            <div class="tab-bar">
                <div class="tab-btn active" data-tab="def">1. 定义与几何意义</div>
                <div class="tab-btn" data-tab="steps">2. 判定流程</div>
                <div class="tab-btn" data-tab="apps">3. 应用与重要结论</div>
            </div>
            <div id="parity-viewport" style="flex:1; overflow-y:auto;"></div>
        </div>
    `;

    const viewport = container.querySelector('#parity-viewport');
    const tabs = container.querySelectorAll('.tab-btn');

    tabs.forEach(tab => {
        tab.onclick = () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            renderParityTab(viewport, tab.dataset.tab);
        };
    });

    renderParityTab(viewport, 'def');
}

function renderParityTab(container, tab) {
    container.innerHTML = '';
    if (tab === 'def') renderParityDefinition(container);
    else if (tab === 'steps') renderParitySteps(container);
    else if (tab === 'apps') renderParityApps(container);
}

function renderParityDefinition(container) {
    container.innerHTML = `
        <div style="padding:20px;">
            <div class="headline-section">
                <h1>函数奇偶性定义</h1>
                <p>对于定义域内的任意 x，都有 -x 在定义域内 (必要条件)。</p>
            </div>

            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:20px; margin-top:20px;">
                <!-- Even Function -->
                <div class="dashboard-card">
                    <div class="card-header-row"><span class="card-title">偶函数 (Even Function)</span></div>
                    <div class="formula-box">$$f(-x) = f(x)$$</div>
                    <p style="font-size:13px; color:var(--muted);">图像关于 <strong>y 轴</strong> 对称</p>
                    <div id="even-plot" style="height:200px;"></div>
                </div>

                <!-- Odd Function -->
                <div class="dashboard-card">
                    <div class="card-header-row"><span class="card-title">奇函数 (Odd Function)</span></div>
                    <div class="formula-box">$$f(-x) = -f(x)$$</div>
                    <p style="font-size:13px; color:var(--muted);">图像关于 <strong>原点</strong> 对称</p>
                    <div id="odd-plot" style="height:200px;"></div>
                </div>
            </div>

            <div style="background:#f8fafc; padding:15px; border-radius:12px; margin-top:20px;">
                 <h3>交互演示</h3>
                 <div style="margin-bottom:10px;">
                    <label>选择函数: 
                        <select id="func-sel" style="padding:4px;">
                            <option value="even">f(x) = x² (偶)</option>
                            <option value="odd">f(x) = x³ (奇)</option>
                            <option value="cos">f(x) = cos(x) (偶)</option>
                            <option value="sin">f(x) = sin(x) (奇)</option>
                        </select>
                    </label>
                 </div>
                 <div>
                    <input type="range" min="-3" max="3" step="0.1" value="1.5" id="x-slider" style="width:300px;">
                    <span style="margin-left:10px;">x = <span id="x-val">1.5</span></span>
                 </div>
                 <div id="interactive-plot" style="width:100%; height:300px;"></div>
                 <div id="status-text" style="text-align:center; margin-top:10px; font-weight:bold;"></div>
            </div>
        </div>
    `;

    // Static Plots
    const x = Array.from({ length: 41 }, (_, i) => -2 + i * 0.1);
    const yEven = x.map(v => v * v);
    const yOdd = x.map(v => v * v * v);

    Plotly.newPlot('even-plot', [{ x, y: yEven, type: 'scatter', mode: 'lines' }], { margin: { t: 10, b: 20, l: 20, r: 20 }, xaxis: { visible: false }, yaxis: { visible: false } }, { displayModeBar: false });
    Plotly.newPlot('odd-plot', [{ x, y: yOdd, type: 'scatter', mode: 'lines' }], { margin: { t: 10, b: 20, l: 20, r: 20 }, xaxis: { visible: false }, yaxis: { visible: false } }, { displayModeBar: false });

    // Interactive
    const slider = container.querySelector('#x-slider');
    const sel = container.querySelector('#func-sel');
    const plot = 'interactive-plot';

    function update() {
        const val = parseFloat(slider.value);
        container.querySelector('#x-val').textContent = val.toFixed(1);
        const type = sel.value;

        let func, name, isEven;
        if (type === 'even') { func = v => v * v; name = 'x²'; isEven = true; }
        else if (type === 'odd') { func = v => v * v * v; name = 'x³'; isEven = false; }
        else if (type === 'cos') { func = Math.cos; name = 'cos(x)'; isEven = true; }
        else if (type === 'sin') { func = Math.sin; name = 'sin(x)'; isEven = false; }

        const xData = [];
        const yData = [];
        for (let i = -4; i <= 4; i += 0.1) {
            xData.push(i);
            yData.push(func(i));
        }

        const traces = [
            { x: xData, y: yData, name: 'f(x)', line: { color: '#94a3b8' } },
            {
                x: [val, -val],
                y: [func(val), func(-val)],
                mode: 'markers+text',
                text: ['A(x, f(x))', isEven ? "A'(-x, f(x))" : "A'(-x, -f(x))"],
                textposition: 'top center',
                marker: { size: 10, color: ['#3b82f6', '#ef4444'] }
            }
        ];

        // Connecting lines
        if (isEven) {
            traces.push({ x: [-val, val], y: [func(val), func(val)], mode: 'lines', line: { dash: 'dot', color: '#333' }, showlegend: false });
        } else {
            traces.push({ x: [-val, val], y: [func(-val), func(val)], mode: 'lines', line: { dash: 'dot', color: '#333' }, showlegend: false });
        }

        const layout = {
            title: `f(${val.toFixed(1)}) = ${func(val).toFixed(2)}, f(${-val.toFixed(1)}) = ${func(-val).toFixed(2)}`,
            margin: { t: 40, b: 40, l: 40, r: 40 },
            hovermode: 'closest'
        };

        Plotly.newPlot(plot, traces, layout, { displayModeBar: false });

        const status = container.querySelector('#status-text');
        if (isEven) status.innerHTML = `f(-x) = f(x) <span style="color:green">✔ 满足偶函数定义</span>`;
        else status.innerHTML = `f(-x) = -f(x) <span style="color:green">✔ 满足奇函数定义</span>`;
    }

    slider.oninput = update;
    sel.onchange = update;
    setTimeout(update, 100);
    if (window.MathJax) MathJax.typesetPromise();
}

function renderParitySteps(container) {
    container.innerHTML = `
        <div style="padding:20px;">
            <div class="headline-section">
                <h1>判定流程 (Judgment Process)</h1>
                <p>判断函数奇偶性的标准步骤</p>
            </div>
            
            <div style="display:flex; justify-content:center; margin:20px 0;">
                <div class="pipeline-node" id="step1">1. 查定义域</div>
                <div class="pipeline-connector"><div class="pipeline-flow"></div></div>
                <div class="pipeline-node" id="step2">2. 算 f(-x)</div>
                <div class="pipeline-connector"><div class="pipeline-flow"></div></div>
                <div class="pipeline-node" id="step3">3. 比较关系</div>
            </div>

            <div style="background:#f8fafc; padding:20px; border-radius:12px;">
                <label>输入函数表达式 f(x) = <input type="text" id="func-input" value="x^2 + 1" style="width:200px; padding:4px; font-family:monospace;"></label>
                <button class="btn-primary" id="check-btn" style="margin-left:10px;">开始判定</button>
                
                <div id="step-log" style="margin-top:20px;"></div>
            </div>
        </div>
    `;

    const btn = container.querySelector('#check-btn');
    const input = container.querySelector('#func-input');
    const log = container.querySelector('#step-log');

    btn.onclick = () => {
        log.innerHTML = '';
        const expr = input.value;

        // Numerical check
        let result = 'neither';
        try {
            // Convert math syntax to JS
            let jsExpr = expr.toLowerCase()
                .replace(/\^/g, '**')
                .replace(/\b(sin|cos|tan|abs|sqrt|log|exp)\b/g, 'Math.$1');

            const f = new Function('x', `return ${jsExpr}`);

            // Test symmetry
            let allEven = true;
            let allOdd = true;
            let domainValid = true;

            const points = [1.1, 2.5, 0.5, 3.0];
            for (let x of points) {
                const y1 = f(x);
                const y2 = f(-x);
                if (!isFinite(y1) || !isFinite(y2)) { domainValid = false; break; }

                if (Math.abs(y1 - y2) > 1e-5) allEven = false;
                if (Math.abs(y1 + y2) > 1e-5) allOdd = false;
            }

            if (!domainValid) result = 'error';
            else if (allEven && allOdd) result = 'both';
            else if (allEven) result = 'even';
            else if (allOdd) result = 'odd';
            else result = 'neither';

        } catch (e) {
            result = 'error';
        }

        // Step 1
        addStep("步骤 1：查定义域", "检查定义域是否关于原点对称。<br>（此处假设 x 取值都在定义域内）");

        // Step 2
        setTimeout(() => {
            addStep("步骤 2：算 f(-x)", `将 x 替换为 -x，计算 f(-x) 的表达式并化简。`);
        }, 600);

        // Step 3
        setTimeout(() => {
            if (result === 'error') {
                addStep("错误", `无法解析表达式或定义域不对称。请检查输入格式 (如 x^2 + 1)。`);
            } else if (result === 'even') {
                addStep("步骤 3：比较关系", `f(-x) = f(x) 恒成立。<br><strong style="color:green">✔ 结论：该函数是偶函数。</strong>`);
            } else if (result === 'odd') {
                addStep("步骤 3：比较关系", `f(-x) = -f(x) 恒成立。<br><strong style="color:blue">✔ 结论：该函数是奇函数。</strong>`);
            } else if (result === 'both') {
                addStep("步骤 3：比较关系", `f(-x) = f(x) 且 f(-x) = -f(x)。<br><strong style="color:purple">✔ 结论：既是奇函数又是偶函数 (即 f(x)=0)。</strong>`);
            } else {
                addStep("步骤 3：比较关系", `f(-x) ≠ f(x) 且 f(-x) ≠ -f(x)。<br><strong style="color:red">✘ 结论：非奇非偶函数。</strong>`);
            }
        }, 1200);
    };

    function addStep(title, desc) {
        const div = document.createElement('div');
        div.className = 'formula-box';
        div.style.marginBottom = '10px';
        div.style.opacity = 0;
        div.style.transform = 'translateY(10px)';
        div.style.transition = 'all 0.5s';
        div.innerHTML = `<strong>${title}</strong><br>${desc}`;
        log.appendChild(div);

        void div.offsetWidth; // Reflow
        div.style.opacity = 1;
        div.style.transform = 'translateY(0)';
    }
}

function renderParityApps(container) {
    container.innerHTML = `
        <div style="display:flex; height:100%; gap:20px; padding:20px;">
            <div style="width:220px; flex-shrink:0; background:#f8fafc; border-radius:12px; padding:10px; overflow-y:auto; height: 100%;">
                <h3 style="padding:10px; margin:0; border-bottom:1px solid #e2e8f0; font-size:16px;">重要结论</h3>
                <div class="nav-pills" id="apps-nav" style="margin-top:10px;">
                    <div class="nav-item active" data-target="c1">1. 定义域对称性</div>
                    <div class="nav-item" data-target="c2">2. 图像对称性</div>
                    <div class="nav-item" data-target="c3">3. 构造奇偶函数</div>
                    <div class="nav-item" data-target="c4">4. 函数分解公式</div>
                    <div class="nav-item" data-target="c5">5. 奇偶函数运算</div>
                    <div class="nav-item" data-target="c6">6. 既奇又偶函数</div>
                    <div class="nav-item" data-target="c7">7. 奇函数在0处</div>
                    <div class="nav-item" data-target="c8">8. 多项式系数</div>
                </div>
            </div>
            <div id="apps-content" style="flex:1; overflow-y:auto; background:#fff; border-radius:12px; padding:20px; border:1px solid #e2e8f0;">
            </div>
        </div>
    `;

    const navItems = container.querySelectorAll('.nav-item');
    const content = container.querySelector('#apps-content');

    function loadContent(target) {
        content.innerHTML = '';
        const renderers = {
            'c1': renderConclusion1,
            'c2': renderConclusion2,
            'c3': renderConclusion3,
            'c4': renderConclusion4,
            'c5': renderConclusion5,
            'c6': renderConclusion6,
            'c7': renderConclusion7,
            'c8': renderConclusion8
        };
        if (renderers[target]) renderers[target](content);
        if (window.MathJax) MathJax.typesetPromise();
    }

    navItems.forEach(item => {
        item.onclick = () => {
            navItems.forEach(n => n.classList.remove('active'));
            item.classList.add('active');
            loadContent(item.dataset.target);
        };
    });

    loadContent('c1');
}

function renderConclusion1(container) {
    container.innerHTML = `
        <h3>1. 定义域对称性</h3>
        <p>具有奇偶性的函数，其定义域关于原点对称。</p>
        <div class="formula-box">$$x \\in D \\iff -x \\in D$$</div>
        <p>这是函数具有奇偶性的<strong>必要不充分条件</strong>。</p>
        <div id="c1-plot" style="height:250px; margin-top:20px;"></div>
    `;

    // Plot showing symmetric interval
    const trace1 = {
        x: [-5, 5], y: [0, 0], mode: 'lines', line: { color: '#3b82f6', width: 4 },
        name: '[-5, 5]'
    };
    const layout = {
        title: '对称区间示例 [-5, 5]',
        yaxis: { visible: false, range: [-1, 1] },
        xaxis: { range: [-6, 6] }
    };
    Plotly.newPlot('c1-plot', [trace1], layout, { displayModeBar: false });
}

function renderConclusion2(container) {
    container.innerHTML = `
        <h3>2. 图像对称性</h3>
        <ul>
            <li>奇函数图象关于<strong>原点</strong>对称。</li>
            <li>偶函数图象关于<strong>y轴</strong>对称。</li>
        </ul>
        <div style="display:flex; gap:20px; margin-top:20px;">
            <div id="c2-odd" style="flex:1; height:250px;"></div>
            <div id="c2-even" style="flex:1; height:250px;"></div>
        </div>
    `;
    const x = Array.from({ length: 41 }, (_, i) => -2 + i * 0.1);
    Plotly.newPlot('c2-odd', [{ x, y: x.map(v => v * v * v), type: 'scatter' }], { title: '奇函数 (原点对称)', margin: { t: 30, b: 20, l: 20, r: 20 } }, { displayModeBar: false });
    Plotly.newPlot('c2-even', [{ x, y: x.map(v => v * v), type: 'scatter' }], { title: '偶函数 (y轴对称)', margin: { t: 30, b: 20, l: 20, r: 20 } }, { displayModeBar: false });
}

function renderConclusion3(container) {
    container.innerHTML = `
        <h3>3. 构造奇偶函数</h3>
        <p>若 f(x) 定义域关于原点对称，则：</p>
        <div class="formula-box">$$F(x) = f(x) + f(-x) \\quad \\text{是偶函数}$$</div>
        <div class="formula-box">$$G(x) = f(x) - f(-x) \\quad \\text{是奇函数}$$</div>
        <div style="margin-top:20px; background:#f1f5f9; padding:15px; border-radius:8px;">
            <strong>验证：</strong><br>
            F(-x) = f(-x) + f(-(-x)) = f(-x) + f(x) = F(x)<br>
            G(-x) = f(-x) - f(-(-x)) = f(-x) - f(x) = -(f(x) - f(-x)) = -G(x)
        </div>
    `;
}




function renderConclusion4(container) {
    container.innerHTML = `
        <h3>4. 函数分解公式</h3>
        <p>任意定义域关于原点对称的函数 f(x)，都可以表示为一个奇函数与一个偶函数的和。</p>
        <div class="formula-box">$$f(x) = \\underbrace{\\frac{f(x)+f(-x)}{2}}_{偶函数} + \\underbrace{\\frac{f(x)-f(-x)}{2}}_{奇函数}$$</div>
        <p>这被称为函数的奇偶分解。</p>
    `;
}

function renderConclusion5(container) {
    container.innerHTML = `
        <h3>5. 奇偶函数运算性质</h3>
        <p>设 f(x), g(x) 是定义域为 D 的奇函数或偶函数，在 D 上：</p>
        <table class="table" style="width:100%; border-collapse:collapse; margin-top:10px;">
            <tr style="background:#e2e8f0;"><th style="padding:8px;">f(x)</th><th style="padding:8px;">g(x)</th><th style="padding:8px;">f(x) ± g(x)</th><th style="padding:8px;">f(x) · g(x)</th></tr>
            <tr><td style="padding:8px; border:1px solid #ddd;">奇</td><td style="padding:8px; border:1px solid #ddd;">奇</td><td style="padding:8px; border:1px solid #ddd;">奇</td><td style="padding:8px; border:1px solid #ddd;">偶</td></tr>
            <tr><td style="padding:8px; border:1px solid #ddd;">偶</td><td style="padding:8px; border:1px solid #ddd;">偶</td><td style="padding:8px; border:1px solid #ddd;">偶</td><td style="padding:8px; border:1px solid #ddd;">偶</td></tr>
            <tr><td style="padding:8px; border:1px solid #ddd;">奇</td><td style="padding:8px; border:1px solid #ddd;">偶</td><td style="padding:8px; border:1px solid #ddd;">非奇非偶</td><td style="padding:8px; border:1px solid #ddd;">奇</td></tr>
        </table>
        <div style="margin-top:10px; font-style:italic; color:#64748b;">
            口诀：<br>
            加减法：同奇则奇，同偶则偶，一奇一偶非奇非偶。<br>
            乘除法：同类为偶，异类为奇 (类似于符号法则：负负得正，正负得负)。
        </div>
    `;
}

function renderConclusion6(container) {
    container.innerHTML = `
        <h3>6. 既奇又偶函数</h3>
        <p>若 f(x) 既是奇函数又是偶函数，则：</p>
        <div class="formula-box">$$f(x) = 0, \\quad x \\in D$$</div>
        <p>其中 D 关于原点对称。</p>
        <div id="c6-plot" style="height:200px;"></div>
    `;
    const trace = {
        x: [-5, 5], y: [0, 0], mode: 'lines', line: { color: 'purple', width: 3 },
        name: 'f(x)=0'
    };
    Plotly.newPlot('c6-plot', [trace], { title: 'f(x)=0', yaxis: { range: [-1, 1] } }, { displayModeBar: false });
}

function renderConclusion7(container) {
    container.innerHTML = `
        <h3>7. 奇函数在 0 处的值</h3>
        <p>若奇函数 y = f(x) 在 x = 0 处有定义，则必有：</p>
        <div class="formula-box">$$f(0) = 0$$</div>
        <p><strong>证明：</strong><br>由奇函数定义 f(-x) = -f(x)<br>令 x = 0，得 f(0) = -f(0) <br>$\\implies 2f(0) = 0 \\implies f(0) = 0$</p>
    `;
}

// --- Function Monotonicity Lab ---

function initFunctionMonotonicityLab(container) {
    container.innerHTML = `
        <div class="ineq-lab-container" style="flex-direction:column;">
            <div class="tab-bar">
                <div class="tab-btn active" data-tab="def">1. 单调性定义</div>
                <div class="tab-btn" data-tab="equiv">2. 等价表现形式</div>
                <div class="tab-btn" data-tab="methods">3. 判定方法与性质</div>
            </div>
            <div id="mono-content" style="flex:1; overflow-y:auto; position:relative;"></div>
        </div>
    `;

    const tabs = container.querySelectorAll('.tab-btn');
    const content = container.querySelector('#mono-content');

    function loadTab(tabId) {
        tabs.forEach(t => t.classList.remove('active'));
        container.querySelector(`[data-tab="${tabId}"]`).classList.add('active');
        content.innerHTML = '';

        if (tabId === 'def') renderMonotonicityDefinition(content);
        else if (tabId === 'equiv') renderMonotonicityEquivalence(content);
        else if (tabId === 'methods') renderMonotonicityMethods(content);

        if (window.MathJax) MathJax.typesetPromise();
    }

    tabs.forEach(t => t.onclick = () => loadTab(t.dataset.tab));
    loadTab('def');
}

function renderMonotonicityDefinition(container) {
    container.innerHTML = `
        <div style="padding:20px; height:100%; display:flex; flex-direction:column;">
            <div class="headline-section">
                <h1>函数单调性定义 (Definition)</h1>
                <p>任意取 $x_1, x_2 \\in D$ 且 $x_1 < x_2$：</p>
                <div class="formula-box">
                    $$x_1 < x_2 \\implies f(x_1) < f(x_2) \\quad (\\text{增函数})$$
                    $$x_1 < x_2 \\implies f(x_1) > f(x_2) \\quad (\\text{减函数})$$
                </div>
            </div>
            
            <div style="flex:1; display:flex; gap:20px; margin-top:20px; min-height:0;">
                <div style="flex:1; background:#fff; border-radius:12px; border:1px solid #e2e8f0; padding:10px; display:flex; flex-direction:column;">
                    <div style="margin-bottom:10px; display:flex; justify-content:space-between; align-items:center;">
                        <span style="font-weight:bold;">交互演示</span>
                        <select id="mono-func-sel" style="padding:4px; border-radius:4px;">
                            <option value="inc">f(x) = x³ (增)</option>
                            <option value="dec">f(x) = -x³ (减)</option>
                            <option value="exp">f(x) = 2^x (增)</option>
                            <option value="log">f(x) = log₂(x) (增)</option>
                        </select>
                    </div>
                    <div id="mono-def-plot" style="flex:1; width:100%;"></div>
                    <div style="padding:10px; background:#f8fafc; border-radius:8px; margin-top:10px;">
                        <div style="display:flex; gap:20px; align-items:center;">
                            <div style="flex:1;">
                                <label>x₁: <input type="range" id="x1-slider" min="-2" max="2" step="0.1" value="-1" style="width:100%;"></label>
                            </div>
                            <div style="flex:1;">
                                <label>x₂: <input type="range" id="x2-slider" min="-2" max="2" step="0.1" value="1" style="width:100%;"></label>
                            </div>
                        </div>
                        <div id="mono-status" style="margin-top:10px; text-align:center; font-weight:bold; color:#333;"></div>
                    </div>
                </div>
            </div>
        </div>
    `;

    const sel = container.querySelector('#mono-func-sel');
    const s1 = container.querySelector('#x1-slider');
    const s2 = container.querySelector('#x2-slider');
    const status = container.querySelector('#mono-status');
    const plotId = 'mono-def-plot';

    function getFunc(type) {
        if (type === 'inc') return { f: x => Math.pow(x, 3), range: [-2.5, 2.5], name: 'x³' };
        if (type === 'dec') return { f: x => -Math.pow(x, 3), range: [-2.5, 2.5], name: '-x³' };
        if (type === 'exp') return { f: x => Math.pow(2, x), range: [-2, 2.5], name: '2^x' };
        if (type === 'log') return { f: x => x <= 0 ? NaN : Math.log2(x), range: [0.1, 4], name: 'log₂(x)' };
        return { f: x => x, range: [-5, 5] };
    }

    function update() {
        const type = sel.value;
        const config = getFunc(type);

        // Update slider ranges based on func domain
        if (type === 'log') {
            s1.min = 0.1; s1.max = 4;
            s2.min = 0.1; s2.max = 4;
        } else {
            s1.min = -2; s1.max = 2;
            s2.min = -2; s2.max = 2;
        }

        let v1 = parseFloat(s1.value);
        let v2 = parseFloat(s2.value);

        // Enforce x1 != x2 for better vis, but user controls it
        // Check relation
        const f1 = config.f(v1);
        const f2 = config.f(v2);

        const xLine = [];
        const yLine = [];
        const step = (config.range[1] - config.range[0]) / 100;
        for (let x = config.range[0]; x <= config.range[1]; x += step) {
            xLine.push(x);
            yLine.push(config.f(x));
        }

        const traces = [
            { x: xLine, y: yLine, mode: 'lines', name: config.name, line: { color: '#94a3b8' } },
            {
                x: [v1, v2], y: [f1, f2], mode: 'markers+text',
                text: ['A(x₁)', 'B(x₂)'], textposition: 'top center',
                marker: { size: 12, color: ['#3b82f6', '#e34b72'] }
            }
        ];

        // Draw arrow from A to B
        if (v1 !== v2) {
            traces.push({
                x: [v1, v2], y: [f1, f2], mode: 'lines',
                line: { color: '#333', width: 2, dash: 'dot' },
                showlegend: false
            });
        }

        const layout = {
            margin: { t: 20, b: 30, l: 30, r: 20 },
            hovermode: 'closest',
            shapes: [
                { type: 'line', x0: v1, x1: v1, y0: 0, y1: f1, line: { dash: 'dot', width: 1, color: '#3b82f6' } },
                { type: 'line', x0: v2, x1: v2, y0: 0, y1: f2, line: { dash: 'dot', width: 1, color: '#e34b72' } }
            ]
        };

        Plotly.react(plotId, traces, layout, { displayModeBar: false });

        // Status text
        if (v1 < v2) {
            if (f1 < f2) status.innerHTML = `x₁ < x₂ 且 f(x₁) < f(x₂) <br> <span style="color:green">📈 函数值随自变量增大而增大 (增函数特征)</span>`;
            else if (f1 > f2) status.innerHTML = `x₁ < x₂ 且 f(x₁) > f(x₂) <br> <span style="color:red">📉 函数值随自变量增大而减小 (减函数特征)</span>`;
            else status.innerHTML = `f(x₁) = f(x₂) (常函数特征)`;
        } else if (v1 > v2) {
            status.innerHTML = `请调整 x₁ < x₂ 以符合定义习惯`;
        } else {
            status.innerHTML = `x₁ = x₂，无法判断单调性`;
        }
    }

    s1.oninput = update;
    s2.oninput = update;
    sel.onchange = update;
    setTimeout(update, 100);
}

function renderMonotonicityEquivalence(container) {
    container.innerHTML = `
        <div style="padding:20px; height:100%; overflow-y:auto;">
            <div class="headline-section">
                <h1>单调性的等价表现 (Equivalent Forms)</h1>
            </div>

            <div class="dashboard-card" style="margin-top:20px;">
                <div class="card-header-row"><span class="card-title">形式一：位移形式 (Displacement)</span></div>
                <div class="formula-box">$$f(x+a) > f(x) \\quad (a>0) \\implies \\text{增函数}$$</div>
                <div style="display:flex; align-items:center; gap:20px; padding:10px;">
                    <label>平移量 a: <input type="range" id="eq-disp-slider" min="0.1" max="2" step="0.1" value="1"></label>
                    <span id="eq-disp-val">a = 1.0</span>
                </div>
                <div id="eq-disp-plot" style="height:250px;"></div>
            </div>

            <div class="dashboard-card" style="margin-top:20px;">
                <div class="card-header-row"><span class="card-title">形式二：差商形式 (Difference Quotient)</span></div>
                <div class="formula-box">$$\\frac{f(x_1)-f(x_2)}{x_1-x_2} > 0 \\iff (x_1-x_2)(f(x_1)-f(x_2)) > 0$$</div>
                <p style="font-size:13px; color:var(--muted);">几何意义：割线斜率为正</p>
                <div id="eq-diff-plot" style="height:250px;"></div>
                <div id="eq-diff-val" style="text-align:center; font-weight:bold; margin-top:5px;"></div>
            </div>
        </div>
    `;

    // 1. Displacement Plot
    const dispSlider = container.querySelector('#eq-disp-slider');
    const dispVal = container.querySelector('#eq-disp-val');

    function updateDisp() {
        const a = parseFloat(dispSlider.value);
        dispVal.textContent = `a = ${a.toFixed(1)}`;

        const f = x => Math.sin(x);
        const x = [], y = [], y_shifted = [];
        for (let i = 0; i <= 6; i += 0.1) {
            x.push(i);
            y.push(f(i));
            y_shifted.push(f(i + a));
        }

        Plotly.react('eq-disp-plot', [
            { x, y, name: 'f(x)=sin(x)' },
            { x, y: y_shifted, name: `f(x+${a.toFixed(1)})`, line: { dash: 'dot' } }
        ], { margin: { t: 20, b: 20, l: 30, r: 20 }, title: '比较 f(x) 与 f(x+a)' }, { displayModeBar: false });
    }
    dispSlider.oninput = updateDisp;
    setTimeout(updateDisp, 100);

    // 2. Difference Quotient Plot
    const x = Array.from({ length: 51 }, (_, i) => -2 + i * 0.08);
    const y = x.map(v => v * v); // x^2

    // Static demo points for diff quotient
    const x1 = 0.5, x2 = 1.5;
    const y1 = x1 * x1, y2 = x2 * x2;
    const slope = (y2 - y1) / (x2 - x1);

    Plotly.react('eq-diff-plot', [
        { x, y, name: 'f(x)=x²', mode: 'lines' },
        { x: [x1, x2], y: [y1, y2], mode: 'markers', marker: { size: 10, color: 'red' }, name: 'Points' },
        { x: [-1, 2.5], y: [y1 - slope * (x1 + 1), y2 + slope * (1)], mode: 'lines', line: { color: 'green', width: 1 }, name: 'Secant' }
    ], {
        margin: { t: 20, b: 20, l: 30, r: 20 },
        annotations: [{ x: (x1 + x2) / 2, y: (y1 + y2) / 2, text: `k = ${slope.toFixed(2)} > 0`, showarrow: true, arrowhead: 1 }]
    }, { displayModeBar: false });

    container.querySelector('#eq-diff-val').innerHTML = `k > 0 <span style="color:green">✔ 增函数区间</span>`;
}

function renderMonotonicityMethods(container) {
    container.innerHTML = `
        <div style="display:flex; height:100%;">
            <div style="width:220px; background:#f8fafc; border-right:1px solid #e2e8f0; padding:10px; overflow-y:auto;">
                <div class="nav-pills">
                    <div class="nav-item active" onclick="window.loadMonoMethod('def', this)">1. 定义法判定</div>
                    <div class="nav-item" onclick="window.loadMonoMethod('func', this)">2. 常见函数库</div>
                    <div class="nav-item" onclick="window.loadMonoMethod('sum', this)">3. 和函数性质</div>
                    <div class="nav-item" onclick="window.loadMonoMethod('comp', this)">4. 复合函数</div>
                    <div class="nav-item" onclick="window.loadMonoMethod('nike', this)">5. 对勾函数</div>
                    <div class="nav-item" onclick="window.loadMonoMethod('piece', this)">6. 分段函数</div>
                </div>
            </div>
            <div id="method-content" style="flex:1; padding:20px; overflow-y:auto;"></div>
        </div>
    `;

    window.loadMonoMethod = (type, el) => {
        container.querySelectorAll('.nav-item').forEach(e => e.classList.remove('active'));
        if (el) el.classList.add('active');
        const c = container.querySelector('#method-content');
        c.innerHTML = '';

        if (type === 'def') {
            c.innerHTML = `
                <h3>定义法判定五步法</h3>
                <div class="pipeline-vertical">
                    <div class="step-box">1️⃣ <strong>任取</strong> $x_1, x_2 \\in D$，且 $x_1 < x_2$</div>
                    <div class="step-box">2️⃣ <strong>作差</strong> $f(x_1) - f(x_2)$</div>
                    <div class="step-box">3️⃣ <strong>变形</strong> (因式分解 / 配方 / 通分)</div>
                    <div class="step-box">4️⃣ <strong>定号</strong> 判断差的正负</div>
                    <div class="step-box">5️⃣ <strong>下结论</strong> ($<0 \\implies$ 增, $>0 \\implies$ 减)</div>
                </div>
                <div style="margin-top:20px; padding:15px; background:#fff; border:1px solid #ddd; border-radius:8px;">
                    <strong>示例：证明 $f(x) = x + \\frac{1}{x}$ 在 $(1, +\\infty)$ 上单调递增</strong>
                    <button class="btn-primary btn-sm" onclick="this.nextElementSibling.style.display='block'">查看证明过程</button>
                    <div style="display:none; margin-top:10px; font-size:14px; line-height:1.6;">
                        1. 任取 $x_1, x_2 \\in (1, +\\infty)$ 且 $x_1 < x_2$<br>
                        2. $f(x_1) - f(x_2) = (x_1 + \\frac{1}{x_1}) - (x_2 + \\frac{1}{x_2}) = (x_1 - x_2) + (\\frac{1}{x_1} - \\frac{1}{x_2})$<br>
                        3. $= (x_1 - x_2) + \\frac{x_2 - x_1}{x_1 x_2} = (x_1 - x_2)(1 - \\frac{1}{x_1 x_2})$<br>
                        4. $\\because 1 < x_1 < x_2 \\implies x_1 x_2 > 1 \\implies 1 - \\frac{1}{x_1 x_2} > 0$<br>
                           又 $x_1 - x_2 < 0$<br>
                           $\\therefore f(x_1) - f(x_2) < 0$<br>
                        5. $\\therefore f(x)$ 在 $(1, +\\infty)$ 上单调递增。
                    </div>
                </div>
            `;
        } else if (type === 'func') {
            c.innerHTML = `
                <h3>常见函数单调性库 (Common Functions)</h3>
                
                <div style="margin-bottom:20px;">
                    <div class="btn-group" role="group">
                        <button class="btn btn-outline-primary active" onclick="updateFunc(this, 'linear')">一次函数</button>
                        <button class="btn btn-outline-primary" onclick="updateFunc(this, 'inv')">反比例</button>
                        <button class="btn btn-outline-primary" onclick="updateFunc(this, 'quad')">二次函数</button>
                        <button class="btn btn-outline-primary" onclick="updateFunc(this, 'exp')">指数函数</button>
                        <button class="btn btn-outline-primary" onclick="updateFunc(this, 'log')">对数函数</button>
                    </div>
                </div>

                <div style="display:grid; grid-template-columns:1fr 2fr; gap:20px;">
                    <div id="func-info" style="background:#f8fafc; padding:15px; border-radius:8px; font-size:14px;">
                        <!-- Dynamic Info -->
                    </div>
                    <div id="func-lib-plot" style="height:300px; border:1px solid #eee; border-radius:8px;"></div>
                </div>
            `;

            window.updateFunc = (btn, type) => {
                if (btn) {
                    btn.parentNode.querySelectorAll('.btn').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                }

                const info = document.getElementById('func-info');
                let xVals = [], yVals = [];
                let layout = { margin: { t: 30, b: 20, l: 30, r: 20 }, title: '' };
                let shapes = [];
                let annotations = [];

                if (type === 'linear') {
                    info.innerHTML = `
                        <strong>一次函数 $y=kx+b$</strong>
                        <ul style="padding-left:20px; margin-top:10px;">
                            <li>$k > 0 \\implies$ <span style="color:green">R 上单调递增</span></li>
                            <li>$k < 0 \\implies$ <span style="color:red">R 上单调递减</span></li>
                        </ul>
                    `;
                    for (let i = -2; i <= 2; i += 0.1) { xVals.push(i); yVals.push(2 * i + 1); }
                    layout.title = 'y = 2x + 1 (k=2 > 0)';
                } else if (type === 'inv') {
                    info.innerHTML = `
                        <strong>反比例函数 $y=\\frac{k}{x}$</strong>
                        <ul style="padding-left:20px; margin-top:10px;">
                            <li>$k > 0$: 在 $(-\\infty,0)$ 和 $(0,+\\infty)$ 上<span style="color:red">分别递减</span></li>
                            <li>⚠️ <strong>错误说法：</strong> 在定义域上递减 (因为 $-1 < 1$ 但 $f(-1) < f(1)$)</li>
                        </ul>
                    `;
                    // Split for plot to avoid line crossing 0
                    const x1 = [], y1 = [], x2 = [], y2 = [];
                    for (let i = -4; i <= -0.1; i += 0.1) { x1.push(i); y1.push(1 / i); }
                    for (let i = 0.1; i <= 4; i += 0.1) { x2.push(i); y2.push(1 / i); }
                    xVals = [x1, x2]; yVals = [y1, y2]; // Special handling
                    layout.title = 'y = 1/x (k=1 > 0)';
                    layout.yaxis = { range: [-5, 5] };
                } else if (type === 'quad') {
                    info.innerHTML = `
                        <strong>二次函数 $y=a(x-h)^2+k$</strong>
                        <ul style="padding-left:20px; margin-top:10px;">
                            <li>以对称轴 $x=h$ 为界</li>
                            <li>$a > 0$: 左减右增</li>
                            <li>$a < 0$: 左增右减</li>
                        </ul>
                    `;
                    for (let i = -2; i <= 4; i += 0.1) { xVals.push(i); yVals.push(Math.pow(i - 1, 2) - 1); }
                    layout.title = 'y = (x-1)² - 1 (a>0)';
                    shapes.push({ type: 'line', x0: 1, x1: 1, y0: -2, y1: 8, line: { dash: 'dot', color: 'red' } });
                    annotations.push({ x: 1, y: 8, text: '对称轴 x=1', showarrow: false, yanchor: 'bottom' });
                } else if (type === 'exp') {
                    info.innerHTML = `
                        <strong>指数函数 $y=a^x$</strong>
                        <ul style="padding-left:20px; margin-top:10px;">
                            <li>$a > 1 \\implies$ <span style="color:green">R 上单调递增</span></li>
                            <li>$0 < a < 1 \\implies$ <span style="color:red">R 上单调递减</span></li>
                        </ul>
                    `;
                    for (let i = -2; i <= 2; i += 0.1) { xVals.push(i); yVals.push(Math.pow(2, i)); }
                    layout.title = 'y = 2^x (a=2 > 1)';
                } else if (type === 'log') {
                    info.innerHTML = `
                        <strong>对数函数 $y=\\log_a x$</strong>
                        <ul style="padding-left:20px; margin-top:10px;">
                            <li>定义域 $(0, +\\infty)$</li>
                            <li>$a > 1 \\implies$ <span style="color:green">单调递增</span></li>
                            <li>$0 < a < 1 \\implies$ <span style="color:red">单调递减</span></li>
                        </ul>
                    `;
                    for (let i = 0.1; i <= 4; i += 0.1) { xVals.push(i); yVals.push(Math.log2(i)); }
                    layout.title = 'y = log₂x (a=2 > 1)';
                }

                if (window.MathJax) MathJax.typesetPromise([info]);

                let traces = [];
                if (type === 'inv') {
                    traces.push({ x: xVals[0], y: yVals[0], name: 'Branch 1', line: { color: '#2563eb' } });
                    traces.push({ x: xVals[1], y: yVals[1], name: 'Branch 2', line: { color: '#2563eb' } });
                } else {
                    traces.push({ x: xVals, y: yVals, line: { color: '#2563eb' } });
                }

                layout.shapes = shapes;
                layout.annotations = annotations;
                Plotly.react('func-lib-plot', traces, layout, { displayModeBar: false });
            };

            // Init
            setTimeout(() => window.updateFunc(null, 'linear'), 50);
        } else if (type === 'sum') {
            c.innerHTML = `
                <h3>和函数的单调性 (Sum Properties)</h3>
                <div style="margin-bottom:15px; padding:10px; background:#f0f9ff; border-radius:6px;">
                    <p>若 $f(x), g(x)$ 在区间 $I$ 上单调性一致：</p>
                    <ul style="margin:5px 0 0 20px;">
                        <li><strong>增 + 增 = 增</strong> (Inc + Inc = Inc)</li>
                        <li><strong>减 + 减 = 减</strong> (Dec + Dec = Dec)</li>
                        <li>注：增 + 减 结果不确定</li>
                    </ul>
                </div>
                
                <div class="control-group">
                    <label>选择示例组合：</label>
                    <select id="sum-sel" class="form-select">
                        <option value="inc_inc">x³ (增) + x (增) = x³+x (增)</option>
                        <option value="dec_dec">-x³ (减) + (-x) (减) = -(x³+x) (减)</option>
                        <option value="inc_dec">x² (右增) + (-x) (减) = ? (不确定)</option>
                    </select>
                </div>

                <div id="sum-plot" style="height:300px; margin-top:10px;"></div>
            `;

            setTimeout(() => {
                const sel = document.getElementById('sum-sel');
                function updateSum() {
                    const type = sel.value;
                    const xVals = [];
                    const y1Vals = [], y2Vals = [], ySumVals = [];

                    // Range depends on function?
                    // x^3+x: [-2, 2]
                    for (let i = -2; i <= 2; i += 0.1) {
                        xVals.push(i);
                        let v1, v2;
                        if (type === 'inc_inc') {
                            v1 = Math.pow(i, 3);
                            v2 = i;
                        } else if (type === 'dec_dec') {
                            v1 = -Math.pow(i, 3);
                            v2 = -i;
                        } else { // inc_dec: x^2 + (-x) on [0, 2] mainly
                            // Let's use entire range [-2, 2]
                            // x^2 is dec then inc. -x is dec.
                            // User text says "x^2 (Right Inc)". Let's restrict range?
                            // Or just show full range and let user see.
                            // x^2 is Inc on [0, inf). -x is Dec on [0, inf).
                            // So on [0, inf): Inc + Dec = ?
                            // x^2 - x. Roots at 0, 1. Min at 0.5. Dec then Inc.
                            v1 = i * i;
                            v2 = -i;
                        }
                        y1Vals.push(v1);
                        y2Vals.push(v2);
                        ySumVals.push(v1 + v2);
                    }

                    const traces = [
                        { x: xVals, y: y1Vals, name: 'f(x)', line: { dash: 'dot', width: 2, color: '#94a3b8' } },
                        { x: xVals, y: y2Vals, name: 'g(x)', line: { dash: 'dot', width: 2, color: '#cbd5e1' } },
                        { x: xVals, y: ySumVals, name: 'f(x)+g(x)', line: { width: 4, color: '#2563eb' } }
                    ];

                    Plotly.react('sum-plot', traces, {
                        margin: { t: 30, b: 20, l: 30, r: 20 },
                        legend: { orientation: 'h', y: 1.1 },
                        title: type === 'inc_dec' ? 'x² + (-x) 在 [0, +∞) 既有增又有减' : '单调性叠加演示'
                    }, { displayModeBar: false });
                }
                sel.onchange = updateSum;
                updateSum();
            }, 50);
        } else if (type === 'comp') {
            c.innerHTML = `
                <h3>复合函数单调性 (同增异减)</h3>
                <p>设 $y = f(g(x))$，内函数 $u=g(x)$，外函数 $y=f(u)$</p>
                
                <div style="display:flex; gap:20px; margin-bottom:20px;">
                    <div class="control-group">
                        <label>内层 $u=g(x)$</label>
                        <select id="comp-inner" class="form-select">
                            <option value="inc">u = x (增)</option>
                            <option value="dec">u = -x (减)</option>
                        </select>
                    </div>
                    <div class="control-group">
                        <label>外层 $y=f(u)$</label>
                        <select id="comp-outer" class="form-select">
                            <option value="inc">y = u³ (增)</option>
                            <option value="dec">y = -u³ (减)</option>
                        </select>
                    </div>
                </div>

                <div id="comp-plot" style="height:300px; border:1px solid #eee; border-radius:8px;"></div>
                <div id="comp-status" style="margin-top:10px; font-weight:bold; text-align:center;"></div>

                <table class="table" style="margin-top:20px; font-size:14px;">
                    <tr><th>内层 g(x)</th><th>外层 f(u)</th><th>复合 y</th></tr>
                    <tr id="row-inc-inc"><td>↗️ 增</td><td>↗️ 增</td><td>↗️ 增</td></tr>
                    <tr id="row-inc-dec"><td>↗️ 增</td><td>↘️ 减</td><td>↘️ 减</td></tr>
                    <tr id="row-dec-inc"><td>↘️ 减</td><td>↗️ 增</td><td>↘️ 减</td></tr>
                    <tr id="row-dec-dec"><td>↘️ 减</td><td>↘️ 减</td><td>↗️ 增</td></tr>
                </table>
            `;

            setTimeout(() => {
                const sInner = document.getElementById('comp-inner');
                const sOuter = document.getElementById('comp-outer');

                function updateComp() {
                    const innerType = sInner.value;
                    const outerType = sOuter.value;

                    const xVals = [];
                    const yVals = [];
                    for (let i = -1.5; i <= 1.5; i += 0.05) {
                        xVals.push(i);
                        let u = (innerType === 'inc') ? i : -i;
                        let val = (outerType === 'inc') ? Math.pow(u, 3) : -Math.pow(u, 3);
                        yVals.push(val);
                    }

                    // Highlight table row
                    document.querySelectorAll('tr[id^="row-"]').forEach(r => r.style.background = 'transparent');
                    const rowId = `row-${innerType}-${outerType}`;
                    const row = document.getElementById(rowId);
                    if (row) row.style.background = '#fef3c7';

                    const isSame = (innerType === outerType) || (innerType === 'inc' && outerType === 'inc') || (innerType === 'dec' && outerType === 'dec');
                    // Actually: inc/inc->inc (same), dec/dec->inc (same), inc/dec->dec (diff), dec/inc->dec (diff)
                    // My logic: if both inc (same) -> inc. if both dec (same) -> inc. 
                    // Wait, logic check:
                    // Inc(Inc) -> Inc. Same? Yes.
                    // Dec(Dec) -> Inc. Same? Yes.
                    // Inc(Dec) -> Dec. Diff? Yes.
                    // Dec(Inc) -> Dec. Diff? Yes.
                    // So if (inner == outer) -> Inc. Else -> Dec.
                    // Note: 'inc' === 'inc' is true. 'dec' === 'dec' is true.

                    const resText = (innerType === outerType) ? '同增' : '异减';
                    const finalType = (innerType === outerType) ? '增函数' : '减函数';
                    const color = (innerType === outerType) ? 'green' : 'red';

                    document.getElementById('comp-status').innerHTML =
                        `<span style="color:${color}">法则：${resText} $\\implies$ 复合函数是 ${finalType}</span>`;

                    Plotly.react('comp-plot', [{
                        x: xVals, y: yVals, type: 'scatter', mode: 'lines', line: { width: 3, color: '#2563eb' }
                    }], {
                        title: `y = f(g(x)) 图像`,
                        margin: { t: 30, b: 20, l: 30, r: 20 },
                        xaxis: { range: [-1.6, 1.6], title: 'x' },
                        yaxis: { range: [-4, 4], title: 'y' }
                    }, { displayModeBar: false });

                    if (window.MathJax) MathJax.typesetPromise();
                }

                sInner.onchange = updateComp;
                sOuter.onchange = updateComp;
                updateComp();
            }, 50);
        } else if (type === 'nike') {
            c.innerHTML = `
                <h3>对勾函数 ("Nike" Function)</h3>
                <div class="formula-box">$$f(x) = x + \\frac{a}{x} \\quad (a>0)$$</div>
                <div style="display:flex; align-items:center; gap:10px; margin-bottom:10px;">
                    <label>参数 a: <input type="range" id="nike-a" min="0.1" max="5" step="0.1" value="1"></label>
                    <span id="nike-val">a=1</span>
                </div>
                <div id="nike-plot" style="height:300px;"></div>
                <p>单调递增区间：$(-\\infty, -\\sqrt{a}], [\\sqrt{a}, +\\infty)$<br>单调递减区间：$[-\\sqrt{a}, 0), (0, \\sqrt{a}]$</p>
            `;
            setTimeout(() => {
                const slider = document.getElementById('nike-a');
                const updateNike = () => {
                    const a = parseFloat(slider.value);
                    document.getElementById('nike-val').textContent = `a=${a}`;
                    const sqrtA = Math.sqrt(a);
                    const x = [], y = [];
                    for (let i = -5; i <= 5; i += 0.05) {
                        if (Math.abs(i) < 0.1) continue;
                        x.push(i); y.push(i + a / i);
                    }
                    Plotly.react('nike-plot', [{ x, y, line: { color: '#8b5cf6' } }], {
                        shapes: [
                            { type: 'line', x0: sqrtA, x1: sqrtA, y0: -10, y1: 10, line: { dash: 'dot', color: 'red' } },
                            { type: 'line', x0: -sqrtA, x1: -sqrtA, y0: -10, y1: 10, line: { dash: 'dot', color: 'red' } }
                        ],
                        annotations: [
                            { x: sqrtA, y: sqrtA + a / sqrtA, text: `√a=${sqrtA.toFixed(1)}`, showarrow: true, arrowhead: 1 }
                        ],
                        margin: { t: 10, b: 20, l: 20, r: 20 },
                        yaxis: { range: [-10, 10] }
                    }, { displayModeBar: false });
                };
                slider.oninput = updateNike;
                updateNike();
            }, 100);
        } else if (type === 'piece') {
            c.innerHTML = `
                <h3>分段函数单调性</h3>
                <p><strong>陷阱：</strong> 两段分别单调 $\\nRightarrow$ 整体单调</p>
                <div class="formula-box">
                    $$f(x) = \\begin{cases} g(x), & x \\le x_0 \\\\ h(x), & x > x_0 \\end{cases}$$
                </div>
                <p>整体单调递增条件：<br>1. $g(x)$ 增, $h(x)$ 增<br>2. <strong>接缝处：$g(x_0) \\le h(x_0)$</strong> (这是易错点!)</p>
                <div id="piece-plot" style="height:200px;"></div>
            `;
            setTimeout(() => {
                const x1 = [-2, 0], y1 = [-2, 0];
                const x2 = [0, 2], y2 = [-1, 1]; // Jump down
                Plotly.react('piece-plot', [
                    { x: x1, y: y1, name: 'Left (Inc)' },
                    { x: x2, y: y2, name: 'Right (Inc)' }
                ], { title: '反例：接缝处断裂导致非单调', margin: { t: 30, b: 20, l: 20, r: 20 } }, { displayModeBar: false });
            }, 100);
        }

        if (window.MathJax) MathJax.typesetPromise();
    };

    window.loadMonoMethod('def', null);
}

// --- Function Extrema Lab ---

function initFunctionExtremaLab(container) {
    container.innerHTML = `
        <div class="ineq-lab-container" style="flex-direction:column;">
            <div class="tab-bar">
                <div class="tab-btn active" data-tab="def">1. 最值定义 (Definition)</div>
                <div class="tab-btn" data-tab="range">2. 值域与最值 (Range)</div>
                <div class="tab-btn" data-tab="cont">3. 闭区间连续 (Theorem)</div>
            </div>
            <div id="extrema-content" style="flex:1; overflow-y:auto; position:relative;"></div>
        </div>
    `;

    const tabs = container.querySelectorAll('.tab-btn');
    const content = container.querySelector('#extrema-content');

    function loadTab(tabId) {
        tabs.forEach(t => t.classList.remove('active'));
        container.querySelector(`[data-tab="${tabId}"]`).classList.add('active');
        content.innerHTML = '';

        if (tabId === 'def') renderExtremaDefinition(content);
        else if (tabId === 'range') renderExtremaRangeConversion(content);
        else if (tabId === 'cont') renderExtremaContinuous(content);

        if (window.MathJax) MathJax.typesetPromise();
    }

    tabs.forEach(t => t.onclick = () => loadTab(t.dataset.tab));
    loadTab('def');
}

function renderExtremaDefinition(container) {
    container.innerHTML = `
        <div style="padding:20px; height:100%; display:flex; flex-direction:column;">
            <div class="headline-section">
                <h1>函数最值定义 (Definition)</h1>
                <div class="formula-box">
                    $$x_0 \\text{ 为最大值点 } \\iff \\forall x \\in A, f(x) \\le f(x_0) = M$$
                    $$x_1 \\text{ 为最小值点 } \\iff \\forall x \\in A, f(x) \\ge f(x_1) = N$$
                </div>
            </div>
            
            <div class="control-group" style="margin-top:20px;">
                <label>选择函数：</label>
                <select id="ext-def-func" class="form-select">
                    <option value="quad_max">f(x) = -x² + 4x - 3 (有最大值)</option>
                    <option value="quad_min">f(x) = x² - 2x + 1 (有最小值)</option>
                    <option value="sin">f(x) = sin(x) (既有最大又有最小)</option>
                </select>
            </div>
            
            <div style="margin-top:10px; display:flex; align-items:center; gap:10px;">
                <label>移动 x:</label>
                <input type="range" id="ext-def-slider" min="-5" max="5" step="0.1" value="0" style="flex:1;">
                <span id="ext-def-val">x=0</span>
            </div>

            <div id="ext-def-plot" style="flex:1; border:1px solid #eee; border-radius:8px; margin-top:10px; min-height:250px;"></div>
            <div id="ext-def-status" style="margin-top:10px; min-height:40px; text-align:center; font-weight:bold;"></div>
        </div>
    `;

    const sel = container.querySelector('#ext-def-func');
    const slider = container.querySelector('#ext-def-slider');
    const valSpan = container.querySelector('#ext-def-val');
    const status = container.querySelector('#ext-def-status');

    function update() {
        const type = sel.value;
        const xCur = parseFloat(slider.value);
        valSpan.innerText = `x=${xCur.toFixed(1)}`;

        let func, range, maxPt, minPt, formula;
        if (type === 'quad_max') {
            // -x^2 + 4x - 3. Vertex at x=2, y=1.
            func = x => -x * x + 4 * x - 3;
            range = [-1, 5];
            maxPt = { x: 2, y: 1 };
            formula = 'y = -x^2 + 4x - 3';
        } else if (type === 'quad_min') {
            // x^2 - 2x + 1. Vertex at x=1, y=0.
            func = x => x * x - 2 * x + 1;
            range = [-2, 4];
            minPt = { x: 1, y: 0 };
            formula = 'y = (x-1)^2';
        } else {
            // sin(x)
            func = x => Math.sin(x);
            range = [-6, 6];
            maxPt = { x: Math.PI / 2, y: 1 }; // approximate
            minPt = { x: -Math.PI / 2, y: -1 }; // approximate
            formula = 'y = sin(x)';
        }

        const xVals = [], yVals = [];
        for (let i = range[0]; i <= range[1]; i += 0.1) {
            xVals.push(i);
            yVals.push(func(i));
        }

        const traces = [{ x: xVals, y: yVals, mode: 'lines', name: 'f(x)', line: { color: '#3b82f6' } }];

        // Current point
        const yCur = func(xCur);
        traces.push({ x: [xCur], y: [yCur], mode: 'markers', marker: { size: 10, color: 'orange' }, name: 'Current' });

        const shapes = [];
        const annotations = [];

        // Check Max/Min
        if (maxPt) {
            // Check if user is close
            const isClose = Math.abs(xCur - maxPt.x) < 0.2;
            const color = isClose ? 'green' : '#cbd5e1';
            traces.push({ x: [maxPt.x], y: [maxPt.y], mode: 'markers', marker: { size: 12, color: color, symbol: 'diamond' }, name: 'Max M' });
            if (isClose) {
                status.innerHTML = `<span style="color:green; font-size:16px;">检测到最大值点! M = ${maxPt.y}</span>`;
                annotations.push({ x: maxPt.x, y: maxPt.y, text: 'M', showarrow: true, arrowhead: 2, ax: 0, ay: -30, font: { size: 18, color: 'green' } });
            }
        }
        if (minPt) {
            const isClose = Math.abs(xCur - minPt.x) < 0.2;
            const color = isClose ? 'purple' : '#cbd5e1';
            traces.push({ x: [minPt.x], y: [minPt.y], mode: 'markers', marker: { size: 12, color: color, symbol: 'diamond' }, name: 'Min N' });
            if (isClose) {
                status.innerHTML = `<span style="color:purple; font-size:16px;">检测到最小值点! N = ${minPt.y}</span>`;
                annotations.push({ x: minPt.x, y: minPt.y, text: 'N', showarrow: true, arrowhead: 2, ax: 0, ay: 30, font: { size: 18, color: 'purple' } });
            }
        }

        if (!status.innerHTML) status.innerText = `当前值 f(${xCur.toFixed(1)}) = ${yCur.toFixed(2)}`;

        Plotly.react('ext-def-plot', traces, {
            title: formula,
            margin: { t: 30, b: 30, l: 30, r: 20 },
            hovermode: 'closest',
            shapes: shapes,
            annotations: annotations
        }, { displayModeBar: false });
    }

    sel.onchange = update;
    slider.oninput = update;
    setTimeout(update, 100);
}

function renderExtremaRangeConversion(container) {
    container.innerHTML = `
        <div style="padding:20px; height:100%; overflow-y:auto;">
            <h3>值域问题 $\\to$ 最值问题</h3>
            <p>求值域往往转化为求 $f(x)$ 的最大值 $M$ 和最小值 $N$，则值域为 $[N, M]$ (连续时)。</p>
            
            <div class="control-group">
                <label>选择函数示例：</label>
                <select id="ext-range-func" class="form-select">
                    <option value="quad">f(x) = x² (有最小值0, 无最大)</option>
                    <option value="inv">f(x) = 1/x (无最值, 值域≠0)</option>
                    <option value="sin">f(x) = sin(x) (闭区间 [-1, 1])</option>
                </select>
            </div>

            <div style="display:flex; gap:20px; margin-top:20px;">
                <div id="ext-range-plot" style="flex:2; height:350px;"></div>
                <div style="flex:1; display:flex; flex-direction:column; justify-content:center; align-items:center; background:#f8fafc; border-radius:8px; padding:10px;">
                     <div style="font-size:14px; color:#64748b;">值域区间 (Range)</div>
                     <div id="range-display" style="font-size:18px; font-weight:bold; margin-top:10px; color:#2563eb;"></div>
                </div>
            </div>
            <div style="margin-top:10px; font-size:13px; color:#666;">
                提示：点击Y轴区间可查看具体范围。阴影区域表示所有可能的函数值集合。
            </div>
        </div>
    `;

    const sel = container.querySelector('#ext-range-func');

    function update() {
        const type = sel.value;
        let xVals = [], yVals = [];
        let shapes = [];
        let rangeText = "";
        let yRange = [-5, 5];

        if (type === 'quad') {
            for (let i = -2.5; i <= 2.5; i += 0.1) { xVals.push(i); yVals.push(i * i); }
            rangeText = "[0, +∞)";
            // Shadow for [0, 5]
            shapes.push({ type: 'rect', x0: -3, x1: 3, y0: 0, y1: 10, fillcolor: 'rgba(0,255,0,0.1)', line: { width: 0 }, layer: 'below' });
            shapes.push({ type: 'line', x0: 0, x1: 0, y0: 0, y1: 10, xref: 'paper', line: { color: 'green', width: 5 }, opacity: 0.3 }); // Y-axis highlight
        } else if (type === 'inv') {
            const x1 = [], y1 = [], x2 = [], y2 = [];
            for (let i = -4; i <= -0.2; i += 0.1) { x1.push(i); y1.push(1 / i); }
            for (let i = 0.2; i <= 4; i += 0.1) { x2.push(i); y2.push(1 / i); }
            xVals = [x1, x2]; yVals = [y1, y2];
            rangeText = "(-∞, 0) ∪ (0, +∞)";
            // Shadow everywhere except 0
            shapes.push({ type: 'rect', x0: -5, x1: 5, y0: -10, y1: 0, fillcolor: 'rgba(0,0,255,0.05)', line: { width: 0 }, layer: 'below' });
            shapes.push({ type: 'rect', x0: -5, x1: 5, y0: 0, y1: 10, fillcolor: 'rgba(0,0,255,0.05)', line: { width: 0 }, layer: 'below' });
        } else if (type === 'sin') {
            for (let i = -6; i <= 6; i += 0.1) { xVals.push(i); yVals.push(Math.sin(i)); }
            rangeText = "[-1, 1]";
            shapes.push({ type: 'rect', x0: -7, x1: 7, y0: -1, y1: 1, fillcolor: 'rgba(128,0,128,0.1)', line: { width: 0 }, layer: 'below' });
            yRange = [-2, 2];
        }

        document.getElementById('range-display').innerText = rangeText;

        let traces = [];
        if (type === 'inv') {
            traces.push({ x: xVals[0], y: yVals[0], mode: 'lines', line: { color: '#2563eb' }, name: 'Branch 1' });
            traces.push({ x: xVals[1], y: yVals[1], mode: 'lines', line: { color: '#2563eb' }, name: 'Branch 2' });
        } else {
            traces.push({ x: xVals, y: yVals, mode: 'lines', line: { color: '#2563eb' }, name: 'f(x)' });
        }

        Plotly.react('ext-range-plot', traces, {
            margin: { t: 20, b: 20, l: 40, r: 20 },
            yaxis: { range: yRange, title: 'Range (Value Domain)' },
            shapes: shapes
        }, { displayModeBar: false });
    }
    sel.onchange = update;
    setTimeout(update, 100);
}

function renderExtremaContinuous(container) {
    container.innerHTML = `
        <div style="padding:20px; height:100%; overflow-y:auto;">
            <h3>闭区间连续函数必有最值定理</h3>
            <p>若 $f(x)$ 在闭区间 $[a, b]$ 上连续，则必存在 $x_{max}, x_{min} \\in [a, b]$。</p>
            
            <div style="background:#fff; padding:15px; border-radius:8px; border:1px solid #e2e8f0; margin-bottom:15px;">
                <div style="display:flex; gap:20px; align-items:center; margin-bottom:10px;">
                    <label>区间左端点 a: <input type="range" id="cont-a" min="-3" max="0" step="0.1" value="-1.5"></label>
                    <span id="val-a" style="width:60px;">a=-1.5</span>
                </div>
                <div style="display:flex; gap:20px; align-items:center;">
                    <label>区间右端点 b: <input type="range" id="cont-b" min="0.1" max="3" step="0.1" value="2"></label>
                    <span id="val-b" style="width:60px;">b=2.0</span>
                </div>
            </div>

            <div id="cont-plot" style="height:300px; border:1px solid #eee;"></div>
            <div id="cont-status" style="margin-top:10px; padding:10px; background:#f0f9ff; border-radius:6px; min-height:60px;"></div>
        </div>
    `;

    const sliderA = container.querySelector('#cont-a');
    const sliderB = container.querySelector('#cont-b');
    const valA = container.querySelector('#val-a');
    const valB = container.querySelector('#val-b');
    const status = container.querySelector('#cont-status');

    function update() {
        const a = parseFloat(sliderA.value);
        const b = parseFloat(sliderB.value);
        valA.innerText = `a=${a.toFixed(1)}`;
        valB.innerText = `b=${b.toFixed(1)}`;

        // Function: f(x) = x^3 - 3x + 1 (Local max at -1 (y=3), local min at 1 (y=-1))
        // We want to show how max/min changes with [a, b]
        const func = x => Math.pow(x, 3) - 3 * x + 1;

        // Full plot background
        const xFull = [], yFull = [];
        for (let i = -3.5; i <= 3.5; i += 0.1) { xFull.push(i); yFull.push(func(i)); }

        // Interval plot
        const xInt = [], yInt = [];
        let minVal = Infinity, maxVal = -Infinity;
        let minX = 0, maxX = 0;

        // Sampling for max/min finding
        for (let i = a; i <= b; i += 0.05) {
            const y = func(i);
            xInt.push(i);
            yInt.push(y);
            if (y < minVal) { minVal = y; minX = i; }
            if (y > maxVal) { maxVal = y; maxX = i; }
        }
        // Check exact endpoints
        if (func(a) < minVal) { minVal = func(a); minX = a; }
        if (func(a) > maxVal) { maxVal = func(a); maxX = a; }
        if (func(b) < minVal) { minVal = func(b); minX = b; }
        if (func(b) > maxVal) { maxVal = func(b); maxX = b; }

        status.innerHTML = `
            <strong>当前区间 [${a.toFixed(1)}, ${b.toFixed(1)}]</strong><br>
            <span style="color:green">最大值 M = ${maxVal.toFixed(2)} (at x=${maxX.toFixed(2)})</span><br>
            <span style="color:purple">最小值 N = ${minVal.toFixed(2)} (at x=${minX.toFixed(2)})</span>
        `;

        Plotly.react('cont-plot', [
            { x: xFull, y: yFull, mode: 'lines', line: { color: '#e2e8f0', width: 1 }, name: 'f(x) global' },
            { x: xInt, y: yInt, mode: 'lines', line: { color: '#2563eb', width: 4 }, name: 'f(x) on [a,b]' },
            { x: [maxX], y: [maxVal], mode: 'markers+text', marker: { size: 10, color: 'green' }, text: ['M'], textposition: 'top center', name: 'Max' },
            { x: [minX], y: [minVal], mode: 'markers+text', marker: { size: 10, color: 'purple' }, text: ['N'], textposition: 'bottom center', name: 'Min' }
        ], {
            margin: { t: 20, b: 20, l: 30, r: 20 },
            shapes: [
                { type: 'line', x0: a, x1: a, y0: -10, y1: 10, line: { dash: 'dot', color: 'black' } },
                { type: 'line', x0: b, x1: b, y0: -10, y1: 10, line: { dash: 'dot', color: 'black' } }
            ],
            yaxis: { range: [-4, 6] }
        }, { displayModeBar: false });

        if (window.MathJax) MathJax.typesetPromise();
    }

    sliderA.oninput = update;
    sliderB.oninput = update;
    setTimeout(update, 100);
}

// --- Quadratic Function Lab Logic ---

function initFunctionQuadraticLab(container) {
    container.innerHTML = `
        <div style="display:flex; height:100%; gap:20px; padding:20px;">
            <div style="width:240px; flex-shrink:0; background:#f8fafc; border-radius:12px; padding:10px; overflow-y:auto; height: 100%;">
                <h3 style="padding:10px; margin:0; border-bottom:1px solid #e2e8f0; font-size:16px;">二次函数模块</h3>
                <div class="nav-pills" id="quad-nav" style="margin-top:10px;">
                    <div class="nav-item active" data-target="m1">1. 一般式</div>
                    <div class="nav-item" data-target="m2">2. 顶点式</div>
                    <div class="nav-item" data-target="m3">3. 交点式</div>
                    <div class="nav-item" data-target="m4">4. 图像及性质</div>
                    <div class="nav-item" data-target="m5">5. 根与系数关系</div>
                    <div class="nav-item" data-target="m6">6. 最值问题</div>
                    <div class="nav-item" data-target="m7">7. 方程与不等式</div>
                    <div class="nav-item" data-target="m8">8. 不等式恒成立</div>
                    <div class="nav-item" data-target="m9">9. 根的分布</div>
                </div>
            </div>
            <div id="quad-content" style="flex:1; overflow-y:auto; background:#fff; border-radius:12px; padding:20px; border:1px solid #e2e8f0;">
            </div>
        </div>
    `;

    const navItems = container.querySelectorAll('.nav-item');
    const content = container.querySelector('#quad-content');

    function loadContent(target) {
        content.innerHTML = '';
        const renderers = {
            'm1': renderQuadraticGeneral,
            'm2': renderQuadraticVertex,
            'm3': renderQuadraticFactored,
            'm4': renderQuadraticProps,
            'm5': renderQuadraticVieta,
            'm6': renderQuadraticExtrema,
            'm7': renderQuadraticEqIneq,
            'm8': renderQuadraticIneqStrat,
            'm9': renderQuadraticRootDist
        };
        if (renderers[target]) renderers[target](content);
        if (window.MathJax) MathJax.typesetPromise();
    }

    navItems.forEach(item => {
        item.onclick = () => {
            navItems.forEach(n => n.classList.remove('active'));
            item.classList.add('active');
            loadContent(item.dataset.target);
        };
    });

    loadContent('m1');
}

function renderQuadraticGeneral(container) {
    container.innerHTML = `
        <h3>1. 一般式 (General Form)</h3>
        <div class="formula-box">$$ f(x) = ax^2 + bx + c \\quad (a \\neq 0) $$</div>
        <div class="lab-row" style="margin-top:20px;">
            <div class="lab-column" style="width:300px; flex-grow:0;">
                <div class="controls-section">
                    <label>a = <span id="val-a">1</span> <input type="range" id="rng-a" min="-10" max="10" step="0.1" value="1"></label>
                    <label>b = <span id="val-b">0</span> <input type="range" id="rng-b" min="-20" max="20" step="0.1" value="0"></label>
                    <label>c = <span id="val-c">0</span> <input type="range" id="rng-c" min="-50" max="50" step="0.1" value="0"></label>
                </div>
                <div class="info-card" style="margin-top:10px;">
                    <p>对称轴: $$ x = -\\frac{b}{2a} = <span id="res-axis">0</span> $$</p>
                    <p>顶点: $$ (<span id="res-vx">0</span>, <span id="res-vy">0</span>) $$</p>
                    <p>判别式: $$ \\Delta = <span id="res-delta">0</span> $$</p>
                </div>
            </div>
            <div class="lab-column">
                <div id="quad-plot-gen" style="height:400px;"></div>
            </div>
        </div>
    `;

    const rngA = container.querySelector('#rng-a');
    const rngB = container.querySelector('#rng-b');
    const rngC = container.querySelector('#rng-c');

    function update() {
        let a = parseFloat(rngA.value);
        if (Math.abs(a) < 0.1) a = 0.1;
        const b = parseFloat(rngB.value);
        const c = parseFloat(rngC.value);

        container.querySelector('#val-a').innerText = a;
        container.querySelector('#val-b').innerText = b;
        container.querySelector('#val-c').innerText = c;

        const axis = -b / (2 * a);
        const vy = (4 * a * c - b * b) / (4 * a);
        const delta = b * b - 4 * a * c;

        container.querySelector('#res-axis').innerText = axis.toFixed(2);
        container.querySelector('#res-vx').innerText = axis.toFixed(2);
        container.querySelector('#res-vy').innerText = vy.toFixed(2);
        container.querySelector('#res-delta').innerText = delta.toFixed(2);

        const x = [], y = [];
        // Dynamic range based on vertex and roots
        let spread = 10;
        let x1, x2;
        if (delta >= 0) {
            const sqrtDelta = Math.sqrt(delta);
            x1 = (-b - sqrtDelta) / (2 * a);
            x2 = (-b + sqrtDelta) / (2 * a);
            const dist = Math.max(Math.abs(x1 - axis), Math.abs(x2 - axis));
            spread = Math.max(10, dist + 5);
        }

        const xMin = axis - spread;
        const xMax = axis + spread;

        for (let i = xMin; i <= xMax; i += 0.1) {
            x.push(i);
            y.push(a * i * i + b * i + c);
        }

        Plotly.react('quad-plot-gen', [{
            x: x, y: y, type: 'scatter', mode: 'lines', line: { color: '#3b82f6', width: 3 }
        }, {
            x: [axis], y: [vy], mode: 'markers+text', marker: { color: 'red', size: 8 }, name: 'Vertex',
            text: ['Vertex'], textposition: 'top center'
        }, ...(delta >= 0 ? [{
            x: [x1, x2], y: [0, 0], mode: 'markers+text', marker: { color: 'orange', size: 10 }, name: 'Roots',
            text: [x1.toFixed(2), x2.toFixed(2)], textposition: 'bottom center'
        }] : [])], {
            title: `f(x) = ${a}x² + ${b}x + ${c}`,
            margin: { t: 40, b: 30, l: 40, r: 20 },
            xaxis: { range: [xMin, xMax] },
            yaxis: { range: [vy - 20, vy + 20] },
        }, { displayModeBar: false });

        if (window.MathJax) MathJax.typesetPromise();
    }
    rngA.oninput = update;
    rngB.oninput = update;
    rngC.oninput = update;
    setTimeout(update, 100);
}

function renderQuadraticVertex(container) {
    container.innerHTML = `
        <h3>2. 顶点式 (Vertex Form)</h3>
        <div class="formula-box">$$ f(x) = a(x-h)^2 + k \\quad (a \\neq 0) $$</div>
        <div class="lab-row" style="margin-top:20px;">
            <div class="lab-column" style="width:300px; flex-grow:0;">
                <div class="controls-section">
                    <label>a = <span id="val-va">1</span> <input type="range" id="rng-va" min="-10" max="10" step="0.1" value="1"></label>
                    <label>h = <span id="val-vh">2</span> <input type="range" id="rng-vh" min="-20" max="20" step="0.1" value="2"></label>
                    <label>k = <span id="val-vk">1</span> <input type="range" id="rng-vk" min="-50" max="50" step="0.1" value="1"></label>
                </div>
                <div class="info-card" style="margin-top:10px;">
                    <p>顶点坐标: $$ (h, k) = (<span id="res-v-h">2</span>, <span id="res-v-k">1</span>) $$</p>
                    <p>对称轴: $$ x = h = <span id="res-v-axis">2</span> $$</p>
                </div>
            </div>
            <div class="lab-column">
                <div id="quad-plot-ver" style="height:400px;"></div>
            </div>
        </div>
    `;

    const rngA = container.querySelector('#rng-va');
    const rngH = container.querySelector('#rng-vh');
    const rngK = container.querySelector('#rng-vk');

    function update() {
        let a = parseFloat(rngA.value);
        if (Math.abs(a) < 0.1) a = 0.1;
        const h = parseFloat(rngH.value);
        const k = parseFloat(rngK.value);

        container.querySelector('#val-va').innerText = a;
        container.querySelector('#val-vh').innerText = h;
        container.querySelector('#val-vk').innerText = k;

        container.querySelector('#res-v-h').innerText = h;
        container.querySelector('#res-v-k').innerText = k;
        container.querySelector('#res-v-axis').innerText = h;

        // Dynamic range based on vertex
        const xMin = h - 10;
        const xMax = h + 10;

        const x = [], y = [];
        for (let i = xMin; i <= xMax; i += 0.1) {
            x.push(i);
            y.push(a * Math.pow(i - h, 2) + k);
        }

        Plotly.react('quad-plot-ver', [{
            x: x, y: y, type: 'scatter', mode: 'lines', line: { color: '#10b981', width: 3 }
        }, {
            x: [h], y: [k], type: 'scatter', mode: 'markers+text', marker: { color: 'red', size: 10 }, name: 'Vertex',
            text: ['Vertex'], textposition: 'top center'
        }], {
            title: `f(x) = ${a}(x - (${h}))² + (${k})`,
            margin: { t: 40, b: 30, l: 30, r: 20 },
            xaxis: { range: [xMin, xMax] },
            yaxis: { range: [k - 20, k + 20] }
        }, { displayModeBar: false });

        if (window.MathJax) MathJax.typesetPromise();
    }
    rngA.oninput = update;
    rngH.oninput = update;
    rngK.oninput = update;
    setTimeout(update, 100);
}

// Inverse Function Lab
function initFunctionInverseLab(container) {
    container.innerHTML = `
        <div class="ineq-lab-container" style="flex-direction:column;">
            <div class="tab-bar">
                <div class="tab-btn active" data-tab="concept">1. 概念</div>
                <div class="tab-btn" data-tab="explanation">2. 说明</div>
                <div class="tab-btn" data-tab="steps">3. 求法步骤</div>
                <div class="tab-btn" data-tab="symmetry">4. 图像关系</div>
                <div class="tab-btn" data-tab="properties">5. 性质关系</div>
            </div>
            <div id="inverse-viewport" style="flex:1; overflow-y:auto;"></div>
        </div>
    `;

    const viewport = container.querySelector('#inverse-viewport');
    const tabs = container.querySelectorAll('.tab-btn');

    tabs.forEach(tab => {
        tab.onclick = () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            renderInverseTab(viewport, tab.dataset.tab);
        };
    });

    renderInverseTab(viewport, 'concept');
}

function renderInverseTab(container, tab) {
    container.innerHTML = '';
    if (tab === 'concept') renderInverseConcept(container);
    else if (tab === 'explanation') renderInverseExplanation(container);
    else if (tab === 'steps') renderInverseSteps(container);
    else if (tab === 'symmetry') renderInverseSymmetry(container);
    else if (tab === 'properties') renderInverseProperties(container);
}

// Module 1: Concept
function renderInverseConcept(container) {
    container.innerHTML = `
        <div style="padding:20px;">
            <div class="headline-section">
                <h1>反函数的概念</h1>
                <p>将 $y = f(x)$ 看作机器：输入 $x$ $\\to$ 输出 $y$。反函数 $x = f^{-1}(y)$ 是逆向机器：输入 $y$ $\\to$ 输出 $x$。</p>
            </div>
            <div style="display:flex; gap:20px; align-items:center; justify-content:center; background:#f0f9ff; padding:20px; border-radius:12px;">
                <div style="text-align:center;">
                    <h3>函数机器 f</h3>
                    <div id="machine-f" style="width:120px; height:120px; background:#3b82f6; color:white; display:flex; align-items:center; justify-content:center; border-radius:12px; font-size:24px; transition:all 0.5s;">
                        $f(x)$
                    </div>
                </div>
                <div style="font-size:32px; color:#64748b;">$\\leftrightarrow$</div>
                <div style="text-align:center;">
                    <h3>反函数机器 $f^{-1}$</h3>
                    <div id="machine-inv" style="width:120px; height:120px; background:#f97316; color:white; display:flex; align-items:center; justify-content:center; border-radius:12px; font-size:24px; transition:all 0.5s; opacity:0.5;">
                        $f^{-1}(y)$
                    </div>
                </div>
            </div>
            
            <div style="margin-top:20px; text-align:center;">
                <label>输入 x = <input type="number" id="input-x" value="2" style="width:60px; padding:5px;"></label>
                <button id="btn-calc" class="btn-primary" style="margin-left:10px;">计算 f(x)=2x+1</button>
                <button id="btn-invert" class="btn-secondary" style="margin-left:10px;" disabled>反转求 f⁻¹</button>
            </div>
            
            <div id="concept-log" style="margin-top:20px; padding:15px; background:#f8fafc; border-radius:8px; min-height:100px;">
                等待输入...
            </div>
        </div>
    `;

    const inputX = container.querySelector('#input-x');
    const btnCalc = container.querySelector('#btn-calc');
    const btnInvert = container.querySelector('#btn-invert');
    const log = container.querySelector('#concept-log');
    const machineF = container.querySelector('#machine-f');
    const machineInv = container.querySelector('#machine-inv');

    let lastY = null;
    let lastX = null;

    btnCalc.onclick = () => {
        const x = parseFloat(inputX.value);
        lastX = x;
        lastY = 2 * x + 1;
        log.innerHTML = `1. 输入 $x=${x}$ <br>2. 经过 $f(x)=2x+1$ <br>3. 输出 $y=${lastY}$`;
        machineF.style.transform = "scale(1.1)";
        setTimeout(() => machineF.style.transform = "scale(1)", 200);
        btnInvert.disabled = false;
        machineInv.style.opacity = "0.5";
        if (window.MathJax) MathJax.typesetPromise();
    };

    btnInvert.onclick = () => {
        log.innerHTML += `<br><hr><br>4. 反转！将 $y=${lastY}$ 输入反函数机器 <br>5. 经过 $f^{-1}(y)=(y-1)/2$ <br>6. 还原 $x=${lastX}$`;
        machineInv.style.opacity = "1";
        machineInv.style.transform = "scale(1.1)";
        setTimeout(() => machineInv.style.transform = "scale(1)", 200);
        if (window.MathJax) MathJax.typesetPromise();
    };

    if (window.MathJax) MathJax.typesetPromise();
}

// Module 2: Explanation
function renderInverseExplanation(container) {
    container.innerHTML = `
        <div style="padding:20px;">
            <div class="headline-section">
                <h1>反函数存在的条件</h1>
                <p>一一对应性：水平线测试。若存在水平线与图像交点 > 1，则无反函数。</p>
            </div>
            <div class="control-panel">
                <label><input type="radio" name="func-choice" value="linear" checked> 一次函数 $y=2x+1$ (有反函数)</label>
                <label style="margin-left:15px;"><input type="radio" name="func-choice" value="quadratic"> 二次函数 $y=x^2$ (无反函数)</label>
                <label style="margin-left:15px;"><input type="radio" name="func-choice" value="cubic"> 三次函数 $y=x^3$ (有反函数)</label>
            </div>
            <div id="expl-plot" style="height:400px; margin-top:10px;"></div>
            <div id="expl-status" style="text-align:center; font-weight:bold; margin-top:10px;"></div>
        </div>
    `;

    const radios = container.querySelectorAll('input[name="func-choice"]');

    function update() {
        const choice = Array.from(radios).find(r => r.checked).value;
        const x = [];
        const y = [];
        let title = "";
        let hasInverse = true;

        for (let i = -3; i <= 3; i += 0.1) {
            x.push(i);
            if (choice === 'linear') y.push(2 * i + 1);
            else if (choice === 'quadratic') y.push(i * i);
            else y.push(i * i * i);
        }

        if (choice === 'quadratic') {
            title = "y=x² (非一一对应)";
            hasInverse = false;
        } else {
            title = choice === 'linear' ? "y=2x+1 (一一对应)" : "y=x³ (一一对应)";
        }

        const trace = {
            x, y, type: 'scatter', mode: 'lines',
            line: { color: hasInverse ? '#10b981' : '#ef4444', width: 3 }
        };

        const layout = {
            title: title,
            xaxis: { range: [-3, 3] },
            yaxis: { range: [-5, 10] },
            shapes: [
                {
                    type: 'line',
                    x0: -10, x1: 10,
                    y0: 2, y1: 2,
                    line: { color: 'black', width: 2, dash: 'dash' }
                }
            ]
        };

        container.querySelector('#expl-status').innerHTML = hasInverse
            ? `<span style="color:green">通过水平线测试：对于任意 y，只有唯一 x 对应。存在反函数。</span>`
            : `<span style="color:red">未通过水平线测试：存在 y 对应两个 x (如 y=4 对应 x=±2)。无反函数。</span>`;

        Plotly.newPlot('expl-plot', [trace], layout, { displayModeBar: false });
    }

    radios.forEach(r => r.onchange = update);
    setTimeout(update, 100);
}

// Module 3: Steps
function renderInverseSteps(container) {
    container.innerHTML = `
        <div style="padding:20px;">
            <div class="headline-section">
                <h1>求反函数三步法</h1>
                <p>1. 解方程 $x=f^{-1}(y)$ &nbsp; 2. 交换 $x,y$ &nbsp; 3. 定定义域</p>
            </div>
            <div style="display:flex; gap:20px;">
                <div style="flex:1; background:#f8fafc; padding:20px; border-radius:12px;">
                    <h3>示例：求 $y = 2x + 4$ 的反函数</h3>
                    <div class="step-box" id="step-1" style="opacity:0.3; margin-bottom:10px;">
                        <strong>Step 1: 解方程</strong><br>
                        由 $y = 2x + 4$ 得 $2x = y - 4$<br>
                        $\\Rightarrow x = \\frac{y-4}{2} = \\frac{1}{2}y - 2$
                    </div>
                    <div class="step-box" id="step-2" style="opacity:0.3; margin-bottom:10px;">
                        <strong>Step 2: 交换 x, y</strong><br>
                        $y = \\frac{1}{2}x - 2$
                    </div>
                    <div class="step-box" id="step-3" style="opacity:0.3; margin-bottom:10px;">
                        <strong>Step 3: 定定义域</strong><br>
                        原函数值域为 R $\\to$ 反函数定义域为 R
                    </div>
                    <button id="btn-next-step" class="btn-primary" style="margin-top:10px;">下一步</button>
                    <button id="btn-reset-step" class="btn-secondary" style="margin-top:10px; display:none;">重置</button>
                </div>
                <div style="flex:1;">
                    <div id="step-plot" style="height:400px;"></div>
                </div>
            </div>
        </div>
    `;

    let currentStep = 0;
    const btnNext = container.querySelector('#btn-next-step');
    const btnReset = container.querySelector('#btn-reset-step');

    function updatePlot() {
        const x = [-5, 5];
        const yOrig = x.map(v => 2 * v + 4);
        const yInv = x.map(v => 0.5 * v - 2);
        const yx = x;

        const traces = [
            { x, y: yOrig, name: '原函数 y=2x+4', line: { color: '#3b82f6' } }
        ];

        if (currentStep >= 2) {
            traces.push({ x, y: yInv, name: '反函数 y=0.5x-2', line: { color: '#f97316' } });
            traces.push({ x, y: yx, name: 'y=x', line: { dash: 'dot', color: 'gray' } });
        }

        Plotly.newPlot('step-plot', traces, { title: '几何演示' }, { displayModeBar: false });
    }

    btnNext.onclick = () => {
        currentStep++;
        if (currentStep >= 1) container.querySelector('#step-1').style.opacity = 1;
        if (currentStep >= 2) container.querySelector('#step-2').style.opacity = 1;
        if (currentStep >= 3) {
            container.querySelector('#step-3').style.opacity = 1;
            btnNext.style.display = 'none';
            btnReset.style.display = 'inline-block';
        }
        updatePlot();
        if (window.MathJax) MathJax.typesetPromise();
    };

    btnReset.onclick = () => {
        currentStep = 0;
        [1, 2, 3].forEach(i => container.querySelector(`#step-${i}`).style.opacity = 0.3);
        btnNext.style.display = 'inline-block';
        btnReset.style.display = 'none';
        updatePlot();
    };

    updatePlot();
    if (window.MathJax) MathJax.typesetPromise();
}

// Module 4: Symmetry
function renderInverseSymmetry(container) {
    container.innerHTML = `
        <div style="padding:20px;">
            <div class="headline-section">
                <h1>图像对称性</h1>
                <p>原函数与反函数图像关于直线 $y=x$ 对称。拖动蓝点观察红点运动。</p>
            </div>
            <div class="control-panel">
                 <label>选择函数: 
                    <select id="sym-func-sel">
                        <option value="exp">y = 2^x</option>
                        <option value="log">y = log₂(x)</option>
                        <option value="square">y = x² (x≥0)</option>
                    </select>
                 </label>
            </div>
            <div id="sym-plot" style="height:500px;"></div>
        </div>
    `;

    const sel = container.querySelector('#sym-func-sel');
    let pointX = 1;

    function update() {
        const type = sel.value;
        const xRange = [];
        const yOrig = [];

        let func;

        if (type === 'exp') {
            func = x => Math.pow(2, x);
            for (let i = -3; i <= 3; i += 0.1) {
                xRange.push(i);
                yOrig.push(func(i));
            }
        } else if (type === 'log') {
            func = x => Math.log2(x);
            for (let i = 0.1; i <= 4; i += 0.1) {
                xRange.push(i);
                yOrig.push(func(i));
            }
        } else { // square
            func = x => x * x;
            for (let i = 0; i <= 3; i += 0.1) {
                xRange.push(i);
                yOrig.push(func(i));
            }
        }

        const traces = [
            { x: xRange, y: yOrig, name: '原函数', line: { color: '#3b82f6' } },
            { x: yOrig, y: xRange, name: '反函数', line: { color: '#f97316' } },
            { x: [-5, 5], y: [-5, 5], name: 'y=x', line: { dash: 'dot', color: 'gray' } }
        ];

        const py = func(pointX);
        traces.push({
            x: [pointX], y: [py],
            mode: 'markers', marker: { size: 10, color: '#3b82f6' },
            name: `P(${pointX.toFixed(2)}, ${py.toFixed(2)})`
        });

        traces.push({
            x: [py], y: [pointX],
            mode: 'markers', marker: { size: 10, color: '#f97316' },
            name: `P'(${py.toFixed(2)}, ${pointX.toFixed(2)})`
        });

        traces.push({
            x: [pointX, py], y: [py, pointX],
            mode: 'lines', line: { dash: 'dot', color: 'black', width: 1 },
            showlegend: false
        });

        const layout = {
            hovermode: 'closest',
            xaxis: { range: [-4, 6], scaleanchor: "y", scaleratio: 1 },
            yaxis: { range: [-4, 6] },
            title: '关于 y=x 对称'
        };

        Plotly.newPlot('sym-plot', traces, layout, { displayModeBar: false });
    }

    const sliderDiv = document.createElement('div');
    sliderDiv.innerHTML = `<label>拖动点 P 的 x 坐标: <input type="range" min="-2" max="2" step="0.1" value="1" style="width:200px;"></label>`;
    container.querySelector('.control-panel').appendChild(sliderDiv);
    sliderDiv.querySelector('input').oninput = (e) => {
        pointX = parseFloat(e.target.value);
        update();
    };

    sel.onchange = update;
    update();
}

// Module 5: Properties
function renderInverseProperties(container) {
    container.innerHTML = `
        <div style="padding:20px;">
            <div class="headline-section">
                <h1>性质关系</h1>
                <p>1. 单调性一致 (同增同减) &nbsp; 2. 奇偶性一致 (奇函数反函数仍为奇)</p>
            </div>
            <div class="control-panel">
                <button class="btn-secondary" id="prop-inc">演示增函数 ($y=x^3$)</button>
                <button class="btn-secondary" id="prop-dec">演示减函数 ($y=-x^3$)</button>
                <button class="btn-secondary" id="prop-odd">演示奇函数 ($y=1/x$)</button>
            </div>
            <div id="prop-plot" style="height:400px; margin-top:10px;"></div>
            <div id="prop-info" style="margin-top:10px; font-weight:bold;"></div>
        </div>
    `;

    function draw(type) {
        let func, invFunc, name, info;
        const x = [];

        if (type === 'inc') {
            func = v => Math.pow(v, 3);
            invFunc = v => Math.cbrt(v);
            name = "y=x³";
            info = "原函数单调递增，反函数 $y=x^{1/3}$ 也单调递增。";
            for (let i = -2; i <= 2; i += 0.1) x.push(i);
        } else if (type === 'dec') {
            func = v => -Math.pow(v, 3);
            invFunc = v => Math.cbrt(-v);
            name = "y=-x³";
            info = "原函数单调递减，反函数 $y=(-x)^{1/3}$ 也单调递减。";
            for (let i = -2; i <= 2; i += 0.1) x.push(i);
        } else { // odd
            func = v => 1 / v;
            invFunc = v => 1 / v;
            name = "y=1/x";
            info = "原函数是奇函数，反函数 $y=1/x$ 也是奇函数 (且与其本身重合)。";
            for (let i = -4; i <= 4; i += 0.1) if (Math.abs(i) > 0.1) x.push(i);
        }

        const y = x.map(func);
        const yInv = x.map(invFunc);

        const traces = [
            { x, y, name: '原函数 ' + name, line: { color: '#3b82f6' } },
            { x, y: yInv, name: '反函数', line: { color: '#f97316' } },
            { x: [-5, 5], y: [-5, 5], name: 'y=x', line: { dash: 'dot', color: 'gray' } }
        ];

        Plotly.newPlot('prop-plot', traces, { xaxis: { range: [-4, 4] }, yaxis: { range: [-4, 4] } }, { displayModeBar: false });
        container.querySelector('#prop-info').innerHTML = info;
        if (window.MathJax) MathJax.typesetPromise();
    }

    container.querySelector('#prop-inc').onclick = () => draw('inc');
    container.querySelector('#prop-dec').onclick = () => draw('dec');
    container.querySelector('#prop-odd').onclick = () => draw('odd');

    draw('inc');
}

// --- Exponential Function Lab ---

function initFunctionExponentialLab(container) {
    container.innerHTML = `
        <div class="ineq-lab-container" style="flex-direction:column;">
            <div class="tab-bar">
                <div class="tab-btn active" data-tab="concept">1. 定义形式与结构</div>
                <div class="tab-btn" data-tab="graph">2. 图像与性质</div>
                <div class="tab-btn" data-tab="eqineq">3. 方程与不等式</div>
            </div>
            <div id="exponential-viewport" style="flex:1; overflow-y:auto;"></div>
        </div>
    `;

    const viewport = container.querySelector('#exponential-viewport');
    const tabs = container.querySelectorAll('.tab-btn');

    tabs.forEach(tab => {
        tab.onclick = () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            renderExponentialTab(viewport, tab.dataset.tab);
        };
    });

    renderExponentialTab(viewport, 'concept');
}

function renderExponentialTab(container, tab) {
    container.innerHTML = '';
    if (tab === 'concept') renderExponentialConcept(container);
    else if (tab === 'graph') renderExponentialGraph(container);
    else if (tab === 'eqineq') renderExponentialEqIneq(container);
}

function renderExponentialConcept(container) {
    container.innerHTML = `
        <div style="padding:20px;">
            <div class="headline-section">
                <h1>指数函数的定义形式</h1>
                <p>探索基本式、平移式和复合式的图像结构。</p>
            </div>
            
            <div class="nav-pills" id="exp-concept-nav" style="margin-bottom:20px;">
                <div class="nav-item active" data-mode="basic">基本式 $y=a^x$</div>
                <div class="nav-item" data-mode="translated">平移式 $y=a^{x-h}+k$</div>
                <div class="nav-item" data-mode="composite">复合式 $y=c\\cdot a^{bx}$</div>
            </div>

            <div style="background:#f8fafc; padding:20px; border-radius:12px;">
                <div class="control-panel" style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:10px; margin-bottom:15px;">
                    <label>底数 a = <span id="val-a">2.0</span>
                        <input type="range" id="rng-a" min="0.1" max="5" step="0.1" value="2.0">
                    </label>
                    <div id="ctrl-h" style="display:none;">
                        <label>平移 h = <span id="val-h">0</span>
                            <input type="range" id="rng-h" min="-5" max="5" step="0.5" value="0">
                        </label>
                    </div>
                    <div id="ctrl-k" style="display:none;">
                        <label>平移 k = <span id="val-k">0</span>
                            <input type="range" id="rng-k" min="-5" max="5" step="0.5" value="0">
                        </label>
                    </div>
                    <div id="ctrl-b" style="display:none;">
                        <label>系数 b = <span id="val-b">1</span>
                            <input type="range" id="rng-b" min="-3" max="3" step="0.5" value="1">
                        </label>
                    </div>
                    <div id="ctrl-c" style="display:none;">
                        <label>系数 c = <span id="val-c">1</span>
                            <input type="range" id="rng-c" min="-3" max="3" step="0.5" value="1">
                        </label>
                    </div>
                </div>

                <div class="formula-box" id="current-formula">$$ f(x) = 2^x $$</div>
                <div id="exp-concept-plot" style="height:400px;"></div>
                <div id="exp-concept-info" style="margin-top:10px; font-size:14px; color:#475569;"></div>
            </div>
        </div>
    `;

    const rngA = container.querySelector('#rng-a');
    const rngH = container.querySelector('#rng-h');
    const rngK = container.querySelector('#rng-k');
    const rngB = container.querySelector('#rng-b');
    const rngC = container.querySelector('#rng-c');

    const navItems = container.querySelectorAll('#exp-concept-nav .nav-item');
    let mode = 'basic';

    navItems.forEach(item => {
        item.onclick = () => {
            navItems.forEach(n => n.classList.remove('active'));
            item.classList.add('active');
            mode = item.dataset.mode;
            updateUI();
            update();
        };
    });

    function updateUI() {
        const show = (el, visible) => el.style.display = visible ? 'block' : 'none';
        show(container.querySelector('#ctrl-h'), mode === 'translated');
        show(container.querySelector('#ctrl-k'), mode === 'translated');
        show(container.querySelector('#ctrl-b'), mode === 'composite');
        show(container.querySelector('#ctrl-c'), mode === 'composite');
    }

    function update() {
        let a = parseFloat(rngA.value);
        if (Math.abs(a - 1) < 0.1) a = (a < 1) ? 0.9 : 1.1; // Avoid a=1
        if (a <= 0) a = 0.1;

        const h = parseFloat(rngH.value);
        const k = parseFloat(rngK.value);
        const b = parseFloat(rngB.value);
        const c = parseFloat(rngC.value);

        container.querySelector('#val-a').innerText = a.toFixed(1);
        container.querySelector('#val-h').innerText = h.toFixed(1);
        container.querySelector('#val-k').innerText = k.toFixed(1);
        container.querySelector('#val-b').innerText = b.toFixed(1);
        container.querySelector('#val-c').innerText = c.toFixed(1);

        let func, latex, fixedPoint, asymptoteY;

        if (mode === 'basic') {
            func = x => Math.pow(a, x);
            latex = `$$ f(x) = ${a.toFixed(1)}^x $$`;
            fixedPoint = { x: 0, y: 1 };
            asymptoteY = 0;
        } else if (mode === 'translated') {
            func = x => Math.pow(a, x - h) + k;
            latex = `$$ f(x) = ${a.toFixed(1)}^{x - (${h.toFixed(1)})} + ${k.toFixed(1)} $$`;
            fixedPoint = { x: h, y: 1 + k };
            asymptoteY = k;
        } else { // composite
            func = x => c * Math.pow(a, b * x);
            latex = `$$ f(x) = ${c.toFixed(1)} \\cdot ${a.toFixed(1)}^{${b.toFixed(1)}x} $$`;
            fixedPoint = { x: 0, y: c };
            asymptoteY = 0; // Assuming k=0 for composite based on request
        }

        container.querySelector('#current-formula').innerHTML = latex;
        if (window.MathJax) MathJax.typesetPromise();

        const x = [], y = [];
        for (let i = -10; i <= 10; i += 0.1) {
            x.push(i);
            y.push(func(i));
        }

        const traces = [
            { x, y, type: 'scatter', mode: 'lines', line: { color: '#3b82f6', width: 3 }, name: 'f(x)' },
            {
                x: [fixedPoint.x], y: [fixedPoint.y],
                mode: 'markers+text',
                marker: { color: '#f97316', size: 10 },
                text: [`定点 (${fixedPoint.x.toFixed(1)}, ${fixedPoint.y.toFixed(1)})`],
                textposition: 'top left',
                name: '定点'
            }
        ];

        const layout = {
            margin: { t: 20, b: 40, l: 40, r: 20 },
            xaxis: { range: [-10, 10], zeroline: true },
            yaxis: { range: [-10, 10], zeroline: true },
            shapes: [
                { // Asymptote
                    type: 'line',
                    x0: -10, y0: asymptoteY,
                    x1: 10, y1: asymptoteY,
                    line: { color: 'red', width: 2, dash: 'dash' }
                }
            ],
            annotations: [
                {
                    x: 8, y: asymptoteY,
                    text: `渐近线 y=${asymptoteY}`,
                    showarrow: false,
                    yanchor: 'bottom',
                    font: { color: 'red' }
                }
            ]
        };

        Plotly.newPlot('exp-concept-plot', traces, layout, { displayModeBar: false });

        // Info
        let info = "";
        if (mode === 'basic') {
            info = (a > 1) ? "当 a > 1 时，函数在 R 上单调递增。" : "当 0 < a < 1 时，函数在 R 上单调递减。";
        }
        container.querySelector('#exp-concept-info').innerText = info;
    }

    rngA.oninput = update;
    rngH.oninput = update;
    rngK.oninput = update;
    rngB.oninput = update;
    rngC.oninput = update;

    updateUI();
    setTimeout(update, 100);
}

function renderExponentialGraph(container) {
    container.innerHTML = `
        <div style="padding:20px;">
            <div class="headline-section">
                <h1>图像与性质</h1>
                <p>研究底数 a 对单调性、渐近线和增长速度的影响。</p>
            </div>

            <div style="background:#f8fafc; padding:20px; border-radius:12px;">
                <div class="control-panel" style="margin-bottom:15px;">
                    <label>底数 a = <span id="graph-val-a">2.0</span>
                        <input type="range" id="graph-rng-a" min="0.1" max="5" step="0.1" value="2.0">
                    </label>
                    <div style="margin-top:10px; display:flex; gap:20px;">
                        <label>
                            <input type="checkbox" id="chk-compare"> 多曲线对比 (0.2, 0.5, 2, 5)
                        </label>
                        <label>
                            <input type="checkbox" id="chk-analysis"> 显示 x=±1 特征
                        </label>
                    </div>
                </div>

                <div id="exp-graph-plot" style="height:450px;"></div>
                
                <div style="display:flex; gap:20px; margin-top:15px;">
                    <div class="kpi-card" style="flex:1;">
                        <span class="kpi-title">单调性</span>
                        <div id="prop-monotonicity" style="font-weight:bold;">增函数</div>
                    </div>
                    <div class="kpi-card" style="flex:1;">
                        <span class="kpi-title">渐近线</span>
                        <div style="color:red;">y = 0</div>
                    </div>
                    <div class="kpi-card" style="flex:1;">
                        <span class="kpi-title">定点</span>
                        <div style="color:#f97316;">(0, 1)</div>
                    </div>
                </div>
            </div>
        </div>
    `;

    const rngA = container.querySelector('#graph-rng-a');
    const chkCompare = container.querySelector('#chk-compare');
    const chkAnalysis = container.querySelector('#chk-analysis');

    function update() {
        let a = parseFloat(rngA.value);
        if (Math.abs(a - 1) < 0.1) a = (a < 1) ? 0.9 : 1.1;
        container.querySelector('#graph-val-a').innerText = a.toFixed(1);

        const x = [];
        for (let i = -5; i <= 5; i += 0.1) x.push(i);

        const traces = [];
        const layout = {
            margin: { t: 20, b: 40, l: 40, r: 20 },
            xaxis: { range: [-5, 5], zeroline: true },
            yaxis: { range: [-1, 10], zeroline: true },
            shapes: [],
            annotations: []
        };

        // Main curve
        const y = x.map(val => Math.pow(a, val));
        traces.push({ x, y, type: 'scatter', mode: 'lines', line: { color: '#3b82f6', width: 4 }, name: 'y=' + a.toFixed(1) + '^x' });

        // Monotonicity coloring
        if (a > 1) {
            layout.shapes.push({ type: 'rect', x0: -10, x1: 10, y0: -10, y1: 20, fillcolor: 'rgba(0,255,0,0.1)', layer: 'below', line: { width: 0 } });
            container.querySelector('#prop-monotonicity').innerHTML = '<span style="color:green">单调递增 (Increasing)</span>';
        } else {
            layout.shapes.push({ type: 'rect', x0: -10, x1: 10, y0: -10, y1: 20, fillcolor: 'rgba(255,0,0,0.1)', layer: 'below', line: { width: 0 } });
            container.querySelector('#prop-monotonicity').innerHTML = '<span style="color:red">单调递减 (Decreasing)</span>';
        }

        // Asymptote
        layout.shapes.push({ type: 'line', x0: -10, y0: 0, x1: 10, y1: 0, line: { color: 'red', width: 2, dash: 'dash' } });

        // Fixed point
        traces.push({ x: [0], y: [1], mode: 'markers', marker: { color: '#f97316', size: 10 }, name: '定点(0,1)' });

        // Comparison mode
        if (chkCompare.checked) {
            const y2 = x.map(val => Math.pow(2, val));
            const yHalf = x.map(val => Math.pow(0.5, val));
            const y5 = x.map(val => Math.pow(5, val));
            const y02 = x.map(val => Math.pow(0.2, val));

            traces.push({ x, y: y2, type: 'scatter', mode: 'lines', line: { color: '#a855f7', dash: 'dot', width: 1 }, name: 'y=2^x' });
            traces.push({ x, y: yHalf, type: 'scatter', mode: 'lines', line: { color: '#10b981', dash: 'dot', width: 1 }, name: 'y=0.5^x' });
            traces.push({ x, y: y5, type: 'scatter', mode: 'lines', line: { color: '#ec4899', dash: 'dot', width: 1 }, name: 'y=5^x' });
            traces.push({ x, y: y02, type: 'scatter', mode: 'lines', line: { color: '#06b6d4', dash: 'dot', width: 1 }, name: 'y=0.2^x' });
        }

        // Analysis mode (x=1, x=-1)
        if (chkAnalysis.checked) {
            const y1 = Math.pow(a, 1);
            const y_1 = Math.pow(a, -1);

            // Vertical lines to axis
            layout.shapes.push({ type: 'line', x0: 1, y0: 0, x1: 1, y1: y1, line: { color: 'black', width: 1, dash: 'dot' } });
            layout.shapes.push({ type: 'line', x0: -1, y0: 0, x1: -1, y1: y_1, line: { color: 'black', width: 1, dash: 'dot' } });

            // Points
            traces.push({
                x: [1, -1], y: [y1, y_1],
                mode: 'markers+text',
                marker: { color: 'black', size: 6 },
                text: [`(1, ${a.toFixed(1)})`, `(-1, ${y_1.toFixed(2)})`],
                textposition: 'top center',
                name: 'x=±1'
            });
        }

        Plotly.newPlot('exp-graph-plot', traces, layout, { displayModeBar: false });
    }

    rngA.oninput = update;
    chkCompare.onchange = update;
    chkAnalysis.onchange = update;
    setTimeout(update, 100);
}

function renderExponentialEqIneq(container) {
    container.innerHTML = `
        <div style="padding:20px;">
            <div class="headline-section">
                <h1>方程与不等式</h1>
                <p>图解 $a^x = N$ 与 $a^x > N$。</p>
            </div>
            
            <div class="nav-pills" id="eq-nav" style="margin-bottom:20px;">
                <div class="nav-item active" data-type="eq">方程 $a^x = N$</div>
                <div class="nav-item" data-type="ineq_gt">不等式 $a^x > N$</div>
                <div class="nav-item" data-type="ineq_lt">不等式 $a^x < N$</div>
            </div>

            <div style="background:#f8fafc; padding:20px; border-radius:12px;">
                <div class="control-panel" style="display:flex; gap:20px; margin-bottom:15px;">
                    <label>底数 a = <span id="eq-val-a">2.0</span>
                        <input type="range" id="eq-rng-a" min="0.1" max="5" step="0.1" value="2.0">
                    </label>
                    <label>常数 N = <span id="eq-val-n">4.0</span>
                        <input type="range" id="eq-rng-n" min="-2" max="10" step="0.5" value="4.0">
                    </label>
                </div>
                
                <div id="eq-result" style="text-align:center; font-weight:bold; margin-bottom:10px; font-size:18px;"></div>
                <div id="exp-eq-plot" style="height:400px;"></div>
            </div>
        </div>
    `;

    const rngA = container.querySelector('#eq-rng-a');
    const rngN = container.querySelector('#eq-rng-n');
    const navItems = container.querySelectorAll('#eq-nav .nav-item');
    let type = 'eq';

    navItems.forEach(item => {
        item.onclick = () => {
            navItems.forEach(n => n.classList.remove('active'));
            item.classList.add('active');
            type = item.dataset.type;
            update();
        };
    });

    function update() {
        let a = parseFloat(rngA.value);
        if (Math.abs(a - 1) < 0.1) a = (a < 1) ? 0.9 : 1.1;
        const n = parseFloat(rngN.value);

        container.querySelector('#eq-val-a').innerText = a.toFixed(1);
        container.querySelector('#eq-val-n').innerText = n.toFixed(1);

        const x = [];
        for (let i = -5; i <= 5; i += 0.1) x.push(i);
        const y = x.map(val => Math.pow(a, val));

        const traces = [
            { x, y, type: 'scatter', mode: 'lines', line: { color: '#3b82f6', width: 3 }, name: 'y=' + a.toFixed(1) + '^x' },
            { x: [-5, 5], y: [n, n], type: 'scatter', mode: 'lines', line: { color: '#64748b', dash: 'dash' }, name: 'y=' + n }
        ];

        let solutionX = null;
        if (n > 0) {
            solutionX = Math.log(n) / Math.log(a);
            traces.push({
                x: [solutionX], y: [n],
                mode: 'markers',
                marker: { size: 10, color: '#ef4444' },
                name: `交点 (${solutionX.toFixed(2)}, ${n})`
            });
        }

        const layout = {
            margin: { t: 20, b: 30, l: 30, r: 20 },
            xaxis: { range: [-5, 5] },
            yaxis: { range: [-2, 12] },
            shapes: []
        };

        const resultEl = container.querySelector('#eq-result');

        if (type === 'eq') {
            if (n <= 0) {
                resultEl.innerHTML = `方程 $${a.toFixed(1)}^x = ${n}$ <span style="color:red">无实数解</span>`;
            } else {
                resultEl.innerHTML = `解得 $x = \\log_{${a.toFixed(1)}} ${n} \\approx ${solutionX.toFixed(4)}$`;
                layout.annotations = [{
                    x: solutionX, y: n,
                    text: `x ≈ ${solutionX.toFixed(2)}`,
                    ax: 0, ay: -30
                }];
            }
        } else if (type === 'ineq_gt') { // a^x > N
            if (n <= 0) {
                resultEl.innerHTML = `不等式 $${a.toFixed(1)}^x > ${n}$ 解集为 <span style="color:green">R (全体实数)</span>`;
                layout.shapes.push({ type: 'rect', x0: -10, x1: 10, y0: -10, y1: 20, fillcolor: 'rgba(0,255,0,0.1)', layer: 'below', line: { width: 0 } });
            } else {
                // if a > 1, x > log_a N
                // if 0 < a < 1, x < log_a N
                const isIncreasing = a > 1;
                const sign = isIncreasing ? '>' : '<';
                resultEl.innerHTML = `解集: $x ${sign} ${solutionX.toFixed(4)}$`;

                const xStart = isIncreasing ? solutionX : -10;
                const xEnd = isIncreasing ? 10 : solutionX;
                layout.shapes.push({ type: 'rect', x0: xStart, x1: xEnd, y0: -10, y1: 20, fillcolor: 'rgba(0,255,0,0.1)', layer: 'below', line: { width: 0 } });
            }
        } else if (type === 'ineq_lt') { // a^x < N
            if (n <= 0) {
                resultEl.innerHTML = `不等式 $${a.toFixed(1)}^x < ${n}$ <span style="color:red">无解 (空集)</span>`;
            } else {
                const isIncreasing = a > 1;
                const sign = isIncreasing ? '<' : '>';
                resultEl.innerHTML = `解集: $x ${sign} ${solutionX.toFixed(4)}$`;

                const xStart = isIncreasing ? -10 : solutionX;
                const xEnd = isIncreasing ? solutionX : 10;
                layout.shapes.push({ type: 'rect', x0: xStart, x1: xEnd, y0: -10, y1: 20, fillcolor: 'rgba(255,0,0,0.1)', layer: 'below', line: { width: 0 } });
            }
        }

        if (window.MathJax) MathJax.typesetPromise();
        Plotly.newPlot('exp-eq-plot', traces, layout, { displayModeBar: false });
    }

    rngA.oninput = update;
    rngN.oninput = update;
    update();
}


// Power Function Lab
function initFunctionPowerLab(container) {
    container.innerHTML = `
        <div class="lab-header">
            <div class="lab-title">幂函数实验室</div>
            <div class="lab-tabs">
                <button class="lab-tab active" data-mod="concept">概念对比</button>
                <button class="lab-tab" data-mod="definition">定义结构</button>
                <button class="lab-tab" data-mod="graph">图像探究</button>
                <button class="lab-tab" data-mod="properties">性质分析</button>
            </div>
        </div>
        <div class="lab-content" id="power-lab-content"></div>
    `;

    const tabs = container.querySelectorAll('.lab-tab');
    const content = container.querySelector('#power-lab-content');

    function switchTab(mod) {
        tabs.forEach(t => t.classList.toggle('active', t.dataset.mod === mod));
        content.innerHTML = '';

        switch (mod) {
            case 'concept': renderPowerConcept(content); break;
            case 'definition': renderPowerDefinition(content); break;
            case 'graph': renderPowerGraph(content); break;
            case 'properties': renderPowerProperties(content); break;
        }
    }

    tabs.forEach(t => t.addEventListener('click', () => switchTab(t.dataset.mod)));
    switchTab('concept');
}

function renderPowerConcept(container) {
    container.innerHTML = `
        <div style="display: flex; height: 100%; gap: 20px; padding: 20px;">
            <div style="flex: 1; border: 2px solid #3b82f6; border-radius: 8px; padding: 20px; display: flex; flex-direction: column; align-items: center; justify-content: center; background: #eff6ff;">
                <h3 style="color: #1e3a8a; margin-bottom: 20px;">幂函数</h3>
                <div style="font-size: 2.5em; margin-bottom: 30px;">
                    y = <span style="color: #dc2626; font-weight: bold; font-size: 1.2em;">x</span><sup>a</sup>
                </div>
                <div style="text-align: center; color: #1e40af;">
                    <p><strong>底数</strong> 是变量 <span style="color: #dc2626; font-weight: bold;">x</span></p>
                    <p>指数 a 是常数</p>
                </div>
                <div style="margin-top: 20px; padding: 10px; background: white; border-radius: 4px; border: 1px dashed #3b82f6;">
                    <p>示例: y = x², y = x³</p>
                </div>
            </div>
            
            <div style="flex: 1; border: 2px solid #9ca3af; border-radius: 8px; padding: 20px; display: flex; flex-direction: column; align-items: center; justify-content: center; background: #f3f4f6; opacity: 0.8;">
                <h3 style="color: #4b5563; margin-bottom: 20px;">指数函数 (非幂函数)</h3>
                <div style="font-size: 2.5em; margin-bottom: 30px; color: #6b7280;">
                    y = a<sup style="color: #dc2626; font-weight: bold; font-size: 1.2em;">x</sup>
                </div>
                <div style="text-align: center; color: #4b5563;">
                    <p><strong>指数</strong> 是变量 <span style="color: #dc2626; font-weight: bold;">x</span></p>
                    <p>底数 a 是常数</p>
                </div>
                <div style="margin-top: 20px; padding: 10px; background: white; border-radius: 4px; border: 1px dashed #9ca3af;">
                    <p>示例: y = 2ˣ, y = eˣ</p>
                </div>
            </div>
        </div>
        <div style="text-align: center; margin-top: 10px; font-size: 1.1em; color: #374151;">
            <p>💡 核心特征：幂函数的<strong>底数</strong>必须是变量 <strong>x</strong></p>
        </div>
    `;
}

function renderPowerDefinition(container) {
    container.innerHTML = `
        <div class="lab-row" style="height: 100%; align-items: stretch; gap: 20px;">
            <div class="lab-column" style="width: 320px; flex-shrink: 0; display: flex; flex-direction: column; gap: 20px;">
                <div class="controls-section" style="background: white; padding: 20px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                    <h4 style="margin-top: 0; margin-bottom: 15px; color: #1f2937; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px;">🧪 实验控制台</h4>
                    <div class="control-group" style="margin-bottom: 20px;">
                        <label style="display: block; margin-bottom: 8px; font-weight: 500;">函数形式:</label>
                        <select id="def-type" class="lab-select" style="width: 100%; padding: 8px; border-radius: 6px; border: 1px solid #d1d5db;">
                            <option value="standard">标准幂函数 (y = xᵃ)</option>
                            <option value="coeff">系数不为1 (y = 2xᵃ)</option>
                            <option value="shift">底数变化 (y = (x+1)ᵃ)</option>
                            <option value="term">多项式 (y = xᵃ + 1)</option>
                        </select>
                    </div>
                    <div class="control-group" id="exp-control">
                        <label style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                            <span>指数 a</span>
                            <span id="val-def-a" style="font-family: monospace; background: #f3f4f6; padding: 0 6px; border-radius: 4px;">2</span>
                        </label>
                        <input type="range" id="rng-def-a" min="-3" max="5" step="1" value="2" style="width: 100%;">
                    </div>
                </div>
                
                <div class="info-card" style="flex: 1; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                    <h4 style="margin-top: 0; margin-bottom: 15px; color: #1f2937; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px;">📋 判定结果</h4>
                    <div id="def-status" style="padding: 15px; border-radius: 8px; font-size: 1.1em; font-weight: bold; text-align: center; margin-bottom: 15px;">
                        是幂函数
                    </div>
                    <div id="def-explanation" style="color: #4b5563; line-height: 1.6; font-size: 0.95em;">
                        系数为 1，底数为 x，仅含一项
                    </div>
                </div>
            </div>
            
            <div class="lab-column" style="flex: 1; background: white; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); display: flex; align-items: center; justify-content: center; position: relative; overflow: hidden;">
                <div style="position: absolute; top: 15px; left: 15px; font-size: 0.9em; color: #9ca3af;">可视化区域</div>
                <div id="def-display" style="font-size: 4em; font-family: 'Times New Roman', serif; transition: all 0.3s ease;">
                    y = x<sup id="def-exp">2</sup>
                </div>
            </div>
        </div>
    `;

    const select = container.querySelector('#def-type');
    const rngA = container.querySelector('#rng-def-a');
    const valA = container.querySelector('#val-def-a');
    const display = container.querySelector('#def-display');
    const expDisplay = container.querySelector('#def-exp');
    const status = container.querySelector('#def-status');
    const expl = container.querySelector('#def-explanation');

    function update() {
        const type = select.value;
        const a = rngA.value;
        valA.innerText = a;
        expDisplay.innerText = a;

        let html = '';
        let isPower = false;
        let msg = '';

        if (type === 'standard') {
            html = `y = <span style="color: #3b82f6;">1</span> · x<sup>${a}</sup>`;
            isPower = true;
            msg = '符合定义：系数=1，底数=x';
        } else if (type === 'coeff') {
            html = `y = <span style="color: #ef4444;">2</span> · x<sup>${a}</sup>`;
            isPower = false;
            msg = '不符合定义：系数必须为 1';
        } else if (type === 'shift') {
            html = `y = (<span style="color: #ef4444;">x+1</span>)<sup>${a}</sup>`;
            isPower = false;
            msg = '不符合定义：底数只能是变量 x';
        } else if (type === 'term') {
            html = `y = x<sup>${a}</sup> <span style="color: #ef4444;">+ 1</span>`;
            isPower = false;
            msg = '不符合定义：只能包含单项';
        }

        display.innerHTML = html;

        if (isPower) {
            status.innerText = "✅ 是幂函数";
            status.style.backgroundColor = "#d1fae5";
            status.style.color = "#065f46";
            status.style.border = "2px solid #34d399";
        } else {
            status.innerText = "❌ 不是幂函数";
            status.style.backgroundColor = "#fee2e2";
            status.style.color = "#991b1b";
            status.style.border = "2px solid #f87171";
        }
        expl.innerText = msg;
    }

    select.onchange = update;
    rngA.oninput = update;
    update();
}

function renderPowerGraph(container) {
    container.innerHTML = `
        <div class="lab-row" style="height: 100%; align-items: stretch; gap: 20px;">
            <div class="lab-column" style="width: 320px; flex-shrink: 0; display: flex; flex-direction: column; gap: 20px;">
                <div class="controls-section" style="background: white; padding: 20px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                    <h4 style="margin-top: 0; margin-bottom: 15px; color: #1f2937; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px;">🎛️ 参数控制</h4>
                    
                    <div class="control-group" style="margin-bottom: 20px;">
                        <label style="display: block; margin-bottom: 8px; font-weight: 500;">常用指数:</label>
                        <div class="btn-group" style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px;">
                            <button class="preset-btn active" data-val="3">3</button>
                            <button class="preset-btn" data-val="2">2</button>
                            <button class="preset-btn" data-val="1">1</button>
                            <button class="preset-btn" data-val="0.5">1/2</button>
                            <button class="preset-btn" data-val="-1">-1</button>
                        </div>
                    </div>
                    
                    <div class="control-group">
                        <label style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                            <span>自定义 a</span>
                            <span id="val-graph-a" style="font-family: monospace; background: #f3f4f6; padding: 0 6px; border-radius: 4px;">3</span>
                        </label>
                        <input type="range" id="rng-graph-a" min="-3" max="5" step="0.1" value="3" style="width: 100%;">
                    </div>
                </div>
                
                <div class="info-card" style="flex: 1; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); display: flex; flex-direction: column;">
                    <h4 style="margin-top: 0; margin-bottom: 15px; color: #1f2937; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px;">👁️ 现象观察</h4>
                    <div id="graph-desc" style="flex: 1; color: #4b5563; line-height: 1.6; font-size: 0.95em; overflow-y: auto;">
                    </div>
                </div>
            </div>
            
            <div class="lab-column" style="flex: 1; background: white; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); padding: 10px;">
                <div id="power-graph-plot" style="width: 100%; height: 100%;"></div>
            </div>
        </div>
    `;

    const rngA = container.querySelector('#rng-graph-a');
    const valA = container.querySelector('#val-graph-a');
    const presets = container.querySelectorAll('.preset-btn');
    const desc = container.querySelector('#graph-desc');

    function update(manualA) {
        let a = parseFloat(rngA.value);
        if (manualA !== undefined) {
            a = manualA;
            rngA.value = a;
        }
        valA.innerText = a;

        presets.forEach(btn => {
            const v = parseFloat(btn.dataset.val);
            btn.classList.toggle('active', Math.abs(v - a) < 0.01);
        });

        const x = [], y = [];
        const step = 0.05;
        for (let i = 0.01; i <= 4; i += step) {
            x.push(i);
            y.push(Math.pow(i, a));
        }

        const tracePoint = {
            x: [1], y: [1], mode: 'markers+text',
            marker: { color: 'red', size: 10 },
            text: ['(1,1)'], textposition: 'bottom right',
            name: '公共点'
        };

        const traces = [
            { x, y, type: 'scatter', mode: 'lines', name: `y=x^${a}`, line: { width: 3 } },
            tracePoint
        ];

        let title = `y = x^${a}`;
        let description = "";

        if (a > 1) {
            description = "<strong>a > 1</strong>: 在第一象限持续上升，随 x 增大上升速度变快（下凸/加速增长）。越往右越陡。";
        } else if (a > 0 && a < 1) {
            description = "<strong>0 < a < 1</strong>: 在第一象限持续上升，但上升速度变慢（上凸/减速增长）。越往右越平缓。";
        } else if (a < 0) {
            description = "<strong>a < 0</strong>: 在第一象限持续下降，双向逼近坐标轴（渐近线）。";
        } else if (a === 0) {
            description = "<strong>a = 0</strong>: y = 1 (x ≠ 0)。";
        } else if (a === 1) {
            description = "<strong>a = 1</strong>: 直线 y = x。";
        }

        desc.innerHTML = description;

        Plotly.react('power-graph-plot', traces, {
            title: title,
            margin: { t: 30, b: 30, l: 30, r: 20 },
            xaxis: { range: [0, 4], title: 'x' },
            yaxis: { range: [0, 4], title: 'y' },
        }, { displayModeBar: false });
    }

    rngA.oninput = () => update();
    presets.forEach(btn => btn.onclick = () => update(parseFloat(btn.dataset.val)));

    setTimeout(() => update(3), 100);
}

function renderPowerProperties(container) {
    container.innerHTML = `
        <div class="viz-controls">
            <div class="control-group">
                <label>指数 a = <span id="val-prop-a">0.5</span></label>
                <input type="range" id="rng-prop-a" min="-2" max="3" step="0.5" value="0.5">
            </div>
            <div id="prop-info" style="font-size: 0.9em; color: #555; margin-top: 5px;"></div>
        </div>
        <div id="power-prop-plot" class="viz-plot" style="height: 400px;"></div>
        <div id="prop-summary" style="margin-top: 10px; padding: 10px; border: 1px solid #e5e7eb; border-radius: 6px; background: white;">
        </div>
    `;

    const rngA = container.querySelector('#rng-prop-a');
    const valA = container.querySelector('#val-prop-a');
    const info = container.querySelector('#prop-info');
    const summary = container.querySelector('#prop-summary');

    function update() {
        const a = parseFloat(rngA.value);
        valA.innerText = a;

        const x = [], y = [];
        for (let i = 0.01; i <= 4; i += 0.05) {
            x.push(i);
            y.push(Math.pow(i, a));
        }

        const traces = [
            { x, y, type: 'scatter', mode: 'lines', name: `y=x^${a}` }
        ];

        const annotations = [];
        if (a > 0) {
            annotations.push({
                x: 2, y: Math.pow(2, a),
                text: '↗ 增函数',
                showarrow: true, arrowhead: 1, ax: -30, ay: 30
            });
        } else if (a < 0) {
            annotations.push({
                x: 0.5, y: Math.pow(0.5, a),
                text: '↘ 减函数',
                showarrow: true, arrowhead: 1, ax: 30, ay: -30
            });
        }

        const layout = {
            title: `性质分析 (a=${a})`,
            margin: { t: 30, b: 30, l: 30, r: 20 },
            xaxis: { range: [-0.5, 4.5], title: 'x', zeroline: true, zerolinecolor: '#999' },
            yaxis: { range: [-0.5, 4.5], title: 'y', zeroline: true, zerolinecolor: '#999' },
            annotations: annotations,
            shapes: []
        };

        let propText = "";
        if (a > 0) {
            propText = `
                <ul style="list-style: none; padding: 0;">
                    <li><strong>定义域</strong>: (0, +∞) [在第一象限]</li>
                    <li><strong>单调性</strong>: 在 (0, +∞) 上单调递增</li>
                    <li><strong>过定点</strong>: (1, 1)</li>
                </ul>
            `;
        } else if (a < 0) {
            propText = `
                <ul style="list-style: none; padding: 0;">
                    <li><strong>定义域</strong>: (0, +∞)</li>
                    <li><strong>单调性</strong>: 在 (0, +∞) 上单调递减</li>
                    <li><strong>渐近线</strong>: x轴, y轴</li>
                    <li><strong>过定点</strong>: (1, 1)</li>
                </ul>
            `;
            layout.shapes.push(
                { type: 'line', x0: 0, y0: -10, x1: 0, y1: 10, line: { color: 'red', dash: 'dot', width: 2 } },
                { type: 'line', x0: -10, y0: 0, x1: 10, y1: 0, line: { color: 'red', dash: 'dot', width: 2 } }
            );
        } else {
            propText = `
                <ul style="list-style: none; padding: 0;">
                    <li><strong>定义域</strong>: x ≠ 0</li>
                    <li><strong>图像</strong>: 平行于x轴的直线 (去掉x=0)</li>
                </ul>
            `;
        }

        summary.innerHTML = propText;
        Plotly.react('power-prop-plot', traces, layout, { displayModeBar: false });
    }

    rngA.oninput = update;
    setTimeout(update, 100);
}

// --- Function Fractional Lab ---

function initFunctionFractionalLab(container) {
    container.innerHTML = `
        <div class="fractional-lab-container" style="display:flex; flex-direction:column; height:100%;">
            <div class="tab-bar">
                <div class="tab-btn active" data-tab="gen">1. 一般分式函数 (General)</div>
                <div class="tab-btn" data-tab="spec">2. 特殊分式函数 (Special)</div>
            </div>
            <div id="frac-viewport" style="flex:1; overflow-y:auto; position:relative;"></div>
        </div>
    `;

    const tabs = container.querySelectorAll('.tab-btn');
    const viewport = container.querySelector('#frac-viewport');

    function loadTab(tabId) {
        tabs.forEach(t => t.classList.remove('active'));
        container.querySelector(`[data-tab="${tabId}"]`).classList.add('active');
        viewport.innerHTML = '';

        if (tabId === 'gen') renderFractionalGeneral(viewport);
        else if (tabId === 'spec') renderFractionalSpecial(viewport);

        if (window.MathJax) MathJax.typesetPromise();
    }

    tabs.forEach(t => t.onclick = () => loadTab(t.dataset.tab));
    loadTab('gen');
}

function renderFractionalGeneral(container) {
    container.innerHTML = `
        <div style="display:flex; height:100%; gap:20px; padding:20px;">
            <div class="lab-column" style="width:280px; flex-shrink:0;">
                <h3 style="margin-top:0; border-bottom:1px solid #eee; padding-bottom:10px;">一般分式函数</h3>
                <div class="formula-box">
                    $$ y = \\frac{ax+b}{cx+d} $$
                </div>
                
                <div class="controls-section">
                    <label>a = <span id="val-gen-a">1</span> <input type="range" id="rng-gen-a" min="-5" max="5" step="0.5" value="1"></label>
                    <label>b = <span id="val-gen-b">2</span> <input type="range" id="rng-gen-b" min="-5" max="5" step="0.5" value="2"></label>
                    <label>c = <span id="val-gen-c">1</span> <input type="range" id="rng-gen-c" min="-5" max="5" step="0.5" value="1"></label>
                    <label>d = <span id="val-gen-d">-1</span> <input type="range" id="rng-gen-d" min="-5" max="5" step="0.5" value="-1"></label>
                </div>
                
                <div class="info-card" style="margin-top:10px;">
                    <p><strong>渐近线:</strong></p>
                    <ul style="padding-left:20px; margin:5px 0;">
                        <li>垂直: $x = -d/c$ = <span id="gen-vasy">1</span></li>
                        <li>水平: $y = a/c$ = <span id="gen-hasy">1</span></li>
                    </ul>
                    <p><strong>对称中心:</strong> <span id="gen-center">(1, 1)</span></p>
                    <p><strong>定义域:</strong> $x \\neq -d/c$</p>
                    <p><strong>值域:</strong> $y \\neq a/c$</p>
                </div>
            </div>
            
            <div class="lab-column" style="flex:1; display:flex; flex-direction:column;">
                <div id="gen-plot" style="flex:1;"></div>
            </div>
        </div>
    `;

    const rngA = container.querySelector('#rng-gen-a');
    const rngB = container.querySelector('#rng-gen-b');
    const rngC = container.querySelector('#rng-gen-c');
    const rngD = container.querySelector('#rng-gen-d');

    function update() {
        let a = parseFloat(rngA.value);
        let b = parseFloat(rngB.value);
        let c = parseFloat(rngC.value);
        if (Math.abs(c) < 0.1) { c = 0.5; rngC.value = 0.5; }
        let d = parseFloat(rngD.value);

        container.querySelector('#val-gen-a').innerText = a;
        container.querySelector('#val-gen-b').innerText = b;
        container.querySelector('#val-gen-c').innerText = c;
        container.querySelector('#val-gen-d').innerText = d;

        const vAsy = -d / c;
        const hAsy = a / c;

        container.querySelector('#gen-vasy').innerText = vAsy.toFixed(2);
        container.querySelector('#gen-hasy').innerText = hAsy.toFixed(2);
        container.querySelector('#gen-center').innerText = `(${vAsy.toFixed(2)}, ${hAsy.toFixed(2)})`;

        // Plot
        const x1 = [], y1 = [];
        const x2 = [], y2 = [];
        const step = 0.1;
        const limit = 20;

        for (let x = -limit; x < vAsy - 0.05; x += step) {
            x1.push(x);
            y1.push((a * x + b) / (c * x + d));
        }
        for (let x = vAsy + 0.05; x <= limit; x += step) {
            x2.push(x);
            y2.push((a * x + b) / (c * x + d));
        }

        const shapes = [
            { type: 'line', x0: vAsy, y0: -limit, x1: vAsy, y1: limit, line: { color: 'red', dash: 'dash', width: 2 } },
            { type: 'line', x0: -limit, y0: hAsy, x1: limit, y1: hAsy, line: { color: 'orange', dash: 'dash', width: 2 } },
            { type: 'line', x0: -limit, y0: 0, x1: limit, y1: 0, line: { color: 'black', width: 1 } },
            { type: 'line', x0: 0, y0: -limit, x1: 0, y1: limit, line: { color: 'black', width: 1 } }
        ];

        const layout = {
            title: `y = (${a}x + ${b}) / (${c}x + ${d})`,
            margin: { t: 40, b: 30, l: 30, r: 20 },
            xaxis: { range: [-10, 10], title: 'x' },
            yaxis: { range: [-10, 10], title: 'y' },
            shapes: shapes,
            showlegend: false
        };

        const traces = [
            { x: x1, y: y1, mode: 'lines', line: { color: '#3b82f6', width: 3 }, name: 'Left Branch' },
            { x: x2, y: y2, mode: 'lines', line: { color: '#3b82f6', width: 3 }, name: 'Right Branch' },
            {
                x: [vAsy], y: [hAsy], mode: 'markers+text',
                marker: { size: 10, color: 'purple', symbol: 'cross' },
                name: '对称中心',
                text: [`Center (${vAsy.toFixed(2)}, ${hAsy.toFixed(2)})`],
                textposition: 'top right'
            }
        ];

        Plotly.react('gen-plot', traces, layout, { displayModeBar: false });
        if (window.MathJax) MathJax.typesetPromise();
    }

    rngA.oninput = update;
    rngB.oninput = update;
    rngC.oninput = update;
    rngD.oninput = update;
    setTimeout(update, 100);
}

function renderFractionalSpecial(container) {
    container.innerHTML = `
        <div style="display:flex; height:100%; gap:20px; padding:20px;">
            <div class="lab-column" style="width:280px; flex-shrink:0;">
                <h3 style="margin-top:0; border-bottom:1px solid #eee; padding-bottom:10px;">特殊分式函数</h3>
                <div class="formula-box">
                    $$ y = \\frac{ax}{x+b} $$
                </div>
                
                <div class="controls-section">
                    <label>a = <span id="val-fra">1</span> <input type="range" id="rng-fra" min="-5" max="5" step="0.5" value="1"></label>
                    <label>b = <span id="val-frb">1</span> <input type="range" id="rng-frb" min="-5" max="5" step="0.5" value="1"></label>
                </div>
                
                <div class="info-card" style="margin-top:10px;">
                    <p><strong>情形:</strong> <span id="frac-case" style="font-weight:bold;">a>0, b>0</span></p>
                    <p><strong>渐近线:</strong></p>
                    <ul style="padding-left:20px; margin:5px 0;">
                        <li>垂直: $x = -b$ = <span id="frac-vasy">-1</span></li>
                        <li>水平: $y = a$ = <span id="frac-hasy">1</span></li>
                    </ul>
                    <p><strong>单调性:</strong> <span id="frac-mono">增函数</span></p>
                    <p><strong>值域:</strong> $y \\neq a$</p>
                </div>
                
                <div class="info-card" style="margin-top:10px; background:#f0f9ff; border-color:#bae6fd;">
                    <p style="font-size:12px;"><strong>ab符号:</strong> <span id="frac-ab-sign">ab > 0</span></p>
                    <p style="font-size:12px; margin-top:4px;" id="frac-ab-desc">图像分布在渐近线的一、三象限区域</p>
                </div>
            </div>
            
            <div class="lab-column" style="flex:1; display:flex; flex-direction:column;">
                <div id="frac-plot" style="flex:1;"></div>
            </div>
        </div>
    `;

    const rngA = container.querySelector('#rng-fra');
    const rngB = container.querySelector('#rng-frb');

    function update() {
        let a = parseFloat(rngA.value);
        if (a === 0) { a = 0.5; rngA.value = 0.5; }
        let b = parseFloat(rngB.value);
        if (b === 0) { b = 0.5; rngB.value = 0.5; }

        container.querySelector('#val-fra').innerText = a;
        container.querySelector('#val-frb').innerText = b;

        const vAsy = -b;
        const hAsy = a;

        container.querySelector('#frac-vasy').innerText = vAsy;
        container.querySelector('#frac-hasy').innerText = hAsy;

        const ab = a * b;
        let caseText = "";
        if (a > 0) caseText += "a > 0, "; else caseText += "a < 0, ";
        if (b > 0) caseText += "b > 0"; else caseText += "b < 0";

        container.querySelector('#frac-case').innerText = caseText;

        const monoEl = container.querySelector('#frac-mono');
        const abSignEl = container.querySelector('#frac-ab-sign');
        const abDescEl = container.querySelector('#frac-ab-desc');

        if (ab > 0) {
            monoEl.innerText = `在 (-∞, ${vAsy}) 和 (${vAsy}, +∞) 上均为增函数 📈`;
            monoEl.style.color = "green";
            abSignEl.innerText = `ab = ${ab.toFixed(2)} > 0`;
            abDescEl.innerText = "图像分布在渐近线的 二、四 区域 (相对于渐近线交点)";
        } else {
            monoEl.innerText = `在 (-∞, ${vAsy}) 和 (${vAsy}, +∞) 上均为减函数 📉`;
            monoEl.style.color = "red";
            abSignEl.innerText = `ab = ${ab.toFixed(2)} < 0`;
            abDescEl.innerText = "图像分布在渐近线的 一、三 区域 (相对于渐近线交点)";
        }

        // Plot
        const x1 = [], y1 = [];
        const x2 = [], y2 = [];
        const step = 0.1;
        const limit = 20;

        for (let x = -limit; x < vAsy - 0.05; x += step) {
            x1.push(x);
            y1.push((a * x) / (x + b));
        }
        for (let x = vAsy + 0.05; x <= limit; x += step) {
            x2.push(x);
            y2.push((a * x) / (x + b));
        }

        const shapes = [
            { type: 'line', x0: vAsy, y0: -limit, x1: vAsy, y1: limit, line: { color: 'red', dash: 'dash', width: 2 } },
            { type: 'line', x0: -limit, y0: hAsy, x1: limit, y1: hAsy, line: { color: 'orange', dash: 'dash', width: 2 } },
            { type: 'line', x0: -limit, y0: 0, x1: limit, y1: 0, line: { color: 'black', width: 1 } },
            { type: 'line', x0: 0, y0: -limit, x1: 0, y1: limit, line: { color: 'black', width: 1 } }
        ];

        const layout = {
            title: `y = ${a}x / (x + ${b})`,
            margin: { t: 40, b: 30, l: 30, r: 20 },
            xaxis: { range: [-10, 10], title: 'x' },
            yaxis: { range: [-10, 10], title: 'y' },
            shapes: shapes,
            showlegend: false
        };

        const traces = [
            { x: x1, y: y1, mode: 'lines', line: { color: '#3b82f6', width: 3 }, name: 'Left Branch' },
            { x: x2, y: y2, mode: 'lines', line: { color: '#3b82f6', width: 3 }, name: 'Right Branch' }
        ];

        Plotly.react('frac-plot', traces, layout, { displayModeBar: false });

        if (window.MathJax) MathJax.typesetPromise();
    }

    rngA.oninput = update;
    rngB.oninput = update;

    setTimeout(update, 100);
}

function renderQuadraticFactored(container) {
    container.innerHTML = `
        <h3>3. 交点式 (Factored Form)</h3>
        <div class="formula-box">$$ f(x) = a(x-x_1)(x-x_2) \\quad (a \\neq 0) $$</div>
        <div class="lab-row" style="margin-top:20px;">
            <div class="lab-column" style="width:300px; flex-grow:0;">
                <div class="controls-section">
                    <label>a = <span id="val-fa">1</span> <input type="range" id="rng-fa" min="-10" max="10" step="0.1" value="1"></label>
                    <label>x1 = <span id="val-fx1">-2</span> <input type="range" id="rng-fx1" min="-20" max="20" step="0.1" value="-2"></label>
                    <label>x2 = <span id="val-fx2">3</span> <input type="range" id="rng-fx2" min="-20" max="20" step="0.1" value="3"></label>
                </div>
                <div class="info-card" style="margin-top:10px;">
                    <p>交点坐标: $$ (<span id="res-fx1">-2</span>, 0), (<span id="res-fx2">3</span>, 0) $$</p>
                    <p>对称轴: $$ x = \\frac{x_1+x_2}{2} = <span id="res-faxis">0.5</span> $$</p>
                    <p>顶点: $$ (<span id="res-fvx">0.5</span>, <span id="res-fvy">-6.25</span>) $$</p>
                </div>
            </div>
            <div class="lab-column">
                <div id="quad-plot-fac" style="height:400px;"></div>
            </div>
        </div>
    `;

    const rngA = container.querySelector('#rng-fa');
    const rngX1 = container.querySelector('#rng-fx1');
    const rngX2 = container.querySelector('#rng-fx2');

    function update() {
        let a = parseFloat(rngA.value);
        if (Math.abs(a) < 0.1) a = 0.1;
        const x1 = parseFloat(rngX1.value);
        const x2 = parseFloat(rngX2.value);

        container.querySelector('#val-fa').innerText = a;
        container.querySelector('#val-fx1').innerText = x1;
        container.querySelector('#val-fx2').innerText = x2;

        const axis = (x1 + x2) / 2;
        const vy = a * (axis - x1) * (axis - x2);

        container.querySelector('#res-fx1').innerText = x1;
        container.querySelector('#res-fx2').innerText = x2;
        container.querySelector('#res-faxis').innerText = axis.toFixed(2);
        container.querySelector('#res-fvx').innerText = axis.toFixed(2);
        container.querySelector('#res-fvy').innerText = vy.toFixed(2);

        const x = [], y = [];
        // Dynamic range centered on axis, wide enough to show roots
        const spread = Math.max(Math.abs(x1 - axis), Math.abs(x2 - axis), 5);
        const xMin = axis - spread - 2;
        const xMax = axis + spread + 2;

        for (let i = xMin; i <= xMax; i += 0.1) {
            x.push(i);
            y.push(a * (i - x1) * (i - x2));
        }

        Plotly.react('quad-plot-fac', [{
            x: x, y: y, type: 'scatter', mode: 'lines', line: { color: '#8b5cf6', width: 3 }
        }, {
            x: [x1, x2], y: [0, 0], type: 'scatter', mode: 'markers+text', marker: { color: 'orange', size: 10 }, name: 'Roots',
            text: [x1.toFixed(2), x2.toFixed(2)], textposition: 'bottom center'
        }, {
            x: [axis], y: [vy], type: 'scatter', mode: 'markers+text', marker: { color: 'red', size: 8 }, name: 'Vertex',
            text: ['Vertex'], textposition: 'top center'
        }], {
            title: `y = ${a}(x - (${x1}))(x - (${x2}))`,
            margin: { t: 40, b: 30, l: 30, r: 20 },
            xaxis: { range: [xMin, xMax] },
            yaxis: { range: [vy - (Math.abs(vy) + 10), vy + (Math.abs(vy) + 10)] }
        }, { displayModeBar: false });

        if (window.MathJax) MathJax.typesetPromise();
    }
    rngA.oninput = update;
    rngX1.oninput = update;
    rngX2.oninput = update;
    setTimeout(update, 100);
}

function renderQuadraticProps(container) {
    container.innerHTML = `
        <h3>4. 图像及性质 (Graph & Properties)</h3>
        <p>探究 coefficients $a, b, c$ 对图像的影响。</p>
        <div class="lab-row">
            <div class="lab-column" style="width:280px; flex-grow:0;">
                <div class="controls-section">
                    <label>a = <span id="val-pa">1</span> <input type="range" id="rng-pa" min="-10" max="10" step="0.1" value="1"></label>
                    <label>b = <span id="val-pb">-2</span> <input type="range" id="rng-pb" min="-20" max="20" step="0.1" value="-2"></label>
                    <label>c = <span id="val-pc">-1</span> <input type="range" id="rng-pc" min="-50" max="50" step="0.1" value="-1"></label>
                </div>
                <div class="info-card" style="margin-top:10px; font-size:14px;">
                    <p><strong>开口方向:</strong> <span id="prop-open">向上</span> (a <span id="prop-a-sign">&gt;</span> 0)</p>
                    <p><strong>对称轴:</strong> $$ x = -\\frac{b}{2a} = <span id="prop-axis">1</span> $$</p>
                    <p><strong>顶点:</strong> $$ (<span id="prop-vx">1</span>, <span id="prop-vy">-2</span>) $$</p>
                    <p><strong>y轴交点:</strong> (0, c) = (0, <span id="prop-c">-1</span>)</p>
                    <p><strong>增减性:</strong><br>
                       <span id="prop-mono1">(-∞, 1]</span> 📉<br>
                       <span id="prop-mono2">[1, +∞)</span> 📈
                    </p>
                </div>
            </div>
            <div class="lab-column">
                <div id="quad-plot-props" style="height:450px;"></div>
            </div>
        </div>
    `;

    const rngA = container.querySelector('#rng-pa');
    const rngB = container.querySelector('#rng-pb');
    const rngC = container.querySelector('#rng-pc');

    function update() {
        let a = parseFloat(rngA.value);
        if (Math.abs(a) < 0.1) a = 0.1; // Avoid a=0
        const b = parseFloat(rngB.value);
        const c = parseFloat(rngC.value);

        container.querySelector('#val-pa').innerText = a;
        container.querySelector('#val-pb').innerText = b;
        container.querySelector('#val-pc').innerText = c;

        // Properties
        const axis = -b / (2 * a);
        const vertexY = (4 * a * c - b * b) / (4 * a);

        container.querySelector('#prop-open').innerText = a > 0 ? '向上' : '向下';
        container.querySelector('#prop-a-sign').innerText = a > 0 ? '>' : '<';
        container.querySelector('#prop-axis').innerText = axis.toFixed(2);
        container.querySelector('#prop-vx').innerText = axis.toFixed(2);
        container.querySelector('#prop-vy').innerText = vertexY.toFixed(2);
        container.querySelector('#prop-c').innerText = c;

        if (a > 0) {
            container.querySelector('#prop-mono1').innerText = `(-∞, ${axis.toFixed(2)}]`;
            container.querySelector('#prop-mono2').innerText = `[${axis.toFixed(2)}, +∞)`;
            container.querySelector('#prop-mono1').nextSibling.nodeValue = ' 📉 (减)';
            container.querySelector('#prop-mono2').nextSibling.nodeValue = ' 📈 (增)';
        } else {
            container.querySelector('#prop-mono1').innerText = `(-∞, ${axis.toFixed(2)}]`;
            container.querySelector('#prop-mono2').innerText = `[${axis.toFixed(2)}, +∞)`;
            container.querySelector('#prop-mono1').nextSibling.nodeValue = ' 📈 (增)';
            container.querySelector('#prop-mono2').nextSibling.nodeValue = ' 📉 (减)';
        }

        // Plot
        const xMin = axis - 10;
        const xMax = axis + 10;
        const yMin = vertexY - 20;
        const yMax = vertexY + 20;

        const x = [], y = [];
        for (let i = xMin; i <= xMax; i += 0.1) {
            x.push(i);
            y.push(a * i * i + b * i + c);
        }

        const shapes = [];
        // Monotonicity intervals background
        // Use very large Y values for rects to cover dynamic range
        const bigY = 10000;

        if (a > 0) {
            // Decreasing (-inf, axis] -> Red
            shapes.push({
                type: 'rect', x0: axis - 20, x1: axis, y0: -bigY, y1: bigY,
                fillcolor: 'rgba(255, 0, 0, 0.1)', line: { width: 0 }, layer: 'below'
            });
            // Increasing [axis, inf) -> Green
            shapes.push({
                type: 'rect', x0: axis, x1: axis + 20, y0: -bigY, y1: bigY,
                fillcolor: 'rgba(0, 255, 0, 0.1)', line: { width: 0 }, layer: 'below'
            });
        } else {
            // Increasing (-inf, axis] -> Green
            shapes.push({
                type: 'rect', x0: axis - 20, x1: axis, y0: -bigY, y1: bigY,
                fillcolor: 'rgba(0, 255, 0, 0.1)', line: { width: 0 }, layer: 'below'
            });
            // Decreasing [axis, inf) -> Red
            shapes.push({
                type: 'rect', x0: axis, x1: axis + 20, y0: -bigY, y1: bigY,
                fillcolor: 'rgba(255, 0, 0, 0.1)', line: { width: 0 }, layer: 'below'
            });
        }
        shapes.push({
            type: 'line', x0: axis, y0: yMin, y1: yMax,
            line: { dash: 'dash', color: 'gray', width: 1 }
        });

        Plotly.react('quad-plot-props', [{
            x: x, y: y, type: 'scatter', mode: 'lines', line: { color: '#3b82f6', width: 3 }
        }, {
            x: [axis], y: [vertexY], mode: 'markers', marker: { color: 'red', size: 8 }, name: 'Vertex'
        }], {
            title: `f(x) = ${a}x² + ${b}x + ${c}`,
            margin: { t: 40, b: 30, l: 40, r: 20 },
            xaxis: { range: [xMin, xMax] },
            yaxis: { range: [yMin, yMax] },
            shapes: shapes
        }, { displayModeBar: false });

        if (window.MathJax) MathJax.typesetPromise();
    }

    rngA.oninput = update;
    rngB.oninput = update;
    rngC.oninput = update;
    setTimeout(update, 100);
}

function renderQuadraticVieta(container) {
    container.innerHTML = `
        <h3>5. 根与系数关系 (Vieta's Formulas)</h3>
        <p>若 $ax^2 + bx + c = 0$ 有两根 $x_1, x_2$，则：</p>
        <div class="formula-box">
            $$ x_1 + x_2 = -\\frac{b}{a} $$
            $$ x_1 x_2 = \\frac{c}{a} $$
        </div>
        <div class="lab-row">
            <div class="lab-column" style="width:250px; flex-grow:0;">
                <div class="controls-section">
                    <label>a = <span id="val-va">1</span> <input type="range" id="rng-va" min="-10" max="10" step="0.1" value="1"></label>
                    <label>b = <span id="val-vb">-2</span> <input type="range" id="rng-vb" min="-20" max="20" step="0.1" value="-2"></label>
                    <label>c = <span id="val-vc">-3</span> <input type="range" id="rng-vc" min="-50" max="50" step="0.1" value="-3"></label>
                </div>
                <div class="info-card" style="margin-top:10px;">
                    <p><strong>判别式 $\\Delta$:</strong> <span id="vieta-delta">16</span></p>
                    <p><strong>理论和:</strong> <span id="vieta-sum-t">2</span></p>
                    <p><strong>理论积:</strong> <span id="vieta-prod-t">-3</span></p>
                    <hr>
                    <p><strong>实际根:</strong> <span id="vieta-roots">x1=-1, x2=3</span></p>
                    <p><strong>实际和:</strong> <span id="vieta-sum-r">2</span></p>
                    <p><strong>实际积:</strong> <span id="vieta-prod-r">-3</span></p>
                </div>
            </div>
            <div class="lab-column">
                <div id="quad-plot-vieta" style="height:400px;"></div>
            </div>
        </div>
    `;

    const rngA = container.querySelector('#rng-va');
    const rngB = container.querySelector('#rng-vb');
    const rngC = container.querySelector('#rng-vc');

    function update() {
        let a = parseFloat(rngA.value);
        if (Math.abs(a) < 0.1) a = 0.1;
        const b = parseFloat(rngB.value);
        const c = parseFloat(rngC.value);

        container.querySelector('#val-va').innerText = a;
        container.querySelector('#val-vb').innerText = b;
        container.querySelector('#val-vc').innerText = c;

        const delta = b * b - 4 * a * c;
        container.querySelector('#vieta-delta').innerText = delta.toFixed(2);
        container.querySelector('#vieta-sum-t').innerText = (-b / a).toFixed(2);
        container.querySelector('#vieta-prod-t').innerText = (c / a).toFixed(2);

        let rootsText = "无实根";
        let x1 = null, x2 = null;
        let sumR = "-", prodR = "-";

        if (delta >= 0) {
            x1 = (-b - Math.sqrt(delta)) / (2 * a);
            x2 = (-b + Math.sqrt(delta)) / (2 * a);
            rootsText = `x1=${x1.toFixed(2)}, x2=${x2.toFixed(2)}`;
            sumR = (x1 + x2).toFixed(2);
            prodR = (x1 * x2).toFixed(2);
        }

        container.querySelector('#vieta-roots').innerText = rootsText;
        container.querySelector('#vieta-sum-r').innerText = sumR;
        container.querySelector('#vieta-prod-r').innerText = prodR;

        // Plot
        const axis = -b / (2 * a);
        const vy = (4 * a * c - b * b) / (4 * a);

        let spread = 10;
        if (x1 !== null) {
            const dist = Math.abs(x1 - axis);
            spread = Math.max(10, dist + 5);
        }
        const xMin = axis - spread;
        const xMax = axis + spread;

        const x = [], y = [];
        for (let i = xMin; i <= xMax; i += 0.1) {
            x.push(i);
            y.push(a * i * i + b * i + c);
        }

        const traces = [{ x, y, type: 'scatter', mode: 'lines', line: { color: '#6366f1' } }];
        if (x1 !== null) {
            traces.push({
                x: [x1, x2], y: [0, 0], mode: 'markers', marker: { color: 'orange', size: 10 }, name: 'Roots'
            });
        }
        traces.push({
            x: [axis, axis], y: [vy - 100, vy + 100], mode: 'lines', line: { dash: 'dash', color: 'gray', width: 1 }, name: 'Axis'
        });

        Plotly.react('quad-plot-vieta', traces, {
            title: `y = ${a}x² + ${b}x + ${c}`,
            margin: { t: 30, b: 30, l: 30, r: 20 },
            xaxis: { range: [xMin, xMax] },
            yaxis: { range: [vy - 20, vy + 20] }
        }, { displayModeBar: false });

        if (window.MathJax) MathJax.typesetPromise();
    }

    rngA.oninput = update;
    rngB.oninput = update;
    rngC.oninput = update;
    setTimeout(update, 100);
}

function renderQuadraticExtrema(container) {
    container.innerHTML = `
        <h3>6. 区间最值 (Extrema on Interval)</h3>
        <p>求 $f(x)$ 在闭区间 $[m, n]$ 上的最大值和最小值。</p>
        <div class="lab-row">
            <div class="lab-column" style="width:250px; flex-grow:0;">
                <div class="controls-section">
                    <label>a = <span id="val-ea">1</span> <input type="range" id="rng-ea" min="-10" max="10" step="0.1" value="1"></label>
                    <label>b = <span id="val-eb">-2</span> <input type="range" id="rng-eb" min="-20" max="20" step="0.1" value="-2"></label>
                    <label>c = <span id="val-ec">1</span> <input type="range" id="rng-ec" min="-50" max="50" step="0.1" value="1"></label>
                    <hr>
                    <label>m = <span id="val-m">-1</span> <input type="range" id="rng-m" min="-20" max="20" step="0.1" value="-1"></label>
                    <label>n = <span id="val-n">2</span> <input type="range" id="rng-n" min="-20" max="20" step="0.1" value="2"></label>
                </div>
                <div class="info-card" style="margin-top:10px;">
                    <p><strong>对称轴:</strong> <span id="ext-axis">1</span></p>
                    <p><strong>区间:</strong> [<span id="ext-m">-1</span>, <span id="ext-n">2</span>]</p>
                    <p><strong>Max:</strong> <span id="ext-max" style="color:red"></span></p>
                    <p><strong>Min:</strong> <span id="ext-min" style="color:green"></span></p>
                </div>
            </div>
            <div class="lab-column">
                <div id="quad-plot-ext" style="height:400px;"></div>
            </div>
        </div>
    `;

    const rngA = container.querySelector('#rng-ea');
    const rngB = container.querySelector('#rng-eb');
    const rngC = container.querySelector('#rng-ec');
    const rngM = container.querySelector('#rng-m');
    const rngN = container.querySelector('#rng-n');

    function update() {
        let a = parseFloat(rngA.value);
        if (Math.abs(a) < 0.1) a = 0.1;
        const b = parseFloat(rngB.value);
        const c = parseFloat(rngC.value);
        let m = parseFloat(rngM.value);
        let n = parseFloat(rngN.value);

        if (m > n) { [m, n] = [n, m]; } // Ensure m <= n

        container.querySelector('#val-ea').innerText = a;
        container.querySelector('#val-eb').innerText = b;
        container.querySelector('#val-ec').innerText = c;
        container.querySelector('#val-m').innerText = m;
        container.querySelector('#val-n').innerText = n;
        container.querySelector('#ext-m').innerText = m;
        container.querySelector('#ext-n').innerText = n;

        const f = x => a * x * x + b * x + c;
        const axis = -b / (2 * a);
        container.querySelector('#ext-axis').innerText = axis.toFixed(2);

        // Calculate Extrema
        let candidates = [m, n];
        if (axis >= m && axis <= n) candidates.push(axis);

        const values = candidates.map(x => ({ x, y: f(x) }));
        values.sort((p1, p2) => p1.y - p2.y);

        const minPt = values[0];
        const maxPt = values[values.length - 1];

        container.querySelector('#ext-max').innerText = `${maxPt.y.toFixed(2)} (at x=${maxPt.x.toFixed(2)})`;
        container.querySelector('#ext-min').innerText = `${minPt.y.toFixed(2)} (at x=${minPt.x.toFixed(2)})`;

        // Plot
        const xMin = Math.min(m, axis) - 5;
        const xMax = Math.max(n, axis) + 5;
        const vy = f(axis);
        const yMin = Math.min(minPt.y, vy) - 10;
        const yMax = Math.max(maxPt.y, vy) + 10;

        const xFull = [], yFull = [];
        for (let i = xMin; i <= xMax; i += 0.1) {
            xFull.push(i);
            yFull.push(f(i));
        }

        const xSeg = [], ySeg = [];
        for (let i = m; i <= n; i += 0.05) {
            xSeg.push(i);
            ySeg.push(f(i));
        }

        Plotly.react('quad-plot-ext', [
            { x: xFull, y: yFull, type: 'scatter', mode: 'lines', line: { color: '#e2e8f0', width: 2 }, name: 'f(x)' },
            { x: xSeg, y: ySeg, type: 'scatter', mode: 'lines', line: { color: '#3b82f6', width: 4 }, name: 'Interval' },
            { x: [maxPt.x], y: [maxPt.y], mode: 'markers', marker: { color: 'red', size: 10 }, name: 'Max' },
            { x: [minPt.x], y: [minPt.y], mode: 'markers', marker: { color: 'green', size: 10 }, name: 'Min' },
            { x: [m, m], y: [yMin, yMax], mode: 'lines', line: { dash: 'dot', color: 'gray' }, showlegend: false },
            { x: [n, n], y: [yMin, yMax], mode: 'lines', line: { dash: 'dot', color: 'gray' }, showlegend: false }
        ], {
            title: `区间 [${m}, ${n}] 上的最值`,
            margin: { t: 40, b: 30, l: 30, r: 20 },
            xaxis: { range: [xMin, xMax] },
            yaxis: { range: [yMin, yMax] }
        }, { displayModeBar: false });
    }

    rngA.oninput = update;
    rngB.oninput = update;
    rngC.oninput = update;
    rngM.oninput = update;
    rngN.oninput = update;
    setTimeout(update, 100);
}

function renderQuadraticEqIneq(container) {
    container.innerHTML = `
        <h3>7. 方程与不等式 (Equations & Inequalities)</h3>
        <p>二次方程 $f(x)=0$ 的根即为 $f(x)$ 图像与 x 轴交点的横坐标。</p>
        <div class="lab-row">
            <div class="lab-column" style="width:280px; flex-grow:0;">
                <div class="controls-section">
                    <label>a = <span id="val-qa">1</span> <input type="range" id="rng-qa" min="-10" max="10" step="0.1" value="1"></label>
                    <label>b = <span id="val-qb">-2</span> <input type="range" id="rng-qb" min="-20" max="20" step="0.1" value="-2"></label>
                    <label>c = <span id="val-qc">-3</span> <input type="range" id="rng-qc" min="-50" max="50" step="0.1" value="-3"></label>
                </div>
                <div class="info-card" style="margin-top:10px;">
                    <p><strong>判别式 $\\Delta$:</strong> <span id="eq-delta">16</span></p>
                    <p><strong>方程 $f(x)=0$:</strong> <br><span id="eq-roots">x1=-1, x2=3</span></p>
                    <p><strong>不等式 $f(x)>0$:</strong> <br><span id="ineq-gt">x < -1 或 x > 3</span></p>
                    <p><strong>不等式 $f(x)<0$:</strong> <br><span id="ineq-lt">-1 < x < 3</span></p>
                </div>
            </div>
            <div class="lab-column">
                <div id="quad-plot-eq" style="height:400px;"></div>
            </div>
        </div>
    `;

    const rngA = container.querySelector('#rng-qa');
    const rngB = container.querySelector('#rng-qb');
    const rngC = container.querySelector('#rng-qc');

    function update() {
        let a = parseFloat(rngA.value);
        if (Math.abs(a) < 0.1) a = 0.1;
        const b = parseFloat(rngB.value);
        const c = parseFloat(rngC.value);

        container.querySelector('#val-qa').innerText = a;
        container.querySelector('#val-qb').innerText = b;
        container.querySelector('#val-qc').innerText = c;

        const delta = b * b - 4 * a * c;
        container.querySelector('#eq-delta').innerText = delta.toFixed(2);

        let roots = [];
        let rootsText = "无实根";
        if (delta >= 0) {
            let x1 = (-b - Math.sqrt(delta)) / (2 * a);
            let x2 = (-b + Math.sqrt(delta)) / (2 * a);
            if (x1 > x2) [x1, x2] = [x2, x1]; // Ensure x1 <= x2
            roots = [x1, x2];
            rootsText = delta === 0 ? `x = ${x1.toFixed(2)}` : `x1=${x1.toFixed(2)}, x2=${x2.toFixed(2)}`;
        }
        container.querySelector('#eq-roots').innerText = rootsText;

        // Inequalities
        let gtText = "", ltText = "";
        if (a > 0) {
            if (delta > 0) {
                gtText = `x < ${roots[0].toFixed(2)} 或 x > ${roots[1].toFixed(2)}`;
                ltText = `${roots[0].toFixed(2)} < x < ${roots[1].toFixed(2)}`;
            } else if (delta === 0) {
                gtText = `x ≠ ${roots[0].toFixed(2)}`;
                ltText = "无解";
            } else {
                gtText = "R (全体实数)";
                ltText = "无解";
            }
        } else {
            if (delta > 0) {
                gtText = `${roots[0].toFixed(2)} < x < ${roots[1].toFixed(2)}`;
                ltText = `x < ${roots[0].toFixed(2)} 或 x > ${roots[1].toFixed(2)}`;
            } else if (delta === 0) {
                gtText = "无解";
                ltText = `x ≠ ${roots[0].toFixed(2)}`;
            } else {
                gtText = "无解";
                ltText = "R (全体实数)";
            }
        }
        container.querySelector('#ineq-gt').innerText = gtText;
        container.querySelector('#ineq-lt').innerText = ltText;

        // Plot
        const axis = -b / (2 * a);
        const vertexY = (4 * a * c - b * b) / (4 * a);

        let spread = 10;
        if (roots.length > 0) {
            const dist = Math.abs(roots[0] - axis);
            spread = Math.max(10, dist + 5);
        }
        const xMin = axis - spread;
        const xMax = axis + spread;

        const yMin = vertexY - 20;
        const yMax = vertexY + 20;

        const x = [], y = [];
        for (let i = xMin; i <= xMax; i += 0.1) {
            x.push(i);
            y.push(a * i * i + b * i + c);
        }

        const traces = [{ x, y, type: 'scatter', mode: 'lines', line: { color: '#3b82f6' } }];
        if (roots.length > 0) {
            traces.push({
                x: roots, y: roots.map(() => 0), mode: 'markers', marker: { color: 'red', size: 10 }, name: 'Roots'
            });
        }

        // Highlight > 0 regions
        const shapes = [
            { type: 'line', x0: xMin, y0: 0, x1: xMax, y1: 0, line: { color: 'black', width: 2 } }
        ];

        const bigY = 10000;

        if (roots.length === 2) {
            const [r1, r2] = roots;
            if (a > 0) {
                // f(x) > 0: (-inf, r1) U (r2, inf) -> Green
                shapes.push({
                    type: 'rect', x0: xMin, x1: r1, y0: -bigY, y1: bigY,
                    fillcolor: 'rgba(0, 255, 0, 0.1)', line: { width: 0 }, layer: 'below'
                });
                shapes.push({
                    type: 'rect', x0: r2, x1: xMax, y0: -bigY, y1: bigY,
                    fillcolor: 'rgba(0, 255, 0, 0.1)', line: { width: 0 }, layer: 'below'
                });
                // f(x) < 0: (r1, r2) -> Red
                shapes.push({
                    type: 'rect', x0: r1, x1: r2, y0: -bigY, y1: bigY,
                    fillcolor: 'rgba(255, 0, 0, 0.1)', line: { width: 0 }, layer: 'below'
                });
            } else {
                // f(x) > 0: (r1, r2) -> Green
                shapes.push({
                    type: 'rect', x0: r1, x1: r2, y0: -bigY, y1: bigY,
                    fillcolor: 'rgba(0, 255, 0, 0.1)', line: { width: 0 }, layer: 'below'
                });
                // f(x) < 0: (-inf, r1) U (r2, inf) -> Red
                shapes.push({
                    type: 'rect', x0: xMin, x1: r1, y0: -bigY, y1: bigY,
                    fillcolor: 'rgba(255, 0, 0, 0.1)', line: { width: 0 }, layer: 'below'
                });
                shapes.push({
                    type: 'rect', x0: r2, x1: xMax, y0: -bigY, y1: bigY,
                    fillcolor: 'rgba(255, 0, 0, 0.1)', line: { width: 0 }, layer: 'below'
                });
            }
        } else if (roots.length === 1) {
            const r1 = roots[0];
            if (a > 0) {
                // f(x) >= 0 everywhere, >0 except at r1
                shapes.push({
                    type: 'rect', x0: xMin, x1: xMax, y0: -bigY, y1: bigY,
                    fillcolor: 'rgba(0, 255, 0, 0.1)', line: { width: 0 }, layer: 'below'
                });
            } else {
                // f(x) <= 0 everywhere
                shapes.push({
                    type: 'rect', x0: xMin, x1: xMax, y0: -bigY, y1: bigY,
                    fillcolor: 'rgba(255, 0, 0, 0.1)', line: { width: 0 }, layer: 'below'
                });
            }
        } else {
            // No roots
            if (a > 0) {
                shapes.push({
                    type: 'rect', x0: xMin, x1: xMax, y0: -bigY, y1: bigY,
                    fillcolor: 'rgba(0, 255, 0, 0.1)', line: { width: 0 }, layer: 'below'
                });
            } else {
                shapes.push({
                    type: 'rect', x0: xMin, x1: xMax, y0: -bigY, y1: bigY,
                    fillcolor: 'rgba(255, 0, 0, 0.1)', line: { width: 0 }, layer: 'below'
                });
            }
        }

        Plotly.react('quad-plot-eq', traces, {
            title: `f(x) = ${a}x² + ${b}x + ${c}`,
            margin: { t: 40, b: 30, l: 30, r: 20 },
            xaxis: { range: [xMin, xMax] },
            yaxis: { range: [yMin, yMax] },
            shapes: shapes
        }, { displayModeBar: false });

        if (window.MathJax) MathJax.typesetPromise();
    }

    rngA.oninput = update;
    rngB.oninput = update;
    rngC.oninput = update;
    setTimeout(update, 100);
}

function renderQuadraticIneqStrat(container) {
    container.innerHTML = `
        <h3>8. 不等式恒成立 (Always Holds Strategy)</h3>
        <p>探究 $ax^2+bx+c > 0$ 或 $< 0$ 恒成立的条件。</p>
        <div class="lab-row">
            <div class="lab-column" style="width:280px; flex-grow:0;">
                <div class="controls-section">
                    <label>a = <span id="val-ia">1</span> <input type="range" id="rng-ia" min="-10" max="10" step="0.1" value="1"></label>
                    <label>b = <span id="val-ib">0</span> <input type="range" id="rng-ib" min="-20" max="20" step="0.1" value="0"></label>
                    <label>c = <span id="val-ic">2</span> <input type="range" id="rng-ic" min="-50" max="50" step="0.1" value="2"></label>
                </div>
                <div class="info-card" style="margin-top:10px;">
                    <p><strong>判别式 $\\Delta$:</strong> <span id="ineq-delta">-8</span></p>
                    <p><strong>状态:</strong> <span id="ineq-status" style="font-weight:bold; color:green;">恒大于 0</span></p>
                    <hr>
                    <p style="font-size:13px;">恒大于 0 条件: $a > 0$ 且 $\\Delta < 0$</p>
                    <p style="font-size:13px;">恒小于 0 条件: $a < 0$ 且 $\\Delta < 0$</p>
                </div>
            </div>
            <div class="lab-column">
                <div id="quad-plot-ineq" style="height:400px;"></div>
            </div>
        </div>
    `;

    const rngA = container.querySelector('#rng-ia');
    const rngB = container.querySelector('#rng-ib');
    const rngC = container.querySelector('#rng-ic');

    function update() {
        let a = parseFloat(rngA.value);
        if (Math.abs(a) < 0.1) a = 0.1;
        const b = parseFloat(rngB.value);
        const c = parseFloat(rngC.value);

        container.querySelector('#val-ia').innerText = a;
        container.querySelector('#val-ib').innerText = b;
        container.querySelector('#val-ic').innerText = c;

        const delta = b * b - 4 * a * c;
        container.querySelector('#ineq-delta').innerText = delta.toFixed(2);

        const statusEl = container.querySelector('#ineq-status');
        if (delta < 0) {
            if (a > 0) {
                statusEl.innerText = "恒大于 0 (Always > 0)";
                statusEl.style.color = "green";
            } else {
                statusEl.innerText = "恒小于 0 (Always < 0)";
                statusEl.style.color = "blue";
            }
        } else {
            statusEl.innerText = "有正有负 (Crosses x-axis)";
            statusEl.style.color = "orange";
        }

        // Plot
        const axis = -b / (2 * a);
        const vertexY = (4 * a * c - b * b) / (4 * a);

        let spread = 10;
        if (delta >= 0) {
            const dist = Math.sqrt(delta) / Math.abs(2 * a);
            spread = Math.max(10, dist + 5);
        }
        const xMin = axis - spread;
        const xMax = axis + spread;

        const yMin = vertexY - 20;
        const yMax = vertexY + 20;

        const x = [], y = [];
        for (let i = xMin; i <= xMax; i += 0.1) {
            x.push(i);
            y.push(a * i * i + b * i + c);
        }

        Plotly.react('quad-plot-ineq', [{
            x, y, type: 'scatter', mode: 'lines', line: { color: delta < 0 ? (a > 0 ? 'green' : 'blue') : 'orange', width: 3 }
        }], {
            title: `f(x) = ${a}x² + ${b}x + ${c}`,
            margin: { t: 40, b: 30, l: 30, r: 20 },
            xaxis: { range: [xMin, xMax] },
            yaxis: { range: [yMin, yMax] },
            shapes: [
                { type: 'line', x0: xMin, y0: 0, x1: xMax, y1: 0, line: { color: 'black', width: 1 } }
            ]
        }, { displayModeBar: false });

        if (window.MathJax) MathJax.typesetPromise();
    }

    rngA.oninput = update;
    rngB.oninput = update;
    rngC.oninput = update;
    setTimeout(update, 100);
}

function renderQuadraticRootDist(container) {
    container.innerHTML = `
        <h3>9. 根的分布 (Root Distribution)</h3>
        <p>探究方程两根 $x_1, x_2$ 与常数 $k$ 的大小关系。</p>
        <div class="lab-row">
            <div class="lab-column" style="width:280px; flex-grow:0;">
                <div class="controls-section">
                    <label>a = <span id="val-ra">1</span> <input type="range" id="rng-ra" min="-10" max="10" step="0.1" value="1"></label>
                    <label>b = <span id="val-rb">-4</span> <input type="range" id="rng-rb" min="-20" max="20" step="0.1" value="-4"></label>
                    <label>c = <span id="val-rc">3</span> <input type="range" id="rng-rc" min="-50" max="50" step="0.1" value="3"></label>
                    <hr>
                    <label>k = <span id="val-rk">1</span> <input type="range" id="rng-rk" min="-10" max="10" step="0.1" value="1"></label>
                </div>
                <div class="info-card" style="margin-top:10px;">
                    <p><strong>Roots:</strong> <span id="root-dist-roots">1, 3</span></p>
                    <p><strong>f(k):</strong> <span id="root-dist-fk">0</span></p>
                    <p><strong>Symmetry Axis:</strong> <span id="root-dist-axis">2</span></p>
                    <p><strong>Condition Check:</strong><br>
                    <span id="root-dist-cond"></span></p>
                </div>
            </div>
            <div class="lab-column">
                <div id="quad-plot-dist" style="height:400px;"></div>
            </div>
        </div>
    `;

    const rngA = container.querySelector('#rng-ra');
    const rngB = container.querySelector('#rng-rb');
    const rngC = container.querySelector('#rng-rc');
    const rngK = container.querySelector('#rng-rk');

    function update() {
        let a = parseFloat(rngA.value);
        if (Math.abs(a) < 0.1) a = 0.1;
        const b = parseFloat(rngB.value);
        const c = parseFloat(rngC.value);
        const k = parseFloat(rngK.value);

        container.querySelector('#val-ra').innerText = a;
        container.querySelector('#val-rb').innerText = b;
        container.querySelector('#val-rc').innerText = c;
        container.querySelector('#val-rk').innerText = k;

        const f = x => a * x * x + b * x + c;
        const delta = b * b - 4 * a * c;
        const axis = -b / (2 * a);
        const fk = f(k);

        container.querySelector('#root-dist-fk').innerText = fk.toFixed(2);
        container.querySelector('#root-dist-axis').innerText = axis.toFixed(2);

        let roots = [];
        if (delta >= 0) {
            let x1 = (-b - Math.sqrt(delta)) / (2 * a);
            let x2 = (-b + Math.sqrt(delta)) / (2 * a);
            if (x1 > x2) [x1, x2] = [x2, x1];
            roots = [x1, x2];
            container.querySelector('#root-dist-roots').innerText = `${x1.toFixed(2)}, ${x2.toFixed(2)}`;
        } else {
            container.querySelector('#root-dist-roots').innerText = "无实根";
        }

        let condText = "";
        if (delta < 0) {
            condText = "无实根";
        } else {
            // Check relative to k
            // Case 1: Both > k
            if (roots[0] > k) condText = "两根都 > k";
            // Case 2: Both < k
            else if (roots[1] < k) condText = "两根都 < k";
            // Case 3: One < k < One
            else if (roots[0] < k && roots[1] > k) condText = "k 在两根之间";
            else if (roots[0] === k || roots[1] === k) condText = "k 是其中一根";
        }
        container.querySelector('#root-dist-cond').innerText = condText;

        // Plot
        let spread = 10;
        if (roots.length > 0) {
            const dist = Math.abs(roots[0] - axis);
            spread = Math.max(spread, dist + 5);
        }
        spread = Math.max(spread, Math.abs(k - axis) + 5);

        const xMin = axis - spread;
        const xMax = axis + spread;

        const vertexY = (4 * a * c - b * b) / (4 * a);
        const yMinDynamic = Math.min(-10, vertexY, fk) - 5;
        const yMaxDynamic = Math.max(10, vertexY, fk) + 5;

        const x = [], y = [];
        for (let i = xMin; i <= xMax; i += 0.1) {
            x.push(i);
            y.push(f(i));
        }

        const traces = [
            { x, y, type: 'scatter', mode: 'lines', line: { color: '#3b82f6' }, name: 'f(x)' },
            { x: [k, k], y: [yMinDynamic, yMaxDynamic], mode: 'lines', line: { dash: 'dash', color: 'purple' }, name: 'x=k' },
            { x: [k], y: [fk], mode: 'markers', marker: { color: 'purple', size: 8 } }
        ];

        if (roots.length > 0) {
            traces.push({ x: roots, y: [0, 0], mode: 'markers', marker: { color: 'red', size: 10 }, name: 'Roots' });
        }

        Plotly.react('quad-plot-dist', traces, {
            title: `f(x) 与 k=${k} 的位置关系`,
            margin: { t: 40, b: 30, l: 30, r: 20 },
            xaxis: { range: [xMin, xMax] },
            yaxis: { range: [yMinDynamic, yMaxDynamic] },
            shapes: [
                { type: 'line', x0: xMin, y0: 0, x1: xMax, y1: 0, line: { color: 'black', width: 1 } }
            ]
        }, { displayModeBar: false });

        if (window.MathJax) MathJax.typesetPromise();
    }

    rngA.oninput = update;
    rngB.oninput = update;
    rngC.oninput = update;
    rngK.oninput = update;
    setTimeout(update, 100);
}

// --- Logarithmic Equation & Inequality Lab ---

function initFunctionLogEqIneqLab(container) {
    container.innerHTML = `
        <div class="lab-header">
            <div class="lab-title">对数方程与不等式实验室</div>
            <div class="lab-tabs">
                <button class="lab-tab active" data-mod="concept">对数方程概念</button>
                <button class="lab-tab" data-mod="equations">对数方程解法</button>
                <button class="lab-tab" data-mod="inequalities">对数不等式</button>
            </div>
        </div>
        <div class="lab-content" id="log-lab-content"></div>
    `;

    const tabs = container.querySelectorAll('.lab-tab');
    const content = container.querySelector('#log-lab-content');

    function switchTab(mod) {
        tabs.forEach(t => t.classList.toggle('active', t.dataset.mod === mod));
        content.innerHTML = '';

        switch (mod) {
            case 'concept': renderLogEqConcept(content); break;
            case 'equations': renderLogEquations(content); break;
            case 'inequalities': renderLogInequalities(content); break;
        }
    }

    tabs.forEach(t => t.onclick = () => switchTab(t.dataset.mod));
    switchTab('concept');
}

function renderLogEqConcept(container) {
    container.innerHTML = `
        <div style="display:flex; height:100%; gap:20px; padding:20px;">
            <div class="lab-column" style="width:300px; flex-shrink:0;">
                <h3 style="margin-top:0; border-bottom:1px solid #eee; padding-bottom:10px;">对数方程概念</h3>
                <div class="formula-box">
                    $$ \\log_a x = b \\iff x = a^b $$
                </div>
                <p style="color:var(--muted); font-size:14px;">对数方程是指对数符号中含有未知数的方程。</p>
                
                <div class="controls-section">
                    <label>底数 a = <span id="val-la">2</span> <input type="range" id="rng-la" min="0.1" max="5" step="0.1" value="2"></label>
                    <label>值 b = <span id="val-lb">3</span> <input type="range" id="rng-lb" min="-3" max="5" step="0.5" value="3"></label>
                </div>
                
                <div class="info-card" style="margin-top:10px;">
                    <p><strong>指数形式:</strong> $$ x = a^b = <span id="res-base">2</span>^{<span id="res-exp">3</span>} $$</p>
                    <p><strong>计算结果:</strong> $$ x = <span id="res-val">8</span> $$</p>
                    <p><strong>验证:</strong> $$ \\log_{<span id="res-a">2</span>} <span id="res-x">8</span> = <span id="res-b">3</span> $$</p>
                </div>
            </div>
            
            <div class="lab-column" style="flex:1; display:flex; flex-direction:column;">
                <div id="log-concept-plot" style="flex:1;"></div>
            </div>
        </div>
    `;

    const rngA = container.querySelector('#rng-la');
    const rngB = container.querySelector('#rng-lb');

    function update() {
        let a = parseFloat(rngA.value);
        if (Math.abs(a - 1) < 0.1) a = 0.9; // Avoid a=1
        if (a <= 0) a = 0.1;

        const b = parseFloat(rngB.value);
        const xVal = Math.pow(a, b);

        container.querySelector('#val-la').innerText = a.toFixed(1);
        container.querySelector('#val-lb').innerText = b.toFixed(1);

        container.querySelector('#res-base').innerText = a.toFixed(1);
        container.querySelector('#res-exp').innerText = b.toFixed(1);
        container.querySelector('#res-val').innerText = xVal.toFixed(4);
        container.querySelector('#res-a').innerText = a.toFixed(1);
        container.querySelector('#res-x').innerText = xVal.toFixed(4);
        container.querySelector('#res-b').innerText = b.toFixed(1);

        // Plot y = log_a(x) and point (xVal, b)
        const xData = [], yData = [];
        for (let x = 0.01; x <= 10; x += 0.1) {
            xData.push(x);
            yData.push(Math.log(x) / Math.log(a));
        }

        const traces = [
            { x: xData, y: yData, mode: 'lines', name: `y=log_${a.toFixed(1)}(x)`, line: { color: '#3b82f6', width: 3 } },
            { x: [xVal], y: [b], mode: 'markers', name: '解', marker: { size: 10, color: 'red' } },
            { x: [0, xVal], y: [b, b], mode: 'lines', line: { dash: 'dash', color: 'gray' }, showlegend: false },
            { x: [xVal, xVal], y: [0, b], mode: 'lines', line: { dash: 'dash', color: 'gray' }, showlegend: false }
        ];

        Plotly.react('log-concept-plot', traces, {
            title: `y = \\log_{${a.toFixed(1)}} x`,
            margin: { t: 40, b: 30, l: 40, r: 20 },
            xaxis: { title: 'x', range: [0, 10] },
            yaxis: { title: 'y', range: [-5, 5] }
        }, { displayModeBar: false });

        if (window.MathJax) MathJax.typesetPromise();
    }

    rngA.oninput = update;
    rngB.oninput = update;
    setTimeout(update, 100);
}

function renderLogEquations(container) {
    container.innerHTML = `
        <div style="display:flex; height:100%; gap:20px; padding:20px;">
            <div class="lab-column" style="width:320px; flex-shrink:0;">
                <h3 style="margin-top:0; border-bottom:1px solid #eee; padding-bottom:10px;">对数方程解法</h3>
                <div style="margin-bottom:15px;">
                    <label>方程类型:</label>
                    <select id="eq-type" style="width:100%; padding:5px; margin-top:5px;">
                        <option value="type1">Type 1: log_a(x) = b</option>
                        <option value="type2">Type 2: log_a(f(x)) = log_a(g(x))</option>
                        <option value="type3">Type 3: A(log_a x)^2 + ... = 0</option>
                    </select>
                </div>
                
                <div id="eq-controls"></div>
                
                <div class="info-card" style="margin-top:10px;">
                    <div id="eq-steps"></div>
                </div>
            </div>
            
            <div class="lab-column" style="flex:1; display:flex; flex-direction:column;">
                <div id="eq-plot" style="flex:1;"></div>
            </div>
        </div>
    `;

    const typeSel = container.querySelector('#eq-type');
    const controlsDiv = container.querySelector('#eq-controls');
    const stepsDiv = container.querySelector('#eq-steps');

    function update() {
        const type = typeSel.value;
        controlsDiv.innerHTML = '';

        if (type === 'type1') {
            // Type 1: log_a(x) = b
            createControl(controlsDiv, 'a', 2, 0.1, 5, 0.1);
            createControl(controlsDiv, 'b', 3, -5, 5, 1);

            // Wait for DOM update
            setTimeout(() => solveType1(), 50);
        } else if (type === 'type2') {
            // Type 2: log_a(x+m) = log_a(nx+k)
            controlsDiv.innerHTML = '<p style="font-size:12px; color:gray;">形式: $\\log_a(x+m) = \\log_a(nx+k)$</p>';
            createControl(controlsDiv, 'a', 2, 0.1, 5, 0.1);
            createControl(controlsDiv, 'm', 2, -5, 5, 1);
            createControl(controlsDiv, 'n', 0.5, -2, 2, 0.5);
            createControl(controlsDiv, 'k', 4, -5, 5, 1);
            setTimeout(() => solveType2(), 50);
        } else if (type === 'type3') {
            // Type 3: Quadratic in log: A(log_a x)^2 + B(log_a x) + C = 0
            controlsDiv.innerHTML = '<p style="font-size:12px; color:gray;">形式: $A(\\log_a x)^2 + B(\\log_a x) + C = 0$</p>';
            createControl(controlsDiv, 'a', 2, 0.1, 5, 0.1);
            createControl(controlsDiv, 'A', 1, -5, 5, 1);
            createControl(controlsDiv, 'B', -3, -5, 5, 1);
            createControl(controlsDiv, 'C', 2, -5, 5, 1);
            setTimeout(() => solveType3(), 50);
        }
    }

    function solveType1() {
        const a = getVal('a') || 2;
        const b = getVal('b') || 3;
        const ans = Math.pow(a, b);

        stepsDiv.innerHTML = `
            <p><strong>方程:</strong> $$\\log_{${a}} x = ${b}$$</p>
            <p><strong>步骤 1:</strong> 将对数式转化为指数式</p>
            <p>$$ x = ${a}^{${b}} $$</p>
            <p><strong>步骤 2:</strong> 计算结果</p>
            <p>$$ x = ${ans.toFixed(4)} $$</p>
            <p><strong>检验:</strong> $x > 0$ 成立。</p>
        `;

        const xData = range(0.01, 10, 0.1);
        const yData = xData.map(x => Math.log(x) / Math.log(a));

        Plotly.react('eq-plot', [
            { x: xData, y: yData, name: `y=log_${a}x`, line: { color: 'blue' } },
            { x: [0, 10], y: [b, b], name: `y=${b}`, line: { dash: 'dash', color: 'green' } },
            { x: [ans], y: [b], mode: 'markers', marker: { color: 'red', size: 10 }, name: '解' }
        ], {
            title: `$\\log_{${a}} x = ${b}$`,
            xaxis: { range: [0, 10] }, yaxis: { range: [-5, 5] }
        }, { displayModeBar: false });

        MathJax.typesetPromise();
    }

    function solveType2() {
        const a = getVal('a') || 2;
        const m = getVal('m') || 2;
        const n = getVal('n') || 0.5;
        const k = getVal('k') || 4;

        // x + m = nx + k => (1-n)x = k-m
        const coeff = 1 - n;
        const constTerm = k - m;
        let xSol = null;
        let valid = false;

        let stepText = `<p><strong>方程:</strong> $$\\log_{${a}}(x${fmt(m)}) = \\log_{${a}}(${n}x${fmt(k)})$$</p>`;
        stepText += `<p><strong>步骤 1:</strong> 转化为代数方程</p>`;
        stepText += `<p>$$ x${fmt(m)} = ${n}x${fmt(k)} $$</p>`;

        if (Math.abs(coeff) < 0.001) {
            stepText += `<p>无解 (系数为0)</p>`;
        } else {
            xSol = constTerm / coeff;
            stepText += `<p><strong>步骤 2:</strong> 求解 $x$</p>`;
            stepText += `<p>$$ (${(1 - n).toFixed(2)})x = ${(k - m).toFixed(2)} \\implies x = ${xSol.toFixed(2)} $$</p>`;

            // Check domain
            const val1 = xSol + m;
            const val2 = n * xSol + k;
            stepText += `<p><strong>步骤 3:</strong> 检验真数大于0</p>`;
            stepText += `<p>Left: $${xSol.toFixed(2)}${fmt(m)} = ${val1.toFixed(2)}$</p>`;
            stepText += `<p>Right: $${n} \\cdot ${xSol.toFixed(2)}${fmt(k)} = ${val2.toFixed(2)}$</p>`;

            if (val1 > 0 && val2 > 0) {
                stepText += `<p style="color:green"><strong>有效解!</strong></p>`;
                valid = true;
            } else {
                stepText += `<p style="color:red"><strong>增根 (舍去)</strong> - 真数必须 > 0</p>`;
            }
        }

        stepsDiv.innerHTML = stepText;

        const xData = range(-10, 10, 0.1);
        const y1 = xData.map(x => (x + m) > 0 ? Math.log(x + m) / Math.log(a) : null);
        const y2 = xData.map(x => (n * x + k) > 0 ? Math.log(n * x + k) / Math.log(a) : null);

        const traces = [
            { x: xData, y: y1, name: `log(x${fmt(m)})`, line: { color: 'blue' } },
            { x: xData, y: y2, name: `log(${n}x${fmt(k)})`, line: { color: 'orange', dash: 'dot' } }
        ];

        if (valid && xSol !== null) {
            traces.push({ x: [xSol], y: [Math.log(xSol + m) / Math.log(a)], mode: 'markers', marker: { color: 'red', size: 10 }, name: '解' });
        }

        Plotly.react('eq-plot', traces, {
            xaxis: { range: [-10, 10] }, yaxis: { range: [-5, 5] }
        }, { displayModeBar: false });
        MathJax.typesetPromise();
    }

    function solveType3() {
        const a = getVal('a') || 2;
        const A = getVal('A') || 1;
        const B = getVal('B') || -3;
        const C = getVal('C') || 2;

        let stepText = `<p><strong>方程:</strong> $$ ${A}(\\log_{${a}}x)^2 ${fmt(B)}(\\log_{${a}}x) ${fmt(C)} = 0 $$</p>`;
        stepText += `<p><strong>步骤 1:</strong> 换元 $t = \\log_{${a}}x$</p>`;
        stepText += `<p>得到一元二次方程: $$ ${A}t^2 ${fmt(B)}t ${fmt(C)} = 0 $$</p>`;

        const delta = B * B - 4 * A * C;
        stepText += `<p><strong>步骤 2:</strong> 解关于 t 的方程 ($\\Delta = ${delta.toFixed(2)}$)</p>`;

        let t1, t2;
        let x1, x2;

        if (delta < 0) {
            stepText += `<p style="color:red">无实数解 ($\\Delta < 0$)</p>`;
            Plotly.react('eq-plot', [], {}, { displayModeBar: false });
        } else {
            t1 = (-B - Math.sqrt(delta)) / (2 * A);
            t2 = (-B + Math.sqrt(delta)) / (2 * A);
            stepText += `<p>$$ t_1 = ${t1.toFixed(2)}, \\quad t_2 = ${t2.toFixed(2)} $$</p>`;

            x1 = Math.pow(a, t1);
            x2 = Math.pow(a, t2);

            stepText += `<p><strong>步骤 3:</strong> 回代求 x ($x = a^t$)</p>`;
            stepText += `<p>$$ x_1 = ${a}^{${t1.toFixed(2)}} = ${x1.toFixed(4)} $$</p>`;
            if (Math.abs(t1 - t2) > 0.001) {
                stepText += `<p>$$ x_2 = ${a}^{${t2.toFixed(2)}} = ${x2.toFixed(4)} $$</p>`;
            }
        }
        stepsDiv.innerHTML = stepText;

        const xData = range(0.01, 10, 0.1);
        const yData = xData.map(x => {
            const logx = Math.log(x) / Math.log(a);
            return A * logx * logx + B * logx + C;
        });

        const traces = [
            { x: xData, y: yData, name: 'f(x)', line: { color: 'purple' } }
        ];
        if (delta >= 0) {
            traces.push({ x: [x1], y: [0], mode: 'markers', marker: { color: 'red', size: 10 }, name: 'x1' });
            if (Math.abs(t1 - t2) > 0.001) {
                traces.push({ x: [x2], y: [0], mode: 'markers', marker: { color: 'red', size: 10 }, name: 'x2' });
            }
        }
        Plotly.react('eq-plot', traces, {
            title: 'f(x) = A(log x)^2 + B(log x) + C',
            xaxis: { range: [0, 10] }, yaxis: { range: [-5, 5] },
            shapes: [{ type: 'line', x0: 0, y0: 0, x1: 10, y1: 0, line: { color: 'black', width: 1 } }]
        }, { displayModeBar: false });

        MathJax.typesetPromise();
    }

    // Helpers
    function createControl(parent, label, val, min, max, step) {
        const div = document.createElement('div');
        div.style.marginBottom = '5px';
        div.innerHTML = `
            <div style="display:flex; justify-content:space-between; font-size:12px;">
                <span>${label}</span>
                <span id="disp_eq_${label}">${val}</span>
            </div>
            <input type="range" id="rng_eq_${label}" min="${min}" max="${max}" step="${step}" value="${val}" style="width:100%;">
        `;
        parent.appendChild(div);
        div.querySelector('input').oninput = (e) => {
            div.querySelector(`#disp_eq_${label}`).innerText = e.target.value;
            if (typeSel.value === 'type1') solveType1();
            if (typeSel.value === 'type2') solveType2();
            if (typeSel.value === 'type3') solveType3();
        };
    }

    function getVal(label) {
        const el = container.querySelector(`#rng_eq_${label}`);
        return el ? parseFloat(el.value) : null;
    }

    function fmt(n) {
        return n >= 0 ? `+${n}` : `${n}`;
    }

    function range(start, end, step) {
        const arr = [];
        for (let i = start; i <= end; i += step) arr.push(i);
        return arr;
    }

    typeSel.onchange = update;
    update();
}

function renderLogInequalities(container) {
    container.innerHTML = `
        <div style="display:flex; height:100%; gap:20px; padding:20px;">
            <div class="lab-column" style="width:320px; flex-shrink:0;">
                <h3 style="margin-top:0; border-bottom:1px solid #eee; padding-bottom:10px;">对数不等式</h3>
                <div style="margin-bottom:15px;">
                    <label>不等式类型:</label>
                    <select id="ineq-type" style="width:100%; padding:5px; margin-top:5px;">
                        <option value="type1">Type I: log_a f(x) > log_a g(x)</option>
                        <option value="type2">Type II: F(log_a x) > 0</option>
                    </select>
                </div>
                
                <div id="ineq-controls"></div>
                
                <div class="info-card" style="margin-top:10px;">
                    <div id="ineq-steps"></div>
                </div>
            </div>
            
            <div class="lab-column" style="flex:1; display:flex; flex-direction:column;">
                <div id="ineq-plot" style="flex:1;"></div>
            </div>
        </div>
    `;

    const typeSel = container.querySelector('#ineq-type');
    const controlsDiv = container.querySelector('#ineq-controls');
    const stepsDiv = container.querySelector('#ineq-steps');

    function update() {
        const type = typeSel.value;
        controlsDiv.innerHTML = '';

        if (type === 'type1') {
            controlsDiv.innerHTML = '<p style="font-size:12px; color:gray;">形式: $\\log_a x > \\log_a (x+k)$ (示例)</p>';
            createControl(controlsDiv, 'a', 2, 0.1, 5, 0.1);
            createControl(controlsDiv, 'k', -2, -5, 5, 1);
            setTimeout(() => solveType1(), 50);
        } else if (type === 'type2') {
            controlsDiv.innerHTML = '<p style="font-size:12px; color:gray;">形式: $(\\log_a x)^2 - 2\\log_a x - 3 > 0$ (示例)</p>';
            createControl(controlsDiv, 'a', 2, 0.1, 5, 0.1);
            setTimeout(() => solveType2(), 50);
        }
    }

    function solveType1() {
        const a = getVal('a') || 2;
        const k = getVal('k') || -2;

        // Example: log_a(x) > log_a(x+k)
        // Domain: x > 0 AND x+k > 0
        const domainMin = Math.max(0, -k);

        let stepText = `<p><strong>不等式:</strong> $$\\log_{${a}} x > \\log_{${a}} (x${fmt(k)})$$</p>`;
        stepText += `<p><strong>步骤 1:</strong> 定义域</p>`;
        stepText += `<p>$$ x>0 \\text{ 且 } x${fmt(k)}>0 \\implies x > ${domainMin} $$</p>`;

        stepText += `<p><strong>步骤 2:</strong> 利用单调性脱去对数符号</p>`;

        let solText = "";
        let finalSet = "";

        if (a > 1) {
            stepText += `<p>因为 $a=${a} > 1$，函数单调递增，不等号方向<strong>不变</strong>。</p>`;
            stepText += `<p>$$ x > x${fmt(k)} \\implies 0 > ${k} $$</p>`;
            if (0 > k) {
                stepText += `<p>不等式恒成立 (在定义域内)</p>`;
                finalSet = `( ${domainMin}, +\\infty )`;
            } else {
                stepText += `<p>不等式无解 ($0$ 不大于 ${k})</p>`;
                finalSet = `\\emptyset`;
            }
        } else {
            stepText += `<p>因为 $0 < a=${a} < 1$，函数单调递减，不等号方向<strong>改变</strong>。</p>`;
            stepText += `<p>$$ x < x${fmt(k)} \\implies 0 < ${k} $$</p>`;
            if (0 < k) {
                stepText += `<p>不等式恒成立 (在定义域内)</p>`;
                finalSet = `( ${domainMin}, +\\infty )`;
            } else {
                stepText += `<p>不等式无解 ($0$ 不小于 ${k})</p>`;
                finalSet = `\\emptyset`;
            }
        }

        stepText += `<p><strong>结论:</strong> 解集为 $$ ${finalSet} $$</p>`;
        stepsDiv.innerHTML = stepText;

        // Plot
        const xData = range(domainMin + 0.1, 10, 0.1);
        const y1 = xData.map(x => Math.log(x) / Math.log(a));
        const y2 = xData.map(x => Math.log(x + k) / Math.log(a));

        Plotly.react('ineq-plot', [
            { x: xData, y: y1, name: 'log(x)', line: { color: 'blue' } },
            { x: xData, y: y2, name: `log(x${fmt(k)})`, line: { color: 'orange' } }
        ], {
            title: '不等式图像解法',
            xaxis: { range: [0, 10] }, yaxis: { range: [-5, 5] }
        }, { displayModeBar: false });

        MathJax.typesetPromise();
    }

    function solveType2() {
        const a = getVal('a') || 2;
        // Example: (log_a x)^2 - 2(log_a x) - 3 > 0
        // (t-3)(t+1) > 0 => t > 3 or t < -1

        let stepText = `<p><strong>不等式:</strong> $$(\\log_{${a}} x)^2 - 2\\log_{${a}} x - 3 > 0$$</p>`;
        stepText += `<p><strong>步骤 1:</strong> 换元 $t = \\log_{${a}}x$</p>`;
        stepText += `<p>$$ t^2 - 2t - 3 > 0 \\implies (t-3)(t+1) > 0 $$</p>`;
        stepText += `<p>解得: $t > 3$ 或 $t < -1$</p>`;

        stepText += `<p><strong>步骤 2:</strong> 回代求 x</p>`;
        stepText += `<p>$$ \\log_{${a}}x > 3 \\quad \\text{或} \\quad \\log_{${a}}x < -1 $$</p>`;

        if (a > 1) {
            const x1 = Math.pow(a, 3);
            const x2 = Math.pow(a, -1);
            stepText += `<p>因为 $a > 1$，单调递增:</p>`;
            stepText += `<p>$$ x > a^3 = ${x1.toFixed(2)} $$</p>`;
            stepText += `<p>$$ 0 < x < a^{-1} = ${x2.toFixed(4)} $$</p>`;
        } else {
            const x1 = Math.pow(a, 3);
            const x2 = Math.pow(a, -1);
            stepText += `<p>因为 $0 < a < 1$，单调递减 (不等号变向):</p>`;
            stepText += `<p>$$ 0 < x < a^3 = ${x1.toFixed(4)} $$</p>`;
            stepText += `<p>$$ x > a^{-1} = ${x2.toFixed(2)} $$</p>`;
        }

        stepsDiv.innerHTML = stepText;

        // Plot y = (log_a x)^2 - 2log_a x - 3
        const xData = range(0.01, 10, 0.1);
        const yData = xData.map(x => {
            const t = Math.log(x) / Math.log(a);
            return t * t - 2 * t - 3;
        });

        Plotly.react('ineq-plot', [
            { x: xData, y: yData, name: 'f(x)', line: { color: 'purple' } }
        ], {
            title: 'f(x) > 0 解集可视化',
            xaxis: { range: [0, 10] }, yaxis: { range: [-5, 5] },
            shapes: [{ type: 'line', x0: 0, y0: 0, x1: 10, y1: 0, line: { color: 'black', width: 1 } }]
        }, { displayModeBar: false });

        MathJax.typesetPromise();
    }

    function createControl(parent, label, val, min, max, step) {
        const div = document.createElement('div');
        div.style.marginBottom = '5px';
        div.innerHTML = `
            <div style="display:flex; justify-content:space-between; font-size:12px;">
                <span>${label}</span>
                <span id="disp_iq_${label}">${val}</span>
            </div>
            <input type="range" id="rng_iq_${label}" min="${min}" max="${max}" step="${step}" value="${val}" style="width:100%;">
        `;
        parent.appendChild(div);
        div.querySelector('input').oninput = (e) => {
            div.querySelector(`#disp_iq_${label}`).innerText = e.target.value;
            if (typeSel.value === 'type1') solveType1();
            if (typeSel.value === 'type2') solveType2();
        };
    }

    function getVal(label) {
        const el = container.querySelector(`#rng_iq_${label}`);
        return el ? parseFloat(el.value) : null;
    }

    function fmt(n) { return n >= 0 ? `+${n}` : `${n}`; }
    function range(start, end, step) {
        const arr = [];
        for (let i = start; i <= end; i += step) arr.push(i);
        return arr;
    }

    typeSel.onchange = update;
    update();
}


// --- Logarithmic Function Lab ---
function initFunctionLogLab(container) {
    container.innerHTML = `
        <div class="lab-container" style="display:flex; flex-direction:column; height:100%;">
            <div class="lab-tabs" style="display:flex; gap:5px; padding:10px; border-bottom:1px solid #ddd; background:#f5f5f5; overflow-x:auto;">
                <button class="lab-tab active" data-mod="convert">指数对数互化</button>
                <button class="lab-tab" data-mod="operations">对数运算</button>
                <button class="lab-tab" data-mod="special">特殊对数</button>
                <button class="lab-tab" data-mod="function">对数函数</button>
                <button class="lab-tab" data-mod="reciprocal">互为倒数底</button>
                <button class="lab-tab" data-mod="inverse_op">逆运算视角</button>
                <button class="lab-tab" data-mod="inverse_func">互为反函数</button>
            </div>
            <div id="lab-content" style="flex:1; position:relative; overflow:hidden;"></div>
        </div>
    `;

    const tabs = container.querySelectorAll('.lab-tab');
    const contentDiv = container.querySelector('#lab-content');

    function switchTab(mod) {
        tabs.forEach(t => t.classList.toggle('active', t.dataset.mod === mod));
        contentDiv.innerHTML = '';
        if (mod === 'convert') renderLogConvert(contentDiv);
        else if (mod === 'operations') renderLogOperations(contentDiv);
        else if (mod === 'special') renderSpecialLogs(contentDiv);
        else if (mod === 'function') renderLogFunction(contentDiv);
        else if (mod === 'reciprocal') renderReciprocalBases(contentDiv);
        else if (mod === 'inverse_op') renderInverseOp(contentDiv);
        else if (mod === 'inverse_func') renderInverseFunc(contentDiv);

        if (window.MathJax) MathJax.typesetPromise();
    }

    tabs.forEach(t => t.onclick = () => switchTab(t.dataset.mod));
    switchTab('convert');
}

function renderLogConvert(container) {
    container.innerHTML = `
        <div style="display:flex; height:100%; gap:20px; padding:20px;">
            <div class="lab-column" style="width:300px; flex-shrink:0;">
                <h3 style="margin-top:0;">指数式与对数式的互化</h3>
                <div class="formula-box">
                    $$ a^b = N \\iff \\log_a N = b $$
                </div>
                <div class="controls-section">
                    <label>底数 a = <span id="val-a">2</span> <input type="range" id="rng-a" min="0.1" max="5" step="0.1" value="2"></label>
                    <label>指数 b = <span id="val-b">3</span> <input type="range" id="rng-b" min="-2" max="4" step="0.1" value="3"></label>
                </div>
                <div class="info-card">
                    <p><strong>指数式:</strong> $$ <span id="disp-a1">2</span>^{<span id="disp-b1">3</span>} = <span id="disp-N1">8</span> $$</p>
                    <p><strong>对数式:</strong> $$ \\log_{<span id="disp-a2">2</span>} <span id="disp-N2">8</span> = <span id="disp-b2">3</span> $$</p>
                    <p>N = <span id="val-N">8.00</span></p>
                </div>
            </div>
            <div class="lab-column" style="flex:1;">
                <div id="plot-convert" style="width:100%; height:100%;"></div>
            </div>
        </div>
    `;

    const rngA = container.querySelector('#rng-a');
    const rngB = container.querySelector('#rng-b');

    function update() {
        let a = parseFloat(rngA.value);
        if (Math.abs(a - 1) < 0.1) a = 0.9; // Avoid a=1
        if (a <= 0) a = 0.1;
        const b = parseFloat(rngB.value);
        const N = Math.pow(a, b);

        container.querySelector('#val-a').innerText = a.toFixed(1);
        container.querySelector('#val-b').innerText = b.toFixed(1);
        container.querySelector('#val-N').innerText = N.toFixed(2);

        container.querySelector('#disp-a1').innerText = a.toFixed(1);
        container.querySelector('#disp-b1').innerText = b.toFixed(1);
        container.querySelector('#disp-N1').innerText = N.toFixed(2);

        container.querySelector('#disp-a2').innerText = a.toFixed(1);
        container.querySelector('#disp-N2').innerText = N.toFixed(2);
        container.querySelector('#disp-b2').innerText = b.toFixed(1);

        // Plot y = a^x
        const xData = [];
        const yData = [];
        for (let x = -3; x <= 5; x += 0.1) {
            xData.push(x);
            yData.push(Math.pow(a, x));
        }

        const traceExp = {
            x: xData, y: yData, type: 'scatter', mode: 'lines', name: `y=${a.toFixed(1)}^x`,
            line: { color: '#ef4444' }
        };

        const tracePoint = {
            x: [b], y: [N], type: 'scatter', mode: 'markers+text', name: `(b, N)`,
            marker: { size: 10, color: 'blue' },
            text: [`(${b.toFixed(1)}, ${N.toFixed(2)})`], textposition: 'top left'
        };

        const layout = {
            title: '指数函数视角: y = a^x',
            xaxis: { title: '指数 (b)', range: [-3, 5] },
            yaxis: { title: '幂 (N)', range: [0, 10] },
            margin: { t: 30, b: 30, l: 40, r: 20 }
        };

        Plotly.react('plot-convert', [traceExp, tracePoint], layout, { displayModeBar: false });
        if (window.MathJax) MathJax.typesetPromise();
    }

    rngA.oninput = update;
    rngB.oninput = update;
    setTimeout(update, 50);
}

function renderLogOperations(container) {
    container.innerHTML = `
        <div style="display:flex; height:100%; gap:20px; padding:20px;">
            <div class="lab-column" style="width:300px; flex-shrink:0;">
                <h3 style="margin-top:0;">对数运算性质</h3>
                <div style="margin-bottom:15px;">
                    <select id="op-select" style="width:100%; padding:5px;">
                        <option value="product">积的对数: log(MN) = log M + log N</option>
                        <option value="quotient">商的对数: log(M/N) = log M - log N</option>
                        <option value="power">幂的对数: log(M^k) = k log M</option>
                        <option value="base">换底公式: log_a b = log_c b / log_c a</option>
                    </select>
                </div>
                <div id="op-controls"></div>
                <div class="info-card" id="op-info"></div>
            </div>
            <div class="lab-column" style="flex:1;">
                <div id="plot-ops" style="width:100%; height:100%;"></div>
            </div>
        </div>
    `;

    const sel = container.querySelector('#op-select');
    const controls = container.querySelector('#op-controls');
    const info = container.querySelector('#op-info');

    // Local helper to create controls with event listener
    function addControl(parent, label, val, min, max, step) {
        const div = document.createElement('div');
        div.style.marginBottom = '12px';
        div.innerHTML = `
            <div style="display:flex; justify-content:space-between; margin-bottom:4px; font-size:12px; color:var(--muted);">
                <label>${label}</label>
                <span id="disp_${label}">${val}</span>
            </div>
            <input type="range" id="rng_${label}" min="${min}" max="${max}" step="${step}" value="${val}" style="width:100%; accent-color:var(--accent);">
        `;
        parent.appendChild(div);
        div.querySelector('input').oninput = (e) => {
            const v = parseFloat(e.target.value);
            div.querySelector('span').innerText = v;
            renderPlot(sel.value);
        };
    }

    function update() {
        const mode = sel.value;
        controls.innerHTML = '';
        info.innerHTML = '';

        addControl(controls, 'a', 2, 0.5, 5, 0.1);

        if (mode === 'product' || mode === 'quotient') {
            addControl(controls, 'M', 2, 0.5, 5, 0.1);
            addControl(controls, 'N', 3, 0.5, 5, 0.1);
        } else if (mode === 'power') {
            addControl(controls, 'M', 2, 0.5, 5, 0.1);
            addControl(controls, 'k', 2, -3, 3, 0.5);
        } else if (mode === 'base') {
            addControl(controls, 'b', 3, 0.5, 8, 0.1);
            addControl(controls, 'c', 10, 2, 10, 1);
        }

        setTimeout(() => renderPlot(mode), 50);
    }

    function renderPlot(mode) {
        const a = getVal('a') || 2;
        const xData = range(0.1, 10, 0.1);
        const traces = [];
        let layoutTitle = '';

        if (mode === 'product') {
            const M = getVal('M') || 2;
            const N = getVal('N') || 3;
            const MN = M * N;

            traces.push({ x: xData, y: xData.map(x => Math.log(x) / Math.log(a)), name: `y=log_${a}x` });
            traces.push({ x: [M], y: [Math.log(M) / Math.log(a)], mode: 'markers+text', text: ['M'], name: 'M' });
            traces.push({ x: [N], y: [Math.log(N) / Math.log(a)], mode: 'markers+text', text: ['N'], name: 'N' });
            if (MN <= 10) traces.push({ x: [MN], y: [Math.log(MN) / Math.log(a)], mode: 'markers+text', text: ['MN'], name: 'MN' });

            const valM = Math.log(M) / Math.log(a);
            const valN = Math.log(N) / Math.log(a);
            info.innerHTML = `
                <p>$\\log_{${a}} M = ${valM.toFixed(2)}$</p>
                <p>$\\log_{${a}} N = ${valN.toFixed(2)}$</p>
                <p>$\\log_{${a}} (MN) = ${(valM + valN).toFixed(2)}$</p>
                <p>Sum: ${valM.toFixed(2)} + ${valN.toFixed(2)} = ${(valM + valN).toFixed(2)}</p>
            `;
            layoutTitle = `$\\log_a(MN) = \\log_a M + \\log_a N$`;
        } else if (mode === 'quotient') {
            const M = getVal('M') || 2;
            const N = getVal('N') || 3;
            const MovN = M / N;

            traces.push({ x: xData, y: xData.map(x => Math.log(x) / Math.log(a)), name: `y=log_${a}x` });
            traces.push({ x: [M], y: [Math.log(M) / Math.log(a)], mode: 'markers+text', text: ['M'], name: 'M' });
            traces.push({ x: [N], y: [Math.log(N) / Math.log(a)], mode: 'markers+text', text: ['N'], name: 'N' });
            traces.push({ x: [MovN], y: [Math.log(MovN) / Math.log(a)], mode: 'markers+text', text: ['M/N'], name: 'M/N' });

            const valM = Math.log(M) / Math.log(a);
            const valN = Math.log(N) / Math.log(a);
            info.innerHTML = `
                <p>$\\log_{${a}} M = ${valM.toFixed(2)}$</p>
                <p>$\\log_{${a}} N = ${valN.toFixed(2)}$</p>
                <p>$\\log_{${a}} (M/N) = ${(valM - valN).toFixed(2)}$</p>
                <p>Diff: ${valM.toFixed(2)} - ${valN.toFixed(2)} = ${(valM - valN).toFixed(2)}</p>
            `;
            layoutTitle = `$\\log_a(M/N) = \\log_a M - \\log_a N$`;
        } else if (mode === 'power') {
            const M = getVal('M') || 2;
            const k = getVal('k') || 2;
            const valM = Math.log(M) / Math.log(a);
            const valMk = valM * k;

            traces.push({ x: xData, y: xData.map(x => Math.log(x) / Math.log(a)), name: `y=log_${a}x` });
            traces.push({ x: [M], y: [valM], mode: 'markers+text', text: ['M'], name: 'M' });

            info.innerHTML = `
                <p>$\\log_{${a}} M = ${valM.toFixed(2)}$</p>
                <p>$k \\cdot \\log_{${a}} M = ${k} \\cdot ${valM.toFixed(2)} = ${valMk.toFixed(2)}$</p>
             `;
            layoutTitle = `$\\log_a(M^k) = k \\log_a M$`;
        } else if (mode === 'base') {
            const b = getVal('b') || 3;
            const c = getVal('c') || 10;
            const valBaseA = Math.log(b) / Math.log(a);
            const valBaseC_b = Math.log(b) / Math.log(c);
            const valBaseC_a = Math.log(a) / Math.log(c);

            traces.push({ x: xData, y: xData.map(x => Math.log(x) / Math.log(a)), name: `y=log_${a}x` });
            traces.push({ x: xData, y: xData.map(x => Math.log(x) / Math.log(c) / valBaseC_a), name: `Formula`, line: { dash: 'dot' } });

            info.innerHTML = `
                <p>$\\log_{${a}} ${b} = ${valBaseA.toFixed(4)}$</p>
                <p>$\\log_{${c}} ${b} = ${valBaseC_b.toFixed(4)}$</p>
                <p>$\\log_{${c}} ${a} = ${valBaseC_a.toFixed(4)}$</p>
                <p>Ratio: ${valBaseC_b.toFixed(4)} / ${valBaseC_a.toFixed(4)} = ${(valBaseC_b / valBaseC_a).toFixed(4)}</p>
            `;
            layoutTitle = `$\\log_a b = \\frac{\\log_c b}{\\log_c a}$`;
        }

        Plotly.react('plot-ops', traces, {
            title: layoutTitle,
            xaxis: { range: [0, 10] }, yaxis: { range: [-3, 3] }
        }, { displayModeBar: false });
        if (window.MathJax) MathJax.typesetPromise();
    }

    sel.onchange = update;
    update();
}

function renderSpecialLogs(container) {
    container.innerHTML = `
        <div style="display:flex; height:100%; gap:20px; padding:20px;">
            <div class="lab-column" style="width:300px; flex-shrink:0;">
                <h3 style="margin-top:0;">两种特殊的对数</h3>
                <div class="formula-box">
                    <p>常用对数: $\\lg N = \\log_{10} N$</p>
                    <p>自然对数: $\\ln N = \\log_{e} N$ ($e \\approx 2.718$)</p>
                </div>
                <div class="controls-section">
                    <label>一般底数 a = <span id="val-a-spec">2</span> <input type="range" id="rng-a-spec" min="0.1" max="15" step="0.1" value="2"></label>
                </div>
                <div class="info-card">
                    <p>对比观察:</p>
                    <ul>
                        <li>$y = \\lg x$ (底数10, 增长最慢)</li>
                        <li>$y = \\ln x$ (底数e, 增长居中)</li>
                        <li>$y = \\log_a x$ (底数a, 可调)</li>
                    </ul>
                </div>
            </div>
            <div class="lab-column" style="flex:1;">
                <div id="plot-special" style="width:100%; height:100%;"></div>
            </div>
        </div>
    `;

    const rngA = container.querySelector('#rng-a-spec');

    function update() {
        let a = parseFloat(rngA.value);
        if (Math.abs(a - 1) < 0.1) a = 0.9;
        if (a <= 0) a = 0.1;
        container.querySelector('#val-a-spec').innerText = a.toFixed(1);

        const xData = range(0.1, 20, 0.1);
        const lgData = xData.map(x => Math.log10(x));
        const lnData = xData.map(x => Math.log(x));
        const logaData = xData.map(x => Math.log(x) / Math.log(a));

        const traces = [
            { x: xData, y: lgData, name: 'y=lg x', line: { color: 'blue' } },
            { x: xData, y: lnData, name: 'y=ln x', line: { color: 'green' } },
            { x: xData, y: logaData, name: `y=log_${a.toFixed(1)} x`, line: { color: 'red', dash: 'dash' } }
        ];

        Plotly.react('plot-special', traces, {
            title: '常用对数与自然对数',
            xaxis: { range: [0, 20] }, yaxis: { range: [-2, 3] }
        }, { displayModeBar: false });
        if (window.MathJax) MathJax.typesetPromise();
    }
    rngA.oninput = update;
    setTimeout(update, 50);
}

function renderLogFunction(container) {
    container.innerHTML = `
        <div style="display:flex; height:100%; gap:20px; padding:20px;">
            <div class="lab-column" style="width:300px; flex-shrink:0;">
                <h3 style="margin-top:0;">对数函数性质</h3>
                <div class="controls-section">
                    <label>底数 a = <span id="val-a-func">2</span> <input type="range" id="rng-a-func" min="0.1" max="5" step="0.1" value="2"></label>
                </div>
                <div class="info-card" id="func-info"></div>
            </div>
            <div class="lab-column" style="flex:1;">
                <div id="plot-func" style="width:100%; height:100%;"></div>
            </div>
        </div>
    `;

    const rngA = container.querySelector('#rng-a-func');
    const info = container.querySelector('#func-info');

    function update() {
        let a = parseFloat(rngA.value);
        if (Math.abs(a - 1) < 0.1) a = 0.9;
        if (a <= 0) a = 0.1;
        container.querySelector('#val-a-func').innerText = a.toFixed(1);

        const xData = range(0.01, 10, 0.05);
        const yData = xData.map(x => Math.log(x) / Math.log(a));

        const mono = a > 1 ? "增函数" : "减函数";
        info.innerHTML = `
            <p><strong>定义域:</strong> $(0, +\\infty)$</p>
            <p><strong>值域:</strong> $R$</p>
            <p><strong>定点:</strong> $(1, 0)$</p>
            <p><strong>单调性:</strong> ${mono} (a=${a.toFixed(1)})</p>
            <p><strong>渐近线:</strong> $x=0$ (y轴)</p>
        `;

        const traces = [
            { x: xData, y: yData, name: `y=log_${a.toFixed(1)} x` },
            { x: [1], y: [0], mode: 'markers', name: '定点(1,0)', marker: { size: 8, color: 'red' } },
            { x: [0, 0], y: [-10, 10], mode: 'lines', name: '渐近线', line: { dash: 'dot', color: 'grey' } }
        ];

        Plotly.react('plot-func', traces, {
            title: `对数函数 $y=\\log_{${a.toFixed(1)}} x$`,
            xaxis: { range: [-1, 10] }, yaxis: { range: [-5, 5] }
        }, { displayModeBar: false });
        if (window.MathJax) MathJax.typesetPromise();
    }
    rngA.oninput = update;
    setTimeout(update, 50);
}

function renderReciprocalBases(container) {
    container.innerHTML = `
        <div style="display:flex; height:100%; gap:20px; padding:20px;">
            <div class="lab-column" style="width:300px; flex-shrink:0;">
                <h3 style="margin-top:0;">底数互为倒数</h3>
                <div class="formula-box">
                    $$ \\log_{1/a} x = -\\log_a x $$
                </div>
                <div class="controls-section">
                    <label>底数 a = <span id="val-a-recip">2</span> <input type="range" id="rng-a-recip" min="0.1" max="5" step="0.1" value="2"></label>
                </div>
                <div class="info-card">
                    <p>观察发现：</p>
                    <p>函数 $y=\\log_a x$ 与 $y=\\log_{1/a} x$ 的图像关于 <strong>x轴</strong> 对称。</p>
                </div>
            </div>
            <div class="lab-column" style="flex:1;">
                <div id="plot-recip" style="width:100%; height:100%;"></div>
            </div>
        </div>
    `;

    const rngA = container.querySelector('#rng-a-recip');

    function update() {
        let a = parseFloat(rngA.value);
        if (Math.abs(a - 1) < 0.1) a = 0.9;
        if (a <= 0) a = 0.1;
        const a_inv = 1 / a;
        container.querySelector('#val-a-recip').innerText = a.toFixed(1);

        const xData = range(0.1, 10, 0.1);
        const yData1 = xData.map(x => Math.log(x) / Math.log(a));
        const yData2 = xData.map(x => Math.log(x) / Math.log(a_inv));

        const traces = [
            { x: xData, y: yData1, name: `y=log_${a.toFixed(1)} x` },
            { x: xData, y: yData2, name: `y=log_${a_inv.toFixed(2)} x` }
        ];

        Plotly.react('plot-recip', traces, {
            title: '底数互为倒数的图像关系',
            xaxis: { range: [-1, 10] }, yaxis: { range: [-5, 5] }
        }, { displayModeBar: false });
        if (window.MathJax) MathJax.typesetPromise();
    }
    rngA.oninput = update;
    setTimeout(update, 50);
}

function renderInverseOp(container) {
    container.innerHTML = `
        <div style="display:flex; height:100%; gap:20px; padding:20px;">
            <div class="lab-column" style="width:300px; flex-shrink:0;">
                <h3 style="margin-top:0;">对数运算作为逆运算</h3>
                <div class="formula-box">
                    $$ a^x = N \\implies x = \\log_a N $$
                </div>
                <div class="controls-section">
                    <label>底数 a = <span id="val-a-iop">2</span> <input type="range" id="rng-a-iop" min="0.1" max="5" step="0.1" value="2"></label>
                    <label>结果 N = <span id="val-N-iop">8</span> <input type="range" id="rng-N-iop" min="0.1" max="20" step="0.5" value="8"></label>
                </div>
                <div class="info-card">
                    <p><strong>方程:</strong> $2^x = 8$</p>
                    <p><strong>求解:</strong> $x = \\log_2 8 = 3$</p>
                </div>
            </div>
            <div class="lab-column" style="flex:1;">
                <div id="plot-iop" style="width:100%; height:100%;"></div>
            </div>
        </div>
    `;

    const rngA = container.querySelector('#rng-a-iop');
    const rngN = container.querySelector('#rng-N-iop');

    function update() {
        let a = parseFloat(rngA.value);
        if (Math.abs(a - 1) < 0.1) a = 0.9;
        if (a <= 0) a = 0.1;
        const N = parseFloat(rngN.value);
        const xVal = Math.log(N) / Math.log(a);

        container.querySelector('#val-a-iop').innerText = a.toFixed(1);
        container.querySelector('#val-N-iop').innerText = N.toFixed(1);
        container.querySelector('.info-card').innerHTML = `
            <p><strong>方程:</strong> $${a.toFixed(1)}^x = ${N.toFixed(1)}$</p>
            <p><strong>求解:</strong> $x = \\log_{${a.toFixed(1)}} ${N.toFixed(1)} \\approx ${xVal.toFixed(2)}$</p>
        `;

        const xData = [];
        const yData = [];
        for (let x = -5; x <= 5; x += 0.1) {
            xData.push(x);
            yData.push(Math.pow(a, x));
        }

        const traces = [
            { x: xData, y: yData, name: `y=${a.toFixed(1)}^x` },
            { x: [-5, 5], y: [N, N], mode: 'lines', name: `y=${N}`, line: { dash: 'dash', color: 'grey' } },
            { x: [xVal], y: [N], mode: 'markers', name: '解', marker: { size: 10, color: 'red' } }
        ];

        Plotly.react('plot-iop', traces, {
            title: `求解指数方程 $a^x=N$`,
            xaxis: { range: [-5, 5] }, yaxis: { range: [-2, 20] }
        }, { displayModeBar: false });
        if (window.MathJax) MathJax.typesetPromise();
    }
    rngA.oninput = update;
    rngN.oninput = update;
    setTimeout(update, 50);
}

function renderInverseFunc(container) {
    container.innerHTML = `
        <div style="display:flex; height:100%; gap:20px; padding:20px;">
            <div class="lab-column" style="width:300px; flex-shrink:0;">
                <h3 style="margin-top:0;">互为反函数</h3>
                <div class="formula-box">
                    $$ y = a^x \iff y = \\log_a x $$
                </div>
                <div class="controls-section">
                    <label>底数 a = <span id="val-a-ifunc">2</span> <input type="range" id="rng-a-ifunc" min="0.1" max="5" step="0.1" value="2"></label>
                </div>
                <div class="info-card">
                    <p>图像关于直线 $y=x$ 对称。</p>
                    <p>定义域与值域互换。</p>
                </div>
            </div>
            <div class="lab-column" style="flex:1;">
                <div id="plot-ifunc" style="width:100%; height:100%;"></div>
            </div>
        </div>
    `;

    const rngA = container.querySelector('#rng-a-ifunc');

    function update() {
        let a = parseFloat(rngA.value);
        if (Math.abs(a - 1) < 0.1) a = 0.9;
        if (a <= 0) a = 0.1;
        container.querySelector('#val-a-ifunc').innerText = a.toFixed(1);

        const xDataExp = range(-5, 5, 0.1);
        const yDataExp = xDataExp.map(x => Math.pow(a, x));

        const xDataLog = range(0.01, 10, 0.05);
        const yDataLog = xDataLog.map(x => Math.log(x) / Math.log(a));

        const traces = [
            { x: xDataExp, y: yDataExp, name: `y=${a.toFixed(1)}^x`, line: { color: 'red' } },
            { x: xDataLog, y: yDataLog, name: `y=log_${a.toFixed(1)} x`, line: { color: 'blue' } },
            { x: [-5, 10], y: [-5, 10], name: 'y=x', line: { dash: 'dot', color: 'grey' } }
        ];

        Plotly.react('plot-ifunc', traces, {
            title: '指数函数与对数函数的对称性',
            xaxis: { range: [-5, 10] }, yaxis: { range: [-5, 10], scaleanchor: "x" }
        }, { displayModeBar: false });
        if (window.MathJax) MathJax.typesetPromise();
    }
    rngA.oninput = update;
    setTimeout(update, 50);
}

// Helpers for Log Lab
function range(start, end, step) {
    const arr = [];
    for (let i = start; i <= end; i += step) arr.push(i);
    return arr;
}

function getVal(label) {
    const el = document.getElementById(`rng_${label}`);
    return el ? parseFloat(el.value) : null;
}

function initFunctionComplexLab(container) {
    container.innerHTML = `
        <div class="ineq-lab-container" style="flex-direction:column; height:100%; display:flex;">
            <div class="tab-bar">
                <div class="tab-btn active" data-tab="modulus">1. 模与纯虚数</div>
                <div class="tab-btn" data-tab="distance">2. 复数差的模</div>
                <div class="tab-btn" data-tab="modsq">3. 模平方关系</div>
                <div class="tab-btn" data-tab="conjugate">4. 实数共轭</div>
                <div class="tab-btn" data-tab="sqrtneg">5. 负数平方根</div>
                <div class="tab-btn" data-tab="cbrt">6. 实数立方根</div>
                <div class="tab-btn" data-tab="quad">7. 二次方程公式</div>
                <div class="tab-btn" data-tab="rootdiff">8. 两根之差模</div>
            </div>
            <div id="complex-lab-content" style="flex:1; overflow-y:auto; position:relative;"></div>
        </div>
    `;

    const tabs = container.querySelectorAll('.tab-btn');
    const content = container.querySelector('#complex-lab-content');

    function switchTab(tabId) {
        tabs.forEach(t => t.classList.remove('active'));
        const activeTab = Array.from(tabs).find(t => t.dataset.tab === tabId);
        if (activeTab) activeTab.classList.add('active');

        content.innerHTML = '';
        if (tabId === 'modulus') renderComplexModulus(content);
        else if (tabId === 'distance') renderComplexDistance(content);
        else if (tabId === 'modsq') renderComplexModulusSquared(content);
        else if (tabId === 'conjugate') renderComplexConjugate(content);
        else if (tabId === 'sqrtneg') renderComplexSqrtNeg(content);
        else if (tabId === 'cbrt') renderComplexCbrtReal(content);
        else if (tabId === 'quad') renderComplexQuadRoots(content);
        else if (tabId === 'rootdiff') renderComplexRootDiff(content);

        if (window.MathJax) MathJax.typesetPromise();
    }

    tabs.forEach(btn => {
        btn.onclick = () => switchTab(btn.dataset.tab);
    });

    // Default tab
    switchTab('modulus');
}

function renderComplexModulus(container) {
    container.innerHTML = `
        <div style="display:flex; height:100%; gap:20px; padding:20px;">
            <div class="lab-column" style="width:300px; flex-shrink:0;">
                <h3 style="margin-top:0;">1. 复数的模与纯虚数判定</h3>
                <div class="formula-box">
                    64585 |z| = \sqrt{a^2 + b^2} 64585
                    纯虚数条件: =0, b\neq 0$
                </div>
                <div class="controls-section">
                    <label>实部 a = <span id="val-ca">3</span> <input type="range" id="rng-ca" min="-5" max="5" step="0.5" value="3"></label>
                    <label>虚部 b = <span id="val-cb">4</span> <input type="range" id="rng-cb" min="-5" max="5" step="0.5" value="4"></label>
                </div>
                <div class="info-card">
                    <p><strong>复数 z:</strong> <span id="res-z">3 + 4i</span></p>
                    <p><strong>模长 |z|:</strong> <span id="res-mod">5</span></p>
                    <p><strong>类型:</strong> <span id="res-type">一般复数</span></p>
                </div>
            </div>
            <div class="lab-column" style="flex:1;">
                <div id="plot-complex-mod" style="width:100%; height:100%;"></div>
            </div>
        </div>
    `;

    const rngA = container.querySelector('#rng-ca');
    const rngB = container.querySelector('#rng-cb');

    function update() {
        const a = parseFloat(rngA.value);
        const b = parseFloat(rngB.value);
        container.querySelector('#val-ca').innerText = a;
        container.querySelector('#val-cb').innerText = b;

        const mod = Math.sqrt(a * a + b * b);
        let zStr = `${a}`;
        if (b >= 0) zStr += ` + ${b}i`;
        else zStr += ` - ${Math.abs(b)}i`;

        container.querySelector('#res-z').innerText = zStr;
        container.querySelector('#res-mod').innerText = mod.toFixed(2);

        let type = "一般复数";
        let typeColor = "black";
        if (a === 0 && b !== 0) {
            type = "纯虚数";
            typeColor = "purple";
        } else if (b === 0) {
            type = "实数";
            typeColor = "blue";
        } else if (a === 0 && b === 0) {
            type = "实数 (0)";
            typeColor = "blue";
        }
        const typeEl = container.querySelector('#res-type');
        typeEl.innerText = type;
        typeEl.style.color = typeColor;
        typeEl.style.fontWeight = "bold";

        const shapes = [
            { type: 'line', x0: 0, y0: 0, x1: a, y1: b, line: { color: 'black', width: 2 }, name: '|z|' },
            { type: 'line', x0: a, y0: 0, x1: a, y1: b, line: { color: 'gray', dash: 'dot' }, name: 'b' },
            { type: 'line', x0: 0, y0: 0, x1: a, y1: 0, line: { color: 'blue', width: 2 }, name: 'a' }
        ];

        const traces = [
            { x: [a], y: [b], mode: 'markers+text', marker: { size: 10, color: 'red' }, text: [zStr], textposition: 'top right', name: 'z' }
        ];

        Plotly.react('plot-complex-mod', traces, {
            title: '复平面 (Complex Plane)',
            xaxis: { range: [-6, 6], title: '实轴 (Re)' },
            yaxis: { range: [-6, 6], title: '虚轴 (Im)', scaleanchor: "x" },
            shapes: shapes
        }, { displayModeBar: false });
    }

    rngA.oninput = update;
    rngB.oninput = update;
    setTimeout(update, 50);
}

function renderComplexDistance(container) {
    container.innerHTML = `
        <div style="display:flex; height:100%; gap:20px; padding:20px;">
            <div class="lab-column" style="width:300px; flex-shrink:0;">
                <h3 style="margin-top:0;">2. 复数差的模 (距离)</h3>
                <div class="formula-box">
                    64585 |z_1 - z_2| = \sqrt{(a_1-a_2)^2 + (b_1-b_2)^2} 64585
                </div>
                <div class="controls-section">
                    <p><strong>点 Z1:</strong></p>
                    <label>a1 = <span id="val-a1">1</span> <input type="range" id="rng-a1" min="-5" max="5" step="0.5" value="1"></label>
                    <label>b1 = <span id="val-b1">1</span> <input type="range" id="rng-b1" min="-5" max="5" step="0.5" value="1"></label>
                    <hr>
                    <p><strong>点 Z2:</strong></p>
                    <label>a2 = <span id="val-a2">4</span> <input type="range" id="rng-a2" min="-5" max="5" step="0.5" value="4"></label>
                    <label>b2 = <span id="val-b2">5</span> <input type="range" id="rng-b2" min="-5" max="5" step="0.5" value="5"></label>
                </div>
                <div class="info-card">
                    <p><strong>距离 |z1 - z2|:</strong> <span id="res-dist">5</span></p>
                </div>
            </div>
            <div class="lab-column" style="flex:1;">
                <div id="plot-complex-dist" style="width:100%; height:100%;"></div>
            </div>
        </div>
    `;

    const inputs = ['a1', 'b1', 'a2', 'b2'].map(id => ({
        id, el: container.querySelector(`#rng-${id}`), disp: container.querySelector(`#val-${id}`)
    }));

    function update() {
        const vals = {};
        inputs.forEach(item => {
            vals[item.id] = parseFloat(item.el.value);
            item.disp.innerText = vals[item.id];
        });

        const dist = Math.sqrt(Math.pow(vals.a1 - vals.a2, 2) + Math.pow(vals.b1 - vals.b2, 2));
        container.querySelector('#res-dist').innerText = dist.toFixed(2);

        const traces = [
            { x: [vals.a1], y: [vals.b1], mode: 'markers+text', marker: { size: 10, color: 'blue' }, text: ['Z1'], textposition: 'bottom left', name: 'Z1' },
            { x: [vals.a2], y: [vals.b2], mode: 'markers+text', marker: { size: 10, color: 'green' }, text: ['Z2'], textposition: 'top right', name: 'Z2' },
            { x: [vals.a1, vals.a2], y: [vals.b1, vals.b2], mode: 'lines', line: { color: 'red', dash: 'dash' }, name: '距离' }
        ];

        Plotly.react('plot-complex-dist', traces, {
            title: '两点间距离',
            xaxis: { range: [-6, 6] },
            yaxis: { range: [-6, 6], scaleanchor: "x" }
        }, { displayModeBar: false });
    }

    inputs.forEach(i => i.el.oninput = update);
    setTimeout(update, 50);
}

// --- Trigonometric Function Lab ---

function initTrigFunctionLab(container) {
    container.innerHTML = `
        <div class="lab-header">
            <div class="lab-title">三角函数全景实验室</div>
            <div class="lab-tabs" style="overflow-x: auto; white-space: nowrap; padding-bottom: 5px;">
                <button class="lab-tab active" data-mod="basic">1. 基本图像与性质</button>
                <button class="lab-tab" data-mod="transform">2. 图像变换</button>
                <button class="lab-tab" data-mod="inverse">3. 反三角函数</button>
                <button class="lab-tab" data-mod="physics">4. 物理意义</button>
                <button class="lab-tab" data-mod="params">5. 参数影响</button>
                <button class="lab-tab" data-mod="equation">6. 三角方程</button>
                <button class="lab-tab" data-mod="properties">7. 奇偶周期对称</button>
                <button class="lab-tab" data-mod="advanced">8. 综合应用</button>
            </div>
        </div>
        <div class="lab-content" id="trig-func-lab-content" style="height: calc(100% - 60px); overflow-y: auto;"></div>
    `;

    const tabs = container.querySelectorAll('.lab-tab');
    const content = container.querySelector('#trig-func-lab-content');

    function switchTab(mod) {
        tabs.forEach(t => t.classList.toggle('active', t.dataset.mod === mod));
        content.innerHTML = '';

        switch (mod) {
            case 'basic': renderTrigFuncBasic(content); break;
            case 'transform': renderTrigFuncTransform(content); break;
            case 'inverse': renderTrigFuncInverse(content); break;
            case 'physics': renderTrigFuncPhysics(content); break;
            case 'params': renderTrigFuncParams(content); break;
            case 'equation': renderTrigFuncEquation(content); break;
            case 'properties': renderTrigFuncProperties(content); break;
            case 'advanced': renderTrigFuncAdvanced(content); break;
        }
    }

    tabs.forEach(t => t.addEventListener('click', () => switchTab(t.dataset.mod)));
    switchTab('basic');
}

function renderTrigFuncBasic(container) {
    container.innerHTML = `
        <div style="display: flex; height: 100%; gap: 20px; padding: 10px;">
            <div style="flex: 2; display: flex; flex-direction: column;">
                <div id="basic-plot" style="flex: 1; border: 1px solid #ddd; border-radius: 8px;"></div>
                <div style="margin-top: 10px; padding: 10px; background: #f8f9fa; border-radius: 8px;">
                    <div style="display: flex; gap: 20px; align-items: center; flex-wrap: wrap;">
                        <label><input type="checkbox" id="show-sin" checked> 正弦 y=sin(x)</label>
                        <label><input type="checkbox" id="show-cos"> 余弦 y=cos(x)</label>
                        <label><input type="checkbox" id="show-tan"> 正切 y=tan(x)</label>
                    </div>
                    <div style="margin-top: 10px; font-size: 0.9em; color: #666;">
                        勾选上方复选框以对比不同三角函数的图像。
                    </div>
                </div>
            </div>
            <div style="flex: 1; background: #fff; border-left: 1px solid #eee; padding-left: 15px; overflow-y: auto;">
                <h4>性质分析</h4>
                <div id="prop-info" class="info-card">
                    <!-- Dynamic Property Content -->
                </div>
            </div>
        </div>
    `;

    const checks = ['sin', 'cos', 'tan'].map(id => document.getElementById('show-' + id));

    function updatePlot() {
        const traces = [];
        const x = [];
        for (let i = -10; i <= 10; i += 0.1) x.push(i);

        if (document.getElementById('show-sin').checked) {
            traces.push({
                x: x, y: x.map(Math.sin),
                type: 'scatter', mode: 'lines', name: 'sin(x)', line: { color: 'red' }
            });
        }
        if (document.getElementById('show-cos').checked) {
            traces.push({
                x: x, y: x.map(Math.cos),
                type: 'scatter', mode: 'lines', name: 'cos(x)', line: { color: 'blue' }
            });
        }
        if (document.getElementById('show-tan').checked) {
            // Filter out asymptotes for tan
            const tanX = [], tanY = [];
            for (let i = -10; i <= 10; i += 0.05) {
                if (Math.abs(Math.cos(i)) > 0.1) {
                    tanX.push(i);
                    tanY.push(Math.tan(i));
                } else {
                    tanX.push(i);
                    tanY.push(null);
                }
            }
            traces.push({
                x: tanX, y: tanY,
                type: 'scatter', mode: 'lines', name: 'tan(x)', line: { color: 'orange' }
            });
        }

        Plotly.react('basic-plot', traces, {
            title: '三角函数基本图像',
            xaxis: { title: 'x (rad)' },
            yaxis: { title: 'y', range: [-2.5, 2.5] },
            margin: { t: 40, l: 40, r: 20, b: 40 }
        }, { displayModeBar: false });

        updateInfo();
    }

    function updateInfo() {
        const info = document.getElementById('prop-info');
        let html = '';
        if (document.getElementById('show-sin').checked) {
            html += `<h5>正弦函数 y=sin(x)</h5>
            <ul>
                <li>定义域: R</li>
                <li>值域: [-1, 1]</li>
                <li>周期: 2π</li>
                <li>奇偶性: 奇函数</li>
                <li>对称中心: (kπ, 0)</li>
            </ul>`;
        }
        if (document.getElementById('show-cos').checked) {
            html += `<h5>余弦函数 y=cos(x)</h5>
            <ul>
                <li>定义域: R</li>
                <li>值域: [-1, 1]</li>
                <li>周期: 2π</li>
                <li>奇偶性: 偶函数</li>
                <li>对称轴: x = kπ</li>
            </ul>`;
        }
        if (document.getElementById('show-tan').checked) {
            html += `<h5>正切函数 y=tan(x)</h5>
            <ul>
                <li>定义域: {x|x ≠ π/2 + kπ}</li>
                <li>值域: R</li>
                <li>周期: π</li>
                <li>奇偶性: 奇函数</li>
                <li>渐近线: x = π/2 + kπ</li>
            </ul>`;
        }
        if (html === '') html = '<p>请选择至少一个函数以查看性质。</p>';
        info.innerHTML = html;
    }

    checks.forEach(c => {
        if (c) c.addEventListener('change', updatePlot);
    });

    updatePlot();
}

function renderTrigFuncTransform(container) {
    container.innerHTML = `
        <div style="display: flex; height: 100%; gap: 20px; padding: 10px;">
            <div style="flex: 2; display: flex; flex-direction: column;">
                <div id="transform-plot" style="flex: 1; border: 1px solid #ddd; border-radius: 8px;"></div>
                <div style="margin-top: 10px; padding: 10px; background: #f8f9fa; border-radius: 8px;">
                    <div style="display:grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                        <label>振幅 A: <input type="range" id="param-A" min="0.5" max="3" step="0.1" value="1"> <span id="val-A">1.0</span></label>
                        <label>频率 ω: <input type="range" id="param-w" min="0.5" max="3" step="0.1" value="1"> <span id="val-w">1.0</span></label>
                        <label>初相 φ: <input type="range" id="param-p" min="-3.14" max="3.14" step="0.1" value="0"> <span id="val-p">0.0</span></label>
                        <label>偏置 k: <input type="range" id="param-k" min="-2" max="2" step="0.1" value="0"> <span id="val-k">0.0</span></label>
                    </div>
                </div>
            </div>
            <div style="flex: 1; background: #fff; border-left: 1px solid #eee; padding-left: 15px;">
                <h4>函数表达式</h4>
                <div class="math-box" style="font-size: 1.2em; text-align: center; margin: 20px 0;">
                    $$ y = A \\sin(\\omega x + \\phi) + k $$
                </div>
                <div class="formula-box">
                    <p>当前函数: <br> <span id="curr-func" style="font-weight:bold; color:blue;">y = sin(x)</span></p>
                </div>
                <h4>变换说明</h4>
                <ul>
                    <li><strong>A (振幅)</strong>: 纵向伸缩</li>
                    <li><strong>ω (频率)</strong>: 横向伸缩 (周期 T = 2π/ω)</li>
                    <li><strong>φ (初相)</strong>: 左右平移 (平移量 -φ/ω)</li>
                    <li><strong>k (偏置)</strong>: 上下平移</li>
                </ul>
            </div>
        </div>
    `;

    const inputs = ['A', 'w', 'p', 'k'].map(k => ({
        el: document.getElementById('param-' + k),
        val: document.getElementById('val-' + k),
        key: k
    }));

    function updatePlot() {
        const A = parseFloat(document.getElementById('param-A').value);
        const w = parseFloat(document.getElementById('param-w').value);
        const p = parseFloat(document.getElementById('param-p').value);
        const k = parseFloat(document.getElementById('param-k').value);

        inputs.forEach(i => i.val.textContent = document.getElementById('param-' + i.key).value);

        const x = [];
        const yBase = [];
        const yTrans = [];

        for (let i = -10; i <= 10; i += 0.05) {
            x.push(i);
            yBase.push(Math.sin(i));
            yTrans.push(A * Math.sin(w * i + p) + k);
        }

        const traces = [
            {
                x: x, y: yBase,
                type: 'scatter', mode: 'lines', name: 'y=sin(x)',
                line: { color: '#ccc', dash: 'dash' }
            },
            {
                x: x, y: yTrans,
                type: 'scatter', mode: 'lines', name: '变换后',
                line: { color: 'blue', width: 2 }
            }
        ];

        Plotly.react('transform-plot', traces, {
            title: '三角函数图像变换',
            xaxis: { title: 'x' },
            yaxis: { title: 'y', range: [-4, 4] },
            margin: { t: 40, l: 40, r: 20, b: 40 }
        }, { displayModeBar: false });

        // Update Text
        const pStr = p >= 0 ? `+ ${p.toFixed(1)}` : `- ${Math.abs(p).toFixed(1)}`;
        const kStr = k >= 0 ? `+ ${k.toFixed(1)}` : `- ${Math.abs(k).toFixed(1)}`;
        document.getElementById('curr-func').textContent = `y = ${A.toFixed(1)} sin(${w.toFixed(1)}x ${pStr}) ${kStr}`;

        if (window.MathJax) MathJax.typesetPromise([container.querySelector('.math-box')]);
    }

    inputs.forEach(i => i.el.addEventListener('input', updatePlot));
    updatePlot();
}

function renderTrigFuncInverse(container) {
    container.innerHTML = `
        <div style="display: flex; height: 100%; gap: 20px; padding: 10px;">
            <div style="flex: 2; display: flex; flex-direction: column;">
                <div id="inverse-plot" style="flex: 1; border: 1px solid #ddd; border-radius: 8px;"></div>
                <div style="margin-top: 10px; padding: 10px; background: #f8f9fa; border-radius: 8px;">
                    <div style="display: flex; gap: 20px; align-items: center;">
                        <label><input type="radio" name="inv-func" value="sin" checked> arcsin(x)</label>
                        <label><input type="radio" name="inv-func" value="cos"> arccos(x)</label>
                        <label><input type="radio" name="inv-func" value="tan"> arctan(x)</label>
                    </div>
                    <div style="margin-top: 5px;">
                        <label><input type="checkbox" id="show-orig" checked> 显示原函数 (限制定义域)</label>
                        <label><input type="checkbox" id="show-sym" checked> 显示 y=x 对称轴</label>
                    </div>
                </div>
            </div>
            <div style="flex: 1; background: #fff; border-left: 1px solid #eee; padding-left: 15px;">
                <h4>反三角函数性质</h4>
                <div id="inv-info" class="info-card"></div>
            </div>
        </div>
    `;

    function updatePlot() {
        const type = document.querySelector('input[name="inv-func"]:checked').value;
        const showOrig = document.getElementById('show-orig').checked;
        const showSym = document.getElementById('show-sym').checked;

        const traces = [];

        // y=x
        if (showSym) {
            traces.push({
                x: [-4, 4], y: [-4, 4],
                type: 'scatter', mode: 'lines', name: 'y=x',
                line: { color: '#ddd', dash: 'dash' }
            });
        }

        if (type === 'sin') {
            // arcsin: domain [-1, 1], range [-pi/2, pi/2]
            const x = [], y = [];
            for (let i = -1; i <= 1; i += 0.05) { x.push(i); y.push(Math.asin(i)); }
            traces.push({ x, y, type: 'scatter', mode: 'lines', name: 'y=arcsin(x)', line: { color: 'blue', width: 2 } });

            if (showOrig) {
                const ox = [], oy = [];
                for (let i = -Math.PI / 2; i <= Math.PI / 2; i += 0.05) { ox.push(Math.sin(i)); oy.push(i); } // Plot inverse as (sin(y), y) effectively
                // Wait, original is y = sin(x), so (x, sin(x))
                const origX = [], origY = [];
                for (let i = -Math.PI / 2; i <= Math.PI / 2; i += 0.05) { origX.push(i); origY.push(Math.sin(i)); }
                traces.push({ x: origX, y: origY, type: 'scatter', mode: 'lines', name: 'y=sin(x)', line: { color: 'red', width: 1 } });
            }
        } else if (type === 'cos') {
            // arccos: domain [-1, 1], range [0, pi]
            const x = [], y = [];
            for (let i = -1; i <= 1; i += 0.05) { x.push(i); y.push(Math.acos(i)); }
            traces.push({ x, y, type: 'scatter', mode: 'lines', name: 'y=arccos(x)', line: { color: 'blue', width: 2 } });

            if (showOrig) {
                const origX = [], origY = [];
                for (let i = 0; i <= Math.PI; i += 0.05) { origX.push(i); origY.push(Math.cos(i)); }
                traces.push({ x: origX, y: origY, type: 'scatter', mode: 'lines', name: 'y=cos(x)', line: { color: 'red', width: 1 } });
            }
        } else {
            // arctan: domain R, range (-pi/2, pi/2)
            const x = [], y = [];
            for (let i = -4; i <= 4; i += 0.1) { x.push(i); y.push(Math.atan(i)); }
            traces.push({ x, y, type: 'scatter', mode: 'lines', name: 'y=arctan(x)', line: { color: 'blue', width: 2 } });

            if (showOrig) {
                const origX = [], origY = [];
                for (let i = -1.5; i <= 1.5; i += 0.05) { origX.push(i); origY.push(Math.tan(i)); }
                traces.push({ x: origX, y: origY, type: 'scatter', mode: 'lines', name: 'y=tan(x)', line: { color: 'red', width: 1 } });
            }
        }

        Plotly.react('inverse-plot', traces, {
            title: '反三角函数与对称性',
            xaxis: { title: 'x', range: [-4, 4] },
            yaxis: { title: 'y', range: [-4, 4], scaleanchor: "x" },
            margin: { t: 40, l: 40, r: 20, b: 40 }
        }, { displayModeBar: false });

        // Update Info
        const info = document.getElementById('inv-info');
        if (type === 'sin') {
            info.innerHTML = `
                <h5>反正弦 y=arcsin(x)</h5>
                <ul>
                    <li>定义域: [-1, 1]</li>
                    <li>值域: [-π/2, π/2]</li>
                    <li>奇偶性: 奇函数</li>
                    <li>单调性: 单调递增</li>
                </ul>
            `;
        } else if (type === 'cos') {
            info.innerHTML = `
                <h5>反余弦 y=arccos(x)</h5>
                <ul>
                    <li>定义域: [-1, 1]</li>
                    <li>值域: [0, π]</li>
                    <li>奇偶性: 非奇非偶</li>
                    <li>单调性: 单调递减</li>
                </ul>
            `;
        } else {
            info.innerHTML = `
                <h5>反正切 y=arctan(x)</h5>
                <ul>
                    <li>定义域: R</li>
                    <li>值域: (-π/2, π/2)</li>
                    <li>奇偶性: 奇函数</li>
                    <li>单调性: 单调递增</li>
                </ul>
            `;
        }
    }

    container.querySelectorAll('input').forEach(el => el.addEventListener('change', updatePlot));
    updatePlot();
}

function renderTrigFuncPhysics(container) {
    container.innerHTML = `
        <div style="display: flex; height: 100%; gap: 20px; padding: 10px;">
            <div style="flex: 2; display: flex; flex-direction: column;">
                <div id="physics-plot" style="flex: 1; border: 1px solid #ddd; border-radius: 8px;"></div>
                <div style="margin-top: 10px; padding: 10px; background: #f8f9fa; border-radius: 8px;">
                    <div style="display: flex; gap: 20px;">
                        <button id="btn-anim-phy" style="padding: 5px 15px;">播放/暂停</button>
                        <label>频率: <input type="range" id="phy-w" min="0.5" max="3" step="0.1" value="1"></label>
                        <label>振幅: <input type="range" id="phy-A" min="0.5" max="2" step="0.1" value="1"></label>
                    </div>
                </div>
            </div>
            <div style="flex: 1; background: #fff; border-left: 1px solid #eee; padding-left: 15px;">
                <h4>简谐振动 (SHM)</h4>
                <div class="math-box">$$ y = A \\sin(\\omega t + \\phi) $$</div>
                <p>弹簧振子模型演示了三角函数在物理中的应用。</p>
                <ul>
                    <li><strong>平衡位置</strong>: y = 0</li>
                    <li><strong>最大位移</strong>: y = ±A</li>
                    <li><strong>周期</strong>: T = 2π/ω</li>
                </ul>
            </div>
        </div>
    `;

    let isPlaying = false;
    let t = 0;
    let animId;

    const plotEl = document.getElementById('physics-plot');

    function step() {
        if (!isPlaying) return;
        t += 0.05;
        updateFrame();
        animId = requestAnimationFrame(step);
    }

    function updateFrame() {
        const A = parseFloat(document.getElementById('phy-A').value);
        const w = parseFloat(document.getElementById('phy-w').value);

        // Spring visualization
        const yPos = A * Math.sin(w * t);

        // Time series data
        const timeX = [];
        const timeY = [];
        for (let i = 0; i < 100; i++) {
            const ti = t - i * 0.05;
            if (ti < 0) break;
            timeX.push(ti);
            timeY.push(A * Math.sin(w * ti));
        }

        const traces = [
            // Oscillator mass
            {
                x: [0], y: [yPos],
                mode: 'markers', marker: { size: 20, color: 'red' },
                name: '振子'
            },
            // Spring line (schematic)
            {
                x: [0, 0], y: [2, yPos],
                mode: 'lines', line: { color: 'black', width: 2 },
                name: '弹簧'
            },
            // Wave trace (shifting time to show history to the right, or static window)
            // Let's make it a scrolling window: current time at right edge?
            // Or simple x-t graph on the side. 
            // Let's put x-t graph on x-axis [1, 5]
            {
                x: timeX.map(v => (t - v) + 1), // Shift so t is at 1
                y: timeY,
                mode: 'lines', line: { color: 'blue' },
                name: '位移-时间'
            }
        ];

        Plotly.react('physics-plot', traces, {
            title: '简谐振动模拟',
            xaxis: { range: [-1, 6], title: '空间位置 / 时间推移' },
            yaxis: { range: [-2.5, 2.5], title: '位移 y' },
            margin: { t: 40, l: 40, r: 20, b: 40 },
            showlegend: false
        }, { displayModeBar: false });
    }

    document.getElementById('btn-anim-phy').onclick = () => {
        isPlaying = !isPlaying;
        if (isPlaying) step();
        else cancelAnimationFrame(animId);
    };

    document.getElementById('phy-w').oninput = updateFrame;
    document.getElementById('phy-A').oninput = updateFrame;

    updateFrame();
}

function renderTrigFuncParams(container) {
    container.innerHTML = `
        <div style="display: flex; height: 100%; gap: 20px; padding: 10px;">
            <div style="flex: 2; display: flex; flex-direction: column;">
                <div id="params-plot" style="flex: 1; border: 1px solid #ddd; border-radius: 8px;"></div>
                <div style="margin-top: 10px; padding: 10px; background: #f8f9fa; border-radius: 8px;">
                     <p>拖动滑块观察参数对 $y = A \\sin(\\omega x + \\phi) + k$ 的影响</p>
                     <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                        <label>A (振幅): <input type="range" id="mp-A" min="0.5" max="3" step="0.1" value="1"></label>
                        <label>ω (频率): <input type="range" id="mp-w" min="0.5" max="3" step="0.1" value="1"></label>
                        <label>φ (相位): <input type="range" id="mp-p" min="-3.14" max="3.14" step="0.1" value="0"></label>
                        <label>k (偏置): <input type="range" id="mp-k" min="-2" max="2" step="0.1" value="0"></label>
                     </div>
                </div>
            </div>
             <div style="flex: 1; background: #fff; border-left: 1px solid #eee; padding-left: 15px;">
                <h4>参数分析</h4>
                <div id="param-analysis">
                    <p><strong>当前状态:</strong></p>
                    <ul id="param-list"></ul>
                </div>
            </div>
        </div>
    `;

    function update() {
        const A = parseFloat(document.getElementById('mp-A').value);
        const w = parseFloat(document.getElementById('mp-w').value);
        const p = parseFloat(document.getElementById('mp-p').value);
        const k = parseFloat(document.getElementById('mp-k').value);

        const x = [], y = [];
        for (let i = -10; i <= 10; i += 0.05) {
            x.push(i);
            y.push(A * Math.sin(w * i + p) + k);
        }

        Plotly.react('params-plot', [{ x, y, type: 'scatter', line: { color: 'purple' } }], {
            title: '多参数组合影响',
            xaxis: { title: 'x' }, yaxis: { title: 'y', range: [-5, 5] },
            margin: { t: 40, l: 40, r: 20, b: 40 }
        }, { displayModeBar: false });

        const list = document.getElementById('param-list');
        list.innerHTML = `
            <li>振幅 A = ${A} (值域 [${(k - A).toFixed(1)}, ${(k + A).toFixed(1)}])</li>
            <li>频率 ω = ${w} (周期 T = ${(2 * Math.PI / w).toFixed(2)})</li>
            <li>初相 φ = ${p} (左移 ${(-p / w).toFixed(2)})</li>
            <li>偏置 k = ${k} (平衡位置 y=${k})</li>
        `;

        if (window.MathJax) MathJax.typesetPromise([container]);
    }

    container.querySelectorAll('input').forEach(el => el.addEventListener('input', update));
    update();
}

function renderTrigFuncEquation(container) {
    container.innerHTML = `
        <div style="display: flex; height: 100%; gap: 20px; padding: 10px;">
            <div style="flex: 2; display: flex; flex-direction: column;">
                <div id="equation-plot" style="flex: 1; border: 1px solid #ddd; border-radius: 8px;"></div>
                <div style="margin-top: 10px; padding: 10px; background: #f8f9fa; border-radius: 8px;">
                     <div style="display: flex; gap: 20px; align-items: center;">
                        <label><input type="radio" name="eq-type" value="sin" checked> sin(x) = a</label>
                        <label><input type="radio" name="eq-type" value="cos"> cos(x) = a</label>
                        <label><input type="radio" name="eq-type" value="tan"> tan(x) = a</label>
                        <label>a = <span id="eq-val-a">0.5</span> <input type="range" id="eq-a" min="-2" max="2" step="0.1" value="0.5"></label>
                     </div>
                </div>
            </div>
            <div style="flex: 1; background: #fff; border-left: 1px solid #eee; padding-left: 15px;">
                <h4>方程解集</h4>
                <div class="math-box" id="eq-formula"></div>
                <div id="eq-solutions"></div>
            </div>
        </div>
    `;

    function update() {
        const type = document.querySelector('input[name="eq-type"]:checked').value;
        const a = parseFloat(document.getElementById('eq-a').value);
        document.getElementById('eq-val-a').innerText = a;

        const x = [], y = [];
        const traces = [];

        // Plot function
        if (type === 'sin') {
            for (let i = -10; i <= 10; i += 0.1) { x.push(i); y.push(Math.sin(i)); }
            traces.push({ x, y, type: 'scatter', mode: 'lines', name: 'sin(x)', line: { color: 'blue' } });
        } else if (type === 'cos') {
            for (let i = -10; i <= 10; i += 0.1) { x.push(i); y.push(Math.cos(i)); }
            traces.push({ x, y, type: 'scatter', mode: 'lines', name: 'cos(x)', line: { color: 'blue' } });
        } else {
            const tx = [], ty = [];
            for (let i = -10; i <= 10; i += 0.05) {
                if (Math.abs(Math.cos(i)) > 0.1) { tx.push(i); ty.push(Math.tan(i)); }
                else { tx.push(i); ty.push(null); }
            }
            traces.push({ x: tx, y: ty, type: 'scatter', mode: 'lines', name: 'tan(x)', line: { color: 'blue' } });
        }

        // Plot line y=a
        traces.push({
            x: [-10, 10], y: [a, a],
            type: 'scatter', mode: 'lines', name: 'y=a',
            line: { color: 'red', dash: 'dash' }
        });

        // Find intersections
        const solutions = [];
        if (type === 'sin' || type === 'cos') {
            if (Math.abs(a) <= 1) {
                // Find primary solutions in [-pi, pi] or [0, 2pi]
                // Let's just find in [-3pi, 3pi] numerically or analytically
                const period = 2 * Math.PI;
                let base1, base2;
                if (type === 'sin') {
                    base1 = Math.asin(a);
                    base2 = Math.PI - base1;
                } else {
                    base1 = Math.acos(a);
                    base2 = -base1;
                }

                for (let k = -2; k <= 2; k++) {
                    solutions.push(base1 + k * period);
                    solutions.push(base2 + k * period);
                }
            }
        } else {
            // tan
            const base = Math.atan(a);
            for (let k = -3; k <= 3; k++) {
                solutions.push(base + k * Math.PI);
            }
        }

        if (solutions.length > 0) {
            traces.push({
                x: solutions,
                y: solutions.map(() => a),
                type: 'scatter', mode: 'markers',
                marker: { size: 8, color: 'green' },
                name: '解'
            });
        }

        Plotly.react('equation-plot', traces, {
            title: `${type}(x) = ${a}`,
            xaxis: { title: 'x' }, yaxis: { title: 'y', range: [-3, 3] },
            margin: { t: 40, l: 40, r: 20, b: 40 }
        }, { displayModeBar: false });

        // Update Info
        const formulaBox = document.getElementById('eq-formula');
        const solBox = document.getElementById('eq-solutions');

        if ((type === 'sin' || type === 'cos') && Math.abs(a) > 1) {
            formulaBox.innerHTML = '$$ \\text{无解 } (|a| > 1) $$';
            solBox.innerHTML = '<p>直线与曲线无交点。</p>';
        } else {
            if (type === 'sin') {
                formulaBox.innerHTML = `$$ x = k\\pi + (-1)^k \\arcsin(${a}) $$`;
            } else if (type === 'cos') {
                formulaBox.innerHTML = `$$ x = 2k\\pi \\pm \\arccos(${a}) $$`;
            } else {
                formulaBox.innerHTML = `$$ x = k\\pi + \\arctan(${a}) $$`;
            }
            solBox.innerHTML = `<ul>${solutions.filter(s => s >= -10 && s <= 10).sort((a, b) => a - b).map(s => `<li>x ≈ ${s.toFixed(3)}</li>`).join('')}</ul>`;
        }

        if (window.MathJax) MathJax.typesetPromise([container]);
    }

    container.querySelectorAll('input').forEach(el => el.addEventListener('input', update));
    update();
}

function renderTrigFuncProperties(container) {
    container.innerHTML = `
        <div style="display: flex; height: 100%; gap: 20px; padding: 10px;">
            <div style="flex: 2; display: flex; flex-direction: column;">
                <div id="prop-viz-plot" style="flex: 1; border: 1px solid #ddd; border-radius: 8px;"></div>
                <div style="margin-top: 10px; padding: 10px; background: #f8f9fa; border-radius: 8px;">
                    <div style="display: flex; gap: 20px; align-items: center;">
                         <label><input type="radio" name="prop-view" value="parity" checked> 奇偶性</label>
                         <label><input type="radio" name="prop-view" value="period"> 周期性</label>
                         <label><input type="radio" name="prop-view" value="symmetry"> 对称性</label>
                    </div>
                </div>
            </div>
            <div style="flex: 1; background: #fff; border-left: 1px solid #eee; padding-left: 15px;">
                <h4>性质可视化</h4>
                <div id="prop-desc"></div>
            </div>
        </div>
    `;

    function update() {
        const view = document.querySelector('input[name="prop-view"]:checked').value;
        const traces = [];
        const layout = {
            xaxis: { title: 'x' }, yaxis: { title: 'y' },
            margin: { t: 40, l: 40, r: 20, b: 40 }
        };
        let desc = '';

        if (view === 'parity') {
            // Visualize Odd/Even
            // Show cos (even) and sin (odd)
            const x = []; for (let i = -Math.PI; i <= Math.PI; i += 0.1) x.push(i);

            traces.push({
                x, y: x.map(Math.cos), type: 'scatter', mode: 'lines', name: '偶: cos(x)',
                line: { color: 'blue' }
            });
            traces.push({
                x, y: x.map(Math.sin), type: 'scatter', mode: 'lines', name: '奇: sin(x)',
                line: { color: 'red' }
            });

            // Add arrows or points to show f(-x) = f(x) vs f(-x) = -f(x)
            const pt = 2;
            traces.push({ x: [pt, -pt], y: [Math.cos(pt), Math.cos(-pt)], mode: 'markers+lines', name: '偶对称', line: { dash: 'dot' } });
            traces.push({ x: [pt, -pt], y: [Math.sin(pt), Math.sin(-pt)], mode: 'markers+lines', name: '奇对称', line: { dash: 'dot' } });

            desc = `
                <h5>奇偶性</h5>
                <p><strong>偶函数 (Even):</strong> f(-x) = f(x)，图像关于 y 轴对称 (如 cos x)。</p>
                <p><strong>奇函数 (Odd):</strong> f(-x) = -f(x)，图像关于原点对称 (如 sin x, tan x)。</p>
            `;
            layout.title = '奇偶性对比';
        } else if (view === 'period') {
            const x = []; for (let i = 0; i <= 4 * Math.PI; i += 0.1) x.push(i);
            traces.push({
                x, y: x.map(Math.sin), type: 'scatter', mode: 'lines', name: 'sin(x)',
                line: { color: 'red' }
            });

            // Mark periods
            for (let k = 0; k <= 2; k++) {
                traces.push({
                    x: [k * 2 * Math.PI, (k + 1) * 2 * Math.PI], y: [1.1, 1.1],
                    mode: 'lines+text', text: ['T', ''], textposition: 'top center',
                    line: { color: 'black', width: 2 }, showlegend: false
                });
                traces.push({
                    x: [k * 2 * Math.PI, k * 2 * Math.PI], y: [0, 1.1],
                    mode: 'lines', line: { dash: 'dot', color: 'gray' }, showlegend: false
                });
            }

            desc = `
                <h5>周期性</h5>
                <p><strong>周期 (Period):</strong> f(x+T) = f(x)。</p>
                <p>sin x 和 cos x 的最小正周期为 2π。</p>
                <p>tan x 的最小正周期为 π。</p>
            `;
            layout.title = '周期性演示';
        } else {
            // Symmetry
            const x = []; for (let i = -Math.PI; i <= 3 * Math.PI; i += 0.1) x.push(i);
            traces.push({
                x, y: x.map(Math.sin), type: 'scatter', mode: 'lines', name: 'sin(x)',
                line: { color: 'red' }
            });

            // Symmetry Axes
            [0.5 * Math.PI, 1.5 * Math.PI, 2.5 * Math.PI].forEach(ax => {
                traces.push({
                    x: [ax, ax], y: [-1.5, 1.5], mode: 'lines',
                    line: { color: 'green', dash: 'dash' }, name: '对称轴'
                });
            });

            // Symmetry Centers
            [0, Math.PI, 2 * Math.PI, 3 * Math.PI].forEach(cx => {
                traces.push({
                    x: [cx], y: [0], mode: 'markers',
                    marker: { color: 'purple', size: 8 }, name: '对称中心'
                });
            });

            desc = `
                <h5>对称性</h5>
                <p><strong>对称轴:</strong> 经过最值点的垂线 (x = kπ + π/2 对于 sin)。</p>
                <p><strong>对称中心:</strong> 图像与 x 轴的交点 ((kπ, 0) 对于 sin)。</p>
            `;
            layout.title = '对称性分析';
        }

        Plotly.react('prop-viz-plot', traces, layout, { displayModeBar: false });
        document.getElementById('prop-desc').innerHTML = desc;
    }

    container.querySelectorAll('input').forEach(el => el.addEventListener('change', update));
    update();
}

function renderTrigFuncAdvanced(container) {
    container.innerHTML = `
        <div style="display: flex; height: 100%; gap: 20px; padding: 10px;">
            <div style="flex: 2; display: flex; flex-direction: column;">
                <div id="adv-plot" style="flex: 1; border: 1px solid #ddd; border-radius: 8px;"></div>
                <div style="margin-top: 10px; padding: 10px; background: #f8f9fa; border-radius: 8px;">
                    <p>波形合成: y = sin(x) + A sin(ωx)</p>
                    <div style="display: flex; gap: 20px;">
                        <label>谐波振幅 A: <input type="range" id="adv-A" min="0" max="1" step="0.1" value="0.5"></label>
                        <label>谐波频率 ω: <input type="range" id="adv-w" min="1" max="10" step="1" value="3"></label>
                    </div>
                </div>
            </div>
            <div style="flex: 1; background: #fff; border-left: 1px solid #eee; padding-left: 15px;">
                <h4>综合应用：傅里叶级数初步</h4>
                <div class="math-box">$$ f(x) = \\sin(x) + A \\sin(\\omega x) $$</div>
                <p>通过叠加不同频率的正弦波，可以合成复杂的波形。</p>
                <p>这是信号处理和频谱分析的基础。</p>
            </div>
        </div>
    `;

    function update() {
        const A = parseFloat(document.getElementById('adv-A').value);
        const w = parseFloat(document.getElementById('adv-w').value);

        const x = [], y = [], y1 = [], y2 = [];
        for (let i = 0; i <= 4 * Math.PI; i += 0.05) {
            x.push(i);
            const v1 = Math.sin(i);
            const v2 = A * Math.sin(w * i);
            y1.push(v1);
            y2.push(v2);
            y.push(v1 + v2);
        }

        const traces = [
            { x, y: y1, mode: 'lines', name: '基波 sin(x)', line: { color: 'blue', width: 1, dash: 'dot' } },
            { x, y: y2, mode: 'lines', name: `谐波 ${A}sin(${w}x)`, line: { color: 'green', width: 1, dash: 'dot' } },
            { x, y, mode: 'lines', name: '合成波形', line: { color: 'red', width: 2 } }
        ];

        Plotly.react('adv-plot', traces, {
            title: '波形合成',
            xaxis: { title: 'x' }, yaxis: { title: 'y' },
            margin: { t: 40, l: 40, r: 20, b: 40 }
        }, { displayModeBar: false });

        if (window.MathJax) MathJax.typesetPromise([container]);
    }

    container.querySelectorAll('input').forEach(el => el.addEventListener('input', update));
    update();
}

// --- Trigonometric Ratio Lab ---
function initTrigRatioLab(container) {
    container.innerHTML = `
        <div class="lab-header">
            <div class="lab-title">三角比可视化实验室</div>
            <div class="lab-tabs" style="overflow-x: auto; white-space: nowrap; padding-bottom: 5px;">
                <button class="lab-tab active" data-mod="radian">1. 弧度与单位圆</button>
                <button class="lab-tab" data-mod="definition">2. 定义与几何意义</button>
                <button class="lab-tab" data-mod="identity">3. 同角三角比</button>
                <button class="lab-tab" data-mod="formula">4. 和差倍半公式</button>
                <button class="lab-tab" data-mod="induced">5. 诱导公式</button>
                <button class="lab-tab" data-mod="triangle">6. 正余弦定理</button>
                <button class="lab-tab" data-mod="properties">7. 三角形性质</button>
                <button class="lab-tab" data-mod="advanced">8. 综合应用</button>
            </div>
        </div>
        <div class="lab-content" id="trig-lab-content" style="height: calc(100% - 60px); overflow-y: auto;"></div>
    `;

    const tabs = container.querySelectorAll('.lab-tab');
    const content = container.querySelector('#trig-lab-content');

    function switchTab(mod) {
        tabs.forEach(t => t.classList.toggle('active', t.dataset.mod === mod));
        content.innerHTML = '';

        switch (mod) {
            case 'radian': renderTrigRadian(content); break;
            case 'definition': renderTrigDefinition(content); break;
            case 'identity': renderTrigIdentity(content); break;
            case 'formula': renderTrigFormula(content); break;
            case 'induced': renderTrigInduced(content); break;
            case 'triangle': renderTrigTriangle(content); break;
            case 'properties': renderTrigProperties(content); break;
            case 'advanced': renderTrigAdvanced(content); break;
        }
    }

    tabs.forEach(t => t.addEventListener('click', () => switchTab(t.dataset.mod)));
    switchTab('radian');
}

function renderTrigRadian(container) {
    container.innerHTML = `
        <div style="display: flex; height: 100%; gap: 20px; padding: 10px;">
            <div style="flex: 2; display: flex; flex-direction: column;">
                <div id="radian-plot" style="flex: 1; border: 1px solid #ddd; border-radius: 8px;"></div>
                <div style="margin-top: 10px; padding: 10px; background: #f8f9fa; border-radius: 8px;">
                    <div style="display: flex; gap: 20px; align-items: center; flex-wrap: wrap;">
                        <label>半径 r: <input type="range" id="r-slider" min="0.5" max="3" step="0.1" value="1"> <span id="r-val">1.0</span></label>
                        <label>角度 θ (度): <input type="number" id="deg-input" value="60" style="width: 60px;">°</label>
                    </div>
                </div>
            </div>
            <div style="flex: 1; background: #fff; border-left: 1px solid #eee; padding-left: 15px; overflow-y: auto;">
                <h4>参数实时显示</h4>
                <div class="formula-box">
                    <p>角度 θ = <span id="disp-deg">60</span>° = <span id="disp-rad">1.05</span> rad</p>
                    <p>半径 r = <span id="disp-r">1.0</span></p>
                    <p>弧长 l = θ × r = <span id="disp-l">1.05</span></p>
                    <p>扇形面积 S = ½ × l × r = <span id="disp-s">0.52</span></p>
                </div>
                <h4>核心公式</h4>
                <div class="math-box">
                    $$ l = \\alpha \\cdot r $$
                    $$ S = \\frac{1}{2}lr = \\frac{1}{2}\\alpha r^2 $$
                    $$ 180^\\circ = \\pi \\text{ rad} $$
                </div>
                <div style="margin-top: 20px; font-size: 0.9em; color: #666;">
                    <p><strong>交互说明：</strong></p>
                    <ul>
                        <li>点击圆周位置改变角度</li>
                        <li>调整滑块改变半径</li>
                        <li>观察弧长和扇形面积的变化</li>
                    </ul>
                </div>
            </div>
        </div>
    `;

    const rSlider = container.querySelector('#r-slider');
    const rVal = container.querySelector('#r-val');
    const degInput = container.querySelector('#deg-input');

    // Display elements
    const dispDeg = container.querySelector('#disp-deg');
    const dispRad = container.querySelector('#disp-rad');
    const dispR = container.querySelector('#disp-r');
    const dispL = container.querySelector('#disp-l');
    const dispS = container.querySelector('#disp-s');

    let r = 1.0;
    let deg = 60;

    function updatePlot() {
        const rad = deg * Math.PI / 180;
        const x = r * Math.cos(rad);
        const y = r * Math.sin(rad);

        // Arc path
        const t = [];
        for (let i = 0; i <= deg; i += 1) t.push(i * Math.PI / 180);
        if (deg % 1 !== 0) t.push(rad);
        const arcX = t.map(a => r * Math.cos(a));
        const arcY = t.map(a => r * Math.sin(a));

        const sectorX = [0, ...arcX, 0];
        const sectorY = [0, ...arcY, 0];

        const traces = [
            {
                x: sectorX, y: sectorY,
                fill: 'toself', fillcolor: 'rgba(59, 130, 246, 0.2)',
                mode: 'lines', line: { color: '#3b82f6', width: 0 },
                name: '扇形', hoverinfo: 'none'
            },
            {
                x: [0, x], y: [0, y],
                mode: 'lines+markers',
                marker: { size: 8, color: '#dc2626' },
                line: { color: '#dc2626', width: 2 },
                name: '半径', hoverinfo: 'none'
            },
            {
                x: arcX, y: arcY,
                mode: 'lines',
                line: { color: '#1e40af', width: 3 },
                name: '弧长', hoverinfo: 'none'
            }
        ];

        const layout = {
            title: '弧度与扇形演示',
            xaxis: { range: [-3.5, 3.5], zeroline: true, showgrid: true },
            yaxis: { range: [-3.5, 3.5], scaleanchor: "x", zeroline: true, showgrid: true },
            showlegend: false,
            margin: { l: 30, r: 30, t: 40, b: 30 },
            hovermode: 'closest'
        };

        Plotly.newPlot('radian-plot', traces, layout, { displayModeBar: false });

        // Update Text
        rVal.textContent = r.toFixed(1);
        dispDeg.textContent = deg.toFixed(1);
        dispRad.textContent = rad.toFixed(2);
        dispR.textContent = r.toFixed(1);
        const l = rad * r;
        dispL.textContent = l.toFixed(2);
        const s = 0.5 * l * r;
        dispS.textContent = s.toFixed(2);

        if (window.MathJax) MathJax.typesetPromise([container.querySelector('.math-box')]);
    }

    rSlider.oninput = () => { r = parseFloat(rSlider.value); updatePlot(); };
    degInput.oninput = () => { deg = parseFloat(degInput.value); updatePlot(); };

    // Add Plotly click handler
    setTimeout(() => {
        const plot = document.getElementById('radian-plot');
        if (plot) {
            plot.on('plotly_click', function (data) {
                if (data.points && data.points.length > 0) {
                    const pt = data.points[0];
                    let angle = Math.atan2(pt.y, pt.x) * 180 / Math.PI;
                    if (angle < 0) angle += 360;
                    deg = angle;
                    degInput.value = deg.toFixed(1);
                    updatePlot();
                }
            });
        }
    }, 500);

    updatePlot();
}

function renderTrigDefinition(container) {
    container.innerHTML = `
        <div style="display: flex; height: 100%; gap: 20px; padding: 10px;">
            <div style="flex: 2; display: flex; flex-direction: column;">
                <div id="def-plot" style="flex: 1; border: 1px solid #ddd; border-radius: 8px;"></div>
                <div style="margin-top: 10px; padding: 10px; background: #f8f9fa; border-radius: 8px;">
                    <label>角度 α: <input type="range" id="alpha-slider" min="0" max="360" step="1" value="45"> <span id="alpha-val">45°</span></label>
                    <div style="margin-top: 5px; display: flex; gap: 10px; flex-wrap: wrap;">
                        <label><input type="checkbox" class="show-line" value="sin" checked> sin (红)</label>
                        <label><input type="checkbox" class="show-line" value="cos" checked> cos (蓝)</label>
                        <label><input type="checkbox" class="show-line" value="tan" checked> tan (橙)</label>
                        <label><input type="checkbox" class="show-line" value="cot"> cot (绿)</label>
                        <label><input type="checkbox" class="show-line" value="sec"> sec (紫)</label>
                        <label><input type="checkbox" class="show-line" value="csc"> csc (青)</label>
                    </div>
                </div>
            </div>
            <div style="flex: 1; background: #fff; border-left: 1px solid #eee; padding-left: 15px; overflow-y: auto;">
                <h4>三角比数值</h4>
                <div class="formula-box">
                    <p>sin α = <span id="val-sin"></span></p>
                    <p>cos α = <span id="val-cos"></span></p>
                    <p>tan α = <span id="val-tan"></span></p>
                    <p>cot α = <span id="val-cot"></span></p>
                    <p>sec α = <span id="val-sec"></span></p>
                    <p>csc α = <span id="val-csc"></span></p>
                </div>
                <h4>几何定义</h4>
                <div class="math-box" style="font-size: 0.9em;">
                    $$ \\sin\\alpha = y/r $$
                    $$ \\cos\\alpha = x/r $$
                    $$ \\tan\\alpha = AT $$
                    $$ \\cot\\alpha = BS $$
                </div>
            </div>
        </div>
    `;

    const slider = container.querySelector('#alpha-slider');
    const valSpan = container.querySelector('#alpha-val');
    const checks = container.querySelectorAll('.show-line');

    let alpha = 45;

    function update() {
        const rad = alpha * Math.PI / 180;
        const sin = Math.sin(rad);
        const cos = Math.cos(rad);
        const tan = Math.tan(rad);

        // P(cos, sin)
        const P = { x: cos, y: sin };

        const traces = [];

        // Unit circle
        const t = [];
        for (let i = 0; i <= 360; i += 5) t.push(i * Math.PI / 180);
        traces.push({
            x: t.map(a => Math.cos(a)), y: t.map(a => Math.sin(a)),
            mode: 'lines', line: { color: '#ddd', width: 1 }, name: '单位圆', hoverinfo: 'skip'
        });

        // Radius OP
        traces.push({
            x: [0, P.x], y: [0, P.y],
            mode: 'lines', line: { color: 'black', width: 1 }, name: 'r', hoverinfo: 'skip'
        });

        // Point P
        traces.push({
            x: [P.x], y: [P.y],
            mode: 'markers+text', marker: { size: 8, color: 'black' },
            text: ['P'], textposition: 'top right', name: 'P'
        });

        const show = {};
        checks.forEach(c => show[c.value] = c.checked);

        if (show.sin) {
            traces.push({
                x: [P.x, P.x], y: [0, P.y],
                mode: 'lines', line: { color: 'red', width: 3 }, name: 'sin α'
            });
        }

        if (show.cos) {
            traces.push({
                x: [0, P.x], y: [0, 0],
                mode: 'lines', line: { color: 'blue', width: 3 }, name: 'cos α'
            });
        }

        if (show.tan) {
            if (Math.abs(cos) > 1e-6) {
                traces.push({
                    x: [1, 1], y: [0, tan],
                    mode: 'lines', line: { color: 'orange', width: 3 }, name: 'tan α'
                });
                traces.push({
                    x: [0, 1], y: [0, tan],
                    mode: 'lines', line: { color: 'orange', width: 1, dash: 'dot' }, showlegend: false
                });
            }
        }

        if (show.cot) {
            if (Math.abs(sin) > 1e-6) {
                const cot = 1.0 / tan;
                traces.push({
                    x: [0, cot], y: [1, 1],
                    mode: 'lines', line: { color: 'green', width: 3 }, name: 'cot α'
                });
                traces.push({
                    x: [0, cot], y: [0, 1],
                    mode: 'lines', line: { color: 'green', width: 1, dash: 'dot' }, showlegend: false
                });
            }
        }

        if (show.sec) {
            if (Math.abs(cos) > 1e-6) {
                const sec = 1.0 / cos;
                traces.push({
                    x: [0, sec], y: [0, 0],
                    mode: 'lines', line: { color: 'purple', width: 3, dash: 'dash' }, name: 'sec α'
                });
                traces.push({
                    x: [P.x, sec], y: [P.y, 0],
                    mode: 'lines', line: { color: 'gray', width: 1, dash: 'dot' }, showlegend: false
                });
            }
        }

        if (show.csc) {
            if (Math.abs(sin) > 1e-6) {
                const csc = 1.0 / sin;
                traces.push({
                    x: [0, 0], y: [0, csc],
                    mode: 'lines', line: { color: 'cyan', width: 3, dash: 'dash' }, name: 'csc α'
                });
                traces.push({
                    x: [P.x, 0], y: [P.y, csc],
                    mode: 'lines', line: { color: 'gray', width: 1, dash: 'dot' }, showlegend: false
                });
            }
        }

        Plotly.newPlot('def-plot', traces, {
            title: '三角比几何意义',
            xaxis: { range: [-2.5, 2.5], zeroline: true },
            yaxis: { range: [-2.5, 2.5], scaleanchor: "x", zeroline: true },
            margin: { l: 30, r: 30, t: 40, b: 30 },
            showlegend: true,
            legend: { orientation: 'h', y: -0.1 }
        }, { displayModeBar: false });

        // Update values
        container.querySelector('#val-sin').textContent = sin.toFixed(4);
        container.querySelector('#val-cos').textContent = cos.toFixed(4);
        container.querySelector('#val-tan').textContent = Math.abs(tan) > 100 ? '∞' : tan.toFixed(4);
        container.querySelector('#val-cot').textContent = Math.abs(tan) < 0.01 ? '∞' : (1 / tan).toFixed(4);
        container.querySelector('#val-sec').textContent = Math.abs(cos) < 0.01 ? '∞' : (1 / cos).toFixed(4);
        container.querySelector('#val-csc').textContent = Math.abs(sin) < 0.01 ? '∞' : (1 / sin).toFixed(4);

        valSpan.textContent = alpha + '°';
        if (window.MathJax) MathJax.typesetPromise([container.querySelector('.math-box')]);
    }

    slider.oninput = () => { alpha = parseInt(slider.value); update(); };
    checks.forEach(c => c.onchange = update);
    update();
}

function renderTrigIdentity(container) {
    container.innerHTML = `
        <div style="display: flex; height: 100%; gap: 20px; padding: 10px;">
            <div style="flex: 1; border: 1px solid #ddd; border-radius: 8px;" id="ident-plot"></div>
            <div style="flex: 1; padding: 10px; background: #fff; overflow-y: auto;">
                <div style="margin-bottom: 20px;">
                    <label>角度 α: <input type="range" id="id-slider" min="0" max="360" value="30"> <span id="id-val">30°</span></label>
                </div>
                
                <div class="formula-box">
                    <h5>平方关系</h5>
                    <div style="display: flex; align-items: center; justify-content: space-between;">
                        <span>sin²α + cos²α = 1</span>
                        <span id="sq-check" style="color: green;">✓</span>
                    </div>
                    <div style="font-size: 0.9em; color: #666; margin-top: 5px;">
                        (<span id="v-sin2">0.25</span>) + (<span id="v-cos2">0.75</span>) = <span id="v-sum">1.00</span>
                    </div>
                </div>

                <div class="formula-box" style="margin-top: 15px;">
                    <h5>商数关系</h5>
                    <div style="display: flex; align-items: center; justify-content: space-between;">
                        <span>tanα = sinα / cosα</span>
                        <span id="qt-check" style="color: green;">✓</span>
                    </div>
                    <div style="font-size: 0.9em; color: #666; margin-top: 5px;">
                        <span id="v-tan">0.577</span> = <span id="v-sin">0.5</span> / <span id="v-cos">0.866</span>
                    </div>
                </div>

                <div class="math-box">
                    $$ \\sin^2\\alpha + \\cos^2\\alpha = 1 $$
                    $$ \\tan\\alpha = \\frac{\\sin\\alpha}{\\cos\\alpha} $$
                </div>
            </div>
        </div>
    `;

    const slider = container.querySelector('#id-slider');
    const valSpan = container.querySelector('#id-val');

    function update() {
        const alpha = parseInt(slider.value);
        valSpan.textContent = alpha + '°';
        const rad = alpha * Math.PI / 180;
        const sin = Math.sin(rad);
        const cos = Math.cos(rad);
        const tan = Math.tan(rad);

        // Update values
        container.querySelector('#v-sin2').textContent = (sin * sin).toFixed(3);
        container.querySelector('#v-cos2').textContent = (cos * cos).toFixed(3);
        container.querySelector('#v-sum').textContent = (sin * sin + cos * cos).toFixed(3);

        container.querySelector('#v-tan').textContent = tan.toFixed(3);
        container.querySelector('#v-sin').textContent = sin.toFixed(3);
        container.querySelector('#v-cos').textContent = cos.toFixed(3);

        // Plot
        const traces = [
            {
                x: Array.from({ length: 100 }, (_, i) => Math.cos(i / 99 * 2 * Math.PI)),
                y: Array.from({ length: 100 }, (_, i) => Math.sin(i / 99 * 2 * Math.PI)),
                mode: 'lines', line: { color: '#ddd' }
            },
            {
                x: [0, cos, cos, 0],
                y: [0, 0, sin, 0],
                fill: 'toself', fillcolor: 'rgba(59, 130, 246, 0.2)',
                mode: 'lines', line: { color: '#3b82f6' }
            },
            {
                x: [cos / 2, cos, cos / 2],
                y: [0, sin / 2, sin / 2 + 0.1],
                mode: 'text',
                text: ['cos', 'sin', '1'],
                textposition: 'bottom center'
            }
        ];

        Plotly.newPlot('ident-plot', traces, {
            title: '几何验证',
            xaxis: { range: [-1.5, 1.5], zeroline: false, showgrid: false },
            yaxis: { range: [-1.5, 1.5], scaleanchor: "x", zeroline: false, showgrid: false },
            showlegend: false,
            margin: { l: 20, r: 20, t: 30, b: 20 }
        }, { displayModeBar: false });

        if (window.MathJax) MathJax.typesetPromise([container.querySelector('.math-box')]);
    }

    slider.oninput = update;
    update();
}
function renderTrigFormula(container) {
    container.innerHTML = `
        <div style="display: flex; height: 100%; gap: 20px; padding: 10px;">
            <div style="flex: 1; border: 1px solid #ddd; border-radius: 8px;" id="form-plot"></div>
            <div style="flex: 1; padding: 10px; background: #fff; overflow-y: auto;">
                <div style="margin-bottom: 20px;">
                    <label>角度 α: <input type="range" id="alpha-slider-f" min="0" max="360" value="45"> <span id="alpha-val-f">45°</span></label><br>
                    <label>角度 β: <input type="range" id="beta-slider-f" min="0" max="360" value="30"> <span id="beta-val-f">30°</span></label>
                </div>
                
                <div class="formula-box">
                    <h5>两角和差公式 (cos(α-β))</h5>
                    <p>cos(α-β) = cosα cosβ + sinα sinβ</p>
                    <p>LHS: cos(<span id="v-diff">15</span>°) = <span id="v-lhs">0.966</span></p>
                    <p>RHS: <span id="v-cos-a">0.707</span>×<span id="v-cos-b">0.866</span> + <span id="v-sin-a">0.707</span>×<span id="v-sin-b">0.5</span> = <span id="v-rhs">0.966</span></p>
                </div>

                <div class="math-box">
                    $$ \\cos(\\alpha-\\beta) = \\cos\\alpha\\cos\\beta + \\sin\\alpha\\sin\\beta $$
                    $$ \\sin(\\alpha+\\beta) = \\sin\\alpha\\cos\\beta + \\cos\\alpha\\sin\\beta $$
                </div>
            </div>
        </div>
    `;

    const sliderA = container.querySelector('#alpha-slider-f');
    const sliderB = container.querySelector('#beta-slider-f');

    function update() {
        const alpha = parseInt(sliderA.value);
        const beta = parseInt(sliderB.value);
        container.querySelector('#alpha-val-f').textContent = alpha + '°';
        container.querySelector('#beta-val-f').textContent = beta + '°';

        const radA = alpha * Math.PI / 180;
        const radB = beta * Math.PI / 180;

        const cosA = Math.cos(radA), sinA = Math.sin(radA);
        const cosB = Math.cos(radB), sinB = Math.sin(radB);
        const diff = alpha - beta;
        const cosDiff = Math.cos(radA - radB);

        container.querySelector('#v-diff').textContent = diff;
        container.querySelector('#v-lhs').textContent = cosDiff.toFixed(3);
        container.querySelector('#v-cos-a').textContent = cosA.toFixed(3);
        container.querySelector('#v-cos-b').textContent = cosB.toFixed(3);
        container.querySelector('#v-sin-a').textContent = sinA.toFixed(3);
        container.querySelector('#v-sin-b').textContent = sinB.toFixed(3);
        container.querySelector('#v-rhs').textContent = (cosA * cosB + sinA * sinB).toFixed(3);

        const traces = [
            {
                x: Array.from({ length: 100 }, (_, i) => Math.cos(i / 99 * 2 * Math.PI)),
                y: Array.from({ length: 100 }, (_, i) => Math.sin(i / 99 * 2 * Math.PI)),
                mode: 'lines', line: { color: '#ddd' }
            },
            {
                x: [0, cosA], y: [0, sinA],
                mode: 'lines+markers', line: { color: 'red', width: 2 }, name: 'α'
            },
            {
                x: [0, cosB], y: [0, sinB],
                mode: 'lines+markers', line: { color: 'blue', width: 2 }, name: 'β'
            }
        ];

        Plotly.newPlot('form-plot', traces, {
            title: '向量夹角演示',
            xaxis: { range: [-1.2, 1.2] },
            yaxis: { range: [-1.2, 1.2], scaleanchor: "x" },
            showlegend: true
        }, { displayModeBar: false });

        if (window.MathJax) MathJax.typesetPromise([container.querySelector('.math-box')]);
    }

    sliderA.oninput = update;
    sliderB.oninput = update;
    update();
}

function renderTrigInduced(container) {
    container.innerHTML = `
        <div style="display: flex; height: 100%; gap: 20px; padding: 10px;">
            <div style="flex: 1; border: 1px solid #ddd; border-radius: 8px;" id="ind-plot"></div>
            <div style="flex: 1; padding: 10px; background: #fff; overflow-y: auto;">
                <div style="margin-bottom: 20px;">
                    <label>角度 α: <input type="range" id="alpha-slider-i" min="0" max="360" value="30"> <span id="alpha-val-i">30°</span></label>
                </div>
                <div style="margin-bottom: 20px;">
                    <label>变换类型: 
                        <select id="trans-sel">
                            <option value="x">关于x轴对称 (-α)</option>
                            <option value="y">关于y轴对称 (π-α)</option>
                            <option value="origin">关于原点对称 (π+α)</option>
                            <option value="pi_2">关于y=x对称 (π/2-α)</option>
                        </select>
                    </label>
                </div>
                
                <div class="formula-box">
                    <h5>诱导公式验证</h5>
                    <p id="ind-formula"></p>
                    <p>原始点 P(cosα, sinα) = (<span id="p-x"></span>, <span id="p-y"></span>)</p>
                    <p>对称点 P'(cosβ, sinβ) = (<span id="pp-x"></span>, <span id="pp-y"></span>)</p>
                </div>
                
                 <div class="math-box">
                    $$ \\sin(2k\\pi+\\alpha)=\\sin\\alpha $$
                    $$ \\sin(-\\alpha)=-\\sin\\alpha $$
                    $$ \\sin(\\pi-\\alpha)=\\sin\\alpha $$
                </div>
            </div>
        </div>
    `;

    const slider = container.querySelector('#alpha-slider-i');
    const sel = container.querySelector('#trans-sel');

    function update() {
        const alpha = parseInt(slider.value);
        container.querySelector('#alpha-val-i').textContent = alpha + '°';
        const type = sel.value;

        const rad = alpha * Math.PI / 180;
        const x = Math.cos(rad);
        const y = Math.sin(rad);

        let tx, ty, betaRad, label;
        if (type === 'x') {
            tx = x; ty = -y; betaRad = -rad; label = '-α';
            container.querySelector('#ind-formula').innerHTML = 'sin(-α) = -sinα, cos(-α) = cosα';
        } else if (type === 'y') {
            tx = -x; ty = y; betaRad = Math.PI - rad; label = 'π-α';
            container.querySelector('#ind-formula').innerHTML = 'sin(π-α) = sinα, cos(π-α) = -cosα';
        } else if (type === 'origin') {
            tx = -x; ty = -y; betaRad = Math.PI + rad; label = 'π+α';
            container.querySelector('#ind-formula').innerHTML = 'sin(π+α) = -sinα, cos(π+α) = -cosα';
        } else { // pi_2
            tx = y; ty = x; betaRad = Math.PI / 2 - rad; label = 'π/2-α';
            container.querySelector('#ind-formula').innerHTML = 'sin(π/2-α) = cosα, cos(π/2-α) = sinα';
        }

        container.querySelector('#p-x').textContent = x.toFixed(3);
        container.querySelector('#p-y').textContent = y.toFixed(3);
        container.querySelector('#pp-x').textContent = tx.toFixed(3);
        container.querySelector('#pp-y').textContent = ty.toFixed(3);

        const traces = [
            {
                x: Array.from({ length: 100 }, (_, i) => Math.cos(i / 99 * 2 * Math.PI)),
                y: Array.from({ length: 100 }, (_, i) => Math.sin(i / 99 * 2 * Math.PI)),
                mode: 'lines', line: { color: '#ddd' }
            },
            {
                x: [0, x], y: [0, y],
                mode: 'lines+markers', line: { color: 'blue', width: 2 }, name: 'α'
            },
            {
                x: [0, tx], y: [0, ty],
                mode: 'lines+markers', line: { color: 'red', width: 2, dash: 'dot' }, name: label
            }
        ];

        Plotly.newPlot('ind-plot', traces, {
            title: '对称变换',
            xaxis: { range: [-1.5, 1.5] },
            yaxis: { range: [-1.5, 1.5], scaleanchor: "x" },
            showlegend: true
        }, { displayModeBar: false });

        if (window.MathJax) MathJax.typesetPromise([container.querySelector('.math-box')]);
    }

    slider.oninput = update;
    sel.onchange = update;
    update();
}
function renderTrigTriangle(container) {
    container.innerHTML = `
        <div style="display: flex; height: 100%; gap: 20px; padding: 10px;">
            <div style="flex: 2; display: flex; flex-direction: column;">
                <div id="tri-plot" style="flex: 1; border: 1px solid #ddd; border-radius: 8px;"></div>
                <div style="margin-top: 10px; padding: 10px; background: #f8f9fa; border-radius: 8px;">
                    <div style="display: flex; gap: 20px; align-items: center; flex-wrap: wrap;">
                        <label>边 c: <input type="range" id="side-c" min="2" max="8" step="0.1" value="5"> <span id="val-c">5.0</span></label>
                        <label>边 b: <input type="range" id="side-b" min="2" max="8" step="0.1" value="4"> <span id="val-b">4.0</span></label>
                        <label>角 A: <input type="range" id="angle-a" min="10" max="170" step="1" value="40"> <span id="val-a">40°</span></label>
                    </div>
                    <div style="margin-top: 5px; color: #666; font-size: 0.9em;">
                        (控制条件: SAS - 两边夹一角)
                    </div>
                </div>
            </div>
            <div style="flex: 1; background: #fff; border-left: 1px solid #eee; padding-left: 15px; overflow-y: auto;">
                <h4>正余弦定理验证</h4>
                <div class="formula-box">
                    <h5>余弦定理 (求边 a)</h5>
                    <p>$$ a^2 = b^2 + c^2 - 2bc\\cos A $$</p>
                    <p>计算: <span id="calc-cos"></span></p>
                    <p>结果: a = <span id="res-a" style="color: red; font-weight: bold;"></span></p>
                </div>
                <div class="formula-box" style="margin-top: 15px;">
                    <h5>正弦定理 (比值)</h5>
                    <p>$$ \\frac{a}{\\sin A} = \\frac{b}{\\sin B} = \\frac{c}{\\sin C} = 2R $$</p>
                    <p>a/sinA = <span id="ratio-a"></span></p>
                    <p>b/sinB = <span id="ratio-b"></span></p>
                    <p>c/sinC = <span id="ratio-c"></span></p>
                </div>
                <div style="margin-top: 15px;">
                    <p>角 B = <span id="res-angle-b"></span>°</p>
                    <p>角 C = <span id="res-angle-c"></span>°</p>
                </div>
            </div>
        </div>
    `;

    const slideC = container.querySelector('#side-c');
    const slideB = container.querySelector('#side-b');
    const slideA = container.querySelector('#angle-a');

    function update() {
        const c = parseFloat(slideC.value);
        const b = parseFloat(slideB.value);
        const A_deg = parseFloat(slideA.value);
        const A_rad = A_deg * Math.PI / 180;

        container.querySelector('#val-c').textContent = c.toFixed(1);
        container.querySelector('#val-b').textContent = b.toFixed(1);
        container.querySelector('#val-a').textContent = A_deg + '°';

        // Calculate a using Cosine Law: a^2 = b^2 + c^2 - 2bc cosA
        const a2 = b * b + c * c - 2 * b * c * Math.cos(A_rad);
        const a = Math.sqrt(a2);

        // Calculate angles B and C using Sine Law or Cosine Law
        // cosB = (a^2 + c^2 - b^2) / 2ac
        const cosB = (a * a + c * c - b * b) / (2 * a * c);
        const B_rad = Math.acos(cosB);
        const B_deg = B_rad * 180 / Math.PI;

        const C_deg = 180 - A_deg - B_deg;
        const C_rad = C_deg * Math.PI / 180;

        // Update text
        container.querySelector('#res-a').textContent = a.toFixed(3);
        container.querySelector('#calc-cos').textContent = `${b * b + c * c} - ${2 * b * c}×${Math.cos(A_rad).toFixed(3)} = ${a2.toFixed(3)}`;

        container.querySelector('#res-angle-b').textContent = B_deg.toFixed(1);
        container.querySelector('#res-angle-c').textContent = C_deg.toFixed(1);

        const ratioA = a / Math.sin(A_rad);
        const ratioB = b / Math.sin(B_rad);
        const ratioC = c / Math.sin(C_rad);

        container.querySelector('#ratio-a').textContent = ratioA.toFixed(3);
        container.querySelector('#ratio-b').textContent = ratioB.toFixed(3);
        container.querySelector('#ratio-c').textContent = ratioC.toFixed(3);

        // Plot Triangle
        // A at origin (0,0) ? No, let's put A at origin for convenience with b and c?
        // Let's place A at (0,0).
        // C is on x-axis at (b, 0)? No, usually c is AB. 
        // Let's standard: A=(0,0). B is on x-axis? c is side AB. So B=(c, 0).
        // C is determined by b (side AC) and angle A.
        // C = (b cosA, b sinA).

        const Ax = 0, Ay = 0;
        const Bx = c, By = 0;
        const Cx = b * Math.cos(A_rad);
        const Cy = b * Math.sin(A_rad);

        const traces = [
            {
                x: [Ax, Bx, Cx, Ax],
                y: [Ay, By, Cy, Ay],
                mode: 'lines+markers',
                fill: 'toself', fillcolor: 'rgba(59, 130, 246, 0.1)',
                line: { color: '#3b82f6', width: 2 },
                text: ['A', 'B', 'C', 'A'],
                textposition: 'top center',
                hoverinfo: 'skip'
            }
        ];

        // Annotations for sides
        const annotations = [
            { x: (Ax + Bx) / 2, y: (Ay + By) / 2 - 0.2, text: `c=${c}`, showarrow: false },
            { x: (Ax + Cx) / 2, y: (Ay + Cy) / 2 + 0.2, text: `b=${b}`, showarrow: false },
            { x: (Bx + Cx) / 2, y: (By + Cy) / 2 + 0.2, text: `a=${a.toFixed(2)}`, showarrow: false }
        ];

        Plotly.newPlot('tri-plot', traces, {
            title: '三角形解算',
            xaxis: { range: [-2, 10], scaleanchor: "y" },
            yaxis: { range: [-2, 8] },
            annotations: annotations,
            showlegend: false,
            margin: { l: 30, r: 30, t: 40, b: 30 }
        }, { displayModeBar: false });

        if (window.MathJax) MathJax.typesetPromise([container.querySelector('.formula-box')]);
    }

    slideC.oninput = update;
    slideB.oninput = update;
    slideA.oninput = update;
    update();
}
function renderTrigProperties(container) {
    container.innerHTML = `
        <div style="display: flex; height: 100%; gap: 20px; padding: 10px;">
            <div style="flex: 2; display: flex; flex-direction: column;">
                <div id="prop-plot" style="flex: 1; border: 1px solid #ddd; border-radius: 8px;"></div>
                <div style="margin-top: 10px; padding: 10px; background: #f8f9fa; border-radius: 8px;">
                    <div style="display: flex; gap: 20px; align-items: center; flex-wrap: wrap;">
                        <label>边 c: <input type="range" id="prop-c" min="2" max="8" step="0.1" value="6"> <span id="prop-val-c">6.0</span></label>
                        <label>边 b: <input type="range" id="prop-b" min="2" max="8" step="0.1" value="5"> <span id="prop-val-b">5.0</span></label>
                        <label>角 A: <input type="range" id="prop-a" min="20" max="160" step="1" value="50"> <span id="prop-val-a">50°</span></label>
                    </div>
                </div>
            </div>
            <div style="flex: 1; background: #fff; border-left: 1px solid #eee; padding-left: 15px; overflow-y: auto;">
                <h4>三角形性质</h4>
                <div class="formula-box">
                    <h5>面积公式</h5>
                    <p>$$ S = \\frac{1}{2}bc\\sin A $$</p>
                    <p>S = 0.5 × <span id="txt-b"></span> × <span id="txt-c"></span> × sin(<span id="txt-a"></span>°)</p>
                    <p>S = <span id="res-area" style="color: blue; font-weight: bold;"></span></p>
                </div>
                <div class="formula-box" style="margin-top: 15px;">
                    <h5>其他半径</h5>
                    <p>外接圆半径 R = a / (2sinA) = <span id="res-R"></span></p>
                    <p>内切圆半径 r = 2S / (a+b+c) = <span id="res-r"></span></p>
                </div>
            </div>
        </div>
    `;

    const slideC = container.querySelector('#prop-c');
    const slideB = container.querySelector('#prop-b');
    const slideA = container.querySelector('#prop-a');

    function update() {
        const c = parseFloat(slideC.value);
        const b = parseFloat(slideB.value);
        const A_deg = parseFloat(slideA.value);
        const A_rad = A_deg * Math.PI / 180;

        container.querySelector('#prop-val-c').textContent = c.toFixed(1);
        container.querySelector('#prop-val-b').textContent = b.toFixed(1);
        container.querySelector('#prop-val-a').textContent = A_deg + '°';

        container.querySelector('#txt-c').textContent = c;
        container.querySelector('#txt-b').textContent = b;
        container.querySelector('#txt-a').textContent = A_deg;

        const area = 0.5 * b * c * Math.sin(A_rad);
        container.querySelector('#res-area').textContent = area.toFixed(2);

        // Derived values
        const a = Math.sqrt(b * b + c * c - 2 * b * c * Math.cos(A_rad));
        const R = a / (2 * Math.sin(A_rad));
        const r = 2 * area / (a + b + c);

        container.querySelector('#res-R').textContent = R.toFixed(2);
        container.querySelector('#res-r').textContent = r.toFixed(2);

        // Coordinates
        const Ax = 0, Ay = 0;
        const Bx = c, By = 0;
        const Cx = b * Math.cos(A_rad);
        const Cy = b * Math.sin(A_rad);

        // Altitude from C to AB (length = Cy = b sin A)
        // Project C onto AB: (Cx, 0) if Cx is between 0 and c?
        // Actually altitude foot is (Cx, 0).

        const traces = [
            {
                x: [Ax, Bx, Cx, Ax],
                y: [Ay, By, Cy, Ay],
                mode: 'lines',
                fill: 'toself', fillcolor: 'rgba(59, 130, 246, 0.1)',
                line: { color: '#3b82f6', width: 2 },
                name: '三角形'
            },
            {
                x: [Cx, Cx], y: [0, Cy],
                mode: 'lines',
                line: { color: 'red', width: 1, dash: 'dot' },
                name: '高 h'
            }
        ];

        Plotly.newPlot('prop-plot', traces, {
            title: '面积与高',
            xaxis: { range: [-2, 10], scaleanchor: "y" },
            yaxis: { range: [-2, 8] },
            showlegend: true,
            margin: { l: 30, r: 30, t: 40, b: 30 }
        }, { displayModeBar: false });

        if (window.MathJax) MathJax.typesetPromise([container.querySelector('.formula-box')]);
    }

    slideC.oninput = update;
    slideB.oninput = update;
    slideA.oninput = update;
    update();
}
function renderTrigAdvanced(container) {
    container.innerHTML = `
        <div style="display: flex; height: 100%; gap: 20px; padding: 10px;">
            <div style="flex: 2; display: flex; flex-direction: column;">
                <div id="adv-plot" style="flex: 1; border: 1px solid #ddd; border-radius: 8px;"></div>
                <div style="margin-top: 10px; padding: 10px; background: #f8f9fa; border-radius: 8px;">
                    <p><strong>波形合成 (辅助角公式):</strong> y = a sin(x) + b cos(x) = R sin(x + φ)</p>
                    <div style="display: flex; gap: 20px; align-items: center; flex-wrap: wrap;">
                        <label>系数 a: <input type="range" id="adv-a" min="-5" max="5" step="0.1" value="1"> <span id="val-a">1.0</span></label>
                        <label>系数 b: <input type="range" id="adv-b" min="-5" max="5" step="0.1" value="1.732"> <span id="val-b">1.732</span></label>
                        <label>频率 ω: <input type="range" id="adv-w" min="0.5" max="5" step="0.1" value="1"> <span id="val-w">1.0</span></label>
                    </div>
                    <div style="margin-top: 5px; display: flex; gap: 10px;">
                         <label><input type="checkbox" id="chk-y1" checked> 显示 a sin(ωx)</label>
                         <label><input type="checkbox" id="chk-y2" checked> 显示 b cos(ωx)</label>
                         <label><input type="checkbox" id="chk-sum" checked> 显示 合成波形</label>
                    </div>
                </div>
            </div>
            <div style="flex: 1; background: #fff; border-left: 1px solid #eee; padding-left: 15px; overflow-y: auto;">
                <h4>辅助角公式验证</h4>
                <div class="formula-box">
                    <h5>公式</h5>
                    <p>$$ a\\sin x + b\\cos x = \\sqrt{a^2+b^2} \\sin(x + \\phi) $$</p>
                    <p>其中 $$ \\tan\\phi = b/a $$</p>
                </div>
                <div class="info-card" style="margin-top: 15px;">
                    <p><strong>计算参数:</strong></p>
                    <p>振幅 R = √(a² + b²) = <span id="res-R"></span></p>
                    <p>相位 φ (rad) = arctan(b/a) = <span id="res-phi"></span></p>
                    <p>相位 φ (deg) = <span id="res-phi-deg"></span>°</p>
                    <hr>
                    <p><strong>合成解析式:</strong></p>
                    <p id="res-eq" style="color: blue; font-weight: bold;"></p>
                </div>
                <div style="margin-top: 20px; font-size: 0.9em; color: #666;">
                    <p><strong>应用:</strong></p>
                    <ul>
                        <li>简谐振动合成</li>
                        <li>信号处理</li>
                        <li>求三角函数最值 (Max=R, Min=-R)</li>
                    </ul>
                </div>
            </div>
        </div>
    `;

    const slideA = container.querySelector('#adv-a');
    const slideB = container.querySelector('#adv-b');
    const slideW = container.querySelector('#adv-w');
    const chkY1 = container.querySelector('#chk-y1');
    const chkY2 = container.querySelector('#chk-y2');
    const chkSum = container.querySelector('#chk-sum');

    function update() {
        const a = parseFloat(slideA.value);
        const b = parseFloat(slideB.value);
        const w = parseFloat(slideW.value);

        container.querySelector('#val-a').textContent = a.toFixed(2);
        container.querySelector('#val-b').textContent = b.toFixed(3);
        container.querySelector('#val-w').textContent = w.toFixed(1);

        // Calculate R and phi
        const R = Math.sqrt(a * a + b * b);
        let phi = Math.atan2(b, a); // atan2 handles quadrants correctly
        const phiDeg = phi * 180 / Math.PI;

        container.querySelector('#res-R').textContent = R.toFixed(3);
        container.querySelector('#res-phi').textContent = phi.toFixed(3);
        container.querySelector('#res-phi-deg').textContent = phiDeg.toFixed(1);

        const sign = phi >= 0 ? '+' : '';
        container.querySelector('#res-eq').textContent = `y = ${R.toFixed(2)} sin(${w.toFixed(1)}x ${sign} ${phi.toFixed(2)})`;

        // Plot
        const xs = [];
        const y1s = [];
        const y2s = [];
        const sums = [];

        // Plot 2 periods
        const period = 2 * Math.PI / w;
        const xMax = 2 * period;
        const steps = 200;

        for (let i = 0; i <= steps; i++) {
            const x = i * xMax / steps;
            xs.push(x);
            y1s.push(a * Math.sin(w * x));
            y2s.push(b * Math.cos(w * x));
            sums.push(a * Math.sin(w * x) + b * Math.cos(w * x));
        }

        const traces = [];

        if (chkY1.checked) {
            traces.push({
                x: xs, y: y1s,
                mode: 'lines', line: { color: '#93c5fd', width: 2, dash: 'dot' },
                name: `a sin(${w}x)`
            });
        }

        if (chkY2.checked) {
            traces.push({
                x: xs, y: y2s,
                mode: 'lines', line: { color: '#86efac', width: 2, dash: 'dot' },
                name: `b cos(${w}x)`
            });
        }

        if (chkSum.checked) {
            traces.push({
                x: xs, y: sums,
                mode: 'lines', line: { color: '#2563eb', width: 3 },
                name: '合成波形'
            });

            // Mark Max/Min
            traces.push({
                x: [0, xMax], y: [R, R],
                mode: 'lines', line: { color: 'red', width: 1, dash: 'dash' },
                name: 'Max', showlegend: false
            });
            traces.push({
                x: [0, xMax], y: [-R, -R],
                mode: 'lines', line: { color: 'red', width: 1, dash: 'dash' },
                name: 'Min', showlegend: false
            });
        }

        Plotly.newPlot('adv-plot', traces, {
            title: '波形合成演示',
            xaxis: { title: 'x' },
            yaxis: { range: [-(R + 1), R + 1] },
            margin: { l: 40, r: 20, t: 40, b: 40 },
            showlegend: true,
            legend: { orientation: 'h', y: -0.2 }
        }, { displayModeBar: false });

        if (window.MathJax) MathJax.typesetPromise([container.querySelector('.formula-box')]);
    }

    slideA.oninput = update;
    slideB.oninput = update;
    slideW.oninput = update;
    chkY1.onchange = update;
    chkY2.onchange = update;
    chkSum.onchange = update;
    update();
}

function renderComplexModulusSquared(container) {
    container.innerHTML = `
        <div style="display:flex; height:100%; gap:20px; padding:20px;">
            <div class="lab-column" style="width:300px; flex-shrink:0;">
                <h3 style="margin-top:0;">3. 模的平方与复数平方</h3>
                <div class="formula-box">
                    64585 |z|^2 = |z^2| 64585
                    64585 |az|^2 = a^2 |z|^2 64585
                </div>
                <div class="controls-section">
                    <label>实部 a = <span id="val-sq-a">1</span> <input type="range" id="rng-sq-a" min="-3" max="3" step="0.1" value="1"></label>
                    <label>虚部 b = <span id="val-sq-b">1</span> <input type="range" id="rng-sq-b" min="-3" max="3" step="0.1" value="1"></label>
                </div>
                <div class="info-card">
                    <p><strong>|z|:</strong> <span id="res-mod-z"></span></p>
                    <p><strong>|z|^2:</strong> <span id="res-mod-sq"></span></p>
                    <p><strong>z^2:</strong> <span id="res-z-sq"></span></p>
                    <p><strong>|z^2|:</strong> <span id="res-mod-z2"></span></p>
                    <p style="color:green; font-weight:bold;">验证: |z|^2 = |z^2|</p>
                </div>
            </div>
            <div class="lab-column" style="flex:1;">
                <div id="plot-complex-sq" style="width:100%; height:100%;"></div>
            </div>
        </div>
    `;

    const rngA = container.querySelector('#rng-sq-a');
    const rngB = container.querySelector('#rng-sq-b');

    function update() {
        const a = parseFloat(rngA.value);
        const b = parseFloat(rngB.value);
        container.querySelector('#val-sq-a').innerText = a;
        container.querySelector('#val-sq-b').innerText = b;

        const modZ = Math.sqrt(a * a + b * b);
        const modZSq = modZ * modZ;

        // z^2 = (a+bi)(a+bi) = (a^2-b^2) + 2abi
        const z2_re = a * a - b * b;
        const z2_im = 2 * a * b;
        const modZ2 = Math.sqrt(z2_re * z2_re + z2_im * z2_im);

        container.querySelector('#res-mod-z').innerText = modZ.toFixed(2);
        container.querySelector('#res-mod-sq').innerText = modZSq.toFixed(2);
        container.querySelector('#res-z-sq').innerText = `${z2_re.toFixed(2)} + ${z2_im.toFixed(2)}i`;
        container.querySelector('#res-mod-z2').innerText = modZ2.toFixed(2);

        const traces = [
            { x: [a], y: [b], mode: 'markers+text', marker: { size: 10, color: 'blue' }, text: ['z'], textposition: 'top right', name: 'z' },
            { x: [z2_re], y: [z2_im], mode: 'markers+text', marker: { size: 10, color: 'red' }, text: ['z^2'], textposition: 'top right', name: 'z^2' }
        ];

        const shapes = [
            { type: 'circle', x0: -modZ, y0: -modZ, x1: modZ, y1: modZ, line: { color: 'blue', dash: 'dot' } },
            { type: 'circle', x0: -modZ2, y0: -modZ2, x1: modZ2, y1: modZ2, line: { color: 'red', dash: 'dot' } }
        ];

        Plotly.react('plot-complex-sq', traces, {
            title: 'z 与 z^2 的模',
            xaxis: { range: [-10, 10] },
            yaxis: { range: [-10, 10], scaleanchor: "x" },
            shapes: shapes
        }, { displayModeBar: false });
    }

    rngA.oninput = update;
    rngB.oninput = update;
    setTimeout(update, 50);
}

function renderComplexConjugate(container) {
    container.innerHTML = `
        <div style="display:flex; height:100%; gap:20px; padding:20px;">
            <div class="lab-column" style="width:300px; flex-shrink:0;">
                <h3 style="margin-top:0;">4. 实数的共轭条件</h3>
                <div class="formula-box">
                    64585 z = \bar{z} \iff z \in \mathbb{R} 64585
                </div>
                <div class="controls-section">
                    <label>实部 a = <span id="val-cj-a">2</span> <input type="range" id="rng-cj-a" min="-5" max="5" step="0.5" value="2"></label>
                    <label>虚部 b = <span id="val-cj-b">2</span> <input type="range" id="rng-cj-b" min="-5" max="5" step="0.5" value="2"></label>
                </div>
                <div class="info-card">
                    <p><strong>z:</strong> <span id="res-cj-z"></span></p>
                    <p><strong>conjugate(z):</strong> <span id="res-cj-zc"></span></p>
                    <p id="res-cj-check" style="font-weight:bold;"></p>
                </div>
            </div>
            <div class="lab-column" style="flex:1;">
                <div id="plot-complex-cj" style="width:100%; height:100%;"></div>
            </div>
        </div>
    `;

    const rngA = container.querySelector('#rng-cj-a');
    const rngB = container.querySelector('#rng-cj-b');

    function update() {
        const a = parseFloat(rngA.value);
        const b = parseFloat(rngB.value);
        container.querySelector('#val-cj-a').innerText = a;
        container.querySelector('#val-cj-b').innerText = b;

        const zStr = `${a} + ${b}i`;
        const zcStr = `${a} - ${b}i`;
        container.querySelector('#res-cj-z').innerText = zStr;
        container.querySelector('#res-cj-zc').innerText = zcStr;

        const checkEl = container.querySelector('#res-cj-check');
        if (b === 0) {
            checkEl.innerText = "z = conjugate(z) => z 是实数";
            checkEl.style.color = "green";
        } else {
            checkEl.innerText = "z != conjugate(z) => z 不是实数";
            checkEl.style.color = "red";
        }

        const traces = [
            { x: [a], y: [b], mode: 'markers+text', marker: { size: 10, color: 'blue' }, text: ['z'], textposition: 'top right', name: 'z' },
            { x: [a], y: [-b], mode: 'markers+text', marker: { size: 10, color: 'orange' }, text: ['z_bar'], textposition: 'bottom right', name: 'conjugate' }
        ];

        // Connection line
        if (b !== 0) {
            traces.push({ x: [a, a], y: [b, -b], mode: 'lines', line: { dash: 'dot', color: 'gray' }, showlegend: false });
        }

        Plotly.react('plot-complex-cj', traces, {
            title: '共轭复数',
            xaxis: { range: [-6, 6] },
            yaxis: { range: [-6, 6], scaleanchor: "x" }
        }, { displayModeBar: false });
    }

    rngA.oninput = update;
    rngB.oninput = update;
    setTimeout(update, 50);
}

function renderComplexSqrtNeg(container) {
    container.innerHTML = `
        <div style="display:flex; height:100%; gap:20px; padding:20px;">
            <div class="lab-column" style="width:300px; flex-shrink:0;">
                <h3 style="margin-top:0;">5. 负实数的平方根</h3>
                <div class="formula-box">
                    若  < 0$，则 $\sqrt{a} = \pm i\sqrt{-a}$
                </div>
                <div class="controls-section">
                    <label>负数 a = <span id="val-sn-a">-4</span> <input type="range" id="rng-sn-a" min="-16" max="-1" step="1" value="-4"></label>
                </div>
                <div class="info-card">
                    <p><strong>输入 a:</strong> <span id="res-sn-a">-4</span></p>
                    <p><strong>平方根 1:</strong> <span id="res-sn-r1">2i</span></p>
                    <p><strong>平方根 2:</strong> <span id="res-sn-r2">-2i</span></p>
                    <p>验证: (±2i)^2 = 4i^2 = -4</p>
                </div>
            </div>
            <div class="lab-column" style="flex:1;">
                <div id="plot-complex-sn" style="width:100%; height:100%;"></div>
            </div>
        </div>
    `;

    const rngA = container.querySelector('#rng-sn-a');

    function update() {
        const a = parseFloat(rngA.value);
        container.querySelector('#val-sn-a').innerText = a;
        container.querySelector('#res-sn-a').innerText = a;

        const val = Math.sqrt(-a);
        container.querySelector('#res-sn-r1').innerText = `${val.toFixed(2)}i`;
        container.querySelector('#res-sn-r2').innerText = `-${val.toFixed(2)}i`;

        const traces = [
            { x: [0], y: [val], mode: 'markers+text', marker: { size: 10, color: 'purple' }, text: ['√a'], textposition: 'right', name: 'root1' },
            { x: [0], y: [-val], mode: 'markers+text', marker: { size: 10, color: 'purple' }, text: ['-√a'], textposition: 'right', name: 'root2' },
            { x: [a], y: [0], mode: 'markers+text', marker: { size: 10, color: 'blue' }, text: ['a'], textposition: 'top right', name: 'a' }
        ];

        Plotly.react('plot-complex-sn', traces, {
            title: '负数的平方根',
            xaxis: { range: [-17, 2] },
            yaxis: { range: [-5, 5], scaleanchor: "x" }
        }, { displayModeBar: false });
    }

    rngA.oninput = update;
    setTimeout(update, 50);
}

function renderComplexCbrtReal(container) {
    container.innerHTML = `
        <div style="display:flex; height:100%; gap:20px; padding:20px;">
            <div class="lab-column" style="width:300px; flex-shrink:0;">
                <h3 style="margin-top:0;">6. 实数的立方根</h3>
                <div class="formula-box">
                    实数 a 的三个立方根分布在以原点为圆心的圆上，夹角 120°。
                </div>
                <div class="controls-section">
                    <label>实数 a = <span id="val-cbr-a">8</span> <input type="range" id="rng-cbr-a" min="-27" max="27" step="1" value="8"></label>
                </div>
                <div class="info-card">
                    <p><strong>实根:</strong> <span id="res-cbr-r0">2</span></p>
                    <p><strong>复根1:</strong> <span id="res-cbr-r1">-1+1.732i</span></p>
                    <p><strong>复根2:</strong> <span id="res-cbr-r2">-1-1.732i</span></p>
                </div>
            </div>
            <div class="lab-column" style="flex:1;">
                <div id="plot-complex-cbr" style="width:100%; height:100%;"></div>
            </div>
        </div>
    `;

    const rngA = container.querySelector('#rng-cbr-a');

    function update() {
        const a = parseFloat(rngA.value);
        container.querySelector('#val-cbr-a').innerText = a;

        const r = Math.cbrt(a);
        const r0 = r;
        // r1 = r * (-1/2 + i*sqrt(3)/2)
        const r1_re = r * (-0.5);
        const r1_im = r * (Math.sqrt(3) / 2);
        // r2 = r * (-1/2 - i*sqrt(3)/2)
        const r2_re = r * (-0.5);
        const r2_im = r * (-Math.sqrt(3) / 2);

        container.querySelector('#res-cbr-r0').innerText = r0.toFixed(2);
        container.querySelector('#res-cbr-r1').innerText = `${r1_re.toFixed(2)} + ${r1_im.toFixed(2)}i`;
        container.querySelector('#res-cbr-r2').innerText = `${r2_re.toFixed(2)} ${r2_im.toFixed(2)}i`; // sign handled by value

        const traces = [
            { x: [r0], y: [0], mode: 'markers+text', marker: { size: 10, color: 'green' }, text: ['r0'], textposition: 'top right', name: '实根' },
            { x: [r1_re], y: [r1_im], mode: 'markers+text', marker: { size: 10, color: 'orange' }, text: ['r1'], textposition: 'top right', name: '复根1' },
            { x: [r2_re], y: [r2_im], mode: 'markers+text', marker: { size: 10, color: 'orange' }, text: ['r2'], textposition: 'bottom right', name: '复根2' }
        ];

        // Triangle
        traces.push({
            x: [r0, r1_re, r2_re, r0],
            y: [0, r1_im, r2_im, 0],
            mode: 'lines', line: { color: 'gray', dash: 'dot' }
        });

        const maxRange = Math.max(Math.abs(r) * 1.5, 3);

        Plotly.react('plot-complex-cbr', traces, {
            title: '立方根分布',
            xaxis: { range: [-maxRange, maxRange] },
            yaxis: { range: [-maxRange, maxRange], scaleanchor: "x" },
            shapes: [
                { type: 'circle', x0: -Math.abs(r), y0: -Math.abs(r), x1: Math.abs(r), y1: Math.abs(r), line: { color: 'lightgray' } }
            ]
        }, { displayModeBar: false });
    }

    rngA.oninput = update;
    setTimeout(update, 50);
}

function renderComplexQuadRoots(container) {
    container.innerHTML = `
        <div style="display:flex; height:100%; gap:20px; padding:20px;">
            <div class="lab-column" style="width:300px; flex-shrink:0;">
                <h3 style="margin-top:0;">7. 实系数一元二次方程</h3>
                <div class="formula-box">
                    64585 ax^2 + bx + c = 0 64585
                    64585 \Delta = b^2 - 4ac 64585
                </div>
                <div class="controls-section">
                    <label>a = <span id="val-qr-a">1</span> <input type="range" id="rng-qr-a" min="-5" max="5" step="0.5" value="1"></label>
                    <label>b = <span id="val-qr-b">-2</span> <input type="range" id="rng-qr-b" min="-10" max="10" step="0.5" value="-2"></label>
                    <label>c = <span id="val-qr-c">2</span> <input type="range" id="rng-qr-c" min="-10" max="10" step="0.5" value="2"></label>
                </div>
                <div class="info-card">
                    <p><strong>Delta:</strong> <span id="res-qr-delta"></span></p>
                    <p><strong>Root 1:</strong> <span id="res-qr-r1"></span></p>
                    <p><strong>Root 2:</strong> <span id="res-qr-r2"></span></p>
                </div>
            </div>
            <div class="lab-column" style="flex:1;">
                <div id="plot-complex-qr" style="width:100%; height:100%;"></div>
            </div>
        </div>
    `;

    const inputs = ['a', 'b', 'c'].map(id => ({
        id, el: container.querySelector(`#rng-qr-${id}`), disp: container.querySelector(`#val-qr-${id}`)
    }));

    function update() {
        const vals = {};
        inputs.forEach(item => {
            vals[item.id] = parseFloat(item.el.value);
            item.disp.innerText = vals[item.id];
        });

        if (vals.a === 0) {
            if (vals.a === 0) { vals.a = 0.5; inputs[0].el.value = 0.5; inputs[0].disp.innerText = 0.5; }
        }

        const delta = vals.b * vals.b - 4 * vals.a * vals.c;
        container.querySelector('#res-qr-delta').innerText = delta.toFixed(2);

        let r1, r2;
        let x1, y1, x2, y2;

        if (delta >= 0) {
            // Real roots
            const sqrtDelta = Math.sqrt(delta);
            x1 = (-vals.b + sqrtDelta) / (2 * vals.a);
            y1 = 0;
            x2 = (-vals.b - sqrtDelta) / (2 * vals.a);
            y2 = 0;
            r1 = x1.toFixed(2);
            r2 = x2.toFixed(2);
        } else {
            // Complex roots
            const sqrtDelta = Math.sqrt(-delta);
            const realPart = -vals.b / (2 * vals.a);
            const imagPart = sqrtDelta / (2 * vals.a);
            x1 = realPart;
            y1 = imagPart;
            x2 = realPart;
            y2 = -imagPart;
            r1 = `${realPart.toFixed(2)} + ${imagPart.toFixed(2)}i`;
            r2 = `${realPart.toFixed(2)} - ${imagPart.toFixed(2)}i`;
        }

        container.querySelector('#res-qr-r1').innerText = r1;
        container.querySelector('#res-qr-r2').innerText = r2;

        const traces = [
            { x: [x1], y: [y1], mode: 'markers+text', marker: { size: 10, color: 'green' }, text: ['x1'], textposition: 'top right', name: 'Root 1' },
            { x: [x2], y: [y2], mode: 'markers+text', marker: { size: 10, color: 'green' }, text: ['x2'], textposition: 'bottom right', name: 'Root 2' }
        ];

        if (delta < 0) {
            traces.push({
                x: [x1, x2], y: [y1, y2], mode: 'lines', line: { dash: 'dot', color: 'gray' }, name: 'Conjugate Pair'
            });
        }

        Plotly.react('plot-complex-qr', traces, {
            title: '方程的根',
            xaxis: { range: [-5, 5] },
            yaxis: { range: [-5, 5], scaleanchor: "x" }
        }, { displayModeBar: false });
    }

    inputs.forEach(i => i.el.oninput = update);
    setTimeout(update, 50);
}

function renderComplexRootDiff(container) {
    container.innerHTML = `
        <div style="display:flex; height:100%; gap:20px; padding:20px;">
            <div class="lab-column" style="width:300px; flex-shrink:0;">
                <h3 style="margin-top:0;">8. 两根之差的模</h3>
                <div class="formula-box">
                    64585 |x_1 - x_2| = \frac{\sqrt{|\Delta|}}{|a|} 64585
                </div>
                <div class="controls-section">
                    <label>a = <span id="val-rd-a">1</span> <input type="range" id="rng-rd-a" min="-5" max="5" step="0.5" value="1"></label>
                    <label>b = <span id="val-rd-b">-2</span> <input type="range" id="rng-rd-b" min="-10" max="10" step="0.5" value="-2"></label>
                    <label>c = <span id="val-rd-c">5</span> <input type="range" id="rng-rd-c" min="-10" max="10" step="0.5" value="5"></label>
                </div>
                <div class="info-card">
                    <p><strong>Delta:</strong> <span id="res-rd-delta"></span></p>
                    <p><strong>|Delta|:</strong> <span id="res-rd-absdelta"></span></p>
                    <p><strong>|x1 - x2| (公式):</strong> <span id="res-rd-formula"></span></p>
                    <p><strong>|x1 - x2| (几何):</strong> <span id="res-rd-geo"></span></p>
                </div>
            </div>
            <div class="lab-column" style="flex:1;">
                <div id="plot-complex-rd" style="width:100%; height:100%;"></div>
            </div>
        </div>
    `;

    const inputs = ['a', 'b', 'c'].map(id => ({
        id, el: container.querySelector(`#rng-rd-${id}`), disp: container.querySelector(`#val-rd-${id}`)
    }));

    function update() {
        const vals = {};
        inputs.forEach(item => {
            vals[item.id] = parseFloat(item.el.value);
            item.disp.innerText = vals[item.id];
        });

        if (vals.a === 0) { vals.a = 0.5; inputs[0].el.value = 0.5; inputs[0].disp.innerText = 0.5; }

        const delta = vals.b * vals.b - 4 * vals.a * vals.c;
        const absDelta = Math.abs(delta);
        const formulaDist = Math.sqrt(absDelta) / Math.abs(vals.a);

        container.querySelector('#res-rd-delta').innerText = delta.toFixed(2);
        container.querySelector('#res-rd-absdelta').innerText = absDelta.toFixed(2);
        container.querySelector('#res-rd-formula').innerText = formulaDist.toFixed(2);

        let x1, y1, x2, y2;
        if (delta >= 0) {
            const sqrtDelta = Math.sqrt(delta);
            x1 = (-vals.b + sqrtDelta) / (2 * vals.a); y1 = 0;
            x2 = (-vals.b - sqrtDelta) / (2 * vals.a); y2 = 0;
        } else {
            const sqrtDelta = Math.sqrt(-delta);
            const realPart = -vals.b / (2 * vals.a);
            const imagPart = sqrtDelta / (2 * vals.a);
            x1 = realPart; y1 = imagPart;
            x2 = realPart; y2 = -imagPart;
        }

        const geoDist = Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2));
        container.querySelector('#res-rd-geo').innerText = geoDist.toFixed(2);

        const traces = [
            { x: [x1], y: [y1], mode: 'markers', marker: { size: 10, color: 'green' }, name: 'x1' },
            { x: [x2], y: [y2], mode: 'markers', marker: { size: 10, color: 'green' }, name: 'x2' },
            { x: [x1, x2], y: [y1, y2], mode: 'lines', line: { color: 'red', width: 2 }, name: 'Distance' }
        ];

        Plotly.react('plot-complex-rd', traces, {
            title: '两根间距离',
            xaxis: { range: [-5, 5] },
            yaxis: { range: [-5, 5], scaleanchor: "x" }
        }, { displayModeBar: false });
    }

    inputs.forEach(i => i.el.oninput = update);
    setTimeout(update, 50);
}

// --- Sequence Lab ---

function initSequenceLab(container, config) {
    container.innerHTML = `
        <div class="lab-container" style="display:flex; height:100%; gap:20px; padding:20px;">
            <div class="lab-sidebar" style="width:240px; flex-shrink:0; background:#f8fafc; border-radius:12px; padding:10px; overflow-y:auto; height: 100%;">
                <h3 style="padding:10px; margin:0; border-bottom:1px solid #e2e8f0; font-size:16px;">数列全景实验室</h3>
                <div class="nav-pills" id="seq-nav" style="margin-top:10px;">
                    <div class="nav-item active" data-target="def">1. 定义与通项</div>
                    <div class="nav-item" data-target="mean">2. 中项与关系</div>
                    <div class="nav-item" data-target="recur">3. 线性递推</div>
                    <div class="nav-item" data-target="sum">4. 求和方法</div>
                    <div class="nav-item" data-target="extr">5. 前n项和最值</div>
                    <div class="nav-item" data-target="prop">6. 数列性质</div>
                    <div class="nav-item" data-target="induc">7. 数学归纳法</div>
                    <div class="nav-item" data-target="limit">8. 极限与无穷和</div>
                </div>
            </div>
            <div id="seq-content" style="flex:1; overflow-y:auto; background:#fff; border-radius:12px; padding:20px; border:1px solid #e2e8f0;">
            </div>
        </div>
    `;

    const navItems = container.querySelectorAll('.nav-item');
    const content = container.querySelector('#seq-content');

    function loadContent(target) {
        console.log("Loading sequence module:", target);
        content.innerHTML = '';
        const renderers = {
            'def': renderSequenceDef,
            'mean': renderSequenceMean,
            'recur': renderSequenceRecurrence,
            'sum': renderSequenceSummation,
            'extr': renderSequenceExtrema,
            'prop': renderSequenceProperties,
            'induc': renderSequenceInduction,
            'limit': renderSequenceLimit
        };

        try {
            if (renderers[target]) {
                renderers[target](content);
            } else {
                console.error("No renderer found for:", target);
                content.innerHTML = `<div style="color:red; padding:20px;">Error: Module '${target}' not found.</div>`;
            }
        } catch (e) {
            console.error("Error rendering module:", e);
            content.innerHTML = `<div style="color:red; padding:20px;">
                <h4>渲染错误</h4>
                <pre>${e.message}\n${e.stack}</pre>
            </div>`;
        }

        if (window.MathJax) {
            MathJax.typesetPromise().catch(err => console.error("MathJax error:", err));
        }

        // Update active nav item
        navItems.forEach(n => {
            if (n.dataset.target === target) n.classList.add('active');
            else n.classList.remove('active');
        });
    }

    navItems.forEach(item => {
        item.onclick = () => {
            loadContent(item.dataset.target);
        };
    });

    const initialModule = (config && config.module) ? config.module : 'def';
    loadContent(initialModule);
}

// 1. Definition & General Term
function renderSequenceDef(container) {
    console.log("Rendering Sequence Definition...");
    container.innerHTML = `
        <h3>模块一：等差与等比数列定义</h3>
        <div class="controls-row" style="display:flex; gap:15px; margin-bottom:20px; background:#f1f5f9; padding:15px; border-radius:8px;">
            <div>
                <label>类型: <select id="seq-type"><option value="ap">等差数列</option><option value="gp">等比数列</option></select></label>
            </div>
            <div>
                <label>首项 a1: <input type="number" id="seq-a1" value="1" style="width:60px;"></label>
            </div>
            <div id="d-control">
                <label>公差 d: <input type="number" id="seq-d" value="2" style="width:60px;"></label>
            </div>
            <div id="q-control" style="display:none;">
                <label>公比 q: <input type="number" id="seq-q" value="2" style="width:60px;"></label>
            </div>
            <div>
                <label>项数 n: <input type="range" id="seq-n" min="5" max="20" value="10"></label>
                <span id="seq-n-val">10</span>
            </div>
        </div>
        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:20px;">
            <div class="card">
                <h4>数轴表示</h4>
                <div id="seq-line-plot" style="height:300px; border:1px solid #eee;"></div>
            </div>
            <div class="card">
                <h4>坐标图表示 (n, an)</h4>
                <div id="seq-scatter-plot" style="height:300px; border:1px solid #eee;"></div>
            </div>
        </div>
        <div id="seq-formula-display" style="margin-top:20px; font-size:16px; font-family:monospace; min-height:40px;"></div>
    `;

    function update() {
        try {
            const typeSel = container.querySelector('#seq-type');
            const a1In = container.querySelector('#seq-a1');
            const dIn = container.querySelector('#seq-d');
            const qIn = container.querySelector('#seq-q');
            const nIn = container.querySelector('#seq-n');
            const dCtrl = container.querySelector('#d-control');
            const qCtrl = container.querySelector('#q-control');
            const nVal = container.querySelector('#seq-n-val');
            const formulaDisp = container.querySelector('#seq-formula-display');

            if (!typeSel || !a1In || !dIn || !qIn || !nIn) return;

            const type = typeSel.value;
            const a1 = parseFloat(a1In.value);
            const n = parseInt(nIn.value);
            nVal.innerText = n;

            if (type === 'ap') {
                dCtrl.style.display = 'block';
                qCtrl.style.display = 'none';
            } else {
                dCtrl.style.display = 'none';
                qCtrl.style.display = 'block';
            }

            const data = [];
            const indices = [];
            let current = a1;
            let d = 0, q = 1;

            if (type === 'ap') {
                d = parseFloat(dIn.value);
                formulaDisp.innerHTML = `$$ a_n = ${a1} + (n-1)(${d}) = ${d}n + ${a1 - d} $$`;
            } else {
                q = parseFloat(qIn.value);
                formulaDisp.innerHTML = `$$ a_n = ${a1} \\cdot (${q})^{n-1} $$`;
            }

            for (let i = 1; i <= n; i++) {
                indices.push(i);
                data.push(current);
                if (type === 'ap') current += d;
                else current *= q;
            }

            if (typeof Plotly !== 'undefined') {
                // Line Plot (1D)
                const traceLine = {
                    x: data,
                    y: Array(n).fill(0),
                    mode: 'markers+text',
                    text: indices.map(i => `a${i}`),
                    textposition: 'top center',
                    marker: { size: 10, color: '#3b82f6' },
                    type: 'scatter'
                };

                Plotly.newPlot('seq-line-plot', [traceLine], {
                    title: '数轴分布',
                    yaxis: { visible: false, range: [-1, 1] },
                    margin: { l: 20, r: 20, t: 30, b: 20 }
                }, { displayModeBar: false });

                // Scatter Plot (2D)
                const traceScatter = {
                    x: indices,
                    y: data,
                    mode: 'lines+markers',
                    marker: { size: 8, color: '#10b981' },
                    line: { shape: type === 'ap' ? 'linear' : 'spline' },
                    type: 'scatter'
                };

                Plotly.newPlot('seq-scatter-plot', [traceScatter], {
                    title: '坐标图 (n, an)',
                    xaxis: { title: 'n' },
                    yaxis: { title: 'an' },
                    margin: { l: 40, r: 20, t: 30, b: 40 }
                }, { displayModeBar: false });
            } else {
                container.querySelector('#seq-line-plot').innerHTML = "Plotly not loaded";
            }

            if (window.MathJax) MathJax.typesetPromise();
        } catch (e) {
            console.error("Error in Sequence Def update:", e);
            container.querySelector('#seq-formula-display').innerText = "Error: " + e.message;
        }
    }

    container.querySelectorAll('input, select').forEach(el => el.oninput = update);
    setTimeout(update, 50);
}

// 2. Means & Sn-an Relation
function renderSequenceMean(container) {
    console.log("Rendering Sequence Mean...");
    container.innerHTML = `
        <h3>模块二：中项与 Sn-an 关系</h3>
        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:20px;">
            <div class="card" style="border:1px solid #e2e8f0; padding:15px; border-radius:8px;">
                <h4>中项计算器</h4>
                <div style="margin-bottom:10px;">
                    a = <input type="number" id="mean-a" value="2" style="width:50px;">
                    b = <input type="number" id="mean-b" value="8" style="width:50px;">
                </div>
                <div id="mean-res" style="background:#f1f5f9; padding:10px; border-radius:8px;"></div>
                <div id="mean-viz" style="height:150px; margin-top:10px; border:1px solid #eee;"></div>
            </div>
            <div class="card" style="border:1px solid #e2e8f0; padding:15px; border-radius:8px;">
                <h4>Sn 与 an 关系</h4>
                <p>$$ a_n = S_n - S_{n-1} (n \\ge 2) $$</p>
                <button class="btn-sm" id="gen-sn" style="margin-bottom:10px;">生成随机数列</button>
                <div id="sn-an-viz" style="height:250px; border:1px solid #eee;"></div>
            </div>
        </div>
    `;

    // Mean Logic
    function updateMean() {
        try {
            const inA = container.querySelector('#mean-a');
            const inB = container.querySelector('#mean-b');

            if (!inA || !inB) {
                console.error("Inputs not found for Mean module");
                return;
            }

            const a = parseFloat(inA.value) || 0;
            const b = parseFloat(inB.value) || 0;
            const am = (a + b) / 2;
            let gmStr = "无实数解";

            if (a * b >= 0) {
                const val = Math.sqrt(a * b);
                gmStr = `±${val.toFixed(2)}`;
            }

            container.querySelector('#mean-res').innerHTML = `
                <strong>等差中项:</strong> ${am} <br>
                <strong>等比中项:</strong> ${gmStr}
            `;

            if (typeof Plotly !== 'undefined') {
                const trace = {
                    x: [a, b, am],
                    y: [0, 0, 0],
                    mode: 'markers+text',
                    text: ['a', 'b', 'AM'],
                    textposition: 'top center',
                    marker: { size: [10, 10, 8], color: ['blue', 'blue', 'red'] }
                };

                Plotly.newPlot('mean-viz', [trace], {
                    yaxis: { visible: false, range: [-1, 1] },
                    margin: { t: 20, b: 20, l: 20, r: 20 }
                }, { displayModeBar: false });
            } else {
                container.querySelector('#mean-viz').innerHTML = "Plotly not loaded";
            }
        } catch (e) {
            console.error("Error in Mean update:", e);
            container.querySelector('#mean-res').innerHTML = "Error: " + e.message;
        }
    }

    const inputs = container.querySelectorAll('#mean-a, #mean-b');
    inputs.forEach(el => el.oninput = updateMean);

    // Sn-an Logic
    const btnGen = container.querySelector('#gen-sn');

    function updateSnAn() {
        try {
            const n = 8;
            const an = Array.from({ length: n }, () => Math.floor(Math.random() * 10) + 1);
            const sn = [];
            let sum = 0;
            an.forEach(v => { sum += v; sn.push(sum); });

            const x = Array.from({ length: n }, (_, i) => i + 1);

            if (typeof Plotly !== 'undefined') {
                const traceSn = {
                    x: x, y: sn, type: 'scatter', mode: 'lines+markers', name: 'Sn',
                    line: { color: '#8b5cf6' }
                };
                const traceAn = {
                    x: x, y: an, type: 'bar', name: 'an',
                    marker: { color: '#3b82f6', opacity: 0.6 }
                };

                Plotly.newPlot('sn-an-viz', [traceSn, traceAn], {
                    title: 'Sn (折线) 与 an (柱状)',
                    margin: { t: 30, b: 30, l: 30, r: 20 }
                }, { displayModeBar: false });
            } else {
                container.querySelector('#sn-an-viz').innerHTML = "Plotly not loaded";
            }

            if (window.MathJax) MathJax.typesetPromise();

        } catch (e) {
            console.error("Error in SnAn update:", e);
        }
    }

    if (btnGen) btnGen.onclick = updateSnAn;

    // Initial Render with delay
    setTimeout(() => {
        updateMean();
        updateSnAn();
    }, 50);
}

// 3. Linear Recurrence
function renderSequenceRecurrence(container) {
    console.log("Rendering Sequence Recurrence...");
    container.innerHTML = `
        <h3>模块三：线性递推数列 a(n+1) = k*an + b</h3>
        <div class="controls-row">
            k = <input type="number" id="rec-k" value="2" step="0.5" style="width:60px;">
            b = <input type="number" id="rec-b" value="3" style="width:60px;">
            a1 = <input type="number" id="rec-a1" value="1" style="width:60px;">
            <button id="rec-calc" class="btn-sm">计算构造</button>
        </div>
        <div style="margin-top:20px; background:#f8fafc; padding:15px; border-radius:8px;">
            <p><strong>构造原理：</strong> 设 $a_n + \\lambda = k(a_{n-1} + \\lambda)$</p>
            <div id="rec-steps"></div>
        </div>
        <div id="rec-viz" style="height:300px; margin-top:20px; border:1px solid #eee;"></div>
    `;

    function update() {
        try {
            const kIn = container.querySelector('#rec-k');
            const bIn = container.querySelector('#rec-b');
            const a1In = container.querySelector('#rec-a1');

            if (!kIn || !bIn || !a1In) return;

            const k = parseFloat(kIn.value);
            const b = parseFloat(bIn.value);
            const a1 = parseFloat(a1In.value);

            if (k === 1) {
                container.querySelector('#rec-steps').innerHTML = "当 k=1 时，这是等差数列，无需构造。";
                if (typeof Plotly !== 'undefined') Plotly.purge('rec-viz');
                return;
            }

            // lambda = b / (k-1)
            const lambda = b / (k - 1);

            let html = `
                $$ \\lambda = \\frac{b}{k-1} = \\frac{${b}}{${k}-1} = ${lambda.toFixed(2)} $$
                <br>令 $b_n = a_n + ${lambda.toFixed(2)}$，则 $\\{b_n\\}$ 是公比为 ${k} 的等比数列。
            `;
            container.querySelector('#rec-steps').innerHTML = html;

            const an = [a1];
            const bn = [a1 + lambda];
            for (let i = 1; i < 10; i++) {
                const nextA = k * an[i - 1] + b;
                an.push(nextA);
                bn.push(nextA + lambda);
            }

            const x = Array.from({ length: 10 }, (_, i) => i + 1);

            if (typeof Plotly !== 'undefined') {
                Plotly.newPlot('rec-viz', [
                    { x, y: an, name: 'an', type: 'scatter', mode: 'lines+markers' },
                    { x, y: bn, name: 'bn (等比)', type: 'scatter', mode: 'lines+markers', line: { dash: 'dot' } }
                ], { title: '原始数列 vs 构造数列', margin: { t: 30, b: 20, l: 30, r: 20 } }, { displayModeBar: false });
            } else {
                container.querySelector('#rec-viz').innerHTML = "Plotly not loaded";
            }

            if (window.MathJax) MathJax.typesetPromise();
        } catch (e) {
            console.error("Error in Recurrence update:", e);
            container.querySelector('#rec-steps').innerText = "Error: " + e.message;
        }
    }

    const btn = container.querySelector('#rec-calc');
    if (btn) btn.onclick = update;
    setTimeout(update, 50);
}

// 4. Summation Methods
function renderSequenceSummation(container) {
    console.log("Rendering Sequence Summation...");
    container.innerHTML = `
        <h3>模块四：数列求和方法</h3>
        <div class="tab-bar-inner" style="display:flex; gap:10px; margin-bottom:15px;">
            <button class="btn-xs active" data-m="formula">公式法</button>
            <button class="btn-xs" data-m="group">分组求和</button>
            <button class="btn-xs" data-m="tele">裂项相消</button>
            <button class="btn-xs" data-m="mis">错位相减</button>
        </div>
        <div id="sum-desc" style="min-height:100px; margin-bottom:20px;"></div>
        <div id="sum-viz" style="height:250px; background:#fff; border:1px solid #eee;"></div>
    `;

    const btns = container.querySelectorAll('.btn-xs');

    function show(method) {
        try {
            let title = "", desc = "", layout = {};
            const x = [1, 2, 3, 4, 5];
            let traces = [];

            if (method === 'formula') {
                title = "公式法 (梯形面积)";
                desc = "$$ S_n = \\frac{n(a_1+a_n)}{2} $$ <br> 几何意义：等差数列求和对应梯形面积公式。";
                traces = [{ x: [1, 2, 3, 4, 5], y: [2, 4, 6, 8, 10], type: 'bar', name: 'an' }];
                layout = { title: '倒序相加原理可视化', margin: { t: 30, b: 20, l: 30, r: 20 } };
            } else if (method === 'tele') {
                title = "裂项相消法";
                desc = "$$ \\frac{1}{n(n+1)} = \\frac{1}{n} - \\frac{1}{n+1} $$ <br> 中间项相互抵消，只剩首尾。";
                traces = [{ x: [1, 2, 3, 4], y: [0.5, 0.16, 0.08, 0.05], type: 'bar' }];
                layout = { margin: { t: 30, b: 20, l: 30, r: 20 } };
            } else if (method === 'mis') {
                title = "错位相减法";
                desc = "用于差比数列求和：$$ S_n - qS_n $$ <br> 通过错位对齐，转化为等比数列求和。";
                traces = [
                    { x: [1, 2, 3, 4], y: [2, 8, 24, 64], name: 'Sn' },
                    { x: [2, 3, 4, 5], y: [4, 16, 48, 128], name: '2Sn (错位)' }
                ];
                layout = { margin: { t: 30, b: 20, l: 30, r: 20 } };
            } else {
                title = "分组求和法";
                desc = "将数列拆分为基本数列（等差+等比）分别求和。";
            }

            container.querySelector('#sum-desc').innerHTML = `<h4>${title}</h4><p>${desc}</p>`;

            if (typeof Plotly !== 'undefined') {
                if (traces.length) Plotly.newPlot('sum-viz', traces, layout, { displayModeBar: false });
                else Plotly.purge('sum-viz');
            } else {
                container.querySelector('#sum-viz').innerHTML = "Plotly not loaded";
            }

            if (window.MathJax) MathJax.typesetPromise();
        } catch (e) {
            console.error("Error in Summation show:", e);
            container.querySelector('#sum-desc').innerText = "Error: " + e.message;
        }
    }

    btns.forEach(b => b.onclick = (e) => {
        btns.forEach(x => x.classList.remove('active'));
        e.target.classList.add('active');
        show(e.target.dataset.m);
    });
    setTimeout(() => show('formula'), 50);
}

// 5. Extrema
function renderSequenceExtrema(container) {
    console.log("Rendering Sequence Extrema...");
    container.innerHTML = `
        <h3>模块五：前n项和最值 (二次函数)</h3>
        <div class="controls-row" style="background:#f8fafc; padding:10px; border-radius:8px;">
            a1 = <input type="number" id="ex-a1" value="10" style="width:60px; margin-right:15px;">
            d = <input type="number" id="ex-d" value="-2" style="width:60px;">
        </div>
        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px; margin-top:10px;">
            <div id="ex-sn-plot" style="height:250px; border:1px solid #eee;"></div>
            <div id="ex-an-plot" style="height:250px; border:1px solid #eee;"></div>
        </div>
        <div id="ex-res" style="text-align:center; font-weight:bold; margin-top:10px; min-height:24px;"></div>
    `;

    function update() {
        try {
            const a1In = container.querySelector('#ex-a1');
            const dIn = container.querySelector('#ex-d');

            if (!a1In || !dIn) {
                console.error("Inputs not found for Extrema module");
                return;
            }

            const a1 = parseFloat(a1In.value) || 0;
            const d = parseFloat(dIn.value) || 0;
            const n = 15;
            const sn = [], an = [], idx = [];

            let s = 0;
            for (let i = 1; i <= n; i++) {
                const val = a1 + (i - 1) * d;
                s += val;
                an.push(val);
                sn.push(s);
                idx.push(i);
            }

            if (typeof Plotly !== 'undefined') {
                Plotly.newPlot('ex-sn-plot', [{ x: idx, y: sn, type: 'scatter', mode: 'lines+markers', name: 'Sn' }], {
                    title: 'Sn (抛物线)', margin: { t: 30, b: 20, l: 30, r: 20 }
                }, { displayModeBar: false });

                const colors = an.map(v => v >= 0 ? '#10b981' : '#ef4444');
                Plotly.newPlot('ex-an-plot', [{ x: idx, y: an, type: 'bar', marker: { color: colors }, name: 'an' }], {
                    title: 'an (变号点)', margin: { t: 30, b: 20, l: 30, r: 20 }
                }, { displayModeBar: false });
            } else {
                container.querySelector('#ex-sn-plot').innerHTML = "Plotly not loaded";
            }

            // Simple logic for max/min
            const maxSn = Math.max(...sn);
            container.querySelector('#ex-res').innerText = `最大值: ${maxSn}`;

            if (window.MathJax) MathJax.typesetPromise();
        } catch (e) {
            console.error("Error in Extrema update:", e);
            container.querySelector('#ex-res').innerText = "Error: " + e.message;
        }
    }

    const inputs = container.querySelectorAll('input');
    inputs.forEach(i => i.oninput = update);
    setTimeout(update, 50);
}

// 6. Properties
function renderSequenceProperties(container) {
    console.log("Rendering Sequence Properties...");
    container.innerHTML = `
        <h3>模块六：数列性质验证 (片段和)</h3>
        <p>验证 $S_m, S_{2m}-S_m, S_{3m}-S_{2m}$ 是否成等差/等比</p>
        <div class="controls-row" style="margin-bottom:20px; padding:10px; background:#f8fafc; border-radius:8px;">
            m = <input type="number" id="prop-m" value="3" min="1" max="5" style="width:60px; margin-right:10px;">
            a1 = <input type="number" id="prop-a1" value="1" style="width:60px; margin-right:10px;">
            d = <input type="number" id="prop-d" value="2" style="width:60px;">
        </div>
        <div id="prop-res" style="margin-top:20px; font-size:16px; min-height:60px;"></div>
        <div id="prop-viz" style="height:300px; border:1px solid #eee; margin-top:20px;"></div>
    `;

    function update() {
        try {
            const mInput = container.querySelector('#prop-m');
            const a1Input = container.querySelector('#prop-a1');
            const dInput = container.querySelector('#prop-d');

            if (!mInput || !a1Input || !dInput) {
                console.error("Inputs not found in DOM");
                return;
            }

            const m = parseInt(mInput.value) || 3;
            const a1 = parseFloat(a1Input.value) || 1;
            const d = parseFloat(dInput.value) || 2;

            // Generate 3m terms
            const vals = [];
            let s = 0;
            for (let i = 0; i < 3 * m; i++) {
                vals.push(a1 + i * d);
            }

            const sum = (arr) => arr.reduce((a, b) => a + b, 0);
            const s1 = sum(vals.slice(0, m));
            const s2 = sum(vals.slice(m, 2 * m));
            const s3 = sum(vals.slice(2 * m, 3 * m));

            // Fix float precision for comparison
            const diff1 = parseFloat((s2 - s1).toFixed(10));
            const diff2 = parseFloat((s3 - s2).toFixed(10));
            const isAP = Math.abs(diff1 - diff2) < 1e-9;

            container.querySelector('#prop-res').innerHTML = `
                <div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:10px; margin-bottom:10px;">
                    <div>片段1 (S${m}): <b>${s1}</b></div>
                    <div>片段2 (S${2 * m}-S${m}): <b>${s2}</b></div>
                    <div>片段3 (S${3 * m}-S${2 * m}): <b>${s3}</b></div>
                </div>
                <div>
                    差值1: ${diff1}, 差值2: ${diff2} -> 
                    ${isAP ? '<span style="color:green; font-weight:bold;">成等差数列</span>' : '<span style="color:red">不成等差</span>'}
                </div>
            `;

            if (typeof Plotly !== 'undefined') {
                Plotly.newPlot('prop-viz', [{
                    x: [`S_${m}`, `S_{2m}-S_${m}`, `S_{3m}-S_{2m}`],
                    y: [s1, s2, s3],
                    type: 'bar',
                    marker: { color: ['#3b82f6', '#8b5cf6', '#ec4899'] }
                }], {
                    title: '片段和分布',
                    margin: { t: 30, b: 30, l: 40, r: 20 },
                    yaxis: { title: '片段和数值' }
                }, { displayModeBar: false });
            } else {
                container.querySelector('#prop-viz').innerHTML = 'Plotly library not loaded.';
            }

            if (window.MathJax) MathJax.typesetPromise();
        } catch (e) {
            console.error("Error in update:", e);
        }
    }

    container.querySelectorAll('input').forEach(i => i.oninput = update);
    // Delay initial update slightly to ensure DOM is ready
    setTimeout(update, 50);
}

// 7. Induction
function renderSequenceInduction(container) {
    console.log("Rendering Sequence Induction...");
    container.innerHTML = `
        <h3>模块七：数学归纳法演示</h3>
        <p>求证：$1+3+5+...+(2n-1) = n^2$</p>
        <div class="controls-row">
            <button id="ind-next" class="btn-primary">下一步</button>
            <button id="ind-reset" class="btn-secondary">重置</button>
        </div>
        <div id="ind-stage" style="margin-top:20px; padding:20px; border:1px solid #ddd; border-radius:8px; min-height:150px;">
            点击"下一步"开始证明...
        </div>
        <div id="ind-viz" style="height:200px; margin-top:10px; border:1px solid #eee;"></div>
    `;

    let step = 0;
    const stages = [
        "<strong>第一步（奠基）：</strong><br>当 n=1 时，左边 = 1，右边 = 1² = 1。<br>左边=右边，命题成立。",
        "<strong>第二步（归纳假设）：</strong><br>假设 n=k 时命题成立，即 $1+3+...+(2k-1) = k^2$。",
        "<strong>第三步（归纳递推）：</strong><br>当 n=k+1 时，<br>左边 = $[1+...+(2k-1)] + (2(k+1)-1)$ <br> = $k^2 + (2k+1)$ (利用假设) <br> = $(k+1)^2$ = 右边。<br>命题得证。",
        "<strong>结论：</strong><br>由数学归纳法可知，命题对一切 n∈N* 成立。"
    ];

    function draw(n) {
        try {
            if (typeof Plotly !== 'undefined') {
                Plotly.newPlot('ind-viz', [{
                    x: [1, 2, 3, 4], y: [1, 4, 9, 16], type: 'scatter',
                    mode: 'markers+lines',
                    marker: { size: 10, color: n > 0 ? 'orange' : 'grey' }
                }], { title: 'n vs Sum', margin: { t: 30, b: 20, l: 30, r: 20 } }, { displayModeBar: false });
            } else {
                container.querySelector('#ind-viz').innerHTML = "Plotly not loaded";
            }
        } catch (e) {
            console.error("Error in Induction draw:", e);
        }
    }

    const btnNext = container.querySelector('#ind-next');
    const btnReset = container.querySelector('#ind-reset');

    if (btnNext) btnNext.onclick = () => {
        try {
            if (step < stages.length) {
                container.querySelector('#ind-stage').innerHTML = stages[step];
                step++;
                draw(step);
                if (window.MathJax) MathJax.typesetPromise();
            }
        } catch (e) { console.error(e); }
    };

    if (btnReset) btnReset.onclick = () => {
        step = 0;
        container.querySelector('#ind-stage').innerHTML = "点击'下一步'开始证明...";
        draw(0);
    };

    setTimeout(() => draw(0), 50);
}

// 8. Limits
function renderSequenceLimit(container) {
    console.log("Rendering Sequence Limit...");
    container.innerHTML = `
        <h3>模块八：数列极限 $\\epsilon - N$ 定义</h3>
        <p>$$ \\lim_{n \\to \\infty} \\frac{2n+1}{n+1} = 2 $$</p>
        <div class="controls-row">
            $\\epsilon$ = <input type="range" id="lim-eps" min="0.01" max="0.5" step="0.01" value="0.2">
            <span id="eps-val">0.2</span>
        </div>
        <div id="lim-res" style="margin-top:10px; font-weight:bold; color:var(--accent); min-height:24px;"></div>
        <div id="lim-viz" style="height:350px; border:1px solid #eee; margin-top:10px;"></div>
    `;

    function update() {
        try {
            const epsIn = container.querySelector('#lim-eps');
            const epsVal = container.querySelector('#eps-val');
            const res = container.querySelector('#lim-res');

            if (!epsIn) return;

            const eps = parseFloat(epsIn.value);
            epsVal.innerText = eps.toFixed(3);

            const limit = 2;
            const nMax = 50;
            const x = [], y = [];

            const N = Math.floor(1 / eps - 1) + 1;
            res.innerHTML = `当 n > ${Math.max(1, N)} 时，所有点都落在误差带内。`;

            for (let i = 1; i <= nMax; i++) {
                x.push(i);
                y.push((2 * i + 1) / (i + 1));
            }

            const shapes = [
                { type: 'rect', x0: 0, x1: nMax, y0: limit - eps, y1: limit + eps, fillcolor: 'rgba(0,255,0,0.2)', line: { width: 0 } },
                { type: 'line', x0: 0, x1: nMax, y0: limit, y1: limit, line: { color: 'green', dash: 'dash' } }
            ];

            if (typeof Plotly !== 'undefined') {
                Plotly.newPlot('lim-viz', [{
                    x, y, type: 'scatter', mode: 'markers', marker: { size: 6 }
                }], {
                    title: '极限收敛过程',
                    shapes: shapes,
                    yaxis: { range: [1.5, 2.5] },
                    margin: { t: 30, b: 30, l: 30, r: 20 }
                }, { displayModeBar: false });
            } else {
                container.querySelector('#lim-viz').innerHTML = "Plotly not loaded";
            }

            if (window.MathJax) MathJax.typesetPromise();
        } catch (e) {
            console.error("Error in Limit update:", e);
        }
    }

    const epsIn = container.querySelector('#lim-eps');
    if (epsIn) epsIn.oninput = update;

    setTimeout(update, 50);
}

// --- Vector Lab ---

function initVectorLab(container, config) {
    container.innerHTML = `
        <div class="lab-container" style="display:flex; height:100%; gap:20px; padding:20px;">
            <div class="lab-sidebar" style="width:240px; flex-shrink:0; background:#f8fafc; border-radius:12px; padding:10px; overflow-y:auto; height: 100%;">
                <h3 style="padding:10px; margin:0; border-bottom:1px solid #e2e8f0; font-size:16px;">向量可视化实验室</h3>
                <div class="nav-pills" id="vec-nav" style="margin-top:10px;">
                    <div class="nav-item active" data-target="concept">1. 基本概念与几何表示</div>
                    <div class="nav-item" data-target="linear">2. 坐标表示与线性运算</div>
                    <div class="nav-item" data-target="collinear">3. 共线判定与定理</div>
                    <div class="nav-item" data-target="dotprod">4. 数量积与投影</div>
                    <div class="nav-item" data-target="prop">5. 性质、夹角与垂直</div>
                    <div class="nav-item" data-target="decomp">6. 分解与三点共线</div>
                    <div class="nav-item" data-target="center">7. 三角形四心应用</div>
                    <div class="nav-item" data-target="app">8. 综合应用与求解</div>
                </div>
            </div>
            <div id="vec-content" style="flex:1; overflow-y:auto; background:#fff; border-radius:12px; padding:20px; border:1px solid #e2e8f0;">
            </div>
        </div>
    `;

    const navItems = container.querySelectorAll('.nav-item');
    const content = container.querySelector('#vec-content');

    function loadContent(target) {
        content.innerHTML = '';
        try {
            if (target === 'concept') renderVectorConcept(content);
            else if (target === 'linear') renderVectorLinearOps(content);
            else if (target === 'collinear') renderVectorCollinear(content);
            else if (target === 'dotprod') renderVectorDotProduct(content);
            else if (target === 'prop') renderVectorProperties(content);
            else if (target === 'decomp') renderVectorDecomposition(content);
            else if (target === 'center') renderVectorTriangleCenters(content);
            else if (target === 'app') renderVectorApplications(content);

            if (window.MathJax) MathJax.typesetPromise();
        } catch (e) {
            console.error("Vector Lab Error:", e);
            content.innerHTML = `<div style="padding:20px; color:red; background:#fff1f2; border-radius:8px; border:1px solid #fecdd3;">
                <h3>加载模块出错</h3>
                <p>模块 ID: ${target}</p>
                <pre style="background:rgba(0,0,0,0.05); padding:10px; border-radius:4px; overflow:auto;">${e.message}\n${e.stack}</pre>
            </div>`;
        }

        // Update active nav item
        navItems.forEach(n => {
            if (n.dataset.target === target) n.classList.add('active');
            else n.classList.remove('active');
        });
    }

    navItems.forEach(item => {
        item.onclick = () => {
            loadContent(item.dataset.target);
        };
    });

    const initialModule = (config && config.module) ? config.module : 'concept';
    loadContent(initialModule);
}

// 1. Basic Concepts
function renderVectorConcept(container) {
    container.innerHTML = `
        <h3>模块一：基本概念与几何表示</h3>
        <p>核心：向量是既有大小又有方向的量。有向线段是其几何表示。</p>
        
        <div style="display:grid; grid-template-columns: 300px 1fr; gap:20px;">
            <div class="card" style="padding:15px; border:1px solid #e2e8f0; border-radius:8px;">
                <h4>控制面板</h4>
                <div style="margin-bottom:10px;">
                    <label>模长 (Magnitude): <span id="vc-mag-val">5</span></label>
                    <input type="range" id="vc-mag" min="1" max="10" step="0.5" value="5" style="width:100%;">
                </div>
                <div style="margin-bottom:10px;">
                    <label>方向角 (Angle): <span id="vc-ang-val">45°</span></label>
                    <input type="range" id="vc-ang" min="0" max="360" step="5" value="45" style="width:100%;">
                </div>
                <div id="vc-info" style="margin-top:20px; font-size:14px; color:#475569;"></div>
            </div>
            
            <div id="vc-viz" style="height:400px; border:1px solid #eee; border-radius:8px;"></div>
        </div>
    `;

    function update() {
        const mag = parseFloat(container.querySelector('#vc-mag').value);
        const ang = parseFloat(container.querySelector('#vc-ang').value);

        container.querySelector('#vc-mag-val').textContent = mag;
        container.querySelector('#vc-ang-val').textContent = ang + '°';

        const rad = ang * Math.PI / 180;
        const x = mag * Math.cos(rad);
        const y = mag * Math.sin(rad);

        const annotations = [{
            x: x, y: y, ax: 0, ay: 0, xref: 'x', yref: 'y', axref: 'x', ayref: 'y',
            showarrow: true, arrowhead: 2, arrowwidth: 3, arrowcolor: '#3b82f6'
        }];

        // Components
        const shapes = [
            { type: 'line', x0: 0, y0: 0, x1: x, y1: 0, line: { color: '#94a3b8', dash: 'dot' } },
            { type: 'line', x0: x, y0: 0, x1: x, y1: y, line: { color: '#94a3b8', dash: 'dot' } }
        ];

        container.querySelector('#vc-info').innerHTML = `
            <strong>向量坐标表示:</strong><br>
            $\\vec{a} = (x, y) = (${x.toFixed(2)}, ${y.toFixed(2)})$<br>
            <strong>模长计算:</strong><br>
            $|\\vec{a}| = \\sqrt{x^2 + y^2} = ${mag.toFixed(2)}$
        `;

        Plotly.newPlot('vc-viz', [], {
            title: '向量几何表示',
            xaxis: { range: [-10, 10], zeroline: true },
            yaxis: { range: [-10, 10], zeroline: true, scaleanchor: "x" },
            shapes: shapes,
            annotations: annotations,
            margin: { t: 30, b: 30, l: 30, r: 20 }
        }, { displayModeBar: false });

        if (window.MathJax) MathJax.typesetPromise();
    }

    container.querySelector('#vc-mag').oninput = update;
    container.querySelector('#vc-ang').oninput = update;
    update();
}

// 2. Linear Operations
function renderVectorLinearOps(container) {
    container.innerHTML = `
        <h3>模块二：向量的坐标表示与线性运算</h3>
        <p>核心：向量加法（平行四边形/三角形法则）、减法、数乘。</p>
        
        <div style="display:grid; grid-template-columns: 320px 1fr; gap:20px;">
            <div class="card" style="padding:15px; border:1px solid #e2e8f0; border-radius:8px;">
                <h4>运算控制</h4>
                <div style="margin-bottom:10px;">
                    <strong>向量 a:</strong> 
                    x=<input type="number" id="vl-ax" value="2" style="width:50px;">
                    y=<input type="number" id="vl-ay" value="1" style="width:50px;">
                </div>
                <div style="margin-bottom:10px;">
                    <strong>向量 b:</strong> 
                    x=<input type="number" id="vl-bx" value="1" style="width:50px;">
                    y=<input type="number" id="vl-by" value="3" style="width:50px;">
                </div>
                
                <div style="margin-bottom:10px; border-top:1px solid #eee; padding-top:10px;">
                    <strong>操作模式:</strong>
                    <select id="vl-mode" style="width:100%; padding:5px; margin-top:5px;">
                        <option value="add">加法 (a + b)</option>
                        <option value="sub">减法 (a - b)</option>
                        <option value="scale">数乘 (λ · a)</option>
                    </select>
                </div>
                
                <div id="vl-scale-ctrl" style="display:none; margin-bottom:10px;">
                    <label>系数 λ: <span id="vl-lambda-val">1.5</span></label>
                    <input type="range" id="vl-lambda" min="-3" max="3" step="0.1" value="1.5" style="width:100%;">
                </div>

                <div style="margin-bottom:10px;">
                    <label><input type="checkbox" id="vl-show-aux" checked> 显示辅助线</label>
                </div>

                <div id="vl-res" style="background:#f1f5f9; padding:10px; border-radius:8px; font-size:14px;"></div>
            </div>
            
            <div id="vl-viz" style="height:450px; border:1px solid #eee; border-radius:8px;"></div>
        </div>
    `;

    function update() {
        const ax = parseFloat(container.querySelector('#vl-ax').value);
        const ay = parseFloat(container.querySelector('#vl-ay').value);
        const bx = parseFloat(container.querySelector('#vl-bx').value);
        const by = parseFloat(container.querySelector('#vl-by').value);
        const mode = container.querySelector('#vl-mode').value;
        const lambda = parseFloat(container.querySelector('#vl-lambda').value);
        const showAux = container.querySelector('#vl-show-aux').checked;

        container.querySelector('#vl-scale-ctrl').style.display = mode === 'scale' ? 'block' : 'none';
        container.querySelector('#vl-lambda-val').textContent = lambda;

        const annotations = [];
        const shapes = [];

        function addVec(vx, vy, label, color, startX = 0, startY = 0) {
            annotations.push({
                x: startX + vx, y: startY + vy, ax: startX, ay: startY, xref: 'x', yref: 'y', axref: 'x', ayref: 'y',
                showarrow: true, arrowhead: 2, arrowwidth: 3, arrowcolor: color,
                text: label, textposition: 'top right', font: { color: color }
            });
        }

        let cx, cy, labelC;

        if (mode !== 'scale') {
            addVec(ax, ay, 'a', '#3b82f6'); // blue
            addVec(bx, by, 'b', '#ef4444'); // red
        } else {
            addVec(ax, ay, 'a', '#3b82f6');
        }

        if (mode === 'add') {
            cx = ax + bx;
            cy = ay + by;
            labelC = 'a + b';

            // Result vector
            addVec(cx, cy, 'c', '#22c55e'); // green

            if (showAux) {
                // Parallelogram lines
                shapes.push({ type: 'line', x0: ax, y0: ay, x1: cx, y1: cy, line: { color: '#ef4444', dash: 'dot', width: 1 } });
                shapes.push({ type: 'line', x0: bx, y0: by, x1: cx, y1: cy, line: { color: '#3b82f6', dash: 'dot', width: 1 } });
            }

            container.querySelector('#vl-res').innerHTML = `
                <strong>计算过程:</strong><br>
                a = (${ax}, ${ay}), b = (${bx}, ${by})<br>
                a + b = (${ax}+${bx}, ${ay}+${by})<br>
                = <strong>(${cx}, ${cy})</strong>
            `;
        } else if (mode === 'sub') {
            cx = ax - bx;
            cy = ay - by;
            labelC = 'a - b';

            // Result vector c = a - b
            addVec(cx, cy, 'c', '#22c55e');

            if (showAux) {
                // Triangle rule for subtraction: b + (a-b) = a
                // Draw vector -b from tip of a? Or just b from origin and c from tip of b to tip of a?
                // Standard visual: a and b from origin. a - b is vector from tip of b to tip of a.
                // But we usually show resultant from origin.

                // Show vector from tip of b to tip of a
                annotations.push({
                    x: ax, y: ay, ax: bx, ay: by, xref: 'x', yref: 'y', axref: 'x', ayref: 'y',
                    showarrow: true, arrowhead: 2, arrowwidth: 2, arrowcolor: '#22c55e',
                    text: 'a-b', dash: 'dot'
                });
            }

            container.querySelector('#vl-res').innerHTML = `
                <strong>计算过程:</strong><br>
                a - b = (${ax}-${bx}, ${ay}-${by})<br>
                = <strong>(${cx}, ${cy})</strong>
            `;
        } else if (mode === 'scale') {
            cx = lambda * ax;
            cy = lambda * ay;
            labelC = lambda + 'a';

            addVec(cx, cy, 'c', '#22c55e');

            container.querySelector('#vl-res').innerHTML = `
                <strong>计算过程:</strong><br>
                λ = ${lambda}, a = (${ax}, ${ay})<br>
                λa = (${lambda}×${ax}, ${lambda}×${ay})<br>
                = <strong>(${cx.toFixed(2)}, ${cy.toFixed(2)})</strong>
            `;
        }

        Plotly.newPlot('vl-viz', [], {
            title: '向量线性运算',
            xaxis: { range: [-10, 10], zeroline: true },
            yaxis: { range: [-10, 10], zeroline: true, scaleanchor: "x" },
            showlegend: false,
            margin: { t: 30, b: 30, l: 30, r: 20 },
            annotations: annotations,
            shapes: shapes
        }, { displayModeBar: false });
    }

    container.querySelectorAll('input, select').forEach(el => el.oninput = update);
    update();
}

// 3. Collinearity
function renderVectorCollinear(container) {
    container.innerHTML = `
        <h3>模块三：向量共线（平行）的判定</h3>
        <p>核心：向量共线条件（$x_1y_2 - x_2y_1=0$）与三点共线定理。</p>
        
        <div style="display:grid; grid-template-columns: 320px 1fr; gap:20px;">
            <div class="card" style="padding:15px; border:1px solid #e2e8f0; border-radius:8px;">
                <div style="margin-bottom:15px;">
                    <select id="vcol-mode" style="width:100%; padding:5px;">
                        <option value="vec">两向量共线判定</option>
                        <option value="pts">三点共线判定 (A, B, P)</option>
                    </select>
                </div>

                <div id="vcol-vec-inputs">
                    <h4>向量设置</h4>
                    <div style="margin-bottom:5px;">
                        a: x=<input type="number" id="vcol-ax" value="2" style="width:50px;">
                        y=<input type="number" id="vcol-ay" value="4" style="width:50px;">
                    </div>
                    <div style="margin-bottom:5px;">
                        b: x=<input type="number" id="vcol-bx" value="1" style="width:50px;">
                        y=<input type="number" id="vcol-by" value="2" style="width:50px;">
                    </div>
                </div>

                <div id="vcol-pts-inputs" style="display:none;">
                    <h4>点坐标设置</h4>
                    <div style="margin-bottom:5px;">A: (<input type="number" id="vcol-pax" value="1" style="width:40px;">, <input type="number" id="vcol-pay" value="1" style="width:40px;">)</div>
                    <div style="margin-bottom:5px;">B: (<input type="number" id="vcol-pbx" value="4" style="width:40px;">, <input type="number" id="vcol-pby" value="4" style="width:40px;">)</div>
                    <div style="margin-bottom:5px;">P: (<input type="number" id="vcol-ppx" value="2" style="width:40px;">, <input type="number" id="vcol-ppy" value="2" style="width:40px;">)</div>
                </div>

                <div id="vcol-res" style="background:#f1f5f9; padding:10px; border-radius:8px; font-size:14px; margin-top:15px;"></div>
            </div>
            
            <div id="vcol-viz" style="height:400px; border:1px solid #eee; border-radius:8px;"></div>
        </div>
    `;

    function update() {
        const mode = container.querySelector('#vcol-mode').value;
        const isVec = mode === 'vec';

        container.querySelector('#vcol-vec-inputs').style.display = isVec ? 'block' : 'none';
        container.querySelector('#vcol-pts-inputs').style.display = isVec ? 'none' : 'block';

        const annotations = [];
        const data = [];
        let layoutTitle = '';

        function addVec(vx, vy, label, color, opacity = 1) {
            annotations.push({
                x: vx, y: vy, ax: 0, ay: 0, xref: 'x', yref: 'y', axref: 'x', ayref: 'y',
                showarrow: true, arrowhead: 2, arrowwidth: 3, arrowcolor: color, opacity: opacity,
                text: label, textposition: 'top right', font: { color: color }
            });
        }

        if (isVec) {
            layoutTitle = '两向量共线判定';
            const ax = parseFloat(container.querySelector('#vcol-ax').value);
            const ay = parseFloat(container.querySelector('#vcol-ay').value);
            const bx = parseFloat(container.querySelector('#vcol-bx').value);
            const by = parseFloat(container.querySelector('#vcol-by').value);

            const det = ax * by - bx * ay;
            const isCollinear = Math.abs(det) < 1e-6;

            addVec(ax, ay, 'a', '#3b82f6');
            addVec(bx, by, 'b', '#ef4444', 0.5); // shift label slightly

            let lambdaText = '';
            if (isCollinear && (Math.abs(ax) > 1e-6 || Math.abs(ay) > 1e-6)) {
                // b = k*a
                let k;
                if (Math.abs(ax) > 1e-6) k = bx / ax;
                else k = by / ay;
                lambdaText = `<br>存在实数 λ = ${k.toFixed(2)}, 使得 b = λa`;
            }

            container.querySelector('#vcol-res').innerHTML = `
                <strong>判定条件:</strong> $x_1y_2 - x_2y_1 = 0$<br>
                计算: ${ax}×${by} - ${bx}×${ay} = <strong>${det.toFixed(4)}</strong><br>
                结论: <span style="color:${isCollinear ? 'green' : 'red'}">${isCollinear ? '共线 (平行)' : '不共线'}</span>
                ${lambdaText}
            `;

        } else {
            layoutTitle = '三点共线判定';
            const ax = parseFloat(container.querySelector('#vcol-pax').value);
            const ay = parseFloat(container.querySelector('#vcol-pay').value);
            const bx = parseFloat(container.querySelector('#vcol-pbx').value);
            const by = parseFloat(container.querySelector('#vcol-pby').value);
            const px = parseFloat(container.querySelector('#vcol-ppx').value);
            const py = parseFloat(container.querySelector('#vcol-ppy').value);

            // Vectors OA, OB, OP
            // Check if (P-A) // (B-A)
            // Vector AP = (px-ax, py-ay)
            // Vector AB = (bx-ax, by-ay)
            const apx = px - ax, apy = py - ay;
            const abx = bx - ax, aby = by - ay;

            const det = apx * aby - abx * apy;
            const isCollinear = Math.abs(det) < 1e-6;

            // Draw line AB
            data.push({
                x: [ax, bx], y: [ay, by], mode: 'lines', line: { color: '#94a3b8', dash: 'dash' }, name: 'Line AB'
            });

            // Draw points
            data.push({
                x: [ax, bx], y: [ay, by], mode: 'markers+text', text: ['A', 'B'],
                textposition: 'top center', marker: { size: 10, color: '#3b82f6' }, name: 'Ref Points'
            });
            data.push({
                x: [px], y: [py], mode: 'markers+text', text: ['P'],
                textposition: 'bottom center', marker: { size: 12, color: isCollinear ? '#22c55e' : '#ef4444' }, name: 'Point P'
            });

            let lambdaInfo = '';
            if (isCollinear) {
                // AP = t * AB => P - A = t(B - A) => P = (1-t)A + tB
                // t = |AP| / |AB| * sign
                // Easier: if ABx != 0, t = APx / ABx
                let t;
                if (Math.abs(abx) > 1e-6) t = apx / abx;
                else t = apy / aby;

                lambdaInfo = `<br>P分AB比 t = ${t.toFixed(2)}<br>
                满足 $\\overrightarrow{OP} = ${(1 - t).toFixed(2)}\\overrightarrow{OA} + ${t.toFixed(2)}\\overrightarrow{OB}$<br>
                系数和: ${(1 - t).toFixed(2)} + ${t.toFixed(2)} = 1`;
            }

            container.querySelector('#vcol-res').innerHTML = `
                <strong>判定:</strong> P是否在直线AB上?<br>
                向量AP = (${apx.toFixed(2)}, ${apy.toFixed(2)})<br>
                向量AB = (${abx.toFixed(2)}, ${aby.toFixed(2)})<br>
                叉积判定: ${det.toFixed(4)} ${isCollinear ? '≈ 0' : '≠ 0'}<br>
                结论: <span style="color:${isCollinear ? 'green' : 'red'}">${isCollinear ? '三点共线' : '不共线'}</span>
                ${lambdaInfo}
            `;
        }

        Plotly.newPlot('vcol-viz', data, {
            title: layoutTitle,
            xaxis: { range: [-1, 8], zeroline: true },
            yaxis: { range: [-1, 8], zeroline: true, scaleanchor: "x" },
            showlegend: false,
            margin: { t: 30, b: 30, l: 30, r: 20 },
            annotations: annotations,
            hovermode: 'closest'
        }, { displayModeBar: false });

        if (window.MathJax) MathJax.typesetPromise();
    }

    container.querySelectorAll('input, select').forEach(el => el.oninput = update);
    update();
}

// 4. Dot Product & Projection
function renderVectorDotProduct(container) {
    container.innerHTML = `
        <h3>模块四：平面向量数量积的定义与投影</h3>
        <p>核心：数量积定义 $\\vec{a} \\cdot \\vec{b} = |\\vec{a}||\\vec{b}|\\cos\\theta$ 与投影。</p>
        
        <div style="display:grid; grid-template-columns: 320px 1fr; gap:20px;">
            <div class="card" style="padding:15px; border:1px solid #e2e8f0; border-radius:8px;">
                <div style="margin-bottom:10px;">
                    <strong>向量 a:</strong> 
                    x=<input type="number" id="vdp-ax" value="3" style="width:50px;">
                    y=<input type="number" id="vdp-ay" value="0" style="width:50px;">
                </div>
                <div style="margin-bottom:10px;">
                    <strong>向量 b:</strong> 
                    x=<input type="number" id="vdp-bx" value="2" style="width:50px;">
                    y=<input type="number" id="vdp-by" value="2" style="width:50px;">
                </div>
                
                <div style="margin-bottom:10px;">
                    <label><input type="checkbox" id="vdp-show-proj" checked> 显示投影</label><br>
                    <label><input type="checkbox" id="vdp-swap-proj"> 切换投影方向 (b在a上)</label>
                </div>

                <div id="vdp-res" style="background:#f1f5f9; padding:10px; border-radius:8px; font-size:14px;"></div>
            </div>
            
            <div id="vdp-viz" style="height:400px; border:1px solid #eee; border-radius:8px;"></div>
        </div>
    `;

    function update() {
        const ax = parseFloat(container.querySelector('#vdp-ax').value);
        const ay = parseFloat(container.querySelector('#vdp-ay').value);
        const bx = parseFloat(container.querySelector('#vdp-bx').value);
        const by = parseFloat(container.querySelector('#vdp-by').value);
        const showProj = container.querySelector('#vdp-show-proj').checked;
        const swap = container.querySelector('#vdp-swap-proj').checked;

        // Dot Product
        const dot = ax * bx + ay * by;
        const magA = Math.sqrt(ax * ax + ay * ay);
        const magB = Math.sqrt(bx * bx + by * by);
        const cosTheta = dot / (magA * magB);
        const thetaRad = Math.acos(Math.min(Math.max(cosTheta, -1), 1));
        const thetaDeg = thetaRad * 180 / Math.PI;

        const annotations = [];
        const shapes = [];

        function addVec(vx, vy, label, color) {
            annotations.push({
                x: vx, y: vy, ax: 0, ay: 0, xref: 'x', yref: 'y', axref: 'x', ayref: 'y',
                showarrow: true, arrowhead: 2, arrowwidth: 3, arrowcolor: color,
                text: label, textposition: 'top right', font: { color: color }
            });
        }

        addVec(ax, ay, 'a', '#3b82f6');
        addVec(bx, by, 'b', '#ef4444');

        if (showProj) {
            let u, v, magU; // u is the vector being projected onto, v is the vector being projected
            let ux, uy, vx, vy;

            if (!swap) { // Projection of b onto a
                ux = ax; uy = ay; vx = bx; vy = by;
                magU = magA;
            } else { // Projection of a onto b
                ux = bx; uy = by; vx = ax; vy = ay;
                magU = magB;
            }

            // Projection vector p = (v . u / |u|^2) * u
            const scale = (vx * ux + vy * uy) / (magU * magU);
            const px = scale * ux;
            const py = scale * uy;

            annotations.push({
                x: px, y: py, ax: 0, ay: 0, xref: 'x', yref: 'y', axref: 'x', ayref: 'y',
                showarrow: true, arrowhead: 2, arrowwidth: 4, arrowcolor: '#22c55e',
                text: 'Proj', textposition: 'bottom right', font: { color: '#22c55e' }
            });

            // Perpendicular line from v to p
            shapes.push({
                type: 'line', x0: vx, y0: vy, x1: px, y1: py,
                line: { color: '#94a3b8', dash: 'dot' }
            });
        }

        container.querySelector('#vdp-res').innerHTML = `
            <strong>计算结果:</strong><br>
            $\\vec{a} \\cdot \\vec{b} = x_1x_2 + y_1y_2$<br>
            = ${ax}×${bx} + ${ay}×${by} = <strong>${dot.toFixed(2)}</strong><br>
            $|\\vec{a}| = ${magA.toFixed(2)}, |\\vec{b}| = ${magB.toFixed(2)}$<br>
            $\\cos\\theta = ${cosTheta.toFixed(3)} \\Rightarrow \\theta \\approx ${thetaDeg.toFixed(1)}^\\circ$
        `;

        Plotly.newPlot('vdp-viz', [], {
            title: '数量积与投影',
            xaxis: { range: [-5, 8], zeroline: true },
            yaxis: { range: [-5, 8], zeroline: true, scaleanchor: "x" },
            showlegend: false,
            margin: { t: 30, b: 30, l: 30, r: 20 },
            annotations: annotations,
            shapes: shapes
        }, { displayModeBar: false });

        if (window.MathJax) MathJax.typesetPromise();
    }

    container.querySelectorAll('input').forEach(el => el.oninput = update);
    update();
}

// 5. Properties (Angle & Perpendicularity)
function renderVectorProperties(container) {
    container.innerHTML = `
        <h3>模块五：向量夹角与性质</h3>
        <p>探究向量夹角公式 $\\cos\\theta = \\frac{\\vec{a} \\cdot \\vec{b}}{|\\vec{a}||\\vec{b}|}$ 及模的不等式性质。</p>
        
        <div style="display:grid; grid-template-columns: 300px 1fr; gap:20px;">
            <div class="card" style="padding:15px; border:1px solid #e2e8f0; border-radius:8px;">
                <div style="margin-bottom:15px;">
                    <strong>向量 a:</strong> 
                    x=<input type="number" id="vprop-ax" value="3" style="width:50px;">
                    y=<input type="number" id="vprop-ay" value="0" style="width:50px;">
                </div>
                <div style="margin-bottom:15px;">
                    <strong>向量 b:</strong> 
                    x=<input type="number" id="vprop-bx" value="1" style="width:50px;">
                    y=<input type="number" id="vprop-by" value="2" style="width:50px;">
                </div>
                
                <div id="vprop-res" style="background:#f1f5f9; padding:10px; border-radius:8px; font-size:14px; line-height:1.6;"></div>
            </div>
            
            <div id="vprop-viz" style="height:400px; border:1px solid #eee; border-radius:8px;"></div>
        </div>
    `;

    function update() {
        const ax = parseFloat(container.querySelector('#vprop-ax').value);
        const ay = parseFloat(container.querySelector('#vprop-ay').value);
        const bx = parseFloat(container.querySelector('#vprop-bx').value);
        const by = parseFloat(container.querySelector('#vprop-by').value);

        const dot = ax * bx + ay * by;
        const magA = Math.sqrt(ax * ax + ay * ay);
        const magB = Math.sqrt(bx * bx + by * by);
        const cosTheta = dot / (magA * magB);
        const thetaRad = Math.acos(Math.min(Math.max(cosTheta, -1), 1));
        const thetaDeg = thetaRad * 180 / Math.PI;

        // Visual
        const annotations = [
            {
                x: ax, y: ay, ax: 0, ay: 0, xref: 'x', yref: 'y', axref: 'x', ayref: 'y',
                showarrow: true, arrowhead: 2, arrowwidth: 3, arrowcolor: '#3b82f6', text: 'a'
            },
            {
                x: bx, y: by, ax: 0, ay: 0, xref: 'x', yref: 'y', axref: 'x', ayref: 'y',
                showarrow: true, arrowhead: 2, arrowwidth: 3, arrowcolor: '#ef4444', text: 'b'
            }
        ];

        // Status
        let status = '';
        if (Math.abs(dot) < 1e-6) status = '<span style="color:red">两向量垂直 (a ⊥ b)</span>';
        else if (Math.abs(cosTheta - 1) < 1e-6) status = '<span style="color:green">两向量同向共线</span>';
        else if (Math.abs(cosTheta + 1) < 1e-6) status = '<span style="color:green">两向量反向共线</span>';
        else if (dot > 0) status = '夹角为锐角';
        else status = '夹角为钝角';

        container.querySelector('#vprop-res').innerHTML = `
            数量积: ${dot.toFixed(2)}<br>
            夹角: <strong>${thetaDeg.toFixed(1)}°</strong><br>
            判定: ${status}<br>
            <br>
            <strong>模的性质:</strong><br>
            |a+b| = ${Math.sqrt((ax + bx) ** 2 + (ay + by) ** 2).toFixed(2)}<br>
            |a|+|b| = ${(magA + magB).toFixed(2)}<br>
            符合三角形不等式 $|a+b| \\le |a|+|b|$
        `;

        Plotly.newPlot('vprop-viz', [], {
            title: '向量夹角与性质',
            xaxis: { range: [-5, 8], zeroline: true },
            yaxis: { range: [-5, 8], zeroline: true, scaleanchor: "x" },
            showlegend: false,
            margin: { t: 30, b: 30, l: 30, r: 20 },
            annotations: annotations
        }, { displayModeBar: false });

        if (window.MathJax) MathJax.typesetPromise();
    }

    container.querySelectorAll('input').forEach(el => el.oninput = update);
    update();
}

// 6. Decomposition (Basis Theorem)
function renderVectorDecomposition(container) {
    container.innerHTML = `
        <h3>模块六：平面向量基本定理</h3>
        <p>如果 $e_1, e_2$ 是同一平面内的两个不共线向量，那么对于这一平面内的任一向量 $a$，有且只有一对实数 $\\lambda_1, \\lambda_2$，使 $a = \\lambda_1 e_1 + \\lambda_2 e_2$。</p>
        
        <div style="display:grid; grid-template-columns: 300px 1fr; gap:20px;">
            <div class="card" style="padding:15px; border:1px solid #e2e8f0; border-radius:8px;">
                <h4>基底设置</h4>
                <div style="margin-bottom:10px;">
                    e1: (<input type="number" id="vdec-e1x" value="2" style="width:40px;">, <input type="number" id="vdec-e1y" value="0" style="width:40px;">)
                </div>
                <div style="margin-bottom:10px;">
                    e2: (<input type="number" id="vdec-e2x" value="1" style="width:40px;">, <input type="number" id="vdec-e2y" value="2" style="width:40px;">)
                </div>
                
                <h4>目标向量 a</h4>
                <div style="margin-bottom:10px;">
                    a: (<input type="number" id="vdec-ax" value="4" style="width:40px;">, <input type="number" id="vdec-ay" value="2" style="width:40px;">)
                </div>

                <div id="vdec-res" style="background:#f1f5f9; padding:10px; border-radius:8px; font-size:14px; margin-top:10px;"></div>
            </div>
            
            <div id="vdec-viz" style="height:450px; border:1px solid #eee; border-radius:8px;"></div>
        </div>
    `;

    function update() {
        const e1x = parseFloat(container.querySelector('#vdec-e1x').value);
        const e1y = parseFloat(container.querySelector('#vdec-e1y').value);
        const e2x = parseFloat(container.querySelector('#vdec-e2x').value);
        const e2y = parseFloat(container.querySelector('#vdec-e2y').value);
        const ax = parseFloat(container.querySelector('#vdec-ax').value);
        const ay = parseFloat(container.querySelector('#vdec-ay').value);

        // Solve System:
        // ax = L1 * e1x + L2 * e2x
        // ay = L1 * e1y + L2 * e2y
        // Cramer's Rule
        const D = e1x * e2y - e2x * e1y;

        let msg = '';
        const annotations = [];
        const shapes = [];

        function addVec(vx, vy, label, color) {
            annotations.push({
                x: vx, y: vy, ax: 0, ay: 0, xref: 'x', yref: 'y', axref: 'x', ayref: 'y',
                showarrow: true, arrowhead: 2, arrowwidth: 3, arrowcolor: color,
                text: label, textposition: 'top right', font: { color: color }
            });
        }

        addVec(e1x, e1y, 'e1', '#94a3b8');
        addVec(e2x, e2y, 'e2', '#94a3b8');
        addVec(ax, ay, 'a', '#3b82f6');

        if (Math.abs(D) < 1e-6) {
            msg = '<span style="color:red">错误：基底 e1, e2 共线，无法作为基底。</span>';
        } else {
            const D1 = ax * e2y - e2x * ay;
            const D2 = e1x * ay - ax * e1y;
            const L1 = D1 / D;
            const L2 = D2 / D;

            msg = `
                分解结果:<br>
                $a = ${L1.toFixed(2)} e_1 + ${L2.toFixed(2)} e_2$<br>
                (唯一的实数对)
            `;

            // Visualization of components
            const v1x = L1 * e1x;
            const v1y = L1 * e1y;
            const v2x = L2 * e2x;
            const v2y = L2 * e2y;

            // Parallelogram
            shapes.push({
                type: 'line', x0: v1x, y0: v1y, x1: ax, y1: ay,
                line: { color: '#94a3b8', dash: 'dash' }
            });
            shapes.push({
                type: 'line', x0: v2x, y0: v2y, x1: ax, y1: ay,
                line: { color: '#94a3b8', dash: 'dash' }
            });

            annotations.push({
                x: v1x, y: v1y, ax: 0, ay: 0, xref: 'x', yref: 'y', axref: 'x', ayref: 'y',
                showarrow: true, arrowhead: 2, arrowwidth: 2, arrowcolor: '#22c55e',
                text: L1.toFixed(1) + 'e1'
            });
            annotations.push({
                x: v2x, y: v2y, ax: 0, ay: 0, xref: 'x', yref: 'y', axref: 'x', ayref: 'y',
                showarrow: true, arrowhead: 2, arrowwidth: 2, arrowcolor: '#22c55e',
                text: L2.toFixed(1) + 'e2'
            });
        }

        container.querySelector('#vdec-res').innerHTML = msg;

        Plotly.newPlot('vdec-viz', [], {
            title: '平面向量基本定理',
            xaxis: { range: [-5, 8], zeroline: true },
            yaxis: { range: [-5, 8], zeroline: true, scaleanchor: "x" },
            showlegend: false,
            margin: { t: 30, b: 30, l: 30, r: 20 },
            annotations: annotations,
            shapes: shapes,
            hovermode: 'closest'
        }, { displayModeBar: false });

        if (window.MathJax) MathJax.typesetPromise();
    }

    container.querySelectorAll('input').forEach(el => el.oninput = update);
    update();
}

// 7. Triangle Centers
function renderVectorTriangleCenters(container) {
    container.innerHTML = `
        <h3>模块七：三角形四心与向量性质</h3>
        <p>通过向量运算寻找三角形的重心、垂心、外心、内心，并验证欧拉线。</p>
        
        <div style="display:grid; grid-template-columns: 260px 1fr; gap:20px;">
            <div class="card" style="padding:15px; border:1px solid #e2e8f0; border-radius:8px;">
                <p style="font-size:13px; color:gray;">拖动顶点调整三角形 (暂不支持拖动，请用输入框)</p>
                <div style="margin-bottom:5px;">A: (<input type="number" id="vtc-ax" value="1" style="width:40px;">, <input type="number" id="vtc-ay" value="5" style="width:40px;">)</div>
                <div style="margin-bottom:5px;">B: (<input type="number" id="vtc-bx" value="-2" style="width:40px;">, <input type="number" id="vtc-by" value="-1" style="width:40px;">)</div>
                <div style="margin-bottom:5px;">C: (<input type="number" id="vtc-cx" value="6" style="width:40px;">, <input type="number" id="vtc-cy" value="-1" style="width:40px;">)</div>
                
                <div style="margin-top:15px;">
                    <label><input type="checkbox" id="vtc-show-g" checked> 重心 (G)</label><br>
                    <label><input type="checkbox" id="vtc-show-h" checked> 垂心 (H)</label><br>
                    <label><input type="checkbox" id="vtc-show-o" checked> 外心 (O)</label><br>
                    <label><input type="checkbox" id="vtc-show-i"> 内心 (I)</label><br>
                    <label><input type="checkbox" id="vtc-euler" checked> 显示欧拉线</label>
                </div>
            </div>
            
            <div id="vtc-viz" style="height:450px; border:1px solid #eee; border-radius:8px;"></div>
        </div>
    `;

    function update() {
        const ax = parseFloat(container.querySelector('#vtc-ax').value);
        const ay = parseFloat(container.querySelector('#vtc-ay').value);
        const bx = parseFloat(container.querySelector('#vtc-bx').value);
        const by = parseFloat(container.querySelector('#vtc-by').value);
        const cx = parseFloat(container.querySelector('#vtc-cx').value);
        const cy = parseFloat(container.querySelector('#vtc-cy').value);

        const showG = container.querySelector('#vtc-show-g').checked;
        const showH = container.querySelector('#vtc-show-h').checked;
        const showO = container.querySelector('#vtc-show-o').checked;
        const showI = container.querySelector('#vtc-show-i').checked;
        const showEuler = container.querySelector('#vtc-euler').checked;

        const data = [
            {
                x: [ax, bx, cx, ax], y: [ay, by, cy, ay],
                mode: 'lines+markers', line: { color: '#94a3b8' }, name: 'Triangle'
            }
        ];

        const annotations = [
            { x: ax, y: ay, text: 'A', showarrow: false, yshift: 10 },
            { x: bx, y: by, text: 'B', showarrow: false, yshift: -10 },
            { x: cx, y: cy, text: 'C', showarrow: false, yshift: -10 }
        ];

        // 1. Centroid (G): (A+B+C)/3
        const gx = (ax + bx + cx) / 3;
        const gy = (ay + by + cy) / 3;
        if (showG) {
            data.push({ x: [gx], y: [gy], mode: 'markers', marker: { color: 'orange', size: 8 }, name: 'Centroid' });
            annotations.push({ x: gx, y: gy, text: 'G', showarrow: true, arrowcolor: 'orange' });
        }

        // 2. Circumcenter (O)
        // Midpoints of AB and BC
        // Perpendicular bisectors intersection
        // D = 2(Ax(By - Cy) + Bx(Cy - Ay) + Cx(Ay - By))
        const D = 2 * (ax * (by - cy) + bx * (cy - ay) + cx * (ay - by));
        const ox = ((ax * ax + ay * ay) * (by - cy) + (bx * bx + by * by) * (cy - ay) + (cx * cx + cy * cy) * (ay - by)) / D;
        const oy = ((ax * ax + ay * ay) * (cx - bx) + (bx * bx + by * by) * (ax - cx) + (cx * cx + cy * cy) * (bx - ax)) / D;

        if (showO) {
            data.push({ x: [ox], y: [oy], mode: 'markers', marker: { color: 'blue', size: 8 }, name: 'Circumcenter' });
            annotations.push({ x: ox, y: oy, text: 'O', showarrow: true, arrowcolor: 'blue' });

            // Draw Circle
            const R = Math.sqrt((ox - ax) ** 2 + (oy - ay) ** 2);
            // Plotly doesn't have circle shape easily without SVG paths or many points
            // Using shapes circle
        }

        // 3. Orthocenter (H)
        // H = A + B + C - 2*O (Vector relationship OH = 3OG)
        // Or simply AH dot BC = 0, BH dot AC = 0
        // Euler line property: O, G, H collinear, GH = 2OG => H - G = 2(G - O) => H = 3G - 2O
        const hx = 3 * gx - 2 * ox;
        const hy = 3 * gy - 2 * oy;

        if (showH) {
            data.push({ x: [hx], y: [hy], mode: 'markers', marker: { color: 'purple', size: 8 }, name: 'Orthocenter' });
            annotations.push({ x: hx, y: hy, text: 'H', showarrow: true, arrowcolor: 'purple' });
        }

        // 4. Incenter (I)
        const aLen = Math.sqrt((bx - cx) ** 2 + (by - cy) ** 2);
        const bLen = Math.sqrt((ax - cx) ** 2 + (ay - cy) ** 2);
        const cLen = Math.sqrt((ax - bx) ** 2 + (ay - by) ** 2);
        const P = aLen + bLen + cLen;
        const ix = (aLen * ax + bLen * bx + cLen * cx) / P;
        const iy = (aLen * ay + bLen * by + cLen * cy) / P;

        if (showI) {
            data.push({ x: [ix], y: [iy], mode: 'markers', marker: { color: 'green', size: 8 }, name: 'Incenter' });
            annotations.push({ x: ix, y: iy, text: 'I', showarrow: true, arrowcolor: 'green' });
        }

        if (showEuler && showO && showG && showH) {
            data.push({
                x: [ox, hx], y: [oy, hy],
                mode: 'lines', line: { color: 'red', dash: 'dash' }, name: 'Euler Line'
            });
        }

        Plotly.newPlot('vtc-viz', data, {
            title: '三角形四心',
            xaxis: { range: [-5, 8], zeroline: false },
            yaxis: { range: [-5, 8], zeroline: false, scaleanchor: "x" },
            showlegend: true,
            margin: { t: 30, b: 30, l: 30, r: 20 },
            annotations: annotations,
            shapes: showO ? [{
                type: 'circle',
                xref: 'x', yref: 'y',
                x0: ox - Math.sqrt((ox - ax) ** 2 + (oy - ay) ** 2),
                y0: oy - Math.sqrt((ox - ax) ** 2 + (oy - ay) ** 2),
                x1: ox + Math.sqrt((ox - ax) ** 2 + (oy - ay) ** 2),
                y1: oy + Math.sqrt((ox - ax) ** 2 + (oy - ay) ** 2),
                line: { color: 'blue', dash: 'dot', width: 1 }
            }] : []
        }, { displayModeBar: false });
    }

    container.querySelectorAll('input').forEach(el => el.oninput = update);
    setTimeout(update, 50);
}

// 8. Applications (Force Synthesis)
function renderVectorApplications(container) {
    container.innerHTML = `
        <h3>模块八：向量综合应用</h3>
        <p>应用：物理中的力合成与分解。</p>
        
        <div style="display:grid; grid-template-columns: 300px 1fr; gap:20px;">
            <div class="card" style="padding:15px; border:1px solid #e2e8f0; border-radius:8px;">
                <h4>力的合成</h4>
                <div style="margin-bottom:10px;">
                    力 F1 (N): <input type="number" id="vapp-f1" value="5" style="width:60px;"> 
                    角度: <input type="number" id="vapp-a1" value="30" style="width:60px;">°
                </div>
                <div style="margin-bottom:10px;">
                    力 F2 (N): <input type="number" id="vapp-f2" value="4" style="width:60px;"> 
                    角度: <input type="number" id="vapp-a2" value="120" style="width:60px;">°
                </div>
                
                <div id="vapp-res" style="background:#f1f5f9; padding:10px; border-radius:8px; font-size:14px; margin-top:10px;"></div>
            </div>
            
            <div id="vapp-viz" style="height:400px; border:1px solid #eee; border-radius:8px;"></div>
        </div>
    `;

    function update() {
        const f1 = parseFloat(container.querySelector('#vapp-f1').value);
        const a1 = parseFloat(container.querySelector('#vapp-a1').value);
        const f2 = parseFloat(container.querySelector('#vapp-f2').value);
        const a2 = parseFloat(container.querySelector('#vapp-a2').value);

        const r1 = a1 * Math.PI / 180;
        const r2 = a2 * Math.PI / 180;

        const f1x = f1 * Math.cos(r1);
        const f1y = f1 * Math.sin(r1);
        const f2x = f2 * Math.cos(r2);
        const f2y = f2 * Math.sin(r2);

        const rx = f1x + f2x;
        const ry = f1y + f2y;
        const rMag = Math.sqrt(rx * rx + ry * ry);
        let rAng = Math.atan2(ry, rx) * 180 / Math.PI;
        if (rAng < 0) rAng += 360;

        container.querySelector('#vapp-res').innerHTML = `
            <strong>合力 F:</strong><br>
            大小: ${rMag.toFixed(2)} N<br>
            方向: ${rAng.toFixed(1)}°
        `;

        const annotations = [];
        const shapes = [];

        function addVec(vx, vy, label, color) {
            annotations.push({
                x: vx, y: vy, ax: 0, ay: 0, xref: 'x', yref: 'y', axref: 'x', ayref: 'y',
                showarrow: true, arrowhead: 2, arrowwidth: 3, arrowcolor: color,
                text: label, textposition: 'top right', font: { color: color }
            });
        }

        addVec(f1x, f1y, 'F1', '#3b82f6');
        addVec(f2x, f2y, 'F2', '#ef4444');
        addVec(rx, ry, 'F合', '#22c55e');

        // Parallelogram dashed lines
        shapes.push({
            type: 'line', x0: f1x, y0: f1y, x1: rx, y1: ry,
            line: { color: '#94a3b8', dash: 'dash' }
        });
        shapes.push({
            type: 'line', x0: f2x, y0: f2y, x1: rx, y1: ry,
            line: { color: '#94a3b8', dash: 'dash' }
        });

        Plotly.newPlot('vapp-viz', [], {
            title: '力的合成与分解',
            xaxis: { range: [-10, 10], zeroline: true },
            yaxis: { range: [-10, 10], zeroline: true, scaleanchor: "x" },
            showlegend: false,
            margin: { t: 30, b: 30, l: 30, r: 20 },
            annotations: annotations,
            shapes: shapes,
            hovermode: 'closest'
        }, { displayModeBar: false });
    }

    container.querySelectorAll('input').forEach(el => el.oninput = update);
    setTimeout(update, 50);
}

// =============================================================================
// RAG 知识检索功能
// =============================================================================

// RAG 状态缓存
const RAGState = {
    topics: [],
    searchResults: [],
    isReady: false
};

/**
 * 获取并更新 RAG 服务状态
 */
async function updateRAGStatus() {
    try {
        const status = await fetchJSON('/rag/status');
        const statusInfo = $('ragStatusInfo');
        if (statusInfo) {
            statusInfo.innerHTML = `
                <div style="display:flex; flex-direction:column; gap:8px;">
                    <div style="display:flex; align-items:center; gap:8px;">
                        <div style="width:8px; height:8px; border-radius:50%; background:${status.ready ? '#22c55e' : '#ef4444'};"></div>
                        <span>状态: ${status.ready ? '已就绪' : '未准备好'}</span>
                    </div>
                    <div style="font-size:13px; opacity:0.8;">
                        <i data-lucide="database" size="14"></i> 索引文档: ${status.document_count}
                    </div>
                    <div style="font-size:13px; opacity:0.8;">
                        <i data-lucide="layers" size="14"></i> 知识主题: ${status.topics}
                    </div>
                </div>
            `;
            if (window.lucide) lucide.createIcons();
        }
        RAGState.isReady = status.ready;
    } catch (e) {
        console.error('获取 RAG 状态失败:', e);
    }
}

/**
 * 加载 RAG 知识主题列表
 */
async function loadRAGTopics() {
    try {
        const topics = await fetchJSON('/rag/topics');
        RAGState.topics = topics;

        const container = $('ragTopicsContainer');
        if (!container) return;

        container.innerHTML = '';

        topics.forEach(topic => {
            const itemEl = document.createElement('div');
            itemEl.className = 'tree-item rag-topic-item';
            itemEl.style.cssText = 'padding:8px 12px; display:flex; align-items:center; gap:8px; cursor:pointer; border-radius:8px; transition:background 0.2s;';
            itemEl.innerHTML = `
                <i data-lucide="${topic.icon || 'book-open'}" size="16" style="color:var(--accent);"></i>
                <span style="flex:1;">${topic.name}</span>
                <span style="font-size:11px; color:var(--muted); background:var(--surface); padding:2px 6px; border-radius:4px;">${topic.count || 0}</span>
            `;
            itemEl.onclick = () => searchByTopic(topic.name);
            itemEl.onmouseenter = () => itemEl.style.background = 'var(--surface)';
            itemEl.onmouseleave = () => itemEl.style.background = 'transparent';
            container.appendChild(itemEl);
        });

        if (window.lucide) lucide.createIcons();
    } catch (e) {
        console.error('加载知识主题失败:', e);
    }
}

/**
 * 执行 RAG 知识搜索
 */
async function performRAGSearch() {
    const input = $('ragSearchInput');
    if (!input) return;

    const query = input.value.trim();
    if (!query) return;

    try {
        // 显示加载状态
        const mainContent = $('dynamicMainContent');
        if (mainContent) {
            mainContent.innerHTML = `
                <div class="headline-section">
                    <h1>搜索结果</h1>
                    <p>正在搜索 "${query}"...</p>
                </div>
                <div style="display:flex; justify-content:center; padding:40px;">
                    <div class="loading-spinner" style="width:40px; height:40px; border:3px solid var(--border); border-top-color:var(--accent); border-radius:50%; animation:spin 1s linear infinite;"></div>
                </div>
            `;
        }

        const result = await fetchJSON(`/rag/search?q=${encodeURIComponent(query)}&top_k=10`);
        RAGState.searchResults = result.results || [];

        renderRAGSearchResults(query, result);
    } catch (e) {
        console.error('RAG 搜索失败:', e);
    }
}

/**
 * 按主题搜索
 */
async function searchByTopic(topicName) {
    try {
        const mainContent = $('dynamicMainContent');
        if (mainContent) {
            mainContent.innerHTML = `
                <div class="headline-section">
                    <h1>${topicName}</h1>
                    <p>加载主题内容...</p>
                </div>
            `;
        }

        const result = await fetchJSON(`/rag/search?q=${encodeURIComponent(topicName)}&top_k=15&topic=${encodeURIComponent(topicName)}`);
        renderRAGSearchResults(topicName, result);
    } catch (e) {
        console.error('按主题搜索失败:', e);
    }
}

/**
 * 渲染 RAG 搜索结果
 */
function renderRAGSearchResults(query, result) {
    const wrapper = $('ragSearchResultsWrapper');
    const container = wrapper || $('dynamicMainContent');
    if (!container) return;

    container.innerHTML = `
        <div class="headline-section" style="${wrapper ? 'margin-top:20px;' : ''}">
            <h3>${wrapper ? '检索结果' : '知识库检索'}</h3>
            <p>找到 ${result.count || 0} 个与 "${query}" 相关的知识点</p>
        </div>
    `;

    if (!result.results || result.results.length === 0) {
        container.innerHTML += `
            <div class="dashboard-card" style="padding:40px; text-align:center; color:var(--muted);">
                <i data-lucide="search-x" size="48" style="opacity:0.3;"></i>
                <p style="margin-top:16px;">未找到相关内容</p>
                <p style="font-size:13px;">尝试使用不同的关键词搜索</p>
            </div>
        `;
    } else {
        const resultsGrid = document.createElement('div');
        resultsGrid.className = 'rag-results-grid';

        result.results.forEach((r, idx) => {
            const card = document.createElement('div');
            card.className = 'rag-result-card';

            // 计算相似度颜色
            const scoreColor = r.score > 0.7 ? '#22c55e' : r.score > 0.4 ? '#f59e0b' : '#94a3b8';
            const scoreLabel = Math.round((r.score || 0) * 100);

            card.innerHTML = `
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                    <span class="rag-topic-badge">${r.topic}</span>
                    <span class="rag-match-score" style="color:${scoreColor};">
                        匹配度 ${scoreLabel}%
                    </span>
                </div>
                <div class="rag-content-preview">
                    ${highlightKeywords(r.content, query)}
                </div>
                <div class="rag-card-footer">
                    <span class="rag-source-info">
                        <i data-lucide="file-text" size="14"></i> ${r.source}
                    </span>
                    <button class="rag-use-btn" onclick="useInChat('${escapeHtml(r.content.substring(0, 150))}')">
                        在对话中使用
                    </button>
                </div>
            `;
            resultsGrid.appendChild(card);
        });

        container.appendChild(resultsGrid);
    }

    if (window.lucide) lucide.createIcons();
}

/**
 * 高亮搜索关键词
 */
function highlightKeywords(text, query) {
    if (!query) return escapeHtml(text);
    const escaped = escapeHtml(text);
    const regex = new RegExp(`(${query.split(/\s+/).join('|')})`, 'gi');
    return escaped.replace(regex, '<mark style="background:rgba(var(--accent-rgb),0.2); padding:0 2px; border-radius:2px;">$1</mark>');
}

/**
 * HTML 转义
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * 在对话中使用检索结果
 */
function useInChat(content) {
    setMode('chat');
    const input = $('mainInput');
    if (input) {
        input.value = `请解释：${content}...`;
        input.focus();
    }
}

// =============================================================================
// RAG 增强的 AI 对话
// =============================================================================

/**
 * 发送 RAG 增强的消息
 */
async function sendRAGMessage(message) {
    if (!message.trim()) return;

    setMode('chat');
    addChatMessage('user', message);

    // 显示加载动画
    const loadingId = 'loading-' + Date.now();
    addLoadingMessage(loadingId);

    try {
        const result = await postJSON('/rag/chat', {
            message: message,
            history: []
        });

        // 移除加载动画
        removeLoadingMessage(loadingId);

        // 显示 AI 回复
        let replyContent = result.content || '抱歉，我无法处理这个请求。';

        // 如果有 RAG 来源，显示参考信息
        if (result.rag_sources && result.rag_sources.length > 0) {
            replyContent += '\n\n📚 **参考来源：**\n';
            result.rag_sources.forEach(src => {
                replyContent += `- ${src.topic} (${src.source})\n`;
            });
        }

        addChatMessage('ai', replyContent);

        // 如果有可视化代码，渲染它
        if (result.viz_code) {
            renderPlotly(result.viz_code, result.viz_type || 'cartesian_plot');
        }

    } catch (e) {
        removeLoadingMessage(loadingId);
        addChatMessage('ai', `❌ 发生错误：${e.message}`);
    }
}

/**
 * 添加加载消息
 */
function addLoadingMessage(id) {
    const log = $('chatMessages');
    const div = document.createElement('div');
    div.id = id;
    div.style.cssText = 'margin-bottom:16px; display:flex; gap:12px;';
    div.innerHTML = `
        <div style="width:36px; height:36px; background:var(--accent); border-radius:12px; display:flex; align-items:center; justify-content:center; color:white;">A</div>
        <div style="background:var(--surface); padding:12px 16px; border-radius:16px; display:flex; align-items:center; gap:8px;">
            <div class="loading-dots">
                <span></span><span></span><span></span>
            </div>
            <span style="color:var(--muted); font-size:13px;">正在思考...</span>
        </div>
    `;
    log.appendChild(div);
    log.scrollTop = log.scrollHeight;
}

/**
 * 移除加载消息
 */
function removeLoadingMessage(id) {
    const el = document.getElementById(id);
    if (el) el.remove();
}

/**
 * 渲染 Plotly 可视化
 */
async function renderPlotly(code, type) {
    console.log("Rendering Plotly for type:", type);

    // 如果是对话模式，我们尝试在右侧展示，同时在对话中给一个视觉反馈
    setMode('chat');

    // 准备渲染容器
    const plotContainer = $('plotlyDiv');
    const viewTitle = $('viewTitle');
    if (viewTitle) viewTitle.innerText = "AI 生成的可视化探索";

    // 显示加载状态
    plotContainer.innerHTML = '<div style="display:flex; height:100%; align-items:center; justify-content:center; color:var(--muted);">正在解析数学模型并生成图像...</div>';

    try {
        const result = await postJSON('/api/viz/render', { code: code });
        if (result.success && result.fig_json) {
            // 使用 Plotly.js 渲染
            Plotly.newPlot(plotContainer, result.fig_json.data, result.fig_json.layout, { responsive: true, displayModeBar: false });

            // 同步调整大小
            setTimeout(() => {
                Plotly.Plots.resize(plotContainer);
            }, 100);
        } else {
            plotContainer.innerHTML = `<div style="padding:20px; color:#ef4444;">可视化生成失败: ${result.error || '未知错误'}</div>`;
        }
    } catch (e) {
        console.error("Plotly rendering error:", e);
        plotContainer.innerHTML = `<div style="padding:20px; color:#ef4444;">跨端渲染时发生异常: ${e.message}</div>`;
    }
}

// =============================================================================
// 更新原有的消息发送逻辑
// =============================================================================

// 覆盖原有的 handleSendMessage 函数，使用 RAG 增强
const originalHandleSendMessage = typeof handleSendMessage !== 'undefined' ? handleSendMessage : null;

async function handleSendMessageWithRAG() {
    const input = $('mainInput');
    const text = input.value.trim();
    if (!text) return;

    input.value = '';
    await sendRAGMessage(text);
}

// 初始化时绑定新的处理函数
document.addEventListener('DOMContentLoaded', () => {
    const sendBtn = $('sendBtn');
    if (sendBtn) {
        sendBtn.onclick = handleSendMessageWithRAG;
    }

    const mainInput = $('mainInput');
    if (mainInput) {
        mainInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessageWithRAG();
            }
        });
    }

    // AI 弹窗对话也使用 RAG
    const aiChatSend = $('aiChatSend');
    if (aiChatSend) {
        aiChatSend.onclick = async () => {
            const input = $('aiChatInput');
            const text = input.value.trim();
            if (!text) return;

            input.value = '';
            await sendAIChatMessageWithRAG(text);
        };
    }
});

/**
 * AI 弹窗对话（RAG 增强）
 */
async function sendAIChatMessageWithRAG(message) {
    const chatBody = $('aiChatBody');
    if (!chatBody) return;

    // 添加用户消息
    chatBody.innerHTML += `
        <div class="ai-chat-message user">
            <div class="ai-chat-message-content">${escapeHtml(message)}</div>
        </div>
    `;
    chatBody.scrollTop = chatBody.scrollHeight;

    // 添加加载动画
    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'ai-chat-message ai loading';
    loadingDiv.innerHTML = `
        <div class="ai-chat-message-avatar">A</div>
        <div class="ai-chat-message-content">
            <div class="loading-dots"><span></span><span></span><span></span></div>
        </div>
    `;
    chatBody.appendChild(loadingDiv);
    chatBody.scrollTop = chatBody.scrollHeight;

    try {
        const result = await postJSON('/rag/chat', {
            message: message,
            history: []
        });

        // 移除加载动画
        loadingDiv.remove();

        // 添加 AI 回复
        let replyHtml = result.content || '抱歉，我无法处理这个请求。';
        // 简单的 Markdown 转换
        replyHtml = replyHtml
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\n/g, '<br>');

        chatBody.innerHTML += `
            <div class="ai-chat-message ai">
                <div class="ai-chat-message-avatar">A</div>
                <div class="ai-chat-message-content">${replyHtml}</div>
            </div>
        `;
        chatBody.scrollTop = chatBody.scrollHeight;

        if (window.MathJax) MathJax.typesetPromise();

    } catch (e) {
        loadingDiv.remove();
        chatBody.innerHTML += `
            <div class="ai-chat-message ai">
                <div class="ai-chat-message-avatar">A</div>
                <div class="ai-chat-message-content" style="color:#ef4444;">❌ 发生错误：${escapeHtml(e.message)}</div>
            </div>
        `;
    }
}

// CSS 动画注入
const ragStyles = document.createElement('style');
ragStyles.textContent = `
    @keyframes spin {
        to { transform: rotate(360deg); }
    }
    
    .loading-dots {
        display: flex;
        gap: 4px;
    }
    
    .loading-dots span {
        width: 6px;
        height: 6px;
        background: var(--muted);
        border-radius: 50%;
        animation: bounce 1.4s infinite ease-in-out both;
    }
    
    .loading-dots span:nth-child(1) { animation-delay: -0.32s; }
    .loading-dots span:nth-child(2) { animation-delay: -0.16s; }
    
    @keyframes bounce {
        0%, 80%, 100% { transform: scale(0); }
        40% { transform: scale(1); }
    }
    
    .rag-topic-item:hover {
        background: var(--surface) !important;
    }
    
    .rag-result-card:hover .use-in-chat-btn {
        background: var(--accent) !important;
        color: white !important;
    }
`;
document.head.appendChild(ragStyles);

// --- Fast Pass & Deep Study Interactivity ---

let currentPracticeAnswer = null;

async function loadPractice() {
    console.log("Loading practice:", AppState.currentPracticeTopic, AppState.currentPracticeCategory);
    const statusEl = $('practice-status');
    if (statusEl) statusEl.innerHTML = `正在加载题目...`;

    let url = `/api/math/practice?category=${encodeURIComponent(AppState.currentPracticeCategory)}`;
    if (AppState.currentPracticeTopic) {
        url += `&topic=${encodeURIComponent(AppState.currentPracticeTopic)}`;
    }

    if (AppState.currentPracticeCategory === '错题练') {
        AppState.currentQuestions = AppState.wrongQuestions;
        if (AppState.currentPracticeTopic) {
            AppState.currentQuestions = AppState.wrongQuestions.filter(q => q.topic === AppState.currentPracticeTopic);
        }
    } else if (AppState.currentPracticeCategory === '押题练') {
        AppState.currentQuestions = AppState.predictedQuestions;
        if (AppState.currentPracticeTopic) {
            AppState.currentQuestions = AppState.predictedQuestions.filter(q => q.topic === AppState.currentPracticeTopic);
        }
    } else {
        try {
            const data = await fetchJSON(url);
            AppState.currentQuestions = data;
        } catch (e) {
            console.error("Fetch practice error:", e);
            AppState.currentQuestions = [];
        }
    }

    AppState.questionIndex = 0;
    renderCurrentQuestion();
}

function renderCurrentQuestion() {
    const questions = AppState.currentQuestions;
    const container = $('practice-card');
    if (!container) return;

    if (!questions || questions.length === 0) {
        container.innerHTML = `<div style="text-align:center; padding:20px; opacity:0.6;">目前没有该分类下的题目。点击下方按钮由 AI 生成。</div>`;
        return;
    }

    const statusEl = $('practice-status');
    if (statusEl) {
        if (AppState.currentPracticeCategory === '基础练' && !AppState.currentPracticeTopic) {
            statusEl.innerHTML = `今日必刷：<strong>全专题综合特训</strong> (${questions.length} 题已就绪)`;
        } else {
            statusEl.innerHTML = `当前：<strong>${AppState.currentPracticeTopic || '综合'}</strong> (${questions.length} 题)`;
        }
    }

    container.innerHTML = questions.map((q, idx) => `
        <div class="practice-item" style="margin-bottom:24px; padding-bottom:16px; border-bottom:1px solid var(--border);">
            <div style="font-size:12px; color:var(--accent); font-weight:600; margin-bottom:4px;">题目 ${idx + 1} · ${q.topic.split('：')[0]}</div>
            <div style="font-weight:600; margin-bottom:12px;" class="question-text">${q.question}</div>
            <div style="display:flex; flex-direction:column; gap:8px;" class="options-container" data-idx="${idx}">
                ${q.options.map((opt, i) => `
                    <button class="btn-option" onclick="handleSelectOneOfMany(this, '${opt.charAt(0)}', ${idx})" data-val="${opt.charAt(0)}">${opt}</button>
                `).join('')}
            </div>
            <div id="feedback-${idx}" style="margin-top:12px; font-size:13px; display:none;"></div>
            <button class="btn-primary" onclick="submitOneOfMany(${idx})" id="submit-btn-${idx}" style="margin-top:12px; padding:8px 16px; font-size:13px; background:var(--surface); border:1px solid var(--border); color:var(--text); border-radius:8px;">提交此题</button>
        </div>
    `).join('');

    if (window.MathJax) MathJax.typesetPromise();
}

const currentUserAnswers = {};

function handleSelectOneOfMany(btn, val, idx) {
    const parent = btn.parentElement;
    parent.querySelectorAll('.btn-option').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentUserAnswers[idx] = val;
}

function submitOneOfMany(idx) {
    const answer = currentUserAnswers[idx];
    if (!answer) {
        alert("请选择该题的答案！");
        return;
    }
    const q = AppState.currentQuestions[idx];
    const isCorrect = answer === q.answer;
    const feedbackEl = $(`feedback-${idx}`);
    const btn = document.querySelector(`.options-container[data-idx="${idx}"] .btn-option[data-val="${answer}"]`);

    if (isCorrect) {
        btn.style.background = '#dcfce7';
        btn.style.borderColor = '#22c55e';
        feedbackEl.innerHTML = `<span style="color:#16a34a;"><i data-lucide="check-circle" size="14"></i> 回答正确！</span>`;
    } else {
        btn.style.background = '#fee2e2';
        btn.style.borderColor = '#ef4444';
        feedbackEl.innerHTML = `<span style="color:#dc2626;"><i data-lucide="x-circle" size="14"></i> 回答错误，正确答案是 ${q.answer}。</span>`;

        if (!AppState.wrongQuestions.some(wq => wq.question === q.question)) {
            AppState.wrongQuestions.push(q);
            localStorage.setItem('aha_wrong_questions', JSON.stringify(AppState.wrongQuestions));
        }
    }
    feedbackEl.style.display = 'block';
    if (window.lucide) lucide.createIcons();

    const prompt = `针对第 ${idx + 1} 题 "${q.question}"，我的回答是 "${answer}"（${isCorrect ? '正确' : '错误'}）。请给出解析。`;
    sendRAGMessage(prompt);
}

function handleSelectOption(btn, val) {
    document.querySelectorAll('.btn-option').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentPracticeAnswer = val;
}

function handleSubmitPractice() {
    if (!currentPracticeAnswer) {
        alert("请先选择一个答案！");
        return;
    }
    const q = AppState.currentQuestions[AppState.questionIndex];
    if (!q) return;

    const isCorrect = currentPracticeAnswer === q.answer;

    // UI Feedback
    const btn = document.querySelector(`.btn-option[data-val="${currentPracticeAnswer}"]`);
    if (isCorrect) {
        btn.style.background = '#dcfce7'; // Green
        btn.style.borderColor = '#22c55e';
    } else {
        btn.style.background = '#fee2e2'; // Red
        btn.style.borderColor = '#ef4444';

        // Add to wrong questions
        if (!AppState.wrongQuestions.some(wq => wq.question === q.question)) {
            AppState.wrongQuestions.push(q);
            localStorage.setItem('aha_wrong_questions', JSON.stringify(AppState.wrongQuestions));
        }
    }

    const prompt = `针对问题 "${q.question}"，我的回答是 "${currentPracticeAnswer}"。这个答案${isCorrect ? '正确' : '错误'}（正确答案是 ${q.answer}）。请详细分析并给出知识点讲解。`;
    sendRAGMessage(prompt);
}

async function generateAIPractice() {
    const statusEl = $('practice-status');
    if (statusEl) statusEl.innerHTML = `正在调用 AI 生成新题... 预计需要 10s`;

    try {
        const result = await fetchJSON(`/api/math/practice/generate?topic=${encodeURIComponent(AppState.currentPracticeTopic)}&category=${encodeURIComponent(AppState.currentPracticeCategory)}`);
        if (result.success) {
            const newQ = result.data;
            AppState.currentQuestions.push(newQ);

            // If it's a prediction, add to predicted questions
            if (AppState.currentPracticeCategory === '押题练') {
                if (!AppState.predictedQuestions.some(pq => pq.question === newQ.question)) {
                    AppState.predictedQuestions.push(newQ);
                    localStorage.setItem('aha_predicted_questions', JSON.stringify(AppState.predictedQuestions));
                }
            }

            AppState.questionIndex = AppState.currentQuestions.length - 1;
            renderCurrentQuestion();
        } else {
            alert("AI 生成失败: " + result.error);
        }
    } catch (e) {
        console.error("AI Practice Gen error:", e);
        alert("AI 生成请求失败");
    }
}

function nextPractice() {
    if (AppState.questionIndex < AppState.currentQuestions.length - 1) {
        AppState.questionIndex++;
        renderCurrentQuestion();
    } else {
        alert("已经是最后一题了。可以点击“换一批”获取新题目。");
    }
}

function refreshPractice() {
    loadPractice();
}

function renderInteractiveKG() {
    const container = $('kg-container');
    if (!container) return;
    container.innerHTML = '';

    const nodes = [
        { id: 'math.C04', label: '函数', x: 50, y: 50, color: 'var(--accent)', size: 80 },
        { id: 'math.C04.S02', label: '单调性', x: 25, y: 30 },
        { id: 'math.C04.S03', label: '奇偶性', x: 75, y: 30 },
        { id: 'math.C04.S04', label: '周期性', x: 25, y: 70 },
        { id: 'math.C04.S01', label: '概念', x: 75, y: 70 }
    ];

    nodes.forEach(n => {
        const el = document.createElement('div');
        el.className = 'kg-node';
        el.style.left = n.x + '%';
        el.style.top = n.y + '%';
        if (n.size) {
            el.style.width = n.size + 'px';
            el.style.height = n.size + 'px';
        }
        if (n.color) el.style.background = n.color;
        if (n.color === 'var(--accent)') el.style.color = 'white';

        el.innerText = n.label;
        el.onclick = () => {
            switchToModule('knowledge');
            setTimeout(() => {
                const input = $('ragSearchInput');
                if (input) {
                    input.value = n.label;
                    performRAGSearch();
                }
            }, 500);
        };
        container.appendChild(el);
    });
}
