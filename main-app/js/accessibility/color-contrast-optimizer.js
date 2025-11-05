/**
 * 颜色对比度优化系统
 * 任务3.2.1中优先级改进 - 可访问性支持完善
 * 目标: WCAG 2.1 AA级合规，对比度 >= 4.5:1，支持高对比度模式
 */

class ColorContrastOptimizer {
    constructor(options = {}) {
        this.options = {
            targetRatio: options.targetRatio || 4.5,        // WCAG AA标准
            largeTextRatio: options.largeTextRatio || 3.0,   // 大文本对比度要求
            autoFix: options.autoFix !== false,             // 自动修复对比度问题
            enhanceHighContrast: options.enhanceHighContrast !== false,
            monitorChanges: options.monitorChanges !== false,
            verbose: options.verbose || false,
            colorPalettes: {
                normal: this.generateDefaultPalette(),
                highContrast: this.generateHighContrastPalette(),
                darkMode: this.generateDarkModePalette(),
                colorBlind: this.generateColorBlindPalette()
            },
            ...options
        };

        // 当前模式和状态
        this.currentMode = 'normal';
        this.isHighContrastMode = false;
        this.isDarkMode = false;
        this.detectedColorBlindness = null;

        // 对比度问题记录
        this.contrastIssues = [];
        this.fixedElements = new Set();
        this.monitoredElements = new WeakSet();

        // 颜色分析缓存
        this.colorCache = new Map();
        this.contrastCache = new Map();

        this.init();
    }

    /**
     * 初始化颜色对比度优化器
     */
    init() {
        try {
            // 检测用户偏好
            this.detectUserPreferences();

            // 初始化高对比度模式
            if (this.options.enhanceHighContrast) {
                this.initHighContrastMode();
            }

            // 创建对比度控制面板
            this.createControlPanel();

            // 分析现有颜色
            this.analyzePageColors();

            // 监听动态内容变化
            if (this.options.monitorChanges) {
                this.observeColorChanges();
            }

            // 监听系统主题变化
            this.initThemeMonitoring();

            // 应用用户偏好
            this.applyUserPreferences();

            console.log('🎨 颜色对比度优化器初始化完成');
            console.log(`🎯 目标对比度: ${this.options.targetRatio}:1`);

        } catch (error) {
            console.error('❌ 颜色对比度优化器初始化失败:', error);
        }
    }

    /**
     * 检测用户偏好
     */
    detectUserPreferences() {
        // 检测高对比度偏好
        this.prefersHighContrast = window.matchMedia('(prefers-contrast: high)').matches;

        // 检测深色模式偏好
        this.prefersDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;

        // 检测减少动画偏好
        this.prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        // 检测色盲类型（通过用户选择或简单测试）
        this.detectColorBlindness();

        console.log('🔍 用户偏好检测:', {
            highContrast: this.prefersHighContrast,
            darkMode: this.prefersDarkMode,
            reducedMotion: this.prefersReducedMotion,
            colorBlindness: this.detectedColorBlindness
        });
    }

    detectColorBlindness() {
        // 这里可以实现简单的色盲检测测试
        // 或者从本地存储读取用户设置
        const storedPreference = localStorage.getItem('colorBlindness');
        if (storedPreference) {
            this.detectedColorBlindness = storedPreference;
        }
    }

    /**
     * 初始化高对比度模式
     */
    initHighContrastMode() {
        // 监听高对比度媒体查询
        const highContrastQuery = window.matchMedia('(prefers-contrast: high)');
        highContrastQuery.addListener((e) => {
            this.toggleHighContrastMode(e.matches);
        });

        // 如果系统偏好高对比度，自动启用
        if (this.prefersHighContrast) {
            this.toggleHighContrastMode(true);
        }

        console.log('🎭 高对比度模式监控已启动');
    }

