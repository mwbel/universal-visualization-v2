/**
 * 万物可视化 - 融合版JavaScript
 * 新架构 + 完整功能集成
 */

// 全局状态管理
const AppState = {
  currentMode: 'text',
  isGenerating: false,
  selectedModule: null,
  selectedCategory: null,
  theme: localStorage.getItem('theme') || 'dark',
  searchSuggestions: [],
  templates: [],
  history: [],
  user: null
};

// DOM元素缓存
const Elements = {
  // 导航和主题
  themeToggle: null,
  demoBtn: null,
  helpBtn: null,

  // 搜索
  globalSearchInput: null,
  globalSearchBtn: null,
  searchSuggestions: null,
  closeSearchSuggestions: null,
  searchSuggestionsList: null,

  // 输入
  modeButtons: null,
  inputPanels: null,
  mainInput: null,
  generateBtn: null,
  charCount: null,
  suggestionsContainer: null,
  suggestionsList: null,
  closeSuggestions: null,

  // 模板和概念
  templateSearch: null,
  templateCategories: null,

  // 模块
  moduleCards: null,
  subcategories: null,

  // 快速开始
  quickStartCards: null,

  // 消息和加载
  messageContainer: null,
  loadingOverlay: null
};

/**
 * 初始化应用
 */
function initializeApp() {
  console.log('🚀 万物可视化 - 融合版初始化');

  // 缓存DOM元素
  cacheElements();

  // 初始化主题
  initializeTheme();

  // 初始化数据
  initializeData();

  // 绑定事件监听器
  bindEventListeners();

  // 初始化模块系统
  initializeModules();

  // 初始化输入系统
  initializeInputSystem();

  // 初始化搜索系统
  initializeSearchSystem();

  // 初始化模板系统
  initializeTemplateSystem();

  // 添加加载动画
  document.body.classList.add('loaded');

  console.log('✅ 融合版应用初始化完成');
}

/**
 * 缓存DOM元素
 */
