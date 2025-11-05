/**
 * 键盘导航路径优化系统
 * 任务3.2.1中优先级改进 - 可访问性支持完善
 * 目标: 提供直观、高效的键盘导航体验，符合WCAG 2.1标准
 */

class KeyboardNavigationManager {
    constructor(options = {}) {
        this.options = {
            enableVisualFocus: options.enableVisualFocus !== false,
            enableSkipLinks: options.enableSkipLinks !== false,
            enableFocusTraps: options.enableFocusTraps !== false,
            enableKeyboardShortcuts: options.enableKeyboardShortcuts !== false,
            enableRovingTabindex: options.enableRovingTabindex !== false,
            focusIndicator: {
                outline: options.focusIndicator?.outline !== false,
                highlight: options.focusIndicator?.highlight !== false,
                offset: options.focusIndicator?.offset || 2
            },
            shortcuts: {
                ...this.getDefaultShortcuts(),
                ...options.shortcuts
            },
            ...options
        };

        // 导航状态
        this.currentFocusElement = null;
        this.focusHistory = [];
        this.modalStack = [];
        this.rovingTabindexGroups = new Map();
        this.keyboardShortcuts = new Map();
        this.announceMessages = [];

        // 焦点指示器
        this.focusIndicator = null;
        this.focusVisibleTimeout = null;

        this.init();
    }

    /**
     * 初始化键盘导航系统
     */
    init() {
        try {
            // 创建焦点指示器
            if (this.options.enableVisualFocus) {
                this.createFocusIndicator();
            }

            // 创建跳转链接
            if (this.options.enableSkipLinks) {
                this.createSkipLinks();
            }

            // 初始化事件监听
            this.initEventListeners();

            // 初始化键盘快捷键
            if (this.options.enableKeyboardShortcuts) {
                this.initKeyboardShortcuts();
            }

            // 增强现有焦点元素
            this.enhanceFocusableElements();

            // 初始化循环焦点（Roving Tabindex）
            if (this.options.enableRovingTabindex) {
                this.initRovingTabindex();
            }

            // 检测用户导航方式
            this.detectNavigationMethod();

            console.log('⌨️ 键盘导航系统初始化完成');

        } catch (error) {
            console.error('❌ 键盘导航系统初始化失败:', error);
        }
    }

    /**
     * 创建焦点指示器
     */
    createFocusIndicator() {
        this.focusIndicator = document.createElement('div');
        this.focusIndicator.className = 'keyboard-focus-indicator';
        this.focusIndicator.style.cssText = `
            position: absolute;
            pointer-events: none;
            z-index: 9999;
            border: 2px solid #007bff;
            border-radius: 4px;
            background: rgba(0, 123, 255, 0.1);
            transition: all 0.2s ease;
            opacity: 0;
            transform: scale(0.95);
            box-shadow: 0 0 0 1px rgba(0, 123, 255, 0.3);
        `;

        document.body.appendChild(this.focusIndicator);

        // 创建焦点指示器样式
        const style = document.createElement('style');
        style.textContent = `
            .keyboard-focus-indicator.active {
                opacity: 1 !important;
                transform: scale(1) !important;
            }

            body.keyboard-navigation *:focus {
                outline: 2px solid #007bff !important;
                outline-offset: ${this.options.focusIndicator.offset}px !important;
            }

            body.keyboard-navigation *:focus:not(:focus-visible) {
                outline: none !important;
            }

            body.keyboard-navigation *:focus-visible {
                outline: 2px solid #007bff !important;
                outline-offset: ${this.options.focusIndicator.offset}px !important;
            }

            .skip-links {
                position: absolute;
                top: -40px;
                left: 0;
            }

            .skip-links:focus-within {
                top: 0;
            }

            .skip-link {
                position: absolute;
                left: -9999px;
                top: auto;
                width: 1px;
                height: 1px;
                overflow: hidden;
                z-index: 99999;
                background: #000;
                color: #fff;
                padding: 8px 16px;
                text-decoration: none;
                border-radius: 0 0 4px 0;
            }

            .skip-link:focus {
                left: 0;
                width: auto;
                height: auto;
                overflow: visible;
            }
        `;

        document.head.appendChild(style);
    }

    /**
     * 创建跳转链接
     */
    createSkipLinks() {
        const skipLinksData = [
            { target: 'main', text: '跳转到主内容', key: 'M' },
            { target: 'nav', text: '跳转到导航', key: 'N' },
            { target: '[role="search"]', text: '跳转到搜索', key: 'S' },
            { target: 'footer', text: '跳转到页脚', key: 'F' }
        ];

        const skipLinksContainer = document.createElement('div');
        skipLinksContainer.className = 'skip-links';
        skipLinksContainer.setAttribute('role', 'navigation');
        skipLinksContainer.setAttribute('aria-label', '快速跳转链接');

        skipLinksData.forEach(linkData => {
            const skipLink = document.createElement('a');
            skipLink.href = `#${linkData.target}`;
            skipLink.className = 'skip-link';
            skipLink.textContent = `${linkData.text} (Alt+${linkData.key})`;
            skipLink.setAttribute('data-shortcut', `alt+${linkData.key.toLowerCase()}`);

            skipLink.addEventListener('click', (e) => {
                e.preventDefault();
                this.navigateToElement(linkData.target, linkData.text);
            });

            skipLinksContainer.appendChild(skipLink);
        });

        document.body.insertBefore(skipLinksContainer, document.body.firstChild);
    }