    /**
     * 创建控制面板
     */
    createControlPanel() {
        const panel = document.createElement('div');
        panel.id = 'color-contrast-control';
        panel.className = 'color-contrast-panel';
        panel.innerHTML = `
            <div class="panel-header">
                <h3>颜色对比度设置</h3>
                <button class="panel-toggle" aria-label="切换面板">−</button>
            </div>
            <div class="panel-content">
                <div class="control-group">
                    <label>
                        <input type="checkbox" id="auto-fix" ${this.options.autoFix ? 'checked' : ''}>
                        自动修复对比度问题
                    </label>
                </div>
                <div class="control-group">
                    <label>颜色模式:</label>
                    <select id="color-mode">
                        <option value="normal" ${this.currentMode === 'normal' ? 'selected' : ''}>标准</option>
                        <option value="high-contrast" ${this.currentMode === 'high-contrast' ? 'selected' : ''}>高对比度</option>
                        <option value="dark" ${this.currentMode === 'dark' ? 'selected' : ''}>深色模式</option>
                        <option value="colorblind" ${this.currentMode === 'colorblind' ? 'selected' : ''}>色盲友好</option>
                    </select>
                </div>
                <div class="control-group">
                    <label>色盲类型:</label>
                    <select id="colorblind-type">
                        <option value="none">无</option>
                        <option value="protanopia">红色盲</option>
                        <option value="deuteranopia">绿色盲</option>
                        <option value="tritanopia">蓝色盲</option>
                        <option value="achromatopsia">全色盲</option>
                    </select>
                </div>
                <div class="control-group">
                    <button id="analyze-colors">分析页面颜色</button>
                    <button id="fix-contrast">修复对比度问题</button>
                </div>
                <div class="control-group">
                    <div id="contrast-stats">统计: 0个元素检查</div>
                </div>
            </div>
        `;

        // 添加样式
        const style = document.createElement('style');
        style.textContent = `
            .color-contrast-panel {
                position: fixed;
                top: 20px;
                right: 20px;
                width: 300px;
                background: white;
                border: 1px solid #ccc;
                border-radius: 8px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                z-index: 9999;
                font-family: system-ui, sans-serif;
                font-size: 14px;
                transition: all 0.3s ease;
            }

            .color-contrast-panel.collapsed .panel-content {
                display: none;
            }

            .panel-header {
                padding: 12px 16px;
                background: #f5f5f5;
                border-bottom: 1px solid #ddd;
                display: flex;
                justify-content: space-between;
                align-items: center;
                cursor: pointer;
            }

            .panel-header h3 {
                margin: 0;
                font-size: 16px;
            }

            .panel-toggle {
                background: none;
                border: none;
                font-size: 18px;
                cursor: pointer;
                padding: 0;
                width: 24px;
                height: 24px;
                display: flex;
                align-items: center;
                justify-content: center;
            }

            .panel-content {
                padding: 16px;
                max-height: 400px;
                overflow-y: auto;
            }

            .control-group {
                margin-bottom: 12px;
            }

            .control-group label {
                display: block;
                margin-bottom: 4px;
                font-weight: 500;
            }

            .control-group input[type="checkbox"] {
                margin-right: 8px;
            }

            .control-group select,
            .control-group button {
                width: 100%;
                padding: 6px 8px;
                border: 1px solid #ddd;
                border-radius: 4px;
                background: white;
            }

            .control-group button {
                background: #007bff;
                color: white;
                border: none;
                cursor: pointer;
                margin-bottom: 8px;
            }

            .control-group button:hover {
                background: #0056b3;
            }

            #contrast-stats {
                font-size: 12px;
                color: #666;
                padding: 8px;
                background: #f8f9fa;
                border-radius: 4px;
            }

            /* 高对比度模式样式 */
            body.high-contrast .color-contrast-panel {
                border: 2px solid #000;
                background: #fff;
                color: #000;
            }

            body.high-contrast .panel-header {
                background: #000;
                color: #fff;
            }

            body.high-contrast .control-group button {
                background: #000;
                color: #fff;
                border: 2px solid #000;
            }

            /* 深色模式样式 */
            body.dark-mode .color-contrast-panel {
                background: #2d2d2d;
                border-color: #555;
                color: #fff;
            }

            body.dark-mode .panel-header {
                background: #1a1a1a;
                border-color: #555;
            }

            body.dark-mode .control-group select,
            body.dark-mode .control-group input {
                background: #404040;
                border-color: #555;
                color: #fff;
            }
        `;

        document.head.appendChild(style);
        document.body.appendChild(panel);

        // 绑定事件
        this.bindControlEvents(panel);
    }