function cacheElements() {
  // 导航
  Elements.themeToggle = document.getElementById('themeToggle');
  Elements.demoBtn = document.getElementById('demoFeatures');
  Elements.helpBtn = document.getElementById('helpBtn');

  // 搜索
  Elements.globalSearchInput = document.getElementById('globalSearchInput');
  Elements.globalSearchBtn = document.getElementById('globalSearchBtn');
  Elements.searchSuggestions = document.getElementById('searchSuggestions');
  Elements.closeSearchSuggestions = document.getElementById('closeSearchSuggestions');
  Elements.searchSuggestionsList = document.getElementById('searchSuggestionsList');

  // 输入
  Elements.modeButtons = document.querySelectorAll('.mode-btn');
  Elements.inputPanels = document.querySelectorAll('.input-mode-panel');
  Elements.mainInput = document.getElementById('mainInput');
  Elements.generateBtn = document.getElementById('generateBtn');
  Elements.charCount = document.querySelector('.char-count');
  Elements.suggestionsContainer = document.getElementById('suggestionsContainer');
  Elements.suggestionsList = document.getElementById('suggestionsList');
  Elements.closeSuggestions = document.getElementById('closeSuggestions');

  // 模板
  Elements.templateSearch = document.getElementById('templateSearch');
  Elements.templateCategories = document.querySelectorAll('.template-category');

  // 模块
  Elements.moduleCards = document.querySelectorAll('.module-card');
  Elements.subcategories = document.querySelectorAll('.subcategory');

  // 快速开始
  Elements.quickStartCards = document.querySelectorAll('.quick-start-card');

  // 提示词样例
  Elements.toggleExamples = document.getElementById('toggleExamples');
  Elements.examplesContent = document.getElementById('examplesContent');
  Elements.examplesContainer = document.querySelector('.prompt-examples-container');

  // 消息和加载
  Elements.messageContainer = document.getElementById('messageContainer');
  Elements.loadingOverlay = document.getElementById('loadingOverlay');
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
 * 初始化数据
 */
function initializeData() {
  // 初始化搜索建议数据
  AppState.searchSuggestions = [
    { title: '正态分布', category: '数学', icon: '📊' },
    { title: '行星运动轨迹', category: '天文', icon: '🪐' },
    { title: '简谐振动', category: '物理', icon: '🌊' },
    { title: '二次函数', category: '数学', icon: '📈' },
    { title: '太阳系模拟', category: '天文', icon: '☀️' },
    { title: '电磁场分布', category: '物理', icon: '⚡' }
  ];

  // 初始化模板数据
  AppState.templates = [
    {
      id: 'normal-distribution',
      name: '正态分布',
      category: 'mathematics',
      description: '展示正态分布的概率密度函数',
      icon: '📊',
      promptText: '正态分布 均值0 标准差1'
    },
    {
      id: 'planet-motion',
      name: '行星运动',
      category: 'astronomy',
      description: '展示行星围绕太阳运动的轨迹',
      icon: '🪐',
      promptText: '行星运动轨迹 地球 火星'
    }
  ];

  // 初始化历史记录
  AppState.history = [
    {
      id: 'viz_001',
      title: '正态分布图',
      type: 'bar',
      createdAt: '2025-11-02T10:30:00Z'
    },
    {
      id: 'viz_002',
      title: '行星运动轨迹',
      type: 'line',
      createdAt: '2025-11-02T09:15:00Z'
    }
  ];
}

/**
 * 绑定事件监听器
 */
function bindEventListeners() {
  // 输入模式切换
  Elements.modeButtons.forEach(btn => {
    btn.addEventListener('click', () => switchInputMode(btn.dataset.mode));
  });

  // 生成按钮 - 强制显示并启用
  if (Elements.generateBtn) {
    console.log('✅ 找到生成按钮，强制设置样式');
    Elements.generateBtn.style.cssText = `
      display: flex !important;
      visibility: visible !important;
      opacity: 1 !important;
      position: relative !important;
      z-index: 9999 !important;
      padding: 12px 48px !important;
      background: linear-gradient(135deg, #3b82f6, #8b5cf6) !important;
      border: none !important;
      border-radius: 16px !important;
      color: white !important;
      font-weight: 600 !important;
      font-size: 16px !important;
      cursor: pointer !important;
      align-items: center !important;
      gap: 8px !important;
      box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3) !important;
      margin: 0 !important;
      disabled: false !important;
    `;
    Elements.generateBtn.disabled = false;
    Elements.generateBtn.addEventListener('click', handleGenerate);
    console.log('✅ 生成按钮样式已强制设置');
  } else {
    console.error('❌ 未找到生成按钮元素');
  }

  // 主输入框
  if (Elements.mainInput) {
    Elements.mainInput.addEventListener('input', handleInputChange);
    Elements.mainInput.addEventListener('keydown', handleInputKeydown);
  }

  // 全局搜索
  if (Elements.globalSearchInput) {
    Elements.globalSearchInput.addEventListener('input', handleGlobalSearch);
    Elements.globalSearchInput.addEventListener('keydown', handleSearchKeydown);
  }

  if (Elements.globalSearchBtn) {
    Elements.globalSearchBtn.addEventListener('click', handleGlobalSearch);
  }

  // 搜索建议
  if (Elements.closeSearchSuggestions) {
    Elements.closeSearchSuggestions.addEventListener('click', hideSearchSuggestions);
  }

  // 智能建议
  if (Elements.closeSuggestions) {
    Elements.closeSuggestions.addEventListener('click', hideSuggestions);
  }

  // 模板搜索
  if (Elements.templateSearch) {
    Elements.templateSearch.addEventListener('input', handleTemplateSearch);
  }

  // 模块卡片点击
  Elements.moduleCards.forEach(card => {
    card.addEventListener('click', () => handleModuleClick(card));
  });

  // 子分类点击
  Elements.subcategories.forEach(subcategory => {
    subcategory.addEventListener('click', (e) => handleSubcategoryClick(e, subcategory));
  });

  // 快速开始卡片
  Elements.quickStartCards.forEach(card => {
    card.addEventListener('click', () => handleQuickStart(card));
  });

  // 提示词样例展开/收起
  if (Elements.toggleExamples) {
    Elements.toggleExamples.addEventListener('click', toggleExamplesVisibility);
  }

  // 提示词样例头部点击
  if (Elements.examplesContainer) {
    const examplesHeader = Elements.examplesContainer.querySelector('.examples-header');
    if (examplesHeader) {
      examplesHeader.addEventListener('click', toggleExamplesVisibility);
    }
  }

  // 提示词样例使用按钮
  bindExampleUseButtons();

  // 演示按钮
  if (Elements.demoBtn) {
    Elements.demoBtn.addEventListener('click', handleDemoFeatures);
  }

  // 帮助按钮
  if (Elements.helpBtn) {
    Elements.helpBtn.addEventListener('click', handleHelp);
  }

  // 页面滚动事件
  window.addEventListener('scroll', handleScroll);

  // 窗口大小变化
  window.addEventListener('resize', handleResize);

  // 点击外部关闭弹出层
  document.addEventListener('click', handleClickOutside);
}

/**
 * 初始化模块系统
 */
function initializeModules() {
  // 模块数据已经在HTML中定义，这里可以添加动态功能
  console.log('📚 模块系统已初始化');
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
 * 初始化搜索系统
 */
function initializeSearchSystem() {
  console.log('🔍 搜索系统已初始化');
}

/**
 * 初始化模板系统
 */
function initializeTemplateSystem() {
  console.log('📋 模板系统已初始化');
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
  const activeInput = document.querySelector(`.input-mode-panel[data-mode="${mode}"] input, .input-mode-panel[data-mode="${mode}"] textarea`);
  if (activeInput) {
    setTimeout(() => activeInput.focus(), 100);
  }
}

/**
 * 处理输入变化
 */
function handleInputChange() {
  updateCharCount();

  // 强制保持按钮启用状态 - 不再根据输入内容禁用
  if (Elements.generateBtn) {
    Elements.generateBtn.disabled = false;
    Elements.generateBtn.style.opacity = '1';
    Elements.generateBtn.style.visibility = 'visible';
  }

  // 获取智能建议
  if (Elements.mainInput.value.length > 3) {
    debouncedGetSuggestions();
    // 显示动态建议
    showDynamicSuggestions();
  } else {
    hideSuggestions();
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
  if (Elements.charCount && Elements.mainInput) {
    const count = Elements.mainInput.value.length;
    Elements.charCount.textContent = `${count}/5000`;
  }
}

/**
 * 处理全局搜索
 */
function handleGlobalSearch() {
  const query = Elements.globalSearchInput?.value?.trim();
  if (!query) return;

  console.log('🔍 全局搜索:', query);

  // 过滤建议
  const filteredSuggestions = AppState.searchSuggestions.filter(item =>
    item.title.toLowerCase().includes(query.toLowerCase()) ||
    item.category.toLowerCase().includes(query.toLowerCase())
  );

  showSearchSuggestions(filteredSuggestions);
}

/**
 * 处理搜索键盘事件
 */
function handleSearchKeydown(e) {
  if (e.key === 'Enter') {
    handleGlobalSearch();
  } else if (e.key === 'Escape') {
    hideSearchSuggestions();
  }
}

/**
 * 显示搜索建议
 */
function showSearchSuggestions(suggestions) {
  if (!Elements.searchSuggestionsList) return;

  Elements.searchSuggestionsList.innerHTML = suggestions.map(item => `
    <div class="suggestion-item" data-query="${item.title}">
      <span class="suggestion-icon">${item.icon}</span>
      <div class="suggestion-info">
        <div class="suggestion-title">${item.title}</div>
        <div class="suggestion-category">${item.category}</div>
      </div>
    </div>
  `).join('');

  Elements.searchSuggestions.style.display = 'block';

  // 绑定点击事件
  Elements.searchSuggestionsList.querySelectorAll('.suggestion-item').forEach(item => {
    item.addEventListener('click', () => {
      const query = item.dataset.query;
      Elements.globalSearchInput.value = query;
      hideSearchSuggestions();
      if (Elements.mainInput) {
        Elements.mainInput.value = query;
        switchInputMode('text');
      }
    });
  });
}

/**
 * 隐藏搜索建议
 */
function hideSearchSuggestions() {
  if (Elements.searchSuggestions) {
    Elements.searchSuggestions.style.display = 'none';
  }
}

/**
 * 获取智能建议
 */
function getSuggestions() {
  const input = Elements.mainInput?.value?.trim();
  if (!input) return;

  console.log('💡 获取智能建议:', input);

  // 模拟API调用
  setTimeout(() => {
    const suggestions = [
      { title: '正态分布参数调整', desc: '调整均值和标准差参数' },
      { title: '添加多组数据对比', desc: '显示多个正态分布曲线' },
      { title: '概率密度函数', desc: '显示概率密度函数图像' }
    ];

    showSuggestions(suggestions);
  }, 300);
}

// 防抖函数
const debouncedGetSuggestions = debounce(getSuggestions, 500);

/**
 * 显示智能建议
 */
function showSuggestions(suggestions) {
  if (!Elements.suggestionsList) return;

  Elements.suggestionsList.innerHTML = suggestions.map(item => `
    <div class="suggestion-item">
      <div class="suggestion-content">
        <div class="suggestion-title">${item.title}</div>
        <div class="suggestion-desc">${item.desc}</div>
      </div>
    </div>
  `).join('');

  Elements.suggestionsContainer.style.display = 'block';
}

/**
 * 隐藏智能建议
 */
function hideSuggestions() {
  if (Elements.suggestionsContainer) {
    Elements.suggestionsContainer.style.display = 'none';
  }
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

  // 显示加载动画
  showLoading();

  if (Elements.generateBtn) {
    Elements.generateBtn.disabled = true;
    Elements.generateBtn.innerHTML = '<span class="btn-icon">⏳</span> 生成中...';
  }

  try {
    // 调用API生成可视化
    const result = await callGenerateAPI(input);

    showMessage('可视化内容生成成功！', 'success');

    // 添加到历史记录
    addToHistory(result);

    // 显示结果
    setTimeout(() => {
      showResults(result);
    }, 1000);

  } catch (error) {
    console.error('生成失败:', error);
    showMessage('生成失败，请重试', 'error');
  } finally {
    AppState.isGenerating = false;
    hideLoading();

    if (Elements.generateBtn) {
      Elements.generateBtn.disabled = false;
      Elements.generateBtn.innerHTML = '<span class="btn-icon">✨</span> 开始生成';
    }
  }
}

/**
 * 调用生成API - 使用新的后端API
 */
async function callGenerateAPI(prompt) {
  try {
    console.log('🔄 开始调用新API:', prompt);

    // 调用新的万物可视化后端API
    const response = await fetch('http://localhost:9999/api/v2/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: prompt,
        subject: 'general',
        grade_level: 'high_school',
        interaction_mode: 'visualization',
        user_preferences: {
          interactive: true,
          export_enabled: true
        }
      })
    });

    console.log('📡 新API响应状态:', response.status);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    console.log('📊 新API响应结果:', result);

    if (result.status === 'processing') {
      // 如果正在处理，等待完成
      return await waitForCompletion(result.generation_id, prompt);
    } else if (result.status === 'completed') {
      // 如果已完成，获取结果
      return await getVisualizationResult(result.html_url || result.generation_id, prompt);
    } else {
      throw new Error(result.error || result.message || '生成失败');
    }
  } catch (error) {
    console.error('❌ API调用失败:', error);

    // 如果API调用失败，回退到模拟数据
    console.warn('⚠️ 回退到模拟数据模式');
    return new Promise(resolve => {
      setTimeout(() => {
        resolve({
          id: 'viz_' + Date.now(),
          type: determineVisualizationType(prompt),
          title: extractTitle(prompt),
          description: prompt,
          data: generateMockData(prompt),
          config: {
            theme: AppState.theme,
            animated: true,
            interactive: true
          },
          createdAt: new Date().toISOString()
        });
      }, 2000);
    });
  }
}

