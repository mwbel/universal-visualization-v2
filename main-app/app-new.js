/**
 * 万物可视化 - 新版JavaScript
 * 现代化交互系统
 */

// 全局状态管理
const AppState = {
  currentMode: 'text',
  isGenerating: false,
  selectedModule: null,
  selectedCategory: null,
  theme: localStorage.getItem('theme') || 'dark'
};

// DOM元素缓存
const Elements = {
  // 导航元素
  themeToggle: null,
  menuToggle: null,

  // 输入元素
  modeButtons: null,
  inputPanels: null,
  mainInput: null,
  generateBtn: null,

  // 模块元素
  moduleCards: null,
  subcategories: null,

  // 模板元素
  templateSearch: null,
  templateCategories: null
};

/**
 * 初始化应用
 */
function initializeApp() {
  console.log('🚀 万物可视化 - 初始化新版本');

  // 缓存DOM元素
  cacheElements();

  // 初始化主题
  initializeTheme();

  // 绑定事件监听器
  bindEventListeners();

  // 初始化模块
  initializeModules();

  // 初始化输入系统
  initializeInputSystem();

  // 初始化模板系统
  initializeTemplateSystem();

  // 添加加载动画
  document.body.classList.add('loaded');

  console.log('✅ 应用初始化完成');
}

/**
 * 缓存DOM元素
 */
function cacheElements() {
  // 导航
  Elements.themeToggle = document.getElementById('theme-toggle');
  Elements.menuToggle = document.getElementById('menu-toggle');

  // 输入
  Elements.modeButtons = document.querySelectorAll('.mode-btn');
  Elements.inputPanels = document.querySelectorAll('.input-panel');
  Elements.mainInput = document.getElementById('main-input');
  Elements.generateBtn = document.getElementById('generate-btn');

  // 模块
  Elements.moduleCards = document.querySelectorAll('.module-card');
  Elements.subcategories = document.querySelectorAll('.subcategory');

  // 模板
  Elements.templateSearch = document.getElementById('template-search');
  Elements.templateCategories = document.querySelectorAll('.template-category');
}

/**
 * 初始化主题系统
 */
function initializeTheme() {
  const savedTheme = AppState.theme;
  setTheme(savedTheme);

  if (Elements.themeToggle) {
    Elements.themeToggle.addEventListener('click', toggleTheme);
  }
}

/**
 * 设置主题
 */
function setTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  AppState.theme = theme;
  localStorage.setItem('theme', theme);

  // 更新主题按钮图标
  if (Elements.themeToggle) {
    const icon = Elements.themeToggle.querySelector('.theme-icon');
    if (icon) {
      icon.textContent = theme === 'dark' ? '🌙' : '☀️';
    }
  }
}

/**
 * 切换主题
 */
function toggleTheme() {
  const newTheme = AppState.theme === 'dark' ? 'light' : 'dark';
  setTheme(newTheme);

  // 添加切换动画
  document.body.style.transition = 'all 0.3s ease';
  setTimeout(() => {
    document.body.style.transition = '';
  }, 300);
}

/**
 * 绑定事件监听器
 */
function bindEventListeners() {
  // 输入模式切换
  Elements.modeButtons.forEach(btn => {
    btn.addEventListener('click', () => switchInputMode(btn.dataset.mode));
  });

  // 生成按钮
  if (Elements.generateBtn) {
    Elements.generateBtn.addEventListener('click', handleGenerate);
  }

  // 主输入框
  if (Elements.mainInput) {
    Elements.mainInput.addEventListener('input', handleInputChange);
    Elements.mainInput.addEventListener('keydown', handleInputKeydown);
  }

  // 模块卡片点击
  Elements.moduleCards.forEach(card => {
    card.addEventListener('click', () => handleModuleClick(card));
  });

  // 子分类点击
  Elements.subcategories.forEach(subcategory => {
    subcategory.addEventListener('click', (e) => handleSubcategoryClick(e, subcategory));
  });

  // 模板搜索
  if (Elements.templateSearch) {
    Elements.templateSearch.addEventListener('input', handleTemplateSearch);
  }

  // 快速开始卡片
  const quickStartCards = document.querySelectorAll('.quick-start-card');
  quickStartCards.forEach(card => {
    card.addEventListener('click', () => handleQuickStart(card));
  });

  // 响应式菜单
  if (Elements.menuToggle) {
    Elements.menuToggle.addEventListener('click', toggleMobileMenu);
  }

  // 页面滚动事件
  window.addEventListener('scroll', handleScroll);

  // 窗口大小变化
  window.addEventListener('resize', handleResize);
}