    bindControlEvents(panel) {
        // 面板折叠/展开
        panel.querySelector('.panel-toggle').addEventListener('click', () => {
            panel.classList.toggle('collapsed');
        });

        // 自动修复选项
        panel.querySelector('#auto-fix').addEventListener('change', (e) => {
            this.options.autoFix = e.target.checked;
            if (this.options.autoFix) {
                this.fixAllContrastIssues();
            }
        });

        // 颜色模式切换
        panel.querySelector('#color-mode').addEventListener('change', (e) => {
            this.switchColorMode(e.target.value);
        });

        // 色盲类型选择
        panel.querySelector('#colorblind-type').addEventListener('change', (e) => {
            this.detectedColorBlindness = e.target.value === 'none' ? null : e.target.value;
            localStorage.setItem('colorBlindness', e.target.value);
            this.applyColorBlindFilter();
        });

        // 分析颜色按钮
        panel.querySelector('#analyze-colors').addEventListener('click', () => {
            this.analyzePageColors();
        });

        // 修复对比度按钮
        panel.querySelector('#fix-contrast').addEventListener('click', () => {
            this.fixAllContrastIssues();
        });
    }

    /**
     * 分析页面颜色
     */
    analyzePageColors() {
        console.log('🔍 开始分析页面颜色...');

        this.contrastIssues = [];
        const elements = document.querySelectorAll('*');
        let checkedCount = 0;

        elements.forEach(element => {
            if (this.shouldCheckElement(element)) {
                const issues = this.checkElementContrast(element);
                if (issues.length > 0) {
                    this.contrastIssues.push(...issues);
                }
                checkedCount++;
            }
        });

        this.updateContrastStats(checkedCount, this.contrastIssues.length);

        if (this.options.verbose) {
            console.log(`📊 颜色分析完成: ${checkedCount}个元素检查，${this.contrastIssues.length}个对比度问题`);
        }

        // 自动修复
        if (this.options.autoFix && this.contrastIssues.length > 0) {
            this.fixAllContrastIssues();
        }

        return {
            checkedElements: checkedCount,
            issues: this.contrastIssues.length,
            issueDetails: this.contrastIssues
        };
    }

    shouldCheckElement(element) {
        // 检查元素是否需要对比度检查
        const computedStyle = window.getComputedStyle(element);
        const hasText = element.textContent.trim().length > 0;
        const hasBackground = computedStyle.backgroundColor !== 'rgba(0, 0, 0, 0)' &&
                             computedStyle.backgroundColor !== 'transparent';

        return hasText && hasBackground && !this.monitoredElements.has(element);
    }