/**
 * 确定可视化类型
 */
function determineVisualizationType(prompt) {
  const lowerPrompt = prompt.toLowerCase();

  if (lowerPrompt.includes('柱状图') || lowerPrompt.includes('柱形图')) return 'bar';
  if (lowerPrompt.includes('饼图') || lowerPrompt.includes('圆图')) return 'pie';
  if (lowerPrompt.includes('折线图') || lowerPrompt.includes('线图')) return 'line';
  if (lowerPrompt.includes('散点图')) return 'scatter';
  if (lowerPrompt.includes('热力图')) return 'heatmap';

  return 'auto'; // AI自动选择
}

/**
 * 提取标题
 */
function extractTitle(prompt) {
  const titleMap = {
    '正态分布': '正态分布图',
    '行星运动': '行星运动轨迹',
    '简谐振动': '简谐振动演示',
    '二次函数': '二次函数图像'
  };

  for (const [key, value] of Object.entries(titleMap)) {
    if (prompt.includes(key)) {
      return value;
    }
  }

  return prompt.substring(0, 20) + '...';
}

/**
 * 等待可视化生成完成
 */
async function waitForCompletion(generationId, prompt) {
  console.log('⏳ 等待可视化生成完成:', generationId);

  const maxAttempts = 20; // 最多等待20次
  const delay = 1000; // 每次等待1秒

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const response = await fetch(`http://localhost:9999/api/v2/status/${generationId}`);
      const status = await response.json();

      console.log(`📊 第${attempt + 1}次检查状态:`, status.status);

      if (status.status === 'completed') {
        return await getVisualizationResult(status.html_url || `/api/v2/visualizations/viz_${generationId.replace('viz_', '')}`, prompt);
      } else if (status.status === 'error') {
        throw new Error(status.error || '生成过程中出现错误');
      }

      // 等待一段时间后再次检查
      await new Promise(resolve => setTimeout(resolve, delay));
    } catch (error) {
      console.error(`❌ 第${attempt + 1}次检查失败:`, error);
      if (attempt === maxAttempts - 1) {
        throw error;
      }
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw new Error('生成超时，请重试');
}