/**
 * 初始化模块系统
 */
function initializeModules() {
  // 为模块卡片添加数据
  const moduleData = {
    mathematics: {
      title: '数学可视化',
      icon: '📐',
      description: '将抽象的数学概念转化为直观的视觉图形',
      badge: '核心'
    },
    physics: {
      title: '物理模拟',
      icon: '⚛️',
      description: '模拟物理现象，探索科学规律',
      badge: '热门'
    },
    astronomy: {
      title: '天文可视化',
      icon: '🌌',
      description: '探索宇宙奥秘，可视化天体运动',
      badge: '精选'
    },
    geometry: {
      title: '几何图形',
      icon: '🔷',
      description: '创建和操控各种几何图形',
      badge: '实用'
    }
  };

  // 应用模块数据
  Elements.moduleCards.forEach(card => {
    const moduleType = card.dataset.module;
    if (moduleData[moduleType]) {
      const data = moduleData[moduleType];
      const icon = card.querySelector('.module-icon');
      const title = card.querySelector('.module-title');
      const description = card.querySelector('.module-description');
      const badge = card.querySelector('.module-badge');

      if (icon) icon.textContent = data.icon;
      if (title) title.textContent = data.title;
      if (description) description.textContent = data.description;
      if (badge) badge.textContent = data.badge;
    }
  });
}

/**
 * 初始化输入系统
 */
function initializeInputSystem() {
  // 设置默认输入模式
  switchInputMode('text');

  // 初始化字符计数
  updateCharCount();
}

/**
 * 初始化模板系统
 */
function initializeTemplateSystem() {
  // 模板数据
  const templates = {
    mathematics: [
      { name: '函数图像', icon: '📈', description: '绘制各种数学函数图像' },
      { name: '几何变换', icon: '🔄', description: '展示几何图形的变换过程' },
      { name: '统计分析', icon: '📊', description: '可视化数据和统计结果' },
      { name: '概率分布', icon: '🎲', description: '展示概率分布和随机过程' }
    ],
    physics: [
      { name: '运动轨迹', icon: '🚀', description: '模拟物体运动轨迹' },
      { name: '波动现象', icon: '🌊', description: '可视化波的传播和干涉' },
      { name: '电磁场', icon: '⚡', description: '展示电场和磁场分布' },
      { name: '光学现象', icon: '💡', description: '模拟光的传播和反射' }
    ],
    astronomy: [
      { name: '太阳系', icon: '☀️', description: '展示太阳系行星运动' },
      { name: '星系演化', icon: '🌟', description: '模拟星系的形成和演化' },
      { name: '黑洞模拟', icon: '⚫', description: '可视化黑洞的引力效应' },
      { name: '航天轨道', icon: '🛸', description: '计算和展示航天器轨道' }
    ]
  };

  // 生成模板HTML
  Elements.templateCategories.forEach(category => {
    const categoryType = category.dataset.category;
    const templateList = templates[categoryType];

    if (templateList) {
      const container = category.querySelector('.template-list');
      if (container) {
        container.innerHTML = templateList.map(template => `
          <div class="template-item">
            <div class="template-icon">${template.icon}</div>
            <div class="template-info">
              <div class="template-name">${template.name}</div>
              <div class="template-desc">${template.description}</div>
            </div>
          </div>
        `).join('');
      }
    }
  });
}

/**
 * 切换输入模式
 */
function switchInputMode(mode) {
  AppState.currentMode = mode;

  // 更新按钮状态
  Elements.modeButtons.forEach(btn => {
    btn.classList.toggle('active', btn.dataset.mode === mode);
  });

  // 更新面板显示
  Elements.inputPanels.forEach(panel => {
    panel.classList.toggle('active', panel.dataset.mode === mode);
  });

  // 聚焦到对应输入框
  const activeInput = document.querySelector(`.input-panel[data-mode="${mode}"] .main-input`);
  if (activeInput) {
    setTimeout(() => activeInput.focus(), 100);
  }
}

/**
 * 处理输入变化
 */
function handleInputChange() {
  updateCharCount();

  // 检查输入内容，自动调整生成按钮状态
  const hasContent = Elements.mainInput.value.trim().length > 0;
  if (Elements.generateBtn) {
    Elements.generateBtn.disabled = !hasContent;
  }
}

/**
 * 处理输入键盘事件
 */
function handleInputKeydown(e) {
  // Ctrl/Cmd + Enter 生成
  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
    e.preventDefault();
    handleGenerate();
  }
}

/**
 * 更新字符计数
 */