    checkElementContrast(element) {
        const issues = [];
        const computedStyle = window.getComputedStyle(element);

        try {
            // 获取颜色值
            const foregroundColor = this.parseColor(computedStyle.color);
            const backgroundColor = this.parseColor(computedStyle.backgroundColor);

            if (!foregroundColor || !backgroundColor) {
                return issues;
            }

            // 计算对比度
            const contrastRatio = this.calculateContrastRatio(foregroundColor, backgroundColor);

            // 确定是否为大文本
            const isLargeText = this.isLargeText(element);

            // 确定对比度要求
            const requiredRatio = isLargeText ? this.options.largeTextRatio : this.options.targetRatio;

            // 检查是否符合标准
            if (contrastRatio < requiredRatio) {
                issues.push({
                    element: element,
                    foregroundColor: computedStyle.color,
                    backgroundColor: computedStyle.backgroundColor,
                    contrastRatio: contrastRatio,
                    requiredRatio: requiredRatio,
                    isLargeText: isLargeText,
                    severity: contrastRatio < 3.0 ? 'error' : 'warning'
                });

                // 高亮问题元素
                if (this.options.verbose) {
                    element.style.outline = '2px dashed red';
                    element.title = `对比度不足: ${contrastRatio.toFixed(2)}:1 (要求: ${requiredRatio}:1)`;
                }
            }

            // 缓存结果
            const elementId = this.getElementId(element);
            this.contrastCache.set(elementId, {
                contrastRatio: contrastRatio,
                foregroundColor: foregroundColor,
                backgroundColor: backgroundColor,
                timestamp: Date.now()
            });

        } catch (error) {
            console.warn('⚠️ 元素对比度检查失败:', error);
        }

        return issues;
    }

    parseColor(colorString) {
        // 从缓存获取
        if (this.colorCache.has(colorString)) {
            return this.colorCache.get(colorString);
        }

        let color = null;

        try {
            // 解析各种颜色格式
            if (colorString.startsWith('rgb')) {
                const matches = colorString.match(/\d+/g);
                if (matches && matches.length >= 3) {
                    color = {
                        r: parseInt(matches[0]),
                        g: parseInt(matches[1]),
                        b: parseInt(matches[2]),
                        a: matches[3] ? parseFloat(matches[3]) : 1
                    };
                }
            } else if (colorString.startsWith('#')) {
                const hex = colorString.substring(1);
                if (hex.length === 3) {
                    color = {
                        r: parseInt(hex[0] + hex[0], 16),
                        g: parseInt(hex[1] + hex[1], 16),
                        b: parseInt(hex[2] + hex[2], 16),
                        a: 1
                    };
                } else if (hex.length === 6) {
                    color = {
                        r: parseInt(hex.substring(0, 2), 16),
                        g: parseInt(hex.substring(2, 4), 16),
                        b: parseInt(hex.substring(4, 6), 16),
                        a: 1
                    };
                }
            } else if (colorString === 'transparent') {
                color = { r: 0, g: 0, b: 0, a: 0 };
            } else {
                // 尝试使用浏览器API解析命名颜色
                const tempElement = document.createElement('div');
                tempElement.style.color = colorString;
                document.body.appendChild(tempElement);
                const computedColor = window.getComputedStyle(tempElement).color;
                document.body.removeChild(tempElement);

                color = this.parseColor(computedColor);
            }

            // 缓存结果
            if (color) {
                this.colorCache.set(colorString, color);
            }

        } catch (error) {
            console.warn('⚠️ 颜色解析失败:', colorString, error);
        }

        return color;
    }

    calculateContrastRatio(color1, color2) {
        // 计算相对亮度
        const l1 = this.calculateRelativeLuminance(color1);
        const l2 = this.calculateRelativeLuminance(color2);

        // 计算对比度
        const lighter = Math.max(l1, l2);
        const darker = Math.min(l1, l2);

        return (lighter + 0.05) / (darker + 0.05);
    }

    calculateRelativeLuminance(color) {
        let { r, g, b } = color;

        // 转换为0-1范围
        r = r / 255;
        g = g / 255;
        b = b / 255;

        // 应用gamma校正
        r = r <= 0.03928 ? r / 12.92 : Math.pow((r + 0.055) / 1.055, 2.4);
        g = g <= 0.03928 ? g / 12.92 : Math.pow((g + 0.055) / 1.055, 2.4);
        b = b <= 0.03928 ? b / 12.92 : Math.pow((b + 0.055) / 1.055, 2.4);

        // 计算相对亮度
        return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    }