/**
 * 获取可视化结果
 */
async function getVisualizationResult(url, prompt) {
  console.log('🔍 获取可视化结果:', url);

  try {
    const response = await fetch(`http://localhost:9999${url}`);
    const result = await response.json();

    console.log('📈 可视化结果:', result);

    return {
      id: result.visualization_id || 'viz_' + Date.now(),
      type: 'html',
      title: result.title || extractTitle(prompt),
      description: prompt,
      htmlContent: result.html_content || '',
      config: {
        theme: AppState.theme,
        animated: true,
        interactive: true
      },
      subject: 'general',
      gradeLevel: 'high_school',
      concepts: [],
      metadata: result.metadata || {},
      createdAt: result.created_at || new Date().toISOString()
    };
  } catch (error) {
    console.error('❌ 获取可视化结果失败:', error);
    throw error;
  }
}

/**
 * 生成模拟数据
 */
function generateMockData(prompt) {
  const dataTypes = {
    'bar': {
      labels: ['类别A', '类别B', '类别C', '类别D', '类别E'],
      datasets: [{
        label: '数据集1',
        data: [65, 59, 80, 81, 56]
      }]
    },
    'pie': {
      labels: ['部分A', '部分B', '部分C', '部分D'],
      datasets: [{
        data: [30, 25, 20, 25]
      }]
    },
    'line': {
      labels: ['1月', '2月', '3月', '4月', '5月', '6月'],
      datasets: [{
        label: '趋势线',
        data: [12, 19, 3, 5, 2, 3]
      }]
    }
  };

  const type = determineVisualizationType(prompt);
  return dataTypes[type] || dataTypes['bar'];
}