    /**
     * 初始化事件监听器
     */
    initEventListeners() {
        // 键盘事件
        document.addEventListener('keydown', this.handleKeyDown.bind(this));
        document.addEventListener('keyup', this.handleKeyUp.bind(this));

        // 焦点事件
        document.addEventListener('focus', this.handleFocus.bind(this), true);
        document.addEventListener('blur', this.handleBlur.bind(this), true);

        // 鼠标事件（检测是否使用鼠标）
        document.addEventListener('mousedown', this.handleMouseDown.bind(this));
        document.addEventListener('mousemove', this.handleMouseMove.bind(this));

        // 动态内容监听
        this.observeDynamicContent();

        // 模态框监听
        this.observeModals();
    }

    /**
     * 键盘按下事件处理
     */
    handleKeyDown(event) {
        // 标记为键盘导航
        document.body.classList.add('keyboard-navigation');

        // 清除焦点可见性超时
        if (this.focusVisibleTimeout) {
            clearTimeout(this.focusVisibleTimeout);
        }

        // 处理特殊按键组合
        this.handleKeyCombinations(event);

        // 处理导航键
        this.handleNavigationKeys(event);

        // 处理快捷键
        this.handleKeyboardShortcuts(event);

        // 处理模态框导航
        this.handleModalNavigation(event);

        // 记录焦点历史
        if (event.key === 'Tab') {
            this.recordFocusHistory();
        }
    }

    /**
     * 处理键盘组合键
     */
    handleKeyCombinations(event) {
        const key = event.key.toLowerCase();
        const altKey = event.altKey;
        const ctrlKey = event.ctrlKey;
        const shiftKey = event.shiftKey;

        // Alt + 字母键的快捷操作
        if (altKey && !ctrlKey && !shiftKey) {
            switch (key) {
                case 'm':
                    event.preventDefault();
                    this.navigateToElement('main', '主内容');
                    break;
                case 'n':
                    event.preventDefault();
                    this.navigateToElement('nav', '导航');
                    break;
                case 's':
                    event.preventDefault();
                    this.navigateToElement('[role="search"], input[type="search"]', '搜索');
                    break;
                case 'f':
                    event.preventDefault();
                    this.navigateToElement('footer', '页脚');
                    break;
                case 'h':
                    event.preventDefault();
                    this.showHelpDialog();
                    break;
                case 'a':
                    event.preventDefault();
                    this.runAccessibilityAudit();
                    break;
            }
        }

        // Ctrl + 键的组合
        if (ctrlKey && !altKey) {
            switch (key) {
                case '/':
                    event.preventDefault();
                    this.showKeyboardShortcutsHelp();
                    break;
            }
        }

        // Escape键处理
        if (key === 'escape') {
            this.handleEscapeKey(event);
        }
    }

    /**
     * 处理导航键
     */
    handleNavigationKeys(event) {
        const key = event.key;
        const target = event.target;

        switch (key) {
            case 'Tab':
                this.handleTabKey(event);
                break;
            case 'Enter':
                this.handleEnterKey(event);
                break;
            case ' ':
                this.handleSpaceKey(event);
                break;
            case 'ArrowUp':
            case 'ArrowDown':
            case 'ArrowLeft':
            case 'ArrowRight':
                this.handleArrowKeys(event);
                break;
            case 'Home':
            case 'End':
                this.handleHomeEndKeys(event);
                break;
            case 'PageUp':
            case 'PageDown':
                this.handlePageKeys(event);
                break;
        }
    }

    /**
     * 处理Tab键
     */
    handleTabKey(event) {
        // 记录Tab方向
        this.tabDirection = event.shiftKey ? 'backward' : 'forward';

        // 自定义Tab逻辑（如果有活动模态框或焦点陷阱）
        if (this.modalStack.length > 0) {
            this.handleModalTabNavigation(event);
        }

        // 更新焦点指示器位置
        setTimeout(() => {
            this.updateFocusIndicator();
        }, 0);
    }

    /**
     * 处理Enter键
     */
    handleEnterKey(event) {
        const target = event.target;

        // 如果是自定义角色元素，模拟点击
        if (target.matches('[role="button"], [role="link"], [role="menuitem"]') && !target.matches('button, a')) {
            event.preventDefault();
            target.click();
            this.announce(`已激活 ${this.getAccessibleName(target)}`);
        }

        // 处理展开/折叠
        if (target.hasAttribute('aria-expanded')) {
            const isExpanded = target.getAttribute('aria-expanded') === 'true';
            this.toggleAriaExpanded(target, !isExpanded);
        }
    }

    /**
     * 处理空格键
     */
    handleSpaceKey(event) {
        const target = event.target;

        // 对于非输入元素，空格键模拟点击
        if (target.matches('[role="button"], [role="menuitemcheckbox"], [role="menuitemradio"]') &&
            !target.matches('input, textarea')) {
            event.preventDefault();
            target.click();
        }

        // 对于复选框角色
        if (target.matches('[role="menuitemcheckbox"]')) {
            const isChecked = target.getAttribute('aria-checked') === 'true';
            this.toggleAriaChecked(target, !isChecked);
        }
    }