    isLargeText(element) {
        const computedStyle = window.getComputedStyle(element);
        const fontSize = parseFloat(computedStyle.fontSize);
        const fontWeight = computedStyle.fontWeight;

        // 大于18px或大于14px且粗体
        return fontSize >= 18 || (fontSize >= 14 && (fontWeight === 'bold' || parseInt(fontWeight) >= 700));
    }

    getElementId(element) {
        if (element.id) {
            return `#${element.id}`;
        } else if (element.className) {
            return `.${element.className.split(' ').join('.')}`;
        } else {
            return element.tagName.toLowerCase();
        }
    }

    /**
     * 修复对比度问题
     */
    fixAllContrastIssues() {
        console.log('🔧 开始修复对比度问题...');

        let fixedCount = 0;
        this.contrastIssues.forEach(issue => {
            if (this.fixElementContrast(issue)) {
                fixedCount++;
            }
        });

        console.log(`✅ 修复完成: ${fixedCount}/${this.contrastIssues.length} 个问题已修复`);
        this.updateContrastStats(0, this.contrastIssues.length - fixedCount);

        return fixedCount;
    }

    fixElementContrast(issue) {
        const { element, foregroundColor, backgroundColor, contrastRatio, requiredRatio } = issue;

        try {
            // 计算新颜色
            const newColors = this.calculateOptimalColors(foregroundColor, backgroundColor, requiredRatio);

            if (newColors) {
                // 应用新颜色
                element.style.color = newColors.foreground;
                if (newColors.background) {
                    element.style.backgroundColor = newColors.background;
                }

                // 移除问题高亮
                element.style.outline = '';
                element.title = '';

                // 记录已修复元素
                this.fixedElements.add(element);

                return true;
            }
        } catch (error) {
            console.warn('⚠️ 修复对比度失败:', error);
        }

        return false;
    }

    calculateOptimalColors(foregroundColor, backgroundColor, targetRatio) {
        const bg = this.parseColor(backgroundColor);
        const fg = this.parseColor(foregroundColor);

        if (!bg || !fg) {
            return null;
        }

        // 尝试调整前景色亮度
        let newForeground = this.adjustColorBrightness(fg, bg, targetRatio);
        if (newForeground) {
            return { foreground: this.rgbToString(newForeground), background: null };
        }

        // 如果前景色调整不够，尝试调整背景色
        let newBackground = this.adjustColorBrightness(bg, fg, targetRatio);
        if (newBackground) {
            return { foreground: null, background: this.rgbToString(newBackground) };
        }

        // 如果都不够，使用高对比度配色
        const highContrastColors = this.getHighContrastColors(bg);
        if (highContrastColors) {
            return highContrastColors;
        }

        return null;
    }

    adjustColorBrightness(color, referenceColor, targetRatio) {
        let step = 5; // 调整步长
        let adjustedColor = { ...color };

        // 尝试调整亮度
        for (let i = 0; i < 20; i++) {
            // 先尝试调亮
            adjustedColor = this.lightenColor(color, step * i);
            if (this.calculateContrastRatio(adjustedColor, referenceColor) >= targetRatio) {
                return adjustedColor;
            }

            // 再尝试调暗
            adjustedColor = this.darkenColor(color, step * i);
            if (this.calculateContrastRatio(adjustedColor, referenceColor) >= targetRatio) {
                return adjustedColor;
            }
        }

        return null;
    }

    lightenColor(color, percent) {
        return {
            r: Math.min(255, Math.round(color.r + (255 - color.r) * percent / 100)),
            g: Math.min(255, Math.round(color.g + (255 - color.g) * percent / 100)),
            b: Math.min(255, Math.round(color.b + (255 - color.b) * percent / 100)),
            a: color.a
        };
    }

    darkenColor(color, percent) {
        return {
            r: Math.max(0, Math.round(color.r * (1 - percent / 100))),
            g: Math.max(0, Math.round(color.g * (1 - percent / 100))),
            b: Math.max(0, Math.round(color.b * (1 - percent / 100))),
            a: color.a
        };
    }