/**
 * 添加到历史记录
 */
function addToHistory(result) {
  AppState.history.unshift(result);
  if (AppState.history.length > 20) {
    AppState.history = AppState.history.slice(0, 20);
  }
}

/**
 * 显示生成结果
 */
function showResults(result) {
  console.log('🎉 生成完成:', result);
  showMessage(`✨ 已生成 "${result.title}"`, 'success');

  // 如果有HTML内容，在新窗口中显示
  if (result.htmlContent) {
    showVisualizationInNewWindow(result);
  } else {
    // 否则显示传统的数据可视化
    showTraditionalVisualization(result);
  }
}

/**
 * 在新窗口中显示可视化
 */
function showVisualizationInNewWindow(result) {
  try {
    let visualizationUrl = '';

    // 如果有HTML内容，直接使用
    if (result.htmlContent) {
      // 创建新窗口并写入HTML内容
      const newWindow = window.open('', '_blank', 'width=1200,height=800,scrollbars=yes,resizable=yes');

      if (newWindow) {
        newWindow.document.write(result.htmlContent);
        newWindow.document.close();
        newWindow.document.title = result.title || '可视化结果';
        newWindow.focus();

        console.log('✨ 可视化已在新窗口中打开 (直接HTML)');
        return;
      }
    }

    // 如果没有HTML内容但有ID，尝试通过URL访问
    if (result.id) {
      visualizationUrl = `http://localhost:9999/api/v2/visualizations/viz_${result.id.replace('viz_', '')}`;
    }

    // 如果有URL，直接打开
    if (visualizationUrl) {
      const newWindow = window.open(visualizationUrl, '_blank', 'width=1200,height=800,scrollbars=yes,resizable=yes');

      if (newWindow) {
        newWindow.focus();
        console.log('✨ 可视化已在新窗口中打开 (URL访问)');
      } else {
        console.warn('弹窗被阻止，尝试在当前页面显示');
        showVisualizationInCurrentPage(result);
      }
    } else {
      // 回退方案
      console.warn('没有可用的可视化内容，在当前页面显示');
      showVisualizationInCurrentPage(result);
    }
  } catch (error) {
    console.error('打开新窗口失败:', error);
    showVisualizationInCurrentPage(result);
  }
}