    /**
     * 处理方向键
     */
    handleArrowKeys(event) {
        const target = event.target;
        const key = event.key;

        // 处理菜单导航
        if (target.matches('[role="menuitem"], [role="menuitemradio"], [role="menuitemcheckbox"]')) {
            this.handleMenuNavigation(event);
        }

        // 处理标签页导航
        if (target.matches('[role="tab"]')) {
            this.handleTabNavigation(event);
        }

        // 处理列表框导航
        if (target.matches('[role="option"], [role="treeitem"]')) {
            this.handleListNavigation(event);
        }

        // 处理网格导航
        if (target.matches('[role="gridcell"]')) {
            this.handleGridNavigation(event);
        }
    }

    /**
     * 处理Home/End键
     */
    handleHomeEndKeys(event) {
        const target = event.target;
        const key = event.key;

        // 在列表中跳转到开头或结尾
        if (target.matches('[role="option"], [role="treeitem"], [role="menuitem"]')) {
            const container = target.closest('[role="listbox"], [role="tree"], [role="menu"]');
            if (container) {
                event.preventDefault();
                const items = container.querySelectorAll('[role="option"], [role="treeitem"], [role="menuitem"]');
                const targetIndex = key === 'Home' ? 0 : items.length - 1;
                items[targetIndex].focus();
            }
        }
    }

    /**
     * 处理PageUp/PageDown键
     */
    handlePageKeys(event) {
        const target = event.target;

        // 在长列表中快速导航
        if (target.matches('[role="listbox"], [role="tree"]')) {
            event.preventDefault();
            const items = target.querySelectorAll('[role="option"], [role="treeitem"]');
            const currentIndex = Array.from(items).indexOf(target.activeElement || target);
            const jumpSize = 10; // 每次跳转10个项目

            let newIndex;
            if (event.key === 'PageUp') {
                newIndex = Math.max(0, currentIndex - jumpSize);
            } else {
                newIndex = Math.min(items.length - 1, currentIndex + jumpSize);
            }

            items[newIndex].focus();
        }
    }

    /**
     * 处理Escape键
     */
    handleEscapeKey(event) {
        // 关闭模态框
        if (this.modalStack.length > 0) {
            this.closeModal();
            event.preventDefault();
            return;
        }

        // 退出下拉菜单
        const openMenu = document.querySelector('[role="menu"][aria-expanded="true"]');
        if (openMenu) {
            this.closeMenu(openMenu);
            event.preventDefault();
            return;
        }

        // 清除焦点指示器
        this.hideFocusIndicator();
    }

    /**
     * 处理菜单导航
     */
    handleMenuNavigation(event) {
        const target = event.target;
        const key = event.key;
        const container = target.closest('[role="menu"]');
        const items = Array.from(container.querySelectorAll('[role="menuitem"], [role="menuitemradio"], [role="menuitemcheckbox"]'));
        const currentIndex = items.indexOf(target);

        let nextIndex;

        switch (key) {
            case 'ArrowDown':
                event.preventDefault();
                nextIndex = (currentIndex + 1) % items.length;
                items[nextIndex].focus();
                break;
            case 'ArrowUp':
                event.preventDefault();
                nextIndex = currentIndex === 0 ? items.length - 1 : currentIndex - 1;
                items[nextIndex].focus();
                break;
            case 'Home':
                event.preventDefault();
                items[0].focus();
                break;
            case 'End':
                event.preventDefault();
                items[items.length - 1].focus();
                break;
        }
    }

    /**
     * 处理标签页导航
     */
    handleTabNavigation(event) {
        const target = event.target;
        const key = event.key;
        const container = target.closest('[role="tablist"]');
        const tabs = Array.from(container.querySelectorAll('[role="tab"]'));
        const currentIndex = tabs.indexOf(target);

        let nextIndex;

        switch (key) {
            case 'ArrowRight':
            case 'ArrowDown':
                event.preventDefault();
                nextIndex = (currentIndex + 1) % tabs.length;
                tabs[nextIndex].focus();
                tabs[nextIndex].click();
                break;
            case 'ArrowLeft':
            case 'ArrowUp':
                event.preventDefault();
                nextIndex = currentIndex === 0 ? tabs.length - 1 : currentIndex - 1;
                tabs[nextIndex].focus();
                tabs[nextIndex].click();
                break;
            case 'Home':
                event.preventDefault();
                tabs[0].focus();
                tabs[0].click();
                break;
            case 'End':
                event.preventDefault();
                tabs[tabs.length - 1].focus();
                tabs[tabs.length - 1].click();
                break;
        }
    }

    /**
     * 处理列表导航
     */
    handleListNavigation(event) {
        const target = event.target;
        const key = event.key;
        const container = target.closest('[role="listbox"], [role="tree"]');
        const items = Array.from(container.querySelectorAll('[role="option"], [role="treeitem"]'));
        const currentIndex = items.indexOf(target);

        let nextIndex;

        switch (key) {
            case 'ArrowDown':
                event.preventDefault();
                nextIndex = Math.min(currentIndex + 1, items.length - 1);
                items[nextIndex].focus();
                if (key === 'ArrowDown') items[nextIndex].setAttribute('aria-selected', 'true');
                break;
            case 'ArrowUp':
                event.preventDefault();
                nextIndex = Math.max(currentIndex - 1, 0);
                items[nextIndex].focus();
                if (key === 'ArrowUp') items[nextIndex].setAttribute('aria-selected', 'true');
                break;
        }
    }