    getHighContrastColors(referenceColor) {
        const isLightBg = this.calculateRelativeLuminance(referenceColor) > 0.5;

        if (isLightBg) {
            return {
                foreground: '#000000',
                background: null
            };
        } {
            return {
                foreground: '#ffffff',
                background: null
            };
        }
    }

    rgbToString(color) {
        if (color.a < 1) {
            return `rgba(${color.r}, ${color.g}, ${color.b}, ${color.a})`;
        } else {
            return `rgb(${color.r}, ${color.g}, ${color.b})`;
        }
    }

    /**
     * 颜色模式管理
     */
    switchColorMode(mode) {
        this.currentMode = mode;
        document.body.className = document.body.className.replace(/\\b(color-mode-\\w+)\\b/g, '');

        switch (mode) {
            case 'high-contrast':
                document.body.classList.add('high-contrast');
                this.applyHighContrastPalette();
                break;
            case 'dark':
                document.body.classList.add('dark-mode');
                this.applyDarkModePalette();
                break;
            case 'colorblind':
                document.body.classList.add('colorblind-mode');
                this.applyColorBlindPalette();
                break;
            default:
                this.applyNormalPalette();
        }

        console.log(`🎨 切换到${mode}模式`);
    }

    toggleHighContrastMode(enabled) {
        this.isHighContrastMode = enabled;
        if (enabled) {
            this.switchColorMode('high-contrast');
        } else {
            this.switchColorMode('normal');
        }
    }

    /**
     * 调色板生成和应用
     */
    generateDefaultPalette() {
        return {
            primary: '#007bff',
            secondary: '#6c757d',
            success: '#28a745',
            warning: '#ffc107',
            error: '#dc3545',
            background: '#ffffff',
            surface: '#f8f9fa',
            text: '#212529',
            textSecondary: '#6c757d'
        };
    }

    generateHighContrastPalette() {
        return {
            primary: '#0000ff',
            secondary: '#666666',
            success: '#008000',
            warning: '#ff8c00',
            error: '#ff0000',
            background: '#ffffff',
            surface: '#ffffff',
            text: '#000000',
            textSecondary: '#000000'
        };
    }

    generateDarkModePalette() {
        return {
            primary: '#4dabf7',
            secondary: '#adb5bd',
            success: '#51cf66',
            warning: '#ffd43b',
            error: '#ff6b6b',
            background: '#1a1a1a',
            surface: '#2d2d2d',
            text: '#ffffff',
            textSecondary: '#adb5bd'
        };
    }

    generateColorBlindPalette() {
        return {
            primary: '#0066cc',    // 蓝色系，对大多数色盲友好
            secondary: '#666666',
            success: '#009966',    // 避免红色/绿色
            warning: '#ff9933',    // 橙色系
            error: '#cc3366',      // 粉红色系
            background: '#ffffff',
            surface: '#f5f5f5',
            text: '#333333',
            textSecondary: '#666666'
        };
    }

    applyNormalPalette() {
        const palette = this.options.colorPalettes.normal;
        this.applyPalette(palette);
    }

    applyHighContrastPalette() {
        const palette = this.options.colorPalettes.highContrast;
        this.applyPalette(palette);
    }

    applyDarkModePalette() {
        const palette = this.options.colorPalettes.darkMode;
        this.applyPalette(palette);
    }

    applyColorBlindPalette() {
        const palette = this.options.colorPalettes.colorBlind;
        this.applyPalette(palette);
    }

    applyPalette(palette) {
        const root = document.documentElement;

        // 设置CSS变量
        root.style.setProperty('--color-primary', palette.primary);
        root.style.setProperty('--color-secondary', palette.secondary);
        root.style.setProperty('--color-success', palette.success);
        root.style.setProperty('--color-warning', palette.warning);
        root.style.setProperty('--color-error', palette.error);
        root.style.setProperty('--color-background', palette.background);
        root.style.setProperty('--color-surface', palette.surface);
        root.style.setProperty('--color-text', palette.text);
        root.style.setProperty('--color-text-secondary', palette.textSecondary);
    }