function updateCharCount() {
  const charCount = document.querySelector('.char-count');
  if (charCount && Elements.mainInput) {
    const count = Elements.mainInput.value.length;
    charCount.textContent = `${count}/5000`;
  }
}

/**
 * 处理生成操作
 */
async function handleGenerate() {
  if (AppState.isGenerating) return;

  const input = Elements.mainInput?.value?.trim();
  if (!input) {
    showMessage('请输入要描述的内容', 'warning');
    return;
  }

  AppState.isGenerating = true;

  if (Elements.generateBtn) {
    Elements.generateBtn.disabled = true;
    Elements.generateBtn.innerHTML = '<span class="btn-icon">⏳</span> 生成中...';
  }

  try {
    // 模拟生成过程
    await simulateGeneration();

    showMessage('可视化内容生成成功！', 'success');

    // 这里可以跳转到结果页面或显示结果
    setTimeout(() => {
      showResults();
    }, 1000);

  } catch (error) {
    console.error('生成失败:', error);
    showMessage('生成失败，请重试', 'error');
  } finally {
    AppState.isGenerating = false;

    if (Elements.generateBtn) {
      Elements.generateBtn.disabled = false;
      Elements.generateBtn.innerHTML = '<span class="btn-icon">✨</span> 开始生成';
    }
  }
}

/**
 * 模拟生成过程
 */
function simulateGeneration() {
  return new Promise(resolve => {
    setTimeout(resolve, 2000);
  });
}

/**
 * 显示生成结果
 */
function showResults() {
  // 这里可以实现结果显示逻辑
  console.log('🎉 生成完成，准备显示结果');

  // 暂时显示提示
  showMessage('结果展示功能开发中...', 'info');
}

/**
 * 处理模块点击
 */