    /**
     * 处理网格导航
     */
    handleGridNavigation(event) {
        const target = event.target;
        const key = event.key;
        const container = target.closest('[role="grid"]');
        const rows = Array.from(container.querySelectorAll('[role="row"]'));
        const currentRow = target.closest('[role="row"]');
        const currentRowIndex = rows.indexOf(currentRow);
        const cells = Array.from(currentRow.querySelectorAll('[role="gridcell"]'));
        const currentCellIndex = cells.indexOf(target);

        switch (key) {
            case 'ArrowRight':
                event.preventDefault();
                if (currentCellIndex < cells.length - 1) {
                    cells[currentCellIndex + 1].focus();
                }
                break;
            case 'ArrowLeft':
                event.preventDefault();
                if (currentCellIndex > 0) {
                    cells[currentCellIndex - 1].focus();
                }
                break;
            case 'ArrowDown':
                event.preventDefault();
                if (currentRowIndex < rows.length - 1) {
                    const nextRow = rows[currentRowIndex + 1];
                    const nextCells = nextRow.querySelectorAll('[role="gridcell"]');
                    if (nextCells[currentCellIndex]) {
                        nextCells[currentCellIndex].focus();
                    }
                }
                break;
            case 'ArrowUp':
                event.preventDefault();
                if (currentRowIndex > 0) {
                    const prevRow = rows[currentRowIndex - 1];
                    const prevCells = prevRow.querySelectorAll('[role="gridcell"]');
                    if (prevCells[currentCellIndex]) {
                        prevCells[currentCellIndex].focus();
                    }
                }
                break;
        }
    }

    /**
     * 焦点事件处理
     */
    handleFocus(event) {
        const target = event.target;
        this.currentFocusElement = target;

        // 更新焦点指示器
        if (this.options.enableVisualFocus) {
            this.updateFocusIndicator();
        }

        // 添加键盘导航样式
        if (document.body.classList.contains('keyboard-navigation')) {
            target.classList.add('keyboard-focus');
        }

        // 宣布焦点元素（对于重要元素）
        this.announceFocusElement(target);

        // 处理循环焦点组
        this.handleRovingTabindexFocus(target);
    }

    handleBlur(event) {
        const target = event.target;
        target.classList.remove('keyboard-focus');

        // 延迟隐藏焦点指示器
        setTimeout(() => {
            if (document.activeElement === document.body) {
                this.hideFocusIndicator();
            }
        }, 100);
    }

    /**
     * 鼠标事件处理
     */
    handleMouseDown() {
        // 移除键盘导航样式
        document.body.classList.remove('keyboard-navigation');
        this.hideFocusIndicator();

        // 清除焦点可见性超时
        if (this.focusVisibleTimeout) {
            clearTimeout(this.focusVisibleTimeout);
        }
    }

    handleMouseMove() {
        // 鼠标移动时移除键盘导航样式
        if (document.body.classList.contains('keyboard-navigation')) {
            document.body.classList.remove('keyboard-navigation');
            this.hideFocusIndicator();
        }
    }

    /**
     * 更新焦点指示器
     */
    updateFocusIndicator() {
        if (!this.focusIndicator || !this.currentFocusElement) {
            return;
        }

        const rect = this.currentFocusElement.getBoundingClientRect();
        const scrollX = window.pageXOffset || document.documentElement.scrollLeft;
        const scrollY = window.pageYOffset || document.documentElement.scrollTop;

        this.focusIndicator.style.left = `${rect.left + scrollX - 2}px`;
        this.focusIndicator.style.top = `${rect.top + scrollY - 2}px`;
        this.focusIndicator.style.width = `${rect.width + 4}px`;
        this.focusIndicator.style.height = `${rect.height + 4}px`;
        this.focusIndicator.classList.add('active');

        // 更新指示器样式以匹配元素
        this.updateIndicatorStyle();
    }

    updateIndicatorStyle() {
        if (!this.focusIndicator || !this.currentFocusElement) {
            return;
        }

        const computedStyle = window.getComputedStyle(this.currentFocusElement);
        const borderRadius = computedStyle.borderRadius;

        this.focusIndicator.style.borderRadius = borderRadius;
    }

    /**
     * 隐藏焦点指示器
     */
    hideFocusIndicator() {
        if (this.focusIndicator) {
            this.focusIndicator.classList.remove('active');
        }
    }

    /**
     * 增强可聚焦元素
     */
    enhanceFocusableElements() {
        const focusableSelectors = [
            'a[href]',
            'button:not([disabled])',
            'input:not([disabled])',
            'select:not([disabled])',
            'textarea:not([disabled])',
            '[tabindex]:not([tabindex="-1"])',
            '[contenteditable="true"]',
            '[role="button"]:not([aria-disabled="true"])',
            '[role="link"]',
            '[role="menuitem"]',
            '[role="option"]',
            '[role="tab"]'
        ].join(', ');

        document.querySelectorAll(focusableSelectors).forEach(element => {
            this.enhanceFocusableElement(element);
        });
    }