    applyColorBlindFilter() {
        if (!this.detectedColorBlindness) {
            document.documentElement.style.setProperty('filter', 'none');
            return;
        }

        let filter = 'none';

        switch (this.detectedColorBlindness) {
            case 'protanopia': // 红色盲
                filter = 'url(#protanopia-filter)';
                break;
            case 'deuteranopia': // 绿色盲
                filter = 'url(#deuteranopia-filter)';
                break;
            case 'tritanopia': // 蓝色盲
                filter = 'url(#tritanopia-filter)';
                break;
            case 'achromatopsia': // 全色盲
                filter = 'grayscale(100%)';
                break;
        }

        document.documentElement.style.setProperty('filter', filter);
        this.createColorBlindFilters();
    }

    createColorBlindFilters() {
        // 创建SVG滤镜
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.innerHTML = `
            <defs>
                <filter id="protanopia-filter">
                    <feColorMatrix type="matrix" values="
                        0.567, 0.433, 0,     0, 0
                        0.558, 0.442, 0,     0, 0
                        0,     0.242, 0.758, 0, 0
                        0,     0,     0,     1, 0
                    "/>
                </filter>
                <filter id="deuteranopia-filter">
                    <feColorMatrix type="matrix" values="
                        0.625, 0.375, 0,   0, 0
                        0.7,   0.3,   0,   0, 0
                        0,     0.3,   0.7, 0, 0
                        0,     0,     0,   1, 0
                    "/>
                </filter>
                <filter id="tritanopia-filter">
                    <feColorMatrix type="matrix" values="
                        0.95, 0.05,  0,     0, 0
                        0,    0.433, 0.567, 0, 0
                        0,    0.475, 0.525, 0, 0
                        0,    0,     0,     1, 0
                    "/>
                </filter>
            </defs>
        `;

        // 隐藏SVG但保持滤镜可用
        svg.style.position = 'absolute';
        svg.style.width = '0';
        svg.style.height = '0';

        if (!document.querySelector('#colorblind-filters')) {
            svg.id = 'colorblind-filters';
            document.body.appendChild(svg);
        }
    }

    /**
     * 主题监控
     */
    initThemeMonitoring() {
        // 监听深色模式变化
        const darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)');
        darkModeQuery.addListener((e) => {
            this.prefersDarkMode = e.matches;
            if (this.currentMode === 'normal') {
                this.switchColorMode(this.prefersDarkMode ? 'dark' : 'normal');
            }
        });