function handleModuleClick(card) {
  const moduleType = card.dataset.module;

  // 更新选中状态
  Elements.moduleCards.forEach(c => c.classList.remove('selected'));
  card.classList.add('selected');

  AppState.selectedModule = moduleType;

  // 滚动到对应的子分类区域
  const subcategorySection = document.getElementById(`${moduleType}-subcategories`);
  if (subcategorySection) {
    subcategorySection.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  // 高亮对应的子分类
  highlightSubcategories(moduleType);
}

/**
 * 处理子分类点击
 */
function handleSubcategoryClick(e, subcategory) {
  e.preventDefault();
  e.stopPropagation();

  const categoryType = subcategory.dataset.category;

  // 更新选中状态
  Elements.subcategories.forEach(s => s.classList.remove('selected'));
  subcategory.classList.add('selected');

  AppState.selectedCategory = categoryType;

  // 跳转到输入区域
  const inputSection = document.querySelector('.input-section');
  if (inputSection) {
    inputSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  // 更新输入提示
  updateInputPlaceholder(categoryType);
}

/**
 * 高亮子分类
 */
function highlightSubcategories(moduleType) {
  const moduleSubcategories = document.querySelectorAll(`[data-module="${moduleType}"]`);

  // 添加高亮动画
  moduleSubcategories.forEach(subcategory => {
    subcategory.classList.add('highlighted');
    setTimeout(() => {
      subcategory.classList.remove('highlighted');
    }, 1000);
  });
}

/**
 * 更新输入提示
 */
function updateInputPlaceholder(categoryType) {
  if (!Elements.mainInput) return;

  const placeholders = {
    probability: '请描述您想要可视化的概率统计问题，例如：正态分布、中心极限定理...',
    linear: '请描述您想要可视化的线性代数概念，例如：矩阵变换、特征向量...',
    differential: '请描述您想要可视化的微分几何概念，例如：曲率、流形...',
    calculus: '请描述您想要可视化的微积分概念，例如：导数、积分、极限...',
    algebra: '请描述您想要可视化的代数问题，例如：方程求解、群论...',
    statistics: '请描述您想要可视化的统计概念，例如：回归分析、假设检验...'
  };

  Elements.mainInput.placeholder = placeholders[categoryType] || '请描述您想要可视化的内容...';
}

/**
 * 处理模板搜索
 */
function handleTemplateSearch() {
  const searchTerm = Elements.templateSearch.value.toLowerCase();

  Elements.templateCategories.forEach(category => {
    const templates = category.querySelectorAll('.template-item');
    let visibleCount = 0;

    templates.forEach(template => {
      const name = template.querySelector('.template-name')?.textContent.toLowerCase() || '';
      const desc = template.querySelector('.template-desc')?.textContent.toLowerCase() || '';

      const isVisible = name.includes(searchTerm) || desc.includes(searchTerm);
      template.style.display = isVisible ? 'flex' : 'none';

      if (isVisible) visibleCount++;
    });

    // 显示/隐藏分类标题
    const categoryTitle = category.querySelector('.category-title');
    if (categoryTitle) {
      categoryTitle.style.display = visibleCount > 0 ? 'block' : 'none';
    }
  });
}

/**
 * 处理快速开始
 */
function handleQuickStart(card) {
  const action = card.dataset.action;

  switch (action) {
    case 'text':
      switchInputMode('text');
      break;
    case 'template':
      switchInputMode('template');
      break;
    case 'upload':
      switchInputMode('upload');
      break;
    default:
      switchInputMode('text');
  }

  // 滚动到输入区域
  const inputSection = document.querySelector('.input-section');
  if (inputSection) {
    inputSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
}

/**
 * 切换移动端菜单
 */
function toggleMobileMenu() {
  const nav = document.querySelector('.header-nav');
  if (nav) {
    nav.classList.toggle('mobile-open');
  }
}

/**
 * 处理页面滚动
 */
function handleScroll() {
  const header = document.querySelector('.app-header');
  if (header) {
    const scrolled = window.scrollY > 50;
    header.classList.toggle('scrolled', scrolled);
  }
}

/**
 * 处理窗口大小变化
 */
function handleResize() {
  // 响应式处理
  const isMobile = window.innerWidth < 768;
  document.body.classList.toggle('mobile', isMobile);
}

/**
 * 显示消息
 */
function showMessage(message, type = 'info') {
  // 创建消息元素
  const messageEl = document.createElement('div');
  messageEl.className = `message message-${type}`;
  messageEl.textContent = message;

  // 添加到页面
  document.body.appendChild(messageEl);

  // 显示动画
  setTimeout(() => messageEl.classList.add('show'), 10);

  // 自动移除
  setTimeout(() => {
    messageEl.classList.remove('show');
    setTimeout(() => {
      if (messageEl.parentNode) {
        messageEl.parentNode.removeChild(messageEl);
      }
    }, 300);
  }, 3000);
}

/**
 * 添加CSS动画类
 */
function addAnimationStyles() {
  const style = document.createElement('style');
  style.textContent = `
    .message {
      position: fixed;
      top: 20px;
      right: 20px;
      background: var(--bg-card);
      color: var(--text-primary);
      padding: var(--space-md) var(--space-lg);
      border-radius: var(--radius-lg);
      border: 1px solid var(--border-color);
      box-shadow: var(--shadow-lg);
      z-index: 1000;
      transform: translateX(100%);
      opacity: 0;
      transition: all 0.3s ease;
    }

    .message.show {
      transform: translateX(0);
      opacity: 1;
    }

    .message-success {
      border-color: var(--color-primary);
      background: var(--color-primary);
      color: white;
    }

    .message-warning {
      border-color: #f59e0b;
      background: #f59e0b;
      color: white;
    }

    .message-error {
      border-color: #ef4444;
      background: #ef4444;
      color: white;
    }

    .module-card.selected {
      border-color: var(--color-primary);
      background: var(--bg-hover);
    }

    .subcategory.selected {
      background: var(--color-primary);
      color: white;
      border-color: var(--color-primary);
    }

    .subcategory.highlighted {
      animation: highlightPulse 1s ease;
    }

    @keyframes highlightPulse {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.05); box-shadow: var(--shadow-glow); }
    }

    .loaded {
      animation: fadeIn 0.6s ease-out;
    }

    .mobile .header-nav.mobile-open {
      display: flex;
      flex-direction: column;
      position: absolute;
      top: 100%;
      left: 0;
      right: 0;
      background: var(--bg-secondary);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-lg);
      padding: var(--space-md);
      margin-top: var(--space-sm);
    }

    .template-item {
      display: flex;
      align-items: center;
      gap: var(--space-sm);
      padding: var(--space-md);
      border-radius: var(--radius-md);
      cursor: pointer;
      transition: var(--transition-fast);
    }

    .template-item:hover {
      background: var(--bg-hover);
    }

    .template-icon {
      font-size: var(--text-lg);
      flex-shrink: 0;
    }

    .template-info {
      flex: 1;
      min-width: 0;
    }

    .template-name {
      font-weight: 500;
      color: var(--text-primary);
      margin-bottom: 2px;
    }

    .template-desc {
      font-size: var(--text-xs);
      color: var(--text-muted);
    }
  `;
  document.head.appendChild(style);
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
  addAnimationStyles();
  initializeApp();
});

// 导出全局函数供HTML调用
window.UniversalVis = {
  switchInputMode,
  handleGenerate,
  toggleTheme,
  showMessage,
  handleModuleClick,
  handleSubcategoryClick
};