/**
 * 在当前页面显示可视化
 */
function showVisualizationInCurrentPage(result) {
  // 创建模态框或插入到页面中
  const modal = document.createElement('div');
  modal.className = 'visualization-modal';
  modal.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.8);
    z-index: 10000;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: auto;
  `;

  const modalContent = document.createElement('div');
  modalContent.style.cssText = `
    background: white;
    border-radius: 15px;
    width: 90%;
    max-width: 1200px;
    max-height: 90vh;
    overflow: auto;
    position: relative;
    margin: 20px;
  `;

  // 关闭按钮
  const closeBtn = document.createElement('button');
  closeBtn.innerHTML = '✕';
  closeBtn.style.cssText = `
    position: absolute;
    top: 15px;
    right: 15px;
    background: #f0f0f0;
    border: none;
    border-radius: 50%;
    width: 40px;
    height: 40px;
    font-size: 20px;
    cursor: pointer;
    z-index: 10001;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background 0.3s;
  `;

  closeBtn.addEventListener('mouseenter', () => {
    closeBtn.style.background = '#e0e0e0';
  });

  closeBtn.addEventListener('mouseleave', () => {
    closeBtn.style.background = '#f0f0f0';
  });

  closeBtn.addEventListener('click', () => {
    document.body.removeChild(modal);
  });

  // 创建iframe来显示HTML内容
  const iframe = document.createElement('iframe');
  iframe.style.cssText = `
    width: 100%;
    height: 80vh;
    border: none;
    border-radius: 15px;
  `;

  modalContent.appendChild(closeBtn);
  modalContent.appendChild(iframe);
  modal.appendChild(modalContent);
  document.body.appendChild(modal);

  // 设置iframe内容
  iframe.onload = () => {
    console.log('✨ 可视化已在当前页面加载完成');
  };

  iframe.onerror = () => {
    console.error('iframe加载失败');
    document.body.removeChild(modal);
    showMessage('可视化加载失败', 'error');
  };

  // 写入HTML内容到iframe
  iframe.srcdoc = result.htmlContent;

  // 点击模态框背景关闭
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      document.body.removeChild(modal);
    }
  });
}

/**
 * 显示传统的数据可视化（回退方案）
 */
function showTraditionalVisualization(result) {
  console.log('📊 显示传统可视化:', result);

  // 这里可以实现基于数据的前端可视化
  // 例如使用Chart.js、Plotly.js等库

  showMessage('📊 传统可视化模式（开发中）', 'info');
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

  // 滚动到对应的输入区域
  const inputSection = document.querySelector('.input-section');
  if (inputSection) {
    inputSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  // 更新输入提示
  updateInputPlaceholder(moduleType);
}

/**
 * 处理子分类点击
 */
function handleSubcategoryClick(e, subcategory) {
  // 检查是否点击了链接
  const clickedLink = e.target.closest('.subcategory-link');
  if (clickedLink) {
    // 如果点击的是链接，允许正常的链接跳转，不阻止默认行为
    console.log('🔗 点击模块链接，允许跳转:', clickedLink.href);
    return;
  }

  // 如果点击的是子分类的其他区域（非链接），则执行原来的逻辑
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
 * 更新输入提示
 */
function updateInputPlaceholder(moduleType) {
  if (!Elements.mainInput) return;

  const placeholders = {
    mathematics: '请描述您想要创建的数学可视化，例如：正态分布、函数图像、几何变换...',
    astronomy: '请描述您想要创建的天文可视化，例如：行星运动、星系演化、黑洞模拟...',
    physics: '请描述您想要创建的物理可视化，例如：简谐振动、电磁场、波动现象...',
    chemistry: '请描述您想要创建的化学可视化，例如：分子结构、化学反应、元素周期表...',
    probability: '请描述您想要可视化的概率统计问题，例如：正态分布、中心极限定理...',
    linear: '请描述您想要可视化的线性代数概念，例如：矩阵变换、特征向量...',
    calculus: '请描述您想要可视化的微积分概念，例如：导数、积分、极限...'
  };

  Elements.mainInput.placeholder = placeholders[moduleType] || '请描述您想要创建的可视化内容...';
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
      showMessage('文件上传功能开发中...', 'info');
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
 * 处理演示功能
 */
function handleDemoFeatures() {
  showMessage('🎯 演示功能：随机生成示例可视化', 'info');

  // 填充示例文本
  if (Elements.mainInput) {
    Elements.mainInput.value = '正态分布 均值0 标准差1 概率密度函数';
    handleInputChange();
  }
}

/**
 * 处理帮助
 */
function handleHelp() {
  showMessage('📚 帮助中心功能开发中...', 'info');
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
 * 处理点击外部区域
 */
function handleClickOutside(e) {
  // 关闭搜索建议
  if (Elements.searchSuggestions && !Elements.searchSuggestions.contains(e.target) &&
      !Elements.globalSearchInput.contains(e.target)) {
    hideSearchSuggestions();
  }

  // 关闭智能建议
  if (Elements.suggestionsContainer && !Elements.suggestionsContainer.contains(e.target) &&
      !Elements.mainInput.contains(e.target)) {
    hideSuggestions();
  }
}

/**
 * 显示消息
 */
function showMessage(message, type = 'info') {
  if (!Elements.messageContainer) return;

  const messageEl = document.createElement('div');
  messageEl.className = `message message-${type}`;
  messageEl.innerHTML = `
    <span class="message-text">${message}</span>
    <button class="message-close">×</button>
  `;

  Elements.messageContainer.appendChild(messageEl);

  // 显示动画
  setTimeout(() => messageEl.classList.add('show'), 10);

  // 绑定关闭事件
  const closeBtn = messageEl.querySelector('.message-close');
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      hideMessage(messageEl);
    });
  }

  // 自动移除
  setTimeout(() => {
    hideMessage(messageEl);
  }, 5000);
}

/**
 * 隐藏消息
 */
function hideMessage(messageEl) {
  if (messageEl && messageEl.parentNode) {
    messageEl.classList.remove('show');
    setTimeout(() => {
      if (messageEl.parentNode) {
        messageEl.parentNode.removeChild(messageEl);
      }
    }, 300);
  }
}

/**
 * 显示加载动画
 */
function showLoading() {
  if (Elements.loadingOverlay) {
    Elements.loadingOverlay.style.display = 'flex';
  }
}

/**
 * 隐藏加载动画
 */
function hideLoading() {
  if (Elements.loadingOverlay) {
    Elements.loadingOverlay.style.display = 'none';
  }
}

/**
 * 防抖函数
 */
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * 绑定提示词样例使用按钮事件
 */
function bindExampleUseButtons() {
  const useButtons = document.querySelectorAll('.example-use-btn');
  useButtons.forEach(button => {
    button.addEventListener('click', (e) => {
      e.stopPropagation();
      const exampleItem = button.closest('.example-item');
      const prompt = exampleItem.dataset.prompt;
      if (prompt && Elements.mainInput) {
        Elements.mainInput.value = prompt;
        Elements.mainInput.dispatchEvent(new Event('input'));
        showMessage(`已填入提示词: ${prompt}`, 'success');
        Elements.mainInput.focus();
      }
    });
  });
}

/**
 * 切换提示词样例可见性
 */
function toggleExamplesVisibility() {
  if (!Elements.examplesContent || !Elements.toggleExamples) return;

  const isVisible = Elements.examplesContent.style.display !== 'none';

  if (isVisible) {
    Elements.examplesContent.style.display = 'none';
    Elements.toggleExamples.textContent = '展开';
  } else {
    Elements.examplesContent.style.display = 'block';
    Elements.toggleExamples.textContent = '收起';
  }
}

/**
 * 使用提示词样例
 */
function useExamplePrompt(prompt) {
  if (!Elements.mainInput) return;

  Elements.mainInput.value = prompt;
  Elements.mainInput.dispatchEvent(new Event('input'));
  showMessage(`已填入提示词: ${prompt}`, 'success');

  // 可选：自动开始生成
  // if (Elements.generateBtn && !Elements.generateBtn.disabled) {
  //   setTimeout(() => {
  //     handleGenerate();
  //   }, 500);
  // }
}

/**
 * 根据输入内容动态提示
 */
function showDynamicSuggestions() {
  if (!Elements.suggestionsList || !Elements.suggestionsContainer) return;

  const input = Elements.mainInput.value.toLowerCase().trim();
  if (input.length < 2) {
    hideSuggestions();
    return;
  }

  // 简单的关键词匹配建议
  const suggestions = [];

  if (input.includes('分布') || input.includes('概率')) {
    suggestions.push('正态分布 均值0 标准差1', '二项分布 n=20 p=0.3', '泊松分布 λ=3');
  }

  if (input.includes('向量') || input.includes('矩阵')) {
    suggestions.push('向量投影 三维空间', '矩阵特征值分解 3x3矩阵', '线性变换 旋转矩阵');
  }

  if (input.includes('函数') || input.includes('图像')) {
    suggestions.push('函数图像 y = x^2 + 2x + 1', '三角函数 sin(x) cos(x)', '指数函数 e^x');
  }

  if (input.includes('行星') || input.includes('轨道')) {
    suggestions.push('太阳系行星运动 地球 火星', '月球轨道 地球系统', '哈雷彗星轨迹');
  }

  if (input.includes('波动') || input.includes('振动')) {
    suggestions.push('简谐振动 振幅2 频率1Hz', '电磁波传播 2D动画', '机械波 共振现象');
  }

  if (suggestions.length > 0) {
    displaySuggestions(suggestions);
  } else {
    hideSuggestions();
  }
}

/**
 * 显示建议列表
 */
function displaySuggestions(suggestions) {
  if (!Elements.suggestionsList) return;

  Elements.suggestionsList.innerHTML = suggestions
    .map(suggestion => `
      <div class="suggestion-item" data-suggestion="${suggestion}">
        <span class="suggestion-icon">💡</span>
        <span class="suggestion-text">${suggestion}</span>
        <button class="suggestion-use-btn">使用</button>
      </div>
    `)
    .join('');

  // 绑定使用按钮事件
  const useButtons = Elements.suggestionsList.querySelectorAll('.suggestion-use-btn');
  useButtons.forEach(button => {
    button.addEventListener('click', (e) => {
      e.stopPropagation();
      const suggestion = button.closest('.suggestion-item').dataset.suggestion;
      useExamplePrompt(suggestion);
      hideSuggestions();
    });
  });

  // 显示建议容器
  Elements.suggestionsContainer.style.display = 'block';
}

/**
 * 隐藏建议列表
 */
function hideSuggestions() {
  if (Elements.suggestionsContainer) {
    Elements.suggestionsContainer.style.display = 'none';
  }
}

/**
 * 节流函数
 */
function throttle(func, limit) {
  let inThrottle;
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
  initializeApp();
});

// 导出全局函数供HTML调用
window.UniversalVisFusion = {
  switchInputMode,
  handleGenerate,
  toggleTheme,
  showMessage,
  handleModuleClick,
  handleSubcategoryClick,
  handleQuickStart,
  handleDemoFeatures,
  handleHelp,
  useExamplePrompt,
  toggleExamplesVisibility,
  hideSuggestions
};