        // 监听高对比度变化
        const highContrastQuery = window.matchMedia('(prefers-contrast: high)');
        highContrastQuery.addListener((e) => {
            this.prefersHighContrast = e.matches;
            this.toggleHighContrastMode(e.matches);
        });
    }

    /**
     * 动态内容监控
     */
    observeColorChanges() {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        this.checkNewElement(node);
                    }
                });
            });
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['style', 'class']
        });
    }

    checkNewElement(element) {
        if (this.shouldCheckElement(element)) {
            const issues = this.checkElementContrast(element);
            if (issues.length > 0) {
                this.contrastIssues.push(...issues);

                if (this.options.autoFix) {
                    issues.forEach(issue => this.fixElementContrast(issue));
                }
            }
        }

        // 递归检查子元素
        element.querySelectorAll('*').forEach(child => {
            if (this.shouldCheckElement(child)) {
                this.checkNewElement(child);
            }
        });
    }

    /**
     * 应用用户偏好
     */
    applyUserPreferences() {
        if (this.prefersHighContrast) {
            this.switchColorMode('high-contrast');
        } else if (this.prefersDarkMode) {
            this.switchColorMode('dark');
        }

        if (this.detectedColorBlindness) {
            this.applyColorBlindFilter();
        }
    }

    /**
     * 统计和报告
     */
    updateContrastStats(checked, issues) {
        const statsElement = document.getElementById('contrast-stats');
        if (statsElement) {
            const issueCount = this.contrastIssues.length;
            const fixedCount = this.fixedElements.size;
            const remaining = issueCount - fixedCount;

            statsElement.innerHTML = `
                统计: ${checked}个元素检查<br>
                问题: ${issueCount}个 (已修复: ${fixedCount}, 剩余: ${remaining})
            `;
        }
    }

    generateContrastReport() {
        const report = {
            timestamp: new Date().toISOString(),
            mode: this.currentMode,
            totalElements: document.querySelectorAll('*').length,
            checkedElements: this.contrastCache.size,
            totalIssues: this.contrastIssues.length,
            fixedIssues: this.fixedElements.size,
            remainingIssues: this.contrastIssues.length - this.fixedElements.size,
            issuesBySeverity: {
                error: this.contrastIssues.filter(i => i.severity === 'error').length,
                warning: this.contrastIssues.filter(i => i.severity === 'warning').length
            },
            userPreferences: {
                highContrast: this.prefersHighContrast,
                darkMode: this.prefersDarkMode,
                colorBlindness: this.detectedColorBlindness
            },
            recommendations: this.generateRecommendations()
        };

        console.log('📊 颜色对比度报告:', report);
        return report;
    }

    generateRecommendations() {
        const recommendations = [];

        if (this.contrastIssues.length > 0) {
            recommendations.push('发现对比度问题，建议使用自动修复功能');
        }

        if (!this.prefersHighContrast && this.contrastIssues.filter(i => i.severity === 'error').length > 0) {
            recommendations.push('存在严重对比度问题，建议启用高对比度模式');
        }

        if (this.detectedColorBlindness) {
            recommendations.push(`已检测到${this.detectedColorBlindness}色盲，已应用相应的颜色过滤器`);
        }

        if (recommendations.length === 0) {
            recommendations.push('颜色对比度检查通过，符合WCAG 2.1 AA标准');
        }

        return recommendations;
    }

    /**
     * 公共API
     */
    getCurrentMode() {
        return this.currentMode;
    }

    getContrastIssues() {
        return this.contrastIssues;
    }

    getStats() {
        return {
            mode: this.currentMode,
            isHighContrastMode: this.isHighContrastMode,
            isDarkMode: this.isDarkMode,
            colorBlindness: this.detectedColorBlindness,
            totalIssues: this.contrastIssues.length,
            fixedIssues: this.fixedElements.size,
            remainingIssues: this.contrastIssues.length - this.fixedElements.size
        };
    }

    setAutoFix(enabled) {
        this.options.autoFix = enabled;
        const checkbox = document.getElementById('auto-fix');
        if (checkbox) {
            checkbox.checked = enabled;
        }

        if (enabled && this.contrastIssues.length > 0) {
            this.fixAllContrastIssues();
        }
    }

    reset() {
        // 清除所有修复
        this.fixedElements.forEach(element => {
            element.style.color = '';
            element.style.backgroundColor = '';
            element.style.outline = '';
            element.title = '';
        });

        this.fixedElements.clear();
        this.contrastIssues = [];
        this.contrastCache.clear();

        // 重置为标准模式
        this.switchColorMode('normal');

        console.log('🔄 颜色对比度优化器已重置');
    }
}

// 创建全局实例
const colorContrastOptimizer = new ColorContrastOptimizer({
    targetRatio: 4.5,
    autoFix: true,
    enhanceHighContrast: true,
    monitorChanges: true,
    verbose: false
});

// 导出供其他模块使用
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ColorContrastOptimizer;
}

// 全局暴露
window.ColorContrastOptimizer = ColorContrastOptimizer;
window.colorContrastOptimizer = colorContrastOptimizer;