    enhanceFocusableElement(element) {
        // 确保有正确的tabindex
        if (!element.hasAttribute('tabindex') && !element.matches('a, button, input, select, textarea')) {
            element.setAttribute('tabindex', '0');
        }

        // 添加焦点样式类
        element.classList.add('focusable-element');

        // 添加键盘事件支持
        if (element.matches('[role="button"], [role="link"], [role="menuitem"]') &&
            !element.matches('button, a')) {
            element.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    element.click();
                }
            });
        }
    }

    /**
     * 初始化键盘快捷键
     */
    initKeyboardShortcuts() {
        const shortcuts = this.options.shortcuts;

        Object.entries(shortcuts).forEach(([key, config]) => {
            this.keyboardShortcuts.set(key, config);
        });

        console.log('⌨️ 键盘快捷键已初始化:', this.keyboardShortcuts);
    }

    handleKeyboardShortcuts(event) {
        const key = this.getShortcutKey(event);

        if (this.keyboardShortcuts.has(key)) {
            const shortcut = this.keyboardShortcuts.get(key);

            if (shortcut.condition ? shortcut.condition() : true) {
                event.preventDefault();
                shortcut.handler(event);
                this.announce(`快捷键: ${shortcut.description}`);
            }
        }
    }

    getShortcutKey(event) {
        const parts = [];
        if (event.ctrlKey) parts.push('ctrl');
        if (event.altKey) parts.push('alt');
        if (event.shiftKey) parts.push('shift');
        if (event.metaKey) parts.push('meta');
        parts.push(event.key.toLowerCase());

        return parts.join('+');
    }

    /**
     * 默认快捷键配置
     */
    getDefaultShortcuts() {
        return {
            'ctrl+/': {
                description: '显示键盘快捷键帮助',
                handler: () => this.showKeyboardShortcutsHelp()
            },
            'alt+h': {
                description: '显示帮助信息',
                handler: () => this.showHelpDialog()
            },
            'alt+a': {
                description: '运行可访问性检查',
                handler: () => this.runAccessibilityAudit()
            },
            'alt+k': {
                description: '显示键盘导航指南',
                handler: () => this.showKeyboardNavigationGuide()
            }
        };
    }

    /**
     * 初始化循环焦点
     */
    initRovingTabindex() {
        // 查找工具栏、菜单栏等需要循环焦点的元素
        const rovingSelectors = [
            '[role="toolbar"]',
            '[role="menubar"]',
            '[role="tablist"]',
            '.roving-tabindex'
        ].join(', ');

        document.querySelectorAll(rovingSelectors).forEach(container => {
            this.initRovingTabindexGroup(container);
        });
    }

    initRovingTabindexGroup(container) {
        const items = container.querySelectorAll('[role^="menuitem"], [role="tab"], button');
        if (items.length === 0) return;

        // 初始化tabindex
        items.forEach((item, index) => {
            item.setAttribute('tabindex', index === 0 ? '0' : '-1');
        });

        // 添加键盘事件监听
        container.addEventListener('keydown', (e) => {
            this.handleRovingTabindexKeydown(e, items);
        });

        // 记录组
        this.rovingTabindexGroups.set(container, {
            items: Array.from(items),
            currentIndex: 0
        });
    }

    handleRovingTabindexKeydown(event, items) {
        const key = event.key;
        const container = event.currentTarget;
        const group = this.rovingTabindexGroups.get(container);

        if (!group) return;

        let newIndex = group.currentIndex;

        switch (key) {
            case 'ArrowRight':
            case 'ArrowDown':
                event.preventDefault();
                newIndex = (group.currentIndex + 1) % items.length;
                break;
            case 'ArrowLeft':
            case 'ArrowUp':
                event.preventDefault();
                newIndex = group.currentIndex === 0 ? items.length - 1 : group.currentIndex - 1;
                break;
            case 'Home':
                event.preventDefault();
                newIndex = 0;
                break;
            case 'End':
                event.preventDefault();
                newIndex = items.length - 1;
                break;
            default:
                return;
        }

        // 更新tabindex
        items[group.currentIndex].setAttribute('tabindex', '-1');
        items[newIndex].setAttribute('tabindex', '0');
        items[newIndex].focus();

        group.currentIndex = newIndex;
    }

    handleRovingTabindexFocus(target) {
        const group = Array.from(this.rovingTabindexGroups.values()).find(g => g.items.includes(target));
        if (group) {
            const index = group.items.indexOf(target);
            if (index !== -1 && index !== group.currentIndex) {
                // 更新焦点
                group.items[group.currentIndex].setAttribute('tabindex', '-1');
                target.setAttribute('tabindex', '0');
                group.currentIndex = index;
            }
        }
    }

    /**
     * 模态框处理
     */
    observeModals() {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        if (node.matches('[role="dialog"], .modal, .dialog')) {
                            this.openModal(node);
                        }
                    }
                });

                mutation.removedNodes.forEach((node) => {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        if (node.matches('[role="dialog"], .modal, .dialog')) {
                            this.closeModal(node);
                        }
                    }
                });
            });
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    openModal(modal) {
        // 记录之前的焦点
        this.previousFocus = document.activeElement;

        // 添加到模态框栈
        this.modalStack.push(modal);

        // 设置模态框属性
        modal.setAttribute('aria-modal', 'true');

        // 聚焦到第一个可聚焦元素
        const focusableElements = modal.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );

        if (focusableElements.length > 0) {
            focusableElements[0].focus();
        }

        this.announce('对话框已打开');
    }

    closeModal(modal) {
        const index = this.modalStack.indexOf(modal);
        if (index > -1) {
            this.modalStack.splice(index, 1);
        }

        modal.removeAttribute('aria-modal');

        // 恢复焦点
        if (this.previousFocus && this.previousFocus.focus) {
            this.previousFocus.focus();
        }

        this.announce('对话框已关闭');
    }

    handleModalNavigation(event) {
        if (this.modalStack.length === 0) return;

        const modal = this.modalStack[this.modalStack.length - 1];
        const focusableElements = modal.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );

        if (focusableElements.length === 0) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (event.key === 'Tab') {
            if (event.shiftKey) {
                // Shift + Tab
                if (document.activeElement === firstElement) {
                    event.preventDefault();
                    lastElement.focus();
                }
            } else {
                // Tab
                if (document.activeElement === lastElement) {
                    event.preventDefault();
                    firstElement.focus();
                }
            }
        }
    }

    /**
     * 动态内容监听
     */
    observeDynamicContent() {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        // 增强新添加的可聚焦元素
                        this.enhanceNewFocusableElements(node);
                    }
                });
            });
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    enhanceNewFocusableElements(node) {
        const focusableSelectors = [
            'a[href]',
            'button:not([disabled])',
            'input:not([disabled])',
            'select:not([disabled])',
            'textarea:not([disabled])',
            '[tabindex]:not([tabindex="-1"])',
            '[role="button"]',
            '[role="link"]'
        ].join(', ');

        if (node.matches) {
            if (node.matches(focusableSelectors)) {
                this.enhanceFocusableElement(node);
            }

            // 递归处理子元素
            node.querySelectorAll(focusableSelectors).forEach(element => {
                this.enhanceFocusableElement(element);
            });
        }
    }

    /**
     * 工具方法
     */
    navigateToElement(selector, description) {
        const element = document.querySelector(selector);
        if (element) {
            element.focus();
            this.announce(`已跳转到${description}`);
        } else {
            this.announce(`未找到${description}`);
        }
    }

    getAccessibleName(element) {
        return (
            element.getAttribute('aria-label') ||
            element.getAttribute('title') ||
            element.textContent.trim() ||
            element.tagName.toLowerCase()
        );
    }

    announceFocusElement(element) {
        const role = element.getAttribute('role');
        const name = this.getAccessibleName(element);
        const state = this.getElementAriaState(element);

        let announcement = name;

        if (role) {
            announcement = `${role}: ${name}`;
        }

        if (state) {
            announcement += ` (${state})`;
        }

        // 只对重要元素进行宣布
        if (role || element.matches('[aria-live], [aria-label]')) {
            this.announce(announcement, 'polite', true);
        }
    }

    getElementAriaState(element) {
        const states = [];

        if (element.hasAttribute('aria-expanded')) {
            const expanded = element.getAttribute('aria-expanded') === 'true';
            states.push(expanded ? '已展开' : '已收起');
        }

        if (element.hasAttribute('aria-selected')) {
            const selected = element.getAttribute('aria-selected') === 'true';
            states.push(selected ? '已选中' : '未选中');
        }

        if (element.hasAttribute('aria-checked')) {
            const checked = element.getAttribute('aria-checked');
            if (checked === 'true') states.push('已选中');
            else if (checked === 'false') states.push('未选中');
            else if (checked === 'mixed') states.push('部分选中');
        }

        if (element.hasAttribute('aria-disabled')) {
            const disabled = element.getAttribute('aria-disabled') === 'true';
            if (disabled) states.push('已禁用');
        }

        return states.join(', ');
    }

    toggleAriaExpanded(element, expanded) {
        element.setAttribute('aria-expanded', expanded.toString());
        this.announce(`${this.getAccessibleName(element)}: ${expanded ? '已展开' : '已收起'}`);
    }

    toggleAriaChecked(element, checked) {
        element.setAttribute('aria-checked', checked.toString());
        this.announce(`${this.getAccessibleName(element)}: ${checked ? '已选中' : '未选中'}`);
    }

    recordFocusHistory() {
        if (this.currentFocusElement) {
            this.focusHistory.push({
                element: this.currentFocusElement,
                timestamp: Date.now()
            });

            // 限制历史记录长度
            if (this.focusHistory.length > 50) {
                this.focusHistory = this.focusHistory.slice(-25);
            }
        }
    }

    detectNavigationMethod() {
        let usingKeyboard = false;

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
                usingKeyboard = true;
                document.body.classList.add('keyboard-navigation');
            }
        });

        document.addEventListener('mousedown', () => {
            usingKeyboard = false;
            document.body.classList.remove('keyboard-navigation');
        });

        // 检测是否使用屏幕阅读器
        this.usingScreenReader = this.detectScreenReader();
    }

    detectScreenReader() {
        return (
            window.speechSynthesis ||
            window.navigator.userAgent.includes('NVDA') ||
            window.navigator.userAgent.includes('JAWS') ||
            window.navigator.userAgent.includes('VoiceOver')
        );
    }

    announce(message, priority = 'polite', clearPrevious = false) {
        if (window.ariaManager) {
            window.ariaManager.announce(message, priority, clearPrevious);
        } else {
            console.log(`📢 键盘导航公告: ${message}`);
        }
    }

    /**
     * 帮助和指南方法
     */
    showKeyboardShortcutsHelp() {
        const shortcuts = Array.from(this.keyboardShortcuts.entries())
            .map(([key, config]) => `<tr><td><kbd>${key}</kbd></td><td>${config.description}</td></tr>`)
            .join('');

        const helpContent = `
            <div class="keyboard-shortcuts-help">
                <h2>键盘快捷键</h2>
                <table>
                    <thead><tr><th>快捷键</th><th>功能</th></tr></thead>
                    <tbody>${shortcuts}</tbody>
                </table>
                <h3>导航快捷键</h3>
                <ul>
                    <li><kbd>Tab</kbd> - 移动到下一个可聚焦元素</li>
                    <li><kbd>Shift + Tab</kbd> - 移动到上一个可聚焦元素</li>
                    <li><kbd>Enter</kbd> - 激活按钮或链接</li>
                    <li><kbd>Space</kbd> - 激活按钮或复选框</li>
                    <li><kbd>Escape</kbd> - 关闭对话框或菜单</li>
                    <li><kbd>方向键</kbd> - 在菜单、列表、表格中导航</li>
                    <li><kbd>Alt + M</kbd> - 跳转到主内容</li>
                    <li><kbd>Alt + N</kbd> - 跳转到导航</li>
                    <li><kbd>Alt + S</kbd> - 跳转到搜索</li>
                    <li><kbd>Alt + H</kbd> - 显示帮助</li>
                </ul>
            </div>
        `;

        this.showHelpDialog(helpContent, '键盘快捷键帮助');
    }

    showKeyboardNavigationGuide() {
        const guideContent = `
            <div class="keyboard-navigation-guide">
                <h2>键盘导航指南</h2>
                <p>本应用支持完整的键盘导航，让您无需鼠标即可访问所有功能。</p>

                <h3>基本导航</h3>
                <ul>
                    <li>使用 <kbd>Tab</kbd> 键在页面元素间移动</li>
                    <li>使用 <kbd>Shift + Tab</kbd> 向后移动</li>
                    <li>当前聚焦的元素会有明显的视觉指示</li>
                </ul>

                <h3>交互操作</h3>
                <ul>
                    <li>按 <kbd>Enter</kbd> 或 <kbd>Space</kbd> 激活按钮和链接</li>
                    <li>使用 <kbd>方向键</kbd> 在菜单和列表中导航</li>
                    <li>按 <kbd>Escape</kbd> 关闭对话框和菜单</li>
                </ul>

                <h3>快速跳转</h3>
                <ul>
                    <li><kbd>Alt + M</kbd> 快速跳转到主内容区域</li>
                    <li><kbd>Alt + N</kbd> 快速跳转到导航菜单</li>
                    <li><kbd>Alt + S</kbd> 快速跳转到搜索框</li>
                    <li><kbd>Alt + F</kbd> 快速跳转到页脚</li>
                </ul>

                <h3>辅助功能</h3>
                <ul>
                    <li><kbd>Ctrl + /</kbd> 显示此快捷键帮助</li>
                    <li><kbd>Alt + A</kbd> 运行可访问性检查</li>
                    <li><kbd>Alt + H</kbd> 显示帮助信息</li>
                </ul>
            </div>
        `;

        this.showHelpDialog(guideContent, '键盘导航指南');
    }

    showHelpDialog(content = null, title = '帮助') {
        if (!content) {
            content = `
                <div class="help-content">
                    <h2>帮助信息</h2>
                    <p>如需帮助，请查看以下资源：</p>
                    <ul>
                        <li><a href="#" onclick="window.keyboardNavigation.showKeyboardShortcutsHelp(); return false;">键盘快捷键</a></li>
                        <li><a href="#" onclick="window.keyboardNavigation.showKeyboardNavigationGuide(); return false;">导航指南</a></li>
                        <li><a href="/docs">完整文档</a></li>
                        <li><a href="/contact">联系我们</a></li>
                    </ul>
                </div>
            `;
        }

        // 创建帮助对话框
        const dialog = document.createElement('div');
        dialog.className = 'help-dialog';
        dialog.setAttribute('role', 'dialog');
        dialog.setAttribute('aria-modal', 'true');
        dialog.setAttribute('aria-labelledby', 'help-dialog-title');
        dialog.innerHTML = `
            <div class="help-dialog-content">
                <h2 id="help-dialog-title">${title}</h2>
                <button class="help-dialog-close" aria-label="关闭帮助" onclick="this.closest('.help-dialog').remove()">×</button>
                <div class="help-dialog-body">
                    ${content}
                </div>
            </div>
        `;

        // 添加样式
        const style = document.createElement('style');
        style.textContent = `
            .help-dialog {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0,0,0,0.5);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 10000;
            }
            .help-dialog-content {
                background: white;
                border-radius: 8px;
                max-width: 600px;
                max-height: 80vh;
                overflow-y: auto;
                padding: 24px;
                position: relative;
            }
            .help-dialog-close {
                position: absolute;
                top: 16px;
                right: 16px;
                background: none;
                border: none;
                font-size: 24px;
                cursor: pointer;
                padding: 4px;
            }
            .help-dialog h2 {
                margin-top: 0;
                color: #333;
            }
            .help-dialog table {
                width: 100%;
                border-collapse: collapse;
                margin: 16px 0;
            }
            .help-dialog th, .help-dialog td {
                border: 1px solid #ddd;
                padding: 8px;
                text-align: left;
            }
            .help-dialog th {
                background: #f5f5f5;
            }
            .help-dialog kbd {
                background: #f4f4f4;
                border: 1px solid #ccc;
                border-radius: 3px;
                padding: 2px 4px;
                font-family: monospace;
            }
        `;

        if (!document.querySelector('#help-dialog-styles')) {
            style.id = 'help-dialog-styles';
            document.head.appendChild(style);
        }

        document.body.appendChild(dialog);

        // 聚焦到关闭按钮
        dialog.querySelector('.help-dialog-close').focus();

        // 添加键盘关闭
        dialog.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                dialog.remove();
            }
        });

        // 点击背景关闭
        dialog.addEventListener('click', (e) => {
            if (e.target === dialog) {
                dialog.remove();
            }
        });
    }

    runAccessibilityAudit() {
        if (window.ariaManager) {
            const report = window.ariaManager.runAccessibilityAudit();
            this.showAccessibilityReport(report);
        } else {
            this.announce('可访问性检查功能不可用');
        }
    }

    showAccessibilityReport(report) {
        const reportContent = `
            <div class="accessibility-report">
                <h2>可访问性检查报告</h2>
                <div class="report-summary">
                    <p>检查时间: ${new Date(report.timestamp).toLocaleString()}</p>
                    <p>发现问题: ${report.totalIssues} 个 (错误: ${report.errors}, 警告: ${report.warnings})</p>
                </div>

                ${report.errors > 0 ? `
                    <h3>错误 (${report.errors})</h3>
                    <ul class="issues-list">
                        ${report.issues.filter(i => i.severity === 'error').map(issue =>
                            `<li><strong>${issue.message}</strong> - ${issue.element.tagName.toLowerCase()}${issue.element.id ? '#' + issue.element.id : ''}</li>`
                        ).join('')}
                    </ul>
                ` : '<p class="success">✅ 未发现错误</p>'}

                ${report.warnings > 0 ? `
                    <h3>警告 (${report.warnings})</h3>
                    <ul class="issues-list">
                        ${report.issues.filter(i => i.severity === 'warning').map(issue =>
                            `<li>${issue.message} - ${issue.element.tagName.toLowerCase()}${issue.element.id ? '#' + issue.element.id : ''}</li>`
                        ).join('')}
                    </ul>
                ` : ''}

                <h3>统计信息</h3>
                <ul>
                    <li>具有ARIA属性的元素: ${report.stats.elementsWithAria}</li>
                    <li>增强的按钮: ${report.stats.buttonsEnhanced}</li>
                    <li>具有alt属性的图像: ${report.stats.imagesWithAlt}</li>
                    <li>增强的表单元素: ${report.stats.formElementsEnhanced}</li>
                    <li>可聚焦元素总数: ${report.stats.focusableElements}</li>
                </ul>
            </div>
        `;

        this.showHelpDialog(reportContent, '可访问性检查报告');
    }

    /**
     * 公共API
     */
    getNavigationStats() {
        return {
            currentFocusElement: this.currentFocusElement?.tagName || null,
            focusHistoryLength: this.focusHistory.length,
            modalStackLength: this.modalStack.length,
            rovingGroups: this.rovingTabindexGroups.size,
            keyboardShortcuts: this.keyboardShortcuts.size,
            usingKeyboardNavigation: document.body.classList.contains('keyboard-navigation'),
            usingScreenReader: this.usingScreenReader
        };
    }

    enableKeyboardNavigation() {
        document.body.classList.add('keyboard-navigation');
    }

    disableKeyboardNavigation() {
        document.body.classList.remove('keyboard-navigation');
        this.hideFocusIndicator();
    }

    focusFirstElement(container = document) {
        const focusableElement = container.querySelector(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusableElement) {
            focusableElement.focus();
            return true;
        }
        return false;
    }

    focusLastElement(container = document) {
        const focusableElements = container.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusableElements.length > 0) {
            focusableElements[focusableElements.length - 1].focus();
            return true;
        }
        return false;
    }
}

// 创建全局实例
const keyboardNavigationManager = new KeyboardNavigationManager({
    enableVisualFocus: true,
    enableSkipLinks: true,
    enableFocusTraps: true,
    enableKeyboardShortcuts: true,
    enableRovingTabindex: true
});

// 导出供其他模块使用
if (typeof module !== 'undefined' && module.exports) {
    module.exports = KeyboardNavigationManager;
}

// 全局暴露
window.KeyboardNavigationManager = KeyboardNavigationManager;
window.keyboardNavigationManager = keyboardNavigationManager;